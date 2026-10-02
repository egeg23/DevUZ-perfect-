import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { NOTICES, NOTICE_KINDS, kindsFor, offFromForm, offSummary, wants } from "@/lib/admin/notify-prefs";

/**
 * Галочки: какие сообщения бота кому приходят.
 *
 * Владелец, 28.09: «По умолчанию приходит всё. Но мы можем через галочки
 * выбрать, что идёт, а что нет». Две вещи легко потерять при следующей
 * правке: «по умолчанию всё» (хранится выключенное, а не включённое) и то,
 * что галочка действительно проверяется там, где бот пишет, — иначе она
 * снимается на странице и ничего не меняет.
 */

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("по умолчанию приходит всё", () => {
  for (const kind of NOTICE_KINDS) {
    assert.equal(wants(null, kind), true);
    assert.equal(wants([], kind), true);
  }
  assert.equal(offSummary([], "manager"), "приходит всё");
  assert.equal(wants(["queue"], "queue"), false);
  assert.equal(wants(["queue"], "open"), true);
});

test("галочки формы превращаются в список выключенного — только своей роли", () => {
  // Форма присылает отмеченное. Выключено то, что положено роли и не пришло.
  const all = kindsFor("manager");
  assert.deepEqual(offFromForm(all, "manager"), []);
  assert.deepEqual(offFromForm(all.filter((k) => k !== "queue"), "manager"), ["queue"]);
  // Галочку чужой роли прислать можно, записать — нет: у менеджера нет
  // «Копий предложений очереди», и выключенной она у него не окажется.
  assert.ok(!offFromForm([], "manager").includes("watch"));
  assert.equal(offSummary(offFromForm([], "manager"), "manager"), "всё выключено");
});

test("у каждой роли свой набор, и он не пустой", () => {
  assert.ok(kindsFor("manager").includes("queue"));
  assert.ok(!kindsFor("manager").includes("reports"), "менеджеру отчёты и так не приходят");
  assert.ok(!kindsFor("admin").includes("queue"), "владелец в очереди не стоит");
  assert.ok(kindsFor("admin").includes("watch"));
  assert.ok(kindsFor("head").includes("reports"));
  for (const kind of NOTICE_KINDS) {
    // На каждом языке панели: галочки ставят и по-узбекски, и по-польски.
    for (const locale of ["ru", "uz", "pl"] as const) {
      assert.ok(
        NOTICES[kind].title[locale].length > 5 && NOTICES[kind].off[locale].length > 20,
        `${kind}: нет пояснения (${locale})`,
      );
    }
  }
});

test("каждая галочка проверяется там, где бот пишет", () => {
  const where: Record<string, [string, RegExp][]> = {
    queue: [["lib/admin/lead-queue-store.ts", /\.filter\(\(p\) => p\.chat && p\.queue\)/]],
    watch: [["lib/admin/lead-queue-store.ts", /wants\(row\.notify_off, "watch"\)/]],
    open: [["lib/qualify/brief.ts", /wants\(row\.notify_off, "open"\)/]],
    reminders: [["app/api/reminders/sweep/route.ts", /"reminders"\)\)/]],
    messages: [["lib/admin/messages.ts", /"messages"\)\) return;/]],
    transfers: [["lib/admin/transfers.ts", /allowsChat\("transfers", telegramId\)/]],
    talks: [["lib/admin/outreach-talk-store.ts", /"talks"\)\) return false;/]],
    portion: [["lib/admin/portion-store.ts", /wants\(person\.off, "portion"\)/]],
    coach: [["lib/admin/coach-store.ts", /"coach",/]],
    reports: [
      // Руководители и владелец — одним списком читателей, одной проверкой.
      ["lib/admin/portion-store.ts", /wants\(reader\.off, "reports"\)/],
      ["lib/admin/coach-store.ts", /notify\(reader\.id, "reports"/],
    ],
    // Задачи: исполнителю (новая задача и напоминания) и поставившему.
    tasks: [
      ["lib/admin/task-store.ts", /wants\(assignee\?\.notify_off, "tasks"\)/],
      ["lib/admin/task-store.ts", /wants\(reader\?\.notify_off, "tasks"\)/],
      ["lib/admin/task-store.ts", /wants\(creator\?\.notify_off, "tasks"\)/],
    ],
  };
  for (const kind of NOTICE_KINDS) {
    assert.ok(where[kind], `галочка ${kind} нигде не проверяется`);
    for (const [file, re] of where[kind]) assert.match(read(file), re, `${kind}: проверка в ${file} пропала`);
  }
});

test("снятая «Новые заявки по очереди» выводит из очереди, а не глушит предложение", () => {
  // Иначе лид полчаса висел бы у того, кому о нём не написали.
  const store = read("lib/admin/lead-queue-store.ts");
  assert.match(store, /queue: wants\(row\.notify_off as string\[\] \| null, "queue"\)/);
  assert.match(store, /select\("id, display_name, username, telegram_user_id, role, notify_off"\)/);
});

test("страница «Команда»: галочки и отключение — по правам, миграция на месте", () => {
  const page = read("app/admin/team/page.tsx");
  assert.match(page, /tunesNotices\(viewer\.role, member\.role, member\.id === viewer\.id\) \?/);
  assert.match(page, /!disables\(viewer\.role, member\.role\)/);
  assert.match(page, /<form action=\{saveNotices\}/);
  assert.match(page, /helpAnchor\("\/admin\/team", "notices"\)/);

  const sql = read("supabase/migrations/0063_staff_notices.sql");
  assert.match(sql, /add column if not exists notify_off text\[\] not null default '\{\}'::text\[\]/);
});
