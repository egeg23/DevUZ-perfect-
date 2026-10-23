import { HELPER_STATS_HOUR, askKey, helperStatsText, statsNewsKey, HELPER_ASKS_PREFIX } from "@/lib/admin/helper-stats";
import { wants } from "@/lib/admin/notify-prefs";
import { tashkentHour } from "@/lib/admin/portion";
import { todayInTashkent } from "@/lib/admin/pulse";
import { QUIET_FROM_HOUR } from "@/lib/admin/tasks";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * +1 вопрос помощнику (lib/admin/helper-stats.ts). Сбой счёта ответа не
 * трогает: человек уже получил его.
 */
export async function noteHelperAsk(staffId: string, now: Date = new Date()): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const key = askKey(todayInTashkent(now), staffId);
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", key).maybeSingle();
  const count = Number((data?.payload as { count?: unknown } | null)?.count ?? 0) || 0;
  const { error } = await db
    .from("stats_snapshots")
    .upsert({ key, payload: { count: count + 1 }, computed_at: now.toISOString() }, { onConflict: "key" });
  if (error) console.error("помощник: не записал счёт", error.message);
}

/**
 * Сводка за день — владельцу и руководителю под галочкой «Отчёты», каждый
 * день с 18:00 до 21:00 по Ташкенту, раз в день (`helper-stats:<день>`).
 */
export async function sendHelperStats(now: Date = new Date()): Promise<number> {
  const hour = tashkentHour(now);
  if (hour < HELPER_STATS_HOUR || hour >= QUIET_FROM_HOUR) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const day = todayInTashkent(now);
  const news = statsNewsKey(day);

  const [{ data: readers }, { data: done }] = await Promise.all([
    db.from("staff").select("id, telegram_user_id, notify_off").eq("is_active", true).in("role", ["admin", "head"]),
    db.from("team_news_sent").select("staff_id").eq("news_id", news),
  ]);
  const already = new Set((done ?? []).map((r) => r.staff_id as string));
  const due = (readers ?? []).filter(
    (r) => Number(r.telegram_user_id) && !already.has(r.id as string) && wants((r.notify_off as string[] | null) ?? [], "reports"),
  );
  if (!due.length) return 0;

  const prefix = `${HELPER_ASKS_PREFIX}${day}:`;
  const { data: rows } = await db.from("stats_snapshots").select("key, payload").like("key", `${prefix}%`).limit(500);
  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    const id = String(row.key).slice(prefix.length);
    counts.set(id, Number((row.payload as { count?: unknown } | null)?.count ?? 0) || 0);
  }
  const ids = [...counts.keys()];
  const { data: people } = ids.length
    ? await db.from("staff").select("id, display_name").in("id", ids)
    : { data: [] as { id: string; display_name: string }[] };
  const names = new Map((people ?? []).map((p) => [p.id as string, String(p.display_name ?? "без имени")]));
  const text = helperStatsText(
    day,
    ids.map((id) => ({ name: esc(names.get(id) ?? "бывший сотрудник"), count: counts.get(id) ?? 0 })),
  );

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
