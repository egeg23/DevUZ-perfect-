import { EXTRA_CHATS_KEY, parseExtraChats, type ExtraChat } from "@/lib/scout/extra-chats";
import { serviceClient } from "@/lib/supabase";

/**
 * Список чатов скаута в базе (lib/scout/extra-chats.ts). База не ответила —
 * пустой список: скаут читает SCOUT_CHATS, как раньше, и не падает.
 */
export async function loadExtraChats(): Promise<ExtraChat[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db.from("stats_snapshots").select("payload").eq("key", EXTRA_CHATS_KEY).maybeSingle();
  if (error || !data) return [];
  return parseExtraChats(data.payload);
}

/** Записывает узнанные номера и отметки «не откроется». Остальное в строке — как было. */
export async function saveExtraChats(chats: readonly ExtraChat[]): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db
    .from("stats_snapshots")
    .update({ payload: { chats }, computed_at: new Date().toISOString() })
    .eq("key", EXTRA_CHATS_KEY);
  return !error;
}
