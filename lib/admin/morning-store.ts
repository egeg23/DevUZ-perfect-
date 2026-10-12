import { isPanelLocale } from "@/lib/admin/i18n";
import { MORNING_ROLES, firstName, morningGreeting, morningKey, morningWindow } from "@/lib/admin/morning";
import { wants } from "@/lib/admin/notify-prefs";
import type { Role } from "@/lib/admin/roles";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Разослать «Доброе утро» тем, кому сегодня ещё не ушло (lib/admin/morning.ts).
 *
 * Отметка — в team_news_sent, ключ «morning:ГГГГ-ММ-ДД»: до сообщения и
 * условно, поэтому два прохода свипа не пожелают дважды. Не дошло — отметка
 * снимается, следующий проход попробует снова, пока не полдень.
 */
export async function sendMorningGreetings(now: Date = new Date()): Promise<number> {
  if (!morningWindow(now)) return 0;
  const db = serviceClient();
  if (!db) return 0;

  const key = morningKey(now);
  const [{ data: staff }, { data: done }] = await Promise.all([
    db.from("staff").select("id, role, display_name, telegram_user_id, panel_locale, notify_off").eq("is_active", true),
    db.from("team_news_sent").select("staff_id").eq("news_id", key),
  ]);
  const already = new Set((done ?? []).map((r) => r.staff_id as string));

  let sent = 0;
  for (const row of staff ?? []) {
    const chat = Number(row.telegram_user_id);
    if (!Number.isFinite(chat) || chat === 0) continue;
    if (!MORNING_ROLES.includes(row.role as Role) || already.has(row.id as string)) continue;
    if (!wants(row.notify_off as string[] | null, "morning")) continue;
    if (!(await claim(key, row.id as string))) continue;

    const name = firstName(row.display_name as string | null);
    const locale = isPanelLocale(row.panel_locale) ? row.panel_locale : "ru";
    if (await sendMessage(chat, morningGreeting(name ? esc(name) : null, locale, now))) sent += 1;
    else await db.from("team_news_sent").delete().eq("news_id", key).eq("staff_id", row.id);
  }
  return sent;
}

async function claim(key: string, staffId: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db
    .from("team_news_sent")
    .upsert({ news_id: key, staff_id: staffId }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
    .select("staff_id");
  return Boolean(data?.length);
}
