"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireSection } from "@/lib/admin/guard";
import { setTenderStatus } from "@/lib/scout/tender-store";

/** Вернуться — только на страницу раздела. */
function backOf(formData: FormData): string {
  const raw = String(formData.get("back") ?? "");
  return /^\/admin\/tenders(\?[A-Za-z0-9=&_%.-]*)?$/.test(raw) ? raw : "/admin/tenders";
}

/** «Беру», «Подали», «Не наше», «Вернуть в новые» — любой, кому открыт раздел. */
export async function tenderStatusAction(formData: FormData) {
  const staff = await requireSection("/admin/tenders");
  const ok = await setTenderStatus(staff, String(formData.get("tender") ?? ""), String(formData.get("status") ?? ""), await requestIp());
  revalidatePath("/admin/tenders");
  const back = backOf(formData);
  redirect(`${back}${back.includes("?") ? "&" : "?"}r=${ok ? "ok" : "failed"}`);
}
