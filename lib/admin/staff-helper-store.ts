import { claimAlertText } from "@/lib/admin/staff-helper";
import { wants } from "@/lib/admin/notify-prefs";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * «Называет себя сотрудником, в Команде нет» — владельцу и руководителю под
 * галочкой «Отчёты», один раз на человека: отметка `staff-claim:<id>` в
 * `team_news_sent`. По ней же бот узнаёт его после выкатки (разговор в
 * памяти пропал) и не отдаёт первичке.
 */

export function claimKey(telegramId: number): string {
  return `staff-claim:${telegramId}`;
}

/** Писал ли он уже, что он наш сотрудник. Сбой базы — «нет»: дальше как было. */
export async function claimedBefore(telegramId: number): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data, error } = await db.from("team_news_sent").select("staff_id").eq("news_id", claimKey(telegramId)).limit(1);
  return !error && Boolean(data?.length);
}

export async function alertStaffClaim(from: { id: number; username?: string; first_name?: string }): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { data } = await db
    .from("staff")
    .select("id, role, telegram_user_id, notify_off")
    .eq("is_active", true)
    .in("role", ["admin", "head"]);
  const readers = (data ?? []).filter(
    (s) => Number(s.telegram_user_id) && wants((s.notify_off as string[] | null) ?? [], "reports"),
  );
  const handle = from.username ? `@${from.username}` : `id ${from.id}`;
  const text = esc(claimAlertText({ handle, name: from.first_name?.trim() || null }));
  let sent = 0;
  for (const reader of readers) {
    const { data: claimed } = await db
      .from("team_news_sent")
      .upsert({ news_id: claimKey(from.id), staff_id: reader.id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
      .select("staff_id");
    if (!claimed?.length) continue;
    if (await sendMessage(Number(reader.telegram_user_id), text)) sent += 1;
  }
  return sent;
}
