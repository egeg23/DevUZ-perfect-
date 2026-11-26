import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { casesByDate } from "@/content/cases";
import { LANDING_SLUGS } from "@/content/service-landings";
import { MAX_URLS } from "@/lib/indexnow";
import { locales } from "@/lib/i18n";
import { FRESH_CASES, siteUrls } from "@/lib/seo/site-urls";

// Владелец, 26.11.2026: «предлагаю индексировать наши проекты, чтобы
// выдавались при поиске, почему бы и нет? Делаем».
test("IndexNow после выкатки: главные, услуги, страницы под запросы, свежие кейсы", () => {
  const urls = siteUrls("https://devuz.studio/");
  assert.ok(urls.length < MAX_URLS);
  assert.equal(new Set(urls).size, urls.length, "без повторов");
  for (const u of urls) assert.match(u, /^https:\/\/devuz\.studio\/[a-z]{2}(\/|$)/, u);
  for (const l of locales) {
    assert.ok(urls.includes(`https://devuz.studio/${l}`), `${l}: главная`);
    assert.ok(urls.includes(`https://devuz.studio/${l}/cases`), `${l}: кейсы`);
    for (const slug of LANDING_SLUGS) assert.ok(urls.includes(`https://devuz.studio/${l}/services/${slug}`), `${l}/${slug}`);
    for (const c of casesByDate.slice(0, FRESH_CASES)) assert.ok(urls.includes(`https://devuz.studio/${l}/cases/${c.slug}`), `${l}: ${c.slug}`);
  }
  assert.ok(urls.includes("https://devuz.studio/ru/leadgen"));
  assert.ok(!urls.includes("https://devuz.studio/en/leadgen"), "лидогенерация — только по-русски");
});

test("IndexNow после выкатки: маршрут шлёт и главные страницы, но раз в сутки", () => {
  const route = readFileSync("app/api/indexnow/route.ts", "utf8");
  assert.match(route, /announceDeploy\(\)/);
  const announce = readFileSync("lib/razbor/announce.ts", "utf8");
  assert.match(announce, /job: "indexnow-site"/);
  assert.match(announce, /site \? siteUrls\(siteUrl\)/);
});

// Сверка по Вордстату 26.11.2026: «сайт для ресторана» 2 112, «сайт для
// стоматологии» 917, «сайт для турагентства» 749 в месяц.
test("заголовок кейса: запрос «сайт для <ниши>» у русских сайтов ниши, приложения — без него", async () => {
  const { caseTitle } = await import("@/lib/seo/case-title");
  const { caseBySlug } = await import("@/content/cases");
  const nek = caseBySlug("nek-dental")!;
  assert.equal(caseTitle(nek, "ru"), "Nek Dental Studio: сайт для стоматологии — кейс DevUz");
  assert.ok(!caseTitle(nek, "en").includes("сайт для"));
  assert.match(caseTitle(caseBySlug("karomat")!, "ru"), /сайт для ресторана/);
  assert.ok(!caseTitle(caseBySlug("inapp")!, "ru").includes("сайт для"), "приложение — не сайт");
});

test("SEO русских страниц — под запросы Вордстата", async () => {
  const { getDictionary } = await import("@/content/dictionaries");
  const seo = getDictionary("ru").seo;
  assert.match(seo.home.title, /Разработка сайтов под ключ/);
  assert.match(seo.home.title, /веб-студия/);
  assert.match(seo.cases.title, /Примеры сайтов/);
  assert.match(seo.calculator.title, /Сколько стоит сайт/);
  assert.match(seo.calculator.description, /долларах и рублях/, "у русской версии цена в $ и ₽");
  assert.doesNotMatch(getDictionary("pl").seo.calculator.description, /sumach/);
  assert.doesNotMatch(getDictionary("uk").seo.calculator.description, /сумах/);
});
