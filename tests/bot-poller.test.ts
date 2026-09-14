import assert from "node:assert/strict";
import { test } from "node:test";

import { ackOffset, backoffMs, classifyError } from "../bot/logic.mjs";

/**
 * Поллер бота вместо вебхука: подтверждаем ровно то, что отдали
 * приложению, а на ошибках не крутимся в цикле.
 */

test("offset подтверждает обновление и не откатывается назад", () => {
  assert.equal(ackOffset(0, 100), 101);
  assert.equal(ackOffset(101, 100), 101, "повтор старого update не сдвигает offset назад");
  assert.equal(ackOffset(101, 105), 106);
});

test("пауза растёт с ошибками и упирается в 30 секунд", () => {
  assert.equal(backoffMs(1), 2_000);
  assert.equal(backoffMs(2), 4_000);
  assert.equal(backoffMs(4), 16_000);
  assert.equal(backoffMs(9), 30_000);
  assert.equal(backoffMs(0), 2_000, "нулевая серия — как первая");
});

test("409 — конфликт с вебхуком, 401 — токен, остальное — повторяем", () => {
  assert.equal(classifyError(409, "Conflict"), "conflict");
  assert.equal(classifyError(401, "Unauthorized"), "token");
  assert.equal(classifyError(502, "Bad Gateway"), "retry");
  assert.equal(classifyError(0, "fetch failed"), "retry");
});
