import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import type { RazborItem } from "@/content/razbor/items";
import type { MarketingArticle } from "@/lib/marketing/articles-store";
import { FEED_PATH, articleItem, dzenImage, dzenRss, feedItems, razborItem, rfc822 } from "@/lib/outside/dzen-feed";

const article = (slug: string, date: string): MarketingArticle => ({
  slug,
  kind: "term" as MarketingArticle["kind"],
  topicKey: slug,
  sourceUrl: null,
  publishedAt: date,
  text: {
    title: `Заголовок ${slug} <b> & ]]>`,
    description: "Описание",
    paragraphs: ["Первый абзац статьи достаточно длинный, чтобы пройти порог Дзена. ".repeat(4), "Второй абзац."],
    tips: ["Совет один", "Совет два"],
  },
});

const razbor: RazborItem = {
  slug: "sajt-kliniki",
  locale: "ru",
  alts: [],
  niche: "medcentr",
  city: "Ташкент",
  publishedAt: "2026-11-20",
  shotTakenAt: "2026-11-19",
  title: "Разбор сайта клиники",
  description: "Что мешает записи",
  label: "клиника в Ташкенте",
  query: "сайт клиники",
  shots: {
    beforeDesktop: "https://x.supabase.co/storage/v1/object/public/razbor/a/before-desktop.png",
    beforeMobile: "",
    afterDesktop: "https://x.supabase.co/storage/v1/object/public/razbor/a/after-desktop.webp",
    afterMobile: "",
    findings: { no_phone: { src: "https://x.supabase.co/storage/v1/object/public/razbor/a/f.png", width: 1200, height: 600 } },
  },
  intro: ["Клиника хочет больше записей с сайта, а сайт этому мешает в нескольких местах сразу."],
  findings: [{ code: "no_phone", title: "Телефона нет на первом экране", impact: "Человек уходит.", fix: "Поставить номер наверх." }],
  outcome: ["Больше звонков."],
  price: "От 500 $",
  lostPer100: null,
} as RazborItem;

test("Дзен: статья — полный текст, советы списком, ссылка на сайт, обложка PNG", () => {
  const item = articleItem(article("seo-osnovy", "2026-11-21T10:00:00Z"));
  assert.equal(item.link, "https://devuz.studio/ru/marketing/articles/seo-osnovy");
  assert.match(item.html, /^<p>/);
  assert.match(item.html, /<h2>Что сделать<\/h2><ul><li>Совет один<\/li>/);
  assert.match(item.html, /<a href="https:\/\/devuz\.studio\/ru\/marketing\/articles\/seo-osnovy">DevUz<\/a>/);
  assert.match(item.cover, /og-ru\.png$/);
});

test("Дзен: разбор — снимки только PNG/JPEG/GIF, находки заголовками", () => {
  const item = razborItem(razbor);
  assert.match(item.html, /before-desktop\.png/);
  assert.doesNotMatch(item.html, /\.webp/, "webp Дзен не берёт");
  assert.match(item.html, /<h2>Телефона нет на первом экране<\/h2>/);
  assert.match(item.html, /f\.png/);
  assert.match(item.cover, /before-desktop\.png$/, "after в webp — обложка с before");
  assert.equal(dzenImage("/og-ru.png"), "https://devuz.studio/og-ru.png");
  assert.equal(dzenImage("https://a.b/c.webp"), null);
});

test("Дзен: лента — экранирование, CDATA, без native-draft, guid = адрес, свежие первыми", () => {
  const items = feedItems([article("a-old", "2026-10-01"), article("b-new", "2026-11-22")], [razbor]);
  assert.deepEqual(items.map((i) => i.link.split("/").pop()), ["b-new", "sajt-kliniki", "a-old"]);
  const xml = dzenRss(items);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /xmlns:content="http:\/\/purl\.org\/rss\/1\.0\/modules\/content\/"/);
  assert.match(xml, /<title>Заголовок b-new &lt;b&gt; &amp; \]\]&gt;<\/title>/);
  assert.doesNotMatch(xml, /native-draft/, "статьи выходят сразу, не черновиком");
  assert.match(xml, /<category>format-article<\/category>/);
  assert.match(xml, /<guid>https:\/\/devuz\.studio\/ru\/razbor\/sajt-kliniki<\/guid>/);
  assert.match(xml, /<enclosure url="[^"]+og-ru\.png" type="image\/png"\/>/);
  assert.doesNotMatch(xml, /utm_/, "Дзен просит адреса без меток");
  // «]]>» в тексте не рвёт CDATA
  const cd = xml.match(/<content:encoded><!\[CDATA\[([\s\S]*?)<\/content:encoded>/);
  assert.ok(cd);
});

test("Дзен: дата RFC 822 по Ташкенту, лимит ленты", () => {
  assert.equal(rfc822("2026-11-22T10:00:00Z"), "Sun, 22 Nov 2026 15:00:00 +0500");
  assert.equal(rfc822("2026-11-20"), "Fri, 20 Nov 2026 09:00:00 +0500");
  const many = Array.from({ length: 50 }, (_, i) => article(`s-${i}`, `2026-11-${String((i % 28) + 1).padStart(2, "0")}`));
  assert.equal(feedItems(many, []).length, 30);
});

test("Дзен: адрес ленты вне /api и не закрыт middleware, метатег — только с кодом", () => {
  assert.equal(FEED_PATH, "/dzen/rss.xml");
  const route = readFileSync("app/dzen/rss.xml/route.ts", "utf8");
  assert.match(route, /application\/rss\+xml/);
  const mw = readFileSync("middleware.ts", "utf8");
  assert.match(mw, /xml\|/, "xml мимо middleware");
  const layout = readFileSync("app/[locale]/layout.tsx", "utf8");
  assert.match(layout, /ZEN_VERIFICATION \? \{ other: \{ "zen-verification": ZEN_VERIFICATION \} \}/);
});
