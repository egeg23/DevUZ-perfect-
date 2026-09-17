/**
 * Контакты с сайта: то, по чему менеджер пойдёт писать.
 *
 * Главный риск здесь не «не нашли», а «нашли не то»: цена, год и артикул
 * похожи на телефон, а в тексте страницы таких чисел много. Поэтому
 * проверяется в первую очередь, что мусор не проходит.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  contactsLine,
  contactsPagePath,
  extractContacts,
  hasAnyContact,
  mergeContacts,
  normalizePhone,
  EMPTY_CONTACTS,
} from "@/lib/audit/contacts";
import { analyze } from "@/lib/audit/checks";
import type { PageProbe } from "@/lib/audit/fetch";
import { hostOf, pitch } from "@/lib/audit/pitch";

test("номер приводится к единому виду, узбекские девять цифр дописываются кодом", () => {
  assert.equal(normalizePhone("+998 90 123-45-67"), "+998901234567");
  assert.equal(normalizePhone("998901234567"), "+998901234567");
  assert.equal(normalizePhone("90 123 45 67"), "+998901234567");
  assert.equal(normalizePhone("(71) 200-30-40"), "+998712003040");
  assert.equal(normalizePhone("+7 495 123-45-67"), "+74951234567");
  assert.equal(normalizePhone("12345"), null, "короткое — не телефон");
  assert.equal(normalizePhone("12 000 000"), null, "цена — не телефон");
  assert.equal(normalizePhone("2011"), null, "год — не телефон");
});

test("контакты берутся из ссылок и осторожно — из текста", () => {
  const c = extractContacts(`
    <a href="tel:+998 90 123-45-67">Позвонить</a>
    <a href="mailto:Info@Mebel.uz?subject=Заказ">Почта</a>
    <a href="https://t.me/mebel_tashkent">Telegram</a>
    <a href="https://wa.me/998901234567">WhatsApp</a>
    <a href="https://instagram.com/mebel.tashkent">Instagram</a>
    <a href="https://t.me/share/url?url=x">Поделиться</a>
    <a href="https://instagram.com/p/AbC123">Фото</a>
    <p>Кухня от 12 000 000 сум, работаем с 2011 года. Городской: (71) 200-30-40</p>
    <script>var ga = "UA-123456-1";</script>`);

  assert.deepEqual(c.phones, ["+998901234567", "+998712003040"]);
  assert.deepEqual(c.emails, ["info@mebel.uz"], "почта приводится к нижнему регистру, хвост запроса отрезан");
  assert.deepEqual(c.telegram, ["@mebel_tashkent"], "кнопка «поделиться» — не контакт");
  assert.deepEqual(c.whatsapp, ["+998901234567"]);
  assert.deepEqual(c.instagram, ["@mebel.tashkent"], "ссылка на пост — не аккаунт");
});

test("мусор не принимается за контакт", () => {
  const c = extractContacts(`
    <img src="logo@2x.png">
    <a href="mailto:noreply@example.com">x</a>
    <script src="https://cdn.sentry.io/bundle.js"></script>
    <p>Цены: 1 200 000, 3 400 000, 15 000 000 сум. Артикул 100-200-300.</p>
    <p>Работаем 2011—2026. ГОСТ 12.3.009-76.</p>
    <p>ИНН 123456789012, лицензия № 1234 5678 9012, счёт 20208000900123456789.</p>`);
  assert.deepEqual(c.emails, [], "почта из примера и служебные домены отброшены");
  assert.deepEqual(
    c.phones,
    [],
    "цены, артикулы, ГОСТ, ИНН и номер счёта телефонами не считаются: длинная цепочка цифр — ещё не номер",
  );
  assert.equal(hasAnyContact(c), false);
  assert.equal(hasAnyContact(EMPTY_CONTACTS), false);
});

test("страница контактов ищется по адресу и по подписи ссылки", () => {
  assert.equal(contactsPagePath('<a href="/kontakty/">Наши адреса</a>'), "/kontakty/");
  assert.equal(contactsPagePath('<a href="/page7.html">Контакты</a>'), "/page7.html");
  assert.equal(contactsPagePath('<a href="/aloqa">Bog‘lanish</a>'), "/aloqa");
  assert.equal(contactsPagePath('<a href="#contact">Наверх</a>'), null, "якорь — не страница");
  assert.equal(contactsPagePath('<a href="/catalog">Каталог</a>'), null);
});

test("контакты главной и страницы контактов сливаются, главная первой", () => {
  const merged = mergeContacts(
    { ...EMPTY_CONTACTS, phones: ["+998901111111"], emails: [] },
    { ...EMPTY_CONTACTS, phones: ["+998901111111", "+998902222222"], emails: ["a@b.uz"] },
    "https://x.uz/kontakty",
  );
  assert.deepEqual(merged.phones, ["+998901111111", "+998902222222"], "повтор не дублируется");
  assert.deepEqual(merged.emails, ["a@b.uz"]);
  assert.equal(merged.contactsUrl, "https://x.uz/kontakty");
  assert.match(contactsLine(merged), /\+998901111111 · \+998902222222 · a@b\.uz/);
});

const probe = (over: Partial<PageProbe> = {}): PageProbe => ({
  finalUrl: "https://www.mebel.uz/",
  status: 200,
  redirects: [],
  html: '<html lang="ru"><head><title>Мебель</title></head><body><h1>Мебель</h1><a href="tel:+998901234567">звонок</a></body></html>',
  truncated: false,
  headers: {},
  ttfbMs: 300,
  totalMs: 400,
  https: true,
  certDaysLeft: 90,
  ...over,
});

test("контакты доезжают до отчёта, включая страницу контактов", () => {
  const report = analyze(
    probe({
      assets: {
        css: "",
        cssCount: 0,
        cssTruncated: false,
        favicon: true,
        checkedImages: 0,
        brokenImages: [],
        checkedLinks: 0,
        brokenLinks: [],
        contactsHtml: '<a href="mailto:info@mebel.uz">почта</a>',
        contactsUrl: "https://www.mebel.uz/kontakty",
      },
    }),
    new Date("2026-09-17"),
  );
  assert.deepEqual(report.facts.contacts?.phones, ["+998901234567"]);
  assert.deepEqual(report.facts.contacts?.emails, ["info@mebel.uz"]);
  assert.equal(report.facts.contacts?.contactsUrl, "https://www.mebel.uz/kontakty");
});

test("приветствие называет наш сайт и разобранный домен, без www", () => {
  assert.equal(hostOf("https://www.mebel.uz/catalog?x=1"), "mebel.uz");
  assert.equal(hostOf("не адрес"), null);

  const report = analyze(probe({ https: false }), new Date("2026-09-17"));
  const draft = pitch(report, "ООО «Мебель»", "ru", "Данил");
  assert.ok(draft.ok);
  const [hello] = draft.text.split("\n");
  assert.match(hello, /Меня зовут Данил, я из DevUz Studio — devuz\.studio\./);
  assert.match(hello, /Мы проанализировали сайт ООО «Мебель» — mebel\.uz\./);

  // Без названия компании — «ваш сайт», а не пустое место.
  const noName = pitch(report, null, "ru", "Данил");
  assert.ok(noName.ok);
  assert.match(noName.text.split("\n")[0], /Мы проанализировали ваш сайт mebel\.uz\./);

  // По-английски — наш адрес тоже назван, и кириллицы в письме нет.
  const en = pitch(report, "Mebel LLC", "en", "Данил");
  assert.ok(en.ok);
  assert.match(en.text.split("\n")[0], /I'm with DevUz Studio — devuz\.studio\./);
  assert.ok(!/[А-Яа-яЁё]/.test(en.text), "кириллица в английском письме");
});
