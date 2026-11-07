/**
 * Лесенка запросов для Trends и Вордстата (lib/seo/keywords.ts).
 *
 * Владелец, 07.11.2026: «Для всех статей мы должны использовать гугл трендс
 * и Яндекс вордстат запросы». За 30 дней до этого из 94 версий статей
 * Вордстат дал данные 25 раз, Trends — 17: отказы были «по Узбекистану
 * запросов нет» и «запрос редкий», а не блокировка. Узкую фразу спрашиваем
 * шире, а не браузером-роботом: браузер увидел бы те же «данных нет».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { broaderQueries, firstWithData, mergeRelated, trendsEmpty, wordstatEmpty, type SourceResult } from "@/lib/seo/keywords";

test("шире: без слов места, потом короче на слово, не короче двух слов", () => {
  assert.deepEqual(broaderQueries("продвижение стоматологии в Ташкенте"), ["продвижение стоматологии"]);
  assert.deepEqual(broaderQueries("сайт для стоматологии"), ["сайт стоматологии"]);
  assert.deepEqual(broaderQueries("toshkentda sayt yaratish"), ["sayt yaratish"]);
  assert.deepEqual(broaderQueries("sayt yaratish Toshkent"), ["sayt yaratish"]);
  assert.deepEqual(broaderQueries("интернет магазин медицинского оборудования"), ["интернет магазин медицинского", "интернет магазин"]);
  assert.deepEqual(broaderQueries("таргет в instagram"), ["таргет instagram"]);
  assert.deepEqual(broaderQueries("smm"), []);
  assert.deepEqual(broaderQueries("реклама"), []);
});

test("лесенка: первая ступень с данными; сбой источника — сразу назад, шире не спрашиваем", async () => {
  const asked: string[] = [];
  const answers: Record<string, SourceResult> = {
    "a b c": { ok: false, reason: "в Вордстате по Узбекистану запросов нет" },
    "a b": { ok: true, phrases: [{ phrase: "a b x", value: 10 }] },
  };
  const result = await firstWithData(["a b c", "a b", "a"], async (q) => {
    asked.push(q);
    return answers[q] ?? { ok: false, reason: "в Вордстате по Узбекистану запросов нет" };
  }, wordstatEmpty);
  assert.deepEqual(asked, ["a b c", "a b"]);
  assert.deepEqual(result, { ok: true, phrases: [{ phrase: "a b x", value: 10 }], asked: "a b" });

  const blocked: string[] = [];
  const fail = await firstWithData(["a b c", "a b"], async (q) => {
    blocked.push(q);
    return { ok: false, reason: "Вордстат ответил 403" };
  }, wordstatEmpty);
  assert.deepEqual(blocked, ["a b c"], "403 — не повод спрашивать шире");
  assert.equal(fail.ok, false);

  assert.ok(trendsEmpty({ ok: false, reason: "запрос редкий — Trends данных не даёт" }));
  assert.ok(trendsEmpty({ ok: false, reason: "у запроса нет данных в Trends" }));
  assert.ok(!trendsEmpty({ ok: false, reason: "Trends ответил 429" }));
});

test("сопутствующие запросы — без исходной фразы и без ступени, которая ответила", () => {
  const related = mergeRelated(
    "продвижение стоматологии в ташкенте",
    { ok: true, phrases: [{ phrase: "продвижение стоматологии", value: 9 }, { phrase: "реклама стоматологии", value: 5 }], asked: "продвижение стоматологии" },
    { ok: false, reason: "запрос редкий" },
  );
  assert.deepEqual(related, ["реклама стоматологии"]);
});

test("каждая статья идёт через лесенку: исходная фраза в Trends — ещё и за 5 лет", () => {
  const source = readFileSync("lib/seo/keywords.ts", "utf8");
  assert.match(source, /const ladder = \[query, \.\.\.broaderQueries\(query\)\];/);
  assert.match(source, /step === 0 \? \[TRENDS_TIME, TRENDS_LONG\] : \[TRENDS_TIME\]/);
  assert.match(source, /TRENDS_LONG = "today 5-y"/);
});
