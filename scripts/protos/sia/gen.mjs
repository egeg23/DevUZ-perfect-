import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { DZ_VIDEO } from "../dz-video.mjs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";

/*
 * Макет нового сайта архитектурного бюро SIA (sia88.ru, Москва).
 * Всё на странице — с сайта бюро: проекты, тексты, снимки, команда,
 * выставки, адрес и мессенджеры (data.json собирает extract.py).
 *
 * Мысль макета — знак бюро: буквы SIA из стальных ферм. Каркас прежде
 * облика: каждый проект сначала появляется чертежом, линиями того же
 * рендера, и на глазах становится рендером. У каждого блока своё движение
 * (скролл не перехватывается, всё на transform и opacity):
 *   заставка        промо DevUz, затем знак SIA проявляется и раскрывается
 *   первый экран    чертёж стирается в рендер; прокрутка сводит кадр в арку,
 *                   на ПК под курсором линза с чертежом
 *   цифры           разряды прокатываются, как счётчик
 *   архитектура     галерея едет вбок от прокрутки, чертёж каждой карточки
 *                   проявляется в рендер у середины экрана
 *   интерьеры       карточки ложатся стопкой, нижняя уходит вглубь
 *   архив           65 кодов строками, за курсором плывёт обложка
 *   услуги          снимок открывается ламелями, как жалюзи
 *   этапы           линия прочерчивается прокруткой
 *   переходы        стальные ламели закрывают экран и открывают новый
 * Язык один — русский, как у сайта бюро. Страницы проектов: proekt/<адрес>.
 *
 * Сборка: node gen.mjs → content/proto-bundles/sia.json и out/pages.json.
 */

const DIR = new URL(".", import.meta.url).pathname;
const read = (f) => readFileSync(DIR + f, "utf8");
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const DATA = JSON.parse(read("data.json"));

const IMG = "/protos/sia";
const BASE = "__PROTO_BASE__";
const TERMS = "https://devuz.studio/ru/mockup-terms";
const FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Golos+Text:wght@400;700&display=swap";

/* Контакты — со страницы «Контакты» и из подвала sia88.ru. */
const PHONE = "+7 (495) 098-04-93";
const PHONE_TEL = "tel:+74950980493";
const MOBILE = "79150103671";
const MAIL = "info@sia88.ru";
const WA = (text) => `https://wa.me/${MOBILE}?text=${encodeURIComponent(text)}`;
const TG = `https://t.me/+${MOBILE}`;
const SOCIAL = [["Telegram-канал", "https://t.me/sia_conception"], ["VK", "https://vk.com/siaa88"], ["Pinterest", "https://ru.pinterest.com/siaconception/"]];
const ASK = "Здравствуйте! Хочу обсудить проект с бюро SIA.";
const ADDR = "Москва, Таганская площадь, 88, этаж 2";
const METRO = "Таганская (кольцевая), Таганская (Таганско-Краснопресненская), Марксистская";
const HOURS = "Понедельник-пятница, 10:00-18:00";

/* Тире в текстах бюро: на макете длинных тире нет (правило макетов). */
/* Штампы в текстах бюро, которые проверка макета не пропускает: правим
   слово, смысл оставляем. */
const FIX = [["уникальная резьба", "резьба"], ["уникальную атмосферу уюта и роскоши", "ощущение уюта и роскоши"], ["продуман до мелочей", "тщательно продуман"], ["не просто жилье, а место силы", "не только жильё, но и место силы"], ["Камень, не просто материал, а основа концепции", "Камень здесь основа концепции"], ["Камень — не просто материал, а основа концепции", "Камень здесь основа концепции"], ["Проект не просто вход, а первое впечатление", "Проект задаёт первое впечатление"], ["Проект — не просто вход, а первое впечатление", "Проект задаёт первое впечатление"]];
const plain = (s) => FIX.reduce((t, [a, b]) => t.split(a).join(b), s).replace(/\s*[—–]\s*/g, ", ").replace(/(^|\.\s)Это, /g, "$1Это ").replace(/ /g, " ").replace(/,\s*,/g, ",");
const href = (path = "") => BASE + (path ? "/" + path : "");
const pHref = (p) => href("proekt/" + p.slug);
const pic = (slug, i, m) => `${IMG}/p/${slug}-${i}${m ? "-m" : ""}.webp`;
const drw = (slug, m) => `${IMG}/d/${slug}${m ? "-m" : ""}.webp`;
const thumb = (slug) => `${IMG}/t/${slug}.webp`;
const pad = (n) => String(n).padStart(2, "0");
const FEAT = DATA.featured.map((p) => ({ ...p, lead: p.lead.map(plain), steps: p.steps.map(plain), more: p.more.map(plain), title: plain(p.title), sub: plain(p.sub) }));
const ARH = FEAT.filter((p) => p.cat === "arh");
const INT = FEAT.filter((p) => p.cat === "int");
const BYCODE = Object.fromEntries(FEAT.map((p) => [p.code, p]));
const HERO = BYCODE["APx180.2606"];
const img = (slug, i, alt, extra = "") => `<img src="${pic(slug, i, true)}" srcset="${pic(slug, i, true)} 800w, ${pic(slug, i)} 1500w" sizes="(max-width: 800px) 100vw, 60vw" alt="${esc(alt)}" loading="lazy" decoding="async"${extra}>`;
const facts = (p) => [p.area && `${p.area} м²`, p.term && `${p.term} мес.`].filter(Boolean).join(" · ");
const kindOf = (p) => (p.kinds[0] || (p.cat === "arh" ? "Архитектура" : "Интерьер"));

/* Строки заголовка поднимаются из-под маски. */
const lines = (arr) => arr.map((s) => `<span class="ln"><span>${s}</span></span>`).join("");
/* Буквы ссылки перекатываются при наведении. */
const roll = (s) => `<span class="roll" data-t="${esc(s)}"><span>${esc(s)}</span></span>`;

const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  wa: I('<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/><path d="m9 13 8-6"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
};

/* Знак DevUz Studio для заставки — тот же, что в промо на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZSIGN = `<svg class="dz-sign" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

function introHtml() {
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  return `<div class="intro" id="intro" role="presentation">
${DZ_VIDEO}
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">макет нового сайта архитектурного бюро</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<div class="br-stage" aria-hidden="true"><div class="br-pp"></div><div class="br-dk"></div><canvas class="br-cv"></canvas><div class="br-logo"><span class="br-wipe"><img src="${IMG}/logo-w.png" alt="" width="400" height="178"></span></div><p class="br-kind">архитектурное бюро · Таганская площадь, 88</p></div>
<button type="button" class="in-skip" id="in-skip">Пропустить</button>
</div>`;
}

/* ── Общие части ─────────────────────────────────────────────────────── */
const NAV = [["arhitektura", "Архитектура", ARH[0]], ["prolet", "Пролёт", HERO], ["interery", "Интерьеры", INT[0]], ["arhiv", "Архив", ARH[4]], ["uslugi", "Услуги", ARH[2]], ["byuro", "Бюро", INT[3]], ["promo", "Наше промо", HERO], ["kontakty", "Контакты", ARH[5]]];

function menuHtml(onHome) {
  const to = (id) => (onHome ? "#" + id : href() + "#" + id);
  return `<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Меню" hidden>
<div class="mn-bgs" aria-hidden="true">${NAV.map(([id, , p], i) => `<div class="mn-bg" data-i="${i}"><img src="${pic(p.slug, 0, true)}" alt="" loading="lazy" decoding="async"></div>`).join("")}</div>
<div class="mn-in">
<nav class="mn-nav" aria-label="Разделы">${NAV.map(([id, n], i) => `<a href="${to(id)}" data-i="${i}"><span class="mn-n">${pad(i + 1)}</span><span class="mn-t">${n}</span></a>`).join("")}</nav>
<div class="mn-side"><p class="cap">Москва, Таганская площадь, 88, этаж 2</p><a class="mn-l" href="${PHONE_TEL}">${PHONE}</a><a class="mn-l" href="mailto:${MAIL}">${MAIL}</a><a class="btn" href="${WA(ASK)}" target="_blank" rel="noopener">${ICON.wa}<span>Написать в WhatsApp</span></a></div>
</div>
</div>`;
}

/* Ламели перехода между страницами: восемь стальных полос. */
const SHUTTER = `<div class="shut" id="shut" aria-hidden="true">${Array.from({ length: 8 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}<p class="shut-t" id="shut-t"></p></div>`;

function shell(opts) {
  const to = (id) => (opts.home ? "#" + id : href() + "#" + id);
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#ece7de">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
${opts.preload || ""}
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=${opts.intro ? "false" : "true"};try{if(sessionStorage.getItem('sia-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden';try{if(sessionStorage.getItem('sia-tr'))r.classList.add('tr-in')}catch(e){}})()</script>
@@S@@
</head>
<body class="${opts.cls || ""}">
${opts.intro ? introHtml() : ""}
${SHUTTER}
<a class="skip" href="#main">К содержанию</a>
<header class="top" id="top">
<a class="top-logo" href="${href()}" aria-label="SIA, архитектурное бюро, на главную"><img src="${IMG}/logo-k.png" alt="" width="400" height="178"></a>
<nav class="top-nav" aria-label="Разделы">${NAV.filter((x) => x[0] !== "prolet").slice(0, 4).map(([id, n]) => `<a href="${to(id)}">${roll(n)}</a>`).join("")}</nav>
<div class="top-r">
<a class="top-tel" href="${PHONE_TEL}" data-kr="phone">${roll(PHONE)}</a>
<button type="button" class="burger" id="burger" aria-expanded="false" aria-controls="menu"><span class="bg-l" aria-hidden="true"><i></i><i></i></span><span class="bg-t">Меню</span></button>
</div>
</header>
${menuHtml(!!opts.home)}
<main id="main">
${opts.body}
</main>
<footer class="foot">
<div class="foot-top">
<div><p class="cap">Обсудить проект</p><a class="foot-big" href="${WA(ASK)}" target="_blank" rel="noopener">${roll("WhatsApp")}</a><a class="foot-big" href="${TG}" target="_blank" rel="noopener">${roll("Telegram")}</a></div>
<div class="foot-c"><p data-k="addr">${ADDR}</p><p><a href="${PHONE_TEL}" data-k="phone">${PHONE}</a></p><p><a href="mailto:${MAIL}" data-k="mail">${MAIL}</a></p><p class="foot-s">${SOCIAL.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${roll(n)}</a>`).join("")}</p></div>
</div>
<img class="foot-logo" src="${IMG}/logo-k.png" alt="SIA" width="400" height="178" loading="lazy" decoding="async">
<div class="foot-b"><p>SIA · архитектурное бюро · Москва</p><p>Макет нового сайта: DevUz Studio · <a href="${href("panel")}">Панель сайта</a> · <a href="${TERMS}" target="_blank" rel="noopener">Условия макета</a></p></div>
</footer>
<a class="dock" href="${WA(ASK)}" target="_blank" rel="noopener">${ICON.wa}<span>Обсудить проект в WhatsApp</span></a>
${opts.home ? vToggle(1) : ""}
<div class="peek" id="peek" aria-hidden="true"><img alt=""></div>
<div class="cursor" id="cursor" aria-hidden="true"><span></span></div>
${opts.intro ? `<script>\nvar SIA_LINES=${read("lines.json").trim()};\n${strip(read("intro.js"))}</script>` : ""}
@@J@@
</body>
</html>`;
}

/* ── Главная ─────────────────────────────────────────────────────────── */
/* Арка: лист бумаги с проёмом, прокрутка сводит его с огромного к окну. */
const ARCH = `<svg class="arch arch-d" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="M-4000 -4000H5600V5000H-4000Z M590 880V400A210 210 0 0 1 1010 400V880Z"/></svg><svg class="arch arch-m" viewBox="0 0 1000 1600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="M-4000 -4000H5000V5600H-4000Z M320 1230V560A180 180 0 0 1 680 560V1230Z"/></svg>`;

const HERO_SUB = "Архитектура, дизайн интерьеров и экстерьеров, авторский надзор и сопровождение.";
function heroBlock() {
  const h = HERO;
  return `<section class="hero" aria-label="Первый экран">
<div class="hero-stick">
<figure class="hero-pic" data-cur="Чертёж">
<img class="hero-d" src="${drw(h.slug, true)}" srcset="${drw(h.slug, true)} 800w, ${drw(h.slug)} 1500w" sizes="100vw" alt="" fetchpriority="high">
<span class="wipe"><span class="wipe-in"><img class="hero-r" src="${pic(h.slug, 0, true)}" srcset="${pic(h.slug, 0, true)} 800w, ${pic(h.slug, 0)} 1500w" sizes="100vw" alt="${esc(h.title)}" fetchpriority="high"></span></span>
<span class="lens" aria-hidden="true"><span class="lens-in"><img src="${drw(h.slug)}" alt=""></span></span>
</figure>
${ARCH}
<div class="hero-tx">
<p class="cap hero-k">Архитектурное бюро · Москва</p>
<h1 class="hero-h"><span class="hh hh-1">${lines(["Проектируем,"])}</span><span class="hh hh-2">${lines(["<em>визуализируем,</em>"])}</span><span class="hh hh-3">${lines(["сопровождаем"])}</span></h1>
<p class="hero-sub">${HERO_SUB}</p>
</div>
<p class="hero-ink" aria-hidden="true"><span class="hi-l">Архитектура</span><span class="hi-r"><em>и интерьер</em></span></p>
<a class="hero-cap" href="${pHref(h)}" data-tr="${esc(h.code)}"><span class="code">${h.code}</span><span>${esc(h.title)}</span></a>
<p class="cap hero-scroll" aria-hidden="true">Листайте: чертёж станет зданием</p>
</div>
</section>`;
}

/* Цифры — со страниц «О бюро» и «Портфолио» sia88.ru. */
const STATS = [["50", "+", "проектов в работе бюро"], ["30 000", "+", "м² архитектурных проектов"], ["20 000", "+", "м² интерьеров"], ["50", "+", "специалистов в команде"]];
const odo = (s) => [...s].map((c) => (/\d/.test(c) ? `<span class="od" style="--d:${c}"><span>${"0123456789".split("").map((n) => `<i>${n}</i>`).join("")}</span></span>` : `<span class="od-s">${c === " " ? "&#8201;" : c}</span>`)).join("");

function statsBlock() {
  return `<section class="stats" aria-label="Бюро в цифрах">
<ul>${STATS.map(([n, plus, t], i) => `<li style="--k:${i}"><p class="st-n" aria-label="${n}${plus}">${odo(n)}<span class="st-p">${plus}</span></p><p class="cap">${t}</p></li>`).join("")}</ul>
</section>`;
}

/* Заявление — слова бюро со страницы «Архитектура». */
const STMT = "В наших проектах объём, конструкция и образ рождаются в диалоге с заказчиком: каждое решение продиктовано и заданием, и стремлением к гармонии между функцией, контекстом и эстетикой.";
function statementBlock() {
  const words = STMT.split(" ").map((w, i) => `<span class="w" style="--i:${i}">${esc(w)}</span>`).join(" ");
  return `<section class="stmt" aria-label="О бюро"><div class="stmt-stick"><p class="cap">Бюро SIA</p><p class="stmt-t">${words}</p></div></section>`;
}

function archBlock() {
  const card = (p, i) => `<a class="ac ${i % 2 ? "ac-r" : "ac-a"}" href="${pHref(p)}" data-tr="${esc(p.code)}" data-cur="Открыть" style="--i:${i}">
<span class="ac-pic"><img class="ac-d" src="${drw(p.slug, true)}" alt="" loading="lazy" decoding="async"><img class="ac-r-img" src="${pic(p.slug, 0, true)}" srcset="${pic(p.slug, 0, true)} 800w, ${pic(p.slug, 0)} 1500w" sizes="(max-width: 900px) 92vw, 40vw" alt="${esc(p.title)}" loading="lazy" decoding="async"></span>
<span class="ac-tx"><span class="code">${p.code}</span><span class="ac-t">${esc(p.sub)}</span><span class="cap">${esc(kindOf(p))}${facts(p) ? " · " + facts(p) : ""}</span></span>
</a>`;
  return `<section class="arh" id="arhitektura" aria-label="Архитектура">
<div class="arh-stick">
<div class="sec-h arh-h"><p class="cap">01 · Архитектура</p><h2 class="big" data-lines>${lines(["От эскиза", "<em>до рабочих чертежей</em>"])}</h2><p class="arh-note">Каждый проект появляется чертежом и проявляется в рендер, пока вы листаете.</p></div>
<div class="arh-track" id="arh-track">${ARH.map(card).join("")}</div>
<div class="arh-bar" aria-hidden="true"><i id="arh-bar"></i></div>
</div>
</section>`;
}

function intBlock() {
  return `<section class="int" id="interery" aria-label="Интерьеры">
<div class="sec-h"><p class="cap">02 · Интерьеры</p><h2 class="big" data-lines>${lines(["От планировки", "<em>до подбора материалов</em>"])}</h2></div>
<div class="int-stack">${INT.map((p, i) => `<article class="ic" style="--i:${i}">
<a class="ic-in" href="${pHref(p)}" data-tr="${esc(p.code)}" data-cur="Открыть">
<span class="ic-pic">${img(p.slug, 0, p.title)}</span>
<span class="ic-tx"><span class="ic-n">${pad(i + 1)} / ${pad(INT.length)}</span><span class="code">${p.code}</span><span class="ic-t">${esc(p.sub)}</span><span class="ic-d">${esc(p.lead[0].split(". ").slice(0, 2).join(". ").replace(/\.?$/, "."))}</span><span class="cap">${esc(kindOf(p))}${facts(p) ? " · " + facts(p) : ""}</span></span>
</a>
</article>`).join("")}</div>
</section>`;
}

/* ── Пролёт: камера летит по рендерам бюро ───────────────────────────────
   Вилла APx180.2606 снаружи: участок, фасад, верхние уровни, бассейн, спа;
   у спа камера уходит в стекло, и за ним интерьер виллы ИНт238.2606:
   зал с бассейном, спальня, галерея-сад. Каждый кадр — рендер бюро; между
   кадрами камера наезжает в точку (fx, fy), следующий кадр проступает на
   том же движении. Подписи — слова бюро из описаний этих проектов. */
const FLY = [
  { c: "APx180.2606", src: ["apx180-2606", 1], f: [0.55, 0.5], k: "Участок", t: "Дом как продолжение ландшафта", d: "Террасы, панорамные окна и плавные линии фасада связывают помещения с участком и бассейном." },
  { c: "APx180.2606", src: ["apx180-2606", 0], f: [0.58, 0.45], k: "Фасад", t: "Линии горных склонов", d: "Фасады повторяют изгибы склонов: тёплый травертин, живое дерево, матовый камень." },
  { c: "APx180.2606", src: ["apx180-2606", 2], f: [0.6, 0.42], k: "Верхние уровни", t: "Приватные террасы", d: "Балконы и террасы дают комнатам свои открытые зоны, навесы и зелень закрывают от солнца." },
  { c: "APx180.2606", src: ["apx180-2606", 4], f: [0.45, 0.72], k: "Бассейн", t: "Центр зоны отдыха", d: "Бассейн встроен в террасу, каскадные ступени связывают дом с водой и ландшафтом." },
  { c: "APx180.2606", src: ["apx180-2606", 3], f: [0.6, 0.84], k: "Спа", t: "Сквозь стекло, внутрь", d: "Спа-зона встроена в первый этаж и смотрит на бассейн и сад.", deep: true },
  { c: "ИНт238.2606", src: ["int238-2606", 0], f: [0.6, 0.55], k: "Зал с бассейном", t: "Сердце дома", d: "Двусветный зал с крытым бассейном свободной формы, кессонный потолок и панно с соколами.", drawing: true },
  { c: "ИНт238.2606", src: ["int238-2606", 3], f: [0.5, 0.55], k: "Спальня", t: "Тише и глубже по тону", d: "Двойная высота, вид на сад, панно с соколом и люстра из стеклянных перьев." },
  { c: "ИНт238.2606", src: ["int238-2606", 4], f: [0.5, 0.47], k: "Галерея-сад", t: "Вода ведёт во дворик", d: "Водный канал с галечным дном ведёт через анфиладу к внутреннему дворику с зеленью." },
];
function flyBlock() {
  const n = FLY.length;
  return `<section class="fly" id="prolet" aria-label="Пролёт по проекту">
<div class="fly-stick">
${FLY.map((f, i) => `<figure class="fl" data-i="${i}" data-c="${f.c}"${f.deep ? " data-deep" : ""} style="--fx:${f.f[0] * 100}%;--fy:${f.f[1] * 100}%">${f.drawing ? `<img class="fl-d" data-src="${drw(f.src[0], true)}" data-srcset="${drw(f.src[0], true)} 800w, ${drw(f.src[0])} 1500w" sizes="100vw" alt="">` : ""}<img class="fl-r" data-src="${pic(f.src[0], f.src[1], true)}" data-srcset="${pic(f.src[0], f.src[1], true)} 800w, ${pic(f.src[0], f.src[1])} 1500w" sizes="100vw" alt="${esc(`${f.c}: ${f.k.toLowerCase()}`)}"></figure>`).join("")}
<div class="fl-shade" aria-hidden="true"></div>
<div class="fl-top"><p class="cap">Пролёт по проекту</p><p class="fl-code code" id="fl-code">${FLY[0].c}</p><p class="cap fl-n"><span id="fl-n">01</span> / ${pad(n)}</p></div>
<div class="fl-cards">${FLY.map((f, i) => `<article class="flc" data-i="${i}"><p class="flc-k cap">${pad(i + 1)} · ${f.k}</p><h3 class="flc-t">${f.t}</h3><p class="flc-d">${f.d}</p><p class="flc-ticks" aria-hidden="true">${FLY.map((_, k) => `<i${k < i ? ' class="done"' : k === i ? ' class="on"' : ""}></i>`).join("")}</p></article>`).join("")}</div>
<p class="cap fl-hint" aria-hidden="true">Листайте: камера пройдёт сквозь стекло</p>
</div>
<div class="fly-still">${FLY.map((f) => `<figure>${img(f.src[0], f.src[1], `${f.c}: ${f.k}`)}<figcaption><span class="code">${f.c}</span> · ${f.k}. ${f.d}</figcaption></figure>`).join("")}</div>
</section>`;
}

/* 3D-пролёт: 300 кадров Blender по прокрутке — в виллу APx180.2606. Модель
   собрана нами по пяти рендерам бюро (scripts/blender/sia), это не рабочая
   модель бюро, и блок так и подписан. Кадры — /protos/sia/f. */
const BFLY = [
  { from: 0, to: 0.27, k: "Долина", t: "Пике к оливам", d: "С высоты над долиной вниз, к роще на склоне." },
  { from: 0.27, to: 0.5, k: "Облёт", t: "Вокруг виллы", d: "Три уровня, тёплая линия света под каждой плитой, стекло от пола." },
  { from: 0.5, to: 0.68, k: "Вода", t: "Над бассейном", d: "Над самой водой к открытой створке гостиной." },
  { from: 0.68, to: 1.01, k: "Гостиная", t: "Внутри", d: "Дуб, лён, травертин и вид на долину из гостиной." },
];
function bflyBlock() {
  const F = "/protos/sia/f";
  return `<section class="bfl" id="prolet-3d" aria-label="3D-пролёт в APx180.2606" data-n="300" data-d="${F}/d/" data-m="${F}/m/">
<div class="bfl-stick">
<img class="bfl-poster" src="${F}/d/0001.webp" alt="" aria-hidden="true" loading="lazy" decoding="async">
<canvas class="bfl-cv" aria-hidden="true"></canvas>
<div class="fl-shade" aria-hidden="true"></div>
<div class="fl-top"><p class="cap">3D-пролёт · APx180.2606</p><p class="bfl-h">Залетаем<br><em>в виллу на склоне</em></p><p class="cap fl-n"><span id="bfl-f">001</span> / 300</p></div>
<div class="bfl-loader" id="bfl-loader" aria-hidden="true"><p class="cap">Загрузка · <b id="bfl-pct">0</b>%</p><span class="bfl-track"><i id="bfl-fill"></i></span></div>
<div class="fl-cards">${BFLY.map((s, i) => `<article class="flc bfc" data-from="${s.from}" data-to="${s.to}"><p class="flc-k cap">${pad(i + 1)} · ${s.k}</p><h3 class="flc-t">${s.t}</h3><p class="flc-d">${s.d}</p><p class="flc-ticks" aria-hidden="true">${BFLY.map(() => "<i><b></b></i>").join("")}</p></article>`).join("")}</div>
<p class="cap bfl-note">Интерпретация DevUz Studio по рендерам бюро: модель APx180.2606 собрана нами в Blender, это не рабочая модель проекта. 300 кадров идут за прокруткой.</p>
</div>
<div class="bfl-still">${[1, 100, 200, 300].map((f, i) => `<figure><img src="${F}/d/${String(f).padStart(4, "0")}.webp" alt="" loading="lazy" decoding="async"><figcaption class="cap">3D-пролёт по рендерам APx180.2606 · ${BFLY[i].k}</figcaption></figure>`).join("")}</div>
</section>`;
}

/* Бегущая строка: коды всех проектов и услуги, скорость от прокрутки
   (Scroll Based Velocity, Magic UI). */
function veloBlock() {
  const codes = DATA.index.map((p) => p.code);
  const row = (items, dir) => `<div class="velo-row" data-velo="${dir}"><div class="velo-t">${[0, 1, 2].map(() => items.map((x) => `<span>${esc(x)}</span><i></i>`).join("")).join("")}</div></div>`;
  return `<section class="velo" aria-hidden="true">${row(codes.slice(0, 22), 1)}${row(["Проектирование", "Дизайн-проект", "3D-визуализация", "Авторский надзор", "Согласование", "Комплексное управление"], -1)}</section>`;
}

/* Что проектируем: барабан типов объектов крутится прокруткой, рядом
   число проектов этого типа в архиве бюро. */
function kindsBlock() {
  const cnt = {};
  DATA.index.forEach((p) => p.kinds.forEach((k) => { cnt[k] = (cnt[k] || 0) + 1; }));
  const kinds = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  const ring = [...kinds, ...kinds];
  const step = 360 / ring.length;
  return `<section class="kd" aria-label="Что проектирует бюро">
<div class="kd-l"><p class="cap">Что проектируем</p><h2 class="big" data-lines>${lines(["Десять типов", "<em>объектов</em>"])}</h2><ul class="kd-list">${kinds.map(([k, n]) => `<li><span>${esc(k)}</span><b>${n}</b></li>`).join("")}</ul></div>
<div class="drum" aria-hidden="true"><div class="drum-track" id="drum">${ring.map(([k, n], i) => `<span style="--a:${(i * step).toFixed(1)}deg">${esc(k)}<sup>${n}</sup></span>`).join("")}</div></div>
</section>`;
}

/* Папки по типам (Glass Folder Cards, kedhareswer, 21st.dev, MIT): проекты
   архива, сгруппированные бюро по типам объектов, выходят из папки веером. */
const GF_BACK = "M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z";
const GF_FH = 198;
const GF_FRONT = `M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 ${GF_FH - 22}A22 22 0 0 1 318 ${GF_FH}L22 ${GF_FH}A22 22 0 0 1 0 ${GF_FH - 22}Z`;
const plural = (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "проект" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "проекта" : "проектов"}`;
const FOLDERS = [
  { n: "Загородные дома", k: ["Загородный дом"] },
  { n: "Жилые и клубные дома", k: ["Клубный дом", "Жилой дом", "Жилой комплекс"] },
  { n: "Квартиры", k: ["Жилая квартира", "Пентхаус"] },
  { n: "Общественные", k: ["Общественное пространство", "Клиника", "Офисное здание", "Образовательное учреждение"] },
];
function folderHtml(s, i) {
  const ps = DATA.index.filter((p) => p.kinds.some((k) => s.k.includes(k)));
  const pick = [...ps.filter((p) => BYCODE[p.code]), ...ps.filter((p) => !BYCODE[p.code])].slice(0, 4);
  const sheets = pick.map((p, v, arr) => {
    const slot = arr.length <= 1 ? 0 : (v / (arr.length - 1)) * 2 - 1;
    const h = [...p.slug].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7 + i);
    const st = `--slot:${slot.toFixed(2)};--depth:${arr.length - 1 - v};--jx:${((((h % 100) / 100) - 0.5) * 10).toFixed(2)}px;--jr:${(((((h >> 8) % 100) / 100) - 0.5) * 3.2).toFixed(2)}deg;z-index:${v + 1}`;
    const inner = `<img class="gf-sheet-art" src="${thumb(p.slug)}" alt="" loading="lazy" decoding="async"><span class="gf-sheet-head"><span class="gf-sheet-name">${p.code}</span><span class="gf-sheet-meta">${esc(p.kinds[0] || "")}</span></span>`;
    const f = BYCODE[p.code];
    return `<div role="listitem" class="gf-slot">${f ? `<a class="gf-sheet" href="${pHref(f)}" data-tr="${esc(p.code)}" style="${st}">${inner}</a>` : `<span class="gf-sheet" style="${st}">${inner}</span>`}</div>`;
  }).join("");
  return `<div class="gf-cell"><div class="gf" data-gf style="--d:${i * 140}ms">
<div class="gf-stage"><div class="gf-tilt">
<div class="gf-shadow" aria-hidden="true"></div>
<div class="gf-back" style="clip-path:path('${GF_BACK}')" aria-hidden="true"><img class="gf-art" src="${thumb(pick[0].slug)}" alt="" loading="lazy" decoding="async"><div class="gf-sheen"></div></div>
<svg class="gf-rim gf-back-rim" viewBox="0 0 340 272" aria-hidden="true"><path d="${GF_BACK}"/></svg>
<div class="gf-front" style="clip-path:path('${GF_FRONT}')">
<div class="gf-tint" aria-hidden="true"></div><div class="gf-spec" aria-hidden="true"></div>
<svg class="gf-rim gf-front-rim" viewBox="0 0 340 ${GF_FH}" aria-hidden="true"><defs><linearGradient id="gfr${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient></defs><path d="${GF_FRONT}" stroke="url(#gfr${i})"/></svg>
<button type="button" class="gf-hit" aria-expanded="false" aria-label="${esc(`Открыть папку ${s.n}, ${plural(ps.length)}`)}"></button>
<div class="gf-label"><span class="cap">${pad(i + 1)}</span><span class="gf-title">${s.n}</span><span class="gf-meta">${plural(ps.length)}</span></div>
</div>
<div class="gf-files" role="list" aria-label="${esc(s.n)}">${sheets}</div>
</div></div>
</div></div>`;
}
function foldersBlock() {
  return `<section class="folders" aria-label="Проекты по типам">
<div class="fd-h"><p class="cap">Архив по типам</p><h2 class="big" data-lines>${lines(["Папки", "<em>бюро</em>"])}</h2><p class="cap fd-hint"><span class="fd-ptr">Наведите на папку, нажмите, чтобы открыть</span><span class="fd-tap">Нажмите на папку, чтобы открыть</span></p></div>
<div class="fd-grid">${FOLDERS.map(folderHtml).join("")}</div>
</section>`;
}

function indexBlock() {
  const rows = DATA.index.map((p) => {
    const f = BYCODE[p.code];
    const inner = `<span class="ix-c">${p.code}</span><span class="ix-t">${esc(plain(p.title))}</span><span class="ix-k">${esc(p.kinds.join(", "))}</span><span class="ix-a">${p.area ? p.area + " м²" : ""}</span><span class="ix-y">${p.date.slice(0, 4)}</span>`;
    const at = `data-cat="${p.cat}" data-peek="${thumb(p.slug)}"`;
    return f ? `<li><a class="ix-row" href="${pHref(f)}" data-tr="${esc(p.code)}" ${at}>${inner}<span class="ix-go">${ICON.arrow}</span></a></li>` : `<li><div class="ix-row" ${at}>${inner}<span class="ix-go"></span></div></li>`;
  }).join("");
  const n = { all: DATA.index.length, arh: DATA.index.filter((p) => p.cat === "arh").length, int: DATA.index.filter((p) => p.cat === "int").length };
  return `<section class="ix" id="arhiv" aria-label="Архив проектов">
<div class="sec-h ix-h"><p class="cap">03 · Архив</p><h2 class="big" data-lines>${lines([`${n.all} проектов`, "<em>одной строкой каждый</em>"])}</h2>
<div class="ix-f" role="group" aria-label="Какие проекты показать"><button type="button" aria-pressed="true" data-f="all">Все <sup>${n.all}</sup></button><button type="button" aria-pressed="false" data-f="arh">Архитектура <sup>${n.arh}</sup></button><button type="button" aria-pressed="false" data-f="int">Интерьеры <sup>${n.int}</sup></button></div></div>
<div class="ix-head cap" aria-hidden="true"><span>Код</span><span>Объект</span><span>Тип</span><span>Площадь</span><span>Год</span><span></span></div>
<ul class="ix-list" id="ix-list">${rows}</ul>
</section>`;
}

/* Услуги — со страниц раздела «Услуги» sia88.ru, цены и сроки — оттуда же. */
const SERVICES = [
  { n: "Проектирование", s: "Генеральное, архитектурное, конструктивное, инженерное, эскизное", d: "Все стадии проектной документации: на основе данных участка и задания архитектурные, инженерные и технологические решения.", f: "от 2 000 ₽ за м² · 2-3 недели", p: ["APx196.2411", 1] },
  { n: "Дизайн-проект", s: "Интерьера или экстерьера", d: "Подбираем отделку, мебель, освещение и декор; готовим чертежи, визуализации и планы, чтобы пространство было видно до начала работ.", f: "от 10 000 ₽ за м² · 1-4 недели", p: ["ИНт230.2502", 1] },
  { n: "3D-визуализация", s: "Интерьеры и экстерьеры", d: "Фотореалистичные модели: материалы, оттенки, текстуры и свет видны ещё до стройки, проект легко показать инвесторам.", f: "1-4 месяца", p: ["ИНт238.2606", 2] },
  { n: "Авторский надзор", s: "И сопровождение", d: "Регулярные проверки на площадке: работы идут по проекту, с утверждёнными технологиями и материалами.", f: "выезды по графику", p: ["APx182.1208", 2] },
  { n: "Согласование", s: "С ведомствами и заинтересованными лицами", d: "Собираем, готовим и подаём документы на разрешения, сопровождаем согласование до и во время строительства.", f: "по ГОСТ и СНиП РФ", p: ["APx178.2509", 1] },
  { n: "Комплексное управление", s: "От концепции до ввода в эксплуатацию", d: "Координируем поставщиков, подрядчиков и субподрядчиков, держим сроки, бюджет и качество на всех этапах.", f: "полный цикл", p: ["APx183.2504", 2] },
];

function servicesBlock() {
  return `<section class="sv" id="uslugi" aria-label="Услуги">
<div class="sec-h"><p class="cap">04 · Услуги</p><h2 class="big" data-lines>${lines(["Полный цикл", "<em>от участка до ключей</em>"])}</h2></div>
<ol class="sv-list">${SERVICES.map((s, i) => {
    const p = BYCODE[s.p[0]];
    return `<li class="sv-i" style="--i:${i}">
<div class="sv-tx"><span class="sv-n">${pad(i + 1)}</span><h3>${s.n}</h3><p class="sv-s">${s.s}</p><p class="sv-d">${s.d}</p><p class="cap sv-f">${s.f}</p></div>
<div class="sv-pic">${img(p.slug, s.p[1], s.n)}<span class="lam" aria-hidden="true">${Array.from({ length: 6 }, (_, k) => `<i style="--k:${k}"></i>`).join("")}</span></div>
</li>`;
  }).join("")}</ol>
</section>`;
}

/* Этапы — «Что было сделано» из архитектурных проектов бюро. */
const STEPS = [
  ["Участок", "Анализ участка, геологические и топографические параметры, исходно-разрешительная документация и нормативы."],
  ["Концепции", "Несколько концептуальных вариантов проекта и технико-экономические показатели объекта."],
  ["Эскиз и визуализация", "Эскизные решения, визуализация, схемы генплана и архитектурные концепции."],
  ["Рабочие чертежи", "Полный комплект чертежей и спецификаций для строительства: архитектура, конструктив, инженерия."],
  ["Согласования", "Документация для надзорных органов и сопровождение согласования вплоть до разрешений."],
];
function processBlock() {
  return `<section class="pr" aria-label="Этапы проекта">
<div class="sec-h"><p class="cap">05 · Как идёт проект</p><h2 class="big" data-lines>${lines(["Пять шагов", "<em>до разрешения на стройку</em>"])}</h2></div>
<ol class="pr-list" id="pr-list"><span class="pr-line" aria-hidden="true"><i></i></span>${STEPS.map(([t, d], i) => `<li style="--i:${i}"><span class="pr-n">${pad(i + 1)}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol>
</section>`;
}

/* Выставки — со страницы «Мероприятия и выставки». */
const EVENTS = [
  { n: "АрхМосква", e: "ARCH Moscow", d: "27-30 мая 2026", w: "Москва, Гостиный двор", t: "Выставка-форум архитектуры, дизайна и девелопмента. Наш стенд G-7." },
  { n: "Саммит REPA", e: "REPA", d: "26 марта 2026", w: "Москва, Flexity", t: "Девелоперский форум: власть, девелоперы, банкиры и профессионалы отрасли." },
  { n: "АртДом", e: "ARTDOM", d: "19-21 февраля 2026", w: "Москва, Крокус Экспо", t: "Международная выставка мебели, интерьерных решений и искусства." },
  { n: "Cityscape Global", e: "Cityscape", d: "17-20 ноября 2025", w: "Эр-Рияд, Саудовская Аравия", t: "Международная выставка недвижимости и девелопмента." },
];
function eventsBlock() {
  return `<section class="ev" aria-label="Выставки">
<div class="sec-h"><p class="cap">06 · Выставки</p><h2 class="big" data-lines>${lines(["Где нас", "<em>встречали</em>"])}</h2></div>
<ul class="ev-list">${EVENTS.map((e, i) => `<li class="ev-i" style="--i:${i}"><p class="ev-d">${e.d}</p><h3>${e.n}</h3><p class="ev-w cap">${e.w}</p><p class="ev-t">${e.t}</p><span class="ev-e" aria-hidden="true">${e.e}</span></li>`).join("")}</ul>
</section>`;
}

/* Коллектив — со страницы «О бюро», снимки — с сайта бюро. */
const TEAM = [
  ["ladyzhnikov", "Николай Ладыжников", "Главный архитектор проектов"], ["akhmetov", "Сергей Ахметов", "Архитектор"], ["novikov", "Алексей Новиков", "Архитектор"],
  ["konovalov", "Владислав Коновалов", "Ведущий дизайнер"], ["slukhov", "Игорь Слухов", "Визуализатор"], ["minasian", "Кристина Минасян", "Дизайнер"],
  ["gordiushkina", "Маргарита Гордюшкина", "Дизайнер-визуализатор"], ["sokolova", "Светлана Соколова", "Архитектор"], ["morozov", "Андрей Морозов", "Архитектор"],
  ["ianyshev", "Сергей Янышев", "Инженер ПТО"], ["petrovskaia", "Мария Петровская", "Ведущий графический дизайнер"], ["mironova", "Наталья Миронова", "Контент-менеджер"],
];
const TM_NOTE = "Комплексное управление проектом начинается с детального плана и бюджета и идёт до сопровождения реализации: бюро решает вопросы с согласованиями и экспертизами и устраняет отклонения от графика.";
function teamBlock() {
  return `<section class="tm" id="byuro" aria-label="Коллектив">
<div class="sec-h tm-h"><p class="cap">07 · Коллектив</p><h2 class="big" data-lines>${lines(["Архитекторы, дизайнеры,", "<em>визуализаторы, инженер</em>"])}</h2>
<p class="tm-note">${TM_NOTE}</p></div>
<ul class="tm-list">${TEAM.map(([f, n, r], i) => `<li class="tm-i" style="--i:${i}"><span class="tm-pic"><img src="${IMG}/team/${f}.webp" alt="" loading="lazy" decoding="async" width="480" height="480"></span><p class="tm-n">${n}</p><p class="cap">${r}</p></li>`).join("")}</ul>
</section>`;
}

/* Наше промо: фильм «Сначала линия» о вилле APx180.2606 (владелец,
   19.10.2026). Ролик не файлом: зашифрованные куски HLS, ключ даёт только
   наш сервер тому, кому открыт макет (lib/proto/promo). Без панели
   управления, без «скачать», без меню по правой кнопке. */
function promoBlock() {
  return `<section class="pm" id="promo" aria-label="Наше промо">
<div class="sec-h"><p class="cap">Наше промо</p><h2 class="big" data-lines>${lines(["Сначала линия.", "<em>Потом дом.</em>"])}</h2>
<p class="pm-note">36 секунд о вилле APx180.2606: от первой линии на кальке ночью в бюро до вечера на террасе готового дома.</p></div>
<div class="pm-frame" data-src="${BASE}/promo/index.m3u8" data-lib="/protos/_lib/hls.light.min.js">
<video class="pm-v" playsinline disablepictureinpicture disableremoteplayback controlslist="nodownload noplaybackrate noremoteplayback" preload="none" poster="${IMG}/promo/poster.webp" aria-label="Промо-фильм бюро SIA"></video>
<button type="button" class="pm-play" aria-label="Смотреть промо"><span class="pm-ic" aria-hidden="true"></span><span class="pm-t">Смотреть</span></button>
<button type="button" class="pm-snd" aria-pressed="true" hidden><span class="pm-snd-on">Звук включён</span><span class="pm-snd-off">Без звука</span></button>
<span class="pm-bar" aria-hidden="true"><i></i></span>
</div>
</section>`;
}

function contactBlock() {
  return `<section class="ct" id="kontakty" aria-label="Контакты">
<p class="cap">08 · Офис с шоурумом в центре Москвы</p>
<h2 class="ct-big" data-lines>${lines(["Таганская", "площадь, <em>88</em>"])}</h2>
<div class="ct-grid">
<div><p class="cap">Метро</p><p data-k="metro">${METRO}</p></div>
<div><p class="cap">Время работы</p><p data-k="hours">${HOURS}</p><p>Суббота и воскресенье: выходной</p></div>
<div><p class="cap">Связаться</p><p><a href="${PHONE_TEL}" data-k="phone">${PHONE}</a></p><p><a href="mailto:${MAIL}" data-k="mail">${MAIL}</a></p></div>
</div>
<div class="ct-act"><a class="btn btn-l" href="${WA(ASK)}" target="_blank" rel="noopener">${ICON.wa}<span>Обсудить проект в WhatsApp</span></a><a class="btn btn-o" href="${TG}" target="_blank" rel="noopener">${ICON.tg}<span>Telegram</span></a><a class="btn btn-o" href="${PHONE_TEL}">${ICON.phone}<span>Позвонить</span></a></div>
</section>`;
}

/* ── Панель сайта ─────────────────────────────────────────────────────
   Блоки главной, которые бюро меняет из панели: заголовок, текст, фото,
   порядок и видимость. Тот же список читает site.js (sia-secs) и
   накладывает правки из панели на страницу. */
const SECS = [
  { id: "hero", n: "Первый экран", sel: ".hero", fixed: 1, text: HERO_SUB, textSel: ".hero-sub" },
  { id: "stats", n: "Цифры бюро", sel: ".stats" },
  { id: "stmt", n: "Позиция бюро", sel: ".stmt", text: STMT, textSel: ".stmt-t", words: 1 },
  { id: "arh", n: "Архитектура", sel: "#arhitektura", title: "От эскиза\nдо рабочих чертежей", text: "Каждый проект появляется чертежом и проявляется в рендер, пока вы листаете.", textSel: ".arh-note", imgSel: ".ac-r-img", photos: ARH.map((p) => pic(p.slug, 0, true)), where: "по одному на карточку галереи" },
  { id: "fly", n: "Пролёт по рендерам", sel: "#prolet" },
  { id: "bfl", n: "3D-пролёт", sel: "#prolet-3d" },
  { id: "int", n: "Интерьеры", sel: "#interery", title: "От планировки\nдо подбора материалов", imgSel: ".ic-pic img", photos: INT.map((p) => pic(p.slug, 0, true)), where: "по одному на карточку стопки" },
  { id: "velo", n: "Бегущая строка", sel: ".velo" },
  { id: "kd", n: "Виды работ", sel: ".kd" },
  { id: "folders", n: "Папки направлений", sel: ".folders" },
  { id: "ix", n: "Архив проектов", sel: "#arhiv" },
  { id: "sv", n: "Услуги", sel: "#uslugi", title: "Полный цикл\nот участка до ключей", imgSel: ".sv-pic img", photos: SERVICES.map((x) => pic(BYCODE[x.p[0]].slug, x.p[1], true)), where: "по одному на услугу" },
  { id: "pr", n: "Этапы работы", sel: ".pr", title: "Пять шагов\nдо разрешения на стройку" },
  { id: "ev", n: "Выставки и новости", sel: ".ev", title: "Где нас\nвстречали" },
  { id: "tm", n: "Коллектив", sel: "#byuro", title: "Архитекторы, дизайнеры,\nвизуализаторы, инженер", text: TM_NOTE, textSel: ".tm-note" },
  { id: "ct", n: "Контакты", sel: "#kontakty", fixed: 1, title: "Таганская\nплощадь, 88", titleSel: ".ct-big" },
];
const secsJson = () => `<script type="application/json" id="sia-secs">${JSON.stringify(SECS.map(({ id, sel, fixed, title, titleSel, textSel, words, imgSel }) => ({ id, sel, fixed, title: title != null, titleSel, textSel, words, imgSel })))}</script>`;

function panelBlock() {
  return `<section class="pn" id="panel" aria-label="Панель сайта">
<div class="sec-h"><p class="cap">Панель сайта</p><h2 class="big" data-lines>${lines(["Сайт меняете", "<em>сами, без разработчика</em>"])}</h2>
<p class="pn-note">Проекты с фото, новости и выставки, коллектив, тексты и фото каждого блока, контакты. Пользователи с ролями: редактор, медиа, менеджер заявок. Это рабочий макет: добавьте новость в панели, и она появится в блоке «Выставки» на этой странице.</p></div>
<div class="pn-frame"><div class="pn-bar" aria-hidden="true"><i></i><i></i><i></i><span>sia88.ru/admin</span></div><iframe title="Панель сайта SIA" data-src="${href("panel")}?embed=1" loading="lazy"></iframe></div>
<div class="pn-act"><a class="btn btn-l" href="${href("panel")}">Открыть панель во весь экран</a></div>
</section>`;
}

const PANEL_ICONS = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>', grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>', news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
  team: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c2.8 0 5 2.2 5 5"/>', photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>', key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', out: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v6H4V6h6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', plus: '<path d="M12 5v14M5 12h14"/>', left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>',
  up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', pen: '<path d="M4 20h4L20 8l-4-4L4 16z"/>',
};
function panelData() {
  const byCode = Object.fromEntries(DATA.featured.map((p) => [p.code, p]));
  return {
    img: IMG, logo: IMG + "/logo-k.png", home: href(), terms: TERMS,
    contacts: { phone: PHONE, mail: MAIL, wa: MOBILE, tg: TG, addr: ADDR, metro: METRO, hours: HOURS, seoT: "SIA · архитектурное бюро в Москве", seoD: "Проектирование, дизайн интерьеров и экстерьеров, 3D-визуализация, авторский надзор и согласование. Москва, Таганская площадь, 88." },
    projects: DATA.index.map((p) => {
      const f = byCode[p.code];
      return { code: p.code, slug: p.slug, cat: p.cat, title: plain(p.title), sub: plain(p.sub), kinds: p.kinds, area: p.area, term: p.term, date: p.date, feat: !!f, text: f ? plain(f.lead[0]) : "", photos: f ? f.imgs.map((_, i) => pic(p.slug, i, true)) : [thumb(p.slug)] };
    }),
    team: TEAM.map(([f, n, r]) => ({ n, r, photo: `${IMG}/team/${f}.webp` })),
    events: EVENTS.map(({ n, d, w, t }) => ({ n, d, w, t })),
    sections: SECS.map(({ id, n, title, text, photos, where, fixed, imgSel }) => ({ id, n, title, text, photos: photos || [], where, fixed: !!fixed, canPhotos: !!imgSel })),
  };
}
function panelPage() {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Панель сайта SIA · макет DevUz Studio</title>
<meta name="description" content="Панель сайта архитектурного бюро SIA: проекты с фото, разделы сайта, новости, коллектив, медиатека, заявки, пользователи и роли.">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#14110e">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="license" href="${TERMS}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
@@K@@
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(PANEL_ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join("")}</defs></svg>
<div class="app" id="app"><p class="lock">Панель загружается. <img src="${IMG}/logo-k.png" alt="SIA" width="120" height="53"></p></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Редактор"></aside>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<noscript><p class="lock">Для панели нужен JavaScript. <a href="${TERMS}">Условия макета</a></p></noscript>
<script type="application/json" id="sp-data">${JSON.stringify(panelData()).replace(/</g, "\\u003c")}</script>
@@Q@@
</body>
</html>`;
}

function home() {
  return shell({
    home: true, intro: true, cls: "home",
    title: "SIA · архитектурное бюро в Москве · макет DevUz Studio",
    desc: "Проектирование, дизайн интерьеров и экстерьеров, 3D-визуализация, авторский надзор и согласование. Москва, Таганская площадь, 88.",
    preload: `<link rel="preload" as="image" href="${drw(HERO.slug, true)}" media="(max-width: 800px)"><link rel="preload" as="image" href="${drw(HERO.slug)}" media="(min-width: 801px)">`,
    body: [heroBlock(), statsBlock(), statementBlock(), archBlock(), flyBlock(), bflyBlock(), intBlock(), veloBlock(), kindsBlock(), foldersBlock(), indexBlock(), servicesBlock(), processBlock(), eventsBlock(), teamBlock(), promoBlock(), panelBlock(), contactBlock()].join("\n") + secsJson(),
  });
}

/* ── Вариант 2: тёмный, по мотивам textura.agency ─────────────────────────
   Владелец, 19.10.2026: вторая страница рядом с первым вариантом, чтобы
   бюро сравнило. Главная и три блока: проекты списком, направления,
   коллектив. Снимки чёрно-белые; под курсором (на телефоне — у середины
   экрана) цвет расплывается из точки и медленно заливает кадр. Тумблер
   «Вариант 1 / Вариант 2» — на обеих страницах. */
const FONTS2 = "https://fonts.googleapis.com/css2?family=Forum&family=Carlito:wght@400;700&display=swap";
const TRUSS = `<svg class="v-truss" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M3 3H97V97H3ZM3 3L97 97M97 3L3 97M50 3V97M3 50H97"/></svg>`;
/* Снимок: чёрно-белый, поверх — размытый цвет из точки и чёткий цвет. */
const ph = (src, alt, cls = "", sizes = "100vw") => {
  const big = src.replace(/-m\.webp$/, ".webp");
  const set = big !== src ? ` srcset="${src} 800w, ${big} 1500w" sizes="${sizes}"` : "";
  return `<span class="ph${cls ? " " + cls : ""}"><img class="ph-g" src="${src}"${set} alt="${esc(alt)}" loading="lazy" decoding="async"><img class="ph-b" src="${src}"${set} alt="" aria-hidden="true" loading="lazy" decoding="async"><img class="ph-c" src="${src}"${set} alt="" aria-hidden="true" loading="lazy" decoding="async"></span>`;
};
/* Названия — из заголовков и описаний проектов на sia88.ru. */
const V2_LIST = [
  ["APx180.2606", "Горный спа-курорт"], ["APx182.1208", "Вилла с плоской кровлей"], ["ИНт238.2606", "Вилла с крытым бассейном"],
  ["APx178.2509", "Архитектурный ансамбль"], ["ИНт219.2409", "Ресторан в стиле ар-нуво"], ["APx183.2504", "Офисное здание"],
  ["ИНт222.2410", "Пентхаус в золотистых тонах"], ["APx181.2607", "Вилла с панорамным остеклением"],
];
const V2_DIR = [0, 1, 2].map((i) => SERVICES[i]);
const vToggle = (cur) => `<nav class="vt" aria-label="Вариант макета" data-cur="${cur}"><i class="vt-k" aria-hidden="true"></i><a href="${href()}" data-v="1"${cur === 1 ? ' aria-current="page"' : ""}>Вариант 1</a><a href="${href("v2")}" data-v="2"${cur === 2 ? ' aria-current="page"' : ""}>Вариант 2</a></nav>`;
const wordsOf = (s) => s.split(" ").map((w, i) => `<span class="vw" style="--i:${i}"><span>${esc(w)}</span></span>`).join(" ");

/* Звёздочка линиями, как у textura: символ ✳ на iPhone рисуется зелёным эмодзи. */
const STAR8 = `<svg class="v-star" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1"/></svg>`;
/* Таблетка в фразе о коллективе: проекты бюро сменяют друг друга раз в секунду. */
const PILL = ["ИНт238.2606", "APx180.2606", "ИНт219.2409", "APx182.1208", "ИНт222.2410", "APx178.2509", "ИНт230.2502", "APx183.2504"].map((c) => BYCODE[c]);

function v2Page() {
  const P = (code) => BYCODE[code];
  const hero = `<section class="v-hero" aria-label="Первый экран">
<h1 class="v-mark"><span class="v-up" style="--i:0"><span>${TRUSS}</span></span><span class="v-up" style="--i:1"><span>SIA</span></span> <span class="v-up v-thin" style="--i:2"><span>бюро</span></span><span class="sr">: архитектурное бюро в Москве</span></h1>
<div class="v-lead">
<p class="v-fade" style="--i:3">Проектируем, визуализируем и сопровождаем. ${esc(HERO_SUB)} Офис с шоурумом на Таганской площади.</p>
<a class="v-pill v-fade" style="--i:4" href="${WA(ASK)}" target="_blank" rel="noopener"><span>Обсудить проект</span>${ICON.arrow}</a>
<a class="v-ul v-fade" style="--i:5" href="${PHONE_TEL}">Позвонить: ${PHONE}</a>
<p class="v-chips v-fade" style="--i:6"><a href="#proekty">Архитектура</a><i></i><a href="#proekty">Интерьеры</a><i></i><a href="#napravleniya">3D-визуализация</a><i></i><a href="#napravleniya">Надзор</a></p>
</div>
<a class="v-band" href="${pHref(HERO)}" aria-label="${esc(HERO.code)}: ${esc(HERO.title)}">${ph(pic(HERO.slug, 1, true), HERO.title, "ph-band")}<span class="v-band-c"><span class="code">${HERO.code}</span> · Горный спа-курорт</span></a>
</section>`;

  const rows = V2_LIST.map(([c, n], i) => {
    const p = P(c);
    return `<li><a class="pl" href="${pHref(p)}" style="--i:${i}" data-i="${i}"><span class="pl-c">${p.code}</span><span class="pl-n">${esc(n)}</span><span class="pl-ar">${ICON.arrow}</span><span class="pl-pv" aria-hidden="true">${ph(pic(p.slug, 0, true), "", "", "320px")}</span></a></li>`;
  }).join("");
  const projects = `<section class="v-pr" id="proekty" aria-label="Избранные проекты">
<h2 class="v-h2" data-rv>Избранные проекты</h2>
<div class="pl-stick" aria-hidden="true">${V2_LIST.map(([c], i) => `<span class="pl-sp" data-i="${i}">${ph(pic(P(c).slug, 0, true), "", "", "90vw")}</span>`).join("")}</div>
<ul class="pl-list">${rows}</ul>
<p class="v-all"><a class="v-ul" href="${href()}#arhiv">Весь архив: ${DATA.index.length} проектов</a></p>
</section>`;

  const dir = `<section class="v-dir" id="napravleniya" aria-label="Направления" style="--n:${V2_DIR.length}">
<div class="vd-stick">
<div class="vd-titles">${V2_DIR.map((s, i) => `<h2 class="vd-t" data-i="${i}">${s.n}</h2>`).join("")}</div>
<div class="vd-pics">${V2_DIR.map((s, i) => `<span class="vd-p" data-i="${i}">${ph(pic(P(s.p[0]).slug, s.p[1], true), s.n, "", "(max-width: 900px) 70vw, 28vw")}</span>`).join("")}</div>
<div class="vd-texts">${V2_DIR.map((s, i) => `<p class="vd-x" data-i="${i}">${wordsOf(s.d)}</p>`).join("")}</div>
<ol class="vd-idx">${V2_DIR.map((s, i) => `<li data-i="${i}">${s.n}</li>`).join("")}</ol>
<div class="vd-subs">${V2_DIR.map((s, i) => `<p class="vd-s" data-i="${i}">${s.s.split(/,\s*|\s+или\s+|\s+и\s+/i).filter(Boolean).map((x) => `<span>${esc(x.charAt(0).toUpperCase() + x.slice(1))}</span>`).join("")}<span class="vd-f">${esc(s.f)}</span></p>`).join("")}</div>
</div>
<div class="vd-still">${V2_DIR.map((s) => `<article><h2 class="vd-t">${s.n}</h2>${ph(pic(P(s.p[0]).slug, s.p[1], true), s.n)}<p>${esc(s.d)}</p><p class="vd-f">${esc(s.f)}</p></article>`).join("")}</div>
</section>`;

  const faces = TEAM.slice(0, 4).map(([f, n]) => `<span class="tf">${ph(`${IMG}/team/${f}.webp`, n, "ph-face")}</span>`).join("");
  const team = `<section class="v-tm" id="byuro" aria-label="Коллектив">
<p class="v-tm-t" data-rv>Мы <span class="tf-row">${faces}</span> архитекторы, дизайнеры, визуализаторы и инженер ${ICON.arrow} ведём проект от участка ${STAR8} <span class="tf-pill" aria-hidden="true">${PILL.map((p, i) => `<span class="tf-s${i ? "" : " act"}">${ph(pic(p.slug, 0, true), "", "", "240px")}</span>`).join("")}</span> до ключей <span class="v-br">{ в центре Москвы }</span></p>
<ul class="v-people">${TEAM.map(([f, n, r], i) => `<li style="--i:${i}">${ph(`${IMG}/team/${f}.webp`, n, "ph-face")}<p class="vp-n">${n}</p><p class="vp-r">${r}</p></li>`).join("")}</ul>
</section>`;

  const foot = `<footer class="v-foot" id="kontakty">
<p class="v-cap">Таганская площадь, 88, этаж 2</p>
<a class="v-big" href="${WA(ASK)}" target="_blank" rel="noopener">Обсудить проект ${ICON.arrow}</a>
<div class="v-fgrid"><p><a class="v-ul" href="${PHONE_TEL}">${PHONE}</a></p><p><a class="v-ul" href="mailto:${MAIL}">${MAIL}</a></p><p><a class="v-ul" href="${TG}" target="_blank" rel="noopener">Telegram</a></p><p>${HOURS}</p></div>
<p class="v-fine">SIA · архитектурное бюро · Москва · Макет нового сайта: DevUz Studio · <a href="${href()}">Вариант 1</a> · <a href="${href("panel")}">Панель сайта</a> · <a href="${TERMS}" target="_blank" rel="noopener">Условия макета</a></p>
</footer>`;

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SIA · архитектурное бюро · вариант 2 · макет DevUz Studio</title>
<meta name="description" content="Второй вариант нового сайта SIA: тёмный, со снимками, которые наливаются цветом под курсором.">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#050505">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="license" href="${TERMS}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS2}">
<script>document.documentElement.classList.add('js')</script>
@@V@@
</head>
<body class="v2">
${dzIntroSolo("ru")}
<a class="skip" href="#main">К содержанию</a>
<header class="v-top" id="top">
<a href="#proekty">Проекты</a><a href="#napravleniya">Направления</a>
<a class="v-logo" href="${href("v2")}" aria-label="SIA, архитектурное бюро"><img src="${IMG}/logo-k.png" alt="" width="400" height="178"></a>
<a href="#byuro">Бюро</a><a href="${PHONE_TEL}">${PHONE}</a>
</header>
<main id="main">
${hero}
${projects}
${dir}
${team}
</main>
${foot}
<div class="v-dock">${vToggle(2)}<a class="v-talk" href="${WA(ASK)}" target="_blank" rel="noopener"><i aria-hidden="true"></i><span>Обсудить проект</span></a></div>
@@W@@
</body>
</html>`;
}

/* ── Страница проекта ─────────────────────────────────────────────────── */
function projectPage(p, i) {
  const next = FEAT[(i + 1) % FEAT.length];
  const shots = p.imgs.map((_, k) => k).slice(1);
  const more = [...p.lead.slice(1), ...p.more];
  const gal = shots.map((k, j) => `<figure class="pg pg-${j % 3}" data-cur="${esc(p.code)}"><span class="pg-in">${img(p.slug, k, `${p.title}, вид ${k + 1}`)}</span></figure>${more[j] ? `<p class="pg-t" data-lines-p>${esc(more[j])}</p>` : ""}`).join("\n");
  const body = `<section class="pp-hero" aria-label="${esc(p.code)}">
<div class="pp-stick">
<figure class="pp-pic">
<img class="pp-d" src="${drw(p.slug, true)}" srcset="${drw(p.slug, true)} 800w, ${drw(p.slug)} 1500w" sizes="100vw" alt="" fetchpriority="high">
<span class="wipe pp-wipe"><span class="wipe-in"><img data-tr-img src="${pic(p.slug, 0, true)}" srcset="${pic(p.slug, 0, true)} 800w, ${pic(p.slug, 0)} 1500w" sizes="100vw" alt="${esc(p.title)}" fetchpriority="high"></span></span>
</figure>
<div class="pp-h"><a class="cap pp-back" href="${href()}#${p.cat === "arh" ? "arhitektura" : "interery"}">← Все проекты</a><h1><span class="code">${p.code}</span><span class="pp-t">${esc(p.title)}</span></h1></div>
<p class="cap pp-hint" aria-hidden="true">Листайте: чертёж станет рендером</p>
</div>
</section>
<section class="pp-lead">
<p class="pp-sub" data-lines-p>${esc(p.sub)}.</p>
<dl class="pp-facts">${[p.area && ["Площадь", `${p.area} м²`], p.term && ["Срок проекта", `${p.term} мес.`], ["Тип", p.kinds.join(", ") || kindOf(p)], ["Раздел", p.cat === "arh" ? "Архитектурное проектирование" : "Дизайн-проект"]].filter(Boolean).map(([k, v]) => `<div><dt class="cap">${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
<p class="pp-p">${esc(p.lead[0])}</p>
</section>
<section class="pp-gal">
${gal}
</section>
<section class="pp-done">
<div class="sec-h"><p class="cap">Что было сделано</p><h2 class="big" data-lines>${lines(["Этапы", "<em>проекта</em>"])}</h2></div>
<ol class="pp-steps">${p.steps.map((s, k) => `<li style="--i:${k}"><span class="pr-n">${pad(k + 1)}</span><p>${esc(s)}</p></li>`).join("")}</ol>
<div class="ct-act"><a class="btn btn-l" href="${WA(`Здравствуйте! Понравился проект ${p.code} на вашем сайте, хочу обсудить похожий.`)}" target="_blank" rel="noopener">${ICON.wa}<span>Хочу похожий проект</span></a></div>
</section>
<a class="pp-next" href="${pHref(next)}" data-tr="${esc(next.code)}" data-cur="Дальше">
<span class="pp-next-img"><img src="${drw(next.slug, true)}" alt="" loading="lazy" decoding="async"><img class="pp-next-r" src="${pic(next.slug, 0, true)}" alt="" loading="lazy" decoding="async"></span>
<span class="pp-next-t"><span class="cap">Следующий проект</span><span class="code">${next.code}</span><b>${esc(next.title)}</b></span>
</a>`;
  return shell({
    cls: "project",
    title: `${p.code} · ${p.title} · SIA · макет DevUz Studio`,
    desc: `${p.title}. ${p.sub}.`,
    preload: `<link rel="preload" as="image" href="${drw(p.slug, true)}" media="(max-width: 800px)"><link rel="preload" as="image" href="${drw(p.slug)}" media="(min-width: 801px)">`,
    body,
  });
}

/* ── Сборка ───────────────────────────────────────────────────────────── */
const out = { "": home(), panel: panelPage(), v2: v2Page() };
FEAT.forEach((p, i) => { out["proekt/" + p.slug] = projectPage(p, i); });
const parts = {
  S: `<style>${min(read("site.css") + read("intro.css"))}</style>`,
  J: `<script>\n${strip(read("site.js"))}</script>`,
  K: `<style>${min(read("panel.css"))}</style>`,
  Q: `<script>\n${strip(read("panel.js"))}</script>`,
  V: `<style>${min(read("v2.css"))}</style>`,
  W: `<script>\n${strip(read("v2.js"))}</script>`,
};
const fill = (page) => Object.entries(parts).reduce((pg, [k, part]) => pg.split(`@@${k}@@`).join(part), page);

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "sia.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(главная)").padEnd(34), fill(v).length);
