/**
 * Обучение по «Рынкам» (components/admin/markets-tour.tsx).
 *
 * Владелец, 06.11.2026: «Как будет готово: краткий туториал для менеджеров
 * по новым странам разделу сделай, прям очень простыми словами, подсвети
 * нужные моменты в дашборде».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { marketsTourDict } from "@/content/admin-panel/markets-tour";
import { MARKETS, PLACE_COUNT, marketOf } from "@/content/markets";
import { MARKETS_TOUR, TOUR_VERSION, tourKey, tourOf } from "@/lib/admin/panel-tour";
import { parseChatInput } from "@/lib/scout/extra-chats";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("шаги: 6–9, у каждого заголовок и текст на трёх языках, подсветка — настоящие места страниц", () => {
  const tour = read("components/admin/markets-tour.tsx");
  const steps = [...tour.matchAll(/\{ key: "(m\d)", path: (null|"[^"]+"|MARKET_DEMO), target: (null|"[^"]+") \}/g)];
  assert.ok(steps.length >= 6 && steps.length <= 9, `шагов ${steps.length}`);
  const view = read("components/admin/markets-view.tsx");
  const nav = read("components/admin/nav-menu.tsx");
  for (const [, key, , target] of steps) {
    assert.ok(Object.hasOwn(marketsTourDict, `${key}_title`), `${key}_title`);
    assert.ok(Object.hasOwn(marketsTourDict, `${key}_body`) || key === "m8", `${key}_body`);
    const mark = target.match(/data-tour='([a-z-]+)'/)?.[1];
    if (mark) assert.ok(view.includes(`"${mark}"`), `нет метки data-tour="${mark}" в «Рынках»`);
    else if (target !== "null") assert.match(nav, /className="os-rail"/, "полоса значков — в nav-menu");
  }
  // Очень простыми словами: короткие тексты, без слов вроде «конверсия».
  for (const [key, entry] of Object.entries(marketsTourDict)) {
    if (typeof entry.ru !== "string") continue;
    assert.ok(entry.ru.length <= 260, `${key}: длинно (${entry.ru.length})`);
    assert.doesNotMatch(entry.ru, /конверси|атрибуц|квалификац|лидогенерац/i, key);
  }
});

test("страна для примера — главный рынок с Telegram-группой для шага «Скауту»", () => {
  const tour = read("components/admin/markets-tour.tsx");
  const demo = tour.match(/export const MARKET_DEMO = "\/admin\/markets\/([a-z]+)"/)?.[1];
  assert.ok(demo, "MARKET_DEMO");
  const market = marketOf(demo);
  assert.ok(market && market.priority === "high", "пример — главный рынок");
  assert.ok(market.resources.some((r) => r.kind === "telegram" && parseChatInput(r.url)), "у страны есть группа для «Скауту»");
  assert.equal(PLACE_COUNT, MARKETS.reduce((n, m) => n + m.resources.length, 0));
});

test("менеджеру — само, один раз, после знакомства с панелью; остальным — кнопкой в «Рынках» и «Настройках»", () => {
  const shell = read("components/admin/shell.tsx");
  assert.match(shell, /<MarketsTour auto=\{staff\.role === "manager"\}/);
  assert.match(shell, /opens\(staff, "\/admin\/markets"\) \? \(\s*<MarketsTour/);
  const tour = read("components/admin/markets-tour.tsx");
  assert.match(tour, /window\.addEventListener\(TOUR_DONE_EVENT, check, \{ once: true \}\)/, "ждёт знакомства с панелью");
  assert.match(tour, /body: JSON\.stringify\(\{ tour: MARKETS_TOUR,/);
  assert.match(read("components/admin/panel-tour.tsx"), /window\.dispatchEvent\(new Event\(TOUR_DONE_EVENT\)\)/);
  assert.match(read("components/admin/markets-view.tsx"), /<MarketsTourAgain \/>/);
  assert.match(read("app/admin/settings/page.tsx"), /<MarketsTourAgain \/>/);
});

test("«видел» — в базе по обучению: чужое имя обучения не принимается, ключ знакомства прежний", () => {
  assert.equal(tourKey("abc"), `panel-tour:${TOUR_VERSION}:abc`);
  assert.equal(tourKey("abc", MARKETS_TOUR), `panel-tour:${MARKETS_TOUR}:abc`);
  assert.equal(tourOf(MARKETS_TOUR), MARKETS_TOUR);
  assert.equal(tourOf("../../etc"), TOUR_VERSION);
  assert.equal(tourOf(undefined), TOUR_VERSION);
  const route = read("app/admin/tour/route.ts");
  assert.match(route, /markTourSeen\(staff\.id, step, body\.skipped === true, new Date\(\), tourOf\(body\.tour\)\)/);
});
