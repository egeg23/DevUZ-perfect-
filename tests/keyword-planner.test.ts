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
import { REGION_BY_LOCALE, UZ_REGION, interleave, regionFor, whereFor, wordstatRequest } from "@/lib/seo/keywords";

const read = (p: string) => readFileSync(p, "utf8");
const creds = { customerId: "123-456-7890", developerToken: "", accessToken: async () => "token" };

test("запрос: страна всегда, русский язык — только у русской фразы", () => {
  const ru = ideasRequest("создание сайтов", GEO.UZ);
  assert.deepEqual(ru.geoTargetConstants, ["geoTargetConstants/2860"]);
  assert.equal(ru.language, "languageConstants/1031");
  assert.deepEqual(ru.keywordSeed, { keywords: ["создание сайтов"] });
  assert.equal(ru.keywordPlanNetwork, "GOOGLE_SEARCH");
  assert.equal(ideasRequest("sayt yaratish", GEO.UZ).language, undefined, "узбекская латиница — все языки");
  assert.deepEqual({ ...GEO }, { UZ: 2860, RU: 2643, KZ: 2398, BY: 2112, KG: 2417, US: 2840, GB: 2826, CA: 2124, PL: 2616, UA: 2804 });
  // Несколько стран — одним запросом, показы складываются.
  assert.deepEqual(ideasRequest("создание сайтов", [GEO.RU, GEO.KZ]).geoTargetConstants, ["geoTargetConstants/2643", "geoTargetConstants/2398"]);
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

test("страну, которую Google не принимает, убираем из набора — остальные спрашиваем", async () => {
  // 18.11.2026: русская сверка по России и СНГ разом — «invalid value» на всё.
  const asked: string[][] = [];
  const fake = async (_url: string, init: RequestInit) => {
    const geo = (JSON.parse(String(init.body)) as { geoTargetConstants: string[] }).geoTargetConstants;
    asked.push(geo);
    if (geo.includes(`geoTargetConstants/${GEO.RU}`)) {
      return new Response(JSON.stringify({ error: { message: "The input has an invalid value." } }), { status: 400 });
    }
    return new Response(JSON.stringify({ results: [{ text: "создание сайтов", keywordIdeaMetrics: { avgMonthlySearches: String(geo.length * 100) } }] }), { status: 200 });
  };
  const res = await keywordIdeas(creds, "создание сайтов", [GEO.RU, GEO.KZ, GEO.UZ], fake);
  assert.deepEqual(res, { ok: true, phrases: [{ phrase: "создание сайтов", value: 200 }] });
  assert.deepEqual(asked.at(-1), [`geoTargetConstants/${GEO.KZ}`, `geoTargetConstants/${GEO.UZ}`]);
  // Дальше Россию уже не спрашиваем — один запрос.
  asked.length = 0;
  await keywordIdeas(creds, "сайт", [GEO.RU, GEO.KZ], fake);
  assert.deepEqual(asked, [[`geoTargetConstants/${GEO.KZ}`]]);
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

test("ключи Google: шаги подключения — «Шаг N —» на трёх языках, без стрелок", async () => {
  const { adsGoogleDict } = await import("@/content/admin-panel/ads-google");
  const d = adsGoogleDict as unknown as Record<string, Record<string, unknown>>;
  for (const lang of ["ru", "uz", "pl"] as const) {
    for (const k of ["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8"]) {
      const text = String(d[k][lang]);
      assert.ok(text.length > 40, `${lang}/${k}: пусто`);
      assert.ok(!/[→>]/.test(text), `${lang}/${k}: стрелки вместо слов`);
    }
    const stepNo = d.stepNo[lang] as (n: number) => string;
    assert.match(stepNo(3), /3/);
  }
  assert.match(String(d.g6.ru), /Basic/, "уровень Basic назван");
  assert.match(String(d.g4.ru), /redirect/, "адрес возврата назван");
});

test("регион запросов — по языку версии: русская не только Узбекистан", () => {
  // Владелец, 18.11.2026: «универсальная адаптация СЕО как для Узбекистана,
  // так и для России и снг… статьи на разных языках должны затрагивать те
  // регионы, на языке которого написаны статьи».
  const ru = regionFor("ru");
  assert.deepEqual(ru.geo, [GEO.RU, GEO.KZ, GEO.BY, GEO.UZ, GEO.KG]);
  assert.deepEqual(ru.wordstat, [225, 159, 149, 171, 207]);
  assert.equal(ru.trends, "RU");
  assert.equal(ru.mixed, true);
  assert.equal(regionFor("uz"), UZ_REGION);
  assert.deepEqual(regionFor("en").geo, [GEO.US, GEO.GB, GEO.CA]);
  assert.deepEqual(regionFor("pl").geo, [GEO.PL]);
  assert.deepEqual(regionFor("uk").geo, [GEO.UA]);
  // Яндексом ищут только там, где он есть.
  for (const l of ["en", "pl", "uk", "zh"]) assert.equal(regionFor(l).wordstat, null, l);
  // Каждому языку сайта — свой регион и слова для модели; чужой язык — как русский.
  for (const l of ["ru", "uz", "en", "pl", "uk", "zh"]) {
    assert.ok(l in REGION_BY_LOCALE, l);
    assert.match(whereFor(l), /^(в|на) /, l);
  }
  assert.equal(regionFor("de"), REGION_BY_LOCALE.ru);
  // Вордстат — несколько регионов одним запросом.
  assert.deepEqual(JSON.parse(String(wordstatRequest("AQVNtest", "smm", [225, 171]).init.body)).regions, ["225", "171"]);
  assert.deepEqual(JSON.parse(String(wordstatRequest("y0_test", "smm", [225, 171]).init.body)).regions, [225, 171]);
  // Вперемежку: полсотни фраз планировщика не вытесняют Вордстат.
  const a = { ok: true as const, phrases: [{ phrase: "a1", value: 9 }, { phrase: "a2", value: 8 }] };
  const b = { ok: true as const, phrases: [{ phrase: "b1", value: 7 }] };
  assert.deepEqual(interleave(a, b), { ok: true, phrases: [a.phrases[0], b.phrases[0], a.phrases[1]] });
  assert.equal(interleave({ ok: false, reason: "x" }, b), b);
  assert.equal(interleave(a, { ok: false, reason: "x" }), a);
});

test("каждая статья сверяет запрос в регионе своего языка", () => {
  assert.match(read("lib/marketing/articles-run.ts"), /keywordResearch\(ruQuery, regionFor\("ru"\)\)/);
  assert.match(read("lib/marketing/articles-run.ts"), /keywordResearch\(uzQuery, regionFor\("uz"\)\)/);
  assert.match(read("lib/razbor/shift-run.ts"), /keywordResearch\(queryFor\(input\.niche, input\.city, input\.locale\), regionFor\(input\.locale\)\)/);
  assert.match(read("lib/razbor/tender-run.ts"), /keywordResearch\(topic\[locale\]\.query, regionFor\(locale\)\)/);
  assert.match(read("lib/razbor/foreign-run.ts"), /keywordResearch\(query, regionFor\(locale\)\)/);
  // Модели не говорят «в Узбекистане ищут» про русскую, английскую и польскую версии.
  for (const f of ["lib/marketing/articles-run.ts", "lib/razbor/shift-run.ts", "lib/razbor/tender-run.ts", "lib/razbor/foreign-run.ts"]) {
    assert.doesNotMatch(read(f), /С этим запросом в Узбекистане/, f);
    assert.match(read(f), /С этим запросом \$\{whereFor\(locale\)\} ищут ещё/, f);
  }
  // Русская статья о маркетинге — не только для Узбекистана.
  assert.match(read("lib/marketing/articles-run.ts"), /Русскую версию читают в России, Узбекистане, Казахстане и других странах СНГ/);
});
