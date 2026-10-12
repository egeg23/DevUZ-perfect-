/**
 * Что сделано 12.10.2026 — от имени владельца, сначала ему на согласование.
 *
 * Владелец: «Выкати объявление что сделано за сегодня на согласование мне.
 * Коротко и по делу от моего лица».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { editSentDict } from "@/content/admin-panel/prospect";
import { letterTextsDict } from "@/content/admin-panel/letter-texts";
import { NEWS, newsActive, ownerNewsOct12 } from "@/lib/admin/team-news";
import { SECTIONS } from "@/lib/admin/roles";

const preview = NEWS.find((n) => n.id === "2026-10-12-owner-preview");

test("на согласование — только владельцу и сразу, ночью тоже", async () => {
  assert.ok(preview);
  assert.deepEqual([...preview.roles], ["admin"]);
  const midnight = new Date("2026-10-12T19:30:00Z"); // 00:30 по Ташкенту
  assert.equal(newsActive(preview, midnight), true);
  assert.equal(preview.window?.(midnight), true);
  const text = (await preview.text("admin")) ?? "";
  assert.match(text, /^<i>На согласование\./);
  assert.ok(text.includes(ownerNewsOct12("head")), "владелец видит текст руководителя целиком");
  // Команде без его «да» не уходит.
  assert.ok(!NEWS.some((n) => n.text === preview.text && n.roles.some((r) => r !== "admin")));
});

test("после «Отправляй» — руководителю и менеджерам, ночью ждёт утра", async () => {
  const team = NEWS.find((n) => n.id === "2026-10-12-owner-day");
  assert.ok(team);
  assert.deepEqual([...team.roles].sort(), ["head", "manager"]);
  assert.ok(team.window);
  assert.equal(team.window(new Date("2026-10-12T19:45:00Z")), false, "00:45 по Ташкенту — ночь");
  const morning = new Date("2026-10-13T02:30:00Z"); // 07:30 по Ташкенту
  assert.equal(newsActive(team, morning), true);
  assert.equal(team.window(morning), true);
  assert.equal(newsActive(team, new Date("2026-10-15T01:00:00Z")), false, "через три дня — устарело");
  assert.match(team.copyNote ?? "", /Копия/);
  // Уходит ровно то, что владелец согласовал.
  assert.equal(await team.text("head"), ownerNewsOct12("head"));
  assert.equal(await team.text("manager"), ownerNewsOct12("manager"));
});

test("коротко, от первого лица, названия — как в панели", () => {
  for (const role of ["manager", "head"] as const) {
    const text = ownerNewsOct12(role);
    const plain = text.replace(/<\/?b>/g, "");
    assert.ok(plain.length < 1300, `${role}: длинно — ${plain.length} знаков`);
    assert.ok(text.startsWith("Привет, команда!"));
    assert.doesNotMatch(plain, /[<>]/);
    assert.ok(text.includes(`«${editSentDict.edit.ru}»`), "кнопка «Исправить» названа не так, как в панели");
    assert.ok(text.includes("«Макетах»") && SECTIONS.some((s) => s.href === "/admin/mockups" && s.label.ru === "Макеты"));
    assert.ok(text.includes("«Касаниях»") && SECTIONS.some((s) => s.href === "/admin/prospect" && s.label.ru === "Касания"));
    assert.ok(text.includes("+48 574 050 123"));
    // «Обучение» выключено до кнопки владельца — о нём не пишем.
    assert.doesNotMatch(text, /Обучени/);
    // Блогеры остановлены до готовности агента — ни бонуса, ни приглашения.
    assert.doesNotMatch(text, /[Бб]логер|5%/);
  }
});

test("менеджеру — только то, что он видит сам", () => {
  const manager = ownerNewsOct12("manager");
  const head = ownerNewsOct12("head");
  assert.ok(head.includes(`«${letterTextsDict.link.ru}» → «${letterTextsDict.helloTitle.ru}»`));
  assert.doesNotMatch(manager, /Первое сообщение|грейд|кнопками/);
  assert.match(head, /грейды/);
  assert.equal(ownerNewsOct12("admin"), head, "владельцу — текст руководителя");
});
