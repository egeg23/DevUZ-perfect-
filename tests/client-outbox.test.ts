/**
 * Файлы клиенту от бота студии — из базы, не из открытого репозитория.
 *
 * Владелец, 23.10.2026: «Бот может прикреплять изображения… Или найди способ
 * отправить документ от имени нашей студии на фирменном бланке».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { OUTBOX_GAP_MS, OUTBOX_PREFIX, OUTBOX_TEXT_MAX, isOutboxPayload, outboxFile } from "@/lib/admin/client-outbox";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("строка исходящей почты: чат и хотя бы один файл картинкой или PDF", () => {
  assert.equal(OUTBOX_PREFIX, "client-outbox:");
  assert.ok(isOutboxPayload({ chat: 1, items: [{ kind: "photo", name: "p1.png", b64: "AA==" }] }));
  assert.ok(isOutboxPayload({ chat: 1, items: [{ kind: "document", name: "s.pdf", b64: "AA==", caption: "Smeta" }] }));
  assert.equal(isOutboxPayload({ chat: 1, items: [] }), false);
  assert.equal(isOutboxPayload({ chat: 1, items: [{ kind: "video", name: "x", b64: "" }] }), false);
  assert.equal(isOutboxPayload({ items: [{ kind: "photo", name: "x", b64: "" }] }), false);
  // Файл с диска — только из kp/send/.
  assert.ok(isOutboxPayload({ chat: 1, items: [{ kind: "document", name: "s.pdf", file: "kp/send/flora/s.pdf" }] }));
  assert.equal(isOutboxPayload({ chat: 1, items: [{ kind: "document", name: "s", file: "kp/send/../../.env" }] }), false);
  assert.equal(isOutboxPayload({ chat: 1, items: [{ kind: "document", name: "s", file: ".env" }] }), false);
  assert.equal(outboxFile("kp/send/a/b.png"), "kp/send/a/b.png");
  assert.equal(outboxFile("/etc/passwd"), null);
});

test("один проход берёт строку, после отправки файлов в базе не остаётся", () => {
  const src = read("lib/admin/client-outbox.ts");
  assert.match(src, /\.select\("key"\)\s*\.like\("key", `\$\{OUTBOX_PREFIX\}%`\)/, "список — только ключи");
  assert.match(src, /update\(\{ key: sending \}\)\.eq\("key", key\)/, "взять — условно, переименованием ключа");
  assert.match(src, /payload: \{ chat: payload\.chat, note: payload\.note \?\? null, done, at:/, "после — без файлов");
  assert.match(read("app/api/reminders/sweep/route.ts"), /await sendClientOutbox\(\)/);
  assert.match(read("next.config.ts"), /"\/api\/reminders\/sweep": \["\.\/kp\/send\/\*\*\/\*"\]/, "файлы kp/send едут в образ свипа");
});

test("текстом — по сообщению на строку, по порядку и с паузой", () => {
  // Владелец, 06.11.2026: «пусть поочерёдно пришлёт мне ссылки» — группы для скаута.
  assert.ok(isOutboxPayload({ chat: 1, items: [{ kind: "text", name: "01", text: "1/54 · https://t.me/js_jobs" }] }));
  assert.equal(isOutboxPayload({ chat: 1, items: [{ kind: "text", name: "01", text: "  " }] }), false);
  assert.equal(isOutboxPayload({ chat: 1, items: [{ kind: "text", name: "01", text: "x".repeat(OUTBOX_TEXT_MAX + 1) }] }), false);
  assert.equal(isOutboxPayload({ chat: 1, items: [{ kind: "text", text: "без имени" }] }), false);
  assert.ok(OUTBOX_GAP_MS >= 1000, "не больше одного сообщения в секунду в один чат");
  const src = read("lib/admin/client-outbox.ts");
  assert.match(src, /\.order\("key"\)/, "строки — по порядку имён");
  assert.match(src, /sendMessage\(payload\.chat, esc\(item\.text\), \{ mirror: false \}\)/, "текст экранируется, без пуша");
});
