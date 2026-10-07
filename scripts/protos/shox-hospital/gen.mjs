// Прототип Shox International Hospital: главная и «Что дальше» на ru, uz, en.
// node gen.mjs → out/pages.json (локальный показ, serve.mjs) и
// content/proto-bundles/shox-hospital.json (сервер, lib/proto/bundles).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { DIRS, DOCS, BRANCHES, ROBOT_OPS, ROBOT_PLUS, SOCIAL, BOT } from "./data.mjs";
import { BASE as KIT, EXTRAS, GROUPS } from "./plan.mjs";

const DIR = new URL(".", import.meta.url).pathname;
const CSS = readFileSync(DIR + "style.css", "utf8").replace(/\n/g, "");
const JS = readFileSync(DIR + "client.js", "utf8");
const LOGO = readFileSync(DIR + "assets/logo-187.svg", "utf8").trim().replace("<svg ", '<svg aria-hidden="true" ');
const BASEURL = "__PROTO_BASE__";
const IMG = "/clients/shox-hospital";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const LANGS = ["ru", "uz", "en"];
const PAGES = ["", "plan"];

const usd = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, path = "") => BASEURL + (l === "ru" ? "" : "/" + l) + (path ? "/" + path : "");
const tr = (l) => (ru, uz, en) => ({ ru, uz, en })[l];
const name = (doc, l) => (l === "ru" ? doc.ru : doc.la);
const DIRMAP = Object.fromEntries(DIRS.map((x) => [x.id, x]));

const P = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  brain: P('<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>'),
  bone: P('<path d="M8 16 16 8M6.5 18.5a2 2 0 1 1-2.8-2.8 2 2 0 1 1 2.8-2.8l1.5 1.5M17.5 5.5a2 2 0 1 1 2.8 2.8 2 2 0 1 1-2.8 2.8L16 9.6"/>'),
  clip: P('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 11h6M9 15h4"/>'),
  heart: P('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 11h2l1-2 2 4 1-2h2"/>'),
  robot: P('<path d="M12 3v3M8 21l2-7h4l2 7M6 14l3-5h6l3 5"/><circle cx="12" cy="7" r="1.5"/><path d="M6 14v3M18 14v3"/>'),
  scalpel: P('<path d="M4 20 15 9l3 3-6 6H4zM15 9l4-4 1 1-2 6"/>'),
  venus: P('<circle cx="12" cy="9" r="5"/><path d="M12 14v7M9 18h6"/>'),
  wave: P('<path d="M3 12h3l2-5 3 10 3-8 2 3h5"/>'),
  scan: P('<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="4"/>'),
  kidney: P('<path d="M15 4c3 0 5 3 5 7s-2 9-6 9c-3 0-3-3-3-5s2-2 2-4-3-2-3-4 2-3 5-3zM9 7c-3 0-5 2-5 5 0 2 1 4 3 4"/>'),
  lungs: P('<path d="M12 4v8M12 12l-2 2M12 12l2 2M9 7c-3 1-5 5-5 10 0 2 2 3 4 2l2-1V9M15 7c3 1 5 5 5 10 0 2-2 3-4 2l-2-1V9"/>'),
  drop: P('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
  child: P('<circle cx="12" cy="6" r="3"/><path d="M8 21v-6l-2-3M16 21v-6l2-3M8 12h8"/>'),
  ear: P('<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/><path d="M10 9a2 2 0 0 1 4 0c0 1-1 2-2 2"/>'),
  hand: P('<path d="M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7c-3 0-4-2-6-5l-1-2a1.5 1.5 0 0 1 2.5-1.5L8 15"/>'),
  walk: P('<circle cx="13" cy="4" r="2"/><path d="M9 21l2-6 3 3v3M7 12l3-4 4 1 2 4 3 1"/>'),
  shield: P('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="M9 12h6M12 9v6"/>'),
  vein: P('<path d="M4 20c4 0 4-6 8-6s4 6 8 6M4 4c4 0 4 6 8 6s4-6 8-6"/>'),
  eye: P('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  tg: P('<path d="M21 4 3 11l6 2.5M21 4l-3.5 16-8.5-6.5M21 4 9 13.5V19l3-3.5"/>'),
  phone: P('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  insta: P('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>'),
  play: P('<rect x="3" y="5" width="18" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>'),
  fb: P('<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>'),
  mail: P('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  check: P('<path d="m5 12 5 5 9-10"/>'),
  search: P('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  cal: P('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
};
const DZLOGO = '<svg class="dz-logo" viewBox="-120 -120 240 240" aria-hidden="true"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-120" y="-120" width="240" height="240" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z" fill="url(#dzg)" mask="url(#dzc)"/><rect x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>';

/* ── Строки для скрипта ── */
const I18N = {
  ru: { flyStart: "Листайте — пролетим мимо врачей", dec: ",", dscWon: "Скидка 10% ваша", dscCode: "Код:", dscBook: "Записаться со скидкой", dscOver: "Время вышло", dscOverSub: "Запись открыта и без скидки", anyDoc: "Любой свободный врач", anyDocSub: "Подберёт администратор", anyDir: "Нужна консультация — подскажите, к кому", sumDir: "Направление", sumDoc: "Врач", sumTime: "Время", sumName: "Имя", sumTel: "Телефон", sumNote: "Комментарий", msgHead: "Здравствуйте! Хочу записаться на приём в Shox International Hospital.", msgDisc: "Скидка 10% закреплена на сайте, код", found: "Найдено: {n}", blocks: "допов: {n}", kitHead: "Сайт Shox International Hospital — состав", kitBase: "Сайт", kitTotal: "Итого", copied: "Скопировано", copyFail: "Не удалось скопировать", wd: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"], mo: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"] },
  uz: { flyStart: "Suring — shifokorlar yonidan uchib o‘tamiz", dec: ",", dscWon: "10% chegirma sizniki", dscCode: "Kod:", dscBook: "Chegirma bilan yozilish", dscOver: "Vaqt tugadi", dscOverSub: "Chegirmasiz ham yozilish ochiq", anyDoc: "Istalgan bo‘sh shifokor", anyDocSub: "Administrator tanlaydi", anyDir: "Konsultatsiya kerak — kimga borishni ayting", sumDir: "Yo‘nalish", sumDoc: "Shifokor", sumTime: "Vaqt", sumName: "Ism", sumTel: "Telefon", sumNote: "Izoh", msgHead: "Assalomu alaykum! Shox International Hospital’da qabulga yozilmoqchiman.", msgDisc: "Saytda 10% chegirma biriktirildi, kod", found: "Topildi: {n}", blocks: "qo‘shimchalar: {n}", kitHead: "Shox International Hospital sayti — tarkibi", kitBase: "Sayt", kitTotal: "Jami", copied: "Nusxalandi", copyFail: "Nusxalab bo‘lmadi", wd: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"], mo: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"] },
  en: { flyStart: "Scroll — fly past our doctors", dec: ".", dscWon: "Your 10% discount", dscCode: "Code:", dscBook: "Book with the discount", dscOver: "Time's up", dscOverSub: "Booking is open anyway", anyDoc: "Any available doctor", anyDocSub: "The receptionist will choose", anyDir: "I need advice on which doctor to see", sumDir: "Department", sumDoc: "Doctor", sumTime: "Time", sumName: "Name", sumTel: "Phone", sumNote: "Comment", msgHead: "Hello! I would like to book an appointment at Shox International Hospital.", msgDisc: "10% discount secured on the website, code", found: "Found: {n}", blocks: "extras: {n}", kitHead: "Shox International Hospital website — scope", kitBase: "Website", kitTotal: "Total", copied: "Copied", copyFail: "Could not copy", wd: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], mo: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] },
};
for (const l of LANGS) I18N[l].dirs = Object.fromEntries(DIRS.map((x) => [x.id, x[l]]));

/* ── Конструктор: плашка на каждой странице ── */
function kitRow(l, x, cls = "kd-row") {
  const def = x.vis || x.id === "admin";
  return `<label class="${cls}"><input type="checkbox" data-k="${x.id}" data-p="${x.price}" data-needs="${x.needs.join(" ")}" data-t="${esc(x[l].t)}"${def ? " data-def" : ""}><span class="sw" aria-hidden="true"></span><span class="kd-t"><b>${esc(x[l].t)}</b><small>${esc(x[l].e)}</small></span><span class="kd-p num">+${usd(x.price)}</span></label>`;
}
function dockHtml(l) {
  const t = tr(l);
  const g = (id) => `<div class="kd-g"><h3><span>${GROUPS[id][l]}</span>${id === "core" ? `<a href="${href(l, "plan")}">${t("подробно", "batafsil", "details")} →</a>` : ""}</h3>${EXTRAS.filter((x) => x.group === id).map((x) => kitRow(l, x)).join("")}</div>`;
  return `<button class="kd-pill" type="button" id="kd-pill" aria-expanded="false" aria-controls="kd"><i aria-hidden="true"></i>${t("Конструктор", "Konstruktor", "Builder")} <b class="num" data-sum></b></button>
<aside class="kd" id="kd" role="dialog" aria-label="${t("Конструктор сайта", "Sayt konstruktori", "Website builder")}" hidden>
<div class="kd-h"><div><p class="kd-k">${t("Предложение DevUz Studio", "DevUz Studio taklifi", "DevUz Studio proposal")}</p><h2>${t("Что войдёт в сайт Shox International Hospital", "Shox International Hospital saytiga nima kiradi", "What goes into the Shox International Hospital website")}</h2><p class="kd-sub">${t("Включите доп — блок появится на странице, а итог пересчитается. Цены — по нижней границе рынка Ташкента.", "Qo‘shimchani yoqing — blok sahifada paydo bo‘ladi, jami qayta hisoblanadi. Narxlar — Toshkent bozorining quyi chegarasi bo‘yicha.", "Switch an extra on — the block appears on the page and the total updates. Prices are at the lower end of the Tashkent market.")}</p></div><button class="kd-x" type="button" id="kd-x" aria-label="${t("Свернуть", "Yig‘ish", "Close")}">×</button></div>
<div class="kd-list">
<div class="kd-g"><h3><span>${t("Основа", "Asos", "Base")}</span></h3><div class="kd-row base"><span></span><span class="kd-t"><b>${KIT[l].t}</b><small>${KIT[l].d}</small></span><span class="kd-p num">${usd(KIT.price)}</span></div></div>
${Object.keys(GROUPS).map(g).join("")}
</div>
<div class="kd-f">
<div class="kd-line"><span>${t("Сайт", "Sayt", "Website")}</span><span class="num">${usd(KIT.price)}</span></div>
<div class="kd-line"><span>${t("Допы", "Qo‘shimchalar", "Extras")} · <span data-n></span></span><span class="num" id="kd-add"></span></div>
<div class="kd-line kd-tot"><span>${t("Итого разово", "Jami bir martalik", "Total, one-off")}</span><b class="num" data-sum></b></div>
<a class="btn btn-brand" href="https://t.me/Devuz_studio_bot?start=shox_hospital">${ICON.tg}${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish", "Discuss with DevUz Studio")}</a>
<div class="kd-btns"><button class="copy" type="button" id="kd-copy">${t("Скопировать состав", "Tarkibni nusxalash", "Copy the scope")}</button><button class="copy" type="button" id="kd-reset">${t("Сбросить", "Qayta tiklash", "Reset")}</button><button class="copy" type="button" id="kd-timer">${t("Показать таймер скидки ещё раз", "Chegirma taymerini yana ko‘rsatish", "Show the discount timer again")}</button></div>
</div>
</aside>`;
}

/* ── Каркас ── */
function shell(l, path, meta, body) {
  const t = tr(l);
  const nav = path === ""
    ? [["#vrachi", t("Врачи", "Shifokorlar", "Doctors")], ["#napravleniya", t("Направления", "Yo‘nalishlar", "Departments")], ["#ceny", t("Цены", "Narxlar", "Prices")], ["#filialy", t("Филиалы", "Filiallar", "Branches")]]
    : [[href(l) + "#vrachi", t("Врачи", "Shifokorlar", "Doctors")], [href(l) + "#zapis", t("Запись", "Yozilish", "Booking")]];
  nav.push([href(l, "plan"), t("Что дальше", "Keyingi qadam", "What's next")]);
  const book = path === "" ? "#zapis" : href(l) + "#zapis";
  const docsJson = DOCS.map((x) => ({ s: x.s, n: name(x, l), sp: x.sp[l], dir: x.dir, img: `${IMG}/doctors/${x.s}.webp` }));
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#110d2e">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Shox International Hospital">
<meta property="og:locale" content="${{ ru: "ru_RU", uz: "uz_UZ", en: "en_US" }[l]}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.desc)}">
<meta property="og:image" content="https://devuz.studio${IMG}/site/building-yakkasaroy.webp">
${LANGS.filter((x) => x !== l).map((x) => `<link rel="alternate" hreflang="${x}" href="${href(x, path)}">`).join("\n")}
<link rel="icon" href="https://static.tildacdn.one/tild6530-6338-4563-b039-336630333733/favicon_2.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap&subset=cyrillic,latin-ext" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap&subset=cyrillic,latin-ext"></noscript>
<script>document.documentElement.classList.add('js');try{if(sessionStorage.getItem('dz'))document.documentElement.classList.add('dz-off')}catch(e){}</script>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": ["MedicalOrganization", "Hospital"], name: "Shox International Hospital", url: "https://shox.hospital", telephone: "+998712070017", email: "info@shox.hospital", openingHours: "Mo-Su 00:00-23:59", address: { "@type": "PostalAddress", streetAddress: "Kichik xalqa yo‘li, 70A", addressLocality: "Toshkent", addressCountry: "UZ" }, sameAs: SOCIAL.map((s) => s[1]) })}</script>
</head>
<body data-page="${path}" data-base="${KIT.price}">
<div class="dz" id="dz" role="presentation">
<div class="dz-in">${DZLOGO}<div class="dz-word">DevUz Studio</div><div class="dz-sub">${t("прототип для Shox International Hospital", "Shox International Hospital uchun prototip", "a prototype for Shox International Hospital")}</div></div>
<div class="dz-skip">${t("Нажмите, чтобы пропустить", "O‘tkazib yuborish uchun bosing", "Tap to skip")}</div>
</div>
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga", "Skip to content")}</a>
<header class="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="Shox International Hospital">@@L@@</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar", "Sections")}">${nav.map(([h, n]) => `<a href="${h}">${n}</a>`).join("")}</nav>
<a class="top-tel" href="tel:1183">1183</a>
<div class="lang">${LANGS.map((x) => `<a href="${href(x, path)}" hreflang="${x}"${x === l ? ' aria-current="true"' : ""}${x === "en" ? ' data-addon="en"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<a class="btn btn-red btn-sm top-cta" href="${book}">${ICON.cal}${t("Записаться", "Yozilish", "Book")}</a>
</div></header>
<main id="main">
${body}
</main>
<footer><div class="wrap">
<div class="cols">
<div><b>Shox International Hospital</b><ul><li>${t("Колл-центр", "Call-markaz", "Call centre")}: <a href="tel:1183">1183</a></li><li><a href="tel:+998712070017">+998 71 207-00-17</a></li><li><a href="mailto:info@shox.hospital">info@shox.hospital</a></li><li>${t("Круглосуточно, без выходных", "Kecha-kunduz, dam olishsiz", "Open 24/7, no days off")}</li></ul></div>
<div><b>${t("Филиалы", "Filiallar", "Branches")}</b><ul>${BRANCHES.filter((b) => b.addr).map((b) => `<li>${b.area[l]}, ${b.addr[l]}</li>`).join("")}</ul></div>
<div><b>${t("Мы в сети", "Biz ijtimoiy tarmoqlarda", "Follow us")}</b><ul><li><a href="${BOT}">Telegram · @shoxgroupbot</a></li>${SOCIAL.map(([n, u]) => `<li><a href="${u}">${n}</a></li>`).join("")}</ul></div>
</div>
<div class="rights"><span>${t("Это прототип: так может выглядеть новый сайт Shox International Hospital. Врачи, фото, направления, адреса и цифры — с shox.hospital (снимок от 24.06.2026; сейчас сайт не открывается). Запись, скидка, чек-ап программы, отзывы и страница для иностранных пациентов — наше предложение.", "Bu prototip: Shox International Hospital’ning yangi sayti shunday ko‘rinishi mumkin. Shifokorlar, suratlar, yo‘nalishlar, manzillar va raqamlar — shox.hospital saytidan (24.06.2026 holati; hozir sayt ochilmayapti). Yozilish, chegirma, chek-ap dasturlari, sharhlar va chet ellik bemorlar sahifasi — bizning taklifimiz.", "This is a prototype of what a new Shox International Hospital website could look like. Doctors, photos, departments, addresses and figures are from shox.hospital (snapshot of 24.06.2026; the site is currently down). Booking, the discount, check-up programmes, reviews and the international patients page are our proposal.")}</span><span>${t("Прототип принадлежит DevUz Studio. Использовать его можно только по договору —", "Prototip DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin —", "The prototype belongs to DevUz Studio and may be used only under contract —")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari", "terms of use")}</a></span></div>
</div></footer>
<div class="dock" id="dock"><a class="btn btn-red" href="${book}">${ICON.cal}${t("Записаться к врачу", "Shifokorga yozilish", "Book a doctor")}</a><a class="btn btn-tel" href="tel:1183" aria-label="${t("Позвонить 1183", "1183 ga qo‘ng‘iroq", "Call 1183")}">${ICON.phone}</a></div>
${discountHtml(l, book)}
${dockHtml(l)}
<script type="application/json" id="i18n">${JSON.stringify(I18N[l]).replace(/</g, "\\u003c")}</script>
<script type="application/json" id="docs">${JSON.stringify(docsJson).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}

function discountHtml(l, book) {
  const t = tr(l);
  return `<div class="dsc" id="dsc" role="status" aria-live="polite">
<div class="dsc-h"><span class="dsc-n num" aria-hidden="true">5</span><span class="dsc-t"><b>${t("5 секунд на скидку 10%", "10% chegirma uchun 5 soniya", "5 seconds for 10% off")}</b><small>${t("Успейте нажать — скидка закрепится за вами", "Bosishga ulguring — chegirma sizga biriktiriladi", "Tap in time and the discount is yours")}</small></span><button class="dsc-x" type="button" aria-label="${t("Закрыть", "Yopish", "Close")}">×</button></div>
<div class="dsc-bar" aria-hidden="true"><i></i></div>
<a class="btn btn-red dsc-go" href="${book}">${t("Забрать скидку", "Chegirmani olish", "Claim the discount")}</a>
<p class="dsc-cond">${t("Предложение: −10% на первую консультацию при записи через сайт. Условие клиника меняет сама.", "Taklif: sayt orqali yozilganda birinchi konsultatsiyaga −10%. Shartni klinika o‘zi o‘zgartiradi.", "Proposal: 10% off the first consultation when booked online. The clinic sets the terms itself.")}</p>
</div>`;
}

/* ── Главная ── */
const FLY = DOCS.slice(0, 14);

function home(l) {
  const t = tr(l);
  const dirsWithDocs = [...new Set(DOCS.map((x) => x.dir))];
  const fly = `<section class="fly" id="fly" aria-label="${t("Врачи Shox International Hospital", "Shox International Hospital shifokorlari", "Shox International Hospital doctors")}" data-dock-after>
<div class="fly-pin">
<div class="fly-bg par" aria-hidden="true"></div>
<div class="fly-world">
${Array.from({ length: 18 }, () => `<span class="fly-x" aria-hidden="true">+</span>`).join("")}
${FLY.map((x, i) => `<figure class="fly-card" data-name="${esc(name(x, l))}"><img src="${IMG}/doctors/${x.s}.webp" alt="${esc(name(x, l))}, ${esc(x.sp[l])}" width="480" height="600"${i < 4 ? "" : ' loading="lazy"'} decoding="async"><figcaption><b>${esc(name(x, l))}</b><span>${esc(x.sp[l])}</span></figcaption></figure>`).join("\n")}
</div>
<div class="fly-intro"><div class="fly-in">
<span class="kicker"><i></i>${t("Многопрофильная клиника · Ташкент и Андижан · 24/7", "Ko‘p tarmoqli klinika · Toshkent va Andijon · 24/7", "Multi-specialty hospital · Tashkent and Andijan · 24/7")}</span>
<h1>${t("Shox International Hospital — <em>врачи</em>, к которым можно записаться онлайн", "Shox International Hospital — onlayn yozilish mumkin bo‘lgan <em>shifokorlar</em>", "Shox International Hospital — <em>doctors</em> you can book online")}</h1>
<p>${t("Выберите направление, врача и время — администратор подтвердит запись. Роботохирургия, МРТ и МСКТ, стационар.", "Yo‘nalish, shifokor va vaqtni tanlang — administrator yozilishni tasdiqlaydi. Robotlashtirilgan jarrohlik, MRT va MSKT, statsionar.", "Choose a department, a doctor and a time — the receptionist confirms. Robotic surgery, MRI and CT, inpatient care.")}</p>
<div class="fly-cta"><a class="btn btn-red" href="#zapis">${ICON.cal}${t("Записаться к врачу", "Shifokorga yozilish", "Book a doctor")}</a><a class="btn btn-ghost" href="tel:1183">${ICON.phone}1183</a></div>
<p class="fly-hint"><i aria-hidden="true"></i>${t("Листайте вниз — пролетим мимо врачей", "Pastga suring — shifokorlar yonidan uchib o‘tamiz", "Scroll down to fly past our doctors")}</p>
</div></div>
<div class="fly-outro"><h2>${t("И ещё врачи — <em>в каталоге</em>", "Yana shifokorlar — <em>katalogda</em>", "More doctors — <em>in the catalogue</em>")}</h2><p>${t("Фильтр по направлению, поиск по фамилии и запись в два нажатия.", "Yo‘nalish bo‘yicha filtr, familiya bo‘yicha qidiruv va ikki bosishda yozilish.", "Filter by department, search by surname and book in two taps.")}</p><div class="fly-cta"><a class="btn btn-red" href="#zapis">${t("Записаться", "Yozilish", "Book")}</a><a class="btn btn-ghost" href="#vrachi">${t("Все врачи", "Barcha shifokorlar", "All doctors")}</a></div></div>
<div class="fly-hud"><span class="fly-now" aria-live="off">${I18N[l].flyStart}</span><span class="bar"><i></i></span><a href="#posle">${t("Пропустить", "O‘tkazib yuborish", "Skip")} ↓</a></div>
</div>
</section>`;

  const stats = `<section class="stats" id="posle" style="padding:48px 0"><div class="wrap">
${[[16, "+", t("лет работы", "yillik tajriba", "years of practice")], [150, "+", t("специалистов", "mutaxassis", "specialists")], [50000, "+", t("довольных пациентов", "mamnun bemor", "satisfied patients")], [7, "", t("филиалов", "filial", "branches")], [2022, "", t("год, когда пришла роботохирургия", "robotlashtirilgan jarrohlik kelgan yil", "robotic surgery since"), true]].map(([n, s, label, plain], i) => `<div class="stat rv-in a-rise" style="--d:${i * 70}ms"><b class="num" data-count="${n}" data-suf="${s}"${plain ? " data-plain" : ""}>${n}${s}</b><span>${label}</span></div>`).join("")}
<div class="stat rv-in a-rise" style="--d:350ms"><b>24/7</b><span>${t("без выходных и перерывов", "dam olish va tanaffussiz", "no days off, no breaks")}</span></div>
<p class="src">${t("Цифры — так, как их называет сама клиника на shox.hospital (главная и страница роботохирургии).", "Raqamlar — klinikaning o‘zi shox.hospital’da aytganidek (bosh sahifa va robot jarrohlik sahifasi).", "Figures as the clinic states them on shox.hospital (home and robotic surgery pages).")}</p>
</div></section>`;

  const motions = ["a-rise", "a-pop", "a-tilt", "a-left", "a-right", "a-pulse", "a-scan"];
  const big = ["robot", "neurosurg", "cardiosurg", "checkup"];
  const tiles = DIRS.filter((x) => !["robot"].includes(x.id));
  const dirs = `<section id="napravleniya" class="rel"><span class="deco shift" data-shift=".12" style="right:-40px;top:24px" aria-hidden="true">Shox</span><div class="wrap">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${t("Направления", "Yo‘nalishlar", "Departments")}</span><h2>${t("Больше <em>двадцати</em> направлений в одной клинике", "Bitta klinikada <em>yigirmadan</em> ortiq yo‘nalish", "More than <em>twenty</em> departments in one hospital")}</h2><p>${t("Нажмите на направление — откроется запись к его врачам.", "Yo‘nalishni bosing — uning shifokorlariga yozilish ochiladi.", "Tap a department to book its doctors.")}</p></div>
<div class="bento">
${tiles.map((x, i) => { const isBig = big.includes(x.id) && x.d; const n = DOCS.filter((d) => d.dir === x.id).length; return `<a class="tile${isBig ? " big" : ""} rv-in ${motions[i % motions.length]}" style="--d:${(i % 4) * 60}ms" href="#zapis" data-book-dir="${dirsWithDocs.includes(x.id) ? x.id : "any"}" data-ask="${esc(t("Интересует: ", "Qiziqtiradi: ", "Interested in: ") + x[l])}"><span class="ico">${ICON[x.ic]}</span><span><h3>${x[l]}</h3>${isBig ? `<p>${x.d[l]}</p>` : ""}${n ? `<small>${n} ${t(n === 1 ? "врач на сайте" : "врача на сайте", "shifokor saytda", n === 1 ? "doctor on the site" : "doctors on the site")}</small>` : ""}</span><span class="go" aria-hidden="true">${t("Записаться", "Yozilish", "Book")} →</span></a>`; }).join("\n")}
</div>
</div></section>`;

  const robot = `<section class="robot" id="robot"><div class="wrap">
<div class="robot-pic rv-in a-pop"><img class="shift" data-shift=".08" src="${IMG}/site/robot-arms.webp" alt="${t("Робот-ассистированная хирургическая система в Shox International Hospital", "Shox International Hospital’dagi robot yordamidagi jarrohlik tizimi", "Robot-assisted surgical system at Shox International Hospital")}" width="700" height="844" loading="lazy"><div class="robot-badge"><b class="num">2022</b>${t("впервые в Центральной Азии — так клиника пишет о себе", "Markaziy Osiyoda birinchi marta — klinika o‘zi haqida shunday yozadi", "a first in Central Asia — as the clinic puts it")}</div></div>
<div>
<span class="kicker" style="color:#c9c2ff"><i></i>${t("Роботохирургия", "Robotlashtirilgan jarrohlik", "Robotic surgery")}</span>
<h2 class="rv-in a-left" style="margin-top:12px">${t("Операции <em>без крупных разрезов</em>", "<em>Katta kesiklarsiz</em> operatsiyalar", "Surgery <em>without large incisions</em>")}</h2>
<p class="lead" style="margin-top:16px">${t("Компьютер убирает дрожание руки, руки робота двигаются плавнее эндоскопа, а хирург видит операционное поле почти в 3D.", "Kompyuter qo‘l titrashini yo‘qotadi, robot qo‘llari endoskopdan silliqroq harakatlanadi, jarroh esa operatsiya maydonini deyarli 3D ko‘radi.", "The computer removes hand tremor, the robot's arms move more smoothly than an endoscope, and the surgeon sees the field almost in 3D.")}</p>
<ul class="plus">${ROBOT_PLUS[l].map((x, i) => `<li class="rv-in a-right" style="--d:${i * 70}ms">${ICON.check}<span>${x}</span></li>`).join("")}</ul>
<div class="ops">${ROBOT_OPS[l].map((x) => `<span>${x}</span>`).join("")}</div>
<p style="margin-top:24px"><a class="btn btn-red" href="#zapis" data-book-dir="surgery" data-ask="${esc(t("Консультация по роботохирургии", "Robot jarrohligi bo‘yicha konsultatsiya", "Robotic surgery consultation"))}">${t("Консультация хирурга", "Jarroh konsultatsiyasi", "See a surgeon")}</a></p>
</div>
</div></section>`;

  const docs = `<section id="vrachi"><div class="wrap">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${t("Врачи", "Shifokorlar", "Doctors")}</span><h2>${t("Выберите <em>своего</em> врача", "<em>O‘z</em> shifokoringizni tanlang", "Choose <em>your</em> doctor")}</h2><p>${t("Фото, ФИО и специальность — как на сайте клиники. Стаж и категорию клиника допишет в админке.", "Surat, F.I.Sh. va mutaxassislik — klinika saytidagidek. Staj va toifani klinika admin panelda qo‘shadi.", "Photo, full name and specialty as on the clinic's site. Experience and category will be added by the clinic in the admin panel.")}</p></div>
<div class="docs-tools">
<label class="search"><span class="skip">${t("Поиск врача", "Shifokorni qidirish", "Find a doctor")}</span>${ICON.search}<input id="docs-q" type="search" placeholder="${t("Фамилия или специальность", "Familiya yoki mutaxassislik", "Surname or specialty")}" autocomplete="off"></label>
<div class="chips" id="docs-chips" role="group" aria-label="${t("Направление", "Yo‘nalish", "Department")}"><button type="button" class="chip" data-f="all" aria-pressed="true">${t("Все", "Barchasi", "All")}</button>${dirsWithDocs.map((id) => `<button type="button" class="chip" data-f="${id}" aria-pressed="false">${DIRMAP[id][l]}</button>`).join("")}</div>
</div>
<div class="docs" id="docs-grid">
${DOCS.map((x, i) => `<article class="doc rv-in ${["a-rise", "a-pop", "a-tilt"][i % 3]}" style="--d:${(i % 4) * 60}ms" data-dir="${x.dir}" data-q="${esc((x.ru + " " + x.la + " " + x.sp.ru + " " + x.sp.uz + " " + x.sp.en).toLowerCase())}"><div class="doc-ph"><img src="${IMG}/doctors/${x.s}.webp" alt="${esc(name(x, l))}" width="480" height="600" loading="lazy"><div class="doc-over"><a class="btn btn-red btn-sm" href="#zapis" data-book-doc="${x.s}">${t("Записаться", "Yozilish", "Book")}</a></div></div><div class="doc-tx"><b>${esc(name(x, l))}</b><span>${x.sp[l]}</span><a class="btn btn-brand btn-sm" href="#zapis" data-book-doc="${x.s}">${t("Записаться", "Yozilish", "Book")}</a></div></article>`).join("\n")}
</div>
<p class="empty" id="docs-empty" hidden>${t("Такого врача не нашли. Позвоните в колл-центр 1183 — подскажут.", "Bunday shifokor topilmadi. 1183 call-markaziga qo‘ng‘iroq qiling — yordam berishadi.", "No such doctor found. Call 1183 and we'll help.")}</p>
</div></section>`;

  const dirChips = [...dirsWithDocs.map((id) => [id, DIRMAP[id][l]]), ["any", t("Не знаю, к кому", "Kimga borishni bilmayman", "Not sure who to see")]];
  const bookBlock = `<section class="book" id="zapis"><div class="wrap">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${t("Онлайн-запись", "Onlayn yozilish", "Online booking")}</span><h2>${t("Запись к врачу <em>в три шага</em>", "Shifokorga <em>uch qadamda</em> yozilish", "Book a doctor <em>in three steps</em>")}</h2></div>
<div class="book-box rv-in a-tilt">
<div class="book-side">
<ol class="steps"><li class="on"><span>${t("Направление", "Yo‘nalish", "Department")}</span></li><li><span>${t("Врач", "Shifokor", "Doctor")}</span></li><li><span>${t("День и время", "Kun va vaqt", "Day and time")}</span></li><li><span>${t("Контакты", "Kontaktlar", "Contacts")}</span></li></ol>
<div class="disc"><b>${t("Скидка 10% закреплена", "10% chegirma biriktirildi", "10% discount secured")}</b>${t("Код", "Kod", "Code")} <span data-code></span> — ${t("на первую консультацию", "birinchi konsultatsiyaga", "for the first consultation")}</div>
<p class="src">${t("В прототипе расписание — пример. В рабочей версии свободные окна берутся из админки клиники.", "Prototipda jadval — namuna. Ishchi versiyada bo‘sh vaqtlar klinika admin panelidan olinadi.", "In the prototype the schedule is an example. In the live version free slots come from the clinic's admin panel.")}</p>
</div>
<div>
<div class="pane on" data-p="1"><h3>${t("К какому специалисту?", "Qaysi mutaxassisga?", "Which specialist?")}</h3><div class="opts" id="bk-dirs">${dirChips.map(([id, n]) => `<button type="button" class="chip" data-dir="${id}" aria-pressed="false">${n}</button>`).join("")}</div></div>
<div class="pane" data-p="2"><h3>${t("Выберите врача", "Shifokorni tanlang", "Choose a doctor")}</h3><div class="mini-docs" id="bk-docs"></div><div class="pane-nav"><button type="button" class="back" data-back="1">← ${t("Назад", "Orqaga", "Back")}</button></div></div>
<div class="pane" data-p="3"><h3>${t("Когда удобно?", "Qachon qulay?", "When suits you?")}</h3><div class="days" id="bk-days"></div><div class="slots" id="bk-slots"></div><div class="pane-nav"><button type="button" class="back" data-back="2">← ${t("Назад", "Orqaga", "Back")}</button></div></div>
<div class="pane" data-p="4"><h3>${t("Куда подтвердить запись?", "Yozilishni qayerga tasdiqlaymiz?", "Where should we confirm?")}</h3>
<div class="sum" id="bk-sum"></div>
<div class="disc"><b>${t("Скидка 10% закреплена", "10% chegirma biriktirildi", "10% discount secured")}</b>${t("Код", "Kod", "Code")} <span data-code></span></div>
<div class="field"><label for="bk-name">${t("Имя", "Ism", "Name")}</label><input id="bk-name" autocomplete="name"></div>
<div class="field"><label for="bk-tel">${t("Телефон", "Telefon", "Phone")}</label><input id="bk-tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998 __ ___ __ __"></div>
<div class="field"><label for="bk-note">${t("Комментарий — по желанию", "Izoh — ixtiyoriy", "Comment — optional")}</label><textarea id="bk-note"></textarea></div>
<p class="src" id="bk-err" hidden style="color:var(--red2)">${t("Укажите имя и телефон — по нему администратор подтвердит время.", "Ism va telefonni kiriting — administrator vaqtni shu orqali tasdiqlaydi.", "Enter your name and phone so the receptionist can confirm.")}</p>
<div class="pane-nav"><a class="btn btn-red" id="bk-send" href="${BOT}?start=zapis" target="_blank" rel="noopener">${ICON.tg}${t("Отправить в Telegram клиники", "Klinika Telegramiga yuborish", "Send to the clinic's Telegram")}</a><a class="btn btn-ghost" href="tel:1183">${ICON.phone}1183</a><button type="button" class="back" data-back="3">← ${t("Назад", "Orqaga", "Back")}</button></div>
<p class="sent" id="bk-sent">${t("Текст заявки скопирован — вставьте его в чат клиники. В рабочей версии заявка сама попадает в журнал админки, а пациенту приходит подтверждение.", "Ariza matni nusxalandi — uni klinika chatiga qo‘ying. Ishchi versiyada ariza o‘zi admin panel jurnaliga tushadi, bemorga esa tasdiq keladi.", "The request text is copied — paste it into the clinic's chat. In the live version the request lands in the admin log by itself and the patient gets a confirmation.")}</p>
</div>
</div>
</div>
</div></section>`;

  // Прейскурант: цен на shox.hospital нет («Консультация специалиста — от» без числа) — строки ведут к вопросу о цене.
  const cats = { c: t("Консультации", "Konsultatsiyalar", "Consultations"), d: t("Диагностика", "Diagnostika", "Diagnostics"), r: t("Роботохирургия", "Robot jarrohligi", "Robotic surgery") };
  const rows = [
    ...DIRS.filter((x) => !["robot", "checkup", "mrt", "mskt", "uzi"].includes(x.id)).map((x) => ({ c: "c", n: t("Консультация: ", "Konsultatsiya: ", "Consultation: ") + x[l].toLowerCase(), dir: dirsWithDocs.includes(x.id) ? x.id : "any" })),
    ...["mrt", "mskt", "uzi"].map((id) => ({ c: "d", n: DIRMAP[id][l], dir: id })),
    { c: "d", n: DIRMAP.checkup[l], dir: "any" },
    ...ROBOT_OPS[l].map((n) => ({ c: "r", n, dir: "surgery" })),
  ];
  const prices = `<section id="ceny"><div class="wrap">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${t("Прейскурант", "Narxlar ro‘yxati", "Price list")}</span><h2>${t("Найдите услугу — <em>узнайте цену</em>", "Xizmatni toping — <em>narxini bilib oling</em>", "Find a service — <em>check the price</em>")}</h2><p>${t("Сейчас на shox.hospital у услуг написано «Консультация специалиста — от», а число не указано. Здесь клиника впишет цены в админке, а до тех пор кнопка задаёт вопрос администратору.", "Hozir shox.hospital’da xizmatlarda «Mutaxassis konsultatsiyasi — dan» deb yozilgan, raqam esa ko‘rsatilmagan. Bu yerda klinika narxlarni admin panelda kiritadi, ungacha tugma administratorga savol beradi.", "Today shox.hospital says «Specialist consultation — from» with no number. Here the clinic will enter prices in the admin panel; until then the button asks the receptionist.")}</p></div>
<div class="prices-box rv-in a-scan">
<label class="search"><span class="skip">${t("Поиск услуги", "Xizmatni qidirish", "Search services")}</span>${ICON.search}<input id="pq" type="search" placeholder="${t("Например: МРТ, уролог, грыжа", "Masalan: MRT, urolog, churra", "e.g. MRI, urologist, hernia")}" autocomplete="off"></label>
<div class="chips" id="pchips" role="group"><button type="button" class="chip" data-f="all" aria-pressed="true">${t("Все", "Barchasi", "All")}</button>${Object.entries(cats).map(([k, v]) => `<button type="button" class="chip" data-f="${k}" aria-pressed="false">${v}</button>`).join("")}</div>
<p class="pcount" id="pcount" aria-live="polite"></p>
<ul class="plist" id="plist">${rows.map((r) => `<li data-c="${r.c}" data-q="${esc((r.n + " " + cats[r.c]).toLowerCase())}"><b>${esc(r.n)}</b><small>${cats[r.c]} · ${t("цена — у администратора", "narx — administratorda", "price from the receptionist")}</small><a class="ask" href="#zapis" data-book-dir="${r.dir}" data-ask="${esc(t("Сколько стоит: ", "Narxi qancha: ", "How much is: ") + r.n)}">${t("Узнать цену", "Narxini bilish", "Ask the price")} →</a></li>`).join("")}</ul>
<button type="button" class="btn btn-ghost btn-sm pmore" id="pmore">${t("Показать все услуги", "Barcha xizmatlarni ko‘rsatish", "Show all services")} (${rows.length})</button>
</div>
</div></section>`;

  const cu = [
    { h: t("Базовый", "Bazaviy", "Basic"), li: [t("Консультация кардиолога-терапевта", "Kardiolog-terapevt konsultatsiyasi", "Cardiologist-internist consultation"), t("УЗИ", "UTT", "Ultrasound"), t("Консультация эндокринолога", "Endokrinolog konsultatsiyasi", "Endocrinologist consultation"), t("Заключение и план", "Xulosa va reja", "Report and plan")] },
    { h: t("Сердце и сосуды", "Yurak va qon tomirlar", "Heart and vessels"), hot: true, li: [t("Консультация кардиолога", "Kardiolog konsultatsiyasi", "Cardiologist consultation"), t("Консультация сосудистого хирурга", "Qon tomir jarrohi konsultatsiyasi", "Vascular surgeon consultation"), t("УЗИ", "UTT", "Ultrasound"), t("МСКТ — по назначению врача", "MSKT — shifokor tayinlovi bo‘yicha", "CT — if prescribed")] },
    { h: t("Женское здоровье", "Ayollar salomatligi", "Women's health"), li: [t("Консультация гинеколога", "Ginekolog konsultatsiyasi", "Gynaecologist consultation"), t("УЗИ", "UTT", "Ultrasound"), t("Консультация эндокринолога", "Endokrinolog konsultatsiyasi", "Endocrinologist consultation"), t("Заключение и план", "Xulosa va reja", "Report and plan")] },
  ];
  const checkup = `<section id="checkup" data-addon="checkup"><div class="wrap">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${DIRMAP.checkup[l]}</span><h2>${t("Чек-ап <em>за один визит</em>", "<em>Bir tashrifda</em> chek-ap", "A check-up <em>in one visit</em>")}</h2><p>${DIRMAP.checkup.d[l]}</p><p><span class="ours">${t("Наше предложение: состав программ — пример, его определит клиника", "Bizning taklif: dasturlar tarkibi — namuna, uni klinika belgilaydi", "Our proposal: programme contents are an example; the clinic decides")}</span></p></div>
<div class="cu">${cu.map((c, i) => `<div class="cu-card${c.hot ? " hot" : ""} rv-in ${["a-left", "a-pop", "a-right"][i]}" style="--d:${i * 90}ms"><h3>${c.h}</h3><ul>${c.li.map((x) => `<li>${x}</li>`).join("")}</ul><p class="pr">${t("Цена — впишет клиника", "Narx — klinika kiritadi", "Price — set by the clinic")}</p><a class="btn ${c.hot ? "btn-red" : "btn-brand"} btn-sm" href="#zapis" data-book-dir="any" data-ask="${esc(t("Чек-ап «", "Chek-ap «", "Check-up «") + c.h + "»")}">${t("Записаться на чек-ап", "Chek-apga yozilish", "Book the check-up")}</a></div>`).join("")}</div>
</div></section>`;

  const rvDocs = DOCS.slice(0, 8);
  const rvCards = (hidden) => rvDocs.map((x) => `<div class="rv"${hidden ? ' aria-hidden="true"' : ""}><div class="rv-h"><img src="${IMG}/doctors/${x.s}.webp" alt="" width="44" height="44" loading="lazy"><span><b>${esc(name(x, l))}</b><span>${x.sp[l]}</span></span></div><span class="stars" aria-hidden="true">★★★★★</span><div class="ph" aria-hidden="true"><i></i><i></i><i></i></div><small>${t("Здесь — отзыв пациента после проверки администратором", "Bu yerda — administrator tekshirgan bemor sharhi", "A patient review appears here after moderation")}</small></div>`).join("");
  const reviews = `<section id="otzyvy" data-addon="reviews" style="padding-bottom:48px"><div class="wrap">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${t("Отзывы", "Sharhlar", "Reviews")}</span><h2>${t("Отзывы <em>о каждом враче</em>", "<em>Har bir shifokor</em> haqida sharhlar", "Reviews <em>for every doctor</em>")}</h2><p>${t("На сайте клиники отзывов пока нет. Пациент оставляет отзыв после визита, администратор проверяет и публикует его у карточки врача.", "Klinika saytida hozircha sharhlar yo‘q. Bemor tashrifdan keyin sharh qoldiradi, administrator tekshirib, shifokor kartasida e’lon qiladi.", "The clinic's site has no reviews yet. A patient leaves one after the visit; the admin checks it and publishes it on the doctor's card.")}</p><p><span class="ours">${t("Пример оформления — без выдуманных отзывов", "Bezatish namunasi — o‘ylab topilgan sharhlarsiz", "Layout example — no made-up reviews")}</span></p></div></div>
<div class="rv-wrap"><div class="rv-track">${rvCards(false)}${rvCards(true)}</div></div>
</section>`;

  const foreign = `<section class="intl" id="inostrannym" data-addon="foreign"><div class="wrap">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${t("Пациентам из других городов и стран", "Boshqa shahar va mamlakatlardan kelgan bemorlarga", "Patients from other cities and countries")}</span><span class="ours">${t("Наше предложение", "Bizning taklif", "Our proposal")}</span></div>
<p class="quote rv-in a-left">${t("«Сегодня нам доверяют семьи не только в Узбекистане, но и за его пределами»", "«Bugun bizga nafaqat O‘zbekistonda, balki uning tashqarisida ham oilalar ishonadi»", "«Today families trust us not only in Uzbekistan but beyond it»")}<span class="src" style="display:block;font-family:var(--text);font-style:normal;margin-top:8px">— shox.hospital</span></p>
<div class="intl-grid">
${[[t("Заявка и снимки", "Ariza va suratlar", "Request and scans"), t("Пациент присылает выписки и снимки онлайн — врач смотрит их до приезда.", "Bemor ko‘chirmalar va suratlarni onlayn yuboradi — shifokor ularni kelishdan oldin ko‘radi.", "The patient sends records and scans online — the doctor reviews them before arrival.")], [t("План лечения", "Davolash rejasi", "Treatment plan"), t("Клиника присылает план и предварительную стоимость — на языке пациента.", "Klinika reja va taxminiy narxni bemor tilida yuboradi.", "The clinic sends a plan and an estimate in the patient's language.")], [t("Приезд и стационар", "Kelish va statsionar", "Arrival and inpatient stay"), t("Встреча, размещение в стационаре клиники, координатор на связи.", "Kutib olish, klinika statsionariga joylashtirish, koordinator aloqada.", "Pick-up, a room in the hospital's inpatient ward, a coordinator on call.")], [t("Домой — с заключением", "Uyga — xulosa bilan", "Home with a report")], ].map(([h, p], i) => `<div class="intl-step rv-in a-rise" style="--d:${i * 80}ms"><b>${h}</b><p>${p || t("Выписка, назначения и связь с лечащим врачом после возвращения.", "Ko‘chirma, tayinlovlar va qaytgandan keyin davolovchi shifokor bilan aloqa.", "Discharge summary, prescriptions and contact with the doctor after returning home.")}</p></div>`).join("")}
</div>
</div></section>`;

  const map = `<svg class="city" viewBox="0 0 400 300" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke="rgb(236 235 247 / .14)" stroke-width="1"><path d="M0 120 C80 110 140 150 220 130 S340 90 400 100"/><path d="M60 0 C90 80 110 160 150 300"/><path d="M260 0 C250 90 280 180 330 300"/><path d="M0 220 C120 200 260 240 400 210"/></g><circle cx="190" cy="160" r="92" fill="none" stroke="rgb(201 194 255 / .4)" stroke-width="2" stroke-dasharray="6 6"/><path d="M40 40 C120 90 160 120 220 170 S300 260 380 290" fill="none" stroke="rgb(91 155 255 / .35)" stroke-width="4"/><text x="200" y="64" fill="rgb(236 235 247 / .4)" font-size="12" font-family="Manrope, sans-serif">Kichik xalqa yo‘li</text></svg>`;
  const branches = `<section id="filialy"><div class="wrap">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${t("Филиалы", "Filiallar", "Branches")}</span><h2>${t("Семь филиалов — <em>выберите ближайший</em>", "Yetti filial — <em>eng yaqinini tanlang</em>", "Seven branches — <em>pick the nearest</em>")}</h2></div>
<div class="br">
<div class="rv-in a-pop"><div class="map">${map}${BRANCHES.filter((b) => b.x).map((b) => `<a class="pin" href="${b.map}" style="left:${b.x}%;top:${b.y}%" aria-label="${esc(b.name)} — ${t("открыть в Яндекс Картах", "Yandex Xaritada ochish", "open in Yandex Maps")}"><i></i><span>${b.area[l]}</span></a>`).join("")}<span class="map-note">${t("Схема, не в масштабе · точки ведут в Яндекс Карты", "Sxema, masshtabsiz · nuqtalar Yandex Xaritaga olib boradi", "Schematic, not to scale · pins open Yandex Maps")}</span></div>
<div class="gal">${["branch-1", "branch-2", "branch-3"].map((s) => `<img class="rv-in a-rise" src="${IMG}/site/${s}.webp" alt="${t("Здание клиники Shox", "Shox klinikasi binosi", "Shox hospital building")}" width="576" height="505" loading="lazy">`).join("")}</div></div>
<div class="blist">${BRANCHES.map((b, i) => `<div class="bitem rv-in a-right" style="--d:${i * 50}ms"><b>${esc(b.name)}</b><span>${b.area[l]}${b.addr ? ", " + b.addr[l] : ""}</span>${b.map ? `<a class="mapl" href="${b.map}">${t("Как проехать", "Qanday borish", "Directions")} →</a>` : ""}<a class="tel num" href="tel:${b.tel}">${b.telh}</a></div>`).join("")}</div>
</div>
</div></section>`;

  const msg = `<section id="svyaz" style="padding-top:0"><div class="wrap">
<div class="sec-head rv-in a-rise"><h2>${t("Связаться <em>как удобно</em>", "<em>Qulay usulda</em> bog‘laning", "Get in touch <em>your way</em>")}</h2></div>
<div class="msg">
<a class="call rv-in a-pop" href="tel:1183">${ICON.phone}<span><b>1183</b><span>${t("Колл-центр, круглосуточно", "Call-markaz, kecha-kunduz", "Call centre, 24/7")}</span></span></a>
<a class="rv-in a-pop" style="--d:60ms" href="${BOT}">${ICON.tg}<span><b>Telegram</b><span>${t("@shoxgroupbot — результаты анализов", "@shoxgroupbot — tahlil natijalari", "@shoxgroupbot — test results")}</span></span></a>
<a class="rv-in a-pop" style="--d:120ms" href="https://www.instagram.com/shox.hospital">${ICON.insta}<span><b>Instagram</b><span>@shox.hospital</span></span></a>
<a class="rv-in a-pop" style="--d:180ms" href="https://www.facebook.com/ShoxMedCenter">${ICON.fb}<span><b>Facebook</b><span>ShoxMedCenter</span></span></a>
<a class="rv-in a-pop" style="--d:240ms" href="https://www.youtube.com/channel/UCzwuZXE51NaDgRGflVK8KHQ">${ICON.play}<span><b>YouTube</b><span>Shox Hospital</span></span></a>
<a class="rv-in a-pop" style="--d:300ms" href="mailto:info@shox.hospital">${ICON.mail}<span><b>Email</b><span>info@shox.hospital</span></span></a>
</div>
</div></section>`;

  const final = `<section class="final"><div class="wrap rv-in a-pulse">
<h2>${t("Запишитесь сейчас — <em style=\"color:#fff\">подтвердим время</em>", "Hozir yoziling — <em style=\"color:#fff\">vaqtni tasdiqlaymiz</em>", "Book now — <em style=\"color:#fff\">we'll confirm the time</em>")}</h2>
<p>${t("Shox International Hospital работает круглосуточно, без выходных и перерывов.", "Shox International Hospital kecha-kunduz, dam olish va tanaffussiz ishlaydi.", "Shox International Hospital is open 24/7, with no days off or breaks.")}</p>
<div class="fly-cta"><a class="btn btn-red" href="#zapis">${ICON.cal}${t("Записаться к врачу", "Shifokorga yozilish", "Book a doctor")}</a><a class="btn btn-ghost" href="tel:1183">${ICON.phone}1183</a></div>
</div></section>`;

  return shell(l, "", {
    title: t("Shox International Hospital — запись к врачу онлайн, роботохирургия, МРТ | Ташкент", "Shox International Hospital — shifokorga onlayn yozilish, robot jarrohligi, MRT | Toshkent", "Shox International Hospital — book a doctor online, robotic surgery, MRI | Tashkent"),
    desc: t("Многопрофильная клиника в Ташкенте и Андижане: 20+ направлений, роботохирургия, МРТ и МСКТ, 24/7. Запись к врачу онлайн в три шага.", "Toshkent va Andijondagi ko‘p tarmoqli klinika: 20+ yo‘nalish, robot jarrohligi, MRT va MSKT, 24/7. Shifokorga uch qadamda onlayn yozilish.", "Multi-specialty hospital in Tashkent and Andijan: 20+ departments, robotic surgery, MRI and CT, 24/7. Book a doctor online in three steps."),
  }, [fly, stats, dirs, robot, docs, bookBlock, prices, checkup, reviews, foreign, branches, msg, final].join("\n"));
}

/* ── «Что дальше»: превью допов ── */
function previews(l) {
  const t = tr(l);
  const frame = (title, body) => `<div class="pv-win"><div class="pv-bar"><i></i><i></i><i></i><span>${title}</span></div><div class="pv-body">${body}</div></div>`;
  const ex = `<span class="pv-ex">${t("пример", "namuna", "example")}</span>`;
  const st = { n: ["st-new", t("новая", "yangi", "new")], o: ["st-ok", t("подтверждена", "tasdiqlandi", "confirmed")], i: ["st-in", t("пришёл", "keldi", "arrived")], x: ["st-no", t("не пришёл", "kelmadi", "no-show")] };
  const rows = [["09:00", DOCS[1], "i"], ["09:30", DOCS[4], "o"], ["10:30", DOCS[5], "o"], ["11:00", DOCS[2], "n"], ["12:00", DOCS[7], "x"]];
  return {
    admin: frame(t("Журнал записей · сегодня", "Yozilishlar jurnali · bugun", "Booking log · today") + " " + ex, rows.map(([h, d, s]) => `<div class="pv-row"><img src="${IMG}/doctors/${d.s}.webp" alt=""><span><b class="num">${h}</b> · ${esc(name(d, l))}</span><span class="pv-st ${st[s][0]}">${st[s][1]}</span></div>`).join("") + `<p class="pv-note">${t("Расписание врача", "Shifokor jadvali", "Doctor's schedule")}</p><div class="pv-grid"><span></span>${t("Пн Вт Ср Чт Пт", "Du Se Ch Pa Ju", "Mo Tu We Th Fr").split(" ").map((x) => `<span>${x}</span>`).join("")}${["09", "11", "13", "15"].map((h, r) => `<span class="num">${h}</span>${[0, 1, 2, 3, 4].map((c) => `<i class="${(r * 5 + c) % 3 === 0 ? "b" : (r + c) % 4 === 0 ? "r" : ""}"></i>`).join("")}`).join("")}</div><p class="pv-note">${t("Синий — занято, розовый — отпуск или перерыв. Выгрузка в Excel — одной кнопкой.", "Ko‘k — band, pushti — ta’til yoki tanaffus. Excelga eksport — bitta tugma bilan.", "Blue — booked, pink — leave or break. Excel export in one click.")}</p>`),
    bot: `<div class="pv-tg"><b>Shox Hospital</b><p>${t("Выберите направление", "Yo‘nalishni tanlang", "Choose a department")}</p><div class="kb"><span>${DIRMAP.cardio[l]}</span><span>${DIRMAP.uro[l]}</span><span>${DIRMAP.mrt[l]}</span></div><p>${t("Запись подтверждена: завтра 10:30, ", "Yozilish tasdiqlandi: ertaga 10:30, ", "Booking confirmed: tomorrow 10:30, ")}${esc(name(DOCS[5], l))}</p><div class="kb"><span>${t("Перенести", "Ko‘chirish", "Reschedule")}</span><span>${t("Отменить", "Bekor qilish", "Cancel")}</span><span>${t("Результаты", "Natijalar", "Results")}</span></div></div>`,
    sms: `<div class="pv-sms"><p>Shox Hospital: ${t("напоминаем о приёме завтра в 10:30. Перенести: shox.hospital/z/48K", "ertaga 10:30 dagi qabulni eslatamiz. Ko‘chirish: shox.hospital/z/48K", "reminder: your visit tomorrow at 10:30. Reschedule: shox.hospital/z/48K")}</p></div>`,
    cabinet: frame(t("Кабинет пациента", "Bemor kabineti", "Patient account") + " " + ex, `<div class="pv-row"><span>${ICON.clip}</span><span>${t("Заключение УЗИ", "UTT xulosasi", "Ultrasound report")}</span><b>PDF</b></div><div class="pv-row"><span>${ICON.clip}</span><span>${t("Результаты анализов", "Tahlil natijalari", "Test results")}</span><b>PDF</b></div><div class="pv-row"><span>${ICON.cal}</span><span>${t("Повторный приём", "Takroriy qabul", "Follow-up visit")}</span><b>→</b></div>`),
    pay: frame(t("Оплата приёма", "Qabul uchun to‘lov", "Visit payment"), `<div class="pv-kpi"><div><small>Payme</small><b>✓</b></div><div><small>Click</small><b>✓</b></div><div><small>Uzum</small><b>✓</b></div></div><p class="pv-note">${t("Сумму и предоплату клиника задаёт сама.", "Summa va oldindan to‘lovni klinika o‘zi belgilaydi.", "The clinic sets the amount and prepayment.")}</p>`),
    video: frame(t("Онлайн-консультация", "Onlayn konsultatsiya", "Online consultation") + " " + ex, `<div class="pv-row"><img src="${IMG}/doctors/${DOCS[6].s}.webp" alt=""><span>${esc(name(DOCS[6], l))}</span><span class="pv-st st-in">${t("через 10 мин", "10 daqiqadan keyin", "in 10 min")}</span></div><p class="pv-note">${t("Ссылка на звонок — в Telegram пациента.", "Qo‘ng‘iroq havolasi — bemorning Telegramida.", "The call link goes to the patient's Telegram.")}</p>`),
    mis: frame(t("Обмен с вашей системой", "Tizimingiz bilan almashinuv", "Sync with your system"), `<div class="pv-row"><span>⇄</span><span>${t("Свободные окна врачей", "Shifokorlarning bo‘sh vaqtlari", "Doctors' free slots")}</span><b>${t("каждые 5 мин", "har 5 daqiqada", "every 5 min")}</b></div><div class="pv-row"><span>⇄</span><span>${t("Записи с сайта", "Saytdan yozilishlar", "Website bookings")}</span><b>${t("сразу", "darhol", "instantly")}</b></div><div class="pv-row"><span>⇄</span><span>1C</span><b>${t("оплаты", "to‘lovlar", "payments")}</b></div>`),
    branches: frame("shox.hospital/yunusobod", `<p><b>Shox International Hospital · Yunusobod</b></p><div class="pv-row"><span>${ICON.phone}</span><span class="num">+998 55 519-11-83</span><b>→</b></div><div class="pv-row"><span>${ICON.cal}</span><span>${t("Врачи филиала и запись", "Filial shifokorlari va yozilish", "Branch doctors and booking")}</span><b>→</b></div>`),
    seo: `<div class="pv-serp"><small>shox.hospital</small><b>Shox International Hospital — ${t("клиника в Ташкенте", "Toshkentdagi klinika", "hospital in Tashkent")}</b><p><s>Shox Hospital – Farg‘onadagi zamonaviy klinika</s></p><p>${t("Роботохирургия, МРТ и МСКТ, 20+ направлений, запись онлайн.", "Robot jarrohligi, MRT va MSKT, 20+ yo‘nalish, onlayn yozilish.", "Robotic surgery, MRI and CT, 20+ departments, online booking.")}</p></div>`,
    analytics: frame(t("Записи по источникам", "Manbalar bo‘yicha yozilishlar", "Bookings by source") + " " + ex, `<div class="pv-kpi"><div><small>${t("Сайт", "Sayt", "Website")}</small><b>—</b></div><div><small>Instagram</small><b>—</b></div><div><small>${t("Реклама", "Reklama", "Ads")}</small><b>—</b></div></div><p class="pv-note">${t("Цифры появятся после запуска — мы их не придумываем.", "Raqamlar ishga tushirilgandan keyin paydo bo‘ladi — biz ularni o‘ylab topmaymiz.", "Numbers appear after launch — we don't make them up.")}</p>`),
  };
}

function plan(l) {
  const t = tr(l);
  const pv = previews(l);
  const issues = [
    [t("Сайт не открывается", "Sayt ochilmayapti", "The site is down"), t("shox.hospital отвечает «402 Please renew your subscription» — у Tilda кончилась подписка. Человек из рекламы или из Google видит пустую страницу. Проверили 07.10.2026.", "shox.hospital «402 Please renew your subscription» deb javob beradi — Tilda obunasi tugagan. Reklamadan yoki Google’dan kelgan odam bo‘sh sahifani ko‘radi. 07.10.2026 da tekshirildi.", "shox.hospital answers «402 Please renew your subscription» — the Tilda plan has expired. Visitors from ads or Google see an empty page. Checked on 07.10.2026.")],
    [t("Записаться можно только звонком", "Faqat qo‘ng‘iroq orqali yozilish mumkin", "Booking only by phone"), t("Кнопки «Записаться» у карточек врачей на старом сайте вели на «#» — то есть никуда. Ночью, в дороге и на работе позвонить неудобно.", "Eski saytdagi shifokor kartalaridagi «Yozilish» tugmalari «#» ga — ya’ni hech qayerga olib borardi. Kechasi, yo‘lda va ishda qo‘ng‘iroq qilish noqulay.", "The «Book» buttons on doctor cards on the old site led to «#» — nowhere. Calling at night, on the road or at work is inconvenient.")],
    [t("Цен нет", "Narxlar yo‘q", "No prices"), t("У каждой услуги написано «Консультация специалиста — от», а число не стоит. Пациент уходит туда, где цену видно.", "Har bir xizmatda «Mutaxassis konsultatsiyasi — dan» deb yozilgan, raqam esa yo‘q. Bemor narx ko‘rinadigan joyga ketadi.", "Every service says «Specialist consultation — from» with no number. Patients go where the price is visible.")],
    [t("Google думает, что клиника в Фергане", "Google klinikani Farg‘onada deb o‘ylaydi", "Google thinks the clinic is in Fergana"), t("В описании сайта для поиска — «Farg‘onadagi zamonaviy klinika» и ключевые слова «klinika Farg‘ona», хотя филиалы в Ташкенте и Андижане.", "Qidiruv uchun sayt tavsifida — «Farg‘onadagi zamonaviy klinika» va «klinika Farg‘ona» kalit so‘zlari, garchi filiallar Toshkent va Andijonda bo‘lsa ham.", "The site's search description says «a modern clinic in Fergana» with the keyword «klinika Farg‘ona», though the branches are in Tashkent and Andijan.")],
    [t("Цифры спорят друг с другом", "Raqamlar bir-biriga zid", "The numbers disagree"), t("На главной — «16+ лет» и «150+ специалистов», на странице роботохирургии — «15+ лет» и «200+ врачей». Один номер Юнусабада на двух страницах записан по-разному.", "Bosh sahifada — «16+ yil» va «150+ mutaxassis», robot jarrohligi sahifasida — «15+ yil» va «200+ shifokor». Yunusobod raqami ikki sahifada turlicha yozilgan.", "The home page says «16+ years» and «150+ specialists»; the robotic surgery page says «15+ years» and «200+ doctors». The Yunusabad phone number differs between two pages.")],
    [t("Карточки врачей без подробностей", "Shifokor kartalari tafsilotlarsiz", "Doctor cards lack detail"), t("Ни стажа, ни категории, у одного врача вместо специальности повторено отчество, у фото почти всех врачей подпись «Нормаматов Азизбек».", "Na staj, na toifa, bitta shifokorda mutaxassislik o‘rniga otasining ismi takrorlangan, deyarli barcha shifokorlar suratida «Normamatov Azizbek» yozuvi.", "No experience or category; one doctor's specialty is replaced by a repeated patronymic, and almost every photo is labelled «Normamatov Azizbek».")],
  ];
  const body = `<section class="phead" data-dock-after><div class="wrap">
<span class="ours">${t("Предложение DevUz Studio для Shox International Hospital", "DevUz Studio’ning Shox International Hospital uchun taklifi", "DevUz Studio proposal for Shox International Hospital")}</span>
<h1>${t("Что ещё нужно клинике — <em>соберите сами</em>", "Klinikaga yana nima kerak — <em>o‘zingiz yig‘ing</em>", "What else the hospital needs — <em>build it yourself</em>")}</h1>
<p>${t("Сайт из этого прототипа — основа за 1 500 $. Остальное включается тумблером: блок появляется в превью справа, а итог пересчитывается. Почему каждый доп здесь — написано по тому, что мы нашли на shox.hospital.", "Ushbu prototipdagi sayt — 1 500 $ lik asos. Qolgani tumbler bilan yoqiladi: blok o‘ngdagi ko‘rinishda paydo bo‘ladi, jami qayta hisoblanadi. Har bir qo‘shimcha nima uchun shu yerda — shox.hospital’da topganlarimiz asosida yozilgan.", "The website in this prototype is the $1,500 base. Everything else is a toggle: the block appears in the preview on the right and the total updates. Why each extra is here is based on what we found on shox.hospital.")}</p>
</div></section>
<section style="padding-top:0"><div class="wrap">
<div class="sec-head rv-in a-rise"><h2>${t("Что мешает <em>сейчас</em>", "<em>Hozir</em> nima xalaqit beradi", "What gets in the way <em>today</em>")}</h2></div>
<div class="issues">${issues.map(([h, p], i) => `<div class="issue rv-in ${["a-rise", "a-tilt", "a-pop"][i % 3]}" style="--d:${(i % 3) * 80}ms"><span class="n">0${i + 1}</span><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>
<section id="konstruktor" style="padding-top:0"><div class="wrap">
<div class="sec-head rv-in a-rise"><h2>${t("Конструктор проекта", "Loyiha konstruktori", "Project builder")}</h2><p class="src">${t("Цены — по нижней границе рынка Ташкента. Точные — после брифа.", "Narxlar — Toshkent bozorining quyi chegarasi bo‘yicha. Aniq narx — brifdan keyin.", "Prices are at the lower end of the Tashkent market. Exact figures after a brief.")}</p></div>
<div class="kit">
<div class="kit-list">
<div class="kit-base"><b>${KIT[l].t}</b><p>${KIT[l].d}</p><span class="kit-price num">${usd(KIT.price)}</span></div>
${Object.keys(GROUPS).map((g) => `<h3 class="kit-g">${GROUPS[g][l]}</h3>${EXTRAS.filter((x) => x.group === g).map((x) => `<label class="kit-row"><input type="checkbox" data-k="${x.id}" data-p="${x.price}" data-needs="${x.needs.join(" ")}" data-t="${esc(x[l].t)}"${x.vis || x.id === "admin" ? " data-def" : ""}><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${esc(x[l].t)}</b><small>${esc(x[l].why || x[l].e)}</small>${x[l].li ? `<span class="kit-li">${x[l].li.map((y) => `<em>${esc(y)}</em>`).join("")}</span>` : ""}${x.needs.length ? `<span class="kit-need">${t("Включает", "Birga yoqiladi", "Includes")}: ${x.needs.map((n) => EXTRAS.find((y) => y.id === n)[l].t).join(", ")}</span>` : ""}${x.vis ? `<span class="kit-need">${t("Виден на главной — выключите и посмотрите", "Bosh sahifada ko‘rinadi — o‘chirib ko‘ring", "Visible on the home page — switch it off to see")}</span>` : ""}</span><span class="kit-price num">${usd(x.price)}</span></label>`).join("")}`).join("")}
</div>
<div class="kit-side">
<div class="kit-screen" aria-live="polite"><p class="kit-cap">${t("Превью включённых допов", "Yoqilgan qo‘shimchalar ko‘rinishi", "Preview of enabled extras")}</p>${EXTRAS.filter((x) => x.pv).map((x) => `<div class="kit-pv" data-pv="${x.id}" hidden><span class="kit-pv-t">${esc(x[l].t)}</span>${pv[x.pv]}</div>`).join("")}<p class="kit-empty src">${t("Включите доп слева — он появится здесь.", "Chapdagi qo‘shimchani yoqing — u shu yerda paydo bo‘ladi.", "Switch on an extra on the left — it appears here.")}</p></div>
<div class="kit-total"><div><small>${t("Итого с сайтом", "Sayt bilan jami", "Total with the website")}</small><b class="num" data-sum>—</b><span data-n></span></div><a class="btn btn-brand" href="https://t.me/Devuz_studio_bot?start=shox_hospital">${ICON.tg}${t("Обсудить", "Muhokama qilish", "Discuss")}</a></div>
</div>
</div>
</div></section>
<section style="padding-top:0"><div class="wrap"><div class="issue rv-in a-pop">
<span class="n" style="color:var(--brand2)">${t("Как собираем", "Qanday yig‘amiz", "How we build")}</span>
<h3>${t("Допы подключаются, а не переписываются", "Qo‘shimchalar qayta yozilmaydi, ulanadi", "Extras plug in, nothing is rewritten")}</h3>
<p>${t("Сайт с самого начала собирается так, чтобы админка, бот, кабинет и оплата подключались к нему без переделки. Взять доп можно сразу или через полгода — цена от этого не меняется. Код после оплаты — ваш.", "Sayt boshidanoq admin panel, bot, kabinet va to‘lov unga qayta ishlashsiz ulanadigan qilib yig‘iladi. Qo‘shimchani darhol yoki yarim yildan keyin olish mumkin — narx o‘zgarmaydi. To‘lovdan keyin kod — sizniki.", "From day one the site is built so the admin panel, bot, account and payments plug in without rework. Take an extra now or in six months — the price is the same. After payment the code is yours.")}</p>
</div></div></section>`;
  return shell(l, "plan", {
    title: t("Что дальше: админка записи, бот, кабинет пациента — конструктор | Shox International Hospital", "Keyingi qadam: yozilish admin paneli, bot, bemor kabineti — konstruktor | Shox International Hospital", "What's next: booking admin, bot, patient account — builder | Shox International Hospital"),
    desc: t("Конструктор проекта для Shox International Hospital: сайт 1 500 $, админ-панель записи 450 $, Telegram-бот, SMS, оплата, кабинет пациента. Предложение DevUz Studio.", "Shox International Hospital uchun loyiha konstruktori: sayt 1 500 $, yozilish admin paneli 450 $, Telegram-bot, SMS, to‘lov, bemor kabineti. DevUz Studio taklifi.", "Project builder for Shox International Hospital: website $1,500, booking admin $450, Telegram bot, SMS, payments, patient account. A DevUz Studio proposal."),
  }, body);
}

const BUILD = { "": home, plan };
const out = {};
for (const l of LANGS) for (const p of PAGES) out[[l === "ru" ? "" : l, p].filter(Boolean).join("/")] = BUILD[p](l);

/* Логотип — один раз, в частях; в локальном показе подставляем сразу. */
const parts0 = { L: LOGO };
const local = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.split("@@L@@").join(LOGO)]));
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(local));

/*
 * Сборка для сервера (lib/proto/bundles): стили, скрипт и строки на языке —
 * один раз, в страницах вместо них метка @@имя@@.
 */
const grab = (html, re) => html.match(re)[0];
const parts = {
  ...parts0,
  S: grab(out[""], /<style>[\s\S]*?<\/style>/),
  J: grab(out[""], /<script>\n\(function\(\)\{[\s\S]*?<\/script>/),
};
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let page = html;
  for (const [n, part] of Object.entries(parts)) if (n !== "L") page = page.split(part).join(`@@${n}@@`);
  pages[key] = page;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "shox-hospital.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(local)) console.log((k || "(main)").padEnd(10), v.length);
