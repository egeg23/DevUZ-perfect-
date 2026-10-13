/**
 * Вечерний отчёт по сотрудникам — владельцу и руководителям в 18:00.
 *
 * Владелец, 13.10.2026: «кто заходил в панель и сколько времени провёл;
 * сколько касаний и порций дня сделано; всё из текущего вечернего отчёта;
 * на что обратить внимание и рекомендации к сотрудникам; эмодзи. Отчёт
 * уходит только нам с руководителями».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  PRESENCE_FROM,
  adviceFor,
  duration,
  hhmm,
  mark,
  panelLine,
  staffReportText,
  touchLine,
  watchPoints,
  type StaffDay,
} from "@/lib/admin/staff-report";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

function person(over: Partial<StaffDay> & { name: string }): StaffDay {
  return {
    role: "manager",
    actions: 0,
    leadsTaken: 0,
    ...over,
    report: { name: over.name, target: 5, done: 0, skipped: 0, short: 0, stream: 0, touches: 0, ...over.report },
    panel: { views: 0, top: [], minutes: 0, firstAt: null, lastAt: null, ...over.panel },
  };
}

// 13.10.2026, Ташкент = UTC+5.
const at = (hm: string) => `2026-10-13T${hm}:00.000Z`;

test("время и минуты — по Ташкенту, по-человечески", () => {
  assert.equal(hhmm(at("04:05")), "09:05");
  assert.equal(duration(45), "45 мин");
  assert.equal(duration(130), "2 ч 10 мин");
  assert.equal(duration(120), "2 ч");
});

test("строки человека: всё из прежнего отчёта и панель", () => {
  const dina = person({
    name: "Дина",
    report: { name: "Дина", target: 5, done: 4, skipped: 2, short: 1, stream: 2, touches: 7 },
    panel: { views: 23, top: ["Касания", "Главная и лиды"], minutes: 130, firstAt: at("04:12"), lastAt: at("12:40") },
    actions: 18,
    leadsTaken: 1,
  });
  assert.equal(touchLine(dina), "✉️ 7 касаний (поток 2) · порция 4 из 5, не подошло 2, без замены 1");
  assert.equal(panelLine(dina), "🖥 ⏱ 2 ч 10 мин, 09:12–17:40, 23 просмотра · чаще: Касания, Главная и лиды");
  const bot = person({ name: "Истам", actions: 9, panel: { views: 0, top: [], minutes: 0, firstAt: null, lastAt: null } });
  assert.equal(panelLine(bot), "🖥 в панель не заходил, работал из бота");
  // До учёта минут — «не знаем», а не «0 минут».
  const old = person({ name: "Эльдар", panel: { views: 4, top: [], minutes: null, firstAt: null, lastAt: at("10:00") } });
  assert.equal(panelLine(old), "🖥 последний раз в 15:00, 4 просмотра");
});

test("значки и советы — правилами, без модели", () => {
  const idle = person({ name: "Абдукодир" });
  assert.equal(mark(idle), "💤");
  assert.match(adviceFor(idle) ?? "", /ни панели, ни касаний/);

  const notStarted = person({ name: "Лола", actions: 3, panel: { views: 5, top: [], minutes: 20, firstAt: at("05:00"), lastAt: at("06:00") } });
  assert.match(adviceFor(notStarted) ?? "", /порция не начата/);

  const star = person({
    name: "Данил",
    report: { name: "Данил", target: 5, done: 5, skipped: 0, short: 0, stream: 3, touches: 8 },
    panel: { views: 30, top: [], minutes: 200, firstAt: at("04:00"), lastAt: at("13:00") },
  });
  assert.equal(mark(star), "🌟");
  assert.match(adviceFor(star) ?? "", /отметить при команде/);

  const late = person({
    name: "Мадина",
    report: { name: "Мадина", target: 5, done: 5, skipped: 0, short: 0, stream: 0, touches: 5 },
    panel: { views: 8, top: [], minutes: 60, firstAt: at("07:30"), lastAt: at("12:00") },
  });
  assert.match(adviceFor(late) ?? "", /день начат в 12:30/);

  const ok = person({
    name: "Рустам",
    report: { name: "Рустам", target: 5, done: 5, skipped: 1, short: 0, stream: 0, touches: 5 },
    panel: { views: 8, top: [], minutes: 90, firstAt: at("04:10"), lastAt: at("12:00") },
  });
  assert.equal(mark(ok), "✅");
  assert.equal(adviceFor(ok), null, "всё в порядке — без лишних слов");
});

test("«на что смотреть» — по команде", () => {
  const team = [
    person({ name: "Абдукодир" }),
    person({ name: "Истам", actions: 4, report: { name: "Истам", target: 5, done: 1, skipped: 3, short: 2, stream: 0, touches: 1 } }),
    person({
      name: "Дина",
      report: { name: "Дина", target: 5, done: 5, skipped: 0, short: 0, stream: 0, touches: 5 },
      panel: { views: 9, top: [], minutes: 50, firstAt: at("04:00"), lastAt: at("12:00") },
    }),
  ];
  const points = watchPoints(team);
  assert.ok(points.some((p) => p.startsWith("🔴 Порция по команде: 6 из 15 (40%)")));
  assert.ok(points.some((p) => p === "💤 Ничего за день: Абдукодир."));
  assert.ok(points.some((p) => p === "📱 Работали только из бота: Истам."));
  assert.ok(points.some((p) => p.includes("Много «Не подходит»: Истам (3)")));
  assert.ok(points.some((p) => p.includes("Без замены осталось 2")));
});

test("весь текст: шапка, люди по касаниям, выводы, советы, пояснение", () => {
  const text = staffReportText("2026-10-13", [
    person({ name: "Абдукодир" }),
    person({
      name: "Дина",
      report: { name: "Дина", target: 5, done: 5, skipped: 0, short: 0, stream: 0, touches: 6 },
      panel: { views: 9, top: [], minutes: null, firstAt: null, lastAt: at("12:00") },
    }),
  ]);
  assert.match(text, /^📋 <b>Сотрудники за день · 13\.10\.2026<\/b>/);
  assert.match(text, /✉️ Всего: 6 касаний · 🖥 в панели были 1 из 2/);
  assert.match(text, /🏆 Лучший день: Дина — 6 касаний/);
  assert.ok(text.indexOf("<b>Дина</b>") < text.indexOf("<b>Абдукодир</b>"), "больше касаний — выше");
  assert.match(text, /👀 <b>На что смотреть<\/b>/);
  assert.match(text, /💡 <b>Рекомендации<\/b>/);
  assert.match(text, /Время в панели считаем с 14\.10\.2026/);
  assert.equal(PRESENCE_FROM, "2026-10-14");
});

test("кому и когда: владелец и руководители, после закрытия порции, один раз", () => {
  const store = read("lib/admin/staff-report-store.ts");
  assert.match(store, /\.in\("role", \["admin", "head"\]\)/);
  assert.match(store, /const key = `staff-report:\$\{day\}`;/);
  assert.match(store, /upsert\(\{ news_id: key, staff_id: reader\.id \}, \{ onConflict: "news_id,staff_id", ignoreDuplicates: true \}\)/);
  assert.match(store, /else await db\.from\("team_news_sent"\)\.delete\(\)\.eq\("news_id", key\)\.eq\("staff_id", reader\.id\)/);
  // Имена — в разметку, поэтому экранированы.
  assert.match(store, /name: esc\(person\.name\)/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /await sendStaffReport\(new Date\(\)\)/);
  // reportPortions только закрывает день — второго отчёта в 18:00 нет.
  const portion = read("lib/admin/portion-store.ts");
  const close = portion.slice(portion.indexOf("export async function reportPortions("), portion.indexOf("export type PortionItem"));
  assert.doesNotMatch(close, /sendMessage\(/);
});

test("время в панели: маячок раз в минуту, только когда человек работает", () => {
  const beacon = read("components/admin/usage-beacon.tsx");
  assert.match(beacon, /const TICK_MS = 60_000;/);
  assert.match(beacon, /document\.visibilityState !== "visible" \|\| Date\.now\(\) - lastInput > IDLE_MS/);
  const route = read("app/admin/beacon/route.ts");
  assert.match(route, /await tickPresence\(staff\.id\)/);
  assert.match(route, /const section = tick \? null : sectionOf\(path\);/);
  const sql = read("supabase/migrations/0157_panel_presence.sql");
  assert.match(sql, /where panel_presence\.last_at < now\(\) - interval '50 seconds'/);
  assert.match(sql, /revoke all on function public\.tick_panel_presence\(uuid, date\) from public, anon, authenticated/);
});
