import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { MAX_URLS, buildPayload, isValidKey, verdictFor } from "@/lib/indexnow";

/**
 * Пинг IndexNow.
 *
 * Протокол отвечает голыми кодами без объяснений, поэтому всё, что можно
 * поймать до отправки, ловится здесь. Самое дорогое — чужой адрес в списке:
 * он отменяет не себя, а весь запрос, и узнать об этом можно только по
 * молчаливому 422.
 */

const SITE = "https://devuz.studio";

test("ключ проверяется по правилам протокола", () => {
  assert.equal(isValidKey("a1b2c3d4"), true); // ровно 8 — нижняя граница
  assert.equal(isValidKey("a1b2c3d"), false); // семь символов
  assert.equal(isValidKey("a".repeat(128)), true);
  assert.equal(isValidKey("a".repeat(129)), false);
  assert.equal(isValidKey("ключ-на-кириллице"), false);
  assert.equal(isValidKey("with space12"), false);
  assert.equal(isValidKey("with-dash-12"), true);
});

test("плохой ключ роняет сборку, а не уезжает в сеть", () => {
  assert.throws(
    () => buildPayload({ key: "short", siteUrl: SITE, urls: [`${SITE}/ru`] }),
    /INDEXNOW_KEY/,
  );
});

test("чужой адрес называется поимённо", () => {
  // Выкинуть его молча было бы хуже: пинг ушёл бы неполным, а человек
  // остался бы в уверенности, что отправил всё.
  assert.throws(
    () =>
      buildPayload({
        key: "a1b2c3d4e5",
        siteUrl: SITE,
        urls: [`${SITE}/ru`, "https://devuz.work/ru"],
      }),
    /Чужой хост: https:\/\/devuz\.work\/ru/,
  );
});

test("повторы схлопываются, пустые строки пропускаются", () => {
  const payload = buildPayload({
    key: "a1b2c3d4e5",
    siteUrl: SITE,
    urls: [`${SITE}/ru`, `${SITE}/ru`, "  ", `${SITE}/uz`],
  });
  assert.deepEqual(payload.urlList, [`${SITE}/ru`, `${SITE}/uz`]);
});

test("keyLocation собирается без двойного слэша", () => {
  const payload = buildPayload({
    key: "a1b2c3d4e5",
    siteUrl: `${SITE}/`,
    urls: [`${SITE}/ru`],
  });
  assert.equal(payload.keyLocation, `${SITE}/a1b2c3d4e5.txt`);
  assert.equal(payload.host, "devuz.studio");
});

test("пустой список и не-адрес не проходят", () => {
  assert.throws(() => buildPayload({ key: "a1b2c3d4e5", siteUrl: SITE, urls: [] }), /Пустой/);
  assert.throws(
    () => buildPayload({ key: "a1b2c3d4e5", siteUrl: SITE, urls: ["/ru/razbor"] }),
    /Не адрес/,
  );
  assert.throws(
    () => buildPayload({ key: "a1b2c3d4e5", siteUrl: SITE, urls: ["ftp://devuz.studio/x"] }),
    /протокол/,
  );
});

test("потолок в десять тысяч адресов соблюдается", () => {
  const urls = Array.from({ length: MAX_URLS + 1 }, (_, i) => `${SITE}/p${i}`);
  assert.throws(
    () => buildPayload({ key: "a1b2c3d4e5", siteUrl: SITE, urls }),
    /10000|10 000/,
  );
  assert.equal(
    buildPayload({ key: "a1b2c3d4e5", siteUrl: SITE, urls: urls.slice(0, MAX_URLS) }).urlList.length,
    MAX_URLS,
  );
});

test("202 — это успех, а не повод слать список заново", () => {
  // «Ключ ещё проверяем» означает, что адреса приняты. Повтор каждый день
  // приводит к 429 и к тому, что пинг перестаёт работать вообще.
  assert.deepEqual(verdictFor(202), { ok: true, retry: false, text: "принято, ключ проверяется" });
  assert.equal(verdictFor(200).ok, true);
});

test("повторяем только то, что имеет смысл повторять", () => {
  for (const status of [400, 403, 422]) {
    const v = verdictFor(status);
    assert.equal(v.ok, false, `${status} не ошибка`);
    assert.equal(v.retry, false, `${status} зря повторяется`);
  }
  for (const status of [429, 500, 503]) {
    assert.equal(verdictFor(status).retry, true, `${status} стоило повторить`);
  }
});

test("скрипт не печатает ключ в лог", () => {
  // Пинг зовут из CI и из ежедневной задачи — их вывод попадает в логи,
  // которые читают не только те, кому ключ полагается.
  const source = readFileSync(new URL("../scripts/indexnow-ping.mjs", import.meta.url), "utf8");
  assert.ok(!/console\.log\([^)]*\bkey\b/.test(source), "ключ уходит в stdout");
  assert.ok(!/console\.error\([^)]*payload\.key/.test(source), "ключ уходит в stderr");
});
