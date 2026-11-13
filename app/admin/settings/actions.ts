"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireSection } from "@/lib/admin/guard";
import { leadOffFromForm } from "@/lib/admin/lead-kinds";
import { setLeadKinds } from "@/lib/admin/notify-prefs";

/**
 * Свои «Какие лиды присылать» (lib/admin/lead-kinds.ts). Владелец,
 * 13.11.2026: «Пусть будет возможность самим настроить это всё» — себе
 * каждый, id берётся из сессии, а не из формы.
 */
export async function saveMyLeadKinds(formData: FormData) {
  const staff = await requireSection("/admin/settings");
  const checked = formData.getAll("on").map(String);
  const result = await setLeadKinds(staff.id, leadOffFromForm(checked), staff, await requestIp());
  revalidatePath("/admin/settings");
  redirect(`/admin/settings?done=${result.ok ? "lead_kinds" : "fail_lead_kinds"}#leads`);
}
