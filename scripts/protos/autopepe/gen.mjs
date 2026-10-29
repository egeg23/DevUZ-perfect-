import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { COMPANY, SERVICES, PRICES, HOOKS, CAR, DAMAGE, PACKS, EXTRAS, PARTS } from "./data.mjs";
import { BASE, ADDONS, OFFER_HOURS, ALL, OFF } from "./plan.mjs";
import { PANEL_UI } from "./panel-ui.mjs";

/*
 * Макет AutoPepe (autopepe.pl), 29.10.2026: кузовной и малярный сервис в
 * Варшаве (Wawer), с 1990 года, удаление вмятин без покраски с 1997. Язык —
 * польский. Страницы:
 *
 *   ""      — видео DevUz → залёт камерой над лакированными буквами AutoPepe
 *             (intro/), логотип садится в шапку → выбор «Strona» или
 *             «Panel warsztatu», как проверить, конструктор цены DevUz;
 *   site    — сайт: живой лак на первом экране, «Od wgniecenia do lustra»
 *             по прокрутке, шесть их услуг, «przed i po» с их фото,
 *             калькулятор со схемой машины (цены — середина Варшавы), OC,
 *             допы, контакт;
 *   panel   — панель мастерской по эталону Greenwell.
 *
 * Визуал — кодом (WebGL-шейдер lak.js, three.js в заставке, SVG), без
 * Higgsfield, без ProxyAPI и без модели. Формы ничего не отправляют наружу:
 * заявка ложится в браузер и видна в панели, звонок и SMS — на их номер.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/autopepe";
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const CSS = strip(readFileSync(DIR + "site.css", "utf8")).replace(/\n\s*/g, "");
const LAK = strip(readFileSync(DIR + "lak.js", "utf8")).replace(/\n\s*\n/g, "\n");
const JS = LAK + strip(readFileSync(DIR + "site.js", "utf8")).replace(/\n\s*\n/g, "\n");
const LAND_JS = LAK + strip(readFileSync(DIR + "land.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_JS = strip(readFileSync(DIR + "panel.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_CSS = strip(readFileSync(DIR + "panel.css", "utf8")).replace(/\n\s*/g, "");
const BASE_URL = "__PROTO_BASE__";
const TERMS = "https://devuz.studio/pl/mockup-terms";
const FONTS = "https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,700;1,700&family=Manrope:wght@400;700&display=swap";
const DEVUZ = "https://t.me/Devuz_studio_bot?start=autopepe";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (p = "") => BASE_URL + "/" + p;
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const zl = (n) => `${fmt(n)}\u00a0zł`;
const words = (txt) => txt.split(" ").map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
const SMS = (body) => `sms:${COMPANY.tel}?&body=${encodeURIComponent(body)}`;

const I = (dd) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  back: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  sms: I('<path d="M4 5h16v11H9l-5 4Z"/><path d="M8 10h8M8 13h5"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  panel: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/>'),
  pin: I('<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  clock: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  minus: I('<path d="M6 12h12"/>'),
  plus: I('<path d="M6 12h12M12 6v12"/>'),
  cam: I('<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>'),
  /* Usługi: każda swoim kształtem. */
  blach: I('<path d="M3 15c3-6 6-8 9-8s6 2 9 8"/><path d="M3 15h18M7 15v3M17 15v3"/>'),
  pdr: I('<path d="M3 12c3 0 4-3 9-3s6 3 9 3"/><path d="M12 21v-9"/><path d="m9 15 3-3 3 3"/>'),
  rys: I('<path d="m4 18 8-12M9 20l8-12M14 19l5-7"/>'),
  lak: I('<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11Z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>'),
  felg: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 3v6.5M12 14.5V21M3 12h6.5M14.5 12H21"/>'),
  oc: I('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6Z"/><path d="m9 12 2 2 4-4"/>'),
  mix: I('<path d="M8 3h8l-1 6h-6Z"/><path d="M9 9 6 21h12l-3-12"/>'),
  car: I('<path d="M3 16v-3l2-5h14l2 5v3Z"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>'),
  doc: I('<path d="M6 3h9l3 3v15H6Z"/><path d="M9 10h6M9 14h6M9 18h4"/>'),
};
const LOGO = (to = "site") => `<a class="logo" href="${href(to)}" aria-label="AutoPepe"><span class="word"><span class="a">Auto</span><span class="p">Pepe</span></span></a>`;
const priceOf = (id) => ({ blach: ["od", 500], pdr: ["od", 50], rys: ["od", 50], lak: ["od", 500], felg: ["od", 400], oc: null })[id];

/* ── Części strony ───────────────────────────────────────────────── */
function head(title, desc) {
  return `<!doctype html>
<html lang="pl">
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

function header() {
  const nav = [["uslugi", "Usługi"], ["lustro", "Od wgniecenia do lustra"], ["wycena", "Kalkulator"], ["oc", "Szkoda z OC"], ["kontakt", "Kontakt"]];
  return `<header class="top"><div class="mbar"><a href="${href()}">${ICON.back}<span>Makieta dla AutoPepe</span></a><a class="mb-adm" href="${href("panel")}" data-addon="admin">${ICON.panel}<span>Panel warsztatu</span>${ICON.arrow}</a></div><div class="top-in glass">
${LOGO()}
<nav class="nav" aria-label="Sekcje">${nav.map(([id, n]) => `<a href="#${id}">${n}</a>`).join("")}</nav>
<button type="button" class="mine" id="mine" data-addon="status">${ICON.car}<span>Moja naprawa</span></button>
<a class="callb" href="tel:${COMPANY.tel}" data-call>${ICON.phone}<span>${COMPANY.phone}</span></a>
</div></header>`;
}

function hero() {
  return `<section class="hero" id="top" aria-label="AutoPepe">
<div class="hero-bg" aria-hidden="true"><canvas class="lak" id="hl"></canvas></div>
<div class="wrap hero-in">
<div>
<p class="kick rise">Blacharstwo · Lakiernictwo · Warszawa Wawer</p>
<h1>${words("Wgniecenia i rysy znikają. <em>Lakier zostaje</em> <em>fabryczny.</em>")}</h1>
<p class="lead rise">Od ${COMPANY.since} roku naprawiamy karoserie w Warszawie, od ${COMPANY.pdr} usuwamy wgniecenia bez lakierowania. Szkodę z OC sprawcy rozliczamy bezgotówkowo.</p>
<div class="hero-act rise"><a class="btn btn-a" href="tel:${COMPANY.tel}" data-call data-sms="Dzień dobry, chcę umówić oględziny auta. ">${ICON.phone}<span>Umów oględziny</span></a><a class="btn btn-g" href="#wycena">Policz naprawę</a></div>
<p class="hint rise">Porusz kursorem: tak lakier łapie światło lamp.</p>
</div>
<div class="hero-side">
<span class="chipf glass rise" data-par="-0.10"><i></i><b>${COMPANY.since}</b>na rynku od</span>
<span class="chipf glass rise" data-par="-0.16"><i></i><b>${COMPANY.pdr}</b>wgniecenia bez lakierowania od</span>
<div class="hcard glass rise" data-par="-0.06"><small>Wycena po obejrzeniu auta, ${COMPANY.hours}</small><a href="tel:${COMPANY.tel}">${COMPANY.phone}</a></div>
</div>
</div></section>`;
}

function velo() {
  const row = (arr, cls) => `<div class="row${cls}">${[...arr, ...arr, ...arr].map((x) => `<span>${esc(x)}</span>`).join("")}</div>`;
  const svc = SERVICES.map((s) => s.t);
  return `<div class="velo" aria-label="Dlaczego AutoPepe">${row(HOOKS, "")}${row(svc, " rev")}</div>`;
}

function road() {
  const caps = [
    ["Wgniecenie", "Tak widzi je fachowiec", "Na lakier pada światło z pasów. Tam, gdzie pasy się wyginają, blacha jest wgnieciona. Grad, parking, transport."],
    ["Bez lakierowania", "Wypychamy od środka", "Specjalnymi narzędziami dociskamy blachę od spodu, aż pasy znów są proste. Lakier zostaje fabryczny, auto nie traci na wartości."],
    ["Rysy", "Kasujemy bez lakierowania", "Rysy po parkowaniu, piasku i złej myjni schodzą z bezbarwnego lakieru. Badanie lakieru nie pokaże różnicy."],
    ["Połysk", "Lakier jak lustro", "Polerowanie bez kółek, hologramów i smug. Kolor robi się głębszy, lakier odbija lampy jak mokra tafla."],
  ];
  return `<section class="road" id="lustro" aria-label="Od wgniecenia do lustra"><div class="road-st">
<canvas class="lak" id="sl" aria-hidden="true"></canvas>
<div class="wrap road-in">
<p class="kick">Od wgniecenia do lustra</p>
<h2 class="h2">Przewiń: <b>naprawiamy</b> na Twoich oczach</h2>
<div class="caps">${caps.map(([n, h, p], i) => `<div class="cap glass${i ? "" : " on"}"><span class="n">${String(i + 1).padStart(2, "0")} · ${n}</span><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
<div class="prog" aria-hidden="true">${caps.map(() => "<i><b></b></i>").join("")}</div>
</div>
<span class="road-lab glass" id="rlab" aria-hidden="true">Tablica z pasami</span>
</div></section>`;
}

function services() {
  return `<section class="sec sx" id="uslugi"><div class="wrap">
<p class="kick rise">Usługi</p>
<h2 class="h2 rise">Sześć rzeczy, które <b>robimy u siebie</b></h2>
<p class="lead rise">Osobówki i dostawczaki wszystkich marek. Dla osób prywatnych i firm.</p>
<div class="svc">${SERVICES.map((s, i) => {
    const p = priceOf(s.id);
    return `<article class="sv" data-m="${s.motion}" style="transition-delay:${i * 80}ms"><span class="ico">${ICON[s.id]}</span><h3>${esc(s.t)}</h3><p>${esc(s.s)}</p>
<details><summary>Więcej</summary><p>${esc(s.more)}</p></details>
<div class="pr">${p ? `<b>${p[0]} ${zl(p[1])}</b>` : `<b>z OC sprawcy: 0 zł</b>`}<a class="btn btn-g btn-s" href="#wycena" data-svc="${s.id}">Policz</a></div></article>`;
  }).join("")}</div>
</div></section>`;
}

function beforeAfter() {
  const cmp = (n, cap, w, h) => `<figure style="margin:0"><div class="cmp" style="aspect-ratio:${w}/${h}" data-cmp><img src="${IMG}/p/${n}-a.webp" width="${w}" height="${h}" alt="Przed: ${esc(cap)}" loading="lazy"><div class="af"><img src="${IMG}/p/${n}-b.webp" width="${w}" height="${h}" alt="Po: ${esc(cap)}" loading="lazy"></div><span class="hd"></span><span class="tg l">Przed</span><span class="tg r">Po</span><input type="range" min="0" max="100" value="50" aria-label="Przesuń, żeby porównać: ${esc(cap)}"></div><figcaption class="cmpcap">${esc(cap)}</figcaption></figure>`;
  return `<section class="sec sx" id="przedpo"><div class="wrap">
<p class="kick rise">Przed i po</p>
<h2 class="h2 rise">Przesuń palcem. <b>To nasze zdjęcia</b></h2>
<div class="ba">${cmp("hood", "Maska po gradobiciu, metoda bezinwazyjna", 754, 596)}${cmp("rim", "Renowacja felgi aluminiowej", 696, 786)}</div>
</div></section>`;
}

/* Schemat auta z góry: 13 elementów do kliknięcia. */
function carSvg() {
  const P = {
    zp: "M62 18 Q120 4 178 18 L182 40 L58 40Z",
    mk: "M60 44 L180 44 L176 118 L64 118Z",
    blp: "M30 50 Q40 40 56 44 L60 118 L34 122 Q26 90 30 50Z",
    bpp: "M210 50 Q200 40 184 44 L180 118 L206 122 Q214 90 210 50Z",
    dlp: "M34 126 L62 122 L62 206 L32 206Z",
    dpp: "M206 126 L178 122 L178 206 L208 206Z",
    dlt: "M32 210 L62 210 L62 290 L36 294Z",
    dpt: "M208 210 L178 210 L178 290 L204 294Z",
    dc: "M70 150 L170 150 L168 272 L72 272Z",
    blt: "M36 298 L64 294 L60 368 Q40 372 32 352Z",
    bpt: "M204 298 L176 294 L180 368 Q200 372 208 352Z",
    kl: "M66 300 L174 300 L178 370 L62 370Z",
    zt: "M58 374 L182 374 L178 398 Q120 412 62 398Z",
  };
  return `<svg class="car" id="car" viewBox="0 0 240 416" role="group" aria-label="Schemat auta: kliknij element z uszkodzeniem">
<rect class="wh" x="18" y="70" width="14" height="44" rx="5"/><rect class="wh" x="208" y="70" width="14" height="44" rx="5"/><rect class="wh" x="18" y="306" width="14" height="44" rx="5"/><rect class="wh" x="208" y="306" width="14" height="44" rx="5"/>
${PARTS.map(([id, n]) => `<path class="pt" data-part="${id}" d="${P[id]}" tabindex="0" role="button" aria-label="${esc(n)}"><title>${esc(n)}</title></path>`).join("")}
<path class="gl" d="M74 122 L166 122 L170 148 L70 148Z"/><path class="gl" d="M74 274 L166 274 L170 296 L70 296Z"/>
</svg>`;
}

function calc() {
  return `<section class="sec sx" id="wycena"><div class="wrap">
<p class="kick rise">Kalkulator naprawy</p>
<h2 class="h2 rise">Kliknij, gdzie boli. <b>Cena od razu</b></h2>
<p class="lead rise">Widełki to środek warszawskiego rynku. Dokładna wycena jest możliwa po obejrzeniu auta.</p>
<div class="calc">
<div class="panel rise">
<p class="lbl">Jakie auto?</p>
<div class="chips" id="cls">${CAR.map((c, i) => `<button type="button" data-cls="${c.id}" aria-pressed="${i ? "false" : "true"}">${esc(c.t)}</button>`).join("")}</div>
<p class="lbl">Gdzie jest uszkodzenie?</p>
<div class="carw">${carSvg()}
<div class="pick" id="pick"><span class="pn" id="pn">Kliknij element na schemacie</span><p style="margin:0;color:var(--mu);font-size:14px" id="pp">Każdy element ma swoją cenę. Możesz zaznaczyć kilka.</p>
<div class="opts" id="po" hidden>${DAMAGE.map((x) => `<button type="button" class="btn btn-g btn-s" data-dmg="${x.id}">${esc(x.t)}</button>`).join("")}<button type="button" class="btn btn-g btn-s" data-dmg="">Bez uszkodzeń</button></div>
<div class="legend"><span><i style="background:#2e6fd8"></i>Wgniecenie</span><span><i style="background:#e0a526"></i>Rysa</span><span><i style="background:var(--ac)"></i>Lakierowanie</span></div>
<div data-addon="foto"><label class="drop" id="drop">${ICON.cam}<b>Dodaj zdjęcia uszkodzeń</b><span>Z telefonu: zrobisz je od razu aparatem</span><input type="file" accept="image/*" multiple id="photos"></label><div class="thumbs" id="thumbs"></div></div>
</div></div>
<p class="lbl">Pakiet</p>
<div class="packs">${PACKS.map((p, i) => `<label class="pk"><input type="radio" name="pack" value="${p.id}"${i ? "" : " checked"}><span><b>${esc(p.t)}</b><small>${esc(p.d)}</small>${p.hi ? `<em>${zl(p.lo)} do ${zl(p.hi)}</em>` : ""}</span></label>`).join("")}</div>
<p class="lbl">Dodatkowo</p>
${EXTRAS.map((x) => x.n ? `<div class="ex"><span>${esc(x.t)} <small style="color:var(--mu)">${zl(x.lo)} do ${zl(x.hi)} za sztukę</small></span><div class="qty"><button type="button" data-zap="-1" aria-label="Mniej">${ICON.minus}</button><span id="zapn">0</span><button type="button" data-zap="1" aria-label="Więcej">${ICON.plus}</button></div></div>` : `<div class="ex"><label><input type="checkbox" id="ex-${x.id}"><span>${esc(x.t)}</span></label><small style="color:var(--mu)">${zl(x.lo)} do ${zl(x.hi)}</small></div>`).join("")}
<label class="ocb"><input type="checkbox" id="ocx"><span><b>To szkoda z OC sprawcy.</b> Naprawę opłaca ubezpieczyciel, rozliczenie bezgotówkowe.</span></label>
</div>
<aside class="res glass" aria-live="polite">
<h3>Twoja wycena</h3>
<ul id="rl"><li><span>Nic jeszcze nie zaznaczono</span><span></span></li></ul>
<div class="tot"><small id="rk">Orientacyjnie</small><b id="rt">0 zł</b></div>
<p class="note" id="rn">Dokładna wycena jest możliwa po obejrzeniu auta.</p>
<a class="btn btn-a" id="rsms" href="${SMS("Dzień dobry, proszę o wycenę naprawy.")}">${ICON.sms}<span>Wyślij wycenę SMS-em</span></a>
<a class="btn btn-g" href="tel:${COMPANY.tel}">${ICON.phone}<span>${COMPANY.phone}</span></a>
<div data-addon="foto"><label class="fld"><span>Telefon do Ciebie</span><input id="fph" type="tel" inputmode="tel" autocomplete="tel" placeholder="+48"></label><button type="button" class="btn btn-g" id="fsend">Wyślij zgłoszenie ze zdjęciami</button><p class="okmsg" id="fok" hidden></p></div>
</aside>
</div>
<div class="panel prl rise"><h4>Cennik AutoPepe</h4>${PRICES.map(([n, p]) => `<div><span>${esc(n)}</span><b>od ${zl(p)}</b></div>`).join("")}<p>Ceny z autopepe.pl. W sprawie wyceny: ${COMPANY.phone}.</p></div>
</div></section>`;
}

function oc() {
  const steps = [
    ["Spisz oświadczenie albo wezwij policję", "Dane sprawcy, numer polisy OC, numer rejestracyjny, miejsce i godzina."],
    ["Zgłoś szkodę u ubezpieczyciela sprawcy", "Telefonicznie albo online. Dostaniesz numer szkody."],
    ["Przyjedź z autem na Lebiodową 19", "Robimy wycenę, którą zatwierdza ubezpieczyciel."],
    ["Odbierasz auto po naprawie", "Rozliczamy się z ubezpieczycielem bezgotówkowo. Każda naprawa powypadkowa kończy się badaniem technicznym."],
  ];
  const docs = ["Dowód rejestracyjny", "Prawo jazdy", "Oświadczenie sprawcy albo notatka policji", "Numer szkody", "Dane do przelewu, jeśli wybierzesz gotówkę"];
  return `<section class="sec sx" id="oc"><div class="wrap split">
<div><p class="kick rise">Naprawy powypadkowe</p><h2 class="h2 rise">Szkoda z OC? <b>Płaci ubezpieczyciel</b></h2>
<p class="lead rise">Naprawiamy na podstawie wyceny zatwierdzonej przez firmę ubezpieczeniową. Z OC sprawcy rozliczenie może być bezgotówkowe.</p>
<ol class="steps">${steps.map(([b, s]) => `<li class="rise"><b>${b}</b><span>${s}</span></li>`).join("")}</ol></div>
<div class="panel rise" data-addon="oc"><h3 style="margin:0;font:700 20px/1.2 var(--hd)">Co zabrać</h3>
<ul class="docs">${docs.map((d, i) => `<li><label><input type="checkbox" data-doc="${i}">${d}</label></li>`).join("")}</ul>
<h3 style="margin:32px 0 0;font:700 20px/1.2 var(--hd)">Zgłoś szkodę do nas</h3>
<div class="frow"><label class="fld"><span>Numer szkody</span><input id="ocn" autocomplete="off"></label><label class="fld"><span>Ubezpieczyciel sprawcy</span><select id="oci"><option>PZU</option><option>Warta</option><option>Ergo Hestia</option><option>Allianz</option><option>Generali</option><option>Link4</option><option>Inny</option></select></label>
<label class="fld"><span>Numer rejestracyjny</span><input id="ocr" autocomplete="off" placeholder="WX 12345"></label><label class="fld"><span>Telefon</span><input id="ocp" type="tel" inputmode="tel" autocomplete="tel" placeholder="+48"></label></div>
<button type="button" class="btn btn-a" id="ocs" style="margin-top:16px;width:100%">Wyślij zgłoszenie szkody</button><p class="okmsg" id="ocok" hidden></p></div>
</div></section>`;
}

function status() {
  return `<section class="sec sx" id="status" data-addon="status"><div class="wrap split">
<div><p class="kick rise">Status naprawy</p><h2 class="h2 rise">Gdzie jest <b>moje auto?</b></h2><p class="lead rise">Wpisz numer zlecenia z potwierdzenia. Etap zmienia warsztat w panelu, Ty widzisz go tutaj od razu, bez dzwonienia.</p></div>
<div class="panel rise"><label class="fld" style="margin:0"><span>Numer zlecenia</span><input id="sq" placeholder="np. AP-2041" autocomplete="off"></label>
<button type="button" class="btn btn-a btn-s" id="sgo" style="margin-top:12px">Sprawdź</button>
<div id="sres"></div></div>
</div></section>`;
}

function termin() {
  return `<section class="sec sx" id="termin" data-addon="termin"><div class="wrap split">
<div><p class="kick rise">Rezerwacja terminu</p><h2 class="h2 rise">Oględziny <b>bez dzwonienia</b></h2><p class="lead rise">Pokazujemy wolne godziny ${COMPANY.hours}. Zajęte znikają same, a dzień wcześniej przychodzi przypomnienie.</p></div>
<div class="panel rise"><div class="days" id="days"></div><div class="slots" id="slots"></div>
<label class="fld"><span>Imię i telefon</span><input id="tph" autocomplete="tel" placeholder="Anna, +48"></label>
<button type="button" class="btn btn-a" id="tgo" style="margin-top:12px;width:100%" disabled>Zarezerwuj</button><p class="okmsg" id="tok" hidden></p></div>
</div></section>`;
}

function why() {
  const it = [
    ["big", String(COMPANY.since), "Na rynku od 1990 roku", "Firma działa nieprzerwanie od 1990 roku, w Warszawie na Wawrze."],
    ["big", String(COMPANY.pdr), "Wgniecenia bez lakierowania", "Od 1997 roku skupiamy się na bezinwazyjnym usuwaniu wgnieceń i rys."],
    ["ico", ICON.mix, "Własna mieszalnia lakierów", "Kolor dobieramy na miejscu, element nie odstaje od reszty auta."],
    ["ico", ICON.felg, "Felgi bez firm zewnętrznych", "Renowację felg robimy w całości u siebie."],
    ["ico", ICON.oc, "Badanie techniczne po naprawie", "Każda naprawa powypadkowa kończy się diagnostycznym badaniem technicznym."],
    ["ico", ICON.car, "Odprowadzimy auto", "Rabaty na usługi, szybkie terminy i odprowadzenie pojazdu po naprawie."],
  ];
  return `<section class="sec sx" id="dlaczego"><div class="wrap">
<p class="kick rise">Dlaczego AutoPepe</p>
<h2 class="h2 rise">Fach <b>od ponad trzydziestu lat</b></h2>
<div class="why">${it.map(([k, v, h, p], i) => `<div class="panel pop" style="transition-delay:${i * 80}ms">${k === "big" ? `<span class="big" data-count="${v}">${v}</span>` : `<span class="ico">${v}</span>`}<h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>`;
}

function flota() {
  return `<section class="sec sx" id="flota" data-addon="flota"><div class="wrap split">
<div><p class="kick rise">Dla firm i flot</p><h2 class="h2 rise">Kilka aut, <b>jedno zgłoszenie</b></h2><p class="lead rise">Rabaty na usługi, odprowadzenie pojazdu po naprawie i szybkie terminy. Zgłaszasz kilka aut naraz, dostajesz jedną wycenę.</p></div>
<div class="panel rise"><div class="frow"><label class="fld"><span>Firma</span><input id="fl1" autocomplete="organization"></label><label class="fld"><span>Ile aut</span><input id="fl2" type="number" min="1" value="3"></label></div><a class="btn btn-a" style="margin-top:16px;width:100%" href="mailto:${COMPANY.mail}?subject=${encodeURIComponent("Flota: zapytanie")}" id="flm">${ICON.mail}<span>Napisz do biura</span></a></div>
</div></section>`;
}

function sms() {
  const m = [
    ["AutoPepe: Pana auto WX 12345 jest gotowe do odbioru. Czynne pn-pt 8-16, ul. Lebiodowa 19.", "dziś 14:12"],
    ["Przypomnienie: jutro o 10:00 oględziny w AutoPepe. Tel. 501 729 924.", "wczoraj 17:00"],
    ["Dziękujemy za wizytę! Jeśli jest Pan zadowolony, prosimy o opinię w Google: to 20 sekund.", "dziś 16:30"],
  ];
  return `<section class="sec sx" id="sms" data-addon="sms"><div class="wrap split">
<div class="phone rise"><div class="scr"><div class="bar"><i>AP</i><div><b>AutoPepe</b><br><small style="color:var(--mu)">SMS · przykład</small></div></div><div class="msgs">${m.map(([x, t]) => `<div class="msg">${esc(x)}<small>${t}</small></div>`).join("")}</div></div></div>
<div><p class="kick rise">SMS do klienta</p><h2 class="h2 rise">Klient wie, <b>zanim zadzwoni</b></h2><p class="lead rise">Gotowe do odbioru, przypomnienie o terminie i prośba o opinię w Google po odbiorze. Wysyła się samo, gdy zmienicie status w panelu.</p></div>
</div></section>`;
}

function seo() {
  const a = [
    ["Usuwanie wgnieceń bez lakierowania w Warszawie", "Kiedy się da, ile trwa i dlaczego auto nie traci na wartości."],
    ["Szkoda z OC sprawcy: bezgotówkowo krok po kroku", "Co zabrać, kto płaci i ile czeka się na naprawę."],
    ["Renowacja felg aluminiowych: kiedy warto", "Ubytki, korozja, zmiana koloru: co da się naprawić."],
  ];
  return `<section class="sec sx" id="seo" data-addon="seo"><div class="wrap">
<p class="kick rise">Lokalne wyszukiwanie</p><h2 class="h2 rise">Ktoś szuka „blacharz Wawer”. <b>Znajduje Was</b></h2>
<p class="lead rise">Strony pod frazy z okolicy i uporządkowany profil w Mapach Google. Frazy sprawdzimy w Google Trends dla Polski przed pisaniem.</p>
<div class="arts">${a.map(([h, p], i) => `<article class="art pop" style="transition-delay:${i * 90}ms"><small>Temat artykułu</small><b>${h}</b><p>${p}</p></article>`).join("")}</div>
</div></section>`;
}

function admin() {
  return `<section class="sec sx" id="admin" data-addon="admin"><div class="wrap split">
<div><p class="kick rise">Panel warsztatu</p><h2 class="h2 rise">Zgłoszenie ze strony <b>od razu w panelu</b></h2><p class="lead rise">Wyślij wycenę albo szkodę w tej makiecie i otwórz panel: będzie na górze listy. Zmień etap naprawy, a klient zobaczy go w „Status naprawy”.</p>
<div class="hero-act rise"><a class="btn btn-a" href="${href("panel")}">${ICON.panel}<span>Otwórz panel</span></a></div></div>
<div class="browser rise"><div class="bh"><i></i><i></i><i></i></div><div class="bb">
<div class="kpi"><small>Przychód, 30 dni</small><b id="ak1">…</b></div><div class="kpi"><small>Auta w naprawie</small><b id="ak2">…</b></div>
<div class="kpi w"><small>Zlecenia dzień po dniu · dane demonstracyjne</small><div class="spark" id="aspark"></div></div></div></div>
</div></section>`;
}

function contact() {
  return `<section class="sec sx" id="kontakt"><div class="wrap">
<p class="kick rise">Kontakt i dojazd</p><h2 class="h2 rise">Lebiodowa 19, <b>Wawer</b></h2>
<div class="ct">
<div class="panel rise"><h3>${COMPANY.name} · ${COMPANY.owner}</h3>
<dl><dt>Adres</dt><dd>${COMPANY.street}, ${COMPANY.city}</dd><dt>Telefon</dt><dd><a href="tel:${COMPANY.tel}">${COMPANY.phone}</a></dd><dt>E-mail</dt><dd><a href="mailto:${COMPANY.mail}">${COMPANY.mail}</a></dd><dt>Czynne</dt><dd>${COMPANY.hours}</dd><dt>Dojazd</dt><dd style="font-weight:400;color:var(--tx2)">${esc(COMPANY.route)}</dd></dl>
<div class="hero-act"><a class="btn btn-a" href="tel:${COMPANY.tel}" data-call data-sms="Dzień dobry, chcę umówić oględziny auta. ">${ICON.phone}<span>Zadzwoń</span></a><a class="btn btn-g" href="mailto:${COMPANY.mail}">${ICON.mail}<span>Napisz</span></a></div></div>
<div class="map rise" aria-label="Mapa dojazdu"><svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<rect width="600" height="400" fill="#121317"/>
<path d="M-20 300 C120 260 220 330 360 280 S560 210 640 240" stroke="#2a2d34" stroke-width="22" fill="none"/>
<path d="M120 -20 C140 120 180 200 260 260 S330 360 320 420" stroke="#2a2d34" stroke-width="14" fill="none"/>
<path d="M300 186 L420 120 M300 186 L250 120 M300 186 L360 260" stroke="#24262c" stroke-width="8" fill="none"/>
<path d="M-20 140 C80 150 160 120 240 150" stroke="#1d3a2a" stroke-width="30" fill="none" opacity=".6"/>
<path d="M300 186 m-40 0 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0" stroke="rgb(227 20 12 / .35)" stroke-width="2" fill="none"/>
<text x="40" y="292" fill="#5d626c" font-size="13" font-family="Manrope,sans-serif">ul. Kadetów</text>
<text x="380" y="112" fill="#5d626c" font-size="13" font-family="Manrope,sans-serif">ul. Węglarska</text>
</svg><span class="pin"><span class="glass">${COMPANY.name} · ${COMPANY.street}</span></span><a class="btn btn-g btn-s" href="${COMPANY.maps}" target="_blank" rel="noopener">${ICON.pin}<span>Otwórz w Mapach Google</span></a></div>
</div></div></section>`;
}

function footer() {
  return `<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO()}<p style="margin-top:16px">${COMPANY.name} ${COMPANY.owner}. Blacharstwo, lakiernictwo, usuwanie rys i wgnieceń w Warszawie.</p></div>
<div><h4>Usługi</h4>${SERVICES.map((s) => `<a href="${COMPANY.site}/${s.url}" target="_blank" rel="noopener">${esc(s.t)}</a>`).join("")}</div>
<div><h4>Klient</h4><a href="#wycena">Kalkulator naprawy</a><a href="#oc">Szkoda z OC</a><a href="#status" data-addon="status">Status naprawy</a><a href="#termin" data-addon="termin">Rezerwacja terminu</a><a href="#kontakt">Dojazd</a></div>
<div><h4>Kontakt</h4><a href="tel:${COMPANY.tel}">${COMPANY.phone}</a><a href="mailto:${COMPANY.mail}">${COMPANY.mail}</a><p style="margin:4px 0">${COMPANY.street}, ${COMPANY.city}</p><p style="margin:4px 0">${COMPANY.hours}</p></div>
</div>
<div class="sm"><span>© 2026 ${COMPANY.name} ${COMPANY.owner} · ${COMPANY.street}, ${COMPANY.city}</span><span>Makieta DevUz Studio. Korzystając z makiety, akceptujesz <a href="${TERMS}" target="_blank" rel="noopener">warunki makiety</a>.</span></div>
</div></footer>`;
}

/* Dane dla site.js. */
function data() {
  return {
    tel: COMPANY.tel, phone: COMPANY.phone, hours: OFFER_HOURS, panel: href("panel"),
    car: CAR, dmg: DAMAGE, packs: PACKS, extras: EXTRAS, parts: Object.fromEntries(PARTS),
    svcDmg: { blach: "lak", pdr: "pdr", rys: "rys", lak: "", felg: "", oc: "lak" },
    st: ["Przyjęte", "Blacharka", "Lakiernia", "Polerowanie", "Gotowe do odbioru"],
  };
}

function sitePage() {
  const title = "AutoPepe · blacharstwo, lakiernictwo i usuwanie wgnieceń, Warszawa Wawer";
  const desc = "Usuwanie wgnieceń bez lakierowania od 1997, kasowanie rys, renowacja lakieru i felg, naprawy powypadkowe bezgotówkowo z OC sprawcy. ul. Lebiodowa 19, Warszawa.";
  return `${head(title, desc)}
<style>${CSS}</style>
</head>
<body>
<a class="vh" href="#wycena">Przejdź do kalkulatora</a>
${header()}
<main>
${hero()}
${velo()}
${road()}
${services()}
${beforeAfter()}
${calc()}
${oc()}
${status()}
${termin()}
${why()}
${flota()}
${sms()}
${seo()}
${admin()}
${contact()}
</main>
${footer()}
<a class="cfgb glass" href="${href()}#offer">Konstruktor</a>
<div class="dock" id="dock"><a class="btn btn-g" href="#wycena">Policz naprawę</a><a class="btn btn-a" href="tel:${COMPANY.tel}" data-call data-sms="Dzień dobry, chcę umówić oględziny auta. ">${ICON.phone}<span>Zadzwoń</span></a></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="ap-data">${JSON.stringify(data()).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}

/* ── Pierwsza strona: wybór „Strona” lub „Panel” i konstruktor DevUz ─── */
function offer() {
  return `<section class="sec offer" id="offer"><div class="wrap">
<p class="kick">Oferta DevUz Studio</p>
<h2 class="h2">Strona <b>według tej makiety</b></h2>
<p class="lead">Przez 48 godzin od pierwszego otwarcia makiety: strona za ${zl(BASE.promo)} zamiast ${zl(BASE.price)}. Dodatki są o ${Math.round(OFF * 100)}% tańsze niż u polskich agencji. Włączasz je przełącznikiem, a ich blok od razu pojawia się na stronie albo znika.</p>
<div class="cst"><div>
<div class="base"><div class="hd"><b>${esc(BASE.t)}</b><span class="pp"><s>${zl(BASE.price)}</s>${zl(BASE.promo)}</span></div><p>${esc(BASE.d)}</p></div>
<div class="adds">${ADDONS.map((a) => `<label class="add"><input type="checkbox" data-add="${a.id}" checked><span class="sw" aria-hidden="true"></span><span><b>${esc(a.t)}</b>${a.star ? `<span class="star">biorą najczęściej</span>` : ""}<p>${esc(a.e)}</p><small>${esc(a.who)}</small></span><span class="ap"><s>${zl(a.market)}</s>${zl(a.price)}<em>−${Math.round(OFF * 100)}%</em></span></label>`).join("")}</div>
</div>
<aside class="sum glass" aria-live="polite">
<div class="row"><span>Strona</span><span>${zl(BASE.promo)}</span></div>
<div class="row"><span>Dodatki <span id="addn"></span></span><span id="adds">0 zł</span></div>
<div class="tot"><span>Razem</span><b id="total">${zl(ALL)}</b></div>
<p style="margin:16px 0 0;color:var(--mu);font-size:14px">Cena strony obowiązuje jeszcze:</p>
<div class="timer" id="timer"><span><b id="th">48</b><small>godz.</small></span><span><b id="tm">00</b><small>min</small></span><span><b id="ts">00</b><small>sek.</small></span></div>
<div class="ctrl"><button type="button" class="btn btn-g btn-s" id="allon">Wszystko</button><button type="button" class="btn btn-g btn-s" id="alloff">Tylko strona</button></div>
<button type="button" class="btn btn-g" id="copy">${ICON.copy}<span>Skopiuj skład</span></button>
<a class="btn btn-a" href="${DEVUZ}" target="_blank" rel="noopener">${ICON.tg}<span>Porozmawiaj z DevUz Studio</span></a>
</aside></div>
</div></section>`;
}

function landPage() {
  const site = [
    "Wjazd kamery w znak i lakier, który łapie światło za kursorem",
    "„Od wgniecenia do lustra”: przewijanie naprawia drzwi",
    "Sześć Waszych usług, przed i po z Waszych zdjęć",
    "Kalkulator ze schematem auta i pakietami, SMS z wyceną",
    "Szkoda z OC krok po kroku, status naprawy, termin, dojazd",
  ];
  const pan = [
    "Zgłoszenie ze strony na górze listy, ze schematem i zdjęciami",
    "Etap naprawy jednym kliknięciem, klient widzi go na stronie",
    "Przychód, droga klienta, najczęstsze naprawy, kalendarz",
    "Materiały: lakiery i podkłady, co się kończy",
    "Role: recepcja nie widzi marży, historia działań",
  ];
  const li = (a) => `<ul class="feat">${a.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>`;
  const steps = [
    "Otwórz stronę i w kalkulatorze kliknij na schemacie maskę i drzwi.",
    "Wyślij zgłoszenie z dowolnym numerem: to makieta.",
    "Otwórz panel: zgłoszenie jest na górze. Przyjmij auto i zmień etap, a strona pokaże go w „Status naprawy”.",
  ];
  const ld = { base: BASE.promo, hours: OFFER_HOURS, add: ADDONS.map((a) => ({ id: a.id, p: a.price, m: a.market, t: a.t })), t: { copied: "Skład skopiowany", tot: "Razem" } };
  return `${head("AutoPepe · makieta strony i panelu warsztatu · DevUz Studio", "Makieta dla AutoPepe: nowa strona warsztatu i panel do zgłoszeń, napraw i materiałów. Konstruktor ceny.")}
<style>${CSS}</style>
</head>
<body>
${dzIntroSolo("pl")}
${introHtml()}
<header class="top"><div class="top-in glass">
${LOGO("")}
<nav class="nav" aria-label="Sekcje"><a href="#choose">Strona czy panel</a><a href="#try">Jak sprawdzić</a><a href="#offer">Cena</a></nav>
<a class="btn btn-g btn-s" style="margin-left:auto" href="${href("site")}">Strona</a>
<a class="btn btn-a btn-s" href="${href("panel")}">${ICON.panel}<span>Panel</span></a>
</div></header>
<main>
<section class="land" id="choose"><div class="hero-bg" aria-hidden="true"><canvas class="lak" id="hl"></canvas></div><div class="wrap">
<p class="kick rise">Makieta DevUz Studio dla AutoPepe</p>
<h1 class="rise">Nowa strona AutoPepe i <em>panel warsztatu</em></h1>
<p class="lead rise">To działająca makieta na Waszych usługach, cenach i zdjęciach z autopepe.pl. Wybierz, co zobaczyć najpierw: stronę oczami klienta albo panel, w którym prowadzicie naprawy.</p>
<div class="choices">
<a class="choice rise" href="${href("site")}"><span class="ch-k">Dla klienta</span><b>Strona warsztatu</b>
<span class="ch-pic"><canvas class="lak" id="cl" aria-hidden="true"></canvas></span>
${li(site)}<span class="btn btn-g">Otwórz stronę${ICON.arrow}</span></a>
<a class="choice rise" href="${href("panel")}"><span class="ch-k">Dla Was</span><b>Panel warsztatu</b>
<span class="ch-pic ch-pn"><span class="browser"><span class="bh"><i></i><i></i><i></i></span><span class="bb"><span class="kpi"><small>Przychód, 30 dni</small><b>86,4 tys. zł</b></span><span class="kpi"><small>Ze strony</small><b>AP-2047</b></span><span class="kpi w"><small>Dzień po dniu · dane demonstracyjne</small><span class="spark" id="lspark"></span></span></span></span></span>
${li(pan)}<span class="btn btn-a">Otwórz panel${ICON.arrow}</span></a>
</div>
</div></section>
<section class="sec" id="try"><div class="wrap">
<p class="kick rise">Jak sprawdzić w minutę</p>
<h2 class="h2 rise">Strona i panel <b>są połączone</b></h2>
<ol class="ol">${steps.map((s) => `<li class="rise">${s}</li>`).join("")}</ol>
<div class="hero-act rise"><a class="btn btn-a" href="${href("site")}#wycena">Zacznij od kalkulatora${ICON.arrow}</a></div>
</div></section>
${offer()}
</main>
<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO("")}<p style="margin-top:16px">Usługi, ceny „od”, zdjęcia i teksty: autopepe.pl. Widełki kalkulatora: środek warszawskiego rynku. Zlecenia i przychód w panelu: dane demonstracyjne.</p></div>
<div><h4>Makieta</h4><a href="${href("site")}">Strona warsztatu</a><a href="${href("panel")}">Panel warsztatu</a><a href="#offer">Cena</a></div>
<div><h4>DevUz Studio</h4><a href="https://devuz.studio" target="_blank" rel="noopener">devuz.studio</a><a href="${DEVUZ}" target="_blank" rel="noopener">Telegram</a></div>
<div><h4>AutoPepe</h4><a href="tel:${COMPANY.tel}">${COMPANY.phone}</a><a href="mailto:${COMPANY.mail}">${COMPANY.mail}</a></div>
</div>
<div class="sm"><span>Makieta DevUz Studio. Korzystając z makiety, akceptujesz <a href="${TERMS}" target="_blank" rel="noopener">warunki makiety</a>.</span></div>
</div></footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="ap-land">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<script>
${LAND_JS}</script>
</body>
</html>`;
}

/* Zapowiedź: przelot nad lakierowanymi literami, znak siada w szapce. Kod —
   intro/intro.js, zbudowany do intro3d.js (mechanika Neoline i CHECHFARM). */
const INTRO_CSS = `.api{position:fixed;inset:0;z-index:2147482000;background-color:#0b0c0e;transition:background-color .8s ease}
.api canvas{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .7s}
.api.on canvas{opacity:1}.api.out{background-color:rgb(11 12 14 / 0);pointer-events:none}.api.out canvas{opacity:0;transition-duration:.25s}
.api-skip{position:absolute;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));min-height:44px;padding:8px 16px;border:1px solid rgb(255 255 255 / .24);border-radius:999px;font:500 12px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:rgb(255 255 255 / .8);background:rgb(11 12 14 / .4);cursor:pointer;transition:opacity .3s}
.api.out .api-skip{opacity:0}
.api-fly{position:fixed;z-index:2147482001;margin:0;pointer-events:none;transition:opacity .25s,transform 1s cubic-bezier(.65,0,.35,1)}`;
const INTRO_JS = `(function(){var o=document.getElementById('api'),r=document.documentElement;if(!o)return;
var force=/[?&]intro=1/.test(location.search),seen=false;try{seen=!!sessionStorage.getItem('ap-intro')}catch(e){}
var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var ok=!rm&&(force||!seen)&&!(navigator.connection&&navigator.connection.saveData);
if(ok){try{var c=document.createElement('canvas'),g=c.getContext('webgl2')||c.getContext('webgl');ok=!!g;var x=g&&g.getExtension('WEBGL_lose_context');if(x)x.loseContext()}catch(e){ok=false}}
if(!ok){o.parentNode.removeChild(o);return}
r.classList.add('api');try{sessionStorage.setItem('ap-intro','1')}catch(e){}
window.apiOff=function(){r.classList.remove('api');o.classList.add('out');setTimeout(function(){if(o.parentNode)o.parentNode.removeChild(o)},900)};
var last=Date.now();(function w(){if(window.apiOn||!o.parentNode)return;if(document.getElementById('dzi'))last=Date.now();if(Date.now()-last>4000){window.apiOff();return}setTimeout(w,200)})();
})()`;
function introHtml() {
  return `<div class="api" id="api" role="presentation"><canvas></canvas><button type="button" class="api-skip">Pomiń</button></div>
<style>${INTRO_CSS}</style>
<script>${INTRO_JS}</script>
<script src="${IMG}/intro3d.js" defer></script>`;
}

/* ── Panel (wzorzec Greenwell) ─────────────────────────────────────── */
(function checkDict() {
  const keys = new Set([...PANEL_JS.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  for (const k of ["tab_", "st_", "r_"]) keys.delete(k);
  for (const k of keys) if (!PANEL_UI[k]) throw new Error(`panel: brak podpisu «${k}» w panel-ui.mjs`);
})();

function panelPage() {
  const pd = { site: href("site"), home: href(), ui: PANEL_UI, parts: Object.fromEntries(PARTS), dmg: Object.fromEntries(DAMAGE.map((d) => [d.id, d.t])) };
  return `${head("Panel warsztatu AutoPepe · dane demonstracyjne", "Panel warsztatu AutoPepe: zgłoszenia ze strony, etapy napraw, kalendarz, materiały, historia i role. Dane demonstracyjne.")}
<style>${CSS}${PANEL_CSS}</style>
</head>
<body class="pn">
<div id="app"></div>
<footer class="pn-foot">Makieta DevUz Studio, dane demonstracyjne. Korzystając z makiety, akceptujesz <a href="${TERMS}" target="_blank" rel="noopener">warunki makiety</a>.</footer>
<script type="application/json" id="pn-data">${JSON.stringify(pd).replace(/</g, "\\u003c")}</script>
<script>
${PANEL_JS}</script>
</body>
</html>`;
}

const out = { "": landPage(), site: sitePage(), panel: panelPage() };
for (const [k, v] of Object.entries(out)) {
  if (/[\u2014\u2013]/.test(v)) throw new Error(`${k || "(land)"}: długa kreska na stronie`);
  if (/[А-Яа-яЁёІіЇїЄєҐґ]/.test(v)) throw new Error(`${k || "(land)"}: cyrylica na stronie, strona jest tylko po polsku`);
  if (/ - /.test(v.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style>[\s\S]*?<\/style>/g, ""))) throw new Error(`${k || "(land)"}: kreska ze spacjami`);
}
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/* Zbiór dla serwera (lib/proto/bundles): style i skrypty raz. */
const parts = { J: `<script>\n${JS}</script>`, C: `<style>${CSS}</style>`, PJ: `<script>\n${PANEL_JS}</script>`, LJ: `<script>\n${LAND_JS}</script>` };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const [name, part] of Object.entries(parts)) p = p.split(part).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "autopepe.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(land)").padEnd(10), v.length);
