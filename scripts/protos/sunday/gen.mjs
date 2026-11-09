import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { LANGS, COMPANY, DIRS, FORMATS, STEPS, CALC, WORKS, NAMES, CORP } from "./data.mjs";
import { BASE, ADDONS, OFFER_HOURS, ALL } from "./plan.mjs";
import { PANEL_UI } from "./ui.mjs";

/*
 * Макет Sunday Event Agency (sunday.uz), 09.11.2026: ивент-агентство в
 * Ташкенте с 2009 года. Их сайт не открывается, поэтому всё — из их каналов
 * (data.mjs, SOURCES.md). Страницы на ru и uz:
 *
 *   ""    — видео DevUz → залёт камерой в центр их розетки: лепестки
 *           расходятся, внутри вечерний зал, гирлянды загораются, счёт
 *           2009 → 2026, кругом раскрывается зал → выбор «Сайт» / «Панель»
 *           → как проверить → конструктор «Предложение DevUz Studio»;
 *   site  — сайт агентства: четыре направления, поводы, шаги, допы
 *           (смета, подбор концепции, свободные даты, кабинет, приглашение
 *           гостям, работы, бот, страницы под поиск, панель), о студии, связь;
 *   panel — панель заявок, дат и гостей по эталонам Greenwell и Cargo Pro.
 *
 * Картинки — иллюстрации Higgsfield в их цветах, подписаны: своих фото с
 * правом у нас нет. Формы ничего не отправляют наружу: заявка ложится в
 * браузер (её видит панель) и открывает их Telegram с готовым текстом.
 * Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/sunday";
const strip = (s) => s.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");
const CSS = strip(readFileSync(DIR + "site.css", "utf8")).replace(/\n\s*/g, "");
const JS = strip(readFileSync(DIR + "site.js", "utf8")).replace(/\n\s*\n/g, "\n");
const LAND_JS = strip(readFileSync(DIR + "land.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_JS = strip(readFileSync(DIR + "panel.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_CSS = strip(readFileSync(DIR + "panel.css", "utf8")).replace(/\n\s*/g, "");
const BASE_URL = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Manrope:wght@400;700&display=swap";
const KEY = { ru: "", uz: "uz" };
const DEVUZ = "https://t.me/Devuz_studio_bot?start=sunday";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, p = "") => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/" + (p ? p : "");
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const usd = (n) => `${fmt(n)}\u00a0$`;
const words = (txt) => txt.split(" ").map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
const tg = (text) => `https://t.me/${COMPANY.tg}?text=${encodeURIComponent(text)}`;
const pic = (name, alt, w = 1168, h = 880, lazy = true) => `<img src="${IMG}/${name}-640.webp" srcset="${IMG}/${name}-640.webp 640w, ${IMG}/${name}.webp 1168w" sizes="(max-width: 899px) 92vw, 46vw" width="${w}" height="${h}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ""}>`;

const I = (dd) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  back: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  panel: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  calc: I('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'),
  cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  doc: I('<path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  ig: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>'),
  play: I('<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>'),
  spark: I('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>'),
  heart: I('<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9Z"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
};

/* Знак Sunday — их розетка из аватара Telegram, перерисована вектором: три
   слоя лепестков с прорезями и тёмный центр. Слои — отдельными группами:
   на первой странице они расходятся, когда камера входит в центр. */
function petal(len, w, id) {
  const tip = 200 - len, a = 200 - len * 0.45;
  return `<path id="${id}" d="M200 200C${200 + w} ${a + 20} ${200 + w * 0.7} ${tip + 24} 200 ${tip}C${200 - w * 0.7} ${tip + 24} ${200 - w} ${a + 20} 200 200Z"/>`;
}
const ring = (use, n, off = 0) => Array.from({ length: n }, (_, i) => `<use href="#${use}" transform="rotate(${(off + (360 / n) * i).toFixed(2)} 200 200)"/>`).join("");
const MARK_DEFS = `<svg class="defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>${petal(182, 34, "sn-p1")}${petal(138, 30, "sn-p2")}${petal(92, 24, "sn-p3")}
<g id="sn-l1">${ring("sn-p1", 16)}</g><g id="sn-l2">${ring("sn-p2", 16, 11.25)}</g><g id="sn-l3">${ring("sn-p3", 8, 22.5)}</g>
<g id="sn-cut" fill="none" stroke="#1a213b" stroke-width="3.4" stroke-linecap="round">${Array.from({ length: 16 }, (_, i) => `<path d="M200 70V150" transform="rotate(${22.5 * i} 200 200)"/>`).join("")}</g>
<g id="sn-g"><g fill="#344488"><use href="#sn-l1" opacity=".72"/><use href="#sn-l2" opacity=".88"/><use href="#sn-l3"/></g><use href="#sn-cut"/><circle cx="200" cy="200" r="16" fill="#1a213b"/><circle cx="200" cy="200" r="6" fill="#dc4468"/></g></defs></svg>`;
const MARK = (s = 34) => `<svg viewBox="0 0 400 400" width="${s}" height="${s}" aria-hidden="true" focusable="false"><use href="#sn-g"/></svg>`;
const LOGO = (l, to = "site") => `<a class="logo" href="${href(l, to)}" aria-label="Sunday Event Agency">${MARK(34)}<span><b>SUNDAY</b><small>event agency</small></span></a>`;

function head(l, title, desc) {
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#1a213b">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}

/* ── Сайт ──────────────────────────────────────────────────────────── */
function header(l, t) {
  const nav = [["dirs", t("Направления", "Yo‘nalishlar")], ["formats", t("Поводы", "Sabablar")], ["calc", t("Смета", "Smeta")], ["how", t("Как работаем", "Ish tartibi")], ["contact", t("Контакты", "Aloqa")]];
  return `<header class="top"><div class="mbar"><a href="${href(l)}">${ICON.back}<span>${t("Макет для Sunday", "Sunday uchun maket")}</span></a><a class="mb-adm" href="${href(l, "panel")}">${ICON.panel}<span>${t("Панель", "Panel")}</span>${ICON.arrow}</a></div><div class="top-in glass">
${LOGO(l)}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([id, n]) => `<a href="#${id}">${n}</a>`).join("")}</nav>
<button type="button" class="mine" id="mine" hidden><span class="dot" id="mine-d"></span>${ICON.doc}<span>${t("Моя заявка", "Arizam")}</span></button>
<div class="langs">${LANGS.map((x) => `<a href="${href(x, "site")}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<a class="btn btn-a btn-s tel" href="tel:${COMPANY.tel}">${ICON.phone}<span>${COMPANY.phone}</span></a>
</div></header>`;
}

function hero(l, t) {
  const text = t("Здравствуйте! Хочу обсудить событие.", "Assalomu alaykum! Tadbirni muhokama qilmoqchiman.");
  return `<section class="hero" id="top" aria-label="Sunday Event Agency">
<div class="hero-bg" aria-hidden="true"><div class="ph" data-par="0.16"><picture><source media="(max-width: 899px)" srcset="${IMG}/hall-9.webp"><img src="${IMG}/hall-1344.webp" srcset="${IMG}/hall-960.webp 960w, ${IMG}/hall-1344.webp 1344w" sizes="100vw" width="1344" height="752" alt="" fetchpriority="high"></picture></div></div>
<div class="hero-rose" aria-hidden="true" data-par="-0.08">${MARK(400)}</div>
<div class="wrap"><div class="hero-in">
<p class="kick rise"><i></i>Event agency · ${t("Ташкент, с 2009 года", "Toshkent, 2009 yildan")}</p>
<h1>${words(t("События, о которых <em>говорят годами</em>", "Yillar davomida <em>gapiriladigan</em> tadbirlar"))}</h1>
<p class="hsub rise">${esc(COMPANY.motto[l])}: ${t("оформление, кейтеринг, мероприятия и шоу.", "bezatish, keytering, tadbirlar va shou.")}</p>
<div class="hero-act rise"><a class="btn btn-a" href="#calc">${ICON.calc}<span>${t("Собрать смету", "Smeta tuzish")}</span></a><a class="btn btn-g" href="${tg(text)}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Написать в Telegram", "Telegramda yozish")}</span></a></div>
<div class="hstat glass rise"><b>${COMPANY.years}</b><span>${t("лет праздников,<br>с 2009 года", "yillik bayramlar,<br>2009 yildan")}</span></div>
</div></div>
<p class="ill">${t("Иллюстрация в ваших цветах", "Ranglaringizdagi illyustratsiya")}</p></section>`;
}

function velo(l) {
  const a = [...DIRS.map((d) => d[l][0]), ...FORMATS.map((f) => f[l][0])];
  return `<div class="velo" aria-hidden="true"><div class="row">${[0, 1, 2].map(() => a.map((s) => `<span>${esc(s)}</span><i>${MARK(18)}</i>`).join("")).join("")}</div></div>`;
}

function dirs(l, t) {
  return `<section class="sec" id="dirs"><div class="wrap">
<p class="kick rise"><i></i>${t("Что мы делаем", "Nima qilamiz")}</p>
<h2 class="h2 rise">${t("Четыре направления, <b>одна команда</b>", "To‘rt yo‘nalish, <b>bitta jamoa</b>")}</h2>
<div class="dirs"><div class="dir-stage" aria-hidden="true">${DIRS.map((d, i) => `<div class="ds${i === 0 ? " on" : ""}" data-ds="${d.id}">${pic(d.img, "")}</div>`).join("")}<span class="ill">${t("иллюстрации", "illyustratsiyalar")}</span></div>
<div class="dir-list" role="tablist" aria-label="${t("Направления", "Yo‘nalishlar")}">${DIRS.map((d, i) => `<button type="button" class="dl slide" role="tab" id="dt-${d.id}" aria-selected="${i === 0}" data-dir="${d.id}" style="transition-delay:${i * 80}ms"><i>0${i + 1}</i><b>${esc(d[l][0])}</b><span>${esc(d[l][1])}</span></button>`).join("")}</div></div>
</div></section>`;
}

function formats(l, t) {
  return `<section class="sec dark" id="formats"><div class="wrap">
<p class="kick rise"><i></i>${t("Поводы", "Sabablar")}</p>
<h2 class="h2 rise">${t("Для какого <b>дня</b> вы нас зовёте", "Bizni qaysi <b>kunga</b> chaqirasiz")}</h2>
<p class="lead rise">${t("Со старого сайта и вашего Instagram: торжества, праздники, wedding day и деловые события. Листайте вбок.", "Eski sayt va Instagramingizdan: tantanalar, bayramlar, wedding day va ishbilarmonlik tadbirlari. Yon tomonga suring.")}</p></div>
<div class="fmts" tabindex="0" aria-label="${t("Поводы", "Sabablar")}">${FORMATS.map((f, i) => `<article class="fm pop" style="transition-delay:${i * 90}ms"><div class="fm-p">${pic(f.img, f[l][0])}</div><div class="fm-t"><i>0${i + 1}</i><h3>${esc(f[l][0])}</h3><p>${esc(f[l][1])}</p><a class="btn btn-g btn-s" href="${tg(t(`Здравствуйте! Интересует: ${f.ru[0].toLowerCase()}.`, `Assalomu alaykum! Qiziqtiradi: ${f.uz[0].toLowerCase()}.`))}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Обсудить", "Muhokama qilish")}</span></a></div></article>`).join("")}</div>
</section>`;
}

function how(l, t) {
  return `<section class="sec" id="how"><div class="wrap two">
<div class="how-h"><p class="kick rise"><i></i>${t("Как работаем", "Ish tartibi")}</p>
<h2 class="h2 rise">${t("От разговора <b>до последнего гостя</b>", "Suhbatdan <b>oxirgi mehmongacha</b>")}</h2>
<p class="lead rise">${t("Пять шагов. На каждом вы видите, что сделано и за что платите.", "Besh qadam. Har birida nima qilinganini va nima uchun to‘layotganingizni ko‘rasiz.")}</p></div>
<ol class="steps" id="steps"><span class="line" aria-hidden="true"><i></i></span>${STEPS.map((s, i) => `<li class="step"><i>${i + 1}</i><div><b>${esc(s[l][0])}</b><p>${esc(s[l][1])}</p></div></li>`).join("")}</ol>
</div></section>`;
}

/* ── Допы: у каждого свой блок, тумблер конструктора его прячет. ─── */
function addonBlocks(l, t) {
  const tag = t("Доп", "Qo‘shimcha");
  const sec = (id, inner, cls = "") => `<section class="sec add-block${cls}" id="${id}" data-addon="${id}" data-tag="${tag}">${inner}</section>`;
  const opt = (name, list, type = "radio", first = 1) => list.map((o, i) => `<label class="chip"><input type="${type}" name="${name}" value="${o.id}"${type === "radio" && i === first ? " checked" : ""}><span>${esc(o[l])}</span></label>`).join("");
  const calc = sec("calc", `<div class="wrap">
<p class="kick rise"><i></i>${t("Конструктор сметы", "Smeta konstruktori")}</p>
<h2 class="h2 rise">${t("Сколько стоит ваш праздник, <b>по строкам</b>", "Bayramingiz qancha turadi, <b>qatorma-qator</b>")}</h2>
<p class="lead rise">${t("Выберите повод, гостей и что нужно. Справа вилка бюджета и за что каждая сумма. Отправьте её нам: менеджер пришлёт точную смету.", "Sabab, mehmonlar va nima kerakligini tanlang. O‘ngda byudjet oralig‘i va har bir summa nima uchun. Uni bizga yuboring: menejer aniq smetani yuboradi.")}</p>
<div class="cx"><div class="cx-l">
<fieldset><legend>${t("Повод", "Sabab")}</legend><div class="chips">${opt("ck", CALC.kinds, "radio", 0)}</div></fieldset>
<div class="rng"><label for="c-g"><span>${t("Гостей", "Mehmonlar")}</span><b id="c-gv"></b></label><input type="range" id="c-g" min="10" max="500" step="10" value="150"></div>
<fieldset><legend>${t("Кейтеринг, на гостя", "Keytering, mehmon boshiga")}</legend><div class="chips">${opt("cf", CALC.food)}</div></fieldset>
<fieldset><legend>${t("Оформление", "Bezatish")}</legend><div class="chips">${opt("cd", CALC.decor)}</div></fieldset>
<fieldset><legend>${t("Шоу", "Shou")}</legend><div class="chips">${opt("cs", CALC.show)}</div></fieldset>
<fieldset><legend>${t("Ещё", "Yana")}</legend><div class="chips">${opt("ce", CALC.extra, "checkbox")}</div></fieldset>
</div>
<aside class="cx-s glass" aria-live="polite"><h3 id="cx-k"></h3><div id="cx-lines"></div><div class="cx-tot"><span>${t("Ориентир", "Taxminan")}</span><b id="cx-tot"></b></div>
<button type="button" class="btn btn-a" id="cx-send">${ICON.tg}<span>${t("Отправить смету", "Smetani yuborish")}</span></button>
<p>${t("Ориентир по открытым данным рынка Ташкента, не прайс Sunday. Точную смету даёт менеджер после разговора о событии.", "Toshkent bozorining ochiq ma’lumotlari bo‘yicha taxminiy hisob, Sunday narxnomasi emas. Aniq smetani menejer tadbir haqidagi suhbatdan keyin beradi.")}</p></aside></div>
</div>`, " alt");
  const quiz = sec("quiz", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Подбор концепции", "Konsepsiya tanlash")}</p>
<h2 class="h2 rise">${t("Какой будет ваша <b>концепция</b>", "Konsepsiyangiz <b>qanday</b> bo‘ladi")}</h2>
<p class="lead rise">${t("Четыре вопроса, минута. В конце концепция с цветами и подборкой, её можно отправить нам вместе с ответами.", "To‘rt savol, bir daqiqa. Oxirida ranglar va tanlov bilan konsepsiya, uni javoblar bilan birga bizga yuborish mumkin.")}</p></div>
<div class="quiz glass pop" id="qz"></div></div>`);
  const dates = sec("dates", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Свободные даты", "Bo‘sh sanalar")}</p>
<h2 class="h2 rise">${t("Ваша дата <b>свободна?</b>", "Sanangiz <b>bo‘shmi?</b>")}</h2>
<p class="lead rise">${t("Занятые дни видно сразу. Нажмите на свободный, и дата уйдёт менеджеру как бронь. Даты ставит менеджер в панели.", "Band kunlar darhol ko‘rinadi. Bo‘sh kunni bosing, sana menejerga bron bo‘lib ketadi. Sanalarni menejer panelda qo‘yadi.")}</p>
<ul class="legend rise"><li><i class="fr"></i>${t("свободно", "bo‘sh")}</li><li><i class="bz"></i>${t("занято", "band")}</li><li><i class="hd"></i>${t("ваша бронь", "broningiz")}</li></ul></div>
<div class="calw glass tilt"><div class="cal-h"><button type="button" class="ib" id="cal-p" aria-label="${t("Прошлый месяц", "O‘tgan oy")}">${ICON.back}</button><b id="cal-m"></b><button type="button" class="ib" id="cal-n" aria-label="${t("Следующий месяц", "Keyingi oy")}">${ICON.arrow}</button></div><div class="cal-g" id="cal-g"></div><p class="mu sm">${t("Занятость в макете: демо.", "Maketdagi bandlik: demo.")}</p></div>
</div>`, " alt");
  const cab = sec("cab", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Кабинет клиента", "Mijoz kabineti")}</p>
<h2 class="h2 rise">${t("Подготовка <b>по дням</b>, без звонков «что с залом?»", "Kunma-kun <b>tayyorgarlik</b>, «zal nima bo‘ldi?» qo‘ng‘iroqlarisiz")}</h2>
<p class="lead rise">${t("Пара или компания видит, сколько осталось до дня, что готово, смету и оплаты. Менеджер отмечает шаги в панели.", "Juftlik yoki kompaniya kungacha qancha qolganini, nima tayyorligini, smeta va to‘lovlarni ko‘radi. Menejer qadamlarni panelda belgilaydi.")}</p></div>
<div class="cab glass tilt"><div class="cab-h">${MARK(30)}<span><b>${t("Свадьба Мадины и Сардора", "Madina va Sardorning to‘yi")} · ${t("демо", "demo")}</b><small id="cab-d"></small></span></div>
<div class="cab-c" id="cab-c"></div>
<div class="cab-t" role="group" aria-label="${t("Разделы кабинета", "Kabinet bo‘limlari")}">${[["plan", t("Подготовка", "Tayyorgarlik")], ["est", t("Смета", "Smeta")], ["pay", t("Оплаты", "To‘lovlar")]].map(([k, n], i) => `<button type="button" data-cab="${k}" aria-pressed="${i === 0}">${n}</button>`).join("")}</div>
<div class="cab-b" id="cab-b"></div></div>
</div>`);
  const rsvp = sec("rsvp", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Приглашение гостям", "Mehmonlarga taklifnoma")}</p>
<h2 class="h2 rise">${t("Гости отвечают <b>по ссылке</b>", "Mehmonlar <b>havola orqali</b> javob beradi")}</h2>
<p class="lead rise">${t("Своя страница события: программа, место, «приду» и что не ест. Ответы считаются сами и падают в кабинет и панель. Попробуйте ответить.", "Tadbirning o‘z sahifasi: dastur, joy, «kelaman» va nimani yemaydi. Javoblar o‘zi hisoblanadi va kabinet hamda panelga tushadi. Javob berib ko‘ring.")}</p>
<p class="rv-n rise"><b id="rv-n">0</b> ${t("гостей ответили «приду» в этом браузере", "mehmon shu brauzerda «kelaman» deb javob berdi")}</p></div>
<div class="phone tilt"><div class="ph-in"><div class="inv"><span class="inv-r">${MARK(64)}</span><small>${t("Приглашение · демо", "Taklifnoma · demo")}</small><h3>${t("Мадина <i>&amp;</i> Сардор", "Madina <i>&amp;</i> Sardor")}</h3><p class="inv-d" id="inv-d"></p>
<ul class="inv-p"><li><b>17:00</b>${t("Встреча гостей", "Mehmonlarni kutib olish")}</li><li><b>18:00</b>${t("Церемония", "Marosim")}</li><li><b>19:00</b>${t("Банкет и шоу", "Banket va shou")}</li></ul>
<p class="inv-a">${ICON.pin}<span>${t("Ресторан «[[t:2]]», Ташкент · демо", "«[[t:2]]» restorani, Toshkent · demo")}</span></p>
<form id="rv-f" novalidate><div class="rv-yes" role="group" aria-label="${t("Ответ", "Javob")}"><label><input type="radio" name="rv" value="1" checked><span>${t("Приду", "Kelaman")}</span></label><label><input type="radio" name="rv" value="0"><span>${t("Не смогу", "Kela olmayman")}</span></label></div>
<label class="fld"><span>${t("Имя", "Ism")}</span><input id="rv-name" autocomplete="name" required></label>
<div class="rv-row"><label class="fld"><span>${t("Сколько вас", "Necha kishisiz")}</span><input id="rv-c" type="number" min="1" max="10" value="2" inputmode="numeric"></label><label class="fld"><span>${t("Не ем", "Yemayman")}</span><input id="rv-diet" placeholder="${t("например, острое", "masalan, achchiq")}"></label></div>
<button type="submit" class="btn btn-a">${ICON.heart}<span>${t("Ответить", "Javob berish")}</span></button><p class="rv-ok" id="rv-ok" role="status"></p></form></div></div></div>
</div>`, " alt");
  const works = sec("works", `<div class="wrap">
<p class="kick rise"><i></i>${t("Работы", "Ishlar")}</p>
<h2 class="h2 rise">${t("Проекты <b>по поводу</b>", "Loyihalar <b>sabab bo‘yicha</b>")}</h2>
<p class="lead rise">${t("Здесь встанут ваши фото и ролики из Instagram. Пока в карточках иллюстрации в ваших цветах, а настоящий проект один: из вашего ролика.", "Bu yerga Instagram’dagi suratlaringiz va roliklaringiz qo‘yiladi. Hozircha kartochkalarda ranglaringizdagi illyustratsiyalar, haqiqiy loyiha esa bitta: rolikingizdan.")}</p>
<div class="wf rise" role="group" aria-label="${t("Фильтр", "Filtr")}"><button type="button" data-wf="all" aria-pressed="true">${t("Все", "Hammasi")}</button>${FORMATS.map((f) => `<button type="button" data-wf="${f.id}" aria-pressed="false">${esc(f[l][0])}</button>`).join("")}</div>
<div class="wg"><a class="wc case pop" href="${COMPANY.reel}" target="_blank" rel="noopener" data-f="corp"><span class="case-i">${ICON.play}</span><small>${t("Из вашего Instagram", "Instagramingizdan")}</small><b>${t("Культурная программа туристической конференции", "Turistik konferensiya uchun madaniy dastur")}</b><span>${t("Смотреть ролик", "Rolikni ko‘rish")} ${ICON.arrow}</span></a>${WORKS.map((w, i) => `<button type="button" class="wc pop" data-f="${w.f}" data-w="${i}" style="transition-delay:${(i % 3) * 80}ms">${pic(w.img, w[l])}<span><b>${esc(w[l])}</b><small>${t("иллюстрация", "illyustratsiya")}</small></span></button>`).join("")}</div>
</div>`);
  const tgbot = sec("tgbot", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Бот в Telegram", "Telegramdagi bot")}</p>
<h2 class="h2 rise">${t("Дата и смета <b>прямо в Telegram</b>", "Sana va smeta <b>to‘g‘ridan-to‘g‘ri Telegramda</b>")}</h2>
<p class="lead rise">${t("Гость пишет как в мессенджере. Бот уточняет дату и гостей, говорит, свободна ли дата, показывает вилку и передаёт заявку менеджеру.", "Mehmon messenjerdagidek yozadi. Bot sana va mehmonlarni aniqlaydi, sana bo‘shligini aytadi, oraliqni ko‘rsatadi va arizani menejerga uzatadi.")}</p></div>
<div class="chat glass" id="chat" aria-label="${t("Пример переписки с ботом", "Bot bilan yozishma namunasi")}"><p class="me">${t("Свадьба на 120 человек в июне", "Iyunda 120 kishilik to‘y")}</p><p class="bt">${t("Поздравляем! Какой день июня?", "Tabriklaymiz! Iyunning qaysi kuni?")}</p><p class="me">${t("Суббота, 20-е", "Shanba, 20-sana")}</p><p class="bt">${t("20 июня свободно. Банкет, авторское оформление, ведущий и артисты: ориентир", "20 iyun bo‘sh. Banket, mualliflik bezatish, boshlovchi va artistlar: taxminan")} <b id="chat-sum"></b>. ${t("Передал менеджеру, он позвонит.", "Menejerga uzatdim, u qo‘ng‘iroq qiladi.")}</p></div></div>`);
  const seoTopics = l === "ru"
    ? [["Свадьбы", "Организация свадьбы в Ташкенте: с чего начать", "Дата, площадка, гости и бюджет: порядок, в котором решают."], ["Торжества", "Юбилей в ресторане: что заказать заранее", "Оформление, программа и сладкий стол без суеты в последний день."], ["Кейтеринг", "Фуршет или банкет: что выбрать", "Сколько длится вечер, сколько гостей и как это меняет меню."], ["Оформление", "Оформление зала в цветах свадьбы", "Как подобрать палитру и сколько цветов нужно на стол."], ["Праздники", "Детский праздник: программа по возрасту", "Что занимает детей час, а что пять минут."], ["Деловые события", "Культурная программа для гостей конференции", "Чем удивить гостей Ташкента за один вечер."]]
    : [["To‘ylar", "Toshkentda to‘y tashkil qilish: nimadan boshlash", "Sana, maydon, mehmonlar va byudjet: qaror qabul qilinadigan tartib."], ["Tantanalar", "Restorandagi yubiley: nimani oldindan buyurtma qilish", "Oxirgi kun shoshilinchsiz bezatish, dastur va shirinlik stoli."], ["Keytering", "Furshet yoki banket: qaysi birini tanlash", "Kecha qancha davom etadi, necha mehmon va bu menyuni qanday o‘zgartiradi."], ["Bezatish", "Zalni to‘y ranglarida bezatish", "Ranglarni qanday tanlash va stolga qancha gul kerak."], ["Bayramlar", "Bolalar bayrami: yoshga qarab dastur", "Bolalarni bir soat nima band qiladi, nima besh daqiqa."], ["Ishbilarmonlik", "Konferensiya mehmonlari uchun madaniy dastur", "Toshkent mehmonlarini bir kechada qanday hayratlantirish."]];
  const seo = sec("seo", `<div class="wrap">
<p class="kick rise"><i></i>${t("Страницы под поиск", "Qidiruv uchun sahifalar")}</p>
<h2 class="h2 rise">${t("Чтобы вас находили <b>в Google и Яндексе</b>", "Sizni <b>Google va Yandexda</b> topishlari uchun")}</h2>
<p class="lead rise">${t("Сейчас по запросам о свадьбах и праздниках в Ташкенте выходят другие агентства. Шесть страниц на двух языках, в макете: заголовки и о чём текст.", "Hozir Toshkentdagi to‘ylar va bayramlar haqidagi so‘rovlarda boshqa agentliklar chiqadi. Ikki tilda oltita sahifa, maketda: sarlavhalar va matn nima haqida.")}</p>
<div class="kb">${seoTopics.map(([k, h, p], i) => `<article class="rise" style="transition-delay:${i * 70}ms"><small>${k}</small><h3>${h}</h3><p>${p}</p></article>`).join("")}</div></div>`, " alt");
  const admin = sec("admin", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Панель", "Panel")}</p>
<h2 class="h2 rise">${t("Заявки, даты и гости <b>в одной панели</b>", "Arizalar, sanalar va mehmonlar <b>bitta panelda</b>")}</h2>
<p class="lead rise">${t("Смета с сайта приходит первой строкой. Менеджер ставит «Встреча», и клиент видит это в «Моя заявка». Занятая в панели дата сразу закрывается на сайте.", "Saytdan smeta birinchi qatorda keladi. Menejer «Uchrashuv» qo‘yadi, mijoz buni «Arizam»da ko‘radi. Panelda band qilingan sana saytda darhol yopiladi.")}</p>
<div class="hero-act rise"><a class="btn btn-a" href="${href(l, "panel")}">${ICON.panel}<span>${t("Открыть панель", "Panelni ochish")}</span></a></div></div>
<div class="cards4">${[[t("Заявки и сметы", "Arizalar va smetalar"), t("с сайта, бота и звонков", "sayt, bot va qo‘ng‘iroqlardan")], [t("Календарь дат", "Sanalar kalendari"), t("занято на сайте сразу", "saytda darhol band")], [t("Гости", "Mehmonlar"), t("ответы на приглашение", "taklifnomaga javoblar")], [t("Роли и история", "Rollar va tarix"), t("менеджер не видит бюджеты", "menejer byudjetni ko‘rmaydi")]].map(([b, p], i) => `<div class="fc pop" style="transition-delay:${i * 70}ms"><b>${b}</b><p>${p}</p></div>`).join("")}</div>
</div>`);
  return { calc, quiz, dates, cab, rsvp, works, tgbot, seo, admin };
}

function about(l, t) {
  return `<section class="sec dark" id="about"><div class="wrap ab">
<div class="ab-y" aria-hidden="true"><b>2009</b><span>${MARK(120)}</span><b>2026</b></div>
<div><p class="kick rise"><i></i>${t("О студии", "Studiya haqida")}</p>
<h2 class="h2 rise">${esc(COMPANY.slogan[l]).replace(/(годами|yillar davomida)/, "<b>$1</b>")}</h2>
<p class="lead rise">${t("Sunday Event Agency в Ташкенте с 2009 года: авторские концепции, оформление, кейтеринг, мероприятия и шоу. Заголовок выше: ваши же слова из Instagram.", "Sunday Event Agency 2009 yildan beri Toshkentda: mualliflik konsepsiyalari, bezatish, keytering, tadbirlar va shou. Yuqoridagi sarlavha: Instagramdagi o‘z so‘zlaringiz.")}</p>
<div class="socials rise"><a href="https://www.instagram.com/${COMPANY.ig}/" target="_blank" rel="noopener">${ICON.ig}<span>@${COMPANY.ig}</span></a><a href="https://www.instagram.com/${COMPANY.ig2}/" target="_blank" rel="noopener">${ICON.ig}<span>@${COMPANY.ig2}</span></a><a href="https://t.me/${COMPANY.tg}" target="_blank" rel="noopener">${ICON.tg}<span>@${COMPANY.tg}</span></a></div></div>
</div></section>`;
}

function contact(l, t) {
  return `<section class="sec" id="contact"><div class="wrap contact">
<div><p class="kick rise"><i></i>${t("Связаться", "Bog‘lanish")}</p>
<h2 class="h2 rise">${t("Расскажите <b>о вашем дне</b>", "<b>Kuningiz</b> haqida aytib bering")}</h2>
<p class="lead rise">${t("Оставьте повод и дату: откроется Telegram с готовым текстом, менеджер ответит там же.", "Sabab va sanani qoldiring: tayyor matn bilan Telegram ochiladi, menejer o‘sha yerda javob beradi.")}</p>
<div class="cinfo rise"><a href="tel:${COMPANY.tel}">${ICON.phone}<span>${COMPANY.phone}</span></a><a href="https://t.me/${COMPANY.tg}" target="_blank" rel="noopener">${ICON.tg}<span>@${COMPANY.tg}</span></a><a href="mailto:${COMPANY.mail}">${ICON.mail}<span>${COMPANY.mail}</span></a><a href="${COMPANY.map}" target="_blank" rel="noopener">${ICON.pin}<span>${esc(COMPANY.addr[l])}</span></a></div></div>
<form class="cform glass" id="cf" novalidate>
<label class="fld"><span>${t("Имя", "Ism")}</span><input id="cf-n" autocomplete="name" required></label>
<label class="fld"><span>${t("Телефон", "Telefon")}</span><input id="cf-p" type="tel" autocomplete="tel" inputmode="tel" placeholder="+998" required></label>
<fieldset><legend>${t("Повод", "Sabab")}</legend><div class="chips">${FORMATS.map((f, i) => `<label class="chip"><input type="radio" name="cfk" value="${f.id}"${i === 0 ? " checked" : ""}><span>${esc(f[l][0])}</span></label>`).join("")}</div></fieldset>
<label class="fld"><span>${t("Дата, если уже есть", "Sana, agar bo‘lsa")}</span><input id="cf-d" type="date"></label>
<p class="err" id="cf-e" role="alert"></p>
<button type="submit" class="btn btn-a">${ICON.tg}<span>${t("Отправить в Telegram", "Telegramga yuborish")}</span></button>
<p class="mu sm">${t("В макете заявка ещё ложится в панель.", "Maketda ariza panelga ham tushadi.")}</p></form>
</div></section>`;
}

function footer(l, t) {
  return `<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l)}<p>${esc(COMPANY.slogan[l])}</p><a class="fphone" href="tel:${COMPANY.tel}">${COMPANY.phone}</a></div>
<div><h4>${t("Направления", "Yo‘nalishlar")}</h4>${DIRS.map((d) => `<a href="#dirs">${esc(d[l][0])}</a>`).join("")}</div>
<div><h4>${t("Поводы", "Sabablar")}</h4>${FORMATS.map((f) => `<a href="#formats">${esc(f[l][0])}</a>`).join("")}</div>
<div><h4>${t("Мы на связи", "Aloqadamiz")}</h4><a href="https://t.me/${COMPANY.tg}" target="_blank" rel="noopener">Telegram</a><a href="https://www.instagram.com/${COMPANY.ig}/" target="_blank" rel="noopener">Instagram</a><a href="https://www.facebook.com/${COMPANY.fb}/" target="_blank" rel="noopener">Facebook</a><a href="mailto:${COMPANY.mail}">${COMPANY.mail}</a></div>
</div>
<div class="sm2"><span>© 2009-2026 Sunday Event Agency</span><span>${t("Макет DevUz Studio. Иллюстрации: генерация в ваших цветах, не ваши работы. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Illyustratsiyalar: ranglaringizdagi generatsiya, sizning ishlaringiz emas. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</span></div>
</div></footer>`;
}

function siteData(l, t) {
  return {
    l, tg: COMPANY.tg, img: IMG, calc: { kinds: CALC.kinds.map((k) => ({ id: k.id, g: k.g, n: k[l] })), food: CALC.food.map((x) => ({ id: x.id, p: x.p, n: x[l] })), decor: CALC.decor.map((x) => ({ id: x.id, p: x.p, n: x[l] })), show: CALC.show.map((x) => ({ id: x.id, p: x.p, n: x[l] })), extra: CALC.extra.map((x) => ({ id: x.id, p: x.p, n: x[l] })), fee: CALC.fee, spread: CALC.spread },
    works: WORKS.map((w) => ({ img: w.img, n: w[l] })),
    t: {
      guests: t("гостей", "mehmon"), per: t("на гостя", "mehmon boshiga"), food: t("Кейтеринг", "Keytering"), decor: t("Оформление", "Bezatish"), show: t("Шоу", "Shou"), fee: t("Работа команды Sunday, 10%", "Sunday jamoasi ishi, 10%"),
      hello: t("Здравствуйте! Собрал смету на сайте:", "Assalomu alaykum! Saytda smeta tuzdim:"), total: t("Ориентир", "Taxminan"),
      req: t("Здравствуйте! Хочу обсудить событие.", "Assalomu alaykum! Tadbirni muhokama qilmoqchiman."), kind: t("Повод", "Sabab"), date: t("Дата", "Sana"), name: t("Имя", "Ism"), phone: t("Телефон", "Telefon"),
      need: t("Напишите имя и телефон", "Ism va telefonni yozing"), sent: t("Заявка в панели. Открываем Telegram", "Ariza panelda. Telegram ochilmoqda"),
      mine: t("Моя заявка", "Arizam"), no: t("Заявка", "Ariza"), mineHint: t("Это макет: статус меняется в панели, и вы видите его здесь.", "Bu maket: holat panelda o‘zgaradi va siz uni shu yerda ko‘rasiz."), panel: t("Открыть панель", "Panelni ochish"), panelUrl: href(l, "panel"),
      st: [t("Новая", "Yangi"), t("Встреча", "Uchrashuv"), t("Смета отправлена", "Smeta yuborildi"), t("Договор", "Shartnoma"), t("Отказ", "Rad etildi")],
      close: t("Закрыть", "Yopish"),
      months: l === "ru" ? ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"] : ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
      mgen: l === "ru" ? ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"] : ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
      wd: l === "ru" ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] : ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"],
      busy: t("Эта дата уже занята", "Bu sana band"), held: t("Дата у менеджера как бронь", "Sana menejerda bron sifatida"), holdMsg: t("Здравствуйте! Хочу забронировать дату:", "Assalomu alaykum! Sanani bron qilmoqchiman:"),
      days: t("дней до события", "kun tadbirgacha"), paid: t("оплачено", "to‘langan"), left: t("к оплате", "to‘lanadi"), done: t("готово", "tayyor"),
      cab: {
        plan: l === "ru" ? [["Концепция и палитра", 1], ["Площадка и меню", 1], ["Оформление: эскиз зала", 1], ["Программа вечера и ведущий", 0], ["Репетиция церемонии", 0], ["Тайминг дня для всех подрядчиков", 0]] : [["Konsepsiya va ranglar", 1], ["Maydon va menyu", 1], ["Bezatish: zal eskizi", 1], ["Kecha dasturi va boshlovchi", 0], ["Marosim mashqi", 0], ["Barcha pudratchilar uchun kun vaqt rejasi", 0]],
        est: l === "ru" ? [["Банкет, 150 гостей", 4200], ["Авторское оформление", 1800], ["Ведущий и артисты", 1200], ["Фото и видео", 700], ["Свет и звук", 900]] : [["Banket, 150 mehmon", 4200], ["Mualliflik bezatish", 1800], ["Boshlovchi va artistlar", 1200], ["Foto va video", 700], ["Yorug‘lik va ovoz", 900]],
        pay: l === "ru" ? [["Предоплата за площадку", 2000, 1], ["Оформление, 50%", 900, 1], ["Остаток за неделю до дня", 5900, 0]] : [["Maydon uchun oldindan to‘lov", 2000, 1], ["Bezatish, 50%", 900, 1], ["Kundan bir hafta oldin qoldiq", 5900, 0]],
      },
      demoDate: t("демо-дата", "demo sana"),
      rvOk: t("Спасибо! Ответ у пары и в панели.", "Rahmat! Javob juftlikda va panelda."), rvNo: t("Жаль! Пара увидит ваш ответ.", "Afsus! Juftlik javobingizni ko‘radi."), rvNeed: t("Напишите имя", "Ismingizni yozing"),
      quiz: {
        q: l === "ru" ? ["Какой повод?", "Какое настроение?", "Какие цвета ближе?", "Где празднуем?"] : ["Qanday sabab?", "Qanday kayfiyat?", "Qaysi ranglar yaqinroq?", "Qayerda nishonlaymiz?"],
        a: l === "ru"
          ? [["Свадьба", "Юбилей", "День рождения", "Деловое событие"], ["Торжественно", "Уютно, по-семейному", "Ярко, с шоу", "Сдержанно, стильно"], ["Синий и розовый", "Белый и золото", "Зелень и пудра", "Глубокий бордо"], ["Ресторан", "Сад, под открытым небом", "Загородный дом", "Конференц-зал"]]
          : [["To‘y", "Yubiley", "Tug‘ilgan kun", "Ishbilarmonlik tadbiri"], ["Tantanali", "Shinam, oilaviy", "Yorqin, shou bilan", "Vazmin, zamonaviy"], ["Ko‘k va pushti", "Oq va oltin", "Yashil va upa rang", "To‘q bordo"], ["Restoran", "Bog‘, ochiq osmon ostida", "Shahar tashqarisidagi uy", "Konferensiya zali"]],
        names: l === "ru" ? ["«Вечерний сад»", "«Белое золото»", "«Ночь Sunday»", "«Тихий шёлк»"] : ["«Kechki bog‘»", "«Oq oltin»", "«Sunday kechasi»", "«Sokin ipak»"],
        desc: l === "ru" ? ["Живые цветы по столам, свечи и тёплый свет гирлянд. Гости приходят ещё засветло, вечер раскрывается вместе с огнями.", "Белые ткани, золото в приборах и деталях, высокие композиции. Строго, торжественно, красиво на фото.", "Глубокий синий зал, розовые акценты, свет в такт программе. Шоу и танцы до последнего гостя.", "Мягкие оттенки, мало деталей и много воздуха. Тишина, в которой слышно каждое слово тоста."] : ["Stollarda tirik gullar, shamlar va girlyandalarning iliq nuri. Mehmonlar hali yorug‘da keladi, kecha chiroqlar bilan ochiladi.", "Oq matolar, anjomlar va tafsilotlarda oltin, baland kompozitsiyalar. Qat’iy, tantanali, suratda chiroyli.", "To‘q ko‘k zal, pushti urg‘ular, dastur ritmidagi yorug‘lik. Oxirgi mehmongacha shou va raqslar.", "Yumshoq ohanglar, kam tafsilot va ko‘p havo. Har bir qadah so‘zi eshitiladigan sokinlik."],
        pal: [["#344488", "#dc4468", "#f3e7dc"], ["#ffffff", "#c9a45c", "#e8e1d6"], ["#1a213b", "#344488", "#dc4468"], ["#b7c4a3", "#e9c9c3", "#f6f1ea"]],
        img: ["wedding", "table", "show", "catering"],
        res: t("Ваша концепция", "Konsepsiyangiz"), send: t("Отправить концепцию", "Konsepsiyani yuborish"), again: t("Пройти ещё раз", "Qayta o‘tish"), of: t("из", "/"), msg: t("Здравствуйте! Подобрал концепцию на сайте:", "Assalomu alaykum! Saytda konsepsiya tanladim:"), ill: t("иллюстрация", "illyustratsiya"),
      },
    },
  };
}

function sitePage(l) {
  const t = T(l);
  const A = addonBlocks(l, t);
  const title = t("Sunday Event Agency · свадьбы, торжества и праздники в Ташкенте с 2009 года", "Sunday Event Agency · Toshkentda to‘ylar, tantanalar va bayramlar, 2009 yildan");
  const desc = t("Ивент-агентство в Ташкенте: оформление, кейтеринг, мероприятия и шоу. Смета по строкам за минуту, свободные даты, приглашение гостям.", "Toshkentdagi ivent-agentlik: bezatish, keytering, tadbirlar va shou. Bir daqiqada qatorma-qator smeta, bo‘sh sanalar, mehmonlarga taklifnoma.");
  return `${head(l, title, desc)}
<style>${CSS}</style>
</head>
<body class="site">
${MARK_DEFS}
<a class="vh" href="#calc">${t("К смете", "Smetaga o‘tish")}</a>
${header(l, t)}
<main>
${hero(l, t)}
${velo(l)}
${dirs(l, t)}
${formats(l, t)}
${A.calc}
${A.quiz}
${how(l, t)}
${A.dates}
${A.works}
${A.cab}
${A.rsvp}
${A.tgbot}
${A.seo}
${A.admin}
${about(l, t)}
${contact(l, t)}
</main>
${footer(l, t)}
<a class="cfgb glass" href="${href(l)}#offer">${t("Конструктор", "Konstruktor")}</a>
<div class="dock glass" id="dock"><a class="btn btn-a" href="#calc">${ICON.calc}<span>${t("Смета", "Smeta")}</span></a><a class="btn btn-g" href="https://t.me/${COMPANY.tg}" target="_blank" rel="noopener">${ICON.tg}<span>Telegram</span></a></div>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="shh"><div class="sh" data-close></div><div class="box"><div class="bh"><b id="shh"></b><button type="button" class="x" data-close aria-label="${t("Закрыть", "Yopish")}">${ICON.close}</button></div><div class="bb" id="shb"></div></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="sn-data">${JSON.stringify(siteData(l, t)).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}

/* ── Первая страница: залёт в розетку, выбор, конструктор DevUz ───── */
/* Гирлянды вечернего зала: лампочки по провисающим нитям, загораются по
   очереди от прокрутки (--gl). Кодом. */
function hall() {
  const strands = [[0, 120, 1600, 60, 260], [0, 40, 1600, 180, 300], [0, 260, 1600, 200, 220]];
  let bulbs = "", lines = "", n = 0;
  for (const [x0, y0, x1, y1, sag] of strands) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + sag;
    lines += `<path d="M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}"/>`;
    for (let k = 1; k < 24; k++) {
      const u = k / 24, x = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, y = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1;
      bulbs += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="5" style="--i:${(n++ % 69) / 69}"/>`;
    }
  }
  /* Длинный стол уходит в глубину: скатерть и свечи линиями. */
  const table = `<path class="tb" d="M560 900 L760 520 L840 520 L1040 900Z"/>${Array.from({ length: 7 }, (_, i) => { const u = i / 7, y = 860 - u * 320, x1 = 600 + u * 168, x2 = 1000 - u * 168, h = 40 - u * 26; return `<path class="cd" d="M${x1.toFixed(0)} ${y.toFixed(0)}v-${h.toFixed(0)}M${x2.toFixed(0)} ${y.toFixed(0)}v-${h.toFixed(0)}"/><circle class="fl" cx="${x1.toFixed(0)}" cy="${(y - h - 6).toFixed(0)}" r="${(5 - u * 3).toFixed(1)}"/><circle class="fl" cx="${x2.toFixed(0)}" cy="${(y - h - 6).toFixed(0)}" r="${(5 - u * 3).toFixed(1)}"/>`; }).join("")}`;
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g class="gw">${lines}</g><g class="gb">${bulbs}</g>${table}</svg>`;
}

function offer(l, t) {
  return `<section class="sec offer" id="offer"><div class="wrap">
<p class="kick"><i></i>${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</p>
<h2 class="h2">${t("Сайт <b>по этому макету</b>", "Shu maket <b>bo‘yicha sayt</b>")}</h2>
<p class="lead">${t(`48 часов с первого открытия макета: сайт ${usd(BASE.promo)} вместо ${usd(BASE.price)}. Допы включаются тумблером, и их блок на сайте тут же появляется или пропадает.`, `Maket birinchi ochilganidan 48 soat: sayt ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}. Qo‘shimchalar tumbler bilan yoqiladi va ularning bloki saytda darhol paydo bo‘ladi yoki yo‘qoladi.`)}</p>
<div class="cst"><div>
<div class="base"><div class="hd"><b>${esc(BASE[l].t)}</b><span class="pp"><s>${usd(BASE.price)}</s>${usd(BASE.promo)}</span></div><p>${esc(BASE[l].d)}</p></div>
<div class="adds">${ADDONS.map((a) => `<label class="add"><input type="checkbox" data-add="${a.id}" checked><span class="sw" aria-hidden="true"></span><span><b>${esc(a[l].t)}</b>${a.star ? `<span class="star">${t("берут первым", "birinchi oladilar")}</span>` : ""}<p>${esc(a[l].e)}</p><small>${esc(a[l].who)}</small></span><span class="ap">${usd(a.price)}</span></label>`).join("")}</div>
</div>
<aside class="sum glass" aria-live="polite">
<div class="row"><span>${t("Сайт", "Sayt")}</span><span>${usd(BASE.promo)}</span></div>
<div class="row"><span>${t("Допы", "Qo‘shimchalar")} <span id="addn"></span></span><span id="adds">0 $</span></div>
<div class="tot"><span>${t("Итого", "Jami")}</span><b id="total">${usd(ALL)}</b></div>
<p class="mu sm">${t("Цена сайта держится:", "Sayt narxi amal qiladi:")}</p>
<div class="timer" id="timer"><span><b id="th">48</b><small>${t("часов", "soat")}</small></span><span><b id="tm">00</b><small>${t("минут", "daqiqa")}</small></span><span><b id="ts">00</b><small>${t("секунд", "soniya")}</small></span></div>
<div class="ctrl"><button type="button" class="btn btn-g btn-s" id="allon">${t("Всё из макета", "Maketdagi hammasi")}</button><button type="button" class="btn btn-g btn-s" id="alloff">${t("Только сайт", "Faqat sayt")}</button></div>
<button type="button" class="btn btn-g" id="copy">${ICON.copy}<span>${t("Скопировать состав", "Tarkibni nusxalash")}</span></button>
<a class="btn btn-a" href="${DEVUZ}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
</aside></div>
</div></section>`;
}

function landPage(l) {
  const t = T(l);
  const site = [
    t("Залёт в вашу розетку: лепестки расходятся, внутри вечерний зал", "Rozetkangizga uchib kirish: barglar ochiladi, ichida kechki zal"),
    t("Четыре направления из вашего Instagram и поводы со старого сайта", "Instagramingizdagi to‘rt yo‘nalish va eski saytdagi sabablar"),
    t("Смета по строкам, подбор концепции, свободные даты", "Qatorma-qator smeta, konsepsiya tanlash, bo‘sh sanalar"),
    t("Кабинет пары и приглашение гостям с ответами", "Juftlik kabineti va javobli mehmon taklifnomasi"),
    t("Заявка в ваш Telegram с готовым текстом", "Tayyor matn bilan Telegramingizga ariza"),
  ];
  const pan = [
    t("Смета с сайта первой строкой, статус виден клиенту", "Saytdan smeta birinchi qatorda, holati mijozga ko‘rinadi"),
    t("Календарь: занятая дата сразу закрыта на сайте", "Kalendar: band sana saytda darhol yopiladi"),
    t("Гости: кто ответил «приду» и что не ест", "Mehmonlar: kim «kelaman» dedi va nimani yemaydi"),
    t("Роли: менеджер не видит бюджеты, история действий", "Rollar: menejer byudjetni ko‘rmaydi, harakatlar tarixi"),
    t("Вход кодом из Telegram, выгрузки CSV", "Telegram kodi bilan kirish, CSV yuklab olish"),
  ];
  const li = (a) => `<ul class="feat">${a.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>`;
  const steps = [
    t("Откройте сайт, в «Смете» выберите «Свадьба», 200 гостей и «Банкет премиум».", "Saytni oching, «Smeta»da «To‘y», 200 mehmon va «Premium banket»ni tanlang."),
    t("Нажмите «Отправить смету»: откроется Telegram с текстом, а заявка ляжет в панель.", "«Smetani yuborish»ni bosing: matn bilan Telegram ochiladi, ariza esa panelga tushadi."),
    t("В панели смета первой строкой. Поставьте «Встреча», займите дату в календаре: сайт покажет и то, и другое.", "Panelda smeta birinchi qatorda. «Uchrashuv» qo‘ying, kalendarda sanani band qiling: sayt ikkalasini ham ko‘rsatadi."),
  ];
  const ld = { base: BASE.promo, hours: OFFER_HOURS, add: ADDONS.map((a) => ({ id: a.id, p: a.price, t: a[l].t })), from: COMPANY.since, to: COMPANY.since + COMPANY.years, t: { copied: t("Состав скопирован", "Tarkib nusxalandi"), tot: t("Итого", "Jami") } };
  return `${head(l, t("Sunday Event Agency · макет сайта и панели · DevUz Studio", "Sunday Event Agency · sayt va panel maketi · DevUz Studio"), t("Макет для Sunday Event Agency: новый сайт со сметой, датами и приглашением гостям и панель заявок. Конструктор цены.", "Sunday Event Agency uchun maket: smeta, sanalar va mehmon taklifnomasi bilan yangi sayt va arizalar paneli. Narx konstruktori."))}
<link rel="preload" as="image" href="${IMG}/hall-9.webp" media="(max-width: 899px)">
<link rel="preload" as="image" href="${IMG}/hall-1344.webp" media="(min-width: 900px)">
<style>${CSS}</style>
</head>
<body class="land">
${dzIntroSolo(l)}
${MARK_DEFS}
<header class="top"><div class="top-in glass">
${LOGO(l, "")}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}"><a href="#choose">${t("Что посмотреть", "Nimani ko‘rish")}</a><a href="#try">${t("Как проверить", "Qanday tekshirish")}</a><a href="#offer">${t("Стоимость", "Narxi")}</a></nav>
<div class="langs">${LANGS.map((x) => `<a href="${href(x)}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<a class="btn btn-g btn-s" href="${href(l, "site")}">${t("Сайт", "Sayt")}</a>
<a class="btn btn-a btn-s" aria-label="${t("Панель", "Panel")}" href="${href(l, "panel")}">${ICON.panel}<span class="hide-s">${t("Панель", "Panel")}</span></a>
</div></header>
<main>
<section class="hs" id="fly" aria-label="${t("Залёт в розетку Sunday", "Sunday rozetkasiga uchib kirish")}"><div class="hs-st">
<div class="fl-hall" aria-hidden="true">${hall()}</div>
<div class="fl-mark"><svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Sunday Event Agency"><g class="fl-l1"><use href="#sn-l1" fill="#344488" opacity=".72"/></g><g class="fl-l2"><use href="#sn-l2" fill="#344488" opacity=".88"/></g><g class="fl-l3"><use href="#sn-l3" fill="#344488"/><use href="#sn-cut"/></g><circle cx="200" cy="200" r="16" fill="#1a213b"/><circle class="fl-core" cx="200" cy="200" r="6" fill="#dc4468"/></svg></div>
<div class="fl-word" aria-hidden="true"><small>since 2009</small><b>SUNDAY</b><small>event agency</small></div>
<div class="fl-top"><p class="kick"><i></i>${t("Макет DevUz Studio для Sunday", "Sunday uchun DevUz Studio maketi")}<i></i></p><p>${t("Листайте: камера войдёт в центр вашей розетки.", "Aylantiring: kamera rozetkangiz markaziga kiradi.")}</p></div>
<div class="fl-count" aria-hidden="true"><b>${COMPANY.since}</b><span>${t("лет праздников с вами", "yillik bayramlar siz bilan")}</span></div>
<div class="fl-iris" aria-hidden="true"><picture><source media="(max-width: 899px)" srcset="${IMG}/hall-9.webp"><img src="${IMG}/hall-1344.webp" width="1344" height="752" alt=""></picture></div>
<div class="fl-shade" aria-hidden="true"></div>
<div class="wrap fl-tx"><p class="kick"><i></i>Event agency · ${t("Ташкент, с 2009 года", "Toshkent, 2009 yildan")}</p>
<h1>${t("События, о которых <em>говорят годами</em>", "Yillar davomida <em>gapiriladigan</em> tadbirlar")}</h1>
<p class="lead">${t("Ваш sunday.uz сейчас не открывается. Вот каким он может быть: со сметой, датами и кабинетом для пары.", "sunday.uz saytingiz hozir ochilmayapti. Mana u qanday bo‘lishi mumkin: smeta, sanalar va juftlik kabineti bilan.")}</p>
<a class="btn btn-a" href="#choose">${t("Смотреть макет", "Maketni ko‘rish")}${ICON.arrow}</a></div>
<div class="hs-hint" aria-hidden="true"><span>${t("Листайте", "Aylantiring")}</span><i></i></div>
<p class="ill fl-ill" aria-hidden="true">${t("Иллюстрация в ваших цветах", "Ranglaringizdagi illyustratsiya")}</p>
</div></section>
<section class="sec" id="choose"><div class="wrap">
<p class="kick rise"><i></i>${t("Сайт и панель на ваших данных", "Ma’lumotlaringizdagi sayt va panel")}</p>
<h2 class="h2 rise">${t("Что посмотреть <b>первым</b>", "Avval <b>nimani ko‘rish</b>")}</h2>
<p class="lead rise">${t("Это работающий макет на ваших словах, направлениях и контактах из Instagram, Telegram и старой страницы sunday.uz. Сайт, каким его увидит пара или компания, или панель, где команда ведёт заявки, даты и гостей.", "Bu Instagram, Telegram va eski sunday.uz sahifasidagi so‘zlaringiz, yo‘nalishlaringiz va kontaktlaringizdagi ishlaydigan maket. Juftlik yoki kompaniya ko‘radigan sayt yoki jamoa arizalar, sanalar va mehmonlarni olib boradigan panel.")}</p>
<div class="choices">
<a class="choice rise" href="${href(l, "site")}"><span class="ch-k">${t("Для ваших клиентов", "Mijozlaringiz uchun")}</span><b>${t("Сайт", "Sayt")}</b>
<span class="ch-pic"><img src="${IMG}/wedding-640.webp" width="640" height="482" alt="${t("Иллюстрация: церемония в саду с цветочной аркой", "Illyustratsiya: gul arkali bog‘dagi marosim")}" loading="lazy"></span>
${li(site)}<span class="btn btn-g">${t("Открыть сайт", "Saytni ochish")}${ICON.arrow}</span></a>
<a class="choice rise" href="${href(l, "panel")}"><span class="ch-k">${t("Для вас и команды", "Siz va jamoa uchun")}</span><b>${t("Панель заявок и дат", "Arizalar va sanalar paneli")}</b>
<span class="ch-pic"><span class="browser"><span class="bh"><i></i><i></i><i></i></span><span class="bb"><span class="kpi"><small>${t("Заявки, 7 дней · демо", "Arizalar, 7 kun · demo")}</small><b>31</b></span><span class="kpi"><small>${t("Занято в июне · демо", "Iyunda band · demo")}</small><b>9</b></span><span class="kpi w"><small>${t("Смета с сайта", "Saytdan smeta")}</small><b>№5001</b></span></span></span></span>
${li(pan)}<span class="btn btn-a">${t("Открыть панель", "Panelni ochish")}${ICON.arrow}</span></a>
</div>
</div></section>
<section class="sec alt" id="try"><div class="wrap">
<p class="kick rise"><i></i>${t("Как проверить за минуту", "Bir daqiqada qanday tekshirish")}</p>
<h2 class="h2 rise">${t("Сайт и панель <b>связаны</b>", "Sayt va panel <b>bog‘langan</b>")}</h2>
<ol class="ol">${steps.map((s) => `<li class="rise">${s}</li>`).join("")}</ol>
<div class="hero-act rise"><a class="btn btn-a" href="${href(l, "site")}#calc">${t("Начать со сметы", "Smetadan boshlash")}${ICON.arrow}</a></div>
</div></section>
${offer(l, t)}
</main>
<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l, "")}<p>${t("Слова, направления и контакты: ваш Instagram, Telegram, Facebook, карточка на Яндекс Картах и старая страница sunday.uz. Заявки и цифры в панели и кабинете: демо. Картинки: генерация в ваших цветах, не ваши работы.", "So‘zlar, yo‘nalishlar va kontaktlar: Instagram, Telegram, Facebook, Yandex Xaritalardagi kartochka va eski sunday.uz sahifasi. Panel va kabinetdagi arizalar va raqamlar: demo. Rasmlar: ranglaringizdagi generatsiya, sizning ishlaringiz emas.")}</p></div>
<div><h4>${t("Макет", "Maket")}</h4><a href="${href(l, "site")}">${t("Сайт", "Sayt")}</a><a href="${href(l, "panel")}">${t("Панель", "Panel")}</a><a href="#offer">${t("Стоимость", "Narxi")}</a></div>
<div><h4>DevUz Studio</h4><a href="https://devuz.studio" target="_blank" rel="noopener">devuz.studio</a><a href="${DEVUZ}" target="_blank" rel="noopener">Telegram</a></div>
<div><h4>Sunday</h4><a href="tel:${COMPANY.tel}">${COMPANY.phone}</a><a href="https://www.instagram.com/${COMPANY.ig}/" target="_blank" rel="noopener">Instagram</a></div>
</div>
<div class="sm2"><span>${t("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</span></div>
</div></footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="sn-land">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<script>
${LAND_JS}</script>
</body>
</html>`;
}

/* ── Панель (эталоны Greenwell и Cargo Pro, вид Glassy V7 + CRM) ───── */
(function checkDict() {
  const keys = new Set([...PANEL_JS.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  for (const k of ["tab_", "k_"]) keys.delete(k);
  for (const k of keys) {
    const v = PANEL_UI[k];
    if (!v || v.length !== 2 || v.some((x) => !x)) throw new Error(`panel: нет подписи «${k}» на двух языках`);
    if (/[А-Яа-яЁё]/.test(v[1])) throw new Error(`panel: кириллица в узбекской подписи «${k}»`);
  }
  for (const pre of ["tab_", "k_", "st_"]) for (const k of Object.keys(PANEL_UI)) if (k.startsWith(pre) && PANEL_UI[k].length !== 2) throw new Error(`panel: «${k}»`);
  if (/[А-Яа-яЁё]/.test(PANEL_JS + PANEL_CSS)) throw new Error("panel: кириллица в коде панели");
})();

function panelPage(l) {
  const t = T(l);
  const ui = Object.fromEntries(Object.entries(PANEL_UI).map(([k, v]) => [k, v[l === "ru" ? 0 : 1]]));
  const pd = { l, site: href(l, "site"), home: href(l), ui, addr: COMPANY.addr[l], names: NAMES[l], corp: CORP[l], months: siteData(l, t).t.months, wd: siteData(l, t).t.wd };
  return `${head(l, t("Панель Sunday · демо", "Sunday paneli · demo"), t("Панель Sunday Event Agency: заявки и сметы с сайта, календарь дат, гости, история и роли. Демо-данные.", "Sunday Event Agency paneli: saytdan arizalar va smetalar, sanalar kalendari, mehmonlar, tarix va rollar. Demo ma’lumotlar."))}
<style>${CSS}${PANEL_CSS}</style>
</head>
<body class="pn">
${MARK_DEFS}
<div class="pn-bg" aria-hidden="true"><img src="${IMG}/hall-960.webp" width="960" height="537" alt=""></div>
<div id="app"></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<footer class="pn-foot">${t("Макет DevUz Studio, демо-данные. Пользуясь макетом, вы принимаете", "DevUz Studio maketi, demo ma’lumotlar. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</footer>
<script type="application/json" id="pn-data">${JSON.stringify(pd).replace(/</g, "\\u003c")}</script>
<script>
${PANEL_JS}</script>
</body>
</html>`;
}

const out = {};
for (const l of LANGS) {
  out[KEY[l]] = landPage(l);
  out[(KEY[l] ? KEY[l] + "/" : "") + "site"] = sitePage(l);
  out[(KEY[l] ? KEY[l] + "/" : "") + "panel"] = panelPage(l);
}
for (const [k, v] of Object.entries(out)) {
  if (k.startsWith("uz")) {
    const vis = v.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style>[\s\S]*?<\/style>/g, "");
    const m = vis.match(/[^\s<>"]*[А-Яа-яЁё][^\s<>"]*/g);
    if (m) throw new Error(`${k}: кириллица на узбекской странице: ${[...new Set(m)].slice(0, 12).join(" ")}`);
    const js = (v.match(/<script type="application\/json"[\s\S]*?<\/script>/g) || []).join("");
    const mj = js.match(/[^\s<>"]*[А-Яа-яЁё][^\s<>"]*/g);
    if (mj) throw new Error(`${k}: кириллица в данных узбекской страницы: ${[...new Set(mj)].slice(0, 12).join(" ")}`);
  }
  if (/[\u2014\u2013]/.test(v.replace(/<script(?! type="application\/json")[\s\S]*?<\/script>/g, ""))) throw new Error(`${k}: длинное тире на странице`);
}
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/* Сборка для сервера (lib/proto/bundles): стили и скрипты один раз. */
const parts = { J: `<script>\n${JS}</script>`, C: `<style>${CSS}</style>`, PJ: `<script>\n${PANEL_JS}</script>`, LJ: `<script>\n${LAND_JS}</script>`, PC: `<style>${CSS}${PANEL_CSS}</style>` };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const name of ["PC", "C", "J", "PJ", "LJ"]) p = p.split(parts[name]).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "sunday.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(10), v.length);
