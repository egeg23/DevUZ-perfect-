/**
 * Разборы на английском и польском — /en/razbor и /pl/razbor.
 *
 * Владелец, 10.10.2026: «На английском давай тоже делать, там 404» и «А в
 * польской версии статей вообще, русские показываются». Сервер сам делает
 * версию каждого опубликованного разбора из его русской статьи — без
 * человека, поэтому всё, за что было бы стыдно, ловит код: новые числа,
 * новые проценты, потерянные находки, кириллица, запрос не в заголовке.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { CITIES, NICHES } from "@/content/razbor/catalog";
import { services } from "@/content/services";
import { EVIDENCE_RULES } from "@/lib/razbor/evidence";
import {
  FOREIGN_LOCALES,
  NICHE_NAMES,
  articleOf,
  cityByKey,
  foreignPrice,
  foreignProblems,
  foreignQuery,
  foreignSlug,
  plWeeks,
  cleanName,
  ruNumberWords,
  validSubject,
  validTenderQuery,
} from "@/lib/razbor/foreign";
import { TENDER_NICHE } from "@/lib/razbor/tender";
import type { RazborArticle } from "@/lib/razbor/store";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const tashkent = cityByKey("tashkent")!;

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

const EN: RazborArticle = {
  title: "Restaurant website in Tashkent: a teardown",
  description: "A teardown of a restaurant website in Tashkent: what guests lose.",
  label: "a restaurant in Tashkent, WordPress site",
  query: foreignQuery("en", "restaurant", tashkent),
  intro: ["This restaurant website in Tashkent answers in about 1.3 seconds (1261 ms).", "Second paragraph."],
  findings: [
    { code: "slow", title: "The menu loads slowly", impact: "Guests leave", fix: "Speed it up, 2 days" },
    { code: "no_form", title: "No booking", impact: "They call competitors", fix: "A booking form" },
    { title: "No prices in the menu", impact: "Guests can't guess the bill", fix: "Add prices" },
  ],
  outcome: ["Guests book from the page."],
  price: foreignPrice("en", "restoran"),
};

const PL: RazborArticle = {
  title: "Strona internetowa dla restauracji w Taszkencie: analiza",
  description: "Analiza strony internetowej restauracji w Taszkencie: co traci gość.",
  label: "restauracja w Taszkencie, strona na WordPress",
  query: foreignQuery("pl", "restauracji", tashkent),
  intro: ["Ta strona internetowa restauracji w Taszkencie odpowiada w około 1,3 sekundy (1261 ms).", "Drugi akapit."],
  findings: [
    { code: "slow", title: "Menu ładuje się długo", impact: "Gość wychodzi", fix: "Przyspieszyć, 2 dni" },
    { code: "no_form", title: "Brak rezerwacji", impact: "Dzwonią do konkurencji", fix: "Formularz rezerwacji" },
    { title: "Brak cen w menu", impact: "Gość nie zna rachunku", fix: "Dodać ceny" },
  ],
  outcome: ["Gość rezerwuje ze strony."],
  price: foreignPrice("pl", "restoran"),
};

test("запрос и адрес: так ищут на этом языке, а не перевод русского", () => {
  assert.equal(EN.query, "restaurant website in Tashkent");
  assert.equal(foreignSlug("en", EN.query), "restaurant-website-tashkent");
  assert.equal(foreignSlug("en", "technical specification for a mobile app tender"), "technical-specification-mobile-app-tender");

  assert.equal(PL.query, "strona internetowa dla restauracji w Taszkencie");
  assert.equal(foreignSlug("pl", PL.query), "strona-internetowa-restauracji-taszkencie");
  // Польские буквы в адресе — латиницей без знаков.
  assert.equal(
    foreignSlug("pl", foreignQuery("pl", "agencji nieruchomości", cityByKey("andijan")!)),
    "strona-internetowa-agencji-nieruchomosci-andizanie",
  );
  assert.equal(foreignSlug("pl", foreignQuery("pl", "kancelarii prawnej", cityByKey("almaty")!)), "strona-internetowa-kancelarii-prawnej-almaty");
});

test("у каждой ниши каталога и каждого города есть имена на обоих языках", () => {
  for (const locale of FOREIGN_LOCALES) {
    for (const niche of NICHES) assert.ok(NICHE_NAMES[locale][niche.key], `${locale}: нет имени ниши ${niche.key}`);
    for (const subject of Object.values(NICHE_NAMES[locale])) assert.equal(validSubject(locale, subject), subject);
  }
  for (const city of CITIES) {
    assert.match(city.en, /^[A-Z][a-z]+$/, `город ${city.key}: «${city.en}»`);
    assert.match(city.pl, /^[A-ZŁŻ][a-ząćęłńóśźż]+$/, `город ${city.key}: «${city.pl}»`);
    assert.match(city.plIn, /^[A-ZŁŻ][a-ząćęłńóśźż]+$/, `город ${city.key}: «${city.plIn}»`);
  }
});

test("ответ модели о названии проверяется по форме", () => {
  assert.equal(validSubject("en", "Leather Manufacturer"), "leather manufacturer");
  assert.equal(validSubject("en", "event agency"), "event agency");
  assert.equal(validSubject("en", "кожевенное производство"), null);
  assert.equal(validSubject("en", "hotel website"), "hotel", "слово website запрос добавляет сам — его снимаем");
  assert.equal(validSubject("en", 'Hotel "Grand" Tashkent!'), null);
  assert.equal(validSubject("pl", "Garbarni"), "garbarni");
  assert.equal(validSubject("pl", "szkoły programowania"), "szkoły programowania");
  assert.equal(validSubject("pl", "strony hotelu"), "hotelu", "«strona internetowa» запрос добавляет сам — её снимаем");
  assert.equal(validSubject("pl", "strona internetowa hotelu"), "hotelu");
  assert.equal(validSubject("pl", "sklepu internetowego"), "sklepu internetowego");
  assert.equal(validSubject("pl", "кожевенного производства"), null);
  assert.equal(
    validTenderQuery("en", "Technical specification for a government website"),
    "technical specification for a government website",
  );
  assert.equal(validTenderQuery("en", "tz"), null);
  assert.equal(validTenderQuery("en", "one two three four five six seven eight nine ten eleven"), null);
  assert.equal(
    validTenderQuery("pl", "Specyfikacja techniczna aplikacji mobilnej do przetargu"),
    "specyfikacja techniczna aplikacji mobilnej do przetargu",
  );
});

test("ответ модели снимается с обёртки: кавычки, точка, второй вариант", () => {
  assert.equal(cleanName('"Neurology center".'), "neurology center");
  assert.equal(cleanName("«garbarni» / zakładu garbarskiego"), "garbarni");
  assert.equal(cleanName("hotel (small, family-run)"), "hotel");
  assert.equal(cleanName("ośrodka neurologicznego lub kliniki"), "ośrodka neurologicznego");
  assert.equal(cleanName("event agency\nThis is a company that…"), "event agency");
  assert.equal(validSubject("en", '"Neurology center".'), "neurology center");
  assert.equal(validSubject("pl", "«Ośrodka neurologicznego»"), "ośrodka neurologicznego");
});

test("рамку запроса модель возвращает вместе с названием — её снимаем", () => {
  // Ровно эти ответы стояли в en_note и pl_note 10.10.2026.
  assert.equal(validSubject("en", "neurology clinic website"), "neurology clinic");
  assert.equal(validSubject("en", "website for a hotel in Tashkent"), "hotel");
  assert.equal(validSubject("pl", "strona internetowa dla hotelu"), "hotelu");
  assert.equal(validSubject("pl", "strona internetowa dla ośrodka neurologicznego"), "ośrodka neurologicznego");
  assert.equal(validSubject("pl", "strona internetowa dla producenta wyrobów polimerowych"), "producenta wyrobów polimerowych");
  assert.equal(validSubject("pl", "strony internetowej dla agencji eventowej w Taszkencie"), "agencji eventowej");
  assert.equal(validSubject("pl", "strona internetowa"), null, "без рода занятий — пусто");
});

test("польский без диакритики не проходит", () => {
  const plain = "Przeszlismy przez wszystkie szesc stron serwisu, zarowno na stronie glownej, jak i w sekcjach o restauracji i kontaktach cen nie ma w ogole. ";
  const ascii = { ...PL, intro: [PL.intro[0], plain.repeat(8)] };
  assert.ok(foreignProblems("pl", ascii, RU).some((p) => p.code === "diacritics"));
  const proper = "Przeszliśmy przez wszystkie sześć stron serwisu, zarówno na stronie głównej, jak i w sekcjach o restauracji i kontaktach cen nie ma w ogóle. ";
  assert.ok(!foreignProblems("pl", { ...PL, intro: [PL.intro[0], proper.repeat(8)] }, RU).some((p) => p.code === "diacritics"));
  // Английский — без этой проверки.
  assert.ok(!foreignProblems("en", { ...EN, intro: [EN.intro[0], "Plain English text. ".repeat(30)] }, RU).some((p) => p.code === "diacritics"));
});

test("цена — та же услуга и те же числа, что в русской версии", () => {
  const market = services.find((s) => s.slug === "marketplace-delivery")!;
  assert.equal(foreignPrice("en", "restoran"), `from $${market.priceFromUsd}, ${market.weeksFrom}-${market.weeksTo} weeks`);
  assert.equal(foreignPrice("pl", "restoran"), `od $${market.priceFromUsd}, ${market.weeksFrom}-${market.weeksTo} ${plWeeks(market.weeksTo)}`);
  const web = services.find((s) => s.slug === "web-development")!;
  assert.equal(foreignPrice("en", "kozhevennoe-proizvodstvo"), `from $${web.priceFromUsd}, ${web.weeksFrom}-${web.weeksTo} weeks`);
  const tender = services.find((s) => s.slug === "it-tenders")!;
  assert.match(foreignPrice("en", TENDER_NICHE), new RegExp(`^Technical specification: from \\$${tender.priceFromUsd}, `));
  assert.match(foreignPrice("pl", TENDER_NICHE), new RegExp(`^Specyfikacja techniczna: od \\$${tender.priceFromUsd}, `));
  for (const locale of FOREIGN_LOCALES) {
    for (const niche of [...NICHES.map((n) => n.key), TENDER_NICHE]) assert.doesNotMatch(foreignPrice(locale, niche), /[Ѐ-ӿ]/);
  }
});

test("польские недели склоняются по числу", () => {
  assert.equal(plWeeks(1), "tydzień");
  assert.equal(plWeeks(4), "tygodnie");
  assert.equal(plWeeks(8), "tygodni");
  assert.equal(plWeeks(12), "tygodni");
  assert.equal(plWeeks(22), "tygodnie");
  assert.equal(plWeeks(32), "tygodnie");
});

test("честные версии проходят проверку", () => {
  assert.deepEqual(foreignProblems("en", EN, RU), []);
  assert.deepEqual(foreignProblems("pl", PL, RU), []);
});

test("новое число, процент, потерянная находка, кириллица — не проходят", () => {
  for (const [locale, version] of [["en", EN], ["pl", PL]] as const) {
    const codes = (v: RazborArticle) => foreignProblems(locale, v, RU).map((p) => p.code);
    assert.ok(codes({ ...version, outcome: ["47"] }).includes("invented"), `${locale}: новое число`);
    assert.ok(codes({ ...version, outcome: ["+30%"] }).includes("percent"), `${locale}: процент`);
    assert.ok(codes({ ...version, findings: version.findings.slice(0, 2) }).includes("findings"));
    assert.ok(codes({ ...version, findings: [version.findings[1], version.findings[0], version.findings[2]] }).includes("codes"));
    assert.ok(codes({ ...version, label: "ресторан" }).includes("cyrillic"));
    assert.ok(codes({ ...version, title: "Nothing" }).includes("query"), `${locale}: запрос не в заголовке`);
    assert.ok(codes({ ...version, intro: ["Nothing.", "Second."] }).includes("query"), `${locale}: запрос не в первом абзаце`);
    assert.ok(codes({ ...version, findings: [{ ...version.findings[0], fix: "" }, ...version.findings.slice(1)] }).includes("empty"));
  }
});

test("число, написанное по-русски словами, можно написать цифрой", () => {
  assert.equal(ruNumberWords("Сайт из шести страниц, четыре шрифта, одна форма"), "1 4 6");
  assert.equal(ruNumberWords("Всем семьям тремя кнопками"), "3", "«всем» и «семьям» — не числа");
  const ru = { ...RU, intro: ["Сайт из шести страниц и четырёх шрифтов.", ...RU.intro.slice(1)] };
  const en = { ...EN, intro: [`${EN.intro[0]} The site has 6 pages and 4 fonts.`, ...EN.intro.slice(1)] };
  assert.deepEqual(foreignProblems("en", en, { ...ru, intro: [...ru.intro, ...RU.intro] }), []);
  assert.ok(foreignProblems("en", { ...EN, outcome: ["The site has 7 pages."] }, RU).some((p) => p.code === "invented"));
});

test("строка базы → статья: пустая и битая не берутся", () => {
  assert.equal(articleOf(null), null);
  assert.equal(articleOf({ title: "x", findings: [] }), null);
  assert.deepEqual(articleOf(RU), RU);
});

test("подписи снимков есть на английском и польском, без кириллицы", () => {
  for (const [code, rule] of Object.entries(EVIDENCE_RULES)) {
    for (const locale of FOREIGN_LOCALES) {
      assert.ok(rule.caption[locale]?.trim(), `${code}: нет подписи на ${locale}`);
      assert.doesNotMatch(rule.caption[locale], /[Ѐ-ӿ]/, `${code}: кириллица в ${locale}`);
    }
  }
});

test("версии идут свипом, по одной на язык, той же моделью разборов", () => {
  const run = read("lib/razbor/foreign-run.ts");
  assert.match(run, /process\.env\.RAZBOR_MODEL \|\| "claude-sonnet-5"/);
  assert.match(run, /process\.env\.ARTICLE_MODEL \|\| "claude-haiku-4-5"/, "название — дешёвой моделью");
  assert.match(run, /keywordResearch\(query\)/, "запрос не сверен с Trends и Вордстатом");
  assert.match(run, /\.eq\("status", "published"\)/, "переводится только вышедшее");
  assert.match(run, /\[tried\]: now\.toISOString\(\)/, "без отметки свип возьмёт тот же разбор дважды");
  assert.match(run, /Предыдущая попытка не прошла проверку/, "промахи не возвращаются модели");
  assert.match(run, /\[`\$\{locale\}_note`\]: failure/, "причина провала не записывается в строку");
  assert.match(read("app/api/reminders/sweep/route.ts"), /runForeignPass\(new Date\(\)\)/);
  // Правка русской статьи сбрасывает обе версии — они написаны с прежней.
  assert.match(read("lib/razbor/store.ts"), /article_en: null,\s*en_tried_at: null,\s*article_pl: null,\s*pl_tried_at: null/);
  for (const locale of FOREIGN_LOCALES) {
    assert.match(read(`supabase/migrations/${locale === "en" ? "0095_razbor_english" : "0096_razbor_polish"}.sql`), new RegExp(`slug_${locale}`));
  }
});

test("английский и польский раздел в меню и в карте сайта", () => {
  assert.match(read("components/layout/header.tsx"), /isRazborLocale\(locale\)\s*\? \[\{ href: localeHref\(locale, "razbor"\)/);
  assert.match(read("app/sitemap.ts"), /razborItemLanguages/);
});
