import { record } from "@/lib/admin/audit";
import { canLinkOrder, type MockupOrder } from "@/lib/admin/mockup-order";
import { orderClients } from "@/lib/admin/mockup-order-clients";
import { parseMockupRef, showcaseCases } from "@/lib/admin/mockups";
import type { Staff } from "@/lib/admin/session";
import { actOnTask, afterAct } from "@/lib/admin/task-store";
import { serviceClient } from "@/lib/supabase";

/**
 * Заказ макета в задаче — база (правила — lib/admin/mockup-order.ts).
 *
 * Открытые заказы читают «Прототипы» (выбор при сборке) и «Макеты»
 * (привязать готовый макет, в том числе витрину); ответственного «по
 * заказу» — «Макеты» и «Главная» менеджера.
 */

const str = (v: unknown) => (typeof v === "string" && v ? v : null);

/** Заказ с подписями: клиент и кто заказал. */
export type MockupOrderView = MockupOrder & { client: string | null; creatorName: string | null };

const ORDER_COLUMNS = "id, title, creator_id, assignee_id, mockup_lead_id, mockup_prospect_id, mockup_site, mockup_ref, status";

function orderOf(r: Record<string, unknown>): MockupOrder {
  return {
    taskId: String(r.id),
    title: String(r.title ?? ""),
    creatorId: String(r.creator_id),
    assigneeId: String(r.assignee_id),
    leadId: str(r.mockup_lead_id),
    prospectId: str(r.mockup_prospect_id),
    site: str(r.mockup_site),
    ref: str(r.mockup_ref),
    open: r.status === "new" || r.status === "in_work",
  };
}

/**
 * Заказы, к которым ещё нет макета: открытые задачи с «Заказ макета: да».
 * Руководитель и владелец видят все, остальные — где исполнитель они.
 */
export async function openMockupOrders(staff: Pick<Staff, "id" | "role">): Promise<MockupOrderView[]> {
  const db = serviceClient();
  if (!db) return [];
  let query = db
    .from("staff_tasks")
    .select(ORDER_COLUMNS)
    .eq("mockup", true)
    .is("mockup_ref", null)
    .in("status", ["new", "in_work"])
    .order("created_at", { ascending: true })
    .limit(100);
  if (staff.role !== "admin" && staff.role !== "head") query = query.eq("assignee_id", staff.id);
  const { data, error } = await query;
  // Миграция 0173 ещё не применена — заказов просто нет, страница живёт.
  if (error) return [];
  const orders = ((data ?? []) as Record<string, unknown>[]).map(orderOf);
  if (!orders.length) return [];
  const [clients, people] = await Promise.all([
    orderClients(orders),
    db.from("staff").select("id, display_name").in("id", [...new Set(orders.map((o) => o.creatorId))]),
  ]);
  const names = new Map(((people.data ?? []) as Record<string, unknown>[]).map((p) => [String(p.id), str(p.display_name)]));
  return orders.map((o) => ({
    ...o,
    client: (o.leadId ? clients.get(o.leadId) : o.prospectId ? clients.get(o.prospectId) : null) ?? null,
    creatorName: names.get(o.creatorId) ?? null,
  }));
}

/**
 * Кто заказал каждый макет: `mockup_ref` → поставивший задачу. Несколько
 * заказов на один макет — последний.
 */
export async function orderOwners(refs: readonly string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const db = serviceClient();
  if (!db || !refs.length) return out;
  const { data, error } = await db
    .from("staff_tasks")
    .select("mockup_ref, creator_id")
    .in("mockup_ref", [...refs])
    .order("created_at", { ascending: true })
    .limit(2000);
  if (error) return out;
  for (const r of (data ?? []) as Record<string, unknown>[]) out.set(String(r.mockup_ref), String(r.creator_id));
  return out;
}

export type LinkResult =
  | { ok: true; closed: boolean }
  | { ok: false; reason: "forbidden" | "not_found" | "linked" | "offline" };

/** Есть ли такой макет: прототип не черновик или проект витрины. */
async function mockupExists(ref: string): Promise<boolean> {
  const target = parseMockupRef(ref);
  if (!target) return false;
  if (target.kind === "showcase") return showcaseCases().some((c) => c.slug === target.slug);
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db.from("protos").select("id").eq("id", target.id).maybeSingle();
  return Boolean(data);
}

/**
 * Привязать макет к заказу. Дальше ответственный за макет — тот, кто
 * поставил задачу. Привязал сам исполнитель — задача закрывается «Сделано»
 * тем же путём, что кнопка (бот пишет поставившему). Привязал руководитель
 * или владелец, а исполнитель другой, — задачу закрывает исполнитель сам.
 */
export async function linkMockupOrder(
  taskId: string,
  ref: string,
  staff: Staff,
  ip: string,
  options: { close?: boolean } = {},
): Promise<LinkResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  const { data } = await db.from("staff_tasks").select(ORDER_COLUMNS).eq("id", taskId).eq("mockup", true).maybeSingle();
  if (!data) return { ok: false, reason: "not_found" };
  const order = orderOf(data as Record<string, unknown>);
  if (!canLinkOrder(order, staff)) return { ok: false, reason: "forbidden" };
  if (order.ref) return { ok: false, reason: "linked" };
  if (!(await mockupExists(ref))) return { ok: false, reason: "not_found" };

  // Поверх пустого: два нажатия в одну секунду не перепишут друг друга.
  const { data: saved, error } = await db
    .from("staff_tasks")
    .update({ mockup_ref: ref, updated_at: new Date().toISOString() })
    .eq("id", order.taskId)
    .is("mockup_ref", null)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, reason: "offline" };
  if (!saved) return { ok: false, reason: "linked" };
  await record("mockup.order", { actorStaffId: staff.id, targetType: "task", targetId: order.taskId, ip, meta: { ref } });

  let closed = false;
  if (options.close !== false && order.open && order.assigneeId === staff.id) {
    const acted = await actOnTask(order.taskId, staff, "done", { ip, via: "panel" });
    if (acted.ok) {
      closed = true;
      await afterAct(acted.task, acted.eventId);
    }
  }
  return { ok: true, closed };
}
