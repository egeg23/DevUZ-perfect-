import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

/**
 * Панель на телефоне.
 *
 * Менеджер смотрит лида в дороге, владелец — деньги между делом. Таблица,
 * которой задана ширина в тысячу пикселей, на экране в 390 превращается в
 * горизонтальную прокрутку: первая колонка уезжает раньше, чем находится
 * нужная. Поэтому ширина задаётся только с планшета (`sm:`), а на телефоне
 * строка становится карточкой — класс `cards-on-phone` и подпись у каждой
 * ячейки.
 *
 * Проверяется по разметке: добавить таблицу легко, вспомнить про телефон —
 * нет.
 */

const ROOT = new URL("../", import.meta.url);

function panelFiles(): string[] {
  const out: string[] = [];
  for (const dir of ["app/admin/", "components/admin/"]) {
    for (const name of readdirSync(new URL(dir, ROOT), { recursive: true, encoding: "utf8" })) {
      if (name.endsWith(".tsx")) out.push(`${dir}${name}`);
    }
  }
  return out;
}

const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

/** Лежит ли правило внутри `@layer` — считаем по скобкам, а не по слову. */
function insideLayer(css: string, index: number): boolean {
  const layers: number[] = [];
  let depth = 0;

  for (let i = 0; i < index; i++) {
    if (css.startsWith("@layer", i)) {
      const brace = css.indexOf("{", i);
      const semi = css.indexOf(";", i);
      // `@layer base, components;` — объявление порядка, а не блок.
      if (brace !== -1 && (semi === -1 || brace < semi)) layers.push(depth);
    }
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (layers.length && layers[layers.length - 1] === depth) layers.pop();
    }
  }
  return layers.length > 0;
}

/** Открывающие теги `<table …>` целиком. */
function tables(code: string): string[] {
  return [...code.matchAll(/<table[^>]*>/g)].map((m) => m[0]);
}

test("таблицы панели не задают ширину на телефоне", () => {
  const files = panelFiles();
  assert.ok(files.length > 8, `файлов панели найдено ${files.length}`);

  let seen = 0;
  for (const file of files) {
    for (const tag of tables(read(file))) {
      seen++;
      const bare = tag.replace(/sm:min-w-\[/g, "").includes("min-w-[");
      assert.ok(!bare, `${file}: таблица шире экрана телефона — ${tag}`);
    }
  }
  assert.ok(seen >= 6, `таблиц найдено ${seen} — проверка ничего не смотрит`);
});

test("у каждой ячейки карточной таблицы есть подпись", () => {
  let checked = 0;

  for (const file of panelFiles()) {
    const code = read(file);
    if (!code.includes("cards-on-phone")) continue;

    // Тело таблицы — от открывающего тега до закрывающего.
    for (const match of code.matchAll(/<table[^>]*cards-on-phone[^>]*>/g)) {
      const body = code.slice(match.index, code.indexOf("</table>", match.index));
      for (const cell of body.matchAll(/<td[^>]*>/g)) {
        // Ячейка на всю ширину — это сообщение «ничего нет», а не данные:
        // подписывать его нечем и незачем.
        if (cell[0].includes("colSpan")) continue;
        checked++;
        assert.match(
          cell[0],
          /data-label="/,
          `${file}: ячейка без подписи — на телефоне она встанет без заголовка: ${cell[0]}`,
        );
      }
    }
  }

  assert.ok(checked > 30, `ячеек проверено ${checked} — проверка слепа`);
});

test("карточная вёрстка объявлена в стилях и умеет прятать пустую подпись", () => {
  const css = readFileSync(new URL("app/globals.css", ROOT), "utf8");

  assert.match(css, /\.cards-on-phone\b/, "класс карточек не объявлен");
  assert.match(css, /content: attr\(data-label\)/, "подпись не берётся из data-label");
  assert.match(css, /td\[data-label=""\]::before/, "пустая подпись оставит дыру слева");
  // Правило обязано победить утилиты Tailwind, а они лежат в слое, и слой
  // проигрывает всему, что вне слоёв. Значит, карточки должны быть снаружи.
  // Проверяем скобками, а не поиском слова: «@layer» встречается в файле
  // выше по тексту, и простой поиск ничего не доказывает.
  assert.equal(
    insideLayer(css, css.indexOf(".cards-on-phone")),
    false,
    "правила карточек уехали в слой и проиграют утилитам Tailwind",
  );
});
