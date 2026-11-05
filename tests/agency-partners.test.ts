import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  AGENCY_FINDER_MONTHS,
  AGENCY_FINDER_PERCENT,
  accrualsOf,
  foundersPool,
  ownerShare,
  type Earner,
  type ProjectMoney,
} from "@/lib/admin/finance";
import { SECTIONS } from "@/lib/admin/roles";
import { agencyMoney, type AgencyMoneyProject } from "@/lib/partners/agency";
import {
  AGENCY_PERCENT,
  agencyFinder,
  finderUntil,
  finderUntilDay,
  partnerAccrualOf,
  partnerPercent,
  type PartnerProject,
} from "@/lib/partners/rules";

/**
 * Агентства — партнёры студии (владелец, 05.11.2026): «Надо зафиксировать
 * условия для агентств: 15% с оборота проекта фиксировано. Для наших
 * менеджеров: те кто привел агентство и завел его у нас — они на 12 месяцев
 * получают 5% с оборота этого агентства».
 */

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const AGENCY = {
  id: "ag1",
  percent_override: null,
  kind: "agency" as const,
  brought_by: "mgr",
  brought_at: "2026-11-05T09:00:00Z",
};

function project(over: Partial<AgencyMoneyProject> = {}): AgencyMoneyProject {
  return {
    id: "p1",
    created_at: "2026-12-01T10:00:00Z",
    owner_staff_id: "other",
    kind: "new",
    amount_usd: 2000,
    tax_percent: 4,
    dev_cost_usd: 600,
    stage: "in_progress",
    partner_id: "ag1",
    partner_percent: null,
    partner_void_reason: null,
    partner_model: "profit",
    ...over,
  };
}

test("условия записаны константами: 15% агентству, 5% тому, кто привёл, 12 месяцев", () => {
  assert.equal(AGENCY_PERCENT, 15);
  assert.equal(AGENCY_FINDER_PERCENT, 5);
  assert.equal(AGENCY_FINDER_MONTHS, 12);
});

test("агентству — 15% с суммы проекта всегда: без ступеней, личной ставки и копилки", () => {
  // Ступени у человека по ссылке: $40 000 с оборота — 20%; у агентства — 15%.
  assert.equal(partnerPercent({ projectPercent: null, partnerOverride: null, amountUsd: 40_000, model: "turnover", agency: true }), 15);
  assert.equal(partnerPercent({ projectPercent: null, partnerOverride: 25, amountUsd: 1000, agency: true }), 15);
  // Процент, поставленный владельцем на проекте, — главнее.
  assert.equal(partnerPercent({ projectPercent: 18, partnerOverride: null, amountUsd: 1000, agency: true }), 18);

  // С оборота, даже если на заявке записалась модель «от прибыли»: 2000 × 15% = 300.
  const line = partnerAccrualOf(project({ partner_bonus_percent: 30 } as Partial<PartnerProject>), [], AGENCY);
  assert.equal(line?.model, "turnover");
  assert.equal(line?.percent, 15);
  assert.equal(line?.amount_usd, 300);
  assert.equal(line?.state, "frozen");
  // Оплачен целиком — заработано.
  assert.equal(partnerAccrualOf(project(), [{ project_id: "p1", amount_usd: 2000 }], AGENCY)?.state, "earned");
  // Человек по ссылке — как раньше, по ступени своей модели.
  assert.equal(partnerAccrualOf(project(), [], { id: "ag1", percent_override: null, kind: "person" })?.percent, 10);
});

test("5% тому, кто привёл: только проекты, заведённые в его 12 месяцах", () => {
  assert.equal(finderUntilDay(AGENCY.brought_at), "05.11.2027");
  assert.equal(finderUntil(null), null);
  assert.equal(agencyFinder(project(), AGENCY), "mgr");
  // В последний день срока — ещё его, через год — уже нет.
  assert.equal(agencyFinder(project({ created_at: "2027-11-05T08:59:00Z" }), AGENCY), "mgr");
  assert.equal(agencyFinder(project({ created_at: "2027-11-05T09:00:00Z" }), AGENCY), null);
  // Проект, заведённый раньше агентства, — не через агентство.
  assert.equal(agencyFinder(project({ created_at: "2026-11-01T10:00:00Z" }), AGENCY), null);
  // Не агентство, никто не привёл, чужой проект — никому.
  assert.equal(agencyFinder(project(), { ...AGENCY, kind: "person" }), null);
  assert.equal(agencyFinder(project(), { ...AGENCY, brought_by: null }), null);
  assert.equal(agencyFinder(project({ partner_id: "other" }), AGENCY), null);
  assert.equal(agencyFinder(project(), undefined), null);
});

const EARNERS = new Map<string, Earner>([
  ["other", { id: "other", grade: "manager", rate_percent: null, head_staff_id: null, founder_percent: null }],
  ["mgr", { id: "mgr", grade: "manager", rate_percent: null, head_staff_id: null, founder_percent: null }],
]);

function money(over: Partial<ProjectMoney> = {}): ProjectMoney {
  return {
    id: "p1",
    owner_staff_id: "other",
    kind: "new",
    amount_usd: 2000,
    tax_percent: 4,
    dev_cost_usd: 600,
    stage: "in_progress",
    agency_finder: "mgr",
    ...over,
  };
}

test("строка «за агентство» в начислениях: 5% с суммы, сверху доли ведущего", () => {
  const lines = accrualsOf(money(), [], EARNERS);
  const agency = lines.find((a) => a.share === "agency");
  assert.deepEqual(agency, {
    project_id: "p1",
    staff_id: "mgr",
    share: "agency",
    percent: 5,
    manual: false,
    amount_usd: 100,
    state: "frozen",
  });
  // Доля ведущего — как без агентства: 15% от прибыли (2000 − 80 − 600 = 1320) = 198.
  assert.equal(lines.find((a) => a.share === "owner")?.amount_usd, 198);
  // Ведёт тот же, кто привёл, — две строки: ведущего и за агентство.
  const same = accrualsOf(money({ owner_staff_id: "mgr" }), [], EARNERS);
  assert.deepEqual(same.map((a) => a.share).sort(), ["agency", "owner"]);
  // Ручной процент по сделке строку «за агентство» не меняет.
  const manual = accrualsOf(money({ owner_staff_id: "mgr" }), [], EARNERS, new Map([["mgr", 30]]));
  assert.equal(manual.find((a) => a.share === "agency")?.percent, 5);
  assert.equal(manual.find((a) => a.share === "owner")?.percent, 30);
  // Без ведущего строка всё равно есть; отменённый — ноль; оплачен — заработано.
  assert.equal(accrualsOf(money({ owner_staff_id: null }), [], EARNERS).length, 1);
  assert.equal(accrualsOf(money({ stage: "cancelled" }), [], EARNERS).find((a) => a.share === "agency")?.amount_usd, 0);
  assert.equal(
    accrualsOf(money(), [{ project_id: "p1", amount_usd: 2000 }], EARNERS).find((a) => a.share === "agency")?.state,
    "earned",
  );
  // Не агентство — строки нет.
  assert.equal(accrualsOf(money({ agency_finder: null }), [], EARNERS).some((a) => a.share === "agency"), false);
});

test("5% за агентство вычитаются из того, что остаётся студии", () => {
  const p = money();
  const paid = [{ project_id: "p1", amount_usd: 2000 }];
  const lines = accrualsOf(p, paid, EARNERS);
  // 1320 − 198 − 100 = 1022.
  assert.equal(ownerShare(p, lines), 1022);
  assert.equal(foundersPool([p], paid, lines, []).earned, 1022);
});

test("деньги агентства на вкладке: проекты, сумма, 15% агентству и 5% тому, кто привёл", () => {
  const projects = [
    project(),
    project({ id: "p2", amount_usd: 1000, created_at: "2028-01-10T10:00:00Z" }),
    project({ id: "p3", amount_usd: 5000, stage: "cancelled" }),
    project({ id: "p4", partner_id: "other" }),
  ];
  const m = agencyMoney(AGENCY, projects, [{ project_id: "p1", amount_usd: 2000 }]);
  assert.equal(m.projects, 2);
  assert.equal(m.turnover, 3000);
  assert.deepEqual(m.agency, { earned: 300, frozen: 150 });
  // p2 заведён после срока — 5% только с p1.
  assert.equal(m.finderProjects, 1);
  assert.deepEqual(m.finder, { earned: 100, frozen: 0 });
});

test("завести агентство может любой из команды, кто привёл — менеджер сам; поправить — только владелец", () => {
  const store = read("lib/partners/store.ts");
  const add = store.slice(store.indexOf("export async function createAgencyPartner"), store.indexOf("async function activeStaffId"));
  assert.match(add, /let broughtBy: string \| null = staff\.id;/);
  assert.match(add, /if \(PARTNER_DESK\.includes\(staff\.role\) && fields\.broughtBy !== undefined\)/);
  assert.match(add, /kind: "agency"/);
  assert.match(add, /payout_model: "turnover"/);
  assert.match(add, /if \(await agencyTaken\(db, name, contact\)\) return \{ ok: false, reason: "duplicate" \};/);
  assert.match(add, /record\("partner\.agency_created"/);
  const fix = store.slice(store.indexOf("export async function setAgencyFinder"), store.indexOf("export async function agencyPartners"));
  assert.match(fix, /if \(admin\.role !== "admin"\) return \{ ok: false, reason: "forbidden" \};/);
  assert.match(fix, /record\("partner\.agency_finder"/);
  // У агентства модель не выбирают.
  assert.match(store, /if \(partner\.kind === "agency"\) return \{ ok: false, reason: "invalid" \};/);

  const actions = read("app/admin/agencies/actions.ts");
  assert.match(actions, /const staff = await requireSection\("\/admin\/agencies"\);/);
  assert.match(actions, /const admin = await requireAdmin\(\);/);
  assert.match(read("app/admin/agencies/page.tsx"), /const staff = await requireSection\("\/admin\/agencies"\);/);
});

test("вкладка «Агентства» — у «Партнёров», всем ролям", () => {
  const tab = SECTIONS.find((s) => s.href === "/admin/agencies");
  assert.equal(tab?.parent, "/admin/partners");
  assert.deepEqual([...(tab?.roles ?? [])].sort(), ["admin", "head", "manager"]);
});

test("заявка агентства узнаётся первой, проекты агентства — в финансах того, кто привёл", () => {
  const attribute = read("lib/partners/attribute.ts");
  assert.ok(
    attribute.indexOf("attributeAgencyPartnerLead(leadId") < attribute.indexOf("attributeAgencyLead(leadId"),
    "агентство-партнёр проверяется раньше агентства партнёра",
  );
  const ledger = read("lib/admin/ledger.ts");
  assert.match(ledger, /agencyProjectsOf\(scope\)/);
  assert.match(ledger, /const projects = merged\.map\(\(p\) => withFinder\(p, partners\)\);/);
  // Карточка проекта считает 5% тем же правилом.
  assert.match(read("app/admin/projects/[id]/page.tsx"), /accrualsOf\(withFinder\(project, finders\)/);
});

test("миграция: тип партнёра, контакт, кто привёл и когда", () => {
  const sql = read("supabase/migrations/0177_agency_partners.sql");
  assert.match(sql, /add column if not exists kind text not null default 'person'/);
  assert.match(sql, /check \(kind in \('person', 'agency'\)\)/);
  assert.match(sql, /add column if not exists brought_by uuid references public\.staff \(id\) on delete set null/);
  assert.match(sql, /add column if not exists brought_at timestamptz/);
  assert.match(read("supabase/migrations/0177_agency_partners.down.sql"), /drop column if exists kind/);
});

/* ── Презентация: на сайте — только 15% агентства, в панели — всё ─────── */

test("презентация на сайте: шесть языков, одни пункты, ставка из правил денег", async () => {
  const { agencyDeckCopy } = await import("@/content/agency-deck");
  const { locales } = await import("@/lib/i18n");
  const ru = agencyDeckCopy("ru");
  for (const locale of locales) {
    const t = agencyDeckCopy(locale);
    assert.deepEqual(Object.keys(t).sort(), Object.keys(ru).sort(), `${locale}: ключи разошлись`);
    assert.equal(t.steps.length, 3, `${locale}: три шага`);
    assert.equal(t.rules.length, ru.rules.length, `${locale}: правила`);
    if (locale !== "ru") assert.notEqual(t.title, ru.title, `${locale}: не переведено`);
    const text = JSON.stringify(t);
    assert.ok(text.includes(`${AGENCY_PERCENT}%`), `${locale}: ставка агентства не та, что в правилах`);
  }
  const page = read("app/[locale]/partners/deck/agency/page.tsx");
  assert.match(page, /noIndex: true/, "презентация попадёт в поиск");
  assert.match(page, /Math\.round\(\(amount \* AGENCY_PERCENT\) \/ 100\)/, "пример не по правилам денег");
});

test("на клиентском сайте процента менеджера нет, в панели — есть", async () => {
  const { agencyDeckCopy } = await import("@/content/agency-deck");
  const { locales } = await import("@/lib/i18n");
  const page = read("app/[locale]/partners/deck/agency/page.tsx");
  assert.ok(!/AGENCY_FINDER/.test(page.replace(/\/\*\*[\s\S]*?\*\//g, "")), "страница для агентства берёт процент менеджера");
  for (const locale of locales) {
    const text = JSON.stringify(agencyDeckCopy(locale));
    // «5%» отдельно, а не хвост «15%».
    assert.ok(!new RegExp(`(^|[^\\d])${AGENCY_FINDER_PERCENT}\\s?%`).test(text), `${locale}: на сайте процент того, кто привёл`);
  }
  const panel = read("app/admin/agencies/page.tsx");
  assert.match(panel, /t\.getsFinder\(AGENCY_FINDER_PERCENT, AGENCY_FINDER_MONTHS\)/);
  assert.match(panel, /t\.getsAgency\(AGENCY_PERCENT\)/);
  assert.match(panel, /\/partners\/deck\/agency/);
});
