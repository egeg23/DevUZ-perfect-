/**
 * Счёт трафика из базы (lib/db-tally.mjs).
 *
 * 22.10.2026 Supabase Free: 6,69 ГБ трафика при 5 ГБ за 17 дней, база при
 * этом 72 МБ. Счёт показывает, какие выборки гоняют байты: без него —
 * гадание по коду.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { TALLY_TOP, createTally, processName, responseBytes, tallyKey } from "../lib/db-tally.mjs";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("ключ счёта: метод, таблица и что выбирали", () => {
  const base = "https://x.supabase.co";
  assert.equal(tallyKey(`${base}/rest/v1/prospects?select=id,host,findings&limit=20`), "GET prospects id,host,findings");
  assert.equal(tallyKey(`${base}/rest/v1/outreach_messages?id=eq.1`, "PATCH"), "PATCH outreach_messages");
  assert.equal(tallyKey(`${base}/rest/v1/rpc/next_job`, "POST"), "POST rpc/next_job");
  assert.equal(tallyKey(`${base}/storage/v1/object/razbor/a/b.webp`), "GET storage/razbor");
  assert.equal(tallyKey(`${base}/auth/v1/user`), "GET auth");
  // Пробелы в select не делят одну выборку на две.
  assert.equal(tallyKey(`${base}/rest/v1/leads?select=id, name`), "GET leads id,name");
  assert.equal(tallyKey("не адрес"), "GET ?");
});

test("счёт за день: самые тяжёлые сверху, остальное — одной суммой", () => {
  let now = Date.parse("2026-10-22T10:00:00Z");
  const tally = createTally({ now: () => now });
  tally.add("GET prospects id,findings", 5000);
  tally.add("GET prospects id,findings", 7000);
  tally.add("GET leads id", 10);
  for (let i = 0; i < TALLY_TOP + 5; i += 1) tally.add(`GET t${i}`, 1);
  const snap = tally.snapshot();
  assert.equal(snap.day, "2026-10-22");
  assert.deepEqual(snap.top[0], { key: "GET prospects id,findings", n: 2, bytes: 12000 });
  assert.equal(snap.top.length, TALLY_TOP);
  assert.equal(snap.rest?.n, 7);
  assert.equal(snap.total.n, 2 + 1 + TALLY_TOP + 5);
  // Новый день — счёт с нуля.
  now = Date.parse("2026-10-23T00:01:00Z");
  tally.add("GET leads id", 3);
  assert.deepEqual(tally.snapshot().total, { n: 1, bytes: 3 });
});

test("байты ответа: content-length, а без него — длина тела, и тело не теряется", async () => {
  const sized = new Response("x".repeat(10), { headers: { "content-length": "4" } });
  assert.equal(await responseBytes(sized), 4);
  const plain = new Response(JSON.stringify([{ id: 1 }]));
  assert.equal(await responseBytes(plain), 10);
  // Счёт читает копию: клиент базы получает ответ целиком.
  assert.deepEqual(await plain.json(), [{ id: 1 }]);
});

test("имя процесса: сайт, скаут и боты пишут каждый свою строку", () => {
  const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;
  assert.equal(processName(env({}), ["node", "/opt/devuz/scout/runner.mjs"]), "scout/runner.mjs");
  assert.equal(processName(env({ DEVUZ_PROC: "bot" }), ["node", "x.js"]), "bot");
});

test("клиент базы считает каждый ответ, а сброс идёт мимо счёта", () => {
  const egress = read("lib/egress.mjs");
  assert.match(egress, /export async function dbFetch\(url, init = \{\}\) \{\n {2}const response = await db\.roadFetch\(url, init\);\n {2}void countDb\(/);
  // Сброс — прямой дорогой db.roadFetch, а не dbFetch: иначе считал бы сам себя.
  const flush = egress.slice(egress.indexOf("async function flushTally()"), egress.indexOf("async function countDb("));
  assert.match(flush, /await db\.roadFetch\(`\$\{base\}\/rest\/v1\/stats_snapshots\?on_conflict=key`/);
  assert.doesNotMatch(flush, /dbFetch\(/);
  // Таймер не держит процесс.
  assert.match(egress, /tallyTimer\.unref\?\.\(\);/);
});
