import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { HOME_SEO, LANDINGS } from "@/content/clients/maximova/pages";
import sitemap from "@/app/maximova/sitemap";
import { landingGraph } from "@/lib/clients/maximova/schema";
import { INDEXING, pageMetadata } from "@/lib/clients/maximova/seo";

/** SEO сайта Дарьи: правила из seo-razbor и закона о рекламе, которые проверяются статикой. */

const pages = [{ title: HOME_SEO.title, description: HOME_SEO.description, slug: "" }, ...LANDINGS];

test("title до 60 знаков, description 120–170, у каждой страницы свои", () => {
  for (const p of pages) {
    assert.ok(p.title.length <= 60, `title длиннее 60: ${p.title} (${p.title.length})`);
    assert.ok(p.description.length >= 120 && p.description.length <= 170, `description ${p.description.length}: ${p.slug}`);
  }
  assert.equal(new Set(pages.map((p) => p.title)).size, pages.length);
  assert.equal(new Set(pages.map((p) => p.description)).size, pages.length);
});

test("у каждой посадочной свой главный запрос, и он — в title, H1 и первом абзаце", () => {
  const queries = LANDINGS.map((l) => l.query);
  assert.equal(new Set(queries).size, queries.length, "две страницы под один запрос спорят за выдачу");
  const stem = (s: string) => s.toLowerCase().replace(/ё/g, "е").split(/\s+/).filter((w) => w.length > 3 && w !== "москва").map((w) => w.slice(0, 5));
  for (const l of LANDINGS) {
    const text = (s: string) => s.toLowerCase().replace(/ё/g, "е");
    for (const w of stem(l.query)) {
      assert.ok(text(l.title).includes(w), `${l.slug}: «${w}» нет в title`);
      assert.ok(text(l.h1 + " " + l.lead).includes(w), `${l.slug}: «${w}» нет в H1 и первом абзаце`);
    }
  }
});

test("гео Москвы — в каждой странице", () => {
  for (const l of LANDINGS) assert.match(`${l.title} ${l.description} ${l.kicker}`, /Москв|Китай-город/, l.slug);
});

test("никаких гарантий и превосходных степеней (закон о рекламе)", () => {
  const all = JSON.stringify(LANDINGS) + JSON.stringify(HOME_SEO);
  assert.doesNotMatch(all, /гарант|лучш(ий|ая|ее|ие|ую|его)|№\s?1|самый/i);
});

test("карта сайта — главная, все программы и политика; без кабинета и архива", () => {
  const urls = sitemap().map((e) => e.url);
  assert.equal(urls.length, LANDINGS.length + 2);
  assert.ok(urls.every((u) => u.startsWith("https://")));
  assert.ok(!urls.some((u) => /kabinet|variants|\/[abc]$/.test(u)));
});

test("разметка курса — цена её, адрес без выдуманной улицы", () => {
  const graph = JSON.stringify(landingGraph(LANDINGS[0]));
  assert.match(graph, /"price":"2900"/);
  assert.doesNotMatch(graph, /streetAddress|aggregateRating|review/);
});

test("индексация и заголовок X-Robots-Tag согласованы", () => {
  const config = readFileSync("next.config.ts", "utf8");
  const header = /source: "\/maximova\/:path\*", headers: \[\{ key: "X-Robots-Tag"/.test(config);
  assert.equal(header, !INDEXING, INDEXING ? "INDEXING включён — уберите X-Robots-Tag для /maximova в next.config.ts" : "сайт закрыт — X-Robots-Tag должен стоять");
  const meta = pageMetadata({ path: "", title: "t", description: "d" });
  assert.deepEqual((meta.robots as { index: boolean }).index, INDEXING);
});
