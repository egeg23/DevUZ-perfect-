import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { appSecret, readAppSecret } from "@/lib/secrets";

/**
 * 07.10.2026, во время сбоя сервера, хранилище секретов не ответило скауту,
 * и «Рабочий аккаунт для мужчин» навсегда пометился «сессии нет в
 * хранилище» при живой сессии — четыре дня он молчал. «Секрета нет» и
 * «хранилище не ответило» — разные ответы.
 */

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("переменная окружения — ответ, хранилище недоступно — не «секрета нет»", async () => {
  process.env.SECRET_OFFLINE_TEST = "from-env";
  assert.deepEqual(await readAppSecret("SECRET_OFFLINE_TEST"), { value: "from-env", offline: false });
  delete process.env.SECRET_OFFLINE_TEST;
  // Без базы (как в тестах) хранилище «не отвечает» — и это видно.
  assert.deepEqual(await readAppSecret("SECRET_OFFLINE_TEST_MISSING"), { value: null, offline: true });
  assert.equal(await appSecret("SECRET_OFFLINE_TEST_MISSING"), null);
});

test("ошибка хранилища не запоминается как «секрета нет»", () => {
  const src = read("lib/secrets.ts");
  const fn = src.slice(src.indexOf("export async function readAppSecret("));
  const error = fn.indexOf("if (error) {");
  const remember = fn.indexOf("cache.set(name");
  assert.ok(error > 0 && remember > error, "запомненное «нет» после ошибки");
  assert.match(fn.slice(error, remember), /return \{ value: null, offline: true \};/);
});

test("скаут не помечает аккаунт мёртвым, когда хранилище промолчало", () => {
  const src = read("scout/accounts.mjs");
  const connect = src.slice(src.indexOf("const connect = async (account) => {"));
  assert.match(connect, /const \{ session, offline \} = await accountSessionState\(account\.id\);/);
  assert.ok(
    connect.indexOf("if (offline) {") < connect.indexOf("сессии нет в хранилище"),
    "проверка молчания хранилища стоит после пометки «сессии нет»",
  );
});
