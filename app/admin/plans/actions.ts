"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireAdmin, requireStaff } from "@/lib/admin/guard";
import { runCoach } from "@/lib/admin/coach-store";
import { periodStart, type Period } from "@/lib/admin/pulse";
import { removePlan, setPlan } from "@/lib/admin/pulse-store";
import { teamOf } from "@/lib/admin/team";

/**
 * План на текущую неделю или месяц. Начало периода считается здесь по
 * Ташкенту, а не берётся из формы: форма живёт в браузере со своим
 * временем, и «эта неделя» у неё и у сервера — не всегда одна.
 */
export async function savePlan(formData: FormData) {
  const staff = await requireStaff();
  const periodRaw = String(formData.get("period") ?? "week");
  const period: Period = periodRaw === "month" ? "month" : "week";
  const target = Number(String(formData.get("target") ?? "").replace(/\s/g, "").replace(",", "."));

  const team = staff.role === "head" ? await teamOf(staff.id) : [];
  const result = await setPlan(
    {
      staffId: String(formData.get("staff") ?? ""),
      period,
      periodStart: periodStart(period, new Date()),
      metric: String(formData.get("metric") ?? ""),
      target,
    },
    staff,
    team,
    await requestIp(),
  );

  revalidatePath("/admin");
  redirect(`/admin?p=${result.ok ? "ok" : result.reason}`);
}

export async function deletePlan(formData: FormData) {
  const staff = await requireStaff();
  const result = await removePlan(String(formData.get("plan") ?? ""), staff, await requestIp());
  revalidatePath("/admin");
  redirect(`/admin?p=${result.ok ? "ok" : result.reason}`);
}

/**
 * Собрать рекомендации сейчас, не дожидаясь понедельника. Только владелец:
 * каждый запуск — вызовы модели за деньги, и решает о них тот, кто платит.
 */
export async function refreshReviews() {
  await requireAdmin();
  const run = await runCoach(new Date(), { force: true });
  revalidatePath("/admin");
  redirect(`/admin?p=${run.errors.length && !run.weekly && !run.daily ? "coach_failed" : "coach_ok"}`);
}
