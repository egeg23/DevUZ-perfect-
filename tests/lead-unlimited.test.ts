/**
 * Лиды без лимита — ночная равная доля не держит тех, кому её снял владелец.
 *
 * Владелец, 23.10.2026: «Сотрудникам Дина и Александр руководителю — им
 * делаем безлимит по количеству лидов которые могут брать».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { capsShare, mayTake } from "@/lib/admin/lead-queue";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("потолок равной доли — у всех в очереди, кроме владельца и «без лимита»", () => {
  assert.equal(capsShare({ role: "manager" }), true);
  assert.equal(capsShare({ role: "head", lead_unlimited: false }), true);
  assert.equal(capsShare({ role: "manager", lead_unlimited: true }), false);
  assert.equal(capsShare({ role: "head", lead_unlimited: true }), false);
  assert.equal(capsShare({ role: "admin" }), false);
});

test("без доли ночной лид берётся сверх равной доли, днём очередь та же", () => {
  const now = new Date("2026-10-23T16:00:00Z");
  const over = { mine: 9, total: 10, people: 7 };
  assert.deepEqual(mayTake({ role: "manager", staffId: "d", offers: [], openedAt: now.toISOString(), now, share: over }).ok, false);
  // nightShareFor отдаёт null тому, у кого лимита нет, — mayTake доли не видит.
  assert.equal(mayTake({ role: "manager", staffId: "d", offers: [], openedAt: now.toISOString(), now, share: null }).ok, true);
  const offers = [{ staffId: "other", expiresAt: new Date(now.getTime() + 600_000).toISOString(), outcome: null }];
  assert.equal(mayTake({ role: "head", staffId: "a", offers, openedAt: null, now, share: null }).ok, false, "чужие полчаса днём не берутся");
});

test("проверка стоит и при «Взять», и в карточке лида; база молчит — потолок как раньше", () => {
  const store = read("lib/admin/lead-queue-store.ts");
  const fn = store.slice(store.indexOf("export async function nightShareFor"), store.indexOf("export async function nightShareFor") + 700);
  assert.match(fn, /select\("lead_unlimited"\)/);
  assert.match(fn, /lead_unlimited: data\?\.lead_unlimited === true/);
  assert.match(read("lib/admin/ownership.ts"), /queue\.fairShare \? await nightShareFor\(staff\) : null/);
  assert.match(read("app/admin/leads/[id]/page.tsx"), /free && queue\.fairShare \? await nightShareFor\(staff\) : null/);
});

test("снимает и возвращает лимит только владелец, только менеджеру и руководителю, с журналом", () => {
  const team = read("lib/admin/team.ts");
  const fn = team.slice(team.indexOf("export async function setLeadUnlimited"), team.indexOf("/** Сколько админов сейчас работает."));
  assert.match(fn, /if \(actor\.role !== "admin"\) return \{ ok: false, reason: "forbidden" \};/);
  assert.match(fn, /\.in\("role", \["manager", "head"\]\)/);
  assert.match(fn, /record\("staff\.lead_unlimited"/);
  const actions = read("app/admin/team/actions.ts");
  assert.match(actions.slice(actions.indexOf("export async function setUnlimited")), /await requireAdmin\(\)/);
  const page = read("app/admin/team/page.tsx");
  assert.match(page, /viewer\.role === "admin" && \(member\.role === "manager" \|\| member\.role === "head"\) \? \(\s*<UnlimitedBlock/);
  assert.match(read("supabase/migrations/0172_staff_lead_unlimited.sql"), /add column if not exists lead_unlimited boolean not null default false/);
});
