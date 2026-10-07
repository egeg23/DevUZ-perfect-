import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { HOUR_MS, sendWindowOpen } from "@/lib/admin/outreach";
import { botQueueNote, etaClock, etaText, queueEtas, untilText, type EtaAccount, type EtaJob } from "@/lib/admin/queue-eta";

/**
 * Владелец, 07.10.2026: «Менеджеры должны видеть примерное время отправки
 * сообщений из очереди, а то переживают, что сообщения не уйдут».
 */

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
/** Время по Ташкенту (UTC+5) — в миллисекундах UTC. */
const tash = (iso: string) => Date.parse(`${iso}+05:00`);
const account = (key: string, extra: Partial<EtaAccount> = {}): EtaAccount => ({ key, cap: 3, until: null, sent: [], lastAt: null, ...extra });
const job = (id: string, extra: Partial<EtaJob> = {}): EtaJob => ({ id, owner: false, accounts: undefined, ...extra });
const etas = (jobs: EtaJob[], accounts: EtaAccount[], now: number) => queueEtas({ jobs, accounts, now, ownerFloorMs: 60_000 });

test("письмо ждёт аккаунт, который Telegram ограничил, — и это сказано, а не «через 20 минут»", () => {
  const now = tash("2026-10-07T14:10:00");
  const until = tash("2026-10-08T13:07:00");
  const out = etas(
    [job("m1", { accounts: new Set(["men"]) }), job("free")],
    [account("main"), account("men", { until }), account("women")],
    now,
  );
  const pinned = out.get("m1")!;
  assert.ok(pinned.at !== null && pinned.at >= until, "письмо ушло раньше, чем аккаунт снова может писать");
  assert.equal(pinned.heldUntil, until);
  // Письмо без привязки берёт свободный аккаунт сразу.
  assert.equal(out.get("free")!.at, now);
  assert.equal(out.get("free")!.heldUntil, null);
});

test("после 20:30 очередь стоит до утра: ни одно письмо не уходит ночью", () => {
  const now = tash("2026-10-07T20:00:00");
  const jobs = Array.from({ length: 8 }, (_, i) => job(`j${i}`));
  const out = etas(jobs, [account("main")], now);
  for (const eta of out.values()) assert.ok(eta.at !== null && sendWindowOpen(eta.at), "письмо попало в ночь");
  // Сегодня до 20:30 уходит не больше трёх, остальные — завтра с 07:30.
  const today = [...out.values()].filter((e) => e.at! < tash("2026-10-07T20:30:00"));
  assert.ok(today.length <= 3);
  const first = Math.min(...[...out.values()].filter((e) => e.at! > tash("2026-10-08T00:00:00")).map((e) => e.at!));
  assert.equal(first, tash("2026-10-08T07:30:00"));
});

test("каждый аккаунт — не больше своего предела в любой час, с учётом уже ушедших", () => {
  const now = tash("2026-10-07T10:00:00");
  const sent = [tash("2026-10-07T09:20:00"), tash("2026-10-07T09:40:00")];
  const jobs = Array.from({ length: 12 }, (_, i) => job(`j${i}`));
  const out = etas(jobs, [account("main", { sent, lastAt: sent[1] })], now);
  const times = [...sent, ...[...out.values()].map((e) => e.at!)].sort((a, b) => a - b);
  for (const t of times) assert.ok(times.filter((x) => x > t - HOUR_MS && x <= t).length <= 3, "больше трёх в час");
  // Порядок очереди сохраняется: перед вторым — одно письмо.
  assert.equal(out.get("j1")!.ahead, 1);
});

test("письмо владельца уходит первым, мимо предела", () => {
  const now = tash("2026-10-07T10:00:00");
  const full = [tash("2026-10-07T09:20:00"), tash("2026-10-07T09:30:00"), tash("2026-10-07T09:40:00")];
  const out = etas([job("a"), job("b"), job("boss", { owner: true })], [account("main", { sent: full, lastAt: full[2] })], now);
  assert.equal(out.get("boss")!.ahead, 0);
  assert.equal(out.get("boss")!.at, now);
  assert.ok(out.get("a")!.at! > now);
});

test("автор отмечен только на выключенном аккаунте — письмо честно «не уйдёт»", () => {
  const out = etas([job("x", { accounts: new Set(["paused"]) })], [account("main")], tash("2026-10-07T10:00:00"));
  assert.equal(out.get("x")!.at, null);
});

test("время — часами по Ташкенту, словами человека", () => {
  const now = tash("2026-10-07T14:10:00");
  assert.deepEqual(etaClock(tash("2026-10-07T14:11:00"), now).day, "soon");
  assert.equal(etaText(tash("2026-10-07T15:17:00"), now), "сегодня около 15:20");
  assert.equal(etaText(tash("2026-10-08T07:30:00"), now), "завтра около 07:30");
  assert.equal(etaText(tash("2026-10-09T13:12:00"), now), "09.10 около 13:15");
  assert.equal(untilText(tash("2026-10-08T13:07:00")), "08.10 13:07");
});

test("бот: время на кнопке, а ограниченный аккаунт — отдельным сообщением", () => {
  const now = tash("2026-10-07T14:10:00");
  const plain = botQueueNote({ at: tash("2026-10-07T15:00:00"), ahead: 2, heldUntil: null }, now);
  assert.equal(plain.label, "📤 В очереди · уйдёт сегодня около 15:00");
  assert.equal(plain.note, null);
  const held = botQueueNote({ at: tash("2026-10-08T13:10:00"), ahead: 9, heldUntil: tash("2026-10-08T13:07:00") }, now);
  assert.match(held.note!, /ограничил до 08\.10 13:07/);
  assert.match(held.note!, /уйдёт завтра около 13:10/);
  assert.ok(botQueueNote({ at: null, ahead: 0, heldUntil: null }, now).note);
  // В HTML-режиме бота угловые скобки ломают сообщение.
  for (const n of [held.note!, botQueueNote({ at: null, ahead: 0, heldUntil: null }, now).note!]) assert.ok(!/[<>&]/.test(n));

  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /botQueueNote\(\(await loadQueueEtas\(now\)\)\.get\(prospectId\), now\)/);
  assert.match(hook, /await touched\(queued\.label\)/);
  assert.match(hook, /if \(queued\.note && query\.message\) await sendMessage\(query\.message\.chat\.id, queued\.note\)/);
});

test("панель: время у каждой карточки очереди и после «Отправить»", () => {
  const page = read("app/admin/prospect/page.tsx");
  assert.match(page, /loadQueueEtas\(\)/);
  assert.match(page, /etas=\{Object\.fromEntries\(etas\)\}/);
  const list = read("components/admin/outreach-list.tsx");
  assert.match(list, /t\.inQueueAt\(etaLabel\(eta\.at, now, t\)\)/);
  assert.match(list, /t\.etaHeld\(untilText\(eta\.heldUntil\)\)/);
  assert.match(list, /t\.etaNever/);
  assert.match(list, /t\.sentNotice\(etaLabel\(openEta\.at, now, t\)\)/);
  // «в ближайшие минуты» при любой очереди больше не обещаем.
  assert.ok(!/в ближайшие минуты, лид/.test(read("content/admin-panel/prospect.ts")));
});

test("расчёт читает то же, что скаут: очередь, владельцев, привязку и пределы аккаунтов", () => {
  const queue = read("lib/admin/outreach-queue.ts");
  const fn = queue.slice(queue.indexOf("export async function loadQueueEtas"));
  assert.match(fn, /\.eq\("status", "sending"\)\.order\("claimed_at", \{ ascending: true \}\)/);
  assert.match(fn, /ownerIds\(db\)/);
  assert.match(fn, /assignments\(db\)/);
  assert.match(fn, /\.from\("tg_accounts"\)\.select\("id, hourly_cap, flood_until"\)\.eq\("status", "active"\)/);
  assert.match(fn, /\.or\(SENT_BY_ACCOUNT\)/);
  assert.match(fn, /accountState\(MAIN_ACCOUNT, HOURLY_CAP, mainUntil \? new Date\(mainUntil\)\.toISOString\(\) : null\)/);
  assert.match(fn, /ownerFloorMs: OWNER_FLOOR_MS/);
});
