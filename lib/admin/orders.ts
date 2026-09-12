import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { hashAccessToken, newAccessToken, newBindCode } from "@/lib/store/access";
import { ORDER_STATUSES, orderUrlFor } from "@/lib/store/orders";
import { isLocale, type Locale } from "@/lib/i18n";
import { notifyBuyer } from "@/lib/store/buyer";
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
  invoice_no: string | null;
  invoice_issued_at: string | null;
  paid_at: string | null;
  paid_ref: string | null;
  delivered_at: string | null;
  buyer_chat_id: number | null;
  entitlement_version: number;
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
  "id, created_at, request_no, product_slug, price_usd, locale, company, tax_id, country, contact_name, contact, payment, comment, status, assigned_staff_id, invoice_no, invoice_issued_at, paid_at, paid_ref, delivered_at, buyer_chat_id, entitlement_version, staff(display_name)";

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
    invoice_no: (row.invoice_no as string | null) ?? null,
    invoice_issued_at: (row.invoice_issued_at as string | null) ?? null,
    paid_at: (row.paid_at as string | null) ?? null,
    paid_ref: (row.paid_ref as string | null) ?? null,
    delivered_at: (row.delivered_at as string | null) ?? null,
    buyer_chat_id: (row.buyer_chat_id as number | null) ?? null,
    entitlement_version: (row.entitlement_version as number | null) ?? 1,
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

/**
 * Заявка двигается именованными действиями, а не выбором статуса из списка.
 *
 * Раньше панель показывала пять одинаковых кнопок со статусами, и это было
 * неверно по существу: «оплачена» — не пометка, а утверждение о деньгах,
 * которое должно оставлять след (кто, когда, по какой строке выписки).
 * Кнопка, ставящая статус и больше ничего, такого следа не оставляет, и
 * через месяц вопрос «откуда мы знаем, что заплатили» остаётся без ответа.
 *
 * Отсюда пять функций вместо одной: у каждой свои предусловия, своя отметка
 * времени и своя запись в журнал. Общий `setOrderStatus` убран намеренно —
 * пока он существовал, мимо него можно было поставить «оплачена», не
 * записав ничего.
 */

type OpResult = { ok: true } | { ok: false; reason: string };

const OK: OpResult = { ok: true };
const fail = (reason: string): OpResult => ({ ok: false, reason });

async function currentOrder(orderId: string) {
  const db = serviceClient();
  if (!db) return null;

  const { data } = await db
    .from("orders")
    .select(
      "id, status, price_usd, locale, invoice_no, invoice_issued_at, paid_at, delivered_at, entitlement_version",
    )
    .eq("id", orderId)
    .maybeSingle();

  return data as {
    id: string;
    status: string;
    price_usd: number | null;
    locale: string;
    invoice_no: string | null;
    invoice_issued_at: string | null;
    paid_at: string | null;
    delivered_at: string | null;
    entitlement_version: number;
  } | null;
}

/**
 * Сумма сделки.
 *
 * Нужна там, где каталог цену не фиксирует: у товаров с вилкой price_usd
 * приходит пустым намеренно (lib/store/orders.ts), договариваться о числе
 * всё равно человеку. Без этой кнопки такие заявки нельзя было бы довести
 * до счёта вообще.
 */
export async function setOrderAmount(
  orderId: string,
  usd: number,
  staff: Staff,
  ip: string,
): Promise<OpResult> {
  if (!Number.isFinite(usd) || usd < 0 || usd > 10_000_000) return fail("Сумма вне разумных границ.");

  const db = serviceClient();
  if (!db) return fail("Нет базы.");

  const before = await currentOrder(orderId);
  if (!before) return fail("Заявка не найдена.");
  // После выставления счёта сумма — часть выданного покупателю документа.
  // Молча переписать её значит разойтись с бумагой, которая уже у него на
  // руках.
  if (before.invoice_issued_at) return fail("Счёт уже выставлен — сумму менять поздно.");

  const amount = Math.round(usd);
  const { error } = await db
    .from("orders")
    .update({ price_usd: amount, assigned_staff_id: staff.id })
    .eq("id", orderId);
  if (error) return fail(error.message);

  await record("order.amount_set", {
    actorStaffId: staff.id,
    targetType: "order",
    targetId: orderId,
    ip,
    meta: { from: before.price_usd, to: amount },
  });
  return OK;
}

/**
 * Выставить счёт.
 *
 * Номер берётся последовательностью в базе, а не max+1 в коде: два
 * менеджера, нажавших кнопку одновременно, иначе получили бы один номер на
 * два счёта, и обнаружилось бы это уже в бухгалтерии.
 *
 * Повторное нажатие номер не меняет — счёт уже у покупателя, и второй номер
 * на тот же заказ означал бы два разных документа об одной сделке.
 */
export async function issueInvoice(
  orderId: string,
  staff: Staff,
  ip: string,
): Promise<OpResult> {
  const db = serviceClient();
  if (!db) return fail("Нет базы.");

  const before = await currentOrder(orderId);
  if (!before) return fail("Заявка не найдена.");
  if (before.status === "cancelled") return fail("Заявка отменена.");
  if (before.price_usd === null) return fail("Сначала проставьте сумму сделки.");

  let invoiceNo = before.invoice_no;
  if (!invoiceNo) {
    const { data, error } = await db.rpc("next_invoice_no");
    if (error || typeof data !== "string") {
      return fail(`Не выдался номер счёта: ${error?.message ?? "пустой ответ"}`);
    }
    invoiceNo = data;
  }

  const { error } = await db
    .from("orders")
    .update({
      status: "invoiced",
      invoice_no: invoiceNo,
      invoice_issued_at: before.invoice_issued_at ?? new Date().toISOString(),
      // Менеджер закрепляется за заявкой первым же действием: заявка на счёт
      // без ответственного — это заявка, о которой каждый думает, что ею
      // занят кто-то другой.
      assigned_staff_id: staff.id,
    })
    .eq("id", orderId);
  if (error) return fail(error.message);

  await record("order.invoiced", {
    actorStaffId: staff.id,
    targetType: "order",
    targetId: orderId,
    ip,
    meta: { invoice_no: invoiceNo, amount_usd: before.price_usd },
  });

  // Уведомление после журнала и после ответа базе: оно не должно решать
  // судьбу операции. Счёт выставлен независимо от того, доехало ли
  // сообщение, и notifyBuyer это знает — он никогда не бросает.
  await notifyBuyer(orderId, "invoiced");
  return OK;
}

/**
 * Подтвердить оплату.
 *
 * Ссылка на строку выписки обязательна. Без неё «оплачено» — чьё-то
 * утверждение, а не запись: через полгода, когда сойдётся не всё, опереться
 * будет не на что, а спорить придётся уже после того, как код отдан.
 */
export async function markOrderPaid(
  orderId: string,
  ref: string,
  staff: Staff,
  ip: string,
): Promise<OpResult> {
  const reference = ref.trim().slice(0, 200);
  if (!reference) return fail("Укажите, чем платёж опознаётся в выписке.");

  const db = serviceClient();
  if (!db) return fail("Нет базы.");

  const before = await currentOrder(orderId);
  if (!before) return fail("Заявка не найдена.");
  if (before.status === "cancelled") return fail("Заявка отменена.");
  if (!before.invoice_issued_at) return fail("Счёт не выставлен — оплачивать нечего.");

  const { error } = await db
    .from("orders")
    .update({
      status: "paid",
      paid_at: before.paid_at ?? new Date().toISOString(),
      paid_ref: reference,
      paid_by: staff.id,
      assigned_staff_id: staff.id,
    })
    .eq("id", orderId);
  if (error) return fail(error.message);

  await record("order.paid", {
    actorStaffId: staff.id,
    targetType: "order",
    targetId: orderId,
    ip,
    meta: { ref: reference, amount_usd: before.price_usd },
  });

  // Самое ценное уведомление во всей цепочке: оно закрывает тишину между
  // «перевёл деньги» и «получил доступ», ради которой покупатель и пишет
  // менеджеру среди ночи.
  await notifyBuyer(orderId, "paid");
  return OK;
}

export async function markOrderDelivered(
  orderId: string,
  staff: Staff,
  ip: string,
): Promise<OpResult> {
  const db = serviceClient();
  if (!db) return fail("Нет базы.");

  const before = await currentOrder(orderId);
  if (!before) return fail("Заявка не найдена.");
  // Передача до оплаты — единственный необратимый шаг во всей цепочке: код
  // нельзя забрать обратно.
  if (!before.paid_at) return fail("Оплата не подтверждена — передавать код рано.");

  const { error } = await db
    .from("orders")
    .update({
      status: "delivered",
      delivered_at: before.delivered_at ?? new Date().toISOString(),
      assigned_staff_id: staff.id,
    })
    .eq("id", orderId);
  if (error) return fail(error.message);

  await record("order.delivered", {
    actorStaffId: staff.id,
    targetType: "order",
    targetId: orderId,
    ip,
  });

  await notifyBuyer(orderId, "delivered");
  return OK;
}

export async function cancelOrder(
  orderId: string,
  staff: Staff,
  ip: string,
): Promise<OpResult> {
  const db = serviceClient();
  if (!db) return fail("Нет базы.");

  const before = await currentOrder(orderId);
  if (!before) return fail("Заявка не найдена.");

  const { error } = await db
    .from("orders")
    .update({ status: "cancelled", assigned_staff_id: staff.id })
    .eq("id", orderId);
  if (error) return fail(error.message);

  await record("order.cancelled", {
    actorStaffId: staff.id,
    targetType: "order",
    targetId: orderId,
    ip,
    meta: { from: before.status },
  });

  await notifyBuyer(orderId, "cancelled");
  return OK;
}

/**
 * Вернуть отменённую заявку в работу.
 *
 * Статус восстанавливается по отметкам времени, а не выбирается руками:
 * отметки — это факты (счёт выставлен, деньги пришли), а выбранный статус
 * был бы мнением. Заявку, где оплата подтверждена, нельзя вернуть в «новая»
 * даже по ошибке.
 */
export async function reopenOrder(
  orderId: string,
  staff: Staff,
  ip: string,
): Promise<OpResult> {
  const db = serviceClient();
  if (!db) return fail("Нет базы.");

  const before = await currentOrder(orderId);
  if (!before) return fail("Заявка не найдена.");
  if (before.status !== "cancelled") return fail("Заявка и так в работе.");

  const status = before.delivered_at
    ? "delivered"
    : before.paid_at
      ? "paid"
      : before.invoice_issued_at
        ? "invoiced"
        : "new";

  const { error } = await db
    .from("orders")
    .update({ status, assigned_staff_id: staff.id })
    .eq("id", orderId);
  if (error) return fail(error.message);

  await record("order.reopened", {
    actorStaffId: staff.id,
    targetType: "order",
    targetId: orderId,
    ip,
    meta: { to: status },
  });
  return OK;
}

/**
 * Перевыпустить ссылку покупателя.
 *
 * Единственный способ вернуть покупателю доступ: токена в базе нет, есть
 * только хеш. Старая ссылка при этом умирает — так и задумано, иначе
 * «перевыпустил, потому что первая утекла» ничего бы не значило.
 *
 * Ссылка возвращается вызывающему один раз и в базу не пишется. Показать её
 * второй раз будет неоткуда — менеджер копирует и отправляет покупателю сам.
 */
export async function reissueOrderLink(
  orderId: string,
  staff: Staff,
  ip: string,
): Promise<{ ok: true; url: string } | { ok: false; reason: string }> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "Нет базы." };

  const before = await currentOrder(orderId);
  if (!before) return { ok: false, reason: "Заявка не найдена." };

  const token = newAccessToken();
  const locale: Locale = isLocale(before.locale) ? before.locale : "ru";

  const { error } = await db
    .from("orders")
    .update({
      access_token_hash: hashAccessToken(token),
      access_issued_at: new Date().toISOString(),
      // Код привязки выпускается заново вместе со ссылкой: покупатель,
      // потерявший её, скорее всего и бота не привязал.
      bind_code: newBindCode(),
    })
    .eq("id", orderId);
  if (error) return { ok: false, reason: error.message };

  await record("order.link_reissued", {
    actorStaffId: staff.id,
    targetType: "order",
    targetId: orderId,
    ip,
  });

  return { ok: true, url: orderUrlFor(token, locale) };
}

/**
 * Отозвать доступ к файлам.
 *
 * Один UPDATE: токен выдачи подписан в том числе версией права, и с её
 * инкрементом все выданные ссылки перестают проходить проверку. В
 * хранилище при этом не ходим и файлы не трогаем — отзыв не должен зависеть
 * от доступности стороннего сервиса.
 *
 * Уже выпущенные подписанные ссылки Supabase живут свою минуту и умирают
 * сами. Отозвать их нельзя (это подтверждает документация хранилища), и
 * именно поэтому покупателю они никогда не выдаются напрямую.
 *
 * Страницу заказа и счёт отзыв не трогает: покупатель, у которого спор по
 * лицензии, не должен заодно потерять собственные документы.
 */
export async function revokeEntitlement(
  orderId: string,
  staff: Staff,
  ip: string,
): Promise<OpResult> {
  const db = serviceClient();
  if (!db) return fail("Нет базы.");

  const before = await currentOrder(orderId);
  if (!before) return fail("Заявка не найдена.");

  const next = (before.entitlement_version ?? 1) + 1;
  const { error } = await db
    .from("orders")
    .update({ entitlement_version: next, assigned_staff_id: staff.id })
    .eq("id", orderId);
  if (error) return fail(error.message);

  await record("entitlement.revoked", {
    actorStaffId: staff.id,
    targetType: "order",
    targetId: orderId,
    ip,
    meta: { from: before.entitlement_version, to: next },
  });
  return OK;
}
