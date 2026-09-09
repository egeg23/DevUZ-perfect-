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
