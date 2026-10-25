/**
 * Кнопка «Исправить» у отправленного касания (lib/admin/outreach-edit-request.ts).
 *
 * Владелец, 12.10.2026: «Оптимизация скрипта, чтобы манагеры редачили
 * касания». Очередь правок (outreach_edits) и её разбор скаутом были, а
 * поставить правку из панели было нечем. С 07.10.2026 первым уходит
 * «Здравствуйте», и номер первого сообщения — номер приветствия: правка
 * «письма» по нему заменила бы приветствие письмом. Поэтому правка теперь
 * знает реплику ленты, а скаут запоминает номер каждой отправленной.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { EDIT_WINDOW_MS, editState, isHelloLine, lineEditable } from "@/lib/admin/outreach-edit";
import { mayEditTouch, replyEditProblem } from "@/lib/admin/outreach-edit-request";
import { STAFF_REPLY_MAX } from "@/lib/admin/outreach-talk-store";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const NOW = Date.parse("2026-10-12T12:00:00Z");
const TOUCH = { hello_at: "2026-10-11T09:00:00Z", pitch_at: "2026-10-11T10:00:00Z" };
const line = (over: Record<string, unknown> = {}) => ({
  direction: "out",
  kind: "text",
  status: "sent",
  created_at: "2026-10-11T10:03:00Z",
  sent_at: "2026-10-11T10:03:30Z",
  tg_message_id: 4242,
  ...over,
});

test("«Исправить» — у нашего текстового сообщения, 48 часов после отправки", () => {
  assert.equal(lineEditable(line(), TOUCH, NOW), true);
  // В очереди — правится всегда: уйдёт уже исправленным.
  assert.equal(lineEditable(line({ status: "queued", sent_at: null, tg_message_id: null }), TOUCH, NOW), true);
  // Окно Telegram прошло.
  const late = new Date(NOW - EDIT_WINDOW_MS - 60_000).toISOString();
  assert.equal(lineEditable(line({ sent_at: late }), TOUCH, NOW), false);
  // Номера нет — ушло до того, как скаут стал его запоминать.
  assert.equal(lineEditable(line({ tg_message_id: null }), TOUCH, NOW), false);
  // Кружок, сообщение клиента, не ушедшее и снятое — не правятся.
  assert.equal(lineEditable(line({ kind: "circle" }), TOUCH, NOW), false);
  assert.equal(lineEditable(line({ direction: "in" }), TOUCH, NOW), false);
  assert.equal(lineEditable(line({ status: "failed" }), TOUCH, NOW), false);
  assert.equal(lineEditable(line({ status: "done" }), TOUCH, NOW), false);
});

test("приветствие не правится: до ответа клиента уходит только оно", () => {
  const hello = line({ created_at: "2026-10-11T09:00:00Z", sent_at: "2026-10-11T09:00:00Z" });
  assert.equal(isHelloLine(hello, TOUCH), true);
  assert.equal(lineEditable(hello, TOUCH, NOW), false);
  // Ответа ещё не было — всё наше в ленте и есть приветствие.
  assert.equal(isHelloLine(line(), { hello_at: TOUCH.hello_at, pitch_at: null }), true);
  // Письмо после ответа — не приветствие; касание до правила (hello_at нет) — тоже.
  assert.equal(isHelloLine(line(), TOUCH), false);
  assert.equal(isHelloLine(line(), { hello_at: null, pitch_at: null }), false);
});

test("чем кончилась правка: ждёт бота, исправлено или не вышло", () => {
  assert.equal(editState({ done_at: null, failure: null }), "waiting");
  assert.equal(editState({ done_at: "2026-10-12T10:00:00Z", failure: null }), "done");
  assert.equal(editState({ done_at: null, failure: "Письма с этим номером в переписке нет — его удалили." }), "failed");
});

test("кто может исправить: кто ведёт касание, руководитель и владелец", () => {
  const p = { claimed_by: "m1", touched_by: "m1", handled_by: null };
  assert.equal(mayEditTouch(p, { id: "m1", role: "manager" }), true);
  assert.equal(mayEditTouch(p, { id: "m2", role: "manager" }), false);
  assert.equal(mayEditTouch(p, { id: "h", role: "head" }), true);
  assert.equal(mayEditTouch(p, { id: "a", role: "admin" }), true);
  // Ответ клиенту ведёт тот, кому передали разговор.
  assert.equal(mayEditTouch({ ...p, handled_by: "m2" }, { id: "m2", role: "manager" }), true);
});

test("ответ в переписке проверяется как ответ менеджера из карточки лида", () => {
  assert.equal(replyEditProblem("  "), "empty");
  assert.equal(replyEditProblem("x".repeat(STAFF_REPLY_MAX + 1)), "too_long");
  assert.equal(replyEditProblem("Да, пришлю сегодня вечером."), null);
});

test("письмо о сайте проверяется так же, как перед отправкой", () => {
  const lib = read("lib/admin/outreach-edit-request.ts");
  // Та же проверка, без дубля: sendProblems с новым текстом.
  assert.match(lib, /sendProblems\(\{ \.\.\.prospect, message: body \}, sender\)/);
  // Проверка сайта перед письмом уже была — правка не добавляет фактов.
  assert.match(lib, /filter\(\(p\) => p\.code !== "not_checked"\)/);
  // Права и журнал.
  assert.match(lib, /if \(!input\.leadOwner && !mayEditTouch\(prospect, input\.staff\)\) return \{ ok: false, reason: "forbidden" \}/);
  assert.match(lib, /record\("prospect\.edit_requested"/);
  // Письмо до ответа правится, только пока оно не ушло.
  assert.match(lib, /\.update\(\{ message: body \}\)\s*\.eq\("id", prospect\.id\)\s*\.is\("pitch_at", null\)/);
  // Ушедшее — в очередь скаута, с репликой.
  assert.match(lib, /from\("outreach_edits"\)\.insert\(\{\s*prospect_id: prospect\.id,\s*message_id: line\.id,/);

  const action = read("app/admin/prospect/actions.ts");
  const edit = action.slice(action.indexOf("export async function editSentAction"));
  assert.match(edit, /const staff = await requireStaff\(\);/);
  // Свой лид — право, только если это лид той же карточки.
  assert.match(edit, /canEdit\(lead, staff\)\) leadOwner = \(await prospectById\(prospectId\)\)\?\.lead_id === leadId/);
});

test("скаут запоминает номер ушедшего и правит именно его", () => {
  const runner = read("scout/runner.mjs");
  assert.match(runner, /await markReplySent\(reply\.id, sent\?\.id \?\? null\);/);
  const talk = read("lib/admin/outreach-talk-store.ts");
  assert.match(talk, /tg_message_id: number/);

  const edit = read("lib/admin/outreach-edit.ts");
  // Правка реплики: номер — её, окно — от её отправки.
  assert.match(edit, /messageId: Number\(line\.tg_message_id\)/);
  assert.match(edit, /lineId: line\.id/);
  // Без реплики после «Здравствуйте» правка заменила бы приветствие — не делаем.
  assert.match(edit, /if \(p\?\.hello_at\) \{\s*await markEditFailed\(/);
  // Лента — тем текстом, что теперь у человека.
  assert.match(edit, /from\("outreach_messages"\)\.update\(\{ body: job\.body \}\)\.eq\("id", job\.lineId\)/);
});

test("база: номер сообщения, реплика и автор правки; доступ закрыт", () => {
  const sql = read("supabase/migrations/0153_outreach_edit_button.sql");
  assert.match(sql, /add column if not exists tg_message_id bigint/);
  assert.match(sql, /add column if not exists message_id uuid references public\.outreach_messages \(id\) on delete cascade/);
  assert.match(sql, /add column if not exists staff_id uuid references public\.staff \(id\) on delete set null/);
  assert.match(sql, /alter table public\.outreach_edits enable row level security/);
  const down = read("supabase/migrations/0153_outreach_edit_button.down.sql");
  assert.match(down, /drop column if exists tg_message_id/);
  assert.match(down, /drop column if exists message_id/);
});

test("кнопка — в карточке касания и в чате карточки лида, со статусом правки", () => {
  const list = read("components/admin/outreach-list.tsx");
  assert.match(list, /viewer && mayClose\(row, viewer\) && \(edits\[row\.id\] \|\| lastEdits\[row\.id\]\) \? \(\s*<EditSent/);
  const chat = read("components/admin/lead-timeline.tsx");
  assert.match(chat, /prospectId && line\.direction === "out" && \(line\.editable \|\| line\.edit\) \? \(\s*<EditSent/);
  const button = read("components/admin/edit-sent.tsx");
  assert.match(button, /editSentAction\(/);
  assert.match(button, /t\.stateFailed\(shown\.failure/);
  // Инструкция — на трёх языках.
  for (const file of ["content/admin-help-ru.ts", "content/admin-help-uz.ts", "content/admin-help-pl/prospect.ts"]) {
    const help = read(file);
    assert.match(help, /id: "edit-sent"/, file);
    assert.match(help, /id: "hello-text"/, file);
  }
});
