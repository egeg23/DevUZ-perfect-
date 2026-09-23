import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

import {
  accrualState,
  accrualsOf,
  balanceOf,
  canEditMoney,
  canSeeMoney,
  money,
  ownerShare,
  parsePercent,
  parseUsd,
  profitOf,
  ratePercent,
  visibleStaff,
  type Accrual,
  type Earner,
  type ProjectMoney,
} from "@/lib/admin/finance";

/**
 * Правила владельца, записанные числами. Каждый тест — одно правило: если
 * правило изменится, изменится ровно один тест, а не пять.
 */

const OWNER = "egor";
const HEAD = "alex";
const MANAGER = "dilnoza";
const JUNIOR = "timur";

// Руководитель здесь наёмный, без доли в студии: правила про ставку с
// команды проверяются именно на нём. Соучредитель — отдельная история, ему
// свой файл проверок (tests/admin-founders.test.ts).
const earners = new Map<string, Earner>([
  [HEAD, { id: HEAD, grade: "head", rate_percent: null, head_staff_id: null, founder_percent: null }],
  [MANAGER, { id: MANAGER, grade: "manager", rate_percent: null, head_staff_id: HEAD, founder_percent: null }],
  [JUNIOR, { id: JUNIOR, grade: "junior", rate_percent: null, head_staff_id: HEAD, founder_percent: null }],
]);

function project(over: Partial<ProjectMoney> = {}): ProjectMoney {
  return {
    id: "p1",
    owner_staff_id: MANAGER,
    kind: "new",
    amount_usd: 10_000,
    tax_percent: 4,
    dev_cost_usd: 3_000,
    stage: "build",
    ...over,
  };
}

test("ставки по грейду: 10 / 15 / 30 на новом клиенте, допродажа — 5 менеджеру и ничего младшему", () => {
  // Словами владельца: «15 % — ставка хорошего менеджера, 5 % — апсейл;
  // у начинающего 10 % без апсейлов; руководителю 30 %, если это его клиент».
  assert.equal(ratePercent({ grade: "junior", rate_percent: null }, "new"), 10);
  assert.equal(ratePercent({ grade: "manager", rate_percent: null }, "new"), 15);
  assert.equal(ratePercent({ grade: "manager", rate_percent: null }, "upsell"), 5);
  assert.equal(ratePercent({ grade: "head", rate_percent: null }, "new"), 30);
  assert.equal(ratePercent({ grade: "junior", rate_percent: null }, "upsell"), 0);
  assert.equal(ratePercent({ grade: "head", rate_percent: null }, "upsell"), 30);
});

test("персональная ставка заменяет грейдовую на новых клиентах, допродажа идёт по грейду", () => {
  assert.equal(ratePercent({ grade: "manager", rate_percent: 12 }, "new"), 12);
  assert.equal(ratePercent({ grade: "manager", rate_percent: 12 }, "upsell"), 5);
});

test("чистая прибыль — сумма минус налог минус себестоимость", () => {
  // 10 000 − 4 % (400) − 3 000 = 6 600
  assert.equal(profitOf(project()), 6_600);
  // Минус — тоже ответ, а не ошибка.
  assert.equal(profitOf(project({ dev_cost_usd: 12_000 })), -2_400);
  // Без суммы прибыли нет — не ноль, а «не проставлено».
  assert.equal(profitOf(project({ amount_usd: null })), null);
  // Себестоимость, пока не вписана, считается нулём.
  assert.equal(profitOf(project({ dev_cost_usd: null })), 9_600);
});

test("начисление менеджеру — ставка от прибыли, руководителю — 5 % сверху, владельцу — остальное", () => {
  const lines = accrualsOf(project(), [], earners);
  const mine = lines.find((a) => a.staff_id === MANAGER);
  const boss = lines.find((a) => a.staff_id === HEAD);
  assert.ok(mine && boss, "должно быть две строки: менеджер и его руководитель");
  assert.equal(mine.share, "owner");
  assert.equal(mine.percent, 15);
  assert.equal(mine.amount_usd, 990);
  assert.equal(boss.share, "head");
  assert.equal(boss.percent, 5);
  assert.equal(boss.amount_usd, 330);
  // 6 600 − 990 − 330
  assert.equal(ownerShare(project(), lines), 5_280);
});

test("руководитель получает 5 % и со сделки младшего, и с допродажи", () => {
  const junior = accrualsOf(project({ owner_staff_id: JUNIOR }), [], earners);
  assert.equal(junior.find((a) => a.staff_id === JUNIOR)?.amount_usd, 660);
  assert.equal(junior.find((a) => a.staff_id === HEAD)?.amount_usd, 330);

  // Допродажа младшего: ему — ничего, руководителю — по-прежнему 5 %.
  const upsell = accrualsOf(project({ owner_staff_id: JUNIOR, kind: "upsell" }), [], earners);
  assert.equal(upsell.find((a) => a.staff_id === JUNIOR)?.amount_usd, 0);
  assert.equal(upsell.find((a) => a.staff_id === HEAD)?.amount_usd, 330);
});

test("менеджер без руководителя даёт одну строку", () => {
  const alone = new Map(earners);
  alone.set(MANAGER, { ...earners.get(MANAGER)!, head_staff_id: null });
  assert.equal(accrualsOf(project(), [], alone).length, 1);
});

test("свой клиент руководителя — 30 %, и второй строки нет", () => {
  const lines = accrualsOf(project({ owner_staff_id: HEAD }), [], earners);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].staff_id, HEAD);
  assert.equal(lines[0].percent, 30);
  assert.equal(lines[0].amount_usd, 1_980);
});

test("заморозка держится до полной оплаты", () => {
  const p = project();
  assert.equal(accrualState(p, 0), "frozen");
  assert.equal(accrualState(p, 5_000), "frozen");
  assert.equal(accrualState(p, 10_000), "earned");
  assert.equal(accrualState(p, 10_500), "earned");
  assert.equal(accrualState(project({ stage: "cancelled" }), 10_000), "void");
  // Проект без суммы или с нулевой не бывает «оплаченным».
  assert.equal(accrualState(project({ amount_usd: 0 }), 0), "frozen");
  assert.equal(accrualState(project({ amount_usd: null }), 0), "frozen");
});

test("отменённый проект и проект в минусе не начисляют ничего — никому", () => {
  const cancelled = accrualsOf(project({ stage: "cancelled" }), [{ project_id: "p1", amount_usd: 10_000 }], earners);
  assert.ok(cancelled.length === 2 && cancelled.every((a) => a.amount_usd === 0 && a.state === "void"));

  const loss = accrualsOf(project({ dev_cost_usd: 12_000 }), [], earners);
  assert.ok(loss.every((a) => a.amount_usd === 0));
});

test("проект без суммы или без ответственного не даёт строк", () => {
  assert.deepEqual(accrualsOf(project({ amount_usd: null }), [], earners), []);
  assert.deepEqual(accrualsOf(project({ owner_staff_id: null }), [], earners), []);
  assert.deepEqual(accrualsOf(project({ owner_staff_id: "ghost" }), [], earners), []);
  assert.equal(ownerShare(project({ amount_usd: null }), []), null);
});

test("баланс: заработано минус выплачено, заморозка отдельно, чужое не считается", () => {
  const accruals: Accrual[] = [
    { project_id: "a", staff_id: MANAGER, share: "owner", percent: 15, manual: false, amount_usd: 990, state: "earned" },
    { project_id: "b", staff_id: MANAGER, share: "owner", percent: 15, manual: false, amount_usd: 300, state: "frozen" },
    { project_id: "c", staff_id: MANAGER, share: "owner", percent: 15, manual: false, amount_usd: 100, state: "void" },
    { project_id: "d", staff_id: JUNIOR, share: "owner", percent: 10, manual: false, amount_usd: 500, state: "earned" },
  ];
  const payouts = [
    { staff_id: MANAGER, amount_usd: 400 },
    { staff_id: JUNIOR, amount_usd: 500 },
  ];

  const mine = balanceOf(MANAGER, accruals, payouts);
  assert.deepEqual(mine, { earned: 990, frozen: 300, paid_out: 400, due: 590 });
  assert.deepEqual(balanceOf(JUNIOR, accruals, payouts), { earned: 500, frozen: 0, paid_out: 500, due: 0 });
});

test("менеджер видит себя, руководитель — себя и команду, владелец — всех", () => {
  assert.equal(visibleStaff({ id: OWNER, role: "admin" }, []), "all");
  assert.deepEqual(visibleStaff({ id: HEAD, role: "head" }, [MANAGER, JUNIOR]), [HEAD, MANAGER, JUNIOR]);
  assert.deepEqual(visibleStaff({ id: MANAGER, role: "manager" }, [JUNIOR]), [MANAGER]);

  const me = { id: MANAGER, role: "manager" as const };
  assert.equal(canSeeMoney(me, project(), []), true);
  assert.equal(canSeeMoney(me, project({ owner_staff_id: JUNIOR }), []), false);
  assert.equal(canSeeMoney(me, project({ owner_staff_id: null }), []), false);
  assert.equal(canSeeMoney({ id: HEAD, role: "head" }, project({ owner_staff_id: JUNIOR }), [JUNIOR]), true);
});

test("менеджер правит деньги своего проекта только до первого платежа", () => {
  const me = { id: MANAGER, role: "manager" as const };
  assert.equal(canEditMoney(me, project(), 0), true);
  assert.equal(canEditMoney(me, project(), 1), false);
  assert.equal(canEditMoney(me, project({ stage: "done" }), 0), false);
  assert.equal(canEditMoney(me, project({ owner_staff_id: JUNIOR }), 0), false);
  // Руководитель чужое видит, но не правит; владелец правит всё.
  assert.equal(canEditMoney({ id: HEAD, role: "head" }, project(), 0), false);
  assert.equal(canEditMoney({ id: OWNER, role: "admin" }, project({ stage: "done" }), 10_000), true);
});

test("суммы из формы: пробелы допустимы, копейки, мусор и минус — нет", () => {
  assert.equal(parseUsd("12 500"), 12_500);
  assert.equal(parseUsd("0"), 0);
  assert.equal(parseUsd(""), null);
  assert.equal(parseUsd("-5"), null);
  assert.equal(parseUsd("12.50"), null);
  assert.equal(parseUsd("abc"), null);
  assert.equal(parsePercent("4"), 4);
  assert.equal(parsePercent("100"), 100);
  assert.equal(parsePercent("101"), null);
  assert.equal(parsePercent(""), null);
});

test("деньги печатаются по-русски, прочерк вместо пустой суммы", () => {
  assert.equal(money(12_500).replace(/ /g, " "), "12 500 $");
  assert.equal(money(null), "—");
});

test("владелец студии не получает начислений: его проект — целиком студии", async () => {
  const { earnersOf } = await import("@/lib/admin/finance");
  const map = earnersOf([
    { id: OWNER, role: "admin", grade: "manager", rate_percent: null, head_staff_id: null, founder_percent: 70 },
    { id: MANAGER, role: "manager", grade: "manager", rate_percent: null, head_staff_id: null, founder_percent: null },
  ]);
  assert.equal(map.has(OWNER), false);
  assert.equal(map.has(MANAGER), true);
  const own = project({ owner_staff_id: OWNER });
  assert.deepEqual(accrualsOf(own, [], map), []);
  assert.equal(ownerShare(own, []), 6_600);
});

test("владелец задаёт процент по конкретной сделке — только закреплённым", () => {
  // «Выставлять каждому % от конкретной сделки, только по закреплённым за
  // человеком»: ведущему и его руководителю. Посторонний в карте — не строка.
  const shares = new Map([
    [MANAGER, 20],
    [HEAD, 7],
    ["ghost", 50],
  ]);
  const lines = accrualsOf(project(), [], earners, shares);
  assert.equal(lines.length, 2, "посторонний не должен получить строку");

  const mine = lines.find((a) => a.staff_id === MANAGER)!;
  assert.equal(mine.percent, 20);
  assert.equal(mine.manual, true);
  assert.equal(mine.amount_usd, 1_320);

  const boss = lines.find((a) => a.staff_id === HEAD)!;
  assert.equal(boss.percent, 7);
  assert.equal(boss.manual, true);
  assert.equal(boss.amount_usd, 462);

  // Владельцу — остаток после налога, себестоимости и всех процентов.
  assert.equal(ownerShare(project(), lines), 6_600 - 1_320 - 462);

  // Без ручного процента строки помечены как «по грейду».
  assert.ok(accrualsOf(project(), [], earners).every((a) => a.manual === false));
});

test("процент по сделке важнее персональной ставки и грейда", () => {
  const custom = new Map(earners);
  custom.set(MANAGER, { ...earners.get(MANAGER)!, rate_percent: 12 });
  const byRate = accrualsOf(project(), [], custom).find((a) => a.staff_id === MANAGER)!;
  assert.equal(byRate.percent, 12);

  const byDeal = accrualsOf(project(), [], custom, new Map([[MANAGER, 25]])).find((a) => a.staff_id === MANAGER)!;
  assert.equal(byDeal.percent, 25);

  // Ноль — тоже ручной процент: сделка без доли, но со строкой, чтобы это было видно.
  const zero = accrualsOf(project(), [], earners, new Map([[MANAGER, 0]])).find((a) => a.staff_id === MANAGER)!;
  assert.equal(zero.percent, 0);
  assert.equal(zero.manual, true);
});

/**
 * Платёж клиента и выплату сотруднику записывает только владелец.
 *
 * 16 сентября вместе с проверкой расходов (их ведут оба соучредителя) по
 * ошибке ослабили и эти две: интерфейс рисовал формы только владельцу, а
 * сервер пускал и руководителя. Подтверждённый платёж размораживает
 * начисления, выплата гасит долг — такие записи делает один человек.
 */
test("платёж и выплату сервер принимает только от владельца", () => {
  const ledger = readFileSync(new URL("../lib/admin/ledger.ts", import.meta.url), "utf8");
  for (const fn of ["export async function addPayment(", "export async function recordPayout("]) {
    const body = ledger.slice(ledger.indexOf(fn), ledger.indexOf(fn) + 1200);
    assert.match(body, /if \(staff\.role !== "admin"\) return fail\("forbidden"\);/, fn);
    assert.doesNotMatch(body, /if \(!keepsExpenses\(staff\.role\)\)/, `${fn}: снова пускает руководителя`);
  }
  // А расход — по-прежнему оба соучредителя.
  const expense = ledger.slice(ledger.indexOf("export async function addExpense"));
  assert.match(expense.slice(0, 1200), /if \(!keepsExpenses\(staff\.role\)\) return fail\("forbidden"\);/);
});
