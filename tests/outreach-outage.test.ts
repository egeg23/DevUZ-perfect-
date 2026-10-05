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
  assert.equal(f.title, "6 ссылок с главной открывают ошибку сервера 500");
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
  assert.match(text, /ошибку сервера 500 — например, \/catalog\/krossovki и \/catalog\/yubki/);
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
  assert.match(prompt, /Главное на сайте сейчас: 6 ссылок с главной открывают ошибку сервера 500/);
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
  assert.match(prompt, /Имени адресата мы не знаем: здоровайся без имени/);
  const bad =
    "Здравствуйте, Эльдар. Это Эльдар из DevUz Studio, devuz.studio — открыл ваш сайт cherrystore.uz. " +
    "Разделы каталога открываются с ошибкой сервера, и покупатель уходит, не увидев товара. " +
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
