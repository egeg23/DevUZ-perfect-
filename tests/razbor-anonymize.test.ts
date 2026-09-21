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
// Сам код затирания уехал в общий модуль: его выполняют оба прохода —
// одиночный razbor-shot и пакетный razbor-shots. Проверяем его там, где он
// теперь один; иначе две копии анонимности разойдутся, и заметно это станет
// на опубликованной странице.
const inPage = readFileSync(new URL("lib/razbor/in-page.ts", ROOT), "utf8");
const shots = readFileSync(new URL("scripts/razbor-shots.mjs", ROOT), "utf8");

test("плашка не подчиняется стилям чужой страницы", () => {
  // Выстрелило ровно так: на example.com для div задано opacity: .8, плашка
  // вставала на место и становилась полупрозрачной. Имя читалось сквозь неё.
  assert.match(inPage, /setProperty\("all", "initial", "important"\)/);
  assert.match(inPage, /setProperty\(name, rules\[name\], "important"\)/);
  for (const prop of ["opacity", "filter", "mix-blend-mode", "transform", "visibility"]) {
    assert.ok(inPage.includes(`"${prop}"`) || inPage.includes(`${prop}:`), `${prop} не сброшен`);
  }
});

test("плашки кладутся в body и только после всех замеров", () => {
  // В <html> они рисуются ниже содержимого body при любом z-index.
  assert.match(inPage, /document\.body\.appendChild\(box\)/);
  assert.ok(
    !/document\.documentElement\.appendChild\(box\)/.test(inPage),
    "плашка снова уходит в documentElement — будет рисоваться под текстом",
  );

  // Правка DOM во время обхода сдвигает раскладку, и следующий замер
  // приходит уже по сдвинутой странице.
  const measure = inPage.indexOf("const targets: { rect: DOMRect; color: string }[] = []");
  const draw = inPage.indexOf("for (const { rect, color } of targets)");
  assert.ok(measure > 0 && draw > measure, "рисование перемешано с замерами");
});

test("цвет плашки берётся только непрозрачный", () => {
  assert.match(inPage, /alpha >= 0\.99/);
});

test("логотип затирается везде, а не только в шапке", () => {
  // Пока снимался один первый экран, шапки хватало. Снимок находки бывает
  // где угодно, и первый же такой вышел с подвалом, где логотип с именем
  // компании стоял целым. Разбор анонимный, и цена промаха здесь не
  // «некрасиво», а названная публично компания.
  assert.match(inPage, /footer, \.footer, #footer, \[role=contentinfo\]/);
  assert.match(inPage, /\[class\*="logo" i\]/);
  assert.match(inPage, /img\[src\*="logo" i\]/);
});

test("плашка не белеет на тёмном сайте", () => {
  // Фон бывает градиентом — тогда сплошного background-color нет ни у кого
  // до самого корня, и плашка вставала белой на тёмно-синем. Выглядит это
  // не затиранием, а вырезанным куском: разбор начинает походить на
  // утёкший документ.
  assert.match(inPage, /backgroundImage/);
  assert.match(inPage, /for \(const root of \[document\.body, document\.documentElement\]\)/);
});

test("место находки ищется по всей странице, но не размером с экран", () => {
  // Год в подвале и стена текста живут ниже сгиба: требовать от них быть
  // на первом экране значит не показать их никогда.
  assert.match(inPage, /scrollIntoView\(\{ block: "center", inline: "nearest" \}\)/);
  // А обводка по краям окна говорит «смотрите сюда» про всё сразу, то есть
  // ни про что: так находилась подложка вместо картинки без подписи.
  assert.match(inPage, /rect\.width > window\.innerWidth \* 0\.95 && rect\.height > window\.innerHeight \* 0\.7/);
  // Собственный текст, а не весь вложенный: у пункта меню с выпадающим
  // списком «текста» набирается на абзац, хотя на экране это одно слово.
  assert.match(inPage, /const own = \(el: Element\): string =>/);
});

test("затирание не размножено по скриптам", () => {
  // Две копии одной анонимности однажды разойдутся, и разойдутся тихо:
  // один проход перестанет закрывать имя, а увидят это уже на сайте.
  for (const [name, source] of [["razbor-shot", shot], ["razbor-shots", shots]] as const) {
    assert.ok(
      !/function redactInPage\(/.test(source),
      `${name}: своя копия затирания вместо общего модуля`,
    );
    assert.match(source, /redactInPage/, `${name}: затирание не вызывается вовсе`);
  }
});

test("оба прохода снимают с одним и тем же доверием к сертификату", () => {
  assert.match(shots, /--ignore-certificate-errors-spki-list=/);
  assert.ok(
    !/--ignore-certificate-errors(?!-spki-list)/.test(shots),
    "пакетный проход отключает проверку сертификатов целиком",
  );
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
