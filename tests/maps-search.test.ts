/**
 * Автопоиск компаний по картам.
 *
 * Владелец: «автоматизировать новый блок и способ генерации лидов». Ниша и
 * город → Google Maps → проверка сайта → пул касаний → порция дня.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { EMPTY_CONTACTS } from "@/lib/audit/contacts";
import { dailyCap, placesFrom, queriesFor, searchPlaces, siteOf } from "@/lib/maps/places";
import { withMapsPhone } from "@/lib/maps/store";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");
const realFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.GOOGLE_PLACES_API_KEY;
  delete process.env.MAPS_DAILY_REQUESTS;
});

test("для Ташкента поиск идёт и по районам", () => {
  const q = queriesFor("стоматология", "Ташкент");
  assert.equal(q[0], "стоматология Ташкент");
  assert.ok(q.length > 10, "районов нет");
  assert.ok(q.some((x) => x.includes("Юнусабадский район")));
  assert.deepEqual(queriesFor("кафе", "Самарканд"), ["кафе Самарканд"]);
});

test("соцсеть в поле «сайт» — это компания без сайта", () => {
  assert.equal(siteOf("https://www.instagram.com/dental.uz/"), null);
  assert.equal(siteOf("https://t.me/dental"), null);
  assert.equal(siteOf("https://taplink.cc/dental"), null);
  assert.equal(siteOf("https://www.dental.uz/"), "https://www.dental.uz");
  assert.equal(siteOf("https://dental.uz/ru"), "https://dental.uz/ru");
  assert.equal(siteOf("ftp://x.uz"), null);
  assert.equal(siteOf(undefined), null);
});

test("выдача карт: закрытые — мимо, телефон — в нашем формате", () => {
  const places = placesFrom({
    places: [
      {
        id: "a",
        displayName: { text: "Дентал Плюс" },
        websiteUri: "https://dentalplus.uz/",
        internationalPhoneNumber: "+998 90 123-45-67",
        businessStatus: "OPERATIONAL",
      },
      { id: "b", displayName: { text: "Закрылись" }, businessStatus: "CLOSED_PERMANENTLY" },
      { id: "c", displayName: { text: "Без сайта" }, nationalPhoneNumber: "71 200-00-00" },
      { displayName: { text: "Без id" } },
    ],
  });
  assert.deepEqual(places.map((p) => p.placeId), ["a", "c"]);
  assert.equal(places[0].phone, "+998901234567");
  assert.equal(places[0].website, "https://dentalplus.uz");
  assert.equal(places[1].website, null);
});

test("запрос к Places API: ключ, маска полей со страницами, регион", async () => {
  process.env.GOOGLE_PLACES_API_KEY = "maps-key";
  let seen: { url: string; init?: RequestInit } | null = null;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    seen = { url: String(input), init };
    return new Response(JSON.stringify({ places: [{ id: "x", displayName: { text: "X" } }], nextPageToken: "t2" }), {
      status: 200,
    });
  }) as typeof fetch;

  const page = await searchPlaces("стоматология Ташкент", "t1");
  assert.equal(page.nextPageToken, "t2");
  assert.equal(page.places.length, 1);
  assert.ok(seen);
  const { url, init } = seen as { url: string; init: RequestInit };
  assert.equal(url, "https://places.googleapis.com/v1/places:searchText");
  const headers = init.headers as Record<string, string>;
  assert.equal(headers["X-Goog-Api-Key"], "maps-key");
  assert.match(headers["X-Goog-FieldMask"], /places\.websiteUri/);
  assert.match(headers["X-Goog-FieldMask"], /nextPageToken/, "без этого поля вторая страница не придёт");
  const body = JSON.parse(String(init.body));
  assert.equal(body.regionCode, "UZ");
  assert.equal(body.pageToken, "t1");
});

test("потолок запросов в день — внутри бесплатной тысячи", () => {
  assert.equal(dailyCap(), 25);
  assert.ok(dailyCap() * 31 < 1000);
  process.env.MAPS_DAILY_REQUESTS = "10";
  assert.equal(dailyCap(), 10);
  process.env.MAPS_DAILY_REQUESTS = "0";
  assert.equal(dailyCap(), 25, "опечатка не отключает потолок");
});

test("телефон с карт дописывается к контактам сайта, без дублей", () => {
  const withPhone = withMapsPhone({ ...EMPTY_CONTACTS, phones: ["+998711234567"] }, "+998901112233");
  assert.deepEqual(withPhone.phones, ["+998711234567", "+998901112233"]);
  const same = withMapsPhone({ ...EMPTY_CONTACTS, whatsapp: ["+998901112233"] }, "+998901112233");
  assert.deepEqual(same.phones, []);
  assert.deepEqual(withMapsPhone(EMPTY_CONTACTS, null), EMPTY_CONTACTS);
});

test("поиск — утром и в пределах лимита, проверка — в фоне", () => {
  const store = read("lib/maps/store.ts");
  assert.match(store, /tashkentHour\(now\) < SEARCH_HOUR/);
  assert.match(store, /if \(!\(await spendRequest\(now\)\)\) break;/);
  assert.match(store, /return Number\(data\) <= dailyCap\(\)/);
  // Одно место не проверяется дважды.
  assert.match(store, /update\(\{ processed_at: now\.toISOString\(\) \}\)[\s\S]{0,80}\.is\("processed_at", null\)/);
  const sweep = read("app/api/reminders/sweep/route.ts");
  assert.match(sweep, /await runDailySearches\(new Date\(\)\)/);
  assert.match(sweep, /await processPlaces\(new Date\(\)\)/);
  assert.match(read("supabase/migrations/0050_maps_search.sql"), /revoke all on function public\.bump_maps_usage/);
});

test("кампании заводят владелец и руководитель", () => {
  const actions = read("app/admin/prospect/actions.ts");
  for (const name of ["createMapsCampaignAction", "toggleMapsCampaignAction", "runMapsCampaignAction"]) {
    const at = actions.indexOf(`export async function ${name}(`);
    assert.ok(at > 0, `${name} пропало`);
    assert.match(actions.slice(at, at + 200), /requireRole\("admin", "head"\)/);
  }
  assert.match(read("docker-compose.yml"), /GOOGLE_PLACES_API_KEY: \$\{GOOGLE_PLACES_API_KEY:-\}/);
});

test("уникальность домена — без условия: иначе upsert по host падает", () => {
  // 0043 сделала индекс частичным, и ON CONFLICT (host) перестал его
  // находить — сохранение прогона касаний молча падало бы.
  const sql = read("supabase/migrations/0051_prospects_host_index.sql");
  const create = sql.slice(sql.indexOf("create unique index"));
  assert.match(create, /on public\.prospects \(host\);/);
  assert.ok(!/create unique index[^;]*where/.test(sql), "индекс снова частичный");
  assert.match(read("lib/admin/outreach-store.ts"), /onConflict: "host"/);
});

/**
 * Ключ Places — из .env, а без него — из хранилища секретов Supabase.
 *
 * 23 сентября владелец прислал ключ и попросил подключить самому, а доступа
 * к серверу у сессии, которая ведёт код, нет. Ключ лёг в Vault; .env при
 * этом важнее — поменять ключ на сервере можно, не трогая базу.
 */
test("ключ Places: .env важнее хранилища, без обоих — не подключено", async () => {
  const { appSecret, forgetSecrets } = await import("@/lib/secrets");
  const { placesConfigured } = await import("@/lib/maps/places");
  forgetSecrets();
  process.env.GOOGLE_PLACES_API_KEY = "from-env";
  assert.equal(await appSecret("GOOGLE_PLACES_API_KEY"), "from-env");
  assert.equal(await placesConfigured(), true);
  delete process.env.GOOGLE_PLACES_API_KEY;
  forgetSecrets();
  // В тестах базы нет — значит и ключа нет, и автопоиск честно «не подключён».
  assert.equal(await placesConfigured(), false);

  const migration = read("supabase/migrations/0055_app_secrets.sql");
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = ''/);
  assert.match(migration, /p_name like 'app\.%'/, "функция отдаёт любые секреты Vault");
  assert.match(migration, /revoke all on function public\.app_secret\(text\) from public, anon, authenticated;/);
  assert.match(migration, /grant execute on function public\.app_secret\(text\) to service_role;/);
  assert.doesNotMatch(migration, /AIza/, "ключ попал в миграцию");
});
