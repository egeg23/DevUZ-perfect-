/**
 * «✏️ Изменить текст» под карточкой касания в боте (lib/admin/bot-text-edit.ts).
 *
 * Владелец, 16.10.2026: «можем ли мы сделать как в панели, чтобы через бота
 * можно было редактировать текст?» Проверки — те же, что у панели, права —
 * как у соседних кнопок, ответ находит карточку по номеру просьбы.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  EDIT_BUTTON,
  EDIT_TTL_MS,
  REFUSAL,
  askFresh,
  askText,
  editCallback,
  editErrorReply,
  editStage,
  mayEditFromBot,
  problemsReply,
} from "@/lib/admin/bot-text-edit";
import { closeRows, itemButtons } from "@/lib/admin/portion-store";
import type { Prospect } from "@/lib/admin/outreach-store";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ID = "0b8a1c7e-3f4d-4c2a-9e1b-5d6f7a8b9c0d";
const ME = { id: "me", role: "manager" as const };
const OTHER = { id: "other", role: "manager" as const };
const HEAD = { id: "boss", role: "head" as const };
const ADMIN = { id: "owner", role: "admin" as const };

const card = (over: Record<string, unknown> = {}) => ({
  status: "new",
  message: "Текст письма",
  claimed_by: null as string | null,
  touched_by: null as string | null,
  ...over,
});

test("кнопка — только там, где текст уже есть, и влезает в предел Telegram", () => {
  assert.ok(Buffer.byteLength(editCallback(ID)) <= 64);
  const base = { id: ID, contacts: { telegram: ["@client"] }, message: "Текст" } as unknown as Prospect;
  const has = itemButtons(base).flat().some((b) => "callback_data" in b && b.callback_data === editCallback(ID));
  assert.equal(has, true);
  const none = itemButtons({ ...base, message: null } as Prospect).flat().some((b) => b.text === EDIT_BUTTON);
  assert.equal(none, false);
  // Письмо в очереди — тоже можно поправить; после «Написал сам» — нечего.
  assert.ok(closeRows(ID, "в очереди", true).flat().some((b) => b.text === EDIT_BUTTON));
  assert.ok(!closeRows(ID, "написал сам").flat().some((b) => b.text === EDIT_BUTTON));
});

test("путь правки — от состояния касания", () => {
  assert.equal(editStage(card()), "card");
  assert.equal(editStage(card({ status: "contacting" })), "card");
  assert.equal(editStage(card({ message: null })), "closed");
  assert.equal(editStage(card({ status: "sending" })), "queued");
  assert.equal(editStage(card({ status: "sending", message: null })), "closed");
  assert.equal(editStage(card({ status: "sent" })), "sent");
  for (const status of ["closed", "skipped", "manual", "failed"]) assert.equal(editStage(card({ status })), "closed");
});

test("права: своя карточка, у руководителя и владельца — любая", () => {
  // До отправки: своя порция или поток на сегодня.
  assert.equal(mayEditFromBot(card(), ME, true), true);
  assert.equal(mayEditFromBot(card(), OTHER, false), false);
  assert.equal(mayEditFromBot(card(), HEAD, false), true);
  assert.equal(mayEditFromBot(card(), ADMIN, false), true);
  // В очереди — как «Напишу сам»: своё письмо.
  const queued = card({ status: "sending", claimed_by: "me" });
  assert.equal(mayEditFromBot(queued, ME, false), true);
  assert.equal(mayEditFromBot(queued, OTHER, true), false);
  assert.equal(mayEditFromBot(queued, HEAD, false), true);
  // Ушло — как «Исправить» в панели: кто ведёт касание.
  const sent = card({ status: "sent", claimed_by: "me", touched_by: "me" });
  assert.equal(mayEditFromBot(sent, ME, false), true);
  assert.equal(mayEditFromBot(sent, OTHER, false), false);
  assert.equal(mayEditFromBot(sent, ADMIN, false), true);
  // Закрытую — никто.
  assert.equal(mayEditFromBot(card({ status: "closed" }), ADMIN, true), false);
});

test("просьба живёт сутки", () => {
  const now = Date.parse("2026-10-16T12:00:00Z");
  assert.equal(askFresh(new Date(now - 60_000).toISOString(), now), true);
  assert.equal(askFresh(new Date(now - EDIT_TTL_MS - 1).toISOString(), now), false);
  assert.equal(askFresh("мусор", now), false);
});

test("просьба: текст копируется, ответ — на это сообщение", () => {
  const text = askText({ label: "Кафе <1>", host: "cafe.uz", message: " Письмо & <b> " }, esc);
  assert.match(text, /<code>Письмо &amp; &lt;b&gt;<\/code>/);
  assert.match(text, /Кафе &lt;1&gt;/);
  assert.match(text, /ответом на это сообщение/);
});

test("отказ — словами, проблемы — теми же, что в панели", () => {
  const reply = problemsReply([{ code: "long", text: "Письмо длиннее 100 слов." }], esc);
  assert.match(reply, /Письмо длиннее 100 слов/);
  assert.match(reply, /карточка осталась прежней/);
  assert.equal(editErrorReply("forbidden"), REFUSAL.forbidden);
  assert.equal(editErrorReply("gone"), REFUSAL.gone);
  assert.equal(editErrorReply("not_editable"), REFUSAL.gone);
  assert.match(editErrorReply("too_late"), /48 часов/);
});

test("хранилище: те же проверки, что у панели, чужой ответ и старая просьба — отказ", () => {
  const store = read("lib/admin/bot-text-edit-store.ts");
  // До отправки — как «Отправить», в очереди — как «Исправить», ушло — requestEdit.
  assert.match(store, /sendProblems\(\{ \.\.\.prospect, message: body \}/);
  assert.match(store, /letterEditProblems\(prospect, body/);
  assert.match(store, /requestEdit\(\{ prospectId: prospect\.id, lineId: null/);
  assert.match(store, /ask\.staff_id !== staff\.id\) return \{ ok: false, why: REFUSAL\.notYours/);
  assert.match(store, /!askFresh\(ask\.created_at, now\)\) return \{ ok: false, why: REFUSAL\.stale/);
  // Запись — условная: письмо могли отправить, пока правили.
  assert.match(store, /\.in\("status", stage === "card" \? \["new", "contacting"\] : \["sending"\]\)/);
  assert.match(store, /record\("prospect\.edit_requested"/);
  assert.match(store, /from\("outreach_edits"\)\.insert/);
});

test("вебхук: ответ на просьбу разбирается до прочего текста, просьба — force_reply", () => {
  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /action === "edit"\) \{\s*await askTextEdit/);
  assert.ok(hook.indexOf("handleTextEditReply(update.message)") < hook.indexOf("handleTaskDate(update.message)"));
  assert.match(hook, /sendForceReply\(chat, askText/);
  assert.match(hook, /rememberAsk\(chat, id, prospectId, staff\.id\)/);
  assert.match(read("lib/qualify/telegram.ts"), /force_reply: true/);
  const sql = read("supabase/migrations/0167_bot_text_edits.sql");
  assert.match(sql, /primary key \(chat_id, prompt_message_id\)/);
});
