import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { ADDONS, BASE as KIT_BASE, BLOCKS } from "./plan.mjs";
import { LOGO, logoSvg, logoSprite, signSvg } from "./logo.mjs";
import { carSvg, cylSvg, vanSvg, CAR, CAR_SPOTS, GAS_LINE } from "./art.mjs";
import { DZ_VIDEO } from "../dz-video.mjs";

/*
 * Прототип GAZMETPROD SERVIS (europegas.uz): установка газобаллонного
 * оборудования в Ташкенте, Алмазарский район, Каракамыш. Собран на движке
 * Asmo Clinic (scripts/protos/asmo): заставка с промо DevUz Studio, история
 * при прокрутке по Engelberg v2, жидкое стекло, конструктор цены, «было /
 * стало». Две страницы на двух языках (ru, uz): главная и «Что дальше».
 * Исследование и конкуренты — docs/research/europegas.md, снимки — SOURCES.md.
 *
 * Всё о компании — только с europegas.uz (снято 13.10.2026): официальный
 * дилер EuropeGAS (Польша) и JIAXING E-XON POWER TECHNOLOGY (Китай),
 * оборудование RAIL (Италия), 3 и 4 поколение, 4 и 6 цилиндров, СПГ и СНГ,
 * гарантия на оборудование 1 год, обслуживание и после гарантии, испытание
 * баллонов со свидетельством, испытательная лаборатория и учебные классы,
 * фургоны из сэндвич-панелей на Labo, Changan и Газель, рефрижераторы,
 * техосмотр «Texnik ko‘rik» по тому же адресу, 25 сотрудников, 5 экспертов,
 * 21 проект, 12 416 клиентов, «в течение 15 лет», все контакты отделов.
 * Цен на их сайте нет, и в прототипе цен компании нет. Цены топлива в
 * калькуляторе — из новостей (ссылки рядом), сроки испытаний — с gov.uz.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/europegas";
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
/* Выключенный в конструкторе доп прячется до первой отрисовки: класс
   k-no-<id> ставит скрипт в <head> по сохранённому выбору. */
const OFF = ADDONS.map((a) => `.k-no-${a.id} [data-addon="${a.id}"]{display:none!important}`).join("");
const CSS = strip(readFileSync(DIR + "style.css", "utf8") + OFF).replace(/\n\s*/g, "").replace(/__IMG__/g, IMG);
const INTRO = strip(readFileSync(DIR + "intro.js", "utf8"));
const STORY = strip(readFileSync(DIR + "story.js", "utf8"));
const JS = strip(readFileSync(DIR + "client.js", "utf8"));
const BASE = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Onest:wght@400;700&display=swap";

const usd = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
const sum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, path = "") => BASE + (l === "uz" ? "/uz" : "") + (path ? "/" + path : "");
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);

/* ── Факты с их сайта ─────────────────────────────────────────────────── */
const F = {
  name: "GAZMETPROD SERVIS",
  phone: "+998909094949",
  phoneT: "+998 90 909 49 49",
  phone2: "+998973494949",
  phone2T: "+998 97 349 49 49",
  /* Своего Telegram у компании на сайте нет, только телефоны. Пишем на номер
     руководителя из «Контактов» (90 909-49-49): Telegram открывает чат по
     номеру. В работе поставим тот аккаунт, который назовёт компания. */
  chat: "https://t.me/+998909094949",
  addr: { ru: "Ташкент, Алмазарский район, Каракамыш 1/4, 11-А", uz: "Toshkent, Olmazor tumani, Qoraqamish 1/4, 11-A" },
  map: "https://yandex.uz/maps/?text=" + encodeURIComponent("Ташкент, Каракамыш 1/4 11А"),
  site: "https://europegas.uz",
  bot: "https://t.me/Texnikkorik_bot",
};

/* Отделы — страница «Контакты». */
const STAFF = [
  [{ ru: "Руководитель предприятия", uz: "Korxona rahbari" }, { ru: "Гуломов Мирхамдам Мирхабибович", uz: "Gulomov Mirxamdam Mirxabibovich" }, ["+998909094949", "+998973494949"]],
  [{ ru: "Инженер", uz: "Muhandis" }, { ru: "Гуломов Мирхамид Мирхабибович", uz: "Gulomov Mirxamid Mirxabibovich" }, ["+998909634949", "+998951774949"]],
  [{ ru: "Специалист", uz: "Mutaxassis" }, { ru: "Гуломов Мирхалил Мирхабибович", uz: "Gulomov Mirxalil Mirxabibovich" }, ["+998909484949", "+998946524949"]],
  [{ ru: "Начальник производства", uz: "Ishlab chiqarish boshlig‘i" }, { ru: "Наджмиддинов Иззатилла Зафар угли", uz: "Najmiddinov Izzatilla Zafar o‘g‘li" }, ["+998946619916", "+998983673322"]],
  [{ ru: "Офис", uz: "Ofis" }, { ru: "Комилов Хасан Фуркатович", uz: "Komilov Hasan Furqatovich" }, ["+998951424049"]],
  [{ ru: "Бухгалтерия", uz: "Buxgalteriya" }, null, ["+998712481480"]],
];
const telT = (p) => p.replace(/^\+998(\d\d)(\d{3})(\d\d)(\d\d)$/, "+998 $1 $2 $3 $4");

/* Цифры — блок на главной их сайта. */
const NUM = [
  [12416, { ru: "клиентов", uz: "mijoz" }],
  [25, { ru: "сотрудников", uz: "xodim" }],
  [5, { ru: "экспертов", uz: "ekspert" }],
  [21, { ru: "проект", uz: "loyiha" }],
];

/* Иконки — контуры 24×24, по смыслу. */
const I = (d, w = 1.6) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/><path d="m9 13 9-7"/>'),
  phone: I('<path d="M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2z"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  arrows: I('<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  car: I('<path d="M3 16v-3l2-5h14l2 5v3"/><path d="M3 13h18"/><circle cx="7" cy="16.5" r="2"/><circle cx="17" cy="16.5" r="2"/>'),
  cyl: I('<rect x="4" y="8" width="16" height="10" rx="5"/><path d="M12 8V5M10 5h4"/>'),
  chip: I('<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><path d="M10 10h4v4h-4z"/>'),
  test: I('<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="m9 15 2 2 4-4"/>'),
  wrench: I('<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3z"/><path d="M14.5 6.5 17 4l3 3-2.5 2.5"/>'),
  van: I('<path d="M2 17V8h11v9"/><path d="M13 11h5l4 3v3h-9"/><circle cx="6" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>'),
  snow: I('<path d="M12 2v20M4 7l16 10M4 17 20 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>'),
  doc: I('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>'),
  shield: I('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  leaf: I('<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19 13 11"/>'),
  gauge: I('<path d="M4 16a8 8 0 1 1 16 0"/><path d="m12 16 4-5"/><circle cx="12" cy="16" r="1.5"/>'),
  people: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/>'),
  cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m9 15 2 2 4-4"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  zoom: I('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5M11 8v6M8 11h6"/>'),
  x: I('<path d="M6 6l12 12M18 6 6 18"/>'),
};

/* Логотип DevUz Studio для заставки — тот же, что в промо на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZSIGN = `<svg class="dz-sign" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

const PAGE_NAMES = { "": ["Главная", "Bosh sahifa"], plan: ["Что дальше", "Keyingi qadam"] };
const pn = (l, k) => PAGE_NAMES[k][l === "ru" ? 0 : 1];

/* ── Сообщения в Telegram компании ────────────────────────────────────── */
const tgBtn = (cls, label, text, extra = "") => `<a class="btn ${cls}" href="${F.chat}" data-tg="${esc(text)}"${extra}>${ICON.tg}<span>${label}</span></a>`;
const helloText = (l) => (l === "ru" ? "Здравствуйте! Хочу поставить газовое оборудование на машину. Подскажите, когда можно приехать?" : "Assalomu alaykum! Mashinamga gaz uskunasi o‘rnatmoqchiman. Qachon kelsam bo‘ladi?");

/* ── Конструктор: плашка на каждой странице ───────────────────────────── */
function kdRow(l, a) {
  return `<label class="kd-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="${(a.needs || []).join(" ")}" data-def checked><span class="sw" aria-hidden="true"></span><span class="kd-t"><b>${a[l].t}</b>${a[l].e ? `<small>${a[l].e}</small>` : ""}</span><span class="kd-p num">+${usd(a.price)}</span></label>`;
}
function dockHtml(l) {
  const t = T(l);
  const group = (title, side, rows) => (rows.length ? `<section class="kd-g"><h3><span>${title}</span>${side}</h3>${rows.join("")}</section>` : "");
  return `<button class="kd-pill" type="button" id="kd-pill" aria-expanded="false" aria-controls="kd"><i aria-hidden="true"></i>${t("Конструктор", "Konstruktor")}<b class="num" id="kd-pill-sum"></b></button>
<aside class="kd" id="kd" role="dialog" aria-label="${t("Конструктор сайта", "Sayt konstruktori")}" hidden>
<header class="kd-h"><div><p class="kd-k">${t("Конструктор · предложение DevUz Studio", "Konstruktor · DevUz Studio taklifi")}</p><h2>${t("Что войдёт в новый сайт", "Yangi saytga nima kiradi")}</h2><p class="kd-sub">${t("Выключите блок, и он пропадёт со страницы. Включите, и он появится снова. Цены по середине рынка Узбекистана.", "Blokni o‘chirsangiz, u sahifadan yo‘qoladi. Yoqsangiz, yana paydo bo‘ladi. Narxlar O‘zbekiston bozorining o‘rtasi bo‘yicha.")}</p></div><button class="kd-x" type="button" id="kd-x" aria-label="${t("Свернуть", "Yig‘ish")}">${ICON.x}</button></header>
<div class="kd-list">
${group(t("На главной", "Bosh sahifada"), `<a href="${href(l)}">${t("открыть", "ochish")} →</a>`, ADDONS.filter((a) => a.where === "").map((a) => kdRow(l, a)))}
${group(t("На всех страницах", "Barcha sahifalarda"), "", ADDONS.filter((a) => a.where === "all").map((a) => kdRow(l, a)))}
${group(t("Сверх сайта", "Saytdan tashqari"), `<a href="${href(l, "plan")}#konstruktor">${t("что это", "bu nima")} →</a>`, BLOCKS.map((b) => kdRow(l, { ...b, [l]: { t: b[l].t } })))}
</div>
<footer class="kd-f">
<div class="kd-line"><span>${t("Сайт", "Sayt")}</span><span class="num">${usd(KIT_BASE.price)}</span></div>
<div class="kd-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kd-n"></span></span><span class="num" id="kd-add"></span></div>
<div class="kd-line kd-tot"><span>${t("Итого разово", "Jami bir martalik")}</span><b class="num" id="kd-sum"></b></div>
<a class="btn btn-pri" href="https://t.me/Devuz_studio_bot?start=europegas">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
<div class="kd-btns"><button class="copy" type="button" id="kd-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button><button class="copy" type="button" id="kd-reset">${t("Сбросить", "Qayta tiklash")}</button></div>
</footer>
</aside>`;
}

/* ── Заставка: промо DevUz Studio → ромб и пламя → влёт в пламя ───────── */
function introHtml(l) {
  const t = T(l);
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  const data = { rh: LOGO.rh, flame: LOGO.flame, inner: LOGO.inner, letters: LOGO.letters.map((x) => x.d), w: LOGO.w, h: LOGO.h, eye: LOGO.eye };
  return `<div class="intro" id="intro" role="presentation" data-addon="intro">
${DZ_VIDEO}
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t("прототип для GAZMETPROD SERVIS", "GAZMETPROD SERVIS uchun prototip")}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<canvas class="eg-cv" aria-hidden="true" data-logo="${esc(JSON.stringify(data))}"></canvas>
<div class="eg-cap"><b>${t("Газ под капот · Ташкент", "Kapot ostiga gaz · Toshkent")}</b><span>${t("официальный дилер EuropeGAS", "EuropeGAS rasmiy dileri")}</span></div>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish")}</button>
</div>`;
}

/* Фильтр преломления для «жидкого стекла»: шум смещает то, что под
   стеклом. Понимает только Chromium, остальным хватает размытия. */
const LQ = `<svg class="lq-defs" aria-hidden="true" focusable="false"><filter id="lq" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.019" numOctaves="2" result="n"/><feGaussianBlur in="n" stdDeviation="2.5" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="22" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;

/* Цвет страницы между блоками: слои во весь экран, скрипт плавно меняет их
   прозрачность по тому, какой блок на экране (только opacity). */
const TONES = ["ink", "ice", "night", "frost", "steel", "deep"];
const bgfx = `<div class="bgfx" aria-hidden="true">${TONES.map((k) => `<i class="tn-${k}" data-tone="${k}"></i>`).join("")}</div>`;

/* ── Каркас ───────────────────────────────────────────────────────────── */
function shell(l, path, meta, body) {
  const t = T(l);
  const other = l === "ru" ? "uz" : "ru";
  const isHome = path === "";
  const nav = [[href(l) + "#uslugi", t("Услуги", "Xizmatlar")], [href(l) + "#ekonomiya", t("Экономия", "Tejash")], [href(l) + "#furgon", t("Фургоны", "Furgonlar")], [href(l) + "#kontakty", t("Контакты", "Kontaktlar")]];
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#110e33">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="alternate" hreflang="${other}" href="${href(other, path)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=${isHome ? "false" : "true"};try{if(sessionStorage.getItem('eg-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}try{var k=JSON.parse(localStorage.getItem('eg-kit-v1')||'{}');for(var x in k)if(k[x]===false)r.classList.add('k-no-'+x);if(k.intro===false)off=true}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "AutoRepair", name: F.name, url: F.site, telephone: F.phone, address: { "@type": "PostalAddress", streetAddress: F.addr.ru, addressLocality: "Ташкент", addressCountry: "UZ" } })}</script>
</head>
<body class="${isHome ? "home hd-dark" : "inner"}" data-page="${path}" data-lang="${l}">
${LQ}
${logoSprite()}
${bgfx}
${isHome ? introHtml(l) : ""}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top"><div class="wrap">
<a class="logo" href="${href(l)}">${logoSvg("", "GAZMETPROD SERVIS")}</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}<a href="${href(l, "plan")}"${path === "plan" ? ' aria-current="page"' : ""}>${pn(l, "plan")}</a></nav>
<div class="top-r"><div class="lang"><a href="${href("ru", path)}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz", path)}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>
<a class="btn btn-pri btn-sm top-cta" href="${href(l)}#zapis">${t("Записаться", "Yozilish")}</a></div>
</div></header>
<main id="main">
${body}
</main>
<footer class="foot" data-tone="deep"><div class="wrap">
<div class="cols">
<div><span class="f-logo">${logoSvg()}</span><p>${t("ООО «GAZMETPROD SERVIS»: газовое оборудование для легковых и грузовых машин, испытание баллонов, фургоны и рефрижераторы. Официальный дилер EuropeGAS (Польша) и E-XON (Китай) в Узбекистане.", "«GAZMETPROD SERVIS» MChJ: yengil va yuk mashinalari uchun gaz uskunalari, ballon sinovi, furgon va refrijeratorlar. O‘zbekistonda EuropeGAS (Polsha) va E-XON (Xitoy) rasmiy dileri.")}</p></div>
<div><b>${t("На связи", "Aloqada")}</b><ul><li><a href="${F.chat}">Telegram</a></li><li><a href="tel:${F.phone}">${F.phoneT}</a></li><li><a href="tel:${F.phone2}">${F.phone2T}</a></li><li><a href="${href(l)}#kontakty">${t("Все отделы", "Barcha bo‘limlar")}</a></li></ul></div>
<div><b>${t("Где мы", "Manzil")}</b><ul><li>${F.addr[l]}</li><li><a href="${F.map}">${t("Открыть на карте", "Xaritada ochish")}</a></li></ul></div>
</div>
<div class="rights"><span>${t("Это прототип: так может выглядеть новый сайт GAZMETPROD SERVIS. Услуги, оборудование, цифры, фото работ, документы и контакты взяты с europegas.uz (13.10.2026). Блоки с пометкой «Предложение DevUz Studio» придумали мы, на сайте их пока нет. Цены топлива и сроки испытаний баллонов взяты из открытых источников, ссылки рядом с блоками. Откуда изображения:", "Bu prototip: yangi GAZMETPROD SERVIS sayti shunday ko‘rinishi mumkin. Xizmatlar, uskunalar, raqamlar, ishlar fotosi, hujjatlar va kontaktlar europegas.uz’dan olingan (13.10.2026). «DevUz Studio taklifi» belgisi bor bloklarni biz o‘ylab topdik, ular hozircha saytda yo‘q. Yoqilg‘i narxlari va ballon sinovi muddatlari ochiq manbalardan, havolalar bloklar yonida. Rasmlar qayerdan:")} <a href="${href(l, "plan")}#foto">${pn(l, "plan")}</a>.</span><span>${t("Прототип принадлежит DevUz Studio. Использовать его можно только по договору:", "Prototip DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari")}</a></span></div>
</div></footer>
<div class="dock" id="dock"><a class="btn btn-pri" href="${href(l)}#zapis">${ICON.car}<span>${t("Записаться на установку", "O‘rnatishga yozilish")}</span></a><a class="btn btn-ghost dock-call" href="tel:${F.phone}" aria-label="${t("Позвонить", "Qo‘ng‘iroq qilish")}">${ICON.phone}</a></div>
${dockHtml(l)}
<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="${t("Просмотр", "Ko‘rish")}" hidden><button class="lb-x" type="button" id="lb-x" aria-label="${t("Закрыть", "Yopish")}">${ICON.x}</button><img id="lb-img" alt=""><p id="lb-cap"></p></div>
<script type="application/json" id="i18n">${JSON.stringify(Ls(l)).replace(/</g, "\\u003c")}</script>
${isHome ? `<script>\n${INTRO}</script>\n<script>\n${STORY}</script>` : ""}
<script>
${JS}</script>
</body>
</html>`;
}

/* Строки для скриптов страницы. */
function Ls(l) {
  const ru = l === "ru";
  return {
    lang: l,
    tg: F.chat,
    kitBase: KIT_BASE.price,
    kitN: ru ? "{n} шт." : "{n} ta",
    kitTg: ru ? "Состав нового сайта GAZMETPROD SERVIS из конструктора:" : "Konstruktordan yangi GAZMETPROD SERVIS sayti tarkibi:",
    kitBaseName: KIT_BASE[l].t,
    kitTotal: ru ? "Итого" : "Jami",
    copied: ru ? "Скопировано" : "Nusxalandi",
    sent: ru ? "Текст скопирован. Открываем Telegram, вставьте его в чат." : "Matn nusxalandi. Telegram ochilmoqda, uni chatga qo‘ying.",
    som: ru ? "сум" : "so‘m",
    days: ru ? ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] : ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"],
    months: ru ? ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"] : ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"],
    today: ru ? "сегодня" : "bugun",
    tomorrow: ru ? "завтра" : "ertaga",
    bHead: ru ? "Заявка с сайта GAZMETPROD SERVIS" : "GAZMETPROD SERVIS saytidan ariza",
    bCar: ru ? "Машина" : "Mashina",
    bSvc: ru ? "Услуга" : "Xizmat",
    bWhen: ru ? "Когда удобно" : "Qachon qulay",
    bName: ru ? "Имя" : "Ism",
    bPhone: ru ? "Телефон" : "Telefon",
    bNote: ru ? "Комментарий" : "Izoh",
    bNeed: ru ? "Оставьте телефон: без него мастеру некуда перезвонить." : "Telefon qoldiring: usiz usta qo‘ng‘iroq qila olmaydi.",
    bDay: ru ? "Выберите день." : "Kunni tanlang.",
    pick: ru ? "Выбрано: {d}, {p}" : "Tanlandi: {d}, {p}",
    empty: ru ? "не указано" : "ko‘rsatilmagan",
    cMonth: ru ? "в месяц" : "oyiga",
    cYear: ru ? "За год остаётся {s} сум" : "Yiliga {s} so‘m tejaladi",
    cNeg: ru ? "При таких цифрах газ не выгоднее бензина. Проверьте расход и цены." : "Bu raqamlarda gaz benzindan arzon emas. Sarf va narxlarni tekshiring.",
    cTg: ru ? "Посчитал экономию на сайте: {km} км в день, бензин {pl} л на 100 км. Выходит около {s} сум в месяц. Хочу поставить газ на машину, подскажите цену." : "Saytda tejashni hisobladim: kuniga {km} km, benzin 100 km ga {pl} l. Oyiga taxminan {s} so‘m chiqadi. Mashinamga gaz qo‘ymoqchiman, narxini ayting.",
    tNext: ru ? "Следующее испытание: {d}" : "Keyingi sinov: {d}",
    tLate: ru ? "Срок прошёл {n} дн. назад: запишитесь на испытание сейчас." : "Muddat {n} kun oldin o‘tgan: hozir sinovga yoziling.",
    tLeft: ru ? "Осталось {n} дн." : "{n} kun qoldi",
    tNeed: ru ? "Укажите дату прошлого испытания." : "Oxirgi sinov sanasini kiriting.",
    tIcs: ru ? "Испытание газового баллона" : "Gaz ballon sinovi",
    tIcsD: ru ? "Пора на испытание баллона. GAZMETPROD SERVIS, Каракамыш 1/4 11-А, +998 90 909 49 49" : "Ballon sinovi vaqti keldi. GAZMETPROD SERVIS, Qoraqamish 1/4 11-A, +998 90 909 49 49",
    tTg: ru ? "Здравствуйте! Хочу записаться на испытание газового баллона ({g}). Прошлое испытание: {d}." : "Assalomu alaykum! Gaz ballon sinoviga ({g}) yozilmoqchiman. Oxirgi sinov: {d}.",
    vHead: ru ? "Хочу фургон, собрал в конструкторе на сайте:" : "Furgon kerak, saytdagi konstruktorda yig‘dim:",
    img: IMG,
  };
}

/* ── Куски страниц ────────────────────────────────────────────────────── */
const head = (kicker, h, lead, side = "", anim = "fit") => `<div class="sec-head rv a-${anim}"><div>${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>${side}</div>`;
const ours = (l) => `<span class="ours">${T(l)("Предложение DevUz Studio", "DevUz Studio taklifi")}</span>`;

/* ── История при прокрутке ────────────────────────────────────────────── */
function storyBlock(l) {
  const t = T(l);
  const chapters = [[0, "GAZMETPROD SERVIS"], [1.9, t("Газовая система", "Gaz tizimi")], [9.4, t("Испытание баллона", "Ballon sinovi")], [13.4, t("Фургоны", "Furgonlar")], [17.4, t("Оборудование", "Uskunalar")], [20.2, t("Запись", "Yozilish")]];
  const beat = (a, b, k, h, p, extra = "") => `<div class="st-beat" data-beat="${a} ${b}"><span class="kicker" data-line><i></i>${k}</span><h2 data-line>${h}</h2>${p ? `<p data-line>${p}</p>` : ""}${extra}</div>`;
  const spot = (k, ru, uz, a, b) => `<i class="hs" data-k="hs-${k}" data-x="${CAR_SPOTS[k][0]}" data-y="${CAR_SPOTS[k][1]}" data-w="${a} ${b}"><b></b><span>${t(ru, uz)}</span></i>`;
  const steps = [
    t("Снимаем баллон с машины", "Ballonni mashinadan yechamiz"),
    t("Выпускаем остаток газа", "Qolgan gazni chiqaramiz"),
    t("Сливаем масляный конденсат", "Moy kondensatini to‘kamiz"),
    t("Осмотр снаружи и внутри", "Tashqi va ichki ko‘rik"),
    t("Проверяем объём и вес", "Hajm va og‘irlikni tekshiramiz"),
    t("Отметки на баллоне и свидетельство", "Ballonga belgi va guvohnoma"),
  ];
  const layers = [
    t("Наружная обшивка: плакированная сталь или армированный пластик", "Tashqi qoplama: plakirlangan po‘lat yoki armaturali plastik"),
    t("Пенополиуретан: 0,035 Вт/м·К, влагу не впитывает", "Penopoliuretan: 0,035 Vt/m·K, namlikni shimmaydi"),
    t("Внутренняя обшивка, пригодна для продуктов", "Ichki qoplama, oziq-ovqat uchun yaroqli"),
    t("Пол: фанера, рифлёный алюминий или сталь", "Pol: fanera, rifli alyuminiy yoki po‘lat"),
  ];
  const orbit = [
    ["chip", "EuropeGAS · контроллеры", "EuropeGAS · kontrollerlar"], ["gauge", "EuropeGAS · редукторы", "EuropeGAS · reduktorlar"], ["cyl", "RAIL · инжекторы", "RAIL · injektorlar"], ["wrench", "E-XON · 4 поколение", "E-XON · 4-avlod"],
    ["test", "Испытательная лаборатория", "Sinov laboratoriyasi"], ["people", "Учебные классы", "O‘quv sinflari"], ["shield", "Услуги лицензированы", "Xizmatlar litsenziyalangan"], ["doc", "Продукция сертифицирована", "Mahsulot sertifikatlangan"], ["car", "Легковые и грузовые", "Yengil va yuk"],
  ];
  const statics = [
    [t("Газовая система", "Gaz tizimi"), t("Баллон, магистраль, редуктор EuropeGAS, форсунки RAIL и контроллер. Ставим оборудование 3 и 4 поколения на метан и пропан, программируем контроллер.", "Ballon, magistral, EuropeGAS reduktori, RAIL forsunkalari va kontroller. Metan va propan uchun 3 va 4-avlod uskunalarini o‘rnatamiz, kontrollerni dasturlaymiz.")],
    [t("Испытание баллона", "Ballon sinovi"), steps.join(", ") + "."],
    [t("Фургоны и рефрижераторы", "Furgon va refrijeratorlar"), layers.join(". ") + "."],
  ];
  return `<section class="story" id="story" data-tone="ink" data-end="21.4" data-chapters="${esc(JSON.stringify(chapters))}" data-car="${CAR.w} ${CAR.h}" data-line="${GAS_LINE}" aria-label="${t("GAZMETPROD SERVIS: газовая система, испытание баллона, фургоны", "GAZMETPROD SERVIS: gaz tizimi, ballon sinovi, furgonlar")}">
<div class="st-track"><div class="st-stage" id="hero">

<div class="st-layer st-hero" data-k="hero"><div class="hero-sign" data-k="heroSign">${signSvg("hs-svg")}</div><i class="hero-glow" data-k="heroGlow"></i>
<div class="nums glass lq" data-k="nums">${NUM.slice(0, 3).map(([n, x], k) => `<div class="nm"><b class="num" data-count="${n}">${sum(n)}</b><span>${x[l]}</span></div>`).join("")}</div></div>

<div class="st-layer st-car" data-k="car"><div class="car-cam" data-k="carCam">${carSvg()}</div>
${spot("cyl", "Баллон: метан или пропан", "Ballon: metan yoki propan", 2.3, 3.6)}${spot("fill", "Заправочный клапан", "Quyish klapani", 2.6, 3.6)}${spot("line", "Газовая магистраль", "Gaz magistrali", 3.9, 5)}${spot("red", "Редуктор EuropeGAS", "EuropeGAS reduktori", 5.3, 6.6)}${spot("rail", "Форсунки RAIL, 4 и 6 цилиндров", "RAIL forsunkalari, 4 va 6 silindr", 6.8, 7.9)}${spot("ecu", "Контроллер: программируем", "Kontroller: dasturlaymiz", 6.9, 7.9)}${spot("sw", "Кнопка газ или бензин", "Gaz yoki benzin tugmasi", 8, 9.2)}</div>

<div class="st-layer st-cyl" data-k="cyl"><div class="cyl-cam" data-k="cylCam">${cylSvg()}</div>
<ol class="steps glass lq" data-k="steps">${steps.map((s, k) => `<li data-k="tp${k}"><i></i>${s}</li>`).join("")}</ol></div>

<div class="st-layer st-van" data-k="van"><div class="van-cam" data-k="vanCam">${vanSvg()}</div>
${layers.map((s, k) => `<i class="tag" data-k="lt${k}"><b></b><span>${s}</span></i>`).join("")}</div>

<div class="st-layer st-team" data-k="team"><div class="orbit" data-k="orbit"><div class="orbit-c">${signSvg("oc-svg")}<p><b class="num" data-k="cl">12 416</b><span>${t("клиентов", "mijoz")}</span></p></div><ul class="orbs">${orbit.map(([ic, ru, uz], k) => `<li class="orb" data-orb="${k}"><span>${ICON[ic]}</span><b>${t(ru, uz)}</b></li>`).join("")}</ul></div></div>

<div class="st-layer st-end" data-k="end"><div class="end-in">${logoSvg("end-logo")}<p>${t("Газобаллонное оборудование с сертификатом качества и соответствия для легковых и грузовых машин", "Yengil va yuk mashinalari uchun sifat va muvofiqlik sertifikatli gaz ballon uskunalari")}</p></div></div>

<div class="st-text">
<div class="st-beat st-first" data-beat="-1 1.7"><span class="kicker" data-line><i></i>${t("Газ под капот · Ташкент", "Kapot ostiga gaz · Toshkent")}</span><h1 data-line>${t("Метан и пропан для вашей машины. <em>Официальный дилер EuropeGAS</em>", "Mashinangiz uchun metan va propan. <em>EuropeGAS rasmiy dileri</em>")}</h1><p data-line>${t("Ставим газовое оборудование 3 и 4 поколения на легковые и грузовые машины, испытываем баллоны, собираем фургоны и рефрижераторы. Гарантия на оборудование 1 год.", "Yengil va yuk mashinalariga 3 va 4-avlod gaz uskunalarini o‘rnatamiz, ballonlarni sinovdan o‘tkazamiz, furgon va refrijeratorlar yig‘amiz. Uskunaga kafolat 1 yil.")}</p><div class="cta" data-line><a class="btn btn-pri shim" href="#zapis">${ICON.car}<span>${t("Записаться на установку", "O‘rnatishga yozilish")}</span></a><a class="btn btn-ghost" href="#ekonomiya">${ICON.gauge}<span>${t("Посчитать экономию", "Tejashni hisoblash")}</span></a></div></div>
${beat(2.1, 3.7, t("01 · Баллон", "01 · Ballon"), t("Всё начинается с баллона", "Hammasi ballondan boshlanadi"), t("Ставим баллон и оборудование под метан (сжатый природный газ) или пропан (сжиженный газ). Двигатель потом работает на газе на все сто.", "Metan (siqilgan tabiiy gaz) yoki propan (suyultirilgan gaz) uchun ballon va uskuna o‘rnatamiz. Keyin dvigatel to‘liq gazda ishlaydi."))}
${beat(3.9, 5.1, t("02 · Магистраль", "02 · Magistral"), t("Газ идёт к мотору по магистрали", "Gaz motorga magistral orqali boradi"), t("От баллона к редуктору газ идёт по магистрали. Ставим и обслуживаем всю систему: топливную, редуктор и форсунки.", "Ballondan reduktorgacha gaz magistral orqali boradi. Butun tizimni o‘rnatamiz va xizmat ko‘rsatamiz: yoqilg‘i tizimi, reduktor va forsunkalar."))}
${beat(5.3, 6.6, t("03 · Редуктор", "03 · Reduktor"), t("Редуктор EuropeGAS из Польши", "Polshadan EuropeGAS reduktori"), t("Оборудование EuropeGAS и E-XON: мы их официальный дилер в Узбекистане, с сертификатами от производителя.", "EuropeGAS va E-XON uskunalari: biz ularning O‘zbekistondagi rasmiy dileri, ishlab chiqaruvchi sertifikatlari bilan."))}
${beat(6.8, 8, t("04 · Форсунки и контроллер", "04 · Forsunkalar va kontroller"), t("Программируем, чтобы на газе ехала как на бензине", "Gazda benzindagidek yurishi uchun dasturlaymiz"), t("Форсунки на 4 и 6 цилиндров, контроллер EuropeGAS. Настраиваем систему управления под вашу машину.", "4 va 6 silindrli forsunkalar, EuropeGAS kontrolleri. Boshqaruv tizimini mashinangizga moslab sozlaymiz."))}
${beat(8.2, 9.3, t("05 · Мотору легче", "05 · Motorga yengil"), t("Мотор служит дольше и работает тише", "Motor uzoqroq xizmat qiladi va tinchroq ishlaydi"), t("По нашему опыту ресурс цилиндров растёт в 1,5-2 раза, шум падает на 2-3 дБ, выхлоп чище.", "Tajribamizcha silindrlar resursi 1,5-2 barobar oshadi, shovqin 2-3 dB kamayadi, chiqindi gaz tozaroq."))}
${beat(9.6, 13.2, t("06 · Испытание баллонов", "06 · Ballon sinovi"), t("Своя испытательная лаборатория", "O‘z sinov laboratoriyamiz"), t("Испытываем баллон и выдаём свидетельство: после испытания он годен к дальнейшей службе.", "Ballonni sinaymiz va guvohnoma beramiz: sinovdan keyin u keyingi xizmatga yaroqli."))}
${beat(13.7, 15.5, t("07 · Фургоны", "07 · Furgonlar"), t("Фургон из сэндвич-панелей на Labo, Changan и Газель", "Labo, Changan va Gazel uchun sendvich panel furgon"), t("Слои склеены прочным клеем и держат перепады температуры. Каркас не нужен, кузов выходит легче.", "Qatlamlar mustahkam yelim bilan yopishtirilgan va harorat farqiga chidaydi. Karkas kerak emas, kuzov yengilroq."))}
${beat(15.7, 17.2, t("08 · Рефрижератор", "08 · Refrijerator"), t("Холодильник или морозильник на крышу", "Tomga sovutgich yoki muzlatgich"), t("Накрышная, фронтальная или для полуприцепа, по объёму фургона. Без очередей: у нас большой штат мастеров и площадей.", "Tomga, old tomonga yoki yarim tirkama uchun, furgon hajmiga qarab. Navbatsiz: ustalar va maydonlarimiz ko‘p."))}
${beat(17.7, 19.9, t("09 · Компания", "09 · Kompaniya"), t("12 416 клиентов и 25 сотрудников", "12 416 mijoz va 25 xodim"), t("Специалисты квалифицированы и сертифицированы. Все услуги лицензированы, продукция сертифицирована.", "Mutaxassislar malakali va sertifikatlangan. Barcha xizmatlar litsenziyalangan, mahsulot sertifikatlangan."))}
<div class="st-beat st-last" data-beat="20.3 99"><span class="kicker" data-line><i></i>${t("10 · Запись", "10 · Yozilish")}</span><h2 data-line>${t("Приезжайте на Каракамыш", "Qoraqamishga keling")}</h2><div class="cta" data-line><a class="btn btn-pri" href="#zapis">${t("Выбрать день", "Kunni tanlash")}${ICON.arrow}</a>${tgBtn("btn-ghost", t("Написать в Telegram", "Telegramga yozish"), helloText(l))}</div></div>
</div>
<div class="st-hud" aria-hidden="true"><span data-hud>00 · GAZMETPROD SERVIS</span><i><b data-bar></b></i></div>
<p class="st-hint" data-k="hint" aria-hidden="true">${t("Листайте", "Aylantiring")}<i></i></p>
</div></div>
<div class="st-static wrap">${statics.map(([h, p]) => `<div class="st-s"><h2>${h}</h2><p>${p}</p></div>`).join("")}</div>
</section>`;
}

/* Первый экран без истории, когда доп «Сцена» выключен. */
function heroPlain(l) {
  const t = T(l);
  return `<section class="hero2" data-tone="ink" data-addon-off="story"><div class="hero-sign">${signSvg("hs-svg")}</div><div class="wrap"><span class="kicker"><i></i>${t("Газ под капот · Ташкент", "Kapot ostiga gaz · Toshkent")}</span><p class="h1">${t("Метан и пропан для вашей машины. <em>Официальный дилер EuropeGAS</em>", "Mashinangiz uchun metan va propan. <em>EuropeGAS rasmiy dileri</em>")}</p><div class="cta"><a class="btn btn-pri" href="#zapis">${ICON.car}<span>${t("Записаться на установку", "O‘rnatishga yozilish")}</span></a><a class="btn btn-ghost" href="tel:${F.phone}">${ICON.phone}<span>${F.phoneT}</span></a></div></div></section>`;
}

/* Услуги: бенто, у каждой карточки своё движение. */
const SVC = [
  { id: "gbo", ic: "car", anim: "fit", ru: ["Газ на легковые", "Метан и пропан", "Подбираем оборудование под вашу машину и ставим системы 3 и 4 поколения. Двигатель работает на сжатом природном газе или на сжиженном газе."], uz: ["Yengil mashinalarga gaz", "Metan va propan", "Mashinangizga uskunani tanlaymiz va 3-4 avlod tizimlarini o‘rnatamiz. Dvigatel siqilgan tabiiy gaz yoki suyultirilgan gazda ishlaydi."] },
  { id: "prog", ic: "chip", anim: "click", ru: ["Программирование", "Контроллер и настройка", "Перепрограммируем машину, настроим газовый контроллер и систему управления, чтобы на газе мотор работал ближе к бензину."], uz: ["Dasturlash", "Kontroller va sozlash", "Mashinani qayta dasturlaymiz, gaz kontrolleri va boshqaruv tizimini sozlaymiz, motor gazda benzinga yaqin ishlasin."] },
  { id: "test", ic: "test", anim: "drop", ru: ["Испытание баллонов", "И выдача свидетельства", "Снимаем баллон, выпускаем газ, сливаем конденсат, проверяем снаружи и внутри, объём и вес. После испытания баллон годен к дальнейшей службе."], uz: ["Ballon sinovi", "Va guvohnoma berish", "Ballonni yechamiz, gazni chiqaramiz, kondensatni to‘kamiz, tashqi va ichki, hajm va og‘irlikni tekshiramiz. Sinovdan keyin ballon xizmatga yaroqli."] },
  { id: "rep", ic: "wrench", anim: "fit", ru: ["Ремонт и обслуживание", "Любой сложности", "Диагностика топливной системы, редуктора и форсунок. Обслуживаем и после того, как гарантия закончилась."], uz: ["Ta’mirlash va xizmat", "Har qanday murakkablikda", "Yoqilg‘i tizimi, reduktor va forsunkalar diagnostikasi. Kafolat tugagandan keyin ham xizmat ko‘rsatamiz."] },
  { id: "van", ic: "van", anim: "click", ru: ["Фургоны", "Сэндвич-панели и ALUCOBOND", "Крытые кузова для Labo, Changan, Газель, Dongfeng, KIA и Hyundai. Изотермические фургоны из пенополиуретана."], uz: ["Furgonlar", "Sendvich panel va ALUCOBOND", "Labo, Changan, Gazel, Dongfeng, KIA va Hyundai uchun yopiq kuzovlar. Penopoliuretandan izotermik furgonlar."] },
  { id: "cold", ic: "snow", anim: "drop", ru: ["Рефрижераторы", "Холодильник или морозильник", "Для продуктов, цветов, лекарств и красок. Ставим на маленькие машины и на большие грузовики."], uz: ["Refrijeratorlar", "Sovutgich yoki muzlatgich", "Oziq-ovqat, gul, dori va bo‘yoqlar uchun. Kichik mashinalarga ham, katta yuk mashinalariga ham o‘rnatamiz."] },
];
function servicesBlock(l) {
  const t = T(l);
  return `<section id="uslugi" data-tone="ice"><div class="wrap">
${head(t("Услуги", "Xizmatlar"), t("Всё, что нужно машине на газе", "Gazdagi mashinaga kerak bo‘lgan hammasi"), t("Ставим, программируем, испытываем и обслуживаем. Для легковых, малых пассажирских и грузовых машин.", "O‘rnatamiz, dasturlaymiz, sinaymiz va xizmat ko‘rsatamiz. Yengil, kichik yo‘lovchi va yuk mashinalari uchun."))}
<div class="bento">${SVC.map((s, k) => `<article class="bx bx-${s.id} rv a-${s.anim} spot-host" style="--d:${(k % 3) * 70}ms"><span class="spot" aria-hidden="true"></span><span class="bx-ic">${ICON[s.ic]}</span><p class="bx-k">${s[l][1]}</p><h3>${s[l][0]}</h3><p>${s[l][2]}</p><a class="bx-a" href="#${s.id === "van" || s.id === "cold" ? "furgon" : s.id === "test" ? "ispytanie" : "zapis"}" data-svc="${s.id}">${s.id === "van" || s.id === "cold" ? t("Собрать фургон", "Furgon yig‘ish") : s.id === "test" ? t("Узнать срок", "Muddatni bilish") : t("Записаться", "Yozilish")}${ICON.arrow}</a></article>`).join("")}
<article class="bx bx-tk rv a-fit"><span class="bx-ic">${ICON.shield}</span><p class="bx-k">Texnik ko‘rik</p><h3>${t("Техосмотр по тому же адресу", "Shu manzilda texnik ko‘rik")}</h3><p>${t("Технический осмотр машин и лаборатория тестирования газовых баллонов: Каракамыш 1/4, 11-А.", "Mashinalar texnik ko‘rigi va gaz ballonlarini sinash laboratoriyasi: Qoraqamish 1/4, 11-A.")}</p><a class="bx-a" href="${F.bot}">${t("Бот техосмотра", "Texnik ko‘rik boti")}${ICON.arrow}</a></article>
</div>
</div></section>`;
}

/* Почему газ: цифры с их сайта. */
function whyBlock(l) {
  const t = T(l);
  const items = [
    ["shield", t("1 год", "1 yil"), t("гарантия на оборудование, обслуживание и после неё", "uskunaga kafolat, undan keyin ham xizmat")],
    ["gauge", "1,5-2×", t("дольше служат цилиндры двигателя", "dvigatel silindrlari uzoqroq xizmat qiladi")],
    ["wrench", "30-40%", t("на столько в среднем откладывается ремонт двигателя", "dvigatel ta’miri o‘rtacha shuncha kechroq kerak bo‘ladi")],
    ["leaf", t("2-3 дБ", "2-3 dB"), t("тише мотор, меньше вредных выбросов", "motor tinchroq, zararli chiqindilar kamroq")],
  ];
  return `<section class="why" data-tone="night"><div class="wrap">
${head(t("Почему газ", "Nega gaz"), t("Платите меньше за топливо, мотор целее", "Yoqilg‘iga kamroq to‘laysiz, motor butunroq"), t("Цифры с нашего сайта, по опыту переоборудованных машин.", "Saytimizdagi raqamlar, qayta jihozlangan mashinalar tajribasidan."))}
<div class="why-g">${items.map(([ic, n, s], k) => `<div class="why-i glass lq rv a-click" style="--d:${k * 80}ms"><span class="why-ic">${ICON[ic]}</span><b class="num">${n}</b><p>${s}</p></div>`).join("")}</div>
</div></section>`;
}

/* Калькулятор экономии: пробег, расход, цены топлива → сум в месяц. */
function calcBlock(l) {
  const t = T(l);
  const rng = (id, label, min, max, step, val, unit) => `<label class="rg"><span class="rg-l"><span>${label}</span><output class="num" id="${id}-o">${val}</output><small>${unit}</small></span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
  const num = (id, label, val, unit) => `<label class="field fx"><span>${label}</span><span class="fx-in"><input id="${id}" type="number" inputmode="numeric" min="0" step="100" value="${val}"><small>${unit}</small></span></label>`;
  return `<section id="ekonomiya" data-tone="night" data-addon="calc"><div class="wrap">
${head(t("Калькулятор экономии", "Tejash kalkulyatori"), t("Сколько останется в кармане на газе", "Gazda cho‘ntakda qancha qoladi"), t("Двигайте ползунки: экономия за месяц считается сразу. Расход на газе у каждой машины свой, мастер скажет точнее.", "Slayderlarni suring: oylik tejash darhol hisoblanadi. Gazdagi sarf har bir mashinada o‘ziga xos, usta aniqroq aytadi."), ours(l))}
<div class="calc glass-d lq rv a-fit">
<div class="calc-in">
${rng("c-km", t("Пробег в день", "Kunlik yurish"), 20, 400, 10, 120, t("км", "km"))}
${rng("c-days", t("Дней в месяц за рулём", "Oyiga rulda kunlar"), 4, 31, 1, 26, t("дн.", "kun"))}
${rng("c-pl", t("Расход бензина", "Benzin sarfi"), 4, 30, 0.5, 8, t("л на 100 км", "100 km ga l"))}
${rng("c-gm", t("Расход метана", "Metan sarfi"), 4, 30, 0.1, 7.6, t("м³ на 100 км", "100 km ga m³"))}
<div class="fx-row">${num("c-pp", t("Бензин АИ-92", "AI-92 benzin"), 12600, t("сум/л", "so‘m/l"))}${num("c-gp", t("Метан", "Metan"), 5750, t("сум/м³", "so‘m/m³"))}</div>
<p class="src">${t("Цены по умолчанию: АИ-92 в среднем 12 600 сум/л (", "Standart narxlar: AI-92 o‘rtacha 12 600 so‘m/l (")}<a href="https://avtoelon.uz/yangiliklar/articles/skol-ko-stoit-benzin-v-taskente/">avtoelon.uz, 22.09.2026</a>${t("), метан 5 700-5 800 сум/м³ (", "), metan 5 700-5 800 so‘m/m³ (")}<a href="https://www.spot.uz/ru/2026/06/01/cng-up/">spot.uz, 01.06.2026</a>${t("). Метан по умолчанию 0,95 м³ на литр бензина, как считает <a href='https://stag.uz/'>STAG</a>, это приблизительно. Поставьте свои цифры.", "). Metan standart bo‘yicha 1 litr benzinga 0,95 m³, <a href='https://stag.uz/'>STAG</a> hisobidagidek, bu taxminiy. O‘z raqamlaringizni qo‘ying.")}</p>
</div>
<div class="calc-out">
<p class="calc-k">${t("Экономия", "Tejash")}</p>
<div class="gauge" aria-hidden="true"><svg viewBox="0 0 200 120"><path d="M20 110A80 80 0 0 1 180 110" fill="none" stroke="rgb(127 220 255 / .16)" stroke-width="14" stroke-linecap="round"/><path id="c-arc" d="M20 110A80 80 0 0 1 180 110" fill="none" stroke="url(#gg)" stroke-width="14" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/><defs><linearGradient id="gg"><stop offset="0" stop-color="#00b1f1"/><stop offset="1" stop-color="#3df29b"/></linearGradient></defs></svg><i id="c-needle"></i></div>
<p class="calc-sum"><b class="num" id="c-sum">0</b> <span>${t("сум", "so‘m")}</span></p>
<p class="calc-per">${t("в месяц", "oyiga")}</p>
<p class="calc-y" id="c-year"></p>
<div class="calc-bars" aria-hidden="true"><div><span>${t("Бензин", "Benzin")}</span><i><b id="c-bp"></b></i><em class="num" id="c-vp"></em></div><div><span>${t("Метан", "Metan")}</span><i><b id="c-bg"></b></i><em class="num" id="c-vg"></em></div></div>
<button class="btn btn-pri" type="button" id="c-send">${ICON.tg}<span>${t("Узнать цену установки", "O‘rnatish narxini bilish")}</span></button>
<p class="note-ok" id="c-done" role="status" hidden></p>
</div>
</div>
</div></section>`;
}

/* Запись: машина, услуга, день и время суток → Telegram. Часов работы на их
   сайте нет, поэтому не слоты, а «до обеда / после обеда»: мастер перезвонит. */
function bookingBlock(l) {
  const t = T(l);
  const cars = ["Chevrolet", "Ravon", "Lada", "Mercedes", "KIA", "Hyundai", "Labo", "Changan", "Dongfeng", t("Газель", "Gazel"), t("Другая", "Boshqa")];
  const svc = [["gbo", t("Газ на машину", "Mashinaga gaz")], ["prog", t("Программирование", "Dasturlash")], ["test", t("Испытание баллона", "Ballon sinovi")], ["rep", t("Ремонт, обслуживание", "Ta’mirlash, xizmat")], ["van", t("Фургон, рефрижератор", "Furgon, refrijerator")]];
  return `<section id="zapis" data-tone="ink" data-addon="booking"><div class="wrap">
${head(t("Запись", "Yozilish"), t("Выберите машину, услугу и день", "Mashina, xizmat va kunni tanlang"), t("Три шага, и заявка уходит мастеру в Telegram. Он перезвонит и назовёт время.", "Uch qadam va ariza ustaga Telegramga boradi. U qo‘ng‘iroq qilib vaqtni aytadi."), ours(l))}
<form class="book glass-d rv a-drop" id="book" novalidate>
<div class="bk-col">
<fieldset class="bk-step"><legend><b class="num">1</b>${t("Машина", "Mashina")}</legend><div class="opts">${cars.map((n, k) => `<label class="opt"><input type="radio" name="car" value="${esc(n)}"${k === 0 ? " checked" : ""}><span>${n}</span></label>`).join("")}</div></fieldset>
<fieldset class="bk-step"><legend><b class="num">2</b>${t("Что сделать", "Nima qilish kerak")}</legend><div class="opts">${svc.map(([v, n], k) => `<label class="opt"><input type="radio" name="svc" value="${esc(n)}" data-s="${v}"${k === 0 ? " checked" : ""}><span>${ICON[v === "gbo" ? "car" : v === "prog" ? "chip" : v === "rep" ? "wrench" : v]}${n}</span></label>`).join("")}</div></fieldset>
</div>
<div class="bk-col">
<fieldset class="bk-step"><legend><b class="num">3</b>${t("Когда и как связаться", "Qachon va qanday bog‘lanish")}</legend><div class="days" id="bk-days" role="radiogroup" aria-label="${t("День", "Kun")}"></div>
<div class="opts" role="radiogroup">${[[t("До обеда", "Tushgacha"), 1], [t("После обеда", "Tushdan keyin"), 0]].map(([n, c]) => `<label class="opt"><input type="radio" name="part" value="${n}"${c ? " checked" : ""}><span>${ICON.clock}${n}</span></label>`).join("")}</div>
<label class="field"><span>${t("Имя", "Ism")}</span><input name="name" autocomplete="given-name" placeholder="${t("Как к вам обращаться", "Sizga qanday murojaat qilaylik")}"></label>
<label class="field"><span>${t("Телефон", "Telefon")}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998"></label>
<label class="field"><span>${t("Модель и год, по желанию", "Model va yil, ixtiyoriy")}</span><input name="note" placeholder="${t("Например: Cobalt 2019", "Masalan: Cobalt 2019")}"></label></fieldset>
<p class="bk-pick" id="bk-pick" aria-live="polite"></p>
<button class="btn btn-pri" type="submit">${ICON.tg}<span>${t("Отправить заявку", "Arizani yuborish")}</span></button>
<p class="note-ok" id="bk-done" role="status" hidden></p>
<p class="bk-s">${t("Заявка уходит текстом в Telegram. Удобнее голосом:", "Ariza matn bilan Telegramga boradi. Ovoz bilan qulayroqmi:")} <a href="tel:${F.phone}">${F.phoneT}</a></p>
</div>
</form>
</div></section>`;
}

/* Срок испытания баллона: дата прошлого + тип газа → следующая, календарь, запись. */
function testBlock(l) {
  const t = T(l);
  return `<section id="ispytanie" data-tone="frost" data-addon="test"><div class="wrap">
${head(t("Испытание баллона", "Ballon sinovi"), t("Когда вам на испытание", "Sizga sinov qachon"), t("Метановый баллон испытывают раз в 3 года, пропановый раз в 2 года. Укажите дату прошлого испытания, и сайт посчитает следующее.", "Metan ballon 3 yilda bir marta, propan ballon 2 yilda bir marta sinovdan o‘tkaziladi. Oxirgi sinov sanasini kiriting, sayt keyingisini hisoblaydi."), ours(l))}
<div class="tst">
<div class="tst-f glass-l rv a-drop">
<div class="seg" role="radiogroup" aria-label="${t("Газ", "Gaz")}"><label><input type="radio" name="gas" value="3" data-g="${t("метан", "metan")}" checked><span>${t("Метан", "Metan")} · ${t("3 года", "3 yil")}</span></label><label><input type="radio" name="gas" value="2" data-g="${t("пропан", "propan")}"><span>${t("Пропан", "Propan")} · ${t("2 года", "2 yil")}</span></label></div>
<label class="field"><span>${t("Дата прошлого испытания", "Oxirgi sinov sanasi")}</span><input type="date" id="t-last"></label>
<div class="tst-r" id="t-res" aria-live="polite"><p class="tst-k">${ICON.cal}<span id="t-next">${t("Укажите дату", "Sanani kiriting")}</span></p><div class="tst-bar"><i id="t-bar"></i></div><p class="tst-left" id="t-left"></p></div>
<div class="cta"><button class="btn btn-pri" type="button" id="t-send">${ICON.tg}<span>${t("Записаться на испытание", "Sinovga yozilish")}</span></button><a class="btn btn-ghost" id="t-ics" href="data:text/calendar;charset=utf-8," download="ispytanie-ballona.ics">${ICON.cal}<span>${t("Напомнить в календаре", "Kalendarda eslatish")}</span></a></div>
<p class="note-ok" id="t-done" role="status" hidden></p>
</div>
<div class="tst-n rv a-fit">
<h3>${t("С 1 сентября 2026: документ с QR-кодом", "2026-yil 1-sentabrdan: QR-kodli hujjat")}</h3>
<p>${t("По постановлению Кабмина № 315 результат проверки баллона вносят в электронную систему, водителю выдают документ с QR-кодом. Действующий старый документ сразу менять не нужно.", "Vazirlar Mahkamasining 315-son qaroriga ko‘ra ballon tekshiruvi natijasi elektron tizimga kiritiladi, haydovchiga QR-kodli hujjat beriladi. Amaldagi eski hujjatni darhol almashtirish shart emas.")}</p>
<p class="src">${t("Источники:", "Manbalar:")} <a href="https://gov.uz/oz/advice/765/document/4168">gov.uz</a> · <a href="https://lex.uz/uz/docs/-8280849">lex.uz</a> · <a href="https://www.uzdaily.uz/ru/v-uzbekistane-raziasnili-novye-pravila-dlia-gazoballonnykh-avto/">UzDaily, 04.09.2026</a></p>
</div>
</div>
</div></section>`;
}

/* Конструктор фургона: машина, груз, объём, установка, пол, обшивка. */
function vanBlock(l) {
  const t = T(l);
  const grp = (name, label, opts) => `<fieldset class="vg"><legend>${label}</legend><div class="opts">${opts.map(([v, n], k) => `<label class="opt"><input type="radio" name="${name}" value="${v}" data-n="${esc(n)}"${k === 0 ? " checked" : ""}><span>${n}</span></label>`).join("")}</div></fieldset>`;
  return `<section id="furgon" data-tone="ice" data-addon="van"><div class="wrap">
${head(t("Конструктор фургона", "Furgon konstruktori"), t("Соберите фургон под свой груз", "Yukingizga mos furgon yig‘ing"), t("Перед монтажом холодильника важно понять, что вы возите: от этого зависит, как переоборудуют кузов. Отметьте, и мастер получит готовое задание.", "Sovutgich o‘rnatishdan oldin nima tashishingizni bilish muhim: kuzovni qanday qayta jihozlash shunga bog‘liq. Belgilang, usta tayyor topshiriq oladi."), ours(l))}
<div class="vk">
<div class="vk-pic glass-l rv a-fit" id="vk-pic">${vanSvg().replace('class="van-svg"', 'class="van-svg vk-svg"')}<p class="vk-cap" id="vk-cap"></p></div>
<form class="vk-f rv a-drop" id="vk">
${grp("vcar", t("Машина", "Mashina"), [["labo", "Labo"], ["changan", "Changan"], ["gazel", t("Газель", "Gazel")]])}
${grp("vcargo", t("Что везёте", "Nima tashiysiz"), [["cool", t("Охлаждённое", "Sovutilgan")], ["frozen", t("Глубокая заморозка", "Chuqur muzlatilgan")], ["dry", t("Сухой груз", "Quruq yuk")]])}
${grp("vvol", t("Объём фургона", "Furgon hajmi"), [["12", t("до 12 м³", "12 m³ gacha")], ["20", t("до 20 м³", "20 m³ gacha")], ["26", t("до 26 м³", "26 m³ gacha")], ["33", t("до 33 м³", "33 m³ gacha")], ["40", t("до 40 м³", "40 m³ gacha")]])}
${grp("vunit", t("Холодильная установка", "Sovutish qurilmasi"), [["roof", t("Накрышная", "Tomga")], ["front", t("Фронтальная", "Old tomonga")], ["semi", t("Для полуприцепа", "Yarim tirkama uchun")], ["none", t("Не нужна", "Kerak emas")]])}
${grp("vfloor", t("Пол", "Pol"), [["ply", t("Фанера с противоскользящим покрытием", "Sirpanmaydigan qoplamali fanera")], ["alu", t("Рифлёный алюминий", "Rifli alyuminiy")], ["steel", t("Рифлёная сталь", "Rifli po‘lat")], ["pu", t("Полиуретановая заливка", "Poliuretan quyma")]])}
<p class="vk-note" id="vk-note"></p>
<button class="btn btn-pri" type="submit">${ICON.tg}<span>${t("Отправить задание мастеру", "Topshiriqni ustaga yuborish")}</span></button>
<p class="note-ok" id="vk-done" role="status" hidden></p>
<script type="application/json" id="vk-data">${JSON.stringify({ cool: t("Для охлаждённых продуктов кузов обшивают изнутри листами, между ними и стенками фургона ставят утеплитель.", "Sovutilgan mahsulotlar uchun kuzov ichidan listlar bilan qoplanadi, ular va devorlar orasiga issiqlik izolyatsiyasi qo‘yiladi."), frozen: t("Для глубокой заморозки кузов обшивают изнутри изотермическими сэндвич-панелями.", "Chuqur muzlatish uchun kuzov ichidan izotermik sendvich panellar bilan qoplanadi."), dry: t("Для сухого груза хватит крытого кузова из сэндвич-панелей или ALUCOBOND.", "Quruq yuk uchun sendvich panel yoki ALUCOBOND yopiq kuzov yetarli.") }).replace(/</g, "\\u003c")}</script>
</form>
</div>
</div></section>`;
}

/* Оборудование: Польша, Италия, Китай. */
function equipBlock(l) {
  const t = T(l);
  return `<section id="oborudovanie" data-tone="steel"><div class="wrap">
${head(t("Оборудование", "Uskunalar"), t("Польша, Италия, Китай", "Polsha, Italiya, Xitoy"), t("Официальный дилер в Узбекистане компаний «EuropeGAS» (Польша) и «JIAXING E-XON POWER TECHNOLOGY» (Китай). Форсунки и контроллеры с сертификатами производителя.", "O‘zbekistonda «EuropeGAS» (Polsha) va «JIAXING E-XON POWER TECHNOLOGY» (Xitoy) kompaniyalarining rasmiy dileri. Ishlab chiqaruvchi sertifikatli forsunka va kontrollerlar."))}
<div class="eq">
<figure class="eq-c eq-pl rv a-fit"><div class="eq-img"><img data-src="${IMG}/ecu-s.webp" width="600" height="600" alt="${t("Контроллеры EuropeGAS Basico", "EuropeGAS Basico kontrollerlari")}"></div><figcaption><span class="eq-f">PL</span><h3>EuropeGAS</h3><p>${t("Контроллеры, редукторы, инжекторы", "Kontrollerlar, reduktorlar, injektorlar")}</p></figcaption></figure>
<figure class="eq-c eq-it rv a-click" style="--d:80ms"><div class="eq-img"><img data-src="${IMG}/rail-s.webp" width="640" height="426" alt="${t("Рейка форсунок RAIL", "RAIL forsunka reykasi")}"></div><figcaption><span class="eq-f">IT</span><h3>RAIL</h3><p>${t("Инжекторы", "Injektorlar")}</p></figcaption></figure>
<div class="eq-c eq-cn rv a-drop" style="--d:160ms"><div class="eq-big">4</div><div><span class="eq-f">CN</span><h3>E-XON</h3><p>${t("Комплектующие газового оборудования 4 поколения, редукторы, инжекторы", "4-avlod gaz uskunasi butlovchi qismlari, reduktorlar, injektorlar")}</p></div></div>
</div>
</div></section>`;
}

/* Наши работы: фургоны Labo с их сайта, марки машин. */
const VANS = [4, 5, 8, 11, 12, 1, 7, 10, 2, 6];
function worksBlock(l) {
  const t = T(l);
  const light = ["Chevrolet", "Ravon", "Lada", "Mercedes", "KIA", "Hyundai"];
  const cargo = ["Labo", "Changan", "Dongfeng", "KIA", "Hyundai", t("Газель", "Gazel")];
  const row = (a) => a.map((x) => `<span>${x}</span>`).join("");
  return `<section id="raboty" data-tone="ice"><div class="wrap">
${head(t("Наша работа", "Bizning ishlarimiz"), t("Фургоны, которые мы собрали", "Biz yig‘gan furgonlar"), t("Фото с нашего сайта: изотермические кузова на Labo. Нажмите, чтобы рассмотреть.", "Saytimizdagi fotolar: Labo uchun izotermik kuzovlar. Ko‘rish uchun bosing."))}
<div class="gal">${VANS.map((n, k) => `<button type="button" class="gi gi-${k} rv a-fit" style="--d:${(k % 4) * 60}ms" data-full="${IMG}/van${n}.webp" data-cap="${t("Фургон на Labo, фото GAZMETPROD SERVIS", "Labo furgon, GAZMETPROD SERVIS fotosi")}" aria-label="${t("Открыть фото", "Fotoni ochish")}"><img data-src="${IMG}/van${n}-s.webp" alt="${t("Фургон на Labo", "Labo furgon")}" loading="lazy"><i>${ICON.zoom}</i></button>`).join("")}</div>
<div class="mq" aria-label="${t("Машины, которые мы переоборудовали", "Biz qayta jihozlagan mashinalar")}"><p class="mq-k">${t("Переоборудовали и обслужили", "Qayta jihozladik va xizmat ko‘rsatdik")}</p><div class="mq-row"><div>${row(light)}${row(cargo)}</div><div aria-hidden="true">${row(light)}${row(cargo)}</div></div></div>
</div></section>`;
}

/* Документы: сертификаты и разрешения с их сайта. */
function docsBlock(l) {
  const t = T(l);
  const docs = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const facts = [
    t("Все услуги лицензированы", "Barcha xizmatlar litsenziyalangan"),
    t("Продукция сертифицирована", "Mahsulot sertifikatlangan"),
    t("Аккредитация «свидетельство»", "«Guvohnoma» akkreditatsiyasi"),
    t("Разрешение Госкомитета промышленной безопасности", "Sanoat xavfsizligi davlat qo‘mitasi ruxsatnomasi"),
    t("Свидетельство службы безопасности дорожного движения МВД", "IIV yo‘l harakati xavfsizligi xizmati guvohnomasi"),
  ];
  return `<section id="dokumenty" data-tone="night"><div class="wrap">
${head(t("Документы", "Hujjatlar"), t("Лицензии и сертификаты", "Litsenziya va sertifikatlar"), t("Для этих услуг у нас созданы все условия: испытательная лаборатория и учебные классы для водителей и персонала.", "Bu xizmatlar uchun barcha sharoitlar bor: sinov laboratoriyasi hamda haydovchi va xodimlar uchun o‘quv sinflari."))}
<ul class="dfacts">${facts.map((f, k) => `<li class="rv a-click" style="--d:${k * 60}ms">${ICON.check}<span>${f}</span></li>`).join("")}</ul>
<div class="docs">${docs.map((n, k) => `<button type="button" class="dc rv a-drop" style="--d:${(k % 5) * 50}ms" data-full="${IMG}/doc${n}.webp" data-cap="${t("Документ с сайта europegas.uz", "europegas.uz saytidagi hujjat")}" aria-label="${t("Открыть документ", "Hujjatni ochish")}"><img data-src="${IMG}/doc${n}-s.webp" alt="${t("Сертификат", "Sertifikat")} ${k + 1}" loading="lazy"></button>`).join("")}</div>
</div></section>`;
}

/* Команда и партнёры. */
function teamBlock(l) {
  const t = T(l);
  const cl = [1, 2, 3, 4, 5, 6, 7, 11];
  return `<section id="kompaniya" data-tone="steel"><div class="wrap">
<div class="tm">
<figure class="tm-ph rv a-fit"><img data-src="${IMG}/team-s.webp" width="800" height="450" alt="${t("Команда GAZMETPROD SERVIS", "GAZMETPROD SERVIS jamoasi")}"></figure>
<div class="tm-t rv a-drop"><span class="kicker"><i></i>${t("О компании", "Kompaniya haqida")}</span><h2>${t("Одно из самых видных предприятий по газификации машин в Узбекистане", "O‘zbekistonda mashinalarni gazlashtirish bo‘yicha eng ko‘zga ko‘ringan korxonalardan biri")}</h2><p class="sub">${t("ООО «GAZMETPROD SERVIS» в течение 15 лет обслуживает водителей по постановлению Кабмина от 11 ноября 2015 года № 326.", "«GAZMETPROD SERVIS» MChJ 15 yil davomida Vazirlar Mahkamasining 2015-yil 11-noyabrdagi 326-son qaroriga muvofiq haydovchilarga xizmat ko‘rsatadi.")}</p>
<div class="tm-n">${NUM.map(([n, x]) => `<div><b class="num" data-count="${n}">${sum(n)}</b><span>${x[l]}</span></div>`).join("")}</div></div>
</div>
<div class="mq mq-cl"><p class="mq-k">${t("Наши партнёры", "Hamkorlarimiz")}</p><div class="mq-row">${[0, 1].map((r) => `<div${r ? ' aria-hidden="true"' : ""}>${cl.map((n) => `<span class="cl"><img data-src="${IMG}/cl${n}.webp" alt="${r ? "" : t("Партнёр", "Hamkor")}" loading="lazy"></span>`).join("")}</div>`).join("")}</div></div>
</div></section>`;
}

/* Вопросы: ответы из их же текстов. */
function faqBlock(l) {
  const t = T(l);
  const qa = [
    [t("Какая гарантия?", "Qanday kafolat?"), t("Гарантийный срок эксплуатации оборудования 1 год. Обслуживание машин на метане и пропане продолжаем и после того, как гарантия закончилась.", "Uskunadan foydalanish kafolat muddati 1 yil. Metan va propandagi mashinalarga kafolat tugagandan keyin ham xizmat ko‘rsatamiz.")],
    [t("Какое оборудование ставите?", "Qanday uskuna o‘rnatasiz?"), t("Польское EuropeGAS (контроллеры, редукторы, инжекторы), итальянское RAIL (инжекторы) и китайское E-XON (комплектующие 4 поколения). Системы 3 и 4 поколения, форсунки на 4 и 6 цилиндров.", "Polshaning EuropeGAS (kontroller, reduktor, injektorlar), Italiyaning RAIL (injektorlar) va Xitoyning E-XON (4-avlod butlovchilari). 3 va 4-avlod tizimlari, 4 va 6 silindrli forsunkalar.")],
    [t("Как часто испытывать баллон?", "Ballonni qanchalik tez-tez sinash kerak?"), t("Метановый раз в 3 года, пропановый раз в 2 года. Испытываем у себя и выдаём свидетельство.", "Metan ballon 3 yilda bir, propan ballon 2 yilda bir. O‘zimizda sinaymiz va guvohnoma beramiz.")],
    [t("На какие машины ставите?", "Qanday mashinalarga o‘rnatasiz?"), t("Легковые: Chevrolet, Ravon, Lada, Mercedes, KIA, Hyundai и другие. Грузовые: Labo, Changan, Dongfeng, KIA, Hyundai, Газель.", "Yengil: Chevrolet, Ravon, Lada, Mercedes, KIA, Hyundai va boshqalar. Yuk: Labo, Changan, Dongfeng, KIA, Hyundai, Gazel.")],
    [t("Есть очередь?", "Navbat bormi?"), t("Нет: у нас большой штат мастеров и площадей.", "Yo‘q: ustalar va maydonlarimiz ko‘p.")],
    [t("Где вы находитесь?", "Qayerdasiz?"), t("Ташкент, Алмазарский район, Каракамыш 1/4, 11-А. Там же техосмотр «Texnik ko‘rik».", "Toshkent, Olmazor tumani, Qoraqamish 1/4, 11-A. U yerda «Texnik ko‘rik» texnik ko‘rigi ham bor.")],
  ];
  return `<section id="faq" data-tone="frost"><div class="wrap faq-w">
${head(t("Вопросы", "Savollar"), t("Часто спрашивают", "Ko‘p so‘rashadi"), "")}
<div class="faq">${qa.map(([q, a], k) => `<details class="fq rv a-fit" style="--d:${k * 50}ms"${k === 0 ? " open" : ""}><summary><span>${q}</span><i aria-hidden="true">${ICON.plus}</i></summary><p>${a}</p></details>`).join("")}</div>
</div></section>`;
}

/* Контакты: все отделы с их сайта, адрес, карта. */
function contactBlock(l) {
  const t = T(l);
  return `<section id="kontakty" class="final" data-tone="deep"><div class="wrap fin">
<div class="fin-t rv a-fit"><span class="kicker"><i></i>${t("Контакты", "Kontaktlar")}</span><h2>${t("Звоните в нужный отдел", "Kerakli bo‘limga qo‘ng‘iroq qiling")}</h2>
<ul class="staff">${STAFF.map(([role, who, ph]) => `<li><div><b>${role[l]}</b>${who ? `<span>${who[l]}</span>` : ""}</div><p>${ph.map((p) => `<a href="tel:${p}">${telT(p)}</a>`).join("")}</p></li>`).join("")}</ul>
<div class="cta">${tgBtn("btn-pri shim", t("Написать в Telegram", "Telegramga yozish"), helloText(l))}<a class="btn btn-ghost" href="${F.map}">${ICON.pin}<span>${t("Маршрут в Яндекс Картах", "Yandex Xaritada yo‘l")}</span></a></div></div>
<a class="map glass rv a-fit" href="${F.map}" aria-label="${t("Открыть на карте", "Xaritada ochish")}"><svg viewBox="0 0 600 420" aria-hidden="true" focusable="false"><g fill="none" stroke="rgb(127 220 255 / .16)" stroke-width="2"><path d="M-10 120 L610 80M-10 300 L610 260M120 -10 L160 430M420 -10 L460 430"/><path d="M-10 200 L610 170" stroke-width="10" stroke="rgb(127 220 255 / .26)"/></g><g fill="rgb(127 220 255 / .07)"><rect x="180" y="96" width="220" height="70" rx="10"/><rect x="40" y="210" width="90" height="70" rx="10"/><rect x="180" y="200" width="100" height="70" rx="10"/><rect x="480" y="190" width="100" height="62" rx="10"/><rect x="190" y="290" width="210" height="80" rx="10"/></g><text x="430" y="160" fill="rgb(127 220 255 / .6)" font-size="15" font-family="Onest,sans-serif">${t("Каракамыш", "Qoraqamish")}</text><circle class="ping" cx="300" cy="186" r="14"/><g transform="translate(272 158) scale(.16)"><use href="#eg-sign"/></g></svg><span class="map-c"><b>GAZMETPROD SERVIS</b><span>${F.addr[l]}</span></span></a>
</div></section>`;
}

/* ── Главная ──────────────────────────────────────────────────────────── */
function home(l) {
  const t = T(l);
  const body = `<div data-addon="story">${storyBlock(l)}</div>
${heroPlain(l)}
${servicesBlock(l)}
${whyBlock(l)}
${calcBlock(l)}
${bookingBlock(l)}
${testBlock(l)}
${vanBlock(l)}
${worksBlock(l)}
${equipBlock(l)}
${docsBlock(l)}
${teamBlock(l)}
${faqBlock(l)}
${contactBlock(l)}`;
  return shell(l, "", {
    title: t("GAZMETPROD SERVIS: установка метана и пропана в Ташкенте", "GAZMETPROD SERVIS: Toshkentda metan va propan o‘rnatish"),
    desc: t("Газобаллонное оборудование EuropeGAS и E-XON на легковые и грузовые машины, испытание баллонов, фургоны и рефрижераторы. Каракамыш, Ташкент.", "Yengil va yuk mashinalariga EuropeGAS va E-XON gaz ballon uskunalari, ballon sinovi, furgon va refrijeratorlar. Qoraqamish, Toshkent."),
  }, body);
}

/* ── Что дальше: было и стало, конструктор, конкуренты, изображения ──── */
const COMP = JSON.parse(readFileSync(DIR + "comp.json", "utf8"));
function plan(l) {
  const t = T(l);
  const hasBa = existsSync(new URL(`../../../public${IMG}/ba-old-d.webp`, import.meta.url));
  const ba = (o, n, cap, was) => `<figure class="rv a-fit"><div class="ba-box" data-ba><img src="${IMG}/${n}" alt="${t("Прототип", "Prototip")}" loading="lazy"><div class="was"><img src="${IMG}/${o}" alt="${t("Сайт сегодня", "Bugungi sayt")}" loading="lazy"></div><span class="tag2 a">${t("было", "edi")}</span><span class="tag2 b">${t("стало", "bo‘ldi")}</span><span class="knob"><i>${ICON.arrows}</i></span><input type="range" min="0" max="100" value="50" aria-label="${t("Сравнить", "Solishtirish")}"></div><figcaption><span>${cap}</span><span>${was}</span></figcaption></figure>`;
  const body = `<section class="phead" data-tone="ink"><div class="wrap"><span class="kicker"><i></i>${t("Предложение DevUz Studio для GAZMETPROD SERVIS", "DevUz Studio’ning GAZMETPROD SERVIS uchun taklifi")}</span><h1>${hasBa ? t("Было и стало", "Edi va bo‘ldi") : t("Что дальше", "Keyingi qadam")}</h1><p class="lead">${hasBa ? t("Слева europegas.uz сегодня, справа этот прототип. Тяните шторку.", "Chapda bugungi europegas.uz, o‘ngda shu prototip. Pardani torting.") : t("Конструктор, что взяли у конкурентов и откуда изображения.", "Konstruktor, raqobatchilardan nima oldik va rasmlar qayerdan.")}</p></div></section>
${hasBa ? `<section data-tone="ink" style="padding-top:0"><div class="wrap"><div class="ba">
${ba("ba-old-d.webp", "ba-new-d.webp", t("Компьютер · первый экран", "Kompyuter · birinchi ekran"), t("было: три одинаковых слайда и «Заказать звонок»", "edi: uchta bir xil slayd va «Qo‘ng‘iroq buyurtma qilish»"))}
${ba("ba-old-m.webp", "ba-new-m.webp", t("Телефон · первый экран", "Telefon · birinchi ekran"), t("было: ни телефона, ни записи", "edi: telefon ham, yozilish ham yo‘q"))}
</div></div></section>` : ""}
<section id="konstruktor" data-tone="ice"><div class="wrap">
${head(t("Конструктор проекта", "Loyiha konstruktori"), t("Соберите сайт под свой бюджет", "Saytni byudjetingizga moslab yig‘ing"), t("Сайт стоит 1 700 $. Остальное включается тумблером: включили блок, и он появляется на странице, итог пересчитывается. Со всеми допами 3 000 $.", "Sayt 1 700 $ turadi. Qolgani tumbler bilan yoqiladi: blokni yoqsangiz, u sahifada paydo bo‘ladi, jami qayta hisoblanadi. Barcha qo‘shimchalar bilan 3 000 $."))}
<div class="kit">
<div class="kit-list">
<div class="kit-base"><div><b>${KIT_BASE[l].t}</b><p>${KIT_BASE[l].d}</p></div><span class="kit-price num">${usd(KIT_BASE.price)}</span></div>
<h3 class="kit-g">${t("Допы на сайте", "Saytdagi qo‘shimchalar")}</h3>
${ADDONS.map((a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="${(a.needs || []).join(" ")}" data-def checked><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}</b><small>${a[l].e}</small></span><span class="kit-price num">${usd(a.price)}</span></label>`).join("")}
<h3 class="kit-g">${t("Сверх сайта", "Saytdan tashqari")}</h3>
${BLOCKS.map((b) => `<label class="kit-row"><input type="checkbox" data-k="${b.id}" data-p="${b.price}" data-needs="${(b.needs || []).join(" ")}" data-def checked><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${b[l].t}</b><small>${b[l].why}</small><span class="kit-li">${b[l].li.map((x) => `<em>${x}</em>`).join("")}</span></span><span class="kit-price num">${usd(b.price)}</span></label>`).join("")}
</div>
<div class="kit-side">
<div class="kit-total"><small>${t("Итого с сайтом", "Sayt bilan jami")}</small><b class="num" id="kit-sum"></b><small id="kit-n"></small><a class="btn btn-white" href="https://t.me/Devuz_studio_bot?start=europegas">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a></div>
<p class="src">${t("Цены по середине рынка Узбекистана: сайт компании на двух языках с управлением у студий стоит примерно от 1 200 до 2 500 $, с калькуляторами, ботом и продвижением от 2 500 $.", "Narxlar O‘zbekiston bozorining o‘rtasi bo‘yicha: studiyalarda boshqaruvli ikki tilli kompaniya sayti taxminan 1 200 dan 2 500 $ gacha, kalkulyatorlar, bot va ilgari surish bilan 2 500 $ dan.")}</p>
</div>
</div>
</div></section>
<section id="konkurenty" data-tone="frost"><div class="wrap">
${head(t("Что взяли у конкурентов", "Raqobatchilardan nima oldik"), t("Сильное у газовых сервисов Узбекистана", "O‘zbekiston gaz servislarining kuchli tomonlari"), "")}
<div class="grid3">${COMP.map((c, k) => `<div class="note rv a-fit" style="--d:${(k % 3) * 80}ms"><h3>${c[l][0]}</h3><p>${c[l][1]}</p></div>`).join("")}</div>
</div></section>
<section id="foto" data-tone="ice"><div class="wrap">
${head(t("Изображения в прототипе", "Prototipdagi rasmlar"), t("Откуда изображения", "Rasmlar qayerdan"), "")}
<ul class="credits"><li>${t("Логотип GAZMETPROD SERVIS по файлу с europegas.uz: ромб и пламя перерисованы геометрией, буквы набраны близким шрифтом Montserrat. Вектор, чёткий на любом экране.", "GAZMETPROD SERVIS logotipi europegas.uz’dagi fayl bo‘yicha: romb va alanga geometriya bilan qayta chizilgan, harflar yaqin Montserrat shriftida. Vektor, har qanday ekranda aniq.")}</li><li>${t("Машина в разрезе, баллон на испытании и фургон по слоям нарисованы кодом: это схемы, а не фото. Сгенерированных картинок в прототипе нет.", "Kesimdagi mashina, sinovdagi ballon va qatlamli furgon kod bilan chizilgan: bu sxemalar, foto emas. Prototipda generatsiya qilingan rasmlar yo‘q.")}</li><li>${t("Фото команды, фургонов, оборудования, сертификатов и логотипы партнёров взяты с europegas.uz без увеличения.", "Jamoa, furgonlar, uskunalar, sertifikatlar fotolari va hamkorlar logotiplari europegas.uz’dan kattalashtirilmasdan olingan.")}</li><li>${t("Анимации по мотивам компонентов с 21st.dev под MIT: Magic UI (Bento Grid, Magic Card, Orbiting Circles, Marquee, Shimmer Button, Border Beam, Number Ticker). Код свой.", "Animatsiyalar 21st.dev’dagi MIT komponentlari asosida: Magic UI (Bento Grid, Magic Card, Orbiting Circles, Marquee, Shimmer Button, Border Beam, Number Ticker). Kod o‘zimizniki.")}</li></ul>
</div></section>`;
  return shell(l, "plan", {
    title: t("Что дальше: конструктор сайта | GAZMETPROD SERVIS", "Keyingi qadam: sayt konstruktori | GAZMETPROD SERVIS"),
    desc: t("Конструктор: сайт 1 700 $, со всеми допами 3 000 $. Что взяли у конкурентов и откуда изображения.", "Konstruktor: sayt 1 700 $, barcha qo‘shimchalar bilan 3 000 $. Raqobatchilardan nima oldik va rasmlar qayerdan."),
  }, body);
}

const BUILD = { "": home, plan };
const out = {};
for (const l of ["ru", "uz"]) {
  const pre = l === "uz" ? "uz" : "";
  for (const p of Object.keys(BUILD)) out[pre ? pre + (p ? "/" + p : "") : p] = BUILD[p](l);
}
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/*
 * Сборка для сервера (lib/proto/bundles): общие куски — стили и главный
 * скрипт — один раз, в страницах вместо них метка @@имя@@.
 */
const parts = { S: `<style>${CSS}</style>`, J: `<script>\n${JS}</script>` };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let page = html;
  for (const [name, part] of Object.entries(parts)) page = page.split(part).join(`@@${name}@@`);
  pages[key] = page;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "europegas.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(main)").padEnd(12), v.length);
