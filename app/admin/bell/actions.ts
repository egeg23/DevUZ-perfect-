"use server";

import { currentStaff } from "@/lib/admin/guard";
import { markBellDone } from "@/lib/admin/bell-store";

/**
 * «✓ Сделано» в колокольчике — одной строке или «Отметить всё». Себе, из
 * сессии: номер чужой строки ничего не отметит (markBellDone сверяет staff_id).
 */
export async function bellDoneAction(id: unknown): Promise<boolean> {
  const staff = await currentStaff();
  if (!staff) return false;
  const target = id === "all" ? "all" : typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null;
  if (target === null) return false;
  return markBellDone(staff.id, target);
}
