import type { MockupOrder } from "@/lib/admin/mockup-order";
import { serviceClient } from "@/lib/supabase";

/**
 * Подписи клиентов заказов макета — отдельно от mockup-order-store: их
 * читает и task-store (ряд задачи), а store сам зовёт task-store.
 */

const str = (v: unknown) => (typeof v === "string" && v ? v : null);

/** Подписи клиентов заказов: компания лида или название касания. */
export async function orderClients(orders: readonly Pick<MockupOrder, "leadId" | "prospectId">[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const db = serviceClient();
  if (!db) return out;
  const leadIds = [...new Set(orders.flatMap((o) => (o.leadId ? [o.leadId] : [])))];
  const prospectIds = [...new Set(orders.flatMap((o) => (o.prospectId ? [o.prospectId] : [])))];
  const [leads, prospects] = await Promise.all([
    leadIds.length ? db.from("leads").select("id, company, contact_name, request_no").in("id", leadIds) : Promise.resolve({ data: [] }),
    prospectIds.length ? db.from("prospects").select("id, label, host").in("id", prospectIds) : Promise.resolve({ data: [] }),
  ]);
  for (const r of (leads.data ?? []) as Record<string, unknown>[]) {
    const label = str(r.company) ?? str(r.contact_name) ?? str(r.request_no);
    if (label) out.set(String(r.id), label);
  }
  for (const r of (prospects.data ?? []) as Record<string, unknown>[]) {
    const label = str(r.label) ?? str(r.host);
    if (label) out.set(String(r.id), label);
  }
  return out;
}

