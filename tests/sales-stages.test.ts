import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MyStagesCard, StagesCard } from "@/components/admin/sales-stages";
import { PANEL_LOCALES } from "@/lib/admin/i18n";
import {
  SHOW_NORM,
  STAGES,
  canMark,
  dealsOf,
  dropOf,
  myStagesOf,
  noShowDue,
  noShowKey,
  noShowNames,
  noShowRows,
  noShowText,
  parseAmount,
  periodRange,
  personSales,
  seesStagesMoney,
  showNorm,
  stageCounts,
  stagesPulse,
  stepsOf,
  withoutMoney,
  type StageInput,
  type StageLead,
  type StageProspect,
} from "@/lib/admin/sales-stages";

/**
 * Ступени продажи — честный счёт (CLAUDE.md, «Ступени продажи»).
 * Владелец, 17.10.2026: «Делаем все по твоим рекомендациям, они правдивые».
 * 886 «лидов» за 30 дней и 0 «Выиграли»: лидом считалось каждое касание.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// Четверг, 15.10.2026, 12:00 по Ташкенту.
const NOW = new Date("2026-10-15T07:00:00Z");
const ago = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();

const ME = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

function prospect(p: Partial<StageProspect> & { id: string }): StageProspect {
  return {
    label: p.id,
    status: "sent",
    touched_by: ME,
    touched_at: ago(100),
    sent_at: null,
    hello_at: ago(100),
    replied_at: null,
    proto_requested_at: null,
    autopilot_replied_at: null,
    lead_id: null,
    ...p,
  };
}

function lead(l: Partial<StageLead> & { id: string }): StageLead {
  return { created_at: ago(90), source: "outreach", status: "taken", assigned_staff_id: ME, label: l.id, ...l };
}

const none: StageInput = { prospects: [], leads: [], mockups: [], marks: [], prices: [], payments: [], wins: [] };

test("ступени — по данным: написали, ответ, «+», макет, показ, цена, оплата", () => {
  const deals = dealsOf({
    ...none,
    prospects: [
      prospect({ id: "p1", replied_at: ago(90), proto_requested_at: ago(80), lead_id: "l1" }),
      prospect({ id: "p2", replied_at: ago(50) }),
      prospect({ id: "p3" }),
      prospect({ id: "p4", status: "failed" }),
    ],
    leads: [lead({ id: "l1" })],
    mockups: [{ lead_id: "l1", prospect_id: null, sent_at: ago(60) }],
    marks: [{ kind: "shown", lead_id: "l1", prospect_id: null, staff_id: ME, created_at: ago(40), via: "video", amount_usd: null }],
    payments: [{ lead_id: "l1", paid_on: "2026-10-14", amount_usd: 500 }],
  });
  const d1 = deals.find((d) => d.key === "p:p1");
  assert.ok(d1, "касание и его лид — одна сделка");
  assert.equal(d1.leadId, "l1");
  assert.deepEqual(
    STAGES.filter((s) => d1.at[s]),
    STAGES,
    "оплата подразумевает «цена названа», хоть её и не отмечали",
  );
  assert.equal(d1.own.priced, undefined, "подразумеваемая ступень человеку в зачёт не идёт");
  assert.equal(d1.own.shown?.by, ME);
  assert.equal(d1.paidUsd, 500);

  const { from, to } = periodRange("7", NOW);
  const counts = stageCounts(deals, from, to);
  assert.equal(counts.written, 3, "неудавшееся касание — не «написали»");
  assert.equal(counts.replied, 2);
  assert.equal(counts.interest, 1);
  assert.equal(counts.mockup, 1);
  assert.equal(counts.shown, 1);
  assert.equal(counts.paid, 1);

  const steps = stepsOf(deals, from, to);
  assert.deepEqual(steps[0], { from: "written", to: "replied", base: 3, reached: 2 });
  assert.equal(dropOf(steps[0]), 1);
  assert.deepEqual(steps[1], { from: "replied", to: "interest", base: 2, reached: 1 });
});

test("лид автопрогона по согласию и заявка с сайта — интерес; простой лид из касания — нет", () => {
  const deals = dealsOf({
    ...none,
    prospects: [
      prospect({ id: "auto", replied_at: ago(10), autopilot_replied_at: ago(10), lead_id: "la" }),
      prospect({ id: "old", replied_at: ago(10), lead_id: "lo" }),
    ],
    leads: [lead({ id: "la" }), lead({ id: "lo" }), lead({ id: "site", source: "form", created_at: ago(5) })],
  });
  const at = (key: string) => deals.find((d) => d.key === key)?.at ?? {};
  assert.ok(at("p:auto").interest);
  assert.equal(at("p:old").interest, undefined, "лид, заведённый на любой ответ, — ещё не интерес");
  assert.ok(at("l:site").replied && at("l:site").interest, "клиент пришёл сам — ответ и интерес");
  assert.equal(at("l:site").written, undefined, "ему мы не писали");
});

test("макет без лида и касания (нашёл скан) — своя строка по клиенту", () => {
  const deals = dealsOf({
    ...none,
    mockups: [
      { lead_id: null, prospect_id: null, sent_at: ago(5), client: "Салон Лола", ref: "p:abc" },
      { lead_id: null, prospect_id: null, sent_at: ago(3), client: "салон лола", ref: "p:abc" },
      { lead_id: null, prospect_id: null, sent_at: ago(2), client: "Кафе", ref: "s:cafe" },
    ],
  });
  assert.equal(deals.length, 2, "один клиент — одна строка");
  const lola = deals.find((d) => d.label === "Салон Лола");
  assert.equal(lola?.at.mockup, ago(5));
  assert.ok(lola?.at.interest && lola.at.replied, "макет ушёл — значит, ответил и был интерес");
  assert.equal(lola?.at.written, undefined);
});

test("kind='price' в переписке — «цена названа», как и отметка «Назвал цену»", () => {
  const deals = dealsOf({
    ...none,
    prospects: [prospect({ id: "p1", replied_at: ago(5), proto_requested_at: ago(4) }), prospect({ id: "p2", replied_at: ago(5), lead_id: "l2" })],
    leads: [lead({ id: "l2" })],
    prices: [{ lead_id: null, prospect_id: "p1", at: ago(3) }],
    marks: [{ kind: "priced", lead_id: "l2", prospect_id: null, staff_id: ME, created_at: ago(2), via: null, amount_usd: 1200 }],
  });
  const p1 = deals.find((d) => d.key === "p:p1");
  const p2 = deals.find((d) => d.key === "p:p2");
  assert.equal(p1?.own.priced?.at, ago(3));
  assert.equal(p1?.own.priced?.by, ME, "строка цены — тому, чья сделка");
  assert.equal(p2?.priceUsd, 1200);
  assert.equal(personSales(deals, ME, NOW.getTime() - 24 * 3600_000, NOW.getTime() + 1).priced, 2);
});

test("отметки — только по своим: менеджер по своему лиду или касанию, руководитель и владелец — по любому", () => {
  const manager = { id: ME, role: "manager" as const };
  assert.ok(canMark(manager, { hasLead: true, leadOwner: ME }));
  assert.ok(!canMark(manager, { hasLead: true, leadOwner: OTHER }), "чужой лид — нельзя");
  assert.ok(!canMark(manager, { hasLead: true, leadOwner: null }), "ничей лид — нельзя");
  assert.ok(!canMark(manager, { hasLead: true, leadOwner: OTHER, touched_by: ME }), "касание его, а лид у другого — за лидом");
  assert.ok(canMark(manager, { hasLead: false, touched_by: ME }));
  assert.ok(!canMark(manager, { hasLead: false, touched_by: OTHER }));
  assert.ok(canMark({ id: OTHER, role: "head" }, { hasLead: true, leadOwner: ME }));
  assert.ok(canMark({ id: OTHER, role: "admin" }, { hasLead: false, touched_by: ME }));

  // Действие ходит через markStage, а markStage — через canMark и журнал.
  const store = read("lib/admin/sales-stages-store.ts");
  assert.match(store, /const ok = canMark\(staff, \{/);
  assert.match(store, /if \(!ok\) return "forbidden";/);
  assert.match(store, /record\("lead\.sales_marked"/);
  assert.match(read("app/admin/hq/actions.ts"), /await markStage\(/);
  assert.match(read("lib/admin/audit.ts"), /"lead\.sales_marked"/);
  // Карточка лида показывает кнопки только тому, кто может менять лид.
  assert.match(read("app/admin/leads/[id]/page.tsx"), /\{mine \? \(\s*<div className="mt-3 flex flex-wrap items-start gap-2">\s*\{!deal\?\.at\.interest/);

  assert.equal(parseAmount("1 200"), 1200);
  assert.equal(parseAmount("$500"), 500);
  assert.equal(parseAmount("0"), null);
  assert.equal(parseAmount("12.5"), null);
  assert.equal(parseAmount("abc"), null);
});

test("деньги — только владельцу", () => {
  const input: StageInput = {
    ...none,
    prospects: [prospect({ id: "p1", replied_at: ago(5), lead_id: "l1" })],
    leads: [lead({ id: "l1" })],
    payments: [{ lead_id: "l1", paid_on: "2026-10-15", amount_usd: 1700 }],
    marks: [{ kind: "priced", lead_id: "l1", prospect_id: null, staff_id: ME, created_at: ago(3), via: null, amount_usd: 1700 }],
  };
  const deals = dealsOf(input);
  assert.ok(seesStagesMoney("admin"));
  assert.ok(!seesStagesMoney("head"));
  assert.ok(!seesStagesMoney("manager"));
  assert.equal(stagesPulse(deals, "admin", NOW).paidUsd30, 1700);
  assert.equal(stagesPulse(deals, "head", NOW).paidUsd30, null);
  assert.equal(stagesPulse(deals, "head", NOW).month.paid, 1, "сама оплата — не деньги: её видно всем");
  for (const d of withoutMoney(deals, "head")) assert.ok(d.paidUsd === 0 && d.priceUsd === null);

  const owner = renderToStaticMarkup(createElement(StagesCard, { stages: stagesPulse(deals, "admin", NOW), locale: "ru" }));
  const head = renderToStaticMarkup(createElement(StagesCard, { stages: stagesPulse(deals, "head", NOW), locale: "ru" }));
  assert.match(owner, /\$1[\s,.]?700/);
  assert.ok(!head.includes("$"), "у руководителя в блоке нет долларов");
  // Сумма цены в карточке лида — тоже только владельцу.
  assert.match(read("app/admin/leads/[id]/page.tsx"), /deal\?\.priceUsd && seesStagesMoney\(staff\.role\)/);
});

test("блок рисуется на трёх языках: каждое число — ссылка в список ступени", () => {
  const deals = dealsOf({ ...none, prospects: [prospect({ id: "p1", replied_at: ago(5) })] });
  for (const locale of PANEL_LOCALES) {
    const html = renderToStaticMarkup(createElement(StagesCard, { stages: stagesPulse(deals, "admin", NOW), locale }));
    for (const s of STAGES) {
      assert.ok(html.includes(`/admin/hq/stages?stage=${s}&amp;period=7`), `${locale}: ${s} за 7 дней`);
      assert.ok(html.includes(`/admin/hq/stages?stage=${s}&amp;period=30`), `${locale}: ${s} за 30 дней`);
    }
    if (locale !== "ru") assert.ok(!/[а-яё]/i.test(html.replace(/<[^>]+>/g, "")), `${locale}: русский текст в блоке`);
  }
  const ru = renderToStaticMarkup(createElement(StagesCard, { stages: stagesPulse(deals, "admin", NOW), locale: "ru" }));
  assert.match(ru, /из 1 компании, которым написали, ответили 1/);
  // На «Главной» — в пульсе, с «?» рядом; карточка «Лиды» подписана честно.
  const hq = read("components/admin/hq.tsx");
  assert.match(hq, /<StagesCard stages=\{hq\.stages\}/);
  assert.match(hq, /caption=\{hq\.stages \? st\.leadsCaption : t\.leadsInWork\}/);
  assert.match(read("components/admin/sales-stages.tsx"), /helpAnchor\("\/admin\/hq", "stages"\)/);
});

test("норма «2 показа в неделю»: горит с пятницы, если показов 0", () => {
  assert.equal(SHOW_NORM, 2);
  const thu = NOW;
  const fri = new Date("2026-10-16T07:00:00Z");
  const sun = new Date("2026-10-18T10:00:00Z");
  const mon = new Date("2026-10-19T05:00:00Z");
  assert.deepEqual(showNorm(0, thu), { done: 0, target: 2, hot: false }, "четверг — ещё не горит");
  assert.equal(showNorm(0, fri).hot, true);
  assert.equal(showNorm(0, sun).hot, true);
  assert.equal(showNorm(1, fri).hot, false, "один показ есть — не горит");
  assert.equal(showNorm(0, mon).hot, false, "новая неделя");

  // Неделя — с понедельника: показ прошлой недели в эту не идёт.
  const deals = dealsOf({
    ...none,
    prospects: [prospect({ id: "p1", replied_at: ago(200), lead_id: "l1" })],
    leads: [lead({ id: "l1" })],
    marks: [
      { kind: "shown", lead_id: "l1", prospect_id: null, staff_id: ME, created_at: ago(2), via: "live", amount_usd: null },
      { kind: "shown", lead_id: "l1", prospect_id: null, staff_id: ME, created_at: ago(24), via: "live", amount_usd: null },
    ],
  });
  const mine = myStagesOf(deals, ME, fri);
  assert.equal(mine.norm.done, 1, "две отметки по одному клиенту — один показ, самый ранний");
  const theirs = myStagesOf(deals, OTHER, fri);
  assert.equal(theirs.norm.done, 0);
  assert.equal(theirs.norm.hot, true);

  const html = renderToStaticMarkup(createElement(MyStagesCard, { stages: theirs, locale: "ru" }));
  assert.match(html, /class="[^"]*hq-hot/, "горит — той же анимацией, что остальные «горит»");
  assert.match(html, /data-norm="hot"/);
  const calm = renderToStaticMarkup(createElement(MyStagesCard, { stages: myStagesOf(deals, ME, thu), locale: "ru" }));
  assert.ok(!calm.includes("hq-hot"));
  // На «Главной» менеджера — блок и «Показал макет» у макета.
  const my = read("components/admin/hq-my.tsx");
  assert.match(my, /<MyStagesCard stages=\{my\.stages\}/);
  assert.match(my, /<ShownButton leadId=\{m\.leadId\}/);
});

test("недельная строка: понедельник с 10:00, раз в неделю, только о тех, у кого макет без показа", () => {
  const mon10 = new Date("2026-10-19T05:00:00Z"); // 10:00 по Ташкенту
  const mon9 = new Date("2026-10-19T04:30:00Z");
  const mon18 = new Date("2026-10-19T13:00:00Z");
  const tue = new Date("2026-10-20T05:00:00Z");
  assert.ok(noShowDue(mon10));
  assert.ok(noShowDue(mon18));
  assert.ok(!noShowDue(mon9), "до 10:00 — рано");
  assert.ok(!noShowDue(tue), "только понедельник");
  assert.equal(noShowKey(mon10), "no-shows:2026-10-12", "ключ — понедельник прошлой недели");
  assert.equal(noShowKey(mon18), noShowKey(mon10), "весь понедельник — один ключ: второй проход не напишет");
  assert.notEqual(noShowKey(new Date("2026-10-26T05:00:00Z")), noShowKey(mon10), "следующая неделя — новый ключ");

  const lastWeek = (h: number) => new Date(mon10.getTime() - (5 + h) * 3600_000 - 2 * 24 * 3600_000).toISOString();
  const deals = dealsOf({
    ...none,
    prospects: [prospect({ id: "a", replied_at: lastWeek(10) }), prospect({ id: "b", touched_by: OTHER, replied_at: lastWeek(10) })],
    mockups: [
      { lead_id: null, prospect_id: "a", sent_at: lastWeek(5) },
      { lead_id: null, prospect_id: "b", sent_at: lastWeek(5) },
    ],
    marks: [{ kind: "shown", lead_id: null, prospect_id: "b", staff_id: OTHER, created_at: lastWeek(1), via: "video", amount_usd: null }],
  });
  const rows = noShowRows(deals, [{ id: ME, name: "Данил" }, { id: OTHER, name: "Аня" }, { id: "x", name: "Без макетов" }], mon10);
  assert.deepEqual(noShowNames(rows).map((r) => r.name), ["Данил"], "без макетов — не упрёк; с показом — тоже");
  assert.match(noShowText(rows) ?? "", /Данил — 1 макет, показов 0/);
  assert.equal(noShowText(rows.filter((r) => r.name !== "Данил")), null, "некого назвать — строки нет");

  const store = read("lib/admin/sales-stages-store.ts");
  assert.match(store, /if \(!noShowDue\(now\)\) return 0;/);
  assert.match(store, /\.from\("team_news_sent"\)\s*\.upsert\(\{ news_id: key, staff_id: reader\.id \}/, "отметка до сообщения");
  assert.match(store, /wants\(\(s\.notify_off as string\[\] \| null\) \?\? \[\], "reports"\)/, "под галочкой «Отчёты»");
  assert.match(read("app/api/reminders/sweep/route.ts"), /await runNoShowWeek\(new Date\(\)\)/);
});

test("отчёт 18:00: у каждого — показы, цены и оплаты за день и неделю", () => {
  const report = read("lib/admin/staff-report.ts");
  assert.match(report, /lines\.push\(`  \$\{salesLine\(p\)\}`\)/);
  assert.match(read("lib/admin/staff-report-store.ts"), /day: personSales\(deals, person\.id, from\.getTime\(\), to\.getTime\(\)\)/);
});

test("без модели и без Firecrawl", () => {
  for (const f of ["lib/admin/sales-stages.ts", "lib/admin/sales-stages-store.ts", "components/admin/sales-stages.tsx", "app/admin/hq/stages/page.tsx"]) {
    const src = read(f);
    assert.ok(!/anthropic|claude-|firecrawl|completeText|askModel/i.test(src), `${f}: модель или Firecrawl`);
  }
});
