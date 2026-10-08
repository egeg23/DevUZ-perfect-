import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { ADDONS, BASE as KIT_BASE, BLOCKS, GROUPS } from "./plan.mjs";

/*
 * Прототип ПК Веста (pkvesta.kz): завод быстровозводимых стальных зданий,
 * центральный офис в Алматы. Собран на каркасе ShahaR.Uz (scripts/protos/
 * shahar): шапка, заставка DevUz, конструктор цены, «было / стало».
 * Шесть страниц на русском. Исследование и конкуренты —
 * docs/research/pkvesta.md, снимки — SOURCES.md.
 *
 * Всё о заводе — только с pkvesta.kz (снято 08.10.2026): с 1991 года, 35 лет
 * на рынке, 1500 проектов, 100 тысяч онлайн-расчётов в год, 50 регионов в
 * WebSteel, 100% болтовое соединение, каталог отраслей, объекты с размерами,
 * история, контакты. Цен в прототипе нет: на сайте они в рублях для России и
 * ориентировочные. Наши дополнения подписаны «Предложение DevUz Studio».
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/pkvesta";
const CSS = readFileSync(DIR + "style.css", "utf8").replace(/\n/g, "").replace(/__IMG__/g, IMG);
const INTRO = readFileSync(DIR + "intro.js", "utf8");
const JS_MAIN = readFileSync(DIR + "client.js", "utf8");
const ASM = readFileSync(DIR + "assembly.js", "utf8");
const BASE = "__PROTO_BASE__";
const TERMS = "https://devuz.studio/ru/mockup-terms";
const FONTS = "https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Manrope:wght@400;700&display=swap";

const usd = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
const sp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (path = "") => BASE + (path ? "/" + path : "");
const dec = (n) => String(n).replace(".", ",");

/* ── Факты с их сайта ─────────────────────────────────────────────────── */
const F = {
  name: "ПК Веста",
  phone: "+7 (727) 345-47-53",
  tel: "+77273454753",
  wa: "79109434966",
  waShow: "+7 (910) 943-49-66",
  email: "info@pkvesta.kz",
  address: "Алматы, ул. Тимирязева, 15Б, 4 этаж",
  hours: "пн-пт 8:00-17:30",
  bin: "100340015435",
  websteel: "https://www.websteel.pkvesta.ru/Home/StepOne",
  tg: "https://t.me/+ut_53pCgybc0MzYy",
  yt: "https://www.youtube.com/channel/UCUxNFXR7C1n03uZ2wTkNhEQ",
  video: "https://www.youtube.com/watch?v=cmK0lRFxV1Q",
  site: "https://pkvesta.kz",
};
const waLink = (text) => `https://wa.me/${F.wa}?text=${encodeURIComponent(text)}`;

/* Объекты с фото (визуализации WebSteel со страниц «Наши объекты»). */
const OBJ = [
  { id: 213, kind: "Фруктохранилище", w: 56, l: 76, h: 8, frame: "ЛСТК", city: "Астана", country: "Казахстан", ind: "agro", slug: "213-bystrovozvodimoe-fruktokhranilishche-56sh-kh-76d-kh-8v-iz-lstk-v-g-astana-kazakhstan5935" },
  { id: 203, kind: "Ледовая арена", w: 30, l: 80, h: 6, frame: "ЛСТК", city: "Ташкент", country: "Узбекистан", ind: "sport", slug: "203-bystrovozvodimaya-ledovaya-arena-30sh-kh-80d-kh-6v-iz-lstk-v-g-tashkent-uzbekistan" },
  { id: 199, kind: "Спортивный зал", w: 24, l: 62, h: 6, frame: "ЛСТК", city: "Ташкент", country: "Узбекистан", ind: "sport", slug: "199-bystrovozvodimyy-sportivnyy-zal-24sh-kh-62d-kh-6v-v-g-tashkent-uzbekistan" },
  { id: 204, kind: "Цех по изготовлению сэндвич-панелей", w: 28, l: 102, h: 7.2, frame: "", city: "с. Кущёвская", country: "Россия", ind: "prom", slug: "204-bystrovozvodimyy-tsekh-28sh-kh-102d-kh-7-2v-po-izgotovleniyu-sendvich-paneley-v-s-kushchevskaya-" },
  { id: 217, kind: "Склад и магазин метизов", w: 24, l: 60, h: 10, frame: "ГИБРИД", city: "Москва", country: "Россия", ind: "comm", slug: "217-bystrovozvodimyy-sklad-magazin-24sh-kh-60d-kh-10v-iz-gibrida-dlya-khraneniya-metiznoy-gruppy-v-g" },
];
const objName = (o) => `${o.kind} ${o.w} × ${o.l} × ${dec(o.h)} м`;
const dims = (o) => `${o.w}<small>×</small>${o.l}<small>×</small>${dec(o.h)}`;

/* Казахстан и Ташкент: объекты из списка на pkvesta.kz, по координатам городов. */
const GEO = [
  { c: "Петропавловск", x: 62.2, y: 7.1, items: ["Производственный цех 24 × 36 × 4,5 м"] },
  { c: "Кокшетау", x: 62.9, y: 16.9, items: ["Зернохранилище 18 × 28 × 7,76 м"] },
  { c: "Павлодар", x: 85.1, y: 23.2, lf: true, items: ["Автосервис 15 × 24 × 7,2 м"] },
  { c: "Астана", x: 68.9, y: 30.4, items: ["Фруктохранилище 56 × 76 × 8 м", "Завод дорожной плитки: 15 × 48 × 8, 18 × 48 × 10,5 и 9 × 24 × 10,5 м"] },
  { c: "Атырау", x: 11.5, y: 55.6, items: ["Станция газоснабжения 9 × 12 × 4,5 м"] },
  { c: "Алматы", x: 85, y: 79.8, lf: true, items: ["Автосервис 12 × 24 × 7 м"] },
  { c: "Ташкент", x: 62.5, y: 91.9, uz: true, items: ["Ледовая арена 30 × 80 × 6 м", "Спортивный зал 24 × 62 × 6 м"] },
];

/* Отрасли и типы зданий — меню «Каталог быстровозводимых зданий» на pkvesta.kz. */
const IND = [
  { k: "agro", n: "Сельское хозяйство", ic: "farm", ex: 213, lead: "Фермы, коровники, овощехранилища и ангары. Комплексные решения: быстрый монтаж и высокое качество.", items: ["Акваферма", "Винная ферма", "Грибная ферма", "Зернохранилище", "Картофелехранилище", "Козья ферма", "Конюшня", "Коровник", "Кролиководческая ферма", "Куриная ферма", "Молочная ферма", "Овощехранилище", "Овцеферма", "Овчарня", "Перепелиная ферма", "Птичник", "Раковая ферма", "Рыбоферма", "Свинарник", "Сенохранилище", "Страусиная ферма", "Сыроварня", "Теплица", "Фазанья ферма", "Ферма", "Ферма для КРС", "Фруктохранилище", "Цветочная ферма"] },
  { k: "comm", n: "Коммерческие здания", ic: "shop", ex: 217, lead: "Гостиницы, офисы, кафе, отели и торговые центры: здания с высокими тепло- и звукоизоляционными свойствами.", items: ["Аптека", "Гостиница", "Кафе", "Котельная", "Лайт индастриал", "Минихранилище", "Общежитие", "Отель", "Офисное здание", "Пекарня", "Рынок", "Склад", "Столовая", "Тёплый склад", "Торговое здание, магазин", "Торговый центр", "Хостел"] },
  { k: "prom", n: "Промышленность", ic: "factory", ex: 204, lead: "Цеха, заводы, АБК, склады и мастерские: энергоэффективные здания под ключ под новое производство.", items: ["Административное здание", "Ангар", "Бумажная фабрика", "Завод", "Кирпичный завод", "Лаборатория", "Логистический комплекс", "Модульный молочный завод", "Обработка древесины", "Очистные сооружения", "Производственное здание", "Производство пластмассы", "Транспортные средства", "Фабрика", "Цементный завод", "Цех", "Швейная фабрика"] },
  { k: "sport", n: "Спортивные здания", ic: "sport", ex: 203, lead: "Спортивные залы, манежи, катки и бассейны: надёжные и безопасные здания.", items: ["Бассейн", "Легкоатлетический манеж", "Ледовая арена, каток", "Оздоровительный комплекс", "Спортивный зал", "Теннисный корт", "ФОК", "Футбольный манеж"] },
  { k: "tech", n: "Техника", ic: "car", ex: 0, lead: "Ангары, автосервисы, гаражи и автомойки: функциональные и энергоэффективные здания для работы.", note: "Автосервисы в Алматы 12 × 24 × 7 м и Павлодаре 15 × 24 × 7,2 м", items: ["Авиаангар", "Автомойка", "Автосалон", "Автосервис", "Ангар для автодрома", "Ангар для машин", "Навес"] },
  { k: "gen", n: "Общие здания", ic: "home", ex: 0, lead: "Гаражи, дома, дома под глэмпинг и пожарные депо.", items: ["Гараж", "Дом", "Дом под глэмпинг", "Пожарное депо"] },
];
const TYPES_N = IND.reduce((s, x) => s + x.items.length, 0);

/* Логотип DevUz Studio для заставки — тот же, что в промо на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZMARK = `<svg class="dz-mark" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

/* Домик с логотипа ПК Веста: синий дом, проём, жёлтые ворота. */
const HOUSE = "M50 5 L95 46 L85 46 L85 95 L15 95 L15 46 L5 46 Z";
const OPEN_HOLE = "M28 50 L72 50 L72 86 L28 86 Z";
const logoMark = (cls = "") => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="${HOUSE} ${OPEN_HOLE}" fill="#2C4A94" fill-rule="evenodd" stroke="#1B2F66" stroke-width="3" stroke-linejoin="round"/><rect x="45" y="22" width="10" height="10" rx="2" fill="#fff" stroke="#1B2F66" stroke-width="2"/><rect x="28" y="50" width="44" height="36" fill="#fff"/><path d="M27 41 L71 37 L75 63 L31 67 Z" fill="#D6E01C" stroke="#1B2F66" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
const houseIntro = `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="${HOUSE} ${OPEN_HOLE}" fill="#2C4A94" fill-rule="evenodd" stroke="#0E1B38" stroke-width="2.5" stroke-linejoin="round"/><rect x="45" y="22" width="10" height="10" rx="2" fill="#fff" stroke="#0E1B38" stroke-width="2"/></svg>`;

/* Иконки — контуры 24×24, по смыслу. */
const I = (d, w = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  wa: I('<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-1.9-1-1 .8a4 4 0 0 1-2.2-2.2l.8-1-1-1.9z"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  calc: I('<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h.01M12 18h.01"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>', 2),
  arrows: I('<path d="m9 7-5 5 5 5M15 7l5 5-5 5"/>', 2),
  check: I('<path d="m5 12 5 5 9-10"/>', 2),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  bolt: I('<path d="M8 4h8l3 5-3 5H8L5 9z"/><circle cx="12" cy="9" r="2"/><path d="M12 14v6"/>'),
  shield: I('<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
  span: I('<path d="M3 20V9l9-5 9 5v11"/><path d="M3 9h18M7 20v-7M17 20v-7"/>'),
  globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  truck: I('<path d="M2 6h11v10H2zM13 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'),
  farm: I('<path d="M3 21V10l6-5 6 5v11"/><path d="M15 21V12h6v9M3 21h18M7 21v-5h4v5"/>'),
  shop: I('<path d="M4 7h16l-1.5 13h-13z"/><path d="M9 7a3 3 0 0 1 6 0"/>'),
  factory: I('<path d="M3 21V11l5 3V11l5 3V7h3l1 14"/><path d="M3 21h18M18 7V3h2v18"/>'),
  sport: I('<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6c3.5 3 3.5 9.8 0 12.8M18.4 5.6c-3.5 3-3.5 9.8 0 12.8"/>'),
  car: I('<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3zM7 19v1M17 19v1M5 11h14"/>'),
  home: I('<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  draw: I('<path d="M3 21l3-1 11-11-2-2L4 18z"/><path d="M14 6l2 2M3 3h7M3 7h4"/>'),
  doc: I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
  found: I('<path d="M3 20h18M5 20v-4h14v4M8 16V9h8v7"/>'),
  laser: I('<path d="M12 2v6M12 22v-6M2 12h6M22 12h-6"/><circle cx="12" cy="12" r="2"/>'),
  team: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5.5 5.5 0 0 1 3.5 6"/>'),
  play: I('<path d="M8 5v14l11-7z"/>', 2),
  tg: I('<path d="M21 4 3 11l6 2.5M21 4l-3.5 16-8.5-6.5M21 4 9 13.5V19l3-3.5"/>'),
  panel: I('<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18"/>'),
  chart: I('<path d="M3 20h18"/><path d="M6 16v-4M11 16V8M16 16v-6M21 16V5"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  video: I('<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="m15.5 10 6-3.5v11l-6-3.5"/>'),
  filter: I('<path d="M3 5h18l-7 8v6l-4 2v-8z"/>'),
};
const ic = (k, size = 16) => ICON[k].replace("<svg", `<svg width="${size}" height="${size}"`);

/* Названия страниц: в меню и в конструкторе. */
const PAGE_NAMES = { "": "Главная", katalog: "Каталог", obekt: "Объекты", raschet: "Расчёт", zavod: "О заводе", plan: "Что дальше" };
const PAGES = ["", "katalog", "obekt", "raschet", "zavod", "plan"];

/* ── Конструктор: плашка на каждой странице ───────────────────────────── */
function kdRow(a, def = true) {
  return `<label class="kd-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="${(a.needs || []).join(" ")}"${def ? " data-def checked" : ""}><span class="sw" aria-hidden="true"></span><span class="kd-t"><b>${a.ru.t}${a.star ? "<em>обязательно</em>" : ""}</b>${a.ru.e ? `<small>${a.ru.e}</small>` : ""}</span><span class="kd-p num">+${usd(a.price)}</span></label>`;
}
function dockHtml(path) {
  const group = (title, side, rows) => (rows.length ? `<section class="kd-g"><h3><span>${title}</span>${side}</h3>${rows.join("")}</section>` : "");
  const here = ADDONS.filter((a) => a.where === path);
  const all = ADDONS.filter((a) => a.where === "all");
  const others = [...new Set(ADDONS.map((a) => a.where))].filter((w) => w !== "all" && w !== path);
  return `<button class="kd-pill" type="button" id="kd-pill" aria-expanded="false" aria-controls="kd"><i aria-hidden="true"></i>Конструктор<b class="num" id="kd-pill-sum"></b></button>
<aside class="kd" id="kd" role="dialog" aria-label="Конструктор сайта" hidden>
<header class="kd-h"><div><p class="kd-k">Конструктор · предложение DevUz Studio</p><h2>Что войдёт в новый сайт ПК Веста</h2><p class="kd-sub">Выключите блок, и он пропадёт со страницы. Включите, и он появится снова. Итог пересчитывается сразу.</p></div><button class="kd-x" type="button" id="kd-x" aria-label="Свернуть">×</button></header>
<div class="kd-list">
${group("На этой странице", "", here.map((a) => kdRow(a)))}
${group("На всех страницах", "", all.map((a) => kdRow(a)))}
${others.map((w) => group(PAGE_NAMES[w], `<a href="${href(w)}">открыть →</a>`, ADDONS.filter((a) => a.where === w).map((a) => kdRow(a)))).join("")}
${group("Сверх сайта", `<a href="${href("plan")}#konstruktor">что это →</a>`, BLOCKS.map((b) => kdRow({ ...b, ru: { t: b.ru.t } }, !!b.star)))}
</div>
<footer class="kd-f">
<div class="kd-line"><span>Сайт</span><span class="num">${usd(KIT_BASE.price)}</span></div>
<div class="kd-line"><span>Допы · <span id="kd-n"></span></span><span class="num" id="kd-add"></span></div>
<div class="kd-line kd-tot"><span>Итого разово</span><b class="num" id="kd-sum"></b></div>
<a class="btn btn-main" href="https://t.me/Devuz_studio_bot?start=pkvesta">${ICON.tg}Обсудить с DevUz Studio</a>
<div class="kd-btns"><button class="copy" type="button" id="kd-copy">Скопировать состав</button><button class="copy" type="button" id="kd-reset">Сбросить</button></div>
</footer>
</aside>`;
}

/* ── Заставка: промо DevUz Studio → логотип ПК Веста → влёт в ворота ── */
function introHtml() {
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  return `<div class="intro" id="intro" role="presentation">
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZMARK}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">прототип для ПК Веста</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<div class="vx-bg" aria-hidden="true"></div>
<div class="vx" aria-hidden="true"><span class="vx-w l">PK</span><div class="vx-house"><div class="vx-hole"></div>${houseIntro}<div class="vx-gate"></div></div><span class="vx-w r">Vesta</span></div>
<div class="vx-cap"><b>ПК Веста</b><span>стальные здания под ключ · с 1991 года</span></div>
<button type="button" class="in-skip" id="in-skip">Пропустить</button>
</div>`;
}

/* ── Каркас ───────────────────────────────────────────────────────────── */
function shell(path, meta, body) {
  const nav = ["katalog", "obekt", "raschet", "zavod", "plan"];
  const isHome = path === "";
  const dockText = "Здравствуйте! Хочу рассчитать здание. Размеры: ширина ... м, длина ... м, высота ... м. Город: ...";
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0b1630">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
${isHome ? `<link rel="preload" as="image" href="${IMG}/hero-m.webp" media="(max-width: 767px)"><link rel="preload" as="image" href="${IMG}/hero.webp" media="(min-width: 768px)">` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=${isHome ? "false" : "true"};try{if(sessionStorage.getItem('pv-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}try{var k=JSON.parse(localStorage.getItem('pv-kit-v1')||'{}');if(k.intro===false)off=true;if(k.motion===false)r.classList.add('k-no-motion');if(k.track===false)r.classList.add('k-no-track');if(k.assembly===false)r.classList.add('k-no-assembly');if(k.sizes===false)r.classList.add('k-no-sizes')}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "ПК Веста", alternateName: "PK VESTA", url: F.site, foundingDate: "1991", telephone: F.tel, email: F.email, address: { "@type": "PostalAddress", streetAddress: "ул. Тимирязева, 15Б, 4 этаж", addressLocality: "Алматы", postalCode: "050040", addressCountry: "KZ" }, sameAs: [F.yt] })}</script>
</head>
<body class="${isHome ? "home" : ""}" data-page="${path}">
${isHome ? introHtml() : ""}
<a class="skip" href="#main">К содержанию</a>
<header class="top"><div class="wrap">
<a class="logo" href="${href()}" aria-label="ПК Веста, на главную">${logoMark()}PK Vesta<small>стальные здания</small></a>
<nav class="nav" aria-label="Разделы">${nav.map((p) => `<a href="${href(p)}"${p === path ? ' aria-current="page"' : ""}>${PAGE_NAMES[p]}</a>`).join("")}</nav>
<div class="top-r"><a class="top-tel" href="tel:${F.tel}">${F.phone}</a>
<a class="btn btn-lime btn-sm top-cta" href="${href("raschet")}">${ICON.calc}Рассчитать здание</a></div>
</div></header>
<main id="main">
${body}
</main>
<footer><div class="wrap">
<div class="cols">
<div><b>ПК Веста · с 1991 года</b><ul><li>Центральный офис Казахстан: ${F.address}</li><li>Режим работы: ${F.hours}</li><li>БИН ${F.bin}</li><li>Завод: Тула, Россия</li></ul></div>
<div><b>На связи</b><ul><li><a href="tel:${F.tel}">${F.phone}</a> · быстровозводимые здания, сэндвич-панели</li><li><a href="${waLink("Здравствуйте! Вопрос по зданию.")}">WhatsApp ${F.waShow}</a></li><li><a href="mailto:${F.email}">${F.email}</a></li><li><a href="${F.tg}">Telegram-канал</a> · <a href="${F.yt}">YouTube</a></li><li><a href="${F.websteel}">Система WebSteel®</a></li></ul></div>
<div><b>Разделы</b><ul>${["", ...nav].map((p) => `<li><a href="${href(p)}">${PAGE_NAMES[p]}</a></li>`).join("")}</ul></div>
</div>
<div class="rights"><span>Это прототип: так может выглядеть новый сайт ПК Веста. Факты о заводе, объекты, размеры и визуализации WebSteel® взяты с pkvesta.kz (08.10.2026). Блоки с пометкой «Предложение DevUz Studio» придумали мы, на сайте их пока нет. Откуда снимки: <a href="${href("plan")}#foto">${PAGE_NAMES.plan}</a>.</span><span>Прототип принадлежит DevUz Studio. Использовать его можно только по договору: <a href="${TERMS}">условия использования</a></span></div>
</div></footer>
${path === "raschet" ? "" : `<div class="dock" id="dock"><a class="btn btn-wa" href="${waLink(dockText)}">${ICON.wa}Рассчитать в WhatsApp</a></div>`}
${dockHtml(path)}
<script type="application/json" id="i18n">${JSON.stringify(L()).replace(/</g, "\\u003c")}</script>
${isHome ? `<script>\n${INTRO}</script>\n<script>\n${ASM}</script>` : ""}
<script>
${JS_MAIN}</script>
</body>
</html>`;
}

/* Строки для скрипта страницы. */
function L() {
  return {
    base: href(),
    name: "ПК Веста",
    wa: F.wa,
    kitBase: KIT_BASE.price,
    kitN: "{n} шт.",
    kitTg: "Состав нового сайта ПК Веста из конструктора:",
    kitBaseName: KIT_BASE.ru.t,
    kitTotal: "Итого",
    copied: "Скопировано",
    found: "Типов зданий: {n}",
    cfgHead: "Здравствуйте! Хочу рассчитать здание с сайта ПК Веста.",
    msgHead: "Здравствуйте! Заявка на расчёт здания с сайта ПК Веста.",
    fInd: "Назначение",
    fSize: "Размеры, Ш × Д × В",
    fRoof: "Кровля",
    fHeat: "Утепление",
    fCity: "Город строительства",
    fWish: "Пожелания",
    fName: "Имя",
    fPhone: "Телефон",
    empty: "не указано",
    need: "Выберите назначение, ширину и высоту и укажите длину: без размеров заводу нечего считать.",
    sent: "Открываем WhatsApp завода с готовым сообщением. Осталось нажать «Отправить».",
  };
}

/* ── Куски страниц ────────────────────────────────────────────────────── */
const head = (kicker, h, lead, side = "", anim = "rise") => `<div class="sec-head rv a-${anim}"><div>${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h2 style="margin-top:12px">${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>${side}</div>`;
const oById = (id) => OBJ.find((o) => o.id === id);

function heroBlock() {
  const tw = (w, i) => `<span class="tw" style="--i:${i}">${w}</span>`;
  const rot = ["ангар", "склад", "цех", "коровник", "автосервис", "спортзал"];
  const fc = (o, cls, k) => `<a class="fc ${cls}" href="${href("obekt")}?id=${o.id}" data-depth="${k}" aria-label="${esc(objName(o))}"><img src="${IMG}/o${o.id}-1.webp" alt="" width="1280" height="720" loading="eager"><div><b>${o.w} × ${o.l} × ${dec(o.h)} м</b><small>${o.kind} · ${o.city}</small></div></a>`;
  const seg = (id, vals, on) => `<div class="seg" id="${id}" role="group">${vals.map((v) => `<button type="button" data-v="${v}" aria-pressed="${v === on}">${v}</button>`).join("")}</div>`;
  return `<section class="hero" id="hero" data-scene="hero" aria-label="ПК Веста">
<div class="hero-ph" data-l="ph" aria-hidden="true"></div><div class="hero-sh" aria-hidden="true"></div><canvas class="flick" aria-hidden="true"></canvas>
<div class="hero-in"><div class="wrap"><div class="hero-grid">
<div>
<span class="kicker hi" style="color:var(--on2)"><i></i>ПК Веста · завод стальных зданий · с 1991 года</span>
<h1 style="margin-top:16px">${tw("Стальной", 0)} <span class="rot" aria-hidden="true">${rot.map((w, k) => `<span${k === 0 ? ' class="on"' : ""}>${[...w].map((ch, c) => `<i style="--c:${c}">${ch}</i>`).join("")}</span>`).join("")}</span><span class="vh">ангар, склад, цех, коровник</span> ${["под", "ключ", "напрямую", "с", "завода"].map((w, i) => tw(w, i + 2)).join(" ")}</h1>
<p class="lead hi" style="--d:160ms">Проектируем, изготавливаем и монтируем быстровозводимые здания из металлоконструкций. Каркас собирается на 100% болтовом соединении: при монтаже сварки нет.</p>

<div class="cta hero-go hi" style="--d:240ms" data-addon-off="sizes"><a class="btn btn-wa" href="${waLink("Здравствуйте! Хочу рассчитать здание.")}">${ICON.wa}Получить расчёт в WhatsApp</a><a class="btn btn-ghost" href="${F.websteel}">${ICON.calc}Посчитать в WebSteel</a></div>
<div class="trust hi" style="--d:320ms"><span>${ICON.shield}35 лет на строительном рынке</span><span>${ICON.check}1500 проектов</span><span>${ICON.calc}WebSteel® 24/7</span></div>
</div>
<div><form class="cfg hi" id="cfg" style="--d:240ms" data-addon="sizes" onsubmit="return false">
<span class="shine" aria-hidden="true"></span><div class="cfg-h"><b>Рассчитайте здание</b><span>шаг колонн 6 м</span></div>
<label class="cfg-row"><span>Назначение</span><select aria-label="Назначение">${["Склад", "Ангар", "Цех", "Коровник", "Овощехранилище", "Автосервис", "Спортивный зал", "Магазин", "Другое"].map((x) => `<option>${x}</option>`).join("")}</select></label>
<div class="cfg-row"><span>Ширина, м</span>${seg("cfg-w", ["12", "15", "18", "24", "30", "36", "42"], "18")}</div>
<div class="cfg-row"><span>Длина</span><div class="len"><input type="range" id="cfg-lr" min="12" max="120" step="6" value="36" aria-label="Длина, м"><output id="cfg-l" class="num">36 м</output></div></div>
<div class="cfg-row"><span>Высота, м</span>${seg("cfg-h", ["4", "6", "8", "10"], "6")}</div>
<div class="cfg-sum"><span>Здание <b id="cfg-dims" class="num" style="font:inherit">18 × 36 × 6 м</b></span><b id="cfg-a" class="num">648 м²</b></div>
<a class="btn btn-wa" id="cfg-go" href="${waLink("Здравствуйте! Хочу рассчитать здание: 18 × 36 × 6 м.")}">${ICON.wa}Получить расчёт в WhatsApp</a>
<a class="cfg-alt" id="cfg-more" href="${href("raschet")}">Подробнее: кровля, утепление, город →</a>
</form></div>
</div></div></div>
</section>`;
}

function statsBlock() {
  return `<section style="padding-bottom:0"><div class="wrap"><div class="stats-w rv a-rise"><span class="trail" aria-hidden="true"></span><div class="stats">
<div><b class="num" data-count="35">35</b><span>лет на строительном рынке, с 1991 года</span></div>
<div><b class="num" data-count="1500" data-from="200">1 500</b><span>реализованных проектов зданий в разных странах</span></div>
<div><b class="num" data-count="100" data-suf=" тыс.">100 тыс.</b><span>онлайн-расчётов зданий в год в WebSteel®</span></div>
<div><b class="num" data-count="50">50</b><span>регионов оцифрованы: Евразия, Африка, Ближний Восток</span></div>
</div></div></div></section>`;
}

function asmBlock() {
  const steps = [
    ["Фундамент и колонны", "Колонны встают на фундамент одна за другой. Комплект приходит с завода готовым, детали подписаны."],
    ["Фермы на болтах", "Половины ферм сходятся у конька и крепятся на болтах. Во время монтажа каркаса сварки нет."],
    ["Прогоны и связи", "Прогоны, ригели стен, фахверк торцов и связи жёсткости: каркас считается под снег, ветер и сейсмику."],
    ["Профлист стен и кровли", "Стены и кровля закрываются оцинкованным профлистом или сэндвич-панелями. Их завод делает сам."],
  ];
  const cut = (s) => s.split(" ").map((w, i) => `<span class="cw"><span style="--w:${i}">${w}</span></span>`).join(" ");
  return `<section class="asm" id="asm" data-addon="assembly" aria-label="Как собирается здание"><div class="asm-pin">
<div class="asm-head"><span class="kicker" style="color:var(--on2)"><i></i>Комплект заводского изготовления · 100% болтовое соединение</span><h2 style="margin-top:12px">Здание собирается из деталей, пока вы листаете</h2></div>
<div class="asm-frame"><canvas class="asm-cv" role="img" aria-label="Схема сборки стального здания 24 на 48 на 6 метров: фундамент, колонны, фермы, прогоны, связи, профлист стен и кровли"></canvas></div>
<div class="asm-foot"><ol class="asm-steps">${steps.map(([h, p], k) => `<li${k === 0 ? ' class="on"' : ""} style="--s:${k}"><b><i>0${k + 1}</i>${cut(h)}</b><p>${p}</p></li>`).join("")}</ol><span class="asm-now">${steps[0][1]}</span><p class="asm-cap">Пример: склад 24 × 48 × 6 м, шаг колонн 6 м, как в вашей таблице цен. Нарисовано кодом, без фото.</p></div>
<div class="asm-bar" aria-hidden="true"><i></i></div>
</div></section>`;
}

/* ── Мини-здания отраслей: изометрия кодом, та же проекция, что в сцене
   сборки. Грани по ролям (стены, кровля, акценты), чтобы карточка могла
   «собрать» здание при появлении и приподнять кровлю под курсором. ── */
const ISO_C = Math.cos(Math.PI / 6);
const isoP = (x, y, z) => [(x - z) * ISO_C, (x + z) * 0.5 - y];
const r1 = (n) => Math.round(n * 10) / 10;
function isoScene(draw) {
  const out = [], seen = [];
  const pt = (p) => { const q = isoP(...p); seen.push(q); return `${r1(q[0])},${r1(q[1])}`; };
  const S = {
    poly(cls, ps) { out.push(`<polygon class="${cls}" points="${ps.map(pt).join(" ")}"/>`); },
    path(cls, d) { out.push(`<path class="${cls}" d="${d}"/>`); },
    lines(cls, segs) { if (segs.length) out.push(`<path class="${cls}" d="${segs.map(([a, b]) => `M${pt(a)}L${pt(b)}`).join("")}"/>`); },
    /* Рёбра профлиста: n линий между нижним (a→b) и верхним (d→c) краем грани. */
    ribs(cls, a, b, c, d, n) {
      const mix = (u, v, t) => u.map((x, i) => x + (v[i] - x) * t);
      const segs = [];
      for (let i = 1; i < n; i++) segs.push([mix(a, b, i / n), mix(d, c, i / n)]);
      S.lines(cls, segs);
    },
    box(x, z, w, l, h, y0 = 0, o = {}) {
      const [x1, z1, y1] = [x + w, z + l, y0 + h];
      S.poly(`wl ${o.zf || "fz"}`, [[x, y0, z1], [x1, y0, z1], [x1, y1, z1], [x, y1, z1]]);
      S.poly(`wl ${o.xf || "fx"}`, [[x1, y0, z], [x1, y0, z1], [x1, y1, z1], [x1, y1, z]]);
      if (o.rib) { S.ribs("wl rb", [x, y0, z1], [x1, y0, z1], [x1, y1, z1], [x, y1, z1], Math.round(w * 1.5)); S.ribs("wl rb", [x1, y0, z], [x1, y0, z1], [x1, y1, z1], [x1, y1, z], Math.round(l * 1.5)); }
      S.poly(`${o.top || "rf rt"}`, [[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]]);
    },
    /* Двускатное здание, конёк вдоль z. */
    gable(x, z, w, l, h, rise) {
      const [x1, z1, xm] = [x + w, z + l, x + w / 2];
      S.poly("rf r0", [[x, h, z], [xm, h + rise, z], [xm, h + rise, z1], [x, h, z1]]);
      S.poly("wl fx", [[x1, 0, z], [x1, 0, z1], [x1, h, z1], [x1, h, z]]);
      S.ribs("wl rb", [x1, 0, z], [x1, 0, z1], [x1, h, z1], [x1, h, z], Math.round(l * 1.5));
      S.poly("wl fz", [[x, 0, z1], [x1, 0, z1], [x1, h, z1], [xm, h + rise, z1], [x, h, z1]]);
      S.poly("rf r1", [[xm, h + rise, z], [x1, h, z], [x1, h, z1], [xm, h + rise, z1]]);
      const segs = [];
      for (let i = 1; i < Math.round(l * 1.2); i++) { const zz = z + (l * i) / Math.round(l * 1.2); segs.push([[xm, h + rise, zz], [x1, h, zz]]); }
      S.lines("rf rr", segs);
      S.lines("rf tr", [[[xm, h + rise, z], [xm, h + rise, z1]], [[x, h, z1], [xm, h + rise, z1]], [[xm, h + rise, z1], [x1, h, z1]]]);
    },
    /* Арочный зал: стенка h, свод высотой rise, вдоль z. */
    arch(x, z, w, l, h, rise) {
      const z1 = z + l, N = 14, A = [];
      for (let i = 0; i <= N; i++) { const t = (Math.PI * i) / N; A.push([x + w / 2 - (w / 2) * Math.cos(t), h + rise * Math.sin(t)]); }
      S.poly("wl fx", [[x + w, 0, z], [x + w, 0, z1], [x + w, h, z1], [x + w, h, z]]);
      for (let i = 0; i < N; i++) {
        const [xa, ya] = A[i], [xb, yb] = A[i + 1], vis = -(yb - ya) + (xb - xa);
        if (vis <= 0) continue;
        const k = Math.min(3, Math.max(0, Math.round(((xb - xa) / Math.hypot(xb - xa, yb - ya)) * 3)));
        S.poly(`rf a${k}`, [[xa, ya, z], [xb, yb, z], [xb, yb, z1], [xa, ya, z1]]);
      }
      S.poly("wl fz", [[x, 0, z1], [x + w, 0, z1], ...A.slice().reverse().map(([ax, ay]) => [ax, ay, z1])]);
      S.lines("rf tr", A.slice(0, -1).map(([ax, ay], i) => [[ax, ay, z1], [A[i + 1][0], A[i + 1][1], z1]]));
    },
    /* Силос или труба: цилиндр, по желанию с конусом. */
    cyl(x, z, r, h, cone = 0, y0 = 0) {
      const [cx, cy0] = isoP(x, y0, z), [, cy1] = isoP(x, y0 + h, z), rx = r * Math.SQRT2 * ISO_C, ry = (r * Math.SQRT2) / 2;
      seen.push([cx - rx, cy1 - ry - cone], [cx + rx, cy0 + ry]);
      const L = r1(cx - rx), R = r1(cx + rx);
      out.push(`<path class="wl cy" d="M${L},${r1(cy1)}L${L},${r1(cy0)}A${r1(rx)} ${r1(ry)} 0 0 0 ${R},${r1(cy0)}L${R},${r1(cy1)}Z"/>`);
      const rings = [];
      for (let i = 1; i < 4; i++) { const yy = r1(cy0 + ((cy1 - cy0) * i) / 4); rings.push(`M${L},${yy}A${r1(rx)} ${r1(ry)} 0 0 0 ${R},${yy}`); }
      out.push(`<path class="wl rb" d="${rings.join("")}"/>`);
      if (cone) out.push(`<path class="rf r1" d="M${L},${r1(cy1)}L${r1(cx)},${r1(cy1 - cone)}L${R},${r1(cy1)}A${r1(rx)} ${r1(ry)} 0 0 1 ${L},${r1(cy1)}Z"/>`);
      else out.push(`<ellipse class="rf rt" cx="${r1(cx)}" cy="${r1(cy1)}" rx="${r1(rx)}" ry="${r1(ry)}"/>`);
    },
  };
  draw(S);
  const xs = seen.map((p) => p[0]), ys = seen.map((p) => p[1]);
  const [mnx, mxx, mny, mxy] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  /* Плита с сеткой под зданием: ширина по рисунку, шаг 2 м. */
  const pad = 3, gx = [mnx - pad, mxx + pad], gy = [mny - pad, mxy + pad];
  return { body: out.join(""), vb: `${r1(gx[0])} ${r1(gy[0])} ${r1(gx[1] - gx[0])} ${r1(gy[1] - gy[0])}` };
}
function isoGround(x0, z0, x1, z1) {
  const segs = [];
  for (let x = x0; x <= x1; x += 2) segs.push([[x, 0, z0], [x, 0, z1]]);
  for (let z = z0; z <= z1; z += 2) segs.push([[x0, 0, z], [x1, 0, z]]);
  return segs;
}
const ISO_SCENES = {
  agro: (S) => { S.lines("gd", isoGround(-3, -3, 16, 19)); S.poly("sh", [[0, 0, 0], [11, 0, 0], [11, 0, 16], [0, 0, 16]]); S.gable(0, 0, 8, 14, 3.2, 2.2); S.poly("ac", [[2.8, 0, 14], [5.2, 0, 14], [5.2, 2.4, 14], [2.8, 2.4, 14]]); S.cyl(12, 3, 1.7, 6.5, 1.6); },
  comm: (S) => { S.lines("gd", isoGround(-3, -3, 15, 17)); S.poly("sh", [[0, 0, 0], [12, 0, 0], [12, 0, 14], [0, 0, 14]]); S.box(0, 0, 10, 12, 4.6, 0, { top: "rf rt" }); S.poly("wl gl", [[1, 1.3, 12], [9, 1.3, 12], [9, 3.6, 12], [1, 3.6, 12]]); S.poly("wl gl", [[10, 1.3, 1], [10, 1.3, 11], [10, 3.6, 11], [10, 3.6, 1]]); S.box(2, 3, 2.4, 2.4, 1, 4.6, { top: "rf rt", zf: "rf u1", xf: "rf u2" }); S.box(3.2, 12, 3.8, 1.6, 0.35, 3.1, { top: "ac", zf: "ac", xf: "ac" }); },
  prom: (S) => { S.lines("gd", isoGround(-3, -3, 18, 21)); S.poly("sh", [[0, 0, 0], [15, 0, 0], [15, 0, 18], [0, 0, 18]]); S.gable(0, 0, 10, 16, 5, 1.8); S.poly("ac", [[2.5, 0, 16], [7.5, 0, 16], [7.5, 4, 16], [2.5, 4, 16]]); S.lines("gt", [0.8, 1.6, 2.4, 3.2].map((y) => [[2.5, y, 16], [7.5, y, 16]])); S.cyl(13.5, 2.5, 0.7, 10); S.box(10, 9, 4.5, 7, 3, 0, { rib: true }); },
  sport: (S) => { S.lines("gd", isoGround(-3, -3, 16, 22)); S.poly("sh", [[0, 0, 0], [13, 0, 0], [13, 0, 19], [0, 0, 19]]); S.arch(0, 0, 12, 18, 1.4, 5); S.poly("ac", [[4.5, 0, 18], [7.5, 0, 18], [7.5, 2.6, 18], [4.5, 2.6, 18]]); },
  tech: (S) => { S.lines("gd", isoGround(-3, -3, 17, 17)); S.poly("sh", [[0, 0, 0], [14, 0, 0], [14, 0, 15], [0, 0, 15]]); S.gable(0, 0, 12, 13, 5, 1.8); S.poly("ac", [[1.8, 0, 13], [10.2, 0, 13], [10.2, 4.3, 13], [1.8, 4.3, 13]]); S.lines("gt", [0.9, 1.8, 2.7, 3.6].map((y) => [[1.8, y, 13], [10.2, y, 13]])); S.box(12, 8, 2.6, 3, 2.6, 0, {}); },
  gen: (S) => { S.lines("gd", isoGround(-3, -3, 14, 13)); S.poly("sh", [[0, 0, 0], [11, 0, 0], [11, 0, 10], [0, 0, 10]]); S.gable(0, 0, 6, 8, 3, 2.4); S.poly("wl gl", [[0.8, 1.1, 8], [2.4, 1.1, 8], [2.4, 2.3, 8], [0.8, 2.3, 8]]); S.poly("ac", [[3.4, 0, 8], [5, 0, 8], [5, 2.3, 8], [3.4, 2.3, 8]]); S.box(6.6, 3, 4, 5, 2.6, 0, { rib: true }); S.poly("ac", [[7.2, 0, 8], [10, 0, 8], [10, 2.1, 8], [7.2, 2.1, 8]]); },
};
const isoSvg = (k) => { const s = isoScene(ISO_SCENES[k]); return `<svg class="iso" viewBox="${s.vb}" aria-hidden="true" focusable="false">${s.body}</svg>`; };

function indBlock() {
  return `<section><div class="wrap">
${head("Каталог быстровозводимых зданий", `${TYPES_N} типов зданий в шести отраслях`, "Каталог с вашего сайта, только крупно и в одно касание. В каждой отрасли пример вашего объекта с размерами.", `<a class="btn btn-ghost btn-sm" href="${href("katalog")}">Весь каталог ${ICON.arrow}</a>`)}
<svg class="iso-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs><linearGradient id="cyl" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="hsl(218 32% 90%)"/><stop offset=".5" stop-color="hsl(220 26% 78%)"/><stop offset="1" stop-color="hsl(222 30% 58%)"/></linearGradient></defs></svg>
<div class="inds">${IND.map((x, k) => {
    const o = x.ex ? oById(x.ex) : null;
    return `<a class="ind rv a-blurin" style="--d:${(k % 3) * 110}ms" href="${href("katalog")}?ind=${x.k}"><span class="spot" aria-hidden="true"></span><span class="n num">${x.items.length}</span>${isoSvg(x.k)}<h3>${x.n}</h3><p>${o ? `${objName(o)}, ${o.city}` : x.note || x.items.slice(0, 4).join(", ")}</p><span class="go">Типы зданий ${ICON.arrow}</span></a>`;
  }).join("")}</div>
</div></section>`;
}

function ocard(o, k = 0) {
  return `<a class="oc" data-id="${o.id}" href="${href("obekt")}?id=${o.id}"><span class="oc-im"><img src="${IMG}/o${o.id}-1.webp" alt="${esc(`${objName(o)}, ${o.city}`)}" width="1280" height="720" loading="lazy"><i class="oc-tone" aria-hidden="true"></i></span><div class="bd"><span class="dims num">${dims(o)}<small>м</small></span><h3>${o.kind}${o.frame ? ` из ${o.frame}` : ""}</h3><p>${ICON.pin}${o.city}, ${o.country}</p></div></a>`;
}

function trackBlock() {
  return `<section class="trk" id="trk"><div class="trk-pin">
<div class="wrap">${head("Наши объекты", "Размеры, город, визуализация", "Пять объектов с вашего сайта. Листайте вниз, и лента поедет вбок. На сайте здесь будут все 224.", "", "rise")}</div>
<div class="trk-row">${OBJ.map((o, k) => ocard(o, k)).join("")}<a class="oc more" href="${F.site}/objects/"><b>Ещё 219 объектов</b><span>на pkvesta.kz: склады, цеха, фермы, автосервисы, спортзалы</span></a></div>
</div></section>`;
}

function geoBlock() {
  let k = 0;
  return `<section><div class="wrap">
${head("Где уже стоят здания ПК Веста", "Казахстан и Ташкент", "Объекты из вашего списка на pkvesta.kz. Города стоят по своим координатам, контуры границ не рисуем: это схема, а не карта.")}
<div class="geo">
<div class="geo-map rv" aria-hidden="true">${GEO.map((g) => { const kk = k++; return `<i class="${g.uz ? "uz" : ""}" data-k="${kk}" style="left:${g.x}%;top:${g.y}%;--k:${kk}"></i><span class="${g.lf ? "lf" : ""}" data-k="${kk}" style="left:${g.x}%;top:${g.y}%;--k:${kk}">${g.c}</span>`; }).join("")}<em>Жёлтые точки: Казахстан · белая: Узбекистан</em></div>
<ul class="geo-list">${GEO.map((g, k) => `<li class="rv a-slide" data-k="${k}"><b>${g.c}</b>${g.items.map((x) => `<span>${x}</span>`).join("")}</li>`).join("")}</ul>
</div>
</div></section>`;
}

/* Текст перебирает символы и встаёт на место: читалка экрана видит только итог. */
const hyper = (t) => `<span class="vh">${t}</span><span data-hyper="${t}" aria-hidden="true">${t}</span>`;

function featsBlock() {
  const f = [
    ["bolt", "100%", "100% болтовое соединение", "Каркас приходит готовым комплектом заводского изготовления и собирается на болтах, как конструктор.", "Во время монтажа каркаса сварка вообще отсутствует"],
    ["shield", "СНиП", "По СНиП, без занижения", "Здание считается под снеговые, ветровые и сейсмические нагрузки на вашей площадке.", "без занижения коэффициентов надёжности"],
    ["span", "30 м", "Пролёт до 30 метров", "Тонкостенные конструкции из оцинкованного профиля до 3 мм: однопролётные здания с пролётом до 30 м.", "однопролётные здания с пролётом до 30 м"],
    ["truck", "Авто · ЖД · Авиа", "Комплект в любую точку", "Готовый комплект здания уходит с завода наземным транспортом, по железной дороге или авиа.", "в любую точку мира"],
  ];
  return `<section style="padding-top:0"><div class="wrap">
${head("Каркас как конструктор", "Почему собирается быстро", "Всё ниже вы говорите о себе на pkvesta.kz. Мы только собрали это в одном месте.")}
<div class="feats">${f.map(([i, t, h, p, q], k) => `<div class="ft rv a-${["bolt", "lift", "beam", "slide"][k]}" style="--d:${k * 80}ms"><span class="beam" aria-hidden="true"></span><div class="ft-top"><span class="ic">${ICON[i]}</span><b class="tk${t.length > 6 ? " sm" : ""}">${hyper(t)}</b></div><h3>${h}</h3><p>${p}</p><q>${q}</q></div>`).join("")}</div>
</div></section>`;
}

function wsBlock() {
  const steps = ["Регион строительства", "Размеры здания", "Тип конструкции", "Варианты обшивки", "Проёмы: ворота, окна, двери", "Цвет стен, крыши и доборов", "Дополнительные услуги"];
  return `<section class="dark" id="websteel"><div class="wrap">
${head("Онлайн-калькулятор завода", "WebSteel®: посчитайте здание сами", "Ваш калькулятор работает круглосуточно и считает здание по технологическим возможностям завода. Из семи сайтов конкурентов в Казахстане, которые мы смотрели, настоящего расчёта нет ни у одного: у всех заявка менеджеру.")}
<div class="ws">
<ol>${steps.map((s, k) => `<li class="rv a-left" style="--d:${k * 60}ms">${s}</li>`).join("")}</ol>
<div class="ws-hub rv a-pop" style="--d:240ms"><span class="ws-core"><b>${hyper("WebSteel®")}</b><small>считает 24/7</small></span></div>
<div class="ws-res rv a-panel"><h3>Что приходит на почту</h3><ul><li>${ICON.check}Стоимость, которая меняется вместе с параметрами</li><li>${ICON.check}Бесплатные эскизы с учётом климатических зон: снег, ветер, сейсмика</li><li>${ICON.check}Техническое задание и готовые расчёты</li><li>${ICON.check}Официальное коммерческое предложение</li></ul>
<div class="cta"><a class="btn btn-lime" href="${F.websteel}">${ICON.calc}Открыть WebSteel</a><a class="btn btn-ghost" href="${waLink("Здравствуйте! Хочу рассчитать здание, помогите с WebSteel.")}">${ICON.wa}Спросить в WhatsApp</a></div></div>
<svg class="ws-beams" aria-hidden="true" focusable="false"></svg>
</div>
</div></section>`;
}

const OFFERS = [
  ["chart", "Цена «от» у типовых зданий", "Ваша таблица цен (ширина 12-42 м, высота 4-10 м, длина с шагом колонн 6 м) прямо в каталоге, в тенге для Казахстана.", "Растёт из вашей страницы «Цены»"],
  ["wa", "WhatsApp алматинского отдела", "Сейчас кнопка WhatsApp ведёт на российский номер +7 910, а телефон на сайте алматинский. Заявки из Казахстана лучше вести на местный номер.", "Номер подставим ваш"],
  ["filter", "Объекты с фильтром по отрасли и размеру", "224 объекта по отрасли, стране и ширине: «склады от 18 м в Казахстане» в два касания.", "У конкурентов, которых мы смотрели, такого фильтра нет"],
  ["check", "«Хочу такое же» на каждом объекте", "Кнопка с размерами объекта уходит в WhatsApp: менеджер сразу видит, с чем сравнивать.", "Уже работает в прототипе"],
  ["video", "Видео рядом с отраслью", "У вас десятки роликов на YouTube. Каждый встанет рядом со своей отраслью и объектом и грузится только по нажатию.", "Растёт из вашего канала"],
  ["search", "Страницы под поиск", "«Ангар 24 на 60 Алматы», «зернохранилище Кокшетау»: своя страница с похожими объектами и расчётом.", "Человек попадает к вам, а не к соседу по выдаче"],
];
function offerBlock(title = true) {
  return `<section class="dark" id="predlozhenie"><div class="wrap">
${title ? head('<span class="ours">Предложение DevUz Studio</span>', "Что добавить сайту завода", "Этого на pkvesta.kz пока нет. Каждое растёт из того, что у вас уже есть.") : ""}
<div class="offer">${OFFERS.map(([i, h, p, s], k) => `<div class="of rv a-${["rise", "bolt", "panel"][k % 3]}" style="--d:${(k % 3) * 90}ms"><span class="spot" aria-hidden="true"></span><span class="beam" aria-hidden="true"></span><span class="ic">${ICON[i]}</span><h3>${h}</h3><p>${p}</p><small>${s}</small></div>`).join("")}</div>
</div></section>`;
}

/* Тоннель из сетки с бегущими лучами — по мотивам «Warp Background» (@dillionverma, 21st.dev, MIT).
   Лучи расставлены заранее, без случайных чисел: у каждого своё место, длина и задержка. */
const WARP = { t: [[18, 4, 0], [52, 7, 1.2], [80, 3, 2.3]], b: [[30, 6, 0.6], [64, 3, 1.8], [88, 8, 2.9]], l: [[25, 5, 1.4], [70, 3, 0.2]], r: [[35, 4, 2.1], [75, 7, 0.9]] };
const warp = () => `<div class="warp" aria-hidden="true">${Object.entries(WARP).map(([side, bs]) => `<div class="wp ${side}">${bs.map(([x, ar, dl], k) => `<i class="${k % 2 ? "c2" : ""}" style="--x:${x}%;--ar:${ar};--dl:${dl}s"></i>`).join("")}</div>`).join("")}</div>`;
const finalBlock = () => `<section class="final"><div class="wrap"><div class="box rv a-pop">${warp()}
<h2>${["Посчитаем", "ваше", "здание"].map((w, i) => `<span class="tw" style="--i:${i}">${w}</span>`).join(" ")}</h2>
<p class="sub" style="margin-top:12px">Пришлите размеры в WhatsApp или посчитайте сами в WebSteel. Срок проектирования и изготовления типового здания: 2,5 месяца.</p>
<div class="cta"><a class="btn btn-lime" href="${href("raschet")}">${ICON.calc}Рассчитать здание</a><a class="btn btn-ghost" href="tel:${F.tel}">${ICON.phone}${F.phone}</a></div>
</div></div></section>`;

/* ── Страницы ─────────────────────────────────────────────────────────── */
function home() {
  const body = `${heroBlock()}
${statsBlock()}
${asmBlock()}
${indBlock()}
${trackBlock()}
${featsBlock()}
${wsBlock()}
${geoBlock()}
${offerBlock()}
${finalBlock()}`;
  return shell("", {
    title: "ПК Веста · быстровозводимые здания из металлоконструкций под ключ в Казахстане",
    desc: "Ангары, склады, цеха, фермы и спортзалы из ЛСТК и ЛМК напрямую с завода. 100% болтовое соединение, онлайн-расчёт WebSteel 24/7, 1500 проектов, с 1991 года.",
  }, body);
}

function phead(crumb, kicker, h1, lead) {
  return `<section class="phead"><div class="wrap">
<ol class="crumbs"><li><a href="${href()}">ПК Веста</a></li><li aria-current="page">${crumb}</li></ol>
${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h1 style="margin-top:12px">${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}
</div></section>`;
}

function katalog() {
  const body = `${phead(PAGE_NAMES.katalog, "Каталог быстровозводимых зданий", "Здания по отраслям", `${TYPES_N} типов зданий из вашего каталога. Нажмите на тип, и он подставится в расчёт.`)}
<section style="padding-top:0"><div class="wrap">
<div class="filters" id="filters" role="toolbar" aria-label="Отрасли"><button type="button" class="chip" data-ind="" aria-pressed="true">Все <b>${TYPES_N}</b></button>${IND.map((x) => `<button type="button" class="chip" data-ind="${x.k}" aria-pressed="false">${ic(x.ic)}${x.n} <b>${x.items.length}</b></button>`).join("")}</div>
<p class="cat-n" id="cat-n" aria-live="polite"></p>
<div id="cat">${IND.map((x, k) => {
    const o = x.ex ? oById(x.ex) : null;
    return `<div class="cat-sec" data-ind="${x.k}" data-n="${x.items.length}" id="${x.k}"><div class="cat-top"><div><h2>${ICON[x.ic]}${x.n}</h2><p class="sub">${x.lead}</p></div>${o ? `<a class="cat-ex" href="${href("obekt")}?id=${o.id}"><img src="${IMG}/o${o.id}-1.webp" alt="" width="1280" height="720" loading="lazy"><div><b class="num">${o.w} × ${o.l} × ${dec(o.h)} м</b><span>${o.kind}, ${o.city}. Ваш объект №${o.id}</span></div></a>` : x.note ? `<p class="src">${x.note}: из вашего списка объектов</p>` : ""}</div>
<div class="types rv a-${["beam", "lift", "panel"][k % 3]}">${x.items.map((t) => `<a href="${href("raschet")}?t=${encodeURIComponent(t)}&i=${encodeURIComponent(x.n)}"><i aria-hidden="true"></i>${t}</a>`).join("")}</div></div>`;
  }).join("")}</div>
<p class="src" style="margin-top:24px">Список типов взят из меню «Каталог быстровозводимых зданий» на pkvesta.kz, 08.10.2026. Опечатки в названиях поправили: «Винная ферма», «Овцеферма», «Страусиная ферма».</p>
</div></section>
${finalBlock()}`;
  return shell("katalog", {
    title: "Каталог быстровозводимых зданий: фермы, склады, цеха, спортзалы | ПК Веста",
    desc: `${TYPES_N} типов зданий в шести отраслях: сельское хозяйство, коммерческие здания, промышленность, спорт, техника. Расчёт по размерам в WhatsApp.`,
  }, body);
}

function obekt() {
  const art = (o, k) => {
    const area = Math.round(o.w * o.l);
    const want = `Здравствуйте! Хочу здание как ваш объект №${o.id}: ${objName(o).toLowerCase()}${o.frame ? ` из ${o.frame}` : ""}, ${o.city}. Город строительства: ...`;
    return `<article class="obj-a" data-id="${o.id}"${k ? " hidden" : ""}>
<section class="phead"><div class="wrap"><ol class="crumbs"><li><a href="${href()}">ПК Веста</a></li><li><a href="${href("obekt")}">Объекты</a></li><li aria-current="page">№${o.id}</li></ol>
<span class="kicker"><i></i>${o.frame ? `Из ${o.frame} · ` : ""}${o.city}, ${o.country}</span><h1 style="margin-top:12px">${o.kind} ${o.w} × ${o.l} × ${dec(o.h)} м</h1></div></section>
<section style="padding-top:0"><div class="wrap"><div class="obj">
<div>
<div class="gal"><div class="gal-t">${Array.from({ length: 6 }, (_, n) => `<img src="${IMG}/o${o.id}-${n + 1}.webp" alt="${esc(`${objName(o)}, визуализация ${n + 1}`)}" width="1280" height="720" loading="lazy">`).join("")}</div><span class="gal-n num">1 / 6</span></div>
<div class="thumbs">${Array.from({ length: 6 }, (_, n) => `<button type="button" aria-current="${n === 0}" aria-label="Снимок ${n + 1}"><img src="${IMG}/o${o.id}-${n + 1}.webp" alt="" loading="lazy" width="1280" height="720"></button>`).join("")}</div>
<div class="params"><div><b class="num">${o.w} м</b><span>ширина</span></div><div><b class="num">${o.l} м</b><span>длина</span></div><div><b class="num">${dec(o.h)} м</b><span>высота</span></div><div><b class="num">${sp(area)} м²</b><span>площадь, Ш × Д</span></div><div><b>${o.frame || "по проекту"}</b><span>каркас</span></div><div><b>${o.city}</b><span>${o.country}</span></div></div>
<p class="src">Визуализации WebSteel® с вашей страницы объекта №${o.id} на pkvesta.kz. Площадь посчитали как ширина на длину.</p>
</div>
<aside class="side"><div class="panel"><span class="dims num">${dims(o)}<small>м</small></span><p class="sub" style="margin-top:8px">${o.kind}${o.frame ? ` из ${o.frame}` : ""}, ${o.city}</p>
<div class="spec"><div><span>Объект</span><b>№${o.id}</b></div><div><span>Площадь</span><b class="num">${sp(area)} м²</b></div><div><span>Соединение каркаса</span><b>болтовое</b></div></div>
<div class="cta"><a class="btn btn-wa" style="width:100%" href="${waLink(want)}">${ICON.wa}Хочу такое же</a><a class="btn btn-ghost" style="width:100%" href="${href("raschet")}?i=${encodeURIComponent(IND.find((x) => x.k === o.ind).n)}&w=${o.w}&l=${o.l}&h=${o.h}">${ICON.calc}Посчитать с моими размерами</a></div>
<p class="src">Кнопка открывает WhatsApp завода с номером и размерами этого объекта.</p></div></aside>
</div></div></section>
</article>`;
  };
  const body = `${OBJ.map((o, k) => art(o, k)).join("")}
<section style="padding-top:0"><div class="wrap">${head("Ещё объекты", "Другие здания ПК Веста", "")}<div class="grid-o">${OBJ.map((o) => ocard(o)).join("")}</div><p class="src" style="margin-top:16px">Все 224 объекта: <a href="${F.site}/objects/">pkvesta.kz/objects</a></p></div></section>
${finalBlock()}`;
  return shell("obekt", {
    title: "Фруктохранилище 56 × 76 × 8 м из ЛСТК, Астана | ПК Веста",
    desc: "Объекты ПК Веста с размерами Ш × Д × В: фруктохранилище в Астане, ледовая арена и спортзал в Ташкенте, цех и склад. Хочу такое же: заявка в WhatsApp.",
  }, body);
}

function raschet() {
  const radio = (name, vals, cls = "") => `<div class="opts">${vals.map((v) => `<label class="opt ${cls}"><input type="radio" name="${name}" value="${v}"><span>${v}</span></label>`).join("")}</div>`;
  const body = `${phead(PAGE_NAMES.raschet, "Заявка на расчёт", "Расчёт здания", "Укажите назначение и размеры, и сообщение с ними уйдёт в WhatsApp завода. Ориентировочную цену WebSteel считает сам, круглосуточно.")}
<section style="padding-top:0"><div class="wrap"><div class="book">
<form id="book" novalidate>
<fieldset class="step rv a-rise"><h3><i>1</i>Назначение</h3>${radio("ind", IND.map((x) => x.n))}
<div class="field"><label for="b-type">Тип здания, если знаете</label><input id="b-type" type="text" placeholder="например, коровник или тёплый склад" maxlength="60"></div></fieldset>
<fieldset class="step rv a-rise"><h3><i>2</i>Размеры</h3>
<p class="src" style="margin:0 0 8px">Ширина, м</p>${radio("w", ["12", "15", "18", "24", "30", "36", "42"], "n")}
<div class="field"><label for="b-l">Длина, м · шаг колонн 6 м</label><input id="b-l" type="number" inputmode="numeric" min="6" max="600" step="6" value="36"></div>
<p class="src" style="margin:12px 0 8px">Высота, м</p>${radio("h", ["4", "6", "8", "10"], "n")}
<div class="area"><span>Площадь</span><b id="b-area" class="num"></b></div></fieldset>
<fieldset class="step rv a-rise"><h3><i>3</i>Кровля и утепление</h3>${radio("roof", ["Двускатная", "Плоская"])}${radio("heat", ["Холодный вариант", "Тёплый вариант"])}</fieldset>
<fieldset class="step rv a-rise"><h3><i>4</i>Где строим и как к вам обращаться</h3>
<div class="two"><div class="field"><label for="b-city">Город строительства</label><input id="b-city" type="text" autocomplete="address-level2" placeholder="Алматы" maxlength="60"></div><div class="field"><label for="b-nm">Имя</label><input id="b-nm" type="text" autocomplete="name" maxlength="60"></div></div>
<div class="field"><label for="b-ph">Телефон, если удобнее звонок</label><input id="b-ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7" maxlength="20"></div>
<div class="field"><label for="b-wish">Пожелания: кран-балка, ворота, сроки</label><textarea id="b-wish" maxlength="400"></textarea></div>
<button class="btn btn-wa" type="submit" style="width:100%;margin-top:16px">${ICON.wa}Отправить в WhatsApp</button>
<p class="err" id="err" role="alert" hidden></p><p class="done" id="done" role="status" hidden></p></fieldset>
</form>
<aside class="sum"><div class="panel rv a-slide" data-addon="wa"><h3>Так сообщение придёт заводу</h3><div class="msg"><div class="msg-h">${ICON.wa}WhatsApp · ПК Веста</div><span id="msg"></span><time id="msg-t"></time></div>
<p class="src">Сообщение уходит на WhatsApp с вашего сайта: ${F.waShow}. Это российский номер: для заявок из Казахстана поставим номер алматинского отдела, как скажете.</p></div>
<div class="panel rv a-slide" style="--d:80ms;margin-top:16px"><h3>Или посчитайте сами</h3><p class="sub">WebSteel® считает стоимость по региону, размерам, типу конструкции, обшивке и проёмам и присылает эскизы и коммерческое предложение на почту.</p><div class="cta"><a class="btn btn-main" href="${F.websteel}">${ICON.calc}Открыть WebSteel</a><a class="btn btn-ghost" href="tel:${F.tel}">${ICON.phone}Позвонить</a></div>
<p class="src">Цены на здания ориентировочные: на них влияют климатические зоны, размеры, цены на металл, шаг рам и нагрузки на стены и кровлю. Срок проектирования и изготовления типового здания: 2,5 месяца.</p></div></aside>
</div></div></section>`;
  return shell("raschet", {
    title: "Расчёт быстровозводимого здания по размерам | ПК Веста",
    desc: "Ширина 12-42 м, высота 4-10 м, длина с шагом колонн 6 м, кровля и утепление: заявка уходит в WhatsApp завода. Или посчитайте сами в WebSteel 24/7.",
  }, body);
}

function zavod() {
  const prod = [
    ["span", "Быстровозводимые здания", "Индивидуальные стальные здания по проекту: склады, цеха, фермы, спортзалы, торговые центры."],
    ["factory", "Лёгкие металлоконструкции", "ЛМК на базе сварной балки: многоэтажные здания с большими пролётами и кран-балками. С 2008 года."],
    ["panel", "Сэндвич-панели", "Кровельные и стеновые панели для полнокомплектных зданий. Своё производство с 2004 года."],
    ["bolt", "Оцинкованный профиль", "ЛСТК из оцинкованного профиля до 3 мм: однопролётные здания с пролётом до 30 м. С 2010 года."],
  ];
  const svc = [
    ["team", "Консалтинг", "Поддержка на любом этапе строительства объекта из металлоконструкций."],
    ["draw", "Проектирование", "Разделы КМ, АР и КЖ в программных комплексах на базе BIM."],
    ["factory", "Изготовление", "Полные комплекты зданий на собственном заводе или через сеть международных партнёров."],
    ["truck", "Доставка", "Готовый комплект с завода в любую точку мира: наземным, ЖД путём или авиа."],
    ["found", "Фундамент", "Земляные и фундаментные работы вне зависимости от сложности грунтов."],
    ["bolt", "Монтаж", "Через сеть партнёров: доставка, монтаж металлоконструкций, заливка фундамента и полов."],
    ["laser", "Лазерная резка металла", "Отдельная услуга завода."],
  ];
  const tl = [
    ["1991", "Открытие компании", "Горный инженер-строитель и инженер-конструктор открывают промышленную компанию в Туле."],
    ["1994", "Подъёмно-поворотные ворота", "Первый в России патент на изобретение и производство подъёмно-поворотных ворот. Эти ворота и сейчас на логотипе завода."],
    ["1996", "Противотаранный комплекс", "Вместе с Курчатовским институтом. Им оснащены стратегические объекты России."],
    ["2004", "Сэндвич-панели", "Новое оборудование: кровельные и стеновые панели для полнокомплектных зданий."],
    ["2008", "Лёгкие металлоконструкции", "ЛМК для многоэтажных быстровозводимых зданий с большими пролётами и кран-балками."],
    ["2010", "ЛСТК и экспорт в Казахстан", "Автоматизированное производство тонкостенных конструкций, пролёт до 30 м, патент на серийные здания Z-Top."],
    ["2011", "Онлайн-система WebSteel®", "Сервис, в котором здание проектируют и считают онлайн."],
    ["2016", "Ближний Восток и Африка", "В WebSteel появляются климатические карты Ирана, Аравийского полуострова, Индии и стран Африки."],
    ["2026", "35 лет вместе", "Международный завод проектирует и изготавливает стальные здания и доставляет комплекты в любую точку мира."],
  ];
  const body = `${phead(PAGE_NAMES.zavod, "PK VESTA · с 1991 года", "Завод ПК Веста", "Международный завод проектирует и изготавливает индивидуальные быстровозводимые стальные здания и доставляет комплекты в любую точку мира. Центральный офис в Казахстане: Алматы.")}
<section style="padding-top:0"><div class="wrap">${head("Продукция", "Что делает завод", "")}<div class="svc">${prod.map(([i, h, p], k) => `<div class="sv rv a-${["lift", "beam", "panel", "bolt"][k]}" style="--d:${k * 70}ms"><span class="ic">${ICON[i]}</span><h3>${h}</h3><p>${p}</p></div>`).join("")}</div></div></section>
<section style="padding-top:0"><div class="wrap">${head("Услуги", "От идеи до монтажа", "")}<div class="svc">${svc.map(([i, h, p], k) => `<div class="sv rv a-${["rise", "slide", "pop"][k % 3]}" style="--d:${(k % 3) * 70}ms"><span class="ic">${ICON[i]}</span><h3>${h}</h3><p>${p}</p></div>`).join("")}</div></div></section>
<section style="padding-top:0" data-addon="video"><div class="wrap"><a class="vid rv a-pop" href="${F.video}" target="_blank" rel="noopener"><small>YouTube · ваш канал</small><i>${ICON.play}</i><span>О заводе за 3 минуты</span></a><p class="src">Ролик откроется на YouTube. На сайте он встанет сюда и будет грузиться только по нажатию, чтобы страница не тормозила.</p></div></section>
<section style="padding-top:0"><div class="wrap">${head("История", "35 лет завода", "Линия растёт, пока листаете.")}<ol class="tl" id="tl"><span class="tl-line" aria-hidden="true"></span>${tl.map(([y, h, p]) => `<li class="rv a-left"><b>${y}</b><h3>${h}</h3><p>${p}</p></li>`).join("")}</ol></div></section>
<section style="padding-top:0" id="kontakty"><div class="wrap">${head("Контакты", "Как связаться", "")}<div class="contact">
<div class="panel rv a-rise"><h3>Центральный офис Казахстан</h3><dl><dt>Адрес</dt><dd>${F.address}</dd><dt>Режим</dt><dd>${F.hours}</dd><dt>Телефон</dt><dd><a href="tel:${F.tel}">${F.phone}</a></dd><dt>Почта</dt><dd><a href="mailto:${F.email}">${F.email}</a></dd><dt>БИН</dt><dd>${F.bin}</dd></dl><div class="cta"><a class="btn btn-main" href="tel:${F.tel}">${ICON.phone}Позвонить</a><a class="btn btn-wa" href="${waLink("Здравствуйте! Вопрос по зданию.")}">${ICON.wa}WhatsApp</a></div></div>
<div class="panel rv a-rise" style="--d:80ms"><h3>Завод и WebSteel</h3><dl><dt>Завод</dt><dd>Тула, Россия</dd><dt>Координаты</dt><dd class="num">54.220577, 37.674106</dd><dt>Партнёрство</dt><dd>Денис Кулаков, развитие WebSteel и инвестиции</dd><dt>Телефон</dt><dd>${F.waShow}, 8:00-19:00 по Москве</dd></dl><div class="cta"><a class="btn btn-ghost" href="${F.websteel}">${ICON.calc}WebSteel</a><a class="btn btn-ghost" href="${F.tg}">${ICON.tg}Telegram-канал</a></div></div>
</div></div></section>
${finalBlock()}`;
  return shell("zavod", {
    title: "О заводе ПК Веста: продукция, услуги, история с 1991 года, контакты",
    desc: "Быстровозводимые здания, ЛМК, сэндвич-панели и оцинкованный профиль. Проектирование, изготовление, доставка, фундамент и монтаж. Офис в Алматы.",
  }, body);
}

function plan() {
  const ba = (old, nu, cap, side) => `<figure class="rv a-rise"><div class="ba-box" data-ba><img src="${IMG}/${nu}" alt="Прототип нового сайта ПК Веста" loading="lazy"><div class="was"><img src="${IMG}/${old}" alt="pkvesta.kz сегодня" loading="lazy"></div><span class="tag a">pkvesta.kz сегодня</span><span class="tag b">прототип</span><div class="knob"><i>${ICON.arrows}</i></div><input type="range" min="0" max="100" value="50" aria-label="Сдвинуть шторку"></div><figcaption><span>${cap}</span><span>${side}</span></figcaption></figure>`;
  const pv = {
    admin: `<div class="pv-row"><span>213 · Фруктохранилище, Астана</span><b>56 × 76 × 8</b></div><div class="pv-row"><span>Новая заявка из WhatsApp</span><b>склад 18 × 36</b></div><div class="pv-row"><span>Отрасли и типы</span><b>${TYPES_N}</b></div>`,
    import: `<div class="pv-row"><span>Объекты со старого сайта</span><b>224</b></div><div class="pv-row"><span>Фото и видео</span><b>переносятся</b></div><div class="pv-row"><span>Старые адреса</span><b>ведут на новые</b></div>`,
    seo: `<div class="pv-row"><span>ангар 24 на 60 Алматы</span><b>страница</b></div><div class="pv-row"><span>зернохранилище Кокшетау</span><b>страница</b></div><div class="pv-row"><span>склад под ключ Астана</span><b>страница</b></div>`,
    lang: `<div class="pv-row"><span>Русский</span><b>есть</b></div><div class="pv-row"><span>Қазақша</span><b>+</b></div><div class="pv-row"><span>English</span><b>+</b></div>`,
    crm: `<div class="pv-row"><span>Сделка в Битрикс24</span><b>склад 18 × 36 × 6</b></div><div class="pv-row"><span>Источник</span><b>Каталог · Склад</b></div>`,
  };
  const comp = [
    ["WhatsApp с готовым текстом", "Есть у всех восьми сайтов в Казахстане, которые мы смотрели. У вас текст сразу с размерами, кровлей и городом."],
    ["Готовые решения с размерами", "Star Building показывает «Склад от 1000 м², от 30 дней». У вас в каждой отрасли ваш объект с размерами Ш × Д × В."],
    ["Главный объект в Казахстане", "Asyl Kazyna строит рассказ вокруг одного кейса. У вас склад из вашей таблицы цен собирается из деталей при прокрутке, а объекты с размерами едут лентой."],
    ["Где строили", "Asyl Kazyna перечисляет города. У вас города стоят на схеме по координатам, у каждого объект и размеры."],
    ["Расчёт по размерам на первом экране", "KAZMODUL просит длину, ширину и место. У вас ещё высота и площадь сразу, а дальше WebSteel."],
    ["Почему быстро", "StroyHub объясняет болтовые узлы. У вас блок «Каркас как конструктор» вашими же словами с pkvesta.kz."],
  ];
  const usp = [
    ["Настоящий расчёт, а не заявка", "WebSteel считает стоимость, эскизы и КП сам. У конкурентов, которых мы смотрели, «калькулятор» заканчивается заявкой менеджеру."],
    ["224 объекта с размерами", "Ни у кого в Казахстане столько объектов с Ш × Д × В. Осталось дать к ним фильтр."],
    [`${TYPES_N} типов зданий`, "Каталог от аквафермы до цементного завода: человек находит своё здание по названию."],
    ["Сварки при монтаже нет", "100% болтовое соединение: аргумент про сроки и качество, который у вас уже есть."],
    ["35 лет и патенты", "С 1991 года, первый патент 1994 года: те самые ворота на логотипе."],
    ["Комплект в любую точку", "Доставка землёй, ЖД и авиа и монтаж через партнёров: не только Алматы."],
  ];
  const body = `${phead(PAGE_NAMES.plan, '<span class="ours">Предложение DevUz Studio для ПК Веста</span>', "Было и стало", "Слева pkvesta.kz сегодня, справа этот прототип. Тяните шторку.")}
<section style="padding-top:0"><div class="wrap">
<div class="ba">
${ba("ba-old-d.webp", "ba-new-d.webp", "Компьютер · первый экран", "было: окно поверх заголовка")}
${ba("ba-old-m.webp", "ba-new-m.webp", "Телефон · первый экран", "было: окно закрывает логотип")}
</div>
<div class="grid3" style="margin-top:48px">
<div class="note rv a-rise"><h3>Было: окно поверх первого экрана</h3><p>«Приглашаем партнёров монтажников» закрывает логотип и заголовок, на телефоне почти весь экран. Покупатель здания читает объявление для монтажников.</p></div>
<div class="note rv a-rise" style="--d:90ms"><h3>Было: чужое здание на фоне</h3><p>На первом экране сфера ЭКСПО в Астане, а не ваше здание. Рядом «35 лет на рынке», а ниже «за 28 лет ни одно здание у нас не служилось», с опечаткой.</p></div>
<div class="note rv a-rise" style="--d:180ms"><h3>Стало: расчёт под пальцем</h3><p>Назначение, ширина, длина, высота и площадь на первом экране, кнопка WhatsApp с готовым текстом. На фоне ваш каркас из WebSteel.</p></div>
</div>
</div></section>
<section id="konstruktor" style="padding-top:0"><div class="wrap">
${head("Конструктор проекта", "Соберите сайт под свой бюджет", `Сайт стоит ${sp(KIT_BASE.price)} $. Остальное включается тумблером: включили блок, и он появляется на странице и в превью, итог пересчитывается. Со всеми допами выходит ${sp(KIT_BASE.price + [...ADDONS, ...BLOCKS].reduce((s, a) => s + a.price, 0))} $, точные цены назовём после разговора.`)}
<div class="kit">
<div class="kit-list">
<div class="kit-base"><div><b>${KIT_BASE.ru.t}</b><p>${KIT_BASE.ru.d}</p></div><span class="kit-price num">${usd(KIT_BASE.price)}</span></div>
<h3 class="kit-g">Допы на страницах</h3>
${ADDONS.map((a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="" data-def checked><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a.ru.t}</b><small>${a.ru.e}</small></span><span class="kit-price num">${usd(a.price)}</span></label>`).join("")}
${Object.keys(GROUPS).map((g) => `<h3 class="kit-g">Сверх сайта · ${GROUPS[g].ru}</h3>${BLOCKS.filter((b) => b.group === g).map((b) => `<label class="kit-row"><input type="checkbox" data-k="${b.id}" data-p="${b.price}" data-needs="${b.needs.join(" ")}"${b.star ? " data-def checked" : ""}><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${b.ru.t}</b><small>${b.ru.why}</small><span class="kit-li">${b.ru.li.map((x) => `<em>${x}</em>`).join("")}</span>${b.needs.length ? `<span class="kit-need">Включает: ${b.needs.map((n) => [...ADDONS, ...BLOCKS].find((x) => x.id === n).ru.t).join(", ")}</span>` : ""}</span><span class="kit-price num">${usd(b.price)}</span></label>`).join("")}`).join("")}
</div>
<div class="kit-side">
<div aria-live="polite">${BLOCKS.map((b) => `<div class="kit-pv" data-pv="${b.id}" hidden><b>${b.ru.t}</b>${pv[b.pv]}</div>`).join("")}</div>
<div class="kit-total"><small>Итого с сайтом</small><b class="num" id="kit-sum"></b><small id="kit-n"></small><a class="btn btn-lime" href="https://t.me/Devuz_studio_bot?start=pkvesta">${ICON.tg}Обсудить с DevUz Studio</a></div>
</div>
</div>
</div></section>
<section id="konkurenty" style="padding-top:0"><div class="wrap">
${head("Что взяли у конкурентов", "Сильное у сайтов зданий в Казахстане", "Смотрели Star Building, StroyHub, Asyl Kazyna Group, KAZMODUL, Profi-dom, AngarPro и Lazer Group.")}
<div class="grid3">${comp.map(([h, p], k) => `<div class="note rv a-rise" style="--d:${(k % 3) * 80}ms"><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>
<section class="dark" id="utp"><div class="wrap">
${head("Чем обходим конкурентов", "Шесть сильных сторон ПК Веста", "")}
<div class="offer">${usp.map(([h, p], k) => `<div class="of rv a-${["rise", "bolt", "panel"][k % 3]}" style="--d:${(k % 3) * 90}ms"><span class="ic num" style="font:700 20px/1 var(--head)">0${k + 1}</span><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>
${offerBlock(true)}
<section id="foto"><div class="wrap">
${head("Снимки в прототипе", "Откуда изображения", "Все изображения зданий: визуализации WebSteel® с ваших страниц «Наши объекты» на pkvesta.kz, с вашим знаком. Чертёж на первом экране: каркас фруктохранилища в Астане, перекрашенный в синьку. Сборка здания и мини-здания отраслей нарисованы кодом. Нейросетью ничего не рисовали.")}
<ul class="credits"><li>Объекты №213, 203, 199, 204, 217: <a href="${F.site}/objects/">pkvesta.kz/objects</a></li><li>Домик с воротами в заставке и шапке нарисован кодом по вашему логотипу.</li><li>Склад 24 × 48 × 6 м в сцене сборки взят из вашей таблицы цен: шаг колонн 6 м.</li><li>Движение сделано по мотивам открытых компонентов с 21st.dev (лицензия MIT), код свой: Text Effect, Text Rotate, Shine Border, Flickering Grid, Border Trail, Number Ticker, Scroll Expansion, Vertical Cut Reveal, Spotlight, Blur Fade, Tilt, Border Beam, Hyper Text, Animated Beam, Dot Pattern, Warp Background.</li></ul>
</div></section>`;
  return shell("plan", {
    title: "Что дальше: было и стало, конструктор сайта | ПК Веста",
    desc: `Было и стало: pkvesta.kz сегодня и прототип. Конструктор: сайт ${sp(KIT_BASE.price)} $, со всеми допами ${sp(KIT_BASE.price + [...ADDONS, ...BLOCKS].reduce((s, a) => s + a.price, 0))} $.`,
  }, body);
}

const BUILD = { "": home, katalog, obekt, raschet, zavod, plan };
const out = {};
for (const p of PAGES) out[p] = BUILD[p]();
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/*
 * Сборка для сервера (lib/proto/bundles): общие куски — стили, скрипт —
 * один раз, в страницах вместо них метка @@имя@@.
 */
const first = out[""];
const grab = (html, re) => html.match(re)[0];
const parts = {
  S: grab(first, /<style>[\s\S]*?<\/style>/),
  J: grab(first, /<script>\n\(function\(\)\{\n'use strict';\n\/\* main[\s\S]*?<\/script>/),
};
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let page = html;
  for (const [name, part] of Object.entries(parts)) page = page.split(part).join(`@@${name}@@`);
  pages[key] = page;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "pkvesta.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(main)").padEnd(12), v.length);
