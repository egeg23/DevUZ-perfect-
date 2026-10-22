/**
 * Письмо компании без сайта у автопрогона — после ответа, как у компаний с
 * сайтом (LETTER_AFTER_REPLY).
 *
 * 23.10.2026: ветка без сайта писала письмо всегда, двумя попытками модели;
 * за неделю 1322 вызова outreach-nosite. Автопрогону письмо до ответа никто не
 * читает: по-русски ответившим уходит кружок.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("автопрогон без сайта: при подготовке письма нет, модель не зовётся", () => {
  const store = read("lib/admin/outreach-store.ts");
  assert.match(store, /if \(!prospect\.host \|\| !prospect\.url\) return prepareNoSite\(prospect, staff, options\);/);
  const prep = store.slice(store.indexOf("async function prepareNoSite"), store.indexOf("export type PrepareResult"));
  const lazy = prep.slice(prep.indexOf("if (options.letter === false) {"), prep.indexOf("let message: string;"));
  assert.match(lazy, /message: null/);
  assert.match(lazy, /return \{ ok: true, message: "" \};/);
  assert.doesNotMatch(lazy, /writeNoSite|anthropic/);
});

test("после ответа письмо без сайта пишет writeLetterLater тем же writeNoSite", () => {
  const store = read("lib/admin/outreach-store.ts");
  const later = store.slice(store.indexOf("export async function writeLetterLater"), store.indexOf("/* ── Отправка"));
  assert.match(later, /if \(!prospect\.host \|\| !prospect\.url\) \{[\s\S]*await writeNoSite\(prospect\.label, niche, AUTOPILOT\.display_name\)/);
  assert.equal(store.match(/anthropic\("outreach-nosite"\)/g)?.length, 1, "модель для письма без сайта зовётся в одном месте");
});
