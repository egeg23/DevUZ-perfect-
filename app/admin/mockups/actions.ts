"use server";

import { revalidatePath } from "next/cache";

import { requestIp, requireStaff } from "@/lib/admin/guard";
import { linkMockupOrder, type LinkResult } from "@/lib/admin/mockup-order-store";
import { mockupCode, setMockupOwner, type CodeResult, type OwnerResult } from "@/lib/admin/mockups-store";

/**
 * «Сгенерировать пароль» в разделе «Макеты». Всем в команде: пароль клиенту
 * выдаёт тот, кто с ним говорит (владелец, 08.10.2026: «вкладку… у всех»).
 */
export async function mockupCodeAction(ref: string): Promise<CodeResult> {
  const staff = await requireStaff();
  const result = await mockupCode(String(ref ?? ""), staff, await requestIp());
  if (result.ok) revalidatePath("/admin/mockups");
  return result;
}

/**
 * Ответственный за макет. Назначают руководитель и владелец — проверка роли в
 * setMockupOwner, а не здесь: галочка раздела даёт только просмотр.
 */
export async function mockupOwnerAction(ref: string, staffId: string): Promise<OwnerResult> {
  const staff = await requireStaff();
  const result = await setMockupOwner(String(ref ?? ""), String(staffId ?? ""), staff, await requestIp());
  if (result.ok) revalidatePath("/admin/mockups");
  return result;
}

/**
 * Привязать макет к заказу из задачи (lib/admin/mockup-order-store.ts):
 * исполнитель задачи, руководитель или владелец. Исполнителю задача сразу
 * закрывается «Сделано».
 */
export async function mockupOrderAction(ref: string, taskId: string): Promise<LinkResult> {
  const staff = await requireStaff();
  const result = await linkMockupOrder(String(taskId ?? ""), String(ref ?? ""), staff, await requestIp());
  if (result.ok) {
    revalidatePath("/admin/mockups");
    revalidatePath("/admin/tasks");
  }
  return result;
}
