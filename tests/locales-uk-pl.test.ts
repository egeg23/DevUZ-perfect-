import assert from "node:assert/strict";
import { test } from "node:test";

import sitemap from "@/app/sitemap";
import { getDictionary } from "@/content/dictionaries";
import { razborBorrowedCopy } from "@/content/razbor/page-copy";
import { hreflang, localeLabel, localeShort, locales, matchLocale, ogLocale } from "@/lib/i18n";
import { RAZBOR_BORROWING, isRazborBorrowing, isRazborLocale } from "@/lib/razbor/routing";
import { buildAlternates, buildMetadata } from "@/lib/seo";

/**
 * Украинский и польский.
 *
 * Типы ловят пропущенный ключ, но не пустую строку и не забытый в
 * переводе русский текст, скопированный «на потом». И не ловят то, что
 * снаружи: hreflang в <head>, карту сайта, язык из браузера и Telegram.
 */

const NEW = ["uk", "pl"] as const;

test("uk и pl — локали сайта со своими hreflang, подписями и Open Graph", () => {
  for (const l of NEW) assert.ok((locales as readonly string[]).includes(l), `${l} нет в locales`);
  // Старые языки на своих местах: порядок — это переключатель и hreflang.
  assert.deepEqual([...locales].slice(0, 4), ["ru", "en", "uz", "zh"]);
  assert.equal(hreflang.uk, "uk");
  assert.equal(hreflang.pl, "pl");
  assert.equal(localeLabel.uk, "Українська");
  assert.equal(localeLabel.pl, "Polski");
  assert.equal(localeShort.uk, "UK");
  assert.equal(localeShort.pl, "PL");
  assert.equal(ogLocale.uk, "uk_UA");
  assert.equal(ogLocale.pl, "pl_PL");
  for (const l of locales) assert.match(ogLocale[l], /^[a-z]{2}_[A-Z]{2}$/, `og:locale ${l}`);
});

test("браузер и Telegram на украинском и польском ведут на свои версии", () => {
  assert.equal(matchLocale("uk-UA,uk;q=0.9,ru;q=0.8,en;q=0.7"), "uk");
  assert.equal(matchLocale("pl-PL,pl;q=0.9,en-US;q=0.8"), "pl");
  // Telegram отдаёт голый код языка.
  assert.equal(matchLocale("uk"), "uk");
  assert.equal(matchLocale("pl"), "pl");
  // Прежние правила не сдвинулись.
  assert.equal(matchLocale("ru-RU"), "ru");
  assert.equal(matchLocale("uz-Cyrl"), "ru");
  assert.equal(matchLocale("kk"), "ru");
  assert.equal(matchLocale("en-GB,uk;q=0.5"), "en");
});

type Tree = string | number | boolean | null | undefined | Tree[] | { [k: string]: Tree } | ((...a: never[]) => unknown);

/** Ключи, длины массивов и типы значений — одинаковые у двух деревьев. */
function sameShape(a: Tree, b: Tree, path: string, problems: string[]) {
  if (typeof a !== typeof b) return void problems.push(`${path}: тип ${typeof b} вместо ${typeof a}`);
  if (typeof a === "string") {
    if (!(b as string).trim()) problems.push(`${path}: пусто`);
    return;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return void problems.push(`${path}: длина массива`);
    a.forEach((x, i) => sameShape(x, (b as Tree[])[i], `${path}[${i}]`, problems));
    return;
  }
  if (a && typeof a === "object") {
    const ka = Object.keys(a).sort().join(",");
    const kb = Object.keys(b as object).sort().join(",");
    if (ka !== kb) return void problems.push(`${path}: ключи ${kb} вместо ${ka}`);
    for (const k of Object.keys(a)) sameShape((a as Record<string, Tree>)[k], (b as Record<string, Tree>)[k], `${path}.${k}`, problems);
  }
}

test("словарь интерфейса на uk и pl — полный и переведённый", () => {
  const ru = getDictionary("ru");
  for (const l of NEW) {
    const dict = getDictionary(l);
    assert.notEqual(dict, ru, `${l} отдаёт русский словарь`);
    const problems: string[] = [];
    sameShape(ru as unknown as Tree, dict as unknown as Tree, l, problems);
    assert.deepEqual(problems, [], `словарь ${l}`);
    assert.notEqual(dict.nav.services, ru.nav.services, `${l}: меню не переведено`);
    assert.notEqual(dict.hero.lead, ru.hero.lead, `${l}: первый экран не переведён`);
  }
  // Буквы, которых в украинском нет: признак русского текста, оставленного
  // «на потом». В польском кириллицы быть не должно вовсе.
  const uk = JSON.stringify(getDictionary("uk"));
  assert.ok(!/[ыэъё]/i.test(uk), "в украинском словаре русские буквы");
  assert.ok(!/[а-яё]/i.test(JSON.stringify(getDictionary("pl"))), "в польском словаре кириллица");
});

test("hreflang на странице перечисляет uk и pl, x-default — русский", () => {
  const alt = buildAlternates("pl", "cases");
  const languages = alt?.languages as Record<string, string>;
  assert.ok(languages.uk.endsWith("/uk/cases"));
  assert.ok(languages.pl.endsWith("/pl/cases"));
  assert.ok(languages["x-default"].endsWith("/ru/cases"));
  assert.equal(String(alt?.canonical).replace(/^https?:\/\/[^/]+/, ""), "/pl/cases");

  const meta = buildMetadata({ locale: "uk", path: "", title: "t", description: "d" });
  const og = meta.openGraph as { locale: string; alternateLocale: string[] };
  assert.equal(og.locale, "uk_UA");
  assert.ok(og.alternateLocale.includes("pl_PL"));
  assert.ok(!og.alternateLocale.includes("uk_UA"));
});

test("карта сайта содержит uk и pl и связывает их с остальными языками", async () => {
  const entries = await sitemap();
  const urls = entries.map((e) => e.url.replace(/^https?:\/\/[^/]+/, ""));
  for (const l of NEW) {
    for (const path of ["", "/cases", "/products", "/calculator", "/partners", "/offer"]) {
      assert.ok(urls.includes(`/${l}${path}`), `в карте нет /${l}${path}`);
    }
    // Разборы на этих языках — список чужих по языку статей, в карту не идёт.
    assert.ok(!urls.some((u) => u.startsWith(`/${l}/razbor`)), `/${l}/razbor попал в карту`);
  }
  const home = entries.find((e) => e.url.endsWith("/uk"));
  const languages = home?.alternates?.languages as Record<string, string>;
  for (const code of ["ru", "en", "uz-UZ", "zh-Hans", "uk", "pl", "x-default"]) {
    assert.ok(languages?.[code], `у /uk в карте нет альтернативы ${code}`);
  }
});

test("разборы на uk и pl — страница раздела, а не 404 и не статьи-двойники", () => {
  assert.deepEqual([...RAZBOR_BORROWING], ["uk", "pl"]);
  for (const l of NEW) {
    assert.equal(isRazborBorrowing(l), true);
    assert.equal(isRazborLocale(l), false, `${l}: своих статей нет`);
    for (const [key, value] of Object.entries(razborBorrowedCopy[l])) {
      assert.ok(value.trim().length > 1, `${l}.${key} пустая`);
    }
  }
  assert.equal(isRazborBorrowing("en"), false);
  assert.equal(isRazborBorrowing("ru"), false);
});

/** Все записи вида { ru, en, …, uk, pl } внутри дерева. */
function localized(node: unknown, path: string, out: { path: string; value: Record<string, unknown> }[]) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) return node.forEach((x, i) => localized(x, `${path}[${i}]`, out));
  const rec = node as Record<string, unknown>;
  if ("ru" in rec && "en" in rec && "zh" in rec) out.push({ path, value: rec });
  for (const [k, v] of Object.entries(rec)) localized(v, `${path}.${k}`, out);
}

test("кейсы, продукты, услуги, калькулятор и заказ — переведены на uk и pl", async () => {
  const sources: Record<string, unknown> = {
    cases: (await import("@/content/cases")).cases,
    products: (await import("@/content/products")).products,
    services: (await import("@/content/services")).services,
    calculator: (await import("@/content/calculator")).categories,
    company: await import("@/content/company"),
    orderForm: (await import("@/content/order-form")).orderCopy,
    orderPage: (await import("@/content/order-page")).orderPage,
    buyerBot: (await import("@/content/buyer-bot")).buyerBot,
  };
  const problems: string[] = [];
  let seen = 0;
  for (const [name, tree] of Object.entries(sources)) {
    const found: { path: string; value: Record<string, unknown> }[] = [];
    localized(tree, name, found);
    for (const { path, value } of found) {
      seen++;
      for (const l of NEW) {
        const text = value[l];
        const flat = Array.isArray(text) ? text.join(" ") : text;
        if (typeof flat !== "string" || !flat.trim()) problems.push(`${path}.${l}: пусто`);
        else if (Array.isArray(value.ru) && (!Array.isArray(text) || text.length !== value.ru.length)) {
          problems.push(`${path}.${l}: пунктов не столько, сколько в ru`);
        } else if (l === "pl" && /[а-яё]/i.test(flat)) problems.push(`${path}.pl: кириллица`);
        else if (l === "uk" && /[ыэъё]/i.test(flat)) problems.push(`${path}.uk: русские буквы`);
      }
    }
  }
  assert.ok(seen > 300, `найдено всего ${seen} переводимых записей — обход сломался`);
  assert.deepEqual(problems, []);
});

test("боты, кабинет партнёра и документы — свои тексты на uk и pl", async () => {
  const { botCopy } = await import("@/content/bot");
  const { partnerCopy } = await import("@/content/partner-bot");
  const { cabinetCopy } = await import("@/content/partner-cabinet");
  const { deckCopy } = await import("@/content/partner-decks");
  const { privacy } = await import("@/content/legal");
  const { offer } = await import("@/content/offer");
  const { licence } = await import("@/content/licence");

  for (const l of NEW) {
    assert.notEqual(botCopy(l), botCopy("ru"), `${l}: бот отвечает по-русски`);
    assert.notEqual(partnerCopy(l), partnerCopy("ru"), `${l}: партнёрская программа в боте по-русски`);
    assert.notEqual(partnerCopy(l), partnerCopy("en"), `${l}: партнёрская программа в боте по-английски`);
    for (const [name, get] of [
      ["bot", botCopy],
      ["partner-bot", partnerCopy],
      ["cabinet", cabinetCopy],
      ["decks", deckCopy],
    ] as const) {
      const problems: string[] = [];
      sameShape(get("ru") as unknown as Tree, get(l) as unknown as Tree, `${name}.${l}`, problems);
      assert.deepEqual(problems, [], `${name} на ${l}`);
    }
    // Каждый перевод документа прямо говорит, какая редакция имеет силу.
    for (const [name, docs, path] of [
      ["privacy", privacy, "privacy"],
      ["offer", offer, "offer"],
      ["licence", licence, "licence"],
    ] as const) {
      const doc = docs[l];
      assert.equal(doc.sections.length, docs.ru.sections.length, `${name} ${l}: разделов не столько, сколько в ru`);
      doc.sections.forEach((s, i) =>
        assert.equal(s.body.length, docs.ru.sections[i].body.length, `${name} ${l}: абзацы в «${s.heading}»`),
      );
      assert.ok(doc.intro.includes(`devuz.studio/ru/${path}`), `${name} ${l}: не сказано, что силу имеет русская редакция`);
    }
  }
});
