/**
 * Обновления 04.10: руководителю — досрочно, менеджерам — в понедельник.
 *
 * Владелец, 04.10 (воскресенье): «Отправь Александру ботом уведомления о
 * изменениях вне очереди, напиши — досрочное уведомление руководителя.
 * Работникам это сообщение с апдейтами уйдёт в понедельник».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { accountsDict } from "@/content/admin-panel/accounts";
import { tasksDict } from "@/content/admin-panel/tasks";
import { NEWS, newsActive, newsWindow } from "@/lib/admin/team-news";

const early = NEWS.find((n) => n.id === "2026-10-04-head-early");
const monday = NEWS.find((n) => n.id === "2026-10-05-updates");
/** Момент по часам Ташкента. */
const tk = (iso: string) => new Date(`${iso}+05:00`);

test("руководителю — сразу, в воскресенье, но не ночью", () => {
  assert.ok(early?.window);
  assert.deepEqual([...early.roles], ["head"]);
  const sunday = tk("2026-10-04T16:40:00");
  assert.equal(newsActive(early, sunday), true);
  assert.equal(early.window(sunday), true, "вне очереди — в воскресенье тоже");
  assert.equal(early.window(tk("2026-10-04T23:30:00")), false, "ночью — нет");
  assert.match(early.copyNote ?? "", /руководителю — досрочно/);
});

test("менеджерам — в понедельник с 09:00, руководителю второй раз не шлём", () => {
  assert.ok(monday);
  assert.deepEqual([...monday.roles], ["manager"]);
  assert.equal(monday.window, undefined, "обычное окно рассылок — будни 09:00–19:00");
  assert.equal(newsActive(monday, tk("2026-10-04T20:00:00")), false, "в воскресенье — ещё рано");
  const nine = tk("2026-10-05T09:05:00");
  assert.equal(newsActive(monday, nine), true);
  assert.equal(newsWindow(nine), true);
  assert.equal(newsWindow(tk("2026-10-05T08:30:00")), false);
  assert.equal(monday.copyRole, "manager");
});

test("текст: руководителю — «досрочное уведомление», названия кнопок как в панели", async () => {
  assert.ok(early && monday);
  const head = (await early.text("head")) ?? "";
  const manager = (await monday.text("manager")) ?? "";
  assert.ok(head.startsWith("<b>Досрочное уведомление руководителя</b>"));
  assert.match(head, /Сотрудникам это сообщение с обновлениями уйдёт в понедельник/);
  assert.doesNotMatch(manager, /Досрочное|Аккаунты/, "менеджер не видит раздела «Аккаунты»");
  for (const text of [head, manager]) {
    assert.ok(text.length < 3500, `длинно для Telegram: ${text.length}`);
    assert.match(text, /3 новых в час, с 07:30 до 20:30/);
    assert.match(text, new RegExp(`«${tasksDict.newTask.ru}»`));
    assert.match(text, new RegExp(`«${tasksDict.fieldWho.ru}»`));
    assert.doesNotMatch(text.replace(/<\/?(b|i)>/g, ""), /[<>]/, "чужая разметка сломает сообщение");
  }
  assert.match(head, new RegExp(`«${accountsDict.staffTitle.ru}»`));
  assert.match(head, new RegExp(`«${accountsDict.addButton.ru}»`));
});

test("женский аккаунт: владельцу и руководителю, сразу, без копии дважды", () => {
  const news = NEWS.find((n) => n.id === "2026-10-07-women-account");
  assert.ok(news, "объявления нет");
  assert.deepEqual([...news.roles].sort(), ["admin", "head"]);
  // Ночью тоже: владелец попросил уведомить в 00:10 по Ташкенту.
  assert.equal(news.window?.(new Date("2026-10-07T19:15:00Z")), true);
  assert.equal(newsActive(news, new Date("2026-10-07T19:15:00Z")), true);
  assert.equal(newsActive(news, new Date("2026-10-10T00:00:00Z")), false);
  const text = String(news.text("head"));
  for (const part of ["Арсений", "Эльдар", "Дина", "Салиха", "ограничения Telegram", "«Аккаунты»"]) assert.ok(text.includes(part), part);
  assert.equal(news.text("admin"), news.text("head"), "владельцу и руководителю — один текст");
});
