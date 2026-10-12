import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { deckCopy } from "@/content/partner-decks";
import { locales } from "@/lib/i18n";
import { GRADES, gradeCap, gradeOf } from "@/lib/partners/grades";

/**
 * Грейды партнёров. Владелец, 12.10.2026: надбавки +2 / +4 / +6 п.п.,
 * пороги — как в kp/partner-grades.html. Презентация программы, документ
 * и этот модуль говорят одни и те же цифры.
 */

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("надбавки 0 / 2 / 4 / 6 и потолок 36 % от прибыли, 26 % с оборота", () => {
  for (const list of Object.values(GRADES)) assert.deepEqual(list.map((g) => g.bonus), [0, 2, 4, 6]);
  assert.equal(gradeCap("profit"), 36);
  assert.equal(gradeCap("turnover"), 26);
});

test("уровень — по проектам или обороту за 12 месяцев", () => {
  assert.equal(gradeOf("agency", 0, 0).key, "start");
  assert.equal(gradeOf("agency", 1, 10_000).key, "proven");
  assert.equal(gradeOf("agency", 5, 0).key, "key");
  assert.equal(gradeOf("agency", 3, 80_000).key, "strategic");
  assert.equal(gradeOf("blogger", 1, 0).key, "author");
  // У «Автора» оборота в условии нет: один крупный проект — это один клиент.
  assert.equal(gradeOf("blogger", 1, 9_000).key, "author");
  assert.equal(gradeOf("blogger", 2, 10_000).key, "ambassador");
  assert.equal(gradeOf("blogger", 7, 0).key, "face");
});

test("документ на бланке называет те же пороги", () => {
  const doc = read("kp/partner-grades.html");
  for (const phrase of ["2 оплаченных проекта", "10 000 $", "30 000 $", "75 000 $", "7 оплативших клиентов", "+6 п.п.", "36 % от прибыли", "26 % с оборота"]) {
    assert.ok(doc.includes(phrase), `в kp/partner-grades.html нет «${phrase}»`);
  }
});

test("презентация называет каждый уровень на каждом языке", () => {
  for (const locale of locales) {
    const t = deckCopy(locale).program;
    for (const list of Object.values(GRADES)) {
      for (const g of list) assert.ok(t.gradeNames[g.key], `${locale}: нет названия уровня ${g.key}`);
    }
    assert.ok(t.gradesNote(36, 26).includes("36"));
  }
  assert.match(read("app/[locale]/partners/deck/program/page.tsx"), /GRADES\[kind\]/);
});
