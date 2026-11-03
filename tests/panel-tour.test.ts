import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { tourDict } from "@/content/admin-panel/tour";
import { TOUR_VERSION, tourKey } from "@/lib/admin/panel-tour";

/**
 * Владелец, 03.11.2026: «При первом заходе сотрудников сделай красивый
 * туториал на 5-7 шагов, чтобы они поняли, что поменялся визуал и стало
 * удобнее, но функционал не трогали».
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("знакомство: 5–7 шагов, у каждого текст на трёх языках, первый — «функции не менялись»", () => {
  const tour = read("components/admin/panel-tour.tsx");
  const steps = [...tour.matchAll(/\{ key: "(s\d)", target:/g)].map((m) => m[1]);
  assert.ok(steps.length >= 5 && steps.length <= 7, `шагов ${steps.length}`);
  for (const key of steps) {
    assert.ok(Object.hasOwn(tourDict, `${key}_title`) && Object.hasOwn(tourDict, `${key}_body`), key);
  }
  assert.match(tourDict.s1_body.ru, /работает как раньше/);
  assert.match(tourDict.s1_same.ru, /Функции не менялись/);
});

test("подсветка — настоящие места панели: метки стоят в каркасе", () => {
  const tour = read("components/admin/panel-tour.tsx");
  const nav = read("components/admin/nav-menu.tsx");
  const shell = read("components/admin/shell.tsx");
  for (const mark of [...tour.matchAll(/\[data-tour='([a-z]+)'\]/g)].map((m) => m[1])) {
    assert.ok(nav.includes(`data-tour="${mark}"`) || shell.includes(`data-tour="${mark}"`), `нет метки data-tour="${mark}"`);
  }
  assert.match(shell, /<PanelTour \/>/);
});

test("один раз на сотрудника: «видел» — в базе по себе из куки, снова — из «Настроек»", () => {
  assert.equal(tourKey("abc"), `panel-tour:${TOUR_VERSION}:abc`);
  const route = read("app/admin/tour/route.ts");
  assert.match(route, /const staff = await currentStaff\(\);/);
  assert.doesNotMatch(route, /searchParams|body\.staff|body\.id/, "чужой id не принимается");
  assert.match(route, /markTourSeen\(staff\.id,/);
  const store = read("lib/admin/panel-tour-store.ts");
  assert.match(store, /if \(error\) return true;/, "база не ответила — не показываем на каждом переходе");
  // Клиентская часть не тянет базу.
  assert.doesNotMatch(read("lib/admin/panel-tour.ts"), /supabase/);
  assert.match(read("app/admin/settings/page.tsx"), /<TourAgain \/>/);
  assert.match(read("app/globals.css"), /prefers-reduced-motion: reduce\) \{\s*\.os-tour-dim,/);
});
