import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, type Server } from "node:http";
import { test } from "node:test";

/**
 * Рабочий сайт «Сияния Севера» на сервере клиники (владелец, 30.10.2026):
 * сайт, админка и вебхуки — scripts/protos/syanie/app. Сеть (amoCRM, Telegram,
 * Wazzup) здесь подменена: проверяем, что заявка с сайта доходит до админки,
 * amoCRM и Telegram сотрудника, что сообщения из Instagram, Telegram и чата
 * сайта лежат в одном окне и ответ уходит обратно в тот же канал.
 */
const APP = new URL("../scripts/protos/syanie/app/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, APP), "utf8");
/* eslint-disable @typescript-eslint/no-explicit-any */
const load = async (f: string): Promise<any> => import(new URL(f, APP).href);

type Call = { url: string; body: any; method: string };

/* Подменённая сеть: Telegram, amoCRM и Wazzup отвечают как настоящие. */
function fakeNet() {
  const calls: Call[] = [];
  const ok = (j: unknown, status = 200) => new Response(JSON.stringify(j), { status, headers: { "Content-Type": "application/json" } });
  let msg = 100;
  const fetchImpl = async (url: string, init: any = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url, body, method: init.method || "GET" });
    if (url.includes("api.telegram.org")) {
      if (url.endsWith("/getMe")) return ok({ ok: true, result: { username: "syanie_bot" } });
      if (url.endsWith("/sendMessage")) return ok({ ok: true, result: { message_id: ++msg } });
      return ok({ ok: true, result: true });
    }
    if (url.includes("amocrm.ru")) {
      if (url.endsWith("/api/v4/account")) return ok({ name: "Сияние Севера" });
      if (url.endsWith("/api/v4/leads/pipelines")) return ok({ _embedded: { pipelines: [{ id: 7, name: "Воронка", is_main: true, _embedded: { statuses: [{ id: 1, name: "Неразобранное", type: 1 }, { id: 2, name: "Первичный контакт", type: 0 }, { id: 142, name: "Успешно", type: 0 }] } }] } });
      if (url.endsWith("/api/v4/leads/complex")) return ok([{ id: 5551 }]);
      return ok({});
    }
    if (url.includes("wazzup24.com")) {
      if (url.endsWith("/v3/channels")) return ok([{ channelId: "ch-ig", transport: "instagram", plainId: "syanie.tomsk", state: "active" }]);
      return ok({ ok: true });
    }
    throw new Error("неожиданный адрес " + url);
  };
  return { calls, fetchImpl };
}

async function boot(publicUrl = "https://syanie.test", opts: { live?: boolean } = {}) {
  const { openDb } = await load("lib/db.mjs");
  const { makeCore } = await load("lib/core.mjs");
  const { createApp } = await load("server.mjs");
  const net = fakeNet();
  const db = openDb(":memory:");
  /* live: сайт собирает gen.mjs макета с правками из админки, как на сервере клиники. */
  const renderer = opts.live ? await import(new URL("../gen.mjs", APP).href) : null;
  const uploadsDir = opts.live ? mkdtempSync(join(tmpdir(), "sy-up-")) : "";
  const core = makeCore({ db, secret: "test-secret-0123456789", publicUrl, fetchImpl: net.fetchImpl, renderer });
  const handle = createApp({ core, siteDir: new URL("site/", APP).pathname, adminDir: new URL("admin/", APP).pathname, uploadsDir, setupCode: "setup-42", publicUrl, commit: "abc" });
  const server: Server = createServer(handle);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  let cookie = "";
  async function call(path: string, body?: unknown, extra: Record<string, string> = {}) {
    const headers: Record<string, string> = { ...(cookie ? { Cookie: cookie } : {}), ...extra };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const r = await fetch(`http://127.0.0.1:${port}${path}`, { method: body === undefined ? "GET" : "POST", headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const set = r.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const text = await r.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* страница */ }
    return { status: r.status, json, text, headers: r.headers };
  }
  const adminPost = (path: string, body: unknown) => call("/api/admin" + path, body, { "X-SY": "1" });
  return { core, db, net, call, adminPost, close: () => new Promise((r) => server.close(r)), setCookie: (c: string) => (cookie = c), getCookie: () => cookie };
}

test("сияние на сервере клиники: ключи интеграций в базе зашифрованы, пароли — scrypt", async () => {
  const { sealer, hashPass, checkPass, sameSecret } = await load("lib/crypt.mjs");
  const box = sealer("secret-0123456789abc");
  const blob = box.seal("123456:ABCDEF");
  assert.match(blob, /^v1:/);
  assert.ok(!blob.includes("ABCDEF"));
  assert.equal(box.open(blob), "123456:ABCDEF");
  assert.throws(() => sealer("другой-ключ-0123456789").open(blob), "чужой APP_SECRET расшифровал ключ");
  assert.throws(() => sealer("short"), /APP_SECRET/);
  const h = hashPass("верный пароль");
  assert.ok(checkPass("верный пароль", h));
  assert.ok(!checkPass("неверный", h));
  assert.ok(!sameSecret("", ""), "пустой секрет пускает");
});

test("сияние на сервере клиники: разбор amoCRM, Telegram и Wazzup", async () => {
  const { amoBase, leadPayload } = await load("lib/amo.mjs");
  const { tgMessage } = await load("lib/tg.mjs");
  const { wzMessages } = await load("lib/wazzup.mjs");
  const { cleanPhone } = await load("lib/core.mjs");
  assert.equal(amoBase("siyanie"), "https://siyanie.amocrm.ru");
  assert.equal(amoBase("https://Siyanie.amocrm.ru/leads/pipeline"), "https://siyanie.amocrm.ru");
  assert.equal(amoBase("evil.com"), "", "токен ушёл бы на чужой адрес");
  const [lead] = leadPayload({ name: "Анна", phone: "+79001234567", what: "Консультация", src: "quiz" }, { pipeline: "7", status: "2" });
  assert.equal(lead.pipeline_id, 7);
  assert.equal(lead._embedded.contacts[0].custom_fields_values[0].values[0].value, "+79001234567");
  assert.equal(cleanPhone("8 (900) 123-45-67"), "+79001234567");
  assert.equal(cleanPhone("12"), "");
  const m = tgMessage({ message: { message_id: 5, date: 1, chat: { id: 77, type: "private" }, from: { first_name: "Ира" }, text: "/start staff-abc" } });
  assert.equal(m.start, "staff-abc");
  assert.equal(tgMessage({ message: { chat: { id: -1, type: "group" }, text: "x" } }), null, "группы не разбираем");
  const w = wzMessages({ messages: [{ messageId: "m1", channelId: "c", chatType: "instagram", chatId: "anna.t", text: "Сколько стоит?", isEcho: false }, { channelId: "c", chatType: "whatsapp", chatId: "79001234567", type: "image", contentUri: "https://x/y.jpg", isEcho: true }], statuses: [{}] });
  assert.equal(w.length, 2);
  assert.equal(w[0].kind, "instagram");
  assert.ok(w[1].out && w[1].text.startsWith("[фото]") && w[1].phone === "79001234567");
});

test("сияние на сервере клиники: первый вход по коду установки, админка без входа закрыта", async () => {
  const a = await boot();
  try {
    assert.equal((await a.call("/api/admin/state")).json.setup, true);
    assert.equal((await a.call("/api/admin/summary")).status, 401);
    assert.equal((await a.call("/api/admin/setup", { code: "setup-42", login: "glavvrach", name: "Евгений", pass: "длинный-пароль" })).status, 403, "POST без X-SY прошёл");
    assert.equal((await a.adminPost("/setup", { code: "не тот", login: "glavvrach", name: "Евгений", pass: "длинный-пароль" })).status, 403);
    const ok = await a.adminPost("/setup", { code: "setup-42", login: "glavvrach", name: "Евгений", pass: "длинный-пароль" });
    assert.equal(ok.status, 200);
    assert.match(a.getCookie(), /^sy_s=/);
    assert.equal((await a.adminPost("/setup", { code: "setup-42", login: "x2", name: "X", pass: "длинный-пароль" })).status, 400, "второй владелец по коду");
    assert.equal((await a.adminPost("/users", { login: "admin1", name: "Мария", role: "admin", pass: "пароль-марии" })).status, 200);
    const s = (await a.call("/api/admin/summary")).json;
    assert.equal(s.settings.amo.on, false);
    assert.ok(!JSON.stringify(s).includes("пароль"), "сводка отдаёт пароли");
    /* Администратор подключения не меняет; чужой Origin не проходит. */
    a.setCookie("");
    assert.equal((await a.adminPost("/login", { login: "admin1", pass: "пароль-марии" })).status, 200);
    assert.equal((await a.adminPost("/connect/tg", { token: "123456:" + "A".repeat(35) })).status, 403);
    assert.equal((await a.call("/api/admin/users", {}, { "X-SY": "1", Origin: "https://evil.example" })).status, 403);
    /* Смена пароля со старым неверным не заводит лишний вход. */
    const before = a.db.get("select count(*) n from sessions").n;
    assert.equal((await a.adminPost("/me/pass", { old: "не тот", pass: "новый-пароль-1" })).status, 400);
    assert.equal(a.db.get("select count(*) n from sessions").n, before);
    /* Перебор пароля упирается в потолок. */
    a.setCookie("");
    let last = 0;
    for (let i = 0; i < 12; i++) last = (await a.adminPost("/login", { login: "glavvrach", pass: "неверно" + i })).status;
    assert.equal(last, 429);
  } finally { await a.close(); }
});

test("сияние на сервере клиники: заявка с сайта — в админку, в amoCRM и сотруднику в Telegram, статус виден пациенту", async () => {
  const a = await boot();
  try {
    await a.adminPost("/setup", { code: "setup-42", login: "glavvrach", name: "Евгений", pass: "длинный-пароль" });
    /* amoCRM: поддомен и токен, воронка — первая рабочая стадия, не «Неразобранное». */
    const amo = await a.adminPost("/connect/amo", { domain: "siyanie", token: "amo-long-token" });
    assert.equal(amo.status, 200, amo.text);
    const set = (await a.call("/api/admin/settings")).json;
    assert.equal(set.amo.status, "2");
    assert.equal(set.amo.base, "https://siyanie.amocrm.ru");
    assert.ok(!JSON.stringify(set).includes("amo-long-token"), "токен amoCRM виден в админке");
    assert.ok(!a.db.get("select v from settings where k = 'amo.token'").v.includes("amo-long-token"), "токен в базе открытым текстом");
    /* Telegram: вебхук с секретом, сотрудник привязывает себя ссылкой. */
    assert.equal((await a.adminPost("/connect/tg", { token: "123456:" + "A".repeat(35) })).status, 200);
    const hook = a.net.calls.find((c) => c.url.endsWith("/setWebhook"))!;
    assert.equal(hook.body.url, "https://syanie.test/api/tg/hook");
    const link = (await a.adminPost("/tg/link", {})).json.url as string;
    const code = /start=(staff-\w+)/.exec(link)![1];
    const tgHook = (u: unknown, secret = hook.body.secret_token) => a.call("/api/tg/hook", u, { "X-Telegram-Bot-Api-Secret-Token": secret });
    assert.equal((await tgHook({ message: {} }, "wrong-secret")).status, 403);
    await tgHook({ message: { message_id: 1, date: 1, chat: { id: 900, type: "private" }, from: { first_name: "Евгений" }, text: "/start " + code } });
    assert.ok(a.db.get("select 1 from tg_staff where chat_id = '900'"), "сотрудник не привязался");

    /* Пациент оставляет заявку без телефона — нельзя; с телефоном — уходит. */
    assert.equal((await a.call("/api/lead", { src: "booking", name: "Анна" })).status, 400);
    const bot = await a.call("/api/lead", { src: "booking", name: "Бот", phone: "+79990000000", website: "http://spam" });
    assert.equal(bot.json.id, 0, "ловушка для ботов не сработала");
    const r = await a.call("/api/lead", { src: "booking", name: "Анна", phone: "8 900 123-45-67", what: "Бесплатная консультация All-on-6", wish: "завтра вечером" });
    assert.equal(r.status, 200);
    await new Promise((res) => setTimeout(res, 50));
    const leads = (await a.call("/api/admin/leads")).json.leads;
    assert.equal(leads.length, 1);
    assert.equal(leads[0].phone, "+79001234567");
    assert.equal(leads[0].amo_id, 5551, "заявка не ушла в amoCRM сама");
    const deal = a.net.calls.find((c) => c.url.endsWith("/leads/complex"))!;
    assert.equal(deal.body[0].status_id, 2);
    const note = a.net.calls.find((c) => c.url.endsWith("/sendMessage") && c.body.chat_id === "900" && /Новая заявка/.test(c.body.text));
    assert.ok(note, "сотрудник не получил заявку в Telegram");
    /* Статус из админки видит пациент — по ключу, без ключа нет. */
    await a.adminPost(`/leads/${r.json.id}`, { status: "confirmed" });
    assert.equal((await a.call(`/api/lead/${r.json.id}?k=${r.json.key}`)).json.status, "confirmed");
    assert.equal((await a.call(`/api/lead/${r.json.id}?k=чужой`)).status, 404);
  } finally { await a.close(); }
});

test("сияние на сервере клиники: Instagram, Telegram и чат сайта — в одном окне, ответ уходит в тот же канал", async () => {
  const a = await boot();
  try {
    await a.adminPost("/setup", { code: "setup-42", login: "glavvrach", name: "Евгений", pass: "длинный-пароль" });
    await a.adminPost("/connect/tg", { token: "123456:" + "A".repeat(35) });
    const secret = a.net.calls.find((c) => c.url.endsWith("/setWebhook"))!.body.secret_token;
    const wz = await a.adminPost("/connect/wz", { key: "wz-key-0123456789abcdef" });
    assert.equal(wz.json.channels[0].kind, "instagram");
    const wzHook = a.net.calls.find((c) => c.url.endsWith("/v3/webhooks"))!.body.webhooksUri as string;
    const path = new URL(wzHook).pathname;
    assert.equal((await a.call("/api/wazzup/wrong-secret", { messages: [] })).status, 403);

    await a.call(path, { messages: [{ messageId: "ig-1", channelId: "ch-ig", chatType: "instagram", chatId: "anna.t", text: "Здравствуйте, сколько стоит All-on-6?", contact: { name: "Анна" } }] });
    await a.call(path, { messages: [{ messageId: "ig-1", channelId: "ch-ig", chatType: "instagram", chatId: "anna.t", text: "повтор" }] });
    await a.call("/api/tg/hook", { message: { message_id: 3, date: Math.floor(Date.now() / 1000), chat: { id: 555, type: "private" }, from: { first_name: "Олег" }, text: "Можно на субботу?" } }, { "X-Telegram-Bot-Api-Secret-Token": secret });
    const sid = "visitor-key-0123456789";
    assert.equal((await a.call("/api/chat", { sid, text: "Есть рассрочка?" })).status, 200);

    const convs = (await a.call("/api/admin/inbox")).json.convs;
    assert.deepEqual(convs.map((c: any) => c.kind).sort(), ["instagram", "site", "tg"]);
    assert.equal((await a.call("/api/admin/summary")).json.waiting, 3);
    const ig = convs.find((c: any) => c.kind === "instagram");
    assert.equal((await a.call(`/api/admin/inbox/${ig.id}`)).json.msgs.length, 1, "повтор вебхука записался дважды");

    await a.adminPost(`/inbox/${ig.id}`, { text: "От 290 000 ₽, рассрочка 0%." });
    const sent = a.net.calls.find((c) => c.url.endsWith("/v3/message"))!;
    assert.deepEqual([sent.body.channelId, sent.body.chatType, sent.body.chatId], ["ch-ig", "instagram", "anna.t"]);
    const tgc = convs.find((c: any) => c.kind === "tg");
    await a.adminPost(`/inbox/${tgc.id}`, { text: "Да, в субботу с 9:00." });
    assert.ok(a.net.calls.some((c) => c.url.endsWith("/sendMessage") && c.body.chat_id === "555"), "ответ не ушёл в Telegram");
    const site = convs.find((c: any) => c.kind === "site");
    await a.adminPost(`/inbox/${site.id}`, { text: "Да, 0% без первого взноса." });
    const back = (await a.call(`/api/chat?sid=${sid}&after=0`)).json.msgs;
    assert.deepEqual(back.map((m: any) => m.dir), ["in", "out"]);
    assert.equal((await a.call(`/api/chat?sid=other-key-0123456789&after=0`)).json.msgs.length, 0, "чужой чат виден");
    /* Заявка из переписки: телефон не нужен, переписка привязана. */
    const lead = (await a.adminPost(`/inbox/${ig.id}/lead`, {})).json.lead;
    assert.equal(a.db.get("select conv_id from leads where id = ?", lead).conv_id, ig.id);
  } finally { await a.close(); }
});

test("сияние на сервере клиники: клиника сама правит цены, услуги, врачей, акции и тексты, сайт обновляется сразу", async () => {
  const a = await boot("https://syanie.test", { live: true });
  try {
    await a.adminPost("/setup", { code: "setup-42", login: "glavvrach", name: "Евгений", pass: "длинный-пароль" });
    await a.adminPost("/users", { login: "admin1", name: "Мария", role: "admin", pass: "пароль-марии" });
    const page = async () => (await a.call("/")).text;
    assert.match(await page(), /179 900/);
    assert.match(await page(), /data-svc="Консультация и КТ"/, "в записи нет выбора услуги");
    assert.doesNotMatch(await page(), /wa\.me|https:\/\/t\.me\//, "кнопки мессенджеров без номера");

    /* Администратор, не главный врач, правит содержимое: так в техзадании. */
    a.setCookie("");
    await a.adminPost("/login", { login: "admin1", pass: "пароль-марии" });
    const view = (await a.call("/api/admin/site")).json;
    assert.equal(view.defaults.prices[0].price, 179900);
    const prices = view.defaults.prices.map((p: any, i: number) => (i ? p : { ...p, price: 199900 }));
    assert.equal((await a.adminPost("/site/prices", { value: prices })).status, 200);
    assert.match(await page(), /199 900/);
    await a.adminPost("/site/services", { value: [{ t: "Чистка зубов", p: "от 4 500 ₽" }] });
    assert.match(await page(), /Чистка зубов<\/span><b>от 4 500 ₽/);
    assert.match(await page(), /data-svc="Чистка зубов"/, "услуги нет в записи");
    await a.adminPost("/site/texts", { value: { price: { h: "Цены на лечение" } } });
    assert.match(await page(), /Цены на лечение/);
    const faq = [{ q: "<script>alert(1)</script>", a: "Ответ & ещё" }];
    await a.adminPost("/site/faq", { value: faq });
    const html = await page();
    assert.ok(!html.includes("<script>alert(1)</script>") && html.includes("&lt;script&gt;alert(1)"), "правка не экранирована");
    const bad = await a.adminPost("/site/contacts", { value: { ...view.defaults.contacts, phone: "12" } });
    assert.equal(bad.status, 400);
    assert.match(bad.json.error, /Телефон/);
    await a.adminPost("/site/contacts", { value: { ...view.defaults.contacts, whatsapp: "+7 900 123-45-67" } });
    assert.match(await page(), /https:\/\/wa\.me\/79001234567/);
    assert.equal((await a.adminPost("/seo", { metrika: "98765432" })).status, 403, "Метрику меняет только главный врач");

    /* Фото врача: только картинка, имя — хеш, отдаётся сайтом. */
    const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const up = (await a.adminPost("/upload", { data: png })).json.url as string;
    assert.match(up, /^\/uploads\/[a-f0-9]{32}\.png$/);
    const img = await a.call(up);
    assert.equal(img.status, 200);
    assert.equal(img.headers.get("content-type"), "image/png");
    assert.equal((await a.adminPost("/upload", { data: "data:image/png;base64," + Buffer.from("<svg/>").toString("base64") })).status, 400);
    const doctors = view.defaults.doctors.map((d: any, i: number) => (i ? d : { ...d, img: up }));
    await a.adminPost("/site/doctors", { value: doctors });
    assert.ok((await page()).includes(`src="${up}"`), "фото врача не на сайте");

    /* Вернуть как было; журнал помнит, кто правил. */
    await a.adminPost("/site/prices/reset", {});
    assert.match(await page(), /179 900/);
    assert.ok(a.db.all("select t from log").some((r: any) => /Изменил на сайте: «Цены All-on-6»/.test(r.t)));

    /* Главный врач: Метрика, Вебмастер, Telegram-бот клиники. */
    a.setCookie("");
    await a.adminPost("/login", { login: "glavvrach", pass: "длинный-пароль" });
    assert.equal((await a.adminPost("/seo", { metrika: "abc" })).status, 400);
    await a.adminPost("/seo", { metrika: "98765432", yandex: "a1b2c3d4e5", google: "G-code_123" });
    const seo = await page();
    assert.match(seo, /mc\.yandex\.ru\/metrika\/tag\.js/);
    assert.match(seo, /ym\(98765432,"init"/);
    assert.match(seo, /<meta name="yandex-verification" content="a1b2c3d4e5">/);
    assert.match(seo, /<meta name="google-site-verification" content="G-code_123">/);
    assert.match((await a.call("/privacy")).text, /Яндекс Метрика/, "политика молчит о Метрике");
    await a.adminPost("/connect/tg", { token: "123456:" + "A".repeat(35) });
    assert.match(await page(), /https:\/\/t\.me\/syanie_bot/, "кнопка Telegram не ведёт на бота клиники");
  } finally { await a.close(); }
});

test("сияние на сервере клиники: рабочий сайт без частей макета, запись и квиз с телефоном", () => {
  execFileSync(process.execPath, [new URL("../gen.mjs", APP).pathname], { env: { ...process.env, SY_PROD: "1" }, stdio: "pipe" });
  const html = read("site/index.html");
  for (const bad of ["dz-intro", "mockup-terms", "__PROTO_BASE__", "noindex", "DevUz", "Предложение", "Разбор", "Условия использования макета", "sy-demo"]) assert.ok(!html.includes(bad), `на рабочем сайте «${bad}»`);
  assert.match(html, /"live":true/);
  assert.match(html, /id="bk-phone"[^>]*type="tel"|type="tel"[^>]*id="bk-phone"/);
  assert.match(html, /id="qz-phone"/);
  assert.match(html, /name="website"[^>]*class="lv-hp"/, "нет ловушки для ботов");
  assert.match(html, /href="\/privacy"/);
  assert.match(html, /<link rel="canonical" href="__SITE_URL__\/">/);
  assert.match(html, /\/api\/lead/);
  assert.match(html, /\/api\/chat/);
  assert.ok(!/[—–]| - |&mdash;/.test(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "")), "длинное тире на рабочем сайте");
  assert.ok(existsSync(new URL("site/privacy.html", APP)));
  /* Макет остаётся макетом: видео DevUz и условия на месте. */
  const bundle = JSON.parse(readFileSync(new URL("../../../../content/proto-bundles/syanie.json", APP), "utf8"));
  assert.match(bundle.pages[""], /mockup-terms/);
});

test("сияние на сервере клиники: образ из GitHub, сервер только скачивает, ключи не в журнале", () => {
  const wf = readFileSync(new URL("../../../../.github/workflows/syanie-app.yml", APP), "utf8");
  const remote = read("deploy/remote.sh");
  assert.match(wf, /docker\/build-push-action/);
  assert.match(wf, /SY_PROD=1 node scripts\/protos\/syanie\/gen\.mjs/);
  assert.match(wf, /vars\.SYANIE_DOMAIN != ''/, "выкатка без домена");
  assert.doesNotMatch(remote, /docker build|npm (ci|install)|node gen/, "сборка на сервере клиники");
  assert.match(remote, /-p 127\.0\.0\.1:3000:3000/, "сайт слушает не только локальный адрес");
  assert.match(remote, /--memory 512m/);
  assert.match(remote, /вернул прошлый образ/, "нет отката");
  assert.doesNotMatch(remote, /cat "\$D\/\.env"|echo "\$CODE"|say .*\$CODE|say .*SY_SETUP\}/, "код установки попадает в журнал");
  assert.match(read("Dockerfile"), /USER node/);
  assert.match(read("deploy/Caddyfile"), /reverse_proxy syanie-app:3000/);
  execFileSync("bash", ["-n", new URL("deploy/remote.sh", APP).pathname]);
});
