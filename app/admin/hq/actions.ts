"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { audienceFrom, canCancel, sendAtFrom, sendableNow, sendsBroadcasts } from "@/lib/admin/broadcast";
import { broadcastById, cancelBroadcast, createBroadcast, deliveredCounts, sendBroadcasts } from "@/lib/admin/broadcast-store";
import { isSegment } from "@/lib/admin/bot-users";
import { createUserBroadcast, sendUserBroadcasts } from "@/lib/admin/bot-users-store";
import { currentStaff, requestIp } from "@/lib/admin/guard";
import { myHref } from "@/lib/admin/hq-my";
import { parseTidyCallback } from "@/lib/admin/lead-tidy";
import { decideTidy } from "@/lib/admin/lead-tidy-store";
import { giveLead, revealContact } from "@/lib/admin/ownership";
import { contactLink } from "@/lib/contact";
import { opens } from "@/lib/admin/roles";
import { MARK_KINDS, SHOWN_VIA, parseAmount, type MarkKind, type ShownVia } from "@/lib/admin/sales-stages";
import { markStage } from "@/lib/admin/sales-stages-store";
import { orderFromForm, type OrderProblem } from "@/lib/admin/mockup-order";
import { createTasks, deliverAssignment } from "@/lib/admin/task-store";
import { QUICK_DUES, messageWindow, parseLocalInput, quickDue, type QuickDue } from "@/lib/admin/tasks";

/**
 * Действия «Главной»: быстрая задача и рассылка в бот команде.
 *
 * Отвечают результатом, а не редиректом: форма остаётся на месте, и
 * человек видит «ушло трём» рядом с кнопкой, которую нажал.
 */

const HREF = "/admin/hq";
/** Доска лидов — единственный адрес возврата с параметром. */
const BOARD_HREF = "/admin?view=board";

export type TaskState =
  | { ok: true; n: number; later: boolean; at: number }
  | { ok: false; error: "assignee" | "title" | "past" | "far" | "failed" | "forbidden" | OrderProblem; at: number }
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
      order: orderFromForm((name) => (formData.get(name) === null ? null : String(formData.get(name)))),
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
          : result.reason === "past" || result.reason === "far" || result.reason === "mockup" || result.reason === "mockup_client" || result.reason === "mockup_site"
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
  const sendAtUsers = sendAtFrom(String(formData.get("when") ?? "now"), String(formData.get("send_at") ?? ""), now);
  const nightUsers = formData.get("night") === "on";

  // Пользователям бота — своя ветка: сегмент вместо ролей, доставка порциями
  // (lib/admin/bot-users-store.ts). Модели нет ни там, ни здесь.
  if (formData.get("kind") === "users") {
    const segment = String(formData.get("segment") ?? "");
    if (!isSegment(segment)) return { ok: false, error: "audience", at };
    if (!(sendAtUsers instanceof Date)) return { ok: false, error: sendAtUsers, at };
    const result = await createUserBroadcast(
      { text: String(formData.get("text") ?? ""), segment, sendAt: sendAtUsers, nightOk: nightUsers, expected: Number(formData.get("expected") ?? -1) },
      staff,
      await requestIp(),
    );
    if (!result.ok) return { ok: false, error: result.reason, at };
    const scheduled = sendAtUsers.getTime() > now.getTime();
    const night = !scheduled && !sendableNow(now, nightUsers);
    if (!scheduled && !night) after(() => sendUserBroadcasts(new Date(), result.id).then(() => undefined));
    revalidatePath(HREF);
    return { ok: true, n: result.recipients, scheduled, night, at };
  }

  const audience = audienceFrom(
    String(formData.get("audience") ?? ""),
    formData.getAll("role").map(String),
    formData.getAll("person").map(String),
  );
  if (!audience) return { ok: false, error: "audience", at };
  const sendAt = sendAtUsers;
  if (!(sendAt instanceof Date)) return { ok: false, error: sendAt, at };
  const nightOk = nightUsers;

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

/**
 * «Отдать» тёплого лида без хозяина — из «Требует внимания». Владелец и
 * руководитель (giveLead проверяет роль ещё раз). Лид сразу у человека,
 * бот пишет ему.
 */
export async function giveLeadAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !opens(staff, HREF)) return;
  const lead = String(formData.get("lead") ?? "");
  const to = String(formData.get("to") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(lead) || !/^[0-9a-f-]{36}$/.test(to)) return;
  await giveLead(lead, to, staff, await requestIp());
  revalidatePath(HREF);
}

/* ── «Главная» менеджера ─────────────────────────────────────────────── */

/**
 * «🏆 / ❌ / ⏳» прямо в строке — тем же decideTidy, что у бота в «Порядке
 * в лидах» (lib/admin/lead-tidy-store.ts): смена статуса через setStatus
 * (журнал, сброс счётчиков бота), «⏳» со сроком — задача «Связаться»
 * через createTasks. Менять можно только свой лид — это проверяет
 * decideTidy. «Выиграли» ведёт сразу в «Завести проект».
 */
export async function myStatusAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !opens(staff, HREF)) redirect("/admin");
  const parsed = parseTidyCallback(["lt", String(formData.get("answer") ?? ""), String(formData.get("lead") ?? "")]);
  // «⏳» без срока панель не присылает: срок выбирается в той же строке.
  if (!parsed || parsed.answer === "wait") redirect(`${HREF}?st=failed`);
  const decision = await decideTidy(staff, parsed.answer, parsed.leadId, "panel", new Date(), await requestIp());
  revalidatePath(HREF);
  if (decision.result !== "ok") redirect(`${HREF}?st=${decision.result}`);
  if (decision.answer === "won") redirect(myHref.project(parsed.leadId));
  if (decision.answer === "term") redirect(`${HREF}?st=term&due=${encodeURIComponent(decision.due.toISOString())}`);
  redirect(`${HREF}?st=${decision.answer}`);
}

export type ContactOpen = { url: string | null; label: string } | null;

/**
 * «Связаться» в одно нажатие: контакт клиента открывается тем же
 * revealContact, что «Показать контакт» в карточке, — с записью в журнал
 * и только своему лиду. Ссылка (Telegram, звонок, почта) — contactLink.
 */
export async function myContactAction(leadId: string): Promise<ContactOpen> {
  const staff = await currentStaff();
  if (!staff || !opens(staff, HREF) || !/^[0-9a-f-]{36}$/i.test(String(leadId))) return null;
  const contact = await revealContact(String(leadId), staff, await requestIp());
  if (!contact) return null;
  const view = contactLink({ contact_handle: contact.handle, contact_kind: contact.kind });
  return { url: view.url, label: view.label };
}

/* ── Ступени продажи: «Есть интерес», «Показал макет», «Назвал цену» ── */

/** Куда вернуться после отметки: только страница панели, не чужой адрес. */
function backOf(raw: unknown): string {
  const back = String(raw ?? "");
  // «Лиды» доской (components/admin/lead-board.tsx): отметка с карточки доски — обратно на доску.
  if (back === BOARD_HREF) return back;
  return /^\/admin(\/[A-Za-z0-9/_-]*)?$/.test(back) ? back : HREF;
}

/**
 * Отметить ступень продажи — из карточки лида и из «Моих макетов» на
 * «Главной». Кто может — решает markStage (canMark): менеджер — только по
 * своему, руководитель и владелец — по любому. Отметка — в sales_marks и в
 * журнал (lead.sales_marked). Модели здесь нет.
 */
export async function markStageAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  const back = backOf(formData.get("back"));
  if (!staff) redirect("/admin");
  const kind = String(formData.get("kind") ?? "");
  const id = (name: string) => {
    const v = String(formData.get(name) ?? "");
    return /^[0-9a-f-]{36}$/i.test(v) ? v : null;
  };
  const viaRaw = String(formData.get("via") ?? "");
  const via = (SHOWN_VIA as readonly string[]).includes(viaRaw) ? (viaRaw as ShownVia) : null;
  const result = (MARK_KINDS as readonly string[]).includes(kind)
    ? await markStage(
        { kind: kind as MarkKind, leadId: id("lead"), prospectId: id("prospect"), via, amountUsd: parseAmount(formData.get("amount")) },
        staff,
        await requestIp(),
      )
    : "bad";
  revalidatePath(back);
  redirect(`${back}${back.includes("?") ? "&" : "?"}mk=${result}${back.startsWith("/admin/leads/") ? "#stages" : ""}`);
}
