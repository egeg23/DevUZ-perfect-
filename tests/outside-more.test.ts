import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { OUTSIDE_TOPICS } from "@/content/outside-topics";
import { attentionOf, OUTSIDE_STALE_DAYS, type AttentionInput } from "@/lib/admin/hq";
import {
  AUTO_DAYS,
  allTopics,
  allowedLinks,
  articleQuery,
  autoSlotOf,
  linkProblems,
  pickTopics,
  siteTopics,
  telegramPostHtml,
  vkWallParams,
} from "@/lib/outside/posts";
import { channelName, channelPostUrl, channelVerdict } from "@/lib/outside/tgchannel";
import { VK_API, groupOf, hasWall, vkReason, vkRequest, wallUrl } from "@/lib/outside/vk";
import { siteUrl } from "@/lib/seo";

const read = (p: string) => readFileSync(p, "utf8");

const ART = { slug: "prodvizhenie-stomatologii-telegram", title: "Продвижение стоматологии в Telegram", description: "Как привести пациентов.", tips: ["Отвечайте в течение дня."], query: "продвижение стоматологии в Telegram", at: "2026-11-19T11:05:00Z" };
const RZ = { slug: "sayt-dlya-vuza-tashkent", title: "Сайт для вуза в Ташкенте", description: "Разбор сайта вуза.", query: "сайт для вуза в Ташкенте", at: "2026-11-20T03:00:00Z" };

test("темы без конца: статьи сайта после статичных, новые раньше, ключ стабильный, ссылка на статью разрешена", () => {
  const site = siteTopics([ART], [RZ]);
  assert.deepEqual(site.map((t) => t.key), ["rz:sayt-dlya-vuza-tashkent", "art:prodvizhenie-stomatologii-telegram"], "новые раньше");
  assert.equal(site[1].link?.url, `${siteUrl}/ru/marketing/articles/${ART.slug}`);
  assert.equal(site[0].link?.url, `${siteUrl}/ru/razbor/${RZ.slug}`);
  assert.equal(site[0].query, RZ.query);
  assert.deepEqual(site[0].cases, [], "чисел, кроме proof, нет: кейсов у темы статьи нет");
  const all = allTopics(site);
  assert.deepEqual(all.slice(0, OUTSIDE_TOPICS.length).map((t) => t.key), OUTSIDE_TOPICS.map((t) => t.key), "статичные первыми");
  assert.equal(all.length, OUTSIDE_TOPICS.length + 2);
  // Все статичные уже написаны — следующей идёт статья сайта.
  const written = OUTSIDE_TOPICS.map((t) => ({ platform: "telegraph" as const, topic_key: t.key }));
  assert.equal(pickTopics(written, [], all, ["telegraph"]).telegraph?.key, "rz:sayt-dlya-vuza-tashkent");
  // Ссылка на статью — разрешена, текст ссылки — с «DevUz».
  assert.ok(allowedLinks(site[0]).some((l) => l.url === `${siteUrl}/ru/razbor/${RZ.slug}`));
  assert.deepEqual(linkProblems(site[0], "telegram", `Смотрите [разбор DevUz Studio](${siteUrl}/ru/razbor/${RZ.slug}).`), []);
  assert.ok(linkProblems(site[0], "telegram", `Смотрите [сайт для вуза](${siteUrl}/ru/razbor/${RZ.slug}).`).length);
  // Плохой адрес статьи в тему не идёт.
  assert.equal(siteTopics([{ ...ART, slug: "../x" }], []).length, 0);
});

test("запрос статьи о маркетинге — из research, иначе заголовок", () => {
  assert.equal(articleQuery({ ru: { query: "продвижение медцентра" } }, "Заголовок"), "продвижение медцентра");
  assert.equal(articleQuery(null, "Заголовок статьи"), "Заголовок статьи");
});

test("слоты: «сами» — понедельник, среда, пятница по Ташкенту; ручные — раз в неделю", () => {
  assert.deepEqual([...AUTO_DAYS], [1, 3, 5]);
  assert.equal(autoSlotOf(new Date("2026-11-23T07:00:00Z")), "2026-11-23", "понедельник");
  assert.equal(autoSlotOf(new Date("2026-11-24T07:00:00Z")), null, "вторник");
  assert.equal(autoSlotOf(new Date("2026-11-25T07:00:00Z")), "2026-11-25", "среда");
  assert.equal(autoSlotOf(new Date("2026-11-27T20:00:00Z")), null, "пятница 20:00 UTC — уже суббота в Ташкенте");
  const run = read("lib/outside/run.ts");
  assert.match(run, /OUTSIDE_AUTO_SHIFT = "outside-auto"/);
  assert.match(run, /isAuto\(p\) \? autoOn : hand/);
  // Одна тема в один проход разным площадкам — разная.
  const topics = pickTopics([], [], OUTSIDE_TOPICS, ["telegraph", "telegram", "vk"]);
  assert.equal(new Set(Object.values(topics).map((t) => t?.key)).size, 3);
});

test("Telegram: пост ботом в канал — HTML Bot API, адрес поста, проверка администратора", () => {
  const body = `Абзац <b>.\n\n• пункт\n\nСмотрите [кейс DevUz](${siteUrl}/ru/cases).`;
  const html = telegramPostHtml("Сайт <для> клиники", body, "telegram", "art:x");
  assert.match(html, /^<b>Сайт &lt;для&gt; клиники<\/b>\n\nАбзац &lt;b&gt;\.\n\n• пункт/);
  assert.match(html, /<a href="[^"]+utm_source=telegram[^"]*utm_campaign=art%3Ax">кейс DevUz<\/a>/);
  assert.doesNotMatch(html, /<p>|<h2>|<ul>/, "Bot API этих тегов не берёт");
  assert.equal(channelName("https://t.me/devuz_studio"), "devuz_studio");
  assert.equal(channelName("@devuz_studio"), "devuz_studio");
  assert.equal(channelName("devuz studio"), null);
  assert.equal(channelPostUrl("devuz_studio", 12), "https://t.me/devuz_studio/12");
  assert.equal(channelVerdict("x", { type: "channel", username: "devuz_studio", title: "DevUz" }, { status: "administrator", can_post_messages: true }).ok, true);
  assert.equal(channelVerdict("x", { type: "channel", username: "devuz_studio" }, { status: "administrator", can_post_messages: false }).ok, false);
  assert.equal(channelVerdict("x", { type: "supergroup", username: "g" }, { status: "administrator" }).ok, false);
  assert.equal(channelVerdict("x", { type: "channel", username: "c" }, { status: "member" }).ok, false);
  assert.equal(channelVerdict("x", null, null).ok, false);
  // В пуш и колокольчик пост канала не зеркалится.
  const tg = read("lib/qualify/telegram.ts");
  const fn = tg.slice(tg.indexOf("export async function postToChannel"), tg.indexOf("/** Имя, описание и короткое описание бота"));
  assert.doesNotMatch(fn, /mirrorToPush/);
});

test("ВКонтакте: ключ в теле POST, не в адресе; wall.post от сообщества; адрес поста; право «Стена»", () => {
  const { url, init } = vkRequest("wall.post", { owner_id: "-5" }, "SECRET-TOKEN");
  assert.equal(url, `${VK_API}/wall.post`);
  assert.doesNotMatch(url, /SECRET/);
  const body = new URLSearchParams(String(init.body));
  assert.equal(body.get("access_token"), "SECRET-TOKEN");
  assert.equal(body.get("v"), "5.199");
  assert.equal(init.method, "POST");
  const params = vkWallParams(42, "Заголовок", `Текст [DevUz](${siteUrl}/ru).`, "vk", "art:x");
  assert.equal(params.owner_id, "-42");
  assert.equal(params.from_group, "1");
  assert.match(params.message, /^Заголовок\n\nТекст DevUz \(https:/);
  assert.match(params.attachments, /utm_source=vk/);
  assert.equal(wallUrl(42, 7), "https://vk.com/wall-42_7");
  assert.deepEqual(groupOf({ groups: [{ id: 42, screen_name: "devuz", name: "DevUz" }] }), { id: 42, screen: "devuz", name: "DevUz" });
  assert.equal(groupOf([{ id: 42 }])?.id, 42);
  assert.equal(groupOf({ groups: [] }), null);
  assert.equal(hasWall({ permissions: [{ name: "wall", setting: 8192 }] }), true);
  assert.equal(hasWall({ mask: 4096, permissions: [{ name: "messages" }] }), false);
  assert.equal(hasWall(null), null);
  assert.match(vkReason(5, "User authorization failed"), /не принял ключ/);
  assert.doesNotMatch(read("lib/outside/vk.ts"), /console\./, "ключ не печатается");
});

test("«Публикуется само»: канал и ключ пишутся только после проверки, журнал без значений", () => {
  const store = read("lib/outside/auto-store.ts");
  const tg = store.slice(store.indexOf("export async function saveTgChannel"), store.indexOf("export async function saveVkKey"));
  assert.ok(tg.indexOf("checkChannel(") < tg.indexOf("saveAppSecret("), "канал — после проверки");
  const vk = store.slice(store.indexOf("export async function saveVkKey"));
  assert.ok(vk.indexOf("checkVk(") < vk.indexOf("saveAppSecret("), "ключ — после проверки");
  assert.match(vk, /if \(!mayChoosePublisher\(staff\)\) return "forbidden";/);
  assert.doesNotMatch(vk.slice(vk.indexOf("record(")), /meta: \{[^}]*typed[^}]*:/, "ключ в журнал не уходит");
  assert.match(read("lib/outside/run.ts"), /routeOf\("telegram", Boolean\(tgDirect\), channels\)/, "Postiz — запасной путь");
});

test("«Требует внимания»: ручной черновик ждёт больше 7 дней — строка владельцу и руководителю", () => {
  const now = new Date("2026-11-22T10:00:00Z");
  const base: AttentionInput = {
    role: "admin",
    now,
    sweep: null,
    autopilotTrouble: null,
    bans: [],
    circlesMissing: { ru: [], uz: [] },
    circleFallback: [],
    leads: { unowned: [] } as unknown as AttentionInput["leads"],
    burned: [],
    overdue: [],
    stale: [],
    transfers: [],
    contracts: [],
    ending: [],
    firecrawlRemaining: null,
    outsideWaiting: [
      { id: "a", label: "vc.ru: старый", at: "2026-11-09T10:00:00Z" },
      { id: "b", label: "Дзен: свежий", at: "2026-11-20T10:00:00Z" },
    ],
  };
  const row = attentionOf(base).find((a) => a.kind === "outside");
  assert.ok(row && row.kind === "outside");
  assert.equal(row.n, 1);
  assert.equal(row.days, 13);
  assert.equal(row.links[0].href, "/admin/outside");
  assert.equal(OUTSIDE_STALE_DAYS, 7);
  assert.ok(!attentionOf({ ...base, role: "manager" }).some((a) => a.kind === "outside"), "менеджеру — нет");
});

test("vc.ru: черновик — блоками их редактора, вход ключами в заголовке, пароль только в хранилище", async () => {
  const { vcruBlocks, vcruEntry, vcruRequest, vcruAnswer, parseLogin, entryUrl, VCRU_AUTH } = await import("@/lib/outside/vcru");
  const body = `Абзац <b> и **жирный**.\n\n## Подзаголовок\n\n• один\n• два\n\nСмотрите [работы DevUz](${siteUrl}/ru/cases).`;
  const blocks = vcruBlocks(body, "vcru", "art:x");
  assert.deepEqual(blocks.map((b) => b.type), ["text", "header", "list", "text"]);
  assert.equal(blocks[0].data.text, "<p>Абзац &lt;b&gt; и <b>жирный</b>.</p>");
  assert.equal(blocks[1].data.style, "h2");
  assert.deepEqual(blocks[2].data.items, ["один", "два"]);
  assert.match(blocks[3].data.text ?? "", /<a href="[^"]+utm_source=vc\.ru[^"]*" target="_blank">работы DevUz<\/a>/);
  const entry = vcruEntry(7, "Заголовок", body, "vcru", "art:x");
  assert.equal(entry.subsite_id, 7);
  assert.equal(entry.is_published, false, "сначала черновик, публикация отдельным запросом");
  const { url, init } = vcruRequest("editor", { entry: JSON.stringify(entry) }, "ACCESS");
  assert.equal(url, "https://api.vc.ru/v2.1/editor");
  assert.equal((init.headers as Record<string, string>).JWTAuthorization, "Bearer ACCESS");
  assert.ok(init.body instanceof FormData);
  assert.equal(vcruRequest(`${VCRU_AUTH}/email/login`, {}).url, "https://api.vc.ru/v3.4/auth/email/login");
  assert.ok("error" in vcruAnswer(200, { message: "Invalid login or password", code: 104, data: null }));
  assert.deepEqual(vcruAnswer(200, { message: "", data: { id: 5 } }), { data: { id: 5 } });
  assert.equal(parseLogin('{"email":"a@b.ru","password":"p"}')?.email, "a@b.ru");
  assert.equal(parseLogin("мусор"), null);
  assert.equal(entryUrl({}, 123), "https://vc.ru/123");
  const src = read("lib/outside/vcru.ts");
  assert.doesNotMatch(src, /console\./, "ключи и пароль не печатаются");
  const store = read("lib/outside/auto-store.ts");
  const save = store.slice(store.indexOf("export async function saveVcruLogin"));
  assert.ok(save.indexOf("vcruSignIn(") < save.indexOf("saveAppSecret(VCRU_LOGIN_KEY"), "пароль — только после входа");
  assert.match(save, /if \(!mayChoosePublisher\(staff\)\) return "forbidden";/);
  assert.match(read("lib/outside/run.ts"), /platform === "vcru" && vcruOn/);
});
