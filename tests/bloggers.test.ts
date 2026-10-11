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
    // Рабочие действия — всем, кому открыт раздел (и менеджеру по галочке);
    // настройки, поиск, оценка, Instagram и партнёр — по роли.
    const work = ["markSent", "skipBlogger", "restoreBlogger", "markReplied", "markDeclined", "holdAgent"].includes(m[1]);
    assert.match(m[2], work ? /await requireSection\(SECTION\)/ : /await requireRole\("admin", "head"\)/, `${m[1]}: первой строкой — проверка доступа`);
  }
  assert.match(read("app/admin/ai-staff/bloggers/page.tsx"), /const staff = await requireSection\("\/admin\/ai-staff"\)/);
});

test("агент блогеров — недорогой моделью", () => {
  assert.match(read("lib/bloggers/judge.ts"), /BLOGGER_MODEL \|\| "claude-haiku/);
});

test("Telegram: «Здравствуйте» блогеру — в окне, по квоте, в общем пределе и после паузы аккаунта", async () => {
  const { helloAllowed } = await import("@/lib/bloggers/tg-queue");
  const noon = Date.parse("2026-10-11T07:00:00Z"); // 12:00 по Ташкенту
  const ok = { now: noon, enabled: true, tgDaily: 3, sentToday: 0, accountHour: 0, cap: 3, lastAt: null };
  assert.equal(helloAllowed(ok), true);
  assert.equal(helloAllowed({ ...ok, enabled: false }), false, "агент выключен — никому не пишем");
  assert.equal(helloAllowed({ ...ok, now: Date.parse("2026-10-11T18:00:00Z") }), false, "ночью первым не пишем");
  assert.equal(helloAllowed({ ...ok, sentToday: 3 }), false, "своя квота блогеров кончилась");
  assert.equal(helloAllowed({ ...ok, accountHour: 3 }), false, "предел в час общий с компаниями");
  assert.equal(helloAllowed({ ...ok, lastAt: noon - 60_000 }), false, "пауза после прошлой отправки аккаунта");
  assert.equal(helloAllowed({ ...ok, lastAt: noon - 30 * 60_000 }), true);
});

test("Telegram: блогерам первым — только приветствие, текст о программе — после ответа", () => {
  const runner = read("scout/runner.mjs");
  const hello = runner.slice(runner.indexOf("const bloggerHello = async"), runner.indexOf("timers.push(setInterval(async () => {\n    if (outreachStopped) return;"));
  assert.match(hello, /client\.sendMessage\(verdict\.userId, \{ message: job\.hello \}\)/);
  assert.doesNotMatch(hello, /pitch/, "до ответа блогеру уходит только «Здравствуйте»");
  // Блогеров скаут спрашивает, только когда очередь компаний пуста.
  assert.match(runner, /if \(!job\) \{\n\s*await bloggerHello\(\);/);
  // Предел в час и пауза — общие на аккаунт: очередь компаний видит отправки блогерам.
  assert.match(read("lib/admin/outreach-queue.ts"), /sentLastHour\(now, account\)\)\.count \+ bloggerHour\.count >= cap/);
});

test("Telegram: ответ блогера — команде, без лишних HTML", async () => {
  const { replyNotice } = await import("@/lib/bloggers/tg-queue");
  const text = replyNotice({ handle: "dilnoza.biz", score: 72 }, "Да, <b>интересно</b>", true);
  assert.match(text, /@dilnoza\.biz/);
  assert.match(text, /&lt;b&gt;интересно/);
  assert.match(text, /оценка 72/);
});

test("скриншоты: балл аудитории считает код, нечитаемое — без балла", async () => {
  const { audienceFrom, audienceScore, imageType, uzbekShare } = await import("@/lib/bloggers/audience");
  const a = audienceFrom({
    readable: true,
    uzbekistan_share: 82,
    tashkent_share: 55,
    top_cities: [{ city: "Ташкент", share: 55 }],
    age_25_44_share: 61,
    female_share: 70,
    reach_30d: 12_000,
    followers: 20_000,
    notes: "за 30 дней",
  });
  assert.deepEqual(audienceScore(a, null).score, 40 + 30 + 30);
  assert.equal(audienceScore({ ...a, readable: false }, null).score, null);
  // Нет доли страны — считаем по узбекским городам.
  assert.equal(uzbekShare({ ...a, uzbekistanShare: null, topCities: [{ city: "Tashkent", share: 40 }, { city: "Samarkand", share: 10 }, { city: "Almaty", share: 20 }] }), 50);
  assert.equal(audienceFrom({ uzbekistan_share: 140, reach_30d: -5 }).uzbekistanShare, null, "мусор модели не проходит");
  assert.equal(imageType(new Uint8Array([0xff, 0xd8, 0, 0])), "image/jpeg");
  assert.equal(imageType(new Uint8Array([1, 2, 3])), null);
});

test("согласие: партнёр сам — только с проверенной аудиторией", async () => {
  const { onAgree, withDisclosure, AUTO_PARTNER_MIN } = await import("@/lib/bloggers/converse");
  assert.equal(onAgree({ audience_score: null, score: 70, partner_id: null }, 55), "ask_stats");
  assert.equal(onAgree({ audience_score: AUTO_PARTNER_MIN, score: 70, partner_id: null }, 55), "partner");
  assert.equal(onAgree({ audience_score: 40, score: 70, partner_id: null }, 55), "human");
  assert.equal(onAgree({ audience_score: 90, score: 30, partner_id: null }, 55), "human");
  assert.equal(onAgree({ audience_score: 90, score: 90, partner_id: "p" }, 55), "human", "второго партнёра не заводим");
  // ИИ говорит, что он ИИ (docs/ai-staff/legal.md) — даже если модель забыла.
  assert.match(withDisclosure("Да, расскажу.", "ru", false), /^Вам отвечает ИИ-помощник/);
  assert.equal(withDisclosure("Да, расскажу.", "ru", true), "Да, расскажу.");
  assert.equal(withDisclosure("Я ИИ-помощник студии.", "ru", false), "Я ИИ-помощник студии.");
});

test("агент: числа не из условий программы — повтор, второй промах — безопасная фраза и человек", async () => {
  const { agentTurn, programFacts, SAFE_REPLY } = await import("@/lib/bloggers/agent");
  const facts = programFacts("ru", "https://devuz.studio");
  for (const t of PARTNER_TIERS) assert.match(facts, new RegExp(`${t.profit}% от прибыли или ${t.turnover}% от суммы`));
  const say = (text: string, intent = "question") =>
    async () => ({ content: [{ type: "tool_use", id: "x", name: "answer", input: { text, intent } }] }) as never;
  const input = { lang: "ru" as const, name: "", history: [{ role: "blogger" as const, text: "Сколько платите?" }], disclosed: false, audience: null, siteUrl: "https://devuz.studio" };
  const good = await agentTurn(input, say("От 10 до 30% от прибыли проекта."));
  assert.equal(good.checked, true);
  let calls = 0;
  const bad = await agentTurn(input, async () => {
    calls++;
    return say("Платим 45% сразу.")();
  });
  assert.equal(calls, 2, "после промаха — один повтор с замечанием");
  assert.deepEqual(bad, { text: SAFE_REPLY.ru, intent: "human", checked: false });
});

test("Direct: картинки из вложений, событие студии — агенту блогеров даже при выключенном сервисе", async () => {
  const { parseEvents } = await import("@/lib/ai-staff/instagram");
  const [e] = parseEvents({
    object: "instagram",
    entry: [{ id: "studio", messaging: [{ sender: { id: "b1" }, message: { mid: "m", text: "", attachments: [{ type: "image", payload: { url: "https://cdn/x.jpg" } }] } }] }],
  });
  assert.deepEqual(e.images, ["https://cdn/x.jpg"]);
  const route = read("app/api/ai-staff/instagram/route.ts");
  assert.match(route, /if \(await isStudioEvent\(event\)\) await handleStudioEvent\(event\);\s*else if \(enabled\) await handleInstagramEvent\(event\);/);
  const { unanswered } = await import("@/lib/bloggers/tg-agent");
  assert.equal(
    unanswered([
      { role: "agent", text: "a", at: "" },
      { role: "blogger", text: "b", at: "" },
      { role: "blogger", text: "c", at: "" },
    ]),
    "b\nc",
  );
});

test("сервис: ИИ-менеджер по блогерам — бриф с пределами, текст только из слов клиента", async () => {
  const { briefFrom, tenantPitch, BLOGGERS_PER_MONTH, SEARCHES_PER_DAY } = await import("@/lib/ai-staff/bloggers");
  const brief = briefFrom({ brand: "Детская одежда, свой пошив.", audience: "мамы, Ташкент", offer: "бартер: комплект за обзор в сторис", minFollowers: 50, maxFollowers: 10 });
  assert.equal(brief.minFollowers, 100);
  assert.ok(brief.maxFollowers >= brief.minFollowers);
  const ru = tenantPitch({ company: "Kids Wear", brief, name: "Dilnoza K", lang: "ru" });
  assert.match(ru, /^Здравствуйте, Dilnoza! Пишем от Kids Wear: Детская одежда, свой пошив\./);
  assert.match(ru, /бартер: комплект за обзор в сторис/);
  assert.doesNotMatch(ru, /\d/, "чисел, которых клиент не писал, в тексте нет");
  assert.doesNotMatch(tenantPitch({ company: "X", brief, name: "", lang: "uz" }), /Здравствуйте/);
  assert.ok(SEARCHES_PER_DAY <= 1, "поиск — Firecrawl студии: не чаще раза в день на клиента");
  assert.ok(BLOGGERS_PER_MONTH <= 200);
});

test("сервис: роль в базе, кабинете и на странице сервиса", async () => {
  assert.match(read("supabase/migrations/0106_ai_staff_bloggers.sql"), /check \(role in \('sales', 'smm', 'analyst', 'bloggers'\)\)/);
  assert.match(read("components/cabinet/shell.tsx"), /\{ href: "\/cabinet\/bloggers", key: "navBloggers" \}/);
  assert.match(read("app/cabinet/bloggers/page.tsx"), /const cab = await cabinetPage\(\);/);
  const { landing } = await import("@/content/ai-staff/landing");
  assert.ok(landing.ru.roles.some((r) => r.title === "ИИ-менеджер по блогерам"));
  assert.equal(landing.ru.roles.length, landing.uz.roles.length);
  const { plainTextProblems } = await import("@/lib/proto/plain-text");
  for (const locale of ["ru", "uz"] as const) {
    for (const r of landing[locale].roles) assert.deepEqual(plainTextProblems({ text: `${r.title} ${r.text}` }), [], `${locale}: ${r.title}`);
  }
});
