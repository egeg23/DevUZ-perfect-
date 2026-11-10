import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { tenderVerdict } from "@/lib/scout/tender-match";
import { cleanRu, needsRu, ruProblems, tenderRu } from "@/lib/scout/tender-ru";
import { PRICE_RULE, completeRow, leadFromTender, needsFill, servicesOfTopics, studioTender, tenderHeading, type TenderLeadRow } from "@/lib/scout/tender-lead";
import {
  HAYOT_ON,
  TENDERASIA_ON,
  currencyOf,
  emailOf,
  etenderContact,
  lotKeyOfUrl,
  mergeLots,
  parseEtender,
  parseHayot,
  parseTenderAsia,
  pickInnContact,
  personOf,
  phoneOf,
  tashkentIso,
  xaridAuction,
  xaridCompetition,
} from "@/lib/scout/tender-sources";
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

test("тендеры: только то, что делает студия — тема нужна и в IT-категории", () => {
  // Владелец, 10.11.2026: «Берем только сайты и все что делает наша студия».
  assert.equal(tenderVerdict("Mobil ilova ishlab chiqish xizmati", "", true).ours, true);
  assert.equal(tenderVerdict("Разработка информационной системы учёта обращений", "", true).ours, true);
  assert.equal(tenderVerdict("Разработка сайта и серверной части мобильного приложения", "", true).ours, true, "серверная часть — работа, не железо");
  assert.equal(tenderVerdict("“UMS” MChJ kompaniyasining korporativ ma’lumotlarni saqlash axborot tizimi va hisobotlarini avtomatlashtirish uchun tahliliy platformani xarid qilish", "", true).ours, true);
  for (const resale of [
    "\"Тоза макон\" биллинг тизимини техник қўллаб-қувватлаш",
    "Kiber tahdidlarni kengaytirilgan aniqlash va ularga javob berish dasturiy ta’minoti xizmati",
    "Сопровождение и доработка 1С: Бухгалтерия",
    "Внедрение системы видеонаблюдения на объекте",
    "Bank Protsessing markazidagi embosser qurilmalariga o‘rnatilgan dasturiy ta’minotni qo‘llab-quvvatlash",
    "Разработка сайта и продление лицензии антивируса",
    // Живые лоты etender, 10.11.2026.
    "Vazirlik markaziy apparatida ISO 9001 va ISO 37001 xalqaro standartlari boʻyicha boshqaruv tizimlarini ishlab chiqish, joriy etish va sertifikatlarini olishga tayyorlash uchun konsalting tashkiloti",
    "“Hududlarning investitsiyaviy jozibadorligi reytingi” axborot tizimi reglamentini takomillashtirish boʻyicha yirik xalqaro reyting agentligi konsalting xizmatini koʻrsatish",
    "Ko‘p o‘lchovli ma’lumotlarni tahlil qilish dasturiy ta’minoti uchun foydalanuvchi hujjatlarini sinovdan o‘tkazish, tasdiqlash va ishlab chiqish xizmatlarini ko‘rsatish",
    "Bankning asosiy vositalari va mulkini hisobga olish va nazorat qilish uchun RFID yorliq tizimi",
    "Ўзбекистон Республикаси Бош прокуратураси ҳузуридаги Мажбурий ижро бюроси учун сунъий интеллект сервери харид қилиш",
    "Поставка сервера для системы видеоаналитики",
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
  // Владелец, 10.11.2026: «Включай Hayot… Включаю все».
  assert.equal(HAYOT_ON, true);
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
  const line = tenderNotice({ source: "etender", externalId: "523525", url: "https://etender.uzex.uz/lot/523525", title: "CRM tizimi uchun TZ <yozish>", customer: "UZAUTO", region: null, kind: "Отбор", price: 1700000000, currency: "UZS", publishedAt: null, deadline: "2026-11-17T11:13:35.000Z", topics: ["система"], contact: { phone: "+998781417777", email: null, person: null, inn: null } });
  assert.match(line, /\+998781417777/);
  assert.ok(line.includes(PRICE_RULE), "условие про цену — и в канале");
  assert.match(line, /etender\.uzex\.uz/);
  assert.match(line, /1 700 000 000 UZS/);
  assert.match(line, /17\.11, 16:13/);
  assert.match(line, /&lt;yozish&gt;/, "название экранируется");
  assert.match(line, /https:\/\/etender\.uzex\.uz\/lot\/523525/);
});

test("тендеры: контакт заказчика — телефон +998, почта, ответственный", () => {
  assert.equal(phoneOf("781417777"), "+998781417777");
  assert.equal(phoneOf("+99879 223 24 01"), "+998792232401");
  assert.equal(phoneOf("+998781509339 (597)"), "+998781509339");
  assert.equal(phoneOf("998995907032"), "+998995907032");
  assert.equal(phoneOf("нет"), null);
  const organizer = "Bo'lim boshlig'i Tojiyev Abduqodir 781509339 xarid@example.uz";
  assert.equal(emailOf(organizer), "xarid@example.uz");
  assert.equal(personOf(organizer), "Bo'lim boshlig'i Tojiyev Abduqodir");
  assert.deepEqual(
    etenderContact({ delivering_phone: "781417777", contacts: '[{"Job_title":"Direktor","Fullname":"Ivanov I"}]', customer_tin: 200000001 }),
    { phone: "+998781417777", email: null, person: "Ivanov I, Direktor", inn: "200000001" },
  );
  const now = new Date("2026-11-10T12:00:00Z");
  const lot = xaridCompetition(
    { id: 7, end_date_submitting_offers: "2026-11-20T18:00:00", category_name: "Продукты программные и услуги по разработке программного обеспечения" },
    { competition_description: "Разработка официального сайта", customer_phone: "+998781509339 (597)", organizer_name: organizer, customer_inn: "206900001" },
    now,
  );
  assert.deepEqual(lot?.contact, { phone: "+998781509339", email: "xarid@example.uz", person: "Bo'lim boshlig'i Tojiyev Abduqodir", inn: "206900001" });
});

test("тендеры: Tender.asia — лот наших площадок под их ключом, контакт дописывается", () => {
  assert.deepEqual(lotKeyOfUrl("https://etender.uzex.uz/lot/523525"), { source: "etender", externalId: "523525" });
  assert.deepEqual(lotKeyOfUrl("https://xarid.uzex.uz/auction/detail/423103"), { source: "xarid", externalId: "a423103" });
  assert.deepEqual(lotKeyOfUrl("https://xt-xarid.uz/procedure/9450020/core"), { source: "hayot", externalId: "9450020" });
  assert.equal(lotKeyOfUrl("https://example.uz/x"), null);
  const now = new Date("2026-11-10T12:00:00Z");
  const [lot, other] = parseTenderAsia(
    [
      { id: "abc", name: "ПГЗ из Агенства №1", end_date: "2026-11-26T12:00:00Z", type: "Отбор", company: "Bank", company_inn: "312251994", contact_person: "Karimov A", phone: null, url: "https://xt-xarid.uz/procedure/9450020/core", lots: [{ name: "Разработка мобильного приложения", category_code: "62" }] },
      { id: "def", name: "Создание веб-сайта", end_date: "2026-11-20T12:00:00Z", phone: "998995907032", email: "Info@Example.uz", url: "https://mc.uz/t/1", lots: [] },
      { id: "old", name: "Создание сайта", end_date: "2026-11-01T12:00:00Z", url: "https://mc.uz/t/2" },
      { id: "no", name: "Мед натуральный", end_date: "2026-11-20T12:00:00Z", url: "https://mc.uz/t/3" },
    ],
    now,
  );
  assert.equal(lot.source, "hayot");
  assert.equal(lot.externalId, "9450020");
  assert.match(lot.title, /мобильного приложения/);
  assert.equal(other.source, "tenderasia");
  assert.deepEqual(other.contact, { phone: "+998995907032", email: "info@example.uz", person: null, inn: null });
  const merged = mergeLots([{ ...lot, contact: { phone: null, email: null, person: null, inn: "312251994" } }, { ...lot, contact: { phone: "+998712000000", email: null, person: "Karimov A", inn: null } }]);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].contact, { phone: "+998712000000", email: null, person: "Karimov A", inn: "312251994" });
});

test("тендеры: лид менеджеру — контакт, услуги и условие «сначала цена у Егора или Александра»", () => {
  const row: TenderLeadRow = {
    id: "00000000-0000-0000-0000-000000000001",
    created_at: "2026-11-10T12:00:00Z",
    source: "etender",
    url: "https://etender.uzex.uz/lot/523525",
    title: "Разработка мобильного приложения и сайта",
    customer: "Bank",
    region: "Ташкент",
    kind: "Отбор",
    price: 1700000000,
    currency: "UZS",
    deadline: "2026-11-17T11:13:35.000Z",
    topics: ["сайт", "приложение"],
    phone: "+998781417777",
    email: null,
    contact_person: "Ivanov I",
    customer_inn: "200000001",
  };
  const lead = leadFromTender(row);
  assert.equal(lead.contact_kind, "phone");
  assert.equal(lead.contact_handle, "+998781417777");
  assert.equal(lead.contact_name, "Ivanov I");
  assert.deepEqual(lead.services.sort(), ["mobile-apps", "web-development"]);
  assert.ok(lead.notes.split("\n")[0].includes(PRICE_RULE), "условие — первой строкой заметок");
  assert.match(PRICE_RULE, /Егором или Александром/);
  assert.match(tenderHeading(row), /Егором или Александром/);
  assert.match(tenderHeading(row), /17\.11, 16:13/);
  const noContact = leadFromTender({ ...row, phone: null, email: null, contact_person: null });
  assert.equal(noContact.contact_kind, "none");
  assert.equal(noContact.contact_handle, row.url);
  assert.deepEqual(servicesOfTopics(["бот", "ии"]), ["integrations-automation"]);
  // Лот, сохранённый до сужения отбора, лидом не становится.
  assert.equal(studioTender("Kerio Control lisenziyalari muddatini uzaytirish"), false);
  assert.equal(studioTender(row.title), true);
});

test("тендеры: все площадки включены, раздел — по галочкам, проход и лиды — в свипе", () => {
  assert.equal(TENDERASIA_ON, true);
  const sources = readFileSync("lib/scout/tender-sources.ts", "utf8");
  assert.match(sources, /jobs\.push\(readTenderAsia\(now\)\)/);
  assert.match(readFileSync("lib/scout/tender-store.ts", "utf8"), /promoteTenders/);
  assert.match(readFileSync("app/admin/tenders/page.tsx", "utf8"), /requireSection\("\/admin\/tenders"\)/);
  assert.match(readFileSync("app/admin/tenders/actions.ts", "utf8"), /requireSection\("\/admin\/tenders"\)/);
  assert.match(readFileSync("app/api/reminders/sweep/route.ts", "utf8"), /runTenderScan\(/);
});

test("тендеры: что хотят — коротко по-русски, без новых чисел", async () => {
  assert.equal(needsRu("CRM tizimi uchun TZ yozish xizmati"), true);
  assert.equal(needsRu("Дастурий таъминотни такомиллаштириш"), true);
  assert.equal(needsRu("Разработка официального сайта"), false);
  assert.equal(await tenderRu("Разработка официального сайта", async () => "не должно звать"), "Разработка официального сайта");
  assert.equal(await tenderRu("CRM tizimi uchun TZ yozish xizmati", async () => "«Написать техническое задание для CRM-системы»"), "Написать техническое задание для CRM-системы");
  assert.equal(await tenderRu("CRM tizimi uchun TZ yozish xizmati", async () => "Написать ТЗ для CRM за 30 дней"), null, "числа нет в названии");
  assert.equal(await tenderRu("CRM tizimi uchun TZ yozish xizmati", async () => null), null);
  assert.deepEqual(ruProblems("CRM tizimi", "CRM tizimi"), ["не по-русски"]);
  assert.equal(cleanRu("Сайт — для клиники"), "Сайт: для клиники");
});

test("тендеры: телефон по ИНН из других закупок заказчика, раздел открыт всем", () => {
  const rows = [
    { company_inn: "306350099", phone: "998939913223" },
    { company_inn: "200244767", phone: null, email: null },
    { company_inn: "200244767", phone: "+998781502200", contact_person: "Ivanov I" },
  ];
  assert.deepEqual(pickInnContact(rows, "200244767"), { phone: "+998781502200", email: null, person: "Ivanov I", inn: "200244767" });
  assert.equal(pickInnContact(rows, "111111111"), null);
  assert.match(readFileSync("lib/admin/roles.ts", "utf8"), /ALWAYS_OPEN[^\n]*"\/admin\/tenders"/);
  const lead = leadFromTender({
    id: "00000000-0000-0000-0000-000000000002", created_at: "2026-11-10T12:00:00Z", source: "hayot", url: "https://xt-xarid.uz/procedure/1/core",
    title: "Rasmiy veb-saytni ishlab chiqish", title_ru: "Разработать официальный сайт", customer: "X", region: null, kind: "Отбор", price: null, currency: null,
    deadline: null, topics: ["сайт"], phone: "+998781502200", email: null, contact_person: null, customer_inn: "200244767",
  });
  assert.match(lead.summary.request, /Разработать официальный сайт/);
  assert.match(lead.notes, /Название на площадке: Rasmiy veb-saytni/);
});

test("тендеры: лот без контакта и без русской фразы дочитывается перед лидом", async () => {
  const row: TenderLeadRow = {
    id: "00000000-0000-0000-0000-000000000003", created_at: "2026-11-10T12:00:00Z", source: "etender", external_id: "523525",
    url: "https://etender.uzex.uz/lot/523525", title: "CRM tizimi uchun TZ yozish xizmati", customer: "UZAUTO", region: null, kind: "Отбор",
    price: null, currency: null, deadline: null, topics: ["система"], phone: null, email: null, contact_person: null, customer_inn: "200244767",
  };
  const done = await completeRow(
    row,
    async (lot) => ({ ...lot, contact: { phone: "+998781417777", email: null, person: "Artamonov V", inn: lot.contact?.inn ?? null } }),
    async () => "Написать техзадание для CRM-системы",
  );
  assert.equal(done.row.phone, "+998781417777");
  assert.equal(done.row.customer_inn, "200244767");
  assert.equal(done.row.title_ru, "Написать техзадание для CRM-системы");
  assert.deepEqual(Object.keys(done.patch).sort(), ["contact_person", "customer_inn", "email", "phone", "title_ru"]);
  const same = await completeRow({ ...row, phone: "+998", title_ru: "есть" }, async () => { throw new Error("не звать"); }, async () => { throw new Error("не звать"); });
  assert.deepEqual(same.patch, {});
});

test("тендеры: взятым руками дочитываются контакт и русская фраза — по разу", () => {
  const now = new Date("2026-11-10T16:00:00Z");
  const row = {
    id: "00000000-0000-0000-0000-000000000004", created_at: "2026-11-10T12:00:00Z", source: "etender" as const, external_id: "523525",
    url: "https://etender.uzex.uz/lot/523525", title: "CRM tizimi uchun TZ yozish xizmati", customer: "UZAUTO", region: null, kind: "Отбор",
    price: null, currency: null, deadline: "2026-11-17T11:13:35Z", topics: ["система"], phone: null, email: null, contact_person: null, customer_inn: null,
    status: "taken",
  };
  assert.equal(needsFill(row, new Set(), now), true);
  assert.equal(needsFill({ ...row, status: "new" }, new Set(), now), false, "новые дочитывает лид");
  assert.equal(needsFill({ ...row, status: "skipped" }, new Set(), now), false);
  assert.equal(needsFill(row, new Set([row.id]), now), false, "второй раз не ходим");
  assert.equal(needsFill({ ...row, deadline: "2026-11-10T15:00:00Z" }, new Set(), now), false, "приём закрыт");
  assert.equal(needsFill({ ...row, phone: "+998781417777", title_ru: "Написать ТЗ для CRM" }, new Set(), now), false);
  assert.equal(needsFill({ ...row, phone: "+998781417777" }, new Set(), now), true, "нет русской фразы");
  assert.match(readFileSync("lib/scout/tender-store.ts", "utf8"), /fillTaken\(now\)/);
});
