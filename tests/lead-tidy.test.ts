/**
 * Порядок в лидах: утренний вопрос по лидам «в работе» без движения,
 * забытые 21+ день — «проиграли» сами, «Выиграли» — проект на того, у кого лид.
 *
 * Владелец, 13.10.2026, «Делаем».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { AUDIT_ACTIONS } from "@/lib/admin/audit";
import {
  PER_PERSON,
  autoLose,
  autoLostNotice,
  idleDays,
  parseTidyCallback,
  pickToAsk,
  stale,
  tidyCallback,
  tidyItem,
  tidyWindow,
  type IdleLead,
} from "@/lib/admin/lead-tidy";
import { staffReportText, workLine, type StaffDay } from "@/lib/admin/staff-report";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const DAY = 86_400_000;
// 13.10.2026, 10:30 по Ташкенту.
const now = new Date("2026-10-13T05:30:00Z");
const todayStart = new Date("2026-10-12T19:00:00Z");
const ago = (d: number) => new Date(now.getTime() - d * DAY).toISOString();
const ID = "11111111-2222-3333-4444-555555555555";
const lead = (over: Partial<IdleLead> = {}): IdleLead => ({
  id: ID,
  label: "Ромашка",
  ownerId: "m1",
  movedAt: ago(8),
  snoozedUntil: null,
  askedAt: null,
  ...over,
});

test("10:00–18:00 — окно вопроса", () => {
  assert.equal(tidyWindow(new Date("2026-10-13T04:59:00Z")), false, "09:59");
  assert.equal(tidyWindow(new Date("2026-10-13T05:00:00Z")), true, "10:00");
  assert.equal(tidyWindow(new Date("2026-10-13T13:00:00Z")), false, "18:00");
});

test("висит — 7+ дней без движения", () => {
  assert.equal(stale(lead({ movedAt: ago(6) }), now), false);
  assert.equal(stale(lead({ movedAt: ago(7) }), now), true);
  assert.equal(idleDays(ago(21), now), 21);
});

test("до трёх самых старых у каждого, отложенные и уже спрошенные сегодня — мимо", () => {
  const leads = [
    lead({ id: "a", movedAt: ago(30) }),
    lead({ id: "b", movedAt: ago(10) }),
    lead({ id: "c", movedAt: ago(20) }),
    lead({ id: "d", movedAt: ago(15) }),
    lead({ id: "e", movedAt: ago(40), snoozedUntil: new Date(now.getTime() + DAY).toISOString() }),
    lead({ id: "f", movedAt: ago(50), askedAt: new Date(todayStart.getTime() + 3600_000).toISOString() }),
    lead({ id: "g", movedAt: ago(3) }),
    lead({ id: "h", ownerId: "m2", movedAt: ago(9) }),
  ];
  const picked = pickToAsk(leads, now, todayStart);
  assert.equal(PER_PERSON, 3);
  assert.deepEqual(picked.get("m1")?.map((l) => l.id), ["a", "c", "d"]);
  assert.deepEqual(picked.get("m2")?.map((l) => l.id), ["h"]);
  // Отсрочка кончилась — снова спрашиваем.
  const back = pickToAsk([lead({ snoozedUntil: ago(1) })], now, todayStart);
  assert.equal(back.get("m1")?.length, 1);
});

test("сам в «проиграли» — только 21+ день, спросили и три дня без ответа", () => {
  assert.equal(autoLose(lead({ movedAt: ago(25), askedAt: null }), now), false, "не спрашивали — не закрываем");
  assert.equal(autoLose(lead({ movedAt: ago(25), askedAt: ago(4) }), now), true);
  assert.equal(autoLose(lead({ movedAt: ago(25), askedAt: ago(1) }), now), false, "вопрос свежий — ждём ответа");
  assert.equal(autoLose(lead({ movedAt: ago(20), askedAt: ago(10) }), now), false, "меньше 21 дня");
  assert.equal(autoLose(lead({ movedAt: ago(25), askedAt: ago(30) }), now), false, "спрашивали до последнего движения");
  assert.equal(
    autoLose(lead({ movedAt: ago(25), askedAt: ago(4), snoozedUntil: new Date(now.getTime() + DAY).toISOString() }), now),
    false,
    "«ещё в работе» — не закрываем, пока отсрочка",
  );
});

test("кнопки: свой формат, чужое не разбирается", () => {
  assert.equal(tidyCallback("won", ID), `lt:won:${ID}`);
  assert.deepEqual(parseTidyCallback(tidyCallback("wait", ID).split(":")), { answer: "wait", leadId: ID });
  assert.equal(parseTidyCallback(["lt", "drop", ID]), null);
  assert.equal(parseTidyCallback(["lt", "won", "x"]), null);
  assert.ok(tidyCallback("lost", ID).length <= 64, "callback_data — не длиннее 64 байт");
});

test("тексты: предупреждение перед закрытием и строка руководителю", () => {
  assert.match(tidyItem("Ромашка", ago(8), now), /без движения 8 дней\.$/);
  assert.match(tidyItem("Ромашка", ago(16), now), /через 5 дней уйдёт в «проиграли»/);
  assert.equal(autoLostNotice(new Map()), null);
  assert.match(autoLostNotice(new Map([["Ренат", 2], ["Истам", 5]])) ?? "", /Истам — 5, Ренат — 2/);
});

test("в вечернем отчёте — сгоревшие предложения и лиды без движения", () => {
  const p: StaffDay = {
    name: "Ренат",
    role: "manager",
    report: { name: "Ренат", target: 5, done: 5, skipped: 0, short: 0, stream: 0, touches: 5 },
    panel: { views: 3, top: [], minutes: 30, firstAt: null, lastAt: null },
    actions: 2,
    leadsTaken: 0,
    offersBurned: 2,
    staleLeads: 12,
  };
  assert.match(workLine(p), /⌛ сгорело 2 предложения лидов/);
  assert.match(workLine(p), /🗂 12 лидов без движения 7\+ дней/);
  const text = staffReportText("2026-10-13", [p]);
  assert.match(text, /Сгорели предложения тёплых лидов: Ренат \(2\)/);
  assert.match(text, /без движения 7\+ дней: 12/);
});

test("проводка: свип, кнопки бота, журнал, проект из лида, пометка в карточке", () => {
  assert.match(read("app/api/reminders/sweep/route.ts"), /runLeadTidy\(new Date\(\)\)/);
  assert.match(read("app/api/telegram/webhook/route.ts"), /parts\[0\] === TIDY_CALLBACK/);
  for (const a of ["lead.idle_snoozed", "lead.auto_lost"]) assert.ok((AUDIT_ACTIONS as readonly string[]).includes(a), a);
  const projects = read("lib/admin/projects.ts");
  assert.match(projects, /assigned_staff_id/);
  assert.match(projects, /staff\.role !== "manager" && leadOwner/);
  assert.match(read("app/admin/projects/actions.ts"), /leadId: String\(formData\.get\("lead"\)/);
  assert.match(read("lib/admin/ownership.ts"), /update\(\{ status, tidy_auto_lost_at: null \}\)/, "смена статуса снимает пометку");
  assert.match(read("app/admin/leads/[id]/page.tsx"), /lead\.tidy_auto_lost_at/);
  const store = read("lib/admin/lead-tidy-store.ts");
  assert.match(store, /\.eq\("status", "taken"\)\s*\.select\("id"\)/, "закрываем только то, что ещё «в работе»");
  assert.match(store, /wants\(r\.notify_off as string\[\] \| null, "reports"\)/);
});
