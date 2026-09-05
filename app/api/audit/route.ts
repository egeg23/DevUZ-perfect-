/**
 * Бесплатный аудит сайта — магнит для входящих обращений.
 *
 * Отдаёт не «оценку по стобалльной шкале» ради оценки, а список конкретных
 * находок на языке владельца бизнеса. Смысл в том, что это работа, сделанная
 * до того, как что-то попросили: человек получает пользу, ещё ничего не
 * заплатив и никому не написав.
 *
 * Отдельно про отсутствующий сайт. Если домен не резолвится или не отвечает,
 * это не сбой аудита, а самая сильная находка из возможных: перед нами бизнес
 * без сайта вообще. Такой ответ и возвращается — отчётом, а не ошибкой.
 */
import { NextResponse } from "next/server";

import { analyze, type AuditReport } from "@/lib/audit/checks";
import { probe } from "@/lib/audit/fetch";
import { BlockedAddress, normalizeUrl } from "@/lib/audit/guard";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";

// Проверка ходит в сеть и держит соединение до восьми секунд — на Edge такое
// не живёт, нужен Node.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Лимит жёстче, чем у остальных ручек: каждый вызов заставляет наш сервер
 * сходить на чужой хост. Без потолка аудитор превращается в бесплатный
 * сканер чужих сайтов от нашего имени.
 */
const LIMIT = { limit: 5, windowMs: 60_000 };

function unreachable(url: string, why: string): AuditReport {
  return {
    url,
    score: 0,
    findings: [
      {
        code: "unreachable",
        severity: "critical",
        title: "Сайт не отвечает",
        impact:
          `Мы не смогли открыть страницу (${why}). Для клиента это выглядит ровно так же: он вводит адрес и не попадает никуда. Если сайта пока нет — это и есть точка роста, а не проблема.`,
      },
    ],
    facts: { https: false, ttfbMs: 0, platform: null, isShop: false, certDaysLeft: null },
  };
}

export async function POST(request: Request) {
  const gate = rateLimit(`audit:${clientIp(request)}`, LIMIT);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "too_many", retryAfter: gate.retryAfter },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } },
    );
  }

  let raw: unknown;
  try {
    raw = (await request.json())?.url;
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }
  if (typeof raw !== "string" || raw.length > 300) {
    return NextResponse.json({ error: "bad_url" }, { status: 400 });
  }

  // Разбираем адрес до всего остального: понятная ошибка формы полезнее,
  // чем отчёт с нулём по несуществующему домену.
  let target: string;
  try {
    target = normalizeUrl(raw).href;
  } catch (error) {
    const reason = error instanceof BlockedAddress ? error.reason : "shape";
    return NextResponse.json({ error: "bad_url", reason }, { status: 400 });
  }

  try {
    const page = await probe(target);
    return NextResponse.json(analyze(page));
  } catch (error) {
    // Адрес, уводящий во внутреннюю сеть, — это попытка, а не опечатка.
    // Отвечаем отказом и не рассказываем, что именно там нашлось.
    if (error instanceof BlockedAddress) {
      console.warn("audit blocked:", error.reason, error.detail);
      return NextResponse.json({ error: "blocked" }, { status: 400 });
    }
    const code = (error as NodeJS.ErrnoException)?.code ?? "";
    const why =
      code === "ENOTFOUND" ? "домен не найден"
      : code === "ECONNREFUSED" ? "сервер отклонил соединение"
      : code === "ETIMEDOUT" || /timeout/i.test(String(error)) ? "не дождались ответа"
      : "нет соединения";
    return NextResponse.json(unreachable(target, why));
  }
}
