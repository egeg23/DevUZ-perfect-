/**
 * Неверные пароли к макету считаются в базе (миграция 0170), а не только в
 * памяти процесса, которая обнуляется с каждой выкаткой.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PIN_DAY_LIMIT, pinOverLimit } from "@/lib/proto/code-store";
import { CODE_LIMIT } from "@/lib/proto/codes";

test("предел: за час — CODE_LIMIT, за сутки — PIN_DAY_LIMIT", () => {
  assert.equal(pinOverLimit(0, 0), false);
  assert.equal(pinOverLimit(CODE_LIMIT.limit - 1, CODE_LIMIT.limit - 1), false);
  assert.equal(pinOverLimit(CODE_LIMIT.limit, CODE_LIMIT.limit), true);
  assert.equal(pinOverLimit(5, PIN_DAY_LIMIT - 1), false);
  assert.equal(pinOverLimit(5, PIN_DAY_LIMIT), true);
  // Четыре цифры PIN владельца за сутки не перебрать даже на сотую часть.
  assert.ok(PIN_DAY_LIMIT * 100 <= 10_000);
});

test("ввод пароля сверяется с базой и пишет каждую неудачу", () => {
  const serve = readFileSync("lib/proto/serve.ts", "utf8");
  assert.match(serve, /if \(await protoPinBlocked\(page\.id\)\) return pinResponse\("limit"\)/);
  assert.match(serve, /await noteProtoPinFailure\(page\.id\);\s*\n\s*return pinResponse\("wrong"\)/);
});

test("таблица неудач закрыта от ключа anon", () => {
  const up = readFileSync("supabase/migrations/0170_proto_pin_failures.sql", "utf8");
  assert.match(up, /enable row level security/);
  assert.match(up, /revoke all on public\.proto_pin_failures from anon, authenticated/);
  assert.match(readFileSync("supabase/migrations/0170_proto_pin_failures.down.sql", "utf8"), /drop table if exists public\.proto_pin_failures/);
});
