import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { LANGS, CONTACT, HERO, SERVICES, GROUPS, TARIFFS, TURNOVER, KINDS, WHY, ADV, DOCS, PILES, TEAM, REVIEWS } from "./data.mjs";
import { PANEL_UI } from "./panel-ui.mjs";

/*
 * Макет сайта FinTax Consulting (бухгалтерский аутсорсинг, Ташкент),
 * 26.10.2026. Клиент на вопрос «что главное» ответил: «интерактив лучше».
 * Пять страниц на трёх языках (ru главный, как у них; uz латиницей; en)
 * и панель по эталону greenwell.
 *
 *   главная:  видео DevUz → синий стол с маркером, их заголовок и четыре
 *             пункта → «хаос → порядок»: документы по прокрутке ложатся в
 *             три папки → подбор тарифа по их же пределам → схема «что
 *             берём на себя» → стол «штатный бухгалтер или FinTax» →
 *             видеоотзывы → консультация;
 *   services: десять услуг вкладками, преимущества, полоса с архивом;
 *   prices:   подбор, четыре тарифа сайта, что уже входит;
 *   about:    семь «почему», команда, отзывы;
 *   contacts: адрес, часы, телефон, Telegram, WhatsApp, почта, заявка,
 *             «Мои заявки» со статусом из панели.
 *
 * Факты — только с их сайта и из Telegram (data.mjs). Заявка ложится в
 * демо-панель (память браузера) и открывает их Telegram или WhatsApp с
 * готовым текстом. Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/fintax";
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const CSS = strip(readFileSync(DIR + "site.css", "utf8")).replace(/\n\s*/g, "");
const JS = strip(readFileSync(DIR + "site.js", "utf8")).replace(/\n\s*\n/g, "\n");
const BASE_URL = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;700&family=Playfair+Display:wght@400;700&display=swap";
const KEY = { ru: "", uz: "uz", en: "en" };
const PAGES = ["", "services", "prices", "about", "contacts"];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, p = "") => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/" + p;
const keyOf = (l, p) => [KEY[l], p].filter(Boolean).join("/");
const T = (l) => (ru, uz, en) => (l === "ru" ? ru : l === "uz" ? uz : en);
const pad = (n) => String(n).padStart(2, "0");
const LI = (l) => LANGS.indexOf(l);

/* Мессенджеры клиента с готовым текстом: главное действие работает по-настоящему. */
const tgHref = (text) => `https://t.me/${CONTACT.tg}?text=${encodeURIComponent(text)}`;
const waHref = (text) => `https://wa.me/${CONTACT.phone.slice(1)}?text=${encodeURIComponent(text)}`;
const HELLO = (l) => T(l)("Здравствуйте! Хочу бесплатную консультацию по бухгалтерии.", "Assalomu alaykum! Buxgalteriya bo‘yicha bepul maslahat olmoqchiman.", "Hello! I would like a free accounting consultation.");

/* ── Иконки: линейные, одна толщина ─────────────────────────────────── */
const I = (dd) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  menu: I('<path d="M4 8h16M4 16h16"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12.5 4.5 4.5L19 7"/>'),
  tg: I('<path d="M21 4 3 11l6 2.2L18 7l-7 7.2.3 5.8 3.3-4 4.4 3.2Z"/>'),
  wa: I('<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7Z"/><path d="M9 9.5c.5 2.3 2.2 4 4.5 4.5l1.2-1.2 2 1-.5 1.7c-3.6.2-7.4-3.6-7.2-7.2L10.7 7.8l1 2Z"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  book: I('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z"/><path d="M4 19V5M9 7h6M9 11h6"/>'),
  send: I('<path d="M21 3 3 10l7 3 3 7Z"/><path d="m10 13 4-4"/>'),
  restore: I('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 8v4l3 2"/>'),
  chat: I('<path d="M4 5h16v11H9l-5 4Z"/><path d="M8 9h8M8 12h5"/>'),
  globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  user: I('<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
  cap: I('<path d="m2 9 10-5 10 5-10 5Z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>'),
  search: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>'),
  shield: I('<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z"/><path d="m9 12 2 2 4-4"/>'),
  db: I('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>'),
  key: I('<circle cx="8" cy="14" r="4"/><path d="m11 11 9-9M17 5l2 2M15 7l2 2"/>'),
  coins: I('<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3"/>'),
  desk: I('<path d="M3 10h18M5 10v10M19 10v10M8 10V5h8v5"/>'),
  play: I('<path d="M8 5v14l11-7Z"/>'),
  doc: I('<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5"/>'),
  folder: I('<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>'),
  scroll: I('<rect x="7" y="3" width="10" height="16" rx="5"/><path d="M12 7v3"/>'),
};

const LOGO = (l) => `<a class="logo" href="${href(l)}" aria-label="FinTax">Fin<b>Tax</b></a>`;
const NAV = [
  ["services", ["Услуги", "Xizmatlar", "Services"]],
  ["prices", ["Тарифы", "Tariflar", "Pricing"]],
  ["about", ["О нас", "Biz haqimizda", "About"]],
  ["contacts", ["Контакты", "Aloqa", "Contacts"]],
];
const navName = (p, l) => NAV.find((n) => n[0] === p)[1][LI(l)];
const consultTxt = (l) => T(l)("Бесплатная консультация", "Bepul maslahat", "Free consultation");

/* ── Шапка, меню, подвал ───────────────────────────────────────────── */
function headerHtml(l, p) {
  const t = T(l);
  const lang = `<div class="lang">${LANGS.map((x) => `<a href="${href(x, p)}" hreflang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>`;
  return `<header class="top" id="top"><div class="top-in">
${LOGO(l)}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar", "Sections")}">${NAV.map(([id, n]) => `<a href="${href(l, id)}"${id === p ? ' aria-current="page"' : ""}>${n[LI(l)]}</a>`).join("")}</nav>
<div class="top-r">${lang}<a class="btn btn-pri top-cta" href="${href(l, "contacts")}#form">${consultTxt(l)}</a>
<button type="button" class="ic-btn" id="menu-btn" aria-expanded="false" aria-controls="menu" aria-label="${t("Меню", "Menyu", "Menu")}">${ICON.menu}</button></div>
</div></header>
<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="${t("Меню", "Menyu", "Menu")}" hidden>
<button type="button" class="ic-btn" data-close aria-label="${t("Закрыть", "Yopish", "Close")}">${ICON.close}</button>
<nav class="mn-list" aria-label="${t("Разделы", "Bo‘limlar", "Sections")}"><a href="${href(l)}"><small>00</small>${t("Главная", "Bosh sahifa", "Home")}</a>${NAV.map(([id, n], i) => `<a href="${href(l, id)}"><small>${pad(i + 1)}</small>${n[LI(l)]}</a>`).join("")}</nav>
${lang}
<a class="btn btn-pri" href="${tgHref(HELLO(l))}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Написать в Telegram", "Telegram’da yozish", "Message on Telegram")}</span></a>
<a class="btn btn-line" href="tel:${CONTACT.phone}">${ICON.phone}<span>${CONTACT.phoneTxt}</span></a>
</div>`;
}

function footHtml(l) {
  const t = T(l);
  return `<footer class="foot"><div class="wrap">
<div class="ft">
<div>${LOGO(l)}<p style="margin-top:16px">${t("Бухгалтерские услуги в Ташкенте. Ведём учёт, сдаём отчётность и оптимизируем налоги законным путём.", "Toshkentda buxgalteriya xizmatlari. Hisobni yuritamiz, hisobot topshiramiz va soliqlarni qonuniy yo‘l bilan optimallashtiramiz.", "Accounting services in Tashkent. We keep your books, file reports and legally optimise taxes.")}</p><p>${HERO.served[l]}</p></div>
<div><b>${t("Разделы", "Bo‘limlar", "Sections")}</b><ul>${NAV.map(([id, n]) => `<li><a href="${href(l, id)}">${n[LI(l)]}</a></li>`).join("")}<li><a href="${href(l, "panel")}">${t("Вход для сотрудников", "Xodimlar uchun kirish", "Staff sign-in")}</a></li></ul></div>
<div><b>${t("Связь", "Aloqa", "Contact")}</b><ul><li><a href="tel:${CONTACT.phone}">${CONTACT.phoneTxt}</a></li><li><a href="https://t.me/${CONTACT.tg}" target="_blank" rel="noopener">Telegram @${CONTACT.tg}</a></li><li><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></li><li>${CONTACT.address[l]}</li><li>${CONTACT.hours[l]}</li></ul></div>
</div>
<div class="rights"><p>${t("Это макет DevUz Studio: так может выглядеть сайт FinTax. Тексты, тарифы, команда и контакты взяты с сайта fintax.uz и из Telegram компании. Знак набран шрифтом до получения логотипа. Заявки с этого макета приходят только в демо-панель в этом браузере.", "Bu DevUz Studio maketi: FinTax sayti shunday ko‘rinishi mumkin. Matnlar, tariflar, jamoa va kontaktlar fintax.uz sayti va kompaniyaning Telegram’idan olingan. Belgi logotip olingunga qadar shrift bilan terilgan. Bu maketdagi arizalar faqat shu brauzerdagi demo-panelga tushadi.", "A DevUz Studio mockup of how the FinTax website could look. Texts, tariffs, team and contacts come from fintax.uz and the company’s Telegram. The mark is set in type until we receive the logo. Requests from this mockup only reach the demo panel in this browser.")}</p>
<p>${t("Макет принадлежит DevUz Studio и используется только по договору.", "Maket DevUz Studio’ga tegishli va faqat shartnoma asosida ishlatiladi.", "The mockup belongs to DevUz Studio and may be used only under contract.")} <a href="${TERMS(l)}">${t("Условия использования макета", "Maketdan foydalanish shartlari", "Mockup terms of use")}</a></p></div>
</div></footer>`;
}

/* ── Первый экран ──────────────────────────────────────────────────── */
function hero(l) {
  const t = T(l);
  const [a, b] = HERO.h1[l];
  return `<section class="hero" id="hero">
<picture class="hero-ph"><source media="(max-width: 899px) and (orientation: portrait)" srcset="${IMG}/hero-m-1080.webp"><img src="${IMG}/hero-1600.webp" srcset="${IMG}/hero-960.webp 960w, ${IMG}/hero-1600.webp 1600w, ${IMG}/hero-2560.webp 2560w" sizes="100vw" alt="${t("Стопки документов, папки и жёлтый маркер на тёмно-синем столе", "To‘q ko‘k stolda hujjatlar, papkalar va sariq marker", "Stacks of documents, folders and a yellow highlighter on a navy desk")}" fetchpriority="high"></picture>
<div class="wrap hero-in">
<p class="kicker">${HERO.kicker[l]}</p>
<h1 class="h1"><span>${a}</span> <span><mark class="hl on">${b}</mark></span></h1>
<ul class="hero-pts">${HERO.points[l].map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>
<div class="hero-cta"><a class="btn btn-pri" href="${tgHref(HELLO(l))}" target="_blank" rel="noopener">${ICON.tg}<span>${consultTxt(l)}</span></a><a class="btn btn-line" href="#picker">${t("Подобрать тариф", "Tarif tanlash", "Find my tariff")}</a></div>
<p class="served"><span>${ICON.check}${HERO.served[l]}</span><span>${ICON.clock}${CONTACT.hours[l]}</span><span>${ICON.pin}${t("Кушбеги, 31B", "Qushbegi, 31B", "Qushbegi 31B")}</span></p>
</div></section>`;
}

/* ── Хаос → порядок ────────────────────────────────────────────────── */
function order(l) {
  const t = T(l);
  return `<section class="order" id="order" aria-labelledby="ord-h"><div class="ord-stick">
<div class="wrap ord-head"><p class="kicker">${t("Бухгалтерия под ключ", "Buxgalteriya to‘liq", "Accounting, all of it")}</p>
<h2 class="h2" id="ord-h"><span class="o-a">${t("Так бумаги лежат у многих", "Ko‘pchilikda hujjatlar shunday yotadi", "This is how papers lie for many")}</span><span class="o-b">${t("А так они лежат <mark class=\"hl on\">у нас</mark>", "Bizda esa <mark class=\"hl on\">shunday</mark>", "And this is how they lie <mark class=\"hl on\">with us</mark>")}</span></h2></div>
<div class="ord-board" aria-hidden="true">
${PILES[l].map((n, i) => `<div class="pile" data-p="${i}" style="left:${i * 34.5}%"><span class="pl-tray"></span><b>${n}</b><span class="pl-n">${DOCS.filter((d) => d.g === i).length} ${t("документа", "hujjat", "documents")}</span></div>`).join("")}
${DOCS.map((d, i) => `<div class="doc" data-g="${d.g}" data-i="${i}"><b>${d[l]}</b><i></i><i></i><i></i><i></i><span class="tag"></span></div>`).join("")}
</div>
<p class="ord-note">${ICON.scroll}<span>${t("Листайте: документы сами разложатся по папкам", "Pastga suring: hujjatlar o‘zi papkalarga taxlanadi", "Scroll: the documents sort themselves into folders")}</span><span class="ord-bar"><i></i></span></p>
<p class="sr-only" style="position:absolute;left:-9999px">${t("Учёт, отчётность, зарплата и кадры: каждый документ в своей папке.", "Hisob, hisobotlar, ish haqi va kadrlar: har bir hujjat o‘z papkasida.", "Accounting, reporting, payroll and HR: every document in its folder.")}</p>
</div></section>`;
}

/* ── Подбор тарифа ─────────────────────────────────────────────────── */
function seg(name, opts, def) {
  return `<div class="seg" data-q="${name}" role="group">${opts.map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="${v === def}">${n}</button>`).join("")}</div>`;
}
function picker(l, withHead = true) {
  const t = T(l);
  return `<section class="sec" id="picker"><div class="wrap">
${withHead ? `<div class="sec-h mv mv-up"><p class="kicker">${t("Тарифы FinTax", "FinTax tariflari", "FinTax tariffs")}</p><h2 class="h2">${t("Сколько стоит ваше <mark class=\"hl\">спокойствие</mark>?", "Xotirjamligingiz <mark class=\"hl\">qancha turadi</mark>?", "How much is your <mark class=\"hl\">peace of mind</mark> worth?")}</h2><p class="lead">${t("Ответьте на пять вопросов, и мы покажем, какой тариф FinTax вам подходит и почему. Пределы и цены тарифов взяты с сайта компании.", "Beshta savolga javob bering: qaysi FinTax tarifi sizga mos va nima uchun, ko‘rsatamiz. Tariflar chegaralari va narxlari kompaniya saytidan olingan.", "Answer five questions and we will show which FinTax tariff fits you and why. Limits and prices come from the company’s website.")}</p></div>` : ""}
<div class="pk" data-picker>
<div class="card pk-q mv mv-left">
<fieldset class="q"><legend>${t("Чем занимается бизнес", "Biznes nima bilan shug‘ullanadi", "What your business does")}</legend>${seg("kind", KINDS.map((k) => [k.id, k[l]]), "opt")}</fieldset>
<label class="q"><span>${t("Документов в месяц", "Oyiga hujjatlar", "Documents a month")}<output data-o="docs">40</output></span><input type="range" name="docs" min="5" max="150" step="5" value="40" aria-label="${t("Документов в месяц", "Oyiga hujjatlar", "Documents a month")}"></label>
<label class="q"><span>${t("Сотрудников", "Xodimlar", "Employees")}<output data-o="staff">6</output></span><input type="range" name="staff" min="1" max="40" step="1" value="6" aria-label="${t("Сотрудников", "Xodimlar", "Employees")}"></label>
<fieldset class="q"><legend>${t("Налоговый режим", "Soliq tizimi", "Tax regime")}</legend>${seg("tax", [["usn", t("УСН (4%)", "Soddalashtirilgan (4%)", "Simplified (4%)")], ["vat", t("ОСН с НДС", "Umumiy, QQS bilan", "General, with VAT")]], "vat")}</fieldset>
<fieldset class="q"><legend>${t("Оборот", "Aylanma", "Turnover")}</legend>${seg("turn", TURNOVER[l].map((n, i) => [String(i), n]), "1")}</fieldset>
<div class="q sw"><span id="ved-l">${t("Есть импорт или экспорт (ВЭД)", "Import yoki eksport bor (TIF)", "Import or export (foreign trade)")}</span><button type="button" data-q="ved" aria-pressed="false" aria-labelledby="ved-l"></button></div>
</div>
<div class="card pk-r mv mv-right" aria-live="polite">
<p class="kicker">${t("Вам подходит", "Sizga mos", "Your fit")}</p>
<div class="tiers" aria-hidden="true"><i></i>${TARIFFS.map((x) => `<span>${x[l][0]}</span>`).join("")}</div>
<div data-res><h3 class="pk-name"></h3><p class="pk-for"></p></div>
<p class="pk-price"><span></span></p>
<ul class="why-l" data-why></ul>
<div class="pk-act"><a class="btn btn-pri" data-pk-tg href="${tgHref(HELLO(l))}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Обсудить в Telegram", "Telegram’da muhokama qilish", "Discuss on Telegram")}</span></a><a class="btn btn-line" data-pk-form href="${href(l, "contacts")}#form">${t("Оставить заявку", "Ariza qoldirish", "Leave a request")}</a></div>
<p class="note">${t("Цены с сайта FinTax. Точную сумму специалист назовёт после бесплатной консультации.", "Narxlar FinTax saytidan. Aniq summani mutaxassis bepul maslahatdan keyin aytadi.", "Prices are from the FinTax website. A specialist names the exact amount after a free consultation.")}</p>
</div></div></div></section>`;
}

/* ── Схема «что берём на себя» ─────────────────────────────────────── */
function scheme(l) {
  const t = T(l);
  const N = SERVICES.length, R = 230, C = 300;
  const pos = SERVICES.map((_, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / N; return [+(C + R * Math.cos(a)).toFixed(1), +(C + R * Math.sin(a)).toFixed(1)]; });
  const svg = `<svg class="sch-svg" viewBox="0 0 600 600" role="group" aria-label="${t("Услуги FinTax вокруг вашего бизнеса", "Biznesingiz atrofidagi FinTax xizmatlari", "FinTax services around your business")}">
<g class="orb" aria-hidden="true"><circle cx="300" cy="300" r="${R}" fill="none" stroke="rgba(238,240,245,.14)" stroke-dasharray="2 10"/></g>
${pos.map(([x, y], i) => `<line class="sp" x1="300" y1="300" x2="${x}" y2="${y}"/><line class="sp-on" data-sp="${i}" x1="300" y1="300" x2="${x}" y2="${y}"/>`).join("")}
<g class="hub" aria-hidden="true"><circle cx="300" cy="300" r="74"/><text x="300" y="294">${t("Ваш", "Sizning", "Your")}</text><text x="300" y="316">${t("бизнес", "biznesingiz", "business")}</text></g>
${pos.map(([x, y], i) => `<g class="nd" data-n="${i}" tabindex="0" role="button" aria-label="${pad(i + 1)}. ${esc(SERVICES[i][l][0])}"><circle cx="${x}" cy="${y}" r="30"/><circle class="ring" cx="${x}" cy="${y}" r="30"/><text x="${x}" y="${y}">${pad(i + 1)}</text></g>`).join("")}
<circle class="pulse" r="6" cx="300" cy="300" aria-hidden="true"/>
</svg>`;
  return `<section class="sec dark" id="scheme"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker">${t("Что берём на себя", "Nimani o‘z zimmamizga olamiz", "What we take on")}</p><h2 class="h2">${t("Десять задач, которые больше <mark class=\"hl\">не ваши</mark>", "Endi <mark class=\"hl\">sizniki emas</mark> o‘nta vazifa", "Ten jobs that are <mark class=\"hl\">no longer yours</mark>")}</h2></div>
<div class="sch" data-scheme>
<div class="mv mv-scale">${svg}</div>
<div class="sch-side"><div class="card sch-card" aria-live="polite"><span class="chip" data-g></span><h3></h3><p></p><a class="btn btn-pri" data-ask href="${tgHref(HELLO(l))}" target="_blank" rel="noopener" style="justify-self:start">${ICON.tg}<span>${t("Узнать стоимость", "Narxini bilish", "Find out the cost")}</span></a></div>
<div class="sch-list" role="group" aria-label="${t("Услуги", "Xizmatlar", "Services")}" style="margin-top:16px">${SERVICES.map((s, i) => `<button type="button" data-n="${i}" aria-pressed="false">${pad(i + 1)} ${s[l][0]}</button>`).join("")}</div></div>
</div>
<div class="adv mv-st mv">${ADV.map((a, i) => `<div style="--i:${i}"><b>${a[l][0]}</b><span>${a[l][1]}</span></div>`).join("")}<div style="--i:7"><b>${t("И ещё", "Va yana", "And more")}</b><span>${t("Всё это входит в обслуживание, а не продаётся отдельно.", "Bularning barchasi xizmatga kiradi, alohida sotilmaydi.", "All of this is part of the service, not sold separately.")}</span></div></div>
</div></section>`;
}

/* ── Стол: штатный бухгалтер или FinTax ────────────────────────────── */
function desk(l) {
  const t = T(l);
  return `<section class="sec" id="desk"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker">${t("Почему мы, а не штатный бухгалтер", "Nima uchun biz, shtat buxgalteri emas", "Why us, not a staff accountant")}</p><h2 class="h2">${t("Что из этого сейчас <mark class=\"hl\">на вас</mark>?", "Bulardan qaysi biri hozir <mark class=\"hl\">sizning zimmangizda</mark>?", "Which of these is <mark class=\"hl\">on you</mark> right now?")}</h2><p class="lead">${t("Отметьте свои заботы и передайте их FinTax. Справа появится, что компания делает с каждой.", "O‘z tashvishlaringizni belgilang va FinTax’ga topshiring. O‘ngda kompaniya har biri bilan nima qilishi chiqadi.", "Tick your worries and hand them to FinTax. On the right you will see what the company does with each.")}</p></div>
<div class="desk" data-desk>
<div class="dk-l mv mv-left"><div class="wy">${WHY.map((w, i) => `<button type="button" data-w="${i}" aria-pressed="true"><span class="bx">${ICON.check}</span><span>${w[l][0]}</span></button>`).join("")}</div>
<div class="dk-act"><button type="button" class="btn btn-ink" data-hand>${ICON.folder}<span>${t("Передать FinTax", "FinTax’ga topshirish", "Hand to FinTax")}</span></button><button type="button" class="btn btn-line" data-back hidden>${t("Вернуть как было", "Avvalgidek qaytarish", "Put it back")}</button></div></div>
<div class="dk-r mv mv-right"><div class="dk-tray" data-tray><span>${t("Папка FinTax", "FinTax papkasi", "FinTax folder")}</span><span class="fd" aria-hidden="true"><i></i><i></i></span></div>
<div data-ans aria-live="polite"><p class="dk-empty">${t("Пока здесь пусто: заботы у вас на столе.", "Hozircha bo‘sh: tashvishlar sizning stolingizda.", "Empty for now: the worries are still on your desk.")}</p></div></div>
</div></div></section>`;
}

/* ── Отзывы, команда, «почему» ─────────────────────────────────────── */
function reviews(l) {
  const t = T(l);
  return `<section class="sec dark" id="reviews"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker">${t("Отзывы наших клиентов", "Mijozlarimiz fikrlari", "Client reviews")}</p><h2 class="h2">${t("Клиенты рассказывают <mark class=\"hl\">сами</mark>", "Mijozlar <mark class=\"hl\">o‘zlari</mark> aytib beradi", "Clients tell it <mark class=\"hl\">themselves</mark>")}</h2><p class="lead">${t("Видеоотзывы с YouTube-канала FinTax.", "FinTax YouTube kanalidagi video fikrlar.", "Video reviews from the FinTax YouTube channel.")}</p></div>
<div class="rv mv-st mv">${REVIEWS.map((r, i) => `<a href="${r.url}" target="_blank" rel="noopener" style="--i:${i}"><span class="pl">${ICON.play}</span><span><b>Mijozlar fikri №${r.n}</b><br><small>YouTube · FinTax</small></span></a>`).join("")}</div>
<p style="margin-top:24px"><a class="btn btn-line" href="${CONTACT.youtube}" target="_blank" rel="noopener">${t("Все видео на канале", "Kanaldagi barcha videolar", "All videos on the channel")}</a></p>
</div></section>`;
}
function team(l) {
  const t = T(l);
  const ini = (n) => n.split(" ").slice(0, 2).map((w) => w[0]).join("");
  return `<section class="sec" id="team"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker">${t("Команда FinTax", "FinTax jamoasi", "The FinTax team")}</p><h2 class="h2">${t("Опытные специалисты с <mark class=\"hl\">многолетней практикой</mark>", "Ko‘p yillik <mark class=\"hl\">tajribaga ega</mark> mutaxassislar", "Specialists with <mark class=\"hl\">many years</mark> of practice")}</h2><p class="lead">${t("Имена и должности с сайта FinTax. На место инициалов встанут фотографии команды в хорошем качестве.", "Ism va lavozimlar FinTax saytidan. Bosh harflar o‘rniga jamoaning sifatli fotosuratlari qo‘yiladi.", "Names and roles from the FinTax website. Good-quality team photos will replace the initials.")}</p></div>
<div class="team mv-st mv">${TEAM.map((p, i) => `<div class="pp" style="--i:${i}"><span class="av" aria-hidden="true">${ini(p[l][0])}</span><span><b>${p[l][0]}</b><span>${p[l][1]}</span></span></div>`).join("")}</div>
</div></section>`;
}
function whys(l) {
  const t = T(l);
  return `<section class="sec" id="why"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker">${t("Почему мы, а не штатный бухгалтер", "Nima uchun biz, shtat buxgalteri emas", "Why us, not a staff accountant")}</p><h2 class="h2">${t("С нами ваш бухучёт всегда <mark class=\"hl\">под контролем</mark>", "Biz bilan buxgalteriyangiz doimo <mark class=\"hl\">nazoratda</mark>", "With us your accounting is always <mark class=\"hl\">under control</mark>")}</h2></div>
<ol class="whys">${WHY.map((w, i) => `<li class="mv ${["mv-up", "mv-left", "mv-tilt", "mv-right", "mv-scale", "mv-drop", "mv-up"][i]}"><span class="no">${pad(i + 1)}</span><h3>${w[l][1]}</h3><p>${w[l][2]}</p></li>`).join("")}</ol>
</div></section>`;
}
function band(l, quote) {
  return `<section class="band" data-band><picture><img src="${IMG}/archive-1100.webp" srcset="${IMG}/archive-1100.webp 1100w, ${IMG}/archive-2000.webp 2000w" sizes="100vw" alt="${T(l)("Ряд синих архивных коробок с жёлтыми ярлыками на полке", "Javonda sariq yorliqli ko‘k arxiv qutilari qatori", "A row of navy archive boxes with yellow tabs on a shelf")}" loading="lazy"></picture><div class="wrap"><blockquote class="mv mv-up">${quote}</blockquote></div></section>`;
}

/* ── Заявка ─────────────────────────────────────────────────────────── */
function fl(name, label, o = {}) {
  const req = o.req ? " required" : "";
  const field = o.area
    ? `<textarea name="${name}" rows="4"${req} placeholder="${esc(o.ph || "")}"></textarea>`
    : o.opts
      ? `<select name="${name}"${req}>${o.opts.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join("")}</select>`
      : `<input name="${name}" type="${o.type || "text"}"${o.auto ? ` autocomplete="${o.auto}"` : ""}${o.mode ? ` inputmode="${o.mode}"` : ""}${req} placeholder="${esc(o.ph || "")}">`;
  return `<label class="fl"><span>${label}${o.req ? " *" : ""}</span>${field}<span class="err" aria-live="polite"></span></label>`;
}
function form(l, title) {
  const t = T(l);
  return `<div class="card form-wrap" id="form"><form class="form" data-lead novalidate><h3>${title}</h3>
<p class="note">${t("Укажите телефон, и специалист свяжется с вами для бесплатной консультации.", "Telefon raqamingizni qoldiring, mutaxassis bepul maslahat uchun bog‘lanadi.", "Leave your phone number and a specialist will contact you for a free consultation.")}</p>
<div class="row2">${fl("name", t("Имя", "Ism", "Name"), { req: true, auto: "name" })}${fl("phone", t("Телефон", "Telefon", "Phone"), { req: true, type: "tel", auto: "tel", mode: "tel", ph: "+998" })}</div>
${fl("kind", t("Чем занимается бизнес", "Biznes nima bilan shug‘ullanadi", "What your business does"), { opts: [["", t("Выберите", "Tanlang", "Choose")], ...KINDS.map((k) => [k.id, k[l]])] })}
<p class="pick-in" data-pick-in hidden>${ICON.check}<span></span></p>
${fl("msg", t("Вопрос", "Savol", "Question"), { area: true, ph: t("Например: нужно восстановить учёт за прошлый год", "Masalan: o‘tgan yil hisobini tiklash kerak", "For example: we need to restore last year’s records") })}
<label class="agree"><input type="checkbox" name="agree" required><span>${t("Согласен, чтобы FinTax связался со мной по этой заявке.", "FinTax shu ariza bo‘yicha men bilan bog‘lanishiga roziman.", "I agree that FinTax may contact me about this request.")}</span></label>
<button type="submit" class="btn btn-pri">${ICON.send}<span>${t("Свяжитесь со мной", "Men bilan bog‘laning", "Contact me")}</span></button></form>
<div class="sent" hidden tabindex="-1"><span class="chip">${ICON.check}${t("Заявка принята", "Ariza qabul qilindi", "Request received")}</span><h3>${t("Заявка", "Ariza", "Request")} <span data-no></span></h3>
<p>${t("Специалист FinTax свяжется с вами. Чтобы не ждать, отправьте заявку в мессенджер компании: текст уже готов.", "FinTax mutaxassisi siz bilan bog‘lanadi. Kutmaslik uchun arizani kompaniya messenjeriga yuboring: matn tayyor.", "A FinTax specialist will contact you. To skip the wait, send the request to the company’s messenger: the text is ready.")}</p>
<div class="sent-act"><a class="btn btn-pri" data-send="tg" href="https://t.me/${CONTACT.tg}" target="_blank" rel="noopener">${ICON.tg}<span>Telegram</span></a><a class="btn btn-line" data-send="wa" href="https://wa.me/${CONTACT.phone.slice(1)}" target="_blank" rel="noopener">${ICON.wa}<span>WhatsApp</span></a></div>
<p class="note">${t("Это макет: заявка пришла в демо-панель FinTax, она открыта в этом же браузере.", "Bu maket: ariza FinTax demo-paneliga tushdi, u shu brauzerda ochiladi.", "This is a mockup: the request went to the FinTax demo panel, open in this same browser.")} <a href="${href(l, "panel")}#leads">${t("Открыть панель", "Panelni ochish", "Open the panel")}</a></p>
<button type="button" class="btn btn-line" data-again>${t("Новая заявка", "Yangi ariza", "New request")}</button></div></div>`;
}
function consult(l) {
  const t = T(l);
  return `<section class="sec" id="consult"><div class="wrap ct">
<div class="sec-h mv mv-up" style="margin:0"><p class="kicker">${t("Не знаете, какая услуга нужна?", "Qaysi xizmat kerakligini bilmayapsizmi?", "Not sure which service you need?")}</p><h2 class="h2">${t("Онлайн-консультация <mark class=\"hl\">бесплатно</mark>", "Onlayn maslahat <mark class=\"hl\">bepul</mark>", "Online consultation, <mark class=\"hl\">free</mark>")}</h2><p class="lead">${t("Даже если вы не наш клиент, можно получить быструю консультацию по налоговому законодательству.", "Mijozimiz bo‘lmasangiz ham, soliq qonunchiligi bo‘yicha tezkor maslahat olishingiz mumkin.", "Even if you are not our client, you can get prompt advice on tax legislation.")}</p>
<div class="hero-cta"><a class="btn btn-ink" href="${tgHref(HELLO(l))}" target="_blank" rel="noopener">${ICON.tg}<span>Telegram</span></a><a class="btn btn-line" href="tel:${CONTACT.phone}">${ICON.phone}<span>${CONTACT.phoneTxt}</span></a></div></div>
<div class="mv mv-right">${form(l, t("Свяжитесь со мной", "Men bilan bog‘laning", "Contact me"))}</div>
</div></section>`;
}
function pageHead(l, kicker, h1, lead) {
  return `<section class="ph"><div class="wrap"><p class="kicker">${kicker}</p><h1 class="h1">${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}</div></section>`;
}
function cta(l) {
  const t = T(l);
  return `<section class="cta"><div class="wrap"><h2 class="h2 mv mv-up">${t("Сэкономьте время и деньги: бухгалтерию ведём мы", "Vaqt va pulingizni tejang: buxgalteriyani biz yuritamiz", "Save time and money: we keep the books")}</h2><div class="hero-cta"><a class="btn btn-pri" href="${tgHref(HELLO(l))}" target="_blank" rel="noopener">${ICON.tg}<span>${consultTxt(l)}</span></a><a class="btn btn-line" href="tel:${CONTACT.phone}">${ICON.phone}<span>${CONTACT.phoneTxt}</span></a></div></div></section>`;
}

/* ── Страницы ──────────────────────────────────────────────────────── */
function home(l) {
  return hero(l) + order(l) + picker(l) + scheme(l) + desk(l) + reviews(l) + consult(l);
}
function services(l) {
  const t = T(l);
  return pageHead(l, t("Бухгалтерские услуги", "Buxgalteriya xizmatlari", "Accounting services"), t("Десять услуг, <mark class=\"hl on\">одна команда</mark>", "O‘nta xizmat, <mark class=\"hl on\">bitta jamoa</mark>", "Ten services, <mark class=\"hl on\">one team</mark>"), t("От ежедневного учёта до срочной сдачи отчётов за несколько периодов. Выберите услугу, чтобы прочитать подробнее.", "Kundalik hisobdan bir necha davr hisobotlarini shoshilinch topshirishgacha. Batafsil o‘qish uchun xizmatni tanlang.", "From daily bookkeeping to urgent filing for several periods. Pick a service to read more."))
    + `<section class="sec"><div class="wrap svc" data-svc>
<div class="svc-l" role="group" aria-label="${t("Услуги", "Xizmatlar", "Services")}">${SERVICES.map((s, i) => `<button type="button" aria-pressed="${i === 0}" data-s="${i}"><small>${pad(i + 1)}</small><span>${s[l][0]}</span></button><div class="svc-mob" data-m="${i}"${i ? " hidden" : ""}><p>${s[l][1]}</p><a class="btn btn-pri" href="${tgHref(T(l)(`Здравствуйте! Интересует услуга: ${s.ru[0]}.`, `Assalomu alaykum! Qiziqtirgan xizmat: ${s.uz[0]}.`, `Hello! I am interested in: ${s.en[0]}.`))}" target="_blank" rel="noopener" style="justify-self:start">${ICON.tg}<span>${t("Узнать стоимость", "Narxini bilish", "Find out the cost")}</span></a></div>`).join("")}</div>
<div class="card svc-p" aria-live="polite"><span class="ico"></span><span class="chip" data-g></span><h3></h3><p></p><a class="btn btn-pri" data-ask target="_blank" rel="noopener" href="${tgHref(HELLO(l))}" style="justify-self:start">${ICON.tg}<span>${t("Узнать стоимость", "Narxini bilish", "Find out the cost")}</span></a></div>
</div></section>`
    + band(l, t("С нами ваш бухучёт всегда <mark class=\"hl\">под контролем</mark>", "Biz bilan buxgalteriyangiz doimo <mark class=\"hl\">nazoratda</mark>", "With us your accounting is always <mark class=\"hl\">under control</mark>"))
    + scheme(l) + cta(l);
}
function prices(l) {
  const t = T(l);
  return pageHead(l, t("Стоимость наших услуг", "Xizmatlar narxi", "Service cost"), t("Прозрачные тарифы <mark class=\"hl on\">без скрытых платежей</mark>", "Yashirin to‘lovlarsiz <mark class=\"hl on\">shaffof tariflar</mark>", "Clear pricing <mark class=\"hl on\">without hidden fees</mark>"), t("Ведение бухгалтерии и сдача отчётности от 1 500 000 сум в месяц. Подберите тариф по своему бизнесу.", "Buxgalteriya hisobini yuritish va hisobot topshirish oyiga 1 500 000 so‘mdan. Biznesingizga mos tarifni tanlang.", "Bookkeeping and reporting from 1,500,000 UZS a month. Find the tariff for your business."))
    + picker(l, false)
    + `<section class="sec" style="padding-top:0"><div class="wrap"><div class="grid g4 mv-st mv" data-tariffs>${TARIFFS.map((x, i) => `<article class="card tf" data-t="${x.id}" data-fit="${t("Ваш тариф", "Sizning tarifingiz", "Your tariff")}" style="--i:${i}"><h3>${x[l][0]}</h3><p class="note">${x[l][1]}</p><ul>${x[l][2].map((p) => `<li>${ICON.check}<span>${p}</span></li>`).join("")}</ul><p class="pr" data-price="${x.id}">${x[l][3]}</p><a class="btn btn-line" href="${tgHref(T(l)(`Здравствуйте! Хочу обсудить тариф «${x.ru[0]}».`, `Assalomu alaykum! «${x.uz[0]}» tarifini muhokama qilmoqchiman.`, `Hello! I would like to discuss the “${x.en[0]}” tariff.`))}" target="_blank" rel="noopener">${t("Обсудить проект", "Muhokama qilish", "Discuss the project")}</a></article>`).join("")}</div></div></section>`
    + `<section class="sec dark"><div class="wrap"><div class="sec-h mv mv-up"><p class="kicker">${t("Уже входит в тариф", "Tarifga allaqachon kiradi", "Already in the tariff")}</p><h2 class="h2">${t("ИТ-сопровождение бухгалтера <mark class=\"hl\">берём на себя</mark>", "Buxgalterning IT ta’minotini <mark class=\"hl\">o‘zimiz olamiz</mark>", "We take care of the <mark class=\"hl\">accountant’s IT</mark>")}</h2></div>
<div class="grid g3 mv-st mv">${[[ICON.key, t("Электронные ключи", "Elektron kalitlar", "Electronic keys"), t("Выпуск ключей для сдачи отчётности.", "Hisobot topshirish uchun kalitlarni chiqarish.", "Issuing keys for filing reports.")], [ICON.db, t("Бухгалтерская программа", "Buxgalteriya dasturi", "Accounting software"), t("База на защищённых серверах 1С, у вас круглосуточный доступ.", "Baza 1C’ning xavfsiz serverlarida, sizda 24 soatlik kirish bor.", "The database is on secure 1C servers, with 24/7 access for you.")], [ICON.send, t("Сдача отчётности", "Hisobot topshirish", "Report filing"), t("Через электронный документооборот с госорганами.", "Davlat organlari bilan elektron hujjat aylanishi orqali.", "Through electronic document exchange with government agencies.")]].map(([ic, h, p], i) => `<div class="card" style="--i:${i}"><span class="chip" style="background:var(--ink3);color:var(--hl)">${ic}</span><h3 class="h3" style="margin:14px 0 6px">${h}</h3><p class="note">${p}</p></div>`).join("")}</div></div></section>`
    + cta(l);
}
function about(l) {
  const t = T(l);
  return pageHead(l, "FinTax Consulting", t("Помогаем бизнесу вести бухучёт и <mark class=\"hl on\">оптимизировать налоги</mark>", "Biznesga buxgalteriya yuritish va <mark class=\"hl on\">soliqlarni optimallashtirishda</mark> yordam beramiz", "We help businesses keep their books and <mark class=\"hl on\">optimise taxes</mark>"), `${HERO.served[l]}. ${t("Бухгалтерское и кадровое сопровождение в Ташкенте, офис в Яккасарайском районе.", "Toshkentda buxgalteriya va kadrlar hisobini yuritish, ofis Yakkasaroy tumanida.", "Accounting and HR support in Tashkent, with an office in Yakkasaray district.")}`)
    + whys(l) + band(l, t("Внимательное, <mark class=\"hl\">человечное</mark> отношение к каждому клиенту", "Har bir mijozga e’tiborli, <mark class=\"hl\">samimiy</mark> munosabat", "An attentive, <mark class=\"hl\">personal</mark> approach to every client")) + team(l) + reviews(l) + cta(l);
}
function contacts(l) {
  const t = T(l);
  return pageHead(l, t("Контакты", "Aloqa", "Contacts"), t("Мы находимся <mark class=\"hl on\">в центре</mark>", "Biz <mark class=\"hl on\">markazdamiz</mark>", "We are <mark class=\"hl on\">in the centre</mark>"), CONTACT.address[l])
    + `<section class="sec"><div class="wrap ct">
<div class="ct-l mv-st mv">
<a class="ci" style="--i:0" href="tel:${CONTACT.phone}"><span class="ic">${ICON.phone}</span><span><b>${CONTACT.phoneTxt}</b><span>${t("Звоните", "Qo‘ng‘iroq qiling", "Call")}: ${CONTACT.hours[l]}</span></span></a>
<a class="ci" style="--i:1" href="${tgHref(HELLO(l))}" target="_blank" rel="noopener"><span class="ic">${ICON.tg}</span><span><b>Telegram @${CONTACT.tg}</b><span>${t("Напишите нам: мы онлайн", "Bizga yozing: biz onlaynmiz", "Write to us: we are online")}</span></span></a>
<a class="ci" style="--i:2" href="${waHref(HELLO(l))}" target="_blank" rel="noopener"><span class="ic">${ICON.wa}</span><span><b>WhatsApp</b><span>${CONTACT.phoneTxt}</span></span></a>
<a class="ci" style="--i:3" href="mailto:${CONTACT.email}"><span class="ic">${ICON.mail}</span><span><b>${CONTACT.email}</b><span>${t("Почта", "Pochta", "Email")}</span></span></a>
<a class="ci" style="--i:4" href="${CONTACT.map}" target="_blank" rel="noopener"><span class="ic">${ICON.pin}</span><span><b>${CONTACT.address[l]}</b><span>${t("Показать на карте", "Xaritada ko‘rsatish", "Show on the map")}</span></span></a>
<div class="card track" id="track" style="--i:5" hidden><h3 class="h3">${t("Мои заявки", "Mening arizalarim", "My requests")}</h3><p class="note">${t("Статус ставит специалист FinTax в панели.", "Holatni FinTax mutaxassisi panelda belgilaydi.", "A FinTax specialist sets the status in the panel.")}</p><div class="track-l"></div></div>
</div>
<div class="mv mv-right">${form(l, t("Заказать обратный звонок", "Qayta qo‘ng‘iroq buyurtma qilish", "Request a call back"))}</div>
</div></section>`;
}
const BUILD = { "": home, services, prices, about, contacts };
const TITLES = {
  "": ["Бухгалтерские услуги в Ташкенте: аутсорсинг бухгалтерии FinTax", "Buxgalter xizmati Toshkent: FinTax buxgalteriya autsorsingi", "Accounting services in Tashkent: FinTax outsourced accounting"],
  services: ["Услуги FinTax: учёт, отчётность, восстановление, аудит", "FinTax xizmatlari: hisob, hisobot, tiklash, audit", "FinTax services: accounting, reporting, restoring, audit"],
  prices: ["Тарифы FinTax: бухгалтерия от 1 500 000 сум в месяц", "FinTax tariflari: buxgalteriya oyiga 1 500 000 so‘mdan", "FinTax pricing: accounting from 1,500,000 UZS a month"],
  about: ["О FinTax: команда бухгалтеров в Ташкенте", "FinTax haqida: Toshkentdagi buxgalterlar jamoasi", "About FinTax: a team of accountants in Tashkent"],
  contacts: ["Контакты FinTax: Кушбеги, 31B, Ташкент", "FinTax bilan aloqa: Qushbegi, 31B, Toshkent", "Contact FinTax: 31B Qushbegi St, Tashkent"],
};
const DESC = ["Аутсорсинг бухгалтерии в Ташкенте: ведение учёта и сдача отчётности от 1 500 000 сум в месяц, материальная ответственность за ошибки по договору.", "Toshkentda buxgalteriya autsorsingi: hisob yuritish va hisobot topshirish oyiga 1 500 000 so‘mdan, shartnoma bo‘yicha xatolar uchun moddiy javobgarlik.", "Outsourced accounting in Tashkent: bookkeeping and reporting from 1,500,000 UZS a month, with financial liability for errors under contract."];

/* ── Данные для скрипта ────────────────────────────────────────────── */
function K(l, p) {
  const t = T(l);
  return {
    lang: l,
    page: p || "home",
    panel: href(l, "panel"),
    tg: CONTACT.tg, wa: CONTACT.phone.slice(1),
    services: SERVICES.map((s) => ({ id: s.id, n: s[l][0], d: s[l][1], g: GROUPS[s.g][l], ic: ICON[s.ic], ask: T(l)(`Здравствуйте! Интересует услуга: ${s.ru[0]}.`, `Assalomu alaykum! Qiziqtirgan xizmat: ${s.uz[0]}.`, `Hello! I am interested in: ${s.en[0]}.`) })),
    tariffs: TARIFFS.map((x) => ({ id: x.id, lim: x.lim, n: x[l][0], f: x[l][1], p: x[l][3] })),
    turn: TURNOVER[l],
    kinds: Object.fromEntries(KINDS.map((k) => [k.id, k[l]])),
    why: WHY.map((w) => ({ a: w[l][1], b: w[l][2] })),
    icCheck: ICON.check,
    r: {
      docs: t("Документов {n}: тариф до {m}", "Hujjatlar {n}: {m} tagacha tarif", "{n} documents: tariff up to {m}"),
      docsOver: t("Документов больше 120: объём крупнее любого тарифа, сумму назовёт специалист", "Hujjatlar 120 dan ortiq: hajm har qanday tarifdan katta, summani mutaxassis aytadi", "Over 120 documents: more than any tariff, a specialist will name the price"),
      staff: t("Сотрудников {n}: тариф для менее {m}", "Xodimlar {n}: {m} nafardan kam uchun tarif", "{n} employees: tariff for fewer than {m}"),
      staffOver: t("Сотрудников 25 и больше: сумму назовёт специалист", "Xodimlar 25 va undan ko‘p: summani mutaxassis aytadi", "25 or more employees: a specialist will name the price"),
      vat: t("ОСН с НДС: от тарифа «Малый бизнес»", "QQS bilan umumiy tizim: «Kichik biznes» tarifidan", "General regime with VAT: from the “Small business” tariff"),
      usn: t("УСН (4%): подходит и тариф «Предприниматель»", "Soddalashtirilgan tizim (4%): «Tadbirkor» tarifi ham mos", "Simplified regime (4%): the “Entrepreneur” tariff also fits"),
      ved: t("ВЭД: сопровождение есть с тарифа «Средний бизнес»", "TIF: yuritish «O‘rta biznes» tarifidan", "Foreign trade: support starts from the “Medium business” tariff"),
      turn: t("Оборот {n}", "Aylanma {n}", "Turnover {n}"),
    },
    pickMsg: t("Здравствуйте! Подобрал на сайте тариф «{t}» ({p}). Бизнес: {k}, документов в месяц: {d}, сотрудников: {s}, {x}, оборот {o}{v}. Хочу бесплатную консультацию.", "Assalomu alaykum! Saytda «{t}» tarifini tanladim ({p}). Biznes: {k}, oyiga hujjatlar: {d}, xodimlar: {s}, {x}, aylanma {o}{v}. Bepul maslahat olmoqchiman.", "Hello! I picked the “{t}” tariff on the website ({p}). Business: {k}, documents a month: {d}, employees: {s}, {x}, turnover {o}{v}. I would like a free consultation."),
    taxN: { usn: t("УСН", "soddalashtirilgan tizim", "simplified regime"), vat: t("ОСН с НДС", "QQS bilan umumiy tizim", "general regime with VAT") },
    vedN: t(", есть ВЭД", ", TIF bor", ", foreign trade"),
    pickIn: t("Из подбора: тариф «{t}», {p}", "Tanlovdan: «{t}» tarifi, {p}", "From the picker: “{t}” tariff, {p}"),
    leadMsg: t("Здравствуйте! Заявка {id} с сайта. Имя: {name}, телефон: {phone}.{rest}", "Assalomu alaykum! Saytdan {id} ariza. Ism: {name}, telefon: {phone}.{rest}", "Hello! Request {id} from the website. Name: {name}, phone: {phone}.{rest}"),
    st: { new: t("Новая", "Yangi", "New"), call: t("Созвонились", "Qo‘ng‘iroq qilindi", "Called"), offer: t("Отправили предложение", "Taklif yuborildi", "Offer sent"), client: t("Вы наш клиент", "Siz mijozimizsiz", "You are our client") },
    status: t("Статус", "Holat", "Status"),
    err: { need: t("Заполните это поле", "Bu maydonni to‘ldiring", "Please fill this in"), phone: t("В номере мало цифр", "Raqamda raqamlar kam", "The number is too short"), form: t("Проверьте отмеченные поля", "Belgilangan maydonlarni tekshiring", "Please check the highlighted fields") },
    sending: t("Отправляем", "Yuborilmoqda", "Sending"),
    sentToast: t("Заявка ушла в панель FinTax.", "Ariza FinTax paneliga ketdi.", "The request went to the FinTax panel."),
    toPanel: t("Открыть в панели", "Panelda ochish", "Open in the panel"),
    nWorry: t("Передано FinTax: {n}", "FinTax’ga topshirildi: {n}", "Handed to FinTax: {n}"),
    noWorry: t("Отметьте хотя бы одну заботу слева.", "Chapda kamida bitta tashvishni belgilang.", "Tick at least one worry on the left."),
    emptyAns: t("Пока здесь пусто: заботы у вас на столе.", "Hozircha bo‘sh: tashvishlar sizning stolingizda.", "Empty for now: the worries are still on your desk."),
  };
}

function ld(l, p) {
  const org = { "@type": "AccountingService", name: "FinTax", description: DESC[LI(l)], telephone: CONTACT.phoneTxt, email: CONTACT.email, address: { "@type": "PostalAddress", streetAddress: CONTACT.address[l], addressLocality: "Tashkent", addressCountry: "UZ" }, openingHours: "Mo-Su 09:00-19:00", priceRange: "1500000 UZS+" };
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [org, { "@type": "WebPage", name: TITLES[p][LI(l)], inLanguage: l }] }).replace(/</g, "\\u003c");
}

function page(l, p) {
  const t = T(l);
  const isHome = p === "";
  const dz = isHome ? dzIntroSolo(l === "en" ? "ru" : l).replace(">Пропустить<", l === "en" ? ">Skip<" : ">Пропустить<") : "";
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${TITLES[p][LI(l)]}</title>
<meta name="description" content="${DESC[LI(l)]}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#161a28">
<meta property="og:title" content="${TITLES[p][LI(l)]}">
<meta property="og:description" content="${DESC[LI(l)]}">
<meta property="og:type" content="website">
<link rel="icon" type="image/svg+xml" href="${IMG}/icon.svg">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
${isHome ? `<link rel="preload" as="image" href="${IMG}/hero-1600.webp" imagesrcset="${IMG}/hero-960.webp 960w, ${IMG}/hero-1600.webp 1600w, ${IMG}/hero-2560.webp 2560w" imagesizes="100vw" media="(min-width: 900px), (orientation: landscape)">\n<link rel="preload" as="image" href="${IMG}/hero-m-1080.webp" media="(max-width: 899px) and (orientation: portrait)">` : ""}
${LANGS.filter((x) => x !== l).map((x) => `<link rel="alternate" hreflang="${x}" href="${href(x, p)}">`).join("\n")}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>(function(){var r=document.documentElement;r.classList.add('js');try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)r.classList.add('rm')}catch(e){}})()</script>
<style>${CSS}</style>
<script type="application/ld+json">${ld(l, p)}</script>
</head>
<body data-lang="${l}" data-page="${p || "home"}">
${dz}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga", "Skip to content")}</a>
${headerHtml(l, p)}
<main id="main">
${BUILD[p](l)}
</main>
${footHtml(l)}
<div class="dock" id="dock"><a class="btn btn-pri" href="${tgHref(HELLO(l))}" target="_blank" rel="noopener">${ICON.tg}<span>${consultTxt(l)}</span></a><a class="ic-btn" href="tel:${CONTACT.phone}" aria-label="${t("Позвонить", "Qo‘ng‘iroq qilish", "Call")}">${ICON.phone}</a></div>
<p class="toast" id="toast" role="status" hidden></p>
<script type="application/json" id="ft-data">${JSON.stringify(K(l, p)).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}

/* ── Панель ─────────────────────────────────────────────────────────── */
const PANEL_JS = strip(readFileSync(DIR + "panel.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_CSS = strip(readFileSync(DIR + "panel.css", "utf8")).replace(/\n\s*/g, "");
/* Каждая подпись, которую зовёт panel.js, — на трёх языках, иначе сборка падает. */
(function checkDict() {
  const keys = new Set([...PANEL_JS.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  for (const k of ["role_", "s_", "k_", "n_", "r_", "src_", "tax_", "cs_"]) keys.delete(k);
  for (const k of keys) {
    const v = PANEL_UI[k];
    if (!v || v.length !== 3 || v.some((x) => !x)) throw new Error(`panel: нет подписи «${k}» на трёх языках`);
    if (/[А-Яа-яЁё]/.test(JSON.stringify([v[1], v[2]]))) throw new Error(`panel: кириллица в узбекской или английской подписи «${k}»`);
  }
  for (const [k, v] of Object.entries(PANEL_UI)) if (/[А-Яа-яЁё]/.test(v[1] + v[2])) throw new Error(`panel: кириллица в «${k}»`);
  if (/[А-Яа-яЁё]/.test(PANEL_JS + PANEL_CSS)) throw new Error("panel: кириллица в коде панели");
})();
const SP = (dd) => `<path d="${dd}"/>`;
const SPRITE = {
  dash: SP("M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"), leads: SP("M4 13h4l2 3h4l2-3h4M4 13l2.5-8h11L20 13v6H4z"),
  clients: SP("M4 21V8l8-5 8 5v13M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01"), tariffs: SP("M20 12 12 20 4 12V4h8zM8 8h.01"),
  log: SP("M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"),
  team: SP("M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a5.5 5.5 0 0 1 3.5 6"),
  x: SP("M6 6l12 12M18 6 6 18"), menu: SP("M4 7h16M4 12h16M4 17h16"), check: SP("m5 12.5 4.5 4.5L19 7"),
  ext: SP("M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"), tg: SP("M21 4 3 11l6 2.2L18 7l-7 7.2.3 5.8 3.3-4 4.4 3.2Z"), phone: SP("M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"),
  eye: SP("M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"), alert: SP("M12 4 2 20h20zM12 10v4M12 17h.01"),
};
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(SPRITE).map(([k, dd]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${dd}</symbol>`).join("")}</svg>`;
/* Демо-имена клиентов-заявителей; бухгалтеры — команда с их сайта. */
const NAMES = {
  ru: ["Алишер К.", "Нигора Р.", "Сардор М.", "Камила А.", "Бобур Т.", "Лола Ш.", "Рустам Ю.", "Севара Х.", "Дилшод Б.", "Жасур Н.", "Гулноза Э.", "Тимур С."],
  uz: ["Alisher K.", "Nigora R.", "Sardor M.", "Kamila A.", "Bobur T.", "Lola Sh.", "Rustam Yu.", "Sevara X.", "Dilshod B.", "Jasur N.", "Gulnoza E.", "Temur S."],
  en: ["Alisher K.", "Nigora R.", "Sardor M.", "Kamila A.", "Bobur T.", "Lola Sh.", "Rustam Yu.", "Sevara Kh.", "Dilshod B.", "Jasur N.", "Gulnoza E.", "Timur S."],
};
function panelData(l) {
  const i = LI(l);
  return {
    lang: l,
    ui: Object.fromEntries(Object.entries(PANEL_UI).map(([k, v]) => [k, v[i]])),
    names: NAMES[l],
    staff: TEAM.slice(2).map((p) => ({ n: p[l][0], r: p[l][1] })),
    heads: TEAM.slice(0, 3).map((p) => p[l][0]),
    tariffs: TARIFFS.map((x) => ({ id: x.id, n: x[l][0], p: x[l][3], lo: [1.5, 4, 6, 10][TARIFFS.indexOf(x)], hi: [4, 6, 10, 14][TARIFFS.indexOf(x)] })),
    kinds: Object.fromEntries(KINDS.map((k) => [k.id, k[l]])),
    services: SERVICES.map((s) => s[l][0]),
    site: href(l),
    prices: href(l, "prices"),
    tg: CONTACT.tg,
  };
}
function panelPage(l) {
  const t = T(l);
  const nav = ["dash", "leads", "clients", "tariffs", "log", "team"];
  const pick = (k) => PANEL_UI[k][LI(l)];
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t("Панель FinTax · макет DevUz Studio", "FinTax paneli · DevUz Studio maketi", "FinTax panel · DevUz Studio mockup")}</title>
<meta name="description" content="${t("Панель сайта FinTax: заявки с сайта и подбора тарифа, клиенты на обслуживании, тарифы, роли и история действий.", "FinTax sayti paneli: sayt va tarif tanlovidan arizalar, xizmatdagi mijozlar, tariflar, rollar va harakatlar tarixi.", "FinTax website panel: requests from the site and the tariff picker, clients on service, tariffs, roles and action history.")}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#161a28">
<link rel="icon" type="image/svg+xml" href="${IMG}/icon.svg">
${LANGS.filter((x) => x !== l).map((x) => `<link rel="alternate" hreflang="${x}" href="${href(x, "panel")}">`).join("\n")}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>${PANEL_CSS}</style>
</head>
<body class="panel" data-lang="${l}">
${sprite()}
<div class="app">
<div class="nav-back" data-navclose></div>
<aside class="side-nav" aria-label="${pick("sections")}">
<a class="brand" href="${href(l)}" aria-label="FinTax"><span class="logo">Fin<b>Tax</b></span><small>${pick("panelOf")}</small></a>
<nav class="nav">${nav.map((k) => `<a href="#${k}"><svg class="ic" aria-hidden="true"><use href="#i-${k}"/></svg><span>${pick("n_" + k)}</span>${k === "leads" ? `<i data-cnt hidden>0</i>` : ""}</a>`).join("")}</nav>
<div class="role"><label><span>${pick("viewAs")}</span><select id="role">${["owner", "head", "manager"].map((r) => `<option value="${r}">${pick("role_" + r)}</option>`).join("")}</select></label>
<a class="to-site" href="${href(l)}"><svg class="ic" aria-hidden="true"><use href="#i-ext"/></svg><span>${pick("toSite")}</span></a></div>
</aside>
<div class="main">
<header class="topbar"><button type="button" class="ib" id="menu-b" aria-label="${pick("menu")}"><svg class="ic" aria-hidden="true"><use href="#i-menu"/></svg></button><b class="tb-t" id="tb-t"></b><span class="sp"></span><div class="lang-s">${LANGS.map((x) => `<a href="${href(x, "panel")}" hreflang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div></header>
<main id="pv" tabindex="-1"></main>
<p class="demo">${pick("demoNote")} <a href="${TERMS(l)}">${pick("terms")}</a></p>
</div></div>
<div id="mdl" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="fp-data">${JSON.stringify(panelData(l)).replace(/</g, "\\u003c")}</script>
<script>
${PANEL_JS}</script>
</body>
</html>`;
}

const out = {};
for (const l of LANGS) {
  for (const p of PAGES) out[keyOf(l, p)] = page(l, p);
  out[keyOf(l, "panel")] = panelPage(l);
}
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/* Сборка для сервера (lib/proto/bundles): стили и скрипты один раз, в
   страницах вместо них метка @@имя@@. */
const parts = { S: `<style>${CSS}</style>`, J: `<script>\n${JS}</script>`, K: `<style>${PANEL_CSS}</style>`, Q: `<script>\n${PANEL_JS}</script>` };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const [name, part] of Object.entries(parts)) p = p.split(part).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "fintax.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(14), v.length);
