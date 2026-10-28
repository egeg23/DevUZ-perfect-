import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { LANGS, COMPANY, NUMBERS, BRANDS, REGIONS, STORES, TEAM, KG } from "./data.mjs";
import { MAP } from "./map.mjs";

/*
 * Премиум-макет Cosmo World (cosmoworld.uz), 28.10.2026: дистрибьютор
 * косметики и бытовой химии. Главная на трёх языках (ru, uz латиницей, en).
 *
 *   видео DevUz → сцена пролёта по прокрутке (подиум с товарами над облаками
 *   → ближе к товарам → сквозь облака на склад → ночная страна с дугами из
 *   Ташкента) → о компании (цифры) → бренды (ледяные карточки, фильтр,
 *   поиск, окно с каталогом PDF и «Запросить прайс») → склад (путь заказа) →
 *   живая карта 14 регионов → где купить → стать партнёром (три вкладки,
 *   заявка готовым текстом в их WhatsApp) → команда → Кыргызстан и вакансии.
 *
 * Факты — только с их сайтов (data.mjs). Цен нет: их нет и у них. Формы
 * ничего не отправляют: собирают текст и открывают их мессенджер.
 * Кадры сцены — шифром (scene.py), ключ — SCENE_KEY_COSMOWORLD.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/cosmoworld";
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const CSS = strip(readFileSync(DIR + "site.css", "utf8")).replace(/\n\s*/g, "");
const JS = strip(readFileSync(DIR + "site.js", "utf8")).replace(/\n\s*\n/g, "\n");
const LOGO = readFileSync(DIR + "logo.svg", "utf8").replace("<svg ", '<svg aria-hidden="true" focusable="false" ');
const SEQ = JSON.parse(readFileSync(DIR + "seq.json", "utf8"));
const BASE_URL = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Play:wght@400;700&display=swap";
const KEY = { ru: "", uz: "uz", en: "en" };
const WA = "998773507025";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l) => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/";
const T = (l) => (ru, uz, en) => (l === "ru" ? ru : l === "uz" ? uz : en);
const LI = { ru: 0, uz: 1, en: 2 };
const wa = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

const I = (dd) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  search: I('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  doc: I('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
  wa: I('<path d="M4 20l1.3-4A8 8 0 1 1 8 18.8Z"/><path d="M9.5 9.5c.3 2 1.9 3.8 4 4.4l1.2-1.1 1.8.9-.4 1.4c-3.5.3-7.2-3.2-7-6.9l1.4-.4.9 1.8Z"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  ig: I('<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="16.8" cy="7.2" r=".6" fill="currentColor"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  box: I('<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>'),
  map: I('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2Z"/><path d="M9 4v14M15 6v14"/>'),
  people: I('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>'),
  stack: I('<path d="M12 3 3 8l9 5 9-5Z"/><path d="m3 13 9 5 9-5"/>'),
};

const ORIGIN = { ru: ["Россия", "Rossiya", "Russia"], ae: ["ОАЭ", "BAA", "UAE"], tr: ["Турция", "Turkiya", "Türkiye"], in: ["Индия", "Hindiston", "India"] };
const brandName = (b, l) => (l === "ru" ? b.name : b.latin ?? b.name);
const regionName = (r, i, l) => {
  const n = r[LI[l]];
  if (i === 0 || i === 13) return n;
  return n + (l === "ru" ? " область" : l === "uz" ? " viloyati" : " Region");
};
/* «3 000» → число и хвост для счётчика. */
/* Заголовок по словам: каждое выезжает из-под маски по очереди. */
const words = (txt) => txt.split(" ").map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
const numOf = (v) => {
  const m = /^(\d[\d\s,]*\d|\d)(.*)$/.exec(v);
  return { n: Number(m[1].replace(/[\s,]/g, "")), s: m[2].replace(/^\s+/, "\u00a0") };
};

function head(l, t) {
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t("Cosmo World · дистрибьютор косметики и бытовой химии в Узбекистане", "Cosmo World · O‘zbekistonda kosmetika va maishiy kimyo distribyutori", "Cosmo World · cosmetics and household care distributor in Uzbekistan")}</title>
<meta name="description" content="${t("Cosmo World: 10 брендов косметики и бытовой химии, свой склад 2 000 м², поставки по всем регионам Узбекистана. Каталоги брендов и заявка на сотрудничество.", "Cosmo World: kosmetika va maishiy kimyoning 10 ta brendi, 2 000 m² o‘z omborimiz, O‘zbekistonning barcha hududlariga yetkazib berish. Brend kataloglari va hamkorlik arizasi.", "Cosmo World: 10 cosmetics and household care brands, our own 2,000 m² warehouse, supply to every region of Uzbekistan. Brand catalogs and partnership request.")}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#05070b">
${LANGS.filter((x) => x !== l).map((x) => `<link rel="alternate" hreflang="${x}" href="${href(x)}">`).join("\n")}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="preload" as="image" href="${IMG}/hero-2400.webp" media="(min-width: 900px) and (orientation: landscape)">
<style>${CSS}
.toast{position:fixed;left:50%;bottom:calc(88px + env(safe-area-inset-bottom));z-index:90;max-width:calc(100% - 32px);padding:12px 18px;border-radius:999px;background:var(--ink);color:#fff;font:700 14px/1.3 var(--tx);transform:translate(-50%,20px);opacity:0;pointer-events:none;transition:transform .3s,opacity .3s}.toast.on{transform:translate(-50%,0);opacity:1}</style>
</head>`;
}

function header(l, t) {
  const nav = [["about", t("О компании", "Kompaniya", "About")], ["brands", t("Бренды", "Brendlar", "Brands")], ["sklad", t("Склад", "Ombor", "Warehouse")], ["cover", t("Покрытие", "Qamrov", "Coverage")], ["team", t("Команда", "Jamoa", "Team")], ["contacts", t("Контакты", "Aloqa", "Contacts")]];
  return `<header class="top"><div class="top-in">
<a class="logo" href="${href(l)}" aria-label="Cosmo World">${LOGO}</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar", "Sections")}">${nav.map(([id, n]) => `<a href="#${id}">${n}</a>`).join("")}</nav>
<div class="langs">${LANGS.map((x) => `<a href="${href(x)}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<a class="btn btn-a" href="#partner">${t("Стать партнёром", "Hamkor bo‘lish", "Become a partner")}</a>
</div></header>`;
}

function scene(l, t) {
  const n = (i) => numOf(NUMBERS[i].v);
  return `<section class="sc" id="top" aria-label="Cosmo World"><div class="sc-stick">
<div class="sc-media" aria-hidden="true">
<picture class="sc-poster"><source media="(max-width: 899px), (orientation: portrait)" srcset="${IMG}/hero-m-1080.webp"><img src="${IMG}/hero-2400.webp" srcset="${IMG}/hero-1600.webp 1600w, ${IMG}/hero-2400.webp 2400w" sizes="100vw" alt="" fetchpriority="high"></picture>
<canvas class="sc-cv"></canvas>
<div class="sc-cl"><img class="cl cl1" src="${IMG}/fx/cloud-1.webp" alt="" width="2400" height="900"><img class="cl cl2" src="${IMG}/fx/cloud-2.webp" alt="" width="2400" height="900"><img class="cl cl3" src="${IMG}/fx/cloud-3.webp" alt="" width="2000" height="700"></div>
<span class="sc-veil"></span><span class="sc-vig"></span><span class="sc-dark"></span><span class="sc-grain"></span></div>
<div class="sc-cap c0">
<p class="kick">${t("Дистрибьютор косметики и бытовой химии", "Kosmetika va maishiy kimyo distribyutori", "Cosmetics and household care distributor")}</p>
<h1>${words(esc(COMPANY.slogan[l]))}</h1>
<p>${esc(COMPANY.lead[l])}.</p>
<div class="row"><a class="btn btn-a" href="#partner">${t("Стать партнёром", "Hamkor bo‘lish", "Become a partner")}${ICON.arrow}</a><a class="btn btn-g" href="#brands">${t("Каталоги брендов", "Brend kataloglari", "Brand catalogs")}</a></div>
</div>
<div class="sc-cap c1" aria-hidden="true">
<p class="kick">${t("Бренды", "Brendlar", "Brands")}</p>
<h2>${words(t("10 брендов из 10+ стран-партнёров", "10+ hamkor davlatdan 10 ta brend", "10 brands from 10+ partner countries"))}</h2>
<p>${t("Арнест, Весна, MIXIT, Nefis, Parachute и другие: от уходовой косметики до средств для стирки.", "Arnest, Vesna, MIXIT, Nefis, Parachute va boshqalar: parvarish kosmetikasidan kir yuvish vositalarigacha.", "Arnest, Vesna, MIXIT, Nefis, Parachute and more: from skincare to laundry products.")}</p>
</div>
<div class="sc-cap c2" aria-hidden="true">
<p class="kick">${t("Склад", "Ombor", "Warehouse")}</p>
<h2>${words(t("Собственный автоматизированный склад", "O‘z avtomatlashtirilgan omborimiz", "Our own automated warehouse"))}</h2>
<div class="big"><div><b>${NUMBERS[4][l === "ru" ? "v" : l === "uz" ? "vuz" : "ven"]}</b><span>${t("площадь склада", "ombor maydoni", "warehouse area")}</span></div><div><b>${l === "en" ? "3,000" : "3 000"}</b><span>${t("паллетомест", "palleta o‘rni", "pallet spaces")}</span></div></div>
</div>
<div class="sc-cap c3" aria-hidden="true">
<p class="kick">${t("Покрытие", "Qamrov", "Coverage")}</p>
<h2>${words(t("Работаем по всей территории Узбекистана", "O‘zbekistonning butun hududida ishlaymiz", "We operate all over Uzbekistan"))}</h2>
<div class="big"><div><b>14</b><span>${t("регионов", "hudud", "regions")}</span></div><div><b>${n(5).n}+</b><span>${t("сотрудников", "xodim", "employees")}</span></div></div>
</div>
<div class="sc-steps" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
<div class="sc-load" aria-hidden="true"><b>0</b><i><u></u></i><span>${t("сцена загружается, %", "sahna yuklanmoqda, %", "scene loading, %")}</span></div>
<p class="sc-hint" aria-hidden="true">${t("Листайте", "Aylantiring", "Scroll")}</p>
</div><div class="sc-run" aria-hidden="true"></div>
${brands(l, t)}
</section>`;
}

function about(l, t) {
  return `<section class="sec" id="about"><div class="wrap ab">
<div class="ab-txt mv mv-left">
<p class="kick">${t("О компании", "Kompaniya haqida", "About the company")}</p>
<h2 class="h2">COSMO WORLD: <b>${t("дистрибьютор", "distribyutor", "a distributor")}</b> ${t("товаров для дома и личной гигиены", "uy va shaxsiy gigiyena mahsulotlari", "of household and personal care products")}</h2>
<p class="lead" data-reveal>${t("Мы работаем с ведущими брендами, предлагая клиентам только качественные решения. Наш опыт и профессиональная команда позволяют нам эффективно решать задачи и предлагать лучшие товары для вашего бизнеса.", "Yetakchi brendlar bilan ishlaymiz va mijozlarga faqat sifatli yechimlarni taklif qilamiz. Tajribamiz va professional jamoamiz vazifalarni samarali hal qilish va biznesingiz uchun eng yaxshi mahsulotlarni taklif qilish imkonini beradi.", "We work with leading brands to offer our clients only high-quality solutions. Our experience and professional team let us solve tasks effectively and offer the best products for your business.")}</p>
</div>
<ul class="nums">${NUMBERS.map((x, i) => {
    const v = l === "ru" ? x.v : l === "uz" ? x.vuz ?? x.v : x.ven ?? x.v;
    const { n, s } = numOf(v);
    return `<li class="ice mv mv-ice" style="--i:${i}"><b data-n="${n}" data-s="${esc(s)}">${esc(v)}</b><span>${esc(x[l])}</span></li>`;
  }).join("")}</ul>
</div></section>`;
}

/* Стеклянная папка бренда (Glass Folder Cards, kedhareswer, 21st.dev, MIT;
   как «Папки бюро» у SIA): на стекле логотип бренда, внутри его товары без
   фона (cut.py). Наведение или первое нажатие на телефоне: крышка
   приоткрывается, левая и правая часть товаров выпадает вперёд, середина
   остаётся в папке. Нажатие (на телефоне второе) открывает окно бренда. */
const GF_BACK = "M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z";
const GF_FH = 198;
const GF_FRONT = `M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 ${GF_FH - 22}A22 22 0 0 1 318 ${GF_FH}L22 ${GF_FH}A22 22 0 0 1 0 ${GF_FH - 22}Z`;
const CUT = JSON.parse(readFileSync(DIR + "cut.json", "utf8"));
function folder(b, i, l, t) {
  const c = CUT[b.id], [a, z] = c.cut, H = Math.min(170, Math.round(280 * c.h / c.w)), PW = Math.round(H * c.w / c.h > 280 ? 280 : H * c.w / c.h);
  const pct = (x) => (x * 100).toFixed(2) + "%";
  const piece = (cls, clip, st) => `<span class="gf-pc ${cls}" style="${st}"><img src="${IMG}/cut/${b.id}.webp" alt="" loading="lazy" decoding="async" width="${c.w}" height="${c.h}" style="clip-path:inset(0 ${clip})"></span>`;
  const h = [...b.id].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const jr = (((h % 100) / 100) - 0.5) * 6;
  const name = brandName(b, l);
  return `<div class="gf" data-gf style="--d:${(i % 5) * 110}ms;--ph:${H}px;--pw:${PW}px">
<div class="gf-stage"><div class="gf-tilt">
<div class="gf-shadow" aria-hidden="true"></div>
<div class="gf-back" style="clip-path:path('${GF_BACK}')" aria-hidden="true"><div class="gf-sheen"></div></div>
<svg class="gf-rim gf-back-rim" viewBox="0 0 340 272" aria-hidden="true"><path d="${GF_BACK}"/></svg>
<div class="gf-prod" aria-hidden="true">
${piece("p-m", `${pct(1 - z)} 0 ${pct(a)}`, "")}
${piece("p-l", `${pct(1 - a)} 0 0`, `--fx:-${(58 + (h % 16)).toFixed(0)}px;--fy:${118 + (h % 14)}px;--fr:${(-13 + jr).toFixed(1)}deg`)}
${piece("p-r", `0 0 ${pct(z)}`, `--fx:${(56 + ((h >> 5) % 16)).toFixed(0)}px;--fy:${110 + ((h >> 3) % 14)}px;--fr:${(12 + jr).toFixed(1)}deg;--dl:.08s`)}
</div>
<div class="gf-front" style="clip-path:path('${GF_FRONT}')">
<div class="gf-tint" aria-hidden="true"></div><div class="gf-spec" aria-hidden="true"></div>
<svg class="gf-rim gf-front-rim" viewBox="0 0 340 ${GF_FH}" aria-hidden="true"><defs><linearGradient id="gfr${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient></defs><path d="${GF_FRONT}" stroke="url(#gfr${i})"/></svg>
<button type="button" class="gf-hit" data-i="${i}" aria-label="${esc(t(`Бренд ${name}: товары, каталог и прайс`, `${name} brendi: mahsulotlar, katalog va narxlar`, `${name}: products, catalog and price list`))}"></button>
<div class="gf-label"><span class="gf-logo" role="img" aria-label="${esc(name)}" style="-webkit-mask-image:url(${IMG}/logo/${b.id}.png);mask-image:url(${IMG}/logo/${b.id}.png)"></span><span class="gf-meta"><b>${esc(name)}</b> · ${ORIGIN[b.origin][LI[l]]}</span></div>
</div>
</div></div>
</div>`;
}

function brands(l, t) {
  return `<section class="sec brd" id="brands"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kick">${t("Каталог", "Katalog", "Catalog")}</p><h2 class="h2">${t("Ассортимент, отвечающий <b>любым потребностям</b>", "Har qanday <b>ehtiyojga</b> javob beradigan assortiment", "A range for <b>any need</b>")}</h2><p class="lead"><span class="fd-ptr">${t("Наведите на папку бренда: товары выпадут. Нажмите: описание, каталог PDF и прайс в WhatsApp.", "Brend papkasiga kursorni olib boring: mahsulotlar tushib ketadi. Bosing: tavsif, PDF katalog va WhatsApp orqali narxlar.", "Hover a brand folder and the products fall out. Click for the description, PDF catalog and price list on WhatsApp.")}</span><span class="fd-tap">${t("Нажмите на папку бренда: товары выпадут. Нажмите ещё раз: описание, каталог PDF и прайс.", "Brend papkasini bosing: mahsulotlar tushib ketadi. Yana bosing: tavsif, PDF katalog va narxlar.", "Tap a brand folder and the products fall out. Tap again for the description, PDF catalog and price list.")}</span></p></div>
<div class="br-tools">
<div class="chips" role="group" aria-label="${t("Категория", "Toifa", "Category")}"><button type="button" class="chip" data-c="all" aria-pressed="true">${t("Все", "Hammasi", "All")}</button><button type="button" class="chip" data-c="cosmetics" aria-pressed="false">${t("Косметика и уход", "Kosmetika va parvarish", "Cosmetics and care")}</button><button type="button" class="chip" data-c="home" aria-pressed="false">${t("Бытовая химия", "Maishiy kimyo", "Household care")}</button></div>
<label class="find">${ICON.search}<span class="vh">${t("Найти бренд", "Brendni topish", "Find a brand")}</span><input id="br-q" type="search" placeholder="${t("Найти бренд", "Brendni topish", "Find a brand")}" autocomplete="off"></label>
</div>
<ul class="br-grid fd-grid">${BRANDS.map((b, i) => `<li class="gf-cell" data-cat="${b.cat.join(" ")}" data-q="${esc((l === "ru" ? [b.name, b.latin ?? "", b.id] : [b.latin ?? b.name, b.id]).join(" ").toLowerCase())}">${folder(b, i, l, t)}</li>`).join("")}</ul>
<p class="br-empty" hidden>${t("Такого бренда нет в портфеле. Напишите нам, что ищете.", "Bunday brend portfelda yo‘q. Nima izlayotganingizni yozing.", "This brand is not in the portfolio. Tell us what you are looking for.")}</p>
</div>
<div class="dlg" id="br-dlg" hidden role="dialog" aria-modal="true" aria-labelledby="br-h"><div class="dlg-b">
<button type="button" class="dlg-x" aria-label="${t("Закрыть", "Yopish", "Close")}">${ICON.close}</button>
<img class="dlg-ph" src="${IMG}/br/${BRANDS[0].id}-1400.webp" alt="" width="1400" height="845">
<p class="or"></p><h3 id="br-h"></h3><p class="ds"></p>
<div class="row"><a class="btn btn-d" data-pdf href="${esc(BRANDS[0].pdf)}" target="_blank" rel="noopener">${ICON.doc}${t("Каталог PDF", "PDF katalog", "PDF catalog")}</a><a class="btn btn-o" data-price href="${wa("")}" target="_blank" rel="noopener">${ICON.wa}${t("Запросить прайс", "Narxlarni so‘rash", "Request price list")}</a></div>
</div></div>
</section>`;
}

function sklad(l, t) {
  const steps = [
    [t("Заявка", "Ariza", "Request"), t("Вы пишете менеджеру: какие бренды и куда. Каталоги брендов есть на сайте.", "Menejerga yozasiz: qaysi brendlar va qayerga. Brend kataloglari saytda bor.", "You message a manager: which brands and where. Brand catalogs are on the site."), ""],
    [t("Склад", "Ombor", "Warehouse"), t("Собственный автоматизированный склад, 3 000 паллетомест.", "O‘z avtomatlashtirilgan omborimiz, 3 000 palleta o‘rni.", "Our own automated warehouse, 3,000 pallet spaces."), NUMBERS[4][l === "ru" ? "v" : l === "uz" ? "vuz" : "ven"]],
    [t("Доставка", "Yetkazib berish", "Delivery"), t("По всей территории Узбекистана: все 14 регионов.", "O‘zbekistonning butun hududi bo‘ylab: barcha 14 hudud.", "Across all of Uzbekistan: every one of the 14 regions."), "14"],
  ];
  return `<section class="sec wh" id="sklad"><div class="wh-bg" aria-hidden="true"><img src="${IMG}/wh-1600.webp" alt="" loading="lazy" width="1600" height="893"></div><div class="wrap">
<div class="sec-h mv mv-up"><p class="kick">${t("Склад и доставка", "Ombor va yetkazib berish", "Warehouse and delivery")}</p><h2 class="h2">${t("Путь заказа: <b>от заявки до полки</b>", "Buyurtma yo‘li: <b>arizadan javongacha</b>", "Order path: <b>from request to shelf</b>")}</h2><p class="lead">${t("Офис 500 м² в Ташкенте, свой склад и команда 150+ человек.", "Toshkentda 500 m² ofis, o‘z omborimiz va 150+ kishilik jamoa.", "A 500 m² office in Tashkent, our own warehouse and a team of 150+.")}</p></div>
<ol class="path"><span class="pulse" aria-hidden="true"><i></i></span>${steps.map(([h, p, n], i) => `<li class="mv mv-up" style="transition-delay:${i * 120}ms"><h3>${h}</h3><p>${p}</p>${n ? `<span class="n">${n}</span>` : ""}</li>`).join("")}</ol>
</div></section>`;
}

function cover(l, t) {
  const [tx, ty] = MAP.tashkent;
  const arc = ([x, y]) => {
    const mx = (x + tx) / 2, my = (y + ty) / 2, dd = Math.hypot(x - tx, y - ty);
    return `M${tx} ${ty} Q${mx.toFixed(1)} ${(my - dd * 0.35 - 12).toFixed(1)} ${x} ${y}`;
  };
  const arcs = MAP.regions.map((r, i) => (i === 13 ? "" : `<path class="arc" d="${arc(r.c)}"/>`)).join("") + `<path class="arc kg" d="${arc(MAP.bishkek)}"/>`;
  return `<section class="sec" id="cover"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kick">${t("Территориальное покрытие", "Hududiy qamrov", "Coverage")}</p><h2 class="h2">${t("Работаем <b>по всей территории</b> Узбекистана", "O‘zbekistonning <b>butun hududida</b> ishlaymiz", "We operate <b>all over</b> Uzbekistan")}</h2><p class="lead">${t("Нажмите на регион: напишем о поставках именно туда.", "Hududni bosing: aynan u yerga yetkazib berish haqida yozamiz.", "Tap a region and ask about supply there.")}</p></div>
<div class="cov">
<div class="map ice mv mv-zoom"><svg viewBox="0 0 ${MAP.w} ${MAP.h}" role="group" aria-label="${t("Карта регионов Узбекистана", "O‘zbekiston hududlari xaritasi", "Map of the regions of Uzbekistan")}">
${MAP.regions.map((r, i) => `<g class="rg-g" tabindex="0" role="button" aria-label="${esc(regionName(REGIONS[i], i, l))}"><path class="rg" d="${r.d}"/><path class="rg-l" d="${r.d}"/></g>`).join("")}
<g aria-hidden="true">${arcs}</g>
<g aria-hidden="true">${MAP.regions.map((r, i) => (i === 13 ? "" : `<circle class="dot" r="3" style="opacity:0"/>`)).join("")}<circle class="dot" r="3" style="opacity:0"/></g>
<g class="kgp" aria-hidden="true" transform="translate(${MAP.bishkek.join(" ")})"><circle r="6"/><text x="0" y="-14" text-anchor="middle">${t("Бишкек", "Bishkek", "Bishkek")}</text></g>
<g class="hub" aria-hidden="true" transform="translate(${tx} ${ty})"><circle r="6"/><circle class="rip" r="8"/><text x="-12" y="-14" text-anchor="end">${t("Ташкент", "Toshkent", "Tashkent")}</text></g>
</svg></div>
<div>
<div class="cov-card ice mv mv-ice" aria-live="polite"><p class="no"></p><h3></h3><p>${t("Поставки Cosmo World в этот регион: напишите, и менеджер ответит по условиям.", "Cosmo World’ning ushbu hududga yetkazib berishi: yozing, menejer shartlar bo‘yicha javob beradi.", "Cosmo World supply to this region: message us and a manager will reply with the terms.")}</p><a class="btn btn-d" href="${wa("")}" target="_blank" rel="noopener">${ICON.wa}${t("Написать о поставках", "Yetkazib berish haqida yozish", "Ask about supply")}</a></div>
<div class="cov-nums"><div><b>14</b><span>${t("регионов", "hudud", "regions")}</span></div><div><b data-n="150" data-s="+">150+</b><span>${t("сотрудников", "xodim", "employees")}</span></div></div>
<ul class="rg-list">${REGIONS.map((r, i) => `<li><button type="button" aria-pressed="false">${esc(r[LI[l]])}</button></li>`).join("")}</ul>
</div></div>
</div></section>`;
}

/* Лента фактов: едет сама, прокрутка разгоняет и разворачивает её
   (Scroll Velocity, 21st.dev). */
function velo(l, t) {
  const f = [t("10 лет на рынке", "Bozorda 10 yil", "10 years on the market"), t("10+ стран-партнёров", "10+ hamkor davlat", "10+ partner countries"), t("склад 2 000 м²", "2 000 m² ombor", "2,000 m² warehouse"), t("3 000 паллетомест", "3 000 palleta o‘rni", "3,000 pallet spaces"), t("14 регионов", "14 hudud", "14 regions"), t("150+ сотрудников", "150+ xodim", "150+ employees"), t("10 брендов", "10 ta brend", "10 brands")];
  const row = f.map((x) => `<span>${x}</span><i aria-hidden="true">✦</i>`).join("");
  return `<div class="velo" aria-label="${esc(f.join(", "))}"><div class="velo-t" aria-hidden="true">${row}${row}${row}</div></div>`;
}

function where(l, t) {
  return `<section class="sec" id="where" style="padding-top:24px"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kick">${t("Где купить", "Qayerdan sotib olish", "Where to buy")}</p><h2 class="h2">${t("Продукция наших партнёров доступна <b>в популярных торговых точках</b>", "Hamkorlarimiz mahsulotlari <b>mashhur savdo nuqtalarida</b>", "Our partners’ products are available <b>in popular retail chains</b>")}</h2></div>
<ul class="vh">${STORES.map((s) => `<li>${esc(l !== "ru" && s === "Магнит Косметик" ? "Magnit Kosmetik" : s)}</li>`).join("")}</ul>
</div>
${[0, 1].map((r) => { const names = (r ? [...STORES].reverse() : STORES).map((s) => esc(l !== "ru" && s === "Магнит Косметик" ? "Magnit Kosmetik" : s)); const row = names.map((x) => `<span class="ice">${x}</span>`).join(""); return `<div class="mq${r ? " rev" : ""}" aria-hidden="true"><div class="mq-t">${row}${row}${row}</div></div>`; }).join("")}
<div class="wrap">
</div></section>`;
}

function partner(l, t) {
  const kinds = [["shop", t("Открыть точку", "Do‘kon ochish", "Open a store")], ["chain", t("Торговая сеть", "Savdo tarmog‘i", "Retail chain")], ["maker", t("Производитель", "Ishlab chiqaruvchi", "Manufacturer")]];
  const F = (k, name, label, input) => `<label data-for="${k}"><span>${label}</span>${input}</label>`;
  const inp = (name, type = "text", ac = "") => `<input name="${name}" type="${type}"${ac ? ` autocomplete="${ac}"` : ""}>`;
  const types = [t("Магазин у дома", "Uy yonidagi do‘kon", "Convenience store"), t("Косметика и бытовая химия", "Kosmetika va maishiy kimyo", "Cosmetics and household care"), t("Аптека", "Dorixona", "Pharmacy"), t("Онлайн-магазин", "Onlayn do‘kon", "Online store"), t("Другое", "Boshqa", "Other")];
  return `<section class="sec" id="partner"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kick">${t("Сотрудничество", "Hamkorlik", "Partnership")}</p><h2 class="h2">${t("Работаем с <b>магазинами, сетями</b> и производителями", "<b>Do‘konlar, tarmoqlar</b> va ishlab chiqaruvchilar bilan ishlaymiz", "We work with <b>stores, chains</b> and manufacturers")}</h2></div>
<div class="pt">
<div class="mv mv-up">
<div class="tabs" role="tablist" aria-label="${t("Кто вы", "Siz kimsiz", "Who you are")}">${kinds.map(([k, n], i) => `<button type="button" role="tab" data-k="${k}" aria-selected="${i === 0}" aria-controls="pt-form">${n}</button>`).join("")}</div>
<form class="form ice" id="pt-form" novalidate>
${F("shop chain maker", "name", t("Имя", "Ism", "Name"), inp("name", "text", "name"))}
${F("shop chain maker", "phone", t("Телефон", "Telefon", "Phone"), inp("phone", "tel", "tel"))}
${F("chain maker", "company", t("Компания", "Kompaniya", "Company"), inp("company", "text", "organization"))}
${F("shop chain", "city", t("Город или район", "Shahar yoki tuman", "City or district"), inp("city", "text", "address-level2"))}
${F("shop", "type", t("Формат точки", "Nuqta formati", "Store format"), `<select name="type">${types.map((x) => `<option>${x}</option>`).join("")}</select>`)}
${F("chain", "count", t("Сколько точек", "Nechta nuqta", "Number of stores"), inp("count", "number"))}
${F("shop chain", "brands", t("Какие бренды интересны", "Qaysi brendlar qiziq", "Brands of interest"), inp("brands"))}
${F("maker", "goods", t("Что производите и откуда", "Nima ishlab chiqarasiz va qayerdan", "What you make and where"), inp("goods"))}
${F("shop chain maker", "note", t("Комментарий", "Izoh", "Comment"), `<textarea name="note" rows="3"></textarea>`)}
<p class="note">${t("Заявка уйдёт готовым текстом в WhatsApp Cosmo World. В Telegram: текст скопируется, вставьте его в чат.", "Ariza tayyor matn ko‘rinishida Cosmo World WhatsApp’iga ketadi. Telegram’da: matn nusxalanadi, uni chatga qo‘ying.", "The request goes to Cosmo World’s WhatsApp as ready text. For Telegram, the text is copied: paste it into the chat.")}</p>
<div class="row"><button type="submit" class="btn btn-a">${ICON.wa}${t("Отправить в WhatsApp", "WhatsApp’ga yuborish", "Send via WhatsApp")}</button><a class="btn btn-o" data-tgform href="${COMPANY.telegram}" target="_blank" rel="noopener">${ICON.tg}Telegram</a></div>
</form>
</div>
<div class="pt-side mv mv-left"><h3>${t("Почему с нами удобно", "Biz bilan nima uchun qulay", "Why it works with us")}</h3><ul>
<li>${ICON.stack}<span>${t("10 брендов у одного поставщика: косметика, уход и бытовая химия", "Bitta yetkazib beruvchida 10 ta brend: kosmetika, parvarish va maishiy kimyo", "10 brands from one supplier: cosmetics, care and household products")}</span></li>
<li>${ICON.box}<span>${t("Свой склад 2 000 м² и 3 000 паллетомест", "2 000 m² o‘z omborimiz va 3 000 palleta o‘rni", "Our own 2,000 m² warehouse and 3,000 pallet spaces")}</span></li>
<li>${ICON.map}<span>${t("Поставки во все 14 регионов страны", "Mamlakatning barcha 14 hududiga yetkazib berish", "Supply to all 14 regions of the country")}</span></li>
<li>${ICON.people}<span>${t("Команда 150+ человек, 10 лет на рынке", "150+ kishilik jamoa, bozorda 10 yil", "A team of 150+, 10 years on the market")}</span></li>
</ul></div>
</div></div></section>`;
}

function team(l, t) {
  const i3 = LI[l];
  return `<section class="sec" id="team" style="padding-top:24px"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kick">${t("Команда", "Jamoa", "Team")}</p><h2 class="h2">${t("Лучшие <b>специалисты</b>", "Eng yaxshi <b>mutaxassislar</b>", "Top <b>professionals</b>")}</h2><p class="lead">${t("Cosmo World создали люди с многолетним опытом в дистрибуции.", "Cosmo World’ni distribyutsiyada ko‘p yillik tajribaga ega odamlar yaratgan.", "Cosmo World was founded by people with years of experience in distribution.")}</p></div>
<ul class="team">${TEAM.map((p, i) => {
    const nm = p.name[i3], ini = nm.split(" ").slice(0, 2).map((w) => w[0]).reverse().join("");
    return `<li class="ice mv mv-ice" style="transition-delay:${i * 60}ms"><span class="ini" aria-hidden="true">${esc(ini)}</span><div><h3>${esc(nm)}</h3><p class="rl">${esc(p.role[i3])}</p></div><q>${esc(p.quote[i3])}</q>${p.facts.length ? `<div class="fx">${p.facts.map((f) => `<span><b>${f[0]}</b>${esc(f[i3 + 1])}</span>`).join("")}</div>` : ""}</li>`;
  }).join("")}</ul>
</div></section>`;
}

function duo(l, t) {
  return `<section class="sec" style="padding-top:24px"><div class="wrap duo">
<div class="ice mv mv-ice"><p class="kick">${t("Филиал", "Filial", "Branch")}</p><h3>${t("Cosmo в Кыргызстане", "Qirg‘izistondagi Cosmo", "Cosmo in Kyrgyzstan")}</h3><p>${t("Те же бренды, плюс Dr. Heal. Свой офис и автоматизированный склад.", "Xuddi shu brendlar, qo‘shimcha Dr. Heal. O‘z ofisi va avtomatlashtirilgan ombori.", "The same brands, plus Dr. Heal. Its own office and automated warehouse.")}</p>
<div class="fx"><span><b>${l === "ru" ? "200 м²" : "200 m²"}</b>${t("офис", "ofis", "office")}</span><span><b>${l === "en" ? "1,500" : "1 500"}</b>${t("паллетомест", "palleta o‘rni", "pallet spaces")}</span><span><b>${l === "en" ? "1,500 m²" : l === "uz" ? "1 500 m²" : "1 500 м²"}</b>${t("склад", "ombor", "warehouse")}</span></div>
<a class="btn btn-o" href="${KG.site}" target="_blank" rel="noopener">cosmo.kg${ICON.arrow}</a></div>
<div class="ice mv mv-ice"><p class="kick">${t("Вакансии", "Vakansiyalar", "Careers")}</p><h3>${t("В команде 150+ человек", "Jamoada 150+ kishi", "150+ people on the team")}</h3><p>${t("Напишите, кем хотите работать: подбором занимается HRD Анастасия Олифиренко.", "Kim bo‘lib ishlamoqchi ekaningizni yozing: xodimlarni HRD Anastasiya Olifirenko tanlaydi.", "Tell us what role you want: hiring is led by HRD Anastasia Olifirenko.")}</p>
<a class="btn btn-d" href="${wa(t("Здравствуйте! Хочу работать в Cosmo World.", "Assalomu alaykum! Cosmo World’da ishlamoqchiman.", "Hello! I would like to work at Cosmo World."))}" target="_blank" rel="noopener">${ICON.wa}${t("Хочу в команду", "Jamoaga qo‘shilmoqchiman", "Join the team")}</a></div>
</div></section>`;
}

function footer(l, t) {
  return `<footer class="ft" id="contacts"><div class="wrap ft-g">
<div><a class="logo" href="${href(l)}" aria-label="Cosmo World">${LOGO}</a><p>«${esc(COMPANY.slogan[l])}»</p>
<div class="soc"><a href="${COMPANY.telegram}" target="_blank" rel="noopener" aria-label="Telegram">${ICON.tg}</a><a href="${wa("")}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICON.wa}</a><a href="${COMPANY.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${ICON.ig}</a></div></div>
<div><p class="kick">${t("Телефон и почта", "Telefon va pochta", "Phone and email")}</p><p><a class="big" href="${COMPANY.phoneHref}">${COMPANY.phone}</a></p><p><a class="big" href="mailto:${COMPANY.email}">${COMPANY.email}</a></p></div>
<div><p class="kick">${t("Юридический адрес", "Yuridik manzil", "Legal address")}</p><p>${esc(COMPANY.address[l])}</p><p>${t("Импортёр в Республике Узбекистан", "O‘zbekiston Respublikasidagi import qiluvchi", "Importer in the Republic of Uzbekistan")} ${esc(COMPANY.legal)}</p></div>
</div><div class="wrap"><small>${t("Макет сайта DevUz Studio. Цифры и тексты с cosmoworld.uz и cosmo.kg.", "DevUz Studio sayt maketi. Raqamlar va matnlar cosmoworld.uz va cosmo.kg saytlaridan.", "Website mockup by DevUz Studio. Figures and copy from cosmoworld.uz and cosmo.kg.")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("Условия макета", "Maket shartlari", "Mockup terms")}</a></small></div></footer>`;
}

function data(l, t) {
  return {
    base: BASE_URL,
    img: IMG,
    wa: WA,
    sep: l === "en" ? "," : "\u00a0",
    scene: { d: SEQ.d, p: SEQ.p, pack: SEQ.pack },
    brands: BRANDS.map((b) => ({
      name: brandName(b, l),
      origin: ORIGIN[b.origin][LI[l]],
      text: b[l],
      pdf: b.pdf,
      img: `${IMG}/br/${b.id}-1400.webp`,
      ask: t(`Здравствуйте! Пришлите, пожалуйста, прайс на ${b.name}.`, `Assalomu alaykum! Iltimos, ${brandName(b, l)} narxlar ro‘yxatini yuboring.`, `Hello! Please send the price list for ${brandName(b, l)}.`),
    })),
    regions: REGIONS.map((r, i) => ({
      name: regionName(r, i, l),
      ask: t(`Здравствуйте! Интересуют поставки Cosmo World: ${regionName(r, i, l)}.`, `Assalomu alaykum! Cosmo World yetkazib berishi qiziqtiradi: ${regionName(r, i, l)}.`, `Hello! I am interested in Cosmo World supply to ${regionName(r, i, l)}.`),
    })),
    t: {
      copied: t("Текст заявки скопирован: вставьте его в чат", "Ariza matni nusxalandi: uni chatga qo‘ying", "Request text copied: paste it into the chat"),
      needName: t("Напишите, как к вам обращаться", "Ismingizni yozing", "Please enter your name"),
      needPhone: t("Оставьте телефон для связи", "Aloqa uchun telefon qoldiring", "Please leave a phone number"),
      hello: t("Здравствуйте! Заявка на сотрудничество с Cosmo World.", "Assalomu alaykum! Cosmo World bilan hamkorlik uchun ariza.", "Hello! A partnership request for Cosmo World."),
      kinds: { shop: t("Хочу открыть точку с вашими брендами.", "Brendlaringiz bilan savdo nuqtasi ochmoqchiman.", "I want to open a store with your brands."), chain: t("Мы торговая сеть.", "Biz savdo tarmog‘imiz.", "We are a retail chain."), maker: t("Мы производитель, ищем дистрибьютора.", "Biz ishlab chiqaruvchimiz, distribyutor izlayapmiz.", "We are a manufacturer looking for a distributor.") },
    },
  };
}

function page(l) {
  const t = T(l);
  return `${head(l, t)}
<body>
${dzIntroSolo(l)}
<a class="vh" href="#about">${t("К содержанию", "Mazmunga o‘tish", "Skip to content")}</a>
${header(l, t)}
<main>
${scene(l, t)}
${about(l, t)}
${velo(l, t)}
${sklad(l, t)}
${cover(l, t)}
${where(l, t)}
${partner(l, t)}
${team(l, t)}
${duo(l, t)}
</main>
${footer(l, t)}
<div class="dock"><a class="btn btn-a" href="#partner">${t("Стать партнёром", "Hamkor bo‘lish", "Become a partner")}${ICON.arrow}</a></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="cw-data">${JSON.stringify(data(l, t)).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}

const out = {};
for (const l of LANGS) out[KEY[l]] = page(l);
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/* Сборка для сервера (lib/proto/bundles): стили, скрипт и логотип один
   раз, в страницах вместо них метка @@имя@@. */
const parts = { J: `<script>\n${JS}</script>`, L: LOGO };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const [name, part] of Object.entries(parts)) p = p.split(part).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "cosmoworld.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(6), v.length);
