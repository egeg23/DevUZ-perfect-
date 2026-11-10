import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { LANGS, CLINIC, SERVICES, CARE, TEAM, REVIEWS, FAQ, CHAPTERS } from "./data.mjs";
import { BASE, ADDONS, OFFER_HOURS, ALL } from "./plan.mjs";

/*
 * Макет Nek Dental Studio (Тбилиси, Ваке, ул. Палиашвили, 65), 10.11.2026.
 * Сайта у клиники нет: факты — из их Instagram, Facebook, TikTok и
 * справочников (SOURCES.md). Страницы на en (главная), ka и ru:
 *
 *   ""    — видео DevUz → пролёт по прокрутке, как у «Сияния Севера»:
 *           ресепшен со знаком, влёт в цветок, лаунж, кабинет, зуб после
 *           реставрации (кадры Higgsfield шифром, scene.py) → выбор
 *           «Сайт» / «Панель» → как проверить → конструктор цены (plan.mjs);
 *   site  — сайт клиники: их слова, восемь услуг, слои реставрации,
 *           забота до процедуры, их фото, команда, отзывы, вопросы, запись
 *           в два нажатия в WhatsApp, карта; допы блоками;
 *   panel — панель клиники по эталону Greenwell и «Сияния Севера».
 *
 * Формы ничего не отправляют наружу: запись ложится в браузер (её видит
 * панель) и открывает их WhatsApp с готовым текстом. Модель макет не зовёт.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/nek";
const PUB = new URL("../../../public", import.meta.url).pathname;
// Комментарии уходят, метка числа `/*~*/` остаётся: её снимает отпечаток при показе.
const strip = (s) => s.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");
const read = (f) => readFileSync(DIR + f, "utf8");
const CSS = strip(read("site.css")).replace(/\n\s*/g, "");
const JS = strip(read("site.js")).replace(/\n\s*\n/g, "\n");
const LAND_JS = strip(read("land.js")).replace(/\n\s*\n/g, "\n");
const PANEL_JS = strip(read("panel.js")).replace(/\n\s*\n/g, "\n");
const PANEL_CSS = strip(read("panel.css")).replace(/\n\s*/g, "");
const MEDIA = JSON.parse(read("media.json"));
const BASE_URL = "__PROTO_BASE__";
/* Условий макета на грузинском нет: грузинская страница ведёт на английские. */
const TERMS = (l) => `https://devuz.studio/${l === "ru" ? "ru" : "en"}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Cormorant:wght@400;700&family=Manrope:wght@400;700&family=Noto+Sans+Georgian:wght@400;700&family=Noto+Serif+Georgian:wght@400;700&display=swap";
const KEY = { en: "", ka: "ka", ru: "ru" };
const DEVUZ = "https://t.me/Devuz_studio_bot?start=nekdental";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, p = "") => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/" + p;
const T = (l) => (en, ka, ru) => (l === "en" ? en : l === "ka" ? ka : ru);
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => `${fmt(n)} $`;
const gel = (n) => `${fmt(n)} ₾`;
const words = (txt) => txt.split(" ").map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
const wa = (text) => `https://wa.me/${CLINIC.wa}?text=${encodeURIComponent(text)}`;
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

const I = (dd) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  back: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  wa: I('<path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z"/><path d="M9.2 8.6c.3 2.9 2.4 5.2 5.4 5.9l1.2-1.3-1.8-1-1 .8c-1-.4-1.9-1.3-2.4-2.4l.8-1-1-1.8z"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  panel: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  chat: I('<path d="M4 5.5h16v11H9l-5 3.5z"/><path d="M8 10h8M8 13h5"/>'),
  globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  cal: I('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  star: I('<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>'),
  plane: I('<path d="M3 13.5 21 6l-4 14-5-5.5-3 3.5v-5z"/><path d="m12 14.5 9-8.5"/>'),
  doc: I('<path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
  tooth: I('<path d="M7.5 4c-2.2 0-3.5 1.8-3.5 4.3 0 3 1.4 4.5 2 7.2.5 2.5 1 4.5 2.3 4.5 1.5 0 1.3-4.5 3.7-4.5s2.2 4.5 3.7 4.5c1.3 0 1.8-2 2.3-4.5.6-2.7 2-4.2 2-7.2C20 5.8 18.7 4 16.5 4c-1.8 0-2.6 1-4.5 1S9.3 4 7.5 4z"/>'),
  brace: I('<rect x="3" y="9" width="5" height="6" rx="1.5"/><rect x="9.5" y="9" width="5" height="6" rx="1.5"/><rect x="16" y="9" width="5" height="6" rx="1.5"/><path d="M2 12h20"/>'),
  spark: I('<path d="M12 3.5c.8 4.2 2.3 5.7 6.5 6.5-4.2.8-5.7 2.3-6.5 6.5-.8-4.2-2.3-5.7-6.5-6.5 4.2-.8 5.7-2.3 6.5-6.5z"/>'),
  implant: I('<path d="M9 3.5h6v3H9zM10 6.5h4l-.5 2h-3z"/><path d="M10.5 8.5h3l-.3 11-1.2 1.5-1.2-1.5z"/><path d="M9.5 11h5M9.8 13.5h4.4M10 16h4"/>'),
  crown: I('<path d="M4 17h16l1-9-5 3-4-6-4 6-5-3z"/><path d="M5 20h14"/>'),
  shield: I('<path d="M12 3.5 5 6v5.5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  drop: I('<path d="M12 3.5s-6 6.6-6 10.5a6 6 0 0 0 12 0c0-3.9-6-10.5-6-10.5z"/>'),
  care: I('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
  bell: I('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
};

/* Знак клиники: цветок из их вывески, линией. Кодом, одним цветом. */
const PETAL = "M20 20c-2.4-5.3-1.6-10.6 2.3-13.2 1.6 2.6 1.4 6.3-.4 8.6 2.4-1 4.8-.6 6 .9-2.2 2-5.1 3.3-7.9 3.7z";
const MARK = `<svg class="mk" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round">${[0, 72, 144, 216, 288].map((r) => `<path d="${PETAL}" transform="rotate(${r} 20 20)"/>`).join("")}</g><circle cx="20" cy="20" r="2.2" fill="currentColor"/></svg>`;
const LOGO = (l, to = "site") => `<a class="logo" href="${href(l, to)}" aria-label="Nek Dental Studio">${MARK}<span><b>NEK</b> DENTAL STUDIO</span></a>`;
const MOTION = ["rise", "tilt", "pop", "slide"];

function head(l, title, desc) {
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#2b1d33">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}

const langLinks = (l, p) => `<div class="langs">${LANGS.map((x) => `<a href="${href(x, p)}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x === "ka" ? "ქარ" : x.toUpperCase()}</a>`).join("")}</div>`;

/* ── Сайт клиники ─────────────────────────────────────────────────── */
function header(l, t) {
  const nav = [["services", t("Services", "მომსახურება", "Услуги")], ["resto", t("Restoration", "რესტავრაცია", "Реставрация")], ["team", t("Team", "გუნდი", "Команда")], ["faq", t("Questions", "კითხვები", "Вопросы")], ["visit", t("Contacts", "კონტაქტი", "Контакты")]];
  return `<header class="top"><div class="mbar"><a href="${href(l)}">${ICON.back}<span>${t("Mockup for Nek Dental Studio", "მაკეტი Nek Dental Studio-სთვის", "Макет для Nek Dental Studio")}</span></a><a class="mb-adm" href="${href(l, "panel")}">${ICON.panel}<span>${t("Clinic panel", "კლინიკის პანელი", "Панель клиники")}</span>${ICON.arrow}</a></div><div class="top-in glass">
${LOGO(l)}
<nav class="nav" aria-label="${t("Sections", "განყოფილებები", "Разделы")}">${nav.map(([id, n]) => `<a href="#${id}">${n}</a>`).join("")}</nav>
<button type="button" class="mine" id="mine">${ICON.doc}<span>${t("My booking", "ჩემი ჩაწერა", "Моя запись")}</span></button>
${langLinks(l, "site")}
<a class="btn btn-l btn-s tel" href="tel:${CLINIC.tel}">${ICON.phone}<span>${CLINIC.phone}</span></a>
<button type="button" class="btn btn-a btn-s" data-book>${t("Book a visit", "ჩაწერა", "Записаться")}</button>
</div></header>`;
}

function hero(l, t) {
  return `<section class="hero" id="top" aria-label="Nek Dental Studio">
<div class="wrap hero-in">
<div class="hero-tx">
<p class="kick rise"><i></i>${esc(CLINIC.slogan[l])}</p>
<h1>${words(t("The aesthetics of dentistry <em>lie in the details</em>", "სტომატოლოგიის ესთეტიკა <em>დეტალებშია</em>", "Эстетика стоматологии <em>в&nbsp;деталях</em>"))}</h1>
<p class="hsub rise">${t("Artistic restoration, braces, whitening, implants and prosthetics in Vake. Every restoration is planned individually, so the result is both beautiful and functionally correct.", "მხატვრული რესტავრაცია, ბრეკეტები, გათეთრება, იმპლანტები და ორთოპედია ვაკეში. თითოეული რესტავრაცია ინდივიდუალურად იგეგმება, რათა შედეგი იყოს როგორც ლამაზი, ისე ფუნქციურად სწორი.", "Художественная реставрация, брекеты, отбеливание, импланты и протезирование в Ваке. Каждая реставрация планируется индивидуально, чтобы результат был и красивым, и функционально правильным.")}</p>
<div class="hero-act rise"><button type="button" class="btn btn-a" data-book>${ICON.cal}<span>${t("Book a visit", "ვიზიტზე ჩაწერა", "Записаться на приём")}</span></button><a class="btn btn-l" href="tel:${CLINIC.tel}">${ICON.phone}<span>${t("Call", "დარეკვა", "Позвонить")}</span></a></div>
<ul class="hfacts rise"><li>${ICON.pin}<span>${esc(CLINIC.addr[l])}</span></li><li>${ICON.clock}<span>${esc(CLINIC.hours[l])}</span></li><li>${ICON.globe}<span>${esc(CLINIC.langs[l])}</span></li></ul>
</div>
<div class="hero-ph"><div class="ph" data-par="0.12"><img src="${IMG}/ph-reception.webp" width="1200" height="1500" alt="${t("Reception of Nek Dental Studio with the flower sign and a teal sofa", "Nek Dental Studio-ს რეცეფცია ყვავილის ნიშნით და ფირუზისფერი დივნით", "Ресепшен Nek Dental Studio: знак-цветок и бирюзовый диван")}" fetchpriority="high"></div>
<div class="hcard glass" data-par="-0.06">${MARK}<b>${t("Calm visit", "მშვიდი ვიზიტი", "Спокойный визит")}</b><span>${t("starts with the right environment", "სწორი გარემოდან იწყება", "начинается с правильной среды")}</span></div></div>
</div></section>`;
}

function velo(l) {
  const a = SERVICES.map((s) => s[l][0]);
  const row = (x, c) => `<div class="row${c}" aria-hidden="true">${[0, 1].map(() => x.map((s) => `<span>${MARK}${esc(s)}</span>`).join("")).join("")}</div>`;
  return `<div class="velo">${row(a, "")}</div>`;
}

function services(l, t) {
  return `<section class="sec" id="services"><div class="wrap">
<p class="kick rise"><i></i>${t("Services", "მომსახურება", "Услуги")}</p>
<h2 class="h2 rise">${t("What we <b>treat</b>", "რას <b>ვმკურნალობთ</b>", "Что мы <b>лечим</b>")}</h2>
<div class="svc">${SERVICES.map((s, i) => `<article class="sv ${MOTION[i % 4]}${s.post ? " sv-post" : ""}" style="transition-delay:${(i % 4) * 70}ms"><span class="sv-i">${ICON[s.icon]}</span><h3>${esc(s[l][0])}</h3><p>${esc(s[l][1])}</p>${s.price ? `<p class="sv-p">${gel(s.price)}<small>${t("price from the clinic's post, July 2026", "ფასი კლინიკის პოსტიდან, ივლისი 2026", "цена из поста клиники, июль 2026")}</small></p>` : ""}<button type="button" class="sv-b" data-book="${s.id}">${t("Book this", "ჩაწერა", "Записаться")}${ICON.arrow}</button></article>`).join("")}</div>
<p class="note rise">${t("The clinic does not publish other prices: the doctor names the cost after the examination.", "კლინიკა სხვა ფასებს არ აქვეყნებს: ექიმი ღირებულებას დათვალიერების შემდეგ გეტყვით.", "Других цен клиника не публикует: стоимость врач называет после осмотра.")}</p>
</div></section>`;
}

/* Слои реставрации: иллюстрация кодом, по их словам «форма, цвет, эстетика». */
function resto(l, t) {
  const st = [
    [t("Shape", "ფორმა", "Форма"), t("The doctor restores the anatomy of the tooth: its outline and edges.", "ექიმი აღადგენს კბილის ანატომიას: მის კონტურს და კიდეებს.", "Врач восстанавливает анатомию зуба: контур и края.")],
    [t("Dentin", "დენტინი", "Дентин"), t("The inner layer gives the tooth its warm depth of color.", "შიდა ფენა კბილს ფერის თბილ სიღრმეს აძლევს.", "Внутренний слой даёт зубу тёплую глубину цвета.")],
    [t("Enamel", "მინანქარი", "Эмаль"), t("The outer layer is matched to your teeth so the tooth looks natural.", "გარე ფენა თქვენს კბილებს ერგება, რომ კბილი ბუნებრივად გამოიყურებოდეს.", "Внешний слой подбирается под ваши зубы, чтобы зуб выглядел естественно.")],
    [t("Translucent edge", "გამჭვირვალე კიდე", "Прозрачный край"), t("The thin edge lets light through, like a real tooth.", "თხელი კიდე სინათლეს ატარებს, როგორც ნამდვილი კბილი.", "Тонкий край пропускает свет, как у живого зуба.")],
  ];
  return `<section class="sec dark" id="resto"><div class="wrap two">
<div><p class="kick rise"><i></i>${t("Artistic restoration", "მხატვრული რესტავრაცია", "Художественная реставрация")}</p>
<h2 class="h2 rise">${t("Shape, color and <b>natural aesthetics</b>", "ფორმა, ფერი და <b>ბუნებრივი ესთეტიკა</b>", "Форма, цвет и <b>естественная эстетика</b>")}</h2>
<p class="lead rise">${t("Move the slider: this is how a restored tooth is built, layer by layer.", "გადაწიეთ სლაიდერი: ასე იქმნება აღდგენილი კბილი, ფენა ფენა.", "Подвиньте ползунок: так слой за слоем собирается восстановленный зуб.")}</p>
<ol class="layers" id="layers">${st.map(([h, p], i) => `<li data-ly="${i}"${i === 0 ? ' class="on"' : ""}><b>${h}</b><span>${p}</span></li>`).join("")}</ol>
<label class="rng"><span class="vh">${t("Layer", "ფენა", "Слой")}</span><input type="range" id="lyr" min="0" max="3" step="1" value="0"></label>
<p class="mu small">${t("Illustration of the method, not a photo of a clinic case.", "მეთოდის ილუსტრაცია, არა კლინიკის შემთხვევის ფოტო.", "Иллюстрация метода, не фото работы клиники.")}</p></div>
<div class="tooth tilt" aria-hidden="true"><svg viewBox="0 0 200 260" id="tsvg">
<defs><linearGradient id="g-en" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf6ec"/><stop offset=".7" stop-color="#f1e6d3"/><stop offset="1" stop-color="#d9dbe8"/></linearGradient><linearGradient id="g-de" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9c58f"/><stop offset="1" stop-color="#d7a86c"/></linearGradient><linearGradient id="g-ed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd6ee" stop-opacity="0"/><stop offset="1" stop-color="#b9c4ec" stop-opacity=".9"/></linearGradient></defs>
<path class="l0" d="M72 26C90 18 110 18 128 26C140 60 152 130 156 200C157 222 146 236 128 238C110 240 90 240 72 238C54 236 43 222 44 200C48 130 60 60 72 26z" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6 6"/>
<path class="l1" d="M82 46C94 40 106 40 118 46C127 74 135 130 137 180C138 196 130 204 118 205C106 206 94 206 82 205C70 204 62 196 63 180C65 130 73 74 82 46z" fill="url(#g-de)"/>
<path class="l2" d="M72 26C90 18 110 18 128 26C140 60 152 130 156 200C157 222 146 236 128 238C110 240 90 240 72 238C54 236 43 222 44 200C48 130 60 60 72 26z" fill="url(#g-en)" opacity=".88"/>
<path class="l3" d="M48 196C70 206 130 206 152 196C155 204 156 210 155 214C152 228 142 236 128 238C110 240 90 240 72 238C58 236 48 228 45 214C44 210 45 204 48 196z" fill="url(#g-ed)"/>
</svg></div>
</div></section>`;
}

function care(l, t) {
  return `<section class="sec" id="care"><div class="wrap two">
<div class="ph-tall slide"><img src="${IMG}/ph-unit.webp" width="1200" height="1600" alt="${t("Dental unit with instruments and sterile tray", "სტომატოლოგიური დანადგარი ინსტრუმენტებით და სტერილური ლანგრით", "Стоматологическая установка с инструментами и стерильным лотком")}" loading="lazy"></div>
<div><p class="kick rise"><i></i>${t("Before the procedure", "პროცედურამდე", "До процедуры")}</p>
<h2 class="h2 rise">${t("Care for the patient <b>starts before the procedure</b>", "პაციენტზე ზრუნვა <b>პროცედურამდე იწყება</b>", "Забота о пациенте <b>начинается до процедуры</b>")}</h2>
<div class="care">${CARE.map((c, i) => `<div class="cr ${MOTION[(i + 1) % 4]}" style="transition-delay:${i * 90}ms"><i>0${i + 1}</i><b>${esc(c[l][0])}</b><p>${esc(c[l][1])}</p></div>`).join("")}</div></div>
</div></section>`;
}

function space(l, t) {
  const ph = [["reception", 1200, 1500, t("Reception and the flower sign", "რეცეფცია და ყვავილის ნიშანი", "Ресепшен и знак-цветок")], ["lounge", 1200, 1600, t("Lounge with paper flowers", "სივრცე ქაღალდის ყვავილებით", "Лаунж с бумажными цветами")], ["cabinet", 1200, 1600, t("Consultation in the treatment room", "კონსულტაცია კაბინეტში", "Консультация в кабинете")], ["unit", 1200, 1600, t("Treatment room", "სამკურნალო კაბინეტი", "Кабинет")]];
  return `<section class="sec soft" id="space"><div class="wrap">
<p class="kick rise"><i></i>${t("The clinic", "კლინიკა", "Клиника")}</p>
<h2 class="h2 rise">${t("A space where a visit <b>starts calmly</b>", "სივრცე, სადაც ვიზიტი <b>მშვიდად იწყება</b>", "Пространство, где визит <b>начинается спокойно</b>")}</h2>
<div class="gal">${ph.map(([f, w, h, a], i) => `<figure class="${MOTION[(i + 2) % 4]}" style="transition-delay:${i * 80}ms"><img src="${IMG}/ph-${f}.webp" width="${w}" height="${h}" alt="${a}" loading="lazy"><figcaption>${a}</figcaption></figure>`).join("")}</div>
<p class="mu small rise">${t("Photos: the clinic's Instagram.", "ფოტოები: კლინიკის Instagram.", "Фото: Instagram клиники.")}</p>
</div></section>`;
}

function team(l, t) {
  const ini = (n) => n.split(" ").map((x) => x[0]).join("");
  return `<section class="sec" id="team"><div class="wrap">
<p class="kick rise"><i></i>${t("Team", "გუნდი", "Команда")}</p>
<h2 class="h2 rise">${t("Doctors of <b>Nek Dental Studio</b>", "Nek Dental Studio-ს <b>ექიმები</b>", "Врачи <b>Nek Dental Studio</b>")}</h2>
<div class="team">${TEAM.map((p, i) => `<div class="tm pop" style="transition-delay:${(i % 5) * 60}ms"><span class="av" aria-hidden="true">${ini(p.en)}</span><b>${esc(l === "ka" ? p.ka : p.en)}</b><span>${esc(p.r[l])}</span></div>`).join("")}</div>
<p class="mu small rise">${t("Team list from an open clinic directory; photos are added by the clinic.", "გუნდის სია ღია კატალოგიდან; ფოტოებს კლინიკა დაამატებს.", "Состав из открытого каталога клиник; фото добавит клиника.")}</p>
</div></section>`;
}

function reviews(l, t) {
  return `<section class="sec dark" id="reviews"><div class="wrap">
<p class="kick rise"><i></i>${t("Reviews", "შეფასებები", "Отзывы")}</p>
<h2 class="h2 rise">${t("What patients <b>say</b>", "რას <b>ამბობენ</b> პაციენტები", "Что говорят <b>пациенты</b>")}</h2>
<div class="rv">${REVIEWS.map((r, i) => `<blockquote class="${MOTION[i % 4]}" style="transition-delay:${i * 90}ms"><span class="stars" aria-label="5/5">${ICON.star.repeat(5)}</span><p>${esc(r[l])}</p><footer>${esc(r.who)} · ${r.at} · 100doc.ge</footer></blockquote>`).join("")}</div>
${l === "en" ? "" : `<p class="mu small rise">${t("", "თარგმანი ორიგინალიდან ინგლისურად.", "Перевод с английского оригинала.")}</p>`}
</div></section>`;
}

function faq(l, t) {
  return `<section class="sec" id="faq"><div class="wrap narrow">
<p class="kick rise"><i></i>${t("Questions", "კითხვები", "Вопросы")}</p>
<h2 class="h2 rise">${t("Before <b>the first visit</b>", "<b>პირველ ვიზიტამდე</b>", "Перед <b>первым визитом</b>")}</h2>
<div class="faq">${FAQ.map((q, i) => `<div class="qa"><button type="button" aria-expanded="false" aria-controls="qa-${i}" id="qb-${i}"><span>${esc(q[l][0])}</span><i aria-hidden="true"></i></button><div class="qa-a" id="qa-${i}" role="region" aria-labelledby="qb-${i}"><div><p>${esc(q[l][1])}</p></div></div></div>`).join("")}</div>
</div></section>`;
}

function visit(l, t) {
  return `<section class="sec dark" id="visit"><div class="wrap two">
<div><p class="kick rise"><i></i>${t("How to find us", "როგორ მოგვძებნოთ", "Как нас найти")}</p>
<h2 class="h2 rise">${t("Vake, <b>65 Paliashvili</b>", "ვაკე, <b>ფალიაშვილის 65</b>", "Ваке, <b>Палиашвили, 65</b>")}</h2>
<div class="cinfo rise">
<a href="tel:${CLINIC.tel}">${ICON.phone}<span>${CLINIC.phone}</span></a>
<a href="${wa(t("Hello! I would like to book a visit.", "გამარჯობა! მინდა ვიზიტზე ჩაწერა.", "Здравствуйте! Хочу записаться на приём."))}" target="_blank" rel="noopener">${ICON.wa}<span>WhatsApp</span></a>
<a href="mailto:${CLINIC.mail}">${ICON.doc}<span>${CLINIC.mail}</span></a>
<p>${ICON.pin}<span>${esc(CLINIC.addr[l])}<small>${esc(CLINIC.hours[l])}</small></span></p>
</div>
<div class="hero-act rise"><a class="btn btn-a" href="${CLINIC.map}" target="_blank" rel="noopener">${ICON.pin}<span>${t("Route on the map", "მარშრუტი რუკაზე", "Маршрут на карте")}</span></a><button type="button" class="btn btn-l" data-book>${t("Book a visit", "ჩაწერა", "Записаться")}</button></div></div>
<div class="mapcard slide"><img src="${IMG}/ph-lounge.webp" width="1200" height="1600" alt="${t("Lounge of the clinic", "კლინიკის სივრცე", "Лаунж клиники")}" loading="lazy"><span class="glass">${MARK}<b>Nek Dental Studio</b><small>${esc(CLINIC.addr[l])}</small></span></div>
</div></section>`;
}

/* ── Допы: у каждого свой блок, тумблер конструктора его прячет. ─── */
function addonBlocks(l, t) {
  const tag = t("Add-on", "დამატება", "Доп");
  const sec = (id, inner, cls = "", add = id) => `<section class="sec add-block${cls}" id="${id}" data-addon="${add}" data-tag="${tag}">${inner}</section>`;
  const fly = sec("fly-ad", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Fly-through", "გადაფრენა", "Пролёт")}</p>
<h2 class="h2 rise">${t("From the door <b>to the restored tooth</b>", "კარიდან <b>აღდგენილ კბილამდე</b>", "От двери <b>до восстановленного зуба</b>")}</h2>
<p class="lead rise">${t("The first screen of the site: the camera flies into your flower sign, through the lounge into the treatment room, as the patient scrolls.", "საიტის პირველი ეკრანი: კამერა შედის თქვენს ყვავილის ნიშანში, სივრცეში და კაბინეტში, როცა პაციენტი გვერდს ჩამოაქვს.", "Первый экран сайта: камера влетает в ваш знак-цветок, через лаунж в кабинет, пока пациент листает.")}</p>
<div class="hero-act rise"><a class="btn btn-l" href="${href(l)}#fly">${t("Watch the fly-through", "გადაფრენის ნახვა", "Смотреть пролёт")}${ICON.arrow}</a></div></div>
<div class="ph-wide pop"><img src="${IMG}/k3-16.webp" width="1600" height="893" alt="${t("Frame of the fly-through: the lounge", "გადაფრენის კადრი: სივრცე", "Кадр пролёта: лаунж")}" loading="lazy"></div></div>`, " soft", "fly");
  const quiz = sec("quiz", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Smile quiz", "ღიმილის ქვიზი", "Квиз «Ваша улыбка»")}</p>
<h2 class="h2 rise">${t("Where to start, <b>in four answers</b>", "საიდან დავიწყოთ, <b>ოთხ პასუხში</b>", "С чего начать, <b>за четыре ответа</b>")}</h2>
<p class="lead rise">${t("At the end: the service to start with, and a booking with your answers to the administrator.", "ბოლოს: მომსახურება, რომლითაც დაიწყოთ, და ჩაწერა თქვენი პასუხებით ადმინისტრატორთან.", "В конце: услуга, с которой начать, и запись с ответами администратору.")}</p></div>
<div class="quiz pop" id="qz"></div></div>`);
  const abroad = sec("abroad", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("For visitors", "სტუმრებისთვის", "Для приезжих")}</p>
<h2 class="h2 rise">${t("Treatment <b>during your trip to Tbilisi</b>", "მკურნალობა <b>თბილისში მოგზაურობისას</b>", "Лечение <b>во время поездки в Тбилиси</b>")}</h2>
<p class="lead rise">${t("Choose the dates and the service: the administrator plans the visits around your trip, in your language.", "აირჩიეთ თარიღები და მომსახურება: ადმინისტრატორი ვიზიტებს თქვენს მოგზაურობაზე დაგეგმავს, თქვენს ენაზე.", "Выберите даты и услугу: администратор спланирует визиты под вашу поездку, на вашем языке.")}</p></div>
<form class="trip glass tilt" id="trip" novalidate>
<div class="tr2"><label class="fld"><span>${t("Arrive", "ჩამოსვლა", "Приезд")}</span><input type="date" id="tr-a" required></label><label class="fld"><span>${t("Leave", "გამგზავრება", "Отъезд")}</span><input type="date" id="tr-b" required></label></div>
<label class="fld"><span>${t("Country", "ქვეყანა", "Страна")}</span><input id="tr-c" autocomplete="country-name" placeholder="${t("e.g. Germany", "მაგ. გერმანია", "например, Германия")}"></label>
<label class="fld"><span>${t("Service", "მომსახურება", "Услуга")}</span><select id="tr-s">${SERVICES.map((s) => `<option value="${s.id}">${esc(s[l][0])}</option>`).join("")}</select></label>
<p class="trip-n" id="tr-n" aria-live="polite"></p>
<p class="mu small">${t("Demo: hotel nearby, Hotel [[t:1]], 6 min on foot.", "დემო: ახლომდებარე სასტუმრო, Hotel [[t:1]], 6 წუთი ფეხით.", "Демо: отель рядом, Hotel [[t:1]], 6 минут пешком.")}</p>
<button type="submit" class="btn btn-a">${ICON.wa}<span>${t("Send the dates", "თარიღების გაგზავნა", "Отправить даты")}</span></button>
</form></div>`, " soft");
  const remind = sec("remind", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Reminders", "შეხსენებები", "Напоминания")}</p>
<h2 class="h2 rise">${t("The patient <b>does not forget the visit</b>", "პაციენტს <b>ვიზიტი არ ავიწყდება</b>", "Пациент <b>не забывает о визите</b>")}</h2>
<p class="lead rise">${t("A day before and two hours before: time, doctor and the map link.", "ერთი დღით და ორი საათით ადრე: დრო, ექიმი და რუკის ბმული.", "За день и за два часа: время, врач и ссылка на карту.")}</p></div>
<div class="msg pop" aria-label="${t("Example of a reminder", "შეხსენების მაგალითი", "Пример напоминания")}"><p class="bt"><b>Nek Dental Studio</b>${t("Tomorrow at 12:30 you have a visit to Dr. Nino Martiashvili. 65 Paliashvili St.", "ხვალ 12:30-ზე ვიზიტი გაქვთ ექიმ ნინო მარტიაშვილთან. ფალიაშვილის 65.", "Завтра в 12:30 у вас визит к доктору Нино Мартиашвили. Палиашвили, 65.")} <u>maps.app.goo.gl</u><small>${t("demo", "დემო", "демо")} · 18:00</small></p><p class="me">${t("Thank you, I will come", "გმადლობთ, მოვალ", "Спасибо, приду")}<small>18:04</small></p></div></div>`);
  const greviews = sec("reviews-g", `<div class="wrap two"><div>
<p class="kick rise"><i></i>Google</p>
<h2 class="h2 rise">${t("Fresh reviews <b>from your Google card</b>", "ახალი შეფასებები <b>თქვენი Google ბარათიდან</b>", "Свежие отзывы <b>из вашей карточки Google</b>")}</h2>
<p class="lead rise">${t("They update on the site by themselves; after a visit the patient receives a request to leave a review.", "საიტზე თავად ახლდება; ვიზიტის შემდეგ პაციენტი იღებს თხოვნას, დატოვოს შეფასება.", "Обновляются на сайте сами; после визита пациенту приходит просьба оставить отзыв.")}</p></div>
<div class="gcard pop"><b>Nek Dental Studio · Google</b><span class="stars" aria-hidden="true">${ICON.star.repeat(5)}</span><p>${t("Rating and reviews appear here after the clinic connects its Google card.", "რეიტინგი და შეფასებები აქ გამოჩნდება, როცა კლინიკა Google ბარათს დააკავშირებს.", "Оценка и отзывы появятся здесь, когда клиника подключит карточку Google.")}</p><a class="btn btn-l btn-s" href="${CLINIC.map}" target="_blank" rel="noopener">${t("Open the card", "ბარათის გახსნა", "Открыть карточку")}</a></div></div>`, " soft", "reviews");
  const pages = sec("pages", `<div class="wrap">
<p class="kick rise"><i></i>${t("Search", "ძიება", "Поиск")}</p>
<h2 class="h2 rise">${t("A page for <b>each service</b>", "გვერდი <b>თითოეული მომსახურებისთვის</b>", "Страница <b>на каждую услугу</b>")}</h2>
<div class="pg">${SERVICES.slice(0, 5).map((s, i) => `<div class="${MOTION[i % 4]}" style="transition-delay:${i * 60}ms"><small>/${s.id}</small><b>${esc(s[l][0])} · ${t("Tbilisi", "თბილისი", "Тбилиси")}</b><span>EN · KA · RU</span></div>`).join("")}</div></div>`);
  const admin = sec("admin", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Clinic panel", "კლინიკის პანელი", "Панель клиники")}</p>
<h2 class="h2 rise">${t("Bookings <b>in one panel</b>", "ჩაწერები <b>ერთ პანელში</b>", "Записи <b>в одной панели</b>")}</h2>
<p class="lead rise">${t("A booking from the site arrives first in the list. The administrator confirms the time, and the patient sees it here in «My booking».", "საიტიდან ჩაწერა სიაში პირველი ჩნდება. ადმინისტრატორი ადასტურებს დროს და პაციენტი ამას აქვე, «ჩემ ჩაწერაში» ხედავს.", "Запись с сайта приходит первой строкой. Администратор подтверждает время, и пациент видит это здесь, в «Моей записи».")}</p>
<div class="hero-act rise"><a class="btn btn-a" href="${href(l, "panel")}">${ICON.panel}<span>${t("Open the panel", "პანელის გახსნა", "Открыть панель")}</span></a></div></div>
<div class="cards3">${[[t("Bookings", "ჩაწერები", "Записи"), t("from the site, quiz and chat", "საიტიდან, ქვიზიდან და ჩატიდან", "с сайта, квиза и чата")], [t("Schedule", "განრიგი", "Расписание"), t("by doctor, a week ahead", "ექიმების მიხედვით, კვირით წინ", "по врачам на неделю")], [t("Statuses", "სტატუსები", "Статусы"), t("the patient sees them on the site", "პაციენტი საიტზე ხედავს", "пациент видит на сайте")], [t("Roles and history", "როლები და ისტორია", "Роли и история"), t("the administrator does not see revenue", "ადმინისტრატორი შემოსავალს ვერ ხედავს", "администратор не видит выручку")]].map(([b, p]) => `<div class="fc pop"><b>${b}</b><p>${p}</p></div>`).join("")}</div></div>`, " soft");
  return { fly, quiz, abroad, remind, greviews, pages, admin };
}

function footer(l, t) {
  return `<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l)}<p>${esc(CLINIC.slogan[l])}</p><a class="ftel" href="tel:${CLINIC.tel}">${CLINIC.phone}</a></div>
<div><h4>${t("Services", "მომსახურება", "Услуги")}</h4>${SERVICES.slice(0, 5).map((s) => `<a href="#services">${esc(s[l][0])}</a>`).join("")}</div>
<div><h4>${t("Clinic", "კლინიკა", "Клиника")}</h4><a href="#team">${t("Team", "გუნდი", "Команда")}</a><a href="#faq">${t("Questions", "კითხვები", "Вопросы")}</a><a href="#visit">${t("Contacts", "კონტაქტი", "Контакты")}</a></div>
<div><h4>${t("Follow", "გამოგვყევით", "Мы в сетях")}</h4><a href="${CLINIC.ig}" target="_blank" rel="noopener">Instagram</a><a href="${CLINIC.fb}" target="_blank" rel="noopener">Facebook</a><a href="${CLINIC.tt}" target="_blank" rel="noopener">TikTok</a></div>
</div>
<div class="sm"><span>© 2026 Nek Dental Studio</span><span>${t("Mockup by DevUz Studio. By using the mockup you accept the", "DevUz Studio-ს მაკეტი. მაკეტის გამოყენებით თქვენ ეთანხმებით", "Макет DevUz Studio. Пользуясь макетом, вы принимаете")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("mockup terms", "მაკეტის პირობებს", "условия макета")}</a>.</span></div>
</div></footer>`;
}

function days(l) {
  const wd = { en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], ka: ["კვ", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"], ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] }[l];
  return wd;
}

function siteData(l, t) {
  return {
    l, wa: CLINIC.wa, tel: CLINIC.tel, panel: href(l, "panel"),
    svc: SERVICES.map((s) => ({ id: s.id, n: s[l][0] })),
    wd: days(l),
    faq: FAQ.map((q) => q[l]),
    t: {
      book: t("Book a visit", "ვიზიტზე ჩაწერა", "Запись на приём"), svc: t("Service", "მომსახურება", "Услуга"), day: t("Day", "დღე", "День"), time: t("Time", "დრო", "Время"),
      name: t("Your name", "თქვენი სახელი", "Ваше имя"), phone: t("Phone", "ტელეფონი", "Телефон"), send: t("Send to WhatsApp", "WhatsApp-ში გაგზავნა", "Отправить в WhatsApp"),
      need: t("Choose a day and time, write your name and phone", "აირჩიეთ დღე და დრო, ჩაწერეთ სახელი და ტელეფონი", "Выберите день и время, напишите имя и телефон"),
      sent: t("Booking is in the clinic panel. Opening WhatsApp", "ჩაწერა კლინიკის პანელშია. იხსნება WhatsApp", "Запись в панели клиники. Открываем WhatsApp"),
      hello: t("Hello! I would like to book", "გამარჯობა! მინდა ჩაწერა", "Здравствуйте! Хочу записаться"), at: t("on", "", "на"),
      mine: t("My booking", "ჩემი ჩაწერა", "Моя запись"), none: t("You have no booking yet.", "ჯერ ჩაწერა არ გაქვთ.", "Записи пока нет."), hint: t("This is a mockup: the administrator changes the status in the panel, and you see it here.", "ეს მაკეტია: ადმინისტრატორი სტატუსს პანელში ცვლის და თქვენ აქ ხედავთ.", "Это макет: администратор меняет статус в панели, а вы видите его здесь."),
      openPanel: t("Open the panel", "პანელის გახსნა", "Открыть панель"),
      st: { new: t("Sent, waiting for confirmation", "გაგზავნილია, ელოდება დადასტურებას", "Отправлена, ждёт подтверждения"), ok: t("Confirmed", "დადასტურებულია", "Подтверждена"), came: t("Visit done", "ვიზიტი შედგა", "Визит состоялся"), no: t("Cancelled", "გაუქმებულია", "Отменена") },
      close: t("Close", "დახურვა", "Закрыть"),
      trip: t("Hello! I am coming to Tbilisi", "გამარჯობა! თბილისში ჩამოვდივარ", "Здравствуйте! Приезжаю в Тбилиси"), tripDays: t("days in Tbilisi", "დღე თბილისში", "дней в Тбилиси"), tripNeed: t("Choose the dates", "აირჩიეთ თარიღები", "Выберите даты"),
      quiz: {
        q: [t("What bothers you most?", "რა გაწუხებთ ყველაზე მეტად?", "Что беспокоит больше всего?"), t("Which teeth?", "რომელი კბილები?", "Какие зубы?"), t("How soon?", "რამდენად სასწრაფოდ?", "Как скоро?"), t("Which language is easier for you?", "რომელი ენა გირჩევნიათ?", "На каком языке удобнее?")],
        a: [
          [[t("Shape or color of a tooth", "კბილის ფორმა ან ფერი", "Форма или цвет зуба"), "resto"], [t("Crooked teeth or bite", "მრუდე კბილები ან თანკბილვა", "Неровные зубы или прикус"), "ortho"], [t("Teeth are not white enough", "კბილები არ არის საკმარისად თეთრი", "Зубы недостаточно белые"), "white"], [t("A missing tooth", "დაკარგული კბილი", "Нет зуба"), "implant"]],
          [[t("Front teeth", "წინა კბილები", "Передние"), ""], [t("Back teeth", "უკანა კბილები", "Жевательные"), ""], [t("Many teeth", "ბევრი კბილი", "Много зубов"), ""]],
          [[t("It hurts, as soon as possible", "მტკივა, რაც შეიძლება მალე", "Болит, как можно скорее"), ""], [t("Within a month", "ერთ თვეში", "В течение месяца"), ""], [t("Just planning", "უბრალოდ ვგეგმავ", "Пока планирую"), ""]],
          [[t("English", "ინგლისური", "Английский"), ""], [t("Georgian", "ქართული", "Грузинский"), ""], [t("Russian", "რუსული", "Русский"), ""]],
        ],
        res: t("Start with", "დაიწყეთ", "Начните с"), go: t("Book with these answers", "ჩაწერა ამ პასუხებით", "Записаться с этими ответами"), again: t("Again", "თავიდან", "Ещё раз"), of: "/",
        pain: t("If it hurts, call: the administrator will find the nearest time.", "თუ გტკივათ, დარეკეთ: ადმინისტრატორი უახლოეს დროს მოგიძებნით.", "Если болит, позвоните: администратор найдёт ближайшее время."),
      },
      chat: {
        title: "Nek Dental Studio", sub: t("Answers from the clinic's questions · demo", "პასუხები კლინიკის კითხვებიდან · დემო", "Ответы из вопросов клиники · демо"),
        hi: t("Hello! Ask about the services, the address or the hours. To book, tap «Book a visit».", "გამარჯობა! იკითხეთ მომსახურებაზე, მისამართზე ან საათებზე. ჩასაწერად დააჭირეთ «ჩაწერას».", "Здравствуйте! Спросите об услугах, адресе или часах работы. Чтобы записаться, нажмите «Записаться»."),
        miss: t("I will pass the question to the administrator: they answer during working hours, Monday to Saturday 11:00-19:00.", "კითხვას ადმინისტრატორს გადავცემ: ის სამუშაო საათებში პასუხობს, ორშაბათი-შაბათი 11:00-19:00.", "Передам вопрос администратору: он отвечает в рабочее время, понедельник-суббота 11:00-19:00."),
        ph: t("Your question", "თქვენი კითხვა", "Ваш вопрос"), send: t("Send", "გაგზავნა", "Отправить"), open: t("Chat", "ჩატი", "Чат"),
      },
    },
  };
}

function sitePage(l) {
  const t = T(l);
  const A = addonBlocks(l, t);
  const title = t("Nek Dental Studio · dentistry in Vake, Tbilisi", "Nek Dental Studio · სტომატოლოგია ვაკეში, თბილისი", "Nek Dental Studio · стоматология в Ваке, Тбилиси");
  const desc = t("Artistic restoration, braces, whitening, implants and prosthetics. 65 Paliashvili St., Monday to Saturday 11:00-19:00. Booking in two taps.", "მხატვრული რესტავრაცია, ბრეკეტები, გათეთრება, იმპლანტები და ორთოპედია. ფალიაშვილის 65, ორშაბათი-შაბათი 11:00-19:00.", "Художественная реставрация, брекеты, отбеливание, импланты и протезирование. Палиашвили, 65, пн-сб 11:00-19:00. Запись в два нажатия.");
  return `${head(l, title, desc)}
<style>${CSS}</style>
</head>
<body>
<a class="vh" href="#services">${t("To services", "მომსახურებაზე გადასვლა", "К услугам")}</a>
${header(l, t)}
<main>
${hero(l, t)}
${velo(l)}
${services(l, t)}
${resto(l, t)}
${A.fly}
${care(l, t)}
${A.quiz}
${space(l, t)}
${team(l, t)}
${reviews(l, t)}
${A.greviews}
${A.abroad}
${A.remind}
${A.pages}
${A.admin}
${faq(l, t)}
${visit(l, t)}
</main>
${footer(l, t)}
<a class="cfgb glass" href="${href(l)}#offer">${t("Price builder", "ფასის კონსტრუქტორი", "Конструктор")}</a>
<button type="button" class="chatb" id="chatb" data-addon="chat" aria-controls="chat" aria-expanded="false">${ICON.chat}<span>${t("Chat", "ჩატი", "Чат")}</span></button>
<div class="chat glass" id="chat" role="dialog" aria-label="${t("Chat with the clinic", "ჩატი კლინიკასთან", "Чат с клиникой")}" hidden><div class="ch-h">${MARK}<div><b>Nek Dental Studio</b><small id="ch-sub"></small></div><button type="button" class="x" id="chx" aria-label="${t("Close", "დახურვა", "Закрыть")}">${ICON.close}</button></div><div class="ch-b" id="chb" aria-live="polite"></div><form class="ch-f" id="chf"><label class="vh" for="chi">${t("Your question", "თქვენი კითხვა", "Ваш вопрос")}</label><input id="chi" autocomplete="off"><button type="submit" class="btn btn-a btn-s">${ICON.arrow}<span class="vh">${t("Send", "გაგზავნა", "Отправить")}</span></button></form></div>
<div class="dock glass" id="dock"><button type="button" class="btn btn-a" data-book>${ICON.cal}<span>${t("Book", "ჩაწერა", "Записаться")}</span></button><a class="btn btn-l" href="tel:${CLINIC.tel}">${ICON.phone}<span>${t("Call", "დარეკვა", "Звонок")}</span></a></div>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="shh"><div class="sh-bg" data-close></div><div class="box"><div class="bh"><b id="shh"></b><button type="button" class="x" data-close aria-label="${t("Close", "დახურვა", "Закрыть")}">${ICON.close}</button></div><div class="bb" id="shb"></div></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="nk-data">${json(siteData(l, t))}</script>
<script>
${JS}</script>
</body>
</html>`;
}

/* ── Первая страница: пролёт, выбор, конструктор DevUz ─────────────── */
function offer(l, t) {
  return `<section class="sec offer" id="offer"><div class="wrap">
<p class="kick"><i></i>${t("DevUz Studio offer", "DevUz Studio-ს შეთავაზება", "Предложение DevUz Studio")}</p>
<h2 class="h2">${t("A website <b>from this mockup</b>", "საიტი <b>ამ მაკეტით</b>", "Сайт <b>по этому макету</b>")}</h2>
<p class="lead">${t(`For 48 hours from the first opening of the mockup: the website for ${usd(BASE.promo)} instead of ${usd(BASE.price)}. Add-ons switch on with a toggle, and their block on the site appears or disappears right away.`, `მაკეტის პირველი გახსნიდან 48 საათის განმავლობაში: საიტი ${usd(BASE.promo)} ნაცვლად ${usd(BASE.price)}-ისა. დამატებები ჩართვით ირთვება და მათი ბლოკი საიტზე მაშინვე ჩნდება ან ქრება.`, `48 часов с первого открытия макета: сайт ${usd(BASE.promo)} вместо ${usd(BASE.price)}. Допы включаются тумблером, и их блок на сайте тут же появляется или пропадает.`)}</p>
<div class="cst"><div>
<div class="base"><div class="hd"><b>${esc(BASE[l].t)}</b><span class="pp"><s>${usd(BASE.price)}</s>${usd(BASE.promo)}</span></div><p>${esc(BASE[l].d)}</p></div>
<div class="adds">${ADDONS.map((a) => `<label class="add"><input type="checkbox" data-add="${a.id}" checked><span class="sw" aria-hidden="true"></span><span><b>${esc(a[l].t)}</b>${a.star ? `<span class="star">${t("clinics take it first", "კლინიკები პირველს იღებენ", "клиники берут первым")}</span>` : ""}<p>${esc(a[l].e)}</p><small>${esc(a[l].who)}</small></span><span class="ap">${usd(a.price)}</span></label>`).join("")}</div>
</div>
<aside class="sum glass" aria-live="polite">
<div class="row"><span>${t("Website", "საიტი", "Сайт")}</span><span>${usd(BASE.promo)}</span></div>
<div class="row"><span>${t("Add-ons", "დამატებები", "Допы")} <span id="addn"></span></span><span id="adds">0 $</span></div>
<div class="tot"><span>${t("Total", "სულ", "Итого")}</span><b id="total">${usd(ALL)}</b></div>
<p class="mu small">${t("The website price holds:", "საიტის ფასი მოქმედებს:", "Цена сайта держится:")}</p>
<div class="timer" id="timer"><span><b id="th">48</b><small>${t("hours", "სთ", "часов")}</small></span><span><b id="tm">00</b><small>${t("min", "წთ", "минут")}</small></span><span><b id="ts">00</b><small>${t("sec", "წმ", "секунд")}</small></span></div>
<div class="ctrl"><button type="button" class="btn btn-l btn-s" id="allon">${t("Everything in the mockup", "ყველაფერი მაკეტიდან", "Всё из макета")}</button><button type="button" class="btn btn-l btn-s" id="alloff">${t("Website only", "მხოლოდ საიტი", "Только сайт")}</button></div>
<button type="button" class="btn btn-l" id="copy">${ICON.copy}<span>${t("Copy the list", "სიის კოპირება", "Скопировать состав")}</span></button>
<a class="btn btn-a" href="${DEVUZ}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Discuss with DevUz Studio", "DevUz Studio-სთან განხილვა", "Обсудить с DevUz Studio")}</span></a>
</aside></div>
</div></section>`;
}

function landPage(l) {
  const t = T(l);
  const site = [
    t("Your words: restoration, braces, whitening and five more services", "თქვენი სიტყვები: რესტავრაცია, ბრეკეტები, გათეთრება და კიდევ ხუთი მომსახურება", "Ваши слова: реставрация, брекеты, отбеливание и ещё пять услуг"),
    t("Layers of a restored tooth, moved by a slider", "აღდგენილი კბილის ფენები სლაიდერით", "Слои восстановленного зуба ползунком"),
    t("Your space in photos, the team, reviews and questions", "თქვენი სივრცე ფოტოებში, გუნდი, შეფასებები და კითხვები", "Ваше пространство на фото, команда, отзывы и вопросы"),
    t("Booking in two taps to WhatsApp, a call from the dock", "ჩაწერა ორ შეხებაში WhatsApp-ში, ზარი ქვედა პანელიდან", "Запись в два нажатия в WhatsApp, звонок с нижней панели"),
    t("English, Georgian and Russian", "ინგლისური, ქართული და რუსული", "Английский, грузинский и русский"),
  ];
  const pan = [
    t("A booking from the site first in the list, the status seen by the patient", "საიტიდან ჩაწერა სიაში პირველი, სტატუსს პაციენტი ხედავს", "Запись с сайта первой строкой, статус видит пациент"),
    t("Schedule by doctor for the week", "განრიგი ექიმების მიხედვით კვირაზე", "Расписание по врачам на неделю"),
    t("Bookings against last week, where patients came from", "ჩაწერები წინა კვირასთან, საიდან მოვიდნენ პაციენტები", "Записи к прошлой неделе, откуда пришли пациенты"),
    t("Roles: the administrator does not see revenue, history of actions", "როლები: ადმინისტრატორი შემოსავალს ვერ ხედავს, ქმედებების ისტორია", "Роли: администратор не видит выручку, история действий"),
  ];
  const li = (a) => `<ul class="feat">${a.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>`;
  const steps = [
    t("Open the site and tap «Book a visit»: choose a day and time.", "გახსენით საიტი და დააჭირეთ «ვიზიტზე ჩაწერას»: აირჩიეთ დღე და დრო.", "Откройте сайт и нажмите «Записаться на приём»: выберите день и время."),
    t("Send it: WhatsApp opens with the text, and the booking lands in the panel.", "გაგზავნეთ: იხსნება WhatsApp ტექსტით და ჩაწერა პანელში ჩნდება.", "Отправьте: откроется WhatsApp с текстом, а запись ляжет в панель."),
    t("Open the panel and confirm: the site shows it in «My booking».", "გახსენით პანელი და დაადასტურეთ: საიტი ამას «ჩემ ჩაწერაში» აჩვენებს.", "Откройте панель и подтвердите: сайт покажет это в «Моей записи»."),
  ];
  const ch = CHAPTERS.map((c) => ({ at: c.at }));
  const ld = { base: BASE.promo, root: BASE_URL, hours: OFFER_HOURS, img: IMG, n: MEDIA.n, vn: MEDIA.vn, fps: MEDIA.fps, ch, add: ADDONS.map((a) => ({ id: a.id, p: a.price, t: a[l].t })), t: { copied: t("List copied", "სია დაკოპირდა", "Состав скопирован"), tot: t("Total", "სულ", "Итого") } };
  const pic = (k, alt, lazy = true) => `<picture><source media="(max-width: 899px)" srcset="${IMG}/k${k}-9.webp"><img src="${IMG}/k${k}-16.webp" width="1600" height="893" alt="${alt}"${lazy ? ' loading="lazy"' : ""}></picture>`;
  const alts = [t("Reception with the flower sign", "რეცეფცია ყვავილის ნიშნით", "Ресепшен со знаком-цветком"), t("The flower sign up close", "ყვავილის ნიშანი ახლოდან", "Знак-цветок крупно"), t("Lounge with teal armchairs", "სივრცე ფირუზისფერი სავარძლებით", "Лаунж с бирюзовыми креслами"), t("Treatment room with a purple chair", "კაბინეტი იისფერი სავარძლით", "Кабинет с фиолетовым креслом"), t("Illustration: a restored front tooth", "ილუსტრაცია: აღდგენილი წინა კბილი", "Иллюстрация: восстановленный передний зуб")];
  return `${head(l, t("Nek Dental Studio · website and panel mockup · DevUz Studio", "Nek Dental Studio · საიტისა და პანელის მაკეტი · DevUz Studio", "Nek Dental Studio · макет сайта и панели · DevUz Studio"), t("Mockup for Nek Dental Studio: a website in three languages with a fly-through and booking, and a clinic panel. Price builder.", "მაკეტი Nek Dental Studio-სთვის: საიტი სამ ენაზე გადაფრენით და ჩაწერით და კლინიკის პანელი.", "Макет для Nek Dental Studio: сайт на трёх языках с пролётом и записью и панель клиники. Конструктор цены."))}
<link rel="preload" as="image" href="${IMG}/poster-9.webp" media="(max-width: 899px)">
<link rel="preload" as="image" href="${IMG}/poster-16.webp" media="(min-width: 900px)">
<style>${CSS}</style>
</head>
<body class="land">
${dzIntroSolo(l)}
<header class="top on-dark"><div class="top-in glass">
${LOGO(l, "")}
<nav class="nav" aria-label="${t("Sections", "განყოფილებები", "Разделы")}"><a href="#choose">${t("What to see", "რა ვნახოთ", "Что посмотреть")}</a><a href="#try">${t("How to check", "როგორ შევამოწმოთ", "Как проверить")}</a><a href="#offer">${t("Price", "ფასი", "Стоимость")}</a></nav>
${langLinks(l, "")}
<a class="btn btn-l btn-s" href="${href(l, "site")}">${t("Website", "საიტი", "Сайт")}</a>
<a class="btn btn-a btn-s" aria-label="${t("Clinic panel", "კლინიკის პანელი", "Панель клиники")}" href="${href(l, "panel")}">${ICON.panel}<span class="hide-s">${t("Panel", "პანელი", "Панель")}</span></a>
</div></header>
<main>
<section class="hs" id="fly" aria-label="${t("Fly-through Nek Dental Studio", "გადაფრენა Nek Dental Studio-ში", "Пролёт по Nek Dental Studio")}"><div class="hs-st">
<picture><source media="(max-width: 899px)" srcset="${IMG}/poster-9.webp"><img class="hs-a" src="${IMG}/poster-16.webp" width="1920" height="1080" alt="${alts[0]}" fetchpriority="high"></picture>
<canvas aria-hidden="true"></canvas>
<video muted playsinline preload="none" disablepictureinpicture aria-hidden="true"></video>
<div class="hs-shade" aria-hidden="true"></div>
<div class="hs-ch">${CHAPTERS.map((c, i) => `<div class="cp${i === 0 ? " first" : ""}" data-cp="${i}"><span class="kick"><i></i>${i === 0 ? t("DevUz Studio mockup", "DevUz Studio-ს მაკეტი", "Макет DevUz Studio") : `0${i + 1} / 05`}</span>${i === 0 ? `<h1>${words(esc(c[l][0]) + " <em>" + esc(c[l][1]) + "</em>")}</h1>` : `<p class="cp-h">${esc(c[l][0])} <em>${esc(c[l][1])}</em></p>`}</div>`).join("")}</div>
<div class="hs-end"><a class="btn btn-a" href="#choose">${t("See the mockup", "მაკეტის ნახვა", "Смотреть макет")}${ICON.arrow}</a><small>${t("Frames drawn from your photos; the tooth is an illustration.", "კადრები თქვენი ფოტოებით; კბილი ილუსტრაციაა.", "Кадры по вашим фото; зуб: иллюстрация.")}</small></div>
<div class="hs-load" id="hs-load" aria-hidden="true"><span id="hs-n">0</span>%<i id="hs-b"></i></div>
<div class="hs-hint" aria-hidden="true"><span>${t("Scroll", "ჩამოსქროლეთ", "Листайте")}</span><i></i></div>
</div></section>
<section class="calm" aria-label="${t("Key frames of the fly-through", "გადაფრენის მთავარი კადრები", "Ключевые кадры пролёта")}"><div class="wrap">${CHAPTERS.map((c, i) => `<figure>${pic(i + 1, alts[i], i > 0)}<figcaption>${esc(c[l][0])} ${esc(c[l][1])}</figcaption></figure>`).join("")}</div></section>
<section class="sec" id="choose"><div class="wrap">
<p class="kick rise"><i></i>${t("Website and panel on your data", "საიტი და პანელი თქვენს მონაცემებზე", "Сайт и панель на ваших данных")}</p>
<h2 class="h2 rise">${t("What to see <b>first</b>", "რა ვნახოთ <b>ჯერ</b>", "Что посмотреть <b>первым</b>")}</h2>
<p class="lead rise">${t("A working mockup on your services, words, photos and contacts from Instagram and Facebook. The website as a patient sees it, or the panel where the administrator keeps the bookings.", "მოქმედი მაკეტი თქვენს მომსახურებაზე, სიტყვებზე, ფოტოებზე და კონტაქტებზე Instagram-იდან და Facebook-იდან. საიტი, როგორც მას პაციენტი ხედავს, ან პანელი, სადაც ადმინისტრატორი ჩაწერებს მართავს.", "Работающий макет на ваших услугах, словах, фото и контактах из Instagram и Facebook. Сайт, каким его видит пациент, или панель, где администратор ведёт записи.")}</p>
<div class="choices">
<a class="choice rise" href="${href(l, "site")}"><span class="ch-k">${t("For your patients", "თქვენი პაციენტებისთვის", "Для ваших пациентов")}</span><b>${t("Website", "საიტი", "Сайт")}</b>
<span class="ch-pic"><img src="${IMG}/ph-reception.webp" width="1200" height="1500" alt="${alts[0]}" loading="lazy"></span>
${li(site)}<span class="btn btn-l">${t("Open the website", "საიტის გახსნა", "Открыть сайт")}${ICON.arrow}</span></a>
<a class="choice rise" href="${href(l, "panel")}"><span class="ch-k">${t("For you and the team", "თქვენთვის და გუნდისთვის", "Для вас и команды")}</span><b>${t("Clinic panel", "კლინიკის პანელი", "Панель клиники")}</b>
<span class="ch-pic"><span class="browser"><span class="bh"><i></i><i></i><i></i></span><span class="bb"><span class="kpi"><small>${t("Bookings, week · demo", "ჩაწერები, კვირა · დემო", "Записи, неделя · демо")}</small><b>38</b></span><span class="kpi"><small>${t("From the site", "საიტიდან", "С сайта")}</small><b>12</b></span><span class="kpi wide"><small>${t("Bookings by day · demo", "ჩაწერები დღეების მიხედვით · დემო", "Записи по дням · демо")}</small><span class="spark" id="lspark"></span></span></span></span></span>
${li(pan)}<span class="btn btn-a">${t("Open the panel", "პანელის გახსნა", "Открыть панель")}${ICON.arrow}</span></a>
</div>
</div></section>
<section class="sec soft" id="try"><div class="wrap">
<p class="kick rise"><i></i>${t("How to check in a minute", "როგორ შევამოწმოთ ერთ წუთში", "Как проверить за минуту")}</p>
<h2 class="h2 rise">${t("The website and the panel <b>are connected</b>", "საიტი და პანელი <b>დაკავშირებულია</b>", "Сайт и панель <b>связаны</b>")}</h2>
<ol class="ol">${steps.map((s) => `<li class="rise">${s}</li>`).join("")}</ol>
<div class="hero-act rise"><a class="btn btn-a" href="${href(l, "site")}#services">${t("Start with booking", "დაიწყეთ ჩაწერით", "Начать с записи")}${ICON.arrow}</a></div>
</div></section>
${offer(l, t)}
</main>
<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l, "")}<p>${t("Services, words, photos and contacts: the clinic's Instagram, Facebook and directories. Bookings and numbers in the panel: demo. Fly-through frames: Higgsfield, from your photos.", "მომსახურება, სიტყვები, ფოტოები და კონტაქტები: კლინიკის Instagram, Facebook და ცნობარები. ჩაწერები და ციფრები პანელში: დემო. გადაფრენის კადრები: Higgsfield, თქვენი ფოტოებით.", "Услуги, слова, фото и контакты: Instagram, Facebook и справочники клиники. Записи и цифры в панели: демо. Кадры пролёта: Higgsfield, по вашим фото.")}</p></div>
<div><h4>${t("Mockup", "მაკეტი", "Макет")}</h4><a href="${href(l, "site")}">${t("Website", "საიტი", "Сайт")}</a><a href="${href(l, "panel")}">${t("Panel", "პანელი", "Панель")}</a><a href="#offer">${t("Price", "ფასი", "Стоимость")}</a></div>
<div><h4>DevUz Studio</h4><a href="https://devuz.studio" target="_blank" rel="noopener">devuz.studio</a><a href="${DEVUZ}" target="_blank" rel="noopener">Telegram</a></div>
<div><h4>Nek Dental Studio</h4><a href="tel:${CLINIC.tel}">${CLINIC.phone}</a><a href="${CLINIC.ig}" target="_blank" rel="noopener">Instagram</a></div>
</div>
<div class="sm"><span>${t("Mockup by DevUz Studio. By using the mockup you accept the", "DevUz Studio-ს მაკეტი. მაკეტის გამოყენებით თქვენ ეთანხმებით", "Макет DevUz Studio. Пользуясь макетом, вы принимаете")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("mockup terms", "მაკეტის პირობებს", "условия макета")}</a>.</span></div>
</div></footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="nk-land">${json(ld)}</script>
<script>
${LAND_JS}</script>
</body>
</html>`;
}

/* ── Панель (эталон Greenwell, связка с сайтом как у «Сияния Севера») ── */
function panelPage(l) {
  const t = T(l);
  const ui = {
    title: t("Clinic panel", "კლინიკის პანელი", "Панель клиники"), demo: t("demo data", "დემო მონაცემები", "демо-данные"),
    tab_sum: t("Summary", "მიმოხილვა", "Сводка"), tab_req: t("Bookings", "ჩაწერები", "Записи"), tab_cal: t("Schedule", "განრიგი", "Расписание"), tab_log: t("History", "ისტორია", "История"),
    role: t("Role", "როლი", "Роль"), r_doc: t("Head doctor", "მთავარი ექიმი", "Главный врач"), r_adm: t("Administrator", "ადმინისტრატორი", "Администратор"),
    week: t("Bookings this week", "ჩაწერები ამ კვირაში", "Записи за неделю"), vs: t("to last week", "წინა კვირასთან", "к прошлой неделе"), site: t("From the site", "საიტიდან", "С сайта"),
    rev: t("Revenue, week", "შემოსავალი, კვირა", "Выручка, неделя"), revHide: t("visible to the head doctor", "ჩანს მთავარ ექიმთან", "видит главный врач"),
    came: t("Visits done", "შემდგარი ვიზიტები", "Визиты состоялись"), src: t("Where patients come from", "საიდან მოდიან პაციენტები", "Откуда пациенты"), days14: t("Bookings, 14 days", "ჩაწერები, 14 დღე", "Записи за 14 дней"),
    s_site: t("Site booking", "საიტზე ჩაწერა", "Запись на сайте"), s_ig: "Instagram", s_call: t("Call", "ზარი", "Звонок"), s_quiz: t("Quiz", "ქვიზი", "Квиз"), s_trip: t("Visitors", "სტუმრები", "Приезжие"),
    today: t("Today", "დღეს", "Сегодня"), attn: t("Needs attention", "საჭიროებს ყურადღებას", "Требует внимания"), attn1: t("bookings wait for confirmation", "ჩაწერა ელოდება დადასტურებას", "записей ждут подтверждения"),
    fresh: t("from the site, just now", "საიტიდან, ახლახან", "с сайта, только что"), who: t("Patient", "პაციენტი", "Пациент"), what: t("Service", "მომსახურება", "Услуга"), when: t("When", "როდის", "Когда"), stt: t("Status", "სტატუსი", "Статус"),
    st_new: t("New", "ახალი", "Новая"), st_ok: t("Confirmed", "დადასტურდა", "Подтверждена"), st_came: t("Came", "მოვიდა", "Пришёл"), st_no: t("Cancelled", "გაუქმდა", "Отменена"),
    a_ok: t("Confirm", "დადასტურება", "Подтвердить"), a_came: t("Came to the visit", "ვიზიტზე მოვიდა", "Пришёл на приём"), a_no: t("Cancel", "გაუქმება", "Отменить"),
    note_ok: t("confirmed the booking", "დაადასტურა ჩაწერა", "подтвердил запись"), note_came: t("marked the visit", "მონიშნა ვიზიტი", "отметил визит"), note_no: t("cancelled the booking", "გააუქმა ჩაწერა", "отменил запись"),
    empty: t("No bookings from the site yet. Book on the site, and it appears here.", "საიტიდან ჯერ ჩაწერა არ არის. ჩაეწერეთ საიტზე და აქ გამოჩნდება.", "С сайта записей пока нет. Запишитесь на сайте, и запись появится здесь."),
    openSite: t("Open the website", "საიტის გახსნა", "Открыть сайт"), back: t("Mockup", "მაკეტი", "Макет"), doctor: t("Doctor", "ექიმი", "Врач"), free: t("free", "თავისუფალი", "свободно"),
    phone: t("Phone", "ტელეფონი", "Телефон"), from: t("Source", "წყარო", "Источник"), hist: t("History", "ისტორია", "История"), reset: t("Clear demo", "დემოს გასუფთავება", "Сбросить демо"),
    /* Сообщения: все каналы одним окном, как в рабочей админке «Сияния Севера». */
    tab_msg: t("Messages", "შეტყობინებები", "Сообщения"), tab_con: t("Connections", "კავშირები", "Подключения"), lang: t("Language", "ენა", "Язык"),
    ch_site: t("Site chat", "საიტის ჩატი", "Чат сайта"), m_ph: t("Reply to the patient", "უპასუხეთ პაციენტს", "Ответ пациенту"), m_send: t("Send", "გაგზავნა", "Отправить"),
    m_book: t("Book a visit", "ვიზიტზე ჩაწერა", "Записать на приём"), m_booked: t("The booking is in «Bookings»", "ჩაწერა «ჩაწერებშია»", "Запись добавлена в «Записи»"),
    m_demo: t("In the mockup the reply stays here. In the working panel it goes to the same channel.", "მაკეტში პასუხი აქ რჩება. სამუშაო პანელში ის იმავე არხში მიდის.", "В макете ответ остаётся здесь. В рабочей панели он уходит в тот же канал."),
    m_nowz: t("Wazzup is not connected: connect it in «Connections», and replies go to WhatsApp, Instagram, Telegram and Viber.", "Wazzup არ არის დაკავშირებული: დააკავშირეთ «კავშირებში» და პასუხები წავა WhatsApp-ში, Instagram-ში, Telegram-ში და Viber-ში.", "Wazzup не подключён: подключите его в «Подключениях», и ответы пойдут в WhatsApp, Instagram, Telegram и Viber."),
    m_pick: t("Choose a conversation on the left.", "აირჩიეთ საუბარი მარცხნივ.", "Выберите переписку слева."), m_back: t("All conversations", "ყველა საუბარი", "Все переписки"),
    m_site0: t("Write in the chat on the site, and the conversation appears here.", "მისწერეთ საიტის ჩატში და საუბარი აქ გამოჩნდება.", "Напишите в чат на сайте, и переписка появится здесь."),
    m_bot: t("bot", "ბოტი", "бот"), m_wait: t("messages wait for a reply", "შეტყობინება ელოდება პასუხს", "сообщений ждут ответа"), m_visitor: t("Site visitor", "საიტის სტუმარი", "Гость сайта"),
    note_msg: t("replied in", "უპასუხა", "ответил в"), note_book: t("booked from the conversation", "ჩაწერა საუბრიდან", "записал из переписки"),
    /* Подключения: ключи вводит главный врач, в макете они никуда не уходят. */
    c_sub: t("Paste a key once, then everything works by itself. The head doctor changes connections.", "ჩასვით გასაღები ერთხელ, შემდეგ ყველაფერი თავად მუშაობს. კავშირებს მთავარი ექიმი ცვლის.", "Вставьте ключ один раз, дальше всё работает само. Подключения меняет главный врач."),
    c_demo: t("In the mockup the key stays in this browser and goes nowhere.", "მაკეტში გასაღები ამ ბრაუზერში რჩება და არსად მიდის.", "В макете ключ остаётся в этом браузере и никуда не уходит."),
    c_ro: t("Connections are changed by the head doctor. You see what is connected.", "კავშირებს მთავარი ექიმი ცვლის. თქვენ ხედავთ, რა არის დაკავშირებული.", "Подключения меняет главный врач. Вы видите, что подключено."),
    c_wz_t: t("Wazzup: WhatsApp, Instagram, Telegram, Viber", "Wazzup: WhatsApp, Instagram, Telegram, Viber", "Wazzup: WhatsApp, Instagram, Telegram, Viber"),
    c_wz_e: t("All patient chats land in «Messages», and the reply goes back to the same channel.", "პაციენტების ყველა ჩატი «შეტყობინებებში» მოდის, პასუხი კი იმავე არხში ბრუნდება.", "Все чаты пациентов приходят в «Сообщения», ответ уходит в тот же канал."),
    c_wz_how: t("Wazzup: Integrations, then API, copy the API key.", "Wazzup: ინტეგრაციები, შემდეგ API, დააკოპირეთ API გასაღები.", "Wazzup: «Интеграции», затем «API», скопируйте ключ API."),
    c_tg_t: t("Telegram bot for the administrator", "Telegram ბოტი ადმინისტრატორისთვის", "Telegram-бот администратору"),
    c_tg_e: t("New bookings and messages arrive in Telegram, and you can answer right there.", "ახალი ჩაწერები და შეტყობინებები Telegram-ში მოდის და იქვე შეგიძლიათ უპასუხოთ.", "Новые записи и сообщения приходят в Telegram, отвечать можно прямо там."),
    c_tg_how: t("Telegram: @BotFather, then /newbot, copy the token.", "Telegram: @BotFather, შემდეგ /newbot, დააკოპირეთ ტოკენი.", "Telegram: @BotFather, затем /newbot, скопируйте токен."),
    c_crm_t: t("CRM: amoCRM or Bitrix24", "CRM: amoCRM ან Bitrix24", "CRM: amoCRM или Bitrix24"),
    c_crm_e: t("Each booking becomes a deal with the patient's contact; the stage comes back to the panel.", "ყოველი ჩაწერა ხდება გარიგება პაციენტის კონტაქტით; ეტაპი პანელში ბრუნდება.", "Каждая запись становится сделкой с контактом пациента, этап возвращается в панель."),
    c_crm_how: t("amoCRM: Settings, Integrations, private integration, long-term token. Bitrix24: Developers, incoming webhook, its address.", "amoCRM: პარამეტრები, ინტეგრაციები, პირადი ინტეგრაცია, გრძელვადიანი ტოკენი. Bitrix24: დეველოპერები, შემომავალი ვებჰუკი, მისი მისამართი.", "amoCRM: «Настройки», «Интеграции», частная интеграция, долгосрочный токен. Bitrix24: «Разработчикам», входящий вебхук, его адрес."),
    c_rem_t: t("Reminders to patients", "შეხსენებები პაციენტებს", "Напоминания пациентам"),
    c_rem_e: t("A WhatsApp message a day and two hours before the visit. Works through Wazzup.", "WhatsApp შეტყობინება ვიზიტამდე ერთი დღით და ორი საათით ადრე. მუშაობს Wazzup-ით.", "Сообщение в WhatsApp за сутки и за два часа до визита. Работает через Wazzup."),
    c_key: t("Key", "გასაღები", "Ключ"), c_save: t("Connect", "დაკავშირება", "Подключить"), c_off: t("Disconnect", "გათიშვა", "Отключить"),
    c_on: t("Connected · demo", "დაკავშირებულია · დემო", "Подключено · демо"), c_need: t("Not connected", "არ არის დაკავშირებული", "Не подключено"),
    c_need_wz: t("Connect Wazzup first.", "ჯერ Wazzup დააკავშირეთ.", "Сначала подключите Wazzup."), c_turn: t("Turn on", "ჩართვა", "Включить"), c_turnoff: t("Turn off", "გამორთვა", "Выключить"),
    c_left: t("Left to connect", "დასაკავშირებელია", "Осталось подключить"), how: t("Where to get it", "სად ავიღოთ", "Где взять"),
    note_con: t("connected", "დააკავშირა", "подключил"), note_coff: t("disconnected", "გათიშა", "отключил"),
  };
  /* Переписки демо: каналы Wazzup, слова пациентов без цен. */
  const threads = [
    { ch: "whatsapp", n: 0, svc: "thera", un: 1, m: [["p", t("Hello, can I come for a consultation this week?", "გამარჯობა, შეიძლება ამ კვირაში კონსულტაციაზე მოსვლა?", "Здравствуйте, можно на консультацию на этой неделе?")], ["a", t("Hello! Thursday at 14:00 or Friday at 12:30 is free.", "გამარჯობა! ხუთშაბათს 14:00 ან პარასკევს 12:30 თავისუფალია.", "Здравствуйте! Свободно в четверг в 14:00 или в пятницу в 12:30.")], ["p", t("Thursday suits me.", "ხუთშაბათი მაწყობს.", "Мне подходит четверг.")]] },
    { ch: "instagram", n: 1, svc: "white", un: 1, m: [["p", t("Do you do whitening? How long does it take?", "თეთრებას აკეთებთ? რამდენ ხანს გრძელდება?", "Вы делаете отбеливание? Сколько это длится?")]] },
    { ch: "telegram", n: 2, svc: "resto", un: 1, m: [["p", t("I arrive in Tbilisi on the 20th for five days. Can you plan the treatment before I come?", "20-ში ჩამოვდივარ თბილისში ხუთი დღით. შეგიძლიათ მკურნალობა წინასწარ დაგეგმოთ?", "Прилетаю в Тбилиси 20-го на пять дней. Можно спланировать лечение заранее?")]] },
    { ch: "viber", n: 3, svc: "ortho", un: 0, m: [["p", t("I would like to move my visit to Saturday.", "მინდა ვიზიტი შაბათზე გადავიტანო.", "Хочу перенести визит на субботу.")], ["a", t("Done: Saturday at 11:00.", "გადავიტანეთ: შაბათს 11:00.", "Перенесли: суббота, 11:00.")]] },
    { ch: "instagram", n: 4, svc: "resto", un: 0, m: [["p", t("Thank you for the restoration, I love the result!", "მადლობა რესტავრაციისთვის, შედეგი ძალიან მომწონს!", "Спасибо за реставрацию, результат очень нравится!")]] },
  ];
  const langs = LANGS.map((x) => ({ k: x === "ka" ? "ქარ" : x.toUpperCase(), l: x, h: href(x, "panel"), on: x === l }));
  const pd = {
    l, ui, mark: MARK, site: href(l, "site"), home: href(l),
    svc: SERVICES.map((s) => ({ id: s.id, n: s[l][0] })),
    docs: TEAM.slice(0, 5).map((p) => ({ n: l === "ka" ? p.ka : p.en, r: p.r[l] })),
    wd: days(l),
    names: l === "ka" ? ["ანა", "გიორგი", "ნინო", "დავით", "მარიამ", "ლევან", "თამარ", "ლუკა", "ელენე", "საბა"] : l === "ru" ? ["Анна", "Георгий", "Нино", "Давид", "Мариам", "Леван", "Тамара", "Лука", "Елена", "Саба"] : ["Anna", "Giorgi", "Nino", "Davit", "Mariam", "Levan", "Tamar", "Luka", "Elene", "Saba"],
    trap: "[[t:0]] Travel",
    threads, langs,
  };
  return `${head(l, t("Nek Dental Studio panel · demo", "Nek Dental Studio-ს პანელი · დემო", "Панель Nek Dental Studio · демо"), t("Clinic panel: bookings from the site, schedule by doctor, statuses, history and roles. Demo data.", "კლინიკის პანელი: ჩაწერები საიტიდან, განრიგი, სტატუსები, ისტორია და როლები. დემო მონაცემები.", "Панель клиники: записи с сайта, расписание по врачам, статусы, история и роли. Демо-данные."))}
<style>${CSS}${PANEL_CSS}</style>
</head>
<body class="pn">
<div id="app"></div>
<footer class="pn-foot">${t("Mockup by DevUz Studio, demo data. By using the mockup you accept the", "DevUz Studio-ს მაკეტი, დემო მონაცემები. მაკეტის გამოყენებით თქვენ ეთანხმებით", "Макет DevUz Studio, демо-данные. Пользуясь макетом, вы принимаете")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("mockup terms", "მაკეტის პირობებს", "условия макета")}</a>.</footer>
<script type="application/json" id="pn-data">${json(pd)}</script>
<script>
${PANEL_JS}</script>
</body>
</html>`;
}

const out = {};
for (const l of LANGS) {
  const k = KEY[l];
  out[k] = landPage(l);
  out[(k ? k + "/" : "") + "site"] = sitePage(l);
  out[(k ? k + "/" : "") + "panel"] = panelPage(l);
}
for (const [k, v] of Object.entries(out)) {
  const vis = v.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style>[\s\S]*?<\/style>/g, "");
  if (/[—–]/.test(vis)) throw new Error(`${k}: длинное тире на странице`);
  if (!k.startsWith("ru")) {
    const m = (vis + (v.match(/<script type="application\/json"[\s\S]*?<\/script>/g) || []).join("")).match(/[^\s<>"]*[А-Яа-яЁё][^\s<>"]*/g);
    if (m) throw new Error(`${k}: кириллица не на русской странице: ${[...new Set(m)].slice(0, 12).join(" ")}`);
  }
  for (const m of v.matchAll(/\/protos\/nek\/[\w./-]+\.(?:webp|png|js)/g)) if (!existsSync(PUB + m[0])) throw new Error(`${k}: нет файла ${m[0]}`);
}
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/* Сборка для сервера (lib/proto/bundles): стили и скрипты один раз. */
const parts = { J: `<script>\n${JS}</script>`, C: `<style>${CSS}</style>`, PJ: `<script>\n${PANEL_JS}</script>`, LJ: `<script>\n${LAND_JS}</script>` };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const [name, part] of Object.entries(parts)) p = p.split(part).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "nek.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(en)").padEnd(10), v.length);
