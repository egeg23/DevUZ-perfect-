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
import { EXAMPLE, EXAMPLE_MEBEL, EXAMPLE_MED, EXAMPLE_REST, EXAMPLE_TUR, EXAMPLE_EDU, EXAMPLE_NEDV, EXAMPLE_SALON } from "../scripts/protos/instant/preview-data.mjs";
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
import { aipplyAssets } from "../scripts/protos/instant/aipply-assets.mjs";
import apFile from "@/content/proto-instant/aipply-assets.json" with { type: "json" };
import { EDU_PHOTOS } from "@/lib/proto/instant/edu";
import { shaharAssets } from "../scripts/protos/instant/shahar-assets.mjs";
import shFile from "@/content/proto-instant/shahar-assets.json" with { type: "json" };
import { NEDV_BACKS, NEDV_PHOTOS } from "@/lib/proto/instant/nedv";
import { panelAssets } from "../scripts/protos/instant/panel-assets.mjs";
import panelFile from "@/content/proto-instant/panel-assets.json" with { type: "json" };
import { hasAdmin } from "@/lib/proto/instant/admin";

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
  assert.ok(instantReady("salon-krasoty"));
  assert.ok(!instantReady("general"), "сфера без шаблона — вручную");
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

const edu = EXAMPLE_EDU as InstantSite;

test("учебный центр: пример собирается без замечаний, защита та же", () => {
  const { html, problems, stamp } = buildInstant(edu, SEED);
  assert.deepEqual(problems, []);
  assert.ok(html.includes("Ступени") && html.includes('id="dastur"') && html.includes('id="ochiq"'));
  assert.ok(html.includes("/ru/mockup-terms") && html.includes('class="dz-vid"'));
  assert.ok(stamp.signals.some((s) => s.startsWith("js:")), "метка числа скрипта Aipply");
  assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "две ловушки");
  assert.deepEqual(buildInstant({ ...edu, locale: "uz", tagline: null, about: null }, SEED).problems, []);
});

test("учебный центр: стили и скрипт нашего макета Aipply, свежие, без Aipply", () => {
  assert.deepEqual(apFile, aipplyAssets(), "node scripts/protos/instant/aipply-assets.mjs");
  const { html } = buildInstant(edu, SEED);
  for (const s of ["Aipply", "aipply", "/protos/aipply", "ap-kit-v1"]) assert.ok(!html.includes(s), s);
  assert.ok(!/<script[^>]+src=/.test(html), "без скриптов со стороны");
  assert.deepEqual(tailsIn(html), []);
});

test("учебный центр: нет курсов и Telegram — без блока и без ссылки", () => {
  const bare = buildInstant({ ...edu, services: [], telegram: null, instagram: null }, SEED);
  assert.deepEqual(bare.problems, []);
  assert.ok(!bare.html.includes("t.me/"), "без чата клиента ссылки нет");
});

test("учебный центр: нейтральные фото ниши лежат в репозитории", () => {
  assert.ok(instantReady("uchebnyy-centr"));
  for (const photo of EDU_PHOTOS) assert.ok(existsSync(`public${photo}`), photo);
});

const nedv = EXAMPLE_NEDV as InstantSite;

test("недвижимость: пример собирается без замечаний, защита та же", () => {
  const { html, problems, stamp } = buildInstant(nedv, SEED);
  assert.deepEqual(problems, []);
  assert.ok(html.includes("Агентство Ключ") && html.includes('id="podbor"') && html.includes('id="search"'));
  assert.ok(html.includes("/ru/mockup-terms") && html.includes('class="dz-vid"'));
  assert.ok(stamp.signals.some((s) => s.startsWith("js:")), "метка числа скрипта ShahaR");
  assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "две ловушки");
  assert.deepEqual(buildInstant({ ...nedv, locale: "uz", tagline: null, about: null }, SEED).problems, [], "узбекское «shahar» — не хвост");
});

test("недвижимость: стили и скрипт нашего макета ShahaR, свежие, без ShahaR, поиск ведёт в подбор", () => {
  assert.deepEqual(shFile, shaharAssets(), "node scripts/protos/instant/shahar-assets.mjs");
  const { html } = buildInstant(nedv, SEED);
  for (const s of ["ShahaR", "operator_shahar", "Shaharuz_bot", "/protos/shahar/", "sh-kit-v1"]) assert.ok(!html.includes(s), s);
  assert.ok(!/<script[^>]+src=/.test(html), "без скриптов со стороны");
  assert.ok(html.includes("var bk=$('book');if(bk)"), "каталога нет: поиск заполняет заявку");
  assert.ok(html.includes("--bh:"), "цвет клиента поверх их зелёного");
  assert.deepEqual(tailsIn(html), []);
});

test("недвижимость: нет услуг, преимуществ и чата — без блоков и без ссылки в Telegram", () => {
  const bare = buildInstant({ ...nedv, services: [], perks: [], telegram: null, instagram: null, city: null, about: null }, SEED);
  assert.deepEqual(bare.problems, []);
  assert.ok(!bare.html.includes('id="uslugi"'), "нет услуг — нет блока");
  assert.ok(!bare.html.includes('href="https://t.me/'), "нет чата — нет ссылки");
  assert.ok(bare.html.includes('"adminUrl":""'), "без чата заявка только копируется");
});

test("недвижимость: нейтральные фото ниши лежат в репозитории", () => {
  assert.ok(instantReady("nedvizhimost"));
  for (const photo of [...NEDV_PHOTOS, ...NEDV_BACKS]) assert.ok(existsSync(`public${photo}`), photo);
});

test("админка: панели наших макетов, свежие, без прошлых клиентов", () => {
  assert.deepEqual(panelFile, panelAssets(), "node scripts/protos/instant/panel-assets.mjs");
  const js = [panelFile.nek.js, panelFile.agora.js, panelFile.sunday.js, panelFile.fintax.js, JSON.stringify([panelFile.agora.ui, panelFile.sunday.ui, panelFile.fintax.ui])].join("");
  for (const s of ["Nek Dental", "Agora", "AGORA", "+995", "₾", "'ag-", "agora-", "Sunday", "sunday-", "'sn-", "FinTax", "'ft-"]) assert.ok(!js.includes(s), s);
  const more = [panelFile.greenwell.js, panelFile.soffice.js, JSON.stringify([panelFile.greenwell.ui, panelFile.soffice.ui])].join("");
  for (const s of ["Greenwell", "'gw-", "GW-", "/protos/greenwell", "Soffice", "soffice.uz", "'so-", "Global Property", "/protos/soffice"]) assert.ok(!more.includes(s), s);
  assert.ok(!JSON.stringify(panelFile.soffice.ui).includes("бизнес-центр"), "бизнес-центры — домами");
  assert.ok(panelFile.agora.js.includes("'ir-book-1'"), "ключи — как у сайта ресторана: бронь с макета приходит в админку");
});

test("админка: у всех семи сфер — на данных клиента, с отпечатком и условиями", () => {
  for (const [ex, mark] of [[example, "Белая Лилия"], [med, null], [rest, null], [tur, "Голубая Волна"], [edu, null], [mebel, null], [nedv, "Агентство Ключ"]] as const) {
    for (const locale of ["ru", "uz"] as const) {
      const b = buildInstant({ ...ex, locale }, SEED);
      assert.deepEqual(b.problems, [], `${ex.niche} ${locale}`);
      const a = b.pages.admin;
      assert.ok(a, `${ex.niche}: админка есть`);
      assert.ok(a.includes(`/${locale}/mockup-terms`) && /id="(?:pn|fp|gp|sp)-data"/.test(a));
      assert.ok(!/\[\[t:\d+\]\]/.test(a), "ловушки заменены отпечатком");
      assert.ok(!/<script[^>]+src=/.test(a));
      assert.deepEqual(tailsIn(a), []);
      assert.ok(a.includes(JSON.stringify(ex.name).slice(1, -1)), "имя клиента в данных панели");
      if (mark) assert.ok(a.includes(mark));
    }
  }
  for (const n of ["stomatologiya", "medcentr", "mebel", "restoran", "turagentstvo", "uchebnyy-centr", "nedvizhimost", "salon-krasoty"] as const) assert.ok(hasAdmin(n), `${n}: админка есть`);
});

test("админка ресторана: блюда клиента в меню, демо-заказы только из блюд с ценой", () => {
  const a = buildInstant(rest, SEED).pages.admin!;
  const pd = JSON.parse(a.match(/<script type="application\/json" id="pn-data">([\s\S]*?)<\/script>/)![1]);
  assert.deepEqual(pd.menu.map((m: unknown[]) => m[2]), rest.services.map((s) => s.name));
  assert.ok(pd.menu.every((m: unknown[], i: number) => m[0] === `d${i}`), "id как у сайта шаблона");
  const none = buildInstant({ ...rest, services: [] }, SEED);
  assert.deepEqual(none.problems, [], "без блюд админка собирается");
});

test("админка турагентства и учебного центра: подписи их сферы, а не свадеб и бухгалтерии", () => {
  const a = buildInstant(tur, SEED).pages.admin!;
  for (const w of ["Свадьба", "Торжество", "гостей", "Гости"]) assert.ok(!JSON.stringify(JSON.parse(a.match(/id="pn-data">([\s\S]*?)<\/script>/)![1]).ui).includes(w), w);
  assert.ok(a.includes("Пляжный отдых") && a.includes("Туристы"));
  const e = buildInstant(edu, SEED).pages.admin!;
  const ui = JSON.stringify(JSON.parse(e.match(/id="fp-data">([\s\S]*?)<\/script>/)![1]).ui);
  for (const w of ["бухгалтер", "НДС", "Налог", "ВЭД"]) assert.ok(!ui.includes(w), w);
  assert.ok(e.includes("Ученики") && e.includes("Курсы") && e.includes('id="i-dash"'));
  const pd = JSON.parse(e.match(/id="fp-data">([\s\S]*?)<\/script>/)![1]);
  assert.equal(pd.tariffs.length, 4, "панель FinTax держит четыре тарифа");
  assert.equal(pd.tariffs[0].n, edu.services[0].name, "курсы клиента первыми");
});

test("админка мебели и недвижимости: изделия и дома клиента, демо-цены только там, где на сайте цены нет", async () => {
  const { sumPrice } = await import("@/lib/proto/instant/admin");
  assert.equal(sumPrice("от 5 000 000 сум"), 5000000);
  for (const p of ["по запросу", "$500", null, "от 30 тыс"]) assert.equal(sumPrice(p), 0, String(p));
  const m = buildInstant(mebel, SEED).pages.admin!;
  const gp = JSON.parse(m.match(/id="gp-data">([\s\S]*?)<\/script>/)![1]);
  assert.deepEqual(gp.products.map((p: { n: string }) => p.n), mebel.services.slice(0, 8).map((s) => s.name));
  assert.ok(gp.products.every((p: { price: number }) => p.price > 0), "у каждого изделия есть цена для демо-заказов");
  const n = buildInstant(nedv, SEED).pages.admin!;
  const sp = JSON.parse(n.match(/id="sp-data">([\s\S]*?)<\/script>/)![1]);
  assert.ok(sp.bc.length === 6 && sp.bc.every((b: { id: string }) => sp.inv[b.id]), "у каждого демо-дома этажи");
  assert.ok(!/Gross Plaza|Sapphire|Arka Development/.test(n), "зданий и собственников Soffice нет");
});

// Пролёты по прокрутке у ресторана, мебели и турагентства (владелец, 11.11.2026:
// «Давай по остальным тоже продукты сделаем нейтральные»).
for (const [niche, site, fin] of [
  ["restoran", EXAMPLE_REST, "center"],
  ["mebel", EXAMPLE_MEBEL, "top"],
  ["turagentstvo", EXAMPLE_TUR, "center"],
] as const) {
  test(`пролёт ниши ${niche}: кадры шифром, ключ в SCENES, название клиента в последнем кадре`, async () => {
    const { readdirSync, statSync, readFileSync } = await import("node:fs");
    const media = JSON.parse(readFileSync(`content/proto-instant/${niche}-media.json`, "utf8"));
    assert.ok(media.n > 100 && media.vn > media.n, "кадры и видео телефона сняты");
    for (const k of ["d", "m"]) {
      const dir = readdirSync(`public/protos/_niche/${niche}/seq/${k}`);
      assert.equal(dir.length, media.n);
      assert.ok(dir.every((f) => f.endsWith(".bin")), "в public только шифр");
    }
    assert.ok(statSync(`public/protos/_niche/${niche}/seq/m.bin`).size > 0, "телефону — одно видео, шифром");
    for (let i = 1; i <= 5; i++) for (const a of ["16", "9"]) assert.ok(existsSync(`public/protos/_niche/${niche}/k${i}-${a}.webp`));
    const { SCENES } = await import("@/lib/proto/promo");
    assert.equal(SCENES[`instant-${niche}`], `SCENE_KEY_INSTANT_${niche.toUpperCase()}`);
    const s = site as InstantSite;
    const b = buildInstant(s, SEED);
    assert.deepEqual(b.problems, []);
    assert.ok(b.html.includes('class="fz im-fly"') && b.html.includes('id="im-land"'), "сцена и её данные на странице");
    assert.ok(b.html.includes(`/protos/_niche/${niche}/poster-16.webp`));
    assert.match(b.html, new RegExp(`class="fzc fin fin-${fin}"[^>]*><p class="fzc-h">${s.name}<`), "название клиента в последнем кадре");
    assert.ok(b.html.indexOf('class="fz im-fly"') < b.html.indexOf('id="main"') || b.html.indexOf('class="fz im-fly"') < b.html.indexOf("<footer"), "пролёт стоит первым");
    assert.ok(b.html.includes("prefers-reduced-motion:reduce){.fz{display:none}"), "без движения — кадры стопкой");
    assert.ok(!b.html.includes("$('.hs')"), "движок сцены не трогает .hs шаблона");
    const uz = buildInstant({ ...s, locale: "uz" }, SEED);
    assert.deepEqual(uz.problems, []);
  });
}

test("пролёт ниши: кадров нет — шаблон идёт без сцены", async () => {
  const { flyParts } = await import("@/lib/proto/instant/fly");
  const p = flyParts({ locale: "ru", img: "/x", media: { n: 0, vn: 0, fps: 24 }, label: "x", chapters: [], fin: "center", btn: "btn", accent: "#fff", hd: "serif", tx: "sans-serif", to: "top" });
  assert.deepEqual(p, { section: "", css: "", script: "" });
});

test("сцена по прокрутке: видео отказало в запуске — идёт кадрами, ключ и кадры спрашиваются повторно", async () => {
  const { readFileSync } = await import("node:fs");
  // Владелец, 11.11.2026: «На всех макетах не двигаются кадры на скролл анимации».
  for (const f of ["scripts/protos/nek/land.js", "scripts/protos/samauto/site.js", "scripts/protos/samist/scene.js"]) {
    const js = readFileSync(f, "utf8");
    assert.ok(js.includes("p.then(on,fail)"), `${f}: отказ play() ведёт к кадрам`);
    assert.ok(!js.includes("vd.currentTime===0)prime()"), `${f}: сцена не ждёт касания, которого не будет`);
  }
  const scene = assetsFile.scene;
  assert.ok(scene.includes("p.then(on,fail)") && scene.includes("keyBytes(2)") && scene.includes("tries[j]<3"), "движок «Макета в боте» свежий");
  for (const b of ["nek", "samauto", "samist"]) assert.ok(readFileSync(`content/proto-bundles/${b}.json`, "utf8").includes("p.then(on,fail)"), `сборка ${b} пересобрана`);
});

// Салон красоты (владелец, 11.11.2026: «влетаем в дверь… капля лака, которая падает через всю страницу»).
const salon = EXAMPLE_SALON as InstantSite;

test("салон красоты: пример собирается без замечаний на двух языках, защита та же", () => {
  for (const locale of ["ru", "uz"] as const) {
    const b = buildInstant({ ...salon, locale }, SEED);
    assert.deepEqual(b.problems, [], locale);
    assert.ok(b.html.includes('class="dz-vid"') && b.html.includes("mockup-terms"), "видео DevUz и условия");
    assert.ok(!/\[\[t:\d+\]\]/.test(b.html), "ловушки подставлены");
    assert.ok(!/<script[^>]+src=/i.test(b.html), "скриптов со стороны нет");
  }
});

test("салон красоты: пролёт из шести роликов, цены клиента в главах, капля закрывает кадр", async () => {
  const { readdirSync, statSync, readFileSync } = await import("node:fs");
  const media = JSON.parse(readFileSync("content/proto-instant/salon-krasoty-media.json", "utf8"));
  assert.ok(media.n > 600 && media.vn > media.n, "шесть роликов сняты");
  for (const k of ["d", "m"]) {
    const dir = readdirSync(`public/protos/_niche/salon-krasoty/seq/${k}`);
    assert.equal(dir.length, media.n);
    assert.ok(dir.every((f) => f.endsWith(".bin")), "в public только шифр");
  }
  assert.ok(statSync("public/protos/_niche/salon-krasoty/seq/m.bin").size > 0);
  for (let i = 1; i <= 7; i++) for (const a of ["16", "9"]) assert.ok(existsSync(`public/protos/_niche/salon-krasoty/k${i}-${a}.webp`));
  const { SCENES } = await import("@/lib/proto/promo");
  assert.equal(SCENES["instant-salon-krasoty"], "SCENE_KEY_INSTANT_SALON_KRASOTY");
  const { html } = buildInstant(salon, SEED);
  assert.ok(html.includes('class="fz im-fly"') && html.includes('class="fz-drop"'), "пролёт и капля-переход");
  assert.match(html, /<div class="fz-sign"[^>]*>.*Мята и Пудра/, "название на вывеске над дверью");
  // Главы — услуги и цены самого салона, а не наши.
  assert.match(html, /Женская стрижка <em>от 180 000 сум<\/em>/);
  assert.match(html, /Маникюр с покрытием гель-лаком <em>220 000 сум<\/em>/);
  assert.match(html, /Окрашивание в один тон <em>от 650 000 сум<\/em>/);
  assert.equal((html.match(/data-cp="/g) ?? []).length, 6);
});

test("салон красоты: нет услуги или цены — глава без числа, блоки без данных не рисуются", () => {
  const bare = buildInstant({ ...salon, services: [{ name: "Оформление бровей", price: null }], doctors: [], perks: [] }, SEED);
  assert.deepEqual(bare.problems, []);
  assert.match(bare.html, /Стрижка <em>цену подскажем при записи<\/em>/);
  assert.ok(!bare.html.includes('class="people"') && !bare.html.includes('class="perks"'));
  assert.ok(bare.html.includes("цена при записи"), "услуга без цены — словами");
});

test("салон красоты: капля падает к ногтю, подбор цвета без марок, запись в чат салона", () => {
  const { html } = buildInstant(salon, SEED);
  assert.ok(html.includes('id="rail"') && html.includes('id="drop"') && html.includes('id="nail"'), "капля, рельс и ноготь");
  assert.equal((html.match(/class="sw[ "]/g) ?? []).length, 10, "десять оттенков для примерки");
  assert.ok(html.includes("Кошачий глаз") && html.includes("Френч") && html.includes("Гель-лак"));
  assert.ok(!/OPI|Luxio|Kodi|CND|Masura/i.test(html), "марок не называем: какие у салона, не знаем");
  assert.ok(html.includes("https://t.me/myata_pudra_demo"), "заявка уходит в Telegram салона");
  assert.ok(html.includes("prefers-reduced-motion:reduce"), "без движения — капли нет, ноготь уже покрыт");
  assert.ok(html.includes("3000"), "шапка возвращается через 3 секунды");
});

test("админка салона: все каналы в одном окне, статьи, акции и сайт, без сети и без имени прошлого клиента", () => {
  for (const locale of ["ru", "uz"] as const) {
    const b = buildInstant({ ...salon, locale }, SEED);
    assert.deepEqual(b.problems, [], locale);
    const a = b.pages.admin!;
    assert.ok(a.includes(`/${locale}/mockup-terms`), "условия макета");
    assert.ok(!/\[\[t:\d+\]\]/.test(a) && !/<script[^>]+src=/.test(a) && !/fetch\(/.test(a), "ловушки заменены, в сеть панель не ходит");
    assert.deepEqual(tailsIn(a), []);
    const pd = JSON.parse(a.match(/<script type="application\/json" id="pn-data">([\s\S]*?)<\/script>/)![1]);
    assert.equal(pd.name, salon.name);
    assert.deepEqual([...new Set(pd.convs.map((c: { kind: string }) => c.kind))].sort(), ["instagram", "site", "tg", "vk", "whatsapp"]);
    assert.deepEqual(pd.groups.map((g: { key: string }) => g.key), ["contacts", "services", "promos", "masters", "perks", "texts"]);
    assert.deepEqual(pd.defaults.services.map((x: { t: string }) => x.t), salon.services.map((x) => x.name), "услуги и цены клиента");
    assert.ok(pd.posts.length >= 3 && a.includes("VIEWS.stati") && a.includes("Instagram Direct"));
    assert.ok(a.includes("демо-данные"));
  }
  assert.ok(buildInstant(salon, SEED).html.includes("is-salon-book"), "запись с сайта макета приходит в админку");
});
