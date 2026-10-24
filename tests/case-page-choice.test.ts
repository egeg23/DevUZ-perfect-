/**
 * Страница кейса: сначала проект, потом выбор.
 *
 * Владелец, 24.10.2026: «Когда я нажимаю на карточку из кейсов, сразу просит
 * пароль. Я просил, чтобы открывалась карточка проекта, а потом уже выбор —
 * запросить прототип или хочу так же». Наверху страницы — название, ролик
 * сцены и снимки; кнопок пароля там нет. Ниже — «Что дальше»: «Запросить
 * прототип» (менеджеру в Telegram, текст уже набран), «У меня есть пароль» и
 * «Хочу так же» (чат на сайте с готовым текстом).
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { cases } from "@/content/cases";
import { getDictionary } from "@/content/dictionaries";
import { SHOWCASE_LOCK } from "@/lib/admin/mockups";
import { locales } from "@/lib/i18n";

const page = readFileSync(new URL("../app/[locale]/cases/[slug]/page.tsx", import.meta.url), "utf8");

test("наверху — проект: ролик сцены на странице, кнопок пароля до «Что дальше» нет", () => {
  const choice = page.indexOf('id="case-next"');
  assert.ok(choice > 0, "нет блока «Что дальше»");
  assert.ok(page.indexOf("<CaseTeaser") > 0 && page.indexOf("<CaseTeaser") < choice, "ролик не над выбором");
  assert.ok(page.indexOf("<CaseShots") < choice, "снимки ниже выбора");
  for (const key of ["protoRequest", "protoHave", "protoBadge"]) {
    const at = page.indexOf(`{dict.cases.${key}}`);
    assert.ok(at > choice, `${key} стоит раньше «Что дальше»`);
  }
  assert.doesNotMatch(page, /protoEnter|protoAsk|protoHint/, "старые кнопки пароля остались");
});

test("«Запросить прототип» — менеджеру в Telegram с набранным текстом, «Хочу так же» — в чат сайта", () => {
  assert.match(page, /company\.salesTelegramUrl\}\?text=\$\{encodeURIComponent\(dict\.cases\.protoRequestText\.replace\("\{name\}", item\.name\)\)\}/);
  assert.match(page, /<PrefillButton[\s\S]*?dict\.cases\.sameMessage\.replace\("\{name\}", item\.name\)/);
  assert.match(readFileSync(new URL("../components/chat/prefill-button.tsx", import.meta.url), "utf8"), /new CustomEvent\("devuz:prefill"/);
  assert.match(readFileSync(new URL("../components/chat/chat-widget.tsx", import.meta.url), "utf8"), /addEventListener\("devuz:prefill"/);
});

test("витрина под паролем — как прототип: ссылка не наверху, а «У меня есть пароль»", () => {
  assert.deepEqual(
    cases.filter((c) => c.locked).map((c) => c.slug).sort(),
    Object.keys(SHOWCASE_LOCK).sort(),
    "locked в кейсах расходится с SHOWCASE_LOCK",
  );
  for (const item of cases.filter((c) => c.locked)) assert.ok(item.url, `${item.slug}: у витрины под паролем нет ссылки`);
  assert.match(page, /\{item\.url && !item\.locked \? \(/);
  assert.match(page, /item\.locked && item\.url\s*\? \{ open: false, href: item\.url \}/);
});

test("тексты выбора — на каждом языке сайта, с названием проекта и без длинных тире", () => {
  for (const locale of locales) {
    const d = getDictionary(locale).cases;
    for (const key of ["nextTitle", "protoCardTitle", "protoCardText", "protoCardOpen", "protoRequest", "protoHave", "sameTitle", "sameText", "sameButton"] as const) {
      assert.ok(d[key].trim(), `${locale}.${key} пустой`);
      assert.doesNotMatch(d[key], /[—–]/, `${locale}.${key}: длинное тире`);
    }
    assert.match(d.protoRequestText, /\{name\}/, `${locale}: в тексте менеджеру нет названия проекта`);
    assert.match(d.sameMessage, /\{name\}/, `${locale}: в тексте для чата нет названия проекта`);
  }
});
