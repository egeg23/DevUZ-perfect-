import { record } from "@/lib/admin/audit";
import { canTrash, managerTrashLine, mayTrash, seesTrash, trashedLabel } from "@/lib/admin/lead-trash";
import { wants } from "@/lib/admin/notify-prefs";
import { messageWindow } from "@/lib/admin/tasks";
import type { Staff } from "@/lib/admin/session";
import { noticesOf } from "@/lib/qualify/notices";
import { editLeadCards, esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

export type TrashResult = { ok: true; requestNo: string | null } | { ok: false; reason: "role" | "not_yours" | "gone" | "failed" };

/** Откуда нажали — в журнал: бот или панель. */
export type TrashVia = "telegram" | "panel";

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
  via: TrashVia = "telegram",
): Promise<TrashResult> {
  if (!seesTrash(staff.role)) return { ok: false, reason: "role" };
  const db = serviceClient();
  if (!db || !leadId) return { ok: false, reason: "failed" };

  const { data: lead } = await db
    .from("leads")
    .select("id, request_no, status, assigned_staff_id, company, contact_name, summary")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { ok: false, reason: "gone" };
  const owner = (lead.assigned_staff_id as string | null) ?? null;
  if (!mayTrash(staff, { assigned_staff_id: owner })) return { ok: false, reason: "not_yours" };
  // Лид удаляется целиком: что в нём было — в журнал, чтобы удалённое менеджером можно было проверить.
  const label = String(lead.company || lead.contact_name || "—");
  const request = (lead.summary as { request?: unknown } | null)?.request;
  const words = typeof request === "string" && request.trim() ? request.trim().slice(0, 300) : null;

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
    meta: { request_no: requestNo, status: lead.status, via, label, request: words, owner, by_role: staff.role },
  });
  if (!canTrash(staff.role)) await tellBosses(managerTrashLine(staff, { request_no: requestNo, label, words }));
  await editLeadCards(notices, leadId, trashedLabel(staff), except).catch((e) =>
    console.error("lead-trash: не переписал карточки", e),
  );
  return { ok: true, requestNo };
}

/**
 * «Мусор» менеджера — строкой владельцу и руководителю под «Отчётами».
 * Ночью не пишем (CLAUDE.md, «Ночью бот молчит»): строка есть в журнале.
 */
async function tellBosses(text: string): Promise<void> {
  if (!messageWindow(new Date())) return;
  const db = serviceClient();
  if (!db) return;
  const { data } = await db.from("staff").select("telegram_user_id, notify_off").eq("is_active", true).in("role", ["admin", "head"]);
  for (const r of data ?? []) {
    if (!Number(r.telegram_user_id) || !wants((r.notify_off as string[] | null) ?? [], "reports")) continue;
    await sendMessage(Number(r.telegram_user_id), esc(text)).catch((e) => console.error("lead-trash: строка владельцу не ушла", e));
  }
}
