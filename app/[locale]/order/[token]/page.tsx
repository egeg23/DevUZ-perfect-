import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Invoice } from "@/components/store/invoice";
import { PrintButton } from "@/components/store/print-button";
import { company } from "@/content/company";
import { orderPage } from "@/content/order-page";
import { productBySlug } from "@/content/products";
import { isLocale, localeHref, t, type Locale } from "@/lib/i18n";
import { orderByToken, type OrderView } from "@/lib/store/order-view";
import { downloadsLeft } from "@/lib/store/delivery";
import { signDelivery } from "@/lib/store/delivery-token";
import { currentRelease } from "@/lib/store/releases";
import { missingBankVars, sellerBank } from "@/lib/store/requisites";

// Страница читает базу по токену из адреса — кэшировать здесь нечего и
// опасно: закэшированный ответ одного покупателя показался бы другому.
export const dynamic = "force-dynamic";

/**
 * Индексации нет и быть не может: на странице реквизиты покупателя и его
 * счёт. Мета-тега достаточно, а в robots.txt этот путь намеренно не попадает
 * — Disallow запрещает краулеру заходить на страницу, то есть и увидеть
 * noindex он тоже не сможет. Из двух мер здесь работает только одна, и это
 * именно noindex.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale: raw, token } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const order = await orderByToken(token);
  const c = (key: keyof typeof orderPage) => t(orderPage[key], locale);

  if (!order) {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{c("notFound")}</h1>
        <p className="mt-3 max-w-xl text-muted">{c("notFoundHint")}</p>
        <a
          href={company.telegramUrl}
          className="mt-6 inline-flex rounded-xl bg-green px-5 py-2.5 text-sm font-medium text-ink transition hover:brightness-110"
        >
          Telegram @{company.telegram}
        </a>
      </Shell>
    );
  }

  const product = productBySlug(order.productSlug);
  const title = product ? t(product.title, locale) : order.productSlug;
  const bank = sellerBank();
  const cancelled = order.status === "cancelled";

  return (
    <Shell>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-green">
        {c("orderNo")} {order.requestNo ?? order.id.slice(0, 8)}
      </p>
      <h1 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
      <p className="mt-2 text-muted">
        {c("orderedAt")} {shortDate(order.createdAt, locale)} ·{" "}
        {order.priceUsd === null
          ? c("amountByAgreement")
          : `${order.priceUsd.toLocaleString("ru-RU")} USD`}
      </p>

      {cancelled ? (
        <div className="mt-8 rounded-2xl border border-gold/30 bg-gold/10 px-5 py-4">
          <p className="font-medium text-gold">{c("cancelled")}</p>
          <p className="mt-1 text-sm text-muted">{c("cancelledHint")}</p>
        </div>
      ) : (
        <Timeline order={order} locale={locale} />
      )}

      {/* Счёт показывается, только когда он действительно выставлен и когда
          из него можно заплатить. Без реквизитов это не документ, а бумага с
          суммой — покупатель ушёл бы её оплачивать и вернулся с вопросом. */}
      {!cancelled && order.invoiceNo && order.invoiceIssuedAt && bank ? (
        <div className="mt-8">
          <div className="no-print mb-3 flex justify-end">
            <PrintButton label={c("invoicePrint")} />
          </div>
          <Invoice
            order={order}
            locale={locale}
            bank={bank}
            invoiceNo={order.invoiceNo}
            issuedAt={order.invoiceIssuedAt}
          />
        </div>
      ) : null}

      {!cancelled && order.paidAt ? <Download order={order} locale={locale} /> : null}

      {!cancelled && order.bindCode ? (
        <section className="mt-8 rounded-2xl border border-line bg-surface px-5 py-5">
          <h2 className="font-medium">{c("telegram")}</h2>
          <p className="mt-1 text-sm text-muted">{c("telegramHint")}</p>
          <a
            href={`https://t.me/${company.telegram}?start=order_${order.bindCode}`}
            className="mt-4 inline-flex rounded-xl bg-green px-5 py-2.5 text-sm font-medium text-ink transition hover:brightness-110"
          >
            Telegram @{company.telegram}
          </a>
        </section>
      ) : null}

      <section className="mt-8 rounded-2xl border border-line bg-surface px-5 py-5">
        <h2 className="font-medium">{c("documents")}</h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          <li>
            <Link href={localeHref(locale, "offer")} className="text-green hover:underline">
              {c("offer")}
            </Link>
            {order.offerVersion ? (
              <span className="ml-2 text-faint">
                {order.offerVersion}
                {order.offerAcceptedAt
                  ? `, ${c("acceptedAt")} ${shortDate(order.offerAcceptedAt, locale)}`
                  : ""}
              </span>
            ) : null}
          </li>
          <li>
            <Link href={localeHref(locale, "licence")} className="text-green hover:underline">
              {c("licence")}
            </Link>
          </li>
        </ul>
      </section>

      <div className="mt-8 space-y-2 text-xs leading-relaxed text-faint">
        <p>{c("keepLink")}</p>
        <p>{c("lostLink")}</p>
      </div>

      {/* Менеджеру, а не покупателю: строка видна только когда реквизиты не
          заданы, и тогда счёт всё равно не выставить. Молчать об этом —
          значит дать покупателю страницу, где кнопка счёта просто не
          появляется без объяснения. */}
      {!bank && order.invoiceNo ? (
        <p className="mt-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs text-gold">
          Счёт {order.invoiceNo} выставлен, но банковские реквизиты поставщика
          не настроены ({missingBankVars().join(", ")}) — напечатать его нельзя.
          Напишите нам, пришлём счёт вручную.
        </p>
      ) : null}
    </Shell>
  );
}

/**
 * Выдача файла.
 *
 * Ссылка ведёт на наш маршрут, а не на хранилище. Подписанная ссылка
 * Supabase не отзывается ничем, кроме обращения в поддержку, и может
 * пережить собственный срок годности в кэше CDN — отдать её покупателю
 * значило бы отдать доступ навсегда. Наш маршрут проверяет права на каждый
 * клик и выпускает минутную ссылку заново.
 */
async function Download({ order, locale }: { order: OrderView; locale: Locale }) {
  const c = (key: keyof typeof orderPage) => t(orderPage[key], locale);

  const release = await currentRelease(order.productSlug);
  if (!release) {
    return (
      <section className="mt-8 rounded-2xl border border-line bg-surface px-5 py-5">
        <h2 className="font-medium">{c("download")}</h2>
        <p className="mt-1 text-sm text-muted">{c("downloadPreparing")}</p>
      </section>
    );
  }

  const token = signDelivery({
    orderId: order.id,
    productSlug: order.productSlug,
    entitlementVersion: order.entitlementVersion,
  });

  // Секрет подписи не задан — ссылку выдать нечем, и показывать кнопку,
  // которая ведёт в 503, хуже, чем честно сказать «готовим».
  if (!token) {
    return (
      <section className="mt-8 rounded-2xl border border-line bg-surface px-5 py-5">
        <h2 className="font-medium">{c("download")}</h2>
        <p className="mt-1 text-sm text-muted">{c("downloadPreparing")}</p>
      </section>
    );
  }

  const left = await downloadsLeft(order.id);

  return (
    <section className="mt-8 rounded-2xl border border-green/30 bg-green/5 px-5 py-5">
      <h2 className="font-medium text-green">{c("download")}</h2>
      <p className="mt-1 text-sm text-muted">{c("deliveredHint")}</p>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-faint">{c("downloadVersion")}</dt>
          <dd className="mt-0.5 font-mono">{release.version}</dd>
        </div>
        {release.bytes !== null ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-faint">{c("downloadSize")}</dt>
            <dd className="mt-0.5 font-mono">{humanBytes(release.bytes)}</dd>
          </div>
        ) : null}
      </dl>

      <a
        href={`/api/download/${token}`}
        className="mt-5 inline-flex rounded-xl bg-green px-5 py-2.5 text-sm font-medium text-ink transition hover:brightness-110"
      >
        {c("downloadFile")}
      </a>

      {left ? (
        <p className="mt-3 text-xs leading-relaxed text-faint">
          {c("downloadLeft")
            .replace("{total}", String(left.total))
            .replace("{today}", String(left.today))}
        </p>
      ) : null}

      {release.sha256 ? (
        <div className="mt-4 border-t border-green/20 pt-4">
          <p className="text-xs uppercase tracking-wider text-faint">{c("downloadChecksum")}</p>
          <p className="mt-1 break-all font-mono text-xs">{release.sha256}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-faint">{c("downloadChecksumHint")}</p>
        </div>
      ) : null}
    </section>
  );
}

/** Размер человеку, а не в байтах: «209 715 200» ни о чём не говорит. */
function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  const units = ["КБ", "МБ", "ГБ"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">{children}</div>
  );
}

/**
 * Где сейчас заказ.
 *
 * Четыре шага в один ряд, пройденные зелёные. Это единственное, ради чего
 * покупатель открывает страницу второй раз, поэтому стоит выше счёта: «дошли
 * ли деньги» — вопрос, на который он ищет ответ, а не «как выглядит счёт».
 */
function Timeline({ order, locale }: { order: OrderView; locale: Locale }) {
  const steps = [
    { key: "stepNew", at: order.createdAt, done: true },
    { key: "stepInvoiced", at: order.invoiceIssuedAt, done: Boolean(order.invoiceIssuedAt) },
    { key: "stepPaid", at: order.paidAt, done: Boolean(order.paidAt) },
    { key: "stepDelivered", at: order.deliveredAt, done: Boolean(order.deliveredAt) },
  ] as const;

  const hint = order.deliveredAt
    ? "deliveredHint"
    : order.paidAt
      ? "waitingDelivery"
      : order.invoiceIssuedAt
        ? "waitingPayment"
        : "waitingInvoice";

  return (
    <section className="mt-8">
      <ol className="grid gap-3 sm:grid-cols-4">
        {steps.map((step) => (
          <li
            key={step.key}
            className={`rounded-xl border px-4 py-3 ${
              step.done ? "border-green/40 bg-green/10" : "border-line bg-surface"
            }`}
          >
            <p className={`text-sm font-medium ${step.done ? "text-green" : "text-faint"}`}>
              {t(orderPage[step.key], locale)}
            </p>
            <p className="mt-0.5 text-xs text-faint">
              {step.at ? shortDate(step.at, locale) : "—"}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-muted">{t(orderPage[hint], locale)}</p>
    </section>
  );
}

function shortDate(value: string, locale: Locale): string {
  return new Date(value).toLocaleDateString(
    locale === "ru" ? "ru-RU" : locale === "zh" ? "zh-CN" : "en-GB",
    { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Tashkent" },
  );
}
