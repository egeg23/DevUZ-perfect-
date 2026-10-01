import { currentStaff } from "@/lib/admin/guard";
import { taskFeed } from "@/lib/admin/task-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Дальше этого назад не смотрим: вкладка, проспавшая сутки, не должна разразиться сотней звуков. */
const LOOKBACK_MS = 10 * 60_000;

/**
 * Что нового по задачам — для открытой панели (components/admin/task-alerts).
 *
 * Адрес под /admin, а не /api: кука сессии живёт только на /admin (так же
 * устроен маячок app/admin/beacon). Кто спрашивает — из куки, а не из
 * запроса: чужие задачи так не прочитать. Ответ — только своё: новая
 * задача мне, шаг по задаче, которую поставил я.
 */
export async function GET(request: Request) {
  const staff = await currentStaff();
  if (!staff) return Response.json({ items: [] }, { status: 401 });

  const now = Date.now();
  const raw = Date.parse(new URL(request.url).searchParams.get("since") ?? "");
  const since = new Date(Number.isFinite(raw) ? Math.min(Math.max(raw, now - LOOKBACK_MS), now) : now);

  const feed = await taskFeed(staff.id, since, new Date(now));
  return Response.json(
    { now: new Date(now).toISOString(), items: feed.items },
    { headers: { "Cache-Control": "no-store" } },
  );
}
