/**
 * Переписка по касанию идёт за лидом (lib/admin/talk-follows-lead.ts).
 *
 * 28 сентября отключили Мадину: её лиды из касаний ушли в очередь и
 * достались другим, а переписки по ним — её руководителю. Лид у одного,
 * ответы клиента и дожим — у другого. Владелец: «поправь, чтобы переписка
 * сама шла за лидом».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { LIVE_TALK } from "@/lib/admin/talk-follows-lead";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("за лидом идут только живые разговоры — те же, что при отключении уходят наследнику", () => {
  assert.deepEqual([...LIVE_TALK], ["sending", "sent", "manual"]);
  const offboarding = read("lib/admin/offboarding.ts");
  assert.match(offboarding, /\.in\("status", \[\.\.\.LIVE_TALK\]\)/, "отключение и передача разошлись в том, что считать разговором");
});

test("разговор переезжает к новому хозяину и забывает «Отвечать самому» прежнего", () => {
  const helper = read("lib/admin/talk-follows-lead.ts");
  assert.match(helper, /\.update\(\{ claimed_by: staffId, handled_by: null \}\)/);
  assert.match(helper, /\.eq\("lead_id", leadId\)/);
});

test("взял лид из очереди — разговор твой, и это видно в журнале", () => {
  const src = read("lib/admin/ownership.ts");
  const start = src.indexOf("export async function takeLead(");
  const body = src.slice(start, src.indexOf("\nexport async function", start + 1));
  const guardAt = body.indexOf('.is("assigned_staff_id", null)');
  const takenAt = body.indexOf('if (!data) return { ok: false, reason: "taken" };');
  const followAt = body.indexOf("await talkFollowsLead(leadId, staff.id)");
  const recordAt = body.indexOf('record("lead.taken"');
  assert.ok(guardAt > 0 && takenAt > guardAt, "взятие потеряло защиту от двойного нажатия");
  assert.ok(followAt > takenAt, "разговор переезжает раньше, чем стало ясно, что лид взят именно этим человеком");
  assert.ok(recordAt > followAt, "в журнале не будет видно, какой разговор переехал");
  assert.match(body, /meta: talk \? \{ via, talk \} : \{ via \}/);
});

test("передал лид — разговор уходит вместе с ним", () => {
  const src = read("lib/admin/transfers.ts");
  const start = src.indexOf("async function move(");
  const body = src.slice(start, src.indexOf("\n}\n", start));
  const failAt = body.indexOf("if (error || !data)");
  const followAt = body.indexOf("await talkFollowsLead(leadId, toStaffId)");
  assert.ok(failAt > 0 && followAt > failAt, "разговор переезжает даже тогда, когда лид передать не удалось");
  assert.match(body, /meta: talk \? \{ to: toStaffId, talk \} : \{ to: toStaffId \}/);
});
