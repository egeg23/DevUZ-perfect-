import { openMinute } from "@/lib/qualify/minute";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Окно первой минуты — выдаётся браузеру один раз, при первом заходе.
 *
 * Отсчёт ведёт браузер, а проверяет сервер: в окне подписано время выдачи,
 * и скидку закрепит только окно, принесённое вовремя. `off` — минута
 * выключена (FIRST_MINUTE_SECONDS=0 или нет ключа подписи): сайт тогда
 * показывает одну гарантию двадцати секунд.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`minute:${clientIp(request)}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const window = await openMinute();
  if (!window) return Response.json({ off: true });
  return Response.json(window, { headers: { "Cache-Control": "no-store" } });
}
