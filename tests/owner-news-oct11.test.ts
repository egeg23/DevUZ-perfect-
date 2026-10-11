/**
 * Уведомление команде 11.10.2026 от имени владельца — свои тексты писем и A/B.
 *
 * Владелец: «Выкати уведомление всем в телеграм по последним апдейтам
 * коротко и будто я пишу, человеческим языком. Много текста не надо».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { letterTextsDict } from "@/content/admin-panel/letter-texts";
import { NEWS, newsActive } from "@/lib/admin/team-news";

const news = NEWS.find((n) => n.id === "2026-10-11-owner-letters");

test("уходит менеджерам и руководителю сразу после выкатки, но не ночью", () => {
  assert.ok(news);
  assert.deepEqual([...news.roles].sort(), ["head", "manager"]);
  assert.ok(news.window);
  const sunday = new Date("2026-10-11T07:00:00Z"); // 12:00 по Ташкенту, воскресенье
  assert.equal(newsActive(news, sunday), true);
  assert.equal(news.window(sunday), true, "владелец просил сейчас, а не в понедельник");
  assert.equal(news.window(new Date("2026-10-11T19:00:00Z")), false, "00:00 по Ташкенту — ночь");
  assert.equal(newsActive(news, new Date("2026-10-14T01:00:00Z")), false, "через три дня — устарело");
});

test("коротко, от первого лица, кнопки — как в панели", async () => {
  assert.ok(news);
  for (const role of ["manager", "head"] as const) {
    const text = (await news.text(role)) ?? "";
    const plain = text.replace(/<\/?b>/g, "");
    assert.ok(plain.length < 1100, `${role}: длинно, ${plain.length} знаков`);
    assert.ok(text.startsWith("Привет, команда!"));
    assert.ok(text.includes(`«${letterTextsDict.link.ru}»`), "раздел назван не так, как в панели");
    assert.doesNotMatch(plain, /[<>]/);
  }
  const head = (await news.text("head")) ?? "";
  assert.ok(head.includes(`«${letterTextsDict.makeCommonA.ru}»`), "кнопка руководителя названа не так, как в панели");
  assert.doesNotMatch((await news.text("manager")) ?? "", /Сделать общим/, "менеджер этой кнопки не видит");
});
