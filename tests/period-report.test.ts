/**
 * Отчёт по касаниям за две недели — владельцу и руководителю в Telegram.
 *
 * Владелец, 01.10: «Отправь мне и Александру отчёт по сотрудникам за 2
 * недели работы, чтобы было видно, кто сколько касаний сделал, через тг
 * бот».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { NEWS, newsActive, newsWindow } from "@/lib/admin/team-news";
import { periodLine, periodRange, periodText, shiftDay, type PeriodRow } from "@/lib/admin/period-report";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const row = (over: Partial<PeriodRow> & { name: string }): PeriodRow => ({
  active: true,
  joined: null,
  first: 0,
  second: 0,
  portionDone: 0,
  portionTarget: 0,
  ...over,
});

test("две недели — две половины по семь дней, последняя кончается сегодня", () => {
  assert.equal(shiftDay("2026-10-01", -13), "2026-09-18");
  assert.equal(shiftDay("2026-03-01", -1), "2026-02-28");
  assert.deepEqual(periodRange("2026-10-01"), { from: "2026-09-18", secondFrom: "2026-09-25", to: "2026-10-01" });
});

test("строка: всего, неделя к неделе, порция", () => {
  assert.equal(
    periodLine(row({ name: "Александр", first: 30, second: 12, portionDone: 4, portionTarget: 15 })),
    "Александр — 42 касания: 30 → 12 · порция 4 из 15",
  );
  assert.equal(periodLine(row({ name: "Нурсултан", first: 10, second: 15 })), "Нурсултан — 25 касаний: 10 → 15");
});

test("ноль касаний у того, кто в команде, — ⚠️; пришёл недавно — сказано с какого дня", () => {
  assert.equal(
    periodLine(row({ name: "Эльдар", portionTarget: 10, joined: "29.09" })),
    "Эльдар — 0 касаний · порция 0 из 10 ⚠️ (в команде с 29.09)",
  );
  assert.equal(
    periodLine(row({ name: "Мадина", active: false, first: 2 })),
    "Мадина — 2 касания: 2 → 0 (уже не в команде)",
  );
});

test("текст: больше касаний — выше, итог и пояснение, влезает в одно сообщение", () => {
  const text = periodText(
    [
      row({ name: "Данил", second: 2 }),
      row({ name: "Александр", first: 30, second: 12, portionDone: 4, portionTarget: 15 }),
      row({ name: "Нурсултан", first: 10, second: 15, portionDone: 5, portionTarget: 5 }),
    ],
    periodRange("2026-10-01"),
  );
  assert.match(text, /^<b>Касания за две недели · 18\.09–01\.10<\/b>/);
  assert.match(text, /Неделя к неделе: 18\.09–24\.09 → 25\.09–01\.10\./);
  assert.ok(text.indexOf("Александр") < text.indexOf("Нурсултан") && text.indexOf("Нурсултан") < text.indexOf("Данил"));
  assert.match(text, /Всего: 69 касаний: 40 → 29 · порции: 9 из 20/);
  assert.ok(text.length < 4096);
  assert.doesNotMatch(text.replace(/<\/?b>/g, ""), /[<>]/, "разметка — только то, что понимает Telegram");
});

test("отчёт уходит владельцу и руководителю один раз, сегодня в рабочее время", () => {
  const news = NEWS.find((n) => n.id === "2026-10-01-touches-2w");
  assert.ok(news);
  assert.deepEqual([...news.roles].sort(), ["admin", "head"]);
  assert.equal(newsActive(news, new Date("2026-10-01T11:00:00Z")), true);
  assert.equal(newsWindow(new Date("2026-10-01T11:00:00Z")), true);
  assert.equal(newsActive(news, new Date("2026-10-03T00:00:00Z")), false);

  const store = read("lib/admin/team-news.ts");
  // Текст считается в момент отправки; пусто — отметка снимается, попробуем снова.
  assert.match(store, /const text = await news\.text\(reader\.role, now\)/);
  assert.match(store, /const ok = !text\s*\? false/);
});

test("касания и порция считаются так же, как в плане и вечернем отчёте", () => {
  const store = read("lib/admin/period-report-store.ts");
  assert.match(store, /\.neq\("status", "failed"\)/);
  assert.match(store, /\.eq\("source", "portion"\)/);
  assert.match(store, /outcomeOf\(/);
  assert.match(store, /esc\(s\.display_name as string\)/, "имя в HTML-сообщении экранируется");
});

/* ── Объявление «Коллеги, а у нас обнова!» ───────────────────────────── */

test("объявление о задачах и партнёрке: начало, кому, когда, кнопки — как на экране", async () => {
  const news = NEWS.find((n) => n.id === "2026-10-01-tasks");
  assert.ok(news);
  assert.deepEqual([...news.roles].sort(), ["head", "manager"]);
  // Пятница, 2 октября, 10:00 по Ташкенту — уходит; 1 октября — ещё нет.
  // Владелец: «отправляй сейчас» — 1 октября в 22:30 по Ташкенту уходит,
  // хотя обычные объявления ждут 09:00; ночью, с 23:00 до 07:00, — нет.
  const evening = new Date("2026-10-01T17:30:00Z");
  assert.equal(newsActive(news, evening), true);
  assert.equal(newsWindow(evening), false);
  assert.ok(news.window);
  assert.equal(news.window(evening), true);
  assert.equal(news.window(new Date("2026-10-01T19:00:00Z")), false);

  const text = (await news.text("manager")) ?? "";
  assert.ok(text.startsWith("<b>Коллеги, а у нас обнова!</b>"), "владелец просил начать с этих слов");
  assert.ok(text.length < 4096);
  assert.doesNotMatch(text.replace(/<\/?(b|i)>/g, ""), /[<>]/);

  // Кнопки бота и панели — ровно те, что человек увидит.
  const bot = read("lib/admin/task-bot.ts") + read("lib/qualify/telegram.ts");
  for (const label of ["✅ Взять в работу", "✅ Сделано", "✖ Не сделано", "🕑 Перенести срок"]) {
    assert.ok(text.includes(label) && bot.includes(label), label);
  }
  const panel = read("content/admin-panel/tasks.ts");
  assert.doesNotMatch(text, /партнёр|ИНН/i, "владелец просил только про CRM");
  for (const label of ["Поставить задачу", "Включить уведомления"]) {
    assert.ok(text.includes(`«${label}»`) && panel.includes(`"${label}"`), label);
  }
});
