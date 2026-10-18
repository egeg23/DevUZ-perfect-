import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as D from "./data.mjs";
import { SHOP_UI, PANEL_UI } from "./ui.mjs";
import { BASE, ADDONS, ALL, OFFER_HOURS, OFFER_UNTIL, SELLER } from "./plan.mjs";
import { DZ_VIDEO } from "../dz-video.mjs";

/*
 * Макет интернет-магазина Greenwell (биодобавки, ООО «Inso Farm Deluxe»), ru и uz:
 *  - страница (`""`, `uz`): промо DevUz и влёт в их знак, первый экран с
 *    живым магазином в айфоне, «что сейчас и что меняем», путь покупателя
 *    по шагам, рассрочка, отзывы за баллы, панель магазина в окне браузера,
 *    стоимость с конструктором допов и отсчётом 48 часов;
 *  - магазин (`shop`, `uz/shop`): сначала телефон, на ПК растягивается;
 *  - панель магазина (`panel`, `uz/panel`).
 * Товары, цены, описания, оценки и отзывы — с greenwell.uz и их витрины на
 * Uzum (data.mjs); заказы, себестоимость, посещаемость — демо, так и подписано.
 *
 * Стили и скрипты общие, в странице вместо них @@S@@, @@A@@, @@P@@, @@J@@,
 * @@K@@, @@Q@@. Ссылки — через __PROTO_BASE__, отпечаток ставится при показе
 * зерном из protos.stamp (lib/proto/bundles). Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/greenwell";
const BASEP = "__PROTO_BASE__";
const B = D.BRAND.name;
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Montserrat:wght@400;700&display=swap";
const read = (f) => readFileSync(DIR + f, "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => grp(n) + " $";
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const L2 = (p, l) => (Array.isArray(p) ? (l === "ru" ? p[0] : p[1]) : p);
const href = (l, path = "") => BASEP + (l === "uz" ? "/uz" : "") + (path ? "/" + path : "");
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

/* ── Подписи: каждая, которую зовут скрипты, должна быть на двух языках ── */
function dict(src, js, name) {
  const keys = new Set([...js.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  const dyn = { shop: ["sort_pop", "sort_cheap", "sort_dear", "sort_off", "sort_rate", "form_caps", "form_tab", "form_soft", "unit_caps", "unit_tab", "unit_soft", "tag_halal", "tag_vegan", "st0", "st1", "st2", "st3", "pw_welcome", "pw_spent", "pw_buy", "pw_review"],
    panel: ["d7", "d30", "d90", "st0", "st1", "st2", "st3", "toSt1", "toSt2", "toSt3", "b0", "b1", "b2", "b3", "b4", "b5", "loseTip1", "loseTip2", "loseTip3", "loseTip4", "f1", "f2", "f3", "f4", "f5", "f6", "dev1", "dev2", "dev3", "log_st", "log_cour", "log_note", "log_ret", "log_rvok", "log_rvno", "log_reply", "log_cmp", "log_cost", "log_call", "log_price", "log_pts", "aiM_off", "aiM_ask", "aiM_auto"] }[name];
  for (const k of dyn) keys.add(k);
  for (const k of ["form_", "unit_", "sort_", "tag_", "pw_", "st", "b", "d", "f", "log_", "toSt", "loseTip", "dev", "aiM_"]) keys.delete(k);
  for (const k of keys) {
    const v = src[k];
    if (!v || v.length !== 2 || !v[0] || !v[1]) throw new Error(`${name}: нет подписи «${k}» на двух языках`);
  }
  return (l) => Object.fromEntries(Object.entries(src).map(([k, v]) => [k, L2(v, l)]));
}
const SHOP_JS = read("shop.js"), PANEL_JS = read("panel.js").replace("/*SELLER*/", () => read("seller.js"));
const shopUi = dict(SHOP_UI, SHOP_JS, "shop"), panelUi = dict(PANEL_UI, PANEL_JS, "panel");

/* ── Знак: их вектор с greenwell.uz (Vector.svg), буквы красятся цветом ── */
const LOGO = JSON.parse(read("logo.json"));
const LOGO_SYM = `<symbol id="gw-logo" viewBox="0 0 131 16">${LOGO.map((p) => `<path d="${p.d}" fill="${p.k === "word" ? "currentColor" : p.fill}"${p.rule ? ` fill-rule="${p.rule}"` : ""}/>`).join("")}</symbol>`;

/* ── Иконки: контуры 24×24 ───────────────────────────────────────────── */
const S = 'fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  arrow: `<path d="M5 12h14M13 6l6 6-6 6" ${S}/>`,
  chev: `<path d="m9 6 6 6-6 6" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  plus: `<path d="M12 5v14M5 12h14" ${S}/>`,
  minus: `<path d="M5 12h14" ${S}/>`,
  heart: `<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" stroke-width="1.9" stroke-linejoin="round"/>`,
  bag: `<path d="M5 8h14l-1 12H6z" ${S}/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" ${S}/>`,
  star: `<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" stroke-width="1.6" stroke-linejoin="round"/>`,
  leaf: `<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" ${S}/><path d="M5 19 13 11" ${S}/>`,
  cal: `<rect x="3.5" y="5" width="17" height="15" rx="2.5" ${S}/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h3" ${S}/>`,
  globe: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z" ${S}/>`,
  shield: `<path d="M12 3 19 6v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" ${S}/><path d="m9 12 2 2 4-4" ${S}/>`,
  gift: `<rect x="3.5" y="9" width="17" height="11.5" rx="2" ${S}/><path d="M3.5 13h17M12 9v11.5M12 9c-1.6-3.5-5.5-4-5.5-1.5S9.5 9 12 9zm0 0c1.6-3.5 5.5-4 5.5-1.5S14.5 9 12 9z" ${S}/>`,
  camera: `<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z" ${S}/><circle cx="12" cy="13.3" r="3.4" ${S}/>`,
  filter: `<path d="M4 6h16M7 12h10M10 18h4" ${S}/>`,
  sort: `<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" ${S}/>`,
  search: `<circle cx="11" cy="11" r="6.5" ${S}/><path d="m16 16 4 4" ${S}/>`,
  truck: `<path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z" ${S}/><circle cx="7" cy="17.5" r="1.8" ${S}/><circle cx="17.5" cy="17.5" r="1.8" ${S}/>`,
  box: `<path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5z" ${S}/><path d="M4 7.5 12 11l8-3.5M12 11v9" ${S}/>`,
  pen: `<path d="M4 20h4L19 9l-4-4L4 16z" ${S}/><path d="m13.5 6.5 4 4" ${S}/>`,
  tg: `<path d="M21 4 3 11l6 2 2 6 3-4 5 4z" ${S}/><path d="m9 13 9-7" ${S}/>`,
  ig: `<rect x="4" y="4" width="16" height="16" rx="5" ${S}/><circle cx="12" cy="12" r="3.6" ${S}/><path d="M16.8 7.2v.01" ${S}/>`,
  card: `<rect x="3" y="5.5" width="18" height="13" rx="2.5" ${S}/><path d="M3 10h18M7 15h4" ${S}/>`,
  cash: `<rect x="3" y="6.5" width="18" height="11" rx="2" ${S}/><circle cx="12" cy="12" r="2.6" ${S}/><path d="M6.5 9.5v.01M17.5 14.5v.01" ${S}/>`,
  pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" stroke-width="1.9" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.3" fill="#fff" stroke="none"/>`,
  gps: `<circle cx="12" cy="12" r="3.5" ${S}/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" ${S}/><circle cx="12" cy="12" r="7" ${S}/>`,
  home: `<path d="M4 11 12 4.5l8 6.5V20h-5.5v-5h-5v5H4z" ${S}/>`,
  work: `<rect x="3.5" y="7.5" width="17" height="12" rx="2" ${S}/><path d="M9 7.5V5.5h6v2M3.5 12.5h17" ${S}/>`,
  phone: `<path d="M5 4.5h3.5l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" ${S}/>`,
  doc: `<path d="M6 3.5h8l4 4v13H6z" ${S}/><path d="M14 3.5v4h4M9 12h6M9 16h6" ${S}/>`,
  play: `<path d="M8 5.5v13l10-6.5z" ${S}/>`,
  moon: `<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" ${S}/>`,
  joint: `<path d="M8.5 6.5a2.2 2.2 0 1 1 1.6-3.7l.4.4 5.5 5.5.4.4a2.2 2.2 0 1 1 3.7 1.6 2.2 2.2 0 1 1-1.6 3.7l-.4-.4-5.5-5.5-.4-.4A2.2 2.2 0 1 1 8.5 6.5z" ${S}/>`,
  spark: `<path d="M12 3.5c.8 4.2 2.3 5.7 6.5 6.5-4.2.8-5.7 2.3-6.5 6.5-.8-4.2-2.3-5.7-6.5-6.5 4.2-.8 5.7-2.3 6.5-6.5zM18 16.5c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5z" ${S}/>`,
  scale: `<rect x="4" y="4" width="16" height="16" rx="4" ${S}/><path d="M8 9.5a6 6 0 0 1 8 0l-2.5 2.5h-3z" ${S}/>`,
  bell: `<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" ${S}/><path d="M10 20.5h4" ${S}/>`,
  out: `<path d="M14 4.5h4.5v15H14M10 8l-4 4 4 4M6 12h10" ${S}/>`,
  chart: `<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" ${S}/>`,
  grid: `<rect x="4" y="4" width="7" height="7" rx="1.5" ${S}/><rect x="13" y="4" width="7" height="7" rx="1.5" ${S}/><rect x="4" y="13" width="7" height="7" rx="1.5" ${S}/><rect x="13" y="13" width="7" height="7" rx="1.5" ${S}/>`,
  tag: `<path d="M4 12V4h8l8 8-8 8z" ${S}/><circle cx="8.5" cy="8.5" r="1.4" ${S}/>`,
  list: `<path d="M9 6h11M9 12h11M9 18h11M4.5 6v.01M4.5 12v.01M4.5 18v.01" ${S}/>`,
  menu: `<path d="M4 7h16M4 12h16M4 17h16" ${S}/>`,
  alert: `<path d="M12 4 21 19.5H3z" ${S}/><path d="M12 10v4M12 17v.01" ${S}/>`,
  full: `<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" ${S}/>`,
  user: `<circle cx="12" cy="8.5" r="3.8" ${S}/><path d="M4.5 20c1.3-3.8 4-5.6 7.5-5.6s6.2 1.8 7.5 5.6" ${S}/>`,
};
const sprite = (extra = "") => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${LOGO_SYM}${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
  .join("")}${extra}</defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;
const logo = (cls = "") => `<svg class="logo-w ${cls}" viewBox="0 0 131 16" role="img" aria-label="${B}"><use href="#gw-logo"/></svg>`;

/* Город для карты доставки: рисунок кодом, без чужих карт и загрузок. */
const CITY = `<symbol id="gw-city" viewBox="0 0 900 900"><rect width="900" height="900" fill="#eef1ea"/>
<g fill="#dfe9d6"><path d="M40 40h200v150H40zM600 60h240v170H600zM90 600h180v200H90zM640 620h200v180H640z"/><circle cx="450" cy="450" r="70"/></g>
<path d="M-20 300C120 280 220 360 330 340S520 220 640 260 820 380 920 360" fill="none" stroke="#bfdcef" stroke-width="22"/>
<g fill="#e3e6df">${Array.from({ length: 36 }, (_, i) => { const x = 30 + (i % 6) * 145, y = 30 + Math.floor(i / 6) * 145; return `<rect x="${x + 18}" y="${y + 18}" width="${92 + ((i * 13) % 20)}" height="${88 + ((i * 7) % 18)}" rx="6"/>`; }).join("")}</g>
<g stroke="#fff" stroke-linecap="round" fill="none"><path d="M0 160H900M0 520H900M0 760H900M160 0V900M420 0V900M640 0V900" stroke-width="22"/><path d="M0 40l900 860M0 640 520 0" stroke-width="12"/><path d="M0 400H900M300 0V900M760 0V900" stroke-width="10"/></g>
<g stroke="#f5d48a" stroke-width="6" fill="none" stroke-linecap="round"><path d="M0 520H900M420 0V900"/></g>
<g font-family="Manrope,system-ui,sans-serif" font-size="15" fill="#6f7d75" font-weight="700"><text x="440" y="508">Amir Temur</text><text x="40" y="150">Shota Rustaveli</text><text x="660" y="150">Bobur</text><text x="40" y="750">Bunyodkor</text><text x="660" y="750">Mukimiy</text><text x="430" y="90" transform="rotate(90 430 90)">Nukus</text></g></symbol>`;

/* ── Данные для магазина и панели ───────────────────────────────────── */
const BACK = { mgc: 2, mgb: 1, sleep: 1, se: 0, q10: 3, om: 0, multi: 1, zinc: 1, glu: 2, wl: 1, d3: 1, vc: 4, nails: 1 };
function prods(l) {
  const o = l === "ru" ? "uz" : "ru";
  return D.PRODUCTS.map((p) => ({
    id: p.id, cat: p.cat, price: p.price, old: p.old, count: p.count, form: p.form, rating: p.rating, reviews: p.reviews, orders: p.orders, g: p.g, c: p.c, back: BACK[p.id],
    n: p[l].n, s: p[l].s, b: p[l].b, alt: p[o].n, how: p.how ? L2(p.how, l) : "", comp: p.comp ? L2(p.comp, l) : "", tags: p.tags || [], rev: D.REVIEWS[p.id] || [], uzum: p.uzum,
  }));
}
const brandL = (l) => ({ name: B, tg: D.BRAND.tg, ig: D.BRAND.ig, uzum: D.BRAND.uzum, made: L2(D.BRAND.made, l), legalNote: L2(D.BRAND.legalNote, l), dist: L2(D.BRAND.dist, l) });
const STREETS = [
  ["ул. Шота Руставели", "Shota Rustaveli ko‘chasi", "Яккасарайский район", "Yakkasaroy tumani"],
  ["ул. Бабура", "Bobur ko‘chasi", "Яккасарайский район", "Yakkasaroy tumani"],
  ["ул. Афросиаб", "Afrosiyob ko‘chasi", "Мирабадский район", "Mirobod tumani"],
  ["ул. Нукус", "Nukus ko‘chasi", "Мирабадский район", "Mirobod tumani"],
  ["пр. Амира Темура", "Amir Temur shoh ko‘chasi", "Юнусабадский район", "Yunusobod tumani"],
  ["ул. Мустакиллик", "Mustaqillik ko‘chasi", "Мирзо-Улугбекский район", "Mirzo Ulug‘bek tumani"],
  ["ул. Катартал", "Qatortol ko‘chasi", "Чиланзарский район", "Chilonzor tumani"],
  ["ул. Бунёдкор", "Bunyodkor shoh ko‘chasi", "Чиланзарский район", "Chilonzor tumani"],
  ["ул. Мукими", "Muqimiy ko‘chasi", "Чиланзарский район", "Chilonzor tumani"],
];
const SYN = {
  "сон": ["nerv"], "спать": ["nerv"], "засып": ["nerv"], "стресс": ["nerv"], "нерв": ["nerv"], "иммун": ["imm"], "простуд": ["imm"], "сердц": ["heart"], "сосуд": ["heart"], "энерг": ["heart", "multi"], "устал": ["heart", "mgc", "multi"],
  "сустав": ["joint"], "колен": ["joint"], "хрящ": ["joint"], "кож": ["beauty", "se"], "волос": ["beauty", "zinc"], "ногт": ["beauty"], "коллаген": ["nails"], "вес": ["weight"], "похуд": ["weight"], "аппетит": ["weight"],
  "омег": ["om"], "рыб": ["om"], "магн": ["mgc", "mgb"], "витамин d": ["d3"], "витамин д": ["d3"], "д3": ["d3"], "кост": ["d3", "multi"], "цинк": ["zinc", "se"], "селен": ["se"],
  "uyqu": ["nerv"], "stress": ["nerv"], "asab": ["nerv"], "immun": ["imm"], "yurak": ["heart"], "energiya": ["heart", "multi"], "bo‘g‘im": ["joint"], "bog'im": ["joint"], "teri": ["beauty"], "soch": ["beauty"], "tirnoq": ["beauty"], "vazn": ["weight"], "ozish": ["weight"],
  "magniy": ["mgc", "mgb"], "omega": ["om"], "vitamin d": ["d3"], "sink": ["zinc", "se"], "selen": ["se"], "kollagen": ["nails"], "suyak": ["d3", "multi"],
};
function shopData(l) {
  const t = T(l);
  return {
    lang: l, img: IMG, ui: shopUi(l), products: prods(l), cats: D.CATS.map((c) => ({ id: c.id, i: c.i, n: L2(c.n, l) })), pairs: D.PAIRS, brand: brandL(l),
    nasiya: D.NASIYA, pays: D.PAYS.map((p) => ({ id: p.id, n: L2(p.n, l) })), shop: { ...D.SHOP, levels: D.SHOP.levels.map((x) => ({ ...x, n: L2(x.n, l) })) },
    terms: TERMS(l), other: href(l === "ru" ? "uz" : "ru", "shop"), panel: href(l, "panel"), syn: SYN,
    streets: STREETS.map((s) => ({ n: l === "ru" ? s[0] : s[1], d: l === "ru" ? s[2] : s[3] })),
    popular: t("магний|омега|витамин D|для сна|иммунитет|суставы", "magniy|omega|vitamin D|uyqu|immunitet|bo‘g‘im").split("|"),
    quick: t("Пришло быстро|Хорошая упаковка|Оригинал|Чувствую эффект|Беру не первый раз", "Tez keldi|Yaxshi qadoq|Original|Ta’sirini sezyapman|Birinchi marta olmayapman").split("|"),
    pickups: [
      { n: t("Пункт выдачи Greenwell, Чиланзар (демо)", "Greenwell topshirish punkti, Chilonzor (demo)"), a: t("адрес впишете свой", "manzilingizni yozasiz"), h: "9:00-21:00" },
      { n: t("Пункт выдачи Greenwell, Юнусабад (демо)", "Greenwell topshirish punkti, Yunusobod (demo)"), a: t("адрес впишете свой", "manzilingizni yozasiz"), h: "9:00-21:00" },
    ],
  };
}
const NAMES = {
  couriers: [["Шерзод", "Sherzod"], ["Бехзод", "Behzod"], ["Улугбек", "Ulug‘bek"], ["Жасур", "Jasur"]],
  managers: [["Дилноза", "Dilnoza"], ["Азиз", "Aziz"], ["Мадина", "Madina"]],
};
function panelData(l) {
  const t = T(l), cour = NAMES.couriers.map((x) => L2(x, l)), mgr = NAMES.managers.map((x) => L2(x, l));
  const roles = {};
  mgr.forEach((m, i) => (roles[m] = [t("Старший менеджер", "Katta menejer"), t("Менеджер заказов", "Buyurtmalar menejeri"), t("Отзывы и поддержка", "Sharhlar va qo‘llab-quvvatlash")][i]));
  cour.forEach((c) => (roles[c] = t("Курьер", "Kuryer")));
  const me = t("Вы (владелец)", "Siz (ega)");
  roles[me] = t("Владелец", "Ega");
  const pn = (id) => D.PRODUCTS.find((p) => p.id === id)[l].n;
  return {
    lang: l, img: IMG, ui: panelUi(l), products: prods(l), cats: D.CATS.map((c) => ({ id: c.id, n: L2(c.n, l) })), shop: D.SHOP, nasiya: D.NASIYA,
    pays: D.PAYS.map((p) => ({ id: p.id, n: L2(p.n, l) })), couriers: cour, managers: mgr, roles, me,
    sources: [
      { id: "ig", n: "Instagram", w: 31, c: "#c13584", t: "2:58", b: 27 }, { id: "tg", n: "Telegram", w: 22, c: "#229ed9", t: "3:12", b: 24 },
      { id: "google", n: "Google", w: 16, c: "#4285f4", t: "2:21", b: 35 }, { id: "yandex", n: t("Яндекс", "Yandex"), w: 9, c: "#fc3f1d", t: "2:05", b: 38 },
      { id: "direct", n: t("Прямые заходы", "To‘g‘ridan-to‘g‘ri"), w: 13, c: "#5b6b61", t: "3:40", b: 22 }, { id: "ads", n: t("Реклама", "Reklama"), w: 9, c: "#b7862c", t: "1:34", b: 46 },
    ],
    districts: STREETS.map((s) => (l === "ru" ? s[2] : s[3])).filter((v, i, a) => a.indexOf(v) === i).concat(t("Шайхантахур|Алмазар|Сергели|Яшнабад|Учтепа", "Shayxontohur|Olmazor|Sergeli|Yashnobod|Uchtepa").split("|")).slice(0, 10),
    clients: t("Нигора Р.|Ботир К.|Севара А.|Феруза М.|Тимур Х.|Лола Ш.|Анвар Т.|Мохира Д.|Ирина С.|Джамшид У.", "Nigora R.|Botir K.|Sevara A.|Feruza M.|Temur X.|Lola Sh.|Anvar T.|Mohira D.|Irina S.|Jamshid U.").split("|").map((n, i) => ({ n, ph: `+998 9${(i * 3) % 10} *** ${10 + i * 7} ${20 + i * 5}` })),
    costShare: { mgc: 0.42, mgb: 0.44, sleep: 0.43, se: 0.41, q10: 0.45, om: 0.4, multi: 0.39, zinc: 0.38, glu: 0.46, wl: 0.41, d3: 0.37, vc: 0.38, nails: 0.44 },
    stock: { mgc: 186, mgb: 64, sleep: 22, se: 41, q10: 57, om: 132, multi: 150, zinc: 88, glu: 73, wl: 39, d3: 95, vc: 18, nails: 47 },
    logActs: [
      { k: "st", who: "m", v: [t("Собран", "Yig‘ildi"), t("В пути", "Yo‘lda")] }, { k: "st", who: "c", v: [t("Доставлен", "Yetkazildi")] }, { k: "cour", who: "m", v: cour },
      { k: "call", who: "m", v: [t("подтвердил адрес", "manzilni tasdiqladi"), t("перенёс доставку на вечер", "yetkazishni kechqurunga ko‘chirdi"), t("уточнил подъезд", "podyezdni aniqladi")] },
      { k: "price", who: "m", v: [`${pn("om")}: 243 000`, `${pn("mgc")}: 162 000`] }, { k: "pts", who: "m", v: [t("7 000 за отзыв с фото", "suratli sharh uchun 7 000")] },
      { k: "rvok", who: "m", v: [pn("mgc"), pn("multi"), pn("om")] }, { k: "reply", who: "m", v: [pn("glu"), pn("d3")] },
    ],
    pending: [
      { id: "mgc", a: t("Камола", "Kamola"), d: "14.10", r: 5, t: t("Пью вторую неделю, засыпаю быстрее. Банка стеклянная, пришла целой.", "Ikkinchi haftadan beri ichyapman, tezroq uxlab qolyapman. Banka shisha, butun keldi."), o: "GW-10466", photo: 1 },
      { id: "om", a: t("Рустам", "Rustam"), d: "14.10", r: 4, t: t("Капсулы небольшие, глотать легко. Доставка в тот же день, но курьер опоздал на час.", "Kapsulalar kichik, yutish oson. Shu kuni yetkazishdi, lekin kuryer bir soat kechikdi."), o: "GW-10461" },
      { id: "d3", a: t("Гульнора", "Gulnora"), d: "13.10", r: 2, t: t("Крышка пришла треснутой, капсулы целые. Хочу замену.", "Qopqoq yorilgan holda keldi, kapsulalar butun. Almashtirishni xohlayman."), o: "GW-10452", cmp: t("Треснула крышка при доставке", "Yetkazishda qopqoq yorilgan") },
      { id: "nails", a: t("Диляфруз", "Dilafruz"), d: "13.10", r: 5, t: t("Ногти перестали слоиться. Возьму ещё на курс.", "Tirnoqlar qatlanmay qoldi. Yana kursga olaman."), o: "GW-10449", photo: 1 },
    ],
    replyTpl: t("Спасибо за отзыв! Рады, что подошло. Баллы уже на счёте, ими можно оплатить следующий заказ.", "Sharh uchun rahmat! Yoqqanidan xursandmiz. Ballar hisobda, ular bilan keyingi buyurtmani to‘lash mumkin."),
    cmpReply: t("Извините за это. Новую банку отправили бесплатно, курьер привезёт завтра.", "Buning uchun uzr. Yangi bankani bepul yubordik, kuryer ertaga olib keladi."),
    geo: t("Ташкент|Самарканд|Фергана|Наманган|Андижан|Бухара|Другие", "Toshkent|Samarqand|Farg‘ona|Namangan|Andijon|Buxoro|Boshqalar").split("|").map((n, i) => [n, [61, 9, 6, 5, 5, 4, 10][i]]),
    topPages: [[t("Главная", "Bosh sahifa"), 64], [pn("mgc"), 21], [t("Каталог", "Katalog"), 19], [pn("om"), 11], [t("Корзина", "Savat"), 9], [pn("multi"), 7]],
    seller: sellerData(l, pn),
    searches: t("магний|омега|витамин д|для сна|коллаген|детские витамины", "magniy|omega|vitamin d|uyqu uchun|kollagen|bolalar vitaminlari").split("|").map((s, i) => [s, [42, 31, 24, 18, 11, 7][i]]),
  };
}

/* AI Seller: площадки, агенты и сценарий их работы (демо). Агенты и режимы —
   как в нашем Seller AI (content/products.ts, seller-ai). */
function sellerData(l, pn) {
  const t = T(l);
  return {
    markets: [
      { id: "uzum", n: "Uzum Market", c: "#7000ff", k: 100, margin: 57.6, floor: 35, wh: t("склад Uzum, Ташкент", "Uzum ombori, Toshkent"), status: t("ваш магазин", "do‘koningiz") },
      { id: "wb", n: "Wildberries", c: "#cb11ab", k: 104, margin: 55.1, floor: 35, wh: t("склад Wildberries, Ташкент", "Wildberries ombori, Toshkent"), status: t("новый канал", "yangi kanal") },
      { id: "ym", n: t("Яндекс Маркет", "Yandex Market"), c: "#d9a400", k: 102, margin: 56.2, floor: 35, wh: t("склад Маркета, Ташкент", "Market ombori, Toshkent"), status: t("новый канал", "yangi kanal") },
      { id: "amz", n: "Amazon", c: "#ff9900", k: 118, usd: true, rate: 12800, margin: 48.3, floor: 30, wh: "Amazon FBA", status: t("новый канал", "yangi kanal") },
    ],
    agents: [
      { id: "rivals", i: "search", def: "auto", n: t("Конкуренты", "Raqobatchilar"), w: t("цены и карточки в категории", "toifadagi narx va kartochkalar") },
      { id: "price", i: "tag", def: "ask", n: t("Цены", "Narxlar"), w: t("переоценка, маржа не ниже порога", "narxni o‘zgartirish, marja chegaradan past emas") },
      { id: "reviews", i: "star", def: "auto", n: t("Отзывы", "Sharhlar"), w: t("ответ на каждый, претензии отдельно", "har biriga javob, e’tirozlar alohida") },
      { id: "supply", i: "truck", def: "ask", n: t("Поставки", "Ta’minot"), w: t("остатки и поставки на склады", "qoldiq va omborlarga jo‘natma") },
      { id: "content", i: "pen", def: "auto", n: t("Карточки", "Kartochkalar"), w: t("заголовки и описания под поиск", "qidiruv uchun sarlavha va tavsif") },
      { id: "ads", i: "chart", def: "auto", n: t("Реклама", "Reklama"), w: t("ставки и бюджет кампаний", "kampaniya stavkasi va byudjeti") },
    ],
    steps: [
      { a: "rivals", p: "mgc", rival: "NOW Foods, Magnesium Citrate" },
      { a: "price", p: "mgc" },
      { a: "reviews", p: "d3", who: t("Покупатель", "Xaridor"), text: t("Крышка пришла треснутой, капсулы целые.", "Qopqoq yorilgan holda keldi, kapsulalar butun."), reply: t("Извините, что так вышло. Заменим банку бесплатно: новую привезут завтра, старую возвращать не нужно.", "Shunday bo‘lgani uchun uzr. Bankani bepul almashtiramiz: yangisini ertaga olib kelishadi, eskisini qaytarish shart emas.") },
      { a: "supply", p: "sleep", qty: 120, slot: "18.10" },
      { a: "content", p: "om", before: t("Омега-3 1000 мг 60 капсул", "Omega-3 1000 mg 60 kapsula"), after: t("Омега-3 1000 мг, |рыбий жир| для сердца и сосудов, 60 капсул, |курс на месяц|", "Omega-3 1000 mg, |baliq yog‘i| yurak va qon tomirlari uchun, 60 kapsula, |bir oylik kurs|") },
      { a: "ads", p: "multi", bid0: 1400, bid1: 1100, drr0: 18, drr1: 12 },
    ],
    start: { price: 148, reviews: 312, supply: 9, hours: 126 },
    how: [
      t("Подключаем кабинет продавца по API площадки: Uzum Market, Wildberries, Яндекс Маркет, Amazon Seller Central.", "Sotuvchi kabinetini maydoncha API orqali ulaymiz: Uzum Market, Wildberries, Yandex Market, Amazon Seller Central."),
      t("Две недели агенты работают в тени: считают и предлагают, но ничего не меняют. Видно, как бы они поступили.", "Ikki hafta agentlar soyada ishlaydi: hisoblaydi va taklif qiladi, lekin hech narsani o‘zgartirmaydi. Ular qanday yo‘l tutishi ko‘rinadi."),
      t("Месяц обучения: менеджер подтверждает, правит или отклоняет, агент запоминает, как вы решаете.", "Bir oy o‘qitish: menejer tasdiqlaydi, tuzatadi yoki rad etadi, agent siz qanday qaror qilishingizni eslab qoladi."),
      t("Потом режим «Сам» включается по каждому товару отдельно и только в рамках правил: минимальная маржа, лимит скидки, бюджет рекламы.", "Keyin «O‘zi» rejimi har bir mahsulot uchun alohida va faqat qoidalar doirasida yoqiladi: minimal marja, chegirma limiti, reklama byudjeti."),
      t("Всё, что сделал агент, видно в журнале этого раздела и в истории менеджеров.", "Agent qilgan hamma narsa shu bo‘lim jurnalida va menejerlar tarixida ko‘rinadi."),
    ],
    formats: [
      { p: `${grp(SELLER.code.price)} $`, t: SELLER.code[l].t, e: SELLER.code[l].e },
      { p: t(`${SELLER.sub.month} $ в месяц`, `oyiga ${SELLER.sub.month} $`), t: SELLER.sub[l].t, e: SELLER.sub[l].e },
    ],
  };
}

/* ── Общая шапка документа ──────────────────────────────────────────── */
function headTags(l, title, desc, theme = "#00573a") {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="${theme}">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}
const strip2 = (l) => {
  const t = T(l);
  return `<p class="demo-strip">${t("Макет DevUz Studio · данные демо", "DevUz Studio maketi · demo")} <a href="${href(l)}#cena">${t("Стоимость", "Narxi")}</a></p>`;
};

/* ── Магазин ────────────────────────────────────────────────────────── */
function shopPage(l) {
  const t = T(l);
  const tabs = [["home", "#/", "home", t("Главная", "Bosh sahifa")], ["catalog", "#/c/all", "grid", t("Каталог", "Katalog")], ["cart", "#/cart", "bag", t("Корзина", "Savat")], ["fav", "#/fav", "heart", t("Избранное", "Sevimlilar")], ["me", "#/me", "user", t("Профиль", "Profil")]];
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t(`${B} · магазин биодобавок · макет DevUz Studio`, `${B} · bioqo‘shimchalar do‘koni · DevUz Studio maketi`), t("Макет интернет-магазина Greenwell: каталог, рассрочка, заказ в один экран, статус доставки, отзывы за баллы.", "Greenwell internet-do‘koni maketi: katalog, muddatli to‘lov, bir ekranda buyurtma, yetkazish holati, ball uchun sharhlar."))}
@@A@@
</head>
<body class="shop" data-lang="${l}">
${sprite(CITY)}
<a class="skip" href="#view">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top" id="top">${strip2(l)}<div class="hd"><div class="hd-in">
<a class="logo" href="#/" aria-label="${B}">${logo()}</a>
<nav class="hd-nav" aria-label="${t("Разделы", "Bo‘limlar")}"><a href="#/c/all" data-tab="catalog">${t("Каталог", "Katalog")}</a>${D.CATS.slice(0, 3).map((c) => `<a href="#/c/${c.id}">${L2(c.n, l)}</a>`).join("")}</nav>
<button type="button" class="hd-s" data-search>${ic("search")}<span>${t("Поиск: магний, омега", "Qidiruv: magniy, omega")}</span></button>
<div class="lang-s"><a href="${href("ru", "shop")}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz", "shop")}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>
<div class="hd-act"><a href="#/fav">${ic("heart")}<span>${t("Избранное", "Sevimlilar")}</span><b class="bdg" data-badge="fav" hidden>0</b></a><a href="#/me">${ic("user")}<span>${t("Профиль", "Profil")}</span></a><a href="#/cart" class="cart-ic">${ic("bag")}<span>${t("Корзина", "Savat")}</span><b class="bdg" data-badge="cart" hidden>0</b></a></div>
</div></div></header>
<main id="view" tabindex="-1"></main>
<nav class="tabbar" aria-label="${t("Меню", "Menyu")}">${tabs.map(([k, u, i, n]) => `<a href="${u}" data-tab="${k}"${k === "cart" ? ' class="cart-ic"' : ""}>${ic(i)}<span>${n}</span>${k === "cart" || k === "fav" ? `<b class="bdg" data-badge="${k}" hidden>0</b>` : ""}</a>`).join("")}</nav>
<div id="search" hidden role="dialog" aria-modal="true" aria-label="${t("Поиск", "Qidiruv")}"><div class="sq-top"><form id="sq-form" role="search">${ic("search")}<input id="sq" type="search" enterkeyhint="search" autocomplete="off" placeholder="${t("Магний, омега, для сна…", "Magniy, omega, uyqu uchun…")}" aria-label="${t("Поиск", "Qidiruv")}"></form><button type="button" class="lnk" id="sq-x">${t("Отмена", "Bekor")}</button></div><div id="sq-res"></div></div>
<div id="sheet" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="gw-data">${json(shopData(l))}</script>
@@P@@
</body>
</html>`;
}

/* ── Панель ─────────────────────────────────────────────────────────── */
function panelPage(l) {
  const t = T(l);
  const nav = [["dash", "grid", t("Сводка", "Umumiy")], ["orders", "box", t("Заказы", "Buyurtmalar"), "orders"], ["reviews", "star", t("Отзывы", "Sharhlar"), "reviews"], ["goods", "tag", t("Товары и прибыль", "Mahsulotlar va foyda")], ["logistics", "truck", t("Доставка", "Yetkazish")], ["nasiya", "cal", t("Рассрочка", "Muddatli to‘lov")], ["traffic", "chart", t("Посещаемость", "Tashriflar")], ["seller", "spark", "AI Seller"], ["log", "list", t("История менеджеров", "Menejerlar tarixi")]];
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t(`Панель магазина ${B} · макет DevUz Studio`, `${B} do‘kon paneli · DevUz Studio maketi`), t("Панель магазина Greenwell: заказы с историей, отзывы, прибыль от себестоимости, скорость доставки, остатки, рассрочка, посещаемость и воронка.", "Greenwell do‘kon paneli: tarixli buyurtmalar, sharhlar, tannarx bo‘yicha foyda, yetkazish tezligi, qoldiqlar, muddatli to‘lov, tashriflar va voronka."), "#0f1c15")}
@@K@@
</head>
<body class="panel" data-lang="${l}">
${sprite()}
${strip2(l)}
<div class="app">
<div class="nav-back" onclick="document.body.classList.remove('nav-on')"></div>
<aside class="side-nav" aria-label="${t("Разделы панели", "Panel bo‘limlari")}">
<div class="brand">${logo()}<span><small>${t("Панель магазина", "Do‘kon paneli")}</small></span></div>
<nav class="nav">${nav.map(([k, i, n, c]) => `<a href="#${k}">${ic(i)}<span>${n}</span>${c ? `<i data-cnt="${c}" hidden>0</i>` : ""}</a>`).join("")}</nav>
<div class="role"><p>${t("Смотреть как", "Kim sifatida ko‘rish")}</p><div role="radiogroup"><button type="button" role="radio" data-role="owner" aria-checked="true">${t("Владелец", "Ega")}</button><button type="button" role="radio" data-role="mgr" aria-checked="false">${t("Менеджер", "Menejer")}</button></div>
<a class="to-shop" href="${href(l, "shop")}">${ic("bag")}<span>${t("Открыть магазин", "Do‘konni ochish")}</span></a></div>
</aside>
<div class="main">
<header class="topbar"><button type="button" class="ib" id="menu-b" aria-label="${t("Меню", "Menyu")}">${ic("menu")}</button>${logo("lw")}<span class="sp"></span><div class="lang-s"><a href="${href("ru", "panel")}"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz", "panel")}"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div><span class="me"><span class="av">${t("В", "S")}</span></span></header>
<main id="pv"></main>
<p class="demo" style="padding:0 28px 24px">${t("Макет DevUz Studio: данные панели демо.", "DevUz Studio maketi: panel ma’lumotlari demo.")} <a href="${TERMS(l)}">${t("Условия использования", "Foydalanish shartlari")}</a></p>
</div></div>
<div id="side" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="gp-data">${json(panelData(l))}</script>
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
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t(`макет интернет-магазина для ${B}`, `${B} uchun internet-do‘kon maketi`)}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<canvas class="gw-cv" aria-hidden="true" data-logo="${esc(JSON.stringify(LOGO.map((p) => [p.d, p.k === "word" ? "w" : p.fill])))}" data-name="${esc(t("биодобавки нового поколения", "yangi avlod bioqo‘shimchalari"))}"></canvas>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish")}</button>
</div>`;
}
const head = (kicker, h, lead, anim = "up") => `<div class="sec-head rv a-${anim}"><span class="kicker">${kicker}</span><h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>`;
const phone = (l, path, id) => `<div class="iph" id="${id}"><div class="iph-in"><div class="iscr"><iframe title="${T(l)("Магазин Greenwell", "Greenwell do‘koni")}" data-src="${href(l, "shop")}?embed=1${path}" loading="lazy"></iframe></div><span class="iisl" aria-hidden="true"></span></div></div>`;

function heroBlock(l) {
  const t = T(l);
  return `<section class="hero" id="hero" data-tone="green">
<div class="hero-bg" aria-hidden="true"><img class="hv-img" src="${IMG}/hero-caps-m.webp" srcset="${IMG}/hero-caps-m.webp 960w, ${IMG}/hero-caps.webp 1920w" sizes="100vw" alt="" fetchpriority="high" decoding="async"><video class="hv-vid" muted loop playsinline preload="none" data-src="${IMG}/hero-caps.mp4"></video></div>
<div class="wrap hero-in">
<div class="hero-txt">
<p class="kicker light">${t("Макет интернет-магазина для Greenwell", "Greenwell uchun internet-do‘kon maketi")}</p>
<h1>${t("Свой магазин Greenwell: заказ с телефона за минуту и рассрочка прямо в корзине", "Greenwell’ning o‘z do‘koni: telefondan bir daqiqada buyurtma va savatning o‘zida muddatli to‘lov")}</h1>
<p class="lead">${t("13 ваших товаров с ценами, фото, составом и отзывами покупателей. Покупатель выбирает, платит картой или в рассрочку, указывает адрес на карте и следит за курьером. После получения оставляет отзыв и получает баллы на следующую банку. Вы видите заказы, прибыль и посещаемость в своей панели.", "Narxlari, suratlari, tarkibi va xaridorlar sharhlari bilan 13 ta mahsulotingiz. Xaridor tanlaydi, karta yoki muddatli to‘lov bilan to‘laydi, manzilni xaritada ko‘rsatadi va kuryerni kuzatadi. Olgach sharh qoldiradi va keyingi banka uchun ball oladi. Siz buyurtmalar, foyda va tashriflarni o‘z panelingizda ko‘rasiz.")}</p>
<div class="hero-cta"><a class="btn btn-w shim" href="${href(l, "shop")}">${ic("bag")}<span>${t("Открыть магазин", "Do‘konni ochish")}</span></a><a class="btn btn-line" href="${href(l, "panel")}">${ic("chart")}<span>${t("Панель магазина", "Do‘kon paneli")}</span></a></div>
<ul class="hero-k"><li><b>13</b><span>${t("товаров с их сайта", "saytidagi mahsulotlar")}</span></li><li><b>80%</b><span>${t("покупателей с телефона: под него и делали", "xaridorlar telefondan: shunga moslab qildik")}</span></li><li><b>4,9 ★</b><span>${t("оценка на Uzum, перенесли", "Uzum’dagi baho, ko‘chirdik")}</span></li></ul>
</div>
<div class="hero-ph rv a-rise">${phone(l, "", "ph-hero")}<p class="ph-cap">${t("Это работает: листайте, кладите в корзину, оформляйте", "Bu ishlaydi: varaqlang, savatga soling, rasmiylashtiring")}</p></div>
</div></section>`;
}

function nowBlock(l) {
  const t = T(l);
  const now = [
    t("Сайт на Tilda: кнопка «Купить со скидкой» уводит покупателя на Uzum Market.", "Tilda’dagi sayt: «Chegirmada sotib olish» tugmasi xaridorni Uzum Market’ga olib ketadi."),
    t("На Uzum под вашей банкой магния стоят «Похожие товары» других брендов, дешевле: покупатель уходит к ним.", "Uzum’da magniy bankangiz ostida boshqa brendlarning arzonroq «O‘xshash mahsulotlari» turadi: xaridor ularga ketadi."),
    t("Своей страницы с составом и инструкцией нет у 12 товаров из 13, только у Магний Цитрата.", "13 ta mahsulotdan 12 tasining tarkibi va yo‘riqnomasi bilan o‘z sahifasi yo‘q, faqat Magniy Sitratda bor."),
    t("Отзывы (у Магний Цитрата их 1 263) живут на Uzum, на вашем сайте их не видно.", "Sharhlar (Magniy Sitratda 1 263 ta) Uzum’da, saytingizda ko‘rinmaydi."),
    t("Телефоны и повторные покупки остаются у маркетплейса: написать покупателю, что курс заканчивается, нельзя.", "Telefonlar va takroriy xaridlar marketpleysda qoladi: xaridorga kurs tugayotganini yozib bo‘lmaydi."),
  ];
  const next = [
    t("Заказ на вашем сайте за минуту: вход по коду из SMS, адрес на карте, время доставки.", "Saytingizda bir daqiqada buyurtma: SMS kod bilan kirish, xaritada manzil, yetkazish vaqti."),
    t("Рассрочка Uzum Nasiya, Alif или Anorbank в корзине: «от 15 700 сум в месяц» у каждой цены.", "Savatda Uzum Nasiya, Alif yoki Anorbank muddatli to‘lovi: har bir narx yonida «oyiga 15 700 so‘mdan»."),
    t("Страница у каждого товара: фото, состав, этикетка, заключение СЭС, отзывы, «с этим покупают».", "Har bir mahsulot sahifasi: surat, tarkib, yorliq, SES xulosasi, sharhlar, «bu bilan birga olishadi»."),
    t("Отзыв за баллы: покупатель возвращается за следующей банкой и платит баллами до 30%.", "Ball uchun sharh: xaridor keyingi banka uchun qaytadi va 30% gacha ballar bilan to‘laydi."),
    t("Своя база покупателей и панель: заказы, прибыль от себестоимости, доставка, откуда пришли.", "O‘z xaridorlar bazasi va panel: buyurtmalar, tannarx bo‘yicha foyda, yetkazish, qayerdan kelishdi."),
  ];
  return `<section class="now" id="seychas" data-tone="paper"><div class="wrap">
${head(t("Что меняем", "Nimani o‘zgartiramiz"), t("Сейчас сайт ведёт покупателя на чужую витрину", "Hozir sayt xaridorni begona vitrinaga olib boradi"), t("Мы прошли greenwell.uz и ваш магазин на Uzum как покупатель с телефона, 15.10.2026.", "Biz greenwell.uz va Uzum’dagi do‘koningizni telefondan xaridor sifatida ko‘rib chiqdik, 15.10.2026."))}
<div class="nw-grid"><div class="nw nw-now rv a-left"><h3>${ic("alert")}${t("Сейчас", "Hozir")}</h3><ul>${now.map((x) => `<li>${x}</li>`).join("")}</ul></div>
<div class="nw nw-next rv a-right"><h3>${ic("check")}${t("Станет", "Bo‘ladi")}</h3><ul>${next.map((x) => `<li>${x}</li>`).join("")}</ul></div></div>
</div></section>`;
}

function pathBlock(l) {
  const t = T(l);
  const steps = [
    ["grid", t("Выбор", "Tanlov"), t("Цели вместо названий: «Нервы и сон», «Иммунитет». Поиск с подсказками понимает «для сна» и «uyqu».", "Nomlar o‘rniga maqsadlar: «Asab va uyqu», «Immunitet». Maslahatli qidiruv «uyqu» va «stress» so‘zlarini tushunadi."), "#/c/all"],
    ["star", t("Карточка", "Kartochka"), t("Свайп-галерея, «от N сум в месяц», состав с этикетки, заключение СЭС, отзывы, «с этим покупают».", "Svayp-galereya, «oyiga N so‘mdan», yorliqdagi tarkib, SES xulosasi, sharhlar, «bu bilan birga olishadi»."), "#/p/mgc"],
    ["bag", t("Корзина", "Savat"), t("Промокод, баллы до 30% заказа, сколько осталось до бесплатной доставки.", "Promokod, buyurtmaning 30% gacha ballar, bepul yetkazishgacha qancha qolgani."), "#/cart"],
    ["pin", t("Оформление в один экран", "Bir ekranda rasmiylashtirish"), t("Телефон с кодом из SMS, адрес на карте с ориентиром, подъездом и этажом, время доставки, оплата.", "SMS kodli telefon, mo‘ljal, podyezd va qavat bilan xaritadagi manzil, yetkazish vaqti, to‘lov."), "#/checkout"],
    ["cal", t("Рассрочка", "Muddatli to‘lov"), t("Срок 3, 6 или 12 месяцев, партнёр, ПИНФЛ и карта, код, «одобрено» и график платежей.", "3, 6 yoki 12 oy muddat, hamkor, JShShIR va karta, kod, «tasdiqlandi» va to‘lovlar jadvali."), "#/c/all"],
    ["truck", t("Доставка", "Yetkazish"), t("Принят, собран, в пути с курьером на карте, доставлен. Чек в заказе.", "Qabul qilindi, yig‘ildi, kuryer bilan xaritada yo‘lda, yetkazildi. Chek buyurtmada."), "#/orders"],
    ["gift", t("Отзыв за баллы", "Ball uchun sharh"), t("После получения: «Оцените покупку». Отзыв 3 000 баллов, с фото 7 000. Баллы видно сразу.", "Olgandan keyin: «Xaridni baholang». Sharh 3 000 ball, surat bilan 7 000. Ballar darhol ko‘rinadi."), "#/me"],
    ["user", t("Кабинет", "Kabinet"), t("Заказы, баллы и уровень, адреса, избранное, рассрочки с графиком платежей.", "Buyurtmalar, ballar va daraja, manzillar, sevimlilar, to‘lov jadvali bilan muddatli to‘lovlar."), "#/me"],
  ];
  return `<section class="path" id="put" data-tone="mint"><div class="wrap">
${head(t("Путь покупателя", "Xaridor yo‘li"), t("Восемь шагов от выбора банки до отзыва", "Bankani tanlashdan sharhgacha sakkiz qadam"), t("Каждый шаг кликается: нажмите и попадёте на этот экран магазина. Заказ проходит до конца, деньги не списываются.", "Har bir qadam bosiladi: bosing va do‘konning shu ekraniga o‘tasiz. Buyurtma oxirigacha o‘tadi, pul yechilmaydi."))}
<div class="pt-grid"><ol class="pt-list">${steps.map(([i, h, p, u], k) => `<li class="rv a-up" style="--d:${k * 60}ms"><button type="button" class="pt" data-go="${u}"${k === 0 ? ' aria-current="step"' : ""}><span class="pt-n">${k + 1}</span><span class="pt-t"><b>${ic(i)}${h}</b><small>${p}</small></span></button></li>`).join("")}</ol>
<div class="pt-ph">${phone(l, "#/c/all", "ph-path")}<a class="btn btn-g" href="${href(l, "shop")}">${ic("full")}<span>${t("Магазин во весь экран", "Do‘kon to‘liq ekranda")}</span></a></div></div>
</div></section>`;
}

function nasBlock(l) {
  const t = T(l);
  return `<section class="nas" id="rassrochka" data-tone="paper"><div class="wrap nas-grid">
<div>${head(t("Рассрочка", "Muddatli to‘lov"), t("Банка за 162 000 сум превращается в «от 15 700 в месяц»", "162 000 so‘mlik banka «oyiga 15 700 dan»ga aylanadi"), t("Узбекистан покупает в рассрочку: две трети рынка у Uzum Nasiya и Alif Nasiya. Подключаем партнёров к оформлению: заявка в четыре шага не выходя из магазина, деньги магазин получает сразу, долг покупателя у партнёра.", "O‘zbekiston muddatli to‘lovga xarid qiladi: bozorning uchdan ikki qismi Uzum Nasiya va Alif Nasiya’da. Hamkorlarni rasmiylashtirishga ulaymiz: do‘kondan chiqmay to‘rt qadamda ariza, do‘kon pulni darhol oladi, xaridor qarzi hamkorda."), "left")}
<ol class="ns4">${[t("Срок и партнёр", "Muddat va hamkor"), t("ПИНФЛ и карта", "JShShIR va karta"), t("Код из SMS", "SMS kod"), t("Одобрено и график", "Tasdiqlandi va jadval")].map((x, i) => `<li><i>${i + 1}</i>${x}</li>`).join("")}</ol></div>
<div class="calc rv a-pop" id="calc"><p class="cl-k">${t("Посчитайте сами", "O‘zingiz hisoblang")}</p><label class="cl-s"><span>${t("Сумма заказа", "Buyurtma summasi")}</span><b id="cl-v">486 000 ${t("сум", "so‘m")}</b><input type="range" id="cl-r" min="162000" max="1500000" step="1000" value="486000" aria-label="${t("Сумма заказа", "Buyurtma summasi")}"></label>
<div class="cl-m" role="radiogroup">${[3, 6, 12].map((m) => `<button type="button" role="radio" aria-checked="${m === 6}" data-m="${m}">${m} ${t("мес", "oy")}</button>`).join("")}</div>
<ul class="cl-p" id="cl-p"></ul><p class="cl-f">${t("Проценты в макете демо: точные условия даёт партнёр при подключении.", "Maketdagi foizlar demo: aniq shartlarni ulanishda hamkor beradi.")}</p></div>
</div></section>`;
}

function revBlock(l) {
  const t = T(l);
  return `<section class="rvs" id="otzyvy" data-tone="ink"><div class="wrap rvs-grid">
<div class="rvs-card rv a-pop" aria-hidden="true"><div class="rc-top"><img src="${IMG}/p-mgc-s.webp" alt=""><span><b>${t("Магний Цитрат", "Magniy Sitrat")}</b><small>${t("Оцените покупку", "Xaridni baholang")}</small></span></div><p class="rc-st">★★★★★</p><p class="rc-tx">${t("Пью вторую неделю, засыпаю быстрее.", "Ikkinchi haftadan beri ichyapman, tezroq uxlayapman.")}</p><p class="rc-ph">${ic("camera")}${t("Фото добавлено", "Surat qo‘shildi")}</p><p class="rc-pts">+7 000 <small>${t("баллов", "ball")}</small></p></div>
<div>${head(t("Отзывы за баллы", "Ball uchun sharhlar"), t("Покупатель пишет отзыв и возвращается за следующей банкой", "Xaridor sharh yozadi va keyingi banka uchun qaytadi"), t("Банки рассчитаны на месяц: через месяц человеку снова нужен магний. После получения магазин просит оценку, за отзыв 3 000 баллов, с фото 7 000, и баллами можно оплатить до 30% следующего заказа. Отзывы проходят через панель: опубликовать, ответить от Greenwell, разобрать жалобу.", "Bankalar bir oyga mo‘ljallangan: bir oydan keyin odamga yana magniy kerak. Olgandan keyin do‘kon baho so‘raydi, sharh uchun 3 000 ball, surat bilan 7 000, ballar bilan keyingi buyurtmaning 30% gacha to‘lash mumkin. Sharhlar panel orqali o‘tadi: e’lon qilish, Greenwell nomidan javob berish, shikoyatni ko‘rib chiqish."), "left")}
<p class="rvs-note">${t("1 263 отзыва о Магний Цитрате и остальные с вашей витрины на Uzum перенесены в карточки товаров.", "Magniy Sitrat haqidagi 1 263 ta sharh va boshqalar Uzum’dagi vitrinangizdan mahsulot kartochkalariga ko‘chirildi.")}</p></div>
</div></section>`;
}

function panelBlock(l) {
  const t = T(l);
  const f = [
    ["box", t("Заказы", "Buyurtmalar"), t("лента, статусы, карточка с историей и себестоимостью", "lenta, holatlar, tarix va tannarxli kartochka")],
    ["star", t("Отзывы", "Sharhlar"), t("проверка, ответ от магазина, жалобы, начисленные баллы", "tekshirish, do‘kon javobi, shikoyatlar, berilgan ballar")],
    ["tag", t("Прибыль", "Foyda"), t("выручка, себестоимость, валовая прибыль и маржа по товарам", "mahsulotlar bo‘yicha tushum, tannarx, yalpi foyda va marja")],
    ["truck", t("Доставка", "Yetkazish"), t("от заказа до сборки и до вручения, опоздания, курьеры", "buyurtmadan yig‘ish va topshirishgacha, kechikishlar, kuryerlar")],
    ["chart", t("Посещаемость", "Tashriflar"), t("откуда пришли, сколько пробыли, воронка и где теряем", "qayerdan kelishdi, qancha qolishdi, voronka va qayerda yo‘qotamiz")],
    ["spark", "AI Seller", t("агенты ведут цены, отзывы и поставки на Uzum, Wildberries, Яндекс Маркете и Amazon", "agentlar Uzum, Wildberries, Yandex Market va Amazon’da narx, sharh va ta’minotni boshqaradi")],
    ["list", t("История менеджеров", "Menejerlar tarixi"), t("кто что сделал и когда", "kim nima qildi va qachon")],
  ];
  return `<section class="pnl" id="panel" data-tone="mint"><div class="wrap">
${head(t("Панель магазина", "Do‘kon paneli"), t("Владелец видит деньги, менеджер видит заказы", "Ega pulni ko‘radi, menejer buyurtmalarni ko‘radi"), t("Это работающий макет. Оформите заказ в магазине выше, и он появится в панели первой строкой. Переведите его в «Собран», и покупатель увидит это у себя. Переключатель «Владелец / Менеджер» прячет прибыль от сотрудников.", "Bu ishlaydigan maket. Yuqoridagi do‘konda buyurtma bering, u panelda birinchi qator bo‘lib chiqadi. Uni «Yig‘ildi»ga o‘tkazing, xaridor buni o‘zida ko‘radi. «Ega / Menejer» almashtirgichi foydani xodimlardan yashiradi."))}
<div class="brw rv a-rise"><div class="brw-bar" aria-hidden="true"><i></i><i></i><i></i><span>greenwell.uz/admin</span></div><iframe class="pnl-frame" title="${t("Панель магазина", "Do‘kon paneli")}" data-src="${href(l, "panel")}?embed=1" loading="lazy"></iframe></div>
<ul class="pnl-f">${f.map(([i, a, b]) => `<li class="rv a-up">${ic(i)}<span><b>${a}</b><small>${b}</small></span></li>`).join("")}</ul>
<div class="pnl-cta"><a class="btn btn-g" href="${href(l, "panel")}">${ic("full")}<span>${t("Панель во весь экран", "Panel to‘liq ekranda")}</span></a></div>
</div></section>`;
}

function offerBlock(l) {
  const t = T(l);
  const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}"><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}${a.star ? `<em class="star">${t("магазины берут первым", "do‘konlar birinchi oladi")}</em>` : ""}</b><small>${a[l].e}</small></span><span class="kit-p">+${usd(a.price)}</span></label>`;
  return `<section class="offer" id="cena" data-tone="paper"><div class="wrap">
${head(`<span class="ours">${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</span>`, t("Стоимость", "Narxi"), t("Магазин целиком, как в этом макете, без допов: 1 000 $ вместо 4 900 $, если начинаем до вторника, 20 октября, 17:00. Допы считаются отдельно: включайте тумблерами, итог пересчитается.", "Do‘kon to‘liq, bu maketdagidek, qo‘shimchasiz: 20-oktabr, seshanba, soat 17:00 gacha boshlasak, 4 900 $ o‘rniga 1 000 $. Qo‘shimchalar alohida hisoblanadi: tugmalar bilan yoqing, jami qayta hisoblanadi."))}
<div class="kit" id="konstruktor">
<div class="kit-list">
<div class="kit-base"><div><span class="kb-tag">${t("Входит всегда", "Har doim kiradi")}</span><b>${BASE[l].t}</b><p>${BASE[l].d}</p><p class="kb-w">${t(`Срок: ${BASE.weeks[0]}-${BASE.weeks[1]} недель`, `Muddat: ${BASE.weeks[0]}-${BASE.weeks[1]} hafta`)}</p></div><div class="kb-p"><s>${usd(BASE.price)}</s><b>${usd(BASE.promo)}</b><small>${t("до 20 октября", "20-oktabrgacha")}</small></div></div>
<h3 class="kit-g">${t("Допы: включайте то, что нужно магазину", "Qo‘shimchalar: do‘konga keraklisini yoqing")}</h3>
${ADDONS.map(row).join("")}
<h3 class="kit-g" id="ai-seller">${t("AI Seller: агенты на маркетплейсах", "AI Seller: marketpleyslarda agentlar")}</h3>
<p class="kit-n">${t("Наш Seller AI: агенты ведут цены, отзывы, поставки, карточки и рекламу на Uzum, Wildberries, Яндекс Маркете и Amazon. Как они работают, видно в панели, раздел «AI Seller».", "Bizning Seller AI: agentlar Uzum, Wildberries, Yandex Market va Amazon’da narxlar, sharhlar, ta’minot, kartochka va reklamani boshqaradi. Ular qanday ishlashini panelning «AI Seller» bo‘limida ko‘rish mumkin.")} <a href="${href(l, "panel")}#seller">${t("Открыть «AI Seller»", "«AI Seller»ni ochish")}</a></p>
<div class="ai-opts" role="radiogroup" aria-label="AI Seller">
<label class="kit-row ai-o"><input type="radio" name="ais" value="none" checked><span class="rd" aria-hidden="true"></span><span class="kit-t"><b>${t("Пока не нужно", "Hozircha kerak emas")}</b><small>${t("Можно подключить позже, когда магазин заработает", "Do‘kon ishlay boshlagach, keyinroq ulash mumkin")}</small></span><span class="kit-p">0 $</span></label>
<label class="kit-row ai-o"><input type="radio" name="ais" value="code" data-p="${SELLER.code.price}"><span class="rd" aria-hidden="true"></span><span class="kit-t"><b>${SELLER.code[l].t}</b><small>${SELLER.code[l].e}</small></span><span class="kit-p">+${usd(SELLER.code.price)}</span></label>
<label class="kit-row ai-o"><input type="radio" name="ais" value="sub" data-m="${SELLER.sub.month}"><span class="rd" aria-hidden="true"></span><span class="kit-t"><b>${SELLER.sub[l].t}</b><small>${SELLER.sub[l].e}</small></span><span class="kit-p">${t(`${SELLER.sub.month} $ в месяц`, `oyiga ${SELLER.sub.month} $`)}</span></label>
</div>
</div>
<div class="kit-side">
<div class="kit-total" id="kit-total">
<div class="timer" id="timer"><span>${t("Цена 1 000 $ действует", "1 000 $ narxi amal qiladi")}<small>${t("до вторника, 20 октября, 17:00 по Ташкенту", "20-oktabr, seshanba, Toshkent vaqti bilan 17:00 gacha")}</small></span><b id="tm">48:00:00</b></div>
<div class="kt-line"><span>${t("Магазин", "Do‘kon")}</span><span><s>${usd(BASE.price)}</s> ${usd(BASE.promo)}</span></div>
<div class="kt-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kit-n">0</span></span><span id="kit-add">0 $</span></div>
<div class="kt-line" id="kit-ai" hidden><span>AI Seller</span><span id="kit-ai-v"></span></div>
<div class="kt-sum"><small>${t("Итого", "Jami")}</small><b id="kit-sum">${usd(BASE.promo)}</b><small id="kit-month" hidden></small><small>${t(`со всеми допами ${usd(ALL)}`, `barcha qo‘shimchalar bilan ${usd(ALL)}`)}</small></div>
<button type="button" class="btn btn-white" id="kit-all">${t("Включить всё", "Hammasini yoqish")}</button>
<a class="btn btn-g" id="kit-go" href="https://t.me/Devuz_studio_bot?start=greenwell">${ic("tg")}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
<button type="button" class="copy" id="kit-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button>
</div>
<p class="src">${t("Цены допов: середина рынка веб-студий Ташкента и СНГ. Комиссии Click, Payme, Uzum Bank и партнёров рассрочки, хостинг и SMS магазин оплачивает сам, в цену они не входят.", "Qo‘shimchalar narxi: Toshkent va MDH veb-studiyalari bozor o‘rtachasi. Click, Payme, Uzum Bank va muddatli to‘lov hamkorlari komissiyalari, xosting va SMSni do‘kon o‘zi to‘laydi, ular narxga kirmaydi.")}</p>
</div>
</div>
</div></section>`;
}

function sitePage(l) {
  const t = T(l);
  const other = l === "ru" ? "uz" : "ru";
  const nav = [["#seychas", t("Что меняем", "Nima o‘zgaradi")], ["#put", t("Путь покупателя", "Xaridor yo‘li")], ["#rassrochka", t("Рассрочка", "Muddatli to‘lov")], ["#panel", t("Панель", "Panel")], ["#cena", t("Стоимость", "Narxi")]];
  const kit = { items: ADDONS.map((a) => ({ id: a.id, t: a[l].t, p: a.price })), base: BASE.promo, regular: BASE.price, baseName: BASE[l].t, hours: OFFER_HOURS, until: OFFER_UNTIL, nasiya: D.NASIYA, sum: t("сум", "so‘m"), mo: t("в месяц", "oyiga"), over: t("переплата", "ortiqcha to‘lov"), noOver: t("без переплаты", "ortiqcha to‘lovsiz"), copied: t("Скопировано", "Nusxalandi"), ai: { code: { t: SELLER.code[l].t, p: SELLER.code.price }, sub: { t: SELLER.sub[l].t, m: SELLER.sub.month } }, perMonth: t("в месяц", "oyiga"), plusMonth: t("и {n} $ в месяц за Seller AI", "va Seller AI uchun oyiga {n} $"), head: t(`Интернет-магазин ${B}, состав из конструктора:`, `${B} internet-do‘koni, konstruktordan tarkib:`), total: t("Итого", "Jami"), ended: t("Срок акции вышел: цена по договорённости", "Aksiya muddati tugadi: narx kelishuv bo‘yicha") };
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t(`${B} · интернет-магазин с рассрочкой · макет DevUz Studio`, `${B} · muddatli to‘lovli internet-do‘kon · DevUz Studio maketi`), t("Макет интернет-магазина Greenwell: заказ с телефона, рассрочка Uzum Nasiya и Alif, отзывы за баллы, панель магазина с прибылью и посещаемостью.", "Greenwell internet-do‘koni maketi: telefondan buyurtma, Uzum Nasiya va Alif muddatli to‘lovi, ball uchun sharhlar, foyda va tashriflar bilan do‘kon paneli."))}
<link rel="alternate" hreflang="${other}" href="${href(other)}">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=false;try{if(sessionStorage.getItem('gw-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
@@S@@
</head>
<body class="site" data-lang="${l}">
${sprite()}
${introHtml(l)}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top" id="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="${B}">${logo()}</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
<div class="top-r"><div class="lang"><a href="${href("ru")}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz")}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>
<a class="btn btn-sm btn-w" href="${href(l, "shop")}">${t("Магазин", "Do‘kon")}</a></div>
</div></header>
<main id="main">
${[heroBlock(l), nowBlock(l), pathBlock(l), nasBlock(l), revBlock(l), panelBlock(l), offerBlock(l)].join("\n")}
</main>
<footer class="foot" data-tone="ink"><div class="wrap">
<div class="cols">
<div>${logo("f-logo")}<p class="f-d">${L2(D.BRAND.dist, l)}</p><ul class="f-c"><li>${ic("tg")}<a href="https://t.me/${D.BRAND.tg}">@${D.BRAND.tg}</a></li><li>${ic("ig")}<a href="https://instagram.com/${D.BRAND.ig}">@${D.BRAND.ig}</a></li><li>${ic("globe")}<a href="https://${D.BRAND.site}">${D.BRAND.site}</a></li></ul></div>
<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=greenwell">Telegram</a></li></ul></div>
<div><b>${t("Данные макета", "Maket ma’lumotlari")}</b><ul><li>${t("Товары, цены, описания: greenwell.uz", "Mahsulotlar, narxlar, tavsiflar: greenwell.uz")}</li><li>${t("Фото, оценки, отзывы: ваш магазин на Uzum Market", "Suratlar, baholar, sharhlar: Uzum Market’dagi do‘koningiz")}</li><li>${t("Заказы, себестоимость, посещаемость: демо", "Buyurtmalar, tannarx, tashriflar: demo")}</li></ul></div>
</div>
<div class="rights"><span>${t(`Это макет: так может выглядеть интернет-магазин ${B}. Заказы, оплата, рассрочка и баллы работают для показа, деньги не списываются.`, `Bu maket: ${B} internet-do‘koni shunday ko‘rinishi mumkin. Buyurtmalar, to‘lov, muddatli to‘lov va ballar ko‘rsatish uchun ishlaydi, pul yechilmaydi.`)}</span><span>${t("Макет принадлежит DevUz Studio. Использовать его можно только по договору:", "Maket DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari")}</a></span></div>
</div></footer>
<div class="dock" id="dock"><a class="btn btn-g shim" href="${href(l, "shop")}">${ic("bag")}<span>${t("Открыть магазин", "Do‘konni ochish")}</span></a><a class="btn btn-ghost" href="#cena">${t("Стоимость", "Narxi")}</a></div>
<script type="application/json" id="kit-data">${json(kit)}</script>
<script>
${strip(read("intro.js"))}</script>
@@J@@
</body>
</html>`;
}

const out = {
  "": sitePage("ru"), uz: sitePage("uz"),
  shop: shopPage("ru"), "uz/shop": shopPage("uz"),
  panel: panelPage("ru"), "uz/panel": panelPage("uz"),
};
const parts = {
  S: `<style>${min(read("site.css")).replace(/__IMG__/g, IMG)}</style>`,
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
writeFileSync(bundleDir + "greenwell.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(12), fill(v).length);
