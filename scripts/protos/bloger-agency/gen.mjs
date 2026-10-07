import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { I18N, nicheNames, nicheKeys } from "./i18n.mjs";
import { ADDONS, BASE as KIT_BASE, BLOCKS, GROUPS } from "./plan.mjs";

const DIR = new URL(".", import.meta.url).pathname;
const CSS = readFileSync(DIR + "style.css", "utf8").replace(/\n/g, "");
const JS = readFileSync(DIR + "client.js", "utf8");
const GP = readFileSync(DIR + "gp.js", "utf8");
const CAT = readFileSync(DIR + "catalog.json", "utf8");
const BASE = "__PROTO_BASE__";
const SITE = "https://bloger.agency";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;

const usd = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const tg = (text) => `https://t.me/baluevgeorge?text=${encodeURIComponent(text)}`;
const href = (l, path = "") => BASE + (l === "uz" ? "/uz" : "") + (path ? "/" + path : "");

const ICON = {
  tg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 4 3 11l6 2.5M21 4l-3.5 16-8.5-6.5M21 4 9 13.5V19l3-3.5"/></svg>',
  brand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10v4h3l6 4V6L6 10H3zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
};
const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="9" width="17" height="17" rx="3" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="6" cy="8" r="3.4" fill="currentColor"/><circle cx="6" cy="27" r="3.4" fill="currentColor"/><circle cx="25" cy="27" r="3.4" fill="currentColor"/><path d="M19 3h7a4 4 0 0 1 4 4v1a6 6 0 0 1-6 6h-1a4 4 0 0 1-4-4z" fill="hsl(225 30% 95%)"/></svg>';
const DZLOGO = '<svg class="dz-logo" viewBox="-120 -120 240 240" aria-hidden="true"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-120" y="-120" width="240" height="240" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z" fill="url(#dzg)" mask="url(#dzc)"/><rect x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>';

const PAGES = ["", "blogery", "ugc", "brendam", "blogeram", "keysy", "plan"];

/* ── Конструктор тарифа: плашка на каждой странице (как у MAVERA) ──── */
const PAGE_NAMES = { "": ["Главная", "Bosh sahifa"], blogery: ["Блогеры", "Blogerlar"], ugc: ["UGC-студия", "UGC-studiya"], brendam: ["Брендам", "Brendlarga"], blogeram: ["Блогерам", "Blogerlarga"], keysy: ["Кейсы", "Keyslar"], plan: ["Что дальше", "Keyingi qadam"] };
function kitRow(l, id, price, title, note, needs = [], def = false) {
  return `<label class="kd-row"><input type="checkbox" data-k="${id}" data-p="${price}" data-needs="${needs.join(" ")}"${def ? " data-def checked" : ""}><span class="sw" aria-hidden="true"></span><span class="kd-t"><b>${title}</b>${note ? `<small>${note}</small>` : ""}</span><span class="kd-p num">+${usd(price)}</span></label>`;
}
function dockHtml(l, path) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const i = l === "ru" ? 0 : 1;
  const group = (title, side, rows) => rows.length ? `<section class="kd-g"><h3><span>${title}</span>${side}</h3>${rows.join("")}</section>` : "";
  const here = ADDONS.filter((a) => a.where === path);
  const all = ADDONS.filter((a) => a.where === "all");
  const others = [...new Set(ADDONS.map((a) => a.where))].filter((w) => w !== "all" && w !== path);
  return `<button class="kd-pill" type="button" id="kd-pill" aria-expanded="false" aria-controls="kd"><i aria-hidden="true"></i>${t("Конструктор", "Konstruktor")}<b class="num" id="kd-pill-sum"></b></button>
<aside class="kd" id="kd" role="dialog" aria-label="${t("Конструктор сайта", "Sayt konstruktori")}" hidden>
<header class="kd-h"><div><p class="kd-k">${t("Конструктор · предложение DevUz Studio", "Konstruktor · DevUz Studio taklifi")}</p><h2>${t("Что войдёт в сайт Bloger Agency", "Bloger Agency saytiga nima kiradi")}</h2><p class="kd-sub">${t("Выключите блок, и он пропадёт со страницы. Включите, и он появится. Цены средние по Ташкенту.", "Blokni o‘chirsangiz, u sahifadan yo‘qoladi, yoqsangiz, yana paydo bo‘ladi. Narxlar Toshkent bo‘yicha o‘rtacha.")}</p></div><button class="kd-x" type="button" id="kd-x" aria-label="${t("Свернуть", "Yig‘ish")}">×</button></header>
<div class="kd-list">
${group(t("На этой странице", "Shu sahifada"), "", here.map((a) => kitRow(l, a.id, a.price, a[l].t, a[l].e, [], true)))}
${group(t("На всех страницах", "Barcha sahifalarda"), "", all.map((a) => kitRow(l, a.id, a.price, a[l].t, a[l].e, [], true)))}
${others.map((w) => group(PAGE_NAMES[w][i], `<a href="${href(l, w)}">${t("открыть", "ochish")} →</a>`, ADDONS.filter((a) => a.where === w).map((a) => kitRow(l, a.id, a.price, a[l].t, a[l].e, [], true)))).join("")}
${group(t("Сверх сайта", "Saytdan tashqari"), `<a href="${href(l, "plan")}">${t("что это", "bu nima")} →</a>`, BLOCKS.map((b) => kitRow(l, b.id, b.price, b[l].t, "", b.needs)))}
</div>
<footer class="kd-f">
<div class="kd-line"><span>${t("Сайт", "Sayt")}</span><span class="num">${usd(KIT_BASE.price)}</span></div>
<div class="kd-line"><span>${t("Блоки", "Bloklar")} · <span id="kd-n"></span></span><span class="num" id="kd-add"></span></div>
<div class="kd-line kd-tot"><span>${t("Итого разово", "Jami bir martalik")}</span><b class="num" id="kd-sum"></b></div>
<a class="btn btn-sun" id="kd-go" href="https://t.me/Devuz_studio_bot?start=bloger_agency">${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</a>
<div class="kd-btns"><button class="copy" type="button" id="kd-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button><button class="copy" type="button" id="kd-reset">${t("Сбросить", "Qayta tiklash")}</button></div>
</footer>
</aside>`;
}

/* ── Каркас ──────────────────────────────────────────────────────────── */
function shell(l, path, meta, body, { portal = false } = {}) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const other = l === "ru" ? "uz" : "ru";
  const navItems = [
    ["blogery", t("Блогеры", "Blogerlar")],
    ["ugc", t("UGC-студия", "UGC-studiya")],
    ["brendam", t("Брендам", "Brendlarga")],
    ["blogeram", t("Блогерам", "Blogerlarga")],
    ["keysy", t("Кейсы", "Keyslar")],
    ["plan", t("Что дальше", "Keyingi qadam")],
  ];
  const mainTg = tg(t("Здравствуйте! Хочу рекламу у блогеров, помогите подобрать.", "Assalomu alaykum! Blogerlarda reklama qilmoqchiman, tanlashga yordam bering."));
  const ctaText = t("Написать в Telegram", "Telegramga yozish");
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0c0f18">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Bloger Agency">
<meta property="og:locale" content="${l === "ru" ? "ru_RU" : "uz_UZ"}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.desc)}">
<meta property="og:image" content="${SITE}/assets/img/og-image.jpg">
<link rel="alternate" hreflang="${other}" href="${href(other, path)}">
<link rel="icon" href="${SITE}/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;700&family=Unbounded:wght@700&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;700&family=Unbounded:wght@700&display=swap"></noscript>
<script>try{history.scrollRestoration='manual'}catch(e){}document.documentElement.classList.add('js');try{if(sessionStorage.getItem('dz'))document.documentElement.classList.add('dz-off')}catch(e){}</script>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": ["Organization", "LocalBusiness"], name: "Bloger Agency", url: SITE, logo: `${SITE}/assets/img/logo/logo.png`, telephone: "+998977087867", address: { "@type": "PostalAddress", streetAddress: "Nukus ko‘chasi, 81", postalCode: "100207", addressLocality: "Toshkent", addressCountry: "UZ" }, sameAs: ["https://www.instagram.com/bloger.agency/", "https://www.youtube.com/@baluev_george", "https://t.me/baluevgeorge"] })}</script>
</head>
<body data-page="${path}">
<div class="dz" id="dz" role="presentation">
<div class="dz-in">${DZLOGO}<div class="dz-word">DevUz Studio</div><div class="dz-sub">${t("прототип для Bloger Agency", "Bloger Agency uchun prototip")}</div></div>
<div class="dz-skip">${t("Нажмите, чтобы пропустить", "O‘tkazib yuborish uchun bosing")}</div>
</div>
${portal ? portalHtml(l) : ""}<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="Bloger Agency">${LOGO}<span>Bloger agency</span></a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${navItems.map(([p, n]) => `<a href="${href(l, p)}"${p === path ? ' aria-current="page"' : ""}>${n}</a>`).join("")}</nav>
<div class="lang" data-addon="uz"><a href="${href("ru", path)}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz", path)}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>
<a class="btn btn-main top-cta" href="${mainTg}">${ICON.tg}${ctaText}</a>
</div></header>
<nav class="mnav" aria-label="${t("Разделы", "Bo‘limlar")}"><div class="wrap">${navItems.map(([p, n]) => `<a href="${href(l, p)}"${p === path ? ' aria-current="page"' : ""}${p === "plan" ? ' class="hot"' : ""}>${n}</a>`).join("")}</div></nav>
<main id="main">
${body}
</main>
<footer><div class="wrap">
<div class="cols">
<div><b>Bloger Agency</b><ul><li>${t("Ташкент, ул. Нукус, 81, 100207", "Toshkent, Nukus ko‘chasi, 81, 100207")}</li><li><a href="tel:+998977087867">+998 97 708 78 67</a></li><li><a href="${mainTg}">Telegram</a></li></ul></div>
<div><b>${t("Страницы", "Sahifalar")}</b><ul>${navItems.map(([p, n]) => `<li><a href="${href(l, p)}">${n}</a></li>`).join("")}</ul></div>
<div><b>${t("Мы в сети", "Biz ijtimoiy tarmoqlarda")}</b><ul><li><a href="https://www.instagram.com/bloger.agency/">Instagram</a></li><li><a href="https://www.youtube.com/@baluev_george">YouTube</a></li><li><a href="https://t.me/blogyuz_bot">BLOGY ${t("в Telegram", "Telegramda")}</a></li></ul></div>
</div>
<div class="rights"><span>${t("Это прототип: так может выглядеть новый сайт Bloger Agency. Тексты, цены, блогеры и отзывы взяты с bloger.agency (снято 05.10.2026). ИИ-инструменты, UGC-студию, калькулятор и слот-машину предлагаем мы.", "Bu prototip: Bloger Agency’ning yangi sayti shunday ko‘rinishi mumkin. Matnlar, narxlar, blogerlar va sharhlar bloger.agency saytidan olingan (05.10.2026). AI-vositalar, UGC-studiya, kalkulyator va slot-mashinani biz taklif qilamiz.")}</span><span>${t("Прототип принадлежит DevUz Studio. Использовать его можно только по договору. Подробнее:", "Prototip DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin. Batafsil:")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari")}</a></span></div>
</div></footer>
<div class="dock" id="dock" data-addon="tgbtn"><a class="btn btn-main" href="${mainTg}">${ICON.tg}${ctaText}</a></div>
<div class="cart" id="cart" role="region" aria-label="${t("Подборка", "Tanlov")}"><div><b id="cart-n"></b><span id="cart-s"></span></div><button class="copy" type="button" id="cart-clear">${t("Очистить", "Tozalash")}</button><a class="btn btn-main btn-sm" id="cart-go" href="${mainTg}">${t("Отправить", "Yuborish")}</a></div>
${dockHtml(l, path)}
<script type="application/json" id="i18n">${JSON.stringify(I18N[l]).replace(/</g, "\\u003c")}</script>
<script type="application/json" id="cat">${CAT}</script>
<script>
${JS}</script>
</body>
</html>`;
}

function portalHtml(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  return `<section class="gp" id="gp" aria-label="Bloger Agency" data-addon="portal">
<div class="gp-probe" aria-hidden="true"></div>
<div class="gp-pin">
<div class="gp-field" aria-hidden="true"></div>
<svg class="gp-art" aria-hidden="true" focusable="false"><defs><clipPath id="gp-clip" clipPathUnits="userSpaceOnUse"><text font-family="Unbounded, sans-serif" font-weight="700" font-size="100"></text><text font-family="Unbounded, sans-serif" font-weight="700" font-size="100"></text></clipPath></defs></svg>
<div class="gp-poster" aria-hidden="true"><span>BLOGER</span><span>AGENCY</span></div>
<p class="gp-top">${t("Инфлюенс-агентство · Ташкент", "Influencer agentligi · Toshkent")}</p>
<div class="gp-bottom"><p>${t("Листайте вниз, зайдём внутрь буквы", "Pastga suring, harf ichiga kiramiz")}</p><a class="gp-skip" href="#hero">${t("Пропустить", "O‘tkazib yuborish")}</a></div>
<div class="gp-in"><h2>${t("Реклама у блогеров: доступнее и проще", "Blogerlarda reklama: oson va hamyonbop")}</h2><p>${t("Bloger Agency, Ташкент", "Bloger Agency, Toshkent")}</p></div>
</div>
<script>
${GP}</script>
</section>
`;
}

/* ── Общие блоки ─────────────────────────────────────────────────────── */
const matcherBlock = (l, id = "podbor") => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const ex = l === "ru"
    ? ["Открываем кофейню в Юнусабаде, бюджет 800$, нужны сторис", "Магазин косметики на Uzum, хотим продажи по промокоду, 1500$", "Автосервис, нужен охват среди водителей Ташкента", "Детская одежда, бюджет 500$, мамы-блогеры"]
    : ["Yunusobodda qahvaxona ochyapmiz, byudjet 800$, storis kerak", "Uzum’da kosmetika do‘koni, promokod orqali sotuv, 1500$", "Avtoservis, Toshkent haydovchilari orasida qamrov kerak", "Bolalar kiyimi, byudjet 500$, ona-blogerlar"];
  return `<section id="${id}" data-addon="ai"><div class="wrap"><div class="ai rv a-pop" data-matcher>
<div>
<span class="kicker k-ai"><i></i>${t("ИИ-подбор · работает вживую", "AI-tanlov · jonli ishlaydi")}</span>
<h2 style="margin-top:16px">${t("Опишите задачу, и ИИ соберёт подборку блогеров", "Vazifani yozing, AI blogerlar tanlovini yig‘ib beradi")}</h2>
<p class="sub">${t("На вашем сайте этот блок подписан «Скоро!». Здесь он уже работает: модель переводит бриф в ниши, бюджет и цель, а подборку собирает из блогеров вашего каталога, с их охватом, ER и ценами.", "Saytingizda bu blok «Tez kunda!» deb belgilangan. Bu yerda u allaqachon ishlaydi: model brifni nisha, byudjet va maqsadga aylantiradi, tanlovni esa katalogingizdagi blogerlardan qamrovi, ER va narxlari bilan yig‘adi.")}</p>
<p style="margin-top:16px"><span class="ours">${t("Наше предложение", "Bizning taklif")}</span></p>
</div>
<div class="field">
<label for="${id}-t">${t("Ваш бриф своими словами", "Brifingiz o‘z so‘zlaringiz bilan")}</label>
<textarea id="${id}-t" maxlength="700" placeholder="${t("Что продаёте, кому, какой бюджет", "Nima sotasiz, kimga, byudjet qancha")}"></textarea>
<div class="ex">${ex.map((e) => `<button type="button">${esc(e)}</button>`).join("")}</div>
<div class="ai-actions"><button class="btn btn-main" type="button" data-go>${ICON.spark}${t("Подобрать блогеров", "Blogerlarni tanlash")}</button><span class="thinking" aria-live="polite"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>${t("ИИ читает бриф…", "AI brifni o‘qiyapti…")}</span><span class="badge" hidden></span></div>
<div class="res" hidden aria-live="polite"></div>
</div>
</div></div></section>`;
};

const finalBlock = (l) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  return `<section class="final"><div class="wrap"><div class="box rv a-pop">
<h2>${t("Готов наделать шума?", "Shov-shuv ko‘tarishga tayyormisiz?")}</h2>
<p>${t("Напишите задачу в Telegram, и мы пришлём список блогеров на утверждение и ТЗ. Оплата по этапам: перед каждой получаете акт выполненных работ.", "Vazifani Telegramga yozing, tasdiqlash uchun blogerlar ro‘yxati va TZ yuboramiz. To‘lov bosqichma-bosqich: har biridan oldin bajarilgan ishlar dalolatnomasini olasiz.")}</p>
<div class="cta" style="margin-top:8px"><a class="btn btn-main" href="${tg(t("Здравствуйте! Хочу запустить рекламу у блогеров.", "Assalomu alaykum! Blogerlarda reklama boshlamoqchiman."))}">${ICON.tg}${t("Написать в Telegram", "Telegramga yozish")}</a></div>
</div></div></section>`;
};

const quotesBlock = (l) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  // Отзывы — дословно с bloger.agency (русская версия сайта), в узбекской — перевод.
  const q = [
    ["SABANO", t("«Мне понравилось активное участие Георгия, основателя агентства, в организации рекламных кампаний. Акция, проведённая с bloger.agency, ощутимо повысила узнаваемость бренда и увеличила клиентскую базу.»", "«Agentlik asoschisi Georgiyning reklama kampaniyalarini tashkil etishdagi faol ishtiroki menga yoqdi. bloger.agency bilan o‘tkazilgan aksiya brend taniqliligini sezilarli oshirdi va mijozlar bazasini kengaytirdi.»"), t("Боис Каттаходжаев, аналитик", "Boyis Kattaxo‘jayev, tahlilchi")],
    ["Fix Price", t("«Мы запустили первые филиалы в Узбекистане и решили раскрутить эту новость через блогеров, но работа с ними была для нас затруднительна из-за неорганизованности. Bloger Agency провели отличную работу и помогли нам в этом.»", "«O‘zbekistonda birinchi filiallarni ochdik va bu yangilikni blogerlar orqali tarqatishga qaror qildik, lekin tartibsizlik tufayli ular bilan ishlash qiyin edi. Bloger Agency ajoyib ish qildi va bunda bizga yordam berdi.»"), ""],
    ["Skillbox", t("«Каждый этап работы был чётко структурирован, и я всегда была в курсе происходящего благодаря оперативной коммуникации.»", "«Ishning har bir bosqichi aniq tuzilgan edi va tezkor aloqa tufayli men doim nima bo‘layotganidan xabardor edim.»"), t("Азиза, маркетолог Lerna (Skillbox, Geekbrains, Skillfactory)", "Aziza, Lerna marketologi (Skillbox, Geekbrains, Skillfactory)")],
  ];
  return `<section data-addon="reviews"><div class="wrap">
<div class="sec-head rv a-rise"><h2>${t("Отзывы клиентов", "Mijozlar sharhlari")}</h2><p class="src">${t("Отзывы взяты с bloger.agency.", "Sharhlar bloger.agency saytidan olingan.")}</p></div>
<div class="quotes">${q.map(([n, text, who], i) => `<figure class="quote rv a-tilt" style="--d:${i * 90}ms;margin:0"><p>${esc(text)}</p><b>${esc(n)}${who ? `<small>${esc(who)}</small>` : ""}</b></figure>`).join("")}</div>
</div></section>`;
};

const eventsBlock = (l) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  return `<section data-addon="events"><div class="wrap">
<div class="sec-head rv a-rise"><h2>${t("Наши мероприятия", "Bizning tadbirlarimiz")}</h2><p>${t("Две конференции агентства, где встречаются блогеры, бренды и digital-специалисты.", "Agentlikning ikki konferensiyasi: bu yerda blogerlar, brendlar va digital-mutaxassislar uchrashadi.")}</p></div>
<div class="events">
<div class="ev a rv a-slide"><span class="tag">PRO BLOGGERS</span><p>${t("Ежегодная конференция для тех, кто работает в блогер-маркетинге. Выступают эксперты отрасли.", "Bloger-marketingda ishlaydiganlar uchun har yili o‘tkaziladigan konferensiya. Soha ekspertlari chiqish qiladi.")}</p><div class="pair"><div><b>500+</b><span>${t("участников", "ishtirokchi")}</span></div><div><b>50+</b><span>${t("спикеров", "spiker")}</span></div></div></div>
<div class="ev b rv a-side"><span class="tag">TAF</span><p>${t("Технологическая конференция для продвинутых блогеров и digital-специалистов.", "Ilg‘or blogerlar va digital-mutaxassislar uchun texnologik konferensiya.")}</p><div class="pair"><div><b>1000+</b><span>${t("участников", "ishtirokchi")}</span></div><div><b>100+</b><span>${t("спикеров", "spiker")}</span></div></div></div>
</div></div></section>`;
};

const blogyBlock = (l) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const items = l === "ru"
    ? ["Мгновенная авторизация через Telegram", "Встроенная система безопасных платежей", "Аналитика эффективности рекламных кампаний", "Система отзывов и рейтингов"]
    : ["Telegram orqali bir zumda avtorizatsiya", "Ichki xavfsiz to‘lov tizimi", "Reklama kampaniyalari samaradorligi tahlili", "Sharhlar va reytinglar tizimi"];
  return `<section data-addon="blogybox"><div class="wrap"><div class="blogy rv a-pop">
<div><span class="kicker"><i></i>BLOGY</span><h2 style="margin-top:16px">${t("Блогеры, бренды и фрилансеры в одном месте", "Blogerlar, brendlar va frilanserlar bir joyda")}</h2><p style="margin-top:16px;color:var(--fg2)">${t("Платформа агентства прямо в Telegram. Блогеры ищут рекламодателей за деньги или по бартеру, бренды публикуют задачи, фотографы, видеографы и SMM-специалисты предлагают услуги.", "Agentlikning Telegramdagi platformasi. Blogerlar pul yoki barter evaziga reklama beruvchilarni qidiradi, brendlar vazifa joylaydi, fotograf, videograf va SMM-mutaxassislar xizmat taklif qiladi.")}</p>
<div class="cta"><a class="btn btn-ghost" href="https://t.me/blogyuz_bot">${ICON.tg}${t("Открыть в Telegram", "Telegramda ochish")}</a></div></div>
<ul class="ticks">${items.map((i) => `<li>${ICON.check}<span>${esc(i)}</span></li>`).join("")}</ul>
</div></div></section>`;
};

const moreBlock = (l, skip) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const all = [
    ["plan", t("Что дальше", "Keyingi qadam"), t("Админка, кабинеты брендов и блогеров в конструкторе", "Admin panel, brend va bloger kabinetlari konstruktorda")],
    ["blogery", t("Каталог блогеров", "Blogerlar katalogi"), t("Фильтры, ER, цены и подборка в один клик", "Filtrlar, ER, narxlar va bir bosishda tanlov")],
    ["ugc", t("UGC-студия", "UGC-studiya"), t("Сценарии роликов за токены: ИИ пишет за 20 секунд", "Tokenlar evaziga rolik ssenariylari: AI 20 soniyada yozadi")],
    ["brendam", t("Брендам", "Brendlarga"), t("Услуги и цены, ИИ-бриф-мастер", "Xizmatlar va narxlar, AI brif-master")],
    ["blogeram", t("Блогерам", "Blogerlarga"), t("Заказы без переписки и оценка блога", "Yozishmalarsiz buyurtmalar va blog bahosi")],
    ["keysy", t("Кейсы", "Keyslar"), t("Бренды, этапы, мероприятия", "Brendlar, bosqichlar, tadbirlar")],
  ].filter(([p]) => p !== skip).slice(0, 4);
  return `<section><div class="wrap"><div class="more">${all.map(([p, n, d], i) => `<a class="rv a-rise" style="--d:${i * 70}ms" href="${href(l, p)}"><b>${n}</b><p>${d}</p></a>`).join("")}</div></div></section>`;
};

const phead = (l, path, crumb, kicker, h1, lead) => {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  return `<section class="phead" id="hero"><div class="wrap">
<ol class="crumbs"><li><a href="${href(l)}">Bloger Agency</a></li><li aria-current="page">${crumb}</li></ol>
${kicker}<h1 style="margin-top:16px">${h1}</h1><p class="lead">${lead}</p>
</div></section>`;
};

/* ── Главная ─────────────────────────────────────────────────────────── */
function home(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const clients = ["Schwarzkopf", "Uzum", "BYD", "Skillbox", "Fix Price", "Alif", "Payme", "Click", "Evos", "OPPO", "Honor", "Vivo", "ECCO", "Dilmah", "Uzbekistan Airways", "TengeBank", "Avo", "Globbing", "Yunusabad Gallery", "ALUTEX"];
  const ticker = clients.map((c) => `<span>${c}</span>`).join("");
  const body = `<section class="hero" id="hero"><div class="wrap hero-grid">
<div>
<span class="kicker rv a-drop"><i></i>${t("Инфлюенс-агентство · Ассоциация блогеров Узбекистана", "Influencer agentligi · O‘zbekiston blogerlari assotsiatsiyasi")}</span>
<h1 style="margin-top:24px" class="rv a-rise">${t("Реклама у блогеров Узбекистана — <em>доступнее и проще</em>", "O‘zbekiston blogerlarida reklama — <em>oson va hamyonbop</em>")}</h1>
<p class="lead rv a-rise" style="--d:120ms">${t("Подберём блогеров под вашу задачу, напишем ТЗ, проконтролируем выход и покажем статистику — переходы и охваты. Оплата по этапам: перед каждой — акт выполненных работ.", "Vazifangizga mos blogerlarni tanlaymiz, TZ yozamiz, chiqishini nazorat qilamiz va statistikani ko‘rsatamiz — o‘tishlar va qamrov. To‘lov bosqichma-bosqich: har biridan oldin — bajarilgan ishlar dalolatnomasi.")}</p>
<div class="cta rv a-rise" style="--d:200ms"><a class="btn btn-main" href="${tg(t("Здравствуйте! Хочу рекламу у блогеров — пришлите подборку под мою задачу.", "Assalomu alaykum! Blogerlarda reklama qilmoqchiman — vazifamga mos tanlov yuboring."))}">${ICON.tg}${t("Получить подборку в Telegram", "Telegramda tanlov olish")}</a><a class="link" href="#podbor">${t("Подобрать самому за 30 секунд", "30 soniyada o‘zingiz tanlang")}</a></div>
<ul class="doors rv a-rise" style="--d:280ms"><li><a href="${href(l, "brendam")}">${ICON.brand}${t("Я бренд", "Men brendman")}</a></li><li><a href="${href(l, "blogeram")}">${ICON.person}${t("Я блогер", "Men blogerman")}</a></li><li><a href="${href(l, "ugc")}">${ICON.spark}${t("UGC-студия за токены", "Tokenlar evaziga UGC-studiya")}</a></li></ul>
</div>
<div class="rv a-pop" style="--d:150ms" data-addon="stories">
<div class="phone"><div class="screen" id="screen" role="group" aria-roledescription="${t("сторис", "storis")}" aria-label="${t("Эксклюзивные блогеры агентства", "Agentlikning eksklyuziv blogerlari")}"></div></div>
<p class="phone-cap">${t("Эксклюзивные блогеры агентства — охват и цены с bloger.agency. Нажмите на экран.", "Agentlikning eksklyuziv blogerlari — qamrov va narxlar bloger.agency saytidan. Ekranga bosing.")} <span class="sr" id="st-live" aria-live="polite"></span></p>
</div>
</div></section>
<div class="ticker" data-addon="ticker" aria-label="${t("Наши клиенты", "Mijozlarimiz")}"><div class="ticker-row">${ticker}${ticker}</div></div>
<section><div class="wrap">
<div class="stats">
<div class="stat rv a-rise"><b>2500+</b><span>${t("блогеров из Узбекистана в базе", "O‘zbekistondan bazadagi blogerlar")}</span></div>
<div class="stat rv a-rise" style="--d:80ms"><b>500+</b><span>${t("реализованных проектов", "amalga oshirilgan loyihalar")}</span></div>
<div class="stat rv a-rise" style="--d:160ms"><b>50+</b><span>${t("проведённых мероприятий", "o‘tkazilgan tadbirlar")}</span></div>
<div class="stat rv a-rise" style="--d:240ms"><b>10 000 000</b><span>${t("подписчиков у блогеров в сумме", "blogerlarning jami obunachilari")}</span></div>
</div>
<p class="src" style="margin-top:16px">${t("Цифры — с bloger.agency: «2500+ блогеров» со страницы «Резиденты», остальное — из коммерческого предложения.", "Raqamlar — bloger.agency saytidan: «2500+ bloger» «Rezidentlar» sahifasidan, qolgani — tijorat taklifidan.")}</p>
</div></section>
<section id="pochemu"><div class="wrap">
<div class="sec-head rv a-rise"><h2>${t("Быстрее, безопаснее, продуктивнее, чем напрямую с блогером", "Bloger bilan to‘g‘ridan-to‘g‘ri ishlashdan ko‘ra tezroq, xavfsizroq, samaraliroq")}</h2></div>
<div class="grid g3">
<div class="card rv a-tilt"><span class="ico">${ICON.bolt}</span><h3>${t("Быстрее", "Tezroq")}</h3><p>${t("Не придётся ждать ответа блогера, придумывать и утверждать текст. Все задачи берём на себя.", "Bloger javobini kutish, matn o‘ylab topish va tasdiqlash shart emas. Barcha vazifalarni o‘zimizga olamiz.")}</p></div>
<div class="card hot rv a-tilt" style="--d:90ms"><span class="ico" style="background:rgb(0 0 0 / .15);color:var(--ink)">${ICON.shield}</span><h3>${t("Безопаснее", "Xavfsizroq")}</h3><p>${t("Берём ответственность за результат и разбиваем оплату по этапам — ваши деньги защищены.", "Natija uchun javobgarlikni olamiz va to‘lovni bosqichlarga bo‘lamiz — pulingiz himoyalangan.")}</p></div>
<div class="card rv a-tilt" style="--d:180ms"><span class="ico">${ICON.target}</span><h3>${t("Продуктивнее", "Samaraliroq")}</h3><p>${t("Работали с большинством направлений бизнеса и знаем, какой блогер подойдёт вашей компании.", "Biznesning ko‘p yo‘nalishlari bilan ishlaganmiz va kompaniyangizga qaysi bloger mos kelishini bilamiz.")}</p></div>
</div>
<div class="vs">
<div class="vs-col bad rv a-slide"><h3>${t("Напрямую с блогером", "Bloger bilan to‘g‘ridan-to‘g‘ri")}</h3><ol>${(l === "ru" ? ["Ищете блогеров и сортируете вручную", "Ждёте ответа каждого", "Сами пишете и утверждаете текст", "Платите вперёд, без акта", "Статистику просите сами — если пришлют"] : ["Blogerlarni qo‘lda qidirasiz va saralaysiz", "Har birining javobini kutasiz", "Matnni o‘zingiz yozasiz va tasdiqlaysiz", "Oldindan, dalolatnomasiz to‘laysiz", "Statistikani o‘zingiz so‘raysiz — yuborishsa"]).map((x) => `<li>${x}</li>`).join("")}</ol><p class="tot">${t("Ваше время и ваш риск", "Sizning vaqtingiz va sizning tavakkalingiz")}</p></div>
<div class="vs-col good rv a-side"><h3>${t("Через Bloger Agency", "Bloger Agency orqali")}</h3><ol>${(l === "ru" ? ["Один бриф — список блогеров на утверждение", "ТЗ для блогера и акции готовим мы", "Оплата по этапам, перед каждой — акт", "Проверяем ролик на соответствие ТЗ", "Статистика: переходы и охваты", "В течение недели блогер повторно рассказывает о вас"] : ["Bitta brif — tasdiqlash uchun blogerlar ro‘yxati", "Bloger uchun TZ va aksiyalarni biz tayyorlaymiz", "To‘lov bosqichma-bosqich, har biridan oldin — dalolatnoma", "Rolikni TZga mosligini tekshiramiz", "Statistika: o‘tishlar va qamrov", "Bir hafta ichida bloger siz haqingizda yana gapiradi"]).map((x) => `<li>${x}</li>`).join("")}</ol><p class="tot">${t("Один чат и отчёт в конце", "Bitta chat va oxirida hisobot")}</p></div>
</div>
<p class="src" style="margin-top:16px">${t("Пункты — из разделов «О нас» и КП на bloger.agency.", "Bandlar — bloger.agency saytidagi «Biz haqimizda» va tijorat taklifidan.")}</p>
</div></section>
${matcherBlock(l)}
<section id="tarify"><div class="wrap">
<div class="sec-head rv a-rise"><h2>${t("Тарифы — прямо на сайте, а не в PDF", "Tariflar — PDFda emas, to‘g‘ridan-to‘g‘ri saytda")}</h2><p>${t("Цены — из вашего коммерческого предложения. Калькулятор ниже подсвечивает тариф под бюджет.", "Narxlar — tijorat taklifingizdan. Quyidagi kalkulyator byudjetga mos tarifni belgilaydi.")}</p></div>
<div class="tariffs">
${[
  ["silver", "SILVER", "$700", t(["3–5 блогеров, от 20k до 150k подписчиков", "Просмотры целевой аудитории: от 200k до 400k", "Вовлечённость: от 10%", "Переходов: от 200"], ["3–5 bloger, 20k dan 150k gacha obunachi", "Maqsadli auditoriya ko‘rishlari: 200k dan 400k gacha", "Jalb qilish: 10% dan", "O‘tishlar: 200 dan"])],
  ["gold", "GOLD", "$1200", t(["3–6 блогеров, от 50k до 300k подписчиков", "Просмотры целевой аудитории: от 200k до 500k", "Вовлечённость: от 20%", "Переходов: от 400"], ["3–6 bloger, 50k dan 300k gacha obunachi", "Maqsadli auditoriya ko‘rishlari: 200k dan 500k gacha", "Jalb qilish: 20% dan", "O‘tishlar: 400 dan"])],
  ["platinum", "PLATINUM", "$2000", t(["5–10 блогеров, от 50k до 1M подписчиков", "Просмотры целевой аудитории: от 300k до 1M", "Вовлечённость: от 40%", "Переходов: от 800"], ["5–10 bloger, 50k dan 1M gacha obunachi", "Maqsadli auditoriya ko‘rishlari: 300k dan 1M gacha", "Jalb qilish: 40% dan", "O‘tishlar: 800 dan"])],
].map(([k, n, p, li], i) => `<div class="tariff rv a-rise" style="--d:${i * 90}ms" data-t="${k}"><span class="name">${n}</span><span class="price num">${p}</span><ul>${li.map((x) => `<li>${x}</li>`).join("")}</ul></div>`).join("")}
</div>
<div class="calc dark" id="calc" style="margin-top:24px" data-addon="calc">
<div style="display:grid;gap:24px;align-content:start">
<div><span class="ours">${t("Наше предложение: калькулятор", "Bizning taklif: kalkulyator")}</span><h3 style="margin-top:12px">${t("Калькулятор кампании", "Kampaniya kalkulyatori")}</h3></div>
<div class="field"><div class="range-row"><label for="c-b">${t("Бюджет", "Byudjet")}</label><b id="c-bv">$1200</b></div><input type="range" id="c-b" min="300" max="5000" step="50" value="1200"></div>
<div class="field"><span class="lbl">${t("Формат", "Format")}</span><div class="tabs"><button class="tab" type="button" data-fmt="story" aria-pressed="true">Story</button><button class="tab" type="button" data-fmt="post" aria-pressed="false">Post</button></div></div>
<div class="field"><label for="c-n">${t("Ниша", "Nisha")}</label><select id="c-n"><option value="all">${t("Любая", "Istalgan")}</option>${nicheKeys.map((k) => `<option value="${k}">${esc(nicheNames[l][k])}</option>`).join("")}</select></div>
</div>
<div style="display:grid;gap:12px;align-content:start">
<div class="out-grid">
<div class="out"><small>${t("Блогеров из каталога", "Katalogdan blogerlar")}</small><b id="c-cnt">—</b></div>
<div class="out"><small>${t("Подписчиков суммарно", "Jami obunachilar")}</small><b id="c-fl">—</b></div>
<div class="out"><small>${t("Прогноз просмотров", "Ko‘rishlar prognozi")}</small><b id="c-v">—</b></div>
<div class="out"><small>${t("Переходов", "O‘tishlar")}</small><b id="c-cl">—</b></div>
<div class="out wide"><small>${t("Ваш тариф", "Sizning tarifingiz")}</small><b id="c-t">—</b></div>
</div>
<p class="src">${t("Блогеры — самые выгодные по цене за 1000 подписчиков из вашего каталога. Просмотры и переходы — по соотношениям ваших тарифов Silver–Platinum. Это оценка, не обещание.", "Blogerlar — katalogingizdan 1000 obunachi narxi bo‘yicha eng foydalilari. Ko‘rishlar va o‘tishlar — Silver–Platinum tariflaringiz nisbatlari bo‘yicha. Bu baho, va’da emas.")}</p>
<a class="btn btn-main" id="c-go" href="${tg(t("Здравствуйте! Хочу обсудить кампанию.", "Assalomu alaykum! Kampaniyani muhokama qilmoqchiman."))}">${ICON.tg}${t("Обсудить кампанию", "Kampaniyani muhokama qilish")}</a>
</div>
</div>
</div></section>
<section id="konstruktor-teaser"><div class="wrap"><div class="kit-teaser rv a-pop">
<div><span class="ours">${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</span><h2 style="margin-top:16px">${t("Конструктор проекта: сайт и всё, что агентству нужно дальше", "Loyiha konstruktori: sayt va agentlikka keyin kerak bo‘ladigan hamma narsa")}</h2><p>${t("Каждый блок этого прототипа — тумблер: выключили — пропал со страницы, включили — вернулся. Плюс то, чего на макете не видно: админка, кампании по вашим 8 этапам, кабинеты бренда и блогера, оплата Click и Payme. Итог считается сразу.", "Bu prototipning har bir bloki — tumbler: o‘chirdingiz — sahifadan yo‘qoldi, yoqdingiz — qaytdi. Va maketda ko‘rinmaydigan narsalar: admin panel, 8 bosqichingiz bo‘yicha kampaniyalar, brend va bloger kabinetlari, Click va Payme to‘lovi. Jami darhol hisoblanadi.")}</p></div>
<div class="kit-teaser-side"><small>${t("Сайт", "Sayt")}</small><b class="num">${usd(KIT_BASE.price)}</b><span>${t("+ блоки на выбор", "+ tanlov bo‘yicha bloklar")}</span><button class="btn btn-main" type="button" data-kit-open>${t("Открыть конструктор", "Konstruktorni ochish")}</button><a class="link" href="${href(l, "plan")}">${t("Что ещё нужно агентству", "Agentlikka yana nima kerak")}</a></div>
</div></div></section>
<section data-addon="slot"><div class="wrap"><div class="slot rv a-swing" id="slot">
<div><span class="ours">${t("Наше предложение: генератор идей", "Bizning taklif: g‘oyalar generatori")}</span><h2 style="margin-top:16px">${t("Не знаете, с чего начать? Крутите", "Nimadan boshlashni bilmaysizmi? Aylantiring")}</h2><p style="margin-top:16px;color:var(--fg2)">${t("Ниша, формат из ваших услуг и фишка — идея кампании за одно нажатие. Понравилась — отправьте менеджеру.", "Nisha, xizmatlaringizdan format va fishka — bir bosishda kampaniya g‘oyasi. Yoqdimi — menejerga yuboring.")}</p></div>
<div style="display:grid;gap:16px">
<div class="reels" aria-hidden="true"><div class="reel"><div class="strip"></div></div><div class="reel"><div class="strip"></div></div><div class="reel"><div class="strip"></div></div></div>
<div class="idea" id="idea" aria-live="polite"><small>${t("Идея кампании", "Kampaniya g‘oyasi")}</small>${t("Нажмите «Крутить»", "«Aylantirish»ni bosing")}</div>
<div class="ai-actions"><button class="btn btn-sun" type="button" id="spin">${t("Крутить", "Aylantirish")}</button><a class="btn btn-ghost" id="idea-go" href="${tg(t("Здравствуйте! Хочу обсудить идею кампании.", "Assalomu alaykum! Kampaniya g‘oyasini muhokama qilmoqchiman."))}" hidden>${ICON.tg}${t("Обсудить идею", "G‘oyani muhokama qilish")}</a></div>
</div>
</div></div></section>
<section data-addon="ugc"><div class="wrap"><a class="card blue rv a-pop" href="${href(l, "ugc")}" style="text-decoration:none;padding:32px">
<span class="kicker" style="background:var(--ink);color:var(--fg)"><i style="background:var(--sun)"></i>${t("Сервис внутри сервиса", "Servis ichidagi servis")}</span>
<h2>${t("UGC-студия за токены: хуки, сценарий и раскадровка за 20 секунд", "Tokenlar evaziga UGC-studiya: xuklar, ssenariy va raskadrovka 20 soniyada")}</h2>
<p style="font-size:18px">${t("Бренд описывает продукт — ИИ пишет ролик, блогеры агентства снимают его по вашему прайсу. Новый продукт для малого бизнеса, которому агентство полного цикла пока не по карману.", "Brend mahsulotni tasvirlaydi — AI rolik yozadi, agentlik blogerlari uni sizning narxlaringiz bo‘yicha suratga oladi. To‘liq siklli agentlik hozircha qimmatlik qiladigan kichik biznes uchun yangi mahsulot.")}</p>
<b>${t("Открыть UGC-студию →", "UGC-studiyani ochish →")}</b>
</a></div></section>
${eventsBlock(l)}
${blogyBlock(l)}
${quotesBlock(l)}
<section><div class="wrap"><div class="note rv a-pop">
<span class="note-tag">${t("Заметка от DevUz Studio", "DevUz Studio’dan eslatma")}</span>
<h2>${t("Что мы поменяли и почему", "Nimani o‘zgartirdik va nima uchun")}</h2>
<p class="sub">${t("Мы прошли по bloger.agency как бренд, который ищет блогеров. Вот что мешает ему написать вам — и что в прототипе уже исправлено.", "bloger.agency saytini bloger qidirayotgan brend sifatida ko‘rib chiqdik. Uni sizga yozishdan nima to‘xtatadi — va prototipda nima allaqachon tuzatilgan.")}</p>
<div class="fix">
<div><b>${t("AI-помощник: <s>«Скоро!»</s> → работает", "AI-yordamchi: <s>«Tez kunda!»</s> → ishlaydi")}</b><span>${t("Подбор по брифу, бриф-мастер и UGC-генератор отвечают вживую. Кнопка «Скоро!» на главной говорит бренду, что сервиса нет.", "Brif bo‘yicha tanlov, brif-master va UGC-generator jonli javob beradi. Bosh sahifadagi «Tez kunda!» tugmasi brendga servis yo‘qligini aytadi.")}</span></div>
<div><b>${t("Цены: <s>в PDF</s> → на витрине", "Narxlar: <s>PDFda</s> → vitrinada")}</b><span>${t("Тарифы, бартер, видео и цены блогеров видны сразу, а калькулятор сам подсвечивает тариф. Человек, который увидел цену, пишет уже с бюджетом.", "Tariflar, barter, video va blogerlar narxlari darhol ko‘rinadi, kalkulyator esa tarifni o‘zi belgilaydi. Narxni ko‘rgan odam byudjet bilan yozadi.")}</span></div>
<div><b>${t("Цифры расходятся", "Raqamlar bir-biriga mos emas")}</b><span>${t("Блогеров в базе: 1700 («О нас»), 2000+ (КП, «Ивенты»), 2500+ («Резиденты»). Опыт: «более 4 лет», «с 2020 года», «более 5 лет». Бренд это замечает — нужна одна цифра на весь сайт.", "Bazadagi blogerlar: 1700 («Biz haqimizda»), 2000+ (TT, «Tadbirlar»), 2500+ («Rezidentlar»). Tajriba: «4 yildan ortiq», «2020 yildan», «5 yildan ortiq». Brend buni sezadi — butun sayt uchun bitta raqam kerak.")}</span></div>
<div><b>${t("Кейсы с одинаковыми цифрами", "Bir xil raqamli keyslar")}</b><span>${t("У Alif и Skillbox на странице «Бизнесу» одни и те же 120 креаторов, 300+ единиц контента, 172 млн показов и 50 млн просмотров. Похоже на шаблон — у каждого кейса должны быть свои цифры.", "«Biznesga» sahifasida Alif va Skillbox’da bir xil 120 kreator, 300+ kontent, 172 mln ko‘rsatish va 50 mln ko‘rish. Shablonga o‘xshaydi — har bir keysning o‘z raqamlari bo‘lishi kerak.")}</span></div>
<div><b>${t("Опечатки на bloger.agency", "bloger.agency’dagi xatolar")}</b><span>${t("Сейчас на вашем сайте: на странице «Бизнесу» компания четыре раза названа <s>BLOGET AGENCY</s>, на главной — «ассоциация <s>блоегров</s>», на «Оценке» — куски на английском. В прототипе везде Bloger Agency и «ассоциация блогеров».", "Hozir saytingizda: «Biznesga» sahifasida kompaniya to‘rt marta <s>BLOGET AGENCY</s> deb atalgan, bosh sahifada — «ассоциация <s>блоегров</s>», «Baholash» sahifasida — inglizcha bo‘laklar. Prototipda hamma joyda Bloger Agency.")}</span></div>
<div><b>${t("Каталог: дубль и подборка", "Katalog: dubl va tanlov")}</b><span>${t("@gurmandiyauz стоял в каталоге дважды. Теперь у каждой карточки кнопка «В подборку», а подборка уходит менеджеру в Telegram одним сообщением.", "@gurmandiyauz katalogda ikki marta turgan edi. Endi har bir kartochkada «Tanlovga» tugmasi bor, tanlov esa menejerga Telegramda bitta xabar bo‘lib ketadi.")}</span></div>
</div>
<div class="cta"><a class="btn btn-main" href="${href(l, "plan")}">${t("Что ещё нужно агентству — конструктор проекта", "Agentlikka yana nima kerak — loyiha konstruktori")}</a></div>
</div></div></section>
${finalBlock(l)}`;
  return shell(l, "", {
    title: t("Bloger Agency — реклама у блогеров в Узбекистане: подбор, запуск, аналитика", "Bloger Agency — O‘zbekistonda blogerlarda reklama: tanlov, ishga tushirish, tahlil"),
    desc: t("Продвижение через блогеров в Узбекистане: подбор, ТЗ, запуск и статистика. 2500+ блогеров в базе, тарифы от $700, оплата по этапам. ИИ-подбор по брифу.", "O‘zbekistonda blogerlar orqali reklama: tanlov, TZ, ishga tushirish va statistika. Bazada 2500+ bloger, tariflar $700 dan, bosqichma-bosqich to‘lov. Brif bo‘yicha AI-tanlov."),
  }, body, { portal: true });
}

/* ── Каталог ─────────────────────────────────────────────────────────── */
function catalog(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const tabs = [["all", t("Все", "Hammasi")], ["top", "★ TOP"], ...nicheKeys.map((k) => [k, nicheNames[l][k]])];
  const body = `${phead(l, "blogery", t("Блогеры", "Blogerlar"), `<span class="kicker"><i></i>${t("Каталог агентства", "Agentlik katalogi")}</span>`, t("Блогеры на эксклюзиве", "Eksklyuziv blogerlar"), t("64 блогера из каталога bloger.agency, 16 из них — топ. Фильтры по нише и охвату, сортировка по ER и цене за 1000 подписчиков. Добавляйте в подборку — она уйдёт менеджеру в Telegram одним сообщением.", "bloger.agency katalogidan 64 bloger, ulardan 16 tasi — top. Nisha va qamrov bo‘yicha filtrlar, ER va 1000 obunachi narxi bo‘yicha saralash. Tanlovga qo‘shing — u menejerga Telegramda bitta xabar bo‘lib ketadi."))}
${matcherBlock(l, "ai-podbor")}
<section id="katalog" style="padding-top:0"><div class="wrap dark">
<div class="filters">
<div class="tabs" id="cat-tabs">${tabs.map(([k, n], i) => `<button class="tab" type="button" data-n="${k}" aria-pressed="${i === 0}">${esc(n)}</button>`).join("")}</div>
<div class="field"><label for="cat-size">${t("Подписчики", "Obunachilar")}</label><select id="cat-size"><option value="all">${t("Любое число", "Istalgan")}</option><option value="s">${t("до 30K", "30K gacha")}</option><option value="m">30K – 100K</option><option value="l">100K – 300K</option><option value="xl">300K+</option></select></div>
<div class="field"><label for="cat-sort">${t("Сортировка", "Saralash")}</label><select id="cat-sort"><option value="er">${t("По ER", "ER bo‘yicha")}</option><option value="f">${t("По охвату", "Qamrov bo‘yicha")}</option><option value="p">${t("Сначала недорогие", "Avval arzonlari")}</option><option value="k">${t("По цене за 1000 подписчиков", "1000 obunachi narxi bo‘yicha")}</option></select></div>
<div class="field"><div class="range-row"><label for="cat-max">${t("Сторис не дороже", "Storis narxi ko‘pi bilan")}</label><b id="cat-max-v" style="font-size:18px">${t("любая", "istalgan")}</b></div><input type="range" id="cat-max" min="25" max="600" step="25" value="600"></div>
</div>
<div class="found"><span id="cat-found"></span><span class="src">${t("Цены и ER — с bloger.agency, могут быть не актуальны.", "Narxlar va ER — bloger.agency saytidan, eskirgan bo‘lishi mumkin.")}</span></div>
<div class="cat-grid" id="cat-grid"></div>
</div></section>
${moreBlock(l, "blogery")}`;
  return shell(l, "blogery", {
    title: t("Блогеры Узбекистана на эксклюзиве — каталог с ценами | Bloger Agency", "O‘zbekistonning eksklyuziv blogerlari — narxlari bilan katalog | Bloger Agency"),
    desc: t("Каталог блогеров Узбекистана: ниши, подписчики, ER, цены за сторис и пост. ИИ-подбор по брифу и подборка в Telegram.", "O‘zbekiston blogerlari katalogi: nishalar, obunachilar, ER, storis va post narxlari. Brif bo‘yicha AI-tanlov va Telegramga tanlov."),
  }, body);
}

/* ── UGC-студия ──────────────────────────────────────────────────────── */
function ugc(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const ex = l === "ru"
    ? ["Плов-центр в Чиланзаре, новая доставка за 30 минут", "Крем для рук на Uzum, 49 000 сум", "Курсы английского для школьников", "Кофейня с десертами в Юнусабаде"]
    : ["Chilonzordagi osh markazi, yangi yetkazib berish", "Uzum’dagi qo‘l kremi, 49 000 so‘m", "Maktab o‘quvchilari uchun ingliz tili kurslari", "Yunusoboddagi desertli qahvaxona"];
  const body = `${phead(l, "ugc", t("UGC-студия", "UGC-studiya"), `<span class="ours">${t("Сервис внутри сервиса · наше предложение", "Servis ichidagi servis · bizning taklif")}</span>`, t("UGC-студия за токены", "Tokenlar evaziga UGC-studiya"), t("UGC — ролики, которые снимают обычные люди, а не студия: распаковка, отзыв, «день из жизни». Опишите продукт — ИИ за 20 секунд напишет пять хуков, сценарий по секундам, раскадровку и подпись. Понравилось — блогеры агентства снимут ролик.", "UGC — studiya emas, oddiy odamlar suratga oladigan roliklar: raspakovka, sharh, «bir kunim». Mahsulotni tasvirlang — AI 20 soniyada beshta xuk, soniyalar bo‘yicha ssenariy, raskadrovka va izoh yozadi. Yoqdimi — agentlik blogerlari rolikni suratga oladi."))}
<section style="padding-top:0" data-addon="ugc"><div class="wrap">
<div class="wallet rv a-drop"><div class="coin"><i>B</i><div><b data-coins>40</b> <span>${t("токенов в демо-кошельке", "demo-hamyonda token")}</span></div></div><button class="btn btn-sun btn-sm" type="button" data-refill>${t("+40 токенов (демо)", "+40 token (demo)")}</button></div>
<div class="studio" id="studio" style="margin-top:24px">
<div class="panel dark rv a-slide">
<h3>${t("Что снимаем?", "Nimani suratga olamiz?")}</h3>
<div class="field"><label for="u-text">${t("Продукт и задача", "Mahsulot va vazifa")}</label><textarea id="u-text" maxlength="700" placeholder="${t("Например: крем для рук на Uzum, хотим продажи", "Masalan: Uzum’dagi qo‘l kremi, sotuv kerak")}"></textarea><div class="ex">${ex.map((e) => `<button type="button">${esc(e)}</button>`).join("")}</div></div>
<div class="field"><span class="lbl">${t("Площадка", "Platforma")}</span><div class="tabs">${[["reels", "Reels"], ["tiktok", "TikTok"], ["shorts", "Shorts"], ["stories", "Stories"]].map(([k, n], i) => `<button class="tab" type="button" data-pl="${k}" aria-pressed="${i === 0}">${n}</button>`).join("")}</div></div>
<div class="field"><span class="lbl">${t("Тон", "Ohang")}</span><div class="tabs">${[["fun", t("С юмором", "Hazil bilan")], ["expert", t("Экспертно", "Ekspert")], ["emotional", t("История", "Hikoya")], ["review", t("Честный отзыв", "Halol sharh")]].map(([k, n], i) => `<button class="tab" type="button" data-tone="${k}" aria-pressed="${i === 0}">${n}</button>`).join("")}</div></div>
<div class="ai-actions"><button class="btn btn-main" type="button" id="u-go">${ICON.spark}${t("Сгенерировать", "Yaratish")}</button><span class="cost">${t("10 токенов", "10 token")}</span></div>
<p class="src" id="u-msg" hidden></p>
<span class="thinking" id="u-think" aria-live="polite"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>${t("ИИ пишет сценарий…", "AI ssenariy yozyapti…")}</span>
</div>
<div class="panel rv a-side" aria-live="polite"><div class="res" id="u-res" hidden></div><div id="u-empty"><h3>${t("Здесь появится ролик", "Rolik shu yerda paydo bo‘ladi")}</h3><p class="src" style="margin-top:8px">${t("Хуки, сценарий по секундам с текстом на экране, раскадровка из 5–6 кадров, подпись и хэштеги. Всё можно скопировать или сразу отдать блогерам.", "Xuklar, ekrandagi matn bilan soniyalar bo‘yicha ssenariy, 5–6 kadrli raskadrovka, izoh va heshteglar. Hammasini nusxalash yoki darhol blogerlarga berish mumkin.")}</p></div></div>
</div>
</div></section>
<section data-addon="ugc"><div class="wrap">
<div class="sec-head rv a-rise"><span class="ours">${t("Пример тарифов — цену назначаете вы", "Tariflar namunasi — narxni siz belgilaysiz")}</span><h2>${t("Пакеты токенов", "Token paketlari")}</h2><p>${t("Сценарий — 10 токенов, бриф — 5. Токены покупают малый бизнес и SMM-щики, которым нужен сценарий сегодня, а не через неделю. Каждая генерация — повод предложить съёмку у ваших блогеров.", "Ssenariy — 10 token, brif — 5. Tokenlarni bugun ssenariy kerak bo‘lgan kichik biznes va SMM-mutaxassislar sotib oladi. Har bir generatsiya — blogerlaringizda suratga olishni taklif qilish uchun sabab.")}</p></div>
<div class="packs">
${[
  [t("Проба", "Sinov"), "40", t("Бесплатно при входе через Telegram", "Telegram orqali kirganda bepul"), t(["4 сценария роликов", "Без карты"], ["4 ta rolik ssenariysi", "Kartasiz"]), false],
  [t("Бренд", "Brend"), "300", t("пример: $15", "namuna: $15"), t(["30 сценариев или 60 брифов", "Сохранение в кабинете", "Скидка на съёмку у блогеров"], ["30 ta ssenariy yoki 60 ta brif", "Kabinetda saqlash", "Blogerlarda suratga olishga chegirma"]), true],
  [t("Агентство", "Agentlik"), "1500", t("пример: $59", "namuna: $59"), t(["150 сценариев", "Командный доступ", "Свой тон бренда в генерации"], ["150 ta ssenariy", "Jamoaviy kirish", "Generatsiyada brendning o‘z ohangi"]), false],
].map(([n, tk, price, li, best], i) => `<div class="pack${best ? " best" : ""} rv a-rise" style="--d:${i * 90}ms"><b>${n}</b><span class="tk num">${tk}</span><span class="src">${t("токенов", "token")} · ${price}</span><ul>${li.map((x) => `<li>${x}</li>`).join("")}</ul><a class="btn ${best ? "btn-sun" : "btn-ghost"} btn-sm" href="${tg(t(`Здравствуйте! Хочу пакет токенов «${n}» в UGC-студии.`, `Assalomu alaykum! UGC-studiyada «${n}» token paketini xohlayman.`))}">${t("Хочу этот пакет", "Shu paketni xohlayman")}</a></div>`).join("")}
</div>
</div></section>
<section><div class="wrap">
<div class="sec-head rv a-rise"><h2>${t("Сценарий есть — снимаем у блогеров", "Ssenariy tayyor — blogerlarda suratga olamiz")}</h2><p>${t("Цены на видео — из вашего коммерческого предложения: креативная концепция, съёмка под ключ и постпродакшн.", "Video narxlari — tijorat taklifingizdan: kreativ konsepsiya, kalit topshiriladigan suratga olish va postprodakshn.")}</p></div>
<div class="grid g4">
${[["10", "$650", "$65"], ["20", "$1100", "$55"], ["30", "$1500", "$50"]].map(([n, p, per], i) => `<div class="card rv a-pop" style="--d:${i * 80}ms"><span class="n">${n} ${t("видео", "video")}</span><b style="font:700 36px/1 var(--display)">${p}</b><p>${t(`≈ ${per} за ролик`, `rolik uchun ≈ ${per}`)}</p></div>`).join("")}
<div class="card hot rv a-pop" style="--d:240ms"><span class="n">${t("Блогеры-модели", "Bloger-modellar")}</span><b style="font:700 36px/1 var(--display)">${t("от $200", "$200 dan")}</b><p>${t("за ролик: подбор, образ, подготовка к съёмке", "rolik uchun: tanlov, obraz, suratga olishga tayyorlov")}</p></div>
</div>
</div></section>
<section><div class="wrap">
<div class="sec-head rv a-rise"><h2>${t("Как это работает", "Bu qanday ishlaydi")}</h2></div>
<ol class="steps">${(l === "ru" ? [["Опишите продукт", "Пара фраз: что продаёте и кому"], ["ИИ пишет ролик", "Хуки, сценарий, раскадровка — за 20 секунд"], ["Блогер снимает", "Агентство подбирает автора и следит за ТЗ"], ["Ролик ваш", "Публикуете у себя или запускаете в рекламу"]] : [["Mahsulotni tasvirlang", "Bir-ikki jumla: nima sotasiz va kimga"], ["AI rolik yozadi", "Xuklar, ssenariy, raskadrovka — 20 soniyada"], ["Bloger suratga oladi", "Agentlik muallifni tanlaydi va TZni kuzatadi"], ["Rolik sizniki", "O‘zingizda joylaysiz yoki reklamaga qo‘yasiz"]]).map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join("")}</ol>
</div></section>
${moreBlock(l, "ugc")}`;
  return shell(l, "ugc", {
    title: t("UGC-студия: сценарии роликов за токены и съёмка у блогеров | Bloger Agency", "UGC-studiya: tokenlar evaziga rolik ssenariylari va blogerlarda suratga olish | Bloger Agency"),
    desc: t("ИИ пишет хуки, сценарий, раскадровку и подпись для UGC-ролика за 20 секунд. Съёмка у блогеров Узбекистана: 10 видео — $650.", "AI UGC-rolik uchun xuklar, ssenariy, raskadrovka va izohni 20 soniyada yozadi. O‘zbekiston blogerlarida suratga olish: 10 video — $650."),
  }, body);
}

/* ── Брендам ─────────────────────────────────────────────────────────── */
function brands(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const exB = l === "ru"
    ? ["Открываем второй филиал фитнес-клуба в Сергели, хотим заявки", "Запускаем новый вкус лимонада, нужна узнаваемость летом", "Магазин детских игрушек, нужен бартер с мамами-блогерами"]
    : ["Sergelida fitnes-klubning ikkinchi filialini ochyapmiz, arizalar kerak", "Limonadning yangi ta’mini chiqaryapmiz, yozda taniqlilik kerak", "Bolalar o‘yinchoqlari do‘koni, ona-blogerlar bilan barter kerak"];
  const priceRows = (rows) => `<div class="pricebox">${rows.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join("")}</div>`;
  const barter = priceRows([[t("7–10 блогеров", "7–10 bloger"), "$400"], [t("15–20 блогеров", "15–20 bloger"), "$750"], [t("25–30 блогеров", "25–30 bloger"), "$1000"], [t("100+ блогеров", "100+ bloger"), "$3000"]]);
  const svc = [
    [t("Инфлюенс-маркетинг", "Influencer marketing"), t("Подбор блогеров, ТЗ, контроль выхода и статистика. Тарифы Silver, Gold и Platinum.", "Blogerlarni tanlash, TZ, chiqishni nazorat qilish va statistika. Silver, Gold va Platinum tariflari."), [], priceRows([["Silver", "$700"], ["Gold", "$1200"], ["Platinum", "$2000"]])],
    [t("Бартер", "Barter"), t("Вы даёте блогерам депозит, услугу или продукт, они рекламируют вас в сторис с отметкой — по заранее прописанному ТЗ.", "Siz blogerlarga depozit, xizmat yoki mahsulot berasiz, ular sizni oldindan yozilgan TZ bo‘yicha belgilab storisda reklama qiladi."), t(["Рестораны и бары, гостиницы", "Beauty, развлечения, ритейл, клиники"], ["Restoran va barlar, mehmonxonalar", "Beauty, ko‘ngilochar, riteyl, klinikalar"]), barter],
    [t("Развоз пригласительных и подарков", "Taklifnoma va sovg‘alarni yetkazish"), t("Доставка пригласительных, гифтбоксов или подарков блогерам, аниматоры для контента, отчёт в конце.", "Blogerlarga taklifnoma, giftbox yoki sovg‘alarni yetkazish, kontent uchun animatorlar, oxirida hisobot."), [], barter],
    [t("Амбассадорство", "Ambassadorlik"), t("Блогер становится лицом бренда от 3 месяцев: конкуренты его в этот период не привлекут, цены фиксированы на весь срок, скидки за объём.", "Bloger 3 oydan boshlab brend yuziga aylanadi: bu davrda raqobatchilar uni jalb qila olmaydi, narxlar butun muddatga qat’iy, hajm uchun chegirmalar."), [], ""],
    [t("Видео-production", "Video-prodakshn"), t("Креативная концепция, съёмка под ключ, монтаж, моушн-дизайн и цветокоррекция.", "Kreativ konsepsiya, kalit topshiriladigan suratga olish, montaj, moushn-dizayn va rang korreksiyasi."), [], priceRows([[t("10 видео", "10 video"), "$650"], [t("20 видео", "20 video"), "$1100"], [t("30 видео", "30 video"), "$1500"]])],
    [t("Блогеры-модели для съёмок", "Suratga olish uchun bloger-modellar"), t("Модели, блогеры и актрисы для роликов, фотосессий и мероприятий: подбор, образ, подготовка.", "Roliklar, fotosessiyalar va tadbirlar uchun modellar, blogerlar va aktrisalar: tanlov, obraz, tayyorlov."), [], priceRows([[t("за ролик", "rolik uchun"), t("от $200", "$200 dan")]])],
    [t("Ивенты под ключ", "Kalit topshiriladigan tadbirlar"), t("Концепция, площадка, подрядчики, бюджет и блогеры на вашем событии.", "Konsepsiya, maydon, pudratchilar, byudjet va tadbiringizdagi blogerlar."), [], ""],
    [t("СМИ и Telegram-каналы", "OAV va Telegram-kanallar"), t("Подбор площадок по тематике и охвату, размещение и отчёт: охват, вовлечённость.", "Mavzu va qamrov bo‘yicha maydonlarni tanlash, joylashtirish va hisobot: qamrov, jalb qilish."), [], ""],
    [t("SMM, личный бренд, AI-аватары", "SMM, shaxsiy brend, AI-avatarlar"), t("Ведение соцсетей, продвижение личного бренда, AI-аватары, коммьюнити-боты и AI-операторы.", "Ijtimoiy tarmoqlarni yuritish, shaxsiy brendni rivojlantirish, AI-avatarlar, hamjamiyat botlari va AI-operatorlar."), [], ""],
  ];
  const steps = l === "ru"
    ? [["Отправка брифа", "чтобы определить аудиторию и блогеров"], ["ТЗ для блогера", "и проработка акций"], ["Предоплата", "и список блогеров на утверждение"], ["Стратегия и визуал", "утверждаем с вами"], ["Контроль", "реализации кампании"], ["Проверка работы", "на соответствие ТЗ, согласование с вами"], ["Статистика", "переходы, охват"], ["Следующая волна", "новый список блогеров по результатам"]]
    : [["Brif yuborish", "auditoriya va blogerlarni aniqlash uchun"], ["Bloger uchun TZ", "va aksiyalarni ishlab chiqish"], ["Oldindan to‘lov", "va tasdiqlash uchun blogerlar ro‘yxati"], ["Strategiya va vizual", "siz bilan tasdiqlaymiz"], ["Nazorat", "kampaniya amalga oshirilishini"], ["Ishni tekshirish", "TZga mosligi, siz bilan kelishish"], ["Statistika", "o‘tishlar, qamrov"], ["Keyingi to‘lqin", "natijalar bo‘yicha yangi blogerlar ro‘yxati"]];
  const body = `${phead(l, "brendam", t("Брендам", "Brendlarga"), `<span class="kicker"><i></i>${t("Агентство полного цикла", "To‘liq siklli agentlik")}</span>`, t("Брендам: от стратегии до финального отчёта", "Brendlarga: strategiyadan yakuniy hisobotgacha"), t("Подбор креаторов, генерация контента, распределение по платформам и аналитика. Ниже — услуги с ценами из вашего КП и ИИ-бриф-мастер: две фразы о задаче превращаются в бриф, с которым менеджер сразу берётся за работу.", "Kreatorlarni tanlash, kontent yaratish, platformalar bo‘yicha tarqatish va tahlil. Quyida — TTdagi narxlar bilan xizmatlar va AI brif-master: vazifa haqidagi ikki jumla menejer darhol ishga kirishadigan brifga aylanadi."))}
<section id="brif" style="padding-top:0" data-addon="brief"><div class="wrap"><div class="ai rv a-pop" id="briefm">
<div><span class="kicker k-ai"><i></i>${t("ИИ-бриф-мастер · вживую", "AI brif-master · jonli")}</span><h2 style="margin-top:16px">${t("Две фразы — и бриф готов", "Ikki jumla — va brif tayyor")}</h2><p class="sub">${t("На вашем сайте бриф — это длинная Google-форма. Здесь бренд пишет как в мессенджере, а ИИ раскладывает задачу по полям: цель, аудитория, главная мысль, форматы, механика, что считаем и что уточнить.", "Saytingizda brif — uzun Google-forma. Bu yerda brend messenjerdagidek yozadi, AI esa vazifani maydonlarga ajratadi: maqsad, auditoriya, asosiy fikr, formatlar, mexanika, nimani hisoblaymiz va nimani aniqlashtiramiz.")}</p><p style="margin-top:16px"><span class="ours">${t("Наше предложение · 5 токенов", "Bizning taklif · 5 token")}</span></p></div>
<div class="field"><label for="bm-t">${t("Задача своими словами", "Vazifa o‘z so‘zlaringiz bilan")}</label><textarea id="bm-t" maxlength="700" placeholder="${t("Что запускаете и чего хотите", "Nimani boshlayapsiz va nima xohlaysiz")}"></textarea><div class="ex">${exB.map((e) => `<button type="button">${esc(e)}</button>`).join("")}</div>
<div class="ai-actions"><button class="btn btn-main" type="button" data-go>${ICON.spark}${t("Собрать бриф", "Brif yig‘ish")}</button><span class="thinking" aria-live="polite"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>${t("ИИ раскладывает задачу…", "AI vazifani ajratyapti…")}</span><span class="badge" hidden></span></div>
<div class="res brief" hidden aria-live="polite"></div></div>
</div></div></section>
<section><div class="wrap">
<div class="sec-head rv a-rise"><h2>${t("Услуги и цены", "Xizmatlar va narxlar")}</h2><p class="src">${t("Цены — из коммерческого предложения на bloger.agency.", "Narxlar — bloger.agency saytidagi tijorat taklifidan.")}</p></div>
<div class="svc">${svc.map(([h, p, li, price], i) => `<div class="svc-row rv ${["a-slide", "a-side"][i % 2]}"><h3>${h}</h3><div><p>${p}</p>${li.length ? `<ul>${li.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}</div>${price || `<div class="pricebox"><div><span>${t("Цена", "Narx")}</span><b>${t("по брифу", "brif bo‘yicha")}</b></div></div>`}</div>`).join("")}</div>
</div></section>
<section><div class="wrap">
<div class="sec-head rv a-rise"><h2>${t("Как идёт кампания — 8 этапов", "Kampaniya qanday o‘tadi — 8 bosqich")}</h2><p>${t("Оплата разбита на этапы: на каждом перед оплатой вы получаете акт выполненных работ и контролируете процесс.", "To‘lov bosqichlarga bo‘lingan: har birida to‘lovdan oldin bajarilgan ishlar dalolatnomasini olasiz va jarayonni nazorat qilasiz.")}</p></div>
<ol class="steps">${steps.map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join("")}</ol>
<div class="cta"><a class="btn btn-ghost" href="${href(l)}#tarify">${t("Посчитать кампанию в калькуляторе", "Kampaniyani kalkulyatorda hisoblash")}</a></div>
</div></section>
${finalBlock(l)}
${moreBlock(l, "brendam")}`;
  return shell(l, "brendam", {
    title: t("Реклама у блогеров для брендов: услуги и цены | Bloger Agency", "Brendlar uchun blogerlarda reklama: xizmatlar va narxlar | Bloger Agency"),
    desc: t("Инфлюенс-маркетинг полного цикла в Узбекистане: бартер от $400, тарифы от $700, видео от $650, амбассадорство, ивенты. ИИ-бриф-мастер.", "O‘zbekistonda to‘liq siklli influencer marketing: barter $400 dan, tariflar $700 dan, video $650 dan, ambassadorlik, tadbirlar. AI brif-master."),
  }, body);
}

/* ── Блогерам ────────────────────────────────────────────────────────── */
function bloggers(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const perks = l === "ru"
    ? ["Полный контроль и обработка рекламных предложений на ваш аккаунт", "Приоритетные рекомендации рекламодателям", "Техническое задание и поддержка во время съёмки", "Работа по безналичному расчёту с юрлицами", "Юридическое сопровождение: договоры и переговоры", "Готовые обработанные заказы — экономия времени", "Ответ рекламодателю в течение 2 часов", "Помощь с платежами и документами", "Ваши расценки не меняются — комиссия агентства сверху"]
    : ["Akkauntingizga keladigan reklama takliflarini to‘liq nazorat va qayta ishlash", "Reklama beruvchilarga ustuvor tavsiyalar", "Texnik topshiriq va suratga olish paytida yordam", "Yuridik shaxslar bilan naqd pulsiz hisob-kitob", "Yuridik kuzatuv: shartnomalar va muzokaralar", "Tayyor qayta ishlangan buyurtmalar — vaqtni tejash", "Reklama beruvchiga 2 soat ichida javob", "To‘lovlar va hujjatlar bo‘yicha yordam", "Narxlaringiz o‘zgarmaydi — agentlik komissiyasi ustiga qo‘shiladi"];
  const body = `${phead(l, "blogeram", t("Блогерам", "Blogerlarga"), `<span class="kicker"><i></i>${t("Резиденты агентства", "Agentlik rezidentlari")}</span>`, t("Блогерам: заказы без переписки и торга", "Blogerlarga: yozishma va savdolashuvsiz buyurtmalar"), t("Агентство берёт на себя рекламодателей, договоры и документы. Вы снимаете — по своим расценкам: комиссия агентства добавляется сверху.", "Agentlik reklama beruvchilar, shartnomalar va hujjatlarni o‘z zimmasiga oladi. Siz suratga olasiz — o‘z narxlaringiz bo‘yicha: agentlik komissiyasi ustiga qo‘shiladi."))}
<section style="padding-top:0"><div class="wrap">
<div class="grid g3">${perks.map((p, i) => `<div class="card rv a-rise" style="--d:${(i % 3) * 70}ms"><span class="n">${String(i + 1).padStart(2, "0")}</span><p style="color:var(--fg)">${p}</p></div>`).join("")}</div>
<div class="card blue rv a-pop" style="margin-top:16px"><h3>${t("Условие участия", "Ishtirok sharti")}</h3><p>${t("Указать в шапке профиля: «Сотрудничество Bloger Agency».", "Profil shapkasida ko‘rsatish: «Hamkorlik Bloger Agency».")}</p></div>
</div></section>
<section data-addon="rate"><div class="wrap"><div class="calc dark rv a-pop" id="rate">
<div style="display:grid;gap:16px;align-content:start">
<span class="ours">${t("Наше предложение: оценка блога", "Bizning taklif: blog bahosi")}</span>
<h2>${t("Сколько стоит ваша реклама?", "Reklamangiz qancha turadi?")}</h2>
<p style="color:var(--fg2)">${t("Введите охват и средние лайки — посчитаем ER и покажем, сколько берут блогеры с похожей аудиторией в каталоге агентства.", "Qamrov va o‘rtacha layklarni kiriting — ER’ni hisoblaymiz va agentlik katalogida o‘xshash auditoriyali blogerlar qancha olishini ko‘rsatamiz.")}</p>
<div class="field"><label for="r-f">${t("Подписчики", "Obunachilar")}</label><input type="number" id="r-f" inputmode="numeric" min="0" value="45000"></div>
<div class="field"><label for="r-l">${t("Средние лайки на пост", "Post uchun o‘rtacha layklar")}</label><input type="number" id="r-l" inputmode="numeric" min="0" value="1200"></div>
<div class="field"><label for="r-c">${t("Средние комментарии", "O‘rtacha izohlar")}</label><input type="number" id="r-c" inputmode="numeric" min="0" value="60"></div>
</div>
<div id="r-out" style="display:grid;gap:12px;align-content:start" aria-live="polite">
<div class="out-grid">
<div class="out wide"><small>ER</small><b id="r-er">—</b><small id="r-rank"></small></div>
<div class="out"><small>${t("Похожих блогеров в каталоге", "Katalogda o‘xshash blogerlar")}</small><b id="r-n">—</b></div>
<div class="out"><small>${t("Медиана: сторис", "Mediana: storis")}</small><b id="r-s">—</b></div>
<div class="out wide"><small>${t("Медиана: пост", "Mediana: post")}</small><b id="r-p">—</b></div>
</div>
<p class="src">${t("ER = (лайки + комментарии) / подписчики. Похожие — от половины до двойного вашего охвата; цены — из каталога bloger.agency.", "ER = (layklar + izohlar) / obunachilar. O‘xshashlar — qamrovingizning yarmidan ikki baravarigacha; narxlar — bloger.agency katalogidan.")}</p>
<a class="btn btn-main" id="r-go" href="${tg(t("Здравствуйте! Хочу стать резидентом Bloger Agency.", "Assalomu alaykum! Bloger Agency rezidenti bo‘lmoqchiman."))}">${ICON.tg}${t("Стать резидентом", "Rezident bo‘lish")}</a>
</div>
</div></div></section>
${blogyBlock(l)}
${moreBlock(l, "blogeram")}`;
  return shell(l, "blogeram", {
    title: t("Блогерам: заказы от брендов без торга | Bloger Agency", "Blogerlarga: savdolashuvsiz brendlardan buyurtmalar | Bloger Agency"),
    desc: t("Станьте резидентом Bloger Agency: заказы от рекламодателей, договоры, безналичный расчёт, ответ рекламодателю за 2 часа. Калькулятор ER и цены рекламы.", "Bloger Agency rezidenti bo‘ling: reklama beruvchilardan buyurtmalar, shartnomalar, naqd pulsiz hisob, reklama beruvchiga 2 soatda javob. ER kalkulyatori va reklama narxlari."),
  }, body);
}

/* ── Кейсы ───────────────────────────────────────────────────────────── */
function cases(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const brandsList = ["Honor", "Dilmah", "ALUTEX", "TUT", "ECCO", "Yunusabad Gallery", "Vivo", "Uzum", "Uzbekistan Airways", "Skillbox", "Schwarzkopf", "Payme", "Libertex", "Evos", "OPPO", "Click", "BYD", "Avo", "TengeBank", "Globbing"];
  const body = `${phead(l, "keysy", t("Кейсы", "Keyslar"), `<span class="kicker"><i></i>${t("Наши работы", "Bizning ishlarimiz")}</span>`, t("Кейсы и бренды", "Keyslar va brendlar"), t("Бренды, с которыми работало агентство, — по разделу «Работы» на bloger.agency.", "Agentlik ishlagan brendlar — bloger.agency saytidagi «Ishlar» bo‘limi bo‘yicha."))}
<section style="padding-top:0"><div class="wrap">
<div class="brands">${brandsList.map((b, i) => `<span class="rv a-pop" style="--d:${(i % 6) * 50}ms">${b}</span>`).join("")}</div>
</div></section>
<section><div class="wrap">
<div class="sec-head rv a-rise"><span class="ours">${t("Наше предложение: один формат кейса", "Bizning taklif: keysning yagona formati")}</span><h2>${t("Кейс, который продаёт", "Sotadigan keys")}</h2><p>${t("Бренд хочет увидеть свою задачу и цифры. Предлагаем у каждого кейса одну строку: задача → блогеры → охват → переходы. Цифры заполняете вы — мы их не придумываем.", "Brend o‘z vazifasi va raqamlarini ko‘rishni xohlaydi. Har bir keysda bitta qator taklif qilamiz: vazifa → blogerlar → qamrov → o‘tishlar. Raqamlarni siz to‘ldirasiz — biz ularni o‘ylab topmaymiz.")}</p></div>
<div class="grid g2">${["BYD", "Schwarzkopf"].map((b) => `<div class="case rv a-tilt"><h3>${b}</h3><p class="src">${t("Задача — из вашего описания кейса", "Vazifa — keys tavsifingizdan")}</p><div class="case-line"><div><small>${t("Блогеров", "Blogerlar")}</small><b>—</b></div><div><small>${t("Охват", "Qamrov")}</small><b>—</b></div><div><small>${t("Переходы", "O‘tishlar")}</small><b>—</b></div><div><small>${t("Промокоды", "Promokodlar")}</small><b>—</b></div></div></div>`).join("")}</div>
</div></section>
<section><div class="wrap">
<div class="sec-head rv a-rise"><h2>${t("Измерение успеха: метод Bloger Agency", "Muvaffaqiyatni o‘lchash: Bloger Agency usuli")}</h2><p>${t("Каждый автор и каждая платформа дают разные данные. Мы сводим их вместе, убираем несоответствия и шум и смотрим на реальный эффект кампании и показатели бизнеса — а не на лайки и комментарии.", "Har bir muallif va har bir platforma turli ma’lumot beradi. Biz ularni birlashtiramiz, nomuvofiqlik va shovqinni olib tashlaymiz va layk va izohlarga emas, kampaniyaning haqiqiy ta’siri va biznes ko‘rsatkichlariga qaraymiz.")}</p></div>
<div class="grid g3">${(l === "ru" ? ["Точные данные по каждой кампании", "Сравнение данных разных авторов и площадок", "Фокус на показателях бизнеса, а не на лайках"] : ["Har bir kampaniya bo‘yicha aniq ma’lumot", "Turli mualliflar va platformalar ma’lumotlarini solishtirish", "Layklarga emas, biznes ko‘rsatkichlariga e’tibor"]).map((x, i) => `<div class="card rv a-rise" style="--d:${i * 80}ms"><span class="ico">${[ICON.target, ICON.spark, ICON.bolt][i]}</span><p style="color:var(--fg)">${x}</p></div>`).join("")}</div>
</div></section>
${eventsBlock(l)}
${quotesBlock(l)}
${finalBlock(l)}
${moreBlock(l, "keysy")}`;
  return shell(l, "keysy", {
    title: t("Кейсы Bloger Agency: Uzum, BYD, Schwarzkopf, Skillbox и другие", "Bloger Agency keyslari: Uzum, BYD, Schwarzkopf, Skillbox va boshqalar"),
    desc: t("Бренды, с которыми работает Bloger Agency, метод измерения кампаний и мероприятия PRO BLOGGERS и TAF.", "Bloger Agency ishlaydigan brendlar, kampaniyalarni o‘lchash usuli va PRO BLOGGERS va TAF tadbirlari."),
  }, body);
}


/* ── Что дальше: конструктор проекта для агентства (как у MAVERA) ───── */

function previews(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const cat = JSON.parse(CAT);
  const pick = (h) => cat.find((r) => r[0] === h);
  const row = (a, b, c = "") => `<div class="pv-row"><span>${a}</span>${c ? `<i>${c}</i>` : ""}<b>${b}</b></div>`;
  const ex = `<span class="pv-ex">${t("пример", "namuna")}</span>`;
  const stages = l === "ru" ? ["Бриф", "Подборка", "Предоплата", "ТЗ", "Выход", "Проверка", "Статистика", "Новая волна"] : ["Brif", "Tanlov", "Oldindan to‘lov", "TZ", "Chiqish", "Tekshiruv", "Statistika", "Yangi to‘lqin"];
  const frame = (title, body) => `<div class="pv-win"><div class="pv-bar"><i></i><i></i><i></i><span>${title}</span></div><div class="pv-body">${body}</div></div>`;
  return {
    admin: frame(t("Админка · Блогеры", "Admin · Blogerlar"), ["shahlo_usmanovna", "madina_tws", "nodirax_", "gurmandiyauz"].map((h) => { const r = pick(h); return row("@" + r[0], `Story ${usd(r[5])} · Post ${usd(r[6])}`, `<em class="pv-edit">${t("изменить", "tahrirlash")}</em>`); }).join("") + `<p class="pv-note">${t("Цены — из вашего каталога. Правка здесь сразу меняет каталог, калькулятор и ИИ-подбор.", "Narxlar — katalogingizdan. Bu yerdagi tahrir katalog, kalkulyator va AI-tanlovni darhol o‘zgartiradi.")}</p>`),
    crm: frame(t("Кампании", "Kampaniyalar") + " " + ex, `<div class="pv-kan">${stages.slice(0, 4).map((s, i) => `<div><small>${s}</small>${i === 0 ? `<p>${t("Кофейня, Юнусабад", "Qahvaxona, Yunusobod")} · Silver</p>` : i === 1 ? `<p>${t("Магазин на Uzum", "Uzum’dagi do‘kon")} · Gold</p><p>${t("Автосервис", "Avtoservis")} · ${t("бартер", "barter")}</p>` : i === 2 ? `<p>${t("Фитнес-клуб", "Fitnes-klub")} · Platinum <em>${t("акт", "dalolatnoma")}</em></p>` : ""}</div>`).join("")}</div><div class="pv-steps">${stages.map((s, i) => `<span${i < 3 ? ' class="on"' : ""}>${s}</span>`).join("")}</div>`),
    leads: `<div class="pv-tg"><b>Bloger Agency · ${t("заявки", "arizalar")}</b><p>${t("Новая подборка с сайта", "Saytdan yangi tanlov")}<br>@obzor_edy, @sevas_cooking, @gulyamiddinova<br>${t("Бюджет", "Byudjet")}: $800 · Story<br>${t("Пришёл", "Kelgan")}: Instagram</p><span>12:04</span></div>`,
    report: frame(t("Отчёт кампании", "Kampaniya hisoboti") + " " + ex, `<div class="pv-kpi"><div><small>${t("Блогеров", "Blogerlar")}</small><b>5</b></div><div><small>${t("Охват", "Qamrov")}</small><b>—</b></div><div><small>${t("Переходы", "O‘tishlar")}</small><b>—</b></div></div><div class="pv-bars">${[0.7, 0.45, 0.9, 0.3, 0.6].map((h) => `<i style="--h:${h}"></i>`).join("")}</div><p class="pv-note">${t("Цифры подставляются из кампании — мы их не придумываем.", "Raqamlar kampaniyadan olinadi — biz ularni o‘ylab topmaymiz.")}</p>`),
    brand: frame(t("Кабинет бренда", "Brend kabineti") + " " + ex, `<div class="pv-steps">${stages.slice(0, 7).map((s, i) => `<span${i < 5 ? ' class="on"' : ""}>${s}</span>`).join("")}</div>${row(t("Ролик @kamillove_12", "Rolik @kamillove_12"), `<em class="pv-ok">${t("Согласовать", "Tasdiqlash")}</em>`)}${row(t("Акт за этап «Выход»", "«Chiqish» bosqichi dalolatnomasi"), "PDF")}${row(t("Отчёт", "Hisobot"), t("по ссылке", "havola orqali"))}`),
    blogger: frame(t("Кабинет блогера", "Bloger kabineti") + " " + ex, `${row(t("Новый заказ · сторис", "Yangi buyurtma · storis"), "$130", `<em class="pv-timer">1:47</em>`)}${row(t("ТЗ и сроки", "TZ va muddatlar"), t("открыть", "ochish"))}${row(t("Загрузить ролик", "Rolikni yuklash"), "↑")}${row(t("Выплата за сентябрь", "Sentabr to‘lovi"), t("в работе", "jarayonda"))}<p class="pv-note">${t("Таймер — ваше обещание: ответ рекламодателю за 2 часа.", "Taymer — va’dangiz: reklama beruvchiga 2 soatda javob.")}</p>`),
    blogy: `<div class="pv-tg"><b>BLOGY</b><p>${t("Новый заказ от бренда: сторис, $130. ТЗ — в кабинете на сайте.", "Brenddan yangi buyurtma: storis, $130. TZ — saytdagi kabinetda.")}</p><span>${t("Принять", "Qabul qilish")} · ${t("Отказаться", "Rad etish")}</span></div>`,
    ai: frame(t("ИИ-подбор", "AI-tanlov"), `<p class="pv-q">${t("«Открываем кофейню в Юнусабаде, бюджет 800$, нужны сторис»", "«Yunusobodda qahvaxona ochyapmiz, byudjet 800$, storis kerak»")}</p>${row("Food", t("ниша", "nisha"))}${row("$800", t("бюджет", "byudjet"))}${row(t("запуск", "ishga tushirish"), t("цель", "maqsad"))}`),
    ugc: frame(t("UGC-студия", "UGC-studiya"), `<div class="pv-coin"><i>B</i><b>300</b><span>${t("токенов", "token")}</span></div>${row(t("Сценарий ролика", "Rolik ssenariysi"), t("10 токенов", "10 token"))}${row(t("Пополнить", "To‘ldirish"), "Click · Payme")}${row(t("Снять у блогеров", "Blogerlarda suratga olish"), "10 → $650")}`),
    access: frame(t("Доступ к базе", "Bazaga kirish"), `${row(t("10 блогеров", "10 bloger"), "60 000 so‘m")}${row(t("20 блогеров", "20 bloger"), "110 000 so‘m")}${row(t("50 блогеров", "50 bloger"), "250 000 so‘m")}<p class="pv-note">${t("Пакеты — как на вашей странице AI. Оплата Click — контакты открываются сразу.", "Paketlar — AI sahifangizdagidek. Click orqali to‘lov — kontaktlar darhol ochiladi.")}</p>`),
    events: frame("PRO BLOGGERS", `${row(t("Участник", "Ishtirokchi"), t("регистрация", "ro‘yxatdan o‘tish"))}${row(t("Партнёр", "Hamkor"), t("пакеты для брендов", "brendlar uchun paketlar"))}${row(t("Напоминание в Telegram", "Telegramda eslatma"), t("за день", "bir kun oldin"))}`),
    en: `<div class="pv-lang"><span>RU</span><span>UZ</span><span class="on">EN</span></div><p class="pv-q">Influencer marketing in Uzbekistan — simpler and more affordable</p>`,
    seo: `<div class="pv-serp"><small>bloger.agency</small><b>${t("Реклама у блогеров в Ташкенте — Bloger Agency", "Toshkentda blogerlarda reklama — Bloger Agency")}</b><p>${t("Подбор блогеров, ТЗ, запуск и статистика. Тарифы от $700, оплата по этапам.", "Blogerlarni tanlash, TZ, ishga tushirish va statistika. Tariflar $700 dan, bosqichma-bosqich to‘lov.")}</p></div>`,
  };
}

function plan(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const pv = previews(l);
  const defaults = new Set();
  const groups = Object.keys(GROUPS);
  const body = `${phead(l, "plan", t("Что дальше", "Keyingi qadam"), `<span class="ours">${t("Предложение DevUz Studio для Bloger Agency", "DevUz Studio’ning Bloger Agency uchun taklifi")}</span>`, t("Что ещё нужно агентству — соберите сами", "Agentlikka yana nima kerak — o‘zingiz yig‘ing"), t("Как у застройщика MAVERA: сайт из этого прототипа — основа, остальное включается тумблером. Включили блок — он сразу появляется в превью справа, а итог пересчитывается. Почему каждый блок здесь — написано вашими же словами с bloger.agency.", "MAVERA quruvchisidagidek: shu prototipdagi sayt — asos, qolgani tumbler bilan yoqiladi. Blokni yoqdingiz — u darhol o‘ngdagi ko‘rinishda paydo bo‘ladi, jami esa qayta hisoblanadi. Har bir blok nima uchun shu yerda — bloger.agency’dagi o‘z so‘zlaringiz bilan yozilgan."))}
<section style="padding-top:0"><div class="wrap">
<div class="sec-head rv a-rise"><h2>${t("Кому и что сейчас мешает", "Kimga va hozir nima xalaqit beradi")}</h2></div>
<div class="grid g3">
<div class="card rv a-tilt"><span class="n">${t("КОМАНДА", "JAMOA")}</span><h3>${t("Всё руками", "Hammasi qo‘lda")}</h3><p>${t("Бриф — Google-форма, КП — PDF, 65 карточек блогеров — в коде страницы, 8 этапов кампании и акты — в переписке.", "Brif — Google-forma, TT — PDF, 65 ta bloger kartochkasi — sahifa kodida, kampaniyaning 8 bosqichi va dalolatnomalar — yozishmada.")}</p></div>
<div class="card hot rv a-tilt" style="--d:90ms"><span class="n">${t("БРЕНДЫ", "BRENDLAR")}</span><h3>${t("Не видно цены и статуса", "Narx va holat ko‘rinmaydi")}</h3><p>${t("Цены спрятаны в КП, AI — «Скоро!», а после оплаты бренд узнаёт, что с кампанией, только спросив менеджера.", "Narxlar TTda yashirin, AI — «Tez kunda!», to‘lovdan keyin esa brend kampaniya holatini faqat menejerdan so‘rab biladi.")}</p></div>
<div class="card rv a-tilt" style="--d:180ms"><span class="n">${t("БЛОГЕРЫ", "BLOGERLAR")}</span><h3>${t("Обещания без инструмента", "Vositasiz va’dalar")}</h3><p>${t("Ответ рекламодателю за 2 часа, ТЗ, договоры, выплаты — обещаны резидентам, но держатся на менеджере. BLOGY живёт отдельно от сайта.", "Reklama beruvchiga 2 soatda javob, TZ, shartnomalar, to‘lovlar — rezidentlarga va’da qilingan, lekin menejerga tayanadi. BLOGY saytdan alohida yashaydi.")}</p></div>
</div>
</div></section>
<section id="konstruktor" style="padding-top:0"><div class="wrap">
<div class="sec-head rv a-rise"><h2>${t("Конструктор проекта", "Loyiha konstruktori")}</h2><p class="src">${t("Цены — средние по Ташкенту за такую работу. Точные — после брифа.", "Narxlar — Toshkentda bunday ish uchun o‘rtacha. Aniq narx — brifdan keyin.")}</p></div>
<div class="kit" id="plan">
<div class="kit-list">
<div class="kit-mini" aria-hidden="true"><span>${t("Итого с сайтом", "Sayt bilan jami")}</span><b class="num" id="kit-sum2">—</b></div>
<div class="kit-base"><div><b>${KIT_BASE[l].t}</b><p>${KIT_BASE[l].d}</p></div><span class="kit-price num">${usd(KIT_BASE.price)}</span><span class="kit-in">${t("входит", "kiradi")}</span></div>
<div class="kit-base kit-site"><div><b>${t("Блоки на страницах сайта", "Sayt sahifalaridagi bloklar")}</b><p>${t("Влёт в букву, сторис, ИИ-подбор, калькулятор, UGC-студия и другие — включаются и выключаются прямо на странице, в конструкторе.", "Harf ichiga kirish, storis, AI-tanlov, kalkulyator, UGC-studiya va boshqalar — to‘g‘ridan-to‘g‘ri sahifada, konstruktorda yoqiladi va o‘chiriladi.")}</p></div><span class="kit-price num" id="kit-site-sum"></span><button class="kit-in kit-open" type="button" data-kit-open>${t("открыть конструктор", "konstruktorni ochish")}</button></div>
${groups.map((g) => `<h3 class="kit-g">${GROUPS[g][l]}</h3>${BLOCKS.filter((b) => b.group === g).map((b) => `<label class="kit-row"><input type="checkbox" data-k="${b.id}" data-p="${b.price}" data-needs="${b.needs.join(" ")}"><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${b[l].t}</b><small>${b[l].why}</small><span class="kit-li">${b[l].li.map((x) => `<em>${x}</em>`).join("")}</span>${b.needs.length ? `<span class="kit-need">${t("Включает", "Birga yoqiladi")}: ${b.needs.map((n) => [...BLOCKS, ...ADDONS].find((x) => x.id === n)[l].t).join(", ")}</span>` : ""}</span><span class="kit-price num">${usd(b.price)}</span></label>`).join("")}`).join("")}
</div>
<div class="kit-side">
<div class="kit-screen" aria-live="polite"><p class="kit-cap">${t("Превью включённых блоков", "Yoqilgan bloklar ko‘rinishi")}</p>${BLOCKS.map((b) => `<div class="kit-pv" data-pv="${b.id}"${defaults.has(b.id) ? "" : " hidden"}><span class="kit-pv-t">${b[l].t}</span>${pv[b.pv]}</div>`).join("")}<p class="kit-empty src">${t("Включите блок слева — он появится здесь.", "Chapdagi blokni yoqing — u shu yerda paydo bo‘ladi.")}</p></div>
<div class="kit-total">
<div><small>${t("Итого с сайтом", "Sayt bilan jami")}</small><b class="num" id="kit-sum">—</b><span id="kit-n"></span></div>
<div class="kit-actions"><button class="btn btn-ghost btn-sm" type="button" data-kit-open>${t("Открыть конструктор", "Konstruktorni ochish")}</button><a class="btn btn-main" href="https://t.me/Devuz_studio_bot?start=bloger_agency">${ICON.tg}${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</a></div>
</div>
</div>
</div>
</div></section>
<section><div class="wrap"><div class="note rv a-pop">
<span class="note-tag">${t("Как собираем", "Qanday yig‘amiz")}</span>
<h2>${t("Блоки включаются, а не переписываются", "Bloklar qayta yozilmaydi, yoqiladi")}</h2>
<p class="sub">${t("Сайт с самого начала собирается так, чтобы админка, кабинеты и оплата подключались к нему, а не требовали переделки. Взять можно сразу или через полгода — цена блока от этого не меняется. Код после оплаты — ваш.", "Sayt boshidanoq admin panel, kabinetlar va to‘lov unga ulanadigan qilib yig‘iladi, qayta ishlashni talab qilmaydi. Darhol yoki yarim yildan keyin olish mumkin — blok narxi bundan o‘zgarmaydi. To‘lovdan keyin kod — sizniki.")}</p>
</div></div></section>`;
  return shell(l, "plan", {
    title: t("Что дальше: админка, кабинеты брендов и блогеров — конструктор проекта | Bloger Agency", "Keyingi qadam: admin panel, brend va bloger kabinetlari — loyiha konstruktori | Bloger Agency"),
    desc: t("Конструктор проекта для Bloger Agency: админка агентства, кампании по этапам, кабинеты бренда и блогера, ИИ, UGC-студия с оплатой. Предложение DevUz Studio.", "Bloger Agency uchun loyiha konstruktori: agentlik admin paneli, bosqichli kampaniyalar, brend va bloger kabinetlari, AI, to‘lovli UGC-studiya. DevUz Studio taklifi."),
  }, body);
}

const BUILD = { "": home, blogery: catalog, ugc, brendam: brands, blogeram: bloggers, keysy: cases, plan };
const out = {};
for (const l of ["ru", "uz"]) for (const p of PAGES) out[(l === "uz" ? "uz" + (p ? "/" : "") : "") + p] = BUILD[p](l);
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/*
 * Сборка для сервера (lib/proto/bundles): общие куски — стили, скрипт,
 * строки на языке, влёт в букву — один раз, в страницах вместо них метка
 * @@имя@@. Так файл в репозитории в три раза меньше 12 готовых страниц.
 */
const first = out[""];
const grab = (html, re) => html.match(re)[0];
const parts = {
  S: grab(first, /<style>[\s\S]*?<\/style>/),
  J: first.slice(first.indexOf('<script type="application/json" id="cat">'), first.indexOf("</body>")),
  IR: grab(first, /<script type="application\/json" id="i18n">[\s\S]*?<\/script>/),
  IU: grab(out.uz, /<script type="application\/json" id="i18n">[\s\S]*?<\/script>/),
  G: grab(first, /<script>\n\/\* Glyph Portal[\s\S]*?<\/script>/),
};
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let page = html;
  for (const [name, part] of Object.entries(parts)) page = page.split(part).join(`@@${name}@@`);
  pages[key] = page;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "bloger-agency.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(main)").padEnd(14), v.length);
