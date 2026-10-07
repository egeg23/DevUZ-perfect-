/**
 * Первое касание по сайту, у которого лёг каталог, — на живом случае.
 *
 * cherrystore.uz, 05.10.2026: все шесть ссылок каталога с главной отдавали
 * 500, а письмо из «Касаний» начиналось «Здравствуйте, Эльдар. Это Эльдар»,
 * называло ошибки «несуществующими страницами», куда посетитель попадает,
 * нажав «Услуги» или «Контакты» (их на сайте нет), и считало баллы с
 * потерями для магазина, в который сейчас нельзя войти.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  greetsSender,
  messageProblems,
  outageFinding,
  outreachHooks,
  outreachPrompt,
} from "@/lib/admin/outreach";
import { problemDict } from "@/content/admin-panel/prospect";
import type { Finding } from "@/lib/audit/checks";
import { brokenLinksFinding } from "@/lib/audit/design";
import { pitch } from "@/lib/audit/pitch";

const CATALOG = ["/catalog/krossovki", "/catalog/yubki", "/catalog/hudi", "/catalog", "/catalog/sapogi", "/catalog/chelsi"].map(
  (p) => `https://cherrystore.uz${p}`,
);

const minor = (code: string): Finding => ({ code, severity: "minor", title: code, impact: code, fix: code });

test("ссылки, которые отдают 500, — это лежащий сервер, а не «несуществующие страницы»", () => {
  const f = brokenLinksFinding({ checkedLinks: 6, brokenLinks: CATALOG, brokenLinkStatuses: Array(6).fill(500) });
  assert.equal(f.severity, "critical", "все проверенные ссылки падают — это не мелочь");
  // Словами покупателя: модель переносила «ошибку сервера 500» в письмо дословно.
  assert.equal(f.title, "6 ссылок с главной открывают страницу с ошибкой вместо раздела");
  assert.match(f.fix, /ошибкой 500/, "код — для разбора, в «что делаем»");
  // Адреса — настоящие, по ним владелец проверит сам; чужих слов нет.
  assert.match(f.impact, /например, \/catalog\/krossovki и \/catalog\/yubki\./);
  assert.doesNotMatch(f.impact, /Услуги|Контакты|не найдена/);

  // Одна 500-я из пяти — плохо, но не «сайт лежит».
  const one = brokenLinksFinding({ checkedLinks: 5, brokenLinks: [CATALOG[0]], brokenLinkStatuses: [500] });
  assert.equal(one.severity, "major");

  // 404 — по-прежнему «несуществующие страницы», но с их адресом, а не с «Услугами».
  const missing = brokenLinksFinding({ checkedLinks: 5, brokenLinks: ["https://mysite.uz/uslugi"], brokenLinkStatuses: [404] });
  assert.equal(missing.title, "1 ссылка с главной ведёт на несуществующие страницы");
  assert.match(missing.impact, /\/uslugi/);
  assert.doesNotMatch(missing.impact, /«Услуги» или «Контакты»/);

  // Вперемешку — честное «не открываются».
  const mixed = brokenLinksFinding({ checkedLinks: 5, brokenLinks: CATALOG.slice(0, 2), brokenLinkStatuses: [404, 502] });
  assert.equal(mixed.title, "2 ссылки с главной не открываются");
});

test("черновик без модели называет код и адреса, а не «Услуги» и «Контакты»", () => {
  const f = brokenLinksFinding({ checkedLinks: 6, brokenLinks: CATALOG, brokenLinkStatuses: Array(6).fill(500) });
  const draft = pitch({ url: "https://cherrystore.uz/", score: 20, findings: [f], facts: {} } as never, "Cherry Shop", "ru");
  assert.ok(draft.ok);
  const text = draft.ok ? draft.text : "";
  assert.match(text, /страницу с ошибкой — например, \/catalog\/krossovki и \/catalog\/yubki/);
  assert.doesNotMatch(text, /500|сервер/);
  assert.doesNotMatch(text, /Услуги|Контакты/);
});

test("сайт лежит — письмо начинается с поломки, без баллов и потерь", () => {
  const outage = brokenLinksFinding({ checkedLinks: 6, brokenLinks: CATALOG, brokenLinkStatuses: Array(6).fill(500) });
  const findings = [minor("no_canonical"), minor("no_schema"), outage];
  assert.equal(outageFinding(findings)?.code, "broken_links");

  const hooks = outreachHooks(findings);
  assert.equal(hooks.seo, null, "балл поиска для лежащего каталога ничего не значит");
  assert.equal(hooks.lost, null, "теряется каждый, кто открыл раздел, — не «26–56 из ста»");

  const prompt = outreachPrompt({ host: "cherrystore.uz", label: "Cherry Shop", niche: null, findings, draft: null, sender: "Эльдар" });
  assert.match(prompt, /Главное на сайте сейчас: 6 ссылок с главной открывают страницу с ошибкой вместо раздела/);
  assert.doesNotMatch(prompt, /Видимость в поиске:/);
  assert.doesNotMatch(prompt, /Потери: из каждых ста/);

  // Обычный сайт — крючки на месте, как и были.
  assert.equal(outageFinding([minor("no_canonical")]), null);
  assert.equal(outageFinding([{ ...outage, severity: "major" }]), null, "одна битая ссылка — не авария");
});

test("приветствие именем того, кто пишет, отправить нельзя", () => {
  assert.equal(greetsSender("Здравствуйте, Эльдар. Это Эльдар из DevUz Studio", "Эльдар"), "Эльдар");
  // Даже если имя отправителя неизвестно — его выдаёт «Это Эльдар» дальше.
  assert.equal(greetsSender("Здравствуйте, Эльдар. Это Эльдар из DevUz Studio", null), "Эльдар");
  assert.equal(greetsSender("Assalomu alaykum, Eldor. Men Eldor, DevUz Studio", null), "Eldor");
  assert.equal(greetsSender("Hello, Alex. I'm Alex from DevUz Studio", null), "Alex");
  // Как и должно быть — без имени, или с названием компании.
  assert.equal(greetsSender("Здравствуйте. Это Эльдар из DevUz Studio", "Эльдар"), null);
  assert.equal(greetsSender("Здравствуйте, команда Cherry. Это Эльдар", "Эльдар"), null);

  const prompt = outreachPrompt({ host: "cherrystore.uz", label: null, niche: null, findings: [minor("no_canonical")], draft: null, sender: "Эльдар" });
  // Здороваться письму не нужно вовсе: «Здравствуйте» уже ушло отдельно (lib/admin/hello-first.ts).
  assert.match(prompt, /Не здоровайся: «Здравствуйте» уже ушло отдельным сообщением[\s\S]*Имени адресата мы не знаем/);
  const bad =
    "Здравствуйте, Эльдар. Это Эльдар из DevUz Studio, devuz.studio — открыл ваш сайт cherrystore.uz. " +
    "Разделы каталога открываются страницей с ошибкой, и покупатель уходит, не увидев товара. " +
    "За 12 часов можем собрать прототип нового сайта с вашим каталогом — откроете с телефона и посмотрите вживую. " +
    "Собрать вам такой прототип?";
  const codes = messageProblems(bad, prompt, "cherrystore.uz", { seo: null, lost: null, reference: null, sender: "Эльдар" }).map((p) => p.code);
  assert.ok(codes.includes("greets_sender"));
  const good = bad.replace("Здравствуйте, Эльдар.", "Здравствуйте.");
  assert.ok(!messageProblems(good, prompt, "cherrystore.uz", { seo: null, lost: null, reference: null, sender: "Эльдар" }).some((p) => p.code === "greets_sender"));

  // Панель покажет причину словами на языке сотрудника.
  for (const lang of ["ru", "uz", "pl"] as const) assert.match(problemDict.greets_sender[lang]("Эльдар"), /Эльдар/);
});

test("письмо знает, что компания пишет о себе, — дословно и только с открывшихся страниц", async () => {
  const { aboutLines } = await import("@/lib/audit/deep");
  const { rateLimited } = await import("@/lib/audit/fetch");
  const home =
    "<html><head><title>Интернет-магазин CHERRY</title></head><body>" +
    "<div><span>Бесплатная доставка по Ташкенту при заказе от 300 000 сум</span><a>Магазины</a></div>" +
    "<nav><a>Доставка и возврат</a></nav></body></html>";
  const stores = "<ul><li>ТЦ Poytaxt (1-й этаж) 10:00 - 20:00</li><li>ТРЦ Mega Planet (3-й этаж) 10:00 - 20:00</li></ul>";
  const lines = aboutLines([
    { status: 200, html: home },
    { status: 200, html: stores },
    { status: 500, html: "<p>Бесплатная доставка — страница ошибки</p>" },
  ]);
  assert.deepEqual(lines, [
    "Бесплатная доставка по Ташкенту при заказе от 300 000 сум",
    "ТЦ Poytaxt (1-й этаж) 10:00 - 20:00",
    "ТРЦ Mega Planet (3-й этаж) 10:00 - 20:00",
  ]);

  const prompt = outreachPrompt({
    host: "cherrystore.uz",
    label: "Cherry Shop",
    niche: null,
    findings: [minor("no_canonical")],
    draft: null,
    sender: "Эльдар",
    walked: { paths: ["/"], quote: null, sitemapUrls: null, sitemapFresh: null, about: lines },
  });
  assert.match(prompt, /Что компания пишет о себе — дословно с её сайта: «Бесплатная доставка по Ташкенту при заказе от 300 000 сум»/);
  // «300 000» в письме — не выдумка: число есть в промпте.
  const msg =
    "Здравствуйте. Это Эльдар из DevUz Studio, devuz.studio — открыл cherrystore.uz. У вас бесплатная доставка по Ташкенту от 300 000 сум, " +
    "а страницы каталога не открываются, и покупатель уходит, не увидев товара. За 12 часов соберём прототип нового сайта с вашим каталогом — " +
    "откроете с телефона, ни к чему не обязывает. Собрать вам такой прототип?";
  assert.ok(!messageProblems(msg, prompt, "cherrystore.uz", { seo: null, lost: null, reference: null }).some((p) => p.code === "invented"));

  // Охрана сайта попросила не спешить — это не страница сайта.
  assert.ok(rateLimited(429, ""));
  assert.ok(rateLimited(403, "<title>Access denied</title> Error 1015 You are being rate limited"));
  assert.ok(!rateLimited(403, "<h1>Forbidden</h1>"));
  assert.ok(!rateLimited(200, "Error 1015"));
});

/* ── Человеческим языком ─────────────────────────────────────────────── */

test("технические слова в письме ловит машина — клиент их не знает", async () => {
  const { jargonWords } = await import("@/lib/admin/outreach");
  // Живой черновик по cherrystore.uz — до правила.
  assert.deepEqual(
    jargonWords("Любой раздел открывается страницей «500 Internal Server Error». Судя по ответу сервера, упала база: WordPress пишет «критическая ошибка».", ["cherrystore.uz"]),
    ["500", "Internal Server Error", "WordPress", "Server"],
  );
  assert.deepEqual(jargonWords("Поисковик видит 98 слов, нет карты сайта, сайт на Next.js, ошибка 404, SEO", []), ["ошибка 404", "Next.js", "SEO", "карты сайта"]);
  assert.deepEqual(jargonWords("Sayt og‘ir yuklanadi, server javob bermayapti, sayt xaritasi yo‘q", []), ["server", "sayt xaritasi"]);
  // Как надо: то, что видит покупатель. Адреса — не жаргон.
  assert.deepEqual(
    jargonWords("Вместо раздела с кроссовками cherrystore.uz/catalog/krossovki открывается страница с ошибкой. Делали ADAR: https://devuz.studio/cases/adar", ["cherrystore.uz"]),
    [],
  );
  assert.deepEqual(jargonWords("Скидки и кэшбэк для постоянных покупателей", []), []);

  const prompt = outreachPrompt({ host: "cherrystore.uz", label: null, niche: null, findings: [minor("no_canonical")], draft: "сборку страниц на сервере — Next.js", sender: "Эльдар" });
  assert.match(prompt, /Адресату пересказывай их тем, что видит и делает его покупатель/);
  assert.doesNotMatch(prompt, /Next\.js/, "черновик языком отчёта модели больше не показывается");
  const { OUTREACH_SYSTEM } = await import("@/lib/admin/outreach");
  assert.match(OUTREACH_SYSTEM, /\*\*Человеческим языком\.\*\*/);

  const letter =
    "Здравствуйте. Это Эльдар из DevUz Studio, devuz.studio — открыл cherrystore.uz. Любой раздел каталога открывается страницей " +
    "«500 Internal Server Error», покупатель уходит, не увидев товара. За 12 часов соберём прототип нового сайта с вашим каталогом — " +
    "откроете с телефона, ни к чему не обязывает. Собрать вам такой прототип?";
  const codes = messageProblems(letter, prompt, "cherrystore.uz", { seo: null, lost: null, reference: null }).map((p) => p.code);
  assert.ok(codes.includes("jargon"));
  for (const lang of ["ru", "uz", "pl"] as const) assert.match(problemDict.jargon[lang]("WordPress"), /WordPress/);
});

/* ── Проверка по факту ───────────────────────────────────────────────── */

const page = (over: Record<string, unknown> = {}) =>
  ({
    finalUrl: "https://cherrystore.uz/",
    status: 200,
    redirects: [],
    html: "<html><head><title>CHERRY</title></head><body><h1>Одежда и обувь</h1><p>© 2021 Cherry</p></body></html>",
    truncated: false,
    headers: {},
    ttfbMs: 300,
    totalMs: 400,
    https: true,
    certDaysLeft: 90,
    tlsIssue: null,
    ...over,
  }) as never;

test("в письмо идёт только то, что повторилось на второй загрузке", async () => {
  const { factCheck } = await import("@/lib/audit/verify");
  const { analyze } = await import("@/lib/audit/checks");
  const NOW = new Date("2026-10-05T12:00:00Z");
  const home = page();
  const findings = analyze(home, NOW).findings;
  assert.ok(findings.some((f) => f.code === "stale_copyright"));

  // Второй раз — то же самое: всё подтверждено.
  const same = await factCheck({ findings, home, second: page(), recheck: async () => [], now: NOW });
  assert.ok(same.ok);
  assert.deepEqual(same.ok && same.findings.map((f) => f.code), findings.map((f) => f.code));
  assert.equal(same.ok && same.at, NOW.toISOString());

  // Во второй раз год свежий — «старый год в подвале» в письмо не идёт.
  const fresh = page({ html: "<html><head><title>CHERRY</title></head><body><h1>Одежда и обувь</h1><p>© 2026 Cherry</p></body></html>" });
  const changed = await factCheck({ findings, home, second: fresh, recheck: async () => [], now: NOW });
  assert.ok(changed.ok);
  assert.ok(changed.ok && !changed.findings.some((f) => f.code === "stale_copyright"));
  assert.deepEqual(changed.ok && changed.dropped.map((d) => [d.code, d.why]), [["stale_copyright", "not_repeated"]]);

  // Второй раз сайт не открылся вовсе — писать нельзя.
  const none = await factCheck({ findings, home, second: null, recheck: async () => [], now: NOW });
  assert.deepEqual(none, { ok: false, why: "no_second_look" });
});

test("битые разделы перезапрашиваются: открылись — находки нет; сайт «не открывается» — только если не открылся дважды", async () => {
  const { factCheck } = await import("@/lib/audit/verify");
  const NOW = new Date("2026-10-05T12:00:00Z");
  const assets = { css: "", cssCount: 0, cssTruncated: false, favicon: true, checkedImages: 0, brokenImages: [], checkedLinks: 6, brokenLinks: CATALOG, brokenLinkStatuses: Array(6).fill(500), contactsHtml: null, contactsUrl: null };
  const home = page({ assets });
  const outage = brokenLinksFinding(assets);
  const asked: string[][] = [];

  const still = await factCheck({ findings: [outage], home, second: page(), recheck: async (urls) => (asked.push([...urls]), urls.map(() => 500)), now: NOW });
  assert.ok(still.ok && still.findings.some((f) => f.code === "broken_links"));
  assert.equal(asked[0].length, 3, "перезапрашиваем не больше трёх адресов");

  const fixed = await factCheck({ findings: [outage], home, second: page(), recheck: async (urls) => urls.map(() => 200), now: NOW });
  assert.ok(fixed.ok && !fixed.findings.length);
  assert.deepEqual(fixed.ok && fixed.dropped[0].why, "opened_again");

  // Охрана не пустила перезапрос — «не знаем», а не «починили».
  const unknown = await factCheck({ findings: [outage], home, second: page(), recheck: async (urls) => urls.map(() => null), now: NOW });
  assert.ok(unknown.ok && unknown.findings.length === 1);

  const down = { code: "unreachable", severity: "critical" as const, title: "Сайт не открывается", impact: "", fix: "" };
  const flaky = await factCheck({ findings: [down], home: null, second: page(), recheck: async () => [], now: NOW });
  assert.ok(flaky.ok && !flaky.findings.length, "второй раз открылся — «не открывается» не пишем");
  const really = await factCheck({ findings: [down], home: null, second: null, recheck: async () => [], now: NOW });
  assert.ok(really.ok && really.findings[0].code === "unreachable");
});

test("письмо без свежей проверки по факту не отправляется, а обойти проверку нельзя", async () => {
  const { checkFresh, CHECK_FRESH_MS, sendProblems } = await import("@/lib/admin/outreach-store");
  const now = Date.parse("2026-10-05T12:00:00Z");
  assert.ok(checkFresh("2026-10-05T10:00:00Z", now));
  assert.ok(!checkFresh(new Date(now - CHECK_FRESH_MS - 1).toISOString(), now), "старше трёх дней — заново");
  assert.ok(!checkFresh(null, now), "письмо до правила — заново");

  const card = {
    host: "cherrystore.uz",
    label: "Cherry Shop",
    niche: null,
    findings: [minor("no_canonical")],
    draft: null,
    walked: null,
    message: "Здравствуйте. Это Эльдар из DevUz Studio, devuz.studio — открыл cherrystore.uz.",
    proto_url: null,
    checked_at: null,
  };
  assert.ok(sendProblems(card, "Эльдар", now).some((p) => p.code === "not_checked"));
  assert.ok(!sendProblems({ ...card, checked_at: "2026-10-05T11:00:00Z" }, "Эльдар", now).some((p) => p.code === "not_checked"));
  for (const lang of ["ru", "uz", "pl"] as const) assert.ok(problemDict.not_checked[lang].length > 20);

  // Письмо пишет только prepareOutreach, и в нём проверка стоит до модели:
  // без неё — отказ, а находки берутся из проверки, не из старой пачки.
  const { readFileSync } = await import("node:fs");
  const store = readFileSync(new URL("../lib/admin/outreach-store.ts", import.meta.url), "utf8");
  const prepare = store.slice(store.indexOf("export async function prepareOutreach"), store.indexOf("export function sendProblems"));
  const check = prepare.indexOf("await factCheck(");
  assert.ok(check > 0, "проверка по факту в подготовке письма");
  assert.ok(check < prepare.indexOf("outreachPrompt("), "проверка — до промпта");
  assert.match(prepare, /if \(!checked\.ok\) \{\s*return \{[\s\S]{0,300}code: "not_verified"/);
  assert.match(prepare, /const findings = checked\.findings;/);
  assert.doesNotMatch(prepare, /: prospect\.findings;/, "непроверенные находки из пачки письму не основание");
});

test("дожим — то же касание: технические слова не пропускаются и в нём", async () => {
  const { FOLLOWUP_SYSTEM, followupProblems } = await import("@/lib/admin/outreach-followup");
  assert.match(FOLLOWUP_SYSTEM, /Человеческим языком/);
  const plain = "Добрый день. Коротко вернёмся к cherrystore.uz: разделы каталога по-прежнему открываются страницей с ошибкой. Актуально для вас?";
  assert.deepEqual(followupProblems(plain, "", "cherrystore.uz"), []);
  assert.ok(followupProblems(plain.replace("страницей с ошибкой", "ошибкой 500 — упал сервер"), "500", "cherrystore.uz").some((p) => p.startsWith("технические слова")));
});
