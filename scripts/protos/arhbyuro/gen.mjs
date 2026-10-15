import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { BRAND, SERVICES, PROJECTS, FLIGHT_STAGES, MENU, SPEC, HERO_SLIDES, STATEMENT, MARQUEE, GEO_HEAD } from "./data.mjs";

/*
 * Макет имиджевого сайта архбюро (ТЗ клиента, референс yodezeen.com).
 * Минимализм как у референса: светло-серый фон, гротеск, крупные заголовки
 * капсом, мелкие подписи, тонкие линии. У каждого блока своё движение от
 * прокрутки (скролл не перехватывается, всё на transform и opacity):
 *   первый экран     закреплённая сцена, кадры сменяют друг друга (референс)
 *   заявление        слова проявляются прокруткой (Text Reveal, Magic UI)
 *   пролёт           180 кадров Blender на canvas (референс, Stillstone)
 *   проекты          кадр приближается к рамке, строки поднимаются
 *   бегущая строка   скорость от прокрутки (Scroll Based Velocity, Magic UI)
 *   география        барабан городов крутится прокруткой (референс)
 *   ссылки           буквы перекатываются при наведении (Text Roll, Motion Primitives)
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
const FONTS = "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;700&display=swap";
const MAP = JSON.parse(read("worldmap.json"));
const FRAMES = 180;

const L2 = (pair, l) => (l === "ru" ? pair[0] : pair[1]);
const T = (l) => (ru, en) => (l === "ru" ? ru : en);
const href = (l, path = "") => BASE + (l === "en" ? "/en" : "") + (path ? "/" + path : "");
const pHref = (l, p) => href(l, "proekt/" + p.slug);
const PBY = Object.fromEntries(PROJECTS.map((p) => [p.slug, p]));
const still = (n, w) => `${IMG}/s-${n}${w ? "-" + w : ""}.webp`;
const frame = (set, i) => `${IMG}/f/${set}/${String(i).padStart(4, "0")}.webp`;
const bgOf = (key) => (key.startsWith("s-") ? still(key.slice(2), 960) : frame("d", +key.slice(2)));
const catsOf = (l, p) => p.cats.map((c) => L2(SERVICES.find((s) => s.id === c).n, l));
const pad = (n) => String(n).padStart(2, "0");

/* Карта: долгота и широта → единицы viewBox карты (worldmap.py). */
const geo = ([lat, lon]) => [+(lon + 180).toFixed(1), +(80 - lat).toFixed(1)];

/* Текст, буквы которого перекатываются при наведении (Text Roll). */
const roll = (s) => `<span class="roll" data-t="${esc(s)}"><span>${esc(s)}</span></span>`;
/* Заголовок, строки которого поднимаются из-под маски при появлении. */
const lines = (arr) => arr.map((s) => `<span class="ln"><span>${s}</span></span>`).join("");

const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
};

/* Знак DevUz Studio для заставки — тот же, что в промо на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZSIGN = `<svg class="dz-sign" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

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
<nav class="mn-list" aria-label="${t("Разделы", "Sections")}">${MENU.map((m, i) => `<a class="mn-i" href="${to(m.id)}" data-i="${i}"><span class="mn-n">${pad(i + 1)}</span><span class="mn-t">${L2(m.n, l)}</span></a>`).join("")}</nav>
<div class="mn-side">
<p class="cap">${t("Проекты", "Projects")}</p>
<ul>${PROJECTS.map((p) => `<li><a href="${pHref(l, p)}" data-tr="${p.slug}">${roll(L2(p.n, l))}</a><span>${L2(p.city, l)}</span></li>`).join("")}</ul>
<button type="button" class="lnk" data-contact>${roll(t("Связаться", "Get in touch"))}</button>
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
<label class="fld"><span>${t("Пара слов о задаче", "A few words about the brief")}</span><textarea name="msg" rows="3"></textarea></label>
<p class="pn-err" id="pn-err" role="alert" hidden>${t("Напишите имя и телефон или почту.", "Please add your name and a phone or email.")}</p>
<button type="submit" class="btn">${roll(t("Отправить", "Send"))}${ICON.arrow}</button>
<p class="pn-note">${t("Форма одна на весь сайт: открывается справа с любой страницы, без перезагрузки. Тексты формы правятся в CMS.", "One form for the whole site: it slides in from any page without a reload. Its wording is edited in the CMS.")}</p>
</form>
<div class="pn-ok" id="pn-ok" hidden>
<p class="pn-ok-h">${t("Заявка собрана", "Request ready")}</p>
<p>${t("Это макет, поэтому заявка никуда не ушла. На рабочем сайте её получит бюро: на почту и в раздел заявок Strapi.", "This is a mock-up, so nothing was sent. On the live site the studio receives it by email and in the Strapi requests section.")}</p>
<dl id="pn-sum"></dl>
<button type="button" class="lnk" data-close>${roll(t("Закрыть", "Close"))}</button>
</div>
</aside>`;
}

function shell(l, opts) {
  const t = T(l);
  const other = l === "ru" ? "en" : "ru";
  const nav = [["proekty", t("Проекты", "Projects")], ["uslugi", t("Услуги", "Services")], ["geo", t("География", "Map")]];
  const to = (id) => (opts.home ? "#" + id : href(l) + "#" + id);
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#f2f0f0">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="alternate" hreflang="${other}" href="${href(other, opts.path || "")}">
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
<nav class="top-nav" aria-label="${t("Разделы", "Sections")}">${nav.map(([id, n]) => `<a href="${to(id)}">${roll(n)}</a>`).join("")}</nav>
<a class="top-logo" href="${href(l)}" aria-label="${B}">${B}</a>
<div class="top-r">
<div class="lang"><a href="${href("ru", opts.path || "")}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("en", opts.path || "")}" hreflang="en"${l === "en" ? ' aria-current="true"' : ""}>EN</a></div>
<button type="button" class="top-c" data-contact>${roll(t("Связаться", "Let's talk"))}</button>
<button type="button" class="burger" id="burger" aria-expanded="false" aria-controls="menu"><span class="bg-l" aria-hidden="true"><i></i><i></i></span><span class="bg-t">${t("Меню", "Menu")}</span></button>
</div>
</header>
${menuHtml(l, !!opts.home)}
${panelHtml(l)}
<main id="main">
${opts.body}
</main>
<footer class="foot">
<p class="ft-word" aria-hidden="true">${B}</p>
<div class="ft-grid">
<div><p class="cap">${L2(BRAND.kind, l)}</p><button type="button" class="lnk" data-contact>${roll(t("Обсудить проект", "Discuss a project"))}</button></div>
<nav aria-label="${t("Проекты", "Projects")}"><p class="cap">${t("Проекты", "Projects")}</p><ul>${PROJECTS.map((p) => `<li><a href="${pHref(l, p)}" data-tr="${p.slug}">${roll(L2(p.n, l))}</a></li>`).join("")}</ul></nav>
<div><p class="cap">DevUz Studio</p><ul><li><a href="https://devuz.studio">${roll("devuz.studio")}</a></li><li><a href="https://t.me/Devuz_studio_bot?start=arhbyuro">${roll("Telegram")}</a></li></ul></div>
</div>
<div class="ft-legal">
<p>${t(`Это макет: так может выглядеть сайт бюро. ${B}: рабочее название, пришлёте своё название и логотип, и они встанут везде. Проекты демо: дом, интерьер, башня и павильон построены нами в Blender, в рабочем сайте здесь ваши проекты из CMS.`, `This is a mock-up of how the studio website could look. ${B} is a working name: send us your name and logo and they will appear everywhere. The projects are demos: the house, interior, tower and pavilion were built by us in Blender; on the live site this is your work from the CMS.`)}</p>
<p>${t("Материалы, небо, мебель и деревья в рендерах: Poly Haven, CC0. Карта: Natural Earth. Приёмы 21st.dev: Text Reveal, Scroll Based Velocity, Blur Fade (Magic UI), Text Roll (Motion Primitives), MIT.", "Materials, skies, furniture and trees in the renders: Poly Haven, CC0. Map: Natural Earth. 21st.dev patterns: Text Reveal, Scroll Based Velocity, Blur Fade (Magic UI), Text Roll (Motion Primitives), MIT.")}</p>
<p>${t("Макет принадлежит DevUz Studio. Использовать его можно только по договору:", "This mock-up belongs to DevUz Studio and may be used only under a contract:")} <a href="${TERMS(l)}">${t("условия использования", "terms of use")}</a></p>
</div>
</footer>
<div class="dock"><button type="button" class="btn" data-contact>${t("Связаться с бюро", "Contact the studio")}${ICON.arrow}</button></div>
<div class="cursor" id="cursor" aria-hidden="true"><span></span></div>
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
  const n = HERO_SLIDES.length;
  const slides = HERO_SLIDES.map((s, i) => {
    const media = s.video
      ? `<picture><source media="(max-width: 760px) and (orientation: portrait)" srcset="${IMG}/hero-m.webp"><img class="hs-img" src="${IMG}/poster-1920.webp" srcset="${IMG}/poster-1280.webp 1280w, ${IMG}/poster-1920.webp 1920w" sizes="100vw" alt="" fetchpriority="high"></picture><video class="hero-v" id="hero-v" muted playsinline loop preload="none" data-src="${IMG}/hero-1920.mp4" data-src-s="${IMG}/hero-1280.mp4"></video>`
      : `<img class="hs-img" src="${still(s.still)}" srcset="${still(s.still, 960)} 960w, ${still(s.still)} 1920w" sizes="100vw" alt="" loading="lazy" decoding="async">`;
    return `<div class="hs" data-i="${i}"${i === 0 ? ' data-on=""' : ""}>${media}</div>`;
  }).join("");
  const caps = HERO_SLIDES.map((s, i) => {
    const p = PBY[s.p];
    return `<a class="hc" href="${pHref(l, p)}" data-tr="${p.slug}" data-i="${i}"${i === 0 ? ' data-on=""' : ""}><span class="cap">${L2(p.city, l)}</span><span class="hc-n">${L2(p.n, l)}</span><span class="cap hc-go">${t("смотреть проект", "view project")}</span></a>`;
  }).join("");
  return `<section class="hero" id="hero" data-tone="dark" style="--n:${n}">
<div class="hero-stick">
<div class="hero-media" aria-hidden="true">${slides}<div class="hero-shade"></div></div>
<div class="hero-top"><p class="cap">${L2(BRAND.kind, l)}</p><h1 class="hero-h">${t("Проектируем дома, интерьеры и общественные здания", "We design houses, interiors and public buildings")}</h1></div>
<div class="hero-caps">${caps}</div>
<p class="hero-count cap" aria-hidden="true"><b id="hero-i">01</b> / ${pad(n)}</p>
<p class="hero-word" aria-hidden="true">${B}</p>
<p class="hero-note cap">${t("Рендер Blender, DevUz Studio", "Blender render, DevUz Studio")}</p>
</div>
</section>`;
}

function statementBlock(l) {
  const words = L2(STATEMENT, l).replace("{B}", B).split(" ").map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(" ");
  return `<section class="stmt" id="byuro"><div class="stmt-stick"><p class="cap">${T(l)("О бюро", "About")}</p><p class="stmt-t" data-words>${words}</p></div></section>`;
}

/* Значки шагов пролёта — контур 24×24. */
const STEP_ICON = [
  I('<rect x="4" y="4" width="16" height="16"/><path d="M4 12h16M12 4v16"/>'),
  I('<path d="M3 20h18M5 20v-8h9v8M9 12V6h11v8h-6"/>'),
  I('<path d="M3 15c3-2 6 2 9 0s6 2 9 0M3 19c3-2 6 2 9 0s6 2 9 0"/><path d="M6 11V5h12v6"/>'),
  I('<path d="M4 18v-5h16v5M6 13V9h12v4M5 18v2M19 18v2"/>'),
];

function flyBlock(l) {
  const t = T(l);
  const stills = [1, 40, 120, 180];
  const n = FLIGHT_STAGES.length;
  const cards = FLIGHT_STAGES.map((s, i) => `<article class="fsh-card" data-from="${s.from}" data-to="${s.to}"${i === 0 ? ' data-on=""' : ""}>
<div class="fsh-head"><span class="cap"><b>${pad(i + 1)}</b> / ${pad(n)}</span><span class="fsh-icon">${STEP_ICON[i]}</span></div>
<h3 class="fsh-title">${L2(s.t, l)}</h3>
<p class="fsh-desc">${L2(s.d, l)}</p>
<div class="fsh-foot"><span class="fsh-ticks" aria-hidden="true">${FLIGHT_STAGES.map(() => "<i><span></span></i>").join("")}</span><span class="cap">${L2(s.k, l)}</span></div>
</article>`).join("");
  return `<section class="fly" id="prolet" data-tone="dark" data-n="${FRAMES}" data-d="${IMG}/f/d/" data-m="${IMG}/f/m/">
<div class="fly-stick">
<img class="fly-poster" src="${frame("d", 1)}" alt="" aria-hidden="true">
<canvas class="fly-cv" aria-hidden="true"></canvas>
<div class="fly-head"><p class="cap">${t("Пролёт по проекту", "Project fly-through")}</p><h2 class="fly-h">${t("Дом с консолью", "Cantilever House")}</h2><p class="cap fly-sub">${t("Листайте, чтобы пройти по дому", "Scroll to walk through the house")}</p></div>
<p class="fly-frame cap" aria-hidden="true"><b id="fly-f">001</b> / ${FRAMES}</p>
<div class="fsh-loader" id="fly-loader" aria-hidden="true"><p class="cap">${t("Загрузка", "Loading")} · <b id="fly-pct">0</b>%</p><span class="fsh-track"><i id="fly-fill"></i></span></div>
<div class="fsh-cards">${cards}</div>
<div class="fly-rail" aria-hidden="true"><i class="fr-fill"></i></div>
<p class="fly-note cap">${t(`Рендер Blender, ${FRAMES} кадров идут за вашей прокруткой`, `Blender render, ${FRAMES} frames follow your scroll`)}</p>
</div>
<div class="fly-still">${stills.map((n, i) => `<figure><img src="${frame("d", n)}" alt="${esc(L2(FLIGHT_STAGES[i].t, l))}" loading="lazy" decoding="async"><figcaption class="cap">${L2(FLIGHT_STAGES[i].k, l)}</figcaption></figure>`).join("")}</div>
</section>`;
}

/* Стеклянные папки (Glass Folder Cards, kedhareswer, 21st.dev, MIT): объекты
   заказчика сгруппированы по направлениям. Задняя стенка с кадром, внутри
   файлы-проекты, спереди матовое стекло на петле. Собираются при появлении,
   при наведении стекло наклоняется, по нажатию файлы выходят веером. */
const GF_BACK = "M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z";
const GF_FH = 198;
const GF_FRONT = `M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 ${GF_FH - 22}A22 22 0 0 1 318 ${GF_FH}L22 ${GF_FH}A22 22 0 0 1 0 ${GF_FH - 22}Z`;
const plural = (l, n) => (l === "en" ? `${n} project${n === 1 ? "" : "s"}` : `${n} ${n % 10 === 1 && n % 100 !== 11 ? "проект" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "проекта" : "проектов"}`);

function folderHtml(l, s, i) {
  const t = T(l);
  const ps = PROJECTS.filter((p) => p.cats.includes(s.id));
  const back = ps[0];
  const sheets = ps.slice(-4).map((p, v, arr) => {
    const slot = arr.length <= 1 ? 0 : (v / (arr.length - 1)) * 2 - 1;
    const h = [...p.slug].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7 + i);
    const jx = (((h % 100) / 100) - 0.5) * 10;
    const jr = ((((h >> 8) % 100) / 100) - 0.5) * 3.2;
    return `<div role="listitem" class="gf-slot"><a class="gf-sheet" href="${pHref(l, p)}" data-tr="${p.slug}" style="--slot:${slot.toFixed(2)};--depth:${arr.length - 1 - v};--jx:${jx.toFixed(2)}px;--jr:${jr.toFixed(2)}deg;z-index:${v + 1}"><img class="gf-sheet-art" src="${still(p.cover, 960)}" alt="" loading="lazy" decoding="async"><span class="gf-sheet-head"><span class="gf-sheet-name">${L2(p.n, l)}</span><span class="gf-sheet-meta">${L2(p.city, l)}</span></span></a></div>`;
  }).join("");
  return `<div class="gf-cell"><div class="gf" data-gf style="--d:${i * 140}ms">
<div class="gf-stage"><div class="gf-tilt">
<div class="gf-shadow" aria-hidden="true"></div>
<div class="gf-back" style="clip-path:path('${GF_BACK}')" aria-hidden="true"><img class="gf-art" src="${still(back.cover, 960)}" alt="" loading="lazy" decoding="async"><div class="gf-sheen"></div></div>
<svg class="gf-rim gf-back-rim" viewBox="0 0 340 272" aria-hidden="true"><path d="${GF_BACK}"/></svg>
<div class="gf-front" style="clip-path:path('${GF_FRONT}')">
<div class="gf-tint" aria-hidden="true"></div><div class="gf-spec" aria-hidden="true"></div>
<svg class="gf-rim gf-front-rim" viewBox="0 0 340 ${GF_FH}" aria-hidden="true"><defs><linearGradient id="gfr${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient></defs><path d="${GF_FRONT}" stroke="url(#gfr${i})"/></svg>
<button type="button" class="gf-hit" aria-expanded="false" aria-label="${esc(`${t("Открыть папку", "Open folder")} ${L2(s.n, l)}, ${plural(l, ps.length)}`)}"></button>
<div class="gf-label"><span class="cap">${pad(i + 1)}</span><span class="gf-title">${L2(s.n, l)}</span><span class="gf-meta">${plural(l, ps.length)}</span></div>
</div>
<div class="gf-files" role="list" aria-label="${esc(L2(s.n, l))}">${sheets}</div>
</div></div>
</div></div>`;
}

function projectsBlock(l) {
  const t = T(l);
  const rows = PROJECTS.map((p, i) => `<article class="pj pj-${i % 4}">
<a class="pj-fig" href="${pHref(l, p)}" data-tr="${p.slug}" data-cur="${esc(t("Смотреть", "View"))}" aria-label="${esc(L2(p.n, l))}"><span class="pj-img" data-zoom><img data-tr-img src="${still(p.cover)}" srcset="${still(p.cover, 960)} 960w, ${still(p.cover)} 1920w" sizes="(min-width: 768px) 70vw, 100vw" alt="" loading="lazy" decoding="async"></span></a>
<div class="pj-txt"><p class="cap pj-n">${pad(i + 1)}</p><h3><a href="${pHref(l, p)}" data-tr="${p.slug}">${L2(p.n, l)}</a></h3><p class="cap pj-meta">${L2(p.city, l)} · ${catsOf(l, p).join(" · ")}</p></div>
</article>`).join("");
  return `<section class="projects" id="proekty">
<div class="sec-h"><h2 class="big" data-lines>${lines([t("Избранные", "Selected"), t("проекты", "projects")])}</h2><p class="cap sec-side">${t("Объекты в работе бюро: дома, интерьеры, общественные здания", "Projects of the studio: houses, interiors, public buildings")}</p></div>
<div class="pj-list">${rows}</div>
<div class="folders">
<div class="fd-h"><p class="cap">${t("Мы делаем", "We do")}</p><h2 class="big" data-lines>${lines([t("По направлениям", "By discipline")])}</h2><p class="cap fd-hint"><span class="fd-ptr">${t("Наведите на папку, нажмите, чтобы открыть", "Hover a folder, click to open it")}</span><span class="fd-tap">${t("Нажмите на папку, чтобы открыть", "Tap a folder to open it")}</span></p></div>
<div class="fd-grid">${SERVICES.map((s, i) => folderHtml(l, s, i)).join("")}</div>
</div>
</section>`;
}

function marqueeBlock(l) {
  const words = L2(MARQUEE, l).map((w) => `<span>${w}</span><i aria-hidden="true"></i>`).join("");
  return `<div class="velo" aria-hidden="true"><div class="velo-row" data-velo="1"><div class="velo-t">${words}${words}${words}</div></div><div class="velo-row" data-velo="-1"><div class="velo-t">${words}${words}${words}</div></div></div>`;
}

function mapSvg(l, points, cls, view) {
  const pts = points.map(([p, lat, lon, label]) => {
    const [x, y] = geo([lat, lon]);
    return `<a class="mp-pt" href="${pHref(l, p)}" data-tr="${p.slug}" transform="translate(${x} ${y})" aria-label="${esc(label)}"><circle class="mp-ring" r="3.2"/><circle class="mp-dot" r="1.4"/></a>`;
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
  /* Барабан: города по кругу, повторяем, чтобы обод был полным. */
  const ring = [];
  while (ring.length < 12) for (const c of cities) ring.push(L2(c.name, l));
  const degrees = ["180°", "120°", "60°", "0°", "60°", "120°", "180°"];
  return `<section class="geo" id="geo">
<div class="geo-top"><h2 class="big" data-lines>${lines(L2(GEO_HEAD, l))}</h2>
<div class="drum" aria-hidden="true"><div class="drum-track" id="drum">${ring.slice(0, 12).map((c, i) => `<span style="--a:${i * 30}deg">${c}</span>`).join("")}</div></div></div>
<div class="geo-map">${mapSvg(l, PROJECTS.map((p) => [p, p.at[0], p.at[1], `${L2(p.n, l)}, ${L2(p.city, l)}`]), "map")}<div class="map-deg cap" aria-hidden="true">${degrees.map((d) => `<span>${d}</span>`).join("")}</div></div>
<ul class="geo-list">${cities.map((c) => `<li><p class="cap">${L2(c.name, l)}<span>${c.at[0].toFixed(2)}°, ${c.at[1].toFixed(2)}°</span></p>${c.ps.map((p) => `<a href="${pHref(l, p)}" data-tr="${p.slug}" data-pt="${p.slug}">${roll(L2(p.n, l))}</a>`).join("")}</li>`).join("")}</ul>
<p class="cap geo-note">${t("Точка встаёт на карту сама: у проекта в CMS город и координаты.", "Each point appears by itself: a project has a city and coordinates in the CMS.")}</p>
</section>`;
}

function servicesBlock(l) {
  const t = T(l);
  return `<section class="services" id="uslugi">
<div class="sec-h"><h2 class="big" data-lines>${lines([t("Услуги", "Services")])}</h2><p class="cap sec-side">${t("Проекты услуги подгружаются сами", "Each service lists its own projects")}</p></div>
<ul class="sv-list">${SERVICES.map((s, i) => {
    const ps = PROJECTS.filter((p) => p.cats.includes(s.id));
    return `<li class="sv"><button type="button" class="sv-h" aria-expanded="${i === 0}"><span class="cap">${pad(i + 1)}</span><span class="sv-n">${L2(s.n, l)}</span><span class="cap">${ps.length}</span><i aria-hidden="true"></i></button><div class="sv-b"${i === 0 ? "" : " hidden"}><p>${L2(s.d, l)}</p><div class="sv-ps">${ps.map((p) => `<a href="${pHref(l, p)}" data-tr="${p.slug}"><img src="${still(p.cover, 960)}" alt="" loading="lazy" decoding="async"><span class="cap">${L2(p.n, l)}</span></a>`).join("")}</div></div></li>`;
  }).join("")}</ul>
</section>`;
}

function specBlock(l) {
  const t = T(l);
  return `<section class="spec" id="sayt">
<div class="sec-h"><h2 class="big" data-lines>${lines([t("Что будет", "What the"), t("на сайте", "site gets")])}</h2><p class="cap sec-side">${t("Предложение DevUz Studio по вашему ТЗ", "DevUz Studio proposal for your brief")}</p></div>
<ol class="toc">${SPEC.map((s, i) => `<li><span class="cap">${pad(i + 1)}</span><b>${L2(s.n, l)}</b><p>${L2(s.d, l)}</p></li>`).join("")}</ol>
</section>
<section class="cta" data-tone="dark">
<span class="cta-img" data-zoom aria-hidden="true"><img src="${still(11)}" srcset="${still(11, 960)} 960w, ${still(11)} 1920w" sizes="100vw" alt="" loading="lazy" decoding="async"></span>
<div class="cta-in"><p class="cap">${t("Новый проект", "New project")}</p><button type="button" class="cta-b" data-contact>${roll(t("Обсудить проект", "Let's talk"))}</button></div>
</section>`;
}

function home(l) {
  const t = T(l);
  return shell(l, {
    home: true, intro: true, cls: "home",
    title: `${B} · ${L2(BRAND.kind, l)} · ${t("макет DevUz Studio", "DevUz Studio mock-up")}`,
    desc: t("Макет имиджевого сайта архитектурного бюро: видео на первом экране, пролёт по дому по прокрутке, проекты во весь экран, карта, меню с фонами и форма справа.", "A mock-up of an architecture studio website: home video, a scroll-driven fly-through, full-screen projects, a map, an image menu and a slide-in form."),
    preload: `<link rel="preload" as="image" href="${IMG}/hero-m.webp" media="(max-width: 760px) and (orientation: portrait)"><link rel="preload" as="image" href="${IMG}/poster-1920.webp" media="(min-width: 761px), (orientation: landscape)">`,
    body: [heroBlock(l), statementBlock(l), flyBlock(l), projectsBlock(l), marqueeBlock(l), geoBlock(l), servicesBlock(l), specBlock(l)].join("\n"),
    data: { lang: l, frames: FRAMES },
  });
}

/* ── Страница проекта ─────────────────────────────────────────────────── */
function projectPage(l, p, i) {
  const t = T(l);
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const cats = catsOf(l, p);
  const blocks = [];
  const shots = p.shots.filter((n) => n !== p.cover);
  const n = Math.max(shots.length, p.text.length);
  for (let k = 0; k < n; k++) {
    if (p.text[k]) blocks.push(`<div class="pp-text${k % 2 ? " pp-text-r" : ""}"><span class="cap">${pad(k + 1)}</span><p data-lines>${L2(p.text[k], l)}</p></div>`);
    if (shots[k]) blocks.push(`<figure class="pp-full${k % 2 ? " pp-inset" : ""}"><span class="pp-img" data-zoom><img src="${still(shots[k])}" srcset="${still(shots[k], 960)} 960w, ${still(shots[k])} 1920w" sizes="100vw" alt="${esc(L2(p.n, l))}" loading="lazy" decoding="async"></span></figure>`);
    if (k === 0 && p.video) blocks.push(`<figure class="pp-video"><video class="pp-v" muted playsinline loop preload="none" poster="${IMG}/poster-1280.webp" data-src="${IMG}/hero-1280.mp4"></video><figcaption class="cap">${t("Видео проекта: загружается в CMS вместе с галереей", "Project video: uploaded to the CMS with the gallery")}</figcaption></figure>`);
  }
  const [x, y] = geo(p.at);
  const view = `${(x - 60).toFixed(1)} ${Math.max(0, y - 25).toFixed(1)} 120 50`;
  const body = `<section class="pp-hero" data-tone="dark">
<div class="pp-cover"><img data-tr-img src="${still(p.cover)}" srcset="${still(p.cover, 960)} 960w, ${still(p.cover)} 1920w" sizes="100vw" alt="" fetchpriority="high"></div>
<div class="pp-shade" aria-hidden="true"></div>
<div class="pp-h"><a class="cap pp-back" href="${href(l)}#proekty">${t("Все проекты", "All projects")}</a><h1>${L2(p.n, l)}</h1><p class="cap">${L2(p.city, l)} · ${cats.join(" · ")}</p></div>
</section>
<section class="pp-lead">
<p class="pp-short" data-lines>${L2(p.short, l)}</p>
<dl class="pp-facts"><div><dt class="cap">${t("Город", "City")}</dt><dd>${L2(p.city, l)}</dd></div><div><dt class="cap">${t("Услуги", "Services")}</dt><dd>${cats.join(", ")}</dd></div><div><dt class="cap">${t("Визуализация", "Visualisation")}</dt><dd>Blender, DevUz Studio</dd></div></dl>
</section>
${blocks.join("\n")}
<section class="pp-geo">
<div><p class="cap">${t("Расположение проекта", "Project location")}</p><h2 class="big">${L2(p.city, l)}</h2><p class="cap pp-coord">${p.at[0].toFixed(2)}° N, ${p.at[1].toFixed(2)}° E</p></div>
${mapSvg(l, [[p, p.at[0], p.at[1], L2(p.city, l)]], "map map-sm", view)}
</section>
<a class="pp-next" href="${pHref(l, next)}" data-tr="${next.slug}" data-cur="${esc(t("Дальше", "Next"))}">
<span class="pp-next-img"><img data-tr-img src="${still(next.cover, 960)}" srcset="${still(next.cover, 960)} 960w, ${still(next.cover)} 1920w" sizes="100vw" alt="" loading="lazy" decoding="async"></span>
<span class="pp-next-t"><span class="cap">${t("Следующий проект", "Next project")}</span><b>${L2(next.n, l)}</b></span>
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
