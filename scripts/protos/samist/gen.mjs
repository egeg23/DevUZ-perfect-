import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { LANGS, BRAND, ROUTE, ABOUT, BRANDS, CATS, MODELS, SCENE, PRICE_SPAN } from "./data.mjs";
import { BASE, ADDONS, OFFER_HOURS, ALL } from "./plan.mjs";
import { PANEL_UI } from "./ui.mjs";

/*
 * Макет SAMIST AUTO (samist.autoline.uz), 04.11.2026: дилер грузовиков,
 * автобусов и спецтехники Isuzu и FAW на Ташкентской кольцевой, 120А.
 * Эталон — премиум-макет SamAuto, но без генерации: всё нарисовано кодом,
 * фото — только их, с их сайта. Страницы ru и uz:
 *
 *   ""    — видео DevUz → залёт камерой в их знак SIA AUTO (вектор, камера
 *           через viewBox) → ночная дорога, грузовик линиями чертежа, фары →
 *           из света фар раскрывается их площадка → «Что посмотреть» →
 *           как проверить → «Предложение DevUz Studio» (plan.mjs);
 *   site  — первый экран с их площадкой, бренды бегущей строкой, сцена по
 *           прокрутке из их фото, вся техника с ценами и «нырок» к машине,
 *           подбор, сравнение, кредит, трейд-ин, тест-драйв, сервис, КП,
 *           бот, панель, о компании, страницы под поиск, контакты;
 *   panel — вход (телефон или Telegram, демо 1234), «стекло» V7 + CRM:
 *           заявки, наличие и цены, сервис, история, роли, выгрузки.
 *
 * Модели, цены, характеристики, адрес, телефоны — только с их сайта
 * (data.mjs, catalog.json). Заявки и цифры в панели — демо. Модель макет не
 * вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/samist";
// Комментарии уходят, метка числа `/*~*/` остаётся: её снимает отпечаток при показе.
const strip = (s) => s.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");
const CSS_ALL = strip(readFileSync(DIR + "site.css", "utf8"));
const CUT = CSS_ALL.indexOf(".fl-mark{color:#fff");
const CSS = CSS_ALL.replace(/\n\s*/g, "");
const BASE_CSS = CSS_ALL.slice(0, CUT).replace(/\n\s*/g, "");
const JS = strip(readFileSync(DIR + "site.js", "utf8")).replace(/\n\s*\n/g, "\n");
const SCENE_JS = strip(readFileSync(DIR + "scene.js", "utf8")).replace(/\n\s*\n/g, "\n");
/* Сцена D-MAX — кадры премиум-эталона SamAuto (владелец, 04.11.2026: «у них
   тоже есть и узи d max, может просто закинем первый экран прокрутки с машиной
   сюда? Только уже с логотипом этого салона»). Кадры, порядок и видео —
   /protos/samauto/seq и scripts/protos/samauto/seq.json, ключ — тот же. */
const SA = "/protos/samauto";
const SEQ = JSON.parse(readFileSync(new URL("../samauto/seq.json", import.meta.url), "utf8"));
const ORDER = SEQ.order;
const NF = ORDER.length;
const lastOf = (c) => `${c}-${String(SEQ.d.find(([n]) => n === c)[1] - 1).padStart(2, "0")}`;
const TW = {
  hold: (ORDER.indexOf(lastOf("t4")) + SEQ.hold / 2) / (NF - 1),
  light: ORDER.indexOf(lastOf("t5b")) / (NF - 1),
  side: ORDER.indexOf(lastOf("t6")) / (NF - 1),
  away: (ORDER.indexOf(lastOf("t8")) - SEQ.d.find(([n]) => n === "t8")[1] / 4) / (NF - 1),
};
const win = (c, w = 0.035) => [c - w, c - w / 3, c + w / 3, c + w].map((x) => Math.max(0, Math.min(1, x)).toFixed(4)).join(",");
const LAND_JS = strip(readFileSync(DIR + "land.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_JS = strip(readFileSync(DIR + "panel.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_CSS = strip(readFileSync(DIR + "panel.css", "utf8")).replace(/\n\s*/g, "");
const BASE_URL = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Manrope:wght@400;700&display=swap";
const KEY = { ru: "", uz: "uz" };
const DEVUZ = "https://t.me/Devuz_studio_bot?start=samist";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, p = "") => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/" + (p ? p : "");
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const sum = (n, l) => `${fmt(n)}\u00a0${l === "ru" ? "сум" : "so‘m"}`;
const usd = (n) => `${fmt(n)}\u00a0$`;
const mln = (n, l) => `${String(+(n / 1e6).toFixed(1)).replace(".", ",")}\u00a0${l === "ru" ? "млн" : "mln"}`;
const words = (txt) => txt.split(" ").map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
const legal = (l) => (l === "ru" ? BRAND.legal : "«SAMIST AUTO» QK MChJ");
const catName = (id, l) => CATS.find((c) => c.id === id)[l];

/* Знак: обводка их логотипа SIA AUTO (logo.svg) — один раз на страницу, дальше <use>. */
const LOGO_SVG = readFileSync(DIR + "logo.svg", "utf8");
const LOGO_VB = LOGO_SVG.match(/viewBox="0 0 (\d+) (\d+)"/).slice(1).map(Number);
const LOGO_G = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><g id="sm-g">${LOGO_SVG.replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g></defs></svg>`;
const MARK = (cls = "") => `<svg class="${cls}" viewBox="0 0 ${LOGO_VB[0]} ${LOGO_VB[1]}" aria-hidden="true" focusable="false"><use href="#sm-g"/></svg>`;
const LOGO = (l, to = "site") => `<a class="logo" href="${href(l, to)}" aria-label="SAMIST AUTO">${MARK()}</a>`;
/* Куда камера входит: просвет буквы «A» в знаке. */
const AIM = [1440, 300];

const I = (dd) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  back: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  panel: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  truck: I('<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>'),
  sms: I('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>'),
  cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  wrench: I('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4Z"/>'),
  coin: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>'),
  down: I('<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>'),
  cmp: I('<path d="M4 6h7v14H4zM13 4h7v16h-7z"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  shield: I('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>'),
};

/* Грузовик линиями чертежа (вид спереди): кабина, стекло, решётка, фары,
   бампер, колёса. Обобщённый силуэт кабины над мотором, без чужого знака. */
const TRUCK = `<svg viewBox="0 0 600 520" aria-hidden="true" focusable="false">
<path class="occ" d="M128 362V96q0-40 40-44h264q40 4 40 44v-4h32q12 0 14 12l8 84q0 10-10 10h-44v114h20q14 0 14 14v34q0 14-14 14h-42v44q0 14-14 14h-40q-14 0-14-14v-44H218v44q0 14-14 14h-40q-14 0-14-14v-44h-42q-14 0-14-14v-34q0-14 14-14h20V232H84q-10 0-10-10l8-84q2-12 14-12h32Z"/>
<path class="tl" pathLength="1" d="M128 362V96q0-40 40-44h264q40 4 40 44v266"/>
<path class="tl" pathLength="1" d="M150 92q2-20 22-22h256q20 2 22 22l8 118H142Z"/>
<path class="tl" pathLength="1" d="M300 74v134M196 202l60-46M344 202l60-46"/>
<path class="tl" pathLength="1" d="M128 126H96q-12 0-14 12l-8 84q0 10 10 10h24M472 126h32q12 0 14 12l8 84q0 10-10 10h-24"/>
<path class="tl" pathLength="1" d="M188 240h224v92H188Z"/>
<path class="tl" pathLength="1" d="M200 262h200M200 284h200M200 306h200"/>
<path class="tl" pathLength="1" d="M136 252h46v66h-46q-8 0-8-8v-50q0-8 8-8ZM464 252h-46v66h46q8 0 8-8v-50q0-8-8-8Z"/>
<path class="tl r" pathLength="1" d="M108 352h384q14 0 14 14v34q0 14-14 14H108q-14 0-14-14v-34q0-14 14-14Z"/>
<path class="tl" pathLength="1" d="M150 414v44q0 14 14 14h40q14 0 14-14v-44M382 414v44q0 14 14 14h40q14 0 14-14v-44"/>
<path class="tl r" pathLength="1" d="M250 384h100"/>
<circle class="lamp" cx="159" cy="285" r="16"/><circle class="lamp" cx="441" cy="285" r="16"/>
</svg>`;
/* Дорога: края уходят к горизонту, разметка бежит штрихами. */
const ROAD = `<svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="edge" d="M470 520 80 1000M530 520 920 1000" fill="none"/><path class="dash" d="M500 520V1000" fill="none" stroke-dasharray="26 34"/></svg>`;

/* ── Общее ─────────────────────────────────────────────────────── */
function head(l, title, desc) {
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0b0c0e">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}
const langs = (l, to) => `<div class="langs">${LANGS.map((x) => `<a href="${href(x, to)}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>`;
const terms = (l, t) => `${t("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}`;
const nm = (m, l) => m.kind[l];
const byId = (id) => MODELS.find((m) => m.id === id);

/* ── Сайт ──────────────────────────────────────────────────────── */
function header(l, t) {
  const nav = [["lineup", t("Техника", "Texnika")], ["pick", t("Подбор", "Tanlash"), "pick"], ["credit", t("Кредит", "Kredit"), "credit"], ["service", t("Сервис", "Servis"), "service"], ["about", t("О компании", "Kompaniya")], ["contact", t("Контакты", "Aloqa")]];
  return `<header class="top"><div class="mbar"><a href="${href(l)}">${ICON.back}<span>${t("Макет для SAMIST AUTO", "SAMIST AUTO uchun maket")}</span></a><a class="mb-adm" href="${href(l, "panel")}" data-addon="admin">${ICON.panel}<span>${t("Админка", "Admin panel")}</span>${ICON.arrow}</a></div><div class="top-in glass">
${LOGO(l)}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([id, n, a]) => `<a href="#${id}"${a ? ` data-addon="${a}"` : ""}>${n}</a>`).join("")}</nav>
<button type="button" class="mine" id="mine" hidden><i class="dot"></i>${ICON.truck}<span>${t("Моя заявка", "Mening arizam")}</span></button>
${langs(l, "site")}
<a class="btn btn-a btn-s tel" href="tel:${BRAND.tel}">${ICON.phone}<span>${BRAND.phone}</span></a>
</div></header>`;
}

/* Первый экран — сцена D-MAX по прокрутке, их знак и их цифры: D-MAX IRBIS
   с площадки (объявление и его описание: 4JJ1, 163 л.с., 2 999 см³, 4x4,
   865 кг, автомат, 450 000 000 сум). Машина в кадре — D-MAX для показа. */
function hero(l, t) {
  const m = byId("isuzu-d-max-irbis");
  const v = (k) => { const x = m.spec.find((q) => q.k === k); return x ? (l === "ru" ? x.v : x.vu) : ""; };
  const chips = (a) => `<ul class="dmx-chips">${a.map(([k, x]) => `<li><small>${k}</small><b>${x}</b></li>`).join("")}</ul>`;
  const EXP = [[t("Двигатель", "Dvigatel"), "Isuzu 4JJ1 · " + v("Мощность").replace(/ \(.*\)/, "")], [t("Дизель, объём", "Dizel, hajmi"), v("Объём двигателя")], [t("Привод", "Yuritma"), "4x4"]];
  const SIDE = [[t("Длина", "Uzunligi"), "5 295 mm"], [t("Грузоподъёмность", "Yuk ko‘tarish"), v("Грузоподъемность")], [t("Коробка", "Uzatmalar qutisi"), v("Коробка")]];
  const head = t("Для каждого клиента своя машина", "Har bir mijozga o‘z mashinasi");
  return `<section class="dmx" id="top" aria-labelledby="dmx-h">
<div class="dmx-track" id="dmx-track"><div class="dmx-stage" id="dmx-stage">
<picture class="dmx-poster"><source media="(orientation: portrait)" srcset="${SA}/seq/m/t1-00.webp"><img src="${SA}/seq/d/t1-00.webp" alt="${t("Isuzu D-MAX под покрывалом на подиуме", "Isuzu D-MAX podiumda, parda ostida")}" fetchpriority="high"></picture>
<video id="dmx-vd" muted playsinline preload="none" disablepictureinpicture aria-hidden="true"></video>
<canvas id="dmx-cv" aria-hidden="true"></canvas>
<div class="dmx-boot" id="dmx-boot" aria-hidden="true">${MARK()}<p><b id="dmx-boot-n">0</b>%</p><i><b id="dmx-boot-b"></b></i><span>${t("Загружаем сцену", "Sahna yuklanmoqda")}</span></div>
<div class="dmx-copy dmx-c0" id="dmx-c0" data-w="0,0,0.0300,0.0800"><p class="kick"><i></i>Isuzu D-MAX IRBIS · SAMIST AUTO</p><h1 id="dmx-h">${t("Isuzu D-MAX <em>на кольцевой, 120А</em>", "Isuzu D-MAX <em>aylanma yo‘l, 120A da</em>")}</h1><p class="lead">${t("Листайте: покрывало слетит, машина разойдётся на детали, соберётся и уедет.", "Aylantiring: parda ochiladi, mashina detallarga ajraladi, yig‘iladi va yo‘lga chiqadi.")}</p><a class="dmx-hint" href="#ryad">${ICON.down}<span>${t("Листайте вниз", "Pastga aylantiring")}</span></a></div>
<div class="dmx-copy dmx-c1" data-w="${win(TW.hold, 0.05)}" aria-hidden="true"><p class="kick"><i></i>${t("Изнутри", "Ichidan")}</p><p class="dmx-h">${t("Как устроен D-MAX", "D-MAX qanday tuzilgan")}</p>${chips(EXP)}</div>
<div class="dmx-copy dmx-c2" data-w="${win(TW.light)}" aria-hidden="true"><p class="kick"><i></i>${t("Спереди", "Old tomondan")}</p><p class="dmx-h">${t("Посмотрите ближе", "Yaqinroq qarang")}</p></div>
<div class="dmx-copy dmx-c3" data-w="${win(TW.side)}" aria-hidden="true"><p class="kick"><i></i>${t("Сбоку", "Yon tomondan")}</p><p class="dmx-h">D-MAX IRBIS</p>${chips(SIDE)}</div>
<div class="dmx-copy dmx-c4" id="dmx-c4" data-w="${(TW.away - 0.006).toFixed(4)},${(TW.away + 0.012).toFixed(4)},2,2">${MARK()}<p class="dmx-h dmx-draw">${head.split(" ").map((w, i) => `<span style="--i:${i}">${w}</span>`).join(" ")}</p>
<p class="lead">${t(`На площадке сейчас Isuzu D-MAX IRBIS ${m.year} года, ${v("Пробег")}, ${v("Цвет")}: ${sum(m.uzs, l)}. В сцене D-MAX для показа. И ещё ${MODELS.length - 1} моделей: фургоны, самосвал, автобус, тягач.`, `Maydonda hozir ${m.year} yilgi Isuzu D-MAX IRBIS, ${v("Пробег")}, ${v("Цвет")}: ${sum(m.uzs, l)}. Sahnada ko‘rsatish uchun D-MAX. Yana ${MODELS.length - 1} ta model: furgonlar, samosval, avtobus, shatakchi.`)}</p>
<div class="dmx-b"><a class="btn btn-a" href="#ryad">${ICON.truck}<span>${t("Выбрать раздел", "Bo‘limni tanlash")}</span></a><button type="button" class="btn btn-g" data-open="isuzu-d-max-irbis">${t("D-MAX на площадке", "Maydondagi D-MAX")}${ICON.arrow}</button><a class="btn btn-g" href="tel:${BRAND.tel}">${ICON.phone}<span>${BRAND.phone}</span></a></div></div>
<div class="dmx-bar" aria-hidden="true"><i id="dmx-bar"></i></div>
</div></div>
<div class="dmx-still"><div class="wrap"><img src="${SA}/poster-a-16.webp" width="1920" height="1072" alt="${t("Isuzu D-MAX на подиуме", "Isuzu D-MAX podiumda")}" loading="lazy"><img src="${SA}/poster-e-16.webp" width="1920" height="1072" alt="${t("Isuzu D-MAX, разобранный на детали", "Detallarga ajratilgan Isuzu D-MAX")}" loading="lazy">${chips([...EXP, ...SIDE])}</div></div>
</section>`;
}

/* Площадка по разделам их сайта: снимок из их объявлений, число моделей и
   цена «от». Нажатие — машина выезжает вперёд, остальные гаснут, камера
   проваливается в раздел (site.js, как #qator у SamAuto). */
const ROW = [["car", "isuzu-d-max-irbis"], ["comm", "faw-actis-t80"], ["truck", "isuzu-fvr-34q"], ["city", "isuzu-nqr-71-pl"], ["build", "faw-j6p"], ["bus", "isuzu-saz-hd-50"], ["tract", "faw-jh6-cng"]];
function ryad(l, t) {
  return `<section class="ry" id="ryad" aria-labelledby="ry-h"><div class="wrap">
<p class="kick rise"><i></i>${t("Площадка по разделам", "Bo‘limlar bo‘yicha maydon")}</p>
<h2 class="h2 rise" id="ry-h">${t(`${MODELS.length} машин, <b>${ROW.length} разделов</b>`, `${MODELS.length} ta mashina, <b>${ROW.length} ta bo‘lim</b>`)}</h2>
<p class="lead rise">${t("Как в меню вашего сайта. Нажмите на раздел: машина выедет вперёд, а за ней откроются все модели раздела с ценами.", "Saytingiz menyusidagidek. Bo‘limni bosing: mashina oldinga chiqadi, uning ortidan bo‘limning barcha modellari narxlari bilan ochiladi.")}</p></div>
<div class="ry-st" id="ry-st"><div class="ry-row">${ROW.map(([c, id], k) => {
    const list = MODELS.filter((m) => m.cat === c), m = byId(id);
    const from = Math.min(...list.map((x) => x.uzs));
    return `<button type="button" class="ry-c" data-cat="${c}" style="--i:${k}" aria-haspopup="dialog"><span class="ry-ph"><img src="${IMG}/cat/${m.img[0]}" width="1280" height="960" alt="${esc(m.name)}, ${esc(catName(c, l))}" loading="lazy"></span><span class="ry-tx"><small>${list.length} ${t(list.length === 1 ? "модель" : list.length < 5 ? "модели" : "моделей", "ta model")}</small><b>${esc(catName(c, l))}</b><em>${t("от", "")} ${mln(from, l)} ${t("сум", "so‘mdan")}</em></span><i class="ry-glow" aria-hidden="true"></i></button>`;
  }).join("")}</div><i class="rl ry-floor rise" aria-hidden="true"></i></div>
<p class="ry-hint">${t("Нажмите на машину", "Mashinani bosing")}</p>
</section>`;
}

function velo() {
  const row = BRANDS.map((b) => `<span>${esc(b)}<i></i></span>`).join("");
  return `<div class="velo" aria-hidden="true"><div class="velo-t">${row}${row}${row}${row}</div></div>`;
}

function scene(l, t) {
  const fr = SCENE.map((id, k) => { const m = byId(id); return `<div class="scn-f"><img src="${IMG}/cat/${m.img[0]}" width="1280" height="960" alt="${esc(m.name)}, ${esc(nm(m, l))}"${k ? ' loading="lazy"' : ""}></div>`; }).join("");
  return `<section class="scn" id="scn" aria-label="${t("Площадка по прокрутке", "Aylantirishdagi maydon")}"><div class="scn-st">${fr}
<div class="scn-top"><div class="wrap"><p class="kick"><i></i>${t("С площадки, от лёгкого к тяжёлому", "Maydondan, yengildan og‘irgacha")}</p></div></div>
<div class="scn-rail" aria-hidden="true">${SCENE.map(() => "<i><b></b></i>").join("")}</div>
<div class="scn-tx"><div class="wrap"><p class="kick"><i></i><span class="scn-i">1 / ${SCENE.length}</span></p><p class="scn-n">${esc(byId(SCENE[0]).name)}</p><p class="scn-k">${esc(nm(byId(SCENE[0]), l))}</p><div class="scn-nums"></div>
<p class="scn-price glass"><b>${sum(byId(SCENE[0]).uzs, l)}</b><small></small></p> <button type="button" class="btn btn-a scn-open" data-open="${SCENE[0]}" style="pointer-events:auto;margin-top:20px">${t("Подробнее", "Batafsil")}${ICON.arrow}</button></div></div>
</div></section>`;
}

function lineup(l, t) {
  const n = (id) => MODELS.filter((m) => m.cat === id).length;
  return `<section class="sec" id="lineup"><div class="wrap">
<p class="kick rise"><i></i>${t("Вся техника на площадке", "Maydondagi barcha texnika")}</p>
<h2 class="h2 rise">${t(`${MODELS.length} моделей <b>с ценами</b>`, `Narxlari bilan <b>${MODELS.length} ta model</b>`)}</h2>
<p class="lead rise">${t("Цены и характеристики из ваших объявлений на 04.11.2026. Нажмите на машину: фото, цифры и что дальше.", "Narxlar va xususiyatlar 04.11.2026 holatiga e’lonlaringizdan. Mashinani bosing: suratlar, raqamlar va keyingi qadam.")}</p>
<div class="rl rise" style="margin-bottom:24px"></div>
<div class="chips" role="group" aria-label="${t("Разделы", "Bo‘limlar")}"><button type="button" class="chip" data-cat="all" aria-pressed="true">${t("Все", "Hammasi")} <small>${MODELS.length}</small></button>${CATS.filter((c) => n(c.id)).map((c) => `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="false">${esc(c[l])} <small>${n(c.id)}</small></button>`).join("")}</div>
<div class="ltools"><span id="found" aria-live="polite"></span><span style="display:flex;gap:12px;flex-wrap:wrap"><label><input type="checkbox" id="onlynew"> ${t("Только новые", "Faqat yangilari")}</label><label><span class="vh">${t("Сортировка", "Saralash")}</span><select id="sort"><option value="cheap">${t("Сначала доступные", "Avval arzonlari")}</option><option value="rich">${t("Сначала дорогие", "Avval qimmatlari")}</option><option value="hp">${t("По мощности", "Quvvat bo‘yicha")}</option></select></label></span></div>
<div class="grid" id="grid"></div>
</div></section>`;
}

function pickSec(l, t) {
  const g = (k, opts) => `<div class="q"><span>${opts[0]}</span><div class="seg" data-pk="${k}">${opts[1].map(([v, n], i) => `<button type="button" data-v="${v}" aria-pressed="${i === 0}">${n}</button>`).join("")}</div></div>`;
  return `<section class="sec alt" id="pick" data-addon="pick"><div class="wrap two">
<div><p class="kick rise"><i></i>${t("Подбор под задачу", "Vazifaga qarab tanlash")}</p>
<h2 class="h2 rise">${t("Что <b>возите?</b>", "Nima <b>tashiysiz?</b>")}</h2>
<p class="lead rise">${t("Три вопроса, и сайт покажет три машины с площадки и почему именно они. Правилами по их характеристикам, без догадок.", "Uchta savol, sayt maydondan uchta mashinani va nima uchun aynan ularni ko‘rsatadi. Xususiyatlari bo‘yicha qoidalar bilan, taxminsiz.")}</p>
<div class="card rise">${g("use", [t("Что возите", "Nima tashiysiz"), [["goods", t("Грузы в фургоне", "Furgonda yuk")], ["cold", t("Продукты в холоде", "Sovuqda mahsulot")], ["build", t("Стройка: грунт, бетон", "Qurilish: tuproq, beton")], ["people", t("Людей", "Odamlar")], ["city", t("Мусор, город", "Chiqindi, shahar")], ["long", t("Межгород, фуры", "Shaharlararo, fura")], ["small", t("Мелкие грузы", "Kichik yuklar")]]])}
${g("t", [t("Сколько за рейс", "Bir reysda qancha"), [["5", t("до 5 т", "5 t gacha")], ["1.5", t("до 1,5 т", "1,5 t gacha")], ["10", t("до 10 т", "10 t gacha")], ["20", t("больше 10 т", "10 t dan ko‘p")]]])}
${g("b", [t("Бюджет", "Byudjet"), [["any", t("Любой", "Istalgan")], ["500", t("до 500 млн сум", "500 mln so‘mgacha")], ["800", t("до 800 млн сум", "800 mln so‘mgacha")]]])}</div></div>
<div><div class="res rise" id="pk-res" aria-live="polite"></div></div>
</div></section>`;
}

function compareSec(l, t) {
  return `<section class="sec" id="compare" data-addon="compare"><div class="wrap">
<p class="kick rise"><i></i>${t("Сравнение", "Taqqoslash")}</p>
<h2 class="h2 rise">${t("Рядом <b>две-три машины</b>", "Yonma-yon <b>ikki-uchta mashina</b>")}</h2>
<p class="lead rise">${t("В окне машины нажмите «Сравнить». Строки, где модели отличаются, подсвечены, лучшее число зелёным.", "Mashina oynasida «Taqqoslash»ni bosing. Modellar farq qiladigan qatorlar ajratilgan, eng yaxshi raqam yashil.")}</p>
<div id="cmp-t" class="rise"></div>
<p style="margin-top:16px"><button type="button" class="btn btn-g btn-s" data-cmpclear>${t("Очистить", "Tozalash")}</button></p>
</div></section>`;
}

function creditSec(l, t) {
  const opts = MODELS.map((m) => `<option value="${m.id}"${m.id === "isuzu-npr-75k" ? " selected" : ""}>${esc(m.name)} · ${mln(m.uzs, l)}</option>`).join("");
  return `<section class="sec alt" id="credit" data-addon="credit"><div class="wrap two">
<div><p class="kick rise"><i></i>${t("Кредит и лизинг", "Kredit va lizing")}</p>
<h2 class="h2 rise">${t("Платёж <b>в месяц</b> до звонка", "Qo‘ng‘iroqdan oldin <b>oylik to‘lov</b>")}</h2>
<p class="lead rise">${t("Вы пишете, что технику можно взять в кредит или лизинг. Ставку называет банк, поэтому её вписывает сам покупатель: сайт посчитает взнос, платёж и переплату, а расчёт придёт вам заявкой.", "Texnikani kredit yoki lizingga olish mumkinligini yozasiz. Stavkani bank aytadi, shuning uchun uni xaridorning o‘zi yozadi: sayt boshlang‘ich to‘lov, oylik to‘lov va ortiqcha to‘lovni hisoblaydi, hisob sizga ariza bo‘lib keladi.")}</p>
<ul class="alist rise"><li>${ICON.shield}<span>${t("В объявлениях кредит или лизинг указаны у моделей:", "E’lonlarda kredit yoki lizing ko‘rsatilgan modellar:")} ${MODELS.filter((m) => m.credit).map((m) => m.name).join(", ")}.</span></li></ul></div>
<div class="card rise">
<label class="fld"><span>${t("Модель", "Model")}</span><select id="cr-m">${opts}</select></label>
<div class="rng"><div><span>${t("Первый взнос", "Boshlang‘ich to‘lov")}</span><b id="cr-dpv">30%</b></div><input type="range" id="cr-dp" min="10" max="70" step="5" value="30" aria-label="${t("Первый взнос", "Boshlang‘ich to‘lov")}"></div>
<div class="rng"><div><span>${t("Срок", "Muddat")}</span><b id="cr-nv">36</b></div><input type="range" id="cr-n" min="12" max="60" step="6" value="36" aria-label="${t("Срок", "Muddat")}"></div>
<label class="fld"><span>${t("Ставка банка, % годовых", "Bank stavkasi, yillik %")}</span><input id="cr-r" inputmode="decimal" placeholder="${t("например, как назвал ваш банк", "masalan, bankingiz aytganidek")}"></label>
<div class="calc-out"><div><span>${t("Цена", "Narx")}</span><b id="cr-p"></b></div><div><span>${t("Взнос", "Boshlang‘ich to‘lov")}</span><b id="cr-down"></b></div><div><span>${t("Сумма кредита", "Kredit summasi")}</span><b id="cr-body"></b></div><div class="big"><span>${t("В месяц", "Oyiga")}</span><b id="cr-pay"></b></div><div><span>${t("Переплата", "Ortiqcha to‘lov")}</span><b id="cr-over"></b></div></div>
<button type="button" class="btn btn-a" id="cr-go" style="margin-top:16px;width:100%">${ICON.sms}<span>${t("Отправить расчёт менеджеру", "Hisobni menejerga yuborish")}</span></button>
<p class="note" style="margin-top:10px">${t("Расчёт для ориентира. Окончательные условия называет банк или лизинговая компания.", "Hisob mo‘ljal uchun. Yakuniy shartlarni bank yoki lizing kompaniyasi aytadi.")}</p></div>
</div></section>`;
}

const modelOpts = (l) => MODELS.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join("");
function tradeSec(l, t) {
  return `<section class="sec" id="trade" data-addon="trade"><div class="wrap two">
<div><p class="kick rise"><i></i>${t("Трейд-ин", "Treyd-in")}</p>
<h2 class="h2 rise">${t("Старую машину <b>в зачёт</b>", "Eski mashinani <b>hisobga</b>")}</h2>
<p class="lead rise">${t("Марка, год, пробег и пара фото. Менеджер оценит и назовёт доплату за новую. Фото остаются у покупателя в телефоне до разговора.", "Marka, yil, yurgani va bir-ikki surat. Menejer baholaydi va yangisi uchun qo‘shimcha to‘lovni aytadi. Suratlar suhbatgacha xaridorning telefonida qoladi.")}</p></div>
<form class="card rise" id="tr-f"><div class="fx">
<label class="fld"><span>${t("Ваша машина", "Mashinangiz")}</span><input name="old" required placeholder="Isuzu NQR"></label>
<label class="fld"><span>${t("Год", "Yil")}</span><input name="year" inputmode="numeric" required placeholder="2017"></label>
<label class="fld"><span>${t("Пробег, км", "Yurgani, km")}</span><input name="km" inputmode="numeric" placeholder="240 000"></label>
<label class="fld"><span>${t("Хочу взамен", "Evaziga xohlayman")}</span><select name="want">${modelOpts(l)}</select></label>
<label class="fld"><span>${t("Имя", "Ism")}</span><input name="name" autocomplete="name"></label>
<label class="fld"><span>${t("Телефон", "Telefon")}</span><input name="ph" type="tel" autocomplete="tel" inputmode="tel" placeholder="+998"></label></div>
<label class="fld"><span>${t("Фото старой машины", "Eski mashina surati")}</span><input id="tr-ph" type="file" accept="image/*" multiple></label><div class="ph-in" id="tr-pv"></div>
<button type="submit" class="btn btn-a" style="width:100%">${ICON.sms}<span>${t("Отправить на оценку", "Baholashga yuborish")}</span></button></form>
</div></section>`;
}

function driveSec(l, t) {
  return `<section class="sec alt" id="drive" data-addon="drive"><div class="wrap two">
<div><p class="kick rise"><i></i>${t("Тест-драйв и показ", "Test-drayv va ko‘rish")}</p>
<h2 class="h2 rise">${t("Приезжайте <b>на кольцевую</b>", "<b>Aylanma yo‘lga</b> keling")}</h2>
<p class="lead rise">${t(`${BRAND.ru.addr}. Выберите машину и день, менеджер подтвердит время, а статус будет виден в «Моя заявка».`, `${BRAND.uz.addr}. Mashina va kunni tanlang, menejer vaqtni tasdiqlaydi, holat esa «Mening arizam»da ko‘rinadi.`)}</p></div>
<form class="card rise" id="dr-f">
<label class="fld"><span>${t("Машина", "Mashina")}</span><select id="dr-m">${modelOpts(l)}</select></label>
<div class="q"><span>${t("День", "Kun")}</span><div class="seg" id="dr-days"></div></div>
<div class="q"><span>${t("Когда удобно", "Qachon qulay")}</span><div class="seg"><button type="button" data-part aria-pressed="false">${t("утром", "ertalab")}</button><button type="button" data-part aria-pressed="false">${t("днём", "kunduzi")}</button><button type="button" data-part aria-pressed="false">${t("после обеда", "tushlikdan keyin")}</button></div></div>
<div class="fx"><label class="fld"><span>${t("Имя", "Ism")}</span><input name="name" autocomplete="name"></label><label class="fld"><span>${t("Телефон", "Telefon")}</span><input name="ph" type="tel" autocomplete="tel" inputmode="tel" placeholder="+998"></label></div>
<button type="submit" class="btn btn-a" style="width:100%">${ICON.cal}<span>${t("Записаться", "Yozilish")}</span></button></form>
</div></section>`;
}

function serviceSec(l, t) {
  return `<section class="sec" id="service" data-addon="service"><div class="wrap two">
<div><p class="kick rise"><i></i>${t("Сервис и запчасти", "Servis va ehtiyot qismlar")}</p>
<h2 class="h2 rise">${t("Оригинальные запчасти <b>ISUZU</b>", "<b>ISUZU</b> original ehtiyot qismlari")}</h2>
<p class="lead rise">${esc(ABOUT[l][2])} ${t("Запись на обслуживание и запрос детали по VIN приходят в панель отдельной вкладкой.", "Xizmatga yozilish va VIN bo‘yicha qism so‘rovi panelga alohida bo‘limga keladi.")}</p></div>
<div class="card rise"><div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="true" aria-controls="sv-f">${t("Запись в сервис", "Servisga yozilish")}</button><button type="button" role="tab" aria-selected="false" aria-controls="pt-f">${t("Запчасть по VIN", "VIN bo‘yicha qism")}</button></div>
<form id="sv-f" role="tabpanel"><div class="fx"><label class="fld"><span>${t("Машина", "Mashina")}</span><input name="car" required placeholder="Isuzu NPR 75K"></label><label class="fld"><span>${t("Пробег, км", "Yurgani, km")}</span><input name="km" inputmode="numeric"></label></div>
<label class="fld"><span>${t("Что сделать", "Nima qilish kerak")}</span><input name="what" required placeholder="${t("ТО, замена масла и фильтров", "TO, moy va filtrlarni almashtirish")}"></label>
<div class="fx"><label class="fld"><span>${t("Имя", "Ism")}</span><input name="name" autocomplete="name"></label><label class="fld"><span>${t("Телефон", "Telefon")}</span><input name="ph" type="tel" autocomplete="tel" inputmode="tel" placeholder="+998"></label></div>
<button type="submit" class="btn btn-a" style="width:100%">${ICON.wrench}<span>${t("Записаться в сервис", "Servisga yozilish")}</span></button></form>
<form id="pt-f" role="tabpanel" hidden><label class="fld"><span>VIN</span><input name="vin" required maxlength="17" placeholder="JAANQR…"></label>
<label class="fld"><span>${t("Деталь", "Qism")}</span><input name="part" required placeholder="${t("фильтр топливный", "yoqilg‘i filtri")}"></label>
<div class="fx"><label class="fld"><span>${t("Имя", "Ism")}</span><input name="name" autocomplete="name"></label><label class="fld"><span>${t("Телефон", "Telefon")}</span><input name="ph" type="tel" autocomplete="tel" inputmode="tel" placeholder="+998"></label></div>
<button type="submit" class="btn btn-a" style="width:100%">${ICON.search}<span>${t("Узнать наличие", "Mavjudligini bilish")}</span></button></form></div>
</div></section>`;
}

function fleetSec(l, t) {
  return `<section class="sec alt" id="fleet" data-addon="fleet"><div class="wrap two">
<div><p class="kick rise"><i></i>${t("Для автопарков", "Avtoparklar uchun")}</p>
<h2 class="h2 rise">${t("КП на несколько <b>машин сразу</b>", "Bir nechta <b>mashinaga</b> taklif")}</h2>
<p class="lead rise">${t("Компания набирает машины, сайт собирает коммерческое предложение на вашем бланке с ценами площадки. Файл открывается для печати или сохранения в PDF, заявка уходит в панель.", "Kompaniya mashinalarni tanlaydi, sayt maydon narxlari bilan blankingizda tijorat taklifini yig‘adi. Fayl chop etish yoki PDF saqlash uchun ochiladi, ariza panelga ketadi.")}</p>
<label class="fld rise"><span>${t("Компания", "Kompaniya")}</span><input id="fl-co" placeholder="${t("ООО «…»", "«…» MChJ")}"></label>
<div class="fl-tot rise"><span>${t("Машин", "Mashinalar")}: <b id="fl-n">0</b></span><b id="fl-sum"></b></div>
<button type="button" class="dot-btn rise" id="fl-dl" disabled><span class="dot-face"></span><span class="dot-w">${ICON.down}<span class="dot-l">${t("Скачать КП", "Taklifni yuklab olish")}</span></span><svg class="dot-ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/></svg><span class="dot-water"><i></i></span></button></div>
<div class="card rise" id="fl-list"></div>
</div></section>`;
}

function botSec(l, t) {
  const m = (id) => byId(id);
  const mc = (id) => { const x = m(id); return `<span class="mc"><img src="${IMG}/cat/${x.img[0]}" alt="" loading="lazy"><span><b>${esc(x.name)}</b><br>${x.kg ? fmt(x.kg) + (l === "ru" ? " кг · " : " kg · ") : x.m3 ? String(x.m3).replace(".", ",") + " m³ · " : ""}${mln(x.uzs, l)} ${l === "ru" ? "сум" : "so‘m"}</span></span>`; };
  const msgs = [
    ["u", t("Нужен фургон до 5 тонн, что есть?", "5 tonnagacha furgon kerak, nima bor?")],
    ["b", `${t("Сейчас на площадке:", "Hozir maydonda:")}${mc("isuzu-npr-75k")}${mc("isuzu-nqr-90l")}${mc("isuzu-nmr-77h")}<span class="kb"><span>${t("Подробнее", "Batafsil")}</span><span>${t("В кредит", "Kreditga")}</span><span>${t("Менеджер", "Menejer")}</span></span>`],
    ["u", t("NPR 75K в кредит можно?", "NPR 75K kreditga bo‘ladimi?")],
    ["b", t("Да, у этой модели в объявлении указаны кредит и лизинг. Ставку назовёт банк. Позвать менеджера, чтобы посчитал?", "Ha, bu model e’lonida kredit va lizing ko‘rsatilgan. Stavkani bank aytadi. Hisoblab berishi uchun menejerni chaqiraymi?")],
    ["u", t("Да, позвоните после обеда", "Ha, tushlikdan keyin qo‘ng‘iroq qiling")],
    ["sys", t("Заявка передана менеджеру в панель", "Ariza paneldagi menejerga uzatildi")],
  ];
  return `<section class="sec" id="tgbot" data-addon="tgbot"><div class="wrap two">
<div><p class="kick rise"><i></i>${t("Telegram-бот", "Telegram-bot")}</p>
<h2 class="h2 rise">${t("Наличие и цены <b>в Telegram</b>", "<b>Telegramda</b> mavjudlik va narxlar")}</h2>
<p class="lead rise">${t("Покупатель пишет своими словами, бот отвечает машинами с площадки: фото, цена, кредит. Сложное и «позвоните» уходит менеджеру в панель. Это пример переписки, ответы бота собраны из ваших объявлений.", "Xaridor o‘z so‘zlari bilan yozadi, bot maydondagi mashinalar bilan javob beradi: surat, narx, kredit. Murakkab narsalar va «qo‘ng‘iroq qiling» paneldagi menejerga ketadi. Bu yozishma namunasi, bot javoblari e’lonlaringizdan yig‘ilgan.")}</p></div>
<div class="tgw rise"><div class="tgw-h"><i>SIA</i><span><b>SAMIST AUTO</b><small>${t("бот", "bot")}</small></span></div><div class="tgw-b" id="tg-b">${msgs.map(([k, v]) => `<div class="msg ${k}">${v}</div>`).join("")}</div></div>
</div></section>`;
}

function adminSec(l, t) {
  return `<section class="sec alt" id="admin" data-addon="admin"><div class="wrap"><div class="pan rise">
<div><p class="kick"><i></i>${t("Панель заявок и наличия", "Arizalar va mavjudlik paneli")}</p><h2 class="h2">${t("Всё с сайта <b>в одном окне</b>", "Saytdagi hammasi <b>bitta oynada</b>")}</h2>
<ul>${[t("Заявка с сайта первой строкой, статус видит покупатель", "Saytdan ariza birinchi qatorda, holatni xaridor ko‘radi"), t("Цена и «продано» меняются на сайте сразу", "Narx va «sotildi» saytda darhol o‘zgaradi"), t("Менеджер не видит сумм сделок, у владельца всё", "Menejer bitimlar summasini ko‘rmaydi, egasida hammasi"), t("Вход кодом из Telegram, выгрузка CSV", "Telegram kodi bilan kirish, CSV yuklab olish")].map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>
<a class="btn btn-a" href="${href(l, "panel")}">${ICON.panel}<span>${t("Открыть панель", "Panelni ochish")}</span></a></div>
<div class="pan-sh" aria-hidden="true"><img src="${IMG}/salon-s.webp" alt="" loading="lazy"><div><span><b>${MODELS.length}</b>${t("моделей", "model")}</span><span><b>4</b>${t("новых заявки", "yangi ariza")}</span><span><b>2</b>${t("тест-драйва", "test-drayv")}</span><span><b>CSV</b>${t("выгрузка", "yuklab olish")}</span></div></div>
</div></div></section>`;
}

function aboutSec(l, t) {
  return `<section class="sec" id="about"><div class="wrap">
<div class="about"><div><p class="kick rise"><i></i>${t("О компании", "Kompaniya haqida")}</p>
<h2 class="h2 rise">${t("5 лет <b>на рынке Узбекистана</b>", "O‘zbekiston bozorida <b>5 yil</b>")}</h2>
<ul class="alist">${ABOUT[l].map((x) => `<li class="rise">${ICON.check}<span>${esc(x)}</span></li>`).join("")}</ul>
<p class="motto rise">${esc(ABOUT.motto[l])}</p></div>
<div class="about-ph rise"><img src="${IMG}/lot.webp" width="1280" height="267" alt="${t("Фургоны Isuzu и FAW на площадке SAMIST AUTO", "SAMIST AUTO maydonida Isuzu va FAW furgonlari")}" loading="lazy" style="object-position:30% 50%"></div></div>
<div class="brands">${BRANDS.map((b) => `<span class="pop">${esc(b)}</span>`).join("")}</div>
</div></section>`;
}

function seoSec(l, t) {
  const ex = ["isuzu-npr-75k", "faw-j6p", "isuzu-saz-hd-50", "isuzu-cyz"].map(byId);
  return `<section class="sec alt" id="seo" data-addon="seo"><div class="wrap two">
<div><p class="kick rise"><i></i>${t("Страницы под поиск", "Qidiruv uchun sahifalar")}</p>
<h2 class="h2 rise">${t("Чтобы находили <b>вас</b>, а не витрину", "<b>Sizni</b> topishsin, vitrinani emas")}</h2>
<p class="lead rise">${t("Сейчас ваш сайт на autoline закрыт от поиска: в его коде стоит запрет показывать страницы в Google и Яндексе. На новом сайте у каждой модели своя страница на двух языках.", "Hozir autoline’dagi saytingiz qidiruvdan yopiq: kodida sahifalarni Google va Yandexda ko‘rsatish taqiqlangan. Yangi saytda har bir modelning ikki tilda o‘z sahifasi bor.")}</p></div>
<div class="seo-l rise">${ex.map((m) => `<span><b>${esc(m.name)} ${t("цена Ташкент", "narxi Toshkent")}</b><em>/${m.id}</em></span>`).join("")}</div>
</div></section>`;
}

function contact(l, t) {
  return `<section class="sec" id="contact"><div class="wrap">
<p class="kick rise"><i></i>${t("Контакты", "Aloqa")}</p>
<h2 class="h2 rise">${t("Площадка <b>на кольцевой</b>", "<b>Aylanma yo‘ldagi</b> maydon")}</h2>
<div class="cnt"><div class="cnt-l">
<a class="rise" href="tel:${BRAND.tel}">${ICON.phone}<span><b>${BRAND.phone}</b><small>${esc(legal(l))}</small></span></a>
${BRAND.more.map(([n, tel]) => `<a class="rise" href="tel:${tel}">${ICON.phone}<span><b>${n}</b><small>${t("автосалон Isuzu", "Isuzu avtosaloni")}</small></span></a>`).join("")}
<a class="rise" href="${ROUTE}" target="_blank" rel="noopener">${ICON.pin}<span><b>${esc(BRAND[l].addr)}</b><small>${BRAND[l].zip}, ${esc(BRAND[l].area)} · ${t("маршрут", "yo‘nalish")}</small></span></a></div>
<form class="card rise" id="ct-f"><h3>${t("Перезвоним", "Qo‘ng‘iroq qilamiz")}</h3>
<div class="fx"><label class="fld"><span>${t("Имя", "Ism")}</span><input name="name" autocomplete="name" required></label><label class="fld"><span>${t("Телефон", "Telefon")}</span><input name="ph" type="tel" autocomplete="tel" inputmode="tel" placeholder="+998" required></label></div>
<label class="fld"><span>${t("Вопрос", "Savol")}</span><textarea name="q" placeholder="${t("Какая машина нужна и для чего", "Qanday mashina va nima uchun kerak")}"></textarea></label>
<button type="submit" class="btn btn-a" style="width:100%">${ICON.sms}<span>${t("Отправить", "Yuborish")}</span></button>
<p class="note" style="margin-top:10px">${t("На телефоне откроется SMS на ваш номер с готовым текстом, на компьютере текст скопируется.", "Telefonda tayyor matn bilan raqamingizga SMS ochiladi, kompyuterda matn nusxalanadi.")}</p></form></div>
</div></section>`;
}

function footer(l, t, to = "site") {
  return `<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l, to)}<p style="margin-top:16px">${t("Модели, цены, характеристики, фото, адрес и телефоны: ваш сайт samist.autoline.uz, 04.11.2026. Метки Autoline на фото с площадки. Заявки и цифры панели: демо.", "Modellar, narxlar, xususiyatlar, suratlar, manzil va telefonlar: samist.autoline.uz saytingiz, 04.11.2026. Suratlardagi Autoline belgilari maydondan. Arizalar va panel raqamlari: demo.")}</p></div>
<div><h4>${t("Сайт", "Sayt")}</h4><a href="${href(l, "site")}#lineup">${t("Техника", "Texnika")}</a><a href="${href(l, "site")}#credit" data-addon="credit">${t("Кредит", "Kredit")}</a><a href="${href(l, "site")}#service" data-addon="service">${t("Сервис", "Servis")}</a></div>
<div><h4>${t("Макет", "Maket")}</h4><a href="${href(l)}">${t("Первая страница", "Birinchi sahifa")}</a><a href="${href(l, "panel")}">${t("Админка", "Admin panel")}</a><a href="${href(l)}#offer">${t("Стоимость", "Narxi")}</a></div>
<div><h4>SAMIST AUTO</h4><a href="tel:${BRAND.tel}">${BRAND.phone}</a><a href="${BRAND.site}" target="_blank" rel="noopener">samist.autoline.uz</a><a href="https://devuz.studio" target="_blank" rel="noopener">DevUz Studio</a></div>
</div><div class="sm"><span>© 2026 SAMIST AUTO</span><span>${terms(l, t)}</span></div></div></footer>`;
}

/* Данные для site.js: каталог и подписи на языке страницы. */
function data(l, t) {
  return {
    l, tel: BRAND.tel, phone: BRAND.phone, legal: legal(l), addr: BRAND[l].addr, img: IMG, logo: LOGO_VB, scene: SCENE, cats: CATS.map((c) => [c.id, c[l]]),
    models: MODELS.map((m) => ({ id: m.id, name: m.name, cat: m.cat, kind: nm(m, l), isNew: m.isNew, year: m.year, uzs: m.uzs, usd: m.usd, hp: m.hp, kg: m.kg, m3: m.m3, seats: m.seats, tank: m.tank, fuel: l === "ru" ? m.fuel : m.spec.find((s) => s.k === "Топливо")?.vu || "", credit: m.credit, use: m.use, spec: m.spec.map((s) => [l === "ru" ? s.ru : s.uz, l === "ru" ? s.v : s.vu]), img: m.img, url: m.url })),
    t: {
      sum: t("сум", "so‘m"), mln: t("млн", "mln"), rz_range: t("от {a} до {b} сум", "{a} dan {b} so‘mgacha"), hello: t("Здравствуйте!", "Assalomu alaykum!"), sent_pc: t(`Заявка сохранена, текст скопирован. Отправьте его на ${BRAND.phone}`, `Ariza saqlandi, matn nusxalandi. Uni ${BRAND.phone} raqamiga yuboring`),
      mine: t("Моя заявка", "Mening arizam"), mine_note: t("Статус ставит менеджер в панели. Откройте админку макета, смените статус, и он появится здесь.", "Holatni menejer panelda qo‘yadi. Maket admin panelini oching, holatni o‘zgartiring, u shu yerda paydo bo‘ladi."),
      st0: t("Новая", "Yangi"), st1: t("В работе", "Ishda"), st2: t("Ждём вас", "Sizni kutamiz"), st3: t("Сделка", "Bitim"), st4: t("Отказ", "Rad etildi"),
      k_buy: t("Покупка", "Xarid"), k_credit: t("Кредит, лизинг", "Kredit, lizing"), k_drive: t("Тест-драйв", "Test-drayv"), k_trade: t("Трейд-ин", "Treyd-in"), k_service: t("Сервис", "Servis"), k_part: t("Запчасть", "Ehtiyot qism"), k_fleet: t("КП автопарку", "Avtoparkka taklif"), k_call: t("Звонок", "Qo‘ng‘iroq"),
      upd: t("Наличие обновилось из панели", "Mavjudlik paneldan yangilandi"), sold: t("Продано", "Sotildi"), res: t("В резерве", "Rezervda"), new: t("Новый", "Yangi"), used: t("С пробегом", "Ishlatilgan"), credit_tag: t("кредит", "kredit"),
      n_hp: t("л.с.", "o.k."), n_kg: t("кг груза", "kg yuk"), n_m3: t("м³ кузов", "m³ kuzov"), n_seats: t("мест", "o‘rin"), n_tank: t("л бак", "l bak"),
      none: t("В этом разделе сейчас пусто", "Bu bo‘limda hozircha bo‘sh"), found: t("Найдено", "Topildi"), photo: t("фото", "surat"),
      want: t("Хочу эту машину", "Shu mashinani xohlayman"), to_credit: t("В кредит", "Kreditga"), to_drive: t("Тест-драйв", "Test-drayv"), to_cmp: t("Сравнить", "Taqqoslash"), in_cmp: t("В сравнении", "Taqqoslashda"), to_fleet: t("В КП", "Taklifga"),
      src: t("Цена и характеристики из вашего объявления:", "Narx va xususiyatlar e’loningizdan:"),
      t_buy: t("Интересует {m} за {p}. Подскажите по наличию и оформлению.", "{m} {p} ga qiziqtiradi. Mavjudligi va rasmiylashtirish bo‘yicha aytib bering."),
      t_credit: t("Хочу {m} в кредит или лизинг: цена {p}, взнос {dp}, срок {n} мес.", "{m} ni kredit yoki lizingga xohlayman: narx {p}, boshlang‘ich {dp}, muddat {n} oy."), t_credit_pay: t("По ставке {r}% выходит {pay} в месяц.", "{r}% stavkada oyiga {pay} chiqadi."),
      t_trade: t("Трейд-ин: моя {o}, {y} год, пробег {km} км. Хочу взамен {m}.", "Treyd-in: mening {o}, {y} yil, yurgani {km} km. Evaziga {m} xohlayman."),
      t_drive: t("Хочу посмотреть и проехать на {m}: {d}, {p}.", "{m} ni ko‘rib, haydab ko‘rmoqchiman: {d}, {p}."),
      t_service: t("Запись в сервис: {c}, пробег {km} км, нужно: {w}.", "Servisga yozilish: {c}, yurgani {km} km, kerak: {w}."), t_part: t("Нужна запчасть по VIN {v}: {p}.", "VIN {v} bo‘yicha ehtiyot qism kerak: {p}."),
      t_fleet: t("КП для {c}: {l}.", "{c} uchun tijorat taklifi: {l}."), t_call: t("{n} просит перезвонить. {q}", "{n} qo‘ng‘iroq qilishni so‘raydi. {q}"), q_default: t("Нужна консультация по технике.", "Texnika bo‘yicha maslahat kerak."),
      why_use: t("под вашу задачу", "vazifangizga mos"), why_near: t("ближе всего по задаче и бюджету", "vazifa va byudjetga eng yaqini"),
      cmp_n: t("В сравнении", "Taqqoslashda"), cmp_hint: t("Добавьте две или три машины кнопкой «Сравнить» в окне машины.", "Mashina oynasidagi «Taqqoslash» tugmasi bilan ikki yoki uchta mashina qo‘shing."),
      r_price: t("Цена", "Narx"), r_kind: t("Тип", "Turi"), r_fuel: t("Топливо", "Yoqilg‘i"), r_state: t("Состояние", "Holati"),
      mon: t("мес.", "oy"), rate_need: t("впишите ставку", "stavkani yozing"), pick_day: t("Выберите день и время", "Kun va vaqtni tanlang"),
      less: t("Меньше", "Kamroq"), more: t("Больше", "Ko‘proq"), open: t("Открыть", "Ochish"),
      kp: t("Коммерческое предложение", "Tijorat taklifi"), kp_co: t("Клиент", "Mijoz"), kp_m: t("Модель", "Model"), kp_q: t("Кол-во", "Soni"), kp_p: t("Цена", "Narx"), kp_s: t("Сумма", "Summa"), kp_tot: t("Итого", "Jami"),
      kp_note: t("Цены с площадки на дату предложения. Наличие и сроки подтверждает менеджер. Макет DevUz Studio.", "Narxlar taklif sanasidagi maydondan. Mavjudlik va muddatlarni menejer tasdiqlaydi. DevUz Studio maketi."),
    },
  };
}

function sitePage(l) {
  const t = T(l);
  const title = t("SAMIST AUTO · грузовики, автобусы и спецтехника Isuzu и FAW в Ташкенте", "SAMIST AUTO · Toshkentda Isuzu va FAW yuk mashinalari, avtobuslar va maxsus texnika");
  const desc = t(`${MODELS.length} моделей на площадке с ценами: фургоны, самосвал, бетоносмеситель, автобус, тягач. Кредит и лизинг, сервис и запчасти ISUZU.`, `Maydonda narxlari bilan ${MODELS.length} ta model: furgonlar, samosval, betonaralashtirgich, avtobus, shatakchi. Kredit va lizing, ISUZU servisi va ehtiyot qismlari.`);
  return `${head(l, title, desc)}
<script>(function(){var r=document.documentElement,calm=false;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)calm=true}catch(e){}try{var c=navigator.connection;if(c&&c.saveData)calm=true}catch(e){}if(navigator.deviceMemory&&navigator.deviceMemory<2)calm=true;if(calm)r.classList.add('calm')})()</script>
<link rel="preload" as="image" href="${SA}/seq/m/t1-00.webp" media="(orientation: portrait)">
<link rel="preload" as="image" href="${SA}/seq/d/t1-00.webp" media="(orientation: landscape)">
<style>${CSS}</style>
</head>
<body>
${LOGO_G}
<a class="vh" href="#lineup">${t("К технике", "Texnikaga o‘tish")}</a>
${header(l, t)}
<main>
${hero(l, t)}
${velo()}
${ryad(l, t)}
${scene(l, t)}
${lineup(l, t)}
${pickSec(l, t)}
${compareSec(l, t)}
${creditSec(l, t)}
${tradeSec(l, t)}
${driveSec(l, t)}
${serviceSec(l, t)}
${fleetSec(l, t)}
${botSec(l, t)}
${adminSec(l, t)}
${aboutSec(l, t)}
${seoSec(l, t)}
${contact(l, t)}
</main>
${footer(l, t)}
<a class="cfgb glass" href="${href(l)}#offer">${t("Конструктор", "Konstruktor")}</a>
<div class="cmp-bar glass" id="cmp-bar" data-addon="compare"><span></span><a class="btn btn-a btn-s" href="#compare">${ICON.cmp}<span>${t("Сравнить", "Taqqoslash")}</span></a></div>
<div class="dock glass" id="dock"><a class="btn btn-a" href="tel:${BRAND.tel}">${ICON.phone}<span>${t("Позвонить", "Qo‘ng‘iroq")}</span></a><a class="btn btn-g" href="#lineup">${ICON.truck}<span>${t("Техника", "Texnika")}</span></a></div>
<div class="rz" id="rz" role="dialog" aria-modal="true" aria-labelledby="rz-h"><div class="rz-bg"><img id="rz-bgi" alt=""></div><button type="button" class="rz-x" data-rzclose aria-label="${t("Закрыть", "Yopish")}">${ICON.close}</button><div class="rz-in" id="rz-in"><div class="wrap"><div class="rz-h"><div><p class="kick"><i></i>${t("Раздел площадки", "Maydon bo‘limi")}</p><h2 id="rz-h"></h2><p id="rz-s"></p></div></div><div class="rz-tabs chips" id="rz-tabs"></div><div class="grid" id="rz-grid"></div></div></div></div>
<div class="mdl" id="mdl" role="dialog" aria-modal="true" aria-labelledby="mdl-h"><div class="mdl-sh" data-mclose></div><div class="mdl-box"><button type="button" class="mdl-x" data-mclose aria-label="${t("Закрыть", "Yopish")}">${ICON.close}</button><div id="mdl-in"></div></div></div>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="shh"><div class="sh" data-close></div><div class="box"><div class="bh"><b id="shh"></b><button type="button" class="x" data-close aria-label="${t("Закрыть", "Yopish")}">${ICON.close}</button></div><div class="bb" id="shb"></div></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="sm-scene">${JSON.stringify({ img: SA, base: BASE_URL, frames: ORDER, fps: SEQ.fps })}</script>
<script>
${SCENE_JS}</script>
<script type="application/json" id="sm-data">${JSON.stringify(data(l, t)).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}

/* ── Первая страница: залёт в знак, выбор, конструктор DevUz ─────── */
function offer(l, t) {
  return `<section class="sec" id="offer"><div class="wrap">
<p class="kick"><i></i>${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</p>
<h2 class="h2">${t("Сайт <b>по этому макету</b>", "Shu maket <b>bo‘yicha sayt</b>")}</h2>
<p class="lead">${t(`48 часов с первого открытия макета: сайт ${usd(BASE.promo)} вместо ${usd(BASE.price)}. Десять допов включаются тумблером, и их блок на сайте тут же появляется или пропадает.`, `Maket birinchi ochilganidan 48 soat: sayt ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}. O‘nta qo‘shimcha tumbler bilan yoqiladi va ularning bloki saytda darhol paydo bo‘ladi yoki yo‘qoladi.`)}</p>
<div class="cst"><div>
<div class="base"><div class="hd"><b>${esc(BASE[l].t)}</b><span class="pp"><s>${usd(BASE.price)}</s>${usd(BASE.promo)}</span></div><p>${esc(BASE[l].d)}</p></div>
<div class="adds">${ADDONS.map((a) => `<label class="add"><input type="checkbox" data-add="${a.id}" checked><span class="sw" aria-hidden="true"></span><span><b>${esc(a[l].t)}</b>${a.star ? `<span class="star">${t("берут первым", "birinchi oladilar")}</span>` : ""}<p>${esc(a[l].e)}</p><small>${esc(a[l].who)}</small></span><span class="ap">${usd(a.price)}</span></label>`).join("")}</div>
</div>
<aside class="sum glass" aria-live="polite">
<div class="row"><span>${t("Сайт", "Sayt")}</span><span>${usd(BASE.promo)}</span></div>
<div class="row"><span>${t("Допы", "Qo‘shimchalar")} <span id="addn"></span></span><span id="adds">0 $</span></div>
<div class="tot"><span>${t("Итого", "Jami")}</span><b id="total">${usd(ALL)}</b></div>
<p style="margin:8px 0 0;color:var(--mu);font-size:14px">${t("Цена сайта держится:", "Sayt narxi amal qiladi:")}</p>
<div class="timer"><span><b id="th">48</b><small>${t("часов", "soat")}</small></span><span><b id="tm">00</b><small>${t("минут", "daqiqa")}</small></span><span><b id="ts">00</b><small>${t("секунд", "soniya")}</small></span></div>
<div class="ctrl"><button type="button" class="btn btn-g btn-s" id="allon">${t("Всё из макета", "Maketdagi hammasi")}</button><button type="button" class="btn btn-g btn-s" id="alloff">${t("Только сайт", "Faqat sayt")}</button></div>
<button type="button" class="btn btn-g" id="copy">${ICON.copy}<span>${t("Скопировать состав", "Tarkibni nusxalash")}</span></button>
<a class="btn btn-a" href="${DEVUZ}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
</aside></div>
</div></section>`;
}

function landPage(l) {
  const t = T(l);
  const site = [
    t("Залёт в ваш знак и ночная дорога, нарисованные кодом", "Kod bilan chizilgan belgingizga uchib kirish va tungi yo‘l"),
    t("Первым экраном D-MAX по прокрутке: покрывало, детали, фара, выезд, с вашим знаком", "Birinchi ekranda aylantirishdagi D-MAX: parda, detallar, fara, yo‘lga chiqish, belgingiz bilan"),
    t(`Разделы площадки: машина выезжает вперёд, за ней ${MODELS.length} моделей с ценами`, `Maydon bo‘limlari: mashina oldinga chiqadi, ortidan narxlari bilan ${MODELS.length} model`),
    t("Подбор, сравнение, кредит, трейд-ин, сервис, КП", "Tanlash, taqqoslash, kredit, treyd-in, servis, tijorat taklifi"),
  ];
  const pan = [
    t("Вход кодом из Telegram, «стекло» поверх вашей площадки", "Telegram kodi bilan kirish, maydoningiz ustida «shisha»"),
    t("Заявка с сайта первой строкой, статус видит покупатель", "Saytdan ariza birinchi qatorda, holatni xaridor ko‘radi"),
    t("Цена и «продано» меняются на сайте сразу", "Narx va «sotildi» saytda darhol o‘zgaradi"),
    t("Роли, история действий, выгрузка CSV", "Rollar, harakatlar tarixi, CSV yuklab olish"),
  ];
  const li = (a) => `<ul class="feat">${a.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>`;
  const steps = [
    t("Откройте сайт, нажмите на любую машину и «Хочу эту машину».", "Saytni oching, istalgan mashinani va «Shu mashinani xohlayman»ni bosing."),
    t("Откройте админку, войдите кодом 1234: ваша заявка первой строкой. Нажмите «Взять», потом «Ждём клиента».", "Admin panelni oching, 1234 kodi bilan kiring: arizangiz birinchi qatorda. «Olish», keyin «Mijozni kutamiz»ni bosing."),
    t("Вернитесь на сайт: в «Моя заявка» уже «Ждём вас». В «Наличии» поставьте машине «Продано», и на сайте она станет проданной.", "Saytga qayting: «Mening arizam»da allaqachon «Sizni kutamiz». «Mavjudlik»da mashinaga «Sotildi» qo‘ying, saytda u sotilgan bo‘ladi."),
  ];
  const ld = { base: BASE.promo, hours: OFFER_HOURS, logo: LOGO_VB, aim: AIM, count: MODELS.length, add: ADDONS.map((a) => ({ id: a.id, p: a.price, t: a[l].t })), t: { copied: t("Состав скопирован", "Tarkib nusxalandi"), tot: t("Итого", "Jami") } };
  return `${head(l, t("SAMIST AUTO · макет сайта и панели · DevUz Studio", "SAMIST AUTO · sayt va panel maketi · DevUz Studio"), t("Макет для SAMIST AUTO: сайт с техникой и ценами вашей площадки и панель заявок. Конструктор цены.", "SAMIST AUTO uchun maket: maydoningiz texnikasi va narxlari bilan sayt va arizalar paneli. Narx konstruktori."))}
<link rel="preload" as="image" href="${IMG}/salon.webp">
<style>${CSS}</style>
</head>
<body>
${dzIntroSolo(l)}
${LOGO_G}
<header class="top"><div class="top-in glass">
${LOGO(l, "")}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}"><a href="#choose">${t("Что посмотреть", "Nimani ko‘rish")}</a><a href="#try">${t("Как проверить", "Qanday tekshirish")}</a><a href="#offer">${t("Стоимость", "Narxi")}</a></nav>
${langs(l, "")}
<a class="btn btn-g btn-s" href="${href(l, "site")}">${t("Сайт", "Sayt")}</a>
<a class="btn btn-a btn-s" aria-label="${t("Админка", "Admin panel")}" href="${href(l, "panel")}">${ICON.panel}</a>
</div></header>
<main>
<section class="hs" id="fly" aria-label="${t("Залёт в знак SAMIST AUTO", "SAMIST AUTO belgisiga uchib kirish")}"><div class="hs-st">
<div class="fl-mark"><svg viewBox="0 0 ${LOGO_VB[0]} ${LOGO_VB[1]}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="SAMIST AUTO"><use href="#sm-g"/></svg></div>
<div class="fl-top"><p class="kick"><i></i>${t("Макет DevUz Studio для SAMIST AUTO", "SAMIST AUTO uchun DevUz Studio maketi")}<i></i></p><p>${t("Листайте: камера войдёт в букву «A» вашего знака.", "Aylantiring: kamera belgingizdagi «A» harfiga kiradi.")}</p></div>
<div class="fl-road" aria-hidden="true">${ROAD}</div>
<div class="fl-truck" aria-hidden="true">${TRUCK}<div class="fl-glow"><i></i><i></i></div></div>
<div class="fl-count" aria-hidden="true"><b>0</b><span>${t("моделей на вашей площадке", "maydoningizdagi modellar")}</span></div>
<div class="fl-iris" aria-hidden="true"><img src="${IMG}/salon.webp" width="1000" height="750" alt=""></div>
<div class="fl-shade" aria-hidden="true"></div>
<div class="wrap fl-tx"><p class="kick"><i></i>Isuzu · FAW · ${t("Ташкент, кольцевая, 120А", "Toshkent, aylanma yo‘l, 120A")}</p>
<h1>${t("Вся площадка <em>SAMIST AUTO</em> в кармане покупателя", "Butun <em>SAMIST AUTO</em> maydoni xaridor cho‘ntagida")}</h1>
<p class="lead">${t("Машины с ценами и фото, кредит до звонка, тест-драйв в два касания и панель, где видно каждую заявку.", "Narx va suratli mashinalar, qo‘ng‘iroqdan oldin kredit, ikki bosishda test-drayv va har bir ariza ko‘rinadigan panel.")}</p>
<a class="btn btn-a" href="#choose">${t("Смотреть макет", "Maketni ko‘rish")}${ICON.arrow}</a></div>
<div class="hs-hint" aria-hidden="true"><span>${t("Листайте", "Aylantiring")}</span><i></i></div>
</div></section>
<section class="sec" id="choose"><div class="wrap">
<p class="kick rise"><i></i>${t("Сайт и панель на ваших данных", "Ma’lumotlaringizdagi sayt va panel")}</p>
<h2 class="h2 rise">${t("Что посмотреть <b>первым</b>", "Avval <b>nimani ko‘rish</b>")}</h2>
<p class="lead rise">${t("Это работающий макет на ваших машинах, ценах и фото с samist.autoline.uz. Сайт и панель связаны: заявка с сайта приходит в панель, статус из панели видит покупатель.", "Bu samist.autoline.uz’dagi mashinalaringiz, narxlaringiz va suratlaringizdagi ishlaydigan maket. Sayt va panel bog‘langan: saytdan ariza panelga keladi, paneldagi holatni xaridor ko‘radi.")}</p>
<div class="choices" style="grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))">
<a class="choice rise" href="${href(l, "site")}"><span class="ch-k">${t("Для покупателей", "Xaridorlar uchun")}</span><b>${t("Сайт", "Sayt")}</b>
<span class="ch-pic"><img src="${SA}/poster-a-16.webp" width="1920" height="1072" alt="${t("Isuzu D-MAX на подиуме, сцена сайта", "Podiumdagi Isuzu D-MAX, sayt sahnasi")}" loading="lazy"></span>
${li(site)}<span class="btn btn-a">${t("Открыть сайт", "Saytni ochish")}${ICON.arrow}</span></a>
<a class="choice rise" href="${href(l, "panel")}"><span class="ch-k">${t("Для вас и менеджеров", "Siz va menejerlar uchun")}</span><b>${t("Панель", "Panel")}</b>
<span class="ch-pic"><img src="${IMG}/salon-s.webp" width="640" height="480" alt="${t("Автосалон на кольцевой, 120А", "Aylanma yo‘l, 120A dagi avtosalon")}" loading="lazy"></span>
${li(pan)}<span class="btn btn-g">${t("Открыть панель", "Panelni ochish")}${ICON.arrow}</span></a>
</div>
</div></section>
<section class="sec alt" id="try"><div class="wrap">
<p class="kick rise"><i></i>${t("Как проверить за минуту", "Bir daqiqada qanday tekshirish")}</p>
<h2 class="h2 rise">${t("Сайт и панель <b>связаны</b>", "Sayt va panel <b>bog‘langan</b>")}</h2>
<ol class="ol">${steps.map((s) => `<li class="rise">${s}</li>`).join("")}</ol>
<div class="hero-act rise"><a class="btn btn-a" href="${href(l, "site")}#lineup">${t("Начать с техники", "Texnikadan boshlash")}${ICON.arrow}</a></div>
</div></section>
${offer(l, t)}
</main>
${footer(l, t, "")}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="sm-land">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<script>
${LAND_JS}</script>
</body>
</html>`;
}

/* ── Панель: вход, «стекло» V7 + CRM ──────────────────────────── */
(function checkDict() {
  const keys = new Set([...PANEL_JS.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  for (const k of ["tab_", "k_", "s_"]) keys.delete(k);
  for (const k of ["tab_sum", "tab_req", "tab_stock", "tab_svc", "tab_log", "st_new", "st_work", "st_wait", "st_deal", "st_no", "k_buy", "k_credit", "k_drive", "k_trade", "k_service", "k_part", "k_fleet", "k_call", "s_in", "s_res", "s_sold"]) keys.add(k);
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
    l, sum: l === "ru" ? "сум" : "so‘m", site: href(l, "site"), home: href(l), img: IMG, ui, logo: LOGO_VB, addr: BRAND[l].addr,
    models: MODELS.map((m) => [m.id, m.name, nm(m, l), m.uzs, m.img[0]]),
    /* Демо-клиенты: две компании — ловушки, при показе свои у каждого клиента. */
    names: l === "ru" ? ["Азиз", "Мадина", "Тимур", "Камола", "Сардор", "Нигора", "Рустам", "Дилноза", "Бобур", "Лола", "Жасур", "Севара"] : ["Aziz", "Madina", "Timur", "Kamola", "Sardor", "Nigora", "Rustam", "Dilnoza", "Bobur", "Lola", "Jasur", "Sevara"],
    corp: l === "ru" ? ["ООО «[[t:0]] Logistic»", "ООО «[[t:1]] Qurilish»"] : ["«[[t:0]] Logistic» MChJ", "«[[t:1]] Qurilish» MChJ"],
  };
  return `${head(l, t("Панель SAMIST AUTO · демо", "SAMIST AUTO paneli · demo"), t("Панель SAMIST AUTO: заявки с сайта, наличие и цены, сервис, роли, история, выгрузки. Демо-данные.", "SAMIST AUTO paneli: saytdan arizalar, mavjudlik va narxlar, servis, rollar, tarix, yuklab olish. Demo ma’lumotlar."))}
<style>${BASE_CSS}${PANEL_CSS}</style>
</head>
<body class="pn">
${LOGO_G}
<div class="pn-bg" aria-hidden="true"><img src="${IMG}/salon-b.webp" alt="" width="480" height="360"></div>
<div id="app"></div>
<footer class="pn-foot">${t("Макет DevUz Studio, демо-данные. Пользуясь макетом, вы принимаете", "DevUz Studio maketi, demo ma’lumotlar. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
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
    const js = (v.match(/<script type="application\/json"[\s\S]*?<\/script>/g) || []).join("");
    const mj = js.match(/[^\s<>"]*[А-Яа-яЁё][^\s<>"]*/g);
    if (mj) throw new Error(`${k}: кириллица в данных узбекской страницы: ${[...new Set(mj)].slice(0, 12).join(" ")}`);
  }
  if (/[\u2014\u2013]/.test(v.replace(/<script(?! type="application\/json")[\s\S]*?<\/script>/g, ""))) throw new Error(`${k}: длинное тире на странице`);
}
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/* Сборка для сервера (lib/proto/bundles): стили, скрипты и знак один раз. */
const parts = { SJ: `<script>\n${SCENE_JS}</script>`, J: `<script>\n${JS}</script>`, C: `<style>${CSS}</style>`, PC: `<style>${BASE_CSS}${PANEL_CSS}</style>`, PJ: `<script>\n${PANEL_JS}</script>`, LJ: `<script>\n${LAND_JS}</script>`, G: LOGO_G };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const [name, part] of Object.entries(parts)) p = p.split(part).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "samist.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(10), v.length);
