/**
 * Уведомление команде 11.10.2026 вечером от имени владельца — что нового за день.
 *
 * Владелец: «Подготовь коротко что сегодня добавили, что нового,
 * человеческим языком, от моего лица» → «Отправляй команде».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { leadCardDict } from "@/content/admin-panel/lead-card";
import { letterTextsDict } from "@/content/admin-panel/letter-texts";
import { NEWS, newsActive } from "@/lib/admin/team-news";
import { SECTIONS } from "@/lib/admin/roles";

const news = NEWS.find((n) => n.id === "2026-10-11-owner-evening");

test("уходит менеджерам и руководителю сегодня вечером, ночью ждёт утра", () => {
  assert.ok(news);
  assert.deepEqual([...news.roles].sort(), ["head", "manager"]);
  assert.ok(news.window);
  // С 23.10.2026 бот молчит с 21:00 (было с 23:00): «вечер» — 20:30.
  const evening = new Date("2026-10-11T15:30:00Z"); // 20:30 по Ташкенту
  assert.equal(newsActive(news, evening), true);
  assert.equal(news.window(evening), true);
  assert.equal(news.window(new Date("2026-10-11T19:00:00Z")), false, "00:00 по Ташкенту — ночь");
  assert.equal(newsActive(news, new Date("2026-10-14T01:00:00Z")), false, "через три дня — устарело");
  assert.match(news.copyNote ?? "", /Копия/);
});

test("коротко, от первого лица, названия — как в панели", async () => {
  assert.ok(news);
  const text = (await news.text("manager")) ?? "";
  const plain = text.replace(/<\/?b>/g, "");
  assert.ok(plain.length < 1300, `длинно: ${plain.length} знаков`);
  assert.ok(text.startsWith("Привет, команда!"));
  assert.doesNotMatch(plain, /[<>]/);
  assert.ok(text.includes(`«${letterTextsDict.link.ru}»`), "кнопка текстов названа не так, как в панели");
  assert.ok(text.includes(`«${leadCardDict.replySend.ru}»`), "кнопка ответа названа не так, как в панели");
  assert.ok(text.includes("«Первичке по касанию»") && leadCardDict.talk.ru === "Первичка по касанию");
  const touches = SECTIONS.find((s) => s.href === "/admin/prospect");
  assert.equal(touches?.label.ru, "Касания");
  assert.equal(await news.text("head"), text, "руководителю тот же текст");
});
