import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MIN_PAYOUT_USD,
  PARTNER_PERCENT,
  PROVEN_PERCENT,
  canWithdrawNow,
  codeFromQuery,
  codeFromStart,
  firstBusinessDay,
  generateCode,
  isProven,
  isTrc20,
  normalizeCode,
  partnerAccrualOf,
  partnerBalanceOf,
  partnerPercent,
  perkPercent,
  validCode,
  validRequisites,
  voidReason,
  withdrawOpens,
  type PartnerAccrual,
  type PartnerProject,
} from "@/lib/partners/rules";

/**
 * Правила рефералки, перенесённые с seller ai. Каждый тест — одно правило.
 */

const PARTNER = { id: "p1", percent_override: null as number | null };

function project(over: Partial<PartnerProject> = {}): PartnerProject {
  return {
    id: "pr1",
    owner_staff_id: "m1",
    kind: "new",
    amount_usd: 10_000,
    tax_percent: 4,
    dev_cost_usd: 3_000,
    stage: "build",
    partner_id: "p1",
    partner_percent: null,
    partner_void_reason: null,
    ...over,
  };
}

test("ставка: 20 % база, 25 % прокачанному, персональная и по проекту — важнее", () => {
  assert.equal(partnerPercent({ projectPercent: null, partnerOverride: null, proven: false }), PARTNER_PERCENT);
  assert.equal(partnerPercent({ projectPercent: null, partnerOverride: null, proven: true }), PROVEN_PERCENT);
  assert.equal(partnerPercent({ projectPercent: null, partnerOverride: 30, proven: true }), 30);
  assert.equal(partnerPercent({ projectPercent: 10, partnerOverride: 30, proven: true }), 10);
  // Прокачка — за оплаченные проекты, не за регистрации.
  assert.equal(isProven(2), false);
  assert.equal(isProven(3), true);
});

test("начисление — процент от чистой прибыли, заморожено до полной оплаты", () => {
  // 10 000 − 4 % − 3 000 = 6 600; 20 % = 1 320
  const frozen = partnerAccrualOf(project(), [], PARTNER, false);
  assert.ok(frozen);
  assert.equal(frozen.amount_usd, 1_320);
  assert.equal(frozen.state, "frozen");
  assert.equal(frozen.manual, false);

  const earned = partnerAccrualOf(project(), [{ project_id: "pr1", amount_usd: 10_000 }], PARTNER, true);
  assert.equal(earned?.amount_usd, 1_650);
  assert.equal(earned?.state, "earned");
});

test("процент по проекту, заданный владельцем, помечен как ручной", () => {
  const line = partnerAccrualOf(project({ partner_percent: 15 }), [], PARTNER, false);
  assert.equal(line?.percent, 15);
  assert.equal(line?.manual, true);
  assert.equal(line?.amount_usd, 990);
});

test("чужой проект, проект без суммы и аннулированный не дают денег", () => {
  assert.equal(partnerAccrualOf(project({ partner_id: "other" }), [], PARTNER, false), null);
  assert.equal(partnerAccrualOf(project({ partner_id: null }), [], PARTNER, false), null);
  assert.equal(partnerAccrualOf(project({ amount_usd: null }), [], PARTNER, false), null);

  const voided = partnerAccrualOf(
    project({ partner_void_reason: "self" }),
    [{ project_id: "pr1", amount_usd: 10_000 }],
    PARTNER,
    false,
  );
  assert.equal(voided?.state, "void");
  assert.equal(voided?.amount_usd, 0);
  assert.equal(voided?.void_reason, "self");

  // Минус по проекту — забота студии, не партнёра.
  assert.equal(partnerAccrualOf(project({ dev_cost_usd: 12_000 }), [], PARTNER, false)?.amount_usd, 0);
});

test("баланс: доступно = заработано − выплачено − в заявках; отклонённые не считаются", () => {
  const line = (id: string, amount: number, state: PartnerAccrual["state"]): PartnerAccrual => ({
    project_id: id, partner_id: "p1", percent: 20, manual: false, amount_usd: amount, state, void_reason: null,
  });
  const balance = partnerBalanceOf(
    [line("a", 1_000, "earned"), line("b", 500, "earned"), line("c", 300, "frozen"), line("d", 200, "void")],
    [
      { status: "paid", amount_usd: 400 },
      { status: "requested", amount_usd: 300 },
      { status: "rejected", amount_usd: 9_999 },
    ],
  );
  assert.deepEqual(balance, { earned: 1_500, frozen: 300, requested: 300, paid: 400, available: 800 });
  assert.ok(MIN_PAYOUT_USD > 0);
});

test("коды: форма, регистр, зарезервированные, генератор без похожих символов", () => {
  assert.equal(normalizeCode("  ivan-2026 "), "IVAN-2026");
  assert.equal(validCode("IVAN-2026"), true);
  assert.equal(validCode("IV"), false, "короче трёх");
  assert.equal(validCode("ИВАН"), false, "кириллица");
  assert.equal(validCode("ADMIN"), false, "зарезервирован");
  assert.equal(validCode("DEVUZ"), false, "зарезервирован");

  const seq = [0, 0.5, 0.999, 0.25, 0.75, 0.1, 0.9];
  let i = 0;
  const code = generateCode(() => seq[i++ % seq.length]);
  assert.equal(code.length, 7);
  assert.match(code, /^[A-HJ-NP-Z2-9]+$/, "в коде похожие символы");
  assert.equal(validCode(code), true);
});

test("код из /start и из адреса — только своей формы", () => {
  assert.equal(codeFromStart("ref_ivan-2026"), "IVAN-2026");
  assert.equal(codeFromStart("ref_"), null);
  assert.equal(codeFromStart("abc123"), null, "токен разговора — не код");
  assert.equal(codeFromStart("order_xyz"), null);
  assert.equal(codeFromQuery("ivan"), "IVAN");
  assert.equal(codeFromQuery("<script>"), null);
  assert.equal(codeFromQuery(42), null);
});

test("вывод открыт с первого рабочего дня месяца", () => {
  // Октябрь 2026 начинается в четверг, ноябрь — в воскресенье, август — в субботу.
  assert.equal(firstBusinessDay(2026, 10), 1);
  assert.equal(firstBusinessDay(2026, 11), 2);
  assert.equal(firstBusinessDay(2026, 8), 3);

  // 1 ноября 2026, полдень по Ташкенту — воскресенье, окно ещё закрыто.
  assert.equal(canWithdrawNow(new Date("2026-11-01T07:00:00Z")), false);
  assert.equal(withdrawOpens(new Date("2026-11-01T07:00:00Z")), "02.11");
  // 2 ноября — открыто, и дальше весь месяц.
  assert.equal(canWithdrawNow(new Date("2026-11-02T07:00:00Z")), true);
  assert.equal(canWithdrawNow(new Date("2026-11-25T07:00:00Z")), true);
});

test("антифрод: сам себя, уже был у студии, заблокирован", () => {
  const base = {
    partnerStatus: "active" as const,
    partnerTelegramId: 100,
    partnerUsername: "Ivan",
    leadTelegramId: null,
    leadHandle: null,
    existingClient: false,
  };
  assert.equal(voidReason(base), null);
  assert.equal(voidReason({ ...base, leadTelegramId: 100 }), "self");
  assert.equal(voidReason({ ...base, leadHandle: "@ivan" }), "self");
  assert.equal(voidReason({ ...base, existingClient: true }), "existing_client");
  assert.equal(voidReason({ ...base, partnerStatus: "blocked", existingClient: true }), "blocked");
  // Разные люди — засчитывается.
  assert.equal(voidReason({ ...base, leadTelegramId: 200, leadHandle: "@petr" }), null);
});

test("реквизиты: TRC-20 или хотя бы восемь символов словами", () => {
  assert.equal(isTrc20("TN4yZbJJc2Xb3rD5DqhqQ8GdCd8YtKxZ1a"), true);
  assert.equal(isTrc20("TN4yZbJJc2Xb3rD5DqhqQ8GdCd8YtKxZ1"), false, "33 символа");
  assert.equal(isTrc20("0x1234567890abcdef"), false);
  assert.equal(validRequisites("Humo 9860 1234 5678 9012"), true);
  assert.equal(validRequisites("карта"), false);
  assert.equal(perkPercent("disc_10"), 10);
  assert.equal(perkPercent("none"), 0);
});
