/**
 * Google Analytics через вход владельца в Google.
 *
 * Сеть подменяется: проверяется, что мы просим у Google и как разбираем
 * ответы, — а не то, доступен ли Google из машины, где идут тесты.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  GA_SCOPE,
  authUrl,
  emailOfIdToken,
  enableApiLink,
  exchangeCode,
  findProperty,
  googleRedirectUri,
  isClientId,
} from "@/lib/analytics/google-oauth";
import { gaConnection, loadGa } from "@/lib/analytics/traffic";
import { siteUrl } from "@/lib/seo";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

const realFetch = globalThis.fetch;
type Seen = { url: string; init?: RequestInit };

function stubFetch(answer: (url: string, init?: RequestInit) => { status?: number; body: unknown }): Seen[] {
  const seen: Seen[] = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    seen.push({ url, init });
    const { status = 200, body } = answer(url, init);
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return seen;
}

const ENV = [
  "GOOGLE_OAUTH_CLIENT_ID",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "GA_OAUTH_REFRESH_TOKEN",
  "GA_OAUTH_EMAIL",
  "GA4_PROPERTY_ID",
  "GA_SERVICE_ACCOUNT",
];

test.afterEach(() => {
  globalThis.fetch = realFetch;
  for (const name of ENV) delete process.env[name];
});

const CLIENT = { id: "1234567890-abcdef.apps.googleusercontent.com", secret: "GOCSPX-secret-value" };

const idToken = (claims: object) =>
  `e30.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.sig`;

test("ссылка на вход: только чтение статистики, постоянный доступ, возврат под /admin", () => {
  const url = new URL(authUrl({ clientId: CLIENT.id, state: "st4te" }));
  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  const q = url.searchParams;
  assert.equal(q.get("client_id"), CLIENT.id);
  assert.equal(q.get("redirect_uri"), `${siteUrl}/admin/google/callback`);
  assert.equal(q.get("response_type"), "code");
  assert.equal(q.get("access_type"), "offline");
  // Без prompt=consent повторный вход не отдаёт постоянный доступ.
  assert.equal(q.get("prompt"), "consent");
  assert.equal(q.get("state"), "st4te");
  const scopes = (q.get("scope") ?? "").split(" ");
  assert.ok(scopes.includes(GA_SCOPE));
  // Ничего сверх чтения: ни записи в Analytics, ни доступа к почте или диску.
  assert.deepEqual(scopes.filter((s) => s.startsWith("https://")), [GA_SCOPE]);
  assert.equal(GA_SCOPE, "https://www.googleapis.com/auth/analytics.readonly");
});

test("адрес возврата — под /admin, где живёт кука сессии панели", () => {
  assert.equal(googleRedirectUri("https://devuz.studio/"), "https://devuz.studio/admin/google/callback");
  const cookie = read("app/admin/login/actions.ts");
  assert.match(cookie, /path: "\/admin"/);
  // Lax, а не Strict: иначе кука не придёт с переходом из Google обратно.
  assert.match(cookie, /sameSite: "lax"/);
});

test("Client ID узнаётся по виду", () => {
  assert.ok(isClientId(CLIENT.id));
  assert.ok(!isClientId("GOCSPX-secret"));
  assert.ok(!isClientId(" 1234567890-abc.apps.googleusercontent.com"));
  assert.ok(!isClientId("AIzaSyAnA3NfuYZZrRCDjVS6KouOIfh1UbP2Q2c"));
});

test("почта — из id_token, битый токен её не даёт", () => {
  assert.equal(emailOfIdToken(idToken({ email: "owner@example.com" })), "owner@example.com");
  assert.equal(emailOfIdToken("мусор"), null);
  assert.equal(emailOfIdToken(undefined), null);
});

test("код меняется на токены с тем же адресом возврата", async () => {
  const seen = stubFetch(() => ({
    body: {
      access_token: "acc",
      refresh_token: "ref",
      expires_in: 3599,
      scope: `openid https://www.googleapis.com/auth/userinfo.email ${GA_SCOPE}`,
      id_token: idToken({ email: "owner@example.com" }),
    },
  }));
  const r = await exchangeCode(CLIENT, "the-code", "https://devuz.studio/admin/google/callback");
  assert.deepEqual(r, {
    ok: true,
    access: "acc",
    refresh: "ref",
    scopes: ["openid", "https://www.googleapis.com/auth/userinfo.email", GA_SCOPE],
    email: "owner@example.com",
  });
  assert.equal(seen[0].url, "https://oauth2.googleapis.com/token");
  const form = new URLSearchParams(String(seen[0].init?.body));
  assert.equal(form.get("grant_type"), "authorization_code");
  assert.equal(form.get("code"), "the-code");
  assert.equal(form.get("client_secret"), CLIENT.secret);
  assert.equal(form.get("redirect_uri"), "https://devuz.studio/admin/google/callback");
});

test("отказ Google при обмене — с его объяснением", async () => {
  stubFetch(() => ({ status: 400, body: { error: "redirect_uri_mismatch", error_description: "Bad Request" } }));
  assert.deepEqual(await exchangeCode(CLIENT, "x"), { ok: false, detail: "Bad Request" });
});

test("ресурс ищется по счётчику сайта среди всех доступных", async () => {
  const seen = stubFetch((url) => {
    if (url.includes("/accountSummaries")) {
      return {
        body: {
          accountSummaries: [
            { propertySummaries: [{ property: "properties/111", displayName: "Чужой сайт" }] },
            { propertySummaries: [{ property: "properties/222", displayName: "devuz.studio" }] },
          ],
        },
      };
    }
    if (url.includes("properties/111/dataStreams")) {
      return { body: { dataStreams: [{ webStreamData: { measurementId: "G-OTHER" } }] } };
    }
    return { body: { dataStreams: [{ webStreamData: { measurementId: "G-L52MCVNS0W" } }] } };
  });
  assert.deepEqual(await findProperty("acc", "G-L52MCVNS0W"), { ok: true, property: "222", name: "devuz.studio" });
  for (const s of seen) {
    assert.ok(s.url.startsWith("https://analyticsadmin.googleapis.com/v1beta/"), s.url);
    assert.equal((s.init?.headers as Record<string, string>).Authorization, "Bearer acc");
  }

  stubFetch((url) =>
    url.includes("/accountSummaries")
      ? { body: { accountSummaries: [{ propertySummaries: [{ property: "properties/111" }] }] } }
      : { body: { dataStreams: [] } },
  );
  assert.deepEqual(await findProperty("acc", "G-L52MCVNS0W"), { ok: false, reason: "not_found", checked: 1 });
});

test("выключенный Admin API — причина и ссылка, где его включить", async () => {
  const message =
    "Google Analytics Admin API has not been used in project 5550001 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview?project=5550001 then retry.";
  stubFetch(() => ({ status: 403, body: { error: { message } } }));
  const r = await findProperty("acc");
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.reason === "failed" && r.detail === message);
  assert.equal(
    enableApiLink(message),
    "https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview?project=5550001",
  );
  assert.equal(enableApiLink("Permission denied"), null);
  assert.equal(enableApiLink("see https://evil.example.com/apis/api/x"), null);
});

test("GA по входу Google: постоянный доступ → часовой токен → отчёт", async () => {
  process.env.GOOGLE_OAUTH_CLIENT_ID = CLIENT.id;
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = CLIENT.secret;
  process.env.GA_OAUTH_REFRESH_TOKEN = "refresh-1";
  process.env.GA_OAUTH_EMAIL = "owner@example.com";
  process.env.GA4_PROPERTY_ID = "987654321";

  let form = new URLSearchParams();
  const seen = stubFetch((url, init) => {
    if (url.startsWith("https://oauth2.googleapis.com/token")) {
      form = new URLSearchParams(String(init?.body));
      return { body: { access_token: "oauth-access", expires_in: 3600 } };
    }
    const m = (...v: number[]) => ({ metricValues: v.map((x) => ({ value: String(x) })) });
    return { body: { reports: [{ rows: [m(10, 9, 30, 0.2, 50)] }, { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }] } };
  });

  const r = await loadGa(7, new Date("2026-09-20T10:00:00Z"));
  assert.ok(r.ok, JSON.stringify(r));
  assert.equal(r.report.totals.visits, 10);
  assert.equal(form.get("grant_type"), "refresh_token");
  assert.equal(form.get("refresh_token"), "refresh-1");
  assert.equal(form.get("client_id"), CLIENT.id);
  const report = seen.find((s) => s.url.includes(":batchRunReports"));
  assert.match(report?.url ?? "", /properties\/987654321:batchRunReports/);
  assert.equal((report?.init?.headers as Record<string, string>).Authorization, "Bearer oauth-access");

  assert.deepEqual(await gaConnection(), {
    via: "google",
    client: true,
    property: "987654321",
    email: "owner@example.com",
  });
});

test("Google отозвал вход — «войдите заново», а не общая ошибка", async () => {
  process.env.GOOGLE_OAUTH_CLIENT_ID = CLIENT.id;
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = CLIENT.secret;
  process.env.GA_OAUTH_REFRESH_TOKEN = "refresh-revoked";
  process.env.GA4_PROPERTY_ID = "987654322";
  stubFetch(() => ({ status: 400, body: { error: "invalid_grant", error_description: "Token has been expired or revoked." } }));
  assert.deepEqual(await loadGa(7, new Date("2026-09-20T10:00:00Z")), {
    ok: false,
    reason: "reauth",
    detail: "Token has been expired or revoked.",
  });
});

test("клиент есть, входа нет — не подключено, и в сеть не ходим", async () => {
  process.env.GOOGLE_OAUTH_CLIENT_ID = CLIENT.id;
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = CLIENT.secret;
  const seen = stubFetch(() => ({ body: {} }));
  assert.deepEqual(await loadGa(7), { ok: false, reason: "not_configured" });
  assert.equal(seen.length, 0);
  assert.deepEqual(await gaConnection(), { via: null, client: true, property: null, email: null });
});

test("вход и номер ресурса пишет только владелец, вход сверяется с кукой", () => {
  const actions = read("app/admin/google/actions.ts");
  assert.match(actions, /^"use server";/);
  for (const fn of ["startGoogleSignIn", "saveGaProperty"]) {
    const body = actions.slice(actions.indexOf(`export async function ${fn}`));
    assert.match(body, /^[^]*?\{\s*const staff = await requireAdmin\(\);/, `${fn} без проверки владельца`);
  }
  assert.match(actions, /httpOnly: true/);

  const callback = read("app/admin/google/callback/route.ts");
  assert.match(callback, /staff\.role !== "admin"/);
  assert.match(callback, /request\.cookies\.get\(STATE_COOKIE\)/);
  assert.match(callback, /timingSafeEqual/);
  assert.match(callback, /tokens\.scopes\.includes\(GA_SCOPE\)/);
  // Ответ Google не пишется в журнал целиком: только почта и номер ресурса.
  assert.doesNotMatch(callback, /meta: \{[^}]*refresh/);
});

test("запись в хранилище — только app.* и только сервером", () => {
  const sql = read("supabase/migrations/0056_app_secret_put.sql");
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = ''/);
  assert.match(sql, /left\(p_name, 4\) <> 'app\.'/);
  assert.match(sql, /revoke all on function public\.app_secret_put\(text, text\) from public, anon, authenticated;/);
  assert.match(sql, /grant execute on function public\.app_secret_put\(text, text\) to service_role;/);
});
