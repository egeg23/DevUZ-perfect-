/**
 * Карточка порции или потока ушла без текста — текст досылается.
 *
 * 1 октября на ключе модели кончились деньги: утренняя порция и поток
 * пришли менеджерам карточками «Текст ещё готовится», а второй попытки
 * написать письмо не было. Владелец пополнил баланс: «отправь все
 * уведомления, которые нужно было».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import Anthropic from "@anthropic-ai/sdk";

import { textDue } from "@/lib/admin/portion";
import { isModelTroubleSays, modelTroubleSays } from "@/lib/model-trouble";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const between = (text: string, from: string, to: string) => {
  const start = text.indexOf(from);
  return text.slice(start, text.indexOf(to, start + from.length));
};

const apiError = (status: number, message: string) =>
  new Anthropic.APIError(status, { type: "error", error: { type: "invalid_request_error", message } }, message, undefined);

/* ── Отказ модели по строке ──────────────────────────────────────────── */

test("отказ модели узнаётся по фразе, которую уже вернул modelTroubleSays", () => {
  const troubles = [
    apiError(400, "Your credit balance is too low to access the Anthropic API."),
    apiError(401, "invalid x-api-key"),
    apiError(429, "rate limit"),
    apiError(529, "overloaded"),
    new Anthropic.APIConnectionError({ message: "fetch failed" }),
  ];
  for (const error of troubles) {
    assert.equal(isModelTroubleSays(modelTroubleSays(error)), true, modelTroubleSays(error));
  }
});

test("дефект и промах письма — не отказ модели: их повтор не исправит", () => {
  for (const why of [
    modelTroubleSays(apiError(400, "max_tokens: must be greater than 0")),
    modelTroubleSays(new Error("что угодно")),
    "Модель не вернула сообщение.",
    "Не записана ниша — писать не от чего.",
    "",
    null,
    undefined,
  ]) {
    assert.equal(isModelTroubleSays(why), false, String(why));
  }
});

/* ── Что делать с карточкой без текста ───────────────────────────────── */

const DAY = "2026-10-01";
const ME = "me";
const base = {
  status: "new",
  message: null as string | null,
  claimed_by: null as string | null,
  touched_by: null as string | null,
  touched_at: null as string | null,
};

test("письмо написано, компанию никто не тронул — текст досылается", () => {
  assert.equal(textDue({ ...base, status: "contacting", message: "Добрый день…", claimed_by: ME }, ME, DAY), "send");
  assert.equal(textDue({ ...base, message: "Добрый день…" }, ME, DAY), "send");
});

test("письма пока нет — ждём", () => {
  assert.equal(textDue(base, ME, DAY), "wait");
});

test("компанию уже разобрали или забрал другой — досылать нечего", () => {
  const today = "2026-10-01T06:00:00Z";
  assert.equal(textDue({ ...base, status: "manual", message: "…", touched_by: ME, touched_at: today }, ME, DAY), "drop");
  assert.equal(textDue({ ...base, status: "sent", message: "…", touched_by: ME, touched_at: today }, ME, DAY), "drop");
  assert.equal(textDue({ ...base, status: "skipped", message: "…" }, ME, DAY), "drop");
  assert.equal(textDue({ ...base, status: "contacting", message: "…", claimed_by: "другой" }, ME, DAY), "drop");
});

/* ── Где это включено ────────────────────────────────────────────────── */

const store = read("lib/admin/portion-store.ts");
const stream = read("lib/admin/stream-store.ts");

test("подготовка порции: отказ модели возвращает письмо в очередь, готовое — досылается", () => {
  const prepare = between(store, "export async function prepareNextPortion", "export async function releaseOnModelTrouble");
  assert.match(prepare, /releaseOnModelTrouble\(waiting\.id/);
  assert.match(prepare, /deliverTexts\(new Date\(\), waiting\.staff_id/);
  const release = between(store, "export async function releaseOnModelTrouble", "export async function markBare");
  assert.match(release, /isModelTroubleSays\(why\)/, "повторять можно только отказ модели — не дефект и не промах письма");
  assert.match(release, /preparing_at: null/);
});

test("замена за «Не подходит» тоже повторяется после отказа модели", () => {
  const replacement = between(store, "export async function deliverReplacement", "export async function portionOwner");
  assert.match(replacement, /releaseOnModelTrouble\(rowId/);
});

test("карточка без текста помечается — и в порции, и в замене, и в потоке", () => {
  const deliver = between(store, "export async function deliverPortions", "export type TopUp");
  assert.match(deliver, /const bare = batch\.filter\(\(x\) => !x\.p\.message\)/);
  assert.match(deliver, /await markBare\(bare, now\)/);
  assert.match(deliver, /if \(!p\.message\) await markBare\(\[row\.id\], now\)/);
  assert.match(stream, /if \(!p\.message\) await markBare\(\[row\.id\]/);
  assert.match(stream, /releaseOnModelTrouble\(row\.id, result\.why\)/);
});

test("досылка: условная отметка, только до 18:00, у порции — по галочке «Порция касаний на день»", () => {
  const texts = between(store, "export async function deliverTexts", "/** Готов ли текст");
  assert.match(texts, /tashkentHour\(now\) >= REPORT_HOUR/);
  assert.match(texts, /\.not\("bare_at", "is", null\)[\s\S]*\.update\(\{ bare_at: null \}\)[\s\S]*\.not\("bare_at", "is", null\)/);
  assert.match(texts, /!stream && !wants\(person\.off, "portion"\)/);
  assert.match(texts, /else await markBare\(\[row\.id as string\], now\)/, "не дошло — отметка возвращается");
});

test("свип досылает тексты до вечернего отчёта", () => {
  const run = between(store, "export async function runPortions", "export async function preparePortionsInBackground");
  assert.ok(run.indexOf("deliverTexts(now)") > 0 && run.indexOf("deliverTexts(now)") < run.indexOf("reportPortions(now)"));
});

test("миграция: отметка «ушла без текста» с откатом", () => {
  assert.match(read("supabase/migrations/0070_portion_bare.sql"), /add column if not exists bare_at timestamptz/);
  assert.match(read("supabase/migrations/0070_portion_bare.down.sql"), /drop column if exists bare_at/);
});
