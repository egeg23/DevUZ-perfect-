/**
 * Ответ на рассылку «Пользователям бота» — с её текстом (lib/admin/bot-users.ts).
 *
 * Владелец, 25.10.2026: «Если мы напишем рассылкой сообщение, бот подхватит
 * дальнейшее общение с теми кто продолжит диалог?» — и на найденную дыру:
 * «Делай». Рассылка уходит мимо переписки бота, и на «Да» после «Хотите
 * бесплатный макет?» модель видела одно «Да» и знакомилась заново.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { BROADCAST_CONTEXT_MS, broadcastTurn } from "@/lib/admin/bot-users";

const NOW = Date.parse("2026-10-25T12:00:00Z");
const sent = (hoursAgo: number) => ({ text: "Хотите бесплатный макет сайта?", at: new Date(NOW - hoursAgo * 3_600_000).toISOString() });

test("новый разговор после рассылки — рассылка встаёт репликой студии", () => {
  assert.equal(broadcastTurn([], null, sent(2), NOW), "Хотите бесплатный макет сайта?");
  assert.equal(broadcastTurn([], NOW, sent(2), NOW), "Хотите бесплатный макет сайта?", "только что открытая переписка — тоже");
});

test("старая переписка, а рассылка пришла после неё — тоже", () => {
  const talk = [{ role: "user", content: "Сколько стоит лендинг?" }, { role: "assistant", content: "От 500 $." }];
  assert.equal(broadcastTurn(talk, NOW - 5 * 3_600_000, sent(2), NOW), "Хотите бесплатный макет сайта?");
});

test("не вставляем: рассылки нет, она старше трёх дней, уже в переписке, разговор после неё уже шёл", () => {
  assert.equal(broadcastTurn([], null, null, NOW), null);
  assert.equal(broadcastTurn([], null, sent(BROADCAST_CONTEXT_MS / 3_600_000 + 1), NOW), null);
  const already = [{ role: "assistant", content: "Хотите бесплатный макет сайта?" }, { role: "user", content: "Да" }];
  assert.equal(broadcastTurn(already, NOW, sent(2), NOW), null);
  const after = [{ role: "user", content: "Привет" }];
  assert.equal(broadcastTurn(after, NOW - 3_600_000, sent(2), NOW), null);
  assert.equal(broadcastTurn([], null, { text: "  ", at: new Date(NOW).toISOString() }, NOW), null);
});

test("бот: рассылка — перед словами клиента и в заметке модели; продолжение с сайта — без неё", () => {
  const hook = readFileSync(new URL("../app/api/telegram/webhook/route.ts", import.meta.url), "utf8");
  const respond = hook.slice(hook.indexOf("async function respond("), hook.indexOf("const stopTyping", hook.indexOf("async function respond(")));
  assert.match(respond, /options\.resuming\s*\? null\s*: broadcastTurn\(session\.transcript, session\.updatedAt \?\? null, await lastBroadcastTo\(chatId\)/);
  assert.ok(respond.indexOf("broadcastTurn(") < respond.indexOf("const history = [...session.transcript"), "рассылка встаёт до ответа клиента");
  assert.match(hook, /broadcast \? BROADCAST_NOTE : null/);
  const store = readFileSync(new URL("../lib/admin/bot-users-store.ts", import.meta.url), "utf8");
  assert.match(store, /\.eq\("status", "sent"\)\s*\.gt\("at", new Date\(now - BROADCAST_CONTEXT_MS\)/);
});
