/**
 * Лид, добавленный вручную, — касание того, кто его добавил.
 *
 * Владелец, 19.11.2026, со слов Эльдара: «Доработать добавление лида
 * непосредственно, чтобы как касание считалось… а у меня 1 касание».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { MANUAL_LEAD_ACTION } from "@/lib/admin/touch-store";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("касание вручную — по записи журнала «добавил лид вручную»", () => {
  assert.equal(MANUAL_LEAD_ACTION, "lead.added");
  assert.match(read("lib/admin/lead-add.ts"), /record\("lead\.added", \{\s*actorStaffId: actor\.id/);
});

test("ручные лиды входят во все счёты касаний: день, неделя, «Главная», недельный и двухнедельный отчёты", () => {
  const store = read("lib/admin/touch-store.ts");
  assert.equal((store.match(/return addManual\(counts, await manualLeadStamps\(/g) ?? []).length, 2, "день и неделя");
  assert.match(read("lib/admin/hq-store.ts"), /\.\.\.manual\.filter\(\(m\) => m\.actor === s\.id\)\.map\(\(m\) => m\.at\)/);
  assert.match(read("lib/admin/staff-week-store.ts"), /\.eq\("action", MANUAL_LEAD_ACTION\)/);
  assert.match(read("lib/admin/period-report-store.ts"), /manualLeadStamps\(\[\.\.\.rows\.keys\(\)\], start, end\)/);
});

test("отметка ступени касанием не считается: один клиент — одно касание", () => {
  assert.doesNotMatch(read("lib/admin/touch-store.ts"), /sales_marks/);
});
