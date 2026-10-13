import { record } from "@/lib/admin/audit";
import {
  AUTO_LOST_DAYS,
  SNOOZE_DAYS,
  TIDY_BUTTONS,
  TIDY_DONE,
  WON_HINT,
  autoLose,
  autoLostNotice,
  pickToAsk,
  stale,
  tidyCallback,
  tidyIntro,
  tidyItem,
  tidyWindow,
  type IdleLead,
  type TidyAnswer,
} from "@/lib/admin/lead-tidy";
import { wants } from "@/lib/admin/notify-prefs";
import { cancelAutoReminders, setStatus } from "@/lib/admin/ownership";
import { dayStartUtc, isWorkday } from "@/lib/admin/portion";
import { todayInTashkent } from "@/lib/admin/pulse";
import type { Staff } from "@/lib/admin/session";
import { esc, sendMessage, sendWithButtons, sendWithRows, setButtons } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Порядок в лидах (lib/admin/lead-tidy.ts): утренний вопрос по лидам без
 * движения, закрытие забытых, ответ на кнопки.
 */

/** Просмотр карточки — не движение: открыть и закрыть может кто угодно. */
const NOT_MOVES = ["lead.viewed", "lead.transcript_viewed"];

/** Все лиды «в работе» действующих сотрудников — с последним движением. */
export async function loadIdle(ownerIds?: readonly string[]): Promise<IdleLead[]> {
  const db = serviceClient();
  if (!db) return [];
  let query = db
    .from("leads")
    .select("id, created_at, assigned_at, assigned_staff_id, company, contact_name, request_no, tidy_asked_at, tidy_snoozed_until")
    .eq("status", "taken")
    .not("assigned_staff_id", "is", null)
    .limit(5000);
  if (ownerIds) query = query.in("assigned_staff_id", [...ownerIds]);
  const { data: leads, error } = await query;
  if (error || !leads?.length) return [];

  const moved = new Map<string, string>();
  const bump = (id: string, at: unknown) => {
    if (typeof at !== "string") return;
    const prev = moved.get(id);
    if (!prev || Date.parse(at) > Date.parse(prev)) moved.set(id, at);
  };
  for (const l of leads) {
    bump(l.id as string, l.created_at);
    bump(l.id as string, l.assigned_at);
  }

  const ids = leads.map((l) => l.id as string);
  // Кусками: длинный список id не влезает в адрес запроса.
  for (let i = 0; i < ids.length; i += 200) {
    const part = ids.slice(i, i + 200);
    const [{ data: msgs }, { data: acts }] = await Promise.all([
      db.from("lead_messages").select("lead_id, created_at").in("lead_id", part).limit(20000),
      db
        .from("audit_events")
        .select("target_id, created_at, action")
        .eq("target_type", "lead")
        .in("target_id", part)
        .not("actor_staff_id", "is", null)
        .limit(20000),
    ]);
    for (const m of msgs ?? []) bump(m.lead_id as string, m.created_at);
    for (const a of acts ?? []) if (!NOT_MOVES.includes(a.action as string)) bump(a.target_id as string, a.created_at);
  }

  return leads.map((l) => ({
    id: l.id as string,
    label: String(l.company || l.contact_name || (l.request_no ? `заявка ${l.request_no}` : "лид без имени")),
    ownerId: l.assigned_staff_id as string,
    movedAt: moved.get(l.id as string) ?? (l.created_at as string),
    snoozedUntil: (l.tidy_snoozed_until as string | null) ?? null,
    askedAt: (l.tidy_asked_at as string | null) ?? null,
  }));
}

/** Сколько лидов у человека висит без движения 7+ дней — для вечернего отчёта. */
export async function staleCounts(ownerIds: readonly string[], now: Date = new Date()): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (const lead of await loadIdle(ownerIds)) {
    if (stale(lead, now)) out.set(lead.ownerId, (out.get(lead.ownerId) ?? 0) + 1);
  }
  return out;
}

/** Один проход в день — память процесса; отметки team_news_sent держат повтор после перезапуска. */
let doneDay: string | null = null;

export async function runLeadTidy(now: Date = new Date()): Promise<{ asked: number; lost: number }> {
  const result = { asked: 0, lost: 0 };
  if (!isWorkday(now) || !tidyWindow(now)) return result;
  const day = todayInTashkent(now);
  if (doneDay === day) return result;
  const db = serviceClient();
  if (!db) return result;

  const { data: staff } = await db
    .from("staff")
    .select("id, role, display_name, telegram_user_id, notify_off")
    .eq("is_active", true);
  const team = staff ?? [];
  const active = new Set(team.map((s) => s.id as string));
  const leads = (await loadIdle()).filter((l) => active.has(l.ownerId));

  // 1. Забытые: 21+ день, спросили, ответа нет — «проиграли» с пометкой.
  const lostBy = new Map<string, number>();
  for (const lead of leads.filter((l) => autoLose(l, now))) {
    const { data: closed } = await db
      .from("leads")
      .update({ status: "lost", tidy_auto_lost_at: now.toISOString() })
      .eq("id", lead.id)
      .eq("status", "taken")
      .select("id")
      .maybeSingle();
    if (!closed) continue;
    await cancelAutoReminders(lead.id);
    await record("lead.auto_lost", {
      targetType: "lead",
      targetId: lead.id,
      meta: { owner: lead.ownerId, moved_at: lead.movedAt, asked_at: lead.askedAt, days: AUTO_LOST_DAYS },
    });
    const name = esc(String(team.find((s) => s.id === lead.ownerId)?.display_name ?? "—"));
    lostBy.set(name, (lostBy.get(name) ?? 0) + 1);
    result.lost += 1;
  }
  const notice = autoLostNotice(lostBy);
  if (notice) {
    const key = `lead-autolost:${day}`;
    for (const r of team) {
      if (!["admin", "head"].includes(r.role as string) || !Number(r.telegram_user_id)) continue;
      if (!wants(r.notify_off as string[] | null, "reports")) continue;
      if (!(await claim(key, r.id as string))) continue;
      await sendMessage(Number(r.telegram_user_id), notice);
    }
  }

  // 2. Утренний вопрос — до трёх самых старых у каждого.
  const toAsk = pickToAsk(
    leads.filter((l) => !autoLose(l, now)),
    now,
    dayStartUtc(day),
  );
  const key = `lead-tidy:${day}`;
  let retry = false;
  for (const [ownerId, mine] of toAsk) {
    const person = team.find((s) => s.id === ownerId);
    const chat = Number(person?.telegram_user_id);
    if (!person || !Number.isFinite(chat) || chat === 0) continue;
    if (!(await claim(key, ownerId))) continue;
    if (!(await sendMessage(chat, tidyIntro(mine.length)))) {
      await db.from("team_news_sent").delete().eq("news_id", key).eq("staff_id", ownerId);
      retry = true;
      continue;
    }
    for (const lead of mine) {
      const ok = await sendWithRows(chat, tidyItem(esc(lead.label), lead.movedAt, now), [
        (["won", "lost", "wait"] as const).map((a) => ({ text: TIDY_BUTTONS[a], callback_data: tidyCallback(a, lead.id) })),
        [{ text: "Открыть карточку", panel: `/admin/leads/${lead.id}` }],
      ]);
      if (!ok) continue;
      await db.from("leads").update({ tidy_asked_at: now.toISOString() }).eq("id", lead.id);
      result.asked += 1;
    }
  }
  // Не дошло до кого-то — следующий проход попробует снова.
  if (!retry) doneDay = day;
  return result;
}

export type TidyResult = "ok" | "forbidden" | "gone" | "failed";

/** Нажатие «Выиграли» / «Проиграли» / «Ещё в работе» под вопросом. */
export async function answerTidy(
  staff: Staff,
  answer: TidyAnswer,
  leadId: string,
  chatId: number,
  messageId: number | null,
  now: Date = new Date(),
): Promise<TidyResult> {
  const db = serviceClient();
  if (!db) return "failed";
  const { data: lead } = await db.from("leads").select("id, status, assigned_staff_id").eq("id", leadId).maybeSingle();
  if (!lead) return "gone";
  if (lead.assigned_staff_id !== staff.id) return "forbidden";

  if (answer === "wait") {
    const until = new Date(now.getTime() + SNOOZE_DAYS * 86_400_000).toISOString();
    const { error } = await db.from("leads").update({ tidy_snoozed_until: until }).eq("id", leadId);
    if (error) return "failed";
    // Запись в журнал — она же движение: следующий вопрос — не раньше чем
    // через неделю, и до «проиграли» снова три недели.
    await record("lead.idle_snoozed", { actorStaffId: staff.id, targetType: "lead", targetId: leadId, meta: { until } });
  } else {
    const done = await setStatus(leadId, answer, staff, "", "telegram");
    if (!done.ok) return done.reason === "forbidden" ? "forbidden" : done.reason === "gone" ? "gone" : "failed";
  }

  if (messageId) await setButtons(chatId, messageId, [[{ text: TIDY_DONE[answer], callback_data: "noop" }]]);
  if (answer === "won") {
    await sendWithButtons(chatId, WON_HINT, [{ text: "Завести проект", panel: `/admin/projects?lead=${leadId}` }]);
  }
  return "ok";
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
