import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { BRAND, SERVICES, PROJECTS, FLIGHT_STAGES, MENU, SPEC } from "./data.mjs";

/*
 * Макет имиджевого сайта архбюро (ТЗ клиента, референс yodezeen.com).
 * Демо DevUz Studio: четыре сильных блока по ТЗ.
 *   1. Первый экран: промо DevUz, затем «видео» бюро во весь экран
 *      (рендер Blender), на телефоне и медленной сети картинка.
 *   2. Пролёт по прокрутке: 180 кадров Blender на canvas, генплан → фасад →
 *      вода → интерьер (scripts/blender/arhbyuro).
 *   3. Проекты: полноэкранные кадры с текстом через один, фильтр по
 *      услугам, карта мира с точками, страница проекта с переходом.
 *   4. Большое меню с фоном у пунктов и форма «Связаться», выезжает справа.
 * Языки RU и EN (так в ТЗ): "" и "en", страницы проектов proekt/<адрес>.
 *
 * Сборка: node gen.mjs → content/proto-bundles/arhbyuro.json и out/pages.json.
 */

const DIR = new URL(".", import.meta.url).pathname;
const read = (f) => readFileSync(DIR + f, "utf8");
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

const IMG = "/protos/arhbyuro";
const BASE = "__PROTO_BASE__";
const B = BRAND.name;
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400&family=Inter+Tight:wght@400;700&display=swap";
const MAP = JSON.parse(read("worldmap.json"));
const FRAMES = 180;

const L2 = (pair, l) => (l === "ru" ? pair[0] : pair[1]);
const T = (l) => (ru, en) => (l === "ru" ? ru : en);
const href = (l, path = "") => BASE + (l === "en" ? "/en" : "") + (path ? "/" + path : "");
const pHref = (l, p) => href(l, "proekt/" + p.slug);
const still = (n, w) => `${IMG}/s-${n}${w ? "-" + w : ""}.webp`;
const frame = (set, i) => `${IMG}/f/${set}/${String(i).padStart(4, "0")}.webp`;
const bgOf = (key) => (key.startsWith("s-") ? still(key.slice(2), 960) : frame("d", +key.slice(2)));

/* Карта: долгота и широта → единицы viewBox карты (worldmap.py). */
const geo = ([lat, lon]) => [+(lon + 180).toFixed(1), +(80 - lat).toFixed(1)];

/* Иконки — контур 24×24. */
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  down: I('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  play: I('<path d="M8 5v14l11-7z"/>'),
};

/* Знак DevUz Studio для заставки — тот же, что в промо на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZSIGN = `<svg class="dz-sign" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

/* Знак бюро: слово и линия под ним. Временный, пока бюро не прислало свой. */
const logo = (cls = "") => `<span class="logo ${cls}"><b>${B}</b><i aria-hidden="true"></i></span>`;

function introHtml(l) {
  const t = T(l);
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  return `<div class="intro" id="intro" role="presentation">
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t("макет сайта архитектурного бюро", "a website mock-up for an architecture studio")}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<div class="br-stage" aria-hidden="true"><svg class="br-lines" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet"><path pathLength="1" d="M20 200H380"/><path pathLength="1" d="M60 200V96H220V200"/><path pathLength="1" d="M140 96V40H340V150H220"/><path pathLength="1" d="M248 150V200"/></svg><p class="br-word">${B}</p><p class="br-kind">${L2(BRAND.kind, l)}</p></div>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "Skip")}</button>
</div>`;
}

/* ── Общие части страницы ─────────────────────────────────────────────── */
function menuHtml(l, onHome) {
  const t = T(l);
  const to = (id) => (onHome ? "#" + id : href(l) + "#" + id);
  const bgs = MENU.map((m, i) => `<img class="mn-bg${i === 0 ? " on" : ""}" data-bg="${i}" src="${bgOf(m.bg)}" alt="" loading="lazy" decoding="async">`).join("");
  return `<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="${t("Меню", "Menu")}" hidden>
<div class="mn-bgs" aria-hidden="true">${bgs}<div class="mn-shade"></div></div>
<div class="mn-in">
<nav class="mn-list" aria-label="${t("Разделы", "Sections")}">${MENU.map((m, i) => `<a class="mn-i" href="${to(m.id)}" data-i="${i}"><span class="mn-n">0${i + 1}</span><span class="mn-t">${L2(m.n, l)}</span></a>`).join("")}</nav>
<div class="mn-side">
<p class="mn-k">${t("Проекты", "Projects")}</p>
<ul>${PROJECTS.map((p) => `<li><a href="${pHref(l, p)}" data-tr="${p.slug}">${L2(p.n, l)}</a><span>${L2(p.city, l)}</span></li>`).join("")}</ul>
<button type="button" class="btn btn-line" data-contact>${t("Связаться", "Get in touch")}${ICON.arrow}</button>
</div>
</div>
</div>`;
}

function panelHtml(l) {
  const t = T(l);
  return `<div class="panel-veil" id="panel-veil" hidden></div>
<aside class="panel" id="panel" role="dialog" aria-modal="true" aria-labelledby="panel-h" hidden>
<div class="pn-top"><h2 id="panel-h">${t("Обсудить проект", "Discuss a project")}</h2><button type="button" class="ic-btn" data-close aria-label="${t("Закрыть", "Close")}">${ICON.close}</button></div>
<form class="pn-form" id="pn-form" novalidate>
<label class="fld"><span>${t("Как к вам обращаться", "Your name")}</span><input name="name" autocomplete="name" required></label>
<label class="fld"><span>${t("Телефон или почта", "Phone or email")}</span><input name="contact" autocomplete="email" required></label>
<fieldset class="fld-chips"><legend>${t("Что проектируем", "What are we designing")}</legend>${SERVICES.map((s, i) => `<label><input type="radio" name="kind" value="${s.id}"${i === 0 ? " checked" : ""}><span>${L2(s.n, l)}</span></label>`).join("")}</fieldset>
<label class="fld"><span>${t("Пара слов о задаче", "A few words about the brief")}</span><textarea name="msg" rows="4"></textarea></label>
<p class="pn-err" id="pn-err" role="alert" hidden>${t("Напишите имя и телефон или почту.", "Please add your name and a phone or email.")}</p>
<button type="submit" class="btn btn-ink">${t("Отправить", "Send")}${ICON.arrow}</button>
<p class="pn-note">${t("Форма одна на весь сайт: открывается справа с любой страницы, без перезагрузки. Тексты формы правятся в CMS.", "One form for the whole site: it slides in from any page without a reload. Its wording is edited in the CMS.")}</p>
</form>
<div class="pn-ok" id="pn-ok" hidden>
<p class="pn-ok-h">${t("Заявка собрана", "Request ready")}</p>
<p>${t("Это макет, поэтому заявка никуда не ушла. На рабочем сайте её получит бюро: на почту и в раздел заявок Strapi.", "This is a mock-up, so nothing was sent. On the live site the studio receives it by email and in the Strapi requests section.")}</p>
<dl id="pn-sum"></dl>
<button type="button" class="btn btn-line" data-close>${t("Закрыть", "Close")}</button>
</div>
</aside>`;
}

function shell(l, opts) {
  const t = T(l);
  const other = l === "ru" ? "en" : "ru";
  const otherHref = href(other, opts.path || "");
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#14110e">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="alternate" hreflang="${other}" href="${otherHref}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
${opts.preload || ""}
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=${opts.intro ? "false" : "true"};try{if(sessionStorage.getItem('arh-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden';try{if(sessionStorage.getItem('arh-tr'))r.classList.add('tr-in')}catch(e){}})()</script>
@@S@@
</head>
<body data-lang="${l}" class="${opts.cls || ""}">
${opts.intro ? introHtml(l) : ""}
<a class="skip" href="#main">${t("К содержанию", "Skip to content")}</a>
<header class="top" id="top">
<a class="top-logo" href="${href(l)}" aria-label="${B}">${logo()}</a>
<div class="top-r">
<div class="lang"><a href="${href("ru", opts.path || "")}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("en", opts.path || "")}" hreflang="en"${l === "en" ? ' aria-current="true"' : ""}>EN</a></div>
<button type="button" class="btn btn-ghost top-c" data-contact>${t("Связаться", "Get in touch")}</button>
<button type="button" class="burger" id="burger" aria-expanded="false" aria-controls="menu"><span class="bg-l" aria-hidden="true"><i></i><i></i></span><span class="bg-t">${t("Меню", "Menu")}</span></button>
</div>
</header>
${menuHtml(l, !!opts.home)}
${panelHtml(l)}
<main id="main">
${opts.body}
</main>
<footer class="foot">
<div class="ft-top">
<div>${logo("ft-logo")}<p class="ft-kind">${L2(BRAND.kind, l)}</p></div>
<nav aria-label="${t("Проекты", "Projects")}"><p class="ft-k">${t("Проекты", "Projects")}</p><ul>${PROJECTS.map((p) => `<li><a href="${pHref(l, p)}" data-tr="${p.slug}">${L2(p.n, l)}</a></li>`).join("")}</ul></nav>
<div><p class="ft-k">DevUz Studio</p><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=arhbyuro">Telegram</a></li></ul></div>
</div>
<div class="ft-legal">
<p>${t(`Это макет: так может выглядеть сайт бюро. ${B}: рабочее название, пришлёте своё название и логотип, и они встанут везде. Проекты демо: дом, интерьер, башня и павильон построены нами в Blender, в рабочем сайте здесь ваши проекты из CMS.`, `This is a mock-up of how the studio website could look. ${B} is a working name: send us your name and logo and they will appear everywhere. The projects are demos: the house, interior, tower and pavilion were built by us in Blender; on the live site this is your work from the CMS.`)}</p>
<p>${t("Материалы, небо, мебель и деревья в рендерах: Poly Haven, CC0. Карта: Natural Earth.", "Materials, skies, furniture and trees in the renders: Poly Haven, CC0. Map: Natural Earth.")}</p>
<p>${t("Макет принадлежит DevUz Studio. Использовать его можно только по договору:", "This mock-up belongs to DevUz Studio and may be used only under a contract:")} <a href="${TERMS(l)}">${t("условия использования", "terms of use")}</a></p>
</div>
</footer>
<div class="dock"><button type="button" class="btn btn-ink" data-contact>${t("Связаться с бюро", "Contact the studio")}${ICON.arrow}</button></div>
<div class="veil" id="veil" aria-hidden="true"></div>
<script type="application/json" id="arh-data">${json(opts.data || {})}</script>
${opts.intro ? `<script>\n${strip(read("intro.js"))}</script>` : ""}
<script src="${IMG}/gsap.min.js" defer></script>
@@J@@
</body>
</html>`;
}

/* ── Главная ─────────────────────────────────────────────────────────── */
function heroBlock(l) {
  const t = T(l);
  return `<section class="hero" id="hero" data-tone="dark">
<div class="hero-media" aria-hidden="true">
<picture><source media="(max-width: 760px) and (orientation: portrait)" srcset="${IMG}/hero-m.webp"><img class="hero-img" src="${IMG}/poster-1920.webp" srcset="${IMG}/poster-1280.webp 1280w, ${IMG}/poster-1920.webp 1920w" sizes="100vw" alt="" fetchpriority="high"></picture>
<video class="hero-v" id="hero-v" muted playsinline loop preload="none" data-src="${IMG}/hero-1920.mp4" data-src-s="${IMG}/hero-1280.mp4"></video>
<div class="hero-shade"></div>
</div>
<div class="hero-in">
<p class="kicker">${L2(BRAND.kind, l)}</p>
<h1 class="hero-h"><span class="ln"><span>${t("Дома, интерьеры", "Houses, interiors")}</span></span><span class="ln"><span>${t("и общественные здания", "and public buildings")}</span></span></h1>
<p class="hero-lead">${t("Проектируем от посадки на участке до рабочих чертежей и показываем дом до стройки: рендер, пролёт, каждый материал.", "We design from siting to working drawings and show the house before it is built: renders, fly-throughs, every material.")}</p>
<div class="hero-cta"><a class="btn btn-light" href="#proekty">${t("Смотреть проекты", "See the projects")}${ICON.arrow}</a><button type="button" class="btn btn-glass" data-contact>${t("Связаться", "Get in touch")}</button></div>
</div>
<a class="hero-down" href="#prolet">${ICON.down}<span>${t("Листайте: пролёт по дому", "Scroll: fly through the house")}</span></a>
<p class="hero-note">${t("Фон: рендер Blender, DevUz Studio", "Background: Blender render, DevUz Studio")}</p>
</section>`;
}

function flyBlock(l) {
  const t = T(l);
  const stills = [1, 40, 120, 180];
  return `<section class="fly" id="prolet" data-tone="dark" data-n="${FRAMES}" data-d="${IMG}/f/d/" data-m="${IMG}/f/m/">
<div class="fly-stick">
<img class="fly-poster" src="${frame("d", 1)}" alt="" aria-hidden="true">
<canvas class="fly-cv" aria-hidden="true"></canvas>
<div class="fly-head"><p class="kicker">${t("Пролёт по проекту", "Project fly-through")}</p><h2 class="fly-h">${t("От генплана до гостиной за одну прокрутку", "From site plan to living room in one scroll")}</h2></div>
<ol class="fly-caps">${FLIGHT_STAGES.map((s, i) => `<li class="fly-cap" data-from="${s.from}" data-to="${s.to}"${i === 0 ? ' data-on=""' : ""}><span class="fc-k">${L2(s.k, l)}</span><span class="fc-t">${L2(s.t, l)}</span></li>`).join("")}</ol>
<div class="fly-rail" aria-hidden="true"><i class="fr-fill"></i>${FLIGHT_STAGES.map((s) => `<b style="--at:${s.from}"></b>`).join("")}</div>
<p class="fly-note">${t(`Рендер Blender: ${FRAMES} кадров листаются вашей прокруткой, скорость задаёте вы`, `Blender render: ${FRAMES} frames follow your scroll, at your speed`)} <span class="fly-load" id="fly-load"></span></p>
</div>
<div class="fly-still">${stills.map((n, i) => `<figure><img src="${frame("d", n)}" alt="${esc(L2(FLIGHT_STAGES[i].t, l))}" loading="lazy" decoding="async"><figcaption>${L2(FLIGHT_STAGES[i].k, l)}</figcaption></figure>`).join("")}</div>
</section>`;
}

function projectsBlock(l) {
  const t = T(l);
  const chips = [`<button type="button" class="chip" data-f="all" aria-pressed="true">${t("Все", "All")} <span>${PROJECTS.length}</span></button>`]
    .concat(SERVICES.map((s) => `<button type="button" class="chip" data-f="${s.id}" aria-pressed="false">${L2(s.n, l)} <span>${PROJECTS.filter((p) => p.cats.includes(s.id)).length}</span></button>`)).join("");
  const rows = PROJECTS.map((p, i) => `<article class="pj${i % 2 ? " pj-r" : ""}" data-cats="${p.cats.join(" ")}">
<a class="pj-fig" href="${pHref(l, p)}" data-tr="${p.slug}" aria-label="${esc(L2(p.n, l))}"><span class="pj-img"><img data-tr-img src="${still(p.cover)}" srcset="${still(p.cover, 960)} 960w, ${still(p.cover)} 1920w" sizes="100vw" alt="" loading="lazy" decoding="async"></span><span class="pj-cur" aria-hidden="true"></span></a>
<div class="pj-txt"><p class="pj-n">0${i + 1}</p><h3><a href="${pHref(l, p)}" data-tr="${p.slug}">${L2(p.n, l)}</a></h3><p class="pj-meta">${ICON.pin}<span>${L2(p.city, l)}</span><span>${p.cats.map((c) => L2(SERVICES.find((s) => s.id === c).n, l)).join(" · ")}</span></p><p class="pj-short">${L2(p.short, l)}</p><a class="lnk" href="${pHref(l, p)}" data-tr="${p.slug}">${t("Открыть проект", "Open the project")}${ICON.arrow}</a></div>
</article>`).join("");
  return `<section class="projects" id="proekty">
<div class="sec-h wrap"><p class="kicker">${t("Проекты", "Projects")}</p><h2>${t("Полноэкранные кадры, текст через один", "Full-screen images, text in between")}</h2><p class="sub">${t("Каждый проект в CMS: название, описание, услуги, город и координаты, галерея и видео. Фильтр по услугам собирается сам.", "Every project lives in the CMS: name, description, services, city and coordinates, gallery and video. The service filter builds itself.")}</p></div>
<div class="chips wrap" role="group" aria-label="${t("Фильтр по услугам", "Filter by service")}">${chips}</div>
<div class="pj-list">${rows}</div>
</section>`;
}

function mapSvg(l, points, cls, view) {
  const pts = points.map(([p, lat, lon, label]) => {
    const [x, y] = geo([lat, lon]);
    return `<a class="mp-pt" href="${pHref(l, p)}" data-tr="${p.slug}" data-city="${esc(L2(p.city, l))}" transform="translate(${x} ${y})" aria-label="${esc(label)}"><circle class="mp-ring" r="3.2"/><circle class="mp-dot" r="1.6"/></a>`;
  }).join("");
  return `<svg class="${cls}" viewBox="${view || MAP.viewBox}" role="img" aria-label="${T(l)("Карта мира с проектами бюро", "World map of the studio projects")}"><path class="mp-land" d="${MAP.d}"/>${pts}</svg>`;
}

function geoBlock(l) {
  const t = T(l);
  const cities = [];
  for (const p of PROJECTS) {
    const c = cities.find((x) => x.at.join() === p.at.join());
    if (c) c.ps.push(p); else cities.push({ at: p.at, name: p.city, ps: [p] });
  }
  return `<section class="geo" id="geo" data-tone="dark">
<div class="wrap geo-in">
<div class="sec-h"><p class="kicker">${t("География", "Map")}</p><h2>${t("Где стоят проекты", "Where the projects stand")}</h2><p class="sub">${t("Точка встаёт на карту сама: в CMS у проекта город и координаты. Нажмите на точку, чтобы открыть проект.", "A point appears by itself: each project has a city and coordinates in the CMS. Tap a point to open the project.")}</p></div>
<div class="geo-map">${mapSvg(l, PROJECTS.map((p) => [p, p.at[0], p.at[1], `${L2(p.n, l)}, ${L2(p.city, l)}`]), "map")}</div>
<ul class="geo-list">${cities.map((c) => `<li><p class="gl-c">${ICON.pin}<span>${L2(c.name, l)}</span><small>${c.at[0].toFixed(2)}°, ${c.at[1].toFixed(2)}°</small></p>${c.ps.map((p) => `<a href="${pHref(l, p)}" data-tr="${p.slug}" data-pt="${p.slug}">${L2(p.n, l)}</a>`).join("")}</li>`).join("")}</ul>
</div>
</section>`;
}

function servicesBlock(l) {
  const t = T(l);
  return `<section class="services" id="uslugi">
<div class="wrap">
<div class="sec-h"><p class="kicker">${t("Услуги", "Services")}</p><h2>${t("Услуга показывает свои проекты сама", "Each service lists its own projects")}</h2></div>
<ul class="sv-list">${SERVICES.map((s, i) => {
    const ps = PROJECTS.filter((p) => p.cats.includes(s.id));
    return `<li class="sv"><span class="sv-n">0${i + 1}</span><div class="sv-t"><h3>${L2(s.n, l)}</h3><p>${L2(s.d, l)}</p></div><div class="sv-ps">${ps.map((p) => `<a href="${pHref(l, p)}" data-tr="${p.slug}"><img src="${still(p.cover, 960)}" alt="" loading="lazy" decoding="async"><span>${L2(p.n, l)}</span></a>`).join("")}</div></li>`;
  }).join("")}</ul>
</div>
</section>`;
}

function specBlock(l) {
  const t = T(l);
  return `<section class="spec" id="sayt">
<div class="wrap">
<div class="sec-h"><p class="kicker">${t("Предложение DevUz Studio", "DevUz Studio proposal")}</p><h2>${t("Что будет на рабочем сайте", "What the live site gets")}</h2><p class="sub">${t("Всё из вашего ТЗ. Этот макет показывает, как сайт выглядит и двигается; ниже то, на чём он будет работать.", "Everything from your brief. This mock-up shows how the site looks and moves; below is what it will run on.")}</p></div>
<ul class="sp-grid">${SPEC.map((s, i) => `<li class="sp"><span class="sp-n">0${i + 1}</span><h3>${L2(s.n, l)}</h3><p>${L2(s.d, l)}</p></li>`).join("")}</ul>
</div>
</section>
<section class="cta" data-tone="dark">
<img class="cta-bg" src="${still(11, 960)}" srcset="${still(11, 960)} 960w, ${still(11)} 1920w" sizes="100vw" alt="" loading="lazy" decoding="async" aria-hidden="true">
<div class="wrap cta-in"><h2>${t("Расскажите об участке или здании", "Tell us about your site or building")}</h2><button type="button" class="btn btn-light" data-contact>${t("Обсудить проект", "Discuss a project")}${ICON.arrow}</button></div>
</section>`;
}

function home(l) {
  const t = T(l);
  return shell(l, {
    home: true, intro: true, cls: "home",
    title: `${B} · ${L2(BRAND.kind, l)} · ${t("макет DevUz Studio", "DevUz Studio mock-up")}`,
    desc: t("Макет имиджевого сайта архитектурного бюро: видео на первом экране, пролёт по дому по прокрутке, проекты во весь экран, карта, меню с фонами и форма справа.", "A mock-up of an architecture studio website: home video, a scroll-driven fly-through, full-screen projects, a map, an image menu and a slide-in form."),
    preload: `<link rel="preload" as="image" href="${IMG}/hero-m.webp" media="(max-width: 760px) and (orientation: portrait)"><link rel="preload" as="image" href="${IMG}/poster-1920.webp" media="(min-width: 761px), (orientation: landscape)">`,
    body: [heroBlock(l), flyBlock(l), projectsBlock(l), geoBlock(l), servicesBlock(l), specBlock(l)].join("\n"),
    data: { lang: l, frames: FRAMES },
  });
}

/* ── Страница проекта ─────────────────────────────────────────────────── */
function projectPage(l, p, i) {
  const t = T(l);
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const cats = p.cats.map((c) => L2(SERVICES.find((s) => s.id === c).n, l));
  const blocks = [];
  const shots = p.shots.filter((n) => n !== p.cover);
  const n = Math.max(shots.length, p.text.length);
  for (let k = 0; k < n; k++) {
    if (p.text[k]) blocks.push(`<div class="pp-text wrap${k % 2 ? " pp-text-r" : ""}"><p>${L2(p.text[k], l)}</p></div>`);
    if (shots[k]) blocks.push(`<figure class="pp-full"><span class="pp-img"><img src="${still(shots[k])}" srcset="${still(shots[k], 960)} 960w, ${still(shots[k])} 1920w" sizes="100vw" alt="${esc(L2(p.n, l))}" loading="lazy" decoding="async"></span></figure>`);
    if (k === 0 && p.video) blocks.push(`<figure class="pp-video wrap"><video class="pp-v" muted playsinline loop preload="none" poster="${IMG}/poster-1280.webp" data-src="${IMG}/hero-1280.mp4"></video><figcaption>${ICON.play}<span>${t("Видео проекта: загружается в CMS вместе с галереей", "Project video: uploaded to the CMS with the gallery")}</span></figcaption></figure>`);
  }
  const [x, y] = geo(p.at);
  const view = `${(x - 60).toFixed(1)} ${Math.max(0, y - 25).toFixed(1)} 120 50`;
  const body = `<section class="pp-hero" data-tone="dark">
<div class="pp-cover"><img data-tr-img src="${still(p.cover)}" srcset="${still(p.cover, 960)} 960w, ${still(p.cover)} 1920w" sizes="100vw" alt="" fetchpriority="high"></div>
<div class="pp-shade" aria-hidden="true"></div>
<div class="pp-h wrap"><a class="pp-back" href="${href(l)}#proekty">${t("Все проекты", "All projects")}</a><h1>${L2(p.n, l)}</h1><p class="pp-meta">${ICON.pin}<span>${L2(p.city, l)}</span><span>${cats.join(" · ")}</span></p></div>
</section>
<section class="pp-lead wrap">
<p class="pp-short">${L2(p.short, l)}</p>
<dl class="pp-facts"><div><dt>${t("Город", "City")}</dt><dd>${L2(p.city, l)}</dd></div><div><dt>${t("Услуги", "Services")}</dt><dd>${cats.join(", ")}</dd></div><div><dt>${t("Визуализация", "Visualisation")}</dt><dd>${t("Blender, DevUz Studio", "Blender, DevUz Studio")}</dd></div></dl>
</section>
${blocks.join("\n")}
<section class="pp-geo wrap" data-tone="dark">
<div><p class="kicker">${t("Расположение проекта", "Project location")}</p><h2>${L2(p.city, l)}</h2><p class="pp-coord">${p.at[0].toFixed(2)}° N, ${p.at[1].toFixed(2)}° E</p></div>
${mapSvg(l, [[p, p.at[0], p.at[1], L2(p.city, l)]], "map map-sm", view)}
</section>
<a class="pp-next" href="${pHref(l, next)}" data-tr="${next.slug}">
<span class="pp-next-img"><img data-tr-img src="${still(next.cover, 960)}" srcset="${still(next.cover, 960)} 960w, ${still(next.cover)} 1920w" sizes="100vw" alt="" loading="lazy" decoding="async"></span>
<span class="pp-next-t"><span class="kicker">${t("Следующий проект", "Next project")}</span><b>${L2(next.n, l)}</b></span>
</a>`;
  return shell(l, {
    path: "proekt/" + p.slug, cls: "project",
    title: `${L2(p.n, l)} · ${B} · ${t("макет DevUz Studio", "DevUz Studio mock-up")}`,
    desc: L2(p.short, l),
    preload: `<link rel="preload" as="image" href="${still(p.cover, 960)}" media="(max-width: 960px)"><link rel="preload" as="image" href="${still(p.cover)}" media="(min-width: 961px)">`,
    body, data: { lang: l, slug: p.slug },
  });
}

/* ── Сборка ───────────────────────────────────────────────────────────── */
const out = { "": home("ru"), en: home("en") };
PROJECTS.forEach((p, i) => {
  out["proekt/" + p.slug] = projectPage("ru", p, i);
  out["en/proekt/" + p.slug] = projectPage("en", p, i);
});
const parts = {
  S: `<style>${min(read("site.css") + read("intro.css")).replace(/__IMG__/g, IMG)}</style>`,
  J: `<script>\n${strip(read("site.js"))}</script>`,
};
const fill = (page) => Object.entries(parts).reduce((pg, [k, part]) => pg.split(`@@${k}@@`).join(part), page);

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "arhbyuro.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(34), fill(v).length);
