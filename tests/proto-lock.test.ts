/**
 * Пароль на прототип (lib/proto/lock): в базе — хеш, в куке — производное
 * от хеша, перебор ограничен, без пароля макет не отдаётся.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { PIN_LIMIT, hasPinCookie, lockHash, pinCookieHeader, pinCookieName, pinCookieValue, pinMatches, pinPage } from "@/lib/proto/lock";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const ID = "268e4f90-0e30-425d-8b7a-eaac34883bc1";

test("пароль проверяется по хешу, сам пароль нигде не хранится", () => {
  const lock = lockHash(ID, "2303");
  assert.ok(!lock.includes("2303"));
  assert.equal(pinMatches(ID, lock, "2303"), true);
  assert.equal(pinMatches(ID, lock, " 2303 "), true);
  assert.equal(pinMatches(ID, lock, "2304"), false);
  // Тот же пароль на другом прототипе — другой хеш.
  assert.notEqual(lockHash("другой", "2303"), lock);
});

test("кука: значение из хеша, а не хеш; чужая или старая не подходит", () => {
  const lock = lockHash(ID, "2303");
  const value = pinCookieValue(lock);
  assert.notEqual(value, lock);
  const header = `a=1; ${pinCookieName(ID)}=${value}; b=2`;
  assert.equal(hasPinCookie(header, ID, lock), true);
  assert.equal(hasPinCookie(`${pinCookieName(ID)}=${lock}`, ID, lock), false);
  assert.equal(hasPinCookie(header, ID, lockHash(ID, "9999")), false, "смена пароля обнуляет выданные куки");
  assert.equal(hasPinCookie(null, ID, lock), false);
  const set = pinCookieHeader(ID, lock, "T".repeat(43));
  for (const part of ["HttpOnly", "Secure", "SameSite=Lax", `Path=/proto/${"T".repeat(43)}`]) assert.ok(set.includes(part), part);
});

test("форма: noindex, условия на обоих языках, без названия клиента", () => {
  const html = pinPage("ask");
  assert.match(html, /noindex/);
  assert.ok(html.includes("/ru/mockup-terms") && html.includes("/uz/mockup-terms"));
  assert.doesNotMatch(html, /Bloger/i);
  assert.match(pinPage("wrong"), /не подошёл/);
});

test("макет без пароля не отдаётся и журнал не пишется; перебор ограничен", () => {
  const serve = read("lib/proto/serve.ts");
  const gate = serve.indexOf("hasPinCookie(");
  assert.ok(gate > 0 && gate < serve.indexOf("logView("), "проверка пароля должна стоять до журнала показа");
  assert.match(serve, /rateLimit\(`proto-pin:\$\{ip\}`, PIN_LIMIT\)/);
  assert.ok(PIN_LIMIT.limit <= 10);
  for (const route of ["app/proto/[token]/route.ts", "app/proto/[token]/[...page]/route.ts"]) {
    assert.match(read(route), /export async function POST/, `${route}: нет приёма пароля`);
  }
});
