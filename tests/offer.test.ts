import assert from "node:assert/strict";
import { test } from "node:test";

import { orderCopy } from "@/content/order-form";
import { licence } from "@/content/licence";
import { privacy } from "@/content/legal";
import { OFFER_VERSION, offer } from "@/content/offer";
import { locales } from "@/lib/i18n";

/**
 * Оферта — шлагбаум: без неё нельзя принять ни один сум. Отсюда и характер
 * проверок: они не про формат, а про то, что документ существует целиком
 * на каждом языке, на котором сайт продаёт, и что версия, которая ложится
 * в базу, совпадает с датой, которую человек видит на странице.
 */

test("оферта и лицензия есть на всех языках сайта", () => {
  for (const locale of locales) {
    for (const [name, docs] of [["оферта", offer], ["лицензия", licence]] as const) {
      const doc = docs[locale];
      assert.ok(doc, `${name} отсутствует для ${locale}`);
      assert.ok(doc.title.trim(), `${name} (${locale}) без заголовка`);
      assert.ok(doc.intro.trim().length > 80, `${name} (${locale}): вступление слишком короткое`);
      assert.ok(doc.sections.length >= 8, `${name} (${locale}): всего ${doc.sections.length} разделов`);

      for (const section of doc.sections) {
        assert.ok(section.heading.trim(), `${name} (${locale}): раздел без заголовка`);
        assert.ok(section.body.length, `${name} (${locale}): раздел «${section.heading}» пуст`);
        for (const paragraph of section.body) {
          assert.ok(paragraph.trim(), `${name} (${locale}): пустой абзац в «${section.heading}»`);
        }
      }
    }
  }
});

test("структура документа одинакова на всех языках", () => {
  // Разное число разделов означает, что при переводе один потеряли, — и
  // потерянным окажется тот, на который сослались из другого языка.
  for (const [name, docs] of [["оферта", offer], ["лицензия", licence]] as const) {
    const counts = locales.map((l) => docs[l].sections.length);
    assert.equal(
      new Set(counts).size,
      1,
      `${name}: разное число разделов по языкам — ${locales.map((l, i) => `${l}:${counts[i]}`).join(", ")}`,
    );
  }
});

test("версия, уходящая в базу, совпадает с датой на странице", () => {
  // OFFER_VERSION записывается в каждую заявку. Разойдясь с текстом на
  // странице, он превращает «покупатель согласился с редакцией от такого-то
  // числа» в утверждение, которое нечем подтвердить.
  assert.match(OFFER_VERSION, /^\d{4}-\d{2}-\d{2}$/);

  const [year, month, day] = OFFER_VERSION.split("-").map(Number);
  const shown = offer.ru.updated;
  assert.ok(shown.includes(String(year)), `в «${shown}» нет года ${year}`);
  assert.ok(
    shown.includes(String(day)) || shown.includes(String(day).padStart(2, "0")),
    `в «${shown}» нет дня ${day}`,
  );
  assert.ok(month >= 1 && month <= 12);

  // Лицензия принимается тем же действием и той же версией.
  assert.equal(licence.ru.updated, offer.ru.updated);
});

test("у согласия есть текст на каждом языке", () => {
  const parts = ["consent", "consentOffer", "consentLicence", "consentRequired"] as const;

  for (const part of parts) {
    for (const locale of locales) {
      assert.ok(
        orderCopy[part][locale]?.trim(),
        `${part} не переведён на ${locale} — покупатель увидит пустое место в согласии`,
      );
    }
  }
});

/**
 * Главный риск подстановки: маркер, потерянный или переведённый вместе с
 * фразой. Ссылка на договор тогда просто не появится, а покупатель всё
 * равно поставит галочку — то есть согласится с текстом, которого не видел.
 * Ошибка при этом не заметна ни в сборке, ни на глаз в чужом языке.
 */
test("в согласии на каждом языке есть обе ссылки", () => {
  for (const locale of locales) {
    const text = orderCopy.consent[locale];
    for (const marker of ["{offer}", "{licence}"]) {
      assert.ok(text.includes(marker), `в согласии (${locale}) потерян ${marker}`);
    }
    // И ровно по одному разу: продублированный маркер даёт две одинаковые
    // ссылки подряд, что выглядит как ошибка вёрстки.
    assert.equal(text.split("{offer}").length - 1, 1, `{offer} в ${locale} встречается не один раз`);
    assert.equal(
      text.split("{licence}").length - 1,
      1,
      `{licence} в ${locale} встречается не один раз`,
    );
  }
});

test("оферта ссылается на лицензию и на политику, а не живёт сама по себе", () => {
  const ru = offer.ru.sections.flatMap((s) => s.body).join(" ");
  assert.match(ru, /Лицензи/, "оферта не упоминает лицензию на код");
  assert.match(ru, /Политик/, "оферта не упоминает политику конфиденциальности");
  // Политика существует — ссылаться есть на что.
  assert.ok(privacy.ru.title.trim());
});
