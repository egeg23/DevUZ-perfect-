import assert from "node:assert/strict";
import { test } from "node:test";

import { replyHeading } from "@/lib/admin/autopilot";
import { MAIN_ACCOUNT, sentFrom, sentFromText, type AccountTag } from "@/lib/admin/work-accounts";
import { leadCardDict } from "@/content/admin-panel/lead-card";
import { outreachListDict } from "@/content/admin-panel/prospect";
import { pick } from "@/lib/admin/i18n";

/**
 * Владелец, 11.10.2026: «Когда уходит сообщение — пусть менеджер видит, с
 * какого аккаунта оно ушло». Разговор живёт на аккаунте из sent_via, и
 * подпись берётся оттуда — в карточке лида, на карточке касания и в боте.
 */

const tags = new Map<string, AccountTag>([["a-2", { label: "Продажи 2", handle: "@devuz_sales" }]]);

test("касание с дополнительного аккаунта подписано его названием и ником", () => {
  const from = sentFrom({ sent_via: "a-2", target_kind: "handle" }, tags);
  assert.deepEqual(from, { label: "Продажи 2", handle: "@devuz_sales" });
  assert.equal(sentFromText(from!), "«Продажи 2» @devuz_sales");
  assert.equal(pick(leadCardDict, "ru").from(from!.label, from!.handle), "с аккаунта «Продажи 2» @devuz_sales");
  assert.equal(pick(outreachListDict, "uz").sentFrom(from!.label, from!.handle), "«Продажи 2» akkauntidan (@devuz_sales)");
});

test("пустой sent_via и main — главный аккаунт, «Написал сам» — без подписи", () => {
  for (const via of [null, "", MAIN_ACCOUNT]) {
    const from = sentFrom({ sent_via: via, target_kind: "phone" }, tags);
    assert.deepEqual(from, { label: null, handle: null });
    assert.equal(pick(leadCardDict, "ru").from(from!.label, from!.handle), "с главного аккаунта");
  }
  assert.equal(sentFrom({ sent_via: "a-2", target_kind: "manual" }, tags), null);
});

test("аккаунта в базе уже нет — подпись общая, без чужого id", () => {
  const from = sentFrom({ sent_via: "gone", target_kind: "handle" }, tags);
  assert.equal(sentFromText(from!), "рабочий аккаунт студии");
  assert.equal(pick(leadCardDict, "pl").from(from!.label, from!.handle), "z konta firmowego");
});

test("тёплый лид в боте говорит, с какого аккаунта писали", () => {
  const text = replyHeading({ host: "enotmebel.uz", label: null, words: "Делайте", niche: null, account: "«Продажи 2» @devuz_sales" }, (s) => s);
  assert.match(text, /Аккаунт: «Продажи 2» @devuz_sales/);
  assert.doesNotMatch(replyHeading({ host: "enotmebel.uz", label: null, words: "Делайте", niche: null }, (s) => s), /Аккаунт:/);
});
