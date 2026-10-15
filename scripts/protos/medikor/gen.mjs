import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as D from "./data.mjs";
import { BASE, ADDONS, ALL, ALL_REGULAR, OFFER_HOURS, DISCOUNT, sale } from "./plan.mjs";

/*
 * Макет интернет-магазина Medikor (медоборудование из Кореи, Москва), ru:
 *  - страница (`""`): промо DevUz и пульс, который входит в шар их знака;
 *    магазин живьём в айфоне, «Сейчас / Станет» с конкурентами, сканер по
 *    карточке HR-501, путь закупщика по шагам, счёт по ИНН, панель в окне,
 *    стоимость с конструктором допов и отсчётом 48 часов;
 *  - магазин (`shop`): сначала телефон, на ПК растягивается;
 *  - панель менеджеров (`panel`).
 * Товары, цены, наличие, описания, характеристики, фото — с medikor.ru
 * (data.mjs); заказы, организации, счета — демо, так и подписано.
 *
 * Стили и скрипты общие, в странице вместо них @@S@@, @@A@@, @@P@@, @@J@@,
 * @@K@@, @@Q@@. Ссылки — через __PROTO_BASE__, отпечаток ставится при показе
 * зерном из protos (lib/proto/bundles). Модель макет не вызывает.
 * Язык один: рынок клиента — Россия.
 */

const DIR = new URL(".", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/medikor";
const BASEP = "__PROTO_BASE__";
const B = D.BRAND.name;
const TERMS = "https://devuz.studio/ru/mockup-terms";
const FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Onest:wght@400;700&display=swap";
const read = (f) => readFileSync(DIR + f, "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const rub = (n) => grp(n) + " ₽";
const href = (path = "") => BASEP + (path ? "/" + path : "");
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const P = Object.fromEntries(D.PRODUCTS.map((p) => [p.id, p]));

/* ── Знак: буквы — пути из logo.json (logo.py), шар — круг с вырезанными дугами ── */
const LOGO = JSON.parse(read("logo.json"));
const LOGO_BOX = `0 -2 ${LOGO.w} 44`;
function ballArcs({ cx, cy, r }) {
  const ox = cx - r * 1.9, oy = cy + r * 1.6;
  return Array.from({ length: 6 }, (_, i) => `<circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="${(r * (1.55 + i * 0.3)).toFixed(1)}" fill="none" stroke="#000" stroke-width="${(r * (0.13 - i * 0.012)).toFixed(2)}"/>`).join("");
}
const { cx, cy, r } = LOGO.ball;
const LOGO_SYM = `<mask id="mk-ball" maskUnits="userSpaceOnUse" x="0" y="-2" width="${LOGO.w}" height="44"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>${ballArcs(LOGO.ball)}</mask><symbol id="mk-logo" viewBox="${LOGO_BOX}"><path d="${LOGO.d}" fill="currentColor"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="currentColor" mask="url(#mk-ball)"/></symbol>`;

/* ── Иконки: контуры 24×24 ───────────────────────────────────────────── */
const S = 'fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  arrow: `<path d="M5 12h14M13 6l6 6-6 6" ${S}/>`,
  chev: `<path d="m9 6 6 6-6 6" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  plus: `<path d="M12 5v14M5 12h14" ${S}/>`,
  minus: `<path d="M5 12h14" ${S}/>`,
  heart: `<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" stroke-width="1.9" stroke-linejoin="round"/>`,
  pulse: `<path d="M3 12h4l2-5 3 10 2.5-7 1.5 2h5" ${S}/>`,
  cart: `<path d="M3.5 4.5h2.2l2 11h10.6l1.9-8H7" ${S}/><circle cx="9" cy="19" r="1.4" ${S}/><circle cx="17" cy="19" r="1.4" ${S}/>`,
  search: `<circle cx="11" cy="11" r="6.5" ${S}/><path d="m16 16 4 4" ${S}/>`,
  filter: `<path d="M4 6h16M7 12h10M10 18h4" ${S}/>`,
  sort: `<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" ${S}/>`,
  truck: `<path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z" ${S}/><circle cx="7" cy="17.5" r="1.8" ${S}/><circle cx="17.5" cy="17.5" r="1.8" ${S}/>`,
  doc: `<path d="M6 3.5h8l4 4v13H6z" ${S}/><path d="M14 3.5v4h4M9 12h6M9 16h6" ${S}/>`,
  shield: `<path d="M12 3 19 6v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" ${S}/><path d="m9 12 2 2 4-4" ${S}/>`,
  card: `<rect x="3" y="5.5" width="18" height="13" rx="2.5" ${S}/><path d="M3 10h18M7 15h4" ${S}/>`,
  qr: `<rect x="4" y="4" width="6" height="6" rx="1" ${S}/><rect x="14" y="4" width="6" height="6" rx="1" ${S}/><rect x="4" y="14" width="6" height="6" rx="1" ${S}/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" ${S}/>`,
  cash: `<rect x="3" y="6.5" width="18" height="11" rx="2" ${S}/><circle cx="12" cy="12" r="2.6" ${S}/>`,
  pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${S}/><circle cx="12" cy="10" r="2.3" ${S}/>`,
  phone: `<path d="M5 4.5h3.5l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" ${S}/>`,
  mail: `<rect x="3.5" y="5.5" width="17" height="13" rx="2" ${S}/><path d="m4 7 8 6 8-6" ${S}/>`,
  clock: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 7.5V12l3 2" ${S}/>`,
  user: `<circle cx="12" cy="8.5" r="3.8" ${S}/><path d="M4.5 20c1.3-3.8 4-5.6 7.5-5.6s6.2 1.8 7.5 5.6" ${S}/>`,
  build: `<path d="M4 20V6.5L12 4v16M12 9h8v11M4 20h17M7 9h2M7 13h2M7 17h2M15 13h2M15 17h2" ${S}/>`,
  box: `<path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5z" ${S}/><path d="M4 7.5 12 11l8-3.5M12 11v9" ${S}/>`,
  down: `<path d="M12 4v11M7 10l5 5 5-5M5 20h14" ${S}/>`,
  send: `<path d="M21 4 3 11l6 2 2 6 3-4 5 4z" ${S}/><path d="m9 13 9-7" ${S}/>`,
  grid: `<rect x="4" y="4" width="7" height="7" rx="1.5" ${S}/><rect x="13" y="4" width="7" height="7" rx="1.5" ${S}/><rect x="4" y="13" width="7" height="7" rx="1.5" ${S}/><rect x="13" y="13" width="7" height="7" rx="1.5" ${S}/>`,
  chart: `<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" ${S}/>`,
  list: `<path d="M9 6h11M9 12h11M9 18h11M4.5 6v.01M4.5 12v.01M4.5 18v.01" ${S}/>`,
  menu: `<path d="M4 7h16M4 12h16M4 17h16" ${S}/>`,
  alert: `<path d="M12 4 21 19.5H3z" ${S}/><path d="M12 10v4M12 17v.01" ${S}/>`,
  full: `<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" ${S}/>`,
  tag: `<path d="M4 12V4h8l8 8-8 8z" ${S}/><circle cx="8.5" cy="8.5" r="1.4" ${S}/>`,
  globe: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z" ${S}/>`,
  tg: `<path d="M21 4 3 11l6 2 2 6 3-4 5 4z" ${S}/><path d="m9 13 9-7" ${S}/>`,
  cam: `<rect x="3" y="7" width="13" height="10" rx="2" ${S}/><path d="m16 11 5-3v8l-5-3" ${S}/>`,
  bolt: `<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" ${S}/>`,
  skull: `<path d="M12 3.5c-4.4 0-7.5 3-7.5 7 0 2.4 1.1 3.9 2.5 4.8V19h10v-3.7c1.4-.9 2.5-2.4 2.5-4.8 0-4-3.1-7-7.5-7z" ${S}/><circle cx="9" cy="11" r="1.6" ${S}/><circle cx="15" cy="11" r="1.6" ${S}/><path d="M10 19v-2M14 19v-2" ${S}/>`,
  drop: `<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z" ${S}/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" ${S}/>`,
  micro: `<path d="M9 4h4l1 4-3 1-3-4zM11 9l2 6M7 20h11M10 20c-3 0-5-2-5-5M13 15a4 4 0 0 1-3 5" ${S}/>`,
  lamp: `<path d="M12 3v4M6 13a6 6 0 0 1 12 0zM9 16.5l-1 2.5M15 16.5l1 2.5M12 16.5V20" ${S}/>`,
  vein: `<path d="M8 3c0 5 3 6 3 10s-3 5-3 8M16 3c0 4-2 5-2 8s3 4 3 10M11 13c1.5 0 3-1 3-2" ${S}/>`,
  wave: `<path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" ${S}/>`,
  eye: `<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" ${S}/><circle cx="12" cy="12" r="3" ${S}/>`,
  tool: `<circle cx="7" cy="18" r="2.5" ${S}/><circle cx="17" cy="18" r="2.5" ${S}/><path d="M8.5 16 16 4M15.5 16 8 4" ${S}/>`,
  glasses: `<circle cx="7" cy="14" r="3.5" ${S}/><circle cx="17" cy="14" r="3.5" ${S}/><path d="M10.5 14h3M3.5 13 5 7M20.5 13 19 7" ${S}/>`,
  head: `<path d="M5 12a7 7 0 0 1 14 0" ${S}/><rect x="9" y="12" width="6" height="4" rx="1" ${S}/><path d="M12 16v2M9.5 21l2.5-3 2.5 3" ${S}/>`,
  needle: `<path d="M4 20 15 9M14 5l5 5M12.5 6.5l5 5M17 3l4 4" ${S}/>`,
  tape: `<rect x="3" y="8" width="18" height="8" rx="4" ${S}/><path d="M8 8v8M16 8v8" ${S}/>`,
};
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${LOGO_SYM}${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
  .join("")}</defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;
const logo = (cls = "") => `<svg class="logo-w ${cls}" viewBox="${LOGO_BOX}" role="img" aria-label="${B}"><use href="#mk-logo"/></svg>`;

/* ── Данные для магазина и панели ───────────────────────────────────── */
// Организации — демо, ИНН выдуманы и так подписаны.
const ORGS = [
  { inn: "7700000010", n: "ГБПОУ «Медицинский колледж № 0» (демо)", short: "Медколледж", kpp: "770001001", a: "Москва, демо-адрес", type: "колледж" },
  { inn: "7700000027", n: "ООО «Семейная клиника» (демо)", short: "Клиника", kpp: "770001001", a: "Москва, демо-адрес", type: "клиника" },
  { inn: "7700000034", n: "ГБОУ «Школа № 0» (демо)", short: "Школа", kpp: "770001001", a: "Москва, демо-адрес", type: "школа" },
  { inn: "1600000041", n: "ООО «Фитнес-клуб» (демо)", short: "Фитнес-клуб", kpp: "160001001", a: "Казань, демо-адрес", type: "спорт" },
  { inn: "5400000058", n: "ООО «Глазной центр» (демо)", short: "Глазной центр", kpp: "540001001", a: "Новосибирск, демо-адрес", type: "клиника" },
];
const SYN = {
  "анд": ["def"], "аед": ["def"], "aed": ["def"], "дефиб": ["def"], "школ": ["def"], "офис": ["def"],
  "манекен": ["slr"], "слр": ["slr"], "реанимац": ["slr"], "тренаж": ["slr", "def"], "колледж": ["slr", "anat"], "brayden": ["slr"],
  "вен": ["vein"], "веновиз": ["vein"], "укол": ["vein"], "инъекц": ["vein"],
  "тейп": ["tape"], "кинезио": ["tape"], "спорт": ["tape", "needle"], "игл": ["needle"], "акупунк": ["needle"],
  "кольпоскоп": ["video"], "дерматоскоп": ["video"], "отоскоп": ["video"], "проктоскоп": ["video"], "камер": ["video", "fundus"],
  "лампа": ["light", "head"], "свет": ["light", "head"], "череп": ["anat"], "мозг": ["anat"], "анатом": ["anat"],
  "зажим": ["surg"], "инструмент": ["surg"], "глаз": ["fundus", "phor"], "офтальм": ["fundus", "phor"], "рефракц": ["phor"],
  "дезинф": ["fog"], "туман": ["fog"], "стомат": ["micro", "head"], "косметол": ["radio", "therm"], "гинек": ["radio", "video"],
};
const prods = () => D.PRODUCTS.map((p) => ({ id: p.id, cat: p.cat, n: p.n, a: p.a, price: p.price, old: p.old, av: p.av, c: p.c, m: p.m, s: p.s, sp: p.sp, ru: p.ru || null, g: p.g, w: p.w }));
function shopData() {
  return {
    img: IMG, products: prods(), cats: D.CATS, brand: D.BRAND, orgs: ORGS, who: D.WHO, ship: D.SHIP, cities: D.CITIES, syn: SYN, pairs: D.PAIRS, elsewhere: D.HR501_ELSEWHERE,
    popular: ["дефибриллятор", "манекен СЛР", "визуализатор вен", "кинезиотейп", "налобный осветитель", "фундус-камера"],
    terms: TERMS, panel: href("panel"), logoBox: LOGO_BOX,
  };
}
function panelData() {
  return {
    img: IMG, products: prods(), cats: D.CATS.map((c) => ({ id: c.id, n: c.n })), orgs: ORGS, cities: D.CITIES,
    people: ["Анна С.", "Игорь П.", "Марина К.", "Сергей Л.", "Ольга В.", "Тимур Р."],
    mgrs: ["Ольга (демо)", "Дмитрий (демо)", "Ирина (демо)"],
    src: [{ id: "site", n: "Сайт", c: "#194aaa" }, { id: "search", n: "Поиск Яндекса", c: "#e5243b" }, { id: "call", n: "Звонок", c: "#14804a" }, { id: "mail", n: "Почта", c: "#b7862c" }, { id: "repeat", n: "Повторный заказ", c: "#6c7489" }],
    kps: [
      { org: 0, for: "Закупка 44-ФЗ", c: "Класс СЛР на 12 человек, нужна поставка до конца месяца", items: [{ id: "bred", q: 6 }, { id: "atm112", q: 2 }, { id: "bjun", q: 2 }] },
      { org: 1, for: "Коммерческая закупка", c: "Открываем кабинет гинеколога и стоматолога", items: [{ id: "dcs102", q: 1 }, { id: "l2012", q: 1 }, { id: "voms", q: 1 }] },
      { org: 2, for: "Закупка 223-ФЗ", c: "Два дефибриллятора на этажи, с боксами", items: [{ id: "hr501", q: 2 }, { id: "aedbox", q: 2 }] },
      { org: 4, for: "Согласование", c: "", items: [{ id: "med03", q: 1 }, { id: "vt8", q: 1 }] },
    ],
    demoLog: [
      { d: "14.10.2026", at: "17:42", who: "Ольга (демо)", what: "MK-10467: «Передан в доставку», трек СДЭК" },
      { d: "14.10.2026", at: "16:05", who: "Дмитрий (демо)", what: "КП-2197: КП отправлено, ООО «Семейная клиника» (демо)" },
      { d: "14.10.2026", at: "11:20", who: "Ирина (демо)", what: "Тренажер СЛР Brayden: остаток 14" },
      { d: "13.10.2026", at: "15:31", who: "Ольга (демо)", what: "СЧ-10461: оплата поступила" },
      { d: "13.10.2026", at: "10:12", who: "Дмитрий (демо)", what: "Визуализатор вен QV-600: прикреплено РУ" },
    ],
  };
}

/* ── Общая шапка документа ──────────────────────────────────────────── */
function headTags(title, desc, theme = "#00082d") {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="${theme}">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}
const strip2 = () => `<p class="demo-strip">Макет DevUz Studio · данные демо <a href="${href()}#cena">Стоимость</a></p>`;

/* ── Магазин ────────────────────────────────────────────────────────── */
function shopPage() {
  const tabs = [["home", "#/", "grid", "Главная"], ["catalog", "#/c/all", "search", "Каталог"], ["cart", "#/cart", "cart", "Корзина"], ["kp", "#/kp", "doc", "КП"], ["me", "#/me", "user", "Кабинет"]];
  return `<!doctype html>
<html lang="ru">
<head>
${headTags(`${B} · медицинское оборудование из Кореи · макет DevUz Studio`, "Макет интернет-магазина Medikor: каталог медоборудования, счёт организации по ИНН, запрос КП, оплата картой и по QR, доставка с расчётом, документы в заказе.")}
@@A@@
</head>
<body class="shop">
${sprite()}
<a class="skip" href="#view">К содержанию</a>
<header class="top" id="top">${strip2()}<div class="hd"><div class="hd-in">
<a class="logo" href="#/" aria-label="${B}">${logo()}</a>
<nav class="hd-nav" aria-label="Разделы"><a href="#/c/all" data-tab="catalog">Каталог</a><a href="#/c/def">Дефибрилляторы</a><a href="#/c/slr">Тренажеры СЛР</a><a href="#/kp" data-tab="kp">Запрос КП</a></nav>
<button type="button" class="hd-s" data-search>${ic("search")}<span>Дефибриллятор, манекен, тейпы</span></button>
<a class="hd-tel" href="tel:${D.BRAND.tel}">${ic("phone")}<span>${D.BRAND.phone}</span></a>
<div class="hd-act"><a href="#/kp" class="kp-ic">${ic("doc")}<span>КП</span><b class="bdg" data-badge="kp" hidden>0</b></a><a href="#/me">${ic("user")}<span>Кабинет</span></a><a href="#/cart" class="cart-ic">${ic("cart")}<span>Корзина</span><b class="bdg" data-badge="cart" hidden>0</b></a></div>
</div></div></header>
<main id="view" tabindex="-1"></main>
<nav class="tabbar" aria-label="Меню">${tabs.map(([k, u, i, n]) => `<a href="${u}" data-tab="${k}"${k === "cart" ? ' class="cart-ic"' : k === "kp" ? ' class="kp-ic"' : ""}>${ic(i)}<span>${n}</span>${k === "cart" || k === "kp" ? `<b class="bdg" data-badge="${k}" hidden>0</b>` : ""}</a>`).join("")}</nav>
<div id="search" hidden role="dialog" aria-modal="true" aria-label="Поиск"><div class="sq-top"><form id="sq-form" role="search">${ic("search")}<input id="sq" type="search" enterkeyhint="search" autocomplete="off" placeholder="АНД, манекен, вены…" aria-label="Поиск"></form><button type="button" class="lnk" id="sq-x">Отмена</button></div><div id="sq-res"></div></div>
<div id="sheet" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="mk-data">${json(shopData())}</script>
@@P@@
</body>
</html>`;
}

/* ── Панель ─────────────────────────────────────────────────────────── */
function panelPage() {
  const nav = [["dash", "grid", "Сводка"], ["orders", "box", "Заказы", "orders"], ["kp", "doc", "Запросы КП", "kp"], ["invoices", "card", "Счета"], ["clients", "build", "Организации"], ["goods", "tag", "Товары"], ["log", "list", "История"]];
  return `<!doctype html>
<html lang="ru">
<head>
${headTags(`Панель ${B} · макет DevUz Studio`, "Панель менеджеров Medikor: заказы, запросы КП с ответом, счета организаций, товары с остатком и РУ, история действий.")}
@@K@@
</head>
<body class="panel">
${sprite()}
${strip2()}
<div class="app">
<div class="nav-back" onclick="document.body.classList.remove('nav-on')"></div>
<aside class="side-nav" aria-label="Разделы панели">
<div class="brand">${logo()}<small>Панель менеджеров</small></div>
<nav class="nav">${nav.map(([k, i, n, c]) => `<a href="#${k}">${ic(i)}<span>${n}</span>${c ? `<i data-cnt="${c}" hidden>0</i>` : ""}</a>`).join("")}</nav>
<div class="role"><p>Смотреть как</p><div role="radiogroup"><button type="button" role="radio" data-role="owner" aria-checked="true">Владелец</button><button type="button" role="radio" data-role="mgr" aria-checked="false">Менеджер</button></div>
<a class="to-shop" href="${href("shop")}">${ic("cart")}<span>Открыть магазин</span></a></div>
</aside>
<div class="main">
<header class="topbar"><button type="button" class="ib" id="menu-b" aria-label="Меню">${ic("menu")}</button>${logo("lw")}<span class="sp"></span><span class="me"><span class="av">В</span></span></header>
<main id="pv"></main>
<p class="muted sm" style="padding:0 28px 24px">Макет DevUz Studio: данные панели демо. <a href="${TERMS}">Условия использования</a></p>
</div></div>
<div id="side" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="mp-data">${json(panelData())}</script>
@@Q@@
</body>
</html>`;
}

/* ── Страница-презентация ───────────────────────────────────────────── */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZSIGN = `<svg class="dz-sign" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

function introHtml() {
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  return `<div class="intro" id="intro" role="presentation">
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">макет интернет-магазина для ${B}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<canvas class="mk-cv" aria-hidden="true" data-logo="${esc(JSON.stringify(LOGO))}" data-name="медицинское оборудование из Кореи"></canvas>
<button type="button" class="in-skip" id="in-skip">Пропустить</button>
</div>`;
}
const head = (kicker, h, lead, anim = "up") => `<div class="sec-head rv a-${anim}"><span class="kicker">${kicker}</span><h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>`;
const phone = (path, id) => `<div class="iph" id="${id}"><div class="iph-in"><div class="iscr"><iframe title="Магазин Medikor" data-src="${href("shop")}?embed=1${path}" loading="lazy"></iframe></div><span class="iisl" aria-hidden="true"></span></div></div>`;
// Кардиограмма для фона первого экрана: две одинаковые половины, чтобы лента шла по кругу.
const ECG = (() => {
  const beat = (x) => `L${x + 20} 60 L${x + 26} 52 L${x + 32} 60 L${x + 44} 60 L${x + 48} 66 L${x + 54} 14 L${x + 60} 80 L${x + 64} 60 L${x + 80} 60 Q${x + 90} 44 ${x + 100} 60 L${x + 160} 60`;
  let d = "M0 60";
  for (let x = 0; x < 2400; x += 160) d += " " + beat(x);
  return `<svg class="ecg-run" viewBox="0 0 2400 120" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
})();

function heroBlock() {
  const low = Math.min(...D.HR501_ELSEWHERE.map((x) => x[1]));
  return `<section class="hero" id="hero">
<div class="hero-bg" aria-hidden="true">${ECG}<img class="hj hj1" src="${IMG}/p-bred-s.webp" alt=""></div>
<div class="wrap hero-in">
<div class="hero-txt">
<p class="kicker light">Макет интернет-магазина для Medikor</p>
<h1>Магазин Medikor, где клиника получает счёт за минуту, а частный покупатель платит картой</h1>
<p class="lead">${D.PRODUCTS.length} ваших товаров из ${D.CATS.length} разделов с ценами, фото и характеристиками с medikor.ru. Организация вводит ИНН и сразу получает счёт. Нет цены на сайте, запрос КП уходит менеджеру, ответ приходит в кабинет. Доставка до города считается в корзине, документы лежат в заказе.</p>
<div class="hero-cta"><a class="btn btn-w shim" href="${href("shop")}">${ic("cart")}<span>Открыть магазин</span></a><a class="btn btn-line" href="${href("panel")}">${ic("chart")}<span>Панель менеджеров</span></a></div>
<ul class="hero-k"><li><b>${D.BRAND.catalogTotal}</b><span>товаров в каталоге medikor.ru</span></li><li><b>${D.CATS.length}</b><span>разделов, все в макете</span></li><li><b>${grp(P.hr501.price)} ₽</b><span>HR-501 у вас, у других от ${grp(low)} ₽</span></li></ul>
</div>
<div class="hero-ph rv a-rise">${phone("", "ph-hero")}<p class="ph-cap">Это работает: листайте, кладите в корзину, получайте счёт</p></div>
</div></section>`;
}

function nowBlock() {
  const now = [
    "Счёта для организации нет: только «Купить в 1 клик» и обратный звонок. А клиника, школа и колледж покупают по счёту.",
    "У хирургических инструментов, микроскопа и аппаратов термотерапии нет цены и нет кнопки «узнать цену»: закупщик уходит туда, где можно запросить КП.",
    `HR-501 у вас стоит ${rub(P.hr501.price)}, у других продавцов от ${grp(Math.min(...D.HR501_ELSEWHERE.map((x) => x[1])))} до ${rub(Math.max(...D.HR501_ELSEWHERE.map((x) => x[1])))}. Сайт об этом молчит.`,
    "У того же HR-501 в каталоге «В наличии», в карточке «Под заказ», в характеристиках «Остаток 2 шт.».",
    "Регистрационное удостоверение в карточке есть только у визуализаторов вен и игл, хотя в «О компании» сказано, что оно есть на всё.",
    "Ссылка на medikor.ru в мессенджере показывает картинку с чужой надписью MEDTECH и пустое описание. Telegram и WhatsApp на сайте нет.",
    "Доставка «рассчитывается после оформления заказа»: ни перевозчиков, ни сроков, ни цены.",
  ];
  const next = [
    "Счёт по ИНН: реквизиты подставляются сами, счёт приходит сразу, оплату менеджер видит в панели.",
    "«Запросить КП» у каждого товара и у всей корзины. Менеджер отвечает из шаблона, «Принять» превращает КП в счёт.",
    "Сравнение цены прямо в карточке HR-501: закупщик видит, что у вас дешевле.",
    "Одно наличие для каталога и карточки, из учёта.",
    "Документы в карточке и в заказе: РУ, инструкция, счёт, УПД, гарантийный талон.",
    "Доставка СДЭК, ПЭК, Деловые линии с ценой и сроком до города прямо в корзине. Оплата картой, по QR через СБП или по счёту.",
  ];
  const rows = [
    ["Счёт по ИНН с реквизитами", "нет", "не нашли ни у кого из семи", "в оформлении и в КП"],
    ["Запросить КП", "нет", "cordismed.ru, trimm.ru", "в каждой карточке и в корзине"],
    ["РУ в карточке", "у 2 разделов из 16", "mirdental.ru, ondent.ru", "у каждого товара"],
    ["Для бюджетных закупок", "нет", "profmaneken.ru, medcomplect.ru", "КП «для закупки 44-ФЗ»"],
    ["Оплата по QR через СБП", "нет", "profmaneken.ru", "есть"],
    ["Лизинг для клиник", "нет", "mirdental.ru, cordismed.ru", "доп «Лизинг»"],
    ["Расчёт доставки", "после заказа", "cordismed.ru", "в корзине до города"],
  ];
  return `<section class="now" id="seychas" data-tone="mist"><div class="wrap">
${head("Что меняем", "Сейчас закупщик звонит, а мог бы получить счёт сам", "Мы прошли medikor.ru как покупатель с телефона и сравнили с семью магазинами медтехники в России, 15.10.2026.")}
<div class="nw-grid"><div class="nw nw-now rv a-left"><h3>${ic("alert")}Сейчас</h3><ul>${now.map((x) => `<li>${x}</li>`).join("")}</ul></div>
<div class="nw nw-next rv a-right"><h3>${ic("check")}Станет</h3><ul>${next.map((x) => `<li>${x}</li>`).join("")}</ul></div></div>
<div class="cmp rv a-up"><h3>Что есть у других магазинов медтехники</h3><div class="tw"><table><thead><tr><th>Что</th><th>medikor.ru</th><th class="opt">У других</th><th>В макете</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td class="n">${r[1]}</td><td class="opt">${r[2]}</td><td class="y">${r[3]}</td></tr>`).join("")}</tbody></table></div><p class="src">Цены HR-501: ${D.HR501_ELSEWHERE.map((x) => `${x[0]} ${rub(x[1])}`).join(", ")}, 15.10.2026.</p></div>
</div></section>`;
}

function scanBlock() {
  const low = Math.min(...D.HR501_ELSEWHERE.map((x) => x[1]));
  const tags = [
    [0.12, "4%", "4%", "Цена", `${rub(P.hr501.price)}, у других от ${rub(low)}`],
    [0.3, "56%", "16%", "Голос", "подсказки на русском"],
    [0.46, "4%", "36%", "Батарея", "200 разрядов"],
    [0.62, "58%", "52%", "Вес", "2,2 кг"],
    [0.78, "4%", "68%", "Документы", "РУ и инструкция"],
    [0.92, "54%", "84%", "Организациям", "счёт по ИНН"],
  ];
  return `<section class="scan" id="skaner"><div class="wrap sc-grid">
<div class="sc-box rv a-pop" id="sc-box" aria-hidden="true"><img src="${IMG}/p-hr501.webp" alt="" width="800" height="800"><div class="sc-x"><div class="sc-xi"><img src="${IMG}/p-hr501.webp" alt="" width="800" height="800"></div></div><i class="sc-beam"></i>${tags.map((t) => `<span class="sc-tag" data-at="${t[0]}" style="left:${t[1]};top:${t[2]}"><b>${t[3]}</b>${t[4]}</span>`).join("")}</div>
<div>${head("Карточка товара", "Луч проходит по HR-501 и показывает, что закупщик увидит в карточке", "Листайте: подписи встают, когда луч до них доходит. Всё, что в них, взято из вашей карточки на medikor.ru, кроме цен у других продавцов.", "right")}
<ul class="sc-list">${[["tag", "Цена рядом с ценой у других", "закупщику не нужно искать самому"], ["shield", "Документы у каждого товара", "РУ, инструкция; файл прикрепляет менеджер в панели"], ["doc", "Три кнопки, а не одна", "«В корзину», «Счёт на организацию», «В запрос КП»"]].map((x) => `<li class="rv a-up">${ic(x[0])}<span><b>${x[1]}</b><small>${x[2]}</small></span></li>`).join("")}</ul>
<p class="sc-cta"><a class="btn btn-w" href="${href("shop")}#/p/hr501">${ic("heart")}<span>Открыть карточку HR-501</span></a></p></div>
</div></section>`;
}

function pathBlock() {
  const steps = [
    ["grid", "Каталог и «кому»", "16 разделов и вход по покупателю: «Клинике», «Школе, офису, спортзалу», «Колледжу и симцентру».", "#/"],
    ["search", "Поиск", "Понимает «АНД», «манекен», «вены», «для школы» и сразу ведёт в нужный раздел.", "#/c/all?who=college"],
    ["shield", "Карточка", "Цена, наличие, характеристики, РУ и инструкция. У HR-501 рядом цены других продавцов.", "#/p/hr501"],
    ["doc", "Цена по запросу", "У микроскопа цены на сайте нет: «Запросить КП», менеджер отвечает из панели.", "#/p/voms"],
    ["cart", "Корзина", "Частное лицо или организация. Город и перевозчик: цена и срок доставки сразу.", "#/cart"],
    ["build", "Счёт по ИНН", "ИНН, реквизиты подставились, счёт готов. Частное лицо платит картой или по QR.", "#/checkout"],
    ["truck", "Статус и трек", "Счёт выставлен, оплачен, собран, передан в доставку, получен. Трек-номер в заказе.", "#/orders"],
    ["user", "Кабинет", "Заказы, запросы КП, счета, УПД и гарантийные талоны организации в одном месте.", "#/me"],
  ];
  return `<section class="path" id="put"><div class="wrap">
${head("Путь закупщика", "Восемь шагов от поиска до закрывающих документов", "Каждый шаг кликается: нажмите и попадёте на этот экран магазина. Заказ проходит до конца, деньги не списываются.")}
<div class="pt-grid"><ol class="pt-list">${steps.map(([i, h, p, u], k) => `<li class="rv a-up" style="--d:${k * 60}ms"><button type="button" class="pt" data-go="${u}"${k === 0 ? ' aria-current="step"' : ""}><span class="pt-n">${k + 1}</span><span class="pt-t"><b>${ic(i)}${h}</b><small>${p}</small></span></button></li>`).join("")}</ol>
<div class="pt-ph">${phone("#/c/all", "ph-path")}<a class="btn btn-b" href="${href("shop")}">${ic("full")}<span>Магазин во весь экран</span></a></div></div>
</div></section>`;
}

function orgBlock() {
  const items = [["hr501", 1], ["aedbox", 1]];
  const sum = items.reduce((s, [id, q]) => s + P[id].price * q, 0);
  return `<section class="org" id="schet" data-tone="mist"><div class="wrap org-grid">
<div>${head("Для организаций", "ИНН вместо звонка: счёт собирается сам", "Клиника, школа или колледж вводят ИНН, реквизиты подставляются, счёт приходит на почту. Оплату по выписке видит менеджер, заказ сам уходит в сборку, УПД и гарантийный талон появляются в кабинете.", "left")}
<ul class="org-f">${[["doc", "Счёт и КП в PDF", "с вашим логотипом и реквизитами из 1С"], ["build", "Кабинет организации", "общие заказы, документы и КП для всех сотрудников"], ["shield", "Для бюджетных закупок", "КП с пометкой «закупка 44-ФЗ», цены и сроки по каждой позиции"]].map((x) => `<li>${ic(x[0])}<span><b>${x[1]}</b><small>${x[2]}</small></span></li>`).join("")}</ul></div>
<div class="inn rv a-pop"><p class="inn-k">Попробуйте: введите ИНН</p><label for="inn">ИНН организации</label><input id="inn" inputmode="numeric" maxlength="12" autocomplete="off" placeholder="10 или 12 цифр">
<div class="inn-chips">${ORGS.slice(0, 3).map((o) => `<button type="button" data-inn="${o.inn}">${esc(o.short)}</button>`).join("")}</div>
<div class="inn-res" id="inn-res" aria-live="polite"></div>
<div class="inn-doc" id="inn-doc"><div class="row"><span>${esc(P.hr501.n)}</span><b>${rub(P.hr501.price)}</b></div><div class="row"><span>${esc(P.aedbox.n)}</span><b>${rub(P.aedbox.price)}</b></div><div class="row"><span><b>Итого по счёту</b></span><b>${rub(sum)}</b></div><p class="src">Счёт № СЧ-10481 готов, ушёл на почту. Организации в макете демо.</p></div></div>
</div></section>`;
}

function panelBlock() {
  const f = [
    ["box", "Заказы", "заказ с сайта первой строкой, статус уходит покупателю"],
    ["doc", "Запросы КП", "цены и сроки подставлены, скидка, отправка в кабинет"],
    ["card", "Счета", "кто не оплатил, «Оплата поступила» запускает сборку"],
    ["build", "Организации", "кто сколько заказал, реквизиты для новых счетов"],
    ["tag", "Товары", "цена, остаток и РУ; в рабочем магазине из 1С"],
    ["list", "История", "кто из менеджеров что сделал и когда"],
  ];
  return `<section class="pnl" id="panel"><div class="wrap">
${head("Панель менеджеров", "Запрос КП не теряется в почте, счёт не ждёт звонка", "Это работающий макет. Оформите заказ или запросите КП в магазине выше, и он появится здесь первой строкой. Ответьте на КП, и покупатель увидит его у себя. Переключатель «Владелец / Менеджер» прячет выручку от сотрудников.")}
<div class="brw rv a-rise"><div class="brw-bar" aria-hidden="true"><i></i><i></i><i></i><span>medikor.ru/admin</span></div><iframe class="pnl-frame" title="Панель менеджеров" data-src="${href("panel")}?embed=1" loading="lazy"></iframe></div>
<ul class="pnl-f">${f.map(([i, a, b]) => `<li class="rv a-up">${ic(i)}<span><b>${a}</b><small>${b}</small></span></li>`).join("")}</ul>
<div class="pnl-cta"><a class="btn btn-b" href="${href("panel")}">${ic("full")}<span>Панель во весь экран</span></a></div>
</div></section>`;
}

function offerBlock() {
  const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${sale(a.price)}"><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a.ru.t}${a.star ? `<em class="star">берут первым</em>` : ""}</b><small>${a.ru.e}</small></span><span class="kit-p">+${rub(sale(a.price))} <s>${rub(a.price)}</s></span></label>`;
  return `<section class="offer" id="cena" data-tone="mist"><div class="wrap">
${head(`<span class="ours">Предложение DevUz Studio</span>`, "Стоимость", `Магазин целиком, как в этом макете, без допов: ${rub(BASE.promo)} вместо ${rub(BASE.price)}. Скидка ${DISCOUNT}% на магазин и на каждый доп, если начинаем в течение 48 часов с первого открытия макета. Допы включайте тумблерами, итог пересчитается.`)}
<div class="kit" id="konstruktor">
<div class="kit-list">
<div class="kit-base"><div><span class="kb-tag">Входит всегда</span><b>${BASE.ru.t}</b><p>${BASE.ru.d}</p><p class="kb-w">Срок: ${BASE.weeks[0]}-${BASE.weeks[1]} недель</p></div><div class="kb-p"><s>${rub(BASE.price)}</s><b>${rub(BASE.promo)}</b><small>−${DISCOUNT}% · 48 часов</small></div></div>
<h3 class="kit-g">Допы: включайте то, что нужно магазину</h3>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side">
<div class="kit-total" id="kit-total">
<div class="timer" id="timer"><span>Скидка ${DISCOUNT}% действует<small>48 часов с первого открытия макета</small></span><b id="tm">48:00:00</b></div>
<div class="kt-line"><span>Магазин</span><span><s>${rub(BASE.price)}</s> ${rub(BASE.promo)}</span></div>
<div class="kt-line"><span>Допы · <span id="kit-n">0</span></span><span id="kit-add">0 ₽</span></div>
<div class="kt-sum"><small>Итого</small><b id="kit-sum">${rub(BASE.promo)}</b><small>со всеми допами ${rub(ALL)} вместо ${rub(ALL_REGULAR)}</small></div>
<button type="button" class="btn btn-white" id="kit-all">Включить всё</button>
<a class="btn btn-b" id="kit-go" href="https://t.me/Devuz_studio_bot?start=medikor">${ic("tg")}<span>Обсудить с DevUz Studio</span></a>
<button type="button" class="copy" id="kit-copy">Скопировать состав</button>
</div>
<p class="src">Цены допов: середина рынка студий Москвы и СНГ. Комиссии ЮKassa и банка, хостинг, лицензия 1С и тарифы перевозчиков магазин оплачивает сам, в цену они не входят.</p>
</div>
</div>
</div></section>`;
}

function sitePage() {
  const nav = [["#seychas", "Что меняем"], ["#skaner", "Карточка"], ["#put", "Путь закупщика"], ["#schet", "Счёт по ИНН"], ["#panel", "Панель"], ["#cena", "Стоимость"]];
  const kit = {
    items: ADDONS.map((a) => ({ id: a.id, t: a.ru.t, p: sale(a.price) })), base: BASE.promo, regular: BASE.price, cur: "₽", baseName: BASE.ru.t, hours: OFFER_HOURS,
    copied: "Скопировано", head: `Интернет-магазин ${B}, состав из конструктора:`, total: "Итого", ended: "Срок акции вышел: цена по договорённости",
    orgs: ORGS.map((o) => ({ inn: o.inn, n: o.n, kpp: o.kpp, a: o.a })), anyOrg: "Организация по вашему ИНН (демо: название подставится из ЕГРЮЛ)", anyAddr: "адрес подставится из ЕГРЮЛ",
    innL: "ИНН", kppL: "КПП", innOk: "Реквизиты подставлены, счёт готов", innHint: "Нажмите на организацию ниже или введите свой ИНН", innWait: "Ещё цифр: {n}",
  };
  return `<!doctype html>
<html lang="ru">
<head>
${headTags(`${B} · интернет-магазин медоборудования · макет DevUz Studio`, "Макет интернет-магазина Medikor: счёт организации по ИНН, запрос КП, документы в карточке, доставка с расчётом, панель менеджеров.")}
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=false;try{if(sessionStorage.getItem('mk-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
@@S@@
</head>
<body class="site">
${sprite()}
${introHtml()}
<a class="skip" href="#main">К содержанию</a>
<header class="top" id="top"><div class="wrap">
<a class="logo" href="${href()}" aria-label="${B}">${logo()}</a>
<nav class="nav" aria-label="Разделы">${nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
<div class="top-r"><a class="btn btn-sm btn-b" href="${href("shop")}">Магазин</a></div>
</div></header>
<main id="main">
${[heroBlock(), nowBlock(), scanBlock(), pathBlock(), orgBlock(), panelBlock(), offerBlock()].join("\n")}
</main>
<footer class="foot" data-tone="ink"><div class="wrap">
<div class="cols">
<div><a class="logo" href="${href()}" aria-label="${B}">${logo("f-logo")}</a><p class="f-d">${esc(D.BRAND.about)}</p><ul class="f-c"><li>${ic("phone")}<a href="tel:${D.BRAND.tel}">${D.BRAND.phone}</a></li><li>${ic("mail")}<a href="mailto:${D.BRAND.email}">${D.BRAND.email}</a></li><li>${ic("pin")}<span>${esc(D.BRAND.addr)}</span></li><li>${ic("globe")}<a href="https://${D.BRAND.site}">${D.BRAND.site}</a></li></ul></div>
<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=medikor">Telegram</a></li></ul></div>
<div><b>Данные макета</b><ul><li>Товары, цены, фото, характеристики: medikor.ru</li><li>Цены HR-501 у других: их сайты, 15.10.2026</li><li>Заказы, организации, счета: демо</li></ul></div>
</div>
<div class="rights"><span>Это макет: так может выглядеть интернет-магазин ${B}. Заказы, счета, оплата и КП работают для показа, деньги не списываются.</span><span>Макет принадлежит DevUz Studio. Использовать его можно только по договору: <a href="${TERMS}">условия использования</a></span></div>
</div></footer>
<div class="dock" id="dock"><a class="btn btn-b shim" href="${href("shop")}">${ic("cart")}<span>Открыть магазин</span></a><a class="btn btn-ghost" href="#cena">Стоимость</a></div>
<script type="application/json" id="kit-data">${json(kit)}</script>
<script>
${strip(read("intro.js"))}</script>
@@J@@
</body>
</html>`;
}

const out = { "": sitePage(), shop: shopPage(), panel: panelPage() };
const parts = {
  S: `<style>${min(read("site.css"))}</style>`,
  A: `<style>${min(read("shop.css"))}</style>`,
  K: `<style>${min(read("panel.css"))}</style>`,
  J: `<script>\n${strip(read("site.js"))}</script>`,
  P: `<script>\n${strip(read("shop.js"))}</script>`,
  Q: `<script>\n${strip(read("panel.js"))}</script>`,
};
const fill = (page) => Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), page);

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "medikor.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(12), fill(v).length);
