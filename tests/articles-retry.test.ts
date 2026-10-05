/**
 * Статья не теряет слот из-за одного забытого запроса.
 *
 * 5 октября статья в 16:00 не вышла: дешёвая модель дважды написала
 * описание без «таргет в Instagram», а всё остальное было в порядке.
 * Теперь попыток три, а если не хватает только запроса в заголовке или
 * описании — его ставит код. И Google Trends на «слишком часто» получает
 * второй круг после паузы.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import type { MarketingTopic } from "@/content/marketing-topics";
import { missingStems } from "@/lib/marketing/article-check";
import { placeQuery } from "@/lib/marketing/articles-run";

const topic: MarketingTopic = {
  key: "target-bez-pikselya",
  kind: "mistake",
  slug: "target-bez-pikselya",
  brief: "Таргет без пикселя на сайте",
  query: { ru: "таргет в Instagram", uz: "Instagram target" },
};

const text = {
  title: "Реклама в Instagram без пикселя: почему она дорожает",
  description: "Без пикселя реклама не знает, кто купил, и показывает её всем подряд — каждая заявка выходит дороже.",
  paragraphs: ["Таргет в Instagram учится на тех, кто купил."],
  tips: ["Поставьте пиксель."],
};

test("не хватает запроса в описании — код ставит его в начало, остальное не трогает", () => {
  assert.ok(missingStems("таргет в Instagram", text.description).length, "в описании запроса нет");
  const placed = placeQuery(topic, "ru", text);
  assert.ok(placed);
  assert.match(placed!.description, /^Таргет в Instagram: без пикселя реклама/);
  assert.deepEqual(missingStems("таргет в Instagram", placed!.description), []);
  // Заголовок, где запрос уже есть по словам, не меняется.
  const withTitle = { ...text, title: "Таргет в Instagram без пикселя: почему он дорожает" };
  assert.equal(placeQuery(topic, "ru", withTitle)!.title, withTitle.title);
  // Длина не позволяет — не чиним, статья честно не выходит.
  assert.equal(placeQuery(topic, "ru", { ...text, description: "x".repeat(190) }), null);
  // Без запроса у темы чинить нечего.
  assert.equal(placeQuery({ ...topic, query: undefined }, "ru", text), null);
});

test("три попытки, починка после них и второй круг Google Trends", () => {
  const run = readFileSync(new URL("../lib/marketing/articles-run.ts", import.meta.url), "utf8");
  assert.match(run, /for \(let attempt = 0; attempt < 3; attempt \+= 1\)/);
  assert.match(run, /const placed = placeQuery\(topic, locale, lastText\);\s*if \(placed && !checkArticle\(topic, locale, placed\)\.length\) return placed;/);
  const keywords = readFileSync(new URL("../lib/seo/keywords.ts", import.meta.url), "utf8");
  assert.match(keywords, /for \(let round = 0; round < 2; round \+= 1\)/);
  assert.match(keywords, /if \(!\/429\/\.test\(last\.reason\)\) return last;/);
});

test("обход не бьёт по чужому сайту залпом: картинки и ссылки — по два", async () => {
  const { inBatches } = await import("@/lib/audit/fetch");
  let now = 0;
  let peak = 0;
  const seen = await inBatches([1, 2, 3, 4, 5], async (n) => {
    now += 1;
    peak = Math.max(peak, now);
    await new Promise((done) => setTimeout(done, 5));
    now -= 1;
    return n * 10;
  });
  assert.deepEqual(seen, [10, 20, 30, 40, 50], "порядок ответов сохраняется");
  assert.equal(peak, 2);
  const fetchSrc = readFileSync(new URL("../lib/audit/fetch.ts", import.meta.url), "utf8");
  assert.match(fetchSrc, /inBatches\(images, \(url\) => status\(url, ip\)\)/);
  assert.match(fetchSrc, /inBatches\(links, \(url\) => status\(url, ip\)\)/);
});
