import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { ADDONS, BASE as KIT_BASE, BLOCKS } from "./plan.mjs";

/*
 * Прототип Enotmebel (enotmebel.uz): бескаркасная мебель из Ташкента,
 * бин-бэги, кресла-мешки, лежаки. Главная — одна история при прокрутке по
 * движку нашего Engelberg v2 (globalex/engelberg/v2): липкая сцена, слои во
 * весь экран со своей камерой, подписи снизу, глава и полоса внизу слева,
 * стеклянные карточки, точки на снимке, частицы на canvas. После истории —
 * каталог, подбор размера, выбор ткани и цвета, корпоративный заказ, гарантия и
 * шоурум. Две страницы на двух языках: главная и «Что дальше».
 * Исследование — docs/research/enotmebel.md, фото — SOURCES.md, заходы
 * 21st.dev — 21ST.md.
 *
 * Всё о компании — только с enotmebel.uz (снято 11.10.2026): 15 моделей и
 * их цены в сумах, ткани, четыре наполнителя, «без острых и жёстких углов»,
 * доставка по всему Узбекистану, упаковка, гарантийный ремонт швов, замков и
 * фурнитуры, шоурум по записи, телефон, Telegram, Instagram, YouTube,
 * логотипы клиентов и снимки галереи. Сроков, отзывов, «лет на рынке» на
 * сайте нет, поэтому нет и здесь. Наши дополнения подписаны «Предложение
 * DevUz Studio».
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/enotmebel";
const CSS = readFileSync(DIR + "style.css", "utf8").replace(/\n/g, "").replace(/__IMG__/g, IMG);
const INTRO = readFileSync(DIR + "intro.js", "utf8");
const STORY = readFileSync(DIR + "story.js", "utf8");
const JS = readFileSync(DIR + "client.js", "utf8");
const LOGO = JSON.parse(readFileSync(DIR + "logo.json", "utf8"));
/* Образцы тканей: карты расцветок со страницы «Ткани» (photos.py): номер
   цвета, ширина и высота большого фото, средний цвет, сторона плитки. */
const SW = JSON.parse(readFileSync(DIR + "fabrics.json", "utf8"));
const BASE = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Manrope:wght@400;700&display=swap";

const usd = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
const sp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, path = "") => BASE + (l === "uz" ? "/uz" : "") + (path ? "/" + path : "");
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const sum = (l) => (l === "ru" ? "сум" : "so‘m");

/* ── Факты с их сайта ─────────────────────────────────────────────────── */
const F = {
  name: "Enotmebel",
  phone: "+998909512710",
  phoneT: "+998 90 951 27 10",
  tg: "https://t.me/enotmebel",
  tgAt: "@enotmebel",
  tg2: "https://t.me/enotuz",
  ig: "https://instagram.com/enotmebel",
  yt: "https://www.youtube.com/@enotmebel",
  site: "https://enotmebel.uz",
  show: { ru: "ул. Гавхар 151, Ташкент", uz: "Gavhar ko‘chasi 151, Toshkent" },
  addr2: { ru: "ул. Кушбеги 8-34А, Ташкент", uz: "Qushbegi ko‘chasi 8-34A, Toshkent" },
};
const MAP = "https://yandex.uz/maps/?text=" + encodeURIComponent("Ташкент, улица Гавхар, 151");

/* 15 моделей и цены — каталог enotmebel.uz, как есть на 11.10.2026. */
const GROUPS = {
  grusha: ["Груши", "Noklar"],
  flaunder: ["Флаундер", "Flaunder"],
  pyramid: ["Пирамиды", "Piramidalar"],
  chair: ["Кресла", "Kreslolar"],
  lounger: ["Лежаки", "Shezlonglar"],
};
const ALL5 = ["polycon", "velour2", "diagonal", "micro", "velour"];
const MODELS = [
  { id: "mini", g: "grusha", n: ["Груша MINI", "Nok MINI"], min: 450000, max: 800000, h: [0, 110], note: ["для роста до 110 см", "110 sm gacha bo‘y uchun"], u: "mini" },
  { id: "standart", g: "grusha", n: ["Груша STANDART", "Nok STANDART"], min: 700000, max: 1200000, u: "grusha_standart" },
  { id: "big", g: "grusha", n: ["Груша BIG", "Nok BIG"], min: 950000, max: 1600000, h: [0, 180], note: ["для роста до 180 см, внутренний чехол из плащевой ткани", "180 sm gacha bo‘y uchun, ichki g‘ilof plashchevka matodan"], u: "grusha" },
  { id: "gigant", g: "grusha", n: ["Груша GIGANT", "Nok GIGANT"], min: 1300000, max: 2000000, u: "gigant" },
  { id: "voyvo", g: "grusha", n: ["Груша VOY-VO", "Nok VOY-VO"], min: 1800000, max: 2700000, u: "voy-vo" },
  { id: "fl-grand", g: "flaunder", n: ["Флаундер GRAND", "Flaunder GRAND"], min: 1200000, max: 1900000, u: "flaunder-grand" },
  { id: "fl-stand", g: "flaunder", n: ["Флаундер STAND", "Flaunder STAND"], min: 900000, max: 1600000, u: "fluander-stand" },
  { id: "fl-mini", g: "flaunder", n: ["Флаундер MINI", "Flaunder MINI"], min: 600000, max: 1100000, u: "" },
  { id: "aero", g: "chair", n: ["Аэро", "Aero"], min: 1500000, max: 2000000, u: "aero" },
  { id: "kvadro", g: "chair", n: ["Квадро", "Kvadro"], min: 1400000, max: 1800000, u: "quadro", fab: ["velour2", "diagonal", "micro", "velour"] },
  { id: "piramida", g: "pyramid", n: ["Пирамида", "Piramida"], min: 900000, max: 1400000, u: "piramida" },
  { id: "pifagor", g: "pyramid", n: ["Пифагор", "Pifagor"], min: 900000, max: 1500000, u: "pifagor" },
  { id: "maxrelax", g: "lounger", n: ["Max Relax", "Max Relax"], min: 2200000, max: 2700000, u: "max-relax" },
  { id: "sleeprelax", g: "lounger", n: ["Sleep Relax", "Sleep Relax"], min: 2000000, max: 2500000, u: "sleep-relax", fab: ["velour2", "diagonal", "micro", "velour"] },
  { id: "strech", g: "lounger", n: ["Стреч", "Strech"], min: 950000, max: 950000, u: "strech" },
];
const M = Object.fromEntries(MODELS.map((m) => [m.id, m]));
const priceOf = (l, m) => (m.min === m.max ? `${sp(m.min)} ${sum(l)}` : `${l === "ru" ? "от" : ""} ${sp(m.min)} ${sum(l)}${l === "uz" ? " dan" : ""}`.trim());
const rangeOf = (l, m) => (m.min === m.max ? `${sp(m.min)} ${sum(l)}` : `${sp(m.min)}…${sp(m.max)} ${sum(l)}`);

/* Ткани — страница «Ткани» на их сайте: пять, две водоотталкивающие; card —
   как подписаны образцы на их карте расцветок. */
const FABRICS = [
  { id: "polycon", card: "Polycon", n: ["Polycon", "Polycon"], d: ["водоотталкивающая, эконом", "suv o‘tkazmaydi, ekonom"], wet: true, },
  { id: "velour2", card: "Velutto", n: ["Велюр усиленный", "Mustahkam velyur"], d: ["плотный и мягкий", "zich va yumshoq"], },
  { id: "diagonal", card: "Diagonal", n: ["Диагональ", "Diagonal"], d: ["водоотталкивающая", "suv o‘tkazmaydi"], wet: true, },
  { id: "micro", card: "Velvet Lux", n: ["Микровельвет люкс", "Mikrovelvet lyuks"], d: ["тонкий рубчик", "ingichka chiziqli"], },
  { id: "velour", card: "Zodiak", n: ["Велюр", "Velyur"], d: ["бархатистый на ощупь", "qo‘lga baxmaldek"], },
];

/* Наполнители — страница «Наполнители». */
const FILL = [
  [["Пенополистирол, EPS", "Penopolistirol, EPS"], ["шарики 3-5 мм, классика для кресел-мешков", "3-5 mm sharchalar, kreslo-qoplar uchun klassika"]],
  [["Пенополиуретан листом", "List penopoliuretan"], ["плотный поролон, держит форму", "zich porolon, shaklni ushlaydi"]],
  [["Гранулы EPP", "EPP granulalari"], ["плотнее EPS, в премиальных моделях", "EPS’dan zichroq, premium modellarda"]],
  [["Нарезанный пенополиуретан", "Kesilgan penopoliuretan"], ["упругий, ровно держит нагрузку", "elastik, yukni bir tekis taqsimlaydi"]],
];

/* Логотипы клиентов — блок на их главной. */
const CLIENTS = [["carlsberg", "Carlsberg"], ["it_park", "IT Park"], ["enter", "Enter"], ["discover", "Discover"], ["sevimli", "Sevimli"], ["asklepiy", "Asklepiy"]];

/* Галерея — их снимки с мероприятий и офисов. */
const GAL = [
  { n: 2, ru: "Офис: синие кресла у стеллажей", uz: "Ofis: javonlar yonida ko‘k kreslolar" },
  { n: 7, ru: "Мероприятие на траве", uz: "Maysadagi tadbir" },
  { n: 3, ru: "Зона отдыха под навесом", uz: "Ayvon ostidagi dam olish zonasi" },
  { n: 8, ru: "Пара кресел в саду", uz: "Bog‘dagi juft kreslo" },
  { n: 10, ru: "Арт-пространство", uz: "Art-makon" },
  { n: 4, ru: "Кресла в узорных тканях", uz: "Naqshli matodagi kreslolar" },
  { n: 9, ru: "Лаунж у бассейна", uz: "Basseyn yonidagi launj" },
  { n: 5, ru: "Лежак и пуф", uz: "Shezlong va puf" },
];

/* ── Логотип: буквы геометрией, фигурка — их же контур ────────────────── */
const rect = (x, y, w, h) => `M${x} ${y}h${w}v${h}h-${w}z`;
const glyphE = (x, w) => rect(x, 38, 10.5, 69.8) + rect(x, 38, w, 10.3) + rect(x, 67.7, w - 4, 10.3) + rect(x, 97.5, w, 10.3);
const GL = {
  e: glyphE(0, 48.8),
  n: rect(85, 38, 10.5, 69.8) + rect(134.1, 38, 10.5, 69.8) + "M85 38h13.2L144.6 107.8h-13.2z",
  o: "M253.5 72.9a36.55 36.1 0 1 1-73.1 0a36.55 36.1 0 1 1 73.1 0zM242.05 72.9a25.1 25.6 0 1 0-50.2 0a25.1 25.6 0 1 0 50.2 0z",
  oIn: "M242.05 72.9a25.1 25.6 0 1 0-50.2 0a25.1 25.6 0 1 0 50.2 0z",
  t: LOGO.fig,
  head: `M${LOGO.head[0] - LOGO.head[2]} ${LOGO.head[1]}a${LOGO.head[2]} ${LOGO.head[2]} 0 1 0 ${2 * LOGO.head[2]} 0a${LOGO.head[2]} ${LOGO.head[2]} 0 1 0 ${-2 * LOGO.head[2]} 0z`,
  m: "M376.2 107.8V38h12.3l24.45 41 24.45-41h12.3v69.8h-10.5V56L417 92.5h-8.1L386.7 56v51.8z",
  e2: glyphE(490, 48.6),
  b1: "M575 38H607a18 18 0 0 1 0 36H575zM585.5 48.3V63.7H607a7.7 7.7 0 0 0 0-15.4z",
  b2: "M575 69H611a19.4 19.4 0 0 1 0 38.8H575zM585.5 79.3V97.5H611a9.1 9.1 0 0 0 0-18.2z",
  e3: glyphE(667, 48.8),
  l: rect(752, 38, 10.5, 69.8) + rect(752, 97.5, 48, 10.3),
};
const logoSvg = (cls = "") => `<svg class="${cls}" viewBox="0 0 800 127" aria-hidden="true" focusable="false"><g fill="currentColor"><path d="${GL.e}${GL.n}${GL.m}${GL.e2}${GL.e3}${GL.l}${GL.head}"/><path fill-rule="evenodd" d="${GL.o}"/><path fill-rule="evenodd" d="${GL.b1}"/><path fill-rule="evenodd" d="${GL.b2}"/><path d="${GL.t}"/></g></svg>`;

/* Логотип DevUz Studio для заставки — тот же, что в промо на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZMARK = `<svg class="dz-mark" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

/* Иконки — контуры 24×24, по смыслу. */
const I = (d, w = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  tg: I('<path d="M21 4 3 11l6 2.5M21 4l-3.5 16-8.5-6.5M21 4 9 13.5V19l3-3.5"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>', 2),
  arrows: I('<path d="m9 7-5 5 5 5M15 7l5 5-5 5"/>', 2),
  check: I('<path d="m5 12 5 5 9-10"/>', 2),
  plus: I('<path d="M12 5v14M5 12h14"/>', 2),
  minus: I('<path d="M5 12h14"/>', 2),
  bag: I('<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  shield: I('<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
  truck: I('<path d="M2 6h12v10H2zM14 9h4l3 3v4h-7"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
  box: I('<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>'),
  soft: I('<path d="M4 15c0-5 3.6-10 8-10s8 5 8 10c0 3-3.6 5-8 5s-8-2-8-5z"/><path d="M8.5 14.5c1 1 2.2 1.5 3.5 1.5s2.5-.5 3.5-1.5"/>'),
  drop: I('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
  tool: I('<path d="M14.5 6.5a4 4 0 0 0 4.9 4.9l-8.8 8.8a2 2 0 0 1-2.8-2.8l8.8-8.8a4 4 0 0 0-4.9-4.9l2.5 2.5-.5 2-2 .5z"/>'),
  office: I('<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M10 21v-4h4v4"/>'),
  calendar: I('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  ruler: I('<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>'),
  ig: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>'),
  yt: I('<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9 5 3-5 3z"/>'),
  card: I('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>'),
  split: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5V12l6 6"/>'),
  user: I('<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
};

const PAGE_NAMES = { "": ["Главная", "Bosh sahifa"], plan: ["Что дальше", "Keyingi qadam"] };

/* ── Сообщения в Telegram Enotmebel ───────────────────────────────────── */
const tgBtn = (l, cls, label, text) => `<a class="btn ${cls}" href="${F.tg}" data-tg="${esc(text)}">${ICON.tg}${label}</a>`;
const orderText = (l, m) => (l === "ru" ? `Здравствуйте! Хочу заказать ${m.n[0]} (${rangeOf(l, m)}). Подскажите по тканям и доставке.` : `Assalomu alaykum! ${m.n[1]} (${rangeOf(l, m)}) buyurtma qilmoqchiman. Matolar va yetkazib berish haqida aytib bering.`);
const helloText = (l) => (l === "ru" ? "Здравствуйте! Хочу подобрать кресло-мешок. Подскажите по моделям и тканям." : "Assalomu alaykum! Kreslo-qop tanlamoqchiman. Modellar va matolar haqida aytib bering.");

/* ── Конструктор: плашка на каждой странице ───────────────────────────── */
function kdRow(l, a, def = true) {
  return `<label class="kd-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="${(a.needs || []).join(" ")}"${def ? " data-def checked" : ""}><span class="sw" aria-hidden="true"></span><span class="kd-t"><b>${a[l].t}</b>${a[l].e ? `<small>${a[l].e}</small>` : ""}</span><span class="kd-p num">+${usd(a.price)}</span></label>`;
}
function dockHtml(l) {
  const t = T(l);
  const group = (title, side, rows) => (rows.length ? `<section class="kd-g"><h3><span>${title}</span>${side}</h3>${rows.join("")}</section>` : "");
  return `<button class="kd-pill" type="button" id="kd-pill" aria-expanded="false" aria-controls="kd"><i aria-hidden="true"></i>${t("Конструктор", "Konstruktor")}<b class="num" id="kd-pill-sum"></b></button>
<aside class="kd" id="kd" role="dialog" aria-label="${t("Конструктор сайта", "Sayt konstruktori")}" hidden>
<header class="kd-h"><div><p class="kd-k">${t("Конструктор · предложение DevUz Studio", "Konstruktor · DevUz Studio taklifi")}</p><h2>${t("Что войдёт в новый Enotmebel", "Yangi Enotmebel’ga nima kiradi")}</h2><p class="kd-sub">${t("Выключите блок, и он пропадёт со страницы. Включите, и он появится снова. Цены по середине рынка Ташкента.", "Blokni o‘chirsangiz, u sahifadan yo‘qoladi. Yoqsangiz, yana paydo bo‘ladi. Narxlar Toshkent bozorining o‘rtasi bo‘yicha.")}</p></div><button class="kd-x" type="button" id="kd-x" aria-label="${t("Свернуть", "Yig‘ish")}">×</button></header>
<div class="kd-list">
${group(t("На главной", "Bosh sahifada"), `<a href="${href(l)}#katalog">${t("открыть", "ochish")} →</a>`, ADDONS.filter((a) => a.where === "").map((a) => kdRow(l, a)))}
${group(t("На всех страницах", "Barcha sahifalarda"), "", ADDONS.filter((a) => a.where === "all").map((a) => kdRow(l, a)))}
${group(t("Сверх сайта", "Saytdan tashqari"), `<a href="${href(l, "plan")}#konstruktor">${t("что это", "bu nima")} →</a>`, BLOCKS.map((b) => kdRow(l, { ...b, [l]: { t: b[l].t } })))}
</div>
<footer class="kd-f">
<div class="kd-line"><span>${t("Сайт", "Sayt")}</span><span class="num">${usd(KIT_BASE.price)}</span></div>
<div class="kd-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kd-n"></span></span><span class="num" id="kd-add"></span></div>
<div class="kd-line kd-tot"><span>${t("Итого разово", "Jami bir martalik")}</span><b class="num" id="kd-sum"></b></div>
<a class="btn btn-blue" href="https://t.me/Devuz_studio_bot?start=enotmebel">${ICON.tg}${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</a>
<div class="kd-btns"><button class="copy" type="button" id="kd-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button><button class="copy" type="button" id="kd-reset">${t("Сбросить", "Qayta tiklash")}</button></div>
</footer>
</aside>`;
}

/* ── Заставка: промо DevUz Studio → ENOT, кресло в буквах → влёт в «O» ── */
function introHtml(l) {
  const t = T(l);
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  const parts = [GL.e, GL.n, GL.o, GL.t + GL.head];
  return `<div class="intro" id="intro" role="presentation">
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZMARK}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t("прототип для Enotmebel", "Enotmebel uchun prototip")}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<svg class="en-svg" aria-hidden="true" focusable="false"><defs><mask id="en-mask" maskUnits="userSpaceOnUse" x="-9000" y="-9000" width="18000" height="18000">${parts.map((d, i) => `<path class="en-cp" data-i="${i}" d="${d}" fill="#fff" fill-rule="${i === 2 ? "evenodd" : "nonzero"}" stroke="#fff" stroke-width="9" stroke-linejoin="round"/>`).join("")}</mask></defs>
<g class="en-cam"><path class="en-veil" fill-rule="evenodd" d="M-9000 -9000H9000V9000H-9000Z ${GL.oIn}"/><path class="en-slit" d="${GL.oIn}"/>
<g mask="url(#en-mask)"><rect x="-40" y="-40" width="420" height="210" fill="#1c2b5c"/><image class="en-img" href="${IMG}/hero-1440.webp" x="-20" y="-58" width="380" height="224.4" preserveAspectRatio="xMidYMid slice"/></g>
</g></svg>
<div class="en-cap"><b>Enotmebel</b><span>${t("бескаркасная мебель · Ташкент", "karkassiz mebel · Toshkent")}</span></div>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish")}</button>
</div>`;
}

/* Фильтр преломления для «жидкого стекла»: шум смещает то, что под
   стеклом. Понимает только Chromium, остальным хватает размытия. */
const LQ = `<svg class="lq-defs" aria-hidden="true" focusable="false"><filter id="lq" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.019" numOctaves="2" result="n"/><feGaussianBlur in="n" stdDeviation="2.5" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="22" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;

/* ── Каркас ───────────────────────────────────────────────────────────── */
function shell(l, path, meta, body) {
  const t = T(l);
  const other = l === "ru" ? "uz" : "ru";
  const isHome = path === "";
  const nav = [["katalog", t("Модели", "Modellar")], ["tkani", t("Ткани", "Matolar")], ["ofis", t("Для офиса", "Ofis uchun")], ["garantiya", t("Гарантия", "Kafolat")]];
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0d1426">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
${isHome ? `<link rel="preload" as="image" href="${IMG}/hero-2560.webp">` : ""}
<link rel="alternate" hreflang="${other}" href="${href(other, path)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=${isHome ? "false" : "true"};try{if(sessionStorage.getItem('en-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden';try{var k=JSON.parse(localStorage.getItem('en-kit-v1')||'{}');for(var x in k)if(k[x]===false)r.classList.add('k-no-'+x)}catch(e){}})()</script>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "FurnitureStore", name: F.name, url: F.site, telephone: F.phone, address: { "@type": "PostalAddress", streetAddress: F.show.ru, addressLocality: "Ташкент", addressCountry: "UZ" }, areaServed: "UZ", sameAs: [F.tg, F.ig, F.yt] })}</script>
</head>
<body class="${isHome ? "home" : "inner"}" data-page="${path}" data-lang="${l}">
${LQ}
${isHome ? introHtml(l) : ""}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="Enotmebel">${logoSvg()}</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([id, n]) => `<a href="${href(l)}#${id}">${n}</a>`).join("")}<a href="${href(l, "plan")}"${path === "plan" ? ' aria-current="page"' : ""}>${PAGE_NAMES.plan[l === "ru" ? 0 : 1]}</a></nav>
<div class="top-r"><div class="lang" data-addon="uz"><a href="${href("ru", path)}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz", path)}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>
<button class="cart-btn" type="button" id="cart-btn" data-addon="cart" aria-label="${t("Корзина", "Savat")}">${ICON.bag}<b class="num" id="cart-n" hidden>0</b></button>
${tgBtn(l, "btn-blue btn-sm top-cta", t("Заказать", "Buyurtma"), helloText(l))}</div>
</div></header>
<main id="main">
${body}
</main>
<footer class="foot"><div class="wrap">
<div class="cols">
<div><span class="f-logo">${logoSvg()}</span><p>${t("Бескаркасная мебель: бин-бэги, кресла-мешки, лежаки для дома, офиса и отдыха.", "Karkassiz mebel: bin-beglar, kreslo-qoplar, uy, ofis va dam olish uchun shezlonglar.")}</p></div>
<div><b>${t("На связи", "Aloqada")}</b><ul><li><a href="tel:${F.phone}">${F.phoneT}</a></li><li><a href="${F.tg}">Telegram ${F.tgAt}</a></li><li><a href="${F.ig}">Instagram</a> · <a href="${F.yt}">YouTube</a></li></ul></div>
<div><b>${t("Офис и шоурум", "Ofis va shourum")}</b><ul><li>${F.show[l]}</li><li>${t("посещение только по записи", "faqat oldindan yozilib")}</li><li><a href="${MAP}">${t("Открыть на карте", "Xaritada ochish")}</a></li></ul></div>
</div>
<div class="rights"><span>${t("Это прототип: так может выглядеть новый сайт Enotmebel. Модели, цены, ткани, наполнители, гарантия, контакты, фото и логотипы клиентов взяты с enotmebel.uz (11.10.2026). Блоки с пометкой «Предложение DevUz Studio» придумали мы, на сайте их пока нет. Откуда изображения:", "Bu prototip: yangi Enotmebel sayti shunday ko‘rinishi mumkin. Modellar, narxlar, matolar, to‘ldiruvchilar, kafolat, kontaktlar, fotolar va mijozlar logotiplari enotmebel.uz’dan olingan (11.10.2026). «DevUz Studio taklifi» belgisi bor bloklarni biz o‘ylab topdik, ular hozircha saytda yo‘q. Rasmlar qayerdan:")} <a href="${href(l, "plan")}#foto">${PAGE_NAMES.plan[l === "ru" ? 0 : 1]}</a>.</span><span>${t("Прототип принадлежит DevUz Studio. Использовать его можно только по договору:", "Prototip DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari")}</a></span></div>
</div></footer>
<div class="dock" id="dock">${tgBtn(l, "btn-blue shim", t("Заказать в Telegram", "Telegram orqali buyurtma"), helloText(l))}<a class="btn btn-ghost dock-call" href="tel:${F.phone}" aria-label="${t("Позвонить", "Qo‘ng‘iroq qilish")}">${ICON.phone}</a></div>
${cartHtml(l)}
${dockHtml(l)}
<script type="application/json" id="i18n">${JSON.stringify(Ls(l)).replace(/</g, "\\u003c")}</script>
${isHome ? `<script>\n${INTRO}</script>\n<script>\n${STORY}</script>` : ""}
<script>
${JS}</script>
</body>
</html>`;
}

/* Корзина: выдвижная панель, состав уходит в Telegram одним сообщением. */
function cartHtml(l) {
  const t = T(l);
  return `<aside class="cart" id="cart" role="dialog" aria-label="${t("Корзина", "Savat")}" data-addon="cart" hidden>
<header class="cart-h"><h2>${t("Корзина", "Savat")}</h2><button class="kd-x" type="button" id="cart-x" aria-label="${t("Закрыть", "Yopish")}">×</button></header>
<ul class="cart-list" id="cart-list"></ul>
<p class="cart-empty" id="cart-empty">${t("Пока пусто. Добавьте модель из каталога.", "Hozircha bo‘sh. Katalogdan model qo‘shing.")}</p>
<footer class="cart-f">
<div class="kd-line kd-tot"><span>${t("Примерно", "Taxminan")}</span><b class="num" id="cart-sum"></b></div>
<p class="cart-note">${t("Точную цену менеджер назовёт по ткани и доставке.", "Aniq narxni menejer mato va yetkazib berish bo‘yicha aytadi.")}</p>
<label class="field"><span>${t("Телефон", "Telefon")}</span><input id="cart-ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998"></label>
<div class="pay-row" data-addon="pay"><span>${t("Оплата при заказе:", "Buyurtmada to‘lov:")}</span><b class="pay-chip payme">Payme</b><b class="pay-chip click">Click</b><span class="ours sm">${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</span></div>
<div class="pay-row" data-addon="nasiya"><span>${t("Или частями:", "Yoki bo‘lib:")}</span><b class="pay-chip uzum">Uzum Nasiya</b><b class="pay-chip alif">Alif</b></div>
<button class="btn btn-blue" type="button" id="cart-send">${ICON.tg}${t("Отправить заказ в Telegram", "Buyurtmani Telegramga yuborish")}</button>
<p class="note-ok" id="cart-done" role="status" hidden></p>
</footer>
</aside>`;
}

/* Строки для скриптов страницы. */
function Ls(l) {
  const ru = l === "ru";
  return {
    lang: l,
    tg: F.tg,
    sum: sum(l),
    kitBase: KIT_BASE.price,
    kitN: ru ? "{n} шт." : "{n} ta",
    kitTg: ru ? "Состав нового сайта Enotmebel из конструктора:" : "Konstruktordan yangi Enotmebel sayti tarkibi:",
    kitBaseName: KIT_BASE[l].t,
    kitTotal: ru ? "Итого" : "Jami",
    copied: ru ? "Скопировано" : "Nusxalandi",
    sent: ru ? "Текст скопирован. Открываем Telegram Enotmebel, вставьте его в чат." : "Matn nusxalandi. Enotmebel Telegrami ochilmoqda, uni chatga qo‘ying.",
    need: ru ? "Оставьте телефон: без него менеджеру некуда перезвонить." : "Telefon qoldiring: usiz menejer qo‘ng‘iroq qila olmaydi.",
    cartHead: ru ? "Заказ с сайта Enotmebel:" : "Enotmebel saytidan buyurtma:",
    cartPh: ru ? "Телефон" : "Telefon",
    cartTot: ru ? "Примерно" : "Taxminan",
    added: ru ? "В корзине" : "Savatda",
    add: ru ? "В корзину" : "Savatga",
    less: ru ? "Убрать одно" : "Bittasini olib tashlash",
    more: ru ? "Добавить ещё" : "Yana qo‘shish",
    fabric: ru ? "Ткань" : "Mato",
    color: ru ? "Цвет" : "Rang",
    from: ru ? "от {p}" : "{p} dan",
    sizeHead: ru ? "Подбор по росту с сайта Enotmebel:" : "Enotmebel saytidan bo‘y bo‘yicha tanlov:",
    height: ru ? "Рост" : "Bo‘y",
    cm: ru ? "см" : "sm",
    sizeKid: ru ? "Ребёнку подойдёт MINI: она для роста до 110 см." : "Bolaga MINI mos keladi: u 110 sm gacha bo‘y uchun.",
    sizeAdult: ru ? "Подойдёт BIG: она для роста до 180 см и хорошо подстраивается под тело." : "BIG mos keladi: u 180 sm gacha bo‘y uchun va tanaga yaxshi moslashadi.",
    sizeTall: ru ? "Выше 180 см смотрите груши крупнее BIG: GIGANT и VOY-VO. Размер уточнит менеджер." : "180 sm dan baland bo‘lsa, BIG’dan kattaroq noklarni ko‘ring: GIGANT va VOY-VO. O‘lchamni menejer aniqlaydi.",
    sizeMid: ru ? "Между MINI и BIG есть STANDART. Под ваш рост размер уточнит менеджер." : "MINI va BIG orasida STANDART bor. Bo‘yingizga mos o‘lchamni menejer aniqlaydi.",
    fabHead: ru ? "Хочу кресло такого вида:" : "Shunday kreslo istayman:",
    model: ru ? "Модель" : "Model",
    b2bHead: ru ? "Корпоративный заказ с сайта Enotmebel" : "Enotmebel saytidan korporativ buyurtma",
    b2bWho: ru ? "Для кого" : "Kim uchun",
    b2bQty: ru ? "Сколько кресел" : "Nechta kreslo",
    b2bWhen: ru ? "Когда нужно" : "Qachon kerak",
    b2bWhere: ru ? "Город" : "Shahar",
    b2bName: ru ? "Компания или имя" : "Kompaniya yoki ism",
    b2bNeed: ru ? "Укажите количество и телефон: без них менеджеру нечего посчитать." : "Soni va telefonni ko‘rsating: ularsiz menejer hisoblay olmaydi.",
    showHead: ru ? "Хочу прийти в шоурум Enotmebel" : "Enotmebel shourumiga kelmoqchiman",
    empty: ru ? "не указано" : "ko‘rsatilmagan",
    found: ru ? "Моделей: {n}" : "Modellar: {n}",
    models: Object.fromEntries(MODELS.map((m) => [m.id, { n: m.n[ru ? 0 : 1], min: m.min, max: m.max }])),
    fabrics: Object.fromEntries(FABRICS.map((f) => [f.id, f.n[ru ? 0 : 1]])),
    cards: Object.fromEntries(FABRICS.map((f) => [f.id, f.card])),
    img: IMG,
  };
}

/* ── Куски страниц ────────────────────────────────────────────────────── */
const head = (kicker, h, lead, side = "", anim = "rise") => `<div class="sec-head rv a-${anim}"><div>${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>${side}</div>`;
const ours = (l) => `<span class="ours">${T(l)("Предложение DevUz Studio", "DevUz Studio taklifi")}</span>`;
const pic = (id, cls, sizes, alt, eager = false) => `<img class="${cls}" src="${IMG}/m-${id}-600.webp" srcset="${IMG}/m-${id}-600.webp 600w, ${IMG}/m-${id}-1024.webp 1024w" sizes="${sizes}" alt="${esc(alt)}" width="1024" height="1536"${eager ? "" : ' loading="lazy"'} decoding="async">`;

/* Груша кодом: контур кресла-мешка для главы «Внутри». */
const PEAR = "M300 64C238 64 196 120 176 196C152 284 104 360 92 448C82 524 150 584 300 584C450 584 518 524 508 448C496 360 448 284 424 196C404 120 362 64 300 64Z";
const PEAR_IN = "M300 98C250 98 216 146 199 210C177 292 135 362 125 444C117 506 175 552 300 552C425 552 483 506 475 444C465 362 423 292 401 210C384 146 350 98 300 98Z";


/* Образцы для столбиков в истории: разные цвета каждой ткани. */
/**
 * Сколько цветов ткани видно сразу. Остальные — по кнопке «Ещё N цветов».
 * 11.10.2026 на iPhone сетка из 77 образцов в прокручиваемом окне
 * запрашивалась целиком, и сервер отбивал пачку (429): вместо образцов были
 * знаки вопроса. Владелец: «не грузи все, сделай чисто на превью те,
 * которые показываем». Картинки образцов грузит очередь в client.js.
 */
const SW_SHOW = 18;
/** «цвет», «цвета», «цветов» — по числу. */
const colorsRu = (n) => (n % 10 === 1 && n % 100 !== 11 ? "цвет" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "цвета" : "цветов");

const STORY_SW = {
  polycon: ["5", "18", "12", "20", "3"],
  velour2: ["27", "45", "56", "35", "72"],
  diagonal: ["540", "779", "411", "694", "310"],
  micro: ["09", "72", "45", "28", "84"],
  velour: ["432", "667", "337", "796", "552"],
};

/* ── Схема Узбекистана: Natural Earth (общественное достояние) ────────── */
const UZ = "M618 636L620 589L542 556L481 518L443 481L376 428L348 348L328 334L265 338L243 322L236 260L158 219L108 264L59 291L68 330L2 331L0 46L150 0L161 7L252 62L300 91L355 161L424 150L524 144L594 200L589 278L618 278L630 342L704 344L720 381L742 380L767 325L844 271L878 257L895 265L846 315L889 344L931 324L1000 365L925 421L881 413L857 415L848 394L861 358L782 376L764 426L736 468L687 465L672 499L715 517L728 575L695 653L651 637L618 636Z";
const CITIES = [
  ["Ташкент", "Toshkent", 777, 332], ["Самарканд", "Samarqand", 644, 459], ["Бухара", "Buxoro", 496, 450], ["Андижан", "Andijon", 958, 372],
  ["Фергана", "Farg‘ona", 926, 403], ["Наманган", "Namangan", 919, 355], ["Нукус", "Nukus", 214, 242], ["Ургенч", "Urganch", 274, 312],
  ["Карши", "Qarshi", 576, 520], ["Термез", "Termiz", 663, 647], ["Навои", "Navoiy", 552, 424], ["Джизак", "Jizzax", 695, 423],
];
function mapSvg(l, cls) {
  const [, , tx, ty] = CITIES[0];
  const routes = CITIES.slice(1).map(([, , x, y], k) => {
    const mx = (tx + x) / 2, my = (ty + y) / 2 - Math.hypot(x - tx, y - ty) * 0.22;
    return `<path class="rt" data-k="rt${k}" d="M${tx} ${ty}Q${mx.toFixed(0)} ${my.toFixed(0)} ${x} ${y}" pathLength="1"/>`;
  }).join("");
  return `<svg class="${cls}" viewBox="-20 -20 1040 700" role="img" aria-label="${T(l)("Схема доставки из Ташкента по Узбекистану", "Toshkentdan O‘zbekiston bo‘ylab yetkazib berish sxemasi")}"><path class="uz" data-k="uz" d="${UZ}" pathLength="1"/>${routes}${CITIES.map(([ru, uz, x, y], k) => `<g class="ct${k === 0 ? " home" : ""}" data-k="ct${k}" transform="translate(${x} ${y})"><circle r="${k === 0 ? 9 : 6}"/>${k === 0 ? '<circle class="ping" r="9"/>' : ""}<text x="${x > 880 ? -12 : 12}" y="5" text-anchor="${x > 880 ? "end" : "start"}">${l === "ru" ? ru : uz}</text></g>`).join("")}</svg>`;
}

/* ── История при прокрутке ────────────────────────────────────────────── */
function storyBlock(l) {
  const t = T(l);
  const flyIds = ["big", "aero", "kvadro", "maxrelax", "fl-grand", "piramida", "voyvo", "sleeprelax", "strech", "fl-mini"];
  const chapters = [[0, "Enotmebel"], [2.1, t("Форма", "Shakl")], [4.6, t("Внутри", "Ichida")], [9, t("Модели", "Modellar")], [15, t("Ткани", "Matolar")], [18.2, t("Для офиса", "Ofis uchun")], [22.2, t("Доставка", "Yetkazish")], [25.2, t("Выбор", "Tanlov")]];
  const beat = (a, b, k, h, p, extra = "") => `<div class="st-beat" data-beat="${a} ${b}"><span class="kicker" data-line><i></i>${k}</span><h2 data-line>${h}</h2>${p ? `<p data-line>${p}</p>` : ""}${extra}</div>`;
  const offPics = [2, 7, 3, 8];
  const statics = [
    [t("Садитесь как удобно", "Qanday qulay bo‘lsa, shunday o‘tiring"), t("Кресло-мешок подстраивается под тело. Без острых и жёстких углов, легко переставить, просто ухаживать.", "Kreslo-qop tanaga moslashadi. O‘tkir va qattiq burchaklari yo‘q, joyini o‘zgartirish oson, parvarishi oddiy."), `${IMG}/m-big-600.webp`],
    [t("Что внутри", "Ichida nima bor"), t("Наружный чехол из ткани на выбор, внутренний из плащевой ткани и шарики пенополистирола 3-5 мм.", "Tashqi g‘ilof tanlangan matodan, ichkisi plashchevka matodan va 3-5 mm penopolistirol sharchalari."), `${IMG}/m-standart-600.webp`],
    [t("15 моделей", "15 ta model"), t("Груши пяти размеров, Флаундер, Пирамида и Пифагор, кресла Аэро и Квадро, лежаки Max Relax, Sleep Relax и Стреч.", "Besh o‘lchamdagi noklar, Flaunder, Piramida va Pifagor, Aero va Kvadro kreslolari, Max Relax, Sleep Relax va Strech shezlonglari."), `${IMG}/m-aero-600.webp`],
    [t("Для офиса и мероприятий", "Ofis va tadbirlar uchun"), t("Кресла стоят в офисах, на фестивалях и в зонах отдыха.", "Kreslolar ofislarda, festivallarda va dam olish zonalarida turadi."), `${IMG}/g2-520.webp`],
  ];
  return `<section class="story" id="story" data-end="26.2" data-chapters="${esc(JSON.stringify(chapters))}" aria-label="${t("История кресла Enotmebel", "Enotmebel kreslosi hikoyasi")}">
<div class="st-track"><div class="st-stage" id="hero">
<div class="st-layer st-hero" data-k="hero"><div class="st-cam" data-k="heroCam"><img src="${IMG}/hero-2560.webp" srcset="${IMG}/hero-1440.webp 1440w, ${IMG}/hero-2560.webp 2560w" sizes="(max-width: 767px) 260vw, 160vw" alt="${t("Девушка в кресле-груше Enotmebel на фоне сюзане", "Suzana fonida Enotmebel nok-kreslosidagi qiz")}" width="2560" height="1512" fetchpriority="high"></div><div class="st-shade"></div><i class="hs" data-k="hsBag"><b></b><span>${t("Груши · от 450 000 сум", "Noklar · 450 000 so‘m dan")}</span></i></div>

<div class="st-layer st-inside" data-k="inside"><div class="in-box" data-k="inBox"><svg class="in-pear" viewBox="40 40 520 580" aria-hidden="true" focusable="false"><path d="${PEAR}" class="in-out" data-k="inOut" pathLength="1"/><path d="${PEAR_IN}" class="in-in" data-k="inIn" pathLength="1"/></svg><canvas class="in-beads" data-k="beads" aria-hidden="true"></canvas>
<i class="mk mk-r" data-k="mk1" style="left:86%;top:52%"><b>01</b><span>${t("Наружный чехол: ткань на выбор", "Tashqi g‘ilof: mato tanlovda")}</span></i>
<i class="mk mk-l" data-k="mk2" style="left:26%;top:32%"><b>02</b><span>${t("Внутренний чехол из плащевой ткани", "Plashchevka matodan ichki g‘ilof")}</span></i>
<i class="mk mk-r" data-k="mk3" style="left:58%;top:78%"><b>03</b><span>${t("Шарики пенополистирола 3-5 мм", "3-5 mm penopolistirol sharchalari")}</span></i></div>
<div class="spec glass lq" data-k="spec"><p class="spec-k">${t("Наполнители Enotmebel", "Enotmebel to‘ldiruvchilari")}</p>${FILL.map(([n, d]) => `<div class="spec-r"><b>${n[l === "ru" ? 0 : 1]}</b><span>${d[l === "ru" ? 0 : 1]}</span></div>`).join("")}</div></div>

<div class="st-layer st-fly" data-k="fly"><div class="fly-world">${flyIds.map((id, k) => `<figure class="fly-c" data-fly="${k}"><img src="${IMG}/m-${id}-600.webp" srcset="${IMG}/m-${id}-600.webp 600w, ${IMG}/m-${id}-1024.webp 1024w" sizes="(max-width: 767px) 70vw, 34vw" alt="${esc(M[id].n[l === "ru" ? 0 : 1])}" width="1024" height="1536" loading="lazy" decoding="async"><figcaption><b>${M[id].n[l === "ru" ? 0 : 1]}</b><span class="num">${priceOf(l, M[id])}</span></figcaption></figure>`).join("")}</div></div>

<div class="st-layer st-fab" data-k="fab"><div class="fab-row">${FABRICS.map((f, k) => `<div class="fab-c" data-k="fab${k}" style="--h:${[0.92, 0.74, 0.86, 0.66, 0.8][k]}"><div class="fab-win"><div class="fab-st" data-k="fabS${k}">${STORY_SW[f.id].map((c) => `<img data-src="${IMG}/f-${f.id}-${c}-s.webp" alt="" width="280" height="280" decoding="async">`).join("")}</div></div><span class="fab-l"><b>${f.n[l === "ru" ? 0 : 1]}</b><small>${f.d[l === "ru" ? 0 : 1]} · ${SW[f.id].length} ${t("цветов", "rang")}</small></span>${f.wet ? `<em>${ICON.drop}</em>` : ""}</div>`).join("")}</div></div>

<div class="st-layer st-off" data-k="off"><div class="off-frame">${offPics.map((n, k) => `<div class="off-p" data-k="op${k}"><img src="${IMG}/g${n}-960.webp" alt="" width="960" height="1280" loading="lazy" decoding="async"></div>`).join("")}</div>
<div class="logos glass lq" data-k="logos"><p class="spec-k">${t("Среди заказчиков", "Buyurtmachilar orasida")}</p><div>${CLIENTS.map(([f, n]) => `<img src="${IMG}/c-${f}.webp" alt="${n}" width="480" height="291" loading="lazy">`).join("")}</div></div></div>

<div class="st-layer st-map" data-k="map">${mapSvg(l, "map-svg")}
<div class="spec glass lq warr" data-k="warr"><p class="spec-k">${t("Гарантия", "Kafolat")}</p><div class="spec-r"><b>${t("Ремонт бесплатно", "Ta’mir bepul")}</b><span>${t("швы, замки, фурнитура: в нашей мастерской", "choklar, qulflar, furnitura: ustaxonamizda")}</span></div><div class="spec-r"><b>${t("Упаковка", "Qadoq")}</b><span>${t("полиэтилен: без пыли и грязи в дороге", "polietilen: yo‘lda chang va kirsiz")}</span></div></div></div>

<div class="st-layer st-end" data-k="end"><div class="end-in">${logoSvg("end-logo")}<p>${t("15 моделей, 5 тканей, доставка по всему Узбекистану", "15 model, 5 mato, butun O‘zbekiston bo‘ylab yetkazib berish")}</p></div></div>

<div class="st-text">
<div class="st-beat st-first" data-beat="-1 1.7"><span class="kicker" data-line><i></i>${t("Бескаркасная мебель · Ташкент", "Karkassiz mebel · Toshkent")}</span><h1 data-line>${t("Бин-бэги для дома, офиса и отдыха", "Uy, ofis va dam olish uchun bin-beglar")}</h1><p data-line>${t("Мягкие кресла без каркаса: большой выбор форм, тканей и расцветок. Доставка по всему Узбекистану.", "Karkassiz yumshoq kreslolar: shakl, mato va ranglarning katta tanlovi. Butun O‘zbekiston bo‘ylab yetkazib berish.")}</p><div class="cta" data-line>${tgBtn(l, "btn-blue shim", t("Заказать в Telegram", "Telegram orqali buyurtma"), helloText(l))}<a class="btn btn-ghost" href="#katalog">${t("Смотреть модели", "Modellarni ko‘rish")}</a></div></div>
${beat(2.1, 4.5, t("01 · Форма", "01 · Shakl"), t("Садитесь как удобно", "Qanday qulay bo‘lsa, shunday o‘tiring"), t("Кресло-мешок подстраивается под тело. Без острых и жёстких углов, легко переставить, просто ухаживать.", "Kreslo-qop tanaga moslashadi. O‘tkir va qattiq burchaklari yo‘q, joyini o‘zgartirish oson, parvarishi oddiy."))}
${beat(4.8, 6.9, t("02 · Внутри", "02 · Ichida"), t("Два чехла и тысячи шариков", "Ikki g‘ilof va minglab sharchalar"), t("Наружный чехол из ткани на выбор, внутренний из плащевой ткани, внутри шарики пенополистирола 3-5 мм.", "Tashqi g‘ilof tanlangan matodan, ichkisi plashchevka matodan, ichida 3-5 mm penopolistirol sharchalari."))}
${beat(6.9, 9, t("02 · Внутри", "02 · Ichida"), t("Четыре наполнителя", "To‘rtta to‘ldiruvchi"), t("От классических шариков EPS до плотных гранул EPP в премиальных моделях.", "Klassik EPS sharchalaridan premium modellardagi zich EPP granulalarigacha."))}
${beat(9.3, 12, t("03 · Модели", "03 · Modellar"), t("15 моделей", "15 ta model"), t("Груши пяти размеров, Флаундер, Пирамида и Пифагор, кресла Аэро и Квадро, лежаки Max Relax, Sleep Relax и Стреч.", "Besh o‘lchamdagi noklar, Flaunder, Piramida va Pifagor, Aero va Kvadro kreslolari, Max Relax, Sleep Relax va Strech shezlonglari."))}
${beat(12, 14.8, t("03 · Модели", "03 · Modellar"), t("От 450\u00a0000 до 2\u00a0700\u00a0000 сум", "450\u00a0000 dan 2\u00a0700\u00a0000 so‘mgacha"), t("Цена зависит от модели и ткани. Цены всех моделей в каталоге ниже.", "Narx model va matoga bog‘liq. Barcha modellar narxi quyidagi katalogda."))}
${beat(15.3, 18, t("04 · Ткани", "04 · Matolar"), t("Пять тканей, 242 цвета", "Beshta mato, 242 rang"), t("Две из них водоотталкивающие: Polycon и Диагональ. На столбиках настоящие образцы с карт расцветок Enotmebel.", "Ulardan ikkitasi suv o‘tkazmaydi: Polycon va Diagonal. Ustunlarda Enotmebel ranglar kartalaridan haqiqiy namunalar."))}
${beat(18.4, 21.8, t("05 · Для офиса", "05 · Ofis uchun"), t("Офисы, фестивали, зоны отдыха", "Ofislar, festivallar, dam olish zonalari"), t("Кресла Enotmebel стоят у заказчиков по всему городу. Корпоративный заказ считают по количеству.", "Enotmebel kreslolari butun shahar bo‘ylab buyurtmachilarda turibdi. Korporativ buyurtma soniga qarab hisoblanadi."))}
${beat(22.4, 25, t("06 · Доставка", "06 · Yetkazish"), t("По всему Узбекистану", "Butun O‘zbekiston bo‘ylab"), t("Детали доставки обговариваются при заказе. Кресло едет в упаковке, ремонт по гарантии бесплатный.", "Yetkazib berish tafsilotlari buyurtmada kelishiladi. Kreslo qadoqda boradi, kafolat bo‘yicha ta’mir bepul."))}
<div class="st-beat st-last" data-beat="25.3 99"><span class="kicker" data-line><i></i>${t("07 · Выбор", "07 · Tanlov")}</span><h2 data-line>${t("Выберите своё кресло", "O‘z kreslongizni tanlang")}</h2><div class="cta" data-line><a class="btn btn-blue" href="#katalog">${t("Открыть каталог", "Katalogni ochish")}${ICON.arrow}</a>${tgBtn(l, "btn-ghost", t("Спросить в Telegram", "Telegramda so‘rash"), helloText(l))}</div></div>
</div>
<div class="st-hud" aria-hidden="true"><span data-hud>01 · Enotmebel</span><i><b data-bar></b></i></div>
<p class="st-hint" data-k="hint" aria-hidden="true">${t("Листайте", "Aylantiring")}<i></i></p>
</div></div>
<div class="st-static wrap">${statics.map(([h, p, src]) => `<div class="st-s"><img src="${src}" alt="" width="600" height="800" loading="lazy"><div><h2>${h}</h2><p>${p}</p></div></div>`).join("")}</div>
</section>`;
}

function catalogBlock(l) {
  const t = T(l);
  const i = l === "ru" ? 0 : 1;
  const cards = MODELS.map((m, k) => `<article class="mc rv a-${["sink", "rise", "puff"][k % 3]}" style="--d:${(k % 3) * 80}ms" data-g="${m.g}" data-id="${m.id}">
<div class="mc-ph tilt"><span class="spot" aria-hidden="true"></span>${pic(m.id, "", "(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 380px", `${m.n[i]}, ${GROUPS[m.g][i]}`)}<span class="mc-g">${GROUPS[m.g][i]}</span><span class="mc-nas" data-addon="nasiya">${t("Можно частями", "Bo‘lib to‘lash mumkin")}</span></div>
<div class="mc-bd"><h3>${m.n[i]}</h3>${m.note ? `<p class="mc-n">${m.note[i]}</p>` : ""}<p class="mc-p num">${rangeOf(l, m)}</p><p class="mc-f">${(m.fab || ALL5).map((f) => FABRICS.find((x) => x.id === f).n[i]).join(" · ")}</p>
<div class="mc-a">${tgBtn(l, "btn-blue btn-sm", t("Заказать", "Buyurtma"), orderText(l, m))}<button class="btn btn-ghost btn-sm add" type="button" data-add="${m.id}" data-addon="cart">${ICON.plus}<span>${t("В корзину", "Savatga")}</span></button></div></div>
</article>`).join("");
  return `<section id="katalog" class="cat"><div class="wrap">
${head(t("Каталог · 15 моделей", "Katalog · 15 ta model"), t("Модели и цены", "Modellar va narxlar"), t("Цены с сайта enotmebel.uz. Диапазон зависит от ткани, точную цену менеджер назовёт в Telegram.", "Narxlar enotmebel.uz saytidan. Oraliq matoga bog‘liq, aniq narxni menejer Telegramda aytadi."))}
<div class="chips" role="group" aria-label="${t("Форма", "Shakl")}"><button class="chip" type="button" data-f="" aria-pressed="true">${t("Все", "Barchasi")}</button>${Object.entries(GROUPS).map(([g, n]) => `<button class="chip" type="button" data-f="${g}" aria-pressed="false">${n[i]}</button>`).join("")}<span class="chips-n num" id="cat-n" aria-live="polite"></span></div>
<div class="mgrid" id="mgrid">${cards}</div>
</div></section>`;
}

function sizeBlock(l) {
  const t = T(l);
  return `<section id="razmer" data-addon="size" class="size"><div class="wrap">
${head(t("Подбор размера", "O‘lcham tanlash"), t("Какая груша по росту", "Bo‘yga qarab qaysi nok"), t("На сайте Enotmebel сказано: MINI для роста до 110 см, BIG до 180 см. Подвиньте рост, и мы подскажем, с какой начать.", "Enotmebel saytida aytilgan: MINI 110 sm gacha, BIG 180 sm gacha bo‘y uchun. Bo‘yni suring, qaysi biridan boshlashni aytamiz."), ours(l))}
<div class="size-box rv a-rise">
<div class="size-l"><label class="size-r"><span>${t("Рост", "Bo‘y")}: <b class="num" id="sz-v">170</b> ${t("см", "sm")}</span><input id="sz" type="range" min="90" max="200" step="1" value="170" aria-describedby="sz-out"></label>
<div class="size-scale" aria-hidden="true"><span>90</span><span>110</span><span>140</span><span>180</span><span>200</span></div>
<p class="size-out" id="sz-out" role="status"></p>
<div class="cta">${tgBtn(l, "btn-blue", t("Спросить про размер", "O‘lcham haqida so‘rash"), "")}</div></div>
<div class="size-pv" aria-hidden="true"><div class="sz-man" id="sz-man"><svg viewBox="0 0 60 200"><circle cx="30" cy="14" r="11"/><path d="M30 28v84M30 44 8 84M30 44l22 40M30 112l-16 82M30 112l16 82" stroke-width="9" stroke-linecap="round" fill="none"/></svg></div>${["mini", "big", "gigant"].map((id) => `<figure class="sz-bag" data-sz="${id}"><img src="${IMG}/m-${id}-600.webp" alt="" width="600" height="900" loading="lazy"><figcaption>${M[id].n[l === "ru" ? 0 : 1]}</figcaption></figure>`).join("")}</div>
</div></div></section>`;
}

function fabricBlock(l) {
  const t = T(l);
  const i = l === "ru" ? 0 : 1;
  const D0 = { f: "diagonal", fab: FABRICS.find((f) => f.id === "diagonal"), c: SW.diagonal.find((x) => x[0] === "540") };
  return `<section id="tkani" class="fab dark"><div class="wrap">
${head(t("Ткани и цвет", "Matolar va rang"), t("Выберите ткань и цвет", "Mato va rangni tanlang"), t("Пять тканей и 242 цвета с карт расцветок Enotmebel. Выберите ткань и цвет: номер образца уйдёт в сообщение менеджеру.", "Enotmebel ranglar kartalaridan beshta mato va 242 rang. Mato va rangni tanlang: namuna raqami menejerga xabarda ketadi."), `<span data-addon="fabric">${ours(l)}</span>`)}
<div class="try" data-addon="fabric">
<div class="try-pv rv a-puff"><figure class="sw-big"><img id="sw-img" src="${IMG}/f-${D0.f}-${D0.c[0]}.webp" width="${D0.c[1]}" height="${D0.c[2]}" style="max-width:${D0.c[1]}px" alt="${esc(`${D0.fab.n[i]}, ${D0.fab.card} ${D0.c[0]}`)}"></figure><p class="try-lbl"><b id="try-fab">${D0.fab.n[i]}</b> · <span id="try-col">${D0.fab.card} ${D0.c[0]}</span></p><p class="src">${t("Фото образца с карты расцветок Enotmebel, без обработки.", "Namuna fotosi Enotmebel ranglar kartasidan, ishlovsiz.")}</p></div>
<div class="try-ctl">
<fieldset><legend>${t("Ткань", "Mato")}</legend><div class="try-fabs">${FABRICS.map((f) => `<label class="fb"><input type="radio" name="fab" value="${f.id}"${f.id === D0.f ? " checked" : ""}><img src="${IMG}/f-${f.id}-${STORY_SW[f.id][0]}-c.webp" alt="" width="150" height="150" loading="lazy"><span><b>${f.n[i]}</b><small>${f.d[i]} · ${SW[f.id].length} ${t("цветов", "rang")}</small></span>${f.wet ? `<em aria-label="${t("водоотталкивающая", "suv o‘tkazmaydi")}">${ICON.drop}</em>` : ""}</label>`).join("")}</div></fieldset>
<fieldset><legend>${t("Цвет", "Rang")} · <span id="sw-n">${SW[D0.f].length}</span></legend>${FABRICS.map((f) => `<div class="sw-grid" data-fab="${f.id}"${f.id === D0.f ? "" : " hidden"}>${SW[f.id].map(([c, w, h], k) => `<label class="swc${k >= SW_SHOW ? " sw-x" : ""}"><input type="radio" name="col" value="${c}" data-w="${w}" data-h="${h}"${f.id === D0.f && c === D0.c[0] ? " checked" : ""}><img data-src="${IMG}/f-${f.id}-${c}-c.webp" alt="" width="150" height="150" decoding="async"><span>${c}</span></label>`).join("")}${SW[f.id].length > SW_SHOW ? `<button type="button" class="sw-more">${t("Ещё", "Yana")} ${SW[f.id].length - SW_SHOW} ${t(colorsRu(SW[f.id].length - SW_SHOW), "ta rang")}</button>` : ""}</div>`).join("")}</fieldset>
<label class="field"><span>${t("Модель", "Model")}</span><select id="try-m">${MODELS.map((m) => `<option value="${m.id}">${m.n[i]}</option>`).join("")}</select></label>
<div class="cta"><button class="btn btn-white" type="button" id="try-send">${ICON.tg}${t("Отправить выбор в Telegram", "Tanlovni Telegramga yuborish")}</button></div>
<p class="note-ok" id="try-done" role="status" hidden></p>
</div></div>
<div class="fill-list">${FILL.map(([n, d], k) => `<div class="fl rv a-rise" style="--d:${k * 80}ms"><b>${n[i]}</b><span>${d[i]}</span></div>`).join("")}</div>
</div></section>`;
}

function officeBlock(l) {
  const t = T(l);
  return `<section id="ofis" class="off"><div class="wrap">
${head(t("Офисы и мероприятия", "Ofislar va tadbirlar"), t("Кресла для офиса, кафе и событий", "Ofis, kafe va tadbirlar uchun kreslolar"), t("Снимки из галереи Enotmebel: офисы, фестивали, зоны отдыха.", "Enotmebel galereyasidan suratlar: ofislar, festivallar, dam olish zonalari."))}
</div>
<div class="gal" aria-label="${t("Галерея", "Galereya")}"><div class="gal-row">${[...GAL, ...GAL].map((g, k) => `<figure${k >= GAL.length ? ' aria-hidden="true"' : ""}><img src="${IMG}/g${g.n}-520.webp" srcset="${IMG}/g${g.n}-520.webp 520w, ${IMG}/g${g.n}-960.webp 960w" sizes="260px" alt="${k >= GAL.length ? "" : esc(g[l])}" width="520" height="693" loading="lazy" decoding="async"><figcaption>${g[l]}</figcaption></figure>`).join("")}</div></div>
<div class="wrap">
<div class="mq" aria-label="${t("Среди заказчиков", "Buyurtmachilar orasida")}"><div class="mq-row">${[...CLIENTS, ...CLIENTS].map(([f, n], k) => `<img src="${IMG}/c-${f}.webp" alt="${k >= CLIENTS.length ? "" : n}" width="240" height="146" loading="lazy"${k >= CLIENTS.length ? ' aria-hidden="true"' : ""}>`).join("")}</div></div>
<form class="b2b glass-l rv a-rise" id="b2b" data-addon="b2b" novalidate>
<div class="b2b-h"><h3>${t("Корпоративный заказ", "Korporativ buyurtma")}</h3>${ours(l)}<p class="sub">${t("Количество, дата и город: менеджер посчитает комплект и доставку.", "Soni, sana va shahar: menejer to‘plam va yetkazib berishni hisoblaydi.")}</p></div>
<div class="b2b-f">
<fieldset class="field"><legend>${t("Для кого", "Kim uchun")}</legend><div class="seg">${[t("Офис", "Ofis"), t("Кафе", "Kafe"), t("Мероприятие", "Tadbir"), t("Школа, садик", "Maktab, bog‘cha")].map((x, k) => `<label><input type="radio" name="who" value="${x}"${k === 0 ? " checked" : ""}><span>${x}</span></label>`).join("")}</div></fieldset>
<label class="field"><span>${t("Сколько кресел", "Nechta kreslo")}</span><input name="qty" type="number" min="2" inputmode="numeric" placeholder="10"></label>
<label class="field"><span>${t("Когда нужно", "Qachon kerak")}</span><input name="when" type="text" placeholder="${t("к 1 ноября", "1-noyabrgacha")}"></label>
<label class="field"><span>${t("Город", "Shahar")}</span><input name="city" type="text" placeholder="${t("Ташкент", "Toshkent")}"></label>
<label class="field"><span>${t("Компания или имя", "Kompaniya yoki ism")}</span><input name="name" type="text" autocomplete="organization"></label>
<label class="field"><span>${t("Телефон", "Telefon")}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998"></label>
<button class="btn btn-blue" type="submit">${ICON.tg}${t("Отправить в Telegram", "Telegramga yuborish")}</button>
<p class="err" id="b2b-err" role="alert" hidden></p><p class="note-ok" id="b2b-done" role="status" hidden></p>
</div></form>
</div></section>`;
}

function careBlock(l) {
  const t = T(l);
  const items = [
    [ICON.tool, t("Гарантия на швы, замки и фурнитуру", "Choklar, qulflar va furnituraga kafolat"), t("Разошёлся шов, сломался замок или фурнитура: ремонт бесплатный в мастерской Enotmebel. Просто привезите кресло.", "Chok so‘kilsa, qulf yoki furnitura buzilsa: Enotmebel ustaxonasida ta’mir bepul. Kresloni olib keling, xolos.")],
    [ICON.shield, t("Что гарантия не покрывает", "Kafolat nimani qoplamaydi"), t("Разрывы не по шву, износ ткани, механические повреждения, последствия стирки и химчистки, наполнитель.", "Chokdan tashqari yirtilish, mato eskirishi, mexanik shikast, yuvish va kimyoviy tozalash oqibatlari, to‘ldiruvchi.")],
    [ICON.soft, t("Наполнитель оседает, это нормально", "To‘ldiruvchi cho‘kadi, bu odatiy"), t("Оседание наполнителя: естественный процесс, не брак. Обычно от 6 месяцев до 3 лет, смотря как часто сидят.", "To‘ldiruvchining cho‘kishi tabiiy jarayon, nuqson emas. Odatda 6 oydan 3 yilgacha, qanchalik tez-tez o‘tirishga qarab.")],
    [ICON.truck, t("Доставка по всему Узбекистану", "Butun O‘zbekiston bo‘ylab yetkazib berish"), t("Все детали обговариваются при заказе. Кресло едет в полиэтиленовой упаковке, без пыли и грязи.", "Barcha tafsilotlar buyurtmada kelishiladi. Kreslo polietilen qadoqda, changsiz va kirsiz boradi.")],
  ];
  return `<section id="garantiya" class="care"><div class="wrap">
${head(t("Гарантия и доставка", "Kafolat va yetkazib berish"), t("Что будет после покупки", "Xariddan keyin nima bo‘ladi"), "")}
<div class="acc">${items.map(([ic, h, p], k) => `<details class="rv a-rise" style="--d:${k * 70}ms"${k === 0 ? " open" : ""}><summary>${ic}<b>${h}</b><i aria-hidden="true">${ICON.plus}</i></summary><p>${p}</p></details>`).join("")}</div>
</div></section>`;
}

function showroomBlock(l) {
  const t = T(l);
  const text = t("Здравствуйте! Хочу прийти в шоурум Enotmebel и посмотреть ткани. Когда можно?", "Assalomu alaykum! Enotmebel shourumiga kelib, matolarni ko‘rmoqchiman. Qachon mumkin?");
  return `<section id="shourum" class="show dark"><div class="show-bg" aria-hidden="true"><img src="${IMG}/g6-960.webp" alt="" width="960" height="1280" loading="lazy" data-depth="1"></div><div class="wrap show-in">
<div class="rv a-rise"><span class="kicker"><i></i>${t("Офис и шоурум", "Ofis va shourum")}</span><h2>${t("Потрогайте ткань до покупки", "Xariddan oldin matoni ushlab ko‘ring")}</h2><p class="lead">${F.show[l]}. ${t("Посещение только по записи: напишите, и вам назовут время.", "Faqat oldindan yozilib: yozing, sizga vaqt aytishadi.")}</p>
<div class="cta">${tgBtn(l, "btn-white", t("Записаться в шоурум", "Shourumga yozilish"), text)}<a class="btn btn-ghost" href="tel:${F.phone}">${ICON.phone}${F.phoneT}</a></div>
<ul class="show-l"><li>${ICON.pin}<a href="${MAP}">${t("Открыть на карте", "Xaritada ochish")}</a></li><li>${ICON.tg}<a href="${F.tg}">${F.tgAt}</a></li><li>${ICON.ig}<a href="${F.ig}">Instagram</a></li><li>${ICON.yt}<a href="${F.yt}">YouTube</a></li></ul></div>
</div></section>`;
}

/* ── Главная ──────────────────────────────────────────────────────────── */
function home(l) {
  const t = T(l);
  const body = `${storyBlock(l)}
${catalogBlock(l)}
${sizeBlock(l)}
${fabricBlock(l)}
${officeBlock(l)}
${careBlock(l)}
${showroomBlock(l)}`;
  return shell(l, "", {
    title: t("Enotmebel: бин-бэги и кресла-мешки в Ташкенте", "Enotmebel: Toshkentda bin-beglar va kreslo-qoplar"),
    desc: t("Бескаркасная мебель для дома, офиса и отдыха: 15 моделей от 450 000 сум, пять тканей, доставка по всему Узбекистану.", "Uy, ofis va dam olish uchun karkassiz mebel: 450 000 so‘mdan 15 model, beshta mato, butun O‘zbekiston bo‘ylab yetkazib berish."),
  }, body);
}

/* ── Что дальше: было и стало, конструктор, конкуренты, фото ──────────── */
function plan(l) {
  const t = T(l);
  const ba = (o, n, cap, was) => `<figure class="rv a-rise"><div class="ba-box" data-ba><img src="${IMG}/${n}" alt="${t("Прототип", "Prototip")}" loading="lazy"><div class="was"><img src="${IMG}/${o}" alt="${t("Сайт сегодня", "Bugungi sayt")}" loading="lazy"></div><span class="tag a">${t("было", "edi")}</span><span class="tag b">${t("стало", "bo‘ldi")}</span><span class="knob"><i>${ICON.arrows}</i></span><input type="range" min="0" max="100" value="50" aria-label="${t("Сравнить", "Solishtirish")}"></div><figcaption><span>${cap}</span><span>${was}</span></figcaption></figure>`;
  const comp = [
    [t("Цена на карточке, а не «по запросу»", "Narx kartochkada, «so‘rov bo‘yicha» emas"), t("Лучшие мебельные сайты Узбекистана показывают цену сразу. У вас она есть: мы подняли её на карточку и в историю.", "O‘zbekistonning eng yaxshi mebel saytlari narxni darhol ko‘rsatadi. Sizda u bor: biz uni kartochkaga va hikoyaga chiqardik.")],
    [t("Рассрочка на виду", "Muddatli to‘lov ko‘rinib turadi"), t("Uzum Nasiya и Alif у крупных магазинов мебели стоят прямо на карточке. Кресло за 2 700 000 сум проще купить частями.", "Yirik mebel do‘konlarida Uzum Nasiya va Alif to‘g‘ridan-to‘g‘ri kartochkada. 2 700 000 so‘mlik kresloni bo‘lib olish osonroq.")],
    [t("Все 242 цвета на сайте", "Saytda barcha 242 rang"), t("Карты расцветок были картинкой без выбора. Теперь каждый образец можно открыть крупно, и его номер уходит в заказ.", "Ranglar kartalari tanlovsiz rasm edi. Endi har bir namunani katta ochish mumkin, uning raqami esa buyurtmaga ketadi.")],
    [t("Заказ в один шаг", "Bir qadamda buyurtma"), t("Вместо формы с корзиной WooCommerce: кнопка открывает ваш Telegram с готовым текстом.", "WooCommerce savatli forma o‘rniga: tugma tayyor matn bilan Telegramingizni ochadi.")],
    [t("Офисам отдельно", "Ofislarga alohida"), t("Корпоративные заказы дают большие чеки. У вас есть Carlsberg и IT Park: теперь у них есть своя форма.", "Korporativ buyurtmalar katta chek beradi. Sizda Carlsberg va IT Park bor: endi ularning o‘z formasi bor.")],
    [t("Шоурум по записи", "Oldindan yozilib shourum"), t("Ткань хочется потрогать. Запись в шоурум стала кнопкой, а не строкой мелким шрифтом в подвале.", "Matoni ushlab ko‘rgingiz keladi. Shourumga yozilish podvaldagi mayda qator emas, tugmaga aylandi.")],
  ];
  const body = `<section class="phead"><div class="wrap"><span class="kicker"><i></i>${t("Предложение DevUz Studio для Enotmebel", "DevUz Studio’ning Enotmebel uchun taklifi")}</span><h1>${t("Было и стало", "Edi va bo‘ldi")}</h1><p class="lead">${t("Слева enotmebel.uz сегодня, справа этот прототип. Тяните шторку.", "Chapda bugungi enotmebel.uz, o‘ngda shu prototip. Pardani torting.")}</p></div></section>
<section style="padding-top:0"><div class="wrap">
<div class="ba">
${ba("ba-old-d.webp", "ba-new-d.webp", t("Компьютер · первый экран", "Kompyuter · birinchi ekran"), t("было: серый экран и одна кнопка", "edi: kulrang ekran va bitta tugma"))}
${ba("ba-old-m.webp", "ba-new-m.webp", t("Телефон · первый экран", "Telefon · birinchi ekran"), t("было: фото уехало под текст", "edi: foto matn ostiga tushib qolgan"))}
</div>
</div></section>
<section id="konstruktor" style="padding-top:0"><div class="wrap">
${head(t("Конструктор проекта", "Loyiha konstruktori"), t("Соберите сайт под свой бюджет", "Saytni byudjetingizga moslab yig‘ing"), t("Сайт стоит 1 700 $. Остальное включается тумблером: включили блок, и он появляется на главной, итог пересчитывается. Со всеми допами 2 500 $.", "Sayt 1 700 $ turadi. Qolgani tumbler bilan yoqiladi: blokni yoqsangiz, u bosh sahifada paydo bo‘ladi, jami qayta hisoblanadi. Barcha qo‘shimchalar bilan 2 500 $."))}
<div class="kit">
<div class="kit-list">
<div class="kit-base"><div><b>${KIT_BASE[l].t}</b><p>${KIT_BASE[l].d}</p></div><span class="kit-price num">${usd(KIT_BASE.price)}</span></div>
<h3 class="kit-g">${t("Допы на сайте", "Saytdagi qo‘shimchalar")}</h3>
${ADDONS.map((a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="${(a.needs || []).join(" ")}" data-def checked><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}</b><small>${a[l].e}</small></span><span class="kit-price num">${usd(a.price)}</span></label>`).join("")}
<h3 class="kit-g">${t("Сверх сайта", "Saytdan tashqari")}</h3>
${BLOCKS.map((b) => `<label class="kit-row"><input type="checkbox" data-k="${b.id}" data-p="${b.price}" data-needs="" data-def checked><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${b[l].t}</b><small>${b[l].why}</small><span class="kit-li">${b[l].li.map((x) => `<em>${x}</em>`).join("")}</span></span><span class="kit-price num">${usd(b.price)}</span></label>`).join("")}
</div>
<div class="kit-side">
<div class="kit-total"><small>${t("Итого с сайтом", "Sayt bilan jami")}</small><b class="num" id="kit-sum"></b><small id="kit-n"></small><a class="btn btn-white" href="https://t.me/Devuz_studio_bot?start=enotmebel">${ICON.tg}${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</a></div>
<p class="src">${t("Цены по середине рынка Ташкента: интернет-магазин на 15 моделей у студий стоит примерно от 1 000 до 3 500 $.", "Narxlar Toshkent bozorining o‘rtasi bo‘yicha: studiyalarda 15 modelli internet-do‘kon taxminan 1 000 dan 3 500 $ gacha turadi.")}</p>
</div>
</div>
</div></section>
<section id="konkurenty" style="padding-top:0"><div class="wrap">
${head(t("Что взяли у конкурентов", "Raqobatchilardan nima oldik"), t("Сильное у мебельщиков Узбекистана", "O‘zbekiston mebelchilarining kuchli tomonlari"), "")}
<div class="grid3">${comp.map(([h, p], k) => `<div class="note rv a-rise" style="--d:${(k % 3) * 80}ms"><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>
<section id="foto"><div class="wrap">
${head(t("Изображения в прототипе", "Prototipdagi rasmlar"), t("Откуда снимки", "Suratlar qayerdan"), "")}
<ul class="credits"><li>${t("Фото моделей, первого экрана, галереи и логотипы клиентов взяты с enotmebel.uz, со знаком Enotmebel. Мы ничего не дорисовывали и не увеличивали.", "Modellar, birinchi ekran, galereya fotolari va mijozlar logotiplari enotmebel.uz’dan, Enotmebel belgisi bilan olingan. Biz hech narsa chizmadik va kattalashtirmadik.")}</li><li>${t("Логотип Enotmebel перерисован в вектор по файлу с их сайта.", "Enotmebel logotipi ularning saytidagi fayl bo‘yicha vektorga qayta chizildi.")}</li><li>${t("Ткани: карты расцветок со страницы «Ткани» на enotmebel.uz, каждый образец вырезан как есть. Кресло в разрезе, шарики и схема доставки нарисованы кодом. Контур Узбекистана: Natural Earth, общественное достояние.", "Matolar: enotmebel.uz’dagi «Matolar» sahifasidagi ranglar kartalari, har bir namuna o‘zgarishsiz kesib olingan. Kesimdagi kreslo, sharchalar va yetkazish sxemasi kod bilan chizilgan. O‘zbekiston konturi: Natural Earth, jamoat mulki.")}</li><li>${t("Анимации по мотивам компонентов с 21st.dev под MIT: Magic UI (Marquee, Shimmer Button, Border Beam, Magic Card), motion-primitives (Tilt, Accordion), Magic UI (Border Beam). Код свой.", "Animatsiyalar 21st.dev’dagi MIT komponentlari asosida: Magic UI (Marquee, Shimmer Button, Border Beam, Magic Card), motion-primitives (Tilt, Accordion), Magic UI (Border Beam). Kod o‘zimizniki.")}</li></ul>
</div></section>`;
  return shell(l, "plan", {
    title: t("Что дальше: было и стало, конструктор сайта | Enotmebel", "Keyingi qadam: edi va bo‘ldi, sayt konstruktori | Enotmebel"),
    desc: t("Было и стало: enotmebel.uz сегодня и прототип. Конструктор: сайт 1 700 $, со всеми допами 2 500 $.", "Edi va bo‘ldi: bugungi enotmebel.uz va prototip. Konstruktor: sayt 1 700 $, barcha qo‘shimchalar bilan 2 500 $."),
  }, body);
}

const BUILD = { "": home, plan };
const out = {};
for (const l of ["ru", "uz"]) {
  const pre = l === "uz" ? "uz" : "";
  for (const p of ["", "plan"]) out[pre ? pre + (p ? "/" + p : "") : p] = BUILD[p](l);
}
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/*
 * Сборка для сервера (lib/proto/bundles): общие куски — стили и главный
 * скрипт — один раз, в страницах вместо них метка @@имя@@.
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
writeFileSync(bundleDir + "enotmebel.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(main)").padEnd(10), v.length);
