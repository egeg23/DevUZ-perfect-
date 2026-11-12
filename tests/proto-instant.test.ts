import assert from "node:assert/strict";
import { existsSync, statSync as fileStat } from "node:fs";
import { test } from "node:test";

import tailsFile from "@/content/proto-instant/tails.json" with { type: "json" };
import { buildInstant, normalizeSite } from "@/lib/proto/instant/build";
import { tailsIn } from "@/lib/proto/instant/check";
import { DENTAL_PHOTOS } from "@/lib/proto/instant/dental";
import { imageUrl } from "@/lib/proto/instant/safe";
import { emptySite, INSTANT_NICHES, instantReady, type InstantSite } from "@/lib/proto/instant/types";
import { siteFromAnswers } from "@/lib/proto/instant/read";
import { tails } from "../scripts/protos/instant/tails.mjs";
import { nekAssets } from "../scripts/protos/instant/nek-assets.mjs";
import assetsFile from "@/content/proto-instant/nek-assets.json" with { type: "json" };
import { EXAMPLE, EXAMPLE_MEBEL, EXAMPLE_MED, EXAMPLE_REST, EXAMPLE_TUR, EXAMPLE_EDU, EXAMPLE_NEDV, EXAMPLE_SALON, EXAMPLE_AVTO, EXAMPLE_LOGI } from "../scripts/protos/instant/preview-data.mjs";
import { automechanicAssets } from "../scripts/protos/instant/automechanic-assets.mjs";
import amFile from "@/content/proto-instant/automechanic-assets.json" with { type: "json" };
import { AVTOSERVIS_LAYERS, AVTOSERVIS_PHOTOS } from "@/lib/proto/instant/avtoservis";
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
import { medacademyAssets } from "../scripts/protos/instant/medacademy-assets.mjs";
import maFile from "@/content/proto-instant/medacademy-assets.json" with { type: "json" };
import { EDU_PHOTOS } from "@/lib/proto/instant/edu";
import { maveraAssets } from "../scripts/protos/instant/mavera-assets.mjs";
import mvFile from "@/content/proto-instant/mavera-assets.json" with { type: "json" };
import { NEDV_BACKS, NEDV_PHOTOS } from "@/lib/proto/instant/nedv";
import { panelAssets } from "../scripts/protos/instant/panel-assets.mjs";
import panelFile from "@/content/proto-instant/panel-assets.json" with { type: "json" };
import { hasAdmin } from "@/lib/proto/instant/admin";
import { liderprofAssets } from "../scripts/protos/instant/liderprof-assets.mjs";
import lpFile from "@/content/proto-instant/liderprof-assets.json" with { type: "json" };
import { STROI_HERO, STROI_PANO, STROI_PHOTOS } from "@/lib/proto/instant/stroitelstvo";
import { EXAMPLE_STROI } from "../scripts/protos/instant/preview-data.mjs";

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
  assert.ok(html.includes("Ступени") && html.includes('id="courses"') && html.includes('id="contacts"'));
  assert.ok(html.includes("/ru/mockup-terms") && html.includes('class="dz-vid"'));
  assert.ok(stamp.signals.some((s) => s.startsWith("js:")), "метка числа скрипта");
  assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "две ловушки");
  const uz = buildInstant({ ...edu, locale: "uz", tagline: null, about: null, source: "namuna" }, SEED);
  assert.deepEqual(uz.problems, []);
  // Узбекская версия: наших русских подписей нет (русское остаётся только в данных клиента).
  for (const s of ["Записаться", "Выберите курс", "Стоимость", "Контакты", "Преподаватели"]) assert.ok(!uz.html.includes(s), s);
});

test("учебный центр: наш макет MedAcademy B, стили и скрипт свежие, без MedAcademy", () => {
  // 12.11.2026, владелец: «там был фиолетовый с зеленым, круто выглядели - Прицепить туда их логотип и погнали».
  assert.deepEqual(maFile, medacademyAssets(), "node scripts/protos/instant/medacademy-assets.mjs");
  const { html } = buildInstant(edu, SEED);
  assert.ok(html.includes('data-ma="b"') && html.includes("ma-marquee") && html.includes('role="tablist"') && html.includes('id="mol"'), "блоки макета: мир B, бегущая строка, вкладки курсов, молекулы");
  assert.ok(html.includes("Dela+Gothic+One") && html.includes("#cff846"), "шрифт и лайм макета");
  for (const s of ["MedAcademy", "medacademy", "DTM", "Aipply", "aipply", "number-flow", "/_next/"]) assert.ok(!html.includes(s), s);
  assert.ok(!/<script[^>]+src=/.test(html) && !/<iframe/i.test(html), "без скриптов и страниц со стороны");
  assert.ok(!html.includes("@font-face"), "шрифты макета в страницу не вшиты");
  assert.deepEqual(tailsIn(html), []);
  assert.ok(tailsIn("курсы MedAcademy, пишите @medacademy_admin").length >= 2, "хвост MedAcademy ловится");
  assert.ok(html.includes("is-away") && html.includes("IDLE = 3000"), "шапка прячется при прокрутке и возвращается через 3 секунды");
  assert.ok(html.includes("prefers-reduced-motion"));
});

test("учебный центр: всегда фиолетовый с лаймом, цвет клиента макет не перекрашивает", () => {
  // Владелец, 12.11.2026: «фиолетовый с зеленым, круто выглядели».
  for (const color of [edu.color, null, "#1d6fd8"]) {
    const html = buildInstant({ ...edu, color }, SEED).html;
    assert.ok(!/--ma-night:hsl/.test(html) && html.includes("--ma-night:#191337"), "фиолетовый макета");
  }
});

test("учебный центр: курсы и цены клиента, преподаватели только названные, нет данных — нет блока", () => {
  const people = [{ name: "Анна Петрова", role: "Английский язык" }, { name: "Тимур Алиев", role: null }];
  const full = buildInstant({ ...edu, doctors: people }, SEED);
  assert.deepEqual(full.problems, []);
  assert.equal((full.html.match(/role="tabpanel"/g) ?? []).length, edu.services.length);
  assert.ok(full.html.includes("350 000 сум в месяц") && full.html.includes("Цену уточняйте при записи"));
  assert.equal((full.html.match(/class="ma-flip /g) ?? []).length, 2);
  assert.ok(!buildInstant(edu, SEED).html.includes('id="teachers"'), "преподавателей не назвали: блока нет");
  const bare = buildInstant({ ...edu, services: [], perks: [], telegram: null, instagram: null }, SEED);
  assert.deepEqual(bare.problems, []);
  assert.ok(!bare.html.includes("t.me/"), "без чата клиента ссылки нет");
  assert.ok(!bare.html.includes('id="courses"') && !bare.html.includes("ma-marquee flex"), "без курсов нет ни раздела, ни бегущей строки");
});

test("учебный центр: нейтральные фото ниши лежат в репозитории", () => {
  assert.ok(instantReady("uchebnyy-centr"));
  for (const photo of EDU_PHOTOS) assert.ok(existsSync(`public${photo}`), photo);
});

const nedv = EXAMPLE_NEDV as InstantSite;

test("недвижимость: пример собирается без замечаний, защита та же", () => {
  const { html, problems, stamp } = buildInstant(nedv, SEED);
  assert.deepEqual(problems, []);
  assert.ok(html.includes("Агентство Ключ") && html.includes('id="book"') && html.includes('id="genplan"') && html.includes('id="picker"'));
  assert.ok(html.includes("/ru/mockup-terms") && html.includes('class="dz-vid"'));
  assert.ok(stamp.signals.some((s) => s.startsWith("js:")), "метка числа скрипта");
  assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "две ловушки");
  const uz = buildInstant({ ...nedv, locale: "uz", tagline: null, about: null }, SEED);
  assert.deepEqual(uz.problems, []);
  assert.ok(uz.html.includes("/uz/mockup-terms") && uz.html.includes("Korpus"));
});

test("недвижимость: наш макет MAVERA «Премиум»: снимок свежий, те же блоки, без MAVERA и её чисел", () => {
  // Владелец, 12.11.2026: «Можно взять MAVERA целиком, просто заменим логотип компании».
  assert.deepEqual(mvFile, maveraAssets(), "node scripts/protos/instant/mavera-assets.mjs");
  const { html } = buildInstant(nedv, SEED);
  assert.ok(html.includes('data-world="premium"') && html.includes('data-palette="ivory"'), "мир и палитра «Премиума»");
  for (const c of ["w-slab", "w-rise", "w-rail", "w-glow", "w-word", "w-kenburns", "w-parallax", "--mv-accent"]) assert.ok(html.includes(c), c);
  assert.equal((html.match(/<g role="button"/g) ?? []).length, 7, "генплан: те же семь корпусов");
  assert.equal((html.match(/<button type="button" data-s="[fbs]"/g) ?? []).length, 180, "шахматка: те же клетки");
  for (const s of ["MAVERA", "mavera", "Чинор", "Дарё", "Олтин", "Зарафшон", "млн", "за м²", "/images/mavera", "_next/"]) assert.ok(!html.includes(s), s);
  assert.ok(!/<script[^>]+src=/.test(html) && !/<iframe/.test(html), "без скриптов и страниц со стороны");
  assert.ok(html.includes("--w-accent:hsl("), "акцент макета в цвет клиента");
  assert.ok(html.includes("nv-leads-1"), "заявка с макета приходит в админку");
  assert.ok(html.includes("mvx-away") && html.includes("3000"), "шапка прячется и возвращается через 3 секунды");
  assert.ok(html.includes("prefers-reduced-motion:reduce"));
  // Услуги клиента вместо их ЖК: имя и цена слово в слово.
  for (const s of nedv.services) assert.ok(html.includes(s.name), s.name);
  assert.ok(html.includes("от 1% от сделки"));
  assert.deepEqual(tailsIn(html), []);
  assert.ok(tailsIn("Купите квартиру в ЖК «Чинор» от MAVERA").length >= 2, "хвосты MAVERA ловятся");
});

test("недвижимость: нет услуг, преимуществ и чата — без блоков и без ссылки в Telegram", () => {
  const bare = buildInstant({ ...nedv, services: [], perks: [], telegram: null, instagram: null, city: null, about: null, color: null }, SEED);
  assert.deepEqual(bare.problems, []);
  assert.ok(!bare.html.includes('id="projects"') && !bare.html.includes('name="svc"'), "нет услуг — нет ленты и выбора услуги");
  assert.ok(!bare.html.includes('href="https://t.me/'), "нет чата — нет ссылки");
  assert.ok(bare.html.includes('"chat":""'), "без чата заявка только копируется");
  assert.ok(!bare.html.includes("--w-accent:hsl("), "нет цвета клиента — палитра макета");
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
  for (const n of ["stomatologiya", "medcentr", "mebel", "restoran", "turagentstvo", "uchebnyy-centr", "nedvizhimost", "salon-krasoty", "stroitelstvo"] as const) assert.ok(hasAdmin(n), `${n}: админка есть`);
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

test("турагентство: поиск туров, авиабилетов и отелей из Apollo, цены только клиента", () => {
  for (const locale of ["ru", "uz"] as const) {
    const { html, problems } = buildInstant({ ...(EXAMPLE_TUR as InstantSite), locale }, SEED);
    assert.deepEqual(problems, []);
    assert.equal((html.match(/data-xm="(tours|air|hotel)"/g) ?? []).length, 3, "три вкладки поиска");
    assert.ok(html.includes('id="xr"') && html.includes('id="xr-pl"') && html.includes('id="xr-g"'), "экран поиска с дугой перелёта");
    assert.ok(html.includes("data-tour="), "карточки туров клиента открывают поиск");
    // От Apollo не берём их туроператоров, число туров и цены.
    assert.ok(!/anex\s?tour|coral\s?travel|pegas|sunmar|apollo/i.test(html), "чужих брендов нет");
  }
  // Клиент без услуг и цен: поиск есть, выдача без чисел («цена по запросу»).
  const bare = buildInstant({ ...(EXAMPLE_TUR as InstantSite), services: [] }, SEED);
  assert.deepEqual(bare.problems, []);
  assert.ok(bare.html.includes('id="xq"') && !/id="xq-f" hidden/.test(bare.html), "без стран клиента «Куда» вводят текстом");
  assert.ok(bare.html.includes("цена по запросу"));
});

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

test("салон красоты: капля идёт своей полосой, ноготь на фото руки, подтёки, работы и отзывы примером", () => {
  for (const locale of ["ru", "uz"] as const) {
    const { html, problems } = buildInstant({ ...salon, locale }, SEED);
    assert.deepEqual(problems, []);
    // 12.11.2026, владелец: «Капелька которая падает не должна попадать на текст»: полоса справа, текст в неё не заходит.
    assert.ok(html.includes("--lane:") && html.includes("padding-right:var(--lane)"), "у капли своя полоса");
    assert.ok(/id="nail"[^>]*>\s*<img[^>]+hand\.webp/.test(html), "ноготь: фото руки, а не рисунок");
    assert.equal((html.match(/<i style="left:[^"]+" data-k=/g) ?? []).length, 8, "подтёки первого экрана");
    assert.equal((html.match(/_niche\/salon-krasoty\/w\d\.webp/g) ?? []).length, 6, "шесть кадров работ");
    assert.ok(html.includes("ba-before.webp") && html.includes("ba-after.webp") && html.includes('type="range"'), "до и после ползунком");
    assert.ok(html.indexOf('id="works"') > html.indexOf('id="services"') && html.indexOf('class="revs"') > html.indexOf('id="nail"'), "порядок блоков");
  }
  const { html } = buildInstant(salon, SEED);
  // Отзывы и кадры работ не клиента: это сказано на странице, чужих чисел и имён прошлых клиентов нет.
  assert.equal((html.match(/Пример отзыва/g) ?? []).length, 3);
  assert.ok(html.includes("Кадры для примера"));
  for (const f of ["hand", "hand-nails", "hand-gloss", "hand-tips", "ba-before", "ba-after", "w1", "w2", "w3", "w4", "w5", "w6"]) {
    const size = fileStat(`public/protos/_niche/salon-krasoty/${f}.webp`).size;
    assert.ok(size > 0 && size < 400_000, `${f}.webp: ${size}`);
  }
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

test("сборка из ответов в боте проходит у каждой сферы: счётчик загрузки пролёта не число клиента", () => {
  // 12.11.2026: салон, мебель и ресторан уходили «дизайнеру вручную». У клиента без цен
  // в данных нет нуля, а «0%» счётчика пролёта проверка считала чужим числом.
  for (const niche of INSTANT_NICHES) for (const locale of ["ru", "uz"] as const) {
    const site = siteFromAnswers({ niche, locale, name: "Лолипопыч", phone: "+998 91 234 56 78", address: "Чиланзар", services: "Ногти" });
    assert.deepEqual(buildInstant(site, SEED).problems, [], `${niche} ${locale}`);
  }
});

test("интернет-магазин: магазин нашего макета Greenwell, свежий, без Greenwell, защита та же", async () => {
  const { greenwellShopAssets } = await import("../scripts/protos/instant/greenwell-shop-assets.mjs");
  const gwFile = (await import("@/content/proto-instant/greenwell-shop-assets.json", { with: { type: "json" } })).default;
  const { EXAMPLE_SHOP } = await import("../scripts/protos/instant/preview-data.mjs");
  assert.deepEqual(gwFile, greenwellShopAssets(), "node scripts/protos/instant/greenwell-shop-assets.mjs");
  const shop = EXAMPLE_SHOP as InstantSite;
  const { html, problems, stamp } = buildInstant(shop, SEED);
  assert.deepEqual(problems, []);
  assert.ok(html.includes(gwFile.css.slice(0, 200)), "стили магазина Greenwell");
  assert.ok(html.includes('id="gw-data"') && html.includes('class="tabbar"') && html.includes('id="sheet"'), "оболочка магазина Greenwell");
  assert.ok(html.includes("/ru/mockup-terms") && html.includes('class="dz-vid"'));
  assert.ok(stamp.signals.some((s) => s.startsWith("js:")), "метка числа скрипта");
  assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "две ловушки");
  for (const gw of ["Greenwell", "greenwell", "Inso Farm", "GREEN10", "Uzum Market", "/protos/greenwell", "Руставели", "gw-demo-1"]) assert.ok(!html.includes(gw), gw);
  assert.deepEqual(tailsIn(html), []);
  assert.ok(buildInstant({ ...shop, perks: ["Как у Greenwell"] }, SEED).problems.some((p) => p.code === "tail"), "Greenwell — хвост");
  assert.deepEqual(buildInstant({ ...shop, locale: "uz", tagline: null, about: null }, SEED).problems, []);
});

test("интернет-магазин: товары — услуги клиента, цена только его, без цены — «цена по запросу» и вопрос в чат", async () => {
  const { EXAMPLE_SHOP } = await import("../scripts/protos/instant/preview-data.mjs");
  const { MAGAZIN_PHOTOS, shopPrice } = await import("@/lib/proto/instant/magazin");
  const shop = EXAMPLE_SHOP as InstantSite;
  const { html, pages } = buildInstant(shop, SEED);
  const admin = pages.admin ?? "";
  const data = JSON.parse(html.match(/<script type="application\/json" id="gw-data">([\s\S]*?)<\/script>/)![1]);
  assert.deepEqual(data.products.map((p: { n: string }) => p.n), shop.services.map((s) => s.name));
  assert.deepEqual(data.products.map((p: { price: number }) => p.price), [420000, 180000, 350000, 0, 210000, 0], "цена числом — только с сайта клиента");
  assert.ok(data.products.every((p: { rating: number; reviews: number }) => !p.rating && !p.reviews), "оценок и отзывов чужой витрины нет");
  assert.equal(data.ui.ask, "Цена по запросу");
  assert.equal(data.chat, "https://t.me/uyutniy_dom_demo");
  assert.equal(shopPrice("от 1 200 000 сум"), 1200000);
  assert.equal(shopPrice("20 $"), 0, "доллары в корзину не идут: валюта магазина сумы");
  for (const photo of MAGAZIN_PHOTOS) assert.ok(existsSync(`public${photo}`), photo);
  // Админка — панель магазина Greenwell; заказ с сайта шаблона пишется в ту же память, что она читает.
  assert.ok(hasAdmin("magazin"));
  assert.ok(admin.includes("'ms-demo-1'") && !admin.includes("'mb-demo-1'"), "своя память у магазина");
  assert.ok(html.includes("KEY='ms-demo-1'"));
  assert.ok(admin.includes("Уютный Дом") && admin.includes("Комплект постельного белья"));
  const none = buildInstant({ ...shop, services: [], perks: [], telegram: null, instagram: null }, SEED);
  assert.deepEqual(none.problems, []);
});

const avto = EXAMPLE_AVTO as InstantSite;

test("автосервис: пример собирается без замечаний на двух языках, защита та же", () => {
  for (const locale of ["ru", "uz"] as const) {
    const { html, problems, stamp } = buildInstant({ ...avto, locale }, SEED);
    assert.deepEqual(problems, [], locale);
    assert.ok(html.includes("Гараж Восток"));
    assert.ok(html.includes(`/${locale}/mockup-terms`) && html.includes('class="dz-vid"'));
    assert.ok(stamp.signals.some((s) => s.startsWith("js:")), "метка числа скрипта AUTOMECHANIC");
    assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "две ловушки");
  }
  assert.deepEqual(buildInstant({ ...avto, tagline: null, about: null, perks: [] }, SEED).problems, []);
});

test("автосервис: стили и скрипт нашего макета AUTOMECHANIC, свежие, без AUTOMECHANIC", () => {
  assert.deepEqual(amFile, automechanicAssets(), "node scripts/protos/instant/automechanic-assets.mjs");
  const { html } = buildInstant(avto, SEED);
  assert.ok(html.includes(".scroll-hint{display:inline-flex") && html.includes(amFile.js.slice(0, 120)), "стили и скрипт AUTOMECHANIC на странице");
  assert.ok(html.includes('data-scene="hero"') && html.includes('data-l="rimf"') && html.includes('id="book"'), "сцена с подъёмником и запись в три шага");
  for (const am of ["AUTOMECHANIC", "automechanic", "Aral", "77 Lubricants", "1991", "Чиланзар", "BMW", "tadjiyev", "/protos/automechanic"]) assert.ok(!html.includes(am), am);
  assert.deepEqual(tailsIn(html), []);
  assert.ok(buildInstant({ ...avto, perks: ["Как у AUTOMECHANIC"] }, SEED).problems.some((p) => p.code === "tail"), "AUTOMECHANIC — хвост");
});

test("автосервис: прайс и цены только клиента, нет данных — блока нет, запись в их Telegram", () => {
  const { html } = buildInstant(avto, SEED);
  assert.ok(html.includes('id="uslugi"') && html.includes("от 150 000 сум"), "цена клиента");
  assert.ok(html.includes("Цену назовёт мастер-приёмщик"), "нет цены — словами, без числа");
  assert.ok(html.includes('"tgUrl":"https://t.me/garazh_vostok_demo"'), "заявка в их Telegram");
  assert.ok(html.includes("as-demo-1"), "заявка с макета — в админку");
  const none = buildInstant({ ...avto, services: [], perks: [], telegram: null, address: null, hours: null }, SEED);
  assert.deepEqual(none.problems, []);
  assert.ok(!none.html.includes('id="uslugi"') && !none.html.includes("t.me/"), "нет услуг и Telegram — нет блока и ссылок");
});

test("автосервис: слои сцены и фото ниши лежат в репозитории, админка на ключе сайта", () => {
  assert.ok(instantReady("avtoservis"));
  for (const photo of AVTOSERVIS_PHOTOS) {
    assert.ok(existsSync(`public${photo}`), photo);
    assert.ok(existsSync(`public${photo.replace("-1200", "-900")}`), photo);
  }
  for (const layer of AVTOSERVIS_LAYERS) assert.ok(existsSync(`public${layer}`), layer);
  const a = buildInstant(avto, SEED).pages.admin;
  assert.ok(a && a.includes("'as-demo-1'") && !a.includes("'nk-demo-1'"), "админка читает заявки сайта автосервиса");
  assert.ok(a.includes("Панель автосервиса") && !/Главный врач|Пациент/.test(a.replace(/"[a-z_]+":"[^"]*"/g, "")), "слова сервиса, не клиники");
});

test("логистика: наш макет Cargo Pro, пример собирается без замечаний, защита та же", async () => {
  // Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают "другая ниша"… выведем больше ниш которые у нас есть».
  const { EXAMPLE_LOGI } = await import("../scripts/protos/instant/preview-data.mjs");
  const { cargoproAssets } = await import("../scripts/protos/instant/cargopro-assets.mjs");
  const cpFile = (await import("@/content/proto-instant/cargopro-assets.json", { with: { type: "json" } })).default;
  const { LOGISTIKA_PHOTOS, modeOf } = await import("@/lib/proto/instant/logistika");
  assert.deepEqual(cpFile, cargoproAssets(), "node scripts/protos/instant/cargopro-assets.mjs");
  const logi = EXAMPLE_LOGI as InstantSite;
  const { html, problems, stamp, pages } = buildInstant(logi, SEED);
  assert.deepEqual(problems, []);
  assert.ok(instantReady("logistika") && hasAdmin("logistika"));
  for (const c of ['class="top"', 'class="hero"', 'class="qc glass', 'class="velo"', 'id="services"', 'id="calc"', 'id="track"', 'id="customs"', 'class="tsum glass"']) assert.ok(html.includes(c), c);
  assert.ok(html.includes("/ru/mockup-terms") && html.includes('class="dz-vid"'));
  assert.ok(stamp.signals.some((s) => s.startsWith("js:")), "метка числа скрипта");
  assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "две ловушки");
  assert.ok(html.includes("IDLE=3000") && html.includes("classList.add('hide')"), "шапка прячется и возвращается через 3 секунды");
  for (const s of logi.services) assert.ok(html.includes(s.name), s.name);
  assert.ok(html.includes("от 9 $ за кг"), "цена клиента его словами");
  // Ни имени, ни ставок, ни направлений Cargo Pro: конструктор тарифов не берётся.
  for (const s of ["CARGO PRO", "cargoprogroup", "CPG-", "Гуанчжоу", "Silk Way", "flydubai", "/protos/cargopro", "cp-req-1", "Lider Cargo"]) assert.ok(!html.includes(s) && !(pages.admin ?? "").includes(s), s);
  assert.deepEqual(tailsIn(html), []);
  assert.ok(tailsIn("Звоните в CARGO PRO GROUP, info@cargoprogroup.com").length >= 2, "хвосты Cargo Pro ловятся");
  // Заявка с сайта и статус из админки — одни ключи памяти.
  assert.ok(html.includes("lg-req-1") && html.includes("lg-panel-1") && (pages.admin ?? "").includes("lg-req-1") && (pages.admin ?? "").includes("lg-panel-1"));
  assert.equal(modeOf("Ж/д контейнеры"), "rail");
  assert.equal(modeOf("Таможенное оформление"), "customs");
  assert.equal(modeOf("Автоперевозки фурами"), "auto");
  for (const photo of LOGISTIKA_PHOTOS) assert.ok(existsSync(`public${photo}`) && existsSync(`public${photo.replace("-1200", "-900")}`), photo);
  const uz = buildInstant({ ...logi, locale: "uz", tagline: null, about: null }, SEED);
  assert.deepEqual(uz.problems, []);
  assert.ok(uz.html.includes("/uz/mockup-terms") && uz.html.includes("Hisobga ariza"));
});

test("логистика: нет таможни, видов транспорта и чата — без блоков и без выбора транспорта", async () => {
  const { EXAMPLE_LOGI } = await import("../scripts/protos/instant/preview-data.mjs");
  const bare = buildInstant({ ...(EXAMPLE_LOGI as InstantSite), services: [{ name: "Переезды", price: null }], perks: [], telegram: null, about: null, color: null }, SEED);
  assert.deepEqual(bare.problems, []);
  assert.ok(!bare.html.includes('id="customs"'), "таможни у компании нет — блока нет");
  assert.ok(!bare.html.includes('data-qm="air"') && !bare.html.includes('data-m="sea"'), "чужих видов транспорта не обещаем");
  assert.ok(!bare.html.includes('href="https://t.me/'), "нет чата — нет ссылки");
});

const stroi = EXAMPLE_STROI as InstantSite;

test("стройка и ремонт: пример собирается без замечаний, защита та же", () => {
  const { html, problems, stamp, pages } = buildInstant(stroi, SEED);
  assert.deepEqual(problems, []);
  assert.ok(html.includes("Мастер Дом") && html.includes('id="uslugi"') && html.includes('id="raschet"') && html.includes('id="pano-v"'));
  assert.ok(html.includes("/ru/mockup-terms") && html.includes('class="dz-vid"'));
  assert.ok(stamp.signals.some((s) => s.startsWith("js:")), "метка числа скрипта Lider Prof");
  assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "две ловушки");
  assert.ok(pages.admin && pages.kp, "админка и КП рядом с макетом");
  const uz = buildInstant({ ...stroi, locale: "uz", tagline: null, about: null, source: "namuna" }, SEED);
  assert.deepEqual(uz.problems, []);
  for (const w of ["Наши услуги", "Расчёт ремонта", "Отправить на расчёт", "Почему мы"]) assert.ok(!uz.html.includes(w), w);
});

test("стройка и ремонт: наш макет Lider Prof, стили и скрипт свежие, без Lider Prof", () => {
  // Владелец, 12.11.2026: «выведем больше ниш которые у нас есть, также переодевать просто».
  assert.deepEqual(lpFile, liderprofAssets(), "node scripts/protos/instant/liderprof-assets.mjs");
  const { html } = buildInstant(stroi, SEED);
  assert.ok(html.includes(lpFile.css.slice(0, 200)), "стили Lider Prof на странице");
  for (const c of ['class="hero2 dark"', 'class="path"', 'class="pgrid"', 'class="calc rv', 'class="pano rv', 'class="final dark"', 'class="dock"']) assert.ok(html.includes(c), c);
  for (const s of ["LIDER", "Lider", "lider-prof", "lppuz", "/protos/lider-prof", "Олимпийск", "ARK Residence", "DreamLand"]) assert.ok(!html.includes(s), s);
  assert.ok(!/<script[^>]+src=/.test(html) && !/<iframe/i.test(html));
  assert.deepEqual(tailsIn(html), []);
  assert.ok(tailsIn("Проект от LIDER PROF PROEKT, пишите @lppuz").length >= 2, "хвост Lider Prof ловится");
  assert.ok(html.includes("is-away") && html.includes("IDLE = 3000"), "шапка прячется при прокрутке и возвращается через 3 секунды");
  assert.ok(html.includes("--red:hsl("), "красный Lider Prof — в цвет клиента");
  assert.ok(html.includes("fe-leads-1"), "заявка с расчёта приходит в админку");
});

test("стройка и ремонт: услуги и цены клиента, нет данных — нет блока, без чата ссылки нет", () => {
  const { html } = buildInstant(stroi, SEED);
  for (const s of stroi.services) assert.ok(html.includes(s.name), s.name);
  assert.ok(html.includes("от 120 $ за м²") && html.includes("Цену назовём после замера"));
  assert.ok(html.includes("https://t.me/masterdom_demo"));
  const bare = buildInstant({ ...stroi, services: [], perks: [], telegram: null, instagram: null }, SEED);
  assert.deepEqual(bare.problems, []);
  assert.ok(!bare.html.includes('id="uslugi"') && !bare.html.includes('id="pochemu"'), "нет услуг и преимуществ — нет блоков");
  assert.ok(!bare.html.includes("t.me/"), "нет Telegram — нет ссылок в Telegram");
  assert.ok(bare.html.includes('"tg":""'), "без чата заявка только копируется");
});

test("стройка и ремонт: нейтральные фото ниши лежат в репозитории", () => {
  assert.ok(instantReady("stroitelstvo") && hasAdmin("stroitelstvo"));
  for (const photo of [...STROI_PHOTOS, STROI_HERO, STROI_PANO]) assert.ok(existsSync(`public${photo}`), photo);
  for (const photo of STROI_PHOTOS) assert.ok(existsSync(`public${photo.replace("-1200", "-640")}`), photo);
});

/* Владелец, 13.11.2026: «Для макета логистики используем "супер админку" как в оригинале,
   сделай такую же с теми же функциями». */
test("логистика: админка — супер-админка Cargo Pro, обычная — рядом, без их имени и адресов", () => {
  const b = buildInstant(EXAMPLE_LOGI as InstantSite, "0".repeat(32));
  assert.deepEqual(b.problems, []);
  const sup = b.pages.admin ?? "", pn = b.pages.panel ?? "";
  assert.ok(sup.includes('<body class="pn dp">') && sup.includes('id="dp-data"'), "админка не супер-админка");
  for (const tab of ["'plan'", "'route'", "'map'", "'fleet'", "'int'"]) assert.ok(sup.includes(tab), `в супер-админке нет раздела ${tab}`);
  assert.ok(sup.includes("/panel") && pn.includes("/admin"), "панели не ссылаются друг на друга");
  for (const bad of ["CARGO PRO", "cargoprogroup", "Lider Cargo", "LBM Driver", "CPG-", "Яккасарай", "'cp-"]) {
    assert.ok(!sup.includes(bad) && !pn.includes(bad), `в панелях логистики осталось «${bad}»`);
  }
  assert.ok(sup.includes("'lg-panel-1'") && sup.includes("'lg-req-1'"), "супер-админка не на ключах шаблона");
});

/* Владелец, 13.11.2026: «Для макетов которые делаются через тг бот примени эти новые 2 правила»:
   в браузере Telegram vh прыгает — высоты окна в стилях макета из бота на пикселях. */
test("макет из бота: высоты окна — на --tgvh, скрипт за meta viewport, селекторы Tailwind целы", async () => {
  const { pinViewportUnits, withTelegramFix } = await import("@/lib/proto/instant/telegram");
  assert.equal(
    pinViewportUnits("<style>.min-h-\\[100svh\\]{min-height:100svh}.a{height:1000vh;margin:-50vh 0;top:calc(100vh - 2px)}</style><p>100vh</p>"),
    "<style>.min-h-\\[100svh\\]{min-height:calc(var(--tgvh,1vh)*100)}.a{height:calc(var(--tgvh,1vh)*1000);margin:calc(var(--tgvh,1vh)*-50) 0;top:calc(calc(var(--tgvh,1vh)*100) - 2px)}</style><p>100vh</p>",
  );
  const out = withTelegramFix('<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>a{height:100vh}</style></head><body></body></html>');
  assert.ok(out.indexOf("--tgvh',innerHeight") > out.indexOf('name="viewport"'), "скрипт стоит до meta viewport");
  assert.ok(assetsFile.scene.includes("function tgFix()") && assetsFile.scene.includes("function tgTone()"), "движок пролёта без высоты пикселями и тёмного фона");
});
