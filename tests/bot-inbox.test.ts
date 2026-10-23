/**
 * Обращения в бота — владельцу и руководителю сразу, ответ прямо в Telegram.
 *
 * Владелец, 23.10.2026, после лида FloraEdu Global, который нашёлся только
 * потому, что он сам начал копать: «как нам сделать так, чтобы и я и
 * руководитель могли видеть и отвечать на такие заявки, которые приходят в
 * бота?… С личного писать аккаунта мы не будем».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { NOTICES, kindsFor } from "@/lib/admin/notify-prefs";
import { HUMAN_HOLD_DAYS, humanHolds, inboxNotice, nightNotice } from "@/lib/qualify/bot-inbox-store";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const client = { chatId: 1126461549, name: "Shahzod", username: "floraedu" };

test("обращение: кто, слова клиента, что ответил бот, заявка и как ответить", () => {
  const text = inboxNotice({
    client,
    text: "Narxi <b>qancha</b>?",
    botReply: "Смету пришлём сегодня.",
    lead: { id: "L1", requestNo: "DZ-1022-DJ79", label: "FloraEdu Global" },
    human: null,
  });
  assert.match(text, /📩 <b>Обращение в бота<\/b> · Shahzod \(@floraedu\)/);
  assert.match(text, /«Narxi &lt;b&gt;qancha&lt;\/b&gt;\?»/, "слова клиента экранированы");
  assert.match(text, /🤖 Бот ответил: «Смету пришлём сегодня\.»/);
  assert.match(text, /🧾 DZ-1022-DJ79 · .*\/admin\/leads\/L1/);
  assert.match(text, /↩️ Ответьте на это сообщение — ответ уйдёт клиенту от бота студии/);
  const held = inboxNotice({ client, text: "?", botReply: "не должно быть", lead: null, human: "Егор" });
  assert.match(held, /🤐 Модель молчит: разговор ведёт Егор\./);
  assert.doesNotMatch(held, /Бот ответил/);
});

test("ночью — не сразу, а утром: кто писал и что последнее", () => {
  const text = nightNotice({ client, text: "Salom", at: "2026-10-22T18:54:00Z", lead: null });
  assert.match(text, /🌙 <b>Писал боту ночью<\/b>, 23:54 · Shahzod \(@floraedu\)/);
  assert.match(text, /Последнее: «Salom»/);
  assert.match(text, /↩️ Ответьте на это сообщение/);
  const store = read("lib/qualify/bot-inbox-store.ts");
  const notify = store.slice(store.indexOf("export async function notifyInbox"), store.indexOf("export async function relayInboxReply"));
  assert.match(notify, /if \(!messageWindow\(now\) \|\| !input\.text\.trim\(\)\) return sent;/, "ночью строк нет — правило «Ночью бот молчит»");
  const night = store.slice(store.indexOf("export async function sendNightInbox"));
  assert.match(night, /bot-night:\$\{day\}/, "раз в день на читателя");
  assert.match(night, /!staff\.has\(Number\(u\.chat_id\)\)/, "сотрудники в сводку не попадают");
  assert.match(read("app/api/reminders/sweep/route.ts"), /await sendNightInbox\(new Date\(\)\)/);
});

test("галочка «Обращения в бота» — только владельцу и руководителю", () => {
  assert.deepEqual([...NOTICES.bot.roles], ["admin", "head"]);
  assert.ok(kindsFor("admin").includes("bot"));
  assert.ok(kindsFor("head").includes("bot"));
  assert.ok(!kindsFor("manager").includes("bot"));
  const store = read("lib/qualify/bot-inbox-store.ts");
  assert.match(store, /\.in\("role", \["admin", "head"\]\)/);
});

test("ответ сотрудника уходит клиенту копией от бота, модель замолкает на неделю", () => {
  assert.equal(HUMAN_HOLD_DAYS, 7);
  const now = new Date("2026-10-23T10:00:00Z");
  assert.equal(humanHolds("2026-10-22T10:00:00Z", now), true);
  assert.equal(humanHolds("2026-10-15T09:59:00Z", now), false);
  assert.equal(humanHolds(null, now), false);

  const store = read("lib/qualify/bot-inbox-store.ts");
  const relay = store.slice(store.indexOf("export async function relayInboxReply"), store.indexOf("async function afterHuman"));
  assert.match(relay, /\.from\("bot_inbox_notices"\)[\s\S]*\.eq\("staff_chat", message\.chat\.id\)[\s\S]*\.eq\("message_id", replyTo\)/);
  assert.match(relay, /await staffByTelegramId\(message\.from\.id\)/, "отвечает только сотрудник");
  assert.match(relay, /copyMessage\(clientChat, message\.chat\.id, message\.message_id\)/, "от бота, не с личного аккаунта");
  assert.match(relay, /await afterHuman\(\{ clientChat, staff, words, kind: message\.text \? "text" : "file", via: "bot", fromChat: message\.chat\.id \}\)/);
  assert.ok(relay.indexOf("copyMessage(") < relay.indexOf("afterHuman("), "не ушло — модель не глушим");

  const hook = read("app/api/telegram/webhook/route.ts");
  const route = hook.slice(hook.indexOf("async function route"), hook.indexOf("async function handleCircleUpload"));
  assert.ok(route.indexOf("relayInboxReply(") < route.indexOf("circleFromMessage("), "ответ кружком или голосовым тоже уходит клиенту");
  assert.ok(route.indexOf("relayInboxReply(") < route.indexOf("voiceFromMessage("));
  const respond = hook.slice(hook.indexOf("async function respond("), hook.indexOf("function channelNote("));
  assert.ok(respond.indexOf("await humanOf(chatId)") < respond.indexOf("runQualifyTurn("), "человек ведёт — модель не зовём");
  assert.match(respond, /if \(human\) \{[\s\S]*notifyInbox\(\{ client, text, botReply: null, human \}\)[\s\S]*return;\n  \}/);
  assert.match(respond, /notifyInbox\(\{ client, text, botReply: reply\.trim\(\) \|\| null, human: null \}\)/);
});

test("таблица номеров уведомлений — только сервер", () => {
  const sql = read("supabase/migrations/0171_bot_inbox.sql");
  assert.match(sql, /primary key \(staff_chat, message_id\)/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on public\.bot_inbox_notices from anon, authenticated/);
});

test("«Написать клиенту в бот»: первым, от бота, только тем, кому открыт контакт", () => {
  const store = read("lib/qualify/bot-inbox-store.ts");
  const write = store.slice(store.indexOf("export async function writeToClient"));
  assert.match(write, /if \(!words\) return "bot_empty";/);
  assert.match(write, /if \(!chat\) return "bot_no_chat";/, "клиенту, который боту не писал, бот первым не напишет");
  assert.match(write, /sendMessage\(chat, esc\(words\)\)/, "текст экранируется");
  assert.match(write, /afterHuman\(\{ clientChat: chat, staff: input\.staff, words, kind: "text", via: "panel", fromChat: null \}\)/, "дальше — как ответ из бота: модель молчит, журнал, карточка");
  const chatOf = store.slice(store.indexOf("export async function botChatOf"), store.indexOf("export type BotWriteResult"));
  assert.match(chatOf, /\.is\("blocked_at", null\)/);
  const after = store.slice(store.indexOf("async function afterHuman"), store.indexOf("export const BOT_WRITE_MAX"));
  assert.match(after, /human_at: new Date\(\)\.toISOString\(\), human_by: staff\.id/);
  assert.match(after, /record\("bot\.replied"/);

  const actions = read("app/admin/leads/[id]/actions.ts");
  const action = actions.slice(actions.indexOf("export async function writeToClientAction"));
  assert.match(action, /if \(!lead \|\| !canReveal\(lead, staff\)\) redirect/, "свободный лид — только владельцу, чужой — не менеджеру");
  const page = read("app/admin/leads/[id]/page.tsx");
  assert.match(page, /const botChat = reveals && lead\.tg_username \? await botChatOf\(lead\.tg_username\)/);
  assert.match(page, /\{botChat \? \(\s*<details id="botwrite"/);
});
