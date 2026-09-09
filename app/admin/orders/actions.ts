"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestIp, requireStaff } from "@/lib/admin/guard";
import { setOrderStatus } from "@/lib/admin/orders";

export async function changeOrderStatus(formData: FormData) {
  const staff = await requireStaff();
  const orderId = String(formData.get("order") ?? "");
  const status = String(formData.get("status") ?? "");

  const ok = await setOrderStatus(orderId, status, staff, await requestIp());
  revalidatePath("/admin/orders");
  redirect(`/admin/orders?r=${ok ? "ok" : "failed"}`);
}
