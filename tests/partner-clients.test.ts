import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  CLIENT_TERM_MONTHS,
  CLIENT_WAIT_DAYS,
  MAX_CLIENTS_PER_MONTH,
  autoPayoutDue,
  clientCounts,
  clientFieldsProblem,
  companyMatch,
  clientUntil,
  clientUntilDay,
  hostKey,
  normalizeInn,
  partnerAccrualOf,
  partnerBalanceOf,
  sameCompany,
  tashkentMonth,
} from "@/lib/partners/rules";

/**
 * Клиент, закреплённый партнёром вручную по ИНН, и автовыплата с оборота.
 *
 * Владелец, 01.10: «Кто-то будет приводить свои компании не через ссылку —
 * надо закрыть эту дыру» и «Расчёт с оборота происходит автоматически,
 * когда мы получаем 100 % суммы».
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

/* ── ИНН, сайт, «та же компания» ────────────────────────────────────────── */

test("ИНН — 9–12 цифр, пробелы и дефисы из документов убираются", () => {
  assert.equal(normalizeInn("305 123 456"), "305123456");
  assert.equal(normalizeInn("305-123-456"), "305123456");
  assert.equal(normalizeInn("123456789012"), "123456789012");
  assert.equal(normalizeInn("12345678"), null, "8 цифр — не ИНН");
  assert.equal(normalizeInn("1234567890123"), null, "13 цифр — не ИНН");
  assert.equal(normalizeInn("30512345A"), null);
  assert.equal(normalizeInn(""), null);
  assert.equal(normalizeInn(null), null);
});

test("сайт сравнивается по домену: схема, www, путь и регистр не важны", () => {
  assert.equal(hostKey("https://www.Shop.uz/ru/catalog"), "shop.uz");
  assert.equal(hostKey("shop.uz"), "shop.uz");
  assert.equal(hostKey("http://shop.uz:8080"), "shop.uz");
  assert.equal(hostKey("не сайт"), "");
  assert.equal(hostKey(""), "");
});

test("название повторилось — решает ИНН; контакт и сайт — признак сильнее ИНН", () => {
  // Владелец, 02.10: «Проверяем по названию; если название повторяется — по ИНН».
  assert.equal(companyMatch({ name: "Тандыр Групп" }, { name: "ООО Тандыр групп" }), "name", "ИНН нет ни у кого — та же");
  assert.equal(companyMatch({ name: "Тандыр Групп", inn: "305123456" }, { name: "Тандыр групп" }), "name", "у второй ИНН нет — различить нечем");
  assert.equal(companyMatch({ name: "Тандыр Групп" }, { name: "Тандыр групп", inn: "305123456" }), "name");
  assert.equal(
    companyMatch({ name: "Тандыр Групп", inn: "305123456" }, { name: "Тандыр групп", inn: "309999999" }),
    null,
    "разный ИНН при одном названии — разные компании",
  );
  assert.equal(companyMatch({ name: "Другое", inn: "305123456" }, { name: "Тандыр", inn: "305 123 456" }), "inn");
  assert.equal(
    companyMatch({ name: "Тандыр", inn: "305123456", contacts: ["@tandyr_uz"] }, { name: "Тандыр", inn: "309999999", contacts: ["t.me/tandyr_uz"] }),
    "contact",
    "подставной ИНН не перебивает совпавший Telegram",
  );
  assert.equal(companyMatch({ host: "tandyr.uz", inn: "305123456" }, { host: "https://tandyr.uz", inn: "309999999" }), "host");
});

test("та же компания — по ИНН, названию, контакту или сайту; короткие ключи не считаются", () => {
  const claim = { inn: "305123456", name: "ООО «Тандыр Групп»", contacts: ["+998 90 123 45 67", "@tandyr_uz"], host: "tandyr.uz" };
  assert.ok(sameCompany(claim, { inn: "305 123 456" }), "по ИНН");
  assert.ok(sameCompany(claim, { name: "Тандыр групп" }), "по названию без формы собственности и кавычек");
  assert.ok(sameCompany(claim, { contacts: ["901234567"] }), "по телефону");
  assert.ok(sameCompany(claim, { contacts: ["https://t.me/Tandyr_UZ"] }), "по Telegram");
  assert.ok(sameCompany(claim, { host: "https://www.tandyr.uz/menu" }), "по сайту");
  assert.ok(!sameCompany(claim, { inn: "305123457", name: "Другая", contacts: ["@other_co"], host: "other.uz" }));
  assert.ok(!sameCompany({ name: "Art" }, { name: "ART" }), "название меньше 4 знаков совпало бы с половиной города");
  assert.ok(!sameCompany({ contacts: ["@abc"] }, { contacts: ["abc"] }), "контакт меньше 5 знаков не считается");
  assert.ok(!sameCompany({}, {}), "пустое с пустым — не совпадение");
});

/* ── Сроки ──────────────────────────────────────────────────────────────── */

test("90 дней ждём первую заявку, с неё — 12 месяцев", () => {
  assert.equal(CLIENT_WAIT_DAYS, 90);
  assert.equal(CLIENT_TERM_MONTHS, 12);
  const created = "2026-10-01T09:00:00.000Z";
  const waiting = { status: "active", created_at: created, first_lead_at: null };
  assert.equal(clientUntil(waiting)?.toISOString(), "2026-12-30T09:00:00.000Z");
  assert.equal(clientUntilDay(waiting), "30.12.2026");
  assert.ok(clientCounts(waiting, new Date("2026-12-29T00:00:00Z")));
  assert.ok(!clientCounts(waiting, new Date("2026-12-31T00:00:00Z")), "за 90 дней заявки не было — истекло");

  const started = { status: "active", created_at: created, first_lead_at: "2026-11-15T10:00:00.000Z" };
  assert.equal(clientUntilDay(started), "15.11.2027");
  assert.ok(clientCounts(started, new Date("2027-11-14T00:00:00Z")), "после первой заявки 90 дней не ограничивают");
  assert.ok(!clientCounts(started, new Date("2027-11-16T00:00:00Z")));

  assert.ok(!clientCounts({ ...started, status: "cancelled" }, new Date("2026-11-20T00:00:00Z")), "отменённое не действует");
  assert.ok(!clientCounts({ ...started, status: "expired" }, new Date("2026-11-20T00:00:00Z")));
});

test("лимит — 20 закреплений за календарный месяц по Ташкенту", () => {
  assert.equal(MAX_CLIENTS_PER_MONTH, 20);
  assert.equal(tashkentMonth(new Date("2026-10-31T18:59:00Z")), "2026-10");
  assert.equal(tashkentMonth(new Date("2026-10-31T19:01:00Z")), "2026-11", "в Ташкенте уже 1 ноября");
});

test("заявка партнёра: название, телефон или Telegram — хотя бы одно, ИНН — если знает", () => {
  const ok = { name: "Тандыр", inn: "305123456", phone: "+998 90 123 45 67", telegram: "" };
  assert.equal(clientFieldsProblem(ok), null);
  assert.equal(clientFieldsProblem({ ...ok, phone: "", telegram: "@tandyr_uz" }), null);
  assert.equal(clientFieldsProblem({ ...ok, name: " " }), "name");
  assert.equal(clientFieldsProblem({ ...ok, inn: "12345" }), "inn");
  assert.equal(clientFieldsProblem({ ...ok, inn: "" }), null, "ИНН необязателен — партнёр может его не знать");
  assert.equal(clientFieldsProblem({ ...ok, phone: "", telegram: "" }), "contact");
  assert.equal(clientFieldsProblem({ ...ok, phone: "123", telegram: "@ab" }), "contact");
});

/* ── Запись и антифрод ──────────────────────────────────────────────────── */

test("одна компания — одному партнёру: уникальный ИНН среди действующих держит база", () => {
  const sql = read("supabase/migrations/0072_partner_clients.sql");
  assert.match(sql, /create unique index if not exists partner_clients_inn_active\s+on public\.partner_clients \(inn\) where status = 'active'/);
  assert.match(sql, /inn text not null check \(inn ~ '\^\[0-9\]\{9,12\}\$'\)/);
  assert.match(sql, /alter table public\.leads add column if not exists client_inn text/);
  assert.match(read("supabase/migrations/0072_partner_clients.down.sql"), /drop table if exists public\.partner_clients/);
});

test("закрепить нельзя то, что студия уже знает, или то, что закрепил другой", () => {
  const store = read("lib/partners/store.ts");
  const at = store.indexOf("export async function requestClient(");
  const body = store.slice(at, store.indexOf("\n}\n", at));
  assert.match(body, /partner\.status !== "active"/, "заблокированный партнёр закрепляет");
  assert.match(body, />= MAX_CLIENTS_PER_MONTH/, "нет лимита в месяц");
  assert.match(body, /c\.partner_id === partner\.id \? "mine" : "taken"/);
  assert.match(body, /agenciesOf\("all"\)/, "не сверяется с агентствами партнёров");
  assert.match(body, /\(await studioCompanies\(\)\)\.map\(\(k\) => \(\{ facts: k, reason: "studio" as ClientFailure \}\)\)/);
  assert.match(body, /match === "name" && !row\.inn && normalizeInn\(c\.facts\.inn\)/, "совпало название без ИНН — не просим ИНН");
  assert.match(body, /if \(needInn\) return \{ ok: false, reason: "need_inn" \};/);
  assert.match(body, /error\?\.code === "23505"\) return \{ ok: false, reason: "taken" \}/, "гонка двух заявок не превращается в «taken»");

  const knows = store.slice(store.indexOf("async function studioCompanies("), at);
  for (const table of ["leads", "projects", "contracts", "prospects"]) {
    assert.match(knows, new RegExp(`from\\("${table}"\\)`), `студия не сверяется с ${table}`);
  }
});

test("отменяет только владелец и только с причиной", () => {
  const store = read("lib/partners/store.ts");
  const at = store.indexOf("export async function cancelClient(");
  const body = store.slice(at, store.indexOf("\n}\n", at));
  assert.match(body, /admin\.role !== "admin"\) return \{ ok: false, reason: "forbidden" \}/);
  assert.match(body, /if \(!reason\) return \{ ok: false, reason: "invalid" \}/);
  const actions = read("app/admin/partners/actions.ts");
  const cancel = actions.slice(actions.indexOf("export async function cancelClientAction("));
  assert.match(cancel, /await requireAdmin\(\)/);
  assert.match(cancel, /notifyPartner\(/, "партнёр не узнаёт об отмене");
});

test("кабинет: закрепление — после проверки входа, владельцу — сообщение", () => {
  const actions = read("app/[locale]/partners/cabinet/actions.ts");
  const at = actions.indexOf("export async function requestClientAction(");
  assert.ok(at > 0);
  const body = actions.slice(at);
  assert.match(body, /const partner = await currentPartner\(\);\s*if \(!partner\) redirect/);
  assert.match(body, /await alertOwners\(/);
  assert.match(body, /back\(locale, result\.ok \? "claim_ok" : `claim_\$\{result\.reason\}`, "claims"\)/);
});

/* ── Привязка лида ──────────────────────────────────────────────────────── */

test("лид узнаётся по закреплению последним: агентство и ссылка важнее", () => {
  const attribute = read("lib/partners/attribute.ts");
  const agency = attribute.indexOf("await attributeAgencyLead(leadId");
  const link = attribute.indexOf("await attributeLead(leadId, attribution.code");
  const client = attribute.indexOf("await attributeClientAndNotify(leadId)");
  assert.ok(agency > 0 && link > agency && client > link);

  const store = read("lib/partners/store.ts");
  const at = store.indexOf("export async function attributeClientLead(");
  const body = store.slice(at, store.indexOf("\n}\n", at));
  assert.match(body, /if \(lead\.partner_id && !lead\.partner_void_reason\) return null;/, "закрепление перебивает засчитанную ссылку");
  assert.match(body, /\.is\("first_lead_at", null\)/, "две заявки разом сдвинут срок дважды");
  assert.match(body, /\.eq\("lead_id", leadId\)\s*\.is\("partner_id", null\)/, "проект, заведённый раньше, не получает партнёра");
});

test("ИНН, вписанный в карточку лида позже, тоже узнаёт клиента партнёра", () => {
  const actions = read("app/admin/leads/[id]/actions.ts");
  const at = actions.indexOf("export async function saveInnAction(");
  assert.ok(at > 0);
  const body = actions.slice(at);
  assert.match(body, /if \(!canEdit\(lead, staff\)\)/, "ИНН вписывает кто угодно");
  assert.match(body, /await attributeClientAndNotify\(leadId\)/);
  const page = read("app/admin/leads/[id]/page.tsx");
  assert.match(page, /action=\{saveInnAction\}/);
  assert.match(page, /tc\.leadClient\(partner\.name,/, "менеджер не видит «Клиент партнёра … (закреплён …)»");
});

test("проект из лида наследует закрепление", () => {
  assert.match(read("lib/admin/projects.ts"), /partner_client_id: partnerClientId,/);
});

/* ── Автовыплата с оборота ──────────────────────────────────────────────── */

test("автовыплата — только с оборота, только за оплаченный целиком проект", () => {
  const project = {
    id: "p1",
    owner_staff_id: null,
    kind: "new" as const,
    amount_usd: 4000,
    tax_percent: 4,
    dev_cost_usd: 1000,
    stage: "work",
    partner_id: "a",
    partner_percent: null,
    partner_void_reason: null,
  };
  const partner = { id: "a", percent_override: null };
  const paid = [{ project_id: "p1", amount_usd: 4000 }];
  const half = [{ project_id: "p1", amount_usd: 2000 }];

  const turnover = partnerAccrualOf({ ...project, partner_model: "turnover" }, paid, partner);
  assert.equal(turnover?.amount_usd, 400, "4 000 $ × 10 % с оборота");
  assert.ok(autoPayoutDue(turnover));
  assert.ok(!autoPayoutDue(partnerAccrualOf({ ...project, partner_model: "turnover" }, half, partner)), "оплачено наполовину");
  assert.ok(!autoPayoutDue(partnerAccrualOf({ ...project, partner_model: "profit" }, paid, partner)), "от прибыли — по заявке");
  assert.ok(!autoPayoutDue(partnerAccrualOf({ ...project, partner_model: "turnover", partner_void_reason: "self" }, paid, partner)));
  assert.ok(!autoPayoutDue(null));

  // Заведённая автовыплата сразу уходит из «доступно» — второй раз её не попросить.
  const balance = partnerBalanceOf([turnover!], [{ status: "requested", amount_usd: 400 }]);
  assert.equal(balance.available, 0);
});

test("строго одна автовыплата на проект — уникальный индекс, а не память кода", () => {
  const sql = read("supabase/migrations/0073_partner_auto_payouts.sql");
  assert.match(sql, /create unique index if not exists partner_payouts_project_unique\s+on public\.partner_payouts \(project_id\) where project_id is not null/);

  const store = read("lib/partners/store.ts");
  const at = store.indexOf("export async function autoPayoutTurnover(");
  const body = store.slice(at, store.indexOf("\n}\n", at));
  assert.match(body, /autoPayoutDue\(accrual\)/);
  assert.match(body, /project_id: projectId/);
  assert.match(body, /summary\.balance\.available < accrual\.amount_usd/, "задвоит деньги, уже попрошенные заявкой");
  assert.doesNotMatch(body, /canWithdrawNow/, "автовыплата не ждёт начала месяца");
});

test("автовыплата срабатывает при записи платежа и страховочно в свипе", () => {
  const ledger = read("lib/admin/ledger.ts");
  assert.match(ledger, /if \(line\.model === "turnover" && !partner\.accumulate\) \{\s*await settleTurnover\(projectId\);/);
  // «Оплачен» у счёта договора пишет платёж через addPayment — тот же путь.
  assert.match(read("lib/admin/invoice-store.ts"), /const payment = await addPayment\(/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /await settleTurnoverDue\(\)/);

  const autopay = read("lib/partners/autopay.ts");
  assert.match(autopay, /выплата в обработке/);
  assert.match(autopay, /Реквизиты для выплаты не указаны/);
  assert.match(autopay, /Выплатить партнёру/);
});

test("автовыплата не держит обычную заявку партнёра и получает реквизиты, когда их внесут", () => {
  const store = read("lib/partners/store.ts");
  assert.match(store, /p\.status === "requested" && !p\.project_id\)\) \{\s*return \{ ok: false, reason: "pending", balance \};/);
  assert.match(store, /if \(!error\) await fillAutoPayoutRequisites\(partner\.id, requisites\);/);
});
