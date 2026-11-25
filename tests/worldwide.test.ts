import assert from "node:assert/strict";
import { test } from "node:test";

import { company } from "@/content/company";
import { getDictionary } from "@/content/dictionaries";
import { services } from "@/content/services";
import { locales, t, type Locale } from "@/lib/i18n";
import { organizationSchema, serviceSchema } from "@/lib/schema";

/**
 * Сайт говорит поисковику и ИИ-подборкам, что студия работает по всему миру.
 *
 * Владелец, 25.11.2026: «сделай так, чтобы в рекомендациях по запросу Гугла
 * или Яндекса мы выдавались в топ подборке от Ии. Не только по Ташкенту, мы
 * работаем по всему миру». До этого заголовки страниц и разметка говорили
 * «местная компания в Ташкенте». Узбекская версия остаётся ташкентской:
 * там ищут по городу (`REGION_BY_LOCALE`).
 */

const CITY = /Ташкент|Tashkent|Taszken|塔什干/i;
const WORLD_LOCALES = locales.filter((l) => l !== "uz");

type Named = { "@type": string; name?: string };

test("разметка организации: офис в Ташкенте, работа по всему миру", () => {
  for (const locale of locales) {
    const org = organizationSchema(locale) as Record<string, unknown>;
    const area = org.areaServed as Named[];
    assert.deepEqual(area[0], { "@type": "Place", name: "Worldwide" }, locale);
    const countries = area.filter((a) => a["@type"] === "Country").map((a) => a.name);
    for (const name of ["Russia", "Kazakhstan", "Uzbekistan", "United States", "United Kingdom", "Poland", "Ukraine"]) {
      assert.ok(countries.includes(name), `${locale}: нет страны ${name}`);
    }
    assert.equal(new Set(countries).size, countries.length, "страны без повторов");
    assert.deepEqual(org.knowsLanguage, [...locales]);
    // Адрес офиса остаётся: это факт и локальный поиск Узбекистана.
    assert.equal((org.address as Record<string, unknown>).addressCountry, "UZ");
  }
});

test("номер каждой страны подписан своей страной, польский — не «US»", () => {
  const org = organizationSchema("ru") as Record<string, unknown>;
  const points = org.contactPoint as Array<Record<string, unknown>>;
  const byPhone = new Map(points.filter((p) => p.telephone).map((p) => [String(p.telephone), p.areaServed]));
  for (const phone of company.phones) {
    const want = phone.e164.startsWith("+998") ? "UZ" : phone.e164.startsWith("+7") ? "RU" : phone.e164.startsWith("+48") ? "PL" : "US";
    assert.equal(byPhone.get(phone.e164), want, phone.display);
  }
});

test("профили на чужих площадках идут в sameAs", () => {
  const org = organizationSchema("en") as Record<string, unknown>;
  const same = org.sameAs as string[];
  assert.ok(same.includes(company.social.telegram));
  for (const url of company.profiles) {
    assert.match(url, /^https:\/\//, "профиль — настоящий адрес");
    assert.ok(same.includes(url));
  }
});

test("услуга в разметке — для всего мира и стран своего языка", () => {
  for (const locale of locales) {
    const schema = serviceSchema(services[0], locale) as Record<string, unknown>;
    const area = schema.areaServed as Named[];
    assert.equal(area[0].name, "Worldwide", locale);
    assert.ok(area.length > 1, locale);
  }
  const uz = (serviceSchema(services[0], "uz") as Record<string, unknown>).areaServed as Named[];
  assert.ok(uz.some((a) => a.name === "Uzbekistan"));
});

test("заголовки и описания страниц: без города везде, кроме узбекской версии", () => {
  for (const locale of WORLD_LOCALES) {
    const dict = getDictionary(locale);
    for (const [page, seo] of Object.entries(dict.seo as Record<string, { title: string; description: string }>)) {
      assert.doesNotMatch(seo.title, CITY, `${locale}/${page}: город в заголовке`);
    }
    assert.doesNotMatch(dict.hero.eyebrow, CITY, locale);
    assert.doesNotMatch(dict.footer.tagline, CITY, locale);
    assert.doesNotMatch(dict.seo.home.description, CITY, locale);
    // Первый вопрос — про цену вообще, а не «в Ташкенте».
    assert.doesNotMatch(dict.faq.items[0].q, CITY, locale);
  }
  assert.match(getDictionary("uz").seo.home.title, /Toshkent/, "узбекская версия ищется по городу");
});

test("у услуг без своей страницы под запрос города в заголовке тоже нет", () => {
  for (const service of services) {
    if (service.slug === "it-tenders") continue; // тендеры — площадки Узбекистана
    for (const locale of WORLD_LOCALES) {
      if (["web-development", "mobile-apps"].includes(service.slug)) continue; // их заменяют страницы под запросы
      assert.doesNotMatch(t(service.seoTitle, locale as Locale), CITY, `${service.slug}/${locale}`);
    }
  }
});

test("описание студии: офис назван, «по всему миру» сказано", () => {
  assert.match(company.description.ru, /по всему миру/);
  assert.match(company.description.en, /worldwide/i);
  assert.match(company.description.ru, /Ташкент/, "офис — факт, его не прячем");
});
