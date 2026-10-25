/**
 * «Входящие» — одна очередь того, что ждёт ответа человека (lib/admin/inbox.ts).
 *
 * Владелец, 25.10.2026, на разбор «чем мы уступаем HubSpot и Close»:
 * «Погнали по порядку». Касания, где отвечать должен человек, и обращения в
 * бота, где разговор ведёт человек, — одной очередью, ответ — в строке.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { botWaits, inboxFor, seesBotInbox, touchWaits, waitedMinutes, type InboxItem } from "@/lib/admin/inbox";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const NOW = Date.parse("2026-10-25T09:00:00Z");

test("касание ждёт человека: модель отпустила, не закрыто, не автоответчик", () => {
  assert.equal(touchWaits({ ai_handling: false, closed_at: null }, { kind: "text" }), true);
  assert.equal(touchWaits({ ai_handling: true, closed_at: null }, { kind: "text" }), false, "ведёт модель");
  assert.equal(touchWaits({ ai_handling: false, closed_at: "2026-10-24T00:00:00Z" }, { kind: "text" }), false, "закрыто");
  assert.equal(touchWaits({ ai_handling: false, closed_at: null }, { kind: "auto" }), false, "автоответчик");
});

test("бот ждёт человека: разговор ведёт человек, клиент написал после него, 7 дней", () => {
  const u = { human_at: "2026-10-24T08:00:00Z", last_text_at: "2026-10-24T09:00:00Z", blocked_at: null };
  assert.equal(botWaits(u, NOW, 7), true);
  assert.equal(botWaits({ ...u, last_text_at: "2026-10-24T07:00:00Z" }, NOW, 7), false, "ответ человека последний");
  assert.equal(botWaits({ ...u, human_at: null }, NOW, 7), false, "ведёт модель");
  assert.equal(botWaits({ ...u, blocked_at: "2026-10-24T10:00:00Z" }, NOW, 7), false, "заблокировал");
  assert.equal(botWaits(u, Date.parse("2026-11-05T00:00:00Z"), 7), false, "7 дней прошли — снова модель");
});

test("кто что видит: менеджер — свои касания, руководитель и владелец — все и бота; дольше ждёт — выше", () => {
  const items = [
    { kind: "touch", prospectId: "p1", leadId: "l1", label: "A", since: "2026-10-25T08:00:00Z", text: "", ownerId: "me", mine: { hasLead: true, leadOwner: "me", handled_by: null, claimed_by: null, touched_by: null } },
    { kind: "touch", prospectId: "p2", leadId: null, label: "B", since: "2026-10-25T07:00:00Z", text: "", ownerId: "x", mine: { hasLead: false, leadOwner: null, handled_by: "x", claimed_by: null, touched_by: null } },
    { kind: "bot", chatId: 5, label: "C", since: "2026-10-25T06:00:00Z", text: "", ownerId: "x" },
  ] as Parameters<typeof inboxFor>[0];
  const key = (list: InboxItem[]) => list.map((i) => i.label);
  assert.deepEqual(key(inboxFor(items, { id: "me", role: "manager" })), ["A"]);
  assert.deepEqual(key(inboxFor(items, { id: "me", role: "head" })), ["C", "B", "A"]);
  assert.equal(seesBotInbox("manager"), false);
  assert.ok(!("mine" in inboxFor(items, { id: "me", role: "admin" })[0]), "служебное поле наружу не уходит");
  assert.equal(waitedMinutes("2026-10-25T08:00:00Z", NOW), 60);
});

test("ответ из строки — теми же действиями и проверками, что в карточке", () => {
  const reply = read("components/admin/inbox-reply.tsx");
  assert.match(reply, /sendFromCardAction\(props\.leadId, "touch", body, props\.prospectId\)/);
  assert.match(reply, /replyBotAction\(props\.chatId, body\)/);
  const action = read("app/admin/inbox/actions.ts");
  assert.match(action, /if \(!seesBotInbox\(staff\.role\)\) return \{ ok: false, reason: "forbidden" \}/);
  const bot = read("lib/qualify/bot-inbox-store.ts");
  const chat = bot.slice(bot.indexOf("export async function writeToBotChat("));
  assert.ok(chat.indexOf('return "bot_bad_link"') > 0 && chat.indexOf('return "bot_bad_link"') < chat.indexOf("writeToChat("), "ссылки проверяются до отправки");
  assert.match(read("app/admin/inbox/page.tsx"), /requireSection\("\/admin\/inbox"\)/);
  assert.match(read("lib/admin/inbox-store.ts"), /seesBotInbox\(viewer\.role\)\s*\?\s*db\s*\.from\("bot_users"\)/);
});
