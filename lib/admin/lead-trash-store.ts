import { record } from "@/lib/admin/audit";
import { canTrash, trashedLabel } from "@/lib/admin/lead-trash";
import type { Staff } from "@/lib/admin/session";
import { noticesOf } from "@/lib/qualify/notices";
import { editLeadCards } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

export type TrashResult = { ok: true; requestNo: string | null } | { ok: false; reason: "role" | "gone" | "failed" };

/**
 * Удалить лид как мусор (lead-trash.ts). Копии карточки читаются до
 * удаления — потом их не найти: `lead_notices` уходит вместе с лидом, как и
 * предложения очереди (`lead_offers`), поэтому очередь его больше не
 * предложит. Переписка касания и проекты остаются, ссылка на лид у них
 * обнуляется. `except` — копия, которую уже переписал сам колбэк.
 */
export async function trashLead(
  leadId: string,
  staff: Pick<Staff, "id" | "role" | "username" | "display_name">,
  except?: { chatId: number | string; messageId: number },
): Promise<TrashResult> {
  if (!canTrash(staff.role)) return { ok: false, reason: "role" };
  const db = serviceClient();
  if (!db || !leadId) return { ok: false, reason: "failed" };

  const { data: lead } = await db.from("leads").select("id, request_no, status").eq("id", leadId).maybeSingle();
  if (!lead) return { ok: false, reason: "gone" };

  const notices = await noticesOf(leadId);
  const { error } = await db.from("leads").delete().eq("id", leadId);
  if (error) {
    console.error("lead-trash: не удалил лид", error.message);
    return { ok: false, reason: "failed" };
  }

  const requestNo = (lead.request_no as string | null) ?? null;
  await record("lead.trashed", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: leadId,
    meta: { request_no: requestNo, status: lead.status, via: "telegram" },
  });
  await editLeadCards(notices, leadId, trashedLabel(staff), except).catch((e) =>
    console.error("lead-trash: не переписал карточки", e),
  );
  return { ok: true, requestNo };
}
