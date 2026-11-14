import type { Locale } from "@/lib/i18n";

import { en } from "./en";
import { pl } from "./pl";
import { ru } from "./ru";
import { uk } from "./uk";
import { uz } from "./uz";
import { zh } from "./zh";

/**
 * Страницы под поисковые запросы: «разработка сайтов в Ташкенте»,
 * «создание интернет-магазина», «разработка мобильных приложений»,
 * «Telegram-бот для бизнеса», «лендинг под ключ», «корпоративный сайт».
 *
 * Владелец, 14.11.2026: «Начинай… мы должны перегнать топ-10 по Ташкенту
 * точно, не забудь адаптировать под [все] языки». Разбор выдачи Google по
 * Ташкенту в тот же день: у лидеров (innosoft.uz, webnow.uz, tipa.uz,
 * icorp.uz) страница под запрос — 2–2,5 тысячи слов, цена в сумах в
 * заголовке, типы сайтов с ценами, этапы со сроками в днях, таблица цен,
 * сравнение «студия, фрилансер, конструктор», Click/Payme/Uzcard и 1С, офис
 * в Ташкенте, 10–12 вопросов, кейсы. У нас до этого — 150 слов на услугу.
 *
 * Здесь — устройство страниц: какая цена из калькулятора, какие кейсы и
 * соседние страницы. Тексты — по файлу на язык (ru.ts, uz.ts, …), одной
 * формы: тест сверяет число пунктов. Числа в текстах — только значками
 * ({price}, {usd}, {weeks}, {hours}, {staff}, {projects}, {countries}),
 * их подставляет страница из калькулятора и `proof`: цена на странице и в
 * калькуляторе одна.
 *
 * Два адреса — прежние страницы услуг (web-development, mobile-apps): у них
 * уже есть ссылки из разборов и меню, новая страница их заменяет, а не
 * спорит с ними в выдаче. Четыре — новые.
 */

export const LANDING_SLUGS = [
  "web-development",
  "online-store",
  "mobile-apps",
  "telegram-bots",
  "landing-page",
  "corporate-website",
] as const;
export type LandingSlug = (typeof LANDING_SLUGS)[number];

/** Вид работ на странице: цена — база калькулятора этого типа. */
export type LandingKind = { calc: string };

export type LandingMeta = {
  slug: LandingSlug;
  /** Тип калькулятора (content/calculator.ts) — цена «от» и срок страницы. */
  calc: string;
  icon: string;
  /** Виды работ с ценами — по порядку `kinds` в текстах. */
  kinds: LandingKind[];
  /** Кейсы студии (content/cases.ts) — показываются только те, что на сайте. */
  cases: string[];
  related: LandingSlug[];
};

export const LANDINGS: LandingMeta[] = [
  {
    slug: "web-development",
    calc: "landing",
    icon: "globe",
    kinds: [{ calc: "landing" }, { calc: "corporate" }, { calc: "ecommerce" }, { calc: "platform" }],
    cases: ["samauto", "engelberg", "nek-dental", "czechfarm", "mavera", "global-export"],
    related: ["landing-page", "corporate-website", "online-store", "telegram-bots", "mobile-apps"],
  },
  {
    slug: "online-store",
    calc: "ecommerce",
    icon: "cart",
    kinds: [{ calc: "ecommerce" }, { calc: "ecommerce" }, { calc: "platform" }],
    cases: ["baldinini", "greenwell", "neoline", "medikor", "amani", "tovar"],
    related: ["web-development", "telegram-bots", "mobile-apps", "corporate-website"],
  },
  {
    slug: "mobile-apps",
    calc: "mobile",
    icon: "phone",
    kinds: [{ calc: "mobile" }, { calc: "mobile" }, { calc: "integration" }],
    cases: ["domtut", "dilrabo-travel", "intalim", "inapp", "tezketkaz", "usta"],
    related: ["telegram-bots", "online-store", "web-development"],
  },
  {
    slug: "telegram-bots",
    calc: "integration",
    icon: "plug",
    kinds: [{ calc: "integration" }, { calc: "integration" }, { calc: "ai" }],
    cases: ["agora", "ig-hub", "giftora", "devuz", "cargo-pro"],
    related: ["online-store", "mobile-apps", "web-development"],
  },
  {
    slug: "landing-page",
    calc: "landing",
    icon: "globe",
    kinds: [{ calc: "landing" }, { calc: "landing" }, { calc: "corporate" }],
    cases: ["engelberg", "golden-house", "vtashkente", "akbar-rich", "karomat", "harvest-motion"],
    related: ["web-development", "corporate-website", "online-store"],
  },
  {
    slug: "corporate-website",
    calc: "corporate",
    icon: "clipboard",
    kinds: [{ calc: "corporate" }, { calc: "corporate" }, { calc: "platform" }],
    cases: ["czechfarm", "global-export", "foodmaxx", "transtelecom", "pk-vesta", "optimal-prime"],
    related: ["web-development", "landing-page", "online-store"],
  },
];

export type LandingText = {
  /** Короткое имя — в меню соседних страниц и хлебных крошках. */
  title: string;
  /** Главный запрос страницы на этом языке — стоит в заголовке, описании и первом абзаце. */
  query: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  lead: string;
  kinds: { title: string; text: string }[];
  included: string[];
  steps: { title: string; days: string; text: string }[];
  local: { title: string; text: string }[];
  faq: { q: string; a: string }[];
};

/** Подписи блоков — одни на все страницы языка. */
export type LandingUi = {
  breadcrumb: string;
  from: string;
  weeks: string;
  weeksUnit: string;
  mockupTitle: string;
  mockupText: string;
  mockupCta: string;
  talkCta: string;
  kindsTitle: string;
  includedTitle: string;
  stepsTitle: string;
  pricesTitle: string;
  pricesNote: string;
  colType: string;
  colPrice: string;
  colTerm: string;
  localTitle: string;
  compareTitle: string;
  compareCols: [string, string, string, string];
  compareRows: [string, string, string, string][];
  casesTitle: string;
  casesAll: string;
  faqTitle: string;
  relatedTitle: string;
  officeTitle: string;
  officeText: string;
  facts: { staff: string; projects: string; countries: string };
};

export type LandingLocale = { ui: LandingUi; pages: Record<LandingSlug, LandingText> };

export const LANDING_TEXT: Record<Locale, LandingLocale> = { ru, uz, en, uk, pl, zh };

export function isLandingSlug(slug: string): slug is LandingSlug {
  return (LANDING_SLUGS as readonly string[]).includes(slug);
}

export function landingBySlug(slug: string): LandingMeta | undefined {
  return LANDINGS.find((l) => l.slug === slug);
}
