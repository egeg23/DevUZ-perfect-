import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { editOutcome, sentCheck } from "@/lib/admin/outreach-edit";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const JOB = { userId: "5550001", messageId: 42 };

function message(over: Record<string, unknown> = {}) {
  return {
    className: "Message",
    id: 42,
    out: true,
    peerId: { className: "PeerUser", userId: { toString: () => "5550001" } },
    ...over,
  };
}

test("ответ Telegram на правку: «не изменилось» — сделано, «время вышло» — граница", () => {
  // Повторная правка тем же текстом или правка, сделанная руками с
  // телефона, приходит отказом MESSAGE_NOT_MODIFIED. Считать её провалом —
  // значит показать сбой там, где письмо уже такое, какое нужно.
  assert.equal(editOutcome("400: MESSAGE_NOT_MODIFIED (caused by messages.EditMessage)"), "done");
  assert.equal(editOutcome("MESSAGE_EDIT_TIME_EXPIRED"), "expired");
  assert.equal(editOutcome("FLOOD_WAIT_30"), "failed");
  assert.equal(editOutcome("Could not find the input entity"), "failed");
});

test("письмо правится, только если оно наше и ушло тому, кто в карточке", () => {
  const user = { className: "User", id: { toString: () => "5550001" }, accessHash: 7 };

  const ok = sentCheck({ messages: [message()], users: [user] }, JOB);
  assert.equal(ok.ok, true);
  // Адресат для правки — объект из ответа, с ключом доступа, а не голый
  // номер: после перезапуска скаута по голому номеру переписку не найти.
  assert.equal(ok.ok && ok.user, user);

  // Удалённое письмо приходит объектом MessageEmpty с тем же номером.
  const gone = sentCheck({ messages: [{ className: "MessageEmpty", id: 42 }] }, JOB);
  assert.equal(gone.ok, false);
  assert.equal(sentCheck({ messages: [] }, JOB).ok, false);
  assert.equal(sentCheck(null, JOB).ok, false);

  // Номер тот, но письмо написали нам.
  assert.equal(sentCheck({ messages: [message({ out: false })] }, JOB).ok, false);

  // Номер тот, но переписка с другим человеком или это группа.
  const other = message({ peerId: { className: "PeerUser", userId: { toString: () => "999" } } });
  assert.equal(sentCheck({ messages: [other] }, JOB).ok, false);
  const chat = message({ peerId: { className: "PeerChat", chatId: 5550001 } });
  assert.equal(sentCheck({ messages: [chat] }, JOB).ok, false);

  // Номер другого письма — не наш случай.
  assert.equal(sentCheck({ messages: [message({ id: 43 })] }, JOB).ok, false);

  // Пользователя в ответе нет — правим по номеру, хуже не будет.
  const bare = sentCheck({ messages: [message()] }, JOB);
  assert.equal(bare.ok && bare.user, "5550001");
});

test("скаут сверяет письмо до правки и записывает правку после", () => {
  const runner = read("scout/runner.mjs");
  const step = runner.slice(runner.indexOf("nextEdit()"));
  const check = step.indexOf("sentCheck(");
  const edit = step.indexOf("client.editMessage(");
  const mark = step.indexOf("markEdited(job)");

  assert.ok(check > 0 && edit > check, "письмо сверяется до правки");
  assert.ok(mark > edit, "в базе правка отмечается после того, как прошла");
  assert.match(step, /editOutcome\(/, "ответ Telegram разбирается, а не пишется сбоем целиком");
});

test("очередь правок: таблица с прежним текстом и закрытым доступом", () => {
  const sql = read("supabase/migrations/0062_outreach_edits.sql");
  assert.match(sql, /create table if not exists public\.outreach_edits/);
  // Прежний текст хранится: письмо уже прочитано, и вопрос «что человек
  // видел сначала» иначе не с чем сопоставить.
  assert.match(sql, /previous text/);
  assert.match(sql, /alter table public\.outreach_edits enable row level security/);

  // Карточка и лента переписки получают новый текст: модель, отвечая
  // клиенту, опирается на них.
  const lib = read("lib/admin/outreach-edit.ts");
  assert.match(lib, /from\("prospects"\)\s*\.update\(\{ message: job\.body \}\)/);
  assert.match(lib, /from\("outreach_messages"\)/);
});
