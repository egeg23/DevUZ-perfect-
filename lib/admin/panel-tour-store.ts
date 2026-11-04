import { tourKey } from "@/lib/admin/panel-tour";
import { serviceClient } from "@/lib/supabase";

/** «Видел» обучение — в stats_snapshots (lib/admin/panel-tour.ts). */
/** Видел ли. База не ответила — считаем, что видел: не мешать работе обучением на каждом переходе. */
export async function tourSeen(staffId: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return true;
  const { data, error } = await db.from("stats_snapshots").select("key").eq("key", tourKey(staffId)).maybeSingle();
  if (error) return true;
  return Boolean(data);
}

/** Прошёл или закрыл — больше не показываем. `skipped` — закрыл, не дойдя до конца. */
export async function markTourSeen(staffId: string, step: number, skipped: boolean, now: Date = new Date()): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { error } = await db
    .from("stats_snapshots")
    .upsert({ key: tourKey(staffId), payload: { step, skipped, at: now.toISOString() }, computed_at: now.toISOString() }, { onConflict: "key" });
  if (error) console.error("обучение: не записал «видел»", error.message);
}
