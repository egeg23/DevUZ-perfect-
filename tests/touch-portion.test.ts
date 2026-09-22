/**
 * Порция дня касаний.
 *
 * Владелец: «нужно решение, которое поможет менеджерам работать эффективно».
 * Утром каждому — поровну компаний из пула с готовым текстом; вечером —
 * отчёт руководителю и владельцу, несделанное — обратно в пул.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  PORTION_DEFAULT,
  PORTION_MAX,
  PORTION_MIN,
  distribute,
  isWorkday,
  outcomeOf,
  quotaOf,
  reportLine,
  tashkentHour,
} from "@/lib/admin/portion";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

test("сколько в день — из недельного плана касаний", () => {
  assert.equal(quotaOf(null), PORTION_DEFAULT, "без плана — по умолчанию");
  assert.equal(quotaOf(0), 0, "план ноль — порции нет");
  assert.equal(quotaOf(30), 6, "30 в неделю — 6 в день");
  assert.equal(quotaOf(12), 3, "округление вверх");
  assert.equal(quotaOf(3), PORTION_MIN);
  assert.equal(quotaOf(500), PORTION_MAX);
});

test("пул делится по кругу, а не первому всё", () => {
  const people = [
    { id: "a", quota: 3 },
    { id: "b", quota: 3 },
    { id: "c", quota: 1 },
  ];
  // Пула меньше, чем порций: каждый получает поровну, лучшие — не одному.
  const short = distribute(people, ["p1", "p2", "p3", "p4"]);
  assert.deepEqual(short.get("a"), ["p1", "p4"]);
  assert.deepEqual(short.get("b"), ["p2"]);
  assert.deepEqual(short.get("c"), ["p3"]);

  // Пула хватает: каждый ровно своё, лишнее остаётся в пуле.
  const full = distribute(people, ["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  assert.equal(full.get("a")!.length, 3);
  assert.equal(full.get("b")!.length, 3);
  assert.equal(full.get("c")!.length, 1);
  const handed = [...full.values()].flat();
  assert.equal(new Set(handed).size, handed.length, "одна компания досталась двоим");

  assert.deepEqual([...distribute([{ id: "a", quota: 0 }], ["x"]).get("a")!], []);
  assert.deepEqual(distribute([], ["x"]).size, 0);
});

test("рабочие дни и часы — по Ташкенту", () => {
  // Пятница 23:30 UTC — в Ташкенте уже суббота 04:30.
  assert.equal(isWorkday(new Date("2026-09-25T23:30:00Z")), false);
  assert.equal(isWorkday(new Date("2026-09-25T10:00:00Z")), true);
  assert.equal(isWorkday(new Date("2026-09-27T10:00:00Z")), false, "воскресенье");
  assert.equal(tashkentHour(new Date("2026-09-23T02:00:00Z")), 7);
});

test("сделано — по самому касанию: кем и в этот день", () => {
  const day = "2026-09-23";
  // 23.09 00:30 по Ташкенту = 22.09 19:30 UTC.
  const today = "2026-09-22T19:30:00Z";
  const yesterday = "2026-09-22T18:30:00Z";
  assert.equal(outcomeOf({ status: "sending", touched_by: "m1", touched_at: today }, "m1", day), "sent");
  assert.equal(outcomeOf({ status: "manual", touched_by: "m1", touched_at: today }, "m1", day), "self");
  assert.equal(outcomeOf({ status: "skipped", touched_by: null, touched_at: null }, "m1", day), "skipped");
  assert.equal(outcomeOf({ status: "sent", touched_by: "m2", touched_at: today }, "m1", day), null, "сделал другой");
  assert.equal(outcomeOf({ status: "sent", touched_by: "m1", touched_at: yesterday }, "m1", day), null, "вчера");
  assert.equal(outcomeOf({ status: "contacting", touched_by: null, touched_at: null }, "m1", day), null);
});

test("строка отчёта", () => {
  assert.equal(reportLine({ name: "Данил", total: 5, done: 5, skipped: 0 }), "Данил — 5 из 5 ✅");
  assert.equal(reportLine({ name: "Мадина", total: 5, done: 0, skipped: 0 }), "Мадина — 0 из 5 ⚠️");
  assert.equal(reportLine({ name: "Арсений", total: 5, done: 3, skipped: 1 }), "Арсений — 3 из 5, не подошло 1");
});

test("раздача — раз в день и без двойной раздачи", () => {
  const store = read("lib/admin/portion-store.ts");
  const assign = store.slice(store.indexOf("export async function assignPortions("), store.indexOf("export async function prepareNextPortion("));
  assert.match(assign, /isWorkday\(now\) \|\| tashkentHour\(now\) < ASSIGN_HOUR/);
  assert.match(assign, /ignoreDuplicates: true/);
  assert.match(assign, /\.is\("assigned_at", null\)/);
  // Пул — только ничьи новые, и только те, кому есть как написать.
  const pool = store.slice(store.indexOf("async function pool("), store.indexOf("export type PortionAssign"));
  assert.match(pool, /\.eq\("status", "new"\)/);
  assert.match(pool, /\.is\("claimed_by", null\)/);
  assert.match(pool, /canContact\(/);
  assert.match(read("supabase/migrations/0049_touch_portions.sql"), /unique \(day, prospect_id\)/);
});

test("письма готовятся после ответа свипу и без повторов", () => {
  const sweep = read("app/api/reminders/sweep/route.ts");
  assert.match(sweep, /after\(async \(\) => \{[\s\S]{0,200}await preparePortionsInBackground\(/);
  assert.match(sweep, /await runPortions\(new Date\(\)\)/);
  const store = read("lib/admin/portion-store.ts");
  const prep = store.slice(store.indexOf("export async function prepareNextPortion("), store.indexOf("function ready("));
  assert.match(prep, /\.is\("preparing_at", null\)/);
  assert.match(prep, /update\(\{ preparing_at: now\.toISOString\(\) \}\)[\s\S]{0,80}\.is\("preparing_at", null\)/);
});

test("вечером несделанное — в пул, и без письма с чужой подписью", () => {
  const store = read("lib/admin/portion-store.ts");
  const report = store.slice(store.indexOf("export async function reportPortions("), store.indexOf("export async function portionOf("));
  assert.match(report, /update\(\{ status: "new", claimed_by: null, claimed_at: null, message: null \}\)/);
  assert.match(report, /outcome: outcome \?\? "expired"/);
  // Руководителю — его люди, владельцу — все.
  assert.match(report, /p\.head === head\.id/);
  assert.match(report, /\.eq\("role", "admin"\)/);
});

test("кнопки бота — только своя порция и те же проверки, что в панели", () => {
  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /parts\[0\] === "tp"/);
  const handler = hook.slice(hook.indexOf("async function handlePortionButton("));
  assert.match(handler, /await inPortion\(staff\.id, prospectId\)/);
  assert.match(handler, /queueOutreach\(prospectId, message, staff, ip\)/);
  assert.match(handler, /markSelfContacted\(prospectId, staff/);
  assert.match(handler, /skipProspect\(prospectId/);
});

test("отключённому порцию закрывают, в «Касаниях» она сверху", () => {
  assert.match(read("lib/admin/offboarding.ts"), /from\("touch_portions"\)[\s\S]{0,80}outcome: "expired"/);
  const page = read("app/admin/prospect/page.tsx");
  assert.match(page, /portionOf\(staff\.id\)/);
  assert.ok(page.indexOf("Ваша порция на сегодня") < page.indexOf("<ProspectRunner"), "порция ниже прогона");
});
