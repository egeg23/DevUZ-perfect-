"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { requestIp, requireStaff } from "@/lib/admin/guard";
import { MAX_BODY, postMessage } from "@/lib/admin/messages";
import {
  completeReminder,
  createReminder,
  releaseLead,
  setAutoReminder,
  setStatus,
  takeLead,
  type OwnershipResult,
} from "@/lib/admin/ownership";
import { leadById } from "@/lib/admin/leads";
import { canEdit } from "@/lib/admin/ownership";
import { takeOverTalk } from "@/lib/admin/outreach-talk-store";
import { record } from "@/lib/admin/audit";
import { decideTransfer, requestTransfer } from "@/lib/admin/transfers";
import { handledLabel, markLeadCards } from "@/lib/qualify/telegram";

/**
 * Переписать карточки лида в Telegram у всей команды.
 *
 * Лида берут не только кнопкой в боте, но и здесь, в панели. Без этого
 * вызова карточки у всех восьми оставались с живыми кнопками, хотя лид уже
 * в работе, — ровно то, что чинилось в боте.
 *
 * Через `after`: ответ действия — редирект, и ждать ради него девять правок
 * в Telegram незачем. `after` отрабатывает и после `redirect`.
 */
function syncCards(leadId: string, status: string | null): void {
  after(async () => {
    try {
      await markLeadCards(leadId, status);
    } catch (error) {
      console.error("карточки лида в Telegram не переписались", error);
    }
  });
}

/**
 * Результат действия едет обратно параметром в адресе, а не всплывающим
 * уведомлением. Причина простая: server action возвращает управление
 * редиректом, и любое состояние в памяти после него теряется. Параметр
 * переживает перезагрузку, и человек видит, чем кончилось, даже если
 * закрыл вкладку и открыл заново.
 */
function backTo(leadId: string, result: OwnershipResult, hash = ""): never {
  const status = result.ok ? "ok" : result.reason;
  redirect(`/admin/leads/${leadId}?r=${status}${hash}`);
}

function leadIdFrom(formData: FormData): string {
  const id = String(formData.get("lead") ?? "");
  if (!id) redirect("/admin");
  return id;
}

export async function take(formData: FormData) {
  const staff = await requireStaff();
  const leadId = leadIdFrom(formData);

  const result = await takeLead(leadId, staff, await requestIp());
  if (result.ok) syncCards(leadId, handledLabel("take", staff));
  revalidatePath(`/admin/leads/${leadId}`);
  backTo(leadId, result);
}

export async function release(formData: FormData) {
  const staff = await requireStaff();
  const leadId = leadIdFrom(formData);

  const result = await releaseLead(leadId, staff, await requestIp());
  // Лид снова свободен — кнопки возвращаются: иначе карточки у команды
  // говорили бы «в работе» про лида, которого никто не ведёт.
  if (result.ok) syncCards(leadId, null);
  revalidatePath(`/admin/leads/${leadId}`);
  backTo(leadId, result);
}

export async function changeStatus(formData: FormData) {
  const staff = await requireStaff();
  const leadId = leadIdFrom(formData);
  const status = String(formData.get("status") ?? "");

  const result = await setStatus(leadId, status, staff, await requestIp());
  // Карточку трогают только два перехода: отказ и возврат в новые. Остальные
  // случаются с лидом, который уже в работе, — его карточка и так говорит,
  // у кого он.
  if (result.ok && status === "dropped") syncCards(leadId, handledLabel("drop", staff));
  if (result.ok && status === "new") syncCards(leadId, null);
  revalidatePath(`/admin/leads/${leadId}`);
  backTo(leadId, result);
}

/**
 * Раскрытие контакта — POST, а не ссылка.
 *
 * Next заранее подгружает ссылки при наведении. Ссылка «показать контакт»
 * означала бы строку в журнале от того, что человек провёл мышью мимо, —
 * и журнал, где половина записей случайна, перестаёт что-либо значить.
 */
export async function revealContactAction(formData: FormData) {
  await requireStaff();
  const leadId = leadIdFrom(formData);
  redirect(`/admin/leads/${leadId}?contact=1`);
}

/** Переписка открывается тем же POST-ом и по той же причине, что и контакт. */
export async function revealTranscriptAction(formData: FormData) {
  await requireStaff();
  const leadId = leadIdFrom(formData);
  redirect(`/admin/leads/${leadId}?transcript=1#transcript`);
}

/**
 * «Отвечать самому»: менеджер забирает у модели первичку по касанию.
 *
 * Право проверяется по лиду, а не по проспекту: разговор принадлежит тому,
 * за кем закреплён лид, и забрать его у модели может только он. Форма на
 * странице этого не решает — её видно только своим, но видимость правом не
 * является.
 */
export async function takeOverTalkAction(formData: FormData) {
  const staff = await requireStaff();
  const leadId = leadIdFrom(formData);
  const prospectId = String(formData.get("prospect") ?? "");

  const lead = await leadById(leadId);
  if (!lead || !canEdit(lead, staff) || !prospectId) redirect(`/admin/leads/${leadId}`);

  await takeOverTalk(prospectId);
  await record("prospect.taken_over", {
    actorStaffId: staff.id,
    targetType: "prospect",
    targetId: prospectId,
    ip: await requestIp(),
    meta: { lead: leadId },
  });
  revalidatePath(`/admin/leads/${leadId}`);
  redirect(`/admin/leads/${leadId}#talk`);
}

export async function toggleAutoReminder(formData: FormData) {
  const staff = await requireStaff();
  const leadId = leadIdFrom(formData);
  const enabled = String(formData.get("enabled") ?? "") === "1";

  const result = await setAutoReminder(leadId, enabled, staff, await requestIp());
  revalidatePath(`/admin/leads/${leadId}`);
  backTo(leadId, result);
}

export async function addReminder(formData: FormData) {
  const staff = await requireStaff();
  const leadId = leadIdFrom(formData);

  const hours = Number.parseFloat(String(formData.get("hours") ?? ""));
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);

  // Верхняя граница — год. Не из вредности: поле принимает то, что
  // напечатал человек, а «1е9» в часах уносит дату за пределы диапазона
  // timestamptz, и вставка падает уже в базе.
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24 * 365) {
    backTo(leadId, { ok: false, reason: "failed" });
  }

  const ok = await createReminder(leadId, staff, {
    dueAt: new Date(Date.now() + hours * 3600_000).toISOString(),
    note: note || null,
    kind: "manual",
    ip: await requestIp(),
  });

  revalidatePath(`/admin/leads/${leadId}`);
  backTo(leadId, ok ? { ok: true } : { ok: false, reason: "failed" });
}

export async function finishReminder(formData: FormData) {
  const staff = await requireStaff();
  const leadId = leadIdFrom(formData);
  const reminderId = String(formData.get("reminder") ?? "");

  const ok = await completeReminder(reminderId, staff, await requestIp());
  revalidatePath(`/admin/leads/${leadId}`);
  backTo(leadId, ok ? { ok: true } : { ok: false, reason: "forbidden" });
}

/**
 * Написать в обсуждение лида.
 *
 * Писать может любой сотрудник, а не только владелец: половина смысла
 * ветки в том, чтобы спросить «возьмёшь или мне забрать?» там, где вопрос
 * останется видимым, а не в личке.
 */
export async function sendMessageToThread(formData: FormData) {
  const staff = await requireStaff();
  const leadId = leadIdFrom(formData);
  const body = String(formData.get("body") ?? "").slice(0, MAX_BODY);

  const ok = await postMessage(leadId, staff, body, await requestIp());
  revalidatePath(`/admin/leads/${leadId}`);
  backTo(leadId, ok ? { ok: true } : { ok: false, reason: "failed" }, "#thread");
}

/**
 * Передать лида коллеге.
 *
 * Менеджер этим действием просит, руководитель и владелец — передают сразу.
 * Различает не форма, а книга передач: форму можно отправить и мимо кнопки.
 */
export async function askTransfer(formData: FormData) {
  const staff = await requireStaff();
  const leadId = leadIdFrom(formData);
  const targetId = String(formData.get("to") ?? "");
  const note = String(formData.get("note") ?? "");

  const result = await requestTransfer(leadId, targetId, note, staff, await requestIp());
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin");

  if (!result.ok) redirect(`/admin/leads/${leadId}?r=${result.reason}`);
  // Передал сам — лид уже не его, и смотреть на него больше незачем.
  redirect(result.moved ? "/admin?r=moved" : `/admin/leads/${leadId}?r=asked`);
}

/** Решение руководителя или владельца по просьбе. */
export async function decideTransferAction(formData: FormData) {
  const staff = await requireStaff();
  const leadId = leadIdFrom(formData);
  const transferId = String(formData.get("transfer") ?? "");
  const decision = String(formData.get("decision") ?? "") === "approved" ? "approved" : "declined";

  const result = await decideTransfer(transferId, decision, staff, await requestIp());
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin");
  redirect(
    result.ok
      ? `/admin/leads/${leadId}?r=${decision === "approved" ? "approved" : "declined"}`
      : `/admin/leads/${leadId}?r=${result.reason}`,
  );
}
