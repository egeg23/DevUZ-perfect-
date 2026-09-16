"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireRole } from "@/lib/admin/guard";
import { addExpense, removeExpense } from "@/lib/admin/ledger";

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
    },
    staff,
    await requestIp(),
  );

  revalidatePath("/admin/expenses");
  redirect("/admin/expenses");
}

export async function dropStudioExpense(formData: FormData) {
  const staff = await requireRole("admin");
  await removeExpense(String(formData.get("id") ?? ""), staff, await requestIp());
  revalidatePath("/admin/expenses");
  redirect("/admin/expenses");
}
