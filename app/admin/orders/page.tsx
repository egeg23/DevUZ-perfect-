import Link from "next/link";

import {
  cancelOrderAction,
  issueInvoiceAction,
  markDeliveredAction,
  markPaidAction,
  reissueLinkAction,
  reopenOrderAction,
  revokeAccessAction,
  setAmountAction,
} from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { productBySlug } from "@/content/products";
import { requireStaff } from "@/lib/admin/guard";
import { listOrders, type Order } from "@/lib/admin/orders";
import { missingBankVars } from "@/lib/store/requisites";
import { ORDER_STATUSES } from "@/lib/store/orders";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  new: "новая",
  invoiced: "счёт выставлен",
  paid: "оплачена",
  delivered: "передан",
  cancelled: "отменена",
};

const PAYMENT_LABEL: Record<string, string> = {
  bank: "безнал по счёту",
  manager: "хочет обсудить оплату",
};

const BTN = "rounded-lg border px-3 py-1.5 text-xs transition";
const BTN_IDLE = `${BTN} border-line bg-surface-2 text-muted hover:text-text`;
const BTN_GO = `${BTN} border-green/40 bg-green/10 text-green hover:bg-green/20`;
const FIELD =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs text-text placeholder:text-faint focus:border-green/50 focus:outline-none";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; r?: string; e?: string; link?: string }>;
}) {
  const staff = await requireStaff();
  const { status, r, e, link } = await searchParams;

  const orders = await listOrders(status);
  const missingBank = missingBankVars();

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">Заявки на покупку</h1>

      {/* Без реквизитов счёт можно завести, но нельзя напечатать — покупатель
          увидит номер и не увидит, куда платить. Сказать об этом надо один
          раз и громко, а не оставить менеджеру выяснять это на первой
          сделке. */}
      {missingBank.length ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          Банковские реквизиты не настроены: {missingBank.join(", ")}. Счёт
          выставится, но покупатель не увидит, куда платить. Переменные задаются
          в окружении на сервере.
        </p>
      ) : null}

      {r === "link" && link ? (
        <div className="mt-4 rounded-xl border border-green/30 bg-green/10 px-4 py-3">
          <p className="text-sm text-green">
            Ссылка перевыпущена. Старая больше не работает — отправьте покупателю эту:
          </p>
          <p className="mt-2 break-all font-mono text-xs text-text">{link}</p>
        </div>
      ) : r ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            r === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {r === "ok" ? "Готово." : (e ?? "Не получилось.")}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full border px-3 py-1 text-xs transition ${
            !status
              ? "border-green/40 bg-green/10 text-green"
              : "border-line bg-surface text-muted hover:text-text"
          }`}
        >
          все
        </Link>
        {ORDER_STATUSES.map((value) => (
          <Link
            key={value}
            href={`/admin/orders?status=${value}`}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              status === value
                ? "border-green/40 bg-green/10 text-green"
                : "border-line bg-surface text-muted hover:text-text"
            }`}
          >
            {STATUS_LABEL[value]}
          </Link>
        ))}
      </div>

      {orders.length ? (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
          Заявок нет.
        </p>
      )}

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">
        Контакт покупателя показан сразу, в отличие от лида: он прислал
        реквизиты сам, чтобы ему выставили счёт. Каждое действие закрепляет
        заявку за вами и попадает в журнал. Подтверждение оплаты требует
        ссылки на выписку — без неё «оплачено» нечем подтвердить.
      </p>
    </AdminShell>
  );
}

function OrderCard({ order }: { order: Order }) {
  const product = productBySlug(order.product_slug);
  const cancelled = order.status === "cancelled";

  return (
    <li className="rounded-xl border border-line bg-surface px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-xs text-blue-soft">
          {order.request_no ?? order.id.slice(0, 8)}
        </span>
        <span className="font-medium">{product ? product.title.ru : order.product_slug}</span>
        <span className="text-sm text-muted">{when(order.created_at)}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs ${
            cancelled
              ? "border-gold/30 bg-gold/10 text-gold"
              : "border-line bg-surface-2 text-muted"
          }`}
        >
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
        <span className="ml-auto font-mono text-sm">
          {order.price_usd === null
            ? "сумма не проставлена"
            : `${order.price_usd.toLocaleString("ru-RU")} $`}
        </span>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wider text-faint">Компания</dt>
          <dd className="mt-0.5">
            {order.company}
            {order.tax_id ? (
              <span className="ml-2 font-mono text-xs text-faint">{order.tax_id}</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-faint">Контакт</dt>
          <dd className="mt-0.5">
            {order.contact_name} — <span className="text-green">{order.contact}</span>
            {order.buyer_chat_id ? (
              <span className="ml-2 text-xs text-faint">· бот привязан</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-faint">Оплата</dt>
          <dd className="mt-0.5 text-muted">
            {PAYMENT_LABEL[order.payment] ?? order.payment}
            {order.country ? ` · ${order.country}` : ""}
          </dd>
        </div>
        {order.invoice_no ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-faint">Счёт</dt>
            <dd className="mt-0.5 font-mono text-xs">
              {order.invoice_no}
              {order.invoice_issued_at ? (
                <span className="ml-2 text-faint">{when(order.invoice_issued_at)}</span>
              ) : null}
            </dd>
          </div>
        ) : null}
        {order.paid_at ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-faint">Оплачено</dt>
            <dd className="mt-0.5 text-xs">
              {when(order.paid_at)}
              {order.paid_ref ? (
                <span className="ml-2 font-mono text-faint">{order.paid_ref}</span>
              ) : null}
            </dd>
          </div>
        ) : null}
        {order.delivered_at ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-faint">Передан</dt>
            <dd className="mt-0.5 text-xs">{when(order.delivered_at)}</dd>
          </div>
        ) : null}
        {order.entitlement_version > 1 ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-faint">Доступ</dt>
            <dd className="mt-0.5 text-xs text-gold">
              отзывался {order.entitlement_version - 1} раз(а)
            </dd>
          </div>
        ) : null}
      </dl>

      {order.comment ? (
        <p className="mt-3 whitespace-pre-line rounded-lg border border-line-soft bg-surface-2 px-4 py-3 text-sm leading-relaxed">
          {order.comment}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
        {cancelled ? (
          <form action={reopenOrderAction}>
            <input type="hidden" name="order" value={order.id} />
            <button type="submit" className={BTN_GO}>
              вернуть в работу
            </button>
          </form>
        ) : (
          <>
            {/* Сумма — только пока счёта нет: после выставления она уже
                напечатана у покупателя на бумаге. */}
            {order.price_usd === null && !order.invoice_issued_at ? (
              <form action={setAmountAction} className="flex items-center gap-1.5">
                <input type="hidden" name="order" value={order.id} />
                <input
                  name="usd"
                  type="number"
                  min={0}
                  step={1}
                  required
                  placeholder="сумма, $"
                  className={`${FIELD} w-28`}
                />
                <button type="submit" className={BTN_IDLE}>
                  проставить
                </button>
              </form>
            ) : null}

            {!order.invoice_issued_at ? (
              <form action={issueInvoiceAction}>
                <input type="hidden" name="order" value={order.id} />
                <button type="submit" className={BTN_GO}>
                  выставить счёт
                </button>
              </form>
            ) : null}

            {order.invoice_issued_at && !order.paid_at ? (
              <form action={markPaidAction} className="flex items-center gap-1.5">
                <input type="hidden" name="order" value={order.id} />
                <input
                  name="ref"
                  required
                  maxLength={200}
                  placeholder="строка выписки"
                  className={`${FIELD} w-44`}
                />
                <button type="submit" className={BTN_GO}>
                  оплата получена
                </button>
              </form>
            ) : null}

            {order.paid_at && !order.delivered_at ? (
              <form action={markDeliveredAction}>
                <input type="hidden" name="order" value={order.id} />
                <button type="submit" className={BTN_GO}>
                  код передан
                </button>
              </form>
            ) : null}

            <form action={reissueLinkAction}>
              <input type="hidden" name="order" value={order.id} />
              <button type="submit" className={BTN_IDLE}>
                перевыпустить ссылку
              </button>
            </form>

            {/* Отзыв доступа к файлам виден только там, где доступ есть:
                у неоплаченной заявки скачивать нечего, и кнопка была бы
                приглашением нажать не то. */}
            {order.paid_at ? (
              <form action={revokeAccessAction}>
                <input type="hidden" name="order" value={order.id} />
                <button type="submit" className={BTN_IDLE}>
                  отозвать доступ к файлам
                </button>
              </form>
            ) : null}

            <form action={cancelOrderAction}>
              <input type="hidden" name="order" value={order.id} />
              <button type="submit" className={BTN_IDLE}>
                отменить
              </button>
            </form>
          </>
        )}

        {order.owner_name ? (
          <span className="ml-auto text-xs text-faint">ведёт {order.owner_name}</span>
        ) : null}
      </div>
    </li>
  );
}
