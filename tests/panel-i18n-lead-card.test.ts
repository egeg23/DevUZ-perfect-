import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CopyMessage } from "@/components/admin/copy-message";
import { LeadThread } from "@/components/admin/lead-thread";
import { PanelLocaleProvider } from "@/components/admin/panel-locale";
import { QuoteCard } from "@/components/admin/quote-card";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  leadBudgetDict,
  leadPriorityDict,
  leadResultDict,
  leadStatusDict,
} from "@/content/admin-panel/lead-card";
import { PANEL_LOCALES, type PanelLocale } from "@/lib/admin/i18n";
import { STATUSES } from "@/lib/admin/leads";
import type { LeadMessage } from "@/lib/admin/messages";
import type { Quote } from "@/lib/admin/quote";
import type { Staff } from "@/lib/admin/session";
import { atTashkent, channelName, placeOf, refOf } from "@/lib/qualify/origin";

/**
 * Карточка лида на трёх языках.
 *
 * Две вещи, которые легко сломать незаметно. Первая — ответ действия: код
 * едет в адресе (`?r=код`), текст берётся из словаря по коду, и новый код
 * без строки в словаре показал бы «Не получилось» вместо настоящей причины.
 * Вторая — части карточки, которые рисуются без базы: в узбекском и
 * польском не должно остаться русского, кроме данных клиента.
 *
 * Запуск: npm test
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const CYRILLIC = /[а-яё]/i;

/** Коды из объединения строк: `reason: "a" | "b"` или `= | "a" | "b";`. */
function literals(source: string): string[] {
  return [...source.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
}

/** Все коды `r`, которые могут уйти из действий карточки обратно в карточку. */
function redirectedCodes(): Set<string> {
  const actions = read("app/admin/leads/[id]/actions.ts");
  const codes = new Set<string>();

  // Литералы прямо в адресе карточки: `/admin/leads/${leadId}?r=asked`.
  for (const m of actions.matchAll(/\/admin\/leads\/\$\{leadId\}\?r=([a-z_]+)/g)) codes.add(m[1]);
  // Выбор из двух в адресе: `?r=${decision === "approved" ? "approved" : "declined"}`.
  for (const m of actions.matchAll(/\?r=\$\{[^}]*\? "([a-z_]+)" : "([a-z_]+)"\}/g)) {
    codes.add(m[1]);
    codes.add(m[2]);
  }
  // backTo: `result.ok ? "ok" : result.reason`, и причины, заданные на месте.
  assert.match(actions, /const status = result\.ok \? "ok" : result\.reason;/);
  codes.add("ok");
  for (const m of actions.matchAll(/reason: "([a-z_]+)"/g)) codes.add(m[1]);

  // Причины, которые приходят из lib: владение и передачи.
  const ownership = read("lib/admin/ownership.ts");
  const own = /export type OwnershipResult =[\s\S]*?reason: ([^}]+)\}/.exec(ownership);
  assert.ok(own, "не нашёл OwnershipResult");
  for (const code of literals(own[1])) codes.add(code);

  const transfers = read("lib/admin/transfers.ts");
  const verdict = /export type TransferVerdict =([\s\S]*?);/.exec(transfers);
  assert.ok(verdict, "не нашёл TransferVerdict");
  for (const code of literals(verdict[1].replace(/\/\*\*[\s\S]*?\*\//g, ""))) codes.add(code);
  for (const m of transfers.matchAll(/reason: TransferVerdict((?: \| "[a-z_]+")+)/g)) {
    for (const code of literals(m[1])) codes.add(code);
  }
  return codes;
}

test("у каждого кода, который действия кладут в адрес карточки, есть текст в словаре", () => {
  const codes = redirectedCodes();
  // Опора, чтобы регэкспы не «прошли» на пустом множестве.
  for (const known of ["ok", "failed", "forbidden", "taken", "queued", "share", "asked", "approved", "declined", "pending", "not_mine", "free", "self"]) {
    assert.ok(codes.has(known), `код «${known}» не нашёлся в исходниках — регэксп устарел`);
  }
  for (const code of codes) {
    assert.ok(Object.hasOwn(leadResultDict, code), `?r=${code}: нет строки в leadResultDict`);
  }
});

test("действия карточки кладут в адрес код, а не русский текст", () => {
  const actions = read("app/admin/leads/[id]/actions.ts");
  for (const m of actions.matchAll(/redirect\(([\s\S]*?)\);/g)) {
    assert.ok(!CYRILLIC.test(m[1]), `в адресе русский текст: ${m[1]}`);
    assert.doesNotMatch(m[1], /encodeURIComponent/);
  }
  const page = read("app/admin/leads/[id]/page.tsx");
  assert.match(page, /leadResultDict\[result as keyof typeof leadResultDict\]/);
  assert.doesNotMatch(page, /RESULT_MESSAGE/);
});

test("подписи статуса, приоритета и бюджета есть для каждого кода", () => {
  for (const status of STATUSES) assert.ok(Object.hasOwn(leadStatusDict, status), status);
  for (const priority of ["hot", "warm", "nurture", "archive"]) assert.ok(Object.hasOwn(leadPriorityDict, priority));
  for (const budget of ["B1", "B2", "B3"]) assert.ok(Object.hasOwn(leadBudgetDict, budget));
});

test("происхождение лида: бриф в Telegram остаётся русским, карточка — на языке панели", () => {
  const origin = { source: "chat", entryPath: "/uz/ceny", entryRef: "google.com" };
  // Без языка — как раньше: этими строками пишет бот.
  assert.equal(channelName("chat"), "чат на сайте");
  assert.equal(placeOf(origin), "страница /uz/ceny");
  assert.equal(refOf(origin), "перешёл с google.com");
  assert.equal(channelName("telegram", "uz"), "Telegramdagi bot");
  assert.equal(refOf({ source: "form" }, "pl"), "wejście bezpośrednie");
  assert.equal(placeOf({ source: "telegram" }, "pl"), "wiadomości prywatne do bota");
  // Незнакомый канал показывается как есть, пустой — словами на языке панели.
  assert.equal(channelName("vk", "pl"), "vk");
  assert.equal(channelName("", "uz"), "kanal ko‘rsatilmagan");
  for (const locale of ["uz", "pl"] as const) {
    assert.ok(!CYRILLIC.test(atTashkent("2026-09-18T09:09:00Z", locale)), locale);
    assert.ok(!CYRILLIC.test(atTashkent("мусор", locale)), locale);
  }
  assert.match(atTashkent("2026-09-18T09:09:00Z"), /^18 сентября, 14:09$/);
});

/* ── Рендер ────────────────────────────────────────────────────────────── */

/** Данные клиента и коллег — кириллицей нарочно: их переводить нельзя. */
const DATA = ["Азиз Каримов", "Созвонились, ждёт смету до пятницы", "Тест"];

const staff = (locale: PanelLocale): Staff => ({
  id: "s-1",
  telegram_user_id: 1,
  username: null,
  display_name: "Тест",
  role: "manager",
  panel_locale: locale,
});

const messages: LeadMessage[] = [
  {
    id: "m-1",
    author_staff_id: "s-2",
    author_name: DATA[0],
    author_role: "admin",
    body: DATA[1],
    created_at: "2026-09-18T09:09:00Z",
    edited_at: "2026-09-18T09:19:00Z",
  },
];

const quote: Quote = {
  kind: "calculator",
  category: "landing",
  categoryTitle: "Landing page",
  floorUsd: 900,
  ceilingUsd: 1400,
  floorUzs: 0,
  ceilingUzs: 0,
  weeksLow: 2,
  weeksHigh: 3,
  promisedWeeks: null,
  rush: false,
  work: ["Design"],
  breakdown: [{ label: "SEO", value: "$100" }],
  extras: [{ id: "x", label: "CRM", price: "$200" }],
  talk: ["Hello"],
};

/** Видимый текст и подписи (placeholder, title, aria-label) без данных. */
function shown(html: string): string {
  const attrs = [...html.matchAll(/(?:placeholder|title|aria-label)="([^"]*)"/g)].map((m) => m[1]);
  let text = [html.replace(/<[^>]+>/g, " "), ...attrs].join(" ").replace(/&[a-z#0-9]+;/g, " ");
  for (const value of DATA) text = text.split(value).join(" ");
  return text;
}

function withLocale(locale: PanelLocale, node: ReactNode): string {
  return renderToStaticMarkup(createElement(PanelLocaleProvider, { locale, children: node }));
}

function render(locale: PanelLocale): Record<string, string> {
  return {
    thread: withLocale(locale, createElement(LeadThread, { leadId: "l-1", messages, staff: staff(locale) })),
    emptyThread: withLocale(locale, createElement(LeadThread, { leadId: "l-1", messages: [], staff: staff(locale) })),
    copy: withLocale(locale, createElement(CopyMessage, { text: "x" })),
    submit: withLocale(
      locale,
      createElement("form", null, createElement(SubmitButton, { base: "px-3", children: "OK" })),
    ),
    quote: withLocale(locale, createElement(QuoteCard, { quote, locale })),
    quoteShowcase: withLocale(
      locale,
      createElement(QuoteCard, { quote: { ...quote, kind: "brief", weeksLow: null, weeksHigh: null, rush: true }, locale }),
    ),
  };
}

test("обсуждение, смета и общие кнопки рисуются на каждом языке без русского в uz и pl", () => {
  const ru = render("ru");
  assert.match(ru.thread, />Обсуждение</);
  assert.match(ru.thread, /placeholder="Что известно по этому клиенту"/);
  assert.match(ru.emptyThread, /Пока пусто\./);
  assert.match(ru.copy, />Скопировать текст</);
  assert.match(ru.quote, /не ниже/);

  for (const locale of ["uz", "pl"] as const) {
    const parts = render(locale);
    for (const [name, html] of Object.entries(parts)) {
      const text = shown(html);
      assert.ok(!CYRILLIC.test(text), `${locale} ${name}: русское «${text.match(/\S*[а-яё]\S*/i)}»`);
    }
    // Данные — как есть, не переведены и не потеряны.
    assert.ok(parts.thread.includes(DATA[0]) && parts.thread.includes(DATA[1]), `${locale}: пропали данные`);
  }

  const uz = render("uz");
  assert.match(uz.thread, />Muhokama</);
  assert.match(uz.thread, />Yuborish</);
  assert.match(uz.copy, />Matnni nusxalash</);
  const pl = render("pl");
  assert.match(pl.thread, />Dyskusja</);
  assert.match(pl.quote, /2–3 tyg\./);
});

test("своя подпись у кнопки копирования остаётся своей", () => {
  const html = withLocale("pl", createElement(CopyMessage, { text: "x", label: "Kopiuj list" }));
  assert.match(html, />Kopiuj list</);
});

test("все языки панели рендерятся без ошибок", () => {
  for (const locale of PANEL_LOCALES) assert.ok(Object.values(render(locale)).every((html) => html.length > 0));
});
