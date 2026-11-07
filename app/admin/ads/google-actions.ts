"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import { requestIp, requireSection } from "@/lib/admin/guard";
import { googleKeysToSave } from "@/lib/ads/google-keys";
import { checkPlanner, setPlannerAccount } from "@/lib/seo/keyword-planner-store";
import { saveAppSecret } from "@/lib/secrets";

/** Результат — `?g=` на странице «Рекламы». */
function back(result: string): never {
  revalidatePath("/admin/ads");
  redirect(`/admin/ads?g=${encodeURIComponent(result)}`);
}

/**
 * «Ключи приложения Google» — только владелец: это ключи всего приложения,
 * через них входят все кабинеты Google. Пустое поле не трогает сохранённое;
 * неверное — не пишется ничего. В журнал — какие поля, без значений.
 */
export async function saveGoogleKeysAction(formData: FormData) {
  const staff = await requireSection("/admin/ads");
  if (staff.role !== "admin") back("forbidden");
  const keys = googleKeysToSave(String(formData.get("clientId") ?? ""), String(formData.get("clientSecret") ?? ""));
  if (!keys) back("keys_bad");
  for (const [name, value] of Object.entries(keys)) {
    if (!(await saveAppSecret(name, value))) back("failed");
  }
  await record("ads.app_keys_saved", { actorStaffId: staff.id, meta: { names: Object.keys(keys) }, ip: await requestIp() });
  back("keys_saved");
}

/** Кабинет для планировщика — руководитель и владелец (проверка в setPlannerAccount). */
export async function plannerAccountAction(formData: FormData) {
  const staff = await requireSection("/admin/ads");
  const chosen = String(formData.get("account") ?? "").trim();
  const result = await setPlannerAccount(staff, chosen || null, await requestIp());
  back(result === "ok" ? "planner_set" : result === "bad" ? "planner_bad" : result);
}

/** «Проверить» — одна фраза по Узбекистану; итог ложится в базу и виден на странице. */
export async function plannerCheckAction() {
  const staff = await requireSection("/admin/ads");
  const result = await checkPlanner(staff);
  back(result === "forbidden" ? "forbidden" : "checked");
}
