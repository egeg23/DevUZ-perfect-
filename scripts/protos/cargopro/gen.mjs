import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { LANGS, COMPANY, SERVICES, CUSTOMS, FACTS, PARTNERS, HUBS, VELO } from "./data.mjs";
import { BASE, ADDONS, OFFER_HOURS, ALL, MODULES, ALL_MODULES } from "./plan.mjs";
import { LANES, EXTRA, FX, DIM } from "./tariffs.mjs";
import { PANEL_UI } from "./panel-ui.mjs";
import { DISPATCH_UI } from "./dispatch-ui.mjs";

/*
 * Макет CARGO PRO GROUP (cargoprogroup.uz), 31.10.2026: международная
 * логистика из Ташкента. Страницы на ru и uz:
 *
 *   ""    — видео DevUz → залёт камерой в их знак по прокрутке (кадры
 *           Higgsfield, зашифрованы, scene.py) → выбор «Сайт» / «Админка» →
 *           как проверить → конструктор «Предложение DevUz Studio» (plan.mjs);
 *   site  — первый экран с быстрым расчётом, бегущая строка, схема маршрутов
 *           по прокрутке, шесть услуг, конструктор тарифов (tariffs.mjs),
 *           отслеживание, таможня, склады, кабинет, бот, партнёры, вопросы,
 *           контакты;
 *   panel — панель заявок и грузов по эталону Greenwell;
 *   dispatch — диспетчерская (отдельный модуль, MODULES в plan.mjs):
 *           распределение грузов по машинам, водители на карте, рейсы.
 *
 * Услуги, партнёры, склады, контакты — только с их сайта (data.mjs). Ставки
 * калькулятора — середина рынка и предложение DevUz, так и подписано. Клиенты,
 * накладные и статусы — демо. Заявка ничего не отправляет наружу: ложится в
 * браузер и видна в панели, письмо им открывается с готовым текстом.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/cargopro";
// Комментарии уходят, метка числа `/*~*/` остаётся: её снимает отпечаток при показе.
const strip = (s) => s.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");
const CSS = strip(readFileSync(DIR + "site.css", "utf8")).replace(/\n\s*/g, "");
const JS = strip(readFileSync(DIR + "site.js", "utf8")).replace(/\n\s*\n/g, "\n");
const LAND_JS = strip(readFileSync(DIR + "land.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_JS = strip(readFileSync(DIR + "panel.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_CSS = strip(readFileSync(DIR + "panel.css", "utf8")).replace(/\n\s*/g, "");
const DISP_JS = strip(readFileSync(DIR + "dispatch.js", "utf8")).replace(/\n\s*\n/g, "\n");
const DISP_CSS = strip(readFileSync(DIR + "dispatch.css", "utf8")).replace(/\n\s*/g, "");
const BASE_URL = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Onest:wght@400;700&display=swap";
const KEY = { ru: "", uz: "uz" };
const DEVUZ = "https://t.me/Devuz_studio_bot?start=cargopro";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, p = "") => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/" + (p ? p : "");
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const usd = (n) => `${fmt(n)}\u00a0$`;
/* Слова заголовка по одному; <em> ставится на каждое слово, иначе градиент рвётся между словами. */
const words = (txt) => { let em = false; return txt.split(" ").map((w) => { const open = w.startsWith("<em>"), shut = w.includes("</em>"); if (open) em = true; const bare = w.replace(/<\/?em>/g, ""); const out = `<span class="w"><span>${em ? `<em>${bare}</em>` : bare}</span></span>`; if (shut) em = false; return out; }).join(" "); };

const I = (dd) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  back: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  panel: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/>'),
  route: I('<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  doc: I('<path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
  box: I('<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>'),
  calc: I('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'),
  search: I('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  air: I('<path d="M10.5 21 12 17l-1-5-7 3-1-2 7-5V4a2 2 0 0 1 4 0v4l7 5-1 2-7-3-1 5 1.5 4Z"/>'),
  auto: I('<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17.5" cy="17.5" r="1.6"/>'),
  rail: I('<rect x="6" y="3" width="12" height="13" rx="3"/><path d="M6 10h12M9 20l-2 2M15 20l2 2M9 13h.01M15 13h.01"/>'),
  sea: I('<path d="M3 17c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0M5 14l-1-4h16l-1 4M8 10V6h8v4M12 3v3"/>'),
  multi: I('<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6"/>'),
  customs: I('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6Z"/><path d="m9 12 2 2 4-4"/>'),
};
const MODE_ICON = { air: ICON.air, auto: ICON.auto, rail: ICON.rail, sea: ICON.sea };
const LOGO = (l, to = "site") => `<a class="logo" href="${href(l, to)}" aria-label="CARGO PRO GROUP"><img src="${IMG}/logo.webp" width="670" height="249" alt="CARGO PRO GROUP"></a>`;

/* Иллюстрации услуг — кодом, линиями в цветах знака. */
const ILL = {
  air: `<svg viewBox="0 0 240 120" aria-hidden="true"><path d="M10 96 C 80 90, 150 60, 230 14" fill="none" stroke="url(#gArc)" stroke-width="2" stroke-dasharray="5 7"/><g transform="translate(150 40) rotate(-22)"><path d="M-40 0h70c8 0 14 3 14 6s-6 6-14 6h-70l-8-6z" fill="#e8ecf8"/><path d="M-6 0l-20-26h10l26 26zM-6 12l-20 22h10l26-22zM-40 0l-10-14h8l12 14z" fill="#c9d1ea"/><circle cx="22" cy="5" r="1.6" fill="#0c1329"/><circle cx="14" cy="5" r="1.6" fill="#0c1329"/></g></svg>`,
  auto: `<svg viewBox="0 0 240 120" aria-hidden="true"><path d="M0 104h240" stroke="#2b3666" stroke-width="2"/><path d="M0 104h240" stroke="url(#gArc)" stroke-width="2" stroke-dasharray="14 18" class="road"/><rect x="40" y="38" width="120" height="56" rx="4" fill="#e5352b"/><rect x="48" y="46" width="104" height="40" rx="2" fill="none" stroke="#ff8a6e" stroke-width="1.5"/><path d="M160 56h34l20 20v18h-54z" fill="#e8ecf8"/><path d="M170 62h20l12 14h-32z" fill="#0c1329"/><circle cx="72" cy="98" r="9" fill="#0c1329" stroke="#c9d1ea" stroke-width="3"/><circle cx="186" cy="98" r="9" fill="#0c1329" stroke="#c9d1ea" stroke-width="3"/></svg>`,
  rail: `<svg viewBox="0 0 240 120" aria-hidden="true"><path d="M0 106h240M0 112h240" stroke="#2b3666" stroke-width="2"/>${[0, 1, 2].map((i) => `<rect x="${12 + i * 74}" y="52" width="68" height="44" rx="3" fill="${["#f08a24", "#222d4b", "#f6c445"][i]}" stroke="#0c1329" stroke-width="2"/><circle cx="${26 + i * 74}" cy="100" r="5" fill="#c9d1ea"/><circle cx="${66 + i * 74}" cy="100" r="5" fill="#c9d1ea"/>`).join("")}</svg>`,
  sea: `<svg viewBox="0 0 240 120" aria-hidden="true"><path d="M30 76h180l-22 28H52z" fill="#e8ecf8"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${52 + i * 28}" y="${52 - (i % 2) * 14}" width="26" height="${24 + (i % 2) * 14}" fill="${["#f08a24", "#e5352b", "#f6c445", "#3a4a8a", "#f08a24"][i]}"/>`).join("")}<path d="M0 110c20 6 40 6 60 0s40-6 60 0 40 6 60 0 40-6 60 0" fill="none" stroke="url(#gArc)" stroke-width="2"/></svg>`,
  multi: `<svg viewBox="0 0 240 120" aria-hidden="true"><path d="M20 90 C 70 90, 70 30, 120 30 S 170 90, 220 90" fill="none" stroke="url(#gArc)" stroke-width="3" stroke-dasharray="6 8"/><circle cx="20" cy="90" r="12" fill="#222d4b" stroke="#f6c445" stroke-width="2"/><circle cx="120" cy="30" r="12" fill="#222d4b" stroke="#f08a24" stroke-width="2"/><circle cx="220" cy="90" r="12" fill="#222d4b" stroke="#e5352b" stroke-width="2"/></svg>`,
  customs: `<svg viewBox="0 0 240 120" aria-hidden="true"><rect x="60" y="14" width="96" height="96" rx="6" fill="#e8ecf8"/><path d="M76 38h64M76 54h64M76 70h40" stroke="#8e98ba" stroke-width="4" stroke-linecap="round"/><circle cx="160" cy="84" r="26" fill="none" stroke="#e5352b" stroke-width="4"/><path d="m148 84 9 9 16-18" fill="none" stroke="#e5352b" stroke-width="4" stroke-linecap="round"/></svg>`,
};
const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="gArc" x1="0" x2="1"><stop offset="0" stop-color="#f6c445"/><stop offset=".5" stop-color="#f08a24"/><stop offset="1" stop-color="#e5352b"/></linearGradient><linearGradient id="gArc2" x1="0" x2="1"><stop offset="0" stop-color="#e5352b"/><stop offset=".5" stop-color="#f08a24"/><stop offset="1" stop-color="#f6c445"/></linearGradient></defs></svg>`;

/* Схема: Ташкент и пять направлений. Координаты условные, не карта. */
const TAS = [560, 250];
const PTS = { cn: [880, 320, "Гуанчжоу", "Guanchjou"], tr: [170, 230, "Стамбул", "Istanbul"], ae: [360, 450, "Дубай", "Dubay"], in: [640, 500, "Дели", "Dehli"], eu: [90, 110, "Европа", "Yevropa"] };
const arcPath = ([x, y]) => { const [tx, ty] = TAS, mx = (x + tx) / 2, my = Math.min(y, ty) - 90 - Math.abs(x - tx) * 0.12; return `M${x} ${y} Q ${mx} ${my} ${tx} ${ty}`; };
/* Сетка точек «суши» для схемы — кодом, без чужой карты. */
function dots(w, h, step = 26) {
  const out = [];
  for (let x = 20; x < w; x += step) for (let y = 20; y < h; y += step) {
    const v = Math.sin(x * 0.011) * Math.cos(y * 0.017) + Math.sin((x + y) * 0.006);
    if (v > 0.2) out.push(`<circle cx="${x}" cy="${y}" r="2.2"/>`);
  }
  return `<g class="land">${out.join("")}</g>`;
}

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
<meta name="theme-color" content="#0c1329">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}

function header(l, t) {
  const nav = [["routes", t("Маршруты", "Yo‘nalishlar")], ["services", t("Услуги", "Xizmatlar")], ["calc", t("Расчёт", "Hisob")], ["track", t("Где груз", "Yuk qayerda")], ["customs", t("Таможня", "Bojxona")], ["contact", t("Контакты", "Kontaktlar")]];
  return `<header class="top"><div class="mbar"><a href="${href(l)}">${ICON.back}<span>${t("Макет для CARGO PRO GROUP", "CARGO PRO GROUP uchun maket")}</span></a><a class="mb-adm" href="${href(l, "panel")}">${ICON.panel}<span>${t("Админка", "Admin panel")}</span>${ICON.arrow}</a></div><div class="top-in glass">
${LOGO(l)}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([id, n]) => `<a href="#${id}">${n}</a>`).join("")}</nav>
<button type="button" class="mine" id="mine" data-addon="track">${ICON.box}<span>${t("Мои заявки", "Arizalarim")}</span></button>
<div class="langs">${LANGS.map((x) => `<a href="${href(x, "site")}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<a class="btn btn-a btn-s" href="tel:${COMPANY.tel}">${ICON.phone}<span>${t("Позвонить", "Qo‘ng‘iroq")}</span></a>
</div></header>`;
}

function heroArcs() {
  return `<svg viewBox="0 0 1000 700" aria-hidden="true" focusable="false">${dots(1000, 700, 30)}
${Object.values(PTS).map((p) => `<path class="arc" d="${arcPath(p)}"/>`).join("")}
${Object.values(PTS).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff"/>`).join("")}
<circle class="hubdot" cx="${TAS[0]}" cy="${TAS[1]}" r="14" fill="none" stroke="#f6c445" stroke-width="2"/><circle cx="${TAS[0]}" cy="${TAS[1]}" r="8" fill="#f6c445"/></svg>`;
}

function hero(l, t) {
  const lanes = LANES.map((x) => `<option value="${x.id}">${esc(x[l])}</option>`).join("");
  return `<section class="hero" id="top" aria-label="CARGO PRO GROUP">
<div class="hero-bg" aria-hidden="true"><div class="ph" data-par="0.18"><img id="hubimg" alt=""></div><div class="arcs" data-par="0.08">${heroArcs()}</div></div>
<div class="wrap"><div class="hero-in">
<p class="kick rise"><i></i>${esc(FACTS[l].agent)}</p>
<h1>${words(t("Грузы в&nbsp;Ташкент и&nbsp;из&nbsp;Ташкента <em>авиа, авто, ж/д и&nbsp;морем</em>", "Toshkentga va Toshkentdan yuklar <em>avia, avto, temir yo‘l va dengiz orqali</em>"))}</h1>
<p class="hsub rise">${esc(FACTS[l].lead)} ${t("Таможенное оформление, склады в ОАЭ, Узбекистане и Индии.", "Bojxona rasmiylashtiruvi, BAA, O‘zbekiston va Hindistonda omborlar.")}</p>
<form class="qc glass rise" id="qc" action="#calc"><div class="mchips" role="group" aria-label="${t("Вид транспорта", "Transport turi")}">${["air", "auto", "rail", "sea"].map((m, i) => `<button type="button" data-qm="${m}" aria-pressed="${i === 0}">${MODE_ICON[m]}<span>${esc(modeName(m, l))}</span></button>`).join("")}</div>
<div class="qc-r"><label class="fld"><span>${t("Откуда", "Qayerdan")}</span><select id="qdir">${lanes}</select></label><label class="fld"><span>${t("Вес, кг", "Og‘irlik, kg")}</span><input id="qkg" type="number" inputmode="numeric" min="1" max="20000" value="250"></label><label class="fld"><span>${t("Куда", "Qayerga")}</span><input value="${t("Ташкент", "Toshkent")}" readonly></label><button class="btn btn-a" type="submit">${ICON.calc}<span>${t("Рассчитать", "Hisoblash")}</span></button></div></form>
<ul class="hstats">
<li class="glass rise"><b>4</b><span>${t("вида транспорта и мультимодальные", "transport turi va multimodal")}</span></li>
<li class="glass rise"><b>3</b><span>${t("склада: ОАЭ, Узбекистан, Индия", "ombor: BAA, O‘zbekiston, Hindiston")}</span></li>
<li class="glass rise"><b>8</b><span>${t("авиакомпаний-партнёров", "hamkor aviakompaniya")}</span></li>
<li class="glass rise"><b>UZS · USD · EUR · AED</b><span>${t("валюты расчёта", "hisob-kitob valyutalari")}</span></li>
</ul>
</div></div></section>`;
}
function modeName(m, l) {
  return { air: ["Авиа", "Avia"], auto: ["Авто", "Avto"], rail: ["Ж/д", "Temir yo‘l"], sea: ["Море", "Dengiz"] }[m][l === "ru" ? 0 : 1];
}

function velo(l) {
  const a = VELO[l], b = PARTNERS;
  const row = (arr, cls) => `<div class="row${cls}">${[0, 1, 2].map(() => arr.map((x) => `<span>${esc(x)}</span>`).join("")).join("")}</div>`;
  return `<div class="velo" aria-hidden="true">${row(a, "")}${row(b, " rev")}</div>`;
}

function routes(l, t) {
  const pts = Object.entries(PTS);
  return `<section class="routes" id="routes" aria-label="${t("Маршруты", "Yo‘nalishlar")}"><div class="routes-st"><div class="wrap"><div class="routes-in">
<div class="rmap" aria-hidden="true"><svg viewBox="0 0 1000 700">${dots(1000, 700)}
${pts.map(([id, p]) => `<path class="ln dim" data-ln="${id}" d="${arcPath(p)}"/>`).join("")}
${pts.map(([id, [x, y, ru, uz]]) => `<circle class="city" cx="${x}" cy="${y}" r="7"/><text class="tag" x="${x + 12}" y="${y + 5}">${l === "ru" ? ru : uz}</text>`).join("")}
<circle cx="${TAS[0]}" cy="${TAS[1]}" r="12" fill="#f6c445"/><circle class="hubdot" cx="${TAS[0]}" cy="${TAS[1]}" r="14" fill="none" stroke="#f6c445" stroke-width="2"/><text class="tag hub" x="${TAS[0] + 18}" y="${TAS[1] - 14}">${t("Ташкент", "Toshkent")}</text>
<g class="veh" id="veh"><circle r="20" fill="#0c1329" stroke="#f08a24" stroke-width="2"/><g transform="translate(-11 -11) scale(.92)" stroke="#f6c445" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 21 12 17l-1-5-7 3-1-2 7-5V4a2 2 0 0 1 4 0v4l7 5-1 2-7-3-1 5 1.5 4Z"/></g></g>
</svg></div>
<div><p class="kick"><i></i>${t("Маршруты", "Yo‘nalishlar")}</p>
<h2 class="h2">${t("Пять направлений <b>в&nbsp;один Ташкент</b>", "Beshta yo‘nalish <b>bitta Toshkentga</b>")}</h2>
<p class="lead">${t("Листайте: камера идёт по каждому маршруту. Сроки и виды транспорта по направлению, расчёт ниже.", "Aylantiring: kamera har bir yo‘nalish bo‘ylab yuradi. Yo‘nalish bo‘yicha muddatlar va transport turlari, hisob pastda.")}</p>
<div class="rcard glass" style="margin-top:20px" aria-live="polite"><h3 id="rcn"></h3><p class="city" id="rcc"></p><ul class="rmodes" id="rcm"></ul><div class="rdots">${pts.map(() => "<i><b></b></i>").join("")}</div></div>
</div></div></div></div></section>`;
}

function services(l, t) {
  const mv = ["rise", "tilt", "pop", "slide", "lift", "flip"];
  return `<section class="sec" id="services"><div class="wrap">
<p class="kick rise"><i></i>${t("Услуги", "Xizmatlar")}</p>
<h2 class="h2 rise">${t("Любой груз, <b>любым транспортом</b>", "Har qanday yuk, <b>har qanday transportda</b>")}</h2>
<p class="lead rise">${t("Генеральные, опасные, негабаритные, с температурным режимом, промышленное оборудование и государственные проекты. Импорт и экспорт.", "Bosh, xavfli, gabaritdan tashqari, harorat rejimidagi yuklar, sanoat uskunalari va davlat loyihalari. Import va eksport.")}</p>
<div class="svc">${SERVICES.map((s, i) => `<article class="sv ${mv[i]}"><div class="ill">${ILL[s.id]}</div><h3>${esc(s[l].t)}</h3><p>${esc(s[l].d)}</p><a class="btn btn-g btn-s" href="#calc" data-mode="${s.id}">${s.id === "customs" ? t("Нужен декларант", "Deklarant kerak") : t("Рассчитать", "Hisoblash")}${ICON.arrow}</a></article>`).join("")}</div>
<ul class="kinds">${FACTS[l].kinds.map((k) => `<li class="pop">${esc(k)}</li>`).join("")}</ul>
</div></section>`;
}

function calc(l, t) {
  return `<section class="sec" id="calc" style="background:var(--bg2)"><div class="wrap">
<p class="kick rise"><i></i>${t("Конструктор тарифов", "Tariflar konstruktori")}</p>
<h2 class="h2 rise">${t("Сколько стоит доставка: <b>сразу, без звонка</b>", "Yetkazish qancha turadi: <b>darhol, qo‘ng‘iroqsiz</b>")}</h2>
<p class="lead rise">${t("Выберите направление и транспорт, подвиньте вес и объём, включите нужное. Сумма и срок считаются сразу, в валюте, в которой вам удобно платить.", "Yo‘nalish va transportni tanlang, og‘irlik va hajmni suring, keraklisini yoqing. Summa va muddat darhol, to‘lash qulay bo‘lgan valyutada hisoblanadi.")}</p>
<div class="tf"><div class="tfb">
<div><h3>${t("Откуда", "Qayerdan")}</h3><div class="dirs" id="dirs">${LANES.map((x, i) => `<button type="button" data-dir="${x.id}" aria-pressed="${i === 0}"><b>${esc(x[l])}</b><small>${esc(x.city[l])}</small></button>`).join("")}</div></div>
<div><h3>${t("Транспорт", "Transport")}</h3><div class="mchips" id="modes">${["air", "auto", "rail", "sea"].map((m, i) => `<button type="button" data-m="${m}" aria-pressed="${i === 0}">${MODE_ICON[m]}<span>${esc(modeName(m, l))}</span></button>`).join("")}</div></div>
<div id="bykg" class="rng"><label for="kg"><span>${t("Вес", "Og‘irlik")}</span><b id="kgv"></b></label><input type="range" id="kg" min="10" max="5000" step="10" value="250"><label for="m3"><span>${t("Объём", "Hajm")}</span><b id="m3v"></b></label><input type="range" id="m3" min="0.1" max="30" step="0.1" value="1.2"><p class="mnote" id="cw"></p></div>
<div id="bycont" hidden><h3>${t("Контейнер", "Konteyner")}</h3><div class="cont"><label><input type="radio" name="ct" value="c20">20′</label><label><input type="radio" name="ct" value="c40" checked>40′</label><label><span>${t("Сколько", "Nechta")}</span><input type="number" id="cn" min="1" max="20" value="1" style="width:64px;min-height:36px;border-radius:10px;border:1px solid var(--ln2);background:transparent;padding:4px 8px"></label></div></div>
<div><h3>${t("Дополнительно", "Qo‘shimcha")}</h3><div style="display:grid;gap:8px">
<label class="opt"><input type="checkbox" id="oins" checked><span class="sw"></span><span class="ot"><b>${t("Страхование груза", "Yukni sug‘urtalash")}</b><small>${t(`${String(EXTRA.ins.pct).replace(".", ",")}% стоимости, не меньше ${EXTRA.ins.min} $`, `qiymatning ${EXTRA.ins.pct}%, kamida ${EXTRA.ins.min} $`)}</small></span><span class="op" id="oinsp"></span><label class="fld"><span>${t("Стоимость груза, $", "Yuk qiymati, $")}</span><input type="number" id="val" min="0" step="100" value="12000" inputmode="numeric"></label></label>
<label class="opt"><input type="checkbox" id="ocus" checked><span class="sw"></span><span class="ot"><b>${t("Таможенное оформление", "Bojxona rasmiylashtiruvi")}</b><small>${t("декларант, ГТД; пошлины и НДС по закону, отдельно", "deklarant, BYuD; bojlar va QQS qonun bo‘yicha, alohida")}</small></span><span class="op">${usd(EXTRA.customs)}</span></label>
<label class="opt"><input type="checkbox" id="odoor"><span class="sw"></span><span class="ot"><b>${t("До двери по Ташкенту", "Toshkent bo‘ylab eshikkacha")}</b><small>${t("со склада в Ташкенте до вашего адреса", "Toshkentdagi ombordan manzilingizgacha")}</small></span><span class="op" id="odoorp"></span></label>
<label class="opt"><input type="checkbox" id="ocons"><span class="sw"></span><span class="ot"><b>${t("Консолидация на складе", "Omborda konsolidatsiya")}</b><small>${t("соберём товар от нескольких поставщиков в одну отправку: ОАЭ, Индия, Узбекистан", "bir nechta yetkazib beruvchining tovarini bitta jo‘natmaga yig‘amiz: BAA, Hindiston, O‘zbekiston")}</small></span><span class="op">${usd(EXTRA.cons)} ${t("за место", "joy uchun")}</span><label class="fld"><span>${t("Поставщиков", "Yetkazib beruvchilar")}</span><input type="number" id="consn" min="1" max="20" value="3" inputmode="numeric"></label></label>
<label class="opt"><input type="checkbox" id="odng"><span class="sw"></span><span class="ot"><b>${t("Опасный груз или температурный режим", "Xavfli yuk yoki harorat rejimi")}</b><small>${t("отдельная упаковка, документы и место", "alohida qadoq, hujjatlar va joy")}</small></span><span class="op">+${EXTRA.danger}%</span></label>
</div></div>
</div>
<aside class="tsum glass" aria-live="polite"><div class="cur" role="group" aria-label="${t("Валюта", "Valyuta")}"><button type="button" data-cur="USD" aria-pressed="true">USD</button><button type="button" data-cur="UZS" aria-pressed="false">UZS</button><button type="button" data-cur="EUR" aria-pressed="false" data-addon="fx">EUR</button><button type="button" data-cur="AED" aria-pressed="false" data-addon="fx">AED</button></div>
<div id="tsum"></div>
<p class="days">${ICON.clock}<span id="tdays"></span></p>
<button type="button" class="btn btn-a" id="send">${ICON.mail}<span>${t("Отправить заявку", "Ariza yuborish")}</span></button>
<a class="btn btn-g" href="tel:${COMPANY.tel}">${ICON.phone}<span>${COMPANY.phone}</span></a>
<p class="mnote">${t("Ориентировочный расчёт по середине рынка Узбекистана: предложение DevUz для обсуждения, а не прайс CARGO PRO GROUP. Точную ставку менеджер подтвердит по вашему грузу.", "O‘zbekiston bozori o‘rtasi bo‘yicha taxminiy hisob: muhokama uchun DevUz taklifi, CARGO PRO GROUP prays-varag‘i emas. Aniq stavkani menejer yukingiz bo‘yicha tasdiqlaydi.")}</p>
<p class="mnote" data-addon="fx">${t("Курс ЦБ на сегодня подтягивается сам · в макете курс условный", "Bugungi MB kursi o‘zi olinadi · maketda kurs shartli")}</p>
</aside></div>
</div></section>`;
}

function track(l, t) {
  return `<section class="sec" id="track" data-addon="track"><div class="wrap">
<span class="ad-tag">${t("Доп · отслеживание", "Qo‘shimcha · kuzatish")}</span>
<h2 class="h2 rise">${t("Где мой груз? <b>По номеру, без звонка</b>", "Yukim qayerda? <b>Raqam bo‘yicha, qo‘ng‘iroqsiz</b>")}</h2>
<p class="lead rise">${t("Номер накладной или заявки, и видно каждый шаг: склад, отправка, граница, таможня, выдача. Статус ставит менеджер в панели.", "Yuk xati yoki ariza raqami, va har bir qadam ko‘rinadi: ombor, jo‘natish, chegara, bojxona, topshirish. Holatni menejer panelda qo‘yadi.")}</p>
<div class="trk"><form class="trk-f glass slide" id="trkf"><label class="fld"><span>${t("Номер груза или заявки", "Yuk yoki ariza raqami")}</span></label><div class="row"><input id="trkn" autocomplete="off" placeholder="CPG-24117" aria-label="${t("Номер груза", "Yuk raqami")}"><button class="btn btn-a" type="submit">${ICON.search}<span class="vh">${t("Найти", "Topish")}</span></button></div>
<p class="mnote">${t("Попробуйте демо-номера:", "Demo raqamlarni sinab ko‘ring:")}</p><div class="trk-ex" id="trkex"></div></form>
<div class="tl slider" id="tl"><h3>${t("Введите номер", "Raqamni kiriting")}</h3><p class="mu">${t("Здесь появится путь груза.", "Bu yerda yuk yo‘li paydo bo‘ladi.")}</p></div></div>
</div></section>`;
}

function customs(l, t) {
  return `<section class="sec" id="customs" style="background:var(--bg2)"><div class="wrap">
<p class="kick rise"><i></i>${t("Таможенный брокер и декларант", "Bojxona brokeri va deklarant")}</p>
<h2 class="h2 rise">${t("Таможня <b>на всей территории Узбекистана</b>", "Bojxona <b>O‘zbekistonning butun hududida</b>")}</h2>
<div class="two"><ul class="chk">${CUSTOMS[l].map((x, i) => `<li class="${i % 2 ? "slider" : "slide"}">${ICON.check}<span>${esc(x)}</span></li>`).join("")}</ul>
<div class="docs glass pop" data-addon="docs"><span class="ad-tag">${t("Доп · документы", "Qo‘shimcha · hujjatlar")}</span><b style="font:700 20px/1.3 var(--hd)">${t("Какие документы нужны", "Qanday hujjatlar kerak")}</b>
<label class="fld"><span>${t("Что везёте", "Nima olib kelasiz")}</span><select id="dkind"><option value="gen">${t("Обычный товар", "Oddiy tovar")}</option><option value="food">${t("Продукты питания", "Oziq-ovqat")}</option><option value="tech">${t("Электроника", "Elektronika")}</option><option value="eq">${t("Оборудование", "Uskunalar")}</option><option value="dg">${t("Опасный груз", "Xavfli yuk")}</option></select></label>
<ul id="dlist"></ul><p class="mnote">${t("Список для подготовки, окончательный даёт декларант по коду товара.", "Tayyorlanish uchun ro‘yxat, yakuniysini deklarant tovar kodi bo‘yicha beradi.")}</p></div></div>
</div></section>`;
}

function hubs(l, t) {
  return `<section class="sec" id="hubs"><div class="wrap">
<p class="kick rise"><i></i>${t("Склады и консолидация", "Omborlar va konsolidatsiya")}</p>
<h2 class="h2 rise">${t("Три склада: <b>ОАЭ, Узбекистан, Индия</b>", "Uchta ombor: <b>BAA, O‘zbekiston, Hindiston</b>")}</h2>
<p class="lead rise">${esc(FACTS[l].hubs)}. ${t("Товар от нескольких поставщиков едет одной отправкой: дешевле, чем каждый отдельно.", "Bir nechta yetkazib beruvchining tovari bitta jo‘natmada keladi: har birini alohida jo‘natishdan arzonroq.")}</p>
<div class="hubs"><div class="hmap tilt" aria-hidden="true"><svg viewBox="0 0 800 500">${dots(800, 500, 24)}
${HUBS.filter((h) => h.id !== "uz").map((h) => `<path class="arc" d="M${h.x} ${h.y} Q ${(h.x + 520) / 2} ${Math.min(h.y, 150) - 80} 520 150"/>`).join("")}
${HUBS.map((h) => `<g transform="translate(${h.x} ${h.y})"><circle class="hubdot" r="16" fill="none" stroke="#f6c445" stroke-width="2"/><circle r="9" fill="${h.id === "uz" ? "#f6c445" : "#f08a24"}"/><text x="16" y="-14" class="tag" style="font:700 16px var(--bd);fill:#f4f6fc">${esc(h[l].t)}</text></g>`).join("")}</svg></div>
<div class="hlist">${HUBS.map((h, i) => `<div class="${["slider", "rise", "slider"][i]}"><b>${esc(h[l].t)} · ${esc(h[l].c)}</b><span>${t("Приём, хранение, консолидация груза", "Yukni qabul qilish, saqlash, konsolidatsiya")}</span></div>`).join("")}</div></div>
<ol class="csteps">${[t("Поставщики везут товар на склад", "Yetkazib beruvchilar tovarni omborga olib keladi"), t("Склад принимает, считает места, фото", "Ombor qabul qiladi, joylarni sanaydi, suratga oladi"), t("Собираем в одну отправку и документы", "Bitta jo‘natma va hujjatlarga yig‘amiz"), t("Отправка в Ташкент, таможня, выдача", "Toshkentga jo‘natish, bojxona, topshirish")].map((s) => `<li class="drop">${s}</li>`).join("")}</ol>
</div></section>`;
}

function cab(l, t) {
  return `<section class="sec" id="cab" data-addon="cab" style="background:var(--bg2)"><div class="wrap">
<span class="ad-tag">${t("Доп · кабинет клиента", "Qo‘shimcha · mijoz kabineti")}</span>
<h2 class="h2 rise">${t("Кабинет компании-клиента: <b>грузы и документы</b>", "Mijoz kompaniya kabineti: <b>yuklar va hujjatlar</b>")}</h2>
<p class="lead rise">${t("Бухгалтер клиента сам скачивает инвойс и ГТД, менеджер логистики видит все грузы, повторить прошлую заявку: одна кнопка.", "Mijoz buxgalteri invoys va BYuDni o‘zi yuklab oladi, logistika menejeri barcha yuklarni ko‘radi, oldingi arizani takrorlash: bitta tugma.")}</p>
<div class="cab lift"><div class="bh" aria-hidden="true"><i></i><i></i><i></i></div><div class="bb"><div class="tbl"><table><thead><tr><th>${t("Груз", "Yuk")}</th><th>${t("Маршрут", "Yo‘nalish")}</th><th>${t("Статус", "Holat")}</th></tr></thead><tbody id="cabt"></tbody></table></div>
<div class="dl"><b>${t("Документы по CPG-24117", "CPG-24117 bo‘yicha hujjatlar")}</b>${[t("Инвойс", "Invoys"), t("Упаковочный лист", "Qadoqlash varaqasi"), t("ГТД", "BYuD"), t("Акт выполненных работ", "Bajarilgan ishlar dalolatnomasi")].map((d) => `<button type="button" data-dl>${ICON.doc}<span>${d} · PDF</span></button>`).join("")}<button type="button" class="btn btn-g btn-s" data-dl>${t("Повторить заявку", "Arizani takrorlash")}</button></div></div></div>
</div></section>`;
}

function bot(l, t) {
  const msgs = [
    ["me", t("Из Китая 300 кг авиа, сколько?", "Xitoydan 300 kg avia, qancha?")],
    ["", t("Гуанчжоу → Ташкент, авиа, 300 кг: около 2 940 $, 4-7 дней. Оформить заявку?", "Guanchjou → Toshkent, avia, 300 kg: taxminan 2 940 $, 4-7 kun. Ariza rasmiylashtiraymi?")],
    ["me", t("Да", "Ha")],
    ["", t("Заявка CPG-24131 принята, менеджер напишет в течение рабочего дня.", "CPG-24131 ariza qabul qilindi, menejer ish kuni davomida yozadi.")],
    ["", t("CPG-24117: груз прошёл таможню, можно забирать.", "CPG-24117: yuk bojxonadan o‘tdi, olib ketish mumkin.")],
  ];
  return `<section class="sec" id="bot" data-addon="bot"><div class="wrap"><div class="botw">
<div><span class="ad-tag">${t("Доп · Telegram-бот", "Qo‘shimcha · Telegram-bot")}</span>
<h2 class="h2 rise">${t("Расчёт и статус <b>в&nbsp;Telegram</b>", "Hisob va holat <b>Telegramda</b>")}</h2>
<p class="lead rise">${t("Тот же калькулятор в боте: вес, направление, и сумма. Заявка в два касания, а когда груз проходит таможню, бот пишет сам.", "Botda xuddi shu kalkulyator: og‘irlik, yo‘nalish va summa. Ikki bosishda ariza, yuk bojxonadan o‘tganda bot o‘zi yozadi.")}</p></div>
<div class="phone pop" aria-hidden="true"><div class="scr"><div class="tgh"><i></i><b>CARGO PRO GROUP</b></div><div class="chat" id="chat">${msgs.map(([w, m]) => `<div class="bt ${w}">${esc(m)}</div>`).join("")}</div></div></div>
</div></div></section>`;
}

function seo(l, t) {
  return `<section class="sec" id="seo" data-addon="seo" style="background:var(--bg2)"><div class="wrap">
<span class="ad-tag">${t("Доп · страницы направлений", "Qo‘shimcha · yo‘nalish sahifalari")}</span>
<h2 class="h2 rise">${t("Клиенты ищут <b>«карго из Китая»</b>", "Mijozlar <b>«Xitoydan kargo»</b> qidiradi")}</h2>
<p class="lead rise">${t("Своя страница на каждое направление на двух языках: сроки, транспорт, расчёт и заявка.", "Har bir yo‘nalish uchun ikki tilda alohida sahifa: muddatlar, transport, hisob va ariza.")}</p>
<div class="seo">${LANES.map((x, i) => `<div class="${["rise", "drop", "rise", "drop", "rise"][i]}"><b>${t(`Карго из: ${x.ru}`, `${x.uz}dan kargo`)}</b><small>${esc(x.city[l])} → ${t("Ташкент", "Toshkent")}</small></div>`).join("")}</div>
</div></section>`;
}

function partners(l, t) {
  return `<section class="sec" id="partners"><div class="wrap">
<p class="kick rise"><i></i>${t("Наши партнёры", "Hamkorlarimiz")}</p>
<h2 class="h2 rise">${t("Квалифицированный экспедитор <b>и&nbsp;официальный грузовой агент</b>", "Malakali ekspeditor <b>va rasmiy yuk agenti</b>")}</h2>
<ul class="kinds">${FACTS[l].pros.map((p) => `<li class="pop">${esc(p)}</li>`).join("")}</ul>
</div><div class="pmq" aria-label="${t("Авиакомпании-партнёры", "Hamkor aviakompaniyalar")}"><div class="row">${[...PARTNERS, ...PARTNERS].map((p) => `<span>${esc(p)}</span>`).join("")}</div></div></section>`;
}

function adminBlock(l, t) {
  return `<section class="sec" id="admin" data-addon="admin" style="background:var(--bg2)"><div class="wrap">
<span class="ad-tag">${t("Доп · панель", "Qo‘shimcha · panel")}</span>
<h2 class="h2 rise">${t("Заявки и грузы <b>в&nbsp;одной панели</b>", "Arizalar va yuklar <b>bitta panelda</b>")}</h2>
<p class="lead rise">${t("Заявка с этого сайта падает первой строкой, менеджер ставит статус груза, и клиент видит его в «Мои заявки». Владелец видит маржу, менеджер нет.", "Shu saytdan ariza birinchi qatorga tushadi, menejer yuk holatini qo‘yadi va mijoz uni «Arizalarim»da ko‘radi. Egasi marjani ko‘radi, menejer yo‘q.")}</p>
<div class="hero-act rise"><a class="btn btn-a" href="${href(l, "panel")}">${ICON.panel}<span>${t("Открыть панель", "Panelni ochish")}</span></a></div>
</div></section>`;
}

function faq(l, t) {
  const q = [
    [t("Как считается платный вес?", "To‘lanadigan og‘irlik qanday hisoblanadi?"), t(`Берётся большее из двух: настоящий вес или объём. В авиа 1 м³ считается как ${DIM.air} кг, в авто как ${DIM.auto} кг. Лёгкий, но объёмный груз платит за объём.`, `Ikkitasidan kattasi olinadi: haqiqiy og‘irlik yoki hajm. Aviada 1 m³ ${DIM.air} kg, avtoda ${DIM.auto} kg hisoblanadi. Yengil, lekin katta yuk hajm uchun to‘laydi.`)],
    [t("В каких валютах можно платить?", "Qaysi valyutalarda to‘lash mumkin?"), t("UZS, USD, EUR и AED.", "UZS, USD, EUR va AED.")],
    [t("Возите опасные и негабаритные грузы?", "Xavfli va gabaritdan tashqari yuklarni tashiysizmi?"), esc(FACTS[l].lead)],
    [t("Где можно хранить и собрать груз?", "Yukni qayerda saqlash va yig‘ish mumkin?"), esc(FACTS[l].hubs) + "."],
  ];
  return `<section class="sec" id="faq"><div class="wrap">
<p class="kick rise"><i></i>${t("Вопросы", "Savollar")}</p>
<h2 class="h2 rise">${t("Коротко <b>о главном</b>", "Asosiysi <b>qisqacha</b>")}</h2>
<div class="faq">${q.map(([a, b], i) => `<details class="rise"${i === 0 ? " open" : ""}><summary>${a}</summary><p>${b}</p></details>`).join("")}</div>
</div></section>`;
}

function contact(l, t) {
  return `<section class="sec" id="contact" style="background:var(--bg2)"><div class="wrap">
<p class="kick rise"><i></i>${t("Контакты", "Kontaktlar")}</p>
<h2 class="h2 rise">${t("Офис <b>в&nbsp;Ташкенте</b>", "Ofis <b>Toshkentda</b>")}</h2>
<div class="cnt"><div class="glass slide">${COMPANY.phones.map(([p, tel]) => `<a class="ph" href="tel:${tel}">${p}</a>`).join("")}<a href="mailto:${COMPANY.email}">${COMPANY.email}</a></div>
<div class="glass slider"><p style="margin:0">${ICON.pin.replace("<svg", '<svg style="width:20px;height:20px;vertical-align:-4px;color:var(--ac)"')} ${esc(COMPANY.address[l])}</p><a class="btn btn-g" href="${COMPANY.map}" target="_blank" rel="noopener">${t("Открыть на карте", "Xaritada ochish")}${ICON.arrow}</a><a class="btn btn-a" href="#calc">${ICON.calc}<span>${t("Рассчитать доставку", "Yetkazishni hisoblash")}</span></a></div></div>
</div></section>`;
}

function footer(l, t) {
  return `<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l)}<p style="margin-top:16px;font-size:14px">${t("Опытная логистическая компания: экспедирование грузов разной сложности и направлений.", "Tajribali logistika kompaniyasi: turli murakkablik va yo‘nalishdagi yuklarni ekspeditsiya qilish.")}</p></div>
<div><h4>${t("Услуги", "Xizmatlar")}</h4>${SERVICES.map((s) => `<a href="#services">${esc(s[l].t)}</a>`).join("")}</div>
<div><h4>${t("Клиентам", "Mijozlarga")}</h4><a href="#calc">${t("Расчёт доставки", "Yetkazish hisobi")}</a><a href="#track" data-addon="track">${t("Где груз", "Yuk qayerda")}</a><a href="#customs">${t("Таможня", "Bojxona")}</a><a href="#hubs">${t("Склады", "Omborlar")}</a></div>
<div><h4>${t("Связь", "Aloqa")}</h4><a href="tel:${COMPANY.tel}">${COMPANY.phone}</a><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></div>
</div>
<p class="warn-l">${t("Расчёт на сайте ориентировочный, по середине рынка. Номера грузов, клиенты и статусы в макете: демо.", "Saytdagi hisob taxminiy, bozor o‘rtasi bo‘yicha. Maketdagi yuk raqamlari, mijozlar va holatlar: demo.")}</p>
<div class="sm"><span>© 2026 ${COMPANY.legal}</span><span>${t("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</span></div>
</div></footer>`;
}

/* Данные для site.js. */
function data(l, t) {
  return {
    l, root: BASE_URL, img: IMG, mail: COMPANY.email, lanes: LANES.map((x) => ({ id: x.id, n: x[l], c: x.city[l], air: x.air, auto: x.auto, rail: x.rail, sea: x.sea })),
    ex: EXTRA, fx: FX, dim: DIM,
    t: {
      mode: { air: modeName("air", l), auto: modeName("auto", l), rail: modeName("rail", l), sea: modeName("sea", l) },
      days: t("дней в пути, ориентир", "kun yo‘lda, taxminan"), no: t("нет", "yo‘q"), kg: t("кг", "kg"), m3: t("м³", "m³"), per: t("за кг", "kg uchun"), cont: t("за контейнер", "konteyner uchun"),
      cw: t("Платный вес", "To‘lanadigan og‘irlik"), cwBy: t("считается по объёму", "hajm bo‘yicha hisoblanadi"), cwW: t("считается по весу", "og‘irlik bo‘yicha hisoblanadi"),
      fr: t("Перевозка", "Tashish"), ins: t("Страховка", "Sug‘urta"), cus: t("Таможенное оформление", "Bojxona rasmiylashtiruvi"), door: t("До двери", "Eshikkacha"), cons: t("Консолидация", "Konsolidatsiya"), dng: t("Опасный, температурный", "Xavfli, harorat"), tot: t("Итого, ориентир", "Jami, taxminan"),
      name: t("Имя", "Ism"), co: t("Компания", "Kompaniya"), phone: t("Телефон", "Telefon"), need: t("Напишите имя и телефон", "Ism va telefonni yozing"),
      req: t("Заявка на доставку", "Yetkazishga ariza"), send: t("Отправить заявку", "Ariza yuborish"), mailGo: t("Написать на", "Yozish:"), call: t("Позвонить", "Qo‘ng‘iroq"),
      ok: t("Заявка принята", "Ariza qabul qilindi"), okp: t("Это макет: заявка легла в панель, там менеджер ставит статус груза. Он появится здесь, в «Мои заявки». Письмо CARGO PRO GROUP откроется с готовым текстом.", "Bu maket: ariza panelga tushdi, u yerda menejer yuk holatini qo‘yadi. U shu yerda, «Arizalarim»da paydo bo‘ladi. CARGO PRO GROUP’ga xat tayyor matn bilan ochiladi."),
      mine: t("Мои заявки", "Arizalarim"), none: t("Заявок пока нет.", "Hozircha arizalar yo‘q."),
      st: [t("Заявка принята", "Ariza qabul qilindi"), t("Расчёт отправлен", "Hisob yuborildi"), t("Груз на складе отправления", "Yuk jo‘natish omborida"), t("В пути", "Yo‘lda"), t("Таможня в Ташкенте", "Toshkentda bojxona"), t("Выдан", "Topshirildi")],
      notFound: t("Такого номера нет. Попробуйте демо-номер ниже.", "Bunday raqam yo‘q. Quyidagi demo raqamni sinab ko‘ring."),
      demo: t("демо", "demo"), dl: t("В макете файлы не скачиваются · демо", "Maketda fayllar yuklanmaydi · demo"),
      wh: t("Склад", "Ombor"), co2: t("ООО", "MChJ"),
      docs: {
        gen: [t("Инвойс", "Invoys"), t("Упаковочный лист", "Qadoqlash varaqasi"), t("Договор с поставщиком", "Yetkazib beruvchi bilan shartnoma"), t("Сертификат происхождения", "Kelib chiqish sertifikati")],
        food: [t("Инвойс и упаковочный лист", "Invoys va qadoqlash varaqasi"), t("Ветеринарный или фитосанитарный сертификат", "Veterinariya yoki fitosanitariya sertifikati"), t("Сертификат соответствия", "Muvofiqlik sertifikati"), t("Сертификат происхождения", "Kelib chiqish sertifikati")],
        tech: [t("Инвойс и упаковочный лист", "Invoys va qadoqlash varaqasi"), t("Сертификат соответствия", "Muvofiqlik sertifikati"), t("Разрешение на радиочастоты, если есть передатчик", "Uzatgich bo‘lsa, radiochastota ruxsatnomasi"), t("Сертификат происхождения", "Kelib chiqish sertifikati")],
        eq: [t("Инвойс и упаковочный лист", "Invoys va qadoqlash varaqasi"), t("Техпаспорт или спецификация", "Texpasport yoki spetsifikatsiya"), t("Сертификат соответствия", "Muvofiqlik sertifikati"), t("Регистрация контракта, если оплата из Узбекистана", "To‘lov O‘zbekistondan bo‘lsa, shartnomani ro‘yxatdan o‘tkazish")],
        dg: [t("Инвойс и упаковочный лист", "Invoys va qadoqlash varaqasi"), t("Паспорт безопасности MSDS", "MSDS xavfsizlik pasporti"), t("Декларация опасного груза", "Xavfli yuk deklaratsiyasi"), t("Разрешение на ввоз, если требуется", "Kerak bo‘lsa, olib kirish ruxsatnomasi")],
      },
    },
  };
}

function sitePage(l) {
  const t = T(l);
  const title = t("CARGO PRO GROUP · грузоперевозки авиа, авто, ж/д и море, таможенный брокер в Ташкенте", "CARGO PRO GROUP · avia, avto, temir yo‘l va dengiz orqali yuk tashish, Toshkentda bojxona brokeri");
  const desc = t("Международные перевозки грузов из Китая, Турции, ОАЭ, Индии и Европы в Ташкент. Расчёт доставки онлайн, таможенное оформление, склады в ОАЭ, Узбекистане и Индии.", "Xitoy, Turkiya, BAA, Hindiston va Yevropadan Toshkentga xalqaro yuk tashish. Onlayn yetkazish hisobi, bojxona rasmiylashtiruvi, BAA, O‘zbekiston va Hindistonda omborlar.");
  return `${head(l, title, desc)}
<style>${CSS}</style>
</head>
<body>
${DEFS}
<a class="vh" href="#calc">${t("К расчёту", "Hisobga o‘tish")}</a>
${header(l, t)}
<main>
${hero(l, t)}
${velo(l)}
${routes(l, t)}
${services(l, t)}
${calc(l, t)}
${track(l, t)}
${customs(l, t)}
${hubs(l, t)}
${cab(l, t)}
${bot(l, t)}
${partners(l, t)}
${seo(l, t)}
${adminBlock(l, t)}
${faq(l, t)}
${contact(l, t)}
</main>
${footer(l, t)}
<a class="cfgb glass" href="${href(l)}#offer">${t("Конструктор", "Konstruktor")}</a>
<div class="dock glass" id="dock"><a class="btn btn-a" href="#calc">${ICON.calc}<span>${t("Рассчитать", "Hisoblash")}</span></a><a class="btn btn-g" href="tel:${COMPANY.tel}">${ICON.phone}<span>${t("Позвонить", "Qo‘ng‘iroq")}</span></a></div>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="shh"><div class="sh" data-close></div><div class="box"><div class="bh"><b id="shh"></b><button type="button" class="x" data-close aria-label="${t("Закрыть", "Yopish")}">${ICON.close}</button></div><div class="bb" id="shb"></div><div class="bf" id="shf"></div></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="cp-data">${JSON.stringify(data(l, t)).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}

function offer(l, t) {
  return `<section class="sec offer" id="offer"><div class="wrap">
<p class="kick"><i></i>${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</p>
<h2 class="h2">${t("Сайт <b>по этому макету</b>", "Shu maket <b>bo‘yicha sayt</b>")}</h2>
<p class="lead">${t(`48 часов с первого открытия макета: сайт ${usd(BASE.promo)} вместо ${usd(BASE.price)}. Допы включаются тумблером, и их блок на сайте тут же появляется или пропадает.`, `Maket birinchi ochilganidan 48 soat: sayt ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}. Qo‘shimchalar tumbler bilan yoqiladi va ularning bloki saytda darhol paydo bo‘ladi yoki yo‘qoladi.`)}</p>
<div class="cst"><div>
<div class="base"><div class="hd"><b>${esc(BASE[l].t)}</b><span class="pp"><s>${usd(BASE.price)}</s>${usd(BASE.promo)}</span></div><p>${esc(BASE[l].d)}</p></div>
<div class="adds">${ADDONS.map((a) => `<label class="add"><input type="checkbox" data-add="${a.id}" checked><span class="sw" aria-hidden="true"></span><span><b>${esc(a[l].t)}</b>${a.star ? `<span class="star">${t("берут первым", "birinchi oladilar")}</span>` : ""}<p>${esc(a[l].e)}</p><small>${esc(a[l].who)}</small></span><span class="ap">${usd(a.price)}</span></label>`).join("")}</div>
${MODULES.map((m) => `<div class="mod" id="mod-${m.id}"><p class="mod-k">${t("Отдельный модуль", "Alohida modul")}</p><label class="add"><input type="checkbox" data-mod="${m.id}" checked><span class="sw" aria-hidden="true"></span><span><b>${esc(m[l].t)}</b><span class="star">${t("рыночная цена", "bozor narxi")}</span><p>${esc(m[l].e)}</p><small class="mod-go">${esc(m[l].who)}</small><small>${esc(m.market[l])}</small><a class="mod-a" href="${href(l, "dispatch")}">${ICON.route}<span>${t("Открыть диспетчерскую", "Dispetcherlikni ochish")}</span></a></span><span class="ap">${usd(m.price)}</span></label></div>`).join("")}
</div>
<aside class="sum glass" aria-live="polite">
<div class="row"><span>${t("Сайт", "Sayt")}</span><span>${usd(BASE.promo)}</span></div>
<div class="row"><span>${t("Допы", "Qo‘shimchalar")} <span id="addn"></span></span><span id="adds">0 $</span></div>
<div class="tot"><span>${t("Сайт с допами", "Qo‘shimchalar bilan sayt")}</span><b id="total">${usd(ALL)}</b></div>
<div class="row mrow" id="mrow"><span>${t("Диспетчерская", "Dispetcherlik")}</span><span id="mods">${usd(MODULES[0].price)}</span></div>
<div class="tot tot2" id="mtot"><span>${t("С диспетчерской", "Dispetcherlik bilan")}</span><b id="withm">${usd(ALL_MODULES)}</b></div>
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
    t("Залёт камерой в ваш знак и схема маршрутов по прокрутке", "Belgingizga kamera bilan uchib kirish va aylantirganda yo‘nalishlar sxemasi"),
    t("Расчёт доставки: пять направлений, четыре вида транспорта", "Yetkazish hisobi: beshta yo‘nalish, to‘rtta transport turi"),
    t("Сумма в UZS, USD, EUR, AED и срок в пути сразу", "UZS, USD, EUR, AED’da summa va yo‘ldagi muddat darhol"),
    t("Отслеживание груза по номеру, таможня, склады", "Yukni raqam bo‘yicha kuzatish, bojxona, omborlar"),
    t("Заявка с готовым текстом и «Мои заявки» со статусом", "Tayyor matnli ariza va holati bilan «Arizalarim»"),
  ];
  const pan = [
    t("Заявка с сайта первой строкой, с расчётом", "Saytdan ariza birinchi qatorda, hisob bilan"),
    t("Грузы: статус меняется, клиент видит его на сайте", "Yuklar: holat o‘zgaradi, mijoz uni saytda ko‘radi"),
    t("Заявки и выручка по дням, воронка, направления", "Kunlar bo‘yicha arizalar va tushum, voronka, yo‘nalishlar"),
    t("Клиенты-компании и их грузы", "Mijoz kompaniyalar va ularning yuklari"),
    t("Роли: менеджер не видит маржу, история действий", "Rollar: menejer marjani ko‘rmaydi, harakatlar tarixi"),
  ];
  const dsp = [
    t("Грузы сами ложатся по машинам: кузов, вес, объём", "Yuklar mashinalarga o‘zi tushadi: kuzov, og‘irlik, hajm"),
    t("Перегруз и не тот кузов горят красным", "Ortiqcha yuk va noto‘g‘ri kuzov qizil yonadi"),
    t("Водители на карте: в пути, простой, опоздание", "Xaritada haydovchilar: yo‘lda, to‘xtash, kechikish"),
    t("Статус рейса сразу у клиента на сайте", "Reys holati darhol mijozning saytida"),
    t("Мы уже делали это для Lider Cargo", "Biz buni Lider Cargo uchun allaqachon qilganmiz"),
  ];
  const li = (a) => `<ul class="feat">${a.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>`;
  const steps = [
    t("Откройте сайт, выберите «Китай», «Авиа», подвиньте вес и нажмите «Отправить заявку».", "Saytni oching, «Xitoy», «Avia»ni tanlang, og‘irlikni suring va «Ariza yuborish»ni bosing."),
    t("Имя и телефон любые, это макет: заявка ляжет в панель.", "Ism va telefon istalgan, bu maket: ariza panelga tushadi."),
    t("В админке откройте заявку и поставьте «В пути». Сайт покажет это в «Мои заявки» и в отслеживании.", "Admin panelda arizani oching va «Yo‘lda» qo‘ying. Sayt buni «Arizalarim» va kuzatishda ko‘rsatadi."),
    t("В диспетчерской нажмите «Распределить»: 14 грузов лягут по 12 машинам. Перенесите груз в чужой кузов, и машина загорится красным.", "Dispetcherlikda «Taqsimlash»ni bosing: 14 ta yuk 12 ta mashinaga tushadi. Yukni boshqa kuzovga ko‘chiring, mashina qizil yonadi."),
  ];
  const ld = { base: BASE.promo, root: BASE_URL, hours: OFFER_HOURS, img: IMG, n: 60, add: ADDONS.map((a) => ({ id: a.id, p: a.price, t: a[l].t })), mod: MODULES.map((m) => ({ id: m.id, p: m.price, t: m[l].t })), t: { copied: t("Состав скопирован", "Tarkib nusxalandi"), tot: t("Сайт с допами", "Qo‘shimchalar bilan sayt"), totm: t("С диспетчерской", "Dispetcherlik bilan"), none: t("не выбрана", "tanlanmagan") } };
  return `${head(l, t("CARGO PRO GROUP · макет сайта и панели · DevUz Studio", "CARGO PRO GROUP · sayt va panel maketi · DevUz Studio"), t("Макет для CARGO PRO GROUP: новый сайт с расчётом доставки и панель заявок и грузов. Конструктор цены.", "CARGO PRO GROUP uchun maket: yetkazish hisobi bilan yangi sayt va arizalar va yuklar paneli. Narx konstruktori."))}
<link rel="preload" as="image" href="${IMG}/poster-9.webp" media="(max-width: 899px)">
<link rel="preload" as="image" href="${IMG}/poster-16-2880.webp" media="(min-width: 900px)">
<style>${CSS}</style>
</head>
<body>
${dzIntroSolo(l)}
<header class="top"><div class="top-in glass">
${LOGO(l, "")}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}"><a href="#choose">${t("Что посмотреть", "Nimani ko‘rish")}</a><a href="#try">${t("Как проверить", "Qanday tekshirish")}</a><a href="#offer">${t("Стоимость", "Narxi")}</a></nav>
<div class="langs">${LANGS.map((x) => `<a href="${href(x)}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<a class="btn btn-g btn-s adm" href="${href(l, "site")}">${t("Сайт", "Sayt")}</a>
<a class="btn btn-a btn-s" href="${href(l, "panel")}">${ICON.panel}<span>${t("Админка", "Admin panel")}</span></a>
</div></header>
<main>
<section class="hs" id="fly" aria-label="${t("Залёт в бренд CARGO PRO GROUP", "CARGO PRO GROUP brendiga uchib kirish")}"><div class="hs-st">
<picture><source media="(max-width: 899px)" srcset="${IMG}/poster-9.webp"><img class="hs-a" src="${IMG}/poster-16-1920.webp" srcset="${IMG}/poster-16-1920.webp 1920w, ${IMG}/poster-16-2880.webp 2880w" sizes="100vw" width="1920" height="1080" alt="${t("Знак CARGO PRO GROUP: решётчатый глобус от жёлтого к красному", "CARGO PRO GROUP belgisi: sariqdan qizilga to‘rli globus")}" fetchpriority="high"></picture>
<canvas aria-hidden="true"></canvas>
<div class="wrap hs-tx"><p class="kick"><i></i>${t("Макет DevUz Studio для CARGO PRO GROUP", "CARGO PRO GROUP uchun DevUz Studio maketi")}</p>
<h1>${words(t("<em>Bringing the world closer</em>: весь мир в&nbsp;одном Ташкенте", "<em>Bringing the world closer</em>: butun dunyo bitta Toshkentda"))}</h1>
<p class="lead">${t("Камера влетает в ваш глобус и выходит над грузовым узлом: самолёт, контейнеры, фуры и поезд, маршруты горят цветами вашего знака.", "Kamera globusingizga uchib kiradi va yuk tuguni ustidan chiqadi: samolyot, konteynerlar, furalar va poyezd, yo‘nalishlar belgingiz ranglarida yonadi.")}</p></div>
<div class="hs-p2"><div class="hs-card glass"><b>${t("Авиа · авто · ж/д · море · таможня", "Avia · avto · temir yo‘l · dengiz · bojxona")}</b><span>${esc(FACTS[l].hubs)}</span></div><a class="btn btn-a" href="#choose">${t("Смотреть макет", "Maketni ko‘rish")}${ICON.arrow}</a></div>
<div class="hs-load" id="hs-load" aria-hidden="true"><span id="hs-n">0</span>%<i id="hs-b"></i></div>
<div class="hs-hint" aria-hidden="true"><span>${t("Листайте", "Aylantiring")}</span><i></i></div>
</div></section>
<section class="sec" id="choose"><div class="wrap">
<p class="kick rise"><i></i>${t("Сайт и панель на ваших данных", "Ma’lumotlaringizdagi sayt va panel")}</p>
<h2 class="h2 rise">${t("Что посмотреть <b>первым</b>", "Avval <b>nimani ko‘rish</b>")}</h2>
<p class="lead rise">${t("Это работающий макет на ваших услугах, складах и партнёрах с cargoprogroup.uz. Сайт, каким его увидит клиент, панель, где команда ведёт заявки и грузы, и диспетчерская, где грузы раскладываются по машинам, а водители видны на карте.", "Bu cargoprogroup.uz’dagi xizmatlar, omborlar va hamkorlaringizdagi ishlaydigan maket. Mijoz ko‘radigan sayt, jamoa arizalar va yuklarni olib boradigan panel va yuklar mashinalarga taqsimlanadigan, haydovchilar xaritada ko‘rinadigan dispetcherlik.")}</p>
<div class="choices">
<a class="choice rise" href="${href(l, "site")}"><span class="ch-k">${t("Для клиента", "Mijoz uchun")}</span><b>${t("Сайт с расчётом доставки", "Yetkazish hisobi bilan sayt")}</b>
<span class="ch-pic"><img src="${IMG}/poster-16-1920.webp" width="1920" height="1080" alt="${t("Глобус CARGO PRO GROUP", "CARGO PRO GROUP globusi")}" loading="lazy"></span>
${li(site)}<span class="btn btn-g">${t("Открыть сайт", "Saytni ochish")}${ICON.arrow}</span></a>
<a class="choice rise" href="${href(l, "panel")}"><span class="ch-k">${t("Для вас и команды", "Siz va jamoa uchun")}</span><b>${t("Админка заявок и грузов", "Arizalar va yuklar admin paneli")}</b>
<span class="ch-pic"><span class="browser"><span class="bh"><i></i><i></i><i></i></span><span class="bb"><span class="kpi"><small>${t("Заявки, 30 дней · демо", "Arizalar, 30 kun · demo")}</small><b>186</b></span><span class="kpi"><small>${t("Грузов в пути · демо", "Yo‘ldagi yuklar · demo")}</small><b>41</b></span><span class="kpi w"><small>${t("Заявки по дням · демо", "Kunlar bo‘yicha arizalar · demo")}</small><span class="spark" id="lspark"></span></span></span></span></span>
${li(pan)}<span class="btn btn-a">${t("Открыть админку", "Admin panelni ochish")}${ICON.arrow}</span></a>
<a class="choice rise" data-module="tms" href="${href(l, "dispatch")}"><span class="ch-k">${t("Для диспетчеров · отдельный модуль", "Dispetcherlar uchun · alohida modul")}</span><b>${t("Диспетчерская: машины и водители", "Dispetcherlik: mashinalar va haydovchilar")}</b>
<span class="ch-pic"><span class="browser"><span class="bb dmini"><svg viewBox="0 0 300 150" aria-hidden="true"><path d="M150 60 Q 110 40 60 110" fill="none" stroke="url(#gArcL)" stroke-width="3" stroke-dasharray="5 6"/><path d="M150 60 Q 210 30 260 80" fill="none" stroke="url(#gArcL)" stroke-width="3" stroke-dasharray="5 6"/><path d="M150 60 Q 190 90 200 140" fill="none" stroke="#e5352b" stroke-width="3" stroke-dasharray="5 6"/><circle cx="150" cy="60" r="8" fill="#f6c445"/><circle cx="95" cy="80" r="7" fill="#f08a24"/><circle cx="225" cy="60" r="7" fill="#3ccf8e"/><circle cx="196" cy="118" r="7" fill="#e5352b"/><defs><linearGradient id="gArcL" x1="0" x2="1"><stop offset="0" stop-color="#f6c445"/><stop offset="1" stop-color="#e5352b"/></linearGradient></defs></svg></span></span></span>
${li(dsp)}<span class="btn btn-g">${t("Открыть диспетчерскую", "Dispetcherlikni ochish")}${ICON.arrow}</span></a>
</div>
</div></section>
<section class="sec" id="try" style="background:var(--bg2)"><div class="wrap">
<p class="kick rise"><i></i>${t("Как проверить за минуту", "Bir daqiqada qanday tekshirish")}</p>
<h2 class="h2 rise">${t("Сайт и панель <b>связаны</b>", "Sayt va panel <b>bog‘langan</b>")}</h2>
<ol class="ol">${steps.map((s) => `<li class="rise">${s}</li>`).join("")}</ol>
<div class="hero-act rise"><a class="btn btn-a" href="${href(l, "site")}">${t("Начать с сайта", "Saytdan boshlash")}${ICON.arrow}</a></div>
</div></section>
${offer(l, t)}
</main>
<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l, "")}<p style="margin-top:16px;font-size:14px">${t("Услуги, склады, партнёры, контакты: cargoprogroup.uz. Ставки калькулятора: середина рынка, предложение DevUz. Клиенты, грузы и цифры в панели: демо. Кадры залёта: Higgsfield, по вашему знаку.", "Xizmatlar, omborlar, hamkorlar, kontaktlar: cargoprogroup.uz. Kalkulyator stavkalari: bozor o‘rtasi, DevUz taklifi. Paneldagi mijozlar, yuklar va raqamlar: demo. Uchib kirish kadrlari: Higgsfield, belgingiz asosida.")}</p></div>
<div><h4>${t("Макет", "Maket")}</h4><a href="${href(l, "site")}">${t("Сайт", "Sayt")}</a><a href="${href(l, "panel")}">${t("Админка", "Admin panel")}</a><a href="${href(l, "dispatch")}" data-module="tms">${t("Диспетчерская", "Dispetcherlik")}</a><a href="#offer">${t("Стоимость", "Narxi")}</a></div>
<div><h4>DevUz Studio</h4><a href="https://devuz.studio" target="_blank" rel="noopener">devuz.studio</a><a href="${DEVUZ}" target="_blank" rel="noopener">Telegram</a></div>
<div><h4>CARGO PRO GROUP</h4><a href="tel:${COMPANY.tel}">${COMPANY.phone}</a><a href="${COMPANY.site}" target="_blank" rel="noopener">cargoprogroup.uz</a></div>
</div>
<div class="sm"><span>${t("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</span></div>
</div></footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="cp-land">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<script>
${LAND_JS}</script>
</body>
</html>`;
}

/* ── Панель (по эталону Greenwell) ─────────────────────────────────── */
(function checkDict() {
  const keys = new Set([...PANEL_JS.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  for (const k of ["tab_", "st_", "m_"]) keys.delete(k);
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
  const pd = { l, site: href(l, "site"), home: href(l), disp: href(l, "dispatch"), ui, logo: IMG + "/logo.webp", lanes: LANES.map((x) => ({ id: x.id, n: x[l], air: x.air, auto: x.auto, rail: x.rail, sea: x.sea })) };
  return `${head(l, t("Панель CARGO PRO GROUP · демо", "CARGO PRO GROUP paneli · demo"), t("Панель CARGO PRO GROUP: заявки с сайта, грузы и статусы, клиенты, история и роли. Демо-данные.", "CARGO PRO GROUP paneli: saytdan arizalar, yuklar va holatlar, mijozlar, tarix va rollar. Demo ma’lumotlar."))}
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

/* ── Диспетчерская (отдельный модуль) ─────────────────────────────── */
(function checkDispDict() {
  const keys = new Set([...DISP_JS.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  for (const k of ["tab_", "s_", "b_", "ty_", "k_", "role_"]) keys.delete(k);
  for (const k of keys) {
    const v = DISPATCH_UI[k];
    if (!v || v.length !== 2 || v.some((x) => !x)) throw new Error(`dispatch: нет подписи «${k}» на двух языках`);
  }
  for (const [k, v] of Object.entries(DISPATCH_UI)) if (/[А-Яа-яЁё]/.test(v[1])) throw new Error(`dispatch: кириллица в узбекской подписи «${k}»`);
  if (/[А-Яа-яЁё]/.test(DISP_JS + DISP_CSS)) throw new Error("dispatch: кириллица в коде диспетчерской");
})();

const CITY = {
  tas: ["Ташкент", "Toshkent"], sam: ["Самарканд", "Samarqand"], bux: ["Бухара", "Buxoro"], nav: ["Навои", "Navoiy"], fer: ["Фергана", "Farg‘ona"], and: ["Андижан", "Andijon"],
  nuk: ["Нукус", "Nukus"], ter: ["Термез", "Termiz"], alm: ["Алматы", "Almati"], bis: ["Бишкек", "Bishkek"],
};
function dispatchPage(l) {
  const t = T(l), i = l === "ru" ? 0 : 1;
  const ui = Object.fromEntries(Object.entries(DISPATCH_UI).map(([k, v]) => [k, v[i]]));
  const dd = { l, ui, site: href(l, "site"), home: href(l), panel: href(l, "panel"), logo: IMG + "/logo.webp", tel: COMPANY.tel,
    city: Object.fromEntries(Object.entries(CITY).map(([k, v]) => [k, v[i]])),
    gp: "https://play.google.com/store/apps/details?id=com.lbmgo.ftl.driver", as: "https://apps.apple.com/us/app/lbm-driver/id6762045849",
    trips: [["CPG-24117", 4, 0, 4160], ["CPG-24109", 3, 2, 4950], ["CPG-24095", 5, 1, 3245]] };
  return `${head(l, t("Диспетчерская CARGO PRO GROUP · демо", "CARGO PRO GROUP dispetcherligi · demo"), t("Диспетчерская CARGO PRO GROUP: распределение грузов по машинам по кузову, весу и объёму, водители на карте, рейсы со статусом для клиента, рейтинг водителей. Демо-данные.", "CARGO PRO GROUP dispetcherligi: yuklarni kuzov, og‘irlik va hajm bo‘yicha mashinalarga taqsimlash, xaritada haydovchilar, mijoz uchun holatli reyslar, haydovchilar reytingi. Demo ma’lumotlar."))}
<style>${CSS}${PANEL_CSS}${DISP_CSS}</style>
</head>
<body class="pn dp">
<div id="app"></div>
<footer class="pn-foot">${t("Макет DevUz Studio, демо-данные: машины, водители, грузы и маршруты выдуманы. Пользуясь макетом, вы принимаете", "DevUz Studio maketi, demo ma’lumotlar: mashinalar, haydovchilar, yuklar va yo‘nalishlar o‘ylab topilgan. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</footer>
<script type="application/json" id="dp-data">${JSON.stringify(dd).replace(/</g, "\\u003c")}</script>
<script>
${DISP_JS}</script>
</body>
</html>`;
}

const out = {};
for (const l of LANGS) {
  out[KEY[l]] = landPage(l);
  out[(KEY[l] ? KEY[l] + "/" : "") + "site"] = sitePage(l);
  out[(KEY[l] ? KEY[l] + "/" : "") + "panel"] = panelPage(l);
  out[(KEY[l] ? KEY[l] + "/" : "") + "dispatch"] = dispatchPage(l);
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
const parts = { J: `<script>\n${JS}</script>`, C: `<style>${CSS}</style>`, PJ: `<script>\n${PANEL_JS}</script>`, LJ: `<script>\n${LAND_JS}</script>`, DJ: `<script>\n${DISP_JS}</script>` };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const [name, part] of Object.entries(parts)) p = p.split(part).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "cargopro.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(10), v.length);
