/**
 * Колокольчик в шапке панели (lib/admin/bell.ts): что бот писал мне, с
 * отметкой «сделано».
 *
 * Владелец, 25.10.2026, на разбор «чем мы уступаем HubSpot и Close»:
 * «Погнали по порядку». Источник — то же место, что пуш: любое сообщение бота
 * сотруднику попадает в колокольчик само.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { BELL_DAYS, BELL_KEEP_DAYS, bellRow, skipsBell } from "@/lib/admin/bell";
import { mirrorToPush, pushInFlight } from "@/lib/admin/push-mirror";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const SITE = "https://devuz.studio";

test("строка колокольчика: заголовок — первая строка, текст с переносами, адрес — как у пуша", () => {
  const row = bellRow("<b>🔥 Тёплый лид</b>\nМагнат, розница\n\n\n\nБюджет 500 $", [[{ text: "Открыть", panel: "/admin/leads/42" }]], SITE);
  assert.equal(row.title, "🔥 Тёплый лид");
  assert.equal(row.body, "Магнат, розница\n\nБюджет 500 $");
  assert.equal(row.href, "/admin/leads/42");
  // Задача — по кнопке бота, без кнопки и ссылки — «Главная».
  assert.equal(bellRow("Задача", [[{ text: "✅", callback_data: "tk:done:0b8e4d4e-1111-4222-8333-444455556666" }]], SITE).href, "/admin/tasks/0b8e4d4e-1111-4222-8333-444455556666");
  assert.equal(bellRow("Просто строка", [], SITE).href, "/admin/hq");
  assert.equal(bellRow("", [], SITE).title, "DevUz");
  assert.ok(bellRow(`a\n${"б".repeat(2000)}`, [], SITE).body.length <= 700);
});

test("ссылка входа в колокольчик не идёт", () => {
  assert.equal(skipsBell("Вход в панель\nhttps://devuz.studio/admin/login?t=SECRET"), true);
  assert.equal(skipsBell("🔥 Тёплый лид"), false);
});

test("зеркало бота пишет в колокольчик каждую личку, с подпиской на пуш или без; группу — нет", async () => {
  const noted: (number | string)[] = [];
  const deps = {
    chats: async () => new Map(),
    deliver: async () => ({ sent: 0, gone: 0, failed: 0 }),
    bell: async (chat: number | string) => {
      noted.push(chat);
    },
  };
  mirrorToPush(111, "<b>Лид</b>", [], {}, deps);
  mirrorToPush(-1001234567890, "<b>Лид в группу</b>", [], {}, deps);
  await pushInFlight();
  assert.deepEqual(noted, [111]);
  // Колокольчик лёг — Telegram и пуш не ждут и не падают.
  mirrorToPush(111, "x", [], {}, { ...deps, bell: async () => Promise.reject(new Error("база легла")) });
  await pushInFlight();
});

test("строки: только свои, 14 дней показа, 30 хранения, без таблицы — молчит", () => {
  assert.equal(BELL_DAYS, 14);
  assert.equal(BELL_KEEP_DAYS, 30);
  const store = read("lib/admin/bell-store.ts");
  assert.match(store, /\.eq\("staff_id", staffId\)[\s\S]*\.is\("done_at", null\)/, "«сделано» — только своим");
  assert.match(store, /count: "exact", head: true/, "в шапке — счёт базы без строк");
  assert.match(store, /42P01/, "таблицы ещё нет — без шума");
  const action = read("app/admin/bell/actions.ts");
  assert.match(action, /currentStaff\(\)/);
  assert.match(action, /markBellDone\(staff\.id, target\)/, "кто — из сессии, не из формы");
  assert.match(read("app/api/reminders/sweep/route.ts"), /pruneBell\(/);
  assert.match(read("supabase/migrations/0174_staff_bell.sql"), /enable row level security/);
  assert.match(read("components/admin/shell.tsx"), /<Bell \/>/);
});
