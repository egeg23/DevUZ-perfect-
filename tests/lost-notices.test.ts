/**
 * Уведомления, потерянные в сбое связи с Telegram.
 *
 * 25–26 сентября сервер сутки не видел Telegram. Горячий лид с формы
 * (25.09, 23:55) открылся всем по ночному правилу, но карточку не получил
 * никто — повторять её было некому. Два напоминания менеджеру свип бросил
 * после пяти проходов, хотя вина была не их, а дороги.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { test } from "node:test";

import { LOST_GRACE_MINUTES, LOST_WINDOW_HOURS, isLostCard, lostHeading } from "@/lib/admin/lead-queue";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

/** Чем заглушка Bot API отвечает сейчас. */
let mode: "ok" | "error" = "ok";
const server = createServer((req, res) => {
  req.resume();
  req.on("end", () => {
    if (mode === "ok") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, result: { id: 1, is_bot: true } }));
      return;
    }
    res.writeHead(401, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error_code: 401, description: "Unauthorized" }));
  });
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address() as { port: number };
process.env.TELEGRAM_API_BASE = `http://127.0.0.1:${port}`;
process.env.TELEGRAM_BOT_TOKEN = "stub-token";

const { telegramReachable } = await import("@/lib/qualify/telegram");

const NOW = new Date("2026-09-26T15:30:00Z");
const lead = {
  status: "new",
  assignedStaffId: null,
  queueOpenedAt: "2026-09-25T18:55:34Z",
  createdAt: "2026-09-25T18:55:33Z",
  notices: 0,
};

test("ночной лид без единой доставленной карточки — потерян, его надо дослать", () => {
  assert.equal(isLostCard(lead, NOW), true);
});

test("дошла хоть одна копия, лид взят или назначен — досылать нечего", () => {
  assert.equal(isLostCard({ ...lead, notices: 1 }, NOW), false);
  assert.equal(isLostCard({ ...lead, status: "taken" }, NOW), false);
  assert.equal(isLostCard({ ...lead, assignedStaffId: "staff-1" }, NOW), false);
  // В очередь не выпущен — не этот случай (лид от касания, лид без очереди).
  assert.equal(isLostCard({ ...lead, queueOpenedAt: null }, NOW), false);
});

test("свежая карточка может быть ещё в пути, а совсем старую досылать поздно", () => {
  const justOpened = new Date(NOW.getTime() - (LOST_GRACE_MINUTES - 1) * 60_000).toISOString();
  assert.equal(isLostCard({ ...lead, queueOpenedAt: justOpened, createdAt: justOpened }, NOW), false);
  const old = new Date(NOW.getTime() - (LOST_WINDOW_HOURS + 1) * 3_600_000).toISOString();
  assert.equal(isLostCard({ ...lead, queueOpenedAt: old, createdAt: old }, NOW), false);
});

test("шапка досылки говорит, что это досылка и когда лид пришёл — по Ташкенту", () => {
  const heading = lostHeading("2026-09-25T18:55:33Z");
  assert.match(heading, /Досылка/);
  assert.match(heading, /25\.09.*23:55/);
});

test("Telegram отвечает — даже ошибкой — значит дорога есть", async () => {
  mode = "ok";
  assert.equal(await telegramReachable(), true);
  // 401 — беда с токеном, а не с дорогой: напоминанию попытка засчитывается.
  mode = "error";
  assert.equal(await telegramReachable(), true);
});

test("Telegram не отвечает вовсе — дороги нет", async () => {
  const before = process.env.TELEGRAM_API_BASE;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  try {
    // Адрес Bot API модуль прочитал на импорте, а сервер-заглушка уже закрыт.
    assert.equal(await telegramReachable(), false);
  } finally {
    process.env.TELEGRAM_API_BASE = before;
  }
});

test("свип: досылает потерянные карточки и не бросает напоминания, пока Telegram недоступен", () => {
  const sweep = read("app/api/reminders/sweep/route.ts");
  const queueAt = sweep.indexOf("await advanceQueues(");
  const lostAt = sweep.indexOf("await redeliverLostCards(");
  assert.ok(queueAt > 0 && lostAt > queueAt, "досылка карточек — сразу после очереди");
  // Неудача без дороги — не попытка напоминания.
  const failAt = sweep.indexOf("if (!ok) {");
  const reachAt = sweep.indexOf("await telegramReachable()", failAt);
  const countAt = sweep.indexOf("attempts:", failAt);
  assert.ok(failAt > 0 && reachAt > failAt && reachAt < countAt, "попытка засчитывается раньше, чем проверена дорога");

  const store = read("lib/admin/lead-queue-store.ts");
  // Досылка — только когда Telegram отвечает, и по правилам очереди.
  assert.match(store, /if \(!lost\.length \|\| !\(await telegramReachable\(\)\)\) return report;/);
  assert.match(store, /await requeueLead\(lead\.id as string, lostHeading\(lead\.created_at as string\), now\)/);
});
