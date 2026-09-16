import assert from "node:assert/strict";
import { test } from "node:test";

import { optionsFor } from "@/content/calculator";
import { USD_RATE } from "@/content/company";
import {
  belowFloor,
  briefQuote,
  categoryForLead,
  ceilingUsdOf,
  floorUsdOf,
  parseQuote,
  quoteFor,
  quoteForLead,
  selectionForLead,
  selectionFromForm,
  weeksFromForm,
} from "@/lib/admin/quote";
import type { Brief } from "@/lib/qualify/brief";

const lead = (services: string[], request: string, niche: string | null = null) => ({
  services,
  niche,
  summary: { request },
});

test("категория: услуга задаёт семейство, слова брифа уточняют тип сайта", () => {
  assert.equal(categoryForLead(lead(["web-development"], "нужен интернет-магазин с корзиной")), "ecommerce");
  assert.equal(categoryForLead(lead(["web-development"], "лендинг под запуск курса")), "landing");
  assert.equal(categoryForLead(lead(["web-development"], "сайт клиники", "стоматология")), "corporate");
  assert.equal(categoryForLead(lead(["web-development"], "портал с личным кабинетом")), "platform");
  // «Веб-приложение» — это сайт. Семейство сайтов не перехватывается
  // словом «приложение», иначе половина корпоративных сайтов стала бы
  // мобильными проектами с ценой втрое выше.
  assert.equal(categoryForLead(lead(["web-development"], "веб-приложение для сотрудников")), "corporate");
  assert.equal(categoryForLead(lead(["mobile-apps"], "веб-приложение")), "mobile");
  assert.equal(categoryForLead(lead(["ai-llm-rag"], "сайт")), "ai");
  assert.equal(categoryForLead(lead([], "нужен чат-бот для поддержки")), "ai");
  assert.equal(categoryForLead(lead([], "")), "corporate");
});

test("допы из брифа — только сказанное прямо", () => {
  const text = lead(["web-development"], "магазин на русском, узбекском и английском, с онлайн-оплатой Payme");
  const shop = selectionForLead("ecommerce", text);
  assert.equal(shop.languages, 2, "три языка — два сверх основного");
  assert.equal(shop.payments, true);
  assert.equal(shop.auth, false, "кабинет не просили — угадывать нельзя");

  // Лендингу оплата не полагается — опция к нему не применяется, и в
  // выборе её нет вовсе, а не false.
  const page = selectionForLead("landing", text);
  assert.equal(page.languages, 2);
  assert.ok(!("payments" in page));

  const one = selectionForLead("landing", lead([], "сайт на узбекском"));
  assert.equal(one.languages, 0, "один язык — основной, доплаты нет");
});

test("вилка лендинга: порог вверх до десяти долларов, потолок как на сайте", () => {
  const q = quoteFor({ category: "landing", selection: {}, weeks: null });
  assert.ok(q);
  // 4 200 000 сум / 11 850 = 354.4 → вверх до 360; потолок 5 880 000 → 496 → 500.
  assert.equal(q.floorUsd, 360);
  assert.equal(q.ceilingUsd, 500);
  assert.equal(q.weeksLow, 2);
  assert.equal(q.weeksHigh, 3);
  assert.equal(q.rush, false);
  assert.ok(q.floorUsd * USD_RATE >= q.floorUzs, "порог в долларах ниже порога в сумах");
  assert.ok(q.ceilingUsd >= q.floorUsd);
  assert.ok(q.work.length >= 3, "состав работ пуст");
  assert.match(q.talk.join("\n"), /\$360–\$500/);
  assert.match(q.talk.join("\n"), /Ниже \$360 не опускаемся/);
});

test("порог никогда не оказывается ниже суммы в сумах", () => {
  for (const uzs of [1, 11_849, 11_850, 11_851, 4_200_000, 4_205_000, 95_000_000, 123_456_789]) {
    assert.ok(floorUsdOf(uzs) * USD_RATE >= uzs, `порог для ${uzs} ушёл вниз`);
    assert.equal(floorUsdOf(uzs) % 10, 0);
    assert.equal(ceilingUsdOf(uzs) % 50, 0);
  }
});

test("обещанный срок короче расчётного включает ускорение и поднимает порог", () => {
  const calm = quoteFor({ category: "landing", selection: {}, weeks: 2 });
  assert.ok(calm && !calm.rush);
  assert.equal(calm.floorUsd, 360);
  assert.match(calm.talk[1], /2 недели/);

  const fast = quoteFor({ category: "landing", selection: {}, weeks: 1 });
  assert.ok(fast && fast.rush);
  // 4 200 000 × 1.3 = 5 460 000 / 11 850 = 460.8 → 470.
  assert.equal(fast.floorUsd, 470);
  assert.match(fast.talk[1], /1 неделя/);
  assert.match(fast.talk[1], /\+30%/);
  assert.equal(fast.promisedWeeks, 1);

  // Ускорение уже выбрано руками — второй раз не применяется и не
  // объявляется как новость.
  const already = quoteFor({ category: "landing", selection: { urgency: "rush" }, weeks: 1 });
  assert.ok(already && !already.rush);
  assert.equal(already.floorUsd, 470);
});

test("склонение недель в подсказке", () => {
  const talk = (weeks: number) => quoteFor({ category: "platform", selection: {}, weeks })!.talk[1];
  assert.match(talk(21), /21 неделя/);
  assert.match(talk(22), /22 недели/);
  assert.match(talk(25), /25 недель/);
  assert.match(talk(11), /11 недель/);
});

test("что предложить: невыбранные допы с ценой, выбранные — нет", () => {
  const q = quoteFor({ category: "landing", selection: { seo: true }, weeks: null });
  assert.ok(q);
  const ids = q.extras.map((e) => e.id);
  assert.ok(!ids.includes("seo"), "выбранный доп предлагать не надо");
  assert.ok(ids.includes("content_fill"));
  const fill = q.extras.find((e) => e.id === "content_fill")!;
  // 3 800 000 / 11 850 = 320.7 → 330.
  assert.equal(fill.price, "+$330");
  const languages = q.extras.find((e) => e.id === "languages")!;
  assert.match(languages.price, /12% за/);
  assert.ok(ids.includes("design_level:premium"), "уровни дизайна выше текущего — это тоже допы");
  assert.ok(!ids.includes("design_level:template"), "текущий уровень — не доп");
  assert.equal(q.breakdown.length, 1, "выбранный доп виден в составе");
});

test("сумма ниже порога — только с порогом", () => {
  const q = quoteFor({ category: "landing", selection: {}, weeks: null });
  assert.equal(belowFloor(350, q), true);
  assert.equal(belowFloor(360, q), false);
  assert.equal(belowFloor(null, q), false);
  assert.equal(belowFloor(undefined, q), false);
  assert.equal(belowFloor(1, null), false);
});

test("хранимая смета разбирается терпимо: мусор — null, а не падение", () => {
  assert.equal(parseQuote(null), null);
  assert.equal(parseQuote("landing"), null);
  assert.equal(parseQuote({ category: "nope" }), null);
  const q = parseQuote({ category: "landing", selection: { seo: true, junk: {} }, weeks: 3.6 });
  assert.deepEqual(q, { category: "landing", selection: { seo: true }, weeks: 4 });
  assert.equal(parseQuote({ category: "landing", weeks: "3" })!.weeks, null);
  assert.equal(parseQuote({ category: "landing", weeks: 0 })!.weeks, null);
});

test("форма: галочки, выбор, счётчик в границах опции", () => {
  const pages = optionsFor("landing").find((o) => o.id === "pages");
  assert.ok(pages && pages.kind === "counter");
  const form: Record<string, string> = {
    opt_seo: "on",
    opt_pages: String(pages.max + 100),
    opt_design_level: "premium",
    opt_urgency: "bogus",
  };
  const s = selectionFromForm("landing", (name) => form[name] ?? null);
  assert.equal(s.seo, true);
  assert.equal(s.content_fill, false);
  assert.equal(s.pages, pages.max, "счётчик выше max не режется");
  assert.equal(s.design_level, "premium");
  assert.equal(s.urgency, "normal", "чужое значение выбора — первое, а не как есть");

  assert.equal(weeksFromForm("3"), 3);
  assert.equal(weeksFromForm("0"), null);
  assert.equal(weeksFromForm("60"), null);
  assert.equal(weeksFromForm("abc"), null);
  assert.equal(weeksFromForm(null), null);
});

const brief: Brief = {
  project: "mavera",
  projectLabel: "MAVERA — сайт застройщика",
  tier: { id: "std", label: "Стандарт", priceUsd: 1000 },
  addons: [
    { id: "map", label: "Карта объектов", priceUsd: 200, included: false },
    { id: "form", label: "Форма заявки", priceUsd: 0, included: true },
    { id: "care", label: "Поддержка", priceUsd: 50, included: false, monthly: true },
    { id: "crm", label: "Интеграция с CRM", priceUsd: 0, included: false, onRequest: true },
  ],
  totalUsd: 1200,
  monthlyUsd: 50,
};

test("бриф с витрины: порог равен итогу, потолок тоже — цифра уже названа", () => {
  const q = briefQuote(brief);
  assert.equal(q.kind, "brief");
  assert.equal(q.floorUsd, 1200);
  assert.equal(q.ceilingUsd, 1200);
  assert.equal(q.weeksLow, null);
  assert.deepEqual(
    q.breakdown.map((l) => l.value),
    ["$1,000", "$200"],
  );
  assert.ok(q.work.includes("Форма заявки"), "входящее в пакет — в составе, а не в допах");
  assert.deepEqual(q.extras.map((e) => e.id), ["crm", "care"]);
  assert.match(q.extras[1].price, /\$50\/мес/);
  assert.match(q.talk[0], /\$1,200/);
});

test("смета по лиду: с брифом — по брифу, без — по калькулятору", () => {
  assert.equal(quoteForLead({ ...lead(["web-development"], "магазин"), brief })!.kind, "brief");
  const calc = quoteForLead({ ...lead(["web-development"], "магазин"), brief: null })!;
  assert.equal(calc.kind, "calculator");
  assert.equal(calc.category, "ecommerce");
});

/* ── Порог держится в хранилище, а не в интерфейсе ─────────────────────── */

import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("сумму ниже порога не принимают ни «Деньги», ни договор — кроме владельца", () => {
  const ledger = read("lib/admin/ledger.ts");
  // Проверка стоит после прав и до записи: менеджер получает словесный
  // отказ, а не молча сохранённую сумму.
  assert.match(ledger, /staff\.role !== "admin" && fields\.amountUsd !== undefined/);
  assert.match(ledger, /if \(belowFloor\(fields\.amountUsd, quote\)\) return fail\("below_floor"\)/);
  assert.match(ledger, /"below_floor"/, "причина отказа не заведена в MoneyResult");

  const contracts = read("lib/admin/contract-store.ts");
  assert.match(contracts, /if \(staff\.role !== "admin"\) \{[\s\S]*belowFloor\(fields\.amountUsd, quote\)/);
  assert.match(contracts, /сумма ниже порога сметы/);

  const page = read("app/admin/projects/[id]/page.tsx");
  assert.match(page, /below_floor: \{/, "у отказа нет текста на странице");
});

test("бриф с витрины ложится на лид структурой, и карточка его читает", () => {
  assert.match(read("app/api/brief/route.ts"), /saveLead\(lead, \[\], "showcase", \{ requestNo, brief \}\)/);
  assert.match(read("lib/qualify/store.ts"), /brief: meta\.brief \?\? null/);
  assert.match(read("lib/admin/leads.ts"), /"brief",\n\]\.join/);
  assert.match(read("app/admin/leads/[id]/page.tsx"), /quoteForLead\(lead\)/);
  assert.match(read("app/admin/projects/[id]/page.tsx"), /quoteFor\(quoteInput\)/);
});
