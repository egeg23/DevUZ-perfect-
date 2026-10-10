import { record, type AuditAction } from "@/lib/admin/audit";
import { wants } from "@/lib/admin/notify-prefs";
import type { Staff } from "@/lib/admin/session";
import { OWN_DATE_WAIT_MINUTES, assignedText, nudgeText, stepText, taskRows } from "@/lib/admin/task-bot";
import {
  BODY_MAX,
  TITLE_MAX,
  byDue,
  canAct,
  dueProblem,
  feedFor,
  initialStatus,
  messageWindow,
  notifyOf,
  nudgesDue,
  projectLabel,
  statusAfter,
  taskWindow,
  type ActRefusal,
  type DueProblem,
  type FeedItem,
  type Nudge,
  type Task,
  type TaskAction,
  type TaskEvent,
} from "@/lib/admin/tasks";
import { editMessage, sendMessage, sendRowsForId, sendWithRows, setButtons, telegramReachable } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Задачи команды — база и Telegram.
 *
 * Правила (кто что может, сроки, когда напоминать) — lib/admin/tasks.ts,
 * тексты и кнопки бота — lib/admin/task-bot.ts. Здесь — чтение, запись,
 * журнал и доставка сообщений.
 *
 * Каждое сообщение бота сперва «занимается» в базе (отметка ставится
 * условно, только поверх пустой) и лишь потом уходит: кнопка в панели и
 * проход свипа, сработавшие в одну секунду, не пришлют его дважды. Если до
 * Telegram нет дороги, отметка снимается — сообщение уйдёт следующим
 * проходом.
 */

const COLUMNS =
  "id, title, body, creator_id, assignee_id, due_at, project_id, status, created_at, taken_at, closed_at, updated_at, last_event, last_actor_id, tg_chat, tg_message_id, notified_at, take_nudged_at, soon_nudged_at, overdue_sent_at, awaiting_date_at";

type Person = {
  id: string;
  display_name: string;
  telegram_user_id: number | null;
  notify_off: string[] | null;
  is_active: boolean;
};

async function peopleById(ids: readonly string[]): Promise<Map<string, Person>> {
  const db = serviceClient();
  const out = new Map<string, Person>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!db || !unique.length) return out;
  const { data } = await db
    .from("staff")
    .select("id, display_name, telegram_user_id, notify_off, is_active")
    .in("id", unique);
  for (const row of (data as Person[] | null) ?? []) out.set(row.id, row);
  return out;
}

/** Кому можно поставить задачу: все, кто работает, — и себе тоже. */
export async function taskPeople(): Promise<{ id: string; display_name: string }[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("staff")
    .select("id, display_name")
    .eq("is_active", true)
    .order("display_name", { ascending: true });
  return (data as { id: string; display_name: string }[] | null) ?? [];
}

/** Проекты, к которым можно отнести задачу: все, что не закрыты. */
export async function taskProjects(): Promise<{ id: string; label: string }[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("projects")
    .select("id, title, client")
    .not("stage", "in", "(done,cancelled)")
    .order("created_at", { ascending: false })
    .limit(300);
  return ((data as { id: string; title: string; client: string | null }[] | null) ?? []).map((p) => ({
    id: p.id,
    label: projectLabel(p),
  }));
}

/** Названия проектов по id — для подписи у задачи, в том числе у закрытых проектов. */
async function projectLabels(ids: readonly (string | null)[]): Promise<Map<string, string>> {
  const db = serviceClient();
  const out = new Map<string, string>();
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!db || !unique.length) return out;
  const { data } = await db.from("projects").select("id, title, client").in("id", unique);
  for (const p of (data as { id: string; title: string; client: string | null }[] | null) ?? []) {
    out.set(p.id, projectLabel(p));
  }
  return out;
}

export async function taskById(id: string): Promise<Task | null> {
  const db = serviceClient();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("staff_tasks").select(COLUMNS).eq("id", id).maybeSingle();
  return (data as Task | null) ?? null;
}

/* ── Главная панели ────────────────────────────────────────────────────── */

export type TaskBoard = {
  offline: boolean;
  /** На мне: новые и в работе, ближайший срок сверху. */
  mine: Task[];
  /** Поставил я другим: открытые и закрытые за неделю. */
  given: Task[];
  names: Map<string, string>;
  /** Подписи проектов у задач. */
  projects: Map<string, string>;
};

/** Закрытые задачи в «Я поставил» видны неделю — чтобы успеть увидеть итог. */
export const GIVEN_CLOSED_DAYS = 7;

export async function taskBoard(staffId: string, now: Date = new Date()): Promise<TaskBoard> {
  const db = serviceClient();
  const empty: TaskBoard = { offline: true, mine: [], given: [], names: new Map(), projects: new Map() };
  if (!db) return empty;

  const since = new Date(now.getTime() - GIVEN_CLOSED_DAYS * 24 * 3_600_000).toISOString();
  const [mine, given] = await Promise.all([
    db
      .from("staff_tasks")
      .select(COLUMNS)
      .eq("assignee_id", staffId)
      .in("status", ["new", "in_work"])
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(100),
    db
      .from("staff_tasks")
      .select(COLUMNS)
      .eq("creator_id", staffId)
      .neq("assignee_id", staffId)
      .or(`status.in.(new,in_work),closed_at.gte.${since}`)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(100),
  ]);
  if (mine.error || given.error) return empty;

  const mineRows = ((mine.data as Task[] | null) ?? []).sort(byDue);
  const givenRows = ((given.data as Task[] | null) ?? []).sort(openFirst);
  const all = [...mineRows, ...givenRows];
  const [people, projects] = await Promise.all([
    peopleById(all.flatMap((t) => [t.creator_id, t.assignee_id])),
    projectLabels(all.map((t) => t.project_id)),
  ]);
  return {
    offline: false,
    mine: mineRows,
    given: givenRows,
    names: new Map([...people.values()].map((p) => [p.id, p.display_name])),
    projects,
  };
}

/** Открытые — сверху, от ближайшего срока; закрытые — ниже, свежие первыми. */
function openFirst(a: Task, b: Task): number {
  const ao = a.closed_at ? 1 : 0;
  const bo = b.closed_at ? 1 : 0;
  if (ao !== bo) return ao - bo;
  return ao ? Date.parse(b.closed_at!) - Date.parse(a.closed_at!) : byDue(a, b);
}

export type ProjectTasks = { tasks: Task[]; names: Map<string, string> };

/** Задачи проекта — для его карточки: открытые сверху, закрытые за всё время ниже. */
export async function projectTasks(projectId: string): Promise<ProjectTasks> {
  const db = serviceClient();
  if (!db) return { tasks: [], names: new Map() };
  const { data } = await db
    .from("staff_tasks")
    .select(COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(200);
  const tasks = ((data as Task[] | null) ?? []).sort(openFirst);
  const people = await peopleById(tasks.flatMap((t) => [t.creator_id, t.assignee_id]));
  return { tasks, names: new Map([...people.values()].map((p) => [p.id, p.display_name])) };
}

/* ── Поставить ─────────────────────────────────────────────────────────── */

export type CreateRefusal = "offline" | "title" | "body" | "assignee" | "project" | DueProblem | "failed";
export type CreateResult = { ok: true; task: Task } | { ok: false; reason: CreateRefusal };

export async function createTask(
  input: { title: string; body: string; assigneeId: string; due: Date | null; projectId: string | null },
  actor: Staff,
  ip: string,
  now: Date = new Date(),
): Promise<CreateResult> {
  const title = input.title.trim().replace(/\s+/g, " ");
  const body = input.body.trim();
  if (!title || title.length > TITLE_MAX) return { ok: false, reason: "title" };
  if (body.length > BODY_MAX) return { ok: false, reason: "body" };
  const problem = input.due ? dueProblem(input.due, now) : null;
  if (problem) return { ok: false, reason: problem };

  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const assignee = (await peopleById([input.assigneeId])).get(input.assigneeId);
  if (!assignee?.is_active) return { ok: false, reason: "assignee" };
  if (input.projectId && !(await projectLabels([input.projectId])).has(input.projectId)) {
    return { ok: false, reason: "project" };
  }

  const self = assignee.id === actor.id;
  const at = now.toISOString();
  const { data, error } = await db
    .from("staff_tasks")
    .insert({
      title,
      body,
      creator_id: actor.id,
      assignee_id: assignee.id,
      due_at: input.due?.toISOString() ?? null,
      project_id: input.projectId,
      status: initialStatus(actor.id, assignee.id),
      created_at: at,
      updated_at: at,
      taken_at: self ? at : null,
      last_event: "created",
      last_actor_id: actor.id,
      // Себе бот о новой задаче не пишет: человек только что её поставил.
      notified_at: self ? at : null,
    })
    .select(COLUMNS)
    .single();
  if (error || !data) {
    console.error("задачи: не записалась", error?.message);
    return { ok: false, reason: "failed" };
  }
  const task = data as Task;

  await db.from("staff_task_events").insert({ task_id: task.id, actor_id: actor.id, kind: "created", new_due: task.due_at, at });
  await record("task.created", {
    actorStaffId: actor.id,
    targetType: "task",
    targetId: task.id,
    ip,
    meta: { assignee: assignee.id, due_at: task.due_at, project: task.project_id },
  });
  return { ok: true, task };
}

/** Сколько человек можно отметить в одной постановке. */
export const ASSIGNEES_MAX = 30;

export type CreateManyResult =
  | { ok: true; tasks: Task[]; missed: number }
  | { ok: false; reason: CreateRefusal | "no_assignee" };

/**
 * Одна постановка — нескольким сразу (владелец, 04.10: «возможность ставить
 * задачу на несколько человек сразу»).
 *
 * Каждому — своя задача с тем же текстом, сроком и проектом, а не одна на
 * всех: взять, закрыть и перенести её каждый должен сам, иначе «сделано»
 * одного закрывало бы задачу за всех, и в «Я поставил» не было бы видно,
 * кто ещё не взялся.
 *
 * Люди проверяются до первой записи: отключённый в списке — не ставим
 * никому, чтобы не пришлось разбираться, кому успело уйти. Сбой базы на
 * середине честно возвращает, сколько не записалось.
 */
export async function createTasks(
  input: { title: string; body: string; assigneeIds: readonly string[]; due: Date | null; projectId: string | null },
  actor: Staff,
  ip: string,
  now: Date = new Date(),
): Promise<CreateManyResult> {
  const ids = [...new Set(input.assigneeIds.map((id) => id.trim()).filter(Boolean))];
  if (!ids.length) return { ok: false, reason: "no_assignee" };
  if (ids.length > ASSIGNEES_MAX) return { ok: false, reason: "assignee" };
  if (ids.length > 1) {
    const people = await peopleById(ids);
    if (ids.some((id) => !people.get(id)?.is_active)) return { ok: false, reason: "assignee" };
  }

  const tasks: Task[] = [];
  for (const assigneeId of ids) {
    const result = await createTask({ ...input, assigneeId }, actor, ip, now);
    if (!result.ok) {
      // Первая не легла — значит, не ляжет ни одна: причина общая.
      if (!tasks.length) return result;
      return { ok: true, tasks, missed: ids.length - tasks.length };
    }
    tasks.push(result.task);
  }
  return { ok: true, tasks, missed: 0 };
}

/* ── Взять, закрыть, перенести ─────────────────────────────────────────── */

export type ActResult =
  | { ok: true; task: Task; eventId: number | null }
  | { ok: false; reason: ActRefusal | DueProblem | "offline" | "gone" | "changed" | "failed" };

const EVENT_OF: Record<TaskAction, Exclude<TaskEvent, "created">> = {
  take: "taken",
  done: "done",
  failed: "failed",
  move: "moved",
  cancel: "cancelled",
};

const AUDIT_OF: Record<Exclude<TaskEvent, "created">, AuditAction> = {
  taken: "task.taken",
  done: "task.done",
  failed: "task.failed",
  moved: "task.moved",
  cancelled: "task.cancelled",
};

/**
 * Действие по задаче — исполнителя или поставившего (кто что может —
 * canAct). Пишется поверх того состояния, которое он видел
 * (`updated_at`): два нажатия — в панели и в боте — не закроют задачу
 * дважды и не перенесут срок поверх только что перенесённого.
 */
export async function actOnTask(
  taskId: string,
  actor: Staff,
  action: TaskAction,
  options: { ip: string; via: "panel" | "telegram"; newDue?: Date },
  now: Date = new Date(),
): Promise<ActResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  const task = await taskById(taskId);
  if (!task) return { ok: false, reason: "gone" };

  const refusal = canAct(task, actor.id, action);
  if (refusal) return { ok: false, reason: refusal };

  const at = now.toISOString();
  const kind = EVENT_OF[action];
  const patch: Record<string, unknown> = { updated_at: at, last_event: kind, last_actor_id: actor.id };
  if (action === "move") {
    if (!options.newDue) return { ok: false, reason: "past" };
    const problem = dueProblem(options.newDue, now);
    if (problem) return { ok: false, reason: problem };
    // К новому сроку — новые «скоро» и «просрочено».
    Object.assign(patch, {
      due_at: options.newDue.toISOString(),
      soon_nudged_at: null,
      overdue_sent_at: null,
      awaiting_date_at: null,
    });
  } else {
    patch.status = statusAfter(action);
    patch.awaiting_date_at = null;
    if (!task.taken_at && action !== "cancel") patch.taken_at = at;
    if (action !== "take") patch.closed_at = at;
  }

  const { data, error } = await db
    .from("staff_tasks")
    .update(patch)
    .eq("id", task.id)
    .eq("updated_at", task.updated_at)
    .select(COLUMNS)
    .maybeSingle();
  if (error) return { ok: false, reason: "failed" };
  if (!data) return { ok: false, reason: "changed" };
  const next = data as Task;

  const notify = notifyOf(task, actor.id);
  const { data: event } = await db
    .from("staff_task_events")
    .insert({
      task_id: task.id,
      actor_id: actor.id,
      kind,
      old_due: action === "move" ? task.due_at : null,
      new_due: action === "move" ? next.due_at : null,
      at,
      notify_staff_id: notify,
    })
    .select("id")
    .maybeSingle();

  await record(AUDIT_OF[kind], {
    actorStaffId: actor.id,
    targetType: "task",
    targetId: task.id,
    ip: options.ip,
    meta: {
      via: options.via,
      ...(action === "move" ? { old_due: task.due_at, new_due: next.due_at } : {}),
    },
  });
  return { ok: true, task: next, eventId: notify ? ((event?.id as number | undefined) ?? null) : null };
}

/**
 * Карточка задачи в Telegram — заново, из данных задачи: текст и кнопки.
 *
 * Раньше после действия переписывались только кнопки, и после переноса
 * срока в карточке так и стоял прежний «Срок: …» (владелец, 10.10.2026:
 * «Когда я меняю дату через тг бота, дата в задаче этой не меняется в
 * чате»). Текст собирается тем же assignedText, что и при отправке, — из
 * базы, а не из колбэка, поэтому разметка не теряется. Не вышло переписать
 * текст — хотя бы кнопки.
 */
export async function showTask(task: Task, where: { chat: number | string; messageId: number }): Promise<void> {
  const people = await peopleById([task.creator_id]);
  const project = task.project_id ? (await projectLabels([task.project_id])).get(task.project_id) : null;
  const text = assignedText(task, people.get(task.creator_id)?.display_name ?? "—", project);
  if (await editMessage(where.chat, where.messageId, text, taskRows(task))) return;
  await setButtons(where.chat, where.messageId, taskRows(task));
}

/**
 * Что сделать после действия: переписать карточку задачи у исполнителя
 * (если нажимали в панели — в Telegram она должна стать такой же: кнопки и
 * срок) и сказать поставившему. `except` — сообщение, которое уже переписал
 * сам колбэк: второй раз тем же Telegram править не даёт.
 */
export async function afterAct(
  task: Task,
  eventId: number | null,
  now: Date = new Date(),
  except?: { chat: number; messageId: number },
): Promise<void> {
  if (
    task.tg_chat &&
    task.tg_message_id &&
    !(except && Number(task.tg_chat) === except.chat && Number(task.tg_message_id) === except.messageId)
  ) {
    await showTask(task, { chat: task.tg_chat, messageId: Number(task.tg_message_id) });
  }
  if (eventId !== null && messageWindow(now)) await deliverEvent(eventId);
}

/* ── «Своя дата» в боте ────────────────────────────────────────────────── */

/** Исполнитель нажал «Своя дата»: бот ждёт от него текст со сроком. */
export async function awaitDate(taskId: string, staffId: string, now: Date = new Date()): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db
    .from("staff_tasks")
    .update({ awaiting_date_at: now.toISOString() })
    .eq("id", taskId)
    .eq("assignee_id", staffId)
    .in("status", ["new", "in_work"])
    .select("id");
  return Boolean(data?.length);
}

/** Задача, для которой этот человек сейчас пишет срок. */
export async function taskAwaitingDate(staffId: string, now: Date = new Date()): Promise<Task | null> {
  const db = serviceClient();
  if (!db) return null;
  const since = new Date(now.getTime() - OWN_DATE_WAIT_MINUTES * 60_000).toISOString();
  const { data } = await db
    .from("staff_tasks")
    .select(COLUMNS)
    .eq("assignee_id", staffId)
    .in("status", ["new", "in_work"])
    .gte("awaiting_date_at", since)
    .order("awaiting_date_at", { ascending: false })
    .limit(1);
  return ((data as Task[] | null) ?? [])[0] ?? null;
}

/* ── Доставка ──────────────────────────────────────────────────────────── */

const chatOf = (p: Person | undefined) =>
  p?.is_active && p.telegram_user_id ? Number(p.telegram_user_id) : null;

/**
 * Сообщение исполнителю о новой задаче. false — до Telegram нет дороги,
 * попробуем следующим проходом свипа.
 */
export async function deliverAssignment(taskId: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const at = new Date().toISOString();
  const { data } = await db
    .from("staff_tasks")
    .update({ notified_at: at })
    .eq("id", taskId)
    .is("notified_at", null)
    .in("status", ["new", "in_work"])
    .select(COLUMNS)
    .maybeSingle();
  const task = data as Task | null;
  if (!task) return true;

  const people = await peopleById([task.creator_id, task.assignee_id]);
  const assignee = people.get(task.assignee_id);
  const chat = chatOf(assignee);
  // Выключил «Задачи» или боту не писал — задача ждёт его на главной панели.
  if (!chat || !wants(assignee?.notify_off, "tasks")) return true;

  const project = task.project_id ? (await projectLabels([task.project_id])).get(task.project_id) : null;
  const text = assignedText(task, people.get(task.creator_id)?.display_name ?? "—", project);
  const messageId = await sendRowsForId(chat, text, taskRows(task));
  if (messageId === null) {
    if (await telegramReachable()) return true;
    await db.from("staff_tasks").update({ notified_at: null }).eq("id", task.id);
    return false;
  }
  await db.from("staff_tasks").update({ tg_chat: chat, tg_message_id: messageId || null }).eq("id", task.id);
  return true;
}

/** Постановщику — шаг по его задаче. */
export async function deliverEvent(eventId: number): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db
    .from("staff_task_events")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", eventId)
    .is("notified_at", null)
    .select("id, task_id, actor_id, kind, new_due, notify_staff_id")
    .maybeSingle();
  if (!data?.notify_staff_id) return true;

  const task = await taskById(data.task_id as string);
  const people = await peopleById([data.notify_staff_id as string, (data.actor_id as string | null) ?? ""]);
  const reader = people.get(data.notify_staff_id as string);
  const chat = chatOf(reader);
  if (!task || !chat || !wants(reader?.notify_off, "tasks")) return true;

  const text = stepText(
    data.kind as Exclude<TaskEvent, "created">,
    people.get(data.actor_id as string)?.display_name ?? "—",
    task,
    data.new_due as string | null,
  );
  if (await sendMessage(chat, text)) return true;
  if (await telegramReachable()) return true;
  await db.from("staff_task_events").update({ notified_at: null }).eq("id", eventId);
  return false;
}

const NUDGE_COLUMN: Record<Nudge, "take_nudged_at" | "soon_nudged_at" | "overdue_sent_at"> = {
  take: "take_nudged_at",
  soon: "soon_nudged_at",
  overdue: "overdue_sent_at",
};

/** Занять напоминание: true — оно наше, и до нас его никто не слал. */
async function claimNudge(taskId: string, nudge: Nudge, at: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const column = NUDGE_COLUMN[nudge];
  const { data } = await db
    .from("staff_tasks")
    .update({ [column]: at })
    .eq("id", taskId)
    .is(column, null)
    .select("id");
  return Boolean(data?.length);
}

export type TaskSweep = { assigned: number; steps: number; nudges: number; errors: string[] };

/** Сколько за один проход — как у напоминаний по лидам: не вываливать сотню разом. */
const SWEEP_BATCH = 25;

/**
 * Проход свипа: досылает то, что ночью ждало утра, и напоминает о сроках.
 *
 * Вне рабочего времени не делает ничего — всё дождётся утра. Telegram
 * недоступен — тоже ничего: отметки «напомнили» ставятся до отправки, и
 * без этой проверки напоминания сгорели бы, не дойдя.
 */
export async function runTaskSweep(now: Date = new Date()): Promise<TaskSweep> {
  const out: TaskSweep = { assigned: 0, steps: 0, nudges: 0, errors: [] };
  if (!messageWindow(now)) return out;
  const db = serviceClient();
  if (!db) return out;
  if (!(await telegramReachable())) {
    out.errors.push("Telegram недоступен");
    return out;
  }

  // 1. Новые задачи, о которых бот ещё не написал (поставили ночью или
  //    Telegram не отвечал).
  const { data: unsent } = await db
    .from("staff_tasks")
    .select("id")
    .is("notified_at", null)
    .in("status", ["new", "in_work"])
    .order("created_at", { ascending: true })
    .limit(SWEEP_BATCH);
  for (const row of unsent ?? []) {
    if (await deliverAssignment(row.id as string)) out.assigned += 1;
  }

  // 2. Шаги по задачам, о которых другая сторона ещё не знает.
  const { data: events } = await db
    .from("staff_task_events")
    .select("id")
    .not("notify_staff_id", "is", null)
    .is("notified_at", null)
    .order("at", { ascending: true })
    .limit(SWEEP_BATCH);
  for (const row of events ?? []) {
    if (await deliverEvent(row.id as number)) out.steps += 1;
  }

  // 3. Напоминания: не взяли, скоро срок, просрочено — только в рабочее время.
  if (!taskWindow(now)) return out;
  const { data: open, error } = await db
    .from("staff_tasks")
    .select(COLUMNS)
    .in("status", ["new", "in_work"])
    .order("due_at", { ascending: true })
    .limit(500);
  if (error) {
    out.errors.push(`задачи: ${error.message}`);
    return out;
  }
  const due = ((open as Task[] | null) ?? [])
    .map((task) => ({ task, nudges: nudgesDue(task, now) }))
    .filter((t) => t.nudges.length);
  const people = await peopleById(due.flatMap((t) => [t.task.creator_id, t.task.assignee_id]));
  const at = now.toISOString();

  for (const { task, nudges } of due) {
    for (const nudge of nudges) {
      if (out.nudges >= SWEEP_BATCH) return out;
      if (!(await claimNudge(task.id, nudge, at))) continue;
      const assignee = people.get(task.assignee_id);
      const chat = chatOf(assignee);
      if (chat && wants(assignee?.notify_off, "tasks")) {
        if (await sendWithRows(chat, nudgeText(nudge, task, "assignee"), taskRows(task))) out.nudges += 1;
      }
      // Просрочено — один раз и поставившему, если это не он сам.
      if (nudge === "overdue" && task.creator_id !== task.assignee_id) {
        const creator = people.get(task.creator_id);
        const creatorChat = chatOf(creator);
        if (creatorChat && wants(creator?.notify_off, "tasks")) {
          await sendMessage(creatorChat, nudgeText("overdue", task, "creator", assignee?.display_name ?? "—"));
        }
      }
    }
  }
  return out;
}

/* ── Открытая панель ───────────────────────────────────────────────────── */

export type TaskFeed = { items: (FeedItem & { actorName: string })[] };

/** Что нового для меня с момента `since` — для звука и уведомления в браузере. */
export async function taskFeed(staffId: string, since: Date, until: Date): Promise<TaskFeed> {
  const db = serviceClient();
  if (!db) return { items: [] };
  const { data } = await db
    .from("staff_tasks")
    .select("id, title, creator_id, assignee_id, due_at, updated_at, last_event, last_actor_id")
    .or(`assignee_id.eq.${staffId},creator_id.eq.${staffId}`)
    .gt("updated_at", since.toISOString())
    // Верхняя граница — тот же момент, что уйдёт панели как следующий
    // `since`: иначе изменение на стыке двух опросов прозвенело бы дважды.
    .lte("updated_at", until.toISOString())
    .order("updated_at", { ascending: false })
    .limit(20);
  const items = feedFor((data as Task[] | null) ?? [], staffId, since);
  const people = await peopleById(items.map((i) => i.actorId ?? ""));
  return { items: items.map((i) => ({ ...i, actorName: people.get(i.actorId ?? "")?.display_name ?? "—" })) };
}
