import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { agencyMoney, type AgencyMoneyProject } from "@/lib/partners/agency";
import {
  AGENCY_PERCENT,
  LIFETIME_BONUS,
  LIFETIME_FROM_USD,
  lifetimeOf,
  partnerAccrualOf,
  tierPercent,
  applyPool,
  type PartnerProject,
} from "@/lib/partners/rules";

/**
 * Пожизненный грейд — владелец, 05.11.2026: «Грейд +5% если совокупная
 * сумма заказов от агентства / блоггера превысит 50000$. Тогда будет 20%
 * пожизненно».
 */

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

let seq = 0;
function project(amount: number, extra: Partial<AgencyMoneyProject> = {}): AgencyMoneyProject {
  seq += 1;
  return {
    id: `p${seq}`,
    created_at: `2026-11-${String(seq).padStart(2, "0")}T10:00:00Z`,
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

const AGENCY = { id: "a", percent_override: null, kind: "agency" as const, brought_by: null, brought_at: null };
const BLOGGER = { id: "a", percent_override: null, kind: "person" as const };
const paid = (ps: PartnerProject[]) => ps.map((p) => ({ project_id: p.id, amount_usd: p.amount_usd ?? 0 }));

test("порог — 50 000 $ заказов, надбавка +5 навсегда", () => {
  assert.equal(LIFETIME_FROM_USD, 50_000);
  assert.equal(LIFETIME_BONUS, 5);
  assert.equal(AGENCY_PERCENT + LIFETIME_BONUS, 20, "агентству — 20%");
});

test("надбавка — на проекты после порога; проект, которым перешагнули, — по старой ставке", () => {
  const a = project(30_000);
  const b = project(25_000); // 55 000 $ — перешагнул
  const c = project(4_000);
  const d = project(1_000);
  const life = lifetimeOf("a", [d, c, b, a]); // порядок — по дате заведения, не по массиву
  assert.equal(life.total, 60_000);
  assert.equal(life.reached, true);
  assert.equal(life.left, 0);
  assert.deepEqual([...life.boosted].sort(), [c.id, d.id].sort());
});

test("ровно 50 000 $ — следующий проект уже с надбавкой", () => {
  const a = project(50_000);
  const b = project(1_000);
  const life = lifetimeOf("a", [a, b]);
  assert.ok(!life.boosted.has(a.id));
  assert.ok(life.boosted.has(b.id));
});

test("отменённые, аннулированные и чужие проекты в сумму не идут", () => {
  const ps = [
    project(40_000, { stage: "cancelled" }),
    project(40_000, { partner_void_reason: "self" }),
    project(40_000, { partner_id: "other" }),
    project(10_000),
  ];
  const life = lifetimeOf("a", ps);
  assert.equal(life.total, 10_000);
  assert.equal(life.reached, false);
  assert.equal(life.left, 40_000);
  assert.equal(life.boosted.size, 0);
});

test("агентство: 15% до порога, 20% после — и деньги по 20%", () => {
  const ps = [project(30_000), project(25_000), project(10_000)];
  const lines = ps.map((p) => partnerAccrualOf(p, paid(ps), AGENCY, ps));
  assert.deepEqual(
    lines.map((l) => l?.percent),
    [AGENCY_PERCENT, AGENCY_PERCENT, AGENCY_PERCENT + LIFETIME_BONUS],
  );
  assert.equal(lines[2]?.amount_usd, 2_000);
  assert.equal(lines[2]?.lifetime, true);
  assert.equal(lines[0]?.lifetime, undefined);

  const m = agencyMoney(AGENCY, ps, paid(ps));
  assert.equal(m.lifetime.reached, true);
  assert.equal(m.agency.earned, 4_500 + 3_750 + 2_000);
});

test("без истории надбавки нет", () => {
  const ps = [project(60_000), project(10_000)];
  assert.equal(partnerAccrualOf(ps[1], [], AGENCY, [])?.percent, AGENCY_PERCENT);
});

test("блогер: +5 к ступени его модели", () => {
  const ps = [project(55_000), project(4_000), project(4_000, { partner_model: "profit" })];
  const turnover = partnerAccrualOf(ps[1], [], BLOGGER, ps);
  const profit = partnerAccrualOf(ps[2], [], BLOGGER, ps);
  assert.equal(turnover?.percent, tierPercent(4_000, "turnover") + LIFETIME_BONUS);
  assert.equal(profit?.percent, tierPercent(4_000, "profit") + LIFETIME_BONUS);
});

test("процент владельца на проекте — без надбавки, личная ставка — с надбавкой", () => {
  const ps = [project(55_000), project(4_000, { partner_percent: 12 }), project(4_000)];
  assert.equal(partnerAccrualOf(ps[1], [], BLOGGER, ps)?.percent, 12, "процент на проекте главнее");
  // Владелец, 06.11.2026: «10% с оборота + … 50000$ … становится 15% бессрочно».
  assert.equal(
    partnerAccrualOf(ps[2], [], { ...BLOGGER, percent_override: 10 }, ps)?.percent,
    10 + LIFETIME_BONUS,
    "личная ставка 10% после порога — 15%",
  );
  // До порога личная ставка как есть.
  const early = [project(20_000), project(4_000)];
  assert.equal(partnerAccrualOf(early[1], [], { ...BLOGGER, percent_override: 10 }, early)?.percent, 10);
  // У агентства персональной ставки нет — надбавка идёт.
  assert.equal(
    partnerAccrualOf(ps[2], [], { ...AGENCY, percent_override: 9 }, ps)?.percent,
    AGENCY_PERCENT + LIFETIME_BONUS,
  );
});

test("копилка не съедает надбавку: ступень копилки + 5", () => {
  const ps = [project(55_000, { partner_payout_id: "po1" }), project(3_000), project(3_000)];
  const partner = { ...BLOGGER, accumulate: true };
  const base = ps.map((p) => partnerAccrualOf(p, paid(ps), partner, ps)).filter((a) => a !== null);
  const pooled = applyPool(base, ps, partner);
  const line = pooled.find((a) => a.project_id === ps[2].id);
  assert.equal(line?.percent, tierPercent(6_000, "turnover") + LIFETIME_BONUS);
  assert.equal(line?.lifetime, true);
});

test("все места, где считаются деньги партнёра, передают историю", () => {
  assert.match(read("lib/partners/store.ts"), /partnerAccrualOf\(p, payments, partner, history\)/);
  assert.match(read("lib/partners/store.ts"), /partnerHistory\(ids\)/);
  assert.match(read("lib/partners/agency.ts"), /partnerAccrualOf\(project, payments, agency, projects\)/);
  assert.match(read("app/admin/finance/page.tsx"), /partnerAccrualOf\(p, ledger\.payments, partner, history\)/);
  assert.match(read("app/admin/projects/[id]/page.tsx"), /partnerHistory\(\[partner\.id\]\)/);
  assert.match(read("lib/partners/attribute.ts"), /lifetimeOf\(ownAgency\.id/);
});

test("на сайте у агентства — итоговые 20%, а не «+5%»", () => {
  const page = read("app/[locale]/partners/deck/agency/page.tsx");
  assert.match(page, /t\.lifetime\(usd\(locale, LIFETIME_FROM_USD\), AGENCY_PERCENT \+ LIFETIME_BONUS\)/);
  assert.ok(!/\+\{LIFETIME_BONUS\}/.test(page), "на странице агентства «+5»");
  assert.match(read("app/[locale]/partners/deck/program/page.tsx"), /t\.gradesLifetime\(/);
  assert.match(read("components/partners/cabinet-view.tsx"), /t\.lifetimeLeft\(/);
});
