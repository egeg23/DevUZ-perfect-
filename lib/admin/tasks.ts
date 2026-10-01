import { isWorkday, tashkentHour } from "@/lib/admin/portion";
import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";

/**
 * Задачи команды — правила без базы.
 *
 * Владелец, 01.10: «На главной странице показываются задачи, которые
 * поставили, срок выполнения… Все могут ставить задачи на всех. Тот, на кого
 * поставили, должен взять её в работу (можно через бота в тг сразу принять
 * задачу и там же нажать — сделано / не сделано / перенос срока)».
 *
 * Здесь — то, что легко сломать незаметно: переходы статусов, сроки по
 * Ташкенту, когда напоминать и что считать новым для браузера. Чистые
 * функции: «сейчас» приходит аргументом, и тест не зависит от часов машины.
 * База — lib/admin/task-store.ts, сообщения бота — lib/admin/task-bot.ts.
 */

export const TASK_STATUSES = ["new", "in_work", "done", "failed", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_EVENTS = ["created", "taken", "done", "failed", "moved", "cancelled"] as const;
export type TaskEvent = (typeof TASK_EVENTS)[number];

export const TITLE_MAX = 200;
export const BODY_MAX = 2000;

export type Task = {
  id: string;
  title: string;
  body: string;
  creator_id: string;
  assignee_id: string;
  /** Срок; null — без срока. */
  due_at: string | null;
  /** Проект из раздела «Проекты»; null — без проекта. */
  project_id: string | null;
  status: TaskStatus;
  created_at: string;
  taken_at: string | null;
  closed_at: string | null;
  updated_at: string;
  last_event: TaskEvent;
  last_actor_id: string | null;
  tg_chat: number | null;
  tg_message_id: number | null;
  notified_at: string | null;
  take_nudged_at: string | null;
  soon_nudged_at: string | null;
  overdue_sent_at: string | null;
  awaiting_date_at: string | null;
};

export function isOpen(status: TaskStatus): boolean {
  return status === "new" || status === "in_work";
}

export function isOverdue(task: Pick<Task, "status" | "due_at">, now: Date): boolean {
  return isOpen(task.status) && task.due_at !== null && Date.parse(task.due_at) <= now.getTime();
}

/**
 * Порядок по умолчанию — от ближайшего срока к дальнему; без срока — в
 * конце, свежие первыми. Владелец: «порядок задач от самой ближайшей даты
 * на выполнение к дальней».
 */
export function byDue(
  a: Pick<Task, "due_at" | "created_at">,
  b: Pick<Task, "due_at" | "created_at">,
): number {
  if (a.due_at && b.due_at) return Date.parse(a.due_at) - Date.parse(b.due_at);
  if (a.due_at) return -1;
  if (b.due_at) return 1;
  return Date.parse(b.created_at) - Date.parse(a.created_at);
}

/* ── Время по Ташкенту ─────────────────────────────────────────────────── */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const pad = (n: number) => String(n).padStart(2, "0");

/** Момент времени по часам Ташкента: год, месяц, день, часы, минуты → Date. */
function tashkentAt(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - TASHKENT_OFFSET_MS);
}

function shifted(now: Date): Date {
  return new Date(now.getTime() + TASHKENT_OFFSET_MS);
}

/** «05.10 15:00» — так срок пишется в боте и в истории. */
export function formatDue(at: Date | string): string {
  const t = shifted(typeof at === "string" ? new Date(at) : at);
  return `${pad(t.getUTCDate())}.${pad(t.getUTCMonth() + 1)} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`;
}

/** Значение для `<input type="datetime-local">` — по Ташкенту. */
export function localInputValue(at: Date): string {
  const t = shifted(at);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}T${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`;
}

/** Ташкентские часы в начале дня `daysAhead` дней спустя — например, «завтра 18:00». */
function dayAt(now: Date, daysAhead: number, hour: number): Date {
  const t = shifted(new Date(now.getTime() + daysAhead * DAY));
  return tashkentAt(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), hour, 0);
}

/** Конец рабочего дня — к нему привязаны быстрые сроки. */
export const DAY_END_HOUR = 18;

/**
 * Быстрые сроки формы «Поставить задачу».
 *
 * «Сегодня до 18:00» после шести вечера — уже прошлое: такой срок форма не
 * примет, а не подменит молча завтрашним.
 */
export const QUICK_DUES = ["today", "tomorrow", "3days"] as const;
export type QuickDue = (typeof QUICK_DUES)[number];

export function quickDue(kind: QuickDue, now: Date): Date {
  if (kind === "today") return dayAt(now, 0, DAY_END_HOUR);
  if (kind === "tomorrow") return dayAt(now, 1, DAY_END_HOUR);
  return dayAt(now, 3, DAY_END_HOUR);
}

/**
 * Перенос срока — варианты кнопок бота.
 *
 * Считаются от того, что позже: от срока или от «сейчас». Просроченная
 * задача, перенесённая «+1 час» от вчерашнего срока, оказалась бы снова в
 * прошлом — и человек получил бы второе «просрочено» сразу после переноса.
 */
export const MOVES = ["1h", "tomorrow", "3d", "week"] as const;
export type Move = (typeof MOVES)[number];

export function isMove(value: string): value is Move {
  return (MOVES as readonly string[]).includes(value);
}

export function movedDue(kind: Move, due: Date | null, now: Date): Date {
  // Задача без срока: варианты считаются от «сейчас».
  const base = new Date(Math.max(due?.getTime() ?? 0, now.getTime()));
  if (kind === "1h") return new Date(base.getTime() + HOUR);
  if (kind === "tomorrow") return dayAt(now, 1, DAY_END_HOUR);
  if (kind === "3d") return new Date(base.getTime() + 3 * DAY);
  return new Date(base.getTime() + 7 * DAY);
}

/**
 * Срок, который человек написал боту: «05.10 15:00», «5.10 9:00»,
 * «05.10.2026 15:00».
 *
 * Без года — ближайшая такая дата впереди: 05.01, написанное в декабре, —
 * это январь следующего года, а не прошлого. Невозможная дата («31.02»)
 * — null, а не первое марта.
 */
export function parseDueText(text: string, now: Date): Date | null {
  const m = /^\s*(\d{1,2})\.(\d{1,2})(?:\.(\d{2}|\d{4}))?\s+(\d{1,2})[:.](\d{2})\s*$/.exec(text);
  if (!m) return null;
  const [day, month, hour, minute] = [m[1], m[2], m[4], m[5]].map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const thisYear = shifted(now).getUTCFullYear();
  let year = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : thisYear;
  let at = tashkentAt(year, month, day, hour, minute);
  if (!m[3] && at.getTime() < now.getTime() - DAY) {
    year += 1;
    at = tashkentAt(year, month, day, hour, minute);
  }
  // Date.UTC переносит «31.02» на март — такую дату не принимаем.
  const check = shifted(at);
  if (check.getUTCDate() !== day || check.getUTCMonth() + 1 !== month) return null;
  return at;
}

/** Значение `<input type="datetime-local">` — это время по Ташкенту. */
export function parseLocalInput(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [year, month, day, hour, minute] = m.slice(1).map(Number);
  const at = tashkentAt(year, month, day, hour, minute);
  const check = shifted(at);
  if (check.getUTCDate() !== day || check.getUTCMonth() + 1 !== month) return null;
  return at;
}

/** Дальше года вперёд срок не ставим: это опечатка в годе, а не задача. */
export const DUE_MAX_DAYS = 366;

export type DueProblem = "past" | "far";

export function dueProblem(due: Date, now: Date): DueProblem | null {
  if (due.getTime() <= now.getTime()) return "past";
  if (due.getTime() - now.getTime() > DUE_MAX_DAYS * DAY) return "far";
  return null;
}

/* ── Кто что может ─────────────────────────────────────────────────────── */

export type TaskAction = "take" | "done" | "failed" | "move" | "cancel";

export type ActRefusal = "not_yours" | "closed" | "taken";

/**
 * Можно ли этому человеку сделать это с задачей.
 *
 * Взять, «Сделано» и «Не сделано» — только исполнитель: поставивший видит
 * статус, но «сделано» за другого не нажимает — иначе статус перестаёт
 * значить, что сделал тот, на ком задача. «Сделано» можно и без «Взять»:
 * сделал сразу — нечего брать.
 *
 * Срок переносят оба: исполнитель — когда не успевает, поставивший — когда
 * передумал. Отменяет только поставивший: задачу, которую ему поручили,
 * исполнитель не может просто стереть — для этого есть «Не сделано».
 */
export function canAct(
  task: Pick<Task, "assignee_id" | "creator_id" | "status">,
  staffId: string,
  action: TaskAction,
): ActRefusal | null {
  const mine =
    action === "move"
      ? task.assignee_id === staffId || task.creator_id === staffId
      : action === "cancel"
        ? task.creator_id === staffId
        : task.assignee_id === staffId;
  if (!mine) return "not_yours";
  if (!isOpen(task.status)) return "closed";
  if (action === "take" && task.status !== "new") return "taken";
  return null;
}

/** Статус после действия. */
export function statusAfter(action: Exclude<TaskAction, "move">): TaskStatus {
  if (action === "take") return "in_work";
  if (action === "cancel") return "cancelled";
  return action;
}

/** Кому сказать о шаге: другой стороне задачи. Себе — никому. */
export function notifyOf(task: Pick<Task, "assignee_id" | "creator_id">, actorId: string): string | null {
  if (task.assignee_id === task.creator_id) return null;
  if (actorId === task.assignee_id) return task.creator_id;
  if (actorId === task.creator_id) return task.assignee_id;
  return null;
}

/**
 * Задача себе — сразу «в работе».
 *
 * Брать в работу то, что сам себе поставил, — лишнее нажатие, а
 * напоминание «вы не взяли задачу» самому себе читалось бы как издёвка.
 */
export function initialStatus(creatorId: string, assigneeId: string): TaskStatus {
  return creatorId === assigneeId ? "in_work" : "new";
}

/* ── Когда писать ──────────────────────────────────────────────────────── */

/**
 * Сообщения о действиях людей — новая задача, взял, сделано, перенёс,
 * отменил — уходят сразу, в любой день. Владелец: «когда задача ставится —
 * человеку, на которого её поставили, бот пишет в Telegram». Молчит бот
 * только ночью, с 23:00 до 07:00 по Ташкенту: поставленное ночью придёт в
 * 07:00.
 */
export const QUIET_FROM_HOUR = 23;
export const QUIET_TO_HOUR = 7;

export function messageWindow(now: Date): boolean {
  const hour = tashkentHour(now);
  return hour >= QUIET_TO_HOUR && hour < QUIET_FROM_HOUR;
}

/**
 * Напоминания свипа — «не взяли», «через час срок», «просрочено» — в
 * рабочее время, как порция: по будням с 09:00 до 19:00 по Ташкенту.
 * Просрочилась ночью или в выходной — напоминание придёт утром рабочего дня.
 */
export const TASK_FROM_HOUR = 9;
export const TASK_TO_HOUR = 19;

export function taskWindow(now: Date): boolean {
  const hour = tashkentHour(now);
  return isWorkday(now) && hour >= TASK_FROM_HOUR && hour < TASK_TO_HOUR;
}

/** Не взяли за столько минут после того, как бот написал, — напомнить. */
export const TAKE_NUDGE_MINUTES = 30;
/** За столько до срока — «скоро срок». */
export const SOON_MINUTES = 60;

export type Nudge = "take" | "soon" | "overdue";

/**
 * Какие напоминания задаче пора отправить. Каждое — один раз: отметки
 * ставит свип после отправки.
 *
 * «Скоро срок» не шлётся задаче, у которой с самого начала было меньше часа:
 * человеку только что написали о ней, и через минуту второе сообщение о том
 * же — шум. «Не взяли» отсчитывается от сообщения бота, а не от постановки:
 * задача, поставленная ночью, утром не должна прийти сразу с упрёком.
 */
export function nudgesDue(
  task: Pick<
    Task,
    | "status"
    | "due_at"
    | "created_at"
    | "notified_at"
    | "take_nudged_at"
    | "soon_nudged_at"
    | "overdue_sent_at"
    | "updated_at"
    | "last_event"
  >,
  now: Date,
): Nudge[] {
  if (!isOpen(task.status)) return [];
  const t = now.getTime();
  const due = task.due_at ? Date.parse(task.due_at) : null;
  if (due !== null && due <= t) return task.overdue_sent_at ? [] : ["overdue"];

  const out: Nudge[] = [];
  if (
    task.status === "new" &&
    task.notified_at &&
    !task.take_nudged_at &&
    t - Date.parse(task.notified_at) >= TAKE_NUDGE_MINUTES * 60_000
  ) {
    out.push("take");
  }
  // От какого момента у задачи был этот срок: от постановки или от переноса.
  const since = task.last_event === "moved" ? Date.parse(task.updated_at) : Date.parse(task.created_at);
  if (due !== null && !task.soon_nudged_at && due - t <= SOON_MINUTES * 60_000 && due - since > SOON_MINUTES * 60_000) {
    out.push("soon");
  }
  return out;
}

/* ── Что нового для открытой панели ────────────────────────────────────── */

export type FeedItem = {
  id: string;
  kind: "assigned" | Exclude<TaskEvent, "created">;
  title: string;
  /** Кто сделал: поставил задачу или сменил её статус. */
  actorId: string | null;
  due_at: string | null;
};

/**
 * Что показать звуком и уведомлением тому, у кого открыта панель.
 *
 * Исполнителю — новая задача ему, перенос её срока и отмена; поставившему
 * — шаг по его задаче. Собственные нажатия не в счёт: человек, который
 * только что нажал «Сделано», не должен услышать звук о том, что он нажал
 * «Сделано».
 */
export function feedFor(
  rows: readonly Pick<Task, "id" | "title" | "creator_id" | "assignee_id" | "due_at" | "updated_at" | "last_event" | "last_actor_id">[],
  me: string,
  since: Date,
): FeedItem[] {
  const out: FeedItem[] = [];
  for (const row of rows) {
    if (Date.parse(row.updated_at) <= since.getTime()) continue;
    if (row.last_actor_id === me) continue;
    if (row.last_event === "created") {
      if (row.assignee_id === me) {
        out.push({ id: row.id, kind: "assigned", title: row.title, actorId: row.creator_id, due_at: row.due_at });
      }
      continue;
    }
    // Шаг поставившего — исполнителю; шаг исполнителя — поставившему.
    if (row.last_actor_id === row.creator_id ? row.assignee_id === me : row.creator_id === me) {
      out.push({ id: row.id, kind: row.last_event, title: row.title, actorId: row.last_actor_id, due_at: row.due_at });
    }
  }
  return out;
}

/** Опрос панели — раз в столько секунд, пока она открыта. */
export const FEED_POLL_SECONDS = 45;

/* ── Группы ────────────────────────────────────────────────────────────── */

/** Как сгруппировать списки: по умолчанию — никак, просто по сроку. */
export const TASK_GROUPS = ["none", "due", "project", "person"] as const;
export type TaskGroup = (typeof TASK_GROUPS)[number];

export function taskGroup(value: unknown): TaskGroup {
  return (TASK_GROUPS as readonly unknown[]).includes(value) ? (value as TaskGroup) : "none";
}

export const DUE_BUCKETS = ["overdue", "today", "tomorrow", "week", "later", "none"] as const;
export type DueBucket = (typeof DUE_BUCKETS)[number];

/** Корзина срока по календарю Ташкента: просрочено, сегодня, завтра, 7 дней, позже, без срока. */
export function dueBucket(task: Pick<Task, "status" | "due_at">, now: Date): DueBucket {
  if (!task.due_at) return "none";
  if (isOverdue(task, now)) return "overdue";
  const due = new Date(task.due_at);
  const days = Math.round((dayAt(due, 0, 0).getTime() - dayAt(now, 0, 0).getTime()) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 7) return "week";
  return "later";
}

/**
 * Разложить задачи по группам, не ломая порядка внутри: задачи уже идут от
 * ближайшего срока, и группа, в которой срок ближе, встаёт выше. Пустой
 * ключ (без проекта) — в конце.
 */
export function groupTasks<T extends Pick<Task, "status" | "due_at">>(
  tasks: readonly T[],
  keyOf: (task: T) => string,
  order?: readonly string[],
): { key: string; tasks: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const task of tasks) {
    const key = keyOf(task);
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }
  const keys = [...groups.keys()];
  if (order) keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  else keys.sort((a, b) => (a === "" ? 1 : 0) - (b === "" ? 1 : 0));
  return keys.map((key) => ({ key, tasks: groups.get(key)! }));
}

/** Как проект называется в задачах: «Клиент — Проект» или просто название. */
export function projectLabel(project: { title: string; client: string | null }): string {
  const client = project.client?.trim();
  return client && client !== project.title.trim() ? `${client} — ${project.title}` : project.title;
}
