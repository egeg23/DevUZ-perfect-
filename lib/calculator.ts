import { USD_RATE } from "@/content/company";
import {
  RANGE_FACTOR,
  WEEKS_FACTOR,
  categoryBySlug,
  optionsFor,
  type CalcOption,
  type ScopeLine,
} from "@/content/calculator";
import { t, type Locale } from "@/lib/i18n";

/** Значения, выбранные пользователем: id опции → выбор. */
export type Selection = Record<string, string | number | boolean>;

export type Estimate = {
  lowUzs: number;
  highUzs: number;
  weeksLow: number;
  weeksHigh: number;
  tech: string[];
  work: string[];
  /** Человекочитаемая расшифровка выбора — уходит менеджеру вместе с лидом. */
  breakdown: Array<{ label: string; value: string }>;
};

/**
 * Округление до полумиллиона сум.
 *
 * Оценка «от 23 847 300» выглядит как результат расчёта по смете, которой у
 * нас на этом этапе нет. Круглое число честнее сообщает, что это прикидка.
 */
function roundUzs(value: number): number {
  return Math.round(value / 500_000) * 500_000;
}

export function formatUzs(value: number, locale: Locale): string {
  // Разряды разделяются неразрывным пробелом, чтобы число не переносилось.
  const grouped = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const suffix = { ru: "сум", en: "UZS", uz: "so‘m", zh: "苏姆" }[locale];
  return `${grouped} ${suffix}`;
}

export function formatUsd(uzs: number): string {
  const usd = Math.round(uzs / USD_RATE / 50) * 50;
  return `$${usd.toLocaleString("en-US")}`;
}

/** Значение опции по умолчанию: для выбора — первый вариант. */
export function defaultSelection(categorySlug: string): Selection {
  const selection: Selection = {};
  for (const option of optionsFor(categorySlug)) {
    if (option.kind === "choice") selection[option.id] = option.choices[0].id;
    else if (option.kind === "counter") selection[option.id] = 0;
    else selection[option.id] = false;
  }
  return selection;
}

function pushScope(scope: ScopeLine | undefined, locale: Locale, tech: string[], work: string[]) {
  if (!scope) return;
  if (scope.tech) tech.push(t(scope.tech, locale));
  if (scope.work) work.push(t(scope.work, locale));
}

/**
 * Считает предварительную оценку.
 *
 * Порядок операций важен: сначала складываются фиксированные надбавки, и
 * только потом применяются множители. Иначе «ускоренные сроки» умножали бы
 * только базу и не касались бы интеграций, хотя торопить приходится именно их.
 */
export function estimate(
  categorySlug: string,
  selection: Selection,
  locale: Locale,
): Estimate | null {
  const category = categoryBySlug(categorySlug);
  if (!category) return null;

  const tech = category.tech[locale].slice();
  const work = category.work[locale].slice();
  const breakdown: Array<{ label: string; value: string }> = [];

  let adds = 0;
  let mul = 1;
  let weeks = category.baseWeeks;

  for (const option of optionsFor(categorySlug)) {
    const value = selection[option.id];
    const label = t(option.label, locale);

    if (option.kind === "toggle") {
      if (value !== true) continue;
      adds += option.addUzs ?? 0;
      mul *= option.mul ?? 1;
      weeks += option.weeks ?? 0;
      pushScope(option.scope, locale, tech, work);
      breakdown.push({ label, value: "✓" });
    } else if (option.kind === "choice") {
      const chosen =
        option.choices.find((c) => c.id === value) ?? option.choices[0];
      adds += chosen.addUzs ?? 0;
      mul *= chosen.mul ?? 1;
      weeks += chosen.weeks ?? 0;
      pushScope(chosen.scope, locale, tech, work);
      // Первый вариант — это «по умолчанию, ничего не меняем»: показывать
      // его в расшифровке значит засорять её строками без информации.
      if (chosen.id !== option.choices[0].id) {
        breakdown.push({ label, value: t(chosen.label, locale) });
      }
    } else {
      const count = typeof value === "number" ? Math.max(0, Math.min(option.max, value)) : 0;
      if (count === 0) continue;
      adds += option.unitUzs * count;
      mul *= 1 + (option.unitMul ?? 0) * count;
      weeks += (option.unitWeeks ?? 0) * count;
      pushScope(option.scope, locale, tech, work);
      breakdown.push({ label, value: `${count} × ${t(option.unitLabel, locale)}` });
    }
  }

  const total = (category.baseUzs + adds) * mul;

  return {
    lowUzs: roundUzs(total),
    highUzs: roundUzs(total * RANGE_FACTOR),
    weeksLow: Math.max(1, Math.round(weeks)),
    weeksHigh: Math.max(2, Math.ceil(weeks * WEEKS_FACTOR)),
    // Одна и та же строка может прийти из базы и из опции — показываем один раз.
    tech: Array.from(new Set(tech)),
    work: Array.from(new Set(work)),
    breakdown,
  };
}

/**
 * Собирает расчёт в текст, который подставляется в чат.
 *
 * Ассистент получает его как обычное сообщение клиента, поэтому сразу знает
 * и услугу, и порядок бюджета — это закрывает половину BANT ещё до первого
 * вопроса, и разговор начинается не с нуля.
 */
export function estimateToMessage(
  categoryTitle: string,
  result: Estimate,
  locale: Locale,
  prefix: string,
  weeksLabel: string,
): string {
  const lines = [
    prefix,
    "",
    `• ${categoryTitle}`,
    `• ${formatUzs(result.lowUzs, locale)} – ${formatUzs(result.highUzs, locale)} (${formatUsd(result.lowUzs)} – ${formatUsd(result.highUzs)})`,
    `• ${result.weeksLow}–${result.weeksHigh} ${weeksLabel}`,
  ];

  for (const item of result.breakdown) {
    lines.push(`• ${item.label}: ${item.value}`);
  }

  return lines.join("\n");
}

export type { CalcOption };
