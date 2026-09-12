import assert from "node:assert/strict";
import { test } from "node:test";

import { loginCommand } from "@/lib/qualify/commands";

/**
 * Сторож за одной пропущенной функцией.
 *
 * Команда входа сравнивалась с «/login» как есть, а все остальные команды
 * бота приводились к нижнему регистру. Разница — один вызов, которого нет;
 * ни типы, ни чтение кода её не показывают. А для человека это выглядит
 * так: написал боту с телефона «/Login», бот промолчал, вход в панель не
 * работает. Дважды подряд.
 */

test("клавиатура телефона ставит заглавную — это всё равно команда входа", () => {
  assert.ok(loginCommand("/login"), "обычное написание");
  assert.ok(loginCommand("/Login"), "именно так отправляет телефон с автозаглавной");
  assert.ok(loginCommand("/LOGIN"), "капслок");
  assert.ok(loginCommand("  /login  "), "пробелы по краям");
  assert.ok(loginCommand("/LoGiN"), "как угодно");
});

test("в группе Telegram дописывает имя бота — команда не должна ломаться", () => {
  assert.ok(loginCommand("/login@Devuz_studio_bot"));
  assert.ok(loginCommand("/Login@devuz_studio_bot"));
});

test("чужое за команду входа не принимаем", () => {
  for (const text of ["", "   ", "привет", "/help", "/id", "/start", "логин", "войти"]) {
    assert.equal(loginCommand(text), false, `«${text}» не команда входа`);
  }
  // Сообщения без текста — картинка, стикер, голосовое.
  assert.equal(loginCommand(undefined), false);
  assert.equal(loginCommand(null), false);
});

test("команда должна стоять в начале, а не где-то в тексте", () => {
  // Иначе пересланное сообщение с упоминанием команды выдавало бы ссылку
  // входа тому, кто её просто процитировал.
  assert.equal(loginCommand("напиши боту /login и получишь ссылку"), false);
});
