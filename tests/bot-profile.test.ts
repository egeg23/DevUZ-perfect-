/**
 * Профиль бота: имя, описания, аватар.
 *
 * Владелец, 02.10: «Давай упакуем нашего тг бота: логотип, название,
 * описание».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { BOT_AVATAR, BOT_NAME, BOT_PROFILE } from "@/content/bot-profile";
import { profileChanges } from "@/lib/qualify/profile";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url));

test("тексты влезают в лимиты Telegram и написаны без разметки", () => {
  assert.ok(BOT_NAME.length > 0 && BOT_NAME.length <= 64);
  for (const { lang, text } of BOT_PROFILE) {
    const where = lang ?? "по умолчанию";
    assert.ok(text.short.length <= 120, `${where}: короткое описание — ${text.short.length} знаков из 120`);
    assert.ok(text.description.length <= 512, `${where}: описание — ${text.description.length} знаков из 512`);
    assert.doesNotMatch(text.short + text.description, /<\/?[a-z]+>/i, `${where}: Telegram покажет теги как есть`);
  }
});

test("русский по умолчанию и те же языки, на которых говорит бот", () => {
  const langs = BOT_PROFILE.map((entry) => entry.lang);
  assert.equal(langs[0], null);
  assert.deepEqual([...langs.slice(1)].sort(), ["en", "pl", "uk", "uz", "zh"]);
  assert.match(BOT_PROFILE[0].text.description, /[а-я]/);
  const uz = BOT_PROFILE.find((entry) => entry.lang === "uz")?.text;
  assert.ok(uz);
  assert.doesNotMatch(uz.short + uz.description, /[а-яё]/i, "узбекский — латиница");
});

test("обещания — те же, что в приветствии: 20 секунд, 30%, /ref", () => {
  const welcome = read("content/bot.ts").toString();
  assert.match(welcome, /20 секунд/);
  assert.match(welcome, /30%/);
  for (const { lang, text } of BOT_PROFILE) {
    assert.match(text.short, /20/, `${lang}: 20 секунд`);
    assert.match(text.short, /30%/, `${lang}: 30%`);
    assert.match(text.description, /\/ref/, `${lang}: партнёрская программа`);
  }
});

test("ставится только то, что отличается; Telegram не ответил — не трогаем", () => {
  const ru = BOT_PROFILE[0].text;
  const changes = profileChanges((field, lang) => {
    if (field === "name") return "DevUZ Studio";
    if (lang === "en") return null;
    if (lang === null && field === "short_description") return ru.short;
    return "";
  });
  const keys = changes.map((change) => `${change.field}:${change.lang ?? ""}`);
  assert.ok(keys.includes("name:"), "старое имя «DevUZ Studio» меняется");
  assert.ok(keys.includes("description:"));
  assert.ok(!keys.includes("short_description:"), "короткое описание уже стоит");
  assert.ok(!keys.some((key) => key.endsWith(":en")), "английский не прочитался — не трогаем");
  assert.ok(keys.includes("description:uz") && keys.includes("short_description:zh"));
  assert.ok(!keys.some((key) => key.startsWith("name:") && key !== "name:"), "имя одно на все языки");

  const nothing = profileChanges((field, lang) => {
    if (field === "name") return BOT_NAME;
    const text = BOT_PROFILE.find((entry) => entry.lang === lang)?.text;
    return field === "description" ? (text?.description ?? "") : (text?.short ?? "");
  });
  assert.deepEqual(nothing, [], "всё уже стоит — ни одного вызова");
});

test("аватар — JPG из знака сайта, загружается один раз на версию", () => {
  const jpeg = read(BOT_AVATAR.file);
  assert.equal(jpeg[0], 0xff);
  assert.equal(jpeg[1], 0xd8, "Telegram берёт только JPG");
  assert.ok(jpeg.length < 5 * 1024 * 1024);
  assert.match(BOT_AVATAR.version, /^\d{4}-\d{2}-\d{2}/);

  const profile = read("lib/qualify/profile.ts").toString();
  assert.match(profile, /version === BOT_AVATAR\.version\) return "same"/, "та же версия — фото не грузится повторно");
  assert.match(profile, /if \(!db\) return "skipped"/, "нет базы — аватар не трогаем");

  const route = read("app/api/telegram/menu/route.ts").toString();
  assert.match(route, /syncBotProfile\(\)/, "профиль синхронизируется при выкатке вместе с меню");
});
