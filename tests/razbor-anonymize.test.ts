import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { domainTokens, redactions, titleTokens } from "@/lib/razbor/anonymize";

/**
 * Что затирается на снимке.
 *
 * Ошибка в одну сторону оставляет лишнюю плашку — некрасиво. Ошибка в другую
 * оставляет имя компании в публичной статье, а разбор у нас анонимный. Так
 * что список слов — не мелочь, и проверяется он с обеих сторон.
 */

test("из домена берётся имя второго уровня", () => {
  assert.deepEqual(domainTokens("https://dentalux.uz"), ["dentalux"]);
  assert.deepEqual(domainTokens("https://www.dentalux.uz/price"), ["dentalux"]);
  assert.deepEqual(domainTokens("https://clinic.dentalux.uz"), ["dentalux"]);
});

test("общие слова из домена не затираются", () => {
  // Иначе на сайте стоматологии затёрлось бы слово «dental» везде, где оно
  // встречается, — то есть половина первого экрана.
  assert.deepEqual(domainTokens("https://dental-clinic.uz"), []);
  assert.deepEqual(domainTokens("https://my-shop.uz"), []);
  // Короткие куски тоже: «abc» в тексте встретится где угодно.
  assert.deepEqual(domainTokens("https://abc.uz"), []);
  assert.deepEqual(domainTokens("https://24-auto.uz"), []);
});

test("битый адрес не роняет разбор", () => {
  assert.deepEqual(domainTokens("не адрес вовсе"), []);
  assert.deepEqual(domainTokens(""), []);
});

test("из заголовка берётся кусок до разделителя", () => {
  assert.deepEqual(titleTokens("Dentalux — стоматология в Ташкенте"), ["Dentalux"]);
  assert.deepEqual(titleTokens("Dentalux | Запись онлайн"), ["Dentalux"]);
  assert.deepEqual(titleTokens("Клиника Дентал Люкс: цены"), ["Клиника", "Дентал", "Люкс"]);
});

test("длинная фраза в заголовке — не имя", () => {
  // «Стоматология в Ташкенте, запись онлайн, цены» — это описание. Затирать
  // его целиком значит стереть пол-экрана.
  assert.deepEqual(titleTokens("Стоматология в Ташкенте запись онлайн цены"), []);
  assert.deepEqual(titleTokens(null), []);
  assert.deepEqual(titleTokens(""), []);
});

test("список без дублей и без учёта регистра", () => {
  const words = redactions("https://dentalux.uz", "DENTALUX — стоматология");
  assert.equal(words.length, 1, `лишние слова: ${words.join(", ")}`);
});

test("имя из домена находится, даже если заголовок бесполезен", () => {
  const words = redactions("https://dentalux.uz", "Главная");
  assert.ok(words.includes("dentalux"));
});

/* ── Проверка снимающего скрипта ────────────────────────────────────────── */

const ROOT = new URL("../", import.meta.url);
const shot = readFileSync(new URL("scripts/razbor-shot.mjs", ROOT), "utf8");

test("плашка не подчиняется стилям чужой страницы", () => {
  // Выстрелило ровно так: на example.com для div задано opacity: .8, плашка
  // вставала на место и становилась полупрозрачной. Имя читалось сквозь неё.
  assert.match(shot, /setProperty\("all", "initial", "important"\)/);
  assert.match(shot, /setProperty\(name, value, "important"\)/);
  for (const prop of ["opacity", "filter", "mix-blend-mode", "transform", "visibility"]) {
    assert.ok(shot.includes(`"${prop}"`) || shot.includes(`${prop}:`), `${prop} не сброшен`);
  }
});

test("плашки кладутся в body и только после всех замеров", () => {
  // В <html> они рисуются ниже содержимого body при любом z-index.
  assert.match(shot, /document\.body\.appendChild\(box\)/);
  assert.ok(
    !/document\.documentElement\.appendChild\(box\)/.test(shot),
    "плашка снова уходит в documentElement — будет рисоваться под текстом",
  );

  // Правка DOM во время обхода сдвигает раскладку, и следующий замер
  // приходит уже по сдвинутой странице.
  const measure = shot.indexOf("const targets = []");
  const draw = shot.indexOf("for (const { rect, color } of targets)");
  assert.ok(measure > 0 && draw > measure, "рисование перемешано с замерами");
});

test("цвет плашки берётся только непрозрачный", () => {
  assert.match(shot, /alpha >= 0\.99/);
});

test("проверка сертификата не отключается целиком", () => {
  // Точечное доверие одному ключу — да; --ignore-certificate-errors без
  // списка означал бы, что разбор снимет что угодно под любым сертификатом.
  assert.match(shot, /--ignore-certificate-errors-spki-list=/);
  assert.ok(
    !/--ignore-certificate-errors(?!-spki-list)/.test(shot),
    "проверка сертификатов отключена целиком",
  );
});
