/**
 * «Хотят прототип» — всей команде, кто первый взял, того и лид.
 *
 * Владелец, 02.10.2026: «Прототипы собираем мы в ручном режиме. После
 * подтверждения, что надо прототип, — сразу уведомление всем в телеграм, и
 * кто успеет взять — того и лид».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { HANDOVER_TEXT } from "@/lib/admin/outreach-talk";
import {
  PROTO_BUTTON,
  PROTO_CALLBACK,
  PROTO_FIRST_MINUTES,
  clientWords,
  protoAnnounceText,
  protoBroadcastDue,
  protoFirstText,
  protoCallback,
  protoDeadline,
  protoMovedText,
  protoTakenLabel,
  protoTakerText,
  tashkentClock,
} from "@/lib/admin/prototype-claim";
import { esc } from "@/lib/qualify/telegram";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

test("кнопка и срок: «Беру прототип», 12 часов от взятия, время по Ташкенту", () => {
  assert.equal(PROTO_BUTTON, "🛠 Беру прототип");
  assert.equal(protoCallback(ID), `${PROTO_CALLBACK}:${ID}`);
  assert.ok(Buffer.byteLength(protoCallback(ID)) <= 64, "Telegram не примет callback_data длиннее 64 байт");

  const taken = new Date("2026-10-02T13:15:00Z"); // 18:15 в Ташкенте
  assert.equal(protoDeadline(taken).toISOString(), "2026-10-03T01:15:00.000Z");
  assert.equal(tashkentClock(protoDeadline(taken)), "03.10, 06:15");
});

test("сначала — автору касания на 30 минут, потом всем: «бери срочно»", () => {
  assert.equal(PROTO_FIRST_MINUTES, 30);
  const asked = new Date("2026-10-02T13:00:00Z"); // 18:00 по Ташкенту
  assert.equal(protoBroadcastDue(asked, new Date("2026-10-02T13:29:00Z")), false);
  assert.equal(protoBroadcastDue(asked, new Date("2026-10-02T13:30:00Z")), true);

  const first = protoFirstText({ host: "mebel.uz", words: "Да, соберите", requestedAt: asked }, esc);
  assert.match(first, /Хотят прототип · mebel\.uz/);
  assert.match(first, /первые 30 минут прототип только у вас/);
  assert.match(first, /до 02\.10, 18:30/);
});

test("рассылка всем: сайт, слова клиента, правило «кто первый» — и без чужой разметки", () => {
  const text = protoAnnounceText({ host: "mebel.uz", words: "Да, <b>соберите</b> прототип" }, esc);
  assert.match(text, /Нужен прототип — бери срочно · mebel\.uz/);
  assert.match(text, /не взял за 30 минут/);
  assert.match(text, /&lt;b&gt;соберите&lt;\/b&gt;/, "слова клиента не экранированы");
  assert.match(text, /Кто первым нажмёт «🛠 Беру прототип», того и лид/);
  assert.match(text, /за 12 часов/);
  assert.equal(clientWords("а".repeat(400)).length, 300);
});

test("кто взял — видно у всех копий; взявшему — срок; автору — куда ушёл лид", () => {
  assert.equal(protoTakenLabel({ username: "alex", display_name: "Александр" }), "🛠 Прототип взят — @alex");
  assert.equal(protoTakenLabel({ username: null, display_name: "Салиха" }), "🛠 Прототип взят — Салиха");

  const taker = protoTakerText({ host: "mebel.uz", deadline: new Date("2026-10-03T01:15:00Z") }, esc);
  assert.match(taker, /Лид и переписка теперь за вами/);
  assert.match(taker, /до <b>03\.10, 06:15<\/b>/);

  assert.match(protoMovedText({ host: "mebel.uz", who: "@alex" }, esc), /теперь у @alex\. Касание у вас засчитано/);
  assert.match(HANDOVER_TEXT.proto, /первые 30 минут у автора касания, потом всей команде/);
});

test("взять может только один: условие — в самом update", () => {
  const store = read("lib/admin/prototype-claim-store.ts");
  // Просьба — один раз на касание.
  assert.match(store, /\.update\(\{ proto_requested_at: requestedAt\.toISOString\(\), proto_words: words\.slice\(0, 2000\) \}\)\s*\.eq\("id", prospectId\)\s*\.is\("proto_requested_at", null\)/);
  // Рассылка всем — один раз и только пока не взяли.
  assert.match(store, /\.update\(\{ proto_broadcast_at: new Date\(\)\.toISOString\(\) \}\)\s*\.eq\("id", prospectId\)\s*\.is\("proto_broadcast_at", null\)\s*\.is\("proto_taken_by", null\)/);
  // Автору не дошло — ждать некого, сразу всем.
  assert.match(store, /if \(!id\) \{[\s\S]{0,80}return \{ sent: await broadcastPrototype\(prospectId\) \};/);
  // Взятие — первым нажавшим; до рассылки — только автор касания (и владелец).
  assert.match(store, /\.update\(\{ proto_taken_by: staff\.id, proto_taken_at: now\.toISOString\(\) \}\)\s*\.eq\("id", prospectId\)\s*\.is\("proto_taken_by", null\)\s*\.not\("proto_requested_at", "is", null\)/);
  assert.match(store, /claim\.or\(`proto_broadcast_at\.not\.is\.null,claimed_by\.eq\.\$\{staff\.id\}`\)/);
  // Ночью «бери срочно» не шлём — с 07:00 до 23:00.
  assert.match(store, /if \(!messageWindow\(now\)\) return 0;/);
  // Лид и переписка — взявшему, даже если касание писал другой.
  assert.match(store, /assigned_staff_id: staff\.id/);
  assert.match(store, /await talkFollowsLead\(leadId, staff\.id\)/);
  // Кому: всем с «Заявками для всех», кроме автора — у него кнопка уже есть.
  assert.match(store, /s\.id !== prospect\.claimed_by && wants\(s\.notify_off as string\[\] \| null, "open"\)/);
  assert.match(store, /record\("lead\.prototype_taken"/);

  assert.match(read("supabase/migrations/0077_prototype_first_dibs.sql"), /add column if not exists proto_broadcast_at timestamptz/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /await broadcastDuePrototypes\(new Date\(\)\)/);

  const migration = read("supabase/migrations/0076_prototype_claim.sql");
  assert.match(migration, /add column if not exists proto_taken_by uuid references public\.staff\(id\) on delete set null/);
  assert.match(migration, /add column if not exists proto_notices jsonb not null default '\[\]'::jsonb/);
});

test("бот: кнопка только в личке, у остальных гаснет, ответ клиента запускает рассылку", () => {
  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /if \(parts\[0\] === PROTO_CALLBACK\) \{\s*\n\s+if \(chatId === undefined \|\| chatId !== query\.from\?\.id\) \{/);
  assert.match(hook, /const taken = await takePrototype\(prospectId, staff\);/);
  assert.match(hook, /taken\.notices\.map\(\(n\) => setButtons\(n\.chatId, n\.messageId, \[\[\{ text: label, callback_data: "noop" \}\]\]\)\)/);
  assert.match(hook, /Прототип уже взяли/);
  assert.match(hook, /Первые \$\{PROTO_FIRST_MINUTES\} минут прототип у автора касания/);

  const talk = read("lib/admin/outreach-talk-store.ts");
  assert.match(talk, /verdict === "proto" \? await announcePrototype\(/);
});
