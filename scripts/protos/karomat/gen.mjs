import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as D from "./data.mjs";
import { APP_UI, PANEL_UI } from "./ui.mjs";
import { BASE, ADDONS, ALL, OFFER_HOURS } from "./plan.mjs";

/*
 * Макет сайта ресторана Karomat (Ташкент, Фозилтепа 10А), uz и ru:
 *  - главная (`""`, `ru`): промо DevUz и их золотой знак; первый экран —
 *    тёмный стол, на который по прокрутке ложатся их блюда, над шурпой пар;
 *    бегущая строка; «сейчас и станет»; меню с фильтрами; заказ в айфоне;
 *    бронь на схеме зала; банкет и той с расчётом по их ценам; QR-меню на
 *    столе; их Shorts; отзывы; что взяли у конкурентов; панель; стоимость;
 *  - приложение гостя (`menu`, `ru/menu`): меню, корзина, заказ, оплата,
 *    статус, бронь, банкет, стол по QR, кабинет;
 *  - панель владельца (`panel`, `ru/panel`).
 * Блюда, цены, фото, адрес, часы, отзывы, видео — их (data.mjs); схема зала,
 * заказы, брони и цифры панели — демо, так и подписано. Главный язык —
 * узбекский, как у них на сайте.
 *
 * Стили и скрипты общие, в странице вместо них @@S@@, @@A@@, @@P@@, @@J@@,
 * @@K@@, @@Q@@. Ссылки — через __PROTO_BASE__, отпечаток ставится при показе
 * зерном из protos.stamp (lib/proto/bundles). Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/karomat";
const BASEP = "__PROTO_BASE__";
const B = D.BRAND.name;
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Prata&family=Onest:wght@400;700&display=swap";
const read = (f) => readFileSync(DIR + f, "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => grp(n) + " $";
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const L2 = (p, l) => (Array.isArray(p) ? (l === "ru" ? p[0] : p[1]) : p);
const href = (l, path = "") => BASEP + (l === "ru" ? "/ru" : "") + (path ? "/" + path : "");
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const sum = (l, n) => grp(n) + " " + T(l)("сум", "so‘m");
const M = Object.fromEntries(D.MENU.map((m) => [m.id, m]));
const dn = (id, l) => L2(M[id].n, l);

/* ── Подписи: каждая, которую зовут скрипты, должна быть на двух языках ── */
/* Ключи, которые скрипты собирают на ходу: t('tag_'+x), t('mo'+n) и т. п. */
const DYN = {
  app: ["tag_veg", "tag_kids", "tag_share", "tag_hit", "lv1", "lv2", "lv3", "bq_st0", "bq_st1", "bq_st2", "bq_st3", ...[0, 1, 2, 3, 4, 5, 6].map((i) => "wd" + i), ...[...Array(12).keys()].map((i) => "mo" + i)],
  panel: ["st0", "st1", "st2d", "st2p", "st2t", "st3d", "st3p", "bq_st0", "bq_st1", "bq_st2", "bq_st3", "k_bday", "k_toy", "k_corp", "k_family", "m_deliv", "m_pick", "m_table", "src_site", "src_app", "src_phone", "src_ig", "f_call", "f_bill", ...["dash", "orders", "books", "banq", "hall", "menu", "dishes"].map((k) => "h_" + k), ...[0, 1, 2, 3, 4, 5, 6].map((i) => "wd" + i)],
};
function dict(src, js, name) {
  const keys = new Set([...js.matchAll(/\bt\('([A-Za-z0-9_]+)'\s*[,)]/g)].map((m) => m[1]));
  for (const k of DYN[name]) keys.add(k);
  for (const k of keys) {
    const v = src[k];
    if (!v || v.length !== 2 || !v[0] || !v[1]) throw new Error(`${name}: нет подписи «${k}» на двух языках`);
  }
  return (l) => Object.fromEntries(Object.entries(src).map(([k, v]) => [k, L2(v, l)]));
}
const APP_JS = read("app.js"), PANEL_JS = read("panel.js");
const appUi = dict(APP_UI, APP_JS, "app"), panelUi = dict(PANEL_UI, PANEL_JS, "panel");

/* ── Иконки: контуры 24×24 ───────────────────────────────────────────── */
const S = 'fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  arrow: `<path d="M5 12h14M13 6l6 6-6 6" ${S}/>`,
  back: `<path d="M19 12H5M11 6l-6 6 6 6" ${S}/>`,
  chev: `<path d="m9 6 6 6-6 6" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  plus: `<path d="M12 5v14M5 12h14" ${S}/>`,
  minus: `<path d="M5 12h14" ${S}/>`,
  bag: `<path d="M5 8h14l-1 12H6z" ${S}/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" ${S}/>`,
  star: `<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" stroke-width="1.6" stroke-linejoin="round"/>`,
  cal: `<rect x="3.5" y="5" width="17" height="15" rx="2.5" ${S}/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h3" ${S}/>`,
  clock: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 7.5V12l3 2" ${S}/>`,
  users: `<circle cx="9" cy="8.5" r="3.3" ${S}/><path d="M3 19.5c.9-3.4 3.2-5 6-5s5.1 1.6 6 5" ${S}/><path d="M15.5 5.5a3.2 3.2 0 0 1 0 6.2M17.5 14.8c1.7.6 2.9 2.1 3.5 4.7" ${S}/>`,
  table: `<ellipse cx="12" cy="9" rx="8.5" ry="3.5" ${S}/><path d="M12 12.5V20M8.5 20h7" ${S}/>`,
  qr: `<rect x="4" y="4" width="6" height="6" rx="1" ${S}/><rect x="14" y="4" width="6" height="6" rx="1" ${S}/><rect x="4" y="14" width="6" height="6" rx="1" ${S}/><path d="M14 14h2v2h-2zM18 14h2M14 18v2M17 17h3v3h-3" ${S}/>`,
  bell: `<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" ${S}/><path d="M10 20.5h4" ${S}/>`,
  receipt: `<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z" ${S}/><path d="M9 8h6M9 11.5h6M9 15h4" ${S}/>`,
  truck: `<path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z" ${S}/><circle cx="7" cy="17.5" r="1.8" ${S}/><circle cx="17.5" cy="17.5" r="1.8" ${S}/>`,
  walk: `<circle cx="13" cy="4.8" r="1.8" ${S}/><path d="M10 21l2-6 2.5 2.5V21M8 12.5l2.5-4.5 3.5 1.5 2 3.5M12.5 8 11 14.5" ${S}/>`,
  pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${S}/><circle cx="12" cy="10" r="2.4" ${S}/>`,
  phone: `<path d="M5 4.5h3.5l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" ${S}/>`,
  play: `<path d="M8 5.5v13l10-6.5z" ${S}/>`,
  ig: `<rect x="4" y="4" width="16" height="16" rx="4.5" ${S}/><circle cx="12" cy="12" r="3.6" ${S}/><circle cx="16.8" cy="7.2" r=".6" ${S}/>`,
  yt: `<rect x="3" y="6" width="18" height="12" rx="3.5" ${S}/><path d="M10.5 9.5v5l4.2-2.5z" ${S}/>`,
  tg: `<path d="M21 4 3 11l6 2 2 6 3-4 5 4z" ${S}/><path d="m9 13 9-7" ${S}/>`,
  card: `<rect x="3" y="5.5" width="18" height="13" rx="2.5" ${S}/><path d="M3 10h18M7 15h4" ${S}/>`,
  cash: `<rect x="3" y="6.5" width="18" height="11" rx="2" ${S}/><circle cx="12" cy="12" r="2.6" ${S}/>`,
  gift: `<rect x="3.5" y="9" width="17" height="11.5" rx="2" ${S}/><path d="M3.5 13h17M12 9v11.5M12 9c-1.6-3.5-5.5-4-5.5-1.5S9.5 9 12 9zm0 0c1.6-3.5 5.5-4 5.5-1.5S14.5 9 12 9z" ${S}/>`,
  user: `<circle cx="12" cy="8.5" r="3.8" ${S}/><path d="M4.5 20c1.3-3.8 4-5.6 7.5-5.6s6.2 1.8 7.5 5.6" ${S}/>`,
  home: `<path d="M4 11 12 4.5l8 6.5V20h-5.5v-5h-5v5H4z" ${S}/>`,
  grid: `<rect x="4" y="4" width="7" height="7" rx="1.5" ${S}/><rect x="13" y="4" width="7" height="7" rx="1.5" ${S}/><rect x="4" y="13" width="7" height="7" rx="1.5" ${S}/><rect x="13" y="13" width="7" height="7" rx="1.5" ${S}/>`,
  list: `<path d="M9 6h11M9 12h11M9 18h11M4.5 6v.01M4.5 12v.01M4.5 18v.01" ${S}/>`,
  chart: `<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" ${S}/>`,
  menu: `<path d="M4 7h16M4 12h16M4 17h16" ${S}/>`,
  full: `<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" ${S}/>`,
  search: `<circle cx="11" cy="11" r="6.5" ${S}/><path d="m16 16 4 4" ${S}/>`,
  stop: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M6 6l12 12" ${S}/>`,
  spark: `<path d="M12 3.5c.8 4.2 2.3 5.7 6.5 6.5-4.2.8-5.7 2.3-6.5 6.5-.8-4.2-2.3-5.7-6.5-6.5 4.2-.8 5.7-2.3 6.5-6.5z" ${S}/>`,
  out: `<path d="M14 4.5h4.5v15H14M10 8l-4 4 4 4M6 12h10" ${S}/>`,
  leaf: `<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" ${S}/><path d="M5 19 13 11" ${S}/>`,
  board: `<rect x="3.5" y="7" width="15" height="10" rx="3" ${S}/><path d="M18.5 12h2.5" ${S}/><circle cx="8" cy="11" r="1.4" ${S}/><circle cx="12.5" cy="13" r="1.4" ${S}/>`,
  bowl: `<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z" ${S}/><path d="M9 7c0-1.2 1-1.6 1-2.8M13 7c0-1.2 1-1.6 1-2.8" ${S}/>`,
  bread: `<path d="M4 13c0-4.5 3.6-7.5 8-7.5s8 3 8 7.5c0 3-3.6 5.5-8 5.5s-8-2.5-8-5.5z" ${S}/><path d="M9 10.5l1 1M12 9.5l1 1M15 10.5l1 1M10.5 13.5l1 1M13.5 13.5l1 1" ${S}/>`,
  kazan: `<path d="M4 10h16l-1.5 7.5a3 3 0 0 1-3 2.5h-7a3 3 0 0 1-3-2.5z" ${S}/><path d="M2.5 10h19M8 6.5c0-1 1-1.5 1-2.5M12 6.5c0-1 1-1.5 1-2.5M16 6.5c0-1 1-1.5 1-2.5" ${S}/>`,
  noodle: `<path d="M3.5 12h17a8.5 7 0 0 1-17 0z" ${S}/><path d="M8 12c0-4 2-7 2-9M12 12c0-4 2-7 2-9" ${S}/>`,
  dome: `<path d="M3 17h18M5 17a7 7 0 0 1 14 0M12 8V6.5M10.5 6.5h3" ${S}/>`,
  skewer: `<path d="M4 20 20 4" ${S}/><rect x="6" y="11" width="4" height="4" rx="1" transform="rotate(-45 8 13)" ${S}/><rect x="10" y="7" width="4" height="4" rx="1" transform="rotate(-45 12 9)" ${S}/><rect x="14" y="3.5" width="3.5" height="3.5" rx="1" transform="rotate(-45 15.7 5.2)" ${S}/>`,
  pizza: `<path d="M12 21 3.5 6a12 12 0 0 1 17 0z" ${S}/><circle cx="11" cy="10" r="1.2" ${S}/><circle cx="13.5" cy="14" r="1.2" ${S}/>`,
  cake: `<path d="M4 20h16v-7H4zM4 15.5c2 1 4-1 6 0s4 1 6 0 3-1 4 0" ${S}/><path d="M12 13V9M12 6.5v.01" ${S}/>`,
  cup: `<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" ${S}/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 6c0-1 1-1.4 1-2.4M11.5 6c0-1 1-1.4 1-2.4" ${S}/>`,
  heart: `<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" ${S}/>`,
  child: `<circle cx="12" cy="6" r="2.6" ${S}/><path d="M8 21v-5l-2-3 3-3.5h6l3 3.5-2 3v5M10 21v-4h4v4" ${S}/>`,
  fire: `<path d="M12 21c-4 0-7-2.7-7-6.5 0-3.6 3-5.6 4-9 2 1.6 3 3.5 3 5.5 1-.6 1.8-1.7 2-3 2.4 2 4 4.3 4 6.5 0 3.8-2.6 6.5-6 6.5z" ${S}/>`,
};
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
  .join("")}</defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;
const logo = (cls = "") => `<span class="lg ${cls}"><img src="${IMG}/logo.webp" alt="" width="40" height="40"><b>KAROMAT</b></span>`;

/* ── Данные для приложения и панели ─────────────────────────────────── */
const dish = (m, l) => ({ id: m.id, cat: m.cat, n: L2(m.n, l), alt: L2(m.n, l === "ru" ? "uz" : "ru"), p: m.price, v: m.v.map((v) => ({ n: L2(v.n, l), p: v.p })), tags: m.tags, d: m.d && l === "uz" ? m.d : "" });
const cats = (l) => D.CATS.map((c) => ({ id: c.id, ic: c.ic, n: L2(c.n, l) }));
const brandL = (l) => ({ name: D.BRAND.full, phone: D.BRAND.phone, phoneRaw: D.BRAND.phoneRaw, ig: D.BRAND.ig, map: D.BRAND.map, addr: L2(D.BRAND.addr, l), hours: L2(D.BRAND.hours, l), open: D.BRAND.open, close: D.BRAND.close, service: D.BRAND.service });
const banq = (l) => ({ per: D.BANQUET.per, items: D.BANQUET.items, extra: D.BANQUET.extra, kinds: D.BANQUET.kinds.map((k) => ({ id: k.id, n: L2(k.n, l) })) });
const STREETS = {
  ru: ["ул. Фозилтепа", "ул. Нурафшон", "массив Чиланзар, 9 квартал", "ул. Бунёдкор", "ул. Катартал", "ул. Мукими", "массив Учтепа", "ул. Лутфий"],
  uz: ["Foziltepa ko‘chasi", "Nurafshon ko‘chasi", "Chilonzor, 9-kvartal", "Bunyodkor shoh ko‘chasi", "Qatortol ko‘chasi", "Muqimiy ko‘chasi", "Uchtepa massivi", "Lutfiy ko‘chasi"],
};
function appData(l) {
  return {
    lang: l, img: IMG, ui: appUi(l), menu: D.MENU.map((m) => dish(m, l)), cats: cats(l), brand: brandL(l), hall: D.HALL, banq: banq(l),
    terms: TERMS(l), site: href(l), other: href(l === "ru" ? "uz" : "ru", "menu"), panel: href(l, "panel"), streets: STREETS[l],
    pays: [{ id: "click", n: "Click" }, { id: "payme", n: "Payme" }, { id: "uzum", n: "Uzum Bank" }, { id: "cash", n: T(l)("Наличными курьеру", "Kuryerga naqd") }],
    hits: D.MENU.filter((m) => m.tags.includes("hit")).map((m) => m.id),
  };
}
function panelData(l) {
  const t = T(l);
  return {
    lang: l, img: IMG, ui: panelUi(l), menu: D.MENU.map((m) => dish(m, l)), cats: cats(l), brand: brandL(l), hall: D.HALL, app: href(l, "menu"),
    guests: t("Азиз К.|Нодира С.|Бобур Т.|Гулнора А.|Шерзод М.|Дилноза Р.|Жасур Х.|Мадина Ю.|Улугбек Н.|Камола Э.|Рустам Б.|Севара Д.", "Aziz K.|Nodira S.|Bobur T.|Gulnora A.|Sherzod M.|Dilnoza R.|Jasur X.|Madina Y.|Ulug‘bek N.|Kamola E.|Rustam B.|Sevara D.").split("|"),
    waiters: t("Отабек|Фаррух|Лола|Сардор", "Otabek|Farrux|Lola|Sardor").split("|"),
    streets: STREETS[l],
    kinds: D.BANQUET.kinds.map((k) => ({ id: k.id, n: L2(k.n, l) })),
  };
}

/* ── Общая шапка документа ──────────────────────────────────────────── */
function headTags(l, title, desc) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#121110">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}
const demoStrip = (l) => {
  const t = T(l);
  return `<p class="demo-strip">${t("Макет DevUz Studio · заказы и брони демо", "DevUz Studio maketi · buyurtma va bronlar demo")} <a href="${href(l)}#narx">${t("Стоимость", "Narxi")}</a></p>`;
};

/* ── Приложение гостя ───────────────────────────────────────────────── */
function appPage(l) {
  const t = T(l);
  const tabs = [["home", "#/", "home", t("Меню", "Menyu")], ["book", "#/book", "table", t("Бронь", "Bron")], ["cart", "#/cart", "bag", t("Корзина", "Savat")], ["me", "#/me", "user", t("Профиль", "Profil")]];
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t(`${B} · меню, заказ и бронь · макет DevUz Studio`, `${B} · menyu, buyurtma va bron · DevUz Studio maketi`), t("Приложение гостя Karomat: меню с фото и ценами, заказ с доставкой и самовывозом, оплата Click, Payme, Uzum, бронь столика на схеме зала, банкет, заказ на стол по QR.", "Karomat mehmon ilovasi: rasm va narxli menyu, yetkazish va olib ketish bilan buyurtma, Click, Payme, Uzum orqali to‘lov, zal sxemasida stol bron qilish, banket, QR orqali stolga buyurtma."))}
@@A@@
</head>
<body class="app" data-lang="${l}">
${sprite()}
<a class="skip" href="#view">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top" id="top">${demoStrip(l)}<div class="hd"><div class="hd-in">
<a class="logo" href="#/" aria-label="${B}">${logo()}</a>
<nav class="hd-nav" aria-label="${t("Разделы", "Bo‘limlar")}"><a href="#/c/all" data-tab="home">${t("Меню", "Menyu")}</a><a href="#/book" data-tab="book">${t("Бронь стола", "Stol bron")}</a><a href="#/banket" data-tab="banket">${t("Банкет", "Banket")}</a><a href="#/me" data-tab="me">${t("Мои заказы", "Buyurtmalarim")}</a></nav>
<button type="button" class="hd-s" data-search>${ic("search")}<span>${t("Шурпа, шашлык, пиде", "Sho‘rva, shashlik, pide")}</span></button>
<div class="lang-s"><a href="${href("uz", "menu")}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a><a href="${href("ru", "menu")}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a></div>
<a href="#/cart" class="hd-cart cart-ic" aria-label="${t("Корзина", "Savat")}">${ic("bag")}<b class="bdg" data-badge="cart" hidden>0</b></a>
</div></div><div class="tbl-bar" id="tbl-bar" hidden></div></header>
<main id="view" tabindex="-1"></main>
<nav class="tabbar" aria-label="${t("Меню", "Menyu")}">${tabs.map(([k, u, i, n]) => `<a href="${u}" data-tab="${k}"${k === "cart" ? ' class="cart-ic"' : ""}>${ic(i)}<span>${n}</span>${k === "cart" ? `<b class="bdg" data-badge="cart" hidden>0</b>` : ""}</a>`).join("")}</nav>
<div id="search" hidden role="dialog" aria-modal="true" aria-label="${t("Поиск", "Qidiruv")}"><div class="sq-top"><form id="sq-form" role="search">${ic("search")}<input id="sq" type="search" enterkeyhint="search" autocomplete="off" placeholder="${t("Шурпа, шашлык, пиде…", "Sho‘rva, shashlik, pide…")}" aria-label="${t("Поиск", "Qidiruv")}"></form><button type="button" class="lnk" id="sq-x">${t("Отмена", "Bekor")}</button></div><div id="sq-res"></div></div>
<div id="sheet" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="km-data">${json(appData(l))}</script>
@@P@@
</body>
</html>`;
}

/* ── Панель ─────────────────────────────────────────────────────────── */
function panelPage(l) {
  const t = T(l);
  const nav = [["dash", "grid", t("Сводка", "Umumiy")], ["orders", "bag", t("Заказы", "Buyurtmalar"), "orders"], ["books", "table", t("Брони", "Bronlar"), "books"], ["banq", "users", t("Банкеты", "Banketlar"), "banq"], ["hall", "qr", t("Зал и QR", "Zal va QR"), "hall"], ["menu", "list", t("Меню и стоп-лист", "Menyu va stop-list")], ["dishes", "chart", t("Популярные блюда", "Mashhur taomlar")]];
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t(`Панель ${B} · макет DevUz Studio`, `${B} paneli · DevUz Studio maketi`), t("Панель ресторана Karomat: заказы, брони по столам, банкеты, зал по QR, стоп-лист, популярные блюда, выручка для владельца.", "Karomat restorani paneli: buyurtmalar, stollar bo‘yicha bronlar, banketlar, QR orqali zal, stop-list, mashhur taomlar, ega uchun tushum."))}
@@K@@
</head>
<body class="panel" data-lang="${l}">
${sprite()}
${demoStrip(l)}
<div class="app-w">
<div class="nav-back" id="nav-back"></div>
<aside class="side-nav" aria-label="${t("Разделы панели", "Panel bo‘limlari")}">
<div class="brand">${logo()}<small>${t("Панель ресторана", "Restoran paneli")}</small></div>
<nav class="nav">${nav.map(([k, i, n, c]) => `<a href="#${k}">${ic(i)}<span>${n}</span>${c ? `<i data-cnt="${c}" hidden>0</i>` : ""}</a>`).join("")}</nav>
<div class="role"><p>${t("Смотреть как", "Kim sifatida ko‘rish")}</p><div role="radiogroup"><button type="button" role="radio" data-role="owner" aria-checked="true">${t("Владелец", "Ega")}</button><button type="button" role="radio" data-role="mgr" aria-checked="false">${t("Менеджер", "Menejer")}</button></div>
<a class="to-app" href="${href(l, "menu")}">${ic("bag")}<span>${t("Открыть приложение гостя", "Mehmon ilovasini ochish")}</span></a></div>
</aside>
<div class="main">
<header class="topbar"><button type="button" class="ib" id="menu-b" aria-label="${t("Меню", "Menyu")}">${ic("menu")}</button><b class="tb-t" id="tb-t"></b><span class="sp"></span><span class="tb-live" id="live"><i></i>${t("Сейчас", "Hozir")} <b id="clock"></b></span><div class="lang-s"><a href="${href("uz", "panel")}"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a><a href="${href("ru", "panel")}"${l === "ru" ? ' aria-current="true"' : ""}>RU</a></div></header>
<main id="pv"></main>
<p class="demo">${t("Макет DevUz Studio: цифры панели демо, блюда и цены из вашего меню.", "DevUz Studio maketi: panel raqamlari demo, taomlar va narxlar menyuingizdan.")} <a href="${TERMS(l)}">${t("Условия использования", "Foydalanish shartlari")}</a></p>
</div></div>
<div id="side" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="kp-data">${json(panelData(l))}</script>
@@Q@@
</body>
</html>`;
}

/* ── Главная ───────────────────────────────────────────────────────── */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZSIGN = `<svg class="dz-sign" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

function introHtml(l) {
  const t = T(l);
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  return `<div class="intro" id="intro" role="presentation">
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t(`макет сайта для ${D.BRAND.full}`, `${D.BRAND.full} uchun sayt maketi`)}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<canvas class="km-cv" aria-hidden="true" data-logo="${IMG}/logo.webp" data-name="${esc(t("ресторан · Фозилтепа 10А", "restoran · Foziltepa 10A"))}"></canvas>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish")}</button>
</div>`;
}
const head = (kicker, h, lead, anim = "up") => `<div class="sec-head rv a-${anim}"><span class="kicker">${kicker}</span><h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>`;
const phone = (l, path, id) => `<div class="iph" id="${id}"><div class="iph-in"><div class="iscr"><iframe title="${T(l)("Приложение Karomat", "Karomat ilovasi")}" data-src="${href(l, "menu")}?embed=1${path}" loading="lazy"></iframe></div><span class="iisl" aria-hidden="true"></span></div></div>`;

/* Имя крупно: буквы отдельными <text>, чтобы расходились по одной. */
function heroWord() {
  const ws = [["K", 0.78], ["A", 0.74], ["R", 0.7], ["O", 0.8], ["M", 0.92], ["A", 0.74], ["T", 0.66]], fs = 150, gap = 18;
  const tot = ws.reduce((s, [, w]) => s + w * fs, 0) + gap * (ws.length - 1);
  let x = (1000 - tot) / 2;
  return `<svg viewBox="0 0 1000 170" aria-hidden="true" focusable="false">${ws.map(([c, w]) => { const cx = x + (w * fs) / 2; x += w * fs + gap; return `<text x="${cx.toFixed(0)}" y="140" font-size="${fs}" text-anchor="middle">${c}</text>`; }).join("")}</svg>`;
}

function heroBlock(l) {
  const t = T(l);
  return `<section class="hero" id="hero"><div class="stage">
<div class="table" aria-hidden="true">${D.TABLE.map((id, i) => `<img class="pl pl-${i}" src="${IMG}/p-${id}.webp" alt="" draggable="false"${i < 3 ? ' fetchpriority="high"' : ' loading="eager"'} decoding="async">`).join("")}<canvas class="steam" id="steam"></canvas></div>
<div class="hero-word">${heroWord()}<p class="hero-sub">Restaurant</p></div>
<h1 class="sr">${t("Karomat: ресторан узбекской, турецкой и уйгурской кухни в Ташкенте, Фозилтепа 10А", "Karomat: Toshkentda o‘zbek, turk va uyg‘ur oshxonasi restorani, Foziltepa 10A")}</h1>
<div class="hero-cap"><p class="kicker">${t("Фозилтепа 10А · каждый день 10:00-22:30", "Foziltepa 10A · har kuni 10:00-22:30")}</p><p>${t("Узбекская, турецкая и уйгурская кухня: шурпа, лагман, шашлык из мангала, пиде из тандыра.", "O‘zbek, turk va uyg‘ur oshxonasi: sho‘rva, lag‘mon, mangal shashlik, tandir pide.")}</p>
<div class="hero-cta"><a class="btn btn-gold shim" href="#bron">${ic("table")}<span>${t("Забронировать стол", "Stol band qilish")}</span></a><a class="btn btn-line" href="#menyu">${t("Меню", "Menyu")}</a></div></div>
<div class="hero-out"><p class="kicker">${t("Дастархан накрыт", "Dasturxon tayyor")}</p><h2>${t("Ваш стол <em>ждёт</em>", "Stolingiz <em>kutmoqda</em>")}</h2><p>${t("Девять блюд на этом столе: из вашего меню и с вашими фотографиями.", "Bu stoldagi to‘qqiz taom: menyuingizdan va o‘z suratlaringiz bilan.")}</p><div class="hero-cta"><a class="btn btn-gold" href="#bron">${ic("table")}<span>${t("Забронировать стол", "Stol band qilish")}</span></a><a class="btn btn-line" href="${href(l, "menu")}">${t("Заказать домой", "Uyga buyurtma")}</a></div></div>
<span class="hero-hint" aria-hidden="true"></span>
</div></section>`;
}

function marqBlock(l) {
  const ids = [3745, 3771, 3790, 3758, 3767, 3781, 3818, 3749, 3753, 3807];
  const one = ids.map((id) => `<span>${esc(dn(id, l))}<svg aria-hidden="true"><use href="#i-spark"/></svg></span>`).join("");
  return `<div class="marq" aria-hidden="true"><div class="marq-t">${one}${one}</div></div>`;
}

function nowBlock(l) {
  const t = T(l);
  return `<section id="hozir"><div class="wrap">
${head(t("Сейчас и станет", "Hozir va keyin"), t("Что мы увидели <em>на вашем сайте</em>", "Saytingizda <em>nimani ko‘rdik</em>"), t("Мы открыли karomat-restaurant.uz с телефона, как гость, который выбирает, где поужинать.", "karomat-restaurant.uz’ni telefondan, kechki ovqat uchun joy tanlayotgan mehmon kabi ochdik."))}
<ol class="nw">${D.NOW.map((r, i) => `<li class="rv a-flip" style="--d:${i * 60}ms"><span class="nw-n">${i + 1}</span><p class="nw-was">${L2(r.now, l)}</p>${ic("arrow", "nw-ar")}<p class="nw-is">${L2(r.next, l)}</p></li>`).join("")}</ol>
</div></section>`;
}

const FILTERS = [["veg", "leaf", ["Без мяса", "Go‘shtsiz"]], ["kids", "child", ["Детям", "Bolalarga"]], ["share", "users", ["На компанию", "Davra uchun"]], ["hit", "fire", ["Хиты", "Mashhur"]]];
function menuBlock(l) {
  const t = T(l);
  const shown = D.MENU.filter((m) => m.cat !== "bar");
  return `<section id="menyu" class="mn-sec"><div class="wrap">
${head(t("Меню", "Menyu"), t("${n} блюд <em>с фото и ценой</em>", "Rasm va narxli <em>${n} taom</em>").replace("${n}", D.MENU.length), t("Всё ваше меню, а не «выберите раздел». Разделы, фильтры и карточка каждого блюда; в корзину одним касанием.", "«Bo‘limni tanlang» emas, butun menyuingiz. Bo‘limlar, filtrlar va har bir taom kartochkasi; savatga bir bosishda."))}
<div class="mn-tabs" role="tablist" aria-label="${t("Разделы меню", "Menyu bo‘limlari")}"><button type="button" role="tab" aria-selected="true" data-cat="all">${t("Всё", "Hammasi")}</button>${D.CATS.filter((c) => c.id !== "bar").map((c) => `<button type="button" role="tab" aria-selected="false" data-cat="${c.id}">${ic(c.ic)}${L2(c.n, l)}</button>`).join("")}</div>
<div class="mn-f">${FILTERS.map(([k, i, n]) => `<button type="button" aria-pressed="false" data-f="${k}">${ic(i)}${L2(n, l)}</button>`).join("")}</div>
<div class="mn-grid" id="mn-grid">${shown.map((m) => `<a class="dc" href="${href(l, "menu")}#/p/${m.id}" data-cat="${m.cat}" data-tags="${m.tags.join(" ")}"><span class="dc-im"><img src="${IMG}/d-${m.id}.webp" alt="${esc(dn(m.id, l))}" width="600" height="491" loading="lazy" decoding="async"></span><span class="dc-b"><b>${esc(dn(m.id, l))}</b><span>${m.v.length ? t("от ", "") + sum(l, m.price) + t("", "dan") : sum(l, m.price)}</span></span></a>`).join("")}</div>
<p class="mn-more"><button type="button" class="btn btn-line" id="mn-more">${t("Показать всё меню", "Butun menyuni ko‘rsatish")}</button><a class="btn btn-gold" href="${href(l, "menu")}">${ic("bag")}<span>${t("Заказать", "Buyurtma berish")}</span></a></p>
<p class="src">${t("Блюда, цены и фото: меню на karomat-restaurant.uz. Метки «без мяса», «детям», «на компанию» поставлены по названию; в панели их ставит ресторан.", "Taomlar, narxlar va suratlar: karomat-restaurant.uz’dagi menyu. «Go‘shtsiz», «bolalarga», «davra uchun» belgilari nomiga qarab qo‘yilgan; panelda ularni restoran qo‘yadi.")}</p>
</div></section>`;
}

function pathBlock(l) {
  const t = T(l);
  const steps = [
    ["grid", t("Меню целиком", "Butun menyu"), t("11 разделов, поиск понимает «шурпа» и «sho‘rva».", "11 bo‘lim, qidiruv «шурпа» va «sho‘rva»ni tushunadi."), "#/c/all"],
    ["bowl", t("Карточка блюда", "Taom kartochkasi"), t("Фото, цена, порция: большая или маленькая, «с этим берут».", "Rasm, narx, porsiya: katta yoki kichik, «bu bilan birga olishadi»."), "#/p/3755"],
    ["bag", t("Корзина", "Savat"), t("Хлеб и чай предложит сама, баллы и итог видны сразу.", "Non va choyni o‘zi taklif qiladi, ballar va jami darhol ko‘rinadi."), "#/cart"],
    ["truck", t("Доставка или самовывоз", "Yetkazish yoki olib ketish"), t("Адрес, ориентир, время: «как можно скорее» или к часу.", "Manzil, mo‘ljal, vaqt: «iloji boricha tez» yoki soatga."), "#/checkout"],
    ["card", t("Оплата", "To‘lov"), t("Click, Payme, Uzum Bank или наличными курьеру.", "Click, Payme, Uzum Bank yoki kuryerga naqd."), "#/checkout"],
    ["clock", t("Статус", "Holat"), t("Принят, готовится, в пути, доставлен: гость не звонит узнать.", "Qabul qilindi, tayyorlanmoqda, yo‘lda, yetkazildi: mehmon bilish uchun qo‘ng‘iroq qilmaydi."), "#/me"],
    ["table", t("Бронь стола", "Stol bron"), t("Тот же вход: дата, время, гости, стол на схеме.", "O‘sha kirish: sana, vaqt, mehmonlar, sxemada stol."), "#/book"],
    ["gift", t("Баллы", "Ballar"), t("5% с заказа на следующий ужин.", "Buyurtmadan 5% keyingi kechki ovqatga."), "#/me"],
  ];
  return `<section class="path" id="buyurtma" data-tone="deep"><div class="wrap">
${head(`<span class="ours">${t("Что внутри", "Ichida nima bor")}</span>`, t("Заказ <em>в телефоне</em>: восемь шагов", "Telefonda <em>buyurtma</em>: sakkiz qadam"), t("Каждый шаг кликается: нажмите и попадёте на этот экран. Заказ проходит до конца, деньги не списываются.", "Har qadam bosiladi: bosing va shu ekranga o‘tasiz. Buyurtma oxirigacha o‘tadi, pul yechilmaydi."))}
<div class="pt-grid"><ol class="pt-list">${steps.map(([i, h, p, u], k) => `<li class="rv a-side" style="--d:${k * 50}ms"><button type="button" class="pt" data-go="${u}"${k === 0 ? ' aria-current="step"' : ""}><span class="pt-n">${k + 1}</span><span class="pt-t"><b>${ic(i)}${h}</b><small>${p}</small></span></button></li>`).join("")}</ol>
<div class="pt-ph">${phone(l, "#/c/all", "ph-path")}<a class="btn btn-line" href="${href(l, "menu")}">${ic("full")}<span>${t("Приложение во весь экран", "Ilova to‘liq ekranda")}</span></a></div></div>
</div></section>`;
}

function bookBlock(l) {
  const t = T(l);
  const hall = D.HALL.map((x) => {
    const cx = x.x + x.w / 2, cy = x.y + x.h / 2;
    const chairs = Array.from({ length: x.s }, (_, i) => {
      if (x.r) { const a = (i / x.s) * Math.PI * 2 - Math.PI / 2, rr = x.w / 2 + 2.2; return `<circle class="ch" cx="${(cx + Math.cos(a) * rr).toFixed(1)}" cy="${(cy + Math.sin(a) * rr).toFixed(1)}" r="1.5"/>`; }
      const half = Math.ceil(x.s / 2), top = i < half, k = top ? i : i - half, n = top ? half : x.s - half;
      return `<circle class="ch" cx="${(x.x + ((k + 0.5) * x.w) / n).toFixed(1)}" cy="${top ? x.y - 2.2 : x.y + x.h + 2.2}" r="1.5"/>`;
    }).join("");
    return `<g class="tb" data-t="${x.id}" data-s="${x.s}" tabindex="0" role="button" aria-label="${t("Стол", "Stol")} ${x.id}, ${x.s} ${t("мест", "o‘rin")}">${chairs}${x.r ? `<circle class="tt" cx="${cx}" cy="${cy}" r="${x.w / 2}"/>` : `<rect class="tt" x="${x.x}" y="${x.y}" width="${x.w}" height="${x.h}" rx="2"/>`}<text x="${cx}" y="${cy + 1.4}" text-anchor="middle">${x.id}</text></g>`;
  }).join("");
  return `<section id="bron"><div class="wrap">
${head(t("Бронь стола", "Stol bron"), t("Стол на схеме зала, <em>в два касания</em>", "Zal sxemasida stol, <em>ikki bosishda</em>"), t("Дата, время и гости, потом стол прямо на схеме. Занятые на это время столы серые: выбрать их нельзя. Бронь сразу видна в панели.", "Sana, vaqt va mehmonlar, keyin to‘g‘ridan-to‘g‘ri sxemada stol. Shu vaqtga band stollar kulrang: ularni tanlab bo‘lmaydi. Bron darhol panelda ko‘rinadi."))}
<div class="bk"><div class="bk-ctl rv a-side">
<div class="bk-row"><b>${t("Дата", "Sana")}</b><div class="bk-days" id="bk-days"></div></div>
<div class="bk-row"><b>${t("Время", "Vaqt")}</b><div class="bk-times" id="bk-times"></div></div>
<div class="bk-row"><b>${t("Гостей", "Mehmonlar")}</b><div class="stp"><button type="button" id="bk-m" aria-label="${t("Меньше", "Kamroq")}">${ic("minus")}</button><output id="bk-g">4</output><button type="button" id="bk-p" aria-label="${t("Больше", "Ko‘proq")}">${ic("plus")}</button></div></div>
</div>
<div class="bk-map rv a-pop"><svg viewBox="0 -4 100 70" id="hall" role="group" aria-label="${t("Схема зала", "Zal sxemasi")}"><rect class="fl" x="1" y="-3" width="98" height="68" rx="3"/><path class="wl" d="M1 30h0M99 18v14"/><text class="lb" x="97" y="64" text-anchor="end">${t("вход", "kirish")}</text>${hall}</svg>
<div class="bk-leg"><span><i class="f"></i>${t("свободен", "bo‘sh")}</span><span><i class="b"></i>${t("занят", "band")}</span><span><i class="s"></i>${t("ваш", "sizniki")}</span><span><i class="x"></i>${t("мало мест", "o‘rin kam")}</span></div></div>
<div class="bk-sum rv a-up" id="bk-sum" aria-live="polite"></div></div>
<p class="src">${t("Схема для примера: расстановку вашего зала нарисуем по вашему плану или фото. Занятость демо.", "Sxema namuna: zalingiz joylashuvini rejangiz yoki suratlaringiz bo‘yicha chizamiz. Bandlik demo.")}</p>
</div></section>`;
}

function banketBlock(l) {
  const t = T(l);
  return `<section id="banket" data-tone="cream"><div class="wrap">
${head(t("Банкет и той", "Banket va to‘y"), t("Сумма банкета <em>до звонка</em>", "Banket summasi <em>qo‘ng‘iroqdan oldin</em>"), t("На Яндекс Картах о вашем банкетном зале пишут больше всего. Гости, повод и стол из вашего меню: калькулятор сразу считает на гостя и итог с обслуживанием, менеджер получает заявку уже с расчётом.", "Yandex Xaritalarda eng ko‘p banket zalingiz haqida yozishadi. Mehmonlar, sabab va menyuingizdan stol: kalkulyator mehmon boshiga va xizmat bilan jamini darhol hisoblaydi, menejer so‘rovni hisobi bilan oladi."))}
<div class="bq"><div class="bq-l rv a-rise">
<div class="bq-kinds" role="radiogroup" aria-label="${t("Повод", "Sabab")}">${D.BANQUET.kinds.map((k, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-k="${k.id}">${L2(k.n, l)}</button>`).join("")}</div>
<label class="bq-g" for="bq-r"><span>${t("Гостей", "Mehmonlar")}</span><output id="bq-v">40</output></label><input type="range" id="bq-r" min="10" max="300" step="10" value="40">
<h3>${t("Стол на 10 гостей", "10 kishilik stol")}</h3><ul class="bq-list" id="bq-list"></ul>
<details class="bq-x"><summary>${ic("plus")}${t("Добавить блюдо", "Taom qo‘shish")}</summary><div class="bq-xl" id="bq-xl"></div></details></div>
<div class="bq-r"><div class="bq-tot rv a-pop" id="bq-tot"></div></div></div>
<p class="src">${t("Блюда и цены из вашего меню, обслуживание 15% как в вашей системе меню. Аренду зала, оформление и вместимость впишете вы: на сайте их нет.", "Taomlar va narxlar menyuingizdan, xizmat 15% menyu tizimingizdagidek. Zal ijarasi, bezak va sig‘imni o‘zingiz yozasiz: saytda ular yo‘q.")}</p>
</div></section>`;
}

function qrBlock(l) {
  const t = T(l);
  let cells = "";
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    const fin = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    if (fin) continue;
    if (rnd() > 0.52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1" transform="translate(.5 .5) scale(.857)"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  const steps = [["qr", t("Сканирует код на столе", "Stoldagi kodni skanerlaydi"), t("Камера телефона, без приложений и регистрации", "Telefon kamerasi, ilovalar va ro‘yxatdan o‘tishsiz")], ["bag", t("Заказывает на стол", "Stolga buyurtma beradi"), t("Заказ с номером стола уходит официанту и на кухню", "Stol raqami bilan buyurtma ofitsiant va oshxonaga ketadi")], ["bell", t("Зовёт официанта", "Ofitsiantni chaqiradi"), t("Одна кнопка: в панели мигает его стол", "Bitta tugma: panelda uning stoli yonadi")], ["receipt", t("Просит счёт", "Hisob so‘raydi"), t("Счёт с обслуживанием 15%, оплата Click или Payme", "15% xizmat bilan hisob, Click yoki Payme orqali to‘lov")]];
  return `<section id="qr" data-tone="deep"><div class="wrap">
${head(t("QR-меню", "QR-menyu"), t("Код на столе: <em>меню, заказ, счёт</em>", "Stoldagi kod: <em>menyu, buyurtma, hisob</em>"), t("Гость за столом 7 сканирует код и видит то же меню, только заказ идёт на его стол. Нажмите «Позвать официанта» в телефоне: в панели загорится стол 7.", "7-stoldagi mehmon kodni skanerlaydi va o‘sha menyuni ko‘radi, faqat buyurtma uning stoliga ketadi. Telefonda «Ofitsiantni chaqirish»ni bosing: panelda 7-stol yonadi."))}
<div class="qr"><div class="qr-tent rv a-tilt" aria-hidden="true"><div class="qr-card">${logo("lg-s")}<svg viewBox="0 0 21 21" class="qr-code">${finder(0, 0)}${finder(14, 0)}${finder(0, 14)}${cells}</svg><b>${t("Стол", "Stol")} 7</b><small>${t("Меню, заказ и счёт", "Menyu, buyurtma va hisob")}</small></div></div>
<ol class="qr-steps">${steps.map(([i, a, b], k) => `<li class="rv a-up" style="--d:${k * 70}ms">${ic(i)}<span><b>${a}</b><small>${b}</small></span></li>`).join("")}</ol>
<div class="qr-ph">${phone(l, "#/t/7", "ph-qr")}</div></div>
</div></section>`;
}

function videoBlock(l) {
  const t = T(l);
  return `<section id="video"><div class="wrap">
${head(t("Видео", "Video"), t("Ваша кухня <em>в Shorts</em>", "Oshxonangiz <em>Shorts’da</em>"), t("Вместо кнопки «Videoni ko‘rish», которая сейчас никуда не ведёт: ваши ролики с YouTube рядом с блюдом, которое в них готовят.", "Hozir hech qayerga olib bormaydigan «Videoni ko‘rish» tugmasi o‘rniga: YouTube’dagi roliklaringiz ularda tayyorlanayotgan taom yonida."))}
<div class="vd">${D.SHORTS.map((v, i) => `<a class="vd-c rv a-rise" style="--d:${i * 70}ms" href="https://www.youtube.com/shorts/${v.id}"><img src="${IMG}/yt-${v.id}.webp" alt="" width="360" height="640" loading="lazy"><span class="vd-pl">${ic("play")}</span><span class="vd-t"><b>${esc(v.t)}</b><small>${esc(dn(v.dish, l))} · ${sum(l, M[v.dish].price)}</small></span></a>`).join("")}</div>
</div></section>`;
}

function revBlock(l) {
  const t = T(l);
  const stars = (n) => `<span class="stars" aria-label="${n}/5">${"★".repeat(n)}</span>`;
  return `<section id="sharh" data-tone="cream"><div class="wrap">
${head(t("Отзывы", "Sharhlar"), t("Что пишут гости <em>на Яндекс Картах</em>", "Mehmonlar Yandex Xaritalarda <em>nima yozadi</em>"), t(`Оценка ${D.RATING.value} из 5: ${D.RATING.count} оценок и ${D.RATING.reviews} отзывов. На сайте они встанут рядом с блюдом, о котором написаны, и будут обновляться сами.`, `Baho 5 dan ${D.RATING.value}: ${D.RATING.count} ta baho va ${D.RATING.reviews} ta sharh. Saytda ular o‘zi yozilgan taom yonida turadi va o‘zi yangilanadi.`))}
<div class="rvw">${D.REVIEWS.map((r, i) => `<figure class="rv-c rv a-up${r.d ? "" : " q"}" style="--d:${(i % 3) * 80}ms">${r.d ? `<img src="${IMG}/d-${r.d}.webp" alt="${esc(dn(r.d, l))}" width="600" height="491" loading="lazy">` : `<span class="rv-q" aria-hidden="true">“</span>`}${stars(r.r)}<blockquote>${esc(r[l])}</blockquote><figcaption><span class="av">${esc(r.a.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase())}</span><b>${esc(r.a)}</b><small>${r.d ? esc(dn(r.d, l)) : t("о зале", "zal haqida")}${r.o !== l ? " · " + t("перевод наш", "tarjima bizniki") : ""}</small></figcaption></figure>`).join("")}</div>
<p class="src"><a href="${D.RATING.url}">${t("Все отзывы на Яндекс Картах", "Barcha sharhlar Yandex Xaritalarda")}</a>. ${t("Отзывы с вашего сайта (Akmal Tursunov и другие) не взяли: гость их проверить не может.", "Saytingizdagi sharhlarni (Akmal Tursunov va boshqalar) olmadik: mehmon ularni tekshira olmaydi.")}</p>
</div></section>`;
}

function bestBlock(l) {
  const t = T(l);
  const rows = [
    ["Tarnov", t("Ташкент", "Toshkent"), t("Единственный из соседей с бронью стола на сайте, своя доставка и бот.", "Qo‘shnilar ichida saytda stol broni bor yagonasi, o‘z yetkazishi va boti."), t("Бронь, но на схеме зала, а не формой", "Bron, lekin forma emas, zal sxemasida")],
    ["Beshqozon", t("Ташкент", "Toshkent"), t("Меню с ценами и граммовкой, сеты, корзина и Telegram-бот.", "Narx va grammli menyu, setlar, savat va Telegram-bot."), t("Меню целиком и заказ в два касания", "Butun menyu va ikki bosishda buyurtma")],
    ["Caravan", t("Ташкент", "Toshkent"), t("Залы с фотографиями, но бронь и банкет только по телефону.", "Suratli zallar, lekin bron va banket faqat telefon orqali."), t("Банкет с расчётом на сайте, без звонка", "Saytda hisobli banket, qo‘ng‘iroqsiz")],
    [t("Чайхона №1", "Chaihona №1"), t("Москва", "Moskva"), t("Доставка, бронь и бонусы в одном месте, видео на первом экране.", "Yetkazish, bron va bonuslar bir joyda, birinchi ekranda video."), t("Баллы с заказа и брони, ваши Shorts", "Buyurtma va brondan ballar, Shorts’laringiz")],
    ["Nusr-Et", t("Стамбул, Дубай", "Istanbul, Dubay"), t("Бронь в шапке на каждой странице, фирменные блюда крупно.", "Har sahifada sarlavhada bron, firma taomlari yirik."), t("Кнопка брони всегда под пальцем", "Bron tugmasi doim barmoq ostida")],
    ["Arabian Tea House", t("Дубай", "Dubay"), t("Гость сам меняет бронь, приложение лояльности, три языка.", "Mehmon bronni o‘zi o‘zgartiradi, sodiqlik ilovasi, uch til."), t("Кабинет гостя с бронями и баллами", "Bron va ballar bilan mehmon kabineti")],
  ];
  return `<section id="raqobat"><div class="wrap">
${head(t("Разбор рынка", "Bozor tahlili"), t("Что взяли <em>у соседей и у лучших</em>", "Qo‘shnilar va eng yaxshilardan <em>nimani oldik</em>"), t("Мы прошли сайты ресторанов Ташкента и лучших в Турции, ОАЭ и России. Банкет с расчётом на сайте не нашли ни у кого в Ташкенте, бронь стола только у одного.", "Toshkent restoranlari va Turkiya, BAA, Rossiyadagi eng yaxshilarining saytlarini ko‘rib chiqdik. Toshkentda saytda hisobli banket hech kimda yo‘q, stol broni faqat bittasida."))}
<div class="best">${rows.map(([n, c, a, b], i) => `<article class="bst rv a-up" style="--d:${i * 60}ms"><header><b>${n}</b><small>${c}</small></header><p>${a}</p><p><strong>${t("У Karomat:", "Karomat’da:")}</strong> ${b}</p></article>`).join("")}</div>
</div></section>`;
}

function panelBlock(l) {
  const t = T(l);
  const f = [
    ["bag", t("Заказы", "Buyurtmalar"), t("лента, статусы, гость видит смену статуса", "lenta, holatlar, mehmon holat o‘zgarganini ko‘radi")],
    ["table", t("Брони", "Bronlar"), t("день по столам и часам, бронь с сайта первой", "kun stollar va soatlar bo‘yicha, saytdagi bron birinchi")],
    ["users", t("Банкеты", "Banketlar"), t("заявки с расчётом: звонок, предоплата, проведён", "hisobli so‘rovlar: qo‘ng‘iroq, oldindan to‘lov, o‘tkazildi")],
    ["qr", t("Зал и QR", "Zal va QR"), t("кто зовёт официанта, кто просит счёт", "kim ofitsiantni chaqiryapti, kim hisob so‘rayapti")],
    ["stop", t("Стоп-лист", "Stop-list"), t("кончилось блюдо: одно нажатие, и его не заказать", "taom tugadi: bitta bosish va uni buyurtma qilib bo‘lmaydi")],
    ["chart", t("Популярные блюда", "Mashhur taomlar"), t("что берут, что приносит выручку, что не берут", "nimani olishadi, nima tushum keltiradi, nimani olishmaydi")],
  ];
  return `<section class="pnl" id="panel" data-tone="cream"><div class="wrap">
${head(`<span class="ours">${t("Что внутри", "Ichida nima bor")}</span>`, t("Владелец видит выручку, <em>менеджер видит зал</em>", "Ega tushumni ko‘radi, <em>menejer zalni</em>"), t("Это работающий макет. Забронируйте стол или оформите заказ выше, и он появится в панели первой строкой. Переведите заказ в «В пути», и гость увидит это у себя.", "Bu ishlaydigan maket. Yuqorida stol band qiling yoki buyurtma bering, u panelda birinchi qatorda paydo bo‘ladi. Buyurtmani «Yo‘lda»ga o‘tkazing, mehmon buni o‘zida ko‘radi."))}
<div class="brw rv a-rise"><div class="brw-bar" aria-hidden="true"><i></i><i></i><i></i><span>karomat-restaurant.uz/admin</span></div><iframe class="pnl-frame" title="${t("Панель ресторана", "Restoran paneli")}" data-src="${href(l, "panel")}?embed=1" loading="lazy"></iframe></div>
<ul class="pnl-f">${f.map(([i, a, b]) => `<li class="rv a-up">${ic(i)}<span><b>${a}</b><small>${b}</small></span></li>`).join("")}</ul>
<div class="pnl-cta"><a class="btn btn-ink" href="${href(l, "panel")}">${ic("full")}<span>${t("Панель во весь экран", "Panel to‘liq ekranda")}</span></a></div>
</div></section>`;
}

function offerBlock(l) {
  const t = T(l);
  const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}"><span class="sw" aria-hidden="true"></span><span class="kit-t2"><b>${a[l].t}${a.star ? `<em class="star">${t("берут первым", "birinchi olishadi")}</em>` : ""}</b><small>${a[l].e}</small></span><span class="kit-pr">+${usd(a.price)}</span></label>`;
  return `<section class="offer" id="narx"><div class="wrap">
${head(`<span class="ours">${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</span>`, t("Стоимость", "Narxi"), t(`Сайт ресторана без допов: ${usd(BASE.promo)} вместо ${usd(BASE.price)}, если начинаем в течение 48 часов. Заказ, бронь, банкеты, QR-меню и панель идут допами: включайте тумблерами, итог пересчитается.`, `Qo‘shimchalarsiz restoran sayti: 48 soat ichida boshlasak, ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}. Buyurtma, bron, banketlar, QR-menyu va panel qo‘shimchalar: tumblerlar bilan yoqing, jami qayta hisoblanadi.`))}
<div class="kit" id="konstruktor">
<div class="kit-l">
<div class="kit-base"><div><span class="kb-tag">${t("Входит всегда", "Har doim kiradi")}</span><b>${BASE[l].t}</b><p>${BASE[l].d}</p><p class="kb-w">${t(`Срок: ${BASE.weeks[0]}-${BASE.weeks[1]} недели`, `Muddat: ${BASE.weeks[0]}-${BASE.weeks[1]} hafta`)}</p></div><div class="kb-p"><s>${usd(BASE.price)}</s><b>${usd(BASE.promo)}</b><small>${t("48 часов", "48 soat")}</small></div></div>
<h3 class="kit-g">${t("Допы: включайте то, что нужно ресторану", "Qo‘shimchalar: restoranga keraklisini yoqing")}</h3>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side">
<div class="kit-total" id="kit-total">
<div class="timer" id="timer"><span>${t(`Цена ${usd(BASE.promo)} действует`, `${usd(BASE.promo)} narxi amal qiladi`)}<small>${t("48 часов с первого открытия макета", "maket birinchi ochilgandan 48 soat")}</small></span><b id="tm">48:00:00</b></div>
<div class="kt-line"><span>${t("Сайт", "Sayt")}</span><span><s>${usd(BASE.price)}</s> ${usd(BASE.promo)}</span></div>
<div class="kt-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kit-cnt">0</span></span><span id="kit-add">0 $</span></div>
<div class="kt-sum"><small>${t("Итого", "Jami")}</small><b id="kit-total-sum">${usd(BASE.promo)}</b><small>${t(`со всеми допами ${usd(ALL)}`, `barcha qo‘shimchalar bilan ${usd(ALL)}`)}</small></div>
<button type="button" class="btn btn-line" id="kit-all">${t("Включить всё", "Hammasini yoqish")}</button>
<a class="btn btn-gold shim" href="https://t.me/Devuz_studio_bot?start=karomat">${ic("tg")}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
<button type="button" class="copy" id="kit-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button>
</div>
<p class="src">${t("Цены допов: вдвое ниже середины рынка веб-студий Ташкента и СНГ. Комиссии Click, Payme, Uzum Bank, лицензии iiko или R-Keeper, хостинг и SMS ресторан оплачивает сам.", "Qo‘shimchalar narxi: Toshkent va MDH veb-studiyalari bozor o‘rtachasidan ikki baravar past. Click, Payme, Uzum Bank komissiyalari, iiko yoki R-Keeper litsenziyalari, xosting va SMSni restoran o‘zi to‘laydi.")}</p>
</div>
</div></section>`;
}

function siteData(l) {
  const t = T(l);
  return {
    img: IMG, app: href(l, "menu"), panel: href(l, "panel"), lang: l, sum: t("сум", "so‘m"), hall: D.HALL,
    menu: Object.fromEntries(D.MENU.map((m) => [m.id, { n: dn(m.id, l), p: m.price, v: m.v.map((v) => ({ n: L2(v.n, l), p: v.p })) }])),
    banq: banq(l), service: D.BRAND.service, open: D.BRAND.open, close: D.BRAND.close,
    ui: {
      days: t("Вс|Пн|Вт|Ср|Чт|Пт|Сб", "Ya|Du|Se|Ch|Pa|Ju|Sh").split("|"), today: t("Сегодня", "Bugun"), tomorrow: t("Завтра", "Ertaga"),
      months: t("янв|фев|мар|апр|мая|июн|июл|авг|сен|окт|ноя|дек", "yan|fev|mar|apr|may|iyn|iyl|avg|sen|okt|noy|dek").split("|"),
      pick: t("Выберите свободный стол на схеме", "Sxemadan bo‘sh stolni tanlang"), table: t("Стол", "Stol"), seats: t("мест", "o‘rin"),
      guests: t("гостей", "mehmon"), small: t("Стол на {s} мест, а гостей {g}: выберите побольше", "Stol {s} o‘rinli, mehmonlar esa {g}: kattarog‘ini tanlang"),
      busy: t("Этот стол занят на {h}", "Bu stol {h} ga band"), confirm: t("Забронировать", "Band qilish"), name: t("Имя", "Ism"), phone: t("Телефон", "Telefon"),
      done: t("Стол {t} ваш: {d}, {h}, {g} гостей. Бронь № {n} уже в панели.", "{t}-stol sizniki: {d}, {h}, {g} mehmon. № {n} bron allaqachon panelda."),
      toPanel: t("Открыть в панели", "Panelda ochish"), again: t("Ещё бронь", "Yana bron"), call: t("Позвонить в ресторан", "Restoranga qo‘ng‘iroq"),
      perGuest: t("на гостя", "mehmon boshiga"), tables: t("столов", "stol"), food: t("Блюда", "Taomlar"), service: t("Обслуживание", "Xizmat"), total: t("Итого", "Jami"),
      send: t("Отправить заявку", "So‘rov yuborish"), sent: t("Заявка № {n} у менеджера с этим расчётом. В панели она первой строкой.", "№ {n} so‘rov shu hisob bilan menejerda. Panelda u birinchi qatorda."),
      per10: t("на стол", "stolga"), add: t("Добавить", "Qo‘shish"), remove: t("Убрать", "Olib tashlash"), less: t("Меньше", "Kamroq"), more: t("Больше", "Ko‘proq"),
    },
    offer: { items: ADDONS.map((a) => ({ id: a.id, t: a[l].t, p: a.price })), base: BASE.promo, baseName: BASE[l].t, hours: OFFER_HOURS, head: t("Сайт Karomat, состав:", "Karomat sayti, tarkibi:"), totalW: t("Итого", "Jami"), copied: t("Скопировано", "Nusxalandi"), ended: t("Акция закончилась, цена обычная", "Aksiya tugadi, narx odatiy") },
  };
}

function sitePage(l) {
  const t = T(l);
  const other = l === "ru" ? "uz" : "ru";
  const nav = [["#menyu", t("Меню", "Menyu")], ["#buyurtma", t("Заказ", "Buyurtma")], ["#bron", t("Бронь", "Bron")], ["#banket", t("Банкет", "Banket")], ["#qr", t("QR-меню", "QR-menyu")], ["#narx", t("Стоимость", "Narxi")]];
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t(`${B} · ресторан на Фозилтепа · макет DevUz Studio`, `${B} · Foziltepadagi restoran · DevUz Studio maketi`), t("Макет сайта Karomat: дастархан из ваших блюд, меню целиком, заказ, бронь стола на схеме зала, банкет с расчётом, QR-меню, видео, панель владельца.", "Karomat sayti maketi: taomlaringizdan dasturxon, butun menyu, buyurtma, zal sxemasida stol bron, hisobli banket, QR-menyu, video, ega paneli."))}
<link rel="alternate" hreflang="${other}" href="${href(other)}">
<link rel="preload" as="image" href="${IMG}/p-3745.webp">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=false;try{if(sessionStorage.getItem('km-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}if(/[?&]nointro/.test(location.search))off=true;if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
@@S@@
</head>
<body class="site" data-lang="${l}">
${sprite()}
${introHtml(l)}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top" id="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="${B}">${logo()}</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
<div class="top-r"><div class="lang"><a href="${href("uz")}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a><a href="${href("ru")}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a></div>
<a class="btn btn-sm btn-gold" href="#bron">${t("Бронь стола", "Stol bron")}</a></div>
</div></header>
<main id="main">
${[heroBlock(l), marqBlock(l), nowBlock(l), menuBlock(l), pathBlock(l), bookBlock(l), banketBlock(l), qrBlock(l), videoBlock(l), revBlock(l), bestBlock(l), panelBlock(l), offerBlock(l)].join("\n")}
</main>
<footer class="foot"><div class="wrap">
<div class="cols">
<div>${logo("f-logo")}<p class="f-d">${t("Узбекская, турецкая и уйгурская кухня", "O‘zbek, turk va uyg‘ur oshxonasi")}. ${L2(D.BRAND.addr, l)}. ${L2(D.BRAND.hours, l)}.</p><ul class="f-c"><li>${ic("phone")}<a href="tel:${D.BRAND.phoneRaw}">${D.BRAND.phone}</a></li><li>${ic("pin")}<a href="${D.BRAND.map}">${t("Как доехать: Яндекс Карты", "Qanday borish: Yandex Xaritalar")}</a></li><li>${ic("ig")}<a href="https://www.instagram.com/${D.BRAND.ig}">@${D.BRAND.ig}</a></li><li>${ic("yt")}<a href="${D.BRAND.yt}">YouTube @Karomat_restaurant</a></li></ul></div>
<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=karomat">Telegram</a></li></ul></div>
<div><b>${t("Данные макета", "Maket ma’lumotlari")}</b><ul><li>${t("Меню, цены, фото, адрес, часы, отзывы: karomat-restaurant.uz", "Menyu, narxlar, suratlar, manzil, soatlar, sharhlar: karomat-restaurant.uz")}</li><li>${t("Видео: ваш канал на YouTube", "Video: YouTube’dagi kanalingiz")}</li><li>${t("Схема зала, заказы, брони, цифры панели: демо", "Zal sxemasi, buyurtmalar, bronlar, panel raqamlari: demo")}</li></ul></div>
</div>
<div class="rights"><span>${t(`Это макет: так может выглядеть сайт ${D.BRAND.full}. Заказы, бронь и оплата работают для показа, деньги не списываются.`, `Bu maket: ${D.BRAND.full} sayti shunday ko‘rinishi mumkin. Buyurtma, bron va to‘lov ko‘rsatish uchun ishlaydi, pul yechilmaydi.`)}</span><a href="${TERMS(l)}">${t("Условия использования макета", "Maketdan foydalanish shartlari")}</a></div>
</div></footer>
<div class="dock" id="dock"><a class="btn btn-gold shim" href="#bron">${ic("table")}<span>${t("Забронировать стол", "Stol band qilish")}</span></a><a class="btn btn-line" href="${href(l, "menu")}">${t("Меню", "Menyu")}</a></div>
<script type="application/json" id="km-site">${json(siteData(l))}</script>
<script>
${strip(read("intro.js"))}</script>
<script src="${IMG}/gsap.min.js"></script>
<script src="${IMG}/ScrollTrigger.min.js"></script>
@@J@@
</body>
</html>`;
}

/* Главный язык — узбекский, как у них на сайте. Русский — /ru. */
const out = {
  "": sitePage("uz"), ru: sitePage("ru"),
  menu: appPage("uz"), "ru/menu": appPage("ru"),
  panel: panelPage("uz"), "ru/panel": panelPage("ru"),
};
const parts = {
  S: `<style>${min(read("site.css"))}</style>`,
  A: `<style>${min(read("app.css"))}</style>`,
  K: `<style>${min(read("panel.css"))}</style>`,
  J: `<script>\n${strip(read("site.js"))}</script>`,
  P: `<script>\n${strip(APP_JS)}</script>`,
  Q: `<script>\n${strip(PANEL_JS)}</script>`,
};
const fill = (page) => Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), page);

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "karomat.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(uz)").padEnd(12), fill(v).length);
