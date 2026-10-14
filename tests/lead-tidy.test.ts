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
  BATCH,
  TIDY_SLOTS,
  WAIT_LIMIT,
  afterPress,
  autoLose,
  autoLostNotice,
  batchRows,
  batchText,
  batches,
  botSilenceNotice,
  canWait,
  dueFor,
  idleDays,
  parseTidyCallback,
  pickToAsk,
  silentToBot,
  silentWorkdays,
  stale,
  thirdWaitNotice,
  tidyCallback,
  tidySlot,
  tidySummary,
  tidyWindow,
  unanswered,
  type IdleLead,
} from "@/lib/admin/lead-tidy";
import { staffReportText, workLine, type StaffDay } from "@/lib/admin/staff-report";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const DAY = 86_400_000;
// 14.10.2026 (среда), 10:30 по Ташкенту.
const now = new Date("2026-10-14T05:30:00Z");
const ago = (d: number) => new Date(now.getTime() - d * DAY).toISOString();
const ID = "11111111-2222-3333-4444-555555555555";
const lead = (over: Partial<IdleLead> = {}): IdleLead => ({
  id: ID,
  label: "Ромашка",
  ownerId: "m1",
  movedAt: ago(8),
  snoozedUntil: null,
  askedAt: null,
  firstAskedAt: null,
  waitStreak: 0,
  ...over,
});

test("два захода в день: 10:00–15:59 и 16:00–17:59, ночью — ничего", () => {
  assert.deepEqual([...TIDY_SLOTS], [10, 16]);
  assert.equal(tidySlot(new Date("2026-10-14T04:59:00Z")), null, "09:59");
  assert.equal(tidySlot(new Date("2026-10-14T05:00:00Z")), 10, "10:00");
  assert.equal(tidySlot(new Date("2026-10-14T10:59:00Z")), 10, "15:59");
  assert.equal(tidySlot(new Date("2026-10-14T11:00:00Z")), 16, "16:00");
  assert.equal(tidySlot(new Date("2026-10-14T13:00:00Z")), null, "18:00");
  assert.equal(tidySlot(new Date("2026-10-14T20:00:00Z")), null, "01:00 ночи");
  assert.equal(tidyWindow(new Date("2026-10-14T19:00:00Z")), false);
});

test("ночью и в выходные не шлём, отметка — на заход", () => {
  const store = read("lib/admin/lead-tidy-store.ts");
  assert.match(store, /if \(!isWorkday\(now\)\) return result;/);
  assert.match(store, /const slot = tidySlot\(now\);\s*if \(!slot\) return result;/);
  assert.match(store, /`lead-tidy:\$\{mark\}`/, "у каждого захода своя отметка — второй в 16:00 не теряется");
});

test("висит — 7+ дней без движения", () => {
  assert.equal(stale(lead({ movedAt: ago(6) }), now), false);
  assert.equal(stale(lead({ movedAt: ago(7) }), now), true);
  assert.equal(idleDays(ago(21), now), 21);
});

test("охват — все неотвеченные, самые старые первыми; отложенные задачей — мимо", () => {
  const leads = [
    lead({ id: "a", movedAt: ago(30) }),
    lead({ id: "b", movedAt: ago(10) }),
    lead({ id: "c", movedAt: ago(20) }),
    lead({ id: "d", movedAt: ago(15) }),
    lead({ id: "e", movedAt: ago(40), snoozedUntil: new Date(now.getTime() + DAY).toISOString() }),
    lead({ id: "f", movedAt: ago(50), askedAt: ago(0.1), firstAskedAt: ago(1) }),
    lead({ id: "g", movedAt: ago(3) }),
    lead({ id: "h", ownerId: "m2", movedAt: ago(9) }),
  ];
  const picked = pickToAsk(leads, now);
  assert.deepEqual(picked.get("m1")?.map((l) => l.id), ["f", "a", "c", "d", "b"], "спрошенный утром и не ответивший — снова");
  assert.deepEqual(picked.get("m2")?.map((l) => l.id), ["h"]);
  // Срок задачи прошёл — снова спрашиваем.
  assert.equal(pickToAsk([lead({ snoozedUntil: ago(0.5) })], now).get("m1")?.length, 1);
});

test("порции до восьми: сводка и кнопки на каждый лид", () => {
  assert.equal(BATCH, 8);
  const many = Array.from({ length: 19 }, (_, i) => lead({ id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}` }));
  const parts = batches(many);
  assert.deepEqual(parts.map((p) => p.length), [8, 8, 3]);
  const rows = batchRows(parts[1], 9);
  assert.equal(rows.length, 8);
  assert.deepEqual(rows[0].map((b) => b.text), ["🏆 9", "❌ 9", "⏳ 9"]);
  assert.ok(rows.every((r) => r.every((b) => b.callback_data.length <= 64)));
  const text = batchText(parts[1].map((l) => ({ label: l.label, movedAt: l.movedAt })), now, 2, 3, 9);
  assert.match(text, /^Часть 2 из 3:\n<b>9\.<\/b> Ромашка — 8 дней/);
  assert.match(tidySummary(19, 10), /У вас 19 лидов/);
  assert.match(tidySummary(19, 16), /Напоминаю: 19 лидов/);
});

test("нажатие гасит только ряд своего лида", () => {
  const a = lead({ id: "aaaaaaaa-0000-0000-0000-000000000001" });
  const b = lead({ id: "bbbbbbbb-0000-0000-0000-000000000002" });
  const kb = batchRows([a, b]);
  const after = afterPress(kb, a.id, "won");
  assert.deepEqual(after[0], [{ text: "1 · 🏆 выиграли", callback_data: "noop" }]);
  assert.deepEqual(after[1], kb[1]);
});

test("«ещё в работе» — срок шага и задача; третий раз подряд — последний", () => {
  assert.equal(WAIT_LIMIT, 3);
  assert.equal(canWait({ waitStreak: 2 }), true, "третий раз ещё можно — и о нём узнает руководитель");
  assert.equal(canWait({ waitStreak: 3 }), false);
  assert.deepEqual(batchRows([lead({ waitStreak: 3 })])[0].map((b) => b.text), ["🏆 1", "❌ 1"], "у отложившего трижды — без ⏳");
  for (const t of ["w1", "w3", "w7"] as const) {
    assert.deepEqual(parseTidyCallback(tidyCallback(t, ID).split(":")), { answer: t, leadId: ID });
  }
  // Среда 10:30 → завтра четверг 10:00; через 3 дня (суббота) → понедельник.
  assert.equal(dueFor("w1", now).toISOString(), "2026-10-15T05:00:00.000Z");
  assert.equal(dueFor("w3", now).toISOString(), "2026-10-19T05:00:00.000Z");
  assert.equal(dueFor("w7", now).toISOString(), "2026-10-21T05:00:00.000Z");
  const store = read("lib/admin/lead-tidy-store.ts");
  assert.match(store, /createTasks\(/, "задача — через createTasks");
  assert.match(store, /tidy_snoozed_until: due\.toISOString\(\), tidy_wait_streak: next/);
  assert.match(store, /if \(next === WAIT_LIMIT\)/);
  assert.match(store, /"lead\.idle_snoozed"\]/, "«ещё в работе» не считается движением");
  assert.match(thirdWaitNotice("Камила", "X"), /Камила третий раз откладывает лид «X»/);
});

test("молчит боту два рабочих дня — руководителю строка", () => {
  // Спросили в понедельник 12.10: понедельник и вторник без ответа — в среду два.
  assert.equal(silentWorkdays("2026-10-12T05:00:00Z", now), 2);
  assert.equal(silentWorkdays("2026-10-13T05:00:00Z", now), 1);
  // Пятница 09.10: пятница, выходные не в счёт, понедельник, вторник — три.
  assert.equal(silentWorkdays("2026-10-09T05:00:00Z", now), 3);
  assert.equal(silentToBot(lead({ firstAskedAt: "2026-10-12T05:00:00Z" }), now), true);
  assert.equal(silentToBot(lead({ firstAskedAt: "2026-10-13T05:00:00Z" }), now), false);
  assert.equal(unanswered(lead({ firstAskedAt: "2026-10-13T05:00:00Z" }), now), true);
  assert.equal(unanswered(lead(), now), false, "не спрашивали — не «без ответа»");
  assert.match(botSilenceNotice("Камила", 12), /^📵 Камила: 12 лидов без ответа боту/);
});

test("сам в «проиграли» — только 21+ день, спросили и три дня без ответа", () => {
  assert.equal(autoLose(lead({ movedAt: ago(25) }), now), false, "не спрашивали — не закрываем");
  assert.equal(autoLose(lead({ movedAt: ago(25), firstAskedAt: ago(4) }), now), true);
  assert.equal(autoLose(lead({ movedAt: ago(25), firstAskedAt: ago(1), askedAt: ago(0.1) }), now), false, "вопрос свежий");
  assert.equal(autoLose(lead({ movedAt: ago(20), firstAskedAt: ago(10) }), now), false, "меньше 21 дня");
  assert.equal(autoLose(lead({ movedAt: ago(25), firstAskedAt: ago(30) }), now), false, "спрашивали до последнего движения");
  assert.equal(
    autoLose(lead({ movedAt: ago(25), firstAskedAt: ago(4), snoozedUntil: new Date(now.getTime() + DAY).toISOString() }), now),
    false,
    "задача «Связаться» ещё впереди — не закрываем",
  );
  assert.equal(autoLostNotice(new Map()), null);
  assert.match(autoLostNotice(new Map([["Ренат", 2], ["Истам", 5]])) ?? "", /Истам — 5, Ренат — 2/);
});

test("кнопки: свой формат, чужое не разбирается", () => {
  assert.equal(tidyCallback("won", ID), `lt:won:${ID}`);
  assert.equal(parseTidyCallback(["lt", "drop", ID]), null);
  assert.equal(parseTidyCallback(["lt", "won", "x"]), null);
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
  assert.match(
    read("lib/admin/ownership.ts"),
    /update\(\{ status, tidy_auto_lost_at: null, tidy_first_asked_at: null, tidy_wait_streak: 0 \}\)/,
    "смена статуса снимает пометку и обнуляет счёт бота",
  );
  assert.match(read("app/admin/leads/[id]/page.tsx"), /lead\.tidy_auto_lost_at/);
  const store = read("lib/admin/lead-tidy-store.ts");
  assert.match(store, /\.eq\("status", "taken"\)\s*\.select\("id"\)/, "закрываем только то, что ещё «в работе»");
  assert.match(store, /wants\(r\.notify_off, "reports"\)/);
});

test("«Главная»: без ответа боту у человека и строка, если больше пяти", async () => {
  const { attentionOf, attentionHref, BOT_SILENT_ALERT } = await import("@/lib/admin/hq");
  assert.equal(BOT_SILENT_ALERT, 5);
  const base = {
    role: "admin" as const,
    now,
    sweep: null,
    autopilotTrouble: null,
    bans: [],
    circlesMissing: { ru: [], uz: [] },
    circleFallback: [],
    leads: { unowned: [] } as never,
    burned: [],
    overdue: [],
    stale: [],
    transfers: [],
    contracts: [],
    ending: [],
    firecrawlRemaining: null,
  };
  const items = attentionOf({
    ...base,
    botSilent: [
      { id: "s1", label: "Камила", n: 12 },
      { id: "s2", label: "Дина", n: 5 },
    ],
  } as never);
  const silent = items.filter((a) => a.kind === "botSilent");
  assert.equal(silent.length, 1, "пять — ещё не повод, двенадцать — повод");
  assert.equal(attentionHref(silent[0]), "/admin?owner=s1&status=taken", "ссылка — в его лиды «в работе»");
  const store = read("lib/admin/hq-store.ts");
  assert.match(store, /botSilent: silent\.get\(s\.id\) \?\? 0/);
});
