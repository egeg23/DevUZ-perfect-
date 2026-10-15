import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

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
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">макет нового сайта архитектурного бюро</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<div class="br-stage" aria-hidden="true"><div class="br-pp"></div><div class="br-dk"></div><canvas class="br-cv"></canvas><div class="br-logo"><span class="br-wipe"><img src="${IMG}/logo-w.png" alt="" width="400" height="178"></span></div><p class="br-kind">архитектурное бюро · Таганская площадь, 88</p></div>
<button type="button" class="in-skip" id="in-skip">Пропустить</button>
</div>`;
}

/* ── Общие части ─────────────────────────────────────────────────────── */
const NAV = [["arhitektura", "Архитектура", ARH[0]], ["prolet", "Пролёт", HERO], ["interery", "Интерьеры", INT[0]], ["arhiv", "Архив", ARH[4]], ["uslugi", "Услуги", ARH[2]], ["byuro", "Бюро", INT[3]], ["kontakty", "Контакты", ARH[5]]];

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
<a class="top-tel" href="${PHONE_TEL}">${roll(PHONE)}</a>
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
<div class="foot-c"><p>Москва, Таганская площадь, 88, этаж 2</p><p><a href="${PHONE_TEL}">${PHONE}</a></p><p><a href="mailto:${MAIL}">${MAIL}</a></p><p class="foot-s">${SOCIAL.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${roll(n)}</a>`).join("")}</p></div>
</div>
<img class="foot-logo" src="${IMG}/logo-k.png" alt="SIA" width="400" height="178" loading="lazy" decoding="async">
<div class="foot-b"><p>SIA · архитектурное бюро · Москва</p><p>Макет нового сайта: DevUz Studio · <a href="${TERMS}" target="_blank" rel="noopener">Условия макета</a></p></div>
</footer>
<a class="dock" href="${WA(ASK)}" target="_blank" rel="noopener">${ICON.wa}<span>Обсудить проект в WhatsApp</span></a>
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
<p class="hero-sub">Архитектура, дизайн интерьеров и экстерьеров, авторский надзор и сопровождение.</p>
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
function teamBlock() {
  return `<section class="tm" id="byuro" aria-label="Коллектив">
<div class="sec-h tm-h"><p class="cap">07 · Коллектив</p><h2 class="big" data-lines>${lines(["Архитекторы, дизайнеры,", "<em>визуализаторы, инженер</em>"])}</h2>
<p class="tm-note">Комплексное управление проектом начинается с детального плана и бюджета и идёт до сопровождения реализации: бюро решает вопросы с согласованиями и экспертизами и устраняет отклонения от графика.</p></div>
<ul class="tm-list">${TEAM.map(([f, n, r], i) => `<li class="tm-i" style="--i:${i}"><span class="tm-pic"><img src="${IMG}/team/${f}.webp" alt="" loading="lazy" decoding="async" width="480" height="480"></span><p class="tm-n">${n}</p><p class="cap">${r}</p></li>`).join("")}</ul>
</section>`;
}

function contactBlock() {
  return `<section class="ct" id="kontakty" aria-label="Контакты">
<p class="cap">08 · Офис с шоурумом в центре Москвы</p>
<h2 class="ct-big" data-lines>${lines(["Таганская", "площадь, <em>88</em>"])}</h2>
<div class="ct-grid">
<div><p class="cap">Метро</p><p>Таганская (кольцевая), Таганская (Таганско-Краснопресненская), Марксистская</p></div>
<div><p class="cap">Время работы</p><p>Понедельник-пятница, 10:00-18:00</p><p>Суббота и воскресенье: выходной</p></div>
<div><p class="cap">Связаться</p><p><a href="${PHONE_TEL}">${PHONE}</a></p><p><a href="mailto:${MAIL}">${MAIL}</a></p></div>
</div>
<div class="ct-act"><a class="btn btn-l" href="${WA(ASK)}" target="_blank" rel="noopener">${ICON.wa}<span>Обсудить проект в WhatsApp</span></a><a class="btn btn-o" href="${TG}" target="_blank" rel="noopener">${ICON.tg}<span>Telegram</span></a><a class="btn btn-o" href="${PHONE_TEL}">${ICON.phone}<span>Позвонить</span></a></div>
</section>`;
}

function home() {
  return shell({
    home: true, intro: true, cls: "home",
    title: "SIA · архитектурное бюро в Москве · макет DevUz Studio",
    desc: "Проектирование, дизайн интерьеров и экстерьеров, 3D-визуализация, авторский надзор и согласование. Москва, Таганская площадь, 88.",
    preload: `<link rel="preload" as="image" href="${drw(HERO.slug, true)}" media="(max-width: 800px)"><link rel="preload" as="image" href="${drw(HERO.slug)}" media="(min-width: 801px)">`,
    body: [heroBlock(), statsBlock(), statementBlock(), archBlock(), flyBlock(), intBlock(), veloBlock(), kindsBlock(), foldersBlock(), indexBlock(), servicesBlock(), processBlock(), eventsBlock(), teamBlock(), contactBlock()].join("\n"),
  });
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
const out = { "": home() };
FEAT.forEach((p, i) => { out["proekt/" + p.slug] = projectPage(p, i); });
const parts = {
  S: `<style>${min(read("site.css") + read("intro.css"))}</style>`,
  J: `<script>\n${strip(read("site.js"))}</script>`,
};
const fill = (page) => Object.entries(parts).reduce((pg, [k, part]) => pg.split(`@@${k}@@`).join(part), page);

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "sia.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(главная)").padEnd(34), fill(v).length);
