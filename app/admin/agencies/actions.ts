"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireAdmin, requireSection } from "@/lib/admin/guard";
import { createAgencyPartner, setAgencyFinder } from "@/lib/partners/store";

/**
 * Вкладка «Агентства». Завести агентство может любой из команды (владелец,
 * 05.11.2026: «те кто привел агентство и завел его у нас»): менеджер — на
 * себя, владелец и руководитель — на того, кого выберут. Кто привёл,
 * поправляет только владелец: это 5% с суммы проектов агентства. Права
 * книга (lib/partners/store.ts) проверяет ещё раз: действие — обычный POST.
 */

function back(code: string): never {
  redirect(`/admin/agencies?r=${code}`);
}

export async function addAgency(formData: FormData) {
  const staff = await requireSection("/admin/agencies");
  const brought = formData.get("brought_by");
  const result = await createAgencyPartner(
    {
      name: String(formData.get("name") ?? ""),
      contact: String(formData.get("contact") ?? ""),
      website: String(formData.get("website") ?? ""),
      note: String(formData.get("note") ?? ""),
      // Поля нет у менеджера — значит «я». «none» — агентство пришло само.
      broughtBy: brought === null ? undefined : String(brought) === "none" ? null : String(brought),
    },
    staff,
    await requestIp(),
  );
  revalidatePath("/admin/agencies");
  back(result.ok ? "created" : result.reason);
}

export async function setFinder(formData: FormData) {
  const admin = await requireAdmin();
  const raw = String(formData.get("brought_by") ?? "");
  const result = await setAgencyFinder(
    String(formData.get("agency") ?? ""),
    raw && raw !== "none" ? raw : null,
    admin,
    await requestIp(),
  );
  revalidatePath("/admin/agencies");
  back(result.ok ? "ok" : result.reason);
}
