"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireRole } from "@/lib/admin/guard";
import { addExpense, payerFromForm, removeExpense, setExpensePayer } from "@/lib/admin/ledger";

/**
 * Расходы студии.
 *
 * Добавляют оба соучредителя, удаляет только владелец. Асимметрия
 * намеренная: выдуманный расход уменьшает долю самого добавившего — соврать
 * себе в плюс нельзя. Удаление устроено наоборот, им можно убрать чужую
 * трату из картины.
 */

function usd(value: FormDataEntryValue | null): number | null {
  const parsed = Number.parseInt(String(value ?? "").replace(/\s/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function addStudioExpense(formData: FormData) {
  const staff = await requireRole("admin", "head");

  await addExpense(
    {
      amountUsd: usd(formData.get("amount")),
      spentOn: String(formData.get("spent_on") ?? "").slice(0, 10) || null,
      category: String(formData.get("category") ?? "other"),
      note: String(formData.get("note") ?? "") || null,
      paidBy: payerFromForm(formData.get("paid_by")),
    },
    staff,
    await requestIp(),
  );

  revalidatePath("/admin/expenses");
  redirect("/admin/expenses");
}

/**
 * «Кто вносил» у записанного расхода: оба соучредителя, каждое изменение —
 * в журнал (lib/admin/ledger.ts, setExpensePayer).
 */
export async function setStudioExpensePayer(formData: FormData) {
  const staff = await requireRole("admin", "head");
  const result = await setExpensePayer(
    String(formData.get("id") ?? ""),
    payerFromForm(formData.get("paid_by")),
    staff,
    await requestIp(),
  );
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/finance");
  redirect(`/admin/expenses?done=${result.ok ? "ok" : "fail"}`);
}

export async function dropStudioExpense(formData: FormData) {
  const staff = await requireRole("admin");
  await removeExpense(String(formData.get("id") ?? ""), staff, await requestIp());
  revalidatePath("/admin/expenses");
  redirect("/admin/expenses");
}
