import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as D from "./data.mjs";
import { SHOP_UI, PANEL_UI } from "./ui.mjs";
import { BASE, ADDONS, ALL, OFFER_HOURS } from "./plan.mjs";
import { DZ_VIDEO } from "../dz-video.mjs";

/*
 * Макет сайта и интернет-магазина Amani (закрытая женская одежда, платки и
 * химары, Ташкент; канал t.me/amani_uz), uz и ru:
 *  - главная (`""`, `uz`): промо DevUz и имя Amani в арке; первый экран —
 *    шёлк, который раскрывается аркой по прокрутке (WebGL); бегущая строка;
 *    лента коллекции вбок; наборы в умру; подбор платка по лицу и случаю;
 *    «как завязать»; длина по росту; подарочная упаковка; доставка по
 *    Узбекистану; подарок за первый заказ; что взяли у лучших магазинов
 *    мира; магазин в айфоне; панель; стоимость с допами и отсчётом 48 часов;
 *  - магазин (`shop`, `uz/shop`): сначала телефон, на ПК растягивается;
 *  - панель магазина (`panel`, `uz/panel`).
 * Товары, цены, ткани, размеры, фото, адрес и часы — из их канала
 * (data.mjs, channel.json); заказы, себестоимость, посещаемость — демо, так
 * и подписано. Главный язык — узбекский: на нём весь канал.
 *
 * Стили и скрипты общие, в странице вместо них @@S@@, @@A@@, @@P@@, @@J@@,
 * @@K@@, @@Q@@. Ссылки — через __PROTO_BASE__, отпечаток ставится при показе
 * зерном из protos.stamp (lib/proto/bundles). Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/amani";
const BASEP = "__PROTO_BASE__";
const B = D.BRAND.name;
const MARK = D.BRAND.mark;
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Manrope:wght@400;700&display=swap";
const read = (f) => readFileSync(DIR + f, "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => grp(n) + " $";
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const L2 = (p, l) => (Array.isArray(p) ? (l === "ru" ? p[0] : p[1]) : p);
const href = (l, path = "") => BASEP + (l === "ru" ? "/ru" : "") + (path ? "/" + path : "");
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const CH = JSON.parse(read("channel.json"));
const MAP = JSON.parse(read("map.json"));
const sum = (l, n) => grp(n) + " " + T(l)("сум", "so‘m");

/* ── Подписи: каждая, которую зовут скрипты, должна быть на двух языках ── */
function dict(src, js, name) {
  const keys = new Set([...js.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  const dyn = { shop: ["sort_pop", "sort_cheap", "sort_dear", "sort_off", "tag_new", "tag_back", "tag_few", "kitH_her", "kitH_him", "kitS_her", "kitS_him", "st0", "st1", "st2", "st3", "pw_welcome", "pw_spent", "pw_buy", "pw_review"],
    panel: ["d7", "d30", "d90", "st0", "st1", "st2", "st3", "toSt1", "toSt2", "toSt3", "b0", "b1", "b2", "b3", "b4", "b5", "loseTip1", "loseTip2", "loseTip3", "loseTip4", "f1", "f2", "f3", "f4", "f5", "f6", "dev1", "dev2", "dev3", "log_st", "log_cour", "log_note", "log_ret", "log_rvok", "log_rvno", "log_reply", "log_cmp", "log_cost", "log_call", "log_price", "log_pts"] }[name];
  for (const k of dyn) keys.add(k);
  for (const k of ["sort_", "tag_", "pw_", "st", "b", "d", "f", "log_", "toSt", "loseTip", "dev", "kitH_", "kitS_"]) keys.delete(k);
  for (const k of keys) {
    const v = src[k];
    if (!v || v.length !== 2 || !v[0] || !v[1]) throw new Error(`${name}: нет подписи «${k}» на двух языках`);
  }
  return (l) => Object.fromEntries(Object.entries(src).map(([k, v]) => [k, L2(v, l)]));
}
const SHOP_JS = read("shop.js"), PANEL_JS = read("panel.js").replace("/*SELLER*/", "");
const shopUi = dict(SHOP_UI, SHOP_JS, "shop"), panelUi = dict(PANEL_UI, PANEL_JS, "panel");

/* ── Иконки: контуры 24×24 ───────────────────────────────────────────── */
const S = 'fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  arrow: `<path d="M5 12h14M13 6l6 6-6 6" ${S}/>`,
  chev: `<path d="m9 6 6 6-6 6" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  plus: `<path d="M12 5v14M5 12h14" ${S}/>`,
  minus: `<path d="M5 12h14" ${S}/>`,
  heart: `<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" ${S}/>`,
  bag: `<path d="M5 8h14l-1 12H6z" ${S}/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" ${S}/>`,
  star: `<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" stroke-width="1.6" stroke-linejoin="round"/>`,
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
  card: `<rect x="3" y="5.5" width="18" height="13" rx="2.5" ${S}/><path d="M3 10h18M7 15h4" ${S}/>`,
  cash: `<rect x="3" y="6.5" width="18" height="11" rx="2" ${S}/><circle cx="12" cy="12" r="2.6" ${S}/>`,
  pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${S}/><circle cx="12" cy="10" r="2.4" ${S}/>`,
  gps: `<circle cx="12" cy="12" r="3.5" ${S}/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" ${S}/><circle cx="12" cy="12" r="7" ${S}/>`,
  home: `<path d="M4 11 12 4.5l8 6.5V20h-5.5v-5h-5v5H4z" ${S}/>`,
  work: `<rect x="3.5" y="7.5" width="17" height="12" rx="2" ${S}/><path d="M9 7.5V5.5h6v2M3.5 12.5h17" ${S}/>`,
  phone: `<path d="M5 4.5h3.5l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" ${S}/>`,
  doc: `<path d="M6 3.5h8l4 4v13H6z" ${S}/><path d="M14 3.5v4h4M9 12h6M9 16h6" ${S}/>`,
  play: `<path d="M8 5.5v13l10-6.5z" ${S}/>`,
  moon: `<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" ${S}/>`,
  spark: `<path d="M12 3.5c.8 4.2 2.3 5.7 6.5 6.5-4.2.8-5.7 2.3-6.5 6.5-.8-4.2-2.3-5.7-6.5-6.5 4.2-.8 5.7-2.3 6.5-6.5z" ${S}/>`,
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
  dress: `<path d="M9 3.5h6l-1 4 4.5 12.5h-13L10 7.5z" ${S}/><path d="M10 7.5h4" ${S}/>`,
  hanger: `<path d="M12 7.5a1.8 1.8 0 1 1 1.8-1.8c0 1-.8 1.3-1.8 2.1L3.5 14.5a1 1 0 0 0 .6 1.8h15.8a1 1 0 0 0 .6-1.8L12 7.8" ${S}/>`,
  scarf: `<path d="M7 4h10c0 4-2 6-5 6S7 8 7 4z" ${S}/><path d="M9.5 9.5 8 20l3-1.5M14.5 9.5 16 20l-3-1.5" ${S}/>`,
  coat: `<path d="M8 3.5h8l4 4-2 3v10H6v-10l-2-3z" ${S}/><path d="M12 6v14.5M10 3.5l2 3 2-3" ${S}/>`,
  ruler: `<rect x="3" y="8" width="18" height="8" rx="1.5" ${S}/><path d="M7 8v3M11 8v4M15 8v3M19 8v4" ${S}/>`,
  sock: `<path d="M9 3.5h6v9l-.5 1.5-4 5.5a2.6 2.6 0 0 1-4-3.2L9 12z" ${S}/><path d="M9 7h6" ${S}/>`,
  shoe: `<path d="M3.5 16.5c0-2 1-3 3-3.5L11 11l3 3c2 .5 4 .6 6.5 1v3H3.5z" ${S}/><path d="M3.5 18.5h17" ${S}/>`,
  ihram: `<path d="M4 6h16v12H4z" ${S}/><path d="M4 10h16M9 6v12" ${S}/>`,
  belt: `<rect x="2.5" y="9" width="19" height="6" rx="2" ${S}/><rect x="9" y="8" width="6" height="8" rx="1.2" ${S}/>`,
  beads: `<circle cx="12" cy="5" r="1.6" ${S}/><circle cx="17" cy="7.5" r="1.6" ${S}/><circle cx="19" cy="12.5" r="1.6" ${S}/><circle cx="7" cy="7.5" r="1.6" ${S}/><circle cx="5" cy="12.5" r="1.6" ${S}/><path d="M12 15v5M10.5 20h3" ${S}/>`,
  arch: `<path d="M5 21V10a7 7 0 0 1 14 0v11" ${S}/><path d="M9 21v-8a3 3 0 0 1 6 0v8" ${S}/>`,
};
const sprite = (extra = "") => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
  .join("")}${extra}</defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;
const wm = (cls = "") => `<span class="wm ${cls}">${MARK}</span>`;

/* Город для карты доставки: рисунок кодом, без чужих карт и загрузок. */
const CITY = `<symbol id="am-city" viewBox="0 0 900 900"><rect width="900" height="900" fill="#f1ebe1"/>
<g fill="#e4e6d4"><path d="M40 40h200v150H40zM600 60h240v170H600zM90 600h180v200H90zM640 620h200v180H640z"/><circle cx="450" cy="450" r="70"/></g>
<path d="M-20 300C120 280 220 360 330 340S520 220 640 260 820 380 920 360" fill="none" stroke="#c9dbe4" stroke-width="22"/>
<g fill="#e8dfd2">${Array.from({ length: 36 }, (_, i) => { const x = 30 + (i % 6) * 145, y = 30 + Math.floor(i / 6) * 145; return `<rect x="${x + 18}" y="${y + 18}" width="${92 + ((i * 13) % 20)}" height="${88 + ((i * 7) % 18)}" rx="6"/>`; }).join("")}</g>
<g stroke="#fff" stroke-linecap="round" fill="none"><path d="M0 160H900M0 520H900M0 760H900M160 0V900M420 0V900M640 0V900" stroke-width="22"/><path d="M0 40l900 860M0 640 520 0" stroke-width="12"/><path d="M0 400H900M300 0V900M760 0V900" stroke-width="10"/></g>
<g stroke="#e4c48f" stroke-width="6" fill="none" stroke-linecap="round"><path d="M0 520H900M420 0V900"/></g>
<g font-family="Manrope,system-ui,sans-serif" font-size="15" fill="#8a7562" font-weight="700"><text x="440" y="508">Qoraqamish</text><text x="40" y="150">Gulsaroy</text><text x="660" y="150">Olmazor</text><text x="40" y="750">Farobiy</text><text x="660" y="750">Beruniy</text><text x="430" y="90" transform="rotate(90 430 90)">Sebzor</text></g></symbol>`;

/* ── Данные для магазина и панели ───────────────────────────────────── */
const POST = Object.fromEntries(CH.products.map((p) => [String(p.post).split("/").pop(), p]));
const dateOf = (post) => { const p = POST[post]; const d = p && p.date ? p.date.slice(0, 10).split("-") : null; return d ? `${d[2]}.${d[1]}` : ""; };
const POP = { u5846: 160, u5525: 90, d5501: 70, d5503: 75, d6370: 140, d6264: 120, d6329: 180, d6277: 170, d6326: 150, d6426: 130, d6424: 210, d6412: 110, d6342: 95, d6407: 190, d6257: 200, d6296: 80, s5843: 100, s6373: 90, s6262: 85, s6343: 220, h6304: 260, h6391: 240, h6404: 150, h6297: 280, h6062: 170, h5814: 120, o6406: 90, a5916: 60, a5917: 55, a5401: 40 };
function facts(p, l) {
  const t = T(l), out = [];
  if (p.mat) out.push(t(`Ткань: ${p.mat}, как в посте`, `Mato: ${p.mat}, postdagidek`));
  if (p.sz && p.sz.length) out.push(t(`Размер: ${p.sz.join(", ")}`, `O‘lcham: ${p.sz.join(", ")}`));
  if (p.old) out.push(t(`Цена в канале: ${sum(l, p.price)} вместо ${sum(l, p.old)}`, `Kanaldagi narx: ${sum(l, p.old)} o‘rniga ${sum(l, p.price)}`));
  out.push(t(`Пост в канале @${D.BRAND.tg} от ${dateOf(p.post)}`, `@${D.BRAND.tg} kanalidagi post, ${dateOf(p.post)}`));
  if (p.cat !== "acc") out.push(t("Цвета и посадку видно на фото и в видео поста", "Ranglar va o‘tirishi post surati va videosida ko‘rinadi"));
  return out;
}
function prods(l) {
  const o = l === "ru" ? "uz" : "ru";
  return D.PRODUCTS.map((p) => ({
    id: p.id, cat: p.cat, price: p.price, old: p.old || p.price, post: p.post, date: dateOf(p.post), sz: p.sz || [], mat: p.mat || "", tag: p.tag || "", g: p.f.length - 1, occ: p.occ || [], orders: POP[p.id] || 100,
    n: p[l].n, s: p[l].s, alt: p[o].n, b: [p.mat || "", p[o].s], facts: facts(p, l), rev: [],
  }));
}
const brandL = (l) => ({ name: B, mark: MARK, tg: D.BRAND.tg, admin: D.BRAND.admin, phone: D.BRAND.phone, phoneRaw: D.BRAND.phoneRaw, map: D.BRAND.map, addr: L2(D.BRAND.addr, l), how: L2(D.BRAND.how, l), hours: L2(D.BRAND.hours, l), tagline: L2(D.BRAND.tagline, l) });
const STREETS = [
  ["ул. Фароби", "Farobiy ko‘chasi", "Алмазарский район", "Olmazor tumani"],
  ["массив Каракамыш", "Qoraqamish massivi", "Алмазарский район", "Olmazor tumani"],
  ["ул. Себзар", "Sebzor ko‘chasi", "Шайхантахурский район", "Shayxontohur tumani"],
  ["ул. Беруни", "Beruniy ko‘chasi", "Алмазарский район", "Olmazor tumani"],
  ["пр. Амира Темура", "Amir Temur shoh ko‘chasi", "Юнусабадский район", "Yunusobod tumani"],
  ["ул. Мустакиллик", "Mustaqillik ko‘chasi", "Мирзо-Улугбекский район", "Mirzo Ulug‘bek tumani"],
  ["ул. Катартал", "Qatortol ko‘chasi", "Чиланзарский район", "Chilonzor tumani"],
  ["ул. Бунёдкор", "Bunyodkor shoh ko‘chasi", "Чиланзарский район", "Chilonzor tumani"],
  ["ул. Мукими", "Muqimiy ko‘chasi", "Чиланзарский район", "Chilonzor tumani"],
];
const SYN = {
  "абай": ["dress", "umra"], "плать": ["dress"], "умр": ["umra"], "намаз": ["umra"], "хиджаб": ["scarf"], "платок": ["scarf"], "плат": ["scarf"], "шарф": ["scarf"], "химар": ["scarf"], "куртк": ["outer"], "пальто": ["outer"], "сумк": ["acc"], "очк": ["acc"], "двойк": ["set"], "кардиган": ["set"], "лонгслив": ["set"],
  "abaya": ["dress", "umra"], "ko‘ylak": ["dress"], "koylak": ["dress"], "umra": ["umra"], "namoz": ["umra"], "hijob": ["scarf"], "ro‘mol": ["scarf"], "romol": ["scarf"], "sharf": ["scarf"], "himor": ["scarf"], "kurtka": ["outer"], "sumka": ["acc"], "ko‘zoynak": ["acc"], "ikkilik": ["set"], "dvoyka": ["set"], "kardigan": ["set"],
};
const kitsL = (l) => Object.fromEntries(Object.entries(D.KITS).map(([w, list]) => [w, list.map((x) => (x.id ? { id: x.id, on: x.on, s: L2(x.s, l) } : { ic: x.ic, n: L2(x.n, l), s: L2(x.s, l) }))]));
const WRAP = [
  ["Волосы соберите, сверху тонкая шапочка-основа: платок не скользит.", "Sochni yig‘ing, ustidan yupqa asos-qalpoqcha: ro‘mol sirpanmaydi."],
  ["Накиньте платок, один конец длиннее другого примерно на ладонь.", "Ro‘molni yopining, bir uchi ikkinchisidan taxminan bir kaft uzunroq."],
  ["Короткий конец под подбородок, длинный ведите вокруг лица и закрепите булавкой у виска.", "Qisqa uchini iyak ostiga, uzunini yuz atrofidan aylantirib, chakka yonida to‘g‘nog‘ich bilan mahkamlang."],
  ["Расправьте складки по плечам и проверьте в зеркале со всех сторон.", "Burmalarni yelka bo‘ylab yoying va oynada har tomondan tekshiring."],
];
function shopData(l) {
  const t = T(l);
  return {
    lang: l, img: IMG, ui: shopUi(l), products: prods(l), cats: D.CATS.map((c) => ({ id: c.id, i: c.i, n: L2(c.n, l) })), pairs: D.PAIRS, brand: brandL(l),
    nasiya: D.NASIYA, pays: D.PAYS.map((p) => ({ id: p.id, n: L2(p.n, l) })), shop: { ...D.SHOP, levels: D.SHOP.levels.map((x) => ({ ...x, n: L2(x.n, l) })) },
    terms: TERMS(l), other: href(l === "ru" ? "uz" : "ru", "shop"), panel: href(l, "panel"), syn: SYN,
    mats: [...new Set(D.PRODUCTS.map((p) => p.mat).filter(Boolean))], sizes: D.SIZES, otziv: D.OTZIV, kits: kitsL(l), wrap: WRAP.map((w) => L2(w, l)),
    cities: MAP.cities.filter((c) => !c[4]).map((c) => (l === "ru" ? c[0] : c[1])),
    streets: STREETS.map((s) => ({ n: l === "ru" ? s[0] : s[1], d: l === "ru" ? s[2] : s[3] })),
    popular: t("химар|умра|платок|двойка|куртка|пашмина", "himor|umra|ro‘mol|ikkilik|kurtka|pashmina").split("|"),
    quick: t("Ткань хорошая|Длина как раз|Как на фото|Красиво упаковали|Быстро привезли", "Matosi yaxshi|Uzunligi to‘g‘ri keldi|Suratdagidek|Chiroyli qadoqlashdi|Tez olib kelishdi").split("|"),
    pickups: [{ n: t("Магазин Amani, Гулсарой 1", "Amani do‘koni, Gulsaroy 1"), a: t("«Katta Azza», 1-й этаж, такси до «Safia»", "«Katta Azza», 1-qavat, taksida «Safia»"), h: "9:00-22:00" }],
  };
}
const NAMES = {
  couriers: [["Шерзод", "Sherzod"], ["Бехзод", "Behzod"], ["Улугбек", "Ulug‘bek"], ["Жасур", "Jasur"]],
  managers: [["Дилноза", "Dilnoza"], ["Мадина", "Madina"], ["Нигора", "Nigora"]],
};
function panelData(l) {
  const t = T(l), cour = NAMES.couriers.map((x) => L2(x, l)), mgr = NAMES.managers.map((x) => L2(x, l));
  const roles = {};
  mgr.forEach((m, i) => (roles[m] = [t("Старший менеджер", "Katta menejer"), t("Менеджер заказов", "Buyurtmalar menejeri"), t("Отзывы и поддержка", "Sharhlar va qo‘llab-quvvatlash")][i]));
  cour.forEach((c) => (roles[c] = t("Курьер", "Kuryer")));
  const me = t("Вы (владелец)", "Siz (ega)");
  roles[me] = t("Владелец", "Ega");
  const pn = (id) => D.PRODUCTS.find((p) => p.id === id)[l].n;
  const costShare = {}, stock = {};
  D.PRODUCTS.forEach((p, i) => { costShare[p.id] = [0.42, 0.45, 0.48, 0.4, 0.44][i % 5]; stock[p.id] = [14, 36, 8, 52, 21, 27, 44, 11, 33, 19][i % 10]; });
  return {
    lang: l, img: IMG, ui: panelUi(l), products: prods(l), cats: D.CATS.map((c) => ({ id: c.id, n: L2(c.n, l) })), shop: D.SHOP, nasiya: D.NASIYA,
    pays: D.PAYS.map((p) => ({ id: p.id, n: L2(p.n, l) })), couriers: cour, managers: mgr, roles, me,
    sources: [
      { id: "tg", n: "Telegram", w: 46, c: "#229ed9", t: "3:24", b: 21 }, { id: "ig", n: "Instagram", w: 14, c: "#c13584", t: "2:41", b: 29 },
      { id: "google", n: "Google", w: 12, c: "#4285f4", t: "2:12", b: 34 }, { id: "yandex", n: t("Яндекс", "Yandex"), w: 6, c: "#fc3f1d", t: "2:01", b: 37 },
      { id: "direct", n: t("Прямые заходы", "To‘g‘ridan-to‘g‘ri"), w: 15, c: "#8a7562", t: "3:50", b: 20 }, { id: "ads", n: t("Реклама", "Reklama"), w: 7, c: "#b08a4e", t: "1:30", b: 44 },
    ],
    districts: t("Алмазар|Шайхантахур|Юнусабад|Чиланзар|Мирзо-Улугбек|Яккасарай|Сергели|Яшнабад|Учтепа|Мирабад", "Olmazor|Shayxontohur|Yunusobod|Chilonzor|Mirzo Ulug‘bek|Yakkasaroy|Sergeli|Yashnobod|Uchtepa|Mirobod").split("|"),
    clients: t("Нигора Р.|Мадина К.|Севара А.|Феруза М.|Зарина Х.|Лола Ш.|Дилафруз Т.|Мохира Д.|Шахноза С.|Гулнора У.", "Nigora R.|Madina K.|Sevara A.|Feruza M.|Zarina X.|Lola Sh.|Dilafruz T.|Mohira D.|Shahnoza S.|Gulnora U.").split("|").map((n, i) => ({ n, ph: `+998 9${(i * 3) % 10} *** ${10 + i * 7} ${20 + i * 5}` })),
    costShare, stock,
    logActs: [
      { k: "st", who: "m", v: [t("Собран", "Yig‘ildi"), t("В пути", "Yo‘lda")] }, { k: "st", who: "c", v: [t("Доставлен", "Yetkazildi")] }, { k: "cour", who: "m", v: cour },
      { k: "call", who: "m", v: [t("подтвердила размер", "o‘lchamni tasdiqladi"), t("перенесла доставку на вечер", "yetkazishni kechqurunga ko‘chirdi"), t("уточнила примерку", "kiyib ko‘rishni aniqladi")] },
      { k: "price", who: "m", v: [`${pn("d6370")}: 800 000`, `${pn("h6304")}: 165 000`] }, { k: "pts", who: "m", v: [t("20 000 за отзыв с фото", "suratli sharh uchun 20 000")] },
      { k: "rvok", who: "m", v: [pn("u5846"), pn("h6297"), pn("d6329")] }, { k: "reply", who: "m", v: [pn("h6391"), pn("d6257")] },
    ],
    pending: [
      { id: "u5846", a: t("Камола", "Kamola"), d: "14.10", r: 5, t: t("Брала в умру: ткань не мнётся в дороге, длина как раз на мой рост 160.", "Umraga oldim: mato yo‘lda g‘ijimlanmaydi, uzunligi 160 bo‘yimga to‘g‘ri."), o: "AM-10466", photo: 1 },
      { id: "h6297", a: t("Севара", "Sevara"), d: "14.10", r: 4, t: t("Цвет как на фото, взяла два. Курьер приехал на час позже.", "Rangi suratdagidek, ikkitasini oldim. Kuryer bir soat kech keldi."), o: "AM-10461" },
      { id: "d6329", a: t("Гульнора", "Gulnora"), d: "13.10", r: 2, t: t("Пришёл другой цвет, хочу обменять на тёмно-синий.", "Boshqa rang keldi, to‘q ko‘kka almashtirmoqchiman."), o: "AM-10452", cmp: t("Перепутали цвет при сборке", "Yig‘ishda rang adashtirilgan") },
      { id: "h6391", a: t("Дилафруз", "Dilafruz"), d: "13.10", r: 5, t: t("Пашмина мягкая, упаковали красиво, дарила маме.", "Pashmina yumshoq, chiroyli qadoqlashdi, onamga sovg‘a qildim."), o: "AM-10449", photo: 1 },
    ],
    replyTpl: t("Спасибо за отзыв! Рады, что подошло. Баллы уже на счёте, ими можно оплатить следующий заказ.", "Sharh uchun rahmat! Yoqqanidan xursandmiz. Ballar hisobda, ular bilan keyingi buyurtmani to‘lash mumkin."),
    cmpReply: t("Извините за это. Курьер привезёт нужный цвет завтра и заберёт этот, бесплатно.", "Buning uchun uzr. Kuryer ertaga kerakli rangni olib keladi va buni bepul olib ketadi."),
    geo: t("Ташкент|Самарканд|Фергана|Наманган|Андижан|Бухара|Другие", "Toshkent|Samarqand|Farg‘ona|Namangan|Andijon|Buxoro|Boshqalar").split("|").map((n, i) => [n, [58, 9, 8, 7, 6, 4, 8][i]]),
    topPages: [[t("Главная", "Bosh sahifa"), 64], [t("Наборы в умру", "Umra to‘plamlari"), 23], [t("Каталог", "Katalog"), 21], [pn("d6329"), 12], [t("Корзина", "Savat"), 9], [pn("h6304"), 8]],
    searches: t("химар|умра|платье черное|пашмина|кардиган|намазник", "himor|umra|qora ko‘ylak|pashmina|kardigan|namoznik").split("|").map((s, i) => [s, [48, 36, 27, 19, 12, 9][i]]),
  };
}

/* ── Общая шапка документа ──────────────────────────────────────────── */
function headTags(l, title, desc, theme = "#f7f1e8") {
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
${headTags(l, t(`${B} · магазин закрытой одежды · макет DevUz Studio`, `${B} · yopiq kiyimlar do‘koni · DevUz Studio maketi`), t("Макет интернет-магазина Amani: платья, платки и химары, наборы в умру, длина по росту, доставка с примеркой, рассрочка, отзывы за баллы.", "Amani internet-do‘koni maketi: ko‘ylaklar, ro‘mol va himorlar, umra to‘plamlari, bo‘yga qarab uzunlik, kiyib ko‘rib yetkazish, muddatli to‘lov, ball uchun sharhlar."))}
@@A@@
</head>
<body class="shop" data-lang="${l}">
${sprite(CITY)}
<a class="skip" href="#view">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top" id="top">${strip2(l)}<div class="hd"><div class="hd-in">
<a class="logo" href="#/" aria-label="${B}">${wm()}</a>
<nav class="hd-nav" aria-label="${t("Разделы", "Bo‘limlar")}"><a href="#/c/all" data-tab="catalog">${t("Каталог", "Katalog")}</a>${D.CATS.slice(0, 4).map((c) => `<a href="#/c/${c.id}">${L2(c.n, l)}</a>`).join("")}</nav>
<button type="button" class="hd-s" data-search>${ic("search")}<span>${t("Поиск: химар, умра", "Qidiruv: himor, umra")}</span></button>
<div class="lang-s"><a href="${href("uz", "shop")}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a><a href="${href("ru", "shop")}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a></div>
<div class="hd-act"><a href="#/fav">${ic("heart")}<span>${t("Избранное", "Sevimlilar")}</span><b class="bdg" data-badge="fav" hidden>0</b></a><a href="#/me">${ic("user")}<span>${t("Профиль", "Profil")}</span></a><a href="#/cart" class="cart-ic">${ic("bag")}<span>${t("Корзина", "Savat")}</span><b class="bdg" data-badge="cart" hidden>0</b></a></div>
</div></div></header>
<main id="view" tabindex="-1"></main>
<nav class="tabbar" aria-label="${t("Меню", "Menyu")}">${tabs.map(([k, u, i, n]) => `<a href="${u}" data-tab="${k}"${k === "cart" ? ' class="cart-ic"' : ""}>${ic(i)}<span>${n}</span>${k === "cart" || k === "fav" ? `<b class="bdg" data-badge="${k}" hidden>0</b>` : ""}</a>`).join("")}</nav>
<div id="search" hidden role="dialog" aria-modal="true" aria-label="${t("Поиск", "Qidiruv")}"><div class="sq-top"><form id="sq-form" role="search">${ic("search")}<input id="sq" type="search" enterkeyhint="search" autocomplete="off" placeholder="${t("Химар, умра, платок…", "Himor, umra, ro‘mol…")}" aria-label="${t("Поиск", "Qidiruv")}"></form><button type="button" class="lnk" id="sq-x">${t("Отмена", "Bekor")}</button></div><div id="sq-res"></div></div>
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
  const nav = [["dash", "grid", t("Сводка", "Umumiy")], ["orders", "box", t("Заказы", "Buyurtmalar"), "orders"], ["reviews", "star", t("Отзывы", "Sharhlar"), "reviews"], ["goods", "tag", t("Товары и прибыль", "Mahsulotlar va foyda")], ["logistics", "truck", t("Доставка", "Yetkazish")], ["nasiya", "cal", t("Рассрочка", "Muddatli to‘lov")], ["traffic", "chart", t("Посещаемость", "Tashriflar")], ["log", "list", t("История менеджеров", "Menejerlar tarixi")]];
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t(`Панель магазина ${B} · макет DevUz Studio`, `${B} do‘kon paneli · DevUz Studio maketi`), t("Панель магазина Amani: заказы с историей, отзывы, прибыль от себестоимости, доставка, остатки, рассрочка, посещаемость и воронка.", "Amani do‘kon paneli: tarixli buyurtmalar, sharhlar, tannarx bo‘yicha foyda, yetkazish, qoldiqlar, muddatli to‘lov, tashriflar va voronka."), "#1f1915")}
@@K@@
</head>
<body class="panel" data-lang="${l}">
${sprite()}
${strip2(l)}
<div class="app">
<div class="nav-back" onclick="document.body.classList.remove('nav-on')"></div>
<aside class="side-nav" aria-label="${t("Разделы панели", "Panel bo‘limlari")}">
<div class="brand">${wm()}<span><small>${t("Панель магазина", "Do‘kon paneli")}</small></span></div>
<nav class="nav">${nav.map(([k, i, n, c]) => `<a href="#${k}">${ic(i)}<span>${n}</span>${c ? `<i data-cnt="${c}" hidden>0</i>` : ""}</a>`).join("")}</nav>
<div class="role"><p>${t("Смотреть как", "Kim sifatida ko‘rish")}</p><div role="radiogroup"><button type="button" role="radio" data-role="owner" aria-checked="true">${t("Владелец", "Ega")}</button><button type="button" role="radio" data-role="mgr" aria-checked="false">${t("Менеджер", "Menejer")}</button></div>
<a class="to-shop" href="${href(l, "shop")}">${ic("bag")}<span>${t("Открыть магазин", "Do‘konni ochish")}</span></a></div>
</aside>
<div class="main">
<header class="topbar"><button type="button" class="ib" id="menu-b" aria-label="${t("Меню", "Menyu")}">${ic("menu")}</button>${wm("lw")}<span class="sp"></span><div class="lang-s"><a href="${href("uz", "panel")}"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a><a href="${href("ru", "panel")}"${l === "ru" ? ' aria-current="true"' : ""}>RU</a></div><span class="me"><span class="av">${t("В", "S")}</span></span></header>
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

/* ── Главная ───────────────────────────────────────────────────────── */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZSIGN = `<svg class="dz-sign" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

function introHtml(l) {
  const t = T(l);
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  return `<div class="intro" id="intro" role="presentation">
${DZ_VIDEO}
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t(`макет сайта и магазина для ${B}`, `${B} uchun sayt va do‘kon maketi`)}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<canvas class="am-cv" aria-hidden="true" data-word="${MARK}" data-name="${esc(t("одежда для умры и хиджабы", "umra kiyimlari va hijoblar"))}"></canvas>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish")}</button>
</div>`;
}
const head = (kicker, h, lead, anim = "up") => `<div class="sec-head rv a-${anim}"><span class="kicker">${kicker}</span><h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>`;
const phone = (l, path, id) => `<div class="iph" id="${id}"><div class="iph-in"><div class="iscr"><iframe title="${T(l)("Магазин Amani", "Amani do‘koni")}" data-src="${href(l, "shop")}?embed=1${path}" loading="lazy"></iframe></div><span class="iisl" aria-hidden="true"></span></div></div>`;
const P = Object.fromEntries(D.PRODUCTS.map((p) => [p.id, p]));

/* Буквы имени: каждая отдельным <text>, чтобы двигать по одной. */
function heroWord() {
  const ws = [["A", 0.7], ["M", 0.9], ["Á", 0.7], ["N", 0.78], ["I", 0.34]], fs = 200, gap = 44;
  const tot = ws.reduce((s, [, w]) => s + w * fs, 0) + gap * (ws.length - 1);
  let x = (1000 - tot) / 2;
  return `<svg viewBox="0 0 1000 200" aria-hidden="true" focusable="false">${ws.map(([c, w]) => { const cx = x + (w * fs) / 2; x += w * fs + gap; return `<text x="${cx.toFixed(0)}" y="168" font-size="${fs}" text-anchor="middle">${c}</text>`; }).join("")}</svg>`;
}

function heroBlock(l) {
  const t = T(l);
  return `<section class="hero" id="hero"><div class="stage">
<div class="hero-ph" aria-hidden="true"><img src="${IMG}/h1.webp" alt="" width="600" height="800" fetchpriority="high"><img src="${IMG}/h2.webp" alt="" width="600" height="800"><img src="${IMG}/h3.webp" alt="" width="600" height="800"></div>
<canvas class="silk" id="silk" aria-hidden="true"></canvas>
<div class="veil" aria-hidden="true"></div>
<div class="hero-word">${heroWord()}</div>
<h1 class="sr">${t("Amani: закрытая женская одежда, платки и химары в Ташкенте", "Amani: Toshkentda yopiq ayollar kiyimi, ro‘mol va himorlar")}</h1>
<div class="hero-cap"><p class="hero-k">${t("Шарийные одежды · Ташкент", "Shariy liboslar · Toshkent")}</p><p>${t("Платья, платки и химары из вашего канала: новое каждый день, доставка с примеркой по Ташкенту и в регионы.", "Kanalingizdagi ko‘ylak, ro‘mol va himorlar: har kuni yangisi, Toshkent bo‘ylab kiyib ko‘rib yetkazish va viloyatlarga.")}</p>
<div class="hero-cta"><a class="btn btn-ink shim" href="${href(l, "shop")}">${ic("bag")}<span>${t("В магазин", "Do‘konga")}</span></a><a class="btn btn-ghost" href="#umra">${t("Наборы в умру", "Umra to‘plamlari")}</a></div></div>
<div class="hero-out"><p class="kicker" style="color:#efe4d6">Kuzgi kolleksiya</p><h2>${t("Осенняя <em>коллекция</em>", "Kuzgi <em>kolleksiya</em>")}</h2><p>${t("Натуральная купра, мягкий трикотаж, длина в пол. Выбирайте с телефона, примеряйте дома.", "Tabiiy kupra, yumshoq trikotaj, uzunligi polgacha. Telefondan tanlang, uyda kiyib ko‘ring.")}</p><a class="btn btn-ivory" href="#kolleksiya">${t("Смотреть коллекцию", "Kolleksiyani ko‘rish")}${ic("arrow")}</a></div>
<span class="hero-hint" aria-hidden="true"></span>
</div></section>`;
}

function marqBlock(l) {
  const words = l === "ru" ? ["Платья", "<i>Umra</i>", "Химары", "Пашмина", "<i>Kuzgi kolleksiya</i>", "Кардиганы", "Платки", "<i>Pavtor keldi</i>"] : ["Ko‘ylaklar", "<i>Umra</i>", "Himorlar", "Pashmina", "<i>Kuzgi kolleksiya</i>", "Kardiganlar", "Ro‘mollar", "<i>Pavtor keldi</i>"];
  const one = words.map((w) => `<span>${w}<svg aria-hidden="true"><use href="#i-arch"/></svg></span>`).join("");
  return `<div class="marq" aria-hidden="true"><div class="marq-t">${one}${one}</div></div>`;
}

const COL = ["d5501", "d6370", "d6329", "u5846", "d6277", "d6426", "d5503", "d6264", "h6391", "o6406"];
function colBlock(l) {
  const t = T(l);
  const cards = COL.map((id) => { const p = P[id]; return `<a class="pc" href="${href(l, "shop")}#/p/${id}"><div class="pc-im"><img src="${IMG}/p-${id}.webp" alt="${esc(L2([p.ru.n, p.uz.n], l))}" loading="lazy" width="450" height="800">${p.tag ? `<span class="pc-new">${p.tag === "new" ? "New" : p.tag === "back" ? "Pavtor" : t("Мало", "Kam")}</span>` : ""}</div><div class="pc-b"><h3>${esc(L2([p.ru.n, p.uz.n], l)).replace(/,.*$/, "")}</h3><b>${sum(l, p.price)}</b></div><small>${esc(L2([p.ru.s, p.uz.s], l))}</small></a>`; }).join("");
  return `<section class="col" id="kolleksiya"><div class="col-pin"><div class="col-st">
<div class="wrap col-h"><div><span class="kicker">${t("Коллекция", "Kolleksiya")}</span><h2>${t("Новое <em>в канале</em>", "Kanalda <em>yangi</em>")}</h2></div><p class="col-n" aria-hidden="true"><b>01</b>/${String(COL.length).padStart(2, "0")}</p></div>
<div class="col-tr">${cards}</div>
<div class="col-bar" aria-hidden="true"><i></i></div>
</div></div></section>`;
}

function kitsBlock(l) {
  const t = T(l);
  return `<section id="umra" data-tone="cream"><div class="wrap" id="kits">
${head(t("Умра", "Umra"), t("Готовые наборы <em>в умру</em>", "Umraga <em>tayyor to‘plamlar</em>"), t("Паломница собирает список целиком, а не одну вещь. Набор из ваших вещей с ценами из канала: снимите галочку с того, что уже есть, и положите остальное в корзину одной кнопкой.", "Ziyoratchi bitta narsa emas, butun ro‘yxatni yig‘adi. Kanaldagi narxlar bilan buyumlaringizdan to‘plam: borini belgidan oling, qolganini bitta tugma bilan savatga soling."))}
<div class="kits-sw" role="tablist"><button type="button" role="tab" aria-selected="true" data-who="her">${t("Для неё", "Ayollar uchun")}</button><button type="button" role="tab" aria-selected="false" data-who="him">${t("Для него", "Erkaklar uchun")}</button></div>
<div class="kit-grid"><div class="kit-vis rv a-rise"><img data-who="her" src="${IMG}/p-u5846.webp" alt="${t("Платья коллекции «Umra» на вешалке", "«Umra» kolleksiyasi ko‘ylaklari")}" width="450" height="800" loading="lazy"><div class="kit-him" data-who="him" hidden><svg viewBox="0 0 200 200" aria-hidden="true"><path d="M30 60h140v100H30z" fill="#fbf8f2" stroke="#c9b59c"/><path d="M30 92h140M88 60v100" stroke="#c9b59c" fill="none"/><path d="M60 40c20 12 60 12 80 0" stroke="#b08a4e" fill="none"/><circle cx="100" cy="176" r="4" fill="#b08a4e"/></svg><p>${t("Раздел для мужчин появится, когда добавите ихрамы", "Ehrom qo‘shganingizda erkaklar bo‘limi paydo bo‘ladi")}</p></div>
<div class="kit-bag"><svg aria-hidden="true"><use href="#i-bag"/></svg><div><b id="kit-sum">0</b><small id="kit-n"></small></div></div></div>
<div><ul class="kit-list" id="kit-list"></ul><div class="kit-foot"><a class="btn btn-ink" id="kit-go" href="${href(l, "shop")}#/kit/her">${ic("bag")}<span>${t("Собрать набор в магазине", "To‘plamni do‘konda yig‘ish")}</span></a></div>
<p class="kit-note">${t("Состав: списки «что взять в умру» у Haute Hijab, Trendyol и других (разбор рынка). Носков, мешков для обуви и мужского в канале нет: без цены и выключены.", "Tarkib: Haute Hijab, Trendyol va boshqalardagi «umraga nima olish» ro‘yxatlari. Paypoq, poyabzal xaltasi va erkaklar kiyimi kanalda yo‘q: narxsiz va o‘chiq.")}</p></div></div>
</div></section>`;
}

function finderBlock(l) {
  const t = T(l);
  return `<section id="podbor" data-tone="night"><div class="wrap" id="finder">
${head(t("Подбор платка", "Ro‘mol tanlash"), t("Платок <em>по форме лица</em> и случаю", "Yuz shakli va <em>vaziyatga qarab</em> ro‘mol"), t("Два касания: форма лица и куда собираетесь. В ответ способ завязать и платки из вашего каталога.", "Ikki bosish: yuz shakli va qayerga borasiz. Javobda o‘rash usuli va katalogingizdan ro‘mollar."))}
<div class="fd"><div style="display:grid;gap:24px">
<div class="fd-step"><b>${t("1. Форма лица", "1. Yuz shakli")}</b><div class="faces" role="radiogroup">${D.SHAPES.map((s, i) => `<button type="button" role="radio" class="face" data-s="${s.id}" aria-checked="${i === 0}"><svg viewBox="22 20 76 100" aria-hidden="true"><path d="${s.face}"/></svg>${L2(s.n, l)}</button>`).join("")}</div></div>
<div class="fd-step"><b>${t("2. Куда", "2. Qayerga")}</b><div class="occ" role="radiogroup">${D.OCC.map((o, i) => `<button type="button" role="radio" data-o="${o.id}" aria-checked="${i === 0}">${L2(o.n, l)}</button>`).join("")}</div></div></div>
<div class="fd-res rv a-pop" aria-live="polite"><div class="fd-fig"><span id="fd-fig"></span><div><p class="kicker">${t("Вам подойдёт", "Sizga mos")}</p><h3 id="fd-h"></h3></div></div><p id="fd-p"></p><ul class="fd-tips" id="fd-tips"></ul><div class="fd-pr" id="fd-pr"></div></div></div>
<p class="src">${t("Советы: общие правила из гидов по стилю (Haute Hijab и др.), без обещаний «скрыть» или «исправить».", "Maslahatlar: uslub qo‘llanmalaridagi umumiy qoidalar (Haute Hijab va boshq.), «yashirish» yoki «tuzatish» va’dalarisiz.")}</p>
</div></section>`;
}

function wrapBlock(l) {
  const t = T(l);
  const steps = [[t("Основа", "Asos"), WRAP[0]], [t("Платок на голову", "Ro‘molni boshga"), WRAP[1]], [t("Вокруг лица", "Yuz atrofidan"), WRAP[2]], [t("Складки", "Burmalar"), WRAP[3]]];
  return `<section id="kak"><div class="wrap" id="wrap">
${head(t("Как завязать", "Qanday o‘rash"), t("Платок <em>за четыре движения</em>", "Ro‘mol <em>to‘rt harakatda</em>"), t("Шаги встают сами, пока блок на экране, или по нажатию. В карточке каждого платка тот же урок и ваше видео из канала.", "Blok ekranda bo‘lsa qadamlar o‘zi chiqadi yoki bosganda. Har bir ro‘mol kartochkasida xuddi shu dars va kanalingizdagi video."))}
<div class="wr"><div class="wr-fig rv a-pop" aria-hidden="true"><svg viewBox="0 0 200 200"><path d="M36 200c6-40 30-58 64-58s58 18 64 58z" fill="#8a7562"/><rect x="88" y="112" width="24" height="34" rx="10" fill="#e7d4bf"/>
<path class="ly l1" data-s="0" d="M70 88c-2-32 14-44 30-44s32 12 30 44c-6-20-16-28-30-28s-24 8-30 28z" fill="#3b2e26"/>
<path class="ly l2" data-s="1" d="M60 98c-6-44 18-62 40-62s46 18 40 62c2 26-8 44-20 52H80c-12-8-22-26-20-52z" fill="#c9a98a"/>
<path class="ly l3" data-s="2" d="M66 112c16 22 52 24 70-2 6 16-2 34-24 40-22 4-40-12-46-38z" fill="#b48e6f"/>
<path class="ly l4" data-s="3" d="M122 122c30 10 40 40 36 78h-28c4-30-2-54-16-64z" fill="#a07d5f"/><circle class="ly l4" data-s="3" cx="131" cy="92" r="3.5" fill="#b08a4e"/>
<ellipse cx="100" cy="90" rx="21" ry="27" fill="#ead9c4"/></svg></div>
<div><ol class="wr-steps">${steps.map(([b, s], i) => `<li><button type="button"><i>${i + 1}</i><span><b>${b}</b><small>${L2(s, l)}</small></span></button></li>`).join("")}</ol>
<a class="wr-vid" href="https://t.me/${D.BRAND.tg}/6103"><span class="pl">${ic("play")}</span><img src="${IMG}/wrap.webp" alt="" width="180" height="320" loading="lazy" style="width:44px;height:72px;object-fit:cover;border-radius:10px"><span><b>${t("Три ошибки, когда завязываете платок", "Ro‘mol o‘rashdagi 3 ta xato")}</b><small>${t("Ваше видео 0:30 в канале @amani_uz", "@amani_uz kanalidagi 0:30 videongiz")}</small></span></a></div></div>
</div></section>`;
}

function sizeBlock(l) {
  const t = T(l);
  return `<section id="razmer" data-tone="cream"><div class="wrap">
${head(t("Размеры", "O‘lchamlar"), t("Длина платья <em>по вашему росту</em>", "Bo‘yingizga qarab <em>ko‘ylak uzunligi</em>"), t("В канале почти всё «Standart», и главный вопрос в личке: «на мой рост подойдёт?». Ответ теперь на странице, до заказа.", "Kanalda deyarli hammasi «Standart», shaxsiy xabardagi asosiy savol: «bo‘yimga to‘g‘ri keladimi?». Endi javob sahifada, buyurtmagacha."))}
<div class="sz"><div class="sz-calc rv a-pop"><label for="sz-r">${t("Ваш рост", "Bo‘yingiz")}</label><output id="sz-v">162 ${t("см", "sm")}</output><input type="range" id="sz-r" min="145" max="185" value="162">
<div class="sz-res"><div><small>${t("Длина изделия", "Buyum uzunligi")}</small><b id="sz-len"></b></div><div><small>${t("Размер абаи", "Abaya o‘lchami")}</small><b id="sz-size"></b></div></div>
<div class="sz-fig" aria-hidden="true"><svg viewBox="0 0 90 200"><g class="who"><circle cx="45" cy="18" r="11" fill="#c9a98a"/><path class="ab" d="M33 32h24l14 150H19z" fill="#8a7562"/></g><path d="M8 196h74" stroke="#c9b59c"/></svg></div></div>
<div><div class="tw"><table class="tbl"><thead><tr><th>${t("Рост", "Bo‘y")}</th><th>${t("Длина", "Uzunlik")}</th><th>${t("Абая", "Abaya")}</th></tr></thead><tbody>${D.SIZES.map((r) => `<tr data-s="${r.size}"><td>${r.h} ${t("см", "sm")}</td><td>${r.len} ${t("см", "sm")}</td><td>${r.size}</td></tr>`).join("")}</tbody></table></div>
<p class="src">${t("Ориентир рынка: таблица Amsons «рост → длина абаи» для обуви без каблука; 52-60 это длина в дюймах, так абаи меряют в странах Залива. Мерки Amani впишем с ваших изделий.", "Bozor mo‘ljali: Amsons «bo‘y → abaya uzunligi» jadvali, poshnasiz poyabzal uchun; 52-60 dyuymdagi uzunlik, Fors ko‘rfazi mamlakatlarida abaya shunday o‘lchanadi. Amani o‘lchamlarini buyumlaringizdan yozamiz.")}</p></div></div>
</div></section>`;
}

function giftBlock(l) {
  const t = T(l);
  return `<section id="upakovka"><div class="wrap gift">
<div class="gift-st" aria-hidden="true"><svg viewBox="0 0 300 300">
<path class="g-cloth" d="M20 70c60-30 200-30 260 0l-20 210H40z" fill="#efe1cf"/>
<g class="g-box"><rect x="62" y="140" width="176" height="120" rx="6" fill="#f6dcc0"/><text x="122" y="212" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-size="26" fill="#b08a4e" letter-spacing="5">${MARK}</text></g>
<g class="g-lid"><rect x="54" y="116" width="192" height="30" rx="6" fill="#f2cfac"/></g>
<g class="g-rib"><rect x="196" y="116" width="16" height="144" fill="#9a5d43"/></g>
<g class="g-bow"><path d="M204 116c-26-34-56-20-40 0zM204 116c26-34 56-20 40 0z" fill="#9a5d43"/></g>
<g class="g-tag"><path d="M214 126l46 30-14 22-46-30z" fill="#fbf8f2" stroke="#c9b59c"/><text id="g-prev" x="222" y="156" font-family="Cormorant Garamond,Georgia,serif" font-size="9" fill="#5b4b40" transform="rotate(33 222 156)">${t("С праздником", "Bayramingiz bilan")}</text></g>
</svg></div>
<div>${head(t("Подарок", "Sovg‘a"), t("Упакуем <em>в подарок</em>", "Sovg‘a <em>qilib qadoqlaymiz</em>"), t("У вас уже есть «Hadiya bokslari» и новая упаковка заказов. На сайте это одна галочка в корзине и открытка с её словами.", "Sizda «Hadiya bokslari» va buyurtmalarning yangi qadog‘i bor. Saytda bu savatdagi bitta belgi va uning so‘zlari bilan otkritka."))}
<div class="gift-opts"><div class="g-row">${ic("gift")}<span><b>${t("Коробка Amani", "Amani qutisi")}</b><small>${t("Как ваши подарочные боксы: платок, химар и мелочи внутри", "Sovg‘a qutilaringiz kabi: ichida ro‘mol, himor va mayda narsalar")}</small></span></div>
<div class="g-row">${ic("pen")}<span style="flex:1"><b>${t("Открытка с вашими словами", "So‘zlaringiz bilan otkritka")}</b><small>${t("Напишите здесь: текст встанет на бирку", "Shu yerga yozing: matn yorliqqa tushadi")}</small><input class="g-note" id="g-note" maxlength="40" placeholder="${t("С праздником", "Bayramingiz bilan")}" aria-label="${t("Текст открытки", "Otkritka matni")}"></span></div>
<figure class="g-row" style="align-items:center"><img src="${IMG}/box.webp" alt="${t("Подарочный бокс Amani из канала", "Kanaldagi Amani sovg‘a qutisi")}" width="450" height="800" loading="lazy" style="width:72px;height:128px;object-fit:cover;border-radius:12px"><figcaption><b>«Hadiya bokslari»</b><small>${t("Фото из вашего канала", "Kanalingizdagi surat")}</small></figcaption></figure></div></div>
</div></section>`;
}

function delivBlock(l) {
  const t = T(l);
  const hq = MAP.cities.find((c) => c[4]);
  const lbl = new Set(["Самарканд", "Бухара", "Нукус", "Фергана", "Термез", "Андижан"]);
  return `<section id="dostavka" data-tone="night"><div class="wrap">
${head(t("Доставка", "Yetkazish"), t("По Ташкенту <em>с примеркой</em>, в регионы тоже", "Toshkent bo‘ylab <em>kiyib ko‘rib</em>, viloyatlarga ham"), t("В канале: «Buyurtmalar viloyatga chiqib ketvoti» и «Primerka buyurtmalarimiz». На сайте это два варианта при оформлении.", "Kanalda: «Buyurtmalar viloyatga chiqib ketvoti» va «Primerka buyurtmalarimiz». Saytda bu rasmiylashtirishdagi ikki variant."))}
<div class="dl"><div class="dl-map rv a-pop"><svg viewBox="0 0 ${MAP.w} ${MAP.h}" role="img" aria-label="${t("Карта Узбекистана: доставка из Ташкента в областные центры", "O‘zbekiston xaritasi: Toshkentdan viloyat markazlariga yetkazish")}"><path class="land" d="${MAP.d}"/>
${MAP.cities.filter((c) => !c[4]).map((c) => { const mx = (hq[2] + c[2]) / 2, my = Math.min(hq[3], c[3]) - 40; return `<path class="rt" d="M${hq[2]} ${hq[3]}Q${mx.toFixed(0)} ${my.toFixed(0)} ${c[2]} ${c[3]}"/>`; }).join("")}
${MAP.cities.map((c) => `<circle class="ct${c[4] ? " hq" : ""}" cx="${c[2]}" cy="${c[3]}" r="${c[4] ? 6 : 3.5}"/>${lbl.has(c[0]) || c[4] ? `<text x="${c[2] > 470 ? c[2] - 8 : c[2] + 8}" y="${c[3] + 4}"${c[2] > 470 ? ' text-anchor="end"' : ""}>${l === "ru" ? c[0] : c[1]}</text>` : ""}`).join("")}
<circle class="pin" cx="${hq[2]}" cy="${hq[3]}" r="6" fill="none" stroke="#d9a888" stroke-width="2"/></svg></div>
<ul class="dl-list">
<li>${ic("truck")}<span><b>${t("Ташкент, с примеркой", "Toshkent, kiyib ko‘rib")}</b><small>${t("Курьер ждёт, пока примерите. Не подошло: вернули сразу.", "Kiyib ko‘rguningizcha kuryer kutadi. To‘g‘ri kelmasa, darhol qaytarasiz.")}</small></span></li>
<li>${ic("box")}<span><b>${t("Все регионы", "Barcha viloyatlar")}</b><small>${t("Служба доставки, трек-номер в Telegram. Цену и сроки впишете вы: в канале их нет.", "Yetkazish xizmati, trek-raqam Telegramda. Narx va muddatni siz yozasiz: kanalda ular yo‘q.")}</small></span></li>
<li>${ic("pin")}<span><b>${t("Магазин: Гулсарой 1", "Do‘kon: Gulsaroy 1")}</b><small>${L2(D.BRAND.how, l)} ${L2(D.BRAND.hours, l)}.</small></span></li></ul></div>
</div></section>`;
}

function bonusBlock(l) {
  const t = T(l);
  return `<section id="podarok"><div class="wrap">
<div class="bn"><div class="bn-box rv a-pop"><svg viewBox="0 0 240 240" aria-hidden="true"><g class="prize"><rect x="60" y="40" width="120" height="70" rx="12" fill="#2b211b"/><text x="120" y="84" text-anchor="middle" font-family="Manrope,system-ui,sans-serif" font-weight="700" font-size="22" fill="#f7f1e8">+15 000</text></g><rect x="40" y="110" width="160" height="110" rx="10" fill="#f6dcc0"/><rect x="111" y="110" width="18" height="110" fill="#9a5d43"/><g class="lid"><rect x="30" y="92" width="180" height="30" rx="8" fill="#f2cfac"/><rect x="111" y="92" width="18" height="30" fill="#9a5d43"/></g></svg><button type="button" aria-expanded="false" aria-label="${t("Открыть подарок", "Sovg‘ani ochish")}"></button></div>
<div class="bn-txt">${head(t("Первый заказ", "Birinchi buyurtma"), t("Подарок <em>за первый вход</em>", "Birinchi kirish uchun <em>sovg‘a</em>"), t("Нажмите на коробку. Механика бонусов из нашего макета Invis, только спокойнее: вместо колеса коробка.", "Qutini bosing. Invis maketimizdagi bonus mexanikasi, faqat sokinroq: g‘ildirak o‘rniga quti."), "pop")}
<p id="bn-t" hidden>${t("15 000 баллов на счёте: ими можно оплатить до 30% заказа (демо). Отзыв с фото ещё 20 000.", "Hisobda 15 000 ball: ular bilan buyurtmaning 30% gacha to‘lash mumkin (demo). Suratli sharh yana 20 000.")}</p></div></div>
<h3 style="margin:48px 0 16px">${t("Отзывы #Otziv из вашего канала", "Kanalingizdagi #Otziv sharhlari")}</h3>
<div class="otz-row">${D.OTZIV.map((z) => `<img src="${IMG}/z-${z}.webp" alt="${t("Отзыв покупательницы из канала Amani", "Amani kanalidan xaridor sharhi")}" width="360" height="640" loading="lazy">`).join("")}</div>
</div></section>`;
}

function bestBlock(l) {
  const t = T(l);
  const B5 = [
    ["Haute Hijab", t("США", "AQSh"), t("Гид по форме лица и видео-уроки.", "Yuz shakli bo‘yicha qo‘llanma va video-darslar."), t("Подбор платка и «как завязать»", "Ro‘mol tanlash va «qanday o‘rash»")],
    ["Trendyol", t("Турция", "Turkiya"), t("Набор в умру из семи вещей одной кнопкой.", "Bitta tugma bilan yetti narsadan umra to‘plami."), t("Наборы в умру с ценами из канала", "Kanaldagi narxlar bilan umra to‘plamlari")],
    ["Aab", t("Великобритания", "Buyuk Britaniya"), t("Платья в нескольких длинах.", "Bir necha uzunlikdagi ko‘ylaklar."), t("Длина по росту до заказа", "Buyurtmagacha bo‘yga qarab uzunlik")],
    ["Buttonscarves", t("Индонезия", "Indoneziya"), t("Кнопка «TRY ON» у каждого товара.", "Har bir mahsulotda «TRY ON» tugmasi."), t("Доставка с примеркой на виду", "Kiyib ko‘rib yetkazish ko‘zga tashlanadi")],
    ["Armine", t("Турция", "Turkiya"), t("«Hediye paketi»: подарочная упаковка.", "«Hediye paketi»: sovg‘a qadoq."), t("Галочка «в подарок» и открытка", "«Sovg‘a» belgisi va otkritka")],
    ["Tekbir", t("Турция", "Turkiya"), t("Мессенджер на каждой странице и рассрочка на 12 платежей.", "Har sahifada messenjer va 12 to‘lovga muddatli to‘lov."), t("Telegram у каждого товара и рассрочка", "Har bir mahsulotda Telegram va muddatli to‘lov")],
  ];
  return `<section id="luchshie" data-tone="cream"><div class="wrap">
${head(t("Разбор рынка", "Bozor tahlili"), t("Что взяли <em>у лучших</em>", "Eng yaxshilardan <em>nimani oldik</em>"), t("Мы прошли магазины скромной одежды Турции, Залива, Индонезии, Малайзии, Египта и Пакистана. Сильного узбекского бренда со своим сайтом не нашли: рынок живёт в Telegram и на маркетплейсах.", "Turkiya, Fors ko‘rfazi, Indoneziya, Malayziya, Misr va Pokistondagi yopiq kiyim do‘konlarini ko‘rib chiqdik. O‘z sayti bor kuchli o‘zbek brendini topmadik: bozor Telegram va marketpleyslarda."))}
<div class="best">${B5.map(([n, c, a, b], i) => `<article class="bst rv a-up" style="--d:${i * 70}ms"><header><b>${n}</b><small>${c}</small></header><p>${a}</p><p><strong>${t("У Amani:", "Amani’da:")}</strong> ${b}</p></article>`).join("")}</div>
</div></section>`;
}

function pathBlock(l) {
  const t = T(l);
  const steps = [
    ["grid", t("Каталог по типам", "Turlari bo‘yicha katalog"), t("Платья, умра, платки и химары, верхняя одежда вместо «New Collection». Поиск понимает «химар» и «ro‘mol».", "«New Collection» o‘rniga ko‘ylaklar, umra, ro‘mol va himorlar, ustki kiyim. Qidiruv «himor» va «ro‘mol»ni tushunadi."), "#/c/all"],
    ["dress", t("Карточка", "Kartochka"), t("Галерея, размер, длина по росту, ссылка на пост с видео, «с этим берут».", "Galereya, o‘lcham, bo‘yga qarab uzunlik, videoli postga havola, «bu bilan birga olishadi»."), "#/p/d5501"],
    ["moon", t("Набор в умру", "Umra to‘plami"), t("Пять вещей одной кнопкой в корзину.", "Besh narsa bitta tugma bilan savatga."), "#/kit/her"],
    ["gift", t("Корзина", "Savat"), t("Подарочная упаковка с открыткой, промокод, баллы до 30%.", "Otkritkali sovg‘a qadoq, promokod, 30% gacha ballar."), "#/cart"],
    ["truck", t("Оформление", "Rasmiylashtirish"), t("Ташкент с примеркой или регион, код из SMS, Click, Payme, Uzum Bank.", "Toshkent kiyib ko‘rib yoki viloyat, SMS kod, Click, Payme, Uzum Bank."), "#/checkout"],
    ["cal", t("Рассрочка", "Muddatli to‘lov"), t("Uzum Nasiya, Alif, Anorbank: «от N сум в месяц» у каждой цены.", "Uzum Nasiya, Alif, Anorbank: har narx yonida «oyiga N so‘mdan»."), "#/p/d6370"],
    ["box", t("Статус заказа", "Buyurtma holati"), t("Принят, собран, в пути с курьером на карте, доставлен.", "Qabul qilindi, yig‘ildi, kuryer bilan xaritada yo‘lda, yetkazildi."), "#/orders"],
    ["star", t("Отзыв за баллы", "Ball uchun sharh"), t("После получения: отзыв с фото 20 000 баллов. Кабинет с заказами и уровнем.", "Olgandan keyin: suratli sharh 20 000 ball. Buyurtmalar va daraja bilan kabinet."), "#/me"],
  ];
  return `<section class="path" id="put"><div class="wrap">
${head(`<span class="ours">${t("Что внутри", "Ichida nima bor")}</span>`, t("Магазин <em>в телефоне</em>: восемь шагов", "Telefonda <em>do‘kon</em>: sakkiz qadam"), t("Каждый шаг кликается: нажмите и попадёте на этот экран магазина. Заказ проходит до конца, деньги не списываются.", "Har qadam bosiladi: bosing va do‘konning shu ekraniga o‘tasiz. Buyurtma oxirigacha o‘tadi, pul yechilmaydi."))}
<div class="pt-grid"><ol class="pt-list">${steps.map(([i, h, p, u], k) => `<li class="rv a-up" style="--d:${k * 60}ms"><button type="button" class="pt" data-go="${u}"${k === 0 ? ' aria-current="step"' : ""}><span class="pt-n">${k + 1}</span><span class="pt-t"><b>${ic(i)}${h}</b><small>${p}</small></span></button></li>`).join("")}</ol>
<div class="pt-ph">${phone(l, "#/c/all", "ph-path")}<a class="btn btn-ink" href="${href(l, "shop")}">${ic("full")}<span>${t("Магазин во весь экран", "Do‘kon to‘liq ekranda")}</span></a></div></div>
</div></section>`;
}

function panelBlock(l) {
  const t = T(l);
  const f = [
    ["box", t("Заказы", "Buyurtmalar"), t("лента, статусы, примерка, подарки, карточка с историей", "lenta, holatlar, kiyib ko‘rish, sovg‘alar, tarixli kartochka")],
    ["star", t("Отзывы", "Sharhlar"), t("проверка, ответ от магазина, жалобы, баллы", "tekshirish, do‘kon javobi, shikoyatlar, ballar")],
    ["tag", t("Прибыль", "Foyda"), t("выручка, себестоимость, валовая прибыль по моделям", "modellar bo‘yicha tushum, tannarx, yalpi foyda")],
    ["truck", t("Доставка", "Yetkazish"), t("Ташкент и регионы, опоздания, курьеры", "Toshkent va viloyatlar, kechikishlar, kuryerlar")],
    ["chart", t("Посещаемость", "Tashriflar"), t("откуда пришли (Telegram первым), воронка, что ищут", "qayerdan kelishdi (Telegram birinchi), voronka, nima qidirishadi")],
    ["list", t("История менеджеров", "Menejerlar tarixi"), t("кто что сделал и когда", "kim nima qildi va qachon")],
  ];
  return `<section class="pnl" id="panel" data-tone="cream"><div class="wrap">
${head(`<span class="ours">${t("Что внутри", "Ichida nima bor")}</span>`, t("Владелец видит деньги, <em>менеджер видит заказы</em>", "Ega pulni ko‘radi, <em>menejer buyurtmalarni</em>"), t("Это работающий макет. Оформите заказ в магазине выше, и он появится в панели первой строкой. Переведите статус в «В пути», и покупательница увидит это в своём заказе.", "Bu ishlaydigan maket. Yuqoridagi do‘konda buyurtma bering, u panelda birinchi qatorda paydo bo‘ladi. Holatni «Yo‘lda»ga o‘tkazing, xaridor buni o‘z buyurtmasida ko‘radi."))}
<div class="brw rv a-rise"><div class="brw-bar" aria-hidden="true"><i></i><i></i><i></i><span>amani.uz/admin</span></div><iframe class="pnl-frame" title="${t("Панель магазина", "Do‘kon paneli")}" data-src="${href(l, "panel")}?embed=1" loading="lazy"></iframe></div>
<ul class="pnl-f">${f.map(([i, a, b]) => `<li class="rv a-up">${ic(i)}<span><b>${a}</b><small>${b}</small></span></li>`).join("")}</ul>
<div class="pnl-cta"><a class="btn btn-ink" href="${href(l, "panel")}">${ic("full")}<span>${t("Панель во весь экран", "Panel to‘liq ekranda")}</span></a></div>
</div></section>`;
}

function offerBlock(l) {
  const t = T(l);
  const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}"><span class="sw" aria-hidden="true"></span><span class="kit-t2"><b>${a[l].t}${a.star ? `<em class="star">${t("берут первым", "birinchi olishadi")}</em>` : ""}</b><small>${a[l].e}</small></span><span class="kit-pr">+${usd(a.price)}</span></label>`;
  return `<section class="offer" id="cena"><div class="wrap">
${head(`<span class="ours">${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</span>`, t("Стоимость", "Narxi"), t(`Сайт и магазин целиком, как в этом макете, без допов: ${usd(BASE.promo)} вместо ${usd(BASE.price)}, если начинаем в течение 48 часов. Допы считаются отдельно: включайте тумблерами, итог пересчитается.`, `Sayt va do‘kon to‘liq, shu maketdagidek, qo‘shimchalarsiz: 48 soat ichida boshlasak, ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}. Qo‘shimchalar alohida: tumblerlar bilan yoqing, jami qayta hisoblanadi.`))}
<div class="kit" id="konstruktor">
<div class="kit-l">
<div class="kit-base"><div><span class="kb-tag">${t("Входит всегда", "Har doim kiradi")}</span><b>${BASE[l].t}</b><p>${BASE[l].d}</p><p class="kb-w">${t(`Срок: ${BASE.weeks[0]}-${BASE.weeks[1]} недель`, `Muddat: ${BASE.weeks[0]}-${BASE.weeks[1]} hafta`)}</p></div><div class="kb-p"><s>${usd(BASE.price)}</s><b>${usd(BASE.promo)}</b><small>${t("48 часов", "48 soat")}</small></div></div>
<h3 class="kit-g">${t("Допы: включайте то, что нужно магазину", "Qo‘shimchalar: do‘konga keraklisini yoqing")}</h3>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side">
<div class="kit-total" id="kit-total">
<div class="timer" id="timer"><span>${t(`Цена ${usd(BASE.promo)} действует`, `${usd(BASE.promo)} narxi amal qiladi`)}<small>${t("48 часов с первого открытия макета", "maket birinchi ochilgandan 48 soat")}</small></span><b id="tm">48:00:00</b></div>
<div class="kt-line"><span>${t("Сайт и магазин", "Sayt va do‘kon")}</span><span><s>${usd(BASE.price)}</s> ${usd(BASE.promo)}</span></div>
<div class="kt-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kit-cnt">0</span></span><span id="kit-add">0 $</span></div>
<div class="kt-sum"><small>${t("Итого", "Jami")}</small><b id="kit-total-sum">${usd(BASE.promo)}</b><small>${t(`со всеми допами ${usd(ALL)}`, `barcha qo‘shimchalar bilan ${usd(ALL)}`)}</small></div>
<button type="button" class="btn btn-ivory" id="kit-all">${t("Включить всё", "Hammasini yoqish")}</button>
<a class="btn btn-ivory shim" href="https://t.me/Devuz_studio_bot?start=amani">${ic("tg")}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
<button type="button" class="copy" id="kit-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button>
</div>
<p class="src">${t("Цены допов: середина рынка веб-студий Ташкента и СНГ. Комиссии Click, Payme, Uzum Bank и партнёров рассрочки, хостинг, SMS и курьерские службы магазин оплачивает сам.", "Qo‘shimchalar narxi: Toshkent va MDH veb-studiyalari bozor o‘rtachasi. Click, Payme, Uzum Bank va muddatli to‘lov hamkorlari komissiyalari, xosting, SMS va kuryerlik xizmatlarini do‘kon o‘zi to‘laydi.")}</p>
</div>
</div></section>`;
}

function siteData(l) {
  const t = T(l);
  const kit = (w) => ({ items: D.KITS[w].map((x) => (x.id ? { id: x.id, n: L2([P[x.id].ru.n, P[x.id].uz.n], l), s: L2(x.s, l), price: P[x.id].price, img: `p-${x.id}-s.webp`, on: !!x.on } : { ic: x.ic, n: L2(x.n, l), s: L2(x.s, l), price: 0, on: false })) });
  const scarves = D.PRODUCTS.filter((p) => p.occ && p.occ.length).map((p) => ({ id: p.id, n: L2([p.ru.n, p.uz.n], l), price: p.price, img: `p-${p.id}-s.webp`, occ: p.occ }));
  return {
    img: IMG, shop: href(l, "shop"), sum: t("сум", "so‘m"), cm: t("см", "sm"), priceYours: t("цену впишете", "narxni yozasiz"),
    kitN: t("вещей в наборе: {n} из {m}", "to‘plamda: {m} tadan {n} ta"), kitOpen: t(", без цены: {n}", ", narxsiz: {n}"),
    kits: { her: kit("her"), him: kit("him") },
    finder: { shapes: D.SHAPES.map((s) => ({ id: s.id, face: s.face, wrap: L2(s.wrap, l), why: L2(s.why, l), tips: s.tips.map((x) => L2(x, l)) })), occ: D.OCC.map((o) => ({ id: o.id, c: o.c, tip: L2(o.tip, l) })), products: scarves },
    sizes: D.SIZES,
    offer: { items: ADDONS.map((a) => ({ id: a.id, t: a[l].t, p: a.price })), base: BASE.promo, baseName: BASE[l].t, hours: OFFER_HOURS, head: t("Сайт и магазин Amani, состав:", "Amani sayti va do‘koni, tarkibi:"), totalW: t("Итого", "Jami"), copied: t("Скопировано", "Nusxalandi"), ended: t("Акция закончилась, цена обычная", "Aksiya tugadi, narx odatiy") },
  };
}

function sitePage(l) {
  const t = T(l);
  const other = l === "ru" ? "uz" : "ru";
  const nav = [["#kolleksiya", t("Коллекция", "Kolleksiya")], ["#umra", t("Умра", "Umra")], ["#podbor", t("Подбор платка", "Ro‘mol tanlash")], ["#razmer", t("Размеры", "O‘lchamlar")], ["#dostavka", t("Доставка", "Yetkazish")], ["#cena", t("Стоимость", "Narxi")]];
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l, t(`${B} · одежда для умры и хиджабы · макет DevUz Studio`, `${B} · umra kiyimlari va hijoblar · DevUz Studio maketi`), t("Макет сайта Amani: шёлк, который раскрывается аркой, коллекция из канала, наборы в умру, подбор платка, длина по росту, доставка с примеркой, магазин и панель владельца.", "Amani sayti maketi: arka bo‘lib ochiladigan ipak, kanaldagi kolleksiya, umra to‘plamlari, ro‘mol tanlash, bo‘yga qarab uzunlik, kiyib ko‘rib yetkazish, do‘kon va ega paneli."))}
<link rel="alternate" hreflang="${other}" href="${href(other)}">
<link rel="preload" as="image" href="${IMG}/h1.webp">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=false;try{if(sessionStorage.getItem('am-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
@@S@@
</head>
<body class="site" data-lang="${l}">
${sprite()}
${introHtml(l)}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top" id="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="${B}"><img src="${IMG}/icon-192.png" alt="" width="36" height="36">${wm()}</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
<div class="top-r"><div class="lang"><a href="${href("uz")}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a><a href="${href("ru")}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a></div>
<a class="btn btn-sm btn-ink" href="${href(l, "shop")}">${t("Магазин", "Do‘kon")}</a></div>
</div></header>
<main id="main">
${[heroBlock(l), marqBlock(l), colBlock(l), kitsBlock(l), finderBlock(l), wrapBlock(l), sizeBlock(l), giftBlock(l), delivBlock(l), bonusBlock(l), bestBlock(l), pathBlock(l), panelBlock(l), offerBlock(l)].join("\n")}
</main>
<footer class="foot" data-tone="night"><div class="wrap">
<div class="cols">
<div>${wm("f-logo")}<p class="f-d">${L2(D.BRAND.tagline, l)}. ${L2(D.BRAND.addr, l)}. ${L2(D.BRAND.hours, l)}.</p><ul class="f-c"><li>${ic("tg")}<a href="https://t.me/${D.BRAND.admin}">${t("Заказ", "Buyurtma")}: @${D.BRAND.admin}</a></li><li>${ic("tg")}<a href="https://t.me/${D.BRAND.tg}">${t("Канал", "Kanal")}: @${D.BRAND.tg}</a></li><li>${ic("phone")}<a href="tel:${D.BRAND.phoneRaw}">${D.BRAND.phone}</a></li><li>${ic("pin")}<a href="${D.BRAND.map}">${t("Магазин на карте", "Do‘kon xaritada")}</a></li></ul></div>
<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=amani">Telegram</a></li></ul></div>
<div><b>${t("Данные макета", "Maket ma’lumotlari")}</b><ul><li>${t("Товары, цены, ткани, фото, адрес: канал @amani_uz", "Mahsulotlar, narxlar, matolar, suratlar, manzil: @amani_uz kanali")}</li><li>${t("Заказы, себестоимость, посещаемость, условия доставки и рассрочки: демо", "Buyurtmalar, tannarx, tashriflar, yetkazish va muddatli to‘lov shartlari: demo")}</li></ul></div>
</div>
<div class="rights"><span>${t(`Это макет: так может выглядеть сайт и магазин ${B}. Заказы, оплата, рассрочка и баллы работают для показа, деньги не списываются.`, `Bu maket: ${B} sayti va do‘koni shunday ko‘rinishi mumkin. Buyurtmalar, to‘lov, muddatli to‘lov va ballar ko‘rsatish uchun ishlaydi, pul yechilmaydi.`)}</span><a href="${TERMS(l)}">${t("Условия использования макета", "Maketdan foydalanish shartlari")}</a></div>
</div></footer>
<div class="dock" id="dock"><a class="btn btn-ink shim" href="${href(l, "shop")}">${ic("bag")}<span>${t("Открыть магазин", "Do‘konni ochish")}</span></a><a class="btn btn-ghost" href="#cena">${t("Цена", "Narx")}</a></div>
<script type="application/json" id="am-data">${json(siteData(l))}</script>
<script>
${strip(read("intro.js"))}</script>
<script src="${IMG}/gsap.min.js"></script>
<script src="${IMG}/ScrollTrigger.min.js"></script>
@@J@@
</body>
</html>`;
}

/* Главный язык — узбекский: на нём весь канал Amani. Русский — /ru. */
const out = {
  "": sitePage("uz"), ru: sitePage("ru"),
  shop: shopPage("uz"), "ru/shop": shopPage("ru"),
  panel: panelPage("uz"), "ru/panel": panelPage("ru"),
};
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
writeFileSync(bundleDir + "amani.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(uz)").padEnd(12), fill(v).length);
