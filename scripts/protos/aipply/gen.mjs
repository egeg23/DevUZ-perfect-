import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { ADDONS, BASE as KIT_BASE, BLOCKS, GROUPS } from "./plan.mjs";

/*
 * Прототип Aipply Academy (aipply.uz): курсы «Kompyuter savodxonligi + AI»
 * в Ташкенте, Шайхантахурский район. Собран на каркасе ПК Весты
 * (scripts/protos/pkvesta): шапка, промо DevUz, конструктор, «было /
 * стало». Сцены при прокрутке — по образцу Engelberg v2 (наш макет на
 * globalex): липкая сцена, камера по ключевым точкам, подписи по строкам.
 * Узбекский — главный язык (у клиента сайт только на узбекском), русский —
 * зеркало в ru/. Исследование и конкуренты — docs/research/aipply.md,
 * снимки — SOURCES.md.
 *
 * Всё об академии — только с aipply.uz (снято 08.10.2026): курс
 * «Kompyuter savodxonligi + AI», 3000+ выпускников, восемь преимуществ,
 * семь пунктов «o‘rganasiz», бесплатный открытый урок и три его выгоды,
 * телефон, адрес, соцсети. Цен, сроков и расписания на сайте нет, поэтому
 * их нет и здесь. Наши дополнения подписаны «Taklif DevUz Studio».
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/aipply";
const CSS = readFileSync(DIR + "style.css", "utf8").replace(/\n/g, "").replace(/__IMG__/g, IMG);
const INTRO = readFileSync(DIR + "intro.js", "utf8");
const STORY = readFileSync(DIR + "story.js", "utf8");
const JS_MAIN = readFileSync(DIR + "client.js", "utf8");
const BASE = "__PROTO_BASE__";
const FONTS = "https://fonts.googleapis.com/css2?family=Unbounded:wght@700&family=Onest:wght@400;700&display=swap";

const usd = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
const sp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ── Факты с их сайта ─────────────────────────────────────────────────── */
const F = {
  name: "Aipply Academy",
  phone: "+998 77 123 33 00",
  tel: "+998771233300",
  tg: "https://t.me/aipply_admin_bot",
  channel: "https://t.me/aipplyacademy",
  ig: "https://www.instagram.com/aipply.academy",
  fb: "https://www.facebook.com/aipply",
  yt: "https://www.youtube.com/channel/UCzueY2lK3VYGPgC6AWy2HNQ",
  site: "https://aipply.uz",
  map: "https://yandex.uz/maps/?text=" + encodeURIComponent("Toshkent, Shayxontohur tumani, Bog‘ko‘cha dahasi, 3"),
  grads: 3000,
};
const ADDR = { uz: "Toshkent, Shayxontohur tumani, Bog‘ko‘cha dahasi, 3", ru: "Ташкент, Шайхантахурский район, массив Богкуча, 3" };
const TAG = { uz: "Sun’iy intellektga ixtisoslashtirilgan zamonaviy kasblar o‘quv markazi", ru: "Учебный центр современных профессий со специализацией на искусственном интеллекте" };

/* Восемь преимуществ — «Yana qanday afzalliklar bor?» на aipply.uz, по порядку. */
const PLUS = [
  { ic: "metro", uz: ["Metro oldidagi qulay joylashuv", "Darsga metrodan to‘g‘ri kelasiz."], ru: ["Удобно, у самого метро", "На урок приходите прямо от метро."] },
  { ic: "cart", uz: ["Kompyuter xarid qilishingizda yordam beramiz", "Qaysi kompyuter kerakligini birga tanlaymiz."], ru: ["Поможем выбрать и купить компьютер", "Вместе решаем, какой компьютер вам нужен."] },
  { ic: "install", uz: ["Shaxsiy kompyuteringizga dasturlar o‘rnatib beramiz", "Kerakli dasturlar o‘z kompyuteringizda bo‘ladi."], ru: ["Установим программы на ваш компьютер", "Нужные программы будут на вашем же компьютере."] },
  { ic: "star", uz: ["Kurs davomida 3 ta mahorat darslari", "Asosiy darslardan tashqari."], ru: ["3 мастер-класса за время курса", "Сверх основных занятий."], n: 3 },
  { ic: "plus", uz: ["Qo‘shimcha darslar", "Asosiy dasturga qo‘shimcha."], ru: ["Дополнительные занятия", "Сверх основной программы."] },
  { ic: "users", uz: ["Do‘stlaringiz uchun qo‘shimcha 10% chegirma", "Do‘st bilan kelsangiz, unga ham chegirma."], ru: ["Друзьям дополнительно 10% скидки", "Пришли с другом, и у него тоже скидка."], n: 10, suf: "%" },
  { ic: "pct", uz: ["Boshqa kurslarimizga qo‘shimcha 10% chegirma", "Keyingi kursni ham arzonroq o‘qiysiz."], ru: ["Ещё 10% скидки на другие наши курсы", "Следующий курс тоже выйдет дешевле."], n: 10, suf: "%" },
  { ic: "wifi", uz: ["Bepul Coworking va Wi-Fi", "Darsdan keyin ham shu yerda ishlaysiz."], ru: ["Бесплатный коворкинг и Wi-Fi", "После урока можно остаться и поработать."] },
];
/* Подписи к преимуществам (второй элемент) — наши пояснения к их словам, без
   новых обещаний: «darsdan keyin ham» следует из бесплатного коворкинга. */

/* Семь пунктов «o‘rganasiz» на aipply.uz, по порядку. */
const LEARN = [
  { ic: "doc", uz: "Ofis dasturlaridan samarali foydalanish", ru: "Уверенно работать в офисных программах" },
  { ic: "ai", uz: "Sun’iy intellektdan unumli foydalanish", ru: "С пользой применять искусственный интеллект" },
  { ic: "globe", uz: "Internet va brauzerlar", ru: "Интернет и браузеры" },
  { ic: "clock", uz: "Vaqtingizni tejovchi foydali saytlar", ru: "Полезные сайты, которые экономят время" },
  { ic: "lock", uz: "Ma’lumotlarni xavfsiz saqlash", ru: "Надёжно хранить свои данные" },
  { ic: "pc", uz: "Kompyuterdan to‘g‘ri foydalanish", ru: "Правильно пользоваться компьютером" },
  { ic: "cert", uz: "Kurs so‘ngida sertifikat", ru: "Сертификат в конце курса" },
];

/* Открытый урок — «Bepul ochiq darsda ishtirok etib qo‘lga kiritasiz». */
const OPEN = [
  { k: "20%", uz: "Kurs uchun 20% chegirma", ru: "Скидка 20% на курс" },
  { k: "PC", uz: "Darsda foydalanishingiz uchun kompyuter", ru: "Компьютер на уроке: свой не нужен" },
  { k: "24/7", kUz: "Grafik", kRu: "График", uz: "Istalgan dars grafigi bo‘yicha o‘qish imkoniyati", ru: "Учиться по любому удобному графику" },
];

/* ── Знак Aipply: три полосы, снято с их логотипа (share.jpg на aipply.uz). ── */
const MK = {
  a: "M-41 -229 L-17 -265 L181 -24 L-126 -74 L-101 -117 L71 -89 Z",
  b: "M-142 -47 L168 1 L144 45 L-166 -4 Z",
  c: "M-182 23 L126 71 L102 115 L-72 87 L41 221 L16 265 Z",
  slit: "M-126 -74 L181 -24 L168 1 L-142 -47 Z",
};
let gid = 0;
const mark = (cls = "", white = false) => {
  const id = `mkg${gid++}`;
  return `<svg class="${cls}" viewBox="-190 -272 380 544" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${white ? "#cfe6ff" : "#0078d6"}"/><stop offset="1" stop-color="${white ? "#9ccfff" : "#0060c8"}"/></linearGradient></defs><path d="${MK.a}" fill="${white ? "#fff" : "#0000b0"}"/><path d="${MK.b}" fill="url(#${id})"/><path d="${MK.c}" fill="${white ? "#7cd0ff" : "#00a0e0"}"/></svg>`;
};

/* Логотип DevUz Studio для заставки — тот же, что в промо на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZMARK = `<svg class="dz-mark" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

/* Иконки — контуры 24×24, по смыслу. */
const I = (dd, w = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${dd}</svg>`;
const ICON = {
  tg: I('<path d="M21 4 3 11l6 2.5M21 4l-3.5 16-8.5-6.5M21 4 9 13.5V19l3-3.5"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>', 2),
  arrows: I('<path d="m9 7-5 5 5 5M15 7l5 5-5 5"/>', 2),
  check: I('<path d="m5 12 5 5 9-10"/>', 2),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  metro: I('<path d="M4 19 8 6l4 8 4-8 4 13"/><path d="M2 19h20"/>'),
  cart: I('<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>'),
  install: I('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M12 7v5M9.5 9.5 12 12l2.5-2.5"/>'),
  star: I('<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>'),
  plus: I('<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>'),
  users: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5.5 5.5 0 0 1 3.5 6"/>'),
  pct: I('<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>'),
  wifi: I('<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>'),
  doc: I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
  table: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>'),
  ai: I('<path d="M12 3c.5 3.8 2.2 5.5 6 6-3.8.5-5.5 2.2-6 6-.5-3.8-2.2-5.5-6-6 3.8-.5 5.5-2.2 6-6z"/><path d="M19 15c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5z"/>'),
  globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  lock: I('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.5"/>'),
  pc: I('<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2 19h20l-1.5-4h-17z"/>'),
  cert: I('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 8h10M7 11h6"/><circle cx="16.5" cy="17" r="2.5"/><path d="m15 19-1 3 2.5-1.2L19 22l-1-3"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  map: I('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  translate: I('<path d="M4 5h9M8.5 3v2c0 4-2 7-5 8.5M6 9c1 2.5 3 4.2 6 5"/><path d="m13 21 4-9 4 9M14.5 18h5"/>'),
  play: I('<path d="M8 5v14l11-7z"/>', 2),
  bot: I('<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 14h.01M15 14h.01M2 13v3M22 13v3"/>'),
  card: I('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>'),
  chart: I('<path d="M3 20h18"/><path d="M6 16v-4M11 16V8M16 16v-6M21 16V5"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  ig: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>'),
  test: I('<path d="M9 4h6M10 4v5L5 19a1.5 1.5 0 0 0 1.3 2h11.4A1.5 1.5 0 0 0 19 19l-5-10V4"/><path d="M7.5 15h9"/>'),
  sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
};

const PAGES = ["", "kurs", "ochiq-dars", "plan"];

/* ── Сборка одной страницы на языке l ─────────────────────────────────── */
function build(l, path) {
  const t = (uz, ru) => (l === "ru" ? ru : uz);
  const href = (p = "") => BASE + (l === "ru" ? "/ru" : "") + (p ? "/" + p : "");
  const alt = (p = "") => BASE + (l === "ru" ? "" : "/ru") + (p ? "/" + p : "");
  const TERMS = `https://devuz.studio/${l}/mockup-terms`;
  const NAMES = { "": t("Bosh sahifa", "Главная"), kurs: t("Kurs", "Курс"), "ochiq-dars": t("Ochiq dars", "Открытый урок"), plan: t("Keyingi qadam", "Что дальше") };
  const tgText = t("Assalomu alaykum! Bepul ochiq darsga yozilmoqchiman.", "Здравствуйте! Хочу записаться на бесплатный открытый урок.");
  const tgBtn = (cls, label, text = tgText) => `<a class="btn ${cls}" href="${F.tg}" data-tg="${esc(text)}">${ICON.tg}${label}</a>`;
  const head = (kicker, h, lead, side = "", anim = "rise", dark = false) => `<div class="sec-head rv a-${anim}"><div>${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h2 style="margin-top:12px">${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>${side}</div>`;

  /* ── Конструктор: плашка на каждой странице ── */
  const kdRow = (a, def = true) => `<label class="kd-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="${(a.needs || []).join(" ")}"${def ? " data-def checked" : ""}><span class="sw" aria-hidden="true"></span><span class="kd-t"><b>${a[l].t}${a.star ? `<em>${t("majburiy", "обязательно")}</em>` : ""}</b>${a[l].e ? `<small>${a[l].e}</small>` : ""}</span><span class="kd-p num">+${usd(a.price)}</span></label>`;
  function dockHtml() {
    const group = (title, side, rows) => (rows.length ? `<section class="kd-g"><h3><span>${title}</span>${side}</h3>${rows.join("")}</section>` : "");
    const here = ADDONS.filter((a) => a.where === path);
    const all = ADDONS.filter((a) => a.where === "all");
    const others = [...new Set(ADDONS.map((a) => a.where))].filter((w) => w !== "all" && w !== path);
    return `<button class="kd-pill" type="button" id="kd-pill" aria-expanded="false" aria-controls="kd"><i aria-hidden="true"></i>${t("Konstruktor", "Конструктор")}<b class="num" id="kd-pill-sum"></b></button>
<aside class="kd" id="kd" role="dialog" aria-label="${t("Sayt konstruktori", "Конструктор сайта")}" hidden>
<header class="kd-h"><div><p class="kd-k">${t("Konstruktor · DevUz Studio taklifi", "Конструктор · предложение DevUz Studio")}</p><h2>${t("Aipply Academy’ning yangi saytiga nima kiradi", "Что войдёт в новый сайт Aipply Academy")}</h2><p class="kd-sub">${t("Blokni o‘chirsangiz, u sahifadan yo‘qoladi. Yoqsangiz, qaytib chiqadi. Jami darhol qayta hisoblanadi.", "Выключите блок, и он пропадёт со страницы. Включите, и он появится снова. Итог пересчитывается сразу.")}</p></div><button class="kd-x" type="button" id="kd-x" aria-label="${t("Yopish", "Свернуть")}">×</button></header>
<div class="kd-list">
${group(t("Shu sahifada", "На этой странице"), "", here.map((a) => kdRow(a)))}
${group(t("Hamma sahifada", "На всех страницах"), "", all.map((a) => kdRow(a)))}
${others.map((w) => group(NAMES[w], `<a href="${href(w)}">${t("ochish", "открыть")} →</a>`, ADDONS.filter((a) => a.where === w).map((a) => kdRow(a)))).join("")}
${group(t("Saytdan tashqari", "Сверх сайта"), `<a href="${href("plan")}#konstruktor">${t("bu nima", "что это")} →</a>`, BLOCKS.map((b) => kdRow({ ...b, [l]: { t: b[l].t } }, !!b.star)))}
</div>
<footer class="kd-f">
<div class="kd-line"><span>${t("Sayt", "Сайт")}</span><span class="num">${usd(KIT_BASE.price)}</span></div>
<div class="kd-line"><span>${t("Qo‘shimchalar", "Допы")} · <span id="kd-n"></span></span><span class="num" id="kd-add"></span></div>
<div class="kd-line kd-tot"><span>${t("Jami bir martalik", "Итого разово")}</span><b class="num" id="kd-sum"></b></div>
<a class="btn btn-main" href="https://t.me/Devuz_studio_bot?start=aipply">${ICON.tg}${t("DevUz Studio bilan muhokama qilish", "Обсудить с DevUz Studio")}</a>
<div class="kd-btns"><button class="copy" type="button" id="kd-copy">${t("Tarkibni nusxalash", "Скопировать состав")}</button><button class="copy" type="button" id="kd-reset">${t("Qaytarish", "Сбросить")}</button></div>
</footer>
</aside>`;
  }

  /* ── Заставка: промо DevUz Studio → знак Aipply → влёт в просвет ── */
  function introHtml() {
    const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
    return `<div class="intro" id="intro" role="presentation">
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZMARK}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t("Aipply Academy uchun prototip", "прототип для Aipply Academy")}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<svg class="mk-svg" aria-hidden="true" focusable="false"><defs><linearGradient id="mki" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a8cff"/><stop offset="1" stop-color="#0060c8"/></linearGradient></defs><g class="mk-cam"><path class="mk-veil" fill-rule="evenodd" d="M-9000 -9000H9000V9000H-9000Z ${MK.slit}"/><path class="mk-slit" d="${MK.slit}"/><path class="mk-p" d="${MK.a}" fill="#2f3bff" style="opacity:0"/><path class="mk-p" d="${MK.b}" fill="url(#mki)" style="opacity:0"/><path class="mk-p" d="${MK.c}" fill="#21b5f0" style="opacity:0"/></g></svg>
<div class="mk-word" aria-hidden="true"><b>Aipply</b><span>academy</span></div>
<div class="mk-cap"><b>Aipply Academy</b><span>${t("Kompyuter savodxonligi + AI · Toshkent", "Компьютерная грамотность + AI · Ташкент")}</span></div>
<button type="button" class="in-skip" id="in-skip">${t("O‘tkazib yuborish", "Пропустить")}</button>
</div>`;
  }

  /* Фильтр преломления для «жидкого стекла»: шум смещает то, что под
     стеклом. Понимает только Chromium, остальным хватает размытия. */
  const LQ = `<svg class="lq-defs" aria-hidden="true" focusable="false"><filter id="lq" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.019" numOctaves="2" result="n"/><feGaussianBlur in="n" stdDeviation="2.5" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="22" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;

  /* ── Каркас ── */
  function shell(meta, body) {
    const isHome = path === "";
    const nav = ["kurs", "ochiq-dars", "plan"];
    return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#060a2e">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
${isHome ? `<link rel="preload" as="image" href="${IMG}/teacher-m.webp" media="(max-width: 1023px)"><link rel="preload" as="image" href="${IMG}/teacher.webp" media="(min-width: 1024px)">` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=${isHome ? "false" : "true"};try{if(sessionStorage.getItem('ap-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}try{var k=JSON.parse(localStorage.getItem('ap-kit-v1')||'{}');if(k.intro===false)off=true;if(k.motion===false)r.classList.add('k-no-motion');if(k.glass===false)r.classList.add('k-no-glass');if(k.story===false)r.classList.add('k-no-story')}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "EducationalOrganization", name: F.name, url: F.site, telephone: F.tel, address: { "@type": "PostalAddress", streetAddress: "Bog‘ko‘cha dahasi, 3", addressLocality: "Toshkent", addressRegion: "Shayxontohur tumani", addressCountry: "UZ" }, sameAs: [F.channel, F.ig, F.fb, F.yt] })}</script>
</head>
<body class="${isHome ? "home" : ""}" data-page="${path}">
${LQ}
${isHome ? introHtml() : ""}
<a class="skip" href="#main">${t("Asosiy qismga", "К содержанию")}</a>
<header class="top"><div class="wrap">
<a class="logo" href="${href()}" aria-label="${t("Aipply Academy, bosh sahifaga", "Aipply Academy, на главную")}">${mark("", false)}<span>Aipply<small>academy</small></span></a>
<nav class="nav" aria-label="${t("Bo‘limlar", "Разделы")}">${nav.map((p) => `<a href="${href(p)}"${p === path ? ' aria-current="page"' : ""}>${NAMES[p]}</a>`).join("")}</nav>
<div class="top-r"><a class="top-tel" href="tel:${F.tel}">${F.phone}</a>
<span class="lang" role="group" aria-label="${t("Til", "Язык")}"><a href="${l === "uz" ? href(path) : alt(path)}"${l === "uz" ? ' aria-current="true"' : ""} lang="uz"><span>UZ</span></a><a href="${l === "ru" ? href(path) : alt(path)}"${l === "ru" ? ' aria-current="true"' : ""} lang="ru"><span>RU</span></a></span>
<a class="btn btn-sun btn-sm top-cta" href="${href("ochiq-dars")}">${t("Ochiq dars", "Открытый урок")}</a></div>
</div></header>
<main id="main">
${body}
</main>
<footer><div class="wrap">
<div class="cols">
<div><b>Aipply Academy</b><ul><li>${TAG[l]}</li><li>${ADDR[l]}</li><li>${t("Metro oldida", "У метро")}</li></ul></div>
<div><b>${t("Aloqa", "На связи")}</b><ul><li><a href="tel:${F.tel}">${F.phone}</a></li><li><a href="${F.tg}">${t("Telegram: murojaat", "Telegram: обращения")}</a> · <a href="${F.channel}">${t("kanal", "канал")}</a></li><li><a href="${F.ig}">Instagram</a></li><li><a href="${F.fb}">Facebook</a> · <a href="${F.yt}">YouTube</a></li><li><a href="${F.map}">${t("Xaritada ochish", "Открыть на карте")}</a></li></ul></div>
<div><b>${t("Bo‘limlar", "Разделы")}</b><ul>${["", ...nav].map((p) => `<li><a href="${href(p)}">${NAMES[p]}</a></li>`).join("")}</ul></div>
</div>
<div class="rights"><span>${t("Bu prototip: Aipply Academy’ning yangi sayti shunday ko‘rinishi mumkin. Akademiya haqidagi hamma gaplar, ustoz surati va logotip aipply.uz saytidan olingan (08.10.2026). «Taklif DevUz Studio» belgisi bor bloklarni biz o‘ylab topdik, saytda hozircha ular yo‘q. Rasmlar qayerdan:", "Это прототип: так может выглядеть новый сайт Aipply Academy. Всё об академии, снимок и логотип взяты с aipply.uz (08.10.2026), русский текст: наш перевод. Блоки с пометкой «Предложение DevUz Studio» придумали мы, на сайте их пока нет. Откуда снимки:")} <a href="${href("plan")}#foto">${NAMES.plan}</a>.</span><span>${t("Prototip DevUz Studio’ga tegishli. Undan faqat shartnoma bo‘yicha foydalanish mumkin:", "Прототип принадлежит DevUz Studio. Использовать его можно только по договору:")} <a href="${TERMS}">${t("foydalanish shartlari", "условия использования")}</a></span></div>
</div></footer>
${path === "ochiq-dars" ? "" : `<div class="dock" id="dock">${tgBtn("btn-sun shim", t("Bepul ochiq darsga yozilish", "Записаться на бесплатный урок"))}</div>`}
${dockHtml()}
<script type="application/json" id="i18n">${JSON.stringify(Ls()).replace(/</g, "\\u003c")}</script>
${isHome ? `<script>\n${INTRO}</script>\n<script>\n${STORY}</script>` : ""}
<script>
${JS_MAIN}</script>
</body>
</html>`;
  }

  /* Строки для скрипта страницы. */
  function Ls() {
    return {
      tg: F.tg,
      kitBase: KIT_BASE.price,
      kitN: t("{n} ta", "{n} шт."),
      kitTg: t("Aipply Academy yangi sayti konstruktordan:", "Состав нового сайта Aipply Academy из конструктора:"),
      kitBaseName: KIT_BASE[l].t,
      kitTotal: t("Jami", "Итого"),
      copied: t("Nusxalandi", "Скопировано"),
      sent: t("Matn nusxalandi. Telegram ochilmoqda: chatga qo‘ying va yuboring.", "Текст скопирован. Открываем Telegram: вставьте его в чат и отправьте."),
      msgHead: t("Assalomu alaykum! Bepul ochiq darsga yozilmoqchiman (aipply.uz).", "Здравствуйте! Хочу на бесплатный открытый урок (aipply.uz)."),
      fDay: t("Qaysi kun", "День"),
      fTime: t("Vaqt", "Время"),
      fLevel: t("Darajam", "Мой уровень"),
      fPc: t("Kompyuterim", "Мой компьютер"),
      fName: t("Ism", "Имя"),
      fPhone: t("Telefon", "Телефон"),
      fWish: t("Savol", "Вопрос"),
      empty: t("ko‘rsatilmagan", "не указано"),
      need: t("Kun, vaqt, ism va telefonni belgilang: administrator sizga qo‘ng‘iroq qilib, guruhni aytadi.", "Отметьте день, время, имя и телефон: администратор перезвонит и назовёт группу."),
      testHead: t("Assalomu alaykum! Saytdagi testdan o‘tdim, ochiq darsga yozilmoqchiman.", "Здравствуйте! Прошёл тест на сайте, хочу на открытый урок."),
      testLevel: t("Natija", "Итог"),
      levels: [
        [t("Noldan", "С нуля"), t("Hammasi birinchi darsdan boshlanadi: kompyuterni yoqishdan. Ochiq darsda kompyuter beriladi, o‘zingiznikini olib kelish shart emas.", "Всё начнётся с первого урока, с включения компьютера. На открытом уроке компьютер дают, свой приносить не нужно.")],
        [t("Boshlang‘ich", "Начальный"), t("Asosini bilasiz. Kursda ofis dasturlari, internet va sun’iy intellekt bilan ishlashni tartibga solasiz.", "Основы вы знаете. На курсе приведёте в порядок офисные программы, интернет и работу с ИИ.")],
        [t("Ishonchli", "Уверенный"), t("Kompyuterni yaxshi bilasiz. Eng ko‘p foyda sun’iy intellekt va vaqt tejovchi saytlardan bo‘ladi: ochiq darsda ko‘rib chiqing.", "Компьютер вы знаете неплохо. Больше всего пользы дадут ИИ и сайты, экономящие время: посмотрите на открытом уроке.")],
      ],
    };
  }

  /* ── Первый экран ── */
  function heroBlock() {
    const tw = (w, i) => `<span class="tw" style="--i:${i}">${w}</span>`;
    const h1 = t("Kompyuterni hech kimga ishingiz tushmaydigan darajada o‘rganing", "Освойте компьютер так, чтобы больше ни у кого не просить помощи");
    const words = h1.split(" ");
    const hl = t([0], [1]);
    const rot = t(["ofis dasturlari", "internet", "sun’iy intellekt", "foydali saytlar"], ["офисные программы", "интернет", "ИИ", "полезные сайты"]);
    /* Полосы знака на фоне: три слоя глубины, цвета знака. */
    const STR = [
      ["62%", "8%", "46vw", "56px", "#0000b0", .55, 1.6], ["70%", "22%", "40vw", "56px", "#0070d0", .5, 1.1], ["66%", "36%", "44vw", "56px", "#00a0e0", .45, .6],
      ["-12%", "70%", "30vw", "28px", "#0070d0", .25, 2.2], ["-8%", "80%", "26vw", "28px", "#00a0e0", .2, 1.4],
    ];
    /* Клетки сетки, которые загораются: места и задержки расписаны заранее. */
    const CELLS = [[3, 2, 0], [7, 1, 1.4], [10, 4, 2.6], [5, 6, 3.8], [12, 2, 4.4], [14, 6, .8], [9, 8, 2], [16, 3, 3.2], [2, 9, 5], [18, 7, 1.1], [11, 10, 4], [20, 2, 2.4]];
    const grid = `<div class="grid-bg" aria-hidden="true"><svg><defs><pattern id="gp" width="56" height="56" patternUnits="userSpaceOnUse"><path class="gl" d="M56 0H0V56"/></pattern></defs><rect width="100%" height="100%" fill="url(#gp)" style="animation:none;opacity:1"/>${CELLS.map(([x, y, dl]) => `<rect x="${x * 56 + 1}" y="${y * 56 + 1}" width="55" height="55" style="--dl:${dl}s"/>`).join("")}</svg></div>`;
    const fl = (cls, ic, b, s, dep) => `<div class="fl glass lq ${cls}" data-depth="${dep}"><span class="ic">${ICON[ic]}</span><div><b>${b}</b><small>${s}</small></div></div>`;
    return `<section class="hero" id="hero" aria-label="Aipply Academy">
${grid}
<div class="stripes" aria-hidden="true">${STR.map(([x, y, w, h, c, o, dep]) => `<i data-depth="${dep}" data-base="skewX(-34deg) rotate(9deg)" style="--x:${x};--y:${y};--w:${w};--h:${h};--c:${c};--o:${o}"></i>`).join("")}</div>
<div class="hero-in"><div class="wrap"><div class="hero-grid">
<div>
<span class="kicker hi" style="color:var(--on2)"><i></i>Aipply Academy · ${t("Toshkent, Shayxontohur", "Ташкент, Шайхантахур")}</span>
<h1 style="margin-top:16px">${words.map((w, i) => (hl.includes(i) ? `<span class="tw em" style="--i:${i}">${w}</span>` : tw(w, i))).join(" ")}</h1>
<p class="lead hi" style="--d:200ms">${t("Kompyuter savodxonligi + AI kursi. O‘rganasiz:", "Курс «Компьютерная грамотность + AI». Научитесь:")} <span class="rot" aria-hidden="true">${rot.map((w, k) => `<span${k === 0 ? ' class="on"' : ""}>${w}</span>`).join("")}</span><span class="vh">${rot.join(", ")}</span></p>
<div class="cta hero-go hi" style="--d:280ms">${tgBtn("btn-sun shim", t("Bepul ochiq darsga yozilish", "Записаться на бесплатный урок"))}<a class="btn btn-ghost" href="${href("kurs")}">${t("Kurs dasturi", "Программа курса")}${ICON.arrow}</a></div>
<div class="trust hi" style="--d:360ms"><span class="glass">${ICON.metro}${t("Metro oldida", "У метро")}</span><span class="glass">${ICON.pc}${t("Darsda kompyuter beriladi", "Компьютер на уроке")}</span><span class="glass">${ICON.cert}${t("Sertifikat", "Сертификат")}</span></div>
</div>
<div class="hero-art hi" style="--d:160ms">
<div class="hero-ring" aria-hidden="true"></div>
<div class="hero-ph" data-depth="0.5" data-base="translateX(-50%)"><picture><source media="(min-width: 1024px)" srcset="${IMG}/teacher.webp"><img src="${IMG}/teacher-m.webp" alt="${t("Aipply Academy ustozi noutbuk bilan: «Texnik bilimlaringizni rivojlantiring!»", "Преподаватель Aipply Academy с ноутбуком: «Texnik bilimlaringizni rivojlantiring!»")}" width="1200" height="1463" fetchpriority="high"></picture></div>
${fl("a", "users", `<span class="num" data-count="${F.grads}" data-suf="+">${sp(F.grads)}+</span>`, t("muvaffaqiyatli bitiruvchilar", "успешных выпускников"), 2.2)}
${fl("b", "pct", "20%", t("ochiq darsdan keyin kursga chegirma", "скидка на курс после открытого урока"), 1.6)}
${fl("c", "wifi", "Wi-Fi", t("bepul Coworking", "бесплатный коворкинг"), 2.8)}
</div>
</div></div></div>
</section>
<div class="mq" aria-hidden="true"><div class="mq-row">${[0, 1].map(() => [["doc", t("Ofis dasturlari", "Офисные программы")], ["ai", t("Sun’iy intellekt", "Искусственный интеллект")], ["globe", t("Internet va brauzerlar", "Интернет и браузеры")], ["clock", t("Foydali saytlar", "Полезные сайты")], ["lock", t("Xavfsiz saqlash", "Надёжное хранение")], ["cert", t("Sertifikat", "Сертификат")]].map(([i, s]) => `<span>${ICON[i]}${s}</span>`).join("")).join("")}</div></div>`;
  }

  /* ── История «Kompyuter noldan» ── */
  function storyBlock() {
    const END = 18;
    const CH = [[0, "Aipply"], [1.4, t("Noldan", "С нуля")], [4, t("Ofis", "Офис")], [8.2, "Internet"], [10.4, t("Sun’iy intellekt", "ИИ")], [13, t("Xavfsizlik", "Данные")], [14.6, t("Sertifikat", "Сертификат")], [16.2, "3000+"]];
    const beat = (a, b, n, h, p = "", extra = "") => `<div class="beat" data-beat="${a} ${b}"><p class="ey" data-line>${n}</p><h3 data-line>${h}</h3>${p ? `<p data-line>${p}</p>` : ""}${extra}</div>`;
    const of7 = (k) => `${String(k).padStart(2, "0")} / 07 · ${t("O‘rganasiz", "Научитесь")}`;
    /* Точки выпускников: места и откуда прилетают — расписаны заранее. */
    const dots = Array.from({ length: 64 }, (_, i) => {
      const a = i * 2.39996, r = 18 + (i % 8) * 4.4 + (i * 7 % 5);
      const x = 50 + Math.cos(a) * r * 1.2, y = 50 + Math.sin(a) * r * .9;
      return `<i style="--x:${x.toFixed(1)}%;--y:${y.toFixed(1)}%;--dx:${(Math.cos(a) * 240).toFixed(0)}px;--dy:${(Math.sin(a) * 240).toFixed(0)}px;--c:${["#2f3bff", "#1a8cff", "#21b5f0", "#ffc83d"][i % 4]}"></i>`;
    }).join("");
    const dock = [["doc", "W", "ic-doc"], ["xls", "X", "ic-xls"], ["web", ICON.globe, "ic-web"], ["ai", ICON.ai, "ic-ai"], ["safe", ICON.lock, "ic-safe"]];
    const xlsRows = t([["Oziq-ovqat", "1 200 000"], ["Transport", "300 000"], ["Kommunal", "450 000"], ["Internet", "100 000"]], [["Продукты", "1 200 000"], ["Транспорт", "300 000"], ["Коммуналка", "450 000"], ["Интернет", "100 000"]]);
    const tiles = t([["mail", "Pochta"], ["map", "Xarita"], ["translate", "Tarjimon"], ["play", "Video darslar"]], [["mail", "Почта"], ["map", "Карты"], ["translate", "Переводчик"], ["play", "Видеоуроки"]]);
    const files = [[-180, -120], [190, -140], [-200, 90], [210, 80]];
    const staticList = LEARN.map((x) => `<li><b>${x[l]}</b><p>${x.ic === "cert" ? t("Kurs so‘ngida esa sertifikatga ega bo‘lasiz.", "В конце курса получаете сертификат.") : t("Kursda o‘rganasiz.", "Это будет на курсе.")}</p></li>`).join("");
    return `<section class="story" id="story" data-addon="story" data-end="${END}" data-chapters='${JSON.stringify(CH)}' aria-label="${t("Kompyuter noldan: kursda nimani o‘rganasiz", "Компьютер с нуля: что изучите на курсе")}">
<div class="st-track"><div class="st-stage">
<div class="st-dots st-l" data-k="dots" aria-hidden="true">${dots}</div>
<div class="st-world" aria-hidden="true">
<div class="lp"><div class="lp-glow"></div>
<div class="lp-lid"><span class="lp-cam"></span><div class="lp-scr">
<div class="sc-boot">${mark("", true)}</div>
<div class="sc-desk">${mark("wall", true)}
<div class="sc-icons"><span><i></i>${t("Hujjatlar", "Документы")}</span><span><i></i>${t("Rasmlar", "Фото")}</span><span><i></i>${t("Kurs", "Курс")}</span></div>
<div class="wn st-l" id="w-doc" data-k="w-doc"><div class="wn-h"><i></i><i></i><i></i><b>${t("Mening hujjatim", "Мой документ")}</b></div><div class="wn-b"><div class="doc-bar"><span></span><span></span><span></span><span></span></div><p class="doc-t" data-type="4.5 5.1">${t("Ariza", "Заявление")}</p><p class="doc-p" data-type="5.0 6.0">${t("Men, Dilnoza Karimova, ish joyimda kompyuter bilan ishlashni o‘rganmoqdaman. Hujjatni o‘zim yozdim va saqladim.", "Я, Дилноза Каримова, учусь работать на компьютере. Этот документ я набрала и сохранила сама.")}</p></div></div>
<div class="wn st-l" id="w-xls" data-k="w-xls"><div class="wn-h"><i></i><i></i><i></i><b>${t("Oylik xarajat", "Расходы за месяц")}</b></div><div class="wn-b"><div class="xls"><span class="hd">${t("Nima uchun", "Статья")}</span><span class="hd">${t("so‘m", "сум")}</span>${xlsRows.map(([a, b]) => `<span>${a}</span><span class="num">${b}</span>`).join("")}<span class="sm">${t("Jami", "Итого")}</span><span class="sm num">2 050 000</span></div><div class="xls-ch">${[[1, ".9"], [2, ".3"], [3, ".45"], [4, ".15"]].map(([, v]) => `<i style="--v:${v}"></i>`).join("")}</div></div></div>
<div class="wn st-l" id="w-web" data-k="w-web"><div class="wn-h"><i></i><i></i><i></i><b>${t("Brauzer", "Браузер")}</b></div><div class="web-url">${ICON.lock}<span data-type="8.7 9.2">aipply.uz</span></div><div class="web-tiles">${tiles.map(([i, s], k) => `<span style="--k:${k}">${ICON[i]}${s}</span>`).join("")}</div><div class="web-hero">${mark("", true)}<span>Kompyuter savodxonligi + AI</span></div></div>
<div class="wn st-l" id="w-ai" data-k="w-ai"><span class="ai-glow"></span><div class="wn-h"><i></i><i></i><i></i><b>${t("Sun’iy intellekt", "ИИ-помощник")}</b></div><div class="ai-in"><p class="ai-q" data-type="10.9 11.7">${t("Ish uchun qisqa rezyume yozishga yordam ber", "Помоги написать короткое резюме для работы")}</p><div class="ai-a">${t(["<b>Albatta.</b> Avval uchta narsani yozing:", "1. Kim bo‘lib ishlamoqchisiz", "2. Nimani bilasiz va qila olasiz", "3. Qanday ish qilgansiz"], ["<b>Конечно.</b> Сначала напишите три вещи:", "1. Кем хотите работать", "2. Что знаете и умеете", "3. Где уже работали"]).map((s, k) => `<p style="--k:${k}">${s}</p>`).join("")}</div><div class="ai-field">${t("Savolingizni yozing…", "Напишите вопрос…")}</div></div></div>
<div class="wn st-l" id="w-safe" data-k="w-safe"><div class="wn-h"><i></i><i></i><i></i><b>${t("Muhim fayllar", "Важные файлы")}</b></div><div class="safe"><div class="safe-box"><span class="safe-lock"></span></div>${files.map(([x, y]) => `<span class="safe-f" style="--fx:${x}px;--fy:${y}px"></span>`).join("")}</div></div>
<div class="sc-dock st-l" data-k="dock">${dock.map(([k, g, c]) => `<i class="${c}" data-k="i-${k}">${g}</i>`).join("")}</div>
</div>
</div></div>
<div class="lp-base"></div>
</div>
<div class="cert wn st-l" data-k="cert"><small>${t("Sertifikat", "Сертификат")}</small><b>Kompyuter savodxonligi + AI</b><p>${t("Kursni muvaffaqiyatli tugatdi", "успешно окончил(а) курс")}</p><span class="cert-l"></span><svg class="seal" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><g transform="translate(50 50) scale(.12)"><path d="${MK.a}" fill="#0000b0"/><path d="${MK.b}" fill="#0070d0"/><path d="${MK.c}" fill="#00a0e0"/></g></svg></div>
</div>
<div class="st-title" data-k="title"><p>Aipply Academy</p><h2>${t("Kompyuter noldan: kursda nima bo‘ladi", "Компьютер с нуля: что будет на курсе")}</h2></div>
<div class="st-hint" data-k="hint" aria-hidden="true"><span>${t("Pastga suring", "Листайте")}</span><i></i></div>
${beat(1.5, 4, of7(1), LEARN[5][l], t("Kursni tugatib, kompyuterni hech kimga ishingiz tushmaydigan darajada o‘rganib olasiz.", "Окончив курс, вы освоите компьютер так, что больше ни у кого не придётся просить помощи."))}
${beat(4.1, 8.1, of7(2), LEARN[0][l], t("Shaxsiy kompyuteringizga dasturlar o‘rnatib beramiz: uyda ham xuddi darsdagidek ishlaysiz.", "Установим программы на ваш компьютер: дома всё будет так же, как на уроке."))}
${beat(8.3, 9.6, of7(3), LEARN[2][l], t("Bepul Coworking va Wi-Fi.", "Бесплатный коворкинг и Wi-Fi."))}
${beat(9.6, 10.6, of7(4), LEARN[3][l])}
${beat(10.6, 13, of7(5), LEARN[1][l], t("Kurs nomi ham shu: Kompyuter savodxonligi + AI.", "Так и называется курс: Kompyuter savodxonligi + AI."))}
${beat(13.1, 14.7, of7(6), LEARN[4][l])}
${beat(14.8, 16.3, of7(7), LEARN[6][l], t("Kurs davomida 3 ta mahorat darslari va qo‘shimcha darslar.", "За время курса 3 мастер-класса и дополнительные занятия."))}
<div class="st-count st-l" data-k="count"><b class="num" data-k="count-n">0+</b><span>${t("muvaffaqiyatli bitiruvchilar", "успешных выпускников")}</span></div>
${beat(16.6, 19.5, t("Keyingi qadam", "Следующий шаг"), t("Bepul ochiq darsdan boshlang", "Начните с бесплатного открытого урока"), t("Kursga 20% chegirma, darsda kompyuter, istalgan grafik.", "Скидка 20% на курс, компьютер на уроке, любой график."), `<div class="cta" data-line>${tgBtn("btn-sun shim", t("Ochiq darsga yozilish", "Записаться на урок"))}</div>`)}
<div class="st-hud"><span data-hud>01 · Aipply</span><i><b data-bar></b></i><a href="#after-story">${t("O‘tkazib yuborish ↓", "Пропустить ↓")}</a></div>
</div></div>
<div class="st-static"><div class="wrap">${head(t("Kompyuter noldan", "Компьютер с нуля"), t("Kursda nimani o‘rganasiz", "Что изучите на курсе"), "", "", "rise")}<ol class="st-list">${staticList}</ol></div></div>
</section>
<span id="after-story"></span>`;
  }

  /* ── Открытый урок ── */
  function openBlock(full = true) {
    const bars = [["-6%", "12%", "50%", .1, 1.4], ["40%", "30%", "64%", .14, .8], ["-10%", "62%", "44%", .08, 1.8], ["52%", "78%", "56%", .12, 1.1]];
    return `<section class="od" id="ochiq"><div class="od-bg" aria-hidden="true">${bars.map(([x, y, w, o, k]) => `<i data-k="${k}" style="--x:${x};--y:${y};--w:${w};--o:${o}"></i>`).join("")}</div>
<div class="wrap"><div class="od-in">
<div class="rv a-left"><span class="kicker"><i></i>${t("Bepul · birinchi qadam", "Бесплатно · первый шаг")}</span><h2 style="margin-top:12px">${t("Bepul ochiq darsda ishtirok eting", "Приходите на бесплатный открытый урок")}</h2><p class="lead" style="color:hsl(200 100% 92%)">${t("Bir darsda qanday o‘qitishimizni ko‘rasiz. Keyin kursga yozilish yoki yozilmaslikni o‘zingiz hal qilasiz.", "За один урок увидите, как мы учим. Записываться на курс или нет, решаете сами.")}</p></div>
<div class="od-card glass lq rv a-win"><span class="beam" aria-hidden="true"></span><h3>${t("Ochiq darsda qo‘lga kiritasiz", "Что даёт открытый урок")}</h3><ul class="od-gain">${OPEN.map((o) => `<li><b class="num">${o.kUz ? t(o.kUz, o.kRu) : o.k}</b><span>${o[l]}</span></li>`).join("")}</ul>${full ? `<a class="btn btn-sun shim" href="${href("ochiq-dars")}">${t("Ro‘yxatdan o‘tish", "Записаться")}${ICON.arrow}</a>` : ""}</div>
</div></div></section>`;
  }

  /* ── Что изучите: орбиты и список ── */
  function learnBlock() {
    const ring = (k) => LEARN.filter((_, i) => i % 2 === k);
    const orb = (items, rad, tm, rev) => items.map((x, i) => `<span class="orb-i${rev ? " rev" : ""}" style="--rad:${rad}px;--t:${tm}s;--dl:${(-tm * i / items.length).toFixed(2)}s"><span title="${esc(x[l])}">${ICON[x.ic]}</span></span>`).join("");
    return `<section id="dastur"><div class="wrap">
${head(t("Kurs dasturi", "Программа курса"), t("Kursda nimani o‘rganasiz", "Чему научитесь на курсе"), t("Yetti band, aipply.uz saytidagi tartibda. Oxirida sertifikat.", "Семь пунктов, в том же порядке, что на aipply.uz. В конце сертификат."), `<a class="btn btn-ghost btn-sm" href="${href("kurs")}">${t("Batafsil", "Подробнее")} ${ICON.arrow}</a>`)}
<div class="learn">
<div class="orb rv a-pop" aria-hidden="true"><span class="orb-r" style="--in:22%"></span><span class="orb-r" style="--in:4%"></span><span class="orb-c">${mark("", true)}</span>${orb(ring(0), 128, 26, false)}${orb(ring(1), 206, 40, true)}</div>
<ol class="learn-list">${LEARN.map((x, k) => `<li class="rv a-type${x.ic === "cert" ? " cert-li" : ""}" style="--d:${k * 60}ms">${x[l]}</li>`).join("")}</ol>
</div>
</div></section>`;
  }

  /* ── Afzalliklar: бенто ── */
  function plusBlock() {
    const size = ["w2", "", "", "h2", "", "", "", "w2"];
    const tone = ["blue", "", "", "sun", "", "", "", ""];
    const motion = ["win", "key", "slide", "pop", "rise", "key", "slide", "blurin"];
    return `<section class="dark"><div class="wrap">
${head(t("Afzalliklar", "Преимущества"), t("Yana qanday afzalliklar bor?", "Что ещё вы получаете"), t("Sakkizta, aipply.uz saytidagi so‘zlar bilan.", "Восемь пунктов, словами с aipply.uz."))}
<div class="bento">${PLUS.map((p, k) => `<div class="bn ${size[k]} ${tone[k]} rv a-${motion[k]}" style="--d:${(k % 4) * 70}ms"><span class="spot" aria-hidden="true"></span>${k === 0 ? `<div class="pin" aria-hidden="true"><i></i><i></i></div>` : p.n ? `<b class="n num" data-count="${p.n}" data-suf="${p.suf || ""}">${p.n}${p.suf || ""}</b>` : `<span class="ic">${ICON[p.ic]}</span>`}<h3>${p[l][0]}</h3><p>${p[l][1]}</p></div>`).join("")}</div>
</div></section>`;
  }

  function statsBlock() {
    return `<section style="padding-bottom:0"><div class="wrap"><div class="stats rv a-rise">
<div><b class="num" data-count="${F.grads}" data-suf="+">${sp(F.grads)}+</b><span>${t("muvaffaqiyatli bitiruvchilar", "успешных выпускников")}</span></div>
<div><b class="num" data-count="3">3</b><span>${t("mahorat darsi kurs davomida", "мастер-класса за время курса")}</span></div>
<div><b class="num" data-count="20" data-suf="%">20%</b><span>${t("chegirma ochiq darsdan keyin", "скидка после открытого урока")}</span></div>
<div><b class="num">10% + 10%</b><span>${t("do‘stlarga va boshqa kurslarga", "друзьям и на другие курсы")}</span></div>
</div></div></section>`;
  }

  function whereBlock() {
    return `<section><div class="wrap">
${head(t("Joylashuv", "Как добраться"), t("Metro oldidagi qulay joylashuv", "Удобно, у самого метро"), t("Shayxontohur tumani, Bog‘ko‘cha dahasi. Sxema, xarita emas: aniq yo‘lni xaritada oching.", "Шайхантахурский район, массив Богкуча. Это схема, а не карта: точный путь откройте на карте."))}
<div class="where">
<div class="map rv a-pop" aria-hidden="true"><span class="road" style="left:-5%;top:60%;width:110%;transform:rotate(-4deg)"></span><span class="road" style="left:52%;top:-5%;width:14px;height:110%"></span><span class="walk"></span><span class="metro"><b>M</b>${t("Metro", "Метро")}</span><span class="here"><span class="pin"><i></i><i></i></span><span>Aipply Academy</span></span><em>${t("Sxema", "Схема")}</em></div>
<div class="panel rv a-slide"><h3>Aipply Academy</h3><dl><dt>${t("Manzil", "Адрес")}</dt><dd>${ADDR[l]}</dd><dt>${t("Telefon", "Телефон")}</dt><dd><a href="tel:${F.tel}">${F.phone}</a></dd><dt>Telegram</dt><dd><a href="${F.tg}">@aipply_admin_bot</a></dd><dt>${t("Kanal", "Канал")}</dt><dd><a href="${F.channel}">@aipplyacademy</a></dd><dt>Instagram</dt><dd><a href="${F.ig}">@aipply.academy</a></dd></dl>
<div class="cta"><a class="btn btn-main" href="${F.map}">${ICON.map}${t("Xaritada ochish", "Открыть на карте")}</a><a class="btn btn-ghost" href="tel:${F.tel}">${ICON.phone}${t("Qo‘ng‘iroq", "Позвонить")}</a></div></div>
</div>
</div></section>`;
  }

  const OFFERS = [
    ["test", t("Daraja testi", "Тест уровня"), t("Olti savol va natija: «noldan», «boshlang‘ich» yoki «ishonchli». Javoblar arizaga qo‘shiladi.", "Шесть вопросов и итог: «с нуля», «начальный» или «уверенный». Ответы прикладываются к заявке."), t("Prototipda ishlaydi: Kurs sahifasi", "Работает в прототипе: страница «Курс»")],
    ["tg", t("Ariza bitta xabar bo‘lib", "Заявка одним сообщением"), t("Kun, vaqt, daraja, kompyuter bormi: administrator qayta so‘ramaydi. Hozir saytda shakl alohida sahifada.", "День, время, уровень, есть ли компьютер: администратору не нужно переспрашивать. Сейчас форма на сайте на отдельной странице."), t("Prototipda ishlaydi", "Работает в прототипе")],
    ["translate", t("Rus tilidagi versiya", "Русская версия"), t("Toshkentda kompyuter kursini rus tilida ham qidirishadi. Hozir sayt faqat o‘zbek tilida.", "В Ташкенте компьютерные курсы ищут и по-русски. Сейчас сайт только на узбекском."), t("Prototipda bor: UZ / RU", "Есть в прототипе: UZ / RU")],
    ["bot", t("Dars oldidan eslatma", "Напоминание перед уроком"), t("Yozilgan odamga bot dars kuni xabar yuboradi: kelmay qolganlar kamayadi.", "Бот пишет записавшемуся в день урока: меньше тех, кто забыл и не пришёл."), t("Saytdan tashqari: Telegram-bot", "Сверх сайта: Telegram-бот")],
    ["card", t("Saytdan to‘lov", "Оплата на сайте"), t("Ochiq darsdan keyin kursni Click yoki Payme orqali to‘lash, 20% chegirma o‘zi hisoblanadi.", "После открытого урока курс можно оплатить через Click или Payme, скидка 20% считается сама."), t("Saytdan tashqari", "Сверх сайта")],
    ["search", t("Qidiruv uchun sahifalar", "Страницы под поиск"), t("«Kompyuter kursi Shayxontohur», «Excel kursi Toshkent»: har biriga o‘z sahifasi.", "«Компьютерные курсы Шайхантахур», «курсы Excel Ташкент»: под каждый запрос своя страница."), t("Saytdan tashqari", "Сверх сайта")],
  ];
  function offerBlock(title = true) {
    return `<section class="dark" id="taklif"><div class="wrap">
${title ? head(`<span class="ours">${t("Taklif DevUz Studio", "Предложение DevUz Studio")}</span>`, t("Saytga nimani qo‘shamiz", "Что добавить сайту"), t("Bularning aipply.uz’da hozircha yo‘q. Har biri sizda bor narsadan o‘sadi.", "Этого на aipply.uz пока нет. Каждое растёт из того, что у вас уже есть.")) : ""}
<div class="offer">${OFFERS.map(([i, h, p, s], k) => `<div class="of rv a-${["win", "key", "slide"][k % 3]}" style="--d:${(k % 3) * 90}ms"><span class="spot" aria-hidden="true"></span><span class="beam hov" aria-hidden="true"></span><span class="ic">${ICON[i]}</span><h3>${h}</h3><p>${p}</p><small>${s}</small></div>`).join("")}</div>
</div></section>`;
  }

  const finalBlock = () => `<section class="final"><div class="wrap"><div class="box rv a-pop"><div class="ripple" aria-hidden="true">${[[180, .1, 0], [300, .08, .2], [420, .06, .4], [560, .045, .6], [720, .03, .8]].map(([s, o, dl]) => `<i style="--s:${s}px;--o:${o};--dl:${dl}s"></i>`).join("")}</div>
<h2>${t(["Kompyuterni", "birga", "o‘rganamiz"], ["Освоим", "компьютер", "вместе"]).map((w, i) => `<span class="tw" style="--i:${i}">${w}</span>`).join(" ")}</h2>
<p class="sub" style="margin-top:12px">${t("Bepul ochiq darsdan boshlang: kursga 20% chegirma, darsda kompyuter beriladi, grafikni o‘zingiz tanlaysiz.", "Начните с бесплатного открытого урока: скидка 20% на курс, компьютер на уроке, график выбираете сами.")}</p>
<div class="cta">${tgBtn("btn-sun shim", t("Ochiq darsga yozilish", "Записаться на урок"))}<a class="btn btn-ghost" href="tel:${F.tel}">${ICON.phone}${F.phone}</a></div>
</div></div></section>`;

  function phead(crumb, kicker, h1, lead) {
    return `<section class="phead"><div class="wrap">
<ol class="crumbs"><li><a href="${href()}">Aipply Academy</a></li><li aria-current="page">${crumb}</li></ol>
${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h1 style="margin-top:12px">${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}
</div></section>`;
  }

  /* ── Страницы ── */
  function home() {
    return shell({
      title: t("Aipply Academy · Kompyuter savodxonligi + AI kursi, Toshkent", "Aipply Academy · курс «Компьютерная грамотность + AI», Ташкент"),
      desc: t("Kompyuter savodxonligi va sun’iy intellekt kursi Shayxontohurda, metro oldida. 3000+ bitiruvchi, sertifikat, bepul ochiq dars.", "Курс компьютерной грамотности и ИИ в Шайхантахуре, у метро. 3000+ выпускников, сертификат, бесплатный открытый урок."),
    }, `${heroBlock()}
${storyBlock()}
${statsBlock()}
${openBlock()}
${learnBlock()}
${plusBlock()}
${whereBlock()}
${offerBlock()}
${finalBlock()}`);
  }

  function kurs() {
    const PL = t(
      ["Ofis dasturlari bilan ishlaysiz: hujjat, jadval, taqdimot.", "Sun’iy intellektdan ish va o‘qish uchun foydalanasiz.", "Internet va brauzerlar bilan ishonchli ishlaysiz.", "Vaqtingizni tejovchi foydali saytlarni bilib olasiz.", "Ma’lumotlarni xavfsiz saqlashni o‘rganasiz.", "Kompyuterdan to‘g‘ri foydalanishni o‘rganasiz.", "Kurs so‘ngida sertifikatga ega bo‘lasiz."],
      ["Работаете в офисных программах: документы, таблицы, презентации.", "Применяете ИИ для работы и учёбы.", "Уверенно пользуетесь интернетом и браузерами.", "Узнаёте полезные сайты, которые экономят время.", "Учитесь надёжно хранить свои данные.", "Учитесь правильно пользоваться компьютером.", "В конце курса получаете сертификат."],
    );
    /* Тест: вопросы о том, что человек уже умеет; баллы 0-2 за ответ. */
    const Q = t(
      [["Kompyuterni o‘zingiz yoqib, kerakli faylni topasizmi?", ["Yo‘q", "Ba’zan", "Ha"]], ["Hujjat yozib, saqlab, Telegramda yubora olasizmi?", ["Yo‘q", "Yordam bilan", "Ha"]], ["Jadvalda raqamlarni qo‘shib, jami chiqara olasizmi?", ["Yo‘q", "Eshitganman", "Ha"]], ["Sun’iy intellektga savol berib ko‘rganmisiz?", ["Yo‘q", "Bir-ikki marta", "Doim"]], ["Parolingiz va muhim fayllaringiz qayerda ekanini bilasizmi?", ["Yo‘q", "Taxminan", "Ha"]], ["Yangi dasturni o‘zingiz o‘rnatasizmi?", ["Yo‘q", "Qiyin", "Ha"]]],
      [["Сами включаете компьютер и находите нужный файл?", ["Нет", "Иногда", "Да"]], ["Наберёте документ, сохраните и отправите в Telegram?", ["Нет", "С помощью", "Да"]], ["Сложите числа в таблице и выведете итог?", ["Нет", "Слышал(а)", "Да"]], ["Задавали вопрос ИИ?", ["Нет", "Пару раз", "Постоянно"]], ["Знаете, где ваши пароли и важные файлы?", ["Нет", "Примерно", "Да"]], ["Устанавливаете новую программу сами?", ["Нет", "Сложно", "Да"]]],
    );
    const FAQ = t(
      [["Kompyuterim yo‘q. Baribir o‘qisam bo‘ladimi?", "Ha. Ochiq darsda foydalanish uchun kompyuter beriladi. Keyin xarid qilmoqchi bo‘lsangiz, tanlashda yordam beramiz va kerakli dasturlarni o‘rnatib beramiz."], ["Ishlayman, darsga qachon kelaman?", "Istalgan dars grafigi bo‘yicha o‘qish mumkin. Qulay kun va vaqtni arizada belgilang, administrator guruhni aytadi."], ["Kurs narxi qancha?", "Narxni administrator aytadi: saytda hozircha yozilmagan. Ochiq darsda qatnashganlarga kursga 20% chegirma, do‘stingizga yana 10%."], ["Kurs oxirida nima beriladi?", "Kurs so‘ngida sertifikat. Kurs davomida 3 ta mahorat darsi va qo‘shimcha darslar bo‘ladi."], ["Qayerda joylashgansiz?", `${ADDR.uz}. Metro oldida. Bepul Coworking va Wi-Fi bor.`]],
      [["Нет своего компьютера. Можно учиться?", "Да. На открытом уроке компьютер дают. Захотите купить свой, поможем выбрать и установим нужные программы."], ["Я работаю, когда приходить?", "Можно учиться по любому удобному графику. Отметьте день и время в заявке, администратор назовёт группу."], ["Сколько стоит курс?", "Цену назовёт администратор: на сайте её пока нет. Тем, кто был на открытом уроке, скидка 20% на курс, другу ещё 10%."], ["Что в конце курса?", "Сертификат. За время курса 3 мастер-класса и дополнительные занятия."], ["Где вы находитесь?", `${ADDR.ru}. У метро. Есть бесплатный коворкинг и Wi-Fi.`]],
    );
    return shell({
      title: t("Kurs dasturi: Kompyuter savodxonligi + AI | Aipply Academy", "Программа курса «Компьютерная грамотность + AI» | Aipply Academy"),
      desc: t("Ofis dasturlari, sun’iy intellekt, internet, foydali saytlar, ma’lumotlarni saqlash, sertifikat. Darajangizni bilish testi.", "Офисные программы, ИИ, интернет, полезные сайты, хранение данных, сертификат. Тест «какой у вас уровень»."),
    }, `${phead(NAMES.kurs, "Kompyuter savodxonligi + AI", t("Kursda nimani o‘rganasiz", "Чему научитесь на курсе"), t("Yetti band, aipply.uz saytidagi tartibda. Kurs davomida 3 ta mahorat darsi va qo‘shimcha darslar.", "Семь пунктов в том же порядке, что на aipply.uz. За время курса 3 мастер-класса и дополнительные занятия."))}
<section style="padding-top:0"><div class="wrap"><ol class="prog">${LEARN.map((x, k) => `<li class="rv a-${["win", "key", "slide", "rise", "key", "win", "flip"][k]}${k === 6 ? " last" : ""}" style="--d:${(k % 2) * 60}ms"><h3>${x[l]}</h3><p>${PL[k]}</p></li>`).join("")}</ol>
<p class="src" style="margin-top:16px">${t("Sarlavhalar aipply.uz saytidan. Ostidagi bir qatorli izohni biz yozdik; «hujjat, jadval, taqdimot» ofis dasturlari nimani anglatishini tushuntiradi.", "Заголовки с aipply.uz. Однострочные пояснения под ними написали мы; «документы, таблицы, презентации» поясняют, что такое офисные программы.")}</p></div></section>
<section style="padding-top:0" data-addon="test"><div class="wrap">
${head(`<span class="ours">${t("Taklif DevUz Studio", "Предложение DevUz Studio")}</span>`, t("Darajangizni bilib oling", "Узнайте свой уровень"), t("Olti savol, bir daqiqa. Natija ariza bilan birga Telegramga ketadi: administrator nimadan boshlashni biladi.", "Шесть вопросов, одна минута. Итог уходит в Telegram вместе с заявкой: администратор знает, с чего начать."))}
<div class="test rv a-win" id="test"><div class="test-top"><span>${t("Test", "Тест")}</span><span id="t-n" class="num"></span></div><div class="test-bar"><i></i></div>
${Q.map(([q, o], k) => `<div class="tq"${k ? " hidden" : ""}><h3>${q}</h3><div class="tq-o">${o.map((x, v) => `<button type="button" data-v="${v}">${x}</button>`).join("")}</div></div>`).join("")}
<div class="t-res" id="t-res" hidden><small>${t("Sizning darajangiz", "Ваш уровень")}</small><b id="t-lv"></b><p id="t-tx"></p><div class="cta"><a class="btn btn-sun shim" id="t-go" href="${F.tg}">${ICON.tg}${t("Natija bilan ochiq darsga yozilish", "Записаться на урок с итогом")}</a><button class="btn btn-ghost" type="button" id="t-re">${t("Qaytadan", "Ещё раз")}</button></div></div>
</div></div></section>
<section style="padding-top:0"><div class="wrap">${head(t("Savollar", "Вопросы"), t("Ko‘p so‘raladigan savollar", "Частые вопросы"), t("Javoblar aipply.uz saytidagi gaplardan.", "Ответы собраны из того, что написано на aipply.uz."))}<div class="faq">${FAQ.map(([q, a], k) => `<details class="rv a-type" style="--d:${k * 50}ms"${k === 0 ? " open" : ""}><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></div></section>
${openBlock()}
${finalBlock()}`);
  }

  function ochiq() {
    const radio = (name, vals) => `<div class="opts">${vals.map((v) => `<label class="opt"><input type="radio" name="${name}" value="${v}"><span>${v}</span></label>`).join("")}</div>`;
    return shell({
      title: t("Bepul ochiq darsga yozilish | Aipply Academy", "Запись на бесплатный открытый урок | Aipply Academy"),
      desc: t("Kun va vaqtni tanlang, ariza Telegramga ketadi. Ochiq darsda kursga 20% chegirma va darsda kompyuter.", "Выберите день и время, заявка уйдёт в Telegram. На открытом уроке скидка 20% на курс и компьютер на уроке."),
    }, `${phead(NAMES["ochiq-dars"], t("Bepul", "Бесплатно"), t("Bepul ochiq darsga yozilish", "Запись на бесплатный открытый урок"), t("Qulay kun va vaqtni belgilang, ariza Aipply Academy Telegramiga bitta xabar bo‘lib ketadi. Administrator qo‘ng‘iroq qilib, guruhni aytadi.", "Отметьте удобный день и время, заявка уйдёт в Telegram Aipply Academy одним сообщением. Администратор перезвонит и назовёт группу."))}
<section style="padding-top:0"><div class="wrap"><div class="book">
<form id="book" novalidate>
<fieldset class="step rv a-win"><h3><i>1</i>${t("Qachon qulay", "Когда удобно")}</h3>${radio("day", t(["Ish kunlari", "Shanba", "Yakshanba"], ["Будни", "Суббота", "Воскресенье"]))}${radio("tm", t(["Ertalab", "Kunduzi", "Kechqurun"], ["Утром", "Днём", "Вечером"]))}
<p class="src">${t("Istalgan dars grafigi bo‘yicha o‘qish mumkin: aniq vaqtni administrator bilan kelishasiz.", "Учиться можно по любому графику: точное время согласуете с администратором.")}</p></fieldset>
<fieldset class="step rv a-win"><h3><i>2</i>${t("Darajangiz", "Ваш уровень")}</h3>${radio("lv", t(["Noldan", "Boshlang‘ich", "Ishonchli"], ["С нуля", "Начальный", "Уверенный"]))}${radio("pc", t(["Kompyuterim bor", "Kompyuterim yo‘q", "Sotib olmoqchiman"], ["Компьютер есть", "Компьютера нет", "Хочу купить"]))}
<p class="src"><a href="${href("kurs")}#test">${t("Darajani bilmaysizmi? Bir daqiqalik test", "Не знаете уровень? Тест на минуту")}</a></p></fieldset>
<fieldset class="step rv a-win"><h3><i>3</i>${t("Sizga qanday murojaat qilamiz", "Как к вам обращаться")}</h3>
<div class="two"><div class="field"><label for="b-nm">${t("Ism", "Имя")}</label><input id="b-nm" type="text" autocomplete="name" maxlength="60"></div><div class="field"><label for="b-ph">${t("Telefon", "Телефон")}</label><input id="b-ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998" maxlength="20"></div></div>
<div class="field"><label for="b-wish">${t("Savolingiz bo‘lsa", "Если есть вопрос")}</label><textarea id="b-wish" maxlength="400"></textarea></div>
<button class="btn btn-sun shim" type="submit" style="width:100%;margin-top:16px">${ICON.tg}${t("Telegram orqali yuborish", "Отправить в Telegram")}</button>
<p class="err" id="err" role="alert" hidden></p><p class="done" id="done" role="status" hidden></p></fieldset>
</form>
<aside class="sum"><div class="panel rv a-slide" data-addon="tg"><h3>${t("Xabar Aipply Academy’ga shunday tushadi", "Так сообщение придёт в Aipply Academy")}</h3><div class="msg"><div class="msg-h">${ICON.tg}Telegram · Aipply Academy</div><span id="msg"></span><time id="msg-t"></time></div>
<p class="src">${t("Tugma matnni nusxalaydi va @aipply_admin_bot’ni ochadi: kanalingizda «Murojaat uchun» deb shu yozilgan. Arizani boshqa akkaunt qabul qilsa, shuni qo‘yamiz.", "Кнопка копирует текст и открывает @aipply_admin_bot: в вашем канале он указан «для обращений». Если заявки принимает другой аккаунт, поставим его.")}</p></div>
<div class="panel rv a-slide" style="--d:80ms;margin-top:16px"><h3>${t("Yoki qo‘ng‘iroq qiling", "Или позвоните")}</h3><p class="sub">${ADDR[l]}. ${t("Metro oldida.", "У метро.")}</p><div class="cta"><a class="btn btn-main" href="tel:${F.tel}">${ICON.phone}${F.phone}</a></div></div></aside>
</div></div></section>
${openBlock(false)}`);
  }

  function plan() {
    const all = [...ADDONS, ...BLOCKS];
    const total = KIT_BASE.price + all.reduce((s, a) => s + a.price, 0);
    const ba = (old, nu, cap, side) => `<figure class="rv a-rise"><div class="ba-box" data-ba><img src="${IMG}/${nu}" alt="${t("Aipply Academy yangi sayti prototipi", "Прототип нового сайта Aipply Academy")}" loading="lazy"><div class="was"><img src="${IMG}/${old}" alt="${t("aipply.uz bugun", "aipply.uz сегодня")}" loading="lazy"></div><span class="tag a">${t("aipply.uz bugun", "aipply.uz сегодня")}</span><span class="tag b">${t("prototip", "прототип")}</span><div class="knob"><i>${ICON.arrows}</i></div><input type="range" min="0" max="100" value="50" aria-label="${t("Pardani surish", "Сдвинуть шторку")}"></div><figcaption><span>${cap}</span><span>${side}</span></figcaption></figure>`;
    const pv = {
      admin: [[t("Guruh: kechki, ish kunlari", "Группа: вечерняя, будни"), "18:30"], [t("Yangi ariza Telegramdan", "Новая заявка из Telegram"), t("Noldan", "С нуля")], [t("Chegirma ochiq darsdan keyin", "Скидка после открытого урока"), "20%"]],
      bot: [[t("Ochiq darsga yozildi", "Записался на открытый урок"), t("shanba, ertalab", "суббота, утро")], [t("Eslatma", "Напоминание"), t("dars kuni", "в день урока")], [t("Guruh boshlanmoqda", "Старт группы"), t("xabar", "сообщение")]],
      pay: [["Click", t("ulanadi", "подключается")], ["Payme", t("ulanadi", "подключается")], [t("Ochiq darsdan keyin", "После открытого урока"), "−20%"]],
      crm: [[t("Bitim AmoCRM’da", "Сделка в AmoCRM"), t("kechqurun · noldan", "вечер · с нуля")], [t("Manba", "Источник"), t("Instagram · ochiq dars", "Instagram · открытый урок")]],
      seo: [[t("kompyuter kursi Shayxontohur", "компьютерные курсы Шайхантахур"), t("sahifa", "страница")], [t("excel kursi toshkent", "курсы excel ташкент"), t("sahifa", "страница")], [t("sun’iy intellekt kursi", "курсы по ИИ"), t("sahifa", "страница")]],
      blog: [[t("Sun’iy intellektga qanday savol berish", "Как задать вопрос ИИ"), t("maqola", "статья")], [t("Faylni qanday saqlash", "Как сохранить файл"), t("video", "видео")]],
    };
    const comp = t(
      [["Bepul birinchi dars", "PROWEB kompyuter savodxonligi bo‘yicha 60-90 daqiqalik bepul ochiq dars beradi, IT STEP «majburiyatsiz» sinov darsi. Sizda ochiq dars bor: biz uni har ekranda asosiy tugma qildik."], ["Daraja testi", "Kosmos IT Maktabi master-klassdan oldin qisqa test beradi, IT Park ro‘yxatdan o‘tishda darajani so‘raydi. Biz olti savollik testni telefonsiz qildik, natija arizaga qo‘shiladi."], ["Har kimga kompyuter", "IT STEP va Yunusoboddagi kurs «har bir o‘quvchiga shaxsiy kompyuter» deb yozadi. Sizda «darsda kompyuter beriladi» bor: endi u birinchi ekranda."], ["Natija raqamda", "BePro IT Academy 8000 ga yaqin bitiruvchisini aytadi. Sizning 3000+ birinchi ekranda va kurs voqeasi oxirida sanaladi."], ["Narx va jadval", "Yunusoboddagi kurs narxi 850 000 so‘m, 14 dars, haftasiga 3 marta deb yozadi. Sizda narx yo‘q: «narxni administrator aytadi» deb yozdik, raqam o‘ylab topmadik. Narxni bersangiz, qo‘yamiz."], ["Ikki til", "PROWEB saytida o‘zbek va rus tili bor. Prototip ham ikki tilda."]],
      [["Бесплатный первый урок", "PROWEB даёт бесплатный открытый урок по компьютерной грамотности на 60-90 минут, IT STEP пробный урок «без обязательств». У вас открытый урок есть: мы сделали его главной кнопкой на каждом экране."], ["Тест уровня", "Kosmos IT Maktabi даёт короткий тест перед мастер-классом, IT Park спрашивает уровень при записи. Мы сделали тест на шесть вопросов без телефона, итог прикладывается к заявке."], ["Компьютер каждому", "IT STEP и курс в Юнусабаде пишут «у каждого ученика свой компьютер». У вас есть «компьютер на уроке»: теперь он на первом экране."], ["Результат цифрой", "BePro IT Academy называет около 8000 выпускников. Ваши 3000+ на первом экране и считаются в конце истории курса."], ["Цена и расписание", "Курс в Юнусабаде пишет: 850 000 сум, 14 занятий, 3 раза в неделю. У вас цены нет: мы написали «цену назовёт администратор» и цифру не выдумывали. Дадите цену, поставим."], ["Два языка", "У PROWEB сайт на узбекском и русском. Прототип тоже на двух языках."]],
    );
    return shell({
      title: t("Keyingi qadam: oldin va keyin, sayt konstruktori | Aipply Academy", "Что дальше: было и стало, конструктор сайта | Aipply Academy"),
      desc: t(`Oldin va keyin: aipply.uz bugun va prototip. Konstruktor: sayt ${sp(KIT_BASE.price)} $, hamma qo‘shimchalar bilan ${sp(total)} $.`, `Было и стало: aipply.uz сегодня и прототип. Конструктор: сайт ${sp(KIT_BASE.price)} $, со всеми допами ${sp(total)} $.`),
    }, `${phead(NAMES.plan, `<span class="ours">${t("Aipply Academy uchun DevUz Studio taklifi", "Предложение DevUz Studio для Aipply Academy")}</span>`, t("Oldin va keyin", "Было и стало"), t("Chapda aipply.uz bugun, o‘ngda shu prototip. Pardani suring.", "Слева aipply.uz сегодня, справа этот прототип. Тяните шторку."))}
<section style="padding-top:0"><div class="wrap">
<div class="ba">
${ba("ba-old-d.webp", "ba-new-d.webp", t("Kompyuter · birinchi ekran", "Компьютер · первый экран"), t("oldin: hamma gap bir ustunda", "было: всё в одной колонке"))}
${ba("ba-old-m.webp", "ba-new-m.webp", t("Telefon · birinchi ekran", "Телефон · первый экран"), t("oldin: sarlavha mayda", "было: мелкий заголовок"))}
</div>
<div class="grid3" style="margin-top:48px">
<div class="note rv a-rise"><h3>${t("Oldin: ro‘yxat raqamlar bilan", "Было: списки с номерами")}</h3><p>${t("Afzalliklar va dastur «1. 2. 3.» ro‘yxati bo‘lib turadi, ko‘z ushlaydigan joy yo‘q. Kurs nimadan iboratini o‘qish kerak, ko‘rib bo‘lmaydi.", "Преимущества и программа стоят нумерованными списками «1. 2. 3.», глазу не за что зацепиться. Из чего состоит курс, надо вычитывать, увидеть нельзя.")}</p></div>
<div class="note rv a-rise" style="--d:90ms"><h3>${t("Oldin: ariza alohida sahifada", "Было: форма на отдельной странице")}</h3><p>${t("«Ro‘yxatdan o‘tish» boshqa sahifaga olib boradi, u yerda yana bir shakl. Har qadamda odam yo‘qoladi.", "«Ro‘yxatdan o‘tish» ведёт на другую страницу, там ещё одна форма. На каждом шаге люди теряются.")}</p></div>
<div class="note rv a-rise" style="--d:180ms"><h3>${t("Keyin: ochiq dars barmoq ostida", "Стало: открытый урок под пальцем")}</h3><p>${t("Qizil «Ro‘yxatdan o‘tish» yaxshi edi: endi u telefonda doim pastda turadi. Kun, vaqt va daraja bitta xabar bo‘lib Telegramingizga tushadi.", "Красная «Ro‘yxatdan o‘tish» была хорошей идеей: теперь на телефоне кнопка всегда внизу. День, время и уровень приходят вам в Telegram одним сообщением.")}</p></div>
</div>
</div></section>
<section id="konstruktor" style="padding-top:0"><div class="wrap">
${head(t("Loyiha konstruktori", "Конструктор проекта"), t("Saytni byudjetingizga yig‘ing", "Соберите сайт под свой бюджет"), t(`Sayt ${sp(KIT_BASE.price)} $. Qolganini tugma bilan yoqasiz: blok sahifada va ko‘rinishda chiqadi, jami qayta hisoblanadi. Hamma qo‘shimchalar bilan ${sp(total)} $, aniq narxni suhbatdan keyin aytamiz.`, `Сайт стоит ${sp(KIT_BASE.price)} $. Остальное включается тумблером: блок появляется на странице и в превью, итог пересчитывается. Со всеми допами ${sp(total)} $, точные цены назовём после разговора.`))}
<div class="kit">
<div class="kit-list">
<div class="kit-base"><div><b>${KIT_BASE[l].t}</b><p>${KIT_BASE[l].d}</p></div><span class="kit-price num">${usd(KIT_BASE.price)}</span></div>
<h3 class="kit-g">${t("Sahifalardagi qo‘shimchalar", "Допы на страницах")}</h3>
${ADDONS.map((a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="" data-def checked><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}</b><small>${a[l].e}</small></span><span class="kit-price num">${usd(a.price)}</span></label>`).join("")}
${Object.keys(GROUPS).map((g) => `<h3 class="kit-g">${t("Saytdan tashqari", "Сверх сайта")} · ${GROUPS[g][l]}</h3>${BLOCKS.filter((b) => b.group === g).map((b) => `<label class="kit-row"><input type="checkbox" data-k="${b.id}" data-p="${b.price}" data-needs="${b.needs.join(" ")}"${b.star ? " data-def checked" : ""}><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${b[l].t}</b><small>${b[l].why}</small><span class="kit-li">${b[l].li.map((x) => `<em>${x}</em>`).join("")}</span>${b.needs.length ? `<span class="kit-need">${t("Birga yoqiladi", "Включает")}: ${b.needs.map((n) => all.find((x) => x.id === n)[l].t).join(", ")}</span>` : ""}</span><span class="kit-price num">${usd(b.price)}</span></label>`).join("")}`).join("")}
</div>
<div class="kit-side">
<div aria-live="polite">${BLOCKS.map((b) => `<div class="kit-pv" data-pv="${b.id}" hidden><b>${b[l].t}</b>${pv[b.pv].map(([a, c]) => `<div class="pv-row"><span>${a}</span><b>${c}</b></div>`).join("")}</div>`).join("")}</div>
<div class="kit-total"><small>${t("Sayt bilan jami", "Итого с сайтом")}</small><b class="num" id="kit-sum"></b><small id="kit-n"></small><a class="btn btn-sun" href="https://t.me/Devuz_studio_bot?start=aipply">${ICON.tg}${t("DevUz Studio bilan muhokama qilish", "Обсудить с DevUz Studio")}</a></div>
</div>
</div>
</div></section>
<section id="konkurentlar" style="padding-top:0"><div class="wrap">
${head(t("Raqobatchilardan nima oldik", "Что взяли у конкурентов"), t("Toshkentdagi kompyuter kurslarining kuchli tomonlari", "Сильное у компьютерных курсов Ташкента"), COMP_LEAD[l])}
<div class="grid3">${comp.map(([h, p], k) => `<div class="note rv a-rise" style="--d:${(k % 3) * 80}ms"><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>
${offerBlock(true)}
<section id="foto"><div class="wrap">
${head(t("Prototipdagi rasmlar", "Снимки в прототипе"), t("Rasmlar qayerdan", "Откуда изображения"), t("Ustoz surati noutbuk bilan va logotip aipply.uz saytidan. Noutbuk, oynalar, sertifikat, xarita sxemasi va fondagi chiziqlar kod bilan chizilgan. Neyrotarmoq hech narsa chizmagan.", "Снимок преподавателя с ноутбуком и логотип взяты с aipply.uz. Ноутбук, окна, сертификат, схема и полосы на фоне нарисованы кодом. Нейросетью ничего не рисовали."))}
<ul class="credits"><li>${t("Ustoz surati: aipply.uz bosh sahifasi, «Texnik bilimlaringizni rivojlantiring!»", "Снимок преподавателя: главная aipply.uz, «Texnik bilimlaringizni rivojlantiring!»")}</li><li>${t("Belgining uch chizig‘i aipply.uz logotipidan kod bilan qayta chizilgan.", "Три полосы знака перерисованы кодом по логотипу aipply.uz.")}</li><li>${t("«Kompyuter noldan» voqeasidagi hujjat, jadval va savol namunalari o‘ylab topilgan: bu dars namunasi, akademiya haqidagi gap emas.", "Документ, таблица и вопрос в истории «Компьютер с нуля» придуманы: это пример урока, а не сведения об академии.")}</li><li>${t("Harakat 21st.dev’dagi ochiq komponentlar asosida (MIT litsenziyasi), kod o‘zimizniki: Text Effect, Word Rotate, Shimmer Button, Animated Grid Pattern, Marquee, Dock, Typing Animation, Number Ticker, Orbiting Circles, Bento Grid, Magic Card, Border Beam, Dot Pattern, Ripple, Accordion, Blur Fade.", "Движение сделано по мотивам открытых компонентов с 21st.dev (лицензия MIT), код свой: Text Effect, Word Rotate, Shimmer Button, Animated Grid Pattern, Marquee, Dock, Typing Animation, Number Ticker, Orbiting Circles, Bento Grid, Magic Card, Border Beam, Dot Pattern, Ripple, Accordion, Blur Fade.")}</li></ul>
</div></section>`);
  }

  return { "": home, kurs, "ochiq-dars": ochiq, plan }[path]();
}

/* Кого смотрели — дополняется по исследованию (docs/research/aipply.md). */
const COMP_LEAD = {
  uz: "Ko‘rib chiqdik: PROWEB, IT STEP, Kosmos IT Maktabi, BePro IT Academy, IT Park IT-markazlari, Yunusoboddagi «Kompyuter savodxonligi» kursi va Mohirdev.",
  ru: "Смотрели PROWEB, IT STEP, Kosmos IT Maktabi, BePro IT Academy, IT-центры IT Park, курс «Компьютерная грамотность» в Юнусабаде и Mohirdev.",
};

const out = {};
for (const l of ["uz", "ru"]) for (const p of PAGES) out[(l === "ru" ? "ru" + (p ? "/" : "") : "") + p] = build(l, p);
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
writeFileSync(bundleDir + "aipply.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(main)").padEnd(14), v.length);
