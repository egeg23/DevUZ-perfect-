import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { F, DISTRICTS, TYPES, BC, METRO, LOGOS, REVIEWS, NOW, MECH, FAQ } from "./data.mjs";
import { BASE, ADDONS, ALL, OFFER_HOURS, RATE } from "./plan.mjs";

/*
 * Макет главной Soffice (soffice.uz): аренда офисов в 18 бизнес-центрах
 * Ташкента. Одна страница на трёх языках: ru (главный), uz (латиница), en.
 * Задача владельца DevUz, 19.10.2026: «хотят посмотреть на макет главной
 * страницы», показывать будут на большом экране на встрече.
 *
 *   0. видео DevUz поверх страницы (dzIntroSolo), потом сразу сайт;
 *   1. первый экран: их башни во весь экран, «Офис в Nest One» с именем
 *      башни, которое сменяется вместе с кадром, и подбор «площадь → район
 *      или БЦ → бюджет в месяц» с живым ответом «подходят N бизнес-центров»;
 *   2. бегущая строка логотипов арендаторов;
 *   3. карта Ташкента со всеми БЦ (своя, SVG): метро, районы, карточка БЦ;
 *   4. каталог 18 БЦ с фильтрами, суммой в месяц за вашу площадь и сравнением;
 *   5. калькулятор «Сколько это в месяц»: с НДС и без, в месяц и в год;
 *   6. схема этажа Platform со свободными блоками (механика invis);
 *   7. просмотр в два нажатия: день и время, сообщение менеджеру готово;
 *   8. доверие: цифры, отзывы, вопросы;
 *   9. «Сейчас и станет» по их сайту и механики, которых нет в Ташкенте;
 *  10. стоимость сайта с допами и отсчётом 48 часов (plan.mjs).
 *
 * Всё о компании — с soffice.uz (data.mjs). Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/soffice";
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const CSS = strip(readFileSync(DIR + "style.css", "utf8")).replace(/\n\s*/g, "").replace(/__IMG__/g, IMG);
const JS = strip(readFileSync(DIR + "site.js", "utf8")).replace(/\n\s*\n/g, "\n");
const BASE_URL = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Manrope:wght@700&family=Onest:wght@400;700&display=swap";
const LANGS = ["ru", "uz", "en"];
const KEY = { ru: "", uz: "uz", en: "en" };

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l) => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/";
const T = (l) => (ru, uz, en) => (l === "ru" ? ru : l === "uz" ? uz : en);
const nb = (n, l) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, l === "en" ? "," : "\u00a0");
const usd = (n) => `${nb(n, "ru")}\u00a0$`;
const sumW = (l) => T(l)("сум", "so‘m", "UZS");
const rateTxt = (r, l) => (l === "en" ? `from ${nb(r, l)} UZS per m² a month` : T(l)(`от ${nb(r, l)} сум за м² в месяц`, `m² uchun oyiga ${nb(r, l)} so‘mdan`, ""));
const areaTxt = (b, l) => {
  const t = T(l);
  if (b.min == null) return t("площадь по запросу", "maydon so‘rov bo‘yicha", "size on request");
  if (b.max == null) return t(`от ${nb(b.min, l)} м²`, `${nb(b.min, l)} m² dan`, `from ${nb(b.min, l)} m²`);
  return `${nb(b.min, l)}-${nb(b.max, l)} ${t("м²", "m²", "m²")}`;
};

/* ── Карта: проекция широты и долготы на схему 1000×900 ─────────────── */
const LON0 = 69.236, LON1 = 69.338, LAT0 = 41.274, LAT1 = 41.343;
const MW = 1000, MH = 900;
const xy = ([la, lo]) => [((lo - LON0) / (LON1 - LON0)) * MW, ((LAT1 - la) / (LAT1 - LAT0)) * MH];
const pts = (list) => list.map((p) => xy(p).map((v) => v.toFixed(1)).join(",")).join(" ");
/* Линии метро схемой: через станции со страниц БЦ и соседние. */
const LINES = [
  { c: "#d9534a", p: [[41.3045, 69.236], [41.3098, 69.2465], [41.3058, 69.2712], [41.3111, 69.2797], [41.3158, 69.2965], [41.3205, 69.3165], [41.3235, 69.338]] },
  { c: "#4a86d9", p: [[41.3215, 69.236], [41.3115, 69.2445], [41.3035, 69.2652], [41.2992, 69.2695], [41.2965, 69.2735], [41.2908, 69.2878], [41.2945, 69.3205], [41.2985, 69.338]] },
  { c: "#3fae6e", p: [[41.2972, 69.2742], [41.3125, 69.2808], [41.3248, 69.285], [41.3328, 69.2848], [41.343, 69.2875]] },
];
const AREAS = [
  ["shayhantahur", [41.3245, 69.2535]], ["yunusabad", [41.3375, 69.3045]], ["mirabad", [41.2865, 69.2985]], ["yakkasaray", [41.2785, 69.2565]], ["yashnabad", [41.3058, 69.3235]],
];

/* ── Иконки: линейные, одна толщина ─────────────────────────────────── */
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4 2-15Z"/><path d="m9 13 9-6"/>'),
  wa: I('<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2Z"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  search: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  metro: I('<path d="M4 18 8.5 6l3.5 8 3.5-8L20 18"/><path d="M3 18h4M17 18h4"/>'),
  car: I('<path d="M4 16v-4l2-5h12l2 5v4"/><path d="M3 16h18v3H3z"/><circle cx="7.5" cy="13" r=".8"/><circle cx="16.5" cy="13" r=".8"/>'),
  area: I('<path d="M4 4h16v16H4z"/><path d="M4 9h5V4M15 20v-5h5"/>'),
  eye: I('<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  menu: I('<path d="M4 8h16M4 16h16"/>'),
  check: I('<path d="m5 12.5 4.5 4.5L19 7"/>'),
  cmp: I('<path d="M4 6h7v12H4zM13 6h7v12h-7z"/>'),
  cal: I('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  clock: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  ext: I('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  shield: I('<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z"/><path d="m9 12 2 2 4-4"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  bolt: I('<path d="M13 3 5 13h6l-1 8 8-10h-6Z"/>'),
};

const HERO = ["nestone", "trilliant", "forum", "sapphire"];
const byId = Object.fromEntries(BC.map((b) => [b.id, b]));
const NAV = [
  ["karta", ["Карта", "Xarita", "Map"]],
  ["katalog", ["Бизнес-центры", "Biznes-markazlar", "Buildings"]],
  ["raschet", ["Сколько в месяц", "Oyiga qancha", "Monthly cost"]],
  ["etazh", ["Этаж", "Qavat", "Floor plan"]],
  ["prosmotr", ["Просмотр", "Ko‘rish", "Viewing"]],
  ["otzyvy", ["Отзывы", "Fikrlar", "Reviews"]],
];
const navName = (n, l) => n[LANGS.indexOf(l)];
const hello = (l) => T(l)("Здравствуйте! Ищу офис в аренду. Подскажите, что есть свободного?", "Assalomu alaykum! Ijaraga ofis qidiryapman. Bo‘sh nima bor?", "Hello! I am looking for an office to rent. What do you have available?");
const waHref = (text) => `${F.wa}?text=${encodeURIComponent(text)}`;
const ours = (l) => `<span class="ours">${T(l)("Предложение DevUz Studio", "DevUz Studio taklifi", "DevUz Studio proposal")}</span>`;
const findBtn = (l, cls) => `<a class="btn btn-or ${cls}" href="#katalog" data-go>${ICON.search}<span>${T(l)("Подобрать офис", "Ofis tanlash", "Find an office")}</span></a>`;

/* ── Шапка и меню ──────────────────────────────────────────────────── */
function headerHtml(l) {
  const t = T(l);
  return `<header class="top" id="top"><div class="top-in">
<a class="logo" href="${href(l)}" aria-label="Soffice"><img src="${IMG}/logo.webp" alt="Soffice" width="574" height="127"></a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar", "Sections")}">${NAV.map(([id, n]) => `<a href="#${id}">${navName(n, l)}</a>`).join("")}</nav>
<div class="top-r"><div class="lang">${LANGS.map((x) => `<a href="${href(x)}" hreflang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<a class="top-ph" href="tel:${F.phone}">${F.phoneT}</a>
${findBtn(l, "btn-sm top-cta")}
<button type="button" class="ic-btn" id="menu-btn" aria-expanded="false" aria-controls="menu" aria-label="${t("Меню", "Menyu", "Menu")}">${ICON.menu}</button></div>
</div></header>`;
}

function menuHtml(l) {
  const t = T(l);
  return `<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="${t("Меню", "Menyu", "Menu")}" hidden>
<button type="button" class="ic-btn mn-x" data-close aria-label="${t("Закрыть", "Yopish", "Close")}">${ICON.close}</button>
<nav class="mn-list" aria-label="${t("Разделы", "Bo‘limlar", "Sections")}">${NAV.map(([id, n], i) => `<a class="mn-i" href="#${id}"><span class="mn-n">0${i + 1}</span><span class="mn-t">${navName(n, l)}</span></a>`).join("")}</nav>
<div class="mn-side"><div class="lang">${LANGS.map((x) => `<a href="${href(x)}" hreflang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<a class="btn btn-line" href="tel:${F.phone}">${ICON.phone}<span>${F.phoneT}</span></a>
<a class="btn btn-line" href="${F.tg}" data-tg="${esc(hello(l))}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Менеджер в Telegram", "Telegramda menejer", "Manager on Telegram")}</span></a></div>
</div>`;
}

/* ── 1. Первый экран ───────────────────────────────────────────────── */
function heroBlock(l) {
  const t = T(l);
  const opts = Object.entries(DISTRICTS).map(([k, d]) => `<option value="d:${k}">${t(`${d.ru} район`, `${d.uz} tumani`, `${d.en} district`)}</option>`).join("");
  const bcs = BC.map((b) => `<option value="b:${b.id}">${b.n}</option>`).join("");
  const name = (id) => (l === "uz" ? `${byId[id].n}’da` : byId[id].n);
  return `<section class="hero" id="hero" aria-label="${t("Подбор офиса", "Ofis tanlash", "Office finder")}">
<div class="hr-media" aria-hidden="true">${HERO.map((id, i) => `<picture class="hr-img${i === 0 ? " on" : ""}"><source media="(max-width: 700px)" srcset="${IMG}/h-${id}-m.webp"><img src="${IMG}/h-${id}-1600.webp" srcset="${IMG}/h-${id}-900.webp 900w, ${IMG}/h-${id}-1600.webp 1600w" sizes="100vw" alt="" width="1600" height="937"${i ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async"></picture>`).join("")}<div class="hr-shade"></div></div>
<div class="hr-in">
<div class="hr-l">
<p class="kicker rise" style="--d:0ms">${t("Управляющая компания · Global Property Group", "Boshqaruv kompaniyasi · Global Property Group", "Property manager · Global Property Group")}</p>
<h1 class="hr-h"><span class="ln"><span>${t("Офис", "Ofis", "An office")}</span></span><span class="ln"><span class="hr-roll" aria-hidden="true">${HERO.map((id, i) => `<b${i === 0 ? ' class="on"' : ""}>${t("в ", "", "in ")}${name(id)}</b>`).join("")}</span><span class="vh">${t("в 18 бизнес-центрах Ташкента", "Toshkentdagi 18 ta biznes-markazda", "in 18 Tashkent business centres")}</span></span></h1>
<p class="hr-lead rise" style="--d:380ms">${t("и ещё в 14 бизнес-центрах Ташкента. Напрямую от управляющей компании, без комиссий. Подберём за день.", "va Toshkentdagi yana 14 ta biznes-markazda. To‘g‘ridan to‘g‘ri boshqaruv kompaniyasidan, komissiyasiz. Bir kunda tanlab beramiz.", "and 14 more business centres in Tashkent. Direct from the managing company, no commission. We will shortlist within a day.")}</p>
<ul class="hr-facts rise" style="--d:480ms"><li><b>1000+</b><span>${t("арендаторов", "ijarachi", "tenants")}</span></li><li><b>220&nbsp;000</b><span>${t("м² под управлением", "m² boshqaruvda", "m² managed")}</span></li><li><b>${t("с 2020", "2020 dan", "since 2020")}</b><span>${t("на рынке", "bozorda", "in business")}</span></li></ul>
</div>
<form class="finder rise" id="finder" style="--d:260ms" aria-label="${t("Быстрый подбор", "Tez tanlash", "Quick search")}" novalidate>
<p class="fd-h">${t("Подбор офиса за минуту", "Bir daqiqada ofis tanlash", "Find an office in a minute")}</p>
<label class="fd-row"><span class="fd-k"><i>1</i>${t("Площадь", "Maydon", "Size")}</span><span class="fd-v"><output class="num" id="fd-area-o">100</output> ${t("м²", "m²", "m²")}</span><input type="range" id="fd-area" min="0" max="100" step="1" value="50" aria-label="${t("Площадь, м²", "Maydon, m²", "Size, m²")}"></label>
<div class="fd-chips" role="group" aria-label="${t("Быстрый выбор площади", "Maydonni tez tanlash", "Quick size")}">${[50, 100, 300, 500, 1000].map((a) => `<button type="button" class="chip-s" data-area="${a}">${a === 1000 ? "1000+" : a}</button>`).join("")}</div>
<label class="fd-row"><span class="fd-k"><i>2</i>${t("Район или бизнес-центр", "Tuman yoki biznes-markaz", "District or building")}</span><select id="fd-where"><option value="">${t("Весь Ташкент", "Butun Toshkent", "All of Tashkent")}</option><optgroup label="${t("Районы", "Tumanlar", "Districts")}">${opts}</optgroup><optgroup label="${t("Бизнес-центры", "Biznes-markazlar", "Buildings")}">${bcs}</optgroup></select></label>
<label class="fd-row"><span class="fd-k"><i>3</i>${t("Бюджет в месяц, до", "Oylik byudjet, gacha", "Monthly budget, up to")}</span><span class="fd-v"><output class="num" id="fd-budget-o">40</output> ${t("млн сум", "mln so‘m", "m UZS")}</span><input type="range" id="fd-budget" min="0" max="100" step="1" value="45" aria-label="${t("Бюджет в месяц", "Oylik byudjet", "Monthly budget")}"></label>
<p class="fd-res" aria-live="polite"><b class="num" id="fd-n">9</b> <span id="fd-n-w">${t("бизнес-центров подходят", "ta biznes-markaz mos", "buildings match")}</span><small id="fd-min"></small></p>
<div class="fd-dots" id="fd-dots" aria-hidden="true">${BC.map((b) => `<i data-id="${b.id}"></i>`).join("")}</div>
${findBtn(l, "btn-lg fd-go")}
<p class="fd-note">${t("или позвоните:", "yoki qo‘ng‘iroq qiling:", "or call:")} <a href="tel:${F.phone}">${F.phoneT}</a></p>
</form>
</div>
<div class="hr-now" aria-hidden="true"><span class="hr-num"><b id="hr-i">01</b> / 0${HERO.length}</span><span class="hr-name" id="hr-name">${byId[HERO[0]].n} · ${t("класс", "sinf", "class")} ${byId[HERO[0]].cls}</span><span class="hr-bars">${HERO.map((_, i) => `<i${i === 0 ? ' class="on"' : ""}></i>`).join("")}</span></div>
</section>`;
}

/* ── 2. Логотипы арендаторов ───────────────────────────────────────── */
function logosBlock(l) {
  const t = T(l);
  const row = LOGOS.map((n, i) => `<li><img src="${IMG}/l-${String(i + 1).padStart(2, "0")}.webp" alt="${esc(n)}" height="40" loading="lazy" decoding="async"></li>`).join("");
  return `<section class="logos" aria-label="${t("Арендаторы Soffice", "Soffice ijarachilari", "Soffice tenants")}">
<p class="lg-h"><b>${t("Арендаторы Soffice", "Soffice ijarachilari", "Soffice tenants")}</b><span>${t("Аренда без комиссий: все объекты в собственности или под прямым управлением", "Komissiyasiz ijara: barcha obyektlar mulk yoki bevosita boshqaruvda", "No commission: every building is owned or directly managed")}</span></p>
<div class="mq" aria-hidden="false"><ul class="mq-in">${row}</ul><ul class="mq-in" aria-hidden="true">${row.replace(/alt="[^"]*"/g, 'alt=""')}</ul></div>
</section>`;
}

/* ── 3. Карта ──────────────────────────────────────────────────────── */
function mapBlock(l) {
  const t = T(l);
  const grid = [];
  for (let x = 50; x < MW; x += 50) grid.push(`M${x} 0V${MH}`);
  for (let y = 50; y < MH; y += 50) grid.push(`M0 ${y}H${MW}`);
  const svg = `<svg class="mp-svg" viewBox="0 0 ${MW} ${MH}" aria-hidden="true" focusable="false">
<path class="mp-grid" d="${grid.join("")}"/>
${AREAS.map(([k, ll]) => { const [x, y] = xy(ll); return `<text class="mp-area" x="${x.toFixed(0)}" y="${y.toFixed(0)}">${DISTRICTS[k][l].toUpperCase()}</text>`; }).join("")}
${LINES.map((ln, i) => `<polyline class="mp-line" style="--i:${i}" stroke="${ln.c}" points="${pts(ln.p)}"/>`).join("")}
${METRO.map((m) => { const [x, y] = xy(m.ll); return `<g class="mp-st"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/><text x="${(x + 10).toFixed(1)}" y="${(y + 7).toFixed(1)}">${m.n[l]}</text></g>`; }).join("")}
</svg>`;
  const pins = BC.map((b, i) => { const [x, y] = xy(b.ll); return `<button type="button" class="pin c-${b.cls.replace("+", "p")}" data-id="${b.id}" style="left:${((x / MW) * 100).toFixed(2)}%;top:${((y / MH) * 100).toFixed(2)}%;--i:${i}" aria-label="${esc(b.n)}"><i></i><span>${b.n}</span></button>`; }).join("");
  return `<section class="sec sec-dark map" id="karta" aria-label="${t("Карта бизнес-центров", "Biznes-markazlar xaritasi", "Building map")}">
<div class="wrap">
<div class="sec-h rv a-up"><p class="kicker">${t("Карта", "Xarita", "Map")} ${ours(l)}</p><h2>${t("18 бизнес-центров на одной карте", "18 ta biznes-markaz bitta xaritada", "18 buildings on one map")}</h2><p class="sub">${t("Нажмите на точку: фото, класс, метро, парковка и сколько будет в месяц за вашу площадь. Яркие точки подходят под подбор сверху.", "Nuqtani bosing: surat, sinf, metro, avtoturargoh va maydoningiz uchun oyiga qancha bo‘lishi. Yorqin nuqtalar yuqoridagi tanlovga mos.", "Tap a dot: photo, class, metro, parking and the monthly cost for your size. Bright dots match the search above.")}</p></div>
<div class="mp">
<div class="mp-box rv a-zoom" id="mp-box">${svg}<div class="mp-pins">${pins}</div>
<ul class="mp-legend"><li><i class="c-Ap"></i>A+</li><li><i class="c-A"></i>A</li><li><i class="c-Bp"></i>B+</li><li><i class="c-B"></i>B</li></ul></div>
<aside class="mp-card" id="mp-card" aria-live="polite"></aside>
</div>
<div class="mp-list" role="group" aria-label="${t("Бизнес-центры", "Biznes-markazlar", "Buildings")}">${BC.map((b) => `<button type="button" class="mp-chip" data-id="${b.id}">${b.n}</button>`).join("")}</div>
<p class="note">${t("Схема, а не навигатор: положение бизнес-центров примерное, по адресу и станции метро.", "Bu sxema, navigator emas: biznes-markazlar joylashuvi taxminiy, manzil va metro bekati bo‘yicha.", "A schematic, not a navigator: building positions are approximate, based on address and metro station.")}</p>
</div>
</section>`;
}

/* ── 4. Каталог ────────────────────────────────────────────────────── */
function catalogBlock(l) {
  const t = T(l);
  const motions = ["a-up", "a-left", "a-zoom", "a-right", "a-tilt", "a-drop"];
  const card = (b, i) => `<article class="bc rv ${motions[i % motions.length]}" data-id="${b.id}" data-d="${b.d}" data-t="${b.t.join(" ")}" data-rate="${b.rate}">
<div class="bc-pic"><img src="${IMG}/b-${b.id}-960.webp" srcset="${IMG}/b-${b.id}-560.webp 560w, ${IMG}/b-${b.id}-960.webp 960w" sizes="(min-width: 1100px) 31vw, (min-width: 700px) 46vw, 92vw" alt="${esc(t(`Бизнес-центр ${b.n} класса ${b.cls}, ${b.a.ru}, ${DISTRICTS[b.d].ru} район Ташкента`, `${b.n} biznes-markazi, ${b.cls} sinf, ${b.a.uz}, Toshkent, ${DISTRICTS[b.d].uz} tumani`, `${b.n} business centre, class ${b.cls}, ${b.a.en}, ${DISTRICTS[b.d].en} district, Tashkent`))}" width="960" height="600" loading="lazy" decoding="async"><span class="cls c-${b.cls.replace("+", "p")}">${b.cls}</span>
<label class="bc-cmp"><input type="checkbox" data-cmp="${b.id}"><span>${ICON.cmp}${t("Сравнить", "Solishtirish", "Compare")}</span></label></div>
<div class="bc-b">
<h3>${b.n}</h3>
<p class="bc-a">${ICON.pin}<span>${b.a[l]} · ${DISTRICTS[b.d][l]}</span></p>
<ul class="bc-f"><li>${ICON.metro}${b.m[l]}</li><li>${ICON.area}${areaTxt(b, l)}</li><li>${ICON.car}${b.p[l]}</li></ul>
<p class="bc-x">${b.x[l]}</p>
<div class="bc-pr"><p class="bc-m"><b class="num" data-month></b><span data-month-w></span></p><p class="bc-r">${rateTxt(b.rate, l)}</p></div>
<div class="bc-btns"><button type="button" class="btn btn-or btn-sm" data-view="${b.id}">${ICON.eye}<span>${t("На просмотр", "Ko‘rishga", "Book a viewing")}</span></button><a class="lnk" href="${F.site}/${l === "ru" ? "" : l + "/"}${b.id}" target="_blank" rel="noopener">${t("Страница БЦ", "BM sahifasi", "Building page")}${ICON.ext}</a></div>
</div>
</article>`;
  const chip = (g, v, label, on) => `<button type="button" class="chip${on ? " on" : ""}" data-f="${g}" data-v="${v}" aria-pressed="${!!on}">${label}</button>`;
  return `<section class="sec catalog" id="katalog" aria-label="${t("Бизнес-центры", "Biznes-markazlar", "Buildings")}">
<div class="wrap">
<div class="sec-h rv a-up"><p class="kicker">${t("Каталог", "Katalog", "Catalogue")}</p><h2>${t("Все бизнес-центры Soffice", "Soffice’ning barcha biznes-markazlari", "All Soffice buildings")}</h2><p class="sub">${t("Под каждым сумма в месяц за площадь из подбора. Отметьте два-три центра и сравните их рядом.", "Har birining ostida tanlovdagi maydon uchun oylik summa. Ikki-uchta markazni belgilang va yonma-yon solishtiring.", "Each card shows the monthly cost for the size you picked. Tick two or three and compare them side by side.")}</p></div>
<div class="flt rv a-up" id="flt">
<div class="flt-g" role="group" aria-label="${t("Район", "Tuman", "District")}">${chip("d", "", t("Все районы", "Barcha tumanlar", "All districts"), true)}${Object.entries(DISTRICTS).map(([k, d]) => chip("d", k, d[l])).join("")}</div>
<div class="flt-g" role="group" aria-label="${t("Формат", "Format", "Format")}">${chip("t", "", t("Любой формат", "Har qanday format", "Any format"), true)}${Object.entries(TYPES).map(([k, d]) => chip("t", k, d[l])).join("")}</div>
<div class="flt-r"><label class="sw-l"><input type="checkbox" id="flt-fit" checked><span class="sw" aria-hidden="true"></span><span>${t("Только по площади и бюджету", "Faqat maydon va byudjet bo‘yicha", "Only within size and budget")}</span></label>
<label class="sel"><span class="vh">${t("Порядок", "Tartib", "Sort")}</span><select id="flt-sort"><option value="price">${t("Сначала дешевле", "Avval arzonroq", "Cheapest first")}</option><option value="cls">${t("Сначала класс A+", "Avval A+ sinf", "Class A+ first")}</option><option value="site">${t("Как на сайте Soffice", "Soffice saytidagidek", "As on soffice.uz")}</option></select></label>
<p class="flt-n" aria-live="polite"><b class="num" id="flt-n">18</b> ${t("из", "/", "of")} 18 · <span id="flt-area"></span></p></div>
</div>
<div class="bcs" id="bcs">${BC.map(card).join("")}</div>
<p class="empty" id="bcs-empty" hidden>${t("Под такой подбор ничего нет. Снимите «Только по площади и бюджету» или напишите менеджеру: бывают блоки, которых нет на сайте.", "Bunday tanlovga hech narsa yo‘q. «Faqat maydon va byudjet bo‘yicha»ni o‘chiring yoki menejerga yozing: saytda yo‘q bloklar ham bo‘ladi.", "Nothing fits. Untick “Only within size and budget” or message a manager: some units are not listed on the site.")}</p>
</div>
</section>`;
}

/* ── 5. Калькулятор ────────────────────────────────────────────────── */
function calcBlock(l) {
  const t = T(l);
  const inc = [
    [ICON.shield, t("Охрана 24/7", "Qo‘riqlash 24/7", "24/7 security")],
    [ICON.eye, t("Ресепшен и доступ в БЦ", "Resepshn va BMga kirish", "Reception and access")],
    [ICON.check, t("Ежедневная уборка", "Har kungi tozalash", "Daily cleaning")],
    [ICON.bolt, t("Связь с управляющей компанией", "Boshqaruv kompaniyasi bilan aloqa", "Direct line to management")],
  ];
  return `<section class="sec sec-paper calc" id="raschet" aria-label="${t("Сколько это в месяц", "Bu oyiga qancha", "What is that per month")}">
<div class="wrap cl">
<div class="cl-l rv a-left">
<p class="kicker">${t("Расчёт", "Hisob", "Calculator")} ${ours(l)}</p>
<h2>${t("Сколько это в месяц", "Bu oyiga qancha", "What is that per month")}</h2>
<p class="sub">${t("На сайте ставка за метр. Арендатору нужна сумма: сколько платить каждый месяц за свой офис.", "Saytda metr narxi turibdi. Ijarachiga summa kerak: o‘z ofisi uchun har oy qancha to‘lashi.", "The site lists a rate per metre. A tenant needs a figure: what the office costs every month.")}</p>
<label class="fld"><span>${t("Бизнес-центр", "Biznes-markaz", "Building")}</span><select id="cl-bc">${BC.map((b) => `<option value="${b.id}"${b.id === "platform" ? " selected" : ""}>${b.n} · ${nb(b.rate, l)} ${sumW(l)}/m²</option>`).join("")}</select></label>
<label class="fld"><span>${t("Площадь", "Maydon", "Size")}: <output class="num" id="cl-area-o">100</output> ${t("м²", "m²", "m²")}</span><input type="range" id="cl-area" min="30" max="1000" step="5" value="100"></label>
<div class="seg" role="radiogroup" aria-label="${t("Ставка на сайте", "Saytdagi stavka", "The listed rate is")}"><span>${t("Ставка указана", "Stavka", "The rate is")}</span><label><input type="radio" name="cl-vat" value="0" checked><span>${t("без НДС", "QQSsiz", "excl. VAT")}</span></label><label><input type="radio" name="cl-vat" value="1"><span>${t("с НДС", "QQS bilan", "incl. VAT")}</span></label></div>
</div>
<div class="cl-r rv a-right">
<div class="cl-big"><small>${t("В месяц", "Oyiga", "Per month")}</small><p><b class="num" id="cl-m">30 000 000</b> <span>${sumW(l)}</span></p><small id="cl-mf"></small></div>
<dl class="cl-rows"><div><dt>${t("С НДС 12%", "QQS 12% bilan", "With 12% VAT")}</dt><dd class="num" id="cl-vat"></dd></div><div><dt>${t("Без НДС", "QQSsiz", "Without VAT")}</dt><dd class="num" id="cl-novat"></dd></div><div><dt>${t("За год с НДС", "Yiliga QQS bilan", "Per year with VAT")}</dt><dd class="num" id="cl-y"></dd></div><div><dt>${t("Ставка", "Stavka", "Rate")}</dt><dd class="num" id="cl-rate"></dd></div></dl>
<p class="cl-inc-h">${t("Уже входит в ставку, по страницам БЦ:", "BM sahifalariga ko‘ra stavkaga kiradi:", "Already in the rate, per building pages:")}</p>
<ul class="cl-inc">${inc.map(([ic, s]) => `<li>${ic}<span>${s}</span></li>`).join("")}</ul>
<div class="cl-btns"><button type="button" class="btn btn-or" id="cl-view">${ICON.eye}<span>${t("Посмотреть этот офис", "Shu ofisni ko‘rish", "View this office")}</span></button></div>
<p class="note">${t("На soffice.uz у ставки не сказано, за месяц ли она и с НДС ли. Здесь считаем «за м² в месяц». Подтвердите, и подпись станет точной.", "soffice.uz’da stavka oyiga ekani va QQS bilanmi yo‘qmi aytilmagan. Bu yerda «m² uchun oyiga» deb hisoblaymiz. Tasdiqlang, va yozuv aniq bo‘ladi.", "soffice.uz does not say whether the rate is monthly or includes VAT. Here we treat it as per m² per month. Confirm it and the label becomes exact.")}</p>
</div>
</div>
</section>`;
}

/* ── 6. Схема этажа Platform ───────────────────────────────────────── */
/* Блоки условные: x, y, ш, в в сетке 100×60, площадь, окна, свободен на 3/4 этаже. */
const UNITS = [
  { n: "01", r: [2, 2, 18, 22], a: 64, w: "n", f: [1, 0] }, { n: "02", r: [20, 2, 14, 22], a: 42, w: "n", f: [0, 1] }, { n: "03", r: [34, 2, 22, 22], a: 96, w: "n", f: [1, 1] },
  { n: "04", r: [56, 2, 14, 22], a: 35, w: "n", f: [1, 0] }, { n: "05", r: [70, 2, 28, 22], a: 150, w: "ne", f: [0, 1] },
  { n: "06", r: [2, 36, 26, 22], a: 120, w: "s", f: [0, 1] }, { n: "07", r: [28, 36, 16, 22], a: 56, w: "s", f: [1, 0] },
  { n: "08", r: [58, 36, 40, 22], a: 210, w: "se", f: [1, 1] },
];
function floorBlock(l) {
  const t = T(l);
  const W = { n: t("на север", "shimolga", "north"), ne: t("на север и восток", "shimol va sharqqa", "north and east"), s: t("на юг", "janubga", "south"), se: t("на юг и восток", "janub va sharqqa", "south and east") };
  const svg = `<svg class="fl-svg" viewBox="0 0 100 60" aria-hidden="true" focusable="false">
<rect class="fl-shell" x="1" y="1" width="98" height="58" rx="1.2"/>
<rect class="fl-cor" x="2" y="25" width="96" height="10"/>
<rect class="fl-core" x="44" y="36" width="14" height="22"/><text class="fl-tx" x="51" y="47.5">${t("лифты", "liftlar", "lifts")}</text>
<text class="fl-tx fl-cx" x="22" y="31">${t("коридор", "yo‘lak", "corridor")}</text>
${UNITS.map((u) => `<g class="fl-u" data-u="${u.n}"><rect x="${u.r[0] + 0.4}" y="${u.r[1] + 0.4}" width="${u.r[2] - 0.8}" height="${u.r[3] - 0.8}" rx=".8"/><text x="${u.r[0] + u.r[2] / 2}" y="${u.r[1] + u.r[3] / 2 - 1}">${u.n}</text><text class="fl-a" x="${u.r[0] + u.r[2] / 2}" y="${u.r[1] + u.r[3] / 2 + 4}">${u.a} m²</text></g>`).join("")}
</svg>`;
  return `<section class="sec sec-dark floor" id="etazh" aria-label="${t("Схема этажа", "Qavat sxemasi", "Floor plan")}">
<div class="fl-bg" aria-hidden="true"><img data-par src="${IMG}/i-open-1280.webp" srcset="${IMG}/i-open-700.webp 700w, ${IMG}/i-open-1280.webp 1280w" sizes="100vw" alt="" width="1280" height="720" loading="lazy" decoding="async"></div>
<div class="wrap">
<div class="sec-h rv a-up"><p class="kicker">${t("Схема этажа", "Qavat sxemasi", "Floor plan")} ${ours(l)}</p><h2>${t("Выберите блок на этаже Platform", "Platform qavatida blokni tanlang", "Pick a unit on a Platform floor")}</h2><p class="sub">${t("Platform, ул. Туркистон, 12А: офисы от 35 до 500 м², потолки 3,5 м. Оранжевые блоки свободны: нажмите, и увидите площадь, окна и сумму в месяц.", "Platform, Turkiston ko‘chasi, 12A: 35 dan 500 m² gacha ofislar, shift 3,5 m. To‘q sariq bloklar bo‘sh: bosing va maydon, derazalar va oylik summani ko‘ring.", "Platform, 12A Turkiston St: offices from 35 to 500 m², 3.5 m ceilings. Orange units are free: tap one to see its size, windows and monthly cost.")}</p></div>
<div class="fl">
<div class="fl-plan rv a-zoom">
<div class="fl-tabs" role="tablist" aria-label="${t("Этаж", "Qavat", "Floor")}"><button type="button" role="tab" class="on" aria-selected="true" data-fl="0">${t("3 этаж", "3-qavat", "Floor 3")}</button><button type="button" role="tab" aria-selected="false" data-fl="1">${t("4 этаж", "4-qavat", "Floor 4")}</button></div>
${svg}
<ul class="fl-legend"><li><i class="free"></i>${t("свободен", "bo‘sh", "free")}</li><li><i class="busy"></i>${t("занят", "band", "taken")}</li><li><i class="pick"></i>${t("выбран", "tanlangan", "selected")}</li></ul>
</div>
<aside class="fl-info rv a-right" id="fl-info" aria-live="polite"><p class="fl-hint">${t("Нажмите на оранжевый блок", "To‘q sariq blokni bosing", "Tap an orange unit")}</p></aside>
</div>
<p class="note">${t("Планировка и свободные блоки условные: схемы всех этажей нарисуем по вашим поэтажным планам, а свободное будет отмечать менеджер.", "Reja va bo‘sh bloklar shartli: barcha qavatlar sxemasini qavat rejalaringiz bo‘yicha chizamiz, bo‘shini esa menejer belgilaydi.", "The layout and free units are illustrative: we draw every floor from your plans, and managers mark what is free.")}</p>
</div>
<script type="application/json" id="fl-data">${JSON.stringify(UNITS.map((u) => ({ n: u.n, a: u.a, w: W[u.w], f: u.f })))}</script>
</section>`;
}

/* ── 7. Просмотр в два нажатия ─────────────────────────────────────── */
function viewBlock(l) {
  const t = T(l);
  const times = ["10:00", "12:00", "15:00", "17:00"];
  return `<section class="sec sec-paper view" id="prosmotr" aria-label="${t("Запись на просмотр", "Ko‘rishga yozilish", "Book a viewing")}">
<div class="wrap vw">
<div class="vw-l rv a-left">
<p class="kicker">${t("Просмотр", "Ko‘rish", "Viewing")} ${ours(l)}</p>
<h2>${t("Посмотреть офис: два нажатия", "Ofisni ko‘rish: ikki bosish", "View an office in two taps")}</h2>
<p class="sub">${t("Выберите день и время. Сообщение менеджеру соберётся само: бизнес-центр, площадь, когда удобно.", "Kun va vaqtni tanlang. Menejerga xabar o‘zi yig‘iladi: biznes-markaz, maydon, qachon qulay.", "Pick a day and a time. The message to the manager writes itself: building, size, when it suits you.")}</p>
<label class="fld"><span>${t("Бизнес-центр", "Biznes-markaz", "Building")}</span><select id="vw-bc"><option value="">${t("Любой, подберите мне", "Istalgan, menga tanlab bering", "Any, shortlist for me")}</option>${BC.map((b) => `<option value="${b.id}">${b.n}</option>`).join("")}</select></label>
<div class="vw-pic" aria-hidden="true"><img data-par src="${IMG}/i-lobby-1280.webp" srcset="${IMG}/i-lobby-700.webp 700w, ${IMG}/i-lobby-1280.webp 1280w" sizes="(min-width: 1000px) 45vw, 92vw" alt="" width="1280" height="720" loading="lazy" decoding="async"></div>
</div>
<div class="vw-card rv a-right">
<p class="vw-k"><i>1</i>${ICON.cal}${t("День", "Kun", "Day")}</p><div class="vw-days" id="vw-days" role="radiogroup" aria-label="${t("День", "Kun", "Day")}"></div>
<p class="vw-k"><i>2</i>${ICON.clock}${t("Время", "Vaqt", "Time")}</p><div class="vw-times" role="radiogroup" aria-label="${t("Время", "Vaqt", "Time")}">${times.map((h) => `<button type="button" class="chip" data-time="${h}" aria-pressed="false">${h}</button>`).join("")}</div>
<pre class="vw-msg" id="vw-msg"></pre>
<div class="vw-btns"><a class="btn btn-or" id="vw-wa" href="${waHref(hello(l))}" target="_blank" rel="noopener">${ICON.wa}<span>${t("Отправить в WhatsApp", "WhatsApp’ga yuborish", "Send on WhatsApp")}</span></a><a class="btn btn-line" id="vw-tg" href="${F.tg}" data-tg="${esc(hello(l))}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Менеджеру в Telegram", "Telegramda menejerga", "Manager on Telegram")}</span></a><a class="btn btn-line" href="tel:${F.phone}">${ICON.phone}<span>${t("Позвонить", "Qo‘ng‘iroq", "Call")}</span></a></div>
<p class="note">${t("WhatsApp откроется с готовым текстом. Для Telegram текст скопируется: вставьте его в чат менеджера t.me/Soffice_cc.", "WhatsApp tayyor matn bilan ochiladi. Telegram uchun matn nusxalanadi: uni t.me/Soffice_cc menejer chatiga qo‘ying.", "WhatsApp opens with the text filled in. For Telegram the text is copied: paste it into the manager chat t.me/Soffice_cc.")}</p>
</div>
</div>
</section>`;
}

/* ── 8. Доверие: цифры, отзывы, вопросы ────────────────────────────── */
function trustBlock(l) {
  const t = T(l);
  const nums = [
    ["1000", "+", t("арендаторов нашли свой офис", "ijarachi o‘z ofisini topdi", "tenants found their office")],
    ["220000", "", t("м² офисов под управлением Soffice", "m² ofis Soffice boshqaruvida", "m² of offices under Soffice management")],
    ["18", "", t("бизнес-центров на сайте, от B до A+", "saytdagi biznes-markazlar, B dan A+ gacha", "buildings on the site, class B to A+")],
    ["2020", "", t("год основания, без комиссий с первого дня", "tashkil topgan yil, birinchi kundan komissiyasiz", "founded, no commission from day one")],
  ];
  return `<section class="sec sec-dark trust" id="otzyvy" aria-label="${t("Отзывы арендаторов", "Ijarachilar fikrlari", "Tenant reviews")}">
<div class="wrap">
<ul class="tr-nums">${nums.map(([n, s, p], i) => `<li class="rv ${["a-up", "a-drop", "a-up", "a-drop"][i]}"><b class="num" data-to="${n}">${nb(n, l)}</b><span class="u">${s}</span><p>${p}</p></li>`).join("")}</ul>
<div class="sec-h rv a-up"><p class="kicker">${t("Отзывы", "Fikrlar", "Reviews")}</p><h2>${t("Что говорят арендаторы", "Ijarachilar nima deydi", "What tenants say")}</h2></div>
<div class="rvs" id="rvs">${REVIEWS.map((r, i) => `<figure class="rw rv ${i % 2 ? "a-right" : "a-left"}"><blockquote>${r.q[l]}</blockquote><figcaption><img src="${IMG}/r-${r.id}.webp" alt="${esc(r.n[l])}" width="160" height="160" loading="lazy" decoding="async"><span><b>${r.n[l]}</b><small>${r.r[l]}</small></span></figcaption></figure>`).join("")}</div>
<div class="faq">${FAQ.map((q, i) => `<details class="rv a-up"${i === 0 ? " open" : ""}><summary>${q[l][0]}</summary><p>${q[l][1]}</p></details>`).join("")}</div>
</div>
</section>`;
}

/* ── 9. Сейчас и станет, механики ──────────────────────────────────── */
function nowBlock(l) {
  const t = T(l);
  return `<section class="sec sec-paper now" id="seychas" aria-label="${t("Сейчас и станет", "Hozir va keyin", "Now and next")}">
<div class="wrap">
<div class="sec-h rv a-up"><p class="kicker">${t("Разбор soffice.uz", "soffice.uz tahlili", "soffice.uz review")} ${ours(l)}</p><h2>${t("Сейчас и станет", "Hozir va keyin", "Now and next")}</h2><p class="sub">${t("Что на сайте мешает арендатору найти офис, и как это решено в этом макете.", "Saytda ijarachiga ofis topishga nima xalaqit beradi va bu maketda qanday hal qilingan.", "What on the current site gets in a tenant’s way, and how this mockup fixes it.")}</p></div>
<ol class="nw">${NOW.map((r, i) => `<li class="rv ${i % 2 ? "a-right" : "a-left"}"><span class="nw-n">0${i + 1}</span><div class="nw-was"><small>${t("Сейчас", "Hozir", "Now")}</small><p>${r[l][0]}</p></div><div class="nw-will"><small>${t("Станет", "Keyin", "Next")}</small><p>${r[l][1]}</p></div></li>`).join("")}</ol>
<div class="sec-h rv a-up mc-h"><p class="kicker">${t("Чего нет у конкурентов в Ташкенте", "Toshkentdagi raqobatchilarda yo‘q", "Missing from Tashkent competitors")}</p><h2>${t("Шесть механик лучших сайтов аренды", "Eng yaxshi ijara saytlarining oltita mexanikasi", "Six mechanics from the best rental sites")}</h2><p class="sub">${t("Сайты бизнес-центров Ташкента показывают ставку за метр и форму заявки. В мире так уже не продают.", "Toshkentdagi biznes-markaz saytlari metr narxi va ariza shaklini ko‘rsatadi. Dunyoda endi bunday sotilmaydi.", "Tashkent building sites show a rate per metre and a contact form. The best in the world no longer sell like that.")}</p></div>
<ul class="mc">${MECH.map((m, i) => `<li class="rv ${["a-up", "a-zoom", "a-tilt", "a-drop", "a-left", "a-right"][i]}"><a href="#${{ find: "hero", map: "karta", calc: "raschet", floor: "etazh", tour: "prosmotr", cmp: "katalog" }[m.k]}"><span class="mc-n">0${i + 1}</span><b>${m[l][0]}</b><p>${m[l][1]}</p><small>${t("Как у", "Namuna:", "As at")} ${m.from}</small></a></li>`).join("")}</ul>
</div>
</section>`;
}

/* ── 10. Стоимость сайта ───────────────────────────────────────────── */
function priceBlock(l) {
  const t = T(l);
  const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}"${a.star ? " checked" : ""}><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}${a.new ? `<em class="star new">${t("нет в Ташкенте", "Toshkentda yo‘q", "not in Tashkent")}</em>` : ""}</b><small>${a[l].e}</small></span><span class="kit-pr num">+${usd(a.price)}</span></label>`;
  return `<section class="sec sec-dark offer" id="cena" aria-label="${t("Стоимость сайта", "Sayt narxi", "Website price")}">
<div class="wrap">
<div class="sec-h rv a-up"><p class="kicker">${ours(l)}</p><h2>${t("Сайт по этому макету", "Shu maket bo‘yicha sayt", "A website built on this mockup")}</h2><p class="sub">${t(`48 часов с момента, как макет пришёл вам, корпоративный сайт стоит ${usd(BASE.promo)} вместо ${usd(BASE.price)}. Механики из макета добавляются тумблерами.`, `Maket sizga kelgan paytdan 48 soat davomida korporativ sayt ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}. Maketdagi mexanikalar tumblerlar bilan qo‘shiladi.`, `For 48 hours after this mockup reached you, the corporate site is ${usd(BASE.promo)} instead of ${usd(BASE.price)}. Mockup features are added with the toggles.`)}</p></div>
<div class="kit" id="kit">
<div class="kit-l">
<div class="kit-base rv a-up"><div><span class="tag">${t("Входит всегда", "Har doim kiradi", "Always included")}</span><b>${BASE[l].t}</b><p>${BASE[l].d}</p><p class="kb-w">${t(`Срок: ${BASE.weeks[0]}-${BASE.weeks[1]} недель`, `Muddat: ${BASE.weeks[0]}-${BASE.weeks[1]} hafta`, `Timeline: ${BASE.weeks[0]}-${BASE.weeks[1]} weeks`)}</p></div><div class="kb-p"><s>${usd(BASE.price)}</s><b>${usd(BASE.promo)}</b></div></div>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side"><div class="kit-total" id="kit-total">
<div class="timer" id="timer"><span>${t(`Цена ${usd(BASE.promo)} действует`, `${usd(BASE.promo)} narxi amal qiladi`, `The ${usd(BASE.promo)} price holds`)}<small>${t("48 часов с первого открытия макета", "maket birinchi ochilgandan 48 soat", "48 hours from first opening")}</small></span><b class="num" id="tm">48:00:00</b></div>
<div class="kt-line"><span>${BASE[l].t}</span><span><s>${usd(BASE.price)}</s> ${usd(BASE.promo)}</span></div>
<div class="kt-line"><span>${t("Допы", "Qo‘shimchalar", "Add-ons")} · <span id="kit-cnt">0</span></span><span class="num" id="kit-add">0 $</span></div>
<div class="kt-sum"><small>${t("Итого", "Jami", "Total")}</small><b class="num" id="kit-sum">${usd(BASE.promo)}</b><small>${t(`со всеми допами ${usd(ALL)}`, `barcha qo‘shimchalar bilan ${usd(ALL)}`, `with every add-on ${usd(ALL)}`)}</small></div>
<button type="button" class="btn btn-ghost" id="kit-new">${t("Только то, чего нет в Ташкенте", "Faqat Toshkentda yo‘q narsalar", "Only what Tashkent lacks")}</button>
<a class="btn btn-or" href="https://t.me/Devuz_studio_bot?start=soffice" target="_blank" rel="noopener">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish", "Discuss with DevUz Studio")}</span></a>
<button type="button" class="copy" id="kit-copy">${ICON.copy}<span>${t("Скопировать состав", "Tarkibni nusxalash", "Copy the list")}</span></button>
</div>
<p class="note">${t(`Цены допов: по часам работы, ${RATE} $ за час, как у веб-студий Ташкента. Хостинг, съёмку 3D-туров и тарифы CRM Soffice оплачивает сама.`, `Qo‘shimchalar narxi: ish soatlari bo‘yicha, soatiga ${RATE} $, Toshkent veb-studiyalaridagidek. Xosting, 3D-turlarni suratga olish va CRM tariflarini Soffice o‘zi to‘laydi.`, `Add-on prices: by hours of work, ${RATE} $ an hour, as at Tashkent web studios. Hosting, 3D tour filming and CRM plans are paid by Soffice.`)}</p></div>
</div>
</div>
</section>`;
}

/* ── Подвал, док, сравнение ────────────────────────────────────────── */
function footHtml(l) {
  const t = T(l);
  return `<footer class="foot"><div class="wrap">
<div class="ft-cols">
<div><img class="ft-logo" src="${IMG}/logo.webp" alt="Soffice" width="574" height="127" loading="lazy"><p>${t("Аренда офисов в бизнес-центрах Ташкента. Soffice входит в Global Property Group.", "Toshkentdagi biznes-markazlarda ofis ijarasi. Soffice Global Property Group tarkibiga kiradi.", "Office rental in Tashkent business centres. Soffice is part of Global Property Group.")}</p></div>
<div><b>${t("На связи", "Aloqada", "Contact")}</b><ul><li><a href="tel:${F.phone}">${F.phoneT}</a></li><li><a href="mailto:${F.mail}">${F.mail}</a></li><li><a href="${F.tg}" target="_blank" rel="noopener">${t("Менеджер в Telegram", "Telegramda menejer", "Manager on Telegram")}</a> · <a href="${waHref(hello(l))}" target="_blank" rel="noopener">WhatsApp</a></li><li><a href="${F.news}" target="_blank" rel="noopener">${t("Новости в Telegram", "Telegramda yangiliklar", "News on Telegram")}</a> · <a href="${F.ig}" target="_blank" rel="noopener">Instagram</a></li></ul></div>
<div><b>${t("Офис Soffice", "Soffice ofisi", "Soffice office")}</b><ul><li>${F.office[l]}</li></ul></div>
</div>
<div class="rights"><p>${t("Это макет: так может выглядеть главная страница Soffice. Бизнес-центры, адреса, классы, ставки, площади, парковки, фото, отзывы, цифры и контакты взяты с soffice.uz (19.10.2026). Положение на карте примерное, схема этажа и свободные блоки условные. Блоки с пометкой «Предложение DevUz Studio» придумали мы, на сайте их пока нет.", "Bu maket: Soffice bosh sahifasi shunday ko‘rinishi mumkin. Biznes-markazlar, manzillar, sinflar, stavkalar, maydonlar, avtoturargohlar, suratlar, fikrlar, raqamlar va kontaktlar soffice.uz’dan olingan (19.10.2026). Xaritadagi joylashuv taxminiy, qavat sxemasi va bo‘sh bloklar shartli. «DevUz Studio taklifi» belgisi bor bloklarni biz o‘ylab topdik, ular hozircha saytda yo‘q.", "This is a mockup of how the Soffice home page could look. Buildings, addresses, classes, rates, sizes, parking, photos, reviews, figures and contacts come from soffice.uz (19.10.2026). Map positions are approximate; the floor plan and free units are illustrative. Blocks marked “DevUz Studio proposal” are our ideas and are not on the site yet.")}</p><p>${t("Макет принадлежит DevUz Studio. Использовать его можно только по договору:", "Maket DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:", "The mockup belongs to DevUz Studio and may be used only under contract:")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari", "terms of use")}</a></p></div>
</div></footer>`;
}

function cmpHtml(l) {
  const t = T(l);
  return `<div class="cmp-bar" id="cmp-bar" hidden><span id="cmp-n"></span><button type="button" class="btn btn-or btn-sm" id="cmp-open">${ICON.cmp}<span>${t("Сравнить", "Solishtirish", "Compare")}</span></button><button type="button" class="ic-btn" id="cmp-clear" aria-label="${t("Сбросить", "Tozalash", "Clear")}">${ICON.close}</button></div>
<div class="pn-back" id="pn-back" hidden></div>
<aside class="cmp" id="cmp" role="dialog" aria-modal="true" aria-labelledby="cmp-h" hidden><div class="cmp-top"><h2 id="cmp-h">${t("Сравнение бизнес-центров", "Biznes-markazlarni solishtirish", "Compare buildings")}</h2><button type="button" class="ic-btn" data-close aria-label="${t("Закрыть", "Yopish", "Close")}">${ICON.close}</button></div><div class="cmp-in" id="cmp-in"></div></aside>`;
}

/* ── Данные для скрипта ────────────────────────────────────────────── */
function Ls(l) {
  const t = T(l);
  return {
    lang: l,
    tg: F.tg,
    wa: F.wa,
    bc: BC.map((b) => ({ id: b.id, n: b.n, cls: b.cls, d: b.d, dn: DISTRICTS[b.d][l], rate: b.rate, min: b.min, max: b.max, a: b.a[l], m: b.m[l], p: b.p[l], x: b.x[l], area: areaTxt(b, l) })),
    hero: HERO.map((id) => `${byId[id].n} · ${t("класс", "sinf", "class")} ${byId[id].cls}`),
    sum: sumW(l),
    mln: t("млн сум", "mln so‘m", "m UZS"),
    perMonth: t("в месяц за {a} м²", "{a} m² uchun oyiga", "a month for {a} m²"),
    from: t("от", "dan", "from"),
    fitN: t(["бизнес-центр подходит", "бизнес-центра подходят", "бизнес-центров подходят"], ["ta biznes-markaz mos", "ta biznes-markaz mos", "ta biznes-markaz mos"], ["building matches", "buildings match", "buildings match"]),
    fitMin: t("от {s} в месяц", "oyiga {s} dan", "from {s} a month"),
    none: t("Под такой подбор нет: увеличьте бюджет", "Bunday tanlovga yo‘q: byudjetni oshiring", "No match: raise the budget"),
    areaNow: t("за {a} м²", "{a} m² uchun", "for {a} m²"),
    cls: t("Класс", "Sinf", "Class"),
    rate: t("Ставка", "Stavka", "Rate"),
    month: t("В месяц", "Oyiga", "Per month"),
    metro: t("Метро", "Metro", "Metro"),
    parking: t("Парковка", "Avtoturargoh", "Parking"),
    size: t("Площади", "Maydonlar", "Sizes"),
    sizeOne: t("Площадь", "Maydon", "Size"),
    district: t("Район", "Tuman", "District"),
    perM2: t("сум/м²", "so‘m/m²", "UZS/m²"),
    view: t("На просмотр", "Ko‘rishga", "Book a viewing"),
    more: t("В каталоге", "Katalogda", "In catalogue"),
    fitYes: t("подходит под подбор", "tanlovga mos", "matches your search"),
    fitNo: t("вне подбора", "tanlovdan tashqari", "outside your search"),
    cmpN: t("Выбрано для сравнения: {n} из 3", "Solishtirish uchun tanlandi: 3 dan {n}", "Selected to compare: {n} of 3"),
    cmpMax: t("Сравнить можно до трёх", "Uchtagacha solishtirish mumkin", "Up to three can be compared"),
    vatM: t("с НДС: {s}", "QQS bilan: {s}", "with VAT: {s}"),
    perYear: t("{s} в год", "yiliga {s}", "{s} a year"),
    days: t(["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"], ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"], ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
    today: t("Сегодня", "Bugun", "Today"),
    tomorrow: t("Завтра", "Ertaga", "Tomorrow"),
    months: t(["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"], ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"], ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]),
    msg: t("Здравствуйте! Хочу посмотреть офис.\nБизнес-центр: {bc}\nПлощадь: около {a} м²\nКогда: {d}, {h}\nС сайта Soffice", "Assalomu alaykum! Ofisni ko‘rmoqchiman.\nBiznes-markaz: {bc}\nMaydon: taxminan {a} m²\nQachon: {d}, {h}\nSoffice saytidan", "Hello! I would like to view an office.\nBuilding: {bc}\nSize: about {a} m²\nWhen: {d}, {h}\nFrom the Soffice website"),
    anyBc: t("подберите мне", "menga tanlab bering", "please shortlist"),
    pickDay: t("выберите день", "kunni tanlang", "pick a day"),
    pickTime: t("выберите время", "vaqtni tanlang", "pick a time"),
    copied: t("Текст скопирован: вставьте его в чат менеджера Soffice", "Matn nusxalandi: uni Soffice menejeri chatiga qo‘ying", "Text copied: paste it into the Soffice manager chat"),
    unit: t("Блок {n}", "{n}-blok", "Unit {n}"),
    floorN: t(["3 этаж", "4 этаж"], ["3-qavat", "4-qavat"], ["floor 3", "floor 4"]),
    windows: t("Окна", "Derazalar", "Windows"),
    busy: t("Этот блок занят. Свободные отмечены оранжевым.", "Bu blok band. Bo‘shlari to‘q sariq rangda.", "This unit is taken. Free ones are orange."),
    unitView: t("На просмотр этого блока", "Shu blokni ko‘rishga", "View this unit"),
    offer: { items: ADDONS.map((a) => ({ id: a.id, t: a[l].t, p: a.price, n: !!a.new })), base: BASE.promo, baseName: BASE[l].t, hours: OFFER_HOURS, head: t("Сайт Soffice, состав:", "Soffice sayti, tarkibi:", "Soffice website, scope:"), totalW: t("Итого", "Jami", "Total"), copied: t("Скопировано", "Nusxalandi", "Copied"), ended: t("Акция закончилась, цена обычная", "Aksiya tugadi, narx odatiy", "The offer has ended, regular price applies") },
  };
}

/* ── Разметка для поиска: компания и каждый БЦ ─────────────────────── */
function ld(l) {
  const org = { "@type": "Organization", "@id": `${F.site}/#org`, name: F.name, url: F.site, telephone: F.phone, email: F.mail, logo: `${F.site}/logo.png`, parentOrganization: { "@type": "Organization", name: "Global Property Group" }, address: { "@type": "PostalAddress", streetAddress: F.office[l], addressLocality: "Tashkent", addressCountry: "UZ" }, sameAs: [F.tg, F.news, F.ig] };
  const list = BC.map((b) => ({ "@type": "LocalBusiness", name: `${b.n}`, description: `${T(l)("Бизнес-центр класса", "Biznes-markaz, sinf", "Business centre, class")} ${b.cls}`, telephone: F.phone, url: `${F.site}/${b.id}`, address: { "@type": "PostalAddress", streetAddress: b.a[l], addressLocality: "Tashkent", addressRegion: DISTRICTS[b.d][l], addressCountry: "UZ" }, parentOrganization: { "@id": `${F.site}/#org` } }));
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [org, ...list] }).replace(/</g, "\\u003c");
}

function page(l) {
  const t = T(l);
  const dz = dzIntroSolo(l === "en" ? "ru" : l).replace(">Пропустить<", l === "en" ? ">Skip<" : ">Пропустить<");
  const body = [heroBlock, logosBlock, mapBlock, catalogBlock, calcBlock, floorBlock, viewBlock, trustBlock, nowBlock, priceBlock].map((f) => f(l)).join("\n");
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t("Soffice: аренда офисов в 18 бизнес-центрах Ташкента без комиссий", "Soffice: Toshkentdagi 18 ta biznes-markazda komissiyasiz ofis ijarasi", "Soffice: office rental in 18 Tashkent business centres, no commission")}</title>
<meta name="description" content="${t("Офисы, кабинеты, опенспейс и коворкинг в Gross Plaza, Nest One, Trilliant, Forum и ещё 14 бизнес-центрах. Подбор по площади и бюджету, сумма в месяц, просмотр в два нажатия.", "Gross Plaza, Nest One, Trilliant, Forum va yana 14 ta biznes-markazda ofislar, kabinetlar, open space va kovorking. Maydon va byudjet bo‘yicha tanlash, oylik summa, ikki bosishda ko‘rish.", "Offices, private rooms, open space and coworking in Gross Plaza, Nest One, Trilliant, Forum and 14 more buildings. Search by size and budget, monthly cost, two-tap viewings.")}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0f1012">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preload" as="image" href="${IMG}/h-nestone-1600.webp" imagesrcset="${IMG}/h-nestone-900.webp 900w, ${IMG}/h-nestone-1600.webp 1600w" imagesizes="100vw" media="(min-width: 701px)">
<link rel="preload" as="image" href="${IMG}/h-nestone-m.webp" media="(max-width: 700px)">
${LANGS.filter((x) => x !== l).map((x) => `<link rel="alternate" hreflang="${x}" href="${href(x)}">`).join("\n")}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>(function(){var r=document.documentElement;r.classList.add('js');try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)r.classList.add('rm')}catch(e){}})()</script>
<style>${CSS}</style>
<script type="application/ld+json">${ld(l)}</script>
</head>
<body data-lang="${l}">
${dz}
<a class="skip" href="#karta">${t("К содержанию", "Asosiy qismga", "Skip to content")}</a>
${headerHtml(l)}
<main id="main">
${body}
</main>
${footHtml(l)}
<div class="dock" id="dock">${findBtn(l, "dock-go")}<a class="btn btn-glass dock-ic" href="tel:${F.phone}" aria-label="${t("Позвонить", "Qo‘ng‘iroq", "Call")}">${ICON.phone}</a><a class="btn btn-glass dock-ic" href="${waHref(hello(l))}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICON.wa}</a><a class="btn btn-glass dock-ic" href="${F.tg}" data-tg="${esc(hello(l))}" target="_blank" rel="noopener" aria-label="Telegram">${ICON.tg}</a></div>
${cmpHtml(l)}
${menuHtml(l)}
<p class="toast" id="toast" role="status" hidden></p>
<script type="application/json" id="so-data">${JSON.stringify(Ls(l)).replace(/</g, "\\u003c")}</script>
<script src="${IMG}/gsap.min.js" defer></script>
<script src="${IMG}/ScrollTrigger.min.js" defer></script>
<script>
${JS}</script>
</body>
</html>`;
}

const out = Object.fromEntries(LANGS.map((l) => [KEY[l], page(l)]));
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/* Сборка для сервера (lib/proto/bundles): стили и скрипт один раз, в
   страницах вместо них метка @@имя@@. */
const parts = { S: `<style>${CSS}</style>`, J: `<script>\n${JS}</script>` };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const [name, part] of Object.entries(parts)) p = p.split(part).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "soffice.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(6), v.length);
