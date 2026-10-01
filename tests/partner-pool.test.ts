import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  nextPoolTier,
  partnerAccrualOf,
  partnerBalanceOf,
  poolAmount,
  poolProjects,
  withPool,
  type PartnerProject,
} from "@/lib/partners/rules";

/**
 * Копилка — владелец, 01.10: «Если партнёр не забирает деньги сразу, то по
 * той же таблице от — до он может получить по достижению тех сумм тот %,
 * который указан… отдельным тумблером „не забирать в автоматическом
 * режиме“».
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

function project(id: string, amount: number, extra: Partial<PartnerProject> = {}): PartnerProject {
  return {
    id,
    owner_staff_id: null,
    kind: "new",
    amount_usd: amount,
    tax_percent: 0,
    dev_cost_usd: 0,
    stage: "work",
    partner_id: "a",
    partner_percent: null,
    partner_void_reason: null,
    partner_model: "turnover",
    ...extra,
  };
}

const paidFull = (ps: PartnerProject[]) => ps.map((p) => ({ project_id: p.id, amount_usd: p.amount_usd ?? 0 }));

function accrue(ps: PartnerProject[], partner: { id: string; percent_override: number | null; accumulate?: boolean }, payments = paidFull(ps)) {
  const base = ps.map((p) => partnerAccrualOf(p, payments, partner)).filter((a) => a !== null);
  return withPool(base, ps, partner);
}

test("три проекта по 2 000 $ в копилке — ступень 6 000 $ для всех трёх", () => {
  const ps = [project("p1", 2000), project("p2", 2000), project("p3", 2000)];
  const off = accrue(ps, { id: "a", percent_override: null, accumulate: false });
  assert.deepEqual(off.map((a) => a.percent), [6, 6, 6], "без тумблера — ступень каждого проекта");
  assert.equal(partnerBalanceOf(off, []).earned, 360);

  const on = accrue(ps, { id: "a", percent_override: null, accumulate: true });
  assert.deepEqual(on.map((a) => a.percent), [14, 14, 14], "с тумблером — ступень общей суммы (до 10 000 $ — 14 % с оборота)");
  assert.ok(on.every((a) => a.boosted));
  assert.equal(partnerBalanceOf(on, []).earned, 840);
});

test("ставка копилки не ниже обычной; профит и оборот — каждый по своей колонке", () => {
  const ps = [project("big", 12000), project("small", 1000, { partner_model: "profit" })];
  const on = accrue(ps, { id: "a", percent_override: null, accumulate: true });
  // 13 000 $ — ступень «до 30 000 $»: 17 % с оборота, 25 % от прибыли.
  assert.equal(on.find((a) => a.project_id === "big")?.percent, 17);
  assert.equal(on.find((a) => a.project_id === "small")?.percent, 25);
});

test("в копилке — только оплаченные целиком и ещё не выплаченные проекты", () => {
  const ps = [project("paid", 2000), project("half", 4000), project("done", 6000, { partner_payout_id: "po1" })];
  const payments = [
    { project_id: "paid", amount_usd: 2000 },
    { project_id: "half", amount_usd: 1000 },
    { project_id: "done", amount_usd: 6000 },
  ];
  const partner = { id: "a", percent_override: null, accumulate: true };
  const base = ps.map((p) => partnerAccrualOf(p, payments, partner)).filter((a) => a !== null);
  const pool = poolProjects(ps, base, partner);
  assert.deepEqual(pool.map((p) => p.id), ["paid"]);
  assert.equal(poolAmount(pool), 2000);
  const on = withPool(base, ps, partner);
  assert.equal(on.find((a) => a.project_id === "paid")?.percent, 6, "2 000 $ — первая ступень, повышать нечего");
});

test("ручной процент и личная ставка в копилке не участвуют", () => {
  const ps = [project("p1", 3000), project("p2", 3000, { partner_percent: 5 })];
  const on = accrue(ps, { id: "a", percent_override: null, accumulate: true });
  assert.equal(on.find((a) => a.project_id === "p2")?.percent, 5);
  assert.equal(on.find((a) => a.project_id === "p1")?.percent, 10, "в копилке только p1 — 3 000 $");
  const personal = accrue([project("p1", 3000), project("p3", 9000)], { id: "a", percent_override: 8, accumulate: true });
  assert.deepEqual(personal.map((a) => a.percent), [8, 8]);
});

test("выплаченное по ставке копилки вниз не пересчитывается", () => {
  const settled = project("p1", 2000, { partner_payout_id: "po1", partner_bonus_percent: 14 });
  const a = partnerAccrualOf(settled, paidFull([settled]), { id: "a", percent_override: null });
  assert.equal(a?.percent, 14);
  assert.equal(a?.amount_usd, 280);
  assert.ok(a?.boosted);
  // Процент, заданный владельцем на проекте, важнее зафиксированного.
  const manual = partnerAccrualOf({ ...settled, partner_percent: 3 }, paidFull([settled]), { id: "a", percent_override: null });
  assert.equal(manual?.percent, 3);
});

test("до следующей ступени — сколько ещё и какой процент", () => {
  assert.deepEqual(nextPoolTier(6000, "turnover"), { at: 10001, percent: 17 });
  assert.deepEqual(nextPoolTier(0, "profit"), { at: 2501, percent: 15 });
  assert.equal(nextPoolTier(40000, "profit"), null);
});

test("с копилкой автовыплаты нет, выплата фиксирует ставку, отказ возвращает в копилку", () => {
  const store = read("lib/partners/store.ts");
  assert.match(store, /partner\.status !== "active" \|\| partner\.accumulate\) return null;/, "автовыплата идёт и с копилкой");
  assert.match(store, /filter\(\(p\) => p\.status === "active" && !p\.accumulate\)/, "свип заводит автовыплаты копилке");
  assert.match(store, /await settleProjects\(summary, String\(data\.id\)\);/, "заявка не закрывает копилку");
  assert.match(store, /partner_bonus_percent: a\.boosted \? a\.percent : null/);
  assert.match(store, /update\(\{ partner_payout_id: null, partner_bonus_percent: null \}\)\.eq\("partner_payout_id", payoutId\)/);
  assert.match(read("supabase/migrations/0075_partner_pool.sql"), /add column if not exists accumulate boolean not null default false/);
});

test("тумблер в кабинете — после проверки входа", () => {
  const actions = read("app/[locale]/partners/cabinet/actions.ts");
  const body = actions.slice(actions.indexOf("export async function setAccumulateAction("));
  assert.match(body, /const partner = await currentPartner\(\);\s*if \(!partner\) redirect/);
  assert.match(read("components/partners/cabinet-view.tsx"), /role="switch"/);
});
