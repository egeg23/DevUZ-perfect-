import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MIN_PAYOUT_USD,
  PARTNER_TIERS,
  canWithdrawNow,
  codeFromQuery,
  codeFromStart,
  firstBusinessDay,
  generateCode,
  isTrc20,
  normalizeCode,
  partnerAccrualOf,
  partnerBalanceOf,
  partnerPercent,
  perkPercent,
  tierPercent,
  agencyMatches,
  canSwitchModel,
  companyKey,
  contactKey,
  nextModelSwitch,
  MODEL_SWITCH_DAYS,
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

test("две модели: от прибыли 10–30 %, с оборота 6–20 %, пороги одни и те же", () => {
  // Владелец, 28.09: «первая, где 30 %, — от чистой прибыли… на оборотном
  // другой %: 6, 10, 14, 17, 20».
  const cases: [number, number, number][] = [
    [0, 10, 6], [2_500, 10, 6],
    [2_501, 15, 10], [5_000, 15, 10],
    [5_001, 20, 14], [10_000, 20, 14],
    [10_001, 25, 17], [30_000, 25, 17],
    [30_001, 30, 20], [250_000, 30, 20],
  ];
  for (const [amount, profit, turnover] of cases) {
    assert.equal(tierPercent(amount, "profit"), profit, `${amount} $ от прибыли`);
    assert.equal(tierPercent(amount, "turnover"), turnover, `${amount} $ с оборота`);
  }
  assert.deepEqual(PARTNER_TIERS.map((t) => t.profit), [10, 15, 20, 25, 30]);
  assert.deepEqual(PARTNER_TIERS.map((t) => t.turnover), [6, 10, 14, 17, 20]);

  // Персональная и по проекту — важнее ступени любой модели.
  assert.equal(partnerPercent({ projectPercent: null, partnerOverride: null, amountUsd: 7_000, model: "turnover" }), 14);
  assert.equal(partnerPercent({ projectPercent: null, partnerOverride: 12, amountUsd: 7_000, model: "turnover" }), 12);
  assert.equal(partnerPercent({ projectPercent: 5, partnerOverride: 12, amountUsd: 7_000 }), 5);
  // Модель не выбрана — «от прибыли»; суммы нет — первая ступень.
  assert.equal(partnerPercent({ projectPercent: null, partnerOverride: null, amountUsd: null }), 10);
});

test("от прибыли — процент от чистой прибыли, с оборота — от суммы; заморожено до полной оплаты", () => {
  // 10 000 − 4 % налога − 3 000 себестоимости = 6 600; ступень 20 % → 1 320.
  const profit = partnerAccrualOf(project(), [], PARTNER);
  assert.ok(profit);
  assert.equal(profit.model, "profit");
  assert.equal(profit.percent, 20);
  assert.equal(profit.amount_usd, 1_320);
  assert.equal(profit.state, "frozen");

  // Та же сумма с оборота: ступень 14 % от 10 000 → 1 400.
  const turnover = partnerAccrualOf(project({ partner_model: "turnover" }), [], PARTNER);
  assert.equal(turnover?.model, "turnover");
  assert.equal(turnover?.percent, 14);
  assert.equal(turnover?.amount_usd, 1_400);

  const earned = partnerAccrualOf(project(), [{ project_id: "pr1", amount_usd: 10_000 }], PARTNER);
  assert.equal(earned?.state, "earned");

  // Крупный проект: 40 000 − 4 % − 3 000 = 35 400 × 30 % = 10 620; с оборота 20 % = 8 000.
  assert.equal(partnerAccrualOf(project({ amount_usd: 40_000 }), [], PARTNER)?.amount_usd, 10_620);
  assert.equal(partnerAccrualOf(project({ amount_usd: 40_000, partner_model: "turnover" }), [], PARTNER)?.amount_usd, 8_000);
  // Минус по проекту — забота студии, партнёру ноль, а не долг.
  assert.equal(partnerAccrualOf(project({ dev_cost_usd: 12_000 }), [], PARTNER)?.amount_usd, 0);
});

test("модель меняется не чаще раза в неделю", () => {
  const changed = new Date("2026-09-20T10:00:00Z");
  assert.equal(canSwitchModel(null), true, "ни разу не меняли — можно");
  assert.equal(canSwitchModel(changed, new Date("2026-09-27T09:59:00Z")), false);
  assert.equal(canSwitchModel(changed, new Date("2026-09-27T10:00:00Z")), true);
  assert.equal(nextModelSwitch(changed, new Date("2026-09-22T00:00:00Z"))?.toISOString(), "2026-09-27T10:00:00.000Z");
  assert.equal(nextModelSwitch(null), null);
  assert.equal(MODEL_SWITCH_DAYS, 7);
});

test("процент по проекту, заданный владельцем, помечен как ручной", () => {
  const line = partnerAccrualOf(project({ partner_percent: 15 }), [], PARTNER);
  assert.equal(line?.percent, 15);
  assert.equal(line?.manual, true);
  assert.equal(line?.amount_usd, 990);
});

test("чужой проект, проект без суммы и аннулированный не дают денег", () => {
  assert.equal(partnerAccrualOf(project({ partner_id: "other" }), [], PARTNER), null);
  assert.equal(partnerAccrualOf(project({ partner_id: null }), [], PARTNER), null);
  assert.equal(partnerAccrualOf(project({ amount_usd: null }), [], PARTNER), null);

  const voided = partnerAccrualOf(
    project({ partner_void_reason: "self" }),
    [{ project_id: "pr1", amount_usd: 10_000 }],
    PARTNER,
  );
  assert.equal(voided?.state, "void");
  assert.equal(voided?.amount_usd, 0);
  assert.equal(voided?.void_reason, "self");
});

test("заказ агентства узнаётся по контакту или названию, короткое имя не считается", () => {
  const agency = { contact: "@Reklama_Pro", name: "Reklama Pro Agency" };
  assert.equal(agencyMatches(agency, { contactHandle: "https://t.me/reklama_pro", company: null }), true);
  assert.equal(agencyMatches(agency, { contactHandle: "reklama_pro", company: null }), true);
  assert.equal(agencyMatches(agency, { contactHandle: null, company: "«Reklama Pro»" }), true);
  assert.equal(agencyMatches(agency, { contactHandle: "@other", company: "Other LLC" }), false);
  // Телефон — по последним девяти цифрам, как бы ни был записан.
  assert.equal(
    agencyMatches({ contact: "+998 90 123-45-67", name: "X" }, { contactHandle: "90 123 45 67", company: null }),
    true,
  );
  // Короткое название совпало бы с половиной города.
  assert.equal(agencyMatches({ contact: null, name: "Art" }, { contactHandle: null, company: "Art" }), false);
  assert.equal(contactKey("MAIL@Agency.uz"), "mail@agency.uz");
  assert.equal(companyKey("ООО «Media Hub»"), "media hub");
});

test("баланс: доступно = заработано − выплачено − в заявках; отклонённые не считаются", () => {
  const line = (id: string, amount: number, state: PartnerAccrual["state"]): PartnerAccrual => ({
    project_id: id, partner_id: "p1", model: "profit", percent: 20, manual: false, amount_usd: amount, state, void_reason: null,
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
