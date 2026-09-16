import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  HEAD_TEAM_PERCENT,
  accrualsOf,
  founderShares,
  foundersPool,
  isFounder,
  type Accrual,
  type Earner,
  type Expense,
  type PaymentMoney,
  type ProjectMoney,
} from "@/lib/admin/finance";

/**
 * Соучредитель и расходы студии.
 *
 * Владелец: «5 % с команды он не получает, так как он соучредитель и
 * получает 30 % после вычета всех расходов. А реклама делится в равной
 * пропорции как расход 30/70, где 70 % доли прибыли и расходов мои».
 *
 * Два правила, которые легко потерять при следующей правке ставок:
 *
 *  1. соучредителю не идёт процент с команды — иначе те же деньги
 *     достаются ему дважды, процентом со сделки и долей в котле;
 *  2. расходы вычитаются ДО деления — иначе реклама ложится целиком на
 *     владельца, а доля соучредителя выходит завышенной.
 */

const OWNER = "egor";
const ALEX = "alex";
const MANAGER = "dilnoza";

const earner = (over: Partial<Earner> & { id: string }): Earner => ({
  grade: "manager",
  rate_percent: null,
  head_staff_id: null,
  founder_percent: null,
  ...over,
});

/** Александр: руководитель проектов и соучредитель с долей 30 %. */
const founderHead = earner({ id: ALEX, grade: "head", founder_percent: 30 });
/** Тот же руководитель, но наёмный — для сравнения. */
const hiredHead = earner({ id: ALEX, grade: "head" });
const manager = earner({ id: MANAGER, head_staff_id: ALEX });

const project = (over: Partial<ProjectMoney> = {}): ProjectMoney => ({
  id: "p1",
  owner_staff_id: MANAGER,
  kind: "new",
  amount_usd: 10_000,
  tax_percent: 4,
  dev_cost_usd: 3_000,
  stage: "work",
  ...over,
});

/* ── Ставка с команды ───────────────────────────────────────────────────── */

test("наёмному руководителю процент с команды идёт", () => {
  const map = new Map([
    [ALEX, hiredHead],
    [MANAGER, manager],
  ]);
  const lines = accrualsOf(project(), [], map);

  const head = lines.find((l) => l.staff_id === ALEX);
  assert.ok(head, "строки руководителя нет");
  assert.equal(head.percent, HEAD_TEAM_PERCENT);
});

test("соучредителю процент с команды не идёт", () => {
  const map = new Map([
    [ALEX, founderHead],
    [MANAGER, manager],
  ]);
  const lines = accrualsOf(project(), [], map);

  assert.ok(
    !lines.some((l) => l.staff_id === ALEX),
    "соучредитель получил процент со сделки менеджера сверх своей доли в котле",
  );
  // Доля самого менеджера при этом не меняется.
  assert.equal(lines.length, 1);
  assert.equal(lines[0]?.staff_id, MANAGER);
});

test("процент, выставленный руками, сильнее правила — и для соучредителя", () => {
  // Владелец вправе доплатить за конкретную работу, и правило про
  // соучредителя это право не отменяет.
  const map = new Map([
    [ALEX, founderHead],
    [MANAGER, manager],
  ]);
  const lines = accrualsOf(project(), [], map, new Map([[ALEX, 7]]));

  const head = lines.find((l) => l.staff_id === ALEX);
  assert.ok(head, "ручной процент соучредителю не начислился");
  assert.equal(head.percent, 7);
  assert.equal(head.manual, true);
});

test("isFounder отличает долю от её отсутствия", () => {
  assert.equal(isFounder({ founder_percent: 30 }), true);
  assert.equal(isFounder({ founder_percent: null }), false);
  // Нулевая доля — не доля: это способ «выключить» соучредителя, не стирая
  // запись.
  assert.equal(isFounder({ founder_percent: 0 }), false);
});

/* ── Котёл ──────────────────────────────────────────────────────────────── */

const expense = (amount: number, over: Partial<Expense> = {}): Expense => ({
  id: `e${amount}`,
  spent_on: "2026-09-01",
  amount_usd: amount,
  category: "ads",
  note: null,
  ...over,
});

test("делится только то, что пришло; незакрытое — отдельной строкой", () => {
  const paid = project({ id: "paid", amount_usd: 10_000, dev_cost_usd: 0, tax_percent: 0 });
  const open = project({ id: "open", amount_usd: 20_000, dev_cost_usd: 0, tax_percent: 0 });
  const payments: PaymentMoney[] = [{ project_id: "paid", amount_usd: 10_000 }];

  // Без начислений команде, чтобы проверять именно распределение по
  // состояниям, а не арифметику долей.
  const pool = foundersPool([paid, open], payments, [], []);

  assert.equal(pool.earned, 10_000);
  assert.equal(pool.frozen, 20_000);
  assert.equal(pool.pool, 10_000, "в делёж попали неоплаченные деньги");
});

test("отменённый проект не участвует вовсе", () => {
  const dead = project({ id: "dead", stage: "cancelled", amount_usd: 50_000, dev_cost_usd: 0, tax_percent: 0 });
  const pool = foundersPool([dead], [], [], []);

  assert.equal(pool.earned, 0);
  assert.equal(pool.frozen, 0);
});

test("расходы вычитаются до деления", () => {
  const paid = project({ id: "paid", amount_usd: 10_000, dev_cost_usd: 0, tax_percent: 0 });
  const payments: PaymentMoney[] = [{ project_id: "paid", amount_usd: 10_000 }];

  const pool = foundersPool([paid], payments, [], [expense(1_000), expense(500)]);
  assert.equal(pool.expenses, 1_500);
  assert.equal(pool.pool, 8_500);

  // И именно поэтому реклама ложится на обоих в их пропорции сама: доля
  // считается уже от уменьшенного котла.
  const [big, small] = founderShares(pool.pool, [
    earner({ id: OWNER, founder_percent: 70 }),
    earner({ id: ALEX, founder_percent: 30 }),
  ]);
  assert.equal(big?.amount_usd, 5_950);
  assert.equal(small?.amount_usd, 2_550);
});

test("начисления команде уходят из котла", () => {
  const paid = project({ id: "paid", amount_usd: 10_000, dev_cost_usd: 0, tax_percent: 0 });
  const payments: PaymentMoney[] = [{ project_id: "paid", amount_usd: 10_000 }];
  const accruals: Accrual[] = [
    {
      project_id: "paid",
      staff_id: MANAGER,
      share: "owner",
      percent: 15,
      manual: false,
      amount_usd: 1_500,
      state: "earned",
    },
  ];

  const pool = foundersPool([paid], payments, accruals, []);
  assert.equal(pool.earned, 8_500);
});

/* ── Доли ───────────────────────────────────────────────────────────────── */

test("доли сходятся до доллара на нечётной сумме", () => {
  // 70 % и 30 % от 1005 округляются каждая вверх и дают 1006 — на доллар
  // больше котла. Расхождение будут искать в расходах, а не в округлении,
  // поэтому последняя доля считается вычитанием.
  const shares = founderShares(1_005, [
    earner({ id: OWNER, founder_percent: 70 }),
    earner({ id: ALEX, founder_percent: 30 }),
  ]);

  assert.equal(shares.reduce((sum, s) => sum + s.amount_usd, 0), 1_005);
  assert.equal(shares[0]?.amount_usd, 704);
  assert.equal(shares[1]?.amount_usd, 301);
});

test("убыток делится в той же пропорции", () => {
  // Владелец: «70 % доли прибыли и расходов мои». Месяц в минус — тот же
  // раздел, иначе расходы оказались бы целиком на владельце.
  const shares = founderShares(-1_000, [
    earner({ id: OWNER, founder_percent: 70 }),
    earner({ id: ALEX, founder_percent: 30 }),
  ]);

  assert.equal(shares[0]?.amount_usd, -700);
  assert.equal(shares[1]?.amount_usd, -300);
  assert.equal(shares.reduce((sum, s) => sum + s.amount_usd, 0), -1_000);
});

test("без соучредителей делить нечего", () => {
  assert.deepEqual(founderShares(5_000, [earner({ id: MANAGER })]), []);
  assert.deepEqual(founderShares(5_000, []), []);
});

/* ── Проверки исходников ────────────────────────────────────────────────── */

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

test("расходы и котёл показываются только владельцу", () => {
  const page = read("app/admin/finance/page.tsx");

  // Доля соучредителя — тот же котёл в другой пропорции. Показать её
  // руководителю значит показать и доход владельца.
  assert.match(page, /const expenses = ownerMoney \? await loadExpenses\(\) : \[\];/);
  assert.match(page, /const pool = ownerMoney\s*\?\s*foundersPool\(/);
  assert.match(page, /\{ownerMoney \? \(\s*<section/);
});

test("расход вносят оба соучредителя, удаляет только владелец", () => {
  // Правило поменял владелец: «Мы можем добавлять разные статьи расходов».
  // Асимметрия при этом осталась, и она не случайна: выдуманный расход
  // уменьшает долю самого добавившего — соврать себе в плюс нельзя, поэтому
  // добавление безопасно отдать обоим. Удаление устроено наоборот: им можно
  // убрать чужую трату из картины, и оно осталось за владельцем.
  const ledger = read("lib/admin/ledger.ts");

  const add = ledger.indexOf("export async function addExpense(");
  assert.ok(add > 0, "addExpense пропала");
  assert.match(
    ledger.slice(add, add + 600),
    /if \(!keepsExpenses\(staff\.role\)\) return fail\("forbidden"\);/,
    "addExpense не проверяет права",
  );

  const drop = ledger.indexOf("export async function removeExpense(");
  assert.ok(drop > 0, "removeExpense пропала");
  assert.match(
    ledger.slice(drop, drop + 600),
    /if \(staff\.role !== "admin"\) return fail\("forbidden"\);/,
    "удаление расхода досталось не только владельцу",
  );

  // Удаление читает запись до удаления: иначе в журнал писать уже нечего.
  const at = ledger.indexOf("export async function removeExpense(");
  assert.match(ledger.slice(at, at + 900), /select\("amount_usd, category, spent_on"\)/);
});

test("себестоимость проекта не попадает в общие расходы", () => {
  // Иначе она вычлась бы дважды: из прибыли проекта и из котла.
  const sql = read("supabase/migrations/0022_expenses.sql");
  assert.ok(
    !/project_id/.test(sql),
    "у расхода появилась привязка к проекту — риск двойного вычета",
  );
  assert.match(sql, /check \(amount_usd > 0\)/);
  assert.match(sql, /founder_percent > 0 and founder_percent <= 100/);
});
