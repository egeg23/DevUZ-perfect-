import {
  AD_COMMISSION,
  AD_VAT,
  PREPAY_DISCOUNT,
  channels,
  type MarketingChannel,
} from "@/content/marketing";
import { formatUsd, formatUzs } from "@/lib/calculator";
import type { Locale } from "@/lib/i18n";

/** Контекстная реклама — один из двух вариантов или без неё. */
export type ContextChoice = "none" | "google" | "both";

export type MarketingSelection = {
  /** Отмеченные каналы, кроме контекста — он выбирается отдельно. */
  picked: string[];
  context: ContextChoice;
  /** Рекламный бюджет в месяц, сум. */
  budget: number;
};

export type MarketingEstimate = {
  lines: MarketingChannel[];
  /** Работа студии в первый месяц и дальше в месяц — без рекламы. */
  first: number;
  monthly: number;
  /** Рекламный бюджет: ноль, если ни один отмеченный канал не рекламный. */
  adBudget: number;
  vat: number;
  commission: number;
  /** Первый месяц и каждый следующий — вместе с бюджетом, НДС и комиссией. */
  firstTotal: number;
  monthlyTotal: number;
  /** Сколько сэкономит оплата трёх месяцев вперёд: 5% с работы. */
  prepaySaving: number;
};

const CONTEXT_ID: Record<Exclude<ContextChoice, "none">, string> = {
  google: "context-google",
  both: "context-both",
};

/**
 * Считает маркетинг по ценам из `content/marketing.ts`.
 *
 * Бюджет учитывается, только когда отмечен хоть один рекламный канал:
 * SMM и SEO без рекламы не платят ни НДС рекламных систем, ни нашу
 * комиссию, и показывать им «бюджет 6 500 000» значило бы приписать к
 * расчёту деньги, которых не будет.
 */
export function estimateMarketing(selection: MarketingSelection): MarketingEstimate | null {
  const picked = new Set(selection.picked);
  const context = selection.context === "none" ? null : CONTEXT_ID[selection.context];

  // Порядок строк — как в прайсе, а не как кликал человек. Контекст берётся
  // только из переключателя: два его варианта взаимоисключающие.
  const lines = channels.filter((c) =>
    c.group === "context" ? c.id === context : picked.has(c.id),
  );
  if (!lines.length) return null;

  const first = lines.reduce((sum, c) => sum + c.first, 0);
  const monthly = lines.reduce((sum, c) => sum + c.monthly, 0);
  const adBudget = lines.some((c) => c.ads) ? Math.max(0, selection.budget) : 0;
  const vat = Math.round(adBudget * AD_VAT);
  const commission = Math.round(adBudget * AD_COMMISSION);
  const ads = adBudget + vat + commission;

  return {
    lines,
    first,
    monthly,
    adBudget,
    vat,
    commission,
    firstTotal: first + ads,
    monthlyTotal: monthly + ads,
    prepaySaving: Math.round(monthly * PREPAY_DISCOUNT),
  };
}

/**
 * Цена для текста страницы: в сумах для Узбекистана, для остальных — сумы и
 * доллары рядом. Договор у студии в сумах, но зарубежному читателю «23 256 000
 * UZS» без перевода ничего не скажет.
 */
export function priceText(value: number, locale: Locale): string {
  if (locale === "ru" || locale === "uz") return formatUzs(value, locale);
  return `${formatUzs(value, locale)} (≈ ${formatUsd(value)})`;
}
