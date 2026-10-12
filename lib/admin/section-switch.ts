import { SWITCHED_SECTIONS } from "@/lib/admin/roles";
import { serviceClient } from "@/lib/supabase";

/**
 * Выключатель разделов (roles.ts, SWITCHED_SECTIONS) — база.
 *
 * Строка `section-on:<раздел>` в stats_snapshots: `{ on, by, at }`. Нет
 * строки — раздел выключен: новый раздел с выключателем появляется у
 * команды только тогда, когда владелец нажал кнопку, а не в день выкатки.
 * База не ответила — тоже «выключен»: лучше на минуту спрятать раздел, чем
 * открыть то, что владелец ещё не открывал.
 */

export const switchKey = (href: string) => `section-on:${href}`;

/** Включён ли раздел для команды. Раздел без выключателя включён всегда. */
export async function sectionOn(href: string): Promise<boolean> {
  if (!SWITCHED_SECTIONS.includes(href)) return true;
  return !(await sectionsOff()).includes(href);
}

/** Какие разделы с выключателем сейчас выключены. */
export async function sectionsOff(): Promise<string[]> {
  const db = serviceClient();
  if (!db) return [...SWITCHED_SECTIONS];
  try {
    const { data, error } = await db
      .from("stats_snapshots")
      .select("key, payload")
      .in("key", SWITCHED_SECTIONS.map(switchKey));
    if (error) return [...SWITCHED_SECTIONS];
    const on = new Set(
      (data ?? []).filter((row) => (row.payload as { on?: unknown } | null)?.on === true).map((row) => String(row.key)),
    );
    return SWITCHED_SECTIONS.filter((href) => !on.has(switchKey(href)));
  } catch {
    return [...SWITCHED_SECTIONS];
  }
}

/** Включить или выключить раздел. Кто вправе — проверяет действие (только владелец). */
export async function setSectionOn(href: string, on: boolean, by: string): Promise<boolean> {
  if (!SWITCHED_SECTIONS.includes(href)) return false;
  const db = serviceClient();
  if (!db) return false;
  const at = new Date().toISOString();
  const { error } = await db
    .from("stats_snapshots")
    .upsert({ key: switchKey(href), payload: { on, by, at }, computed_at: at }, { onConflict: "key" });
  return !error;
}
