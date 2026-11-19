/**
 * Вложения к рассылке в бот: фото, GIF, видео, файл.
 *
 * Владелец, 19.11.2026: «Нужно добавить возможность добавлять фото / гиф /
 * видео / файлы к рассылкам через бота».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  CAPTION_MAX,
  MEDIA_MAX_BYTES,
  fitsCaption,
  mediaKindOf,
  mediaName,
  mediaOf,
  mediaProblem,
  plainLength,
  textProblem,
} from "@/lib/admin/broadcast";
import { fileIdOf } from "@/lib/qualify/telegram";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const MB = 1024 * 1024;

test("вид вложения: GIF анимацией, фото до 10 МБ, mp4 видео, остальное файлом", () => {
  assert.equal(mediaKindOf({ type: "image/gif", name: "a.gif", size: MB }), "animation");
  assert.equal(mediaKindOf({ type: "image/png", name: "banner.png", size: 2 * MB }), "photo");
  assert.equal(mediaKindOf({ type: "image/jpeg", name: "big.jpg", size: 12 * MB }), "document", "фото больше 10 МБ Telegram не примет");
  assert.equal(mediaKindOf({ type: "video/mp4", name: "promo.mp4", size: 15 * MB }), "video");
  assert.equal(mediaKindOf({ type: "video/quicktime", name: "clip.mov", size: MB }), "document");
  assert.equal(mediaKindOf({ type: "application/pdf", name: "kp.pdf", size: MB }), "document");
  assert.equal(mediaKindOf({ type: "", name: "anim.GIF", size: MB }), "animation");
});

test("размер и текст: до 20 МБ, с вложением текст необязателен", () => {
  assert.equal(mediaProblem({ size: 0 }), "media_empty");
  assert.equal(mediaProblem({ size: MEDIA_MAX_BYTES + 1 }), "media_big");
  assert.equal(mediaProblem({ size: MEDIA_MAX_BYTES }), null);
  assert.equal(textProblem("  "), "empty");
  assert.equal(textProblem("  ", true), null);
  assert.equal(mediaName("C:\\fakepath\\баннер.png"), "баннер.png");
});

test("подпись: до 1024 знаков без разметки, длиннее — текст отдельным сообщением", () => {
  assert.equal(plainLength("📣 <b>Егор</b>\n\na &amp; b"), "📣 Егор\n\na x b".length);
  assert.equal(fitsCaption("x".repeat(CAPTION_MAX)), true);
  assert.equal(fitsCaption("x".repeat(CAPTION_MAX + 1)), false);
  assert.equal(fitsCaption(`<b>${"x".repeat(CAPTION_MAX)}</b>`), true, "теги не считаются");
});

test("file_id из ответа Telegram: у фото — самый крупный размер, GIF документом — тоже годится", () => {
  assert.equal(fileIdOf({ photo: [{ file_id: "small" }, { file_id: "big" }] }, "photo"), "big");
  assert.equal(fileIdOf({ animation: { file_id: "anim" }, document: { file_id: "doc" } }, "animation"), "anim");
  assert.equal(fileIdOf({ document: { file_id: "doc" } }, "animation"), "doc");
  assert.equal(fileIdOf({ video: { file_id: "vid" } }, "video"), "vid");
  assert.equal(fileIdOf(undefined, "photo"), null);
  assert.deepEqual(mediaOf({ media_kind: "photo", media_file_id: "x", media_name: "a.png" }), { kind: "photo", fileId: "x", name: "a.png" });
  assert.equal(mediaOf({ media_kind: "evil", media_file_id: "x", media_name: null }), null);
  assert.equal(mediaOf({ media_kind: null, media_file_id: null, media_name: null }), null);
});

test("рассылка шлёт вложение по file_id обеим аудиториям, файл в базе не лежит", () => {
  const tg = read("lib/qualify/telegram.ts");
  assert.match(tg, /\[MEDIA_FIELD\[media\.kind\]\]: media\.fileId/);
  assert.match(read("lib/admin/broadcast-store.ts"), /sendBroadcastMessage\(chat, text, media\)/);
  assert.match(read("lib/admin/bot-users-store.ts"), /sendBroadcastMessage\(chat, text, media\)/);
  // Загрузка — после всех проверок, перед записью: файл не уходит автору зря.
  for (const file of ["lib/admin/broadcast-store.ts", "lib/admin/bot-users-store.ts"]) {
    const src = read(file);
    assert.ok(src.indexOf('reason: "changed"') < src.indexOf("prepareMedia(input.file"), `${file}: вложение грузится после проверок`);
  }
  const migration = read("supabase/migrations/0190_broadcast_media.sql");
  assert.match(migration, /media_file_id text/);
  assert.doesNotMatch(migration, /bytea/, "сам файл в базу не кладём");
  // Поле файла в форме всегда, и в предпросмотре тоже.
  assert.match(read("components/admin/hq-broadcast.tsx"), /name="media"/);
});
