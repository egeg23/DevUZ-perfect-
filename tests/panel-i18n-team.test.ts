import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { auditDict } from "@/content/admin-panel/audit";
import { financeDict } from "@/content/admin-panel/finance";
import { offboardingDict, teamDict } from "@/content/admin-panel/team";
import { usageDict } from "@/content/admin-panel/usage";
import { ACCRUAL_TR, EXPENSE_TR, GRADE_TR, KIND_TR, PURPOSE_TR, money } from "@/lib/admin/finance";
import { PANEL_LOCALES, type Msg, type Tr } from "@/lib/admin/i18n";
import { ACTION_LABEL } from "@/lib/admin/journal";
import { NOTICES, NOTICE_KINDS, offSummary } from "@/lib/admin/notify-prefs";
import { offboardingSummary } from "@/lib/admin/offboarding";
import { ROLE_TITLE, ROLE_TITLE_TR } from "@/lib/admin/roles";
import { parseTouchPlan } from "@/lib/admin/touch-plan";
import { FEATURES, TRACKED, VERDICT_TITLE } from "@/lib/admin/usage";

/**
 * «Команда», «Финансы», «Использование» и «Журнал» на трёх языках.
 *
 * Страницы читают базу и сессию, поэтому здесь проверяется то, из чего они
 * собраны: словари, Tr-таблицы в lib, строки, которые lib собирает сам
 * (итог отключения, сводка галочек), коды ответов действий — и исходники
 * страниц: русского текста вне комментариев в них больше нет.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const CYRILLIC = /[а-яё]/i;

/**
 * Кириллица, которой в узбекском и польском место: кнопка бота — бот пока
 * русский, и кнопку человек ищет глазами такой, какая она в Telegram.
 */
const BOT_WORDS = /Получать лиды/g;

function sample(msg: Msg): string {
  return typeof msg === "string" ? msg : (msg as (...a: unknown[]) => string)(3, "Aziz", 5, 7);
}

const tables: Record<string, Record<string, Tr<Msg>>> = {
  teamDict,
  offboardingDict,
  financeDict,
  usageDict,
  auditDict,
  GRADE_TR,
  KIND_TR,
  PURPOSE_TR,
  ACCRUAL_TR,
  EXPENSE_TR,
  ROLE_TITLE_TR,
  ACTION_LABEL,
  VERDICT_TITLE,
  NOTICE_TITLE: Object.fromEntries(NOTICE_KINDS.map((k) => [k, NOTICES[k].title])),
  NOTICE_OFF: Object.fromEntries(NOTICE_KINDS.map((k) => [k, NOTICES[k].off])),
  TRACKED: Object.fromEntries(TRACKED.map((t) => [t.href, t.label])),
  FEATURES: Object.fromEntries(FEATURES.map((f) => [f.key, f.label])),
};

test("каждая подпись — на трёх языках, узбекский и польский без русского", () => {
  for (const [where, table] of Object.entries(tables)) {
    for (const [key, entry] of Object.entries(table)) {
      for (const locale of PANEL_LOCALES) {
        const value = entry[locale];
        assert.ok(value !== undefined && sample(value).trim(), `${where}.${key}: нет «${locale}»`);
        assert.equal(typeof value, typeof entry.ru, `${where}.${key}: «${locale}» другого вида, чем ru`);
      }
      for (const locale of ["uz", "pl"] as const) {
        const text = sample(entry[locale]).replace(BOT_WORDS, "");
        assert.ok(!CYRILLIC.test(text), `${where}.${key} (${locale}) с кириллицей: ${text}`);
      }
      assert.ok(!/[og]['`ʻ]/.test(sample(entry.uz)), `${where}.${key}: o‘/g‘ пишутся через ‘`);
    }
  }
});

test("русские подписи для бота остались прежними", () => {
  // Бот пишет по-русски и берёт роль из ROLE_TITLE — она собрана из той же таблицы.
  for (const role of Object.keys(ROLE_TITLE_TR) as (keyof typeof ROLE_TITLE_TR)[]) {
    assert.equal(ROLE_TITLE[role], ROLE_TITLE_TR[role].ru);
  }
  assert.equal(ROLE_TITLE.head, "руководитель проектов");
});

test("«Команда»: у каждого кода ответа есть текст и строка на странице", () => {
  const actions = read("app/admin/team/actions.ts");
  const lib = read("lib/admin/team.ts");
  const plan = read("lib/admin/touch-plan.ts");
  const prefs = read("lib/admin/notify-prefs.ts");

  const typeBlock = lib.slice(lib.indexOf("export type TeamResult"), lib.indexOf("};", lib.indexOf("export type TeamResult")));
  const codes = new Set<string>(["ok"]);
  for (const src of [actions, typeBlock]) {
    for (const [, code] of src.matchAll(/(?:reason|note): "([a-z_]+)"/g)) codes.add(code);
    for (const [, code] of src.matchAll(/\|\s*"([a-z_]+)"/g)) codes.add(code);
    for (const [, code] of src.matchAll(/\? "([a-z_]+)" : "([a-z_]+)"/g)) codes.add(code);
  }
  for (const [, code] of plan.matchAll(/why: "([a-z_]+)"/g)) codes.add(code);
  const notices = prefs.slice(prefs.indexOf("export type NoticesResult"));
  for (const [, code] of notices.slice(0, notices.indexOf("\n")).matchAll(/"([a-z_]+)"/g)) codes.add(code);
  for (const [, a, b] of actions.matchAll(/result\.ok \? "([a-z_]+)" : "([a-z_]+)"/g)) codes.add(a).add(b);
  codes.add("menu_ok").add("menu_failed");

  assert.ok(codes.has("plan_nan") && codes.has("plan_big") && codes.has("rate_invalid"), [...codes].join(","));
  const page = read("app/admin/team/page.tsx");
  for (const code of codes) {
    const key = `r_${code}` as keyof typeof teamDict;
    assert.ok(teamDict[key], `код «${code}» без текста в teamDict`);
    assert.match(page, new RegExp(`\\b${code}: t\\.r_${code}\\b`), `код «${code}» не разбирается страницей`);
  }
  for (const code of ["sent", "blocked", "no_bot"]) {
    assert.match(page, new RegExp(`code === "${code}"`), `приглашение «${code}» не разбирается`);
  }
  // Ответ ушёл кодом, а не русской фразой в адресе.
  assert.doesNotMatch(actions, /encodeURIComponent/);
});

test("ошибки поля плана — кодом, текст — на языке того, кто ставит", () => {
  const nan = parseTouchPlan("тридцать");
  const big = parseTouchPlan("999");
  assert.ok(!nan.ok && nan.why === "plan_nan");
  assert.ok(!big.ok && big.why === "plan_big");
  assert.match(teamDict.r_plan_big.pl(500), /500/);
});

test("«Финансы»: у каждого кода ответа есть текст", () => {
  const ledger = read("lib/admin/ledger.ts");
  const line = ledger.match(/\{ ok: false; reason: ([^}]+) \}/)?.[1] ?? "";
  const codes = [...line.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]).filter((c) => c !== "below_floor");
  assert.ok(codes.length >= 5, line);
  const page = read("app/admin/finance/page.tsx");
  for (const code of ["ok", ...codes]) {
    assert.ok(financeDict[`r_${code}` as keyof typeof financeDict], `код «${code}» без текста`);
    assert.match(page, new RegExp(`\\b${code}: t\\.r_${code}\\b`), `код «${code}» не разбирается страницей`);
  }
});

test("строки, которые собирает lib, — на языке панели", () => {
  const none = { leads: 0, talks: 0, pool: 0, team: 0, reminders: 0, transfers: 0, cards: 0 };
  const some = { ...none, leads: 2, talks: 1, cards: 14 };
  for (const locale of ["uz", "pl"] as const) {
    for (const text of [
      offboardingSummary(none, locale),
      offboardingSummary(some, locale),
      offSummary([], "manager", locale),
      offSummary(["queue"], "manager", locale),
      offSummary([...NOTICE_KINDS], "manager", locale),
    ]) {
      assert.ok(!CYRILLIC.test(text), `${locale}: ${text}`);
    }
  }
  assert.match(offboardingSummary(some, "pl"), /14/);
  // Без языка — по-русски: так их зовут бот и старые места.
  assert.equal(offSummary([], "manager"), "приходит всё");
  assert.equal(money(12_500).replace(/\s/g, " "), "12 500 $");
  assert.equal(money(12_500, "pl").replace(/\s/g, " "), "12 500 $");
});

/** Исходник без комментариев: что осталось — код, строки и JSX-текст. */
function code(src: string): string {
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
}

test("в страницах раздела нет русского текста вне комментариев", () => {
  for (const file of [
    "app/admin/team/page.tsx",
    "app/admin/team/actions.ts",
    "app/admin/finance/page.tsx",
    "app/admin/finance/actions.ts",
    "app/admin/usage/page.tsx",
    "app/admin/audit/page.tsx",
    "components/admin/usage-beacon.tsx",
  ]) {
    const rest = code(read(file));
    const hit = rest.split("\n").find((line) => CYRILLIC.test(line));
    assert.equal(hit, undefined, `${file}: русский текст вне словаря: ${hit?.trim()}`);
  }
});

test("«?» и подписи к ним — из словаря", () => {
  for (const file of ["app/admin/team/page.tsx", "app/admin/finance/page.tsx"]) {
    const src = read(file);
    for (const [, label] of src.matchAll(/<HelpHint [^>]*label=(\S+)/g)) {
      assert.match(label, /^\{t\./, `${file}: подпись «?» не из словаря: ${label}`);
    }
  }
});
