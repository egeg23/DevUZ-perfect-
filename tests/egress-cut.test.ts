/**
 * Трафик базы: что перестали перечитывать.
 *
 * 22.10.2026 Supabase Free: 6,69 ГБ трафика из базы при 5 ГБ за 17 дней, а
 * база весит 72 МБ. Рост — с середины октября, когда появилась «Главная» с
 * обновлением раз в 90 секунд. Здесь держится то, что эти чтения не
 * вернутся молча.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { SLOW_MS, forget, memo } from "@/lib/memo";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("memo: одно чтение на время, ошибка не запоминается, forget снимает сразу", async () => {
  let reads = 0;
  const load = async () => (reads += 1);
  const t0 = 1_000_000;
  assert.equal(await memo("t:a", 1000, load, t0), 1);
  assert.equal(await memo("t:a", 1000, load, t0 + 999), 1, "в пределах срока — из памяти");
  assert.equal(await memo("t:a", 1000, load, t0 + 1000), 2, "срок вышел — читаем снова");
  forget("t:");
  assert.equal(await memo("t:a", 1000, load, t0 + 1001), 3, "forget — читаем снова");

  let fails = 0;
  const broken = async () => {
    fails += 1;
    throw new Error("база не ответила");
  };
  await assert.rejects(memo("t:b", 1000, broken, t0));
  await new Promise((r) => setImmediate(r));
  await assert.rejects(memo("t:b", 1000, broken, t0 + 1));
  assert.equal(fails, 2, "ошибку не запоминаем");
  forget("t:");
});

test("«Главная»: медленное — из памяти, отметка ступени и рассылка снимают сразу", () => {
  const hq = read("lib/admin/hq-store.ts");
  assert.match(hq, /memo\("hq:deals:30", SLOW_MS, \(\) => loadDeals\(now\)\)/);
  assert.match(hq, /memo\("hq:grade", SLOW_MS, \(\) => gradeBookAll\(now\)\)/);
  assert.match(hq, /memo\(`hq:idle:\$\{ids\.join\(","\)\}`, SLOW_MS, \(\) => loadIdle\(ids\)\)/);
  const my = read("lib/admin/hq-my-store.ts");
  assert.match(my, /memo\("hq:deals:21", SLOW_MS, \(\) => loadDeals\(now, 21\)\)/);
  // Свои лиды менеджера «без движения» — с кнопками: читаются свежими.
  assert.match(my, /loadIdle\(\[me\]\)/);
  assert.doesNotMatch(my, /memo\([^)]*loadIdle/);

  const page = read("app/admin/hq/page.tsx");
  assert.match(page, /memo\("hq:broadcast:staff", HISTORY_MS/);
  assert.match(page, /memo\("hq:audience", SLOW_MS/);
  assert.match(read("lib/admin/sales-stages-store.ts"), /forget\("hq:deals:"\);\n {2}return "ok";/);
  assert.match(read("lib/admin/broadcast-store.ts"), /forget\("hq:broadcast:"\);/);
  assert.match(read("lib/admin/bot-users-store.ts"), /forget\("hq:audience"\);/);
  assert.ok(SLOW_MS <= 5 * 60_000, "медленное — не дольше пяти минут");
});

test("автопрогон выбирает карточки без разборов целиком", () => {
  const store = read("lib/admin/autopilot-store.ts");
  const cols = store.match(/const POOL_COLUMNS = "([^"]+)"/)?.[1] ?? "";
  assert.ok(cols.includes("f0:findings->0->>code"), "есть ли находки — по коду первой");
  assert.doesNotMatch(cols, /(^|, )findings(,|$)/, "весь разбор не читаем");
  assert.match(store, /rank\(\(\(data \?\? \[\]\) as Record<string, unknown>\[\]\)\.map\(poolRow\), busy\)/);
});

test("модель берёт только свои разговоры: отпущенные не занимают очередь", () => {
  const store = read("lib/admin/outreach-talk-store.ts");
  const pending = store.slice(store.indexOf("export async function pendingTalks"), store.indexOf("export async function threadFor"));
  assert.match(pending, /prospects!inner\(ai_handling\)/);
  assert.match(pending, /\.eq\("prospects\.ai_handling", true\)/);
});

test("лиды без движения: просмотры не читаются из базы", () => {
  const tidy = read("lib/admin/lead-tidy-store.ts");
  assert.match(tidy, /\.not\("action", "in", `\(\$\{NOT_MOVES\.join\(","\)\}\)`\)/);
});

test("разборы на сайте: статья целиком — только на языке страницы", async () => {
  // 22.10.2026: список читал все четыре статьи — ~800 КБ за раз.
  const { columnsFor } = await import("@/lib/razbor/store");
  const ru = columnsFor("ru");
  assert.match(ru, /(^|, )article_ru(,|$)/);
  for (const l of ["uz", "en", "pl"]) assert.match(ru, new RegExp(`article_${l}:article_${l}->>title`));
  assert.doesNotMatch(ru, /(^|, )article_(uz|en|pl)(,|$)/);
  const store = read("lib/razbor/store.ts");
  assert.doesNotMatch(store, /\.select\(COLUMNS\)/);
});
