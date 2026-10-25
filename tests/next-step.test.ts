/**
 * «Следующий шаг» у лида (lib/admin/next-step.ts, next-step-store.ts).
 *
 * Владелец, 25.10.2026, на разбор «чем мы уступаем Pipedrive»: «Погнали по
 * порядку». Шаг — ближайшее открытое напоминание; лид «в работе» без шага
 * виден в списке; пока шаг впереди, бот «Порядок в лидах» о лиде молчит.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { nextStepOf, stepState } from "@/lib/admin/next-step";
import { askable } from "@/lib/admin/lead-tidy";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const NOW = Date.parse("2026-10-25T09:00:00Z");

test("шаг — ближайшее открытое напоминание, закрытые не в счёт", () => {
  const step = nextStepOf([
    { due_at: "2026-10-28T05:00:00Z", note: "позже", done_at: null },
    { due_at: "2026-10-24T05:00:00Z", note: "закрыто", done_at: "2026-10-24T06:00:00Z" },
    { due_at: "2026-10-26T05:00:00Z", note: "созвон", done_at: null },
  ]);
  assert.deepEqual(step, { due_at: "2026-10-26T05:00:00Z", note: "созвон" });
  assert.equal(nextStepOf([]), null);
});

test("в списке: впереди, просрочен, «нет шага» — только у лида в работе за кем-то", () => {
  const taken = { status: "taken", assigned_staff_id: "s-1" };
  assert.equal(stepState({ due_at: "2026-10-26T05:00:00Z", note: null }, taken, NOW), "planned");
  assert.equal(stepState({ due_at: "2026-10-24T05:00:00Z", note: null }, taken, NOW), "late");
  assert.equal(stepState(null, taken, NOW), "none");
  assert.equal(stepState(null, { status: "new", assigned_staff_id: null }, NOW), "na");
  assert.equal(stepState(null, { status: "won", assigned_staff_id: "s-1" }, NOW), "na");
});

test("бот «Порядок в лидах»: шаг впереди — как «⏳», до срока не спрашивает", () => {
  const store = read("lib/admin/lead-tidy-store.ts");
  assert.match(store, /from\("lead_reminders"\)\.select\("lead_id, due_at"\)\.in\("lead_id", part\)\.is\("done_at", null\)\.gt\("due_at", nowIso\)/);
  assert.match(store, /snoozedUntil: laterOf\(\(l\.tidy_snoozed_until as string \| null\) \?\? null, planned\.get\(l\.id as string\) \?\? null\)/);
  // Сама проверка «без движения» — прежняя: отсрочка в будущем лид не трогает.
  const old = new Date(NOW - 10 * 86_400_000).toISOString();
  const lead = { id: "l", label: "x", ownerId: "s", movedAt: old, askedAt: null, firstAskedAt: null, waitStreak: 0 };
  assert.equal(askable({ ...lead, snoozedUntil: null }, new Date(NOW)), true);
  assert.equal(askable({ ...lead, snoozedUntil: "2026-10-27T05:00:00Z" }, new Date(NOW)), false);
});

test("список и карточка показывают шаг; запрос — один на страницу", () => {
  const page = read("app/admin/page.tsx");
  assert.match(page, /const steps = board \? \{\} : await nextStepsFor\(leads\.rows\.map\(\(l\) => l\.id\)\)\.catch\(\(\) => \(\{\}\)\);/);
  assert.match(page, /<LeadTable rows=\{leads\.rows\} locale=\{locale\} steps=\{steps\} \/>/);
  assert.match(read("components/admin/lead-table.tsx"), /stepState\(steps\[lead\.id\], lead, now\)/);
  const card = read("app/admin/leads/[id]/page.tsx");
  assert.match(card, /const next = nextStepOf\(reminders\);/);
  assert.match(card, /t\.nextStep\(when\(next\.due_at\), next\.note\)/);
});
