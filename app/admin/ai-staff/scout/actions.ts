"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireSection } from "@/lib/admin/guard";
import { parseWords } from "@/lib/scout/settings";
import { saveScoutSettings } from "@/lib/scout/settings-store";

/** Режим скаута и слова — владелец и руководитель (проверка в saveScoutSettings). */
export async function saveScoutSettingsAction(formData: FormData) {
  const staff = await requireSection("/admin/ai-staff");
  const mode = formData.get("mode") === "words" ? "words" : "auto";
  const words = parseWords(String(formData.get("words") ?? "").slice(0, 8000));
  const result = await saveScoutSettings(staff, mode, words, await requestIp());
  revalidatePath("/admin/ai-staff/scout");
  redirect(`/admin/ai-staff/scout?s=${result}`);
}
