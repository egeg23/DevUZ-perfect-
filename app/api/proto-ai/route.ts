import { looksLikeAccessToken } from "@/lib/store/access";
import { PROTO_AI_LIMITS, askProtoAi, parseProtoAiRequest, protoAiAllowed } from "@/lib/proto/ai";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ИИ-инструменты на прототипе (lib/proto/ai): подбор блогеров по брифу,
 * бриф-мастер, UGC-генератор. Страница прототипа живёт на нашем же домене
 * (/proto/<токен>) и зовёт сюда без ключа — ключ только на сервере.
 *
 * На любой отказ — 200 с `fallback: true`, а не ошибка: страница показывает
 * свой демо-ответ и честно подписывает его. Клиент на макете не должен
 * увидеть «ошибка 503» — для него это «сайт сломан».
 */

const MAX_BODY_BYTES = 8 * 1024;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return json({ fallback: true, why: "size" }, 413);

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ fallback: true, why: "size" }, 413);
    raw = JSON.parse(text);
  } catch {
    return json({ fallback: true, why: "bad" }, 400);
  }

  const input = parseProtoAiRequest(raw);
  if (!input || !looksLikeAccessToken(input.token)) return json({ fallback: true, why: "bad" }, 400);

  // Сначала адрес: он дешевле всего и отсекает скрипт, который долбит один
  // прототип. Потом прототип и общий потолок за сутки.
  const ip = rateLimit(`proto-ai:ip:${clientIp(request)}`, PROTO_AI_LIMITS.ip);
  if (!ip.ok) return json({ fallback: true, why: "limit", retryAfter: ip.retryAfter });

  if (!(await protoAiAllowed(input.token, input.tool))) return json({ fallback: true, why: "off" }, 404);

  for (const [key, limit] of [
    [`proto-ai:proto:${input.token}`, PROTO_AI_LIMITS.proto],
    ["proto-ai:all", PROTO_AI_LIMITS.all],
  ] as const) {
    if (!rateLimit(key, limit).ok) return json({ fallback: true, why: "limit" });
  }

  const result = await askProtoAi(input);
  if (!result) return json({ fallback: true, why: "model" });
  return json({ ok: true, result });
}
