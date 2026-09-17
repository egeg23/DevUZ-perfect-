import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canSetPlan,
  expectedPayments,
  factOf,
  lastMonths,
  monthlyCash,
  periodEnd,
  periodStart,
  planFact,
  previousPeriodStart,
  pulseOf,
  stuckLeads,
  tashkentDate,
  todayInTashkent,
  windowOf,
  type EventLite,
  type LeadLite,
  type MessageLite,
  type PaymentLite,
  type ProjectLite,
} from "@/lib/admin/pulse";

// Среда, 16 сентября 2026, 23:30 UTC — в Ташкенте уже четверг 17-е, 04:30.
const NOW = new Date("2026-09-16T23:30:00Z");

test("день и неделя считаются по Ташкенту, а не по UTC", () => {
  assert.equal(todayInTashkent(NOW), "2026-09-17");
  assert.equal(tashkentDate(NOW).weekday, 4, "четверг");
  assert.equal(periodStart("week", NOW), "2026-09-14", "понедельник той же недели");
  assert.equal(periodStart("month", NOW), "2026-09-01");
  // Воскресенье в Ташкенте — конец недели, а не её начало.
  const sunday = new Date("2026-09-20T10:00:00Z");
  assert.equal(periodStart("week", sunday), "2026-09-14");
  assert.equal(periodEnd("week", "2026-09-14"), "2026-09-21");
  assert.equal(periodEnd("month", "2026-12-01"), "2027-01-01");
  assert.equal(previousPeriodStart("week", "2026-09-14"), "2026-09-07");
  assert.equal(previousPeriodStart("month", "2026-01-01"), "2025-12-01");
  // Окно недели начинается в полночь по Ташкенту — это 19:00 UTC накануне.
  assert.equal(windowOf("week", "2026-09-14").from.toISOString(), "2026-09-13T19:00:00.000Z");
});

const lead = (over: Partial<LeadLite>): LeadLite => ({
  id: "L1",
  assigned_staff_id: "danil",
  status: "taken",
  priority: "warm",
  created_at: "2026-09-01T10:00:00Z",
  assigned_at: "2026-09-10T10:00:00Z",
  request_no: "DZ-101",
  company: null,
  contact_name: null,
  ...over,
});

const ev = (over: Partial<EventLite>): EventLite => ({
  actor_staff_id: "danil",
  action: "lead.status_changed",
  target_type: "lead",
  target_id: "L1",
  created_at: "2026-09-15T10:00:00Z",
  meta: null,
  ...over,
});

test("застрявший лид: молчание считается от последнего движения, порог зависит от приоритета", () => {
  const leads = [
    lead({ id: "L1", priority: "hot", assigned_at: "2026-09-14T10:00:00Z" }),
    lead({ id: "L2", priority: "warm", assigned_at: "2026-09-14T10:00:00Z" }),
    lead({ id: "L3", priority: "warm", assigned_at: "2026-09-10T10:00:00Z" }),
    lead({ id: "L4", priority: "warm", assigned_at: "2026-09-01T10:00:00Z", status: "won" }),
  ];
  const messages: MessageLite[] = [{ lead_id: "L3", author_staff_id: "danil", created_at: "2026-09-16T09:00:00Z" }];
  const stuck = stuckLeads(leads, [], messages, NOW);
  // L1: горячий, 2 дня тишины — застрял. L2: тёплый, 2 дня — ещё нет.
  // L3: взят давно, но вчера была запись — движение есть. L4: закрыт.
  assert.deepEqual(stuck.map((s) => s.id), ["L1"]);
  assert.equal(stuck[0].days, 2);
  assert.equal(stuck[0].label, "DZ-101");

  // Действие в журнале по лиду — тоже движение.
  const touched = stuckLeads(leads, [ev({ target_id: "L1", created_at: "2026-09-16T20:00:00Z", action: "lead.viewed" })], messages, NOW);
  assert.deepEqual(touched.map((s) => s.id), []);
});

test("пульс сотрудника: выигранные, контакты, касания и поступления — за окно", () => {
  const window = windowOf("week", "2026-09-14");
  const projects: ProjectLite[] = [
    { id: "P1", title: "Сайт", client: "ООО", owner_staff_id: "danil", amount_usd: 2000, stage: "build" },
    { id: "P2", title: "Чужой", client: null, owner_staff_id: "sasha", amount_usd: 900, stage: "build" },
  ];
  const payments: PaymentLite[] = [
    { project_id: "P1", amount_usd: 500, paid_on: "2026-09-14" },
    { project_id: "P1", amount_usd: 300, paid_on: "2026-09-13" },
    { project_id: "P2", amount_usd: 900, paid_on: "2026-09-15" },
  ];
  const events: EventLite[] = [
    ev({ meta: { from: "taken", to: "won" } }),
    ev({ meta: { from: "taken", to: "won" }, created_at: "2026-09-10T10:00:00Z" }),
    ev({ meta: { from: "taken", to: "lost" } }),
    ev({ action: "lead.contact_revealed" }),
    ev({ action: "lead.taken" }),
    ev({ action: "lead.viewed", actor_staff_id: "sasha" }),
    ev({ action: "login.succeeded", target_type: null, target_id: null }),
  ];
  const messages: MessageLite[] = [
    { lead_id: "L1", author_staff_id: "danil", created_at: "2026-09-15T12:00:00Z" },
    { lead_id: "L1", author_staff_id: "danil", created_at: "2026-09-01T12:00:00Z" },
  ];
  const pulse = pulseOf("danil", { leads: [lead({}), lead({ id: "L9", status: "new" })], events, messages, projects, payments }, window, NOW);
  assert.equal(pulse.inWork, 1);
  assert.equal(pulse.won, 1, "выигрыш на прошлой неделе не считается");
  assert.equal(pulse.lost, 1);
  assert.equal(pulse.contacts, 1);
  assert.equal(pulse.taken, 1);
  // Касания: status×2, contact, taken (по лидам) + одна запись в окне; чужой просмотр и вход — нет.
  assert.equal(pulse.touches, 5);
  // Платёж 14 сентября — понедельник, в окне; 13-е — нет; чужой проект — нет.
  assert.equal(pulse.revenue, 500);
});

test("план и факт: процент от цели, без деления на ноль", () => {
  const pulse = pulseOf("danil", { leads: [], events: [], messages: [], projects: [], payments: [] }, windowOf("week", "2026-09-14"), NOW);
  const plan = { id: "p", staff_id: "danil", period: "week" as const, period_start: "2026-09-14", metric: "won" as const, target: 4 };
  assert.equal(planFact(plan, { ...pulse, won: 1 }).percent, 25);
  assert.equal(planFact({ ...plan, target: 0 }, { ...pulse, won: 1 }).percent, 100);
  assert.equal(planFact({ ...plan, target: 0 }, pulse).percent, 0);
  assert.equal(factOf("revenue_usd", { ...pulse, revenue: 700 }), 700);
  assert.equal(factOf("contacts", { ...pulse, contacts: 3 }), 3);
});

test("план ставит владелец; руководитель — только новый и только своему", () => {
  const team = ["danil"];
  assert.equal(canSetPlan({ id: "egor", role: "admin" }, "danil", [], true), true);
  assert.equal(canSetPlan({ id: "sasha", role: "head" }, "danil", team, false), true);
  assert.equal(canSetPlan({ id: "sasha", role: "head" }, "danil", team, true), false, "менять существующий — только владелец");
  assert.equal(canSetPlan({ id: "sasha", role: "head" }, "sasha", ["sasha"], false), false, "себе план не ставят");
  assert.equal(canSetPlan({ id: "sasha", role: "head" }, "other", team, false), false, "чужой команде — нет");
  assert.equal(canSetPlan({ id: "danil", role: "manager" }, "danil", [], false), false);
});

test("касса по месяцам: последние N месяцев, разница считается, чужие месяцы не попадают", () => {
  assert.deepEqual(lastMonths(NOW, 3), ["2026-07", "2026-08", "2026-09"]);
  assert.deepEqual(lastMonths(new Date("2026-01-15T00:00:00Z"), 2), ["2025-12", "2026-01"]);
  const rows = monthlyCash(
    [{ project_id: "P", amount_usd: 1000, paid_on: "2026-08-03" }, { project_id: "P", amount_usd: 250, paid_on: "2026-06-30" }],
    [{ amount_usd: 400, spent_on: "2026-08-20" }, { amount_usd: 50, spent_on: "2026-09-01" }],
    ["2026-08", "2026-09"],
  );
  assert.deepEqual(rows, [
    { month: "2026-08", revenue: 1000, expenses: 400, profit: 600 },
    { month: "2026-09", revenue: 0, expenses: 50, profit: -50 },
  ]);
});

test("ожидаем оплат: живые проекты с остатком, самые крупные первыми", () => {
  const projects: ProjectLite[] = [
    { id: "A", title: "A", client: null, owner_staff_id: null, amount_usd: 1000, stage: "build" },
    { id: "B", title: "B", client: null, owner_staff_id: null, amount_usd: 5000, stage: "design" },
    { id: "C", title: "C", client: null, owner_staff_id: null, amount_usd: 800, stage: "done" },
    { id: "D", title: "D", client: null, owner_staff_id: null, amount_usd: null, stage: "build" },
    { id: "E", title: "E", client: null, owner_staff_id: null, amount_usd: 300, stage: "build" },
  ];
  const payments: PaymentLite[] = [
    { project_id: "A", amount_usd: 400, paid_on: "2026-09-01" },
    { project_id: "E", amount_usd: 300, paid_on: "2026-09-01" },
  ];
  const rows = expectedPayments(projects, payments);
  assert.deepEqual(rows.map((r) => [r.project.id, r.remaining]), [["B", 5000], ["A", 600]]);
});

/* ── Право на план держится в хранилище, а страница составляет дашборд ─── */

import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("план ставится и снимается через проверку прав в хранилище, а не в форме", () => {
  const store = read("lib/admin/pulse-store.ts");
  // Существование плана проверяется до права: руководителю можно только новый.
  assert.match(store, /if \(!canSetPlan\(staff, fields\.staffId, team, Boolean\(existing\)\)\) return \{ ok: false, reason: "forbidden" \}/);
  assert.match(store, /if \(staff\.role !== "admin"\) return \{ ok: false, reason: "forbidden" \}/, "снять план может кто угодно");
  // Начало периода считает сервер по Ташкенту, а не форма.
  assert.match(read("app/admin/plans/actions.ts"), /periodStart: periodStart\(period, new Date\(\)\)/);
});

test("главная панели показывает дашборд роли выше общего списка", () => {
  const page = read("app/admin/page.tsx");
  assert.match(page, /<DashboardHome staff=\{staff\} planNotice=\{params\.p\} \/>/);
  assert.ok(page.indexOf("<DashboardHome") < page.indexOf("<LeadTable"), "дашборд ниже списка лидов");

  const home = read("components/admin/dashboard-home.tsx");
  // Владелец: договоры на подпись — первыми, до денег и команды.
  const owner = home.slice(home.indexOf("── Владелец"));
  assert.ok(owner.indexOf("<ContractsToSign") < owner.indexOf("<Tiles"), "договоры не первые");
  assert.ok(owner.indexOf("<Tiles") < owner.indexOf("<CashChart"));
  // Менеджеру план не ставить, руководителю — ставить, владельцу — и менять.
  assert.match(home, /canAdd=\{false\} canEdit=\{false\}/);
  assert.match(home, /canAdd=\{options\.length > 0\} canEdit=\{false\}/);
  assert.match(home, /canAdd=\{options\.length > 0\} canEdit staffOptions/);
  // Руководитель не видит «к выплате» чужих — деньги команды только владельцу.
  assert.match(home, /<TeamTable rows=\{teamRows\} showMoney=\{false\} \/>/);
  assert.match(home, /<TeamTable rows=\{teamRows\} showMoney \/>/);
});
