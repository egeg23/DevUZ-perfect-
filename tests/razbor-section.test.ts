import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { razborCopy } from "@/content/razbor/page-copy";
import { razborBySlug, razborsFor, siblings, type RazborItem } from "@/content/razbor/items";
import { RAZBOR_LOCALES, isRazborLocale, localeHref } from "@/lib/razbor/routing";
import { serviceFor } from "@/lib/razbor/service-link";

/**
 * Раздел разборов на сайте.
 *
 * Главное здесь — что разборы живут только на двух языках. Показать
 * англичанину пункт меню, за которым пусто, или пообещать Google китайскую
 * версию, которой нет, — два разных способа получить 404 в индексе.
 */

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

test("разборы живут на русском и узбекском", () => {
  assert.deepEqual([...RAZBOR_LOCALES], ["ru", "uz"]);
  assert.equal(isRazborLocale("ru"), true);
  assert.equal(isRazborLocale("uz"), true);
  assert.equal(isRazborLocale("en"), false);
  assert.equal(isRazborLocale("zh"), false);
});

test("адреса строятся одним местом", () => {
  assert.equal(localeHref("ru"), "/ru/razbor");
  assert.equal(
    localeHref("uz", "stomatologiya-uchun-sayt-toshkent"),
    "/uz/razbor/stomatologiya-uchun-sayt-toshkent",
  );
});

test("подписи есть на обоих языках и не пустые", () => {
  for (const locale of RAZBOR_LOCALES) {
    const copy = razborCopy[locale];
    for (const [key, value] of Object.entries(copy)) {
      assert.ok(value.trim().length > 1, `${locale}.${key} пустая`);
    }
  }
  // Узбекская версия не должна оказаться копией русской.
  assert.notEqual(razborCopy.uz.title, razborCopy.ru.title, "узбекский текст не переведён");
  assert.notEqual(razborCopy.uz.lead, razborCopy.ru.lead, "узбекское описание не переведено");
});

test("выборка и соседи работают на пустом списке", () => {
  // Раздел открывается пустым, и страницы не должны падать.
  assert.deepEqual(razborsFor("ru"), []);
  assert.equal(razborBySlug("ru", "чего-нет"), null);

  const fake: RazborItem = {
    slug: "a",
    locale: "ru",
    alt: null,
    niche: "stomatologiya",
    city: "tashkent",
    publishedAt: "2026-09-15",
    shotTakenAt: "2026-09-15",
    title: "t",
    description: "d",
    label: "l",
    query: "q",
    shots: { beforeDesktop: "", beforeMobile: "", afterDesktop: "", afterMobile: "" },
    intro: [],
    findings: [],
    outcome: [],
    price: "",
  };
  assert.deepEqual(siblings(fake), []);
});

/* ── Проверки исходников ────────────────────────────────────────────────── */

test("пункт меню показывается только там, где раздел есть", () => {
  const header = read("components/layout/header.tsx");
  assert.match(header, /locale === "ru" \|\| locale === "uz"/);
  assert.match(header, /localeHref\(locale, "razbor"\)/);
});

test("sitemap не обещает языки, которых нет", () => {
  const sitemap = read("app/sitemap.ts");

  // Общий цикл гоняет каждый путь по всем четырём языкам. Разбору там не
  // место: он получил бы английский и китайский адреса, которых нет.
  assert.match(sitemap, /const razborEntries: MetadataRoute\.Sitemap/);
  const paths = sitemap.slice(
    sitemap.indexOf("const paths = ["),
    sitemap.indexOf("const lastModified"),
  );
  assert.ok(!paths.includes("razbor"), "разборы попали в общий цикл по языкам");
});

test("анимация фона гаснет при prefers-reduced-motion", () => {
  const css = read("app/globals.css");
  const at = css.indexOf(".nav-live");
  assert.ok(at > 0, "стили пункта пропали");

  // Движение в шапке идёт на каждой странице сайта — это не декоративная
  // мелочь, а то, от чего у части людей начинается головная боль.
  const tail = css.slice(at);
  assert.match(tail, /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,200}animation: none/);
});

test("стили пункта стоят вне слоёв", () => {
  // Утилиты Tailwind лежат в слое, а незаслоённый CSS сильнее любого слоя.
  // Внутри @layer класс из разметки перебил бы фон.
  const css = read("app/globals.css");
  const at = css.indexOf(".nav-live");

  let depth = 0;
  for (let i = 0; i < at; i++) {
    if (css.startsWith("@layer", i)) {
      const brace = css.indexOf("{", i);
      const semi = css.indexOf(";", i);
      // `@layer a, b;` — объявление порядка, скобок не открывает.
      if (brace > 0 && (semi < 0 || brace < semi)) depth++;
    } else if (css[i] === "}" && depth > 0) {
      depth--;
    }
  }
  assert.equal(depth, 0, ".nav-live оказался внутри @layer — фон перебьют утилиты");
});

/* ── Перелинковка и разметка ────────────────────────────────────────────── */

test("разбор продаёт услугу, а не только предлагает проверить сайт", () => {
  // Правило SEO-инструкции: одна ссылка изнутри статьи на профильную
  // услугу. Её не было вовсе — разбор заканчивался призывом к аудиту, то
  // есть отправлял человека, уже прикинувшего бюджет, в начало воронки.
  const page = read("app/[locale]/razbor/[slug]/page.tsx");
  assert.match(page, /serviceFor\(item\.niche\)/);
  assert.match(page, /\/services\/\$\{service\}/);
});

test("ниша выбирает услугу, а не одна на всех", () => {
  assert.equal(serviceFor("stomatologiya"), "web-development");
  assert.equal(serviceFor("avtoservis"), "web-development");
  // Магазину и доставке нужен не сайт-визитка, а торговля.
  assert.equal(serviceFor("internet-magazin"), "marketplace-delivery");
  assert.equal(serviceFor("dostavka-edy"), "marketplace-delivery");
  assert.equal(serviceFor("logistika"), "integrations-automation");
  // Незнакомая ниша не роняет страницу.
  assert.equal(serviceFor("чего-нет"), "web-development");
});

test("подпись ссылки есть на обоих языках и не одинаковая", () => {
  assert.ok(razborCopy.ru.serviceLink.length > 10);
  assert.ok(razborCopy.uz.serviceLink.length > 10);
  assert.notEqual(razborCopy.uz.serviceLink, razborCopy.ru.serviceLink);
});

test("хлебные крошки размечены отдельной сущностью", () => {
  // Внутри Article Google их не читает: BreadcrumbList должен быть
  // самостоятельным блоком, иначе в выдаче остаётся голый адрес.
  const page = read("app/[locale]/razbor/[slug]/page.tsx");
  assert.match(page, /"@type": "BreadcrumbList"/);
  assert.match(page, /itemListElement/);
  const at = page.indexOf('"BreadcrumbList"');
  const article = page.indexOf('"@type": "Article"');
  assert.ok(at < article, "крошки оказались внутри Article");
});
