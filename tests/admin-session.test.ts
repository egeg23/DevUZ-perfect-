import assert from "node:assert/strict";
import { test } from "node:test";

import { hashToken, mintToken, sameToken } from "@/lib/admin/session";
import { DETAIL_COLUMNS, LIST_COLUMNS } from "@/lib/admin/leads";
import { canEdit } from "@/lib/admin/ownership";

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
    for (const column of ["contact_handle", "contact_kind"]) {
      assert.equal(
        names.includes(column),
        false,
        `${column} отдаётся только отдельным действием, со строкой в журнале`,
      );
    }

    // Без этого проверка выше проходила бы и на пустой строке.
    assert.ok(names.includes("id"));
    assert.ok(names.includes("score"));
  }
});

/**
 * Право менять лид. Проверка тривиальна ровно до того момента, когда её
 * кто-нибудь «упростит»: перепутанный порядок сравнения или лишний ||
 * здесь означает, что менеджер видит контакты чужих клиентов — то самое,
 * ради чего панель и строилась.
 */
test("менять лид может владелец или админ, больше никто", () => {
  const manager = {
    id: "s-1",
    telegram_user_id: 1,
    username: null,
    display_name: "Менеджер",
    role: "manager" as const,
  };
  const other = { ...manager, id: "s-2", display_name: "Другой" };
  const admin = { ...manager, id: "s-3", role: "admin" as const };

  assert.equal(canEdit({ assigned_staff_id: "s-1" }, manager), true, "свой лид");
  assert.equal(canEdit({ assigned_staff_id: "s-1" }, other), false, "чужой лид");
  assert.equal(canEdit({ assigned_staff_id: "s-1" }, admin), true, "админ разгребает всё");

  // Свободный лид не принадлежит никому — и менять его нельзя, пока он не
  // взят. Иначе «взять» перестало бы что-либо значить: контакт открывался
  // бы и без закрепления.
  assert.equal(canEdit({ assigned_staff_id: null }, manager), false, "свободный лид");
  assert.equal(canEdit({ assigned_staff_id: null }, admin), true, "админ и здесь может");
});
