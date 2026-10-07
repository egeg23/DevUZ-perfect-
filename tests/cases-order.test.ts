/**
 * Кейсы на сайте — по дате, новые сверху, с датой на карточке.
 *
 * Владелец, 03.10.2026: «Свежие проекты с датами ставь наверх» — до этого
 * MedAcademy, Transtelecom и Arsenal D стояли в списке ниже весенних проектов
 * и на главную не попадали.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { caseDate, cases, casesByDate, showcaseSlug } from "@/content/cases";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("у каждого кейса дата: день, если известен, иначе месяц", () => {
  for (const item of cases) {
    assert.match(item.date, /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/, `${item.slug}: дата «${item.date}»`);
  }
});

test("на сайте новые сверху; на главной — шесть самых свежих", () => {
  for (let i = 1; i < casesByDate.length; i += 1) {
    assert.ok(casesByDate[i - 1].date >= casesByDate[i].date, `${casesByDate[i - 1].slug} ниже ${casesByDate[i].slug}`);
  }
  const home = casesByDate.filter((c) => c.slug !== showcaseSlug).slice(0, 6).map((c) => c.slug);
  assert.deepEqual(home, ["apollo-travel", "engelberg", "arsenal-d", "medacademy", "comfort-mebel", "transtelecom"]);
  // Главная, список, «следующий проект» и презентация студии берут один порядок.
  assert.match(read("components/sections/cases.tsx"), /casesByDate\.filter\(\(item\) => item\.slug !== showcaseSlug\)\.slice\(0, 6\)/);
  assert.match(read("app/[locale]/cases/page.tsx"), /\{casesByDate\.map\(/);
  assert.match(read("app/[locale]/cases/[slug]/page.tsx"), /const next = casesByDate\[/);
  assert.match(read("app/[locale]/partners/deck/studio/page.tsx"), /casesByDate\.filter/);
});

test("дата на языке сайта: день — если известен, иначе месяц", () => {
  const day = { date: "2026-10-02" };
  const month = { date: "2026-08" };
  assert.equal(caseDate(day, "ru"), "2 октября 2026");
  assert.equal(caseDate(month, "ru"), "август 2026");
  assert.equal(caseDate(day, "en"), "October 2, 2026");
  assert.match(caseDate(day, "uz"), /^2-oktabr,? 2026$/);
  assert.equal(caseDate(day, "uk"), "2 жовтня 2026");
  assert.equal(caseDate(day, "pl"), "2 października 2026");
  assert.equal(caseDate(day, "zh"), "2026年10月2日");
});

test("пример для письма от даты не зависит: порядок массива — прежний", () => {
  // Письмо берёт первый кейс ниши (lib/audit/proof.ts) из cases, а не из
  // casesByDate — иначе новый макет молча менял бы пример в рассылке.
  assert.match(read("lib/audit/proof.ts"), /cases\.find\(\(item\) => item\.forNiches\.includes\(slug\)\)/);
  assert.equal(cases.find((c) => c.forNiches.includes("mebel"))?.slug, "namuna");
});
