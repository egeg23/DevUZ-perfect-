import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { DEFAULT_SETTINGS, SCOUT_SETTINGS_KEY, settingsOf, type ScoutMode, type ScoutSettings } from "@/lib/scout/settings";
import { serviceClient } from "@/lib/supabase";

/** Меняют режим и слова владелец и руководитель — как и другие общие настройки скаута. */
export function mayTuneScout(staff: Pick<Staff, "role">): boolean {
  return staff.role === "admin" || staff.role === "head";
}

let cache: { at: number; value: ScoutSettings } | null = null;
/** Скаут перечитывает не чаще раза в 5 минут: смена режима доходит без перезапуска. */
const CACHE_MS = 5 * 60_000;

/** Настройки из базы; база не ответила — прошлые, а без них — «автоматически». */
export async function loadScoutSettings(fresh = false): Promise<ScoutSettings> {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const db = serviceClient();
  if (!db) return cache?.value ?? DEFAULT_SETTINGS;
  const { data, error } = await db.from("stats_snapshots").select("payload").eq("key", SCOUT_SETTINGS_KEY).maybeSingle();
  if (error) return cache?.value ?? DEFAULT_SETTINGS;
  const value = settingsOf(data?.payload);
  cache = { at: Date.now(), value };
  return value;
}

export async function saveScoutSettings(
  staff: Staff,
  mode: ScoutMode,
  words: string[],
  ip: string,
): Promise<"ok" | "forbidden" | "empty" | "failed"> {
  if (!mayTuneScout(staff)) return "forbidden";
  if (mode === "words" && !words.length) return "empty";
  const db = serviceClient();
  if (!db) return "failed";
  const at = new Date().toISOString();
  const { error } = await db
    .from("stats_snapshots")
    .upsert({ key: SCOUT_SETTINGS_KEY, payload: { mode, words, by: staff.id, at }, computed_at: at }, { onConflict: "key" });
  if (error) return "failed";
  cache = null;
  await record("scout.settings_saved", { actorStaffId: staff.id, meta: { mode, words: words.length }, ip });
  return "ok";
}
