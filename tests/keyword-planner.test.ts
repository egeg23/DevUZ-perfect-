/**
 * Планировщик ключевых слов Google Ads (lib/seo/keyword-planner.ts).
 *
 * Владелец, 07.11.2026: «Подключаем, аккаунт гугл адс у меня есть». Третий
 * источник для каждой статьи: поиски в Google по стране. Вход — кабинет
 * Google из «Рекламы», ключи приложения вставляет владелец там же.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { googleKeysToSave } from "@/lib/ads/google-keys";
import { GEO, ideasRequest, keywordIdeas, parseIdeas, plannerReason } from "@/lib/seo/keyword-planner";
import { UZ_REGION } from "@/lib/seo/keywords";

const read = (p: string) => readFileSync(p, "utf8");
const creds = { customerId: "123-456-7890", developerToken: "", accessToken: async () => "token" };

test("запрос: страна всегда, русский язык — только у русской фразы", () => {
  const ru = ideasRequest("создание сайтов", GEO.UZ);
  assert.deepEqual(ru.geoTargetConstants, ["geoTargetConstants/2860"]);
  assert.equal(ru.language, "languageConstants/1031");
  assert.deepEqual(ru.keywordSeed, { keywords: ["создание сайтов"] });
  assert.equal(ru.keywordPlanNetwork, "GOOGLE_SEARCH");
  assert.equal(ideasRequest("sayt yaratish", GEO.UZ).language, undefined, "узбекская латиница — все языки");
  assert.deepEqual({ ...GEO }, { UZ: 2860, RU: 2643, KZ: 2398 });
  assert.equal(UZ_REGION.geo, 2860);
});

test("ответ: по убыванию поисков, без пустых и нулевых", () => {
  const ideas = parseIdeas({
    results: [
      { text: "сайт под ключ", keywordIdeaMetrics: { avgMonthlySearches: "90", competition: "HIGH" } },
      { text: "создание сайтов", keywordIdeaMetrics: { avgMonthlySearches: "1300", competition: "MEDIUM" } },
      { text: "редкая фраза", keywordIdeaMetrics: {} },
      { text: "", keywordIdeaMetrics: { avgMonthlySearches: "50" } },
    ],
  });
  assert.deepEqual(ideas, [
    { phrase: "создание сайтов", value: 1300, competition: "MEDIUM" },
    { phrase: "сайт под ключ", value: 90, competition: "HIGH" },
  ]);
});

test("запрос к Google: адрес, заголовки и разбор; ошибка — словами, без исключений", async () => {
  let called = "";
  let sentHeaders: Record<string, string> = {};
  const ok = await keywordIdeas(creds, "создание сайтов", GEO.UZ, async (url, init) => {
    called = url;
    sentHeaders = init.headers as Record<string, string>;
    return new Response(JSON.stringify({ results: [{ text: "создание сайтов ташкент", keywordIdeaMetrics: { avgMonthlySearches: "320" } }] }), { status: 200 });
  });
  assert.match(called, /\/customers\/1234567890:generateKeywordIdeas$/);
  assert.equal(sentHeaders.Authorization, "Bearer token");
  assert.deepEqual(ok, { ok: true, phrases: [{ phrase: "создание сайтов ташкент", value: 320 }] });

  const denied = await keywordIdeas(creds, "x", GEO.UZ, async () =>
    new Response(JSON.stringify({ error: { message: "The caller does not have permission", details: [{ errors: [{ message: "CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION" }] }] } }), { status: 403 }),
  );
  assert.equal(denied.ok, false);
  assert.match(!denied.ok ? denied.reason : "", /уровень доступа Basic/);

  const broken = await keywordIdeas(creds, "x", GEO.UZ, async () => {
    throw new Error("socket hang up");
  });
  assert.equal(broken.ok, false);
  assert.deepEqual(await keywordIdeas({ ...creds, customerId: "12345" }, "x", GEO.UZ), { ok: false, reason: "номер кабинета Google Ads — 10 цифр" });
});

test("причины словами: уровень доступа, отозванный вход, чужой кабинет", () => {
  assert.match(plannerReason("DEVELOPER_TOKEN_NOT_APPROVED"), /Basic/);
  assert.match(plannerReason("invalid_grant"), /подключите кабинет заново/);
  assert.match(plannerReason("USER_PERMISSION_DENIED"), /нет доступа к кабинету/);
});

test("статьи: планировщик третьим источником и первым в сопутствующих; не подключён — статья идёт дальше", () => {
  const source = read("lib/seo/keywords.ts");
  assert.match(source, /region\.geo \? plannerIdeas\(query, region\.geo\)/);
  assert.match(source, /mergeRelated\(query, planner, wordstat, trends\)/);
  const store = read("lib/seo/keyword-planner-store.ts");
  assert.match(store, /if \(!account\) return \{ ok: false, reason: "планировщик Google Ads не подключён" \};/);
  // Вход — тот же, что у автопилота рекламы, без второго подключения.
  assert.match(store, /googleCredsFor\(account\)/);
  assert.match(read("lib/ads/store.ts"), /export async function googleCredsFor\(account: Account\)/);
});

test("ключи приложения Google: только владелец, неверное не пишется, наружу — только «задано» или «пусто»", () => {
  assert.deepEqual(googleKeysToSave("123-abc.apps.googleusercontent.com", "GOCSPX-aaaaaaaaaaaaaaaaaaaaaaaa"), {
    GOOGLE_ADS_CLIENT_ID: "123-abc.apps.googleusercontent.com",
    GOOGLE_ADS_CLIENT_SECRET: "GOCSPX-aaaaaaaaaaaaaaaaaaaaaaaa",
  });
  assert.deepEqual(googleKeysToSave(" 123-abc.apps.googleusercontent.com ", ""), { GOOGLE_ADS_CLIENT_ID: "123-abc.apps.googleusercontent.com" });
  assert.equal(googleKeysToSave("", ""), null);
  assert.equal(googleKeysToSave("not-a-client-id", ""), null);
  assert.equal(googleKeysToSave("123-abc.apps.googleusercontent.com", "short"), null, "одно неверное — не пишем ничего");

  const actions = read("app/admin/ads/google-actions.ts");
  assert.match(actions, /if \(staff\.role !== "admin"\) back\("forbidden"\);/);
  assert.match(actions, /meta: \{ names: Object\.keys\(keys\) \}/, "в журнал — имена, не значения");
  const view = read("components/admin/ads-google.tsx");
  assert.match(view, /chip\(Boolean\(id\)\)/);
  assert.match(view, /chip\(Boolean\(secret\)\)/);
  assert.doesNotMatch(view, /defaultValue=\{id\}|value=\{secret\}/);
  assert.match(read("app/admin/ads/page.tsx"), /<AdsGoogle staff=\{staff\} locale=\{staff\.panel_locale\} result=\{g\} \/>/);
});
