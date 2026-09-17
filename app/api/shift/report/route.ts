import { SHIFT_TITLE } from "@/lib/admin/shift-reports";
import { serviceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Голос плановой смены, которому не нужны инструменты.
 *
 * Плановая сессия стартует без единого внешнего инструмента: у неё есть
 * `Bash`, `Read`, `Write` и `Grep` — и всё. Ни `execute_sql`, ни GitHub, ни
 * `add_repo`. Правило «в конце смены напиши строку в shift_reports через
 * execute_sql» выполнить нечем, и провал смены неотличим от тишины: за это
 * и заплатили тремя пустыми днями разборов.
 *
 * Поэтому канал, для которого достаточно `curl`. Он есть в любой оболочке,
 * и его нельзя отключить конфигурацией рутины:
 *
 *     curl -sS -X POST https://devuz.studio/api/shift/report \
 *       -H "x-devuz-shift: СЕКРЕТ" -H "content-type: application/json" \
 *       -d '{"shift":"razbor","body":"Вышло 2 из 3: …"}'
 *
 * Дальше строка живёт как обычный отчёт смены: свип доносит её владельцу в
 * Telegram и гасит сторожа молчания на сегодня.
 *
 * Защита — общий секрет в заголовке, как у свипа, и по той же причине:
 * адрес открыт наружу, а строка отсюда будит владельца. Секрета нет в
 * окружении — отвечаем отказом всем подряд, включая своих. Обратный порядок
 * («нет секрета — пускаем всех») удобен ровно до того дня, когда переменная
 * не доедет до контейнера.
 */
const MAX_BODY = 2000;

export async function POST(request: Request) {
  const expected = process.env.SHIFT_REPORT_SECRET;
  const provided = request.headers.get("x-devuz-shift");
  if (!expected || provided !== expected) {
    return new Response("forbidden", { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, why: "тело не разобралось как JSON" }, { status: 400 });
  }

  const input = (payload ?? {}) as { shift?: unknown; body?: unknown };
  const shift = String(input.shift ?? "").trim();
  const body = String(input.body ?? "").trim().slice(0, MAX_BODY);

  // Вид смены — из словаря, а не любой присланный. Иначе опечатка в
  // промпте («razbory») заводит смену, о которой сторож не знает: строка
  // придёт, а тревога всё равно прозвенит.
  if (!SHIFT_TITLE[shift]) {
    return Response.json(
      { ok: false, why: `неизвестная смена «${shift}»`, known: Object.keys(SHIFT_TITLE) },
      { status: 400 },
    );
  }
  if (!body) {
    return Response.json({ ok: false, why: "пустой отчёт" }, { status: 400 });
  }

  const db = serviceClient();
  if (!db) return Response.json({ ok: false, why: "база недоступна" }, { status: 503 });

  const { error } = await db.from("shift_reports").insert({ shift, body });
  if (error) {
    console.error("отчёт смены:", error.message);
    return Response.json({ ok: false, why: "не записалось" }, { status: 500 });
  }

  // Отвечаем словами, а не пустым 200: смена читает этот ответ и по нему
  // решает, отчиталась она или нет.
  return Response.json({ ok: true, shift, chars: body.length });
}
