/**
 * Условия использования макетов: 200% и акцепт действиями клиента.
 *
 * Владелец, 03.10.2026: «в случае использования или выявления — оплата 200%
 * от заявленной стоимости клиенту. Переписка с клиентом в мессенджере с
 * указанием сайта заказчика является акцептом к принятию условий».
 *
 * И там же, вторым шагом: «После подтверждения клиентом согласия на
 * получение макета высылаем ссылку на условие, которое акцептируется
 * автоматически. Ссылка не требует явного согласия, но предоставляется для
 * ознакомления».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { MOCKUP_TERMS_PATH, MOCKUP_TERMS_VERSION, mockupTerms } from "@/content/mockup-terms";
import { emptyFacts } from "@/lib/proto/facts";
import { buildProto } from "@/lib/proto/render";
import { locales } from "@/lib/i18n";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("условия есть на всех языках сайта и не отстают от русских по структуре", () => {
  const ru = mockupTerms.ru;
  for (const locale of locales) {
    const doc = mockupTerms[locale];
    assert.ok(doc, `нет условий для ${locale}`);
    assert.equal(doc.sections.length, ru.sections.length, `${locale}: разделов не столько, сколько в русской`);
    doc.sections.forEach((section, i) => {
      assert.equal(section.body.length, ru.sections[i].body.length, `${locale}: «${section.heading}» — абзацев не столько, сколько в русской`);
    });
    const text = JSON.stringify(doc);
    // 200% — в каждом переводе, цифрами.
    assert.match(text, /200%/, `${locale}: нет 200%`);
    assert.match(text, /MAKSIMOV EGOR ANDREEVICH/, `${locale}: не назван исполнитель`);
  }
  assert.match(MOCKUP_TERMS_VERSION, /^\d{4}-\d{2}-\d{2}(\.\d+)?$/);
});

test("русская редакция: 200% от заявленной стоимости, запасная база и акцепт действиями", () => {
  const text = mockupTerms.ru.sections.flatMap((s) => s.body).join("\n");
  assert.match(text, /штраф в размере 200% \(двухсот процентов\) от Заявленной стоимости/);
  // Цену могли не назвать (прототип заранее) — штраф не должен обнулиться.
  assert.match(text, /Если Заявленная стоимость Клиенту не называлась, штраф составляет 200%/);
  assert.match(text, /использования Макета или его частей/);
  assert.match(text, /обнаружил признаки Макета/, "выявление — отдельное основание");
  // Ссылка — после «да, хочу макет», для ознакомления, без согласия в ответ.
  assert.match(text, /После того как Клиент подтвердил, что хочет получить бесплатный Макет, Исполнитель направляет ему ссылку на эти условия/);
  assert.match(text, /Ссылка направляется для ознакомления: отдельного согласия, подписи или ответа не требуется/);
  // Акцепт — действиями после ссылки: переписка о проекте с сайтом, получение, открытие.
  assert.match(text, /акцепт путём совершения действий/);
  assert.match(text, /продолжения переписки с Исполнителем о проекте Клиента, в том числе с указанием его сайта или домена/);
  assert.match(text, /получения Макета или открытия его по ссылке/);
  // Не согласен — только до получения; потом отказ не освобождает.
  assert.match(text, /до получения Макета/);
  assert.match(text, /Отказ, заявленный после получения Макета, не освобождает/);
  // Макет без запроса — условия на нём самом.
  assert.match(text, /ссылка на эти условия размещается на самом Макете, и они принимаются его открытием/);
  // Скрытые отпечатки — договорённость о доказательстве.
  assert.match(text, /скрытые технические метки \(цифровые отпечатки\)/);
  assert.match(text, /в том числе с помощью нейросетей/);
});

test("условия на сайте: страница, подвал, карта сайта", () => {
  assert.equal(MOCKUP_TERMS_PATH, "mockup-terms");
  assert.match(read("app/[locale]/mockup-terms/page.tsx"), /<LegalDocument doc=\{mockupTerms\[locale\]\} locale=\{locale\} \/>/);
  assert.match(read("components/layout/footer.tsx"), /localeHref\(locale, MOCKUP_TERMS_PATH\)/);
  assert.match(read("app/sitemap.ts"), /\{ path: MOCKUP_TERMS_PATH,/);
});

test("каждый прототип ссылается на условия — на своём языке", () => {
  const facts = {
    ...emptyFacts("Smile Dent", "stomatologiya", "smile.uz"),
    services: [{ name: "Лечение кариеса" }, { name: "Имплантация" }, { name: "Отбеливание" }],
    telegram: "@smile_dent",
  };
  const ru = buildProto(facts)!.html;
  assert.match(ru, /Прототип принадлежит DevUz Studio и используется только по договору\. Подробно: <a href="https:\/\/[^"]+\/ru\/mockup-terms">условия использования<\/a>/);
  const uz = buildProto({ ...facts, locale: "uz" })!.html;
  assert.match(uz, /href="https:\/\/[^"]+\/uz\/mockup-terms">foydalanish shartlari<\/a>/);
});

test("акцепт — в каждом переводе: ссылка после согласия на макет и отказ только до получения", () => {
  // Пятый раздел — пять абзацев везде: ссылка, акцепт действиями, отказ,
  // макет без запроса, доказательства.
  for (const locale of locales) {
    assert.equal(mockupTerms[locale].sections[4].body.length, 5, `${locale}: в разделе 5 не пять абзацев`);
  }
  assert.match(mockupTerms.uz.sections[4].body.join(" "), /tanishish uchun/i);
  assert.match(mockupTerms.en.sections[4].body.join(" "), /for information/i);
});
