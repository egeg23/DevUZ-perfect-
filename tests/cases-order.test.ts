/**
 * Кейсы на сайте — с роликом наверху, со снимками ниже, внутри — по дате.
 *
 * Владелец, 03.10.2026: «Свежие проекты с датами ставь наверх» — до этого
 * MedAcademy, Transtelecom и Arsenal D стояли в списке ниже весенних проектов
 * и на главную не попадали. Владелец, 24.10.2026: «Вынеси все анимированные
 * заставки кейсов вверх, а те, у которых только скрины, ниже».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { caseDate, cases, casesByDate, casesOnSite, coverRank, showcaseSlug } from "@/content/cases";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("у каждого кейса дата: день, если известен, иначе месяц", () => {
  for (const item of cases) {
    assert.match(item.date, /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/, `${item.slug}: дата «${item.date}»`);
  }
});

test("по дате новые сверху; на сайте — сначала ролик, потом снимки, внутри — по дате", () => {
  for (let i = 1; i < casesByDate.length; i += 1) {
    assert.ok(casesByDate[i - 1].date >= casesByDate[i].date, `${casesByDate[i - 1].slug} ниже ${casesByDate[i].slug}`);
  }
  assert.equal(casesOnSite.length, cases.length, "на сайте пропал кейс");
  for (let i = 1; i < casesOnSite.length; i += 1) {
    const [a, b] = [casesOnSite[i - 1], casesOnSite[i]];
    assert.ok(coverRank(a) <= coverRank(b), `${a.slug} (заставка ${coverRank(a)}) выше ${b.slug} (${coverRank(b)})`);
    if (coverRank(a) === coverRank(b)) assert.ok(a.date >= b.date, `${a.slug} ниже ${b.slug} в своей группе`);
  }
  // Ролик — у прототипа и у витрины под паролем, снимки — `shots`.
  assert.equal(coverRank({ prototype: { href: "/proto/x", teaser: "/cases/x/teaser" }, shots: 3 }), 0);
  assert.equal(coverRank({ teaser: "/cases/x/teaser" }), 0);
  assert.equal(coverRank({ shots: 4 }), 1);
  assert.equal(coverRank({}), 2);
  // Демо студии (игры для рекламы, хаб Instagram → Telegram) на главную не
  // идут: там проекты клиентов. В списке /cases они стоят в своей группе.
  // Макеты из «Макетов» вошли в кейсы 20.10.2026, каждый со своей датой.
  const home = casesOnSite.filter((c) => c.slug !== showcaseSlug && !c.demo).slice(0, 6);
  // SamAuto — первым: кейс с живым прототипом (владелец, 21.10.2026).
  assert.deepEqual(home.map((c) => c.slug), ["samauto", "jiguli", "syanie-severa", "tovar", "sia", "amani"]);
  assert.ok(home.every((c) => coverRank(c) === 0), "на главной карточка без ролика");
  assert.deepEqual(casesByDate.slice(0, 4).map((c) => c.slug), ["samauto", "usemtau", "jiguli", "semtravel"]);
  assert.ok(casesByDate.find((c) => c.slug === "ig-hub")?.demo, "хаб — демо, не клиент");
  // Главная, список и «следующий проект» берут порядок сайта; презентация
  // для партнёров — список без заставок, в ней шесть самых свежих.
  assert.match(read("components/sections/cases.tsx"), /casesOnSite\.filter\(\(item\) => item\.slug !== showcaseSlug && !item\.demo\)\.slice\(0, 6\)/);
  assert.match(read("app/[locale]/cases/page.tsx"), /\{casesOnSite\.map\(/);
  assert.match(read("app/[locale]/cases/[slug]/page.tsx"), /const next = casesOnSite\[/);
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
