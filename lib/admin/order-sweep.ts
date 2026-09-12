/**
 * Правила напоминаний по заявкам на покупку.
 *
 * Чистая функция без базы и без Telegram — намеренно. Это единственная
 * часть свипа, про которую можно спросить «а что будет на четырнадцатый
 * день», и получить ответ тестом, а не наблюдением за продом через две
 * недели.
 *
 * Каждая стадия проговаривается один раз: свип ходит каждые пять минут, и
 * без метки одна застрявшая заявка напомнила бы о себе двести восемьдесят
 * восемь раз в сутки. Через день чат отдела продаж выключили бы совсем —
 * вместе с брифами настоящих лидов.
 */

const DAY = 24 * 60 * 60 * 1000;

/** Заявка без счёта столько дней — менеджер о ней забыл. */
export const AWAITING_INVOICE_DAYS = 2;
/** Первое напоминание о неоплаченном счёте. */
export const INVOICE_OVERDUE_DAYS = 14;
/** Второе и последнее: дальше это уже не «забыли», а «не будет». */
export const INVOICE_DEAD_DAYS = 30;

export type SweepOrder = {
  id: string;
  requestNo: string | null;
  company: string;
  productSlug: string;
  status: string;
  createdAt: string;
  invoiceIssuedAt: string | null;
  paidAt: string | null;
  lastNudgedStage: string | null;
};

export type NudgeStage =
  | "awaiting_invoice"
  | "invoice_overdue"
  | "invoice_dead"
  | "paid_no_release";

export type Nudge = { stage: NudgeStage; headline: string; detail: string };

const days = (from: string, now: Date): number =>
  (now.getTime() - new Date(from).getTime()) / DAY;

/**
 * О чём напомнить по этой заявке прямо сейчас.
 *
 * `hasRelease` приходит снаружи: каталог релизов читается один раз на весь
 * проход, а не по заявке. Иначе двадцать оплаченных заказов одного продукта
 * дали бы двадцать одинаковых запросов в базу.
 *
 * Возвращает null, если напоминать не о чем или об этой стадии уже сказали.
 */
export function orderNudge(
  order: SweepOrder,
  now: Date,
  hasRelease: boolean,
): Nudge | null {
  const fresh = (stage: NudgeStage, headline: string, detail: string): Nudge | null =>
    order.lastNudgedStage === stage ? null : { stage, headline, detail };

  const who = order.company || "покупатель без названия";
  const number = order.requestNo ?? order.id.slice(0, 8);

  // Оплачено, а отдавать нечего — самый дорогой отказ во всей цепочке:
  // деньги у нас, кода у покупателя нет, и узнать об этом от него самого
  // значит узнать слишком поздно. Проверяется первым.
  if (order.paidAt && !hasRelease) {
    return fresh(
      "paid_no_release",
      `💥 Заявка ${number} оплачена, а релиза нет`,
      `${who} · «${order.productSlug}». Покупатель видит «файл готовим». Выложите релиз в панели.`,
    );
  }

  if (order.status === "cancelled" || order.paidAt) return null;

  if (order.invoiceIssuedAt) {
    const age = days(order.invoiceIssuedAt, now);

    // Порядок проверок от большего к меньшему: заявка на сороковой день
    // должна получить «мёртвый», а не «просрочен», даже если про
    // четырнадцатый день ей почему-то не сказали.
    if (age >= INVOICE_DEAD_DAYS) {
      return fresh(
        "invoice_dead",
        `🪦 Счёт по заявке ${number} не оплачен ${INVOICE_DEAD_DAYS} дней`,
        `${who}. Пора либо звонить, либо отменять — висящая заявка портит счёт в отчётах.`,
      );
    }
    if (age >= INVOICE_OVERDUE_DAYS) {
      return fresh(
        "invoice_overdue",
        `⏳ Счёт по заявке ${number} не оплачен ${INVOICE_OVERDUE_DAYS} дней`,
        `${who}. Напомните — на этом сроке половина сделок оживает одним сообщением.`,
      );
    }
    return null;
  }

  if (days(order.createdAt, now) >= AWAITING_INVOICE_DAYS) {
    return fresh(
      "awaiting_invoice",
      `📄 Заявка ${number} ждёт счёта ${AWAITING_INVOICE_DAYS} дня`,
      `${who} · «${order.productSlug}». Человек оставил реквизиты и ждёт — это самый горячий контакт, какой бывает.`,
    );
  }

  return null;
}
