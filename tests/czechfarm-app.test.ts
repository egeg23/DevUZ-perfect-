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
      if (url.endsWith("/sendMessage")) return ok({ ok: true, result: { message_id: ++msg } });
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

async function boot() {
  const { openDb } = await load("lib/db.mjs");
  const { makeCore } = await load("lib/core.mjs");
  const { createApp } = await load("server.mjs");
  const net = fakeNet();
  const db = openDb(":memory:");
  const publicUrl = "https://czechfarm.test";
  const core = makeCore({ db, secret: "test-secret-0123456789", publicUrl, fetchImpl: net.fetchImpl });
  const dataDir = mkdtempSync(join(tmpdir(), "cf-data-"));
  const handle = createApp({ core, siteDir: site(), adminDir: new URL("admin/", APP).pathname, dataDir, setupCode: "setup-42", publicUrl, commit: "abc", sceneKey: "ab".repeat(32) });
  const server: Server = createServer(handle);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  let cookie = "";
  async function call(path: string, body?: unknown, extra: Record<string, string> = {}) {
    const headers: Record<string, string> = { ...(cookie ? { Cookie: cookie } : {}), ...extra };
    if (body !== undefined) headers["Content-Type"] = "application/json";
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
  for (const lang of ["", "uz/", "en/", "ar/"]) for (const p of ["", "about/", "products/", "partners/", "investors/", "news/", "contacts/", "privacy/"]) {
    const f = dir + lang + p + "index.html";
    assert.ok(existsSync(f), "нет страницы " + lang + p);
    const html = readFileSync(f, "utf8");
    assert.ok(!/__PROTO_BASE__|mockup-terms|dz-intro|демо-панел|Это макет|DevUz/i.test(html), "след макета на " + lang + p);
    assert.ok(html.includes('"live":null') && html.includes("__SITE_URL__"), "серверу нечего подставлять на " + lang + p);
    assert.ok(html.includes('content="index, follow"'), "боевой сайт закрыт от поиска");
    assert.ok(!html.includes("id=\"kit\""), "блок цены макета на боевом сайте");
  }
  const ar = readFileSync(dir + "ar/index.html", "utf8");
  assert.match(ar, /<html lang="ar" dir="rtl">/);
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
    assert.equal((await a.call("/sitemap.xml")).text.match(/<loc>/g)!.length, 32);
    assert.equal((await a.call("/about/")).status, 301);
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
