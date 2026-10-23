/**
 * Раздел «Макеты»: все макеты студии и пароль на сутки (lib/admin/mockups.ts,
 * lib/proto/codes.ts). Владелец, 08.10.2026: «пароль на 24 часа для доступа
 * клиента, после пароль протухает».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { cases } from "@/content/cases";
import { mockupsDict, mockupNicheDict } from "@/content/admin-panel/mockups";
import {
  SHOWCASE_LOCK,
  SHOWCASE_NICHE,
  assignsMockups,
  clientMessage,
  mockupNiche,
  mockupOwner,
  mockupSends,
  parseMockupRef,
  showcaseCases,
  showcaseRow,
  tashkentTime,
} from "@/lib/admin/mockups";
import { SECTIONS, ROLES } from "@/lib/admin/roles";
import {
  CODE_LIMIT,
  CODE_TTL_MS,
  TEAM_TTL_MS,
  codeCookieHeader,
  codeCookieMatches,
  codeCookieName,
  codeCookieValue,
  isCode,
  newCode,
  protoCodeHash,
  readCodeCookie,
  showcaseCodeHash,
} from "@/lib/proto/codes";

const between = (text: string, from: string, to: string) => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));
const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const ID = "268e4f90-0e30-425d-8b7a-eaac34883bc1";
const ROW = "0b7f6f3e-6a8e-4c62-9d55-1f1d2c3b4a59";
const sha = (text: string) => createHash("sha256").update(text).digest("hex");

test("пароль — пять цифр, живёт сутки; доступ команды — 12 часов", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const code = newCode();
    assert.ok(isCode(code), code);
    seen.add(code);
  }
  assert.ok(seen.size > 150, "пароли должны быть разными");
  assert.equal(CODE_TTL_MS, 24 * 60 * 60_000);
  assert.ok(TEAM_TTL_MS <= CODE_TTL_MS);
  assert.ok(CODE_LIMIT.limit <= 30 && CODE_LIMIT.windowMs >= 60 * 60_000, "перебор пяти цифр должен упираться в предел");
});

test("в базе — хеш: свой у каждого макета, у витрины — как в showcase_code_hash", () => {
  const hash = protoCodeHash(ID, "04817");
  assert.ok(!hash.includes("04817"));
  assert.notEqual(protoCodeHash("другой", "04817"), hash);
  assert.equal(protoCodeHash(ID, " 04817 "), hash);
  // Витрина проверяет пароль функцией базы: sha256 от «витрина:пароль».
  assert.equal(showcaseCodeHash("gh", "12345"), sha("gh:12345"));
});

test("кука доступа: id строки и подпись из хеша; чужая, поддельная и протухшая не годятся", () => {
  const hash = protoCodeHash(ID, "04817");
  const value = codeCookieValue(ROW, hash);
  assert.ok(!value.includes(hash), "хеш пароля в браузер не уходит");
  const parsed = readCodeCookie(`a=1; ${codeCookieName(ID)}=${value}; b=2`, ID);
  assert.deepEqual(parsed, { id: ROW, sig: value.split(".")[1] });
  assert.equal(codeCookieMatches(parsed!.sig, hash), true);
  assert.equal(codeCookieMatches(parsed!.sig, protoCodeHash(ID, "11111")), false);
  assert.equal(readCodeCookie(`${codeCookieName(ID)}=не-то`, ID), null);
  assert.equal(readCodeCookie(`${codeCookieName("другой-макет")}=${value}`, ID), null);
  assert.equal(readCodeCookie(null, ID), null);

  const now = Date.parse("2026-10-08T10:00:00Z");
  const token = "T".repeat(43);
  const set = codeCookieHeader({ protoId: ID, token, codeId: ROW, codeHash: hash, expiresAt: "2026-10-09T10:00:00Z", now });
  for (const part of ["HttpOnly", "Secure", "SameSite=Lax", `Path=/proto/${token}`, "Max-Age=86400"]) assert.ok(set.includes(part), part);
  const late = codeCookieHeader({ protoId: ID, token, codeId: ROW, codeHash: hash, expiresAt: "2026-10-08T09:00:00Z", now });
  assert.ok(late.includes("Max-Age=0"), "протухший пароль не даёт куки");
});

test("макет закрывается паролем: проверка до журнала, «Открыть» команды не считается клиентом", () => {
  const serve = read("lib/proto/serve.ts");
  const gate = serve.indexOf("const access = await accessBy(");
  assert.ok(gate > 0 && gate < serve.indexOf("logView("), "проверка доступа должна стоять до журнала показа");
  assert.match(serve, /\(page\.lock \|\| page\.closed\) && !access\) return pinResponse\("ask"\)/);
  assert.match(serve, /access !== "team"/);
  assert.match(serve, /rateLimit\(`proto-pin-all:\$\{page\.id\}`, CODE_LIMIT\)/);
  assert.match(serve, /liveProtoCode\(page\.id, pin\)/);

  const store = read("lib/proto/code-store.ts");
  assert.match(store, /\.gt\("expires_at"/, "живой — только непротухший пароль");
  assert.match(store, /kind === "client"[\s\S]*closed_at/, "пароль клиента закрывает открытый макет");

  const open = read("app/admin/mockups/open/[id]/route.ts");
  assert.ok(open.indexOf("currentStaff()") < open.indexOf("teamAccess("), "доступ команды — только после входа в панель");
});

test("раздел видят все роли; пароль выдаёт любой из команды", () => {
  const section = SECTIONS.find((s) => s.href === "/admin/mockups");
  assert.ok(section, "нет раздела «Макеты»");
  assert.deepEqual([...section.roles].sort(), [...ROLES].sort());
  assert.match(read("app/admin/mockups/actions.ts"), /requireStaff\(\)/);
  assert.match(read("app/admin/mockups/page.tsx"), /requireSection\("\/admin\/mockups"\)/);
});

test("собранных ботом для касаний в списке нет; фильтра и пометки «для касания» тоже", () => {
  // Владелец, 09.10.2026: «Убери из макетов „для касаний“… чтобы менеджеры не путались».
  const store = read("lib/admin/mockups-store.ts");
  assert.match(store, /if \(row\.auto === true\) continue;/);
  const list = read("components/admin/mockup-list.tsx");
  assert.doesNotMatch(list, /"auto"|tagAuto|filterAuto/);
  assert.doesNotMatch(read("content/admin-panel/mockups.ts"), /filterAuto|tagAuto/);
  // И в «Прототипах» их нет: 09.10.2026 все 29 закрыты паролем и убраны.
  const protos = between(read("lib/proto/store.ts"), "export async function protosList(", "export async function protoById(");
  assert.match(protos, /\.eq\("auto", false\)/);
});

test("витрина: все проекты globalex в списке, закрытые — те, что знает база", () => {
  const showcase = showcaseCases();
  assert.ok(showcase.length >= 10);
  for (const item of cases) {
    if (item.url?.includes("cases.devuz.studio")) assert.ok(showcase.includes(item), item.slug);
  }
  const migration = read("supabase/migrations/0094_mockup_codes.sql");
  for (const [slug, key] of Object.entries(SHOWCASE_LOCK)) {
    assert.ok(showcase.some((c) => c.slug === slug), `${slug}: нет такого проекта витрины`);
    assert.ok(migration.includes(`'${key}'`), `${key}: база не примет пароль к этой витрине`);
  }
  const mavera = showcaseRow(showcase.find((c) => c.slug === "mavera")!, "ru", null);
  assert.equal(mavera.canCode, true);
  assert.equal(mavera.access, "closed");
  const open = showcaseRow(showcase.find((c) => !(c.slug in SHOWCASE_LOCK))!, "ru", "2026-10-09T10:00:00Z");
  assert.equal(open.canCode, false);
  assert.equal(open.access, "public");
  assert.equal(open.liveUntil, null);
});

test("ниша — словами на каждом языке панели, у каждого проекта витрины", () => {
  for (const item of showcaseCases()) {
    assert.ok(SHOWCASE_NICHE[item.slug], `${item.slug}: впишите нишу в SHOWCASE_NICHE`);
  }
  // Ниши прототипов, собранных руками (scripts/protos), — на 08.10.2026.
  const keys = [...Object.values(SHOWCASE_NICHE), "influence-agentstvo", "bystrovozvodimye-zdaniya", "kursy", "doska-obyavleniy", "marketpleys", "metalloprokat", "it-shkola", "avtoservis", "medcentr", "stomatologiya"];
  for (const key of keys) {
    for (const locale of ["ru", "uz", "pl"] as const) {
      const label = mockupNiche(key, locale);
      assert.notEqual(label, key, `${key}: нет названия ниши (${locale})`);
      if (locale !== "ru") assert.ok(!/[а-яё]/i.test(label), `${key} (${locale}): кириллица — «${label}»`);
    }
  }
  assert.ok(Object.keys(mockupNicheDict).length > 0);
});

test("текст клиенту: на языке макета, ссылка, пароль, срок по Ташкенту и условия", () => {
  const input = { url: "https://devuz.studio/proto/abc", code: "04817", expiresAt: "2026-10-09T09:30:00Z" };
  assert.equal(tashkentTime(input.expiresAt), "09.10 14:30");
  const ru = clientMessage({ ...input, lang: "ru" });
  const uz = clientMessage({ ...input, lang: "uz" });
  for (const text of [ru, uz]) {
    assert.ok(text.includes(input.url) && text.includes("04817") && text.includes("09.10 14:30"), text);
    assert.doesNotMatch(text, /[—–]| - /, "без длинных тире");
  }
  assert.match(ru, /\/ru\/mockup-terms/);
  assert.match(uz, /\/uz\/mockup-terms/);
  assert.ok(!/[а-яё]/i.test(uz), "узбекский текст — латиницей");
});

test("кнопка пароля зовёт макет понятной ссылкой, остальное отвергается", () => {
  assert.deepEqual(parseMockupRef(`p:${ID}`), { kind: "proto", id: ID });
  assert.deepEqual(parseMockupRef("s:golden-house"), { kind: "showcase", slug: "golden-house" });
  for (const bad of ["", "p:1", "x:mavera", "s:../../etc", `p:${ID};drop`]) assert.equal(parseMockupRef(bad), null, bad);
  // Ошибка из сервера — у каждой причины своя строка на панели.
  for (const reason of ["not_found", "no_lock", "offline"] as const) assert.ok(mockupsDict[`fail_${reason}`]);
});

test("ответственный: назначенный руками, потом хозяин лида, автор касания, кто собрал", () => {
  // Руководитель (Александр), 15.10.2026: «Добавить в раздел макеты
  // ответственного за макет менеджера и дату, когда макет был отправлен / не
  // отправлен клиенту».
  const names = new Map([
    ["a", "Александр"],
    ["b", "Арсений"],
    ["c", "Эльдар"],
    ["d", "Егор"],
  ]);
  const none = { set: null, lead: null, touch: null, made: null };
  assert.deepEqual(mockupOwner({ set: "a", lead: "b", touch: "c", made: "d" }, names), { id: "a", name: "Александр", source: "set" });
  assert.deepEqual(mockupOwner({ ...none, lead: "b", touch: "c", made: "d" }, names), { id: "b", name: "Арсений", source: "lead" });
  assert.deepEqual(mockupOwner({ ...none, touch: "c", made: "d" }, names), { id: "c", name: "Эльдар", source: "touch" });
  assert.deepEqual(mockupOwner({ ...none, made: "d" }, names), { id: "d", name: "Егор", source: "made" });
  assert.equal(mockupOwner(none, names), null, "никого — «не назначен»");
  // Сотрудника без имени (удалён из базы) пропускаем — берём следующего.
  assert.deepEqual(mockupOwner({ ...none, set: "x", lead: "b" }, names)?.name, "Арсений");
});

test("ответственного назначают руководитель и владелец; менеджер видит, но не меняет", () => {
  assert.equal(assignsMockups("admin"), true);
  assert.equal(assignsMockups("head"), true);
  assert.equal(assignsMockups("manager"), false);
  const store = read("lib/admin/mockups-store.ts");
  const set = between(store, "export async function setMockupOwner(", "/** Своя цена акции");
  // Роль — первой строкой, до базы: галочка раздела даёт только просмотр.
  assert.ok(set.indexOf("assignsMockups(staff.role)") < set.indexOf("serviceClient()"));
  assert.match(set, /is_active/, "назначить можно только того, кто работает");
  assert.match(set, /record\("mockup\.owner"/, "назначение — в журнал");
  assert.match(read("app/admin/mockups/actions.ts"), /setMockupOwner\(/);
  // Список людей — только тем, кто назначает.
  assert.match(read("app/admin/mockups/page.tsx"), /assigns \? mockupStaffOptions\(\)/);
  assert.match(read("supabase/migrations/0166_mockup_owner.sql"), /add column if not exists owner_staff_id uuid references public\.staff/);
});

test("отправка клиенту — первая из mockup_offers у каждого макета, не только у открытых", () => {
  const store = read("lib/admin/mockups-store.ts");
  assert.match(store, /const refs = \(data \?\? \[\]\)\.filter\(\(r\) => r\.auto !== true\)\.map\(\(r\) => `p:\$\{r\.id\}`\);/);
  assert.match(store, /firstSends\(refs\)/);
  assert.match(store, /sentAt: sends\.get\(`p:\$\{id\}`\)\?\.sent_at \?\? null/);
  const list = read("components/admin/mockup-list.tsx");
  assert.match(list, /t\.sentAt\(row\.sentAtText\)/);
  assert.match(list, /t\.notSent/);
  assert.match(list, /filter === "unsent"/);
});

test("«макет закрылся паролем» — сначала ответственному из «Макетов»", () => {
  const close = read("lib/proto/auto-close-store.ts");
  assert.match(close, /senderChat\(sent, p\.prospect_id, p\.owner_staff_id \?\? null\)/);
  const sender = between(close, "async function senderChat(", "export type AutoCloseRun");
  assert.ok(sender.indexOf("let staffId: string | null = owner;") < sender.indexOf("sent?.lead_id"));
});

test("кому и с какого аккаунта ушёл макет — все отправки по времени", () => {
  const tags = new Map([["acc-2", { label: "Аккаунт 2", handle: "@devuz_two" }]]);
  const sends = mockupSends(
    [
      { mockup_ref: "p:1", client: "@armadaazia", peer: "@armadaazia", account: "acc-2", sent_at: "2026-10-16T05:00:00Z", lead_id: null },
      { mockup_ref: "p:1", client: "Клуб Invis", peer: null, account: "main", sent_at: "2026-10-15T05:00:00Z", lead_id: "lead-1" },
      { mockup_ref: "p:1", client: "Старый клиент", peer: null, account: null, sent_at: "2026-10-06T05:00:00Z", lead_id: null },
      { mockup_ref: "p:2", client: "Компания", peer: "@boss", account: "gone", sent_at: "2026-10-16T06:00:00Z", lead_id: null },
      { mockup_ref: "p:3", client: null, peer: null, account: "main", sent_at: null, lead_id: null },
    ],
    tags,
  );
  const one = sends.get("p:1") ?? [];
  assert.deepEqual(
    one.map((s) => s.to),
    ["Старый клиент", "Клуб Invis", "@armadaazia"],
    "по времени, первая отправка первой",
  );
  assert.equal(one[0].from, "unknown", "аккаунт не записан — ранняя отправка");
  assert.deepEqual(one[1].from, { label: null, handle: null }, "main — главный аккаунт");
  assert.equal(one[1].leadId, "lead-1");
  assert.deepEqual(one[2].from, { label: "Аккаунт 2", handle: "@devuz_two" });
  assert.equal(one[2].handle, null, "ник, совпадающий с «кому», второй раз не пишем");
  const two = sends.get("p:2") ?? [];
  assert.deepEqual(two[0].from, { label: "", handle: null }, "аккаунта в базе уже нет");
  assert.equal(two[0].handle, "@boss");
  assert.equal(sends.has("p:3"), false, "без времени отправки — не отправка");

  // Подписи — как у касаний, на трёх языках.
  assert.equal(mockupsDict.sendFrom.ru(null, null), "с главного аккаунта");
  assert.equal(mockupsDict.sendFrom.ru("Аккаунт 2", "@devuz_two"), "с аккаунта «Аккаунт 2» @devuz_two");
  assert.equal(mockupsDict.sendFrom.ru("", null), "с рабочего аккаунта");
  for (const lang of ["ru", "uz", "pl"] as const) assert.ok(mockupsDict.moreSends[lang](4).includes("4"));

  const store = read("lib/admin/mockups-store.ts");
  assert.match(store, /mockupSends\(every, tags\)/);
  assert.match(store, /sends: sendsByRef\.get\(`p:\$\{id\}`\) \?\? \[\]/);
  const list = read("components/admin/mockup-list.tsx");
  assert.match(list, /<SendList sends=\{row\.sendsText\}/);
  assert.match(list, /t\.sendFromUnknown/);
});

/**
 * Владелец, 23.10.2026, на разбор удобства: «Делаем все сразу». «Показал
 * макет» — в «Макетах», у каждой отправки, тем же путём, что в карточке лида.
 */
test("«Показал макет» — у отправки в «Макетах», тем же markStageAction", () => {
  const list = readFileSync(new URL("../components/admin/mockup-list.tsx", import.meta.url), "utf8");
  assert.match(list, /send\.leadId \|\| send\.prospectId \? <ShownMark leadId=\{send\.leadId\} prospectId=\{send\.prospectId\} \/> : null/);
  assert.match(list, /<form key=\{via\} action=\{markStageAction\}>/);
  assert.match(list, /name="back" value="\/admin\/mockups"/);
  const sends = mockupSends(
    [{ mockup_ref: "r1", client: "Демо", peer: null, account: null, sent_at: "2026-10-23T10:00:00Z", lead_id: null, prospect_id: "p1" }],
    new Map(),
  );
  assert.equal(sends.get("r1")?.[0].prospectId, "p1");
});
