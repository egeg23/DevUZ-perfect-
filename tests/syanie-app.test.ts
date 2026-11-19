import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
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
    /* Яндекс и сеть IndexNow принимают адрес ответом 202. */
    if (url.endsWith("/indexnow")) return new Response("", { status: 202 });
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
  return { core, db, net, call, adminPost, base: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)), setCookie: (c: string) => (cookie = c), getCookie: () => cookie };
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
    /* 152-ФЗ: без отмеченного согласия на обработку данных заявку не принимаем. */
    const noOk = await a.call("/api/lead", { src: "booking", name: "Анна", phone: "8 900 123-45-67" });
    assert.equal(noOk.status, 400);
    assert.match(noOk.json.error, /согласие на обработку персональных данных/);
    const r = await a.call("/api/lead", { src: "booking", name: "Анна", phone: "8 900 123-45-67", what: "Бесплатная консультация All-on-6", wish: "завтра вечером", consent: true, pdv: "2026-11-16" });
    assert.equal(r.status, 200);
    await new Promise((res) => setTimeout(res, 50));
    const leads = (await a.call("/api/admin/leads")).json.leads;
    assert.equal(leads.length, 1);
    assert.equal(leads[0].phone, "+79001234567");
    assert.ok(leads[0].consent_at > 0 && leads[0].consent_v === "2026-11-16", "не записано, когда и на какую редакцию дано согласие");
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
    assert.equal((await a.call("/api/chat", { sid, text: "Есть рассрочка?" })).status, 400, "чат без согласия на обработку данных");
    assert.equal((await a.call("/api/chat", { sid, text: "Есть рассрочка?", consent: true })).status, 200);
    assert.ok(a.db.get("select consent_at from convs where channel = 'site'").consent_at > 0, "не записано, когда дано согласие в чате");

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
    assert.equal(view.defaults.services.length > 30, true, "прейскурант по умолчанию пуст");
    assert.equal((await a.adminPost("/site/services", { value: [{ cat: "professionalnaya-gigiena", t: "Чистка зубов", d: "Ультразвук и Air Flow", p: "от 4 500 ₽" }] })).status, 200);
    assert.match((await a.call("/ceny")).text, /<th scope="row">Чистка зубов<small>Ультразвук и Air Flow<\/small><\/th><td>от 4 500 ₽<\/td>/);
    assert.match((await a.call("/professionalnaya-gigiena")).text, /<h3>Чистка зубов<\/h3><p>Ультразвук и Air Flow<\/p><b>от 4 500 ₽<\/b>/);
    assert.match(await page(), /data-svc="Гигиена"/, "раздела нет в записи");
    assert.match((await a.adminPost("/site/services", { value: [{ cat: "khirurgiya", t: "", p: "1 ₽" }] })).json.error, /Услуга/);
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
    assert.match(seo, /"metrika":"98765432"/, "номер счётчика не дошёл до окна о cookie");
    assert.doesNotMatch(seo, /ym\(98765432,"init"|mc\.yandex\.ru\/watch/, "Метрика включается до согласия на cookie");
    assert.match(seo, /data-cookies>Настройки cookie/);
    assert.match(seo, /<meta name="yandex-verification" content="a1b2c3d4e5">/);
    assert.match(seo, /<meta name="google-site-verification" content="G-code_123">/);
    assert.match((await a.call("/privacy")).text, /Яндекс Метрика/, "политика молчит о Метрике");
    await a.adminPost("/connect/tg", { token: "123456:" + "A".repeat(35) });
    assert.match(await page(), /https:\/\/t\.me\/syanie_bot/, "кнопка Telegram не ведёт на бота клиники");
  } finally { await a.close(); }
});

test("сияние на сервере клиники: блоки страницы — спрятать, переставить, свой блок с текстом и фото, фото клиники", async () => {
  const a = await boot("https://syanie.test", { live: true });
  try {
    await a.adminPost("/setup", { code: "setup-42", login: "glavvrach", name: "Евгений", pass: "длинный-пароль" });
    const page = async () => (await a.call("/")).text;
    const view = (await a.call("/api/admin/site")).json;
    assert.deepEqual(view.defaults.blocks.map((b: any) => b.id), ["vs", "price", "uslugi", "quiz", "docs", "trust", "perks", "reviews", "rooms", "faq", "contacts"]);
    assert.equal(view.blocks.quiz, "Расчёт за минуту");
    assert.equal(view.groups[0].key, "blocks", "«Блоки страницы» не первыми в разделе «Сайт»");
    const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const up = (await a.adminPost("/upload", { data: png })).json.url as string;

    /* Квиз и вопросы спрятаны, свой блок — третьим; «Клиники» в списке нет — встаёт на своё место сама. */
    const mine = { id: "cnew1234", on: true, kick: "Новое", h: "Детская <b>стоматология</b>", text: "Первый абзац\n- пункт один\n- пункт два\nВторой абзац", layout: "side", menu: "Дети", book: true, dark: false, photos: [{ img: up, alt: "Кабинет для детей" }] };
    const blocks = view.defaults.blocks.filter((b: any) => b.id !== "rooms").map((b: any) => (b.id === "quiz" || b.id === "faq" ? { ...b, on: false } : b));
    blocks.splice(2, 0, mine);
    const saved = await a.adminPost("/site/blocks", { value: blocks });
    assert.equal(saved.status, 200, saved.json?.error);
    const html = await page();
    assert.ok(!html.includes('id="kviz"') && !html.includes('id="voprosy"'), "спрятанный блок на странице");
    const at = ["all-on-6", "ceny", "b-cnew1234", "uslugi-kliniki", "vrachi", "garantii", "privilegii", "otzyvy", "klinika", "kontakty"].map((id) => html.indexOf(`id="${id}"`));
    assert.ok(at.every((x, i) => x > 0 && (i === 0 || x > at[i - 1])), "порядок блоков: " + at.join(","));
    assert.match(html, /<h2>Детская &lt;b&gt;стоматология&lt;\/b&gt;<\/h2>/, "свой блок не экранирован");
    assert.match(html, /<p>Первый абзац<\/p><ul><li>пункт один<\/li><li>пункт два<\/li><\/ul><p>Второй абзац<\/p>/);
    assert.ok(html.includes(`src="${up}" alt="Кабинет для детей"`), "фото своего блока");
    assert.match(html, /id="b-cnew1234"[^]*?data-book[^]*?<\/section>/, "кнопки записи в своём блоке нет");
    /* Меню и разметка идут за блоками. */
    assert.match(html, /<a href="\/#b-cnew1234">Дети<\/a>/);
    assert.doesNotMatch(html, /href="\/?#voprosy"/, "спрятанный блок в меню и подвале");
    assert.doesNotMatch(html, /"FAQPage"/, "разметка вопросов при спрятанном блоке");
    assert.match((await a.call("/sitemap.xml")).text, new RegExp(up.replace(/[.]/g, "\\.")), "фото своего блока не в карте сайта");
    const again = (await a.call("/api/admin/site")).json.edits.blocks;
    assert.equal(again.length, 12, "сохранённый список без «Клиники»");
    assert.equal(again.find((b: any) => b.id === "cnew1234").photos[0].alt, "Кабинет для детей");

    /* Ошибки — словами, ничего не ломается. */
    const err = async (value: unknown) => (await a.adminPost("/site/blocks", { value })).json.error as string;
    assert.match(await err([{ id: "hack", on: true }]), /Неизвестный блок/);
    assert.match(await err([{ id: "vs" }, { id: "vs" }]), /дважды/);
    assert.match(await err([{ ...mine, h: "" }]), /Заголовок/);
    assert.match(await err([{ ...mine, photos: [{ img: "https://evil.example/x.png", alt: "" }] }]), /загрузите фото заново/);
    assert.match(await err([{ ...mine, photos: [{ img: "p-rec", alt: "" }] }]), /загрузите фото заново/);
    assert.match(await err(Array.from({ length: 13 }, (_, i) => ({ ...mine, id: "cbulk" + String(i).padStart(3, "0") }))), /не больше 12/);
    assert.match(await page(), /id="b-cnew1234"/, "неудачная правка сломала прежнюю");

    /* Фото клиники: свои вместо мозаики, пустой список — нельзя. */
    assert.equal((await a.adminPost("/site/rooms", { value: [{ img: up, alt: "Ресепшен" }] })).status, 200);
    assert.match(await page(), new RegExp(`class="rm-grid rm-free"><figure class="rm rv"[^>]*><img src="${up.replace(/[.]/g, "\\.")}" alt="Ресепшен"`));
    assert.match((await a.adminPost("/site/rooms", { value: [] })).json.error, /хотя бы одно фото/);

    /* «Вернуть как было» — прежний порядок, вопросы и их разметка на месте. */
    await a.adminPost("/site/blocks/reset", {});
    const back = await page();
    assert.ok(back.includes('id="kviz"') && back.includes('"FAQPage"') && !back.includes("b-cnew1234"));
  } finally { await a.close(); }
});

test("сияние на сервере клиники: правка в админке — дата в карте сайта сразу, Яндексу и IndexNow один сигнал", async () => {
  const a = await boot("https://syanie.test", { live: true });
  try {
    await a.adminPost("/setup", { code: "setup-42", login: "glavvrach", name: "Евгений", pass: "длинный-пароль" });
    await a.call("/sitemap.xml");
    const before = Date.now();
    const saved = await a.adminPost("/site/texts", { value: { price: { h: "Цены на лечение" } } });
    assert.equal(saved.status, 200);
    /* Дата правки в карте сайта — сразу, а не когда поисковик за ней придёт. */
    const at = Number(String(a.core.getS("site.mod.index.html")).split("|")[1]);
    assert.ok(at >= before, "дата правки не встала в карту сайта сразу");
    assert.equal(saved.json.index.mod, at);
    assert.equal(saved.json.index.pending, true, "сигнал поисковикам не поставлен в очередь");
    assert.match((await a.call("/sitemap.xml")).text, new RegExp(`<loc>https://syanie\\.test/</loc><lastmod>${new Date(at).toISOString().slice(0, 10)}</lastmod>`));
    assert.equal(a.net.calls.filter((c) => c.url.endsWith("/indexnow")).length, 0, "сигнал ушёл до паузы");

    /* Ещё правка подряд — сигнал всё равно один: главная и «Цены», где этот раздел есть; врачей правка не задела. */
    assert.ok(!String(a.core.getS("site.mod.vrachi.html")).endsWith(`|${at}`), "дата сдвинулась у страницы без правки");
    await a.adminPost("/site/texts", { value: { price: { h: "Цены" } } });
    const out = await a.core.seoPing.flush();
    const pings = a.net.calls.filter((c) => c.url.endsWith("/indexnow"));
    assert.deepEqual(pings.map((c) => c.url), ["https://yandex.com/indexnow", "https://api.indexnow.org/indexnow"]);
    const key = a.core.seoPing.key();
    assert.match(key, /^[a-f0-9]{32}$/);
    assert.deepEqual(pings[0].body, { host: "syanie.test", key, keyLocation: `https://syanie.test/${key}.txt`, urlList: ["https://syanie.test/", "https://syanie.test/ceny"] });
    assert.ok(out.res.every((r: any) => r.ok && r.text === "принял"));
    assert.equal(await a.core.seoPing.flush(), null, "второй сигнал без новой правки");

    /* Ключ поисковик находит на сайте; чужой ключ — нет. */
    const kf = await a.call(`/${key}.txt`);
    assert.equal(kf.status, 200);
    assert.equal(kf.text, key);
    assert.notEqual((await a.call(`/${"0".repeat(32)}.txt`)).status, 200);

    /* Админка и журнал показывают, что ответили поисковики. */
    const view = (await a.call("/api/admin/site")).json;
    assert.equal(view.index.pending, false);
    assert.equal(view.index.ping.res[0].name, "Яндекс");
    assert.ok(a.db.all("select t from log").some((r: any) => /Сообщили поисковикам об изменениях на сайте: Яндекс — принял/.test(r.t)));
    assert.match(read("admin/app.js"), /function seoLine\(\)/);
  } finally { await a.close(); }
});

test("сияние на сервере клиники: старые страницы их сайта ведут на блоки новой, товары взломанного магазина — 410", async () => {
  /* Владелец, 14.11.2026: клиника дала добро на перенос на siyaniye-severa.com.
     Там был их WordPress: многостраничный и взломанный (роботам и не из России
     отдавал итальянский магазин). Страницы клиники — 301 на блок страницы. */
  const { oldPage, hackedPage } = await load("lib/old-urls.mjs");
  const cases: Array<[string, string | null]> = [
    ["/implantatsiya-all-on-4/", "/"],
    ["/implantatsiya-all-on-6/", "/"],
    ["/implantatsiya-zubov/", "/implantatsiya-zubov"],
    ["/implantatsiya-nobel-biocare/", "/implantatsiya-zubov"],
    ["/uslugi/implantatsiya-zubov/pri-polnom-otsutstvii", "/implantatsiya-zubov"],
    ["/sinus-lifting/", "/khirurgiya"],
    ["/udalenie-zuba-mudrosti/", "/khirurgiya"],
    ["/lechenie-kisty-zuba/", "/khirurgiya"],
    ["/udalenie-zubnogo-kamnya/", "/professionalnaya-gigiena"],
    ["/chistka-zubov-air-flow/", "/professionalnaya-gigiena"],
    ["/akcii", "/akcii"],
    ["/akcii/tsirkoniyevaya-koronka-pod-klyuch", "/akcii"],
    ["/otzyvy", "/otzyvy"],
    ["/o-klinike", "/o-klinike"],
    ["/uslugi", "/uslugi"],
    ["/lechenie-zubov", "/lechenie-zubov"],
    ["/lechenie-kariesa/", "/lechenie-zubov"],
    ["/restavratsiya-zubov/", "/lechenie-zubov"],
    ["/restavratsiya-zubov-kompozitom/", "/esteticheskaya-stomatologiya"],
    ["/ustanovka-vinirov/", "/esteticheskaya-stomatologiya"],
    ["/koronki-e-max/", "/protezirovanie-zubov"],
    ["/keramicheskie-nakladki/", "/protezirovanie-zubov"],
    ["/protezirovanie-na-implantakh/", "/protezirovanie-zubov"],
    ["/kompyuternaya-tomografiya-kt/", "/diagnostika-zubov"],
    /* Прежний сайт на Tilda (syanie-sewera.ru), его карта сайта 15.11.2026. */
    ["/all-on-4", "/"],
    ["/all-on-4/spasibo", "/"],
    ["/conf", "/privacy"],
    ["/spasibo", "/"],
    ["/Cuscino-Allattamento-Grigio-1111253", null],
    ["/beauty-uomo/", null],
    ["/premium-uomo-home/", null],
    ["/wp-login.php", null],
    ["/", null],
  ];
  for (const [path, to] of cases) assert.equal(oldPage(path), to, path);
  /* Товары магазина (номер в конце) — 410, страницы клиники и прочее — нет. */
  for (const path of ["/Cuscino-Allattamento-Grigio-1111253", "/15-ay032nl-15-ay033nl-15-ay034nl-15-ay035nl-416588", "/Reloj-Fossil-FS5304-Hombre-1333334/"]) assert.ok(hackedPage(path), path);
  for (const path of ["/beauty-uomo/", "/implantatsiya-all-on-4/", "/akcii/skidka-2025", "/akcii/1234567", "/privacy", "/", "/a/b-1234567", "/x-12345678"]) assert.ok(!hackedPage(path), path);
  /* Страницы собирает gen.mjs, как на сервере: собранных файлов сайта в репозитории нет. */
  const a = await boot("https://syanie.test", { live: true });
  try {
    const r = await fetch(a.base + "/implantatsiya-all-on-6/", { redirect: "manual" });
    assert.equal(r.status, 301);
    assert.equal(r.headers.get("location"), "/");
    /* Разделы прежнего сайта — те же адреса, с «/» в конце — 301 без неё. */
    const sl = await fetch(a.base + "/implantatsiya-zubov/?utm_source=x", { redirect: "manual" });
    assert.equal(sl.status, 301);
    assert.equal(sl.headers.get("location"), "/implantatsiya-zubov?utm_source=x");
    assert.equal((await fetch(a.base + "/implantatsiya-zubov", { redirect: "manual" })).status, 200);
    const svc = await fetch(a.base + "/koronki-e-max/", { redirect: "manual" });
    assert.equal(svc.headers.get("location"), "/protezirovanie-zubov");
    const gone = await fetch(a.base + "/Cuscino-Allattamento-Grigio-1111253", { redirect: "manual" });
    assert.equal(gone.status, 410);
    assert.equal((await fetch(a.base + "/beauty-uomo/", { redirect: "manual" })).status, 404);
    assert.equal((await a.call("/")).status, 200, "главная не уходит в переадресацию");
  } finally {
    await a.close();
  }
});

test("сияние на сервере клиники: поисковикам — карта сайта с датами и фото, Clean-param, разметка клиники, следы взлома — 410, прежние адреса — 301", async () => {
  /* Владелец, 15.11.2026, после переезда на siyaniye-severa.com: «Сделай
     сайтмап тоже нормальный, вычищай все и сделай прям чтобы поисковики нас
     полюбили». */
  const { hackedPage } = await load("lib/old-urls.mjs");
  /* Служебные адреса WordPress (в его картах сайта лежали товары) — 410. */
  for (const path of ["/wp-sitemap.xml", "/wp-sitemap-posts-post-1.xml", "/sitemap_index.xml", "/product-sitemap2.xml", "/wp-content/uploads/2024/01/x.jpg", "/wp-json/wp/v2/posts", "/feed/", "/xmlrpc.php"]) assert.ok(hackedPage(path), path);
  for (const path of ["/sitemap.xml", "/sitemap-gone.xml", "/robots.txt", "/protos/syanie/og.jpg", "/feedback", "/wp"]) assert.ok(!hackedPage(path), path);
  const gone = read("lib/gone-urls.txt").trim().split("\n");
  assert.equal(gone.length, 1891, "список товаров из их карт сайта");
  assert.ok(gone.every((l) => hackedPage(l)), "в списке удалённых адрес, который не отвечает 410");

  execFileSync(process.execPath, [new URL("../gen.mjs", APP).pathname], { env: { ...process.env, SY_PROD: "1" }, stdio: "pipe" });
  const a = await boot("https://syanie.test");
  try {
    const robots = (await a.call("/robots.txt")).text;
    assert.match(robots, /Disallow: \/admin\n/);
    assert.match(robots, /Clean-param: utm_source&[\w&]*yclid[\w&]* \//, "Яндекс склеит адреса с метками рекламы");
    assert.match(robots, /Sitemap: https:\/\/syanie\.test\/sitemap\.xml/);
    assert.doesNotMatch(robots, /sitemap-gone|Disallow: \/$/, "карту удалённых и весь сайт robots не трогает");

    const map = (await a.call("/sitemap.xml")).text;
    assert.match(map, /<url><loc>https:\/\/syanie\.test\/<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod><image:image>/);
    assert.match(map, /<image:loc>https:\/\/syanie\.test\/protos\/syanie\/p-rec\.webp<\/image:loc>/, "фото клиники в карте сайта");
    assert.match(map, /<loc>https:\/\/syanie\.test\/privacy<\/loc><lastmod>/);
    for (const path of ["uslugi", "ceny", "vrachi", "o-klinike", "otzyvy", "akcii", "kontakty", "svedeniya", "soglasie", "implantatsiya-zubov", "protezirovanie-zubov", "khirurgiya", "esteticheskaya-stomatologiya", "lechenie-zubov", "professionalnaya-gigiena", "diagnostika-zubov"])
      assert.match(map, new RegExp(`<loc>https://syanie\\.test/${path}</loc><lastmod>\\d{4}-\\d{2}-\\d{2}</lastmod>`), path);
    assert.doesNotMatch(map, /notFound|404|\/index</, "служебная страница в карте сайта");
    assert.doesNotMatch(map, /bg-street|film-9/, "фон без подписи — не фото для поиска");

    const gm = await a.call("/sitemap-gone.xml");
    assert.equal((gm.text.match(/<url>/g) || []).length, 1891);
    assert.match(gm.text, /<loc>https:\/\/syanie\.test\/Cuscino-[\w-]+-\d+<\/loc><lastmod>2026-11-15<\/lastmod>/);
    assert.equal(gm.headers.get("x-robots-tag"), "noindex");
    for (const path of ["/wp-sitemap.xml", "/wp-content/uploads/a.jpg"]) assert.equal((await fetch(a.base + path, { redirect: "manual" })).status, 410, path);

    /* Файл подтверждения прав в Яндекс Вебмастере — из корня, как просит Яндекс. */
    const proof = await a.call("/yandex_55ab75abb81d3b55.html");
    assert.equal(proof.status, 200);
    assert.match(proof.headers.get("content-type") || "", /text\/html/);
    assert.match(proof.text, /<body>Verification: 55ab75abb81d3b55<\/body>/);
    assert.equal((await a.call("/yandex_0000000000000000.html")).status, 404, "чужой код подтверждения");

    /* Разметка: адрес нового сайта, а не их прежнего на Tilda; цены и врачи —
       со страницы; рейтинга с Яндекс Карт нет (Google такое не принимает). */
    const html = (await a.call("/")).text;
    const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)![1]);
    const clinic = ld["@graph"].find((x: any) => String(x["@id"]).endsWith("#clinic"));
    assert.equal(clinic.url, "https://syanie.test/");
    assert.deepEqual(clinic.makesOffer.map((o: any) => o.price), [179900, 259900]);
    assert.equal(clinic.employee.length, 4, "врачи рабочего сайта — из catalog.mjs");
    assert.ok(!("aggregateRating" in clinic), "оценки с чужих площадок не размечаем");
    const faq = ld["@graph"].find((x: any) => x["@type"] === "FAQPage");
    assert.ok(faq.mainEntity.length >= 10 && faq.mainEntity.every((q: any) => q.name && q.acceptedAnswer.text && !/[<>]|&quot;/.test(q.name + q.acceptedAnswer.text)));
    assert.doesNotMatch(html, /syanie-sewera\.ru/);
    assert.match(html, /<meta property="og:image" content="https:\/\/syanie\.test\/protos\/syanie\/og\.jpg">/);
    assert.ok(existsSync(new URL("../../../../public/protos/syanie/og.jpg", APP)), "нет картинки превью");

    /* lastmod двигает только правка текста, а не перезапуск. */
    const t = a.core.site.modified("test.html", "aaa");
    assert.equal(a.core.site.modified("test.html", "aaa"), t);
    assert.ok(a.core.site.modified("test.html", "bbb") >= t);
  } finally {
    await a.close();
  }

  /* new.<домен> на время проверки — 301 на основной, пока его A смотрит сюда. */
  assert.match(read("deploy/Caddyfile"), /import \/data\/redirect\*\.caddy/);
  const remote = read("deploy/remote.sh");
  assert.match(remote, /caddy\/certificates/);
  assert.match(remote, /redir https:\/\/\{\$DOMAIN\}\{uri\} permanent/);
  assert.match(remote, /\[ "\$CADDY_ALIASES" = "\$ALIASES" \]/, "Caddy не замечает новый прежний адрес");
  /* Прежний сайт на Tilda и третий домен — 301 на основной, когда их A смотрит на сервер
     (владелец, 15.11.2026: «редирект с .ru на .com… чтобы не терять позиции выдачи»). */
  const wf = readFileSync(new URL("../../../../.github/workflows/syanie-app.yml", APP), "utf8");
  assert.match(wf, /SY_ALIASES: \$\{\{ vars\.SYANIE_ALIASES \|\| '[^']*\bsyanie-sewera\.ru\b[^']*' \}\}/);
  assert.match(wf, /envs: [^\n]*\bSY_ALIASES\b/, "SY_ALIASES не уходит на сервер");
  assert.match(remote, /printf '%s\\n' \$\{SY_ALIASES:-\}/, "remote.sh не читает SY_ALIASES");
});

test("сияние на сервере клиники: многостраничный сайт — услуги по разделам, цены, врачи, сведения о клинике, 152-ФЗ и версия для слабовидящих", async () => {
  /* Владелец, 16.11.2026: «Под сияние севера делаем многостраничное, как у
     оригинального сайта который у них был. Разведи на несколько страниц:
     отдельно услуги, отдельно цены и адаптируй под 152 ФЗ: согласия,
     обработка данных, версия для слабовидящих и всей необходимой документации». */
  const CAT = await import(new URL("../catalog.mjs", APP).href);
  const { CATS, TEXT_KEYS } = await load("lib/site-content.mjs");
  assert.deepEqual(CATS, CAT.CATEGORIES.map((k: any) => [k.slug, k.t]), "разделы в админке и на сайте разошлись");
  for (const k of CAT.CATEGORIES) assert.ok(TEXT_KEYS["pg-" + k.slug], "текст первого экрана раздела не правится: " + k.slug);
  assert.ok(CAT.SERVICES.every((x: any) => CAT.CATEGORIES.some((k: any) => k.slug === x.cat)), "услуга вне разделов");
  /* Цены только те, что клиника называла сама (16.11.2026 — All-on-4, одномоментная и «под ключ»;
     в переписке того же дня — коронки и виниры от 32 000 ₽, чистка от 4 500 ₽). */
  assert.deepEqual(CAT.SERVICES.filter((x: any) => x.p).map((x: any) => x.p), ["Бесплатно", "от 250 000 ₽", "от 50 000 ₽", "от 80 000 ₽", ...Array(6).fill("от 32 000 ₽"), ...Array(3).fill("от 4 500 ₽"), "5 000 ₽"]);

  const a = await boot("https://syanie.test", { live: true });
  try {
    const pages = ["/", "/uslugi", "/ceny", "/vrachi", "/o-klinike", "/otzyvy", "/akcii", "/kontakty", "/svedeniya", "/privacy", "/soglasie", ...CAT.CATEGORIES.map((k: any) => "/" + k.slug)];
    for (const path of pages) {
      const r = await a.call(path);
      assert.equal(r.status, 200, path);
      assert.match(r.text, new RegExp(`<link rel="canonical" href="https://syanie\\.test${path === "/" ? "/" : path}">`), path);
      assert.ok(!/[—–]| - |&mdash;/.test(r.text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "")), "длинное тире: " + path);
      assert.ok(!/__SITE_URL__|undefined|\[object Object\]|NaN/.test(r.text), "дыра в сборке: " + path);
      /* На каждой странице: меню страниц, согласие в записи, версия для слабовидящих, предупреждение. */
      assert.match(r.text, /<nav class="nav" aria-label="Разделы сайта"><a href="\/"/, path);
      assert.match(r.text, /id="bk-ok"[^>]*>|<input type="checkbox" id="bk-ok">/, path);
      assert.match(r.text, /<a href="\/soglasie" target="_blank" rel="noopener">согласие на обработку персональных данных<\/a>/, path);
      assert.match(r.text, /id="vi-bar"/, path);
      assert.match(r.text, /data-vi="on"/, path);
      assert.match(r.text, /ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ/, path);
      assert.match(r.text, /href="\/svedeniya">Сведения о медицинской организации/, path);
      const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(r.text)![1]);
      assert.ok(ld["@graph"].some((x: any) => String(x["@id"]).endsWith("/#clinic")), "разметка клиники: " + path);
    }
    /* Раздел услуг: его услуги, другие разделы, подсвечено «Услуги». */
    const impl = (await a.call("/implantatsiya-zubov")).text;
    assert.match(impl, /<h1>Имплантация зубов в Томске<\/h1>/);
    assert.match(impl, /All-on-6: все зубы на 6 имплантатах[\s\S]*?от 179 900 ₽/);
    assert.match(impl, /<h3>Одномоментная имплантация<\/h3>/);
    assert.match(impl, /<a href="\/uslugi" aria-current="page">Услуги<\/a>/);
    assert.match(impl, /"@type":"BreadcrumbList"/);
    /* Цены: All-on-6 и прейскурант по всем разделам. */
    const ceny = (await a.call("/ceny")).text;
    for (const k of CAT.CATEGORIES) assert.match(ceny, new RegExp(`id="pl-${k.slug}"`), k.slug);
    assert.match(ceny, /<th scope="row">Компьютерная томография \(КТ\) челюсти<small>[^<]*<\/small><\/th><td>5 000 ₽<\/td>/);
    /* Ответ клиники, 16.11.2026: «Цены на коронка и виниры от 32.000 р», «Чистка от 4.500». */
    for (const t of ["Коронка из диоксида циркония", "Керамическая коронка", "Керамические виниры", "Композитные виниры"]) assert.match(ceny, new RegExp(`<th scope="row">${t}<small>[^<]*</small></th><td>от 32 000 ₽</td>`), t);
    assert.match(ceny, /<th scope="row">Профессиональная гигиена полости рта<small>[^<]*<\/small><\/th><td>от 4 500 ₽<\/td>/);
    assert.match(ceny, /постановление Правительства РФ от 11\.05\.2023 № 736/);
    /* Сведения о медицинской организации (ПП № 736, п. 11). */
    const sv = (await a.call("/svedeniya")).text;
    for (const t of ["ИНН", "7000026555", "ОГРН", "1257000003743", "Л041-01043-70/03947806", "634029, г. Томск, ул. Белинского, 19", "Управление Роспотребнадзора по Томской области", "программе государственных гарантий"]) assert.ok(sv.includes(t), t);
    assert.match(sv, /<a href="\/soglasie">Согласие на обработку персональных данных<\/a>/);
    /* Ответ клиники, 16.11.2026: «Реутов не работает», главный врач — «кадиев рамазан Курбанович». */
    assert.match(sv, /<dt>Руководство<\/dt><dd>Кадиев Рамазан Курбанович, главный врач<\/dd>/);
    assert.doesNotMatch(sv, /Реутов/);
    /* 152-ФЗ: отдельный документ согласия, политика с целями, сроками, правами и трансграничной передачей. */
    const sog = (await a.call("/soglasie")).text, pol = (await a.call("/privacy")).text;
    assert.match(sog, /Редакция от 16\.11\.2026/);
    for (const t of ["Какие данные", "Для чего", "Как отозвать", "за пределами Российской Федерации", "ИНН 7000026555"]) assert.ok(sog.includes(t), "согласие: " + t);
    for (const t of ["152-ФЗ", "п. 4 ч. 2 ст. 10", "ч. 5 ст. 18", "10 рабочих дней", "трансграничная передача", 'id="cookies"', "Счётчиков посещаемости"]) assert.ok(pol.includes(t), "политика: " + t);
    /* Метрика — только по согласию: на странице нет её кода, окно о cookie знает номер. */
    for (const path of ["/", "/ceny"]) assert.doesNotMatch((await a.call(path)).text, /ym\(\d+,"init"/);

    /* Админка: сведения, контролирующие органы, документы, образование врачей. */
    await a.adminPost("/setup", { code: "setup-42", login: "glavvrach", name: "Евгений", pass: "длинный-пароль" });
    const view = (await a.call("/api/admin/site")).json;
    assert.ok(["services", "org", "authorities", "docs"].every((k) => view.groups.some((g: any) => g.key === k)));
    assert.equal(view.defaults.org.inn, "7000026555");
    assert.equal(view.defaults.authorities.length, 3);
    assert.match((await a.adminPost("/site/org", { value: { ...view.defaults.org, inn: "123" } })).json.error, /ИНН/);
    assert.equal((await a.adminPost("/site/org", { value: { ...view.defaults.org, licBy: "Департамент здравоохранения Томской области", pdEmail: "pd@clinic.ru" } })).status, 200);
    const sv2 = (await a.call("/svedeniya")).text;
    assert.match(sv2, /<dt>Кем выдана<\/dt><dd>Департамент здравоохранения Томской области<\/dd>/);
    assert.match((await a.call("/privacy")).text, /mailto:pd@clinic\.ru/);
    /* Сохранённые сведения с прежним главным врачом по умолчанию — на сайте нынешний; своё значение клиники — как есть. */
    await a.adminPost("/site/org", { value: { ...view.defaults.org, chief: "Реутов Евгений Александрович, главный врач" } });
    assert.match((await a.call("/svedeniya")).text, /<dt>Руководство<\/dt><dd>Кадиев Рамазан Курбанович, главный врач<\/dd>/);
    await a.adminPost("/site/org", { value: { ...view.defaults.org, chief: "Иванов Иван Иванович, главный врач" } });
    assert.match((await a.call("/svedeniya")).text, /<dt>Руководство<\/dt><dd>Иванов Иван Иванович, главный врач<\/dd>/);
    /* Номер клиники (владелец, 19.11.2026: «+73822734858 - вот этот номер актуальный на сайте должен быть»): на каждой странице рабочего сайта, прежний — только в макете. */
    assert.equal(view.defaults.contacts.phone, "+7 (382) 273-48-58");
    for (const path of ["/", "/kontakty", "/svedeniya", "/ceny", "/vrachi"]) {
      const t = (await a.call(path)).text;
      assert.match(t, /href="tel:\+73822734858"/, path);
      assert.ok(t.includes("+7 (382) 273-48-58"), path);
      assert.doesNotMatch(t, /227-00-77|73822270077/, path);
    }
    /* Сохранённые контакты с прежним номером по умолчанию — на сайте нынешний; свой номер клиники — как есть. */
    await a.adminPost("/site/contacts", { value: { ...view.defaults.contacts, phone: "+7 (382) 227-00-77" } });
    assert.match((await a.call("/kontakty")).text, /href="tel:\+73822734858"/);
    await a.adminPost("/site/contacts", { value: { ...view.defaults.contacts, phone: "+7 (382) 255-55-55" } });
    assert.match((await a.call("/kontakty")).text, /href="tel:\+73822555555"/);
    await a.adminPost("/site/contacts", { value: view.defaults.contacts });
    await a.adminPost("/site/org", { value: { ...view.defaults.org, licBy: "Департамент здравоохранения Томской области", pdEmail: "pd@clinic.ru" } });
    /* Документ клиники — PDF: имя по хешу, отдаётся сайтом как PDF, ссылка в «Документах». */
    const pdf = "data:application/pdf;base64," + Buffer.from("%PDF-1.4\n% test\n").toString("base64");
    const doc = (await a.adminPost("/upload", { data: pdf })).json.url as string;
    assert.match(doc, /^\/uploads\/[a-f0-9]{32}\.pdf$/);
    assert.equal((await a.call(doc)).headers.get("content-type"), "application/pdf");
    assert.equal((await a.adminPost("/upload", { data: "data:application/pdf;base64," + Buffer.from("<html>").toString("base64") })).status, 400, "не PDF под видом PDF");
    assert.equal((await a.adminPost("/site/docs", { value: [{ t: "Выписка из реестра лицензий", file: doc }] })).status, 200);
    assert.ok((await a.call("/svedeniya")).text.includes(`<a href="${doc}" rel="noopener" target="_blank">Выписка из реестра лицензий</a>`));
    assert.match((await a.adminPost("/site/docs", { value: [{ t: "Чужой", file: "https://evil.example/x.pdf" }] })).json.error, /загрузите файл заново/);
    const doctors = view.defaults.doctors.map((d: any, i: number) => (i ? d : { ...d, edu: "СибГМУ, 2006, стоматология", cert: "Аккредитация специалиста, стоматология ортопедическая" }));
    assert.equal((await a.adminPost("/site/doctors", { value: doctors })).status, 200);
    assert.match((await a.call("/vrachi")).text, /<b>Образование<\/b>СибГМУ, 2006, стоматология/);
    assert.match((await a.call("/svedeniya")).text, /Аккредитация специалиста, стоматология ортопедическая/);
    /* Текст первого экрана страницы правится, как раздел главной. */
    await a.adminPost("/site/texts", { value: { "pg-ceny": { h: "Прайс клиники" } } });
    assert.match((await a.call("/ceny")).text, /<h1>Прайс клиники<\/h1>/);
  } finally { await a.close(); }

  /* Версия для слабовидящих и окно о cookie — в скрипте и стилях каждой страницы. */
  const css = read("site/pages.css"), js = read("site/live-pages.js");
  assert.match(css, /html\.vi-c1\{--vi-fg:#000;--vi-bg:#fff\}/);
  assert.match(css, /html\.vi-c3\{--vi-fg:#063462;--vi-bg:#9dd1ff\}/);
  assert.match(css, /html\.vi-noimg img/);
  assert.match(js, /localStorage|lsSet\(VI_KEY/);
  assert.match(js, /mc\.yandex\.ru\/metrika\/tag\.js/);
  assert.match(js, /if\(K\.metrika\)\{if\(ck==='all'\)metrika\(\)/, "Метрика без согласия");
  assert.match(read("site/store-live.js"), /lead\.consent=true/);
  assert.match(read("site/live-chat.js"), /consent:true/);
  /* Образ: новые модули сборщика едут в render/. */
  const wf = readFileSync(new URL("../../../../.github/workflows/syanie-app.yml", APP), "utf8");
  assert.match(wf, /cp gen\.mjs data\.mjs plan\.mjs catalog\.mjs pages\.mjs /);
});

test("сияние на сервере клиники: запросы по Вордстату (Томск) — в title, description, H1 и первом абзаце каждой страницы, вопросы раздела в FAQPage", async () => {
  /* Владелец, 16.11.2026: «проработай СЕО запросы, собери по Томску через
     вордстат наш, топовые запросы и адаптируй вау СЕО КАЖДОЙ СТРАНИЦЫ». */
  const CAT = await import(new URL("../catalog.mjs", APP).href);
  /* Запрос страницы: первые слова её title — так он и стоит в выдаче. */
  const QUERY: Record<string, string> = {
    "/": "All-on-6 и All-on-4 в Томске", "/uslugi": "Стоматология в Томске", "/ceny": "Стоматология в Томске",
    "/implantatsiya-zubov": "Имплантация зубов в Томске", "/protezirovanie-zubov": "Протезирование зубов в Томске",
    "/khirurgiya": "Удаление зуба в Томске", "/esteticheskaya-stomatologiya": "Виниры в Томске", "/lechenie-zubov": "Лечение зубов в Томске",
    "/professionalnaya-gigiena": "Чистка зубов в Томске", "/diagnostika-zubov": "КТ зубов в Томске", "/vrachi": "Стоматологи в Томске",
  };
  const a = await boot("https://syanie.test", { live: true });
  try {
    for (const [path, q] of Object.entries(QUERY)) {
      const html = (await a.call(path)).text;
      const title = /<title>([^<]+)<\/title>/.exec(html)![1], desc = /<meta name="description" content="([^"]+)"/.exec(html)![1];
      assert.ok(title.startsWith(q), `${path}: title «${title}»`);
      assert.ok(title.length <= 85, `${path}: title длиннее 85 знаков`);
      assert.ok(desc.length <= 160, `${path}: description ${desc.length} знаков`);
      assert.ok(/Томск/.test(desc), `${path}: description без города`);
    }
    for (const k of CAT.CATEGORIES) {
      const seo = CAT.SEO[k.slug], html = (await a.call("/" + k.slug)).text;
      const h1 = /<h1>([^<]+)<\/h1>/.exec(html)![1], lead = /<p class="lead">([^<]+)<\/p>/.exec(html)![1];
      const word = seo.h.split(/\s+/)[0].toLowerCase().slice(0, 6);
      assert.ok(/в Томске/.test(h1), `${k.slug}: H1 «${h1}» без Томска`);
      assert.ok(lead.toLowerCase().includes(word) && /в Томске/.test(lead), `${k.slug}: первый абзац без запроса`);
      /* «Подробно» и вопросы: видимые вопросы совпадают с FAQPage. */
      assert.match(html, /<span class="kick">Подробно<\/span>/);
      const asked = [...html.matchAll(/<button type="button" class="fq-q"[^>]*><span>([^<]+)<\/span>/g)].map((m) => m[1]);
      const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)![1]);
      const faq = ld["@graph"].find((x: any) => x["@type"] === "FAQPage");
      assert.deepEqual(faq.mainEntity.map((x: any) => x.name), asked.map((x) => x.replace(/&quot;/g, '"')), k.slug);
      assert.ok(asked.length >= 2, `${k.slug}: меньше двух вопросов`);
    }
    /* Цены в текстах — только из прейскуранта клиники. */
    const said: string[] = JSON.stringify(CAT.SEO).match(/\d[\d ]*\d ₽|\d+ ₽/g) || [];
    /* Цены прейскуранта по умолчанию и All-on-6 первого экрана. */
    const known = new Set([...CAT.SERVICES.map((x: any) => x.p.replace(/^от /, "")).filter((p: string) => p.endsWith("₽")), "179 900 ₽"]);
    for (const p of ["32 000 ₽", "4 500 ₽"]) assert.ok(said.includes(p), "цена клиники не названа на страницах: " + p);
    for (const p of said) assert.ok(known.has(p), "цена не из прейскуранта: " + p);
    /* Чего клиника не делает — не обещаем. */
    assert.doesNotMatch(JSON.stringify(CAT.SEO), /отбелив|детск/i);
  } finally { await a.close(); }
});

test("сияние на сервере клиники: «Наши врачи» — четыре врача в полный рост, карточка как выбор героя, врачи раздела по специальности", async () => {
  /* Владелец, 16.11.2026: «врачи на сайте не актуальны… Отрисуй их с точностью
     и улучши качество фото… Хиро секцию, где врачи стоят и на них можно нажать,
     откроются характеристики их как в мортал комбат… остальные при этом
     затемняются. При нажатии куда угодно врач разворачивается спиной и идет на
     свое место». */
  const CAT = await import(new URL("../catalog.mjs", APP).href);
  assert.deepEqual(CAT.DOCTORS.map((d: any) => d.name), ["Досжанов Руслан Максутович", "Кузнецова Полина Олеговна", "Намазов Намиг Исмайылович", "Кадиев Рамазан Курбанович"]);
  const PUB = new URL("../../../../public/protos/syanie/", APP);
  for (const d of CAT.DOCTORS) {
    const id = d.img.slice(3);
    assert.ok(CAT.FIGS[id], "нет вырезки в полный рост: " + d.name);
    for (const f of [`tm-${id}.webp`, `tm-${id}-b.webp`, `dr-${id}.webp`]) assert.ok(existsSync(new URL(f, PUB)), "нет файла " + f);
  }
  const a = await boot("https://syanie.test", { live: true });
  try {
    const home = (await a.call("/")).text, vr = (await a.call("/vrachi")).text;
    for (const html of [home, vr]) {
      assert.match(html, /<section class="tm" id="vrachi" data-tone="ink" data-tm>/);
      assert.equal(html.match(/<button type="button" class="tm-d"/g)?.length, 4);
      assert.match(html, /Нажмите на врача, чтобы посмотреть/);
      assert.match(html, /<img class="tm-f" src="\/protos\/syanie\/tm-kadiev\.webp\?v=[0-9a-f]{8}" width="341" height="1200" alt="Кадиев Рамазан Курбанович, стоматолог-хирург, ортопед"/);
      assert.match(html, /<img class="tm-k" src="\/protos\/syanie\/tm-kadiev-b\.webp\?v=[0-9a-f]{8}"[^>]*alt="" aria-hidden="true"/);
      /* Подход — лента с путём по каждому кадру (data-p: от 0 до 1000, кадров столько же, сколько в ленте). */
      const wf = /<span class="tm-w tm-wf" data-src="\/protos\/syanie\/tm-kadiev-wf\.webp\?v=[0-9a-f]{8}" data-n="(\d+)" data-c="8" data-ms="\d+" data-p="([\d,]+)" style="--c:8;--r:\d;width:[\d.]+%;left:-[\d.]+%"><img alt="" aria-hidden="true" decoding="async"><\/span>/.exec(html);
      assert.ok(wf, "нет ленты подхода Кадиева");
      const path = wf[2].split(",").map(Number);
      assert.equal(path.length, Number(wf[1]));
      assert.ok(path[0] === 0 && path[path.length - 1] === 1000 && path.every((v, i) => !i || v >= path[i - 1]), "путь ленты не растёт от 0 до 1000");
      /* Разворот — своя лента кадров (лицо, профиль, спина), без отрезка пути. */
      assert.match(html, /<span class="tm-w tm-t" data-src="\/protos\/syanie\/tm-kadiev-t\.webp\?v=[0-9a-f]{8}" data-n="18" data-c="6" data-ms="\d+" style="--c:6;--r:3;width:[\d.]+%;left:-[\d.]+%"><img alt="" aria-hidden="true" decoding="async"><\/span>/);
    }
    assert.match(home, /<h2>Наши врачи<\/h2>/);
    assert.match(vr, /<h1>Наши врачи<\/h1>/);
    /* Прежних врачей среди врачей сайта нет. «Руководство» в сведениях о клинике — данные организации, их правит клиника. */
    for (const path of ["/", "/vrachi", "/implantatsiya-zubov"]) assert.doesNotMatch((await a.call(path)).text, /Реутов|Савин/, path);
    assert.doesNotMatch(/<ul class="sd-l">[\s\S]*?<\/ul>/.exec((await a.call("/svedeniya")).text)![0], /Реутов|Савин/);
    /* Карточка: стаж полосой по годам (10 делений), направления по специальности, запись к этому врачу. */
    const card = (name: string) => new RegExp(`<div class="tm-i" id="tm-i\\d" role="region" aria-label="${name}" hidden>[\\s\\S]*?</div>\\n?<p class="tm-esc">`).exec(vr)![0];
    const kad = card("Кадиев Рамазан Курбанович");
    assert.match(kad, /<b>6 лет<\/b>/);
    assert.match(kad, /<ul class="tm-x"><li>Главный врач клиники<\/li><\/ul>/);
    assert.equal(kad.match(/<i class="on"/g)?.length, 6);
    assert.deepEqual([...kad.matchAll(/<a href="\/([a-z-]+)">/g)].map((m) => m[1]), ["implantatsiya-zubov", "protezirovanie-zubov", "khirurgiya"]);
    assert.match(kad, /data-book data-svc="Имплантация" data-doc="Кадиев Рамазан Курбанович"/);
    const dos = card("Досжанов Руслан Максутович");
    assert.match(dos, /<b>более 1,5 лет<\/b>/);
    assert.equal(dos.match(/<i class="on"/g)?.length, 2);
    assert.match(card("Кузнецова Полина Олеговна"), /<a href="\/lechenie-zubov">Лечение зубов<\/a>/);
    /* Своих чисел нет: в карточках только стаж из слов клиники. */
    assert.doesNotMatch(vr.slice(vr.indexOf('class="tm"'), vr.indexOf("</section>", vr.indexOf('class="tm"'))).replace(/<[^>]*>/g, " "), /\d+\s*%|операц|рейтинг/i);
    /* Врачи раздела — по специальности. */
    const docsOn = async (path: string) => [...(await a.call(path)).text.matchAll(/<div class="vd-t"><span class="kick">[^<]*<\/span><h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
    assert.deepEqual(await docsOn("/khirurgiya"), ["Намазов Намиг Исмайылович", "Кадиев Рамазан Курбанович"]);
    assert.deepEqual(await docsOn("/protezirovanie-zubov"), ["Досжанов Руслан Максутович", "Кадиев Рамазан Курбанович"]);
    /* Врач, которого клиника добавит в админке без вырезки, стоит в ряду фотографией. */
    await a.adminPost("/setup", { code: "setup-42", login: "glavvrach", name: "Евгений", pass: "длинный-пароль" });
    const view = (await a.call("/api/admin/site")).json;
    assert.deepEqual(view.defaults.doctors.map((d: any) => d.img), ["dr-doszhanov", "dr-kuznetsova", "dr-namazov", "dr-kadiev"]);
    const more = [...view.defaults.doctors, { name: "Иванов Иван Иванович", role: "Стоматолог-ортопед", facts: "Стаж 3 года", quote: "", img: "", edu: "", cert: "", sched: "" }];
    assert.equal((await a.adminPost("/site/doctors", { value: more })).status, 200);
    const vr2 = (await a.call("/vrachi")).text;
    assert.equal(vr2.match(/<button type="button" class="tm-d"/g)?.length, 5);
    assert.match(vr2, /<li class="tm-s tm-nofig"[^>]*><button type="button" class="tm-d" data-i="4" data-sn="Иванов"/);
  } finally { await a.close(); }
  /* Сохранённые в админке прежние врачи макета — не правка клиники: на сайте новые. */
  const { dropOldDoctors } = await load("lib/site-content.mjs");
  assert.deepEqual(dropOldDoctors({ doctors: [{ name: "Реутов Евгений Александрович" }, { name: "Савин Тимур Николаевич" }], faq: [] }), { faq: [] });
  const own = { doctors: [{ name: "Реутов Евгений Александрович" }, { name: "Иванов Иван Иванович" }] };
  assert.equal(dropOldDoctors(own), own);
  /* Движение — transform и opacity; врач для записи — в пожелание к заявке; «меньше движения» и версия для слабовидящих — без шагов. */
  const css = read("site/team.css"), js = read("site/team.js");
  /* visibility — не движение: лента кадров, которая не играет, снята с отрисовки (память телефона). */
  for (const m of css.matchAll(/transition:([^;}]+)/g)) for (const part of m[1].split(",")) assert.match(part.trim(), /^(transform|opacity|border-color|color|transition-duration|none)\b|^visibility 0s|^\.01s/, "анимация не transform/opacity: " + part);
  /* Кадры движения (владелец, 16.11.2026: «можешь сделать прям походку, чтобы он шел?», потом
     «шаги сделай будто бы это шаги настоящие. Когда разворачивается — они становятся тонкими,
     будто бы толщиной врач 1 мм»): у каждого врача три ленты — к нам, от нас и разворот; лента —
     сетка кадров по FIGS, обе стороны не больше 4096 (предел картинки на телефонах). */
  const { imageSize } = await import("node:module").then(() => ({ imageSize: (f: string) => { const b = readFileSync(f); const i = b.indexOf("VP8X"); return i > 0 ? { w: 1 + b.readUIntLE(i + 12, 3), h: 1 + b.readUIntLE(i + 15, 3) } : null; } }));
  for (const [id, f] of Object.entries(CAT.FIGS) as Array<[string, any]>) for (const k of ["wf", "wb", "t"]) {
    const file = new URL(`tm-${id}-${k}.webp`, PUB).pathname;
    assert.ok(existsSync(file), "нет ленты кадров " + file);
    const size = imageSize(file)!, t = f[k];
    assert.equal(size.w, t.c * t.tw, "ширина ленты не c × tw: " + file);
    assert.equal(size.h, Math.ceil(t.n / t.c) * CAT.FIG_H, "высота ленты не рядов × FIG_H: " + file);
    assert.ok(size.w <= 4096 && size.h <= 4096, "лента больше 4096: " + file);
    assert.ok(statSync(file).size < 480_000, "лента тяжелее 480 КБ: " + file);
    /* Шаги не скользят: у ходьбы записан путь (по каждому кадру — p, или отрезок, где идут ноги, — go); у разворота пути нет. */
    if (k === "t") assert.ok(t.go === undefined && t.p === undefined);
    else if (t.p) assert.ok(t.p.length === t.n && t.p[0] === 0 && t.p[t.n - 1] === 1000 && t.p.every((v: number, i: number) => !i || v >= t.p[i - 1]), "путь по кадрам: " + id + " " + k);
    else assert.ok(t.go[0] >= 0 && t.go[0] < 0.3 && t.go[1] > 0.7 && t.go[1] <= 1, "отрезок шага: " + id + " " + k);
    /* Подход каждого врача снят стоящей камерой (владелец про Намазова: «У этого врача нет проходки»): путь по кадрам обязателен. */
    if (k === "wf") assert.ok(Array.isArray(t.p), "подход без пути по кадрам: " + id);
    assert.ok(t.ms >= 600 && t.ms <= 2800, "время ленты: " + id + " " + k);
  }
  /* «К нам» грузится, когда блок на экране, «от нас» и разворот — когда врач вышел. */
  assert.match(js, /load\(b\.parentNode,'wf'\)/);
  assert.match(js, /load\(s,'wb t'\)/);
  /* Кадр ленты выбирает сдвиг сетки; по экрану врача ведёт скрипт по тем же кадрам. */
  assert.match(css, /\.tm-z \.tm-w img\{[^}]*transform:translate\(calc\(-100% \* var\(--fx,0\) \/ var\(--c,1\)\),calc\(-100% \* var\(--fy,0\) \/ var\(--r,1\)\)\)/);
  assert.match(js, /path\(i,HOME,to,w\)/);
  assert.match(js, /path\(i,from,HOME,w\)/);
  assert.match(js, /getAttribute\('data-p'\)/);
  /* Кадры лежат под теми же именами с кэшем на неделю: версия в адресе — отпечаток файлов. */
  const { figVersion } = await import(new URL("../figures/version.mjs", APP).href);
  assert.equal(CAT.FIG_V, figVersion(), "поменялись tm-*.webp: node scripts/protos/syanie/figures/version.mjs write");
  /* Разворот — кадрами, туда и обратно; сжатия по ширине («толщиной 1 мм») нет нигде. */
  assert.match(js, /run\(s,'t',w,!back,null,/);
  assert.doesNotMatch(css + js, /tm-turn|rotateY/);
  assert.doesNotMatch(css, /\.tm-(z|g|d|s)[^{}]*\{[^}]*scaleX/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /html\.vi \.tm-i,html\.vi \.tm-i\[hidden\]\{display:block/);
  assert.match(js, /tm-back/);
  /* Нажатие, пока врач идёт, не теряется; другой врач при открытом — первый уходит, второй уже идёт. */
  assert.match(js, /if\(busy\)\{want=i;return\}/);
  assert.match(js, /function swap\(i\)/);
  /* Выбранный врач крупный и закрывает соседей: нажатие проходит сквозь него. */
  assert.match(css, /\.tm-sel \.tm-d\{pointer-events:none\}/);
  assert.match(js, /window\.SY_DOC=a\.getAttribute\('data-doc'\)/);
  assert.match(read("site/store-live.js"), /'врач: '\+window\.SY_DOC/);
  /* Макет не меняется: там прежние врачи и нет сцены. */
  const bundle = readFileSync(new URL("../../../../content/proto-bundles/syanie.json", APP), "utf8");
  assert.ok(bundle.includes("Реутов") && !bundle.includes("tm-d"));
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

test("сияние на сервере клиники: админка — светлое стекло на размытом фото клиники, фото только у неё", () => {
  const index = read("admin/index.html"), css = read("admin/app.css"), photo = read("admin/photo.css");
  /* Фото — своим файлом после app.css: инлайн-стиль закрыл бы CSP админки. */
  assert.ok(index.indexOf('href="/admin/app.css"') < index.indexOf('href="/admin/photo.css"'), "photo.css не после app.css");
  assert.match(photo, /--bg-photo:url\(\/admin\/bg\.webp\)/);
  assert.ok(existsSync(new URL("admin/bg.webp", APP)) && readFileSync(new URL("admin/bg.webp", APP)).length < 40_000, "фон админки тяжелее 40 КБ");
  /* app.css берёт и админка салона в макетах из бота: фото клиники туда не попадает. */
  assert.match(css, /--bg-photo:none/);
  assert.match(css, /background:var\(--bg-photo\) center\/cover/);
  assert.match(css, /backdrop-filter:blur/);
  assert.ok(!/bg\.webp|\/protos\/syanie/.test(css), "фото клиники в app.css");
  const salon = JSON.parse(readFileSync(new URL("../../../../content/proto-instant/panel-assets.json", APP), "utf8")).syanie.css;
  assert.ok(!/bg\.webp/.test(salon), "фото клиники в админке салона");
  /* Нижнее меню телефона — короткие подписи, на компьютере — полные. */
  assert.match(read("admin/app.js"), /'Подключения','plug','Сервисы'/);
  assert.match(css, /\.nav \.nv-l\{display:none\}/);
});

test("сияние на сервере клиники: образ из GitHub, сервер только скачивает, ключи не в журнале", () => {
  const wf = readFileSync(new URL("../../../../.github/workflows/syanie-app.yml", APP), "utf8");
  const remote = read("deploy/remote.sh");
  assert.match(wf, /docker\/build-push-action/);
  assert.match(wf, /SY_PROD=1 node scripts\/protos\/syanie\/gen\.mjs/);
  assert.match(wf, /vars\.SYANIE_DOMAIN != ''/, "выкатка без домена");
  assert.doesNotMatch(remote, /docker build|npm (ci|install)|node gen/, "сборка на сервере клиники");
  assert.match(remote, /-p "127\.0\.0\.1:\$PORT:3000"/, "сайт слушает не только локальный адрес");
  assert.match(remote, /PORT="\$\{SY_PORT:-3000\}"/, "порт сайта по умолчанию не 3000");
  /* Как у CZECHFARM: вход по ключу или паролю, порт сайта переменной, www — на основной адрес. */
  assert.match(wf, /password: \$\{\{ secrets\.SYANIE_PASSWORD \}\}/, "нет входа по паролю");
  assert.match(wf, /SY_PORT: \$\{\{ vars\.SYANIE_APP_PORT \|\| '3000' \}\}/, "нет порта сайта");
  assert.match(read("deploy/Caddyfile"), /www\.\{\$DOMAIN\} \{\s*redir https:\/\/\{\$DOMAIN\}\{uri\} permanent/, "www не ведёт на основной адрес");
  assert.match(remote, /ufw allow 80\/tcp/, "файрвол сервера не открывает 80");
  /* Сменили SYANIE_DOMAIN — Caddy пересоздаётся, а не держит старое имя. */
  assert.match(remote, /\[ "\$CADDY_DOMAIN" = "\$SY_DOMAIN" \]/, "Caddy не замечает смену домена");
  assert.match(remote, /--memory 512m/);
  assert.match(remote, /вернул прошлый образ/, "нет отката");
  assert.doesNotMatch(remote, /cat "\$D\/\.env"|echo "\$CODE"|say .*\$CODE|say .*SY_SETUP\}/, "код установки попадает в журнал");
  assert.match(read("Dockerfile"), /USER node/);
  assert.match(read("deploy/Caddyfile"), /reverse_proxy syanie-app:3000/);
  execFileSync("bash", ["-n", new URL("deploy/remote.sh", APP).pathname]);
});
