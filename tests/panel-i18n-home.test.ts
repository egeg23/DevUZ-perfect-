import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  BestOfWeek,
  CashChart,
  ContractsToSign,
  ExpectedPayments,
  PlanFactBlock,
  ReviewCard,
  StuckLeads,
  TaxesSoon,
  TeamReviews,
  TeamTable,
  type TeamRow,
} from "@/components/admin/dashboard";
import { Bars, WeeklyBars } from "@/components/admin/bars";
import { LeadTable } from "@/components/admin/lead-table";
import { PanelLocaleProvider } from "@/components/admin/panel-locale";
import { TouchPlanLine } from "@/components/admin/touch-plan-line";
import { PANEL_LOCALES, type PanelLocale } from "@/lib/admin/i18n";
import type { LeadRow } from "@/lib/admin/leads";
import type { StaffPulse } from "@/lib/admin/pulse";
import { planLine, touchProgress } from "@/lib/admin/touch-plan";

/**
 * Главная панели (раздел «Лиды») на трёх языках.
 *
 * Рисуем то, что рисуется из пропсов без базы: список лидов, строку плана
 * касаний, блоки дашборда. В узбекском и польском не должно остаться
 * русского текста — кроме данных (имена, компании, рекомендации модели),
 * которые подставлены здесь же и из проверки вырезаются.
 */

const CYRILLIC = /[а-яё]/i;

/** Данные из базы: их панель не переводит. */
const DATA = ["Азиза Каримова", "ООО Ромашка", "Бекзод", "Мадина", "Сайт для клиники", "Клиника «Шифо»", "Рекомендация модели", "Сделать звонок"];

function visibleText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/g, " ");
  for (const d of DATA) text = text.split(d).join(" ");
  return text;
}

function labels(html: string): string[] {
  return [...html.matchAll(/(?:title|aria-label|data-label)="([^"]*)"/g)].map((m) => m[1]);
}

/** Текст <title> внутри svg — тоже видим: всплывает при наведении. */
function assertNoRussian(html: string, where: string) {
  const text = visibleText(html);
  assert.ok(!CYRILLIC.test(text), `${where}: русское на экране: ${text.match(/\S*[а-яё]\S*/i)}`);
  for (const label of labels(html)) {
    assert.ok(!CYRILLIC.test(label), `${where}: русская подпись «${label}»`);
  }
}

const render = (locale: PanelLocale, el: ReactElement) =>
  renderToStaticMarkup(createElement(PanelLocaleProvider, { locale, children: el }));

const lead = (patch: Partial<LeadRow>): LeadRow =>
  ({
    id: "11111111-2222",
    created_at: "2026-09-28T03:40:00Z",
    request_no: "DU-1042",
    source: "site",
    locale: "ru",
    contact_name: "Азиза Каримова",
    company: "ООО Ромашка",
    niche: "clinic",
    services: [],
    budget: "B1",
    timing: null,
    score: 82,
    grade: "A",
    priority: "hot",
    status: "taken",
    assigned_to: "Бекзод",
    assigned_staff_id: "s-1",
    discount_granted: false,
    discount_reason: null,
    partner_id: null,
    partner_code: null,
    partner_ref_at: null,
    ...patch,
  }) as LeadRow;

const pulse = (patch: Partial<StaffPulse> = {}): StaffPulse => ({
  staffId: "s-1",
  inWork: 4,
  taken: 2,
  won: 1,
  lost: 0,
  contacts: 3,
  touches: 12,
  revenue: 1500,
  stuck: [{ id: "l-1", label: "DU-1042", priority: "warm", days: 5, staffId: "s-1" }],
  ...patch,
});

const teamRows: TeamRow[] = [
  { id: "s-1", name: "Бекзод", week: pulse(), prev: pulse({ touches: 8 }), due: 300, touch: touchProgress(30, 18) },
  { id: "s-2", name: "Мадина", week: pulse({ revenue: 0, won: 0 }), prev: pulse(), due: 0, touch: touchProgress(null, 4) },
];

const review = {
  id: "r-1",
  staff_id: "s-1",
  kind: "weekly" as const,
  period_start: "2026-09-28",
  created_at: "2026-09-28T01:00:00Z",
  body: {
    headline: "Рекомендация модели",
    last_period: "Рекомендация модели",
    wins: ["Рекомендация модели"],
    attention: ["Рекомендация модели"],
    actions: ["Сделать звонок"],
    learn: ["Рекомендация модели"],
  },
};

/** Всё, что рисуется из пропсов, — одним куском на заданном языке. */
function homeParts(locale: PanelLocale): Record<string, ReactElement> {
  return {
    LeadTable: createElement(LeadTable, {
      locale,
      rows: [lead({}), lead({ id: "33333333-4444", request_no: null, budget: "B3", priority: "nurture", status: "new", assigned_to: null })],
    }),
    "LeadTable пустой": createElement(LeadTable, { locale, rows: [] }),
    TouchPlanLine: createElement(TouchPlanLine, { progress: touchProgress(30, 18) }),
    "TouchPlanLine закрыт": createElement(TouchPlanLine, { progress: touchProgress(30, 41) }),
    StuckLeads: createElement(StuckLeads, { locale, rows: pulse().stuck, names: new Map([["s-1", "Бекзод"]]) }),
    "StuckLeads пустой": createElement(StuckLeads, { locale, rows: [] }),
    PlanFactBlock: createElement(PlanFactBlock, {
      locale,
      canAdd: true,
      canEdit: true,
      staffOptions: [{ id: "s-1", name: "Бекзод" }],
      plans: [
        { id: "p-1", staff_id: "s-1", period: "week", period_start: "2026-09-28", metric: "won", target: 3, fact: 1, percent: 33, staffName: "Бекзод" },
        { id: "p-2", staff_id: "s-1", period: "month", period_start: "2026-09-01", metric: "revenue_usd", target: 5000, fact: 1500, percent: 30 },
      ],
    }),
    "PlanFactBlock без плана": createElement(PlanFactBlock, { locale, canAdd: false, canEdit: false, staffOptions: [], plans: [] }),
    TeamTable: createElement(TeamTable, { locale, rows: teamRows, showMoney: true }),
    BestOfWeek: createElement(BestOfWeek, { locale, rows: teamRows }),
    CashChart: createElement(CashChart, {
      locale,
      rows: [
        { month: "2026-08", revenue: 12000, expenses: 4000, profit: 8000 },
        { month: "2026-09", revenue: 3000, expenses: 5000, profit: -2000 },
      ],
    }),
    ContractsToSign: createElement(ContractsToSign, {
      locale,
      rows: [{ id: "c-1", number: "17", client_name: "Клиника «Шифо»", amount_usd: 2400, sent_at: null }],
    }),
    "ContractsToSign пустой": createElement(ContractsToSign, { locale, rows: [] }),
    ExpectedPayments: createElement(ExpectedPayments, {
      locale,
      names: new Map([["s-1", "Бекзод"]]),
      rows: [
        {
          project: { id: "pr-1", title: "Сайт для клиники", client: "ООО Ромашка", owner_staff_id: "s-1", amount_usd: 3000, stage: "build" },
          paid: 1000,
          remaining: 2000,
        },
      ],
    }),
    "ExpectedPayments пустой": createElement(ExpectedPayments, { locale, names: new Map(), rows: [] }),
    TaxesSoon: createElement(TaxesSoon, {
      locale,
      rows: [
        { id: "turnover", title: "Налог с оборота", what: "—", recurrence: { kind: "monthly", day: 15 }, verified: false, due: "2026-10-15", daysLeft: 3 },
        { id: "annual", title: "Годовая отчётность", what: "—", recurrence: { kind: "yearly", month: 4, day: 1 }, verified: true, due: "2026-09-29", daysLeft: 0 },
      ],
    }),
    ReviewCard: createElement(ReviewCard, { locale, review, title: "x", canRefresh: true }),
    "ReviewCard пустой (день)": createElement(ReviewCard, { locale, review: null, title: "x", daily: true }),
    "ReviewCard пустой (неделя)": createElement(ReviewCard, { locale, review: null, title: "x" }),
    TeamReviews: createElement(TeamReviews, {
      locale,
      rows: [
        { name: "Бекзод", review },
        { name: "Мадина", review: null },
      ],
    }),
    Bars: createElement(Bars, { locale, rows: [] }),
    WeeklyBars: createElement(WeeklyBars, { locale, rows: [{ key: "2026-09-21", count: 4 }] }),
    "WeeklyBars пустой": createElement(WeeklyBars, { locale, rows: [] }),
  };
}

test("главная на узбекском и польском: в блоках нет русского, кроме данных", () => {
  for (const locale of ["uz", "pl"] as const) {
    for (const [name, el] of Object.entries(homeParts(locale))) {
      assertNoRussian(render(locale, el), `${locale} ${name}`);
    }
  }
});

test("главная на русском: подписи на месте, как были", () => {
  const html = Object.values(homeParts("ru"))
    .map((el) => render("ru", el))
    .join("\n");
  for (const text of [
    "Когда",
    "Бюджет",
    "назван и утверждён",
    "горячий",
    "в работе",
    "Под фильтр ничего не попало.",
    "До плана осталось 12 — сделано 18 из 30 за эту неделю.",
    "Срочно связаться: 1",
    "без движения 5 дней",
    "План и факт",
    "Поставить план",
    "Команда за эту неделю",
    "План касаний",
    "осталось 12",
    "Лучшие за неделю",
    "Касса по месяцам",
    "авг 26",
    "Договоры на подпись: 1",
    "Ожидаем оплат: $2,000",
    "Налог с оборота",
    "через 3 дня",
    "сегодня",
    "Собирается каждое утро с семи по Ташкенту.",
    "Собирается по понедельникам",
    "Рекомендации команде на неделю",
    "нет данных",
  ]) {
    assert.ok(html.includes(text), `нет «${text}»`);
  }
});

test("узбекский и польский: ключевые подписи переведены по глоссарию", () => {
  const uz = Object.values(homeParts("uz")).map((el) => render("uz", el)).join("\n");
  for (const text of ["Zudlik bilan bog‘lanish: 1", "Reja va fakt", "Aloqalar rejasi", "Holat", "issiq", "5 kundan beri harakatsiz"]) {
    assert.ok(uz.includes(text), `uz: нет «${text}»`);
  }
  const pl = Object.values(homeParts("pl")).map((el) => render("pl", el)).join("\n");
  for (const text of ["Pilny kontakt: 1", "Plan i wykonanie", "Plan kontaktów", "Status", "gorący", "bez ruchu od 5 dni", "za 3 dni"]) {
    assert.ok(pl.includes(text), `pl: нет «${text}»`);
  }
});

test("дата в списке лидов — по Ташкенту и в формате языка панели", () => {
  // 03:40 UTC — это 08:40 в Ташкенте на любом языке.
  for (const locale of PANEL_LOCALES) {
    const html = render(locale, createElement(LeadTable, { locale, rows: [lead({})] }));
    assert.match(html, /08:40/, `${locale}: не ташкентское время`);
  }
});

test("строка плана касаний: русский текст прежний, у поляков — формы слова", () => {
  assert.equal(planLine(touchProgress(30, 18)), "До плана осталось 12 — сделано 18 из 30 за эту неделю.");
  assert.equal(planLine(touchProgress(30, 41)), "План на неделю закрыт: 41 касаний из 30.");
  assert.equal(planLine(touchProgress(1, 2), "pl"), "Plan na tydzień wykonany: 2 kontakty z 1.");
  assert.equal(planLine(touchProgress(0, 0), "uz"), "Bu haftaga reja yo‘q.");
  assert.equal(planLine(touchProgress(null, 3), "pl"), null);
});

/**
 * Страница и дашборд роли без базы не рисуются, поэтому для них — проверка
 * исходника: вне комментариев русского текста нет, всё берётся из словаря.
 */
test("главная и её блоки: весь текст — из словаря, в коде только комментарии по-русски", async () => {
  const { readFileSync } = await import("node:fs");
  const files = [
    "app/admin/page.tsx",
    "components/admin/dashboard-home.tsx",
    "components/admin/dashboard.tsx",
    "components/admin/lead-table.tsx",
    "components/admin/sweep-banner.tsx",
    "components/admin/touch-plan-line.tsx",
    "components/admin/bars.tsx",
  ];
  for (const file of files) {
    const code = readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/\s\/\/ .*$/gm, "");
    const line = code.split("\n").find((l) => CYRILLIC.test(l));
    assert.equal(line, undefined, `${file}: русский текст мимо словаря: ${line?.trim()}`);
  }
  const page = readFileSync(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
  assert.match(page, /const t = pick\(homeDict, locale\)/);
  assert.match(page, /<SweepBanner locale=\{locale\} \/>/);
  assert.match(page, /<LeadTable rows=\{leads\.rows\} locale=\{locale\} \/>/);
});
