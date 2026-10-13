import { isPanelLocale } from "@/lib/admin/i18n";
import { QUEUE_ROLES } from "@/lib/admin/lead-queue";
import { firstName } from "@/lib/admin/morning";
import { wants } from "@/lib/admin/notify-prefs";
import { dayStartUtc, isWorkday } from "@/lib/admin/portion";
import { todayInTashkent } from "@/lib/admin/pulse";
import {
  NUDGE_PANEL,
  alertText,
  away,
  nudgeButton,
  nudgeText,
  silenceKey,
  silenceStepAt,
  silent,
  type DayActivity,
} from "@/lib/admin/silence";
import { touchesOnDay } from "@/lib/admin/touch-store";
import { esc, sendMessage, sendWithButtons } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Сигнал о молчании (lib/admin/silence.ts): в 12:00 — самому человеку, в
 * 15:00 — руководителям и владельцу.
 *
 * Отметка — в team_news_sent до сообщения и условно, как у «Доброго утра»:
 * два прохода свипа не напишут дважды, а не дошедшее — пришлют снова, пока
 * не кончилось окно.
 */
export async function runSilence(now: Date = new Date()): Promise<number> {
  if (!isWorkday(now)) return 0;
  const step = silenceStepAt(now);
  if (!step) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const day = todayInTashkent(now);

  const { data: staff } = await db
    .from("staff")
    .select("id, role, display_name, telegram_user_id, panel_locale, notify_off, touch_plan")
    .eq("is_active", true)
    .in("role", ["admin", ...QUEUE_ROLES]);
  const team = staff ?? [];
  const inQueue = team.filter(
    (s) =>
      (QUEUE_ROLES as readonly string[]).includes(s.role as string) &&
      !away((s.touch_plan as number | null) ?? null, wants(s.notify_off as string[] | null, "queue")),
  );
  if (!inQueue.length) return 0;

  const quiet = await silentToday(
    inQueue.map((s) => s.id as string),
    day,
  );
  if (!quiet.size) return 0;

  if (step === "nudge") {
    const key = silenceKey("nudge", day);
    let sent = 0;
    for (const row of inQueue) {
      const chat = Number(row.telegram_user_id);
      if (!quiet.has(row.id as string) || !Number.isFinite(chat) || chat === 0) continue;
      if (!wants(row.notify_off as string[] | null, "silence")) continue;
      if (!(await claim(key, row.id as string))) continue;
      const name = firstName(row.display_name as string | null);
      const locale = isPanelLocale(row.panel_locale) ? row.panel_locale : "ru";
      const ok = await sendWithButtons(chat, nudgeText(name ? esc(name) : null, locale), [
        { text: nudgeButton(locale), panel: NUDGE_PANEL },
      ]);
      if (ok) sent += 1;
      else await db.from("team_news_sent").delete().eq("news_id", key).eq("staff_id", row.id);
    }
    return sent;
  }

  // 15:00 — руководителям и владельцу под галочкой «Отчёты». Себя в списке
  // руководитель не видит: о себе он и так знает.
  const key = silenceKey("alert", day);
  const readers = team.filter(
    (s) =>
      ["admin", "head"].includes(s.role as string) &&
      Number(s.telegram_user_id) &&
      wants((s.notify_off as string[] | null) ?? [], "reports"),
  );
  let sent = 0;
  for (const reader of readers) {
    const names = inQueue
      .filter((s) => quiet.has(s.id as string) && s.id !== reader.id)
      .map((s) => esc((s.display_name as string | null) ?? "без имени"));
    const text = alertText(names);
    if (!text) continue;
    if (!(await claim(key, reader.id as string))) continue;
    if (await sendMessage(Number(reader.telegram_user_id), text)) sent += 1;
    else await db.from("team_news_sent").delete().eq("news_id", key).eq("staff_id", reader.id);
  }
  return sent;
}

/** Кто из этих людей за сегодня ничего не сделал (silent). */
export async function silentToday(ids: readonly string[], day: string): Promise<Set<string>> {
  const db = serviceClient();
  const out = new Set<string>();
  if (!db || !ids.length) return out;
  const from = dayStartUtc(day);
  const to = new Date(from.getTime() + 24 * 3600_000);

  const [touches, views, presence, audit] = await Promise.all([
    touchesOnDay(ids, day),
    db.from("panel_usage").select("staff_id, views").eq("day", day).in("staff_id", [...ids]),
    db.from("panel_presence").select("staff_id, minutes").eq("day", day).in("staff_id", [...ids]),
    db
      .from("audit_events")
      .select("actor_staff_id, action")
      .in("actor_staff_id", [...ids])
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString())
      .not("action", "like", "login.%")
      .limit(5000),
  ]);
  // База не ответила — молчащим никого не считаем: лишний упрёк человеку,
  // который работал, хуже пропущенного напоминания.
  if (views.error || presence.error || audit.error) return out;

  const day0 = (): DayActivity => ({ touches: 0, views: 0, minutes: 0, actions: 0 });
  const acts = new Map(ids.map((id) => [id, day0()]));
  for (const [id, n] of touches) {
    const a = acts.get(id);
    if (a) a.touches += n;
  }
  for (const v of views.data ?? []) {
    const a = acts.get(v.staff_id as string);
    if (a) a.views += Number(v.views ?? 0);
  }
  for (const p of presence.data ?? []) {
    const a = acts.get(p.staff_id as string);
    if (a) a.minutes += Number(p.minutes ?? 0);
  }
  for (const e of audit.data ?? []) {
    const a = acts.get(e.actor_staff_id as string);
    if (a) a.actions += 1;
  }
  for (const [id, a] of acts) if (silent(a)) out.add(id);
  return out;
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
