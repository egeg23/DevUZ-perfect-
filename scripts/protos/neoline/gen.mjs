import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { LANGS, COMPANY, CATS, CATALOG, PHOTOS, GIFT, HOOKS, RADARS, RADARS_UZ, ABOUT, WARRANTY, SERVICE, SUPPORT, UPDATE_STEPS, PAY } from "./data.mjs";
import { BASE, ADDONS, OFFER_HOURS, ALL } from "./plan.mjs";
import { PANEL_UI } from "./panel-ui.mjs";

/*
 * Макет Neoline (neoline.uz), 29.10.2026: официальный магазин радар-детекторов,
 * видеорегистраторов и автоакустики в Узбекистане. Страницы на uz и ru:
 *
 *   видео DevUz → залёт камерой над хромовыми буквами NEOLINE, знак «N»
 *   встаёт в шапку (intro/) → первый экран: X-COP 8900, радарные волны,
 *   жидкое стекло → бегущая строка выгод → «Радар в деле» по прокрутке →
 *   стеклянные папки разделов → стенд 8900 пальцем → каталог (поиск,
 *   разделы, сортировка, сравнение, корзина, оформление, статус) → подбор →
 *   обновления по модели → почему официальный → сервис и поддержка → бот,
 *   Uzum, статьи, панель (допы) → конструктор «Предложение DevUz Studio».
 *   Панель магазина — panel, uz/panel (по эталону Greenwell).
 *
 * Товары, цены, тексты и фото — только с их сайта (data.mjs). Формы ничего
 * не отправляют наружу: заказ ложится в браузер и виден в панели, звонок и
 * Telegram — их. Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/neoline";
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const CSS = strip(readFileSync(DIR + "site.css", "utf8")).replace(/\n\s*/g, "");
const JS = strip(readFileSync(DIR + "site.js", "utf8")).replace(/\n\s*\n/g, "\n");
const LAND_JS = strip(readFileSync(DIR + "land.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_JS = strip(readFileSync(DIR + "panel.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_CSS = strip(readFileSync(DIR + "panel.css", "utf8")).replace(/\n\s*/g, "");
const BASE_URL = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Unbounded:wght@400;700&display=swap";
const KEY = { ru: "", uz: "uz" };
const DEVUZ = "https://t.me/Devuz_studio_bot?start=neoline";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, p = "") => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/" + (p ? p : "");
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const sum = (n, l) => `${fmt(n)}\u00a0${l === "ru" ? "сум" : "so‘m"}`;
const usd = (n) => `${fmt(n)}\u00a0$`;
const ph = (n, w) => `${IMG}/p/${n}-${w}.webp`;
const P = (id) => PHOTOS[String(id)] ?? [];
const byId = (id) => CATALOG.find((p) => p.id === id);
/* Слово на слово для анимации заголовка. */
const words = (txt) => txt.split(" ").map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");

const I = (dd) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  back: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  cart: I('<path d="M3 4h2l2.4 11h11L21 7H6.2"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>'),
  search: I('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  cmp: I('<path d="M7 4v16M17 4v16M4 8h6M14 16h6"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  shield: I('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6Z"/><path d="m9 12 2 2 4-4"/>'),
  road: I('<path d="M8 3 4 21M16 3l4 18M12 4v3M12 11v3M12 18v2"/>'),
  award: I('<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7"/>'),
  truck: I('<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17.5" cy="17.5" r="1.6"/>'),
  wrench: I('<path d="M14.5 4.5a4.5 4.5 0 0 0-5.8 5.8L3.5 15.5l5 5 5.2-5.2a4.5 4.5 0 0 0 5.8-5.8l-3 3-3-3Z"/>'),
  hand: I('<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11M12 10.5V4a1.5 1.5 0 0 1 3 0v7M15 10.5V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.8-2.4L3.6 14a1.5 1.5 0 0 1 2.3-1.9L9 15V11"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  panel: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/>'),
  sync: I('<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.7L4 16M4 20v-4h4"/>'),
};
/* Знак Neoline: две половины «N» из их logo.svg (viewBox 5 8 69.5 47). */
const MARK = `<svg class="mk" viewBox="5 8 69.5 47" aria-hidden="true" focusable="false"><path fill="currentColor" d="M58.6 8v11.9L46.8 31.7V19.9h-7.6L21.1 38H5.2l7.9-8 22-22z"/><path fill="currentColor" d="M21 54.9V43l11.8-11.8V43h7.7l18-18.1h16l-8 8-22 22z"/></svg>`;
const LOGO = (l, to = "site") => `<a class="logo" href="${href(l, to)}" aria-label="Neoline">${MARK}<span class="word">NEOLINE</span></a>`;

const isHybrid = (p) => p.cat === "radar" && /видеорегистратор/i.test(p.text.ru.join(" "));
const catName = (id, l) => CATS.find((c) => c.id === id)[l];

/* ── Части страницы ───────────────────────────────────────────────── */
function head(l, t, title, desc) {
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#05080c">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}

function header(l, t) {
  const nav = [["radar", t("Радар в деле", "Radar ishda")], ["catalog", t("Каталог", "Katalog")], ["upd", t("Обновления", "Yangilanishlar")], ["service", t("Сервис", "Servis")]];
  return `<header class="top"><div class="mbar"><a href="${href(l)}">${ICON.back}<span>${t("Макет для Neoline", "Neoline uchun maket")}</span></a><a class="mb-adm" href="${href(l, "panel")}">${ICON.panel}<span>${t("Админка магазина", "Do‘kon admin paneli")}</span>${ICON.arrow}</a></div><div class="top-in glass">
${LOGO(l)}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([id, n]) => `<a href="#${id}"${id === "upd" ? ' data-addon="upd"' : ""}>${n}</a>`).join("")}<a href="${href(l)}#offer">${t("Предложение", "Taklif")}</a></nav>
<button type="button" class="mine" id="mine">${ICON.truck}<span>${t("Мой заказ", "Buyurtmam")}</span></button>
<div class="langs">${LANGS.map((x) => `<a href="${href(x, "site")}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<button type="button" class="cartb" id="cartb" aria-label="${t("Корзина", "Savat")}">${ICON.cart}<i id="cartn"></i></button>
</div></header>`;
}

function hero(l, t) {
  const p = byId(1000458), g = byId(GIFT.gift);
  const ring = (r) => `<circle cx="500" cy="500" r="${r}" fill="none" stroke="rgb(0 171 235 / .16)" stroke-width="1"/>`;
  return `<section class="hero" id="top" aria-label="Neoline X-COP 8900">
<div class="hero-bg" aria-hidden="true"><div class="grid"></div>
<div class="radar" data-par="0.12"><svg viewBox="0 0 1000 1000">
<defs><linearGradient id="sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00abeb" stop-opacity="0"/><stop offset="1" stop-color="#00abeb" stop-opacity=".32"/></linearGradient></defs>
${[120, 220, 320, 420, 490].map(ring).join("")}
<path d="M500 10v980M10 500h980" stroke="rgb(0 171 235 / .08)"/>
<g class="sweep"><path d="M500 500 L990 500 A490 490 0 0 0 846 154 Z" fill="url(#sw)"/><path d="M500 500H990" stroke="#4fcbff" stroke-opacity=".6"/></g>
<circle class="pulse" cx="500" cy="500" r="490" fill="none" stroke="#4fcbff" stroke-width="2"/><circle class="pulse" cx="500" cy="500" r="490" fill="none" stroke="#4fcbff" stroke-width="2"/><circle class="pulse" cx="500" cy="500" r="490" fill="none" stroke="#4fcbff" stroke-width="2"/>
</svg></div></div>
<div class="wrap hero-in">
<div>
<p class="kick rise">${esc(COMPANY.shop[l])}</p>
<h1>${words(t("Радар-детекторы, <em>настроенные</em> под дороги Узбекистана", "O‘zbekiston yo‘llariga <em>sozlangan</em> radar detektorlari"))}</h1>
<p class="lead rise">${t("X-COP узнают MultaRadar, Кордон, Скат, Lochin и AutoCon по сигнатуре и говорят о камерах на узбекском и русском. Официальная гарантия, бесплатная доставка за 1-3 дня.", "X-COP MultaRadar, Kordon, Skat, Lochin va AutoCon’ni signatura bo‘yicha taniydi va kameralar haqida o‘zbek va rus tilida aytadi. Rasmiy kafolat, 1-3 kunda bepul yetkazib berish.")}</p>
<div class="hero-act rise"><button type="button" class="btn btn-a" data-buy="${p.id}">${ICON.cart}<span>${t("Купить X-COP 8900", "X-COP 8900 sotib olish")}</span></button><a class="btn btn-g" href="#catalog">${t("Весь каталог", "Butun katalog")}</a></div>
<p class="paysr rise"><span>Payme</span><span>UzCard</span><span>Humo</span><span>Uzum Nasiya</span><span data-addon="pay" class="plus">Click</span><span data-addon="pay" class="plus">Uzum Bank</span></p>
</div>
<div class="hero-prod" data-tiltbox>
<span class="shadow" aria-hidden="true"></span>
<div class="ph" data-par="-0.08" data-tilt><img src="${ph(P(p.id)[0].n, 1600)}" srcset="${ph(P(p.id)[0].n, 800)} 800w, ${ph(P(p.id)[0].n, 1600)} 1600w" sizes="(min-width: 1000px) 50vw, 100vw" width="${P(p.id)[0].w}" height="${P(p.id)[0].h}" alt="Neoline X-COP 8900" fetchpriority="high"></div>
<span class="chipf c1 glass" data-par="-0.2"><i></i>PRO III</span>
<span class="chipf c2 glass" data-par="-0.26"><i></i>Wi-Fi Hotspot</span>
<span class="chipf c3 glass" data-par="-0.14"><i></i>${t("Авто пресеты", "Avto presetlar")}</span>
<div class="hcard glass" data-par="-0.05"><div class="n">Neoline X-COP 8900</div><div class="p">${sum(p.price, l)}</div>
<div class="g"><img src="${ph(P(g.id)[0].n, 800)}" width="${P(g.id)[0].w}" height="${P(g.id)[0].h}" alt="Neoline Turbocam"><span>${t("<b>Turbocam в подарок</b> к X-COP 8900 и 7900", "X-COP 8900 va 7900’ga <b>Turbocam sovg‘a</b>")}</span></div></div>
</div>
</div></section>`;
}

function velo(l) {
  const a = HOOKS[l], b = (l === "ru" ? RADARS : RADARS_UZ).map((r) => r);
  const row = (arr, cls) => `<div class="row${cls}">${[...arr, ...arr, ...arr].map((x) => `<span>${esc(x)}</span>`).join("")}</div>`;
  return `<div class="velo" aria-label="${l === "ru" ? "Почему Neoline" : "Nega Neoline"}">${row(a, "")}${row(b, " rev")}</div>`;
}

function road(l, t) {
  const caps = [
    [t("Кордон в спину, 650 метров", "Kordon orqadan, 650 metr"), t("Сигнатура: X-COP узнаёт радар из своей библиотеки сигнатур и называет его на экране, а не просто пищит на любой сигнал.", "Signatura: X-COP radarni o‘z signaturalar kutubxonasidan taniydi va ekranda nomini ko‘rsatadi, har qanday signalga shunchaki chiyillamaydi.")],
    [t("Камеры контроля ПДД", "YHQ nazorat kameralari"), t("Полоса ОТ, «в спину», запрет остановки, обочина, перекрёсток, зебра, разметка: о каждой камере заранее.", "Jamoat transporti yo‘lagi, «orqadan», to‘xtash taqiqi, yo‘l chekkasi, chorraha, zebra, chiziqlar: har bir kamera haqida oldindan.")],
    [t("Зона тишины там, где вы скажете", "Siz aytgan joyda sokinlik zonasi"), t("Возле дома и на привычном маршруте прибор молчит, в опасной зоне предупреждает громче.", "Uy yonida va odatiy yo‘nalishda qurilma jim turadi, xavfli zonada balandroq ogohlantiradi.")],
    [t("База камер всего Узбекистана", "Butun O‘zbekiston kameralari bazasi"), t("Команда Neoline следит за новыми радарами и камерами и обновляет прошивки. X-COP 8900 и 7900 обновляются по Wi-Fi Hotspot со смартфона.", "Neoline jamoasi yangi radar va kameralarni kuzatib boradi va proshivkani yangilaydi. X-COP 8900 va 7900 smartfondan Wi-Fi Hotspot orqali yangilanadi.")],
  ];
  const rl = l === "ru" ? RADARS : RADARS_UZ;
  const p = byId(1000458);
  return `<section class="road" id="radar" aria-label="${t("Радар в деле", "Radar ishda")}"><div class="road-st"><div class="wrap road-in">
<div>
<p class="kick">${t("Радар в деле", "Radar ishda")}</p>
<h2 class="h2">${t("Прокрутите: вы <b>едете</b>", "Aylantiring: siz <b>yo‘ldasiz</b>")}</h2>
<div class="caps">${caps.map(([h, p2], i) => `<div class="cap${i ? "" : " on"}"><h3>${h}</h3><p>${p2}</p></div>`).join("")}</div>
<div class="prog" aria-hidden="true">${caps.map(() => "<i><b></b></i>").join("")}</div>
<div class="rlist" aria-label="${t("Радары, которые X-COP узнаёт по сигнатуре", "X-COP signatura bo‘yicha taniydigan radarlar")}">${rl.map((r) => `<span>${esc(r)}</span>`).join("")}</div>
</div>
<div class="scene" aria-hidden="true">
<svg class="rd" viewBox="0 0 800 550" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1c2b"/><stop offset=".5" stop-color="#06101a"/></linearGradient>
<linearGradient id="asf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1620"/><stop offset="1" stop-color="#16212c"/></linearGradient></defs>
<rect width="800" height="550" fill="url(#sky)"/>
<g><rect x="0" y="141" width="28" height="49" fill="#0b1824"/><rect x="4" y="151" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="6" y="170" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="4" y="179" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="28" y="105" width="20" height="85" fill="#0b1824"/><rect x="32" y="141" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="39" y="165" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="40" y="126" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="53" y="86" width="38" height="104" fill="#0b1824"/><rect x="95" y="110" width="36" height="80" fill="#0b1824"/><rect x="132" y="89" width="19" height="101" fill="#0b1824"/><rect x="139" y="148" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="155" y="87" width="21" height="103" fill="#0b1824"/><rect x="166" y="180" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="159" y="167" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="181" y="113" width="24" height="77" fill="#0b1824"/><rect x="209" y="152" width="40" height="38" fill="#0b1824"/><rect x="215" y="177" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="243" y="179" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="239" y="182" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="241" y="176" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="251" y="129" width="27" height="61" fill="#0b1824"/><rect x="261" y="140" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="280" y="97" width="34" height="93" fill="#0b1824"/><rect x="306" y="160" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="302" y="112" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="318" y="139" width="31" height="51" fill="#0b1824"/><rect x="325" y="176" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="322" y="149" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="353" y="164" width="43" height="26" fill="#0b1824"/><rect x="378" y="179" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="385" y="171" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="373" y="177" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="360" y="170" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="375" y="180" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="401" y="165" width="44" height="25" fill="#0b1824"/><rect x="428" y="181" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="405" y="178" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="414" y="180" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="435" y="171" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="422" y="173" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="446" y="159" width="30" height="31" fill="#0b1824"/><rect x="477" y="109" width="32" height="81" fill="#0b1824"/><rect x="488" y="132" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="497" y="150" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="493" y="160" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="492" y="144" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="509" y="141" width="23" height="49" fill="#0b1824"/><rect x="522" y="161" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="535" y="85" width="44" height="105" fill="#0b1824"/><rect x="554" y="127" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="580" y="92" width="31" height="98" fill="#0b1824"/><rect x="602" y="170" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="587" y="163" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="616" y="154" width="39" height="36" fill="#0b1824"/><rect x="647" y="181" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="631" y="172" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="631" y="163" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="660" y="153" width="30" height="37" fill="#0b1824"/><rect x="665" y="165" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="691" y="117" width="21" height="73" fill="#0b1824"/><rect x="694" y="129" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="703" y="132" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="695" y="146" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="694" y="127" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="716" y="141" width="30" height="49" fill="#0b1824"/><rect x="727" y="169" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="730" y="177" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="722" y="178" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="734" y="177" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="721" y="156" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="751" y="127" width="28" height="63" fill="#0b1824"/><rect x="759" y="166" width="3" height="4" fill="#4fcbff" opacity=".35"/><rect x="760" y="166" width="3" height="4" fill="#4fcbff" opacity=".6"/><rect x="758" y="177" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="779" y="93" width="42" height="97" fill="#0b1824"/><rect x="787" y="132" width="3" height="4" fill="#4fcbff" opacity=".2"/><rect x="805" y="120" width="3" height="4" fill="#4fcbff" opacity=".6"/></g><rect y="188" width="800" height="3" fill="#00abeb" opacity=".25"/>
<path d="M372 190 L428 190 L800 550 L0 550Z" fill="url(#asf)"/>
<path d="M372 190 L0 550" stroke="#3a4a58" stroke-width="3"/><path d="M428 190 L800 550" stroke="#3a4a58" stroke-width="3"/>
<g id="dash"></g>
</svg>
<div class="pole"><svg viewBox="0 0 120 260"><path class="beam" d="M60 30 L-60 260 L180 260Z" fill="rgb(255 71 87 / .14)"/><rect x="56" y="40" width="8" height="220" fill="#56616c"/><rect x="20" y="10" width="80" height="40" rx="8" fill="#1d2731" stroke="#7c8995"/><circle cx="44" cy="30" r="9" fill="#0b1016" stroke="#4fcbff"/><circle cx="76" cy="30" r="5" fill="#ff4757"/></svg></div>
<svg class="car" viewBox="0 0 200 120"><path d="M30 70 Q34 40 60 32 L140 32 Q166 40 170 70 L178 76 Q182 92 172 100 L28 100 Q18 92 22 76Z" fill="#cfd8e0"/><path d="M58 38 L142 38 Q156 46 160 64 L40 64 Q44 46 58 38Z" fill="#1a2733"/><rect x="34" y="72" width="30" height="10" rx="4" fill="#ff4757"/><rect x="136" y="72" width="30" height="10" rx="4" fill="#ff4757"/><rect x="76" y="80" width="48" height="12" rx="3" fill="#e9eef2" stroke="#7c8995"/><rect x="28" y="100" width="26" height="14" rx="4" fill="#0b1016"/><rect x="146" y="100" width="26" height="14" rx="4" fill="#0b1016"/></svg>
<div class="oled" id="oled"><div class="t"><span class="type" id="o-type">${t("КОРДОН", "KORDON")}</span><span class="zone" id="o-zone">${t("в спину", "orqadan")}</span></div>
<div class="m"><span class="lim" id="o-lim">60</span><span class="sp" id="o-sp">60</span></div>
<div class="d" id="o-d">650 ${t("м", "m")}</div><div class="bar"><b id="o-bar"></b></div></div>
<div class="dev"><img src="${ph(P(p.id)[0].n, 800)}" width="${P(p.id)[0].w}" height="${P(p.id)[0].h}" alt="" loading="lazy"></div>
</div>
</div></div></section>`;
}

function cats(l, t) {
  const pick = { radar: [1000435, 1000458, 1000268], dvr: [999441, 584, 642], audio: [692, 709, 721], acc: [667, 745, 652] };
  return `<section class="sec sx" id="cats"><div class="wrap">
<p class="kick rise">${t("Разделы", "Bo‘limlar")}</p>
<h2 class="h2 rise">${t("Всё для машины <b>от одного бренда</b>", "Mashina uchun hammasi <b>bitta brenddan</b>")}</h2>
<div class="cats">${Object.entries(pick).map(([c, ids], i) => {
    const n = CATALOG.filter((p) => p.cat === c).length;
    return `<button type="button" class="gf pop" data-cat="${c}" style="transition-delay:${i * 90}ms"><span class="back"></span><span class="items">${ids.map((id) => `<img src="${ph(P(id)[0].n, 800)}" width="${P(id)[0].w}" height="${P(id)[0].h}" alt="" loading="lazy">`).join("")}</span><span class="front glass"><b>${catName(c, l)}</b><small>${n} ${t("моделей", "model")}</small></span></button>`;
  }).join("")}</div>
</div></section>`;
}

function stand(l, t) {
  const p = byId(1000458), shots = P(p.id);
  return `<section class="sec sx" id="stand"><div class="wrap stand">
<div class="turn tilt" id="turn" tabindex="0" role="img" aria-label="${t("X-COP 8900 с разных сторон: потяните влево или вправо", "X-COP 8900 turli tomondan: chapga yoki o‘ngga torting")}">
<span class="floor" aria-hidden="true"></span>
${shots.map((s, i) => `<img src="${ph(s.n, i ? 1600 : 1600)}" width="${s.w}" height="${s.h}" alt=""${i ? ' loading="lazy"' : ""}${i ? "" : ' class="on"'}>`).join("")}
<span class="hand glass">${ICON.hand}<span>${t("Потяните, чтобы покрутить", "Aylantirish uchun torting")}</span></span>
<span class="dots" aria-hidden="true">${shots.map((s, i) => `<i${i ? "" : ' class="on"'}></i>`).join("")}</span>
</div>
<div>
<p class="kick rise">${t("Флагман X-COP", "X-COP flagmani")}</p>
<h2 class="h2 rise">Neoline X-COP 8900</h2>
<p class="lead" data-reveal>${t("Фирменная радарная платформа PRO III, авто пресеты, дисплей 2,4″, новый интерфейс NEO UI, обновление по Wi-Fi Hotspot и GPS-база радаров и камер всего Узбекистана.", "PRO III firma radar platformasi, avto presetlar, 2,4″ displey, yangi NEO UI interfeysi, Wi-Fi Hotspot orqali yangilash va butun O‘zbekiston radarlari va kameralari GPS bazasi.")}</p>
<ul class="feat">${p.text[l].slice(0, 6).map((x) => `<li class="rise">${ICON.check}<span>${esc(x)}</span></li>`).join("")}</ul>
<div class="hero-act"><button type="button" class="btn btn-a" data-buy="${p.id}">${ICON.cart}<span>${sum(p.price, l)}</span></button><button type="button" class="btn btn-g" data-open="${p.id}">${t("Подробнее", "Batafsil")}</button></div>
</div>
</div></section>`;
}

function card(p, l, t) {
  const sh = P(p.id)[0];
  const tag = GIFT.ids.includes(p.id) ? `<span class="tag gift">${t("Turbocam в подарок", "Turbocam sovg‘a")}</span>` : !p.stock ? `<span class="tag wait">${t("Ожидается поступление", "Kelishi kutilmoqda")}</span>` : p.old ? `<span class="tag off">−${Math.round((1 - p.price / p.old) * 100)}%</span>` : "";
  return `<article class="card" data-id="${p.id}" data-cat="${p.cat}" data-price="${p.price}" data-q="${esc((p.name[l] + " " + catName(p.cat, l) + (isHybrid(p) ? " " + t("гибрид", "gibrid") : "")).toLowerCase())}">${tag}
<button type="button" class="pic" data-open="${p.id}" aria-label="${esc(p.name[l])}">${sh ? `<img src="${ph(sh.n, 800)}" width="${sh.w}" height="${sh.h}" alt="${esc(p.name[l])}" loading="lazy">` : ""}</button>
<div class="bd"><span class="cat">${isHybrid(p) ? t("Гибрид", "Gibrid") : catName(p.cat, l)}</span><h3>${esc(p.name[l])}</h3>
<div class="pr"><b>${sum(p.price, l)}</b>${p.old ? `<s>${sum(p.old, l)}</s>` : ""}</div>
<div class="row"><button type="button" class="btn btn-a btn-s" data-buy="${p.id}"${p.stock ? "" : " disabled"}>${p.stock ? t("В корзину", "Savatga") : t("Ожидается", "Kutilmoqda")}</button><button type="button" class="cmpb" data-addon="compare" data-cmp="${p.id}" aria-pressed="false" aria-label="${t("Сравнить", "Solishtirish")}">${ICON.cmp}</button></div></div></article>`;
}

function catalog(l, t) {
  return `<section class="sec" id="catalog"><div class="wrap">
<p class="kick rise">${t("Каталог", "Katalog")}</p>
<h2 class="h2 rise">${t("Цены как на <b>neoline.uz</b>", "Narxlar <b>neoline.uz</b>dagidek")}</h2>
<div class="cbar"><div class="tabs" role="tablist" aria-label="${t("Разделы каталога", "Katalog bo‘limlari")}"><button type="button" role="tab" aria-selected="true" data-tab="all">${t("Все", "Hammasi")}</button>${CATS.map((c) => `<button type="button" role="tab" aria-selected="false" data-tab="${c.id}">${c[l]}</button>`).join("")}</div>
<label class="srch">${ICON.search}<input type="search" id="q" placeholder="${t("X-COP, Turbocam, Ultera…", "X-COP, Turbocam, Ultera…")}" aria-label="${t("Поиск по каталогу", "Katalog bo‘yicha qidiruv")}"></label>
<select class="sort" id="sort" aria-label="${t("Порядок", "Tartib")}"><option value="pop">${t("Сначала популярные", "Avval ommabop")}</option><option value="lo">${t("Сначала дешевле", "Avval arzonroq")}</option><option value="hi">${t("Сначала дороже", "Avval qimmatroq")}</option></select></div>
<p class="note" data-addon="erp"><i></i><span>${t("Остатки и цены из 1С: <b id=\"erpt\">обновлено сейчас</b> · демо", "1C’dan qoldiq va narxlar: <b id=\"erpt\">hozir yangilandi</b> · demo")}</span></p>
<div class="grid" id="grid">${CATALOG.map((p) => card(p, l, t)).join("")}<p class="empty" id="empty" hidden>${t("Ничего не нашли. Попробуйте «X-COP» или «Ultera».", "Hech narsa topilmadi. «X-COP» yoki «Ultera» deb ko‘ring.")}</p></div>
</div></section>`;
}

function pick(l, t) {
  const qs = [
    ["goal", t("Что важнее всего?", "Eng muhimi nima?"), [["radar", t("Знать о радарах и камерах", "Radar va kameralar haqida bilish")], ["dvr", t("Записывать дорогу", "Yo‘lni yozib olish")], ["hyb", t("Всё в одном приборе", "Hammasi bitta qurilmada")], ["audio", t("Звук в машине", "Mashinadagi ovoz")]]],
    ["mount", t("Как ставить?", "Qanday o‘rnatish?"), [["glass", t("На стекло, на виду", "Oynaga, ko‘rinadigan joyga")], ["hide", t("Скрыто, чтобы не видно", "Yashirin, ko‘rinmasin")], ["any", t("Без разницы", "Farqi yo‘q")]]],
    ["car", t("Какая машина?", "Qanday mashina?"), [["car", t("Легковая", "Yengil avtomobil")], ["work", t("Коммерческий транспорт", "Tijorat transporti")], ["any", t("Без разницы", "Farqi yo‘q")]]],
    ["budget", t("Бюджет", "Byudjet"), [["1", t("До 1 млн сум", "1 mln so‘mgacha")], ["2", t("1-2,5 млн сум", "1-2,5 mln so‘m")], ["3", t("Больше 2,5 млн", "2,5 mln dan ko‘p")]]],
  ];
  return `<section class="sec sx" id="pick" data-addon="pick"><div class="wrap split">
<div><p class="kick rise">${t("Подбор", "Tanlov")}</p><h2 class="h2 rise">${t("Четыре вопроса, и <b>ваша модель</b>", "To‘rtta savol va <b>sizning modelingiz</b>")}</h2><p class="lead rise">${t("Подбор считает по вашему каталогу: что прибор умеет по описанию на neoline.uz и сколько стоит.", "Tanlov katalogingiz bo‘yicha hisoblaydi: neoline.uz’dagi tavsifga ko‘ra qurilma nima qila oladi va qancha turadi.")}</p></div>
<div class="panel quiz tilt" id="quiz"><div class="steps">${qs.map((_, i) => `<i${i ? "" : ' class="on"'}></i>`).join("")}</div>
${qs.map(([k, q, o], i) => `<div class="step${i ? "" : " on"}" data-q="${k}"><p class="q">${q}</p><div class="opts">${o.map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="false">${n}</button>`).join("")}</div></div>`).join("")}
<div class="step" data-q="res"><p class="q">${t("Под ваши ответы", "Javoblaringizga mos")}</p><div class="recs" id="recs"></div><button type="button" class="btn btn-g btn-s" id="qagain" style="margin-top:16px">${t("Пройти ещё раз", "Qaytadan o‘tish")}</button></div>
</div></div></section>`;
}

function compare(l, t) {
  return `<section class="sec" id="compare" data-addon="compare" hidden><div class="wrap">
<p class="kick">${t("Сравнение", "Solishtirish")}</p><h2 class="h2">${t("Рядом, <b>по строкам</b>", "Yonma-yon, <b>qatorma-qator</b>")}</h2>
<div class="cmpw"><table class="cmpt" id="cmpt"></table></div>
<button type="button" class="btn btn-g btn-s" id="cmpclr" style="margin-top:16px">${t("Очистить сравнение", "Solishtirishni tozalash")}</button>
</div></section>`;
}

function updates(l, t) {
  return `<section class="sec sx" id="upd" data-addon="upd"><div class="wrap split">
<div><p class="kick rise">${t("Обновление устройств", "Qurilmalarni yangilash")}</p><h2 class="h2 rise">${t("База камер и прошивка <b>по модели</b>", "Kameralar bazasi va proshivka <b>model bo‘yicha</b>")}</h2>
<p class="lead rise">${t("Сейчас на сайте четыре шага через личный кабинет. Здесь владелец X-COP находит свою модель, видит способ обновления и дату последней базы, которую магазин ставит в панели.", "Hozir saytda shaxsiy kabinet orqali to‘rtta qadam. Bu yerda X-COP egasi o‘z modelini topadi, yangilash usulini va do‘kon paneldan qo‘yadigan oxirgi baza sanasini ko‘radi.")}</p>
<details class="acc rise"><summary>${t("Как это работает сейчас на neoline.uz", "Hozir neoline.uz’da qanday ishlaydi")}</summary><ol class="ol">${UPDATE_STEPS[l].map((s) => `<li>${esc(s)}</li>`).join("")}</ol></details></div>
<div class="panel tilt"><label class="srch">${ICON.search}<input type="search" id="uq" placeholder="${t("Ваша модель: 8900, 7700s, Spectrum…", "Modelingiz: 8900, 7700s, Spectrum…")}" aria-label="${t("Модель устройства", "Qurilma modeli")}"></label>
<div class="upd-res" id="ures"></div></div>
</div></section>`;
}

function why(l, t) {
  const a = ABOUT[l];
  const items = [
    [ICON.shield, t("Гарантия только у версии для Узбекистана", "Kafolat faqat O‘zbekiston versiyasida"), WARRANTY[l][0] + " " + WARRANTY[l][1]],
    [ICON.road, t("Сотни часов на дорогах Узбекистана", "O‘zbekiston yo‘llarida yuzlab soat"), a.uz],
    [ICON.award, "Red Dot Design Award", a.award + " " + a.brand],
  ];
  return `<section class="sec sx" id="why"><div class="wrap">
<p class="kick rise">${t("Почему в официальном магазине", "Nega rasmiy do‘kondan")}</p>
<h2 class="h2 rise" data-reveal>${t("Прибор с рынка может быть сделан для другой страны", "Bozordagi qurilma boshqa mamlakat uchun qilingan bo‘lishi mumkin")}</h2>
<div class="why">${items.map(([ic, h, p], i) => `<div class="panel pop" style="transition-delay:${i * 100}ms"><span class="ico">${ic}</span><h3>${h}</h3><p>${esc(p)}</p></div>`).join("")}</div>
</div></section>`;
}

function service(l, t) {
  return `<section class="sec sx" id="service"><div class="wrap">
<p class="kick rise">${t("Сервис и поддержка", "Servis va yordam")}</p>
<h2 class="h2 rise">${t("Если что-то пошло не так, <b>есть куда прийти</b>", "Biror narsa noto‘g‘ri ketsa, <b>boradigan joy bor</b>")}</h2>
<div class="svc">
${SERVICE.map((s) => `<div class="panel rise"><span class="ico">${ICON.wrench}</span><h3 style="margin-top:16px">${esc(typeof s.name === "string" ? s.name : s.name[l])}</h3><p>${esc(s[l].addr)}</p><p>${esc(s[l].hours)}</p><a class="btn btn-g btn-s" href="tel:${s.tel}">${ICON.phone}<span>${s.phone}</span></a></div>`).join("")}
<div class="panel rise"><span class="ico">${ICON.tg}</span><h3 style="margin-top:16px">${t("Техническая поддержка", "Texnik yordam")}</h3><p>${SUPPORT[l].hours}</p><p>${COMPANY.mail}</p><a class="btn btn-g btn-s" href="https://t.me/${COMPANY.tg}" target="_blank" rel="noopener">${ICON.tg}<span>@${COMPANY.tg}</span></a></div>
</div>
<details class="acc rise"><summary>${t("Шаги, которые помогут решить вопрос самому", "Muammoni o‘zingiz hal qilishga yordam beradigan qadamlar")}</summary><ol class="ol">${SUPPORT[l].steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></details>
</div></section>`;
}

function bot(l, t) {
  const m = [
    ["", t("Здравствуйте! Вышла новая база камер для вашего X-COP 8900. Обновить можно по Wi-Fi Hotspot со смартфона.", "Assalomu alaykum! X-COP 8900 uchun yangi kameralar bazasi chiqdi. Smartfondan Wi-Fi Hotspot orqali yangilash mumkin.")],
    ["me", t("Как обновить?", "Qanday yangilayman?")],
    ["", t("Три шага с картинками. А ещё ваш заказ №1042 передан курьеру, будет сегодня.", "Rasmli uchta qadam. Yana: 1042-buyurtmangiz kuryerga berildi, bugun yetadi.")],
  ];
  return `<section class="sec sx" id="bot" data-addon="bot"><div class="wrap split">
<div class="phone tilt" id="tgp"><div class="scr"><div class="bar"><i>N</i><div><b>Neoline</b><br><small style="color:var(--mu)">${t("бот магазина · демо", "do‘kon boti · demo")}</small></div></div><div class="msgs">${m.map(([c, x], i) => `<div class="msg${c ? " me" : ""}">${esc(x)}${i === 2 ? `<div class="kb"><span>${t("Мой заказ", "Buyurtmam")}</span><span>${t("Каталог", "Katalog")}</span></div>` : ""}</div>`).join("")}</div></div></div>
<div><p class="kick rise">Telegram</p><h2 class="h2 rise">${t("Магазин там, где <b>уже пишут</b> покупатели", "Do‘kon xaridorlar <b>allaqachon yozadigan</b> joyda")}</h2><p class="lead rise">${t("Каталог, заказ и статус доставки в Telegram. Владельцы X-COP получают сообщение, когда для их модели выходит новая база камер.", "Katalog, buyurtma va yetkazish holati Telegramda. X-COP egalari o‘z modeli uchun yangi kameralar bazasi chiqqanda xabar oladi.")}</p></div>
</div></section>`;
}

function uzum(l, t) {
  return `<section class="sec sx" id="uzum" data-addon="uzum"><div class="wrap split">
<div><p class="kick rise">Uzum Market</p><h2 class="h2 rise">${t("Один каталог, <b>два канала</b>", "Bitta katalog, <b>ikki kanal</b>")}</h2><p class="lead rise">${t("Товары, цены и остатки из панели сами уходят в ваш магазин на Uzum Market. Цену меняете один раз.", "Paneldagi mahsulot, narx va qoldiqlar Uzum Market’dagi do‘koningizga o‘zi ketadi. Narxni bir marta o‘zgartirasiz.")}</p></div>
<div class="panel tilt"><div class="sync"><div class="side">neoline.uz<small>${t("панель", "panel")}</small></div><div class="flow"></div><div class="side">Uzum Market<small>${t("ваш магазин", "do‘koningiz")}</small></div></div>
<p class="note" style="margin-top:24px"><i></i><span>X-COP 8900 · ${sum(byId(1000458).price, l)} · ${t("цена ушла на Uzum", "narx Uzumga ketdi")} · ${t("демо", "demo")}</span></p></div>
</div></section>`;
}

function seo(l, t) {
  const a = [
    [t("Какой радар-детектор выбрать в 2026 году", "2026-yilda qaysi radar detektorni tanlash kerak"), t("X-COP 7700s, 7900, 8900 и Spectrum: чем отличаются и кому что.", "X-COP 7700s, 7900, 8900 va Spectrum: farqi nima va kimga qaysi.")],
    [t("Радар Lochin: как его видит X-COP", "Lochin radari: X-COP uni qanday ko‘radi"), t("Что такое сигнатура и почему маломощные радары ловит не каждый прибор.", "Signatura nima va nega kam quvvatli radarlarni har qanday qurilma ushlamaydi.")],
    [t("Видеорегистратор с задней камерой", "Orqa kamerali videoregistrator"), t("Turbocam, Flash 2K Dual и SmartWay: парковка, ДТП и запись с двух сторон.", "Turbocam, Flash 2K Dual va SmartWay: parkovka, YTH va ikki tomondan yozuv.")],
  ];
  return `<section class="sec sx" id="seo" data-addon="seo"><div class="wrap">
<p class="kick rise">${t("Статьи под поиск", "Qidiruv uchun maqolalar")}</p><h2 class="h2 rise">${t("Покупатель ищет, <b>находит вас</b>", "Xaridor qidiradi, <b>sizni topadi</b>")}</h2>
<p class="lead rise">${t("Десять статей на узбекском и русском. Запросы сверим с Google Trends и Вордстатом по Узбекистану перед тем, как писать.", "O‘zbek va rus tilida o‘nta maqola. Yozishdan oldin so‘rovlarni O‘zbekiston bo‘yicha Google Trends va Wordstat bilan tekshiramiz.")}</p>
<div class="arts">${a.map(([h, p], i) => `<article class="art pop" style="transition-delay:${i * 90}ms"><small>${t("Тема статьи", "Maqola mavzusi")}</small><b>${h}</b><p>${p}</p></article>`).join("")}</div>
</div></section>`;
}

function admin(l, t) {
  return `<section class="sec sx" id="admin" data-addon="admin"><div class="wrap split">
<div><p class="kick rise">${t("Панель магазина", "Do‘kon paneli")}</p><h2 class="h2 rise">${t("Заказ с сайта <b>сразу в панели</b>", "Saytdan buyurtma <b>darhol panelda</b>")}</h2><p class="lead rise">${t("Оформите заказ в этом макете и откройте панель: он будет первой строкой. Смените статус, и покупатель увидит его в «Мой заказ».", "Shu maketda buyurtma bering va panelni oching: u birinchi qatorda bo‘ladi. Holatni o‘zgartiring, xaridor uni «Buyurtmam»da ko‘radi.")}</p>
<div class="hero-act rise"><a class="btn btn-a" href="${href(l, "panel")}">${ICON.panel}<span>${t("Открыть панель", "Panelni ochish")}</span></a></div></div>
<div class="browser tilt"><div class="bh"><i></i><i></i><i></i></div><div class="bb">
<div class="kpi"><small>${t("Выручка, 30 дней", "Tushum, 30 kun")}</small><b id="ak1">…</b></div><div class="kpi"><small>${t("Заказы", "Buyurtmalar")}</small><b id="ak2">…</b></div>
<div class="kpi w"><small>${t("По дням · демо", "Kunlar bo‘yicha · demo")}</small><div class="spark" id="aspark"></div></div></div></div>
</div></section>`;
}

function offer(l, t) {
  return `<section class="sec offer" id="offer"><div class="wrap">
<p class="kick">${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</p>
<h2 class="h2">${t("Сайт <b>по этому макету</b>", "Shu maket <b>bo‘yicha sayt</b>")}</h2>
<p class="lead">${t(`48 часов с первого открытия макета: магазин ${usd(BASE.promo)} вместо ${usd(BASE.price)}. Допы включаются тумблером, и их блок тут же появляется на странице или пропадает.`, `Maket birinchi ochilganidan 48 soat: do‘kon ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}. Qo‘shimchalar tumbler bilan yoqiladi va ularning bloki sahifada darhol paydo bo‘ladi yoki yo‘qoladi.`)}</p>
<div class="cst"><div>
<div class="base"><div class="hd"><b>${esc(BASE[l].t)}</b><span class="pp"><s>${usd(BASE.price)}</s>${usd(BASE.promo)}</span></div><p>${esc(BASE[l].d)}</p></div>
<div class="adds">${ADDONS.map((a) => `<label class="add"><input type="checkbox" data-add="${a.id}" checked><span class="sw" aria-hidden="true"></span><span><b>${esc(a[l].t)}</b>${a.star ? `<span class="star">${t("берут первым", "birinchi oladilar")}</span>` : ""}<p>${esc(a[l].e)}</p><small>${esc(a[l].who)}</small></span><span class="ap">${usd(a.price)}</span></label>`).join("")}</div>
</div>
<aside class="sum glass" aria-live="polite">
<div class="row"><span>${t("Магазин", "Do‘kon")}</span><span>${usd(BASE.promo)}</span></div>
<div class="row"><span>${t("Допы", "Qo‘shimchalar")} <span id="addn"></span></span><span id="adds">0 $</span></div>
<div class="tot"><span>${t("Итого", "Jami")}</span><b id="total">${usd(ALL)}</b></div>
<p style="margin:16px 0 0;color:var(--mu);font-size:14px">${t("Цена магазина держится:", "Do‘kon narxi amal qiladi:")}</p>
<div class="timer" id="timer"><span><b id="th">48</b><small>${t("часов", "soat")}</small></span><span><b id="tm">00</b><small>${t("минут", "daqiqa")}</small></span><span><b id="ts">00</b><small>${t("секунд", "soniya")}</small></span></div>
<div class="ctrl"><button type="button" class="btn btn-g btn-s" id="allon">${t("Всё из макета", "Maketdagi hammasi")}</button><button type="button" class="btn btn-g btn-s" id="alloff">${t("Только магазин", "Faqat do‘kon")}</button></div>
<button type="button" class="btn btn-g" id="copy">${ICON.copy}<span>${t("Скопировать состав", "Tarkibni nusxalash")}</span></button>
<a class="btn btn-a" href="${DEVUZ}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
</aside></div>
</div></section>`;
}

function footer(l, t) {
  const pages = [["shipping", t("Доставка и оплата", "Yetkazib berish va to‘lov")], ["return-policy", t("Гарантия и возврат", "Kafolat va qaytarish")], ["support", t("Поддержка устройств", "Qurilmalarni qo‘llab-quvvatlash")], ["update", t("Обновление устройств", "Qurilmalarni yangilash")], ["about-us", t("О компании", "Kompaniya haqida")], ["partners", t("Стать партнёром", "Hamkor bo‘lish")]];
  const url = (s) => (l === "ru" ? `${COMPANY.site}/ru/${s}-ru/` : `${COMPANY.site}/${s}/`);
  return `<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l)}<p style="margin-top:16px">${esc(COMPANY.shop[l])}. ${t("Телефон для уточнения по заказу", "Buyurtma bo‘yicha aniqlashtirish uchun telefon")}:</p><a href="tel:${COMPANY.tel}" style="font:700 18px/1.3 var(--hd);color:var(--tx)">${COMPANY.phone}</a></div>
<div><h4>${t("Каталог", "Katalog")}</h4>${CATS.map((c) => `<a href="#catalog" data-cat="${c.id}">${c[l]}</a>`).join("")}</div>
<div><h4>${t("Покупателю", "Xaridorga")}</h4>${pages.map(([s, n]) => `<a href="${url(s)}" target="_blank" rel="noopener">${n}</a>`).join("")}</div>
<div><h4>${t("Оплата", "To‘lov")}</h4>${PAY[l].map((x) => `<p style="margin:4px 0">${esc(x)}</p>`).join("")}<p style="margin:12px 0 0">${t("Доставка бесплатно курьером или в пункт выдачи, 1-3 дня.", "Kuryer orqali yoki topshirish punktiga bepul, 1-3 kun.")}</p></div>
</div>
<div class="sm"><span>© 2026 ${esc(COMPANY.legal[l])} · ${t("ИНН", "STIR")} ${COMPANY.inn} · ${esc(COMPANY.address[l])}</span><span>${t("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</span></div>
</div></footer>`;
}

/* Данные для site.js: товары, подписи, допы. */
function data(l, t) {
  return {
    l, base: BASE.promo, hours: OFFER_HOURS, gift: GIFT, panel: href(l, "panel"),
    cats: Object.fromEntries(CATS.map((c) => [c.id, c[l]])),
    add: ADDONS.map((a) => ({ id: a.id, p: a.price, t: a[l].t })),
    p: CATALOG.map((p) => ({ id: p.id, c: p.cat, h: isHybrid(p) ? 1 : 0, n: p.name[l], p: p.price, o: p.old, s: p.stock ? 1 : 0, pop: p.pop ? 1 : 0, im: P(p.id).map((s) => s.n), tx: (p.text[l].length ? p.text[l] : p.text.ru).slice(0, 8), u: p.url[l] })),
    t: {
      sum: l === "ru" ? "сум" : "so‘m", m: t("м", "m"),
      cart: t("Корзина", "Savat"), empty: t("Корзина пуста. Начните с X-COP 8900.", "Savat bo‘sh. X-COP 8900’dan boshlang."),
      gift: t("Turbocam в подарок", "Turbocam sovg‘a"), free: t("бесплатно", "bepul"), tot: t("Итого", "Jami"),
      checkout: t("Оформить заказ", "Buyurtma berish"), next: t("К оформлению", "Rasmiylashtirishga"), back: t("Назад в корзину", "Savatga qaytish"),
      name: t("Имя", "Ism"), phone: t("Телефон", "Telefon"), addr: t("Адрес или пункт выдачи", "Manzil yoki topshirish punkti"),
      pay: t("Оплата", "To‘lov"), deliv: t("Доставка курьером, бесплатно, 1-3 дня", "Kuryer orqali bepul, 1-3 kun"),
      pays: [t("Карта UzCard или Humo через Payme", "UzCard yoki Humo karta, Payme orqali"), t("Рассрочка Uzum Nasiya без процентов", "Uzum Nasiya foizsiz muddatli to‘lov")],
      paysPlus: ["Click", "Uzum Bank"],
      need: t("Напишите имя и телефон", "Ism va telefonni yozing"),
      ok: t("Заказ принят", "Buyurtma qabul qilindi"), okp: t("Это макет: заказ лёг в панель магазина, там можно сменить статус. Уточнить по настоящему заказу:", "Bu maket: buyurtma do‘kon paneliga tushdi, u yerda holatni o‘zgartirish mumkin. Haqiqiy buyurtma bo‘yicha:"),
      st: [t("Принят", "Qabul qilindi"), t("Собран на складе", "Omborda yig‘ildi"), t("Передан курьеру", "Kuryerga berildi"), t("Доставлен", "Yetkazildi")],
      mine: t("Мой заказ", "Buyurtmam"), order: t("Заказ", "Buyurtma"), panel: t("Открыть панель", "Panelni ochish"),
      added: t("Добавлено в корзину", "Savatga qo‘shildi"), buy: t("В корзину", "Savatga"), site: t("На neoline.uz", "neoline.uz’da"),
      nasiya: t("Рассрочка Uzum Nasiya без процентов", "Uzum Nasiya foizsiz muddatli to‘lov"), dl: t("Бесплатная доставка 1-3 дня", "1-3 kunda bepul yetkazish"), war: t("Официальная гарантия", "Rasmiy kafolat"),
      cmp: t("Сравнить", "Solishtirish"), cmpN: t("в сравнении", "solishtirishda"), cmpGo: t("Смотреть", "Ko‘rish"), cmpMax: t("Не больше трёх моделей", "Uchtadan ko‘p emas"),
      rows: [t("Цена", "Narx"), t("Раздел", "Bo‘lim"), t("Обновление", "Yangilash"), t("Что умеет", "Nima qila oladi")],
      upd: { wifi: t("Wi-Fi Hotspot со смартфона", "Smartfondan Wi-Fi Hotspot"), otg: t("USB OTG, без компьютера", "USB OTG, kompyutersiz"), app: t("Wi-Fi через приложение", "Ilova orqali Wi-Fi"), cab: t("По инструкции из кабинета", "Kabinetdagi yo‘riqnoma bo‘yicha"), base: t("База камер", "Kameralar bazasi"), fw: t("Прошивка", "Proshivka"), from: t("из панели", "paneldan"), demo: t("демо", "demo"), go: t("Открыть кабинет обновлений", "Yangilanishlar kabinetini ochish"), none: t("Такой модели нет. Попробуйте «8900» или «Spectrum».", "Bunday model yo‘q. «8900» yoki «Spectrum» deb ko‘ring.") },
      why: { radar: t("узнаёт радары по сигнатуре", "radarlarni signatura bo‘yicha taniydi"), dvr: t("пишет дорогу", "yo‘lni yozadi"), hyb: t("радар и регистратор в одном", "radar va registrator birda"), audio: t("замена штатной акустики", "zavod akustikasini almashtirish"), hide: t("скрытая установка", "yashirin o‘rnatish"), work: t("для вертикального стекла", "vertikal oyna uchun"), cheap: t("в бюджете", "byudjetda") },
      copied: t("Состав скопирован", "Tarkib nusxalandi"), less: t("Меньше", "Kamroq"), more: t("Больше", "Ko‘proq"), addsN: t("шт.", "ta"),
      erp: t("обновлено", "yangilandi"),
    },
  };
}

function sitePage(l) {
  const t = T(l);
  const title = t("Neoline · официальный магазин радар-детекторов и видеорегистраторов в Узбекистане", "Neoline · O‘zbekistondagi radar detektorlari va videoregistratorlarning rasmiy do‘koni");
  const desc = t("Радар-детекторы X-COP, гибриды, видеорегистраторы, акустика Ultera и аксессуары Neoline с официальной гарантией. Бесплатная доставка 1-3 дня, рассрочка Uzum Nasiya.", "Rasmiy kafolatli X-COP radar detektorlari, gibridlar, videoregistratorlar, Ultera akustikasi va Neoline aksessuarlari. 1-3 kunda bepul yetkazib berish, Uzum Nasiya.");
  return `${head(l, t, title, desc)}
<link rel="preload" as="image" href="${ph(P(1000458)[0].n, 1600)}" media="(min-width: 800px)">
<style>${CSS}</style>
</head>
<body>
<a class="vh" href="#catalog">${t("К каталогу", "Katalogga o‘tish")}</a>
${header(l, t)}
<main>
${hero(l, t)}
${velo(l)}
${road(l, t)}
${cats(l, t)}
${stand(l, t)}
${catalog(l, t)}
${compare(l, t)}
${pick(l, t)}
${updates(l, t)}
${why(l, t)}
${service(l, t)}
${bot(l, t)}
${uzum(l, t)}
${seo(l, t)}
${admin(l, t)}
</main>
${footer(l, t)}
<a class="cfgb glass" href="${href(l)}#offer">${t("Конструктор", "Konstruktor")}</a>
<div class="cmpdock glass" id="cmpdock" data-addon="compare"><span id="cmpn"></span><a class="btn btn-a btn-s" href="#compare">${t("Смотреть", "Ko‘rish")}</a></div>
<div class="dock" id="dock"><a class="btn btn-g" href="#catalog">${t("Каталог", "Katalog")}</a><button type="button" class="btn btn-a" data-buy="1000458">${ICON.cart}<span>X-COP 8900</span></button></div>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="shh"><div class="sh" data-close></div><div class="box"><div class="bh"><b id="shh"></b><button type="button" class="x" data-close aria-label="${t("Закрыть", "Yopish")}">${ICON.close}</button></div><div class="bb" id="shb"></div><div class="bf" id="shf"></div></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="nl-data">${JSON.stringify(data(l, t)).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}


/* ── Первая страница: выбор «Сайт» или «Панель» и конструктор ─────────
   Владелец, 29.10.2026: «как для Greenwell, там 1 страница это лендинг для
   клиента, там он выбирает уже админку посмотреть или сайт». Видео DevUz и
   залёт в бренд — здесь, логотип встаёт в шапку этой страницы. */
function landPage(l) {
  const t = T(l), p = byId(1000458);
  const site = [
    t("Залёт камеры в бренд и X-COP 8900 на первом экране", "Brendga kamera bilan uchib kirish va birinchi ekranda X-COP 8900"),
    t("«Радар в деле»: прокрутка ведёт машину к камере", "«Radar ishda»: aylantirish mashinani kameraga olib boradi"),
    t("31 товар с ценами neoline.uz, поиск и разделы", "neoline.uz narxlari bilan 31 ta mahsulot, qidiruv va bo‘limlar"),
    t("Стенд 8900 пальцем, подарок Turbocam в корзине", "8900 stendi barmoq bilan, savatda Turbocam sovg‘a"),
    t("Заказ, статус в «Мой заказ», сервис и поддержка", "Buyurtma, «Buyurtmam»da holat, servis va yordam"),
  ];
  const pan = [
    t("Заказ с сайта первой строкой, статус виден покупателю", "Saytdan buyurtma birinchi qatorda, holati xaridorga ko‘rinadi"),
    t("Выручка, путь покупателя, что продаётся и что заканчивается", "Tushum, xaridor yo‘li, nima sotiladi va nima tugayapti"),
    t("Остатки, закупка и наценка по каждому товару", "Har bir mahsulot bo‘yicha qoldiq, xarid narxi va ustama"),
    t("Версия базы камер по модели: сразу на сайте", "Model bo‘yicha kameralar bazasi versiyasi: darhol saytda"),
    t("Роли: менеджер не видит прибыль, история действий", "Rollar: menejer foydani ko‘rmaydi, harakatlar tarixi"),
  ];
  const li = (a) => `<ul class="feat">${a.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>`;
  const steps = [
    t("Откройте сайт и положите X-COP 8900 в корзину: Turbocam добавится сам.", "Saytni oching va X-COP 8900 ni savatga soling: Turbocam o‘zi qo‘shiladi."),
    t("Оформите заказ: имя и телефон любые, это макет.", "Buyurtma bering: ism va telefon istalgan, bu maket."),
    t("Откройте админку: заказ первой строкой. Смените статус, и сайт покажет его в «Мой заказ».", "Admin panelni oching: buyurtma birinchi qatorda. Holatni o‘zgartiring, sayt uni «Buyurtmam»da ko‘rsatadi."),
  ];
  const ld = { base: BASE.promo, hours: OFFER_HOURS, add: ADDONS.map((a) => ({ id: a.id, p: a.price, t: a[l].t })), t: { copied: t("Состав скопирован", "Tarkib nusxalandi"), tot: t("Итого", "Jami") } };
  return `${head(l, t, t("Neoline · макет сайта и панели магазина · DevUz Studio", "Neoline · sayt va do‘kon paneli maketi · DevUz Studio"), t("Макет для Neoline: новый сайт официального магазина и панель для заказов, остатков и баз камер. Конструктор цены.", "Neoline uchun maket: rasmiy do‘konning yangi sayti va buyurtmalar, qoldiqlar va kameralar bazalari uchun panel. Narx konstruktori."))}
<style>${CSS}</style>
</head>
<body>
${dzIntroSolo(l)}
${introHtml(l)}
<header class="top"><div class="top-in glass">
${LOGO(l, "")}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}"><a href="#choose">${t("Сайт или панель", "Sayt yoki panel")}</a><a href="#try">${t("Как проверить", "Qanday tekshirish")}</a><a href="#offer">${t("Стоимость", "Narxi")}</a></nav>
<div class="langs">${LANGS.map((x) => `<a href="${href(x)}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<a class="btn btn-g btn-s adm" href="${href(l, "site")}">${t("Сайт", "Sayt")}</a>
<a class="btn btn-a btn-s adm" href="${href(l, "panel")}">${ICON.panel}<span>${t("Админка", "Admin panel")}</span></a>
</div></header>
<main>
<section class="land" id="choose"><div class="hero-bg" aria-hidden="true"><div class="grid"></div></div><div class="wrap">
<p class="kick rise">${t("Макет DevUz Studio для Neoline", "Neoline uchun DevUz Studio maketi")}</p>
<h1 class="rise">${t("Новый сайт Neoline и <em>панель магазина</em>", "Neoline’ning yangi sayti va <em>do‘kon paneli</em>")}</h1>
<p class="lead rise">${t("Это работающий макет на ваших товарах и ценах с neoline.uz. Выберите, что посмотреть первым: сайт, каким его увидит покупатель, или админку, где вы ведёте заказы.", "Bu neoline.uz’dagi mahsulot va narxlaringizdagi ishlaydigan maket. Avval nimani ko‘rishni tanlang: xaridor ko‘radigan sayt yoki buyurtmalarni olib boradigan admin panel.")}</p>
<div class="choices">
<a class="choice rise" href="${href(l, "site")}"><span class="ch-k">${t("Для покупателя", "Xaridor uchun")}</span><b>${t("Сайт магазина", "Do‘kon sayti")}</b>
<span class="ch-pic"><img src="${ph(P(p.id)[0].n, 1600)}" srcset="${ph(P(p.id)[0].n, 800)} 800w, ${ph(P(p.id)[0].n, 1600)} 1600w" sizes="(min-width: 900px) 40vw, 90vw" width="${P(p.id)[0].w}" height="${P(p.id)[0].h}" alt="Neoline X-COP 8900"></span>
${li(site)}<span class="btn btn-g">${t("Открыть сайт", "Saytni ochish")}${ICON.arrow}</span></a>
<a class="choice rise" href="${href(l, "panel")}"><span class="ch-k">${t("Для вас и менеджеров", "Siz va menejerlar uchun")}</span><b>${t("Админка магазина", "Do‘kon admin paneli")}</b>
<span class="ch-pic ch-pn"><span class="browser"><span class="bh"><i></i><i></i><i></i></span><span class="bb"><span class="kpi"><small>${t("Выручка, 30 дней", "Tushum, 30 kun")}</small><b>124,6 ${t("млн", "mln")}</b></span><span class="kpi"><small>${t("Заказ с сайта", "Saytdan buyurtma")}</small><b>№1043</b></span><span class="kpi w"><small>${t("По дням · демо", "Kunlar bo‘yicha · demo")}</small><span class="spark" id="lspark"></span></span></span></span></span>
${li(pan)}<span class="btn btn-a">${t("Открыть админку", "Admin panelni ochish")}${ICON.arrow}</span></a>
</div>
</div></section>
<section class="sec" id="try"><div class="wrap">
<p class="kick rise">${t("Как проверить за минуту", "Bir daqiqada qanday tekshirish")}</p>
<h2 class="h2 rise">${t("Сайт и панель <b>связаны</b>", "Sayt va panel <b>bog‘langan</b>")}</h2>
<ol class="ol">${steps.map((s) => `<li class="rise">${s}</li>`).join("")}</ol>
<div class="hero-act rise"><a class="btn btn-a" href="${href(l, "site")}">${t("Начать с сайта", "Saytdan boshlash")}${ICON.arrow}</a></div>
</div></section>
${offer(l, t)}
</main>
<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l, "")}<p style="margin-top:16px">${esc(COMPANY.shop[l])}. ${t("Товары, цены, фото и тексты: neoline.uz. Заказы, остатки и выручка в панели: демо.", "Mahsulotlar, narxlar, suratlar va matnlar: neoline.uz. Paneldagi buyurtmalar, qoldiqlar va tushum: demo.")}</p></div>
<div><h4>${t("Макет", "Maket")}</h4><a href="${href(l, "site")}">${t("Сайт магазина", "Do‘kon sayti")}</a><a href="${href(l, "panel")}">${t("Админка магазина", "Do‘kon admin paneli")}</a><a href="#offer">${t("Стоимость", "Narxi")}</a></div>
<div><h4>DevUz Studio</h4><a href="https://devuz.studio" target="_blank" rel="noopener">devuz.studio</a><a href="${DEVUZ}" target="_blank" rel="noopener">Telegram</a></div>
<div><h4>Neoline</h4><a href="tel:${COMPANY.tel}">${COMPANY.phone}</a><a href="https://t.me/${COMPANY.tg}" target="_blank" rel="noopener">@${COMPANY.tg}</a></div>
</div>
<div class="sm"><span>${t("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</span></div>
</div></footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="nl-land">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<script>
${LAND_JS}</script>
</body>
</html>`;
}

/* Заставка Neoline: пролёт над буквами, логотип встаёт в шапку. Код —
   intro/intro.js, собранный в intro3d.js (механика CHECHFARM, PR #599). */
const INTRO_CSS = `.nli{position:fixed;inset:0;z-index:2147482000;background-color:#05080c;transition:background-color .8s ease}
.nli canvas{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .7s}
.nli.on canvas{opacity:1}.nli.out{background-color:rgb(5 8 12 / 0);pointer-events:none}.nli.out canvas{opacity:0;transition-duration:.25s}
.nli-skip{position:absolute;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));min-height:44px;padding:8px 16px;border:1px solid rgb(200 230 250 / .24);border-radius:999px;font:500 12px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:rgb(220 240 250 / .8);background:rgb(5 8 12 / .4);cursor:pointer;transition:opacity .3s}
.nli.out .nli-skip{opacity:0}
.nli-fly{position:fixed;z-index:2147482001;margin:0;pointer-events:none;transition:opacity .25s,transform 1s cubic-bezier(.65,0,.35,1)}`;
const INTRO_JS = `(function(){var o=document.getElementById('nli'),r=document.documentElement;if(!o)return;
var force=/[?&]intro=1/.test(location.search),seen=false;try{seen=!!sessionStorage.getItem('nl-intro')}catch(e){}
var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var ok=!rm&&(force||!seen)&&!(navigator.connection&&navigator.connection.saveData);
if(ok){try{var c=document.createElement('canvas'),g=c.getContext('webgl2')||c.getContext('webgl');ok=!!g;var x=g&&g.getExtension('WEBGL_lose_context');if(x)x.loseContext()}catch(e){ok=false}}
if(!ok){o.parentNode.removeChild(o);return}
r.classList.add('nli');try{sessionStorage.setItem('nl-intro','1')}catch(e){}
window.nliOff=function(){r.classList.remove('nli');o.classList.add('out');setTimeout(function(){if(o.parentNode)o.parentNode.removeChild(o)},900)};
var last=Date.now();(function w(){if(window.nliOn||!o.parentNode)return;if(document.getElementById('dzi'))last=Date.now();if(Date.now()-last>4000){window.nliOff();return}setTimeout(w,200)})();
})()`;
function introHtml(l) {
  const skip = { ru: "Пропустить", uz: "O‘tkazib yuborish" }[l];
  return `<div class="nli" id="nli" role="presentation"><canvas></canvas><button type="button" class="nli-skip">${skip}</button></div>
<style>${INTRO_CSS}</style>
<script>${INTRO_JS}</script>
<script src="${IMG}/intro3d.js" defer></script>`;
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
    l, sum: l === "ru" ? "сум" : "so‘m", site: href(l, "site"), home: href(l), ui,
    cats: Object.fromEntries(CATS.map((c) => [c.id, c[l]])),
    p: CATALOG.map((p) => ({ id: p.id, c: p.cat, n: p.name[l], p: p.price, s: p.stock ? 1 : 0, im: P(p.id)[0]?.n ?? "", u: /Wi-Fi Hotspot/i.test(p.text.ru.join(" ")) ? "wifi" : /OTG/i.test(p.text.ru.join(" ")) ? "otg" : /Wi-Fi/i.test(p.text.ru.join(" ")) ? "app" : "" })),
  };
  return `${head(l, t, t("Панель магазина Neoline · демо", "Neoline do‘kon paneli · demo"), t("Панель магазина Neoline: заказы с сайта, остатки, базы камер, история и роли. Демо-данные.", "Neoline do‘kon paneli: saytdan buyurtmalar, qoldiqlar, kameralar bazalari, tarix va rollar. Demo ma’lumotlar."))}
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
writeFileSync(bundleDir + "neoline.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(10), v.length);
