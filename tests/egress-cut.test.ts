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
  assert.match(read("lib/admin/sales-stages-store.ts"), /forget\("hq:deals:"\);\n {2}forget\("deals:"\);\n {2}return "ok";/);
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

test("входящее рабочему аккаунту: касание ищется по лёгким колонкам, целиком — одно", () => {
  // 22.10.2026: каждое входящее, и от посторонних тоже, читало 500 касаний
  // с письмом и обходом сайта — ~600 КБ за раз, 92% трафика скаута.
  const talk = read("lib/admin/outreach-talk-store.ts");
  const start = talk.indexOf("export async function recordInbound(");
  const body = talk.slice(start, talk.indexOf("if (!prospect) return { matched: false };", start));
  assert.match(talk, /const MATCH_FIELDS = "id, status, target, target_kind, target_user_id, contacts";/);
  assert.doesNotMatch(talk.slice(talk.indexOf("const MATCH_FIELDS"), talk.indexOf("const MATCH_FIELDS") + 90), /message|walked/);
  // Списки — только MATCH_FIELDS; PROSPECT_FIELDS — по id клиента (одна строка) или по найденному id.
  for (const m of body.matchAll(/\.select\(PROSPECT_FIELDS\)([\s\S]*?);/g)) {
    assert.match(m[1], /\.limit\(1\)|\.eq\("id", matchId\)\.maybeSingle\(\)/, "целиком — только одна строка");
  }
  assert.equal(body.match(/\.select\(MATCH_FIELDS\)/g)?.length, 3);
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

test("копия базы: вся — раз в неделю, журнал и переписка — каждую ночь", () => {
  // Полная копия — 30–40 МБ трафика; каждую ночь это ~1 ГБ из 5 ГБ в месяц.
  const sh = read("deploy/backup-db.sh");
  assert.match(sh, /FULL_EVERY_MIN=\$\(\( 7 \* 24 \* 60 - 60 \)\)/);
  assert.match(sh, /LOG_TABLES=\(audit_events lead_messages outreach_messages\)/);
  assert.match(sh, /find "\$DEST" -name 'devuz-2\*\.sql\.gz' -mmin "-\$FULL_EVERY_MIN"/);
  assert.match(sh, /--data-only "\$\{LOG_TABLES\[@\]\/#\/--table=public\.\}"/);
  // Старые копии чистятся обе: и полные, и журнальные.
  assert.match(sh, /find "\$DEST" -name 'devuz-\*\.sql\.gz' -mtime "\+\$KEEP_DAYS" -delete/);
});

test("уровни: вся история — раз в сутки, каждый час — сегодняшнее поверх base", async () => {
  // 22.10.2026: пересчёт за 400 дней — ~1,75 МБ, раз в час ~1,2 ГБ в месяц.
  const { partsFor, tashkentDay } = await import("@/lib/admin/levels-store");
  const { dealsOf } = await import("@/lib/admin/sales-stages");
  const { XP_KINDS } = await import("@/lib/admin/levels");
  const ME = "me";
  const p = (id: string, at: string, replied: string | null) => ({
    id, label: id, status: "sent", touched_by: ME, touched_at: at, sent_at: null, hello_at: at,
    replied_at: replied, proto_requested_at: null, autopilot_replied_at: null, lead_id: null,
  });
  const deals = dealsOf({
    prospects: [p("a", "2026-10-01T08:00:00Z", "2026-10-22T05:00:00Z"), p("b", "2026-10-22T04:00:00Z", null)],
    leads: [], mockups: [], marks: [], prices: [], payments: [], wins: [],
  });
  const presence = [{ staff_id: ME, day: "2026-10-21", minutes: 200 }, { staff_id: ME, day: "2026-10-22", minutes: 30 }];
  const acts = [{ actor_staff_id: ME, created_at: "2026-10-21T10:00:00Z" }, { actor_staff_id: ME, created_at: "2026-10-22T06:00:00Z" }];
  // 22.10 по Ташкенту начинается 21.10 в 19:00 UTC.
  const today = tashkentDay(new Date("2026-10-22T10:00:00Z"));
  assert.deepEqual(today, { day: "2026-10-22", start: Date.parse("2026-10-21T19:00:00Z") });
  const full = partsFor(ME, deals, presence, acts);
  const todays = partsFor(ME, deals, presence, acts, today.start);
  const base = Object.fromEntries(XP_KINDS.map((k) => [k, full[k] - todays[k]]));
  for (const k of XP_KINDS) assert.equal(base[k] + todays[k], full[k], k);
  assert.equal(todays.touch, 1);
  assert.equal(todays.reply, 1);

  const store = read("lib/admin/levels-store.ts");
  assert.match(store, /const days = base \? RECENT_DAYS : HISTORY_DAYS;/);
  assert.match(store, /loadDeals\(now, days, ROWS\)/);
  assert.match(store, /const snap = await computeXp\(now, current\);/);
});

test("счёт трафика: у каждого запуска своя строка, выкатка не стирает счёт", () => {
  const egress = read("lib/egress.mjs");
  assert.match(egress, /const RUN = `\$\{process\.pid\}-\$\{Date\.now\(\)\.toString\(36\)\}`;/);
  assert.match(egress, /key: `egress-tally:\$\{snap\.day\}:\$\{processName\(\)\}:\$\{RUN\}`/);
});

test("разборы: список и страница — из памяти, любая правка снимает сразу", () => {
  // 23.10.2026: 1 626 чтений разборов за день — 100 МБ.
  const store = read("lib/razbor/store.ts");
  assert.match(store, /export const RAZBOR_MS = 10 \* 60_000;/);
  assert.match(store, /memo\(`razbor:list:\$\{locale\}`, RAZBOR_MS/);
  assert.match(store, /memo\(`razbor:slug:\$\{locale\}:\$\{slug\}`, RAZBOR_MS/);
  // После записи — не до: иначе чтение посередине запомнит старое, и
  // проверка карты сайта после публикации не найдёт новый разбор.
  for (const fn of ["saveDraft", "publish", "unpublish", "remove", "saveArticles", "reject"]) {
    const start = store.indexOf(`export async function ${fn}(`);
    const body = store.slice(start, store.indexOf("\n}\n", start));
    const forgot = body.lastIndexOf("forgetRazbors();");
    assert.ok(forgot > body.lastIndexOf('from("razbors")'), `${fn}: память снимается после записи`);
  }
  assert.match(read("lib/razbor/foreign-run.ts"), /if \(!error\) \{\n\s+forgetRazbors\(\);/);
});

test("сделки — одно чтение на 10 минут для всех, отметка ступени снимает", () => {
  // 23.10.2026: 274 чтения сделок за день — ~70 МБ.
  const store = read("lib/admin/sales-stages-store.ts");
  assert.match(store, /export const DEALS_MS = 10 \* 60_000;/);
  assert.match(store, /if \(Math\.abs\(Date\.now\(\) - now\.getTime\(\)\) < 60_000\) \{\n\s+return memo\(`deals:\$\{days\}:\$\{limit\}`, DEALS_MS, \(\) => readDeals\(now, days, limit\)\);/);
  assert.match(store, /forget\("hq:deals:"\);\n\s+forget\("deals:"\);/);
});

test("пул порции: находки — только «есть или нет»", () => {
  // 23.10.2026: 84 чтения пула с полным разбором — 29 МБ за день.
  const store = read("lib/admin/portion-store.ts");
  const pool = store.slice(store.indexOf("export async function pool("), store.indexOf("export type PortionAssign"));
  assert.match(pool, /\.select\("id, host, contacts, status, f0:findings->0->>code"\)/);
  assert.doesNotMatch(pool, /select\("[^"]*(^|, )findings(,|")/);
});

test("порция: замены и подготовка письма смотрят только статус карточки", () => {
  // 23.10.2026: карточки целиком читались 1 386 раз за день — 44 МБ.
  const out = read("lib/admin/outreach-store.ts");
  const states = out.slice(out.indexOf("export async function prospectStates("), out.indexOf("export async function prospectById("));
  assert.match(states, /\.select\("id, status, touched_by, touched_at, claimed_by"\)/);
  assert.match(states, /\.select\("id"\)\.in\("id", part\)\.or\("message\.is\.null,message\.eq\."\)/);
  assert.doesNotMatch(states, /COLUMNS|findings|walked/);
  const portion = read("lib/admin/portion-store.ts");
  for (const fn of ["prepareNextPortion", "topUpPortions"]) {
    const start = portion.indexOf(`export async function ${fn}(`);
    const body = portion.slice(start, portion.indexOf("\n}\n", start));
    assert.match(body, /prospectStates\(/, fn);
    assert.doesNotMatch(body, /prospectsByIds\(/, fn);
  }
});
