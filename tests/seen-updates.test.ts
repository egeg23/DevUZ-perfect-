import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { alreadyHandled, forgetAllUpdates } from "@/lib/qualify/seen-updates";

/**
 * За три команды /login у владельца было выписано восемь одноразовых ссылок.
 * Telegram, не получив 200 вовремя, присылал то же обновление снова, а
 * обработчик проходил весь путь заново — и каждая пересылка выписывала
 * новую ссылку. Поймать это чтением кода нельзя: повтор выглядит как
 * обычный запрос и отличается только номером, который никто не смотрел.
 */

beforeEach(forgetAllUpdates);

test("повтор того же обновления работой не считается", () => {
  assert.equal(alreadyHandled(1001), false, "первый раз — работаем");
  assert.equal(alreadyHandled(1001), true, "второй — нет");
  assert.equal(alreadyHandled(1001), true, "и третий тоже");
});

test("разные обновления друг другу не мешают", () => {
  assert.equal(alreadyHandled(1), false);
  assert.equal(alreadyHandled(2), false);
  assert.equal(alreadyHandled(3), false);
  assert.equal(alreadyHandled(2), true, "второе уже было");
  assert.equal(alreadyHandled(4), false);
});

test("обновление без номера обрабатываем как новое", () => {
  // Пропустить настоящую команду хуже, чем изредка сделать работу дважды.
  for (const bad of [undefined, null, "17", NaN, Infinity, {}]) {
    assert.equal(alreadyHandled(bad), false, `${String(bad)} не должно глушить обработку`);
    assert.equal(alreadyHandled(bad), false, "и повторно тоже");
  }
});

test("карта не растёт бесконечно", () => {
  // Шквал обновлений не должен съедать память контейнера.
  for (let i = 0; i < 12000; i += 1) alreadyHandled(i);

  // Свежие обязаны помниться — иначе защита не работает там, где нужна.
  assert.equal(alreadyHandled(11999), true, "последнее обновление забыто");
  assert.equal(alreadyHandled(11998), true, "предпоследнее забыто");

  // А самые старые вытеснены, и это нормально: Telegram их давно не шлёт.
  assert.equal(alreadyHandled(0), false, "самое старое должно было вытесниться");
});
