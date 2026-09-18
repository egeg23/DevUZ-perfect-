/**
 * Откуда пришёл лид: ник, канал, время и страница.
 *
 * Владелец, глядя на заявку в чате: «указывай юзернейм, если он есть.
 * Откуда писал, во сколько, где». Четыре факта, и все четыре — про то,
 * чтобы решать по уведомлению, не открывая панель.
 *
 * Здесь же — кнопка входа в панель под тем же уведомлением: проверяется
 * не столько то, что она есть, сколько то, что без неё ничего не ломается.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";

import {
  atTashkent,
  channelName,
  originLines,
  pathFromClient,
  placeOf,
  refFromClient,
  refOf,
  usernameOf,
} from "@/lib/qualify/origin";
import { scoreLead } from "@/lib/qualify/scoring";
import type { QualifyToolInput } from "@/lib/qualify/types";

type Call = { method: string; body: Record<string, unknown> };

const calls: Call[] = [];
/** Заглушка отклонит ровно одну ближайшую отправку и забудет об этом. */
let rejectOnce: string | null = null;

const server = createServer((req, res) => {
  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    const body = raw ? JSON.parse(raw) : {};
    calls.push({ method: String(req.url).split("/").pop() ?? "", body });
    if (rejectOnce) {
      const description = rejectOnce;
      rejectOnce = null;
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, description }));
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, result: {} }));
  });
});

await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address() as { port: number };

process.env.TELEGRAM_API_BASE = `http://127.0.0.1:${port}`;
process.env.TELEGRAM_BOT_TOKEN = "stub-token";
process.env.TELEGRAM_SALES_CHAT_ID = "-1001234567890";
process.env.NEXT_PUBLIC_SITE_URL = "https://devuz.example";

const { formatLeadBrief, enterUrl, sendLead } = await import("@/lib/qualify/telegram");

function lead(over: Partial<QualifyToolInput> = {}) {
  const input: QualifyToolInput = {
    contact_name: "Азиз",
    company: "Магнат",
    contact_handle: "",
    contact_kind: "none",
    niche: "розница",
    niche_tier: 1,
    expertise: "high",
    services: ["ecommerce"],
    budget: "B1",
    authority: "A1",
    need: "N1",
    timing: "T1",
    intent: "interested",
    summary: {
      client: "Азиз",
      request: "магазин",
      niche: "розница",
      expertise: "высокая",
      budget: "20 000 $",
      authority: "владелец",
      need: "срочно",
      timing: "этот месяц",
    },
    notes: "",
    opening_line: "Азиз, здравствуйте",
    already_told: [],
    avoid_asking: [],
    ...over,
  };
  return scoreLead(input, "ru");
}

// 18 сентября 2026, 09:09 UTC — то самое время заявки DZ-0918-76QN.
const AT = "2026-09-18T09:09:22.659Z";

test("время показывается по Ташкенту, а не по серверу", () => {
  // Сервер живёт в UTC. Без явного пояса владелец читал бы «09:09» про
  // заявку, пришедшую в обед, и считал бы, что человек пишет по ночам.
  assert.equal(atTashkent(AT), "18 сентября, 14:09");
  assert.equal(atTashkent("не дата"), "время неизвестно");
});

test("канал называется по-человечески", () => {
  assert.equal(channelName("chat"), "чат на сайте");
  assert.equal(channelName("telegram"), "бот в Telegram");
  assert.equal(channelName("showcase"), "витрина — бриф по заказу");
  // Незнакомый источник не выдумывается и не прячется.
  assert.equal(channelName("newsletter"), "newsletter");
  assert.equal(channelName(null), "канал не указан");
});

test("где писал: страница для сайта, бот для бота", () => {
  assert.equal(placeOf({ source: "chat", entryPath: "/ru/keysy" }), "страница /ru/keysy");
  assert.equal(placeOf({ source: "chat" }), null);
  // Писать «страница неизвестна» про разговор в мессенджере — враньё по
  // форме и бессмыслица по сути.
  assert.equal(placeOf({ source: "telegram" }), "личные сообщения боту");
});

test("прямой заход называется прямым заходом, а не сбоем", () => {
  assert.equal(refOf({ source: "chat", entryRef: "google.com" }), "перешёл с google.com");
  assert.equal(refOf({ source: "chat" }), "прямой заход");
  // У разговора в боте и у нашего собственного касания источника нет.
  assert.equal(refOf({ source: "telegram" }), null);
  assert.equal(refOf({ source: "outreach" }), null);
});

test("ник — только настоящий", () => {
  assert.equal(usernameOf({ tgUsername: "egeg23" }), "@egeg23");
  assert.equal(usernameOf({ tgUsername: "@egeg23" }), "@egeg23");
  assert.equal(usernameOf({ tgUsername: "" }), null);
  assert.equal(usernameOf({}), null);
  // Слишком короткий или с посторонними символами — не ник Telegram.
  assert.equal(usernameOf({ tgUsername: "ab" }), null);
  assert.equal(usernameOf({ tgUsername: "с пробелом" }), null);
});

test("страница и источник от браузера — чужой ввод", () => {
  assert.equal(pathFromClient("/ru/uslugi/boty"), "/ru/uslugi/boty");
  assert.equal(pathFromClient("/ru/keysy?utm=1#top"), "/ru/keysy");
  assert.equal(pathFromClient("//evil.example/x"), null);
  assert.equal(pathFromClient("https://evil.example"), null);
  assert.equal(pathFromClient("/ru/<script>"), null);
  assert.equal(pathFromClient(42), null);

  assert.equal(refFromClient("www.Google.com"), "google.com");
  assert.equal(refFromClient("t.me"), "t.me");
  assert.equal(refFromClient("https://google.com/search?q=1"), null);
  assert.equal(refFromClient(""), null);
});

test("бриф отвечает на все четыре вопроса владельца", () => {
  const brief = formatLeadBrief(
    lead(),
    "DZ-0918-76QN",
    "https://devuz.example/admin/leads/abc",
    undefined,
    { source: "chat", tgUsername: "egeg23", entryPath: "/ru/keysy", entryRef: "google.com", at: AT },
  );

  assert.match(brief, /@egeg23/, "нет ника");
  assert.match(brief, /чат на сайте/, "не сказано, откуда писал");
  assert.match(brief, /18 сентября, 14:09/, "не сказано, во сколько");
  assert.match(brief, /страница \/ru\/keysy/, "не сказано, где");
  assert.match(brief, /перешёл с google\.com/, "не сказано, откуда пришёл");
});

test("кнопка ведёт в панель через подписанный вход", () => {
  assert.equal(enterUrl("/admin/leads/abc"), "https://devuz.example/admin/enter/leads/abc");
  assert.equal(enterUrl("/admin"), "https://devuz.example/admin/enter");
});

test("уведомление о лиде несёт кнопку входа в карточку", async () => {
  calls.length = 0;
  assert.equal(await sendLead(lead(), "abc123", "DZ-0918-76QN", { origin: { source: "chat" } }), true);

  const markup = calls[0].body.reply_markup as { inline_keyboard: Record<string, unknown>[][] };
  const button = markup.inline_keyboard[0][0] as { login_url?: { url: string } };
  assert.equal(button.login_url?.url, "https://devuz.example/admin/enter/leads/abc123");
  // Кнопки «взять» и «отклонить» никуда не делись.
  assert.equal(markup.inline_keyboard[1].length, 2);
});

test("непривязанный домен не должен стоить нам лида", async () => {
  // Bot API отклоняет сообщение с login_url целиком, пока боту не привязан
  // домен в BotFather. Молча потерять из-за этого бриф нельзя: удобство
  // входа дешевле любого лида.
  calls.length = 0;
  rejectOnce = "Bad Request: BUTTON_URL_INVALID";

  // Первая попытка отклонена, вторая уходит уже без кнопки входа.
  assert.equal(
    await sendLead(lead(), "abc123", "DZ-0918-76QN", { origin: { source: "chat" } }),
    true,
  );

  assert.equal(calls.length, 2, `попыток ${calls.length}`);
  const second = calls[1].body.reply_markup as { inline_keyboard: Record<string, unknown>[][] };
  const button = second.inline_keyboard[0][0] as { url?: string; login_url?: unknown };
  assert.equal(button.login_url, undefined, "кнопка входа осталась после отказа");
  assert.equal(button.url, "https://devuz.example/admin/leads/abc123", "ссылка на карточку пропала");

  // И больше не пробуем: отказ запомнен до перезапуска.
  calls.length = 0;
  assert.equal(await sendLead(lead(), "abc123", undefined, { origin: { source: "chat" } }), true);
  assert.equal(calls.length, 1, "повторяем попытку, хотя уже знаем ответ");
});

test.after(() => server.close());
