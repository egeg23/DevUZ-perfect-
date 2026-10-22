/**
 * Файлы клиенту от бота студии — из базы, не из открытого репозитория.
 *
 * Владелец, 23.10.2026: «Бот может прикреплять изображения… Или найди способ
 * отправить документ от имени нашей студии на фирменном бланке».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { OUTBOX_PREFIX, isOutboxPayload } from "@/lib/admin/client-outbox";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("строка исходящей почты: чат и хотя бы один файл картинкой или PDF", () => {
  assert.equal(OUTBOX_PREFIX, "client-outbox:");
  assert.ok(isOutboxPayload({ chat: 1, items: [{ kind: "photo", name: "p1.png", b64: "AA==" }] }));
  assert.ok(isOutboxPayload({ chat: 1, items: [{ kind: "document", name: "s.pdf", b64: "AA==", caption: "Smeta" }] }));
  assert.equal(isOutboxPayload({ chat: 1, items: [] }), false);
  assert.equal(isOutboxPayload({ chat: 1, items: [{ kind: "video", name: "x", b64: "" }] }), false);
  assert.equal(isOutboxPayload({ items: [{ kind: "photo", name: "x", b64: "" }] }), false);
});

test("один проход берёт строку, после отправки файлов в базе не остаётся", () => {
  const src = read("lib/admin/client-outbox.ts");
  assert.match(src, /\.select\("key"\)\.like\("key", `\$\{OUTBOX_PREFIX\}%`\)/, "список — только ключи");
  assert.match(src, /update\(\{ key: sending \}\)\.eq\("key", key\)/, "взять — условно, переименованием ключа");
  assert.match(src, /payload: \{ chat: payload\.chat, note: payload\.note \?\? null, done, at:/, "после — без файлов");
  assert.match(read("app/api/reminders/sweep/route.ts"), /await sendClientOutbox\(\)/);
});
