import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import {
  BLOGGER_INVITE,
  INVITE_MEMO,
  INVITE_SECTION,
  accessAfterYes,
  inviteRows,
  inviteText,
  parseInviteCallback,
  statusLine,
  tallyText,
} from "@/lib/admin/blogger-invite";
import { opens } from "@/lib/admin/roles";
import { messageWindow } from "@/lib/admin/tasks";

/**
 * Владелец, 12.10.2026: «Сделай всем большое уведомление с кнопкой принять
 * или отклонить, чтобы еще еще и общаться с блоггерами и подписывать их на
 * работу с нами».
 */

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("приглашение — менеджерам и руководителю, с двумя кнопками", () => {
  assert.deepEqual([...BLOGGER_INVITE.roles].sort(), ["head", "manager"]);
  const [row] = inviteRows();
  assert.deepEqual(row.map((b) => b.text), ["✅ Принять", "✖ Отклонить"]);
  for (const b of row) {
    assert.ok("callback_data" in b && Buffer.byteLength(b.callback_data) <= 64, "callback_data до 64 байт");
    const parsed = parseInviteCallback(b.callback_data.split(":"));
    assert.ok(parsed);
  }
});

test("в тексте — зачем, сколько, что делать и где, названия как в панели", () => {
  for (const role of ["manager", "head"] as const) {
    const text = inviteText(role);
    for (const part of ["5%", "полгода", "114 $", "«ИИ-сотрудники»", "«Блогеры»", "«Скопировать и открыть Direct»", "«Отправил»"]) {
      assert.ok(text.includes(part), `${role}: нет «${part}»`);
    }
  }
  assert.match(inviteText("manager"), /напишите Александру/);
  assert.doesNotMatch(inviteText("head"), /напишите Александру/);
});

test("чужие и битые нажатия не разбираются", () => {
  assert.equal(parseInviteCallback(["binv", BLOGGER_INVITE.id, "maybe"]), null);
  assert.equal(parseInviteCallback(["binv", "другое-приглашение", "yes"]), null);
  assert.equal(parseInviteCallback(["rem", BLOGGER_INVITE.id, "yes"]), null);
  assert.deepEqual(parseInviteCallback(["binv", BLOGGER_INVITE.id, "no"]), { inviteId: BLOGGER_INVITE.id, answer: "no" });
});

test("принял менеджер — раздел открыт, другие галочки как были; руководителю галочка не нужна", () => {
  const before = { "/admin/partners": false };
  assert.equal(opens({ role: "manager", section_access: before }, INVITE_SECTION), false);
  const after = accessAfterYes("manager", before);
  assert.ok(after);
  assert.equal(opens({ role: "manager", section_access: after }, INVITE_SECTION), true);
  assert.equal(after["/admin/partners"], false);
  assert.equal(accessAfterYes("head", {}), null);
  assert.equal(opens({ role: "head" }, INVITE_SECTION), true);
  // Уже открыт — писать нечего.
  assert.equal(accessAfterYes("manager", { [INVITE_SECTION]: true }), null);
});

test("отказ раздел не открывает, а ответ — один раз", () => {
  const store = read("lib/admin/blogger-invite-store.ts");
  // Раздел открывается и памятка уходит только на «yes».
  assert.match(store, /if \(answer === "yes"\) \{\s*await openSection\(staff\);\s*await sendMemo\(chatId\);/);
  // Ответ пишется только туда, где его ещё нет; второе нажатие — «Ответ уже записан».
  assert.match(store, /\.is\("answer", null\)/);
  assert.match(store, /if \(row\.answer\) return "already";/);
  // Кнопка — только у адресата: строка ищется по нажавшему и сверяется с его чатом.
  assert.match(store, /\.eq\("staff_id", staff\.id\)/);
  assert.match(store, /Number\(row\.chat_id\) !== chatId\) return "not_invited"/);
  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /parts\[0\] === INVITE_CALLBACK[\s\S]{0,400}chatId !== query\.from\?\.id/);
  assert.match(hook, /ALREADY_ANSWERED/);
  assert.match(statusLine("no", "manager"), /отказались/);
  assert.match(statusLine("yes", "manager"), /«Блогеры»/);
});

test("не ночью, каждому один раз, итог владельцу", () => {
  const store = read("lib/admin/blogger-invite-store.ts");
  assert.match(store, /messageWindow\(now\)/);
  assert.match(store, /onConflict: "invite_id,staff_id", ignoreDuplicates: true/);
  assert.equal(messageWindow(new Date("2026-10-12T21:00:00Z")), false, "02:00 по Ташкенту — ночь");
  assert.equal(messageWindow(new Date("2026-10-13T02:30:00Z")), true, "07:30 по Ташкенту — можно");
  const text = tallyText({ yes: ["Аня"], no: [], silent: ["Борис", "Вера"] });
  assert.match(text, /Приняли \(1\): Аня/);
  assert.match(text, /Отказались \(0\): —/);
  assert.match(text, /Молчат \(2\): Борис, Вера/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /sendBloggerInvites\(new Date\(\)\)[\s\S]{0,120}sendInviteSummary/);
});

test("памятка доезжает: файл есть и попадает в образ", () => {
  assert.ok(existsSync(new URL(`../${INVITE_MEMO.file}`, import.meta.url)), "нет PDF памятки");
  assert.match(read("next.config.ts"), /outputFileTracingIncludes:[\s\S]{0,80}"\/api\/telegram\/webhook": \["\.\/kp\/managers-bloggers\.pdf"\]/);
});

test("миграция таблицы ответов закрыта RLS", () => {
  const sql = read("supabase/migrations/0155_team_invites.sql");
  assert.match(sql, /create table if not exists public\.team_invites/);
  assert.match(sql, /answer text check \(answer in \('yes', 'no'\)\)/);
  assert.match(sql, /enable row level security/);
});
