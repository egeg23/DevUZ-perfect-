import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { STAFF_REPLY_MAX, queueStaffReply } from "@/lib/admin/outreach-talk-store";

/**
 * Владелец, 11.10.2026: «чтобы у нас менеджеры не переключались между
 * несколькими аккаунтами, а общались прямо через внутреннюю карточку… это
 * будет автоматически делаться».
 */

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const between = (src: string, from: string, to: string) => {
  const start = src.indexOf(from);
  assert.ok(start >= 0, `нет ${from}`);
  return src.slice(start, src.indexOf(to, start));
};

test("пустой и слишком длинный ответ не встают в очередь", async () => {
  const base = { prospectId: "p", leadId: "l", staffId: "s" };
  assert.deepEqual(await queueStaffReply({ ...base, body: "   " }), { ok: false, reason: "empty" });
  assert.deepEqual(await queueStaffReply({ ...base, body: "x".repeat(STAFF_REPLY_MAX + 1) }), { ok: false, reason: "too_long" });
});

test("ответ ложится в очередь скаута, ИИ замолкает и его неотправленное снимается", () => {
  const fn = between(read("lib/admin/outreach-talk-store.ts"), "export async function queueStaffReply(", "\n}\n");
  // Только свой разговор и только на рабочем аккаунте: ручной маршрут отсюда не отправить.
  assert.match(fn, /String\(p\.lead_id \?\? ""\) !== input\.leadId/);
  assert.match(fn, /p\.target_kind === "manual"\) return \{ ok: false, reason: "manual" \}/);
  assert.match(fn, /ai_handling: false, handover_reason: "менеджер отвечает сам", handled_by: input\.staffId/);
  assert.match(fn, /\.update\(\{ status: "done", failure: STAFF_TOOK_OVER \}\)[\s\S]*?\.eq\("author", "ai"\)[\s\S]*?\.eq\("status", "queued"\)/);
  assert.match(fn, /direction: "out",\s*author: "staff",\s*body,\s*status: "queued"/);
  // Отправляет тот же скаут, что ответы модели: по аккаунту разговора.
  assert.match(read("lib/admin/outreach-talk-store.ts"), /const owner = accountOf\(p\.sent_via as string \| null\);\s*if \(owner !== account\)/);
});

test("снятое до отправки в ленте не показывается, у своего видно статус", () => {
  const view = between(read("lib/admin/outreach-talk-store.ts"), "export async function talkForLead(", "\n}\n");
  assert.match(view, /\.filter\(\(row\) => !\(row\.direction === "out" && row\.status === "done" && row\.failure\)\)/);
  const chat = read("components/admin/talk-chat.tsx");
  assert.match(chat, /line\.status === "queued"[\s\S]*?t\.lineQueued/);
  assert.match(chat, /line\.status === "failed"[\s\S]*?t\.lineFailed/);
});

test("права: ответить и читать свежую ленту может только тот, за кем лид", () => {
  const action = between(read("app/admin/leads/[id]/actions.ts"), "export async function replyInTalkAction(", "\n}\n");
  assert.match(action, /if \(!lead \|\| !canEdit\(lead, staff\) \|\| !prospectId\) return \{ ok: false, reason: "forbidden" \}/);
  assert.match(action, /record\("prospect\.staff_reply"/);
  const route = read("app/admin/leads/[id]/talk/route.ts");
  assert.match(route, /if \(!staff\) return NextResponse\.json\(\{ error: "login" \}, \{ status: 401 \}\)/);
  assert.match(route, /if \(!lead \|\| !canEdit\(lead, staff\)\)/);
});

test("чат обновляется сам, а поле ответа есть только у разговора на рабочем аккаунте", () => {
  const chat = read("components/admin/talk-chat.tsx");
  assert.match(chat, /fetch\(`\/admin\/leads\/\$\{leadId\}\/talk`/);
  assert.match(chat, /document\.visibilityState !== "visible"/);
  assert.match(chat, /\{from \? \(\s*<div className="mt-3">\s*<textarea/);
  assert.match(read("app/admin/leads/[id]/page.tsx"), /<TalkChat[\s\S]*?from=\{talk\.from \? t\.from\(talk\.from\.label, talk\.from\.handle\) : null\}/);
});

test("бот зовёт ответить в карточке, когда разговор на рабочем аккаунте", () => {
  const tell = between(read("lib/admin/outreach-talk-store.ts"), "export async function tellManager(", "\n}\n");
  assert.match(tell, /Ответить прямо в карточке лида — уйдёт с этого аккаунта:/);
  assert.match(tell, /\/admin\/leads\/\$\{p\.lead_id\}#talk/);
});
