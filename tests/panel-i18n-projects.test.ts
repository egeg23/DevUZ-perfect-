import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { QuoteCard } from "@/components/admin/quote-card";
import {
  contractErrorDict,
  contractProblemDict,
  contractStatusDict,
  estimateHintDict,
  problemsText,
} from "@/content/admin-panel/contracts";
import { taxWhatDict } from "@/content/admin-panel/expenses";
import { partnerVoidDict, projectResultDict, stageDict, stageLabel } from "@/content/admin-panel/projects";
import { problemParam, problemsBeforeApproval } from "@/lib/admin/contracts";
import { PANEL_LOCALES, type PanelLocale } from "@/lib/admin/i18n";
import { ALL_STAGES } from "@/lib/admin/projects";
import { briefQuote, quoteFor, type QuoteInput } from "@/lib/admin/quote";
import { DEFAULT_DEADLINES } from "@/lib/admin/tax-calendar";
import type { Brief } from "@/lib/qualify/brief";
import { VOID_TITLE } from "@/lib/partners/rules";

/**
 * «Проекты», «Договоры», «Расходы студии» на трёх языках.
 *
 * Три вещи. Каждый ответ действий (`?r=`, `?error=`, `?hint=`, `detail=`)
 * уходит в адрес кодом и у кода есть текст на всех языках — иначе
 * узбекский менеджер увидит пустую плашку или русский текст из lib. Смета
 * рисуется из пропсов — её рендерим на трёх языках. Страницы, которым
 * нужна база, проверяем по исходнику: русский там только в комментариях.
 *
 * Не переводится и не проверяется здесь: текст договора и счёта (документ
 * заказчику, components/docs/*) и заготовки его содержания в формах
 * (DEFAULT_CONTRACT_STAGES, примеры строк сметы и срока в lib/admin/contracts.ts).
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const CYRILLIC = /[а-яё]/i;

type AnyDict = Record<string, Record<PanelLocale, unknown> | undefined>;

function assertInDict(dict: AnyDict, code: string, where: string) {
  for (const locale of PANEL_LOCALES) {
    assert.ok(dict[code]?.[locale], `${where}: код «${code}» без текста на «${locale}»`);
  }
}

/** Литералы из объединения строк: `"a" | "b"`. */
function unionOf(src: string, name: RegExp): string[] {
  const m = src.match(name);
  assert.ok(m, `не нашёл тип ${name}`);
  return [...m[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
}

/* ── Проекты: ?r= ──────────────────────────────────────────────────────── */

test("каждый ?r= карточки проекта есть в словаре", () => {
  const codes = new Set<string>();
  const projects = read("app/admin/projects/actions.ts");
  const finance = read("app/admin/finance/actions.ts");
  for (const src of [projects, finance]) {
    for (const line of src.split("\n").filter((l) => l.includes("/admin/projects/${projectId}?r="))) {
      for (const [, code] of line.matchAll(/r=([a-z_]+)/g)) codes.add(code);
      for (const [, code] of line.matchAll(/"([a-z_]+)"/g)) codes.add(code);
    }
  }
  // Причины из хранилищ — кодом через `result.reason` / code(result).
  for (const code of unionOf(read("lib/admin/ledger.ts"), /reason: ((?:"[a-z_]+"(?: \| )?)+) \}/)) codes.add(code);
  const partner = read("lib/partners/store.ts");
  const setPartner = partner.slice(partner.indexOf("export async function setProjectPartner"));
  for (const code of unionOf(setPartner, /reason: ((?:"[a-z_]+"(?: \| )?)+) \}/)) codes.add(code);
  for (const code of ["ok", "failed", "forbidden", "invalid", "below_floor", "data_forbidden", "paid", "offline"]) {
    assert.ok(codes.has(code), `регэксп не нашёл «${code}» — действия поменялись, поправьте тест`);
  }
  for (const code of codes) assertInDict(projectResultDict as AnyDict, code, "?r=");
});

test("подпись есть у каждой стадии проекта и причины партнёра", () => {
  assert.deepEqual(Object.keys(stageDict).sort(), [...ALL_STAGES].sort());
  assert.equal(stageLabel("build", "uz"), "ishlab chiqish");
  assert.equal(stageLabel("что-то новое", "pl"), "что-то новое", "незнакомая стадия — как есть");
  assert.deepEqual(Object.keys(partnerVoidDict).sort(), Object.keys(VOID_TITLE).sort());
  for (const status of ["draft", "pending", "approved", "signed"]) assertInDict(contractStatusDict as AnyDict, status, "статус");
});

/* ── Договоры: ?error=, ?hint=, detail= ────────────────────────────────── */

test("каждый отказ договоров уходит кодом, и у кода есть текст на всех языках", () => {
  const actions = read("app/admin/contracts/actions.ts");
  // В адрес — только коды, русский текст туда больше не кладётся.
  assert.doesNotMatch(actions, /encodeURIComponent\(result\.(why|hint)/);
  assert.doesNotMatch(actions, /problems\.join\("(; | · )"\)/);

  const codes = new Set<string>();
  for (const [, code] of actions.matchAll(/error=([a-z_]+)/g)) codes.add(code);
  for (const [, code] of actions.matchAll(/error=\$\{result\.why \?\? "([a-z_]+)"\}/g)) codes.add(code);
  for (const code of unionOf(read("lib/admin/contract-store.ts"), /why: ((?:"[a-z_]+"(?: \| )?)+);/)) codes.add(code);
  for (const code of unionOf(read("lib/admin/signature.ts"), /SignatureFail = ((?:"[a-z_]+"(?: \| )?)+);/)) codes.add(code);
  const store = read("lib/admin/invoice-store.ts");
  const fail = store.slice(store.indexOf("export type InvoiceFail"), store.indexOf("export type IssueResult"));
  // `Exclude<InvoiceBlock, "ok">` — «ok» не отказ.
  for (const [, code] of fail.matchAll(/"([a-z_]+)"/g)) if (code !== "ok") codes.add(code);
  // Причины, по которым счёт не выставить (lib/admin/invoices.ts, InvoiceBlock).
  for (const code of unionOf(read("lib/admin/invoices.ts"), /InvoiceBlock =\s*((?:\|?\s*"[a-z_]+"\s*)+);/)) {
    if (code !== "ok") codes.add(code);
  }
  assert.doesNotMatch(store, /why: "[А-Яа-яЁё]/, "в invoice-store остался русский отказ");
  for (const code of ["nofile", "link", "forbidden", "locked", "invalid", "not_png", "already_paid", "no_bank"]) {
    assert.ok(codes.has(code), `регэксп не нашёл «${code}» — поправьте тест`);
  }
  for (const code of codes) assertInDict(contractErrorDict as AnyDict, code, "?error=");

  const hints = new Set(unionOf(read("lib/admin/contract-store.ts"), /EstimateHint = ((?:"[a-z_]+"(?: \| )?)+);/));
  for (const code of unionOf(read("lib/admin/estimate.ts"), /why: ((?:"[a-z_]+"(?: \| )?)+);/)) {
    assert.ok(hints.has(code), `why «${code}» из разбора сметы не заведён в EstimateHint`);
  }
  for (const code of hints) assertInDict(estimateHintDict as AnyDict, code, "?hint=");
});

test("претензии к договору едут кодами и читаются на каждом языке", () => {
  const src = read("lib/admin/contracts.ts");
  const codes = new Set([...src.matchAll(/code: "([a-z_]+)"/g)].map((m) => m[1]));
  codes.add("below_floor");
  assert.ok(codes.size >= 20, `кодов претензий: ${codes.size}`);
  for (const code of codes) assertInDict(contractProblemDict as AnyDict, code, "detail=");

  const problems = problemsBeforeApproval({
    number: "DU-2026-01",
    signed_date: "2026-09-01",
    client_name: "OOO Acme",
    client_details: "Toshkent, Amir Temur 1, direktor",
    subject: "Korporativ sayt ishlab chiqish",
    amount_usd: 1000,
    stages: [{ title: "Dizayn", percent: 90, workdays: 5 }],
    estimateItems: [{ title: "x", unit: "", qty: 1, price: 1000, total: 1000 }],
    deadlineText: "30 kun",
    client_tax_id: "123456789",
    client_bank_name: "Bank",
    client_account: "123",
    client_mfo: "00450",
    seller: { taxId: "1", bankName: "b", account: "a", mfo: "m" },
  });
  const detail = problemParam(problems);
  assert.equal(detail, "client_account_format,stages_sum:90");
  assert.ok(!CYRILLIC.test(detail), "в адрес попал русский текст");
  assert.equal(
    problemsText(detail, "ru", " · "),
    "Расчётный счёт заказчика — двадцать цифр, сейчас там другое · Доли этапов дают 90% вместо 100%",
  );
  for (const locale of ["uz", "pl"] as const) {
    const text = problemsText(`${detail},below_floor:1200`, locale, "; ");
    assert.ok(!CYRILLIC.test(text), `${locale}: ${text}`);
    assert.match(text, /90%/);
    assert.match(text, /\$1,200/);
  }
  // Старая ссылка с русским текстом — не пустое место, а текст как есть.
  assert.equal(problemsText("Нет сметы", "uz", "; "), "Нет сметы");
});

/* ── Расходы ───────────────────────────────────────────────────────────── */

test("у каждого налогового срока есть «что сдавать» на всех языках", () => {
  for (const deadline of DEFAULT_DEADLINES) assertInDict(taxWhatDict as AnyDict, deadline.id, "налог");
});

/* ── Смета на трёх языках ──────────────────────────────────────────────── */

function visible(html: string): string {
  const attrs = [...html.matchAll(/(?:title|aria-label|placeholder)="([^"]*)"/g)].map((m) => m[1]);
  return [html.replace(/<[^>]+>/g, " "), ...attrs].join(" ").replace(/&[a-z#0-9]+;/g, " ");
}

test("смета — подписи, состав, допы и «Что говорить» — на языке панели", () => {
  const brief = {
    project: "landing",
    projectLabel: "Landing",
    tier: { label: "Start", priceUsd: 900 },
    addons: [
      { id: "form", label: "Form", priceUsd: 0, included: true },
      { id: "crm", label: "CRM", priceUsd: 200 },
      { id: "host", label: "Hosting", priceUsd: 50, monthly: true },
      { id: "app", label: "App", priceUsd: 0, onRequest: true },
    ],
    totalUsd: 1100,
    fromPrice: false,
  } as unknown as Brief;

  for (const locale of PANEL_LOCALES) {
    const inputs: QuoteInput[] = [
      { category: "landing", selection: { seo: true }, weeks: null },
      { category: "ecommerce", selection: {}, weeks: 1 },
      { category: "mobile", selection: {}, weeks: 20 },
    ];
    for (const input of inputs) {
      const quote = quoteFor(input, locale);
      assert.ok(quote, `${input.category}: смета не посчиталась`);
      const html = renderToStaticMarkup(createElement(QuoteCard, { quote: quote!, locale }));
      if (locale !== "ru") {
        const text = visible(html);
        assert.ok(!CYRILLIC.test(text), `${locale} ${input.category}: русское «${text.match(/\S*[а-яё]\S*/i)}»`);
      }
    }
    const html = renderToStaticMarkup(createElement(QuoteCard, { quote: briefQuote(brief, locale), locale }));
    if (locale !== "ru") assert.ok(!CYRILLIC.test(visible(html)), `${locale}: смета витрины с русским`);
  }

  // Русский — ровно как раньше: смету по-русски читают договор и «Деньги».
  const ru = quoteFor({ category: "landing", selection: {}, weeks: 2 })!;
  assert.match(ru.talk[1], /^Срок: 2 недели с даты аванса/);
  assert.match(quoteFor({ category: "landing", selection: {}, weeks: 2 }, "pl")!.talk[1], /^Termin: 2 tygodnie/);
  assert.match(quoteFor({ category: "landing", selection: {}, weeks: 5 }, "pl")!.talk[1], /^Termin: 5 tygodni/);
  assert.match(quoteFor({ category: "landing", selection: {}, weeks: 2 }, "uz")!.talk[1], /2 hafta/);
});

/* ── Страницы без базы не рисуются — проверяем исходник ─────────────────── */

test("страницы проектов, договоров и расходов: весь текст — из словаря", () => {
  const files = [
    "app/admin/projects/page.tsx",
    "app/admin/projects/actions.ts",
    "app/admin/projects/[id]/page.tsx",
    "app/admin/contracts/page.tsx",
    "app/admin/contracts/actions.ts",
    "app/admin/contracts/[id]/page.tsx",
    "app/admin/contracts/[id]/invoice/[invoice]/page.tsx",
    "app/admin/expenses/page.tsx",
    "app/admin/expenses/actions.ts",
    "components/admin/quote-card.tsx",
  ];
  for (const file of files) {
    const code = read(file)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/\s\/\/ .*$/gm, "");
    const line = code.split("\n").find((l) => CYRILLIC.test(l));
    assert.equal(line, undefined, `${file}: русский текст мимо словаря: ${line?.trim()}`);
  }
  // Страницы договора живут без AdminShell — язык для «?» ставят сами.
  for (const file of [
    "app/admin/contracts/page.tsx",
    "app/admin/contracts/[id]/page.tsx",
    "app/admin/contracts/[id]/invoice/[invoice]/page.tsx",
  ]) {
    assert.match(read(file), /<PanelLocaleProvider locale=\{locale\}>/, file);
  }
  assert.match(read("app/admin/projects/[id]/page.tsx"), /<QuoteCard quote=\{quote\} locale=\{locale\} \/>/);
});
