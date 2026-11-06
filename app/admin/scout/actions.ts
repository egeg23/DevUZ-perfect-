"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireSection, requireStaff } from "@/lib/admin/guard";
import { setSignalStatus } from "@/lib/admin/scout";
import { addScoutChat, removeScoutChat } from "@/lib/scout/extra-chats-store";

/** Вернуться — только на страницу панели, не на чужой адрес. */
function backOf(formData: FormData): string {
  const raw = String(formData.get("back") ?? "");
  return /^\/admin(\/[A-Za-z0-9/_-]*)?(\?[A-Za-z0-9=&_%.-]*)?$/.test(raw) ? raw : "/admin/scout";
}

function withParam(back: string, key: string, value: string): string {
  const [path, query = ""] = back.split("?");
  const params = new URLSearchParams(query);
  params.delete("r");
  params.delete("g");
  params.set(key, value);
  return `${path}?${params.toString()}`;
}

export async function changeSignalStatus(formData: FormData) {
  const staff = await requireStaff();
  const signalId = String(formData.get("signal") ?? "");
  const status = String(formData.get("status") ?? "");
  const back = backOf(formData);

  const ok = await setSignalStatus(signalId, status, staff, await requestIp());
  revalidatePath("/admin/scout");
  redirect(withParam(back, "r", ok ? "ok" : "failed"));
}

/** «Добавить группу» — любой, кому открыт раздел (владелец: «всем»). */
export async function addScoutChatAction(formData: FormData) {
  const staff = await requireSection("/admin/scout");
  const result = await addScoutChat(
    staff,
    String(formData.get("chat") ?? "").slice(0, 300),
    String(formData.get("note") ?? ""),
    await requestIp(),
  );
  revalidatePath("/admin/scout");
  redirect(withParam(backOf(formData), "g", result === "ok" ? "added" : result));
}

/** «Убрать» — кто добавил, руководитель или владелец (проверка в removeScoutChat). */
export async function removeScoutChatAction(formData: FormData) {
  const staff = await requireSection("/admin/scout");
  const ok = await removeScoutChat(staff, String(formData.get("chat") ?? ""), await requestIp());
  revalidatePath("/admin/scout");
  redirect(withParam(backOf(formData), "g", ok ? "removed" : "notRemoved"));
}
