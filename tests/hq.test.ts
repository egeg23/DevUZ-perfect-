import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HqView } from "@/components/admin/hq";
import {
  attentionOf,
  deltaOf,
  feedOf,
  initials,
  leadsPulse,
  mockupsPulse,
  moneyPulse,
  personOf,
  seesHqMoney,
  sortPeople,
  tasksPulse,
  touchesPulse,
  trendOf,
  type AttentionInput,
  type HqLead,
  type HqProspect,
  type HqTask,
} from "@/lib/admin/hq";
import type { Hq } from "@/lib/admin/hq-store";
import { PANEL_LOCALES } from "@/lib/admin/i18n";
import { menuOf } from "@/lib/admin/nav";
import { SECTIONS, homeOf, navOf, opens } from "@/lib/admin/roles";

/**
 * «Главная» (/admin/hq) — командный центр владельца и руководителя.
 * Владелец, 13.10.2026: «коротко что в компании, сколько лидов, сколько в
 * работе, сколько отправили прототипов и ждём ответ… Дай доступ для
 * руководителя тоже».
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// 14.10.2026 15:00 по Ташкенту.
const NOW = new Date("2026-10-14T10:00:00Z");
const ago = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();
const ahead = (h: number) => new Date(NOW.getTime() + h * 3600_000).toISOString();

test("раздел: владельцу и руководителю, первым в меню; менеджеру — только галочкой", () => {
  const hq = SECTIONS.find((s) => s.href === "/admin/hq");
  assert.deepEqual(hq?.roles, ["admin", "head"]);
  assert.equal(SECTIONS[0].href, "/admin/hq", "первым пунктом");
  for (const role of ["admin", "head"] as const) {
    assert.equal(menuOf({ role })[0].sections[0].href, "/admin/hq", `${role}: в меню первым`);
    assert.equal(navOf({ role })[0].href, "/admin/hq");
  }
  assert.ok(!opens({ role: "manager" }, "/admin/hq"));
  assert.ok(opens({ role: "manager", section_access: { "/admin/hq": true } }, "/admin/hq"), "галочка владельца открывает");
  assert.ok(!opens({ role: "head", section_access: { "/admin/hq": false } }, "/admin/hq"), "и закрывает");
  assert.match(read("app/admin/hq/page.tsx"), /const staff = await requireSection\("\/admin\/hq"\)/);
  assert.match(read("app/admin/hq/page.tsx"), /export const dynamic = "force-dynamic"/);
});

test("после входа и по логотипу: владелец и руководитель — на «Главную», менеджер — как раньше", () => {
  assert.equal(homeOf({ role: "admin" }), "/admin/hq");
  assert.equal(homeOf({ role: "head" }), "/admin/hq");
  assert.equal(homeOf({ role: "manager" }), "/admin");
  assert.equal(homeOf({ role: "manager", section_access: { "/admin/hq": true } }), "/admin", "менеджер с галочкой начинает со своих лидов");
  assert.equal(homeOf({ role: "head", section_access: { "/admin/hq": false } }), "/admin", "закрыли — домой в лиды");
  assert.match(read("components/admin/shell.tsx"), /href=\{homeOf\(staff\)\}/);
  assert.match(read("app/admin/login/actions.ts"), /redirect\(to === "\/admin" \? homeOf\(staff\) : to\)/);
  assert.match(read("app/admin/enter/[[...to]]/route.ts"), /asked === "\/admin" \? homeOf\(staff\) : asked/);
});

test("сравнение: последние 7 дней против 7 дней до них, будущее не в счёте", () => {
  const t = trendOf([ago(1), ago(24 * 6.9), ago(24 * 7.1), ago(24 * 13), ago(24 * 15), ahead(1), null], NOW);
  assert.deepEqual(t, { now: 2, prev: 2 });
  assert.equal(deltaOf({ now: 5, prev: 2 }), 3);
});

const lead = (over: Partial<HqLead>): HqLead => ({
  id: crypto.randomUUID(),
  created_at: ago(48),
  status: "taken",
  priority: "nurture",
  assigned_staff_id: "s1",
  label: "ООО Ромашка",
  ...over,
});

test("лиды: в работе, новые, тёплые без хозяина, выиграли и проиграли по журналу", () => {
  const offered = lead({ status: "new", priority: "warm", assigned_staff_id: null, created_at: ago(1) });
  const unowned = lead({ status: "new", priority: "hot", assigned_staff_id: null, created_at: ago(2), label: "Кафе" });
  const leads = [lead({}), lead({}), offered, unowned, lead({ status: "new", priority: "nurture", assigned_staff_id: null })];
  const p = leadsPulse(
    leads,
    [
      { lead_id: offered.id, staff_id: "s1", expires_at: ahead(0.3) },
      { lead_id: unowned.id, staff_id: "s2", expires_at: ago(0.1) }, // истекло — уже не держит
    ],
    [
      { action: "lead.status_changed", created_at: ago(5), actor_staff_id: "s1", target_id: "x", meta: { to: "won" } },
      { action: "lead.status_changed", created_at: ago(24 * 9), actor_staff_id: "s1", target_id: "x", meta: { to: "won" } },
      { action: "lead.status_changed", created_at: ago(5), actor_staff_id: "s1", target_id: "x", meta: { to: "taken" } },
      { action: "lead.auto_lost", created_at: ago(3), actor_staff_id: null, target_id: "x", meta: null },
    ],
    NOW,
  );
  assert.equal(p.inWork, 2);
  assert.equal(p.newToday, 2);
  assert.equal(p.offered, 1);
  assert.deepEqual(
    p.unowned.map((l) => l.label),
    ["Кафе"],
  );
  assert.deepEqual(p.won7, { now: 1, prev: 1 });
  assert.deepEqual(p.lost7, { now: 1, prev: 0 });
});

const prospect = (over: Partial<HqProspect>): HqProspect => ({
  id: crypto.randomUUID(),
  status: "sent",
  touched_by: null,
  touched_at: null,
  sent_at: null,
  autopilot_at: null,
  replied_at: null,
  ...over,
});

test("касания: люди и автопрогон вместе, одна компания — одно касание; норма — порции и автопрогон", () => {
  const rows = [
    prospect({ touched_by: "s1", touched_at: ago(1) }),
    prospect({ touched_by: "s1", touched_at: ago(1), status: "failed" }), // не дошло — не в счёте
    prospect({ autopilot_at: ago(2), sent_at: ago(2) }),
    prospect({ touched_by: "s2", touched_at: ago(2), autopilot_at: ago(2), sent_at: ago(2), replied_at: ago(1) }), // не дважды
    prospect({ autopilot_at: ago(24 * 8), sent_at: ago(24 * 8) }),
  ];
  const portions = [
    { staff_id: "s1", replaces: null, outcome: "sent", source: null },
    { staff_id: "s1", replaces: null, outcome: null, source: null },
    { staff_id: "s1", replaces: null, outcome: "sent", source: "stream" }, // поток — сверх порции
  ];
  const on = touchesPulse(rows, portions, { enabled: true, target: 20 }, NOW);
  assert.equal(on.today, 3);
  assert.equal(on.autopilotSent, 1);
  assert.equal(on.portionTarget, 2);
  assert.equal(on.portionDone, 1);
  assert.equal(on.norm, 22);
  assert.equal(on.repliesToday, 1);
  assert.deepEqual(on.sent7, { now: 3, prev: 1 });
  const off = touchesPulse(rows, portions, { enabled: false, target: 20 }, NOW);
  assert.equal(off.autopilotTarget, null);
  assert.equal(off.norm, 2, "выключенный автопрогон в норму не входит");
});

test("макеты: ждём ответа — пока идёт акция; ближайшая к концу; утверждённые за 7 дней", () => {
  const m = mockupsPulse(
    [
      { id: "1", client: "Кафе", mockup_name: "", status: "active", sent_at: ago(40), expires_at: ahead(8) },
      { id: "2", client: "Салон", mockup_name: "", status: "active", sent_at: ago(45), expires_at: ahead(3) },
      { id: "3", client: "Старый", mockup_name: "", status: "active", sent_at: ago(60), expires_at: ago(12) },
      { id: "4", client: "Ок", mockup_name: "", status: "approved", sent_at: ago(30), expires_at: ahead(18), approved_at: ago(2) },
    ].map((r) => ({ approved_at: null, ...r })),
    NOW,
  );
  assert.equal(m.waiting, 2, "истёкшая акция — уже не ждём");
  assert.equal(m.soonest?.client, "Салон");
  assert.equal(m.endingSoon, 1);
  assert.deepEqual(m.sent7, { now: 4, prev: 0 });
  assert.deepEqual(m.approved7, { now: 1, prev: 0 });
});

const task = (over: Partial<HqTask>): HqTask => ({
  id: crypto.randomUUID(),
  title: "Позвонить",
  assignee_id: "s1",
  creator_id: "a",
  status: "new",
  due_at: ahead(2),
  closed_at: null,
  ...over,
});

test("задачи: открытые, просроченные, сделанные за 7 дней", () => {
  const p = tasksPulse(
    [task({}), task({ due_at: ago(1), status: "in_work" }), task({ status: "done", closed_at: ago(3) }), task({ status: "failed", closed_at: ago(3), due_at: ago(5) })],
    NOW,
  );
  assert.equal(p.open, 2);
  assert.equal(p.overdue.length, 1);
  assert.deepEqual(p.done7, { now: 1, prev: 0 });
});

test("деньги — только владельцу; по датам оплаты, с начала месяца", () => {
  assert.ok(seesHqMoney("admin"));
  assert.ok(!seesHqMoney("head"));
  const m = moneyPulse(
    [
      { amount_usd: 500, paid_on: "2026-10-14" },
      { amount_usd: 300, paid_on: "2026-10-08" },
      { amount_usd: 200, paid_on: "2026-10-07" },
      { amount_usd: 1000, paid_on: "2026-09-30" },
      { amount_usd: 50, paid_on: "2026-10-15" }, // будущая дата — не поступило
    ],
    2,
    NOW,
  );
  assert.deepEqual(m.received7, { now: 800, prev: 200 });
  assert.equal(m.month, 1000);
  assert.equal(m.contracts, 2);
  // Деньги в разметку попадают только из hq.money — а его заполняет loadHq по роли.
  assert.match(read("lib/admin/hq-store.ts"), /const money = seesHqMoney\(role\);/);
  assert.match(read("lib/admin/hq-store.ts"), /const moneyNow = money \? moneyPulse/);
});

const baseAttention = (over: Partial<AttentionInput> = {}): AttentionInput => ({
  role: "head",
  now: NOW,
  sweep: { last_ok_at: ago(0.05), alerted: false },
  autopilotTrouble: null,
  bans: [],
  circlesMissing: { ru: [], uz: [] },
  circleFallback: [],
  leads: leadsPulse([], [], [], NOW),
  burned: [],
  overdue: [],
  stale: [],
  transfers: [],
  contracts: [],
  ending: [],
  firecrawlRemaining: 5000,
  ...over,
});

test("«Требует внимания»: пусто, когда всё спокойно; красное — первым; только то, что есть", () => {
  assert.deepEqual(attentionOf(baseAttention()), []);
  const items = attentionOf(
    baseAttention({
      sweep: { last_ok_at: ago(1), alerted: false },
      autopilotTrouble: { error: "Модель не отвечает — до поставщика не достучаться. Повторите через несколько минут.", at: ago(1) },
      bans: [
        { key: "main", account: "Главный аккаунт", until: Date.parse(ahead(3)) },
        { key: "a2", account: "Старый бан", until: Date.parse(ago(1)) },
      ],
      circlesMissing: { ru: [], uz: [{ id: "a2", label: "Рабочий 2" }] },
      burned: [{ id: "l1", label: "Кафе · Данил" }, { id: "l2", label: "Салон · Камила" }],
      stale: [{ id: "l3", label: "Отель" }],
      contracts: [{ id: "c1", label: "№12" }],
      firecrawlRemaining: 120,
    }),
  );
  const kinds = items.map((a) => a.kind);
  assert.deepEqual(kinds.slice(0, 3), ["sweep", "model", "ban"], "красное первым");
  assert.ok(kinds.includes("circle") && kinds.includes("burned") && kinds.includes("stale") && kinds.includes("firecrawl"));
  assert.ok(!kinds.includes("contracts"), "договоры — деньги, руководителю не показываем");
  assert.equal(kinds.filter((k) => k === "ban").length, 1, "снятое ограничение не горит");
  assert.ok(attentionOf(baseAttention({ role: "admin", contracts: [{ id: "c1", label: "№12" }] })).some((a) => a.kind === "contracts"));
  // Вчерашний сбой автопрогона сегодня не горит.
  assert.deepEqual(attentionOf(baseAttention({ autopilotTrouble: { error: "x", at: ago(24) } })), []);
  // Обычный сбой — «автопрогон», не «модель».
  assert.equal(attentionOf(baseAttention({ autopilotTrouble: { error: "нет аккаунтов", at: ago(1) } }))[0].kind, "autopilot");
});

test("карточка человека: в сети за 30 минут, порция, просрочки, сортировка тревожных первыми", () => {
  const staff = { id: "s1", display_name: "Данил Петров", role: "manager" as const, bot_seen_at: null };
  const busy = personOf(
    {
      staff,
      presence: { staff_id: "s1", minutes: 95, first_at: ago(6), last_at: ago(0.2) },
      lastView: null,
      lastAction: null,
      touches: 4,
      portion: [
        { staff_id: "s1", replaces: null, outcome: "sent", source: null },
        { staff_id: "s1", replaces: null, outcome: "self", source: null },
      ],
      inWork: 12,
      burnedToday: 0,
      stale: 3,
      tasks: [task({ assignee_id: "s1" }), task({ assignee_id: "s2", due_at: ago(1) })],
    },
    NOW,
  );
  assert.equal(busy.initials, "ДП");
  assert.ok(busy.online);
  assert.equal(busy.portionDone, 2);
  assert.equal(busy.mood, "done");
  assert.equal(busy.openTasks, 1, "чужие задачи не в счёте");
  const late = personOf(
    {
      staff: { ...staff, id: "s2", display_name: "@egor", bot_seen_at: ago(2) },
      presence: null,
      lastView: null,
      lastAction: null,
      touches: 0,
      portion: [],
      inWork: 0,
      burnedToday: 1,
      stale: 0,
      tasks: [task({ assignee_id: "s2", due_at: ago(1) })],
    },
    NOW,
  );
  assert.ok(!late.online, "бот два часа назад — уже не в сети");
  assert.equal(late.mood, "alert");
  assert.equal(late.overdue, 1);
  assert.equal(initials("@egor"), "E");
  assert.deepEqual(
    sortPeople([busy, late]).map((p) => p.id),
    ["s2", "s1"],
  );
});

test("лента за сутки: новые лиды, макеты, задачи, выигрыши — свежее сверху, старое не попадает", () => {
  const fresh = lead({ created_at: ago(2), label: "Кафе" });
  const feed = feedOf(
    {
      leads: [fresh, lead({ created_at: ago(30), label: "Старый" })],
      events: [{ action: "lead.status_changed", created_at: ago(1), actor_staff_id: "s1", target_id: fresh.id, meta: { to: "won" } }],
      mockups: [{ id: "m", client: "Салон", mockup_name: "", status: "approved", sent_at: ago(20), expires_at: ahead(28), approved_at: ago(0.5) }],
      tasks: [task({ status: "done", closed_at: ago(3), title: "Позвонить" }), task({ status: "failed", closed_at: ago(3) })],
      names: new Map([["s1", "Данил"]]),
    },
    NOW,
  );
  assert.deepEqual(
    feed.map((f) => f.kind),
    ["mockupApproved", "won", "lead", "taskDone", "mockupSent"],
  );
  assert.deepEqual(feed[1], { kind: "won", at: ago(1), label: "Кафе", who: "Данил", href: `/admin/leads/${fresh.id}` });
  assert.ok(!feed.some((f) => f.label === "Старый"));
});

/** Тестовые данные, как их отдаёт loadHq. */
function sampleHq(withMoney: boolean): Hq {
  const leads = [lead({ status: "new", priority: "hot", assigned_staff_id: null, created_at: ago(1), label: "Кафе «Ромашка»" }), lead({})];
  const mockups = mockupsPulse(
    [{ id: "1", client: "Салон", mockup_name: "", status: "active", sent_at: ago(40), expires_at: ahead(3), approved_at: null }],
    NOW,
  );
  const lp = leadsPulse(leads, [], [], NOW);
  return {
    offline: false,
    leads: lp,
    touches: touchesPulse([prospect({ touched_by: "s1", touched_at: ago(1) })], [], { enabled: true, target: 20 }, NOW),
    mockups,
    tasks: tasksPulse([task({ due_at: ago(1) })], NOW),
    money: withMoney ? moneyPulse([{ amount_usd: 1500, paid_on: "2026-10-13" }], 1, NOW) : null,
    attention: attentionOf(baseAttention({ leads: lp, overdue: [{ id: "t1", label: "Позвонить" }] })),
    feed: [{ kind: "lead", at: ago(1), label: "Кафе", href: "/admin/leads/x" }],
    people: [
      personOf(
        {
          staff: { id: "s1", display_name: "Данил", role: "manager", bot_seen_at: null },
          presence: { staff_id: "s1", minutes: 40, first_at: ago(5), last_at: ago(0.1) },
          lastView: null,
          lastAction: null,
          touches: 3,
          portion: [],
          inWork: 7,
          burnedToday: 0,
          stale: 2,
          tasks: [],
        },
        NOW,
      ),
    ],
  };
}

const CYRILLIC = /[а-яё]/i;
const visible = (html: string) =>
  html
    .replace(/>Д</g, "><")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/g, " ")
    .replace(/Данил|Кафе «Ромашка»|Салон|Кафе|Ромашка/g, "");

test("«Главная» рисуется на трёх языках: деньги — только у владельца, у uz и pl нет русского", () => {
  for (const locale of PANEL_LOCALES) {
    for (const withMoney of [true, false]) {
      const html = renderToStaticMarkup(createElement(HqView, { hq: sampleHq(withMoney), locale, name: "Тест", now: NOW, giveAction: async () => {} }));
      assert.ok(html.includes('href="/admin?status=taken"'), "число ведёт в подробности");
      assert.ok(html.includes('href="/admin/mockups"'));
      assert.ok(html.includes('id="people"'));
      assert.equal(html.includes('href="/admin/finance"'), withMoney, `${locale}: деньги ${withMoney ? "есть" : "нет"}`);
      assert.ok(html.includes("min-h-11"), "строки — под палец");
      assert.ok(html.includes('name="lead"'), "«Отдать» у тёплого без хозяина");
      assert.ok(html.includes('role="img"'), "касания за 7 дней в карточке");
      if (locale !== "ru") {
        const text = visible(html).replace(/Тест/g, "");
        assert.ok(!CYRILLIC.test(text), `${locale}: русское на странице: ${text.match(/\S*[а-яё]\S*/i)}`);
      }
    }
  }
  const calm = renderToStaticMarkup(
    createElement(HqView, { hq: { ...sampleHq(false), attention: [] }, locale: "ru", name: "Тест", now: NOW }),
  );
  assert.match(calm, /Всё спокойно/);
});

test("пульс обновляется сам, только когда страница видна", () => {
  const src = read("components/admin/hq-refresh.tsx");
  assert.match(src, /router\.refresh\(\)/);
  assert.match(src, /document\.visibilityState !== "visible"/);
  assert.match(read("app/admin/hq/page.tsx"), /<HqRefresh everyMs=\{HQ_REFRESH_MS\} \/>/);
});
