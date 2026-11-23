import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { LEADGEN_LOCALES, LEADGEN_PATH, LEADGEN_TARIFFS, perLead, rub } from "@/content/leadgen";
import { leadKindOf } from "@/lib/admin/lead-kinds";
import { INBOUND_SOURCES } from "@/lib/admin/sales-stages";
import { formSource } from "@/lib/qualify/form-sources";

test("лидогенерация: тарифы ровно как сказал владелец", () => {
  const byKey = Object.fromEntries(LEADGEN_TARIFFS.map((t) => [t.key, t]));
  assert.equal(byKey.test.price, 200_000);
  assert.deepEqual(byKey.test.leads, [30, 55]);
  assert.equal(byKey.test.term, "3 недели");
  assert.equal(byKey.smart.price, 400_000);
  assert.deepEqual(byKey.smart.leads, [70, 125]);
  assert.equal(byKey.standard.price, 735_000);
  assert.deepEqual(byKey.standard.leads, [115, 170]);
  assert.equal(byKey.max.price, null, "Максимум — договорная");
});

test("лидогенерация: цена лида считается из тарифа", () => {
  assert.deepEqual(perLead(LEADGEN_TARIFFS[0]), [3640, 6670]);
  assert.equal(perLead(LEADGEN_TARIFFS[3]), null);
  assert.equal(rub(200000), "200 000 ₽");
});

test("лидогенерация: заявка идёт своим источником, входящей", () => {
  assert.equal(formSource("leadgen"), "leadgen");
  assert.ok(INBOUND_SOURCES.includes("leadgen"));
  assert.equal(leadKindOf({ source: "leadgen" }), "inbound");
  const mig = readFileSync("supabase/migrations/0192_lead_source_leadgen.sql", "utf8");
  assert.match(mig, /'leadgen'/);
});

test("лидогенерация: страница только по-русски, в карте сайта и на русской главной", () => {
  assert.deepEqual([...LEADGEN_LOCALES], ["ru"]);
  const page = readFileSync("app/[locale]/leadgen/page.tsx", "utf8");
  assert.match(page, /redirect\(`\/ru\/\$\{LEADGEN_PATH\}`\)/);
  assert.match(readFileSync("app/sitemap.ts", "utf8"), /ru\/\$\{LEADGEN_PATH\}/);
  const home = readFileSync("components/home/glass-home.tsx", "utf8");
  assert.match(home, /locale === "ru" \? \([\s\S]*<LeadgenBlock \/>/);
  assert.equal(LEADGEN_PATH, "leadgen");
});

test("лидогенерация: на сайте нет перехвата заявок и парсинга контактов", () => {
  const all = ["content/leadgen.ts", "app/[locale]/leadgen/page.tsx", "components/home/leadgen-block.tsx", "components/leadgen/flow.tsx", "components/leadgen/form.tsx"]
    .map((f) => readFileSync(f, "utf8"))
    .join("\n")
    // комментарий-объяснение в content/leadgen.ts — не текст страницы
    .replace(/\/\*\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(all, /перехват|парсинг|конкурент/i);
});

test("лидогенерация: анимация стоит при «меньше движения»", () => {
  for (const f of ["components/leadgen/flow.module.css", "components/home/leadgen-block.module.css"]) {
    const css = readFileSync(f, "utf8");
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.doesNotMatch(css, /animation[^;]*\b(width|height|left|top)\b/);
  }
});

test("лидогенерация: ползунок берёт цену только из тарифов", async () => {
  const { quoteFor, LEADGEN_PROOF, QUOTE_MIN, QUOTE_MAX } = await import("@/content/leadgen");
  assert.equal(quoteFor(30).tariff.key, "test");
  assert.equal(quoteFor(55).tariff.key, "test");
  assert.equal(quoteFor(60).tariff.key, "smart", "больше 55 — уже Смарт мини");
  assert.equal(quoteFor(60).perLead, 5710, "лидов будет не меньше 70 по договору");
  assert.equal(quoteFor(125).tariff.key, "smart");
  assert.equal(quoteFor(150).tariff.key, "standard");
  assert.equal(quoteFor(171).tariff.key, "max");
  assert.equal(quoteFor(QUOTE_MAX).perLead, null, "Максимум — договорная");
  assert.ok(QUOTE_MIN <= 30);
  const prices = new Set(LEADGEN_TARIFFS.map((t) => t.price));
  for (let n = QUOTE_MIN; n <= QUOTE_MAX; n += 5) assert.ok(prices.has(quoteFor(n).tariff.price));
  assert.deepEqual({ ...LEADGEN_PROOF }, { dental: 72, auto: 7, modular: 2, monthlyLeads: 9500 });
  const page = readFileSync("app/[locale]/leadgen/page.tsx", "utf8");
  assert.match(page, /<LeadgenCalc \/>/);
  assert.match(page, /LEADGEN_PROOF\.dental/);
  assert.match(readFileSync("components/home/leadgen-block.tsx", "utf8"), /LEADGEN_PROOF\.monthlyLeads/);
  assert.match(readFileSync("components/leadgen/calc.module.css", "utf8"), /prefers-reduced-motion/);
});
