import type { Staff } from "@/lib/admin/session";
import { serviceClient } from "@/lib/supabase";

/**
 * Лид лидогенерации после оплаты — статус и ступени меняют только владелец и
 * руководитель.
 *
 * Владелец, 23.11.2026: «этапы и статусы они могут проставлять до оплаты,
 * после оплаты уже я или Александр меняем». Оплата — хоть один платёж по
 * проекту из этого лида (`project_payments`): с этой минуты в проекте деньги и
 * 20% ведущему (lib/admin/finance.ts, LEADGEN_MANAGER_PERCENT), и менеджер не
 * должен двигать сделку сам. До оплаты — как у любого лида: свой лид менеджер
 * ведёт сам (canEdit, canMark).
 */

export const LEADGEN_SOURCE = "leadgen";

/** Кто правит лид лидогенерации после оплаты. */
export const AFTER_PAY_ROLES: readonly Staff["role"][] = ["admin", "head"];

export function paidLock(lead: { source: string | null; paid: boolean }, role: Staff["role"]): boolean {
  return lead.source === LEADGEN_SOURCE && lead.paid && !AFTER_PAY_ROLES.includes(role);
}

/**
 * Закрыт ли лид для этого человека. Не лидогенерация или владелец с
 * руководителем — без запросов к базе. База не ответила — не закрываем:
 * права на свой лид проверены и без этого.
 */
export async function lockedAfterPay(leadId: string | null, staff: Pick<Staff, "role">): Promise<boolean> {
  if (!leadId || AFTER_PAY_ROLES.includes(staff.role)) return false;
  const db = serviceClient();
  if (!db) return false;
  const { data: lead } = await db.from("leads").select("source").eq("id", leadId).maybeSingle();
  if (lead?.source !== LEADGEN_SOURCE) return false;
  const { data: projects } = await db.from("projects").select("id").eq("lead_id", leadId);
  const ids = (projects ?? []).map((p) => String(p.id));
  if (!ids.length) return false;
  const { count } = await db
    .from("project_payments")
    .select("id", { count: "exact", head: true })
    .in("project_id", ids)
    .gt("amount_usd", 0);
  return paidLock({ source: lead.source, paid: (count ?? 0) > 0 }, staff.role);
}
