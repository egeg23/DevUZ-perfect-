import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { ORDER_STATUSES } from "@/lib/store/orders";
import { serviceClient } from "@/lib/supabase";

export type Order = {
  id: string;
  created_at: string;
  request_no: string | null;
  product_slug: string;
  price_usd: number | null;
  locale: string;
  company: string;
  tax_id: string | null;
  country: string | null;
  contact_name: string;
  contact: string;
  payment: string;
  comment: string | null;
  status: string;
  assigned_staff_id: string | null;
  owner_name: string | null;
};

/**
 * Контакт здесь показывается сразу — в отличие от лида, и это осознанная
 * разница, а не забытая проверка.
 *
 * У лида контакт закрыт, потому что лид ещё никому не принадлежит и
 * выгрузить их все — реальный соблазн. Здесь другое: покупатель сам
 * прислал реквизиты, чтобы ему выставили счёт, и прятать их от менеджера
 * значит мешать сделать ровно то, о чём он попросил. Спрятанный контакт
 * защищал бы клиента от нас в тот момент, когда он сам к нам пришёл.
 */
const COLUMNS =
  "id, created_at, request_no, product_slug, price_usd, locale, company, tax_id, country, contact_name, contact, payment, comment, status, assigned_staff_id, staff(display_name)";

function shape(row: Record<string, unknown>): Order {
  const joined = row.staff as unknown;
  const owner = (Array.isArray(joined) ? joined[0] : joined) as
    | { display_name?: string }
    | null
    | undefined;

  return {
    id: row.id as string,
    created_at: row.created_at as string,
    request_no: (row.request_no as string | null) ?? null,
    product_slug: row.product_slug as string,
    price_usd: (row.price_usd as number | null) ?? null,
    locale: row.locale as string,
    company: row.company as string,
    tax_id: (row.tax_id as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    contact_name: row.contact_name as string,
    contact: row.contact as string,
    payment: row.payment as string,
    comment: (row.comment as string | null) ?? null,
    status: row.status as string,
    assigned_staff_id: (row.assigned_staff_id as string | null) ?? null,
    owner_name: owner?.display_name ?? null,
  };
}

export async function listOrders(status?: string): Promise<Order[]> {
  const db = serviceClient();
  if (!db) return [];

  let query = db.from("orders").select(COLUMNS).order("created_at", { ascending: false });
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.limit(200);
  if (error) {
    console.error("admin: не прочитал заявки", error.message);
    return [];
  }
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

export async function setOrderStatus(
  orderId: string,
  status: string,
  staff: Staff,
  ip: string,
): Promise<boolean> {
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) return false;

  const db = serviceClient();
  if (!db) return false;

  const { data: before } = await db
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  if (!before) return false;

  const { error } = await db
    .from("orders")
    // Менеджер закрепляется за заявкой первым же действием: заявка на счёт
    // без ответственного — это заявка, о которой каждый думает, что ею
    // занят кто-то другой.
    .update({ status, assigned_staff_id: staff.id })
    .eq("id", orderId);

  if (error) return false;

  await record("order.status_changed", {
    actorStaffId: staff.id,
    targetType: "order",
    targetId: orderId,
    ip,
    meta: { from: before.status, to: status },
  });

  return true;
}
