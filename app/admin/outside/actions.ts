"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireSection } from "@/lib/admin/guard";
import { markPublished, setPublisher, skipPost } from "@/lib/outside/store";

/** Результат — `?r=` на странице раздела; экран остаётся на месте (KeepPlace). */
function back(result: string): never {
  revalidatePath("/admin/outside");
  redirect(`/admin/outside?r=${encodeURIComponent(result)}`);
}

/** «Опубликовал» — любой, кому открыт раздел; ссылка — только с адреса этой площадки. */
export async function publishOutsideAction(formData: FormData) {
  const staff = await requireSection("/admin/outside");
  back(await markPublished(staff, String(formData.get("post") ?? ""), String(formData.get("url") ?? ""), await requestIp()));
}

/** «Пропустить» — черновик не нужен, площадке на следующей неделе новый. */
export async function skipOutsideAction(formData: FormData) {
  const staff = await requireSection("/admin/outside");
  back(await skipPost(staff, String(formData.get("post") ?? ""), await requestIp()));
}

/** «Кто публикует» — руководитель и владелец (проверка в setPublisher). */
export async function publisherOutsideAction(formData: FormData) {
  const staff = await requireSection("/admin/outside");
  const chosen = String(formData.get("publisher") ?? "").trim();
  back(await setPublisher(staff, chosen || null, await requestIp()));
}
