"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { requestIp, requireStaff } from "@/lib/admin/guard";
import { actOnTask, afterAct, createTask, deliverAssignment, taskById } from "@/lib/admin/task-store";
import {
  QUICK_DUES,
  isMove,
  movedDue,
  parseLocalInput,
  quickDue,
  taskWindow,
  type QuickDue,
  type TaskAction,
} from "@/lib/admin/tasks";
import type { taskNoticeDict } from "@/content/admin-panel/tasks";

/**
 * Действия блока «Задачи» на главной.
 *
 * Итог едет обратно кодом `?t=` в адресе, как у остальных действий панели:
 * после редиректа состояние в памяти теряется, а параметр переживает и
 * перезагрузку. Текст по коду — в словаре (content/admin-panel/tasks.ts).
 */

type NoticeCode = keyof typeof taskNoticeDict;

function back(code: NoticeCode): never {
  revalidatePath("/admin");
  redirect(`/admin?t=${code}#tasks`);
}

const REASON: Record<string, NoticeCode> = {
  title: "title",
  body: "body",
  assignee: "assignee",
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

/** Срок из формы: быстрый вариант или своя дата (по Ташкенту). */
function dueFrom(formData: FormData, now: Date): Date | null {
  const kind = String(formData.get("due") ?? "");
  if ((QUICK_DUES as readonly string[]).includes(kind)) return quickDue(kind as QuickDue, now);
  return parseLocalInput(String(formData.get("due_at") ?? ""));
}

export async function createTaskAction(formData: FormData) {
  const staff = await requireStaff();
  const now = new Date();
  const due = dueFrom(formData, now);
  if (!due) back("past");

  const result = await createTask(
    {
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      assigneeId: String(formData.get("assignee") ?? ""),
      due,
    },
    staff,
    await requestIp(),
    now,
  );
  if (!result.ok) back(REASON[result.reason] ?? "failedTry");

  const { task } = result;
  if (task.assignee_id === staff.id) back("created");
  // Сообщение исполнителю — после ответа: ждать Telegram ради редиректа
  // незачем. Ночью не пишем — свип отправит в начале рабочего дня.
  if (taskWindow(now)) {
    after(async () => {
      await deliverAssignment(task.id).catch((error) => console.error("задачи: сообщение исполнителю", error));
    });
    back("created");
  }
  back("createdLater");
}

const DONE_CODE: Record<TaskAction, NoticeCode> = { take: "taken", done: "done", failed: "failed", move: "moved" };

/** «Взять в работу», «Сделано», «Не сделано», «Перенести срок». */
export async function taskAction(formData: FormData) {
  const staff = await requireStaff();
  const now = new Date();
  const id = String(formData.get("task") ?? "");
  const action = String(formData.get("action") ?? "");

  let kind: TaskAction;
  let newDue: Date | undefined;
  if (action === "take" || action === "done" || action === "failed") {
    kind = action;
  } else if (isMove(action) || action === "custom") {
    kind = "move";
    if (action === "custom") {
      newDue = parseLocalInput(String(formData.get("due_at") ?? "")) ?? undefined;
    } else {
      const task = await taskById(id);
      if (!task) back("closed");
      newDue = movedDue(action, new Date(task.due_at), now);
    }
    if (!newDue) back("past");
  } else {
    back("failedTry");
  }

  const result = await actOnTask(id, staff, kind, { ip: await requestIp(), via: "panel", newDue }, now);
  if (!result.ok) back(REASON[result.reason] ?? "failedTry");

  after(async () => {
    await afterAct(result.task, result.eventId).catch((error) => console.error("задачи: после действия", error));
  });
  back(DONE_CODE[kind]);
}
