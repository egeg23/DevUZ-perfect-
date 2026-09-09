"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireAdmin, requireStaff } from "@/lib/admin/guard";
import { createProject, setStage, updateProject } from "@/lib/admin/projects";

function numberOrNull(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number.parseInt(text, 10);
  // Не Number(): «12 000$» превратилось бы в NaN и молча уехало в базу как
  // null, то есть сумма проекта потерялась бы без единого сообщения.
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function addProject(formData: FormData) {
  const staff = await requireStaff();

  const id = await createProject(
    staff,
    {
      title: String(formData.get("title") ?? ""),
      client: String(formData.get("client") ?? ""),
      amountUsd: numberOrNull(formData.get("amount")),
      deadline: String(formData.get("deadline") ?? "") || null,
    },
    await requestIp(),
  );

  revalidatePath("/admin/projects");
  redirect(id ? `/admin/projects/${id}` : "/admin/projects?r=failed");
}

export async function moveStage(formData: FormData) {
  // Стадию двигает только админ — так и просили. requireAdmin уводит
  // остальных на /admin, а не показывает форму, которая всё равно откажет.
  const staff = await requireAdmin();
  const projectId = String(formData.get("project") ?? "");
  const stage = String(formData.get("stage") ?? "");

  const ok = await setStage(projectId, stage, staff, await requestIp());
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}?r=${ok ? "ok" : "failed"}`);
}

export async function editProject(formData: FormData) {
  const staff = await requireStaff();
  const projectId = String(formData.get("project") ?? "");

  const ok = await updateProject(
    projectId,
    {
      title: String(formData.get("title") ?? ""),
      client: String(formData.get("client") ?? ""),
      amountUsd: numberOrNull(formData.get("amount")),
      deadline: String(formData.get("deadline") ?? "") || null,
      notes: String(formData.get("notes") ?? ""),
    },
    staff,
    await requestIp(),
  );

  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}?r=${ok ? "ok" : "failed"}`);
}
