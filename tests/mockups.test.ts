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
  clientMessage,
  mockupNiche,
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
  assert.match(read("app/admin/mockups/page.tsx"), /requireStaff\(\)/);
});

test("витрина: все проекты globalex в списке, закрытые — те, что знает база", () => {
  const showcase = showcaseCases();
  assert.ok(showcase.length >= 10);
  for (const item of cases) {
    if (item.url?.includes("globalex.maximov-tech.ru")) assert.ok(showcase.includes(item), item.slug);
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
  const keys = [...Object.values(SHOWCASE_NICHE), "influence-agentstvo", "bystrovozvodimye-zdaniya", "kursy", "doska-obyavleniy", "it-shkola", "avtoservis", "medcentr", "stomatologiya"];
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
