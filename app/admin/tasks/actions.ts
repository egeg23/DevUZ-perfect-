"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { requestIp, requireStaff } from "@/lib/admin/guard";
import { actOnTask, afterAct, createTask, deliverAssignment, taskById } from "@/lib/admin/task-store";
import {
  QUICK_DUES,
  isMove,
  messageWindow,
  movedDue,
  parseLocalInput,
  quickDue,
  type QuickDue,
  type TaskAction,
} from "@/lib/admin/tasks";
import type { taskNoticeDict } from "@/content/admin-panel/tasks";

/**
 * Действия блока «Задачи» на главной и на карточке проекта.
 *
 * Итог едет обратно кодом `?t=` в адресе, как у остальных действий панели:
 * после редиректа состояние в памяти теряется, а параметр переживает и
 * перезагрузку. Текст по коду — в словаре (content/admin-panel/tasks.ts).
 * Куда вернуться — поле `back`: главная или карточка проекта.
 */

type NoticeCode = keyof typeof taskNoticeDict;

/** Вернуться можно только в панель: на главную или в карточку проекта. */
function backPath(formData: FormData): string {
  const raw = String(formData.get("back") ?? "");
  return /^\/admin\/projects\/[0-9a-f-]{36}$/i.test(raw) ? raw : "/admin";
}

function back(formData: FormData, code: NoticeCode): never {
  const path = backPath(formData);
  revalidatePath(path);
  const keep = path === "/admin" ? keepFilters(formData) : "";
  redirect(`${path}?t=${code}${keep}#tasks`);
}

/** Фильтр блока («Группировать», «Проект») переживает нажатие кнопки. */
function keepFilters(formData: FormData): string {
  const out = new URLSearchParams();
  for (const key of ["tg", "tf"]) {
    const value = String(formData.get(key) ?? "");
    if (/^[a-z0-9-]{1,40}$/i.test(value)) out.set(key, value);
  }
  const query = out.toString();
  return query ? `&${query}` : "";
}

const REASON: Record<string, NoticeCode> = {
  title: "title",
  body: "body",
  assignee: "assignee",
  project: "project",
  past: "past",
  far: "far",
  not_yours: "notYours",
  closed: "closed",
  taken: "alreadyTaken",
  changed: "changed",
  gone: "closed",
  offline: "offline",
  failed: "failedTry",
};

/** Срок из формы: быстрый вариант, своя дата (по Ташкенту) или без срока. */
function dueFrom(formData: FormData, now: Date): Date | null | "bad" {
  const kind = String(formData.get("due") ?? "");
  if (kind === "none") return null;
  if ((QUICK_DUES as readonly string[]).includes(kind)) return quickDue(kind as QuickDue, now);
  return parseLocalInput(String(formData.get("due_at") ?? "")) ?? "bad";
}

export async function createTaskAction(formData: FormData) {
  const staff = await requireStaff();
  const now = new Date();
  const due = dueFrom(formData, now);
  if (due === "bad") back(formData, "past");
  const project = String(formData.get("project") ?? "");

  const result = await createTask(
    {
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      assigneeId: String(formData.get("assignee") ?? ""),
      due,
      projectId: project || null,
    },
    staff,
    await requestIp(),
    now,
  );
  if (!result.ok) back(formData, REASON[result.reason] ?? "failedTry");

  const { task } = result;
  if (task.assignee_id === staff.id) back(formData, "created");
  // Сообщение исполнителю — сразу после ответа: ждать Telegram ради
  // редиректа незачем. Ночью (23:00–07:00) — в 07:00, проходом свипа.
  if (messageWindow(now)) {
    after(async () => {
      await deliverAssignment(task.id).catch((error) => console.error("задачи: сообщение исполнителю", error));
    });
    back(formData, "created");
  }
  back(formData, "createdLater");
}

const DONE_CODE: Record<TaskAction, NoticeCode> = {
  take: "taken",
  done: "done",
  failed: "failed",
  move: "moved",
  cancel: "cancelled",
};

/** «Взять в работу», «Сделано», «Не сделано», «Перенести срок», «Отменить задачу». */
export async function taskAction(formData: FormData) {
  const staff = await requireStaff();
  const now = new Date();
  const id = String(formData.get("task") ?? "");
  const action = String(formData.get("action") ?? "");

  let kind: TaskAction;
  let newDue: Date | undefined;
  if (action === "take" || action === "done" || action === "failed" || action === "cancel") {
    kind = action;
  } else if (isMove(action) || action === "custom") {
    kind = "move";
    if (action === "custom") {
      newDue = parseLocalInput(String(formData.get("due_at") ?? "")) ?? undefined;
    } else {
      const task = await taskById(id);
      if (!task) back(formData, "closed");
      newDue = movedDue(action, task.due_at ? new Date(task.due_at) : null, now);
    }
    if (!newDue) back(formData, "past");
  } else {
    back(formData, "failedTry");
  }

  const result = await actOnTask(id, staff, kind, { ip: await requestIp(), via: "panel", newDue }, now);
  if (!result.ok) back(formData, REASON[result.reason] ?? "failedTry");

  after(async () => {
    await afterAct(result.task, result.eventId).catch((error) => console.error("задачи: после действия", error));
  });
  back(formData, DONE_CODE[kind]);
}
