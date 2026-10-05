/**
 * Касание руками с рабочего аккаунта: бот продолжает переписку там же.
 *
 * Владелец, 05.10.2026: «Проверь, чтобы с теми, с кем связались менеджеры
 * с новых рабочих аккаунтов, где он закреплён, бот продолжил общение с
 * клиентом там». Было: «Связался сам» уводил разговор на ручной маршрут —
 * ответ клиента на рабочий аккаунт не находил своего касания (id клиента
 * нам неизвестен), а ответы модели ждали, пока менеджер отправит их руками.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { bindingPatch, findHandTouch, needsBinding, phoneKey } from "@/lib/admin/outreach-talk";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const row = (over: Partial<Parameters<typeof findHandTouch>[0][number]> & { id: string }) => ({
  status: "sent",
  target: null,
  target_kind: "manual",
  contacts: { telegram: [], phones: [], whatsapp: [] },
  ...over,
});

test("номер сравнивается по последним девяти цифрам — как бы он ни был записан", () => {
  assert.equal(phoneKey("+998 (90) 123-45-67"), "901234567");
  assert.equal(phoneKey("998901234567"), "901234567", "так номер отдаёт Telegram");
  assert.equal(phoneKey("90 123 45 67"), "901234567");
  assert.equal(phoneKey("12-34"), "", "короткое — не номер");
  assert.equal(phoneKey(null), "");
});

test("клиента узнаём по @адресу или номеру из карточки: из адресата или из контактов сайта", () => {
  const rows = [
    row({ id: "a", target: "+998 71 200-00-00", contacts: { telegram: [], phones: ["+998712000000"], whatsapp: [] } }),
    row({ id: "b", target: "+998 90 123-45-67", contacts: { telegram: ["https://t.me/Akbar_Shop"], phones: [], whatsapp: [] } }),
    row({ id: "c", target: "@delta_uz", contacts: null }),
  ];
  assert.equal(findHandTouch(rows, { handle: "akbar_shop", phone: "" })?.id, "b", "адрес из контактов сайта, ссылкой");
  assert.equal(findHandTouch(rows, { handle: "", phone: "998901234567" })?.id, "b", "номер, по которому писали");
  assert.equal(findHandTouch(rows, { handle: "Delta_UZ", phone: "" })?.id, "c", "адрес в адресате, регистр не важен");
  assert.equal(findHandTouch(rows, { handle: "someone", phone: "998935550000" }), null, "посторонний — не наш разговор");
  assert.equal(findHandTouch(rows, { handle: "", phone: "" }), null);
  // Строки приходят по свежести касания: первая совпавшая — и есть разговор.
  const twice = [row({ id: "new", target: "@same" }), row({ id: "old", target: "@same" })];
  assert.equal(findHandTouch(twice, { handle: "same", phone: "" })?.id, "new");
});

test("на аккаунт переводится только разговор, который ещё не живёт на аккаунте", () => {
  assert.ok(needsBinding({ status: "sent", target_kind: "manual" }), "«Связался сам»");
  assert.ok(needsBinding({ status: "manual", target_kind: "manual" }), "написал руками, отметить не успел");
  assert.ok(needsBinding({ status: "sending", target_kind: "handle" }), "менеджер написал раньше бота");
  assert.ok(!needsBinding({ status: "sent", target_kind: "handle" }), "письмо бота — уже на своём аккаунте");
  assert.ok(!needsBinding({ status: "sent", target_kind: "phone" }));
});

test("переведённый разговор — обычное касание с аккаунта: ответы уходят с него и тому, кто написал", () => {
  const now = "2026-10-05T06:00:00.000Z";
  const who = { account: "f5a31e77-b8e2-47e4-bf00-518106f6002f", userId: "777", handle: "Akbar_Shop", phone: "998901234567" };

  // «Связался сам» уже засчитан: время и автора касания не трогаем.
  const marked = bindingPatch({ status: "sent" }, "m1", who, now);
  assert.deepEqual(marked, {
    sent_via: who.account,
    target_kind: "handle",
    target: "@akbar_shop",
    target_user_id: "777",
  });

  // Не отмеченное — засчитываем тому, за кем карточка, и отдаём модели.
  const unmarked = bindingPatch({ status: "manual" }, "m2", { ...who, handle: "" }, now);
  assert.equal(unmarked.status, "sent");
  assert.equal(unmarked.sent_at, now);
  assert.equal(unmarked.touched_by, "m2");
  assert.equal(unmarked.ai_handling, true);
  assert.equal(unmarked.target_kind, "phone");
  assert.equal(unmarked.target, "+998901234567");
  assert.equal(unmarked.dispatch_by, null, "письмо из очереди бота больше не уйдёт");
});

test("ответ клиента на рабочий аккаунт переводит разговор туда, а бот отвечает оттуда", () => {
  const store = read("lib/admin/outreach-talk-store.ts");
  // Не нашли среди отправленных ботом — ищем среди сделанных руками.
  assert.match(store, /\.eq\("status", "sent"\)\s*\.eq\("target_kind", "manual"\)/);
  assert.match(store, /\.in\("status", \["manual", "sending"\]\)/);
  assert.match(store, /prospect = findHandTouch\(/);
  assert.match(store, /if \(input\.account && needsBinding\(prospect\)\) \{\s*bound = await bindToAccount\(/);
  // Перевод — только из того состояния, в котором прочитали.
  assert.match(store, /\.update\(bindingPatch\(prospect, prospect\.touched_by \?\? prospect\.claimed_by, who, now\)\)\s*\.eq\("id", prospect\.id\)\s*\.eq\("status", prospect\.status\)/);
  // Ответы, ждавшие ручной отправки, бот не досылает пачкой.
  assert.match(store, /\.update\(\{ status: "done", failure: HAND_REPLY_LEFT \}\)[\s\S]{0,160}\.eq\("status", "queued"\)/);
  // Менеджеру — только если бот правда продолжает.
  assert.match(store, /if \(bound && saved\.verdict === "talk" && prospect\.ai_handling\) \{/);

  const runner = read("scout/runner.mjs");
  assert.match(runner, /phone = sender\?\.phone \? String\(sender\.phone\) : "";/);
  assert.match(runner, /recordInbound\(\{ handle, userId, phone, account: key, body: String\(message\.message\) \}\)/);
  // Отвечает тот же аккаунт: очередь ответов берёт разговор по sent_via.
  assert.match(store, /const owner = accountOf\(p\.sent_via as string \| null\);/);
  assert.match(store, /if \(p\.target_kind === "manual"\) continue;/);
});
