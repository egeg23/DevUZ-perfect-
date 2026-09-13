"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isDealKind, isPurpose, parsePercent, parseUsd } from "@/lib/admin/finance";
import { requestIp, requireStaff } from "@/lib/admin/guard";
import {
  addPayment,
  recordPayout,
  removePayment,
  removePayout,
  setProjectMoney,
  type MoneyResult,
} from "@/lib/admin/ledger";

/**
 * Права проверяет книга (`ledger.ts`), а не эти обёртки: действие сервера —
 * это обычный POST, и форму можно отправить мимо кнопки. Здесь только
 * разбор формы и возврат на ту страницу, откуда пришли, с кодом результата.
 */

function code(result: MoneyResult): string {
  return result.ok ? "ok" : result.reason;
}

function dateOrNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export async function saveMoney(formData: FormData) {
  const staff = await requireStaff();
  const projectId = String(formData.get("project") ?? "");

  const fields: Parameters<typeof setProjectMoney>[1] = {};
  const kindRaw = String(formData.get("kind") ?? "");
  if (kindRaw) fields.kind = isDealKind(kindRaw) ? kindRaw : "new";
  // Отключённое поле в форму не попадает — значит, и в правку тоже.
  if (formData.has("amount")) fields.amountUsd = parseUsd(formData.get("amount"));
  if (formData.has("tax")) {
    const tax = parsePercent(formData.get("tax"));
    if (tax === null) redirect(`/admin/projects/${projectId}?r=invalid`);
    fields.taxPercent = tax;
  }
  if (formData.has("cost")) fields.devCostUsd = parseUsd(formData.get("cost"));

  const result = await setProjectMoney(projectId, fields, staff, await requestIp());
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/finance");
  redirect(`/admin/projects/${projectId}?r=${code(result)}`);
}

export async function confirmPayment(formData: FormData) {
  const staff = await requireStaff();
  const projectId = String(formData.get("project") ?? "");
  const purposeRaw = String(formData.get("purpose") ?? "");

  const result = await addPayment(
    projectId,
    {
      amountUsd: parseUsd(formData.get("amount")),
      paidOn: dateOrNull(formData.get("paid_on")),
      purpose: isPurpose(purposeRaw) ? purposeRaw : "advance",
      note: String(formData.get("note") ?? ""),
    },
    staff,
    await requestIp(),
  );
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/finance");
  redirect(`/admin/projects/${projectId}?r=${result.ok ? "paid" : result.reason}`);
}

export async function deletePayment(formData: FormData) {
  const staff = await requireStaff();
  const projectId = String(formData.get("project") ?? "");
  const paymentId = String(formData.get("payment") ?? "");

  const result = await removePayment(paymentId, staff, await requestIp());
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/finance");
  redirect(`/admin/projects/${projectId}?r=${code(result)}`);
}

export async function savePayout(formData: FormData) {
  const staff = await requireStaff();
  const staffId = String(formData.get("staff") ?? "");

  const result = await recordPayout(
    staffId,
    {
      amountUsd: parseUsd(formData.get("amount")),
      paidOn: dateOrNull(formData.get("paid_on")),
      note: String(formData.get("note") ?? ""),
    },
    staff,
    await requestIp(),
  );
  revalidatePath("/admin/finance");
  redirect(`/admin/finance?r=${code(result)}`);
}

export async function deletePayout(formData: FormData) {
  const staff = await requireStaff();
  const payoutId = String(formData.get("payout") ?? "");

  const result = await removePayout(payoutId, staff, await requestIp());
  revalidatePath("/admin/finance");
  redirect(`/admin/finance?r=${code(result)}`);
}
