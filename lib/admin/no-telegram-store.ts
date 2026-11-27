import { NO_TG_DAYS, noTgDue, noTgNewsKey, noTgText, type NoTgCard } from "@/lib/admin/no-telegram";
import { wants } from "@/lib/admin/notify-prefs";
import { tashkentHour } from "@/lib/admin/portion";
import { tashkentDate, todayInTashkent } from "@/lib/admin/pulse";
import { sendMessage } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/** Утренняя строка о письмах без Telegram (lib/admin/no-telegram.ts). */
export async function sendNoTelegram(now: Date = new Date()): Promise<number> {
  if (!noTgDue(tashkentDate(now).weekday, tashkentHour(now))) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const news = noTgNewsKey(todayInTashkent(now));
  const since = new Date(now.getTime() - NO_TG_DAYS * 86_400_000).toISOString();

  const [{ data: cards }, { data: done }] = await Promise.all([
    db
      .from("prospects")
      .select("id, label, host, claimed_by, claimed_at")
      .eq("status", "manual")
      .is("closed_at", null)
      .not("claimed_by", "is", null)
      .gte("claimed_at", since)
      .order("claimed_at", { ascending: false })
      .limit(500),
    db.from("team_news_sent").select("staff_id").eq("news_id", news),
  ]);
  const byOwner = new Map<string, NoTgCard[]>();
  for (const row of cards ?? []) {
    const owner = String(row.claimed_by);
    const list = byOwner.get(owner) ?? [];
    list.push({ id: String(row.id), label: String(row.label ?? row.host ?? "компания") });
    byOwner.set(owner, list);
  }
  if (!byOwner.size) return 0;

  const already = new Set((done ?? []).map((r) => String(r.staff_id)));
  const { data: people } = await db
    .from("staff")
    .select("id, telegram_user_id, notify_off")
    .eq("is_active", true)
    .in("id", [...byOwner.keys()].filter((id) => /^[0-9a-f-]{36}$/i.test(id)));

  let sent = 0;
  for (const person of people ?? []) {
    const id = String(person.id);
    const chat = Number(person.telegram_user_id);
    if (!chat || already.has(id) || !wants((person.notify_off as string[] | null) ?? [], "portion")) continue;
    const { data: claimed } = await db
      .from("team_news_sent")
      .upsert({ news_id: news, staff_id: id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
      .select("staff_id");
    if (!claimed?.length) continue;
    if (await sendMessage(chat, noTgText(byOwner.get(id) ?? [], siteUrl))) sent += 1;
    else await db.from("team_news_sent").delete().eq("news_id", news).eq("staff_id", id);
  }
  return sent;
}
