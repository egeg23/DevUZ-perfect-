import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

import tailsFile from "@/content/proto-instant/tails.json" with { type: "json" };
import { buildInstant, normalizeSite } from "@/lib/proto/instant/build";
import { tailsIn } from "@/lib/proto/instant/check";
import { DENTAL_PHOTOS } from "@/lib/proto/instant/dental";
import { imageUrl } from "@/lib/proto/instant/safe";
import { emptySite, instantReady, type InstantSite } from "@/lib/proto/instant/types";
import { tails } from "../scripts/protos/instant/tails.mjs";
import { nekAssets } from "../scripts/protos/instant/nek-assets.mjs";
import assetsFile from "@/content/proto-instant/nek-assets.json" with { type: "json" };
import { EXAMPLE, EXAMPLE_MEBEL, EXAMPLE_MED, EXAMPLE_REST, EXAMPLE_TUR } from "../scripts/protos/instant/preview-data.mjs";
import { shoxAssets } from "../scripts/protos/instant/shox-assets.mjs";
import shoxFile from "@/content/proto-instant/shox-assets.json" with { type: "json" };
import { MEDCENTR_PHOTOS } from "@/lib/proto/instant/medcentr";
import { MEBEL_PHOTOS } from "@/lib/proto/instant/mebel";
import { RESTORAN_PHOTOS, priceNumber } from "@/lib/proto/instant/restoran";
import { agoraAssets } from "../scripts/protos/instant/agora-assets.mjs";
import { semtravelAssets } from "../scripts/protos/instant/semtravel-assets.mjs";
import semFile from "@/content/proto-instant/semtravel-assets.json" with { type: "json" };
import { TUR_PHOTOS, destsOf, usdPrice } from "@/lib/proto/instant/tur";
import agFile from "@/content/proto-instant/agora-assets.json" with { type: "json" };
import { vtashkenteAssets } from "../scripts/protos/instant/vtashkente-assets.mjs";
import vtFile from "@/content/proto-instant/vtashkente-assets.json" with { type: "json" };

/**
 * «Макет в боте» (CLAUDE.md): шаблон ниши из наших макетов, данные клиента —
 * экранированно, ни хвоста прошлого клиента, защита как у всех макетов.
 */

const example = EXAMPLE as InstantSite;
const SEED = "1".repeat(32);

test("макет в боте: пример выдуманной клиники собирается без замечаний", () => {
  const build = buildInstant(example, SEED);
  assert.deepEqual(build.problems, []);
  assert.ok(build.html.includes("Белая Лилия"));
  assert.ok(build.stamp.signals.length > 5, "отпечаток стоит");
});

test("макет в боте: защита — условия, видео DevUz, ловушки, метка числа", () => {
  const { html, stamp } = buildInstant(example, SEED);
  assert.ok(html.includes("/ru/mockup-terms"));
  assert.ok(html.includes('class="dz-vid"'));
  assert.ok(!/\[\[t:\d\]\]/.test(html), "ловушки заменены словами");
  assert.ok(!html.includes("/*~*/"), "метка числа снята");
  assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "два слова-ловушки, ru и lat");
  assert.ok(stamp.signals.some((s) => s.startsWith("js:")));
  assert.ok(html.includes('name="robots" content="noindex'));
  assert.doesNotMatch(html, /watermark|fingerprint/i);
  const other = buildInstant(example, "2".repeat(32));
  assert.notEqual(other.html, html, "отпечаток свой у каждого клиента");
});

test("макет в боте: узбекская страница — латиница, ловушки латиницей", () => {
  const { html, problems } = buildInstant({ ...example, locale: "uz", tagline: null, about: null }, SEED);
  assert.deepEqual(problems, []);
  assert.ok(html.includes('<html lang="uz"'));
  assert.ok(html.includes("/uz/mockup-terms"));
});

test("макет в боте: данные экранируются, чужие адреса выбрасываются", () => {
  const evil = {
    ...example,
    name: `<img src=x onerror=alert(1)>`,
    about: `"><script>alert(1)</script>`,
    logo: "javascript:alert(1)",
    photos: ["http://example.com/a.jpg", "https://ok.example/b.jpg"],
    services: [{ name: "<b>Чистка</b>", price: null }],
    telegram: "bad handle!",
  };
  const { html } = buildInstant(evil, SEED);
  assert.ok(!html.includes("<img src=x"));
  assert.ok(!html.includes("<script>alert"));
  assert.ok(!html.includes("javascript:"));
  assert.ok(!html.includes("http://example.com"));
  assert.ok(html.includes("https://ok.example/b.jpg"));
  assert.ok(html.includes("&lt;b&gt;Чистка"));
  assert.equal(imageUrl("data:image/svg+xml;base64," + Buffer.from("<svg onload=alert(1)>").toString("base64")), null);
});

test("макет в боте: пустое — без блока, цен не придумываем", () => {
  const site = { ...emptySite("stomatologiya", "ru", "Улыбка", "ответы в Telegram"), phone: "+998 90 111 22 33", services: [{ name: "Лечение", price: null }] };
  const { html, problems } = buildInstant(site, SEED);
  assert.deepEqual(problems, []);
  assert.ok(!html.includes('id="team"'), "врачей нет — блока нет");
  assert.ok(!html.includes('id="about"'));
  assert.ok(html.includes("Стоимость врач назовёт после осмотра"));
  assert.ok(!/\bсум\b/.test(html));
  assert.ok(html.includes(DENTAL_PHOTOS[0]), "своих фото нет — нейтральные фото ниши");
});

test("макет в боте: без названия или связи — не собирается", () => {
  const site = emptySite("stomatologiya", "ru", "", "x");
  const codes = buildInstant(site, SEED).problems.map((p) => p.code);
  assert.ok(codes.includes("missing:name"));
  assert.ok(codes.includes("missing:contact"));
});

test("макет в боте: хвост прошлого клиента — макет не отдаётся", () => {
  for (const tail of ["Nek Dental Studio", "Сияние Севера", "Реутов Евгений Александрович", "syanie-sewera.ru"]) {
    const build = buildInstant({ ...example, perks: [`Как в ${tail}`] }, SEED);
    // Своё имя клиента хвостом не считается — подставляем в чужое поле.
    assert.ok(build.problems.some((p) => p.code === "tail"), tail);
  }
  const phone = buildInstant({ ...example, about: "Звоните +7 382 227 00 77" }, SEED);
  assert.ok(phone.problems.some((p) => p.code === "tail"));
  assert.deepEqual(tailsIn(buildInstant(example, SEED).html), []);
});

test("макет в боте: список хвостов совпадает с data.mjs исходных макетов", () => {
  assert.deepEqual(tailsFile, tails(), "node scripts/protos/instant/tails.mjs");
  assert.ok(tailsFile.text.includes("Nek Dental Studio"));
  assert.ok(tailsFile.text.includes("Сияние Севера"));
});

test("макет в боте: числа и тире — только из данных клиента", () => {
  const dash = buildInstant({ ...example, about: "Лечим зубы — быстро" }, SEED);
  assert.ok(!dash.html.includes("—"), "тире из данных снимается");
  const numbers = buildInstant(example, SEED);
  assert.deepEqual(numbers.problems, []);
});

test("макет в боте: без сети, кроме шрифтов", () => {
  const { html } = buildInstant(example, SEED);
  assert.ok(!/<script[^>]+src=/i.test(html));
  assert.ok(!/<iframe/i.test(html));
  const links = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map((m) => new URL(m[1]).host);
  assert.ok(links.every((h) => h === "fonts.googleapis.com" || h === "fonts.gstatic.com"));
});

test("макет в боте: шаблоны — у стоматологии, медцентра, мебели и ресторана, фото ниши лежат в репозитории", () => {
  assert.ok(instantReady("stomatologiya"));
  assert.ok(!instantReady("salon-krasoty"));
  for (const photo of DENTAL_PHOTOS) assert.ok(existsSync(`public${photo}`), photo);
});

test("макет в боте: длинные списки режутся, дубли убираются", () => {
  const many = { ...example, services: Array.from({ length: 30 }, (_, i) => ({ name: `Услуга ${String.fromCharCode(1040 + i)}`, price: null })) };
  assert.equal(normalizeSite(many).services.length, 12);
  const dup = { ...example, services: [{ name: "Чистка", price: null }, { name: "чистка", price: null }] };
  assert.equal(normalizeSite(dup).services.length, 1);
});

test("макет в боте: шаблон — стили и скрипт сайта нашего макета Nek, свежие", () => {
  assert.deepEqual(assetsFile, nekAssets(), "node scripts/protos/instant/nek-assets.mjs");
  const { html } = buildInstant(example, SEED);
  assert.ok(html.includes(assetsFile.css.slice(0, 200)), "стили Nek на странице");
  assert.ok(html.includes('id="im-data"'));
  for (const nek of ["Nek Dental", "Tbilisi", "Тбилиси", "Ваке", "Paliashvili", "/protos/nek/", "100doc", "+995"]) {
    assert.ok(!html.includes(nek), nek);
  }
});

test("макет в боте: пролёт ниши — кадры шифром, ключ отдаёт маршрут, имя клиента на табличке", async () => {
  const { readdirSync, statSync } = await import("node:fs");
  const media = (await import("@/content/proto-instant/stomatologiya-media.json", { with: { type: "json" } })).default;
  assert.ok(media.n > 100, "кадры пролёта есть");
  const d = readdirSync("public/protos/_niche/stomatologiya/seq/d");
  assert.equal(d.length, media.n);
  assert.ok(d.every((f) => f.endsWith(".bin")), "в public только шифр");
  assert.ok(statSync("public/protos/_niche/stomatologiya/seq/m.bin").size > 0);
  const { SCENES } = await import("@/lib/proto/promo");
  assert.equal(SCENES["instant-stomatologiya"], "SCENE_KEY_INSTANT_STOMATOLOGIYA");
  const { html } = buildInstant(example, SEED);
  assert.ok(html.includes('class="hs"') && html.includes('id="im-land"'));
  assert.match(html, /<div class="hs-sign"[^>]*>.*Белая Лилия/);
  assert.ok(html.includes("/protos/_niche/stomatologiya/poster-16.webp"));
  assert.ok(!/\/protos\/nek\//.test(html), "кадров Nek нет");
});

const med = EXAMPLE_MED as InstantSite;

test("медцентр: пример собирается без замечаний, защита та же", () => {
  const { html, problems, stamp } = buildInstant(med, SEED);
  assert.deepEqual(problems, []);
  assert.ok(html.includes("Здоровье Плюс"));
  assert.ok(html.includes("/ru/mockup-terms") && html.includes('class="dz-vid"'));
  assert.ok(stamp.signals.some((s) => s.startsWith("js:")), "метка числа скрипта Shox");
  assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "две ловушки");
  assert.deepEqual(buildInstant({ ...med, locale: "uz", tagline: null, about: null }, SEED).problems, []);
});

test("медцентр: шаблон — стили и скрипт нашего макета Shox, свежие, без Shox", () => {
  assert.deepEqual(shoxFile, shoxAssets(), "node scripts/protos/instant/shox-assets.mjs");
  const { html } = buildInstant(med, SEED);
  assert.ok(html.includes(shoxFile.css.slice(0, 200)), "стили Shox на странице");
  assert.ok(html.includes('id="im-i18n"') && html.includes('id="im-docs"'));
  for (const shox of ["Shox", "shox.hospital", "1183", "/clients/shox-hospital", "shoxgroupbot", "Яккасарай", "SHOX10"]) {
    assert.ok(!html.includes(shox), shox);
  }
  assert.deepEqual(tailsIn(html), []);
  const tail = buildInstant({ ...med, perks: ["Как в Shox International Hospital"] }, SEED);
  assert.ok(tail.problems.some((p) => p.code === "tail"), "Shox — хвост");
});

test("медцентр: направления — услуги клиента, врачи по специальности, запись в их Telegram", () => {
  const { html } = buildInstant(med, SEED);
  assert.ok(html.includes('id="napravleniya"') && html.includes('id="vrachi"') && html.includes('id="zapis"'));
  const docs = JSON.parse(/<script type="application\/json" id="im-docs">(.*?)<\/script>/.exec(html)![1]);
  assert.equal(docs.find((d: { n: string }) => d.n === "Бахтиёр Усманов").dir, "s1", "кардиолог — в «Кардиологию»");
  const i18n = JSON.parse(/<script type="application\/json" id="im-i18n">(.*?)<\/script>/.exec(html)![1]);
  assert.equal(i18n.go, "https://t.me/zdorovie_plus_demo?text=");
  const none = buildInstant({ ...med, doctors: [], services: [] }, SEED);
  assert.deepEqual(none.problems, []);
  assert.ok(!none.html.includes('id="vrachi"') && !none.html.includes('id="ceny"'), "нет данных — блока нет");
});

test("медцентр: нейтральные фото и пролёт ниши лежат в репозитории, ключ в SCENES", async () => {
  assert.ok(instantReady("medcentr"));
  for (const photo of MEDCENTR_PHOTOS) assert.ok(existsSync(`public${photo}`), photo);
  const { SCENES } = await import("@/lib/proto/promo");
  assert.equal(SCENES["instant-medcentr"], "SCENE_KEY_INSTANT_MEDCENTR");
});

const mebel = EXAMPLE_MEBEL as InstantSite;

test("мебель: пример собирается без замечаний, защита та же", () => {
  const { html, problems, stamp } = buildInstant(mebel, SEED);
  assert.deepEqual(problems, []);
  assert.ok(html.includes("Дуб и Дом"));
  assert.ok(html.includes("/ru/mockup-terms") && html.includes('class="dz-vid"'));
  assert.ok(stamp.signals.some((s) => s.startsWith("js:")), "метка числа скрипта vTashkente");
  assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "две ловушки");
  assert.deepEqual(buildInstant({ ...mebel, locale: "uz", tagline: null, about: null }, SEED).problems, []);
});

test("мебель: шаблон — стили, сборка кухни и скрипт нашего макета vTashkente, свежие, без vTashkente", () => {
  assert.deepEqual(vtFile, vtashkenteAssets(), "node scripts/protos/instant/vtashkente-assets.mjs");
  const { html } = buildInstant(mebel, SEED);
  assert.ok(html.includes(vtFile.css.slice(0, 200)), "стили vTashkente на странице");
  assert.ok(html.includes('id="sborka"') && html.includes('class="asm-cv"') && html.includes('id="calc"'), "сборка кухни и расчёт метров");
  for (const vt of ["vTashkente", "vtashkente", "IrinaTsoy", "Руставели", "Сантьяго", "/protos/vtashkente", "pkvesta", "#e34623"]) {
    assert.ok(!html.replace(/getPropertyValue\('--or'\)\.trim\(\)\|\|'#e34623'/, "").includes(vt), vt);
  }
  assert.deepEqual(tailsIn(html), []);
  const tail = buildInstant({ ...mebel, perks: ["Как у vTashkente"] }, SEED);
  assert.ok(tail.problems.some((p) => p.code === "tail"), "vTashkente — хвост");
});

test("мебель: услуги клиента лентой, заявка в их Telegram, нет данных — блока нет", () => {
  const { html } = buildInstant(mebel, SEED);
  assert.ok(html.includes('id="raboty"') && html.includes("Шкафы-купе"));
  assert.ok(html.includes("https://t.me/dub_i_dom_demo?text="), "чат компании с текстом");
  assert.ok(html.includes("--or:hsl("), "цвет клиента");
  const none = buildInstant({ ...mebel, services: [], perks: [], telegram: null }, SEED);
  assert.deepEqual(none.problems, []);
  assert.ok(!none.html.includes('id="raboty"') && !none.html.includes('class="im-why"'), "нет данных — блока нет");
  assert.ok(!none.html.includes("t.me/"), "нет Telegram — нет ссылок в Telegram");
});

test("мебель: нейтральные фото ниши лежат в репозитории", () => {
  assert.ok(instantReady("mebel"));
  for (const photo of MEBEL_PHOTOS) {
    assert.ok(existsSync(`public${photo}`), photo);
    assert.ok(existsSync(`public${photo.replace("-1200", "-900")}`), photo);
  }
});

const rest = EXAMPLE_REST as InstantSite;

test("ресторан: пример собирается без замечаний, защита та же", () => {
  const { html, problems, stamp } = buildInstant(rest, SEED);
  assert.deepEqual(problems, []);
  assert.ok(html.includes("Чайхана Тандыр") && html.includes('id="bk-form"') && html.includes('id="mn-grid"'));
  assert.ok(html.includes("/ru/mockup-terms") && html.includes('class="dz-vid"'));
  assert.ok(stamp.signals.some((s) => s.startsWith("js:")), "метка числа скрипта Agora");
  assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "две ловушки");
  assert.deepEqual(buildInstant({ ...rest, locale: "uz", tagline: null, about: null }, SEED).problems, []);
});

test("ресторан: стили и скрипт нашего макета Agora, свежие, без Agora", () => {
  assert.deepEqual(agFile, agoraAssets(), "node scripts/protos/instant/agora-assets.mjs");
  const { html } = buildInstant(rest, SEED);
  assert.ok(html.includes(agFile.css.slice(0, 200)), "стили Agora на странице");
  for (const ag of ["Agora", "agora", "rezvo", "Амира Темура", "/protos/agora", "'ag-"]) assert.ok(!html.includes(ag), ag);
  assert.deepEqual(tailsIn(html), []);
  assert.ok(buildInstant({ ...rest, about: "Как в Agora Lounge" }, SEED).problems.some((p) => p.code === "tail"), "Agora — хвост");
});

test("ресторан: в заказ — только цена целым числом в сумах, остальное словами", () => {
  assert.equal(priceNumber("45 000 сум"), 45000);
  assert.equal(priceNumber("45000"), 45000);
  assert.equal(priceNumber("12 000 so‘m"), 12000);
  for (const p of ["от 30 тыс", "$12", "30-40 000 сум", "по весу", null, "45 000 сум / 60 000 сум", "500 ₽"]) assert.equal(priceNumber(p), 0, String(p));
  const none = buildInstant({ ...rest, services: [], telegram: null, instagram: null }, SEED);
  assert.deepEqual(none.problems, []);
  assert.ok(!none.html.includes('id="menu"') && !none.html.includes("t.me/"), "нет меню — нет блока, нет Telegram — нет ссылок");
});

test("ресторан: нейтральные фото ниши лежат в репозитории", () => {
  assert.ok(instantReady("restoran"));
  for (const photo of RESTORAN_PHOTOS) {
    assert.ok(existsSync(`public${photo}`), photo);
    assert.ok(existsSync(`public${photo.replace("-1200", "-900")}`), photo);
  }
});

const tur = EXAMPLE_TUR as InstantSite;

test("турагентство: пример собирается без замечаний, защита та же", () => {
  const { html, problems, stamp } = buildInstant(tur, SEED);
  assert.deepEqual(problems, []);
  assert.ok(html.includes("Голубая Волна") && html.includes('id="karta"') && html.includes('id="bron"'));
  assert.ok(html.includes("/ru/mockup-terms") && html.includes('class="dz-vid"'));
  assert.ok(stamp.signals.some((s) => s.startsWith("js:")), "метка числа скрипта SEM Travel");
  assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "две ловушки");
  assert.deepEqual(buildInstant({ ...tur, locale: "uz", tagline: null, about: null }, SEED).problems, []);
});

test("турагентство: стили и скрипт SEM Travel, свежие, без SEM Travel и без GSAP", () => {
  assert.deepEqual(semFile, semtravelAssets(), "node scripts/protos/instant/semtravel-assets.mjs");
  const { html } = buildInstant(tur, SEED);
  for (const s of ["SEM Travel", "semtravel", "prosem_bot", "gsap.min", "/protos/semtravel"]) assert.ok(!html.includes(s), s);
  assert.ok(!/<script[^>]+src=/.test(html), "без скриптов со стороны");
  assert.ok(html.includes("function runKnow(){var x0=byId(S.dest);openBron("), "поиск сразу ведёт в заявку, без примера расчёта");
  assert.ok(html.includes("--sun:hsl("), "цвет клиента поверх их оранжевого");
  assert.deepEqual(tailsIn(html), []);
});

test("турагентство: на карту — только страны клиента с ценой в долларах", () => {
  assert.equal(usdPrice("от $550"), 550);
  assert.equal(usdPrice("от 620 $"), 620);
  assert.equal(usdPrice("от 700 USD"), 700);
  for (const p of ["от 5 000 000 сум", null, "по запросу"]) assert.equal(usdPrice(p), 0, String(p));
  const ds = destsOf(tur.services);
  assert.deepEqual(ds.map((d) => d.id), ["georgia", "dubai", "turkey", "egypt", "thai"], "дешёвая первой, без услуг без страны");
  const none = buildInstant({ ...tur, services: [{ name: "Авиабилеты", price: null }], telegram: null, instagram: null }, SEED);
  assert.deepEqual(none.problems, []);
  assert.ok(!none.html.includes('id="karta"') && !none.html.includes('id="route"') && !none.html.includes("t.me/"), "нет стран — нет карты и маршрута");
});

test("турагентство: фото ниши лежат в репозитории", () => {
  assert.ok(instantReady("turagentstvo"));
  for (const photo of TUR_PHOTOS) assert.ok(existsSync(`public${photo}`), photo);
  for (const d of destsOf(tur.services)) assert.ok(existsSync(`public/protos/_niche/turagentstvo/${d.img}-s.webp`), d.img);
});
