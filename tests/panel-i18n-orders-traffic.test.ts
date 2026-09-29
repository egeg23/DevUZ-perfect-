import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TrafficView, type GaNotice } from "@/components/admin/traffic-panel";
import { PanelLocaleProvider } from "@/components/admin/panel-locale";
import { candidateErrorDict } from "@/content/admin-panel/candidates";
import { orderErrorDict } from "@/content/admin-panel/orders";
import { PANEL_LOCALES, pick, type PanelLocale } from "@/lib/admin/i18n";
import type { GaConnection, TrafficResult } from "@/lib/analytics/traffic";
import { diagnose, type ScoutPulse } from "@/lib/scout/health";

/**
 * Заявки, Поиск, Надзор, Кандидаты, Статистика и Трафик на трёх языках.
 *
 * Трафик рисуется из пропсов (TrafficView) — его рендерим во всех
 * состояниях. Остальные страницы без базы не рисуются: для них — проверка
 * исходника (русский только в комментариях) и того, что каждый код ответа
 * действия есть в словаре.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const CYRILLIC = /[а-яё]/i;

/** Данные, которые панель не переводит: ответ Google, почта, адреса. */
const DATA = ["Ответ Гугла"];

function visibleText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/g, " ");
  for (const d of DATA) text = text.split(d).join(" ");
  return text;
}

function assertNoRussian(html: string, where: string) {
  const text = visibleText(html);
  assert.ok(!CYRILLIC.test(text), `${where}: русское на экране: ${text.match(/\S*[а-яё]\S*/i)}`);
  for (const [, label] of html.matchAll(/(?:title|aria-label|placeholder|data-label)="([^"]*)"/g)) {
    assert.ok(!CYRILLIC.test(label), `${where}: русская подпись «${label}»`);
  }
}

const render = (locale: PanelLocale, el: ReactElement) =>
  renderToStaticMarkup(createElement(PanelLocaleProvider, { locale, children: el }));

const totals = { visits: 1200, users: 900, pageviews: 3400, bounce: 31, duration: 95 };
const report: TrafficResult = {
  ok: true,
  report: {
    totals,
    prev: { ...totals, visits: 1000, users: 0 },
    days: [
      { date: "2026-09-27", visits: 40, users: 30 },
      { date: "2026-09-28", visits: 55, users: 41 },
    ],
    sources: [{ name: "Organic Search", visits: 700 }],
    pages: [{ name: "/uz", visits: 300 }],
  },
};

const google: GaConnection = { via: "google", client: true, property: "512345678", email: "owner@example.com" };
const nothing: GaConnection = { via: null, client: false, property: null, email: null };

/** Коды входа через Google: всё, что шлют действия и адрес возврата. */
function googleCodes(): string[] {
  const src = read("app/admin/google/actions.ts") + read("app/admin/google/callback/route.ts");
  return [...new Set([...src.matchAll(/back\("([a-z_]+)"/g)].map((m) => m[1]))];
}

function trafficStates(locale: PanelLocale): Record<string, ReactElement> {
  const view = (patch: Partial<Parameters<typeof TrafficView>[0]>) =>
    createElement(TrafficView, {
      days: 30,
      ym: report,
      ga: report,
      link: google,
      notice: {},
      canConnect: true,
      locale,
      ...patch,
    });
  const states: Record<string, ReactElement> = {
    "цифры есть": view({}),
    "руководитель": view({ canConnect: false }),
    "не подключено, владелец": view({ ym: { ok: false, reason: "not_configured" }, ga: { ok: false, reason: "not_configured" }, link: nothing }),
    "не подключено, руководитель": view({
      canConnect: false,
      ym: { ok: false, reason: "not_configured" },
      ga: { ok: false, reason: "not_configured" },
      link: nothing,
    }),
    "не ответил": view({ ym: { ok: false, reason: "failed", detail: "Ответ Гугла" }, ga: { ok: false, reason: "failed" } }),
    "не ответил, руководитель": view({ canConnect: false, ym: { ok: false, reason: "failed" }, ga: { ok: false, reason: "failed" } }),
    "нужен API": view({
      ga: { ok: false, reason: "failed", detail: "enable it by visiting https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=1" },
    }),
    "войти заново": view({ ga: { ok: false, reason: "reauth" } }),
    "войти заново, руководитель": view({ canConnect: false, ga: { ok: false, reason: "reauth" } }),
    "нет номера ресурса": view({ ga: { ok: false, reason: "not_configured" }, link: { ...google, property: null } }),
    "клиент сохранён": view({ ga: { ok: false, reason: "not_configured" }, link: { ...nothing, client: true } }),
    "сервисный ключ": view({ link: { ...google, via: "service" } }),
  };
  for (const code of googleCodes()) {
    const notice: GaNotice = { code, detail: "Ответ Гугла", property: "512345678" };
    states[`вход: ${code}`] = view({ notice });
  }
  states["вход: admin_api со ссылкой"] = view({
    notice: { code: "admin_api", detail: "https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com?project=1" },
  });
  return states;
}

test("трафик на узбекском и польском: в любом состоянии нет русского, кроме данных", () => {
  for (const locale of ["uz", "pl"] as const) {
    for (const [name, el] of Object.entries(trafficStates(locale))) {
      assertNoRussian(render(locale, el), `${locale} трафик, ${name}`);
    }
  }
});

test("трафик: каждый код входа через Google показывает объяснение на каждом языке", () => {
  const codes = googleCodes();
  assert.ok(codes.includes("connected") && codes.includes("exchange"), `коды не нашлись: ${codes}`);
  for (const locale of PANEL_LOCALES) {
    for (const code of codes) {
      const html = render(locale, trafficStates(locale)[`вход: ${code}`]);
      assert.match(html, /rounded-lg border border-(gold|green)\/30/, `${locale}: код «${code}» без объяснения`);
    }
  }
});

test("трафик на русском: подписи прежние, разметка в тексте превращается в код и ссылки", () => {
  const html = Object.values(trafficStates("ru"))
    .map((el) => render("ru", el))
    .join("\n");
  for (const text of [
    "Последние 30 дней, стрелки — против 30 дней до них.",
    "Яндекс Метрика",
    "визитов",
    "ср. визит",
    "Откуда приходят",
    "Страницы входа",
    "Не подключено. Подключает владелец",
    "Ресурс Google Analytics 512345678",
    "Через ключ сервисного аккаунта · ресурс 512345678",
    "Сохранить и войти через Google",
    "Google подключён, статистика берётся из ресурса 512345678.",
  ]) {
    assert.ok(html.includes(text), `нет «${text}»`);
  }
  assert.match(html, /<code[^>]*>YANDEX_METRIKA_TOKEN=токен<\/code>/);
  assert.match(html, /<b>Google Analytics Data API<\/b>/);
  assert.match(html, /<a href="https:\/\/console\.cloud\.google\.com\/apis\/library"[^>]*>console\.cloud\.google\.com<\/a>/);
  // Числа — по правилам языка панели: у русских 1 200, у поляков четыре
  // цифры не разделяются.
  assert.match(html, /1\u00a0200/);
  const pl = render("pl", trafficStates("pl")["цифры есть"]);
  assert.match(pl, />1200</);
  assert.match(pl, /30 dni/);
});

test("коды ответов действий есть в словарях: заявки и кандидаты", () => {
  // Заявки: все причины отказа из lib/admin/orders.ts.
  const orders = read("lib/admin/orders.ts");
  const union = orders.slice(orders.indexOf("export type OrderRefusal"), orders.indexOf("type Refused"));
  const orderCodes = [...union.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
  assert.ok(orderCodes.length >= 10, `причин нашлось ${orderCodes.length}`);
  for (const code of orderCodes) assert.ok(code in orderErrorDict, `заявки: нет «${code}» в словаре`);
  for (const [, code] of orders.matchAll(/fail\("([a-z_]+)"/g)) assert.ok(code in orderErrorDict, `заявки: «${code}» мимо словаря`);
  assert.doesNotMatch(read("app/admin/orders/actions.ts"), /encodeURIComponent\(result\.reason\)/);

  // Кандидаты: коды действия и причины из lib/hiring/store.ts.
  const hiring = read("lib/hiring/store.ts") + read("app/admin/candidates/actions.ts");
  const codes = new Set([
    ...[...hiring.matchAll(/why: "([a-z_]+)"/g)].map((m) => m[1]),
    ...[...hiring.matchAll(/\?e=([a-z_]+)/g)].map((m) => m[1]),
  ]);
  assert.ok(codes.size >= 9, `кодов нашлось ${codes.size}`);
  for (const code of codes) assert.ok(code in candidateErrorDict, `кандидаты: нет «${code}» в словаре`);

  // Причина у «запретных оснований» подставляет найденное в разборе.
  assert.equal(
    pick(candidateErrorDict, "ru").forbidden("возраст"),
    "Разбор опёрся на то, что к работе не относится (возраст). Он не сохранён — попробуйте ещё раз.",
  );
});

test("состояние скаута: бот получает прежний русский, панель — язык сотрудника", () => {
  const NOW = Date.parse("2026-09-28T12:00:00Z");
  const pulse = (over: Partial<ScoutPulse>): ScoutPulse => ({
    at: new Date(NOW - 60_000).toISOString(),
    startedAt: new Date(NOW - 3_600_000).toISOString(),
    chatsWatched: 29,
    chatsReading: 13,
    seen: 300,
    passedPrefilter: 4,
    classified: 4,
    saved: 2,
    notified: 2,
    dropped: {},
    ...over,
  });
  const cases = [
    null,
    pulse({ at: new Date(NOW - 3_600_000).toISOString() }),
    pulse({ chatsReading: 0 }),
    pulse({ classified: 0 }),
    pulse({ seen: 0 }),
    pulse({ saved: 0 }),
    pulse({}),
  ];
  assert.equal(diagnose(cases[5], NOW).says, "Механизм цел: увидел 300, до модели дошло 4. Запросов на разработку пока не было — это тишина в чатах, а не поломка.");
  assert.equal(diagnose(cases[1], NOW).says, "Скаут молчит 60 мин. Процесс упал или остановлен — проверьте systemd.");
  for (const locale of ["uz", "pl"] as const) {
    for (const p of cases) {
      const verdict = diagnose(p, NOW, locale);
      assert.equal(verdict.state, diagnose(p, NOW).state);
      assert.ok(!CYRILLIC.test(verdict.says), `${locale}: ${verdict.says}`);
    }
  }
});

/**
 * Страницы, которым нужна база: вне комментариев русского текста нет, всё
 * берётся из словаря на языке сотрудника.
 */
test("страницы разделов: весь текст — из словаря, в коде только комментарии по-русски", () => {
  const files = [
    "app/admin/orders/page.tsx",
    "app/admin/orders/actions.ts",
    "app/admin/scout/page.tsx",
    "app/admin/scout/actions.ts",
    "app/admin/talks/page.tsx",
    "app/admin/candidates/page.tsx",
    "app/admin/candidates/actions.ts",
    "app/admin/stats/page.tsx",
    "app/admin/traffic/page.tsx",
    "components/admin/traffic-panel.tsx",
    "app/admin/google/actions.ts",
  ];
  for (const file of files) {
    const code = read(file)
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/\s\/\/ .*$/gm, "");
    const line = code.split("\n").find((l) => CYRILLIC.test(l));
    assert.equal(line, undefined, `${file}: русский текст мимо словаря: ${line?.trim()}`);
  }
  for (const [file, dict] of [
    ["app/admin/orders/page.tsx", "ordersDict"],
    ["app/admin/scout/page.tsx", "scoutDict"],
    ["app/admin/talks/page.tsx", "talksDict"],
    ["app/admin/candidates/page.tsx", "candidatesDict"],
    ["app/admin/stats/page.tsx", "statsDict"],
  ]) {
    assert.match(read(file), new RegExp(`const t = pick\\(${dict}, locale\\)`), `${file}: не на языке сотрудника`);
    assert.match(read(file), /const locale = staff\.panel_locale;/);
  }
  assert.match(read("app/admin/traffic/page.tsx"), /locale=\{staff\.panel_locale\}/);
});
