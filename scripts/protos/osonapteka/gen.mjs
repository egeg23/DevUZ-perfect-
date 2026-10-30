import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { LANGS, COMPANY, CATALOG, PHOTOS, REGIONS, DISTRICTS, FACTS, STEPS, REVIEWS, PRODUCTS, HOOKS, FORM_KINDS } from "./data.mjs";
import { BASE, ADDONS, OFFER_HOURS, ALL } from "./plan.mjs";
import { BUYER, PHARMACY } from "./tariffs.mjs";
import { PANEL_UI } from "./panel-ui.mjs";

/*
 * Макет Oson Apteka (osonapteka.uz), 30.10.2026: справочник лекарств и аптек
 * Узбекистана. Страницы на ru и uz:
 *
 *   ""   — видео DevUz → залёт камерой в бренд по прокрутке (кадры Higgsfield,
 *          зашифрованы, scene.py) → выбор «Сайт» / «Админка» → как проверить →
 *          конструктор «Предложение DevUz Studio» (plan.mjs);
 *   site — первый экран с поиском по названию и действующему веществу,
 *          бегущая строка, «Как это работает» по прокрутке, каталог с
 *          фильтрами и окном лекарства (инструкция, аналоги, аптеки рядом,
 *          бронь), список из нескольких лекарств, аптеки на карте, тарифы
 *          для покупателя и аптеки (tariffs.mjs), допы, «Для аптек», отзывы;
 *   panel — панель броней и аптек по эталону Greenwell.
 *
 * Лекарства, цены «от», фото, тексты — только с их сайта (data.mjs). Аптеки в
 * списках — демо-устройство и подписаны «демо»: имён и цен аптек мы не
 * придумываем. Формы ничего не отправляют наружу: бронь ложится в браузер и
 * видна в панели. Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/osonapteka";
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const CSS = strip(readFileSync(DIR + "site.css", "utf8")).replace(/\n\s*/g, "");
const JS = strip(readFileSync(DIR + "site.js", "utf8")).replace(/\n\s*\n/g, "\n");
const LAND_JS = strip(readFileSync(DIR + "land.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_JS = strip(readFileSync(DIR + "panel.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_CSS = strip(readFileSync(DIR + "panel.css", "utf8")).replace(/\n\s*/g, "");
const BASE_URL = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Onest:wght@400;700&display=swap";
const KEY = { ru: "", uz: "uz" };
const DEVUZ = "https://t.me/Devuz_studio_bot?start=osonapteka";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, p = "") => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/" + (p ? p : "");
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const sum = (n, l) => `${fmt(n)}\u00a0${l === "ru" ? "сум" : "so‘m"}`;
const usd = (n) => `${fmt(n)}\u00a0$`;
const ph = (p, w = 400) => `${IMG}/p/${PHOTOS[p.slug].n}-${PHOTOS[p.slug].sizes.includes(w) ? w : 400}.webp`;
const words = (txt) => txt.split(" ").map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");

const I = (dd) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  back: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  search: I('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  list: I('<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  bag: I('<path d="M5 8h14l-1 12H6Z"/><path d="M9 8a3 3 0 0 1 6 0"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'),
  panel: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  route: I('<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>'),
  sync: I('<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.7L4 16M4 20v-4h4"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  card: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>'),
  shield: I('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6Z"/><path d="m9 12 2 2 4-4"/>'),
  store: I('<path d="M4 10v10h16V10M3 6l2-3h14l2 3v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z"/>'),
  chart: I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  doc: I('<path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
  truck: I('<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17.5" cy="17.5" r="1.6"/>'),
  down: I('<path d="m6 9 6 6 6-6"/>'),
};
/* Знак Oson Apteka — их main-logo.svg (метка с крестом); слова — их шрифтом в виде кривых нет, пишем Manrope. */
const MARK = `<svg viewBox="0 0 30 30" aria-hidden="true" focusable="false" style="height:34px;width:34px"><circle cx="15" cy="15" r="15" fill="#3873D3"/><path d="M14.9 15.2H30V30H14.9z" fill="#3873D3"/><circle cx="15" cy="15" r="10.4" fill="#fff"/><path d="M20.6 13.2v3.5h-3.9v3.9h-3.5v-3.9H9.3v-3.5h3.9V9.3h3.5v3.9z" fill="#EC3E34"/></svg>`;
const LOGO = (l, to = "site") => `<a class="logo" href="${href(l, to)}" aria-label="Oson Apteka">${MARK}<svg viewBox="0 0 92 34" aria-hidden="true" focusable="false" style="height:34px"><text x="0" y="15" font-family="Manrope,system-ui,sans-serif" font-weight="700" font-size="16" fill="currentColor">oson</text><text x="0" y="32" font-family="Manrope,system-ui,sans-serif" font-weight="700" font-size="16" fill="currentColor">apteka</text></svg></a>`;

const P = (id) => CATALOG[id];
const nm = (p, l) => p.name[l];

/* ── Части страницы ───────────────────────────────────────────────── */
function head(l, title, desc) {
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#f3f6fb">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}

function header(l, t) {
  const nav = [["search", t("Поиск", "Qidiruv")], ["list", t("Список", "Ro‘yxat")], ["map", t("Аптеки", "Dorixonalar")], ["tarif", t("Тарифы", "Tariflar")], ["pharm", t("Для аптек", "Dorixonalarga")]];
  return `<header class="top"><div class="mbar"><a href="${href(l)}">${ICON.back}<span>${t("Макет для Oson Apteka", "Oson Apteka uchun maket")}</span></a><a class="mb-adm" href="${href(l, "panel")}">${ICON.panel}<span>${t("Админка", "Admin panel")}</span>${ICON.arrow}</a></div><div class="top-in glass">
${LOGO(l)}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([id, n]) => `<a href="#${id}">${n}</a>`).join("")}</nav>
<button type="button" class="mine" id="mine" data-addon="bron">${ICON.bag}<span>${t("Мои брони", "Bronlarim")}</span></button>
<div class="langs">${LANGS.map((x) => `<a href="${href(x, "site")}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<button type="button" class="ib" id="listb" aria-label="${t("Мой список лекарств", "Dorilar ro‘yxatim")}">${ICON.list}<i id="listn"></i></button>
</div></header>`;
}

/* Карта-фон первого экрана: районы-кварталы, метки аптек, маршрут. Кодом. */
function heroMap() {
  const pins = [[610, 300, 1.4], [470, 420, 1], [720, 470, 1.1], [380, 260, .8], [820, 330, .9], [560, 560, .9], [300, 470, .7], [880, 560, .8], [650, 180, .7], [240, 330, .6]];
  const pin = ([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="pin"><circle class="ring" cx="0" cy="-22" r="16" fill="none" stroke="#3873D3" stroke-width="2"/><path d="M0 0c-10-10-16-17-16-24a16 16 0 0 1 32 0c0 7-6 14-16 24Z" fill="#3873D3"/><circle cx="0" cy="-24" r="10" fill="#fff"/><path d="M-2 -30h4v4h4v4h-4v4h-4v-4h-4v-4h4z" fill="#EC3E34"/></g></g>`;
  const blocks = [];
  for (let gx = 0; gx < 11; gx++) for (let gy = 0; gy < 9; gy++) {
    const x = 120 + gx * 80 + (gy % 2) * 20, y = 120 + gy * 64;
    if ((gx * 7 + gy * 3) % 5 === 0) continue;
    blocks.push(`<rect x="${x}" y="${y}" width="${56 + ((gx + gy) % 3) * 6}" height="${40 + ((gx * gy) % 3) * 4}" rx="8" fill="#fff" stroke="#d6e2f5"/>`);
  }
  return `<svg viewBox="0 0 1000 800" aria-hidden="true" focusable="false"><g data-par="0.05">${blocks.join("")}</g>
<path class="route" d="M240 700 C 380 600, 420 520, 470 420 S 560 320, 610 300" fill="none" stroke="#3873D3" stroke-width="5" stroke-linecap="round" opacity=".55"/>
<g data-par="0.12">${pins.map(pin).join("")}</g></svg>`;
}

function hero(l, t) {
  const chips = [[P(8).short[l], "8"], [t("декспантенол", "dekspantenol"), "inn:" + t("декспантенол", "dekspantenol")], [P(16).short[l], "16"], [t("от аллергии", "allergiyaga qarshi"), "atc:R06"]];
  return `<section class="hero" id="top" aria-label="Oson Apteka">
<div class="hero-bg" aria-hidden="true"><div class="map" data-par="0.1">${heroMap()}</div><div class="ph" data-par="-0.06"><img src="${IMG}/poster-16-1920.webp" width="1920" height="1072" alt="" loading="lazy"></div></div>
<div class="wrap"><div class="hero-in">
<p class="kick rise"><i></i>${t("Справочная аптек Узбекистана", "O‘zbekiston dorixonalari ma’lumotnomasi")}</p>
<h1>${words(t("Лекарство рядом и дешевле: <em>3500&nbsp;аптек</em> в одном поиске", "Dori yaqinda va arzonroq: <em>3500&nbsp;dorixona</em> bitta qidiruvda"))}</h1>
<div class="sbox glass rise" id="sbox"><div class="sline">${ICON.search}<input id="q" type="search" autocomplete="off" enterkeyhint="search" placeholder="${t("Название или действующее вещество", "Nomi yoki ta’sir qiluvchi modda")}" aria-label="${t("Найти лекарство", "Dori topish")}" aria-controls="sug"><button type="button" class="btn btn-a" id="qgo">${ICON.search}<span>${t("Найти", "Topish")}</span></button></div>
<div class="sreg">${ICON.pin}<span>${t("Где искать:", "Qayerdan:")}</span><button type="button" id="regb" aria-haspopup="dialog"><span id="regn">${t("Ташкент", "Toshkent")}</span>${ICON.down}</button><span class="mu">${t("сначала ближе", "avval yaqinroq")}</span></div>
<div class="sug" id="sug" role="listbox" aria-label="${t("Подсказки", "Maslahatlar")}"></div></div>
<div class="chips rise" aria-label="${t("Часто ищут", "Ko‘p qidiriladi")}">${chips.map(([n, k]) => `<button type="button" data-q="${esc(k)}">${esc(n)}</button>`).join("")}</div>
<div class="hstats rise"><div class="glass"><b>3500</b><span>${t("аптек подключены", "dorixona ulangan")}</span></div><div class="glass"><b>14</b><span>${t("регионов страны", "mamlakat hududi")}</span></div><div class="glass"><b>0&nbsp;${t("сум", "so‘m")}</b><span>${t("для покупателей", "xaridorlar uchun")}</span></div></div>
</div></div></section>`;
}

function velo(l) {
  const row = (arr, cls) => `<div class="row${cls}">${[...arr, ...arr, ...arr].map((x) => `<span>${esc(x)}</span>`).join("")}</div>`;
  const names = CATALOG.filter((p) => !p.rx).map((p) => p.short[l]);
  return `<div class="velo" aria-hidden="true">${row(HOOKS[l], "")}${row([...new Set(names)], " rev")}</div>`;
}

/* «Как это работает» — их пять шагов, телефон меняет экран по прокрутке. */
function how(l, t) {
  const p = P(8), list = [P(8), P(6), P(17)];
  const views = [
    `<div class="app">${MARK.replace('style="height:34px;width:34px"', 'style="width:96px;height:96px"')}<b>Oson Apteka</b><span class="mu">App Store · Google Play · @${COMPANY.bot}</span></div>`,
    `<div class="bar">${ICON.search}<span>${esc(p.short[l])}</span></div>${list.map((x) => `<div class="it"><img src="${ph(x)}" alt="" width="28" height="28" style="width:28px;height:28px;object-fit:contain"><span>${esc(x.short[l])}</span><b>${t("от", "")} ${fmt(x.price)}${t("", " dan")}</b></div>`).join("")}`,
    `<div class="mp"><svg viewBox="0 0 200 220"><rect width="200" height="220" fill="#e7eef9"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${10 + (i % 3) * 64}" y="${14 + Math.floor(i / 2) * 64}" width="52" height="44" rx="6" fill="#fff"/>`).join("")}<path class="route" d="M30 200 C 60 150, 120 140, 140 70" fill="none" stroke="#3873D3" stroke-width="4"/><circle cx="30" cy="200" r="7" fill="#0e1a33"/><path d="M140 70c-6-6-10-10-10-15a10 10 0 0 1 20 0c0 5-4 9-10 15Z" fill="#3873D3"/><circle cx="140" cy="55" r="5" fill="#fff"/></svg></div><div class="it"><span class="dot"></span><span>${t("Аптека · демо", "Dorixona · demo")}<br><small class="mu">${t("650 м · открыто", "650 m · ochiq")}</small></span><b>${ICON.route.replace("<svg", '<svg style="width:18px;height:18px;color:#3873D3"')}</b></div>`,
    `<div class="rc">${t("ЧЕК", "CHEK")} · 30.10.2026<br>${esc(p.short[l])} ... ${fmt(p.price)}<br>${t("ИТОГО", "JAMI")} ... ${fmt(p.price)}<br>QR ▦▦▦</div>`,
    `<div class="cb"><small>${t("Кэшбэк", "Keshbek")}</small><b>${t("на карту", "kartaga")}</b><small>Uzcard · Humo</small></div><div class="it"><span class="dot"></span><span>${t("Чек отсканирован", "Chek skanerlandi")}</span><b>✓</b></div>`,
  ];
  return `<section class="how" id="how" aria-label="${t("Как это работает", "Qanday ishlaydi")}"><div class="how-st"><div class="wrap how-in">
<div><p class="kick"><i></i>${t("Как это работает", "Qanday ishlaydi")}</p>
<h2 class="h2">${t("Пять шагов <b>от поиска до кэшбэка</b>", "Qidiruvdan <b>keshbekkacha</b> besh qadam")}</h2>
<div class="steps">${STEPS[l].map(([h, d], i) => `<div class="stp${i ? "" : " on"}"><i>${i + 1}</i><div><b>${h}</b><p>${d}</p></div></div>`).join("")}</div>
<div class="prog" aria-hidden="true">${STEPS[l].map(() => "<i><b></b></i>").join("")}</div></div>
<div class="phone" aria-hidden="true"><div class="scr">${views.map((v, i) => `<div class="v${i ? "" : " on"}">${v}</div>`).join("")}</div></div>
</div></div></section>`;
}

function card(p, l, t) {
  return `<article class="card pop" data-id="${p.id}" data-k="${p.kind}" data-rx="${p.rx ? 1 : 0}">
<button type="button" class="pic" data-open="${p.id}" aria-label="${esc(nm(p, l))}"><img src="${ph(p)}" alt="${esc(nm(p, l))}" width="${PHOTOS[p.slug].w}" height="${PHOTOS[p.slug].h}" loading="lazy"></button>
<span class="badge ${p.rx ? "b-rx" : "b-otc"}">${p.rx ? t("По рецепту", "Retsept bilan") : t("Без рецепта", "Retseptsiz")}</span>
<h3>${esc(p.short[l])}</h3>
<div class="mk2">${esc(nm(p, l).slice(p.short[l].length).trim())} · ${esc(p.country[l])}</div>
${p.inn ? `<div class="inn">${esc(p.inn[l])}</div>` : ""}
<div class="pr"><small>${t("от", "")}</small> ${sum(p.price, l)}${t("", " <small>dan</small>")}</div>
<div class="act"><button type="button" class="btn btn-a" data-open="${p.id}">${t("Где купить", "Qayerdan olish")}</button><button type="button" class="btn btn-g add" data-add="${p.id}" aria-pressed="false" aria-label="${t("В список", "Ro‘yxatga")}">${ICON.plus}</button></div>
</article>`;
}

function catalog(l, t) {
  return `<section class="sec" id="search"><div class="wrap">
<p class="kick rise"><i></i>${t("Популярные лекарства", "Ommabop dorilar")}</p>
<h2 class="h2 rise">${t("Цены «от» по всем аптекам, <b>как у вас на сайте</b>", "Barcha dorixonalar bo‘yicha «dan» narxlar, <b>saytingizdagidek</b>")}</h2>
<p class="lead rise">${t("20 лекарств из вашего списка «Популярные товары» с ценой «от» на 30 октября. Нажмите на лекарство: инструкция, аналоги по действующему веществу и аптеки рядом.", "«Ommabop mahsulotlar» ro‘yxatingizdan 30 oktyabr holatiga «dan» narxi bilan 20 ta dori. Dorini bosing: yo‘riqnoma, ta’sir qiluvchi modda bo‘yicha analoglar va yaqin dorixonalar.")}</p>
<div class="tabs" role="group" aria-label="${t("Отпуск", "Berilishi")}"><button type="button" data-rx="all" aria-pressed="true">${t("Все", "Hammasi")}</button><button type="button" data-rx="0" aria-pressed="false">${t("Без рецепта", "Retseptsiz")}</button><button type="button" data-rx="1" aria-pressed="false">${t("По рецепту", "Retsept bilan")}</button></div>
<div class="tools"><div class="kinds">${Object.entries(FORM_KINDS).map(([k, v]) => `<button type="button" data-kind="${k}" aria-pressed="false">${v[l]}</button>`).join("")}</div>
<label><span class="vh">${t("Порядок", "Tartib")}</span><select id="sort"><option value="pop">${t("Сначала популярные", "Avval ommabop")}</option><option value="cheap">${t("Сначала дешевле", "Avval arzonroq")}</option><option value="name">${t("По названию", "Nomi bo‘yicha")}</option></select></label><span class="found" id="found"></span></div>
<div class="grid" id="grid">${CATALOG.map((p) => card(p, l, t)).join("")}</div>
<p class="note">${ICON.info}<span>${t("Справочная информация, не реклама. Перед применением проконсультируйтесь с врачом и прочитайте инструкцию. Рецептурные препараты отпускаются только по рецепту врача.", "Ma’lumot uchun, reklama emas. Qo‘llashdan oldin shifokor bilan maslahatlashing va yo‘riqnomani o‘qing. Retseptli dorilar faqat shifokor retsepti bilan beriladi.")}</span></p>
</div></section>`;
}

function list(l, t) {
  return `<section class="sec" id="list" style="background:var(--s2)"><div class="wrap">
<p class="kick rise"><i></i>${t("Несколько лекарств за один поиск", "Bir qidiruvda bir nechta dori")}</p>
<h2 class="h2 rise">${t("Врач выписал три лекарства? <b>Одна аптека на всё</b>", "Shifokor uchta dori yozdimi? <b>Hammasi bitta dorixonada</b>")}</h2>
<p class="lead rise">${t("Ваша функция одновременного поиска, сделанная списком: добавьте лекарства кнопкой «+», и справочник покажет аптеки, где есть всё сразу, ближе и дешевле.", "Bir vaqtda qidirish funksiyangiz, ro‘yxat ko‘rinishida: dorilarni «+» tugmasi bilan qo‘shing, ma’lumotnoma hammasi birdaniga bor, yaqinroq va arzonroq dorixonalarni ko‘rsatadi.")}</p>
<div class="lst"><div class="lbox tilt"><b>${t("Мой список", "Ro‘yxatim")}</b><div id="lrows"></div><div class="hero-act" style="margin-top:16px"><button type="button" class="btn btn-a" id="lgo">${ICON.search}<span>${t("Найти аптеки, где есть всё", "Hammasi bor dorixonalarni topish")}</span></button></div></div>
<div class="cov" id="cov" aria-live="polite"></div></div>
</div></section>`;
}

function map(l, t) {
  const D = DISTRICTS[l];
  /* Схема районов Ташкента: 12 шестиугольников, без притязаний на границы. */
  const hx = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
  /* Север сверху: ряды районов примерно как на карте города. */
  const rows = [[0, 7, 8, 3], [5, 6, 2, 11], [4, 10, 9, 1]];
  const cells = rows.flatMap((r, ri) => r.map((i, ci) => ({ i, cx: 90 + ci * 94 + (ri % 2 ? 47 : 0), cy: 80 + ri * 82 })));
  return `<section class="sec" id="map"><div class="wrap">
<p class="kick rise"><i></i>${t("Аптеки рядом", "Yaqin dorixonalar")}</p>
<h2 class="h2 rise">${t("Район, маршрут, <b>кто открыт сейчас</b>", "Tuman, yo‘nalish, <b>hozir kim ochiq</b>")}</h2>
<p class="lead rise">${t("Выберите район Ташкента или регион: аптеки, где есть лекарство, со временем работы, телефоном и маршрутом. Сколько аптек в районе, покажет ваша база; на схеме демо.", "Toshkent tumani yoki hududni tanlang: dori bor dorixonalar, ish vaqti, telefon va yo‘nalish bilan. Tumanda nechta dorixona borligini bazangiz ko‘rsatadi; sxemada demo.")}</p>
<div class="mapw"><div class="tmap tilt"><svg viewBox="20 10 460 320" role="group" aria-label="${t("Районы Ташкента", "Toshkent tumanlari")}">
${cells.map((c) => `<polygon class="dz" data-d="${c.i}" points="${hx(c.cx, c.cy, 52)}" fill="#fff" stroke="#c9d8f0" stroke-width="2"/>`).join("")}
${cells.map((c) => `<text x="${c.cx}" y="${c.cy + 4}" text-anchor="middle">${esc(D[c.i].length > 11 ? D[c.i].split(/[ -]/)[0] : D[c.i])}</text>`).join("")}
<g id="mpins"></g></svg></div>
<div><div class="dlist" id="dlist">${D.map((d, i) => `<button type="button" data-d="${i}" aria-pressed="${i === 8}">${esc(d)}</button>`).join("")}</div>
<div class="ph-list" id="dph" style="margin-top:16px"></div>
<div class="regs" data-addon="seo">${REGIONS[l].map((r) => `<a href="#map">${esc(r)}</a>`).join("")}</div></div></div>
</div></section>`;
}

/* Конструктор тарифов: покупателю и аптеке. Цены — tariffs.mjs. */
function tarif(l, t) {
  const z = BUYER.zones;
  return `<section class="sec" id="tarif" style="background:var(--s2)"><div class="wrap">
<p class="kick rise"><i></i>${t("Конструктор тарифов", "Tariflar konstruktori")}</p>
<h2 class="h2 rise">${t("Сколько это стоит <b>покупателю и аптеке</b>", "Bu <b>xaridor va dorixonaga</b> qanchaga tushadi")}</h2>
<p class="lead rise">${t("Поиск для покупателя остаётся бесплатным, как сейчас. Платные: доставка и подписка у покупателя, размещение и продвижение у аптеки. Цены по середине рынка Узбекистана, это предложение для обсуждения.", "Xaridor uchun qidiruv hozirgidek bepul qoladi. Pullik: xaridorda yetkazish va obuna, dorixonada joylashtirish va reklama. Narxlar O‘zbekiston bozorining o‘rtasida, bu muhokama uchun taklif.")}</p>
<div class="tabs" role="tablist" aria-label="${t("Для кого", "Kim uchun")}"><button type="button" role="tab" data-tf="b" aria-pressed="true" aria-selected="true">${t("Покупателю", "Xaridorga")}</button><button type="button" role="tab" data-tf="p" aria-pressed="false" aria-selected="false">${t("Аптеке", "Dorixonaga")}</button></div>
<div class="tf"><div>
<div class="tfp on" id="tf-b">
<label class="opt"><input type="radio" name="get" value="bron" checked><span class="sw"></span><span class="ot"><b>${t("Бронь и самовывоз", "Bron va olib ketish")}</b><small>${t(`Аптека соберёт и держит ${BUYER.hold} часа`, `Dorixona yig‘adi va ${BUYER.hold} soat saqlaydi`)}</small></span><span class="op">${t("бесплатно", "bepul")}</span></label>
${z.map((x) => `<label class="opt" data-addon="deliv"><input type="radio" name="get" value="${x.id}" data-p="${x.price}"><span class="sw"></span><span class="ot"><b>${t("Доставка", "Yetkazish")}: ${esc(x[l])}</b><small>${t("курьер аптеки или такси, в день заказа", "dorixona kuryeri yoki taksi, buyurtma kuni")}</small></span><span class="op">${sum(x.price, l)}</span></label>`).join("")}
<label class="opt" data-addon="deliv"><input type="checkbox" id="fast" data-p="${BUYER.fast}"><span class="sw"></span><span class="ot"><b>${t("Срочно, за 60 минут", "Tezkor, 60 daqiqada")}</b><small>${t("к цене доставки", "yetkazish narxiga")}</small></span><span class="op">+${sum(BUYER.fast, l)}</span></label>
<label class="opt"><input type="checkbox" id="plus" data-p="${BUYER.plus.price}"><span class="sw"></span><span class="ot"><b>Oson Plus</b><small>${t(`Доставка бесплатно от ${fmt(BUYER.plus.free)} сум, напоминания о приёме, двойной кэшбэк за чек`, `${fmt(BUYER.plus.free)} so‘mdan bepul yetkazish, qabul eslatmalari, chek uchun ikki baravar keshbek`)}</small></span><span class="op">${sum(BUYER.plus.price, l)}<small>${t("в месяц", "oyiga")}</small></span></label>
<div class="rng"><label for="ord"><span>${t("Заказов в месяц", "Oyiga buyurtmalar")}</span><b id="ordv">3</b></label><input type="range" id="ord" min="1" max="12" value="3"><label for="chk"><span>${t("Средняя покупка", "O‘rtacha xarid")}</span><b id="chkv"></b></label><input type="range" id="chk" min="50000" max="400000" step="10000" value="160000"></div>
</div>
<div class="tfp" id="tf-p">
<label class="opt"><input type="checkbox" checked disabled><span class="sw"></span><span class="ot"><b>${esc(PHARMACY.base[l])}</b><small>${t("Остатки и цены из вашей программы, контакты, часы, маршрут. Первый месяц бесплатно", "Dasturingizdan qoldiq va narxlar, kontaktlar, ish vaqti, yo‘nalish. Birinchi oy bepul")}</small></span><span class="op">${sum(PHARMACY.base.price, l)}<small>${t("в месяц", "oyiga")}</small></span></label>
${PHARMACY.opts.map((o) => `<label class="opt"${o.id === "deliv" ? ' data-addon="deliv"' : o.id === "bron" ? ' data-addon="bron"' : ""}><input type="checkbox" data-o="${o.id}" ${o.id === "bron" ? "checked" : ""}><span class="sw"></span><span class="ot"><b>${esc(o[l])}</b><small>${o.per === "pct" ? t("с выкупленной брони", "olib ketilgan brondan") : o.per === "order" ? t("с доставленного заказа", "yetkazilgan buyurtmadan") : t("в месяц", "oyiga")}</small></span><span class="op">${o.per === "pct" ? o.fee + "%" : sum(o.price, l)}</span></label>`).join("")}
<div class="rng"><label for="brn"><span>${t("Броней в месяц", "Oyiga bronlar")}</span><b id="brnv">120</b></label><input type="range" id="brn" min="10" max="600" step="10" value="120"><label for="pchk"><span>${t("Средний чек брони", "Bronning o‘rtacha cheki")}</span><b id="pchkv"></b></label><input type="range" id="pchk" min="30000" max="300000" step="10000" value="90000"></div>
</div>
</div>
<aside class="tsum glass" aria-live="polite"><div id="tsum"></div>
<p>${t("Цены: предложение DevUz по открытым данным рынка (PharmaClick, ArzonApteka, tabletki.ua). Окончательные назначаете вы, в панели.", "Narxlar: bozorning ochiq ma’lumotlari bo‘yicha DevUz taklifi (PharmaClick, ArzonApteka, tabletki.ua). Yakuniysini siz panelda belgilaysiz.")}</p></aside></div>
</div></section>`;
}

function addonBlocks(l, t) {
  const tag = t("Доп", "Qo‘shimcha");
  const rem = [P(8), P(17), P(9)];
  return `<section class="sec add-block" id="remind" data-addon="remind" data-tag="${tag}"><div class="wrap two">
<div><p class="kick rise"><i></i>${t("Напоминания", "Eslatmalar")}</p><h2 class="h2 rise">${t("Принять вовремя, <b>купить заранее</b>", "O‘z vaqtida ichish, <b>oldindan sotib olish</b>")}</h2>
<p class="lead rise">${t("Покупатель сам вносит время приёма по назначению врача. Справочник напомнит в Telegram и подскажет купить новую упаковку, пока старая не кончилась, в ближайшей аптеке.", "Xaridor shifokor tayinlovi bo‘yicha qabul vaqtini o‘zi kiritadi. Ma’lumotnoma Telegramda eslatadi va eskisi tugamasidan yangi qadoqni eng yaqin dorixonadan olishni maslahat beradi.")}</p></div>
<div class="rem slide"><label class="fld"><span>${t("Лекарство", "Dori")}</span><select id="rmed">${rem.map((p) => `<option value="${p.id}">${esc(p.short[l])}</option>`).join("")}</select></label>
<div><b style="font-size:14px">${t("Когда принимать", "Qachon ichish")}</b><div class="times" style="margin-top:8px">${["08:00", "14:00", "20:00", "22:00"].map((x, i) => `<button type="button" data-tm="${x}" aria-pressed="${i === 0 || i === 2}">${x}</button>`).join("")}</div></div>
<label class="fld"><span>${t("Дней по назначению", "Tayinlov bo‘yicha kunlar")}</span><input id="rdays" type="number" min="1" max="90" value="14" inputmode="numeric"></label>
<div class="out" id="rout"></div></div></div></section>
<section class="sec add-block" id="bot" data-addon="bot" data-tag="${tag}" style="background:var(--s2)"><div class="wrap two">
<div class="chat" id="chat"><p class="me">${esc(P(6).short[l])}</p><p class="bt">${t(`${esc(P(6).short[l])}: от ${fmt(P(6).price)} сум. Рядом с вами 4 аптеки (демо). Забронировать?`, `${esc(P(6).short[l])}: ${fmt(P(6).price)} so‘mdan. Yoningizda 4 ta dorixona (demo). Bron qilamizmi?`)}</p><p class="kb"><span>${t("Забронировать", "Bron qilish")}</span><span>${t("Маршрут", "Yo‘nalish")}</span><span>${t("Аналоги", "Analoglar")}</span></p><p class="bt">${t("Бронь собрана ✓ Ждём до 20:00.", "Bron yig‘ildi ✓ 20:00 gacha kutamiz.")}</p></div>
<div><p class="kick rise"><i></i>Telegram</p><h2 class="h2 rise">${t("@osonaptekabot: <b>бронь в один шаг</b>", "@osonaptekabot: <b>bir qadamda bron</b>")}</h2>
<p class="lead rise">${t("Ваш бот уже ищет лекарства. Добавим бронь, статус «собрана» и напоминания, тем же движком, что сайт: одна база, одна панель.", "Botingiz allaqachon dori qidiradi. Bron, «yig‘ildi» holati va eslatmalarni qo‘shamiz, sayt bilan bir xil dvigatelda: bitta baza, bitta panel.")}</p>
<div class="hero-act rise"><a class="btn btn-a" href="https://t.me/${COMPANY.bot}" target="_blank" rel="noopener">${ICON.tg}<span>@${COMPANY.bot}</span></a></div></div></div></section>
<section class="sec add-block" id="cab" data-addon="cab" data-tag="${tag}"><div class="wrap two">
<div><p class="kick rise"><i></i>${t("Кабинет", "Kabinet")}</p><h2 class="h2 rise">${t("Кэшбэк за чек <b>и на сайте</b>", "Chek uchun keshbek <b>saytda ham</b>")}</h2>
<p class="lead rise">${t("Сейчас кэшбэк есть только в приложении. В кабинете на сайте: загрузить фото чека, увидеть начисление и перевести на карту, история броней и списки «Мама», «Ребёнок».", "Hozir keshbek faqat ilovada. Saytdagi kabinetda: chek suratini yuklash, hisoblanganini ko‘rish va kartaga o‘tkazish, bronlar tarixi va «Onam», «Bola» ro‘yxatlari.")}</p></div>
<div class="phone tilt" aria-hidden="true" style="width:min(260px,64vw)"><div class="scr"><div class="v on"><div class="rc">${t("ЧЕК", "CHEK")} · 30.10.2026<br>${esc(P(19).short[l])} ... ${fmt(P(19).price)}<br>${t("ИТОГО", "JAMI")} ... ${fmt(P(19).price)}</div><div class="cb"><small>${t("Кэшбэк начислен", "Keshbek hisoblandi")}</small><b>${t("на карту", "kartaga")}</b></div></div></div></div></div></section>
<section class="sec add-block" id="erp" data-addon="erp" data-tag="${tag}" style="background:var(--s2)"><div class="wrap">
<p class="kick rise"><i></i>FOM · ABU · 1C</p><h2 class="h2 rise">${t("Остатки <b>свежие у каждой аптеки</b>", "Har bir dorixonada <b>yangi qoldiqlar</b>")}</h2>
<p class="lead rise">${t("Ваша программа на 5 МБ уже отправляет остатки из FOM, ABU и 1С. Новый сайт показывает у каждой аптеки, когда они обновились, а аптеки со старыми данными уходят вниз выдачи.", "5 MB lik dasturingiz FOM, ABU va 1C’dan qoldiqlarni allaqachon yuboradi. Yangi sayt har bir dorixonada qachon yangilanganini ko‘rsatadi, eski ma’lumotli dorixonalar esa natijalar pastiga tushadi.")}</p>
<div class="cards3">${[[ICON.sync, t("Обновлено 4 мин назад", "4 daqiqa oldin yangilandi"), t("Метка у аптеки в выдаче", "Natijalarda dorixona belgisi")], [ICON.clock, t("Старше суток", "Bir kundan eski"), t("Аптека ниже, панель напоминает ей", "Dorixona pastroqda, panel unga eslatadi")], [ICON.store, t("Нет в наличии", "Mavjud emas"), t("Не показываем, чтобы человек не ехал зря", "Odam bekorga bormasligi uchun ko‘rsatmaymiz")], [ICON.chart, t("Свежесть по сети", "Tarmoq bo‘yicha yangilik"), t("Сводка в панели", "Paneldagi xulosa")]].map(([i, b, p]) => `<div class="fc pop">${i}<b>${b}</b><p>${p}</p></div>`).join("")}</div>
</div></section>`;
}

function pharm(l, t) {
  const F = FACTS[l];
  return `<section class="sec dark" id="pharm"><div class="wrap">
<p class="kick rise"><i></i>${t("Для аптек", "Dorixonalarga")}</p>
<h2 class="h2 rise">${t("Подключить аптеку: <b>5 минут и первый месяц бесплатно</b>", "Dorixonani ulash: <b>5 daqiqa va birinchi oy bepul</b>")}</h2>
<p class="lead rise">${esc(F.pharmacies)} ${esc(F.install)}</p>
<div class="cards3">${PRODUCTS.map((p, i) => `<div class="fc pop" style="transition-delay:${i * 80}ms">${[ICON.search, ICON.chart, ICON.card, ICON.doc][i]}<b>${p.n}</b><p>${esc(p[l])}</p></div>`).join("")}</div>
<div class="cards3">${[[ICON.sync, F.systems], [ICON.shield, F.itpark], [ICON.clock, F.support], [ICON.check, F.firstMonth]].map(([i, x]) => `<div class="fc rise">${i}<p style="margin:0;color:#e8eefb">${esc(x)}</p></div>`).join("")}</div>
<div class="hero-act rise"><a class="btn btn-a" href="tel:${COMPANY.tel}">${ICON.phone}<span>${COMPANY.phone}</span></a><a class="btn btn-g" href="${COMPANY.business}" target="_blank" rel="noopener" style="background:transparent;color:#fff;border-color:#3a4f7d">${t("Раздел «Для аптек»", "«Dorixonalar uchun» bo‘limi")}</a></div>
</div></section>`;
}

function reviews(l, t) {
  const rv = REVIEWS.filter((r) => l === "ru" || r.lang === "uz");
  return `<section class="sec" id="reviews"><div class="wrap">
<p class="kick rise"><i></i>${t("Отзывы с вашего сайта", "Saytingizdagi sharhlar")}</p>
<h2 class="h2 rise">${t("Что пишут <b>пользователи</b>", "Foydalanuvchilar <b>nima deydi</b>")}</h2>
<div class="rv">${rv.map((r, i) => `<figure class="${i % 2 ? "slide" : "rise"}"><blockquote${r.lang === "uz" && l === "ru" ? ' lang="uz"' : ""}>${esc(r.t)}</blockquote><figcaption><b>${esc(r.n)}</b> · ${r.d}</figcaption></figure>`).join("")}</div>
<div class="appb rise"><a class="btn btn-a" href="${COMPANY.ios}" target="_blank" rel="noopener">App Store</a><a class="btn btn-a" href="${COMPANY.android}" target="_blank" rel="noopener">Google Play</a><a class="btn btn-g" href="https://t.me/${COMPANY.bot}" target="_blank" rel="noopener">${ICON.tg}<span>@${COMPANY.bot}</span></a></div>
</div></section>`;
}

function admin(l, t) {
  return `<section class="sec add-block" id="admin" data-addon="admin" data-tag="${t("Доп", "Qo‘shimcha")}" style="background:var(--s2)"><div class="wrap two">
<div><p class="kick rise"><i></i>${t("Панель", "Panel")}</p><h2 class="h2 rise">${t("Брони и аптеки <b>в одной панели</b>", "Bronlar va dorixonalar <b>bitta panelda</b>")}</h2>
<p class="lead rise">${t("Забронируйте что-нибудь на этой странице и откройте панель: бронь будет первой строкой. Смените статус на «Собрана», и здесь, в «Мои брони», он сменится сам.", "Shu sahifada biror narsani bron qiling va panelni oching: bron birinchi qatorda bo‘ladi. Holatni «Yig‘ildi»ga o‘zgartiring, bu yerda «Bronlarim»da o‘zi o‘zgaradi.")}</p>
<div class="hero-act rise"><a class="btn btn-a" href="${href(l, "panel")}">${ICON.panel}<span>${t("Открыть панель", "Panelni ochish")}</span></a></div></div>
<div class="cards3" style="grid-template-columns:1fr 1fr">${[[t("Брони с сайта", "Saytdan bronlar"), t("первой строкой", "birinchi qatorda")], [t("Аптеки и тарифы", "Dorixonalar va tariflar"), t("свежесть остатков", "qoldiqlar yangiligi")], [t("Что ищут", "Nima qidirishadi"), t("и чего нет в наличии", "va nima mavjud emas")], [t("Роли и история", "Rollar va tarix"), t("менеджер не видит выручку", "menejer tushumni ko‘rmaydi")]].map(([b, p]) => `<div class="fc pop"><b>${b}</b><p>${p}</p></div>`).join("")}</div>
</div></section>`;
}

function footer(l, t) {
  return `<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l)}<p style="margin-top:16px;font-size:14px">${esc(FACTS[l].tagline)} ${esc(FACTS[l].free)}</p><a href="tel:${COMPANY.tel}" style="font:700 18px/1.3 var(--hd);color:#fff">${COMPANY.phone}</a></div>
<div><h4>${t("Покупателям", "Xaridorlarga")}</h4><a href="#search">${t("Поиск лекарств", "Dori qidirish")}</a><a href="#list">${t("Список лекарств", "Dorilar ro‘yxati")}</a><a href="#map">${t("Аптеки рядом", "Yaqin dorixonalar")}</a><a href="#tarif">${t("Тарифы", "Tariflar")}</a></div>
<div><h4>${t("Аптекам", "Dorixonalarga")}</h4><a href="#pharm">Oson Apteka · Oson Price</a><a href="#pharm">Oson Kassa · Oson Report</a><a href="${COMPANY.business}" target="_blank" rel="noopener">osonapteka.uz/business</a></div>
<div><h4>${t("Мы на связи", "Aloqadamiz")}</h4><a href="https://t.me/${COMPANY.tg}" target="_blank" rel="noopener">Telegram</a><a href="https://instagram.com/${COMPANY.ig}" target="_blank" rel="noopener">Instagram</a><a href="https://facebook.com/${COMPANY.fb}" target="_blank" rel="noopener">Facebook</a></div>
</div>
<p class="warn-l">${t("Информация о лекарствах справочная и не заменяет консультацию врача. Рецептурные препараты отпускаются по рецепту. Аптеки, расстояния и статусы в макете: демо.", "Dorilar haqidagi ma’lumot ma’lumotnoma uchun va shifokor maslahatini almashtirmaydi. Retseptli dorilar retsept bilan beriladi. Maketdagi dorixonalar, masofalar va holatlar: demo.")}</p>
<div class="sm"><span>© 2026 Oson Apteka · ${esc(FACTS[l].itpark)}</span><span>${t("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</span></div>
</div></footer>`;
}

/* Данные для site.js. */
function data(l, t) {
  return {
    l, panel: href(l, "panel"),
    p: CATALOG.map((p) => ({ id: p.id, n: p.name[l], s: p.short[l], b: p.brand[l], m: p.maker[l], c: p.country[l], atc: p.atc, an: l === "ru" ? p.atcName : "", inn: p.inn ? p.inn[l] : "", f: p.form[l], k: p.kind, pr: p.price, rx: p.rx ? 1 : 0, im: ph(p), u: l === "ru" ? p.url : p.url.replace("osonapteka.uz/", "osonapteka.uz/uz/"), sec: l === "ru" ? p.sec : {} })),
    dist: DISTRICTS[l], regs: REGIONS[l],
    tf: { b: BUYER, p: PHARMACY },
    add: ADDONS.map((a) => a.id),
    t: {
      sum: l === "ru" ? "сум" : "so‘m", from: t("от", ""), fromS: t("", "dan"), km: t("км", "km"), m: t("м", "m"),
      demo: t("демо", "demo"), apt: t("Аптека", "Dorixona"), open: t("открыто до 22:00", "22:00 gacha ochiq"), allday: t("круглосуточно", "kecha-kunduz"),
      bron: t("Забронировать", "Bron qilish"), route: t("Маршрут", "Yo‘nalish"), call: t("Позвонить", "Qo‘ng‘iroq"), upd: t("остатки обновлены", "qoldiqlar yangilandi"), minAgo: t("мин назад", "daqiqa oldin"),
      inn: t("Действующее вещество", "Ta’sir qiluvchi modda"), atc: t("Код АТХ", "ATX kodi"), brand: t("Бренд", "Brend"), maker: t("Производитель", "Ishlab chiqaruvchi"), form: t("Форма", "Shakli"), sale: t("Отпуск", "Berilishi"),
      rx: t("По рецепту врача", "Shifokor retsepti bilan"), otc: t("Без рецепта", "Retseptsiz"),
      warn: t("Перед применением проконсультируйтесь с врачом и прочитайте инструкцию.", "Qo‘llashdan oldin shifokor bilan maslahatlashing va yo‘riqnomani o‘qing."),
      warnRx: t("Рецептурный препарат: отпускается только по рецепту врача. Мы показываем, где он есть, но не советуем его.", "Retseptli dori: faqat shifokor retsepti bilan beriladi. Biz u qayerda borligini ko‘rsatamiz, lekin tavsiya qilmaymiz."),
      instr: t("Инструкция", "Yo‘riqnoma"), instrFull: t("Полная инструкция на osonapteka.uz", "To‘liq yo‘riqnoma osonapteka.uz’da"), instrNone: t("Полная инструкция: на странице лекарства у вас на сайте.", "To‘liq yo‘riqnoma: saytingizdagi dori sahifasida."),
      analogs: t("Аналоги", "Analoglar"), analogsInn: t("с тем же действующим веществом", "xuddi shu ta’sir qiluvchi modda bilan"), analogsAtc: t("из той же группы АТХ, замену назначает врач", "xuddi shu ATX guruhidan, almashtirishni shifokor tayinlaydi"), analogsNo: t("Аналогов в этом списке нет.", "Bu ro‘yxatda analoglar yo‘q."),
      near: t("Аптеки рядом", "Yaqin dorixonalar"), nearHint: t("Список и расстояния: демо. Цену в аптеке покажет ваша база.", "Ro‘yxat va masofalar: demo. Dorixonadagi narxni bazangiz ko‘rsatadi."),
      price: t("Цена в аптеке", "Dorixonadagi narx"), fromAll: t("самая низкая по базе", "bazadagi eng past"),
      add: t("В список", "Ro‘yxatga"), added: t("Добавлено в список", "Ro‘yxatga qo‘shildi"), inList: t("В списке", "Ro‘yxatda"),
      lEmpty: t("Список пуст. Нажмите «+» у лекарства.", "Ro‘yxat bo‘sh. Dori yonidagi «+» ni bosing."), lFound: t("есть всё", "hammasi bor"), lOf: t("из", "dan"), lNone: t("Добавьте хотя бы одно лекарство", "Kamida bitta dori qo‘shing"),
      found: t("найдено", "topildi"), nothing: t("Ничего не нашли. Попробуйте часть названия или действующее вещество.", "Hech narsa topilmadi. Nomning bir qismini yoki ta’sir qiluvchi moddani kiriting."),
      sugN: t("Лекарства", "Dorilar"), sugI: t("По действующему веществу", "Ta’sir qiluvchi modda bo‘yicha"),
      name: t("Имя", "Ism"), phone: t("Телефон", "Telefon"), need: t("Напишите имя и телефон", "Ism va telefonni yozing"),
      hold: t(`Аптека соберёт заказ и будет держать ${BUYER.hold} часа. Оплата в аптеке.`, `Dorixona buyurtmani yig‘adi va ${BUYER.hold} soat saqlaydi. To‘lov dorixonada.`),
      payNow: t("Оплатить сразу", "Darhol to‘lash"), payCash: t("В аптеке", "Dorixonada"),
      ok: t("Бронь принята", "Bron qabul qilindi"), okp: t("Это макет: бронь легла в панель, там можно сменить статус. Он появится здесь, в «Мои брони».", "Bu maket: bron panelga tushdi, u yerda holatni o‘zgartirish mumkin. U shu yerda, «Bronlarim»da paydo bo‘ladi."),
      st: [t("Принята", "Qabul qilindi"), t("Собрана, ждём", "Yig‘ildi, kutamiz"), t("Выдана", "Berildi"), t("Отменена", "Bekor qilindi")],
      mine: t("Мои брони", "Bronlarim"), order: t("Бронь", "Bron"), panel: t("Открыть панель", "Panelni ochish"), none: t("Броней пока нет.", "Hozircha bronlar yo‘q."),
      regTitle: t("Где искать", "Qayerdan qidirish"), regAll: t("По всему Узбекистану", "Butun O‘zbekiston bo‘yicha"),
      tb: { bron: t("Бронь и самовывоз", "Bron va olib ketish"), deliv: t("Доставка", "Yetkazish"), fast: t("Срочно", "Tezkor"), plus: "Oson Plus", free: t("бесплатно", "bepul"), month: t("В месяц", "Oyiga"), per: t("за заказ", "buyurtma uchun"), save: t("Экономит Oson Plus", "Oson Plus tejaydi"), pay: t("Покупатель платит", "Xaridor to‘laydi") },
      tp: { base: t("Размещение", "Joylashtirish"), month: t("Аптека платит в месяц", "Dorixona oyiga to‘laydi"), first: t("первый месяц бесплатно", "birinchi oy bepul"), brons: t("брони", "bronlar"), sales: t("Продажи через бронь", "Bron orqali savdo") },
      rem: { at: t("Напомним в", "Eslatamiz:"), buy: t("Купить новую упаковку до", "Yangi qadoqni sotib olish:"), and: t("и", "va") },
      close: t("Закрыть", "Yopish"),
    },
  };
}

function sitePage(l) {
  const t = T(l);
  const title = t("Oson Apteka · поиск лекарств и цен в аптеках Узбекистана", "Oson Apteka · O‘zbekiston dorixonalarida dori va narxlarni qidirish");
  const desc = t("Найдите лекарство по названию или действующему веществу, сравните цены в аптеках рядом, постройте маршрут и забронируйте. Бесплатно для покупателей.", "Dorini nomi yoki ta’sir qiluvchi moddasi bo‘yicha toping, yaqin dorixonalardagi narxlarni solishtiring, yo‘nalish tuzing va bron qiling. Xaridorlar uchun bepul.");
  return `${head(l, title, desc)}
<style>${CSS}</style>
</head>
<body>
<a class="vh" href="#search">${t("К поиску", "Qidiruvga o‘tish")}</a>
${header(l, t)}
<main>
${hero(l, t)}
${velo(l)}
${how(l, t)}
${catalog(l, t)}
${list(l, t)}
${map(l, t)}
${tarif(l, t)}
${addonBlocks(l, t)}
${pharm(l, t)}
${reviews(l, t)}
${admin(l, t)}
</main>
${footer(l, t)}
<a class="cfgb glass" href="${href(l)}#offer">${t("Конструктор", "Konstruktor")}</a>
<div class="dock glass" id="dock"><a class="btn btn-a" href="#top">${ICON.search}<span>${t("Найти лекарство", "Dori topish")}</span></a><button type="button" class="btn btn-g" id="dockl">${ICON.list}<span>${t("Список", "Ro‘yxat")}</span></button></div>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="shh"><div class="sh" data-close></div><div class="box"><div class="bh"><b id="shh"></b><button type="button" class="x" data-close aria-label="${t("Закрыть", "Yopish")}">${ICON.close}</button></div><div class="bb" id="shb"></div><div class="bf" id="shf"></div></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="oa-data">${JSON.stringify(data(l, t)).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}

/* ── Первая страница: залёт в бренд, выбор, конструктор DevUz ─────── */
function offer(l, t) {
  return `<section class="sec offer" id="offer"><div class="wrap">
<p class="kick"><i></i>${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</p>
<h2 class="h2">${t("Сайт <b>по этому макету</b>", "Shu maket <b>bo‘yicha sayt</b>")}</h2>
<p class="lead">${t(`48 часов с первого открытия макета: сайт ${usd(BASE.promo)} вместо ${usd(BASE.price)}. Допы включаются тумблером, и их блок на сайте тут же появляется или пропадает.`, `Maket birinchi ochilganidan 48 soat: sayt ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}. Qo‘shimchalar tumbler bilan yoqiladi va ularning bloki saytda darhol paydo bo‘ladi yoki yo‘qoladi.`)}</p>
<div class="cst"><div>
<div class="base"><div class="hd"><b>${esc(BASE[l].t)}</b><span class="pp"><s>${usd(BASE.price)}</s>${usd(BASE.promo)}</span></div><p>${esc(BASE[l].d)}</p></div>
<div class="adds">${ADDONS.map((a) => `<label class="add"><input type="checkbox" data-add="${a.id}" checked><span class="sw" aria-hidden="true"></span><span><b>${esc(a[l].t)}</b>${a.star ? `<span class="star">${t("берут первым", "birinchi oladilar")}</span>` : ""}<p>${esc(a[l].e)}</p><small>${esc(a[l].who)}</small></span><span class="ap">${usd(a.price)}</span></label>`).join("")}</div>
</div>
<aside class="sum glass" aria-live="polite">
<div class="row"><span>${t("Сайт", "Sayt")}</span><span>${usd(BASE.promo)}</span></div>
<div class="row"><span>${t("Допы", "Qo‘shimchalar")} <span id="addn"></span></span><span id="adds">0 $</span></div>
<div class="tot"><span>${t("Итого", "Jami")}</span><b id="total">${usd(ALL)}</b></div>
<p style="margin:16px 0 0;color:var(--mu);font-size:14px">${t("Цена сайта держится:", "Sayt narxi amal qiladi:")}</p>
<div class="timer" id="timer"><span><b id="th">48</b><small>${t("часов", "soat")}</small></span><span><b id="tm">00</b><small>${t("минут", "daqiqa")}</small></span><span><b id="ts">00</b><small>${t("секунд", "soniya")}</small></span></div>
<div class="ctrl"><button type="button" class="btn btn-g btn-s" id="allon">${t("Всё из макета", "Maketdagi hammasi")}</button><button type="button" class="btn btn-g btn-s" id="alloff">${t("Только сайт", "Faqat sayt")}</button></div>
<button type="button" class="btn btn-g" id="copy">${ICON.copy}<span>${t("Скопировать состав", "Tarkibni nusxalash")}</span></button>
<a class="btn btn-a" href="${DEVUZ}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
</aside></div>
</div></section>`;
}

function landPage(l) {
  const t = T(l);
  const site = [
    t("Залёт в бренд и поиск по названию и веществу с подсказками", "Brendga uchib kirish va maslahatli nom va modda bo‘yicha qidiruv"),
    t("20 лекарств с вашими ценами «от», фото и инструкциями", "«dan» narxlaringiz, suratlar va yo‘riqnomalar bilan 20 ta dori"),
    t("Аналоги, список из нескольких лекарств, аптеки рядом", "Analoglar, bir nechta dori ro‘yxati, yaqin dorixonalar"),
    t("Бронь в аптеке и «Мои брони» со статусом из панели", "Dorixonada bron va paneldan holati bilan «Bronlarim»"),
    t("Конструктор тарифов для покупателя и аптеки", "Xaridor va dorixona uchun tariflar konstruktori"),
  ];
  const pan = [
    t("Бронь с сайта первой строкой, статус виден покупателю", "Saytdan bron birinchi qatorda, holati xaridorga ko‘rinadi"),
    t("Поиски, брони, выкуп и что ищут, а в наличии нет", "Qidiruvlar, bronlar, olib ketish va nima qidiriladi, lekin yo‘q"),
    t("Аптеки: тариф, свежесть остатков, включить в выдачу", "Dorixonalar: tarif, qoldiqlar yangiligi, natijalarga qo‘shish"),
    t("Лекарства: цена «от», сколько аптек, спрос", "Dorilar: «dan» narxi, nechta dorixona, talab"),
    t("Роли: менеджер не видит выручку, история действий", "Rollar: menejer tushumni ko‘rmaydi, harakatlar tarixi"),
  ];
  const li = (a) => `<ul class="feat">${a.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>`;
  const steps = [
    t("Откройте сайт, найдите «Бепантен» или «декспантенол» и нажмите «Где купить».", "Saytni oching, «Bepanten» yoki «dekspantenol»ni toping va «Qayerdan olish»ni bosing."),
    t("Забронируйте в любой аптеке: имя и телефон любые, это макет.", "Istalgan dorixonada bron qiling: ism va telefon istalgan, bu maket."),
    t("Откройте админку: бронь первой строкой. Поставьте «Собрана», и сайт покажет это в «Мои брони».", "Admin panelni oching: bron birinchi qatorda. «Yig‘ildi» qo‘ying, sayt buni «Bronlarim»da ko‘rsatadi."),
  ];
  const ld = { base: BASE.promo, root: BASE_URL, hours: OFFER_HOURS, img: IMG, n: 60, add: ADDONS.map((a) => ({ id: a.id, p: a.price, t: a[l].t })), t: { copied: t("Состав скопирован", "Tarkib nusxalandi"), tot: t("Итого", "Jami") } };
  return `${head(l, t("Oson Apteka · макет сайта и панели · DevUz Studio", "Oson Apteka · sayt va panel maketi · DevUz Studio"), t("Макет для Oson Apteka: новый сайт справочника лекарств и панель броней и аптек. Конструктор цены.", "Oson Apteka uchun maket: dorilar ma’lumotnomasining yangi sayti va bronlar va dorixonalar paneli. Narx konstruktori."))}
<link rel="preload" as="image" href="${IMG}/poster-9.webp" media="(max-width: 899px)">
<link rel="preload" as="image" href="${IMG}/poster-16-2880.webp" media="(min-width: 900px)">
<style>${CSS}</style>
</head>
<body>
${dzIntroSolo(l)}
<header class="top"><div class="top-in glass">
${LOGO(l, "")}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}"><a href="#choose">${t("Сайт или панель", "Sayt yoki panel")}</a><a href="#try">${t("Как проверить", "Qanday tekshirish")}</a><a href="#offer">${t("Стоимость", "Narxi")}</a></nav>
<div class="langs">${LANGS.map((x) => `<a href="${href(x)}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<a class="btn btn-g btn-s adm" href="${href(l, "site")}">${t("Сайт", "Sayt")}</a>
<a class="btn btn-a btn-s" href="${href(l, "panel")}">${ICON.panel}<span>${t("Админка", "Admin panel")}</span></a>
</div></header>
<main>
<section class="hs" id="fly" aria-label="${t("Залёт в бренд Oson Apteka", "Oson Apteka brendiga uchib kirish")}"><div class="hs-st">
<picture><source media="(max-width: 899px)" srcset="${IMG}/poster-9.webp"><img class="hs-a" src="${IMG}/poster-16-1920.webp" srcset="${IMG}/poster-16-1920.webp 1920w, ${IMG}/poster-16-2880.webp 2880w" sizes="100vw" width="1920" height="1072" alt="${t("Знак Oson Apteka: синяя метка с красным крестом", "Oson Apteka belgisi: qizil xochli ko‘k belgi")}" fetchpriority="high"></picture>
<canvas aria-hidden="true"></canvas>
<div class="wrap hs-tx"><p class="kick"><i></i>${t("Макет DevUz Studio для Oson Apteka", "Oson Apteka uchun DevUz Studio maketi")}</p>
<h1>${words(t("Найти лекарство в <em>Oson&nbsp;Apteka</em> просто", "<em>Oson&nbsp;Apteka</em>’da dori topish oson"))}</h1>
<p class="lead">${t("Камера влетает в ваш знак и выходит над городом: каждая метка: аптека, где лекарство есть сейчас.", "Kamera belgingizga uchib kiradi va shahar ustidan chiqadi: har bir belgi: dori hozir bor dorixona.")}</p></div>
<div class="hs-p2"><div class="hs-card glass"><b>${t("3500 аптек · 14 регионов", "3500 dorixona · 14 hudud")}</b><span>${t("Справочник бесплатный для покупателей, платят аптеки", "Ma’lumotnoma xaridorlar uchun bepul, dorixonalar to‘laydi")}</span></div><a class="btn btn-a" href="#choose">${t("Смотреть макет", "Maketni ko‘rish")}${ICON.arrow}</a></div>
<div class="hs-load" id="hs-load" aria-hidden="true"><span id="hs-n">0</span>%<i id="hs-b"></i></div>
<div class="hs-hint" aria-hidden="true"><span>${t("Листайте", "Aylantiring")}</span><i></i></div>
</div></section>
<section class="sec" id="choose"><div class="wrap">
<p class="kick rise"><i></i>${t("Сайт и панель на ваших данных", "Ma’lumotlaringizdagi sayt va panel")}</p>
<h2 class="h2 rise">${t("Что посмотреть <b>первым</b>", "Avval <b>nimani ko‘rish</b>")}</h2>
<p class="lead rise">${t("Это работающий макет на ваших лекарствах и ценах с osonapteka.uz. Сайт, каким его увидит покупатель, или панель, где команда ведёт брони и аптеки.", "Bu osonapteka.uz’dagi dorilar va narxlaringizdagi ishlaydigan maket. Xaridor ko‘radigan sayt yoki jamoa bronlar va dorixonalarni olib boradigan panel.")}</p>
<div class="choices">
<a class="choice rise" href="${href(l, "site")}"><span class="ch-k">${t("Для покупателя", "Xaridor uchun")}</span><b>${t("Сайт-справочник", "Ma’lumotnoma sayti")}</b>
<span class="ch-pic"><img src="${IMG}/poster-16-1920.webp" width="1920" height="1072" alt="${t("Метка Oson Apteka", "Oson Apteka belgisi")}" loading="lazy"></span>
${li(site)}<span class="btn btn-g">${t("Открыть сайт", "Saytni ochish")}${ICON.arrow}</span></a>
<a class="choice rise" href="${href(l, "panel")}"><span class="ch-k">${t("Для вас и команды", "Siz va jamoa uchun")}</span><b>${t("Админка броней и аптек", "Bronlar va dorixonalar admin paneli")}</b>
<span class="ch-pic"><span class="browser"><span class="bh"><i></i><i></i><i></i></span><span class="bb"><span class="kpi"><small>${t("Брони, 30 дней · демо", "Bronlar, 30 kun · demo")}</small><b>2 418</b></span><span class="kpi"><small>${t("Бронь с сайта", "Saytdan bron")}</small><b>№5001</b></span><span class="kpi w"><small>${t("Поиски по дням · демо", "Kunlar bo‘yicha qidiruv · demo")}</small><span class="spark" id="lspark"></span></span></span></span></span>
${li(pan)}<span class="btn btn-a">${t("Открыть админку", "Admin panelni ochish")}${ICON.arrow}</span></a>
</div>
</div></section>
<section class="sec" id="try" style="background:var(--s2)"><div class="wrap">
<p class="kick rise"><i></i>${t("Как проверить за минуту", "Bir daqiqada qanday tekshirish")}</p>
<h2 class="h2 rise">${t("Сайт и панель <b>связаны</b>", "Sayt va panel <b>bog‘langan</b>")}</h2>
<ol class="ol">${steps.map((s) => `<li class="rise">${s}</li>`).join("")}</ol>
<div class="hero-act rise"><a class="btn btn-a" href="${href(l, "site")}">${t("Начать с сайта", "Saytdan boshlash")}${ICON.arrow}</a></div>
</div></section>
${offer(l, t)}
</main>
<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l, "")}<p style="margin-top:16px;font-size:14px">${t("Лекарства, цены «от», фото, инструкции, отзывы: osonapteka.uz. Аптеки, брони и цифры в панели: демо. Кадры залёта: Higgsfield, по вашему знаку.", "Dorilar, «dan» narxlar, suratlar, yo‘riqnomalar, sharhlar: osonapteka.uz. Paneldagi dorixonalar, bronlar va raqamlar: demo. Uchib kirish kadrlari: Higgsfield, belgingiz asosida.")}</p></div>
<div><h4>${t("Макет", "Maket")}</h4><a href="${href(l, "site")}">${t("Сайт", "Sayt")}</a><a href="${href(l, "panel")}">${t("Админка", "Admin panel")}</a><a href="#offer">${t("Стоимость", "Narxi")}</a></div>
<div><h4>DevUz Studio</h4><a href="https://devuz.studio" target="_blank" rel="noopener">devuz.studio</a><a href="${DEVUZ}" target="_blank" rel="noopener">Telegram</a></div>
<div><h4>Oson Apteka</h4><a href="tel:${COMPANY.tel}">${COMPANY.phone}</a><a href="${COMPANY.site}" target="_blank" rel="noopener">osonapteka.uz</a></div>
</div>
<div class="sm"><span>${t("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</span></div>
</div></footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="oa-land">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<script>
${LAND_JS}</script>
</body>
</html>`;
}

/* ── Панель (по эталону Greenwell) ─────────────────────────────────── */
(function checkDict() {
  const keys = new Set([...PANEL_JS.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  for (const k of ["tab_", "st_"]) keys.delete(k);
  for (const k of keys) {
    const v = PANEL_UI[k];
    if (!v || v.length !== 2 || v.some((x) => !x)) throw new Error(`panel: нет подписи «${k}» на двух языках`);
    if (/[А-Яа-яЁё]/.test(v[1])) throw new Error(`panel: кириллица в узбекской подписи «${k}»`);
  }
  if (/[А-Яа-яЁё]/.test(PANEL_JS + PANEL_CSS)) throw new Error("panel: кириллица в коде панели");
})();

function panelPage(l) {
  const t = T(l);
  const ui = Object.fromEntries(Object.entries(PANEL_UI).map(([k, v]) => [k, v[l === "ru" ? 0 : 1]]));
  const pd = {
    l, sum: l === "ru" ? "сум" : "so‘m", site: href(l, "site"), home: href(l), ui, dist: DISTRICTS[l],
    tf: { base: PHARMACY.base.price, top: PHARMACY.opts.find((o) => o.id === "top").price, fee: PHARMACY.opts.find((o) => o.id === "bron").fee },
    p: CATALOG.map((p) => ({ id: p.id, n: p.short[l], f: p.name[l], pr: p.price, rx: p.rx ? 1 : 0, im: ph(p) })),
  };
  return `${head(l, t("Панель Oson Apteka · демо", "Oson Apteka paneli · demo"), t("Панель Oson Apteka: брони с сайта, аптеки и тарифы, лекарства и спрос, история и роли. Демо-данные.", "Oson Apteka paneli: saytdan bronlar, dorixonalar va tariflar, dorilar va talab, tarix va rollar. Demo ma’lumotlar."))}
<style>${CSS}${PANEL_CSS}</style>
</head>
<body class="pn">
<div id="app"></div>
<footer class="pn-foot">${t("Макет DevUz Studio, демо-данные. Пользуясь макетом, вы принимаете", "DevUz Studio maketi, demo ma’lumotlar. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</footer>
<script type="application/json" id="pn-data">${JSON.stringify(pd).replace(/</g, "\\u003c")}</script>
<script>
${PANEL_JS}</script>
</body>
</html>`;
}

const out = {};
for (const l of LANGS) {
  out[KEY[l]] = landPage(l);
  out[(KEY[l] ? KEY[l] + "/" : "") + "site"] = sitePage(l);
  out[(KEY[l] ? KEY[l] + "/" : "") + "panel"] = panelPage(l);
}
for (const [k, v] of Object.entries(out)) {
  const lang = k.startsWith("uz") ? "uz" : "ru";
  if (lang === "uz") {
    const vis = v.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style>[\s\S]*?<\/style>/g, "");
    const m = vis.match(/[^\s<>"]*[А-Яа-яЁё][^\s<>"]*/g);
    if (m) throw new Error(`${k}: кириллица на узбекской странице: ${[...new Set(m)].slice(0, 12).join(" ")}`);
  }
  if (/[\u2014\u2013]/.test(v.replace(/<script[\s\S]*?<\/script>/g, ""))) throw new Error(`${k}: длинное тире на странице`);
}
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/* Сборка для сервера (lib/proto/bundles): стили и скрипты один раз. */
const parts = { J: `<script>\n${JS}</script>`, C: `<style>${CSS}</style>`, PJ: `<script>\n${PANEL_JS}</script>`, LJ: `<script>\n${LAND_JS}</script>` };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const [name, part] of Object.entries(parts)) p = p.split(part).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "osonapteka.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(10), v.length);
