import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { GrowthCard, LevelBadge } from "@/components/admin/growth";
import { accrualsOf, balanceOf, foundersPool, type Earner, type ProjectMoney } from "@/lib/admin/finance";
import {
  BONUS_USD,
  bonusesOf,
  boosted,
  gradeBook,
  gradeRate,
  gradeStatus,
  monthOf,
  prevMonth,
} from "@/lib/admin/grade-month";
import { PANEL_LOCALES } from "@/lib/admin/i18n";
import { growthOf, levelOf, levelStart, orderUnits, panelUnits, titleOf, xpOf, type XpSnapshot } from "@/lib/admin/levels";
import { partsFor } from "@/lib/admin/levels-store";
import { dealsOf } from "@/lib/admin/sales-stages";

/**
 * Грейд по сделкам месяца и уровни (CLAUDE.md, «Грейд и уровни менеджеров»).
 * Владелец, 17.10.2026: «3 сделки за месяц = 15% вместо 10% на следующий
 * календарный месяц + после 3 сделок премия 200$ помимо %… уровни, как в
 * играх рпг». Уточнения: «15% сохранить до ноября», сделка — «первая оплата
 * по проекту», премия — «за каждые 3 сделки».
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const ME = "m1";

const project = (id: string, over: Partial<ProjectMoney> = {}): ProjectMoney => ({
  id,
  owner_staff_id: ME,
  kind: "new",
  amount_usd: 1000,
  tax_percent: 0,
  dev_cost_usd: 0,
  stage: "done",
  ...over,
});
const pay = (project_id: string, paid_on: string, amount_usd = 1000) => ({ project_id, paid_on, amount_usd });
const earner = (over: Partial<Earner> = {}): Earner => ({ id: ME, grade: "manager", rate_percent: null, head_staff_id: null, founder_percent: null, ...over });

test("сделка — первая оплата проекта, в месяц этой оплаты; отменённый не считается", () => {
  const book = gradeBook(
    [project("a"), project("b"), project("c", { stage: "cancelled" }), project("d")],
    [pay("a", "2026-10-03", 300), pay("a", "2026-11-02"), pay("b", "2026-10-30"), pay("c", "2026-10-05"), pay("d", "2026-11-01", 0)],
    new Date("2026-11-10T07:00:00Z"),
  );
  assert.equal(book.dealMonth.get("a"), "2026-10", "вторая оплата месяц не меняет");
  assert.equal(book.counts.get(ME)?.get("2026-10"), 2);
  assert.ok(!book.dealMonth.has("c"));
  assert.ok(!book.dealMonth.has("d"), "нулевой платёж — не оплата");
  assert.equal(book.now, "2026-11");
  assert.equal(prevMonth("2026-01"), "2025-12");
  assert.equal(monthOf(new Date("2026-10-31T20:00:00Z")), "2026-11", "месяц — по Ташкенту");
});

test("ставка: до ноября — по грейду; с ноября 10%, за 3 сделки прошлого месяца — 15%", () => {
  const oct3 = [project("a"), project("b"), project("c")];
  const payments = [pay("a", "2026-10-02"), pay("b", "2026-10-10"), pay("c", "2026-10-20")];
  const book = gradeBook(oct3, payments, new Date("2026-11-05T07:00:00Z"));
  assert.equal(gradeRate(earner(), "new", "2026-10", book), null, "октябрь — правило ещё не действует");
  assert.ok(boosted(book, ME, "2026-11"));
  assert.equal(gradeRate(earner(), "new", "2026-11", book), 15, "три сделки в октябре — 15% в ноябре");
  assert.equal(gradeRate(earner(), "new", "2026-12", book), 10, "в ноябре сделок нет — в декабре 10%");
  assert.equal(gradeRate(earner(), "upsell", "2026-11", book), null, "допродажи — по-прежнему");
  assert.equal(gradeRate(earner({ grade: "head" }), "new", "2026-11", book), null, "руководителя правило не касается");
  assert.equal(gradeRate(earner({ rate_percent: 12 }), "new", "2026-12", book), 12, "персональная ставка — база");
  assert.equal(gradeRate(earner({ rate_percent: 20 }), "new", "2026-11", book), 20, "15% персональную выше не понижает");

  // В начислениях: ноябрьская сделка после трёх октябрьских — 15% от прибыли.
  const nov = project("n");
  const all = gradeBook([...oct3, nov], [...payments, pay("n", "2026-11-03")], new Date("2026-11-05T07:00:00Z"));
  const earners = new Map([[ME, earner()]]);
  assert.equal(accrualsOf(nov, [pay("n", "2026-11-03")], earners, new Map(), all)[0].percent, 15);
  assert.equal(accrualsOf(oct3[0], payments, earners, new Map(), all)[0].percent, 15, "октябрь — по грейду «менеджер», 15%");
  assert.equal(accrualsOf(nov, [], earners)[0].percent, 15, "без книги — как раньше");
  // Ручной процент владельца по сделке сильнее правила.
  assert.equal(accrualsOf(nov, [], earners, new Map([[ME, 7]]), all)[0].percent, 7);
});

test("премия: $200 за каждые 3 сделки месяца, со сделок с ноября; в «Заработано» и из котла", () => {
  const ps = Array.from({ length: 7 }, (_, i) => project(`p${i}`));
  const payments = [
    ...["2026-10-01", "2026-10-02", "2026-10-03"].map((d, i) => pay(`p${i}`, d)),
    ...["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"].map((d, i) => pay(`p${i + 3}`, d)),
  ];
  const book = gradeBook(ps, payments, new Date("2026-11-10T07:00:00Z"));
  const bonuses = bonusesOf(book);
  assert.deepEqual(bonuses, [{ staff_id: ME, month: "2026-11", deals: 4, amount_usd: BONUS_USD }], "октябрь без премии, 4 в ноябре — одна");
  const six = gradeBook(
    Array.from({ length: 6 }, (_, i) => project(`q${i}`)),
    Array.from({ length: 6 }, (_, i) => pay(`q${i}`, `2026-12-0${i + 1}`)),
    new Date("2026-12-20T07:00:00Z"),
  );
  assert.equal(bonusesOf(six)[0].amount_usd, 400, "6 сделок — $400");

  assert.equal(balanceOf(ME, [], [], bonuses).earned, 200);
  assert.equal(balanceOf("other", [], [], bonuses).earned, 0);
  const pool = foundersPool([], [], [], [], bonuses);
  assert.equal(pool.earned, -200, "премия уходит из того, что остаётся студии");

  const st = gradeStatus(earner(), book);
  assert.deepEqual(
    { deals: st.deals, rateNow: st.rateNow, rateNext: st.rateNext, bonusNow: st.bonusNow, toNextBonus: st.toNextBonus },
    { deals: 4, rateNow: 15, rateNext: 15, bonusNow: 200, toNextBonus: 2 },
  );
  // Все расчёты денег идут с книгой сделок и премиями.
  for (const f of ["app/admin/finance/page.tsx", "lib/admin/coach-store.ts", "components/admin/dashboard-home.tsx"]) {
    assert.match(read(f), /gradeBook\(ledger\.projects, ledger\.payments/, f);
    assert.match(read(f), /bonuses\)/, f);
  }
  assert.match(read("app/admin/projects/[id]/page.tsx"), /await gradeBookFor\(project\.owner_staff_id\)/);
});

test("уровни: пороги, звания, потолки панели и порядка", () => {
  assert.deepEqual([1, 2, 3, 5, 10].map(levelStart), [0, 50, 150, 500, 2250]);
  assert.equal(levelOf(0).level, 1);
  assert.equal(levelOf(49).level, 1);
  assert.equal(levelOf(50).level, 2);
  assert.deepEqual(levelOf(170), { level: 3, xp: 170, into: 20, span: 150, toNext: 130 });
  assert.equal(titleOf(1), "novice");
  assert.equal(titleOf(15), "legend");
  assert.equal(xpOf({ touch: 10, paid: 1, shown: 2 }), 10 + 100 + 30);
  assert.equal(panelUnits([{ day: "2026-10-15", minutes: 400 }, { day: "2026-10-16", minutes: 44 }]), 8 + 2, "не больше 8 в день");
  const many = Array.from({ length: 30 }, () => "2026-10-15T08:00:00Z");
  assert.equal(orderUnits([...many, "2026-10-16T08:00:00Z"]), 10 + 1, "не больше 20 очков в день");
});

test("очки — тому, кто сделал: касание и ответ — автору касания, показ — кто отметил", () => {
  const deals = dealsOf({
    prospects: [
      { id: "p1", label: "A", status: "sent", touched_by: ME, touched_at: "2026-10-10T08:00:00Z", sent_at: null, hello_at: "2026-10-10T08:00:00Z", replied_at: "2026-10-11T08:00:00Z", proto_requested_at: null, autopilot_replied_at: null, lead_id: "l1" },
      { id: "p2", label: "B", status: "sent", touched_by: "x", touched_at: "2026-10-10T08:00:00Z", sent_at: null, hello_at: "2026-10-10T08:00:00Z", replied_at: null, proto_requested_at: null, autopilot_replied_at: null, lead_id: null },
    ],
    leads: [{ id: "l1", created_at: "2026-10-11T08:00:00Z", source: "outreach", status: "taken", assigned_staff_id: ME, label: "A" }],
    mockups: [{ lead_id: "l1", prospect_id: null, sent_at: "2026-10-12T08:00:00Z" }],
    marks: [{ kind: "shown", lead_id: "l1", prospect_id: null, staff_id: ME, created_at: "2026-10-13T08:00:00Z" }],
    prices: [],
    payments: [],
    wins: [],
  });
  const parts = partsFor(ME, deals, [{ staff_id: ME, day: "2026-10-12", minutes: 60 }], [{ actor_staff_id: ME, created_at: "2026-10-12T09:00:00Z" }]);
  assert.deepEqual(
    { touch: parts.touch, reply: parts.reply, mockup: parts.mockup, shown: parts.shown, panel: parts.panel, order: parts.order },
    { touch: 1, reply: 1, mockup: 1, shown: 1, panel: 4, order: 1 },
  );
  assert.equal(partsFor("x", deals, [], []).touch, 1);
  // С момента: неделя не берёт старое.
  assert.equal(partsFor(ME, deals, [], [], Date.parse("2026-10-12T00:00:00Z")).touch, 0);
});

test("«Мой рост» и бейдж — на трёх языках, без русского в узбекском и польском", () => {
  const snap: XpSnapshot = {
    computedAt: "2026-10-17T07:00:00Z",
    people: { [ME]: { parts: { touch: 120, reply: 20, interest: 3, mockup: 2, shown: 1, priced: 0, paid: 0, panel: 30, order: 10 }, xp: 0, week: 41 } },
  };
  snap.people[ME].xp = xpOf(snap.people[ME].parts);
  const book = gradeBook([project("a")], [pay("a", "2026-10-02")], new Date("2026-10-17T07:00:00Z"));
  const g = growthOf(ME, snap, gradeStatus(earner(), book));
  assert.equal(g.level.level, levelOf(snap.people[ME].xp).level);
  for (const locale of PANEL_LOCALES) {
    const html = renderToStaticMarkup(createElement(GrowthCard, { g, locale })) + renderToStaticMarkup(createElement(LevelBadge, { g, locale }));
    assert.match(html, /data-block="growth"/);
    if (locale !== "ru") assert.ok(!/[а-яё]/i.test(html.replace(/<[^>]+>/g, "")), `${locale}: русский текст`);
  }
  const ru = renderToStaticMarkup(createElement(GrowthCard, { g, locale: "ru" }));
  assert.match(ru, /Сделок в этом месяце: 1 из 3/);
  assert.match(ru, /До 1 ноября процент/);
  assert.match(ru, /со сделок с 1 ноября/);
  assert.ok(growthOf("nobody", snap, null).pending, "не посчитан — «считаем», а не ноль");
  assert.match(read("components/admin/hq-my.tsx"), /<GrowthCard g=\{my\.growth\}/);
  assert.match(read("components/admin/hq.tsx"), /<LevelBadge g=\{p\.growth\}/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /await refreshXp\(new Date\(\)\)/);
});

test("без модели", () => {
  for (const f of ["lib/admin/grade-month.ts", "lib/admin/levels.ts", "lib/admin/levels-store.ts", "components/admin/growth.tsx"]) {
    assert.ok(!/anthropic|claude-|firecrawl|completeText|askModel/i.test(read(f)), f);
  }
});
