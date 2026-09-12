import { hashAccessToken, looksLikeAccessToken } from "@/lib/store/access";
import { serviceClient } from "@/lib/supabase";

/**
 * Заказ глазами покупателя.
 *
 * Отдельный тип, а не `Order` из lib/admin/orders.ts, и это не дублирование
 * ради красоты. Админский тип растёт в сторону менеджера — ответственный,
 * заметки, внутренние пометки, — и рано или поздно кто-нибудь добавит в него
 * поле, которое покупателю видеть незачем. Если страница заказа читает тот
 * же тип, новое поле окажется на ней молча. Здесь список полей закрытый, и
 * расширить его можно только руками.
 *
 * `ip`, `assigned_staff_id` и `access_token_hash` не попадают сюда намеренно.
 */
export type OrderView = {
  id: string;
  createdAt: string;
  requestNo: string | null;
  productSlug: string;
  priceUsd: number | null;
  locale: string;
  company: string;
  taxId: string | null;
  country: string | null;
  contactName: string;
  contact: string;
  payment: string;
  comment: string | null;
  status: string;
  offerVersion: string | null;
  offerAcceptedAt: string | null;
  invoiceNo: string | null;
  invoiceIssuedAt: string | null;
  paidAt: string | null;
  deliveredAt: string | null;
  buyerChatId: number | null;
  /** Одноразовый код диплинка. null — уже привязан или заказ старше этой функции. */
  bindCode: string | null;
  entitlementVersion: number;
};

// Одной строкой без склейки: Supabase выводит форму результата из литерала
// селекта, и конкатенация превращает его в обычный string — вместе с типом
// ответа.
const COLUMNS =
  "id, created_at, request_no, product_slug, price_usd, locale, company, tax_id, country, contact_name, contact, payment, comment, status, offer_version, offer_accepted_at, invoice_no, invoice_issued_at, paid_at, delivered_at, buyer_chat_id, bind_code, entitlement_version";

function shape(row: Record<string, unknown>): OrderView {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    requestNo: (row.request_no as string | null) ?? null,
    productSlug: row.product_slug as string,
    priceUsd: (row.price_usd as number | null) ?? null,
    locale: row.locale as string,
    company: row.company as string,
    taxId: (row.tax_id as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    contactName: row.contact_name as string,
    contact: row.contact as string,
    payment: row.payment as string,
    comment: (row.comment as string | null) ?? null,
    status: row.status as string,
    offerVersion: (row.offer_version as string | null) ?? null,
    offerAcceptedAt: (row.offer_accepted_at as string | null) ?? null,
    invoiceNo: (row.invoice_no as string | null) ?? null,
    invoiceIssuedAt: (row.invoice_issued_at as string | null) ?? null,
    paidAt: (row.paid_at as string | null) ?? null,
    deliveredAt: (row.delivered_at as string | null) ?? null,
    buyerChatId: (row.buyer_chat_id as number | null) ?? null,
    bindCode: (row.bind_code as string | null) ?? null,
    // Колонка not null default 1, но строки, прочитанные до применения
    // миграции на реплике, могут прийти без неё.
    entitlementVersion: (row.entitlement_version as number | null) ?? 1,
  };
}

/**
 * Найти заказ по токену из ссылки.
 *
 * Ищем по хешу — токена в базе нет. Форма токена проверяется до похода в
 * базу: мусорные пути (/order/favicon.ico, сканеры уязвимостей) приходят
 * постоянно, и каждый из них не обязан стоить запроса в Supabase.
 */
export async function orderByToken(token: string): Promise<OrderView | null> {
  if (!looksLikeAccessToken(token)) return null;

  const db = serviceClient();
  if (!db) return null;

  const { data, error } = await db
    .from("orders")
    .select(COLUMNS)
    .eq("access_token_hash", hashAccessToken(token))
    .maybeSingle();

  if (error) {
    console.error("store: не прочитал заказ по токену", error.message);
    return null;
  }
  return data ? shape(data as Record<string, unknown>) : null;
}
