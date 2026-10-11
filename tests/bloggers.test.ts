/**
 * ИИ-сотрудник «Блогеры» (docs/ai-staff/bloggers.md): разбор выдачи,
 * контакты, оценка, первое сообщение и доступ.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { profileFrom } from "@/lib/bloggers/discovery";
import { judgementFrom } from "@/lib/bloggers/judge";
import {
  DEFAULT_SETTINGS,
  candidatesFrom,
  channelFor,
  contactsFromBio,
  directUrl,
  handleFromUrl,
  nextQuery,
  normalizeHandle,
  parseCount,
  pitchText,
  profileStats,
  programTerms,
  scoreBlogger,
  settingsFrom,
  snippetMetrics,
} from "@/lib/bloggers/rules";
import { searchBudget } from "@/lib/bloggers/run";
import { MIN_PAYOUT_USD, PARTNER_TIERS } from "@/lib/partners/rules";
import { canSee } from "@/lib/admin/roles";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const NOW = Date.parse("2026-10-11T09:00:00Z");
const DAY = 86_400_000;

test("ник: из @, ссылки и адреса профиля; пост и служебные страницы — не профиль", () => {
  assert.equal(normalizeHandle("@Tashkent.Mama"), "tashkent.mama");
  assert.equal(normalizeHandle("https://www.instagram.com/biz_uz/?igsh=abc"), "biz_uz");
  assert.equal(normalizeHandle("explore"), null);
  assert.equal(normalizeHandle("не ник"), null);
  assert.equal(handleFromUrl("https://www.instagram.com/biz_uz/"), "biz_uz");
  assert.equal(handleFromUrl("https://www.instagram.com/p/Cx123/"), null);
  assert.equal(handleFromUrl("https://www.instagram.com/reel/abc/"), null);
});

test("цифры из выдачи поиска: английская и русская подпись Instagram", () => {
  assert.equal(parseCount("12.3K"), 12_300);
  assert.equal(parseCount("1,234"), 1_234);
  assert.equal(parseCount("1.2M"), 1_200_000);
  assert.equal(parseCount("15 тыс."), 15_000);
  const en = snippetMetrics("12K Followers, 345 Following, 1,234 Posts - See Instagram photos and videos from Dilnoza (@dilnoza.biz)");
  assert.deepEqual(en, { followers: 12_000, following: 345, posts: 1_234, name: "Dilnoza" });
  const ru = snippetMetrics("Подписчики: 48 тыс., подписки: 512, публикации: 900 — посмотрите в Instagram фото и видео Азиз (@aziz)");
  assert.equal(ru.followers, 48_000);
  assert.equal(ru.following, 512);
  assert.equal(ru.posts, 900);
});

test("кандидаты: профиль с цифрами, из подборки — только ссылки на instagram.com", () => {
  const list = candidatesFrom([
    { url: "https://www.instagram.com/dilnoza.biz/", title: "Dilnoza (@dilnoza.biz)", description: "12K Followers, 345 Following, 1,234 Posts" },
    { url: "https://kun.uz/top-bloggers", title: "Топ блогеров", description: "instagram.com/aziz_tech и @telegram_only" },
    { url: "https://www.instagram.com/p/xyz/", title: "пост", description: "" },
  ]);
  assert.deepEqual(
    list.map((c) => c.handle),
    ["dilnoza.biz", "aziz_tech"],
  );
  assert.equal(list[0].metrics?.followers, 12_000);
  assert.equal(list[1].metrics, null);
});

test("контакты из шапки: t.me и «тг @», почта; голый @ — не Telegram", () => {
  assert.deepEqual(contactsFromBio("Сотрудничество: t.me/Dilnoza_Biz · mail@dilnoza.uz"), { telegram: "dilnoza_biz", email: "mail@dilnoza.uz" });
  assert.equal(contactsFromBio("тг: @aziz_tech").telegram, "aziz_tech");
  assert.equal(contactsFromBio("второй аккаунт @aziz_shop").telegram, null);
  assert.equal(contactsFromBio("t.me/joinchat").telegram, null);
  assert.equal(channelFor({ telegram: "x", email: "y@z.uz" }), "telegram");
  assert.equal(channelFor({ telegram: null, email: "y@z.uz" }), "email");
  assert.equal(channelFor({ telegram: null, email: null }), "direct");
  assert.equal(directUrl("dilnoza.biz"), "https://ig.me/m/dilnoza.biz");
});

test("средние по постам: скрытые лайки не считаются нулём, частота — до сегодня", () => {
  const posts = [
    { likes: 500, comments: 20, at: NOW - 1 * DAY },
    { likes: null, comments: 10, at: NOW - 7 * DAY },
    { likes: 300, comments: 30, at: NOW - 14 * DAY },
  ];
  const s = profileStats(10_000, posts, NOW);
  assert.equal(s.avgLikes, 400);
  assert.equal(s.avgComments, 20);
  assert.equal(s.engagement, 4.2);
  assert.equal(s.postsPerWeek, 1.5);
  assert.equal(s.lastPostAt, NOW - DAY);
});

test("Business Discovery → профиль", () => {
  const p = profileFrom(
    "dilnoza.biz",
    {
      name: "Dilnoza",
      biography: "Бизнес в Ташкенте · t.me/dilnoza_biz",
      followers_count: 20_000,
      follows_count: 300,
      media_count: 400,
      media: { data: [{ caption: "Про продажи", like_count: 800, comments_count: 40, timestamp: new Date(NOW - DAY).toISOString() }] },
    },
    NOW,
  );
  assert.equal(p.followers, 20_000);
  assert.equal(p.engagement, 4.2);
  assert.deepEqual(p.captions, ["Про продажи"]);
});

test("ответ модели приводится к полям, мусор не проходит", () => {
  const j = judgementFrom({ topics: ["бизнес", "SMM"], lang: "ru", city: "Ташкент", uzbekistan: "yes", fit: 14, why: "Пишет для предпринимателей" });
  assert.equal(j.fit, 10);
  assert.equal(j.uzbekistan, true);
  assert.equal(judgementFrom({ lang: "fr", uzbekistan: "maybe" }).lang, "other");
  assert.equal(judgementFrom({}).uzbekistan, null);
});

test("оценка: живой микроблогер из Ташкента проходит, накрутка и чужая страна — нет", () => {
  const base = { followers: 25_000, following: 400, engagement: 4.5, postsPerWeek: 3, lastPostAt: NOW - DAY, uzbekistan: true, lang: "ru", fit: 8 };
  const good = scoreBlogger(base, DEFAULT_SETTINGS, NOW);
  assert.equal(good.score, 20 + 25 + 15 + 15 + 16);
  assert.equal(good.pass, true);

  const fake = scoreBlogger({ ...base, engagement: 40 }, DEFAULT_SETTINGS, NOW);
  assert.ok(fake.score < good.score);
  assert.match(fake.notes.join(" "), /накрутк/);

  const abroad = scoreBlogger({ ...base, uzbekistan: false }, DEFAULT_SETTINGS, NOW);
  assert.equal(abroad.pass, false, "аудитория не из Узбекистана студии клиентов не приведёт");

  const tiny = scoreBlogger({ ...base, followers: 900 }, DEFAULT_SETTINGS, NOW);
  assert.equal(tiny.pass, false);

  const dead = scoreBlogger({ ...base, lastPostAt: NOW - 90 * DAY }, DEFAULT_SETTINGS, NOW);
  assert.ok(dead.score <= good.score - 15);

  const follow4follow = scoreBlogger({ ...base, following: 60_000 }, DEFAULT_SETTINGS, NOW);
  assert.equal(follow4follow.score, good.score - 10);

  // Нет данных — середина шкалы, а не провал: поиск не знает лайков.
  const unknown = scoreBlogger(
    { followers: 20_000, following: null, engagement: null, postsPerWeek: null, lastPostAt: null, uzbekistan: null, lang: "uz", fit: null },
    DEFAULT_SETTINGS,
    NOW,
  );
  assert.equal(unknown.score, 20 + 12 + 7 + 8 + 8);
});

test("условия в первом сообщении — из правил партнёрской программы", () => {
  const t = programTerms();
  assert.equal(t.profitFrom, Math.min(...PARTNER_TIERS.map((x) => x.profit)));
  assert.equal(t.profitTo, Math.max(...PARTNER_TIERS.map((x) => x.profit)));
  assert.equal(t.turnoverFrom, Math.min(...PARTNER_TIERS.map((x) => x.turnover)));
  assert.equal(t.turnoverTo, Math.max(...PARTNER_TIERS.map((x) => x.turnover)));
  for (const lang of ["ru", "uz"] as const) {
    const text = pitchText({ name: "Dilnoza Karimova", handle: "dilnoza.biz" }, lang, "https://devuz.studio");
    const allowed = new Set([t.profitFrom, t.profitTo, t.turnoverFrom, t.turnoverTo, MIN_PAYOUT_USD].map(String));
    for (const n of text.match(/\d+/g) ?? []) assert.ok(allowed.has(n), `${lang}: число ${n} не из правил программы`);
    assert.match(text, /Dilnoza/);
    assert.match(text, new RegExp(`devuz\\.studio/${lang}/partners`));
    assert.doesNotMatch(text, /[—–]| - /, `${lang}: длинное тире в тексте живому человеку`);
  }
  assert.doesNotMatch(pitchText({ name: "", handle: "x" }, "uz", "https://devuz.studio"), /[а-яё]/i, "узбекский текст — латиницей");
});

test("настройки: пределы держит код, а не форма", () => {
  const s = settingsFrom({ tgDaily: 500, directDaily: -3, firecrawlDaily: "abc", minFollowers: 50_000, maxFollowers: 10, queries: ["  ", "a"] });
  assert.equal(s.tgDaily, 10, "Telegram больше десяти в день не пустим даже руками");
  assert.equal(s.directDaily, 0);
  assert.equal(s.firecrawlDaily, DEFAULT_SETTINGS.firecrawlDaily);
  assert.ok(s.maxFollowers >= s.minFollowers);
  assert.deepEqual(s.queries, ["a"]);
  assert.equal(settingsFrom(null).enabled, false, "по умолчанию агент выключен");
  assert.ok(DEFAULT_SETTINGS.tgDaily <= 3, "квота Telegram блогерам по умолчанию низкая");
});

test("запросы по кругу и бюджет Firecrawl: своя доля, но не больше общего остатка", () => {
  assert.equal(nextQuery(["a", "b", "c"], new Map([["a", 5], ["b", 1]])), "c");
  assert.equal(nextQuery(["a", "b"], new Map([["a", 5], ["b", 1]])), "b");
  assert.equal(searchBudget({ own: 2, usedByBloggers: 0, allowance: 30, usedAll: 10 }), 2);
  assert.equal(searchBudget({ own: 2, usedByBloggers: 2, allowance: 30, usedAll: 10 }), 0);
  assert.equal(searchBudget({ own: 5, usedByBloggers: 0, allowance: 30, usedAll: 29 }), 1, "общий лимит дня важнее доли блогеров");
});

test("доступ: раздел — владельцу и руководителю, клиенты сервиса — только владельцу", () => {
  assert.equal(canSee("head", "/admin/ai-staff"), true);
  assert.equal(canSee("manager", "/admin/ai-staff"), false);
  assert.match(read("app/admin/ai-staff/page.tsx"), /if \(staff\.role !== "admin"\) redirect\("\/admin\/ai-staff\/bloggers"\)/);
  const actions = read("app/admin/ai-staff/bloggers/actions.ts");
  for (const m of actions.matchAll(/export async function (\w+)\([^)]*\)[^{]*\{\n([^\n]*)/g)) {
    assert.match(m[2], /await requireRole\("admin", "head"\)/, `${m[1]}: первой строкой — проверка роли`);
  }
  assert.match(read("app/admin/ai-staff/bloggers/page.tsx"), /const staff = await requireSection\("\/admin\/ai-staff"\)/);
});

test("агент блогеров — недорогой моделью", () => {
  assert.match(read("lib/bloggers/judge.ts"), /BLOGGER_MODEL \|\| "claude-haiku/);
});
