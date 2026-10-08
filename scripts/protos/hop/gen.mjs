import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { ADDONS, BASE as KIT_BASE, BLOCKS, GROUPS } from "./plan.mjs";

/*
 * Прототип HOP.UZ (hop.uz): доска бесплатных объявлений по всему
 * Узбекистану. Собран на каркасе ПК Весты и Aipply Academy (scripts/protos/
 * pkvesta, scripts/protos/aipply): шапка, промо DevUz, конструктор, «было /
 * стало», сцена при прокрутке по движку Engelberg v2. Пять страниц на
 * русском: у hop.uz русский главный. Исследование и конкуренты —
 * docs/research/hop.md, снимки — SOURCES.md, заходы 21st.dev — 21ST.md.
 *
 * Всё о HOP.UZ — только с hop.uz и их группы в Telegram (снято 08.10.2026):
 * 14 категорий и их разделы (catalog.json — их же меню), 13 городов,
 * бесплатное размещение, «Безопасная сделка» с арбитражем и возвратом на
 * карту, аукционы с продлением на 3 минуты, бизнес-тарифы и их цены в
 * сумах, сторис на 7 дней, приложение APK с колесом фортуны, бонус за первое
 * объявление, советы поддержки. Числа объявлений и пользователей на сайте
 * нет, поэтому нет и здесь. Фраза из их описания «крупнейшая доска» не
 * взята: её не проверить. Наши дополнения подписаны «Предложение DevUz
 * Studio».
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/hop";
const CSS = readFileSync(DIR + "style.css", "utf8").replace(/\n/g, "").replace(/__IMG__/g, IMG);
const INTRO = readFileSync(DIR + "intro.js", "utf8");
const STORY = readFileSync(DIR + "story.js", "utf8");
const JS_MAIN = readFileSync(DIR + "client.js", "utf8");
const CATALOG = JSON.parse(readFileSync(DIR + "catalog.json", "utf8"));
const [QR_N, QR_D] = readFileSync(DIR + "qr.txt", "utf8").trim().split("|");
const BASE = "__PROTO_BASE__";
const TERMS = "https://devuz.studio/ru/mockup-terms";
const FONTS = "https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Manrope:wght@400;700&display=swap";

const usd = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
const sp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (p = "") => BASE + (p ? "/" + p : "");

/* ── Факты с их сайта ─────────────────────────────────────────────────── */
const F = {
  name: "HOP.UZ",
  tg: "https://t.me/hop_uzb",
  ig: "https://instagram.com/hop.uz/",
  fb: "https://facebook.com/hop.uzb",
  apk: "https://hop.uz/storage/app/hop-app.apk",
  site: "https://hop.uz",
};
const hop = (p = "") => F.site + "/" + p;

/* 14 категорий — главное меню hop.uz, по порядку. n — разделов внутри. */
const CATS = [
  { s: "transport", n: "Транспорт", ic: "car", k: 10 },
  { s: "nedvizhimost", n: "Недвижимость", ic: "home", k: 9 },
  { s: "rabota", n: "Работа", ic: "case", k: 2, note: "вакансии и резюме" },
  { s: "detskie-tovary", n: "Детские товары", ic: "kid", k: 13 },
  { s: "uslugi", n: "Услуги", ic: "tool", k: 22 },
  { s: "elektronika", n: "Электроника", ic: "phone", k: 14 },
  { s: "zhivotnye", n: "Животные", ic: "paw", k: 12 },
  { s: "dom-sad-dacha", n: "Дом, сад, дача", ic: "sofa", k: 7 },
  { s: "biznes-i-oborudovanie", n: "Бизнес и оборудование", ic: "biz", k: 5 },
  { s: "turizm-otdyh-sport-hobbi", n: "Туризм, отдых, спорт, хобби", ic: "tent", k: 4 },
  { s: "moda-i-stil", n: "Мода и стиль", ic: "shirt", k: 9 },
  { s: "krasota-i-zdorove", n: "Красота и здоровье", ic: "drop", k: 8 },
  { s: "remont-stroitelstvo-instrumenty", n: "Ремонт, строительство, инструменты", ic: "hammer", k: 5 },
  { s: "otdam-darom-obmen", n: "Отдам даром, обмен", ic: "gift", k: 0, note: "бесплатно или на обмен" },
];
const ALL_SECTIONS = CATALOG.length;

/* 13 городов из их выбора города; x, y — место на схеме по долготе и широте. */
const CITIES = [
  { n: "Нукус", u: "respublika-karakalpakstan/nukus", x: 7.6, y: 11.7 },
  { n: "Хива", u: "horezmskaya-oblast/hiva", x: 12.8, y: 28.9 },
  { n: "Бухара", u: "buharskaya-oblast/buhara", x: 40.1, y: 54.4, lf: true },
  { n: "Навои", u: "navoijskaya-oblast/navoi", x: 46.8, y: 49.2, up: true },
  { n: "Самарканд", u: "samarkandskaya-oblast/samarkand", x: 57.7, y: 56.3 },
  { n: "Карши", u: "kashkadarinskaya-oblast/karshi", x: 49.6, y: 68.9 },
  { n: "Термез", u: "surhandarinskaya-oblast/termez", x: 59.9, y: 94.9 },
  { n: "Джизак", u: "dzhizakskaya-oblast/dzhizak", x: 63.7, y: 49.5, up: true },
  { n: "Сырдарья", u: "syrdarinskaya-oblast/syrdarya", x: 70.9, y: 43, dn: true },
  { n: "Ташкент", u: "tashkentskaya-oblast/tashkent", x: 74.1, y: 30.2, big: true, lf: true },
  { n: "Наманган", u: "namanganskaya-oblast/namangan", x: 90.8, y: 35.1, up: true },
  { n: "Андижан", u: "andizhanskaya-oblast/andizhan", x: 95.4, y: 38.4, dn: true },
  { n: "Фергана", u: "ferganskaya-oblast/fergana", x: 91.6, y: 44.8, dn: true },
];

/* Тарифы — страница «Бизнес тарифы» на hop.uz: цена сейчас, старая цена, срок. */
const PLANS = [
  { id: "start", n: "Начальный", d: "Базовый тариф с начальным функционалом", now: 5000, old: 20000, per: "за 30 дней", li: ["Магазин", "Свой адрес магазина", "Расширенная аналитика"] },
  { id: "max", n: "Максимум", d: "Максимальный тариф со всем функционалом", now: 10000, old: 30000, per: "за 30 дней", top: true, li: ["Магазин и персональные страницы", "Свой адрес магазина", "Скрытие конкурентов в объявлениях", "Расширенная аналитика", "Сторис на 7 дней, фото и видео", "Автопродление объявлений", "100 000 позиций в магазине"] },
  { id: "try", n: "На пробу", d: "Все возможности на один день. Подключается только один раз", now: 1000, old: 5000, per: "за 1 день", li: ["Магазин и персональные страницы", "Свой адрес магазина", "Скрытие конкурентов в объявлениях", "Расширенная аналитика", "Сторис с фото и видео"] },
];

/* ── Логотип HOP!: координаты — пиксели их файла логотипа (571 × 190). ── */
const LG = {
  h: "M13 20h31v58h61V20h31v145h-31v-59H44v59H13z",
  o: "M156 92.5a79 77.5 0 1 0 158 0a79 77.5 0 1 0-158 0zM190 92.5a45 48 0 1 0 90 0a45 48 0 1 0-90 0z",
  p: "M333 20h64a50.5 50.5 0 0 1 0 101h-33v44h-31zM364 47v47h26a23.5 23.5 0 0 0 0-47z",
  eye: "M190 92.5a45 48 0 1 0 90 0a45 48 0 1 0-90 0z",
};
const BAR = `<line x1="547" y1="25" x2="482" y2="121" stroke-width="32" stroke-linecap="round"/>`;
const DOT = `<circle cx="445.5" cy="150.5" r="18"/>`;
const logo = (cls = "", fill = "#ff0d33") => `<svg class="${cls}" viewBox="0 0 571 190" aria-hidden="true" focusable="false"><g fill="${fill}" stroke="${fill}" fill-rule="evenodd"><path d="${LG.h}" stroke="none"/><path d="${LG.o}" stroke="none"/><path d="${LG.p}" stroke="none"/>${BAR}${DOT.replace("/>", ' stroke="none"/>')}</g></svg>`;

/* Логотип DevUz Studio для заставки — тот же, что в промо на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZMARK = `<svg class="dz-mark" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

/* Иконки — контуры 24×24, по смыслу. */
const I = (dd, w = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${dd}</svg>`;
const ICON = {
  tg: I('<path d="M21 4 3 11l6 2.5M21 4l-3.5 16-8.5-6.5M21 4 9 13.5V19l3-3.5"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>', 2),
  arrows: I('<path d="m9 7-5 5 5 5M15 7l5 5-5 5"/>', 2),
  check: I('<path d="m5 12 5 5 9-10"/>', 2),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', 2),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  shield: I('<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
  timer: I('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6M12 2v3"/>'),
  gavel: I('<path d="m14 4 6 6M11 7l6 6M12.5 5.5l-5 5 3 3 5-5zM9 12l-6 6 2 2 6-6M13 21h8"/>'),
  free: I('<path d="M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8M2 7h20v5H2zM12 21V7M12 7S10.5 3 8 3a2 2 0 0 0 0 4M12 7s1.5-4 4-4a2 2 0 0 1 0 4"/>'),
  chat: I('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>'),
  card: I('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>'),
  back: I('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
  star: I('<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>'),
  store: I('<path d="M3 9 5 4h14l2 5M3 9v11h18V9M3 9h18"/><path d="M9 20v-6h6v6"/>'),
  eyeoff: I('<path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a16 16 0 0 1-2.6 3.3M6.6 6.6C4.3 8.1 3 12 3 12s4 6 9 6a8.6 8.6 0 0 0 4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  infinity: I('<path d="M7 9a3 3 0 1 0 0 6c3 0 7-6 10-6a3 3 0 1 1 0 6c-3 0-7-6-10-6"/>'),
  repeat: I('<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>'),
  link: I('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  chart: I('<path d="M3 20h18"/><path d="M6 16v-4M11 16V8M16 16v-6M21 16V5"/>'),
  play: I('<path d="M8 5v14l11-7z"/>', 2),
  bot: I('<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 14h.01M15 14h.01M2 13v3M22 13v3"/>'),
  apple: I('<path d="M12 7c1-2 3-3 4.5-3 0 2-1.5 3.5-3 3.6M16.5 8c-1.6 0-2.6.9-4.5.9S9 8 7.5 8C5.5 8 3.5 10 3.5 13c0 4 3 8 5 8 1.3 0 2-.7 3.5-.7s2.2.7 3.5.7c2 0 4.5-4 5-6-2-.8-3-2.5-3-4.3 0-1.4.7-2.6 2-3.4-.9-1.1-2-1.3-3-1.3z"/>'),
  android: I('<path d="M5 10h14v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zM5 10a7 7 0 0 1 14 0M8 4 7 2.5M16 4l1-1.5M9 7h.01M15 7h.01M8 19v3M16 19v3M2.5 11v5M21.5 11v5"/>'),
  sms: I('<rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M9 7h6M9 11h6M11 18h2"/><path d="M3 3l18 18"/>'),
  ig: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>'),
  fire: I('<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8a7 7 0 0 0 7 7z"/><path d="M12 22a3 3 0 0 1-3-3c0-2 3-4 3-4s3 2 3 4a3 3 0 0 1-3 3z"/>'),
  /* Категории */
  car: I('<path d="M5 16v-5l2-5h10l2 5v5"/><path d="M3 16h18v3H3zM7 19v1.5M17 19v1.5M5 11h14"/><circle cx="7.5" cy="13.5" r=".6"/><circle cx="16.5" cy="13.5" r=".6"/>'),
  home: I('<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  case: I('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M11 12v2h2v-2"/>'),
  kid: I('<path d="M4 10h11a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM15 10V5l3-1"/><circle cx="7" cy="19" r="2"/><circle cx="14" cy="19" r="2"/>'),
  tool: I('<path d="M14.5 6.5a4 4 0 0 0 4.9 4.9l-8.8 8.8a2 2 0 0 1-2.8-2.8l8.8-8.8a4 4 0 0 0-4.9-4.9l2.5 2.5-.5 2-2 .5z"/>'),
  phone: I('<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>'),
  paw: I('<circle cx="6" cy="10" r="2"/><circle cx="10" cy="5.5" r="2"/><circle cx="14" cy="5.5" r="2"/><circle cx="18" cy="10" r="2"/><path d="M12 11c-3 0-6 4.5-6 7a2.5 2.5 0 0 0 3.5 2.2c1.6-.6 3.4-.6 5 0A2.5 2.5 0 0 0 18 18c0-2.5-3-7-6-7z"/>'),
  sofa: I('<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2zM5 18v2M19 18v2"/>'),
  biz: I('<path d="M3 21V11l5 3V11l5 3V7h3l1 14"/><path d="M3 21h18M18 7V3h2v18"/>'),
  tent: I('<path d="M3 20 12 4l9 16zM12 4v16M8.5 20 12 13l3.5 7"/>'),
  shirt: I('<path d="m8 3-5 3 2 5 2-1v11h10V10l2 1 2-5-5-3a4 4 0 0 1-8 0z"/>'),
  drop: I('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>'),
  hammer: I('<path d="m14 5 5 5-3 3-5-5zM11 8 3 16l3 3 8-8"/><path d="M14 5l2-2 5 5-2 2"/>'),
  gift: I('<path d="M20 12v8H4v-8M2 8h20v4H2zM12 20V8M12 8S10.5 4 8 4a2 2 0 0 0 0 4M12 8s1.5-4 4-4a2 2 0 0 1 0 4"/>'),
};
const PAGES = ["", "razmestit", "sdelka", "biznes", "plan"];
const NAMES = { "": "Главная", razmestit: "Разместить", sdelka: "Сделка и аукционы", biznes: "Бизнесу", plan: "Что дальше" };

/* Велосипед кодом: пример объявления в сцене и на странице «Разместить». */
const BIKE = `<svg class="bike" viewBox="0 0 200 130" aria-hidden="true" focusable="false"><g fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><circle cx="48" cy="88" r="32" stroke="#1d1416"/><circle cx="152" cy="88" r="32" stroke="#1d1416"/><path d="M48 88 80 44h56l16 44M80 44l26 44h46M106 88l30-44M74 34h18M136 44l-6-18h16" stroke="#ff0d33"/></g><circle cx="106" cy="88" r="7" fill="#1d1416"/></svg>`;

/* ── Конструктор: плашка на каждой странице ───────────────────────────── */
function kdRow(a, def = true) {
  return `<label class="kd-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="${(a.needs || []).join(" ")}"${def ? " data-def checked" : ""}><span class="sw" aria-hidden="true"></span><span class="kd-t"><b>${a.ru.t}${a.star ? "<em>обязательно</em>" : ""}</b>${a.ru.e ? `<small>${a.ru.e}</small>` : ""}</span><span class="kd-p num">+${usd(a.price)}</span></label>`;
}
function dockHtml(path) {
  const group = (title, side, rows) => (rows.length ? `<section class="kd-g"><h3><span>${title}</span>${side}</h3>${rows.join("")}</section>` : "");
  const here = ADDONS.filter((a) => a.where === path);
  const all = ADDONS.filter((a) => a.where === "all");
  const others = [...new Set(ADDONS.map((a) => a.where))].filter((w) => w !== "all" && w !== path);
  return `<button class="kd-pill" type="button" id="kd-pill" aria-expanded="false" aria-controls="kd"><i aria-hidden="true"></i>Конструктор<b class="num" id="kd-pill-sum"></b></button>
<aside class="kd" id="kd" role="dialog" aria-label="Конструктор сайта" hidden>
<header class="kd-h"><div><p class="kd-k">Конструктор · предложение DevUz Studio</p><h2>Что войдёт в новый сайт HOP.UZ</h2><p class="kd-sub">Выключите блок, и он пропадёт со страницы. Включите, и он появится снова. Итог пересчитывается сразу.</p></div><button class="kd-x" type="button" id="kd-x" aria-label="Свернуть">×</button></header>
<div class="kd-list">
${group("На этой странице", "", here.map((a) => kdRow(a)))}
${group("На всех страницах", "", all.map((a) => kdRow(a)))}
${others.map((w) => group(NAMES[w], `<a href="${href(w)}">открыть →</a>`, ADDONS.filter((a) => a.where === w).map((a) => kdRow(a)))).join("")}
${group("Сверх сайта", `<a href="${href("plan")}#konstruktor">что это →</a>`, BLOCKS.map((b) => kdRow({ ...b, ru: { t: b.ru.t } }, !!b.star)))}
</div>
<footer class="kd-f">
<div class="kd-line"><span>Сайт</span><span class="num">${usd(KIT_BASE.price)}</span></div>
<div class="kd-line"><span>Допы · <span id="kd-n"></span></span><span class="num" id="kd-add"></span></div>
<div class="kd-line kd-tot"><span>Итого разово</span><b class="num" id="kd-sum"></b></div>
<a class="btn btn-main" href="https://t.me/Devuz_studio_bot?start=hop">${ICON.tg}Обсудить с DevUz Studio</a>
<div class="kd-btns"><button class="copy" type="button" id="kd-copy">Скопировать состав</button><button class="copy" type="button" id="kd-reset">Сбросить</button></div>
</footer>
</aside>`;
}

/* ── Заставка: промо DevUz Studio → HOP! → влёт в букву «O» ─────────── */
function introHtml() {
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  return `<div class="intro" id="intro" role="presentation">
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZMARK}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">прототип для HOP.UZ</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<svg class="mk-svg" aria-hidden="true" focusable="false"><g class="mk-cam"><path class="mk-veil" fill-rule="evenodd" d="M-9000 -9000H9000V9000H-9000Z ${LG.eye}"/><path class="mk-slit" d="${LG.eye}"/><path class="mk-p" d="${LG.h}" fill="#ff0d33" style="opacity:0"/><path class="mk-p" d="${LG.o}" fill="#ff0d33" fill-rule="evenodd" style="opacity:0"/><path class="mk-p" d="${LG.p}" fill="#ff0d33" fill-rule="evenodd" style="opacity:0"/><g class="mk-p" stroke="#ff0d33" style="opacity:0">${BAR}</g><g class="mk-p" fill="#ff0d33" style="opacity:0">${DOT}</g></g></svg>
<div class="mk-cap"><b>HOP.UZ</b><span>бесплатные объявления по всему Узбекистану</span></div>
<button type="button" class="in-skip" id="in-skip">Пропустить</button>
</div>`;
}

/* Фильтр преломления для «жидкого стекла»: шум смещает то, что под
   стеклом. Понимает только Chromium, остальным хватает размытия. */
const LQ = `<svg class="lq-defs" aria-hidden="true" focusable="false"><filter id="lq" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.019" numOctaves="2" result="n"/><feGaussianBlur in="n" stdDeviation="2.5" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="22" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;

const TG_TEXT = "Здравствуйте! Хочу разместить объявление на HOP.UZ.";
const tgBtn = (cls, label, text = TG_TEXT) => `<a class="btn ${cls}" href="${F.tg}" data-tg="${esc(text)}">${ICON.tg}${label}</a>`;
const head = (kicker, h, lead, side = "", anim = "rise") => `<div class="sec-head rv a-${anim}"><div>${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h2 style="margin-top:12px">${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>${side}</div>`;
const OURS = `<span class="ours">Предложение DevUz Studio</span>`;

/* ── Каркас ───────────────────────────────────────────────────────────── */
function shell(path, meta, body) {
  const isHome = path === "";
  const nav = ["razmestit", "sdelka", "biznes", "plan"];
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#140709">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=${isHome ? "false" : "true"};try{if(sessionStorage.getItem('hop-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}try{var k=JSON.parse(localStorage.getItem('hop-kit-v1')||'{}');if(k.intro===false)off=true;if(k.glass===false){r.classList.add('k-no-glass');r.classList.add('k-no-motion')}if(k.story===false)r.classList.add('k-no-story')}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: F.name, url: F.site, inLanguage: ["ru", "uz"], sameAs: [F.tg, F.ig, F.fb] })}</script>
</head>
<body class="${isHome ? "home" : ""}" data-page="${path}">
${LQ}
${isHome ? introHtml() : ""}
<a class="skip" href="#main">К содержанию</a>
<header class="top"><div class="wrap">
<a class="logo" href="${href()}" aria-label="HOP.UZ, на главную">${logo()}<span class="vh">HOP.UZ</span></a>
<nav class="nav" aria-label="Разделы">${nav.map((p) => `<a href="${href(p)}"${p === path ? ' aria-current="page"' : ""}>${NAMES[p]}</a>`).join("")}</nav>
<div class="top-r"><a class="top-tg" href="${F.tg}">${ICON.tg}<span>@hop_uzb</span></a>
<a class="btn btn-red btn-sm top-cta" href="${href("razmestit")}">Разместить</a></div>
</div></header>
<main id="main">
${body}
</main>
<footer><div class="wrap">
<div class="cols">
<div><span class="f-logo">${logo("", "#ff0d33")}</span><ul><li>Бесплатные объявления Узбекистана: товары, услуги, работа, недвижимость, транспорт</li><li>13 городов, 14 категорий</li></ul></div>
<div><b>На связи</b><ul><li><a href="${F.tg}">Telegram: @hop_uzb</a></li><li><a href="${F.ig}">Instagram</a> · <a href="${F.fb}">Facebook</a></li><li><a href="${F.apk}">Приложение для Android (APK)</a></li><li><a href="${hop("support")}">Служба поддержки</a> · <a href="${hop("rules")}">Правила сервиса</a></li></ul></div>
<div><b>Разделы</b><ul>${["", ...nav].map((p) => `<li><a href="${href(p)}">${NAMES[p]}</a></li>`).join("")}</ul></div>
</div>
<div class="rights"><span>Это прототип: так может выглядеть новый сайт HOP.UZ. Всё о HOP.UZ, логотип, категории, города, тарифы и правила взяты с hop.uz (08.10.2026). Объявления в примерах придуманы, это показ устройства страницы. Блоки с пометкой «Предложение DevUz Studio» придумали мы, на сайте их пока нет. Откуда изображения: <a href="${href("plan")}#foto">${NAMES.plan}</a>.</span><span>Прототип принадлежит DevUz Studio. Использовать его можно только по договору: <a href="${TERMS}">условия использования</a></span></div>
</div></footer>
${path === "razmestit" ? "" : `<div class="dock" id="dock">${tgBtn("btn-red shim", "Разместить через Telegram")}</div>`}
${dockHtml(path)}
${isHome ? `<script type="application/json" id="cats">${JSON.stringify(packCatalog()).replace(/</g, "\\u003c")}</script>` : ""}
<script type="application/json" id="i18n">${JSON.stringify(Ls()).replace(/</g, "\\u003c")}</script>
${isHome ? `<script>\n${INTRO}</script>\n<script>\n${STORY}</script>` : ""}
<script>
${JS_MAIN}</script>
</body>
</html>`;
}

/* Каталог для подсказок: [номер родителя, кусок адреса, название]. */
function packCatalog() {
  const at = new Map();
  return CATALOG.map(([path, name], i) => {
    at.set(path, i);
    const cut = path.lastIndexOf("/");
    return cut < 0 ? [-1, path, name] : [at.get(path.slice(0, cut)) ?? -1, path.slice(cut + 1), name];
  });
}

/* Строки для скрипта страницы. */
function Ls() {
  return {
    tg: F.tg,
    kitBase: KIT_BASE.price,
    kitN: "{n} шт.",
    kitTg: "Состав нового сайта HOP.UZ из конструктора:",
    kitBaseName: KIT_BASE.ru.t,
    kitTotal: "Итого",
    copied: "Скопировано",
    sent: "Текст скопирован. Открываем Telegram HOP.UZ: вставьте его в чат и отправьте.",
    qNone: "Такого раздела нет. Попробуйте другое слово или откройте категорию ниже.",
    qTop: "Категория",
    aucStart: "Сделайте ставку. В последние 3 минуты ставка продлевает торги",
    aucBid: "Сделать ставку",
    aucAgain: "Ещё раз",
    aucYou: "Ваша ставка",
    aucRival: "Участник 2 перебил ставку",
    aucExt: "Ставка в последние 3 минуты: +3:00 к таймеру",
    aucLead: "Ваша ставка наивысшая",
    aucLost: "Вашу ставку перебили. Время ещё есть",
    aucWon: "Лот зарезервирован за вами",
    aucGone: "Лот ушёл другому участнику",
    aucNone: "Торги закончились без ставок",
    msgHead: "Здравствуйте! Хочу разместить объявление на HOP.UZ.",
    fCat: "Категория",
    fTitle: "Название",
    fPrice: "Цена",
    fCity: "Город",
    fState: "Состояние",
    fSafe: "Готов продать через «Безопасную сделку»",
    fHot: "Срочно",
    fName: "Имя",
    fPhone: "Телефон",
    fText: "Описание",
    sum: "сум",
    deal: "договорная",
    empty: "не указано",
    pvTitle: "Название объявления",
    pvCity: "Город",
    pvCat: "Категория",
    need: "Выберите категорию и город, напишите название и телефон: без них объявление не опубликовать.",
    planHead: "Здравствуйте! Хочу подключить тариф «{p}» на HOP.UZ.",
  };
}

/* ── Первый экран ── */
function heroBlock() {
  const tw = (w, i, em) => `<span class="tw${em ? " em" : ""}" style="--i:${i}">${w}</span>`;
  const h1 = ["Бесплатные", "объявления", "по", "всему", "Узбекистану"];
  const rot = ["квартиру", "машину", "работу", "мастера на час", "телефон", "щенка"];
  const quick = [["nedvizhimost/kvartiry", "Квартиры"], ["transport/legkovye-avtomobili", "Легковые автомобили"], ["rabota/vakansii", "Вакансии"], ["elektronika/telefony-i-planshety", "Телефоны и планшеты"], ["uslugi/master-na-chas", "Мастер на час"], ["otdam-darom-obmen", "Отдам даром"]];
  const has = (p) => CATALOG.some(([u]) => u === p);
  for (const [p] of quick) if (!has(p)) throw new Error(`нет раздела ${p} в каталоге hop.uz`);
  const fl = (cls, ic, b, s, dep) => `<div class="fl glass lq ${cls}" data-depth="${dep}"><span class="ic">${ICON[ic]}</span><div><b>${b}</b><small>${s}</small></div></div>`;
  return `<section class="hero" id="hero" aria-label="HOP.UZ">
<div class="hero-dots" aria-hidden="true"></div>
<div class="hero-art hi" style="--d:120ms" aria-hidden="true">
<div class="plane" data-depth="0.5" data-base="rotate(-8deg)"><span class="plane-ring"></span>${logo("plane-logo", "#fff")}</div>
<div class="tile t1" data-depth="1.4" data-base="rotate(-12deg)">${ICON.car}</div>
<div class="tile t2" data-depth="2" data-base="rotate(10deg)">${ICON.home}</div>
<div class="tile t3" data-depth="1.1" data-base="rotate(6deg)">${ICON.phone}</div>
<div class="tile t4" data-depth="2.4" data-base="rotate(-6deg)">${ICON.paw}</div>
${fl("a", "shield", "Безопасная сделка", "деньги у HOP.UZ, пока вы не проверите товар", 2.2)}
${fl("b", "timer", `<span class="num">02:59</span>`, "ставка в конце торгов продлевает их на 3 минуты", 1.6)}
${fl("c", "free", "Бесплатно", "разместить объявление с фото и ценой", 2.8)}
</div>
<div class="hero-in"><div class="wrap">
<div class="hero-txt">
<span class="kicker hi" style="color:var(--on2)"><i></i>HOP.UZ · 13 городов · 14 категорий</span>
<h1 style="margin-top:16px">${h1.map((w, i) => tw(w, i, i >= 2)).join(" ")}</h1>
<p class="lead hi" style="--d:200ms">Здесь продают, покупают и находят <span class="rot" aria-hidden="true">${rot.map((w, k) => `<span${k === 0 ? ' class="on"' : ""}>${w}</span>`).join("")}</span><span class="vh">${rot.join(", ")}</span></p>
<form class="qs glass lq hi" id="q-form" role="search" style="--d:260ms"><label class="vh" for="q">Что ищете</label>${ICON.search}<input id="q" type="search" autocomplete="off" placeholder="Например, велосипед" data-ph="Например, велосипед|Например, кондиционер|Например, репетитор|Например, гараж" maxlength="60"><button class="btn btn-red btn-sm" type="submit">Найти</button></form>
<ul class="q-out" id="q-out" hidden aria-live="polite"></ul>
<p class="q-hint hi" style="--d:300ms" data-addon="search">Подсказки ищут по ${sp(ALL_SECTIONS)} разделам каталога HOP.UZ. ${OURS}</p>
<div class="chips hi" style="--d:320ms">${quick.map(([p, n]) => `<a href="${hop(p)}">${n}</a>`).join("")}</div>
<div class="cta hero-go hi" style="--d:380ms"><a class="btn btn-red shim" href="${href("razmestit")}">Разместить объявление${ICON.arrow}</a><a class="btn btn-ghost" href="${href("sdelka")}">${ICON.shield}Безопасная сделка</a></div>
</div>
</div></div>
</section>
<div class="mq" aria-hidden="true"><div class="mq-row">${[0, 1].map(() => CATS.map((c) => `<span>${ICON[c.ic]}${c.n}</span>`).join("")).join("")}</div></div>`;
}

/* ── История «Как вещь находит покупателя» ── */
function storyBlock() {
  const END = 18;
  const CH = [[0, "HOP.UZ"], [2.4, "Разместить"], [6.3, "Найти"], [8.8, "Чат"], [11.4, "Сделка"], [14.9, "Аукцион"], [16.9, "Отзыв"]];
  const beat = (a, b, n, h, p = "", extra = "") => `<div class="beat" data-beat="${a} ${b}"><p class="ey" data-line>${n}</p><h3 data-line>${h}</h3>${p ? `<p data-line>${p}</p>` : ""}${extra}</div>`;
  const feedIc = ["car", "home", "phone", "sofa", "shirt"];
  return `<section class="story" id="story" data-addon="story" data-end="${END}" data-chapters='${JSON.stringify(CH)}' aria-label="Как вещь находит покупателя на HOP.UZ">
<div class="st-track"><div class="st-stage">
<div class="st-world" aria-hidden="true">
<div class="w-phone" style="left:140px;top:110px">
<div class="ph-scr">
<div class="ph-bar"><span>${logo("", "#ff0d33")}</span><b>Новое объявление</b></div>
<div class="ph-photo">${BIKE}<span class="ph-add">+ фото</span></div>
<div class="ph-f"><small>Название</small><p data-type="3 3.8">Детский велосипед, почти новый</p></div>
<div class="ph-f ph-cat"><small>Категория</small><p><span>Детские товары</span><span>Детский транспорт</span></p></div>
<div class="ph-f ph-city"><small>Город</small><p>${ICON.pin}Самарканд</p></div>
<div class="ph-sd"><span>${ICON.shield}Безопасная сделка</span><i></i></div>
<div class="ph-go">Опубликовать бесплатно</div>
<div class="ph-done">${ICON.check}<b>Опубликовано</b><small>Детские товары · Самарканд</small></div>
</div></div>
<div class="w-win w-feed" style="left:620px;top:90px">
<div class="wn-h"><i></i><i></i><i></i><b>hop.uz</b></div>
<div class="fd-q">${ICON.search}<span data-type="6.4 7">велосипед</span><em>${ICON.pin}Самарканд</em></div>
<div class="fd-grid">${[0, 1, 2, 3, 4, 5].map((i) => i === 1 ? `<div class="fd-c hit"><div class="fd-ph">${BIKE}</div><b>Детский велосипед</b><small>Самарканд</small><span class="fd-sd">${ICON.shield}сделка</span></div>` : `<div class="fd-c" style="--k:${i}"><div class="fd-ph sk">${ICON[feedIc[i % 5]]}</div><i></i><i class="s"></i></div>`).join("")}</div>
</div>
<div class="w-win w-chat" style="left:620px;top:570px">
<div class="wn-h"><i></i><i></i><i></i><b>Чат · Детский велосипед</b></div>
<div class="ch-b"><p class="in" style="--v:var(--b1)">Здравствуйте! Велосипед ещё продаётся?</p><p class="out" style="--v:var(--b2)">Да. Можно посмотреть сегодня вечером</p><p class="in" style="--v:var(--b3)">Беру через безопасную сделку</p><div class="ch-stars">${[0, 1, 2, 3, 4].map((k) => `<span style="--k:${k}">${ICON.star}</span>`).join("")}<small>Оцените продавца</small></div></div>
</div>
<div class="w-win w-deal" style="left:1200px;top:90px">
<div class="wn-h"><i></i><i></i><i></i><b>Безопасная сделка</b></div>
<div class="dl">
<div class="dl-n buy">${ICON.card}<small>Покупатель</small></div>
<div class="dl-n hop">${ICON.shield}<small>HOP.UZ хранит</small></div>
<div class="dl-n sell">${ICON.store}<small>Продавец</small></div>
<span class="dl-coin c1"></span><span class="dl-coin c2"></span>
<span class="dl-box">${BIKE}</span>
<span class="dl-ok">${ICON.check}Проверено</span>
</div>
<ol class="dl-st"><li style="--v:var(--coin)">Оплата защищена</li><li style="--v:var(--check)">Проверка до выплаты</li><li style="--v:var(--coin2)">Продавец получил деньги</li></ol>
</div>
<div class="w-win w-auc" style="left:1200px;top:570px">
<div class="wn-h"><i></i><i></i><i></i><b>Аукцион</b></div>
<div class="au-t"><span class="num" data-k="timer">00:20</span><em>+3:00</em></div>
<div class="au-b"><i style="--h:.35;--v:var(--bid1)"></i><i style="--h:.55;--v:var(--bid2)"></i><i class="me" style="--h:.8;--v:var(--bid3)"></i></div>
<p class="au-won">${ICON.gavel}Лот зарезервирован</p>
</div>
</div>
<div class="st-title" data-k="title"><p>HOP.UZ</p><h2>Как вещь находит покупателя</h2></div>
<div class="st-hint" data-k="hint" aria-hidden="true"><span>Листайте</span><i></i></div>
${beat(2.4, 5.6, "01 · Разместить", "Объявление бесплатно", "Фото, цена, описание, категория и город. Отметка «Безопасная сделка» говорит покупателю, что деньги будут под защитой.")}
${beat(6.3, 8.2, "02 · Найти", "Покупатель находит по категории и городу", "Пишет «велосипед», выбирает Самарканд и сразу видит ваше объявление.")}
${beat(8.8, 10.8, "03 · Договориться", "Переписка во встроенном чате", "Поддержка HOP.UZ советует общаться только в чате сервиса и никому не сообщать коды из SMS.")}
${beat(11.4, 14.3, "04 · Безопасная сделка", "Продавец получит деньги после проверки", "Оплата хранится, пока покупатель не получит и не осмотрит товар. Если что-то не так, арбитраж и возврат денег на карту.")}
${beat(14.9, 16.8, "05 · Аукцион", "Ставка в последние 3 минуты продлевает торги", "Таймер добавляет ещё 3 минуты: побеждает тот, кто предложил больше, а не тот, кто нажал последним.")}
${beat(16.9, 19.5, "06 · Отзыв", "После сделки покупатель оценивает продавца", "А вы начните с первого объявления: за первое размещение HOP.UZ начисляет бонус на кошелёк.", `<div class="cta" data-line>${tgBtn("btn-red shim", "Разместить через Telegram")}</div>`)}
<div class="st-hud"><span data-hud>01 · HOP.UZ</span><i><b data-bar></b></i><a href="#after-story">Пропустить ↓</a></div>
</div></div>
<div class="st-static"><div class="wrap">${head("Как это работает", "Как вещь находит покупателя", "", "", "rise")}<ol class="st-list">
<li><b>Разместить бесплатно</b><p>Фото, цена, описание, категория и город.</p></li>
<li><b>Покупатель находит</b><p>По категории и городу, и пишет продавцу.</p></li>
<li><b>Переписка в чате HOP.UZ</b><p>Коды из SMS никому не сообщайте.</p></li>
<li><b>Безопасная сделка</b><p>Деньги продавцу после проверки товара, при проблеме арбитраж и возврат на карту.</p></li>
<li><b>Аукцион</b><p>Ставка в последние 3 минуты продлевает торги ещё на 3 минуты.</p></li>
<li><b>Отзыв</b><p>После сделки покупатель оценивает продавца.</p></li>
</ol></div></div>
</section>
<span id="after-story"></span>`;
}

function statsBlock() {
  return `<section style="padding-bottom:0"><div class="wrap"><div class="stats rv a-rise">
<div><b class="num" data-count="14">14</b><span>категорий: от транспорта до «Отдам даром»</span></div>
<div><b class="num" data-count="${ALL_SECTIONS}">${sp(ALL_SECTIONS)}</b><span>разделов в каталоге</span></div>
<div><b class="num" data-count="13">13</b><span>городов: от Нукуса до Ферганы</span></div>
<div><b class="num" data-count="7">7</b><span>дней живут сторис магазина вместо 24 часов</span></div>
</div></div></section>`;
}

/* ── 14 категорий: бенто ── */
function catsBlock() {
  const size = { transport: "w2 red", uslugi: "h2", nedvizhimost: "h2 ink", elektronika: "w2", "remont-stroitelstvo-instrumenty": "w2", "otdam-darom-obmen": "w2 mint" };
  const motion = ["drive", "rise", "key", "pop", "slide", "rise", "key", "slide", "pop", "rise", "key", "drop", "slide", "pop"];
  return `<section id="kategorii"><div class="wrap">
${head("Каталог", "14 категорий, больше 700 разделов", "Всё, что есть в меню hop.uz. Нажмите на категорию, и откроется её страница на вашем сайте.")}
<div class="cats">${CATS.map((c, k) => `<a class="ct ${size[c.s] || ""} rv a-${motion[k]}" style="--d:${(k % 4) * 60}ms" href="${hop(c.s)}"><span class="spot" aria-hidden="true"></span><span class="ic">${ICON[c.ic]}</span><b>${c.n}</b><small>${c.k ? `${c.k} ${plural(c.k, "раздел", "раздела", "разделов")}${c.note ? ": " + c.note : ""}` : c.note}</small><span class="go" aria-hidden="true">${ICON.arrow}</span></a>`).join("")}</div>
</div></section>`;
}
function plural(n, a, b, c) {
  const m = n % 100, k = n % 10;
  return m > 10 && m < 20 ? c : k === 1 ? a : k >= 2 && k <= 4 ? b : c;
}

/* ── Безопасная сделка: стекло над параллаксом, деньги идут по шагам ── */
function dealBlock(full = true) {
  const bars = [["-8%", "14%", "54%", .16, 1.4], ["38%", "34%", "70%", .1, .8], ["-12%", "66%", "48%", .12, 1.8], ["50%", "82%", "60%", .08, 1.1]];
  return `<section class="sd" id="sdelka"><div class="sd-bg" aria-hidden="true">${bars.map(([x, y, w, o, k]) => `<i data-k="${k}" style="--x:${x};--y:${y};--w:${w};--o:${o}"></i>`).join("")}</div>
<div class="wrap"><div class="sd-in">
<div class="rv a-left"><span class="kicker"><i></i>Безопасная сделка</span><h2 style="margin-top:12px">Ваши деньги не уходят сразу продавцу</h2><p class="lead">Оплата удерживается, пока вы не получите товар, не осмотрите его и не подтвердите, что всё в порядке. Если что-то пойдёт не так, деньги вернутся на карту.</p>${full ? `<div class="cta"><a class="btn btn-white" href="${href("sdelka")}">Как это работает${ICON.arrow}</a></div>` : ""}</div>
<div class="sd-card glass lq rv a-vault"><span class="beam" aria-hidden="true"></span>
<div class="flow" aria-hidden="true"><span class="fn">${ICON.card}<small>Вы</small></span><span class="fw"><i></i></span><span class="fn hop">${ICON.shield}<small>HOP.UZ</small></span><span class="fw"><i style="animation-delay:1.4s"></i></span><span class="fn">${ICON.store}<small>Продавец</small></span></div>
<ol class="sd-steps">
<li><b>01</b><div><h3>Выберите и оплатите</h3><p>Найдите товар с пометкой «Безопасная сделка» и оплатите удобным способом.</p></div></li>
<li><b>02</b><div><h3>Получите и проверьте</h3><p>Доставка или встреча с продавцом. Процесс видно на странице заказа.</p></div></li>
<li><b>03</b><div><h3>Подтвердите и оцените</h3><p>После осмотра подтвердите получение, и продавец получит деньги. Не устроило: арбитраж и возврат.</p></div></li>
</ol></div>
</div></div></section>`;
}

/* ── Живой аукцион ── */
function auctionBlock() {
  return `<section id="aukcion" data-addon="auction"><div class="wrap"><div class="au">
<div class="rv a-left">${head(`🔥 Аукционы · ${OURS}`, "Ставка в последние 3 минуты продлевает торги", "Это правило с hop.uz: если ставку сделали меньше чем за 3 минуты до конца, таймер добавляет ещё 3 минуты. Попробуйте сами: соперник будет перебивать.", "", "rise")}
<ul class="au-rules"><li>${ICON.timer}<span>Точный таймер: сделка в указанный час</span></li><li>${ICON.repeat}<span>Ставку перебили: сообщение на почту или в мессенджер</span></li><li>${ICON.back}<span>Победитель отказался: лот предлагают второй ставке</span></li></ul></div>
<div class="au-demo rv a-tick" id="auc">
<div class="au-top"><span class="au-lot">${ICON.gavel}Лот для примера</span><span class="au-live"><i></i>идут торги</span></div>
<div class="au-clock"><b class="num" id="auc-t">00:20</b><em id="auc-ext" aria-hidden="true">+3:00</em></div>
<div class="au-bars" id="auc-bars" aria-hidden="true"></div>
<p class="au-st" id="auc-st" role="status"></p>
<button class="btn btn-red" type="button" id="auc-bid">Сделать ставку</button>
<ol class="au-log" id="auc-log"></ol>
<p class="src">Время до последних 3 минут здесь идёт быстрее, чтобы не ждать.</p>
</div>
</div></div></section>`;
}

/* ── Бизнесу: тарифы ── */
function plansBlock(full) {
  return `<div class="plans">${PLANS.map((p, k) => `<div class="pl${p.top ? " best" : ""} rv a-${["rise", "pop", "rise"][k]}" style="--d:${k * 80}ms">${p.top ? `<span class="pl-tag">Рекомендуем</span><span class="beam" aria-hidden="true"></span>` : ""}<h3>${p.n}</h3><p class="pl-d">${p.d}</p><p class="pl-p"><b class="num">${sp(p.now)}</b> сум <s class="num">${sp(p.old)}</s></p><small>${p.per}</small>${full ? `<ul>${p.li.map((x) => `<li>${ICON.check}${x}</li>`).join("")}</ul>` : ""}<a class="btn ${p.top ? "btn-red" : "btn-ghost"}" href="${F.tg}" data-plan="${p.n}">Подключить</a></div>`).join("")}</div>`;
}
function bizTeaser() {
  return `<section class="dark" id="biznes"><div class="wrap">
${head("Магазинам и бизнесу", "Своя витрина на HOP.UZ от 5 000 сум", "Магазин со своим адресом, аналитика, сторис на 7 дней. На тарифе «Максимум» рядом с вашими объявлениями не показываются чужие.", `<a class="btn btn-ghost btn-sm" href="${href("biznes")}">Все возможности ${ICON.arrow}</a>`)}
${plansBlock(false)}
</div></section>`;
}

/* ── Города ── */
function citiesBlock() {
  return `<section id="goroda"><div class="wrap">
${head("Города", "Объявления из 13 городов", "Нажмите на город, и откроются объявления рядом с ним. Схема по координатам городов, без границ.")}
<div class="geo">
<div class="map rv a-pop" aria-label="Схема: 13 городов HOP.UZ">${CITIES.map((c, k) => `<a class="city${c.big ? " big" : ""}${c.up ? " up" : ""}${c.lf ? " lf" : ""}${c.dn ? " dn" : ""}" href="${hop(c.u)}" style="--x:${c.x}%;--y:${c.y}%;--k:${k}"><i></i><span>${c.n}</span></a>`).join("")}</div>
<ul class="city-list rv a-slide">${CITIES.map((c) => `<li><a href="${hop(c.u)}">${ICON.pin}${c.n}</a></li>`).join("")}</ul>
</div>
</div></section>`;
}

/* ── Приложение: колесо фортуны и QR ── */
function appBlock() {
  const seg = 8;
  const cols = ["#ff0d33", "#fff", "#140709", "#fff", "#ff0d33", "#fff", "#140709", "#fff"];
  const R = 100;
  const wedges = Array.from({ length: seg }, (_, i) => {
    const a0 = (i / seg) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / seg) * Math.PI * 2 - Math.PI / 2;
    return `<path d="M0 0L${(Math.cos(a0) * R).toFixed(2)} ${(Math.sin(a0) * R).toFixed(2)}A${R} ${R} 0 0 1 ${(Math.cos(a1) * R).toFixed(2)} ${(Math.sin(a1) * R).toFixed(2)}z" fill="${cols[i]}"/>`;
  }).join("");
  return `<section class="app"><div class="wrap"><div class="app-in">
<div class="wheel rv a-pop" aria-hidden="true"><svg class="wheel-d" viewBox="-104 -104 208 208">${wedges}<circle r="100" fill="none" stroke="#140709" stroke-width="4"/><g transform="scale(.1) translate(-286 -92)">${logo("", "#ff0d33").replace(/<svg[^>]*>|<\/svg>/g, "")}</g></svg><svg class="wheel-hub" viewBox="-104 -104 208 208"><circle r="30" fill="#140709"/><g transform="scale(.09) translate(-286 -92)">${logo("", "#fff").replace(/<svg[^>]*>|<\/svg>/g, "")}</g></svg><span class="wheel-pin"></span></div>
<div class="rv a-slide"><span class="kicker"><i></i>Мобильное приложение</span><h2 style="margin-top:12px">Крутите колесо фортуны и выигрывайте бонусы</h2><p class="lead">В приложении HOP.UZ удобно искать и размещать объявления, а колесо фортуны даёт бонусы. Колесо здесь крутится от прокрутки страницы.</p>
<div class="app-row"><a class="btn btn-main" href="${F.apk}">${ICON.android}Скачать APK</a><div class="qr"><svg viewBox="-2 -2 ${+QR_N + 4} ${+QR_N + 4}" role="img" aria-label="QR-код: скачать приложение HOP.UZ"><rect x="-2" y="-2" width="${+QR_N + 4}" height="${+QR_N + 4}" fill="#fff"/><path d="${QR_D}" fill="#140709"/></svg><small>Наведите камеру телефона</small></div></div>
<p class="src">Сейчас приложение есть только файлом APK для Android. На iPhone его не поставить: для этого в конструкторе есть приложение с главного экрана.</p></div>
</div></div></section>`;
}

const OFFERS = [
  ["search", "Подсказки в поиске", "Человек пишет «велосипед» и сразу видит раздел «Детские велосипеды». Работает по вашему же каталогу.", "Работает в прототипе: первый экран"],
  ["gavel", "Аукцион, который объясняет себя", "Правило «+3 минуты» понятно за десять секунд, когда его можно попробовать, а не прочитать.", "Работает в прототипе"],
  ["store", "Объявление в три шага", "Категория, город и цена, карточка собирается на глазах: продавец видит объявление ещё до отправки.", "Работает в прототипе: «Разместить»"],
  ["card", "Цены в сумах и оплата Click, Payme", "На странице тарифов сейчас «Активировать за 1 ₽». Покупатель из Узбекистана платит картой Uzcard или Humo.", "Сверх сайта"],
  ["bot", "Telegram-бот и публикация в @hop_uzb", "Новые объявления по сохранённому поиску и «вашу ставку перебили». Свежие объявления сами уходят в вашу группу.", "Сверх сайта"],
  ["apple", "Приложение и для iPhone", "Сайт ставится значком на главный экран любого телефона, без магазина приложений.", "Сверх сайта"],
];
function offerBlock(title = true) {
  return `<section class="dark" id="predlozhenie"><div class="wrap">
${title ? head(OURS, "Что добавить сайту", "Этого на hop.uz пока нет. Каждое растёт из того, что у вас уже есть.") : ""}
<div class="offer">${OFFERS.map(([i, h, p, s], k) => `<div class="of rv a-${["rise", "key", "slide"][k % 3]}" style="--d:${(k % 3) * 90}ms"><span class="spot" aria-hidden="true"></span><span class="beam hov" aria-hidden="true"></span><span class="ic">${ICON[i]}</span><h3>${h}</h3><p>${p}</p><small>${s}</small></div>`).join("")}</div>
</div></section>`;
}

const finalBlock = () => `<section class="final"><div class="wrap"><div class="box rv a-pop"><div class="ripple" aria-hidden="true">${[[180, .14, 0], [300, .1, .2], [420, .08, .4], [560, .06, .6], [720, .04, .8]].map(([s, o, dl]) => `<i style="--s:${s}px;--o:${o};--dl:${dl}s"></i>`).join("")}</div>
${logo("final-logo", "#ff0d33")}
<h2>${["Продайте", "ненужное,", "найдите", "нужное"].map((w, i) => `<span class="tw" style="--i:${i}">${w}</span>`).join(" ")}</h2>
<p class="sub" style="margin-top:12px">Разместите первое объявление бесплатно: за первое размещение HOP.UZ начисляет бонус на кошелёк, его можно потратить на продвижение.</p>
<div class="cta">${tgBtn("btn-red shim", "Разместить через Telegram")}<a class="btn btn-ghost" href="${href("razmestit")}">Заполнить объявление${ICON.arrow}</a></div>
</div></div></section>`;

function phead(crumb, kicker, h1, lead) {
  return `<section class="phead"><div class="wrap">
<ol class="crumbs"><li><a href="${href()}">HOP.UZ</a></li><li aria-current="page">${crumb}</li></ol>
${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h1 style="margin-top:12px">${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}
</div></section>`;
}

/* ── Страницы ── */
function home() {
  return shell("", {
    title: "HOP.UZ · бесплатные объявления по всему Узбекистану",
    desc: "Купить, продать, найти работу и мастера: 14 категорий, 13 городов, безопасная сделка и аукционы. Размещение бесплатное.",
  }, `${heroBlock()}
${storyBlock()}
${statsBlock()}
${catsBlock()}
${dealBlock()}
${auctionBlock()}
${bizTeaser()}
${citiesBlock()}
${appBlock()}
${offerBlock()}
${finalBlock()}`);
}

function razmestit() {
  const radio = (name, vals, ic = false) => `<div class="opts">${vals.map((v) => `<label class="opt"><input type="radio" name="${name}" value="${esc(v.n || v)}"><span>${ic ? ICON[v.ic] : ""}${v.n || v}</span></label>`).join("")}</div>`;
  return shell("razmestit", {
    title: "Разместить объявление бесплатно | HOP.UZ",
    desc: "Категория, город, название и цена в три шага. Карточка объявления собирается на глазах, готовый текст уходит в Telegram HOP.UZ.",
  }, `${phead(NAMES.razmestit, "Бесплатно", "Разместить объявление", "Три шага: что продаёте, само объявление, как с вами связаться. Справа видно, как карточка будет выглядеть в ленте.")}
<section style="padding-top:0"><div class="wrap"><div class="book">
<form id="post" novalidate>
<div class="p-bar" id="p-bar" aria-hidden="true" data-addon="post"><i></i></div>
<fieldset class="step rv a-win"><h3><i>1</i>Что продаёте</h3>${radio("cat", CATS, true)}</fieldset>
<fieldset class="step rv a-win"><h3><i>2</i>Объявление</h3>
<div class="field"><label for="p-tt">Название</label><input id="p-tt" type="text" maxlength="70" placeholder="Например, детский велосипед"></div>
<div class="two"><div class="field"><label for="p-pr">Цена, сум</label><input id="p-pr" type="text" inputmode="numeric" maxlength="14" placeholder="Пусто: договорная"></div><div class="field"><span class="lbl">Состояние</span>${radio("st", ["Новое", "Б/у"])}</div></div>
<div class="field"><label for="p-tx">Описание</label><textarea id="p-tx" maxlength="600" placeholder="Что важно знать покупателю"></textarea></div>
<div class="field"><span class="lbl">Город</span>${radio("city", CITIES.map((c) => c.n))}</div>
<label class="tgl"><input type="checkbox" id="p-sd"><span class="sw" aria-hidden="true"></span><span><b>Безопасная сделка</b><small>Деньги покупателя хранятся у HOP.UZ, пока он не проверит товар</small></span></label>
<label class="tgl"><input type="checkbox" id="p-hot"><span class="sw" aria-hidden="true"></span><span><b>Срочно</b><small>По этой отметке покупатели фильтруют ленту</small></span></label>
</fieldset>
<fieldset class="step rv a-win"><h3><i>3</i>Как с вами связаться</h3>
<div class="two"><div class="field"><label for="p-nm">Имя</label><input id="p-nm" type="text" autocomplete="name" maxlength="60"></div><div class="field"><label for="p-ph">Телефон</label><input id="p-ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998" maxlength="20"></div></div>
<button class="btn btn-red shim" type="submit" style="width:100%;margin-top:16px">${ICON.tg}Отправить в Telegram HOP.UZ</button>
<p class="err" id="err" role="alert" hidden></p><p class="done" id="done" role="status" hidden></p>
<p class="src">Коды из SMS, пароли и данные карты никому не сообщайте: сотрудники HOP.UZ их никогда не спрашивают.</p></fieldset>
</form>
<aside class="sum">
<div class="panel rv a-slide" data-addon="post"><h3>Так объявление будет в ленте</h3>
<div class="pc" id="pc"><div class="pc-ph"><span id="pc-i">${ICON.gift}</span><em class="pc-hot">${ICON.fire}Срочно</em></div><div class="pc-b"><b id="pc-t">Название объявления</b><p class="pc-p num" id="pc-p">договорная</p><small><span id="pc-c">Город</span> · <span id="pc-k">Категория</span></small><span class="pc-sd">${ICON.shield}Безопасная сделка</span></div></div>
<p class="src">${OURS}</p></div>
<div class="panel rv a-slide" style="--d:80ms;margin-top:16px"><h3>Так сообщение придёт в HOP.UZ</h3><div class="msg"><div class="msg-h">${ICON.tg}Telegram · HOP.UZ</div><span id="msg"></span><time id="msg-t"></time></div>
<p class="src">Кнопка копирует текст и открывает вашу группу @hop_uzb: она указана на hop.uz. Если объявления будет принимать другой аккаунт или сам сайт, поставим его.</p></div>
<div class="panel rv a-slide bonus" style="--d:160ms;margin-top:16px">${ICON.free}<div><h3>Бонус новым продавцам</h3><p class="sub">За первое объявление HOP.UZ начисляет бонус на кошелёк. Его можно потратить на продвижение.</p></div></div>
</aside>
</div></div></section>`);
}

function sdelka() {
  const faq = (items) => `<div class="faq">${items.map(([q, a], k) => `<details class="rv a-type" style="--d:${k * 50}ms"${k === 0 ? " open" : ""}><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>`;
  return shell("sdelka", {
    title: "Безопасная сделка и аукционы | HOP.UZ",
    desc: "Деньги продавцу только после проверки товара, арбитраж и возврат на карту. Аукционы с продлением на 3 минуты за ставку в конце.",
  }, `${phead(NAMES.sdelka, "Покупать и продавать безопасно", "Безопасная сделка и аукционы", "Безопасная сделка помогает защитить ваши деньги и товар. Аукцион даёт честную рыночную цену за ограниченное время.")}
${dealBlock(false)}
<section><div class="wrap">
${head("Безопасная сделка", "Частые вопросы", "Ответы со страницы «Безопасные сделки» на hop.uz.")}
${faq([["Когда продавец получает деньги?", "После того как вы получите товар, осмотрите его и подтвердите получение в заказе. До этого момента деньги находятся под защитой."], ["Что делать, если товар не соответствует описанию?", "Не подтверждайте получение. Откройте обращение в арбитраж, приложите фотографии или видео и опишите проблему. Запрос рассмотрят по правилам сервиса."], ["Куда вернутся деньги при отмене сделки?", "При одобренном возврате деньги возвращаются на карту или другой платёжный инструмент, с которого была оплата."], ["Можно ли оставить отзыв?", "Да. После завершения сделки вы сможете оценить продавца и поделиться впечатлениями с другими покупателями."]])}
</div></section>
<section class="dark"><div class="wrap">
${head("🔥 Аукционы", "Почему аукцион лучше фиксированной цены", "Сравнение со страницы аукционов на hop.uz.")}
<div class="vs">
<div class="vs-c rv a-left"><small>Обычное объявление</small><h3>Продажа с ценой «с запасом»</h3><ul><li>Продавцы часто завышают цену заранее</li><li>Товар может висеть месяцами</li><li>Долгие переписки с торгом в чате</li></ul></div>
<div class="vs-c on rv a-slide"><small>Аукцион</small><h3>Рыночная цена за ограниченное время</h3><ul><li>Можно купить редкую вещь по выгодной цене</li><li>Точный таймер: сделка в указанный час</li><li>Видна история каждой ставки</li></ul></div>
</div>
<ol class="how">${[["Найдите лот", "Каталог и фильтры помогут найти нужную или редкую вещь."], ["Сделайте ставку", "Предложите сумму больше текущей ставки."], ["Выиграйте таймер", "Если ваша ставка останется наивысшей к концу отсчёта, лот зарезервирован за вами."], ["Безопасная оплата", "Деньги продавцу только после того, как вы получите и проверите товар."]].map(([h, p], k) => `<li class="rv a-${["rise", "key", "tick", "vault"][k]}" style="--d:${k * 70}ms"><b>0${k + 1}</b><h3>${h}</h3><p>${p}</p></li>`).join("")}</ol>
<p class="src" style="margin-top:16px">Продавцу hop.uz обещает: создать аукцион за 2 минуты, безопасную сделку, меньше несерьёзных звонков и торга.</p>
</div></section>
${auctionBlock()}
<section style="padding-top:0"><div class="wrap">
${head("Аукционы", "Частые вопросы", "")}
${faq([["Что происходит, если мою ставку перебили?", "Придёт письмо на почту или сообщение в мессенджер, если он подключён в профиле. Новую ставку можно сделать в один клик до конца таймера."], ["Как работает защита от последних секунд?", "Если ставку сделали меньше чем за 3 минуты до конца аукциона, таймер сам продлевается ещё на 3 минуты. Так борьба остаётся честной."], ["Что если победитель отказывается покупать лот?", "Право выкупа переходит участнику со второй по величине ставкой."]])}
</div></section>
<section style="padding-top:0"><div class="wrap"><div class="warn rv a-rise">${ICON.sms}<div><h3>Не передавайте коды из SMS</h3><p>Сотрудники HOP.UZ никогда не спрашивают пароли, коды подтверждения и данные карты. Не переходите по подозрительным ссылкам, не вносите предоплату незнакомым, проверяйте товар до оплаты и общайтесь только во встроенном чате.</p></div></div></div></section>
${finalBlock()}`);
}

function biznes() {
  const PERKS = [
    ["play", "Сторис на 7 дней с фото и видео", "Обычные истории удаляются через 24 часа. С тарифом «Максимум» ваши живут 7 дней."],
    ["eyeoff", "Без чужих объявлений рядом", "На страницах ваших объявлений не показываются карточки конкурентов. Покупатель смотрит только ваши предложения."],
    ["infinity", "Без ограничения магазинов и позиций", "Отдельные магазины по направлениям и сколько угодно объявлений в них."],
    ["repeat", "Автопродление и партнёрские товары", "Объявления обновляются сами. Можно добавить товары партнёров и получать вознаграждение с продажи."],
    ["link", "Свой адрес магазина", "Своя ссылка на магазин, которую удобно отправлять покупателям."],
    ["chart", "Расширенная аналитика", "Глубина просмотра, источники переходов и данные по каждой позиции."],
  ];
  return shell("biznes", {
    title: "Бизнес-тарифы: магазин, сторис, аналитика | HOP.UZ",
    desc: "Своя витрина магазина, скрытие конкурентов, сторис на 7 дней и аналитика. Тарифы от 5 000 сум за 30 дней.",
  }, `${phead(NAMES.biznes, "Бизнес тарифы", "Развивайте бизнес на HOP.UZ", "Собственная витрина магазина, чужие предложения скрыты, сторис с фото и видео, рутина на автопродлении.")}
<section style="padding-top:0"><div class="wrap">
<div class="trial rv a-pop"><span class="ic">${ICON.timer}</span><div><b>Спецпредложение для старта</b><p>Тариф «На пробу»: все возможности на один день за 1 000 сум. Доступно один раз.</p></div><a class="btn btn-red" href="${F.tg}" data-plan="На пробу">Попробовать</a></div>
${plansBlock(true)}
<p class="src" style="margin-top:12px">Цены и состав тарифов с hop.uz/tariffs, 08.10.2026. Зачёркнутая цена тоже оттуда.</p>
</div></section>
<section class="dark"><div class="wrap">
${head("Как это выглядит", "Витрина без соседей", "Включите «Скрытие конкурентов», и чужие карточки уйдут со страницы вашего объявления.")}
<div class="shop rv a-win" id="shop">
<div class="wn-h"><i></i><i></i><i></i><b>hop.uz/ваш-магазин</b></div>
<div class="shop-b">
<div class="shop-top"><span class="shop-av">${ICON.store}</span><div><b>Ваш магазин</b><small>Магазин на HOP.UZ</small></div></div>
<div class="shop-st">${["Новинки", "Скидки", "Доставка", "Отзывы"].map((s, k) => `<span style="--k:${k}"><i></i>${s}</span>`).join("")}</div>
<div class="shop-g">${["phone", "sofa", "shirt", "car"].map((i) => `<div class="sg">${ICON[i]}<i></i><i class="s"></i></div>`).join("")}</div>
<div class="shop-o"><small>Похожие у других продавцов</small><div class="shop-g">${["phone", "phone", "sofa", "car"].map((i) => `<div class="sg o">${ICON[i]}<i></i><i class="s"></i></div>`).join("")}</div></div>
</div>
<label class="tgl dark-tgl"><input type="checkbox" id="hide-rivals"><span class="sw" aria-hidden="true"></span><span><b>Скрытие конкурентов</b><small>есть в тарифах «Максимум» и «На пробу»</small></span></label>
</div>
</div></section>
<section><div class="wrap">
${head("Тариф «Максимум»", "Всё, что даёт максимальный тариф", "")}
<div class="perks">${PERKS.map(([i, h, p], k) => `<div class="pk rv a-${["rise", "key", "slide"][k % 3]}" style="--d:${(k % 3) * 70}ms"><span class="spot" aria-hidden="true"></span><span class="ic">${ICON[i]}</span><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
<div class="stories rv a-rise"><div><small>Обычные сторис</small><div class="sb"><i style="--w:.14"></i></div><b>24 часа</b></div><div><small>С тарифом «Максимум»</small><div class="sb"><i style="--w:1"></i></div><b>7 дней</b></div></div>
</div></section>
${finalBlock()}`);
}

/* Конкуренты — по исследованию docs/research/hop.md. */
const COMP_LEAD = "Смотрели OLX.uz, Uybor.uz, Avtoelon.uz, Elbozor (бывший zor.uz), BirBir, Joymee и Telegram-барахолки. Их цифры не берём: только приёмы.";
function plan() {
  const all = [...ADDONS, ...BLOCKS];
  const total = KIT_BASE.price + all.reduce((s, a) => s + a.price, 0);
  const ba = (old, nu, cap, side) => `<figure class="rv a-rise"><div class="ba-box" data-ba><img src="${IMG}/${nu}" alt="Прототип нового сайта HOP.UZ" loading="lazy"><div class="was"><img src="${IMG}/${old}" alt="hop.uz сегодня" loading="lazy"></div><span class="tag a">hop.uz сегодня</span><span class="tag b">прототип</span><div class="knob"><i>${ICON.arrows}</i></div><input type="range" min="0" max="100" value="50" aria-label="Сдвинуть шторку"></div><figcaption><span>${cap}</span><span>${side}</span></figcaption></figure>`;
  const pv = {
    pay: [["Пополнить кошелёк", "Click · Payme"], ["Тариф «Максимум»", "10 000 сум"], ["Безопасная сделка", "оплата картой"]],
    bot: [["Новое по поиску «велосипед»", "Самарканд"], ["Вашу ставку перебили", "лот для примера"], ["Опубликовано в @hop_uzb", "автоматически"]],
    pwa: [["Значок HOP! на экране", "Android и iPhone"], ["Открывается", "без адресной строки"]],
  };
  const comp = [
    ["Подборки под поиском", "Uybor ставит под поиском готовые ссылки: «Самые дешевые», «В рассрочку». У вас под поиском шесть ссылок на ходовые разделы: квартиры, машины, вакансии, телефоны, мастер на час, «Отдам даром»."],
    ["Число у каждой категории", "Avtoelon пишет у каждой марки, сколько объявлений. У вас мы показали, сколько разделов в категории: это видно из вашего меню. Число объявлений поставим, когда дадите доступ к базе."],
    ["«Как сюда попасть?»", "Avtoelon и Elbozor объясняют платное место прямо рядом с ним. У вас тарифы стоят на главной и ведут на «Бизнесу»."],
    ["QR на приложение", "Elbozor на компьютере показывает QR-код: «В приложении удобнее». У вас QR ведёт прямо на файл APK."],
    ["Отдельный вход для бизнеса", "Uybor ведёт профессионалов в отдельный раздел. У вас «Бизнесу» в шапке и блок тарифов на главной."],
    ["Сделка и аукцион первым экраном", "Ни у кого из семи на главной нет денег под защитой и аукциона с продлением. У вас есть оба: теперь они на первом экране, в сцене при прокрутке и на своей странице."],
  ];
  return shell("plan", {
    title: "Что дальше: было и стало, конструктор сайта | HOP.UZ",
    desc: `Было и стало: hop.uz сегодня и прототип. Конструктор: сайт ${sp(KIT_BASE.price)} $, со всеми допами ${sp(total)} $.`,
  }, `${phead(NAMES.plan, `<span class="ours">Предложение DevUz Studio для HOP.UZ</span>`, "Было и стало", "Слева hop.uz сегодня, справа этот прототип. Тяните шторку.")}
<section style="padding-top:0"><div class="wrap">
<div class="ba">
${ba("ba-old-d.webp", "ba-new-d.webp", "Компьютер · первый экран", "было: сразу лента категорий")}
${ba("ba-old-m.webp", "ba-new-m.webp", "Телефон · первый экран", "было: без заголовка")}
</div>
<div class="grid3" style="margin-top:48px">
<div class="note rv a-rise"><h3>Было: главное спрятано в меню</h3><p>Безопасная сделка и аукционы, то, чего нет у соседей, стоят пунктами в шапке. На первом экране их не видно.</p></div>
<div class="note rv a-rise" style="--d:90ms"><h3>Было: цены в рублях</h3><p>На странице тарифов «Активировать за 1 ₽» и «за один рубль», а рядом цены в сумах. Покупатель из Узбекистана останавливается на этом месте.</p></div>
<div class="note rv a-rise" style="--d:180ms"><h3>Стало: путь вещи за минуту</h3><p>Первый экран говорит, что это и где, поиск подсказывает раздел, а сцена при прокрутке показывает объявление, чат, сделку и аукцион по очереди.</p></div>
</div>
</div></section>
<section id="konstruktor" style="padding-top:0"><div class="wrap">
${head("Конструктор проекта", "Соберите сайт под свой бюджет", `Сайт стоит ${sp(KIT_BASE.price)} $. Остальное включается тумблером: блок появляется на странице и в превью, итог пересчитывается. Со всеми допами ${sp(total)} $, точные цены назовём после разговора.`)}
<div class="kit">
<div class="kit-list">
<div class="kit-base"><div><b>${KIT_BASE.ru.t}</b><p>${KIT_BASE.ru.d}</p></div><span class="kit-price num">${usd(KIT_BASE.price)}</span></div>
<h3 class="kit-g">Допы на страницах</h3>
${ADDONS.map((a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="" data-def checked><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a.ru.t}</b><small>${a.ru.e}</small></span><span class="kit-price num">${usd(a.price)}</span></label>`).join("")}
${Object.keys(GROUPS).map((g) => `<h3 class="kit-g">Сверх сайта · ${GROUPS[g].ru}</h3>${BLOCKS.filter((b) => b.group === g).map((b) => `<label class="kit-row"><input type="checkbox" data-k="${b.id}" data-p="${b.price}" data-needs="${b.needs.join(" ")}"${b.star ? " data-def checked" : ""}><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${b.ru.t}</b><small>${b.ru.why}</small><span class="kit-li">${b.ru.li.map((x) => `<em>${x}</em>`).join("")}</span></span><span class="kit-price num">${usd(b.price)}</span></label>`).join("")}`).join("")}
</div>
<div class="kit-side">
<div aria-live="polite">${BLOCKS.map((b) => `<div class="kit-pv" data-pv="${b.id}" hidden><b>${b.ru.t}</b>${pv[b.pv].map(([a, c]) => `<div class="pv-row"><span>${a}</span><b>${c}</b></div>`).join("")}</div>`).join("")}</div>
<div class="kit-total"><small>Итого с сайтом</small><b class="num" id="kit-sum"></b><small id="kit-n"></small><a class="btn btn-red" href="https://t.me/Devuz_studio_bot?start=hop">${ICON.tg}Обсудить с DevUz Studio</a></div>
</div>
</div>
</div></section>
<section id="konkurenty" style="padding-top:0"><div class="wrap">
${head("Что взяли у конкурентов", "Сильное у досок объявлений Узбекистана", COMP_LEAD)}
<div class="grid3">${comp.map(([h, p], k) => `<div class="note rv a-rise" style="--d:${(k % 3) * 80}ms"><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>
${offerBlock(true)}
<section id="foto"><div class="wrap">
${head("Изображения в прототипе", "Откуда изображения", "Логотип HOP! перерисован кодом по файлу логотипа с hop.uz. Велосипед, телефон, окна, колесо фортуны, иконки и схема городов нарисованы кодом. Нейросетью ничего не рисовали.")}
<ul class="credits"><li>Логотип: hop.uz, файл логотипа в шапке сайта, 571 × 190. Буквы перерисованы по его размерам.</li><li>Категории, разделы, города, тарифы, правила сделки и аукционов: страницы hop.uz, 08.10.2026.</li><li>Объявление про детский велосипед, переписка и ставки в примерах придуманы: это показ того, как устроена страница, а не сведения о HOP.UZ.</li><li>QR-код ведёт на файл приложения с hop.uz.</li><li>Движение сделано по мотивам открытых компонентов с 21st.dev (лицензия MIT), код свой: Text Effect, Word Rotate, Shimmer Button, Dot Pattern, Marquee, Typing Animation, Number Ticker, Bento Grid, Magic Card, Border Beam, Animated Beam, Ripple, Accordion, Blur Fade.</li></ul>
</div></section>`);
}

const out = {};
for (const p of PAGES) out[p] = { "": home, razmestit, sdelka, biznes, plan }[p]();
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/*
 * Сборка для сервера (lib/proto/bundles): общие куски — стили, скрипт —
 * один раз, в страницах вместо них метка @@имя@@.
 */
const first = out[""];
const grab = (html, re) => html.match(re)[0];
const parts = {
  S: grab(first, /<style>[\s\S]*?<\/style>/),
  J: grab(first, /<script>\n\(function\(\)\{\n'use strict';\n\/\* main[\s\S]*?<\/script>/),
};
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let page = html;
  for (const [name, part] of Object.entries(parts)) page = page.split(part).join(`@@${name}@@`);
  pages[key] = page;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "hop.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(main)").padEnd(14), v.length);
