import assert from "node:assert/strict";
import { test } from "node:test";

import { cases } from "@/content/cases";

/**
 * Превью кейса — типографика, а не картинка.
 *
 * Скриншотов проектов у нас нет, а рисовать клиенту фирменный знак,
 * которого у него не существует, значит выдавать выдумку за его брендинг.
 * Поэтому в превью монограмма и имя — единственное, что здесь и правда
 * принадлежит проекту. Пустая монограмма оставит в плитке дыру, длинная
 * из неё вылезет: и то и другое видно только глазами и только на боевом.
 */
test("у каждого кейса есть монограмма, и она влезает в плитку", () => {
  for (const item of cases) {
    assert.ok(item.monogram?.trim(), `${item.slug}: монограмма не задана`);
    assert.ok(
      item.monogram.length <= 4,
      `${item.slug}: монограмма «${item.monogram}» длиннее четырёх знаков — не поместится`,
    );
    // Монограмма набирается заглавными: строчная буква в ряду прописных
    // читается как опечатка, а не как замысел.
    assert.equal(
      item.monogram,
      item.monogram.toUpperCase(),
      `${item.slug}: монограмма не заглавными`,
    );
  }
});

test("монограмма родом из названия, а не выдумана", () => {
  // Не строгая проверка первых букв — «TezKetKaz» даёт «TKK», а «USTA»
  // остаётся собой. Но каждая буква монограммы обязана встречаться в
  // названии: иначе это уже не сокращение, а новое имя.
  for (const item of cases) {
    const letters = new Set(item.name.toUpperCase().replace(/[^A-Z]/g, ""));
    for (const ch of item.monogram) {
      assert.ok(letters.has(ch), `${item.slug}: буквы «${ch}» нет в названии «${item.name}»`);
    }
  }
});

test("оттенок карточки — из известного набора", () => {
  // Незнакомый оттенок молча выпадет из таблицы ACCENTS и обрушит карточку
  // на обращении к undefined.
  const known = new Set(["green", "blue", "gold", "violet"]);
  for (const item of cases) {
    assert.ok(known.has(item.accent), `${item.slug}: неизвестный оттенок ${item.accent}`);
  }
});
