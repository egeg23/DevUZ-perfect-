/**
 * Статьи на площадках — vc.ru, Дзен, Tenchat (lib/outside/).
 *
 * Владелец, 07.11.2026: «Хочу автоматизировать статьи на тех площадках, где
 * ты написал», на план — «Делаем по твоей рекомендации». Раз в неделю —
 * черновик на площадку, проверка кодом, публикует человек, ссылку
 * проверяет код.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

import { caseBySlug } from "@/content/cases";
import { OUTSIDE_TOPICS, type OutsideTopic } from "@/content/outside-topics";
import { opens, SECTIONS } from "@/lib/admin/roles";
import {
  OUTSIDE_REGION,
  PLATFORM,
  PLATFORMS,
  allowedLinks,
  checkDue,
  generationHour,
  linksIn,
  ourLinkOn,
  outsideProblems,
  pickTopics,
  publishedUrl,
  toHtml,
  toPlain,
  weekCardText,
  weekOf,
  withUtm,
  type Platform,
} from "@/lib/outside/posts";
import { draftPrompt } from "@/lib/outside/write";
import { siteUrl } from "@/lib/seo";

const read = (path: string) => readFileSync(path, "utf8");
const topic = OUTSIDE_TOPICS.find((t) => t.key === "auto-dealer-site")!;
const guide = OUTSIDE_TOPICS.find((t) => t.kind === "guide" && !t.cases.length)!;

/** Чистый черновик нужной длины: запрос в заголовке и первом абзаце, одна ссылка на кейс. */
function draft(t: OutsideTopic, platform: Platform, extra = ""): { title: string; body: string } {
  const spec = PLATFORM[platform];
  const link = t.cases.length ? `[кейс ${caseBySlug(t.cases[0])!.name}](${siteUrl}/ru/cases/${t.cases[0]})` : `[DevUz Studio](${siteUrl}/ru)`;
  const filler = "Покупатель сначала смотрит модели на телефоне, потом звонит, и сайт должен ответить на его вопросы заранее.";
  const parts = [`${t.query[0].toUpperCase()}${t.query.slice(1)}: с чего начать. ${filler}`];
  const heads = spec.headings[0];
  let i = 0;
  while (parts.join("\n\n").length < spec.min + 200) {
    if (heads && i % 3 === 0 && parts.filter((p) => p.startsWith("## ")).length < Math.max(heads, 2)) parts.push(`## Что важно, часть ${i + 1}`);
    parts.push(filler);
    i += 1;
  }
  parts.push(`Посмотреть, как это выглядит, можно в разделе ${link}.${extra}`);
  return { title: `${t.query[0].toUpperCase()}${t.query.slice(1)}: что нужно покупателю`, body: parts.join("\n\n") };
}

test("раздел «Статьи на площадках» — владельцу и руководителю, менеджеру галочкой; страница и действия проверяют доступ", () => {
  const section = SECTIONS.find((s) => s.href === "/admin/outside");
  assert.ok(section, "нет раздела");
  assert.equal(section.group, "marketing");
  assert.deepEqual([...section.roles], ["admin", "head"]);
  assert.ok(opens({ role: "admin" }, "/admin/outside"));
  assert.ok(opens({ role: "head" }, "/admin/outside"));
  assert.ok(!opens({ role: "manager" }, "/admin/outside"));
  assert.ok(opens({ role: "manager", section_access: { "/admin/outside": true } }, "/admin/outside"));
  assert.match(read("app/admin/outside/page.tsx"), /requireSection\("\/admin\/outside"\)/);
  const actions = read("app/admin/outside/actions.ts");
  assert.equal(actions.match(/requireSection\("\/admin\/outside"\)/g)?.length, 3);
  // «Кто публикует» — руководитель и владелец, проверяет сервер.
  assert.match(read("lib/outside/store.ts"), /if \(!mayChoosePublisher\(staff\)\) return "forbidden";/);
});

test("темы: ключи не повторяются, кейсы есть на сайте, запрос по России", () => {
  assert.ok(OUTSIDE_TOPICS.length >= 12);
  assert.equal(new Set(OUTSIDE_TOPICS.map((t) => t.key)).size, OUTSIDE_TOPICS.length);
  for (const t of OUTSIDE_TOPICS) {
    assert.ok(t.query.trim().length > 3, t.key);
    for (const slug of t.cases) assert.ok(caseBySlug(slug), `${t.key}: нет кейса ${slug}`);
    if (t.kind === "case") assert.ok(t.cases.length, `${t.key}: кейс без кейса`);
  }
  assert.deepEqual({ ...OUTSIDE_REGION }, { wordstat: 225, trends: "RU", label: "Россия" });
  assert.match(read("lib/outside/run.ts"), /keywordResearch\(topic\.query, OUTSIDE_REGION\)/);
  // Регион по умолчанию у статей сайта — прежний, Узбекистан.
  assert.match(read("lib/seo/keywords.ts"), /region: KeywordRegion = UZ_REGION/);
});

test("чистый черновик проходит на каждой площадке", () => {
  for (const platform of PLATFORMS) {
    assert.deepEqual(outsideProblems(topic, platform, draft(topic, platform)), [], platform);
    assert.deepEqual(outsideProblems(guide, platform, draft(guide, platform)), [], `${platform}: без кейса`);
  }
});

test("проверка ловит то, за что стыдно: тире, штампы, цены, проценты, чужие числа и ссылки", () => {
  const ok = draft(topic, "vcru");
  const bad = (body: string, title = ok.title) => outsideProblems(topic, "vcru", { title, body }).join(" ");
  assert.match(bad(ok.body.replace("с чего начать.", "с чего начать — коротко.")), /тире/);
  assert.match(bad(`${ok.body}\n\nЭто не просто сайт, а витрина.`), /Штампы/);
  assert.match(bad(`${ok.body}\n\nКонверсия выросла на 40%.`), /Проценты/);
  assert.match(bad(`${ok.body}\n\nЛендинг за 500 $.`), /Суммы/);
  assert.match(bad(`${ok.body}\n\nГарантируем заявки.`), /Обещаний/);
  assert.match(bad(`${ok.body}\n\nМы сделали 1234 проекта.`), /1234/);
  assert.match(bad(`${ok.body}\n\n[DevUz](https://evil.example/ru)`), /не из списка/);
  assert.match(bad(`${ok.body}\n\n[разработка сайтов](${siteUrl}/ru)`), /«DevUz» или название проекта/);
  assert.match(bad(`${ok.body}\n\nПишите: devuz.studio/ru`), /голым текстом/);
  assert.match(bad(ok.body.replace(/\[[^\]]+\]\([^)]+\)/, "наши работы")), /Нет ссылки/);
  assert.match(bad(ok.body, "Сайт, который продаёт машины без звонка менеджеру"), /нет в заголовке/);
  assert.match(bad(`${ok.body}\n\n- пункт с дефисом`), /«• »/);
  // Наши числа — можно: 65 разработчиков, 600 проектов, 53 страны.
  assert.deepEqual(outsideProblems(topic, "vcru", { ...ok, body: `${ok.body}\n\nУ нас 65 разработчиков и 600 проектов.` }), []);
  // У Tenchat — пост: без подзаголовков и с одной ссылкой.
  const post = draft(topic, "tenchat");
  assert.match(outsideProblems(topic, "tenchat", { ...post, body: `## Подзаголовок\n\n${post.body}` }).join(" "), /подзаголовков не бывает/);
  assert.match(outsideProblems(topic, "tenchat", { ...post, body: `${post.body} И [DevUz Studio](${siteUrl}/ru).` }).join(" "), /не больше 1/);
});

test("ссылки — только наш сайт, все работы и кейсы темы; метки Метрики ставятся при копировании", () => {
  assert.deepEqual(
    allowedLinks(topic).map((l) => l.url),
    [`${siteUrl}/ru`, `${siteUrl}/ru/cases`, `${siteUrl}/ru/cases/samauto`, `${siteUrl}/ru/cases/samist-auto`],
  );
  assert.equal(withUtm(`${siteUrl}/ru/cases/samauto`, "dzen", "auto-dealer-site"), `${siteUrl}/ru/cases/samauto?utm_source=dzen&utm_medium=article&utm_campaign=auto-dealer-site`);
  const body = `Первый абзац с **жирным** <b>и угловыми</b>.\n\n## Подзаголовок\n\n• один\n• два [кейс SamAuto](${siteUrl}/ru/cases/samauto)`;
  assert.deepEqual(linksIn(body), [{ anchor: "кейс SamAuto", url: `${siteUrl}/ru/cases/samauto` }]);
  const html = toHtml(body, "vcru", "auto-dealer-site");
  assert.match(html, /<p>Первый абзац с <strong>жирным<\/strong> &lt;b&gt;и угловыми&lt;\/b&gt;\.<\/p>/);
  assert.match(html, /<h2>Подзаголовок<\/h2>\n<ul><li>один<\/li><li>два <a href="[^"]+utm_source=vc\.ru&amp;utm_medium=article[^"]*">кейс SamAuto<\/a><\/li><\/ul>/);
  const plain = toPlain(body, "tenchat", "auto-dealer-site");
  assert.match(plain, /• два кейс SamAuto \(https:\/\/[^)]+utm_source=tenchat/);
  assert.doesNotMatch(plain, /\*\*|##/);
});

test("неделя: три площадки — три разные темы, тема на площадку один раз, неопубликованный черновик новую не получает", () => {
  const first = pickTopics([], []);
  const keys = PLATFORMS.map((p) => first[p]?.key);
  assert.equal(new Set(keys).size, 3);
  const written = PLATFORMS.map((p) => ({ platform: p, topic_key: first[p]!.key }));
  const second = pickTopics(written, ["dzen"]);
  assert.equal(second.dzen, undefined, "у Дзена неопубликованный черновик");
  for (const p of ["vcru", "tenchat"] as const) assert.ok(!written.some((w) => w.platform === p && w.topic_key === second[p]!.key), p);
  // Понедельник недели по Ташкенту и дневное окно.
  assert.equal(weekOf(new Date("2026-11-07T07:00:00Z")), "2026-11-02");
  assert.equal(weekOf(new Date("2026-11-08T19:30:00Z")), "2026-11-09", "в 00:30 понедельника по Ташкенту — уже новая неделя");
  assert.ok(generationHour(new Date("2026-11-07T06:00:00Z")), "11:00 по Ташкенту");
  assert.ok(!generationHour(new Date("2026-11-07T05:59:00Z")));
  assert.ok(!generationHour(new Date("2026-11-07T15:00:00Z")), "20:00 по Ташкенту — уже нет");
});

test("неделя забирается до модели, черновики не копятся, без таблицы — неделя не сгорает", () => {
  const run = read("lib/outside/run.ts");
  assert.ok(run.indexOf("if (!posts) return run;") < run.indexOf("await claimWeek(week)"), "сначала таблица, потом неделя");
  assert.ok(run.indexOf("await claimWeek(week)") < run.indexOf("writeDraft("), "неделя — до модели");
  assert.match(run, /waiting\.map\(\(p\) => p\.platform\)/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /runOutsidePosts\(new Date\(\)\)/);
  // Отчёт о сбое — строкой владельцу, со своим заголовком.
  assert.match(read("lib/admin/shift-reports.ts"), /"outside-posts": "Статьи на площадках"/);
});

test("публикует человек: ни браузера-робота, ни входа в аккаунты площадок, страницу статьи читаем безопасным запросом", () => {
  for (const file of readdirSync("lib/outside")) {
    const source = read(`lib/outside/${file}`);
    assert.doesNotMatch(source, /playwright|puppeteer|chromium/i, file);
    assert.doesNotMatch(source, /\bfetch\(/, `${file}: чужой адрес — только через lib/audit/fetch.ts`);
  }
  assert.match(read("lib/outside/run.ts"), /safeBytes\(post\.published_url!/);
});

test("ссылка на статью — только с адреса этой площадки и по https", () => {
  assert.equal(publishedUrl("vcru", " https://vc.ru/marketing/123-sait-dlya-avtosalona#comments "), "https://vc.ru/marketing/123-sait-dlya-avtosalona");
  assert.equal(publishedUrl("dzen", "https://dzen.ru/a/ZxY"), "https://dzen.ru/a/ZxY");
  assert.equal(publishedUrl("tenchat", "https://tenchat.ru/media/12345-post"), "https://tenchat.ru/media/12345-post");
  for (const [platform, raw] of [
    ["vcru", "http://vc.ru/x/1"],
    ["vcru", "https://vc.ru.evil.com/x/1"],
    ["vcru", "https://evilvc.ru/x/1"],
    ["vcru", "https://dzen.ru/a/1"],
    ["vcru", "https://vc.ru/"],
    ["vcru", "https://user:pass@vc.ru/x"],
    ["dzen", "javascript:alert(1)"],
  ] as const) {
    assert.equal(publishedUrl(platform, raw), null, raw);
  }
});

test("проверка ссылки: передаёт ли вес, nofollow, ugc, завёрнутая в переход площадки, нет ссылки", () => {
  assert.deepEqual(ourLinkOn(`<a href="https://devuz.studio/ru/cases/samauto?utm_source=vc.ru">x</a>`), { state: "follow", rel: null });
  assert.deepEqual(ourLinkOn(`<a rel="nofollow noopener" href="https://devuz.studio/ru">x</a>`), { state: "nofollow", rel: "nofollow noopener" });
  assert.equal(ourLinkOn(`<a href="https://devuz.studio/ru" rel="ugc">x</a>`).state, "nofollow");
  assert.equal(ourLinkOn(`<a href="/redirect?url=https%3A%2F%2Fdevuz.studio%2Fru" target="_blank">x</a>`).state, "follow");
  assert.equal(ourLinkOn(`<a href="https://example.com">x</a> devuz.studio`).state, "missing");
  const at = (min: number) => new Date(Date.parse("2026-11-07T10:00:00Z") + min * 60_000);
  const row = { published_at: "2026-11-07T10:00:00Z", link_checked_at: null };
  assert.ok(!checkDue(row, at(5)), "площадка не сразу отдаёт страницу");
  assert.ok(checkDue(row, at(11)));
  assert.ok(!checkDue({ ...row, link_checked_at: at(11).toISOString() }, at(60 * 24)));
  assert.ok(checkDue({ ...row, link_checked_at: at(11).toISOString() }, at(11 + 60 * 24 * 7)));
});

test("правка, а не новый текст: прошлый черновик и замечания уходят модели, последние попытки — Sonnet", async () => {
  const { ATTEMPTS, modelFor, OUTSIDE_FIX_MODEL, OUTSIDE_MODEL } = await import("@/lib/outside/write");
  assert.equal(ATTEMPTS, 4);
  assert.deepEqual([0, 1, 2, 3].map(modelFor), [OUTSIDE_MODEL, OUTSIDE_MODEL, OUTSIDE_FIX_MODEL, OUTSIDE_FIX_MODEL]);
  const prompt = draftPrompt(topic, "dzen", { notes: ["Длинное тире: «там — All-on-6»"], previous: { title: "Старый заголовок", body: "Старый текст" } });
  assert.match(prompt, /Исправь только это, остальное оставь слово в слово/);
  assert.match(prompt, /Заголовок: Старый заголовок\nТекст:\nСтарый текст/);
  // Просим уже, чем проверяем: длина с запасом от границы.
  for (const p of PLATFORMS) assert.ok(PLATFORM[p].target[0] > PLATFORM[p].min && PLATFORM[p].target[1] < PLATFORM[p].max, p);
  assert.match(draftPrompt(topic, "vcru"), /от 4500 до 6500 знаков/);
});

test("подсказка модели: факты только из кейсов, макет — так и называть, ссылки списком", () => {
  const prompt = draftPrompt(topic, "vcru", { related: ["купить пикап"], notes: ["Текст 100 знаков"] });
  assert.match(prompt, /Факты о наших работах — единственное, что ты о них знаешь/);
  assert.match(prompt, /SamAuto: /);
  assert.match(prompt, /https:\/\/devuz\.studio\/ru\/cases\/samauto|\/ru\/cases\/samauto/);
  assert.match(prompt, /«купить пикап»/);
  assert.match(prompt, /Прошлая попытка не прошла проверку/);
  assert.match(draftPrompt(guide, "dzen"), /Своих работ в этой статье не называй/);
  assert.match(read("lib/outside/write.ts"), /«собрали макет», а не «запустили сайт»/);
});

test("карточка недели — тому, кто публикует, иначе владельцу и руководителю, с кнопкой в раздел", () => {
  const text = weekCardText([{ platform: "vcru", title: "Сайт для автосалона <без тегов>" }], [{ platform: "dzen", title: "Лендинг" }], (s) => s.replace(/</g, "&lt;"));
  assert.match(text, /Готовы на эту неделю:\n• vc\.ru: «Сайт для автосалона &lt;без тегов>»/);
  assert.match(text, /Ещё не опубликованы:\n• Дзен: «Лендинг»/);
  const run = read("lib/outside/run.ts");
  assert.match(run, /panel: "\/admin\/outside"/);
  assert.match(run, /wants\(\(r\.notify_off as string\[\] \| null\) \?\? \[\], "reports"\)/);
});

test("миграция, журнал и инструкция на трёх языках", () => {
  assert.ok(existsSync("supabase/migrations/0181_outside_posts.sql"));
  const sql = read("supabase/migrations/0181_outside_posts.sql");
  assert.match(sql, /unique \(platform, topic_key\)/);
  assert.match(sql, /enable row level security/);
  const audit = read("lib/admin/audit.ts");
  for (const action of ["outside.published", "outside.skipped", "outside.publisher_set"]) assert.ok(audit.includes(`"${action}"`), action);
  for (const file of ["content/admin-help-ru.ts", "content/admin-help-uz.ts", "content/admin-help-pl/work.ts"]) {
    assert.match(read(file), /"\/admin\/outside": \{/, file);
  }
});
