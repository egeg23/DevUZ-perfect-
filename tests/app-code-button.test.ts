/**
 * Код для приложения панели — и когда «Start» в боте не сработал.
 *
 * Владелец, 25.10.2026: «Пытаюсь зайти через приложение с экрана телефона, он
 * отправляет в бот Start, но код не выдаёт. Сделай отдельную кнопку для
 * генерации кода в боте». Личка владельца назначена чатом продаж, и
 * «/start app-…» там разбирал handleSales — кода не было. Теперь /start входа
 * разбирается раньше чата продаж, а /code и «🔑 Код для приложения» дают код
 * к последнему входу, начатому в приложении.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { APP_CODE_BUTTON, appCodeCommand, isAppStart, startPayloadOf } from "@/lib/admin/app-login";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("/start с ключом входа узнаётся в любом виде", () => {
  assert.equal(startPayloadOf("/start app-AbCdEfGhIjKlMnOpQrStUv"), "app-AbCdEfGhIjKlMnOpQrStUv");
  assert.equal(startPayloadOf("/Start@Devuz_studio_bot login"), "login");
  assert.equal(startPayloadOf("/start"), "");
  assert.equal(startPayloadOf("стартуем"), null);
  assert.ok(isAppStart(startPayloadOf("/start app-AbCdEfGhIjKlMnOpQrStUv") ?? ""));
});

test("кнопка и /code — код для приложения; обычные слова — нет", () => {
  assert.ok(appCodeCommand(APP_CODE_BUTTON));
  assert.ok(appCodeCommand("/code"));
  assert.ok(appCodeCommand("/code@Devuz_studio_bot"));
  assert.ok(appCodeCommand("Код для приложения"));
  assert.ok(!appCodeCommand("какой код у прототипа?"));
  assert.ok(!appCodeCommand("/codes"));
});

test("вход разбирается раньше чата продаж: личка владельца — тоже личка сотрудника", () => {
  const hook = read("app/api/telegram/webhook/route.ts");
  const route = hook.slice(hook.indexOf("async function route("), hook.indexOf("async function handleClientMedia("));
  const start = route.indexOf("startPayloadOf(update.message.text)");
  assert.ok(start > 0 && start < route.indexOf("isSalesChat(chat.id)"), "/start входа после чата продаж");
  assert.match(route, /if \(start !== null && isAppStart\(start\)\) \{\s*await handleAppCode\(update\.message, start\);/);
  assert.match(route, /appCodeCommand\(update\.message\.text\) && \(await handleAppCodeButton\(update\.message\)\)/);
  const button = hook.slice(hook.indexOf("async function handleAppCodeButton("));
  assert.match(button, /issueLatestAppCode\(staff\.id\)/);
  assert.match(button, /sendMessage\(chat\.id, codeMessage\(code\), \{ mirror: false \}\)/, "код не уходит пушем");
  assert.match(button, /if \(!staff\) return false;/, "незнакомцу кода нет");
});

test("код по кнопке — к последнему входу приложения за 15 минут, ничьему или своему", () => {
  const store = read("lib/admin/app-login-store.ts");
  const latest = store.slice(store.indexOf("export async function issueLatestAppCode("), store.indexOf("export type AppCodeResult"));
  assert.match(latest, /const open = `staff_id\.is\.null,staff_id\.eq\.\$\{staffId\}`;/);
  assert.match(latest, /\.gt\("created_at", since\)/);
  assert.match(latest, /\.order\("created_at", \{ ascending: false \}\)/);
  assert.match(latest, /code_hash: codeHash\(String\(row\.request_hash\), code\)/);
});

test("кнопка внизу чата и /code в меню сотрудника, подсказка на экране входа", () => {
  assert.match(read("lib/admin/stream-store.ts"), /\[\[on \? STREAM_OFF : STREAM_ON\], \[APP_CODE_BUTTON\]\]/);
  assert.match(read("lib/qualify/menu.ts"), /command: "code"/);
  assert.match(read("components/admin/app-login.tsx"), /t\.appFallback/);
});
