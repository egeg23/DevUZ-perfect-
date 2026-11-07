/**
 * Группы для скаута — таблица scout_chats поверх SCOUT_CHATS на сервере.
 *
 * Владелец, 06.11.2026: «В разделе находки скаута сделай возможность
 * добавлять группы для отслеживания всем… В день самостоятельно не более 10
 * подписок на группы с интервалом 1-2 часа».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  JOIN_DAILY_CAP,
  JOIN_FROM_HOUR,
  JOIN_GAP_MAX_MS,
  JOIN_GAP_MIN_MS,
  JOIN_TO_HOUR,
  RESOLVE_PER_START,
  RETRY_AFTER_MS,
  chatHandle,
  chatUrl,
  dialogPatches,
  gapAfter,
  joinOutcome,
  lastingFailure,
  nextJoinAt,
  nextToJoin,
  parseChatInput,
  rosterPatches,
  tashkentDayStart,
  tomorrowOpens,
  watchPlan,
  type ScoutChat,
} from "@/lib/scout/extra-chats";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const row = (over: Partial<ScoutChat>): ScoutChat => ({
  id: over.id ?? "r1",
  handle: null,
  invite: null,
  chat_id: null,
  status: "pending",
  ...over,
});

/** Час по Ташкенту (UTC+5) такого-то дня. */
const tashkent = (day: string, hour: number, minute = 0) =>
  new Date(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)), hour - 5, minute));

test("адрес — без @ и t.me, как его ни вставили", () => {
  assert.equal(chatHandle("@JS_Jobs"), "JS_Jobs");
  assert.equal(chatHandle("https://t.me/js_jobs"), "js_jobs");
  assert.equal(chatHandle("t.me/s/js_jobs?before=10"), "js_jobs");
  assert.equal(chatHandle("telegram.me/freelance_uz/"), "freelance_uz");
});

test("в поле можно вставить адрес или приглашение, бота и мусор — нельзя", () => {
  assert.deepEqual(parseChatInput("https://t.me/freelance_uz"), { handle: "freelance_uz" });
  assert.deepEqual(parseChatInput("@it_jobs_kz"), { handle: "it_jobs_kz" });
  assert.deepEqual(parseChatInput("https://t.me/+AbCdEf123456"), { invite: "AbCdEf123456" });
  assert.deepEqual(parseChatInput("t.me/joinchat/AbCdEf123456"), { invite: "AbCdEf123456" });
  assert.equal(parseChatInput("@devuz_bot"), null, "у бота нет ленты");
  assert.equal(parseChatInput("abc"), null, "короче пяти знаков адреса не бывает");
  assert.equal(parseChatInput("+998901234567 позвоните"), null);
  assert.equal(parseChatInput("   "), null);
  assert.equal(chatUrl({ handle: "freelance_uz", invite: null }), "https://t.me/freelance_uz");
  assert.equal(chatUrl({ handle: null, invite: "AbCdEf123456" }), "https://t.me/+AbCdEf123456");
});

test("новые адреса — порцией за запуск, разобранные — номером, повторы SCOUT_CHATS не берём", () => {
  const chats = [
    row({ id: "a", handle: "javascript_jobs" }), // уже в SCOUT_CHATS
    row({ id: "b", handle: "known", chat_id: "-1009" }),
    row({ id: "c", handle: "dead", status: "error" }),
    row({ id: "d", invite: "AbCdEf123456" }), // закрытая без номера — сначала вступление
    ...Array.from({ length: RESOLVE_PER_START + 3 }, (_, i) => row({ id: `n${i}`, handle: `new${i}x` })),
  ];
  const plan = watchPlan(["javascript_jobs", "-1001"], chats);
  assert.equal(plan.names[0], "javascript_jobs");
  assert.ok(plan.names.includes("-1009"), "разобранный — номером, без сети");
  assert.ok(!plan.names.includes("dead"), "не открывшийся насовсем больше не пробуем");
  assert.equal(plan.names.filter((n) => n === "javascript_jobs").length, 1);
  assert.equal(plan.resolving.length, RESOLVE_PER_START, "резолвов за запуск не больше предела");
  assert.equal(plan.waiting.length, 3);
});

test("при старте: номер, «уже состою» и «не откроется» — обратно в строки; FLOOD_WAIT адрес не губит", () => {
  const now = new Date("2026-11-06T10:00:00Z");
  const chats = [
    row({ id: "a", handle: "Alpha_Chat" }),
    row({ id: "b", handle: "bravo_chat" }),
    row({ id: "c", handle: "charlie_chat" }),
    row({ id: "d", handle: "delta_chat", chat_id: "-1004", status: "request" }),
    row({ id: "e", handle: "echo_chat", chat_id: "-1005", status: "joined" }),
  ];
  const patches = new Map(
    rosterPatches(
      chats,
      {
        opened: [
          { name: "Alpha_Chat", id: "-1001" },
          { name: "-1004", id: "-1004" },
          { name: "-1005", id: "-1005" },
        ],
        failed: [
          { name: "bravo_chat", reason: 'No user has "bravo_chat" as username' },
          { name: "charlie_chat", reason: "A wait of 300 seconds is required (FLOOD_WAIT)" },
        ],
        outside: [
          { name: "Alpha_Chat", id: "-1001" },
          { name: "-1005", id: "-1005" },
        ],
        rosterUnknown: false,
      },
      now,
    ).map((p) => [p.id, p.patch]),
  );
  assert.deepEqual(patches.get("a"), { chat_id: "-1001" }, "номер узнали, но не состоим — ждёт вступления");
  assert.equal(patches.get("b")?.status, "error");
  assert.ok(!patches.has("c"), "лимит Telegram — попробуем в следующий запуск");
  assert.equal(patches.get("d")?.status, "joined", "заявку одобрили");
  assert.equal(patches.get("d")?.joined_via, "scout");
  assert.equal(patches.get("e")?.status, "pending", "вышли — снова в очередь");
  assert.equal(lastingFailure("CHANNEL_PRIVATE"), true);
  assert.equal(lastingFailure("FLOOD_WAIT_120"), false);
});

test("вступили руками — скаут отмечает «вступили сами», а не тратит своё вступление", () => {
  const patch = rosterPatches(
    [row({ id: "a", handle: "foxtrot_chat" })],
    { opened: [{ name: "foxtrot_chat", id: "-1007" }], failed: [], outside: [], rosterUnknown: false },
    new Date(),
  )[0]?.patch;
  assert.equal(patch?.status, "joined");
  assert.equal(patch?.joined_via, "manual");
  // Список диалогов не получили — про членство молчим, ничего не помечаем.
  const unknown = rosterPatches(
    [row({ id: "a", handle: "foxtrot_chat" })],
    { opened: [{ name: "foxtrot_chat", id: "-1007" }], failed: [], outside: [], rosterUnknown: true },
    new Date(),
  )[0]?.patch;
  assert.deepEqual(unknown, { chat_id: "-1007" });
});

test("не больше 10 попыток в день по Ташкенту, пауза час-два, только днём", () => {
  assert.equal(JOIN_DAILY_CAP, 10);
  assert.equal(JOIN_GAP_MIN_MS, 3600_000);
  assert.equal(JOIN_GAP_MAX_MS, 2 * 3600_000);
  const noon = tashkent("2026-11-06", 12);
  assert.equal(tashkentDayStart(noon), tashkent("2026-11-06", 0).getTime());
  assert.equal(nextJoinAt({ triedToday: 0, last: null, pausedUntil: null }, noon), noon.getTime(), "свободно — сразу");
  assert.equal(nextJoinAt({ triedToday: JOIN_DAILY_CAP, last: null, pausedUntil: null }, noon), null, "предел выбран");

  const last = { id: "r1", at: tashkent("2026-11-06", 11, 30).toISOString() };
  const at = nextJoinAt({ triedToday: 3, last, pausedUntil: null }, noon);
  assert.ok(at !== null && at === new Date(last.at).getTime() + gapAfter("r1"), "пауза — от прошлой попытки");
  for (const id of ["a", "row-2", "f3c1a9e0-0000-4000-8000-000000000000"]) {
    const gap = gapAfter(id);
    assert.ok(gap >= JOIN_GAP_MIN_MS && gap <= JOIN_GAP_MAX_MS, `${id}: ${gap}`);
    assert.equal(gapAfter(id), gap, "после перезапуска та же");
  }

  const night = tashkent("2026-11-06", 5);
  assert.equal(nextJoinAt({ triedToday: 0, last: null, pausedUntil: null }, night), tashkent("2026-11-06", JOIN_FROM_HOUR).getTime());
  assert.equal(nextJoinAt({ triedToday: 0, last: null, pausedUntil: null }, tashkent("2026-11-06", JOIN_TO_HOUR, 10)), null);
  assert.equal(tomorrowOpens(noon), tashkent("2026-11-07", JOIN_FROM_HOUR).getTime());

  const paused = tashkent("2026-11-06", 15).getTime();
  assert.equal(nextJoinAt({ triedToday: 0, last: null, pausedUntil: paused }, noon), paused, "Telegram попросил подождать");
});

test("очередь на вступление — по порядку добавления, неудача ждёт 6 часов", () => {
  const now = new Date("2026-11-06T10:00:00Z");
  const list = [
    row({ id: "late", handle: "late_chat", added_at: "2026-11-06T09:00:00Z" }),
    row({ id: "done", handle: "done_chat", status: "joined", added_at: "2026-11-01T00:00:00Z" }),
    row({ id: "tried", handle: "tried_chat", added_at: "2026-11-02T00:00:00Z", tried_at: new Date(now.getTime() - 3600_000).toISOString() }),
    row({ id: "first", handle: "first_chat", added_at: "2026-11-03T00:00:00Z" }),
  ];
  assert.equal(nextToJoin(list, now)?.id, "first");
  const later = new Date(now.getTime() + RETRY_AFTER_MS);
  assert.equal(nextToJoin(list, later)?.id, "tried", "через 6 часов — снова");
  assert.equal(nextToJoin([row({ status: "request", handle: "x_chat" })], now), null, "заявка ждёт админа");
});

test("ответ Telegram на вступление: что делать дальше", () => {
  assert.equal(joinOutcome(new Error("400: USER_ALREADY_PARTICIPANT")).kind, "joined");
  assert.equal(joinOutcome(new Error("400: INVITE_REQUEST_SENT (caused by messages.ImportChatInvite)")).kind, "request");
  const flood = joinOutcome(new Error("A wait of 300 seconds is required (caused by channels.JoinChannel)"));
  assert.equal(flood.kind, "pause");
  assert.equal(flood.kind === "pause" && flood.ms, 300_000);
  const frozen = joinOutcome(new Error("400: FROZEN_METHOD_INVALID"));
  assert.equal(frozen.kind === "pause" && frozen.ms, 24 * 3600_000, "заморозка — сутки не вступаем");
  assert.equal(joinOutcome(new Error("400: CHANNELS_TOO_MUCH")).kind, "pause");
  assert.equal(joinOutcome(new Error("400: INVITE_HASH_EXPIRED")).kind, "error");
  assert.equal(joinOutcome(new Error("400: USER_BANNED_IN_CHANNEL")).kind, "error");
  assert.equal(joinOutcome(new Error("Connection timeout")).kind, "retry");
});

test("скаут берёт группы из базы, вступает сам по расписанию и читает новую без перезапуска", () => {
  const runner = read("scout/runner.mjs");
  assert.match(runner, /const plan = watchPlan\(chats\(\), extra\)/);
  assert.match(runner, /rosterPatches\(extra, roster, new Date\(\)\)/);
  assert.match(runner, /nextJoinAt\(state, now\)/, "предел и паузу решает extra-chats");
  assert.match(runner, /tried_at: now\.toISOString\(\)/, "попытка пишется до запроса");
  assert.match(runner, /canJoin: \(\) => mainUntil <= Date\.now\(\)/, "ограниченный главный не вступает");
  // Панель говорит о паузе то же, что делает скаут.
  assert.match(read("app/admin/scout/page.tsx"), /Math\.max\(joinPause \?\? 0, mainLimit \?\? 0\)/);
  assert.match(runner, /watching\.add\(id\)/);
  assert.match(runner, /watching\.has\(String\(message\.chatId/);
  assert.doesNotMatch(runner, /NewMessage\(\{ chats:/, "фильтр библиотеки собирается один раз — новую группу не увидит");
  // Капчу при входе скаут не проходит — отдаёт человеку.
  assert.match(runner, /проверку бота — вступите руками/);
});

test("добавить группу — любой из команды, убрать — кто добавил, руководитель и владелец; всё в журнал", () => {
  const store = read("lib/scout/extra-chats-store.ts");
  assert.match(store, /record\("scout\.chat_added"/);
  assert.match(store, /record\("scout\.chat_removed"/);
  assert.match(store, /chat\.added_by === staff\.id \|\| staff\.role === "admin" \|\| staff\.role === "head"/);
  assert.match(store, /if \(!mayRemoveChat\(staff, row/);
  assert.match(store, /removed_at: new Date\(\)\.toISOString\(\)/, "убирается пометкой, история остаётся");
  const migration = read("supabase/migrations/0180_scout_chats.sql");
  assert.match(migration, /create table if not exists public\.scout_chats/);
  assert.match(migration, /unique index[^;]*lower\(handle\)[^;]*removed_at is null/i, "одна группа — одна строка");
  assert.match(migration, /enable row level security/i);
});

test("вступили руками — скаут узнаёт по своим диалогам, без перезапуска", () => {
  const now = new Date("2026-11-07T14:00:00Z");
  const chats = [
    row({ id: "a", handle: "Php_Jobs", status: "pending" }),
    row({ id: "b", handle: null, invite: "AbCdEfGhIj", chat_id: "-1007", status: "request" }),
    row({ id: "c", handle: "js_jobs", status: "pending" }),
    row({ id: "d", handle: "done_chat", status: "joined", chat_id: "-1009" }),
  ];
  const dialogs = [
    { id: "-1005", usernames: ["php_jobs"], title: "PHP Jobs" },
    { id: "-1007", usernames: [], title: "Закрытая" },
    { id: "-1009", usernames: ["done_chat"], title: "Уже" },
  ];
  const out = dialogPatches(chats, dialogs, now);
  assert.deepEqual(
    out.map((item) => [item.id, item.chatId, item.patch.joined_via]),
    [
      ["a", "-1005", "manual"],
      ["b", "-1007", "scout"],
    ],
  );
  assert.equal(out[0].patch.chat_id, "-1005");
  assert.equal(out[0].patch.title, "PHP Jobs");
  assert.equal(out[1].patch.chat_id, undefined);
  const runner = readFileSync("scout/runner.mjs", "utf8");
  assert.match(runner, /startDialogSync\(/);
  assert.match(runner, /DIALOG_SYNC_MS/);
});
