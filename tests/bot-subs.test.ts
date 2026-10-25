/**
 * «Подписчики бота» на «Главной» (lib/admin/bot-users.ts → botSubs).
 *
 * Владелец, 25.10.2026: «Выведи мне и руководителям количество подписчиков в
 * боте со статистикой 24 часа / 7 дней / месяц… Как посмотреть сколько
 * пользователей не понимаю». Счёт правилами по bot_users, без модели:
 * сотрудники не считаются, «сейчас в боте» — те, кому дойдёт рассылка «Всем».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { audienceOf, botSubs, type BotUser, type Marks } from "@/lib/admin/bot-users";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const NOW = new Date("2026-10-25T10:00:00Z");
const ago = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const user = (chat_id: number, firstH: number, lastH: number, blocked = false): BotUser => ({
  chat_id,
  username: null,
  first_name: null,
  blocked_at: blocked ? ago(1) : null,
  first_at: ago(firstH),
  last_at: ago(lastH),
});
const marks: Marks = { staff: new Set([9]), partners: new Set(), buyers: new Set() };

test("новые за сутки, неделю и месяц — и столько же до них, для сравнения", () => {
  const users = [
    user(1, 2, 1), // сегодня
    user(2, 30, 30), // вчера: прошлые сутки
    user(3, 24 * 5, 24 * 5), // на неделе
    user(4, 24 * 10, 3), // прошлая неделя, но заходил сегодня
    user(5, 24 * 40, 24 * 40), // прошлый месяц
    user(6, 24 * 20, 24 * 20, true), // заблокировал
    user(9, 1, 1), // сотрудник — нигде не считается
  ];
  const s = botSubs(users, marks, NOW);
  assert.equal(s.total, 5, "сейчас в боте: без сотрудника и заблокировавшего");
  assert.equal(s.total, audienceOf(users, marks, "all").length, "то же число, что у рассылки «Всем»");
  assert.equal(s.blocked, 1);
  assert.deepEqual(s.fresh.day, { now: 1, prev: 1 });
  assert.deepEqual(s.fresh.week, { now: 3, prev: 1 });
  assert.deepEqual(s.fresh.month, { now: 5, prev: 1 });
  assert.deepEqual(s.active, { day: 2, week: 4, month: 5 });
});

test("пустой бот — нули, не падает", () => {
  const s = botSubs([], marks, NOW);
  assert.equal(s.total, 0);
  assert.deepEqual(s.fresh.month, { now: 0, prev: 0 });
});

test("блок — на «Главной» владельцу и руководителю, с «?» в инструкцию", () => {
  assert.match(read("lib/admin/bot-users-store.ts"), /select\("chat_id, username, first_name, blocked_at, first_at, last_at"\)/);
  const page = read("app/admin/hq/page.tsx");
  assert.match(page, /subs=\{audience \? botSubs\(audience\.users, audience\.marks, now\) : null\}/);
  // Аудиторию грузят только тем, кто шлёт рассылки, — владельцу и руководителю.
  assert.match(page, /broadcasts \? memo\("hq:audience", SLOW_MS, \(\) => loadBotAudience\(\)\)/);
  const side = read("components/admin/hq-side.tsx");
  assert.match(side, /<HelpHint topic=\{helpAnchor\("\/admin\/hq", "bot-subs"\)\} \/>/);
  for (const help of ["content/admin-help-ru.ts", "content/admin-help-uz.ts", "content/admin-help-pl/leads.ts"]) {
    assert.match(read(help), /id: "bot-subs",\s*roles: \["admin", "head"\]/, help);
  }
});
