import { WAIT_DAY_CAP, WAIT_IP_LIMIT, parseWait } from "@/lib/callhelper/waitlist";
import { saveWait, tellOwnerWait } from "@/lib/callhelper/waitlist-store";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Заявка в лист ожидания DevUz CallHelper с главной. Не лид: пишется в
 * `stats_snapshots` и видна только владельцу (lib/callhelper/waitlist.ts).
 * Поле `website` — ловушка для ботов: заполнено — отвечаем «ок» и молчим.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`callhelper-wait:${clientIp(request)}`, { limit: WAIT_IP_LIMIT, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body && typeof body === "object" && String((body as { website?: unknown }).website ?? "").trim()) {
    return Response.json({ ok: true });
  }

  const parsed = parseWait(body);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const day = rateLimit("callhelper-wait:all", { limit: WAIT_DAY_CAP, windowMs: 24 * 3600 * 1000 });
  if (!day.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

  const row = await saveWait(parsed.entry);
  if (!row) return Response.json({ error: "save_failed" }, { status: 502 });
  try {
    await tellOwnerWait(row);
  } catch (error) {
    console.error("callhelper: строка владельцу", error);
  }
  return Response.json({ ok: true });
}
