/**
 * Недельный отчёт по сотрудникам и рекомендации — владельцу и руководителю
 * в Telegram (lib/admin/staff-week.ts, staff-week-store.ts).
 *
 * Владелец, 23.10.2026: «Не забудь что недельный отчет по сотрудникам и
 * рекомендации — направляем через тг бот мне и руководителю».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  staffWeekText,
  touchDrop,
  weekAdvice,
  weekMark,
  weekRange,
  weekReportDue,
  weekReportKey,
  type StaffWeek,
} from "@/lib/admin/staff-week";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
/** Момент по часам Ташкента. */
const tk = (iso: string) => new Date(`${iso}+05:00`);

const person = (over: Partial<StaffWeek> = {}): StaffWeek => ({
  id: "s1",
  name: "Дина",
  touches: 300,
  touchesPrev: 280,
  replied: 20,
  mockups: 2,
  shown: 1,
  priced: 0,
  paid: 0,
  panelDays: 5,
  panelMinutes: 900,
  leadsTaken: 3,
  offersBurned: 0,
  stale: 2,
  ...over,
});

test("по понедельникам с 10:00 до 19:00 по Ташкенту, один раз за неделю", () => {
  assert.equal(weekReportDue(tk("2026-10-26T09:59:00")), false, "09:59 — рекомендации ещё собираются");
  assert.equal(weekReportDue(tk("2026-10-26T10:00:00")), true);
  assert.equal(weekReportDue(tk("2026-10-26T18:59:00")), true);
  assert.equal(weekReportDue(tk("2026-10-26T19:00:00")), false);
  assert.equal(weekReportDue(tk("2026-10-27T10:00:00")), false, "вторник — нет");
  const range = weekRange(tk("2026-10-26T10:00:00"));
  assert.equal(range.firstDay, "2026-10-19");
  assert.equal(range.lastDay, "2026-10-25");
  assert.equal(range.to - range.from, 7 * 24 * 3600_000);
  assert.equal(range.from - range.prevFrom, 7 * 24 * 3600_000);
  assert.equal(weekReportKey(range), "staff-week:2026-10-19");
});

test("рекомендации — правилами: молчал, просел, макеты без показа, норма", () => {
  assert.match(weekAdvice(person({ touches: 0, panelDays: 0, leadsTaken: 0, mockups: 0, shown: 0 })) ?? "", /ни касаний, ни панели/);
  assert.equal(touchDrop(person({ touches: 150, touchesPrev: 300 })), 50);
  assert.match(weekAdvice(person({ touches: 150, touchesPrev: 300 })) ?? "", /на 50% меньше/);
  assert.equal(touchDrop(person({ touchesPrev: 10 })), null, "с малым не сравниваем");
  assert.match(weekAdvice(person({ mockups: 3, shown: 0 })) ?? "", /3 макета и ни одного показа/);
  assert.match(weekAdvice(person({ shown: 2 })) ?? "", /норма показов сделана/);
  assert.equal(weekMark(person({ shown: 2 })), "🌟");
  assert.equal(weekMark(person({ touches: 0, panelDays: 0, leadsTaken: 0 })), "💤");
  assert.equal(weekAdvice(person()), null, "всё в порядке — без совета");
});

test("текст: каждый с цифрами, итог по команде, рекомендации", () => {
  const range = weekRange(tk("2026-10-26T10:00:00"));
  const text = staffWeekText(range, [
    person(),
    person({ name: "Азиз", touches: 0, touchesPrev: 120, replied: 0, mockups: 0, shown: 0, panelDays: 0, panelMinutes: 0, leadsTaken: 0 }),
  ]);
  assert.match(text, /Сотрудники за неделю · 19\.10–25\.10/);
  assert.match(text, /<b>Дина<\/b>/);
  assert.match(text, /💤 <b>Азиз<\/b>/);
  assert.match(text, /💤 Ничего за неделю: Азиз/);
  assert.match(text, /💡 <b>Рекомендации<\/b>/);
  assert.match(text, /Показов макета 1 при норме 2/, "норма — на тех, кто работал");
});

test("без модели, счёт касаний — без строк, только владельцу и руководителю под «Отчётами»", () => {
  const pure = read("lib/admin/staff-week.ts");
  const store = read("lib/admin/staff-week-store.ts");
  for (const src of [pure, store]) {
    assert.doesNotMatch(src, /anthropic|model-road|askCoach|messages\.create/i);
  }
  assert.match(store, /select\("id", \{ count: "exact", head: true \}\)/);
  assert.match(store, /\.in\("role", \["admin", "head"\]\)/);
  assert.match(store, /wants\(.*, "reports"\)/);
  // Заголовки недельных рекомендаций модели не берём: 23.10.2026 они писали
  // «полный ноль» людям со 150 касаниями.
  assert.doesNotMatch(store, /latestReviews|reviews/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /await sendStaffWeek\(new Date\(\)\)/);
});
