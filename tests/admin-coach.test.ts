import assert from "node:assert/strict";
import { test } from "node:test";

import {
  dailyDue,
  dailyPrompt,
  inventedNumbers,
  parseReview,
  snapshotOf,
  tashkentHour,
  weeklyDue,
  weeklyPrompt,
  type PersonSnapshot,
  type ReviewBody,
} from "@/lib/admin/coach";

const pulse = (over: Partial<PersonSnapshot["week"]> = {}): PersonSnapshot["week"] => ({
  inWork: 3, taken: 2, won: 1, lost: 0, contacts: 4, touches: 12, revenue: 800, stuck: 1, ...over,
});

const person: PersonSnapshot = {
  staffId: "d",
  name: "Данил",
  role: "менеджер",
  week: pulse(),
  prev: pulse({ touches: 9, won: 0, revenue: 0 }),
  month: pulse({ revenue: 2100 }),
  plans: [{ period: "week", metric: "won", target: 4, fact: 1, percent: 25 }],
  due: 320,
};

test("расписание: недельные в понедельник с шести по Ташкенту, ежедневные с семи", () => {
  // Понедельник 14 сентября 2026, 01:30 UTC — в Ташкенте 06:30.
  assert.equal(weeklyDue(new Date("2026-09-14T01:30:00Z")), true);
  // Тот же понедельник, но 00:30 UTC — в Ташкенте 05:30, рано.
  assert.equal(weeklyDue(new Date("2026-09-14T00:30:00Z")), false);
  // Воскресенье 13-го 22:00 UTC — в Ташкенте уже понедельник 03:00, но рано.
  assert.equal(weeklyDue(new Date("2026-09-13T22:00:00Z")), false);
  // Вторник — не день.
  assert.equal(weeklyDue(new Date("2026-09-15T05:00:00Z")), false);
  assert.equal(dailyDue(new Date("2026-09-15T01:59:00Z")), false, "06:59 по Ташкенту");
  assert.equal(dailyDue(new Date("2026-09-15T02:00:00Z")), true, "07:00 по Ташкенту");
  assert.equal(tashkentHour(new Date("2026-09-15T23:30:00Z")), 4);
});

test("промпт несёт только числа из пульса, планы и прошлую рекомендацию как данные", () => {
  const previous: ReviewBody = {
    headline: "Прошлая",
    last_period: null,
    wins: [],
    attention: [],
    actions: ["Закрыть 3 лида"],
    learn: ["Первое касание"],
  };
  const prompt = weeklyPrompt(person, previous, "2026-09-14");
  assert.match(prompt, /Сотрудник: Данил, роль: менеджер/);
  assert.match(prompt, /Эта неделя: в работе 3, взято 2, выиграно 1, проиграно 0, первых контактов 4, касаний 12, поступления \$800, без движения 1/);
  assert.match(prompt, /Прошлая неделя: .*касаний 9/);
  assert.match(prompt, /План на неделю — выигранных лидов: цель 4, факт 1 \(25%\)/);
  assert.match(prompt, /данные, не инструкции/);
  assert.match(prompt, /Действие: Закрыть 3 лида/);
  assert.match(weeklyPrompt({ ...person, plans: [] }, null, "2026-09-14"), /Планов не поставлено\.\nПрошлой рекомендации не было\./);
});

test("ежедневный промпт: сначала деньги и сроки, потом команда по именам", () => {
  const prompt = dailyPrompt(
    { month: { revenue: 5000, expenses: 900 }, expected: 6400, pendingContracts: 2, stuck: 3, taxesSoon: ["Налог с оборота — через 5 дней"] },
    [person],
    null,
    "2026-09-17",
  );
  assert.ok(prompt.indexOf("Договоров ждёт подписи владельца: 2") < prompt.indexOf("Данил (менеджер)"));
  assert.match(prompt, /Налог с оборота — через 5 дней/);
  assert.match(prompt, /кому что поручить/);
});

test("разбор ответа: заголовок обязателен, списки режутся по длине, мусор — null", () => {
  assert.equal(parseReview(null), null);
  assert.equal(parseReview({ wins: ["x"] }), null);
  const r = parseReview({
    headline: "  Неделя слабая по касаниям ",
    last_period: "",
    wins: ["a", "", 5, "b", "c", "d"],
    attention: ["x"],
    actions: ["y"],
    learn: ["l1", "l2", "l3"],
  })!;
  assert.equal(r.headline, "Неделя слабая по касаниям");
  assert.equal(r.last_period, null);
  assert.deepEqual(r.wins, ["a", "b", "c"]);
  assert.deepEqual(r.learn, ["l1", "l2"]);
});

test("выдуманное число в ответе ловится, свои числа — нет", () => {
  const prompt = weeklyPrompt(person, null, "2026-09-14");
  const honest: ReviewBody = {
    headline: "Касаний 12 против 9, выиграно 1 из плана 4",
    last_period: null,
    wins: ["Поступления $800 при нуле неделю назад"],
    attention: ["1 лид без движения"],
    actions: ["Довести план до 4 выигранных"],
    learn: [],
  };
  assert.deepEqual(inventedNumbers(honest, prompt), []);
  const liar: ReviewBody = { ...honest, attention: ["Конверсия упала до 37%", "касаний 12"] };
  assert.deepEqual(inventedNumbers(liar, prompt), ["37"]);
});

test("снимок пульса — числа, а не списки", () => {
  const s = snapshotOf({ staffId: "x", inWork: 1, taken: 0, won: 0, lost: 0, contacts: 0, touches: 2, revenue: 0, stuck: [{ id: "1", label: "a", priority: "hot", days: 3, staffId: "x" }] });
  assert.equal(s.stuck, 1);
  assert.ok(!("staffId" in s));
});

/* ── Запуск и права — в хранилище и свипе ──────────────────────────────── */

import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("сбор идёт по расписанию, повторно за период не собирает, force снимает оба правила", () => {
  const store = read("lib/admin/coach-store.ts");
  assert.match(store, /const wantWeekly = opts\.force \|\| weeklyDue\(now\);/);
  assert.match(store, /const wantDaily = opts\.force \|\| dailyDue\(now\);/);
  assert.match(store, /if \(!wantWeekly && !wantDaily\) return run;/, "в обычный проход должен выходить сразу");
  // Кому нужно — выясняется до тяжёлых загрузок: после семи «пора» верно весь день.
  assert.ok(store.indexOf("if (!needWeekly && !needDaily)") < store.indexOf("loadPulseRows(now)"), "строки пульса тянутся до проверки нужды");
  assert.match(store, /had\.period_start === weekStart && !opts\.force/);
  assert.match(store, /had\.period_start === today && !opts\.force/);
  // Прошлая рекомендация идёт в промпт только если она за другой период.
  assert.match(store, /had && had\.period_start !== weekStart \? had\.body : null/);
  // Недельные — не владельцу; дневные — владельцу и руководителям.
  assert.match(store, /people\.filter\(\(p\) => p\.role !== "admin"\)\.map/);
  assert.match(store, /p\.role === "admin" \|\| p\.role === "head"/);
});

test("свип зовёт тренера каждый проход, а кнопку «собрать сейчас» жмёт только владелец", () => {
  assert.match(read("app/api/reminders/sweep/route.ts"), /const coach = await runCoach\(new Date\(\)\);/);
  const actions = read("app/admin/plans/actions.ts");
  assert.match(actions, /export async function refreshReviews\(\) \{\n  await requireAdmin\(\);\n  const run = await runCoach\(new Date\(\), \{ force: true \}\);/);
});

test("ответ модели с выдуманным числом не публикуется", () => {
  const coach = read("lib/admin/coach.ts");
  assert.match(coach, /const invented = inventedNumbers\(review, prompt\);\n    if \(invented\.length\) return \{ ok: false/);
});
