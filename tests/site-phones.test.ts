import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { telUrl, whatsappUrl } from "@/lib/phone-links";
import { company } from "@/content/company";
import { getDictionary } from "@/content/dictionaries";
import { locales as LOCALES } from "@/lib/i18n";

/**
 * Телефоны студии на сайте: позвонить одним нажатием или написать в WhatsApp.
 *
 * Владелец, 23.09: «добавь номера, чтобы клиенты могли позвонить прямо с
 * сайта, нажав кнопку, или написать в WhatsApp». Номер, который не
 * набирается, хуже, чем его отсутствие: клиент решит, что студии нет.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("номера — в международном формате и набираются одним нажатием", () => {
  assert.ok(company.phones.length >= 3);
  for (const phone of company.phones) {
    assert.match(phone.e164, /^\+\d{10,14}$/, `${phone.e164}: не E.164`);
    assert.equal(phone.display.replace(/[\s-]/g, ""), phone.e164, `${phone.display} не совпадает с ${phone.e164}`);
    assert.equal(telUrl(phone), `tel:${phone.e164}`);
  }
  assert.deepEqual(
    company.phones.map((p) => p.e164),
    ["+998909123772", "+998909120578", "+79232330037", "+11517095555"],
  );
  // На американском номере WhatsApp нет — владелец, 23.09.
  assert.deepEqual(
    company.phones.filter((p) => !p.whatsapp).map((p) => p.e164),
    ["+11517095555"],
  );
});

test("WhatsApp открывается с уже набранным приветствием на языке страницы", () => {
  for (const locale of LOCALES) {
    const text = getDictionary(locale).contact.whatsappText;
    const url = whatsappUrl(company.phones[0], text);
    assert.match(url, /^https:\/\/wa\.me\/998909123772\?text=/);
    assert.equal(decodeURIComponent(url.split("?text=")[1]), text);
  }
});

test("номера есть в «Связаться», в подвале, в шапке на телефоне и в разметке для поиска", () => {
  assert.match(read("components/sections/contact.tsx"), /<PhoneList locale=\{locale\} dict=\{dict\} \/>/);
  assert.match(read("components/layout/footer.tsx"), /<PhoneLinesCompact dict=\{dict\} \/>/);
  // Кнопка WhatsApp — только у номеров, где он есть: иначе клиент нажмёт и
  // увидит «номер не зарегистрирован в WhatsApp».
  const links = read("components/ui/phone-links.tsx");
  assert.equal(links.match(/\{phone\.whatsapp \? \(/g)?.length, 2, "WhatsApp рисуется и у номеров без него");
  assert.match(read("components/layout/header.tsx"), /href=\{telUrl\(company\.phones\[0\]\)\}/);
  const schema = read("lib/schema.ts");
  assert.match(schema, /telephone: company\.phones\[0\]\.e164/);
  assert.match(schema, /\.\.\.company\.phones\.map/);
});

test("ИИ-менеджер знает номера и не говорит, что телефона нет", () => {
  const prompt = read("lib/qualify/prompt.ts");
  assert.doesNotMatch(prompt, /Телефона у студии нет/);
  assert.match(prompt, /company\.phones\.map/);
  for (const locale of LOCALES) {
    assert.equal("noPhone" in getDictionary(locale).contact, false, `${locale}: осталось «телефона нет»`);
  }
});

test("«работаем в 53 странах» — одним числом на главной, в подвале и у ИИ-менеджера", async () => {
  const { headline, proof } = await import("@/content/company");
  assert.equal(proof.countries, 53);
  assert.ok(headline.some((h) => h.value === "53"), "числа нет среди главных");
  for (const locale of LOCALES) {
    assert.match(getDictionary(locale).footer.countries, /\{n\}/, `${locale}: число вписано в текст, а не подставляется`);
  }
  assert.match(read("components/layout/footer.tsx"), /footer\.countries\.replace\("\{n\}", String\(proof\.countries\)\)/);
  assert.match(read("lib/qualify/prompt.ts"), /\$\{proof\.countries\} странах/);
});
