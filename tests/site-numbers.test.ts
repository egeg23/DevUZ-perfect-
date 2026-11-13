/**
 * Цены, числа студии и слово «прототип» на публичном сайте.
 *
 * Владелец, 13.11.2026: «Лендинг у нас идет от 500$, аудит сайта от 750$»;
 * «на главной странице указано 550+ завершенных проектов и ответ за 20
 * секунд, а на странице „О студии“ — уже 600+ проектов и 60 секунд на
 * ответ»; «убери слово "прототипы" вообще».
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { basePriceUzs, estimate, defaultSelection } from "@/lib/calculator";
import { boxCopy } from "@/content/box-copy";
import { cases } from "@/content/cases";
import { proof, USD_RATE } from "@/content/company";
import { getDictionary } from "@/content/dictionaries";
import { homeCopy } from "@/content/home-copy";
import { SITE_PRICES } from "@/content/prices";
import { siteInstantCopy } from "@/content/site-instant-copy";
import { categories } from "@/content/calculator";
import { PROMO } from "@/lib/admin/mockup-offer";
import { locales } from "@/lib/i18n";

/** Все строки объекта, кроме служебных полей (адреса, ключи). */
function strings(value: unknown, out: string[] = [], key = ""): string[] {
  if (typeof value === "string") {
    if (!["href", "slug", "url", "src", "poster", "niches", "forNiches"].includes(key)) out.push(value);
  } else if (Array.isArray(value)) {
    if (key !== "niches" && key !== "forNiches") for (const v of value) strings(v, out, key);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) strings(v, out, k);
  }
  return out;
}

function siteTexts(): string[] {
  const out: string[] = [];
  for (const l of locales) strings(getDictionary(l), out);
  strings(homeCopy, out);
  strings(cases, out);
  strings(boxCopy, out);
  strings(siteInstantCopy, out);
  strings(categories, out);
  return out;
}

test("цены сайта: лендинг и аудит не ниже SITE_PRICES, акция — та же цена", () => {
  assert.equal(SITE_PRICES.landing, 500);
  assert.equal(SITE_PRICES.audit, 750);
  assert.equal(PROMO.landing.price, SITE_PRICES.landing);
  const usd = (uzs: number) => uzs / USD_RATE;
  assert.ok(usd(basePriceUzs("landing")) >= SITE_PRICES.landing, "калькулятор: лендинг дешевле 500 $");
  assert.ok(usd(basePriceUzs("support")) >= SITE_PRICES.audit, "калькулятор: аудит чужого проекта дешевле 750 $");
  // Так калькулятор показывает цену в долларах (formatUsd): $500 и $750.
  const shown = (slug: string) => Math.round(estimate(slug, defaultSelection(slug), "ru")!.lowUzs / USD_RATE / 50) * 50;
  assert.equal(shown("landing"), SITE_PRICES.landing);
  assert.equal(shown("support"), SITE_PRICES.audit);
});

test("цены сайта: в текстах лендинг не дешевле 500 $, аудит не дешевле 750 $", () => {
  const bad: string[] = [];
  const num = (s: string) => Number(s.replace(/[\s,  ]/g, ""));
  for (const s of siteTexts()) {
    for (const m of s.matchAll(/(лендинг|landing|lending|落地页)[^.。;:]{0,25}?\$?\s?(\d[\d\s,  ]*)\s?(\$|美元)?/gi)) {
      if (m[2] && /\$|美元/.test(m[0]) && num(m[2]) < SITE_PRICES.landing) bad.push(m[0]);
    }
    for (const m of s.matchAll(/(аудит|audit|audyt|审计)[^.。;:]{0,25}?\$\s?(\d[\d\s,  ]*)|(аудит|audit|audyt|审计)[^.。;:]{0,25}?(\d[\d\s,  ]*)\s?(\$|美元)/gi)) {
      const n = num(m[2] ?? m[4] ?? "");
      if (n && n < SITE_PRICES.audit) bad.push(m[0]);
    }
  }
  assert.deepEqual(bad, []);
});

test("числа студии: проектов — только proof.projects", () => {
  assert.equal(proof.projects, 600);
  const bad: string[] = [];
  for (const s of siteTexts()) {
    for (const m of s.matchAll(/(\d[\d  ]*)\s*\+\s*(завершённых\s+|completed\s+|yakunlangan\s+|завершених\s+|zrealizowanych\s+|个已完成)?(проект|проєкт|project|loyiha|projekt|项目)/gi)) {
      if (Number(m[1].replace(/\s/g, "")) !== proof.projects) bad.push(m[0]);
    }
  }
  assert.deepEqual(bad, []);
});

test("числа студии: время ответа одно — proof.replySeconds", () => {
  assert.equal(proof.replySeconds, 20);
  const reply = /(ответ|отвеча|відпов|repl|javob|回复|odpowi)/i;
  const bad: string[] = [];
  for (const s of siteTexts()) {
    for (const m of s.matchAll(/(\d+)[\s-]?(секунд|second|soniya|秒|sekund)/gi)) {
      const around = s.slice(Math.max(0, m.index! - 40), m.index! + m[0].length + 25);
      // «Проверим ваш сайт за 60 секунд» — проверка сайта, не ответ.
      if (!reply.test(around)) continue;
      if (Number(m[1]) !== proof.replySeconds) bad.push(around);
    }
  }
  assert.deepEqual(bad, []);
});

test("слова «прототип» на сайте нет ни на одном языке", () => {
  const word = /прототип|prototyp|prototip|原型/i;
  const bad = siteTexts().filter((s) => word.test(s));
  assert.deepEqual(bad, []);
  for (const l of locales) assert.equal("protoTag" in getDictionary(l).cases, false);
});
