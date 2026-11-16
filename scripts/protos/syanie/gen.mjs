import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import * as DATA from "./data.mjs";
import { BASE, ADDONS, ALL, OFFER_HOURS, CUR } from "./plan.mjs";
import { pathToFileURL } from "node:url";
import * as CAT from "./catalog.mjs";
import { makePages } from "./pages.mjs";

/*
 * Макет сайта стоматологии «Сияние Севера» (Томск, ул. Белинского, 63), одна
 * страница на русском:
 *  - видео DevUz (dzIntroSolo) и сразу за ним кино клиники: камера входит в
 *    их дверь, проходит коридор со световыми линиями, ресепшен с названием,
 *    уходит налево и залетает в кабинет (film-16 / film-9.mp4);
 *  - дальше прокрутка ведёт кадры на canvas, как на страницах Apple: подлёт к
 *    пациенту под лампой (тут название услуги All-on-6), шесть немецких
 *    имплантов встают в десну по шагам, камера идёт за имплантом в руке
 *    врача, протез садится на место (s16 / s9, кадры WebP);
 *  - All-on-6 против All-on-4, цены и подарки, предупреждение, квиз из 4
 *    шагов, врачи, гарантии, лаборатория, привилегии, отзывы, интерьер,
 *    «Сейчас и станет», что взяли у лучших, вопросы, как доехать, стоимость.
 * Все факты — с их сайта (data.mjs). Кадры и фоны сняты нейросетью по их
 * фото (README). Ссылки — через __PROTO_BASE__, отпечаток ставится при показе
 * зерном из protos.stamp (lib/proto/bundles). Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
/* SY_PROD=1 — рабочий сайт клиники для её сервера (app/site, README в app):
   без видео DevUz, без разбора и предложения DevUz, без условий макета;
   запись и квиз уходят на сервер клиники с телефоном, чат — администратору. */
let PROD = process.env.SY_PROD === "1";
/* Рабочий сайт на сервере клиники собирается из этого же файла: server.mjs
   зовёт renderLive(правки из админки) и подменяет данные data.mjs на время
   сборки. Видео DevUz там не нужно, и lib/ в образ не едет. */
const IS_MAIN = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const RENDER_ONLY = process.env.SY_RENDER === "1";
const { dzIntroSolo } = PROD || RENDER_ONLY ? { dzIntroSolo: () => "" } : await import("../../../lib/proto/dz-video.mjs");
/* Рабочий сайт — свои врачи (catalog.mjs), макет — прежние (data.mjs). */
let D = PROD ? { ...DATA, DOCTORS: CAT.DOCTORS } : DATA, B = DATA.BRAND, TX = {}, LIVE = {}, LAYOUT = null;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/syanie";
const PUB = process.env.SY_PUB || new URL("../../../public", import.meta.url).pathname;
const LIVE_DIR = process.env.SY_LIVE_DIR || new URL("./app/site/", import.meta.url).pathname;
const BASEP = "__PROTO_BASE__";
const TERMS = "https://devuz.studio/ru/mockup-terms";
const FONTS = "https://fonts.googleapis.com/css2?family=Noto+Serif+Display:ital,wght@0,400;1,400&family=Geologica:wght@400;700&display=swap";
const read = (f) => readFileSync(DIR + f, "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/* Текст без разметки и сущностей: правки из админки приходят экранированными,
   а в разметке для поисковиков (JSON-LD) нужен простой текст. */
const plain = (s) => String(s ?? "").replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const rub = (n) => grp(n) + " ₽";
const usd = (n) => grp(n) + " " + CUR;
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const MEDIA = JSON.parse(read("media.json"));
const IMPL = D.IMPLANT.adj + " импланты";

/* ── Иконки: контуры 24×24 ───────────────────────────────────────────── */
const S = 'fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  arrow: `<path d="M5 12h14M13 6l6 6-6 6" ${S}/>`,
  down: `<path d="M12 5v14M6 13l6 6 6-6" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  plus: `<path d="M12 5v14M5 12h14" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  phone: `<path d="M5 4.5h3.5l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" ${S}/>`,
  msg: `<path d="M4 5.5h16v11H9l-5 3.5z" ${S}/><path d="M8 10h8M8 13h5" ${S}/>`,
  pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${S}/><circle cx="12" cy="10" r="2.4" ${S}/>`,
  clock: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 7.5V12l3 2" ${S}/>`,
  car: `<path d="M4 16v-4l2-5h12l2 5v4M4 16h16M4 16v2.5M20 16v2.5" ${S}/><circle cx="8" cy="13.5" r="1" ${S}/><circle cx="16" cy="13.5" r="1" ${S}/>`,
  park: `<rect x="4" y="4" width="16" height="16" rx="3" ${S}/><path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3" ${S}/>`,
  shield: `<path d="M12 3.5 5 6v5.5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6z" ${S}/><path d="m9 12 2 2 4-4" ${S}/>`,
  tooth: `<path d="M7.5 4c-2.2 0-3.5 1.8-3.5 4.3 0 3 1.4 4.5 2 7.2.5 2.5 1 4.5 2.3 4.5 1.5 0 1.3-4.5 3.7-4.5s2.2 4.5 3.7 4.5c1.3 0 1.8-2 2.3-4.5.6-2.7 2-4.2 2-7.2C20 5.8 18.7 4 16.5 4c-1.8 0-2.6 1-4.5 1S9.3 4 7.5 4z" ${S}/>`,
  implant: `<path d="M9 3.5h6v3H9zM10 6.5h4l-.5 2h-3z" ${S}/><path d="M10.5 8.5h3l-.3 11-1.2 1.5-1.2-1.5z" ${S}/><path d="M9.5 11h5M9.8 13.5h4.4M10 16h4" ${S}/>`,
  lab: `<path d="M9 3.5h6M10 3.5v5L5.5 18a1.8 1.8 0 0 0 1.6 2.5h9.8a1.8 1.8 0 0 0 1.6-2.5L14 8.5v-5" ${S}/><path d="M7.5 14h9" ${S}/>`,
  wave: `<path d="M3 12c2 0 2-4 4-4s2 8 4 8 2-8 4-8 2 4 4 4h2" ${S}/>`,
  moon: `<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" ${S}/>`,
  drop: `<path d="M12 3.5s-6 6.6-6 10.5a6 6 0 0 0 12 0c0-3.9-6-10.5-6-10.5z" ${S}/>`,
  user: `<circle cx="12" cy="8.5" r="3.8" ${S}/><path d="M4.5 20c1.3-3.8 4-5.6 7.5-5.6s6.2 1.8 7.5 5.6" ${S}/>`,
  doc: `<path d="M6.5 3.5h7l4 4v13h-11z" ${S}/><path d="M13.5 3.5v4h4M9 12h6M9 15.5h6" ${S}/>`,
  card: `<rect x="3" y="5.5" width="18" height="13" rx="2.5" ${S}/><path d="M3 10h18M7 15h4" ${S}/>`,
  gift: `<rect x="3.5" y="9" width="17" height="11.5" rx="2" ${S}/><path d="M3.5 13h17M12 9v11.5M12 9c-1.6-3.5-5.5-4-5.5-1.5S9.5 9 12 9zm0 0c1.6-3.5 5.5-4 5.5-1.5S14.5 9 12 9z" ${S}/>`,
  star: `<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" stroke-width="1.5" stroke-linejoin="round"/>`,
  play: `<path d="M8 5.5v13l10-6.5z" ${S}/>`,
  replay: `<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4.5v4h4" ${S}/>`,
  tg: `<path d="M21 4 3 11l6 2 2 6 3-4 5 4z" ${S}/><path d="m9 13 9-7" ${S}/>`,
  wa: `<path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z" ${S}/><path d="M9.2 8.6c.3 2.9 2.4 5.2 5.4 5.9l1.2-1.3-1.8-1-1 .8c-1-.4-1.9-1.3-2.4-2.4l.8-1-1-1.8z" ${S}/>`,
  spark: `<path d="M12 3.5c.8 4.2 2.3 5.7 6.5 6.5-4.2.8-5.7 2.3-6.5 6.5-.8-4.2-2.3-5.7-6.5-6.5 4.2-.8 5.7-2.3 6.5-6.5z" ${S}/>`,
  copy: `<rect x="8" y="8" width="12" height="12" rx="2" ${S}/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" ${S}/>`,
  eye: `<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" ${S}/><circle cx="12" cy="12" r="3" ${S}/>`,
  menu: `<path d="M4 7h16M4 12h16M4 17h16" ${S}/>`,
};
/* Значки только рабочего сайта: в спрайт макета не идут, он тот же байт в байт. */
const LIVE_ICONS = new Set(["wa", "eye", "menu"]);
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(I)
  .filter(([k]) => PROD || !LIVE_ICONS.has(k))
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
  .join("")}</defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;

/* Знак клиники: зуб с полумесяцем сияния, как в их логотипе, одним цветом. */
const MARK = `<svg class="mk" viewBox="0 0 40 40" aria-hidden="true"><path d="M13.6 9.5c-3.4 0-5.3 2.7-5.3 6.5 0 4.6 2.1 6.8 3 10.9.8 3.8 1.5 6.6 3.4 6.6 2.2 0 2-6.6 5.4-6.6s3.2 6.6 5.4 6.6c1.9 0 2.6-2.8 3.4-6.6.9-4.1 3-6.3 3-10.9 0-3.8-1.9-6.5-5.3-6.5-2.7 0-3.9 1.5-6.5 1.5s-3.8-1.5-6.5-1.5z" fill="currentColor"/><path d="M5 26.5C3.2 17 9.5 6.5 21 5.2" fill="none" stroke="var(--onyx)" stroke-width="1.6" stroke-linecap="round"/><path d="M31.5 5.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="var(--onyx)"/></svg>`;
const logo = (cls = "") => `<span class="lg ${cls}">${MARK}<span class="lg-t"><b>Сияние Севера</b><small>центр имплантации</small></span></span>`;

let tel = `tel:${B.phoneRaw}`;
/* Кнопки WhatsApp и Telegram (п. 4 техзадания договора): номер и ник клиника
   вписывает в админке; пусто — кнопки нет. В макете их нет. */
const msgLinks = () => [
  B.whatsapp && [`https://wa.me/${String(B.whatsapp).replace(/\D/g, "")}`, "WhatsApp", "wa"],
  B.telegram && [`https://t.me/${String(B.telegram).replace(/^@|^https?:\/\/t\.me\//, "")}`, "Telegram", "tg"],
].filter(Boolean);
const sms = (body) => `sms:${B.phoneRaw}?&body=${encodeURIComponent(body)}`;
const SMS_HI = "Здравствуйте! Хочу записаться на бесплатную консультацию по All-on-6.";
/* 152-ФЗ: согласие на обработку — отдельной галочкой, не отмеченной заранее,
   со ссылкой на текст согласия (отдельный документ /soglasie). Без неё заявка
   не уходит: проверяют store-live.js и сервер (/api/lead). */
const consentBox = (id) => `<label class="pd-ok"><input type="checkbox" id="${id}"><span>Даю <a href="/soglasie" target="_blank" rel="noopener">согласие на обработку персональных данных</a>. <a href="/privacy" target="_blank" rel="noopener">Как мы обрабатываем данные</a></span></label>`;

function headTags(title, desc, path = "/") {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
${PROD && path ? `<meta name="robots" content="index, follow">
<link rel="canonical" href="__SITE_URL__${path}">
<meta property="og:type" content="website">
<meta property="og:url" content="__SITE_URL__${path}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="__SITE_URL__${IMG}/og.jpg">${seoShare()}` : `<meta name="robots" content="noindex, nofollow, noarchive">`}
<meta name="theme-color" content="#1e2b33">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">${PROD ? seoTags() : ""}`;
}
/* Превью ссылки в мессенджерах и соцсетях: JPG 1200×630 (WebP видят не все),
   имя сайта и язык. Только рабочий сайт: в макете превью не нужно. */
function seoShare() {
  return `
<meta property="og:image:secure_url" content="__SITE_URL__${IMG}/og.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Центр имплантации «${esc(plain(B.name))}», Томск">
<meta property="og:site_name" content="${esc(plain(B.name))}">
<meta property="og:locale" content="ru_RU">
<meta name="twitter:card" content="summary_large_image">`;
}
/* Яндекс.Метрика и коды подтверждения Вебмастера и Search Console
   (п. 7 техзадания): номер счётчика и коды вписывают в админке. */
function seoTags() {
  const s = LIVE.seo || {}, out = [];
  if (s.yandex) out.push(`<meta name="yandex-verification" content="${s.yandex}">`);
  if (s.google) out.push(`<meta name="google-site-verification" content="${s.google}">`);
  /* Метрика ставит cookie, поэтому включается только после «Разрешить» в
     окне о cookie (152-ФЗ): номер счётчика идёт в данные страницы, сам
     счётчик грузит live-pages.js. */
  return out.length ? "\n" + out.join("\n") : "";
}

/* Текст раздела: правка из админки (уже экранирована) главнее текста по умолчанию. */
const tx = (key, kick, h, p = "", cls = "") => { SEEN[key] = { kick, h, p }; const t = TX[key] || {}; return head(t.kick ?? kick, t.h ?? h, t.p ?? p, cls); };
/* Тексты по умолчанию, как их увидел последний рендер: админка показывает их рядом с правкой. */
const SEEN = {};
const head = (kick, h, p = "", cls = "") => `<div class="sh ${cls}"><span class="kick">${kick}</span><h2>${h}</h2>${p ? `<p>${p}</p>` : ""}</div>`;
const pic = (name, alt, w, h, cls = "", eager = false) => `<img class="${cls}" src="${IMG}/${name}.webp" alt="${esc(alt)}" width="${w}" height="${h}"${eager ? "" : ' loading="lazy" decoding="async"'}>`;

/* ── Первый экран: кино и сцены по прокрутке ───────────────────────── */
/* Главы поверх кадров: [от, до] — доли всей сцены (кадр 0 = конец кино).
   Сцен семь, каждая — седьмая часть: пациент, растворение, импланты, к руке,
   за рукой, к протезу, посадка. */
const CHS = [
  { id: "c1", a: 0.06, b: 0.2, kick: "Главная услуга клиники", h: `All-on-6`, p: "Все зубы на шести имплантатах. За один день, без искусственной десны.", cls: "ch-big" },
  { id: "c2", a: 0.21, b: 0.3, kick: "Шаг 1 · план", h: "Сначала КТ челюсти", p: "Врач видит кость в объёме и до операции решает, куда встанет каждый имплант. КТ для вас бесплатно." },
  { id: "c3", a: 0.3, b: 0.44, kick: "Шаг 2 · шесть опор", h: `${D.IMPLANT.adj[0].toUpperCase() + D.IMPLANT.adj.slice(1)} импланты встают по плану`, p: "Шесть опор вместо четырёх: протез держится крепче, жевать можно жёсткое мясо, яблоки, орехи.", count: true },
  { id: "c4", a: 0.5, b: 0.7, kick: `Шаг 3 · имплант`, h: `Сделано в ${D.IMPLANT.country === "Германия" ? "Германии" : D.IMPLANT.country}`, p: "Пожизненная гарантия клиники на импланты записана в договоре. От производителя на каждый имплант: 100 лет.", cls: "ch-r" },
  { id: "c5", a: 0.8, b: 1.01, kick: "Шаг 4 · протез", h: "Новые зубы в тот же день", p: "Протез делает своя лаборатория: без искусственной десны, с точной посадкой. Не натирает и не меняет дикцию.", cta: true },
];

const words = (s) => String(s).trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");

function storyBlock() {
  SEEN.hero = { kick: `${B.what} · ${B.city}`, h: "Все зубы на 6 имплантатах", em: "за один день", p: `Методика All-on-6, ${IMPL}, свой зубной техник. Листайте: покажем, как это происходит, шаг за шагом.` };
  for (const c of CHS) SEEN["ch-" + c.id] = { kick: c.kick, h: c.h, p: c.p };
  const CH = CHS.map((c) => ({ ...c, ...(TX["ch-" + c.id] || {}) }));
  const ch = CH.map((c) => `<div class="ch ${c.cls || ""}" id="${c.id}" data-a="${c.a}" data-b="${c.b}"><span class="kick">${c.kick}</span><${c.cls === "ch-big" ? "p class=\"ch-h ch-h-xl\"" : "p class=\"ch-h\""}>${c.h}</p><p class="ch-p">${c.p}</p>${c.count ? `<div class="ch-ct" aria-hidden="true">${[1, 2, 3, 4, 5, 6].map((i) => `<i data-i="${i}"></i>`).join("")}<b><span id="ct-n">0</span> из 6</b></div>` : ""}${c.cta ? `<a class="btn btn-onyx" href="#kviz">${ic("arrow")}<span>Посчитать стоимость</span></a>` : ""}</div>`).join("");
  const calm = [
    ["calm-1", "Пациент в кресле под лампой стоматолога", CH[0]],
    ["calm-2", "Шесть имплантов в десне, 3D-визуализация", CH[2]],
    ["calm-3", "Титановый имплант в руке врача", CH[3]],
    ["calm-4", "Несъёмный протез на шести имплантах, 3D-визуализация", CH[4]],
  ];
  return `<section class="story" id="story" aria-label="Как проходит All-on-6" style="--steps:${MEDIA.screens}">
<div class="stage" id="stage">
<canvas id="cv" aria-hidden="true"></canvas>
${existsSync(PUB + IMG + "/s9.mp4") ? `<video id="sv" class="sv" muted playsinline preload="none" disablepictureinpicture aria-hidden="true" data-v9="${IMG}/s9.mp4"></video>` : ""}
<video id="film" class="film" muted playsinline preload="auto" disablepictureinpicture aria-hidden="true" poster="${IMG}/film-16.webp" data-p16="${IMG}/film-16.webp" data-p9="${IMG}/film-9.webp" data-v16="${IMG}/film-16.mp4" data-v9="${IMG}/film-9.mp4"></video>
<div class="veil" aria-hidden="true"></div>
<div class="shade" aria-hidden="true"></div>
${existsSync(PUB + IMG + "/imp-16.mp4") ? `<video id="iv" class="iv" muted playsinline preload="none" disablepictureinpicture aria-hidden="true" data-v16="${IMG}/imp-16.mp4" data-v9="${IMG}/imp-9.mp4"></video>` : ""}
<canvas id="asm" aria-hidden="true" data-sprite="${IMG}/implant.png"></canvas>
<div class="glow" aria-hidden="true"></div>
<div class="cap" id="cap" aria-hidden="true"><span data-t="0">Томск, ${B.street}</span><span data-t="0.42">Центр имплантации и протезирования</span><span data-t="0.74">Кабинет имплантолога</span></div>
<div class="hero" id="hero">
<span class="kick">${TX.hero?.kick ?? `${B.what} · ${B.city}`}</span>
<h1 id="h1">${words(TX.hero?.h ?? "Все зубы на 6 имплантатах")} <em>${words(TX.hero?.em ?? "за один день")}</em></h1>
<p class="lead">${TX.hero?.p ?? `Методика All-on-6, ${IMPL}, свой зубной техник. Листайте: покажем, как это происходит, шаг за шагом.`}</p>
<div class="hero-b"><a class="btn btn-onyx" href="#zapis" data-book>${ic("msg")}<span>Записаться на консультацию</span></a><a class="btn btn-ghost" href="${tel}">${ic("phone")}<span>${B.phone}</span></a></div>
<span class="cue" aria-hidden="true">${ic("down")}<span>Листайте</span></span>
</div>
<button type="button" class="replay" id="replay" aria-label="Смотреть пролёт снова">${ic("replay")}<span>Пролёт снова</span></button>
<button type="button" class="skipf" id="skipf">Пропустить</button>
${ch}
<div class="bar" aria-hidden="true"><i id="bar"></i></div>
</div>
<div class="calm-list">${calm.map(([n, alt, c]) => `<figure class="calm-f"><picture><source media="(max-aspect-ratio: 4/5)" srcset="${IMG}/${n}-9.webp"><img src="${IMG}/${n}-16.webp" alt="${esc(alt)}" width="1600" height="900" loading="lazy" decoding="async"></picture><figcaption><span class="kick">${c.kick}</span><b>${c.h}</b><span>${c.p}</span></figcaption></figure>`).join("")}</div>
</section>`;
}

/* ── All-on-6 против All-on-4 ─────────────────────────────────────── */
function vsBlock() {
  /* Дуга челюсти и точки опор: 6 и 4 по их словам «6 точек опоры». */
  const arc = (n) => {
    const pts = n === 6 ? [-78, -50, -18, 18, 50, 78] : [-72, -24, 24, 72];
    return pts.map((a, i) => { const r = (a * Math.PI) / 180, x = 160 + Math.sin(r) * 118, y = 168 - Math.cos(r) * 118; return `<g class="pt" style="--i:${i}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11"/><path d="M${x.toFixed(1)} ${(y + 13).toFixed(1)}v18" /></g>`; }).join("");
  };
  return `<section class="vs" id="all-on-6" data-tone="ink"><div class="wrap">
${tx("vs", "Методика", "All-on-6 или All-on-4", "Обе методики ставят все зубы сразу на импланты. Разница в том, на скольких опорах держится протез. Сравнение по словам клиники.")}
<div class="vs-grid">
<div class="vs-art rv">
<div class="vs-tg" role="tablist" aria-label="Методика"><button type="button" role="tab" aria-selected="true" data-n="6">All-on-6</button><button type="button" role="tab" aria-selected="false" data-n="4">All-on-4</button></div>
<svg class="vs-svg" viewBox="0 0 320 240" role="img" aria-label="Схема: точки опоры протеза на челюсти">
<path class="vs-gum" d="M30 180C30 70 90 40 160 40s130 30 130 140" fill="none"/>
<path class="vs-bone" d="M30 180C30 70 90 40 160 40s130 30 130 140" fill="none"/>
<g class="set set-6">${arc(6)}</g><g class="set set-4">${arc(4)}</g>
</svg>
<p class="vs-n"><b id="vs-n">6</b><span>точек опоры для протеза</span></p>
</div>
<div class="vs-t rv">
<div class="vs-row vs-hd"><span></span><b>All-on-6</b><b>All-on-4</b></div>
${D.VS.map((r) => `<div class="vs-row"><span>${r.k}</span><b>${r.six}</b><em>${r.four || "нет данных"}</em></div>`).join("")}
<p class="vs-q">«Если говорить коротко, All-on-6: это улучшенная версия All-on-4. Протез держится лучше, служит дольше, идеально сидит на десне и не доставляет дискомфорта».<small>С сайта клиники</small></p>
</div>
</div>
</div></section>`;
}

/* ── Цены ─────────────────────────────────────────────────────────── */
function priceBlock(o = {}) {
  const gift = (g) => `<li><span>${ic(g.sale ? "card" : "gift")}${g.t}</span><span class="gf-p"><s>${rub(g.was)}</s><b>${g.sale ? "в подарок" : "0 ₽"}</b></span></li>`;
  return `<section class="price" id="ceny">
<picture class="price-bg" aria-hidden="true"><source media="(max-aspect-ratio: 4/5)" srcset="${IMG}/bg-onyx-9.webp"><img src="${IMG}/bg-onyx-16.webp" alt="" width="1600" height="900" loading="lazy" decoding="async"></picture>
<div class="wrap">
${tx("price", "Цены", "Сколько стоит All-on-6", "Цена на сайте клиники. Точную сумму назовёт главный врач после КТ, а КТ сейчас бесплатно.")}
<div class="pr-grid">
${D.PRICES.map((p, i) => `<article class="pr rv${p.star ? " pr-star" : ""}" style="--d:${i * 90}ms"><span class="kick">${p.star ? "Чаще выбирают" : "Методика"}</span><h3>${p.t}</h3><p>${p.d}</p><b class="pr-n" data-n="${p.price}">${rub(p.price)}</b><a class="btn ${p.star ? "btn-onyx" : "btn-line"}" href="#kviz">${ic("arrow")}<span>Рассчитать свой случай</span></a></article>`).join("")}
<article class="pr pr-gift rv" style="--d:180ms"><span class="kick">Подарки к лечению</span><h3>Выгода ${rub(D.BENEFIT)}</h3><ul class="gf">${D.GIFTS.map(gift).join("")}</ul><p class="pr-inst">${ic("card")}<span><b>Рассрочка 0%</b> от клиники, без первого взноса</span></p></article>
</div>
${PROD ? (o.all === false ? "" : `<p class="pr-all"><a class="btn btn-line" href="/ceny">${ic("arrow")}<span>Все цены клиники</span></a></p>\n`) : (D.SERVICES || []).length ? `<div class="sv-list rv"><h3>Услуги и цены</h3><ul>${D.SERVICES.map((x) => `<li><span>${x.t}</span><b>${x.p}</b></li>`).join("")}</ul></div>\n` : ""}<p class="warn warn-in" role="note">${B.warn.toUpperCase()}</p>
</div></section>`;
}

/* ── Услуги клиники (рабочий сайт): разделы со ссылками на свои страницы ── */
function servicesBlock() {
  return `<section class="uk" id="uslugi-kliniki"><div class="wrap">
${tx("uslugi", "Услуги", "Не только All-on-6", "Клиника лечит, протезирует и удаляет зубы, ставит виниры и делает чистку. У каждого направления своя страница с ценами.")}
<div class="uk-grid">${CAT.CATEGORIES.map((k, i) => `<a class="uk-c rv" style="--d:${(i % 4) * 70}ms" href="/${k.slug}"><b>${k.t}</b><span>${k.lead}</span>${ic("arrow")}</a>`).join("")}<a class="uk-c uk-all rv" style="--d:210ms" href="/ceny"><b>Цены на все услуги</b><span>Прейскурант по разделам, рассрочка и налоговый вычет.</span>${ic("arrow")}</a></div>
</div></section>`;
}

/* ── Квиз ─────────────────────────────────────────────────────────── */
function quizBlock() {
  const steps = D.QUIZ.map((s, i) => `<fieldset class="qz-s${i ? "" : " on"}" data-s="${i}"><legend><span class="qz-k">Вопрос ${i + 1} из ${D.QUIZ.length}</span>${s.q}</legend><div class="qz-a">${s.a.map((a, j) => `<label class="qz-o"><input type="radio" name="q${i}" value="${esc(a)}"${j === 0 && false ? " checked" : ""}><span>${a}</span>${ic("check")}</label>`).join("")}</div></fieldset>`).join("");
  return `<section class="quiz" id="kviz" data-tone="ink"><div class="wrap">
${tx("quiz", "Расчёт за минуту", "Посчитайте свой случай", "Четыре вопроса, как на консультации. Ответы уйдут в клинику сообщением, главный врач перезвонит с планом лечения.")}
<div class="qz rv" id="qz">
<div class="qz-bar" aria-hidden="true"><i id="qz-bar"></i></div>
<form class="qz-f" id="qz-f" novalidate>
${steps}
<div class="qz-s qz-r" data-s="${D.QUIZ.length}">
<span class="qz-k">Готово</span>
<p class="qz-h">Ваш расчёт</p>
<ul class="qz-sum" id="qz-sum"></ul>
<p class="qz-p">Ориентир по цене клиники: от <b>${rub(D.PRICES[0].price)}</b>, «под ключ» с протезом <b>${rub(D.PRICES[1].price)}</b>. Подарки: КТ и удаление зубов бесплатно, персональная скидка ${rub(80000)}.</p>
<label class="qz-in"><span>Как к вам обращаться</span><input type="text" id="qz-name" autocomplete="given-name" placeholder="Имя"></label>
${PROD ? `<label class="qz-in"><span>Телефон</span><input type="tel" id="qz-phone" autocomplete="tel" inputmode="tel" placeholder="+7 900 000-00-00" required></label>
${consentBox("qz-ok")}
<p class="lv-err" id="qz-err" role="alert"></p>
<div class="qz-go"><button type="button" class="btn btn-onyx" id="qz-sms">${ic("msg")}<span>Отправить расчёт в клинику</span></button><a class="btn btn-line" href="${tel}">${ic("phone")}<span>Позвонить</span></a></div>` : `<div class="qz-go"><a class="btn btn-onyx" id="qz-sms" href="${sms(SMS_HI)}">${ic("msg")}<span>Отправить расчёт в клинику</span></a><a class="btn btn-line" href="${tel}">${ic("phone")}<span>Позвонить</span></a></div>
<p class="qz-note">Сообщение откроется у вас в телефоне с готовым текстом, отправляете вы сами. На рабочем сайте расчёт придёт администратору в CRM и мессенджер.</p>`}
</div>
<div class="qz-nav"><button type="button" class="btn btn-ghost" id="qz-back" disabled>Назад</button><span class="qz-hint" id="qz-hint">Выберите ответ</span></div>
</form>
</div>
</div></section>`;
}

/* ── Врачи ────────────────────────────────────────────────────────── */
/* Фото врача: своё из макета, загруженное в админке (/uploads/) или буквы имени. */
const docPic = (d) => !d.img ? `<span class="dr-noph" aria-hidden="true">${String(d.name).split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}</span>`
  : d.img.startsWith("/uploads/") ? `<img src="${d.img}" alt="${esc(d.name)}" width="900" height="900" loading="lazy" decoding="async">` : pic(d.img, d.name, 900, 900);
function doctorsBlock() {
  return `<section class="docs" id="vrachi"><div class="wrap">
${tx("docs", "Врачи", "Кто будет вас лечить", "Имплантологи и ортопеды с опытом более 10 000 операций. Имплантация: основная специализация клиники.")}
<div class="dr-grid">
${D.DOCTORS.map((d, i) => `<article class="dr rv" style="--d:${i * 120}ms"><div class="dr-ph">${docPic(d)}</div><div class="dr-t"><span class="kick">${d.role}</span><h3>${d.name}</h3><ul>${d.facts.map((f) => `<li>${f}</li>`).join("")}</ul><p class="dr-q">«${d.quote}»</p></div></article>`).join("")}
</div>
</div></section>`;
}

/* ── Наши врачи: ряд врачей в полный рост, как выбор героя ─────────── */
/* Владелец, 16.11.2026: «Хиро секцию, где врачи стоят и на них можно нажать,
   откроются характеристики их как в мортал комбат… Когда нажимаешь на врача,
   он выходит из общей линии врачей, встает с одной стороны экрана, и
   открывается информация о враче, остальные при этом затемняются. При
   нажатии куда угодно врач разворачивается спиной и идет на свое место».
   Только рабочий сайт. Разметка работает и без скрипта (ряд с подписями);
   движение — app/site/team.js, вид — app/site/team.css. Характеристики —
   только то, что о враче написано: стаж (полоса по годам, 10 делений),
   направления — разделы услуг по специальности, образование и квалификация
   из админки. Своих чисел нет. */
const DIRS = [[/хирург/i, "khirurgiya"], [/хирург|имплант/i, "implantatsiya-zubov"], [/ортопед/i, "protezirovanie-zubov"], [/терапевт/i, "lechenie-zubov"], [/гигиен/i, "professionalnaya-gigiena"]];
const dirsOf = (d) => CAT.CATEGORIES.filter((k) => DIRS.some(([re, slug]) => slug === k.slug && re.test(plain(d.role))));
/* Стаж словами врача: «Стаж 6 лет», «более 1,5 лет» → 6, «более 1,5 лет». */
function yearsOf(d) {
  const m = /(более\s+|свыше\s+|больше\s+)?(\d+(?:[.,]\d+)?)\s*(год(?:а)?|лет)/i.exec(d.facts.map(plain).join(" "));
  return m ? { n: parseFloat(m[2].replace(",", ".")), t: `${m[1] ? "более " : ""}${m[2]} ${m[3]}` } : null;
}
/* Кадр шире или уже кадра врача лицом — по высоте тот же, по центру (ширина и сдвиг в % от него). */
const wide = (ar, fig) => { const k = ar / (fig.w / 1200); return Math.abs(k - 1) < 0.005 ? "" : ` style="width:${(k * 100).toFixed(2)}%;left:${((1 - k) * 50).toFixed(2)}%"`; };
/* Лента кадров движения врача: сетка c×r, кадр шире кадра врача (руки и ноги при шаге). */
const tape = (fig, k) => {
  const t = fig[k]; if (!t) return "";
  const q = t.tw / CAT.FIG_H / (fig.w / 1200);
  return `<span class="tm-w tm-${k}" data-src="${IMG}/tm-${fig.id}-${k}.webp" data-n="${t.n}" data-c="${t.c}" data-ms="${t.ms}"${t.go ? ` data-go="${t.go.join(",")}"` : ""} style="--c:${t.c};--r:${Math.ceil(t.n / t.c)};width:${(q * 100).toFixed(2)}%;left:${((1 - q) * 50).toFixed(2)}%"><img alt="" aria-hidden="true" decoding="async"></span>`;
};
const figOf = (d) => { const m = /^dr-([a-z-]+)$/.exec(d.img || ""); return m && CAT.FIGS[m[1]] ? { id: m[1], ...CAT.FIGS[m[1]] } : null; };
export function teamBlock({ page = false, crumbs = "" } = {}) {
  const t = page ? TX["pg-vrachi"] || {} : TX.docs || {};
  const def = { kick: "Врачи", h: "Наши врачи", p: "Нажмите на врача, чтобы посмотреть" };
  SEEN[page ? "pg-vrachi" : "docs"] = def;
  const kick = t.kick ?? def.kick, h = t.h ?? def.h, p = t.p ?? def.p, H = page ? "h1" : "h2";
  const list = D.DOCTORS.map((d, i) => {
    const fig = figOf(d), y = yearsOf(d), dirs = dirsOf(d), surname = plain(d.name).split(/\s+/)[0];
    const alt = esc(`${plain(d.name)}, ${plain(d.role).toLowerCase()}`);
    const body = fig
      ? `<img class="tm-f" src="${IMG}/tm-${fig.id}.webp" width="${fig.w}" height="1200" alt="${alt}" loading="lazy" decoding="async"><img class="tm-k" src="${IMG}/tm-${fig.id}-b.webp" width="${fig.bw}" height="1200" alt="" aria-hidden="true" loading="lazy" decoding="async"${wide(fig.bw / 1200, fig)}>${["wf", "wb", "t"].map((k) => tape(fig, k)).join("")}`
      : `<span class="tm-ph">${docPic(d)}</span>`;
    const other = d.facts.filter((f) => !y || !plain(f).includes(y.t.replace(/^более /, "")));
    const seg = y ? Math.max(1, Math.min(10, Math.round(y.n))) : 0;
    return {
      slot: `<li class="tm-s${fig ? "" : " tm-nofig"}" style="--k:${fig ? fig.k : 0.9};--ar:${fig ? fig.w : 600}/1200;--d:${i * 90}ms"><button type="button" class="tm-d" data-i="${i}" data-sn="${esc(surname)}" aria-expanded="false" aria-controls="tm-i${i}"><span class="tm-g"><span class="tm-z">${body}</span></span><span class="tm-c"><b>${d.short || d.name}</b><small>${d.role}</small></span></button></li>`,
      info: `<div class="tm-i" id="tm-i${i}" role="region" aria-label="${esc(plain(d.name))}" hidden><span class="kick">${d.role}</span><h3 tabindex="-1">${d.name}</h3>
${y ? `<div class="tm-st"><span class="tm-l">Стаж</span><b>${y.t}</b><span class="tm-bar" role="img" aria-label="Стаж ${y.t}">${Array.from({ length: 10 }, (_, j) => `<i${j < seg ? ' class="on"' : ""} style="--j:${j}"></i>`).join("")}</span></div>` : ""}
${other.length ? `<ul class="tm-x">${other.map((f) => `<li>${f}</li>`).join("")}</ul>` : ""}
${dirs.length ? `<div class="tm-dr"><span class="tm-l">Направления</span><p>${dirs.map((k) => `<a href="/${k.slug}">${k.t}</a>`).join("")}</p></div>` : ""}
${d.edu ? `<p class="tm-e"><span class="tm-l">Образование</span>${String(d.edu).split("\n").join("<br>")}</p>` : ""}${d.cert ? `<p class="tm-e"><span class="tm-l">Квалификация</span>${String(d.cert).split("\n").join("<br>")}</p>` : ""}
<div class="tm-b"><a class="btn btn-onyx" href="#zapis" data-book${dirs[0] ? ` data-svc="${dirs[0].nav}"` : ""} data-doc="${esc(plain(d.name))}">${ic("msg")}<span>Записаться к врачу</span></a>${page ? "" : `<a class="btn btn-ghost" href="/vrachi">Все о врачах</a>`}</div>
<p class="tm-esc">Нажмите в любом месте, чтобы врач вернулся в строй</p></div>`,
    };
  });
  return `<section class="tm" id="vrachi" data-tone="ink" data-tm><div class="wrap tm-h">${crumbs}<span class="kick">${kick}</span><${H}>${h}</${H}>${p ? `<p class="tm-tip">${ic("arrow")}<span>${p}</span></p>` : ""}</div>
<div class="tm-sg" style="--n:${D.DOCTORS.length}"><span class="tm-gh" aria-hidden="true"></span><span class="tm-fl" aria-hidden="true"></span>
<ul class="tm-r">${list.map((x) => x.slot).join("")}</ul>
${list.map((x) => x.info).join("\n")}
</div></section>`;
}

/* ── Гарантии и технологии ────────────────────────────────────────── */
function trustBlock() {
  const tic = ["wave", "drop", "moon", "lab"];
  return `<section class="trust" id="garantii" data-tone="ink"><div class="wrap">
<div class="tr-nums">${D.TRUST.map((t, i) => `<div class="tn rv" style="--d:${i * 80}ms"><b>${t.n}</b><span>${t.t}</span></div>`).join("")}</div>
${tx("trust", "Гарантии", "Тройная гарантия в договоре", "На каждый этап имплантации. Так написано в договоре, который вы подписываете до операции.")}
<div class="gu-grid">
<picture class="gu-ph rv" aria-hidden="true"><source media="(max-aspect-ratio: 4/5)" srcset="${IMG}/bg-titan-9.webp"><img src="${IMG}/bg-titan-16.webp" alt="" width="1600" height="900" loading="lazy" decoding="async"></picture>
<ol class="gu">${D.GUARANTEE.map((g, i) => `<li class="rv" style="--d:${i * 90}ms">${ic("shield")}<b>${g.t}</b><span>${g.d}</span></li>`).join("")}</ol>
</div>
${tx("tech", "Как проходит операция", "Без боли и стресса", "", "sh-sm")}
<div class="te-grid">${D.TECH.map((t, i) => `<article class="te rv" style="--d:${i * 80}ms">${ic(tic[i])}<h3>${t.t}</h3><p>${t.d}</p></article>`).join("")}</div>
<figure class="lab rv"><picture><source media="(max-aspect-ratio: 4/5)" srcset="${IMG}/bg-lab-9.webp"><img src="${IMG}/bg-lab-16.webp" alt="Зубной техник в лаборатории клиники собирает протез" width="1600" height="900" loading="lazy" decoding="async"></picture><figcaption><span class="kick">Своя лаборатория</span><b>Протез делают в клинике, а не на стороне</b><span>Усиленный протез из премиальных материалов, без искусственной десны. Гарантия на протез на 2 года больше, чем предписано Минздравом.</span></figcaption></figure>
</div></section>`;
}

/* ── Привилегии ───────────────────────────────────────────────────── */
function perksBlock() {
  const pic2 = ["car", "user", "doc", "card"];
  return `<section class="perks" id="privilegii"><div class="wrap">
${tx("perks", "Сервис", "Что клиника берёт на себя")}
<div class="pk-grid">${D.PERKS.map((p, i) => `<article class="pk rv" style="--d:${i * 80}ms">${ic(pic2[i])}<b>${p.t}</b><span>${p.d}</span></article>`).join("")}</div>
</div></section>`;
}

/* ── Отзывы ───────────────────────────────────────────────────────── */
function reviewsBlock() {
  return `<section class="rev" id="otzyvy"><div class="wrap">
<div class="rv-top">${tx("reviews", "Отзывы", "Что пишут пациенты")}<div class="rv-rate rv"><b>${D.RATING.value}</b><span>на ${D.RATING.where}</span><small>${D.RATING.count} отзывов на народных порталах · ${D.RATING.rec}% рекомендуют клинику родным</small></div></div>
</div>
<div class="rv-row" tabindex="0" aria-label="Отзывы пациентов, листаются вбок">${D.REVIEWS.map((r, i) => `<blockquote class="rq rv" style="--d:${(i % 4) * 70}ms"><span class="rq-st" aria-label="5 из 5">${"★".repeat(5)}</span><p>${r.t}</p><footer><b>${r.who}</b><span>${r.when} · ${r.src}</span></footer></blockquote>`).join("")}</div>
</section>`;
}

/* ── Интерьер: их фото ────────────────────────────────────────────── */
function roomsBlock() {
  /* Клиника поменяла фото в админке: своя сетка без мозаики под пять кадров. */
  const free = D.ROOMS !== DATA.ROOMS, src = (r) => (r.img.charAt(0) === "/" ? r.img : `${IMG}/${r.img}.webp`);
  const figs = free
    ? D.ROOMS.map((r, i) => `<figure class="rm rv" style="--d:${(i % 6) * 70}ms"><img src="${src(r)}" alt="${r.alt}" loading="lazy" decoding="async"></figure>`)
    : D.ROOMS.map((r, i) => `<figure class="rm rm-${i} rv" style="--d:${i * 70}ms">${pic(r.img, r.alt, r.w, r.h)}</figure>`);
  return `<section class="rooms" id="klinika" data-tone="ink"><div class="wrap">
${tx("rooms", "Клиника", `Белинского, 63`, `${B.near}. ${B.parking}.`)}
<div class="rm-grid${free ? " rm-free" : ""}">${figs.join("")}</div>
${PROD ? "" : `<p class="src">Фото с сайта клиники.</p>`}
</div></section>`;
}

/* ── Сейчас и станет ──────────────────────────────────────────────── */
function nowBlock() {
  return `<section class="now" id="seychas"><div class="wrap">
${head(`<span class="ours">Разбор DevUz Studio</span>`, "Сейчас и станет", "Открыли ваш сайт с телефона, как пациент, который ищет «все зубы за один день». Вот что он видит сейчас и что увидит на новом.")}
<ol class="nw">${D.NOW.map((n, i) => `<li class="rv" style="--d:${(i % 3) * 80}ms"><span class="nw-i">${String(i + 1).padStart(2, "0")}</span><div><p class="nw-was"><span>Сейчас</span>${n.was}</p><p class="nw-new"><span>Станет</span>${n.now}</p></div></li>`).join("")}</ol>
</div></section>`;
}

/* ── Что взяли у лучших ───────────────────────────────────────────── */
function bestBlock() {
  return `<section class="best" id="luchshie" data-tone="ink"><div class="wrap">
${head(`<span class="ours">Разбор DevUz Studio</span>`, "Чего нет у клиник Томска", "Приёмы с лучших сайтов клиник и техники в мире. Посмотрели конкурентов в Томске, Новосибирске и Москве: так не делает никто.")}
<div class="bs-grid">${D.BEST.map((b, i) => `<article class="bs rv" style="--d:${(i % 3) * 80}ms"><span class="bs-i">${String(i + 1).padStart(2, "0")}</span><h3>${b.t}</h3><p>${b.d}</p><small>${b.who}</small></article>`).join("")}</div>
</div></section>`;
}

/* ── Вопросы ──────────────────────────────────────────────────────── */
function faqBlock() {
  return `<section class="faq" id="voprosy"><div class="wrap">
<div class="fq-l">${tx("faq", "Вопросы", "Что спрашивают про All-on-6", "Вопросы, которые пациенты задают в поиске. Ответы по фактам клиники; всё, что зависит от вашей челюсти, врач скажет после КТ.")}<a class="btn btn-line" href="${tel}">${ic("phone")}<span>Спросить врача</span></a></div>
<div class="fq" id="fq">${D.FAQ.map((f, i) => `<div class="fq-i rv" style="--d:${(i % 4) * 50}ms"><h3><button type="button" class="fq-q" aria-expanded="false" aria-controls="fq-${i}" id="fq-b${i}"><span>${f.q}</span><i class="fq-x" aria-hidden="true"></i></button></h3><div class="fq-a" id="fq-${i}" role="region" aria-labelledby="fq-b${i}"><div><p>${f.a}</p></div></div></div>`).join("")}</div>
</div></section>`;
}

/* ── Как доехать ──────────────────────────────────────────────────── */
function contactsBlock() {
  return `<section class="cont" id="kontakty" data-tone="ink">
<picture class="cont-bg" aria-hidden="true"><source media="(max-aspect-ratio: 4/5)" srcset="${IMG}/bg-street-9.webp"><img src="${IMG}/bg-street-16.webp" alt="" width="1600" height="900" loading="lazy" decoding="async"></picture>
<div class="wrap">
${tx("contacts", "Ждём на консультации", "Как доехать", `${B.near}.`)}
<div class="ct-grid">
<div class="ct rv"><ul>
<li>${ic("pin")}<span><b>${B.addr}</b><a href="${B.route}">Построить маршрут в Яндекс Картах</a></span></li>
<li>${ic("clock")}<span><b>${B.hours}</b>без выходных</span></li>
<li>${ic("park")}<span><b>Своя парковка</b>свободные места есть всегда</span></li>
<li>${ic("phone")}<span><b><a href="${tel}">${B.phone}</a></b>звонок в одно нажатие</span></li>${msgLinks().map(([u, n, k]) => `\n<li>${ic(k)}<span><b><a href="${u}" rel="noopener">${n}</a></b>написать в мессенджер</span></li>`).join("")}
</ul>
<div class="ct-b"><a class="btn btn-onyx" href="#zapis" data-book>${ic("msg")}<span>Записаться</span></a><a class="btn btn-line" href="${B.map}">${ic("pin")}<span>Открыть карту</span></a></div></div>
<div class="ct-plan rv"><span class="kick">Уже были у других врачей?</span><b>План лечения от главного врача</b><p>Ортопед, который специализируется на All-on-6, посмотрит ваши снимки и скажет, что можно сделать.</p><a class="btn btn-line" ${PROD ? `href="#zapis" data-book` : `href="${sms("Здравствуйте! Уже был(а) на приёме в другой клинике, хочу получить план лечения от главного врача.")}"`}>${ic("msg")}<span>Получить план</span></a></div>
</div>
</div></section>`;
}

/* ── Стоимость (предложение DevUz) ───────────────────────────────── */
function offerBlock() {
  const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}"><span class="sw" aria-hidden="true"></span><span class="kit-t2"><b>${a.ru.t}${a.star ? `<em class="star">берут первым</em>` : ""}${a.new ? `<em class="nw-t">нет у клиник Томска</em>` : ""}</b><small>${a.ru.e}</small></span><span class="kit-pr">+${usd(a.price)}</span></label>`;
  return `<section class="offer" id="stoimost"><div class="wrap">
${head(`<span class="ours">Предложение DevUz Studio</span>`, "Стоимость", `Сайт клиники без допов: ${usd(BASE.promo)} вместо ${usd(BASE.price)}, если начинаем в течение 48 часов. Админка с записью и напоминаниями в Telegram, кино на первом экране, сцены по прокрутке и квиз идут допами: включайте тумблерами, итог пересчитается. Всё вместе: ${usd(ALL)}.`)}
<p class="kit-demo"><a class="btn btn-line btn-sm" href="__PROTO_BASE__/panel">${ic("arrow")}<span>Открыть админку клиники: заявки, расписание, amoCRM</span></a></p>
<div class="kit" id="konstruktor">
<div class="kit-l">
<div class="kit-base"><div><span class="kb-tag">Входит всегда</span><b>${BASE.ru.t}</b><p>${BASE.ru.d}</p><p class="kb-w">Срок: ${BASE.weeks[0]}-${BASE.weeks[1]} недель</p></div><div class="kb-p"><s>${usd(BASE.price)}</s><b>${usd(BASE.promo)}</b><small>48 часов</small></div></div>
<h3 class="kit-g">Допы: включайте то, что нужно клинике</h3>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side">
<div class="kit-total" id="kit-total">
<div class="timer" id="timer"><span>Цена ${usd(BASE.promo)} действует<small>48 часов с первого открытия макета</small></span><b id="tm">48:00:00</b></div>
<div class="kt-line"><span>Сайт</span><span><s>${usd(BASE.price)}</s> ${usd(BASE.promo)}</span></div>
<div class="kt-line"><span>Допы · <span id="kit-cnt">0</span></span><span id="kit-add">0 ${CUR}</span></div>
<div class="kt-sum"><small>Итого</small><b id="kit-sum">${usd(BASE.promo)}</b><small>со всеми допами ${usd(ALL)}</small></div>
<button type="button" class="btn btn-line" id="kit-all">Включить всё</button>
<a class="btn btn-onyx" href="https://t.me/Devuz_studio_bot?start=syanie">${ic("tg")}<span>Обсудить с DevUz Studio</span></a>
<button type="button" class="copy" id="kit-copy">${ic("copy")}<span>Скопировать состав</span></button>
</div>
<p class="src">Цены в рублях. Тарифы CRM, телефонии, SMS и хостинга клиника оплачивает сама.</p>
</div>
</div>
</div></section>`;
}

/* ── Запись в два нажатия: шторка ─────────────────────────────────── */
/* Услуги для записи: консультация, варианты All-on-6 и перечень клиники из админки. */
const services = () => [...new Set(["Консультация и КТ", ...D.PRICES.map((p) => `All-on-6: ${p.t.replace(/^Методика All-on-6$/, "методика").toLowerCase()}`), ...CAT.CATEGORIES.map((k) => k.nav)])].slice(0, 12);
function bookSheet() {
  const days = ["Сегодня", "Завтра", "На этой неделе"], parts = ["Утром", "Днём", "Вечером"];
  return `<div class="sheet" id="zapis" role="dialog" aria-modal="true" aria-labelledby="bk-h" hidden>
<div class="sh-in">
<button type="button" class="sh-x" data-close aria-label="Закрыть">${ic("x")}</button>
<span class="kick">Бесплатная консультация</span>
${PROD ? `<p class="bk-l">Услуга</p>
<div class="bk-g" role="radiogroup" aria-label="Услуга">${services().map((t, i) => `<button type="button" class="chip" data-svc="${t}" aria-pressed="${i === 0}">${t}</button>`).join("")}</div>
<p class="bk-h bk-h2" id="bk-h">Когда вам удобно?</p>` : `<p class="bk-h" id="bk-h">Когда вам удобно?</p>`}
<div class="bk-g" role="radiogroup" aria-label="День">${days.map((d, i) => `<button type="button" class="chip" data-day="${d}" aria-pressed="${i === 1}">${d}</button>`).join("")}</div>
<div class="bk-g" role="radiogroup" aria-label="Время">${parts.map((d, i) => `<button type="button" class="chip" data-part="${d}" aria-pressed="${i === 2}">${d}</button>`).join("")}</div>
${PROD ? `<div class="bk-f"><label class="qz-in"><span>Имя</span><input type="text" id="bk-name" autocomplete="given-name" placeholder="Как к вам обращаться"></label><label class="qz-in"><span>Телефон</span><input type="tel" id="bk-phone" autocomplete="tel" inputmode="tel" placeholder="+7 900 000-00-00" required></label></div>
${consentBox("bk-ok")}
<p class="lv-err" id="bk-err" role="alert"></p>
<button type="button" class="btn btn-onyx bk-go" id="bk-go">${ic("msg")}<span>Записаться: завтра вечером</span></button>
<a class="btn btn-line" href="${tel}">${ic("phone")}<span>Или позвоните: ${B.phone}</span></a>
<p class="qz-note">Администратор перезвонит и подтвердит время. Клиника работает ${B.hoursShort}.</p>` : `<a class="btn btn-onyx bk-go" id="bk-go" href="${sms(SMS_HI)}">${ic("msg")}<span>Записаться: завтра вечером</span></a>
<a class="btn btn-line" href="${tel}">${ic("phone")}<span>Или позвоните: ${B.phone}</span></a>
<p class="qz-note">Сообщение откроется с готовым текстом, отправляете вы. Клиника работает ${B.hoursShort}.</p>`}
</div></div>`;
}

function ld() {
  if (PROD) return liveLd();
  return {
    "@context": "https://schema.org", "@type": ["Dentist", "MedicalClinic"], name: B.name, legalName: B.legal, url: B.site, telephone: B.phoneRaw,
    address: { "@type": "PostalAddress", streetAddress: B.street, addressLocality: B.city, addressCountry: "RU" },
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "09:00", closes: "21:00" }],
    medicalSpecialty: "Dentistry", availableService: { "@type": "MedicalProcedure", name: "All-on-6: все зубы на 6 имплантатах" },
    priceRange: `${rub(D.PRICES[0].price)}-${rub(D.PRICES[1].price)}`,
  };
}

/* Разметка рабочего сайта для Яндекса и Google: клиника с адресом сайта,
   часами, врачами и ценами из прайса, сам сайт и вопросы с ответами. Все
   числа и слова — те же, что на странице; рейтинг с Яндекс Карт сюда не
   идёт: Google не принимает в разметке оценки с чужих площадок. */
function liveLd() {
  const U = "__SITE_URL__", hh = (h) => String(h).padStart(2, "0") + ":00";
  const photos = ["film-16.webp", "p-rec.webp", "p-cab.webp", "p-cor.webp", "p-xray.webp"].map((f) => `${U}${IMG}/${f}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Dentist", "MedicalClinic"], "@id": `${U}/#clinic`, name: plain(B.name), legalName: plain(B.legal), description: plain(B.what) + ": все зубы на 6 имплантатах за один день, All-on-6.",
        url: `${U}/`, telephone: B.phoneRaw, image: photos, logo: `${U}${IMG}/icon-192.png`,
        address: { "@type": "PostalAddress", streetAddress: plain(B.street), addressLocality: plain(B.city), addressRegion: "Томская область", addressCountry: "RU" },
        hasMap: B.map, areaServed: { "@type": "City", name: plain(B.city) },
        openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: hh(B.open), closes: hh(B.close) }],
        medicalSpecialty: "Dentistry", isAcceptingNewPatients: true, currenciesAccepted: "RUB",
        priceRange: `${rub(D.PRICES[0].price)}-${rub(D.PRICES[D.PRICES.length - 1].price)}`,
        /* Скрытый в админке блок — и из разметки: поисковики сверяют её со страницей. */
        ...(shown("price") ? { makesOffer: D.PRICES.map((p) => ({ "@type": "Offer", name: plain(p.t), description: plain(p.d), price: p.price, priceCurrency: "RUB", itemOffered: { "@type": "Service", name: plain(p.t), description: plain(p.d) } })) } : {}),
        ...(shown("docs") ? { employee: D.DOCTORS.map((d) => ({ "@type": "Person", name: plain(d.name), jobTitle: plain(d.role) })) } : {}),
      },
      { "@type": "WebSite", "@id": `${U}/#site`, url: `${U}/`, name: plain(B.name), inLanguage: "ru-RU", publisher: { "@id": `${U}/#clinic` } },
      ...(shown("faq") ? [{ "@type": "FAQPage", "@id": `${U}/#voprosy`, mainEntity: D.FAQ.map((f) => ({ "@type": "Question", name: plain(f.q), acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })) }] : []),
    ],
  };
}

function siteData() {
  return {
    img: IMG, frames: MEDIA, chapters: CHS.map((c) => ({ id: c.id, a: c.a, b: c.b })), phone: B.phoneRaw, smsHi: SMS_HI,
    quiz: D.QUIZ.map((q) => q.q),
    /* Чат на сайте (chat.js): отвечает только фактами клиники, без модели. */
    chat: { faq: D.FAQ, prices: D.PRICES.map((p) => ({ t: p.t, d: p.d, p: p.price })), gifts: D.GIFTS, benefit: D.BENEFIT, guar: D.GUARANTEE.map((g) => g.t + ": " + g.d.toLowerCase()), docs: D.DOCTORS.map((x) => ({ n: x.name, r: x.role, f: x.facts[0] })), phone: B.phone, addr: B.addr, near: B.near, hours: B.hoursShort, parking: B.parking, open: B.open, close: B.close, warn: B.warn, perks: D.PERKS.map((x) => x.t + ": " + x.d.toLowerCase()) },
    ...(PROD ? { live: true, pdv: CAT.PD_VERSION, metrika: LIVE.seo?.metrika || "", cats: Object.fromEntries(CAT.CATEGORIES.map((k) => [k.slug, k.nav])) } : {}),
    offer: PROD ? undefined : { cur: CUR, items: ADDONS.map((a) => ({ id: a.id, t: a.ru.t, p: a.price })), base: BASE.promo, baseName: BASE.ru.t, hours: OFFER_HOURS, head: "Сайт клиники «Сияние Севера», состав:", totalW: "Итого", copied: "Скопировано", ended: "Акция закончилась, цена обычная" },
  };
}

/* ── Блоки страницы из админки клиники (раздел «Сайт» → «Блоки страницы»):
   порядок, скрытые и свои блоки. LAYOUT — список из site-content.mjs, все
   строки в нём уже экранированы. Без LAYOUT (макет, сайт без правок) —
   прежний порядок. Первый экран с пролётом всегда первым. ─────────────── */
const BLOCK_FN = { vs: vsBlock, price: priceBlock, uslugi: servicesBlock, quiz: quizBlock, docs: () => teamBlock(), trust: trustBlock, perks: perksBlock, reviews: reviewsBlock, rooms: roomsBlock, faq: faqBlock, contacts: contactsBlock };
const BLOCK_AT = { vs: "all-on-6", price: "ceny", uslugi: "uslugi-kliniki", quiz: "kviz", docs: "vrachi", trust: "garantii", perks: "privilegii", reviews: "otzyvy", rooms: "klinika", faq: "voprosy", contacts: "kontakty" };
const BLOCK_NAV = { vs: "All-on-6", price: "Цены", docs: "Врачи", faq: "Вопросы", contacts: "Контакты" };
const shown = (id) => !LAYOUT || LAYOUT.some((b) => b.id === id && b.on);
/* Текст своего блока: строка — абзац, строки с «- » подряд — список. */
function richText(t) {
  let out = "", list = [];
  const flush = () => { if (list.length) out += `<ul>${list.map((l) => `<li>${l}</li>`).join("")}</ul>`; list = []; };
  for (const line of String(t || "").split("\n")) {
    const m = /^\s*[-•*]\s+(.+)$/.exec(line);
    if (m) list.push(m[1]);
    else if (line.trim()) { flush(); out += `<p>${line}</p>`; }
  }
  flush();
  return out;
}
function customBlock(b) {
  const ph = b.photos || [], lay = ph.length ? b.layout : "text";
  const fig = (p, cls = "") => `<figure class="cb-ph rv${cls}"><img src="${p.img}" alt="${p.alt}" loading="lazy" decoding="async"></figure>`;
  const top = `<div class="sh">${b.kick ? `<span class="kick">${b.kick}</span>` : ""}<h2>${b.h}</h2></div>`;
  const text = `<div class="cb-t rv">${richText(b.text)}${b.book ? `<a class="btn btn-onyx" href="#zapis" data-book>${ic("msg")}<span>Записаться</span></a>` : ""}</div>`;
  const inner = lay === "side"
    ? `<div class="cb-row"><div class="cb-c">${top}${text}</div>${fig(ph[0], " cb-main")}</div>${ph.length > 1 ? `<div class="cb-pics">${ph.slice(1).map((p) => fig(p)).join("")}</div>` : ""}`
    : lay === "grid" ? `${top}${text}<div class="cb-pics">${ph.map((p) => fig(p)).join("")}</div>` : `${top}${text}`;
  return `<section class="cb cb-l-${lay}" id="b-${b.id}"${b.dark ? ' data-tone="ink"' : ""}><div class="wrap">${inner}</div></section>`;
}
function mainBlocks() {
  if (!PROD) return [storyBlock(), vsBlock(), priceBlock(), quizBlock(), doctorsBlock(), trustBlock(), perksBlock(), reviewsBlock(), roomsBlock(), nowBlock(), bestBlock(), faqBlock(), contactsBlock(), offerBlock()];
  if (!LAYOUT) return [storyBlock(), vsBlock(), priceBlock(), servicesBlock(), quizBlock(), teamBlock(), trustBlock(), perksBlock(), reviewsBlock(), roomsBlock(), faqBlock(), contactsBlock()];
  return [storyBlock(), ...LAYOUT.filter((b) => b.on).map((b) => (b.custom ? customBlock(b) : BLOCK_FN[b.id]()))];
}
/* Меню шапки идёт за блоками: скрытый блок пропадает из меню, свой блок
   с «пунктом в меню» встаёт туда в порядке страницы. */
function navItems() {
  if (!LAYOUT) return [["#all-on-6", "All-on-6"], ["#ceny", "Цены"], ["#vrachi", "Врачи"], ["#voprosy", "Вопросы"], ["#kontakty", "Контакты"]];
  return LAYOUT.filter((b) => b.on && (b.custom ? b.menu : BLOCK_NAV[b.id])).map((b) => (b.custom ? [`#b-${b.id}`, b.menu] : [`#${BLOCK_AT[b.id]}`, BLOCK_NAV[b.id]])).slice(0, 7);
}

function sitePage() {
  /* Запрос главной — по Вордстату, Томск (CAT.SEO.index): «all on 4» ищут чаще, чем «all on 6». */
  const seoT = (t) => t.replace(/\{name\}/g, plain(B.name)).replace(/\{street\}/g, plain(B.street));
  if (PROD) return pageShell({ key: "index", title: seoT(CAT.SEO.index.title), desc: seoT(CAT.SEO.index.desc), path: "/", main: mainBlocks().join("\n"), ld: ld(), home: true });
  const nav = navItems();
  return `<!doctype html>
<html lang="ru">
<head>
${headTags(`Все зубы на 6 имплантатах за 1 день · «Сияние Севера», Томск${PROD ? "" : " · макет DevUz Studio"}`, "Все зубы на 6 имплантатах за один день в Томске: All-on-6 в центре имплантации «Сияние Севера», ул. Белинского, 63. Цены, рассрочка 0%, врачи, гарантии, расчёт за минуту.")}
<link rel="preload" as="image" href="${IMG}/film-9.webp" media="(max-aspect-ratio: 4/5)">
<link rel="preload" as="image" href="${IMG}/film-16.webp" media="(min-aspect-ratio: 4/5)">
<script>(function(){var r=document.documentElement;r.classList.add('js');var calm=false;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)calm=true}catch(e){}try{var c=navigator.connection;if(c&&c.saveData)calm=true}catch(e){}if(calm)r.classList.add('calm');})()</script>
<script type="application/ld+json">${json(ld())}</script>
@@S@@
</head>
<body class="site">
${PROD ? "" : dzIntroSolo("ru")}
${sprite()}
<a class="skip" href="#main">К содержанию</a>
<header class="top" id="top"><div class="wrap">
<a class="logo" href="${PROD ? "/" : BASEP}" aria-label="${B.name}, на главную">${logo()}</a>
<nav class="nav" aria-label="Разделы">${nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
<div class="top-r"><a class="top-ph" href="${tel}">${ic("phone")}<span>${B.phone}</span></a><a class="btn btn-sm btn-onyx" href="#zapis" data-book>Записаться</a></div>
</div></header>
<main id="main">
${mainBlocks().join("\n")}
</main>
<div class="warn-band" role="note"><div class="wrap"><p class="warn">${B.warn.toUpperCase()}</p><p class="lic">${B.legal} · ${B.license}</p></div></div>
<footer class="foot"><div class="wrap">
<div class="cols">
<div>${logo("f-logo")}<p class="f-d">${B.what}. ${B.addr}. ${B.hours}.</p><ul class="f-c"><li>${ic("phone")}<a href="${tel}">${B.phone}</a></li><li>${ic("pin")}<a href="${B.route}">Маршрут в Яндекс Картах</a></li>${msgLinks().map(([u, n, k]) => `<li>${ic(k)}<a href="${u}" rel="noopener">${n}</a></li>`).join("")}</ul></div>
${PROD ? "" : `<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=syanie">Telegram</a></li></ul></div>
<div><b>Данные макета</b><ul><li>Цены, врачи, гарантии, отзывы, адрес, часы, лицензия: ${B.site.replace("https://", "")}</li><li>Пролёт по клинике и сцены лечения сняты нейросетью по фото клиники</li><li>Квиз и запись открывают сообщение в клинику, ничего не уходит нам</li><li><a href="__PROTO_BASE__/panel">Админка клиники (показ)</a></li></ul></div>`}
</div>
${PROD ? `<div class="rights"><span>© ${new Date().getFullYear()} ${B.legal}. Сайт носит информационный характер и не является публичной офертой.</span><a href="/privacy">Обработка персональных данных</a></div>` : `<div class="rights"><span>Это макет: так может выглядеть сайт «${B.name}». Сайт носит информационный характер и не является публичной офертой.</span><a href="${TERMS}">Условия использования макета</a></div>`}
</div></footer>
<div class="dock" id="dock"><a class="btn btn-onyx" href="#zapis" data-book>${ic("msg")}<span>Записаться</span></a><a class="btn btn-call" href="${tel}" aria-label="Позвонить в клинику">${ic("phone")}</a></div>
${bookSheet()}${PROD ? `\n<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="lv-hp">` : ""}
<script type="application/json" id="sy-site">${json(siteData())}</script>
<script src="${IMG}/gsap.min.js"></script>
<script src="${IMG}/ScrollTrigger.min.js"></script>
@@J@@
</body>
</html>`;
}

/* ── Рабочий сайт: каркас страницы ─────────────────────────────────── */
/* Меню рабочего сайта — страницы (владелец, 16.11.2026: «Разведи на несколько
   страниц»). Свой блок клиники с «пунктом в меню» встаёт туда ссылкой на блок
   главной. Разделы услуг подсвечивают «Услуги». */
const PAGE_NAV = [["/", "All-on-6", "index"], ["/uslugi", "Услуги", "uslugi"], ["/ceny", "Цены", "ceny"], ["/vrachi", "Врачи", "vrachi"], ["/akcii", "Акции", "akcii"], ["/o-klinike", "О клинике", "o-klinike"], ["/kontakty", "Контакты", "kontakty"]];
function pageNav(key) {
  const act = CAT.CATEGORIES.some((k) => k.slug === key) ? "uslugi" : key;
  const own = (LAYOUT || []).filter((b) => b.on && b.custom && b.menu).map((b) => [`/#b-${b.id}`, b.menu, ""]);
  return [...PAGE_NAV, ...own].slice(0, 9).map(([u, n, k]) => `<a href="${u}"${k && k === act ? ' aria-current="page"' : ""}>${n}</a>`).join("");
}
/* До отрисовки: js, «меньше движения» и версия для слабовидящих из памяти
   браузера. Версия для слабовидящих — та же «спокойная» страница: без
   пролёта, видео и сцен. */
const HEAD_JS = `<script>(function(){var r=document.documentElement;r.classList.add('js');var calm=false;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)calm=true}catch(e){}try{var c=navigator.connection;if(c&&c.saveData)calm=true}catch(e){}try{var v=JSON.parse(localStorage.getItem('sy-vi')||'null');if(v&&v.on){r.classList.add('vi','vi-f'+(v.f||2),'vi-c'+(v.c||1));if(v.i===0)r.classList.add('vi-noimg');if(v.s)r.classList.add('vi-sp');calm=true}}catch(e){}if(calm)r.classList.add('calm');})()</script>`;
/* Версия для слабовидящих (ГОСТ Р 52872-2019): размер шрифта, три цветовые
   схемы, картинки, интервал. Панель видна, только когда версия включена. */
const VI_BAR = `<div class="vi-bar" id="vi-bar" role="region" aria-label="Настройки версии для слабовидящих"><div class="wrap">
<div class="vi-g" role="group" aria-label="Размер шрифта"><span>Шрифт</span><button type="button" data-vi="f1" aria-label="Обычный шрифт">А</button><button type="button" data-vi="f2" aria-label="Крупный шрифт">А+</button><button type="button" data-vi="f3" aria-label="Очень крупный шрифт">А++</button></div>
<div class="vi-g" role="group" aria-label="Цвета"><span>Цвета</span><button type="button" data-vi="c1" class="vi-sw vi-sw1" aria-label="Чёрным по белому">Ц</button><button type="button" data-vi="c2" class="vi-sw vi-sw2" aria-label="Белым по чёрному">Ц</button><button type="button" data-vi="c3" class="vi-sw vi-sw3" aria-label="Тёмно-синим по голубому">Ц</button></div>
<div class="vi-g" role="group" aria-label="Изображения"><span>Картинки</span><button type="button" data-vi="i1">Показать</button><button type="button" data-vi="i0">Скрыть</button></div>
<div class="vi-g" role="group" aria-label="Интервал между буквами"><span>Интервал</span><button type="button" data-vi="s0">Обычный</button><button type="button" data-vi="s1">Большой</button></div>
<button type="button" class="vi-off" data-vi="off">Обычная версия сайта</button>
</div></div>`;

/** Данные для pages.mjs: текущая сборка (правки клиники уже в D и B). */
function pageCtx() {
  return {
    B, D, ORG: { ...CAT.ORG, ...(D.ORG || {}) }, AUTH: D.AUTHORITIES || CAT.AUTHORITIES, DOCS: D.DOCS || [], CATS: CAT.CATEGORIES, LIST: D.CATALOG || CAT.SERVICES,
    PD_VERSION: CAT.PD_VERSION, IMG, tel, ic, esc, plain, rub, msgLinks, docPic, team: teamBlock, dirsOf, SEO: CAT.SEO, metrika: LIVE.seo?.metrika || "", site: "__SITE_URL__",
    /* Тексты первого экрана страниц правятся в админке («Тексты разделов»), как разделы главной. */
    txt: (key, kick, h, p = "") => { SEEN[key] = { kick, h, p }; const t = TX[key] || {}; return { kick: t.kick ?? kick, h: t.h ?? h, p: t.p ?? p }; },
    blocks: { price: priceBlock, trust: trustBlock, perks: perksBlock, rooms: roomsBlock },
  };
}

/** Страница рабочего сайта: шапка с меню, содержимое, подвал с документами, запись и чат. */
function pageShell({ key, title, desc, path, main, ld: graph, home = false }) {
  const O = { ...CAT.ORG, ...(D.ORG || {}) };
  const cats = CAT.CATEGORIES.map((k) => `<li><a href="/${k.slug}">${k.t}</a></li>`).join("");
  const ids = [O.inn && `ИНН ${O.inn}`, O.ogrn && `ОГРН ${O.ogrn}`].filter(Boolean).join(", ");
  return `<!doctype html>
<html lang="ru">
<head>
${headTags(title, desc, path)}
${home ? `<link rel="preload" as="image" href="${IMG}/film-9.webp" media="(max-aspect-ratio: 4/5)">
<link rel="preload" as="image" href="${IMG}/film-16.webp" media="(min-aspect-ratio: 4/5)">
` : ""}${HEAD_JS}
${graph ? `<script type="application/ld+json">${json(graph)}</script>\n` : ""}@@S@@
</head>
<body class="site${home ? "" : " sub"}" data-page="${key}">
${VI_BAR}
${sprite()}
<a class="skip" href="#main">К содержанию</a>
<header class="top" id="top"><div class="wrap">
<a class="logo" href="/" aria-label="${B.name}, на главную">${logo()}</a>
<nav class="nav" aria-label="Разделы сайта">${pageNav(key)}</nav>
<div class="top-r"><button type="button" class="vi-btn" data-vi="on" aria-label="Версия для слабовидящих">${ic("eye")}</button><a class="top-ph" href="${tel}">${ic("phone")}<span>${B.phone}</span></a><a class="btn btn-sm btn-onyx" href="#zapis" data-book>Записаться</a><button type="button" class="burger" id="burger" aria-expanded="false" aria-controls="mnav" aria-label="Меню">${ic("menu")}</button></div>
</div></header>
<div class="mnav" id="mnav" hidden><div class="mnav-in">
<button type="button" class="sh-x" data-mclose aria-label="Закрыть меню">${ic("x")}</button>
<nav aria-label="Меню"><ul class="mnav-l">${PAGE_NAV.map(([u, n]) => `<li><a href="${u}">${n === "All-on-6" ? "All-on-6: все зубы за 1 день" : n}</a></li>`).join("")}<li><a href="/otzyvy">Отзывы</a></li></ul><p class="mnav-k">Услуги</p><ul class="mnav-s">${cats}</ul></nav>
<div class="mnav-b"><a class="btn btn-onyx" href="#zapis" data-book>${ic("msg")}<span>Записаться</span></a><a class="btn btn-line" href="${tel}">${ic("phone")}<span>${B.phone}</span></a><button type="button" class="btn btn-line" data-vi="on">${ic("eye")}<span>Версия для слабовидящих</span></button></div>
</div></div>
<main id="main">
${main}
</main>
<div class="warn-band" role="note"><div class="wrap"><p class="warn">${B.warn.toUpperCase()}</p><p class="lic">${B.legal} · ${B.license}</p></div></div>
<footer class="foot"><div class="wrap">
<div class="cols cols-4">
<div>${logo("f-logo")}<p class="f-d">${B.what}. ${B.addr}. ${B.hours}.</p><ul class="f-c"><li>${ic("phone")}<a href="${tel}">${B.phone}</a></li><li>${ic("pin")}<a href="${B.route}">Маршрут в Яндекс Картах</a></li>${msgLinks().map(([u, n, k]) => `<li>${ic(k)}<a href="${u}" rel="noopener">${n}</a></li>`).join("")}</ul></div>
<div><b>Услуги</b><ul><li><a href="/">All-on-6: все зубы за 1 день</a></li>${cats}</ul></div>
<div><b>Пациентам</b><ul><li><a href="/ceny">Цены</a></li><li><a href="/akcii">Акции</a></li><li><a href="/vrachi">Врачи</a></li><li><a href="/otzyvy">Отзывы</a></li><li><a href="/o-klinike">О клинике</a></li><li><a href="/kontakty">Контакты</a></li>${shown("faq") ? `<li><a href="/#voprosy">Вопросы и ответы</a></li>` : ""}</ul></div>
<div><b>Документы</b><ul><li><a href="/svedeniya">Сведения о медицинской организации</a></li><li><a href="/privacy">Политика обработки персональных данных</a></li><li><a href="/soglasie">Согласие на обработку персональных данных</a></li>${LIVE.seo?.metrika ? `<li><button type="button" class="f-btn" data-cookies>Настройки cookie</button></li>` : ""}<li><button type="button" class="f-btn" data-vi="on">Версия для слабовидящих</button></li></ul></div>
</div>
<div class="rights"><span>© ${new Date().getFullYear()} ${B.legal}${ids ? `. ${ids}` : ""}. Сайт носит информационный характер и не является публичной офертой.</span><a href="/privacy">Обработка персональных данных</a></div>
</div></footer>
<div class="dock" id="dock"><a class="btn btn-onyx" href="#zapis" data-book>${ic("msg")}<span>Записаться</span></a><a class="btn btn-call" href="${tel}" aria-label="Позвонить в клинику">${ic("phone")}</a></div>
${bookSheet()}
<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="lv-hp">
<script type="application/json" id="sy-site">${json(siteData())}</script>
${home ? `<script src="${IMG}/gsap.min.js"></script>\n<script src="${IMG}/ScrollTrigger.min.js"></script>\n` : ""}@@J@@
</body>
</html>`;
}

const opt = (f) => (existsSync(DIR + f) ? read(f) : "");
const readLive = (f) => readFileSync(LIVE_DIR + f, "utf8");

/* Рабочий сайт: свои store и чат вместо демо; панель макета не нужна,
   админка клиники лежит в app/admin. Страницы — главная и pages.mjs, у
   каждой одинаковые стили и скрипт (запись, чат, меню, версия для
   слабовидящих, окно о cookie). Ключ страницы — её адрес без «/». */
function livePages() {
  const S = `<style>${min(read("site.css") + read("chat.css") + readLive("live.css") + readLive("pages.css") + readLive("team.css"))}</style>`;
  const J = `<script>\n${strip(readLive("store-live.js") + read("site.js") + readLive("live-chat.js") + readLive("live-pages.js") + readLive("team.js"))}</script>`;
  const fill = (h) => h.split("@@S@@").join(S).split("@@J@@").join(J);
  const out = { index: fill(sitePage()) };
  for (const [key, pg] of Object.entries(makePages(pageCtx()))) out[key] = fill(pageShell({ key, ...pg }));
  out.notFound = fill(pageShell({ key: "notFound", title: `Страница не найдена · «${B.name}»`, desc: "Такой страницы нет.", path: null, ld: null,
    main: `<section class="pg-hero" data-tone="ink"><div class="wrap pg-hw pg-hw-t"><div class="pg-ht"><span class="kick">Ошибка 404</span><h1>Такой страницы нет</h1><p class="lead">Возможно, ссылка устарела. Посмотрите <a href="/uslugi">услуги</a> и <a href="/ceny">цены</a> или позвоните: <a href="${tel}">${B.phone}</a>.</p><div class="pg-b"><a class="btn btn-onyx" href="/">${ic("arrow")}<span>На главную</span></a></div></div></div></section>` }));
  return out;
}

/**
 * Рабочий сайт с правками из админки клиники. over — то, что отдаёт
 * siteOverrides (app/lib/site-content.mjs): brand, data (списки data.mjs),
 * texts; все строки там уже экранированы. live.seo — Метрика и коды.
 */
export function renderLive(over = {}, live = {}) {
  const keep = [PROD, D, B, TX, LIVE, tel, LAYOUT];
  PROD = true; LIVE = live; TX = over.texts || {}; LAYOUT = over.blocks || null;
  D = { ...DATA, DOCTORS: CAT.DOCTORS, ...(over.data || {}) }; B = { ...DATA.BRAND, ...(over.brand || {}) }; tel = `tel:${B.phoneRaw}`;
  try { return livePages(); } finally { [PROD, D, B, TX, LIVE, tel, LAYOUT] = keep; }
}
/* Значения по умолчанию для админки: data.mjs макета и catalog.mjs рабочего сайта. */
export const DEFAULTS = { ...DATA, CATALOG: CAT.SERVICES, ORG: CAT.ORG, AUTHORITIES: CAT.AUTHORITIES, DOCS: [], DOCTORS: CAT.DOCTORS };
/** Тексты разделов по умолчанию: { ключ: { kick, h, p } }. */
export function textDefaults() { renderLive({}); return JSON.parse(JSON.stringify(SEEN)); }

if (IS_MAIN && PROD) {
  const APP = DIR + "app/", pg = livePages();
  for (const [key, html] of Object.entries(pg)) for (const bad of ["__PROTO_BASE__", "mockup-terms", "devuz", "DevUz", "макет", "dz-intro", ...(key === "notFound" ? [] : ["noindex"])]) if (html.includes(bad)) throw new Error(`на рабочем сайте (${key}) осталось «${bad}»`);
  mkdirSync(APP + "site", { recursive: true });
  for (const [key, html] of Object.entries(pg)) writeFileSync(APP + "site/" + (key === "notFound" ? "404" : key) + ".html", html);
  console.log("рабочий сайт:", Object.keys(pg).length, "страниц, главная", pg.index.length, "знаков →", APP + "site/");
}

if (IS_MAIN && !PROD) {
const out = { "": sitePage() };
/* store.js — общее состояние сайта, чата и панели; chat.* — чат на сайте. */
const parts = {
  S: `<style>${min(read("site.css") + opt("chat.css"))}</style>`,
  J: `<script>\n${strip(read("store.js") + read("site.js") + opt("chat.js"))}</script>`,
};
/* Панель клиники (`panel`): panel.mjs отдаёт страницы и свои части. */
if (existsSync(DIR + "panel.mjs")) {
  const P = await import("./panel.mjs");
  Object.assign(out, P.pages({ B, BRAND: B, IMG, TERMS, json, logo, ic }));
  Object.assign(parts, P.parts({ read, opt, min, strip }));
}
const fill = (page) => Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), page);

for (const m of fill(out[""]).matchAll(/\/protos\/syanie\/[\w./-]+\.(?:webp|png|js|mp4)/g)) if (!existsSync(PUB + m[0])) console.warn("нет файла", m[0]);
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "syanie.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(8), fill(v).length);
}
