/**
 * Ночью бот молчит — и клиентам, и команде.
 *
 * Владелец, 23.10.2026, после того как модель с 23:38 до 03:37 разбирала
 * накопленные за неделю ответы клиентов, а команде шли карточки: «И ночью
 * уведомления не уходят!!!! Только с 8 до 21:00 по ташкенту».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { heldHeading } from "@/lib/admin/lead-queue";
import { lastNight, nightRepliesText } from "@/lib/admin/night-replies-store";
import { QUIET_FROM_HOUR, QUIET_TO_HOUR, messageWindow } from "@/lib/admin/tasks";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
/** Момент по часам Ташкента. */
const tk = (iso: string) => new Date(`${iso}+05:00`);

test("окно бота — с 08:00 до 21:00 по Ташкенту", () => {
  assert.equal(QUIET_FROM_HOUR, 21);
  assert.equal(QUIET_TO_HOUR, 8);
  assert.equal(messageWindow(tk("2026-10-23T07:59:00")), false);
  assert.equal(messageWindow(tk("2026-10-23T08:00:00")), true);
  assert.equal(messageWindow(tk("2026-10-23T20:59:00")), true);
  assert.equal(messageWindow(tk("2026-10-23T21:00:00")), false);
  assert.equal(messageWindow(tk("2026-10-24T03:31:00")), false, "в 03:31 модель клиенту писала — больше нет");
});

test("модель отвечает клиентам только днём и только на свежее", () => {
  const run = read("lib/admin/outreach-talk-run.ts");
  assert.match(run, /if \(!messageWindow\(now\)\) return run;/);
  const store = read("lib/admin/outreach-talk-store.ts");
  assert.match(store, /export const TALK_FRESH_MS = 24 \* 3600_000;/);
  const pending = store.slice(store.indexOf("export async function pendingTalks"), store.indexOf("export async function threadFor"));
  assert.match(pending, /\.gte\("created_at", new Date\(Date\.now\(\) - TALK_FRESH_MS\)\.toISOString\(\)\)/);
  const tell = store.slice(store.indexOf("export async function tellManager"), store.indexOf("export async function tellManager") + 600);
  assert.match(tell, /if \(!messageWindow\(new Date\(\)\)\) return false;/, "ночью строк менеджеру нет");
});

test("карточки лидов ночью ждут утра и приходят с пометкой «пришёл ночью»", () => {
  const queue = read("lib/admin/lead-queue-store.ts");
  const start = queue.slice(queue.indexOf("export async function startQueue"), queue.indexOf("const { people, candidates } = await queueCandidates(now);"));
  assert.match(start, /if \(!messageWindow\(now\)\) \{[\s\S]*queue_opened_at: now\.toISOString\(\), fair_share: false[\s\S]*return true;/);
  assert.doesNotMatch(start.slice(start.indexOf("if (!messageWindow(now))"), start.indexOf("if (!isWorkingHours(now))")), /sendLead|sendMessage/);
  const redeliver = queue.slice(queue.indexOf("export async function redeliverLostCards"), queue.indexOf("/** Карточка лида, собранная из базы"));
  assert.match(redeliver, /if \(!messageWindow\(now\)\) return report;/);
  assert.match(redeliver, /heldAtNight \? heldHeading\(/);
  const advance = queue.slice(queue.indexOf("export async function advanceQueues"), queue.indexOf("export async function advanceQueues") + 400);
  assert.match(advance, /if \(!messageWindow\(now\)\) return report;/);
  assert.match(heldHeading("2026-10-22T18:54:00Z"), /Лид пришёл ночью, 22\.10, 23:54/);
});

test("ответы клиентов за ночь — утром одной сводкой тому, кто ведёт", () => {
  const night = lastNight(tk("2026-10-23T08:10:00"));
  assert.equal(night.from.toISOString(), tk("2026-10-22T21:00:00").toISOString());
  assert.equal(night.to.toISOString(), tk("2026-10-23T08:00:00").toISOString());
  const text = nightRepliesText([{ host: "decasa.uz", body: "что можете улучшить?", leadId: "L1", at: tk("2026-10-22T23:10:00").toISOString() }]);
  assert.match(text, /🌙 <b>Ночью ответили клиенты по вашим касаниям<\/b> \(с 21:00 до 08:00 бот молчит\)/);
  assert.match(text, /23:10 <b>decasa\.uz<\/b>: «что можете улучшить\?»/);
  assert.match(text, /\/admin\/leads\/L1#talk/);
  const store = read("lib/admin/night-replies-store.ts");
  assert.match(store, /\.eq\("prospects\.ai_handling", false\)/, "разговоры модели — не сюда: утром ответит она");
  assert.match(store, /closed_reason === "refused"/, "отказы — не сюда");
  assert.match(store, /wants\(.*"talks"\)/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /await sendNightReplies\(new Date\(\)\)/);
});
