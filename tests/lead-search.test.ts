import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { AUTOPILOT_NICHES } from "@/lib/admin/autopilot";
import {
  LOW_POOL,
  SEARCH_CITIES,
  SEARCH_COST,
  companySite,
  nextJob,
  nextQuery,
  nicheOfQuery,
  reachable,
  searchQueries,
} from "@/lib/admin/lead-search";
import { EMPTY_CONTACTS } from "@/lib/audit/contacts";
import { dailyAllowance } from "@/lib/firecrawl";

/**
 * Поиск лидов через Firecrawl. Владелец, 06.10.2026: «1000 запросов по
 * firecrawl бесплатно… Растяни на 30 дней равномерно… не останавливать
 * поиск, пока 20 сообщений не будут отправлены».
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const DAY = 24 * 3600_000;

test("лимит дня: остаток поровну на дни до конца периода", () => {
  const dayStart = Date.parse("2026-10-06T19:00:00Z"); // 07.10, 00:00 по Ташкенту
  const periodEnd = Date.parse("2026-11-06T13:03:27Z");
  // 1022 кредита на 31 неполный день — по 32 в день.
  assert.equal(dailyAllowance({ remaining: 1022, usedToday: 0, periodEnd, dayStart }), 32);
  // Потраченное сегодня в долю дня входит: 20 потрачено — лимит тот же.
  assert.equal(dailyAllowance({ remaining: 1002, usedToday: 20, periodEnd, dayStart }), 32);
  // Последний день — всё, что осталось.
  assert.equal(dailyAllowance({ remaining: 40, usedToday: 0, periodEnd: dayStart + DAY / 2, dayStart }), 40);
  // Период кончился, а ответ старый — не делим на ноль и не уходим в минус.
  assert.equal(dailyAllowance({ remaining: 10, usedToday: 0, periodEnd: dayStart - DAY, dayStart }), 10);
  assert.equal(dailyAllowance({ remaining: -5, usedToday: 0, periodEnd, dayStart }), 0);
  // За 30 дней по такому лимиту не выходим за остаток.
  let left = 1022;
  for (let d = 0; d < 31; d += 1) left -= dailyAllowance({ remaining: left, usedToday: 0, periodEnd, dayStart: dayStart + d * DAY });
  assert.ok(left >= 0, `перерасход: ${left}`);
});

test("на что тратить: мало годных — ищем новых, иначе дописываем контакты", () => {
  assert.equal(nextJob({ left: 0, reachable: 0, enrichable: 5 }), null, "лимит дня кончился");
  assert.equal(nextJob({ left: 10, reachable: LOW_POOL - 1, enrichable: 5 }), "search");
  assert.equal(nextJob({ left: 10, reachable: LOW_POOL, enrichable: 5 }), "contacts");
  assert.equal(nextJob({ left: 10, reachable: LOW_POOL, enrichable: 0 }), "search", "дописывать некому — лимит не пропадает");
  assert.equal(nextJob({ left: SEARCH_COST - 1, reachable: 0, enrichable: 0 }), null, "на поиск не хватает");
  assert.equal(nextJob({ left: 1, reachable: 0, enrichable: 3 }), "contacts");
});

test("запросы: ниша × город, Ташкент первым, по кругу — давно заданный следующим", () => {
  const all = searchQueries();
  assert.equal(all.length, AUTOPILOT_NICHES.length * SEARCH_CITIES.length);
  assert.equal(new Set(all).size, all.length);
  assert.equal(all[0], `${AUTOPILOT_NICHES[0].maps.toLowerCase()} Ташкент`);
  assert.equal(nextQuery(new Map()), all[0]);
  assert.equal(nextQuery(new Map([[all[0], 5]])), all[1], "незаданный — раньше заданного");
  const used = new Map(all.map((q, i) => [q, 1000 + i] as const));
  used.set(all[3], 1);
  assert.equal(nextQuery(used), all[3], "все заданы — самый давний");
  assert.equal(nicheOfQuery("стоматология Самарканд"), "стоматология");
  assert.equal(nicheOfQuery("что-то ещё"), null);
});

test("сайт компании: не соцсеть, не каталог, и в Узбекистане", () => {
  const r = (url: string, title = "", description = "") => companySite({ url, title, description });
  assert.equal(r("https://www.vedastom.uz/uslugi/implanty"), "https://www.vedastom.uz", "корень сайта");
  assert.equal(r("https://32top.uz/clinics"), null, "каталог клиник — не клиника");
  assert.equal(r("https://med24.uz/doctors/stomatolog"), null);
  assert.equal(r("https://samarkand.clinics.uz/catalog/medical-centers/stomatology"), null, "каталог на поддомене города");
  assert.equal(r("https://yandex.ru/maps/10334/samarkand/category/dental_clinic/"), null);
  assert.equal(r("https://www.akhtamov.uz/", "Akhtamov Dental Clinic"), "https://www.akhtamov.uz");
  assert.equal(r("https://www.instagram.com/sadaf_dentalclinic/"), null);
  assert.equal(r("https://my.gov.uz/ru"), null);
  assert.equal(r("https://clinic.ru/", "Стоматология в Москве", "Лечение зубов"), null, "чужая страна — мимо");
  assert.equal(r("https://smile-clinic.com/", "Стоматология в Ташкенте", ""), "https://smile-clinic.com", "не .uz, но Ташкент");
  assert.equal(r("mailto:a@b.uz"), null);
});

test("путь до Telegram: @адрес или мобильный, городской — нет", () => {
  assert.equal(reachable(EMPTY_CONTACTS), false);
  assert.equal(reachable({ ...EMPTY_CONTACTS, phones: ["+998712007400"] }), false, "городской — только звонок");
  assert.equal(reachable({ ...EMPTY_CONTACTS, phones: ["+998901234567"] }), true);
  assert.equal(reachable({ ...EMPTY_CONTACTS, telegram: ["clinic_uz"] }), true);
  assert.equal(reachable({ ...EMPTY_CONTACTS, telegram: ["clinic_bot"] }), false, "бот — не адресат");
});

test("ключ — из хранилища, не из кода; каждый вызов идёт через лимит и учёт", () => {
  const client = read("lib/firecrawl.ts");
  assert.match(client, /appSecret\("FIRECRAWL_API_KEY"\)/);
  assert.doesNotMatch(client, /fc-[0-9a-f]{20,}/, "ключа в коде нет");
  const store = read("lib/admin/lead-search-store.ts");
  assert.match(store, /dailyAllowance\(/, "лимит дня");
  assert.match(store, /CREDITS_PER_PASS/, "по чуть-чуть за проход, а не всё утром");
  assert.equal((store.match(/await record\(db,/g) ?? []).length >= 3, true, "каждый вызов записан в firecrawl_usage");
  const sql = read("supabase/migrations/0092_firecrawl_usage.sql");
  assert.match(sql, /firecrawl_usage enable row level security/);
});
