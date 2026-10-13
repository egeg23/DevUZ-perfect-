"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { audienceFrom, canCancel, sendAtFrom, sendableNow, sendsBroadcasts } from "@/lib/admin/broadcast";
import { broadcastById, cancelBroadcast, createBroadcast, deliveredCounts, sendBroadcasts } from "@/lib/admin/broadcast-store";
import { currentStaff, requestIp } from "@/lib/admin/guard";
import { opens } from "@/lib/admin/roles";
import { createTasks, deliverAssignment } from "@/lib/admin/task-store";
import { QUICK_DUES, messageWindow, parseLocalInput, quickDue, type QuickDue } from "@/lib/admin/tasks";

/**
 * Действия «Главной»: быстрая задача и рассылка в бот команде.
 *
 * Отвечают результатом, а не редиректом: форма остаётся на месте, и
 * человек видит «ушло трём» рядом с кнопкой, которую нажал.
 */

const HREF = "/admin/hq";

export type TaskState =
  | { ok: true; n: number; later: boolean; at: number }
  | { ok: false; error: "assignee" | "title" | "past" | "far" | "failed" | "forbidden"; at: number }
  | null;

/** Быстрая задача: кому (несколько сразу), что, срок — тем же путём, что «Поставить задачу» на «Лидах». */
export async function hqTaskAction(_prev: TaskState, formData: FormData): Promise<TaskState> {
  const at = Date.now();
  const staff = await currentStaff();
  if (!staff || !opens(staff, HREF)) return { ok: false, error: "forbidden", at };
  const now = new Date();
  const kind = String(formData.get("due") ?? "today");
  const due = (QUICK_DUES as readonly string[]).includes(kind)
    ? quickDue(kind as QuickDue, now)
    : parseLocalInput(String(formData.get("due_at") ?? ""));
  if (!due) return { ok: false, error: "past", at };

  const result = await createTasks(
    {
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      assigneeIds: formData.getAll("assignee").map(String),
      due,
      projectId: null,
    },
    staff,
    await requestIp(),
    now,
  );
  if (!result.ok) {
    const error =
      result.reason === "no_assignee" || result.reason === "assignee"
        ? "assignee"
        : result.reason === "title" || result.reason === "body"
          ? "title"
          : result.reason === "past" || result.reason === "far"
            ? result.reason
            : "failed";
    return { ok: false, error, at };
  }
  const others = result.tasks.filter((t) => t.assignee_id !== staff.id);
  const day = messageWindow(now);
  // Сообщения исполнителям — после ответа; ночью — в 07:00 проходом свипа.
  if (others.length && day) {
    after(async () => {
      for (const task of others) await deliverAssignment(task.id).catch((e) => console.error("задачи: сообщение", e));
    });
  }
  revalidatePath(HREF);
  return { ok: true, n: result.tasks.length, later: others.length > 0 && !day, at };
}

export type BroadcastState =
  | { ok: true; n: number; scheduled: boolean; night: boolean; at: number }
  | {
      ok: false;
      error: "forbidden" | "empty" | "long" | "audience" | "bad" | "past" | "far" | "nobody" | "changed" | "offline" | "failed";
      at: number;
    }
  | null;

/** Рассылка: текст, кому, когда. Только владелец и руководитель — по роли. */
export async function broadcastAction(_prev: BroadcastState, formData: FormData): Promise<BroadcastState> {
  const at = Date.now();
  const staff = await currentStaff();
  if (!staff || !opens(staff, HREF) || !sendsBroadcasts(staff.role)) return { ok: false, error: "forbidden", at };
  const now = new Date();
  const audience = audienceFrom(
    String(formData.get("audience") ?? ""),
    formData.getAll("role").map(String),
    formData.getAll("person").map(String),
  );
  if (!audience) return { ok: false, error: "audience", at };
  const sendAt = sendAtFrom(String(formData.get("when") ?? "now"), String(formData.get("send_at") ?? ""), now);
  if (!(sendAt instanceof Date)) return { ok: false, error: sendAt, at };
  const nightOk = formData.get("night") === "on";

  const result = await createBroadcast(
    {
      text: String(formData.get("text") ?? ""),
      audience,
      sendAt,
      nightOk,
      expected: Number(formData.get("expected") ?? -1),
    },
    staff,
    await requestIp(),
  );
  if (!result.ok) return { ok: false, error: result.reason, at };

  const scheduled = sendAt.getTime() > now.getTime();
  const night = !scheduled && !sendableNow(now, nightOk);
  // «Сейчас» и днём — сразу после ответа; иначе — проходом свипа в срок.
  if (!scheduled && !night) after(() => sendBroadcasts(new Date(), result.id).then(() => undefined));
  revalidatePath(HREF);
  return { ok: true, n: result.recipients, scheduled, night, at };
}

export async function cancelBroadcastAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !opens(staff, HREF) || !sendsBroadcasts(staff.role)) return;
  const id = String(formData.get("id") ?? "");
  const row = await broadcastById(id);
  if (!row) return;
  const delivered = (await deliveredCounts([id])).get(id) ?? 0;
  if (!canCancel(row, delivered, staff, new Date())) return;
  await cancelBroadcast(id, staff, await requestIp());
  revalidatePath(HREF);
}
