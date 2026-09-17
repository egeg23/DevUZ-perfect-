"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import { requestIp, requireStaff } from "@/lib/admin/guard";
import { publish, reject } from "@/lib/razbor/store";

/**
 * Публикует и отклоняет только владелец.
 *
 * Разбор выходит под именем студии и критикует чужую работу. Решение
 * «это можно показывать» — не редакторская мелочь, а то, за что потом
 * отвечает владелец лично, поэтому право проверяется здесь, а не тем, что
 * кнопку кому-то не видно.
 */
async function owner() {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin");
  return staff;
}

export async function publishAction(formData: FormData) {
  const staff = await owner();
  const id = String(formData.get("razbor") ?? "");

  const result = await publish(id);
  await record("razbor.published", {
    actorStaffId: staff.id,
    targetType: "razbor",
    targetId: id,
    ip: await requestIp(),
    meta: { ok: result.ok },
  });

  revalidatePath("/admin/razbor");
  redirect(result.ok ? "/admin/razbor?r=ok" : `/admin/razbor?r=${encodeURIComponent(result.why)}`);
}

export async function rejectAction(formData: FormData) {
  const staff = await owner();
  const id = String(formData.get("razbor") ?? "");
  const why = String(formData.get("reason") ?? "");

  await reject(id, why);
  await record("razbor.rejected", {
    actorStaffId: staff.id,
    targetType: "razbor",
    targetId: id,
    ip: await requestIp(),
    meta: { reason: why.slice(0, 200) },
  });

  revalidatePath("/admin/razbor");
  redirect("/admin/razbor");
}
