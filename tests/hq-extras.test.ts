import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { repeatOf, type BroadcastRow } from "@/lib/admin/broadcast";
import { dailyCounts } from "@/lib/admin/hq";

/**
 * «Главная», владелец 14.10.2026 — «Делаем»: «Повторить» у прошлой рассылки,
 * касания человека за 7 дней в его карточке, «Отдать» тёплого лида без
 * хозяина прямо из «Требует внимания».
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// 14.10.2026 15:00 по Ташкенту.
const NOW = new Date("2026-10-14T10:00:00Z");

test("касания по дням: семь чисел, сегодня — последнее, дни — по Ташкенту", () => {
  const days = dailyCounts(
    [
      "2026-10-14T09:00:00Z", // сегодня
      "2026-10-13T20:00:00Z", // 01:00 14-го по Ташкенту — тоже сегодня
      "2026-10-13T18:00:00Z", // 23:00 13-го — вчера
      "2026-10-08T05:00:00Z", // шесть дней назад
      "2026-10-07T05:00:00Z", // семь — за окном
      "2026-10-14T12:00:00Z", // будущее
      null,
    ],
    NOW,
  );
  assert.deepEqual(days, [1, 0, 0, 0, 0, 1, 2]);
});

const row = (over: Partial<BroadcastRow>): BroadcastRow => ({
  id: "b1",
  created_at: "2026-10-13T09:00:00Z",
  kind: "staff",
  segment: null,
  chats: [],
  author_id: "a",
  text: "Созвон в 15:00",
  audience: "roles",
  roles: ["manager", "head"],
  recipients: ["m1", "m2"],
  send_at: "2026-10-13T09:00:00Z",
  night_ok: false,
  cancelled_at: null,
  done_at: "2026-10-13T09:01:00Z",
  ...over,
});

test("«Повторить»: тот же текст и те же получатели; пользователи бота — тот же сегмент", () => {
  assert.deepEqual(repeatOf(row({})), {
    id: "b1",
    target: "staff",
    text: "Созвон в 15:00",
    kind: "roles",
    roles: ["head", "manager"],
    picked: [],
    segment: "all",
  });
  assert.deepEqual(repeatOf(row({ audience: "pick" })).picked, ["m1", "m2"]);
  const users = repeatOf(row({ kind: "users", audience: "users", segment: "partners", roles: [] }));
  assert.equal(users.target, "users");
  assert.equal(users.segment, "partners");
  assert.equal(users.kind, "all");
  // Форма каждый раз новая — иначе подстановка не случилась бы.
  assert.match(read("components/admin/hq-side.tsx"), /key=\{broadcast\.repeat\?\.id \?\? "new"\}/);
  assert.match(read("components/admin/hq-side.tsx"), /href=\{`\/admin\/hq\?repeat=\$\{b\.id\}#broadcast`\}/);
});

test("«Отдать»: только владелец и руководитель, только ничей лид, человеку — бот и напоминание", () => {
  const own = read("lib/admin/ownership.ts");
  const give = own.slice(own.indexOf("export async function giveLead"), own.indexOf("/** Отпустить лида обратно"));
  assert.match(give, /if \(!seesEveryone\(actor\.role\)\) return \{ ok: false, reason: "forbidden" \};/);
  assert.match(give, /\.is\("assigned_staff_id", null\)/, "успел взять другой — не перезаписываем");
  assert.match(give, /await record\("lead\.given"/);
  assert.match(give, /await closeOfferAfterTake\(leadId, target\.id\);/);
  assert.match(give, /await createReminder\(leadId, target,/);
  assert.match(give, /await sendMessage\(\s*target\.telegram_user_id,/);
  assert.match(read("app/admin/hq/page.tsx"), /giveAction=\{seesEveryone\(staff\.role\) \? giveLeadAction : undefined\}/);
  assert.match(read("lib/admin/journal.ts"), /"lead\.given":/);
});
