/**
 * Оплата Claudery в рублях → проект в долларах, как все деньги панели
 * (projects.amount_usd, целые доллары). Курс — ЦБ РФ на день оплаты; ЦБ не
 * ответил — последний известный, а если и его нет, `FALLBACK_RUB_PER_USD`
 * с пометкой в заметке проекта: владелец поправит сумму в карточке.
 */

/** Запасной курс, ₽ за $, — только если ЦБ ни разу не ответил. */
export const FALLBACK_RUB_PER_USD = 90;

/** Курс доллара из ежедневной выгрузки ЦБ (XML_daily.asp): «92,1234» за номинал. */
export function usdRateFromCbr(xml: string): number | null {
  const m = /<CharCode>USD<\/CharCode>[\s\S]*?<Nominal>(\d+)<\/Nominal>[\s\S]*?<Value>([\d,.]+)<\/Value>/.exec(xml);
  if (!m) return null;
  const nominal = Number(m[1]);
  const value = Number(m[2].replace(",", "."));
  const rate = value / (nominal || 1);
  return Number.isFinite(rate) && rate > 1 && rate < 1000 ? rate : null;
}

/** Рубли в целые доллары, не меньше доллара. */
export function usdOf(rubAmount: number, rubPerUsd: number): number {
  return Math.max(1, Math.round(rubAmount / rubPerUsd));
}

/** Заметка проекта: откуда сумма в долларах. */
export function projectNote(rubText: string, rate: number, source: "cbr" | "last" | "fallback", day: string, requestNo: string): string {
  const how = source === "cbr" ? `по курсу ЦБ ${rate.toFixed(2)} ₽/$ на ${day}` : source === "last" ? `по последнему курсу ЦБ ${rate.toFixed(2)} ₽/$ (ЦБ не ответил)` : `по запасному курсу ${rate} ₽/$: ЦБ не ответил, проверьте сумму`;
  return `Claudery: клиент оплатил ${rubText} через Platega ${day}, заявка ${requestNo}. В долларах ${how}. Ведущему 40% с суммы, остальное соучредителям.`;
}
