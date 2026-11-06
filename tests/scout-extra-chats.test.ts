/**
 * Чаты скаута из базы — поверх SCOUT_CHATS на сервере.
 *
 * Владелец, 06.11.2026: «Давай прокачаем скаута. Найди от 50 групп, где в
 * теории могут искать исполнителей по айтишке… подпишемся на эти паблики».
 * Новые группы лежат в stats_snapshots «scout-chats»; вступает человек сам.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  EXTRA_CHATS_KEY,
  RESOLVE_PER_START,
  chatHandle,
  lastingFailure,
  parseExtraChats,
  watchPlan,
  withResolved,
} from "@/lib/scout/extra-chats";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("адрес — без @ и t.me, как его ни вставили", () => {
  assert.equal(chatHandle("@JS_Jobs"), "JS_Jobs");
  assert.equal(chatHandle("https://t.me/js_jobs"), "js_jobs");
  assert.equal(chatHandle("t.me/s/js_jobs?before=10"), "js_jobs");
  assert.equal(chatHandle("telegram.me/freelance_uz/"), "freelance_uz");
});

test("список из базы: без повторов и мусора", () => {
  assert.equal(EXTRA_CHATS_KEY, "scout-chats");
  const list = parseExtraChats({
    chats: [{ name: "@freelance_uz" }, { name: "https://t.me/Freelance_UZ" }, { name: "" }, { id: "-1001" }, { name: "it_kz", id: "-1002", note: "KZ" }],
  });
  assert.deepEqual(list.map((c) => c.name), ["freelance_uz", "it_kz"]);
  assert.equal(list[1].id, "-1002");
  assert.deepEqual(parseExtraChats(null), []);
  assert.deepEqual(parseExtraChats({ chats: "x" }), []);
});

test("новые адреса — порцией за запуск, разобранные — номером, повторы SCOUT_CHATS не берём", () => {
  const extra = [
    { name: "javascript_jobs" }, // уже в SCOUT_CHATS
    { name: "known", id: "-1009" },
    { name: "dead", error: "USERNAME_NOT_OCCUPIED" },
    ...Array.from({ length: RESOLVE_PER_START + 3 }, (_, i) => ({ name: `new${i}` })),
  ];
  const plan = watchPlan(["javascript_jobs", "-1001"], extra);
  assert.equal(plan.names[0], "javascript_jobs");
  assert.ok(plan.names.includes("-1009"), "разобранный — номером, без сети");
  assert.ok(!plan.names.includes("dead"), "не открывшийся насовсем больше не пробуем");
  assert.equal(plan.names.filter((n) => n === "javascript_jobs").length, 1);
  assert.equal(plan.resolving.length, RESOLVE_PER_START, "резолвов за запуск не больше предела");
  assert.equal(plan.waiting.length, 3);
});

test("узнанный номер пишется в список, FLOOD_WAIT не ставит крест на адресе", () => {
  const extra = [{ name: "a" }, { name: "b" }, { name: "c" }, { name: "d", id: "-1004" }];
  const next = withResolved(
    extra,
    [{ name: "a", id: "-1001" }, { name: "d", id: "-1004" }],
    [
      { name: "b", reason: "No user has \"b\" as username" },
      { name: "c", reason: "A wait of 300 seconds is required (FLOOD_WAIT)" },
    ],
  );
  assert.ok(next);
  assert.equal(next[0].id, "-1001");
  assert.match(next[1].error ?? "", /No user has/);
  assert.equal(next[2].error ?? null, null, "лимит Telegram — попробуем в следующий запуск");
  assert.equal(withResolved([{ name: "d", id: "-1004" }], [{ name: "d", id: "-1004" }]), null, "менять нечего");
  assert.equal(lastingFailure("CHANNEL_PRIVATE"), true);
  assert.equal(lastingFailure("FLOOD_WAIT_120"), false);
});

test("скаут берёт список из базы, но вступать сам по-прежнему не умеет", () => {
  const runner = read("scout/runner.mjs");
  assert.match(runner, /const plan = watchPlan\(chats\(\), extra\)/);
  assert.match(runner, /withResolved\(extra, roster\.opened, roster\.failed\)/);
  assert.doesNotMatch(runner, /JoinChannel|ImportChatInvite|joinChannel/, "в чаты вступает человек, руками");
});
