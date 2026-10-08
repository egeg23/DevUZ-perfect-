"use server";

import { revalidatePath } from "next/cache";

import { requestIp, requireStaff } from "@/lib/admin/guard";
import { mockupCode, type CodeResult } from "@/lib/admin/mockups-store";

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
