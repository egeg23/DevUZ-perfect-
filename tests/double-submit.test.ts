/**
 * Повторное нажатие не должно превращаться в повторное действие.
 *
 * 23 сентября кнопка «Поставить» в карточке лида за тридцать секунд
 * записала одно и то же напоминание 23 раза, а «Отправить» — одно и то же
 * сообщение в обсуждение 12 раз: страница сохраняла, кнопка оставалась
 * живой, человек нажимал ещё. Назавтра пришли бы 23 одинаковых
 * напоминания разом.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { DUPLICATE_WINDOW_MS } from "@/lib/admin/ownership";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("сервер: то же напоминание пару минут спустя не записывается второй раз", () => {
  assert.equal(DUPLICATE_WINDOW_MS, 2 * 60_000);
  const store = read("lib/admin/ownership.ts");
  const create = store.slice(store.indexOf("export async function createReminder"));
  assert.ok(
    create.indexOf("sameReminderJustMade") < create.indexOf('from("lead_reminders").insert'),
    "проверка повтора должна стоять до записи",
  );
});

test("сервер: тот же текст в обсуждении пару минут спустя не записывается второй раз", () => {
  const messages = read("lib/admin/messages.ts");
  const post = messages.slice(messages.indexOf("export async function postMessage"));
  assert.match(post, /\.eq\("body", text\)/);
  assert.ok(post.indexOf('.eq("body", text)') < post.indexOf('from("lead_messages").insert'));
});

test("кнопки: пока идёт сохранение, они серые и не нажимаются", () => {
  const card = read("app/admin/leads/[id]/page.tsx");
  const reminderForm = card.slice(card.indexOf("<form action={addReminder}"));
  assert.match(reminderForm.slice(0, reminderForm.indexOf("</form>")), /<SubmitButton/);
  const thread = read("components/admin/lead-thread.tsx");
  assert.match(thread.slice(thread.indexOf("<form action={sendMessageToThread}")), /<SubmitButton/);
});

test("«новый» бывает только у свободного лида", () => {
  // 23 сентября менеджер нажала «новый», продолжая работать с лидом: лид
  // стал «новым», но остался закреплён — в свободных его нет, взять нельзя.
  const store = read("lib/admin/ownership.ts");
  assert.match(store, /if \(status === "new" && lead\.assigned_staff_id\) return \{ ok: false/);
  const card = read("app/admin/leads/[id]/page.tsx");
  assert.match(card, /STATUSES\.filter\(\(value\) => value !== "new" \|\| !lead\.assigned_staff_id\)/);
});
