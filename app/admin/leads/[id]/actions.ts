"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  revalidatePath(`/admin/leads/${leadId}`);
  backTo(leadId, result);
}

export async function release(formData: FormData) {
  const staff = await requireStaff();
  const leadId = leadIdFrom(formData);

  const result = await releaseLead(leadId, staff, await requestIp());
  revalidatePath(`/admin/leads/${leadId}`);
  backTo(leadId, result);
}

export async function changeStatus(formData: FormData) {
  const staff = await requireStaff();
  const leadId = leadIdFrom(formData);
  const status = String(formData.get("status") ?? "");

  const result = await setStatus(leadId, status, staff, await requestIp());
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
