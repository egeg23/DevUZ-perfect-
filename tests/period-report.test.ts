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
