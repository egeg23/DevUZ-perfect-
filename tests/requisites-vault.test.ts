import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { SELLER_GROUPS, loadSellerBank } from "@/lib/store/requisites-vault";

// Выдуманные реквизиты: настоящие лежат только в хранилище секретов.
const VAULT: Record<string, string> = {
  INVOICE_TAX_ID: "12345678901234",
  INVOICE_TAX_ID_KIND: "pinfl",
  INVOICE_BANK_NAME: "Тестовый банк",
  INVOICE_BANK_ACCOUNT: "20218000700000000001",
  INVOICE_BANK_MFO: "00001",
};
const read = async (name: string) => VAULT[name] ?? null;

test("реквизиты студии: пустой .env берёт связки из хранилища", async () => {
  const env: Record<string, string | undefined> = { INVOICE_TAX_ID: "", INVOICE_TAX_ID_KIND: "inn", INVOICE_BANK_ACCOUNT: "" };
  const taken = await loadSellerBank(env, read, 1000);
  assert.deepEqual(new Set(taken), new Set(Object.keys(VAULT)));
  // Вид номера — вместе с номером: ПИНФЛ под подписью «ИНН» вернут.
  assert.equal(env.INVOICE_TAX_ID_KIND, "pinfl");
  assert.equal(env.INVOICE_BANK_MFO, "00001");
});

test("реквизиты студии: заданное в .env главнее хранилища", async () => {
  const env: Record<string, string | undefined> = {
    INVOICE_TAX_ID: "300000000",
    INVOICE_TAX_ID_KIND: "inn",
    INVOICE_BANK_ACCOUNT: "20208000000000000009",
    INVOICE_BANK_NAME: "Свой банк",
    INVOICE_BANK_MFO: "00009",
  };
  const before = { ...env };
  assert.deepEqual(await loadSellerBank(env, read, 1000), []);
  assert.deepEqual(env, before);
});

test("реквизиты студии: неполная связка в хранилище не берётся, молчание хранилища не ждётся вечно", async () => {
  const env: Record<string, string | undefined> = {};
  const partial = async (name: string) => (name === "INVOICE_BANK_MFO" ? null : VAULT[name] ?? null);
  const taken = await loadSellerBank(env, partial, 1000);
  assert.deepEqual(taken, ["INVOICE_TAX_ID", "INVOICE_TAX_ID_KIND"]);
  assert.equal(env.INVOICE_BANK_ACCOUNT, undefined, "счёт без МФО не подставляется");

  const started = Date.now();
  assert.deepEqual(await loadSellerBank({}, () => new Promise(() => {}), 50), []);
  assert.ok(Date.now() - started < 1000);
});

test("реквизиты студии: связки покрывают обязательное, сервер грузит их при старте", () => {
  const required = ["INVOICE_TAX_ID", "INVOICE_BANK_NAME", "INVOICE_BANK_ACCOUNT", "INVOICE_BANK_MFO"];
  const all = SELLER_GROUPS.flat();
  for (const name of required) assert.ok(all.includes(name), name);
  assert.match(readFileSync("instrumentation.ts", "utf8"), /loadSellerBank\(\)/);
});
