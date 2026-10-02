import { esc, type Button } from "@/lib/qualify/telegram";
import { formatDue, type Move, type Nudge, type Task, type TaskEvent, type TaskStatus } from "@/lib/admin/tasks";

/**
 * Задачи в Telegram: тексты и кнопки.
 *
 * Бот пишет по-русски, пока не научен языку панели (CLAUDE.md). Кнопки —
 * под одним и тем же сообщением исполнителю: «Взять в работу», после него —
 * «Сделано», «Не сделано», «Перенести срок». Сообщение не плодится: каждое
 * нажатие переписывает кнопки под ним, и в чате остаётся одна карточка
 * задачи, а не лента её состояний.
 *
 * Полезная нагрузка кнопок — `tk:<действие>:<id задачи>`: до 64 байт,
 * как требует Telegram, с запасом.
 */

export const TASK_CALLBACK = "tk";

export const BOT_LABEL = {
  take: "✅ Взять в работу",
  done: "✅ Сделано",
  failed: "✖ Не сделано",
  move: "🕑 Перенести срок",
  own: "✏️ Своя дата",
  back: "← Назад",
} as const;

export const MOVE_LABEL: Record<Move, string> = {
  "1h": "+1 час",
  tomorrow: "Завтра 18:00",
  "3d": "+3 дня",
  week: "Неделя",
};

const cb = (action: string, id: string) => `${TASK_CALLBACK}:${action}:${id}`;

/** Надпись вместо кнопок у закрытой задачи. */
export function closedLabel(status: TaskStatus): string {
  if (status === "cancelled") return "🚫 Задача отменена";
  return status === "done" ? "✅ Сделано" : "✖ Не сделано";
}

/** Кнопки под сообщением исполнителю — по статусу задачи. */
export function taskRows(task: Pick<Task, "id" | "status">): Button[][] {
  if (task.status === "new") {
    return [[{ text: BOT_LABEL.take, callback_data: cb("take", task.id) }]];
  }
  if (task.status === "in_work") {
    return [
      [
        { text: BOT_LABEL.done, callback_data: cb("done", task.id) },
        { text: BOT_LABEL.failed, callback_data: cb("failed", task.id) },
      ],
      [{ text: BOT_LABEL.move, callback_data: cb("move", task.id) }],
    ];
  }
  return [[{ text: closedLabel(task.status), callback_data: cb("noop", task.id) }]];
}

/** «Перенести срок» — варианты. «Своя дата» ждёт текст «05.10 15:00». */
export function moveRows(taskId: string): Button[][] {
  return [
    [
      { text: MOVE_LABEL["1h"], callback_data: cb("1h", taskId) },
      { text: MOVE_LABEL.tomorrow, callback_data: cb("tomorrow", taskId) },
    ],
    [
      { text: MOVE_LABEL["3d"], callback_data: cb("3d", taskId) },
      { text: MOVE_LABEL.week, callback_data: cb("week", taskId) },
    ],
    [{ text: BOT_LABEL.own, callback_data: cb("own", taskId) }],
    [{ text: BOT_LABEL.back, callback_data: cb("back", taskId) }],
  ];
}

/** Срок в сообщении: «05.10 15:00» или «без срока». */
export function dueText(due: string | null): string {
  return due ? formatDue(due) : "без срока";
}

type Shown = Pick<Task, "title" | "body" | "due_at">;

function taskLines(task: Shown, project?: string | null): string[] {
  return [
    `<b>${esc(task.title)}</b>`,
    ...(task.body.trim() ? [esc(task.body.trim())] : []),
    "",
    ...(project ? [`Проект: ${esc(project)}`] : []),
    `Срок: <b>${dueText(task.due_at)}</b>`,
  ];
}

/** Сообщение исполнителю о новой задаче. */
export function assignedText(task: Shown, creatorName: string, project?: string | null): string {
  return [`📌 <b>Новая задача</b> от ${esc(creatorName)}`, "", ...taskLines(task, project)].join("\n");
}

/**
 * Другой стороне — каждый шаг: поставившему — что сделал исполнитель,
 * исполнителю — перенос срока и отмену от поставившего.
 */
export function stepText(
  kind: Exclude<TaskEvent, "created">,
  actorName: string,
  task: Pick<Task, "title">,
  newDue?: string | null,
): string {
  const who = esc(actorName);
  const what = `«${esc(task.title)}»`;
  if (kind === "taken") return `▶️ ${who} взял(а) в работу задачу ${what}`;
  if (kind === "done") return `✅ ${who}: задача ${what} — сделано`;
  if (kind === "failed") return `✖ ${who}: задача ${what} — не сделано`;
  if (kind === "cancelled") return `🚫 ${who} отменил(а) задачу ${what}`;
  return `🕑 ${who} перенёс(ла) срок задачи ${what} на <b>${dueText(newDue ?? null)}</b>`;
}

/** Напоминания свипа. «Просрочено» уходит и исполнителю, и постановщику — текст у них разный. */
export function nudgeText(
  kind: Nudge,
  task: Shown,
  to: "assignee" | "creator",
  assigneeName = "",
): string {
  if (kind === "take") {
    return ["⏰ <b>Задачу ещё не взяли в работу</b>", "", ...taskLines(task)].join("\n");
  }
  if (kind === "soon") {
    return ["⏰ <b>Через час срок задачи</b>", "", ...taskLines(task)].join("\n");
  }
  if (to === "creator") {
    return [`⚠️ <b>Просрочена задача</b> у ${esc(assigneeName)}`, "", ...taskLines(task)].join("\n");
  }
  return ["⚠️ <b>Срок задачи прошёл</b>", "", ...taskLines(task), "", "Сделайте, отметьте «Не сделано» или перенесите срок."].join("\n");
}

export const OWN_DATE_PROMPT =
  "Напишите новый срок одним сообщением — день, месяц и время по Ташкенту, например <code>05.10 15:00</code>.";

/** Похоже ли сообщение на срок — только тогда стоит искать задачу, которая его ждёт. */
export function looksLikeDue(text: string | undefined): boolean {
  return /^\s*\d{1,2}\.\d{1,2}(?:\.\d{2,4})?\s+\d{1,2}[:.]\d{2}\s*$/.test(text ?? "");
}

/** Сколько бот ждёт «своей даты» после нажатия. Потом сообщение — обычный текст. */
export const OWN_DATE_WAIT_MINUTES = 30;
