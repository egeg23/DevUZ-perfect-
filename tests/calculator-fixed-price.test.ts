import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { categories } from "@/content/calculator";
import { getDictionary } from "@/content/dictionaries";
import { locales } from "@/lib/i18n";
import { basePriceUzs, defaultSelection, estimate, estimateToMessage } from "@/lib/calculator";

// Владелец, 09.11.2026: «цены указываем не „от“ в калькуляторе, а фиксированную».

test("калькулятор: одна цена, без «от» и вилки", () => {
  const ui = readFileSync("components/calculator/price-calculator.tsx", "utf8");
  assert.doesNotMatch(ui, /calculator\.from/, "в калькуляторе нет «от»");
  assert.doesNotMatch(ui, /highUzs/, "в калькуляторе нет верхней границы вилки");
  assert.match(ui, /result\.priceUzs/);
  const mk = readFileSync("components/marketing/marketing-calculator.tsx", "utf8");
  assert.doesNotMatch(mk, /copy\.from/, "в калькуляторе маркетинга нет «от»");
});

test("калькулятор: цена на карточке типа = цене расчёта без допов", () => {
  for (const c of categories) {
    const e = estimate(c.slug, defaultSelection(c.slug), "ru");
    assert.ok(e);
    assert.equal(basePriceUzs(c.slug), e.priceUzs);
    assert.ok(e.priceUzs > 0);
    assert.equal(e.priceUzs % 500_000, 0, "круглая сумма");
  }
});

test("калькулятор: в чат уходит одна цена", () => {
  const c = categories[0];
  const e = estimate(c.slug, defaultSelection(c.slug), "ru");
  assert.ok(e);
  const text = estimateToMessage("Сайт", e, "ru", "Привет", "недель");
  const priceLine = text.split("\n").find((l) => l.includes("сум"));
  assert.ok(priceLine);
  assert.doesNotMatch(priceLine, /[–—]/, "без вилки");
});

test("калькулятор: подпись — цена фиксированная, на всех языках сайта", () => {
  for (const locale of locales) {
    const d = getDictionary(locale).calculator;
    assert.doesNotMatch(d.result, /оценк|estimate|baholash|估算|оцінк|wycena/i, `${locale}: не «оценка»`);
    assert.doesNotMatch(d.disclaimer, /ориентир|guide|mo‘ljal|参考|орієнтир|orientac/i, `${locale}: не «ориентир»`);
    assert.doesNotMatch(d.disclaimer, /—/, `${locale}: без длинного тире`);
  }
});
