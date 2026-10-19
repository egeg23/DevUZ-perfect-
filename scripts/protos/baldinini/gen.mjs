import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as D from "./data.mjs";
import { SHOP_UI, PANEL_UI } from "./ui.mjs";
import { BASE, PANELS, ADDONS, ADDONS_SUM, ALL, OFFER_HOURS } from "./plan.mjs";
import { DZ_VIDEO } from "../dz-video.mjs";

/*
 * Макет интернет-магазина Baldinini Tashkent (бутик в Tashkent City Mall),
 * ru, uz и en:
 *  - страница (`""`, `uz`, `en`): видео DevUz и знак Baldinini, первый экран
 *    с фото кампании FW26/27, «сейчас и станет», покупатель бутика, магазин
 *    в айфоне по шагам, приёмы люксовых магазинов, «сделано в Италии»,
 *    панель в окне браузера с уровнями «Панель / Расширенная», стоимость с
 *    конструктором и отсчётом 48 часов;
 *  - магазин (`shop`, `uz/shop`, `en/shop`): сначала телефон;
 *  - панель (`panel`, `uz/panel`, `en/panel`) по эталону greenwell.
 * Товары, названия, артикулы, материалы и фото — официальный магазин бренда
 * (data.mjs); цены в сумах, остатки, заказы и посещаемость — демо, так и
 * подписано. Модель макет не вызывает.
 *
 * Стили и скрипты общие, в странице вместо них @@S@@, @@A@@, @@K@@, @@J@@,
 * @@P@@, @@Q@@. Ссылки — через __PROTO_BASE__, отпечаток ставится при показе
 * (lib/proto/bundles).
 */

const DIR = new URL(".", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/baldinini";
const BASEP = "__PROTO_BASE__";
const B = D.BRAND.name;
const LANGS = ["ru", "uz", "en"];
const LI = { ru: 0, uz: 1, en: 2 };
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Jost:wght@400;500&display=swap";
const read = (f) => readFileSync(DIR + f, "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => grp(n) + " $";
const T = (l) => (ru, uz, en) => [ru, uz, en][LI[l]];
const L3 = (p, l) => (Array.isArray(p) ? p[LI[l]] : p);
const href = (l, path = "") => BASEP + (l === "ru" ? "" : "/" + l) + (path ? "/" + path : "");
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

/* ── Подписи: каждая, которую зовут скрипты, должна быть на трёх языках ── */
function dict(src, js, name) {
  const keys = new Set([...js.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  const dyn = {
    shop: ["st0", "st1", "st2", "st3", "st2p", "st3p", "bk_new", "bk_ok", "bk_done", "bk_no"],
    panel: ["d7", "d30", "d90", "st0", "st1", "st2", "st3", "stp2", "stp3", "toSt1", "toSt2", "toSt3", "bk_new", "bk_ok", "bk_done", "bk_no", "ch_btq", "ch_site", "ch_ig", "rv_courier", "rv_pickup", "rv_btq", "tierStd", "tierPro", "kindEx", "kindRet", "retDone", "retNew", "doEx", "doRet",
      ...PANELS.std.sections.concat(PANELS.pro.sections).map((k) => "n_" + k), ...PANELS.pro.sections.map((k) => "lockP_" + k),
      ...["st", "seller", "ex", "exDone", "retDone", "try_ok", "try_came", "try_no", "stock", "wrap", "rem", "priv", "season", "tier", "call", "photo", "hold"].map((k) => "log_" + k)],
  }[name];
  for (const k of dyn) keys.add(k);
  for (const k of ["bk_", "st", "d", "n_", "log_", "ch_", "rv_", "toSt", "lockP_"]) keys.delete(k);
  for (const k of keys) {
    const v = src[k];
    if (!v || v.length !== 3 || v.some((x) => !x)) throw new Error(`${name}: нет подписи «${k}» на трёх языках`);
  }
  return (l) => Object.fromEntries(Object.entries(src).map(([k, v]) => [k, L3(v, l)]));
}
const SHOP_JS = read("shop.js"), PANEL_JS = read("panel.js");
const shopUi = dict(SHOP_UI, SHOP_JS, "shop"), panelUi = dict(PANEL_UI, PANEL_JS, "panel");

/* ── Знак: их вектор из шапки baldinini-shop.com ───────────────────────── */
const LOGO_SYM = `<symbol id="bd-logo" viewBox="0 0 153 30">${D.LOGO.map(([d, ev]) => `<path d="${d}"${ev ? ' fill-rule="evenodd"' : ""}/>`).join("")}</symbol>`;

/* ── Иконки: контуры 24×24, тонкий штрих ──────────────────────────────── */
const S = 'fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  arrow: `<path d="M4 12h16M14 6l6 6-6 6" ${S}/>`,
  chev: `<path d="m9 6 6 6-6 6" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" ${S}/>`,
  plus: `<path d="M12 5v14M5 12h14" ${S}/>`,
  minus: `<path d="M5 12h14" ${S}/>`,
  heart: `<path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z" ${S}/>`,
  bag: `<path d="M5 8.5h14l-1 11.5H6z" ${S}/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" ${S}/>`,
  user: `<circle cx="12" cy="8.5" r="3.6" ${S}/><path d="M5 20c1.2-3.6 3.8-5.3 7-5.3s5.8 1.7 7 5.3" ${S}/>`,
  users: `<circle cx="9" cy="9" r="3.2" ${S}/><path d="M3.5 19c1-3 3-4.4 5.5-4.4s4.5 1.4 5.5 4.4" ${S}/><path d="M15.5 6.2a3 3 0 0 1 0 5.6M17 14.8c1.8.4 3 1.8 3.6 4" ${S}/>`,
  menu: `<path d="M4 8h16M4 16h16" ${S}/>`,
  filter: `<path d="M4 7h10M18 7h2M4 17h2M10 17h10" ${S}/><circle cx="16" cy="7" r="2" ${S}/><circle cx="8" cy="17" r="2" ${S}/>`,
  sort: `<path d="M8 5v14M8 19l-3-3M8 19l3-3M16 19V5M16 5l-3 3M16 5l3 3" ${S}/>`,
  hanger: `<path d="M12 7.5a2 2 0 1 1 2-2" ${S}/><path d="M12 7.5v1.2L3.5 15c-.8.6-.4 1.8.6 1.8h15.8c1 0 1.4-1.2.6-1.8L12 8.7" ${S}/>`,
  gift: `<rect x="4" y="9" width="16" height="11" rx="1" ${S}/><path d="M4 13h16M12 9v11M12 9c-1.5-3.3-5-3.8-5-1.4S9.6 9 12 9zm0 0c1.5-3.3 5-3.8 5-1.4S14.4 9 12 9z" ${S}/>`,
  chat: `<path d="M4.5 17.5 4 21l3.8-2a8.5 8.5 0 1 0-3.3-1.5z" ${S}/>`,
  truck: `<path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z" ${S}/><circle cx="7" cy="17.5" r="1.7" ${S}/><circle cx="17.5" cy="17.5" r="1.7" ${S}/>`,
  pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${S}/><circle cx="12" cy="10" r="2.2" ${S}/>`,
  ig: `<rect x="4" y="4" width="16" height="16" rx="4.5" ${S}/><circle cx="12" cy="12" r="3.6" ${S}/><path d="M16.8 7.2v.01" ${S}/>`,
  lock: `<rect x="5" y="10.5" width="14" height="10" rx="1.5" ${S}/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" ${S}/>`,
  key: `<circle cx="8" cy="15" r="4" ${S}/><path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2" ${S}/>`,
  card: `<rect x="3" y="5.5" width="18" height="13" rx="1.5" ${S}/><path d="M3 10h18M7 15h4" ${S}/>`,
  cash: `<rect x="3" y="6.5" width="18" height="11" rx="1" ${S}/><circle cx="12" cy="12" r="2.6" ${S}/>`,
  wallet: `<path d="M4 7.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1z" ${S}/><path d="M4 7.5 15.5 4v3.5M16 13.5h.01" ${S}/>`,
  bell: `<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" ${S}/><path d="M10 20.5h4" ${S}/>`,
  grid: `<rect x="4" y="4" width="7" height="7" ${S}/><rect x="13" y="4" width="7" height="7" ${S}/><rect x="4" y="13" width="7" height="7" ${S}/><rect x="13" y="13" width="7" height="7" ${S}/>`,
  box: `<path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5z" ${S}/><path d="M4 7.5 12 11l8-3.5M12 11v9" ${S}/>`,
  tag: `<path d="M4 12V4h8l8 8-8 8z" ${S}/><circle cx="8.5" cy="8.5" r="1.3" ${S}/>`,
  swap: `<path d="M5 8h13M14 4l4 4-4 4M19 16H6M10 20l-4-4 4-4" ${S}/>`,
  shield: `<path d="M12 3 19 6v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" ${S}/>`,
  chart: `<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" ${S}/>`,
  star: `<path d="M12 4l2.4 5 5.4.7-4 3.8 1 5.4L12 16.3 7.2 18.9l1-5.4-4-3.8 5.4-.7z" ${S}/>`,
  layers: `<path d="m12 4 8.5 4.5L12 13 3.5 8.5z" ${S}/><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" ${S}/>`,
  full: `<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" ${S}/>`,
  globe: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z" ${S}/>`,
  tg: `<path d="M21 4 3 11l6 2 2 6 3-4 5 4z" ${S}/><path d="m9 13 9-7" ${S}/>`,
  ruler: `<path d="M3 15.5 15.5 3 21 8.5 8.5 21z" ${S}/><path d="m7 11.5 2 2M10 8.5l1.5 1.5M13 5.5l2 2" ${S}/>`,
};
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${LOGO_SYM}${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
  .join("")}</defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;
const logo = (cls = "") => `<svg class="logo-w ${cls}" viewBox="-1 0 155 30" role="img" aria-label="${B}"><use href="#bd-logo" fill="currentColor"/></svg>`;

/* ── Данные магазина ──────────────────────────────────────────────────── */
const MAT_DESC = {
  leather: ["Гладкая кожа", "Silliq teri", "Smooth leather"], suede: ["Замша", "Zamsh", "Suede"], tumbled: ["Зернистая кожа", "Donador teri", "Tumbled leather"],
  calfhair: ["Ворсовая кожа с принтом", "Naqshli tukli teri", "Printed calf hair"], lizard: ["Кожа с тиснением под ящерицу", "Kaltakesak bo‘rtmali teri", "Lizard-print leather"],
};
const SPEC = {
  mat: ["Верх", "Ust qismi", "Upper"], lin: ["Подкладка", "Astar", "Lining"], sole: ["Подошва", "Taglik", "Sole"], heel: ["Каблук", "Poshna", "Heel"], toe: ["Носок", "Uchi", "Toe"],
  size: ["Размер, см", "O‘lchami, sm", "Size, cm"], art: ["Артикул", "Artikul", "Article"], made: ["Страна", "Mamlakat", "Country"], line: ["Коллекция", "Kolleksiya", "Collection"],
};
const ITALY = ["Сделано в Италии", "Italiyada ishlab chiqarilgan", "Made in Italy"];
const NOHEEL = ["без каблука", "poshnasiz", "flat"];
function prods(l) {
  const t = T(l);
  return D.PRODUCTS.map((p, i) => {
    const heel = p.cat === "w" || p.cat === "m" ? (p.heel > 1 ? `${p.heel} ${t("см", "sm", "cm")}` : L3(NOHEEL, l)) : null;
    const spec = [[L3(SPEC.mat, l), L3(MAT_DESC[p.mat], l)], p.lin && [L3(SPEC.lin, l), L3(D.LINING[p.lin], l)], p.sole && [L3(SPEC.sole, l), L3(D.SOLE[p.sole], l)], heel && [L3(SPEC.heel, l), heel], p.toe && [L3(SPEC.toe, l), L3(D.TOE[p.toe], l)],
      p.size && [L3(SPEC.size, l), p.size], [L3(SPEC.line, l), L3(D.LINES[p.line], l)], [L3(SPEC.art, l), p.art], [L3(SPEC.made, l), L3(ITALY, l)]].filter(Boolean);
    const lin = p.lin ? L3(D.LINING[p.lin], l) : null;
    const desc = t(
      `${L3(MAT_DESC[p.mat], l)}${lin ? `, подкладка: ${lin}` : ""}${heel && p.heel > 1 ? `, каблук ${heel}` : ""}. Модель сезона ${L3(D.LINES[p.line], l).toLowerCase()} из официального каталога Baldinini. Сделано в Италии.`,
      `${L3(MAT_DESC[p.mat], l)}${lin ? `, astar: ${lin}` : ""}${heel && p.heel > 1 ? `, poshna ${heel}` : ""}. Baldinini rasmiy katalogidagi ${L3(D.LINES[p.line], l).toLowerCase()} mavsumi modeli. Italiyada ishlab chiqarilgan.`,
      `${L3(MAT_DESC[p.mat], l)}${lin ? `, ${lin} lining` : ""}${heel && p.heel > 1 ? `, ${heel} heel` : ""}. A ${L3(D.LINES[p.line], l).toLowerCase()} model from the official Baldinini catalogue. Made in Italy.`,
    );
    return {
      id: p.id, art: p.art, cat: p.cat, n: L3(p.n, l), color: L3(p.c, l), ck: p.col, mk: p.mat, heel: p.cat === "w" || p.cat === "m" ? p.heel : null,
      price: D.priceOf(p), sizes: p.cat === "w" ? D.SIZES.w : p.cat === "m" ? D.SIZES.m : null, stock: D.stockOf(p, i), im: p.im ?? 3, isNew: p.line === "fw", line: L3(D.LINES[p.line], l),
      desc, spec, look: p.look, ord: i, pop: p.pop, cs: 0.4 + ((i * 37) % 11) / 100,
    };
  });
}
const conv = (sizes, f) => Object.fromEntries(sizes.map((z) => [z, f(z)]));
const fmtN = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const SIZE_DATA = {
  sizes: D.SIZES,
  /* RU — ориентир: на размер меньше EU (у бренда русской сетки нет). */
  conv: { w: conv(D.SIZES.w, (z) => fmtN(+z - 1)), m: conv(D.SIZES.m, (z) => fmtN(+z - 1)) },
  /* Длина стопы — ориентир по парижскому штиху: EU × 2/3 − 1,5 см. */
  foot: { w: conv(D.SIZES.w, (z) => +(+z * 2 / 3 - 1.5).toFixed(1)), m: conv(D.SIZES.m, (z) => +(+z * 2 / 3 - 1.5).toFixed(1)) },
  guide: { w: conv(D.SIZES.w, (z) => [fmtN(D.US("w", z)), fmtN(D.UK("w", z))]), m: conv(D.SIZES.m, (z) => [fmtN(D.US("m", z)), fmtN(D.UK("m", z))]) },
};
const DISTRICTS = {
  ru: "Мирабадский|Юнусабадский|Мирзо-Улугбекский|Яккасарайский|Шайхантахурский|Чиланзарский|Алмазарский|Яшнабадский|Сергелийский|Учтепинский|Бектемирский|Янгихаётский",
  uz: "Mirobod|Yunusobod|Mirzo Ulug‘bek|Yakkasaroy|Shayxontohur|Chilonzor|Olmazor|Yashnobod|Sergeli|Uchtepa|Bektemir|Yangihayot",
  en: "Mirabad|Yunusabad|Mirzo Ulugbek|Yakkasaray|Shaykhantakhur|Chilanzar|Almazar|Yashnabad|Sergeli|Uchtepa|Bektemir|Yangikhayot",
};
const WD = { ru: "Вс|Пн|Вт|Ср|Чт|Пт|Сб", uz: "Ya|Du|Se|Ch|Pa|Ju|Sh", en: "Sun|Mon|Tue|Wed|Thu|Fri|Sat" };
const PRIV = { ids: ["d7b802-nolp", "u7b404-1500", "b7b803-3042", "i5e010-orag", "h5bf02-0000", "q3a005-1526"], off: 30 };
const privUntil = (l) => T(l)("2 ноября", "2-noyabr", "2 November");
function boutique(l) {
  const t = T(l);
  return {
    name: L3(D.BOUTIQUE.name, l), short: L3(D.BOUTIQUE.short, l), addr: L3(D.BOUTIQUE.addr, l), hours: D.BOUTIQUE.hours,
    ig: `https://instagram.com/${D.BRAND.ig}`, igName: D.BRAND.ig, dm: `https://ig.me/m/${D.BRAND.ig}`,
    img: "roots.webp", alt: t("Знак Baldinini, кампания Heritage", "Baldinini belgisi, Heritage kampaniyasi", "Baldinini mark, Heritage campaign"),
  };
}
function shopData(l) {
  const t = T(l);
  return {
    lang: l, locale: { ru: "ru-RU", uz: "uz-Latn-UZ", en: "en-GB" }[l], title: t(`${B} Tashkent · магазин · макет DevUz Studio`, `${B} Tashkent · do‘kon · DevUz Studio maketi`, `${B} Tashkent · store · DevUz Studio mockup`),
    img: IMG, ui: shopUi(l), products: prods(l), cats: D.CATS.map((c) => ({ id: c.id, n: L3(c.n, l), tile: c.tile })),
    colors: D.COLOR_F.map((c) => ({ id: c.id, hex: c.hex, n: L3(c.n, l) })), mats: D.MATS.map((m) => ({ id: m.id, n: L3(m.n, l) })),
    prices: [[0, 4999999, t("до 5 млн сум", "5 mln so‘mgacha", "up to 5M UZS")], [5000000, 7499999, t("5-7,5 млн сум", "5-7,5 mln so‘m", "5-7.5M UZS")], [7500000, 1e9, t("от 7,5 млн сум", "7,5 mln so‘mdan", "7.5M UZS and up")]],
    ...SIZE_DATA, boutique: boutique(l), wd: WD[l].split("|"), districts: DISTRICTS[l].split("|"), code: "1234", terms: TERMS(l), priv: { ...PRIV, until: privUntil(l) },
    season: L3(D.LINES.fw, l),
    hero: { wide: "hero-lift.webp", tall: "hero-tall.webp", alt: t("Кампания Baldinini осень-зима 2026/27", "Baldinini kuz-qish 2026/27 kampaniyasi", "Baldinini fall-winter 2026/27 campaign") },
    story: {
      img: "craft-sole.webp", alt: t("Мастер Baldinini работает с подошвой, Сан-Мауро-Пасколи", "Baldinini ustasi taglik ustida ishlamoqda, San-Mauro-Paskoli", "A Baldinini craftsman working on a sole, San Mauro Pascoli"),
      h: t("С 1910 года, Сан-Мауро-Пасколи", "1910 yildan, San-Mauro-Paskoli", "Since 1910, San Mauro Pascoli"),
      p: [
        t("Baldinini начинался с обуви на заказ в маленькой мастерской в Сан-Мауро-Пасколи, обувном районе Эмилии-Романьи. Компания и сейчас там же и остаётся семейной.", "Baldinini Emiliya-Romanyaning poyabzal hududi San-Mauro-Paskolidagi kichik ustaxonada buyurtma poyabzaldan boshlangan. Kompaniya hozir ham o‘sha yerda va oilaviy bo‘lib qolmoqda.", "Baldinini began with made-to-order shoes in a small workshop in San Mauro Pascoli, the shoemaking district of Emilia-Romagna. The company is still there and still family-run."),
        t("Строчку по-прежнему делают вручную, как и мелкие детали: перфорацию, вставки, профили.", "Chok hamon qo‘lda tikiladi, mayda detallar ham: perforatsiya, qo‘yilmalar, profillar.", "Stitching is still done by hand, along with the small details: perforation, inserts, edging."),
      ],
      facts: [["1910", t("семейная мастерская", "oilaviy ustaxona", "a family workshop")], ["Made in Italy", t("на каждой модели сезона", "mavsumning har bir modelida", "on every model of the season")], ["Texano", t("казаки бренда с середины 1980-х", "1980-yillar o‘rtasidan brend kazakilari", "the brand’s cowboy boot since the mid-1980s")]],
    },
    care: {
      leather: t("Протирайте мягкой сухой тканью, кремом в цвет раз в несколько носок. Сушите вдали от батареи, храните с колодкой или бумагой внутри.", "Yumshoq quruq mato bilan arting, bir necha kiyishda bir marta rangiga mos krem surting. Batareyadan uzoqda quriting, ichiga qolip yoki qog‘oz solib saqlang.", "Wipe with a soft dry cloth and use a matching cream every few wears. Dry away from heaters; store with shoe trees or paper inside."),
      suede: t("Щётка для замши после каждой носки, защитный спрей перед первым выходом. Мокрую замшу сушите при комнатной температуре.", "Har kiyishdan keyin zamsh cho‘tkasi, birinchi chiqishdan oldin himoya sprey. Ho‘l zamshni xona haroratida quriting.", "Brush suede after each wear and use a protective spray before the first outing. Dry wet suede at room temperature."),
      tumbled: t("Зернистую кожу достаточно протирать влажной тканью и раз в месяц питать бесцветным кремом.", "Donador terini nam mato bilan artish va oyiga bir marta rangsiz krem bilan oziqlantirish kifoya.", "Wipe tumbled leather with a damp cloth and feed it with a neutral cream once a month."),
      calfhair: t("Ворс чистят сухой мягкой щёткой по направлению ворса. Воды и крема не нужно.", "Tukni yumshoq quruq cho‘tka bilan tuk yo‘nalishi bo‘yicha tozalang. Suv va krem kerak emas.", "Brush calf hair dry and gently, in the direction of the hair. No water or cream."),
      lizard: t("Протирайте сухой тканью, храните в пыльнике.", "Quruq mato bilan arting, chang xaltasida saqlang.", "Wipe with a dry cloth and keep in the dust bag."),
    },
    pays: [
      { id: "click", n: "Click", i: "wallet", p: "" }, { id: "payme", n: "Payme", i: "wallet", p: "" }, { id: "uzumbank", n: "Uzum Bank", i: "wallet", p: "" },
      { id: "uzcard", n: "Uzcard / Humo", i: "card", p: "" }, { id: "visa", n: "Visa / Mastercard", i: "card", p: "" },
      { id: "cash", n: t("Наличными или картой при получении", "Olishda naqd yoki karta bilan", "Cash or card on delivery"), i: "cash", p: "" },
    ],
    nasiya: [{ id: "uzum", n: "Uzum Nasiya" }, { id: "alif", n: "Alif Nasiya" }],
    levels: [
      { n: t("Новый клиент", "Yangi mijoz", "New client"), p: t("Сохраните размеры, и карточки будут показывать их сразу.", "O‘lchamlaringizni saqlang, kartochkalar ularni darhol ko‘rsatadi.", "Save your sizes and product pages will show them at once."), from: 0 },
      { n: t("Клиент бутика", "Butik mijozi", "Boutique client"), p: t("Закрытые распродажи и ранний доступ к новому сезону.", "Yopiq chegirmalar va yangi mavsumga erta kirish.", "Private sales and early access to the new season."), from: 1 },
      { n: t("Близкий круг", "Yaqin davra", "Inner circle"), p: t("Личный продавец, примерка в бутике в любое время, подарок ко дню рождения.", "Shaxsiy sotuvchi, butikda istalgan vaqtda kiyib ko‘rish, tug‘ilgan kunga sovg‘a.", "A personal seller, boutique try-on any time, a birthday gift."), from: 25000000 },
    ],
  };
}

/* ── Данные панели (демо) ─────────────────────────────────────────────── */
const SELLERS = [["Дилноза", "Dilnoza", "Dilnoza"], ["Шахзод", "Shahzod", "Shahzod"], ["Камила", "Kamila", "Kamila"], ["Тимур", "Temur", "Timur"]];
const CLIENTS = [
  ["Нигора Р.", "Nigora R.", "Nigora R.", 1, "38", null, ["лодочки, чёрный", "tuflilar, qora", "pumps, black"], "12.11"],
  ["Ботир К.", "Botir K.", "Botir K.", 1, null, "43", ["лоферы, без каблука", "loferlar", "loafers"], "03.12", ["берёт на размер больше", "bir o‘lcham kattasini oladi", "takes a size up"]],
  ["Севара А.", "Sevara A.", "Sevara A.", 1, "37", null, ["сапоги и сумки, бордо", "etik va sumkalar, bordo", "boots and bags, burgundy"], "24.10"],
  ["Феруза М.", "Feruza M.", "Feruza M.", 1, "39", null, ["принт, балетки", "naqsh, baletkalar", "prints, flats"], "08.01"],
  ["Тимур Х.", "Temur X.", "Timur Kh.", 1, null, "42", ["ботинки, коричневый", "botinkalar, jigarrang", "boots, brown"], "17.02", ["ждёт новые ботинки к зиме", "qishga yangi botinka kutmoqda", "waiting for new winter boots"]],
  ["Лола Ш.", "Lola Sh.", "Lola Sh.", 1, "36.5", null, ["каблук до 6 см", "6 sm gacha poshna", "heels up to 6 cm"], "29.10"],
  ["Анвар Т.", "Anvar T.", "Anvar T.", 0, null, "44"], ["Мохира Д.", "Mohira D.", "Mohira D.", 1, "38.5", null, ["сумки через плечо", "yelkadan osma sumkalar", "crossbody bags"], "05.11"],
  ["Ирина С.", "Irina S.", "Irina S.", 0, "40", null], ["Джамшид У.", "Jamshid U.", "Jamshid U.", 1, null, "41", ["кроссовки", "krossovkalar", "sneakers"], "21.12"],
  ["Дильфуза Н.", "Dilfuza N.", "Dilfuza N.", 0, "37.5", null], ["Азиз Б.", "Aziz B.", "Aziz B.", 0, null, "43.5"], ["Малика О.", "Malika O.", "Malika O.", 1, "37", null, ["казаки, лоферы", "kazakilar, loferlar", "cowboy boots, loafers"], "14.03"],
  ["Рустам Ю.", "Rustam Yu.", "Rustam Yu.", 0, null, "42.5"], ["Шахноза И.", "Shahnoza I.", "Shahnoza I.", 0, "39", null], ["Олег П.", "Oleg P.", "Oleg P.", 0, null, "44.5"],
];
function panelData(l) {
  const t = T(l);
  const sell = SELLERS.map((s) => ({ n: L3(s, l) }));
  return {
    lang: l, img: IMG, ui: panelUi(l), products: prods(l).map(({ id, n, color, line, cat, price, sizes, stock, cs, pop }) => ({ id, n, color, line, cat, price, sizes, stock, cs, pop })),
    sellers: sell, me: t("Вы (владелец)", "Siz (ega)", "You (owner)"), head: t("Гульнора, управляющая", "Gulnora, boshqaruvchi", "Gulnora, manager"),
    clients: CLIENTS.map((c, i) => ({ n: L3(c, l), ph: `+998 9${(i * 3) % 10} *** ${10 + i * 5} ${20 + i * 3}`, vip: !!c[3], szw: c[4], szm: c[5], like: c[6] ? L3(c[6], l) : "", bday: c[7] || "", note: c[8] ? L3(c[8], l) : "" })),
    sources: [
      { id: "ig", n: "Instagram", w: 36 }, { id: "google", n: "Google", w: 17 }, { id: "direct", n: t("Прямые заходы", "To‘g‘ridan-to‘g‘ri", "Direct"), w: 15 }, { id: "tg", n: "Telegram", w: 12 },
      { id: "yandex", n: t("Яндекс", "Yandex", "Yandex"), w: 8 }, { id: "maps", n: t("Карты", "Xaritalar", "Maps"), w: 7 }, { id: "ads", n: t("Реклама", "Reklama", "Ads"), w: 5 },
    ],
    igParts: [{ n: t("Ссылка в профиле", "Profildagi havola", "Profile link"), w: 38 }, { n: t("Сторис", "Storislar", "Stories"), w: 34 }, { n: t("Переписка", "Yozishma", "Direct messages"), w: 20 }, { n: t("Посты", "Postlar", "Posts"), w: 8 }],
    pays: [{ id: "click", n: "Click" }, { id: "payme", n: "Payme" }, { id: "uzumbank", n: "Uzum Bank" }, { id: "card", n: "Uzcard / Humo" }, { id: "uzcard", n: "Uzcard / Humo" }, { id: "visa", n: "Visa / Mastercard" }, { id: "cash", n: t("Наличные", "Naqd", "Cash") }, { id: "nasiya", n: t("Рассрочка", "Muddatli to‘lov", "Instalments") }],
    tiers: { std: PANELS.std.sections, pro: PANELS.pro.sections }, priv: { ...PRIV, until: privUntil(l) }, wd: WD[l].split("|"),
    cards: t("С днём рождения! Носи с удовольствием|Маме, с любовью|С годовщиной!|Для лучшего друга", "Tug‘ilgan kuning bilan! Mamnuniyat bilan kiy|Onamga, mehr bilan|Yubiley bilan!|Eng yaqin do‘stga", "Happy birthday! Wear them well|For Mum, with love|Happy anniversary!|For my best friend").split("|"),
    logActs: [
      { k: "st", who: "s", v: ["{o}: " + t("Собран", "Yig‘ildi", "Packed"), "{o}: " + t("Вручён", "Topshirildi", "Delivered")] }, { k: "call", who: "s", v: ["{o}"] }, { k: "photo", who: "s", v: ["{o}"] },
      { k: "hold", who: "s", v: ["EU 38", "EU 42"] }, { k: "stock", who: "h", v: ["EU 37: 2", "EU 43: 1"] }, { k: "try_ok", who: "s", v: ["TR-905", "TR-911"] }, { k: "wrap", who: "s", v: ["{o}"] },
    ],
  };
}

/* ── Общая шапка документа ──────────────────────────────────────────── */
function headTags(l, title, desc) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#ffffff">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#000"/><path fill="#fff" d="M9 8h9.5c3 0 5 1.7 5 4 0 1.5-1 2.7-2.6 3.3 1.9.6 3.1 2 3.1 3.8 0 2.4-2 4.9-5 4.9H9zm2 1v6h7c1.8 0 3-1.2 3-3s-1.2-3-3-3zm0 7v6h7.6c1.6 0 2.9-1.3 2.9-3 0-1.8-1.3-3-3-3z"/></svg>')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}
const langs = (l, path, cls = "lang") => `<div class="${cls}">${LANGS.map((x) => `<a href="${href(x, path)}" hreflang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>`;
const strip2 = (l) => {
  const t = T(l);
  return `<p class="demo-strip">${t("Макет DevUz Studio · цены и остатки демо", "DevUz Studio maketi · narx va qoldiqlar demo", "DevUz Studio mockup · demo prices and stock")} <a href="${href(l)}#cena">${t("Стоимость", "Narxi", "Pricing")}</a></p>`;
};

/* ── Магазин ────────────────────────────────────────────────────────── */
function shopPage(l) {
  const t = T(l);
  const nav = D.CATS.filter((c) => c.id !== "all").map((c) => [c.id, `#/c/${c.id}`, L3(c.n, l)]).concat([["boutique", "#/boutique", t("Бутик", "Butik", "Boutique")]]);
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t(`${B} Tashkent · магазин · макет DevUz Studio`, `${B} Tashkent · do‘kon · DevUz Studio maketi`, `${B} Tashkent · store · DevUz Studio mockup`), t("Макет интернет-магазина Baldinini Tashkent: коллекция осень-зима 2026/27, размер и наличие в бутике, примерка в Tashkent City, доставка с примеркой.", "Baldinini Tashkent internet-do‘koni maketi: kuz-qish 2026/27 kolleksiyasi, o‘lcham va butikda borligi, Tashkent Cityda kiyib ko‘rish, kiyib ko‘rishli yetkazish.", "Baldinini Tashkent online store mockup: fall-winter 2026/27, sizes and boutique stock, try-on at Tashkent City, delivery with try-on."))}
@@A@@
</head>
<body class="shop" data-lang="${l}">
${sprite()}
<a class="skip" href="#view">${t("К содержанию", "Asosiy qismga", "Skip to content")}</a>
<header class="top" id="top">${strip2(l)}<div class="hd"><div class="hd-in">
<button type="button" class="ib" id="menu-b" aria-label="${t("Меню", "Menyu", "Menu")}">${ic("menu")}</button>
<a class="logo" href="#/" aria-label="${B}">${logo()}</a>
<nav class="hd-nav" aria-label="${t("Разделы", "Bo‘limlar", "Sections")}">${nav.map(([k, u, n]) => `<a href="${u}" data-nav="${k}">${n}</a>`).join("")}</nav>
<div class="hd-act">${langs(l, "shop", "lang-s")}<a href="#/me?fv" class="ib" aria-label="${t("Избранное", "Sevimlilar", "Favourites")}">${ic("heart")}<b class="bdg" data-badge="fav" hidden>0</b></a><a href="#/me" class="ib" aria-label="${t("Кабинет", "Kabinet", "Account")}">${ic("user")}</a><a href="#/cart" class="ib cart-ic" aria-label="${t("Корзина", "Savat", "Bag")}">${ic("bag")}<b class="bdg" data-badge="cart" hidden>0</b></a></div>
</div></div></header>
<div id="menu" hidden><div class="mn-back" data-close></div><nav class="mn" aria-label="${t("Меню", "Menyu", "Menu")}"><button type="button" class="ib" data-close aria-label="${t("Закрыть", "Yopish", "Close")}">${ic("x")}</button>${nav.map(([k, u, n]) => `<a href="${u}" data-nav="${k}">${n}</a>`).join("")}<a href="#/me">${t("Кабинет", "Kabinet", "Account")}</a><a href="#/private">${t("Закрытые распродажи", "Yopiq chegirmalar", "Private sales")}</a>${langs(l, "shop", "lang-m")}</nav></div>
<main id="view" tabindex="-1"></main>
<footer class="sfoot"><div class="wrap">${logo("f-logo")}<p>${L3(D.BOUTIQUE.addr, l)}<br>${t("Будни", "Ish kunlari", "Weekdays")} ${D.BOUTIQUE.hours[0]} · ${t("выходные", "dam olish kunlari", "weekends")} ${D.BOUTIQUE.hours[1]}</p>
<p><a href="https://instagram.com/${D.BRAND.ig}" rel="noopener">${ic("ig")} @${D.BRAND.ig}</a></p>
<p class="muted">${t("Макет DevUz Studio. Товары и фото: официальный каталог Baldinini; цены в сумах и остатки: демо.", "DevUz Studio maketi. Mahsulotlar va suratlar: Baldinini rasmiy katalogi; so‘mdagi narxlar va qoldiqlar: demo.", "DevUz Studio mockup. Products and photos: the official Baldinini catalogue; UZS prices and stock: demo.")} <a href="${TERMS(l)}">${t("Условия использования", "Foydalanish shartlari", "Terms of use")}</a> · <a href="${href(l, "panel")}">${t("Панель магазина", "Do‘kon paneli", "Store panel")}</a></p></div></footer>
<div id="sheet" hidden></div>
<div id="zoom" hidden role="dialog" aria-modal="true" aria-label="${t("Фото", "Surat", "Photo")}"></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="bd-data">${json(shopData(l))}</script>
@@P@@
</body>
</html>`;
}

/* ── Панель ─────────────────────────────────────────────────────────── */
const NAV_IC = { orders: "box", tryon: "hanger", goods: "tag", clients: "users", gifts: "gift", returns: "swap", team: "shield", dash: "grid", traffic: "chart", vip: "star", private: "key", restock: "layers", sellers: "user" };
function panelPage(l) {
  const t = T(l), U = panelUi(l);
  const item = (k) => `<a href="#${k}">${ic(NAV_IC[k])}<span>${U["n_" + k]}</span>${k === "orders" || k === "tryon" ? `<i data-cnt="${k}" hidden>0</i>` : ""}${PANELS.pro.sections.includes(k) ? ic("lock", "lk") : ""}</a>`;
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t(`Панель бутика ${B} Tashkent · макет DevUz Studio`, `${B} Tashkent butik paneli · DevUz Studio maketi`, `${B} Tashkent boutique panel · DevUz Studio mockup`), t("Панель бутика Baldinini Tashkent: заказы, примерки, остатки по размерам, клиенты, подарки, возвраты, роли; в Расширенной: прибыль, посещаемость, VIP, закрытые распродажи, новый сезон, продавцы.", "Baldinini Tashkent butik paneli: buyurtmalar, kiyib ko‘rishlar, o‘lchamlar bo‘yicha qoldiq, mijozlar, sovg‘alar, qaytarishlar, rollar; Kengaytirilganda: foyda, tashriflar, VIP, yopiq chegirmalar, yangi mavsum, sotuvchilar.", "Baldinini Tashkent boutique panel: orders, try-ons, stock by size, clients, gifts, returns, roles; Extended adds profit, traffic, VIP, private sales, new season and sellers."))}
@@K@@
</head>
<body class="panel" data-lang="${l}">
${sprite()}
${strip2(l)}
<div class="app">
<div class="nav-back" onclick="document.body.classList.remove('nav-on')"></div>
<aside class="side-nav" aria-label="${t("Разделы панели", "Panel bo‘limlari", "Panel sections")}">
<div class="brand">${logo()}<small>${t("Панель бутика", "Butik paneli", "Boutique panel")}</small></div>
<div class="tier"><p>${t("Уровень панели", "Panel darajasi", "Panel tier")}</p><div role="radiogroup" aria-label="${t("Уровень панели", "Panel darajasi", "Panel tier")}"><button type="button" role="radio" data-tier="std">${U.tierStd}<small>+${PANELS.std.price} $</small></button><button type="button" role="radio" data-tier="pro">${U.tierPro}<small>+${PANELS.pro.price} $</small></button></div></div>
<nav class="nav"><p class="ng">${L3([PANELS.std.ru.t, PANELS.std.uz.t, PANELS.std.en.t], l)}</p>${PANELS.std.sections.map(item).join("")}<p class="ng pro">${L3([PANELS.pro.ru.t, PANELS.pro.uz.t, PANELS.pro.en.t], l)}</p>${PANELS.pro.sections.map(item).join("")}</nav>
<div class="role"><label for="role">${t("Смотреть как", "Kim sifatida ko‘rish", "View as")}</label><select id="role"><option value="owner">${U.r_owner}</option><option value="head">${U.r_head}</option><option value="seller">${U.r_seller}</option></select>
<a class="to-shop" href="${href(l, "shop")}">${ic("bag")}<span>${t("Открыть магазин", "Do‘konni ochish", "Open the store")}</span></a></div>
</aside>
<div class="main">
<header class="topbar"><button type="button" class="ib" id="menu-b" aria-label="${t("Меню", "Menyu", "Menu")}">${ic("menu")}</button>${logo("lw")}<span class="sp"></span>${langs(l, "panel", "lang-s")}<span class="av" aria-hidden="true">${t("В", "S", "Y")}</span></header>
<main id="pv"></main>
<p class="demo">${t("Макет DevUz Studio: данные панели демо.", "DevUz Studio maketi: panel ma’lumotlari demo.", "DevUz Studio mockup: panel data is demo.")} <a href="${TERMS(l)}">${t("Условия использования", "Foydalanish shartlari", "Terms of use")}</a></p>
</div></div>
<div id="side" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="bp-data">${json(panelData(l))}</script>
@@Q@@
</body>
</html>`;
}

/* ── Страница-презентация ───────────────────────────────────────────── */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZSIGN = `<svg class="dz-sign" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;
function introHtml(l) {
  const t = T(l);
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  return `<div class="intro" id="intro" role="presentation">
${DZ_VIDEO}
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t(`макет интернет-магазина для ${B} Tashkent`, `${B} Tashkent uchun internet-do‘kon maketi`, `an online store mockup for ${B} Tashkent`)}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<canvas class="bd-cv" aria-hidden="true" data-logo="${esc(JSON.stringify(D.LOGO.map(([d, ev]) => [d, ev ? 1 : 0])))}" data-name="Tashkent City Mall"></canvas>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish", "Skip")}</button>
</div>`;
}
const head = (kicker, h, lead) => `<div class="sec-head rv"><p class="kicker">${kicker}</p><h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>`;
const phone = (l, path, id) => `<div class="iph" id="${id}"><div class="iph-in"><div class="iscr"><iframe title="${T(l)("Магазин Baldinini", "Baldinini do‘koni", "Baldinini store")}" data-src="${href(l, "shop")}?embed=1${path}" loading="lazy"></iframe></div><span class="iisl" aria-hidden="true"></span></div></div>`;

function heroBlock(l) {
  const t = T(l);
  return `<section class="hero" id="hero">
<div class="hero-ph" aria-hidden="true"><picture data-par><source media="(orientation: portrait)" srcset="${IMG}/hero-tall.webp"><img src="${IMG}/hero-man.webp" alt="" width="1600" height="900" fetchpriority="high"></picture></div>
<div class="hero-txt wrap"><p class="kicker">${t("Макет интернет-магазина · Tashkent City Mall", "Internet-do‘kon maketi · Tashkent City Mall", "Online store mockup · Tashkent City Mall")}</p>
<h1>${t("Бутик Baldinini в Tashkent City теперь и в телефоне", "Tashkent Citydagi Baldinini butigi endi telefonda ham", "The Baldinini boutique at Tashkent City, now on the phone")}</h1>
<p class="lead">${t("Коллекция осень-зима 2026/27 с ценами в сумах, размер и наличие в бутике, бронь примерки, доставка с примеркой у двери. Это работающий макет: всё нажимается.", "Kuz-qish 2026/27 kolleksiyasi so‘mdagi narxlar bilan, o‘lcham va butikda borligi, kiyib ko‘rishga bron, eshik oldida kiyib ko‘rib yetkazish. Bu ishlaydigan maket: hammasi bosiladi.", "The fall-winter 2026/27 collection priced in UZS, sizes and boutique stock, try-on booking, delivery with try-on at the door. A working mockup: everything responds.")}</p>
<div class="hero-cta"><a class="btn btn-w" href="${href(l, "shop")}">${t("Открыть магазин", "Do‘konni ochish", "Open the store")}</a><a class="btn btn-line" href="#cena">${t("Стоимость", "Narxi", "Pricing")}</a></div></div>
<p class="hero-cap wrap">${t("Фото: кампания Baldinini осень-зима 2026/27", "Surat: Baldinini kuz-qish 2026/27 kampaniyasi", "Photo: Baldinini fall-winter 2026/27 campaign")}</p>
</section>`;
}
function nowBlock(l) {
  const t = T(l);
  const now = [
    t("Instagram @baldininitashkent и страница в каталоге Tashkent City Mall: своего сайта нет.", "Instagram @baldininitashkent va Tashkent City Mall katalogidagi sahifa: o‘z sayti yo‘q.", "Instagram @baldininitashkent and a page in the Tashkent City Mall directory: no website of its own."),
    t("Цену, размер и наличие спрашивают в переписке и ждут ответа.", "Narx, o‘lcham va borligini yozishmada so‘rashadi va javob kutishadi.", "People ask for price, size and stock in messages and wait for a reply."),
    t("В поиске по «Baldinini» первыми выходят маркетплейсы: на Ozon под маркой тысячи предложений сторонних продавцов.", "«Baldinini» qidiruvida birinchi bo‘lib marketpleyslar chiqadi: Ozonda brend nomi ostida minglab begona sotuvchi takliflari.", "A search for “Baldinini” shows marketplaces first: Ozon lists thousands of third-party offers under the name."),
  ];
  const next = [
    t("Свой магазин с коллекцией сезона, ценами в сумах и наличием размера в бутике.", "Mavsum kolleksiyasi, so‘mdagi narxlar va butikda o‘lcham borligi bilan o‘z do‘koni.", "Your own store with the season’s collection, UZS prices and size availability in the boutique."),
    t("Ссылка из сторис ведёт сразу в карточку: размер, примерка, заказ.", "Storisdagi havola darhol kartochkaga olib boradi: o‘lcham, kiyib ko‘rish, buyurtma.", "A story link opens the product page straight away: size, try-on, order."),
    t("Оригинал из бутика Tashkent City, с примеркой и консультантом, на вашем адресе.", "Tashkent City butigidan original, kiyib ko‘rish va konsultant bilan, o‘z manzilingizda.", "The original from the Tashkent City boutique, with try-on and a consultant, at your own address."),
  ];
  return `<section class="now" id="seychas"><div class="wrap">
${head(t("Сейчас и станет", "Hozir va keyin", "Now and next"), t("Покупатель уже ищет вас в телефоне", "Xaridor sizni allaqachon telefonda qidirmoqda", "Your client is already looking for you on the phone"))}
<div class="nw"><div class="nw-c rv"><h3>${t("Сейчас", "Hozir", "Now")}</h3><ul>${now.map((x) => `<li>${x}</li>`).join("")}</ul></div><div class="nw-c next rv"><h3>${t("С магазином", "Do‘kon bilan", "With the store")}</h3><ul>${next.map((x) => `<li>${ic("check")}<span>${x}</span></li>`).join("")}</ul></div></div>
</div></section>`;
}
function buyerBlock(l) {
  const t = T(l);
  const pts = [
    ["ig", t("Приходит из Instagram", "Instagramdan keladi", "Arrives from Instagram"), t("Смотрит с телефона между делами. Цена и свой размер должны быть видны сразу, без переписки.", "Ish orasida telefondan ko‘radi. Narx va o‘z o‘lchami yozishmasiz darhol ko‘rinishi kerak.", "Browses on the phone between other things. Price and their size must be visible at once, without messaging.")],
    ["hanger", t("Сначала примеряет", "Avval kiyib ko‘radi", "Tries on first"), t("Дорогую пару покупают после примерки. Поэтому бронь в бутике и курьер, который ждёт, пока клиент примерит.", "Qimmat juftlik kiyib ko‘rilgandan keyin olinadi. Shuning uchun butikda bron va mijoz kiyib ko‘rguncha kutadigan kuryer.", "An expensive pair is bought after trying it on. Hence a boutique booking and a courier who waits during the try-on.")],
    ["shield", t("Платит за оригинал", "Original uchun to‘laydi", "Pays for the original"), t("Италия, кожа внутри, текущий сезон из официального бутика, а не карточка неизвестного продавца.", "Italiya, ichi teri, rasmiy butikdan joriy mavsum, noma’lum sotuvchining kartochkasi emas.", "Italy, leather inside, the current season from the official boutique rather than an unknown seller’s listing.")],
    ["gift", t("Ждёт тихого сервиса", "Sokin xizmat kutadi", "Expects quiet service"), t("Консультант, коробка с открыткой, закрытые цены для своих. Без кричащих скидок на витрине.", "Konsultant, otkritkali quti, o‘zimiznikilar uchun yopiq narxlar. Vitrinada baqiriq chegirmalarsiz.", "A consultant, a box with a card, private prices for regulars. No loud discounts in the window.")],
  ];
  return `<section class="buyer" id="pokupatel"><div class="wrap">
${head(t("Кто покупает", "Kim xarid qiladi", "Who buys"), t("Покупатель Baldinini в Ташкенте", "Toshkentdagi Baldinini xaridori", "The Baldinini client in Tashkent"), t("Магазин построен вокруг четырёх привычек. Соседи по этажу (Cole Haan, Ecco, Vitacci) продают удобство; Baldinini продаёт итальянскую пару, в которой удобно и которую замечают.", "Do‘kon to‘rtta odat atrofida qurilgan. Qavatdagi qo‘shnilar (Cole Haan, Ecco, Vitacci) qulaylik sotadi; Baldinini qulay va ko‘zga tashlanadigan italyan juftligini sotadi.", "The store is built around four habits. Floor neighbours (Cole Haan, Ecco, Vitacci) sell comfort; Baldinini sells an Italian pair that is comfortable and gets noticed."))}
<div class="by">${pts.map(([i, h, p]) => `<div class="by-c rv">${ic(i)}<h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>`;
}
function pathBlock(l) {
  const t = T(l);
  const steps = [
    ["#/", t("Главная сезона", "Mavsum bosh sahifasi", "Season home"), t("Фото кампании, разделы, бутик и часы работы", "Kampaniya suratlari, bo‘limlar, butik va ish vaqti", "Campaign photos, sections, boutique and hours")],
    ["#/c/w", t("Каталог", "Katalog", "Catalogue"), t("Фильтры в шторке: размер, цвет, материал, каблук, цена", "Pardadagi filtrlar: o‘lcham, rang, material, poshna, narx", "Filters in a sheet: size, colour, material, heel, price")],
    ["#/p/d7b704-0000", t("Карточка", "Kartochka", "Product page"), t("Фото с приближением, EU и RU, подсказка по размеру, наличие в бутике", "Kattalashtiriladigan suratlar, EU va RU, o‘lcham maslahati, butikda borligi", "Zoomable photos, EU and RU, size guide, boutique stock")],
    ["#/p/d7b220-bene", t("Примерка и образ", "Kiyib ko‘rish va obraz", "Try-on and look"), t("Бронь примерки в Tashkent City, вопрос консультанту, «соберите образ»", "Tashkent Cityda kiyib ko‘rish broni, konsultantga savol, «obrazni yig‘ing»", "Try-on booking at Tashkent City, ask a consultant, complete the look")],
    ["#/cart", t("Корзина", "Savat", "Bag"), t("Подарочная упаковка и открытка с вашим текстом", "Sovg‘a qadoqlash va matningiz bilan otkritka", "Gift wrapping and a card with your message")],
    ["#/checkout", t("Оформление", "Rasmiylashtirish", "Checkout"), t("Код вместо пароля, курьер или самовывоз, Click, Payme, Uzum, карты, наличные", "Parol o‘rniga kod, kuryer yoki olib ketish, Click, Payme, Uzum, kartalar, naqd", "A code instead of a password, courier or pickup, Click, Payme, Uzum, cards, cash")],
    ["#/me", t("Кабинет", "Kabinet", "Account"), t("Заказы по шагам, брони, мои размеры, уровень клиента", "Bosqichli buyurtmalar, bronlar, o‘lchamlarim, mijoz darajasi", "Orders step by step, bookings, saved sizes, client tier")],
    ["#/private", t("Для своих", "O‘zimiznikilar uchun", "For regulars"), t("Закрытые распродажи по приглашению", "Taklif bo‘yicha yopiq chegirmalar", "Private sales by invitation")],
  ];
  return `<section class="path" id="put"><div class="wrap">
${head(t("Магазин", "Do‘kon", "The store"), t("Путь покупателя: нажмите шаг", "Xaridor yo‘li: qadamni bosing", "The client journey: tap a step"), t("Справа настоящий магазин из макета. Можно пройти весь путь: выбрать размер, забронировать примерку, оформить и оплатить заказ. Потом откройте панель ниже: заказ и бронь уже там.", "O‘ngda maketdagi haqiqiy do‘kon. Butun yo‘lni o‘tish mumkin: o‘lcham tanlash, kiyib ko‘rishni bron qilish, buyurtma berish va to‘lash. Keyin quyidagi panelni oching: buyurtma va bron allaqachon u yerda.", "On the right is the real store from the mockup. Walk the whole journey: pick a size, book a try-on, place and pay for an order. Then open the panel below: the order and the booking are already there."))}
<div class="pt"><ol class="pt-s">${steps.map(([h, n, d], i) => `<li class="rv"><button type="button" data-go="${h}"${i ? "" : ' aria-current="step"'}><i>${i + 1}</i><span><b>${n}</b><small>${d}</small></span></button></li>`).join("")}</ol>
<div class="pt-ph rv">${phone(l, "#/", "ph-path")}<a class="btn" href="${href(l, "shop")}">${ic("full")}<span>${t("Магазин во весь экран", "Do‘kon to‘liq ekranda", "Store full screen")}</span></a></div></div>
</div></section>`;
}
function luxBlock(l) {
  const t = T(l);
  const items = [
    ["hanger", t("Примерка по брони", "Bron bo‘yicha kiyib ko‘rish", "Try-on by appointment"), t("Выбрали модель и размер, пару отложат к приходу.", "Model va o‘lcham tanlandi, juftlik kelishga ajratib qo‘yiladi.", "Pick a model and size; the pair is set aside for the visit."), "Ferragamo, Tod’s, Stuart Weitzman"],
    ["chat", t("Консультант в переписке", "Yozishmadagi konsultant", "A consultant in chat"), t("Подскажет полноту и пришлёт фото на ноге.", "Kenglikni aytadi va oyoqdagi suratni yuboradi.", "Advises on fit and sends photos on foot."), "Net-a-Porter, Saks, Neiman Marcus"],
    ["key", t("Закрытые распродажи", "Yopiq chegirmalar", "Private sales"), t("Особые цены видят только свои, витрина спокойная.", "Maxsus narxlarni faqat o‘zimiznikilar ko‘radi, vitrina sokin.", "Special prices for regulars only; the window stays calm."), "Baldinini Eternity Club, Mytheresa"],
    ["gift", t("Коробка и открытка", "Quti va otkritka", "Box and card"), t("Подарок упакуют и подпишут вашими словами.", "Sovg‘a qadoqlanadi va so‘zlaringiz bilan imzolanadi.", "The gift is wrapped and signed with your words."), "Mytheresa, Net-a-Porter, Nordstrom"],
    ["ruler", t("Подсказка по размеру", "O‘lcham maslahati", "Size guide"), t("Таблица бренда EU, US, UK и расчёт по длине стопы.", "Brend jadvali EU, US, UK va oyoq uzunligi bo‘yicha hisob.", "The brand chart in EU, US, UK and a foot-length check."), "Baldinini, Mytheresa"],
    ["bell", t("«Мой размер появился»", "«O‘lchamim keldi»", "“My size is back”"), t("Нет размера: клиент оставляет номер и узнаёт первым.", "O‘lcham yo‘q: mijoz raqam qoldiradi va birinchi bo‘lib biladi.", "Size out of stock: the client leaves a number and hears first."), "Mytheresa, Net-a-Porter"],
    ["layers", t("Соберите образ", "Obrazni yig‘ing", "Complete the look"), t("Сумка и ремень в тон к паре, одной кнопкой.", "Juftlikka mos sumka va kamar, bitta tugma bilan.", "A bag and belt to match the pair, in one tap."), "Baldinini, Mytheresa, Saks"],
    ["truck", t("Доставка с примеркой", "Kiyib ko‘rishli yetkazish", "Delivery with try-on"), t("Курьер ждёт примерку, что не подошло, забирает.", "Kuryer kiyib ko‘rishni kutadi, mos kelmaganini olib ketadi.", "The courier waits during the try-on and takes back what doesn’t fit."), t("местная замена бесплатного возврата Nordstrom и Mytheresa", "Nordstrom va Mytheresa bepul qaytarishining mahalliy o‘rnini bosuvchisi", "the local version of free returns at Nordstrom and Mytheresa")],
  ];
  return `<section class="lux" id="lyuks"><div class="wrap">
${head(t("Как продают люкс", "Lyuks qanday sotiladi", "How luxury sells online"), t("Восемь приёмов из Италии, США и Европы", "Italiya, AQSh va Yevropadan sakkiz usul", "Eight techniques from Italy, the US and Europe"), t("Смотрели, как продают Baldinini, Santoni, Tod’s, Ferragamo, Furla, Saks, Neiman Marcus, Nordstrom, Stuart Weitzman, Mytheresa, LuisaViaRoma, Net-a-Porter и Bally. Общее у всех: спокойная витрина, крупные фото, никакой гонки скидок. Вот что из этого взяли в магазин.", "Baldinini, Santoni, Tod’s, Ferragamo, Furla, Saks, Neiman Marcus, Nordstrom, Stuart Weitzman, Mytheresa, LuisaViaRoma, Net-a-Porter va Bally qanday sotishini ko‘rdik. Hammasida umumiy: sokin vitrina, katta suratlar, chegirma poygasi yo‘q. Do‘konga mana shulardan olindi.", "We looked at how Baldinini, Santoni, Tod’s, Ferragamo, Furla, Saks, Neiman Marcus, Nordstrom, Stuart Weitzman, Mytheresa, LuisaViaRoma, Net-a-Porter and Bally sell. What they share: a calm shop window, large photos, no discount race. This is what went into the store."))}
<div class="lx">${items.map(([i, h, p, who]) => `<div class="lx-c rv">${ic(i)}<h3>${h}</h3><p>${p}</p><small>${t("Видели у:", "Kimda ko‘rdik:", "Seen at:")} ${who}</small></div>`).join("")}</div>
</div></section>`;
}
function italyBlock(l) {
  const t = T(l);
  return `<section class="italy" id="italiya"><div class="wrap it">
<div class="it-ph rv"><img src="${IMG}/craft-lasts.webp" alt="${t("Колодки в мастерской Baldinini", "Baldinini ustaxonasidagi qoliplar", "Shoe lasts in the Baldinini workshop")}" width="900" height="1125" loading="lazy"></div>
<div class="it-t rv"><p class="kicker">${t("Сделано в Италии", "Italiyada yaratilgan", "Made in Italy")}</p><h2>${t("С 1910 года, Сан-Мауро-Пасколи", "1910 yildan, San-Mauro-Paskoli", "Since 1910, San Mauro Pascoli")}</h2>
<p>${t("В магазине история бренда рассказана фактами с официального сайта Baldinini: семейная мастерская, ручная строчка, Made in Italy на каждой модели сезона. Без громких слов: люкс узнают по спокойствию.", "Do‘konda brend tarixi Baldinini rasmiy saytidagi faktlar bilan aytilgan: oilaviy ustaxona, qo‘lda chok, mavsumning har bir modelida Made in Italy. Baland so‘zlarsiz: lyuks sokinligidan taniladi.", "In the store the brand’s story is told with facts from the official Baldinini site: a family workshop, hand stitching, Made in Italy on every model of the season. No big words: luxury is recognised by its calm.")}</p>
<p class="muted">${t("Шрифт магазина Jost, свободный, по форме близкий к их Futura PT. Цвета с их сайта: чёрный, белый, серый #858585 и песочный #d8aa8a, которым на баннерах подчёркнуты ссылки.", "Do‘kon shrifti Jost, erkin, shakli ularning Futura PT shriftiga yaqin. Ranglar ularning saytidan: qora, oq, kulrang #858585 va bannerlarda havolalar tagiga chizilgan qum rang #d8aa8a.", "The store font is Jost, a free typeface close in form to their Futura PT. Colours come from their site: black, white, grey #858585 and the sand #d8aa8a that underlines links on their banners.")}</p></div>
</div></section>`;
}
function panelBlock(l) {
  const t = T(l), U = panelUi(l);
  const col = (k) => `<div class="tl-c ${k} rv"><p class="tl-t">${L3([PANELS[k].ru.t, PANELS[k].uz.t, PANELS[k].en.t], l)} <b>+${PANELS[k].price} $</b></p><ul>${(k === "pro" ? [] : []).concat(PANELS[k].sections).map((s) => `<li>${ic(NAV_IC[s])}<span>${U["n_" + s]}</span></li>`).join("")}</ul>${k === "pro" ? `<p class="muted">${t("и всё из «Панели магазина»", "va «Do‘kon paneli»dagi hammasi", "plus everything in the Store panel")}</p>` : ""}</div>`;
  return `<section class="pnl" id="panel"><div class="wrap">
${head(t("Админка", "Admin panel", "Admin panel"), t("Панель бутика в окне браузера", "Brauzer oynasidagi butik paneli", "The boutique panel in a browser window"), t("Оформите заказ или бронь в магазине выше: они придут сюда первой строкой. Отметьте «Собран» или «Подтвердить», и покупатель увидит это у себя. Переключатель «Панель / Расширенная» показывает два уровня, «Смотреть как: продавец» прячет себестоимость и прибыль.", "Yuqoridagi do‘konda buyurtma yoki bron qiling: ular bu yerga birinchi qator bo‘lib keladi. «Yig‘ildi» yoki «Tasdiqlash»ni belgilang, xaridor buni o‘zida ko‘radi. «Panel / Kengaytirilgan» almashtirgichi ikki darajani ko‘rsatadi, «Kim sifatida: sotuvchi» tannarx va foydani yashiradi.", "Place an order or a booking in the store above: it arrives here on top. Mark it “Packed” or “Confirm” and the client sees it. The Panel / Extended switch shows the two tiers; “View as: seller” hides cost and profit."))}
<div class="brw rv"><div class="brw-bar" aria-hidden="true"><i></i><i></i><i></i><span>baldinini.uz/admin</span></div><div class="brw-scr"><iframe class="pnl-frame" title="${t("Панель бутика", "Butik paneli", "Boutique panel")}" data-src="${href(l, "panel")}?embed=1" loading="lazy"></iframe></div></div>
<div class="tl">${col("std")}${col("pro")}</div>
<div class="pnl-cta"><a class="btn" href="${href(l, "panel")}">${ic("full")}<span>${t("Панель во весь экран", "Panel to‘liq ekranda", "Panel full screen")}</span></a></div>
</div></section>`;
}
function offerBlock(l) {
  const t = T(l);
  const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}"><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}${a.star ? `<em class="star">${t("бутику первым", "butikka birinchi", "first for a boutique")}</em>` : ""}</b><small>${a[l].e}</small></span><span class="kit-p">+${usd(a.price)}</span></label>`;
  const pnl = (k) => `<label class="kit-row pn"><input type="radio" name="pnl" value="${k}"${k === "std" ? " checked" : ""}${k === "none" ? "" : ` data-p="${PANELS[k].price}"`}><span class="rd" aria-hidden="true"></span><span class="kit-t"><b>${k === "none" ? t("Без админки", "Admin panelsiz", "No admin panel") : PANELS[k][l].t}</b><small>${k === "none" ? t("Заказы приходят в Telegram, остатки ведёте как сейчас", "Buyurtmalar Telegramga keladi, qoldiqlarni hozirgidek yuritasiz", "Orders arrive in Telegram; stock is kept as it is now") : PANELS[k][l].e}</small></span><span class="kit-p">${k === "none" ? "0 $" : "+" + usd(PANELS[k].price)}</span></label>`;
  return `<section class="offer" id="cena"><div class="wrap">
${head(t("Предложение DevUz Studio", "DevUz Studio taklifi", "DevUz Studio offer"), t("Стоимость", "Narxi", "Pricing"), t(`Магазин целиком, как в этом макете, без админки: 1 000 $ вместо ${usd(BASE.price)}, если начинаем в течение 48 часов. Админка: один из двух уровней. Допы включайте тумблерами, итог пересчитается.`, `Do‘kon to‘liq, bu maketdagidek, admin panelsiz: 48 soat ichida boshlasak, ${usd(BASE.price)} o‘rniga 1 000 $. Admin panel: ikki darajadan biri. Qo‘shimchalarni tugmalar bilan yoqing, jami qayta hisoblanadi.`, `The whole store as in this mockup, without the admin panel: 1 000 $ instead of ${usd(BASE.price)} if we start within 48 hours. The admin panel is one of two tiers. Switch add-ons on and the total updates.`))}
<div class="kit" id="konstruktor">
<div class="kit-list">
<div class="kit-base"><div><span class="kb-tag">${t("Входит всегда", "Har doim kiradi", "Always included")}</span><b>${BASE[l].t}</b><p>${BASE[l].d}</p><p class="kb-w">${t(`Срок: ${BASE.weeks[0]}-${BASE.weeks[1]} недель`, `Muddat: ${BASE.weeks[0]}-${BASE.weeks[1]} hafta`, `Timeline: ${BASE.weeks[0]}-${BASE.weeks[1]} weeks`)}</p></div><div class="kb-p"><s>${usd(BASE.price)}</s><b>${usd(BASE.promo)}</b><small>${t("48 часов", "48 soat", "48 hours")}</small></div></div>
<h3 class="kit-g" id="kit-panel">${t("Админка: один уровень на выбор", "Admin panel: bitta daraja tanlang", "Admin panel: choose one tier")}</h3>
<div role="radiogroup" aria-label="${t("Админка", "Admin panel", "Admin panel")}">${["none", "std", "pro"].map(pnl).join("")}</div>
<p class="kit-n">${t("Что входит в каждый уровень, видно в панели выше: у каждого раздела пометка.", "Har bir darajaga nima kirishini yuqoridagi panelda ko‘rish mumkin: har bir bo‘limda belgi bor.", "The panel above shows what each tier includes: every section is tagged.")} <a href="${href(l, "panel")}">${t("Открыть панель", "Panelni ochish", "Open the panel")}</a></p>
<h3 class="kit-g">${t("Допы: включайте то, что нужно бутику", "Qo‘shimchalar: butikka keraklisini yoqing", "Add-ons: switch on what the boutique needs")}</h3>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side">
<div class="kit-total" id="kit-total">
<div class="timer" id="timer"><span>${t("Цена 1 000 $ действует", "1 000 $ narxi amal qiladi", "The 1 000 $ price holds")}<small>${t("48 часов с первого открытия макета", "maket birinchi ochilganidan 48 soat", "for 48 hours from the first opening")}</small></span><b id="tm">48:00:00</b></div>
<div class="kt-line"><span>${t("Магазин", "Do‘kon", "Store")}</span><span><s>${usd(BASE.price)}</s> ${usd(BASE.promo)}</span></div>
<div class="kt-line" id="kit-pn"><span id="kit-pn-n"></span><span id="kit-pn-v"></span></div>
<div class="kt-line"><span>${t("Допы", "Qo‘shimchalar", "Add-ons")} · <span id="kit-n">0</span></span><span id="kit-add">0 $</span></div>
<div class="kt-sum"><small>${t("Итого", "Jami", "Total")}</small><b id="kit-sum">${usd(BASE.promo + PANELS.std.price)}</b><small>${t(`все допы: ${usd(ADDONS_SUM)}; всё с Расширенной панелью: ${usd(ALL)}`, `barcha qo‘shimchalar: ${usd(ADDONS_SUM)}; Kengaytirilgan panel bilan hammasi: ${usd(ALL)}`, `all add-ons: ${usd(ADDONS_SUM)}; everything with the Extended panel: ${usd(ALL)}`)}</small></div>
<button type="button" class="btn btn-o" id="kit-all">${t("Включить все допы", "Barcha qo‘shimchalarni yoqish", "Switch on all add-ons")}</button>
<a class="btn" id="kit-go" href="https://t.me/Devuz_studio_bot?start=baldinini">${ic("tg")}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish", "Discuss with DevUz Studio")}</span></a>
<button type="button" class="copy" id="kit-copy">${t("Скопировать состав", "Tarkibni nusxalash", "Copy the list")}</button>
</div>
<p class="src">${t("Цены допов: середина рынка веб-студий Ташкента и СНГ. Комиссии платёжных систем и партнёров рассрочки, хостинг и SMS бутик оплачивает сам.", "Qo‘shimchalar narxi: Toshkent va MDH veb-studiyalari bozor o‘rtachasi. To‘lov tizimlari va muddatli to‘lov hamkorlari komissiyalari, xosting va SMSni butik o‘zi to‘laydi.", "Add-on prices: the middle of the Tashkent and CIS web studio market. Payment and instalment fees, hosting and SMS are paid by the boutique.")}</p>
</div>
</div>
</div></section>`;
}

function sitePage(l) {
  const t = T(l);
  const nav = [["#seychas", t("Что меняем", "Nima o‘zgaradi", "What changes")], ["#put", t("Магазин", "Do‘kon", "Store")], ["#lyuks", t("Приёмы люкса", "Lyuks usullari", "Luxury techniques")], ["#panel", t("Админка", "Admin panel", "Admin")], ["#cena", t("Стоимость", "Narxi", "Pricing")]];
  const kit = {
    items: ADDONS.map((a) => ({ id: a.id, t: a[l].t, p: a.price })), base: BASE.promo, regular: BASE.price, baseName: BASE[l].t, hours: OFFER_HOURS,
    panels: { std: { t: PANELS.std[l].t, p: PANELS.std.price }, pro: { t: PANELS.pro[l].t, p: PANELS.pro.price } },
    copied: t("Скопировано", "Nusxalandi", "Copied"), head: t(`Интернет-магазин ${B} Tashkent, состав из конструктора:`, `${B} Tashkent internet-do‘koni, konstruktordan tarkib:`, `${B} Tashkent online store, from the configurator:`), total: t("Итого", "Jami", "Total"),
    ended: t("Срок акции вышел: цена по договорённости", "Aksiya muddati tugadi: narx kelishuv bo‘yicha", "The offer has ended: price by agreement"),
  };
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t(`${B} Tashkent · интернет-магазин · макет DevUz Studio`, `${B} Tashkent · internet-do‘kon · DevUz Studio maketi`, `${B} Tashkent · online store · DevUz Studio mockup`), t("Макет интернет-магазина Baldinini Tashkent: коллекция, размер и наличие в бутике, примерка в Tashkent City, доставка с примеркой, админка в двух уровнях.", "Baldinini Tashkent internet-do‘koni maketi: kolleksiya, o‘lcham va butikda borligi, Tashkent Cityda kiyib ko‘rish, kiyib ko‘rishli yetkazish, ikki darajali admin panel.", "Baldinini Tashkent online store mockup: collection, sizes and boutique stock, try-on at Tashkent City, delivery with try-on, a two-tier admin panel."))}
${LANGS.filter((x) => x !== l).map((x) => `<link rel="alternate" hreflang="${x}" href="${href(x)}">`).join("\n")}
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=false;try{if(sessionStorage.getItem('bd-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
@@S@@
</head>
<body class="site" data-lang="${l}">
${sprite()}
${introHtml(l)}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga", "Skip to content")}</a>
<header class="top" id="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="${B}">${logo()}</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar", "Sections")}">${nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
<div class="top-r">${langs(l, "")}<a class="btn btn-sm" href="${href(l, "shop")}">${t("Магазин", "Do‘kon", "Store")}</a></div>
</div></header>
<main id="main">
${[heroBlock(l), nowBlock(l), buyerBlock(l), pathBlock(l), luxBlock(l), italyBlock(l), panelBlock(l), offerBlock(l)].join("\n")}
</main>
<footer class="foot"><div class="wrap">
<div class="cols">
<div>${logo("f-logo")}<p>${L3(D.BOUTIQUE.addr, l)}</p><p>${t("Будни", "Ish kunlari", "Weekdays")} ${D.BOUTIQUE.hours[0]} · ${t("выходные", "dam olish kunlari", "weekends")} ${D.BOUTIQUE.hours[1]}</p><p><a href="https://instagram.com/${D.BRAND.ig}" rel="noopener">${ic("ig")} @${D.BRAND.ig}</a></p></div>
<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=baldinini">Telegram</a></li></ul></div>
<div><b>${t("Данные макета", "Maket ma’lumotlari", "Mockup data")}</b><ul><li>${t("Модели, артикулы, материалы, фото: официальный магазин Baldinini", "Modellar, artikullar, materiallar, suratlar: Baldinini rasmiy do‘koni", "Models, articles, materials, photos: the official Baldinini store")}</li><li>${t("Адрес и часы: Tashkent City Mall", "Manzil va ish vaqti: Tashkent City Mall", "Address and hours: Tashkent City Mall")}</li><li>${t("Цены в сумах, остатки, заказы, посещаемость: демо", "So‘mdagi narxlar, qoldiqlar, buyurtmalar, tashriflar: demo", "UZS prices, stock, orders, traffic: demo")}</li></ul></div>
</div>
<div class="rights"><span>${t(`Это макет: так может выглядеть интернет-магазин ${B} Tashkent. Заказы, оплата и брони работают для показа, деньги не списываются.`, `Bu maket: ${B} Tashkent internet-do‘koni shunday ko‘rinishi mumkin. Buyurtmalar, to‘lov va bronlar ko‘rsatish uchun ishlaydi, pul yechilmaydi.`, `This is a mockup of how the ${B} Tashkent online store could look. Orders, payments and bookings work for demonstration; no money is charged.`)}</span><span>${t("Макет принадлежит DevUz Studio. Использовать его можно только по договору:", "Maket DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:", "The mockup belongs to DevUz Studio and may be used only under contract:")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari", "terms of use")}</a></span></div>
</div></footer>
<div class="dock" id="dock"><a class="btn" href="${href(l, "shop")}">${ic("bag")}<span>${t("Открыть магазин", "Do‘konni ochish", "Open the store")}</span></a><a class="btn btn-o" href="#cena">${t("Стоимость", "Narxi", "Pricing")}</a></div>
<script type="application/json" id="kit-data">${json(kit)}</script>
<script>
${strip(read("intro.js"))}</script>
@@J@@
</body>
</html>`;
}

const out = {};
for (const l of LANGS) {
  const p = l === "ru" ? "" : l + "/";
  out[l === "ru" ? "" : l] = sitePage(l);
  out[p + "shop"] = shopPage(l);
  out[p + "panel"] = panelPage(l);
}
const parts = {
  S: `<style>${min(read("site.css"))}</style>`,
  A: `<style>${min(read("shop.css"))}</style>`,
  K: `<style>${min(read("panel.css"))}</style>`,
  J: `<script>\n${strip(read("site.js"))}</script>`,
  P: `<script>\n${strip(SHOP_JS)}</script>`,
  Q: `<script>\n${strip(PANEL_JS)}</script>`,
};
const fill = (page) => Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), page);

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "baldinini.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(12), fill(v).length);
