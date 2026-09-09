import Link from "next/link";

import { changeOrderStatus } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { productBySlug } from "@/content/products";
import { requireStaff } from "@/lib/admin/guard";
import { listOrders } from "@/lib/admin/orders";
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

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; r?: string }>;
}) {
  const staff = await requireStaff();
  const { status, r } = await searchParams;

  const orders = await listOrders(status);

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">Заявки на покупку</h1>

      {r ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            r === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {r === "ok" ? "Готово." : "Не получилось."}
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
          {orders.map((order) => {
            const product = productBySlug(order.product_slug);
            return (
              <li key={order.id} className="rounded-xl border border-line bg-surface px-5 py-4">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-mono text-xs text-blue-soft">
                    {order.request_no ?? order.id.slice(0, 8)}
                  </span>
                  <span className="font-medium">
                    {product ? product.title.ru : order.product_slug}
                  </span>
                  <span className="text-sm text-muted">{when(order.created_at)}</span>
                  <span className="ml-auto font-mono text-sm">
                    {order.price_usd === null
                      ? "цена по договорённости"
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
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-faint">Оплата</dt>
                    <dd className="mt-0.5 text-muted">
                      {PAYMENT_LABEL[order.payment] ?? order.payment}
                      {order.country ? ` · ${order.country}` : ""}
                    </dd>
                  </div>
                </dl>

                {order.comment ? (
                  <p className="mt-3 whitespace-pre-line rounded-lg border border-line-soft bg-surface-2 px-4 py-3 text-sm leading-relaxed">
                    {order.comment}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
                  {ORDER_STATUSES.map((value) => (
                    <form key={value} action={changeOrderStatus}>
                      <input type="hidden" name="order" value={order.id} />
                      <input type="hidden" name="status" value={value} />
                      <button
                        type="submit"
                        disabled={order.status === value}
                        className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                          order.status === value
                            ? "border-green/40 bg-green/10 text-green"
                            : "border-line bg-surface-2 text-muted hover:text-text"
                        }`}
                      >
                        {STATUS_LABEL[value]}
                      </button>
                    </form>
                  ))}
                  {order.owner_name ? (
                    <span className="ml-auto text-xs text-faint">ведёт {order.owner_name}</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
          Заявок нет.
        </p>
      )}

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">
        Контакт покупателя показан сразу, в отличие от лида: он прислал
        реквизиты сам, чтобы ему выставили счёт. Прятать их значило бы мешать
        сделать ровно то, о чём он попросил. Смена статуса закрепляет заявку за
        вами и попадает в журнал.
      </p>
    </AdminShell>
  );
}
