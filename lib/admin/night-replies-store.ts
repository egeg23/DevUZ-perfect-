import { wants } from "@/lib/admin/notify-prefs";
import { dayStartUtc } from "@/lib/admin/portion";
import { TASHKENT_OFFSET_MS, todayInTashkent } from "@/lib/admin/pulse";
import { QUIET_FROM_HOUR, QUIET_TO_HOUR, messageWindow } from "@/lib/admin/tasks";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Ответы клиентов за ночь — утром одной сводкой тому, кто ведёт касание.
 *
 * Владелец, 23.10.2026: «ночью уведомления не уходят!!!! Только с 8 до 21:00
 * по ташкенту». Ночью строка «Касание · сайт» не уходит (tellManager молчит),
 * а ответ клиента не теряется: в 08:00 каждому — список того, что ему
 * написали с 21:00 до 08:00. Разговоры, которые ведёт модель, сюда не идут:
 * утром модель ответит сама и скажет «Ваш лид ответил». Отказы и
 * автоответчики — тоже нет. Отметка — team_news_sent
 * («night-replies:<день>»), до сообщения: два прохода свипа не повторят.
 */

/** До какого часа утра сводка ещё имеет смысл. */
export const NIGHT_DIGEST_LATEST_HOUR = 12;

export type NightReply = { host: string; body: string; leadId: string | null; at: string };

/** Ночь, которая только что прошла: вчера с 21:00 до сегодня 08:00 по Ташкенту. */
export function lastNight(now: Date): { from: Date; to: Date; day: string } {
  const day = todayInTashkent(now);
  const midnight = dayStartUtc(day).getTime();
  return {
    from: new Date(midnight - (24 - QUIET_FROM_HOUR) * 3600_000),
    to: new Date(midnight + QUIET_TO_HOUR * 3600_000),
    day,
  };
}

function hhmm(iso: string): string {
  const t = new Date(Date.parse(iso) + TASHKENT_OFFSET_MS);
  return `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
}

/** Текст сводки одному человеку (HTML Telegram). */
export function nightRepliesText(replies: readonly NightReply[]): string {
  const lines = replies.slice(0, 20).map((r) => {
    const link = r.leadId ? ` · ${siteUrl}/admin/leads/${r.leadId}#talk` : "";
    return `• ${hhmm(r.at)} <b>${esc(r.host)}</b>: «${esc(r.body.replace(/\s+/g, " ").slice(0, 160))}»${link}`;
  });
  const more = replies.length > 20 ? [`…и ещё ${replies.length - 20} — в «Касаниях».`] : [];
  return [`🌙 <b>Ночью ответили клиенты по вашим касаниям</b> (с ${String(QUIET_FROM_HOUR).padStart(2, "0")}:00 до ${String(QUIET_TO_HOUR).padStart(2, "0")}:00 бот молчит)`, "", ...lines, ...more].join("\n");
}

export async function sendNightReplies(now: Date = new Date()): Promise<number> {
  const hour = new Date(now.getTime() + TASHKENT_OFFSET_MS).getUTCHours();
  if (!messageWindow(now) || hour >= NIGHT_DIGEST_LATEST_HOUR) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const night = lastNight(now);
  const key = `night-replies:${night.day}`;

  const { data: rows } = await db
    .from("outreach_messages")
    .select("body, created_at, kind, prospects!inner(host, label, lead_id, handled_by, claimed_by, ai_handling, closed_reason)")
    .eq("direction", "in")
    .gte("created_at", night.from.toISOString())
    .lt("created_at", night.to.toISOString())
    .eq("prospects.ai_handling", false)
    .order("created_at", { ascending: true })
    .limit(500);
  const byOwner = new Map<string, NightReply[]>();
  for (const row of (rows ?? []) as Record<string, unknown>[]) {
    if (row.kind === "auto") continue;
    const p = (Array.isArray(row.prospects) ? row.prospects[0] : row.prospects) as Record<string, unknown> | null;
    if (!p || p.closed_reason === "refused") continue;
    const owner = (p.handled_by as string | null) ?? (p.claimed_by as string | null);
    if (!owner) continue;
    const list = byOwner.get(owner) ?? [];
    list.push({
      host: String(p.host || p.label || "касание"),
      body: String(row.body ?? ""),
      leadId: (p.lead_id as string | null) ?? null,
      at: String(row.created_at),
    });
    byOwner.set(owner, list);
  }
  if (!byOwner.size) return 0;

  const { data: staff } = await db
    .from("staff")
    .select("id, telegram_user_id, notify_off")
    .eq("is_active", true)
    .in("id", [...byOwner.keys()]);
  let sent = 0;
  for (const s of staff ?? []) {
    const chat = Number(s.telegram_user_id);
    if (!Number.isFinite(chat) || chat === 0) continue;
    // Галочка «Ответы клиентов на касания» снята — ответы ждут в «Касаниях».
    if (!wants((s.notify_off as string[] | null) ?? [], "talks")) continue;
    const { data: claimed } = await db
      .from("team_news_sent")
      .upsert({ news_id: key, staff_id: s.id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
      .select("staff_id");
    if (!claimed?.length) continue;
    if (await sendMessage(chat, nightRepliesText(byOwner.get(String(s.id)) ?? []))) sent += 1;
    else await db.from("team_news_sent").delete().eq("news_id", key).eq("staff_id", s.id);
  }
  return sent;
}
