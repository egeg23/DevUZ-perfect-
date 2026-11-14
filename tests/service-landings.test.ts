/**
 * Страницы под поисковые запросы (content/service-landings).
 *
 * Владелец, 14.11.2026: «мы должны перегнать топ-10 по Ташкенту точно, не
 * забудь адаптировать под [все] языки». Держит: шесть языков одной формы,
 * запрос в заголовке, описании и первом абзаце, числа только значками из
 * калькулятора и `proof`, нет «прототипа», страница в карте сайта и в
 * маршруте.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { cases } from "@/content/cases";
import { LANDINGS, LANDING_SLUGS, LANDING_TEXT } from "@/content/service-landings";
import { calcPrice, fillText, landingText, shortUzs } from "@/content/service-landings/fill";
import { categories } from "@/content/calculator";
import { locales } from "@/lib/i18n";

const PLACEHOLDERS = new Set(["price", "priceShort", "usd", "weeks", "hours", "staff", "projects", "countries"]);

function all(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) all(v, out);
  else if (value && typeof value === "object") for (const v of Object.values(value)) all(v, out);
  return out;
}

test("страницы под запросы: у каждого языка все шесть страниц той же формы, что русская", () => {
  const ru = LANDING_TEXT.ru;
  for (const l of locales) {
    const loc = LANDING_TEXT[l];
    assert.equal(loc.ui.compareRows.length, ru.ui.compareRows.length, `${l}: compareRows`);
    for (const row of loc.ui.compareRows) assert.equal(row.length, 4, `${l}: строка сравнения`);
    for (const slug of LANDING_SLUGS) {
      const a = loc.pages[slug];
      const b = ru.pages[slug];
      assert.ok(a, `${l}/${slug}: нет страницы`);
      for (const key of ["kinds", "included", "steps", "local", "faq"] as const) {
        assert.equal(a[key].length, b[key].length, `${l}/${slug}: ${key}`);
      }
      for (const s of all(a)) assert.ok(s.trim(), `${l}/${slug}: пустая строка`);
    }
  }
});

test("страницы под запросы: виды работ — по одному типу калькулятора на каждый", () => {
  const slugs = new Set(categories.map((c) => c.slug));
  for (const meta of LANDINGS) {
    assert.ok(slugs.has(meta.calc), `${meta.slug}: ${meta.calc}`);
    assert.equal(meta.kinds.length, LANDING_TEXT.ru.pages[meta.slug].kinds.length, meta.slug);
    for (const k of meta.kinds) assert.ok(slugs.has(k.calc), `${meta.slug}: ${k.calc}`);
    for (const c of meta.cases) assert.ok(cases.some((x) => x.slug === c), `${meta.slug}: кейс ${c}`);
  }
});

test("страницы под запросы: запрос — в заголовке, описании и первом предложении", () => {
  for (const l of locales) {
    for (const meta of LANDINGS) {
      const text = landingText(meta, l);
      const q = text.query.toLowerCase();
      assert.ok(text.seoTitle.toLowerCase().includes(q), `${l}/${meta.slug}: title без «${text.query}»`);
      assert.ok(text.seoDescription.toLowerCase().includes(q), `${l}/${meta.slug}: description без запроса`);
      const first = text.lead.split(/(?<=[.!?。])\s*/)[0].toLowerCase();
      assert.ok(first.includes(q), `${l}/${meta.slug}: первое предложение без запроса`);
      assert.ok(text.seoTitle.length <= 75, `${l}/${meta.slug}: title длиннее 75 (${text.seoTitle.length})`);
    }
  }
});

test("страницы под запросы: числа — только значками, значки все известные", () => {
  const p = calcPrice("landing");
  for (const l of locales) {
    for (const s of all(LANDING_TEXT[l])) {
      for (const m of s.matchAll(/\{(\w+)\}/g)) assert.ok(PLACEHOLDERS.has(m[1]), `${l}: значок {${m[1]}}`);
      assert.doesNotMatch(fillText(s, p, l), /\{\w+\}/, `${l}: не подставилось «${s}»`);
      // Цен строкой нет: «$500», «6 000 000 сум» пишутся только через значки.
      assert.doesNotMatch(s, /\$\s?\d|\d\s?\$|\d[\d\s ]{3,}\s?(сум|so‘m|UZS|苏姆)/, `${l}: цена текстом «${s}»`);
    }
  }
});

test("страницы под запросы: короткая цена", () => {
  assert.equal(shortUzs(6_000_000, "ru"), "6 млн сум");
  assert.equal(shortUzs(9_500_000, "ru"), "9,5 млн сум");
  assert.equal(shortUzs(9_500_000, "uz"), "9.5 mln so‘m");
  assert.equal(shortUzs(6_000_000, "zh"), "600万苏姆");
});

test("страницы под запросы: без «прототипа», узбекский и польский без кириллицы", () => {
  for (const l of locales) {
    for (const s of all(LANDING_TEXT[l])) assert.doesNotMatch(s, /прототип|prototyp|prototip|原型/i, `${l}: ${s}`);
  }
  for (const l of ["uz", "pl", "en", "zh"] as const) {
    for (const s of all(LANDING_TEXT[l])) assert.doesNotMatch(s, /[а-яё]/i, `${l}: кириллица «${s}»`);
  }
});

test("страницы под запросы: в маршруте, карте сайта и на странице услуг", () => {
  const page = readFileSync("app/[locale]/services/[slug]/page.tsx", "utf8");
  assert.match(page, /LANDING_SLUGS/);
  assert.match(page, /faqSchema\(text\.faq\)/);
  assert.match(readFileSync("app/sitemap.ts", "utf8"), /LANDING_SLUGS\.map/);
  assert.match(readFileSync("components/sections/services.tsx", "utf8"), /LANDING_SLUGS/);
});
