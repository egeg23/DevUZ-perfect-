/**
 * Вечерний отчёт команде: касания за день и порция — руководителям так же,
 * как владельцу.
 *
 * Владелец, 01.10: «Руководителям в телеграмм должно приходить как и мне,
 * сколько было касаний у каждого менеджера, сколько из порции дня они
 * сделали. В конце рабочего дня по Ташкенту».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { REPORT_HOUR, byTouches, reportLine, reportTotal, touchesOf, type PersonReport } from "@/lib/admin/portion";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const between = (text: string, from: string, to: string) => {
  const start = text.indexOf(from);
  return text.slice(start, text.indexOf(to, start + from.length));
};

const person = (over: Partial<PersonReport> & { name: string }): PersonReport => ({
  target: 5,
  done: 0,
  skipped: 0,
  short: 0,
  stream: 0,
  touches: 0,
  ...over,
});

test("в строке сначала все касания за день, потом порция", () => {
  // 3 по порции, 2 из потока и ещё 4 написал из панели сверх них.
  assert.equal(
    reportLine(person({ name: "Арсений", done: 3, skipped: 2, stream: 2, touches: 9 })),
    "Арсений — 9 касаний (поток 2) · порция 3 из 5, не подошло 2",
  );
  assert.equal(reportLine(person({ name: "Эльдар" })), "Эльдар — 0 касаний · порция 0 из 5 ⚠️");
  // Порции не было (план 0) и не писал — не тревога: касаний от него и не ждали.
  assert.equal(reportLine(person({ name: "Александр", target: 0 })), "Александр — 0 касаний · порции не было");
});

test("касаний за день не меньше, чем сделано по порции и потоку", () => {
  // Отправка по порции, которая потом не ушла, в касания не идёт, а в
  // порцию идёт: число не должно выглядеть так, будто порция больше дня.
  assert.equal(touchesOf(person({ name: "Данил", done: 3, stream: 1, touches: 2 })), 4);
  assert.equal(touchesOf(person({ name: "Данил", done: 3, stream: 1, touches: 6 })), 6);
});

test("итог по всем и порядок: больше касаний — выше", () => {
  const reports = [
    person({ name: "Эльдар", done: 1, touches: 1 }),
    person({ name: "Данил", done: 5, touches: 8 }),
    person({ name: "Абдукодир", done: 1, touches: 1 }),
    person({ name: "Александр", target: 0, touches: 2 }),
  ];
  assert.deepEqual(
    [...reports].sort(byTouches).map((r) => r.name),
    ["Данил", "Александр", "Абдукодир", "Эльдар"],
  );
  assert.equal(reportTotal(reports), "Всего: 12 касаний · порции: 7 из 15");
  assert.equal(reportTotal([person({ name: "Лола", target: 0, touches: 1 })]), "Всего: 1 касание");
});

const store = read("lib/admin/portion-store.ts");
const report = between(store, "export async function reportPortions", "/**\n * Компания из порции");

test("руководителям — тот же текст, что владельцу: вся команда, не только свои люди", () => {
  assert.doesNotMatch(report, /p\.head === head\.id/, "руководитель снова получает только своих");
  assert.match(report, /people\.filter\(\(p\) => p\.role === "head"\)/);
  assert.match(report, /\.eq\("role", "admin"\)/);
  assert.equal((report.match(/sendMessage\(/g) ?? []).length, 1, "один текст на всех читателей");
  assert.match(report, /wants\(reader\.off, "reports"\)/, "галочка «Отчёты» по-прежнему выключает отчёт");
});

test("в отчёте вся команда и все её касания за день — даже без порции", () => {
  assert.match(report, /touchesOnDay\(/);
  assert.match(report, /people\s*\.map\(\(person\)/);
  assert.doesNotMatch(report, /if \(!data\?\.length\) return 0;/, "пустой день порции не глушит отчёт");
  const touches = between(read("lib/admin/touch-store.ts"), "export async function touchesOnDay", "/**");
  assert.match(touches, /dayStartUtc\(day\)/);
  assert.match(touches, /\.neq\("status", "failed"\)/);
});

test("отчёт — в конце рабочего дня по Ташкенту", () => {
  assert.equal(REPORT_HOUR, 18);
  assert.match(report, /tashkentHour\(now\) < REPORT_HOUR/);
});
