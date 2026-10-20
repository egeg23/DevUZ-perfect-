import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as D from "./data.mjs";
import { BASE, ADDONS, ALL, OFFER_HOURS } from "./plan.mjs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";

/*
 * Макет сайта Юсем Тау (usemtau.kz): металлобаза в Алматы и стройка, ru.
 *  - главная (`""`): видео DevUz; первый экран — торцы пакета труб и
 *    арматуры, поиск по каталогу «арматура 12», звонок и WhatsApp; бегущая
 *    строка цен; «сейчас и станет»; каталог плитками с сечениями; калькулятор
 *    металла; заявка снабженца; доставка с машиной; сцена «здание из нашего
 *    каталога»; объекты; гофробалки; сэндвич-панели; расчёт ангара; доверие;
 *    соседи и лучшие; стоимость с допами и отсчётом 48 часов;
 *  - каталог (`katalog`): все 268 позиций, фильтры, вес, сумма, заявка.
 * Позиции, цены за тонну, адрес, телефоны, часы, услуги — с их сайта
 * (data.mjs); тарифы доставки и пример здания — демо, так и подписано.
 *
 * Стили и скрипты общие, в странице вместо них @@S@@, @@J@@, @@B@@. Ссылки —
 * через __PROTO_BASE__, отпечаток ставится при показе зерном из protos.stamp
 * (lib/proto/bundles). Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/usemtau";
const BASEP = "__PROTO_BASE__";
const B = D.BRAND;
const TERMS = "https://devuz.studio/ru/mockup-terms";
const FONTS = "https://fonts.googleapis.com/css2?family=Fira+Sans+Condensed:wght@700&family=Golos+Text:wght@400;700&display=swap";
const read = (f) => readFileSync(DIR + f, "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => grp(n) + " $";
const tg = (n) => grp(n) + " ₸";
const href = (path = "") => BASEP + (path ? "/" + path : "");
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const WA = (text) => `https://wa.me/${B.wa}?text=${encodeURIComponent(text)}`;

/* ── Иконки: контуры 24×24 ───────────────────────────────────────────── */
const S = 'fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  arrow: `<path d="M5 12h14M13 6l6 6-6 6" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  plus: `<path d="M12 5v14M5 12h14" ${S}/>`,
  minus: `<path d="M5 12h14" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" ${S}/>`,
  search: `<circle cx="11" cy="11" r="6.5" ${S}/><path d="m16 16 4 4" ${S}/>`,
  phone: `<path d="M5 4.5h3.5l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" ${S}/>`,
  wa: `<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z" ${S}/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .8a5 5 0 0 1-2.7-2.7l.8-1-1-2z" ${S}/>`,
  doc: `<path d="M6 3.5h8l4 4v13H6z" ${S}/><path d="M14 3.5v4h4M9 12h6M9 15.5h6M9 9h2" ${S}/>`,
  mail: `<rect x="3.5" y="5.5" width="17" height="13" rx="2" ${S}/><path d="m4 7 8 6 8-6" ${S}/>`,
  truck: `<path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z" ${S}/><circle cx="7" cy="17.5" r="1.8" ${S}/><circle cx="17.5" cy="17.5" r="1.8" ${S}/>`,
  shield: `<path d="M12 3.5 5 6v5.5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6z" ${S}/><path d="m9 12 2 2 4-4" ${S}/>`,
  factory: `<path d="M3 20V10l5 3V10l5 3V6h4l1 4v10z" ${S}/><path d="M7 16.5h2M11.5 16.5h2" ${S}/>`,
  pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${S}/><circle cx="12" cy="10" r="2.4" ${S}/>`,
  clock: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 7.5V12l3 2" ${S}/>`,
  cut: `<circle cx="6" cy="7" r="2.5" ${S}/><circle cx="6" cy="17" r="2.5" ${S}/><path d="M8 8.5 20 17M8 15.5 20 7" ${S}/>`,
  scale: `<path d="M12 4v16M6 20h12M5 8h14M5 8l-2.5 6a2.5 2.5 0 0 0 5 0zM19 8l-2.5 6a2.5 2.5 0 0 0 5 0z" ${S}/>`,
  list: `<path d="M9 6h11M9 12h11M9 18h11M4.5 6v.01M4.5 12v.01M4.5 18v.01" ${S}/>`,
  repeat: `<path d="M4 12a7 7 0 0 1 12-5l2 2M20 12a7 7 0 0 1-12 5l-2-2" ${S}/><path d="M18 4v5h-5M6 20v-5h5" ${S}/>`,
  copy: `<rect x="8" y="8" width="12" height="12" rx="2" ${S}/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" ${S}/>`,
  layers: `<path d="m12 4 9 4.5-9 4.5-9-4.5z" ${S}/><path d="m3 12.5 9 4.5 9-4.5M3 16.5 12 21l9-4.5" ${S}/>`,
  wave: `<path d="M3 5h18M3 19h18M4 12c2-4 3-4 4 0s2 4 4 0 3-4 4 0 2 4 4 0" ${S}/>`,
  hangar: `<path d="M3 20h18M4 20v-6a8 8 0 0 1 16 0v6" ${S}/><path d="M9.5 20v-5h5v5" ${S}/>`,
  warehouse: `<path d="M3 20V9l9-5 9 5v11" ${S}/><path d="M7 20v-7h10v7M7 16h10" ${S}/>`,
  shop: `<path d="M4 10h16l-1-5H5zM5 10v10h14V10" ${S}/><path d="M10 20v-5h4v5" ${S}/>`,
  sport: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17" ${S}/>`,
  med: `<rect x="4" y="5" width="16" height="15" rx="2" ${S}/><path d="M12 9v7M8.5 12.5h7" ${S}/>`,
  edu: `<path d="m2.5 9 9.5-4.5L21.5 9 12 13.5z" ${S}/><path d="M6.5 11v5c3 2 8 2 11 0v-5" ${S}/>`,
  fun: `<path d="M12 4v4M5.6 6.6l2.8 2.8M18.4 6.6l-2.8 2.8" ${S}/><circle cx="12" cy="15" r="5" ${S}/>`,
  food: `<path d="M7 3.5v17M5 3.5v5a2 2 0 0 0 4 0v-5M16.5 20.5v-17c-2 1-3 4-3 8h3" ${S}/>`,
  hotel: `<path d="M4 20V5h10v15M14 9h6v11M3 20h18" ${S}/><path d="M7 8h1M10 8h1M7 11.5h1M10 11.5h1M7 15h1M10 15h1M17 12.5h.5M17 16h.5" ${S}/>`,
  expo: `<path d="M3 20h18M4 20V9l8-5 8 5v11" ${S}/><path d="M8 20v-6h8v6M12 4v5" ${S}/>`,
  office: `<rect x="5" y="3.5" width="14" height="17" rx="1" ${S}/><path d="M9 7.5h1.5M13.5 7.5H15M9 11h1.5M13.5 11H15M9 14.5h1.5M13.5 14.5H15M10.5 20.5v-3h3v3" ${S}/>`,
  spark: `<path d="M12 3.5c.8 4.2 2.3 5.7 6.5 6.5-4.2.8-5.7 2.3-6.5 6.5-.8-4.2-2.3-5.7-6.5-6.5 4.2-.8 5.7-2.3 6.5-6.5z" ${S}/>`,
  bag: `<path d="M4 7h16l-1.5 13h-13z" ${S}/><path d="M9 10V6a3 3 0 0 1 6 0v4" ${S}/>`,
};
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
  .join("")}${Object.entries(SEC)
  .map(([k, v]) => `<symbol id="s-${k}" viewBox="0 0 64 64">${v}</symbol>`)
  .join("")}<linearGradient id="stl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9EEF3"/><stop offset=".45" stop-color="#A9B4C0"/><stop offset="1" stop-color="#6E7A88"/></linearGradient></defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;

/* ── Сечения проката: чертёж кодом, 64×64. Сталь — градиент #stl. ───── */
const F = 'fill="url(#stl)" stroke="#4A5562" stroke-width="1"';
const SEC = {
  rebar: `<circle cx="32" cy="32" r="17" ${F}/><path d="M18 22l28 20M18 42l28-20" stroke="#4A5562" stroke-width="2.4" stroke-linecap="round" opacity=".5"/><circle cx="32" cy="32" r="17" fill="none" stroke="#4A5562" stroke-width="3" stroke-dasharray="3 4"/>`,
  rhs: `<path d="M12 18h40v28H12zM16 22v20h32V22z" fill-rule="evenodd" ${F}/>`,
  pipe: `<path d="M32 13a19 19 0 1 0 .01 0zM32 18a14 14 0 1 1-.01 0z" fill-rule="evenodd" ${F}/>`,
  plate: `<rect x="6" y="28" width="52" height="8" ${F}/>`,
  angle: `<path d="M14 12h7v31h31v7H14z" ${F}/>`,
  channel: `<path d="M18 10h26v6H24v32h20v6H18z" ${F}/>`,
  ibeam: `<path d="M14 10h36v6H35v32h15v6H14v-6h15V16H14z" ${F}/>`,
  round: `<circle cx="32" cy="32" r="18" ${F}/>`,
  square: `<rect x="15" y="15" width="34" height="34" ${F}/>`,
  flat: `<rect x="8" y="26" width="48" height="12" ${F}/>`,
  coil: `<circle cx="32" cy="32" r="20" fill="none" stroke="url(#stl)" stroke-width="5"/><circle cx="32" cy="32" r="12" fill="none" stroke="url(#stl)" stroke-width="5"/><circle cx="32" cy="32" r="20" fill="none" stroke="#4A5562" stroke-width=".8"/><circle cx="32" cy="32" r="12" fill="none" stroke="#4A5562" stroke-width=".8"/>`,
  wire: `<circle cx="32" cy="32" r="19" fill="none" stroke="url(#stl)" stroke-width="2.4"/><circle cx="32" cy="32" r="15" fill="none" stroke="url(#stl)" stroke-width="2.4"/><circle cx="32" cy="32" r="11" fill="none" stroke="url(#stl)" stroke-width="2.4"/><circle cx="32" cy="32" r="19" fill="none" stroke="#4A5562" stroke-width=".6"/>`,
  mesh: `<path d="M10 16h44M10 32h44M10 48h44M16 10v44M32 10v44M48 10v44" stroke="url(#stl)" stroke-width="3.4"/><path d="M10 16h44M10 32h44M10 48h44M16 10v44M32 10v44M48 10v44" stroke="#4A5562" stroke-width=".6"/>`,
  deck: `<path d="M4 40h8l5-14h10l5 14h8l5-14h10l5 14" fill="none" stroke="url(#stl)" stroke-width="4" stroke-linejoin="round"/><path d="M4 40h8l5-14h10l5 14h8l5-14h10l5 14" fill="none" stroke="#4A5562" stroke-width=".8" stroke-linejoin="round"/>`,
  pvl: `<path d="M8 32l8-10 8 10-8 10zM24 32l8-10 8 10-8 10zM40 32l8-10 8 10-8 10z" fill="none" stroke="url(#stl)" stroke-width="3.4"/><path d="M8 32l8-10 8 10-8 10zM24 32l8-10 8 10-8 10zM40 32l8-10 8 10-8 10z" fill="none" stroke="#4A5562" stroke-width=".6"/>`,
  tread: `<rect x="6" y="32" width="52" height="7" ${F}/><path d="M11 30l4-4M21 26l4 4M31 30l4-4M41 26l4 4M51 30l4-4" stroke="#6E7A88" stroke-width="3" stroke-linecap="round"/>`,
  rod: `<rect x="6" y="28" width="40" height="8" rx="2" fill="#B9A586" stroke="#4A5562"/><rect x="46" y="30" width="12" height="4" ${F}/>`,
};
const sec = (k, c = "") => `<svg class="sec${c ? " " + c : ""}" viewBox="0 0 64 64" aria-hidden="true"><use href="#s-${k}"/></svg>`;

/* ── Данные для скриптов ────────────────────────────────────────────── */
const ITEMS = D.ITEMS.map((x) => [x.id, x.n, x.c, x.p, x.kgm, x.kgm2, x.dims, x.mark, x.bar, x.gost]);
const CATMAP = Object.fromEntries(D.CATS.map((c) => [c.id, c]));

/* Пример здания для сцены: склад 18 × 36 × 7 м, шаг рам 6 м. Металл — их
   позиции и цены за тонну, длины считаем по геометрии. */
const find = (re) => D.ITEMS.find((x) => re.test(x.n));
const BLD = (() => {
  const W = 18, L = 36, H = 7, RISE = 1.5, BAY = 6, NF = L / BAY + 1, slope = Math.hypot(W / 2, RISE);
  const rows = [
    { step: 0, it: find(/^Арматура 12$/), m: NF * 2 * 42, what: "закладные и каркасы фундаментов" },
    { step: 1, it: find(/^Балка 30 ?Ш1$/), m: NF * 2 * H, what: `колонны, ${NF * 2} шт по ${H} м` },
    { step: 2, gofro: true, m: Math.round(NF * 2 * slope), what: `${NF} рам, пролёт ${W} м` },
    { step: 3, it: find(/^Швеллер гнутый 140×60×4$/), m: Math.round(2 * Math.ceil(slope / 1.5) * L), what: "прогоны кровли через 1,5 м" },
    { step: 3, it: find(/^Труба профильная 80×80×3$/), m: 2 * 3 * L + 2 * 3 * W, what: "ригели стен в три ряда" },
    { step: 3, it: find(/^Уголок 63×5$/), m: Math.round(4 * 2 * Math.hypot(BAY, H)), what: "связи в крайних пролётах" },
  ].map((r) => {
    const t = r.it ? (r.m * r.it.kgm) / 1000 : null;
    return { step: r.step, n: r.it ? r.it.n : "Гофробалка, своё производство", m: r.m, t: t && Math.round(t * 100) / 100, sum: t ? Math.round((t * r.it.p) / 1000) * 1000 : null, what: r.what, id: r.it?.id ?? null };
  });
  const walls = 2 * L * H + 2 * (W * H + (W * RISE) / 2);
  const roof = 2 * slope * L;
  return { W, L, H, RISE, BAY, rows, walls: Math.round(walls), roof: Math.round(roof) };
})();
for (const r of BLD.rows) if (!r.n) throw new Error("нет позиции для сцены");


function siteData() {
  return {
    items: ITEMS, cats: D.CATS.map((c) => ({ id: c.id, n: c.n, sec: c.sec })), brand: { phone: B.phone, phoneRaw: B.phoneRaw, wa: B.wa, mail: B.mail, name: B.name },
    cities: D.CITIES, trucks: D.TRUCKS, tariff: D.TARIFF, free: 10, bld: BLD, img: IMG, katalog: href("katalog"),
    offer: { items: ADDONS.map((a) => ({ id: a.id, t: a.t, p: a.price })), base: BASE.promo, baseName: BASE.t, hours: OFFER_HOURS },
  };
}

/* ── Шапка документа ────────────────────────────────────────────────── */
const LD = {
  "@context": "https://schema.org", "@type": "Store", name: "Юсем Тау (Usemtau)", url: "https://usemtau.kz/", telephone: [B.phoneRaw, "+" + B.wa], email: B.mail,
  image: "https://usemtau.kz/wp-content/uploads/2023/07/cropped-icon.png",
  address: { "@type": "PostalAddress", streetAddress: "Бурундайское шоссе 1 км, дом 1В", addressLocality: "Алматы", addressCountry: "KZ" },
  openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "19:00" }],
  areaServed: "Казахстан", priceRange: "₸₸",
};
function headTags(title, desc) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0D1014">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script type="application/ld+json">${json(LD)}</script>`;
}
const logo = () => `<span class="lg"><img src="${IMG}/mark.webp" alt="" width="34" height="34"><b>ЮСЕМ<i>ТАУ</i></b></span>`;

function header(active) {
  const k = active === "katalog";
  const nav = [[k ? href("katalog") : "#katalog", "Каталог"], ["#kalk", "Калькулятор"], ["#dostavka", "Доставка"], ["#stroyka", "Стройка"], ["#angar", "Ангар"], ["#cena", "Стоимость"]];
  return `<p class="demo-strip">Макет DevUz Studio · цены и позиции с usemtau.kz на 20.10.2026 <a href="${href()}#cena">Стоимость</a></p>
<header class="top" id="top"><div class="wrap">
<a class="logo" href="${href()}" aria-label="${B.name}, главная">${logo()}</a>
<nav class="nav" aria-label="Разделы">${nav.map(([u, n], i) => `<a href="${k && i ? href() + u : u}"${k && !i ? ' aria-current="page"' : ""}>${n}</a>`).join("")}</nav>
<div class="top-r"><a class="tel" href="tel:${B.phoneRaw}">${ic("phone")}<span>${B.phone}</span></a>
<a class="btn btn-sm btn-wa" href="${WA("Здравствуйте! Пишу с сайта usemtau.kz")}">${ic("wa")}<span>WhatsApp</span></a>
<button type="button" class="btn btn-sm btn-blue cart-b" data-cart>${ic("list")}<span>Заявка</span><b class="bdg" data-badge hidden>0</b></button></div>
</div></header>`;
}

const head = (kicker, h, lead, cls = "") => `<div class="sec-head rv${cls ? " " + cls : ""}"><span class="kicker">${kicker}</span><h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>`;

/* ── Главная: блоки ─────────────────────────────────────────────────── */
function heroBlock() {
  const chips = ["арматура 12", "труба 40×20", "швеллер 16", "лист 3 мм", "уголок 50", "балка 20Б1"];
  return `<section class="hero" id="hero" data-tone="dark">
<canvas class="ends" id="ends" aria-hidden="true"></canvas>
<div class="wrap hero-in">
<p class="kicker hero-k">${ic("pin")}Склад в Алматы · Бурундайское шоссе 1 км</p>
<h1><span class="h-a">Металлопрокат</span> <span class="h-b">со склада в Алматы.</span> <span class="h-c">Везём по Казахстану, <em>строим здания</em>.</span></h1>
<form class="find" id="find" role="search" action="${href("katalog")}">
<label class="sr" for="q">Поиск по каталогу</label>
<div class="find-f">${ic("search")}<input id="q" name="q" type="search" autocomplete="off" enterkeyhint="search" placeholder="Арматура 12, труба 40×20, лист 3 мм" aria-controls="find-res"><button type="submit" class="btn btn-blue">Найти</button></div>
<div class="find-res" id="find-res" role="listbox" aria-label="Найдено" hidden></div>
<div class="chips">${chips.map((c) => `<button type="button" data-q="${esc(c)}">${c}</button>`).join("")}</div>
</form>
<div class="hero-cta"><a class="btn btn-blue btn-lg" href="tel:${B.phoneRaw}">${ic("phone")}<span>Позвонить</span></a><a class="btn btn-wa btn-lg" href="${WA("Здравствуйте! Нужен металл, подскажите по наличию.")}">${ic("wa")}<span>Написать в WhatsApp</span></a></div>
<ul class="hero-facts"><li><b data-roll="${D.ITEMS.length}">${D.ITEMS.length}</b><span>позиций с ценой за тонну</span></li><li><b>16</b><span>видов проката и электроды</span></li><li><b>пн-пт</b><span>08:00-19:00, оплата на расчётный счёт</span></li></ul>
</div>
<p class="ends-cap" aria-hidden="true">торец пакета: трубы, круг, арматура</p>
</section>`;
}

function marqBlock() {
  const one = D.MARQUEE.map((m) => {
    const x = D.ITEMS.find((i) => i.n.replace(/\s+/g, " ").startsWith(m));
    return `<span>${sec(CATMAP[x.c].sec)}${esc(x.n)}<b>${tg(x.p)}/т</b></span>`;
  }).join("");
  return `<div class="marq" aria-hidden="true"><div class="marq-t">${one}${one}</div></div>`;
}

function nowBlock() {
  return `<section id="seychas"><div class="wrap">
${head("Сейчас и станет", "Что мы увидели <em>на вашем сайте</em>", "Открыли usemtau.kz с телефона, как прораб на объекте, которому срочно нужна арматура и профильная труба.")}
<ol class="nw">${D.NOW.map((r, i) => `<li class="rv" style="--d:${i * 60}ms"><span class="nw-n">${String(i + 1).padStart(2, "0")}</span><p class="nw-was">${esc(r.now)}</p>${ic("arrow", "nw-ar")}<p class="nw-is">${esc(r.next)}</p></li>`).join("")}</ol>
</div></section>`;
}

function catBlock() {
  return `<section id="katalog" data-tone="paper"><div class="wrap">
${head("Каталог", `${D.ITEMS.length} позиций <em>с ценой за тонну</em>`, "Сечение на плитке, цена от, сколько размеров. Нажмите: откроется каталог с фильтрами, весом метра и суммой.")}
<div class="cats">${D.CATS.map((c, i) => `<a class="cat rv" style="--d:${(i % 6) * 40}ms" href="${href("katalog")}#c=${c.id}"><span class="cat-s">${sec(c.sec)}</span><b>${c.n}</b><small>${D.CAT_STATS[c.id].n} ${plural(D.CAT_STATS[c.id].n, "размер", "размера", "размеров")} · от ${tg(D.CAT_STATS[c.id].min)}/т</small></a>`).join("")}</div>
<p class="src">Позиции и цены за тонну: магазин usemtau.kz, 20.10.2026. Вес метра посчитан по ГОСТ, у профильной трубы с точностью около 3%.</p>
</div></section>`;
}
function plural(n, a, b, c) { const m = n % 100, k = n % 10; return m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c; }

function calcBlock() {
  return `<section id="kalk" data-tone="dark"><div class="wrap">
${head("Калькулятор металла", "Метры, штуки и тонны <em>в одну строку</em>", "Выберите прокат и размер, впишите сколько нужно. Вес по ГОСТ, сумма по цене за тонну из вашего каталога.")}
<div class="calc rv">
<div class="calc-l">
<div class="calc-cats" role="radiogroup" aria-label="Вид проката" id="cc-cats"></div>
<label class="fld"><span>Размер</span><select id="cc-size"></select></label>
<div class="calc-mode" role="radiogroup" aria-label="Считать" id="cc-mode"></div>
<label class="fld fld-big"><span id="cc-ql">Сколько метров</span><span class="stp"><button type="button" id="cc-m" aria-label="Меньше">${ic("minus")}</button><input id="cc-q" type="number" inputmode="decimal" min="0" step="any" value="120"><button type="button" id="cc-p" aria-label="Больше">${ic("plus")}</button></span></label>
</div>
<div class="calc-r" aria-live="polite">
<div class="calc-sec" id="cc-sec"></div>
<dl class="calc-out"><div><dt>Вес</dt><dd id="cc-w">0</dd></div><div><dt>Метров</dt><dd id="cc-len">0</dd></div><div><dt>Сумма</dt><dd id="cc-sum">0</dd></div></dl>
<p class="calc-note" id="cc-note"></p>
<button type="button" class="btn btn-blue btn-lg" id="cc-add">${ic("plus")}<span>Добавить в заявку</span></button>
</div></div>
</div></section>`;
}

function snabBlock() {
  const steps = [
    ["list", "Список позиций", "Ищете «арматура 12», добавляете, пишете в метрах, штуках или тоннах: сумма и вес считаются сами."],
    ["cut", "Резка в размер", "«Резать по 3,8 м»: видно, сколько кусков выйдет из хлыста и какой обрезок останется."],
    ["truck", "Доставка", "Город и машина под ваш вес и длину металла. Порог бесплатной доставки виден сразу."],
    ["doc", "Счёт на компанию", "БИН и название: проверяем БИН, собираем счёт и отправляем менеджеру в WhatsApp или на почту."],
  ];
  return `<section id="snab"><div class="wrap">
${head("Заявка снабженца", "Список позиций <em>и счёт без звонка</em>", "Оплата у вас на расчётный счёт переводом. Значит, снабженцу нужен счёт, а не корзина с картой. Попробуйте: добавьте пару позиций и нажмите «Заявка» вверху.")}
<ol class="snab">${steps.map(([i, h, p], k) => `<li class="rv" style="--d:${k * 70}ms"><span class="snab-n">${k + 1}</span>${ic(i)}<b>${h}</b><p>${p}</p></li>`).join("")}</ol>
<div class="snab-demo rv"><div class="sd-doc" id="sd-doc" aria-hidden="true"><div class="sd-h"><b>Счёт на оплату</b><small>ТОО «Юсем Тау» → ваша компания</small></div><div class="sd-rows" id="sd-rows"></div><div class="sd-t"><span>Итого</span><b id="sd-tot">0 ₸</b></div></div>
<div class="sd-r"><p>В заявке сейчас: <b id="sd-cnt">0 позиций</b></p><button type="button" class="btn btn-blue btn-lg" data-cart>${ic("list")}<span>Открыть заявку</span></button><button type="button" class="btn btn-line" id="sd-fill">${ic("plus")}<span>Заполнить примером</span></button></div></div>
</div></section>`;
}

function delivBlock() {
  return `<section id="dostavka" data-tone="paper"><div class="wrap">
${head("Доставка", "Куда, сколько <em>и какая машина</em>", "По вашему сайту: по Казахстану транспортной компанией, при больших объёмах бесплатно. Здесь покупатель сам видит, какая машина нужна под его металл и сколько это стоит.")}
<div class="dv rv">
<div class="dv-l">
<label class="fld"><span>Город</span><select id="dv-city">${D.CITIES.map(([c, km], i) => `<option value="${i}">${c}${km ? ` · ${km} км` : ""}</option>`).join("")}</select></label>
<label class="fld"><span>Вес металла, т <output id="dv-tv">3</output></span><input type="range" id="dv-t" min="0.2" max="20" step="0.1" value="3"></label>
<div class="fld"><span>Самая длинная позиция</span><div class="seg" role="radiogroup" id="dv-len"><button type="button" role="radio" aria-checked="false" data-l="3">до 3 м</button><button type="button" role="radio" aria-checked="true" data-l="6">6 м</button><button type="button" role="radio" aria-checked="false" data-l="11.7">11,7 м</button><button type="button" role="radio" aria-checked="false" data-l="12">12 м</button></div></div>
</div>
<div class="dv-r" aria-live="polite"><div class="truck" id="dv-truck"><svg viewBox="0 0 320 120" aria-hidden="true"><rect class="tr-body" x="8" y="40" width="200" height="50" rx="3"/><g class="tr-load" id="dv-load"></g><path class="tr-cab" d="M212 52h44l26 22v16h-70z"/><rect class="tr-win" x="222" y="58" width="28" height="14" rx="2"/><circle class="tr-wh" cx="52" cy="96" r="12"/><circle class="tr-wh" cx="160" cy="96" r="12"/><circle class="tr-wh" cx="262" cy="96" r="12"/></svg></div>
<dl class="dv-out"><div><dt>Машина</dt><dd id="dv-tn">Борт 5 т</dd></div><div><dt>Рейсов</dt><dd id="dv-trips">1</dd></div><div><dt>Доставка</dt><dd id="dv-cost">0 ₸</dd></div></dl>
<p class="calc-note" id="dv-note"></p></div></div>
<p class="src">Расстояния от Бурундайского шоссе по трассе, округлено. Тарифы демо: впишете свои, и порог бесплатной доставки тоже (здесь от 10 т).</p>
</div></section>`;
}

function buildBlock() {
  const steps = [
    ["Фундаменты", "Разметка, опалубка, каркасы из арматуры 12"],
    ["Колонны", "Балка 30Ш1, ставим краном на анкеры"],
    ["Рамы из гофробалок", "Ваше производство: стенка волной, балка легче"],
    ["Прогоны и связи", "Гнутый швеллер, профильная труба, уголок"],
    ["Сэндвич-панели", "Стены и кровля, монтаж с креплением"],
  ];
  return `<section class="asm" id="stroyka" data-tone="dark"><div class="asm-stick">
<canvas class="asm-cv" id="asm-cv" aria-hidden="true"></canvas>
<div class="asm-ui wrap">
<div class="asm-head"><span class="kicker">Стройка</span><h2>Склад <em>из вашего каталога</em></h2><p class="sub">Листайте: здание ${BLD.W}×${BLD.L} м собирается из тех позиций, что лежат у вас на складе. Металл считается в тоннах и по вашим ценам. Размеры и сечения типовые, точную смету даст инженер.</p></div>
<p class="asm-mob" aria-hidden="true"><span>Металл каркаса</span><span id="asm-mt">0 т</span><b id="asm-ms">0 ₸</b></p>
<ol class="asm-steps">${steps.map(([h, p], i) => `<li data-i="${i}"><b>${h}</b><p>${p}</p></li>`).join("")}</ol>
<div class="asm-led" aria-live="off"><p class="asm-lt">Металл каркаса</p><ul id="asm-rows"></ul><p class="asm-tot"><span>Итого металл</span><b id="asm-t">0 т</b><b id="asm-s">0 ₸</b></p><p class="asm-pan" id="asm-pan">Сэндвич-панели: стены ${grp(BLD.walls)} м², кровля ${grp(BLD.roof)} м²</p></div>
<div class="asm-bar" aria-hidden="true"><i></i></div>
</div></div>
</section>`;
}

function objBlock() {
  const photo = { hangar: "angar", warehouse: "sklad", factory: "prom", sport: "sport" };
  return `<section id="obekty"><div class="wrap">
${head("Что строим", "Двенадцать типов объектов <em>вместо простыни ссылок</em>", "У вас в меню 13 похожих строк «Проектирование и строительство … в Алматы, Астане, Казахстане». Здесь те же объекты карточками: нажал и сразу в расчёт или в WhatsApp.")}
<div class="obj">${D.OBJECTS.map(([k, h, p], i) => photo[k]
    ? `<a class="ob ob-ph rv" style="--d:${(i % 4) * 50}ms" href="${WA(`Здравствуйте! Интересует строительство: ${h.toLowerCase()}.`)}"><img src="${IMG}/${photo[k]}.webp" alt="${esc(h)}: фото с usemtau.kz" loading="lazy" decoding="async" width="640" height="354"><span class="ob-t">${ic(k)}<b>${h}</b><small>${p}</small></span></a>`
    : `<a class="ob rv" style="--d:${(i % 4) * 50}ms" href="${WA(`Здравствуйте! Интересует строительство: ${h.toLowerCase()}.`)}">${ic(k, "ob-i")}<span class="ob-t"><b>${h}</b><small>${p}</small></span>${ic("arrow", "ob-a")}</a>`).join("")}</div>
<p class="src">Фото: страницы услуг usemtau.kz. Своих снимков объектов на сайте нет: пришлите фото построенного, поставим вместо этих.</p>
</div></section>`;
}

function gofroBlock() {
  const wave = Array.from({ length: 13 }, (_, i) => `${i === 0 ? "M" : "Q"}${i === 0 ? "20 60" : `${20 + (i - 0.5) * 40} ${i % 2 ? 30 : 90} ${20 + i * 40} 60`}`).join(" ");
  return `<section id="gofro" data-tone="paper"><div class="wrap gf">
<div class="gf-t">${head("Своё производство", "Гофробалки <em>и гнутый швеллер</em>", "")}
<p class="rv">Стенка балки не плоская, а волной. Волна держит нагрузку, поэтому стенку делают тоньше: металла уходит меньше, а жёсткость выше. Монтаж быстрый, без сложной сборки на месте.</p>
<ul class="gf-l rv"><li>${ic("wave")}<span><b>Меньше металла</b><small>Низкая металлоёмкость при той же нагрузке</small></span></li><li>${ic("shield")}<span><b>Жёсткая</b><small>Большой пролёт без промежуточных опор</small></span></li><li>${ic("clock")}<span><b>Быстрый монтаж</b><small>Без серьёзных затруднений на объекте</small></span></li></ul>
<p class="rv gf-use">Где ставят: стадионы и спортзалы, колледжи, логистические центры, складские комплексы. Гнутый швеллер идёт на каркас и усиление, хорошо варится с другим металлом.</p>
<a class="btn btn-blue" href="${WA("Здравствуйте! Нужны гофробалки, хочу узнать цену и сроки.")}">${ic("wa")}<span>Узнать цену гофробалки</span></a></div>
<div class="gf-v rv"><svg viewBox="0 0 520 150" class="gf-beam" aria-hidden="true"><rect x="10" y="14" width="500" height="12" rx="2" class="gf-fl"/><rect x="10" y="124" width="500" height="12" rx="2" class="gf-fl"/><path d="${wave}" class="gf-web" pathLength="1000"/><path d="M20 60h480" class="gf-flat"/></svg>
<p class="gf-cap"><span><i class="gf-k1"></i>стенка волной</span><span><i class="gf-k2"></i>плоская стенка той же жёсткости толще</span></p>
<img src="${IMG}/gofro.webp" alt="Гофробалки на складе, фото с usemtau.kz" width="640" height="353" loading="lazy" decoding="async"></div>
</div></section>`;
}

function sandBlock() {
  return `<section id="paneli" data-tone="dark"><div class="wrap sp">
<div class="sp-v" id="sp-v" aria-hidden="true"><div class="sp-l sp-1"><span>Сталь с полимерным покрытием</span></div><div class="sp-l sp-2"><span>Утеплитель</span></div><div class="sp-l sp-3"><span>Сталь внутри</span></div><div class="sp-lock"></div></div>
<div class="sp-t">${head("Монтаж сэндвич-панелей", "Стена, утеплитель и отделка <em>одной панелью</em>", "")}
<p class="rv">Подходит для склада, цеха, пристройки и даже жилого дома. Перед монтажом прорабатываем фундамент и его высоту. Привозим панели, разгружаем и монтируем с креплением.</p>
<ul class="sp-l2 rv"><li>${ic("truck")}Доставка и разгрузка на объекте</li><li>${ic("layers")}Монтаж стен и кровли</li><li>${ic("repeat")}Демонтаж старого покрытия без деформации каркаса</li></ul>
<a class="btn btn-wa" href="${WA("Здравствуйте! Нужен монтаж сэндвич-панелей.")}">${ic("wa")}<span>Обсудить монтаж</span></a>
<img src="${IMG}/sendvich.webp" alt="Монтаж сэндвич-панелей, фото с usemtau.kz" width="960" height="529" loading="lazy" decoding="async"></div>
</div></section>`;
}

function hangarBlock() {
  return `<section id="angar"><div class="wrap">
${head("Расчёт ангара", "Размеры ангара <em>за минуту, заявка с ними</em>", "Арочный или прямостенный, как у вас в описании. Площади и панели считаются сразу, стоимость инженер скажет по этим цифрам, а не «перезвоните».")}
<div class="hg rv">
<div class="hg-l">
<div class="seg" role="radiogroup" id="hg-type" aria-label="Тип"><button type="button" role="radio" aria-checked="true" data-v="rect">Прямостенный</button><button type="button" role="radio" aria-checked="false" data-v="arch">Арочный</button></div>
<label class="fld"><span>Ширина, м <output id="hg-wv">18</output></span><input type="range" id="hg-w" min="9" max="36" step="1" value="18"></label>
<label class="fld"><span>Длина, м <output id="hg-lv">36</output></span><input type="range" id="hg-l" min="12" max="96" step="6" value="36"></label>
<label class="fld" id="hg-hf"><span>Высота стен, м <output id="hg-hv">6</output></span><input type="range" id="hg-h" min="4" max="12" step="0.5" value="6"></label>
<label class="fld"><span>Ворота <output id="hg-gv">2</output></span><input type="range" id="hg-g" min="1" max="6" step="1" value="2"></label>
<div class="seg" role="radiogroup" id="hg-warm" aria-label="Стены и кровля"><button type="button" role="radio" aria-checked="true" data-v="1">Сэндвич-панели</button><button type="button" role="radio" aria-checked="false" data-v="0">Профнастил, холодный</button></div>
</div>
<div class="hg-r"><svg viewBox="0 0 400 220" class="hg-svg" id="hg-svg" aria-hidden="true"></svg>
<dl class="hg-out"><div><dt>Площадь пола</dt><dd id="hg-a">0</dd></div><div><dt>Объём</dt><dd id="hg-v">0</dd></div><div><dt>Стены</dt><dd id="hg-ws">0</dd></div><div><dt>Кровля</dt><dd id="hg-rs">0</dd></div></dl>
<a class="btn btn-wa btn-lg" id="hg-go" href="${WA("Здравствуйте! Хочу расчёт ангара.")}">${ic("wa")}<span>Отправить расчёт инженеру</span></a></div>
</div></div></section>`;
}

function trustBlock() {
  return `<section id="sklad" data-tone="paper"><div class="wrap">
${head("Склад и контакты", "Приезжайте <em>или звоните</em>", "")}
<div class="tr">
<div class="tr-map rv"><img src="${IMG}/karkas.webp" alt="Каркас здания, фото с usemtau.kz" width="512" height="340" loading="lazy" decoding="async"><div class="tr-pin">${ic("pin")}<b>${B.addr}</b><a href="${B.map}">Открыть в 2ГИС</a></div></div>
<ul class="tr-l rv">${D.PROMISES.map(([i, h, p]) => `<li>${ic(i)}<span><b>${h}</b><small>${p}</small></span></li>`).join("")}
<li>${ic("clock")}<span><b>${B.hours}</b><small>оплата на расчётный счёт банковским переводом</small></span></li>
<li>${ic("phone")}<span><b><a href="tel:${B.phoneRaw}">${B.phone}</a></b><small>WhatsApp <a href="https://wa.me/${B.wa}">${B.waShow}</a> · <a href="mailto:${B.mail}">${B.mail}</a></small></span></li></ul>
</div>
<p class="src">Всё в этом блоке с вашего сайта. Фото склада, техники и построенных объектов на сайте нет: это первое, что стоит доснять.</p>
</div></section>`;
}

function bestBlock() {
  const rows = [
    ["Стальная Марка", "Алматы", "Калькулятор метров и веса есть, но цены по запросу, корзины нет: счёт присылает менеджер.", "Калькулятор прямо в заявке, сумма по цене за тонну"],
    ["Профи-Дом", "Алматы", "Ориентир цены за тонну и резка, но заказать можно только формой «рассчитать стоимость».", "Резка строкой в заявке, видно куски и обрезок"],
    ["M-Steel Snab", "Алматы", "Прайс по заявке, спецификацию просят прислать в WhatsApp.", "Спецификация собирается на сайте и уходит в WhatsApp сама"],
    ["Трубное Решение", "Астана", "Цена за тонну в прайсе и корзина для сборного заказа.", "Сборный заказ и счёт на компанию по БИН"],
    ["McMaster-Carr", "США", "История заказов и повтор прошлого заказа для снабженца.", "«Повторить прошлую заявку» одной кнопкой"],
    ["Металл Профиль", "Россия", "Калькуляторы кровли, сайдинга, забора рядом с товаром.", "Расчёт ангара по размерам с заявкой инженеру"],
  ];
  return `<section id="sosedi"><div class="wrap">
${head("Разбор рынка", "Что взяли <em>у соседей и у лучших</em>", "Прошли сайты металлобаз Алматы и Астаны и лучших в России и США. Корзины со счётом на компанию нет ни у одной металлобазы Алматы, калькулятор веса только у одной.")}
<div class="best">${rows.map(([n, c, a, b], i) => `<article class="bst rv" style="--d:${i * 60}ms"><header><b>${n}</b><small>${c}</small></header><p>${a}</p><p><strong>У Юсем Тау:</strong> ${b}</p></article>`).join("")}</div>
<p class="src">Подробно, со ссылками на сайты: разбор в нашей папке проекта. Цены соседей не сравниваем: у большинства их на сайте нет.</p>
</div></section>`;
}

function offerBlock() {
  const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}"><span class="sw" aria-hidden="true"></span><span class="kit-t2"><b>${a.t}${a.star ? `<em class="star">берут первым</em>` : ""}</b><small>${a.e}</small></span><span class="kit-pr">+${usd(a.price)}</span></label>`;
  return `<section class="offer" id="cena" data-tone="paper"><div class="wrap">
${head("Предложение DevUz Studio", "Стоимость", `Сайт без допов: ${usd(BASE.promo)} вместо ${usd(BASE.price)}, если начинаем в течение 48 часов. Калькулятор, счёт по БИН, доставка, 1С и остальное идут допами: включайте тумблерами, итог пересчитается.`)}
<div class="kit" id="konstruktor">
<div class="kit-l">
<div class="kit-base"><div><span class="kb-tag">Входит всегда</span><b>${BASE.t}</b><p>${BASE.d}</p><p class="kb-w">Срок: ${BASE.weeks[0]}-${BASE.weeks[1]} недели</p></div><div class="kb-p"><s>${usd(BASE.price)}</s><b>${usd(BASE.promo)}</b><small>48 часов</small></div></div>
<h3 class="kit-g">Допы: включайте то, что нужно металлобазе</h3>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side">
<div class="kit-total" id="kit-total">
<div class="timer" id="timer"><span>Цена ${usd(BASE.promo)} действует<small>48 часов с первого открытия макета</small></span><b id="tm">48:00:00</b></div>
<div class="kt-line"><span>Сайт</span><span><s>${usd(BASE.price)}</s> ${usd(BASE.promo)}</span></div>
<div class="kt-line"><span>Допы · <span id="kit-cnt">0</span></span><span id="kit-add">0 $</span></div>
<div class="kt-sum"><small>Итого</small><b id="kit-total-sum">${usd(BASE.promo)}</b><small>со всеми допами ${usd(ALL)}</small></div>
<button type="button" class="btn btn-line" id="kit-all">Включить всё</button>
<a class="btn btn-blue" href="https://t.me/Devuz_studio_bot?start=usemtau">${ic("arrow")}<span>Обсудить с DevUz Studio</span></a>
<button type="button" class="copy" id="kit-copy">${ic("copy")}Скопировать состав</button>
</div>
<p class="src">Цены допов: середина рынка веб-студий Казахстана и СНГ. Лицензии 1С и amoCRM или Bitrix24, хостинг и SMS компания оплачивает сама.</p>
</div>
</div></section>`;
}

function footer() {
  return `<footer class="foot" data-tone="dark"><div class="wrap">
<div class="cols">
<div>${logo()}<p class="f-d">Металлопрокат со склада в Алматы, доставка по Казахстану, строительство зданий из металлоконструкций. ${B.addr}. ${B.hours}.</p>
<ul class="f-c"><li>${ic("phone")}<a href="tel:${B.phoneRaw}">${B.phone}</a></li><li>${ic("wa")}<a href="https://wa.me/${B.wa}">${B.waShow}</a></li><li>${ic("mail")}<a href="mailto:${B.mail}">${B.mail}</a></li><li>${ic("pin")}<a href="${B.map}">Как доехать: 2ГИС</a></li></ul></div>
<div><b>Разделы</b><ul><li><a href="${href("katalog")}">Каталог металлопроката</a></li><li><a href="${href()}#kalk">Калькулятор металла</a></li><li><a href="${href()}#dostavka">Доставка</a></li><li><a href="${href()}#angar">Расчёт ангара</a></li></ul></div>
<div><b>Данные макета</b><ul><li>Позиции, цены за тонну, адрес, телефоны, часы, услуги: usemtau.kz</li><li>Вес метра: ГОСТ 8239, 8240, 26020 и геометрия сечения</li><li>Тарифы доставки, пример здания, счёт: демо</li></ul></div>
</div>
<div class="rights"><span>Это макет DevUz Studio: так может выглядеть сайт ${B.name}. Заявки и счета работают для показа и никуда, кроме вашего WhatsApp и почты, не уходят.</span><a href="${TERMS}">Условия использования макета</a></div>
</div></footer>`;
}

function cartDrawer() {
  return `<div class="dr" id="dr" hidden role="dialog" aria-modal="true" aria-labelledby="dr-h"><div class="dr-back" data-close></div><div class="dr-in">
<header class="dr-top"><b id="dr-h">Заявка</b><button type="button" class="ib" data-close aria-label="Закрыть">${ic("x")}</button></header>
<div class="dr-body">
<div id="dr-list"></div>
<div class="dr-empty" id="dr-empty"><p>В заявке пусто. Найдите позицию поиском или в каталоге.</p><a class="btn btn-blue" href="${href("katalog")}">Открыть каталог</a><button type="button" class="btn btn-line" id="dr-repeat" hidden>${ic("repeat")}<span>Повторить прошлую заявку</span></button></div>
<div class="dr-more" id="dr-more">
<div class="dr-sec"><b>${ic("truck")}Доставка</b><label class="fld"><span>Город</span><select id="dr-city"><option value="-1">Самовывоз со склада</option>${D.CITIES.map(([c], i) => `<option value="${i}">${c}</option>`).join("")}</select></label><p class="dr-dv" id="dr-dv"></p></div>
<div class="dr-sec"><b>${ic("doc")}Счёт на компанию</b><label class="fld"><span>БИН</span><input id="dr-bin" inputmode="numeric" maxlength="12" autocomplete="off" placeholder="12 цифр"></label><p class="dr-ok" id="dr-binok" aria-live="polite"></p><label class="fld"><span>Компания</span><input id="dr-org" autocomplete="organization" placeholder="ТОО «…»"></label><label class="fld"><span>Телефон</span><input id="dr-tel" type="tel" autocomplete="tel" placeholder="+7"></label></div>
</div></div>
<footer class="dr-foot"><div class="dr-tot"><span id="dr-w">0 т</span><b id="dr-sum">0 ₸</b></div>
<div class="dr-btns"><a class="btn btn-wa" id="dr-wa" href="https://wa.me/${B.wa}">${ic("wa")}<span>Счёт в WhatsApp</span></a><a class="btn btn-line" id="dr-mail" href="mailto:${B.mail}">${ic("mail")}<span>На почту</span></a></div>
<p class="dr-n">Цена за тонну с вашего сайта. Счёт собирает менеджер по этой заявке.</p></footer>
</div></div>
<div id="toast" role="status" aria-live="polite"></div>`;
}

function dock() {
  return `<div class="dock" id="dock"><a class="btn btn-blue" href="tel:${B.phoneRaw}">${ic("phone")}<span>Позвонить</span></a><a class="btn btn-wa" href="${WA("Здравствуйте! Пишу с сайта usemtau.kz")}">${ic("wa")}<span>WhatsApp</span></a><button type="button" class="btn btn-ink cart-b" data-cart>${ic("list")}<span>Заявка</span><b class="bdg" data-badge hidden>0</b></button></div>`;
}

function sitePage() {
  return `<!doctype html>
<html lang="ru">
<head>
${headTags(`${B.name} · металлопрокат в Алматы · макет DevUz Studio`, "Макет сайта Юсем Тау: металлопрокат со склада в Алматы с ценой за тонну, поиск, калькулятор веса, заявка и счёт на компанию по БИН, доставка по Казахстану, строительство ангаров и складов из гофробалок и сэндвич-панелей.")}
<link rel="preload" as="image" href="${IMG}/mark.webp">
<script>document.documentElement.classList.add('js')</script>
@@S@@
</head>
<body class="site">
${dzIntroSolo("ru")}
${sprite()}
<a class="skip" href="#main">К содержанию</a>
${header("")}
<main id="main">
${[heroBlock(), marqBlock(), nowBlock(), catBlock(), calcBlock(), snabBlock(), delivBlock(), buildBlock(), objBlock(), gofroBlock(), sandBlock(), hangarBlock(), trustBlock(), bestBlock(), offerBlock()].join("\n")}
</main>
${footer()}
${dock()}
${cartDrawer()}
<script type="application/json" id="um-data">${json(siteData())}</script>
<script src="${IMG}/gsap.min.js"></script>
<script src="${IMG}/ScrollTrigger.min.js"></script>
@@J@@
@@B@@
</body>
</html>`;
}

function katalogPage() {
  return `<!doctype html>
<html lang="ru">
<head>
${headTags(`Каталог металлопроката · ${B.name} · макет DevUz Studio`, "Каталог Юсем Тау: арматура, трубы, профильная труба, листы, уголок, швеллер, балка, круг, сетка и другие позиции с ценой за тонну, весом метра по ГОСТ и заявкой на счёт.")}
<script>document.documentElement.classList.add('js')</script>
@@S@@
</head>
<body class="site kat">
${sprite()}
<a class="skip" href="#main">К содержанию</a>
${header("katalog")}
<main id="main" class="kt">
<div class="wrap">
<div class="kt-head"><p class="kicker"><a href="${href()}">Главная</a> · Каталог</p><h1>Металлопрокат <em>со склада в Алматы</em></h1><p class="sub">${D.ITEMS.length} позиций, цена за тонну как на usemtau.kz. У каждой вес метра по ГОСТ, сколько метров в тонне и сумма на ваше количество.</p></div>
<div class="kt-grid">
<aside class="kt-side" aria-label="Виды проката"><nav class="kt-cats" id="kt-cats"><button type="button" data-c="" aria-pressed="true"><span class="kt-ci">${ic("list")}</span>Все<small>${D.ITEMS.length}</small></button>${D.CATS.map((c) => `<button type="button" data-c="${c.id}" aria-pressed="false">${sec(c.sec)}${c.n}<small>${D.CAT_STATS[c.id].n}</small></button>`).join("")}</nav></aside>
<div class="kt-main">
<div class="kt-bar">
<div class="find-f kt-find">${ic("search")}<label class="sr" for="kq">Поиск по каталогу</label><input id="kq" type="search" autocomplete="off" enterkeyhint="search" placeholder="Арматура 12, труба 40×20"></div>
<div class="kt-f"><div class="seg seg-s" role="radiogroup" id="kt-mark" aria-label="Марка стали"><button type="button" role="radio" aria-checked="true" data-v="">Любая марка</button><button type="button" role="radio" aria-checked="false" data-v="Ст3сп/пс">Ст3сп/пс</button><button type="button" role="radio" aria-checked="false" data-v="09Г2С">09Г2С</button></div>
<label class="fld fld-in"><span>Размер от</span><input id="kt-min" type="number" inputmode="decimal" min="0" placeholder="мм"></label><label class="fld fld-in"><span>до</span><input id="kt-max" type="number" inputmode="decimal" min="0" placeholder="мм"></label>
<label class="fld fld-in"><span>Длина хлыста</span><select id="kt-bar"><option value="">любая</option><option value="6">6 м</option><option value="11.7">11,7 м</option><option value="12">12 м</option><option value="0">бухта, лист</option></select></label>
<label class="fld fld-in"><span>Порядок</span><select id="kt-sort"><option value="">как в каталоге</option><option value="p">дешевле за тонну</option><option value="s">по размеру</option></select></label></div>
<p class="kt-cnt" id="kt-cnt" aria-live="polite"></p>
</div>
<div class="kt-list" id="kt-list"></div>
<p class="src">Длина хлыста типовая для проката: 11,7 м у арматуры и уголка, 6 м у труб, 12 м у балок. У вас на складе может быть иначе: впишем ваши. Вес метра по ГОСТ, у профильной трубы с точностью около 3%.</p>
</div></div></div>
</main>
${footer()}
${dock()}
${cartDrawer()}
<script type="application/json" id="um-data">${json(siteData())}</script>
@@J@@
</body>
</html>`;
}

const out = { "": sitePage(), katalog: katalogPage() };
const parts = {
  S: `<style>${min(read("site.css"))}</style>`,
  J: `<script>\n${strip(read("site.js"))}</script>`,
  B: `<script>\n${strip(read("build.js"))}</script>`,
};
const fill = (page) => Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), page);

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "usemtau.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(главная)").padEnd(12), fill(v).length);
console.log("здание:", JSON.stringify(BLD.rows.map((r) => [r.n, r.m, r.t, r.sum])));
