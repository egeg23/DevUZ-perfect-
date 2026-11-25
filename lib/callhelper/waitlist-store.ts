import { messageWindow } from "@/lib/admin/tasks";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";
import { absoluteUrl } from "@/lib/seo";

import { WAIT_PREFIX, mergeWait, readWait, sortWait, waitKey, type WaitEntry, type WaitRow } from "./waitlist";

/**
 * База листа ожидания CallHelper (lib/callhelper/waitlist.ts). Только
 * `stats_snapshots`: заявка не лид и в очередь команды не идёт.
 */

export async function saveWait(entry: WaitEntry, now: Date = new Date()): Promise<WaitRow | null> {
  const db = serviceClient();
  if (!db) return null;
  const key = waitKey(entry.contact);
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", key).maybeSingle();
  const row = mergeWait(readWait(data?.payload), entry, now);
  const { error } = await db
    .from("stats_snapshots")
    .upsert({ key, payload: row, computed_at: now.toISOString() }, { onConflict: "key" });
  if (error) {
    console.error("callhelper: лист ожидания не записан", error.message);
    return null;
  }
  return row;
}

export async function listWait(): Promise<WaitRow[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db.from("stats_snapshots").select("payload").like("key", `${WAIT_PREFIX}%`).limit(500);
  if (error) return [];
  return sortWait((data ?? []).map((r) => readWait(r.payload)).filter((r): r is WaitRow => !!r));
}

/**
 * Строка в Telegram — только владельцу (роль admin), с 08:00 до 21:00 по
 * Ташкенту. Ночью строки нет: заявка уже в разделе, утром её видно там.
 */
export async function tellOwnerWait(row: WaitRow, now: Date = new Date()): Promise<void> {
  if (!messageWindow(now)) return;
  const db = serviceClient();
  if (!db) return;
  const { data } = await db.from("staff").select("telegram_user_id").eq("is_active", true).eq("role", "admin");
  const lines = [
    row.times > 1 ? "📞 CallHelper: снова в листе ожидания" : "📞 CallHelper: новая заявка в лист ожидания",
    [row.name, row.company].filter(Boolean).map(esc).join(" · ") || "без имени",
    `Контакт: ${esc(row.contact)}`,
    row.operators ? `Операторов: ${row.operators}` : "",
    row.comment ? `«${esc(row.comment)}»` : "",
    `Список: ${absoluteUrl("admin/callhelper")}#wait`,
  ].filter(Boolean);
  for (const s of data ?? []) {
    const chat = Number(s.telegram_user_id);
    if (chat) await sendMessage(chat, lines.join("\n"));
  }
}
