"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireAdmin } from "@/lib/admin/guard";
import { registerRelease } from "@/lib/store/releases";

/**
 * Публикация релиза — действие админа, а не менеджера.
 *
 * Выложить файл значит решить, что именно получит каждый, кто уже заплатил,
 * и каждый, кто заплатит завтра. Это не операционная работа по сделке.
 */
export async function publishReleaseAction(formData: FormData) {
  const staff = await requireAdmin();
  const ip = await requestIp();

  const result = await registerRelease(
    {
      productSlug: String(formData.get("product") ?? ""),
      version: String(formData.get("version") ?? ""),
      bucket: String(formData.get("bucket") ?? ""),
      path: String(formData.get("path") ?? ""),
      sha256: String(formData.get("sha256") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    },
    staff,
    ip,
  );

  revalidatePath("/admin/releases");
  redirect(
    result.ok
      ? "/admin/releases?r=ok"
      : `/admin/releases?r=failed&e=${encodeURIComponent(result.reason)}`,
  );
}
