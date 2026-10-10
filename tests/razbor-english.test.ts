/**
 * Английские разборы — /en/razbor.
 *
 * Владелец, 10.10.2026: «На английском давай тоже делать, там 404». Сервер
 * сам делает английскую версию каждого опубликованного разбора из его
 * русской статьи — без человека, поэтому всё, за что было бы стыдно,
 * ловит код: новые числа, новые проценты, потерянные находки, кириллица,
 * запрос не в заголовке.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { CITIES, NICHES } from "@/content/razbor/catalog";
import { services } from "@/content/services";
import {
  NICHE_EN,
  articleOf,
  cityByKey,
  englishPrice,
  englishProblems,
  englishQuery,
  englishSlug,
  validSubject,
  validTenderQuery,
} from "@/lib/razbor/english";
import { TENDER_NICHE } from "@/lib/razbor/tender";
import type { RazborArticle } from "@/lib/razbor/store";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const RU: RazborArticle = {
  title: "Сайт для ресторана в Ташкенте: разбор",
  description: "Разбор сайта ресторана в Ташкенте: что теряет гость.",
  label: "ресторан в Ташкенте, сайт на WordPress",
  query: "сайт для ресторана в Ташкенте",
  intro: ["Сайт отвечает за 1261 мс — это примерно 1,3 секунды.", "Второй абзац."],
  findings: [
    { code: "slow", title: "Меню грузится долго", impact: "Гость уходит", fix: "Ускорить, 2 дня" },
    { code: "no_form", title: "Нет брони", impact: "Звонят конкурентам", fix: "Форма брони" },
    { title: "Нет цен в меню", impact: "Гость не понимает чек", fix: "Добавить цены" },
  ],
  outcome: ["Гость бронирует со страницы."],
  price: "от $15000, 12–32 недель",
};

const query = englishQuery("restaurant", cityByKey("tashkent")!);

const EN: RazborArticle = {
  title: "Restaurant website in Tashkent: a teardown",
  description: "A teardown of a restaurant website in Tashkent: what guests lose.",
  label: "a restaurant in Tashkent, WordPress site",
  query,
  intro: ["This restaurant website in Tashkent answers in about 1.3 seconds (1261 ms).", "Second paragraph."],
  findings: [
    { code: "slow", title: "The menu loads slowly", impact: "Guests leave", fix: "Speed it up, 2 days" },
    { code: "no_form", title: "No booking", impact: "They call competitors", fix: "A booking form" },
    { title: "No prices in the menu", impact: "Guests can't guess the bill", fix: "Add prices" },
  ],
  outcome: ["Guests book from the page."],
  price: englishPrice("restoran"),
};

test("английский запрос и адрес: так ищут, а не перевод русского", () => {
  assert.equal(query, "restaurant website in Tashkent");
  assert.equal(englishSlug(query), "restaurant-website-tashkent");
  assert.equal(englishSlug("technical specification for a mobile app tender"), "technical-specification-mobile-app-tender");
});

test("у каждой ниши каталога и каждого города есть английское имя", () => {
  for (const niche of NICHES) assert.ok(NICHE_EN[niche.key], `нет английского имени ниши ${niche.key}`);
  for (const city of CITIES) assert.match(city.en, /^[A-Z][a-z]+$/, `город ${city.key}: «${city.en}»`);
  for (const subject of Object.values(NICHE_EN)) assert.equal(validSubject(subject), subject);
});

test("ответ модели о названии проверяется по форме", () => {
  assert.equal(validSubject("Leather Manufacturer"), "leather manufacturer");
  assert.equal(validSubject("event agency"), "event agency");
  assert.equal(validSubject("кожевенное производство"), null);
  assert.equal(validSubject("hotel website"), null, "слово website запрос добавляет сам");
  assert.equal(validSubject("Hotel \"Grand\" Tashkent!"), null);
  assert.equal(validTenderQuery("Technical specification for a government website"), "technical specification for a government website");
  assert.equal(validTenderQuery("tz"), null);
  assert.equal(validTenderQuery("one two three four five six seven eight nine"), null);
});

test("цена — та же услуга и те же числа, что в русской версии", () => {
  const market = services.find((s) => s.slug === "marketplace-delivery")!;
  assert.equal(englishPrice("restoran"), `from $${market.priceFromUsd}, ${market.weeksFrom}-${market.weeksTo} weeks`);
  const web = services.find((s) => s.slug === "web-development")!;
  assert.equal(englishPrice("kozhevennoe-proizvodstvo"), `from $${web.priceFromUsd}, ${web.weeksFrom}-${web.weeksTo} weeks`);
  const tender = services.find((s) => s.slug === "it-tenders")!;
  assert.match(englishPrice(TENDER_NICHE), new RegExp(`^Technical specification: from \\$${tender.priceFromUsd}, `));
  for (const niche of [...NICHES.map((n) => n.key), TENDER_NICHE]) assert.doesNotMatch(englishPrice(niche), /[Ѐ-ӿ]/);
});

test("честная английская версия проходит проверку", () => {
  assert.deepEqual(englishProblems(EN, RU), []);
});

test("новое число, процент, потерянная находка, кириллица — не проходят", () => {
  const codes = (en: RazborArticle) => englishProblems(en, RU).map((p) => p.code);

  assert.ok(codes({ ...EN, outcome: ["Guests book 47 times more often."] }).includes("invented"));
  assert.ok(codes({ ...EN, outcome: ["Bookings grow by 30%."] }).includes("percent"));
  assert.ok(codes({ ...EN, findings: EN.findings.slice(0, 2) }).includes("findings"));
  assert.ok(codes({ ...EN, findings: [EN.findings[1], EN.findings[0], EN.findings[2]] }).includes("codes"));
  assert.ok(codes({ ...EN, label: "ресторан" }).includes("cyrillic"));
  assert.ok(codes({ ...EN, title: "A teardown of a site" }).includes("query"));
  assert.ok(codes({ ...EN, intro: ["Nothing about the query.", "Second."] }).includes("query"));
  assert.ok(codes({ ...EN, findings: [{ ...EN.findings[0], fix: "" }, ...EN.findings.slice(1)] }).includes("empty"));
});

test("строка базы → статья: пустая и битая не берутся", () => {
  assert.equal(articleOf(null), null);
  assert.equal(articleOf({ title: "x", findings: [] }), null);
  assert.deepEqual(articleOf(RU), RU);
});

test("английская версия идёт свипом, по одному разбору, той же моделью разборов", () => {
  const run = read("lib/razbor/english-run.ts");
  assert.match(run, /process\.env\.RAZBOR_MODEL \|\| "claude-sonnet-5"/);
  assert.match(run, /process\.env\.ARTICLE_MODEL \|\| "claude-haiku-4-5"/, "название — дешёвой моделью");
  assert.match(run, /keywordResearch\(query\)/, "запрос не сверен с Trends и Вордстатом");
  assert.match(run, /\.eq\("status", "published"\)/, "переводится только вышедшее");
  assert.match(run, /en_tried_at: now\.toISOString\(\)/, "без отметки свип возьмёт тот же разбор дважды");
  assert.match(run, /Предыдущая попытка не прошла проверку/, "промахи не возвращаются модели");
  assert.match(read("app/api/reminders/sweep/route.ts"), /runEnglishPass\(new Date\(\)\)/);
  // Правка русской статьи сбрасывает английскую — она написана с прежней.
  assert.match(read("lib/razbor/store.ts"), /article_en: null,\s*en_tried_at: null/);
});

test("английский раздел в меню и в карте сайта", () => {
  assert.match(read("components/layout/header.tsx"), /locale === "en"\s*\? \[\{ href: localeHref\(locale, "razbor"\)/);
  assert.match(read("app/sitemap.ts"), /razborItemLanguages/);
  assert.match(read("lib/razbor/routing.ts"), /RAZBOR_LOCALES = \["ru", "uz", "en"\]/);
});
