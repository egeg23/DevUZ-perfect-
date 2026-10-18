import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as D from "./data.mjs";
import { UI } from "./ui.mjs";
import { ADDONS, ALL, CASH_OFF, COSTS, OFFER_HOURS, SITE, SITE_ADDONS, SITE_ALL, TIERS } from "./plan.mjs";
import { DZ_VIDEO } from "../dz-video.mjs";
/* Варианты в конструкторе: сайт и два объёма приложения; у сайта и приложения свои допы (g). */
const OPTS = [SITE, ...TIERS.map((x) => ({ ...x, g: "app" }))];

/*
 * Макет приложения Dilrabo Travel (Фергана, туры по Узбекистану), ru и uz.
 * Владелец, 16.10.2026: «У нас есть уже примеры туристических агентств,
 * просто переодень визуал, лого и т. д., а все механики и допы возьми с
 * реализованных макетов». Основа — inapp (scripts/protos/inapp): те же экраны,
 * канбан Битрикс24, оплата, статусы, документы, предложение и цены.
 * Отличие одно и по делу: Dilrabo продаёт свои программы по Узбекистану, а не
 * туры чужих операторов, поэтому вместо Турвизора — их каталог туров в
 * Битрикс24, а вместо «кто дешевле у операторов» — «в группе или своей
 * машиной» (машины и цены за день из их «Нашего автопарка»).
 *  - страница (`""`, `uz`): промо DevUz, первый экран с поиском, путь гостя
 *    в шесть шагов, «Сейчас / Станет» по их сайту, приложение в айфоне,
 *    «Как это видит менеджер», схема, их пять шагов брони и что с ними
 *    станет, что нужно от агентства, кейс Apollo Travel, предложение DevUz;
 *  - приложение (`app`, `uz/app`): на телефоне на весь экран, на ПК айфон.
 * Логотип, шрифт, туры, маршруты, машины, контакты и фото — с их сайта
 * (data.mjs, SOURCES.md). Цены туров и даты выездов демо.
 *
 * Стили и скрипты общие, в странице вместо них @@S@@, @@J@@, @@A@@, @@K@@.
 * Ссылки — через __PROTO_BASE__, отпечаток ставится при показе зерном из
 * protos.stamp (lib/proto/bundles). Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/dilrabo";
const BASE = "__PROTO_BASE__";
const B = D.BRAND.name;
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONT_PRE = `<link rel="preload" href="${IMG}/tilda-400.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="${IMG}/tilda-700.woff2" as="font" type="font/woff2" crossorigin>`;
const SITE_CSS = min(readFileSync(DIR + "site.css", "utf8")).replace(/__IMG__/g, IMG);
const APP_CSS = min(readFileSync(DIR + "app.css", "utf8")).replace(/__IMG__/g, IMG);
const SITE_JS = strip(readFileSync(DIR + "site.js", "utf8"));
const APP_JS = strip(readFileSync(DIR + "app.js", "utf8"));
const INTRO = strip(readFileSync(DIR + "intro.js", "utf8"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => grp(n) + " $";
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const L2 = (p, l) => (l === "ru" ? p[0] : p[1]);
const href = (l, path = "") => BASE + (l === "uz" ? "/uz" : "") + (path ? "/" + path : "");
/* Подписи: пара [ru, uz] или пара форм множественного числа. */
const pickUI = (l) => Object.fromEntries(Object.entries(UI).map(([k, v]) => [k, l === "ru" ? v[0] : v[1]]));

/* ── Знак Dilrabo Travel: их восьмиконечная звезда из favicon.svg их сайта ── */
const MARK = readFileSync(DIR + "logo.inc", "utf8").trim();
const LOGO_DEFS = `<symbol id="tb-mark" viewBox="0 0 90.99 90.9">${MARK}</symbol>`;
const logo = (cls) => `<span class="logo-w ${cls}"><svg aria-hidden="true"><use href="#tb-mark"/></svg><b>Dilrabo<i> Travel</i></b></span>`;

/* Демо-цена тура за двоих взрослых: та же формула, что в app.js (tourPrice). */
const opIdx = (id) => Math.max(0, D.OPS.findIndex((o) => o.id === id));
const dateK = (dn, op) => 1 + ((((dn * 7) + opIdx(op) * 3) % 9) - 4) / 100;
function priceOf(h, op, dn, a = 2) {
  const days = h.nights + 1, o = D.OPS.find((x) => x.id === op);
  return Math.round((h.base * days * a * (1 + (h.ops[op] || 0) / 100) * dateK(dn, op) + o.add * days) / 10) * 10;
}
function minPrice(h, op = "grp") { let m = Infinity; for (let dn = D.DATES.from; dn <= D.DATES.to; dn++) m = Math.min(m, priceOf(h, op, dn)); return m; }
const tourBy = (id) => D.HOTELS.find((h) => h.id === id);

/* ── Иконки: контуры 24×24, штрих цветом текста ───────────────────────── */
const S = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  back: `<path d="m15 5-7 7 7 7" ${S}/>`,
  chev: `<path d="m9 5 7 7-7 7" ${S}/>`,
  arrow: `<path d="M5 12h14M13 6l6 6-6 6" ${S}/>`,
  heart: `<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" ${S}/>`,
  heartf: `<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" fill="currentColor"/>`,
  search: `<circle cx="11" cy="11" r="6.5" ${S}/><path d="m20 20-4.2-4.2" ${S}/>`,
  pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${S}/><circle cx="12" cy="10" r="2.3" ${S}/>`,
  bell: `<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" ${S}/>`,
  spark: `<path d="M12 3c.8 4.3 2.7 6.2 7 7-4.3.8-6.2 2.7-7 7-.8-4.3-2.7-6.2-7-7 4.3-.8 6.2-2.7 7-7z" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  sort: `<path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  share: `<path d="M12 15V3.5M8 7l4-4 4 4M5 11v8.5h14V11" ${S}/>`,
  cal: `<rect x="4" y="5" width="16" height="15" rx="3" ${S}/><path d="M4 10h16M9 3v4M15 3v4" ${S}/>`,
  tg: `<path d="M21 4 3 11l6 2 2 6 3-4 5 4z" ${S}/><path d="m9 13 9-7" ${S}/>`,
  user: `<circle cx="12" cy="8.5" r="3.8" ${S}/><path d="M4.5 20c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5" ${S}/>`,
  users: `<circle cx="9" cy="8.5" r="3.3" ${S}/><path d="M3 19.5c1.1-3.2 3.3-4.8 6-4.8s4.9 1.6 6 4.8M15.5 5.6a3.2 3.2 0 0 1 0 6M17.5 14.9c1.6.6 2.8 2.1 3.5 4.6" ${S}/>`,
  doc: `<path d="M7 3.5h7l4 4v13H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" ${S}/><path d="M14 3.5V8h4M9.5 12.5h5M9.5 16h5" ${S}/>`,
  globe: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z" ${S}/>`,
  info: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 11v5.5M12 7.8v.01" ${S}/>`,
  plus: `<path d="M12 5v14M5 12h14" ${S}/>`,
  minus: `<path d="M5 12h14" ${S}/>`,
  star: `<path d="m12 3.8 2.5 5.2 5.7.7-4.2 3.9 1.1 5.6L12 16.4l-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z" ${S}/>`,
  shield: `<path d="M12 3 19 6v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" ${S}/><path d="m9 12 2 2 4-4" ${S}/>`,
  plane: `<path d="M21 12c0-.9-.8-1.5-1.8-1.5h-4.4L10.2 3.5H8.4l2.3 7H6.2L4.4 8.2H3l1 3.8-1 3.8h1.4l1.8-2.3h4.5l-2.3 7h1.8l4.6-7h4.4c1 0 1.8-.6 1.8-1.5z" ${S}/>`,
  moon: `<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" ${S}/>`,
  food: `<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16.5 21V3c-2 1-3 3.5-3 7 0 1.5 1 2.5 3 2.5" ${S}/>`,
  layers: `<path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8z" ${S}/><path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" ${S}/>`,
  flame: `<path d="M12 21c-3.9 0-6.5-2.7-6.5-6.3 0-3.2 2.3-5.2 3.6-7.7.4 1.7 1.3 2.8 2.4 3.4.3-2.7 1.4-5.2 3.7-7.4.2 3.4 3.3 6.1 3.3 10.4C18.5 18.1 15.9 21 12 21z" ${S}/>`,
  card: `<rect x="3" y="5.5" width="18" height="13" rx="2.5" ${S}/><path d="M3 10h18M7 15h4" ${S}/>`,
  edit: `<path d="M4 20h4L19 9l-4-4L4 16z" ${S}/><path d="m13.5 6.5 4 4" ${S}/>`,
  wave: `<path d="M3 9c3-2.5 6-2.5 9 0s6 2.5 9 0M3 15c3-2.5 6-2.5 9 0s6 2.5 9 0" ${S}/>`,
  bed: `<path d="M3 18V6M3 14h18v4M21 14v-2.5a3 3 0 0 0-3-3h-7v5.5" ${S}/><circle cx="7" cy="11" r="1.8" ${S}/>`,
  briefcase: `<rect x="3" y="7" width="18" height="13" rx="2.5" ${S}/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18" ${S}/>`,
  bus: `<rect x="4.5" y="3.5" width="15" height="14" rx="3" ${S}/><path d="M4.5 11h15M7.5 20.5v-3M16.5 20.5v-3M8 14.5h.01M16 14.5h.01" ${S}/>`,
  alert: `<path d="M12 4 2.8 19.5h18.4z" ${S}/><path d="M12 10v4.5M12 17.2v.01" ${S}/>`,
  lock: `<rect x="5" y="10.5" width="14" height="10" rx="2.5" ${S}/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" ${S}/>`,
  ticket: `<path d="M3.5 7.5a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1V10a2 2 0 0 0 0 4v2.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V14a2 2 0 0 0 0-4z" ${S}/><path d="M14.5 6.5v11" stroke-dasharray="2 2" ${S}/>`,
  suitcase: `<rect x="5" y="7" width="14" height="12.5" rx="2.5" ${S}/><path d="M9.5 7V4.5h5V7M9 11v4.5M15 11v4.5M8 19.5v1.5M16 19.5v1.5" ${S}/>`,
  chat: `<path d="M4.5 18.5V7a2.5 2.5 0 0 1 2.5-2.5h10A2.5 2.5 0 0 1 19.5 7v7a2.5 2.5 0 0 1-2.5 2.5H8.5z" ${S}/><path d="M8.5 9.5h7M8.5 13h4.5" ${S}/>`,
  send: `<path d="M4 12 20 4l-4 16-4.5-6.5z" ${S}/><path d="m11.5 13.5 3-3" ${S}/>`,
  download: `<path d="M12 4v11M7.5 11 12 15.5l4.5-4.5M5 19.5h14" ${S}/>`,
  wifi: `<path d="M3.5 9.5a12 12 0 0 1 17 0M6.5 12.8a7.5 7.5 0 0 1 11 0M9.5 16a3.2 3.2 0 0 1 5 0M12 19.5v.01" ${S}/>`,
  wifiOff: `<path d="M3.5 9.5a12 12 0 0 1 5-3M20.5 9.5a12 12 0 0 0-7-3.4M9.5 16a3.2 3.2 0 0 1 5 0M12 19.5v.01M4 4l16 16" ${S}/>`,
  refresh: `<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" ${S}/>`,
  full: `<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" ${S}/>`,
  shrink: `<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" ${S}/>`,
  app: `<rect x="6.5" y="2.5" width="11" height="19" rx="3" ${S}/><path d="M10.5 18.5h3" ${S}/>`,
  crm: `<rect x="3" y="4" width="5" height="16" rx="1.5" ${S}/><rect x="10" y="4" width="5" height="11" rx="1.5" ${S}/><rect x="17" y="4" width="4" height="7" rx="1.5" ${S}/>`,
  clip: `<path d="m20 11.5-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.7 17.2a1.7 1.7 0 0 1-2.4-2.4L15 7.2" ${S}/>`,
  train: `<rect x="5.5" y="3" width="13" height="14" rx="3.5" ${S}/><path d="M5.5 11h13M9 14.5h.01M15 14.5h.01M8 21l2-4M16 21l-2-4" ${S}/>`,
  home: `<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" ${S}/>`,
};
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${LOGO_DEFS}${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`)
  .join("")}</defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;

/* Промо DevUz Studio: тот же знак, что на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZSIGN = `<svg class="dz-sign" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

const LQ = `<svg class="lq-defs" aria-hidden="true" focusable="false"><filter id="lq" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.014" numOctaves="2" result="n"/><feGaussianBlur in="n" stdDeviation="2" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="18" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;

const STATUS = `<div class="status" aria-hidden="true"><span>9:41</span><span><svg viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.3-1.4A10.4 10.4 0 0 0 8 .4 10.4 10.4 0 0 0 .7 3.3L2 4.7a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.4l1.3-1.4A6.6 6.6 0 0 0 8 4a6.6 6.6 0 0 0-4.7 1.9l1.3 1.4C5.5 6.4 6.7 5.9 8 5.9Zm0 3.6c.4 0 .8.2 1.1.4L8 11.6 6.9 9.9c.3-.2.7-.4 1.1-.4Z"/></svg><svg viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2.2" fill="currentColor"/><path d="M25 4.4v4.2c.8-.3 1.4-1.1 1.4-2.1s-.6-1.8-1.4-2.1Z" fill="currentColor" fill-opacity=".45"/></svg></span></div>`;

/* ── Данные для приложения ────────────────────────────────────────────── */
function appData(l) {
  const L = (p) => L2(p, l);
  return {
    lang: l, ui: pickUI(l), img: IMG, brand: B, terms: TERMS(l), prepay: 30,
    ruUrl: href("ru", "app"), uzUrl: href("uz", "app"),
    dest: D.DEST.map((x) => ({ id: x.id, name: L(x.name), photo: x.photo, fly: L(x.fly), resorts: x.resorts.map(L) })),
    hotels: D.HOTELS.map((h) => ({
      ...h, name: L(h.name), route: L(h.route), room: L(h.room), feats: h.feats.map(L), prog: h.prog.map(L), dur: h.dur ? L(h.dur) : "",
      legs: Object.fromEntries(Object.entries(h.legs).map(([k, v]) => [k, [v[0], L(v[1]), L(v[2]), v[3]]])),
    })),
    meal: Object.fromEntries(Object.entries(D.MEAL).map(([k, v]) => [k, L(v)])),
    ops: D.OPS.map((o) => ({ id: o.id, name: L(o.name), add: o.add, car: L(o.car) })), dates: D.DATES, fly: D.FLY, demoTrip: D.DEMO_TRIP,
    wd: l === "ru" ? ["вс", "пн", "вт", "ср", "чт", "пт", "сб"] : ["ya", "du", "se", "ch", "pa", "ju", "sh"],
    wdMon: l === "ru" ? ["пн", "вт", "ср", "чт", "пт", "сб", "вс"] : ["du", "se", "ch", "pa", "ju", "sh", "ya"],
    mon: l === "ru" ? ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"] : ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"],
  };
}
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

/* ── Приложение ───────────────────────────────────────────────────────── */
function appPage(l) {
  const t = T(l);
  const data = appData(l);
  const missing = [...new Set([...APP_JS.matchAll(/\bU\.(\w+)/g)].map((m) => m[1]))].filter((k) => !(k in data.ui));
  for (const k of ["st0", "st1", "st2", "st3", "st4", "st5", "st0s", "st1s", "st2s", "st3s", "st4s", "st5s", "doc_voucher", "doc_tickets", "doc_insurance", "doc_memo"]) if (!(k in data.ui)) missing.push(k);
  if (missing.length) throw new Error(`нет подписей: ${missing.join(", ")}`);
  const tabs = [["home", "search", t("Поиск", "Qidiruv")], ["hot", "flame", t("Выезды", "Jo‘nashlar")], ["trips", "suitcase", t("Поездки", "Sayohatlar")], ["fav", "heart", t("Избранное", "Sevimli")], ["more", "user", t("Профиль", "Profil")]];
  const jump = [
    ["results", t("Все туры в одном поиске", "Barcha turlar bitta qidiruvda")], ["hotel", t("Как поехать", "Qanday borish")], ["check", t("Проверка мест", "Joylarni tekshirish")],
    ["book", t("Бронь", "Bron")], ["pay", t("Оплата", "To‘lov")], ["trip", t("Статусы", "Holatlar")], ["docs", t("Документы", "Hujjatlar")], ["chat", t("Чат с менеджером", "Menejer bilan chat")], ["push", t("Цена снизилась", "Narx tushdi")],
  ];
  const diff = [
    [t("Все ваши туры в одном поиске", "Barcha turlaringiz bitta qidiruvda"), t("Каталог из Битрикс24, дешёвые сверху, цена за всех сразу.", "Bitrix24’dagi katalog, arzonlari tepada, hamma uchun narx darhol.")],
    [t("Места проверены до оплаты", "Joylar to‘lovgacha tekshirilgan"), t("Отели, поезд, гид и машина на эти даты, без ожидания в 24 часа.", "Shu sanalarga mehmonxona, poyezd, gid va mashina, 24 soat kutmasdan.")],
    [t("Заявка сразу в Битрикс24", "Ariza darhol Bitrix24’ga"), t("Контакты, гости и тур в нужной колонке сделки.", "Kontaktlar, mehmonlar va tur bitimning kerakli ustunida.")],
    [t("Без писем до документов", "Hujjatlargacha xatlarsiz"), t("Статус меняет колонка сделки, ваучер и программа приходят из неё же.", "Holatni bitim ustuni o‘zgartiradi, vaucher va dastur ham undan keladi.")],
  ];
  return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="theme-color" content="#f6f4ef"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><title>${t(`Приложение ${B} · макет DevUz Studio`, `${B} ilovasi · DevUz Studio maketi`)}</title><meta name="description" content="${t("Макет приложения Dilrabo Travel: туры по Узбекистану в одном поиске, проверка мест, бронь в Битрикс24, оплата, статусы и документы.", "Dilrabo Travel ilovasi maketi: O‘zbekiston bo‘ylab turlar bitta qidiruvda, joylarni tekshirish, Bitrix24’da bron, to‘lov, holatlar va hujjatlar.")}"><link rel="icon" type="image/png" href="${IMG}/icon-192.png"><link rel="apple-touch-icon" href="${IMG}/apple-180.png">${FONT_PRE}@@A@@</head><body>
<div class="stage">
<aside class="side l">
<div class="brand">${logo("big")}</div>
<h1>${t("Приложение Dilrabo Travel: от выбора тура до документов", "Dilrabo Travel ilovasi: tur tanlashdan hujjatlargacha")}</h1>
<p>${t("Макет от DevUz Studio. Всё нажимается: найдите тур, выберите формат, проверьте места, забронируйте, оплатите и откройте документы.", "DevUz Studio maketi. Hammasi bosiladi: tur toping, formatni tanlang, joylarni tekshiring, bron qiling, to‘lang va hujjatlarni oching.")}</p>
<div class="jump">${jump.map(([k, n]) => `<button type="button" data-jump="${k}">${n}</button>`).join("")}</div>
<a class="back-site" href="${href(l)}#prilozhenie">${ic("back")}${t("К странице макета", "Maket sahifasiga")}</a>
</aside>
<div class="phone-wrap"><div class="phone">
<span class="btn-side l" style="top:18%;height:4.5%" aria-hidden="true"></span><span class="btn-side l" style="top:26%;height:8.5%" aria-hidden="true"></span><span class="btn-side l" style="top:36.5%;height:8.5%" aria-hidden="true"></span><span class="btn-side r" style="top:29%;height:13%" aria-hidden="true"></span>
<div class="bezel"><div class="screen" id="screen">
<div class="app" id="app">
<div class="views" id="views"><noscript><p style="padding:96px 24px">${t("Для макета нужен JavaScript.", "Maket uchun JavaScript kerak.")}</p></noscript></div>
<nav class="tabs" id="tabs" role="tablist">${tabs.map(([k, i, n]) => `<button type="button" role="tab" data-tab="${k}">${ic(i)}<span>${n}</span>${k === "trips" ? '<span class="dot num" style="display:none"></span>' : ""}</button>`).join("")}</nav>
<div class="sheet-bg" id="sheet-bg"></div><div class="sheet" id="sheet" role="dialog" aria-modal="true"></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<div class="splash" id="splash" aria-hidden="true"><svg><use href="#tb-mark"/></svg><b>${B}</b><small>${t("макет · DevUz Studio", "maket · DevUz Studio")}</small></div>
</div>
${STATUS}<span class="island" aria-hidden="true"></span><span class="home-bar" aria-hidden="true"></span><span class="glare" aria-hidden="true"></span>
</div></div></div></div>
<aside class="side r">
<b style="font-size:18px">${t("Что внутри", "Ichida nima bor")}</b>
<ul class="diff">${diff.map(([a, b], i) => `<li><i>${i + 1}</i><div><b>${a}</b>${b}</div></li>`).join("")}</ul>
<p class="legal">${t("Макет принадлежит DevUz Studio. Туры, маршруты, машины и фото с dilrabotravel.com, цены и даты выездов демо.", "Maket DevUz Studio’ga tegishli. Turlar, yo‘nalishlar, mashinalar va suratlar dilrabotravel.com’dan, narxlar va jo‘nash sanalari demo.")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("Условия использования макета", "Maketdan foydalanish shartlari")}</a></p>
</aside>
</div>
${SPRITE}
<script>window.TB=${json(data)};</script>
@@K@@
</body></html>`;
}

/* ── Страница ─────────────────────────────────────────────────────────── */
const ours = (l) => `<span class="ours">${T(l)("Предложение DevUz Studio", "DevUz Studio taklifi")}</span>`;
const head = (kicker, h, lead, anim = "up") => `<div class="sec-head rv a-${anim}"><span class="kicker"><i></i>${kicker}</span><h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>`;

function introHtml(l) {
  const t = T(l);
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  return `<div class="intro" id="intro" role="presentation">
${DZ_VIDEO}
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t(`макет приложения для ${B}`, `${B} uchun ilova maketi`)}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<div class="in-pass" aria-hidden="true"><div class="ip-card"><p class="ip-k">${t("посадочный талон", "bort talon")}</p><div class="ip-r"><div><b>TAS</b><small>${t("Ташкент", "Toshkent")}</small></div><span class="ip-plane">${ic("plane")}</span><div><b>UZ</b><small>${t("весь Узбекистан", "butun O‘zbekiston")}</small></div></div><p class="ip-f">${B} · ${t("макет", "maket")}</p></div></div>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish")}</button>
</div>`;
}

function heroBlock(l) {
  const t = T(l);
  const charm = tourBy("charm");
  const nums = [
    [String(D.HOTELS.length), t("ваших туров с сайта в одном поиске: от 2 часов до 10 дней", "saytingizdagi tur bitta qidiruvda: 2 soatdan 10 kungacha")],
    ["2", t("магазина: App Store и Google Play", "do‘kon: App Store va Google Play")],
    ["0", t("писем и звонков от выбора тура до документов", "tur tanlashdan hujjatlargacha xat va qo‘ng‘iroq")],
  ];
  return `<section class="hero" id="hero" data-tone="sky">
<div class="hero-bg" aria-hidden="true"><div class="hb-img" data-par="0.35"><img src="${IMG}/hero.webp" srcset="${IMG}/hero-s.webp 860w, ${IMG}/hero.webp 1600w" sizes="100vw" alt="" fetchpriority="high"></div><div class="hb-shade"></div></div>
<div class="hero-float" aria-hidden="true"><div class="hf hf1" data-par="-0.18"><img src="${IMG}/t-charm-1-s.webp" alt="" loading="lazy"><span class="hf-p">${t("от", "")} ${usd(minPrice(charm))}${t("", " dan")}</span></div><div class="hf hf2" data-par="-0.3"><div class="hf-ok">${ic("check")}<span><b>${t("Места подтверждены", "Joylar tasdiqlandi")}</b><small>${t("отели и поезд на эти даты", "shu sanalarga mehmonxona va poyezd")}</small></span></div></div></div>
<div class="wrap hero-in">
<p class="kicker light"><i></i>${t(`Макет приложения для ${B}`, `${B} uchun ilova maketi`)}</p>
<h1 class="h-title">${t("Туры по Узбекистану: гость <em>сам</em> выбрал, забронировал и оплатил", "O‘zbekiston bo‘ylab turlar: mehmon <em>o‘zi</em> tanladi, bron qildi va to‘ladi")}</h1>
<p class="lead">${t("Приложение для iPhone и Android. Ваши туры из каталога в Битрикс24, места проверены до оплаты, заявка падает в сделку, деньги на счёт агентства, ваучер и программа приходят в приложение.", "iPhone va Android uchun ilova. Bitrix24’dagi katalogdan turlaringiz, joylar to‘lovgacha tekshirilgan, ariza bitimga tushadi, pul agentlik hisobiga, vaucher va dastur ilovaga keladi.")}</p>
<form class="find glass lq" id="find" autocomplete="off">
<div class="f-row">
<label class="f-f"><span>${t("Куда", "Qayerga")}</span><select name="dest"><option value="">${t("Весь Узбекистан", "Butun O‘zbekiston")}</option>${D.DEST.map((x) => `<option value="${x.id}">${L2(x.name, l)}</option>`).join("")}</select></label>
<label class="f-f"><span>${t("Дней", "Kun")}</span><select name="nights"><option value="1-10">${t("Любые", "Har qanday")}</option><option value="1-2">1-2</option><option value="3-5">3-5</option><option value="6-10">6-10</option></select></label>
<label class="f-f"><span>${t("Взрослых", "Kattalar")}</span><select name="adults"><option value="1">1</option><option value="2" selected>2</option><option value="3">3</option><option value="4">4</option></select></label>
<label class="f-f"><span>${t("Детей", "Bolalar")}</span><select name="kids"><option value="0">0</option><option value="1">1</option><option value="2">2</option></select></label>
<button class="btn btn-pri f-go shim" type="submit">${ic("search")}<span>${t("Найти в приложении", "Ilovada topish")}</span></button>
</div>
</form>
<div class="nums">${nums.map(([n, w]) => `<div class="n"><b class="num">${n}</b><span>${w}</span></div>`).join("")}</div>
<p class="src light">${t("Туры, маршруты и машины с dilrabotravel.com. Цены и даты выездов в макете демо.", "Turlar, yo‘nalishlar va mashinalar dilrabotravel.com’dan. Maketdagi narxlar va jo‘nash sanalari demo.")}</p>
</div>
<div class="hero-scroll" aria-hidden="true"><i></i></div>
</section>`;
}

/* Путь гостя: слева шаги, справа телефон, экран меняется по прокрутке. */
function storyBlock(l) {
  const t = T(l);
  const steps = [
    ["search", t("Нашёл", "Topdi"), t("Все ваши туры в одном поиске", "Barcha turlaringiz bitta qidiruvda"), t("Город, даты, сколько дней, взрослые и дети, питание, отели. Программы с вашего сайта, дешёвые сверху: от прогулки на лошадях до «Золотого треугольника».", "Shahar, sanalar, necha kun, kattalar va bolalar, ovqat, mehmonxonalar. Saytingizdagi dasturlar, arzonlari tepada: otda sayrdan «Oltin uchburchak»gacha.")],
    ["layers", t("Сравнил", "Solishtirdi"), t("В группе или своей машиной", "Guruhda yoki o‘z mashinasida"), t("Одна программа, четыре формата: группа, Chevrolet Gentra, Hyundai H1, Hyundai Staria. Гость видит цену за всех и разницу в долларах.", "Bitta dastur, to‘rt format: guruh, Chevrolet Gentra, Hyundai H1, Hyundai Staria. Mehmon hamma uchun narxni va dollardagi farqni ko‘radi.")],
    ["shield", t("Проверил места", "Joylarni tekshirdi"), t("Места подтверждены сразу, а не за 24 часа", "Joylar 24 soatda emas, darhol tasdiqlanadi"), t("Сейчас на сайте обещано подтвердить места в течение суток. В приложении проверка идёт до оплаты: отели, поезд, гид и машина на эти даты.", "Hozir saytda joylarni bir kun ichida tasdiqlash va’da qilingan. Ilovada tekshiruv to‘lovgacha: shu sanalarga mehmonxona, poyezd, gid va mashina.")],
    ["users", t("Забронировал", "Bron qildi"), t("Гости латиницей, как в паспорте", "Mehmonlar lotincha, pasportdagidek"), t("Паспорта семьи сохраняются в профиле. Нажал «Забронировать», и сделка с контактами стоит в нужной колонке Битрикс24.", "Oila pasportlari profilda saqlanadi. «Bron qilish»ni bosdi va kontaktlar bilan bitim Bitrix24’ning kerakli ustunida turibdi.")],
    ["card", t("Оплатил", "To‘ladi"), t("Карта любой страны, Click, Payme", "Istalgan davlat kartasi, Click, Payme"), t("Полностью или предоплатой, деньги на счёт агентства. К вам едут гости из 25+ стран, поэтому первой стоит Visa и Mastercard.", "To‘liq yoki oldindan to‘lov, pul agentlik hisobiga. Sizga 25+ davlatdan mehmonlar keladi, shuning uchun birinchi Visa va Mastercard turadi.")],
    ["doc", t("Получил документы", "Hujjatlarni oldi"), t("Ваучер, билеты и программа без писем", "Vaucher, chiptalar va dastur xatlarsiz"), t("Менеджер двигает сделку и прикладывает файлы. У гостя меняется статус, приходит уведомление, программа по дням открывается даже без интернета.", "Menejer bitimni suradi va fayllarni biriktiradi. Mehmonda holat o‘zgaradi, bildirishnoma keladi, kunlar bo‘yicha dastur internetsiz ham ochiladi.")],
  ];
  const charm = tourBy("charm");
  const fmts = D.OPS.map((o) => [L2(o.name, l).replace(/^[^:]*: /, ""), minPrice(charm, o.id)]).sort((a, b) => a[1] - b[1]);
  const was = minPrice(charm), now = Math.round(was * 1.035 / 10) * 10;
  const scr = [
    `<div class="ps ps0"><div class="ps-bar">${ic("search")}<span>${t("Весь Узбекистан · 1-10 дн. · 2 взр.", "Butun O‘zbekiston · 1-10 kun · 2 katta")}</span></div><p class="ps-tv">${ic("layers")}${t(`${D.HOTELS.length} туров агентства`, `agentlikning ${D.HOTELS.length} ta turi`)}</p>${["horses", "express", "umra"].map((id) => { const h = tourBy(id); return `<div class="ps-card"><img src="${IMG}/${h.photos[0]}-s.webp" alt="" loading="lazy"><div><b>${L2(h.name, l)}</b><small>${t("от", "")} ${usd(minPrice(h))}${t("", " dan")}</small></div></div>`; }).join("")}</div>`,
    `<div class="ps ps1"><img class="ps-hero" src="${IMG}/t-charm-0-s.webp" alt="" loading="lazy"><div class="ps-in"><b>${L2(charm.name, l)}</b>${fmts.map(([n, p], i) => `<div class="ps-op${i ? "" : " best"}"><span>${n}</span><b>${usd(p)}</b></div>`).join("")}</div></div>`,
    `<div class="ps ps2"><div class="ps-ring">${ic("shield")}</div><b>${t("Цена изменилась", "Narx o‘zgardi")}</b><div class="ps-wn"><s>${usd(was)}</s>${ic("arrow")}<b>${usd(now)}</b></div><small>${t("Подорожал поезд на эти даты: бронируем по новой или берём другой формат", "Shu sanalarga poyezd qimmatladi: yangi narxda bron qilamiz yoki boshqa formatni olamiz")}</small></div>`,
    `<div class="ps ps3"><p class="ps-h">${t("Взрослый 1", "Katta 1")}</p><div class="ps-f"><small>${t("Латиницей, как в паспорте", "Lotincha, pasportdagidek")}</small><b>IVANOV SERGEY</b></div><div class="ps-f2"><div class="ps-f"><small>${t("Рождение", "Tug‘ilgan")}</small><b>14.03.1985</b></div><div class="ps-f"><small>${t("Паспорт", "Pasport")}</small><b>751234567</b></div></div><div class="ps-bx"><span>${t("Битрикс24", "Bitrix24")}</span><b>${t("Новая заявка из приложения", "Ilovadan yangi ariza")}</b></div></div>`,
    `<div class="ps ps4"><b class="ps-sum">${usd(was)}</b>${[["Visa / Mastercard", "#1a1f71"], ["Click", "#0f73ff"], ["Payme", "#00b5bf"], ["Uzum Bank", "#7000ff"]].map(([n, c], i) => `<div class="ps-pm${i ? "" : " on"}"><i style="background:${c}"></i><span>${n}</span></div>`).join("")}</div>`,
    `<div class="ps ps5"><ol class="ps-tl">${[t("Заявка принята", "Ariza qabul qilindi"), t("Бронируем отели и билеты", "Mehmonxona va chiptalarni bron qilyapmiz"), t("Всё подтверждено", "Hammasi tasdiqlandi"), t("Оплачено", "To‘landi"), t("Документы готовы", "Hujjatlar tayyor")].map((x, i) => `<li class="${i < 4 ? "done" : "now"}"><i></i>${x}</li>`).join("")}</ol><div class="ps-doc">${ic("cal")}<span>${t("Программа по дням", "Kunlar bo‘yicha dastur")}</span></div></div>`,
  ];
  return `<section class="story" id="put" data-tone="ice">
<div class="wrap">${head(t("Путь гостя", "Mehmon yo‘li"), t("Шесть шагов, и ни одного письма", "Olti qadam va birorta ham xat yo‘q"), t("Листайте: справа экран приложения, слева то, что в эту секунду делает гость. Всё это работает в айфоне ниже.", "Aylantiring: o‘ngda ilova ekrani, chapda mehmon shu soniyada nima qilyapti. Bularning hammasi pastdagi iPhone’da ishlaydi."))}
<div class="st">
<div class="st-steps">${steps.map(([i, k, h, p], n) => `<article class="st-step" data-step="${n}"><span class="st-n num">0${n + 1}</span><div><p class="st-k">${ic(i)}${k}</p><h3>${h}</h3><p>${p}</p></div></article>`).join("")}</div>
<div class="st-phone-col"><div class="st-sticky">
<div class="mini-phone"><div class="mp-scr">${scr.join("")}</div><span class="mp-island"></span></div>
<div class="st-dots">${steps.map((_, n) => `<i data-d="${n}"></i>`).join("")}</div>
</div></div>
</div>
</div>
</section>`;
}

/* Что сейчас на их сайте и что станет: только то, что видно на dilrabotravel.com (16.10.2026). */
function siteBlock(l) {
  const t = T(l);
  const rows = [
    [t("Цен на туры нет: только «от 200 $ до 800 $». Чтобы узнать цену, гость оставляет заявку и ждёт ответа.", "Turlarning narxi yo‘q: faqat «200 $ dan 800 $ gacha». Narxni bilish uchun mehmon ariza qoldiradi va javob kutadi."), t("Цена за всех на свои даты сразу, в группе и своей машиной.", "O‘z sanalariga hamma uchun narx darhol, guruhda va o‘z mashinasida.")],
    [t("«Подтвердим наличие мест в течение 24 часов». За сутки гость успевает написать ещё трём агентствам.", "«Joylar borligini 24 soat ichida tasdiqlaymiz». Bir kunda mehmon yana uchta agentlikka yozib ulguradi."), t("Места и цена проверены до оплаты, за секунды.", "Joylar va narx to‘lovgacha, soniyalarda tekshiriladi.")],
    [t("Ссылку на оплату присылает менеджер, предоплата от 10% до 50% обсуждается в переписке.", "To‘lov havolasini menejer yuboradi, 10% dan 50% gacha oldindan to‘lov yozishmada kelishiladi."), t("Кнопка «Оплатить»: полностью или предоплатой, процент задаёте вы.", "«To‘lash» tugmasi: to‘liq yoki oldindan to‘lov, foizni siz belgilaysiz.")],
    [t("Форма «Заказать тур» требует имя, телефон, почту и комментарий: все четыре поля обязательные.", "«Tur buyurtma qilish» shakli ism, telefon, pochta va izohni so‘raydi: to‘rttala maydon majburiy."), t("Бронь в одно касание из сохранённых паспортов, сразу сделкой в Битрикс24.", "Saqlangan pasportlardan bir bosishda bron, darhol Bitrix24’da bitim.")],
    [t("Программа и подтверждение приходят письмом на почту, напоминание за 3 дня делает менеджер.", "Dastur va tasdiq pochtaga xat bilan keladi, 3 kun oldin eslatmani menejer qiladi."), t("Ваучер, билеты и программа по дням в телефоне, без интернета. Напоминание приходит само.", "Vaucher, chiptalar va kunlar bo‘yicha dastur telefonda, internetsiz. Eslatma o‘zi keladi.")],
    [t("На первом фото подпись «Regictan» вместо «Registan», в меню «DIlrabo Travel». Гость замечает такое сразу.", "Birinchi suratda «Registan» o‘rniga «Regictan», menyuda «DIlrabo Travel» deb yozilgan. Mehmon buni darhol sezadi."), t("Тексты вычитаны: в приложении и на сайте одно написание.", "Matnlar tekshirilgan: ilovada ham, saytda ham bir xil yozuv.")],
  ];
  return `<section id="sayt" data-tone="paper" class="tight"><div class="wrap">
${head(t("Ваш сайт сегодня", "Saytingiz bugun"), t("Что гость видит сейчас и что станет", "Mehmon hozir nimani ko‘radi va nima bo‘ladi"), t("Смотрели dilrabotravel.com как гость: с выбора тура до оплаты. Коротко, по делу.", "dilrabotravel.com’ni mehmon kabi ko‘rdik: tur tanlashdan to‘lovgacha. Qisqa va aniq."))}
<div class="nw">${rows.map(([a, b], i) => `<div class="nw-r rv a-up" style="--d:${(i % 3) * 60}ms"><div class="nw-a"><span class="nw-k">${t("Сейчас", "Hozir")}</span><p>${a}</p></div><div class="nw-b"><span class="nw-k">${ic("check")}${t("Станет", "Bo‘ladi")}</span><p>${b}</p></div></div>`).join("")}</div>
</div></section>`;
}

function appBlock(l) {
  const t = T(l);
  const jump = [["home", "search", t("Поиск", "Qidiruv")], ["results", "layers", t("Все туры", "Barcha turlar")], ["hotel", "bus", t("Как поехать", "Qanday borish")], ["check", "shield", t("Проверка мест", "Joylarni tekshirish")], ["book", "users", t("Бронь", "Bron")], ["pay", "card", t("Оплата", "To‘lov")], ["trip", "crm", t("Статусы", "Holatlar")], ["docs", "doc", t("Документы", "Hujjatlar")], ["chat", "chat", t("Чат с менеджером", "Menejer bilan chat")], ["hot", "flame", t("Ближайшие выезды", "Yaqin jo‘nashlar")], ["push", "bell", t("Цена снизилась", "Narx tushdi")]];
  return `<section id="prilozhenie" data-tone="ice" class="appsec"><div class="wrap">
<div class="ap-grid">
<div class="ap-text">
${head(t(`Приложение ${B}`, `${B} ilovasi`), t("Пощупайте приложение прямо здесь", "Ilovani shu yerda sinab ko‘ring"), t("Это не картинка: внутри айфона работает макет с вашими турами. Найдите тур, выберите формат, проверьте места, забронируйте, оплатите и откройте документы. Ниже то же самое глазами менеджера.", "Bu rasm emas: iPhone ichida turlaringiz bilan maket ishlaydi. Tur toping, formatni tanlang, joylarni tekshiring, bron qiling, to‘lang va hujjatlarni oching. Pastda xuddi shu menejer ko‘zi bilan."))}
<div class="ap-jump">${jump.map(([k, i, n]) => `<button type="button" data-jump="${k}">${ic(i)}<span>${n}</span></button>`).join("")}</div>
<div class="ap-act"><a class="btn btn-pri shim" id="ap-full" href="${href(l, "app")}" data-full>${ic("full")}<span>${t("Во весь экран", "To‘liq ekranda")}</span></a><span class="ap-note">${t("На телефоне откроется на весь экран, как настоящее приложение.", "Telefonda haqiqiy ilova kabi to‘liq ekranda ochiladi.")}</span></div>
<div class="store-row"><span class="store new">${ic("app")}<span><small>${t("будет", "bo‘ladi")}</small>App Store · iPhone</span></span><span class="store new">${ic("app")}<span><small>${t("будет", "bo‘ladi")}</small>Google Play · Android</span></span></div>
</div>
<div class="ap-dev" id="ap-dev">
<div class="dev-glow" aria-hidden="true"></div>
<div class="iph" id="iph"><div class="iph-in"><span class="ibtn l" style="top:18%;height:4.5%" aria-hidden="true"></span><span class="ibtn l" style="top:26%;height:8.5%" aria-hidden="true"></span><span class="ibtn l" style="top:36.5%;height:8.5%" aria-hidden="true"></span><span class="ibtn r" style="top:29%;height:13%" aria-hidden="true"></span>
<div class="ibz"><div class="iscr"><iframe id="app-frame" title="${t(`Приложение ${B}`, `${B} ilovasi`)}" data-src="${href(l, "app")}?embed=1" loading="lazy" allow="clipboard-write; web-share"></iframe><span class="iisl" aria-hidden="true"></span></div></div></div>
<button type="button" class="iph-x glass" id="iph-x" aria-label="${t("Свернуть", "Yig‘ish")}">${ic("shrink")}<span>${t("Свернуть", "Yig‘ish")}</span></button>
</div>
</div>
</div>
</div></section>`;
}

/* Канбан менеджера: нарисован по устройству Битрикс24, связан с айфоном выше. */
const COLS = (l) => {
  const t = T(l);
  return [
    [t("Новая заявка из приложения", "Ilovadan yangi ariza"), "#2fc6f6"],
    [t("Бронируем отели и билеты", "Mehmonxona va chiptalarni bron qilyapmiz"), "#ffa900"],
    [t("Подтверждено", "Tasdiqlandi"), "#9dcf00"],
    [t("Оплачено", "To‘landi"), "#00b4ac"],
    [t("Документы отправлены", "Hujjatlar yuborildi"), "#3b82f6"],
    [t("В поездке", "Sayohatda"), "#7a4dff"],
    [t("Мест нет, возврат", "Joy yo‘q, qaytarish"), "#ff5752"],
  ];
};
function managerBlock(l) {
  const t = T(l);
  const nm = (id) => L2(tourBy(id).name, l);
  const fm = (id) => L2(D.OPS.find((o) => o.id === id).name, l);
  const others = [
    { id: "x1", name: "Mohd Faizal", hotel: nm("ziarah"), dates: t("5 ноя → 12 ноя", "5 noy → 12 noy"), op: fm("h1"), sum: "5 860 $", col: 1 },
    { id: "x2", name: t("Ольга С.", "Olga S."), hotel: nm("train"), dates: t("8 ноя → 16 ноя", "8 noy → 16 noy"), op: fm("grp"), sum: "1 240 $", col: 2 },
    { id: "x3", name: "Thomas B.", hotel: nm("fergana"), dates: t("3 ноя", "3 noy"), op: fm("gentra"), sum: "190 $", col: 5 },
  ];
  const how = [
    ["crm", t("Сделка сама встаёт в колонку", "Bitim ustunga o‘zi tushadi"), t("Гость нажал «Забронировать», и в вашей воронке появилась сделка: контакт, телефон, гости с паспортами, тур, формат, даты, сумма. Метод Битрикс24 crm.deal.add ставит её сразу в нужную колонку.", "Mehmon «Bron qilish»ni bosdi va voronkangizda bitim paydo bo‘ldi: kontakt, telefon, pasportli mehmonlar, tur, format, sanalar, summa. Bitrix24’ning crm.deal.add metodi uni darhol kerakli ustunga qo‘yadi.")],
    ["arrow", t("Колонка = статус у гостя", "Ustun = mehmondagi holat"), t("Менеджер перетащил сделку, Битрикс24 шлёт событие, приложение меняет статус и присылает уведомление. Писать «как там моя бронь» не нужно.", "Menejer bitimni surdi, Bitrix24 hodisa yuboradi, ilova holatni o‘zgartiradi va bildirishnoma yuboradi. «Bronim nima bo‘ldi» deb yozish shart emas.")],
    ["clip", t("Файл в сделке = документ у гостя", "Bitimdagi fayl = mehmondagi hujjat"), t("Менеджер прикладывает ваучер, билеты, страховку и программу в поле сделки. Приложение забирает их и хранит в телефоне гостя.", "Menejer vaucher, chiptalar, sug‘urta va dasturni bitim maydoniga biriktiradi. Ilova ularni oladi va mehmon telefonida saqlaydi.")],
  ];
  const kanban = { cols: COLS(l).map(([n, c]) => ({ n, c })), others, me: t("из приложения", "ilovadan"), toCol: t("Перенести в колонку", "Ustunga o‘tkazish"), files: ["voucher.pdf", "tickets.pdf", "insurance.pdf", "program.pdf"], att: t("Приложить документы", "Hujjatlarni biriktirish"), attDone: t("Документы в сделке: гостю ушло уведомление", "Hujjatlar bitimda: mehmonga bildirishnoma ketdi"), client: t("Гость видит", "Mehmon ko‘radi"), steps: [t("Заявка принята", "Ariza qabul qilindi"), t("Менеджер бронирует отели и билеты", "Menejer mehmonxona va chiptalarni bron qilmoqda"), t("Всё подтверждено", "Hammasi tasdiqlandi"), t("Оплачено", "To‘landi"), t("Документы готовы", "Hujjatlar tayyor"), t("В поездке", "Sayohatda"), t("Мест не оказалось, возврат оформлен", "Joy bo‘lmadi, qaytarish rasmiylashtirildi")], deal: t("Сделка", "Bitim"), contact: t("Контакт", "Kontakt"), tour: t("Тур", "Tur"), op: t("Формат", "Format"), sum: t("Сумма", "Summa"), paid: t("оплачено", "to‘langan"), notPaid: t("не оплачено", "to‘lanmagan"), source: t("Источник: приложение", "Manba: ilova"), filesT: t("Документы для гостя", "Mehmon uchun hujjatlar"), noFiles: t("Файлов пока нет", "Hozircha fayl yo‘q"), demoCard: t("Демо-сделка, связана с айфоном выше", "Demo bitim, yuqoridagi iPhone bilan bog‘langan"), otherCard: t("Нарисованная сделка для вида", "Ko‘rinish uchun chizilgan bitim"), pick: t("Нажмите на сделку", "Bitimni bosing"), fresh: t("Новая заявка из приложения", "Ilovadan yangi ariza") };
  return `<section id="menedzher" data-tone="paper"><div class="wrap">
${head(t("Как это видит менеджер", "Menejer buni qanday ko‘radi"), t("Битрикс24: заявка уже в колонке, статус двигает менеджер", "Bitrix24: ariza allaqachon ustunda, holatni menejer suradi"), t("Нарисовано по устройству Битрикс24, это не настоящий портал. Переносите сделку стрелками или перетаскиванием: в айфоне выше у гостя меняется статус. Забронируйте тур в айфоне, и здесь появится новая сделка.", "Bitrix24 tuzilishi bo‘yicha chizilgan, bu haqiqiy portal emas. Bitimni strelkalar yoki sudrash bilan o‘tkazing: yuqoridagi iPhone’da mehmon holati o‘zgaradi. iPhone’da tur bron qiling, bu yerda yangi bitim paydo bo‘ladi."))}
<div class="bx rv a-up">
<div class="bx-top"><span class="bx-logo">${t("Битрикс24", "Bitrix24")}</span><span class="bx-tab on">${t("Сделки", "Bitimlar")}</span><span class="bx-tab">${t("Воронка «Туры из приложения»", "«Ilovadan turlar» voronkasi")}</span><span class="bx-note">${t("макет", "maket")}</span></div>
<div class="bx-board" id="bx-board" aria-label="${t("Канбан сделок", "Bitimlar kanbani")}"></div>
<div class="bx-side" id="bx-side"><p class="bx-empty">${kanban.pick}</p></div>
<div class="bx-push" id="bx-push" role="status" aria-live="polite"><svg aria-hidden="true"><use href="#tb-mark"/></svg><div><small>${kanban.client}</small><b></b></div></div>
</div>
<script type="application/json" id="bx-data">${json(kanban)}</script>
<div class="how3">${how.map(([i, h, p], n) => `<div class="h3c rv a-rise" style="--d:${n * 80}ms"><span class="h3i">${ic(i)}</span><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>`;
}

/* Схема простыми словами. */
function schemeBlock(l) {
  const t = T(l);
  const nodes = [
    ["layers", t("Каталог туров", "Turlar katalogi"), t("Программы, даты выездов, цены и места ведёт менеджер в Битрикс24", "Dasturlar, jo‘nash sanalari, narxlar va joylarni menejer Bitrix24’da yuritadi")],
    ["app", t("Приложение", "Ilova"), t("Гость ищет, выбирает формат, вводит паспорта и жмёт «Забронировать»", "Mehmon qidiradi, formatni tanlaydi, pasportlarni kiritadi va «Bron qilish»ni bosadi")],
    ["crm", t("Битрикс24", "Bitrix24"), t("Сделка в колонке. Менеджер бронирует отели и поезд и двигает сделку", "Bitim ustunda. Menejer mehmonxona va poyezdni bron qiladi va bitimni suradi")],
    ["card", t("Оплата", "To‘lov"), t("Visa, Mastercard, Click, Payme: деньги на счёт агентства, сделка сама в «Оплачено»", "Visa, Mastercard, Click, Payme: pul agentlik hisobiga, bitim o‘zi «To‘landi»ga")],
    ["doc", t("Документы", "Hujjatlar"), t("Ваучер, билеты и программа из сделки уходят в приложение", "Bitimdagi vaucher, chiptalar va dastur ilovaga ketadi")],
  ];
  return `<section id="shema" data-tone="ink" class="dark"><div class="wrap">
${head(t("Как это устроено", "Bu qanday tuzilgan"), t("Каталог, приложение, Битрикс24, оплата, документы", "Katalog, ilova, Bitrix24, to‘lov, hujjatlar"), t("Пять звеньев, каждое делает одно дело. Менеджер работает в привычном Битрикс24, гость в приложении, туры приходят из вашего же каталога.", "Besh bo‘g‘in, har biri bitta ishni qiladi. Menejer odatiy Bitrix24’da, mehmon ilovada ishlaydi, turlar o‘z katalogingizdan keladi."))}
<ol class="flow">${nodes.map(([i, h, p], n) => `<li class="fl-n rv a-rise" style="--d:${n * 90}ms"><span class="fl-i">${ic(i)}</span><b>${h}</b><p>${p}</p></li>`).join("")}</ol>
<p class="src">${t("Турвизор вам не нужен: в нём туры зарубежных туроператоров, а вы продаёте свои программы по Узбекистану. Поэтому туры, даты групп и цены живут у вас в Битрикс24, и приложение берёт их оттуда.", "Turvizor sizga kerak emas: unda xorijiy turoperatorlarning turlari, siz esa O‘zbekiston bo‘ylab o‘z dasturlaringizni sotasiz. Shuning uchun turlar, guruh sanalari va narxlar sizning Bitrix24’ingizda, ilova ularni o‘sha yerdan oladi.")}</p>
</div></section>`;
}

/* Их пять шагов брони (раздел «Как забронировать тур» на их сайте) и что с ними станет. */
function answerBlock(l) {
  const t = T(l);
  const rows = [
    [t("«Выберите маршрут на сайте или свяжитесь с нами»", "«Saytda yo‘nalishni tanlang yoki biz bilan bog‘laning»"), "min", t("Все туры в поиске по городу, датам и дням, цена за всех сразу. Нужен свой маршрут: «Написать менеджеру», переписка в той же сделке.", "Barcha turlar shahar, sana va kunlar bo‘yicha qidiruvda, hamma uchun narx darhol. O‘z yo‘nalishi kerak bo‘lsa: «Menejerga yozish», yozishma o‘sha bitimda.")],
    [t("«Мы подтвердим наличие мест в течение 24 часов»", "«Joylar borligini 24 soat ichida tasdiqlaymiz»"), "min", t("Проверка мест и цены до оплаты: отели, поезд, гид и машина. Если отель подтверждает вручную, гость видит статус «бронируем», а не ждёт письма.", "To‘lovgacha joy va narxni tekshirish: mehmonxona, poyezd, gid va mashina. Mehmonxona qo‘lda tasdiqlasa, mehmon xat kutmaydi, «bron qilyapmiz» holatini ko‘radi.")],
    [t("«Внесите предоплату от 10% до 50%: ссылка для онлайн-оплаты или наличные»", "«10% dan 50% gacha oldindan to‘lang: onlayn to‘lov havolasi yoki naqd»"), "min", t("Кнопка «Оплатить»: полностью или предоплатой, процент задаёте вы. Наличные остаются: менеджер отмечает оплату в сделке.", "«To‘lash» tugmasi: to‘liq yoki oldindan, foizni siz belgilaysiz. Naqd ham qoladi: menejer to‘lovni bitimda belgilaydi.")],
    [t("Заявки с сайта, из WhatsApp и Telegram", "Sayt, WhatsApp va Telegramdan arizalar"), "min", t("Бронь из приложения сразу сделкой в Битрикс24: контакт, паспорта, тур, формат и сумма. Ничего не переписывать руками.", "Ilovadagi bron darhol Bitrix24’da bitim: kontakt, pasportlar, tur, format va summa. Hech narsani qo‘lda ko‘chirmaslik.")],
    [t("«Получите подтверждение бронирования на email с детальной программой тура»", "«Tur dasturi bilan bron tasdig‘ini emailga oling»"), "max", t("Ваучер, билеты, страховка и программа по дням в приложении, из файлов сделки. Открываются без интернета, в поезде и в горах.", "Vaucher, chiptalar, sug‘urta va kunlar bo‘yicha dastur ilovada, bitim fayllaridan. Internetsiz, poyezdda va tog‘da ham ochiladi.")],
    [t("«За 3 дня до выезда наш менеджер напомнит о туре»", "«Jo‘nashdan 3 kun oldin menejerimiz tur haqida eslatadi»"), "max", t("Напоминание и каждый новый статус приходят уведомлением сами, менеджер на это время не тратит.", "Eslatma va har bir yangi holat bildirishnoma bo‘lib o‘zi keladi, menejer bunga vaqt sarflamaydi.")],
  ];
  const ask = [
    t("Битрикс24: облако или коробка, воронка и колонки. Где сейчас лежат туры и даты групп: в товарах, в таблице или у менеджеров в голове.", "Bitrix24: bulut yoki quti, voronka va ustunlar. Turlar va guruh sanalari hozir qayerda: tovarlarda, jadvalda yoki menejerlar boshida."),
    t("Какой банк принимает у вас Visa и Mastercard и есть ли договоры с Click и Payme. Какой процент предоплаты ставить по умолчанию.", "Qaysi bank sizda Visa va Mastercard’ni qabul qiladi, Click va Payme bilan shartnoma bormi. Odatiy oldindan to‘lov foizi qancha."),
    t("Какие языки приложения нужны первыми. На сайте у вас русский и английский, гости приезжают из 25+ стран.", "Ilovaning qaysi tillari birinchi kerak. Saytingizda rus va ingliz tillari, mehmonlar 25+ davlatdan keladi."),
    t("Логотип: знак мы взяли с вашего сайта, он векторный. Пришлите полный логотип с надписью, если он есть.", "Logotip: belgini saytingizdan oldik, u vektorli. Yozuvli to‘liq logotip bo‘lsa, yuboring."),
    t("Договор с туристом и политика персональных данных: тексты покажем в приложении перед бронью.", "Turist bilan shartnoma va shaxsiy ma’lumotlar siyosati: matnlarni ilovada bron oldidan ko‘rsatamiz."),
  ];
  return `<section id="otvet" data-tone="paper"><div class="wrap">
${head(t("Ваша бронь сейчас и в приложении", "Broningiz hozir va ilovada"), t("Пять шагов с вашего сайта, и что с ними станет", "Saytingizdagi besh qadam va ular bilan nima bo‘ladi"), t("Цитаты из раздела «Как забронировать тур» на dilrabotravel.com. «Приложение: минимум» и «Приложение: максимум» как в предложении ниже.", "dilrabotravel.com’dagi «Turni qanday bron qilish» bo‘limidan iqtiboslar. «Ilova: minimum» va «Ilova: maksimum» quyidagi taklifdagidek."))}
<div class="ans">${rows.map(([q, tier, a], i) => `<div class="an rv a-up" style="--d:${(i % 3) * 60}ms"><span class="an-n num">${i + 1}</span><div><p class="an-q">${q}</p><p class="an-a">${a}</p></div><span class="an-t ${tier}">${ic("check")}${tier === "min" ? t("Приложение: минимум", "Ilova: minimum") : t("Приложение: максимум", "Ilova: maksimum")}</span></div>`).join("")}</div>
<div class="ask rv a-up"><h3>${t("Что уточним у вас", "Sizdan nimani aniqlaymiz")}</h3><ul>${ask.map((x) => `<li>${ic("info")}<span>${x}</span></li>`).join("")}</ul></div>
</div></section>`;
}

function needBlock(l) {
  const t = T(l);
  const cards = [
    ["crm", t("Битрикс24", "Bitrix24"), t("Облако или коробка, воронка и колонки, вебхук с доступом к сделкам и каталогу туров, поле для файлов в сделке.", "Bulut yoki quti, voronka va ustunlar, bitimlar va turlar katalogiga kirishli vebxuk, bitimda fayllar uchun maydon.")],
    ["card", t("Оплата", "To‘lov"), t("Договор банка на приём Visa и Mastercard, при желании Click и Payme, и ключи кассы. Комиссия по вашему договору.", "Visa va Mastercard qabul qilish uchun bank shartnomasi, xohlasangiz Click va Payme, kassa kalitlari. Komissiya shartnomangiz bo‘yicha.")],
    ["app", t("App Store и Google Play", "App Store va Google Play"), t("Аккаунт Apple Developer на компанию: 99 $ в год и номер D-U-N-S. Google Play: 25 $ один раз.", "Kompaniyaga Apple Developer akkaunti: yiliga 99 $ va D-U-N-S raqami. Google Play: bir marta 25 $.")],
    ["cal", t("Туры и даты", "Turlar va sanalar"), t("Программы и фото уже на вашем сайте. Нужны цены и календарь групповых выездов.", "Dasturlar va suratlar saytingizda allaqachon bor. Narxlar va guruh jo‘nashlari taqvimi kerak.")],
  ];
  return `<section id="nuzhno" data-tone="paper" class="tight"><div class="wrap">
${head(t("Что нужно от вас", "Sizdan nima kerak"), t("Четыре вещи, и можно начинать", "To‘rtta narsa va boshlash mumkin"), "")}
<div class="need">${cards.map(([i, h, p], n) => `<div class="nd rv a-rise" style="--d:${n * 70}ms"><span class="h3i">${ic(i)}</span><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>`;
}

/* Наш проект в этой нише: Apollo Travel (content/cases.ts, slug apollo-travel). */
function caseBlock(l) {
  const t = T(l);
  const took = [
    ["search", t("Поиск одной строкой", "Bir qatorli qidiruv"), t("Куда, когда, сколько дней, кто едет: всё в одной строке, без лишних экранов.", "Qayerga, qachon, necha kun, kim boradi: hammasi bitta qatorda, ortiqcha ekranlarsiz.")],
    ["plane", t("Ожидание поиска как полёт", "Qidiruvni kutish parvoz kabi"), t("Пока считаются цены по форматам, самолёт летит по дуге, форматы отмечаются по очереди.", "Formatlar bo‘yicha narxlar hisoblanayotganda samolyot yoy bo‘ylab uchadi, formatlar navbat bilan belgilanadi.")],
    ["ticket", t("Ближайшие выезды талонами", "Yaqin jo‘nashlar talon ko‘rinishida"), t("Посадочный талон: откуда, куда, через сколько дней выезд, старая и новая цена.", "Bort taloni: qayerdan, qayerga, necha kundan keyin jo‘nash, eski va yangi narx.")],
  ];
  return `<section id="keys" data-tone="paper" class="tight"><div class="wrap">
${head(t("Мы уже делали для турагентств", "Turagentliklar uchun allaqachon qilganmiz"), t("Apollo Travel: поиск у 70+ туроператоров", "Apollo Travel: 70+ turoperatorda qidiruv"), t("Сайт турагентства в Ташкенте. Удачные приёмы оттуда уже в этом приложении, но не один в один: у вас свои туры, и приложение решает другую задачу, бронь и документы без писем.", "Toshkentdagi turagentlik sayti. U yerdagi muvaffaqiyatli usullar bu ilovada allaqachon bor, lekin aynan o‘xshatilmagan: sizda o‘z turlaringiz, ilova esa boshqa vazifani hal qiladi, bron va hujjatlar xatlarsiz."))}
<div class="case rv a-up"><div class="case-h"><span class="case-m">AT</span><div><b>Apollo Travel</b><small>${t("сайт турагентства с поиском туров, Ташкент", "turlarni qidirishli turagentlik sayti, Toshkent")}</small></div><span class="case-n"><b class="num">70+</b>${t("туроператоров в одном поиске", "bitta qidiruvdagi turoperator")}</span></div>
<div class="case-t">${took.map(([i, h, p]) => `<div><span class="h3i">${ic(i)}</span><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
<div class="case-a"><a class="btn btn-pri" href="https://devuz.studio/${l}/cases/apollo-travel" target="_blank" rel="noopener">${t("Кейс Apollo Travel", "Apollo Travel keysi")}${ic("arrow")}</a><a class="btn btn-ghost" href="https://cases.devuz.studio/apollo" target="_blank" rel="noopener">${t("Открыть сайт", "Saytni ochish")}</a></div></div>
</div></section>`;
}

/* Предложение DevUz: сайт по акции 48 часов или приложение (минимум, максимум), допы, срок и итог. */
function offerBlock(l) {
  const t = T(l);
  const tier = (x, i) => `<label class="tier${x.star ? " star" : ""}"><input type="radio" name="tier" value="${x.id}" data-g="${x.g}" data-p="${x.price}" data-w="${x.weeks.join("-")}"${i === 0 ? " checked" : ""}><div class="tr-h"><span class="rd2" aria-hidden="true"></span><b>${x[l].t}</b>${x.star ? `<em class="star-t">${t("путь без писем", "xatlarsiz yo‘l")}</em>` : x.g === "site" ? `<em class="star-t">${t("акция 48 часов", "48 soatlik aksiya")}</em>` : ""}</div><p class="tr-d">${x[l].d}</p><p class="tr-p num">${x.regular ? `<s class="tr-was">${usd(x.regular)}</s> ` : ""}<span class="tr-now">${usd(x.price)}</span></p>${x.regular ? `<p class="tr-48">${t(`Цена ${usd(x.price)} действует ${OFFER_HOURS} часов с первого открытия макета, потом ${usd(x.regular)}`, `${usd(x.price)} narxi maket birinchi ochilgandan ${OFFER_HOURS} soat amal qiladi, keyin ${usd(x.regular)}`)}</p>` : ""}<p class="tr-w">${x.weeks.join("-")} ${t(x.weeks[1] < 5 ? "недели" : "недель", "hafta")}</p><ul>${x[l].items.map((it) => `<li>${ic("check")}<span>${it}</span></li>`).join("")}</ul></label>`;
  const row = (a, g) => `<label class="kit-row"><input type="checkbox" data-g="${g}" data-k="${a.id}" data-p="${a.price}" data-w="${a.weeks}"><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}${a.star ? `<em class="star">${t("часто берут", "ko‘p olishadi")}</em>` : ""}</b><small>${a[l].e}</small></span><span class="kit-p num">+${usd(a.price)}</span></label>`;
  return `<section id="predlozhenie" data-tone="paper" class="offer"><div class="wrap">
${head(ours(l), t("Сколько стоит и за сколько сделаем", "Qancha turadi va qancha vaqtda qilamiz"), t("Начать можно с сайта за 1 000 $, приложение добавить потом. Выберите вариант и включите допы: итог и срок пересчитаются сразу. Цены предварительные, точные после созвона и доступа к Битрикс24.", "Saytdan 1 000 $ ga boshlash mumkin, ilovani keyin qo‘shasiz. Variantni tanlang va qo‘shimchalarni yoqing: jami va muddat darhol qayta hisoblanadi. Narxlar dastlabki, aniq narx qo‘ng‘iroq va Bitrix24’ga kirishdan keyin."))}
<div class="kit" id="konstruktor">
<div class="kit-list">
<div class="tiers">${OPTS.map(tier).join("")}</div>
<div class="kit-grp" data-g="site"><h3 class="kit-g">${t("Допы к сайту: включайте то, что нужно", "Saytga qo‘shimchalar: keraklisini yoqing")}</h3>
${SITE_ADDONS.map((a) => row(a, "site")).join("")}</div>
<div class="kit-grp" data-g="app" hidden><h3 class="kit-g">${t("Допы к приложению: включайте то, что нужно", "Ilovaga qo‘shimchalar: keraklisini yoqing")}</h3>
${ADDONS.map((a) => row(a, "app")).join("")}</div>
<h3 class="kit-g">${t("Расходы агентства мимо нас", "Bizdan tashqari agentlik xarajatlari")}</h3>
<div class="costs">${COSTS.map((c) => `<p><span>${c[l][0]}</span><b>${c[l][1]}</b></p>`).join("")}</div>
</div>
<div class="kit-side">
<div class="kit-total beam" id="kit-total">
<p class="kt-k">${t("Ваш расчёт", "Sizning hisobingiz")}</p>
<div class="timer" id="timer"><span><b class="tm-t">${t(`Сайт за ${usd(SITE.price)} вместо ${usd(SITE.regular)}`, `Sayt ${usd(SITE.regular)} o‘rniga ${usd(SITE.price)}`)}</b><small class="tm-s">${t(`осталось из ${OFFER_HOURS} часов с первого открытия макета`, `maket birinchi ochilgandan ${OFFER_HOURS} soatdan qoldi`)}</small></span><b class="num" id="tm">${OFFER_HOURS}:00:00</b></div>
<div class="kt-line"><span id="kt-tier"></span><span class="num" id="kt-tp"></span></div>
<div class="kt-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kit-n">0</span></span><span class="num" id="kit-add">0 $</span></div>
<label class="kt-cash"><input type="checkbox" id="kit-cash"><span class="sw" aria-hidden="true"></span><span>${t(`Оплата наличными: минус ${CASH_OFF}%`, `Naqd to‘lov: ${CASH_OFF}% chegirma`)}</span><b class="num" id="kit-cash-v"></b></label>
<div class="kt-sum"><small>${t("Итого", "Jami")}</small><b class="num" id="kit-sum">${usd(SITE.price)}</b><small class="kt-was">${t("Срок, недель", "Muddat, hafta")}: <span class="num" id="kit-weeks"></span></small></div>
<a class="btn btn-white" id="kit-go" href="https://t.me/Devuz_studio_bot?start=dilrabo">${ic("tg")}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
<button type="button" class="copy" id="kit-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button>
</div>
<p class="src">${t(`Сайт ${usd(SITE.price)}, ${SITE.weeks.join("-")} недели, со всеми допами к сайту ${usd(SITE_ALL)}. Цена сайта ${usd(SITE.price)} вместо ${usd(SITE.regular)} действует ${OFFER_HOURS} часов с первого открытия макета, потом ${usd(SITE.regular)}; допы к сайту без скидки. «Приложение: минимум» ${usd(TIERS[0].price)}, ${TIERS[0].weeks.join("-")} недель; «Приложение: максимум» ${usd(TIERS[1].price)}, ${TIERS[1].weeks.join("-")} недель. Допы по рыночным ставкам, со всеми допами ${usd(ALL)}. При оплате наличными минус ${CASH_OFF}% от итога вместе с допами. Расходы на магазины, банк, платёжные системы и SMS агентство платит само, в цену они не входят. Оплата этапами: аванс, макет экранов, публикация.`, `Sayt ${usd(SITE.price)}, ${SITE.weeks.join("-")} hafta, saytga barcha qo‘shimchalar bilan ${usd(SITE_ALL)}. Sayt narxi ${usd(SITE.regular)} o‘rniga ${usd(SITE.price)} maket birinchi ochilgandan ${OFFER_HOURS} soat amal qiladi, keyin ${usd(SITE.regular)}; saytga qo‘shimchalar chegirmasiz. «Ilova: minimum» ${usd(TIERS[0].price)}, ${TIERS[0].weeks.join("-")} hafta; «Ilova: maksimum» ${usd(TIERS[1].price)}, ${TIERS[1].weeks.join("-")} hafta. Qo‘shimchalar bozor narxida, barchasi bilan ${usd(ALL)}. Naqd to‘lovda qo‘shimchalar bilan birga jamidan ${CASH_OFF}% chegirma. Do‘konlar, bank, to‘lov tizimlari va SMS xarajatlarini agentlik o‘zi to‘laydi, ular narxga kirmaydi. To‘lov bosqichma-bosqich: avans, ekranlar maketi, joylash.`)}</p>
</div>
</div>
</div></section>`;
}

function shell(l, body) {
  const t = T(l);
  const other = l === "ru" ? "uz" : "ru";
  const nav = [["#put", t("Путь гостя", "Mehmon yo‘li")], ["#prilozhenie", t("Приложение", "Ilova")], ["#menedzher", t("Менеджер", "Menejer")], ["#otvet", t("Ваша бронь", "Broningiz")], ["#predlozhenie", t("Цена", "Narx")]];
  const kit = {
    tiers: OPTS.map((x) => ({ id: x.id, g: x.g, t: x[l].t, p: x.price, w: x.weeks })), items: [...SITE_ADDONS.map((a) => ({ id: a.id, g: "site", t: a[l].t, p: a.price, w: a.weeks })), ...ADDONS.map((a) => ({ id: a.id, g: "app", t: a[l].t, p: a.price, w: a.weeks }))],
    promo: { id: SITE.id, price: SITE.price, regular: SITE.regular, hours: OFFER_HOURS }, ended: t(`Срок акции вышел: сайт по обычной цене ${usd(SITE.regular)}`, `Aksiya muddati tugadi: sayt odatiy narxda, ${usd(SITE.regular)}`), endedS: t("цена до акции", "aksiyadan oldingi narx"),
    cash: CASH_OFF, cashName: t("Оплата наличными", "Naqd to‘lov"), copied: t("Скопировано", "Nusxalandi"), head: t(`${B}: сайт и приложение, состав из конструктора:`, `${B}: sayt va ilova, konstruktordan tarkib:`), total: t("Итого", "Jami"), weeks: t("недель", "hafta"),
  };
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t(`Приложение ${B}: туры, бронь, оплата · макет DevUz Studio`, `${B} ilovasi: turlar, bron, to‘lov · DevUz Studio maketi`)}</title>
<meta name="description" content="${t("Макет приложения Dilrabo Travel: туры по Узбекистану в одном поиске, проверка мест, бронь в Битрикс24, оплата картой любой страны, статусы и документы без писем.", "Dilrabo Travel ilovasi maketi: O‘zbekiston bo‘ylab turlar bitta qidiruvda, joylarni tekshirish, Bitrix24’da bron, istalgan davlat kartasi bilan to‘lov, xatlarsiz holatlar va hujjatlar.")}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#131643">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="alternate" hreflang="${other}" href="${href(other)}">
${FONT_PRE}
<link rel="preload" as="image" href="${IMG}/hero-s.webp" media="(max-width: 860px)">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=false;try{if(sessionStorage.getItem('dt-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
@@S@@
</head>
<body data-lang="${l}">
${LQ}
${SPRITE}
<div class="bgfx" aria-hidden="true"><i class="tn-sky" data-tone="sky"></i><i class="tn-ice" data-tone="ice"></i><i class="tn-paper" data-tone="paper"></i><i class="tn-ink" data-tone="ink"></i></div>
${introHtml(l)}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top glass" id="top"><div class="wrap">
<a class="logo" href="${href(l)}">${logo("lg")}</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
<div class="top-r"><div class="lang"><a href="${href("ru")}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz")}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>
<a class="btn btn-pri btn-sm top-cta" href="#prilozhenie" data-jump="home">${ic("app")}<span>${t("Открыть приложение", "Ilovani ochish")}</span></a></div>
</div></header>
<main id="main">
${body}
</main>
<footer class="foot dark" data-tone="ink"><div class="wrap">
<div class="cols">
<div>${logo("f-logo")}<p>${t("Знак, цвета и шрифт Tilda Sans взяты с вашего сайта dilrabotravel.com. Пришлёте полный логотип с надписью, и он встанет везде за час.", "Belgi, ranglar va Tilda Sans shrifti dilrabotravel.com saytingizdan olindi. Yozuvli to‘liq logotipni yuborsangiz, bir soatda hamma joyga qo‘yiladi.")}</p></div>
<div><b>${B}</b><ul><li><a href="tel:${D.BRAND.phoneHref}">${D.BRAND.phone}</a></li><li><a href="${D.BRAND.wa}">WhatsApp</a> · <a href="${D.BRAND.tg}">Telegram</a></li><li>${L2(D.BRAND.addr, l)}</li><li>${L2(D.BRAND.hours, l)}</li></ul></div>
<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=dilrabo">Telegram</a></li></ul></div>
<div><b>${t("Данные макета", "Maket ma’lumotlari")}</b><ul><li>${t("Туры, маршруты, машины, фото: dilrabotravel.com", "Turlar, yo‘nalishlar, mashinalar, suratlar: dilrabotravel.com")}</li><li>${t("Цены туров и даты выездов: демо", "Tur narxlari va jo‘nash sanalari: demo")}</li></ul></div>
</div>
<div class="rights"><span>${t("Это макет: так может выглядеть приложение вашего агентства. Туры, программы, машины и фото взяты с вашего сайта, цены туров и даты выездов придуманы для показа: в работе их отдаёт ваш каталог в Битрикс24. Канбан нарисован по устройству Битрикс24.", "Bu maket: agentligingiz ilovasi shunday ko‘rinishi mumkin. Turlar, dasturlar, mashinalar va suratlar saytingizdan olindi, tur narxlari va jo‘nash sanalari ko‘rsatish uchun o‘ylab topilgan: ishda ularni Bitrix24’dagi katalogingiz beradi. Kanban Bitrix24 tuzilishi bo‘yicha chizilgan.")}</span><span>${t("Макет принадлежит DevUz Studio. Использовать его можно только по договору:", "Maket DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari")}</a></span></div>
</div></footer>
<div class="dock glass" id="dock"><a class="btn btn-pri" href="#prilozhenie" data-jump="home">${ic("app")}<span>${t("Открыть приложение", "Ilovani ochish")}</span></a><a class="btn btn-ghost dock-k" href="#konstruktor" aria-label="${t("Цена", "Narx")}"><b class="num" id="dock-sum">${usd(SITE.price)}</b></a></div>
<script type="application/json" id="kit-data">${json(kit)}</script>
<script>
${INTRO}</script>
@@J@@
</body>
</html>`;
}

function site(l) {
  return shell(l, [heroBlock(l), storyBlock(l), siteBlock(l), appBlock(l), managerBlock(l), schemeBlock(l), answerBlock(l), needBlock(l), caseBlock(l), offerBlock(l)].join("\n"));
}

const out = { "": site("ru"), uz: site("uz"), app: appPage("ru"), "uz/app": appPage("uz") };
const parts = { S: `<style>${SITE_CSS}</style>`, J: `<script>\n${SITE_JS}</script>`, A: `<style>${APP_CSS}</style>`, K: `<script>\n${APP_JS}</script>` };
const fill = (page) => Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), page);

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "dilrabo.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(8), fill(v).length);
