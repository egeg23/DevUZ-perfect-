import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as D from "./data.mjs";
import { UI } from "./ui.mjs";
import { ADDONS, ALL, BASE as KIT } from "./plan.mjs";

/*
 * Макет DomTut (domtut.uz): портал новостроек Ташкента. Два варианта в одном
 * макете, ru и uz:
 *  - сайт (`""`, `uz`): промо DevUz, влёт камеры в сердце их знака, первый
 *    экран с параллаксом и поиском на жидком стекле, путь покупателя по
 *    прокрутке, бенто, новостройки, цены по районам, приложение в айфоне,
 *    предложение DevUz с конструктором 4 800 $ → 1 000 $ на 48 часов;
 *  - приложение (`app`, `uz/app`): на телефоне на весь экран, на ПК — айфон
 *    по центру; на сайте оно же в нарисованном айфоне (?embed=1).
 * Всё о компании — с domtut.uz, 14.10.2026 (data.mjs). Исследование и
 * конкуренты — docs/research/domtut.md, снимки — SOURCES.md.
 *
 * Стили и скрипты общие, в странице вместо них @@S@@, @@J@@, @@A@@, @@K@@.
 * Ссылки — через __PROTO_BASE__, отпечаток ставится при показе зерном из
 * protos.stamp (lib/proto/bundles). Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/domtut";
const BASE = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Onest:wght@400;700&display=swap";
const SITE_CSS = min(readFileSync(DIR + "site.css", "utf8")).replace(/__IMG__/g, IMG);
const APP_CSS = min(readFileSync(DIR + "app.css", "utf8"));
const SITE_JS = strip(readFileSync(DIR + "site.js", "utf8"));
const APP_JS = strip(readFileSync(DIR + "app.js", "utf8"));
const INTRO = strip(readFileSync(DIR + "intro.js", "utf8"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => grp(n) + " $";
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const href = (l, path = "") => BASE + (l === "uz" ? "/uz" : "") + (path ? "/" + path : "");
/* Пара [ru, uz] → строка нужного языка, рекурсивно. */
function pick(v, l) {
  const i = l === "ru" ? 0 : 1;
  if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "string" || Array.isArray(x))) {
    if (typeof v[0] === "string" && typeof v[1] === "string") return v[i];
    if (Array.isArray(v[0]) && Array.isArray(v[1]) && !v[0].every((x) => typeof x === "number")) return v[i];
  }
  if (Array.isArray(v)) return v.map((x) => pick(x, l));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, pick(x, l)]));
  return v;
}

/* ── Логотип DomTut: вектор с их сайта (sprite.svg#logo2) ─────────────── */
const LOGO = JSON.parse(readFileSync(DIR + "logo.json", "utf8"));
const cut = LOGO.house.indexOf("M24.6316");
const HEART = LOGO.house.slice(cut);
const MARK = `<path d="${LOGO.back}" fill="#4D97FF"/><path d="${LOGO.front}" fill="#006AFF"/><path fill-rule="evenodd" clip-rule="evenodd" d="${LOGO.house}" fill="#fff"/>`;
const LOGO_DEFS = `<symbol id="dt-mark" viewBox="0 0 48 48">${MARK}</symbol><symbol id="dt-logo" viewBox="0 0 156 48">${MARK}<g fill="currentColor">${LOGO.word.map((d) => `<path d="${d}"/>`).join("")}</g><g fill="currentColor" opacity=".72">${LOGO.tag.map((d) => `<path d="${d}"/>`).join("")}</g></symbol>`;
const logo = (cls, label = "DomTut") => `<svg class="${cls}" viewBox="0 0 156 48" role="img" aria-label="${label}"><use href="#dt-logo"/></svg>`;

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
  calc: `<rect x="5" y="3" width="14" height="18" rx="2.5" ${S}/><path d="M8.5 7h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5v3M8.5 18h.01M12 18h.01" ${S}/>`,
  map: `<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6zM9 4v14M15 6v14" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  sort: `<path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5" ${S}/>`,
  filter: `<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" ${S}/><circle cx="16" cy="6" r="2" ${S}/><circle cx="10" cy="12" r="2" ${S}/><circle cx="18" cy="18" r="2" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  build: `<path d="M4 21V9l6-4v16M10 21h10V11l-6-3M7 12h.01M7 15h.01M7 18h.01M14 13h2M14 16h2" ${S}/>`,
  share: `<path d="M12 15V3.5M8 7l4-4 4 4M5 11v8.5h14V11" ${S}/>`,
  phone: `<path d="M5 3.5h3.5l2 5-2.5 1.6a11 11 0 0 0 5.9 5.9l1.6-2.5 5 2v3.5a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2z" ${S}/>`,
  cal: `<rect x="4" y="5" width="16" height="15" rx="3" ${S}/><path d="M4 10h16M9 3v4M15 3v4" ${S}/>`,
  video: `<rect x="3" y="6" width="13" height="12" rx="3" ${S}/><path d="m16 10.5 5-3v9l-5-3" ${S}/>`,
  tg: `<path d="M21 4 3 11l6 2 2 6 3-4 5 4z" ${S}/><path d="m9 13 9-7" ${S}/>`,
  home: `<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" ${S}/>`,
  key: `<circle cx="8" cy="15" r="4" ${S}/><path d="m11 12 8-8M16 7l2 2M14 9l2 2" ${S}/>`,
  chart: `<path d="M4 20h16M7 16v-5M12 16V7M17 16v-8" ${S}/>`,
  cmp: `<rect x="3" y="5" width="7" height="14" rx="2" ${S}/><rect x="14" y="5" width="7" height="14" rx="2" ${S}/><path d="M12 3v18" ${S}/>`,
  plus: `<path d="M12 5v14M5 12h14" ${S}/>`,
  minus: `<path d="M5 12h14" ${S}/>`,
  user: `<circle cx="12" cy="8.5" r="3.8" ${S}/><path d="M4.5 20c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5" ${S}/>`,
  doc: `<path d="M7 3.5h7l4 4v13H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" ${S}/><path d="M14 3.5V8h4M9.5 12.5h5M9.5 16h5" ${S}/>`,
  cur: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M14.5 9.2c-.5-.8-1.5-1.2-2.5-1.2-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.4-2.5-1.2M12 6.5V8M12 16v1.5" ${S}/>`,
  globe: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z" ${S}/>`,
  info: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 11v5.5M12 7.8v.01" ${S}/>`,
  clock: `<circle cx="12" cy="12" r="8" ${S}/><path d="M12 7.5V12l3 2" ${S}/>`,
  full: `<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" ${S}/>`,
  shrink: `<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" ${S}/>`,
  app: `<rect x="6.5" y="2.5" width="11" height="19" rx="3" ${S}/><path d="M10.5 18.5h3" ${S}/>`,
  metro: `<path d="M4 18 8 6l4 8 4-8 4 12" ${S}/>`,
  star: `<path d="m12 3.8 2.5 5.2 5.7.7-4.2 3.9 1.1 5.6L12 16.4l-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z" ${S}/>`,
  shield: `<path d="M12 3 19 6v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" ${S}/><path d="m9 12 2 2 4-4" ${S}/>`,
};
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${LOGO_DEFS}${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`)
  .join("")}</defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;

/* Промо DevUz Studio — тот же знак, что на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZSIGN = `<svg class="dz-sign" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

/* Фильтр преломления «жидкого стекла»: шум смещает то, что под стеклом.
   Понимает Chromium; Safari и Firefox берут размытие и блик. */
const LQ = `<svg class="lq-defs" aria-hidden="true" focusable="false"><filter id="lq" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.014" numOctaves="2" result="n"/><feGaussianBlur in="n" stdDeviation="2" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="18" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;

const STATUS = `<div class="status" aria-hidden="true"><span>9:41</span><span><svg viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.3-1.4A10.4 10.4 0 0 0 8 .4 10.4 10.4 0 0 0 .7 3.3L2 4.7a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.4l1.3-1.4A6.6 6.6 0 0 0 8 4a6.6 6.6 0 0 0-4.7 1.9l1.3 1.4C5.5 6.4 6.7 5.9 8 5.9Zm0 3.6c.4 0 .8.2 1.1.4L8 11.6 6.9 9.9c.3-.2.7-.4 1.1-.4Z"/></svg><svg viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2.2" fill="currentColor"/><path d="M25 4.4v4.2c.8-.3 1.4-1.1 1.4-2.1s-.6-1.8-1.4-2.1Z" fill="currentColor" fill-opacity=".45"/></svg></span></div>`;

/* ── Данные для скриптов ──────────────────────────────────────────────── */
function appData(l) {
  return {
    lang: l, ui: pick(UI, l), img: IMG, rate: D.RATE, rateDefault: 19.5, terms: TERMS(l),
    ruUrl: href("ru", "app"), uzUrl: href("uz", "app"),
    zk: D.ZK.map((z) => ({ ...z, due: pick(z.due, l), addr: pick(z.addr, l) })),
    cls: pick(D.CLS, l), districts: pick(D.DISTRICTS, l), stats: D.STATS, statsDate: pick(D.STATS_DATE, l),
    devs: D.DEVS, phones: D.CONTACT.phones, hours: pick(D.CONTACT.hours, l), addr: pick(D.CONTACT.addr, l),
    tg: D.CONTACT.tg, ig: D.CONTACT.ig, yt: D.CONTACT.yt, site: D.CONTACT.site,
    wd: l === "ru" ? ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] : ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"],
    mon: l === "ru" ? ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"] : ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"],
  };
}
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

/* ── Приложение ───────────────────────────────────────────────────────── */
function appPage(l) {
  const t = T(l);
  const data = appData(l);
  const missing = [...new Set([...APP_JS.matchAll(/\bU\.(\w+)/g)].map((m) => m[1]))].filter((k) => !(k in data.ui));
  if (missing.length) throw new Error(`нет подписей: ${missing.join(", ")}`);
  const tabs = [["home", "home", t("Главная", "Asosiy")], ["catalog", "build", t("ЖК", "TJM")], ["map", "map", t("Карта", "Xarita")], ["fav", "heart", t("Избранное", "Sevimli")], ["more", "user", t("Профиль", "Profil")]];
  const jump = [
    ["catalog", t("Новостройки и фильтры", "Yangi binolar va filtrlar")], ["zk", t("Карточка ЖК", "TJM kartochkasi")], ["book", t("Запись на показ", "Ko‘rishga yozilish")],
    ["podbor", t("Бесплатный подбор", "Bepul tanlov")], ["mortgage", t("Ипотека", "Ipoteka")], ["map", t("Карта", "Xarita")], ["stats", t("Цены по районам", "Tuman narxlari")], ["push", t("Уведомление", "Bildirishnoma")],
  ];
  const diff = [
    [t("Есть на iPhone", "iPhone’da bor"), t("Сейчас приложение DomTut только для Android, последнее обновление 31.01.2024.", "Hozir DomTut ilovasi faqat Android uchun, oxirgi yangilanish 31.01.2024.")],
    [t("Путь до заявки", "Arizagacha yo‘l"), t("ЖК, квартира, ипотека, запись на показ: каждый шаг ведёт к заявке менеджеру.", "TJM, kvartira, ipoteka, ko‘rishga yozilish: har bir qadam menejerga arizaga olib boradi.")],
    [t("Человек возвращается сам", "Odam o‘zi qaytadi"), t("Избранное, сравнение и уведомления о новых ЖК и снижении цены.", "Sevimlilar, solishtirish va yangi TJM hamda narx tushishi haqida bildirishnomalar.")],
    [t("Ваши данные", "Sizning ma’lumotlaringiz"), t("Цены по районам и бесплатный подбор, которые уже есть на domtut.uz.", "domtut.uz’da allaqachon bor tuman narxlari va bepul tanlov.")],
  ];
  return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="theme-color" content="#f3f6fb"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><title>${t("Приложение DomTut · макет DevUz Studio", "DomTut ilovasi · DevUz Studio maketi")}</title><meta name="description" content="${t("Макет приложения DomTut для iPhone и Android: новостройки Ташкента, карта, ипотека, запись на показ.", "DomTut ilovasi maketi: Toshkent yangi binolari, xarita, ipoteka, ko‘rishga yozilish.")}"><link rel="icon" type="image/png" href="${IMG}/icon-192.png"><link rel="apple-touch-icon" href="${IMG}/apple-180.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${FONTS}">@@A@@</head><body>
<div class="stage">
<aside class="side l">
<div class="brand">${logo("", "DomTut")}</div>
<h1>${t("Новое приложение DomTut для iPhone и Android", "iPhone va Android uchun yangi DomTut ilovasi")}</h1>
<p>${t("Макет от DevUz Studio. Всё нажимается: найдите ЖК, сравните цену с районом, посчитайте ипотеку и запишитесь на показ.", "DevUz Studio maketi. Hammasi bosiladi: TJM toping, narxni tuman bilan solishtiring, ipotekani hisoblang va ko‘rishga yoziling.")}</p>
<div class="jump">${jump.map(([k, n]) => `<button type="button" data-jump="${k}">${n}</button>`).join("")}</div>
<a class="back-site" href="${href(l)}#prilozhenie">${ic("back")}${t("К сайту", "Saytga")}</a>
</aside>
<div class="phone-wrap"><div class="phone">
<span class="btn-side l" style="top:18%;height:4.5%" aria-hidden="true"></span><span class="btn-side l" style="top:26%;height:8.5%" aria-hidden="true"></span><span class="btn-side l" style="top:36.5%;height:8.5%" aria-hidden="true"></span><span class="btn-side r" style="top:29%;height:13%" aria-hidden="true"></span>
<div class="bezel"><div class="screen" id="screen">
<div class="app" id="app">
<div class="views" id="views"><noscript><p style="padding:96px 24px">${t("Для макета нужен JavaScript.", "Maket uchun JavaScript kerak.")}</p></noscript></div>
<nav class="tabs" id="tabs" role="tablist">${tabs.map(([k, i, n]) => `<button type="button" role="tab" data-tab="${k}">${ic(i)}<span>${n}</span>${k === "fav" ? '<span class="dot num" style="display:none"></span>' : ""}</button>`).join("")}</nav>
<div class="sheet-bg" id="sheet-bg"></div><div class="sheet" id="sheet" role="dialog" aria-modal="true"></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<div class="splash" id="splash" aria-hidden="true"><svg><use href="#dt-mark"/></svg><b>DomTut</b><small>${t("макет · DevUz Studio", "maket · DevUz Studio")}</small></div>
</div>
${STATUS}<span class="island" aria-hidden="true"></span><span class="home-bar" aria-hidden="true"></span><span class="glare" aria-hidden="true"></span>
</div></div></div></div>
<aside class="side r">
<b style="font-size:18px">${t("Что нового", "Nima yangi")}</b>
<ul class="diff">${diff.map(([a, b], i) => `<li><i>${i + 1}</i><div><b>${a}</b>${b}</div></li>`).join("")}</ul>
<p class="legal">${t("Макет принадлежит DevUz Studio. ЖК, цены и статистика взяты с domtut.uz 14.10.2026.", "Maket DevUz Studio’ga tegishli. TJMlar, narxlar va statistika domtut.uz’dan 14.10.2026 da olingan.")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("Условия использования макета", "Maketdan foydalanish shartlari")}</a></p>
</aside>
</div>
${SPRITE}
<script>window.DT=${json(data)};</script>
@@K@@
</body></html>`;
}

/* ── Сайт ─────────────────────────────────────────────────────────────── */
const NUM = (l) => [
  [D.COUNTS.novo, T(l)("новостроек", "yangi bino")],
  [D.COUNTS.sale, T(l)("объявлений о продаже", "sotuv e’loni")],
  [D.COUNTS.rent, T(l)("квартир в аренду", "ijara kvartirasi")],
  [D.COUNTS.since, T(l)("работаем с этого года", "shu yildan ishlaymiz")],
];
const ours = (l) => `<span class="ours">${T(l)("Предложение DevUz Studio", "DevUz Studio taklifi")}</span>`;
const head = (kicker, h, lead, anim = "up") => `<div class="sec-head rv a-${anim}"><span class="kicker"><i></i>${kicker}</span><h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>`;
const zkOf = (id) => D.ZK.find((z) => z.id === id);
const priceOf = (l, z) => {
  const m = Math.min(...z.rooms.map((r) => r[2]));
  if (Number.isFinite(m)) return T(l)("от ", "") + (m >= 1000 ? String(Math.round(m / 100) / 10).replace(".", ",") + T(l)(" млрд сум", " mlrd so‘m dan") : grp(m) + T(l)(" млн сум", " mln so‘m dan"));
  if (z.m2) return T(l)(`от ${String(z.m2).replace(".", ",")} млн сум за м²`, `m² uchun ${String(z.m2).replace(".", ",")} mln so‘m dan`);
  return T(l)("цена по запросу", "narx so‘rov bo‘yicha");
};

function introHtml(l) {
  const t = T(l);
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  const data = { back: LOGO.back, front: LOGO.front, house: LOGO.house, heart: HEART, word: LOGO.word, tag: LOGO.tag };
  return `<div class="intro" id="intro" role="presentation">
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t("макет для DomTut", "DomTut uchun maket")}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<canvas class="dt-cv" aria-hidden="true" data-logo="${esc(JSON.stringify(data))}"></canvas>
<div class="dt-cap"><b>${t("Новостройки Ташкента", "Toshkent yangi binolari")}</b><span>${t("сайт и приложение", "sayt va ilova")}</span></div>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish")}</button>
</div>`;
}

function heroBlock(l) {
  const t = T(l);
  return `<section class="hero" id="hero" data-tone="sky">
<div class="hero-bg" aria-hidden="true"><div class="hb-img" data-par="0.35"><img src="${IMG}/hero.webp" srcset="${IMG}/hero-s.webp 860w, ${IMG}/hero.webp 1718w" sizes="100vw" alt="" fetchpriority="high"></div><div class="hb-shade"></div></div>
<div class="hero-float" aria-hidden="true"><div class="hf hf1" data-par="-0.18"><img src="${IMG}/center-one-0-s.webp" alt="" loading="lazy"></div><div class="hf hf2" data-par="-0.3"><img src="${IMG}/mirador-1-s.webp" alt="" loading="lazy"></div></div>
<div class="wrap hero-in">
<p class="kicker light"><i></i>${t("Единый портал новостроек Ташкента", "Toshkent yangi binolarining yagona portali")}</p>
<h1 class="h-title">${t("Ваш дом <em>тут</em>", "Uyingiz <em>shu yerda</em>")}</h1>
<p class="lead">${t("Все новостройки Ташкента с ценами за м², ипотекой и рассрочкой. Специалист DomTut бесплатно подберёт квартиру. Теперь и в приложении для iPhone и Android.", "Toshkentning barcha yangi binolari: m² narxi, ipoteka va muddatli to‘lov bilan. DomTut mutaxassisi kvartirani bepul tanlab beradi. Endi iPhone va Android ilovasida ham.")}</p>
<form class="find glass" id="find" autocomplete="off">
<div class="f-tabs" role="tablist"><button type="button" class="on" data-ft="buy">${t("Купить", "Sotib olish")}</button><button type="button" data-ft="new">${t("Новостройки", "Yangi binolar")}</button><button type="button" data-ft="rent">${t("Снять", "Ijaraga olish")}</button></div>
<div class="f-row">
<label class="f-f"><span>${t("Комнат", "Xonalar")}</span><select name="rooms"><option value="0">${t("Любое", "Har qanday")}</option><option value="1">1</option><option value="2">2</option><option value="3">3+</option></select></label>
<label class="f-f"><span>${t("Район", "Tuman")}</span><select name="district"><option value="">${t("Весь Ташкент", "Butun Toshkent")}</option>${Object.entries(D.DISTRICTS).map(([k, v]) => `<option value="${k}">${pick(v, l)}</option>`).join("")}</select></label>
<label class="f-f"><span>${t("Бюджет до", "Byudjet")}</span><select name="max"><option value="0">${t("Любой", "Har qanday")}</option><option value="30000">30 000 $</option><option value="50000">50 000 $</option><option value="80000">80 000 $</option></select></label>
<button class="btn btn-pri f-go shim" type="submit">${ic("search")}<span>${t("Найти в приложении", "Ilovada topish")}</span></button>
</div>
</form>
<div class="nums">${NUM(l).map(([n, w], i) => `<div class="n"><b class="num" data-count="${n}"${i === 3 ? ' data-plain="1"' : ""}>${i === 3 ? n : grp(n)}</b><span>${w}</span></div>`).join("")}</div>
<p class="src light">${t("Счётчики с главной domtut.uz на 14.10.2026.", "Hisoblagichlar domtut.uz bosh sahifasidan, 14.10.2026.")}</p>
</div>
<div class="hero-scroll" aria-hidden="true"><i></i></div>
</section>`;
}

/* Путь покупателя: слева шаги, справа телефон, экран меняется по прокрутке. */
function storyBlock(l) {
  const t = T(l);
  const steps = [
    ["search", t("Нашёл", "Topdi"), t("494 ЖК, фильтр по району, комнатам и бюджету", "494 TJM, tuman, xona va byudjet bo‘yicha filtr"), t("Каталог и карта: цена «от» сразу на карточке, класс, срок сдачи, рассрочка. Как на domtut.uz, только в кармане.", "Katalog va xarita: «dan» narxi darhol kartochkada, sinf, topshirish muddati, muddatli to‘lov. domtut.uz’dagidek, faqat cho‘ntakda.")],
    ["chart", t("Сравнил", "Solishtirdi"), t("Цена ЖК рядом со средней по району", "TJM narxi tuman o‘rtachasi yonida"), t("Ваша статистика цен за м² по районам встаёт прямо в карточку ЖК. Человек видит, дорого это или нет, и не уходит считать на другой сайт.", "Tumanlar bo‘yicha m² narxi statistikangiz to‘g‘ridan-to‘g‘ri TJM kartochkasiga tushadi. Odam qimmatmi yoki yo‘qmi ko‘radi va boshqa saytga hisoblashga ketmaydi.")],
    ["calc", t("Посчитал", "Hisobladi"), t("Ипотека: платёж в месяц за минуту", "Ipoteka: oylik to‘lov bir daqiqada"), t("Цена квартиры подставляется сама, остаётся выбрать взнос и срок. Кнопка «Хочу ипотеку» отдаёт заявку специалисту.", "Kvartira narxi o‘zi qo‘yiladi, boshlang‘ich to‘lov va muddatni tanlash qoladi. «Ipoteka kerak» tugmasi arizani mutaxassisga beradi.")],
    ["cal", t("Записался", "Yozildi"), t("Показ в офисе продаж или по видео", "Sotuv ofisida yoki video orqali ko‘rish"), t("День, время, имя и телефон, и заявка у менеджера. Запись остаётся в календаре телефона, и человек приходит.", "Kun, vaqt, ism va telefon, ariza menejerda. Yozuv telefon kalendarida qoladi va odam keladi.")],
  ];
  const z = zkOf("mirador");
  const scr = [
    `<div class="ps ps0"><div class="ps-bar">${ic("search")}<span>${t("Мирабадский · 2 комнаты", "Mirobod · 2 xona")}</span></div>${["mirador", "mirabad", "center"].map((id) => { const x = zkOf(id); return `<div class="ps-card"><img src="${IMG}/${x.photo}-0-s.webp" alt="" loading="lazy"><div><b>${x.name}</b><small>${priceOf(l, x)}</small></div></div>`; }).join("")}</div>`,
    `<div class="ps ps1"><img class="ps-hero" src="${IMG}/${z.photo}-1-s.webp" alt="" loading="lazy"><div class="ps-in"><b>${z.name}</b><small>${t("Средняя цена за м², Мирабадский", "m² o‘rtacha narxi, Mirobod")}</small>${[["comfort", 1517], ["business", 2164], ["premium", 3073]].map(([k, v]) => `<div class="ps-bar2${k === "business" ? " me" : ""}"><span>${pick(D.CLS[k], l)}</span><i style="--w:${(v / 3073).toFixed(3)}"></i><b>${grp(v)} $</b></div>`).join("")}</div></div>`,
    `<div class="ps ps2"><div class="ps-donut"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="46"/><circle cx="60" cy="60" r="46" class="a" pathLength="100"/></svg><div><small>${t("в месяц", "oyiga")}</small><b>${t("около 9,3 млн", "taxminan 9,3 mln")}</b></div></div><div class="ps-rows"><p><span>${t("Цена", "Narx")}</span><b>${t("985 млн сум", "985 mln so‘m")}</b></p><p><span>${t("Взнос", "Boshlang‘ich")}</span><b>30%</b></p><p><span>${t("Срок", "Muddat")}</span><b>${t("15 лет", "15 yil")}</b></p></div></div>`,
    `<div class="ps ps3"><div class="ps-ok"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34"/><path d="m24 41 11 11 22-24"/></svg></div><b>${t("Вы записаны на показ", "Ko‘rishga yozildingiz")}</b><small>${z.name} · ${t("Сб, 10:00", "Sh, 10:00")}</small><div class="ps-cal">${ic("cal")}<span>${t("Добавлено в календарь", "Kalendarga qo‘shildi")}</span></div></div>`,
  ];
  return `<section class="story" id="put" data-tone="ice">
<div class="wrap">${head(t("Путь покупателя", "Xaridor yo‘li"), t("От поиска до показа за четыре касания", "Qidiruvdan ko‘rishgacha to‘rt bosishda"), t("Листайте: справа экран приложения, слева то, что в эту секунду делает покупатель.", "Aylantiring: o‘ngda ilova ekrani, chapda xaridor shu soniyada nima qilyapti."))}
<div class="st">
<div class="st-steps">${steps.map(([i, k, h, p], n) => `<article class="st-step" data-step="${n}"><span class="st-n num">0${n + 1}</span><div><p class="st-k">${ic(i)}${k}</p><h3>${h}</h3><p>${p}</p></div></article>`).join("")}</div>
<div class="st-phone-col"><div class="st-sticky">
<div class="st-city" aria-hidden="true"><svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMax slice"><g class="c3" data-par="0.06"><path d="M0 300V190h40v-40h30v60h40v-90h50v90h30v-50h40v50h50v-120h40v120h40v-70h50v70h40v-40h50v40h40v-60h50v160z"/></g><g class="c2" data-par="0.12"><path d="M0 300V230h60v-50h40v50h70v-80h60v80h50v-30h60v30h60v-60h50v60h60v-40h40v40h50v70z"/></g></svg></div>
<div class="mini-phone"><div class="mp-scr">${scr.join("")}</div><span class="mp-island"></span></div>
<div class="st-dots">${steps.map((_, n) => `<i data-d="${n}"></i>`).join("")}</div>
</div></div>
</div>
</div>
</section>`;
}

function bentoBlock(l) {
  const t = T(l);
  const st = D.STATS.find((s) => s.d === "mirabad");
  const mx = Math.max(...st.rooms);
  return `<section id="servisy" data-tone="paper"><div class="wrap">
${head(t("Что уже есть у DomTut", "DomTut’da nima bor"), t("Больше, чем лента объявлений", "E’lonlar lentasidan ko‘proq"), t("Всё ниже уже работает на domtut.uz. В новом сайте и приложении это выходит на первый план.", "Quyidagilarning hammasi domtut.uz’da allaqachon ishlaydi. Yangi sayt va ilovada ular birinchi o‘ringa chiqadi."))}
<div class="bento">
<a class="bc b-big spot rv a-rise" href="#prilozhenie" data-jump="catalog"><div class="bc-photo"><img src="${IMG}/tashwelll-2-s.webp" alt="" loading="lazy"></div><div class="bc-in"><span class="bc-i">${ic("build")}</span><h3>${t("494 новостройки в одном месте", "494 yangi bino bir joyda")}</h3><p>${t("Класс, срок сдачи, цена за м², рассрочка и ипотека на каждой карточке.", "Har bir kartochkada sinf, topshirish muddati, m² narxi, muddatli to‘lov va ipoteka.")}</p><span class="bc-more">${t("Открыть каталог", "Katalogni ochish")}${ic("arrow")}</span></div></a>
<a class="bc spot rv a-rise" href="#ceny" style="--d:80ms"><span class="bc-i">${ic("chart")}</span><h3>${t("Цены по районам каждый месяц", "Har oy tumanlar bo‘yicha narxlar")}</h3><div class="bc-cols">${st.rooms.map((p, i) => `<div><i style="--h:${(p / mx).toFixed(3)}"></i><small>${i + 1}${t("-к", " x")}</small></div>`).join("")}</div><p class="bc-s">${t("Мирабадский, средняя цена квартиры, на 30.09.2026", "Mirobod, kvartiraning o‘rtacha narxi, 30.09.2026")}</p></a>
<a class="bc spot rv a-rise" href="#prilozhenie" data-jump="podbor" style="--d:160ms"><span class="bc-i">${ic("spark")}</span><h3>${t("Бесплатный подбор", "Bepul tanlov")}</h3><p>${t("Специалист DomTut подбирает квартиру под бюджет и район. Человеку не нужно листать сотни вариантов.", "DomTut mutaxassisi kvartirani byudjet va tumanga qarab tanlaydi. Odamga yuzlab variantlarni varaqlash shart emas.")}</p></a>
<a class="bc spot rv a-rise" href="#prilozhenie" data-jump="mortgage" style="--d:80ms"><span class="bc-i">${ic("calc")}</span><h3>${t("Ипотека и рассрочка", "Ipoteka va muddatli to‘lov")}</h3><p>${t("Калькулятор и ЖК, где застройщик даёт ипотеку или рассрочку.", "Kalkulyator va quruvchi ipoteka yoki muddatli to‘lov beradigan TJMlar.")}</p></a>
<a class="bc spot rv a-rise" href="#prilozhenie" data-jump="map" style="--d:160ms"><span class="bc-i">${ic("metro")}</span><h3>${t("Карта и метро", "Xarita va metro")}</h3><p>${t("Поиск на карте и по станциям метро: рядом с работой, парком или родными.", "Xaritada va metro bekatlari bo‘yicha qidiruv: ish, park yoki yaqinlar yonida.")}</p></a>
<div class="bc b-wide spot rv a-rise" style="--d:240ms"><span class="bc-i">${ic("shield")}</span><h3>${t("Проверенные застройщики", "Tekshirilgan quruvchilar")}</h3><div class="devs-row">${D.DEVS.map(([n, c]) => `<span class="dv"><b>${n}</b><small>${grp(c)} ${t("предложений", "taklif")}</small></span>`).join("")}</div></div>
</div>
</div>
<div class="mq" aria-hidden="true"><div class="mq-row">${[0, 1].map(() => `<div class="mq-set">${Object.values(D.DISTRICTS).map((v) => `<span>${pick(v, l)}</span>`).join("")}</div>`).join("")}</div></div>
</section>`;
}

function zkBlock(l) {
  const t = T(l);
  const ids = ["center", "mirador", "dcasa", "venetsiya", "mezon", "afsona", "mavera", "tashwell"];
  return `<section id="novostroyki" data-tone="paper"><div class="wrap">
${head(t("Популярные новостройки", "Mashhur yangi binolar"), t("ЖК, которые смотрят на DomTut", "DomTut’da ko‘riladigan TJMlar"), t("Данные и рендеры с domtut.uz. Нажмите на ЖК, и он откроется в приложении ниже.", "Ma’lumotlar va renderlar domtut.uz’dan. TJMni bosing, u quyidagi ilovada ochiladi."))}
</div>
<div class="zk-rail" id="zk-rail">${ids.map((id, i) => { const z = zkOf(id); return `<a class="zk rv a-rise" style="--d:${(i % 4) * 70}ms" href="#prilozhenie" data-zk="${z.id}"><div class="zk-img"><img src="${IMG}/${z.photo}-0-s.webp" srcset="${IMG}/${z.photo}-0-s.webp 640w, ${IMG}/${z.photo}-0.webp 1080w" sizes="(max-width: 700px) 78vw, 360px" alt="${esc(z.name)}" loading="lazy" decoding="async"></div><div class="zk-b"><span class="zk-c c-${z.cls}">${pick(D.CLS[z.cls], l)}</span><h3>${z.name}</h3><p>${esc(z.dev)} · ${pick(z.due, l)}</p><b class="num">${priceOf(l, z)}</b></div></a>`; }).join("")}</div>
<div class="wrap rail-nav"><button type="button" class="rn" data-rail="-1" aria-label="${t("Назад", "Orqaga")}">${ic("back")}</button><button type="button" class="rn" data-rail="1" aria-label="${t("Вперёд", "Oldinga")}">${ic("chev")}</button></div>
</section>`;
}

function statsBlock(l) {
  const t = T(l);
  return `<section id="ceny" data-tone="ink" class="dark"><div class="wrap">
${head(t("Статистика DomTut", "DomTut statistikasi"), t("Сколько стоит квартира в вашем районе", "Tumaningizda kvartira qancha turadi"), t("Средние цены на 30.09.2026 по данным domtut.uz. В приложении эта статистика встаёт в карточку каждого ЖК.", "domtut.uz ma’lumotlari bo‘yicha 30.09.2026 holatiga o‘rtacha narxlar. Ilovada bu statistika har bir TJM kartochkasiga tushadi."))}
<div class="stx rv a-up">
<div class="stx-tabs" role="tablist">${D.STATS.map((s, i) => `<button type="button" role="tab" class="${i === 1 ? "on" : ""}" data-st="${i}">${pick(D.DISTRICTS[s.d], l)}</button>`).join("")}</div>
<div class="stx-body">
<div class="stx-rooms">${[0, 1, 2].map((i) => `<div class="sr"><small>${t(`${i + 1}-комнатная`, `${i + 1} xonali`)}</small><b class="num" data-r="${i}"></b><span class="sr-bar"><i data-rb="${i}"></i></span></div>`).join("")}</div>
<div class="stx-m2"><p class="stx-h">${t("Цена за м²", "m² narxi")}</p>${["comfort", "business", "premium", "resale"].map((k) => `<div class="sm"><span>${k === "resale" ? t("Вторичка", "Ikkilamchi") : pick(D.CLS[k], l)}</span><i><em data-mb="${k}"></em></i><b class="num" data-m="${k}"></b></div>`).join("")}</div>
</div>
</div>
<script type="application/json" id="stx-data">${json(D.STATS)}</script>
</div></section>`;
}

function appBlock(l) {
  const t = T(l);
  const jump = [["home", "home", t("Главная", "Asosiy")], ["catalog", "build", t("Новостройки", "Yangi binolar")], ["zk", "doc", t("Карточка ЖК", "TJM kartochkasi")], ["book", "cal", t("Запись на показ", "Ko‘rishga yozilish")], ["podbor", "spark", t("Подбор", "Tanlov")], ["mortgage", "calc", t("Ипотека", "Ipoteka")], ["map", "map", t("Карта", "Xarita")], ["push", "bell", t("Уведомление", "Bildirishnoma")]];
  return `<section id="prilozhenie" data-tone="ice" class="appsec"><div class="wrap">
<div class="ap-grid">
<div class="ap-text">
${head(t("Приложение DomTut", "DomTut ilovasi"), t("Пощупайте приложение прямо здесь", "Ilovani shu yerda sinab ko‘ring"), t("Это не картинка: внутри айфона работает макет приложения. Откройте ЖК, сравните, посчитайте ипотеку и дойдите до записи на показ.", "Bu rasm emas: iPhone ichida ilova maketi ishlaydi. TJMni oching, solishtiring, ipotekani hisoblang va ko‘rishga yozilishgacha boring."))}
<div class="ap-jump">${jump.map(([k, i, n]) => `<button type="button" data-jump="${k}">${ic(i)}<span>${n}</span></button>`).join("")}</div>
<div class="ap-act"><a class="btn btn-pri shim" id="ap-full" href="${href(l, "app")}" data-full>${ic("full")}<span>${t("Во весь экран", "To‘liq ekranda")}</span></a><span class="ap-note">${t("На телефоне откроется на весь экран, как настоящее приложение.", "Telefonda haqiqiy ilova kabi to‘liq ekranda ochiladi.")}</span></div>
<div class="store-row"><span class="store">${ic("app")}<span><small>${t("сейчас", "hozir")}</small>Google Play · 4,1 ★</span></span><span class="store new">${ic("app")}<span><small>${t("будет", "bo‘ladi")}</small>App Store + Google Play</span></span></div>
<p class="src">${t("Нынешнее приложение DomTut в Google Play: 4,1 ★, 19 отзывов, обновлено 31.01.2024. Для iPhone приложения нет.", "Hozirgi DomTut ilovasi Google Play’da: 4,1 ★, 19 ta sharh, 31.01.2024 da yangilangan. iPhone uchun ilova yo‘q.")}</p>
</div>
<div class="ap-dev" id="ap-dev">
<div class="dev-glow" aria-hidden="true"></div>
<div class="iph" id="iph"><div class="iph-in"><span class="ibtn l" style="top:18%;height:4.5%" aria-hidden="true"></span><span class="ibtn l" style="top:26%;height:8.5%" aria-hidden="true"></span><span class="ibtn l" style="top:36.5%;height:8.5%" aria-hidden="true"></span><span class="ibtn r" style="top:29%;height:13%" aria-hidden="true"></span>
<div class="ibz"><div class="iscr"><iframe id="app-frame" title="${t("Приложение DomTut", "DomTut ilovasi")}" data-src="${href(l, "app")}?embed=1" loading="lazy" allow="clipboard-write; web-share"></iframe><span class="iisl" aria-hidden="true"></span></div></div></div>
<button type="button" class="iph-x glass" id="iph-x" aria-label="${t("Свернуть", "Yig‘ish")}">${ic("shrink")}<span>${t("Свернуть", "Yig‘ish")}</span></button>
</div>
</div>
</div>
</div></section>`;
}

/* Предложение DevUz: почему сейчас, что взяли у конкурентов, конструктор. */
function offerBlock(l) {
  const t = T(l);
  const comp = [
    ["Urbo", t("Сохранённый поиск с пушем, пуш о снижении цены, сравнение ЖК. 880 ЖК, iOS и Android.", "Push bilan saqlangan qidiruv, narx tushishi haqida push, TJM solishtirish. 880 TJM, iOS va Android.")],
    ["Uysot", t("Запись на просмотр в приложении, чат. 100 тыс.+ скачиваний, 4,7 ★.", "Ilovada ko‘rishga yozilish, chat. 100 ming+ yuklab olish, 4,7 ★.")],
    ["Joymee", t("Поиск на карте, оплата Click и Payme внутри приложения. 4,8 ★ при 24,6 тыс. отзывов.", "Xaritada qidiruv, ilova ichida Click va Payme to‘lovi. 24,6 ming sharhda 4,8 ★.")],
    ["Krisha.kz", t("Подписка на поиск и аналитика цены: в Казахстане так держат 10 млн+ скачиваний.", "Qidiruvga obuna va narx tahlili: Qozog‘istonda shunday qilib 10 mln+ yuklab olishni ushlab turishadi.")],
    [t("Циан", "Cian"), t("Ипотека в карточке: одна анкета сразу в несколько банков.", "Kartochkadagi ipoteka: bitta anketa birdaniga bir nechta bankka.")],
    ["Bayut", t("Отметка проверенных объявлений и планировки с видеотурами.", "Tekshirilgan e’lonlar belgisi va video-turli rejalar.")],
  ];
  const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}"><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}${a.star ? `<em class="star">${t("часто берут", "ko‘p olishadi")}</em>` : ""}</b><small>${a[l].e}</small><small class="who">${a[l].who}</small></span><span class="kit-p num">+${usd(a.price)}</span></label>`;
  return `<section id="predlozhenie" data-tone="paper" class="offer"><div class="wrap">
${head(ours(l), t("Почему приложение нужно сейчас", "Nega ilova hozir kerak"), t("Покупатель квартиры ищет с телефона. У DomTut больше данных, чем у других каталогов новостроек, а приложение отстало.", "Kvartira xaridori telefondan qidiradi. DomTut’da boshqa yangi bino kataloglaridan ko‘proq ma’lumot bor, ilova esa ortda qolgan."))}
<div class="why">
<div class="w-card rv a-up"><b class="num">0</b><p>${t("приложений DomTut в App Store: владельцам iPhone ставить нечего", "App Store’da DomTut ilovasi yo‘q: iPhone egalariga o‘rnatadigan narsa yo‘q")}</p></div>
<div class="w-card rv a-up" style="--d:80ms"><b class="num">31.01.2024</b><p>${t("последнее обновление приложения для Android, в отзывах жалобы на вылеты и вход", "Android ilovasining oxirgi yangilanishi, sharhlarda ishdan chiqish va kirish haqida shikoyatlar")}</p></div>
<div class="w-card rv a-up" style="--d:160ms"><b class="num">${t("4,7 и 4,8 ★", "4,7 va 4,8 ★")}</b><p>${t("у Uysot и Joymee, 100 тыс.+ скачиваний у каждого: покупатель уже привык к приложению", "Uysot va Joymee’da, har birida 100 ming+ yuklab olish: xaridor ilovaga allaqachon o‘rgangan")}</p></div>
</div>
<p class="src">${t("Google Play и App Store на 14.10.2026, источники в исследовании.", "Google Play va App Store, 14.10.2026, manbalar tadqiqotda.")}</p>
<h3 class="cmp-h rv a-up">${t("Что взяли у сильных площадок", "Kuchli maydonlardan nima oldik")}</h3>
<div class="comp">${comp.map(([n, p], i) => `<div class="cp rv a-up" style="--d:${(i % 3) * 70}ms"><b>${n}</b><p>${p}</p></div>`).join("")}</div>

<div class="kit" id="konstruktor">
<div class="kit-list">
<div class="kit-base"><div><span class="kb-tag">${t("Базовый пакет", "Asosiy paket")}</span><b>${KIT[l].t}</b><p>${KIT[l].d}</p></div><div class="kb-p"><s class="num">${usd(KIT.price)}</s><b class="num">${usd(KIT.promo)}</b><small>${t("48 часов", "48 soat")}</small></div></div>
<h3 class="kit-g">${t("Допы: включайте то, что нужно", "Qo‘shimchalar: keraklisini yoqing")}</h3>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side">
<div class="kit-total beam" id="kit-total">
<div class="timer" id="timer"><span>${t("Предложение действует", "Taklif amal qiladi")}</span><b class="num" id="tm">48:00:00</b></div>
<div class="kt-line"><span>${t("Сайт и приложение", "Sayt va ilova")}</span><span class="num"><s>${usd(KIT.price)}</s> ${usd(KIT.promo)}</span></div>
<div class="kt-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kit-n">0</span></span><span class="num" id="kit-add">0 $</span></div>
<div class="kt-sum"><small>${t("Итого по предложению", "Taklif bo‘yicha jami")}</small><b class="num" id="kit-sum">${usd(KIT.promo)}</b><small class="kt-was">${t("Обычная цена", "Odatiy narx")}: <span class="num" id="kit-was">${usd(KIT.price)}</span></small></div>
<a class="btn btn-white" id="kit-go" href="https://t.me/Devuz_studio_bot?start=domtut">${ic("tg")}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
<button type="button" class="copy" id="kit-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button>
</div>
<p class="src">${t(`Сайт и приложение без допов: 1 000 $ вместо 4 800 $, если договор подписан в течение 48 часов после того, как макет пришёл вам. Потом цена обычная. Допы по обычной цене, со всеми допами ${usd(ALL)} без предложения. 4 800 $: середина рынка Ташкента для портала с приложением: у студий приложение для iPhone и Android стоит от 45 млн сум, сайт-каталог от 17,5 млн.`, `Qo‘shimchalarsiz sayt va ilova: maket sizga kelganidan keyin 48 soat ichida shartnoma imzolansa, 4 800 $ o‘rniga 1 000 $. Keyin narx odatiy. Qo‘shimchalar odatiy narxda, barchasi bilan taklifsiz ${usd(ALL)}. 4 800 $: ilovali portal uchun Toshkent bozorining o‘rtasi: studiyalarda iPhone va Android ilovasi 45 mln so‘mdan, sayt-katalog 17,5 mln dan.`)}</p>
</div>
</div>
</div></section>`;
}

function shell(l, body) {
  const t = T(l);
  const other = l === "ru" ? "uz" : "ru";
  const nav = [["#novostroyki", t("Новостройки", "Yangi binolar")], ["#ceny", t("Цены", "Narxlar")], ["#prilozhenie", t("Приложение", "Ilova")], ["#predlozhenie", t("Предложение", "Taklif")]];
  const kit = { base: KIT.price, promo: KIT.promo, lang: l, items: ADDONS.map((a) => ({ id: a.id, t: a[l].t, p: a.price })), copied: t("Скопировано", "Nusxalandi"), head: t("Состав сайта и приложения DomTut из конструктора:", "Konstruktordan DomTut sayti va ilovasi tarkibi:"), baseName: KIT[l].t, total: t("Итого по предложению", "Taklif bo‘yicha jami"), ended: t("Срок предложения прошёл", "Taklif muddati tugadi"), d: t("д", "k") };
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t("DomTut: новостройки Ташкента, сайт и приложение · макет", "DomTut: Toshkent yangi binolari, sayt va ilova · maket")}</title>
<meta name="description" content="${t("Макет нового сайта и приложения DomTut: 494 новостройки Ташкента, цены по районам, ипотека, бесплатный подбор и запись на показ.", "DomTut yangi sayti va ilovasi maketi: Toshkentning 494 yangi binosi, tuman narxlari, ipoteka, bepul tanlov va ko‘rishga yozilish.")}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#071226">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="alternate" hreflang="${other}" href="${href(other)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
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
<a class="logo" href="${href(l)}">${logo("lg", "DomTut")}</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
<div class="top-r"><div class="lang"><a href="${href("ru")}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz")}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>
<a class="btn btn-pri btn-sm top-cta" href="#prilozhenie" data-jump="home">${ic("app")}<span>${t("Открыть приложение", "Ilovani ochish")}</span></a></div>
</div></header>
<main id="main">
${body}
</main>
<footer class="foot dark" data-tone="ink"><div class="wrap">
<div class="cols">
<div>${logo("f-logo", "DomTut")}<p>${t("Новостройки и квартиры в Ташкенте от застройщиков и риелторов. Проект компании Webnow.", "Toshkentdagi quruvchi va rieltorlardan yangi binolar va kvartiralar. Webnow kompaniyasi loyihasi.")}</p></div>
<div><b>${t("Отдел рекламы", "Reklama bo‘limi")}</b><ul>${D.CONTACT.phones.map(([p, v]) => `<li><a href="tel:${p}">${v}</a></li>`).join("")}<li>${pick(D.CONTACT.hours, l)}</li><li><a href="${D.CONTACT.tg}">Telegram @domtut_admin</a></li></ul></div>
<div><b>${t("Адрес", "Manzil")}</b><ul><li>${pick(D.CONTACT.addr, l)}</li><li><a href="${D.CONTACT.ig}">Instagram</a> · <a href="${D.CONTACT.yt}">YouTube</a></li></ul></div>
</div>
<div class="rights"><span>${t("Это макет: так могут выглядеть новый сайт и приложение DomTut. ЖК, цены, статистика, рендеры и контакты взяты с domtut.uz 14.10.2026. Блоки с пометкой «Предложение DevUz Studio» придумали мы. Откуда данные и снимки, сказано рядом с блоками.", "Bu maket: yangi DomTut sayti va ilovasi shunday ko‘rinishi mumkin. TJMlar, narxlar, statistika, renderlar va kontaktlar domtut.uz’dan 14.10.2026 da olingan. «DevUz Studio taklifi» belgili bloklarni biz o‘ylab topdik. Ma’lumot va suratlar qayerdan, bloklar yonida aytilgan.")}</span><span>${t("Макет принадлежит DevUz Studio. Использовать его можно только по договору:", "Maket DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari")}</a></span></div>
</div></footer>
<div class="dock glass" id="dock"><a class="btn btn-pri" href="#prilozhenie" data-jump="home">${ic("app")}<span>${t("Открыть приложение", "Ilovani ochish")}</span></a><a class="btn btn-ghost dock-k" href="#konstruktor" aria-label="${t("Цена", "Narx")}"><b class="num" id="dock-sum">${usd(KIT.promo)}</b></a></div>
<script type="application/json" id="kit-data">${json(kit)}</script>
<script>
${INTRO}</script>
@@J@@
</body>
</html>`;
}

function site(l) {
  return shell(l, [heroBlock(l), storyBlock(l), bentoBlock(l), zkBlock(l), statsBlock(l), appBlock(l), offerBlock(l)].join("\n"));
}

const out = { "": site("ru"), uz: site("uz"), app: appPage("ru"), "uz/app": appPage("uz") };
const parts = { S: `<style>${SITE_CSS}</style>`, J: `<script>\n${SITE_JS}</script>`, A: `<style>${APP_CSS}</style>`, K: `<script>\n${APP_JS}</script>` };
const fill = (page) => Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), page);

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "domtut.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(8), fill(v).length);
