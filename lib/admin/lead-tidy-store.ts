import { record } from "@/lib/admin/audit";
import {
  AUTO_LOST_DAYS,
  TERMS,
  TERM_BUTTONS,
  TIDY_SLOTS,
  WAIT_LIMIT,
  WON_HINT,
  afterPress,
  autoLose,
  autoLostNotice,
  batchRows,
  batchText,
  batches,
  botSilenceNotice,
  canWait,
  dueFor,
  isTerm,
  pickToAsk,
  silentToBot,
  stale,
  taskBody,
  taskSetText,
  taskTitle,
  thirdWaitNotice,
  tidyCallback,
  tidySlot,
  tidySummary,
  unanswered,
  whenText,
  type IdleLead,
  type TidyAnswer,
} from "@/lib/admin/lead-tidy";
import { wants } from "@/lib/admin/notify-prefs";
import { cancelAutoReminders, setStatus } from "@/lib/admin/ownership";
import { isWorkday } from "@/lib/admin/portion";
import { todayInTashkent } from "@/lib/admin/pulse";
import type { Staff } from "@/lib/admin/session";
import { createTasks } from "@/lib/admin/task-store";
import { enterUrl, esc, sendMessage, sendWithButtons, sendWithRows, setButtons } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Порядок в лидах (lib/admin/lead-tidy.ts): вопросы в 10:00 и 16:00 по всем
 * лидам без движения, ответы на кнопки, задача по «ещё в работе», строки
 * руководителю, закрытие забытых.
 */

/**
 * Не движение: просмотр карточки (открыть может кто угодно) и «ещё в
 * работе» боту — это ответ про лид, а не шаг с клиентом. Иначе одно нажатие
 * «⏳» снова прятало бы лид на неделю, а 21 день до «проиграли» начинался
 * заново.
 */
const NOT_MOVES = ["lead.viewed", "lead.transcript_viewed", "lead.idle_snoozed"];

/** Все лиды «в работе» действующих сотрудников — с последним движением. */
export async function loadIdle(ownerIds?: readonly string[]): Promise<IdleLead[]> {
  const db = serviceClient();
  if (!db) return [];
  let query = db
    .from("leads")
    .select(
      "id, created_at, assigned_at, assigned_staff_id, company, contact_name, request_no, tidy_asked_at, tidy_snoozed_until, tidy_first_asked_at, tidy_wait_streak",
    )
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
    firstAskedAt: (l.tidy_first_asked_at as string | null) ?? null,
    waitStreak: Number(l.tidy_wait_streak ?? 0),
  }));
}

/** По человеку: сколько висит 7+ дней и сколько из них без ответа боту. */
export async function tidyCounts(
  ownerIds: readonly string[],
  now: Date = new Date(),
): Promise<{ stale: Map<string, number>; unanswered: Map<string, number> }> {
  const out = { stale: new Map<string, number>(), unanswered: new Map<string, number>() };
  for (const lead of await loadIdle(ownerIds)) {
    if (stale(lead, now)) out.stale.set(lead.ownerId, (out.stale.get(lead.ownerId) ?? 0) + 1);
    if (unanswered(lead, now)) out.unanswered.set(lead.ownerId, (out.unanswered.get(lead.ownerId) ?? 0) + 1);
  }
  return out;
}

/** Сколько лидов у человека висит без движения 7+ дней — для вечернего отчёта. */
export async function staleCounts(ownerIds: readonly string[], now: Date = new Date()): Promise<Map<string, number>> {
  return (await tidyCounts(ownerIds, now)).stale;
}

/** Один проход на заход — память процесса; отметки team_news_sent держат повтор после перезапуска. */
let doneSlot: string | null = null;

type Row = { id: string; role: string; display_name: string | null; telegram_user_id: number | null; notify_off: string[] | null };

/** Руководители и владелец под «Отчётами» — кроме того, о ком строка. */
function readersOf(team: readonly Row[], about: string): Row[] {
  return team.filter(
    (r) =>
      ["admin", "head"].includes(r.role) &&
      r.id !== about &&
      Number(r.telegram_user_id) &&
      wants(r.notify_off, "reports"),
  );
}

async function tellReaders(team: readonly Row[], about: string, key: string, text: string): Promise<void> {
  for (const r of readersOf(team, about)) {
    if (!(await claim(key, r.id))) continue;
    if (!(await sendMessage(Number(r.telegram_user_id), text))) await unclaim(key, r.id);
  }
}

export async function runLeadTidy(now: Date = new Date()): Promise<{ asked: number; lost: number }> {
  const result = { asked: 0, lost: 0 };
  // По рабочим дням и только в заходы 10:00 и 16:00 — ночью и в выходные
  // бот не пишет.
  if (!isWorkday(now)) return result;
  const slot = tidySlot(now);
  if (!slot) return result;
  const day = todayInTashkent(now);
  const mark = `${day}:${slot}`;
  if (doneSlot === mark) return result;
  const db = serviceClient();
  if (!db) return result;

  const { data: staff } = await db
    .from("staff")
    .select("id, role, display_name, telegram_user_id, notify_off")
    .eq("is_active", true);
  const team = (staff ?? []) as Row[];
  const active = new Set(team.map((s) => s.id));
  const nameOf = (id: string) => esc(String(team.find((s) => s.id === id)?.display_name ?? "—"));
  const leads = (await loadIdle()).filter((l) => active.has(l.ownerId));

  // 1. Забытые: 21+ день, спросили, три дня без ответа — «проиграли» с пометкой.
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
      meta: { owner: lead.ownerId, moved_at: lead.movedAt, asked_at: lead.firstAskedAt, days: AUTO_LOST_DAYS },
    });
    lostBy.set(nameOf(lead.ownerId), (lostBy.get(nameOf(lead.ownerId)) ?? 0) + 1);
    result.lost += 1;
  }
  const notice = autoLostNotice(lostBy);
  if (notice) {
    const key = `lead-autolost:${day}`;
    for (const r of readersOf(team, "")) {
      if (!(await claim(key, r.id))) continue;
      await sendMessage(Number(r.telegram_user_id), notice);
    }
  }
  const open = leads.filter((l) => !autoLose(l, now));

  // 2. Не отвечает боту два рабочих дня — руководителям строка в день на
  // человека. Утром: к вечеру число то же.
  if (slot === TIDY_SLOTS[0]) {
    const silentBy = new Map<string, number>();
    for (const lead of open) if (silentToBot(lead, now)) silentBy.set(lead.ownerId, 0);
    for (const lead of open) if (silentBy.has(lead.ownerId) && unanswered(lead, now)) silentBy.set(lead.ownerId, (silentBy.get(lead.ownerId) ?? 0) + 1);
    for (const [ownerId, n] of silentBy) {
      if (n) await tellReaders(team, ownerId, `lead-silent:${day}:${ownerId}`, botSilenceNotice(nameOf(ownerId), n));
    }
  }

  // 3. Вопрос — все неотвеченные: сводка и порции по восемь.
  const key = `lead-tidy:${mark}`;
  let retry = false;
  for (const [ownerId, mine] of pickToAsk(open, now)) {
    const person = team.find((s) => s.id === ownerId);
    const chat = Number(person?.telegram_user_id);
    if (!person || !Number.isFinite(chat) || chat === 0) continue;
    if (!(await claim(key, ownerId))) continue;
    if (!(await sendMessage(chat, tidySummary(mine.length, slot)))) {
      await unclaim(key, ownerId);
      retry = true;
      continue;
    }
    const parts = batches(mine);
    let from = 1;
    for (const [i, part] of parts.entries()) {
      const text = batchText(
        part.map((l) => ({
          label: `<a href="${enterUrl(`/admin/leads/${l.id}`)}">${esc(l.label)}</a>`,
          movedAt: l.movedAt,
          waitStreak: l.waitStreak,
        })),
        now,
        i + 1,
        parts.length,
        from,
      );
      const ok = await sendWithRows(chat, text, batchRows(part, from), { link_preview_options: { is_disabled: true } });
      from += part.length;
      if (!ok) continue;
      const ids = part.map((l) => l.id);
      await db.from("leads").update({ tidy_asked_at: now.toISOString() }).in("id", ids);
      // Первый вопрос без ответа — с него считаются «два рабочих дня» и три дня до «проиграли».
      await db.from("leads").update({ tidy_first_asked_at: now.toISOString() }).in("id", ids).is("tidy_first_asked_at", null);
      result.asked += part.length;
    }
  }
  // Не дошло до кого-то — следующий проход попробует снова.
  if (!retry) doneSlot = mark;
  return result;
}

export type TidyResult = "ok" | "forbidden" | "gone" | "failed" | "nowait";

type Keyboard = readonly (readonly { text: string; callback_data?: string }[])[];

/**
 * Нажатие под вопросом бота: «🏆», «❌», «⏳» у лида в порции или срок
 * следующего шага под вопросом «когда?».
 */
export async function answerTidy(
  staff: Staff,
  answer: TidyAnswer,
  leadId: string,
  chatId: number,
  messageId: number | null,
  keyboard: Keyboard | null = null,
  now: Date = new Date(),
): Promise<TidyResult> {
  const db = serviceClient();
  if (!db) return "failed";
  const { data: lead } = await db
    .from("leads")
    .select("id, status, assigned_staff_id, company, contact_name, request_no, tidy_wait_streak")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return "gone";
  if (lead.assigned_staff_id !== staff.id) return "forbidden";
  if (lead.status !== "taken") return "gone";
  const label = esc(String(lead.company || lead.contact_name || (lead.request_no ? `заявка ${lead.request_no}` : "лид без имени")));
  const streak = Number(lead.tidy_wait_streak ?? 0);
  const edit = async (a: "won" | "lost" | "wait") => {
    if (messageId && keyboard) await setButtons(chatId, messageId, afterPress(keyboard, leadId, a));
  };

  // «⏳» в порции — сначала спросить, когда следующий шаг.
  if (answer === "wait") {
    if (!canWait({ waitStreak: streak })) return "nowait";
    await edit("wait");
    await sendWithRows(chatId, whenText(label), [
      (Object.keys(TERMS) as (keyof typeof TERMS)[]).map((t) => ({ text: TERM_BUTTONS[t], callback_data: tidyCallback(t, leadId) })),
    ]);
    return "ok";
  }

  // Срок выбран — задача «Связаться» и тишина про лид до неё.
  if (isTerm(answer)) {
    if (!canWait({ waitStreak: streak })) return "nowait";
    const due = dueFor(answer, now);
    const made = await createTasks(
      { title: taskTitle(String(lead.company || lead.contact_name || "клиент")), body: taskBody(`${siteUrl}/admin/leads/${leadId}`), assigneeIds: [staff.id], due, projectId: null },
      staff,
      "",
      now,
    );
    const next = streak + 1;
    const { error } = await db
      .from("leads")
      .update({ tidy_snoozed_until: due.toISOString(), tidy_wait_streak: next, tidy_first_asked_at: null })
      .eq("id", leadId);
    if (error) return "failed";
    await record("lead.idle_snoozed", {
      actorStaffId: staff.id,
      targetType: "lead",
      targetId: leadId,
      meta: { until: due.toISOString(), streak: next, task: made.ok ? made.tasks[0]?.id ?? null : null },
    });
    if (messageId) await setButtons(chatId, messageId, [[{ text: taskSetText(label, due), callback_data: "noop" }]]);
    if (next === WAIT_LIMIT) {
      const { data: team } = await db.from("staff").select("id, role, display_name, telegram_user_id, notify_off").eq("is_active", true);
      await tellReaders((team ?? []) as Row[], staff.id, `lead-wait3:${leadId}:${next}`, thirdWaitNotice(esc(staff.display_name ?? "—"), label));
    }
    return "ok";
  }

  const done = await setStatus(leadId, answer, staff, "", "telegram");
  if (!done.ok) return done.reason === "forbidden" ? "forbidden" : done.reason === "gone" ? "gone" : "failed";
  await edit(answer);
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

async function unclaim(key: string, staffId: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("team_news_sent").delete().eq("news_id", key).eq("staff_id", staffId);
}
