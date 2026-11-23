/**
 * Лидогенерация в панели: 25% ведущему от дохода студии, ручной лид
 * «Лидогенерация», статус и ступени после оплаты — только владелец и
 * руководитель.
 *
 * Владелец, 23.11.2026: «Менеджеры получают 25% от дохода студии (пришла
 * сумма = себестоимость и налоги 7%), от оставшейся суммы 25% идет
 * менеджеру»; на «7% от всей пришедшей суммы» — «Да, верно, и в финансах
 * тоже пропиши и сделай добавление Лида в ручную "лидогенерации", этапы и
 * статусы они могут проставлять до оплаты, после оплаты уже я или Александр
 * меняем».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { leadAddDict } from "@/content/admin-panel/lead-add";
import {
  LEADGEN_MANAGER_PERCENT,
  LEADGEN_TAX_PERCENT,
  accrualsOf,
  isLeadgen,
  ownRate,
  type Earner,
  type ProjectMoney,
} from "@/lib/admin/finance";
import { gradeBook } from "@/lib/admin/grade-month";
import { manualLeadRow, parseManualLead } from "@/lib/admin/lead-add";
import { AFTER_PAY_ROLES, paidLock } from "@/lib/admin/leadgen-lock";

const read = (path: string) => readFileSync(path, "utf8");

const HEAD = "alex";
const MANAGER = "dilnoza";
const earners = new Map<string, Earner>([
  [HEAD, { id: HEAD, grade: "head", rate_percent: null, head_staff_id: null, founder_percent: null }],
  [MANAGER, { id: MANAGER, grade: "manager", rate_percent: null, head_staff_id: HEAD, founder_percent: null }],
]);

function project(over: Partial<ProjectMoney> = {}): ProjectMoney {
  return {
    id: "lg1",
    owner_staff_id: MANAGER,
    kind: "new",
    amount_usd: 2_000,
    tax_percent: LEADGEN_TAX_PERCENT,
    dev_cost_usd: 1_000,
    stage: "build",
    product: "leadgen",
    ...over,
  };
}

test("лидогенерация: 25% ведущему от суммы минус себестоимость и 7% налога, без строки руководителя", () => {
  assert.equal(LEADGEN_MANAGER_PERCENT, 25);
  assert.equal(LEADGEN_TAX_PERCENT, 7);
  // 2 000 − 140 налога − 1 000 себестоимости = 860; 25% = 215.
  const lines = accrualsOf(project(), [], earners);
  assert.equal(lines.length, 1, "руководителю строки нет — остальное соучредителям");
  assert.equal(lines[0].staff_id, MANAGER);
  assert.equal(lines[0].percent, 25);
  assert.equal(lines[0].amount_usd, 215);
  assert.equal(lines[0].state, "frozen", "до полной оплаты заморожено, как у всех");
  const paid = accrualsOf(project(), [{ project_id: "lg1", amount_usd: 2_000 }], earners);
  assert.equal(paid[0].state, "earned");
  // Ручной процент владельца по сделке главнее.
  assert.equal(accrualsOf(project(), [], earners, new Map([[MANAGER, 30]]))[0].amount_usd, 258);
  // Минус по сделке — ноль, а не долг менеджера.
  assert.equal(accrualsOf(project({ dev_cost_usd: 5_000 }), [], earners)[0].amount_usd, 0);
  assert.ok(isLeadgen({ product: "leadgen" }) && ownRate({ product: "leadgen" }) && ownRate({ product: "claudery" }));
  assert.ok(!ownRate({ product: null }));
});

test("лидогенерация: своя ставка — в грейд и премию за 3 сделки не идёт", () => {
  const book = gradeBook(
    [
      { id: "lg1", owner_staff_id: MANAGER, stage: "build", product: "leadgen" },
      { id: "web1", owner_staff_id: MANAGER, stage: "build", product: null },
    ],
    [
      { project_id: "lg1", amount_usd: 2_000, paid_on: "2026-11-20" },
      { project_id: "web1", amount_usd: 500, paid_on: "2026-11-21" },
    ],
    new Date("2026-11-23T10:00:00Z"),
  );
  assert.equal(book.dealMonth.has("lg1"), false);
  assert.equal(book.dealMonth.get("web1"), "2026-11");
  assert.equal(book.counts.get(MANAGER)?.get("2026-11"), 1);
});

test("проект из лида лидогенерации сам получает продукт и налог 7%; база пускает product leadgen", () => {
  const src = read("lib/admin/projects.ts");
  assert.match(src, /leadgen = lead\?\.source === "leadgen"/);
  assert.match(src, /product: "leadgen", tax_percent: LEADGEN_TAX_PERCENT/);
  const mig = read("supabase/migrations/0193_project_product_leadgen.sql");
  assert.match(mig, /'claudery', 'leadgen'/);
});

test("ручной лид: «Направление» → «Лидогенерация» ставит источник leadgen, по умолчанию разработка", () => {
  const form = { name: "Анна", company: "Клиника", contact: "+79001234567", need: "", from: "звонок" };
  const dev = parseManualLead(form);
  assert.ok(dev.ok);
  assert.equal(dev.lead.leadgen, false);
  const who = { id: "s1", username: "anna", display_name: "Анна" };
  assert.equal(manualLeadRow(dev.lead, who, { display_name: "Егор" }, "DZ-1", "2026-11-23T10:00:00Z").source, "manual");
  const lg = parseManualLead({ ...form, line: "leadgen" });
  assert.ok(lg.ok);
  const row = manualLeadRow(lg.lead, who, { display_name: "Егор" }, "DZ-2", "2026-11-23T10:00:00Z");
  assert.equal(row.source, "leadgen");
  assert.match(String(row.notes), /Направление: лидогенерация\./);
  assert.match(read("app/admin/actions.ts"), /line: text\("line"\)/);
  const ui = read("components/admin/lead-add.tsx");
  assert.match(ui, /name="line" value=\{line\}/);
  assert.match(ui, /t\.lineLeadgen/);
  assert.equal(leadAddDict.lineLeadgen.ru, "Лидогенерация");
});

test("после оплаты статус и ступени лида лидогенерации — только владелец и руководитель", () => {
  assert.deepEqual([...AFTER_PAY_ROLES], ["admin", "head"]);
  assert.equal(paidLock({ source: "leadgen", paid: false }, "manager"), false, "до оплаты менеджер ведёт сам");
  assert.equal(paidLock({ source: "leadgen", paid: true }, "manager"), true);
  assert.equal(paidLock({ source: "leadgen", paid: true }, "head"), false);
  assert.equal(paidLock({ source: "leadgen", paid: true }, "admin"), false);
  assert.equal(paidLock({ source: "form", paid: true }, "manager"), false, "другие лиды — как раньше");
  // Обе двери закрыты: смена статуса и отметка/снятие ступени.
  assert.match(read("lib/admin/ownership.ts"), /lockedAfterPay\(leadId, staff\)\) return \{ ok: false, reason: "paid" \}/);
  assert.match(read("lib/admin/sales-stages-store.ts"), /lockedAfterPay\(ownLeadId, staff\)\) return "paid"/);
  assert.match(read("components/admin/sales-stages.tsx"), /case "paid":/);
  assert.match(read("content/admin-panel/lead-card.ts"), /paid: \{/);
});
