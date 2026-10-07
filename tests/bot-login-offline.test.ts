/**
 * Вход через бота при сбое базы: «база не отвечает», а не «нет такой команды».
 *
 * 07.10.2026 после сбоя владелец набрал /login и получил «Такой команды у
 * меня нет»: база не ответила, поиск сотрудника вернул «никого», и бот принял
 * владельца за постороннего. Теперь поиск говорит отдельно, ответила ли база
 * (findStaffByTelegram), и вход в боте и кнопкой это различает.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

function body(source: string, signature: string, length = 2500): string {
  const at = source.indexOf(signature);
  assert.ok(at >= 0, `${signature} пропала`);
  return source.slice(at, at + length);
}

test("поиск сотрудника по Telegram различает «нет такого» и «база не ответила», с одним повтором", () => {
  const find = body(read("lib/admin/session.ts"), "export async function findStaffByTelegram(", 1600);
  assert.match(find, /offline: true/, "сбой базы не отличается от «никого»");
  assert.match(find, /if \(!error\) return \{ staff: toStaff\(data\), offline: false \}/);
  assert.match(find, /attempt < 2/, "нет повтора на короткий сбой связи");
  assert.match(find, /catch \(error\)/, "исключение из клиента базы роняет вход");
});

test("/login в боте: при сбое базы — «база не отвечает», постороннему — как на любую команду", () => {
  const login = body(read("app/api/telegram/webhook/route.ts"), "async function handleStaffLogin(", 1500);
  assert.match(login, /findStaffByTelegram\(telegramId\)/);
  const offline = login.indexOf("if (offline)");
  const stranger = login.indexOf("botCopy(locale).unknown");
  assert.ok(offline > 0 && stranger > offline, "сначала проверка сбоя, потом ответ постороннему");
  assert.match(login.slice(offline, stranger), /база сейчас не отвечает/);
});

test("вход кнопкой Telegram: сбой базы — «попробуйте позже», а не «вы не сотрудник»", () => {
  const enter = read("app/admin/enter/[[...to]]/route.ts");
  assert.match(enter, /const \{ staff, offline \} = await findStaffByTelegram\(checked\.auth\.id\);\n\s*\/\/[^\n]*\n\s*if \(offline\) return fail\("2"\);/);
});
