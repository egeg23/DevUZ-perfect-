/**
 * Отказы — не рассылаем, только считаем.
 *
 * Владелец, 23.10.2026, на карточку «📁 Не интересно» в боте: «Ты прямо
 * написал — не интересно. Ты просто веди статистику отказов, мы ее увидим в
 * дашборде. Не спамь отказами. Только заинтересованные рассылкой же
 * отправляются».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { hqDict } from "@/content/admin-panel/hq";
import { refusalStamps, touchesPulse, type HqLead, type HqProspect } from "@/lib/admin/hq";
import { refusedText } from "@/lib/qualify/closing";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const NOW = new Date("2026-10-23T10:00:00Z");
const ago = (days: number) => new Date(NOW.getTime() - days * 24 * 3600_000).toISOString();

const prospect = (over: Partial<HqProspect>): HqProspect => ({
  id: "p",
  status: "sent",
  touched_by: null,
  touched_at: null,
  sent_at: null,
  autopilot_at: null,
  replied_at: null,
  ...over,
});
const lead = (over: Partial<HqLead>): HqLead => ({
  id: "l",
  created_at: ago(1),
  status: "lost",
  priority: "archive",
  assigned_staff_id: null,
  label: "DZ-1",
  ...over,
});

test("первичка: отказ не уходит ни менеджеру, ни в очередь, лид сразу закрыт", () => {
  const engine = read("lib/qualify/engine.ts");
  assert.match(engine, /const refused = lead\.priority === "archive";/);
  const delivery = engine.slice(engine.indexOf("const refused = lead.priority"), engine.indexOf("const lost ="));
  assert.match(delivery, /if \(refused\) \{\n\s*\/\/ ни карточки, ни очереди\n\s*\} else if \(options\.existing\)/, "отказ — первой веткой, до sendLead и routeNewLead");
  assert.match(engine, /const lost = !refused && !delivered && !leadId;/);
  assert.match(engine, /refused \? refusedText\(locale\) : closingText/);
  assert.match(read("lib/qualify/store.ts"), /status: lead\.priority === "archive" \? "lost" : "new"/);
});

test("касание: отказ закрывает его само, без строки человеку и без ответа клиенту", () => {
  const store = read("lib/admin/outreach-talk-store.ts");
  const close = store.slice(store.indexOf("export async function closeRefused"), store.indexOf("export async function handOver"));
  assert.match(close, /closed_reason: "refused"/);
  assert.match(close, /ai_handling: false/);
  assert.match(close, /\.eq\("status", "queued"\)/, "неушедшие наши сообщения снимаются");
  assert.match(close, /via: "auto"/);
  assert.doesNotMatch(close, /tellManager|sendMessage|sendWithRows/, "никому ничего не пишем");

  // Отказ словами — до строки менеджеру.
  const inbound = store.slice(store.indexOf('if (verdict === "stop") {'), store.indexOf("if (verdict !== \"talk\" && !announced)"));
  assert.match(inbound, /await closeRefused\(String\(prospect\.id\), body\);\n\s*return/);

  // Отказ из первички — касание закрыто, ответ модели не ставится в очередь.
  const run = read("lib/admin/outreach-talk-run.ts");
  assert.match(run, /refused = event\.lead\.priority === "archive";/);
  const after = run.slice(run.indexOf("if (refused) {"), run.indexOf("withoutOpener(text)"));
  assert.match(after, /await closeRefused\(inbound\.prospectId, inbound\.body\);\n\s*return "handed";/);
  assert.ok(run.indexOf("if (refused) {") < run.indexOf("await queueReply({\n    prospectId: inbound.prospectId,\n    leadId: inbound.leadId,\n    body: text.trim()"));
});

test("«Главная»: отказы за 7 дней — по закрытым касаниям и «не интересно» не из касания", () => {
  const prospects = [
    prospect({ id: "a", closed_reason: "refused", closed_at: ago(1) }),
    prospect({ id: "b", closed_reason: "refused", closed_at: ago(9) }),
    prospect({ id: "c", closed_reason: "ignored", closed_at: ago(1) }),
  ];
  const leads = [
    lead({ id: "chat", source: "web", created_at: ago(2) }),
    lead({ id: "touch", source: "outreach", created_at: ago(2) }),
    lead({ id: "warm", priority: "warm", source: "web" }),
  ];
  const stamps = refusalStamps(prospects, leads);
  assert.equal(stamps.length, 3, "игнор и тёплый — не отказ; отказ касания не считаем дважды");
  const pulse = touchesPulse(prospects, [], { enabled: false, target: 0 }, NOW, stamps);
  assert.deepEqual(pulse.refused7, { now: 2, prev: 1 });

  const view = read("components/admin/hq.tsx");
  assert.match(view, /label=\{t\.refused7\} value=\{touches\.refused7\.now\} sub=\{<Delta trend=\{touches\.refused7\} t=\{t\} goodUp=\{false\} \/>\}/);
  assert.equal(hqDict.refused7.ru, "отказов за 7 дней");
  const hqStore = read("lib/admin/hq-store.ts");
  assert.match(hqStore, /closed_reason, closed_at"\)/);
  assert.match(hqStore, /closed_at\.gte\."\$\{from\}"/);
});

test("клиенту в чате — короткое «понял», без «передал менеджеру», на каждом языке", () => {
  for (const locale of ["ru", "en", "uz", "zh", "uk", "pl"] as const) {
    const text = refusedText(locale);
    assert.ok(text.length > 10 && text.length < 120, locale);
    assert.doesNotMatch(text, /менеджер|manager|—/i, locale);
  }
});
