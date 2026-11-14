import { proof } from "@/content/company";
import { PROTOTYPE_HOURS } from "@/lib/admin/outreach";
import { defaultSelection, estimate, formatUsd, formatUzs } from "@/lib/calculator";
import type { Locale } from "@/lib/i18n";

import { LANDING_TEXT, type LandingMeta, type LandingSlug, type LandingText } from "./index";

/**
 * Числа страницы — из калькулятора и `proof`, а не из текста: цена на
 * странице под запрос и в калькуляторе одна, правка цены — в одном месте.
 */
export type CalcPrice = { uzs: number; weeksLow: number; weeksHigh: number };

export function calcPrice(calc: string): CalcPrice {
  const result = estimate(calc, defaultSelection(calc), "ru");
  if (!result) throw new Error(`service-landings: нет типа калькулятора «${calc}»`);
  return { uzs: result.priceUzs, weeksLow: result.weeksLow, weeksHigh: result.weeksHigh };
}

/** «6 млн сум», «9,5 mln so‘m», «600万苏姆» — для заголовков, где полное число не влезает. */
export function shortUzs(uzs: number, locale: Locale): string {
  if (locale === "zh") return `${Math.round(uzs / 10_000)}万苏姆`;
  const mln = Math.round(uzs / 100_000) / 10;
  const comma = locale === "ru" || locale === "uk" || locale === "pl";
  const n = comma ? String(mln).replace(".", ",") : String(mln);
  const unit = { ru: "млн сум", uk: "млн сум", uz: "mln so‘m", en: "mln UZS", pl: "mln UZS" }[locale];
  return `${n} ${unit}`;
}

export function weeksRange(p: CalcPrice): string {
  return `${p.weeksLow}–${p.weeksHigh}`;
}

/** Подставляет значки страницы. Неизвестный значок остаётся как есть — тест его поймает. */
export function fillText(text: string, p: CalcPrice, locale: Locale): string {
  const values: Record<string, string> = {
    price: formatUzs(p.uzs, locale),
    priceShort: shortUzs(p.uzs, locale),
    usd: formatUsd(p.uzs),
    weeks: weeksRange(p),
    hours: String(PROTOTYPE_HOURS),
    staff: String(proof.staff),
    projects: `${proof.projects}+`,
    countries: String(proof.countries),
  };
  return text.replace(/\{(\w+)\}/g, (all, key: string) => values[key] ?? all);
}

/** Тексты страницы на языке с подставленными числами. */
export function landingText(meta: LandingMeta, locale: Locale): LandingText {
  const raw = LANDING_TEXT[locale].pages[meta.slug as LandingSlug];
  const p = calcPrice(meta.calc);
  const f = (s: string) => fillText(s, p, locale);
  return {
    title: raw.title,
    query: raw.query,
    seoTitle: f(raw.seoTitle),
    seoDescription: f(raw.seoDescription),
    h1: f(raw.h1),
    lead: f(raw.lead),
    kinds: raw.kinds.map((k) => ({ title: f(k.title), text: f(k.text) })),
    included: raw.included.map(f),
    steps: raw.steps.map((s) => ({ title: f(s.title), days: f(s.days), text: f(s.text) })),
    local: raw.local.map((l) => ({ title: f(l.title), text: f(l.text) })),
    faq: raw.faq.map((q) => ({ q: f(q.q), a: f(q.a) })),
  };
}
