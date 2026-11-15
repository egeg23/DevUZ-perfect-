import assert from "node:assert/strict";
import { test } from "node:test";

import { privacy } from "@/content/legal";
import { locales } from "@/lib/i18n";

test("политика заполнена на всех языках", () => {
  for (const locale of locales) {
    const doc = privacy[locale];
    assert.ok(doc, `нет документа для ${locale}`);
    assert.ok(doc.title.trim(), `${locale}: пустой заголовок`);
    assert.ok(doc.updated.trim(), `${locale}: не указана дата`);
    assert.ok(doc.intro.trim().length > 40, `${locale}: слишком короткое вступление`);

    for (const section of doc.sections) {
      assert.ok(section.heading.trim(), `${locale}: раздел без заголовка`);
      assert.ok(section.body.length, `${locale}: раздел «${section.heading}» пуст`);
      for (const line of section.body) {
        assert.equal(line, line.trim(), `${locale}: лишние пробелы в «${section.heading}»`);
        assert.ok(line.length > 10, `${locale}: обрывок в «${section.heading}»`);
      }
    }
  }
});

/**
 * Главная проверка файла.
 *
 * Документ правят по-русски, а переводы дописывают следом — и ровно здесь
 * забывают один из четырёх. Расхождение в структуре означает, что кому-то
 * не сказали про новый обработчик данных или новый срок хранения, то есть
 * это не опечатка, а неполное раскрытие.
 */
test("переводы не отстают от русского по структуре", () => {
  const shape = (locale: (typeof locales)[number]) =>
    privacy[locale].sections.map((section) => section.body.length);

  const reference = shape("ru");
  for (const locale of locales) {
    assert.deepEqual(
      shape(locale),
      reference,
      `${locale}: структура разошлась с русской версией`,
    );
  }
});

test("обработчик назван, а марка модели — нет", () => {
  for (const locale of locales) {
    const text = JSON.stringify(privacy[locale]);

    // Раскрыть, кому уходят персональные данные, обязывает закон:
    // «внешний сервис» без имени эту обязанность не закрывает.
    assert.match(text, /Anthropic/, `${locale}: не назван обработчик`);

    // А название модели — предмет маркетинга, а не права. В текстах студии
    // его нет нигде, и политика не исключение.
    assert.doesNotMatch(text, /Claude/i, `${locale}: в политике всплыла марка модели`);
  }
});

test("сроки хранения не остались от прежней редакции", () => {
  const stale = [/трёх лет/, /three years/i, /uch yilgacha/, /三年/];
  for (const locale of locales) {
    const text = JSON.stringify(privacy[locale]);
    for (const pattern of stale) {
      assert.doesNotMatch(text, pattern, `${locale}: остался прежний срок хранения`);
    }
  }
});

/**
 * Страница о приложении для Google (`/{язык}/google-app`, владелец,
 * 15.11.2026): её адрес — Home page экрана согласия OAuth. Google сверяет
 * имя приложения с этой страницей, ищет на ней права и Limited Use.
 */
test("страница приложения для Google: имя, права и Limited Use на всех языках", async () => {
  const { googleApp } = await import("@/content/google-app");
  const { company } = await import("@/content/company");
  const shape = (locale: (typeof locales)[number]) =>
    googleApp[locale].sections.map((section) => section.body.length);
  for (const locale of locales) {
    const doc = googleApp[locale];
    const text = JSON.stringify(doc);
    assert.ok(doc.title.startsWith(company.name), `${locale}: заголовок не с имени приложения`);
    assert.match(text, /auth\/adwords/, `${locale}: нет права Google Ads`);
    assert.match(text, /auth\/analytics\.readonly/, `${locale}: нет права Analytics`);
    assert.match(text, /Limited Use/, `${locale}: нет Limited Use`);
    assert.deepEqual(shape(locale), shape("en"), `${locale}: структура разошлась с английской`);
    for (const section of doc.sections) {
      for (const line of section.body) assert.equal(line, line.trim());
    }
  }
});

/**
 * Простые страницы приложения для проверки бренда Google OAuth (владелец,
 * 15.11.2026: «Разберись ты»). Робот Google трижды получил наши страницы
 * целиком (200, без лимитов — «Осмотр связи с сервером») и трижды ответил
 * «главная за входом». Проходит, по отчётам разработчиков, только простая
 * страница без скриптов: поэтому это файлы в public/, мимо оболочки сайта.
 */
test("страницы приложения для Google: без скриптов, с именем, правами и ссылкой на политику", async () => {
  const { readFileSync } = await import("node:fs");
  const { company } = await import("@/content/company");
  const read = (name: string) => readFileSync(new URL(`../public/${name}`, import.meta.url), "utf8");
  const home = read("devuz-studio-app.html");
  const policy = read("devuz-studio-privacy.html");

  for (const [name, html] of [["главная", home], ["политика", policy]] as const) {
    assert.doesNotMatch(html, /<script/i, `${name}: на странице скрипт`);
    assert.doesNotMatch(html, /<(form|input|iframe)\b/i, `${name}: форма или рамка`);
    // Слова, по которым автомат решает «страница за входом».
    assert.doesNotMatch(html, /\b(log ?in|sign ?in|password|admin panel|internal)\b/i, `${name}: слово про вход`);
    assert.match(html, /auth\/adwords/, `${name}: нет права Google Ads`);
    assert.match(html, /auth\/analytics\.readonly/, `${name}: нет права Analytics`);
    assert.match(html, /Limited Use/, `${name}: нет Limited Use`);
  }
  // Имя — ровно как на экране согласия.
  assert.match(home, new RegExp(`<title>${company.name}</title>`));
  assert.match(home, new RegExp(`<h1>${company.name}</h1>`));
  // Политика на главной — тем же адресом, что стоит в Google Cloud.
  assert.match(home, /href="https:\/\/devuz\.studio\/devuz-studio-privacy\.html"/);
  assert.match(policy, /<h1>DevUz Studio Privacy Policy<\/h1>/);
  assert.match(policy, /deleted within 30 days/);
});
