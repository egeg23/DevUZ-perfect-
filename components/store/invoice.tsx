import { company, USD_RATE } from "@/content/company";
import { orderPage } from "@/content/order-page";
import { productBySlug } from "@/content/products";
import { t, type Locale } from "@/lib/i18n";
import type { SellerBank } from "@/lib/store/requisites";
import type { OrderView } from "@/lib/store/order-view";

/**
 * Счёт на оплату.
 *
 * Печатается из браузера — @media print в globals.css. Ни PDF-библиотеки, ни
 * рендера на сервере здесь нет намеренно: счёт печатают один раз, а
 * генератор PDF это несколько мегабайт зависимости, шрифты с кириллицей и
 * отдельный путь, который ломается молча. Браузер печатает HTML в PDF сам, на
 * любом устройстве, и делает это лучше.
 *
 * Компонент не рисуется вовсе, если нет реквизитов или номера счёта: счёт
 * без расчётного счёта — это бумага, по которой нельзя заплатить, и выдать
 * такую покупателю хуже, чем не выдать никакой. Решение об этом принимает
 * вызывающий, здесь оба аргумента обязательны.
 */
export function Invoice({
  order,
  locale,
  bank,
  invoiceNo,
  issuedAt,
}: {
  order: OrderView;
  locale: Locale;
  bank: SellerBank;
  invoiceNo: string;
  issuedAt: string;
}) {
  const c = (key: keyof typeof orderPage) => t(orderPage[key], locale);
  const product = productBySlug(order.productSlug);
  const title = product ? t(product.title, locale) : order.productSlug;

  const issued = new Date(issuedAt);
  const due = new Date(issued.getTime() + bank.paymentDays * 86_400_000);

  const amount = order.priceUsd;
  const money = (value: number) =>
    value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <section
      id="invoice"
      className="rounded-2xl border border-line bg-surface p-4 sm:p-8"
      lang={locale}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-lg font-semibold">
          {c("invoice")} {c("invoiceNo")} {invoiceNo}
        </h2>
        <p className="text-sm text-muted">
          {c("invoiceDate")} {date(issued, locale)}
        </p>
      </header>

      <div className="invoice-rule mt-5 grid gap-6 border-t border-line-soft pt-5 sm:grid-cols-2">
        <Party
          heading={c("seller")}
          name={company.legal.name}
          lines={[
            `${c("taxId")}: ${bank.taxId}`,
            `${c("address")}: ${t(company.legal.address, locale)}`,
            `${c("bank")}: ${bank.bankName}`,
            `${c("account")}: ${bank.account}`,
            `${c("mfo")}: ${bank.mfo}`,
            bank.swift ? `${c("swift")}: ${bank.swift}` : null,
            bank.bankAddress,
          ]}
        />
        <Party
          heading={c("buyer")}
          name={order.company}
          lines={[
            order.taxId ? `${c("taxId")}: ${order.taxId}` : null,
            order.country,
            order.contactName,
          ]}
        />
      </div>

      {/* Четыре колонки со сроками и суммами не сжимаются ниже своей
          минимальной ширины, и на телефоне таблица утаскивала за собой всю
          страницу — одиннадцать пикселей вбок на каждой странице сайта.
          Прокрутка своя, а не у документа; на печати её не должно быть
          вовсе, иначе на бумагу попадёт обрезанная таблица. */}
      <div className="invoice-scroll -mx-1 mt-6 overflow-x-auto px-1">
        <table className="invoice-rule w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wider text-faint">
              <th className="py-2 pr-3 font-medium">{c("invoiceLine")}</th>
              <th className="px-2 py-2 text-right font-medium sm:px-3">{c("invoiceQty")}</th>
              <th className="px-2 py-2 text-right font-medium sm:px-3">{c("invoicePrice")}, USD</th>
              <th className="py-2 pl-2 text-right font-medium sm:pl-3">{c("invoiceSum")}, USD</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line-soft align-top">
              <td className="py-3 pr-3">
                {title}
                {order.offerVersion ? (
                  <span className="mt-0.5 block text-xs text-faint">
                    {t(orderPage.licence, locale)} — {order.offerVersion}
                  </span>
                ) : null}
              </td>
              <td className="px-2 py-3 text-right tabular-nums sm:px-3">1</td>
              <td className="px-2 py-3 text-right tabular-nums sm:px-3">
                {amount === null ? "—" : money(amount)}
              </td>
              <td className="py-3 pl-2 text-right tabular-nums sm:pl-3">
                {amount === null ? "—" : money(amount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-right text-base font-semibold">
        {c("invoiceTotal")}:{" "}
        <span className="tabular-nums">
          {amount === null ? c("amountByAgreement") : `${money(amount)} USD`}
        </span>
      </p>

      {/* Счёт в долларах, а платёж — на сумовый счёт: пересчёт делает банк по
          курсу дня платежа. Записать сюда сегодняшний курс значило бы
          зафиксировать число, которое к моменту оплаты уже неверно, и
          покупатель заплатил бы не ту сумму. Поэтому строка называет правило,
          а не результат. */}
      {!bank.swift && amount !== null ? (
        <p className="mt-1 text-right text-xs text-faint">
          {locale === "ru"
            ? `Оплата в сумах по курсу ЦБ РУз на дату платежа (ориентировочно ${(amount * USD_RATE).toLocaleString("ru-RU")} сум).`
            : `Payable in UZS at the Central Bank rate on the payment date (approx. ${(amount * USD_RATE).toLocaleString("en-US")} UZS).`}
        </p>
      ) : null}

      <div className="invoice-rule mt-6 space-y-1 border-t border-line-soft pt-4 text-xs leading-relaxed text-muted">
        <p>{c("invoiceVat")}</p>
        <p>
          {c("invoiceDue")}: {date(due, locale)}
        </p>
        <p>
          {c("orderNo")}: {order.requestNo ?? order.id.slice(0, 8)}
        </p>
        <p>{c("invoiceSignature")}</p>
      </div>
    </section>
  );
}

function Party({
  heading,
  name,
  lines,
}: {
  heading: string;
  name: string;
  lines: (string | null)[];
}) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-faint">{heading}</h3>
      <p className="mt-1 font-medium">{name}</p>
      {/* Номер счёта — двадцать цифр без единого места для переноса.
          break-words здесь не срабатывает (нет границ слов), поэтому
          anywhere. */}
      <div className="mt-1 space-y-0.5 text-sm text-muted [overflow-wrap:anywhere]">
        {lines.filter(Boolean).map((line) => (
          <p key={line as string}>{line}</p>
        ))}
      </div>
    </div>
  );
}

/**
 * Дата в счёте.
 *
 * Ташкент, а не UTC: счёт выставлен в Ташкенте, и дата на бумаге должна
 * совпадать с днём, который у бухгалтера в календаре. Разница в пять часов
 * превращает вечерний счёт во вчерашний.
 */
function date(value: Date, locale: Locale): string {
  return value.toLocaleDateString(locale === "ru" ? "ru-RU" : locale === "zh" ? "zh-CN" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Tashkent",
  });
}
