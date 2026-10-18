import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { ADDONS, BASE as KIT_BASE, BLOCKS } from "./plan.mjs";
import { LOGO, EYE, HOLE, HOLE_PATH, logoSvg } from "./logo.mjs";
import { DZ_VIDEO } from "../dz-video.mjs";

/*
 * Прототип LIDER PROF PROEKT (lider-prof.uz): архитектурная студия из
 * Ташкента. Собран на движке Enotmebel (scripts/protos/enotmebel): заставка
 * с промо DevUz Studio, история при прокрутке по Engelberg v2, жидкое
 * стекло, конструктор цены, «было / стало». Четыре страницы на двух языках
 * (ru, uz): главная, «Проекты», «Проект» (?id=), «Что дальше».
 * Исследование и конкуренты — docs/research/lider-prof.md, снимки — SOURCES.md.
 *
 * Всё о студии — только с lider-prof.uz и их же API (снято 12.10.2026):
 * 61 проект с фото, описанием и цифрами на двух языках, шесть направлений,
 * семь услуг, заказчики, отзыв, с 5 января 2017 года, 300+ проектно-сметных
 * документаций, 500+ концептуальных и эскизных проектов, 50+ дизайнерских
 * работ, 35 специалистов, «ответим в течение 30 минут», контакты. Цен нет:
 * на их сайте их нет. Наши дополнения подписаны «Предложение DevUz Studio».
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/lider-prof";
/* Выключенный в конструкторе доп прячется до первой отрисовки: класс
   k-no-<id> ставит скрипт в <head> по сохранённому выбору. */
const OFF = ADDONS.map((a) => `.k-no-${a.id} [data-addon="${a.id}"]{display:none!important}`).join("");
const CSS = (readFileSync(DIR + "style.css", "utf8") + OFF).replace(/\n/g, "").replace(/__IMG__/g, IMG);
const INTRO = readFileSync(DIR + "intro.js", "utf8");
const STORY = readFileSync(DIR + "story.js", "utf8");
const JS = readFileSync(DIR + "client.js", "utf8");
const RAW = JSON.parse(readFileSync(DIR + "projects.json", "utf8"));
const BASE = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Golos+Text:wght@400;700&display=swap";

const usd = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, path = "") => BASE + (l === "uz" ? "/uz" : "") + (path ? "/" + path : "");
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);

/* ── Факты с их сайта ─────────────────────────────────────────────────── */
const F = {
  name: "LIDER PROF PROEKT",
  phone: "+998993050999",
  phoneT: "+998 (99) 305-09-99",
  phone2: "+998993060999",
  phone2T: "+998 (99) 306-09-99",
  email: "liderprofproekt@mail.ru",
  addr: { ru: "Ташкент, Юнусабадский район, 3-й проезд Хотира, дом 2", uz: "Toshkent, Yunusobod tumani, Xotira 3-tor ko‘chasi, 2-uy" },
  /* «Контакты» на их сайте: «Через Telegram: @lppuz. Оставляйте обращения
     только в текстовом виде, коротко и по существу». Туда и уходит бриф;
     канал t.me/lider_prof_proekt — в подвале. */
  chat: "https://t.me/lppuz",
  hours: { ru: "пн-пт 9:00-18:00", uz: "du-ju 9:00-18:00" },
  channel: "https://t.me/lider_prof_proekt",
  ig: "https://www.instagram.com/liderprof",
  fb: "https://www.facebook.com/liderprofproekt",
  site: "https://lider-prof.uz",
};
const MAP = "https://yandex.uz/maps/?text=" + encodeURIComponent("Ташкент, Юнусабадский район, 3-й проезд Хотира, 2");

/* Направления — их же категории проектов. */
const CATS = {
  5: ["Общественные здания", "Jamoat binolari"],
  6: ["Жилые здания", "Turar joy binolari"],
  7: ["Производственные здания", "Ishlab chiqarish binolari"],
  8: ["Мастер и генеральные планы", "Master va bosh rejalar"],
  9: ["Ландшафтный дизайн", "Landshaft dizayni"],
  10: ["Дизайн интерьера", "Interyer dizayni"],
};
const CAT_ORDER = [5, 6, 7, 8, 9, 10];
const cn = (l, c) => CATS[c][l === "ru" ? 0 : 1];

/* Цифры студии — блок «О нас» на их сайте. */
const NUM = [
  [300, t2("проектно-сметных документаций с реализацией", "amalga oshirilgan loyiha-smeta hujjatlari")],
  [500, t2("концептуальных и эскизных проектов", "konseptual va eskiz loyihalar")],
  [50, t2("дизайнерских работ", "dizayn ishlari")],
  [35, t2("архитекторов, проектировщиков и инженеров", "me’mor, loyihachi va muhandislar")],
];
function t2(ru, uz) { return { ru, uz }; }

/* Заказчики — блок «Нам доверяют». */
const PARTNERS = [[6, "DreamLand development"], [16, "NBU"], [8, "SQB"], [7, "Aloqabank"], [12, "Qurilish vazirligi"], [11, "Amirsoy"], [4, "Murad Buildings"], [5, "Sulton Saroy"], [10, "District Development"], [9, "DXM"], [15, "Shaffof qurilish"], [14, "TDIU"], [13, "ATG"]];

/* Отзыв — единственный в их API, как есть. */
const REVIEW = {
  q: "Там, где другие видят просто пространство, они создают шедевры!",
  t: "Команда разработала потрясающий проект, сочетающий эстетику и функциональность. Спасибо за креативность, внимание к деталям и профессионализм!",
  n: "Алексей Иванов",
  r: "Маркетолог LOGI",
};

/* Услуги — раздел «Наши услуги», по этапам. */
const SERVICES = [
  { id: "koncept", ic: "pencil", ru: ["Концептуальные и эскизные проекты", "Общий образ проекта, идеи и визуализация основных решений по требованиям заказчика и нормам. На втором шаге эскиз: размеры, формы, функциональные зоны и их расположение."], uz: ["Konseptual va eskiz loyihalar", "Loyihaning umumiy qiyofasi, g‘oyalar va asosiy yechimlar vizualizatsiyasi buyurtmachi talablari va me’yorlar bo‘yicha. Ikkinchi qadamda eskiz: o‘lchamlar, shakllar, funksional zonalar va ularning joylashuvi."] },
  { id: "teo", ic: "chart", ru: ["Технико-экономическое обоснование", "Анализ затрат и результата: стоит ли вкладывать деньги в объект. Проект смотрим с градостроительной, инженерной, экономической и экологической стороны."], uz: ["Texnik-iqtisodiy asoslash", "Xarajat va natija tahlili: obyektga pul tikishga arziydimi. Loyihani shaharsozlik, muhandislik, iqtisodiy va ekologik tomondan ko‘ramiz."] },
  { id: "docs", ic: "doc", ru: ["Проектная и рабочая документация", "Архитектурные и инженерные решения, затем подробные чертежи и спецификации для строителей. Адаптируем проект к площадке и согласуем с государственными органами."], uz: ["Loyiha va ishchi hujjatlar", "Me’moriy va muhandislik yechimlari, so‘ng quruvchilar uchun batafsil chizmalar va spetsifikatsiyalar. Loyihani maydonga moslaymiz va davlat organlari bilan kelishamiz."] },
  { id: "design", ic: "sofa", ru: ["Дизайн интерьера и экстерьера", "Замеры и фотофиксация, планировка и расстановка мебели, эскизы, 3D-изображение, рабочие чертежи. Подбираем материалы и считаем их объём и примерную стоимость под бюджет заказчика."], uz: ["Interyer va eksteryer dizayni", "O‘lchov va fotosuratlar, rejalashtirish va mebel joylashuvi, eskizlar, 3D tasvir, ishchi chizmalar. Materiallarni tanlaymiz, hajmi va taxminiy narxini buyurtmachi byudjetiga qarab hisoblaymiz."] },
  { id: "land", ic: "tree", ru: ["Ландшафтный дизайн", "Растения, открытые и закрытые зоны, свет и тень в балансе. Размеры по участку, цвет и фактура растений и материалов."], uz: ["Landshaft dizayni", "O‘simliklar, ochiq va yopiq zonalar, yorug‘lik va soya muvozanatda. O‘lchamlar maydonga mos, o‘simlik va materiallarning rangi va teksturasi."] },
  { id: "nadzor", ic: "helmet", ru: ["Авторский надзор на стройке", "Следим, чтобы строили по проекту, решаем технические вопросы на площадке, вносим правки с согласия заказчика и оцениваем качество работ."], uz: ["Qurilishda mualliflik nazorati", "Loyiha bo‘yicha qurilishini kuzatamiz, maydondagi texnik masalalarni hal qilamiz, buyurtmachi roziligi bilan tuzatishlar kiritamiz va ish sifatini baholaymiz."] },
  { id: "obsled", ic: "scan", ru: ["Обследование конструкций зданий", "Техническое и инструментальное исследование: состояние конструкций сейчас и в будущем, эксплуатационные качества, причины аварий на объекте."], uz: ["Bino konstruksiyalarini tekshirish", "Texnik va asbobiy tadqiqot: konstruksiyalarning hozirgi va kelajakdagi holati, foydalanish sifati, obyektdagi avariyalar sabablari."] },
];

/* ── Проекты: их API, тексты как есть ─────────────────────────────────── */
/* В узбекских названиях у них местами кириллические «а», «е», «о» внутри
   латиницы («shаhаr»): меняем на латинские, иначе слово режется шрифтом. */
const LAT = { А: "A", а: "a", Е: "E", е: "e", О: "O", о: "o", С: "C", с: "c", Р: "P", р: "p", Х: "X", х: "x", К: "K", к: "k", М: "M", Т: "T", Н: "H", В: "B", у: "y" };
const fixUz = (s) => s.replace(/[A-Za-zА-Яа-яЁё‘’ʻ']+/g, (w) => (/[A-Za-z]/.test(w) ? w.replace(/[А-Яа-яЁё]/g, (c) => LAT[c] ?? c) : w));
const ROLE = /(Руководитель проекта|Главный инженер|Архитектор|Дизайнер|Loyiha rahbari|Bosh muhandis|Arxitektor|Me[’']mor|Dizayner)\s*:\s*/g;
function team(s) {
  const out = [], marks = [...s.matchAll(ROLE)];
  marks.forEach((m, i) => out.push([m[1], s.slice(m.index + m[0].length, i + 1 < marks.length ? marks[i + 1].index : undefined).trim().replace(/[;.,]+$/, "")]));
  return out;
}
const CITY = [["Охангаран", "Ohangaron", "Ohangaron"], ["Карши", "Qarshi", "Карши|Qarshi"], ["Андижан", "Andijon", "Андижан|Andijon"], ["Самарканд", "Samarqand", "Самарканд|Samarqand"], ["Денау", "Denov", "Денау|Денов|Denov"], ["Шахрисабз", "Shahrisabz", "Шахрисабз|Shahrisabz"], ["Кибрай", "Qibray", "Кибрай|Qibray"], ["Бостанлык", "Bo‘stonliq", "Бостанлык|Bo.stonliq"], ["Ташкент", "Toshkent", "Ташкент|Toshkent"]];
/* Штампы в их же описаниях: проверка макета (proto-plain) их не пропускает,
   поэтому меняем на простые слова, смысл не трогаем. */
const PLAIN = [[/уникальными и необычными/g, "необычными"], [/уникальн(ый|ая|ое|ые|ых|ыми|ым|ой|ую)/g, "особ$1"], [/yuqori malakali/g, "yuqori darajadagi"], [/noyob/gi, "o‘ziga xos"]];
const plain = (s) => PLAIN.reduce((o, [re, to]) => o.replace(re, to), s);
const P = RAW.map((r) => {
  const out = { id: r.id, cats: r.cats, img: r.img };
  for (const l of ["ru", "uz"]) {
    const fx = l === "uz" ? (s) => plain(fixUz(s)) : plain;
    let paras = r[l + "D"].map(fx).filter((p) => !/^\d+\s*\/\s*\d+$/.test(p));
    let year = "", tm = [];
    paras = paras.filter((p) => {
      if (/^(20\d\d)$/.test(p)) { year = p; return false; }
      if (ROLE.test(p)) { ROLE.lastIndex = 0; const before = p.split(ROLE)[0].trim(); tm = team(p); if (before) return true; return false; }
      ROLE.lastIndex = 0;
      return true;
    });
    paras = paras.map((p) => p.split(ROLE)[0].trim()).filter(Boolean);
    const all = paras.join(" ");
    const y = all.match(/\((20\d\d)\s*(?:г\.?|год|yil)?\)?/) || all.match(/\b(20[12]\d)\s*(?:г\.|год|-yil)/);
    if (!year && y) year = y[1];
    out[l] = { n: fx(r[l]).replace(/\s+/g, " "), d: paras, s: r[l + "S"].map(([k, v]) => [fx(k), fx(v)]), team: tm.map(([k, v]) => [fx(k), fx(v)]), year };
  }
  const txt = r.ruD.join(" ") + " " + r.ruS.map((x) => x.join(" ")).join(" ");
  const c = CITY.find((c) => new RegExp(c[2]).test(txt));
  out.city = c ? [c[0], c[1]] : null;
  return out;
});
const PM = Object.fromEntries(P.map((p) => [p.id, p]));
const srcOf = (p, n = 0, big = true) => { const im = p.img.find((x) => x[0] === n) || p.img[0]; return `${IMG}/p-${p.id}_${im[0]}-${big && im[3] ? 1280 : 640}.webp`; };
const catCount = Object.fromEntries(CAT_ORDER.map((c) => [c, P.filter((p) => p.cats.includes(c)).length]));

/* Короткая строка о проекте для карточки: год, город, главная цифра. */
function meta(l, p) {
  const x = p[l], bits = [];
  if (p.city) bits.push(p.city[l === "ru" ? 0 : 1]);
  if (x.year) bits.push(x.year);
  return bits.join(" · ");
}
function headline(l, p) {
  const s = p[l].s.find(([k]) => /(территор|hudud|квартир|xonadon|учащ|o‘quvchi|мест|o‘rin|площадь здания|umumiy)/i.test(k));
  return s ? `${s[1].replace(/\s*\(.*\)|:\s*\d+%$/g, "")}` : "";
}

/* Иконки — контуры 24×24, по смыслу. */
const I = (d, w = 1.6) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/><path d="m9 13 9-7"/>'),
  phone: I('<path d="M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2z"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  arrows: I('<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  pencil: I('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>'),
  chart: I('<path d="M4 20V4M4 20h16"/><path d="m7 15 4-4 3 3 5-6"/>'),
  doc: I('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
  sofa: I('<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M3 11h18v6H3zM5 17v2M19 17v2"/>'),
  tree: I('<path d="M12 21v-6"/><path d="M12 3 6 11h3l-4 5h14l-4-5h3z"/>'),
  helmet: I('<path d="M4 16a8 8 0 0 1 16 0"/><path d="M3 16h18v3H3zM12 8V5M9 9V6M15 9V6"/>'),
  scan: I('<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/><path d="M8 12h8"/>'),
  upload: I('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>'),
  play: I('<path d="M8 5v14l11-7z"/>'),
  ruler: I('<path d="m3 17 14-14 4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>'),
  rotate: I('<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>'),
};

/* Логотип DevUz Studio для заставки — тот же, что в промо на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZMARK = `<svg class="dz-mark" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

const PAGE_NAMES = { "": ["Главная", "Bosh sahifa"], proekty: ["Проекты", "Loyihalar"], proekt: ["Проект", "Loyiha"], plan: ["Что дальше", "Keyingi qadam"] };
const pn = (l, k) => PAGE_NAMES[k][l === "ru" ? 0 : 1];

/* ── Сообщения в Telegram ─────────────────────────────────────────────── */
const tgBtn = (cls, label, text, extra = "") => `<a class="btn ${cls}" href="${F.chat}" data-tg="${esc(text)}"${extra}>${ICON.tg}<span>${label}</span></a>`;
const helloText = (l) => (l === "ru" ? "Здравствуйте! Хочу обсудить проект с LIDER PROF PROEKT." : "Assalomu alaykum! LIDER PROF PROEKT bilan loyihani muhokama qilmoqchiman.");
const likeText = (l, p) => (l === "ru" ? `Здравствуйте! Видел у вас проект «${p.ru.n}». Хочу обсудить похожий.` : `Assalomu alaykum! Sizda «${p.uz.n}» loyihasini ko‘rdim. O‘xshashini muhokama qilmoqchiman.`);

/* ── Конструктор: плашка на каждой странице ───────────────────────────── */
function kdRow(l, a) {
  return `<label class="kd-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="${(a.needs || []).join(" ")}" data-def checked><span class="sw" aria-hidden="true"></span><span class="kd-t"><b>${a[l].t}</b>${a[l].e ? `<small>${a[l].e}</small>` : ""}</span><span class="kd-p num">+${usd(a.price)}</span></label>`;
}
function dockHtml(l) {
  const t = T(l);
  const group = (title, side, rows) => (rows.length ? `<section class="kd-g"><h3><span>${title}</span>${side}</h3>${rows.join("")}</section>` : "");
  return `<button class="kd-pill" type="button" id="kd-pill" aria-expanded="false" aria-controls="kd"><i aria-hidden="true"></i>${t("Конструктор", "Konstruktor")}<b class="num" id="kd-pill-sum"></b></button>
<aside class="kd" id="kd" role="dialog" aria-label="${t("Конструктор сайта", "Sayt konstruktori")}" hidden>
<header class="kd-h"><div><p class="kd-k">${t("Конструктор · предложение DevUz Studio", "Konstruktor · DevUz Studio taklifi")}</p><h2>${t("Что войдёт в новый сайт", "Yangi saytga nima kiradi")}</h2><p class="kd-sub">${t("Выключите блок, и он пропадёт со страницы. Включите, и он появится снова. Цены по середине рынка Ташкента.", "Blokni o‘chirsangiz, u sahifadan yo‘qoladi. Yoqsangiz, yana paydo bo‘ladi. Narxlar Toshkent bozorining o‘rtasi bo‘yicha.")}</p></div><button class="kd-x" type="button" id="kd-x" aria-label="${t("Свернуть", "Yig‘ish")}">×</button></header>
<div class="kd-list">
${group(t("На главной", "Bosh sahifada"), `<a href="${href(l)}">${t("открыть", "ochish")} →</a>`, ADDONS.filter((a) => a.where === "").map((a) => kdRow(l, a)))}
${group(t("Проекты", "Loyihalar"), `<a href="${href(l, "proekty")}">${t("открыть", "ochish")} →</a>`, ADDONS.filter((a) => a.where === "proekty" || a.where === "proekt").map((a) => kdRow(l, a)))}
${group(t("На всех страницах", "Barcha sahifalarda"), "", ADDONS.filter((a) => a.where === "all").map((a) => kdRow(l, a)))}
${group(t("Сверх сайта", "Saytdan tashqari"), `<a href="${href(l, "plan")}#konstruktor">${t("что это", "bu nima")} →</a>`, BLOCKS.map((b) => kdRow(l, { ...b, [l]: { t: b[l].t } })))}
</div>
<footer class="kd-f">
<div class="kd-line"><span>${t("Сайт", "Sayt")}</span><span class="num">${usd(KIT_BASE.price)}</span></div>
<div class="kd-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kd-n"></span></span><span class="num" id="kd-add"></span></div>
<div class="kd-line kd-tot"><span>${t("Итого разово", "Jami bir martalik")}</span><b class="num" id="kd-sum"></b></div>
<a class="btn btn-red" href="https://t.me/Devuz_studio_bot?start=lider-prof">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
<div class="kd-btns"><button class="copy" type="button" id="kd-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button><button class="copy" type="button" id="kd-reset">${t("Сбросить", "Qayta tiklash")}</button></div>
</footer>
</aside>`;
}

/* ── Заставка: промо DevUz Studio → буквы растут, как здания → влёт в «O» ── */
function introHtml(l) {
  const t = T(l);
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  const paths = { g: LOGO.parts.map((p) => p.d), line: LOGO.parts.map((p) => (p.y > 0 ? 1 : 0)), hole: HOLE_PATH, w: LOGO.width, h: LOGO.height, eye: EYE, r: HOLE };
  return `<div class="intro" id="intro" role="presentation" data-addon="intro">
${DZ_VIDEO}
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZMARK}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t("прототип для LIDER PROF PROEKT", "LIDER PROF PROEKT uchun prototip")}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<canvas class="lp-cv" aria-hidden="true" data-img="${IMG}/logo-pic.webp" data-paths="${esc(JSON.stringify(paths))}"></canvas>
<div class="lp-cap"><b>${t("Архитектурная студия · Ташкент", "Arxitektura studiyasi · Toshkent")}</b><span>${t("с 5 января 2017 года", "2017-yil 5-yanvardan beri")}</span></div>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish")}</button>
</div>`;
}

/* Фильтр преломления для «жидкого стекла»: шум смещает то, что под
   стеклом. Понимает только Chromium, остальным хватает размытия. */
const LQ = `<svg class="lq-defs" aria-hidden="true" focusable="false"><filter id="lq" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.019" numOctaves="2" result="n"/><feGaussianBlur in="n" stdDeviation="2.5" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="22" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;

/* ── Каркас ───────────────────────────────────────────────────────────── */
function shell(l, path, meta, body, extra = "") {
  const t = T(l);
  const other = l === "ru" ? "uz" : "ru";
  const isHome = path === "";
  const nav = [[href(l) + "#uslugi", t("Услуги", "Xizmatlar")], [href(l, "proekty"), pn(l, "proekty")], [href(l) + "#raschet", t("Расчёт", "Hisob")], [href(l) + "#kontakty", t("Контакты", "Kontaktlar")]];
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#111215">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
${isHome ? `<link rel="preload" as="image" href="${IMG}/hero-2560.webp">` : ""}
<link rel="alternate" hreflang="${other}" href="${href(other, path)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=${isHome ? "false" : "true"};try{if(sessionStorage.getItem('lp-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}try{var k=JSON.parse(localStorage.getItem('lp-kit-v1')||'{}');for(var x in k)if(k[x]===false)r.classList.add('k-no-'+x);if(k.intro===false)off=true}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "ProfessionalService", name: F.name, url: F.site, telephone: F.phone, email: F.email, address: { "@type": "PostalAddress", streetAddress: F.addr.ru, addressLocality: "Ташкент", addressCountry: "UZ" }, areaServed: "UZ", foundingDate: "2017-01-05", sameAs: [F.channel, F.ig, F.fb] })}</script>
</head>
<body class="${isHome ? "home hd-dark" : "inner"}" data-page="${path}" data-lang="${l}">
${LQ}
${isHome ? introHtml(l) : ""}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top"><div class="wrap">
<a class="logo" href="${href(l)}">${logoSvg("", "LIDER PROF PROEKT")}</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([u, n]) => `<a href="${u}"${u === href(l, path) && path ? ' aria-current="page"' : ""}>${n}</a>`).join("")}<a href="${href(l, "plan")}"${path === "plan" ? ' aria-current="page"' : ""}>${pn(l, "plan")}</a></nav>
<div class="top-r"><div class="lang"><a href="${href("ru", path)}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz", path)}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>
${tgBtn("btn-red btn-sm top-cta", t("Обсудить проект", "Loyihani muhokama qilish"), helloText(l))}</div>
</div></header>
<main id="main">
${body}
</main>
<footer class="foot dark" id="kontakty"><div class="wrap">
<div class="cols">
<div><span class="f-logo">${logoSvg()}</span><p>${t("Архитектурная студия: общественные и жилые здания, генпланы, ландшафт и интерьер. Работаем с 5 января 2017 года.", "Arxitektura studiyasi: jamoat va turar joy binolari, bosh rejalar, landshaft va interyer. 2017-yil 5-yanvardan beri ishlaymiz.")}</p></div>
<div><b>${t("На связи", "Aloqada")}</b><ul><li><a href="${F.chat}">Telegram @lppuz</a></li><li><a href="tel:${F.phone}">${F.phoneT}</a></li><li><a href="tel:${F.phone2}">${F.phone2T}</a></li><li><a href="mailto:${F.email}">${F.email}</a></li><li><a href="${F.channel}">${t("Канал в Telegram", "Telegram kanal")}</a> · <a href="${F.ig}">Instagram</a> · <a href="${F.fb}">Facebook</a></li></ul></div>
<div><b>${t("Офис", "Ofis")}</b><ul><li>${F.addr[l]}</li><li>${F.hours[l]}</li><li><a href="${MAP}">${t("Открыть на карте", "Xaritada ochish")}</a></li></ul></div>
</div>
<div class="rights"><span>${t("Это прототип: так может выглядеть новый сайт LIDER PROF PROEKT. Проекты, фото, цифры, услуги, заказчики, отзыв и контакты взяты с lider-prof.uz (12.10.2026). Блоки с пометкой «Предложение DevUz Studio» придумали мы, на сайте их пока нет. Откуда изображения:", "Bu prototip: yangi LIDER PROF PROEKT sayti shunday ko‘rinishi mumkin. Loyihalar, fotolar, raqamlar, xizmatlar, buyurtmachilar, sharh va kontaktlar lider-prof.uz’dan olingan (12.10.2026). «DevUz Studio taklifi» belgisi bor bloklarni biz o‘ylab topdik, ular hozircha saytda yo‘q. Rasmlar qayerdan:")} <a href="${href(l, "plan")}#foto">${pn(l, "plan")}</a>.</span><span>${t("Прототип принадлежит DevUz Studio. Использовать его можно только по договору:", "Prototip DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari")}</a></span></div>
</div></footer>
<div class="dock" id="dock">${tgBtn("btn-red", t("Обсудить проект", "Loyihani muhokama qilish"), helloText(l))}<a class="btn btn-ghost dock-call" href="tel:${F.phone}" aria-label="${t("Позвонить", "Qo‘ng‘iroq qilish")}">${ICON.phone}</a></div>
${dockHtml(l)}
<script type="application/json" id="i18n">${JSON.stringify(Ls(l)).replace(/</g, "\\u003c")}</script>
${extra}
${isHome ? `<script>\n${INTRO}</script>\n<script>\n${STORY}</script>` : ""}
<script>
${JS}</script>
</body>
</html>`;
}

/* Строки для скриптов страницы. */
function Ls(l) {
  const ru = l === "ru";
  return {
    lang: l,
    tg: F.chat,
    kitBase: KIT_BASE.price,
    kitN: ru ? "{n} шт." : "{n} ta",
    kitTg: ru ? "Состав нового сайта LIDER PROF PROEKT из конструктора:" : "Konstruktordan yangi LIDER PROF PROEKT sayti tarkibi:",
    kitBaseName: KIT_BASE[l].t,
    kitTotal: ru ? "Итого" : "Jami",
    copied: ru ? "Скопировано" : "Nusxalandi",
    sent: ru ? "Текст скопирован. Открываем Telegram студии, вставьте его в чат." : "Matn nusxalandi. Studiya Telegrami ochilmoqda, uni chatga qo‘ying.",
    found: ru ? "Проектов: {n}" : "Loyihalar: {n}",
    m2: ru ? "м²" : "m²",
    briefHead: ru ? "Бриф с сайта LIDER PROF PROEKT" : "LIDER PROF PROEKT saytidan brif",
    bType: ru ? "Объект" : "Obyekt",
    bArea: ru ? "Площадь" : "Maydon",
    bStages: ru ? "Что нужно" : "Nima kerak",
    bCity: ru ? "Город" : "Shahar",
    bName: ru ? "Имя" : "Ism",
    bPhone: ru ? "Телефон" : "Telefon",
    bFile: ru ? "План или ТЗ отправлю следующим сообщением: {f}" : "Reja yoki TTni keyingi xabarda yuboraman: {f}",
    bNeed: ru ? "Оставьте телефон: без него архитектору некуда перезвонить." : "Telefon qoldiring: usiz me’mor qo‘ng‘iroq qila olmaydi.",
    bNone: ru ? "Отметьте хотя бы одну стадию." : "Kamida bitta bosqichni belgilang.",
    empty: ru ? "не указано" : "ko‘rsatilmagan",
    noProj: ru ? "Такого проекта нет. Вот все проекты студии." : "Bunday loyiha yo‘q. Mana studiyaning barcha loyihalari.",
    img: IMG,
  };
}

/* ── Куски страниц ────────────────────────────────────────────────────── */
const head = (kicker, h, lead, side = "", anim = "rise") => `<div class="sec-head rv a-${anim}"><div>${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>${side}</div>`;
const ours = (l) => `<span class="ours">${T(l)("Предложение DevUz Studio", "DevUz Studio taklifi")}</span>`;

/* Карточка проекта: превью грузится очередью, когда карточка на виду
   (урок enotmebel, 11.10.2026: залп картинок сервер отбивает с 429). */
const ANIMS = ["floor", "rise", "slab"];
function card(l, p, k, cls = "") {
  const x = p[l], im = p.img[0], hl = headline(l, p);
  return `<a class="pc rv a-${ANIMS[k % 3]}${cls}" style="--d:${(k % 3) * 70}ms" href="${href(l, "proekt")}?id=${p.id}" data-c="${p.cats.join(" ")}">
<span class="pc-ph tilt"><span class="spot" aria-hidden="true"></span><img data-src="${IMG}/p-${p.id}_${im[0]}-640.webp" alt="${esc(x.n)}" width="640" height="${Math.round(640 * im[2] / im[1])}" decoding="async"></span>
<span class="pc-bd"><span class="pc-c">${p.cats.map((c) => cn(l, c)).join(" · ")}</span><b>${esc(x.n)}</b><span class="pc-m">${[meta(l, p), hl].filter(Boolean).join(" · ")}</span></span></a>`;
}
function chips(l, all) {
  const t = T(l);
  return `<div class="chips" role="group" aria-label="${t("Направления", "Yo‘nalishlar")}" data-addon="filters"><button class="chip" type="button" data-f="" aria-pressed="true">${t("Все", "Barchasi")} <i class="num">${all}</i></button>${CAT_ORDER.map((c) => `<button class="chip" type="button" data-f="${c}" aria-pressed="false">${cn(l, c)} <i class="num">${catCount[c]}</i></button>`).join("")}</div>`;
}

/* ── Схема Узбекистана: Natural Earth (общественное достояние) ────────── */
const UZ = "M618 636L620 589L542 556L481 518L443 481L376 428L348 348L328 334L265 338L243 322L236 260L158 219L108 264L59 291L68 330L2 331L0 46L150 0L161 7L252 62L300 91L355 161L424 150L524 144L594 200L589 278L618 278L630 342L704 344L720 381L742 380L767 325L844 271L878 257L895 265L846 315L889 344L931 324L1000 365L925 421L881 413L857 415L848 394L861 358L782 376L764 426L736 468L687 465L672 499L715 517L728 575L695 653L651 637L618 636Z";
/* Где стоят их проекты: города из описаний на lider-prof.uz. Координаты —
   та же проекция, что у схемы (Ташкент, Самарканд, Андижан, Карши). */
const PLACES = [
  ["Ташкент", "Toshkent", 777, 332, t2("школы, ЖК, больницы, парки", "maktablar, TJM, shifoxonalar, bog‘lar")],
  ["Амирсой", "Amirsoy", 816, 312, t2("курорт", "dam olish maskani")],
  ["Охангаран", "Ohangaron", 800, 362, t2("Олимпийский центр", "Olimpiya markazi")],
  ["Андижан", "Andijon", 958, 372, t2("филиал Национального банка", "Milliy bank filiali")],
  ["Самарканд", "Samarqand", 644, 459, t2("центр агроуслуг", "agroxizmatlar markazi")],
  ["Шахрисабз", "Shahrisabz", 638, 505, t2("Oqsaroy Boulevard", "Oqsaroy Boulevard")],
  ["Карши", "Qarshi", 576, 520, t2("ARK Residence, колледж", "ARK Residence, kollej")],
  ["Денау", "Denov", 698, 566, t2("торговый комплекс", "savdo majmuasi")],
];
function mapSvg(l, cls) {
  const [, , tx, ty] = PLACES[0];
  const routes = PLACES.slice(1).map(([, , x, y], k) => {
    const mx = (tx + x) / 2, my = (ty + y) / 2 - Math.hypot(x - tx, y - ty) * 0.22;
    return `<path class="rt" data-k="rt${k}" d="M${tx} ${ty}Q${mx.toFixed(0)} ${my.toFixed(0)} ${x} ${y}" pathLength="1"/>`;
  }).join("");
  const side = (n, x) => (n === "Амирсой" ? [12, -10, "start"] : n === "Охангаран" ? [12, 20, "start"] : x > 880 ? [-12, 5, "end"] : n === "Ташкент" ? [-14, 5, "end"] : [12, 5, "start"]);
  return `<svg class="${cls}" viewBox="-20 -20 1040 700" role="img" aria-label="${T(l)("Где стоят проекты студии", "Studiya loyihalari qayerda")}"><path class="uz" data-k="uz" d="${UZ}" pathLength="1"/>${routes}${PLACES.map(([ru, uz, x, y], k) => { const [dx, dy, a] = side(ru, x); return `<g class="ct${k === 0 ? " home" : ""}" data-k="ct${k}" transform="translate(${x} ${y})"><circle r="${k === 0 ? 9 : 6}"/>${k === 0 ? '<circle class="ping" r="9"/>' : ""}<text x="${dx}" y="${dy}" text-anchor="${a}">${l === "ru" ? ru : uz}</text></g>`; }).join("")}</svg>`;
}

/* ── История при прокрутке ────────────────────────────────────────────── */
const FLY = [63, 74, 61, 71, 13, 4, 66, 62, 9, 58];
const GP = PM[64];
function storyBlock(l) {
  const t = T(l);
  const chapters = [[0, "LIDER PROF PROEKT"], [1.9, t("Генплан", "Bosh reja")], [4.8, t("Проект", "Loyiha")], [9.2, t("Интерьер", "Interyer")], [12.6, t("Ландшафт", "Landshaft")], [15.6, t("Проекты", "Loyihalar")], [21.2, t("Команда", "Jamoa")], [24.4, t("География", "Geografiya")], [27.2, t("Ваш объект", "Sizning obyektingiz")]];
  const beat = (a, b, k, h, p, extra = "") => `<div class="st-beat" data-beat="${a} ${b}"><span class="kicker" data-line><i></i>${k}</span><h2 data-line>${h}</h2>${p ? `<p data-line>${p}</p>` : ""}${extra}</div>`;
  const tep = GP[l].s.slice(0, 4).map(([k, v]) => `<div class="spec-r"><b>${esc(v.replace(/:\s*\d+%$/, ""))}</b><span>${esc(k.replace(/ в границах проектирования| loyihalash chegarasida/i, ""))}</span></div>`).join("");
  const stages = [t("Концепция", "Konsepsiya"), t("Эскиз", "Eskiz"), t("Проектная документация", "Loyiha hujjatlari"), t("Рабочая документация", "Ishchi hujjatlar"), t("Авторский надзор", "Mualliflik nazorati")];
  const statics = [
    [t("Генплан с рельефом", "Relyefli bosh reja"), t("Олимпийский центр в Охангаране: 14,93 гектара, две трети территории отдано зелени.", "Ohangarondagi Olimpiya markazi: 14,93 gektar, hududning uchdan ikki qismi ko‘kalamzor."), `${IMG}/p-64_0-640.webp`],
    [t("От эскиза до рабочей документации", "Eskizdan ishchi hujjatlargacha"), t("Концепция, эскиз, проектная и рабочая документация, согласование и авторский надзор на стройке.", "Konsepsiya, eskiz, loyiha va ishchi hujjatlar, kelishuv va qurilishda mualliflik nazorati."), `${IMG}/p-64_2-640.webp`],
    [t("Интерьер", "Interyer"), t("Планировка, 3D-изображение, подбор материалов и расчёт их объёма под бюджет.", "Rejalashtirish, 3D tasvir, materiallarni tanlash va hajmini byudjetga qarab hisoblash."), `${IMG}/p-74_3-640.webp`],
    [t("Ландшафт", "Landshaft"), t("Махалля «Qadrdon»: площадки, амфитеатр, аллеи, пешеходные и велосипедные маршруты.", "«Qadrdon» mahallasi: maydonchalar, amfiteatr, xiyobonlar, piyoda va velosiped yo‘laklari."), `${IMG}/p-65_1-640.webp`],
  ];
  return `<section class="story" id="story" data-end="28.2" data-chapters="${esc(JSON.stringify(chapters))}" aria-label="${t("Студия LIDER PROF PROEKT: от генплана до интерьера", "LIDER PROF PROEKT studiyasi: bosh rejadan interyergacha")}">
<div class="st-track"><div class="st-stage" id="hero">
<div class="st-layer st-hero" data-k="hero"><div class="st-cam" data-k="heroCam"><img src="${IMG}/hero-2560.webp" alt="${esc(GP[l].n)}: ${t("генплан с высоты", "yuqoridan bosh reja")}" width="2560" height="1440" fetchpriority="high"></div><div class="st-shade"></div>
<i class="hs" data-k="hs1"><b></b><span>${t("14,93 га территории", "14,93 ga hudud")}</span></i><i class="hs" data-k="hs2"><b></b><span>${t("68% озеленения", "68% ko‘kalamzor")}</span></i>
<div class="spec glass lq" data-k="spec"><p class="spec-k">${t("Олимпийский центр · генплан", "Olimpiya markazi · bosh reja")}</p>${tep}</div></div>

<div class="st-layer st-draft" data-k="draft"><div class="dr-cam" data-k="drCam"><img data-src="${IMG}/draft-1920.webp" alt="" width="1920" height="1080" decoding="async"><div class="dr-wipe" data-k="wipe"><div class="dr-inner" data-k="wipeIn"><img data-src="${IMG}/facade-1920.webp" alt="${t("Спорткорпус Олимпийского центра", "Olimpiya markazi sport binosi")}" width="1920" height="1080" decoding="async"></div></div><i class="dr-line" data-k="wline" aria-hidden="true"></i></div>
<ol class="stages glass lq" data-k="stages">${stages.map((s, k) => `<li data-k="sg${k}"><b class="num">0${k + 1}</b><span>${s}</span></li>`).join("")}</ol></div>

<div class="st-layer st-in" data-k="inside"><div class="in-cam" data-k="inCam1"><img data-src="${IMG}/in-gym-1448.webp" alt="${t("Спортзал школы иностранных языков", "Xorijiy tillar maktabi sport zali")}" width="1448" height="1086" decoding="async"></div><div class="in-cam" data-k="inCam2"><img data-src="${IMG}/in-hall-1280.webp" alt="${t("Зал детского сада на 720 мест", "720 o‘rinli bolalar bog‘chasi zali")}" width="1280" height="904" decoding="async"></div><div class="st-shade"></div></div>

<div class="st-layer st-land" data-k="land"><div class="ld-rot" data-k="ldRot"><img data-src="${IMG}/land-1400.webp" alt="${t("Махалля «Qadrdon» сверху", "«Qadrdon» mahallasi yuqoridan")}" width="1400" height="1400" decoding="async"></div><div class="st-shade"></div></div>

<div class="st-layer st-fly" data-k="fly"><div class="fly-world">${FLY.map((id, k) => { const p = PM[id]; return `<figure class="fly-c" data-fly="${k}"><img data-src="${srcOf(p)}" alt="${esc(p[l].n)}" width="640" height="400" decoding="async"><figcaption><b>${esc(p[l].n)}</b><span>${[p.cats.map((c) => cn(l, c))[0], meta(l, p)].filter(Boolean).join(" · ")}</span></figcaption></figure>`; }).join("")}</div></div>

<div class="st-layer st-team" data-k="team"><div class="tm-bg" data-k="tmBg"><img data-src="${IMG}/p-63_3-1280.webp" alt="" width="1280" height="720" decoding="async"></div><div class="st-shade"></div>
<div class="nums glass lq" data-k="nums">${NUM.map(([n, s], k) => `<div class="nm"><b class="num" data-count="${n}" data-k="cnt${k}">${n}+</b><span>${s[l]}</span></div>`).join("")}</div>
<div class="logos glass lq" data-k="logos" data-addon="trust"><p class="spec-k">${t("Нам доверяют", "Bizga ishonishadi")}</p><div>${PARTNERS.slice(0, 8).map(([f, n]) => `<img data-src="${IMG}/c-${f}.webp" alt="${n}" width="320" height="180" decoding="async">`).join("")}</div></div></div>

<div class="st-layer st-map" data-k="map">${mapSvg(l, "map-svg")}</div>

<div class="st-layer st-end" data-k="end"><div class="end-in">${logoSvg("end-logo")}<p>${t("Общественные и жилые здания, генпланы, ландшафт и интерьер", "Jamoat va turar joy binolari, bosh rejalar, landshaft va interyer")}</p></div></div>

<div class="st-text">
<div class="st-beat st-first" data-beat="-1 1.7"><span class="kicker" data-line><i></i>${t("Архитектурная студия · Ташкент · с 2017 года", "Arxitektura studiyasi · Toshkent · 2017-yildan")}</span><h1 data-line>${t("Проектируем города, здания и интерьеры", "Shaharlar, binolar va interyerlarni loyihalaymiz")}</h1><p data-line>${t("Общественные и жилые здания, генпланы, ландшафт и интерьер. Более 300 проектов по всему Узбекистану.", "Jamoat va turar joy binolari, bosh rejalar, landshaft va interyer. O‘zbekiston bo‘ylab 300 dan ortiq loyiha.")}</p><div class="cta" data-line>${tgBtn("btn-red shim", t("Обсудить проект", "Loyihani muhokama qilish"), helloText(l))}<a class="btn btn-ghost" href="${href(l, "proekty")}">${t("Смотреть проекты", "Loyihalarni ko‘rish")}</a></div></div>
${beat(2, 4.6, t("01 · Генплан", "01 · Bosh reja"), t("Олимпийский центр в Охангаране", "Ohangarondagi Olimpiya markazi"), t("Генплан учитывает природный ландшафт и рельеф. Из 14,93 гектара две трети отданы зелени.", "Bosh reja tabiiy landshaft va relyefni hisobga oladi. 14,93 gektarning uchdan ikki qismi ko‘kalamzorga berilgan."))}
${beat(5, 9, t("02 · Проект", "02 · Loyiha"), t("Чертёж становится зданием", "Chizma binoga aylanadi"), t("Концепция, эскиз, проектная и рабочая документация, согласование с госорганами и авторский надзор на стройке.", "Konsepsiya, eskiz, loyiha va ishchi hujjatlar, davlat organlari bilan kelishuv va qurilishda mualliflik nazorati."))}
${beat(9.4, 12.4, t("03 · Интерьер", "03 · Interyer"), t("Внутри так же продумано", "Ichkarisi ham puxta o‘ylangan"), t("Планировка и мебель, 3D-изображение, рабочие чертежи, подбор материалов и расчёт их объёма под бюджет заказчика.", "Rejalashtirish va mebel, 3D tasvir, ishchi chizmalar, materiallarni tanlash va hajmini buyurtmachi byudjetiga qarab hisoblash."))}
${beat(12.8, 15.4, t("04 · Ландшафт", "04 · Landshaft"), t("Махалля «Qadrdon» сверху", "«Qadrdon» mahallasi yuqoridan"), t("Детские площадки, workout-зона, амфитеатр, аллеи с Wi-Fi, пешеходные и велосипедные маршруты.", "Bolalar maydonchalari, workout zonasi, amfiteatr, Wi-Fi’li xiyobonlar, piyoda va velosiped yo‘laklari."))}
${beat(15.8, 18.4, t("05 · Проекты", "05 · Loyihalar"), t("Кампус, школы, ЖК, курорт", "Kampus, maktablar, TJM, dam olish maskani"), t("Кампус МГТУ имени Баумана, школа на 600 учащихся, ARK Residence на 321 квартиру, курорт «Амирсой».", "Bauman nomidagi MDTU kampusi, 600 o‘quvchilik maktab, 321 xonadonli ARK Residence, «Amirsoy» dam olish maskani."))}
${beat(18.4, 21, t("05 · Проекты", "05 · Loyihalar"), t("Более 300 проектов", "300 dan ortiq loyiha"), t("По всему Узбекистану, для государства, застройщиков, банков и частных заказчиков.", "Butun O‘zbekiston bo‘ylab, davlat, quruvchilar, banklar va xususiy buyurtmachilar uchun."))}
${beat(21.4, 24.2, t("06 · Команда", "06 · Jamoa"), t("35 специалистов", "35 mutaxassis"), t("Архитекторы, проектировщики и инженеры по основной и смежной работе. Ответим в течение 30 минут.", "Asosiy va turdosh ishlar bo‘yicha me’morlar, loyihachilar va muhandislar. 30 daqiqa ichida javob beramiz."))}
${beat(24.6, 27, t("07 · География", "07 · Geografiya"), t("От Андижана до Денау", "Andijondan Denovgacha"), t("Ташкент, Охангаран, Самарканд, Шахрисабз, Карши: проекты студии стоят по всей стране.", "Toshkent, Ohangaron, Samarqand, Shahrisabz, Qarshi: studiya loyihalari butun mamlakatda."))}
<div class="st-beat st-last" data-beat="27.3 99"><span class="kicker" data-line><i></i>${t("08 · Ваш объект", "08 · Sizning obyektingiz")}</span><h2 data-line>${t("Расскажите о своём объекте", "Obyektingiz haqida aytib bering")}</h2><div class="cta" data-line><a class="btn btn-red" href="#raschet">${t("Рассчитать проект", "Loyihani hisoblash")}${ICON.arrow}</a>${tgBtn("btn-ghost", t("Написать в Telegram", "Telegramga yozish"), helloText(l))}</div></div>
</div>
<div class="st-hud" aria-hidden="true"><span data-hud>00 · LIDER PROF PROEKT</span><i><b data-bar></b></i></div>
<p class="st-hint" data-k="hint" aria-hidden="true">${t("Листайте", "Aylantiring")}<i></i></p>
</div></div>
<div class="st-static wrap">${statics.map(([h, p, src]) => `<div class="st-s"><img src="${src}" alt="" width="640" height="400" loading="lazy"><div><h2>${h}</h2><p>${p}</p></div></div>`).join("")}</div>
</section>`;
}

/* Первый экран без истории: тот же генплан, когда доп «Сцена» выключен. */
function heroPlain(l) {
  const t = T(l);
  return `<section class="hero2 dark" data-addon-off="story"><img src="${IMG}/hero-1440.webp" srcset="${IMG}/hero-1440.webp 1440w, ${IMG}/hero-2560.webp 2560w" sizes="100vw" alt="" width="2560" height="1440" loading="lazy"><div class="st-shade"></div><div class="wrap"><span class="kicker"><i></i>${t("Архитектурная студия · Ташкент · с 2017 года", "Arxitektura studiyasi · Toshkent · 2017-yildan")}</span><p class="h1">${t("Проектируем города, здания и интерьеры", "Shaharlar, binolar va interyerlarni loyihalaymiz")}</p><div class="cta">${tgBtn("btn-red", t("Обсудить проект", "Loyihani muhokama qilish"), helloText(l))}<a class="btn btn-ghost" href="${href(l, "proekty")}">${t("Смотреть проекты", "Loyihalarni ko‘rish")}</a></div></div></section>`;
}

/* Услуги: путь заказчика по этапам. */
function servicesBlock(l) {
  const t = T(l);
  const anim = ["draw", "rise", "slab", "floor", "rise", "draw", "slab"];
  return `<section id="uslugi"><div class="wrap">
${head(t("Наши услуги", "Xizmatlarimiz"), t("От идеи до надзора на стройке", "G‘oyadan qurilish nazoratigacha"), t("Работаем с частными, государственными, коммерческими и общественными объектами. Учитываем пожелания заказчика, участок и бюджет.", "Xususiy, davlat, tijorat va jamoat obyektlari bilan ishlaymiz. Buyurtmachi istaklari, maydon va byudjetni hisobga olamiz."))}
<ol class="path">${SERVICES.map((s, k) => `<li class="sv rv a-${anim[k]}" style="--d:${(k % 2) * 80}ms"><span class="sv-n num">0${k + 1}</span><span class="sv-ic">${ICON[s.ic]}</span><div><h3>${s[l][0]}</h3><p>${s[l][1]}</p></div></li>`).join("")}</ol>
</div></section>`;
}

/* Проекты на главной: девять последних, фильтр, ссылка на все. */
function projectsBlock(l) {
  const t = T(l);
  const top = [64, 63, 74, 65, 61, 62, 66, 71, 13];
  return `<section id="proekty" class="dark"><div class="wrap">
${head(t("Наши работы", "Bizning ishlarimiz"), t("61 проект на сайте", "Saytda 61 loyiha"), t("От частных домов до общественных пространств: школы, кампусы, жилые комплексы, больницы, парки и курорты.", "Xususiy uylardan jamoat makonlarigacha: maktablar, kampuslar, turar joy majmualari, shifoxonalar, bog‘lar va dam olish maskanlari."), `<a class="btn btn-ghost" href="${href(l, "proekty")}">${t("Все проекты", "Barcha loyihalar")}${ICON.arrow}</a>`)}
<div class="pgrid">${top.map((id, k) => card(l, PM[id], k)).join("")}</div>
<p class="more"><a class="btn btn-red" href="${href(l, "proekty")}">${t("Смотреть все 61 проект", "Barcha 61 loyihani ko‘rish")}${ICON.arrow}</a></p>
</div></section>`;
}

/* Расчёт проекта: бриф по площади. Цен на их сайте нет, поэтому итог —
   состав работы и сообщение архитектору, а не сумма. */
function calcBlock(l) {
  const t = T(l);
  const types = [["school", t("Школа или детский сад", "Maktab yoki bog‘cha")], ["zhk", t("Жилой комплекс", "Turar joy majmuasi")], ["house", t("Частный дом", "Xususiy uy")], ["office", t("Офис, банк, торговля", "Ofis, bank, savdo")], ["prom", t("Производство", "Ishlab chiqarish")], ["genplan", t("Генплан, благоустройство", "Bosh reja, obodonlashtirish")], ["interior", t("Интерьер", "Interyer")]];
  const stages = [["koncept", t("Концепция и эскиз", "Konsepsiya va eskiz")], ["teo", t("ТЭО", "TIA")], ["docs", t("Проектная и рабочая документация", "Loyiha va ishchi hujjatlar")], ["design", t("Дизайн и 3D-изображение", "Dizayn va 3D tasvir")], ["land", t("Ландшафт", "Landshaft")], ["nadzor", t("Авторский надзор", "Mualliflik nazorati")], ["obsled", t("Обследование конструкций", "Konstruksiyalarni tekshirish")]];
  return `<section id="raschet" data-addon="calc"><div class="wrap">
${head(t("Расчёт проекта", "Loyiha hisobi"), t("Опишите объект за минуту", "Obyektni bir daqiqada tasvirlang"), t("Тип, площадь и что нужно сделать. Справа сразу видно, что войдёт в работу. Бриф уходит архитектору в Telegram, стоимость назовём в течение 30 минут.", "Turi, maydoni va nima qilish kerakligi. O‘ngda ishga nima kirishi darhol ko‘rinadi. Brif me’morga Telegramda boradi, narxini 30 daqiqa ichida aytamiz."), ours(l))}
<form class="calc rv a-rise" id="calc" novalidate>
<div class="calc-f">
<fieldset><legend>${t("Объект", "Obyekt")}</legend><div class="opts">${types.map(([v, n], k) => `<label class="opt"><input type="radio" name="type" value="${esc(n)}"${k === 0 ? " checked" : ""}><span>${n}</span></label>`).join("")}</div></fieldset>
<label class="field area"><span>${t("Площадь", "Maydon")} <output class="num" id="area-v">2 500</output> ${t("м²", "m²")}</span><input type="range" id="area" name="area" min="50" max="50000" step="50" value="2500" aria-label="${t("Площадь, м²", "Maydon, m²")}"><span class="area-ex" id="area-ex"></span></label>
<fieldset><legend>${t("Что нужно", "Nima kerak")}</legend><div class="opts">${stages.map(([v, n], k) => `<label class="opt"><input type="checkbox" name="st" value="${v}" data-n="${esc(n)}"${k === 0 || k === 2 ? " checked" : ""}><span>${n}</span></label>`).join("")}</div></fieldset>
<div class="row2"><label class="field"><span>${t("Город", "Shahar")}</span><input name="city" autocomplete="address-level2" placeholder="${t("Ташкент", "Toshkent")}"></label><label class="field"><span>${t("Телефон", "Telefon")}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998"></label></div>
<label class="file"><input type="file" id="plan-f" accept=".pdf,.dwg,.jpg,.jpeg,.png"><span class="file-b">${ICON.upload}<b id="plan-n">${t("Прикрепить план или ТЗ", "Reja yoki TT biriktirish")}</b><small>PDF, DWG, JPG</small></span></label>
</div>
<aside class="calc-r glass-l">
<p class="calc-k">${t("Что войдёт в работу", "Ishga nima kiradi")}</p>
<ul class="calc-l" id="calc-l"></ul>
<p class="calc-n" id="calc-n"></p>
<button class="btn btn-red" type="submit">${ICON.tg}<span>${t("Отправить бриф архитектору", "Brifni me’morga yuborish")}</span></button>
<p class="note-ok" id="calc-done" role="status" hidden></p>
<p class="calc-s">${t("Бриф уходит текстом в Telegram студии @lppuz: там просят писать коротко и по существу, голосовые не слушают. Файл по ссылке не передать, приложите его следом в тот же чат.", "Brif studiyaning @lppuz Telegramiga matn bilan boradi: u yerda qisqa va aniq yozishni so‘rashadi, ovozli xabarlar tinglanmaydi. Faylni havola orqali o‘tkazib bo‘lmaydi, uni ortidan shu chatga biriktiring.")}</p>
</aside>
</form>
<script type="application/json" id="calc-data">${JSON.stringify({
    koncept: [t("Концепция: общий образ, идеи, визуализация", "Konsepsiya: umumiy qiyofa, g‘oyalar, vizualizatsiya"), t("Эскиз: размеры, формы, функциональные зоны", "Eskiz: o‘lchamlar, shakllar, funksional zonalar")],
    teo: [t("ТЭО: затраты, результат, решение о вложениях", "TIA: xarajat, natija, sarmoya qarori")],
    docs: [t("Проектная документация: архитектура и инженерия", "Loyiha hujjatlari: me’morchilik va muhandislik"), t("Рабочая документация: чертежи и спецификации", "Ishchi hujjatlar: chizmalar va spetsifikatsiyalar"), t("Согласование с госорганами", "Davlat organlari bilan kelishuv")],
    design: [t("Планировка, эскизы, 3D-изображение", "Rejalashtirish, eskizlar, 3D tasvir"), t("Подбор материалов, расчёт объёма", "Materiallar tanlovi, hajm hisobi")],
    land: [t("Ландшафт: зоны, растения, малые формы", "Landshaft: zonalar, o‘simliklar, kichik shakllar")],
    nadzor: [t("Авторский надзор на стройке", "Qurilishda mualliflik nazorati")],
    obsled: [t("Обследование конструкций, заключение", "Konstruksiyalarni tekshirish, xulosa")],
    ex: [[600, t("как частный дом", "xususiy uy kabi")], [6200, t("как детский сад на 720 мест (6 161,5 м²)", "720 o‘rinli bog‘cha kabi (6 161,5 m²)")], [17710, t("как школа на 600 учащихся (17 710 м²)", "600 o‘quvchilik maktab kabi (17 710 m²)")], [32109, t("как ARK Residence на 321 квартиру (32 108,78 м²)", "321 xonadonli ARK Residence kabi (32 108,78 m²)")], [50000, t("как жилой квартал", "turar joy mavzesi kabi")]],
  }).replace(/</g, "\\u003c")}</script>
</div></section>`;
}

/* Просмотр 360°: кадр поворачивается пальцем, мышкой и наклоном телефона. */
function panoBlock(l) {
  const t = T(l);
  return `<section id="pano" class="dark" data-addon="pano"><div class="wrap">
${head(t("Просмотр 360°", "360° ko‘rish"), t("Загляните внутрь до стройки", "Qurilishdan oldin ichkariga qarang"), t("Тяните кадр пальцем или мышкой, на телефоне можно просто наклонить его. Здесь ваш рендер игрового зала детского сада, на сайте встанут панорамы из вашей программы визуализации.", "Kadrni barmoq yoki sichqoncha bilan torting, telefonda shunchaki qiyshaytirish mumkin. Bu yerda bolalar bog‘chasi o‘yin zali renderingiz, saytda vizualizatsiya dasturingizdagi panoramalar turadi."), ours(l))}
<div class="pano rv a-rise" id="pano-v" tabindex="0" role="img" aria-label="${t("Игровой зал детского сада на 720 мест, просмотр с поворотом", "720 o‘rinli bolalar bog‘chasi o‘yin zali, burib ko‘rish")}"><div class="pano-in" id="pano-in"><img data-src="${IMG}/pano-1500.webp" alt="" width="1500" height="1000" decoding="async"></div><span class="pano-h">${ICON.rotate}${t("тяните", "torting")}</span><span class="pano-c" aria-hidden="true"><i id="pano-dot"></i></span></div>
</div></section>`;
}

/* Доверие: заказчики лентой, отзыв, карта объектов. */
function trustBlock(l) {
  const t = T(l);
  const row = PARTNERS.map(([f, n]) => `<span class="lg"><img data-src="${IMG}/c-${f}.webp" alt="${n}" width="320" height="180" decoding="async"></span>`).join("");
  return `<section id="doverie" data-addon="trust"><div class="wrap">
${head(t("Нам доверяют", "Bizga ishonishadi"), t("Застройщики, банки и государство", "Quruvchilar, banklar va davlat"), t("Частные заказчики, застройщики и бизнес. С каждым проектом стараемся превзойти ожидания.", "Xususiy buyurtmachilar, quruvchilar va biznes. Har bir loyihada kutilganidan oshib ketishga harakat qilamiz."))}
</div>
<div class="mq" aria-label="${t("Заказчики", "Buyurtmachilar")}"><div class="mq-row">${row}${row.replace(/alt="[^"]*"/g, 'alt="" aria-hidden="true"')}</div></div>
<div class="wrap trust2">
<figure class="rev rv a-rise"><blockquote><p class="rev-q">«${REVIEW.q}»</p><p>${REVIEW.t}</p></blockquote><figcaption><b>${REVIEW.n}</b><span>${REVIEW.r}</span></figcaption></figure>
<div class="geo rv a-draw">${mapSvg(l, "map-flat")}<p>${t("Где стоят проекты студии: города из описаний проектов на сайте.", "Studiya loyihalari qayerda: saytdagi loyiha tavsiflaridagi shaharlar.")}</p></div>
</div></section>`;
}

/* Контакты и финальная кнопка. */
function contactBlock(l) {
  const t = T(l);
  return `<section class="final dark"><div class="wrap">
<div class="fin rv a-rise"><span class="kicker"><i></i>${t("Есть вопросы?", "Savollar bormi?")}</span><h2>${t("Наш специалист ответит в течение 30 минут", "Mutaxassisimiz 30 daqiqa ichida javob beradi")}</h2><div class="cta">${tgBtn("btn-red shim", t("Написать в Telegram", "Telegramga yozish"), helloText(l))}<a class="btn btn-ghost" href="tel:${F.phone}">${ICON.phone}<span>${F.phoneT}</span></a></div>
<ul class="fin-l"><li>${ICON.pin}<span>${F.addr[l]} · ${F.hours[l]}</span></li><li>${ICON.mail}<a href="mailto:${F.email}">${F.email}</a></li></ul></div>
</div></section>`;
}

/* ── Главная ──────────────────────────────────────────────────────────── */
function home(l) {
  const t = T(l);
  const body = `<div data-addon="story">${storyBlock(l)}</div>
${heroPlain(l)}
${servicesBlock(l)}
${projectsBlock(l)}
${calcBlock(l)}
${panoBlock(l)}
${trustBlock(l)}
${contactBlock(l)}`;
  return shell(l, "", {
    title: t("LIDER PROF PROEKT: архитектурная студия в Ташкенте", "LIDER PROF PROEKT: Toshkentdagi arxitektura studiyasi"),
    desc: t("Общественные и жилые здания, генпланы, ландшафт и интерьер. Более 300 проектов по всему Узбекистану, 35 специалистов, с 2017 года.", "Jamoat va turar joy binolari, bosh rejalar, landshaft va interyer. O‘zbekiston bo‘ylab 300 dan ortiq loyiha, 35 mutaxassis, 2017-yildan."),
  }, body);
}

/* ── Все проекты ──────────────────────────────────────────────────────── */
function projectsPage(l) {
  const t = T(l);
  const body = `<section class="phead dark"><div class="wrap"><span class="kicker"><i></i>${t("Наши работы", "Bizning ishlarimiz")}</span><h1>${t("Проекты студии", "Studiya loyihalari")}</h1><p class="lead">${t("Решения рассчитаны на то, чтобы служить долго. Нажмите на направление, чтобы оставить только его.", "Yechimlar uzoq xizmat qilishga mo‘ljallangan. Faqat kerakli yo‘nalishni qoldirish uchun uni bosing.")}</p>${chips(l, P.length)}<p class="found num" id="cat-n" aria-live="polite"></p></div></section>
<section class="dark" style="padding-top:0"><div class="wrap"><div class="pgrid" id="pgrid">${P.map((p, k) => card(l, p, k)).join("")}</div></div></section>
${contactBlock(l)}`;
  return shell(l, "proekty", {
    title: t("Проекты: школы, ЖК, генпланы, интерьеры | LIDER PROF PROEKT", "Loyihalar: maktablar, TJM, bosh rejalar, interyerlar | LIDER PROF PROEKT"),
    desc: t("61 проект архитектурной студии LIDER PROF PROEKT: общественные и жилые здания, производство, генпланы, ландшафт, интерьер.", "LIDER PROF PROEKT arxitektura studiyasining 61 loyihasi: jamoat va turar joy binolari, ishlab chiqarish, bosh rejalar, landshaft, interyer."),
  }, body);
}

/* ── Страница проекта: одна на все, проект по ?id= ────────────────────── */
function projectPage(l) {
  const t = T(l);
  const data = P.map((p) => ({ id: p.id, n: p[l].n, c: p.cats.map((c) => cn(l, c)), cs: p.cats, d: p[l].d, s: p[l].s, tm: p[l].team, m: meta(l, p), img: p.img.map((x) => [x[0], x[1], x[2], x[3]]), like: likeText(l, p) }));
  const first = PM[64];
  const body = `<article class="pj" id="pj">
<section class="pj-hero dark"><div class="pj-ph" id="pj-ph"><img id="pj-main" src="${srcOf(first)}" alt="${esc(first[l].n)}" width="1280" height="720" fetchpriority="high"></div><div class="st-shade"></div><div class="wrap"><a class="back" href="${href(l, "proekty")}">← ${t("Все проекты", "Barcha loyihalar")}</a><p class="pj-c" id="pj-c"></p><h1 id="pj-n">${esc(first[l].n)}</h1><p class="pj-m" id="pj-m"></p></div></section>
<section class="pj-stats" data-addon="stats"><div class="wrap"><dl class="stats" id="pj-s"></dl></div></section>
<section><div class="wrap pj-body">
<div class="pj-txt" id="pj-d"></div>
<aside class="pj-side"><div class="glass-l pj-cta"><p class="calc-k">${t("Нужен похожий объект?", "O‘xshash obyekt kerakmi?")}</p><p>${t("Расскажите, что строите. Архитектор ответит в течение 30 минут.", "Nima qurayotganingizni ayting. Me’mor 30 daqiqa ichida javob beradi.")}</p>${tgBtn("btn-red", t("Хочу похожий проект", "O‘xshash loyiha istayman"), helloText(l), ' id="pj-like"')}</div><dl class="team" id="pj-t"></dl></aside>
</div></section>
<section class="pj-gal" id="pj-gal-s"><div class="wrap">${head("", t("Кадры проекта", "Loyiha kadrlari"), "")}<div class="gal" id="pj-gal"></div></div></section>
<section class="dark"><div class="wrap">${head(t("Ещё проекты", "Yana loyihalar"), t("Из того же направления", "Shu yo‘nalishdan"), "", `<a class="btn btn-ghost" href="${href(l, "proekty")}">${t("Все проекты", "Barcha loyihalar")}${ICON.arrow}</a>`)}<div class="pgrid" id="pj-more"></div></div></section>
</article>
<div class="lb" id="lb" role="dialog" aria-label="${t("Кадр проекта", "Loyiha kadri")}" hidden><button class="kd-x lb-x" type="button" id="lb-x" aria-label="${t("Закрыть", "Yopish")}">×</button><button class="lb-a lb-p" type="button" id="lb-p" aria-label="${t("Предыдущий", "Oldingi")}">‹</button><img id="lb-i" alt=""><button class="lb-a lb-n" type="button" id="lb-n" aria-label="${t("Следующий", "Keyingi")}">›</button></div>`;
  const extra = `<script type="application/json" id="pj-data">${JSON.stringify({ p: data, base: href(l, "proekt"), all: href(l, "proekty"), tg: F.chat }).replace(/</g, "\\u003c")}</script>`;
  return shell(l, "proekt", {
    title: t("Проект | LIDER PROF PROEKT", "Loyiha | LIDER PROF PROEKT"),
    desc: t("Проект архитектурной студии LIDER PROF PROEKT: фото, цифры и описание.", "LIDER PROF PROEKT arxitektura studiyasi loyihasi: fotolar, raqamlar va tavsif."),
  }, body, extra);
}

/* ── Что дальше: было и стало, конструктор, конкуренты, фото ──────────── */
function plan(l) {
  const t = T(l);
  const hasBa = existsSync(new URL(`../../../public${IMG}/ba-old-d.webp`, import.meta.url));
  const ba = (o, n, cap, was) => `<figure class="rv a-rise"><div class="ba-box" data-ba><img src="${IMG}/${n}" alt="${t("Прототип", "Prototip")}" loading="lazy"><div class="was"><img src="${IMG}/${o}" alt="${t("Сайт сегодня", "Bugungi sayt")}" loading="lazy"></div><span class="tag a">${t("было", "edi")}</span><span class="tag b">${t("стало", "bo‘ldi")}</span><span class="knob"><i>${ICON.arrows}</i></span><input type="range" min="0" max="100" value="50" aria-label="${t("Сравнить", "Solishtirish")}"></div><figcaption><span>${cap}</span><span>${was}</span></figcaption></figure>`;
  const comp = [
    [t("Цифры на каждом проекте", "Har bir loyihada raqamlar"), t("Лучшие бюро Ташкента пишут на проекте гектары, метры и места. У вас эти цифры уже есть в описаниях: мы вынесли их крупно на страницу проекта.", "Toshkentning eng yaxshi byurolari loyihada gektar, metr va o‘rinlarni yozadi. Sizda bu raqamlar tavsiflarda bor: biz ularni loyiha sahifasiga yirik chiqardik.")],
    [t("Фильтр по направлениям", "Yo‘nalishlar bo‘yicha saralash"), t("Застройщик ищет ЖК, хокимият ищет школы. Шесть ваших направлений стали кнопками с числом проектов.", "Quruvchi TJM qidiradi, hokimiyat maktab qidiradi. Oltita yo‘nalishingiz loyihalar soni ko‘rsatilgan tugmalarga aylandi.")],
    [t("Расчёт с планом", "Reja bilan hisob"), t("У конкурентов форма просит имя и телефон. Здесь человек сразу пишет тип, площадь и стадии, а план прикладывает в чат. Архитектор сразу получает задачу вместе с номером.", "Raqobatchilarda forma ism va telefon so‘raydi. Bu yerda odam darhol turi, maydoni va bosqichlarini yozadi, rejani esa chatga biriktiradi. Me’mor raqam bilan birga vazifani ham darhol oladi.")],
    [t("Путь по этапам", "Bosqichma-bosqich yo‘l"), t("Концепция, ТЭО, документация, надзор: заказчик видит, что будет на каждом шаге, ещё до звонка.", "Konsepsiya, TIA, hujjatlar, nazorat: buyurtmachi har qadamda nima bo‘lishini qo‘ng‘iroqdan oldin ko‘radi.")],
    [t("Заказчики на виду", "Buyurtmachilar ko‘zga tashlanadi"), t("DreamLand, NBU, SQB, Минстрой: такие имена у конкурентов стоят на первом экране. У вас они были в конце страницы.", "DreamLand, NBU, SQB, Qurilish vazirligi: raqobatchilarda bunday nomlar birinchi ekranda turadi. Sizda ular sahifa oxirida edi.")],
    [t("Один номер везде", "Hamma joyda bitta raqam"), t("Сейчас в шапке написан 305-09-99, а нажатие звонит на 306-09-99. Здесь оба номера подписаны, и кнопка звонит туда, что написано.", "Hozir sarlavhada 305-09-99 yozilgan, bosilganda esa 306-09-99 ga qo‘ng‘iroq qiladi. Bu yerda ikkala raqam yozilgan va tugma yozilgan raqamga qo‘ng‘iroq qiladi.")],
  ];
  const body = `<section class="phead dark"><div class="wrap"><span class="kicker"><i></i>${t("Предложение DevUz Studio для LIDER PROF PROEKT", "DevUz Studio’ning LIDER PROF PROEKT uchun taklifi")}</span><h1>${hasBa ? t("Было и стало", "Edi va bo‘ldi") : t("Что дальше", "Keyingi qadam")}</h1><p class="lead">${hasBa ? t("Слева lider-prof.uz сегодня, справа этот прототип. Тяните шторку.", "Chapda bugungi lider-prof.uz, o‘ngda shu prototip. Pardani torting.") : t("Конструктор, что взяли у конкурентов и откуда снимки.", "Konstruktor, raqobatchilardan nima oldik va suratlar qayerdan.")}</p></div></section>
${hasBa ? `<section class="dark" style="padding-top:0"><div class="wrap"><div class="ba">
${ba("ba-old-d.webp", "ba-new-d.webp", t("Компьютер · первый экран", "Kompyuter · birinchi ekran"), t("было: затемнённый кадр и общие слова", "edi: qoraytirilgan kadr va umumiy so‘zlar"))}
${ba("ba-old-m.webp", "ba-new-m.webp", t("Телефон · первый экран", "Telefon · birinchi ekran"), t("было: ни одной цифры о проекте", "edi: loyiha haqida bironta raqam yo‘q"))}
</div></div></section>` : ""}
<section id="konstruktor"><div class="wrap">
${head(t("Конструктор проекта", "Loyiha konstruktori"), t("Соберите сайт под свой бюджет", "Saytni byudjetingizga moslab yig‘ing"), t("Сайт стоит 1 700 $. Остальное включается тумблером: включили блок, и он появляется на странице, итог пересчитывается. Со всеми допами 3 000 $.", "Sayt 1 700 $ turadi. Qolgani tumbler bilan yoqiladi: blokni yoqsangiz, u sahifada paydo bo‘ladi, jami qayta hisoblanadi. Barcha qo‘shimchalar bilan 3 000 $."))}
<div class="kit">
<div class="kit-list">
<div class="kit-base"><div><b>${KIT_BASE[l].t}</b><p>${KIT_BASE[l].d}</p></div><span class="kit-price num">${usd(KIT_BASE.price)}</span></div>
<h3 class="kit-g">${t("Допы на сайте", "Saytdagi qo‘shimchalar")}</h3>
${ADDONS.map((a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="${(a.needs || []).join(" ")}" data-def checked><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}</b><small>${a[l].e}</small></span><span class="kit-price num">${usd(a.price)}</span></label>`).join("")}
<h3 class="kit-g">${t("Сверх сайта", "Saytdan tashqari")}</h3>
${BLOCKS.map((b) => `<label class="kit-row"><input type="checkbox" data-k="${b.id}" data-p="${b.price}" data-needs="" data-def checked><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${b[l].t}</b><small>${b[l].why}</small><span class="kit-li">${b[l].li.map((x) => `<em>${x}</em>`).join("")}</span></span><span class="kit-price num">${usd(b.price)}</span></label>`).join("")}
</div>
<div class="kit-side">
<div class="kit-total"><small>${t("Итого с сайтом", "Sayt bilan jami")}</small><b class="num" id="kit-sum"></b><small id="kit-n"></small><a class="btn btn-white" href="https://t.me/Devuz_studio_bot?start=lider-prof">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a></div>
<p class="src">${t("Цены по середине рынка Ташкента: корпоративный сайт на двух языках с управлением у студий стоит примерно от 800 до 2 000 $, с расчётом, 3D и админкой от 2 000 $.", "Narxlar Toshkent bozorining o‘rtasi bo‘yicha: studiyalarda boshqaruvli ikki tilli korporativ sayt taxminan 800 dan 2 000 $ gacha, hisob, 3D va admin panel bilan 2 000 $ dan turadi.")}</p>
</div>
</div>
</div></section>
<section id="konkurenty" style="padding-top:0"><div class="wrap">
${head(t("Что взяли у конкурентов", "Raqobatchilardan nima oldik"), t("Сильное у архитектурных бюро Узбекистана", "O‘zbekiston arxitektura byurolarining kuchli tomonlari"), "")}
<div class="grid3">${comp.map(([h, p], k) => `<div class="note rv a-rise" style="--d:${(k % 3) * 80}ms"><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>
<section id="foto"><div class="wrap">
${head(t("Изображения в прототипе", "Prototipdagi rasmlar"), t("Откуда снимки", "Suratlar qayerdan"), "")}
<ul class="credits"><li>${t("Все визуализации проектов взяты с lider-prof.uz, раздел «Проекты». Мы ничего не дорисовывали и не увеличивали.", "Barcha loyiha vizualizatsiyalari lider-prof.uz saytining «Loyihalar» bo‘limidan olingan. Biz hech narsa chizmadik va kattalashtirmadik.")}</li><li>${t("Чертёж в главе «Проект» получен кодом из вашего же рендера спорткорпуса Олимпийского центра: линии фасада выделены, цвета убраны.", "«Loyiha» bobidagi chizma Olimpiya markazi sport binosining o‘z renderingizdan kod bilan olingan: fasad chiziqlari ajratilgan, ranglar olib tashlangan.")}</li><li>${t("Логотип LIDER PROF PROEKT перерисован в вектор по файлу с сайта. Логотипы заказчиков из блока «Нам доверяют». Контур Узбекистана: Natural Earth, общественное достояние.", "LIDER PROF PROEKT logotipi saytdagi fayl bo‘yicha vektorga qayta chizildi. Buyurtmachilar logotiplari «Bizga ishonishadi» blokidan. O‘zbekiston konturi: Natural Earth, jamoat mulki.")}</li><li>${t("Анимации по мотивам компонентов с 21st.dev под MIT: Magic UI (Marquee, Shimmer Button, Border Beam, Magic Card, Number Ticker), motion-primitives (Tilt). Код свой.", "Animatsiyalar 21st.dev’dagi MIT komponentlari asosida: Magic UI (Marquee, Shimmer Button, Border Beam, Magic Card, Number Ticker), motion-primitives (Tilt). Kod o‘zimizniki.")}</li></ul>
</div></section>`;
  return shell(l, "plan", {
    title: t("Что дальше: конструктор сайта | LIDER PROF PROEKT", "Keyingi qadam: sayt konstruktori | LIDER PROF PROEKT"),
    desc: t("Конструктор: сайт 1 700 $, со всеми допами 3 000 $. Что взяли у конкурентов и откуда снимки.", "Konstruktor: sayt 1 700 $, barcha qo‘shimchalar bilan 3 000 $. Raqobatchilardan nima oldik va suratlar qayerdan."),
  }, body);
}

const BUILD = { "": home, proekty: projectsPage, proekt: projectPage, plan };
const out = {};
for (const l of ["ru", "uz"]) {
  const pre = l === "uz" ? "uz" : "";
  for (const p of Object.keys(BUILD)) out[pre ? pre + (p ? "/" + p : "") : p] = BUILD[p](l);
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
writeFileSync(bundleDir + "lider-prof.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(main)").padEnd(12), v.length);
