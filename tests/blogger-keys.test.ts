/**
 * Ключи «Блогеров» — поля во вкладке, а не руками в хранилище
 * (lib/bloggers/keys.ts, keys-store.ts, components/admin/blogger-keys.tsx).
 *
 * Владелец, 06.11.2026: «Добавить поля, что куда вписать с инструкцией
 * понятной, откуда что взять и вставить, что бы работало… В настройках
 * доступа — сделать возможность дать доступ к разделу менеджерам. По
 * умолчанию доступ у меня и Александра».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, test } from "node:test";

import { bloggerKeysDict } from "@/content/admin-panel/blogger-keys";
import { SECTIONS, opens, withSection } from "@/lib/admin/roles";
import {
  FB_SCOPES_NEEDED,
  cleanKey,
  expiresSoon,
  graphFail,
  igAccountsFrom,
  keysCheckOf,
  keysToSave,
  ownAccount,
  tokenInfo,
  type KeysCheck,
} from "@/lib/bloggers/keys";
import { PROBE_HANDLE, checkKeys } from "@/lib/bloggers/keys-store";
import { forgetSecrets } from "@/lib/secrets";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const TOKEN = `EAA${"x".repeat(120)}`;
const IG_ID = "17841400000000001";
const DAY = 24 * 3600_000;

afterEach(() => {
  delete process.env.BLOGGERS_FB_TOKEN;
  delete process.env.BLOGGERS_IG_USER_ID;
  forgetSecrets();
});

test("поля: пустое — не менять, неверное — не пишется ничего, токен Instagram — своя подсказка", () => {
  assert.deepEqual(keysToSave({}), { ok: true, save: [] });
  assert.deepEqual(keysToSave({ fbToken: `  ${TOKEN}\n`, appId: "1234567890123" }), {
    ok: true,
    save: [
      { name: "BLOGGERS_FB_TOKEN", value: TOKEN },
      { name: "AI_STAFF_IG_APP_ID", value: "1234567890123" },
    ],
  });
  // Одно поле неверное — не пишется и верное: половину ключей не оставляем.
  assert.deepEqual(keysToSave({ fbToken: TOKEN, appSecret: "short" }), { ok: false, field: "appSecret", why: "format" });
  assert.deepEqual(keysToSave({ fbToken: `IGAA${"y".repeat(80)}` }), { ok: false, field: "fbToken", why: "ig_token" });
  assert.deepEqual(keysToSave({ igUserId: "@devuz" }), { ok: false, field: "igUserId", why: "format" });
  assert.equal(cleanKey(` «${"a".repeat(32)}» \n`), "a".repeat(32));
});

test("ответы Meta → причина словом: токен, права, номер; короткий токен и нехватка прав видны", () => {
  assert.equal(graphFail({ error: { code: 190 } }), "token");
  assert.equal(graphFail({ error: { code: 10 } }), "scopes");
  assert.equal(graphFail({ error: { code: 200 } }), "scopes");
  assert.equal(graphFail({ error: { code: 100 } }), "id");
  assert.equal(graphFail(null), "other");

  const now = Date.parse("2026-11-06T10:00:00Z");
  const long = tokenInfo({ data: { is_valid: true, expires_at: (now + 59 * DAY) / 1000, scopes: [...FB_SCOPES_NEEDED, "pages_show_list"] } }, now);
  assert.deepEqual(long, { ok: true, expiresAt: now + 59 * DAY, short: false, missing: [] });
  const short = tokenInfo({ data: { is_valid: true, expires_at: (now + 3600_000) / 1000, scopes: [...FB_SCOPES_NEEDED] } }, now);
  assert.ok(short.ok && short.short);
  const never = tokenInfo({ data: { is_valid: true, expires_at: 0, scopes: [...FB_SCOPES_NEEDED] } }, now);
  assert.ok(never.ok && never.expiresAt === null && !never.short);
  const thin = tokenInfo({ data: { is_valid: true, expires_at: 0, scopes: ["instagram_basic"] } }, now);
  assert.ok(thin.ok && thin.missing.includes("instagram_manage_insights"));
  assert.deepEqual(tokenInfo({ data: { is_valid: false } }, now), { ok: false, reason: "token" });

  assert.deepEqual(
    igAccountsFrom({ data: [{ name: "Без Instagram" }, { name: "DevUz", instagram_business_account: { id: IG_ID, username: "devuz.studio" } }] }),
    [{ id: IG_ID, username: "devuz.studio", page: "DevUz" }],
  );
  assert.deepEqual(ownAccount({ username: "devuz.studio", followers_count: 1200 }), { ok: true, username: "devuz.studio", followers: 1200 });
  assert.deepEqual(ownAccount({ error: { code: 100 } }), { ok: false, reason: "id" });
});

test("токен кончается через неделю — жёлтая строка «пора продлить»", () => {
  const now = Date.parse("2026-11-06T10:00:00Z");
  const check = (days: number): KeysCheck => ({ ok: true, at: "x", username: "devuz", followers: 1, expiresAt: new Date(now + days * DAY).toISOString(), found: false });
  assert.equal(expiresSoon(check(30), now), false);
  assert.equal(expiresSoon(check(5), now), true);
  assert.equal(expiresSoon({ ok: false, at: "x", reason: "token" }, now), false);
  assert.equal(keysCheckOf({ ok: true, at: "2026-11-06", username: "devuz", followers: null, expiresAt: null, found: true })?.ok, true);
  assert.equal(keysCheckOf({ junk: 1 }), null);
});

/** Meta понарошку: ответ по адресу запроса. */
function fakeMeta(routes: { debug?: unknown; accounts?: unknown; own?: unknown; probe?: unknown }) {
  const urls: string[] = [];
  const impl = (async (input: string | URL | Request) => {
    const url = String(input);
    urls.push(url);
    const body = url.includes("/debug_token")
      ? routes.debug
      : url.includes("/me/accounts")
        ? routes.accounts
        : url.includes("business_discovery")
          ? routes.probe
          : routes.own;
    return new Response(JSON.stringify(body ?? {}), { status: 200 });
  }) as typeof fetch;
  return { impl, urls };
}

test("проверка: номер аккаунта находится по токену, цифры чужого профиля пробуются на @instagram, токен в итог не попадает", async () => {
  process.env.BLOGGERS_FB_TOKEN = TOKEN;
  const now = new Date("2026-11-06T10:00:00Z");
  const meta = fakeMeta({
    debug: { data: { is_valid: true, expires_at: Math.floor((now.getTime() + 60 * DAY) / 1000), scopes: [...FB_SCOPES_NEEDED] } },
    accounts: { data: [{ name: "DevUz", instagram_business_account: { id: IG_ID, username: "devuz.studio" } }] },
    own: { username: "devuz.studio", followers_count: 1200 },
    probe: { business_discovery: { username: PROBE_HANDLE } },
  });
  const result = await checkKeys(meta.impl, now);
  assert.equal(result.ok, true);
  assert.ok(result.ok && result.username === "devuz.studio" && result.followers === 1200);
  assert.ok(result.ok && result.expiresAt === new Date(now.getTime() + 60 * DAY).toISOString());
  assert.ok(meta.urls.some((u) => u.includes("/me/accounts")), "номер ищется по страницам токена");
  assert.ok(meta.urls.some((u) => u.includes(encodeURIComponent(`business_discovery.username(${PROBE_HANDLE})`))));
  assert.ok(!JSON.stringify(result).includes(TOKEN), "значение токена в итог проверки не попадает");
});

test("проверка: короткий токен, нет прав, чужие профили не отвечают — каждое своей причиной", async () => {
  process.env.BLOGGERS_FB_TOKEN = TOKEN;
  process.env.BLOGGERS_IG_USER_ID = IG_ID;
  const now = new Date("2026-11-06T10:00:00Z");
  const exp = (ms: number) => Math.floor((now.getTime() + ms) / 1000);
  const shortToken = await checkKeys(fakeMeta({ debug: { data: { is_valid: true, expires_at: exp(3600_000), scopes: [...FB_SCOPES_NEEDED] } } }).impl, now);
  assert.deepEqual(shortToken, { ok: false, at: now.toISOString(), reason: "short" });
  const thin = await checkKeys(fakeMeta({ debug: { data: { is_valid: true, expires_at: exp(50 * DAY), scopes: ["instagram_basic"] } } }).impl, now);
  assert.ok(!thin.ok && thin.reason === "scopes" && thin.missing?.includes("pages_read_engagement"));
  const noProbe = await checkKeys(
    fakeMeta({
      debug: { data: { is_valid: true, expires_at: exp(50 * DAY), scopes: [...FB_SCOPES_NEEDED] } },
      own: { username: "devuz.studio" },
      probe: { error: { code: 100 } },
    }).impl,
    now,
  );
  assert.ok(!noProbe.ok && noProbe.reason === "discovery");
  delete process.env.BLOGGERS_FB_TOKEN;
  forgetSecrets();
  const none = await checkKeys(fakeMeta({}).impl, now);
  assert.ok(!none.ok && (none.reason === "no_token" || none.reason === "network"));
});

test("права: ключи — владельцу и руководителю, доступ к разделу — только владельцу; в журнал — имена без значений", () => {
  const actions = read("app/admin/ai-staff/bloggers/actions.ts");
  const fn = (name: string) => actions.slice(actions.indexOf(`export async function ${name}`), actions.indexOf("\n}\n", actions.indexOf(`export async function ${name}`)));
  assert.match(fn("saveBloggerKeys"), /requireRole\("admin", "head"\)/);
  assert.match(fn("checkBloggerKeys"), /requireRole\("admin", "head"\)/);
  assert.match(fn("saveBloggersAccess"), /requireAdmin\(\)/);
  assert.match(fn("saveBloggerKeys"), /record\("ai_staff\.key_saved", \{[^}]*meta: \{ keys: saved \}/);
  // Значения ключей на экран не возвращаются: у полей нет defaultValue/value.
  const block = read("components/admin/blogger-keys.tsx");
  assert.doesNotMatch(block, /name=\{f\}[^>]*(defaultValue|value=)/);
  const page = read("app/admin/ai-staff/bloggers/page.tsx");
  assert.match(page, /\{desk && keys \? <BloggerKeys/);
  assert.match(page, /staff\.role === "admin" \? <BloggersAccess/);
  assert.match(page, /desk \? keysState\(\) : null/);
});

test("по умолчанию раздел — владельцу и руководителю; галочка открывает менеджеру и снимается обратно", () => {
  const section = SECTIONS.find((s) => s.href === "/admin/ai-staff");
  assert.ok(section);
  assert.deepEqual([...section.roles].sort(), ["admin", "head"]);
  assert.equal(opens({ role: "manager" }, "/admin/ai-staff"), false);
  const opened = withSection("manager", { "/admin/leads-x": true }, "/admin/ai-staff", true);
  assert.equal(opens({ role: "manager", section_access: opened }, "/admin/ai-staff"), true);
  assert.equal(opened["/admin/leads-x"], true, "другие галочки не трогаются");
  // Сняли — отличия от роли нет, записи тоже нет.
  assert.deepEqual(withSection("manager", opened, "/admin/ai-staff", false), { "/admin/leads-x": true });
  // Руководителю раздел положен — снять можно, вернуть — запись исчезает.
  const closed = withSection("head", {}, "/admin/ai-staff", false);
  assert.deepEqual(closed, { "/admin/ai-staff": false });
  assert.deepEqual(withSection("head", closed, "/admin/ai-staff", true), {});
});

test("инструкция в блоке: шаги со ссылками на кабинет Meta, адреса вебхука и возврата — кнопкой «Скопировать»", () => {
  const block = read("components/admin/blogger-keys.tsx");
  for (const url of ["developers.facebook.com/tools/explorer/", "developers.facebook.com/tools/debug/accesstoken/", "developers.facebook.com/apps/"]) {
    assert.ok(block.includes(url), url);
  }
  assert.match(block, /\/api\/ai-staff\/instagram/);
  assert.match(block, /STUDIO_REDIRECT_PATH/);
  assert.match(block, /IG_REDIRECT_PATH/);
  const keys = ["a1", "a2", "a3", "a4", "a5", "a6", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "b10", "b11", "b12"] as const;
  for (const key of keys) {
    assert.ok(bloggerKeysDict[key].ru.length > 40, key);
    // Шаги словами, без цепочек «→» и «>» (владелец, 12.11.2026).
    for (const lang of ["ru", "uz", "pl"] as const) assert.doesNotMatch(bloggerKeysDict[key][lang], /→|>/, `${key}.${lang}`);
  }
  // Номер шага — в тексте («Шаг 1 —»), а не номером списка.
  assert.equal(bloggerKeysDict.stepNo.ru(1), "Шаг 1 —");
  assert.match(block, /t\.stepNo\(n\)/);
  assert.doesNotMatch(block, /list-decimal/);
  for (let n = 1; n <= 12; n++) assert.match(block, new RegExp(`step\\(\\s*${n},\\s*t\\.b${n}\\b`), `b${n}`);
  // Свой номер Instagram, а не общий номер приложения: так 12.11.2026 вышло «Недействительный запрос».
  assert.match(bloggerKeysDict.b3.ru, /Недействительный запрос/);
  // Почему только тестировщики и как опубликовать: «тесты», подтверждение компании, проверка, публикация.
  assert.match(bloggerKeysDict.b9.ru, /Проверьте требования к тестированию/);
  assert.match(bloggerKeysDict.b10.ru, /Подтверждение компании/);
  assert.match(bloggerKeysDict.b11.ru, /instagram_business_manage_messages/);
  assert.match(bloggerKeysDict.b12.ru, /Опубликовать/);
  // Короткий токен и Graph API Explorer названы в шагах.
  assert.match(bloggerKeysDict.a4.ru, /60 дней/);
});
