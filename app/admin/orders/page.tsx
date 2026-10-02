import Link from "next/link";

import {
  cancelOrderAction,
  issueInvoiceAction,
  markDeliveredAction,
  markPaidAction,
  reissueLinkAction,
  reopenOrderAction,
  restoreAccessAction,
  revokeAccessAction,
  setAmountAction,
} from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { orderErrorDict, orderPaymentDict, orderStatusDict, ordersDict } from "@/content/admin-panel/orders";
import { productBySlug } from "@/content/products";
import { requireStaff } from "@/lib/admin/guard";
import { PANEL_INTL, pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import { listOrders, type Order } from "@/lib/admin/orders";
import { missingBankVars } from "@/lib/store/requisites";
import { ORDER_STATUSES } from "@/lib/store/orders";

export const dynamic = "force-dynamic";

const BTN = "rounded-lg border px-3 py-1.5 text-xs transition";
const BTN_IDLE = `${BTN} border-line bg-surface-2 text-muted hover:text-text`;
const BTN_GO = `${BTN} border-green/40 bg-green/10 text-green hover:bg-green/20`;
const FIELD =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs text-text placeholder:text-faint focus:border-green/50 focus:outline-none";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; r?: string; e?: string; d?: string; link?: string }>;
}) {
  const staff = await requireStaff();
  const { status, r, e, d, link } = await searchParams;
  const locale = staff.panel_locale;
  const t = pick(ordersDict, locale);
  const statusLabel = pick(orderStatusDict, locale);
  const errors = pick(orderErrorDict, locale);
  // Причина — кодом из действия; незнакомый код — общее «не получилось».
  const reason = e && e in errors ? errors[e as keyof typeof errors] : t.failed;

  const orders = await listOrders(status);
  const missingBank = missingBankVars();

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>

      {/* Без реквизитов счёт можно завести, но нельзя напечатать — покупатель
          увидит номер и не увидит, куда платить. Сказать об этом надо один
          раз и громко, а не оставить менеджеру выяснять это на первой
          сделке. */}
      {missingBank.length ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          {t.bankMissing(missingBank.join(", "))}
        </p>
      ) : null}

      {r === "link" && link ? (
        <div className="mt-4 rounded-xl border border-green/30 bg-green/10 px-4 py-3">
          <p className="text-sm text-green">
            {t.linkReissued}
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
          {r === "ok" ? t.done : reason}
          {r !== "ok" && d ? <span className="mt-1 block font-mono text-xs opacity-80">{d}</span> : null}
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
          {t.all}
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
            {statusLabel[value]}
          </Link>
        ))}
      </div>

      {orders.length ? (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} locale={locale} t={t} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
          {t.empty}
        </p>
      )}

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">
        {t.foot}
      </p>
    </AdminShell>
  );
}

function OrderCard({ order, locale, t }: { order: Order; locale: PanelLocale; t: Picked<typeof ordersDict> }) {
  const product = productBySlug(order.product_slug);
  const statusLabel = pick(orderStatusDict, locale);
  const paymentLabel = pick(orderPaymentDict, locale);
  const at = (iso: string) => when(iso, locale);
  const cancelled = order.status === "cancelled";

  return (
    <li className="rounded-xl border border-line bg-surface px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-xs text-blue-soft">
          {order.request_no ?? order.id.slice(0, 8)}
        </span>
        <span className="font-medium">{product ? product.title[locale] || product.title.ru : order.product_slug}</span>
        <span className="text-sm text-muted">{at(order.created_at)}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs ${
            cancelled
              ? "border-gold/30 bg-gold/10 text-gold"
              : "border-line bg-surface-2 text-muted"
          }`}
        >
          {order.status in statusLabel ? statusLabel[order.status as keyof typeof statusLabel] : order.status}
        </span>
        <span className="ml-auto font-mono text-sm">
          {order.price_usd === null
            ? t.noAmount
            : `${order.price_usd.toLocaleString(PANEL_INTL[locale])} $`}
        </span>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wider text-faint">{t.company}</dt>
          <dd className="mt-0.5">
            {order.company}
            {order.tax_id ? (
              <span className="ml-2 font-mono text-xs text-faint">{order.tax_id}</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-faint">{t.contact}</dt>
          <dd className="mt-0.5">
            {order.contact_name} — <span className="text-green">{order.contact}</span>
            {order.buyer_chat_id ? (
              <span className="ml-2 text-xs text-faint">· {t.botLinked}</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-faint">{t.payment}</dt>
          <dd className="mt-0.5 text-muted">
            {order.payment in paymentLabel ? paymentLabel[order.payment as keyof typeof paymentLabel] : order.payment}
            {order.country ? ` · ${order.country}` : ""}
          </dd>
        </div>
        {order.invoice_no ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-faint">{t.invoice}</dt>
            <dd className="mt-0.5 font-mono text-xs">
              {order.invoice_no}
              {order.invoice_issued_at ? (
                <span className="ml-2 text-faint">{at(order.invoice_issued_at)}</span>
              ) : null}
            </dd>
          </div>
        ) : null}
        {order.paid_at ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-faint">{t.paid}</dt>
            <dd className="mt-0.5 text-xs">
              {at(order.paid_at)}
              {order.paid_ref ? (
                <span className="ml-2 font-mono text-faint">{order.paid_ref}</span>
              ) : null}
            </dd>
          </div>
        ) : null}
        {order.delivered_at ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-faint">{t.delivered}</dt>
            <dd className="mt-0.5 text-xs">{at(order.delivered_at)}</dd>
          </div>
        ) : null}
        {order.access_closed_at ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-faint">{t.access}</dt>
            <dd className="mt-0.5 text-xs text-gold">{t.accessClosed(at(order.access_closed_at))}</dd>
          </div>
        ) : order.entitlement_version > 1 ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-faint">{t.access}</dt>
            <dd className="mt-0.5 text-xs text-gold">
              {t.accessRevoked(order.entitlement_version - 1)}
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
              {t.reopen}
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
                  placeholder={t.amountPlaceholder}
                  className={`${FIELD} w-28`}
                />
                <button type="submit" className={BTN_IDLE}>
                  {t.setAmount}
                </button>
              </form>
            ) : null}

            {!order.invoice_issued_at ? (
              <form action={issueInvoiceAction}>
                <input type="hidden" name="order" value={order.id} />
                <button type="submit" className={BTN_GO}>
                  {t.issueInvoice}
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
                  placeholder={t.refPlaceholder}
                  className={`${FIELD} w-44`}
                />
                <button type="submit" className={BTN_GO}>
                  {t.markPaid}
                </button>
              </form>
            ) : null}

            {order.paid_at && !order.delivered_at ? (
              <form action={markDeliveredAction}>
                <input type="hidden" name="order" value={order.id} />
                <button type="submit" className={BTN_GO}>
                  {t.markDelivered}
                </button>
              </form>
            ) : null}

            <form action={reissueLinkAction}>
              <input type="hidden" name="order" value={order.id} />
              <button type="submit" className={BTN_IDLE}>
                {t.reissueLink}
              </button>
            </form>

            {/* Отзыв доступа к файлам виден только там, где доступ есть:
                у неоплаченной заявки скачивать нечего, и кнопка была бы
                приглашением нажать не то. */}
            {order.paid_at && order.access_closed_at ? (
              <form action={restoreAccessAction}>
                <input type="hidden" name="order" value={order.id} />
                <button type="submit" className={BTN_IDLE}>
                  {t.restoreAccess}
                </button>
              </form>
            ) : order.paid_at ? (
              <form action={revokeAccessAction}>
                <input type="hidden" name="order" value={order.id} />
                <button type="submit" className={BTN_IDLE}>
                  {t.revokeAccess}
                </button>
              </form>
            ) : null}

            <form action={cancelOrderAction}>
              <input type="hidden" name="order" value={order.id} />
              <button type="submit" className={BTN_IDLE}>
                {t.cancel}
              </button>
            </form>
          </>
        )}

        {order.owner_name ? (
          <span className="ml-auto text-xs text-faint">{t.ownedBy(order.owner_name)}</span>
        ) : null}
      </div>
    </li>
  );
}
