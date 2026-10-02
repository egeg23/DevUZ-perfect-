/**
 * Условия использования макетов: 200% и акцепт перепиской.
 *
 * Владелец, 03.10.2026: «в случае использования или выявления — оплата 200%
 * от заявленной стоимости клиенту. Переписка с клиентом в мессенджере с
 * указанием сайта заказчика является акцептом к принятию условий».
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
  assert.match(MOCKUP_TERMS_VERSION, /^\d{4}-\d{2}-\d{2}$/);
});

test("русская редакция: 200% от заявленной стоимости, запасная база и акцепт перепиской", () => {
  const text = mockupTerms.ru.sections.flatMap((s) => s.body).join("\n");
  assert.match(text, /штраф в размере 200% \(двухсот процентов\) от Заявленной стоимости/);
  // Цену могли не назвать (прототип заранее) — штраф не должен обнулиться.
  assert.match(text, /Если Заявленная стоимость Клиенту не называлась, штраф составляет 200%/);
  assert.match(text, /использования Макета или его частей/);
  assert.match(text, /обнаружил признаки Макета/, "выявление — отдельное основание");
  // Акцепт — перепиской с упоминанием сайта, без подписи.
  assert.match(text, /переписки с Исполнителем в любом мессенджере[^.]*в которой указан сайт или домен Клиента/);
  assert.match(text, /Отдельного подписания не требуется/);
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
  assert.match(ru, /Прототип принадлежит DevUz Studio\. Использовать его можно только по договору — <a href="https:\/\/[^"]+\/ru\/mockup-terms">условия использования<\/a>/);
  const uz = buildProto({ ...facts, locale: "uz" })!.html;
  assert.match(uz, /href="https:\/\/[^"]+\/uz\/mockup-terms">foydalanish shartlari<\/a>/);
});
