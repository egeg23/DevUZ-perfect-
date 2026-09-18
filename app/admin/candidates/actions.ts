"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireStaff } from "@/lib/admin/guard";
import { canSee } from "@/lib/admin/roles";
import { dropCandidate, reviewResume } from "@/lib/hiring/store";

/**
 * Разбор резюме доступен нанимающим, и только им.
 *
 * Владелец: «доступен руководителям и мне для использования, не менеджерам».
 * Меню такую вкладку менеджеру не покажет, но меню — это украшение: адрес
 * можно набрать руками, а действие вызвать и вовсе без страницы. Право
 * проверяется здесь, в каждом действии.
 */
async function requireHiring() {
  const staff = await requireStaff();
  if (!canSee(staff.role, "/admin/candidates")) redirect("/admin");
  return staff;
}

export async function reviewResumeAction(formData: FormData) {
  const staff = await requireHiring();

  const file = formData.get("resume");
  const role = String(formData.get("role") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/candidates?e=${encodeURIComponent("Выберите файл резюме.")}`);
  }
  if (!role) {
    redirect(`/admin/candidates?e=${encodeURIComponent("Напишите, на какую вакансию смотрим.")}`);
  }

  const result = await reviewResume({
    bytes: await file.arrayBuffer(),
    role: role.slice(0, 200),
    staff,
    ip: await requestIp(),
  });

  revalidatePath("/admin/candidates");
  redirect(
    result.ok
      ? `/admin/candidates?open=${result.id}#k-${result.id}`
      : `/admin/candidates?e=${encodeURIComponent(result.why)}`,
  );
}

export async function dropCandidateAction(formData: FormData) {
  const staff = await requireHiring();
  await dropCandidate(String(formData.get("candidate") ?? ""), staff, await requestIp());
  revalidatePath("/admin/candidates");
  redirect("/admin/candidates");
}
