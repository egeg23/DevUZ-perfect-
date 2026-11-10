import { SUBS_REPORT_HOUR, botSubs, subsNewsKey, subsReportText } from "@/lib/admin/bot-users";
import { loadBotAudience } from "@/lib/admin/bot-users-store";
import { wants } from "@/lib/admin/notify-prefs";
import { tashkentHour } from "@/lib/admin/portion";
import { todayInTashkent } from "@/lib/admin/pulse";
import { QUIET_FROM_HOUR } from "@/lib/admin/tasks";
import { sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * «👥 Подписчики бота» — владельцу и руководителю под галочкой «Отчёты»,
 * каждый день с 20:00 до 21:00 по Ташкенту, раз в день (`bot-subs:<день>`).
 * Числа — тем же `botSubs`, что блок на «Главной». Модели нет.
 */
export async function sendBotSubsReport(now: Date = new Date()): Promise<number> {
  const hour = tashkentHour(now);
  if (hour < SUBS_REPORT_HOUR || hour >= QUIET_FROM_HOUR) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const day = todayInTashkent(now);
  const news = subsNewsKey(day);

  const [{ data: readers }, { data: done }] = await Promise.all([
    db.from("staff").select("id, telegram_user_id, notify_off").eq("is_active", true).in("role", ["admin", "head"]),
    db.from("team_news_sent").select("staff_id").eq("news_id", news),
  ]);
  const already = new Set((done ?? []).map((r) => r.staff_id as string));
  const due = (readers ?? []).filter(
    (r) => Number(r.telegram_user_id) && !already.has(r.id as string) && wants((r.notify_off as string[] | null) ?? [], "reports"),
  );
  if (!due.length) return 0;

  const { users, marks } = await loadBotAudience();
  const text = subsReportText(day, botSubs(users, marks, now));

  let sent = 0;
  for (const reader of due) {
    const { data: claimed } = await db
      .from("team_news_sent")
      .upsert({ news_id: news, staff_id: reader.id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
      .select("staff_id");
    if (!claimed?.length) continue;
    if (await sendMessage(Number(reader.telegram_user_id), text)) sent += 1;
    else await db.from("team_news_sent").delete().eq("news_id", news).eq("staff_id", reader.id);
  }
  return sent;
}
