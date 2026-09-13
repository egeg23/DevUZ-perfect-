import assert from "node:assert/strict";
import { test } from "node:test";

import {
  accrualState,
  accrualsOf,
  balancesOf,
  canEditDeal,
  money,
  ownerShare,
  parseAmount,
  profitOf,
  ratePercent,
  visibleStaff,
  type Accrual,
  type DealMoney,
  type Earner,
} from "@/lib/admin/finance";

/**
 * Правила владельца, записанные числами. Каждый тест — одно правило: если
 * правило изменится, изменится ровно один тест, а не пять.
 */

const OWNER = "egor";
const HEAD = "alex";
const MANAGER = "dilnoza";
const JUNIOR = "timur";

const earners = new Map<string, Earner>([
  [HEAD, { id: HEAD, grade: "head", rate_override: null, head_staff_id: null }],
  [MANAGER, { id: MANAGER, grade: "manager", rate_override: null, head_staff_id: HEAD }],
  [JUNIOR, { id: JUNIOR, grade: "junior", rate_override: null, head_staff_id: HEAD }],
]);

function deal(over: Partial<DealMoney> = {}): DealMoney {
  return {
    id: "d1",
    owner_staff_id: MANAGER,
    kind: "new",
    currency: "UZS",
    amount: 10_000_000,
    tax_percent: 4,
    dev_cost: 3_000_000,
    status: "open",
    ...over,
  };
}

test("ставки по грейду: 10 / 15 / 30, допродажа менеджеру — плюс 5", () => {
  assert.equal(ratePercent({ grade: "junior", rate_override: null }, "new"), 10);
  assert.equal(ratePercent({ grade: "manager", rate_override: null }, "new"), 15);
  assert.equal(ratePercent({ grade: "manager", rate_override: null }, "upsell"), 20);
  assert.equal(ratePercent({ grade: "head", rate_override: null }, "new"), 30);
  // Допродажа не меняет ставку младшему и руководителю — им она не обещана.
  assert.equal(ratePercent({ grade: "junior", rate_override: null }, "upsell"), 10);
  assert.equal(ratePercent({ grade: "head", rate_override: null }, "upsell"), 30);
});

test("персональная ставка перекрывает грейдовую целиком", () => {
  assert.equal(ratePercent({ grade: "manager", rate_override: 12 }, "new"), 12);
  assert.equal(ratePercent({ grade: "manager", rate_override: 12 }, "upsell"), 12);
});

test("чистая прибыль — сумма минус налог минус себестоимость", () => {
  // 10 000 000 − 4 % (400 000) − 3 000 000 = 6 600 000
  assert.equal(profitOf(deal()), 6_600_000);
  // Минус — тоже ответ, а не ошибка.
  assert.equal(profitOf(deal({ dev_cost: 12_000_000 })), -2_400_000);
});

test("начисление менеджеру — ставка от прибыли, владельцу — остальное", () => {
  const [mine] = accrualsOf(deal(), [], earners);
  assert.equal(mine.staff_id, MANAGER);
  assert.equal(mine.percent, 15);
  assert.equal(mine.amount, 990_000);
  assert.equal(ownerShare(deal(), [mine]), 5_610_000);
});

test("руководитель со сделок своих менеджеров пока не получает ничего", () => {
  // Владелец назвал только «30 %, если это его клиент». Пока не ответил про
  // сделки команды — второй строки быть не должно.
  const lines = accrualsOf(deal(), [], earners);
  assert.equal(lines.length, 1);
  assert.ok(!lines.some((a) => a.staff_id === HEAD));
});

test("свой клиент руководителя — 30 %", () => {
  const [mine] = accrualsOf(deal({ owner_staff_id: HEAD }), [], earners);
  assert.equal(mine.staff_id, HEAD);
  assert.equal(mine.percent, 30);
  assert.equal(mine.amount, 1_980_000);
});

test("заморозка держится до полной оплаты", () => {
  const d = deal();
  assert.equal(accrualState(d, 0), "frozen");
  assert.equal(accrualState(d, 5_000_000), "frozen");
  assert.equal(accrualState(d, 10_000_000), "earned");
  assert.equal(accrualState(d, 10_500_000), "earned");
  assert.equal(accrualState(deal({ status: "cancelled" }), 10_000_000), "void");
  // Пустая сделка не бывает «оплаченной».
  assert.equal(accrualState(deal({ amount: 0 }), 0), "frozen");
});

test("отменённая сделка и сделка в минусе не начисляют ничего", () => {
  const [cancelled] = accrualsOf(deal({ status: "cancelled" }), [{ deal_id: "d1", amount: 10_000_000 }], earners);
  assert.equal(cancelled.amount, 0);
  assert.equal(cancelled.state, "void");

  const [loss] = accrualsOf(deal({ dev_cost: 12_000_000 }), [], earners);
  assert.equal(loss.amount, 0);
});

test("сделка без владельца в базе не роняет расчёт", () => {
  assert.deepEqual(accrualsOf(deal({ owner_staff_id: "ghost" }), [], earners), []);
});

test("баланс: заработано минус выплачено, по каждой валюте отдельно", () => {
  const accruals: Accrual[] = [
    { deal_id: "a", staff_id: MANAGER, share: "owner", percent: 15, amount: 990_000, currency: "UZS", state: "earned" },
    { deal_id: "b", staff_id: MANAGER, share: "owner", percent: 15, amount: 300_000, currency: "UZS", state: "frozen" },
    { deal_id: "c", staff_id: MANAGER, share: "owner", percent: 15, amount: 150, currency: "USD", state: "earned" },
    { deal_id: "d", staff_id: JUNIOR, share: "owner", percent: 10, amount: 500_000, currency: "UZS", state: "earned" },
  ];
  const payouts = [
    { staff_id: MANAGER, amount: 400_000, currency: "UZS" as const },
    { staff_id: JUNIOR, amount: 500_000, currency: "UZS" as const },
  ];

  const [usd, uzs] = balancesOf(MANAGER, accruals, payouts);
  assert.equal(uzs.currency, "UZS");
  assert.equal(uzs.earned, 990_000);
  assert.equal(uzs.frozen, 300_000);
  assert.equal(uzs.paid_out, 400_000);
  assert.equal(uzs.due, 590_000);
  assert.equal(usd.currency, "USD");
  assert.equal(usd.due, 150);

  // Чужие выплаты в баланс не попадают.
  const [junior] = balancesOf(JUNIOR, accruals, payouts);
  assert.equal(junior.due, 0);
});

test("менеджер видит себя, руководитель — себя и команду, владелец — всех", () => {
  assert.equal(visibleStaff({ id: OWNER, role: "admin" }, []), "all");
  assert.deepEqual(visibleStaff({ id: HEAD, role: "head" }, [MANAGER, JUNIOR]), [HEAD, MANAGER, JUNIOR]);
  assert.deepEqual(visibleStaff({ id: MANAGER, role: "manager" }, [JUNIOR]), [MANAGER]);
});

test("менеджер правит свою сделку только до первого платежа", () => {
  const me = { id: MANAGER, role: "manager" as const };
  assert.equal(canEditDeal(me, deal(), 0), true);
  assert.equal(canEditDeal(me, deal(), 1), false);
  assert.equal(canEditDeal(me, deal({ status: "done" }), 0), false);
  assert.equal(canEditDeal(me, deal({ owner_staff_id: JUNIOR }), 0), false);
  // Руководитель чужое видит, но не правит; владелец правит всё.
  assert.equal(canEditDeal({ id: HEAD, role: "head" }, deal(), 0), false);
  assert.equal(canEditDeal({ id: OWNER, role: "admin" }, deal({ status: "done" }), 10_000_000), true);
});

test("суммы из формы: пробелы и запятая допустимы, мусор и минус — нет", () => {
  assert.equal(parseAmount("12 500 000"), 12_500_000);
  assert.equal(parseAmount("1200,50"), 1200.5);
  assert.equal(parseAmount(""), null);
  assert.equal(parseAmount("-5"), null);
  assert.equal(parseAmount("abc"), null);
});

test("деньги печатаются по-русски, с валютой", () => {
  assert.equal(money(12_500_000, "UZS").replace(/ /g, " "), "12 500 000 сум");
  assert.equal(money(1200.5, "USD").replace(/ /g, " "), "1 200,5 $");
});
