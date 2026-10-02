/**
 * «Что нового с 2 октября» — коротко, сотрудникам утром 03.10.
 *
 * Владелец, 02.10: «Завтра утром пришли коротко о нововведениях в боте для
 * сотрудников… Перед отправкой проверить — не появились ли новые правки».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { PROTOTYPE_HOURS } from "@/lib/admin/outreach";
import { PROTO_BUTTON } from "@/lib/admin/prototype-claim";
import { NEWS, newsActive } from "@/lib/admin/team-news";

const news = NEWS.find((n) => n.id === "2026-10-03-day");

test("уходит менеджерам и руководителям утром 03.10 — в субботу, но не раньше 09:00", () => {
  assert.ok(news);
  assert.deepEqual([...news.roles].sort(), ["head", "manager"]);
  assert.ok(news.window);
  assert.equal(newsActive(news, new Date("2026-10-02T17:00:00Z")), false, "02.10 — ещё рано");
  const nine = new Date("2026-10-03T04:05:00Z"); // 09:05 по Ташкенту, суббота
  assert.equal(newsActive(news, nine), true);
  assert.equal(news.window(nine), true);
  assert.equal(news.window(new Date("2026-10-03T03:30:00Z")), false, "08:30 — рано");
  assert.equal(news.window(new Date("2026-10-03T15:00:00Z")), false, "20:00 — поздно");
});

test("коротко, кнопки — ровно как в боте, без чужой разметки", async () => {
  assert.ok(news);
  const text = (await news.text("manager")) ?? "";
  assert.ok(text.startsWith("<b>Что нового с 2 октября</b>"));
  assert.ok(text.length < 1500, `длинно: ${text.length} знаков`);
  assert.ok(text.includes(`«${PROTO_BUTTON}»`), "кнопка названа не так, как в боте");
  assert.ok(text.includes(`${PROTOTYPE_HOURS} часов`));
  assert.ok(text.includes("RU / UZ / PL"));
  assert.doesNotMatch(text.replace(/<\/?b>/g, ""), /[<>]/);
});
