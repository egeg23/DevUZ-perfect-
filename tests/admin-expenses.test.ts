import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { byCategory, splitExpense, splitTotals } from "@/lib/admin/expense-split";
import { DEFAULT_DEADLINES, nextDue, upcoming } from "@/lib/admin/tax-calendar";
import { keepsExpenses, seesOwnerMoney } from "@/lib/admin/roles";

/**
 * Расходы студии и налоговый календарь.
 *
 * Здесь два обещания владельца. Первое: расходы делятся в той же пропорции,
 * что и прибыль, и второй соучредитель их видит. Второе: календарь не врёт
 * про сроки — а выдуманная дата сдачи декларации это ровно тот штраф, от
 * которого он должен защищать.
 */

const FOUNDERS = [
  { id: "egor", display_name: "Егор", founder_percent: 70 },
  { id: "alex", display_name: "Александр", founder_percent: 30 },
];

/* ── Кто видит ──────────────────────────────────────────────────────────── */

test("расходы видят оба соучредителя, доход владельца — только он", () => {
  // Расход уменьшает долю каждого, поэтому второй вправе знать, на что
  // уходят деньги. Прибыль — нет: из доли 30% делением получаются 70%.
  assert.equal(keepsExpenses("admin"), true);
  assert.equal(keepsExpenses("head"), true);
  assert.equal(keepsExpenses("manager"), false);

  assert.equal(seesOwnerMoney("head"), false, "руководитель увидел доход владельца");
});

/* ── Пропорция ──────────────────────────────────────────────────────────── */

test("реклама в 100 долларов делится как 70 и 30", () => {
  // Ровно тот пример, который привёл владелец.
  const shares = splitExpense(100, FOUNDERS);
  assert.deepEqual(
    shares.map((s) => [s.name, s.amount]),
    [["Егор", 70], ["Александр", 30]],
  );
});

test("последняя доля считается вычитанием, а не процентом", () => {
  // 70% и 30% от 101, округлённые каждая вверх, дают 101.3 — лишние центы
  // потом ищут в расходах. Сумма долей обязана совпадать с расходом.
  // Суммы подобраны перебором: на них обе доли округляются вверх, и наивный
  // расчёт «каждому свой процент» даёт на цент больше, чем потратили.
  // Первая версия теста брала круглые числа и мутацию не ловила.
  for (const amount of [0.15, 0.25, 0.45, 0.55, 0.85, 101, 33.33, 999.99, 7, 1]) {
    const shares = splitExpense(amount, FOUNDERS);
    const total = shares.reduce((sum, s) => sum + s.amount, 0);
    assert.ok(
      Math.abs(total - amount) < 0.005,
      `${amount}: доли дают ${total}`,
    );
  }
});

test("пропорция берётся из доли соучредителя, а не задаётся отдельно", () => {
  // Два места, где записана одна пропорция, однажды разойдутся молча.
  const other = [
    { id: "a", display_name: "A", founder_percent: 60 },
    { id: "b", display_name: "B", founder_percent: 40 },
  ];
  assert.deepEqual(splitExpense(200, other).map((s) => s.amount), [120, 80]);
});

test("не-соучредитель в дележе расходов не участвует", () => {
  const withManager = [...FOUNDERS, { id: "m", display_name: "Менеджер", founder_percent: 0 }];
  const shares = splitExpense(100, withManager);
  assert.equal(shares.length, 2);
  assert.ok(!shares.some((s) => s.name === "Менеджер"));
});

test("итоги за период складываются по каждому и держат порядок", () => {
  const totals = splitTotals(
    [{ amount_usd: 100 }, { amount_usd: 50 }, { amount_usd: 33.33 }],
    FOUNDERS,
  );
  assert.equal(totals[0].name, "Егор");
  assert.equal(totals[1].name, "Александр");
  const sum = totals.reduce((s, t) => s + t.amount, 0);
  assert.ok(Math.abs(sum - 183.33) < 0.01, `итог ${sum}`);
});

test("категории идут от большего к меньшему", () => {
  // Раздел отвечает на вопрос «куда уходит больше всего», а не «какие
  // категории бывают».
  const rows = byCategory([
    { amount_usd: 10, category: "tools" },
    { amount_usd: 500, category: "ads" },
    { amount_usd: 100, category: "contractors" },
    { amount_usd: 40, category: "tools" },
  ]);
  assert.deepEqual(rows, [
    { category: "ads", amount: 500 },
    { category: "contractors", amount: 100 },
    { category: "tools", amount: 50 },
  ]);
});

/* ── Налоговый календарь ────────────────────────────────────────────────── */

test("сроки по умолчанию помечены непроверенными", () => {
  // Выдуманная дата сдачи декларации — ровно тот штраф, от которого
  // календарь защищает. Пока бухгалтер не подтвердил, это заготовка.
  for (const deadline of DEFAULT_DEADLINES) {
    assert.equal(deadline.verified, false, `${deadline.id} выдан за проверенный`);
  }
});

test("страница говорит о непроверенных сроках рядом с датой", () => {
  // Сноску внизу страницы не читают, а штраф приходит один.
  const page = readFileSync(new URL("../app/admin/expenses/page.tsx", import.meta.url), "utf8");
  assert.match(page, /verified/);
  assert.match(page, /бухгалтер/i);
});

test("ежемесячный срок не уезжает в прошлое и перескакивает год", () => {
  assert.equal(nextDue(DEFAULT_DEADLINES[0], "2026-09-10"), "2026-09-15");
  assert.equal(nextDue(DEFAULT_DEADLINES[0], "2026-09-15"), "2026-09-15");
  assert.equal(nextDue(DEFAULT_DEADLINES[0], "2026-09-16"), "2026-10-15");
  // Декабрь обязан переходить в январь следующего года, а не в 13-й месяц.
  assert.equal(nextDue(DEFAULT_DEADLINES[0], "2026-12-20"), "2027-01-15");
});

test("годовой срок перескакивает на следующий год, когда прошёл", () => {
  const annual = DEFAULT_DEADLINES.find((d) => d.id === "annual")!;
  assert.equal(nextDue(annual, "2026-01-10"), "2026-04-01");
  assert.equal(nextDue(annual, "2026-04-01"), "2026-04-01");
  assert.equal(nextDue(annual, "2026-04-02"), "2027-04-01");
});

test("квартальный срок считается от конца квартала", () => {
  const quarterly = {
    id: "q", title: "Квартальная", what: "",
    recurrence: { kind: "quarterly" as const, day: 20, monthOffset: 1 },
    verified: false,
  };
  // Первый квартал кончается в марте, срок — 20 апреля.
  assert.equal(nextDue(quarterly, "2026-02-01"), "2026-04-20");
  assert.equal(nextDue(quarterly, "2026-04-21"), "2026-07-20");
  // Четвёртый квартал: срок уезжает в следующий год.
  assert.equal(nextDue(quarterly, "2026-11-01"), "2027-01-20");
});

test("горизонт показывает то, что горит, и в порядке срочности", () => {
  const list = upcoming(DEFAULT_DEADLINES, "2026-09-10", 14);
  assert.ok(list.length >= 1, "ничего не показано за две недели до 15-го");
  assert.ok(list.every((i) => i.daysLeft <= 14));
  for (let i = 1; i < list.length; i++) {
    assert.ok(list[i - 1].due <= list[i].due, "порядок не по дате");
  }
  // Далёкое не показывается: список, где всё подряд, перестают читать.
  assert.equal(upcoming(DEFAULT_DEADLINES, "2026-09-16", 5).length, 0);
});

test("дней до срока считается честно, без «сегодня» внутри функции", () => {
  // «Сегодня» внутри чистой функции делает тест зависимым от дня запуска —
  // такой тест однажды падает в полночь первого января.
  const [first] = upcoming(DEFAULT_DEADLINES, "2026-09-10", 14);
  assert.equal(first.daysLeft, 5);
});
