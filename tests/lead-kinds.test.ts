import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  LEAD_KINDS,
  LEAD_KIND_TITLE,
  TENDER_NICHE,
  keepLeadOff,
  leadKindOf,
  leadOffFromForm,
  mergeLeadOff,
  wantsLead,
  withFallback,
} from "@/lib/admin/lead-kinds";
import { tunesLeadKinds } from "@/lib/admin/roles";

/**
 * «Какие лиды присылать». Владелец, 13.11.2026: «Сделай так, чтобы
 * сотрудник мог выбирать, какие уведомления по лидам ему шлет бот: по
 * тендерам, лиды из групп, только партнеры и тд… Пусть будет возможность
 * самим настроить это всё.»
 */

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("вид лида — по каждому источнику, кодом", () => {
  assert.equal(leadKindOf({ source: "outreach" }), "outreach");
  assert.equal(leadKindOf({ source: "maps" }), "outreach");
  assert.equal(leadKindOf({ source: "scout", niche: TENDER_NICHE }), "tender");
  assert.equal(leadKindOf({ source: "scout", niche: "", notes: "⚠️ …\nЛот: https://xarid.uzex.uz/lot/1" }), "tender");
  assert.equal(leadKindOf({ source: "scout", niche: "интернет-магазин" }), "scout");
  assert.equal(leadKindOf({ source: "partner" }), "partner");
  assert.equal(leadKindOf({ source: "form", partnerId: "p1" }), "partner");
  assert.equal(leadKindOf({ source: "telegram", partnerPin: true }), "partner");
  for (const source of ["form", "chat", "telegram", "showcase", "box", "manual", null, ""]) {
    assert.equal(leadKindOf({ source }), "inbound", String(source));
  }
  assert.equal(leadKindOf({ source: "mockup" }), "mockup");
  assert.equal(leadKindOf({ source: "mockup-manual" }), "mockup");
});

test("по умолчанию все виды; снятые — строками lead:<вид> рядом с галочками бота", () => {
  for (const kind of LEAD_KINDS) assert.equal(wantsLead(null, kind), true);
  const off = leadOffFromForm(["outreach", "partner", "чужое"]);
  assert.deepEqual(off, ["lead:tender", "lead:scout", "lead:inbound", "lead:mockup"]);
  assert.equal(wantsLead(off, "tender"), false);
  assert.equal(wantsLead(off, "partner"), true);

  // Галочки бота и виды лидов не стирают друг друга.
  const merged = mergeLeadOff(["queue", "lead:tender"], ["lead:scout", "lead:нет"]);
  assert.deepEqual(merged, ["queue", "lead:scout"]);
  assert.deepEqual(keepLeadOff(merged, ["morning"]), ["morning", "lead:scout"]);
});

test("очередь: только те, кто хочет вид; никого — всем, с пометкой", () => {
  const people = [
    { id: "a", off: ["lead:tender"] },
    { id: "b", off: null },
  ];
  const offOf = (p: { off: string[] | null }) => p.off;
  assert.deepEqual(withFallback(people, offOf, "tender").people.map((p) => p.id), ["b"]);
  assert.equal(withFallback(people, offOf, "tender").fallback, false);

  const nobody = [{ id: "a", off: ["lead:tender"] }];
  const r = withFallback(nobody, offOf, "tender");
  assert.equal(r.fallback, true);
  assert.deepEqual(r.people.map((p) => p.id), ["a"]);

  // Без вида (равная доля ночью) — все.
  assert.equal(withFallback(people, offOf, null).people.length, 2);
  assert.equal(withFallback([], offOf, "tender").fallback, false);
});

test("себе — каждый, за человека — те же, кто ставит галочки бота", () => {
  assert.equal(tunesLeadKinds("manager", "manager", true), true);
  assert.equal(tunesLeadKinds("manager", "manager", false), false);
  assert.equal(tunesLeadKinds("head", "manager", false), true);
  assert.equal(tunesLeadKinds("head", "head", false), false);
  assert.equal(tunesLeadKinds("admin", "head", false), true);
});

test("названия на трёх языках, без кириллицы в узбекском и польском", () => {
  for (const kind of LEAD_KINDS) {
    for (const part of [LEAD_KIND_TITLE[kind].title, LEAD_KIND_TITLE[kind].note]) {
      assert.ok(part.ru && part.uz && part.pl, kind);
      assert.doesNotMatch(part.uz + part.pl, /[а-яё]/i, kind);
    }
  }
  assert.equal(LEAD_KIND_TITLE.outreach.title.ru, "Холодные касания");
  assert.equal(LEAD_KIND_TITLE.tender.title.ru, "Тендеры");
});

test("очередь, рассылка всем и партнёрские карточки смотрят вид лида", () => {
  const queue = read("lib/admin/lead-queue-store.ts");
  assert.match(queue, /queueCandidates\(now, kind\)/);
  assert.match(queue, /queueCandidates\(now, card\.kind\)/);
  assert.match(queue, /noteNobodyWants/);
  assert.match(queue, /salesRecipients\(kind\)/);
  assert.match(queue, /fallbackFor\(card\)/);
  // Равная доля ночью — по всей очереди, как раньше.
  assert.match(queue, /export async function shareOf[\s\S]*?queueCandidates\(now\);/);
  assert.match(read("lib/qualify/brief.ts"), /withFallback\(open/);
  assert.match(read("lib/partners/priority-lead.ts"), /withFallback\(rows,[^\n]*"partner"\)/);
  assert.match(read("lib/scout/tender-lead.ts"), /kind: "tender"/);
  // Галочки бота в «Команде» не стирают снятые виды.
  assert.match(read("lib/admin/notify-prefs.ts"), /keepLeadOff\(/);
  // Настройки: себе, id из сессии.
  assert.match(read("app/admin/settings/actions.ts"), /setLeadKinds\(staff\.id/);
});
