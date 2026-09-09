"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireStaff } from "@/lib/admin/guard";
import { setSignalStatus } from "@/lib/admin/scout";

export async function changeSignalStatus(formData: FormData) {
  const staff = await requireStaff();
  const signalId = String(formData.get("signal") ?? "");
  const status = String(formData.get("status") ?? "");
  const back = String(formData.get("back") ?? "/admin/scout");

  const ok = await setSignalStatus(signalId, status, staff, await requestIp());
  revalidatePath("/admin/scout");
  redirect(`${back}${back.includes("?") ? "&" : "?"}r=${ok ? "ok" : "failed"}`);
}
