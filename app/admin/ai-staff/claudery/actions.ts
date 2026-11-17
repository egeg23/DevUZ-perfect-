"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireSection } from "@/lib/admin/guard";
import { scenarioFromForm, scenarioProblems } from "@/lib/claudery/scenario";
import { saveKeysAndCheck, saveScenario } from "@/lib/claudery/store";

const BACK = "/admin/ai-staff/claudery";
/** Менять бота — владелец и руководитель, как ключи «Блогеров». */
const mayTune = (role: string) => role === "admin" || role === "head";

export async function saveClauderyKeysAction(formData: FormData) {
  const staff = await requireSection("/admin/ai-staff");
  if (!mayTune(staff.role)) redirect(BACK);
  const result = await saveKeysAndCheck(
    {
      token: String(formData.get("token") ?? ""),
      merchantId: String(formData.get("merchant") ?? ""),
      apiKey: String(formData.get("apiKey") ?? ""),
    },
    staff.id,
    await requestIp(),
  );
  revalidatePath(BACK);
  redirect(`${BACK}?k=${result}`);
}

export async function saveClauderyScenarioAction(formData: FormData) {
  const staff = await requireSection("/admin/ai-staff");
  if (!mayTune(staff.role)) redirect(BACK);
  const scenario = scenarioFromForm(formData);
  const problems = scenarioProblems(scenario);
  if (problems.length) redirect(`${BACK}?bad=${encodeURIComponent(problems.slice(0, 6).join("\n"))}`);
  await saveScenario(scenario, staff.id, await requestIp());
  revalidatePath(BACK);
  redirect(`${BACK}?done=saved`);
}
