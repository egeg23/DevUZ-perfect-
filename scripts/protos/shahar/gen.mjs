import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { ADDONS, BASE as KIT_BASE, BLOCKS, GROUPS } from "./plan.mjs";

/*
 * Прототип ShahaR.Uz (shahar.uz) — портал недвижимости по всему Узбекистану.
 * Семь страниц на двух языках, офлайн-страница, манифест и service worker —
 * «сайт как приложение». Исследование — docs/research/shahar.md, фото —
 * SOURCES.md, компоненты 21st.dev — 21ST.md.
 *
 * Всё о компании — только с её сайта и её Telegram-канала: с 1998 года,
 * лицензия RR 0007, полис страхования риэлторов, регионы, типы объектов,
 * ипотека, подбор бесплатно, инфраструктура рядом, партнёрские порталы,
 * база новостроек, четыре последних объявления. Отзывов и телефона компании
 * на сайте нет — их нет и здесь. Наши дополнения подписаны «Предложение
 * DevUz Studio».
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/shahar";
const CSS = readFileSync(DIR + "style.css", "utf8").replace(/\n/g, "").replace(/__IMG__/g, IMG);
const INTRO = readFileSync(DIR + "intro.js", "utf8");
const JS = readFileSync(DIR + "client.js", "utf8");
const SW = readFileSync(DIR + "sw.js", "utf8");
const BASE = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Onest:wght@400;700&family=Unbounded:wght@700&display=swap";

const usd = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
const sp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, path = "") => BASE + (l === "uz" ? "/uz" : "") + (path ? "/" + path : "");
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);

/* ── Факты с их сайта ─────────────────────────────────────────────────── */
const F = {
  name: "ShahaR.Uz",
  since: 1998,
  lic: "RR 0007",
  licDate: { ru: "от 25.07.2011", uz: "25.07.2011 dan" },
  policy: "14/СОР-01",
  policyDate: { ru: "от 12.01.2022", uz: "12.01.2022 dan" },
  admin: "https://t.me/operator_shahar",
  adminAt: "@operator_shahar",
  bot: "https://t.me/Shaharuz_bot",
  channel: "https://t.me/shaharuzchannel",
  newChannel: "https://t.me/cityshahar",
  insta: "https://instagram.com/shahar.uz",
  fb: "https://fb.com/ShahaR.Uz",
  site: "https://shahar.uz",
};
/* Курс — из их же карточки объекта ID 149644: 54 000 $ = 636 702 660 сум = 47 923 €. */
const RATE = { sum: 636702660 / 54000, eur: 47923 / 54000 };

const REGIONS = {
  ru: ["Ташкентская", "Каракалпакстан", "Самаркандская", "Бухарская", "Андижанская", "Джизакская", "Сурхандарьинская", "Кашкадарьинская", "Сырдарьинская", "Навоийская", "Наманганская", "Ферганская", "Хорезмская"],
  uz: ["Toshkent viloyati", "Qoraqalpog‘iston", "Samarqand", "Buxoro", "Andijon", "Jizzax", "Surxondaryo", "Qashqadaryo", "Sirdaryo", "Navoiy", "Namangan", "Farg‘ona", "Xorazm"],
};
const DISTRICTS = {
  ru: ["Алмазар", "Бектемир", "Мирабад", "Мирзо-Улугбек", "Сергели", "Учтепа", "Чиланзар", "Шайхантахур", "Юнусабад", "Яккасарай", "Янгихаёт", "Яшнабад"],
  uz: ["Olmazor", "Bektemir", "Mirobod", "Mirzo Ulug‘bek", "Sergeli", "Uchtepa", "Chilonzor", "Shayxontohur", "Yunusobod", "Yakkasaroy", "Yangihayot", "Yashnobod"],
};
const TYPES = {
  ru: ["квартира", "дом", "дача", "земля", "офис", "торговля", "общепит", "чайхона", "производство", "склад", "бизнес", "агрокомплекс", "гостиница", "салон красоты", "санаторий", "комната"],
  uz: ["kvartira", "uy", "dacha", "yer", "ofis", "savdo", "umumiy ovqatlanish", "choyxona", "ishlab chiqarish", "ombor", "biznes", "agrokompleks", "mehmonxona", "go‘zallik saloni", "sanatoriy", "xona"],
};

/* Четыре последних объявления с главной shahar.uz, как есть на 07.10.2026. */
const LISTINGS = [
  {
    id: 149645, type: "kv", rooms: 2, area: 58, floor: "10/14", usd: 125000, date: "22.09", photos: 6,
    dist: 3, ru: { t: "2-комн. квартира", street: "ул. Катта Дархон", mark: "ЖК «O‘z Mahal»", walk: "до Пушкинской 15 мин." }, uz: { t: "2 xonali kvartira", street: "Katta Darxon ko‘chasi", mark: "«O‘z Mahal» TJM", walk: "Pushkin metrosigacha 15 daq." },
  },
  {
    id: 149644, type: "kv", rooms: 1, area: 29, floor: "7/15", usd: 54000, old: 55000, date: "22.09", photos: 6,
    dist: 0, ru: { t: "1-комн. квартира", street: "ул. Уста Ширин", mark: "ЖК «Assalom Jomiy»", walk: "ориентир: круг Джами" }, uz: { t: "1 xonali kvartira", street: "Usta Shirin ko‘chasi", mark: "«Assalom Jomiy» TJM", walk: "mo‘ljal: Jome aylanasi" },
  },
  {
    id: 149727, type: "kv", rooms: 2, area: 46, floor: "2/4", usd: 66000, date: "05.10", photos: 6, mort: true,
    dist: 5, ru: { t: "2-комн. квартира", street: "Учтепа-12", mark: "ориентир: Фархадский базар", walk: "до Чилонзора 15 мин." }, uz: { t: "2 xonali kvartira", street: "Uchtepa-12", mark: "mo‘ljal: Farhod bozori", walk: "Chilonzor metrosigacha 15 daq." },
  },
  {
    id: 149381, type: "dacha", rooms: 4, area: 279, floor: "1", usd: 67000, date: "28.09", photos: 6,
    dist: -1, ru: { t: "4-комн. дача", street: "Бостанлык, Дустлик, ул. Бойкургон", mark: "ориентир: СВТ Агрегат", walk: "" }, uz: { t: "4 xonali dacha", street: "Bo‘stonliq, Do‘stlik, Boyqo‘rg‘on ko‘chasi", mark: "mo‘ljal: SVT Agregat", walk: "" },
  },
];
const placeOf = (x, l) => (x.dist >= 0 ? `${l === "ru" ? "Ташкент" : "Toshkent"}, ${DISTRICTS[l][x.dist]}` : x[l].street);

/* Новостройки — их база novostroyka.shahar.uz: класс, район, срок, цены. */
const ZK = [
  { n: "Darkhan Avenue", cls: { ru: "Бизнес", uz: "Biznes" }, dist: 3, dev: "Darkhan Avenue", term: { ru: "4 квартал 2021", uz: "2021, 4-chorak" }, rows: [["1", "50,58", 480510000], ["2", "51,43", 488585000], ["3", "", 864500000]], left: { ru: "38 квартир в продаже · рассрочка", uz: "38 ta kvartira sotuvda · muddatli to‘lov" }, h: [.5, .8, 1, .7, .9] },
  { n: "Aviasozlar Plaza", cls: { ru: "Комфорт", uz: "Komfort" }, dist: 11, dev: "The Build City Group", term: { ru: "3 квартал 2023", uz: "2023, 3-chorak" }, rows: [["2", "75,8", 700920000], ["3", "81,57", 736800000], ["4", "119,6", 956800000]], left: { ru: "84 квартиры в продаже · рассрочка", uz: "84 ta kvartira sotuvda · muddatli to‘lov" }, h: [.7, .95, .6, 1, .8] },
  { n: "Bogi Shamol", cls: { ru: "Комфорт", uz: "Komfort" }, dist: 8, dev: "MCC", term: { ru: "сдан", uz: "topshirilgan" }, rows: [], left: { ru: "последние квартиры · ипотека от 4,3%", uz: "so‘nggi kvartiralar · ipoteka 4,3% dan" }, h: [.9, .6, .85, .7, 1] },
  { n: "Mirabad Avenue", cls: { ru: "Премиум", uz: "Premium" }, dist: 2, dev: "Mirabad Avenue", term: { ru: "сдан", uz: "topshirilgan" }, rows: [], left: { ru: "последние квартиры · рассрочка", uz: "so‘nggi kvartiralar · muddatli to‘lov" }, h: [1, .7, .9, .8, .6] },
  { n: "CHASHMA Residence", cls: { ru: "Комфорт", uz: "Komfort" }, dist: 0, dev: "B.Invest Development", term: { ru: "2 квартал 2023", uz: "2023, 2-chorak" }, rows: [], left: { ru: "рассрочка", uz: "muddatli to‘lov" }, h: [.6, .8, .7, .9, .75] },
  { n: "Park City Labzak", cls: { ru: "Премиум", uz: "Premium" }, dist: 7, dev: "", term: { ru: "2 квартал 2024", uz: "2024, 2-chorak" }, rows: [], left: { ru: "", uz: "" }, h: [.8, 1, .9, .7, .85] },
];

/* Логотип DevUz Studio для заставки — тот же, что в промо на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZMARK = `<svg class="dz-mark" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

/* Иконки — контуры 24×24, по смыслу. */
const I = (d, w = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  tg: I('<path d="M21 4 3 11l6 2.5M21 4l-3.5 16-8.5-6.5M21 4 9 13.5V19l3-3.5"/>'),
  home: I('<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  grid: I('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'),
  spark: I('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>'),
  heart: I('<path d="M12 20s-7.5-4.6-9.3-9.2C1.4 7.4 3.6 4 7 4c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 15.4 12 20 12 20z"/>'),
  bld: I('<path d="M4 21V5l7-2v18M11 21V8l9 3v10M2 21h20M7 8h1M7 12h1M7 16h1M14 13h2M14 17h2"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  pct: I('<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>'),
  users: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5.5 5.5 0 0 1 3.5 6"/>'),
  chart: I('<path d="M3 20h18"/><path d="M6 16v-4M11 16V8M16 16v-6M21 16V5"/>'),
  biz: I('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'),
  shield: I('<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
  doc: I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
  video: I('<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="m15.5 10 6-3.5v11l-6-3.5"/>'),
  bell: I('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'),
  crown: I('<path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z"/>'),
  calc: I('<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h.01M12 18h.01"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>', 2),
  arrows: I('<path d="m9 7-5 5 5 5M15 7l5 5-5 5"/>', 2),
  plus: I('<path d="M12 5v14M5 12h14"/>', 2),
  share: I('<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>', 2),
  school: I('<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>'),
  hosp: I('<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M12 8v8M8 12h8"/>'),
  shop: I('<path d="M4 7h16l-1.5 13h-13z"/><path d="M9 7a3 3 0 0 1 6 0"/>'),
  cafe: I('<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>'),
  pill: I('<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="m9.5 9.5 5 5"/>'),
  baby: I('<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>'),
  uni: I('<path d="M3 21h18M5 21V10M19 21V10M9 21v-7M15 21v-7M2 10l10-6 10 6"/>'),
  mall: I('<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 11h18M8 6V3M16 6V3M10 16h4"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
};

/* Названия страниц: в меню, в нижнем меню приложения и в конструкторе. */
const PAGE_NAMES = { "": ["Главная", "Bosh sahifa"], katalog: ["Каталог", "Katalog"], obekt: ["Объект", "Obyekt"], novostroyki: ["Новостройки", "Yangi binolar"], uslugi: ["Услуги", "Xizmatlar"], podbor: ["Подбор", "Tanlash"], plan: ["Что дальше", "Keyingi qadam"] };
const PAGES = ["", "katalog", "obekt", "novostroyki", "uslugi", "podbor", "plan"];

/* ── Карточка объявления ──────────────────────────────────────────────── */
function card(l, x, k = 0, anim = "key") {
  const t = T(l);
  const kind = x.type === "kv" ? t("квартира", "kvartira") : t("дача", "dacha");
  return `<a class="lc rv a-${anim}" style="--d:${(k % 4) * 90}ms" href="${href(l, "obekt")}?id=${x.id}" data-id="${x.id}" data-type="${x.type}" data-rooms="${x.rooms}" data-dist="${x.dist}" data-usd="${x.usd}" data-mort="${x.mort ? 1 : 0}">
<div class="ph"><img src="${IMG}/l${x.id}-1.webp" alt="${esc(`${x[l].t}, ${x.area} м², ${placeOf(x, l)}`)}" loading="lazy" width="720" height="960"><div class="tag"><span>${t("Продажа", "Sotuv")} · ${kind}</span>${x.old ? `<span class="down">${t("Цена снижена", "Narx tushdi")}</span>` : ""}</div></div>
<div class="bd"><div class="price"><b class="num" data-p="${x.usd}">${usd(x.usd)}</b>${x.old ? `<s class="num" data-p="${x.old}">${usd(x.old)}</s>` : ""}<small class="num" data-pm="${Math.round(x.usd / x.area)}">${usd(Math.round(x.usd / x.area))}/м²</small></div>
<p class="pr">${x[l].t} · ${x.area} м² · ${x.type === "kv" ? `${t("этаж", "qavat")} ${x.floor}` : t("1 этаж", "1 qavat")}</p>
<p class="ad">${ICON.pin}<span>${placeOf(x, l)} · ${x[l].mark}</span></p>
<p class="id">ID ${x.id} · ${x.date}</p></div>
</a><button class="fav" type="button" data-fav="${x.id}" aria-pressed="false" aria-label="${t("В избранное", "Sevimlilarga")}" data-addon="fav">${ICON.heart}</button>`;
}
/* Сердечко лежит рядом с карточкой, а не внутри ссылки; обёртка держит их вместе. */
const cardBox = (l, x, k, anim) => `<div class="lcw" style="position:relative" data-id="${x.id}">${card(l, x, k, anim)}</div>`;

/* ── Конструктор: плашка на каждой странице ───────────────────────────── */
function kdRow(l, a, def = true) {
  return `<label class="kd-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="${(a.needs || []).join(" ")}"${def ? " data-def checked" : ""}><span class="sw" aria-hidden="true"></span><span class="kd-t"><b>${a[l].t}${a.star ? `<em>${l === "ru" ? "обязательно" : "majburiy"}</em>` : ""}</b>${a[l].e ? `<small>${a[l].e}</small>` : ""}</span><span class="kd-p num">+${usd(a.price)}</span></label>`;
}
function dockHtml(l, path) {
  const t = T(l);
  const i = l === "ru" ? 0 : 1;
  const group = (title, side, rows) => (rows.length ? `<section class="kd-g"><h3><span>${title}</span>${side}</h3>${rows.join("")}</section>` : "");
  const here = ADDONS.filter((a) => a.where === path);
  const all = ADDONS.filter((a) => a.where === "all");
  const others = [...new Set(ADDONS.map((a) => a.where))].filter((w) => w !== "all" && w !== path);
  return `<button class="kd-pill" type="button" id="kd-pill" aria-expanded="false" aria-controls="kd"><i aria-hidden="true"></i>${t("Конструктор", "Konstruktor")}<b class="num" id="kd-pill-sum"></b></button>
<aside class="kd" id="kd" role="dialog" aria-label="${t("Конструктор сайта", "Sayt konstruktori")}" hidden>
<header class="kd-h"><div><p class="kd-k">${t("Конструктор · предложение DevUz Studio", "Konstruktor · DevUz Studio taklifi")}</p><h2>${t("Что войдёт в новый ShahaR.Uz", "Yangi ShahaR.Uz’ga nima kiradi")}</h2><p class="kd-sub">${t("Выключите блок, и он пропадёт со страницы. Включите, и он появится снова. Цены взяты по нижней границе рынка Ташкента.", "Blokni o‘chirsangiz, u sahifadan yo‘qoladi. Yoqsangiz, yana paydo bo‘ladi. Narxlar Toshkent bozorining quyi chegarasi bo‘yicha olingan.")}</p></div><button class="kd-x" type="button" id="kd-x" aria-label="${t("Свернуть", "Yig‘ish")}">×</button></header>
<div class="kd-list">
${group(t("На этой странице", "Shu sahifada"), "", here.map((a) => kdRow(l, a)))}
${group(t("На всех страницах", "Barcha sahifalarda"), "", all.map((a) => kdRow(l, a)))}
${others.map((w) => group(PAGE_NAMES[w][i], `<a href="${href(l, w)}">${t("открыть", "ochish")} →</a>`, ADDONS.filter((a) => a.where === w).map((a) => kdRow(l, a)))).join("")}
${group(t("Сверх сайта", "Saytdan tashqari"), `<a href="${href(l, "plan")}#konstruktor">${t("что это", "bu nima")} →</a>`, BLOCKS.map((b) => kdRow(l, { ...b, [l]: { t: b[l].t } }, !!b.star)))}
</div>
<footer class="kd-f">
<div class="kd-line"><span>${t("Портал", "Portal")}</span><span class="num">${usd(KIT_BASE.price)}</span></div>
<div class="kd-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kd-n"></span></span><span class="num" id="kd-add"></span></div>
<div class="kd-line kd-tot"><span>${t("Итого разово", "Jami bir martalik")}</span><b class="num" id="kd-sum"></b></div>
<a class="btn btn-main" href="https://t.me/Devuz_studio_bot?start=shahar">${ICON.tg}${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</a>
<div class="kd-btns"><button class="copy" type="button" id="kd-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button><button class="copy" type="button" id="kd-reset">${t("Сбросить", "Qayta tiklash")}</button></div>
</footer>
</aside>`;
}

/* ── Заставка: промо DevUz Studio → влёт в букву SHAHAR → первый экран ── */
function introHtml(l) {
  const t = T(l);
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  return `<div class="intro" id="intro" role="presentation">
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="gp-field" aria-hidden="true"></div>
<svg class="gp-art" aria-hidden="true" focusable="false"><defs><clipPath id="gp-clip" clipPathUnits="userSpaceOnUse">${"SHAHAR".split("").map(() => '<text font-family="Unbounded, sans-serif" font-weight="700" font-size="100"></text>').join("")}</clipPath></defs><g id="gp-line" fill="none" stroke="#E8B24C" stroke-width="1.2">${"SHAHAR".split("").map(() => '<text font-family="Unbounded, sans-serif" font-weight="700" font-size="100"></text>').join("")}</g></svg>
<div class="gp-cap"><b>ShahaR.Uz</b><span>${t("недвижимость по всему Узбекистану · с 1998 года", "butun O‘zbekiston bo‘ylab ko‘chmas mulk · 1998 yildan")}</span></div>
<div class="dz-stage">${DZMARK}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t("прототип для ShahaR.Uz", "ShahaR.Uz uchun prototip")}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish")}</button>
</div>`;
}

/* ── Каркас ───────────────────────────────────────────────────────────── */
function shell(l, path, meta, body) {
  const t = T(l);
  const other = l === "ru" ? "uz" : "ru";
  const i = l === "ru" ? 0 : 1;
  const nav = ["katalog", "novostroyki", "uslugi", "podbor", "plan"];
  const tab = (p, icon, label, { hot = false, q = "", badge = false } = {}) => `<a href="${href(l, p)}${q}"${p === path && !q ? ' aria-current="page"' : ""}${hot ? ' class="hot"' : ""}${badge ? ' data-addon="fav"' : ""}>${hot ? `<span class="dot">${icon}</span>` : icon}<span>${label}</span>${badge ? '<b class="badge num" data-favn hidden></b>' : ""}</a>`;
  const curSw = `<div class="cur" role="group" aria-label="${t("Валюта", "Valyuta")}" data-addon="cur"><button type="button" data-cur="usd" aria-pressed="true">$</button><button type="button" data-cur="sum" aria-pressed="false">${t("сум", "so‘m")}</button><button type="button" data-cur="eur" aria-pressed="false">€</button></div>`;
  const isHome = path === "";
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0f1a16">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="ShahaR.Uz">
<link rel="manifest" href="${href(l, "manifest")}" data-addon-link="pwa">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
${isHome ? `<link rel="preload" as="image" href="${IMG}/hero-m.webp" media="(max-width: 767px)"><link rel="preload" as="image" href="${IMG}/hero.webp" media="(min-width: 768px)">` : ""}
<link rel="alternate" hreflang="${other}" href="${href(other, path)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=${isHome ? "false" : "true"};try{if(matchMedia('(display-mode: standalone)').matches||navigator.standalone||/[?&]app=1/.test(location.search))r.classList.add('is-app'),off=true}catch(e){}try{if(sessionStorage.getItem('sh-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}try{var k=JSON.parse(localStorage.getItem('sh-kit-v1')||'{}');if(k.portal===false)off=true;if(k.motion===false)r.classList.add('k-no-motion')}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "RealEstateAgent", name: "ShahaR.Uz", url: F.site, foundingDate: "1998", areaServed: "UZ", sameAs: [F.channel, F.insta, F.fb] })}</script>
</head>
<body class="${isHome ? "home" : ""}" data-page="${path}" data-lang="${l}">
${isHome ? introHtml(l) : ""}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="ShahaR.Uz"><i aria-hidden="true">S</i>ShahaR<small>.uz</small></a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map((p) => `<a href="${href(l, p)}"${p === path ? ' aria-current="page"' : ""}>${PAGE_NAMES[p][i]}</a>`).join("")}</nav>
<div class="top-r">${curSw}
<div class="lang" data-addon="uz"><a href="${href("ru", path)}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz", path)}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>
<a class="btn btn-gold btn-sm top-cta" href="${href(l, "podbor")}">${ICON.spark}${t("Подберём бесплатно", "Bepul tanlab beramiz")}</a></div>
</div></header>
<div class="app-bar"><a class="logo" href="${href(l)}" aria-label="ShahaR.Uz"><i aria-hidden="true">S</i>ShahaR<small>.uz</small></a>${curSw}</div>
<main id="main">
${body}
</main>
<footer><div class="wrap">
<div class="cols">
<div><b>ShahaR.Uz · ${t("с 1998 года", "1998 yildan")}</b><ul><li>${t("Мультилистинг: поисковик недвижимости по всему Узбекистану", "Multilisting: butun O‘zbekiston bo‘ylab ko‘chmas mulk qidiruvi")}</li><li>${t("Услуги лицензированы", "Xizmatlar litsenziyalangan")} ${F.lic} ${F.licDate[l]}</li><li>${t("Полис страхования ответственности риэлторов", "Rieltorlar javobgarligini sug‘urtalash polisi")} ${F.policy} ${F.policyDate[l]}</li></ul></div>
<div><b>${t("На связи", "Aloqada")}</b><ul><li><a href="${F.admin}">Telegram ${F.adminAt}</a></li><li><a href="${F.channel}">${t("Канал объявлений", "E’lonlar kanali")} @shaharuzchannel</a></li><li><a href="${F.newChannel}">${t("Новостройки", "Yangi binolar")} @cityshahar</a></li><li><a href="${F.insta}">Instagram</a> · <a href="${F.fb}">Facebook</a></li></ul></div>
<div><b>${t("Разделы", "Bo‘limlar")}</b><ul>${["", ...nav].map((p) => `<li><a href="${href(l, p)}">${PAGE_NAMES[p][i]}</a></li>`).join("")}</ul></div>
</div>
<div class="rights"><span>${t("Это прототип: так может выглядеть новый ShahaR.Uz. Факты о компании, объявления и новостройки взяты с shahar.uz и её Telegram-канала (07.10.2026). Блоки с пометкой «Предложение DevUz Studio» придумали мы, на сайте их пока нет. Фото города: открытые снимки Wikimedia Commons, авторы указаны на странице", "Bu prototip: yangi ShahaR.Uz shunday ko‘rinishi mumkin. Kompaniya haqidagi faktlar, e’lonlar va yangi binolar shahar.uz va uning Telegram kanalidan olingan (07.10.2026). «DevUz Studio taklifi» belgisi bor bloklar bizning g‘oyalarimiz, ular hozircha saytda yo‘q. Shahar fotolari: Wikimedia Commons ochiq suratlari, mualliflar ro‘yxati sahifada:")} <a href="${href(l, "plan")}#foto">${PAGE_NAMES.plan[i]}</a>.</span><span>${t("Прототип принадлежит DevUz Studio. Использовать его можно только по договору:", "Prototip DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari")}</a></span></div>
</div></footer>
<nav class="tabs" aria-label="${t("Меню приложения", "Ilova menyusi")}" data-addon="pwa">${tab("", ICON.home, PAGE_NAMES[""][i])}${tab("katalog", ICON.grid, PAGE_NAMES.katalog[i])}${tab("podbor", ICON.spark, PAGE_NAMES.podbor[i], { hot: true })}${tab("katalog", ICON.heart, t("Избранное", "Sevimlilar"), { q: "?fav=1", badge: true })}${tab("novostroyki", ICON.bld, t("Новостройки", "Yangi uylar"))}</nav>
<div class="dock" id="dock"><a class="btn btn-main" href="${href(l, "podbor")}">${ICON.spark}${t("Подберём бесплатно", "Bepul tanlab beramiz")}</a></div>
${dockHtml(l, path)}
<script type="application/json" id="i18n">${JSON.stringify(L(l)).replace(/</g, "\\u003c")}</script>
${isHome ? `<script>\n${INTRO}</script>` : ""}
<script>
${JS}</script>
</body>
</html>`;
}

/* Строки для скрипта страницы. */
function L(l) {
  const ru = l === "ru";
  return {
    base: href(l),
    lang: l,
    rate: RATE,
    sum: ru ? "сум" : "so‘m",
    perM: ru ? "/м²" : "/m²",
    kitBase: KIT_BASE.price,
    kitN: ru ? "{n} шт." : "{n} ta",
    kitTg: ru ? "Состав нового ShahaR.Uz из конструктора:" : "Konstruktordan yangi ShahaR.Uz tarkibi:",
    kitBaseName: KIT_BASE[l].t,
    kitTotal: ru ? "Итого" : "Jami",
    copied: ru ? "Скопировано" : "Nusxalandi",
    rot: ru ? ["квартиру", "дом", "дачу", "офис", "участок", "чайхону"] : ["kvartira", "uy", "dacha", "ofis", "yer uchastkasi", "choyxona"],
    found: ru ? "Найдено: {n}" : "Topildi: {n}",
    show: ru ? "Показать {n}" : "{n} tasini ko‘rsatish",
    msgHead: ru ? "Заявка «Подберём бесплатно» с сайта ShahaR.Uz" : "ShahaR.Uz saytidan «Bepul tanlab beramiz» arizasi",
    fDeal: ru ? "Что нужно" : "Nima kerak",
    fType: ru ? "Объект" : "Obyekt",
    fWhere: ru ? "Где" : "Qayerda",
    fRooms: ru ? "Комнат" : "Xonalar",
    fBudget: ru ? "Бюджет" : "Byudjet",
    fWish: ru ? "Пожелания" : "Istaklar",
    fName: ru ? "Имя" : "Ism",
    fPhone: ru ? "Телефон" : "Telefon",
    need: ru ? "Выберите, что нужно, объект и район и оставьте телефон: без него риэлтору некуда отправить подборку." : "Nima kerakligi, obyekt va tumanni tanlang hamda telefon qoldiring: usiz rieltor tanlovni yubora olmaydi.",
    sent: ru ? "Текст заявки скопирован. Открываем Telegram администратора ShahaR.Uz, вставьте текст в чат." : "Ariza matni nusxalandi. ShahaR.Uz administratorining Telegrami ochilmoqda, matnni chatga qo‘ying.",
    adminUrl: F.admin,
    iosTitle: ru ? "Как добавить на iPhone" : "iPhone’ga qanday qo‘shish",
    installed: ru ? "Готово, иконка на экране телефона" : "Tayyor, belgi telefon ekranida",
    empty: ru ? "не указано" : "ko‘rsatilmagan",
    month: ru ? "в месяц" : "oyiga",
  };
}

/* ── Куски страниц ────────────────────────────────────────────────────── */
const head = (kicker, h, lead, side = "", anim = "rise") => `<div class="sec-head rv a-${anim}"><div>${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h2 style="margin-top:12px">${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>${side}</div>`;

function heroBlock(l) {
  const t = T(l);
  const [a, b, c] = [LISTINGS[0], LISTINGS[1], LISTINGS[3]];
  const fc = (x, cls, k) => `<a class="fc ${cls}" href="${href(l, "obekt")}?id=${x.id}" data-depth="${k}" aria-label="${esc(x[l].t)}"><img src="${IMG}/l${x.id}-1.webp" alt="" width="720" height="960" loading="eager"><div><b class="num" data-p="${x.usd}">${usd(x.usd)}</b><small>${x[l].t} · ${x.area} м² · ${placeOf(x, l)}</small></div></a>`;
  return `<section class="hero" id="hero" data-scene="hero" aria-label="ShahaR.Uz">
<div class="hero-ph" data-l="ph" aria-hidden="true"></div><div class="hero-sh" aria-hidden="true"></div>
<div class="hero-in"><div class="wrap"><div class="hero-grid">
<div>
<span class="kicker hi" style="color:var(--on2)"><i></i>${t("ShahaR.Uz · мультилистинг с 1998 года", "ShahaR.Uz · 1998 yildan multilisting")}</span>
<h1 class="hi" style="margin-top:16px;--d:80ms">${t("Найдите", "Butun O‘zbekiston bo‘ylab")} <span class="rot" aria-hidden="true">${L(l).rot.map((w, k) => `<span${k === 0 ? ' class="on"' : ""}>${w}</span>`).join("")}</span><span class="vh">${t("квартиру, дом, дачу, офис", "kvartira, uy, dacha, ofis")}</span> ${t("по всему Узбекистану", "toping")}</h1>
<p class="lead hi" style="--d:160ms">${t("Объявления 13 регионов: от квартиры в новостройке до чайхоны почасово. Риэлторы портала бесплатно подберут объект под ваш запрос.", "13 hududning e’lonlari: yangi binodagi kvartiradan soatbay choyxonagacha. Portal rieltorlari so‘rovingizga mos obyektni bepul tanlab berishadi.")}</p>
<form class="search hi" id="search" style="--d:240ms" action="${href(l, "katalog")}" role="search">
<div class="s-tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-deal="buy">${t("Купить", "Sotib olish")}</button><button type="button" role="tab" aria-selected="false" data-deal="rent">${t("Снять", "Ijaraga olish")}</button><button type="button" role="tab" aria-selected="false" data-deal="day">${t("Посуточно", "Kunbay")}</button><i aria-hidden="true"></i></div>
<input type="hidden" name="deal" value="buy">
<div class="s-row">
<label class="s-f"><span>${t("Объект", "Obyekt")}</span><select name="type"><option value="">${t("Любой", "Istalgan")}</option><option value="kv">${t("Квартира", "Kvartira")}</option><option value="dom">${t("Дом", "Uy")}</option><option value="dacha">${t("Дача", "Dacha")}</option><option value="of">${t("Офис", "Ofis")}</option><option value="zem">${t("Земля", "Yer")}</option></select></label>
<label class="s-f"><span>${t("Район Ташкента", "Toshkent tumani")}</span><select name="dist"><option value="">${t("Все районы", "Barcha tumanlar")}</option>${DISTRICTS[l].map((d, k) => `<option value="${k}">${d}</option>`).join("")}</select></label>
<label class="s-f" style="grid-column:1/-1" data-wide><span>${t("Бюджет до", "Byudjet")}</span><select name="max"><option value="">${t("Не важно", "Muhim emas")}</option><option value="60000">${t("до", "")} $60 000${t("", " gacha")}</option><option value="100000">${t("до", "")} $100 000${t("", " gacha")}</option><option value="150000">${t("до", "")} $150 000${t("", " gacha")}</option></select></label>
</div>
<div class="s-rooms"><span>${t("Комнат", "Xonalar")}</span>${["1", "2", "3", "4+"].map((r) => `<button type="button" class="chip" data-room="${r[0]}" aria-pressed="false">${r}</button>`).join("")}<input type="hidden" name="rooms" value=""></div>
<button class="btn btn-main s-go" type="submit">${ICON.search}<span data-go>${t("Показать объявления", "E’lonlarni ko‘rsatish")}</span></button>
</form>
<div class="trust hi" style="--d:320ms"><span>${ICON.shield}${t("Лицензия", "Litsenziya")} ${F.lic}</span><span>${ICON.doc}${t("Полис страхования риэлторов", "Rieltorlar sug‘urta polisi")}</span><span>${ICON.pin}${t("13 регионов", "13 hudud")}</span></div>
</div>
<div class="float" aria-hidden="false">${fc(a, "a", 0.6)}${fc(b, "b", 1)}${fc(c, "c", 1.5)}</div>
</div></div></div>
</section>`;
}

function statsBlock(l) {
  const t = T(l);
  return `<section style="padding-bottom:0"><div class="wrap"><div class="stats rv a-rise">
<div><b class="num" data-count="${F.since}" data-from="1960">${F.since}</b><span>${t("год, с которого работает ShahaR.Uz", "ShahaR.Uz ishlay boshlagan yil")}</span></div>
<div><b class="num" data-count="13">13</b><span>${t("регионов Узбекистана в поиске", "qidiruvda O‘zbekistonning hududlari")}</span></div>
<div><b class="num" data-count="16">16</b><span>${t("типов объектов, вплоть до чайхоны и санатория", "obyekt turi, choyxona va sanatoriygacha")}</span></div>
<div><b>${F.lic}</b><span>${t("лицензия на услуги", "xizmatlar litsenziyasi")} ${F.licDate[l]}</span></div>
</div></div></section>`;
}

function marqueeBlock(l) {
  const t = T(l);
  const row = (items, rev) => `<div class="mq${rev ? " rev" : ""}"><div class="mq-t">${items}</div><div class="mq-t" aria-hidden="true">${items}</div></div>`;
  const dist = DISTRICTS[l].map((d, k) => `<a href="${href(l, "katalog")}?dist=${k}"><i></i>${d}</a>`).join("");
  const typ = TYPES[l].map((x) => `<a href="${href(l, "katalog")}"><i></i>${x}</a>`).join("");
  return `<div class="mq-wrap" aria-label="${t("Районы Ташкента и типы объектов", "Toshkent tumanlari va obyekt turlari")}">${row(dist, false)}${row(typ, true)}</div>`;
}

function latestBlock(l) {
  const t = T(l);
  return `<section style="padding-top:32px"><div class="wrap">
${head(t("Последние поступления", "So‘nggi e’lonlar"), t("Свежие объекты на ShahaR.Uz", "ShahaR.Uz’dagi yangi obyektlar"), t("Четыре последних объявления с вашей главной: с фото, ценой за м² и ориентиром. Цена переключается в сумы и евро вверху страницы.", "Bosh sahifangizdagi to‘rtta so‘nggi e’lon: foto, m² narxi va mo‘ljal bilan. Narx sahifa tepasida so‘m va yevroga almashtiriladi."), `<a class="btn btn-ghost btn-sm" href="${href(l, "katalog")}">${t("Весь каталог", "Butun katalog")} ${ICON.arrow}</a>`)}
<div class="grid g4">${LISTINGS.map((x, k) => cardBox(l, x, k)).join("")}</div>
</div></section>`;
}

function bentoBlock(l) {
  const t = T(l);
  const go = (s) => `<span class="go">${s} ${ICON.arrow}</span>`;
  return `<section><div class="wrap">
${head(t("Что делает ShahaR.Uz", "ShahaR.Uz nima qiladi"), t("Не только лента объявлений", "Faqat e’lonlar lentasi emas"), t("Всё, что уже есть у вас на сайте, только крупно и в одно касание.", "Saytingizda allaqachon bor narsalarning hammasi, faqat katta va bir bosishda."))}
<div class="bento">
<a class="bc photo w2 h2 rv a-tilt" href="${href(l, "podbor")}"><div class="bg" style="background-image:url(${IMG}/l149645-2.webp)"></div><span class="beam" aria-hidden="true"></span><span class="ic">${ICON.spark}</span><h3 style="font-size:24px">${t("Подберём бесплатно", "Bepul tanlab beramiz")}</h3><p>${t("«Риэлторы и агенты портала составят для Вас список актуальных объектов, учитывая Ваши требования». Ваше обещание стало главной кнопкой сайта.", "«Portal rieltorlari va agentlari talablaringizni hisobga olib dolzarb obyektlar ro‘yxatini tuzadi». Sizning va’dangiz endi saytning asosiy tugmasi.")}</p>${go(t("Оставить заявку", "Ariza qoldirish"))}</a>
<a class="bc rv a-pop" style="--d:90ms" href="${href(l, "uslugi")}#ipoteka"><span class="ic">${ICON.pct}</span><h3>${t("Оформить ипотеку", "Ipoteka rasmiylashtirish")}</h3><p>${t("Специалисты помогут собрать документы для подачи в банк.", "Mutaxassislar bankka topshirish uchun hujjatlarni yig‘ishga yordam beradi.")}</p>${go(t("Подробнее", "Batafsil"))}</a>
<a class="bc dk rv a-pop" style="--d:180ms" href="${href(l, "novostroyki")}"><span class="ic">${ICON.bld}</span><h3>${t("База новостроек", "Yangi binolar bazasi")}</h3><p>${t("От застройщиков: класс, срок сдачи, цены по комнатам.", "Quruvchilardan: sinf, topshirish muddati, xonalar bo‘yicha narxlar.")}</p>${go(t("Смотреть ЖК", "TJMlarni ko‘rish"))}</a>
<a class="bc rv a-pop" style="--d:90ms" href="${href(l, "uslugi")}#biznes"><span class="ic">${ICON.biz}</span><h3>${t("Бизнес-центры и склады", "Biznes markazlar va omborlar")}</h3><p>${t("Офисы, торговые центры, коворкинги от собственников.", "Egalaridan ofislar, savdo markazlari, kovorkinglar.")}</p>${go(t("Подробнее", "Batafsil"))}</a>
<a class="bc rv a-pop" style="--d:180ms" href="${href(l, "uslugi")}#rieltory"><span class="ic">${ICON.users}</span><h3>${t("Рейтинг риэлторов", "Rieltorlar reytingi")}</h3><p>${t("Сортировка по рейтингу и числу объектов в работе.", "Reyting va ishdagi obyektlar soni bo‘yicha saralash.")}</p>${go(t("Подробнее", "Batafsil"))}</a>
<a class="bc rv a-pop" style="--d:270ms" href="${href(l, "uslugi")}#ceny"><span class="ic">${ICON.chart}</span><h3>${t("Цены на квартиры 2014-2024", "Kvartira narxlari 2014-2024")}</h3><p>${t("Средняя цена м² на вторичном рынке по районам Ташкента.", "Toshkent tumanlari bo‘yicha ikkilamchi bozorda m² o‘rtacha narxi.")}</p>${go(t("Подробнее", "Batafsil"))}</a>
</div>
</div></section>`;
}

function zkCard(l, z, k) {
  const t = T(l);
  return `<article class="zc rv a-grow" style="--d:${(k % 3) * 110}ms"><div class="bld" aria-hidden="true">${z.h.map((h, n) => `<i style="--h:${h};--k:${n}"></i>`).join("")}</div><span class="cls">${z.cls[l]}</span><h3>${t("ЖК", "TJM")} ${z.n}</h3><p>${l === "ru" ? "Ташкент" : "Toshkent"}, ${DISTRICTS[l][z.dist]}${z.dev ? ` · ${z.dev}` : ""} · ${t("срок сдачи", "topshirish")}: ${z.term[l]}</p>${z.rows.length ? `<table><tbody>${z.rows.map(([r, a, s]) => `<tr><td>${r}-${t("комн.", "xona")}${a ? ` · ${a} м²` : ""}</td><td class="num">${sp(s)} ${t("сум", "so‘m")}</td></tr>`).join("")}</tbody></table>` : ""}${z.left[l] ? `<p style="color:var(--gold)">${z.left[l]}</p>` : ""}</article>`;
}

function bandBlock(l) {
  const t = T(l);
  return `<section class="band" data-scene="band"><div class="band-ph" data-l="band" aria-hidden="true"></div><div class="wrap">
${head(t("novostroyka.shahar.uz", "novostroyka.shahar.uz"), t("Новостройки напрямую от застройщиков", "Yangi binolar to‘g‘ridan-to‘g‘ri quruvchilardan"), t("Класс дома, срок сдачи и цены по комнатам берём из вашей базы новостроек. Этажи растут, пока листаете.", "Uy sinfi, topshirish muddati va xonalar bo‘yicha narxlar yangi binolar bazangizdan olinadi. Siz varaqlaganingizda qavatlar o‘sadi."), `<a class="btn btn-gold btn-sm" href="${href(l, "novostroyki")}">${t("Все ЖК", "Barcha TJMlar")} ${ICON.arrow}</a>`)}
<div class="zk">${ZK.slice(0, 3).map((z, k) => zkCard(l, z, k)).join("")}</div>
</div></section>`;
}

function howBlock(l) {
  const t = T(l);
  const s = l === "ru"
    ? [["Расскажите, что ищете", "Купить или снять, район, комнаты, бюджет: четыре касания, без регистрации и капчи."], ["Риэлтор соберёт подборку", "Заявка уходит администратору ShahaR.Uz в Telegram, риэлторы портала подбирают актуальные объекты."], ["Смотрите и звоните", "При звонке назовите ID объекта, и риэлтор сразу поймёт, о какой квартире речь."]]
    : [["Nima qidirayotganingizni ayting", "Sotib olish yoki ijara, tuman, xonalar, byudjet: to‘rt bosish, ro‘yxatdan o‘tish va kapchasiz."], ["Rieltor tanlov tuzadi", "Ariza ShahaR.Uz administratoriga Telegramda boradi, portal rieltorlari dolzarb obyektlarni tanlaydi."], ["Ko‘ring va qo‘ng‘iroq qiling", "Qo‘ng‘iroqda obyekt ID raqamini ayting, shunda rieltor qaysi kvartira haqida gap ketayotganini darhol tushunadi."]];
  return `<section><div class="wrap">
${head(t("Подберём бесплатно", "Bepul tanlab beramiz"), t("Три шага до своей квартиры", "O‘z kvartirangizgacha uch qadam"), "", `<a class="btn btn-main btn-sm" href="${href(l, "podbor")}">${ICON.spark}${t("Начать подбор", "Tanlashni boshlash")}</a>`)}
<ol class="how">${s.map(([h, p], k) => `<li class="shift rv a-${["left", "rise", "slide"][k]}" data-shift="${[0.06, -0.04, 0.08][k]}" style="--d:${k * 100}ms"><h3>${h}</h3><p>${p}</p></li>`).join("")}</ol>
</div></section>`;
}

function regionsBlock(l) {
  const t = T(l);
  return `<section style="padding-top:0"><div class="wrap">
${head(t("Вся страна", "Butun mamlakat"), t("13 регионов, не только Ташкент", "13 hudud, faqat Toshkent emas"), t("Объявления из областных центров и городов: от Нукуса до Ферганы. У Immo и Uysot только новостройки Ташкента.", "Viloyat markazlari va shaharlardan e’lonlar: Nukusdan Farg‘onagacha. Immo va Uysot’da faqat Toshkentdagi yangi binolar bor."))}
<div class="regions rv a-rise">${REGIONS[l].map((r) => `<span><b>${r}</b></span>`).join("")}</div>
</div></section>`;
}

const OFFERS = [
  { ic: "bell", ru: ["Новые объекты в Telegram", "Сохранённый поиск у вас уходит на почту. Подписка в боте @Shaharuz_bot присылает подходящие объекты сразу.", "Растёт из вашего «Сохранить поиск» и бота"], uz: ["Yangi obyektlar Telegramda", "Saqlangan qidiruv hozir pochtaga ketadi. @Shaharuz_bot’dagi obuna mos obyektlarni darhol yuboradi.", "Sizning «Qidiruvni saqlash» va botingizdan o‘sadi"] },
  { ic: "shield", ru: ["Проверка объекта перед задатком", "Риэлтор смотрит кадастр, запреты и историю сделок до того, как покупатель отдал задаток. Платная услуга с вашей лицензией и полисом.", "Ваш текст: «отследят все предыдущие сделки… обеспечат законность»"], uz: ["Zakalatdan oldin obyektni tekshirish", "Xaridor zakalat berishidan oldin rieltor kadastr, taqiqlar va bitimlar tarixini tekshiradi. Litsenziya va polisingiz bilan pullik xizmat.", "Sizning matningiz: «barcha oldingi bitimlarni kuzatadi… qonuniylikni ta’minlaydi»"] },
  { ic: "video", ru: ["Онлайн-показ по видео", "Покупатель из Самарканда смотрит квартиру в Ташкенте по видеосвязи и записывается на время.", "У вас уже есть фильтр «Онлайн показ»"], uz: ["Video orqali onlayn ko‘rsatish", "Samarqanddagi xaridor Toshkentdagi kvartirani video aloqa orqali ko‘radi va vaqtga yoziladi.", "Sizda allaqachon «Onlayn ko‘rsatish» filtri bor"] },
  { ic: "crown", ru: ["VIP и поднятие объявления", "Размещение бесплатное, а за поднятие наверх и VIP платят через Click и Payme. Доход порталу.", "Как у OLX, но с вашей аудиторией"], uz: ["VIP va e’lonni ko‘tarish", "Joylashtirish bepul, yuqoriga ko‘tarish va VIP esa pullik, Click va Payme orqali to‘lanadi. Portalga daromad.", "OLX’dagidek, lekin sizning auditoriyangiz bilan"] },
  { ic: "chart", ru: ["Оценка квартиры за минуту", "Ввели район и площадь, получили вилку цены по вашим индексам цен 2014-2024. Продавец приходит размещаться к вам.", "У Uybor есть «Оценить квартиру», а у вас данные за 10 лет"], uz: ["Kvartirani bir daqiqada baholash", "Tuman va maydonni kiritasiz, 2014-2024 narx indekslaringiz bo‘yicha narx oralig‘ini olasiz. Sotuvchi joylashtirish uchun sizga keladi.", "Uybor’da «Kvartirani baholash» bor, sizda esa 10 yillik ma’lumot"] },
  { ic: "calc", ru: ["Калькулятор ипотеки на объекте", "Ввели взнос и срок, сразу видно платёж в месяц. Кнопка «Оформить ипотеку» ведёт к вашим специалистам.", "Доводит до вашей услуги «Оформить ипотеку»"], uz: ["Obyektda ipoteka kalkulyatori", "Badal va muddatni kiritasiz, oylik to‘lov darhol ko‘rinadi. «Ipoteka rasmiylashtirish» tugmasi mutaxassislaringizga olib boradi.", "Sizning «Ipoteka rasmiylashtirish» xizmatingizga olib boradi"] },
];
function offerBlock(l, title = true) {
  const t = T(l);
  return `<section class="dark" id="predlozhenie"><div class="wrap">
${title ? head(`<span class="ours">${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</span>`, t("Что добавить порталу и на чём зарабатывать", "Portalga nima qo‘shish va nimadan daromad qilish"), t("Этих услуг на shahar.uz пока нет. Каждая вырастает из того, что у вас уже есть.", "Bu xizmatlar hozircha shahar.uz’da yo‘q. Har biri sizda allaqachon bor narsadan o‘sadi.")) : ""}
<div class="offer">${OFFERS.map((o, k) => `<div class="oc rv a-${["rise", "tilt", "pop"][k % 3]}" style="--d:${(k % 3) * 90}ms"><span class="ic">${ICON[o.ic]}</span><h3>${o[l][0]}</h3><p>${o[l][1]}</p><small>${o[l][2]}</small></div>`).join("")}</div>
</div></section>`;
}

const installBlock = (l) => {
  const t = T(l);
  return `<div class="install rv a-rise" data-addon="pwa"><img src="${IMG}/icon-192.png" alt="" width="64" height="64"><p><b>${t("ShahaR.Uz на экране телефона", "ShahaR.Uz telefon ekranida")}</b>${t("Откроется как приложение: без App Store, без строки браузера, с нижним меню и избранным. Контакты видны даже без интернета.", "Ilova kabi ochiladi: App Store’siz, brauzer satrisiz, pastki menyu va sevimlilar bilan. Kontaktlar internetsiz ham ko‘rinadi.")}</p><button class="btn btn-gold btn-sm" type="button" data-install>${ICON.plus}${t("Добавить", "Qo‘shish")}</button>
<div class="ios" data-ios><b>${t("Как добавить на iPhone", "iPhone’ga qanday qo‘shish")}</b><ol><li>${t("Нажмите «Поделиться»", "«Ulashish» tugmasini bosing")} ${ICON.share.replace("<svg", '<svg width="16" height="16" style="vertical-align:-3px"')}</li><li>${t("Выберите «На экран „Домой“»", "«Bosh ekranga» bandini tanlang")}</li><li>${t("Нажмите «Добавить»", "«Qo‘shish»ni bosing")}</li></ol></div></div>`;
};

const finalBlock = (l) => {
  const t = T(l);
  return `<section class="final"><div class="wrap"><div class="box rv a-pop"><div class="rings" aria-hidden="true"><i></i><i></i><i></i></div>
<h2>${t("Не нашли подходящее? Подберём бесплатно", "Mosini topmadingizmi? Bepul tanlab beramiz")}</h2>
<p class="sub" style="margin-top:12px">${t("Риэлторы портала составят список актуальных объектов под ваши требования.", "Portal rieltorlari talablaringizga mos dolzarb obyektlar ro‘yxatini tuzadi.")}</p>
<div class="cta"><a class="btn btn-gold" href="${href(l, "podbor")}">${ICON.spark}${t("Подберём бесплатно", "Bepul tanlab beramiz")}</a><a class="btn btn-ghost" href="${F.admin}">${ICON.tg}${F.adminAt}</a></div>
</div></div></section>`;
};

/* ── Страницы ─────────────────────────────────────────────────────────── */
function home(l) {
  const t = T(l);
  const body = `${heroBlock(l)}
${statsBlock(l)}
${marqueeBlock(l)}
${latestBlock(l)}
${bentoBlock(l)}
${bandBlock(l)}
${howBlock(l)}
${regionsBlock(l)}
${offerBlock(l)}
<section style="padding-bottom:0"><div class="wrap">${installBlock(l)}</div></section>
${finalBlock(l)}`;
  return shell(l, "", {
    title: t("ShahaR.Uz · недвижимость по всему Узбекистану: купить, снять, новостройки", "ShahaR.Uz · butun O‘zbekiston bo‘ylab ko‘chmas mulk: sotib olish, ijara, yangi binolar"),
    desc: t("Квартиры, дома, дачи, офисы и земля в 13 регионах. Подберём бесплатно, ипотека, база новостроек, рейтинг риэлторов. С 1998 года, лицензия RR 0007.", "13 hududda kvartira, uy, dacha, ofis va yer. Bepul tanlab beramiz, ipoteka, yangi binolar bazasi, rieltorlar reytingi. 1998 yildan, RR 0007 litsenziyasi."),
  }, body);
}

function phead(l, crumb, kicker, h1, lead) {
  return `<section class="phead"><div class="wrap">
<ol class="crumbs"><li><a href="${href(l)}">ShahaR.Uz</a></li><li aria-current="page">${crumb}</li></ol>
${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h1 style="margin-top:12px">${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}
</div></section>`;
}

function katalog(l) {
  const t = T(l);
  const i = l === "ru" ? 0 : 1;
  const chip = (attr, v, label, on = false) => `<button type="button" class="chip" data-f="${attr}" data-v="${v}" aria-pressed="${on}">${label}</button>`;
  const body = `${phead(l, PAGE_NAMES.katalog[i], t("Продажа · аренда · посуточно", "Sotuv · ijara · kunbay"), t("Каталог объявлений", "E’lonlar katalogi"), t("Фильтры одной лентой под пальцем, без двенадцати полей в строку. Счётчик меняется сразу.", "Filtrlar barmoq ostida bitta lentada, bir qatorda o‘n ikki maydonsiz. Hisoblagich darhol o‘zgaradi."))}
<section style="padding-top:0"><div class="wrap">
<div class="filters" id="filters" role="toolbar" aria-label="${t("Фильтры", "Filtrlar")}">
${chip("deal", "buy", t("Купить", "Sotib olish"), true)}${chip("deal", "rent", t("Снять", "Ijara"))}${chip("deal", "day", t("Посуточно", "Kunbay"))}<span class="sep"></span>
${chip("type", "kv", t("Квартира", "Kvartira"))}${chip("type", "dacha", t("Дача", "Dacha"))}${chip("type", "dom", t("Дом", "Uy"))}<span class="sep"></span>
${["1", "2", "3", "4"].map((r) => chip("rooms", r, r + (r === "4" ? "+" : "") + t(" комн.", " xona"))).join("")}<span class="sep"></span>
${chip("mort", "1", t("Ипотека", "Ipoteka"))}${chip("fav", "1", `${ICON.heart.replace("<svg", '<svg width="16" height="16"')}${t("Избранное", "Sevimlilar")}`)}
</div>
<div class="cat-bar"><p id="cat-n" aria-live="polite"></p><label class="s-f" style="min-width:200px"><span>${t("Район", "Tuman")}</span><select id="cat-dist"><option value="">${t("Все районы и регионы", "Barcha tuman va hududlar")}</option>${DISTRICTS[l].map((d, k) => `<option value="${k}">${d}</option>`).join("")}</select></label></div>
<div class="grid g3" id="cat">${LISTINGS.map((x, k) => cardBox(l, x, k, ["key", "tilt", "pop", "rise"][k])).join("")}</div>
<div class="empty" id="cat-empty" hidden><p>${t("По этим фильтрам в прототипе объектов нет: здесь только четыре последних объявления с shahar.uz. На сайте фильтр пойдёт по всей базе.", "Bu filtrlar bo‘yicha prototipda obyekt yo‘q: bu yerda shahar.uz’dagi faqat to‘rtta so‘nggi e’lon bor. Saytda filtr butun baza bo‘yicha ishlaydi.")}</p><div class="cta" style="justify-content:center"><a class="btn btn-main btn-sm" href="${href(l, "podbor")}">${ICON.spark}${t("Подберём бесплатно", "Bepul tanlab beramiz")}</a></div></div>
<p class="more-note">${t("В прототипе четыре последних объявления с вашей главной (ID 149645, 149644, 149727, 149381). Фото и цены такие же, как на shahar.uz 07.10.2026.", "Prototipda bosh sahifangizdagi to‘rtta so‘nggi e’lon bor (ID 149645, 149644, 149727, 149381). Foto va narxlar 07.10.2026 dagi shahar.uz’dagidek.")}</p>
</div></section>
${finalBlock(l)}`;
  return shell(l, "katalog", {
    title: t("Каталог недвижимости: квартиры, дома, дачи в Ташкенте и регионах | ShahaR.Uz", "Ko‘chmas mulk katalogi: Toshkent va hududlarda kvartira, uy, dacha | ShahaR.Uz"),
    desc: t("Купить, снять или посуточно: фильтры по типу, комнатам, району и ипотеке. Цена в $, сумах и евро.", "Sotib olish, ijara yoki kunbay: tur, xonalar, tuman va ipoteka bo‘yicha filtrlar. Narx $, so‘m va yevroda."),
  }, body);
}

const DESC = {
  ru: "ПРОДАЁТСЯ 2-комнатная квартира в ЖК «O‘z Mahal».\nЗастройщик: «Golden House». Район: Мирзо-Улугбекский, ул. Катта Дархан. Ориентир: ул. Аккурганская (Новомосковская).\n\nКласс жилья: бизнес. Этаж 10 из 14, общая площадь 58 м², есть балкон. Монолитно-каркасный дом, индивидуальное отопление (двухконтурный котёл). Отличный свежий ремонт, квартира полностью укомплектована мебелью и бытовой техникой: «заезжай и живи!». Кадастр есть.\n\nЗакрытый зелёный двор без машин с детскими площадками и беседками, вентилируемые фасады с шумоизоляцией, охрана 24/7, видеонаблюдение, IP-домофония, подземный паркинг. На первых этажах кафе, магазины, аптеки.",
  uz: "«O‘z Mahal» TJMda 2 xonali kvartira SOTILADI.\nQuruvchi: «Golden House». Tuman: Mirzo Ulug‘bek, Katta Darxon ko‘chasi. Mo‘ljal: Oqqo‘rg‘on (Novomoskovskaya) ko‘chasi.\n\nUy-joy sinfi: biznes. 14 qavatdan 10-qavat, umumiy maydoni 58 m², balkon bor. Monolit-karkas uy, individual isitish (ikki konturli qozon). Ajoyib yangi ta’mir, kvartira mebel va maishiy texnika bilan to‘liq jihozlangan: «kiring va yashang!». Kadastr bor.\n\nMashinasiz yopiq yashil hovli, bolalar maydonchalari va shiyponlar, shovqin izolyatsiyali ventilyatsiyalanadigan fasadlar, 24/7 qo‘riqlash, videokuzatuv, IP-domofon, yer osti avtoturargohi. Birinchi qavatlarda kafe, do‘konlar, dorixonalar.",
};

function obekt(l) {
  const t = T(l);
  const i = l === "ru" ? 0 : 1;
  const x = LISTINGS[0];
  const pm = Math.round(x.usd / x.area);
  /* Платёж до первого пересчёта в браузере: взнос 30%, 15 лет, 18% годовых, как стоят ползунки. */
  const pay0 = Math.round((x.usd * 0.7 * 0.015) / (1 - Math.pow(1.015, -180)));
  const infra = [["baby", t("Детсад", "Bog‘cha")], ["school", t("Школы", "Maktablar")], ["uni", t("ВУЗы", "OTMlar")], ["shop", t("Магазины", "Do‘konlar")], ["mall", t("ТРЦ", "SEM")], ["hosp", t("Больницы", "Kasalxonalar")], ["hosp", t("Поликлиники", "Poliklinikalar")], ["pill", t("Аптеки", "Dorixonalar")], ["cafe", t("Кафе", "Kafelar")], ["cafe", t("Рестораны", "Restoranlar")]];
  const dots = [[30, 26], [70, 34], [22, 64], [62, 72], [80, 58], [44, 18], [50, 84], [16, 44]];
  const body = `${phead(l, `ID ${x.id}`, `${t("Продажа", "Sotuv")} · ${t("Ташкент", "Toshkent")}, ${DISTRICTS[l][x.dist]}`, `${x[l].t}, ${x.area} м² · ${x[l].mark}`, "")}
<section style="padding-top:0"><div class="wrap"><div class="obj">
<div>
<div class="gal rv a-pop"><div class="gal-t" id="gal">${Array.from({ length: x.photos }, (_, k) => `<img src="${IMG}/l${x.id}-${k + 1}.webp" alt="${esc(`${x[l].t}, ${t("фото", "foto")} ${k + 1}`)}" width="720" height="960" ${k ? 'loading="lazy"' : ""}>`).join("")}</div><span class="gal-n num" id="gal-n">1 / ${x.photos}</span><button class="fav" type="button" data-fav="${x.id}" aria-pressed="false" aria-label="${t("В избранное", "Sevimlilarga")}" data-addon="fav">${ICON.heart}</button></div>
<div class="thumbs" id="thumbs">${Array.from({ length: x.photos }, (_, k) => `<button type="button" data-k="${k}" aria-current="${k === 0}" aria-label="${t("Фото", "Foto")} ${k + 1}"><img src="${IMG}/l${x.id}-${k + 1}.webp" alt="" loading="lazy"></button>`).join("")}</div>
<div class="params rv a-rise"><div><b>${x.rooms}</b><span>${t("комнаты", "xona")}</span></div><div><b>${x.area} м²</b><span>${t("общая площадь", "umumiy maydon")}</span></div><div><b>${x.floor}</b><span>${t("этаж", "qavat")}</span></div><div><b>${t("Евро", "Yevro")}</b><span>${t("ремонт", "ta’mir")}</span></div></div>
<div class="panel rv a-rise" style="margin-top:16px"><h2 style="font-size:24px">${t("Описание", "Tavsif")}</h2><p class="desc">${DESC[l]}</p><p class="src">${t("Текст из объявления на shahar.uz, ID", "Matn shahar.uz’dagi e’londan olingan, ID")} ${x.id}.</p></div>
<div class="panel rv a-rise" style="margin-top:16px"><h2 style="font-size:24px">${t("Инфраструктура рядом", "Atrofdagi infratuzilma")}</h2><p class="sub">${t("Радиус поиска: 1500 м от объекта. Как у вас на сайте, только картой и списком вместо строки эмодзи.", "Qidiruv radiusi: obyektdan 1500 m. Saytingizdagidek, faqat emoji qatori o‘rniga xarita va ro‘yxat.")}</p>
<div class="radar" aria-hidden="true"><b></b>${dots.map(([a, b]) => `<i style="left:${a}%;top:${b}%"></i>`).join("")}</div>
<div class="infra">${infra.map(([ic, n]) => `<span>${ICON[ic]}${n}</span>`).join("")}</div>
<p class="src">${t("Точки на схеме для примера: на сайте они встанут по карте вокруг объекта. Адрес на карте указан условно, как и у вас.", "Sxemadagi nuqtalar misol uchun: saytda ular obyekt atrofidagi xarita bo‘yicha joylashadi. Xaritadagi manzil shartli, xuddi sizdagidek.")}</p></div>
</div>
<aside class="side">
<div class="panel rv a-slide"><div class="price"><b class="num" data-p="${x.usd}" style="font-size:36px">${usd(x.usd)}</b></div><p class="pr num" data-pm="${pm}" style="color:var(--fg2)">${usd(pm)}/м²</p>
<div class="cur3"><div><span>${t("В сумах", "So‘mda")}</span><b class="num">${sp(Math.round(x.usd * RATE.sum))} ${t("сум", "so‘m")}</b></div><div><span>${t("В евро", "Yevroda")}</span><b class="num">€${sp(Math.round(x.usd * RATE.eur))}</b></div></div>
<div class="cta" style="margin-top:16px"><a class="btn btn-main" style="width:100%" href="${F.admin}">${ICON.tg}${t("Написать по объекту", "Obyekt bo‘yicha yozish")}</a><a class="btn btn-ghost" style="width:100%" href="${href(l, "podbor")}">${ICON.spark}${t("Подобрать похожие", "O‘xshashlarini tanlash")}</a></div>
<p class="src">${t("При звонке назовите ID", "Qo‘ng‘iroqda ID ni ayting")} <b class="num">${x.id}</b>. ${t("Пожалуйста, скажите, что нашли этот объект на ShahaR.Uz.", "Iltimos, bu obyektni ShahaR.Uz’da topganingizni ayting.")}</p></div>
<div class="panel rv a-slide" style="--d:120ms" data-addon="mort"><h2 style="font-size:24px">${t("Ипотека на этот объект", "Bu obyektga ipoteka")}</h2><span class="ours" style="margin-top:8px">${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</span>
<form class="mort" id="mort" data-usd="${x.usd}"><label>${t("Первый взнос", "Boshlang‘ich badal")} · <output id="m-dv">30%</output><input type="range" id="m-d" min="20" max="70" step="5" value="30"></label><label>${t("Срок", "Muddat")} · <output id="m-yv">15</output> ${t("лет", "yil")}<input type="range" id="m-y" min="5" max="20" step="1" value="15"></label><label>${t("Ставка, % годовых", "Stavka, yillik %")} · <output id="m-rv">18</output>%<input type="range" id="m-r" min="10" max="26" step="1" value="18"></label>
<div class="pay"><span>${t("Платёж в месяц", "Oylik to‘lov")}</span><b class="num" id="m-pay">${usd(pay0)}</b></div>
<p class="src">${t("Ставку подставьте свою: у банков она разная. Кнопка ведёт в вашу услугу «Оформить ипотеку».", "Stavkani o‘zingiznikiga almashtiring, banklarda u har xil. Tugma «Ipoteka rasmiylashtirish» xizmatingizga olib boradi.")}</p>
<a class="btn btn-gold" href="${href(l, "uslugi")}#ipoteka">${ICON.pct}${t("Оформить ипотеку", "Ipoteka rasmiylashtirish")}</a></form></div>
</aside>
</div></div></section>
<section style="padding-top:0"><div class="wrap">${head(t("Ещё объекты", "Yana obyektlar"), t("Похожие объявления", "O‘xshash e’lonlar"), "")}<div class="grid g3">${LISTINGS.slice(1).map((y, k) => cardBox(l, y, k)).join("")}</div></div></section>`;
  return shell(l, "obekt", {
    title: t(`Продажа: 2-комн. квартира 58 м², Мирзо-Улугбек, ЖК «O‘z Mahal», ${usd(x.usd)} | ShahaR.Uz`, `Sotuv: 2 xonali kvartira 58 m², Mirzo Ulug‘bek, «O‘z Mahal» TJM, ${usd(x.usd)} | ShahaR.Uz`),
    desc: t("10/14 этаж, евроремонт, мебель и техника, кадастр есть. Инфраструктура в радиусе 1500 м, цена в $, сумах и евро. ID 149645.", "10/14 qavat, yevrota’mir, mebel va texnika, kadastr bor. 1500 m radiusdagi infratuzilma, narx $, so‘m va yevroda. ID 149645."),
  }, body);
}

function novostroyki(l) {
  const t = T(l);
  const i = l === "ru" ? 0 : 1;
  const body = `<div class="band" style="padding:0"><div class="band-ph" data-l="band" aria-hidden="true"></div><div class="wrap" style="padding-top:32px;padding-bottom:48px">
<ol class="crumbs" style="color:var(--on2)"><li><a href="${href(l)}">ShahaR.Uz</a></li><li aria-current="page">${PAGE_NAMES.novostroyki[i]}</li></ol>
<span class="kicker" style="color:var(--on2)"><i></i>${t("База новостроек от застройщиков", "Quruvchilardan yangi binolar bazasi")}</span><h1 style="margin-top:12px;max-width:14em">${t("Новостройки Ташкента: класс, срок, цены по комнатам", "Toshkent yangi binolari: sinf, muddat, xonalar bo‘yicha narxlar")}</h1>
<div class="filters" style="position:relative;top:0;background:none;backdrop-filter:none;-webkit-backdrop-filter:none" role="toolbar" aria-label="${t("Класс дома", "Uy sinfi")}" id="zk-f">${[["", t("Все", "Hammasi")], ["Комфорт", t("Комфорт", "Komfort")], ["Бизнес", t("Бизнес", "Biznes")], ["Премиум", t("Премиум", "Premium")]].map(([v, n], k) => `<button type="button" class="chip" data-cls="${v}" aria-pressed="${k === 0}">${n}</button>`).join("")}</div>
<div class="zk" id="zk">${ZK.map((z, k) => zkCard(l, z, k).replace('<article class="zc', `<article data-cls="${z.cls.ru}" class="zc`)).join("")}</div>
<p class="src" style="margin-top:24px">${t("Данные из вашей базы novostroyka.shahar.uz как есть на 07.10.2026. У части ЖК сроки и цены давно не обновлялись. С админкой их правит менеджер, а не программист.", "Ma’lumotlar 07.10.2026 holatiga novostroyka.shahar.uz bazangizdan olingan. Ayrim TJMlarda muddat va narxlar ancha yangilanmagan. Admin panel bilan ularni dasturchi emas, menejer tuzatadi.")}</p>
<div class="cta"><a class="btn btn-gold" href="${F.newChannel}">${ICON.tg}${t("Канал новостроек", "Yangi binolar kanali")} @cityshahar</a></div>
</div></div>
${finalBlock(l)}`;
  return shell(l, "novostroyki", {
    title: t("Новостройки Ташкента от застройщиков: классы, сроки сдачи, цены | ShahaR.Uz", "Toshkent yangi binolari quruvchilardan: sinflar, topshirish muddatlari, narxlar | ShahaR.Uz"),
    desc: t("Darkhan Avenue, Aviasozlar Plaza, Bogi Shamol, Mirabad Avenue и другие ЖК: класс, район, срок сдачи и цены по комнатам.", "Darkhan Avenue, Aviasozlar Plaza, Bogi Shamol, Mirabad Avenue va boshqa TJMlar: sinf, tuman, topshirish muddati va xonalar bo‘yicha narxlar."),
  }, body);
}

function uslugi(l) {
  const t = T(l);
  const i = l === "ru" ? 0 : 1;
  const li = (arr) => `<ul>${arr.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>`;
  const sv = (id, ic, h, p, items, q, k) => `<article class="sv rv a-${["rise", "tilt", "pop", "slide"][k % 4]}" id="${id}" style="--d:${(k % 2) * 90}ms"><span class="ic">${ICON[ic]}</span><h2>${h}</h2><p>${p}</p>${items ? li(items) : ""}${q ? `<q>${q}</q>` : ""}</article>`;
  const body = `${phead(l, PAGE_NAMES.uslugi[i], t("Всё, что уже есть на shahar.uz", "shahar.uz’da allaqachon bor hamma narsa"), t("Услуги ShahaR.Uz", "ShahaR.Uz xizmatlari"), t("Своими словами компании, с сайта и Telegram-канала. Наши предложения ниже, отдельным блоком.", "Kompaniyaning o‘z so‘zlari bilan, sayt va Telegram kanalidan. Bizning takliflarimiz pastda, alohida blokda."))}
<section style="padding-top:0"><div class="wrap"><div class="svc">
${sv("podbor", "spark", t("Подберём бесплатно", "Bepul tanlab beramiz"), t("Заполните заявку с пожеланиями. Риэлторы и агенты портала составят список актуальных объектов.", "Istaklaringiz bilan ariza to‘ldiring. Portal rieltorlari va agentlari dolzarb obyektlar ro‘yxatini tuzadi."), null, t("Вы устали искать среди множества предложений? Мы бесплатно поможем Вам подобрать именно тот объект недвижимости, который Вам нужен!", "Ko‘plab takliflar orasidan qidirishdan charchadingizmi? Sizga aynan kerakli ko‘chmas mulk obyektini bepul tanlab beramiz!"), 0)}
${sv("razmestit", "plus", t("Разместить объявление бесплатно", "E’lonni bepul joylashtirish"), t("Регистрация как агент или собственник, объект с фото и видео, на карте и с панорамой улицы.", "Agent yoki ega sifatida ro‘yxatdan o‘tish, foto va video bilan obyekt, xaritada va ko‘cha panoramasi bilan."), [t("Объявление автоматически уходит на порталы партнёров GDEETOTDOM.RU, NERS.RU и другие", "E’lon avtomatik ravishda GDEETOTDOM.RU, NERS.RU va boshqa hamkor portallarga ketadi"), t("Telegram-бот @Shaharuz_bot и канал @shaharuzchannel", "@Shaharuz_bot Telegram boti va @shaharuzchannel kanali"), t("Полезные статьи: как фотографировать квартиру и писать продающий текст", "Foydali maqolalar: kvartirani qanday suratga olish va sotuvchi matn yozish")], null, 1)}
${sv("ipoteka", "pct", t("Оформить ипотеку", "Ipoteka rasmiylashtirish"), t("Наши специалисты помогут собрать необходимые документы для подачи в банк.", "Mutaxassislarimiz bankka topshirish uchun zarur hujjatlarni yig‘ishga yordam beradi."), null, null, 2)}
${sv("arenda", "home", t("Снять квартиру", "Kvartira ijaraga olish"), t("Краткая форма заявки, чтобы не листать сотни объявлений. Посуточно и почасово тоже здесь.", "Yuzlab e’lonlarni varaqlash o‘rniga qisqa ariza formasi. Kunbay va soatbay ham shu yerda."), null, null, 3)}
${sv("rieltory", "users", t("Риэлторы: рейтинг и контакты", "Rieltorlar: reyting va kontaktlar"), t("Сортировка по рейтингу, имени и числу объектов в работе. Сертифицированные риэлторы проверят историю сделок и сопроводят оформление.", "Reyting, ism va ishdagi obyektlar soni bo‘yicha saralash. Sertifikatlangan rieltorlar bitimlar tarixini tekshiradi va rasmiylashtirishda hamrohlik qiladi."), null, null, 0)}
${sv("biznes", "biz", t("Бизнес и торговые центры", "Biznes va savdo markazlari"), t("Коммерческая недвижимость от собственников: бизнес-центры, торговые центры, склады и коворкинги в аренду.", "Egalaridan tijorat ko‘chmas mulki: biznes markazlar, savdo markazlari, ijaraga omborlar va kovorkinglar."), null, null, 1)}
${sv("ceny", "chart", t("Цены на квартиры 2014-2024", "Kvartira narxlari 2014-2024"), t("Индексы средней стоимости квартир и цены за м² на вторичном рынке Ташкента в разрезе районов.", "Toshkent ikkilamchi bozorida tumanlar kesimida kvartiralarning o‘rtacha narx indekslari va m² narxi."), [t("Схема налоговых зон", "Soliq zonalari sxemasi"), t("Махаллинские комитеты", "Mahalla qo‘mitalari"), t("Справочники", "Ma’lumotnomalar")], null, 2)}
${sv("licenziya", "shield", t("Лицензия и страховка", "Litsenziya va sug‘urta"), t("Услуги лицензированы", "Xizmatlar litsenziyalangan") + ` ${F.lic} ${F.licDate[l]}. ` + t("Полис страхования ответственности риэлторов", "Rieltorlar javobgarligini sug‘urtalash polisi") + ` ${F.policy} ${F.policyDate[l]}.`, null, null, 3)}
</div></div></section>
${offerBlock(l)}
<section style="padding-bottom:0"><div class="wrap">${installBlock(l)}</div></section>
${finalBlock(l)}`;
  return shell(l, "uslugi", {
    title: t("Услуги ShahaR.Uz: подбор бесплатно, ипотека, размещение, риэлторы", "ShahaR.Uz xizmatlari: bepul tanlash, ipoteka, joylashtirish, rieltorlar"),
    desc: t("Подберём объект бесплатно, поможем с ипотекой, разместим объявление бесплатно и на порталах партнёров. Лицензия RR 0007, полис страхования риэлторов.", "Obyektni bepul tanlab beramiz, ipotekada yordam beramiz, e’lonni bepul va hamkor portallarda joylashtiramiz. RR 0007 litsenziyasi, rieltorlar sug‘urta polisi."),
  }, body);
}

function podbor(l) {
  const t = T(l);
  const i = l === "ru" ? 0 : 1;
  const opt = (name, value, label, extra = "") => `<label class="opt"><input type="radio" name="${name}" value="${esc(value)}"${extra}><span>${label}</span></label>`;
  const body = `${phead(l, PAGE_NAMES.podbor[i], t("Бесплатно · без регистрации", "Bepul · ro‘yxatdan o‘tmasdan"), t("Подберём объект под ваш запрос", "So‘rovingizga mos obyekt tanlab beramiz"), t("Три шага, и заявка уже у администратора ShahaR.Uz в Telegram. Риэлторы портала пришлют подборку.", "Uch qadamdan keyin ariza ShahaR.Uz administratorida, Telegramda. Portal rieltorlari tanlovni yuborishadi."))}
<section style="padding-top:0"><div class="wrap"><form class="book" id="book" novalidate>
<div>
<fieldset class="step rv a-rise"><h3><i>1</i>${t("Что нужно", "Nima kerak")}</h3>
<div class="opts">${[t("Купить", "Sotib olish"), t("Снять", "Ijaraga olish"), t("Посуточно", "Kunbay"), t("Продать или сдать", "Sotish yoki ijaraga berish")].map((v, k) => opt("deal", v, v, k === 0 ? " checked" : "")).join("")}</div>
<div class="opts">${[t("Квартира", "Kvartira"), t("Дом", "Uy"), t("Дача", "Dacha"), t("Новостройка", "Yangi bino"), t("Офис", "Ofis"), t("Земля", "Yer"), t("Коммерческая", "Tijorat")].map((v) => opt("type", v, v)).join("")}</div></fieldset>
<fieldset class="step rv a-rise" style="--d:90ms"><h3><i>2</i>${t("Где и какая", "Qayerda va qanday")}</h3>
<div class="opts">${[...DISTRICTS[l], t("Другой регион", "Boshqa hudud")].map((v) => opt("where", v, v)).join("")}</div>
<div class="opts">${["1", "2", "3", "4+"].map((v) => opt("rooms", v, v + t(" комн.", " xona"))).join("")}</div>
<div class="field"><label for="budget">${t("Бюджет", "Byudjet")}</label><input id="budget" name="budget" inputmode="numeric" placeholder="${t("Например, до 70 000 $", "Masalan, 70 000 $ gacha")}" maxlength="40"></div>
<div class="field"><label for="wish">${t("Пожелания", "Istaklar")}</label><textarea id="wish" name="wish" maxlength="400" placeholder="${t("Своими словами: рядом со школой, не первый этаж, с ремонтом…", "O‘z so‘zlaringiz bilan: maktab yaqinida, birinchi qavat emas, ta’mirli…")}"></textarea></div></fieldset>
<fieldset class="step rv a-rise" style="--d:180ms"><h3><i>3</i>${t("Куда прислать подборку", "Tanlovni qayerga yuborish")}</h3>
<div class="two"><div class="field"><label for="nm">${t("Как к вам обращаться", "Sizga qanday murojaat qilaylik")}</label><input id="nm" name="nm" autocomplete="name" maxlength="60"></div>
<div class="field"><label for="ph">${t("Телефон", "Telefon")}</label><input id="ph" name="ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998" maxlength="20"></div></div></fieldset>
</div>
<aside class="sum">
<div class="step rv a-slide">
<h3>${t("Ваша заявка", "Arizangiz")}</h3>
<div data-addon="tg"><div class="msg" aria-live="polite"><div class="msg-h">${ICON.tg}<span>ShahaR.Uz · ${t("заявки", "arizalar")}</span></div><span id="msg"></span><time id="msg-t"></time></div>
<p class="src">${t("Так заявка придёт администратору в Telegram: сразу, без почты и капчи.", "Ariza administratorga Telegramda shunday keladi: darhol, pochta va kapchasiz.")} <span class="ours">${t("Доп «Заявки в Telegram»", "«Arizalar Telegramga» qo‘shimchasi")}</span></p></div>
<div class="cta"><button class="btn btn-main" type="submit" style="width:100%">${ICON.tg}${t("Отправить в Telegram", "Telegramga yuborish")}</button></div>
<p class="err" id="err" role="alert" hidden></p>
<p class="done" id="done" role="status" hidden></p>
</div>
</aside>
</form></div></section>`;
  return shell(l, "podbor", {
    title: t("Подберём квартиру или дом бесплатно: заявка риэлторам ShahaR.Uz", "Kvartira yoki uyni bepul tanlab beramiz: ShahaR.Uz rieltorlariga ariza"),
    desc: t("Купить, снять или посуточно: укажите район, комнаты и бюджет, и заявка уйдёт администратору ShahaR.Uz в Telegram.", "Sotib olish, ijara yoki kunbay: tuman, xonalar va byudjetni tanlang, ariza ShahaR.Uz administratoriga Telegramda boradi."),
  }, body);
}

function offline(l) {
  const t = T(l);
  const body = `<section class="phead"><div class="wrap">
<span class="kicker"><i></i>${t("Нет интернета", "Internet yo‘q")}</span>
<h1 style="margin-top:12px">${t("Страница не загрузилась, но избранное и контакты с вами", "Sahifa yuklanmadi, lekin sevimlilar va kontaktlar siz bilan")}</h1>
<p class="lead">${t("Открытые раньше страницы и объекты сохранены в телефоне. Когда сеть вернётся, напишите нам в Telegram.", "Avval ochilgan sahifalar va obyektlar telefonda saqlangan. Tarmoq qaytganda, bizga Telegramda yozing.")}</p>
<div class="cta"><a class="btn btn-main" href="${F.admin}">${ICON.tg}${F.adminAt}</a><a class="btn btn-ghost" href="${href(l)}">${ICON.home}${t("На главную", "Bosh sahifaga")}</a></div>
<div class="panel" style="margin-top:32px"><p><b>ShahaR.Uz</b> · ${t("с 1998 года", "1998 yildan")} · ${t("лицензия", "litsenziya")} ${F.lic}</p><p class="src">${t("Канал объявлений", "E’lonlar kanali")} @shaharuzchannel · ${t("новостройки", "yangi binolar")} @cityshahar</p></div>
</div></section>`;
  return shell(l, "offline", {
    title: t("Нет интернета · ShahaR.Uz", "Internet yo‘q · ShahaR.Uz"),
    desc: t("Контакты ShahaR.Uz без интернета.", "ShahaR.Uz kontaktlari internetsiz."),
  }, body);
}

/* ── «Что дальше»: было / стало, конструктор, конкуренты, фото ────────── */
const PHOTO_CREDITS = [
  ["Aerial view of Tashkent, 2026-05-06 (3)", "Bestalex", "CC0", "https://commons.wikimedia.org/wiki/File:Aerial_view_of_Tashkent,_2026-05-06_(3).jpg"],
  ["Tashkent, Tashkent City from Hotel Shodlik Palace", "Carl Ha", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Tashkent,_Tashkent_City_from_Hotel_Shodlik_Palace.jpg"],
];

function previews(l) {
  const t = T(l);
  const row = (a, b) => `<div class="pv-row"><span>${a}</span><span>${b}</span></div>`;
  return {
    admin: `${row(t("На модерации", "Moderatsiyada"), "12")}${row(t("Жалобы", "Shikoyatlar"), "2")}${row(t("Риэлторы", "Rieltorlar"), t("рейтинг", "reyting"))}`,
    import: `${row("shahar.uz/kvartira/…-149645", "→")}${row(t("Фото, ID, риэлтор", "Foto, ID, rieltor"), "✓")}`,
    agent: `${row(t("Мои объекты", "Mening obyektlarim"), "ID 149645")}${row(t("Просмотры за неделю", "Haftalik ko‘rishlar"), t("по дням", "kunlar bo‘yicha"))}${row(t("Добавить объект", "Obyekt qo‘shish"), "+")}`,
    vip: `${row(t("Поднять наверх", "Yuqoriga ko‘tarish"), "Click · Payme")}${row("VIP", t("ваша цена", "sizning narxingiz"))}`,
    alerts: `<div class="msg" style="margin:0"><div class="msg-h">${ICON.tg}<span>@Shaharuz_bot</span></div>${t("Новый объект по вашему поиску: 2-комн., Мирзо-Улугбек, до 130 000 $", "Qidiruvingiz bo‘yicha yangi obyekt: 2 xonali, Mirzo Ulug‘bek, 130 000 $ gacha")}</div>`,
    seo: `<div class="pv-row"><span><b style="margin:0">${t("2-комнатные квартиры в Юнусабаде | ShahaR.Uz", "Yunusoboddagi 2 xonali kvartiralar | ShahaR.Uz")}</b>${t("Продажа от собственников и риэлторов, цены в $ и сумах.", "Ega va rieltorlardan sotuv, narxlar $ va so‘mda.")}</span></div>`,
  };
}

function plan(l) {
  const t = T(l);
  const i = l === "ru" ? 0 : 1;
  const pv = previews(l);
  const ba = (was, now, cap, capB) => `<figure><div class="ba-box" data-ba><img src="${IMG}/${now}" alt="${t("Стало", "Bo‘ldi")}" loading="lazy"><div class="was"><img src="${IMG}/${was}" alt="${t("Было", "Edi")}" loading="lazy"></div><span class="tag a">${t("Было", "Edi")}</span><span class="tag b">${t("Стало", "Bo‘ldi")}</span><div class="knob"><i>${ICON.arrows}</i></div><input type="range" min="0" max="100" value="50" aria-label="${t("Сдвиньте шторку: было или стало", "Pardani suring: edi yoki bo‘ldi")}"></div><figcaption><span>${cap}</span><span>${capB}</span></figcaption></figure>`;
  const comp = [
    ["OLX.uz", t("Подписку на поиск и избранное берём, но в Telegram, а не в отдельном приложении.", "Qidiruvga obuna va sevimlilarni olamiz, lekin alohida ilovada emas, Telegramda.")],
    ["Uybor.uz", t("Берём готовые подборки «1-комн. до 250 млн» и «Оценить квартиру», но считаем по вашим индексам цен.", "«250 mln gacha 1 xonali» tayyor tanlovlari va «Kvartirani baholash»ni olamiz, lekin narx indekslaringiz bo‘yicha hisoblaymiz.")],
    ["Realt24.uz", t("Вкладки «Купить · Аренда · Посуточно» прямо в поиске и цена в UZS / $ / €.", "Qidiruvning o‘zida «Sotib olish · Ijara · Kunbay» tablari va UZS / $ / € narx.")],
    ["Immo.uz", t("Четыре понятных входа на первом экране: найти, ипотека, новостройки, разместить.", "Birinchi ekranda to‘rtta tushunarli kirish: topish, ipoteka, yangi binolar, joylashtirish.")],
    ["Zillow · Rightmove", t("Поиск в центре первого экрана, уведомления о новых объектах, отметка «цена снижена».", "Qidiruv birinchi ekranning markazida, yangi obyektlar haqida xabarnomalar, «narx tushdi» belgisi.")],
    ["Cian", t("Ипотечный калькулятор прямо в карточке объекта.", "Obyekt kartochkasining o‘zida ipoteka kalkulyatori.")],
  ];
  const usp = [
    [t("С 1998 года, лицензия и полис на первом экране", "1998 yildan, litsenziya va polis birinchi ekranda"), t("Ни у одного из шести конкурентов нет на сайте ни лицензии, ни страховки риэлторов. У вас они спрятаны в подвале.", "Oltita raqobatchidan birortasining saytida na litsenziya, na rieltorlar sug‘urtasi bor. Sizda ular pastki qismda yashiringan.")],
    [t("Вся страна и 16 типов объектов", "Butun mamlakat va 16 obyekt turi"), t("13 регионов, от чайхоны почасово до санатория. У Immo и Uysot только новостройки Ташкента.", "13 hudud, soatbay choyxonadan sanatoriygacha. Immo va Uysot’da faqat Toshkent yangi binolari.")],
    [t("Главная кнопка: «Подберём бесплатно»", "Asosiy tugma: «Bepul tanlab beramiz»"), t("Живой риэлтор вместо ленты: ваше обещание доходит до Telegram администратора с готовым текстом.", "Lenta o‘rniga jonli rieltor: va’dangiz tayyor matn bilan administrator Telegramiga yetib boradi.")],
    [t("Инфраструктура 1,5 км на каждом объекте", "Har bir obyektda 1,5 km infratuzilma"), t("Детсад, школы, аптеки, ТРЦ отдельным блоком, а не строкой эмодзи. У конкурентов этого на карточке нет.", "Bog‘cha, maktablar, dorixonalar, SEM emoji qatori emas, alohida blok ko‘rinishida. Raqobatchilarning kartochkasida bu yo‘q.")],
    [t("Одно размещение, несколько порталов", "Bitta joylashtirish, bir nechta portal"), t("Объявление уходит и на GDEETOTDOM.RU, NERS.RU, так что продавцу не нужно размещаться трижды.", "E’lon GDEETOTDOM.RU, NERS.RU’ga ham ketadi, sotuvchiga uch marta joylashtirish shart emas.")],
    [t("Приложение без App Store", "App Store’siz ilova"), t("Иконка на телефоне, избранное, нижнее меню. OLX, Uybor и Uysot для этого просят ставить приложение.", "Telefonda belgi, sevimlilar, pastki menyu. OLX, Uybor va Uysot buning uchun ilova o‘rnatishni so‘raydi.")],
  ];
  const body = `${phead(l, PAGE_NAMES.plan[i], `<span class="ours">${t("Предложение DevUz Studio для ShahaR.Uz", "DevUz Studio’ning ShahaR.Uz uchun taklifi")}</span>`, t("Было и стало", "Edi va bo‘ldi"), t("Слева shahar.uz сегодня, справа этот прототип. Тяните шторку.", "Chapda bugungi shahar.uz, o‘ngda shu prototip. Pardani torting."))}
<section style="padding-top:0"><div class="wrap">
<div class="ba">
${ba("ba-old-d.webp", "ba-new-d.webp", t("Компьютер · первый экран", "Kompyuter · birinchi ekran"), t("было: «Недвижимость в Ташкентская»", "edi: «Недвижимость в Ташкентская»"))}
${ba("ba-old-m.webp", "ba-new-m.webp", t("Телефон · первый экран", "Telefon · birinchi ekran"), t("было: уменьшенная копия", "edi: kichraytirilgan nusxa"))}
</div>
<div class="grid g3" style="margin-top:48px">
<div class="note rv a-rise"><h3>${t("Было: ошибка в первой строке", "Edi: birinchi qatorda xato")}</h3><p>${t("«Недвижимость в Ташкентская», а ниже «в Ташкентскаяе». Покупатель с первого взгляда видит, что сайт не вычитали.", "«Недвижимость в Ташкентская», pastroqda esa «в Ташкентскаяе». Xaridor birinchi qarashdayoq sayt tekshirilmaganini ko‘radi.")}</p></div>
<div class="note rv a-rise" style="--d:90ms"><h3>${t("Было: 12 полей в строку", "Edi: bir qatorda 12 maydon")}</h3><p>${t("В поиске мелкие поля без подписей, на телефоне уменьшенная копия компьютерной версии. Связаться можно только через форму с капчей.", "Qidiruvda imzosiz mayda maydonlar, telefonda kompyuter versiyasining kichraytirilgan nusxasi. Bog‘lanish faqat kapchali forma orqali.")}</p></div>
<div class="note rv a-rise" style="--d:180ms"><h3>${t("Стало: поиск и подбор под пальцем", "Bo‘ldi: barmoq ostida qidiruv va tanlash")}</h3><p>${t("Вкладки, тип, район, комнаты и «Подберём бесплатно» прямо до Telegram администратора. На телефоне меню как в приложении.", "Tablar, tur, tuman, xonalar va administrator Telegramigacha «Bepul tanlab beramiz». Telefonda ilovadagidek menyu.")}</p></div>
</div>
</div></section>
<section id="prilozhenie" data-addon="pwa" style="padding-top:0"><div class="wrap">
${head(t("Сайт как приложение · 195 $", "Sayt ilova kabi · 195 $"), t("Добавьте на экран телефона и откройте", "Telefon ekraniga qo‘shing va oching"), t("Это работает уже в прототипе. Иконка встаёт рядом с банком и такси, сайт открывается без строки браузера, внизу меню «Главная · Каталог · Подбор · Избранное · Новостройки». Без интернета открываются уже просмотренные объекты.", "Bu prototipda allaqachon ishlaydi. Belgi bank va taksi yoniga qo‘yiladi, sayt brauzer satrisiz ochiladi, pastda «Bosh sahifa · Katalog · Tanlash · Sevimlilar · Yangi uylar» menyusi. Internetsiz avval ko‘rilgan obyektlar ochiladi."))}
${installBlock(l)}
</div></section>
<section id="konstruktor" style="padding-top:0"><div class="wrap">
${head(t("Конструктор проекта", "Loyiha konstruktori"), t("Соберите портал под свой бюджет", "Portalni byudjetingizga moslab yig‘ing"), t("Портал стоит 1 900 $: это ставка нашего калькулятора за каталог с фильтрами и карточкой объекта. Остальное включается тумблером: включили блок, и он появляется на странице и в превью, итог пересчитывается. Цены допов взяты по нижней границе рынка Ташкента, точные назовём после разговора.", "Portal 1 900 $ turadi: bu filtrli katalog va obyekt kartochkasi uchun kalkulyatorimiz stavkasi. Qolgani tumbler bilan yoqiladi: blokni yoqsangiz, u sahifada va ko‘rinishda paydo bo‘ladi, jami qayta hisoblanadi. Qo‘shimchalar narxi Toshkent bozorining quyi chegarasi bo‘yicha, aniq narxni suhbatdan keyin aytamiz."))}
<div class="kit">
<div class="kit-list">
<div class="kit-base"><div><b>${KIT_BASE[l].t}</b><p>${KIT_BASE[l].d}</p></div><span class="kit-price num">${usd(KIT_BASE.price)}</span></div>
<h3 class="kit-g">${t("Допы на страницах", "Sahifalardagi qo‘shimchalar")}</h3>
${ADDONS.map((a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="" data-def checked><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}</b><small>${a[l].e}</small></span><span class="kit-price num">${usd(a.price)}</span></label>`).join("")}
${Object.keys(GROUPS).map((g) => `<h3 class="kit-g">${t("Сверх сайта", "Saytdan tashqari")} · ${GROUPS[g][l]}</h3>${BLOCKS.filter((b) => b.group === g).map((b) => `<label class="kit-row"><input type="checkbox" data-k="${b.id}" data-p="${b.price}" data-needs="${b.needs.join(" ")}"${b.star ? " data-def checked" : ""}><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${b[l].t}</b><small>${b[l].why}</small><span class="kit-li">${b[l].li.map((x) => `<em>${x}</em>`).join("")}</span>${b.needs.length ? `<span class="kit-need">${t("Включает", "Birga yoqiladi")}: ${b.needs.map((n) => [...ADDONS, ...BLOCKS].find((x) => x.id === n)[l].t).join(", ")}</span>` : ""}</span><span class="kit-price num">${usd(b.price)}</span></label>`).join("")}`).join("")}
</div>
<div class="kit-side">
<div aria-live="polite">${BLOCKS.map((b) => `<div class="kit-pv" data-pv="${b.id}" hidden><b>${b[l].t}</b>${pv[b.pv]}</div>`).join("")}</div>
<div class="kit-total"><small>${t("Итого с порталом", "Portal bilan jami")}</small><b class="num" id="kit-sum"></b><small id="kit-n"></small><a class="btn btn-gold" href="https://t.me/Devuz_studio_bot?start=shahar">${ICON.tg}${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</a></div>
</div>
</div>
</div></section>
<section id="konkurenty" style="padding-top:0"><div class="wrap">
${head(t("Что взяли у конкурентов", "Raqobatchilardan nima oldik"), t("Сильное у порталов Ташкента и за рубежом", "Toshkent va xorijiy portallarning kuchli tomonlari"), "")}
<div class="grid g3">${comp.map(([h, p], k) => `<div class="note rv a-rise" style="--d:${(k % 3) * 80}ms"><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>
<section class="dark" id="utp"><div class="wrap">
${head(t("Чем обходим конкурентов", "Raqobatchilardan qanday o‘zamiz"), t("Шесть вещей, которых нет у конкурентов", "Raqobatchilarda yo‘q oltita narsa"), "")}
<div class="offer">${usp.map(([h, p], k) => `<div class="oc rv a-${["rise", "tilt", "pop"][k % 3]}" style="--d:${(k % 3) * 90}ms"><span class="ic num" style="font:700 18px/1 var(--head)">0${k + 1}</span><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>
<section id="foto"><div class="wrap">
${head(t("Фото в прототипе", "Prototipdagi fotolar"), t("Откуда снимки", "Suratlar qayerdan"), t("Фото объектов взяты из ваших объявлений на shahar.uz, с вашим знаком. Виды города: открытые снимки Wikimedia Commons с разрешением на коммерческое использование. Нейросетью ничего не рисовали.", "Obyektlar fotolari shahar.uz’dagi e’lonlaringizdan olingan, belgingiz bilan. Shahar suratlari: tijoriy foydalanishga ruxsat berilgan Wikimedia Commons ochiq suratlari. Neyrotarmoq bilan hech narsa chizilmagan."))}
<ul class="credits">${PHOTO_CREDITS.map(([w, a, lic, u]) => `<li>${a}, «${w}», ${lic}, <a href="${u}">Wikimedia Commons</a></li>`).join("")}<li>${t("Анимации сделаны по мотивам компонентов Magic UI с 21st.dev (MIT): Bento Grid, Marquee, Number Ticker, Border Beam, Word Rotate. Влёт в букву: Glyph Portal © 2026 Christian Katzmann, MIT.", "Animatsiyalar 21st.dev’dagi Magic UI komponentlari asosida qilingan (MIT): Bento Grid, Marquee, Number Ticker, Border Beam, Word Rotate. Harfga kirish: Glyph Portal © 2026 Christian Katzmann, MIT.")}</li></ul>
</div></section>`;
  return shell(l, "plan", {
    title: t("Что дальше: было и стало, конструктор портала | ShahaR.Uz", "Keyingi qadam: edi va bo‘ldi, portal konstruktori | ShahaR.Uz"),
    desc: t("Было и стало: shahar.uz сегодня и прототип. Конструктор: портал 1 900 $, сайт как приложение 195 $, заявки в Telegram, админ-панель.", "Edi va bo‘ldi: bugungi shahar.uz va prototip. Konstruktor: portal 1 900 $, sayt ilova kabi 195 $, Telegramga arizalar, admin panel."),
  }, body);
}

/* ── Манифест и service worker ────────────────────────────────────────── */
function manifest(l) {
  return JSON.stringify({
    name: "ShahaR.Uz · недвижимость",
    short_name: "ShahaR.Uz",
    description: l === "ru" ? "Недвижимость по всему Узбекистану с 1998 года" : "1998 yildan butun O‘zbekiston bo‘ylab ko‘chmas mulk",
    lang: l,
    id: href(l) + "/",
    start_url: href(l) + "/?app=1",
    scope: BASE + "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f6f1",
    theme_color: "#0f1a16",
    icons: [
      { src: `${IMG}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${IMG}/icon-512.png`, sizes: "512x512", type: "image/png" },
      { src: `${IMG}/icon-mask-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: l === "ru" ? "Подберём бесплатно" : "Bepul tanlab beramiz", url: href(l, "podbor"), icons: [{ src: `${IMG}/icon-192.png`, sizes: "192x192" }] },
      { name: l === "ru" ? "Избранное" : "Sevimlilar", url: href(l, "katalog") + "?fav=1", icons: [{ src: `${IMG}/icon-192.png`, sizes: "192x192" }] },
    ],
  });
}

const BUILD = { "": home, katalog, obekt, novostroyki, uslugi, podbor, plan, offline };
const out = {};
for (const l of ["ru", "uz"]) {
  const pre = l === "uz" ? "uz" : "";
  for (const p of [...PAGES, "offline"]) out[pre ? pre + (p ? "/" + p : "") : p] = BUILD[p](l);
  out[(pre ? pre + "/" : "") + "manifest"] = manifest(l);
}
out.sw = SW.replace(/__IMG__/g, IMG);
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/*
 * Сборка для сервера (lib/proto/bundles): общие куски — стили, скрипты —
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
writeFileSync(bundleDir + "shahar.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(main)").padEnd(16), v.length);
