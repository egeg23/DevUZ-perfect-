import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { ADDONS, BASE as KIT_BASE, BLOCKS, GROUPS } from "./plan.mjs";

/*
 * Прототип AUTOMECHANIC (automechanic.uz): пять страниц на двух языках,
 * офлайн-страница, манифест и service worker — «сайт как приложение».
 * Исследование — docs/research/autoservice-tashkent.md, фото — SOURCES.md.
 *
 * Всё о компании — только с её сайта (снимки веб-архива 2021–2022, сейчас
 * сайт не открывается): услуги, адрес, ориентир, телефоны, часы, «с 1991
 * года», партнёры по маслам. Цен, гарантии и отзывов на их сайте не было —
 * на их месте устройство страницы, а не числа.
 */

const DIR = new URL(".", import.meta.url).pathname;
const CSS = readFileSync(DIR + "style.css", "utf8").replace(/\n/g, "");
const JS = readFileSync(DIR + "client.js", "utf8");
const SW = readFileSync(DIR + "sw.js", "utf8");
const BASE = "__PROTO_BASE__";
const IMG = "/protos/automechanic";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Oswald:wght@700&display=swap";

const usd = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, path = "") => BASE + (l === "uz" ? "/uz" : "") + (path ? "/" + path : "");

/* ── Факты с их сайта ─────────────────────────────────────────────────── */
const F = {
  name: "AUTOMECHANIC",
  phoneM: "+998 90 965 61 31",
  telM: "tel:+998909656131",
  phoneO: "+998 71 276 44 31",
  telO: "tel:+998712764431",
  tg: "https://t.me/+998909656131",
  mail: "tadjiyev_u@mail.ru",
  addr: { ru: "Ташкент, Чиланзарский район, 10 квартал, дом 23/1", uz: "Toshkent, Chilonzor tumani, 10-kvartal, 23/1-uy" },
  mark: { ru: "автостоянка № 75", uz: "75-son avtoturargoh" },
  hours: { ru: "Пн–Сб, 09:00–18:00", uz: "Du–Sh, 09:00–18:00" },
  off: { ru: "воскресенье — выходной", uz: "yakshanba — dam olish kuni" },
};
const MAPQ = encodeURIComponent("Ташкент, Чиланзар, 10 квартал, 23/1");
const YMAP = `https://yandex.uz/maps/?text=${MAPQ}`;
const GMAP = `https://www.google.com/maps/search/?api=1&query=${MAPQ}`;

/* Логотип DevUz Studio для заставки — тот же, что у bloger.agency. */
const DZLOGO = '<svg class="dz-logo" viewBox="-120 -120 240 240" aria-hidden="true"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-120" y="-120" width="240" height="240" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z" fill="url(#dzg)" mask="url(#dzc)"/><rect x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>';

/* Иконки — контуры 24×24, по смыслу. */
const I = (d, w = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  tg: I('<path d="M21 4 3 11l6 2.5M21 4l-3.5 16-8.5-6.5M21 4 9 13.5V19l3-3.5"/>'),
  home: I('<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  wrench: I('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8V20h3.2l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'),
  cal: I('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>', 2),
  down: I('<path d="m6 9 6 6 6-6"/>'),
  arrows: I('<path d="m9 7-5 5 5 5M15 7l5 5-5 5"/>', 2),
  car: I('<path d="M5 16H3v-4l2-5h14l2 5v4h-2"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/><path d="M9.5 16.5h5M5 12h14"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>', 2),
  share: I('<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
};

/* ── Услуги — их слова с их страниц ───────────────────────────────────── */
const SERVICES = [
  {
    id: "dvs", photo: "s-dvs", a: "engine",
    ru: { t: "Ремонт двигателя", d: "Капитальный ремонт — максимально полное восстановление заводских характеристик двигателя.", li: ["Разборка, очистка и дефектовка: замеры, зазоры, проверка на трещины", "Ремонт головки блока и блока цилиндров", "Расточка, хонингование, замена поршней и колец", "Сборка, первый запуск, настройка зажигания и питания"], x: "Когда пора: нагар на свечах, растёт расход масла, сизый дым, теряется мощность, стуки." },
    uz: { t: "Dvigatel ta’miri", d: "Kapital ta’mir — dvigatelning zavod ko‘rsatkichlarini imkon qadar to‘liq tiklash.", li: ["Qismlarga ajratish, tozalash va nuqsonlarni aniqlash: o‘lchovlar, tirqishlar, yoriqlarni tekshirish", "Blok kallagi va silindrlar blokini ta’mirlash", "Yo‘nish, xoninglash, porshen va halqalarni almashtirish", "Yig‘ish, birinchi ishga tushirish, o‘t oldirish va ta’minotni sozlash"], x: "Qachon vaqti keldi: shamlarda qurum, moy sarfi oshadi, ko‘kish tutun, quvvat pasayadi, taqillash." },
  },
  {
    id: "svarka", photo: "s-svarka", a: "flash",
    ru: { t: "Аргонная сварка", d: "Сварка без контакта с воздухом: металл не окисляется, швы прочные и аккуратные.", li: ["Алюминий", "Легированные стали", "Титан и другие сплавы", "Современные аппараты точно держат глубину проплавления"] },
    uz: { t: "Argon payvandlash", d: "Havo bilan aloqasiz payvandlash: metall oksidlanmaydi, choklar mustahkam va toza.", li: ["Alyuminiy", "Legirlangan po‘latlar", "Titan va boshqa qotishmalar", "Zamonaviy apparatlar erish chuqurligini aniq ushlab turadi"] },
  },
  {
    id: "salon", photo: "s-salon", a: "seat",
    ru: { t: "Тюнинг и шумоизоляция салона", d: "Перетяжка салона и избавление от посторонних шумов и скрипов.", li: ["Перетяжка кожей или алькантарой", "Чехлы, оплётка руля, коврики", "Спортивные сиденья", "Шумоизоляция салона"] },
    uz: { t: "Salon tyuningi va shovqin izolyatsiyasi", d: "Salonni qayta qoplash va begona shovqin hamda g‘ichirlashlardan xalos bo‘lish.", li: ["Charm yoki alkantara bilan qoplash", "G‘iloflar, rul o‘rami, gilamchalar", "Sport o‘rindiqlari", "Salon shovqin izolyatsiyasi"] },
  },
  {
    id: "hodovaya", photo: "s-hodovaya", a: "wheel",
    ru: { t: "Диагностика и ремонт ходовой", d: "Осмотр и проверка люфтов, затем замена или ремонт деталей подвески.", li: ["Амортизаторы, пружины, рычаги", "Шаровые опоры, рулевые тяги и наконечники", "Ступицы и ступичные подшипники", "Стабилизаторы, втулки, перепрессовка сайлент-блоков"] },
    uz: { t: "Yurish qismi diagnostikasi va ta’miri", d: "Ko‘zdan kechirish va lyuftlarni tekshirish, so‘ng osma qismlarini almashtirish yoki ta’mirlash.", li: ["Amortizatorlar, prujinalar, richaglar", "Sharli tayanchlar, rul tortqilari va uchliklari", "Gupchaklar va gupchak podshipniklari", "Stabilizatorlar, vtulkalar, saylent-bloklarni qayta presslash"] },
  },
  {
    id: "elektro", photo: "s-elektro", a: "blink",
    ru: { t: "Дополнительная электроника", d: "Разрешённый мелкий тюнинг по электронике.", li: ["Обогрев зеркал и сидений", "Охранная сигнализация", "Подсветка порогов, салона и багажника, дневные ходовые огни", "Навигация, регистраторы, парктроники и камеры заднего вида", "Музыка, датчики света, ремонт светодиодной оптики"] },
    uz: { t: "Qo‘shimcha elektronika", d: "Elektronika bo‘yicha ruxsat etilgan kichik tyuning.", li: ["Oyna va o‘rindiqlarni isitish", "Qo‘riqlash signalizatsiyasi", "Ostona, salon va yukxona yoritgichi, kunduzgi yurish chiroqlari", "Navigatsiya, videoregistratorlar, parktroniklar va orqa ko‘rinish kameralari", "Musiqa, yorug‘lik datchiklari, LED optikani ta’mirlash"] },
  },
  {
    id: "diag", photo: "s-diag", a: "scan",
    ru: { t: "Компьютерная диагностика", d: "Находит и уже появившиеся неполадки, и только намечающиеся.", li: ["Двигатель, коробка передач, зажигание", "ABS, подушки безопасности", "Климат и круиз-контроль, навигация", "Перед покупкой машины с пробегом"] },
    uz: { t: "Kompyuter diagnostikasi", d: "Paydo bo‘lgan nosozliklarni ham, endi boshlanayotganlarini ham topadi.", li: ["Dvigatel, uzatmalar qutisi, o‘t oldirish", "ABS, xavfsizlik yostiqchalari", "Iqlim va kruiz-nazorat, navigatsiya", "Yurgan mashinani sotib olishdan oldin"] },
  },
  {
    id: "meh", photo: "s-meh", a: "press",
    ru: { t: "Механический цех", d: "Что делает цех и в какие сроки — расскажет мастер-приёмщик.", li: [] },
    uz: { t: "Mexanik sex", d: "Sex nima qilishi va qancha muddatda — usta-qabulchi aytib beradi.", li: [] },
  },
  {
    id: "farkop", photo: "s-farkop", a: "hitch",
    ru: { t: "Установка фаркопов", d: "Подбор фаркопа под вашу машину — у мастера-приёмщика.", li: [] },
    uz: { t: "Farkop o‘rnatish", d: "Mashinangizga farkop tanlash — usta-qabulchida.", li: [] },
  },
];

/* Названия страниц: в меню, в нижнем меню приложения и в конструкторе. */
const PAGE_NAMES = { "": ["Главная", "Bosh sahifa"], uslugi: ["Услуги", "Xizmatlar"], zapis: ["Запись", "Yozilish"], kontakty: ["Контакты", "Kontaktlar"], plan: ["Что дальше", "Keyingi qadam"] };
const PAGES = ["", "uslugi", "zapis", "kontakty", "plan"];

/* ── Конструктор: плашка на каждой странице ───────────────────────────── */
function kdRow(l, a, def = true) {
  return `<label class="kd-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="${(a.needs || []).join(" ")}"${def ? " data-def checked" : ""}><span class="sw" aria-hidden="true"></span><span class="kd-t"><b>${a[l].t}${a.star ? `<em>${l === "ru" ? "просили" : "so‘ralgan"}</em>` : ""}</b>${a[l].e ? `<small>${a[l].e}</small>` : ""}</span><span class="kd-p num">+${usd(a.price)}</span></label>`;
}
function dockHtml(l, path) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const i = l === "ru" ? 0 : 1;
  const group = (title, side, rows) => (rows.length ? `<section class="kd-g"><h3><span>${title}</span>${side}</h3>${rows.join("")}</section>` : "");
  const here = ADDONS.filter((a) => a.where === path);
  const all = ADDONS.filter((a) => a.where === "all");
  const others = [...new Set(ADDONS.map((a) => a.where))].filter((w) => w !== "all" && w !== path);
  return `<button class="kd-pill" type="button" id="kd-pill" aria-expanded="false" aria-controls="kd"><i aria-hidden="true"></i>${t("Конструктор", "Konstruktor")}<b class="num" id="kd-pill-sum"></b></button>
<aside class="kd" id="kd" role="dialog" aria-label="${t("Конструктор сайта", "Sayt konstruktori")}" hidden>
<header class="kd-h"><div><p class="kd-k">${t("Конструктор · предложение DevUz Studio", "Konstruktor · DevUz Studio taklifi")}</p><h2>${t("Что войдёт в сайт AUTOMECHANIC", "AUTOMECHANIC saytiga nima kiradi")}</h2><p class="kd-sub">${t("Выключите блок — он пропадёт со страницы, включите — появится. Цены — средние по Ташкенту.", "Blokni o‘chiring — sahifadan yo‘qoladi, yoqing — paydo bo‘ladi. Narxlar — Toshkent bo‘yicha o‘rtacha.")}</p></div><button class="kd-x" type="button" id="kd-x" aria-label="${t("Свернуть", "Yig‘ish")}">×</button></header>
<div class="kd-list">
${group(t("На этой странице", "Shu sahifada"), "", here.map((a) => kdRow(l, a)))}
${group(t("На всех страницах", "Barcha sahifalarda"), "", all.map((a) => kdRow(l, a)))}
${others.map((w) => group(PAGE_NAMES[w][i], `<a href="${href(l, w)}">${t("открыть", "ochish")} →</a>`, ADDONS.filter((a) => a.where === w).map((a) => kdRow(l, a)))).join("")}
${group(t("Сверх сайта", "Saytdan tashqari"), `<a href="${href(l, "plan")}#konstruktor">${t("что это", "bu nima")} →</a>`, BLOCKS.map((b) => kdRow(l, { ...b, [l]: { t: b[l].t } }, false)))}
</div>
<footer class="kd-f">
<div class="kd-line"><span>${t("Сайт", "Sayt")}</span><span class="num">${usd(KIT_BASE.price)}</span></div>
<div class="kd-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kd-n"></span></span><span class="num" id="kd-add"></span></div>
<div class="kd-line kd-tot"><span>${t("Итого разово", "Jami bir martalik")}</span><b class="num" id="kd-sum"></b></div>
<a class="btn btn-main" href="https://t.me/Devuz_studio_bot?start=automechanic">${ICON.tg}${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</a>
<div class="kd-btns"><button class="copy" type="button" id="kd-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button><button class="copy" type="button" id="kd-reset">${t("Сбросить", "Qayta tiklash")}</button></div>
</footer>
</aside>`;
}

/* ── Каркас ───────────────────────────────────────────────────────────── */
function shell(l, path, meta, body) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const other = l === "ru" ? "uz" : "ru";
  const nav = ["uslugi", "zapis", "kontakty", "plan"];
  const i = l === "ru" ? 0 : 1;
  const tab = (p, icon, hot = false) => `<a href="${href(l, p)}"${p === path ? ' aria-current="page"' : ""}${hot ? ' class="hot"' : ""}>${hot ? `<span class="dot">${icon}</span>` : icon}<span>${PAGE_NAMES[p][i]}</span></a>`;
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#101217">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="AUTOMECHANIC">
<link rel="manifest" href="${href(l, "manifest")}" data-addon-link="pwa">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
${path === "" ? `<link rel="preload" as="image" href="${IMG}/garage-far.webp"><link rel="preload" as="image" href="${IMG}/car.webp">` : ""}
<link rel="alternate" hreflang="${other}" href="${href(other, path)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="${FONTS}"></noscript>
<script>document.documentElement.classList.add('js');try{if(matchMedia('(display-mode: standalone)').matches||navigator.standalone)document.documentElement.classList.add('is-app','dz-off')}catch(e){}try{if(sessionStorage.getItem('dz'))document.documentElement.classList.add('dz-off')}catch(e){}</script>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "AutoRepair", name: "AUTOMECHANIC", telephone: ["+998909656131", "+998712764431"], email: F.mail, foundingDate: "1991", address: { "@type": "PostalAddress", streetAddress: F.addr[l], addressLocality: l === "ru" ? "Ташкент" : "Toshkent", addressCountry: "UZ" }, openingHours: "Mo-Sa 09:00-18:00" })}</script>
</head>
<body data-page="${path}" data-lang="${l}">
${path === "offline" ? "" : `<div class="dz" id="dz" role="presentation">
<div class="dz-in">${DZLOGO}<div class="dz-word">DevUz Studio</div><div class="dz-sub">${t("прототип для AUTOMECHANIC", "AUTOMECHANIC uchun prototip")}</div></div>
<div class="dz-skip">${t("Нажмите, чтобы пропустить", "O‘tkazib yuborish uchun bosing")}</div>
</div>`}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="AUTOMECHANIC">AUTO<b>MECHANIC</b><small>.uz</small></a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map((p) => `<a href="${href(l, p)}"${p === path ? ' aria-current="page"' : ""}>${PAGE_NAMES[p][i]}</a>`).join("")}</nav>
<div class="lang" data-addon="uz"><a href="${href("ru", path)}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz", path)}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>
<a class="top-call" href="${F.telM}" aria-label="${t("Позвонить мастеру-приёмщику", "Usta-qabulchiga qo‘ng‘iroq qilish")}">${ICON.phone}</a>
<a class="btn btn-main btn-sm top-cta" href="${href(l, "zapis")}">${ICON.cal}${t("Записаться", "Yozilish")}</a>
</div></header>
<div class="app-bar" aria-hidden="true"><span class="logo">AUTO<b>MECHANIC</b></span><span class="open"><i></i><span class="open-t"></span></span></div>
<main id="main">
${body}
</main>
<footer><div class="wrap">
<div class="cols">
<div><b>AUTOMECHANIC</b><ul><li>${F.addr[l]}</li><li>${t("Ориентир", "Mo‘ljal")} — ${F.mark[l]}</li><li>${F.hours[l]}, ${F.off[l]}</li></ul></div>
<div><b>${t("Телефоны", "Telefonlar")}</b><ul><li>${t("Мастер-приёмщик", "Usta-qabulchi")}: <a href="${F.telM}">${F.phoneM}</a></li><li>${t("Офис", "Ofis")}: <a href="${F.telO}">${F.phoneO}</a></li><li><a href="mailto:${F.mail}">${F.mail}</a></li></ul></div>
<div><b>${t("Страницы", "Sahifalar")}</b><ul>${["", ...nav].map((p) => `<li><a href="${href(l, p)}">${PAGE_NAMES[p][i]}</a></li>`).join("")}</ul></div>
</div>
<div class="rights"><span>${t("Это прототип: так может выглядеть новый сайт AUTOMECHANIC. Услуги, адрес, телефоны, часы работы и партнёры — с automechanic.uz (снимки 2021–2022 годов: сейчас сайт не открывается). Фото — открытые снимки Wikimedia Commons, авторы — на странице", "Bu prototip: AUTOMECHANIC’ning yangi sayti shunday ko‘rinishi mumkin. Xizmatlar, manzil, telefonlar, ish vaqti va hamkorlar — automechanic.uz saytidan (2021–2022 yillardagi nusxalar: hozir sayt ochilmaydi). Fotolar — Wikimedia Commons ochiq suratlari, mualliflar — sahifada")} <a href="${href(l, "plan")}#foto">${PAGE_NAMES.plan[i]}</a>.</span><span>${t("Прототип принадлежит DevUz Studio. Использовать его можно только по договору —", "Prototip DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin —")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari")}</a></span></div>
</div></footer>
<nav class="tabs" aria-label="${t("Меню приложения", "Ilova menyusi")}" data-addon="pwa">${tab("", ICON.home)}${tab("uslugi", ICON.wrench)}${tab("zapis", ICON.cal, true)}${tab("kontakty", ICON.pin)}</nav>
<div class="dock" id="dock"><a class="btn btn-main" href="${href(l, "zapis")}">${ICON.cal}${t("Записаться", "Yozilish")}</a></div>
${dockHtml(l, path)}
<script type="application/json" id="i18n">${JSON.stringify(L(l)).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}

/* Строки для скрипта страницы. */
function L(l) {
  const ru = l === "ru";
  return {
    base: href(l),
    lang: l,
    kitBase: KIT_BASE.price,
    kitN: ru ? "{n} шт." : "{n} ta",
    kitTg: ru ? "Сайт AUTOMECHANIC — состав из конструктора:" : "AUTOMECHANIC sayti — konstruktordagi tarkib:",
    kitBaseName: KIT_BASE[l].t,
    kitTotal: ru ? "Итого" : "Jami",
    copied: ru ? "Скопировано" : "Nusxalandi",
    say: ru ? ["Заезжаем в цех", "Ремонт окончен — опускаем", "Машина готова — можно ехать"] : ["Sexga kiramiz", "Ta’mir tugadi — tushiramiz", "Mashina tayyor — yo‘lga chiqish mumkin"],
    open: ru ? "Открыто до 18:00" : "18:00 gacha ochiq",
    closed: ru ? "Сейчас закрыто · откроется в 09:00" : "Hozir yopiq · 09:00 da ochiladi",
    closedSun: ru ? "Сегодня выходной · завтра с 09:00" : "Bugun dam olish kuni · ertaga 09:00 dan",
    days: ru ? ["вс", "пн", "вт", "ср", "чт", "пт", "сб"] : ["yak", "dush", "sesh", "chor", "pay", "jum", "shan"],
    months: ru ? ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"] : ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"],
    today: ru ? "сегодня" : "bugun",
    tomorrow: ru ? "завтра" : "ertaga",
    msgHead: ru ? "Заявка с сайта AUTOMECHANIC" : "AUTOMECHANIC saytidan ariza",
    fService: ru ? "Услуга" : "Xizmat",
    fCar: ru ? "Машина" : "Mashina",
    fTrouble: ru ? "Что беспокоит" : "Nima bezovta qilyapti",
    fWhen: ru ? "Когда" : "Qachon",
    fName: ru ? "Имя" : "Ism",
    fPhone: ru ? "Телефон" : "Telefon",
    need: ru ? "Выберите услугу, день и время и оставьте телефон — без него мастеру-приёмщику некуда перезвонить." : "Xizmat, kun va vaqtni tanlang va telefon qoldiring — usiz usta-qabulchi qo‘ng‘iroq qila olmaydi.",
    sent: ru ? "Текст заявки скопирован. Открываем Telegram мастера-приёмщика — вставьте его в чат. Если Telegram не открылся, позвоните: " : "Ariza matni nusxalandi. Usta-qabulchining Telegrami ochilmoqda — uni chatga qo‘ying. Telegram ochilmasa, qo‘ng‘iroq qiling: ",
    phoneM: F.phoneM,
    tgUrl: F.tg,
    iosTitle: ru ? "Как добавить на iPhone" : "iPhone’ga qanday qo‘shish",
    installed: ru ? "Готово — иконка на экране телефона" : "Tayyor — belgi telefon ekranida",
  };
}

/* ── Куски страниц ────────────────────────────────────────────────────── */
const head = (l, kicker, h, lead) => `<div class="sec-head rv a-rise">${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h2 style="margin-top:12px">${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>`;

const factsBlock = (l) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  return `<section style="padding-top:32px"><div class="wrap"><div class="facts rv a-rise">
<div><b class="num">1991</b><span>${t("год, с которого работаем", "yildan beri ishlaymiz")}</span></div>
<div><b>${t("Иномарки", "Xorijiy")}</b><span>${t("и машины отечественного производства", "va mahalliy ishlab chiqarilgan mashinalar")}</span></div>
<div><b class="num">09:00–18:00</b><span>${F.hours[l].split(",")[0]} · ${F.off[l]}</span></div>
<div><b>${t("Чиланзар", "Chilonzor")}</b><span>${t("10 квартал, 23/1 · ориентир — автостоянка № 75", "10-kvartal, 23/1 · mo‘ljal — 75-son avtoturargoh")}</span></div>
</div></div></section>`;
};

const servicesGrid = (l) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  return `<section id="uslugi"><div class="wrap">
${head(l, t("Услуги", "Xizmatlar"), t("Восемь работ, которые делаем в цехе", "Sexda qiladigan sakkizta ish"), t("Ремонт автомобилей зарубежного производства — и отечественных тоже.", "Xorijda ishlab chiqarilgan avtomobillarni ta’mirlash — mahalliylarini ham."))}
<div class="svc">${SERVICES.map((s, k) => `<a class="card rv a-${s.a}" style="--d:${(k % 4) * 80}ms" href="${href(l, "uslugi")}#${s.id}"><span class="ph" style="background-image:url(${IMG}/${s.photo}.webp)" role="img" aria-label="${esc(s[l].t)}"></span><span class="bd"><h3>${s[l].t}</h3><p>${s[l].d}</p><span class="more">${t("Подробнее", "Batafsil")} →</span></span></a>`).join("")}</div>
</div></section>`;
};

const heroScene = (l) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  return `<section class="scene" id="hero" data-scene="hero" aria-label="AUTOMECHANIC">
<div class="stage">
<div class="par far" data-l="far" style="background-image:url(${IMG}/garage-far.webp)" aria-hidden="true"></div>
<div class="par rig" data-l="rig" aria-hidden="true" data-addon="hero">
<div class="par post l" style="background-image:url(${IMG}/post.webp)"></div>
<div class="par post r" style="background-image:url(${IMG}/post.webp)"></div>
<div class="par shadow" data-l="shadow"></div>
<div class="par lift" data-l="lift">
<div class="par deck" style="background-image:url(${IMG}/deck.webp)"></div>
<div class="par car" data-l="car"><img src="${IMG}/car.webp" alt="" width="1800" height="568" fetchpriority="high"><i class="rim f" data-l="rimf" style="background-image:url(${IMG}/rim-f.webp)"></i><i class="rim r" data-l="rimr" style="background-image:url(${IMG}/rim-r.webp)"></i></div>
</div>
</div>
<div class="par floor" aria-hidden="true"></div>
<div class="par fg l" data-addon="hero" data-l="fgl" style="background-image:url(${IMG}/post.webp)" aria-hidden="true"></div>
<div class="par fg r" data-addon="hero" data-l="fgr" style="background-image:url(${IMG}/post.webp)" aria-hidden="true"></div>
<div class="hero-txt" data-l="txt"><div class="wrap">
<span class="kicker"><i></i>${t("Ташкент · Чиланзар · с 1991 года", "Toshkent · Chilonzor · 1991 yildan")}</span>
<h1 style="margin-top:16px">${t("Ремонт <b>иномарок</b> в Ташкенте", "Toshkentda <b>xorijiy</b> avtomobillar ta’miri")}</h1>
<p class="lead">${t("AUTOMECHANIC — один из первых автосервисов Ташкента по ремонту автомобилей зарубежного производства.", "AUTOMECHANIC — Toshkentda xorijiy avtomobillarni ta’mirlash bo‘yicha ilk avtoservislardan biri.")}</p>
<div class="cta"><a class="btn btn-main" href="${href(l, "zapis")}">${ICON.cal}${t("Записаться", "Yozilish")}</a><a class="btn btn-ghost" href="${F.telM}">${ICON.phone}${F.phoneM}</a></div>
<p class="scroll-hint" data-addon="hero">${ICON.down}${t("Листайте — машина съедет с подъёмника", "Pastga suring — mashina ko‘targichdan tushadi")}</p>
</div></div>
<div class="say" aria-hidden="true" data-addon="hero"><p data-say="0"></p></div>
<div class="end" data-addon="hero" data-l="end"><div class="wrap"><h2>${t("Следующая — ваша", "Navbatdagisi — sizniki")}</h2><div class="cta"><a class="btn btn-main" href="${href(l, "zapis")}">${ICON.cal}${t("Записаться", "Yozilish")}</a><a class="btn btn-ghost" href="${F.telM}">${ICON.phone}${t("Позвонить", "Qo‘ng‘iroq")}</a></div></div></div>
</div>
</section>`;
};

const oilScene = (l) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  return `<section class="oil" data-scene="oil" data-addon="oil" aria-label="${t("Масла партнёров", "Hamkorlar moylari")}">
<div class="stage">
<div class="par oil-frame" data-l="oilf" style="background-image:url(${IMG}/oil-base.webp)" aria-hidden="true"><i class="stream" data-l="stream" style="background-image:url(${IMG}/oil-stream.webp)"></i><i class="drop" style="background-image:url(${IMG}/oil-drop.webp)"></i><i class="drop b" style="background-image:url(${IMG}/oil-drop.webp)"></i></div>
<div class="par shade" aria-hidden="true"></div>
<div class="oil-txt"><div class="wrap"><div class="in">
<span class="kicker"><i></i>${t("Наши партнёры", "Hamkorlarimiz")}</span>
<h2 style="margin-top:12px">${t("Смазочные материалы — от Aral и 77 Lubricants", "Moylash materiallari — Aral va 77 Lubricants’dan")}</h2>
<div class="partners"><span>Aral</span><span>77 Lubricants</span></div>
<div class="gauge" aria-hidden="true"><span><i data-l="gauge"></i></span><b data-l="gaugeT">MIN</b></div>
</div></div></div>
</div>
</section>`;
};

const howBlock = (l) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const s = l === "ru"
    ? [["Выберите услугу", "Восемь работ цеха — или «не знаю, нужна диагностика»."], ["Опишите машину", "Марка, модель и что беспокоит — своими словами."], ["Выберите день и время", "Пн–Сб с 09:00 до 18:00. Заявка уходит мастеру-приёмщику."], ["Приезжайте", "Чиланзар, 10 квартал, 23/1. Ориентир — автостоянка № 75."]]
    : [["Xizmatni tanlang", "Sexning sakkizta ishi — yoki «bilmayman, diagnostika kerak»."], ["Mashinani tasvirlang", "Marka, model va nima bezovta qilayotgani — o‘z so‘zlaringiz bilan."], ["Kun va vaqtni tanlang", "Du–Sh 09:00 dan 18:00 gacha. Ariza usta-qabulchiga ketadi."], ["Keling", "Chilonzor, 10-kvartal, 23/1. Mo‘ljal — 75-son avtoturargoh."]];
  return `<section><div class="wrap">
${head(l, t("Запись", "Yozilish"), t("Записаться — минута с телефона", "Yozilish — telefondan bir daqiqa"), "")}
<ol class="steps">${s.map(([h, p], k) => `<li class="rv a-rise" style="--d:${k * 90}ms"><h3>${h}</h3><p>${p}</p></li>`).join("")}</ol>
<div class="cta"><a class="btn btn-main" href="${href(l, "zapis")}">${ICON.cal}${t("Записаться", "Yozilish")}</a></div>
</div></section>`;
};

const pricesBlock = (l) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  return `<section data-addon="prices"><div class="wrap">
${head(l, t("Цены", "Narxlar"), t("Здесь будет ваш прайс «от …»", "Bu yerda sizning «…dan» narxlaringiz bo‘ladi"), t("На прежнем сайте цен не было, поэтому прототип их не придумывает. Цена — первое, что спрашивают: у сервисов Ташкента, которые мы разобрали, она стоит прямо на странице, по группам работ.", "Avvalgi saytda narxlar yo‘q edi, shuning uchun prototip ularni o‘ylab topmaydi. Narx — birinchi so‘raladigan narsa: biz ko‘rib chiqqan Toshkent servislarida u ish turlari bo‘yicha to‘g‘ridan-to‘g‘ri sahifada turadi."))}
<div class="price">${SERVICES.slice(0, 6).map((s, k) => `<div class="price-row rv a-rise" style="--d:${k * 60}ms"><span>${s[l].t}</span><em>${t("ваша цена", "sizning narxingiz")}</em></div>`).join("")}</div>
<p class="src"><span class="ours">${t("Наше предложение", "Bizning taklif")}</span></p>
</div></section>`;
};

const finalBlock = (l) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  return `<section class="final"><div class="wrap"><div class="box rv a-rise">
<h2>${t("Запишитесь — мастер-приёмщик перезвонит", "Yoziling — usta-qabulchi qo‘ng‘iroq qiladi")}</h2>
<p class="sub" style="margin:12px auto 0">${F.addr[l]} · ${t("ориентир", "mo‘ljal")} — ${F.mark[l]}</p>
<div class="cta"><a class="btn btn-main" href="${href(l, "zapis")}">${ICON.cal}${t("Записаться", "Yozilish")}</a><a class="btn btn-ghost" href="${F.telM}">${ICON.phone}${F.phoneM}</a></div>
</div></div></section>`;
};

const installBlock = (l) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  return `<div class="install" data-addon="pwa"><img src="${IMG}/icon-192.png" alt="" width="56" height="56"><p><b>${t("AUTOMECHANIC на экране телефона", "AUTOMECHANIC telefon ekranida")}</b>${t("Откроется как приложение: без строки браузера, с нижним меню. Адрес и телефоны — даже без интернета.", "Ilova kabi ochiladi: brauzer satrisiz, pastki menyu bilan. Manzil va telefonlar — hatto internetsiz ham.")}</p><button class="btn btn-main btn-sm" type="button" data-install>${ICON.plus}${t("Добавить", "Qo‘shish")}</button>
<div class="ios" data-ios><b>${t("Как добавить на iPhone", "iPhone’ga qanday qo‘shish")}</b><ol><li>${t("Нажмите «Поделиться»", "«Ulashish» tugmasini bosing")} ${ICON.share.replace("<svg", '<svg width="16" height="16" style="vertical-align:-3px"')}</li><li>${t("Выберите «На экран „Домой“»", "«Bosh ekranga» bandini tanlang")}</li><li>${t("Нажмите «Добавить»", "«Qo‘shish»ni bosing")}</li></ol></div></div>`;
};

/* ── Страницы ─────────────────────────────────────────────────────────── */
function home(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const body = `${heroScene(l)}
${factsBlock(l)}
${servicesGrid(l)}
${oilScene(l)}
${howBlock(l)}
${pricesBlock(l)}
<section style="padding-top:0"><div class="wrap">${installBlock(l)}</div></section>
${finalBlock(l)}`;
  return shell(l, "", {
    title: t("AUTOMECHANIC — ремонт иномарок в Ташкенте с 1991 года, Чиланзар", "AUTOMECHANIC — Toshkentda xorijiy avtomobillar ta’miri, 1991 yildan, Chilonzor"),
    desc: t("Ремонт двигателя, аргонная сварка, ходовая, компьютерная диагностика, электроника, шумоизоляция салона, фаркопы. Чиланзар, 10 квартал, 23/1. Запись онлайн.", "Dvigatel ta’miri, argon payvandlash, yurish qismi, kompyuter diagnostikasi, elektronika, salon shovqin izolyatsiyasi, farkoplar. Chilonzor, 10-kvartal, 23/1. Onlayn yozilish."),
  }, body);
}

function phead(l, crumb, kicker, h1, lead) {
  return `<section class="phead"><div class="wrap">
<ol class="crumbs"><li><a href="${href(l)}">AUTOMECHANIC</a></li><li aria-current="page">${crumb}</li></ol>
${kicker ? `<span class="kicker"><i></i>${kicker}</span>` : ""}<h1 style="margin-top:12px">${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}
</div></section>`;
}

function uslugi(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const body = `${phead(l, PAGE_NAMES.uslugi[l === "ru" ? 0 : 1], t("С 1991 года", "1991 yildan"), t("Услуги", "Xizmatlar"), t("Ремонт автомобилей зарубежного производства и отечественных. Выберите работу — запись откроется сразу с ней.", "Xorijiy va mahalliy avtomobillarni ta’mirlash. Ishni tanlang — yozilish darhol u bilan ochiladi."))}
<section style="padding-top:0"><div class="wrap"><div class="svc-list">
${SERVICES.map((s) => `<article class="svc-item rv a-${s.a}" id="${s.id}"><div class="ph" style="background-image:url(${IMG}/${s.photo}.webp)" role="img" aria-label="${esc(s[l].t)}"></div><div class="bd"><h2 style="font-size:30px">${s[l].t}</h2><p class="sub">${s[l].d}</p>${s[l].li.length ? `<ul>${s[l].li.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>` : ""}${s[l].x ? `<p class="src">${s[l].x}</p>` : ""}<div class="cta"><a class="btn btn-main btn-sm" href="${href(l, "zapis")}?s=${s.id}">${ICON.cal}${t("Записаться", "Yozilish")}</a><a class="btn btn-ghost btn-sm" href="${F.telM}">${ICON.phone}${t("Спросить", "So‘rash")}</a></div></div></article>`).join("")}
</div></div></section>
${finalBlock(l)}`;
  return shell(l, "uslugi", {
    title: t("Услуги автосервиса AUTOMECHANIC — ремонт двигателя, сварка, ходовая | Ташкент", "AUTOMECHANIC avtoservis xizmatlari — dvigatel, payvandlash, yurish qismi | Toshkent"),
    desc: t("Ремонт двигателя, аргонная сварка, тюнинг и шумоизоляция салона, ходовая, электроника, компьютерная диагностика, механический цех, фаркопы — AUTOMECHANIC, Чиланзар.", "Dvigatel ta’miri, argon payvandlash, salon tyuningi, yurish qismi, elektronika, kompyuter diagnostikasi, mexanik sex, farkoplar — AUTOMECHANIC, Chilonzor."),
  }, body);
}

function zapis(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const opt = (name, value, label, extra = "") => `<label class="opt"><input type="radio" name="${name}" value="${esc(value)}"${extra}><span>${label}</span></label>`;
  const body = `${phead(l, PAGE_NAMES.zapis[l === "ru" ? 0 : 1], "", t("Запись в цех", "Sexga yozilish"), t("Три шага — и заявка у мастера-приёмщика. Он перезвонит и подтвердит время.", "Uch qadam — va ariza usta-qabulchida. U qo‘ng‘iroq qilib vaqtni tasdiqlaydi."))}
<section style="padding-top:0"><div class="wrap"><form class="book" id="book" novalidate>
<div>
<fieldset class="step"><h3><i>1</i>${t("Что нужно сделать", "Nima qilish kerak")}</h3>
<div class="opts">${SERVICES.map((s) => opt("s", s[l].t, s[l].t, ` data-id="${s.id}"`)).join("")}${opt("s", t("Не знаю — нужна диагностика", "Bilmayman — diagnostika kerak"), t("Не знаю — нужна диагностика", "Bilmayman — diagnostika kerak"), ' data-id="x"')}</div></fieldset>
<fieldset class="step"><h3><i>2</i>${t("Машина", "Mashina")}</h3>
<div class="field"><label for="car">${t("Марка и модель", "Marka va model")}</label><input id="car" name="car" autocomplete="off" placeholder="${t("Например, BMW 5 серии", "Masalan, BMW 5 seriya")}" maxlength="80"></div>
<div class="field"><label for="trouble">${t("Что беспокоит", "Nima bezovta qilyapti")}</label><textarea id="trouble" name="trouble" maxlength="400" placeholder="${t("Своими словами: стучит спереди на кочках, горит лампа…", "O‘z so‘zlaringiz bilan: chuqurlarda old tomondan taqillaydi, chiroq yonadi…")}"></textarea></div></fieldset>
<fieldset class="step"><h3><i>3</i>${t("Когда удобно", "Qachon qulay")}</h3>
<div class="opts" id="days"></div>
<div class="opts" id="times">${["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((h) => opt("h", h, h)).join("")}</div>
<div class="two"><div class="field"><label for="nm">${t("Как к вам обращаться", "Sizga qanday murojaat qilaylik")}</label><input id="nm" name="nm" autocomplete="name" maxlength="60"></div>
<div class="field"><label for="ph">${t("Телефон", "Telefon")}</label><input id="ph" name="ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998" maxlength="20"></div></div></fieldset>
</div>
<aside class="sum">
<div class="step">
<h3>${t("Ваша заявка", "Arizangiz")}</h3>
<div data-addon="tg"><div class="msg" aria-live="polite"><div class="msg-h">${ICON.tg}<span>AUTOMECHANIC · ${t("заявки", "arizalar")}</span></div><span id="msg"></span><time id="msg-t"></time></div>
<p class="src">${t("Так заявка придёт мастеру-приёмщику в Telegram — сразу, без почты и CRM.", "Ariza usta-qabulchiga Telegramda shunday keladi — darhol, pochta va CRMsiz.")} <span class="ours">${t("Доп «Заказы в Telegram»", "«Buyurtmalar Telegramga» qo‘shimchasi")}</span></p></div>
<div class="cta"><button class="btn btn-main" type="submit" style="width:100%">${ICON.tg}${t("Отправить мастеру-приёмщику", "Usta-qabulchiga yuborish")}</button><a class="btn btn-ghost" style="width:100%" href="${F.telM}">${ICON.phone}${t("Или позвонить", "Yoki qo‘ng‘iroq qilish")} ${F.phoneM}</a></div>
<p class="err" id="err" role="alert" hidden></p>
<p class="done" id="done" role="status" hidden></p>
</div>
</aside>
</form></div></section>`;
  return shell(l, "zapis", {
    title: t("Запись в автосервис AUTOMECHANIC онлайн — Чиланзар, Ташкент", "AUTOMECHANIC avtoservisiga onlayn yozilish — Chilonzor, Toshkent"),
    desc: t("Выберите услугу, день и время — заявка уйдёт мастеру-приёмщику AUTOMECHANIC. Пн–Сб, 09:00–18:00.", "Xizmat, kun va vaqtni tanlang — ariza AUTOMECHANIC usta-qabulchisiga ketadi. Du–Sh, 09:00–18:00."),
  }, body);
}

function kontakty(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const body = `${phead(l, PAGE_NAMES.kontakty[l === "ru" ? 0 : 1], "", t("Контакты", "Kontaktlar"), "")}
<section style="padding-top:0"><div class="wrap"><div class="contact">
<div class="box rv a-rise"><dl>
<div><dt>${t("Адрес", "Manzil")}</dt><dd>${F.addr[l]}</dd></div>
<div><dt>${t("Ориентир", "Mo‘ljal")}</dt><dd>${F.mark[l]}</dd></div>
<div><dt>${t("Мастер-приёмщик", "Usta-qabulchi")}</dt><dd><a href="${F.telM}">${F.phoneM}</a></dd></div>
<div><dt>${t("Офис", "Ofis")}</dt><dd><a href="${F.telO}">${F.phoneO}</a></dd></div>
<div><dt>${t("Почта", "Pochta")}</dt><dd><a href="mailto:${F.mail}">${F.mail}</a></dd></div>
<div><dt>${t("Часы работы", "Ish vaqti")}</dt><dd>${F.hours[l]}<br><span style="color:var(--fg2)">${F.off[l]}</span><span class="open-now" data-addon="route"><i></i><span class="open-t"></span></span></dd></div>
</dl>
<div class="route" data-addon="route"><a class="btn btn-main btn-sm" href="${YMAP}">${ICON.pin}${t("Яндекс Карты", "Yandex Xaritalar")}</a><a class="btn btn-ghost btn-sm" href="${GMAP}">${ICON.pin}Google Maps</a></div>
</div>
<div class="photo-box rv a-scan" style="background-image:url(${IMG}/lift.webp)" role="img" aria-label="${t("Цех с подъёмником", "Ko‘targichli sex")}"><span>${t("Фото — открытый снимок, не ваш цех. Доп «Съёмка ваших работ и цеха» ставит сюда ваш.", "Foto — ochiq surat, sizning sexingiz emas. «Ishlaringiz va sexingizni suratga olish» qo‘shimchasi bu yerga sizniki qo‘yadi.")}</span></div>
</div>
<div style="margin-top:24px">${installBlock(l)}</div>
</div></section>
<section style="padding-top:0"><div class="wrap">${head(l, t("Партнёры", "Hamkorlar"), "Aral · 77 Lubricants", t("Смазочные материалы — от партнёров, названных на вашем сайте.", "Moylash materiallari — saytingizda ko‘rsatilgan hamkorlardan."))}</div></section>`;
  return shell(l, "kontakty", {
    title: t("Контакты AUTOMECHANIC — Чиланзар, 10 квартал, 23/1 · +998 90 965 61 31", "AUTOMECHANIC kontaktlari — Chilonzor, 10-kvartal, 23/1 · +998 90 965 61 31"),
    desc: t("Адрес, ориентир, телефоны мастера-приёмщика и офиса, часы работы AUTOMECHANIC. Пн–Сб, 09:00–18:00.", "AUTOMECHANIC manzili, mo‘ljali, usta-qabulchi va ofis telefonlari, ish vaqti. Du–Sh, 09:00–18:00."),
  }, body);
}

function offline(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const body = `<section class="phead"><div class="wrap">
<span class="kicker"><i></i>${t("Нет интернета", "Internet yo‘q")}</span>
<h1 style="margin-top:12px">${t("Позвоните — это работает без сети", "Qo‘ng‘iroq qiling — bu tarmoqsiz ishlaydi")}</h1>
<p class="lead">${t("Страница не загрузилась, но адрес и телефоны сохранены в телефоне.", "Sahifa yuklanmadi, lekin manzil va telefonlar telefonda saqlangan.")}</p>
<div class="cta"><a class="btn btn-main" href="${F.telM}">${ICON.phone}${t("Мастер-приёмщик", "Usta-qabulchi")} ${F.phoneM}</a><a class="btn btn-ghost" href="${F.telO}">${ICON.phone}${t("Офис", "Ofis")} ${F.phoneO}</a></div>
<div class="box" style="margin-top:32px"><dl><div><dt>${t("Адрес", "Manzil")}</dt><dd>${F.addr[l]}</dd></div><div><dt>${t("Ориентир", "Mo‘ljal")}</dt><dd>${F.mark[l]}</dd></div><div><dt>${t("Часы работы", "Ish vaqti")}</dt><dd>${F.hours[l]}, ${F.off[l]}</dd></div></dl></div>
</div></section>`;
  return shell(l, "offline", {
    title: t("Нет интернета — AUTOMECHANIC", "Internet yo‘q — AUTOMECHANIC"),
    desc: t("Адрес и телефоны AUTOMECHANIC без интернета.", "AUTOMECHANIC manzili va telefonlari internetsiz."),
  }, body);
}

/* ── «Что дальше»: было / стало, конструктор, приложение, фото ────────── */
const PHOTO_CREDITS = [
  ["BMW 5 Series F10, вид сбоку", "ReneeWrites", "CC BY 4.0", "https://commons.wikimedia.org/w/index.php?curid=147862442"],
  ["Цех с машиной на подъёмнике", "Shixart1985", "CC BY 2.0", "https://commons.wikimedia.org/w/index.php?curid=186889546"],
  ["Стойка подъёмника", "Shixart1985", "CC BY 2.0", "https://commons.wikimedia.org/w/index.php?curid=186889537"],
  ["Заливка масла в двигатель", "Santeri Viinamäki", "CC BY-SA 4.0", "https://commons.wikimedia.org/w/index.php?curid=51476546"],
  ["Фото услуг: двигатель, ходовая, электроника, цех, салон, узел", "Shixart1985", "CC BY 2.0", "https://commons.wikimedia.org/wiki/User:Shixart1985"],
  ["Аргонная горелка", "Erik Wannee", "CC0", "https://commons.wikimedia.org/wiki/File:TIG-toorts.jpg"],
  ["Фаркоп", "CosyCobra", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Tow_hitch_01.jpg"],
];

function previews(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const row = (a, b) => `<div class="pv-row"><span>${a}</span><span>${b}</span></div>`;
  return {
    status: `<div class="msg" style="margin:0"><div class="msg-h">${ICON.tg}<span>AUTOMECHANIC</span></div>${t("Ваша BMW 5 серии готова — можно забирать до 18:00.", "BMW 5 seriyangiz tayyor — 18:00 gacha olib ketish mumkin.")}</div>`,
    remind: `<div class="msg" style="margin:0"><div class="msg-h">${ICON.tg}<span>AUTOMECHANIC</span></div>${t("Пора на плановый визит. Записать вас на эту неделю?", "Rejali tashrif vaqti keldi. Sizni shu haftaga yozaylikmi?")}</div>`,
    reviews: `${row(t("Яндекс Карты", "Yandex Xaritalar"), t("ваша оценка", "sizning bahoingiz"))}${row("Google Maps", t("ваша оценка", "sizning bahoingiz"))}${row(t("Оставить отзыв", "Sharh qoldirish"), "→")}`,
    admin: `${row(t("Ремонт двигателя", "Dvigatel ta’miri"), t("от … сум", "… so‘mdan"))}${row(t("Аргонная сварка", "Argon payvandlash"), t("от … сум", "… so‘mdan"))}${row(t("Часы работы", "Ish vaqti"), "09:00–18:00")}`,
    seo: `<div class="pv-row"><span><b style="margin:0">${t("Аргонная сварка в Ташкенте — AUTOMECHANIC", "Toshkentda argon payvandlash — AUTOMECHANIC")}</b>${t("Алюминий, легированные стали, титан. Чиланзар.", "Alyuminiy, legirlangan po‘latlar, titan. Chilonzor.")}</span></div>`,
    photos: `${row(t("Цех и подъёмники", "Sex va ko‘targichlar"), "→")}${row(t("Работы до и после", "Ishlar oldin va keyin"), "→")}${row(t("Мастер-приёмщик", "Usta-qabulchi"), "→")}`,
  };
}

function plan(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const pv = previews(l);
  const ba = (cls, was, now, cap, capB) => `<figure><div class="ba-box ${cls}" data-ba><img src="${IMG}/${now}" alt="${t("Стало", "Bo‘ldi")}" loading="lazy"><div class="was"><img src="${IMG}/${was}" alt="${t("Было", "Edi")}" loading="lazy"></div><span class="tag a">${t("Было", "Edi")}</span><span class="tag b">${t("Стало", "Bo‘ldi")}</span><div class="knob"><i>${ICON.arrows}</i></div><input type="range" min="0" max="100" value="50" aria-label="${t("Сдвиньте шторку: было или стало", "Pardani suring: edi yoki bo‘ldi")}"></div><figcaption><span>${cap}</span><span>${capB}</span></figcaption></figure>`;
  const body = `${phead(l, PAGE_NAMES.plan[l === "ru" ? 0 : 1], `<span class="ours">${t("Предложение DevUz Studio для AUTOMECHANIC", "DevUz Studio’ning AUTOMECHANIC uchun taklifi")}</span>`, t("Было и стало", "Edi va bo‘ldi"), t("Слева — ваш сайт, каким он был в последний раз, когда открывался. Справа — этот прототип. Тяните шторку.", "Chapda — saytingiz oxirgi marta ochilgandagi holati. O‘ngda — shu prototip. Pardani torting."))}
<section style="padding-top:0"><div class="wrap">
<div class="now rv a-rise"><img src="${IMG}/ba-now.webp" alt="${t("automechanic.uz сегодня: предупреждение браузера", "automechanic.uz bugun: brauzer ogohlantirishi")}" loading="lazy"><div><h2>${t("Сегодня automechanic.uz не открывается", "Bugun automechanic.uz ochilmaydi")}</h2><p class="sub">${t("Сертификат сайта истёк: телефон покупателя сначала пишет «Подключение не защищено». Кто нажмёт «всё равно перейти», видит белый экран — страница пустая. Человек, который ищет сервис, уходит к следующему в выдаче.", "Sayt sertifikati muddati o‘tgan: xaridorning telefoni avval «Ulanish himoyalanmagan» deb yozadi. «Baribir o‘tish»ni bosgan oq ekranni ko‘radi — sahifa bo‘sh. Servis qidirayotgan odam qidiruvdagi keyingisiga ketadi.")}</p></div></div>
<div class="ba" style="margin-top:48px">
${ba("ba-d", "ba-old-d.webp", "ba-new-d.webp", t("Компьютер · первый экран", "Kompyuter · birinchi ekran"), t("было — лента новостей BMW", "edi — BMW yangiliklari lentasi"))}
${ba("ba-m", "ba-old-m.webp", "ba-new-m.webp", t("Телефон · первый экран", "Telefon · birinchi ekran"), t("было — уменьшенная копия", "edi — kichraytirilgan nusxa"))}
</div>
<div class="grid g3" style="margin-top:48px">
<div class="note rv a-rise"><h3>${t("Было: новости вместо сервиса", "Edi: servis o‘rniga yangiliklar")}</h3><p>${t("Главная — статьи про BMW и Mercedes с чужого сайта, галерея — пресс-фото Lamborghini и Rolls-Royce. О вашем цехе — колонка сбоку.", "Bosh sahifa — boshqa saytdan BMW va Mercedes haqida maqolalar, galereya — Lamborghini va Rolls-Royce press-fotolari. Sexingiz haqida — yon ustun.")}</p></div>
<div class="note rv a-rise" style="--d:90ms"><h3>${t("Было: только звонок", "Edi: faqat qo‘ng‘iroq")}</h3><p>${t("Ни записи, ни мессенджера: на телефоне номера не нажимались, почта в шапке — из шаблона.", "Yozilish ham, messenjer ham yo‘q: telefonda raqamlar bosilmasdi, shapkadagi pochta — shablondan.")}</p></div>
<div class="note rv a-rise" style="--d:180ms"><h3>${t("Стало: запись и Telegram", "Bo‘ldi: yozilish va Telegram")}</h3><p>${t("Услуга, машина, день и время — и заявка у мастера-приёмщика в Telegram. На телефоне — меню как в приложении.", "Xizmat, mashina, kun va vaqt — va ariza usta-qabulchida Telegramda. Telefonda — ilovadagidek menyu.")}</p></div>
</div>
</div></section>
<section id="prilozhenie" data-addon="pwa"><div class="wrap">
${head(l, t("Сайт как приложение · 195 $", "Sayt ilova kabi · 195 $"), t("Добавьте на экран телефона — и откройте", "Telefon ekraniga qo‘shing — va oching"), t("Это работает уже в прототипе. Иконка встаёт рядом с банком и такси, сайт открывается без строки браузера, внизу — меню «Главная · Услуги · Запись · Контакты». Без интернета открывается страница с адресом и телефонами.", "Bu prototipda allaqachon ishlaydi. Belgi bank va taksi yoniga qo‘yiladi, sayt brauzer satrisiz ochiladi, pastda — «Bosh sahifa · Xizmatlar · Yozilish · Kontaktlar» menyusi. Internetsiz manzil va telefonlar sahifasi ochiladi."))}
${installBlock(l)}
</div></section>
<section id="konstruktor"><div class="wrap">
${head(l, t("Конструктор проекта", "Loyiha konstruktori"), t("Соберите сайт под свой бюджет", "Saytni byudjetingizga moslab yig‘ing"), t("Сайт — 1 000 $. Остальное включается тумблером: включили блок — он появляется на странице и в превью, итог пересчитывается. Цены — средние по Ташкенту за такую работу, точные — после разговора.", "Sayt — 1 000 $. Qolgani tumbler bilan yoqiladi: blokni yoqdingiz — u sahifada va ko‘rinishda paydo bo‘ladi, jami qayta hisoblanadi. Narxlar — Toshkentda bunday ish uchun o‘rtacha, aniq narx — suhbatdan keyin."))}
<div class="kit">
<div class="kit-list">
<div class="kit-base"><div><b>${KIT_BASE[l].t}</b><p>${KIT_BASE[l].d}</p></div><span class="kit-price num">${usd(KIT_BASE.price)}</span></div>
<h3 class="kit-g">${t("Допы на страницах", "Sahifalardagi qo‘shimchalar")}</h3>
${ADDONS.map((a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" data-needs="" data-def checked><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}</b><small>${a[l].e}</small></span><span class="kit-price num">${usd(a.price)}</span></label>`).join("")}
${Object.keys(GROUPS).map((g) => `<h3 class="kit-g">${t("Сверх сайта", "Saytdan tashqari")} · ${GROUPS[g][l]}</h3>${BLOCKS.filter((b) => b.group === g).map((b) => `<label class="kit-row"><input type="checkbox" data-k="${b.id}" data-p="${b.price}" data-needs="${b.needs.join(" ")}"><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${b[l].t}</b><small>${b[l].why}</small><span class="kit-li">${b[l].li.map((x) => `<em>${x}</em>`).join("")}</span>${b.needs.length ? `<span class="kit-need">${t("Включает", "Birga yoqiladi")}: ${b.needs.map((n) => ADDONS.find((x) => x.id === n)[l].t).join(", ")}</span>` : ""}</span><span class="kit-price num">${usd(b.price)}</span></label>`).join("")}`).join("")}
</div>
<div class="kit-side">
<div aria-live="polite">${BLOCKS.map((b) => `<div class="kit-pv" data-pv="${b.id}" hidden><b>${b[l].t}</b>${pv[b.pv]}</div>`).join("")}</div>
<div class="kit-total"><small>${t("Итого с сайтом", "Sayt bilan jami")}</small><b class="num" id="kit-sum">—</b><small id="kit-n"></small><a class="btn btn-main" href="https://t.me/Devuz_studio_bot?start=automechanic">${ICON.tg}${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</a></div>
</div>
</div>
</div></section>
<section id="konkurenty"><div class="wrap">
${head(l, t("Что взяли у конкурентов", "Raqobatchilardan nima oldik"), t("Сильные стороны сайтов автосервисов Ташкента", "Toshkent avtoservislari saytlarining kuchli tomonlari"), "")}
<div class="grid g3">
<div class="note"><h3>fors.uz</h3><p>${t("Запись с машиной, причиной и временем — а не «перезвоним вам».", "Mashina, sabab va vaqt bilan yozilish — «sizga qo‘ng‘iroq qilamiz» emas.")}</p></div>
<div class="note"><h3>carbox.uz</h3><p>${t("Звонок под большим пальцем и прайс прямо на сайте.", "Bosh barmoq ostida qo‘ng‘iroq va narxlar to‘g‘ridan-to‘g‘ri saytda.")}</p></div>
<div class="note"><h3>car-driver.uz</h3><p>${t("Заявки в Telegram и калькулятор с итогом в сумах.", "Telegramga arizalar va so‘mda jami bilan kalkulyator.")}</p></div>
<div class="note"><h3>aad.uz</h3><p>${t("История крупно: у них «с 1988 года», у вас — с 1991-го.", "Tarix katta qilib: ularda «1988 yildan», sizda — 1991 yildan.")}</p></div>
<div class="note"><h3>olamavto.uz</h3><p>${t("Понятные шаги: что будет после заявки.", "Tushunarli qadamlar: arizadan keyin nima bo‘ladi.")}</p></div>
<div class="note"><h3>${t("Ни у кого", "Hech kimda")}</h3><p>${t("Настоящего узбекского у частных сервисов нет ни у одного — у вас будет.", "Xususiy servislarning birortasida haqiqiy o‘zbekcha yo‘q — sizda bo‘ladi.")}</p></div>
</div>
</div></section>
<section id="foto"><div class="wrap">
${head(l, t("Фото в прототипе", "Prototipdagi fotolar"), t("Откуда снимки", "Suratlar qayerdan"), t("Своих фото годного размера на вашем сайте не было, поэтому здесь открытые снимки Wikimedia Commons с разрешением на коммерческое использование. Мы их кадрировали, вырезали по слоям и подогнали по цвету. Нейросетью ничего не рисовали.", "Saytingizda yaroqli o‘lchamdagi o‘z fotolaringiz yo‘q edi, shuning uchun bu yerda tijoriy foydalanishga ruxsat berilgan Wikimedia Commons ochiq suratlari. Biz ularni kesdik, qatlamlarga ajratdik va rangini moslashtirdik. Neyrotarmoq bilan hech narsa chizilmagan."))}
<ul class="credits">${PHOTO_CREDITS.map(([w, a, lic, u]) => `<li>${w} — ${a}, ${lic}, <a href="${u}">Wikimedia Commons</a></li>`).join("")}</ul>
</div></section>`;
  return shell(l, "plan", {
    title: t("Что дальше: было и стало, конструктор сайта — AUTOMECHANIC", "Keyingi qadam: edi va bo‘ldi, sayt konstruktori — AUTOMECHANIC"),
    desc: t("Было и стало: старый сайт AUTOMECHANIC и прототип. Конструктор: сайт 1 000 $, заказы в Telegram, сайт как приложение 195 $.", "Edi va bo‘ldi: AUTOMECHANIC eski sayti va prototip. Konstruktor: sayt 1 000 $, buyurtmalar Telegramga, sayt ilova kabi 195 $."),
  }, body);
}

/* ── Манифест и service worker ────────────────────────────────────────── */
function manifest(l) {
  return JSON.stringify({
    name: "AUTOMECHANIC",
    short_name: "AUTOMECHANIC",
    description: l === "ru" ? "Ремонт иномарок в Ташкенте с 1991 года" : "Toshkentda xorijiy avtomobillar ta’miri, 1991 yildan",
    lang: l,
    id: href(l) + "/",
    start_url: href(l) + "/?app=1",
    scope: BASE + "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#101217",
    theme_color: "#101217",
    icons: [
      { src: `${IMG}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${IMG}/icon-512.png`, sizes: "512x512", type: "image/png" },
      { src: `${IMG}/icon-mask-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: l === "ru" ? "Записаться" : "Yozilish", url: href(l, "zapis"), icons: [{ src: `${IMG}/icon-192.png`, sizes: "192x192" }] },
      { name: l === "ru" ? "Позвонить" : "Qo‘ng‘iroq", url: href(l, "kontakty"), icons: [{ src: `${IMG}/icon-192.png`, sizes: "192x192" }] },
    ],
  });
}

const BUILD = { "": home, uslugi, zapis, kontakty, plan, offline };
const out = {};
for (const l of ["ru", "uz"]) {
  const pre = l === "uz" ? "uz" : "";
  for (const p of [...PAGES, "offline"]) out[pre ? pre + (p ? "/" + p : "") : p] = BUILD[p](l);
  out[(pre ? pre + "/" : "") + "manifest"] = manifest(l);
}
out.sw = SW.replace(/__IMG__/g, IMG);
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/*
 * Сборка для сервера (lib/proto/bundles): общие куски — стили, скрипт,
 * строки на языке — один раз, в страницах вместо них метка @@имя@@.
 */
const first = out[""];
const grab = (html, re) => html.match(re)[0];
const parts = {
  S: grab(first, /<style>[\s\S]*?<\/style>/),
  J: grab(first, /<script>\n\(function[\s\S]*?<\/script>/),
};
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let page = html;
  for (const [name, part] of Object.entries(parts)) page = page.split(part).join(`@@${name}@@`);
  pages[key] = page;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "automechanic.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(main)").padEnd(14), v.length);
