import { TOURS, TOUR_VERSION, tourKey, type TourId } from "@/lib/admin/panel-tour";
import { serviceClient } from "@/lib/supabase";

/** «Видел» обучение — в stats_snapshots (lib/admin/panel-tour.ts). */
/** Видел ли. База не ответила — считаем, что видел: не мешать работе обучением на каждом переходе. */
export async function tourSeen(staffId: string, tour: TourId = TOUR_VERSION): Promise<boolean> {
  const db = serviceClient();
  if (!db) return true;
  const { data, error } = await db.from("stats_snapshots").select("key").eq("key", tourKey(staffId, tour)).maybeSingle();
  if (error) return true;
  return Boolean(data);
}

/** Все обучения разом — одним запросом. База не ответила — «видел» всё. */
export async function toursSeen(staffId: string): Promise<Record<TourId, boolean>> {
  const all = Object.fromEntries(TOURS.map((tour) => [tour, true])) as Record<TourId, boolean>;
  const db = serviceClient();
  if (!db) return all;
  const { data, error } = await db
    .from("stats_snapshots")
    .select("key")
    .in(
      "key",
      TOURS.map((tour) => tourKey(staffId, tour)),
    );
  if (error) return all;
  const have = new Set((data ?? []).map((row) => String(row.key)));
  return Object.fromEntries(TOURS.map((tour) => [tour, have.has(tourKey(staffId, tour))])) as Record<TourId, boolean>;
}

/** Прошёл или закрыл — больше не показываем. `skipped` — закрыл, не дойдя до конца. */
export async function markTourSeen(staffId: string, step: number, skipped: boolean, now: Date = new Date(), tour: TourId = TOUR_VERSION): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { error } = await db
    .from("stats_snapshots")
    .upsert({ key: tourKey(staffId, tour), payload: { step, skipped, at: now.toISOString() }, computed_at: now.toISOString() }, { onConflict: "key" });
  if (error) console.error("обучение: не записал «видел»", error.message);
}
