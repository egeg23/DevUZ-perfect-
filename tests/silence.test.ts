/**
 * Сигнал о молчании: в 12:00 — человеку, у которого за день ни касаний, ни
 * панели, ни действий; в 15:00 — руководителям и владельцу.
 *
 * Владелец, 13.10.2026, «Делаем».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { NOTICES, kindsFor } from "@/lib/admin/notify-prefs";
import {
  alertText,
  away,
  nudgeButton,
  nudgeText,
  silenceKey,
  silenceStep,
  silenceStepAt,
  silent,
} from "@/lib/admin/silence";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const zero = { touches: 0, views: 0, minutes: 0, actions: 0 };

test("12:00–15:00 — напоминание, 15:00–18:00 — руководителям, иначе ничего", () => {
  assert.equal(silenceStep(11), null);
  assert.equal(silenceStep(12), "nudge");
  assert.equal(silenceStep(14), "nudge");
  assert.equal(silenceStep(15), "alert");
  assert.equal(silenceStep(17), "alert");
  assert.equal(silenceStep(18), null, "в 18:00 — вечерний отчёт");
  // Ташкент = UTC+5.
  assert.equal(silenceStepAt(new Date("2026-10-13T07:00:00Z")), "nudge");
  assert.equal(silenceStepAt(new Date("2026-10-13T10:05:00Z")), "alert");
});

test("молчит только тот, у кого за день ноль всего", () => {
  assert.equal(silent(zero), true);
  assert.equal(silent({ ...zero, touches: 1 }), false);
  assert.equal(silent({ ...zero, views: 1 }), false, "зашёл в панель — уже не молчит");
  assert.equal(silent({ ...zero, minutes: 3 }), false);
  assert.equal(silent({ ...zero, actions: 1 }), false, "нажал кнопку в боте — уже не молчит");
});

test("не на работе: план 0 или снята «Новые заявки по очереди»", () => {
  assert.equal(away(null, true), false, "без плана — порция 5, на работе");
  assert.equal(away(20, true), false);
  assert.equal(away(0, true), true, "план 0 — порции нет");
  assert.equal(away(20, false), true, "вне очереди — отпуск или больничный");
});

test("входы не в счёт: журнал читается без login.*", () => {
  const store = read("lib/admin/silence-store.ts");
  assert.match(store, /\.not\("action", "like", "login\.%"\)/);
  assert.match(store, /isWorkday\(now\)/, "только рабочие дни");
  assert.match(store, /silenceKey\("nudge", day\)/);
  assert.match(store, /silenceKey\("alert", day\)/);
  assert.match(store, /wants\(\(s\.notify_off as string\[\] \| null\) \?\? \[\], "reports"\)/, "15:00 — под галочкой «Отчёты»");
  assert.match(read("app/api/reminders/sweep/route.ts"), /runSilence\(new Date\(\)\)/);
});

test("отметка — одна в день на шаг", () => {
  assert.equal(silenceKey("nudge", "2026-10-13"), "silence-nudge:2026-10-13");
  assert.notEqual(silenceKey("nudge", "2026-10-13"), silenceKey("alert", "2026-10-13"));
});

test("тексты: по имени, на языке панели, со ссылкой на порцию", () => {
  assert.match(nudgeText("Ренат", "ru"), /^🕛 Ренат, добрый день!/);
  assert.match(nudgeText(null, "ru"), /^🕛 Добрый день!/);
  assert.match(nudgeText("Istam", "uz"), /Istam, xayrli kun!/);
  assert.doesNotMatch(nudgeText("Istam", "uz"), /[а-яё]/i, "узбекский — латиница");
  assert.doesNotMatch(nudgeText("Jan", "pl"), /[а-яё]/i);
  for (const l of ["ru", "uz", "pl"] as const) assert.ok(nudgeButton(l).length > 5);
  assert.equal(alertText([]), null);
  assert.match(alertText(["Станислав"]) ?? "", /молчит: Станислав/);
  assert.match(alertText(["Ренат", "Ахаджон"]) ?? "", /молчат: Ахаджон, Ренат/);
});

test("галочка — у менеджера и руководителя, на трёх языках", () => {
  assert.ok(kindsFor("manager").includes("silence"));
  assert.ok(kindsFor("head").includes("silence"));
  assert.ok(!kindsFor("admin").includes("silence"));
  for (const l of ["ru", "uz", "pl"] as const) assert.ok(NOTICES.silence.title[l]);
});
