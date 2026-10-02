/**
 * Порция дня касаний.
 *
 * Владелец: «нужно решение, которое поможет менеджерам работать эффективно».
 * Утром каждому — поровну компаний из пула с готовым текстом; вечером —
 * отчёт руководителю и владельцу, несделанное — обратно в пул.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  PORTION_DEFAULT,
  PORTION_MAX,
  PORTION_MIN,
  distribute,
  isWorkday,
  outcomeOf,
  quotaOf,
  replaceLimit,
  replacementsDue,
  reportLine,
  tallyPortion,
  tashkentHour,
} from "@/lib/admin/portion";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

test("сколько в день — из недельного плана касаний", () => {
  assert.equal(quotaOf(null), PORTION_DEFAULT, "без плана — по умолчанию");
  assert.equal(quotaOf(0), 0, "план ноль — порции нет");
  assert.equal(quotaOf(30), 6, "30 в неделю — 6 в день");
  assert.equal(quotaOf(12), 3, "округление вверх");
  assert.equal(quotaOf(3), PORTION_MIN);
  assert.equal(quotaOf(500), PORTION_MAX);
});

test("пул делится по кругу, а не первому всё", () => {
  const people = [
    { id: "a", quota: 3 },
    { id: "b", quota: 3 },
    { id: "c", quota: 1 },
  ];
  // Пула меньше, чем порций: каждый получает поровну, лучшие — не одному.
  const short = distribute(people, ["p1", "p2", "p3", "p4"]);
  assert.deepEqual(short.get("a"), ["p1", "p4"]);
  assert.deepEqual(short.get("b"), ["p2"]);
  assert.deepEqual(short.get("c"), ["p3"]);

  // Пула хватает: каждый ровно своё, лишнее остаётся в пуле.
  const full = distribute(people, ["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  assert.equal(full.get("a")!.length, 3);
  assert.equal(full.get("b")!.length, 3);
  assert.equal(full.get("c")!.length, 1);
  const handed = [...full.values()].flat();
  assert.equal(new Set(handed).size, handed.length, "одна компания досталась двоим");

  assert.deepEqual([...distribute([{ id: "a", quota: 0 }], ["x"]).get("a")!], []);
  assert.deepEqual(distribute([], ["x"]).size, 0);
});

test("рабочие дни и часы — по Ташкенту", () => {
  // Пятница 23:30 UTC — в Ташкенте уже суббота 04:30.
  assert.equal(isWorkday(new Date("2026-09-25T23:30:00Z")), false);
  assert.equal(isWorkday(new Date("2026-09-25T10:00:00Z")), true);
  assert.equal(isWorkday(new Date("2026-09-27T10:00:00Z")), false, "воскресенье");
  assert.equal(tashkentHour(new Date("2026-09-23T02:00:00Z")), 7);
});

test("сделано — по самому касанию: кем и в этот день", () => {
  const day = "2026-09-23";
  // 23.09 00:30 по Ташкенту = 22.09 19:30 UTC.
  const today = "2026-09-22T19:30:00Z";
  const yesterday = "2026-09-22T18:30:00Z";
  assert.equal(outcomeOf({ status: "sending", touched_by: "m1", touched_at: today }, "m1", day), "sent");
  assert.equal(outcomeOf({ status: "manual", touched_by: "m1", touched_at: today }, "m1", day), "self");
  assert.equal(outcomeOf({ status: "skipped", touched_by: null, touched_at: null }, "m1", day), "skipped");
  assert.equal(outcomeOf({ status: "sent", touched_by: "m2", touched_at: today }, "m1", day), null, "сделал другой");
  assert.equal(outcomeOf({ status: "sent", touched_by: "m1", touched_at: yesterday }, "m1", day), null, "вчера");
  assert.equal(outcomeOf({ status: "contacting", touched_by: null, touched_at: null }, "m1", day), null);
});

test("строка отчёта: «из» — цель дня, сделано — только касания", () => {
  assert.equal(reportLine({ name: "Данил", target: 5, done: 5, skipped: 0, short: 0, touches: 5 }), "Данил — 5 касаний · порция 5 из 5 ✅");
  assert.equal(reportLine({ name: "Мадина", target: 5, done: 0, skipped: 0, short: 0, touches: 0 }), "Мадина — 0 касаний · порция 0 из 5 ⚠️");
  // Пять касаний при двух «Не подходит» — порция закрыта: за пропуски были замены.
  assert.equal(
    reportLine({ name: "Лола", target: 5, done: 5, skipped: 2, short: 0, touches: 5 }),
    "Лола — 5 касаний · порция 5 из 5, не подошло 2 ✅",
  );
  assert.equal(
    reportLine({ name: "Арсений", target: 5, done: 3, skipped: 2, short: 1, touches: 3 }),
    "Арсений — 3 касания · порция 3 из 5, не подошло 2, без замены 1",
  );
  // Одни пропуски — это ноль касаний, а не «работал».
  assert.equal(
    reportLine({ name: "Тимур", target: 5, done: 0, skipped: 3, short: 0, touches: 0 }),
    "Тимур — 0 касаний · порция 0 из 5, не подошло 3 ⚠️",
  );
});

/*
 * Владелец, 29.09: «сделать нужно 5 в день, без учёта „не подходит“. То есть
 * именно 5 „связались“, а не 3 связались и 2 пропустили. Это и в боте тг
 * должно работать как надо».
 */
test("«Не подходит» не в счёт: цель — утренняя раздача, за каждый пропуск — замена в пределах лимита", () => {
  const R = (replaces: string | null, outcome: "sent" | "self" | "skipped" | null) => ({ replaces, outcome });
  // Утром пять, две пропущены, за одну уже выдана замена.
  const t = tallyPortion([R(null, "sent"), R(null, "self"), R(null, "skipped"), R(null, "skipped"), R(null, null), R("a", null)]);
  assert.deepEqual(t, { target: 5, done: 2, skipped: 2, replaced: 1, short: 1 });
  assert.equal(replacementsDue(t), 1, "за вторую «Не подходит» замена положена");

  // Замена тоже может не подойти — за неё положена следующая…
  const chain = tallyPortion([R(null, "skipped"), R("x", "skipped")]);
  assert.equal(chain.target, 1);
  assert.equal(replacementsDue(chain), 1);
  // …а когда она выдана и сделана, больше не нужно ничего.
  assert.equal(replacementsDue(tallyPortion([R(null, "skipped"), R("x", "skipped"), R("y", "sent")])), 0);

  // Потолок — две порции замен в день: пропусками нельзя перебрать весь пул.
  assert.equal(replaceLimit(5), 10);
  const burned = tallyPortion([
    ...Array.from({ length: 5 }, () => R(null, "skipped")),
    ...Array.from({ length: 10 }, (_, i) => R(`r${i}`, "skipped")),
  ]);
  assert.equal(replacementsDue(burned), 0);
  assert.equal(burned.short, 5);

  // Всё сделано — замен не нужно.
  assert.equal(replacementsDue(tallyPortion([R(null, "sent"), R(null, "sent")])), 0);
});

test("замена: выдаётся сразу и в боте, и в панели, приходит карточкой, пул без чужих порций", () => {
  const store = read("lib/admin/portion-store.ts");
  const top = store.slice(store.indexOf("export async function topUpPortion("), store.indexOf("export async function topUpPortions("));
  // После 18:00 порция закрыта — выдавать в неё нечего.
  assert.match(top, /isWorkday\(now\) \|\| tashkentHour\(now\) >= REPORT_HOUR/);
  assert.match(top, /insert\(\{ day, staff_id: staffId, prospect_id: prospectId, replaces: skipped\.id \}\)/);
  // Компания из чьей-то сегодняшней порции — не кандидат в замену.
  assert.match(top, /pool\(due \+ 3, new Set\(everyone\.map\(\(r\) => r\.prospect_id\)\)\)/);
  assert.match(store, /\.filter\(\(row\) => !exclude\.has\(row\.id as string\)\)/);
  // Двойное нажатие не даёт двух замен: уникальный индекс на replaces.
  assert.match(read("supabase/migrations/0067_portion_replacements.sql"), /create unique index if not exists touch_portions_replaces_key\s+on public\.touch_portions \(replaces\) where replaces is not null/);

  // Карточка — одна: отметка «выдано» ставится до сообщения и условно.
  const deliver = store.slice(store.indexOf("export async function deliverPortions("), store.indexOf("export type TopUp"));
  assert.match(store, /\.is\("delivered_at", null\)\s*\.select\("id"\)/);
  assert.match(deliver, /🔁 Вместо «/);
  assert.match(deliver, /«Не подходит» в счёт не идёт — на её место сразу придёт замена/);

  // Свип подбирает то, что не выдалось сразу.
  const run = store.slice(store.indexOf("export async function runPortions("));
  assert.ok(run.indexOf("await topUpPortions(now)") < run.indexOf("await deliverPortions(now)"));

  // Бот: пропуск → замена → ответ под кнопкой → письмо и карточка.
  const hook = read("app/api/telegram/webhook/route.ts");
  const skip = hook.slice(hook.indexOf('if (action === "skip")'));
  assert.ok(skip.indexOf("skipProspect(") < skip.indexOf("topUpPortion(staff.id)"));
  assert.ok(skip.indexOf("await done(") < skip.indexOf("deliverReplacement(item.rowId)"), "письмо пишется до ответа на нажатие");

  // Панель: «не пишем» у компании из порции — замена хозяину порции.
  const actions = read("app/admin/prospect/actions.ts");
  const panelSkip = actions.slice(actions.indexOf("export async function skipProspectAction("));
  assert.match(panelSkip, /const owner = await portionOwner\(id\);/);
  assert.match(panelSkip, /await topUpPortion\(owner\)/);
  assert.match(panelSkip, /after\(async \(\) => \{\s*for \(const item of top\.made\) await deliverReplacement\(item\.rowId\);/);

  // Блок порции: «сделано X из N» — только касания и цель дня.
  const page = read("app/admin/prospect/page.tsx");
  assert.match(page, /t\.portionHead\(tally\.done, tally\.target\)/);
  assert.match(read("content/admin-panel/prospect.ts"), /`Ваша порция на сегодня: сделано \$\{done\} из \$\{target\}`/);
  assert.match(page, /p\.replacement \? <span className="text-xs text-green">\{t\.replacement\}<\/span>/);
});

test("раздача — раз в день и без двойной раздачи", () => {
  const store = read("lib/admin/portion-store.ts");
  const assign = store.slice(store.indexOf("export async function assignPortions("), store.indexOf("export async function prepareNextPortion("));
  assert.match(assign, /isWorkday\(now\) \|\| tashkentHour\(now\) < ASSIGN_HOUR/);
  assert.match(assign, /ignoreDuplicates: true/);
  assert.match(assign, /\.is\("assigned_at", null\)/);
  // Пул — только ничьи новые, и только те, кому есть как написать.
  const pool = store.slice(store.indexOf("async function pool("), store.indexOf("export type PortionAssign"));
  assert.match(pool, /\.eq\("status", "new"\)/);
  assert.match(pool, /\.is\("claimed_by", null\)/);
  assert.match(pool, /canContact\(/);
  assert.match(read("supabase/migrations/0049_touch_portions.sql"), /unique \(day, prospect_id\)/);
});

test("письма готовятся после ответа свипу и без повторов", () => {
  const sweep = read("app/api/reminders/sweep/route.ts");
  assert.match(sweep, /after\(async \(\) => \{[\s\S]{0,800}await preparePortionsInBackground\(/);
  assert.match(sweep, /await runPortions\(new Date\(\)\)/);
  const store = read("lib/admin/portion-store.ts");
  const prep = store.slice(store.indexOf("export async function prepareNextPortion("), store.indexOf("function ready("));
  assert.match(prep, /\.is\("preparing_at", null\)/);
  assert.match(prep, /update\(\{ preparing_at: now\.toISOString\(\) \}\)[\s\S]{0,80}\.is\("preparing_at", null\)/);
});

test("вечером несделанное — в пул, и без письма с чужой подписью", () => {
  const store = read("lib/admin/portion-store.ts");
  const report = store.slice(store.indexOf("export async function reportPortions("), store.indexOf("export async function portionOf("));
  assert.match(report, /update\(\{ status: "new", claimed_by: null, claimed_at: null, message: null \}\)/);
  assert.match(report, /outcome: outcome \?\? "expired"/);
  // Руководителю — то же, что владельцу: вся команда (владелец, 01.10).
  assert.match(report, /p\.role === "head"/);
  assert.match(report, /\.eq\("role", "admin"\)/);
});

test("кнопки бота — только своя порция и те же проверки, что в панели", () => {
  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /parts\[0\] === "tp"/);
  const handler = hook.slice(hook.indexOf("async function handlePortionButton("));
  assert.match(handler, /await portionSource\(staff\.id, prospectId\)/);
  assert.match(handler, /if \(!staff \|\| !source\)/);
  assert.match(handler, /queueOutreach\(prospectId, message, staff, ip\)/);
  assert.match(handler, /markSelfContacted\(prospectId, staff/);
  assert.match(handler, /skipProspect\(prospectId/);
});

test("отключённому порцию закрывают, в «Касаниях» она сверху", () => {
  assert.match(read("lib/admin/offboarding.ts"), /from\("touch_portions"\)[\s\S]{0,80}outcome: "expired"/);
  const page = read("app/admin/prospect/page.tsx");
  assert.match(page, /portionOf\(staff\.id\)/);
  const head = page.indexOf("t.portionHead(");
  assert.ok(head > 0 && head < page.indexOf("<ProspectRunner"), "порция ниже прогона");
});
