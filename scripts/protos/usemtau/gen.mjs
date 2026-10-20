import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as D from "./data.mjs";
import { BASE, ADDONS, ALL, OFFER_HOURS } from "./plan.mjs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";

/*
 * Макет сайта Юсем Тау (usemtau.kz): металлобаза в Алматы и стройка, ru.
 * Вторая редакция, 20.10.2026: владелец DevUz — «найди топовые решения на
 * awwwards… с построением здания при скролле хорошо, остальное как
 * первоклассник». Подача — инженерная документация, по разбору призёров
 * Awwwards (Enerblock, Terminal Industries, Modelec, Ferro, Q Industrial;
 * docs/research/usemtau.md): бумага и тушь, поле их синего, тонкая сетка,
 * подписи чертежа моноширинным, крупный текст обычным весом, кадры склада и
 * проката из Blender (scripts/blender/usemtau), сцена сборки из первой
 * редакции.
 *
 *  - главная (`""`): видео DevUz; кадр склада во весь экран; поиск по
 *    каталогу; поле «одна компания»; каталог индексом со снимками проката;
 *    калькулятор; заявка и счёт; доставка; сцена «склад из вашего каталога»;
 *    объекты; гофробалки; сэндвич-панели; ангар листом чертежа; сейчас и
 *    станет; соседи и лучшие; склад и контакты; стоимость;
 *  - каталог (`katalog`): все 268 позиций таблицей, фильтры, заявка.
 * Позиции, цены за тонну, адрес, телефоны, часы, услуги — с их сайта
 * (data.mjs); кадры — визуализация, тарифы доставки и пример здания — демо,
 * так и подписано.
 *
 * Стили и скрипты общие, в странице вместо них @@S@@, @@J@@, @@B@@. Ссылки —
 * через __PROTO_BASE__, отпечаток ставится при показе зерном из protos.stamp
 * (lib/proto/bundles). Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/usemtau";
const BASEP = "__PROTO_BASE__";
const B = D.BRAND;
const TERMS = "https://devuz.studio/ru/mockup-terms";
const FONTS = "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;700&family=JetBrains+Mono&display=swap";
const read = (f) => readFileSync(DIR + f, "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => grp(n) + " $";
const tg = (n) => grp(n) + " ₸";
const href = (path = "") => BASEP + (path ? "/" + path : "");
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const WA = (text) => `https://wa.me/${B.wa}?text=${encodeURIComponent(text)}`;
const pad = (n) => String(n).padStart(2, "0");
function plural(n, a, b, c) { const m = n % 100, k = n % 10; return m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c; }

/* ── Иконки: тонкий контур 24×24 ──────────────────────────────────────── */
const S = 'fill="none" stroke-width="1.25" stroke-linecap="square" stroke-linejoin="miter"';
const I = {
  arrow: `<path d="M4 12h15M13 6l6 6-6 6" ${S}/>`,
  ne: `<path d="M7 17 17 7M9 7h8v8" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  plus: `<path d="M12 5v14M5 12h14" ${S}/>`,
  minus: `<path d="M5 12h14" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" ${S}/>`,
  search: `<circle cx="11" cy="11" r="6.5" ${S}/><path d="m16 16 4 4" ${S}/>`,
  repeat: `<path d="M4 12a7 7 0 0 1 12-5l2 2M20 12a7 7 0 0 1-12 5l-2-2" ${S}/><path d="M18 4v5h-5M6 20v-5h5" ${S}/>`,
};
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
  .join("")}${Object.entries(SEC)
  .map(([k, v]) => `<symbol id="s-${k}" viewBox="0 0 64 64">${v}</symbol>`)
  .join("")}</defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;

/* ── Сечения проката: чертёж тушью, 64×64, со штрихом размера. ────────── */
const L = 'fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="miter"';
const H = 'fill="none" stroke="currentColor" stroke-width=".6" stroke-dasharray="2 2"';
const SEC = {
  rebar: `<circle cx="32" cy="32" r="15" ${L}/><circle cx="32" cy="32" r="18" ${H}/><path d="M17 32h30M32 17v30" ${H}/>`,
  rhs: `<rect x="14" y="18" width="36" height="28" ${L}/><rect x="18" y="22" width="28" height="20" ${L}/><path d="M14 52h36M14 50v4M50 50v4" ${H}/>`,
  pipe: `<circle cx="32" cy="32" r="17" ${L}/><circle cx="32" cy="32" r="13" ${L}/><path d="M15 32h34" ${H}/>`,
  plate: `<rect x="6" y="29" width="52" height="6" ${L}/><path d="M6 42h52M6 40v4M58 40v4" ${H}/>`,
  angle: `<path d="M16 12h6v30h30v6H16z" ${L}/><path d="M10 12v36M8 12h4M8 48h4" ${H}/>`,
  channel: `<path d="M20 10h24v6H26v32h18v6H20z" ${L}/><path d="M14 10v44M12 10h4M12 54h4" ${H}/>`,
  ibeam: `<path d="M14 10h36v6H35v32h15v6H14v-6h15V16H14z" ${L}/><path d="M8 10v44M6 10h4M6 54h4" ${H}/>`,
  round: `<circle cx="32" cy="32" r="16" ${L}/><path d="M16 32h32" ${H}/>`,
  square: `<rect x="16" y="16" width="32" height="32" ${L}/><path d="M16 54h32M16 52v4M48 52v4" ${H}/>`,
  flat: `<rect x="8" y="27" width="48" height="10" ${L}/><path d="M8 44h48M8 42v4M56 42v4" ${H}/>`,
  coil: `<circle cx="32" cy="32" r="19" ${L}/><circle cx="32" cy="32" r="14" ${L}/><circle cx="32" cy="32" r="9" ${L}/>`,
  wire: `<circle cx="32" cy="32" r="18" ${L}/><circle cx="32" cy="32" r="15" ${L}/><circle cx="32" cy="32" r="12" ${L}/><circle cx="32" cy="32" r="9" ${L}/>`,
  mesh: `<path d="M12 18h40M12 32h40M12 46h40M18 12v40M32 12v40M46 12v40" ${L}/>`,
  deck: `<path d="M4 40h8l5-14h10l5 14h8l5-14h10l5 14" ${L}/>`,
  pvl: `<path d="M8 32l8-10 8 10-8 10zM24 32l8-10 8 10-8 10zM40 32l8-10 8 10-8 10z" ${L}/>`,
  tread: `<rect x="6" y="33" width="52" height="6" ${L}/><path d="M11 31l4-4M21 27l4 4M31 31l4-4M41 27l4 4M51 31l4-4" ${L}/>`,
  rod: `<rect x="6" y="29" width="40" height="6" ${L}/><path d="M46 32h12" ${L}/>`,
};
const sec = (k, c = "") => `<svg class="sec${c ? " " + c : ""}" viewBox="0 0 64 64" aria-hidden="true"><use href="#s-${k}"/></svg>`;

/* Снимки проката из Blender: вид → файл. */
const RENDER = { armatura: "armatura", balka: "balka", truba: "truba", "truba-profil": "profil", shveller: "shveller", ugolok: "ugolok", list: "list", krug: "krug" };
const shot = (cat, size = 480) => (RENDER[cat] ? `${IMG}/p-${RENDER[cat]}-${size}.webp` : null);

/* ── Данные для скриптов ────────────────────────────────────────────── */
const ITEMS = D.ITEMS.map((x) => [x.id, x.n, x.c, x.p, x.kgm, x.kgm2, x.dims, x.mark, x.bar, x.gost]);
const CATMAP = Object.fromEntries(D.CATS.map((c) => [c.id, c]));

/* Пример здания для сцены: склад 18 × 36 × 7 м, шаг рам 6 м. Металл — их
   позиции и цены за тонну, длины считаем по геометрии. */
const find = (re) => D.ITEMS.find((x) => re.test(x.n));
const BLD = (() => {
  const W = 18, L = 36, H = 7, RISE = 1.5, BAY = 6, NF = L / BAY + 1, slope = Math.hypot(W / 2, RISE);
  const rows = [
    { step: 0, it: find(/^Арматура 12$/), m: NF * 2 * 42, what: "закладные и каркасы фундаментов" },
    { step: 1, it: find(/^Балка 30 ?Ш1$/), m: NF * 2 * H, what: `колонны, ${NF * 2} шт по ${H} м` },
    { step: 2, gofro: true, m: Math.round(NF * 2 * slope), what: `${NF} рам, пролёт ${W} м` },
    { step: 3, it: find(/^Швеллер гнутый 140×60×4$/), m: Math.round(2 * Math.ceil(slope / 1.5) * L), what: "прогоны кровли через 1,5 м" },
    { step: 3, it: find(/^Труба профильная 80×80×3$/), m: 2 * 3 * L + 2 * 3 * W, what: "ригели стен в три ряда" },
    { step: 3, it: find(/^Уголок 63×5$/), m: Math.round(4 * 2 * Math.hypot(BAY, H)), what: "связи в крайних пролётах" },
  ].map((r) => {
    const t = r.it ? (r.m * r.it.kgm) / 1000 : null;
    return { step: r.step, n: r.it ? r.it.n : "Гофробалка, своё производство", m: r.m, t: t && Math.round(t * 100) / 100, sum: t ? Math.round((t * r.it.p) / 1000) * 1000 : null, what: r.what, id: r.it?.id ?? null };
  });
  const walls = 2 * L * H + 2 * (W * H + (W * RISE) / 2);
  const roof = 2 * slope * L;
  return { W, L, H, RISE, BAY, rows, walls: Math.round(walls), roof: Math.round(roof) };
})();
for (const r of BLD.rows) if (!r.n) throw new Error("нет позиции для сцены");

function siteData() {
  return {
    items: ITEMS, cats: D.CATS.map((c) => ({ id: c.id, n: c.n, sec: c.sec, shot: shot(c.id) })), brand: { phone: B.phone, phoneRaw: B.phoneRaw, wa: B.wa, mail: B.mail, name: B.name },
    cities: D.CITIES, trucks: D.TRUCKS, tariff: D.TARIFF, free: 10, bld: BLD, img: IMG, katalog: href("katalog"),
    offer: { items: ADDONS.map((a) => ({ id: a.id, t: a.t, p: a.price })), base: BASE.promo, baseName: BASE.t, hours: OFFER_HOURS },
  };
}

/* ── Шапка документа ────────────────────────────────────────────────── */
const LD = {
  "@context": "https://schema.org", "@type": "Store", name: "Юсем Тау (Usemtau)", url: "https://usemtau.kz/", telephone: [B.phoneRaw, "+" + B.wa], email: B.mail,
  image: "https://usemtau.kz/wp-content/uploads/2023/07/cropped-icon.png",
  address: { "@type": "PostalAddress", streetAddress: "Бурундайское шоссе 1 км, дом 1В", addressLocality: "Алматы", addressCountry: "KZ" },
  geo: { "@type": "GeoCoordinates", latitude: B.geo.lat, longitude: B.geo.lng },
  openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "19:00" }],
  areaServed: "Казахстан", priceRange: "₸₸",
};
function headTags(title, desc) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#EBE9E4">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script type="application/ld+json">${json(LD)}</script>`;
}
const logo = () => `<span class="lg"><img src="${IMG}/mark.webp" alt="" width="28" height="28"><b>ЮСЕМ ТАУ</b></span>`;
const btn = (label, hrefv, cls = "", icon = "arrow", attrs = "") => `<a class="bt${cls ? " " + cls : ""}" href="${hrefv}"${attrs}><span>${label}</span><i>${ic(icon)}</i></a>`;
const bbt = (label, cls = "", icon = "arrow", attrs = "") => `<button type="button" class="bt${cls ? " " + cls : ""}"${attrs}><span>${label}</span><i>${ic(icon)}</i></button>`;
/* Заголовок секции: номер листа, подпись, заголовок построчно. */
const head = (n, label, h, lead = "", dark = false) => `<header class="sh${dark ? " sh-d" : ""}"><p class="mono sh-n"><span>${pad(n)}</span><span>${label}</span></p><h2 class="ln">${h.split("|").map((x) => `<span class="m"><span>${x}</span></span>`).join("")}</h2>${lead ? `<p class="sh-l rv">${lead}</p>` : ""}</header>`;

function header(page) {
  const k = page === "katalog";
  const nav = [[k ? href("katalog") : "#katalog", "Каталог"], ["#kalk", "Калькулятор"], ["#dostavka", "Доставка"], ["#stroyka", "Стройка"], ["#angar", "Ангар"], ["#cena", "Стоимость"]];
  return `<p class="demo-strip mono">Макет DevUz Studio · позиции и цены с usemtau.kz на 20.10.2026 · <a href="${href()}#cena">стоимость</a></p>
<header class="top" id="top"><div class="top-in">
<a class="logo" href="${href()}" aria-label="${B.name}, главная">${logo()}</a>
<nav class="nav mono" aria-label="Разделы">${nav.map(([u, n], i) => `<a href="${k && i ? href() + u : u}"${k && !i ? ' aria-current="page"' : ""}>${n}</a>`).join("")}</nav>
<a class="tel mono" href="tel:${B.phoneRaw}">${B.phone}</a>
<a class="tb tb-wa" href="${WA("Здравствуйте! Пишу с сайта usemtau.kz")}">WhatsApp</a>
<button type="button" class="tb tb-ink" data-cart>Заявка <b class="bdg" data-badge>0</b></button>
</div></header>`;
}

/* ── Главная ───────────────────────────────────────────────────────── */
function heroBlock() {
  return `<section class="hero" id="hero" data-tone="night">
<picture class="hero-ph" aria-hidden="true"><source media="(orientation: portrait)" srcset="${IMG}/sklad-v-720.webp 720w, ${IMG}/sklad-v-1080.webp 1080w" sizes="100vw"><img src="${IMG}/sklad-h-1920.webp" srcset="${IMG}/sklad-h-1280.webp 1280w, ${IMG}/sklad-h-1920.webp 1920w" sizes="100vw" alt="" width="1920" height="1080" fetchpriority="high"></picture>
<div class="hero-ui">
<p class="mono hero-geo"><span>43.3378° N</span><span>76.9064° E</span><span>Алматы, Бурундайское шоссе 1 км</span></p>
<span class="cross c1" aria-hidden="true"></span><span class="cross c2" aria-hidden="true"></span><span class="cross c3" aria-hidden="true"></span><span class="cross c4" aria-hidden="true"></span>
<div class="hero-b">
<h1 class="ln"><span class="m"><span>Металлопрокат</span></span><span class="m"><span>со склада в Алматы</span></span></h1>
<div class="hero-r"><p class="mono hero-type" id="hero-type" data-text="${D.ITEMS.length} позиций · цена за тонну · доставка по Казахстану · стройка из своего металла">${D.ITEMS.length} позиций · цена за тонну · доставка по Казахстану · стройка из своего металла</p>
<div class="hero-cta">${btn("Позвонить", `tel:${B.phoneRaw}`, "bt-paper", "ne")}${btn("WhatsApp", WA("Здравствуйте! Нужен металл, подскажите по наличию."), "bt-line", "ne")}</div></div>
</div>
<p class="mono hero-cap">Визуализация · фото вашего склада встанет сюда</p>
</div></section>`;
}

function findBlock() {
  const chips = ["арматура 12", "труба 40×20", "швеллер 16", "лист 3 мм", "уголок 50", "балка 20Б1"];
  return `<section class="find-s" id="poisk"><div class="g12">
<p class="mono c3 find-l"><span>01 / Поиск по каталогу</span><span class="dim">${D.ITEMS.length} позиций · ${D.CATS.length} разделов</span></p>
<form class="find c9" id="find" role="search" action="${href("katalog")}">
<label class="sr" for="q">Поиск по каталогу</label>
<div class="find-f"><input id="q" name="q" type="search" autocomplete="off" enterkeyhint="search" placeholder="Арматура 12, труба 40×20" aria-controls="find-res"><button type="submit" class="find-go" aria-label="Найти">${ic("arrow")}</button></div>
<p class="chips mono">${chips.map((c) => `<button type="button" data-q="${esc(c)}">${c}</button>`).join("")}</p>
<div class="find-res" id="find-res" role="listbox" aria-label="Найдено" hidden></div>
</form></div></section>`;
}

function fieldBlock() {
  const cells = [["Склад", "Бурундайское шоссе 1 км, дом 1В"], ["График", "пн-пт 08:00-19:00"], ["Оплата", "на расчётный счёт, переводом"], ["Доставка", "по Казахстану, крупные объёмы бесплатно"], ["Гарантия", "от 1 до 3 лет"]];
  return `<section class="field" id="kompaniya" data-tone="blue"><div class="g12">
<p class="mono c3 fl-n"><span>02 / Компания</span><span>${B.site}</span></p>
<div class="c9 fl-t"><p class="fl-big ln"><span class="m"><span>Склад металла, своё производство</span></span><span class="m"><span>гофробалок и монтаж зданий.</span></span><span class="m"><span class="dim">Одна компания и один договор.</span></span></p></div>
<div class="fl-mark c3" aria-hidden="true"><img src="${IMG}/mark.webp" alt="" width="128" height="128" loading="lazy"></div>
<dl class="fl-cells c9">${cells.map(([a, b]) => `<div><dt class="mono">${a}</dt><dd>${b}</dd></div>`).join("")}</dl>
</div></section>`;
}

function indexBlock() {
  return `<section id="katalog"><div class="wrap">
${head(3, "Каталог", `${D.ITEMS.length} позиций|с ценой за тонну`, "Цена за тонну, как у вас на сайте. Вес метра посчитан по ГОСТ. Нажмите на раздел: каталог откроется с фильтрами, суммой и заявкой.")}
<ol class="ix" id="ix">${D.CATS.map((c, i) => {
    const st = D.CAT_STATS[c.id], sh = shot(c.id);
    return `<li><a class="ix-r" href="${href("katalog")}#c=${c.id}" data-shot="${sh ? shot(c.id, 1000) : ""}"><span class="mono ix-n">${pad(i + 1)} /</span><span class="ix-t">${c.n}</span><span class="mono ix-c">${st.n} ${plural(st.n, "размер", "размера", "размеров")}</span><span class="mono ix-p">от ${tg(st.min)}/т</span><span class="ix-im">${sh ? `<img src="${sh}" alt="${esc(c.n)}: визуализация" width="480" height="480" loading="lazy" decoding="async">` : sec(c.sec)}</span><span class="ix-a">${ic("arrow")}</span></a></li>`;
  }).join("")}</ol>
<div class="ix-pv" id="ix-pv" aria-hidden="true"><img alt="" width="1000" height="1000"></div>
<p class="note mono">Снимки проката: визуализация DevUz Studio по сечениям ГОСТ. Ваши фото со склада встанут на их место.</p>
</div></section>`;
}

function calcBlock() {
  return `<section id="kalk" data-tone="night"><div class="wrap">
${head(4, "Калькулятор металла", "Метры, хлысты|и тонны в одну строку", "Вид проката, размер, сколько нужно. Вес по ГОСТ, сумма по вашей цене за тонну. Одна кнопка, и строка в заявке.", true)}
<div class="calc rv">
<div class="calc-l">
<div class="row"><span class="mono">Вид проката</span><div class="calc-cats" role="radiogroup" aria-label="Вид проката" id="cc-cats"></div></div>
<label class="row"><span class="mono">Размер</span><select id="cc-size"></select></label>
<div class="row"><span class="mono">Считать</span><div class="seg" role="radiogroup" aria-label="Считать" id="cc-mode"></div></div>
<label class="row row-q"><span class="mono" id="cc-ql">Сколько метров</span><span class="stp"><button type="button" id="cc-m" aria-label="Меньше">${ic("minus")}</button><input id="cc-q" type="number" inputmode="decimal" min="0" step="any" value="120"><button type="button" id="cc-p" aria-label="Больше">${ic("plus")}</button></span></label>
</div>
<div class="calc-r" aria-live="polite">
<div class="calc-sec" id="cc-sec"></div>
<dl class="calc-out"><div><dt class="mono">Вес</dt><dd id="cc-w">0</dd></div><div><dt class="mono">Длина</dt><dd id="cc-len">0</dd></div><div><dt class="mono">Сумма</dt><dd id="cc-sum">0</dd></div></dl>
<p class="mono calc-note" id="cc-note"></p>
${bbt("Добавить в заявку", "bt-paper", "plus", ' id="cc-add"')}
</div></div>
</div></section>`;
}

function snabBlock() {
  const steps = [
    ["Список позиций", "«Арматура 12», «труба 40×20»: в метрах, хлыстах или тоннах. Вес и сумма считаются сами."],
    ["Резка в размер", "«Резать по 3,8 м»: сколько кусков выйдет из хлыста и какой обрезок останется."],
    ["Доставка", "Город и машина под вес и длину металла, порог бесплатной доставки."],
    ["Счёт на компанию", "БИН проверяется по контрольной цифре. Счёт уходит менеджеру в WhatsApp или на почту."],
  ];
  return `<section id="snab"><div class="wrap">
${head(5, "Заявка снабженца", "Список позиций|и счёт без звонка", "Оплата у вас на расчётный счёт. Снабженцу нужен счёт на ТОО, а не корзина с картой.")}
<div class="sn">
<ol class="sn-l">${steps.map(([h, p], k) => `<li class="rv" style="--d:${k * 60}ms"><span class="mono">${pad(k + 1)}</span><b>${h}</b><p>${p}</p></li>`).join("")}</ol>
<div class="sn-r rv"><div class="doc" id="sd-doc"><div class="doc-h"><p class="mono">Счёт на оплату № ____</p><p class="mono dim">ТОО «Юсем Тау» → ваша компания</p></div>
<div class="doc-t mono"><span>Наименование</span><span>Кол-во</span><span>Сумма</span></div>
<div class="doc-rows" id="sd-rows"></div><div class="doc-f"><span class="mono">Итого</span><b id="sd-tot">0 ₸</b></div><p class="mono dim doc-s">Позиций: <span id="sd-cnt">0</span></p></div>
<div class="sn-b">${bbt("Открыть заявку", "bt-ink", "arrow", " data-cart")}${bbt("Заполнить примером", "bt-line", "plus", ' id="sd-fill"')}</div></div>
</div></div></section>`;
}

function delivBlock() {
  return `<section id="dostavka"><div class="wrap">
${head(6, "Доставка", "Куда, сколько|и какая машина", "По вашему сайту: по Казахстану транспортной компанией, при больших объёмах бесплатно. Покупатель видит машину и цену до звонка.")}
<div class="dv rv">
<div class="dv-l">
<label class="row"><span class="mono">Город</span><select id="dv-city">${D.CITIES.map(([c, km], i) => `<option value="${i}">${c}${km ? `, ${km} км` : ""}</option>`).join("")}</select></label>
<label class="row"><span class="mono">Вес, т <output id="dv-tv">3</output></span><input type="range" id="dv-t" min="0.2" max="20" step="0.1" value="3"></label>
<div class="row"><span class="mono">Самая длинная позиция</span><div class="seg" role="radiogroup" id="dv-len"><button type="button" role="radio" aria-checked="false" data-l="3">до 3 м</button><button type="button" role="radio" aria-checked="true" data-l="6">6 м</button><button type="button" role="radio" aria-checked="false" data-l="11.7">11,7 м</button><button type="button" role="radio" aria-checked="false" data-l="12">12 м</button></div></div>
</div>
<div class="dv-r" aria-live="polite"><div class="truck" id="dv-truck"><svg viewBox="0 0 320 120" aria-hidden="true"><path class="tr-g" d="M0 108h320"/><rect class="tr-body" x="8" y="40" width="200" height="50"/><g class="tr-load" id="dv-load"></g><path class="tr-cab" d="M212 52h44l26 22v16h-70z"/><path class="tr-g" d="M222 58h28v14h-28z"/><circle class="tr-wh" cx="52" cy="96" r="12"/><circle class="tr-wh" cx="160" cy="96" r="12"/><circle class="tr-wh" cx="262" cy="96" r="12"/><path class="tr-dim" d="M8 22h200M8 18v8M208 18v8"/><text x="108" y="14" text-anchor="middle" id="dv-blen">6,2 м</text></svg></div>
<dl class="kv"><div><dt class="mono">Машина</dt><dd id="dv-tn">Борт 5 т</dd></div><div><dt class="mono">Рейсов</dt><dd id="dv-trips">1</dd></div><div><dt class="mono">Доставка</dt><dd id="dv-cost">0 ₸</dd></div></dl>
<p class="mono dv-note" id="dv-note"></p></div></div>
<p class="note mono">Расстояния от Бурундайского шоссе по трассе, округлено. Тарифы и порог 10 т демо, впишете свои.</p>
</div></section>`;
}

function buildBlock() {
  const steps = [
    ["Фундаменты", "Разметка, опалубка, каркасы из арматуры 12"],
    ["Колонны", "Балка 30Ш1, ставим краном на анкеры"],
    ["Рамы из гофробалок", "Ваше производство: стенка волной, балка легче"],
    ["Прогоны и связи", "Гнутый швеллер, профильная труба, уголок"],
    ["Сэндвич-панели", "Стены и кровля, монтаж с креплением"],
  ];
  return `<section class="asm" id="stroyka" data-tone="night"><div class="asm-stick">
<canvas class="asm-cv" id="asm-cv" aria-hidden="true"></canvas>
<div class="asm-ui">
<div class="asm-head"><p class="mono sh-n"><span>07</span><span>Стройка</span></p><h2>Склад из вашего каталога</h2><p class="asm-sub">Листайте: здание ${BLD.W}×${BLD.L} м собирается из позиций с вашего склада. Металл считается в тоннах и по вашим ценам. Размеры и сечения типовые, точную смету даст инженер.</p></div>
<p class="asm-mob mono" aria-hidden="true"><span>Металл каркаса</span><span id="asm-mt">0 т</span><b id="asm-ms">0 ₸</b></p>
<ol class="asm-steps">${steps.map(([h, p], i) => `<li data-i="${i}"><span class="mono">${pad(i + 1)}</span><b>${h}</b><p>${p}</p></li>`).join("")}</ol>
<div class="asm-led" aria-live="off"><p class="mono asm-lt">Ведомость металла</p><ul id="asm-rows"></ul><p class="asm-tot"><span class="mono">Итого металл</span><b id="asm-t">0 т</b><b id="asm-s">0 ₸</b></p><p class="asm-pan mono" id="asm-pan">Сэндвич-панели: стены ${grp(BLD.walls)} м², кровля ${grp(BLD.roof)} м²</p></div>
<div class="asm-bar" aria-hidden="true"><i></i></div>
</div></div></section>`;
}

function objBlock() {
  const photo = { hangar: "angar", warehouse: "sklad", factory: "prom", sport: "sport" };
  return `<section id="obekty"><div class="wrap">
${head(8, "Что строим", "Двенадцать типов|объектов", "У вас в меню 13 похожих строк «Проектирование и строительство … в Алматы, Астане, Казахстане». Здесь те же объекты одним списком: нажали и сразу в WhatsApp с типом объекта.")}
<div class="ob">
<ol class="ob-l">${D.OBJECTS.map(([k, h, p], i) => `<li><a class="ob-r" href="${WA(`Здравствуйте! Интересует строительство: ${h.toLowerCase()}.`)}" data-ph="${photo[k] ? `${IMG}/${photo[k]}.webp` : ""}"><span class="mono">${pad(i + 1)}</span><b>${h}</b><small>${p}</small>${ic("ne")}</a></li>`).join("")}</ol>
<div class="ob-v"><figure class="ob-f" id="ob-f"><img src="${IMG}/angar.webp" alt="Ангар: фото с usemtau.kz" width="617" height="340" loading="lazy" decoding="async"><figcaption class="mono" id="ob-c">Ангар · фото с usemtau.kz</figcaption></figure></div>
</div>
<p class="note mono">Фото: страницы услуг usemtau.kz. Своих снимков построенного на сайте нет: пришлите, поставим вместо этих.</p>
</div></section>`;
}

function gofroBlock() {
  /* Гофробалка на чертеже: фасад со стенкой волной и сечение. */
  const N = 14, x0 = 40, x1 = 680, yT = 70, yB = 190;
  let wave = `M${x0} ${(yT + yB) / 2}`;
  for (let i = 0; i < N; i++) { const a = x0 + ((x1 - x0) * i) / N, b = x0 + ((x1 - x0) * (i + 0.5)) / N, c = x0 + ((x1 - x0) * (i + 1)) / N; wave += ` Q${a + (b - a) / 2} ${i % 2 ? yB - 14 : yT + 14} ${b} ${(yT + yB) / 2} T${c} ${(yT + yB) / 2}`; }
  return `<section id="gofro" data-tone="paper2"><div class="wrap">
${head(9, "Своё производство", "Гофробалки|и гнутый швеллер", "Стенка балки не плоская, а волной. Волна держит нагрузку, стенку делают тоньше: металла уходит меньше, жёсткость выше, монтаж быстрый.")}
<div class="sheet rv"><svg viewBox="0 0 760 300" class="gf-svg" aria-hidden="true">
<rect x="${x0}" y="${yT - 12}" width="${x1 - x0}" height="12" class="ink"/><rect x="${x0}" y="${yB}" width="${x1 - x0}" height="12" class="ink"/>
<path d="${wave}" class="gf-web" pathLength="1000"/>
<path d="M${x0} 240H${x1}M${x0} 234v12M${x1} 234v12" class="dim"/><text x="${(x0 + x1) / 2}" y="262" text-anchor="middle">пролёт до 24 м</text>
<path d="M20 ${yT - 12}V${yB + 12}M14 ${yT - 12}h12M14 ${yB + 12}h12" class="dim"/><text x="14" y="${(yT + yB) / 2}" text-anchor="middle" transform="rotate(-90 14 ${(yT + yB) / 2})">h</text>
<g transform="translate(700 70)"><rect x="0" y="-12" width="44" height="10" class="ink"/><rect x="0" y="120" width="44" height="10" class="ink"/><path d="M22 -2v122" class="web2"/><text x="22" y="150" text-anchor="middle">сечение</text></g>
</svg>
<div class="sheet-tb mono"><span>Изделие</span><b>Балка с гофрированной стенкой</b><span>Где ставят</span><b>стадионы, спортзалы, колледжи, логистические центры, склады</b><span>Ещё</span><b>гнутый швеллер: каркас и усиление, хорошо варится</b></div></div>
<div class="gf-b">${btn("Узнать цену гофробалки", WA("Здравствуйте! Нужны гофробалки, хочу узнать цену и сроки."), "bt-ink", "ne")}<figure class="gf-ph"><img src="${IMG}/gofro.webp" alt="Гофробалки на складе, фото с usemtau.kz" width="640" height="353" loading="lazy" decoding="async"><figcaption class="mono">Фото с usemtau.kz</figcaption></figure></div>
<p class="note mono">Пролёт на чертеже для примера. Ваши размеры и нагрузки впишем по каталогу производства.</p>
</div></section>`;
}

function sandBlock() {
  const layers = [["Сталь с полимерным покрытием", "0,5 мм"], ["Утеплитель", "50-200 мм"], ["Сталь внутри", "0,5 мм"]];
  return `<section id="paneli" data-tone="night"><div class="wrap">
${head(10, "Монтаж сэндвич-панелей", "Стена, утеплитель|и отделка одной панелью", "Склад, цех, пристройка, жилой дом. Перед монтажом прорабатываем фундамент. Привозим, разгружаем, монтируем с креплением. Демонтаж старого покрытия без деформации каркаса.", true)}
<div class="sp">
<div class="sp-v" id="sp-v" aria-hidden="true">${layers.map(([n, t], i) => `<div class="sp-l sp-${i + 1}"><span class="mono">${pad(i + 1)} ${n}</span><span class="mono">${t}</span></div>`).join("")}</div>
<div class="sp-t"><ul class="sp-l2">${["Доставка и разгрузка на объекте", "Монтаж стен и кровли", "Демонтаж старого покрытия"].map((x, i) => `<li class="rv" style="--d:${i * 60}ms"><span class="mono">${pad(i + 1)}</span>${x}</li>`).join("")}</ul>
${btn("Обсудить монтаж", WA("Здравствуйте! Нужен монтаж сэндвич-панелей."), "bt-paper", "ne")}
<figure class="sp-ph"><img src="${IMG}/sendvich.webp" alt="Монтаж сэндвич-панелей, фото с usemtau.kz" width="960" height="529" loading="lazy" decoding="async"><figcaption class="mono">Фото с usemtau.kz</figcaption></figure></div>
</div>
<p class="note mono">Толщины слоёв типовые, точные по вашему проекту.</p>
</div></section>`;
}

function hangarBlock() {
  return `<section id="angar"><div class="wrap">
${head(11, "Расчёт ангара", "Размеры ангара|за минуту", "Арочный или прямостенный, как у вас в описании. Площади и панели считаются сразу. Инженер получает расчёт с цифрами и называет цену.")}
<div class="hg rv">
<div class="hg-l">
<div class="row"><span class="mono">Тип</span><div class="seg" role="radiogroup" id="hg-type" aria-label="Тип"><button type="button" role="radio" aria-checked="true" data-v="rect">Прямостенный</button><button type="button" role="radio" aria-checked="false" data-v="arch">Арочный</button></div></div>
<label class="row"><span class="mono">Ширина, м <output id="hg-wv">18</output></span><input type="range" id="hg-w" min="9" max="36" step="1" value="18"></label>
<label class="row"><span class="mono">Длина, м <output id="hg-lv">36</output></span><input type="range" id="hg-l" min="12" max="96" step="6" value="36"></label>
<label class="row" id="hg-hf"><span class="mono">Высота стен, м <output id="hg-hv">6</output></span><input type="range" id="hg-h" min="4" max="12" step="0.5" value="6"></label>
<label class="row"><span class="mono">Ворота <output id="hg-gv">2</output></span><input type="range" id="hg-g" min="1" max="6" step="1" value="2"></label>
<div class="row"><span class="mono">Стены и кровля</span><div class="seg" role="radiogroup" id="hg-warm" aria-label="Стены и кровля"><button type="button" role="radio" aria-checked="true" data-v="1">Сэндвич-панели</button><button type="button" role="radio" aria-checked="false" data-v="0">Профнастил</button></div></div>
</div>
<div class="hg-r"><div class="dwg"><svg viewBox="0 0 400 220" class="hg-svg" id="hg-svg" aria-hidden="true"></svg>
<div class="dwg-tb mono"><span>Объект</span><b id="hg-name">Ангар прямостенный</b><span>Лист</span><b>1 / 1</b><span>Стадия</span><b>расчёт</b><span>Исп.</span><b>${B.name}</b></div></div>
<dl class="kv kv4"><div><dt class="mono">Площадь пола</dt><dd id="hg-a">0</dd></div><div><dt class="mono">Объём</dt><dd id="hg-v">0</dd></div><div><dt class="mono">Стены</dt><dd id="hg-ws">0</dd></div><div><dt class="mono">Кровля</dt><dd id="hg-rs">0</dd></div></dl>
${btn("Отправить расчёт инженеру", WA("Здравствуйте! Хочу расчёт ангара."), "bt-ink", "ne", ' id="hg-go"')}</div>
</div></div></section>`;
}

function nowBlock() {
  return `<section id="seychas" data-tone="paper2"><div class="wrap">
${head(12, "Сейчас и станет", "Что мы увидели|на вашем сайте", "Открыли usemtau.kz с телефона, как прораб на объекте, которому срочно нужна арматура.")}
<div class="tbl tbl-now"><div class="tr th mono"><span>№</span><span>Сейчас на usemtau.kz</span><span>Станет</span></div>
${D.NOW.map((r, i) => `<div class="tr rv"><span class="mono">${pad(i + 1)}</span><p class="was">${esc(r.now)}</p><p>${esc(r.next)}</p></div>`).join("")}</div>
</div></section>`;
}

function bestBlock() {
  const rows = [
    ["Стальная Марка", "Алматы", "Калькулятор метров и веса есть, но цены по запросу, корзины нет: счёт присылает менеджер.", "Калькулятор прямо в заявке, сумма по цене за тонну"],
    ["Профи-Дом", "Алматы", "Ориентир цены за тонну и резка, но заказать можно только формой «рассчитать стоимость».", "Резка строкой в заявке: куски и обрезок"],
    ["M-Steel Snab", "Алматы", "Прайс по заявке, спецификацию просят прислать в WhatsApp.", "Спецификация собирается на сайте и уходит в WhatsApp сама"],
    ["Трубное Решение", "Астана", "Цена за тонну в прайсе и корзина для сборного заказа.", "Сборный заказ и счёт на компанию по БИН"],
    ["McMaster-Carr", "США", "История заказов и повтор прошлого заказа для снабженца.", "«Повторить прошлую заявку» одной кнопкой"],
    ["Металл Профиль", "Россия", "Калькуляторы кровли, сайдинга, забора рядом с товаром.", "Расчёт ангара по размерам с заявкой инженеру"],
  ];
  return `<section id="sosedi"><div class="wrap">
${head(13, "Разбор рынка", "Что взяли у соседей|и у лучших", "Прошли сайты металлобаз Алматы и Астаны и лучших в России и США. Корзины со счётом на компанию нет ни у одной металлобазы Алматы, калькулятор веса только у одной.")}
<div class="tbl tbl-best"><div class="tr th mono"><span>Сайт</span><span>Что у них</span><span>У Юсем Тау</span></div>
${rows.map(([n, c, a, b]) => `<div class="tr rv"><span><b>${n}</b><small class="mono">${c}</small></span><p>${a}</p><p>${b}</p></div>`).join("")}</div>
</div></section>`;
}

function contactBlock() {
  return `<section id="sklad" data-tone="night"><div class="wrap">
${head(14, "Склад и контакты", "Приезжайте|или звоните", "", true)}
<div class="ct">
<figure class="ct-ph"><img src="${IMG}/sklad-h-1280.webp" alt="" width="1280" height="720" loading="lazy" decoding="async"><figcaption class="mono">Визуализация</figcaption></figure>
<dl class="ct-l">
<div><dt class="mono">Адрес</dt><dd>${B.addr}<a class="mono lk" href="${B.map}">Открыть в 2ГИС ↗</a></dd></div>
<div><dt class="mono">Телефон</dt><dd><a href="tel:${B.phoneRaw}">${B.phone}</a></dd></div>
<div><dt class="mono">WhatsApp</dt><dd><a href="https://wa.me/${B.wa}">${B.waShow}</a></dd></div>
<div><dt class="mono">Почта</dt><dd><a href="mailto:${B.mail}">${B.mail}</a></dd></div>
<div><dt class="mono">График</dt><dd>${B.hours}</dd></div>
<div><dt class="mono">Координаты</dt><dd class="mono">43.3378° N, 76.9064° E</dd></div>
</dl></div>
<p class="note mono">Всё в этом блоке с вашего сайта. Фото склада, техники и объектов на сайте нет: это первое, что стоит доснять.</p>
</div></section>`;
}

function offerBlock() {
  const row = (a, i) => `<label class="kit-row"><span class="mono">${pad(i + 1)}</span><input type="checkbox" data-k="${a.id}" data-p="${a.price}"><span class="sq" aria-hidden="true">${ic("check")}</span><span class="kit-t2"><b>${a.t}${a.star ? `<em class="mono star">берут первым</em>` : ""}</b><small>${a.e}</small></span><span class="kit-pr mono">+${usd(a.price)}</span></label>`;
  return `<section class="offer" id="cena" data-tone="blue"><div class="wrap">
${head(15, "Предложение DevUz Studio", "Стоимость", `Сайт без допов: ${usd(BASE.promo)} вместо ${usd(BASE.price)}, если начинаем в течение 48 часов. Остальное идёт допами: включайте, итог пересчитается.`, true)}
<div class="kit" id="konstruktor">
<div class="kit-l">
<div class="kit-base"><div><p class="mono">Входит всегда</p><b>${BASE.t}</b><p>${BASE.d}</p><p class="mono">Срок: ${BASE.weeks[0]}-${BASE.weeks[1]} недели</p></div><div class="kb-p"><s>${usd(BASE.price)}</s><b>${usd(BASE.promo)}</b><small class="mono">48 часов</small></div></div>
<p class="mono kit-g">Допы</p>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side">
<div class="kit-total" id="kit-total">
<div class="timer" id="timer"><span class="mono">Цена ${usd(BASE.promo)} действует<small>48 часов с первого открытия макета</small></span><b id="tm">48:00:00</b></div>
<div class="kt-line mono"><span>Сайт</span><span><s>${usd(BASE.price)}</s> ${usd(BASE.promo)}</span></div>
<div class="kt-line mono"><span>Допы · <span id="kit-cnt">0</span></span><span id="kit-add">0 $</span></div>
<div class="kt-sum"><small class="mono">Итого</small><b id="kit-total-sum">${usd(BASE.promo)}</b><small class="mono">со всеми допами ${usd(ALL)}</small></div>
${bbt("Включить всё", "bt-line", "plus", ' id="kit-all"')}
${btn("Обсудить с DevUz Studio", "https://t.me/Devuz_studio_bot?start=usemtau", "bt-paper", "ne")}
<button type="button" class="copy mono" id="kit-copy">Скопировать состав</button>
</div>
<p class="note mono">Цены допов: середина рынка веб-студий Казахстана и СНГ. Лицензии 1С, amoCRM или Bitrix24, хостинг и SMS компания оплачивает сама.</p>
</div>
</div></div></section>`;
}

function footer() {
  return `<footer class="foot" data-tone="night"><div class="wrap">
<svg class="f-word" viewBox="0 0 1000 150" aria-label="Юсем Тау"><text x="0" y="128" textLength="1000" lengthAdjust="spacingAndGlyphs">ЮСЕМ ТАУ</text></svg>
<div class="f-g">
<div><p class="mono dim">Компания</p><p>Металлопрокат со склада в Алматы, доставка по Казахстану, строительство зданий из металлоконструкций.</p></div>
<div><p class="mono dim">Связь</p><p><a href="tel:${B.phoneRaw}">${B.phone}</a><br><a href="https://wa.me/${B.wa}">WhatsApp ${B.waShow}</a><br><a href="mailto:${B.mail}">${B.mail}</a></p></div>
<div><p class="mono dim">Разделы</p><p><a href="${href("katalog")}">Каталог</a><br><a href="${href()}#kalk">Калькулятор</a><br><a href="${href()}#dostavka">Доставка</a><br><a href="${href()}#angar">Расчёт ангара</a></p></div>
<div><p class="mono dim">Данные макета</p><p>Позиции, цены, адрес, телефоны, часы, услуги: usemtau.kz. Вес метра: ГОСТ 8239, 8240, 26020 и геометрия сечения. Кадры склада и проката: визуализация. Тарифы, пример здания, счёт: демо.</p></div>
</div>
<div class="rights mono"><span>Макет DevUz Studio: так может выглядеть сайт ${B.name}. Заявки и счета уходят только в ваш WhatsApp и на почту.</span><a href="${TERMS}">Условия использования макета</a></div>
</div></footer>`;
}

function cartDrawer() {
  return `<div class="dr" id="dr" hidden role="dialog" aria-modal="true" aria-labelledby="dr-h"><div class="dr-back" data-close></div><div class="dr-in">
<header class="dr-top"><p class="mono">Заявка</p><b id="dr-h">Список позиций</b><button type="button" class="ib" data-close aria-label="Закрыть">${ic("x")}</button></header>
<div class="dr-body">
<div id="dr-list"></div>
<div class="dr-empty" id="dr-empty"><p>В заявке пусто. Найдите позицию поиском или в каталоге.</p>${btn("Открыть каталог", href("katalog"), "bt-ink")}<button type="button" class="bt bt-line" id="dr-repeat" hidden><span>Повторить прошлую заявку</span><i>${ic("repeat")}</i></button></div>
<div class="dr-more" id="dr-more">
<div class="dr-sec"><p class="mono">Доставка</p><label class="row"><span class="mono">Город</span><select id="dr-city"><option value="-1">Самовывоз со склада</option>${D.CITIES.map(([c], i) => `<option value="${i}">${c}</option>`).join("")}</select></label><p class="dr-dv mono" id="dr-dv"></p></div>
<div class="dr-sec"><p class="mono">Счёт на компанию</p><label class="row"><span class="mono">БИН</span><input id="dr-bin" inputmode="numeric" maxlength="12" autocomplete="off" placeholder="12 цифр"></label><p class="dr-ok mono" id="dr-binok" aria-live="polite"></p><label class="row"><span class="mono">Компания</span><input id="dr-org" autocomplete="organization" placeholder="ТОО «…»"></label><label class="row"><span class="mono">Телефон</span><input id="dr-tel" type="tel" autocomplete="tel" placeholder="+7"></label></div>
</div></div>
<footer class="dr-foot"><div class="dr-tot"><span class="mono" id="dr-w">0 т</span><b id="dr-sum">0 ₸</b></div>
<div class="dr-btns"><a class="bt bt-wa" id="dr-wa" href="https://wa.me/${B.wa}"><span>Счёт в WhatsApp</span><i>${ic("ne")}</i></a><a class="bt bt-line" id="dr-mail" href="mailto:${B.mail}"><span>На почту</span><i>${ic("ne")}</i></a></div>
<p class="dr-n mono">Цена за тонну с вашего сайта. Счёт собирает менеджер по этой заявке.</p></footer>
</div></div>
<div id="toast" class="mono" role="status" aria-live="polite"></div>`;
}

function dock() {
  return `<nav class="dock mono" id="dock" aria-label="Связь"><a href="tel:${B.phoneRaw}">Позвонить</a><a href="${WA("Здравствуйте! Пишу с сайта usemtau.kz")}">WhatsApp</a><button type="button" data-cart>Заявка <b class="bdg" data-badge>0</b></button></nav>`;
}

function sitePage() {
  return `<!doctype html>
<html lang="ru">
<head>
${headTags(`${B.name} · металлопрокат в Алматы · макет DevUz Studio`, "Макет сайта Юсем Тау: металлопрокат со склада в Алматы с ценой за тонну, поиск, калькулятор веса, заявка и счёт на компанию по БИН, доставка по Казахстану, строительство ангаров и складов из гофробалок и сэндвич-панелей.")}
<link rel="preload" as="image" href="${IMG}/sklad-h-1920.webp" media="(orientation: landscape)">
<link rel="preload" as="image" href="${IMG}/sklad-v-1080.webp" media="(orientation: portrait)">
<script>document.documentElement.classList.add('js')</script>
@@S@@
</head>
<body class="site">
${dzIntroSolo("ru")}
${sprite()}
<a class="skip" href="#main">К содержанию</a>
${header("")}
<main id="main">
${[heroBlock(), findBlock(), fieldBlock(), indexBlock(), calcBlock(), snabBlock(), delivBlock(), buildBlock(), objBlock(), gofroBlock(), sandBlock(), hangarBlock(), nowBlock(), bestBlock(), contactBlock(), offerBlock()].join("\n")}
</main>
${footer()}
${dock()}
${cartDrawer()}
<script type="application/json" id="um-data">${json(siteData())}</script>
<script src="${IMG}/gsap.min.js"></script>
<script src="${IMG}/ScrollTrigger.min.js"></script>
@@J@@
@@B@@
</body>
</html>`;
}

function katalogPage() {
  return `<!doctype html>
<html lang="ru">
<head>
${headTags(`Каталог металлопроката · ${B.name} · макет DevUz Studio`, "Каталог Юсем Тау: арматура, трубы, профильная труба, листы, уголок, швеллер, балка, круг, сетка и другие позиции с ценой за тонну, весом метра по ГОСТ и заявкой на счёт.")}
<script>document.documentElement.classList.add('js')</script>
@@S@@
</head>
<body class="site kat">
${sprite()}
<a class="skip" href="#main">К содержанию</a>
${header("katalog")}
<main id="main" class="kt">
<div class="wrap">
<header class="sh kt-h"><p class="mono sh-n"><span><a href="${href()}">Главная</a></span><span>Каталог</span></p><h1 class="ln"><span class="m"><span>Металлопрокат</span></span><span class="m"><span>со склада в Алматы</span></span></h1><p class="sh-l">${D.ITEMS.length} позиций, цена за тонну как на usemtau.kz. У каждой вес метра по ГОСТ, сколько метров в тонне и сумма на ваше количество.</p></header>
<div class="kt-grid">
<aside class="kt-side" aria-label="Виды проката"><nav class="kt-cats" id="kt-cats"><button type="button" data-c="" aria-pressed="true"><span class="mono">00</span>Все<small class="mono">${D.ITEMS.length}</small></button>${D.CATS.map((c, i) => `<button type="button" data-c="${c.id}" aria-pressed="false"><span class="mono">${pad(i + 1)}</span>${c.n}<small class="mono">${D.CAT_STATS[c.id].n}</small></button>`).join("")}</nav></aside>
<div class="kt-main">
<div class="kt-bar">
<div class="kt-find"><label class="sr" for="kq">Поиск по каталогу</label><input id="kq" type="search" autocomplete="off" enterkeyhint="search" placeholder="Поиск: арматура 12, труба 40×20"></div>
<div class="kt-f"><div class="seg" role="radiogroup" id="kt-mark" aria-label="Марка стали"><button type="button" role="radio" aria-checked="true" data-v="">Любая марка</button><button type="button" role="radio" aria-checked="false" data-v="Ст3сп/пс">Ст3сп/пс</button><button type="button" role="radio" aria-checked="false" data-v="09Г2С">09Г2С</button></div>
<label class="fi"><span class="mono">Размер от, мм</span><input id="kt-min" type="number" inputmode="decimal" min="0"></label><label class="fi"><span class="mono">до</span><input id="kt-max" type="number" inputmode="decimal" min="0"></label>
<label class="fi"><span class="mono">Длина хлыста</span><select id="kt-bar"><option value="">любая</option><option value="6">6 м</option><option value="11.7">11,7 м</option><option value="12">12 м</option><option value="0">бухта, лист</option></select></label>
<label class="fi"><span class="mono">Порядок</span><select id="kt-sort"><option value="">как в каталоге</option><option value="p">дешевле за тонну</option><option value="s">по размеру</option></select></label></div>
</div>
<div class="kt-cap" id="kt-cap"></div>
<div class="kt-th mono" aria-hidden="true"><span></span><span>Наименование</span><span>Вес</span><span>Цена за т</span><span>Количество</span><span>Сумма</span></div>
<p class="kt-cnt mono" id="kt-cnt" aria-live="polite"></p>
<div class="kt-list" id="kt-list"></div>
<p class="note mono">Длина хлыста типовая: 11,7 м у арматуры и уголка, 6 м у труб, 12 м у балок. У вас на складе может быть иначе: впишем ваши. Вес метра по ГОСТ, у профильной трубы с точностью около 3%.</p>
</div></div></div>
</main>
${footer()}
${dock()}
${cartDrawer()}
<script type="application/json" id="um-data">${json(siteData())}</script>
@@J@@
</body>
</html>`;
}

const out = { "": sitePage(), katalog: katalogPage() };
const parts = {
  S: `<style>${min(read("site.css"))}</style>`,
  J: `<script>\n${strip(read("site.js"))}</script>`,
  B: `<script>\n${strip(read("build.js"))}</script>`,
};
const fill = (page) => Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), page);

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "usemtau.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(главная)").padEnd(12), fill(v).length);
