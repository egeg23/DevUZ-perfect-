import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { ADDONS, BASE as KIT_BASE, BLOCKS } from "./plan.mjs";
import { DOTS, EYE, LETTERS, W as LW, H as LH, logoSvg, logoSprite, markSvg } from "./logo.mjs";
import { surfaceSvg, sectionSvg, cellsHtml, bubblesHtml, XS, XS_SPOTS, MOLE, PAPILLOMA } from "./art.mjs";
import { CATS, ITEMS } from "./prices.mjs";

/*
 * Прототип Asmo Clinic (asmoclinic.uz): частная дерматологическая клиника в
 * Ташкенте, Мирабадский район. Собран на движке LIDER PROF PROEKT
 * (scripts/protos/lider-prof): заставка с промо DevUz Studio, история при
 * прокрутке по Engelberg v2, жидкое стекло, конструктор цены, «было / стало».
 * Две страницы на двух языках (ru, uz): главная и «Что дальше».
 * Исследование и конкуренты — docs/research/asmo.md, снимки — SOURCES.md.
 *
 * Всё о клинике — только с asmoclinic.uz (снято 13.10.2026): с 2021 года,
 * 5+ лет опыта, 100 000+ пациентов, 20+ специалистов, три направления и
 * процедуры, методы диагностики, стационар с палатами (Wi-Fi, телевизор),
 * узкие специалисты, четыре этапа лечения, цитата на первом экране, вопросы,
 * контакты, часы, соцсети. Цен на их сайте нет: в конструкторе лечения стоит
 * середина рынка Ташкента с подписью «ориентир по рынку».
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/asmo";
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
/* Выключенный в конструкторе доп прячется до первой отрисовки: класс
   k-no-<id> ставит скрипт в <head> по сохранённому выбору. */
const OFF = ADDONS.map((a) => `.k-no-${a.id} [data-addon="${a.id}"]{display:none!important}`).join("");
const CSS = strip(readFileSync(DIR + "style.css", "utf8") + OFF).replace(/\n\s*/g, "").replace(/__IMG__/g, IMG);
const INTRO = strip(readFileSync(DIR + "intro.js", "utf8"));
const STORY = strip(readFileSync(DIR + "story.js", "utf8"));
const JS = strip(readFileSync(DIR + "client.js", "utf8"));
const BASE = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Literata:ital,wght@0,400;0,700;1,400&family=Onest:wght@400;700&display=swap";

const usd = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
const sum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, path = "") => BASE + (l === "uz" ? "/uz" : "") + (path ? "/" + path : "");
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);

/* ── Факты с их сайта ─────────────────────────────────────────────────── */
const F = {
  name: "Asmo Clinic",
  phone: "+998555018866",
  phoneT: "+998 55 501 88 66",
  phone2: "+998909962370",
  phone2T: "+998 90 996 23 70",
  email: "clinicasmo@gmail.com",
  addr: { ru: "Ташкент, Мирабадский район, ул. Фергана Йули, 708", uz: "Toshkent, Mirobod tumani, Farg‘ona yo‘li, 708" },
  /* Кнопка чата на каждой странице их сайта ведёт в t.me/asmo_clinic: туда и
     уходит запись. Канал t.me/dermatovenerologia — в подвале. */
  chat: "https://t.me/asmo_clinic",
  hours: { ru: "пн-сб 9:00-18:00, вс выходной", uz: "du-sh 9:00-18:00, yakshanba dam olish" },
  channel: "https://t.me/dermatovenerologia",
  ig: "https://www.instagram.com/asmoclinic",
  fb: "https://www.facebook.com/asmo.clinic",
  map: "https://yandex.uz/maps/-/CLtdrQKA",
  site: "https://asmoclinic.uz",
};

/* Цифры — блок на первом экране и «О нас». */
const NUM = [
  [5, "+", { ru: "лет опыта", uz: "yillik tajriba" }],
  [100000, "+", { ru: "успешно вылеченных пациентов", uz: "muvaffaqiyatli davolangan bemorlar" }],
  [20, "+", { ru: "квалифицированных специалистов", uz: "malakali mutaxassislar" }],
];

/* Этапы лечения — блок «Этапы лечения в клинике Асмо». */
const STAGES = [
  { ru: ["Консультация", "Консультация у квалифицированных врачей"], uz: ["Konsultatsiya", "Malakali shifokorlardan konsultatsiya"] },
  { ru: ["Анализ", "Точные и качественные анализы на основе современных технологий"], uz: ["Analiz", "Zamonaviy texnologiyalar asosida aniq va sifatli tahlillar"] },
  { ru: ["Диагноз", "Диагноз ставят врачи клиники по осмотру и анализам"], uz: ["Diagnoz", "Tashxisni klinika shifokorlari ko‘rik va tahlillar bo‘yicha qo‘yadi"] },
  { ru: ["Лечение", "Стационарное или амбулаторное лечение, подходящее для пациента"], uz: ["Davolash", "Bemorga mos statsionar yoki ambulator davolash"] },
];

/* Направления — раздел «Услуги» и «О нас». */
const DIRS = [
  { id: "derm", ic: "derm", ru: ["Дерматология", "Лечение кожных заболеваний", "Акне, экзема, псориаз, кожные инфекции, удаление родинок и других новообразований, профилактические осмотры."], uz: ["Dermatologiya", "Teri kasalliklarini davolash", "Akne, ekzema, psoriaz, teri infeksiyalari, xol va boshqa o‘smalarni olib tashlash, profilaktik ko‘riklar."] },
  { id: "cosm", ic: "cosm", ru: ["Косметология", "Эстетические процедуры", "Эпиляция, мезотерапия, химический пилинг, криотерапия: для красоты и здоровья кожи."], uz: ["Kosmetologiya", "Estetik muolajalar", "Epilyatsiya, mezoterapiya, kimyoviy piling, kriyoterapiya: go‘zallik va teri sog‘lig‘i uchun."] },
  { id: "phys", ic: "phys", ru: ["Физиотерапия", "Физиотерапевтические процедуры", "Озонотерапия, ИЛБИ, ПУВА-терапия, УФ-терапия, Дарсонваль, криотерапия, ионизирующий душ."], uz: ["Fizioterapiya", "Fizioterapiya muolajalari", "Ozon terapiyasi, ILBI, PUVA terapiyasi, UV terapiyasi, Darsonval, kriyoterapiya, ionlashtiruvchi dush."] },
  { id: "diag", ic: "scope", ru: ["Диагностика", "Современные методы", "Дерматоскопия, трихоскопия, морфологическое исследование. Сначала точный диагноз, потом лечение."], uz: ["Diagnostika", "Zamonaviy usullar", "Dermatoskopiya, trixoskopiya, morfologik tekshiruv. Avval aniq tashxis, keyin davolash."] },
  { id: "hair", ic: "hair", ru: ["Трансплантация волос", "И трихология", "Пересадка волос и трихоскопия: смотрим кожу головы и волосы под увеличением."], uz: ["Soch transplantatsiyasi", "Va trixologiya", "Soch ko‘chirib o‘tkazish va trixoskopiya: bosh terisi va sochni kattalashtirib ko‘ramiz."] },
  { id: "stac", ic: "bed", ru: ["Стационар", "И амбулаторно", "Для стационарных пациентов комфортные палаты: Wi-Fi, телевизор. Лечение подбирают под пациента."], uz: ["Statsionar", "Va ambulator", "Statsionar bemorlar uchun qulay palatalar: Wi-Fi, televizor. Davolash bemorga moslab tanlanadi."] },
];

/* Узкие специалисты — «О нас» (ru) и «Biz haqimizda» (uz, там ещё трихология, УЗИ, лаборатория). */
const SPEC = [
  ["derm", "Дерматолог", "Dermatolog"], ["cosm", "Косметолог", "Kosmetolog"], ["hair", "Трихолог", "Trixolog"], ["kid", "Педиатр", "Pediatr"],
  ["steth", "Терапевт", "Terapevt"], ["tooth", "Стоматолог", "Stomatolog"], ["endo", "Эндокринолог", "Endokrinolog"], ["uzi", "УЗИ", "UZD"], ["lab", "Лаборатория", "Laboratoriya"],
];

/* Физиотерапия — для главы «Свет». */
const PHYS = [["Озонотерапия", "Ozon terapiyasi"], ["ИЛБИ", "ILBI"], ["ПУВА-терапия", "PUVA terapiyasi"], ["УФ-терапия", "UV terapiyasi"], ["Дарсонваль", "Darsonval"], ["Криотерапия", "Kriyoterapiya"], ["Ионизирующий душ", "Ionlashtiruvchi dush"]];

/* Цитата с первого экрана их сайта. */
const QUOTE = {
  ru: "Будьте заботливы и хорошо относитесь к своей коже. Вы будете носить её каждый день до конца вашей жизни.",
  uz: "Teriningizga mehr bilan g‘amxo‘rlik qiling va unga yaxshi munosabatda bo‘ling. Siz uni hayotingizning oxirigacha har kuni olib yurasiz.",
  by: { ru: "Рене Руло", uz: "Rene Rouleau" },
};

/* Иконки — контуры 24×24, по смыслу. */
const I = (d, w = 1.6) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/><path d="m9 13 9-7"/>'),
  phone: I('<path d="M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2z"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  arrows: I('<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  derm: I('<path d="M3 15c3-2 6-2 9 0s6 2 9 0"/><path d="M3 19c3-2 6-2 9 0s6 2 9 0"/><circle cx="9" cy="8" r="2"/><circle cx="16" cy="6" r="1.2"/>'),
  cosm: I('<path d="M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-4 3-6 6-10z"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5"/>'),
  phys: I('<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>'),
  scope: I('<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/><circle cx="10" cy="10" r="2" fill="currentColor" stroke="none"/>'),
  hair: I('<path d="M7 21c0-6 1-11 5-18"/><path d="M12 21c0-6 1-11 5-18"/><path d="M17 21c0-5 .5-8 2-11"/>'),
  bed: I('<path d="M3 19V7M21 19v-6a3 3 0 0 0-3-3h-8v5"/><path d="M3 13h18"/><circle cx="6.5" cy="10" r="1.6"/>'),
  kid: I('<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/><path d="M10 8h.01M14 8h.01"/>'),
  steth: I('<path d="M6 3v5a5 5 0 0 0 10 0V3"/><path d="M11 13v3a4 4 0 0 0 8 0v-2"/><circle cx="19" cy="12" r="2"/>'),
  tooth: I('<path d="M7 3c-3 0-4 3-3 6s1 6 2 9 3 3 3 0 1-4 3-4 2 4 3 4 2-1 2-3 1-6 2-9-1-6-4-6-3 1-5 1-2-1-5-1z"/>'),
  endo: I('<path d="M8 4c-2 3-2 6 0 8M16 4c2 3 2 6 0 8"/><path d="M8 12c1.5 2 6.5 2 8 0"/><path d="M12 14v7"/>'),
  uzi: I('<path d="M4 20 12 6l8 14"/><path d="M7 15c3-2 7-2 10 0"/><path d="M9 18c2-1 4-1 6 0"/>'),
  lab: I('<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7 15h10"/>'),
  wifi: I('<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>'),
  tv: I('<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  minus: I('<path d="M5 12h14"/>'),
  ig: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>'),
};

/* Логотип DevUz Studio для заставки — тот же, что в промо на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZMARK = `<svg class="dz-mark" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

const PAGE_NAMES = { "": ["Главная", "Bosh sahifa"], plan: ["Что дальше", "Keyingi qadam"] };
const pn = (l, k) => PAGE_NAMES[k][l === "ru" ? 0 : 1];

/* ── Сообщения в Telegram клиники ─────────────────────────────────────── */
const tgBtn = (cls, label, text, extra = "") => `<a class="btn ${cls}" href="${F.chat}" data-tg="${esc(text)}"${extra}>${ICON.tg}<span>${label}</span></a>`;
const helloText = (l) => (l === "ru" ? "Здравствуйте! Хочу записаться на приём в Asmo Clinic." : "Assalomu alaykum! Asmo Clinic’da qabulga yozilmoqchiman.");

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
${group(t("На всех страницах", "Barcha sahifalarda"), "", ADDONS.filter((a) => a.where === "all").map((a) => kdRow(l, a)))}
${group(t("Сверх сайта", "Saytdan tashqari"), `<a href="${href(l, "plan")}#konstruktor">${t("что это", "bu nima")} →</a>`, BLOCKS.map((b) => kdRow(l, { ...b, [l]: { t: b[l].t } })))}
</div>
<footer class="kd-f">
<div class="kd-line"><span>${t("Сайт", "Sayt")}</span><span class="num">${usd(KIT_BASE.price)}</span></div>
<div class="kd-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kd-n"></span></span><span class="num" id="kd-add"></span></div>
<div class="kd-line kd-tot"><span>${t("Итого разово", "Jami bir martalik")}</span><b class="num" id="kd-sum"></b></div>
<a class="btn btn-pri" href="https://t.me/Devuz_studio_bot?start=asmo">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
<div class="kd-btns"><button class="copy" type="button" id="kd-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button><button class="copy" type="button" id="kd-reset">${t("Сбросить", "Qayta tiklash")}</button></div>
</footer>
</aside>`;
}

/* ── Заставка: промо DevUz Studio → точки знака Asmo собираются → влёт в голубой круг ── */
function introHtml(l) {
  const t = T(l);
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  const data = { dots: DOTS, letters: LETTERS, w: LW, h: LH, eye: [EYE.x, EYE.y, EYE.r] };
  return `<div class="intro" id="intro" role="presentation" data-addon="intro">
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZMARK}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t("прототип для Asmo Clinic", "Asmo Clinic uchun prototip")}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<canvas class="am-cv" aria-hidden="true" data-logo="${esc(JSON.stringify(data))}"></canvas>
<div class="am-cap"><b>${t("Дерматология · Ташкент", "Dermatologiya · Toshkent")}</b><span>${t("с 2021 года", "2021-yildan beri")}</span></div>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish")}</button>
</div>`;
}

/* Фильтр преломления для «жидкого стекла»: шум смещает то, что под
   стеклом. Понимает только Chromium, остальным хватает размытия. */
const LQ = `<svg class="lq-defs" aria-hidden="true" focusable="false"><filter id="lq" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.019" numOctaves="2" result="n"/><feGaussianBlur in="n" stdDeviation="2.5" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="22" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;

/* Цвет страницы между блоками: слои во весь экран, скрипт плавно меняет их
   прозрачность по тому, какой блок на экране (только opacity). */
const TONES = ["ink", "mint", "sea", "skin", "cream", "deep"];
const bgfx = `<div class="bgfx" aria-hidden="true">${TONES.map((k) => `<i class="tn-${k}" data-tone="${k}"></i>`).join("")}</div>`;

/* ── Каркас ───────────────────────────────────────────────────────────── */
function shell(l, path, meta, body, extra = "") {
  const t = T(l);
  const other = l === "ru" ? "uz" : "ru";
  const isHome = path === "";
  const nav = [[href(l) + "#uslugi", t("Услуги", "Xizmatlar")], [href(l) + "#zapis", t("Запись", "Yozilish")], [href(l) + "#ceny", t("Цены", "Narxlar")], [href(l) + "#kontakty", t("Контакты", "Kontaktlar")]];
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#06171d">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="alternate" hreflang="${other}" href="${href(other, path)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=${isHome ? "false" : "true"};try{if(sessionStorage.getItem('am-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}try{var k=JSON.parse(localStorage.getItem('am-kit-v1')||'{}');for(var x in k)if(k[x]===false)r.classList.add('k-no-'+x);if(k.intro===false)off=true}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "MedicalClinic", name: F.name, url: F.site, telephone: F.phone, email: F.email, medicalSpecialty: "Dermatology", address: { "@type": "PostalAddress", streetAddress: F.addr.ru, addressLocality: "Ташкент", addressCountry: "UZ" }, geo: { "@type": "GeoCoordinates", latitude: 41.250632, longitude: 69.323042 }, openingHours: "Mo-Sa 09:00-18:00", foundingDate: "2021", sameAs: [F.ig, F.fb, F.channel] })}</script>
</head>
<body class="${isHome ? "home hd-dark" : "inner"}" data-page="${path}" data-lang="${l}">
${LQ}
${logoSprite()}
${bgfx}
${isHome ? introHtml(l) : ""}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top"><div class="wrap">
<a class="logo" href="${href(l)}">${logoSvg("", "Asmo Clinic")}</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}<a href="${href(l, "plan")}"${path === "plan" ? ' aria-current="page"' : ""}>${pn(l, "plan")}</a></nav>
<div class="top-r"><div class="lang"><a href="${href("ru", path)}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz", path)}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>
<a class="btn btn-pri btn-sm top-cta" href="${href(l)}#zapis">${t("Записаться", "Yozilish")}</a></div>
</div></header>
<main id="main">
${body}
</main>
<footer class="foot" id="kontakty-f" data-tone="deep"><div class="wrap">
<div class="cols">
<div><span class="f-logo">${logoSvg()}</span><p>${t("Современная клиника с 2021 года: лечение кожи, физиотерапия и профессиональный уход за здоровьем.", "2021-yildan zamonaviy klinika: teri kasalliklarini davolash, fizioterapiya va sog‘liq uchun professional g‘amxo‘rlik.")}</p></div>
<div><b>${t("На связи", "Aloqada")}</b><ul><li><a href="${F.chat}">Telegram @asmo_clinic</a></li><li><a href="tel:${F.phone}">${F.phoneT}</a></li><li><a href="tel:${F.phone2}">${F.phone2T}</a></li><li><a href="mailto:${F.email}">${F.email}</a></li><li><a href="${F.ig}">Instagram</a> · <a href="${F.channel}">${t("Канал в Telegram", "Telegram kanal")}</a> · <a href="${F.fb}">Facebook</a></li></ul></div>
<div><b>${t("Клиника", "Klinika")}</b><ul><li>${F.addr[l]}</li><li>${F.hours[l]}</li><li><a href="${F.map}">${t("Открыть на карте", "Xaritada ochish")}</a></li></ul></div>
</div>
<div class="rights"><span>${t("Это прототип: так может выглядеть новый сайт Asmo Clinic. Направления, процедуры, цифры, этапы лечения, цитата и контакты взяты с asmoclinic.uz (13.10.2026). Блоки с пометкой «Предложение DevUz Studio» придумали мы, на сайте их пока нет. Цены в конструкторе лечения: ориентир по рынку Ташкента, не цены клиники. Откуда изображения:", "Bu prototip: yangi Asmo Clinic sayti shunday ko‘rinishi mumkin. Yo‘nalishlar, muolajalar, raqamlar, davolash bosqichlari, iqtibos va kontaktlar asmoclinic.uz’dan olingan (13.10.2026). «DevUz Studio taklifi» belgisi bor bloklarni biz o‘ylab topdik, ular hozircha saytda yo‘q. Davolash konstruktoridagi narxlar: Toshkent bozori bo‘yicha mo‘ljal, klinika narxlari emas. Rasmlar qayerdan:")} <a href="${href(l, "plan")}#foto">${pn(l, "plan")}</a>.</span><span>${t("Прототип принадлежит DevUz Studio. Использовать его можно только по договору:", "Prototip DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari")}</a></span></div>
</div></footer>
<div class="dock" id="dock"><a class="btn btn-pri" href="${href(l)}#zapis">${ICON.clock}<span>${t("Записаться на приём", "Qabulga yozilish")}</span></a><a class="btn btn-ghost dock-call" href="tel:${F.phone}" aria-label="${t("Позвонить", "Qo‘ng‘iroq qilish")}">${ICON.phone}</a></div>
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
    kitTg: ru ? "Состав нового сайта Asmo Clinic из конструктора:" : "Konstruktordan yangi Asmo Clinic sayti tarkibi:",
    kitBaseName: KIT_BASE[l].t,
    kitTotal: ru ? "Итого" : "Jami",
    copied: ru ? "Скопировано" : "Nusxalandi",
    sent: ru ? "Текст скопирован. Открываем Telegram клиники, вставьте его в чат." : "Matn nusxalandi. Klinika Telegrami ochilmoqda, uni chatga qo‘ying.",
    som: ru ? "сум" : "so‘m",
    days: ru ? ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] : ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"],
    months: ru ? ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"] : ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"],
    today: ru ? "сегодня" : "bugun",
    tomorrow: ru ? "завтра" : "ertaga",
    bHead: ru ? "Запись с сайта Asmo Clinic" : "Asmo Clinic saytidan yozilish",
    bDir: ru ? "Направление" : "Yo‘nalish",
    bWhen: ru ? "Когда" : "Qachon",
    bName: ru ? "Имя" : "Ism",
    bPhone: ru ? "Телефон" : "Telefon",
    bNote: ru ? "Что беспокоит" : "Nima bezovta qiladi",
    bNeed: ru ? "Оставьте телефон: без него администратору некуда перезвонить." : "Telefon qoldiring: usiz administrator qo‘ng‘iroq qila olmaydi.",
    bSlot: ru ? "Выберите день и время." : "Kun va vaqtni tanlang.",
    pick: ru ? "Выбрано: {d}, {t}" : "Tanlandi: {d}, {t}",
    cHead: ru ? "Хочу на лечение в Asmo Clinic. Что выбрал в конструкторе:" : "Asmo Clinic’da davolanmoqchiman. Konstruktorda tanlaganlarim:",
    cTotal: ru ? "Ориентир по рынку: {s} сум. Подскажите вашу цену и свободное время." : "Bozor bo‘yicha mo‘ljal: {s} so‘m. Narxingiz va bo‘sh vaqtni ayting.",
    cNone: ru ? "Отметьте хотя бы одну процедуру." : "Kamida bitta muolajani belgilang.",
    cN: ru ? "{n} процедур" : "{n} ta muolaja",
    empty: ru ? "не указано" : "ko‘rsatilmagan",
    img: IMG,
  };
}

/* ── Куски страниц ────────────────────────────────────────────────────── */
const head = (kicker, h, lead, side = "", anim = "cell") => `<div class="sec-head rv a-${anim}"><div>${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>${side}</div>`;
const ours = (l) => `<span class="ours">${T(l)("Предложение DevUz Studio", "DevUz Studio taklifi")}</span>`;

/* ── История при прокрутке ────────────────────────────────────────────── */
function storyBlock(l) {
  const t = T(l);
  const chapters = [[0, "Asmo Clinic"], [1.9, t("Под дерматоскопом", "Dermatoskop ostida")], [6.4, t("Вглубь кожи", "Teri ichiga")], [11.4, t("Свет и физиотерапия", "Yorug‘lik va fizioterapiya")], [14.4, t("Четыре этапа", "To‘rt bosqich")], [17.4, t("Специалисты", "Mutaxassislar")], [20.2, t("Запись", "Yozilish")]];
  const beat = (a, b, k, h, p, extra = "") => `<div class="st-beat" data-beat="${a} ${b}"><span class="kicker" data-line><i></i>${k}</span><h2 data-line>${h}</h2>${p ? `<p data-line>${p}</p>` : ""}${extra}</div>`;
  const spot = (k, ru, uz) => `<i class="hs" data-k="${k}" data-x="${XS_SPOTS[k][0]}" data-y="${XS_SPOTS[k][1]}"><b></b><span>${t(ru, uz)}</span></i>`;
  const orbit = SPEC.map(([ic, ru, uz], k) => `<li class="orb" data-orb="${k}"><span>${ICON[ic]}</span><b>${t(ru, uz)}</b></li>`).join("");
  const statics = [
    [t("Под дерматоскопом", "Dermatoskop ostida"), t("Дерматоскопия, трихоскопия и морфологическое исследование: сначала точный диагноз. Удаляем папилломы, кератомы, кондиломы, бородавки и родинки.", "Dermatoskopiya, trixoskopiya va morfologik tekshiruv: avval aniq tashxis. Papilloma, keratoma, kondiloma, so‘gal va xollarni olib tashlaymiz.")],
    [t("Вглубь кожи", "Teri ichiga"), t("Акне, экзема и псориаз, волосы и пересадка волос, эпиляция, мезотерапия и пилинг, ИЛБИ и озонотерапия.", "Akne, ekzema va psoriaz, soch va soch ko‘chirish, epilyatsiya, mezoterapiya va piling, ILBI va ozon terapiyasi.")],
    [t("Свет и физиотерапия", "Yorug‘lik va fizioterapiya"), PHYS.map((p) => p[l === "ru" ? 0 : 1]).join(", ") + "."],
    [t("Четыре этапа лечения", "Davolashning to‘rt bosqichi"), STAGES.map((s) => s[l][0]).join(", ") + "."],
  ];
  return `<section class="story" id="story" data-tone="ink" data-end="21.4" data-chapters="${esc(JSON.stringify(chapters))}" data-xs="${XS.w} ${XS.h}" data-mole="${MOLE.join(" ")}" data-pap="${PAPILLOMA.join(" ")}" aria-label="${t("Asmo Clinic: от поверхности кожи вглубь", "Asmo Clinic: teri yuzasidan ichkariga")}">
<div class="st-track"><div class="st-stage" id="hero">

<div class="st-layer st-hero" data-k="hero"><div class="cells" data-k="cells">${cellsHtml()}</div><div class="hero-mark" data-k="heroMark">${markSvg("hm-svg")}</div>
<div class="nums glass lq" data-k="nums">${NUM.map(([n, s, x], k) => `<div class="nm"><b class="num" data-count="${n}" data-plus="${s}" data-k="cnt${k}">${sum(n)}${s}</b><span>${x[l]}</span></div>`).join("")}</div></div>

<div class="st-layer st-skin" data-k="skin"><div class="sk-cam" data-k="skCam">${surfaceSvg(false, "sa")}</div>
<div class="lens" data-k="lens"><div class="lens-in" data-k="lensIn">${surfaceSvg(true, "sb")}</div><i class="lens-rim"></i><span class="lens-x">${t("Дерматоскоп", "Dermatoskop")}</span></div>
<i class="tag" data-k="tagMole"><b></b><span>${t("Родинка: смотрим рисунок", "Xol: naqshini ko‘ramiz")}</span></i>
<i class="tag" data-k="tagPap"><b></b><span>${t("Папиллома: удаляем", "Papilloma: olib tashlaymiz")}</span></i></div>

<div class="st-layer st-xs" data-k="xs"><div class="xs-cam" data-k="xsCam">${sectionSvg()}</div>
${spot("epi", "Эпидермис · акне, экзема, псориаз", "Epidermis · akne, ekzema, psoriaz")}${spot("hair", "Волос · трихоскопия, пересадка, эпиляция", "Soch · trixoskopiya, ko‘chirish, epilyatsiya")}${spot("derm", "Дерма · мезотерапия, пилинг", "Derma · mezoterapiya, piling")}${spot("vessel", "Сосуды · ИЛБИ, озонотерапия", "Tomirlar · ILBI, ozon terapiyasi")}${spot("fat", "Подкожный слой", "Teri osti qatlami")}</div>

<div class="st-layer st-light" data-k="light"><div class="lamp" data-k="lamp"><i></i></div><div class="rays" data-k="rays">${Array.from({ length: 7 }, (_, k) => `<i style="--r:${(k - 3) * 9}deg" data-ray="${k}"></i>`).join("")}</div><div class="bubbles">${bubblesHtml()}</div><svg class="arc" viewBox="0 0 1600 400" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="arcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1c7b3"/><stop offset="1" stop-color="#d9997f"/></linearGradient></defs><path d="M0 220C400 120 1200 120 1600 220V400H0Z" fill="url(#arcg)"/></svg>
<ol class="phys glass lq" data-k="phys">${PHYS.map((p, k) => `<li data-k="ph${k}"><i></i>${p[l === "ru" ? 0 : 1]}</li>`).join("")}</ol></div>

<div class="st-layer st-stages" data-k="stages"><div class="sg-line"><i data-k="sgLine"></i></div><ol class="sg">${STAGES.map((s, k) => `<li data-k="sg${k}"><b class="num">0${k + 1}</b><h3>${s[l][0]}</h3><p>${s[l][1]}</p></li>`).join("")}</ol></div>

<div class="st-layer st-team" data-k="team"><div class="orbit" data-k="orbit"><div class="orbit-c">${markSvg("oc-svg")}<p><b class="num" data-k="team20">20+</b><span>${t("специалистов", "mutaxassis")}</span></p></div><ul class="orbs">${orbit}</ul></div></div>

<div class="st-layer st-end" data-k="end"><div class="end-in">${logoSvg("end-logo")}<p>${t("Лечение кожи, физиотерапия и профессиональный уход за здоровьем", "Teri kasalliklarini davolash, fizioterapiya va sog‘liq uchun professional g‘amxo‘rlik")}</p></div></div>

<div class="st-text">
<div class="st-beat st-first" data-beat="-1 1.7"><span class="kicker" data-line><i></i>${t("Дерматологическая клиника · Ташкент · с 2021 года", "Dermatologiya klinikasi · Toshkent · 2021-yildan")}</span><h1 data-line>${t("Кожа, которую вы носите <em>каждый день</em>", "Har kuni olib yuradigan <em>teringiz</em>")}</h1><p data-line>${t("Диагностика и лечение кожи, косметология, физиотерапия и трансплантация волос. Стационар и амбулаторно, более 20 специалистов.", "Terini tashxislash va davolash, kosmetologiya, fizioterapiya va soch transplantatsiyasi. Statsionar va ambulator, 20 dan ortiq mutaxassis.")}</p><div class="cta" data-line><a class="btn btn-pri shim" href="#zapis">${ICON.clock}<span>${t("Записаться на приём", "Qabulga yozilish")}</span></a><a class="btn btn-ghost" href="tel:${F.phone}">${ICON.phone}<span>${F.phoneT}</span></a></div></div>
${beat(2.1, 4.2, t("01 · Диагностика", "01 · Diagnostika"), t("Сначала смотрим под увеличением", "Avval kattalashtirib ko‘ramiz"), t("Дерматоскопия показывает рисунок родинки, трихоскопия показывает кожу головы и волосы. Морфологическое исследование подтверждает диагноз.", "Dermatoskopiya xol naqshini, trixoskopiya bosh terisi va sochni ko‘rsatadi. Morfologik tekshiruv tashxisni tasdiqlaydi."))}
${beat(4.4, 6.4, t("02 · Новообразования", "02 · O‘smalar"), t("Папилломы, кератомы, кондиломы, бородавки", "Papilloma, keratoma, kondiloma, so‘gallar"), t("Удаляем доброкачественные новообразования и родинки современными методами.", "Xavfsiz o‘smalar va xollarni zamonaviy usullar bilan olib tashlaymiz."))}
${beat(6.8, 9, t("03 · Вглубь кожи", "03 · Teri ichiga"), t("У каждого слоя своё лечение", "Har bir qatlamning o‘z davolashi"), t("Акне, экзема, псориаз и кожные инфекции живут в верхнем слое. Глубже волосы, сосуды и то, с чем работают мезотерапия и пилинг.", "Akne, ekzema, psoriaz va teri infeksiyalari yuqori qatlamda. Chuqurroqda soch, tomirlar va mezoterapiya hamda piling ishlaydigan qatlam."))}
${beat(9.2, 11.2, t("04 · Волосы", "04 · Soch"), t("Трихоскопия и пересадка волос", "Trixoskopiya va soch ko‘chirish"), t("Смотрим волос от кожи до луковицы. Пересадка волос, эпиляция и лечение кожи головы в одной клинике.", "Sochni teridan piyozchagacha ko‘ramiz. Soch ko‘chirish, epilyatsiya va bosh terisini davolash bitta klinikada."))}
${beat(11.6, 14.1, t("05 · Физиотерапия", "05 · Fizioterapiya"), t("Свет, озон и холод", "Yorug‘lik, ozon va sovuq"), t("Семь процедур: ПУВА и УФ-терапия, озонотерапия, ИЛБИ, Дарсонваль, криотерапия, ионизирующий душ.", "Yettita muolaja: PUVA va UV terapiyasi, ozon terapiyasi, ILBI, Darsonval, kriyoterapiya, ionlashtiruvchi dush."))}
${beat(14.6, 17.1, t("06 · Этапы лечения", "06 · Davolash bosqichlari"), t("Консультация, анализ, диагноз, лечение", "Konsultatsiya, analiz, diagnoz, davolash"), t("Стационарное или амбулаторное лечение, подходящее для пациента. Для стационара комфортные палаты с Wi-Fi и телевизором.", "Bemorga mos statsionar yoki ambulator davolash. Statsionar uchun Wi-Fi va televizorli qulay palatalar."))}
${beat(17.6, 20, t("07 · Специалисты", "07 · Mutaxassislar"), t("Более 20 квалифицированных специалистов", "20 dan ortiq malakali mutaxassis"), t("Дерматологи и косметологи, а ещё педиатр, терапевт, стоматолог, эндокринолог, трихолог, УЗИ и лаборатория.", "Dermatolog va kosmetologlar, shuningdek pediatr, terapevt, stomatolog, endokrinolog, trixolog, UZD va laboratoriya."))}
<div class="st-beat st-last" data-beat="20.3 99"><span class="kicker" data-line><i></i>${t("08 · Запись", "08 · Yozilish")}</span><h2 data-line>${t("Запишитесь на приём", "Qabulga yoziling")}</h2><div class="cta" data-line><a class="btn btn-pri" href="#zapis">${t("Выбрать время", "Vaqtni tanlash")}${ICON.arrow}</a>${tgBtn("btn-ghost", t("Написать в Telegram", "Telegramga yozish"), helloText(l))}</div></div>
</div>
<div class="st-hud" aria-hidden="true"><span data-hud>00 · Asmo Clinic</span><i><b data-bar></b></i></div>
<p class="st-hint" data-k="hint" aria-hidden="true">${t("Листайте", "Aylantiring")}<i></i></p>
</div></div>
<div class="st-static wrap">${statics.map(([h, p]) => `<div class="st-s"><h2>${h}</h2><p>${p}</p></div>`).join("")}</div>
</section>`;
}

/* Первый экран без истории, когда доп «Сцена» выключен. */
function heroPlain(l) {
  const t = T(l);
  return `<section class="hero2" data-tone="ink" data-addon-off="story"><div class="cells">${cellsHtml()}</div><div class="wrap"><span class="kicker"><i></i>${t("Дерматологическая клиника · Ташкент · с 2021 года", "Dermatologiya klinikasi · Toshkent · 2021-yildan")}</span><p class="h1">${t("Кожа, которую вы носите <em>каждый день</em>", "Har kuni olib yuradigan <em>teringiz</em>")}</p><div class="cta"><a class="btn btn-pri" href="#zapis">${ICON.clock}<span>${t("Записаться на приём", "Qabulga yozilish")}</span></a><a class="btn btn-ghost" href="tel:${F.phone}">${ICON.phone}<span>${F.phoneT}</span></a></div></div></section>`;
}

/* Услуги: бенто из шести карточек, у каждой своё движение. */
function servicesBlock(l) {
  const t = T(l);
  const anim = ["cell", "lens", "drop", "cell", "grow", "drop"];
  return `<section id="uslugi" data-tone="mint"><div class="wrap">
${head(t("Услуги", "Xizmatlar"), t("Кожа, волосы и всё, что рядом", "Teri, soch va unga yaqin hammasi"), t("Частная клиника с 2021 года: диагностика и стационарное или амбулаторное лечение дерматологических заболеваний современными методами.", "2021-yildan xususiy klinika: dermatologik kasalliklarni zamonaviy usullar bilan tashxislash va statsionar yoki ambulator davolash."))}
<div class="bento">${DIRS.map((s, k) => `<article class="bx bx-${s.id} rv a-${anim[k]} spot-host" style="--d:${(k % 3) * 70}ms"><span class="spot" aria-hidden="true"></span><span class="bx-ic">${ICON[s.ic]}</span><p class="bx-k">${s[l][1]}</p><h3>${s[l][0]}</h3><p>${s[l][2]}</p>${s.id === "stac" ? `<p class="bx-tags"><span>${ICON.wifi}Wi-Fi</span><span>${ICON.tv}${t("Телевизор", "Televizor")}</span></p>` : ""}<a class="bx-a" href="#zapis" data-dir="${s.id}">${t("Записаться", "Yozilish")}${ICON.arrow}</a></article>`).join("")}</div>
</div></section>`;
}

/* Онлайн-запись: направление, день, время, телефон → Telegram клиники. */
function bookingBlock(l) {
  const t = T(l);
  const dirs = [["derm", t("Дерматолог", "Dermatolog")], ["cosm", t("Косметолог", "Kosmetolog")], ["phys", t("Физиотерапия", "Fizioterapiya")], ["hair", t("Трихолог, волосы", "Trixolog, soch")], ["diag", t("Дерматоскопия", "Dermatoskopiya")], ["kid", t("Педиатр", "Pediatr")], ["steth", t("Терапевт", "Terapevt")], ["endo", t("Эндокринолог", "Endokrinolog")], ["tooth", t("Стоматолог", "Stomatolog")], ["uzi", t("УЗИ", "UZD")]];
  return `<section id="zapis" data-tone="sea" data-addon="booking"><div class="wrap">
${head(t("Онлайн-запись", "Onlayn yozilish"), t("Выберите врача, день и время", "Shifokor, kun va vaqtni tanlang"), t("Три шага, и заявка уходит администратору в Telegram. Он перезвонит и подтвердит время.", "Uch qadam va ariza administratorga Telegramga boradi. U qo‘ng‘iroq qilib vaqtni tasdiqlaydi."), ours(l))}
<form class="book glass-d rv a-lens" id="book" novalidate>
<div class="bk-col">
<fieldset class="bk-step"><legend><b class="num">1</b>${t("К кому", "Kimga")}</legend><div class="opts">${dirs.map(([v, n], k) => `<label class="opt"><input type="radio" name="dir" value="${esc(n)}" data-d="${v}"${k === 0 ? " checked" : ""}><span>${ICON[v === "diag" ? "scope" : v]}${n}</span></label>`).join("")}</div></fieldset>
<fieldset class="bk-step"><legend><b class="num">2</b>${t("Когда", "Qachon")}</legend><div class="days" id="bk-days" role="radiogroup" aria-label="${t("День", "Kun")}"></div><div class="slots" id="bk-slots" role="radiogroup" aria-label="${t("Время", "Vaqt")}"></div><p class="bk-ex">${t("Свободное время здесь для примера. На сайте оно придёт из вашего графика врачей.", "Bu yerda bo‘sh vaqt namuna uchun. Saytda u shifokorlar jadvalingizdan keladi.")}</p></fieldset>
</div>
<div class="bk-col">
<fieldset class="bk-step"><legend><b class="num">3</b>${t("Контакты", "Kontaktlar")}</legend>
<label class="field"><span>${t("Имя", "Ism")}</span><input name="name" autocomplete="given-name" placeholder="${t("Как к вам обращаться", "Sizga qanday murojaat qilaylik")}"></label>
<label class="field"><span>${t("Телефон", "Telefon")}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998"></label>
<label class="field"><span>${t("Что беспокоит, по желанию", "Nima bezovta qiladi, ixtiyoriy")}</span><input name="note" placeholder="${t("Например: высыпания на лице", "Masalan: yuzda toshmalar")}"></label></fieldset>
<p class="bk-pick" id="bk-pick" aria-live="polite"></p>
<button class="btn btn-pri" type="submit">${ICON.tg}<span>${t("Отправить заявку", "Arizani yuborish")}</span></button>
<p class="note-ok" id="bk-done" role="status" hidden></p>
<p class="bk-s">${t("Заявка уходит текстом в Telegram клиники @asmo_clinic. В экстренных случаях звоните:", "Ariza matn bilan klinikaning @asmo_clinic Telegramiga boradi. Shoshilinch holatlarda qo‘ng‘iroq qiling:")} <a href="tel:${F.phone}">${F.phoneT}</a></p>
</div>
</form>
</div></section>`;
}

/* Конструктор лечения: процедуры, сеансы, итог в сумах. */
function pricesBlock(l) {
  const t = T(l);
  const rows = (cat) => ITEMS.filter((x) => x[1] === cat).map(([id, , ru, uz, price, uRu, uUz, def, max]) => `<li class="pr" data-id="${id}" data-p="${price}" data-max="${max}"><label class="pr-c"><input type="checkbox"${def ? " checked" : ""} data-pc><span class="ck" aria-hidden="true">${ICON.check}</span><span class="pr-t"><b>${l === "ru" ? ru : uz}</b><small class="num">${sum(price)} ${t("сум", "so‘m")} · ${l === "ru" ? uRu : uUz}</small></span></label><span class="step" role="group" aria-label="${t("Сколько", "Nechta")}"><button type="button" data-m aria-label="${t("Меньше", "Kamroq")}">${ICON.minus}</button><output class="num" data-q>${Math.max(def, 1)}</output><button type="button" data-a aria-label="${t("Больше", "Ko‘proq")}">${ICON.plus}</button></span></li>`).join("");
  return `<section id="ceny" data-tone="cream" data-addon="prices"><div class="wrap">
${head(t("Конструктор лечения", "Davolash konstruktori"), t("Сколько стоит лечение", "Davolash qancha turadi"), t("Отметьте процедуры и число сеансов: итог считается сразу. Отправьте его администратору, он скажет точную цену и свободное время.", "Muolajalar va seanslar sonini belgilang: jami darhol hisoblanadi. Uni administratorga yuboring, u aniq narx va bo‘sh vaqtni aytadi."), ours(l))}
<div class="prc">
<div class="prc-tabs" role="tablist">${CATS.map(([id, ru, uz], k) => `<button type="button" role="tab" class="chip" data-tab="${id}" aria-selected="${k === 0}">${l === "ru" ? ru : uz}</button>`).join("")}</div>
<div class="prc-body">
<div class="prc-lists">${CATS.map(([id], k) => `<ul class="prc-l" data-list="${id}"${k ? " hidden" : ""}>${rows(id)}</ul>`).join("")}</div>
<aside class="prc-r">
<p class="calc-k">${t("Ваш план лечения", "Davolash rejangiz")}</p>
<ul class="prc-sel" id="prc-sel"></ul>
<div class="prc-tot"><small>${t("Ориентир по рынку Ташкента", "Toshkent bozori bo‘yicha mo‘ljal")}</small><b class="num"><span id="prc-sum">0</span> ${t("сум", "so‘m")}</b><small id="prc-n"></small></div>
<button class="btn btn-pri" type="button" id="prc-send">${ICON.tg}<span>${t("Узнать цену и записаться", "Narxni bilish va yozilish")}</span></button>
<p class="note-ok" id="prc-done" role="status" hidden></p>
<p class="src">${t("Цены здесь не цены клиники: на сайте их пока нет. Это середина рынка Ташкента по клиникам той же специализации, округлённо. Свои цены вы ставите в панели.", "Bu narxlar klinika narxlari emas: saytda ular hozircha yo‘q. Bu Toshkent bozorining shu yo‘nalishdagi klinikalar bo‘yicha o‘rtasi, yaxlitlangan. O‘z narxlaringizni panelda qo‘yasiz.")}</p>
</aside>
</div></div>
</div></section>`;
}

/* Тест «К кому записаться»: три вопроса → направление и специалист. */
function quizBlock(l) {
  const t = T(l);
  const q1 = [
    ["acne", t("Высыпания, акне, покраснение", "Toshmalar, akne, qizarish"), "derm"],
    ["mole", t("Родинка, папиллома, бородавка", "Xol, papilloma, so‘gal"), "diag"],
    ["itch", t("Зуд, шелушение, пятна", "Qichishish, po‘st tashlash, dog‘lar"), "derm"],
    ["hair", t("Выпадают волосы", "Soch to‘kiladi"), "hair"],
    ["care", t("Хочу уход: пилинг, мезотерапия, эпиляция", "Parvarish istayman: piling, mezoterapiya, epilyatsiya"), "cosm"],
  ];
  const q2 = [["new", t("Недавно, пару недель", "Yaqinda, bir-ikki hafta")], ["month", t("Больше месяца", "Bir oydan ko‘p")], ["long", t("Годами возвращается", "Yillar davomida qaytadi")]];
  const q3 = [["adult", t("Взрослый", "Katta yoshli")], ["kid", t("Ребёнок", "Bola")]];
  const res = {
    derm: [t("Дерматолог", "Dermatolog"), t("Осмотр и при необходимости дерматоскопия. Врач поставит диагноз и подберёт лечение: амбулаторно или в стационаре.", "Ko‘rik va kerak bo‘lsa dermatoskopiya. Shifokor tashxis qo‘yadi va davolashni tanlaydi: ambulator yoki statsionarda.")],
    diag: [t("Дерматолог и дерматоскопия", "Dermatolog va dermatoskopiya"), t("Посмотрим образование под увеличением. Доброкачественное удаляют современными методами, при сомнении делают морфологическое исследование.", "O‘smani kattalashtirib ko‘ramiz. Xavfsizini zamonaviy usullar bilan olib tashlashadi, shubha bo‘lsa morfologik tekshiruv qilinadi.")],
    hair: [t("Трихолог и трихоскопия", "Trixolog va trixoskopiya"), t("Посмотрим кожу головы и волосы под увеличением, найдём причину. Если нужно, обсудим пересадку волос.", "Bosh terisi va sochni kattalashtirib ko‘ramiz, sababini topamiz. Kerak bo‘lsa, soch ko‘chirishni muhokama qilamiz.")],
    cosm: [t("Косметолог", "Kosmetolog"), t("Подберёт процедуру под вашу кожу: химический пилинг, мезотерапию, эпиляцию или криотерапию.", "Teringizga mos muolajani tanlaydi: kimyoviy piling, mezoterapiya, epilyatsiya yoki kriyoterapiya.")],
  };
  return `<section id="test" data-tone="skin" data-addon="quiz"><div class="wrap">
${head(t("Тест за 30 секунд", "30 soniyalik test"), t("Не знаете, к кому записаться?", "Kimga yozilishni bilmaysizmi?"), t("Три вопроса, и подскажем направление. Это не диагноз: диагноз ставит врач на приёме.", "Uchta savol va yo‘nalishni aytamiz. Bu tashxis emas: tashxisni shifokor qabulda qo‘yadi."), ours(l))}
<div class="quiz glass-l rv a-drop" id="quiz">
<ol class="qz-dots" aria-hidden="true"><li class="on"></li><li></li><li></li><li></li></ol>
<div class="qz-s" data-s="0"><p class="qz-k">1 / 3</p><h3>${t("Что беспокоит?", "Nima bezovta qiladi?")}</h3><div class="qz-o">${q1.map(([v, n, r]) => `<button type="button" class="qo" data-v="${v}" data-r="${r}">${n}</button>`).join("")}</div></div>
<div class="qz-s" data-s="1" hidden><p class="qz-k">2 / 3</p><h3>${t("Как давно?", "Qachondan beri?")}</h3><div class="qz-o">${q2.map(([v, n]) => `<button type="button" class="qo" data-v="${v}">${n}</button>`).join("")}</div></div>
<div class="qz-s" data-s="2" hidden><p class="qz-k">3 / 3</p><h3>${t("Кто пациент?", "Bemor kim?")}</h3><div class="qz-o">${q3.map(([v, n]) => `<button type="button" class="qo" data-v="${v}">${n}</button>`).join("")}</div></div>
<div class="qz-s qz-res" data-s="3" hidden><p class="qz-k">${t("Вам к специалисту", "Sizga mutaxassis kerak")}</p><h3 id="qz-h"></h3><p id="qz-p"></p><p class="qz-kid" id="qz-kid" hidden>${t("Ребёнка в клинике принимает и педиатр.", "Klinikada bolani pediatr ham qabul qiladi.")}</p><div class="cta"><a class="btn btn-pri" href="#zapis" id="qz-go">${t("Записаться к нему", "Unga yozilish")}${ICON.arrow}</a><button type="button" class="btn btn-ghost" id="qz-re">${t("Пройти заново", "Qaytadan")}</button></div></div>
</div>
<script type="application/json" id="qz-data">${JSON.stringify(res).replace(/</g, "\\u003c")}</script>
</div></section>`;
}

/* Цитата с их первого экрана: слова проявляются по мере прокрутки. */
function quoteBlock(l) {
  const words = QUOTE[l].split(" ").map((w) => `<span>${w}</span>`).join(" ");
  return `<section class="quote" data-tone="deep"><div class="wrap"><blockquote class="qt" id="qt"><p>«${words}»</p><footer>${QUOTE.by[l]}</footer></blockquote></div></section>`;
}

/* Вопросы: два с их сайта и ответы из их же текста «О нас». */
function faqBlock(l) {
  const t = T(l);
  const qa = [
    [t("Какие услуги вы предоставляете?", "Qanday xizmatlar ko‘rsatasiz?"), t("Лечение акне, экземы, псориаза, кожных инфекций, удаление родинок, косметическая дерматология, физиотерапевтические процедуры и профилактические осмотры.", "Akne, ekzema, psoriaz, teri infeksiyalarini davolash, xollarni olib tashlash, kosmetik dermatologiya, fizioterapiya muolajalari va profilaktik ko‘riklar.")],
    [t("Как записаться на приём?", "Qabulga qanday yozilaman?"), t(`По телефону ${F.phoneT} или ${F.phone2T}, через онлайн-запись на сайте или лично в клинике.`, `Telefon orqali ${F.phoneT} yoki ${F.phone2T}, saytdagi onlayn yozilish orqali yoki klinikaga shaxsan kelib.`)],
    [t("Есть ли стационар?", "Statsionar bormi?"), t("Да. Лечение стационарное или амбулаторное, как подходит пациенту. Для стационарных пациентов комфортные палаты: Wi-Fi, телевизор.", "Ha. Davolash bemorga mos ravishda statsionar yoki ambulator. Statsionar bemorlar uchun qulay palatalar: Wi-Fi, televizor.")],
    [t("Какие ещё специалисты принимают?", "Yana qanday mutaxassislar qabul qiladi?"), t("Кроме дерматологов и косметологов: педиатр, терапевт, стоматолог, эндокринолог, трихолог, УЗИ и лаборатория. В клинике более 20 специалистов.", "Dermatolog va kosmetologlardan tashqari: pediatr, terapevt, stomatolog, endokrinolog, trixolog, UZD va laboratoriya. Klinikada 20 dan ortiq mutaxassis.")],
    [t("Когда вы работаете?", "Qachon ishlaysiz?"), t("С понедельника по субботу с 9:00 до 18:00, воскресенье выходной.", "Dushanbadan shanbagacha 9:00 dan 18:00 gacha, yakshanba dam olish kuni.")],
  ];
  return `<section id="faq" data-tone="mint"><div class="wrap faq-w">
${head(t("Вопросы", "Savollar"), t("Часто спрашивают", "Ko‘p so‘rashadi"), "")}
<div class="faq">${qa.map(([q, a], k) => `<details class="fq rv a-cell" style="--d:${k * 60}ms"${k === 0 ? " open" : ""}><summary><span>${q}</span><i aria-hidden="true">${ICON.plus}</i></summary><p>${a}</p></details>`).join("")}</div>
</div></section>`;
}

/* Контакты: схема квартала, адрес, часы, телефоны, соцсети. */
function contactBlock(l) {
  const t = T(l);
  return `<section id="kontakty" class="final" data-tone="deep"><div class="wrap fin">
<div class="fin-t rv a-cell"><span class="kicker"><i></i>${t("Контакты", "Kontaktlar")}</span><h2>${t("Приходите в клинику", "Klinikaga keling")}</h2>
<ul class="fin-l"><li>${ICON.pin}<span>${F.addr[l]}</span></li><li>${ICON.clock}<span>${F.hours[l]}</span></li><li>${ICON.phone}<span><a href="tel:${F.phone}">${F.phoneT}</a> · <a href="tel:${F.phone2}">${F.phone2T}</a></span></li><li>${ICON.mail}<a href="mailto:${F.email}">${F.email}</a></li><li>${ICON.ig}<span><a href="${F.ig}">Instagram</a> · <a href="${F.channel}">${t("Канал в Telegram", "Telegram kanal")}</a> · <a href="${F.fb}">Facebook</a></span></li></ul>
<div class="cta">${tgBtn("btn-pri shim", t("Написать в Telegram", "Telegramga yozish"), helloText(l))}<a class="btn btn-ghost" href="${F.map}">${ICON.pin}<span>${t("Маршрут в Яндекс Картах", "Yandex Xaritada yo‘l")}</span></a></div></div>
<a class="map glass rv a-lens" href="${F.map}" aria-label="${t("Открыть клинику на карте", "Klinikani xaritada ochish")}"><svg viewBox="0 0 600 420" aria-hidden="true" focusable="false"><g fill="none" stroke="rgb(202 241 248 / .16)" stroke-width="2"><path d="M-10 120 L610 80M-10 300 L610 260M120 -10 L160 430M420 -10 L460 430"/><path d="M-10 200 L610 170" stroke-width="10" stroke="rgb(202 241 248 / .26)"/></g><g fill="rgb(202 241 248 / .07)"><rect x="180" y="96" width="220" height="70" rx="10"/><rect x="40" y="210" width="90" height="70" rx="10"/><rect x="180" y="200" width="100" height="70" rx="10"/><rect x="480" y="190" width="100" height="62" rx="10"/><rect x="190" y="290" width="210" height="80" rx="10"/></g><text x="470" y="160" fill="rgb(202 241 248 / .6)" font-size="15" font-family="Onest,sans-serif">${t("Фергана Йули", "Farg‘ona yo‘li")}</text><circle class="ping" cx="300" cy="186" r="14"/><circle cx="300" cy="186" r="14" fill="#caf1f8"/><circle cx="300" cy="186" r="6" fill="#06171d"/></svg><span class="map-c"><b>Asmo Clinic</b><span>${t("Мирабадский район", "Mirobod tumani")}</span></span></a>
</div></section>`;
}

/* ── Главная ──────────────────────────────────────────────────────────── */
function home(l) {
  const t = T(l);
  const body = `<div data-addon="story">${storyBlock(l)}</div>
${heroPlain(l)}
${servicesBlock(l)}
${bookingBlock(l)}
${pricesBlock(l)}
${quizBlock(l)}
${quoteBlock(l)}
${faqBlock(l)}
${contactBlock(l)}`;
  return shell(l, "", {
    title: t("Asmo Clinic: дерматологическая клиника в Ташкенте", "Asmo Clinic: Toshkentdagi dermatologiya klinikasi"),
    desc: t("Лечение кожи, косметология, физиотерапия и трансплантация волос в Мирабадском районе. Стационар, 20+ специалистов, с 2021 года. Онлайн-запись.", "Mirobod tumanida teri davolash, kosmetologiya, fizioterapiya va soch transplantatsiyasi. Statsionar, 20+ mutaxassis, 2021-yildan. Onlayn yozilish."),
  }, body);
}

/* ── Что дальше: было и стало, конструктор, конкуренты, фото ──────────── */
const COMP = JSON.parse(readFileSync(DIR + "comp.json", "utf8"));
function plan(l) {
  const t = T(l);
  const hasBa = existsSync(new URL(`../../../public${IMG}/ba-old-d.webp`, import.meta.url));
  const ba = (o, n, cap, was) => `<figure class="rv a-cell"><div class="ba-box" data-ba><img src="${IMG}/${n}" alt="${t("Прототип", "Prototip")}" loading="lazy"><div class="was"><img src="${IMG}/${o}" alt="${t("Сайт сегодня", "Bugungi sayt")}" loading="lazy"></div><span class="tag2 a">${t("было", "edi")}</span><span class="tag2 b">${t("стало", "bo‘ldi")}</span><span class="knob"><i>${ICON.arrows}</i></span><input type="range" min="0" max="100" value="50" aria-label="${t("Сравнить", "Solishtirish")}"></div><figcaption><span>${cap}</span><span>${was}</span></figcaption></figure>`;
  const body = `<section class="phead" data-tone="ink"><div class="wrap"><span class="kicker"><i></i>${t("Предложение DevUz Studio для Asmo Clinic", "DevUz Studio’ning Asmo Clinic uchun taklifi")}</span><h1>${hasBa ? t("Было и стало", "Edi va bo‘ldi") : t("Что дальше", "Keyingi qadam")}</h1><p class="lead">${hasBa ? t("Слева asmoclinic.uz сегодня, справа этот прототип. Тяните шторку.", "Chapda bugungi asmoclinic.uz, o‘ngda shu prototip. Pardani torting.") : t("Конструктор, что взяли у конкурентов и откуда изображения.", "Konstruktor, raqobatchilardan nima oldik va rasmlar qayerdan.")}</p></div></section>
${hasBa ? `<section data-tone="ink" style="padding-top:0"><div class="wrap"><div class="ba">
${ba("ba-old-d.webp", "ba-new-d.webp", t("Компьютер · первый экран", "Kompyuter · birinchi ekran"), t("было: цитата и две кнопки, записи нет", "edi: iqtibos va ikki tugma, yozilish yo‘q"))}
${ba("ba-old-m.webp", "ba-new-m.webp", t("Телефон · первый экран", "Telefon · birinchi ekran"), t("было: кнопка «Контакты» никуда не звонит", "edi: «Kontaktlar» tugmasi hech qayerga qo‘ng‘iroq qilmaydi"))}
</div></div></section>` : ""}
<section id="konstruktor" data-tone="cream"><div class="wrap">
${head(t("Конструктор проекта", "Loyiha konstruktori"), t("Соберите сайт под свой бюджет", "Saytni byudjetingizga moslab yig‘ing"), t("Сайт стоит 1 700 $. Остальное включается тумблером: включили блок, и он появляется на странице, итог пересчитывается. Со всеми допами 3 000 $.", "Sayt 1 700 $ turadi. Qolgani tumbler bilan yoqiladi: blokni yoqsangiz, u sahifada paydo bo‘ladi, jami qayta hisoblanadi. Barcha qo‘shimchalar bilan 3 000 $."))}
<div class="kit">
<div class="kit-list">
<div class="kit-base"><div><b>${KIT_BASE[l].t}</b><p>${KIT_BASE[l].d}</p></div><span class="kit-price num">${usd(KIT_BASE.price)}</span></div>
<h3 class="kit-g">${t("Допы на сайте", "Saytdagi qo‘shimchalar")}</h3>
${ADDONS.map((a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="${(a.needs || []).join(" ")}" data-def checked><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}</b><small>${a[l].e}</small></span><span class="kit-price num">${usd(a.price)}</span></label>`).join("")}
<h3 class="kit-g">${t("Сверх сайта", "Saytdan tashqari")}</h3>
${BLOCKS.map((b) => `<label class="kit-row"><input type="checkbox" data-k="${b.id}" data-p="${b.price}" data-needs="${(b.needs || []).join(" ")}" data-def checked><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${b[l].t}</b><small>${b[l].why}</small><span class="kit-li">${b[l].li.map((x) => `<em>${x}</em>`).join("")}</span></span><span class="kit-price num">${usd(b.price)}</span></label>`).join("")}
</div>
<div class="kit-side">
<div class="kit-total"><small>${t("Итого с сайтом", "Sayt bilan jami")}</small><b class="num" id="kit-sum"></b><small id="kit-n"></small><a class="btn btn-white" href="https://t.me/Devuz_studio_bot?start=asmo">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a></div>
<p class="src">${t("Цены по середине рынка Ташкента: сайт клиники на двух языках с управлением у студий стоит примерно от 1 200 до 2 500 $, с онлайн-записью, ботом и интеграциями от 2 500 $.", "Narxlar Toshkent bozorining o‘rtasi bo‘yicha: studiyalarda boshqaruvli ikki tilli klinika sayti taxminan 1 200 dan 2 500 $ gacha, onlayn yozilish, bot va integratsiyalar bilan 2 500 $ dan turadi.")}</p>
</div>
</div>
</div></section>
<section id="konkurenty" data-tone="mint"><div class="wrap">
${head(t("Что взяли у конкурентов", "Raqobatchilardan nima oldik"), t("Сильное у клиник кожи в Ташкенте", "Toshkentdagi teri klinikalarining kuchli tomonlari"), "")}
<div class="grid3">${COMP.map((c, k) => `<div class="note rv a-cell" style="--d:${(k % 3) * 80}ms"><h3>${c[l][0]}</h3><p>${c[l][1]}</p></div>`).join("")}</div>
</div></section>
<section id="foto" data-tone="cream"><div class="wrap">
${head(t("Изображения в прототипе", "Prototipdagi rasmlar"), t("Откуда изображения", "Rasmlar qayerdan"), "")}
<ul class="credits"><li>${t("Логотип Asmo Clinic из файла на asmoclinic.uz: круги знака пересчитаны в точную геометрию, буквы как в файле. Вектор, чёткий на любом экране.", "Asmo Clinic logotipi asmoclinic.uz’dagi fayldan: belgi doiralari aniq geometriyaga o‘tkazildi, harflar fayldagidek. Vektor, har qanday ekranda aniq.")}</li><li>${t("Кожа под дерматоскопом, разрез кожи, свет и пузырьки нарисованы кодом: ни одной чужой фотографии. Фото на вашем сайте не крупнее 1 200 пикселей, на первом экране они бы расплылись. В работе поставим ваши снимки клиники и врачей.", "Dermatoskop ostidagi teri, teri kesimi, yorug‘lik va pufakchalar kod bilan chizilgan: bironta begona fotosurat yo‘q. Saytingizdagi fotolar 1 200 pikseldan katta emas, birinchi ekranda ular xiralashardi. Ishda klinika va shifokorlaringiz suratlarini qo‘yamiz.")}</li><li>${t("Анимации по мотивам компонентов с 21st.dev под MIT: Magic UI (Bento Grid, Orbiting Circles, Text Reveal, Shimmer Button, Border Beam, Magic Card, Number Ticker). Код свой.", "Animatsiyalar 21st.dev’dagi MIT komponentlari asosida: Magic UI (Bento Grid, Orbiting Circles, Text Reveal, Shimmer Button, Border Beam, Magic Card, Number Ticker). Kod o‘zimizniki.")}</li></ul>
</div></section>`;
  return shell(l, "plan", {
    title: t("Что дальше: конструктор сайта | Asmo Clinic", "Keyingi qadam: sayt konstruktori | Asmo Clinic"),
    desc: t("Конструктор: сайт 1 700 $, со всеми допами 3 000 $. Что взяли у конкурентов и откуда изображения.", "Konstruktor: sayt 1 700 $, barcha qo‘shimchalar bilan 3 000 $. Raqobatchilardan nima oldik va rasmlar qayerdan."),
  }, body);
}

const BUILD = { "": home, plan };
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
const parts = { S: `<style>${CSS}</style>`, J: `<script>\n${JS}</script>` };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let page = html;
  for (const [name, part] of Object.entries(parts)) page = page.split(part).join(`@@${name}@@`);
  pages[key] = page;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "asmo.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(main)").padEnd(12), v.length);
