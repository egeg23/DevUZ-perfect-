import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as D from "./data.mjs";
import { BASE, ADDONS, ALL, OFFER_HOURS, TURNKEY, RATE } from "./plan.mjs";

/*
 * Макет торговой платформы tovar.uz, ru (главный, как у них) и uz:
 *  - главная (`""`, `uz`): промо DevUz и их ценник; первый экран — жидкое
 *    стекло: слово tovar.uz крупно, ценник-линза, вокруг их товары; по
 *    прокрутке товары собираются в витрину, поиск печатает «4/128», и на
 *    одной карточке встают три продавца, дешевле всех отмечен. Дальше поиск
 *    на двух языках, разделы, «сейчас и станет», шесть механик, которых нет у
 *    узбекских площадок, путь покупателя в айфоне, кабинет продавца в окне,
 *    что взяли у лучших, стоимость с допами и отсчётом 48 часов;
 *  - приложение покупателя (`app`, `uz/app`);
 *  - кабинет продавца (`panel`, `uz/panel`).
 * Разделы, товары, цены, продавцы, даты «Цена обновлена» — с tovar.uz
 * (data.mjs); ответы продавцов, оптовые ступени, заказы, запросы и цифры
 * кабинета — демо, так и подписано.
 *
 * Стили и скрипты общие, в странице вместо них @@S@@, @@A@@, @@P@@, @@J@@,
 * @@K@@, @@Q@@. Ссылки — через __PROTO_BASE__, отпечаток ставится при показе
 * зерном из protos.stamp (lib/proto/bundles). Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/tovar";
const BASEP = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Onest:wght@400;700&display=swap";
const read = (f) => readFileSync(DIR + f, "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => grp(n).replace(/ /g, "\u00a0") + "\u00a0$";
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const L2 = (p, l) => (Array.isArray(p) ? (l === "ru" ? p[0] : p[1]) : p);
const href = (l, path = "") => BASEP + (l === "uz" ? "/uz" : "") + (path ? "/" + path : "");
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const sum = (l, n) => grp(n).replace(/ /g, "\u00a0") + "\u00a0" + T(l)("сум", "so‘m");
const G = Object.fromEntries(D.GOODS.map((g) => [g.id, g]));
const TODAY = "2026-10-18";

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
  search: `<circle cx="11" cy="11" r="6.5" ${S}/><path d="m16 16 4 4" ${S}/>`,
  heart: `<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" ${S}/>`,
  scale: `<path d="M12 4v16M7 20h10M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0zM19 7l-2.5 6a3 3 0 0 0 5 0z" ${S}/>`,
  user: `<circle cx="12" cy="8.5" r="3.8" ${S}/><path d="M4.5 20c1.3-3.8 4-5.6 7.5-5.6s6.2 1.8 7.5 5.6" ${S}/>`,
  home: `<path d="M4 11 12 4.5l8 6.5V20h-5.5v-5h-5v5H4z" ${S}/>`,
  grid: `<rect x="4" y="4" width="7" height="7" rx="1.5" ${S}/><rect x="13" y="4" width="7" height="7" rx="1.5" ${S}/><rect x="4" y="13" width="7" height="7" rx="1.5" ${S}/><rect x="13" y="13" width="7" height="7" rx="1.5" ${S}/>`,
  chat: `<path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16h-6l-4.5 4v-4H7a2.5 2.5 0 0 1-2.5-2.5z" ${S}/><path d="M8.5 9h7M8.5 12h4.5" ${S}/>`,
  tag: `<path d="M3.5 12.5V5a1.5 1.5 0 0 1 1.5-1.5h7.5L21 12l-8.5 8.5z" ${S}/><circle cx="8" cy="8" r="1.6" ${S}/>`,
  bolt: `<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" ${S}/>`,
  clock: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 7.5V12l3 2" ${S}/>`,
  truck: `<path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z" ${S}/><circle cx="7" cy="17.5" r="1.8" ${S}/><circle cx="17.5" cy="17.5" r="1.8" ${S}/>`,
  card: `<rect x="3" y="5.5" width="18" height="13" rx="2.5" ${S}/><path d="M3 10h18M7 15h4" ${S}/>`,
  cash: `<rect x="3" y="6.5" width="18" height="11" rx="2" ${S}/><circle cx="12" cy="12" r="2.6" ${S}/>`,
  bank: `<path d="M3.5 9.5 12 4.5l8.5 5M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3.5 20h17" ${S}/>`,
  doc: `<path d="M6 3.5h8l4 4v13H6z" ${S}/><path d="M14 3.5v4h4M9 12h6M9 15.5h6" ${S}/>`,
  chart: `<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" ${S}/>`,
  bell: `<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" ${S}/><path d="M10 20.5h4" ${S}/>`,
  star: `<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" ${S}/>`,
  spark: `<path d="M12 3.5c.8 4.2 2.3 5.7 6.5 6.5-4.2.8-5.7 2.3-6.5 6.5-.8-4.2-2.3-5.7-6.5-6.5 4.2-.8 5.7-2.3 6.5-6.5z" ${S}/>`,
  full: `<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" ${S}/>`,
  menu: `<path d="M4 7h16M4 12h16M4 17h16" ${S}/>`,
  stairs: `<path d="M3.5 19.5h4v-4h4v-4h4v-4h5" ${S}/><path d="M16 4.5h4.5V9" ${S}/>`,
  hand: `<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V5a1.5 1.5 0 0 1 3 0v5M13 10V6a1.5 1.5 0 0 1 3 0v6M16 10.5a1.5 1.5 0 0 1 3 0V14a6.5 6.5 0 0 1-6.5 6.5h-1A6.5 6.5 0 0 1 6 16.5L4 13a1.5 1.5 0 0 1 2.5-1.6L7 12" ${S}/>`,
  send: `<path d="M20.5 3.5 3.5 10.5l7 2.5 2.5 7z" ${S}/><path d="m10.5 13 4-4" ${S}/>`,
  upload: `<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9M4.5 15v4.5h15V15" ${S}/>`,
  shield: `<path d="M12 3.5 19 6v5.5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6z" ${S}/><path d="m9 12 2 2 4-4" ${S}/>`,
  phone: `<path d="M5 4.5h3.5l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" ${S}/>`,
  tg: `<path d="M21 4 3 11l6 2 2 6 3-4 5 4z" ${S}/><path d="m9 13 9-7" ${S}/>`,
  ig: `<rect x="4" y="4" width="16" height="16" rx="4.5" ${S}/><circle cx="12" cy="12" r="3.6" ${S}/><circle cx="16.8" cy="7.2" r=".6" ${S}/>`,
  yt: `<rect x="3" y="6" width="18" height="12" rx="3.5" ${S}/><path d="M10.5 9.5v5l4.2-2.5z" ${S}/>`,
  pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${S}/><circle cx="12" cy="10" r="2.4" ${S}/>`,
  eye: `<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" ${S}/><circle cx="12" cy="12" r="3" ${S}/>`,
  refresh: `<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" ${S}/>`,
  building: `<path d="M5 20.5V4.5h9v16M14 9.5h5v11M3.5 20.5h17M8 8h3M8 11.5h3M8 15h3" ${S}/>`,
  car: `<path d="M4 16.5v-4l2-5h12l2 5v4zM4 16.5V19M20 16.5V19M4 12.5h16" ${S}/><circle cx="7.5" cy="14.5" r=".8" ${S}/><circle cx="16.5" cy="14.5" r=".8" ${S}/>`,
  paw: `<circle cx="7" cy="10" r="1.8" ${S}/><circle cx="17" cy="10" r="1.8" ${S}/><circle cx="10" cy="6" r="1.8" ${S}/><circle cx="14" cy="6" r="1.8" ${S}/><path d="M8 17c0-2.8 1.8-5 4-5s4 2.2 4 5c0 2-2 2.5-4 2.5S8 19 8 17z" ${S}/>`,
  tool: `<path d="M14.5 6.5a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a4 4 0 0 0-2-2z" ${S}/>`,
  pen: `<path d="M4 20l1-4.5L16 4.5l3.5 3.5L8.5 19z" ${S}/><path d="m13.5 7 3.5 3.5" ${S}/>`,
  drop: `<path d="M12 3.5s6 6.6 6 10.5a6 6 0 0 1-12 0c0-3.9 6-10.5 6-10.5z" ${S}/>`,
  shirt: `<path d="M8.5 3.5 4 6l1.5 4.5 2.5-1v11h8v-11l2.5 1L20 6l-4.5-2.5a3.5 3.5 0 0 1-7 0z" ${S}/>`,
  gift: `<rect x="3.5" y="9" width="17" height="11.5" rx="2" ${S}/><path d="M3.5 13h17M12 9v11.5M12 9c-1.6-3.5-5.5-4-5.5-1.5S9.5 9 12 9zm0 0c1.6-3.5 5.5-4 5.5-1.5S14.5 9 12 9z" ${S}/>`,
  gem: `<path d="M6.5 4.5h11l3 5-8.5 10-8.5-10z" ${S}/><path d="M3.5 9.5h17M9.5 4.5 12 9.5l2.5-5M12 9.5v10" ${S}/>`,
  cup: `<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" ${S}/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 6c0-1 1-1.4 1-2.4M11.5 6c0-1 1-1.4 1-2.4" ${S}/>`,
  ring: `<circle cx="12" cy="14.5" r="6" ${S}/><path d="M9.5 4.5h5L16 7l-4 2.5L8 7z" ${S}/>`,
  ball: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5M12 3.5C9.5 5.8 8.2 8.7 8.2 12s1.3 6.2 3.8 8.5" ${S}/>`,
  brick: `<rect x="3.5" y="6" width="17" height="12" rx="1" ${S}/><path d="M3.5 10h17M3.5 14h17M9 6v4M15 10v4M9 14v4" ${S}/>`,
  chip: `<rect x="6.5" y="6.5" width="11" height="11" rx="1.5" ${S}/><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3" ${S}/>`,
  child: `<circle cx="12" cy="6" r="2.6" ${S}/><path d="M8 21v-5l-2-3 3-3.5h6l3 3.5-2 3v5M10 21v-4h4v4" ${S}/>`,
};
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
  .join("")}</defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;
const logo = (cls = "") => `<span class="lg ${cls}"><img src="${IMG}/logo.webp" alt="tovar.uz" width="117" height="34"></span>`;
/* Преломление стекла: смещение по шуму, только для линзы и капсулы поиска. */
const LQ = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><filter id="lq" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" result="n"/><feGaussianBlur in="n" stdDeviation="2" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="38" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;

/* ── Данные для скриптов ─────────────────────────────────────────────── */
const PAYN = (l) => ({ uzcard: "Uzcard", click: "Click", payme: "Payme", uzum: "Uzum Bank", cash: T(l)("Наличный расчёт", "Naqd hisob-kitob"), bank: T(l)("Перечисление", "Pul o‘tkazish") });
function goods(l) {
  return D.GOODS.map((g) => ({ id: g.id, cat: g.cat, s: g.s, p: g.p, st: g.st, upd: g.upd, n: L2(g.n, l), alt: L2(g.n, l === "ru" ? "uz" : "ru"), mem: g.mem || "", biz: !!g.biz, cut: !!g.cut, spec: (g.spec || []).map((r) => [l === "ru" ? r[0] : r[1], r[2]]) }));
}
function sellers(l) {
  return Object.fromEntries(Object.entries(D.SELLERS).map(([k, s]) => [k, { n: s.n, legal: s.legal, pay: s.pay, addr: s.addr ? L2(s.addr, l) : "", hours: s.hours ? L2(s.hours, l) : "", deliv: s.deliv ? L2(s.deliv, l) : "" }]));
}
const cats = (l) => D.CATS.map((c) => ({ id: c.id, ic: c.ic, n: L2(c.n, l) }));
const subs = (l) => Object.fromEntries(Object.entries(D.SUB).map(([k, v]) => [k, L2(v, l)]));
/* Оптовые ступени — пример, у продавца на сайте до четырёх своих. */
const LADDER = { 53664: [[1, 1600000], [5, 1540000], [10, 1490000], [20, 1440000]] };
/* Время ответа продавцов — демо, его считал бы кабинет по переписке. */
const REPLY = { elso: 14, shopit: 6, macbro: 22, sandal: 40, laptop: 95, sayina: 18 };

function common(l) {
  const t = T(l);
  return {
    lang: l, img: IMG, today: TODAY, terms: TERMS(l), site: href(l), app: href(l, "app"), panel: href(l, "panel"),
    goods: goods(l), sellers: sellers(l), cats: cats(l), subs: subs(l), syn: D.SYN, pay: PAYN(l), ladder: LADDER, reply: REPLY,
    pillars: D.PILLARS.map((p) => ({ id: p.id, n: L2(p.n, l) })), popular: Object.fromEntries(Object.entries(D.POPULAR).map(([k, v]) => [k, v.map((x) => L2(x, l))])),
    regions: D.REGIONS.map((r) => L2(r, l)), sum: t("сум", "so‘m"),
  };
}

/* ── Общая шапка документа ──────────────────────────────────────────── */
function headTags(l, title, desc) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0a0c16">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}
const langSw = (l, path) => `<div class="lang"><a href="${href("ru", path)}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz", path)}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>`;
const demoStrip = (l) => {
  const t = T(l);
  return `<p class="demo-strip">${t("Макет DevUz Studio · товары и цены с tovar.uz, заказы и ответы демо", "DevUz Studio maketi · tovarlar va narxlar tovar.uz’dan, buyurtma va javoblar demo")} <a href="${href(l)}#cena">${t("Стоимость", "Narxi")}</a></p>`;
};

/* ── Приложение покупателя ──────────────────────────────────────────── */
function appUi(l) {
  const t = T(l);
  return {
    search: t("Смартфон, quloqchin, 4/128…", "Smartfon, quloqchin, 4/128…"), find: t("Найти", "Topish"), cancel: t("Отмена", "Bekor"),
    hello: t("Что ищем сегодня?", "Bugun nima qidiramiz?"), cats: t("Разделы", "Bo‘limlar"), allCats: t("Все разделы", "Barcha bo‘limlar"),
    fresh: t("Свежие цены", "Yangi narxlar"), freshSub: t("Продавцы подтвердили цену недавно", "Sotuvchilar narxni yaqinda tasdiqlagan"),
    rfqBan: t("Нужно оптом? Спросите цену у всех продавцов сразу", "Ulgurji kerakmi? Barcha sotuvchilardan narxni birdaniga so‘rang"), rfqGo: t("Запросить цену", "Narx so‘rash"),
    hits: t("Смотрят сейчас", "Hozir ko‘rishyapti"), results: t("Нашли", "Topildi"), nothing: t("Ничего не нашли. Попробуйте «quloqchin» или «телевизор».", "Hech narsa topilmadi. «наушники» yoki «televizor» deb ko‘ring."),
    inStock: t("В наличии", "Mavjud"), onOrder: t("Под заказ", "Buyurtma bilan"), fFresh: t("Цена свежая", "Narx yangi"), fCheap: t("Сначала дешевле", "Avval arzon"),
    updated: t("Цена обновлена", "Narx yangilangan"), confirmed: t("Продавец подтвердил цену сегодня", "Sotuvchi narxni bugun tasdiqladi"),
    ago_d: t("{n} дн. назад", "{n} kun oldin"), ago_m: t("{n} мес. назад", "{n} oy oldin"), ago_y: t("{n} г. назад", "{n} yil oldin"), today: t("сегодня", "bugun"),
    stale: t("Цена давно не подтверждалась: уточните у продавца", "Narx uzoq vaqt tasdiqlanmagan: sotuvchidan aniqlang"),
    seller: t("Продавец", "Sotuvchi"), reply: t("Отвечает", "Javob beradi"), replies: t("обычно отвечает за {n} мин", "odatda {n} daqiqada javob beradi"), repliesH: t("обычно отвечает за {n} ч", "odatda {n} soatda javob beradi"),
    replyNote: t("по ответам на tovar.uz за 30 дней", "tovar.uz’dagi 30 kunlik javoblar bo‘yicha"), pays: t("Оплата", "To‘lov"), deliv: t("Доставка", "Yetkazish"), hours: t("Режим работы", "Ish vaqti"),
    toCart: t("В корзину", "Savatga"), inCart: t("В корзине", "Savatda"), offer: t("Предложить свою цену", "O‘z narxingizni taklif qilish"), ask: t("Спросить продавца", "Sotuvchidan so‘rash"),
    cmpAdd: t("Сравнить", "Solishtirish"), cmpOn: t("В сравнении", "Solishtirishda"),
    others: t("Та же память у других продавцов", "Boshqa sotuvchilarda xuddi shu xotira"), othersCat: t("Похожие у других продавцов", "Boshqa sotuvchilarda o‘xshashlari"),
    cheapest: t("дешевле всех", "eng arzon"), thisOne: t("вы смотрите", "siz ko‘ryapsiz"),
    ladder: t("Опт лесенкой", "Zinapoya ulgurji"), ladderNote: t("Пример ступеней: продавец ставит до четырёх своих", "Bosqichlar namunasi: sotuvchi to‘rttagacha o‘zinikini qo‘yadi"), from: t("от {n} шт.", "{n} donadan"), perPc: t("за шт.", "donasi"),
    specs: t("Характеристики", "Xususiyatlar"), compare: t("Сравнение", "Solishtirish"), cmpEmpty: t("Добавьте товары кнопкой «Сравнить» на карточке.", "Kartochkadagi «Solishtirish» tugmasi bilan tovar qo‘shing."),
    price: t("Цена", "Narx"), stock: t("Наличие", "Mavjudlik"), memory: t("Память", "Xotira"), freshness: t("Свежесть цены", "Narx yangiligi"),
    cart: t("Корзина", "Savat"), cartEmpty: t("В корзине пусто. Начните с поиска.", "Savat bo‘sh. Qidiruvdan boshlang."), total: t("Итого", "Jami"), checkout: t("Оформить", "Rasmiylashtirish"),
    ladderHint: t("Ещё {k} шт., и цена за штуку {p}", "Yana {k} dona, va dona narxi {p}"), ladderGot: t("Цена за штуку уже {p}: ступень от {n} шт.", "Dona narxi allaqachon {p}: {n} donadan bosqich"), saved: t("экономия", "tejash"),
    phone: t("Телефон", "Telefon"), getCode: t("Получить код", "Kod olish"), codeSent: t("Код ушёл по SMS. В макете это 1234.", "Kod SMS orqali ketdi. Maketda bu 1234."), code: t("Код из SMS", "SMS kod"), badCode: t("Код не подошёл: в макете это 1234", "Kod mos kelmadi: maketda bu 1234"),
    noReg: t("Без почты и пароля: кабинет заведётся сам", "Pochta va parolsiz: kabinet o‘zi ochiladi"),
    who: t("Кто платит", "Kim to‘laydi"), person: t("Частное лицо", "Jismoniy shaxs"), company: t("Компания", "Kompaniya"), inn: t("ИНН компании", "Kompaniya STIR"),
    innFound: t("Нашли в справочнике Golden Pages: {n}. Счёт придёт вместе с заказом.", "Golden Pages ma’lumotnomasida topildi: {n}. Hisob buyurtma bilan keladi."), innDemo: t("ООО «Пример Савдо», демо", "«Namuna Savdo» MChJ, demo"),
    how: t("Как получить", "Qanday olish"), delivery: t("Доставка", "Yetkazish"), pickup: t("Самовывоз у продавца", "Sotuvchidan olib ketish"), addr: t("Адрес", "Manzil"),
    payBy: t("Оплата", "To‘lov"), cashC: t("Наличными курьеру", "Kuryerga naqd"), bankT: t("Перечислением по счёту", "Hisob bo‘yicha o‘tkazma"),
    place: t("Оформить заказ", "Buyurtma berish"), payCode: t("Подтвердите оплату кодом", "To‘lovni kod bilan tasdiqlang"), pay: t("Оплатить", "To‘lash"), paid: t("Оплачено", "To‘landi"),
    order: t("Заказ", "Buyurtma"), st0: t("Принят", "Qabul qilindi"), st1: t("Продавец подтвердил", "Sotuvchi tasdiqladi"), st2: t("Собран", "Yig‘ildi"), st3: t("В пути", "Yo‘lda"), st4: t("Доставлен", "Yetkazildi"),
    stNote: t("Статус меняет продавец в кабинете: нажмите «Дальше» там, и он сменится здесь.", "Holatni sotuvchi kabinetda o‘zgartiradi: u yerda «Keyingi» ni bosing, bu yerda o‘zgaradi."), openPanel: t("Открыть кабинет продавца", "Sotuvchi kabinetini ochish"),
    offerT: t("Ваша цена", "Sizning narxingiz"), qty: t("Количество", "Soni"), offerSend: t("Отправить продавцу", "Sotuvchiga yuborish"), offerSent: t("Предложение ушло продавцу. Ответ придёт сюда и в Telegram, обычно в течение суток.", "Taklif sotuvchiga ketdi. Javob shu yerga va Telegramga keladi, odatda bir kun ichida."),
    offerLow: t("Слишком низко: продавец такие не видит. Не ниже {p}.", "Juda past: sotuvchi bunday takliflarni ko‘rmaydi. {p} dan past emas."),
    askT: t("Ваш вопрос", "Savolingiz"), askPh: t("Есть ли гарантия? Можно забрать сегодня?", "Kafolat bormi? Bugun olib ketsa bo‘ladimi?"), askSend: t("Спросить", "So‘rash"), askSent: t("Вопрос у продавца. Ответ увидят все, кто откроет карточку.", "Savol sotuvchida. Javobni kartochkani ochgan hamma ko‘radi."),
    qa: t("Вопросы о товаре", "Tovar haqida savollar"), noAns: t("ждёт ответа", "javob kutmoqda"),
    me: t("Профиль", "Profil"), myOrders: t("Мои заказы", "Buyurtmalarim"), myOffers: t("Мои предложения цены", "Narx takliflarim"), myRfq: t("Мои запросы цены", "Narx so‘rovlarim"), none: t("Пока пусто", "Hozircha bo‘sh"),
    oWait: t("ждёт ответа продавца", "sotuvchi javobini kutmoqda"), oYes: t("продавец согласен", "sotuvchi rozi"), oNo: t("продавец отказал", "sotuvchi rad etdi"), oCounter: t("встречная цена {p}", "qarshi narx {p}"), buyAt: t("Взять по этой цене", "Shu narxda olish"),
    rfq: t("Запрос цены", "Narx so‘rovi"), rfqSub: t("Опишите, что нужно, и продавцы раздела пришлют цену и срок. Ответы соберутся здесь.", "Nima kerakligini yozing, bo‘lim sotuvchilari narx va muddat yuboradi. Javoblar shu yerda yig‘iladi."),
    rfqWhat: t("Что нужно", "Nima kerak"), rfqWhatV: t("Водонагреватель 30 л, электрический", "Suv isitgich 30 l, elektr"), rfqRegion: t("Куда", "Qayerga"), rfqWhen: t("Срок", "Muddat"), rfqWhenV: t("до пятницы", "jumagacha"),
    rfqSend: t("Отправить продавцам", "Sotuvchilarga yuborish"), rfqWait: t("Запрос у продавцов раздела «Водонагреватели». Ответы появятся ниже.", "So‘rov «Suv isitgichlari» bo‘limi sotuvchilarida. Javoblar pastda paydo bo‘ladi."),
    quotes: t("Ответы продавцов", "Sotuvchilar javoblari"), quoteDemo: t("демо-ответ", "demo-javob"), days: t("{n} дн.", "{n} kun"), take: t("Выбрать", "Tanlash"), taken: t("Выбрано: продавец получил заказ", "Tanlandi: sotuvchi buyurtmani oldi"),
    home: t("Главная", "Bosh sahifa"), catalog: t("Каталог", "Katalog"), pcs: t("шт.", "dona"), del: t("Убрать", "Olib tashlash"), more: t("Больше", "Ko‘proq"), less: t("Меньше", "Kamroq"),
    added: t("Добавлено в корзину", "Savatga qo‘shildi"), cmpFull: t("В сравнении уже три товара", "Solishtirishda allaqachon uchta tovar"), copyOk: t("Готово", "Tayyor"), back: t("Назад", "Orqaga"),
    sumW: t("сум", "so‘m"), byPrice: t("По цене", "Narx bo‘yicha"), biz: t("для бизнеса", "biznes uchun"),
  };
}
function appPage(l) {
  const t = T(l);
  const tabs = [["home", "#/", "home", t("Главная", "Bosh sahifa")], ["cat", "#/c/all", "grid", t("Каталог", "Katalog")], ["cmp", "#/cmp", "scale", t("Сравнение", "Solishtirish")], ["cart", "#/cart", "bag", t("Корзина", "Savat")], ["me", "#/me", "user", t("Профиль", "Profil")]];
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t("tovar.uz · поиск, сравнение, заказ · макет DevUz Studio", "tovar.uz · qidiruv, solishtirish, buyurtma · DevUz Studio maketi"), t("Приложение покупателя tovar.uz: поиск на двух языках, карточка с ценами разных продавцов и свежестью цены, торг, опт лесенкой, запрос цены, заказ по телефону, оплата Click, Payme, Uzum.", "tovar.uz xaridor ilovasi: ikki tilda qidiruv, turli sotuvchilar narxi va narx yangiligi bilan kartochka, savdolashish, zinapoya ulgurji, narx so‘rovi, telefon bilan buyurtma, Click, Payme, Uzum to‘lovi."))}
@@A@@
</head>
<body class="app" data-lang="${l}">
${sprite()}
<a class="skip" href="#view">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top" id="top">${demoStrip(l)}<div class="hd"><div class="hd-in">
<a class="logo" href="#/" aria-label="tovar.uz">${logo()}</a>
<button type="button" class="hd-s" data-search>${ic("search")}<span>${t("Смартфон, quloqchin, 4/128", "Smartfon, quloqchin, 4/128")}</span></button>
${langSw(l, "app")}
<a href="#/cart" class="hd-cart" aria-label="${t("Корзина", "Savat")}">${ic("bag")}<b class="bdg" data-badge="cart" hidden>0</b></a>
</div></div></header>
<main id="view" tabindex="-1"></main>
<nav class="tabbar" aria-label="${t("Разделы", "Bo‘limlar")}">${tabs.map(([k, u, i, n]) => `<a href="${u}" data-tab="${k}">${ic(i)}<span>${n}</span>${k === "cart" || k === "cmp" ? `<b class="bdg" data-badge="${k}" hidden>0</b>` : ""}</a>`).join("")}</nav>
<div id="search" hidden role="dialog" aria-modal="true" aria-label="${t("Поиск", "Qidiruv")}"><div class="sq-top"><form id="sq-form" role="search">${ic("search")}<input id="sq" type="search" enterkeyhint="search" autocomplete="off" placeholder="${t("Смартфон, quloqchin, 4/128…", "Smartfon, quloqchin, 4/128…")}" aria-label="${t("Поиск", "Qidiruv")}"></form><button type="button" class="lnk" id="sq-x">${t("Отмена", "Bekor")}</button></div><div id="sq-res"></div></div>
<div id="sheet" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<footer class="a-foot"><a href="${TERMS(l)}">${t("Условия использования макета", "Maketdan foydalanish shartlari")}</a></footer>
<script type="application/json" id="tv-data">${json({ ...common(l), ui: appUi(l) })}</script>
@@P@@
</body>
</html>`;
}

/* ── Кабинет продавца ───────────────────────────────────────────────── */
function panelUi(l) {
  const t = T(l);
  return {
    h_dash: t("Сводка", "Umumiy"), h_start: t("Компания за минуту", "Bir daqiqada kompaniya"), h_goods: t("Товары и цены", "Tovarlar va narxlar"), h_orders: t("Заказы", "Buyurtmalar"),
    h_ask: t("Вопросы и торг", "Savollar va savdolashish"), h_rfq: t("Запросы цены", "Narx so‘rovlari"), h_stats: t("Где теряем покупателей", "Xaridorni qayerda yo‘qotamiz"),
    newOrders: t("Новые заказы", "Yangi buyurtmalar"), waiting: t("Ждут ответа", "Javob kutmoqda"), reply: t("Отвечаете в среднем", "O‘rtacha javob"), stale: t("Цены старше 30 дней", "30 kundan eski narxlar"),
    min: t("мин", "daq"), confirmAll: t("Подтвердить все цены", "Barcha narxlarni tasdiqlash"), confirmed: t("Цены подтверждены: у покупателя «Цена свежая»", "Narxlar tasdiqlandi: xaridorda «Narx yangi»"),
    confirm: t("Подтвердить", "Tasdiqlash"), fresh: t("свежая", "yangi"), updated: t("обновлена", "yangilangan"), today: t("сегодня", "bugun"),
    goods: t("Товар", "Tovar"), price: t("Цена", "Narx"), stock: t("Наличие", "Mavjudlik"), inStock: t("В наличии", "Mavjud"), onOrder: t("Под заказ", "Buyurtma bilan"), age: t("Свежесть", "Yangilik"),
    ladder: t("Опт", "Ulgurji"), ladderEdit: t("Оптовые ступени", "Ulgurji bosqichlar"), ladderSave: t("Сохранить ступени", "Bosqichlarni saqlash"), from: t("от, шт.", "dan, dona"), saved: t("Сохранено, покупатель видит в корзине", "Saqlandi, xaridor savatda ko‘radi"),
    order: t("Заказ", "Buyurtma"), buyer: t("Покупатель", "Xaridor"), sum: t("Сумма", "Summa"), status: t("Статус", "Holat"), next: t("Дальше", "Keyingi"),
    st0: t("Принят", "Qabul qilindi"), st1: t("Подтверждён", "Tasdiqlandi"), st2: t("Собран", "Yig‘ildi"), st3: t("В пути", "Yo‘lda"), st4: t("Доставлен", "Yetkazildi"),
    noOrders: t("Заказов пока нет. Оформите заказ в приложении покупателя, и он появится здесь первой строкой.", "Hozircha buyurtma yo‘q. Xaridor ilovasida buyurtma bering, u shu yerda birinchi qatorda paydo bo‘ladi."),
    toApp: t("Открыть приложение покупателя", "Xaridor ilovasini ochish"), question: t("Вопрос", "Savol"), offer: t("Предложение цены", "Narx taklifi"), answer: t("Ответить", "Javob berish"), answerPh: t("Да, гарантия 12 месяцев, заберите сегодня до 18:00", "Ha, kafolat 12 oy, bugun 18:00 gacha olib keting"),
    accept: t("Согласиться", "Rozi bo‘lish"), decline: t("Отказать", "Rad etish"), counter: t("Своя цена", "O‘z narxim"), answered: t("Ответ ушёл покупателю", "Javob xaridorga ketdi"),
    wantsAt: t("хочет за {p} · {q} шт.", "{p} ga xohlaydi · {q} dona"), list: t("ваша цена {p}", "sizning narxingiz {p}"), noAsk: t("Вопросов нет. Спросите что-нибудь на карточке в приложении.", "Savollar yo‘q. Ilovadagi kartochkada biror narsa so‘rang."),
    rfqFrom: t("Запрос", "So‘rov"), quote: t("Ваша цена за шт.", "Dona uchun narxingiz"), term: t("Срок, дней", "Muddat, kun"), sendQuote: t("Отправить цену", "Narx yuborish"), quoted: t("Цена ушла покупателю", "Narx xaridorga ketdi"),
    innT: t("ИНН компании", "Kompaniya STIR"), innGo: t("Найти", "Topish"), innFound: t("Нашли в справочнике Golden Pages. Проверьте и откройте магазин.", "Golden Pages ma’lumotnomasida topildi. Tekshiring va do‘konni oching."),
    fName: t("Название", "Nomi"), fLegal: t("Юридическое название", "Yuridik nomi"), fAddr: t("Адрес", "Manzil"), fPhone: t("Телефон", "Telefon"), fPay: t("Как принимаете оплату", "To‘lovni qanday qabul qilasiz"),
    open: t("Открыть магазин", "Do‘konni ochish"), opened: t("Магазин открыт. Модератор посмотрит после, а не до: покупатели видят вас уже сейчас.", "Do‘kon ochildi. Moderator oldin emas, keyin ko‘radi: xaridorlar sizni hozirdanoq ko‘rishadi."),
    excel: t("Товары из Excel", "Excel’dan tovarlar"), excelD: t("Перетащите файл или нажмите: название, цена, наличие, до четырёх оптовых ступеней.", "Faylni torting yoki bosing: nom, narx, mavjudlik, to‘rttagacha ulgurji bosqich."), excelGo: t("Загрузить пример", "Namunani yuklash"), excelDone: t("Загружено {n} товаров из файла", "Fayldan {n} ta tovar yuklandi"),
    secs: t("сек", "son"), steps: t("Шаг", "Qadam"),
    views: t("Просмотры", "Ko‘rishlar"), carts: t("В корзину", "Savatga"), orders: t("Заказы", "Buyurtmalar"), funnel: t("От просмотра до заказа, 30 дней, демо", "Ko‘rishdan buyurtmagacha, 30 kun, demo"),
    lose: t("Что мешает купить", "Sotib olishga nima xalaqit beradi"), lose1: t("У {n} цена не подтверждалась больше года: такие ниже в поиске.", "{n} da narx bir yildan ko‘p tasdiqlanmagan: bunday tovarlar qidiruvda pastda."),
    lose2: t("«Под заказ» у {n} товаров: покупатель чаще берёт то, что в наличии.", "{n} ta tovarda «Buyurtma bilan»: xaridor ko‘proq mavjudini oladi."), lose3: t("Ответ на вопрос дольше часа: каждый второй уходит к соседу. Демо-оценка.", "Savolga javob bir soatdan ko‘p: har ikkinchisi qo‘shniga ketadi. Demo-baho."),
    viewAs: t("Смотреть как продавец", "Sotuvchi sifatida ko‘rish"), live: t("Сейчас", "Hozir"), demo: t("демо", "demo"), sumW: t("сум", "so‘m"),
    wd: t("Вс|Пн|Вт|Ср|Чт|Пт|Сб", "Ya|Du|Se|Ch|Pa|Ju|Sh").split("|"),
  };
}
function panelPage(l) {
  const t = T(l);
  const u = panelUi(l);
  const nav = [["dash", "grid", u.h_dash], ["start", "bolt", u.h_start], ["goods", "tag", u.h_goods], ["orders", "bag", u.h_orders, "orders"], ["ask", "chat", u.h_ask, "ask"], ["rfq", "doc", u.h_rfq, "rfq"], ["stats", "chart", u.h_stats]];
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t("Кабинет продавца tovar.uz · макет DevUz Studio", "tovar.uz sotuvchi kabineti · DevUz Studio maketi"), t("Кабинет продавца tovar.uz: компания за минуту по ИНН, товары и свежесть цен, опт лесенкой, заказы со статусами, вопросы и торг, запросы цены, где теряются покупатели.", "tovar.uz sotuvchi kabineti: STIR bo‘yicha bir daqiqada kompaniya, tovarlar va narx yangiligi, zinapoya ulgurji, holatli buyurtmalar, savollar va savdolashish, narx so‘rovlari."))}
@@K@@
</head>
<body class="panel" data-lang="${l}">
${sprite()}
${demoStrip(l)}
<div class="app-w">
<div class="nav-back" id="nav-back"></div>
<aside class="side-nav" aria-label="${t("Разделы кабинета", "Kabinet bo‘limlari")}">
<div class="brand">${logo()}<small>${t("Кабинет продавца", "Sotuvchi kabineti")}</small></div>
<nav class="nav">${nav.map(([k, i, n, c]) => `<a href="#${k}">${ic(i)}<span>${n}</span>${c ? `<i data-cnt="${c}" hidden>0</i>` : ""}</a>`).join("")}</nav>
<div class="role"><p>${u.viewAs}</p><div role="radiogroup" id="as">${["shopit", "elso", "macbro", "sayina"].map((k, i) => `<button type="button" role="radio" data-s="${k}" aria-checked="${i === 0}">${D.SELLERS[k].n}</button>`).join("")}</div>
<a class="to-app" href="${href(l, "app")}">${ic("bag")}<span>${u.toApp}</span></a></div>
</aside>
<div class="main">
<header class="topbar" id="top"><button type="button" class="ib" id="menu-b" aria-label="${t("Меню", "Menyu")}">${ic("menu")}</button><b class="tb-t" id="tb-t"></b><span class="sp"></span><span class="tb-live"><i></i>${u.live} <b id="clock"></b></span>${langSw(l, "panel")}</header>
<main id="pv"></main>
<p class="demo">${t("Макет DevUz Studio: товары, цены и даты с tovar.uz, заказы, вопросы, запросы и цифры кабинета демо.", "DevUz Studio maketi: tovarlar, narxlar va sanalar tovar.uz’dan, buyurtmalar, savollar, so‘rovlar va kabinet raqamlari demo.")} <a href="${TERMS(l)}">${t("Условия использования", "Foydalanish shartlari")}</a></p>
</div></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="tp-data">${json({ ...common(l), ui: u })}</script>
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
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t("макет для торговой платформы tovar.uz", "tovar.uz savdo platformasi uchun maket")}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<canvas class="tv-cv" aria-hidden="true" data-logo="${IMG}/logo.webp" data-name="${esc(t("торговая платформа · с 2020", "savdo platformasi · 2020 yildan"))}"></canvas>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish")}</button>
</div>`;
}
const head = (kicker, h, lead, anim = "up") => `<div class="sec-head rv a-${anim}"><span class="kicker">${kicker}</span><h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>`;
const phone = (l, path, id) => `<div class="iph" id="${id}"><div class="iph-in"><div class="iscr"><iframe title="${T(l)("Приложение tovar.uz", "tovar.uz ilovasi")}" data-src="${href(l, "app")}?embed=1${path}" loading="lazy"></iframe></div><span class="iisl" aria-hidden="true"></span></div></div>`;
const tagPath = "M50 0 L100 21 Q100 21 100 26 L100 94 Q100 100 94 100 L6 100 Q0 100 0 94 L0 26 Q0 21 0 21 Z";

/* Товары первого экрана: девять вырезанных снимков вокруг ценника, потом
   витрина три на три; на «4/128» остаётся Galaxy A13 и встают ещё два
   продавца с той же памятью. */
const ORBIT = [113945, 113755, 130426, 113844, 130576, 113670, 127572, 118414, 113918];
const TRIO = [113918, 127578, 127558];
function heroBlock(l) {
  const t = T(l);
  const card = (g, k, extra = "") => {
    const s = D.SELLERS[g.s];
    return `<div class="pr ${extra}" data-k="${k}" data-id="${g.id}"><div class="pr-c" aria-hidden="true"></div><div class="pr-tile" aria-hidden="true"></div><img src="${IMG}/${g.cut ? "c" : "p"}-${g.id}.webp" alt="" draggable="false" decoding="async"${k < 4 ? ' fetchpriority="high"' : ""}><div class="pr-m"><b>${sum(l, g.p)}</b><small>${esc(s.n)} · ${g.upd.split("-").reverse().join(".")}</small></div></div>`;
  };
  const trio = TRIO.map((id) => G[id]).sort((a, b) => a.p - b.p);
  return `<section class="hero" id="hero"><div class="stage">
<div class="world" aria-hidden="true"><img class="w-img" src="${IMG}/hero-glass-m.webp" srcset="${IMG}/hero-glass-m.webp 960w, ${IMG}/hero-glass.webp 1920w" sizes="100vw" alt="" fetchpriority="high" decoding="async"><video class="w-vid" muted loop playsinline preload="none" data-src="${IMG}/hero-glass.mp4"></video></div>
<div class="shelf" aria-hidden="true">${ORBIT.map((id, k) => card(G[id], k)).join("")}${trio.filter((g) => g.id !== 113918).map((g, k) => card(g, 9 + k, "pr-x")).join("")}</div>
<div class="lens" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${tagPath}"/></svg><span class="lens-hole"></span></div>
<div class="hero-word" aria-hidden="true"><svg viewBox="0 0 1000 300" focusable="false"><text x="500" y="228" text-anchor="middle"><tspan>to</tspan><tspan class="v">v</tspan><tspan>ar</tspan></text><text class="dot" x="912" y="290" text-anchor="end">.uz</text></svg></div>
<h1 class="sr">${t("tovar.uz: торговая платформа Узбекистана. Товары, товары для бизнеса и услуги от компаний Ташкента и всех областей.", "tovar.uz: O‘zbekiston savdo platformasi. Toshkent va barcha viloyatlar kompaniyalaridan tovarlar, biznes uchun mahsulotlar va xizmatlar.")}</h1>
<form class="hero-q" id="hero-q" role="search" action="${href(l, "app")}"><label class="sr" for="hq-i">${t("Поиск по tovar.uz", "tovar.uz bo‘yicha qidiruv")}</label>${ic("search")}<input id="hq-i" name="q" autocomplete="off" placeholder="${t("Смартфон 4/128", "Smartfon 4/128")}"><button type="submit" class="btn btn-red">${t("Найти", "Topish")}</button></form>
<ul class="trio-s" aria-label="${t("Смартфоны 4/128 у разных продавцов", "Turli sotuvchilarda 4/128 smartfonlar")}">${trio.map((g) => `<li><img src="${IMG}/p-${g.id}.webp" alt="" loading="lazy"><b>${sum(l, g.p)}</b><small>${esc(D.SELLERS[g.s].n)}</small></li>`).join("")}</ul>
<div class="hero-cap"><p class="kicker">${t("Торговая платформа · Ташкент и 14 областей", "Savdo platformasi · Toshkent va 14 viloyat")}</p><p>${t("Товары, товары для бизнеса и услуги от компаний: SHOP-IT, ELSO.UZ, MacBro, Sayina Stroy и других.", "Kompaniyalardan tovarlar, biznes uchun mahsulotlar va xizmatlar: SHOP-IT, ELSO.UZ, MacBro, Sayina Stroy va boshqalar.")}</p></div>
<div class="hero-out"><p class="kicker">${t("Одна вещь, три продавца", "Bitta narsa, uch sotuvchi")}</p><h2>${t("Видно, <em>у кого дешевле</em>", "Kimda <em>arzonroq</em>, ko‘rinadi")}</h2><p>${t(`Смартфоны с памятью 4/128 на tovar.uz сегодня: от ${sum(l, trio[0].p)} до ${sum(l, trio[2].p)}. Сейчас это три карточки в разных местах выдачи.`, `Bugun tovar.uz’dagi 4/128 xotirali smartfonlar: ${sum(l, trio[0].p)} dan ${sum(l, trio[2].p)} gacha. Hozir bu qidiruvning turli joylaridagi uchta kartochka.`)}</p><div class="hero-cta"><a class="btn btn-red" href="${href(l, "app")}#/p/127578">${ic("scale")}<span>${t("Открыть карточку", "Kartochkani ochish")}</span></a><a class="btn btn-glass" href="#mehaniki">${t("Шесть новых механик", "Olti yangi mexanika")}</a></div></div>
<span class="hero-hint" aria-hidden="true"></span>
</div></section>`;
}

function marqBlock(l) {
  const one = D.CATS.map((c) => `<span>${esc(L2(c.n, l))}${ic("tag")}</span>`).join("");
  return `<div class="marq" aria-hidden="true"><div class="marq-t">${one}${one}</div></div>`;
}

function searchBlock(l) {
  const t = T(l);
  const tries = l === "ru" ? ["quloqchin", "телевизор", "4/128", "ariston", "noutbuk"] : ["наушники", "televizor", "4/128", "ariston", "ноутбук"];
  return `<section id="poisk"><div class="wrap">
${head(t("Поиск и разделы", "Qidiruv va bo‘limlar"), t("Ищет <em>на двух языках</em>", "<em>Ikki tilda</em> qidiradi"), t("Сейчас на узбекской версии tovar.uz подсказки по-русски. Здесь «quloqchin» и «наушники» ведут к одним и тем же товарам. Попробуйте, товары и цены настоящие, с вашего сайта.", "Hozir tovar.uz’ning o‘zbekcha versiyasida maslahatlar ruscha. Bu yerda «quloqchin» va «наушники» bir xil tovarlarga olib boradi. Sinab ko‘ring, tovarlar va narxlar haqiqiy, saytingizdan."))}
<div class="sx rv a-rise"><form class="sx-q glass" id="sx-form" role="search"><label class="sr" for="sx">${t("Поиск", "Qidiruv")}</label>${ic("search")}<input id="sx" autocomplete="off" value="${tries[0]}"><span class="sx-n" id="sx-n"></span></form>
<div class="sx-try">${tries.map((q) => `<button type="button" data-q="${q}">${q}</button>`).join("")}</div>
<div class="sx-res" id="sx-res" aria-live="polite"></div></div>
<div class="pills rv a-up" role="tablist">${D.PILLARS.map((p, i) => `<button type="button" role="tab" data-p="${p.id}" aria-selected="${i === 0}">${L2(p.n, l)}</button>`).join("")}</div>
<div class="pop rv a-up" id="pop"></div>
<ul class="cats">${D.CATS.map((c, i) => `<li class="rv a-pop" style="--d:${(i % 5) * 40}ms"><a href="${href(l, "app")}#/c/all">${ic(c.ic)}<span>${L2(c.n, l)}</span></a></li>`).join("")}</ul>
</div></section>`;
}

function nowBlock(l) {
  const t = T(l);
  return `<section id="seychas"><div class="wrap">
${head(t("Сейчас и станет", "Hozir va keyin"), t("Что мы увидели <em>на tovar.uz</em>", "tovar.uz’da <em>nimani ko‘rdik</em>"), t("Мы открыли tovar.uz с телефона, как покупатель, который ищет смартфон, и как компания, которая хочет продавать.", "tovar.uz’ni telefondan smartfon qidirayotgan xaridor va sotmoqchi bo‘lgan kompaniya kabi ochdik."))}
<ol class="nw">${D.NOW.map((r, i) => { const a = r.buy.map((k) => ADDONS.find((x) => x.id === k)), p = a.reduce((s, x) => s + x.price, 0), h = a.reduce((s, x) => s + x.h, 0); return `<li class="rv a-flip" style="--d:${i * 60}ms"><span class="nw-n">${i + 1}</span><p class="nw-was">${L2(r.now, l)}</p>${ic("arrow", "nw-ar")}<p class="nw-is">${L2(r.next, l)}</p><div class="nw-buy"><span><b>+${usd(p)}</b><small>${t(`≈ ${h} ч работы`, `≈ ${h} soat ish`)}</small></span><button type="button" class="btn btn-glass btn-sm" data-buy="${r.buy.join(",")}" aria-pressed="false">${ic("plus")}<span>${t("В стоимость", "Narxga qo‘shish")}</span></button></div></li>`; }).join("")}</ol>
<p class="nw-sum">${t(`Все шесть доработок: ${usd(D.NOW.flatMap((r) => r.buy).reduce((s, k) => s + ADDONS.find((x) => x.id === k).price, 0))}, по ${RATE} $ за час работы.`, `Oltita yaxshilanishning hammasi: ${usd(D.NOW.flatMap((r) => r.buy).reduce((s, k) => s + ADDONS.find((x) => x.id === k).price, 0))}, bir soat ish uchun ${RATE} $.`)} <a href="#cena">${t("Стоимость", "Narxi")}</a></p>
</div></section>`;
}

/* Шесть механик, которых нет у узбекских площадок (docs/research/tovar.md, §6). */
function mechBlock(l) {
  const t = T(l);
  const a13 = G[113918], rl = G[127578], sg = G[127558], ap = G[79478], ar = G[53664];
  const lad = LADDER[53664];
  const m = [
    ["rfq", "doc", t("Запрос цены у всех продавцов", "Barcha sotuvchilardan narx so‘rash"), t("Покупатель пишет «нужно 20 водонагревателей до пятницы», продавцы раздела сами присылают цену и срок. Как у Alibaba, у узбекских площадок такого нет.", "Xaridor «jumagacha 20 ta suv isitgich kerak» deb yozadi, bo‘lim sotuvchilari narx va muddatni o‘zlari yuboradi. Alibaba’dagi kabi, o‘zbek saytlarida bunday yo‘q."),
      `<div class="rq"><p class="rq-ask">${ic("doc")}<span>${t("Водонагреватель 30 л · 20 шт. · Ташкент · до пятницы", "Suv isitgich 30 l · 20 dona · Toshkent · jumagacha")}</span></p><ol class="rq-a" id="rq-a"></ol><button type="button" class="btn btn-red btn-sm" id="rq-go">${ic("send")}<span>${t("Отправить продавцам", "Sotuvchilarga yuborish")}</span></button><small class="demo-n">${t("Ответы продавцов демо", "Sotuvchilar javoblari demo")}</small></div>`],
    ["offers", "scale", t("Одна карточка, разные продавцы", "Bitta kartochka, turli sotuvchilar"), t("Та же память 4/128 у ELSO.UZ и SHOP-IT: сейчас это разные карточки. Делаем одну, дешевле всех отмечен.", "ELSO.UZ va SHOP-IT’da xuddi shu 4/128 xotira: hozir bu turli kartochkalar. Bittasini qilamiz, eng arzoni belgilanadi."),
      `<ol class="of">${[a13, rl, sg].sort((a, b) => a.p - b.p).map((g, i) => `<li${i === 0 ? ' class="best"' : ""}><img src="${IMG}/p-${g.id}.webp" alt="" loading="lazy"><span><b>${esc(L2(g.n, l).replace(/^Смартфон |^Smartfon /, ""))}</b><small>${D.SELLERS[g.s].n} · ${g.st ? t("в наличии", "mavjud") : t("под заказ", "buyurtma bilan")}</small></span><em>${sum(l, g.p)}</em>${i === 0 ? `<i class="chip chip-ok">${t("дешевле всех", "eng arzon")}</i>` : ""}</li>`).join("")}</ol>`],
    ["fresh", "refresh", t("«Цена свежая»", "«Narx yangi»"), t("Под ценой видно, когда продавец её подтвердил. Сейчас у AirPods Pro на вашем сайте: «Цена обновлена 08.01.2022».", "Narx ostida sotuvchi uni qachon tasdiqlagani ko‘rinadi. Hozir saytingizda AirPods Pro’da: «Narx yangilangan 08.01.2022»."),
      `<div class="fr" id="fr"><img src="${IMG}/p-${ap.id}.webp" alt="" loading="lazy"><div><b>${esc(L2(ap.n, l))}</b><em>${sum(l, ap.p)}</em><p class="fr-st" id="fr-st"><i class="chip chip-warn">${t("08.01.2022 · 4 года назад", "08.01.2022 · 4 yil oldin")}</i></p></div><button type="button" class="btn btn-glass btn-sm" id="fr-go">${ic("refresh")}<span>${t("Продавец подтвердил", "Sotuvchi tasdiqladi")}</span></button></div>`],
    ["bargain", "hand", t("«Предложить свою цену»", "«O‘z narxingizni taklif qiling»"), t("Кнопка рядом с ценой: сумма и количество, продавец за сутки отвечает «да», «нет» или своей цифрой. Торг без звонков, как Best Offer на eBay.", "Narx yonida tugma: summa va soni, sotuvchi bir kun ichida «ha», «yo‘q» yoki o‘z raqami bilan javob beradi. Qo‘ng‘iroqsiz savdolashish, eBay’dagi Best Offer kabi."),
      `<div class="bo"><p>${esc(L2(G[130576].n, l))} · <s>${sum(l, G[130576].p)}</s></p><div class="bo-row"><label class="fld"><span>${t("Ваша цена", "Narxingiz")}</span><input id="bo-v" inputmode="numeric" value="${grp(1180000)}"></label><button type="button" class="btn btn-red btn-sm" id="bo-go">${ic("send")}<span>${t("Предложить", "Taklif qilish")}</span></button></div><p class="bo-ans" id="bo-ans" aria-live="polite"></p><small class="demo-n">${t("Ответ продавца демо", "Sotuvchi javobi demo")}</small></div>`],
    ["ladder", "stairs", t("Опт лесенкой в корзине", "Savatda zinapoya ulgurji"), t("У ваших продавцов уже есть до четырёх оптовых цен. В корзине они встают ступеньками: взял больше, цена за штуку падает сама.", "Sotuvchilaringizda to‘rttagacha ulgurji narx allaqachon bor. Savatda ular zinapoya bo‘lib turadi: ko‘proq olsangiz, dona narxi o‘zi tushadi."),
      `<div class="ld" id="ld" data-l="${esc(JSON.stringify(lad))}"><p>${esc(L2(ar.n, l))} · Sayina Stroy</p><div class="ld-st">${lad.map((s, i) => `<span style="--h:${40 + i * 18}%" data-i="${i}"><b>${grp(s[1] / 1000)}</b><small>${t(`от ${s[0]}`, `${s[0]} dan`)}</small></span>`).join("")}</div><div class="ld-q"><button type="button" id="ld-m" aria-label="${t("Меньше", "Kamroq")}">${ic("minus")}</button><output id="ld-n">1</output><button type="button" id="ld-p" aria-label="${t("Больше", "Ko‘proq")}">${ic("plus")}</button><b id="ld-sum"></b></div><small class="demo-n">${t("Цена за 1 шт. с их сайта, ступени пример", "1 dona narxi saytdan, bosqichlar namuna")}</small></div>`],
    ["chat", "chat", t("«Отвечает за N минут»", "«N daqiqada javob beradi»"), t("Под именем продавца видно, за сколько он на самом деле отвечает: это считает площадка по переписке на tovar.uz. Покупатель видит, кому писать, если нужно сегодня.", "Sotuvchi nomi ostida u aslida qancha vaqtda javob berishi, tovar.uz’dagi yozishma bo‘yicha. Xaridor bugun kerak bo‘lsa kimga yozishni ko‘radi."),
      `<ul class="rp">${[["shopit", 6], ["elso", 14], ["macbro", 22], ["laptop", 95]].map(([k, n]) => `<li><b>${D.SELLERS[k].n}</b><span class="rp-bar"><i style="--w:${Math.min(1, n / 95).toFixed(2)}"></i></span><small>${n < 60 ? t(`${n} мин`, `${n} daq`) : t(`${Math.round(n / 60)} ч`, `${Math.round(n / 60)} soat`)}</small></li>`).join("")}</ul><small class="demo-n">${t("Время ответа демо", "Javob vaqti demo")}</small>`],
  ];
  return `<section id="mehaniki" class="mech"><div class="wrap">
${head(`<span class="ours">${t("Чего нет у Uzum, OLX, Asaxiy, Texnomart", "Uzum, OLX, Asaxiy, Texnomart’da yo‘q")}</span>`, t("Шесть механик, <em>которые tovar.uz сделает первым</em>", "tovar.uz <em>birinchi qiladigan</em> olti mexanika"), t("Мы прошли узбекские площадки, Ozon, Wildberries, Яндекс Маркет, Авито, Amazon, eBay, Etsy, Faire и Alibaba. Рассрочка, доставка за день, чат и отзывы в Узбекистане уже есть. Вот то, чего нет ни у кого. Каждую можно потрогать.", "O‘zbek saytlari, Ozon, Wildberries, Yandex Market, Avito, Amazon, eBay, Etsy, Faire va Alibaba’ni ko‘rib chiqdik. Muddatli to‘lov, bir kunda yetkazish, chat va sharhlar O‘zbekistonda allaqachon bor. Mana hech kimda yo‘q narsalar. Har birini sinab ko‘rish mumkin."))}
<div class="bento">${m.map(([k, i, h, p, w], n) => `<article class="mc glass rv a-${["rise", "side", "flip", "pop", "rise", "side"][n]}" data-m="${k}" style="--d:${(n % 3) * 70}ms"><header><img class="mc-g" src="${IMG}/g-${k}.webp" alt="" width="96" height="96" loading="lazy" decoding="async"><h3>${h}</h3></header><p>${p}</p><div class="mc-w">${w}</div></article>`).join("")}</div>
<p class="mech-more">${ic("building")}<span>${t("Седьмая, не первыми, но обязательно: счёт на компанию по ИНН с реквизитами из справочника Golden Pages. Частично это есть у Prom.uz и Texnomart.", "Yettinchisi, birinchi emas, lekin albatta: Golden Pages ma’lumotnomasidan rekvizitlar bilan STIR bo‘yicha kompaniyaga hisob. Qisman bu Prom.uz va Texnomart’da bor.")}</span></p>
</div></section>`;
}

function pathBlock(l) {
  const t = T(l);
  const steps = [
    ["search", t("Поиск", "Qidiruv"), t("«quloqchin» и «наушники» ведут к одним товарам, фильтр «Цена свежая».", "«quloqchin» va «наушники» bir xil tovarlarga olib boradi, «Narx yangi» filtri."), "#/s/4%2F128"],
    ["tag", t("Карточка", "Kartochka"), t("Цена, когда её подтвердили, продавец и за сколько отвечает.", "Narx, u qachon tasdiqlangani, sotuvchi va qancha vaqtda javob berishi."), "#/p/127572"],
    ["scale", t("У кого дешевле", "Kimda arzonroq"), t("Та же память у других продавцов, дешевле всех отмечен.", "Boshqa sotuvchilarda xuddi shu xotira, eng arzoni belgilangan."), "#/p/113918"],
    ["hand", t("Своя цена", "O‘z narxingiz"), t("Предложение продавцу, ответ придёт в профиль.", "Sotuvchiga taklif, javob profilga keladi."), "#/p/130576/offer"],
    ["grid", t("Сравнение", "Solishtirish"), t("Три товара рядом: цена, наличие, память, свежесть цены.", "Uchta tovar yonma-yon: narx, mavjudlik, xotira, narx yangiligi."), "#/cmp"],
    ["stairs", t("Корзина с оптом", "Ulgurji savat"), t("Взяли больше, цена за штуку ниже, подсказка «ещё 2 шт.».", "Ko‘proq oldingiz, dona narxi pastroq, «yana 2 dona» maslahati."), "#/cart"],
    ["card", t("Оформление", "Rasmiylashtirish"), t("Телефон и код, Click, Payme, Uzum или наличные, счёт по ИНН.", "Telefon va kod, Click, Payme, Uzum yoki naqd, STIR bo‘yicha hisob."), "#/checkout"],
    ["truck", t("Статус", "Holat"), t("Принят, подтвердил, собран, в пути, доставлен: меняет продавец.", "Qabul qilindi, tasdiqladi, yig‘ildi, yo‘lda, yetkazildi: sotuvchi o‘zgartiradi."), "#/me"],
  ];
  return `<section class="path" id="put"><div class="wrap">
${head(`<span class="ours">${t("Путь покупателя", "Xaridor yo‘li")}</span>`, t("От поиска до доставки <em>в телефоне</em>", "Qidiruvdan yetkazishgacha <em>telefonda</em>"), t("Каждый шаг кликается: нажмите и попадёте на этот экран. Заказ проходит до конца, деньги не списываются.", "Har qadam bosiladi: bosing va shu ekranga o‘tasiz. Buyurtma oxirigacha o‘tadi, pul yechilmaydi."))}
<div class="pt-grid"><ol class="pt-list">${steps.map(([i, h, p, u], k) => `<li class="rv a-side" style="--d:${k * 50}ms"><button type="button" class="pt" data-go="${u}"${k === 0 ? ' aria-current="step"' : ""}><span class="pt-n">${k + 1}</span><span class="pt-t"><b>${ic(i)}${h}</b><small>${p}</small></span></button></li>`).join("")}</ol>
<div class="pt-ph">${phone(l, "#/s/4%2F128", "ph-path")}<a class="btn btn-glass" href="${href(l, "app")}">${ic("full")}<span>${t("Приложение во весь экран", "Ilova to‘liq ekranda")}</span></a></div></div>
</div></section>`;
}

function sellerBlock(l) {
  const t = T(l);
  const f = [
    ["bolt", t("Компания за минуту", "Bir daqiqada kompaniya"), t("ИНН, и данные из Golden Pages; модератор после, а не до", "STIR, va Golden Pages ma’lumotlari; moderator oldin emas, keyin")],
    ["upload", t("Товары из Excel", "Excel’dan tovarlar"), t("сотня позиций одним файлом вместо формы на каждую", "har biriga forma o‘rniga bitta fayl bilan yuzlab pozitsiya")],
    ["refresh", t("Свежесть цен", "Narxlar yangiligi"), t("«подтвердить все цены» одной кнопкой", "bitta tugma bilan «barcha narxlarni tasdiqlash»")],
    ["chat", t("Вопросы и торг", "Savollar va savdolashish"), t("ответ, согласие или своя цена, без обновления страницы", "sahifani yangilamasdan javob, rozilik yoki o‘z narxi")],
    ["doc", t("Запросы цены", "Narx so‘rovlari"), t("заказ приходит сам, не ждите, пока найдут в каталоге", "buyurtma o‘zi keladi, katalogda topishlarini kutmang")],
    ["chart", t("Где теряем покупателей", "Xaridorni qayerda yo‘qotamiz"), t("не просмотры, а что мешает купить", "ko‘rishlar emas, sotib olishga nima xalaqit beradi")],
  ];
  return `<section class="pnl" id="prodavec"><div class="wrap">
${head(`<span class="ours">${t("Кабинет продавца", "Sotuvchi kabineti")}</span>`, t("Компания открывает магазин <em>за минуту</em>", "Kompaniya do‘konni <em>bir daqiqada</em> ochadi"), t("Это работающий макет. Задайте вопрос или предложите цену в приложении, и это придёт сюда. Переведите заказ в «В пути», и покупатель увидит это у себя. Сверху можно переключить продавца: SHOP-IT, ELSO.UZ, MacBro, Sayina Stroy.", "Bu ishlaydigan maket. Ilovada savol bering yoki narx taklif qiling, bu shu yerga keladi. Buyurtmani «Yo‘lda» ga o‘tkazing, xaridor buni o‘zida ko‘radi. Tepada sotuvchini almashtirish mumkin: SHOP-IT, ELSO.UZ, MacBro, Sayina Stroy."))}
<div class="brw rv a-rise"><div class="brw-bar" aria-hidden="true"><i></i><i></i><i></i><span>tovar.uz/cabinet</span></div><iframe class="pnl-frame" title="${t("Кабинет продавца", "Sotuvchi kabineti")}" data-src="${href(l, "panel")}?embed=1" loading="lazy"></iframe></div>
<ul class="pnl-f">${f.map(([i, a, b]) => `<li class="rv a-up">${ic(i)}<span><b>${a}</b><small>${b}</small></span></li>`).join("")}</ul>
<div class="pnl-cta"><a class="btn btn-glass" href="${href(l, "panel")}">${ic("full")}<span>${t("Кабинет во весь экран", "Kabinet to‘liq ekranda")}</span></a></div>
</div></section>`;
}

function bestBlock(l) {
  const t = T(l);
  const rows = [
    ["Alibaba", t("Китай", "Xitoy"), t("Покупатель описывает товар и количество, поставщики сами присылают цены.", "Xaridor tovar va sonini yozadi, yetkazib beruvchilar narxni o‘zlari yuboradi."), t("Запрос цены для «Товаров для бизнеса»", "«Biznes uchun mahsulotlar» uchun narx so‘rovi")],
    [t("Яндекс Маркет", "Yandex Market"), t("Россия", "Rossiya"), t("«Все предложения»: один товар от нескольких магазинов на одной карточке.", "«Barcha takliflar»: bitta kartochkada bir nechta do‘kondan bitta tovar."), t("Цены разных продавцов на одной карточке", "Bitta kartochkada turli sotuvchilar narxi")],
    ["Amazon", t("США", "AQSh"), t("История цены рядом с ценой: 30, 90 и 365 дней.", "Narx yonida narx tarixi: 30, 90 va 365 kun."), t("«Цена свежая» вместо даты трёхлетней давности", "Uch yil oldingi sana o‘rniga «Narx yangi»")],
    ["eBay", t("США", "AQSh"), t("Best Offer: продавец отвечает за 24 часа, встречная цена.", "Best Offer: sotuvchi 24 soatda javob beradi, qarshi narx."), t("«Предложить свою цену» с ответом в срок", "Muddatli javob bilan «O‘z narxingizni taklif qiling»")],
    ["Ozon", t("Россия", "Rossiya"), t("Вопросы о товаре публичные; продажа юрлицам со скидкой от количества.", "Tovar haqida savollar ochiq; yuridik shaxslarga sondan chegirma bilan sotish."), t("Ответы под карточкой и опт лесенкой", "Kartochka ostida javoblar va zinapoya ulgurji")],
    ["Uzum Market", t("Узбекистан", "O‘zbekiston"), t("Одна корзина на всех продавцов, статус заказа, «Задать вопрос продавцу».", "Barcha sotuvchilar uchun bitta savat, buyurtma holati, «Sotuvchiga savol berish»."), t("Это уже норма: статус заказа и вопросы, но быстрее", "Bu allaqachon odatiy: buyurtma holati va savollar, lekin tezroq")],
  ];
  return `<section id="luchshie"><div class="wrap">
${head(t("Разбор рынка", "Bozor tahlili"), t("Что взяли <em>у лучших</em>", "<em>Eng yaxshilardan</em> nimani oldik"), t("Полный разбор: Узбекистан, Россия, США, таблица механик и что из этого делать первым.", "To‘liq tahlil: O‘zbekiston, Rossiya, AQSh, mexanikalar jadvali va birinchi nima qilish kerak."))}
<div class="best">${rows.map(([n, c, a, b], i) => `<article class="bst glass rv a-up" style="--d:${(i % 3) * 60}ms"><header><b>${n}</b><small>${c}</small></header><p>${a}</p><p><strong>${t("У tovar.uz:", "tovar.uz’da:")}</strong> ${b}</p></article>`).join("")}</div>
</div></section>`;
}

function offerBlock(l) {
  const t = T(l);
  const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}"><span class="sw" aria-hidden="true"></span><span class="kit-t2"><b>${a[l].t}${a.new ? `<em class="star new">${t("нет в УЗ", "UZ’da yo‘q")}</em>` : a.star ? `<em class="star">${t("нужно первым", "birinchi kerak")}</em>` : ""}</b><small>${a[l].e}</small></span><span class="kit-pr">+${usd(a.price)}<small>${t(`≈ ${a.h} ч`, `≈ ${a.h} soat`)}</small></span></label>`;
  return `<section class="offer" id="cena"><div class="wrap">
${head(`<span class="ours">${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</span>`, t("Стоимость", "Narxi"), t(`Два пути. Полноценный маркетплейс под ключ: покупка, оплата, рассрочка, чеки налоговой, склад, доставка, продавцы и документы под закон Узбекистана, ${usd(TURNKEY.price)}. Или новый облик tovar.uz без допов: ${usd(BASE.promo)} вместо ${usd(BASE.price)}, если начинаем в течение 48 часов, а механики и кабинет продавца допами.`, `Ikki yo‘l. Kalit topshiriladigan to‘liq marketpleys: xarid, to‘lov, muddatli to‘lov, soliq cheklari, ombor, yetkazish, sotuvchilar va O‘zbekiston qonuniga mos hujjatlar, ${usd(TURNKEY.price)}. Yoki qo‘shimchalarsiz tovar.uz’ning yangi ko‘rinishi: 48 soat ichida boshlasak, ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}, mexanikalar va sotuvchi kabineti esa qo‘shimcha.`))}
<article class="tk glass rv a-rise" id="pod-klyuch"><div class="tk-h"><div><span class="kb-tag tk-tag">${t("Полноценный маркетплейс", "To‘liq marketpleys")}</span><h3>${TURNKEY[l].t}</h3><p>${TURNKEY[l].d}</p></div><div class="tk-p"><b>${usd(TURNKEY.price)}</b><small>${t("всё в одной цене", "hammasi bitta narxda")}</small><a class="btn btn-red" href="https://t.me/Devuz_studio_bot?start=tovar-mp">${ic("tg")}<span>${t("Обсудить маркетплейс", "Marketpleysni muhokama qilish")}</span></a></div></div>
<div class="tk-g">${TURNKEY[l].groups.map(([g, items]) => `<section><h4>${g}</h4><ul>${items.map((x) => `<li>${ic("check")}<span>${x}</span></li>`).join("")}</ul></section>`).join("")}</div></article>
<h3 class="kit-g tk-or">${t("Или начать с нового облика: собрать нужное тумблерами", "Yoki yangi ko‘rinishdan boshlash: keraklisini tumblerlar bilan yig‘ish")}</h3>
<div class="kit" id="konstruktor">
<div class="kit-l">
<div class="kit-base glass"><div><span class="kb-tag">${t("Входит всегда", "Har doim kiradi")}</span><b>${BASE[l].t}</b><p>${BASE[l].d}</p><p class="kb-w">${t(`Срок: ${BASE.weeks[0]}-${BASE.weeks[1]} недель`, `Muddat: ${BASE.weeks[0]}-${BASE.weeks[1]} hafta`)}</p></div><div class="kb-p"><s>${usd(BASE.price)}</s><b>${usd(BASE.promo)}</b><small>${t("48 часов", "48 soat")}</small></div></div>
<h3 class="kit-g">${t("Допы: включайте то, что нужно площадке", "Qo‘shimchalar: saytga keraklisini yoqing")}</h3>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side">
<div class="kit-total glass" id="kit-total">
<div class="timer" id="timer"><span>${t(`Цена ${usd(BASE.promo)} действует`, `${usd(BASE.promo)} narxi amal qiladi`)}<small>${t("48 часов с первого открытия макета", "maket birinchi ochilgandan 48 soat")}</small></span><b id="tm">48:00:00</b></div>
<div class="kt-line"><span>${t("Новый облик", "Yangi ko‘rinish")}</span><span><s>${usd(BASE.price)}</s> ${usd(BASE.promo)}</span></div>
<div class="kt-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kit-cnt">0</span></span><span id="kit-add">0 $</span></div>
<div class="kt-sum"><small>${t("Итого", "Jami")}</small><b id="kit-total-sum">${usd(BASE.promo)}</b><small>${t(`со всеми допами ${usd(ALL)}`, `barcha qo‘shimchalar bilan ${usd(ALL)}`)}</small></div>
<button type="button" class="btn btn-glass" id="kit-new">${t("Только то, чего нет в УЗ", "Faqat UZ’da yo‘q narsalar")}</button>
<button type="button" class="btn btn-glass" id="kit-all">${t("Включить всё", "Hammasini yoqish")}</button>
<a class="btn btn-red" href="https://t.me/Devuz_studio_bot?start=tovar">${ic("tg")}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
<button type="button" class="copy" id="kit-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button>
</div>
<p class="src">${t(`Цены допов: по часам работы, ${RATE} $ за час, как у веб-студий Ташкента. Комиссии Click, Payme, Uzum Bank, SMS, хостинг и публикацию в App Store и Google Play площадка оплачивает сама.`, `Qo‘shimchalar narxi: ish soatlari bo‘yicha, soatiga ${RATE} $, Toshkent veb-studiyalaridagidek. Click, Payme, Uzum Bank komissiyalari, SMS, xosting va App Store hamda Google Play’ga joylashni sayt o‘zi to‘laydi.`)}</p>
</div>
</div></section>`;
}

function siteData(l) {
  const t = T(l);
  return {
    ...common(l),
    trio: TRIO, orbit: ORBIT,
    ui: {
      types: l === "ru" ? ["смартфон 4/128", "quloqchin", "4/128"] : ["smartfon 4/128", "наушники", "4/128"],
      found: t("нашли {n}", "{n} ta topildi"), none: t("Ничего. Попробуйте «quloqchin» или «телевизор».", "Hech narsa. «наушники» yoki «televizor» deb ko‘ring."),
      upd: t("цена от {d}", "narx {d} dagi"), open: t("Открыть", "Ochish"), inStock: t("в наличии", "mavjud"), onOrder: t("под заказ", "buyurtma bilan"),
      q1: t("Sayina Stroy · 1 760 000 за шт. · 3 дня", "Sayina Stroy · donasi 1 760 000 · 3 kun"), q2: t("Другой продавец раздела · 1 820 000 · 2 дня", "Bo‘limning boshqa sotuvchisi · 1 820 000 · 2 kun"), q3: t("Ещё один · 1 790 000 · 5 дней, доставка бесплатно", "Yana biri · 1 790 000 · 5 kun, yetkazish bepul"),
      boYes: t("SHOP-IT: «1 200 000 и забирайте сегодня до 18:00». Встречная цена ушла вам в Telegram.", "SHOP-IT: «1 200 000 va bugun 18:00 gacha olib keting». Qarshi narx sizga Telegramga ketdi."), boLow: t("Слишком низко: продавец видит предложения от {p}.", "Juda past: sotuvchi {p} dan takliflarni ko‘radi."),
      frOk: t("Подтверждена сегодня", "Bugun tasdiqlandi"), cheap: t("дешевле всех", "eng arzon"), per: t("за шт.", "donasi"), total: t("итого", "jami"),
    },
    offer: { items: ADDONS.map((a) => ({ id: a.id, t: a[l].t, p: a.price, n: !!a.new })), base: BASE.promo, baseName: BASE[l].t, hours: OFFER_HOURS, head: t("tovar.uz, состав:", "tovar.uz, tarkibi:"), totalW: t("Итого", "Jami"), copied: t("Скопировано", "Nusxalandi"), toBuy: t("В стоимость", "Narxga qo‘shish"), inBuy: t("В стоимости", "Narxda"), ended: t("Акция закончилась, цена обычная", "Aksiya tugadi, narx odatiy") },
  };
}

function sitePage(l) {
  const t = T(l);
  const other = l === "ru" ? "uz" : "ru";
  const nav = [["#poisk", t("Поиск", "Qidiruv")], ["#mehaniki", t("Механики", "Mexanikalar")], ["#put", t("Покупателю", "Xaridorga")], ["#prodavec", t("Продавцу", "Sotuvchiga")], ["#cena", t("Стоимость", "Narxi")]];
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t("tovar.uz · торговая платформа · макет DevUz Studio", "tovar.uz · savdo platformasi · DevUz Studio maketi"), t("Макет tovar.uz: жидкое стекло и ваши товары, поиск на двух языках, цены разных продавцов на одной карточке, свежесть цены, торг, опт лесенкой, запрос цены, кабинет продавца.", "tovar.uz maketi: suyuq shisha va tovarlaringiz, ikki tilda qidiruv, bitta kartochkada turli sotuvchilar narxi, narx yangiligi, savdolashish, zinapoya ulgurji, narx so‘rovi, sotuvchi kabineti."))}
<link rel="alternate" hreflang="${other}" href="${href(other)}">
<link rel="preload" as="image" href="${IMG}/c-113945.webp">
<script>(function(){var r=document.documentElement;r.classList.add('js');try{history.scrollRestoration='manual';if(location.hash)history.replaceState(null,'',location.pathname+location.search)}catch(e){}if(navigator.userAgentData&&innerWidth>900)r.classList.add('lq');var off=false;try{if(sessionStorage.getItem('tv-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}if(/[?&]nointro/.test(location.search))off=true;if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
@@S@@
</head>
<body class="site" data-lang="${l}">
${sprite()}${LQ}
${introHtml(l)}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top" id="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="tovar.uz">${logo()}</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
<div class="top-r">${langSw(l, "")}<a class="btn btn-sm btn-red" href="${href(l, "app")}">${t("Открыть", "Ochish")}</a></div>
</div></header>
<main id="main">
${[heroBlock(l), marqBlock(l), searchBlock(l), nowBlock(l), mechBlock(l), pathBlock(l), sellerBlock(l), bestBlock(l), offerBlock(l)].join("\n")}
</main>
<footer class="foot"><div class="wrap">
<div class="cols">
<div>${logo("f-logo")}<p class="f-d">${t("Торговая платформа: товары, товары для бизнеса и услуги. Проект компании Golden Pages, с 2020 года.", "Savdo platformasi: tovarlar, biznes uchun mahsulotlar va xizmatlar. Golden Pages kompaniyasi loyihasi, 2020 yildan.")}</p><ul class="f-c"><li>${ic("tg")}<a href="${D.BRAND.tg}">@tovaruz_official</a></li><li>${ic("ig")}<a href="${D.BRAND.ig}">@tovar.uz_official</a></li><li>${ic("yt")}<a href="${D.BRAND.yt}">YouTube</a></li></ul></div>
<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=tovar">Telegram</a></li></ul></div>
<div><b>${t("Данные макета", "Maket ma’lumotlari")}</b><ul><li>${t("Разделы, товары, цены, продавцы, даты цен: tovar.uz, 18.10.2026", "Bo‘limlar, tovarlar, narxlar, sotuvchilar, narx sanalari: tovar.uz, 18.10.2026")}</li><li>${t("Фото товаров: карточки продавцов на tovar.uz", "Tovar suratlari: tovar.uz’dagi sotuvchi kartochkalari")}</li><li>${t("Ответы продавцов, оптовые ступени, заказы, цифры кабинета: демо", "Sotuvchi javoblari, ulgurji bosqichlar, buyurtmalar, kabinet raqamlari: demo")}</li></ul></div>
</div>
<div class="rights"><span>${t("Это макет: так может выглядеть tovar.uz. Заказ, торг и оплата работают для показа, деньги не списываются.", "Bu maket: tovar.uz shunday ko‘rinishi mumkin. Buyurtma, savdolashish va to‘lov ko‘rsatish uchun ishlaydi, pul yechilmaydi.")}</span><a href="${TERMS(l)}">${t("Условия использования макета", "Maketdan foydalanish shartlari")}</a></div>
</div></footer>
<div class="dock" id="dock"><a class="btn btn-red" href="${href(l, "app")}">${ic("search")}<span>${t("Найти товар", "Tovar topish")}</span></a><a class="btn btn-glass" href="#cena">${t("Стоимость", "Narxi")}</a></div>
<script type="application/json" id="tv-site">${json(siteData(l))}</script>
<script>
${strip(read("intro.js"))}</script>
<script src="${IMG}/gsap.min.js"></script>
<script src="${IMG}/ScrollTrigger.min.js"></script>
@@J@@
</body>
</html>`;
}

/* Главный язык — русский, как у них на сайте. Узбекский — /uz. */
const out = {
  "": sitePage("ru"), uz: sitePage("uz"),
  app: appPage("ru"), "uz/app": appPage("uz"),
  panel: panelPage("ru"), "uz/panel": panelPage("uz"),
};
const parts = {
  S: `<style>${min(read("site.css"))}</style>`,
  A: `<style>${min(read("app.css"))}</style>`,
  K: `<style>${min(read("panel.css"))}</style>`,
  J: `<script>\n${strip(read("site.js"))}</script>`,
  P: `<script>\n${strip(read("app.js"))}</script>`,
  Q: `<script>\n${strip(read("panel.js"))}</script>`,
};
const fill = (page) => Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), page);

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "tovar.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(12), fill(v).length);
