import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, type Server } from "node:http";
import { test } from "node:test";

/**
 * Боевой сайт CZECHFARM на сервере компании (владелец, 10.11.2026: клиент
 * оплатил, «приводим в боевой вид, всё по смете»): scripts/protos/chechfarm/app.
 * Сеть (Telegram, amoCRM, Bitrix24) подменена: проверяем, что обращение с сайта
 * доходит до панели, команды в Telegram с «Взял» и CRM, что статус виден
 * клиенту, что менеджер не видит инвесторов, что комната инвестора открывается
 * только по живой ссылке и что страницы на четырёх языках без следов макета.
 */
const ROOT = new URL("../scripts/protos/chechfarm/", import.meta.url);
const APP = new URL("app/", ROOT);
/* eslint-disable @typescript-eslint/no-explicit-any */
const load = async (f: string): Promise<any> => import(new URL(f, APP).href);

/* Страницы боевого сайта — во временную папку, как в GitHub. */
let SITE = "";
function site() {
  if (SITE) return SITE;
  SITE = mkdtempSync(join(tmpdir(), "cf-site-")) + "/";
  execFileSync(process.execPath, [new URL("gen.mjs", ROOT).pathname], { env: { ...process.env, CF_PROD: "1", CF_SITE: SITE }, stdio: "pipe" });
  return SITE;
}

type Call = { url: string; body: any; method: string };
function fakeNet() {
  const calls: Call[] = [];
  const ok = (j: unknown, status = 200) => new Response(JSON.stringify(j), { status, headers: { "Content-Type": "application/json" } });
  let msg = 100;
  const fetchImpl = async (url: string, init: any = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url, body, method: init.method || "GET" });
    if (url.includes("api.telegram.org")) {
      if (url.endsWith("/getMe")) return ok({ ok: true, result: { username: "czechfarm_bot" } });
      if (body?.chat_id === "666") return ok({ ok: false, description: "Forbidden: bot was blocked by the user" }, 403);
      if (url.endsWith("/sendMessage") || url.endsWith("/sendPhoto")) return ok({ ok: true, result: { message_id: ++msg } });
      return ok({ ok: true, result: true });
    }
    if (url.includes("amocrm.ru")) {
      if (url.endsWith("/api/v4/account")) return ok({ name: "CZECHFARM" });
      if (url.endsWith("/api/v4/leads/complex")) return ok([{ id: 7001 }]);
      return ok({});
    }
    if (url.includes("bitrix24.ru")) {
      if (url.includes("crm.lead.fields")) return ok({ result: { TITLE: {} } });
      if (url.includes("crm.lead.add")) return ok({ result: 9001 });
    }
    throw new Error("неожиданный адрес " + url);
  };
  return { calls, fetchImpl };
}

async function boot(opts: Record<string, unknown> = {}) {
  const { openDb } = await load("lib/db.mjs");
  const { makeCore } = await load("lib/core.mjs");
  const { createApp } = await load("server.mjs");
  const net = fakeNet();
  const db = openDb(":memory:");
  const publicUrl = "https://czechfarm.test";
  const core = makeCore({ db, secret: "test-secret-0123456789", publicUrl, fetchImpl: net.fetchImpl });
  const dataDir = mkdtempSync(join(tmpdir(), "cf-data-"));
  const handle = createApp({ core, siteDir: site(), adminDir: new URL("admin/", APP).pathname, dataDir, setupCode: "setup-42", publicUrl, commit: "abc", sceneKey: "ab".repeat(32), ...opts });
  const server: Server = createServer(handle);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  let cookie = "";
  async function call(path: string, body?: unknown, extra: Record<string, string> = {}) {
    const headers: Record<string, string> = { ...(cookie ? { Cookie: cookie } : {}), ...extra };
    if (body !== undefined && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    const r = await fetch(`http://127.0.0.1:${port}${path}`, { method: body === undefined ? "GET" : "POST", headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
    const set = r.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const text = await r.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* страница */ }
    return { status: r.status, json, text, headers: r.headers };
  }
  const adminPost = (path: string, body: unknown) => call("/api/admin" + path, body, { "X-CF": "1" });
  const tg = (update: unknown) => call("/api/tg/hook", update, { "X-Telegram-Bot-Api-Secret-Token": core.tgSecret() });
  return { core, db, net, call, adminPost, tg, close: () => new Promise((r) => server.close(r)), setCookie: (c: string) => (cookie = c), getCookie: () => cookie };
}
const owner = async (a: Awaited<ReturnType<typeof boot>>) => {
  assert.equal((await a.adminPost("/setup", { code: "setup-42", login: "owner", name: "Владелец", pass: "длинный-пароль" })).status, 200);
};

test("czechfarm: разбор CRM, Telegram, адресов и файлов", async () => {
  const { amoBase, b24Base, amoPayload, b24Payload } = await load("lib/crm.mjs");
  const { tgUpdate, faqMatch } = await load("lib/tg.mjs");
  const { routeOf, fileKind } = await load("server.mjs");
  assert.equal(amoBase("czechfarm"), "https://czechfarm.amocrm.ru");
  assert.equal(amoBase("evil.com"), "", "токен ушёл бы на чужой адрес");
  assert.equal(b24Base("https://czechfarm.bitrix24.ru/rest/1/abc123def/"), "https://czechfarm.bitrix24.ru/rest/1/abc123def/");
  assert.equal(b24Base("http://czechfarm.bitrix24.ru/rest/1/abc/"), "", "вебхук не по https");
  assert.equal(b24Base("https://x.ru/api/"), "");
  const l = { no: "CF-AAAAAA", kind: "partner", name: "Ali", org: "Pharma", email: "a@b.uz", phone: "+998901112233", msg: "Препарат", extra: "{}" };
  assert.equal(amoPayload(l)[0]._embedded.contacts[0].custom_fields_values.length, 2);
  assert.match(b24Payload(l).fields.TITLE, /Запуск бренда: Pharma \(CF-AAAAAA\)/);
  assert.equal(tgUpdate({ message: { chat: { id: -5, type: "group" }, text: "x" } }), null, "группы не разбираем");
  assert.equal(tgUpdate({ callback_query: { id: "q", data: "take:3", from: {}, message: { message_id: 9, chat: { id: 1 } } } }).data, "take:3");
  const faq = [{ id: 1, q: "Где купить препараты?", a: "В аптеках" }, { id: 2, q: "Как стать партнёром?", a: "Заявка на сайте" }];
  assert.equal(faqMatch("подскажите, где купить ваши препараты", faq).id, 1);
  assert.equal(faqMatch("добрый день", faq), null);
  assert.deepEqual(routeOf("/"), ["ru", ""]);
  assert.deepEqual(routeOf("/ar/contacts"), ["ar", "contacts"]);
  assert.equal(routeOf("/en/panel"), null, "демо-панели на боевом сайте нет");
  assert.equal(fileKind(Buffer.from("%PDF-1.7 x")), "pdf");
  assert.equal(fileKind(Buffer.from("<svg onload=alert(1)>")), "", "SVG и HTML не загружаются");
});

test("czechfarm: страницы на четырёх языках, без следов макета, арабский справа налево", () => {
  const dir = site();
  for (const lang of ["", "uz/", "en/", "ar/"]) for (const p of ["", "about/", "products/", "partners/", "investors/", "news/", "contacts/", "privacy/", "account/"]) {
    const f = dir + lang + p + "index.html";
    assert.ok(existsSync(f), "нет страницы " + lang + p);
    const html = readFileSync(f, "utf8");
    assert.ok(!/__PROTO_BASE__|mockup-terms|dz-intro|демо-панел|Это макет|DevUz/i.test(html), "след макета на " + lang + p);
    assert.ok(html.includes('"live":null') && html.includes("__SITE_URL__"), "серверу нечего подставлять на " + lang + p);
    assert.ok(html.includes('content="index, follow"'), "боевой сайт закрыт от поиска");
    assert.ok(!html.includes("id=\"kit\""), "блок цены макета на боевом сайте");
  }
  const ar = readFileSync(dir + "ar/index.html", "utf8");
  assert.match(ar, /<html lang="ar" dir="rtl"( class="on-dark")?>/);
  const text = ar.slice(ar.indexOf("<body")).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ");
  const latin = [...new Set(text.match(/[A-Za-z]{4,}/g) || [])].filter((w) => !["CZECHFARM", "Health", "Trust", "Value", "alliance"].includes(w));
  assert.deepEqual(latin, [], "английский на арабской главной");
  assert.ok(!existsSync(new URL("ar-missing.json", ROOT)), "у арабского не хватает строк");
  /* Макет остаётся на трёх языках и без арабского. */
  const bundle = JSON.parse(readFileSync(new URL("../../../content/proto-bundles/chechfarm.json", ROOT), "utf8"));
  assert.ok(!Object.keys(bundle.pages).some((k) => k.startsWith("ar")), "арабский попал в макет");
  assert.ok(bundle.pages[""].includes("mockup-terms"), "у макета пропали условия");
});

test("czechfarm: обращение с сайта → панель → статус клиенту по ключу", async () => {
  const a = await boot();
  try {
    assert.equal((await a.call("/api/lead", { kind: "partner", name: "Ali", email: "nope" })).status, 400);
    assert.equal((await a.call("/api/lead", { kind: "partner", name: "Ali" })).status, 400, "без почты и телефона");
    const bot = (await a.call("/api/lead", { kind: "partner", name: "Bot", email: "b@b.uz", website: "x" })).json;
    assert.equal(bot.no, "", "ловушка для ботов");
    const r = (await a.call("/api/lead", { kind: "partner", page: "partners", lang: "en", name: "Ali", org: "Pharma LLC", country: "India", email: "ali@pharma.in", msg: "Launch", scale: "25" })).json;
    assert.match(r.no, /^CF-[A-Z2-9]{6}$/);
    assert.deepEqual((await a.call("/api/track", { items: [{ no: r.no, key: r.key }] })).json.st, { [r.no]: "new" });
    assert.deepEqual((await a.call("/api/track", { items: [{ no: r.no, key: "чужой" }] })).json.st, {}, "статус без ключа");
    await owner(a);
    const list = (await a.call("/api/admin/leads")).json.leads;
    assert.equal(list[0].no, r.no);
    assert.equal(list[0].extra.scale, "25");
    assert.equal((await a.adminPost(`/leads/${list[0].id}`, { status: "meet", note: "Созвон в пятницу" })).json.statusName, "Назначена встреча");
    assert.deepEqual((await a.call("/api/track", { items: [{ no: r.no, key: r.key }] })).json.st, { [r.no]: "meet" });
    const card = (await a.call(`/api/admin/leads/${list[0].id}`)).json;
    assert.ok(card.history.some((h: any) => /Назначена встреча/.test(h.t)));
  } finally { await a.close(); }
});

test("czechfarm: робот с данными кошелька — в спам, чужие поля в карточку не идут", async () => {
  const a = await boot();
  try {
    const junk = (await a.call("/api/lead", { kind: "other", name: "John Smith", email: "victim-9prvae4e@example.com", phone: "+17953487841", wallet: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", mnemonic: "eat eat eat eat eat eat eat eat eat eat eat junk", private_key: "0xdfe6", message: "Please verify my wallet" })).json;
    assert.match(junk.no, /^CF-/, "робот получает обычный ответ");
    const ok = (await a.call("/api/lead", { kind: "investor", name: "Fund", email: "f@fund.com", want: "meet", foo: "лишнее" })).json;
    await owner(a);
    const list = (await a.call("/api/admin/leads")).json.leads;
    const j = list.find((l: any) => l.no === junk.no), o = list.find((l: any) => l.no === ok.no);
    assert.equal(j.status, "spam");
    assert.deepEqual(j.extra, {}, "поля робота попали в карточку");
    assert.equal(o.status, "new");
    assert.deepEqual(o.extra, { want: "meet" });
    const sum = (await a.call("/api/admin/summary")).json;
    assert.ok(!JSON.stringify(sum).includes("John Smith"), "спам в сводке");
  } finally { await a.close(); }
});

test("czechfarm: роли — менеджер не видит инвесторов, ключи вводит только владелец", async () => {
  const a = await boot();
  try {
    assert.equal((await a.call("/api/admin/summary")).status, 401);
    assert.equal((await a.call("/api/admin/setup", { code: "setup-42", login: "owner", name: "В", pass: "длинный-пароль" })).status, 403, "POST без X-CF");
    await owner(a);
    assert.equal((await a.adminPost("/users", { login: "manager1", name: "Менеджер", role: "manager", pass: "пароль-менеджера" })).status, 200);
    await a.call("/api/lead", { kind: "investor", name: "Fund", email: "f@fund.com" });
    await a.call("/api/lead", { kind: "pharmacy", name: "Apteka", phone: "+998901234567" });
    a.setCookie("");
    assert.equal((await a.adminPost("/login", { login: "manager1", pass: "пароль-менеджера" })).status, 200);
    const kinds = (await a.call("/api/admin/leads")).json.leads.map((l: any) => l.kind);
    assert.deepEqual(kinds, ["pharmacy"], "менеджер видит запрос инвестора");
    assert.equal((await a.call("/api/admin/ir")).status, 403);
    assert.equal((await a.adminPost("/site/seo", {})).status, 403);
    assert.equal((await a.adminPost("/connect/tg", { token: "123456:" + "A".repeat(35) })).status, 403);
    assert.equal((await a.call("/api/admin/site")).json.seo, null);
    assert.equal((await a.call("/api/admin/users", {}, { "X-CF": "1", Origin: "https://evil.example" })).status, 403);
  } finally { await a.close(); }
});

test("czechfarm: Telegram — команде «Взял», ответ клиенту, бот отвечает на частые вопросы", async () => {
  const a = await boot();
  try {
    await owner(a);
    assert.equal((await a.adminPost("/connect/tg", { token: "123456:" + "A".repeat(35) })).json.bot, "czechfarm_bot");
    const hook = a.net.calls.find((c) => c.url.endsWith("/setWebhook"))!;
    assert.equal(hook.body.url, "https://czechfarm.test/api/tg/hook");
    assert.ok(hook.body.allowed_updates.includes("callback_query"));
    assert.equal((await a.call("/api/tg/hook", { message: {} })).status, 403, "вебхук без секрета");
    /* Владелец привязывает Telegram кодом из панели. */
    const code = new URL((await a.adminPost("/tg/link", {})).json.url).searchParams.get("start");
    await a.tg({ message: { message_id: 1, date: 1, chat: { id: 500, type: "private" }, from: { first_name: "Владелец" }, text: "/start " + code } });
    assert.equal(a.db.get("select count(*) n from tg_staff").n, 1);
    /* Обращение с сайта — карточка с «Взял». */
    a.net.calls.length = 0;
    await a.call("/api/lead", { kind: "partner", name: "Ali", email: "ali@pharma.in", msg: "Launch" });
    const card = a.net.calls.find((c) => c.url.endsWith("/sendMessage") && c.body.chat_id === "500")!;
    assert.match(card.body.text, /Запуск бренда · CF-/);
    assert.equal(card.body.reply_markup.inline_keyboard[0][0].callback_data.split(":")[0], "take");
    const id = Number(card.body.reply_markup.inline_keyboard[0][0].callback_data.split(":")[1]);
    a.net.calls.length = 0;
    await a.tg({ callback_query: { id: "cb1", data: `take:${id}`, from: { first_name: "Владелец" }, message: { message_id: 101, chat: { id: 500 } } } });
    assert.equal(a.db.get("select owner_id from leads where id = ?", id).owner_id, 1);
    assert.ok(a.net.calls.some((c) => c.url.endsWith("/editMessageText") && /Взял: Владелец/.test(c.body.text)), "карточка не обновилась");
    /* Клиент пишет боту: частый вопрос — ответ из панели; свой вопрос — обращение. */
    assert.equal((await a.adminPost("/site/faq", { faq: [{ q: "Где купить препараты?", a: "В аптеках Ташкента" }] })).status, 200);
    a.net.calls.length = 0;
    await a.tg({ message: { message_id: 2, date: 1, chat: { id: 900, type: "private" }, from: { first_name: "Клиент" }, text: "где купить ваши препараты" } });
    assert.ok(a.net.calls.some((c) => c.body?.chat_id === "900" && c.body.text === "В аптеках Ташкента"));
    await a.tg({ message: { message_id: 3, date: 1, chat: { id: 900, type: "private" }, from: { first_name: "Клиент", username: "client" }, text: "Хочу стать дистрибьютором в Самарканде" } });
    const botLead = a.db.get("select id, kind, src, tg_chat from leads where src = 'bot'");
    assert.deepEqual([botLead.kind, botLead.tg_chat], ["bot", "900"]);
    /* Сотрудник отвечает (Reply) на уведомление — уходит клиенту. */
    const notice = a.db.get("select message_id from notices where lead_id = ? and chat_id = '500'", botLead.id);
    a.net.calls.length = 0;
    await a.tg({ message: { message_id: 4, date: 1, chat: { id: 500, type: "private" }, from: { first_name: "Владелец" }, text: "Свяжемся сегодня", reply_to_message: { message_id: notice.message_id } } });
    assert.ok(a.net.calls.some((c) => c.body?.chat_id === "900" && c.body.text === "Свяжемся сегодня"), "ответ не ушёл клиенту");
    assert.equal(a.db.get("select status from leads where id = ?", botLead.id).status, "done");
  } finally { await a.close(); }
});

test("czechfarm: CRM — Bitrix24 и amoCRM, обращение уходит само", async () => {
  const a = await boot();
  try {
    await owner(a);
    assert.equal((await a.adminPost("/connect/b24", { hook: "https://evil.example/hook" })).status, 400);
    assert.equal((await a.adminPost("/connect/b24", { hook: "https://czechfarm.bitrix24.ru/rest/1/abc123/" })).json.crm.name, "Bitrix24");
    const raw = a.db.get("select v from settings where k = 'b24.hook'").v;
    assert.ok(!raw.includes("abc123"), "вебхук лежит в базе открытым");
    await a.call("/api/lead", { kind: "pharmacy", name: "Apteka", phone: "+998901234567" });
    assert.equal(a.db.get("select crm_id from leads order by id desc").crm_id, "9001");
    assert.equal((await a.adminPost("/connect/amo", { domain: "czechfarm", token: "t".repeat(40) })).json.crm.name, "amoCRM");
    await a.call("/api/lead", { kind: "other", name: "Ivan", email: "i@i.uz" });
    assert.equal(a.db.get("select crm_id from leads order by id desc").crm_id, "7001");
  } finally { await a.close(); }
});

test("czechfarm: продукты, новости, контакты и заголовки из панели — сразу в странице", async () => {
  const a = await boot();
  try {
    await owner(a);
    const p = (await a.adminPost("/products", { name: "Цитрамон-CZ", inn: "Кислота", rx: "otc", doc: "javascript:alert(1)" }));
    assert.equal(p.status, 400, "ссылка javascript: в инструкции");
    const id = (await a.adminPost("/products", { name: "Цитрамон-CZ", inn: "Кислота", rx: "otc" })).json.id;
    assert.ok(!(await a.call("/products")).text.includes("Цитрамон-CZ"), "черновик на сайте");
    await a.adminPost(`/products/${id}/pub`, {});
    const nid = (await a.adminPost("/news", { ru: { title: "Новость", body: "Текст" }, en: { title: "News EN", body: "Text" } })).json.id;
    await a.adminPost(`/news/${nid}/pub`, {});
    await a.adminPost("/site/contacts", { phone: "+998 71 200 00 00", email: "info@czechfarm.uz" });
    assert.equal((await a.adminPost("/site/contacts", { map: "https://evil.example/frame" })).status, 400);
    await a.adminPost("/site/seo", { "en:products": { t: "CZECHFARM products </title><script>", d: "Catalogue" } });
    const en = (await a.call("/en/products")).text;
    assert.ok(en.includes("Цитрамон-CZ") && en.includes("info@czechfarm.uz"));
    assert.ok(en.includes("<title>CZECHFARM products &lt;/title&gt;&lt;script&gt;</title>"), "заголовок не экранирован");
    const evil = (await a.adminPost("/products", { name: "X</script><b>" })).json.id;
    await a.adminPost(`/products/${evil}/pub`, {});
    const en2 = (await a.call("/en/products")).text;
    assert.ok(en2.includes("X\\u003c/script>\\u003cb>") && !en2.includes("X</script>"), "название продукта закрыло скрипт страницы");
    assert.ok((await a.call("/en/news")).text.includes("News EN"));
    assert.ok((await a.call("/uz/news")).text.includes("Новость"), "нет перевода — русский");
    assert.equal((await a.call("/sitemap.xml")).text.match(/<loc>/g)!.length, 36);
    assert.equal((await a.call("/about/")).status, 301);
  } finally { await a.close(); }
});

/* Владелец, 17.11.2026: «дай возможность им добавлять свои товары на этот
   подиум, но чтобы фон вырезался автоматически через бесплатный сервис».
   Фон убирает браузер в панели (admin/cut.js, модель rembg на их сервере),
   на сервер приходит уже вырезка; подиумы шапки выбираются в «Продуктах». */
test("czechfarm: своя упаковка — вырезка в панели и место на подиуме шапки", async () => {
  const { imageSize, heroStyle, HERO_SLOTS } = await load("lib/hero.mjs");
  const PUB = new URL("../../../public/protos/chechfarm/products/", ROOT);
  const tall = readFileSync(new URL("dilargo-caps-960.webp", PUB));
  assert.deepEqual(imageSize(tall), { w: 420, h: 649 });
  assert.deepEqual(imageSize(readFileSync(new URL("elstar-960.webp", PUB))), { w: 637, h: 465 });
  /* Без выбора — те же размеры, что были; высокая в низкой рамке — уже. */
  assert.equal(heroStyle(HERO_SLOTS[0]), "--wd:11.4%;--wm:21%");
  assert.equal(heroStyle(HERO_SLOTS[3]), "--wm:18%");
  assert.ok(parseFloat(heroStyle(HERO_SLOTS[0], 649 / 420).split("--wd:")[1]) < 11.4, "высокая упаковка не ужалась");

  const admin = readFileSync(new URL("admin/index.html", APP), "utf8"), cut = readFileSync(new URL("admin/cut.js", APP), "utf8");
  assert.ok(admin.indexOf("/admin/cut.js") < admin.indexOf("/admin/app.js"), "вырезка не подключена к панели");
  assert.ok(/silueta-75da6c8d\.onnx/.test(cut) && readFileSync(new URL("deploy/cut-assets.sh", APP), "utf8").includes("silueta-75da6c8d.onnx"), "имя модели в панели и в сборке разное");
  assert.ok(!/https?:\/\//.test(cut.replace(/\/\*[\s\S]*?\*\//g, "")), "вырезка ходит на чужой сервис");
  assert.ok(readFileSync(new URL("../../../.github/workflows/czechfarm-app.yml", ROOT), "utf8").includes("cut-assets.sh"), "сборка не кладёт модель");

  const a = await boot();
  try {
    await owner(a);
    const page = await a.call("/admin");
    assert.match(page.headers.get("content-security-policy") || "", /script-src 'self' 'wasm-unsafe-eval'/);
    const up = await a.adminPost("/upload", { data: "data:image/webp;base64," + tall.toString("base64") });
    const img = up.json.url;
    assert.match(img, /^\/uploads\/[0-9a-f]{32}\.webp$/);
    const id = (await a.adminPost("/products", { name: "Новинка-CZ", area: "neuro", img })).json.id;
    assert.equal((await a.adminPost("/hero", { slots: [id, null, null, null] })).status, 400, "черновик встал на подиум");
    await a.adminPost(`/products/${id}/pub`, {});
    const bare = (await a.adminPost("/products", { name: "Без фото" })).json.id;
    await a.adminPost(`/products/${bare}/pub`, {});
    assert.equal((await a.adminPost("/hero", { slots: [bare, null, null, null] })).status, 400, "без фото встал на подиум");
    assert.deepEqual((await a.adminPost("/hero", { slots: [id, null, null, null] })).json.hero, [id, null, null, null]);
    const html = (await a.call("/products")).text;
    const slot = /<span class="pk [^"]*" data-slot="0" style="([^"]*)"[^>]*><img src="([^"]*)"/.exec(html);
    assert.ok(slot && slot[2] === img, "на подиуме не та упаковка");
    assert.equal(slot![1], heroStyle(HERO_SLOTS[0], 649 / 420));
    assert.ok(/data-slot="1" style="--wd:6\.9%;--wm:11%"[^>]*><img src="\/protos\/chechfarm\/products\/dilargo-caps/.test(html), "соседний подиум сдвинулся");
    /* Менеджер подиумы не меняет. */
    await a.adminPost("/users", { login: "man", name: "Менеджер", role: "manager", pass: "пароль-менеджера" });
    a.setCookie("");
    await a.adminPost("/login", { login: "man", pass: "пароль-менеджера" });
    assert.equal((await a.adminPost("/hero", { slots: [null, null, null, null] })).status, 403);
  } finally { await a.close(); }
});

/* Владелец, 16.11.2026: «Делаем раздел на новой странице у них — наши
   продукты». Портфель из таблицы компании ложится в базу сам, один раз. */
test("czechfarm: портфель из таблицы — на сайте сразу, схема приёма только в панели, удалённое не возвращается", async () => {
  const { CATALOG, AREAS } = await load("lib/catalog.mjs");
  assert.equal(new Set(CATALOG.map((c: { key: string }) => c.key)).size, CATALOG.length, "ключи повторяются");
  for (const c of CATALOG) {
    assert.ok(AREAS.includes(c.area), `${c.key}: направление`);
    for (const side of [480, 960]) assert.equal(existsSync(`public/protos/chechfarm/products/${c.key}-${side}.webp`), !!c.img, `${c.key}: фото ${side}`);
    assert.doesNotMatch(JSON.stringify(c), /—|–| - /, `${c.key}: тире`);
  }
  for (const a of AREAS) for (const f of [`bg-${a}-700`, `bg-${a}-1100`]) assert.ok(existsSync(`public/protos/chechfarm/products/${f}.webp`), f);
  const a = await boot();
  try {
    await owner(a);
    const list = (await a.call("/products")).text;
    assert.equal(a.db.get("select count(*) n from products where pub = 1").n, CATALOG.length, "не весь портфель на сайте");
    assert.ok(list.includes("Эльстар") && list.includes("/protos/chechfarm/products/elstar-960.webp"), "портфеля нет в странице");
    assert.ok(!list.includes('"dose"') && !list.includes('"key":"'), "схема приёма или ключ на сайте");
    assert.ok(!list.includes("1 таблетка 1 раз в месяц"), "схема приёма на сайте");
    assert.ok(list.includes('id="pf-hero"') && list.includes('id="pf-areas"'), "нет витрины");
    /* Исправление по упаковке меняет прежнее значение из таблицы, правку панели — нет. */
    const tz = a.db.get("select id, data from products where json_extract(data, '$.key') = 'tiozolin'");
    a.db.run("update products set data = ? where id = ?", JSON.stringify({ ...JSON.parse(tz.data), pack: "10 ампул по 5 мл" }), tz.id);
    { const { makeCore } = await load("lib/core.mjs"); makeCore({ db: a.db, secret: "test-secret-0123456789" }); }
    assert.equal(JSON.parse(a.db.get("select data from products where id = ?", tz.id).data).pack, "10 ампул по 4 мл", "исправление по упаковке не применилось");
    const first = a.db.get("select id from products order by sort limit 1").id;
    await a.adminPost(`/products/${first}/del`, {});
    const { makeCore } = await load("lib/core.mjs");
    makeCore({ db: a.db, secret: "test-secret-0123456789" });
    assert.equal(a.db.get("select count(*) n from products").n, CATALOG.length - 1, "удалённый продукт вернулся");
  } finally { await a.close(); }
});

test("czechfarm: портфель на языке посетителя — тексты, упаковки и первый заход по браузеру", async () => {
  const { CATALOG } = await load("lib/catalog.mjs");
  const { CATALOG_TR, PACK_LANGS, TR_LANGS } = await load("lib/catalog-tr.mjs");
  const { visitorLang } = await load("server.mjs");
  const CYR = /[А-Яа-яЁё]/;
  for (const c of CATALOG) for (const l of TR_LANGS) {
    const tr = CATALOG_TR[c.key]?.[l];
    assert.ok(tr, `${c.key}: нет перевода ${l}`);
    for (const f of ["name", "inn", "form", "pack", "group", "doctors", "comp"].filter((k) => c[k])) {
      assert.ok(tr[f], `${c.key}.${f}: пусто на ${l}`);
      assert.doesNotMatch(tr[f], CYR, `${c.key}.${f}: кириллица на ${l}`);
      assert.doesNotMatch(tr[f], /—|–| - /, `${c.key}.${f}: тире на ${l}`);
    }
    if (l === "ar") assert.match(tr.name, /[\u0600-\u06FF]/, `${c.key}: имя не по-арабски`);
  }
  for (const [k, ls] of Object.entries(PACK_LANGS) as [string, string[]][]) {
    assert.ok(CATALOG.find((c: { key: string; img: number }) => c.key === k)?.img, `${k}: упаковка на языке без исходного фото`);
    for (const l of ls) for (const side of [480, 960]) assert.ok(existsSync(`public/protos/chechfarm/products/${k}-${l}-${side}.webp`), `${k}-${l}-${side}`);
  }
  assert.equal(visitorLang("en-US,en;q=0.9"), "en");
  assert.equal(visitorLang("ar-SA,ar;q=0.9,en;q=0.8"), "ar");
  assert.equal(visitorLang("uz-UZ,uz;q=0.9,ru;q=0.8"), "uz");
  assert.equal(visitorLang("ru-RU,ru;q=0.9,en;q=0.8"), "");
  assert.equal(visitorLang("de-DE,de;q=0.9"), "en", "язык, которого нет, — английский");
  assert.equal(visitorLang("*"), "");
  assert.equal(visitorLang("en-US", "Mozilla/5.0 (compatible; Googlebot/2.1)"), "", "робота не уводим");
  const a = await boot();
  try {
    const en = (await a.call("/en/products")).text, ar = (await a.call("/ar/products")).text, ru = (await a.call("/products")).text;
    assert.ok(en.includes("Levocarnitine") && en.includes("/protos/chechfarm/products/elstar-en-960.webp"), "английский портфель");
    assert.ok(ar.includes("إلستار") && ar.includes("/protos/chechfarm/products/elstar-ar-960.webp"), "арабский портфель");
    assert.ok(en.includes("cholesterol-960.webp"), "английская упаковка Холестерол Контрол — исходная");
    assert.ok(ru.includes("Левокарнитин") && ru.includes("elstar-960.webp") && !ru.includes("elstar-en-960"), "русский портфель");
    assert.ok(ar.includes("products/elstar-ar-480.webp"), "шапка витрины — упаковки на языке");
    /* Правка в панели главнее перевода. */
    await owner(a);
    const row = a.db.get("select id, data from products where json_extract(data, '$.key') = 'elstar'");
    await a.adminPost(`/products/${row.id}`, { ...JSON.parse(row.data), inn: "Левокарнитин 1 г" });
    assert.ok((await a.call("/en/products")).text.includes("Левокарнитин 1 г"), "правка панели пропала на английском");
    /* Первый заход — по браузеру, выбранный язык — по куке. */
    a.setCookie("");
    const go = await a.call("/products?utm=x", undefined, { "Accept-Language": "en-US,en;q=0.9" });
    assert.equal(go.status, 302);
    assert.equal(go.headers.get("location"), "/en/products?utm=x");
    a.setCookie("cf-lang=en");
    assert.equal((await a.call("/", undefined, { "Accept-Language": "en-US,en;q=0.9" })).status, 200, "выбор посетителя не держится");
    a.setCookie("");
    assert.equal((await a.call("/", undefined, { "Accept-Language": "ru-RU,ru;q=0.9" })).status, 200);
  } finally { await a.close(); }
});

test("czechfarm: комната инвестора — только по живой ссылке, открытия в журнале", async () => {
  const a = await boot();
  try {
    await owner(a);
    const pdf = "data:application/pdf;base64," + Buffer.from("%PDF-1.7\nтест").toString("base64");
    assert.equal((await a.adminPost("/ir/docs", { title: "Презентация", data: "data:image/png;base64," + Buffer.from("x").toString("base64"), name: "x.png" })).status, 400);
    const docs = (await a.adminPost("/ir/docs", { title: "Презентация", data: pdf, name: "deck.pdf" })).json.docs;
    const url = (await a.adminPost("/ir/links", { name: "Fund A", org: "Capital", lang: "en" })).json.url;
    const path = new URL(url).pathname;
    const room = await a.call(path);
    assert.equal(room.status, 200);
    assert.ok(room.text.includes("Investor room") && room.text.includes("Презентация"));
    assert.equal(room.headers.get("x-robots-tag"), "noindex, nofollow");
    const doc = await a.call(`${path}/doc/${docs[0].id}`);
    assert.equal(doc.headers.get("content-type"), "application/pdf");
    assert.ok(doc.text.startsWith("%PDF"));
    assert.equal((await a.call(`/uploads/${a.db.get("select file from ir_docs").file}`)).status, 404, "документ инвестора открыт без ссылки");
    const token = path.split("/")[2];
    assert.equal((await a.call(`/api/admin/ir/links/${token}`)).json.views.length, 2);
    await a.adminPost(`/ir/links/${token}/revoke`, {});
    assert.equal((await a.call(path)).status, 404);
    assert.equal((await a.call(`${path}/doc/${docs[0].id}`)).status, 404);
    /* Ключ сцены — только своей странице. */
    assert.equal((await a.call("/promo/scene", undefined, { "Sec-Fetch-Site": "cross-site" })).status, 404);
    assert.equal((await a.call("/promo/scene", undefined, { "Sec-Fetch-Site": "same-origin" })).status, 200);
  } finally { await a.close(); }
});

test("czechfarm: выкатка — сервер компании, наш сервер её не выкатывает", () => {
  const wf = readFileSync(new URL("../.github/workflows/czechfarm-app.yml", import.meta.url), "utf8");
  assert.match(wf, /CF_PROD=1 node scripts\/protos\/chechfarm\/gen\.mjs/);
  assert.match(wf, /vars\.CZECHFARM_DOMAIN != ''/);
  assert.ok(!/echo .*secrets\./.test(wf), "секрет печатается в публичный журнал");
  const ours = readFileSync(new URL("../.github/workflows/deploy-vps.yml", import.meta.url), "utf8");
  assert.ok(ours.includes('"scripts/protos/chechfarm/app/**"'), "наш сервер перезапускается от правок сайта компании");
  const remote = readFileSync(new URL("deploy/remote.sh", APP), "utf8");
  assert.ok(remote.includes("вернул прошлый образ"), "нет отката");
  assert.ok(!remote.includes("syanie"), "в выкатке CZECHFARM остался сайт клиники");
  writeFileSync(join(tmpdir(), "cf-remote.sh"), remote);
  execFileSync("bash", ["-n", join(tmpdir(), "cf-remote.sh")]);
});

const say = (a: any, chat: number, text: string, extra: Record<string, unknown> = {}) => a.tg({ message: { message_id: Math.floor(Math.random() * 1e6), date: 1, chat: { id: chat, type: "private" }, from: { first_name: "Гость " + chat, username: "u" + chat }, text, ...extra } });
const press = (a: any, chat: number, data: string) => a.tg({ callback_query: { id: "cb" + Math.random(), data, from: { first_name: "x" }, message: { message_id: 1, chat: { id: chat } } } });

test("czechfarm: подписчики бота и рассылки — из панели и с телефона владельца", async () => {
  const a = await boot();
  try {
    await owner(a);
    await a.adminPost("/connect/tg", { token: "123456:" + "A".repeat(35) });
    const code = new URL((await a.adminPost("/tg/link", {})).json.url).searchParams.get("start");
    await say(a, 500, "/start " + code);
    /* Клиенты пишут боту и выбирают, кто они. */
    await say(a, 901, "/start");
    assert.ok(a.net.calls.some((c) => c.body?.chat_id === "901" && c.body.reply_markup?.inline_keyboard?.[0]?.[0]?.callback_data === "kind:partner"), "бот не спросил, кто вы");
    await press(a, 901, "kind:partner");
    await say(a, 902, "/start"); await press(a, 902, "kind:client");
    await say(a, 666, "/start"); await press(a, 666, "kind:client");
    const aud = (await a.call("/api/admin/audience")).json;
    assert.deepEqual([aud.counts.all, aud.counts.partner, aud.counts.client], [3, 1, 2], "сотрудник посчитан подписчиком или сегменты неверны");
    /* Из панели: клиентам; заблокировавший бота отмечается. */
    a.net.calls.length = 0;
    assert.equal((await a.adminPost("/broadcasts", { text: "", seg: "client" })).status, 400);
    const id = (await a.adminPost("/broadcasts", { text: "Новый препарат в каталоге", seg: "client" })).json.id;
    await a.core.aud.bc.tick(100, null);
    const sent = a.net.calls.filter((c) => c.url.endsWith("/sendMessage") && c.body.text === "Новый препарат в каталоге").map((c) => c.body.chat_id).sort();
    assert.deepEqual(sent, ["666", "902"], "рассылка ушла не тем");
    const row = (await a.call("/api/admin/audience")).json.broadcasts.find((b: any) => b.id === id);
    assert.deepEqual([row.state, row.sent, row.blocked], ["done", 1, 1]);
    assert.equal((await a.call("/api/admin/audience")).json.counts.all, 2, "заблокировавший остался в подписчиках");
    /* С телефона владельца: /рассылка → текст → «Партнёрам». */
    await say(a, 500, "/рассылка");
    await say(a, 500, "Приглашаем партнёров на встречу");
    const ask = a.net.calls.filter((c) => c.body?.chat_id === "500").pop()!;
    assert.match(ask.body.text, /Кому отправить/);
    a.net.calls.length = 0;
    await press(a, 500, "bc:partner");
    await a.core.aud.bc.tick(100, null);
    assert.ok(a.net.calls.some((c) => c.body?.chat_id === "901" && c.body.text === "Приглашаем партнёров на встречу"));
    assert.ok(!a.net.calls.some((c) => c.body?.chat_id === "902" && c.body.text === "Приглашаем партнёров на встречу"), "партнёрская рассылка ушла клиенту");
    assert.equal((await a.call("/api/admin/audience")).json.broadcasts[0].via, "telegram");
    /* Менеджер рассылки не видит и не делает. */
    await a.adminPost("/users", { login: "manager1", name: "Менеджер", role: "manager", pass: "пароль-менеджера" });
    a.setCookie(""); await a.adminPost("/login", { login: "manager1", pass: "пароль-менеджера" });
    assert.equal((await a.call("/api/admin/audience")).status, 403);
    assert.equal((await a.adminPost("/broadcasts", { text: "x", seg: "all" })).status, 403);
  } finally { await a.close(); }
});

test("czechfarm: регистрация партнёров и клиентов, кабинет, привязка Telegram", async () => {
  const a = await boot();
  try {
    await owner(a);
    await a.adminPost("/connect/tg", { token: "123456:" + "A".repeat(35) });
    const ownerCookie = a.getCookie();
    const accPost = (path: string, body: unknown) => a.call("/api/acc/" + path, body);
    a.setCookie("");
    assert.equal((await a.call("/api/acc/me")).status, 401);
    assert.equal((await accPost("register", { kind: "partner", name: "Ravi", email: "ravi@pharma.in", pass: "long-password" })).status, 400, "партнёр без компании");
    assert.equal((await accPost("register", { kind: "client", name: "Apteka", email: "a@apteka.uz", pass: "short" })).status, 400);
    assert.equal((await accPost("register", { kind: "partner", name: "Ravi", org: "Pharma India", country: "India", email: "Ravi@Pharma.in", pass: "long-password" })).status, 200);
    let me = (await a.call("/api/acc/me")).json;
    assert.deepEqual([me.kind, me.status, me.email], ["partner", "pending", "ravi@pharma.in"]);
    assert.equal(me.leads.length, 1, "регистрация партнёра не стала обращением команде");
    /* Обращение из кабинета подписано кабинетом, статус виден там же. */
    await a.call("/api/lead", { kind: "partner", msg: "Хотим вывести препарат", accountId: 999 });
    me = (await a.call("/api/acc/me")).json;
    assert.equal(me.leads.length, 2);
    assert.equal(a.db.get("select count(*) n from leads where account_id = 999").n, 0, "чужой кабинет подставили из формы");
    assert.equal((await accPost("register", { kind: "client", name: "Ravi", email: "ravi@pharma.in", pass: "long-password" })).status, 400, "второй кабинет на ту же почту");
    /* Привязка Telegram: ссылка из кабинета → /start в боте. */
    const link = (await accPost("tg", {})).json.url;
    const code = new URL(link).searchParams.get("start")!;
    assert.match(code, /^acc/);
    await say(a, 777, "/start " + code);
    assert.equal(a.db.get("select tg_chat from accounts where email = 'ravi@pharma.in'").tg_chat, "777");
    assert.equal(a.db.get("select account_id from bot_users where chat = '777'").account_id, me.id);
    /* Панель: одобрить партнёра — ему строка в Telegram. */
    a.setCookie(ownerCookie);
    const accs = (await a.call("/api/admin/accounts")).json.accounts;
    assert.equal(accs[0].statusName, "На проверке");
    a.net.calls.length = 0;
    await a.adminPost(`/accounts/${accs[0].id}`, { status: "active" });
    assert.ok(a.net.calls.some((c) => c.body?.chat_id === "777" && /одобрен/.test(c.body.text)));
    /* Партнёр из кабинета — в сегменте «Партнёрам». */
    assert.equal((await a.call("/api/admin/audience")).json.counts.partner, 1);
    /* Блок — выход из кабинета. */
    await a.adminPost(`/accounts/${accs[0].id}`, { status: "blocked" });
    a.setCookie("");
    assert.equal((await accPost("login", { email: "ravi@pharma.in", pass: "long-password" })).status, 400);
    /* Вход без JSON (форма с чужого сайта) не принимается. */
    assert.equal((await a.call("/api/acc/login", { email: "a@apteka.uz", pass: "x" }, { "Content-Type": "text/plain" })).status, 415);
  } finally { await a.close(); }
});

test("czechfarm: безопасность — значки страницы не правятся, поля посетителя в панели текстом, кабинет не видит чужих обращений по почте", async () => {
  const a = await boot();
  try {
    await owner(a);
    const { hashOf } = await load("lib/site-text.mjs");
    const home0 = (await a.call("/")).text;
    const K = JSON.parse(/<script type="application\/json" id="cf-data">([\s\S]*?)<\/script>/.exec(home0)![1]);
    assert.ok(K.icPlay && K.icInfo, "значков нет в данных страницы");
    const data = (await a.call("/api/admin/pages?lang=ru&page=home")).json.blocks.find((b: any) => b.id === "data");
    assert.ok(!data.texts.some((t: any) => /[<>]/.test(t.def)), "разметка значков попала в редактор");
    /* Подделанный отпечаток значка и правка с «<» не попадают в страницу. */
    const txt = data.texts[0];
    await a.adminPost("/pages", { lang: "ru", page: "*", texts: { [hashOf(K.icPlay)]: { v: '<img src=x onerror="alert(1)">', def: K.icPlay }, [txt.h]: { v: 'Текст <img src=x onerror="alert(2)">', def: txt.def } } });
    const home = (await a.call("/")).text;
    const K2 = JSON.parse(/<script type="application\/json" id="cf-data">([\s\S]*?)<\/script>/.exec(home)![1]);
    assert.equal(K2.icPlay, K.icPlay, "значок подменили из панели");
    assert.ok(!JSON.stringify(K2).includes("<img"), "разметка из панели в данных страницы");
    /* Карточка обращения в панели: имя посетителя только текстом. */
    const app = readFileSync(new URL("app/admin/app.js", ROOT), "utf8");
    assert.ok(!app.includes("/^</.test(x[1])"), "панель вставляет поле, начинающееся с «<», как разметку");
    /* Обращение, отправленное до кабинета, по одной почте не открывается. */
    a.setCookie("");
    await a.call("/api/lead", { kind: "investor", name: "Victim", email: "victim@corp.uz", msg: "Конфиденциально" });
    assert.equal((await a.call("/api/acc/register", { kind: "client", name: "X", email: "VICTIM@corp.uz", pass: "long-password" })).status, 200);
    const me = (await a.call("/api/acc/me")).json;
    assert.ok(!JSON.stringify(me.leads).includes("Конфиденциально"), "чужое обращение открылось по почте");
  } finally { await a.close(); }
});

test("czechfarm: страницы сайта из панели — текст любого блока, скрытие блока, шапка на всех страницах", async () => {
  const a = await boot();
  try {
    await owner(a);
    const v = (await a.call("/api/admin/pages?lang=ru&page=home")).json;
    const ids = v.blocks.map((b: any) => b.id);
    for (const id of ["hero", "launch", "mission", "contact", "data"]) assert.ok(ids.includes(id), `нет блока ${id}`);
    const hero = v.blocks.find((b: any) => b.id === "hero");
    assert.ok(!hero.canHide, "первый экран можно скрыть");
    const cap = hero.texts.find((t: any) => t.def === "Организуем логистику");
    assert.ok(cap, "подписи сцены нет среди текстов");
    const data = v.blocks.find((b: any) => b.id === "data").texts[0];
    /* Правка экранируется, блок скрывается стилем, текст скрипта меняется в данных. */
    const saved = await a.adminPost("/pages", { lang: "ru", page: "home", texts: { [cap.h]: { v: "Везём <b>сами</b>", def: cap.def }, [data.h]: { v: "Подпись из панели", def: data.def } }, hide: ["compare", "hero"] });
    assert.equal(saved.status, 200);
    assert.equal(saved.json.blocks.find((b: any) => b.id === "hero").texts.find((t: any) => t.h === cap.h).val, "Везём <b>сами</b>");
    const home = (await a.call("/")).text;
    assert.ok(home.includes("Везём &lt;b&gt;сами&lt;/b&gt;") && !home.includes(">Организуем логистику<"), "правка не на сайте или не экранирована");
    assert.ok(home.includes("Подпись из панели") && home.includes('"live":{'), "текст скрипта не поменялся или сломались данные страницы");
    assert.match(home, /<style>#compare,a\[href\$="#compare"\]\{display:none!important\}<\/style>/, "блок не скрыт");
    assert.doesNotMatch(home, /#hero,a\[href/, "первый экран скрыт");
    assert.ok((await a.call("/uz/")).text.includes("Logistikani tashkil qilamiz"), "правка русской страницы попала на узбекскую");
    assert.ok(!(await a.call("/about")).text.includes("Везём"), "правка главной попала на другую страницу");
    /* Шапка и подвал — страница «*», на всех страницах языка. */
    const bar = (await a.call("/api/admin/pages?lang=en&page=*")).json.blocks[0];
    const item = bar.texts.find((t: any) => t.def === "Contacts");
    await a.adminPost("/pages", { lang: "en", page: "*", texts: { [item.h]: { v: "Get in touch", def: item.def } } });
    for (const p of ["/en/", "/en/about", "/en/investors"]) assert.ok((await a.call(p)).text.includes(">Get in touch<"), `${p}: шапка не поменялась`);
    assert.ok(!(await a.call("/contacts")).text.includes("Get in touch"));
    /* Пустое поле возвращает текст сборки; чужая страница и менеджер — отказ. */
    await a.adminPost("/pages", { lang: "ru", page: "home", texts: { [cap.h]: { v: "", def: cap.def } }, hide: [] });
    const back = (await a.call("/")).text;
    assert.ok(back.includes(">Организуем логистику<") && !back.includes("#compare,a"));
    assert.equal((await a.adminPost("/pages", { lang: "ru", page: "nope", texts: {} })).status, 400);
    /* Правка, исходный текст которой сменился в новой сборке, не применяется и видна как устаревшая. */
    a.db.run("insert into site_text(lang, page, h, v, def) values('ru', 'home', 'aaaaaaaaaaaa', 'Старая правка', 'Старый текст')");
    assert.deepEqual((await a.call("/api/admin/pages?lang=ru&page=home")).json.stale, [{ h: "aaaaaaaaaaaa", def: "Старый текст", val: "Старая правка", img: false }]);
    await a.adminPost("/users", { name: "Менеджер", login: "manager1", pass: "длинный-пароль", role: "manager" });
    await a.adminPost("/logout", {}); a.setCookie("");
    await a.adminPost("/login", { login: "manager1", pass: "длинный-пароль" });
    /* Страницы сайта открыты и менеджеру (владелец, 19.11.2026: «открыть всем»), бот — нет. */
    assert.equal((await a.call("/api/admin/pages?lang=ru&page=home")).status, 200);
    assert.equal((await a.adminPost("/pages", { lang: "ru", page: "home", texts: {} })).status, 200);
    assert.equal((await a.adminPost("/site/bot", { name: "Чужой бот" })).status, 403);
  } finally { await a.close(); }
});

test("czechfarm: страницы сайта из панели — замена картинки и порядок блоков", async () => {
  /* Владелец, 12.11.2026, на «замены картинок и перестановки блоков в панели нет»: «Делаем». */
  const a = await boot();
  try {
    await owner(a);
    const v = (await a.call("/api/admin/pages?lang=ru&page=partners")).json;
    const withImg = v.blocks.find((b: any) => b.images.length);
    assert.ok(withImg, "картинки страницы «Партнёрам» нет в панели");
    const im = withImg.images[0];
    assert.match(im.src, /^\/protos\/chechfarm\/globe-/);
    assert.ok(!(await a.call("/api/admin/pages?lang=ru&page=home")).json.blocks.some((b: any) => b.images.length), "кадры сцены предлагаются к замене");
    /* Чужой адрес картинкой не становится: только файл, загруженный через панель. */
    assert.equal((await a.adminPost("/pages", { lang: "ru", page: "partners", images: { [im.h]: { v: "https://evil.example/x.png", def: im.src } } })).status, 400);
    const png = "data:image/png;base64," + Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360606060000000050001a5f645400000000049454e44ae426082", "hex").toString("base64");
    const up = await a.adminPost("/upload", { data: png });
    assert.match(up.json.url, /^\/uploads\/[0-9a-f]{32}\.png$/);
    const saved = await a.adminPost("/pages", { lang: "ru", page: "partners", images: { [im.h]: { v: up.json.url, def: im.src } } });
    assert.equal(saved.json.blocks.find((b: any) => b.id === withImg.id).images[0].val, up.json.url);
    for (const path of ["/partners", "/uz/partners", "/ar/partners"]) {
      const html = (await a.call(path)).text;
      assert.ok(html.includes(`<img src="${up.json.url}"`) && !/<img[^>]*globe-/.test(html), `${path}: картинка не заменена`);
      assert.doesNotMatch(html, new RegExp(`<img src="${up.json.url}"[^>]*srcset=`), `${path}: остались размеры прежней картинки`);
    }
    await a.adminPost("/pages", { lang: "ru", page: "partners", images: { [im.h]: { v: "", def: im.src } } });
    assert.match((await a.call("/partners")).text, /<img[^>]*globe-2000\.webp/, "исходная картинка не вернулась");

    /* Порядок: первый экран на месте, остальные — как сказано, на всех языках. */
    const home = (await a.call("/api/admin/pages?lang=ru&page=home")).json;
    assert.ok(!home.blocks.find((b: any) => b.id === "hero").canMove && home.blocks.find((b: any) => b.id === "mission").canMove);
    const pos = (html: string, id: string) => html.indexOf(`id="${id}"`);
    const before = (await a.call("/")).text;
    assert.ok(pos(before, "launch") < pos(before, "mission") && pos(before, "mission") < pos(before, "contact"));
    const moved = await a.adminPost("/pages", { lang: "ru", page: "home", texts: {}, hide: [], order: ["hero", "mission", "contact", "нет-такого", "launch"] });
    assert.deepEqual(moved.json.blocks.filter((b: any) => b.canMove).slice(0, 3).map((b: any) => b.id), ["mission", "contact", "launch"]);
    for (const path of ["/", "/en/"]) {
      const html = (await a.call(path)).text;
      assert.ok(pos(html, "hero") < pos(html, "mission") && pos(html, "mission") < pos(html, "contact") && pos(html, "contact") < pos(html, "launch") && pos(html, "launch") < pos(html, "compare"), `${path}: порядок блоков не тот`);
      assert.equal(html.length, (path === "/" ? before : (await a.call("/en/")).text).length, `${path}: при перестановке потерялась разметка`);
      assert.equal((html.match(/<section\b/g) || []).length, (before.match(/<section\b/g) || []).length);
    }
    await a.adminPost("/pages", { lang: "ru", page: "home", texts: {}, hide: [], order: [] });
    assert.equal((await a.call("/")).text, before, "порядок сборки не вернулся");
  } finally { await a.close(); }
});

test("czechfarm: свои блоки страницы — текст, фото, кнопка, меню, на всех языках, двигаются и прячутся", async () => {
  /* Владелец, 19.11.2026: «такой же раздел управления сайтом как у стоматологии… полное управление сайтом внутри». */
  const a = await boot();
  try {
    await owner(a);
    const png = "data:image/png;base64," + Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360606060000000050001a5f645400000000049454e44ae426082", "hex").toString("base64");
    const up = (await a.adminPost("/upload", { data: png })).json.url;
    const before = (await a.call("/about")).text;
    /* Без заголовка, текста и фото — не сохраняется; чужая картинка не проходит. */
    assert.equal((await a.adminPost("/pages/custom", { lang: "ru", page: "about", blocks: [{ t: { ru: { sub: "Только подзаголовок" } } }] })).status, 400);
    const one = { t: { ru: { sub: "Новое", title: "Наша <лаборатория>", text: "Первый абзац.\n- Пункт один\n- Пункт два", btn: "Написать" }, en: { title: "Our lab" } }, photos: [{ src: up, cap: { ru: "Цех" } }, { src: "https://evil.example/x.png" }], layout: "grid", btn: true, dark: true, menu: true };
    const v = (await a.adminPost("/pages/custom", { lang: "ru", page: "about", blocks: [one] })).json;
    const cb = v.blocks.find((b: any) => b.custom);
    assert.ok(cb && /^cb-[0-9a-f]{6}$/.test(cb.id) && cb.canMove && cb.canHide && !cb.texts.length, "свой блок не в списке блоков");
    assert.equal(cb.custom.photos.length, 1, "чужая картинка прошла");
    const ru = (await a.call("/about")).text;
    assert.ok(ru.includes(`<section class="sec cfx grid dark" id="${cb.id}">`) && ru.includes("Наша &lt;лаборатория&gt;") && !ru.includes("<лаборатория>"), "блок не на странице или не экранирован");
    assert.ok(ru.includes("<li>Пункт один</li>") && ru.includes(`<img src="${up}"`) && ru.includes('href="/contacts#form"><span>Написать</span>'));
    assert.ok(ru.includes(`<a href="#${cb.id}">Наша &lt;лаборатория&gt;</a>`), "нет пункта меню");
    const en = (await a.call("/en/about")).text;
    assert.ok(en.includes("Our lab") && en.includes("Первый абзац.") && en.includes('href="/en/contacts#form"'), "английский: свой заголовок, остальное — русское");
    /* Двигается и прячется, как встроенные. */
    const first = v.blocks.find((b: any) => b.canMove && !b.custom).id;
    await a.adminPost("/pages", { lang: "ru", page: "about", hide: [], order: [cb.id, first] });
    const moved = (await a.call("/about")).text;
    assert.ok(moved.indexOf(`id="${cb.id}"`) < moved.indexOf(`id="${first}"`), "свой блок не поднялся");
    await a.adminPost("/pages", { lang: "ru", page: "about", hide: [cb.id] });
    assert.match((await a.call("/about")).text, new RegExp(`#${cb.id}[^{]*\\{display:none`));
    /* Менеджер тоже правит свои блоки; удаление возвращает страницу как была. */
    await a.adminPost("/users", { name: "Менеджер", login: "manager2", pass: "длинный-пароль", role: "manager" });
    await a.adminPost("/logout", {}); a.setCookie("");
    await a.adminPost("/login", { login: "manager2", pass: "длинный-пароль" });
    assert.equal((await a.adminPost("/pages/custom", { lang: "ru", page: "about", blocks: [] })).status, 200);
    await a.adminPost("/pages", { lang: "ru", page: "about", hide: [], order: [] });
    assert.equal((await a.call("/about")).text, before, "после удаления страница не та");
    assert.equal((await a.adminPost("/pages/custom", { lang: "ru", page: "about", blocks: Array.from({ length: 13 }, () => ({ t: { ru: { title: "x" } } })) })).status, 400);
  } finally { await a.close(); }
});

test("czechfarm: первый круг правок — стратегия компании, BHAG и KPI на четырёх языках, без фото колбы", () => {
  /* Владелец, 19.11.2026: «Помят убрать фото из этого раздела, оно не к месту», «Все + kpi», «разложи красиво по сайту где надо». */
  const dir = site();
  const page = (l: string, p: string) => readFileSync(join(dir, ...(l === "ru" ? [] : [l]), ...(p ? [p] : []), "index.html"), "utf8");
  for (const l of ["ru", "uz", "en", "ar"]) {
    const about = page(l, "about");
    assert.doesNotMatch(about, /flask-/, `${l}: фото колбы осталось на «О компании»`);
    for (const id of ["story", "philosophy", "assets", "engine", "bhag", "kpi"]) assert.ok(about.includes(`id="${id}"`), `${l}: нет блока ${id}`);
    assert.equal((about.match(/<tr class="mv/g) || []).length, 6, `${l}: в KPI не шесть строк`);
    assert.ok(about.includes("20 000") && about.includes("≥80%") && about.includes("2035"), `${l}: цифры KPI`);
    assert.ok(page(l, "investors").includes('id="bhag"') && page(l, "investors").includes('id="kpi"'), `${l}: нет цели и KPI у инвесторов`);
    assert.ok(page(l, "partners").includes('id="promise"') && /90/.test(page(l, "partners")), `${l}: нет обещания 90 дней`);
  }
  assert.ok(page("ru", "about").includes("Мы создаём бренды") && page("ru", "about").includes("С 2011 года мы развиваем"));
  assert.ok(page("ru", "").replace(/<[^>]+>/g, "").includes("Создавать успешные фармацевтические"), "миссия на главной прежняя");
  assert.ok(/[\u0600-\u06ff]{4}/.test(page("ar", "about")) && !page("ar", "about").includes("Our system"), "арабская страница не на арабском");
  assert.ok(page("ar", "about").includes('<bdi dir="ltr">20 000</bdi>'), "числа KPI в арабском не по порядку");
  for (const l of ["ru", "uz", "en"]) assert.doesNotMatch(page(l, "about").replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ""), /—/, `${l}: длинное тире в тексте`);
  /* Шапка в один ряд (владелец, 19.11.2026: «шапка ровная должна быть, текст ровный сделай, в один ряд»). */
  assert.ok(page("uz", "about").includes(".top .nav a,.top-acc,.top-cta{white-space:nowrap}"), "пункты шапки переносятся");
  /* Шапка на телефоне возвращается через 1 с (владелец, 20.11.2026: «Сделай появление меню через 1 секунду»). */
  assert.ok(page("ru", "about").includes("IDLE=1000") && !page("ru", "about").includes("IDLE=3000"), "шапка не через 1 секунду");
  /* Телевизор (владелец, 20.11.2026: «На телевизор когда вывожу сайт - адаптивности нет»): от 2200 px сайт увеличен целиком, как экран 1920. */
  assert.ok(page("ru", "about").includes("@media (min-width:3700px){:root{--tvz:2}}") && page("ru", "about").includes(".top,main>:not(.hs),.foot,.hs-cap"), "нет увеличения для телевизора");
  /* Макет не меняется: там прежняя колба и прежняя миссия. */
  const bundle = readFileSync(new URL("../../../content/proto-bundles/chechfarm.json", ROOT), "utf8");
  assert.ok(bundle.includes("flask-1200") && !bundle.includes("Brand Growth Engine"), "стратегия попала в макет");
});

test("czechfarm: оформление Telegram-бота — имя, описания, меню, приветствие с картинкой и кнопками", async () => {
  const a = await boot();
  try {
    await owner(a);
    /* До подключения оформление сохраняется, но в Telegram не уходит. */
    const early = (await a.adminPost("/site/bot", { name: "CZECHFARM бот", about: "Строка профиля", desc: "Текст до «Начать»", card: true })).json.bot;
    assert.deepEqual(early.bad, ["Бот ещё не подключён"]);
    assert.equal(a.net.calls.filter((c) => c.url.includes("api.telegram.org")).length, 0);
    await a.adminPost("/connect/tg", { token: "123456:" + "A".repeat(35) });
    const sent = (m: string) => a.net.calls.filter((c) => c.url.endsWith("/" + m));
    assert.equal(sent("setMyName")[0].body.name, "CZECHFARM бот");
    assert.equal(sent("setMyShortDescription")[0].body.short_description, "Строка профиля");
    assert.equal(sent("setMyDescription")[0].body.description, "Текст до «Начать»");
    assert.deepEqual(sent("setMyCommands")[0].body.commands.map((c: any) => c.command), ["start", "faq", "cabinet", "contacts", "site"]);
    assert.equal(sent("setChatMenuButton")[0].body.menu_button.type, "commands");
    const look = (await a.call("/api/admin/site")).json.bot;
    assert.ok(look.on && look.pushed && look.username === "czechfarm_bot");
    assert.equal((await a.adminPost("/site/bot", { name: "яя" })).status, 400, "имя из двух знаков");
    /* /start: картинка с приветствием и кнопки под строкой ввода. */
    a.net.calls.length = 0;
    const msg = (text: string, id = 900) => a.tg({ message: { message_id: 1, date: 1, chat: { id, type: "private" }, from: { first_name: "Гость" }, text } });
    await msg("/start");
    const hello = sent("sendPhoto")[0];
    assert.equal(hello.body.photo, "https://czechfarm.test/protos/chechfarm/bot/hello.jpg");
    assert.match(hello.body.caption, /CZECHFARM alliance/);
    assert.deepEqual(hello.body.reply_markup.keyboard.flat().map((k: any) => k.text), ["❓ Частые вопросы", "✍️ Написать нам", "👤 Кабинет", "🌐 Сайт"]);
    /* Кнопки и команды не становятся обращениями. */
    a.net.calls.length = 0;
    await msg("✍️ Написать нам"); await msg("👤 Кабинет"); await msg("/site"); await msg("/contacts"); await msg("❓ Частые вопросы");
    assert.equal(a.db.get("select count(*) n from leads").n, 0, "кнопка бота стала обращением");
    const texts = sent("sendMessage").map((c) => c.body);
    assert.match(texts[0].text, /одним сообщением/);
    assert.equal(texts[1].reply_markup.inline_keyboard[0][0].url, "https://czechfarm.test/account");
    assert.equal(texts[2].reply_markup.inline_keyboard[0][0].url, "https://czechfarm.test");
    assert.match(texts[3].text, /Контакты скоро появятся/);
    await a.adminPost("/site/contacts", { phone: "+998 00 000 00 00", email: "info@example.test" });
    a.net.calls.length = 0;
    await msg("/contacts");
    assert.match(sent("sendMessage")[0].body.text, /Телефон: \+998 00 000 00 00\nПочта: info@example\.test/);
    /* Картинку можно выключить: приветствие текстом, кнопки остаются. */
    await a.adminPost("/site/bot", { card: false });
    a.net.calls.length = 0;
    await msg("/start", 901);
    assert.equal(sent("sendPhoto").length, 0);
    assert.ok(sent("sendMessage")[0].body.reply_markup.keyboard);
    for (const f of ["hello.jpg", "avatar.jpg"]) assert.ok(existsSync(`public/protos/chechfarm/bot/${f}`), `нет ${f}`);
  } finally { await a.close(); }
});

test("czechfarm: перевод в панели — свой блок, новость и продукт сами на всех языках, правленое руками не трогается", async () => {
  /* Владелец, 19.11.2026: «если они делают блок на 1 языке, он сразу делался на всех языках»; «Бери наш ключ пока что, через 2 месяца убери его». */
  const calls: { from: string; to: string[]; items: Record<string, string> }[] = [];
  let on = true;
  const tr = async (from: string, to: string[], items: Record<string, string>) => {
    calls.push({ from, to, items });
    return Object.fromEntries(to.map((l) => [l, Object.fromEntries(Object.entries(items).map(([k, v]) => [k, `[${l}] ${v}`]))]));
  };
  const a = await boot({ tr, trOn: () => (on ? { on: true, until: "2027-01-19T00:00:00+05:00" } : { on: false, why: "expired" }) });
  try {
    await owner(a);
    const png = "data:image/png;base64," + Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360606060000000050001a5f645400000000049454e44ae426082", "hex").toString("base64");
    const up = (await a.adminPost("/upload", { data: png })).json.url;
    /* Свой блок по-русски — сразу на узбекском, английском, арабском, с подписью к фото. */
    let r = (await a.adminPost("/pages/custom", { lang: "ru", page: "about", blocks: [{ t: { ru: { title: "Лаборатория", text: "Мы проверяем каждую серию." } }, photos: [{ src: up, cap: { ru: "Цех" } }] }] })).json;
    assert.deepEqual(r.tr.langs.sort(), ["ar", "en", "uz"]);
    assert.equal(r.translate.on, true);
    let cb = r.blocks.find((b: any) => b.custom).custom;
    assert.equal(cb.t.uz.title, "[uz] Лаборатория");
    assert.equal(cb.photos[0].cap.ar, "[ar] Цех");
    assert.deepEqual(cb.auto, { uz: true, en: true, ar: true });
    assert.ok((await a.call("/uz/about")).text.includes("[uz] Мы проверяем каждую серию."), "перевод не на узбекской странице");
    /* Английский поправили руками — он свой, перевод его больше не трогает. */
    const fixed = { ...cb, t: { ...cb.t, en: { title: "Our laboratory", text: "We test every batch." } } };
    const n0 = calls.length;
    r = (await a.adminPost("/pages/custom", { lang: "en", page: "about", blocks: [fixed] })).json;
    assert.equal(calls.length, n0, "правка перевода руками ушла на перевод");
    cb = r.blocks.find((b: any) => b.custom).custom;
    assert.equal(cb.auto.en, false);
    /* Снова русский — переводятся только автоматические языки. */
    r = (await a.adminPost("/pages/custom", { lang: "ru", page: "about", blocks: [{ ...cb, t: { ...cb.t, ru: { title: "Лаборатория качества", text: "Мы проверяем каждую серию." } } }] })).json;
    assert.deepEqual(calls.at(-1)!.to.sort(), ["ar", "uz"]);
    cb = r.blocks.find((b: any) => b.custom).custom;
    assert.equal(cb.t.en.title, "Our laboratory");
    assert.equal(cb.t.uz.title, "[uz] Лаборатория качества");
    /* Новость по-русски — на всех языках, вкладка помнит, что это перевод. */
    const nw = (await a.adminPost("/news", { ru: { title: "Новый препарат", body: "Вышел в аптеках." } })).json;
    assert.deepEqual(nw.tr.langs.sort(), ["ar", "en", "uz"]);
    const item = nw.news.find((x: any) => x.id === nw.id);
    assert.equal(item.en.title, "[en] Новый препарат");
    assert.equal(item.auto.uz, true);
    /* Новый продукт — переводятся его поля; на сайте у посетителя свой язык. */
    const pr = (await a.adminPost("/products", { name: "Тестин", form: "Таблетки, 10 мг", area: "neuro" })).json;
    assert.deepEqual(pr.tr.langs.sort(), ["ar", "en", "uz"]);
    await a.adminPost(`/products/${pr.id}/pub`, {});
    const live = a.core.live("uz").prod.find((p: any) => p.name === "[uz] Тестин");
    assert.ok(live && live.form === "[uz] Таблетки, 10 мг" && !("tr" in live), "продукт на узбекском не переведён");
    /* У продукта портфеля нетронутые поля не переводятся: у них перевод уже есть. */
    const cat = pr.products.find((p: any) => p.key);
    const n1 = calls.length;
    await a.adminPost(`/products/${cat.id}`, { ...cat, about: "Новое описание." });
    assert.deepEqual(Object.keys(calls.at(-1)!.items), ["about"]);
    assert.ok(calls.length === n1 + 1);
    /* Срок вышел — сохраняется без перевода. */
    on = false;
    const n2 = calls.length;
    const off = (await a.adminPost("/news", { ru: { title: "Без перевода", body: "Текст." } })).json;
    assert.equal(calls.length, n2);
    assert.equal(off.tr, null);
    assert.equal(off.news.find((x: any) => x.id === off.id).uz.title, "");
  } finally { await a.close(); }
});

test("czechfarm: вход техподдержки DevUz — владелец по отпечатку, пароля в репозитории нет", async () => {
  const { openDb } = await load("lib/db.mjs");
  const { makeCore, SUPPORT_LOGIN } = await load("lib/core.mjs");
  const { hashPass } = await load("lib/crypt.mjs");
  const db = openDb(":memory:");
  const core = makeCore({ db, secret: "test-secret-0123456789" });
  assert.equal(core.users.support("не отпечаток"), false);
  const h1 = hashPass("pass-one-123456");
  assert.equal(core.users.support(h1), true);
  const u = db.get("select * from users where login = ?", SUPPORT_LOGIN);
  assert.equal(u.role, "owner");
  /* Компания всё равно заводит своего владельца кодом установки. */
  assert.equal(core.users.count(), 0);
  assert.ok(core.auth.login(SUPPORT_LOGIN, "pass-one-123456"));
  /* Новый отпечаток — новый пароль, сессии сброшены; отключение компанией не снимаем. */
  db.run("update users set disabled = 1 where id = ?", u.id);
  core.users.support(hashPass("pass-two-123456"));
  assert.ok(!core.auth.login(SUPPORT_LOGIN, "pass-two-123456"));
  db.run("update users set disabled = 0 where id = ?", u.id);
  assert.ok(core.auth.login(SUPPORT_LOGIN, "pass-two-123456"));
  assert.ok(!core.auth.login(SUPPORT_LOGIN, "pass-one-123456"));
  /* Выкатка: отпечаток — из хранилища devuz.studio по пропуску GitHub, в .env — только SUPPORT_HASH. */
  const wf = readFileSync(".github/workflows/czechfarm-app.yml", "utf8");
  assert.match(wf, /api\/czechfarm\/support/);
  assert.match(wf, /::add-mask::\$H/);
  assert.match(readFileSync(new URL("deploy/remote.sh", APP), "utf8"), /SUPPORT_HASH=/);
  assert.match(readFileSync(new URL("server.mjs", APP), "utf8"), /core\.users\.support\(env\.SUPPORT_HASH\)/);
  const route = readFileSync("app/api/czechfarm/support/route.ts", "utf8");
  assert.match(route, /verifyGithubOidc/);
  assert.doesNotMatch(route, /CZECHFARM_SUPPORT_PASS"\)/);
});

test("czechfarm: правка текста страницы на одном языке переводится на остальные, правленое руками — нет", async () => {
  /* Владелец DevUz, 23.11.2026: «когда меняли слово на одном языке, автоматически тянулось на всех. Хайку наш подключи на тот же срок». */
  const tr = async (from: string, to: string[], items: Record<string, string>) => Object.fromEntries(to.map((l) => [l, Object.fromEntries(Object.entries(items).map(([k, v]) => [k, `[${l}] ${v}`]))]));
  const a = await boot({ tr, trOn: () => ({ on: true, until: "2027-01-19T00:00:00+05:00" }) });
  try {
    await owner(a);
    const ru = (await a.call("/api/admin/pages?lang=ru&page=home")).json;
    const views = await Promise.all(["uz", "en", "ar"].map(async (l) => (await a.call(`/api/admin/pages?lang=${l}&page=home`)).json.blocks));
    /* Блок, где у всех языков столько же текстов: текст на том же месте. */
    const blk = ru.blocks.find((b: any) => b.texts.length && views.every((v: any[]) => v.find((x) => x.id === b.id)?.texts.length === b.texts.length));
    assert.ok(blk, "нет блока с одинаковым числом текстов");
    const t = blk.texts[0], uz = views[0].find((x: any) => x.id === blk.id);
    let r = (await a.adminPost("/pages", { lang: "ru", page: "home", texts: { [t.h]: { v: "Свяжитесь с нами", def: t.def } } })).json;
    assert.deepEqual(r.tr.langs.sort(), ["ar", "en", "uz"]);
    assert.ok((await a.call("/uz/")).text.includes("[uz] Свяжитесь с нами"), "перевод не на узбекской странице");
    /* Узбекский поправили руками — следующая русская правка его не трогает. */
    const uh = uz.texts[0].h;
    await a.adminPost("/pages", { lang: "uz", page: "home", texts: { [uh]: { v: "Biz bilan bog‘laning", def: uz.texts[0].def } } });
    r = (await a.adminPost("/pages", { lang: "ru", page: "home", texts: { [t.h]: { v: "Напишите нам", def: t.def } } })).json;
    assert.deepEqual(r.tr.langs.sort(), ["ar", "en"]);
    assert.ok((await a.call("/uz/")).text.includes("Biz bilan bog‘laning"));
    assert.ok((await a.call("/en/")).text.includes("[en] Напишите нам"));
    /* Вернули русский исходный — уходят и переводы с него, ручной узбекский остаётся. */
    await a.adminPost("/pages", { lang: "ru", page: "home", texts: { [t.h]: { v: "", def: t.def } } });
    assert.ok(!(await a.call("/en/")).text.includes("[en] Напишите нам"));
    assert.ok((await a.call("/uz/")).text.includes("Biz bilan bog‘laning"));
    /* Блок, где у языка другое число текстов: текст ищется по переводу исходной фразы. */
    const { matchText } = await load("server.mjs");
    const list = [{ h: "1", def: "Write to us" }, { h: "2", def: "Our office in Tashkent" }, { h: "3", def: "Working hours" }];
    assert.equal(matchText("Our office is in Tashkent", list).h, "2");
    assert.equal(matchText("Something else entirely", list), null, "не похоже — не подменяем");
  } finally { await a.close(); }
});

test("czechfarm: партнёры из таблицы — Excel и CSV, столбцы от Haiku или по заголовкам, в боте сами по /start", async () => {
  /* Владелец DevUz, 23.11.2026: «добавлять партнеров через загрузку таблицы… эти партнеры уже активируются к рассылке через бота когда нажмут /старт… статус: в боте или нет». */
  const { readSheet } = await load("lib/sheet.mjs");
  const csv = "ФИО;Компания;Телефон;Telegram\nАли Валиев;Pharma Line;+998 90 111-22-33;@ali_pharma\nБек;Med Plus;+998 91 222 33 44;\n;;;\n";
  const t = readSheet(Buffer.from(csv), "p.csv");
  assert.deepEqual(t.headers, ["ФИО", "Компания", "Телефон", "Telegram"]);
  assert.equal(t.rows.length, 2);
  assert.throws(() => readSheet(Buffer.from("d0cf11e0a1b11ae1", "hex"), "p.xls"), /xlsx или CSV/);
  /* Настоящий .xlsx: ZIP с общими строками и листом. */
  const { deflateRawSync } = await import("node:zlib");
  const files: [string, string][] = [
    ["xl/workbook.xml", '<workbook><sheets><sheet name="Лист1" sheetId="1" r:id="rId1"/></sheets></workbook>'],
    ["xl/_rels/workbook.xml.rels", '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'],
    ["xl/sharedStrings.xml", "<sst><si><t>Name</t></si><si><t>Company</t></si><si><t>Phone</t></si><si><t>Dana</t></si><si><t>Bio &amp; Co</t></si></sst>"],
    ["xl/worksheets/sheet1.xml", '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row><row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2" t="s"><v>4</v></c><c r="C2"><v>998935551122</v></c></row></sheetData></worksheet>'],
  ];
  const locals: Buffer[] = [], central: Buffer[] = []; let off = 0;
  for (const [name, body] of files) {
    const raw = Buffer.from(body), z = deflateRawSync(raw), nm = Buffer.from(name);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(8, 8); lh.writeUInt32LE(z.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nm.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(z.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(off, 42);
    locals.push(lh, nm, z); central.push(ch, nm); off += 30 + nm.length + z.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  const xlsx = Buffer.concat([...locals, cd, end]);
  assert.deepEqual(readSheet(xlsx, "p.xlsx"), { headers: ["Name", "Company", "Phone"], rows: [["Dana", "Bio & Co", "998935551122"]] });

  let asked = 0;
  const cols = async (headers: string[]) => { asked++; return headers[0] === "ФИО" ? { name: 0, org: 1, phone: 2, email: -1, country: -1, city: -1, tg: 3, note: -1 } : null; };
  const a = await boot({ cols });
  try {
    await owner(a);
    await a.adminPost("/connect/tg", { token: "123456:" + "A".repeat(35) });
    const data = "data:text/csv;base64," + Buffer.from(csv).toString("base64");
    let r = (await a.adminPost("/partners/read", { data, name: "p.csv" })).json;
    assert.equal(r.by, "ai"); assert.equal(r.map.tg, 3); assert.equal(asked, 1);
    r = (await a.adminPost("/partners/import", { rows: r.rows, map: r.map })).json;
    assert.equal(r.added, 2);
    assert.deepEqual(r.partners.map((p: any) => p.state), ["out", "out"]);
    /* Та же таблица ещё раз — повторов нет. */
    assert.equal((await a.adminPost("/partners/import", { rows: t.rows, map: { name: 0, org: 1, phone: 2, tg: 3 } })).json.dup, 2);
    /* Модель не ответила — столбцы по заголовкам. */
    const x = (await a.adminPost("/partners/read", { data: "data:;base64," + xlsx.toString("base64"), name: "p.xlsx" })).json;
    assert.equal(x.by, "headers"); assert.equal(x.map.name, 0); assert.equal(x.map.org, 1); assert.equal(x.map.phone, 2);
    /* Али нажал /start — нашёлся по нику, в сегменте «Партнёрам». */
    await a.tg({ message: { message_id: 1, date: 1, chat: { id: 701, type: "private" }, from: { id: 701, first_name: "Али", username: "Ali_Pharma" }, text: "/start" } });
    let list = (await a.call("/api/admin/partners")).json.partners;
    assert.equal(list.find((p: any) => p.org === "Pharma Line").state, "in");
    assert.deepEqual(a.core.aud.subs.recipients("partner"), ["701"]);
    /* Бек — номером, которым поделился кнопкой (свой, не чужой контакт). */
    await a.tg({ message: { message_id: 2, date: 1, chat: { id: 702, type: "private" }, from: { id: 702, first_name: "Бек" }, contact: { phone_number: "998912223344", user_id: 999 } } });
    assert.equal((await a.call("/api/admin/partners")).json.partners.find((p: any) => p.org === "Med Plus").state, "out", "чужой контакт засчитан");
    await a.tg({ message: { message_id: 3, date: 1, chat: { id: 702, type: "private" }, from: { id: 702, first_name: "Бек" }, contact: { phone_number: "+998912223344", user_id: 702 } } });
    list = (await a.call("/api/admin/partners")).json.partners;
    assert.equal(list.find((p: any) => p.org === "Med Plus").state, "in");
    assert.ok(list.every((p: any) => p.link.startsWith("https://t.me/czechfarm_bot?start=p")));
    /* Заблокировал бота — так и видно. */
    a.db.run("update bot_users set blocked_at = 1 where chat = '702'");
    assert.equal((await a.call("/api/admin/partners")).json.partners.find((p: any) => p.org === "Med Plus").state, "blocked");
  } finally { await a.close(); }
});

test("czechfarm: в комнату инвестора — любые документы, таблицы и презентации, не только PDF", async () => {
  const { docKind, DOC_KINDS } = await load("server.mjs");
  const zip = Buffer.from("504b030414000000", "hex"), ole = Buffer.from("d0cf11e0a1b11ae1", "hex");
  assert.equal(docKind(zip, "Презентация.pptx"), "pptx");
  assert.equal(docKind(zip, "KPI.xlsx"), "xlsx");
  assert.equal(docKind(ole, "old.doc"), "doc");
  assert.equal(docKind(Buffer.from("%PDF-1.7"), "a.pdf"), "pdf");
  assert.equal(docKind(Buffer.from("a;b\n1;2"), "t.csv"), "csv");
  assert.equal(docKind(zip, "evil.exe"), "", "ZIP с чужим расширением");
  assert.equal(docKind(Buffer.from("<html><script>x</script>"), "x.txt"), "", "HTML под видом текста");
  assert.equal(docKind(Buffer.from("MZ\x90\x00"), "a.docx"), "", "программа под видом Word");
  assert.ok(DOC_KINDS.includes("pptx"));
  const a = await boot();
  try {
    await owner(a);
    const data = "data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64," + Buffer.concat([zip, Buffer.alloc(100)]).toString("base64");
    const r = (await a.adminPost("/ir/docs", { title: "Презентация", data, name: "deck.pptx" })).json;
    assert.equal(r.docs[0].name, "deck.pptx");
  } finally { await a.close(); }
});
