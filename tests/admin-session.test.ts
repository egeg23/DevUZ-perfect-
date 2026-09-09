import assert from "node:assert/strict";
import { test } from "node:test";

import { hashToken, mintToken, sameToken } from "@/lib/admin/session";
import { DETAIL_COLUMNS, LIST_COLUMNS } from "@/lib/admin/leads";

test("токен сессии непредсказуем и пригоден для URL", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i += 1) {
    const token = mintToken();

    // base64url от 32 байт: 43 символа без padding и без символов, которые
    // ломаются в строке запроса. Ссылку входа мы шлём именно параметром.
    assert.equal(token.length, 43);
    assert.match(token, /^[A-Za-z0-9_-]+$/);

    assert.equal(seen.has(token), false, "два одинаковых токена подряд");
    seen.add(token);
  }
});

test("в базу уходит хеш, а не сам токен", () => {
  const token = mintToken();
  const hash = hashToken(token);

  assert.equal(hash.length, 64);
  assert.match(hash, /^[0-9a-f]+$/);
  assert.notEqual(hash, token);

  // Детерминированность: иначе сессия не находилась бы по своей же куке.
  assert.equal(hashToken(token), hash);
  assert.notEqual(hashToken(mintToken()), hash);
});

test("сравнение токенов не падает на разной длине", () => {
  const token = mintToken();

  assert.equal(sameToken(token, token), true);
  assert.equal(sameToken(token, mintToken()), false);

  // timingSafeEqual бросает исключение, если длины не совпали. Именно здесь
  // это и случилось бы: сравнивают кукой, а куку присылает кто угодно.
  assert.equal(sameToken(token, ""), false);
  assert.equal(sameToken(token, token + "x"), false);
});

test("панель не читает переписку и контакт лида", () => {
  for (const columns of [LIST_COLUMNS, DETAIL_COLUMNS]) {
    const names = columns.split(",").map((name) => name.trim());

    assert.equal(names.includes("*"), false, "select(*) в панели запрещён");
    assert.equal(
      names.includes("transcript"),
      false,
      "переписка не должна уезжать в список лидов",
    );
    assert.equal(
      names.includes("contact_handle"),
      false,
      "контакт открывается только вместе с закреплением лида",
    );

    // Без этого проверка выше проходила бы и на пустой строке.
    assert.ok(names.includes("id"));
    assert.ok(names.includes("score"));
  }
});
