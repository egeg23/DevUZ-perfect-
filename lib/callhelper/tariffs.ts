/**
 * DevUz CallHelper — тарифы подписки и доля менеджера.
 *
 * Владелец, 25.11.2026, на тарифы с большей маржой: «Цены те же, минут
 * меньше»; менеджеру — «20% от прибыли». Себестоимость минуты разговора —
 * распознавание двух голосов и подсказки, ≈1,0–1,55 ₽; эквайринг и налог —
 * 9% от суммы. Подписка и оплата — следующими шагами; цены здесь, чтобы
 * страница продукта, оферта и «Финансы» взяли одно и то же.
 */

export type CallTariff = { key: "start" | "work"; name: string; rub: number; minutes: number };

/** Цена за оператора в месяц и минуты разговора в пакете. */
export const CALLHELPER_TARIFFS: readonly CallTariff[] = [
  { key: "start", name: "Старт", rub: 4_900, minutes: 1_000 },
  { key: "work", name: "Рабочий", rub: 9_900, minutes: 2_500 },
];

/** Минута сверх пакета. */
export const CALLHELPER_OVER_RUB = 3;

/** Пробный период: дни и минуты на компанию. */
export const CALLHELPER_TRIAL = { days: 3, minutes: 300 } as const;

/** Ведущему — процент от прибыли подписки (сумма − себестоимость − 9%). */
export const CALLHELPER_MANAGER_PERCENT = 20;

/** Себестоимость минуты, ₽: нижняя (паузы вырезаны) и верхняя граница. */
export const CALLHELPER_MINUTE_COST = { low: 1.0, high: 1.55 } as const;

/** Эквайринг и налог ИП в РФ, доля от суммы. */
export const CALLHELPER_FEES = 0.09;

/** Чистыми студии после себестоимости, сборов и доли менеджера — при полном расходе пакета. */
export function studioNet(rub: number, minutes: number, minuteCost: number): number {
  const profit = rub - minutes * minuteCost - rub * CALLHELPER_FEES;
  return Math.round(profit * (1 - CALLHELPER_MANAGER_PERCENT / 100));
}
