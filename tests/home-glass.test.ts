/**
 * Главная «Стекло» (владелец, 06.11.2026: «Давай начнем с главной» — по
 * утверждённому PDF, шрифты Prata + Onest, картинки целиком, фон дорисован).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { test } from "node:test";

import { cases } from "@/content/cases";
import { homeCopy, type HomeCopy } from "@/content/home-copy";
import { locales } from "@/lib/i18n";
import { AI_MARKERS, LONG_DASH, SPACED_HYPHEN } from "@/lib/proto/plain-text";

const read = (path: string) => readFileSync(path, "utf8");

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

/** Форма словаря: ключи и длины списков, без самих строк. */
function shape(value: unknown): unknown {
  if (typeof value === "string") return "s";
  if (typeof value === "boolean") return "b";
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  return typeof value;
}

test("главная — «Стекло», вопросы остаются в разметке schema.org", () => {
  const page = read("app/[locale]/page.tsx");
  assert.match(page, /<GlassHome locale=\{locale\} dict=\{dict\} \/>/);
  assert.match(page, /faqSchema\(dict\.faq\.items\)/);
  const home = read("components/home/glass-home.tsx");
  assert.match(home, /dict\.faq\.items\.map/);
  for (const id of ['id="works"', 'id="process"', 'id="faq"']) assert.ok(home.includes(id), `нет ${id}`);
  // «Процесс» в мобильном меню ведёт на #process главной.
  assert.match(read("components/layout/header.tsx"), /#process`/);
});

test("тексты главной: шесть языков одной формы, без длинных тире и штампов", () => {
  const ru = shape(homeCopy.ru);
  for (const locale of locales) {
    const copy: HomeCopy = homeCopy[locale];
    assert.deepEqual(shape(copy), ru, `${locale}: форма не как у русской`);
    for (const text of strings(copy)) {
      assert.doesNotMatch(text, LONG_DASH, `${locale}: длинное тире в «${text}»`);
      assert.doesNotMatch(text, SPACED_HYPHEN, `${locale}: тире дефисом в «${text}»`);
      for (const m of AI_MARKERS) assert.doesNotMatch(text, m.re, `${locale}: штамп (${m.say}) в «${text}»`);
      // Цены — только из PROMO, числа студии — только из proof.
      assert.doesNotMatch(text, /\d[\d\s ,]*\s?\$|\$\s?\d/, `${locale}: цена строкой в «${text}»`);
      assert.doesNotMatch(text, /\b(65|600|53)\b/, `${locale}: число студии строкой в «${text}»`);
    }
    if (locale !== "ru" && locale !== "uk") {
      for (const text of strings(copy)) assert.doesNotMatch(text, /[а-яё]/i, `${locale}: кириллица в «${text}»`);
    }
    assert.match(copy.hero.proof, /\{staff\}[^]*\{projects\}/);
    assert.match(copy.hero.proofTail, /\{countries\}/);
    assert.match(copy.proto.steps[2].text, /\{landing\}[^]*\{landingOld\}[^]*\{corp\}[^]*\{corpOld\}|\{landingOld\}[^]*\{landing\}[^]*\{corpOld\}[^]*\{corp\}/);
    assert.match(copy.proto.form.alt, /\{bot\}/);
    // ИИ-сотрудник отвечает в Telegram и на сайте (content/ai-staff/landing.ts), не в Instagram.
    assert.doesNotMatch(strings(copy).join(" "), /instagram/i, `${locale}: обещание Instagram`);
  }
  const home = read("components/home/glass-home.tsx");
  assert.match(home, /PROMO\.landing\.price/);
  assert.match(home, /PROMO\.corporate\.regular/);
  assert.match(home, /proof\.staff/);
});

test("первый экран: кнопки к заявке и к работам с целями Метрики, переписка подписана примером", () => {
  const home = read("components/home/glass-home.tsx");
  assert.match(home, /href="#process" className=\{cn\(s\.btn, s\.primary\)\} data-goal="cta_contact"/);
  assert.match(home, /href="#works" className=\{cn\(s\.btn, s\.ghost\)\} data-goal="cta_cases"/);
  assert.match(home, /aria-label=\{copy\.hero\.chat\.label\}/);
  for (const locale of locales) assert.ok(homeCopy[locale].hero.chat.status.trim(), locale);
  // Заголовок первого экрана — единственный h1.
  assert.equal(home.match(/<h1\b/g)?.length, 1);
});

test("заявка на прототип: /api/lead, ловушка для ботов и ссылка на условия макета", () => {
  const form = read("components/home/proto-form.tsx");
  assert.match(form, /fetch\("\/api\/lead"/);
  // Сайт клиента — в текст заявки: поле `website` у /api/lead — ловушка.
  assert.match(form, /website: data\.get\("url"\)/);
  assert.match(form, /name="url" tabIndex=\{-1\}/);
  assert.doesNotMatch(form, /name="website"/);
  assert.ok(form.indexOf('goal("lead_form")') > form.indexOf("if (!response.ok)"), "цель — только после отправки");
  assert.match(read("components/home/glass-home.tsx"), /termsHref=\{localeHref\(locale, "mockup-terms"\)\}/);
  assert.match(form, /<Link href=\{termsHref\}>/);
});

test("работы и продукты ведут туда, где страницы есть", () => {
  const home = read("components/home/glass-home.tsx");
  for (const slug of ["samauto", "engelberg", "jiguli", "karomat", "asmo-clinic"]) {
    assert.ok(cases.some((c) => c.slug === slug), `кейса ${slug} нет`);
    assert.ok(home.includes(`"${slug}"`), `${slug} не на главной`);
  }
  assert.match(home, /localeHref\(locale, `cases\/\$\{item\.slug\}`\)/);
  assert.match(home, /localeHref\(locale, "audit"\)/);
  // Страница ИИ-сотрудника пока выключена (serviceEnabled): карточка ведёт в бота студии.
  assert.match(home, /href=\{company\.telegramUrl\}/);
  assert.doesNotMatch(home, /ai-sotrudnik/);
});

test("картинки целиком и лёгкие, шрифты главной — только на главной", () => {
  for (const [file, kb] of [["city.webp", 260], ["city-m.webp", 110], ["box-pro.webp", 80], ["box-pro-m.webp", 40]] as const) {
    const path = `public/home/${file}`;
    assert.ok(existsSync(path), `нет ${path}`);
    assert.ok(statSync(path).size / 1024 < kb, `${path} тяжелее ${kb} КБ`);
  }
  for (const f of ["/cases/cargo-pro/shot-1-mobile.webp", "/cases/samauto/teaser-16.mp4"]) assert.ok(existsSync(`public${f}`), f);

  const fonts = read("app/fonts-home.ts");
  assert.match(fonts, /src: "\.\/fonts\/prata\.woff2"/);
  assert.match(fonts, /src: "\.\/fonts\/onest\.woff2",\s*weight: "400 600"/);
  assert.match(fonts, /src: "\.\/fonts\/playfair\.woff2"[^]*?preload: false/);
  const kb = (name: string) => statSync(`app/fonts/${name}.woff2`).size / 1024;
  assert.ok(kb("prata") + kb("onest") < 70, "шрифты главной тяжелее 70 КБ");
  // В общий каркас сайта они не подключены: грузятся только на главной.
  assert.doesNotMatch(read("app/[locale]/layout.tsx"), /fonts-home/);
  assert.doesNotMatch(read("app/fonts.ts"), /prata|onest|playfair/i);
});

test("стекло без размытия на телефоне, движение стоит при «меньше движения»", () => {
  const css = read("components/home/glass.module.css");
  assert.match(css, /@media \(max-width: 899px\) \{\s*\.glass \{ -webkit-backdrop-filter: none; backdrop-filter: none;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.appear \{ animation: none; \}/);
  assert.match(css, /@media \(prefers-reduced-transparency: reduce\)/);
  // Картинки не обрезаны: гаснут маской, а не рамкой с overflow.
  assert.match(css, /\.photo img \{[^}]*mask-image/);
  assert.match(css, /\.boxArt img \{[^}]*mask-image/);
  const video = read("components/home/card-video.tsx");
  assert.match(video, /preload="none"/);
  assert.match(video, /saveData/);
  assert.match(video, /big\.matches \? desk : wide/);
  // Все четыре работы — живыми превью 60 к/с (владелец, 06.11.2026).
  const home = read("components/home/glass-home.tsx");
  for (const slug of ["samauto", "engelberg", "jiguli", "karomat"]) {
    assert.match(home, new RegExp(`slug: "${slug}", img: "/cases/${slug}/poster-16\\.webp", video: "/cases/${slug}/teaser-16\\.mp4"`), `${slug} без ролика`);
    for (const v of ["16", "9"]) {
      const f = `public/cases/${slug}/teaser-${v}.mp4`;
      assert.ok(existsSync(f), f);
      assert.ok(statSync(f).size < 3 * 1048576, `${f} тяжелее 3 МБ`);
      assert.ok(existsSync(`public/cases/${slug}/poster-${v}.webp`), `${slug} poster-${v}`);
    }
  }
});
