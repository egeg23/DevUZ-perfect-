import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { tenderVerdict } from "@/lib/scout/tender-match";
import { HAYOT_ON, currencyOf, parseEtender, parseHayot, tashkentIso, xaridAuction, xaridCompetition } from "@/lib/scout/tender-sources";
import { SCAN_EVERY_MS, scanDue, tenderNotice } from "@/lib/scout/tender-store";

// Владелец, 10.11.2026: «Делаем Парсинг тендеров. Это еще одна функция скаута».

test("тендеры: наше — тема и работа, не железо и не лицензии", () => {
  const ours = [
    "Разработка веб-сайта для хокимията",
    "Услуги по созданию мобильного приложения",
    "Создание Telegram-бота для приёма обращений",
    "Rasmiy veb-saytni ishlab chiqish xizmati",
    "Axborot tizimini ishlab chiqish va joriy etish",
    "Дастурий таъминотни такомиллаштириш",
    "Техническая поддержка официального сайта",
    "Внедрение CRM системы",
    // Настоящие лоты etender, 10.11.2026.
    "CRM tizimi uchun TZ yozish xizmati",
    "Bank mobil ilovasida kartalararo pul o‘tkazmalari uchun (P2P) yuz orqali tasdiqlash tizimi",
    "Xalq banki tizimida yangi turdagi “Ish haqi oldindan” bank mahsulotini joriy qilish maqsadida raqamli platforma xarid qilish",
  ];
  const notOurs = [
    "Ноутбук для бухгалтерии",
    "Лицензия Microsoft Office",
    "Ботинки зимние мужские",
    "Картридж для принтера HP",
    "Компьютер в сборе",
    // «по» в «услуги по …» — не «ПО»: так в ленту попадали стирка белья и выставки.
    "Услуга по срочной стирке белья",
    "Услуга по организации художественных выставок",
    "Оказание услуг согласно приложению 1",
    "O‘zbekiston Respublikasi Vazirlar Mahkamasining qarorining 1,2 hamda 3-ilovalarida keltirilgan obyektlar qurilishi",
  ];
  for (const title of ours) assert.equal(tenderVerdict(title).ours, true, title);
  for (const title of notOurs) assert.equal(tenderVerdict(title).ours, false, title);
});

test("тендеры: IT-категория площадки — без темы, но без перепродажи", () => {
  assert.equal(tenderVerdict("\"Тоза макон\" биллинг тизимини техник қўллаб-қувватлаш", "", true).ours, true);
  for (const resale of [
    "Kerio Control va Kerio Connect lisenziyalari muddatini uzaytirish",
    "Ijrochining ma’lumotlar markazida “Sovuq zahira” rejimida virtual serverlar taqdim etish xizmati",
    "Bulutli infratuzilmani (IaaS) taqdim etish xizmatlar",
    "Антивирусное программное обеспечение",
    "Kiber tahdidlarni aniqlash dasturiy ta’minotini yetkazib berish bo‘yicha",
  ]) {
    assert.equal(tenderVerdict(resale, "", true).ours, false, resale);
  }
});

test("тендеры: время площадки — Ташкент, дата без времени — конец дня", () => {
  assert.equal(tashkentIso("2026-11-17T16:13:35"), "2026-11-17T11:13:35.000Z");
  assert.equal(tashkentIso("2026-11-12"), "2026-11-12T18:59:00.000Z");
  assert.equal(tashkentIso("2026-11-17T06:18:45Z"), "2026-11-17T06:18:45.000Z");
  assert.equal(tashkentIso("None"), null);
  assert.equal(currencyOf("Сум"), "UZS");
  assert.equal(currencyOf("Узбекский сум"), "UZS");
  assert.equal(currencyOf("USD"), "USD");
});

test("тендеры: etender — строка списка в лот, чужое мимо", () => {
  const rows = [
    { id: 523525, total_count: 528, name: "CRM tizimi uchun TZ yozish xizmati", start_date: "2026-11-10T16:13:35", end_date: "2026-11-17T16:13:35", cost: 1700000000, seller_name: "\"UZAUTO MOTORS\" AJ", region_name: "Город Ташкент", currency_codeabc: "UZS", type_id: 1 },
    { id: 1, total_count: 528, name: "Лом отходы", type_id: 2 },
  ];
  const { lots, total } = parseEtender(rows);
  assert.equal(total, 528);
  assert.equal(lots.length, 1);
  assert.deepEqual(
    { url: lots[0].url, kind: lots[0].kind, price: lots[0].price, deadline: lots[0].deadline, customer: lots[0].customer },
    { url: "https://etender.uzex.uz/lot/523525", kind: "Отбор", price: 1700000000, deadline: "2026-11-17T11:13:35.000Z", customer: "\"UZAUTO MOTORS\" AJ" },
  );
});

test("тендеры: Hayot Birja — смотрит позиции лота и код классификатора", () => {
  const lots = parseHayot([
    { id: 9, name: "ПГЗ из Агенства №1", type: "selection", totalcost: 5000, currency: "UZS", close_at: "2026-11-20", company_name: "X", meta: { good_maps: [{ id: "62.01.11.000_00001", name: "Услуга по разработке программного обеспечения" }], area_path: ["Ташкент"] } },
    { id: 10, name: "Лом отходы", type: "request_proposals", meta: { good_maps: [{ id: "38.32.22.121_00001", name: "Лом чугунный" }] } },
  ]);
  assert.equal(lots.length, 1);
  assert.equal(lots[0].url, "https://xt-xarid.uz/procedure/9/core");
  assert.match(lots[0].title, /разработке программного обеспечения/);
  // robots.txt площадки закрывает /rpc/ — включаем только по слову владельца.
  assert.equal(HAYOT_ON, false);
});

test("тендеры: xarid — конкурс с прошедшим сроком мимо, аукцион ПО — наш", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  const row = { id: 24692, end_date_submitting_offers: "2026-10-08T13:00:00", category_name: "Продукты программные и услуги по разработке программного обеспечения", cost: 1 };
  assert.equal(xaridCompetition(row, { competition_description: "Разработка сайта" }, now), null);
  const open = xaridCompetition({ ...row, end_date_submitting_offers: "2026-11-20T18:00:00" }, { competition_description: "Разработка официального сайта", customer_name: "Хокимият" }, now);
  assert.equal(open?.url, "https://xarid.uzex.uz/purchase/competition/detail/24692");
  const auction = xaridAuction(
    { id: 423103, end_date: "2026-11-17T11:18:45", start_cost: 241080000, currency_name: "Сум", region_name: "Навоийская область", category_name: "Продукты программные и услуги по разработке программного обеспечения" },
    { customer_name: "Навоий Давлат Кончилик Институти", js_details: [{ product_name: "Программный продукт", description: "Программный продукт" }] },
  );
  assert.equal(auction?.title, "Программный продукт");
  assert.equal(auction?.currency, "UZS");
  assert.equal(auction?.url, "https://xarid.uzex.uz/auction/detail/423103");
});

test("тендеры: проход раз в 30 минут, строка в канал — со ссылкой на лот и сроком", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  assert.equal(scanDue(null, now), true);
  assert.equal(scanDue({ at: new Date(now.getTime() - SCAN_EVERY_MS + 60_000).toISOString(), sources: [], added: 0 }, now), false);
  assert.equal(scanDue({ at: new Date(now.getTime() - SCAN_EVERY_MS).toISOString(), sources: [], added: 0 }, now), true);
  const line = tenderNotice({ source: "etender", externalId: "523525", url: "https://etender.uzex.uz/lot/523525", title: "CRM tizimi uchun TZ <yozish>", customer: "UZAUTO", region: null, kind: "Отбор", price: 1700000000, currency: "UZS", publishedAt: null, deadline: "2026-11-17T11:13:35.000Z", topics: ["система"] });
  assert.match(line, /etender\.uzex\.uz/);
  assert.match(line, /1 700 000 000 UZS/);
  assert.match(line, /17\.11, 16:13/);
  assert.match(line, /&lt;yozish&gt;/, "название экранируется");
  assert.match(line, /https:\/\/etender\.uzex\.uz\/lot\/523525/);
});

test("тендеры: Tender.asia не читаем, раздел — по галочкам, проход — в свипе", () => {
  const sources = readFileSync("lib/scout/tender-sources.ts", "utf8");
  assert.doesNotMatch(sources, /tender\.asia\/api/, "соглашение Tender.asia (п. 3.9) запрещает парсинг");
  assert.match(readFileSync("app/admin/tenders/page.tsx", "utf8"), /requireSection\("\/admin\/tenders"\)/);
  assert.match(readFileSync("app/admin/tenders/actions.ts", "utf8"), /requireSection\("\/admin\/tenders"\)/);
  assert.match(readFileSync("app/api/reminders/sweep/route.ts", "utf8"), /runTenderScan\(/);
});
