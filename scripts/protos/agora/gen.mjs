import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { LANGS, BRAND, CATS, MENU, SHOW, HALL, COUNT, HOOKAH } from "./data.mjs";
import { BASE, ADDONS, OFFER_HOURS, ALL, SUPPORT, AI, BOT } from "./plan.mjs";
import { PANEL_UI } from "./ui.mjs";

/*
 * Макет Agora Lounge & bar (Ташкент, Амира Темура 15), 01.11.2026. Страницы ru и uz:
 *
 *   ""    — видео DevUz → залёт камерой в их знак (вектор, камера через
 *           viewBox) → из красной чаши раскрывается их зал → «Что посмотреть»
 *           (сайт, панель, бот) → как проверить → «Предложение DevUz Studio»
 *           (plan.mjs) → IT-поддержка, домен и сервер отдельно;
 *   site  — первый экран с их залом, бегущая строка, «Вечер в Agora» (три блюда
 *           и два напитка на столах их зала), меню целиком из rezvo, бронь,
 *           бот в окне Telegram, зал, допы (QR, iiko, отзывы, английский,
 *           панель), контакты;
 *   panel — вход (Telegram или код, демо 1234), панель «стекло» V7 + CRM:
 *           брони, заказы, бот, стоп-лист, история, роли, выгрузки.
 *
 * Меню, цены, адрес, телефон — только из их меню rezvo (data.mjs). Брони,
 * заказы и обращения в панели — демо. Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/agora";
// Комментарии уходят, метка числа `/*~*/` остаётся: её снимает отпечаток при показе.
const strip = (s) => s.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");
const CSS = strip(readFileSync(DIR + "site.css", "utf8")).replace(/\n\s*/g, "");
const JS = strip(readFileSync(DIR + "site.js", "utf8")).replace(/\n\s*\n/g, "\n");
const LAND_JS = strip(readFileSync(DIR + "land.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_JS = strip(readFileSync(DIR + "panel.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_CSS = strip(readFileSync(DIR + "panel.css", "utf8")).replace(/\n\s*/g, "");
const BASE_URL = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Forum&family=Manrope:wght@400;700&display=swap";
const KEY = { ru: "", uz: "uz" };
const DEVUZ = "https://t.me/Devuz_studio_bot?start=agora";
const IG = `https://www.instagram.com/${BRAND.ig}/`;
const ROUTE = `https://yandex.uz/maps/?pt=${BRAND.lng},${BRAND.lat}&z=17&l=map`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, p = "") => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/" + (p ? p : "");
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const sum = (n, l) => `${fmt(n)}\u00a0${l === "ru" ? "сум" : "so‘m"}`;
const usd = (n) => `${fmt(n)}\u00a0$`;
const words = (txt) => txt.split(" ").map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");

/* Знак: обводка их обложки rezvo (logo.svg) — один раз на страницу, дальше <use>. */
const LOGO_SVG = readFileSync(DIR + "logo.svg", "utf8");
const LOGO_VB = LOGO_SVG.match(/viewBox="0 0 (\d+) (\d+)"/).slice(1).map(Number);
const LOGO_G = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><g id="ag-g">${LOGO_SVG.replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g></defs></svg>`;
const MARK = (cls = "") => `<svg class="${cls}" viewBox="0 0 ${LOGO_VB[0]} ${LOGO_VB[1]}" aria-hidden="true" focusable="false"><use href="#ag-g"/></svg>`;
const LOGO = (l, to = "site") => `<a class="logo" href="${href(l, to)}" aria-label="AGORA Lounge &amp; bar">${MARK()}</a>`;

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
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  ig: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>'),
  cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  menu: I('<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4Z"/><path d="M8 9h8M8 13h8M8 17h5"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  bag: I('<path d="M5 8h14l-1 12H6Z"/><path d="M9 8a3 3 0 0 1 6 0"/>'),
  bot: I('<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9 17h6"/>'),
  qr: I('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h3v3"/>'),
  sms: I('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>'),
};

/* ── Общее ─────────────────────────────────────────────────────── */
function head(l, title, desc) {
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0c0908">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}
const langs = (l, to) => `<div class="langs">${LANGS.map((x) => `<a href="${href(x, to)}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>`;
const terms = (l, t) => `${t("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}`;
const byRu = (n) => MENU.find((m) => m.ru === n);
const nm = (m, l) => (l === "ru" ? m.ru : m.uz);

/* ── Сайт ──────────────────────────────────────────────────────── */
function header(l, t) {
  const nav = [["evening", t("Вечер", "Kech")], ["menu", t("Меню", "Menyu")], ["book", t("Бронь", "Bron")], ["bot", t("Бот", "Bot")], ["hall", t("Зал", "Zal")], ["contact", t("Контакты", "Aloqa")]];
  return `<header class="top"><div class="mbar"><a href="${href(l)}">${ICON.back}<span>${t("Макет для Agora", "Agora uchun maket")}</span></a><a class="mb-adm" href="${href(l, "panel")}">${ICON.panel}<span>${t("Админка", "Admin panel")}</span>${ICON.arrow}</a></div><div class="top-in glass">
${LOGO(l)}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([id, n]) => `<a href="#${id}">${n}</a>`).join("")}</nav>
<button type="button" class="mine" id="mine" hidden><i class="dot"></i>${ICON.cal}<span>${t("Моя бронь", "Mening bronim")}</span></button>
${langs(l, "site")}
<a class="btn btn-a btn-s tel" href="#book" data-addon="booking">${ICON.cal}<span>${t("Забронировать", "Bron qilish")}</span></a>
<a class="btn btn-a btn-s tel" href="tel:${BRAND.tel}" data-off="booking">${ICON.phone}<span>${BRAND.phone}</span></a>
</div></header>`;
}

function hero(l, t) {
  const B = BRAND[l];
  return `<section class="hero" id="top" aria-label="AGORA">
<div class="hero-bg"><picture><source media="(max-width: 899px)" srcset="${IMG}/h-6-s.webp"><img src="${IMG}/h-6.webp" width="1680" height="958" alt="${t("Зал Agora вечером: диваны, тёплый свет и вывеска AGORA над баром", "Kechqurun Agora zali: divanlar, iliq yorug‘lik va bar ustida AGORA yozuvi")}" fetchpriority="high"></picture></div>
<div class="wrap hero-in">
<div><p class="kick">${t("Lounge &amp; bar · Ташкент", "Lounge &amp; bar · Toshkent")}</p>
<h1>${words("AGORA")}</h1>
<p class="promo glass" id="promo" hidden></p>
<p class="hsub">${esc(B.kitchen)}. ${t("Место для живого общения и отдыха, как вы пишете о себе сами.", "O‘zingiz yozganingizdek, jonli muloqot va dam olish uchun joy.")}</p>
<div class="hero-act"><a class="btn btn-a" href="#book" data-addon="booking">${ICON.cal}<span>${t("Забронировать стол", "Stol bron qilish")}</span></a><a class="btn btn-a" href="tel:${BRAND.tel}" data-off="booking">${ICON.phone}<span>${t("Позвонить", "Qo‘ng‘iroq qilish")}</span></a><a class="btn btn-g" href="#menu">${ICON.menu}<span>${t("Меню", "Menyu")}</span></a></div></div>
<div class="hcard glass"><b>${esc(B.street)}</b>
<span class="row">${ICON.clock}<span data-hours>${esc(B.hours)}</span></span>
<span class="row">${ICON.menu}<span>${t(`${COUNT.all} позиций кухни и бара с ценами`, `Oshxona va barning ${COUNT.all} ta pozitsiyasi narxlar bilan`)}</span></span>
<span class="row">${ICON.phone}<a href="tel:${BRAND.tel}">${BRAND.phone}</a></span></div>
</div></section>`;
}

function velo(l) {
  const pick = (g) => MENU.filter((m) => m.g === g && m.ph && !m.alias).slice(0, 12).map((m) => nm(m, l));
  const row = (x, c) => `<div class="row${c}" aria-hidden="true">${[0, 1, 2].map(() => x.map((s) => `<span>${esc(s)}</span>`).join("")).join("")}</div>`;
  return `<div class="velo">${row(pick("k"), "")}${row(MENU.filter((m) => m.cat === CATS.find((c) => c.src === "МАНГАЛ").id).map((m) => nm(m, l)).slice(0, 10), " rev")}</div>`;
}

function evening(l, t) {
  const sc = SHOW.map((s, i) => {
    const m = s.item, tall = s.mood === "ice", hot = s.mood === "steam1";
    const desc = l === "ru" ? m.dru : m.duz;
    const pair = s.pairItem ? `<span>${t("450 мл", "450 ml")}: ${sum(s.pairItem.price, l)}</span>` : m.w ? `<span>${m.w} ${t("г", "g")}</span>` : "";
    return `<section class="sc${i % 2 ? " r" : ""}" aria-label="${esc(s[l][0])}"><div class="sc-st">
<div class="sc-bg"><img src="${IMG}/h-${s.hall}-b.webp" alt="" width="640" height="365" loading="lazy"></div>
<div class="sc-table" aria-hidden="true"></div>
<span class="sc-num" aria-hidden="true">0${i + 1} / 0${SHOW.length}</span>
<div class="wrap sc-in">
<div class="sc-dish${tall ? " tall" : ""}"><img src="${IMG}/d-${m.ph}.webp" width="1280" height="${tall ? 1600 : 1280}" alt="${esc(nm(m, l))}" loading="lazy">${hot || tall ? `<canvas data-k="${tall ? "ice" : "steam"}" aria-hidden="true"></canvas>` : ""}</div>
<div class="sc-card glass"><p class="kick"><i></i>${esc(s[l][1])}</p><h3>${esc(nm(m, l))}</h3>${desc ? `<p>${esc(desc)}</p>` : ""}
<div class="sc-meta"><b>${sum(m.price, l)}</b>${pair}</div>
<div class="sc-act"><button type="button" class="btn btn-a" data-dish="${m.id}" data-addon="order">${ICON.bag}<span>${t("В заказ", "Buyurtmaga")}</span></button><a class="btn btn-g" href="#book" data-addon="booking">${t("Забронировать стол", "Stol bron qilish")}</a></div>
${m.stock ? `<small class="sc-src">${t("Фото того же напитка: Unsplash. Ваше фото встанет сюда.", "Xuddi shu ichimlik surati: Unsplash. Sizning suratingiz shu yerga qo‘yiladi.")}</small>` : ""}</div>
</div></div></section>`;
  }).join("");
  return `<section id="evening" aria-label="${t("Вечер в Agora", "Agora’da kechqurun")}"><div class="wrap ev-in">
<p class="kick rise"><i></i>${t("Вечер в Agora", "Agora’da kechqurun")}</p>
<h2 class="h2 rise">${t("Не всё меню, а пять вещей, <b>ради которых приходят</b>", "Butun menyu emas, <b>kelishga arziydigan</b> beshta narsa")}</h2>
<p class="lead rise">${t("Ваши блюда на столах вашего зала: листайте, и тарелка встаёт на стол. Цены из вашего меню.", "Taomlaringiz zalingiz stollarida: aylantiring va likopcha stolga qo‘yiladi. Narxlar menyuingizdan.")}</p>
</div>${sc}</section>`;
}

function menuSec(l, t) {
  const cats = CATS.map((c) => ({ ...c, n: c[l], cnt: MENU.filter((m) => m.cat === c.id).length }));
  return `<section class="sec" id="menu"><div class="wrap">
<p class="kick rise"><i></i>${t("Меню", "Menyu")}</p>
<h2 class="h2 rise">${t(`Всё меню: <b>${COUNT.all} позиций</b>`, `Butun menyu: <b>${COUNT.all} ta pozitsiya</b>`)}</h2>
<p class="lead rise">${t("Из вашего меню в rezvo, с ценами и граммовкой. Нажмите на блюдо: фото, состав и «В заказ».", "rezvo’dagi menyuingizdan, narx va gramm bilan. Taomni bosing: rasm, tarkib va «Buyurtmaga».")}</p>
<div class="mn-top"><div class="tabs" id="mn-tabs" role="tablist"><i aria-hidden="true"></i><button type="button" role="tab" data-g="k" aria-selected="true">${t("Кухня", "Oshxona")} <small>${COUNT.kitchen}</small></button><button type="button" role="tab" data-g="b" aria-selected="false">${t("Бар", "Bar")} <small>${COUNT.bar}</small></button></div>
<label class="srch">${ICON.search}<span class="vh">${t("Поиск по меню", "Menyu bo‘yicha qidiruv")}</span><input id="mn-q" type="search" placeholder="${t("Найти: буррата, люля, лимонад…", "Qidirish: burrata, lyulya, limonad…")}" autocomplete="off"></label></div>
<div class="chips" id="mn-chips"><button type="button" class="chip" data-cat="all" aria-pressed="true">${t("Все разделы", "Barcha bo‘limlar")}</button>${cats.map((c) => `<button type="button" class="chip" data-cat="${c.id}" data-g="${c.g}" aria-pressed="false">${esc(c.n)}<small>${c.cnt}</small></button>`).join("")}</div>
<div class="flt"><button type="button" class="chip" data-f="ph" aria-pressed="false">${t("С фото", "Rasmli")}</button><button type="button" class="chip" data-f="cheap" aria-pressed="false">${t("До 50 000 сум", "50 000 so‘mgacha")}</button><button type="button" class="chip" data-f="big" aria-pressed="false">${t("На компанию, от 500 г", "Davraga, 500 g dan")}</button><button type="button" class="chip" data-f="soft" aria-pressed="false">${t("Без алкоголя", "Alkogolsiz")}</button></div>
<p class="mn-note" id="mn-alc" hidden>${t("Алкоголь продаём гостям старше 18 лет.", "Alkogol 18 yoshdan katta mehmonlarga sotiladi.")}</p>
<div id="mn-grid"></div>
</div></section>`;
}

function book(l, t) {
  return `<section class="sec alt" id="book" data-addon="booking"><div class="wrap">
<p class="kick rise"><i></i>${t("Бронь стола", "Stol bron qilish")}</p>
<h2 class="h2 rise">${t("Стол на вечер <b>в два касания</b>", "Kechga stol <b>ikki bosishda</b>")}</h2>
<p class="lead rise">${t("День, время, гости. Бронь сразу у администратора в панели, а статус вы видите здесь, в «Моя бронь».", "Kun, vaqt, mehmonlar. Bron darhol administrator panelida, holatini esa shu yerda, «Mening bronim»da ko‘rasiz.")}</p>
<div class="bk"><form class="bk-f glass rise" id="bk-form" novalidate>
<h3>${t("Когда", "Qachon")}</h3><div class="days" id="bk-days"></div>
<h3>${t("Во сколько", "Soat nechada")}</h3><div class="times" id="bk-times"></div>
<h3>${t("Сколько гостей", "Necha mehmon")}</h3><div class="ppl"><button type="button" id="bk-m" aria-label="${t("Меньше гостей", "Kamroq mehmon")}">−</button><b id="bk-n" aria-live="polite">2</b><button type="button" id="bk-p" aria-label="${t("Больше гостей", "Ko‘proq mehmon")}">+</button></div>
<p class="bq" id="bk-q" aria-live="polite"></p>
<label class="fld"><span>${t("Имя", "Ism")}</span><input id="bk-name" autocomplete="name"></label>
<label class="fld"><span>${t("Телефон", "Telefon")}</span><input id="bk-ph" type="tel" inputmode="tel" autocomplete="tel" value="+998 "></label>
<label class="fld"><span>${t("Пожелание", "Istak")}</span><input id="bk-note" placeholder="${t("у окна, день рождения…", "deraza yonida, tug‘ilgan kun…")}"></label>
<button type="submit" class="btn btn-a" style="width:100%">${ICON.cal}<span>${t("Забронировать", "Bron qilish")}</span></button>
<p class="note" style="margin-top:10px">${t("Это макет: бронь ложится в панель в этом браузере, никуда не уходит.", "Bu maket: bron shu brauzerdagi panelga tushadi, hech qayerga ketmaydi.")}</p>
</form>
<div class="bk-side"><figure class="bk-ph rise"><img src="${IMG}/h-8-s.webp" width="960" height="552" alt="${t("Зал Agora с огнями на потолке", "Shiftida chiroqlar bilan Agora zali")}" loading="lazy"><figcaption class="glass">${t("Зал под звёздами", "Yulduzlar ostidagi zal")}</figcaption></figure>
<div class="bk-c rise"><a href="tel:${BRAND.tel}">${ICON.phone}${BRAND.phone}</a><span>${t("Удобнее голосом: звонок в одно касание.", "Ovozda qulayroq: bir bosishda qo‘ng‘iroq.")}</span><a href="${IG}" target="_blank" rel="noopener">${ICON.ig}@${BRAND.ig}</a></div></div>
</div></div></section>`;
}

function botSec(l, t) {
  const S = [["menu", t("Меню и заказ", "Menyu va buyurtma")], ["book", t("Бронь стола", "Stol bron")], ["faq", t("Вопросы гостей", "Mehmon savollari")], ["remind", t("Напоминание", "Eslatma")], ["status", t("Статус заказа", "Buyurtma holati")], ["human", t("Позвать человека", "Odam chaqirish")]];
  const li = (a, ic) => `<ul>${a.map((x) => `<li>${ic}<span>${esc(x)}</span></li>`).join("")}</ul>`;
  return `<section class="sec" id="bot" data-addon="tgbot"><div class="wrap">
<p class="kick rise"><i></i>${t("Telegram-бот с ИИ", "Sun’iy intellektli Telegram-bot")}</p>
<h2 class="h2 rise">${t("Отвечает гостю, <b>когда телефон занят</b>", "Telefon band bo‘lganda <b>mehmonga javob beradi</b>")}</h2>
<p class="lead rise">${t("Выберите сценарий: переписка идёт так, как её увидит гость. В макете ответы готовые, без модели; бронь, заказ и «позвать человека» падают в панель.", "Ssenariyni tanlang: yozishma mehmon ko‘radigandek boradi. Maketda javoblar tayyor, modelsiz; bron, buyurtma va «odam chaqirish» panelga tushadi.")}</p>
<div class="scn" id="scn" role="group" aria-label="${t("Сценарии", "Ssenariylar")}">${S.map(([id, n], i) => `<button type="button" class="chip" data-s="${id}" aria-pressed="${i === 0}">${n}</button>`).join("")}</div>
<div class="bt"><div class="tgw rise" aria-label="${t("Демо-переписка с ботом", "Bot bilan demo yozishma")}"><div class="tg-h"><span class="tg-av">${MARK()}</span><span><b>Agora Lounge &amp; bar</b><small>${t("бот · демо", "bot · demo")}</small></span></div>
<div class="tg-b" id="tg-b" aria-live="polite"></div><div class="tg-f" aria-hidden="true"><span>${t("Сообщение", "Xabar")}</span></div></div>
<div class="cando">
<div class="rise"><h3>${t("Делает сам", "O‘zi qiladi")}</h3>${li(BOT.self[l], ICON.check)}</div>
<div class="hm rise"><h3>${t("Передаёт администратору", "Administratorga uzatadi")}</h3>${li(BOT.human[l], ICON.arrow)}</div>
<div class="ai-cost glass rise"><span>${t("Работа ИИ в месяц, по факту", "Oyiga sun’iy intellekt ishi, amalda")}<br><small class="note">${t(`примерно при ${fmt(AI.dialogs[0])}-${fmt(AI.dialogs[1])} диалогах; оплата по расходу`, `taxminan ${fmt(AI.dialogs[0])}-${fmt(AI.dialogs[1])} dialogda; sarf bo‘yicha to‘lov`)}</small></span><b>${AI.from}-${AI.to}&nbsp;$</b></div>
</div></div>
</div></section>`;
}

function hall(l, t) {
  const fig = (h) => `<figure><img src="${IMG}/h-${h[0]}-s.webp" width="960" height="547" alt="${esc(l === "ru" ? h[1] : h[2])}, Agora" loading="lazy"><figcaption class="glass">${esc(l === "ru" ? h[1] : h[2])}</figcaption></figure>`;
  return `<section class="sec alt" id="hall"><div class="wrap">
<p class="kick rise"><i></i>${t("Зал", "Zal")}</p>
<h2 class="h2 rise">${t("Так выглядит <b>вечер у вас</b>", "Sizda kech <b>shunday o‘tadi</b>")}</h2>
<p class="lead rise">${t("Двенадцать ваших снимков из галереи меню.", "Menyu galereyasidan o‘n ikkita suratingiz.")}</p></div>
<div class="hl"><div class="hl-row">${HALL.slice(0, 6).map(fig).join("")}</div><div class="hl-row">${HALL.slice(6).map(fig).join("")}</div></div>
</section>`;
}

/* QR как узор кодом: три угловых квадрата и клетки из зерна. Это картинка, не код. */
function qrArt() {
  let z = 7, s = "";
  const r = () => ((z = (z * 16807) % 2147483647) / 2147483647);
  const fin = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#000"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#000"/>`;
  for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
    if ((x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16)) continue;
    if (r() > .52) s += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="0 0 25 25" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><g fill="#000">${s}</g>${fin(0, 0)}${fin(18, 0)}${fin(0, 18)}</svg>`;
}

function more(l, t) {
  return `<section class="sec" id="more"><div class="wrap">
<p class="kick rise"><i></i>${t("Ещё в макете", "Maketda yana")}</p>
<h2 class="h2 rise">${t("Мелочи, <b>которые экономят смену</b>", "Smenani <b>tejaydigan</b> mayda narsalar")}</h2>
<div class="adds-s">
<div class="ab pop" data-addon="qr"><span class="k">${t("QR-меню на столе", "Stoldagi QR-menyu")}</span><h3>${t("Стол 7 зовёт официанта", "7-stol ofitsiantni chaqiradi")}</h3>
<div class="qr">${qrArt()}<div class="seg"><button type="button" data-qr="w">${t("Позвать официанта", "Ofitsiantni chaqirish")}</button><button type="button" data-qr="b">${t("Попросить счёт", "Hisobni so‘rash")}</button></div></div>
<p>${t("Гость сканирует код: меню с фото и две кнопки. Нажатие сразу в панели, в разделе «Бот и зал».", "Mehmon kodni skanerlaydi: rasmli menyu va ikkita tugma. Bosish darhol panelda, «Bot va zal» bo‘limida.")}</p></div>
<div class="ab pop" data-addon="iiko"><span class="k">iiko</span><h3>${t("Меню уже живёт в iiko", "Menyu allaqachon iiko’da")}</h3>
<p>${t(`Все ${COUNT.all + HOOKAH} позиций вашего меню в rezvo приходят из iiko. Сайт и бот возьмут цены, фото и стоп-лист оттуда же, а заказ уйдёт на кухню без ручного ввода.`, `rezvo’dagi menyuingizning barcha ${COUNT.all + HOOKAH} ta pozitsiyasi iiko’dan keladi. Sayt va bot narxlar, rasmlar va stop-listni o‘sha yerdan oladi, buyurtma esa oshxonaga qo‘lda kiritmasdan ketadi.`)}</p>
<div class="iik"><span>${t("цены", "narxlar")}</span><span>${t("фото", "rasmlar")}</span><span>${t("стоп-лист", "stop-list")}</span><span>${t("заказ на кухню", "oshxonaga buyurtma")}</span></div></div>
<div class="ab pop" data-addon="reviews"><span class="k">${t("Отзывы после визита", "Tashrifdan keyin sharhlar")}</span><h3>${t("«Как прошёл вечер?»", "«Kech qanday o‘tdi?»")}</h3>
<p>${t("На следующий день гостю, который бронировал, приходит одно сообщение. Попробуйте:", "Ertasi kuni bron qilgan mehmonga bitta xabar keladi. Sinab ko‘ring:")}</p>
<div class="stars" role="group" aria-label="${t("Оценка", "Baho")}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" aria-label="${n}">★</button>`).join("")}</div><p class="note" id="rv-out" aria-live="polite"></p></div>
<div class="ab pop" data-addon="panel"><span class="k">${t("Панель ресторана", "Restoran paneli")}</span><h3>${t("Всё с сайта и из бота в одном окне", "Sayt va botdan hammasi bitta oynada")}</h3>
<p>${t("Брони первой строкой, заказы, кому из бота нужен человек, стоп-лист. Владелец видит выручку, администратор нет.", "Bronlar birinchi qatorda, buyurtmalar, botdan kimga odam kerak, stop-list. Ega tushumni ko‘radi, administrator ko‘rmaydi.")}</p>
<a class="btn btn-g" href="${href(l, "panel")}">${ICON.panel}<span>${t("Открыть панель", "Panelni ochish")}</span></a></div>
<div class="ab pop" data-addon="en"><span class="k">English</span><h3>${t("Третий язык для гостей города", "Shahar mehmonlari uchun uchinchi til")}</h3>
<p>${t("Сайт и бот на английском: меню, бронь и ответы на вопросы. Узбекский и русский уже в макете.", "Sayt va bot ingliz tilida: menyu, bron va savollarga javob. O‘zbek va rus tillari maketda allaqachon bor.")}</p></div>
</div></div></section>`;
}

function contact(l, t) {
  const B = BRAND[l];
  return `<section class="sec alt" id="contact"><div class="wrap">
<p class="kick rise"><i></i>${t("Как найти", "Qanday topish")}</p>
<h2 class="h2 rise">${esc(B.street)}</h2>
<div class="ct"><div class="ct-c glass rise">
<div class="r">${ICON.pin}<div><b>${esc(B.street)}, ${esc(B.city)}</b><span>${t("на карте и в навигаторе по точке", "xaritada va navigatorda nuqta bo‘yicha")}</span></div></div>
<div class="r">${ICON.clock}<div><b data-hours>${esc(B.hours)}</b><span>${t("часы работы", "ish vaqti")}</span></div></div>
<div class="r">${ICON.phone}<div><b><a href="tel:${BRAND.tel}">${BRAND.phone}</a></b><span>${t("звонок и бронь", "qo‘ng‘iroq va bron")}</span></div></div>
<div class="r">${ICON.ig}<div><b><a href="${IG}" target="_blank" rel="noopener">@${BRAND.ig}</a></b><span>Instagram</span></div></div>
<div class="hero-act"><a class="btn btn-a" href="${ROUTE}" target="_blank" rel="noopener">${ICON.pin}<span>${t("Маршрут", "Yo‘nalish")}</span></a><a class="btn btn-g" href="tel:${BRAND.tel}">${ICON.phone}<span>${t("Позвонить", "Qo‘ng‘iroq")}</span></a></div></div>
<div class="ct-map rise" aria-label="${t("Схема: Agora на улице Амира Темура", "Sxema: Agora Amir Temur ko‘chasida")}">
<svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="600" height="400" fill="#16110f"/><g stroke="#2a201b" stroke-width="2" fill="none"><path d="M0 80h600M0 170h600M0 300h600M90 0v400M230 0v400M420 0v400M520 0v400M0 360 600 20"/></g><path d="M300 0v400" stroke="#4a3426" stroke-width="16"/><path d="M300 0v400" stroke="#6b4a33" stroke-width="2" stroke-dasharray="10 12"/><text x="314" y="380" fill="#8a7a70" font-size="14" font-family="Manrope,sans-serif">${t("ул. Амира Темура", "Amir Temur ko‘chasi")}</text></svg>
<div class="pin"><i></i><span class="glass">AGORA · 15</span></div></div>
</div></div></section>`;
}

function footer(l, t, to = "site") {
  return `<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l, to)}<p style="margin-top:16px">${t("Меню, цены, адрес и фото зала: ваше меню rezvo, 01.11.2026. Фото блюд ваши; у позиций без своего фото снимок того же или похожего блюда с Unsplash, с подписью в карточке. Брони, заказы и цифры панели: демо.", "Menyu, narxlar, manzil va zal suratlari: rezvo menyuingiz, 01.11.2026. Taom suratlari sizniki; o‘z surati yo‘q pozitsiyalarda xuddi shu yoki o‘xshash taomning Unsplash surati, kartochkada izoh bilan. Bronlar, buyurtmalar va panel raqamlari: demo.")}</p></div>
<div><h4>${t("Сайт", "Sayt")}</h4><a href="${href(l, "site")}#menu">${t("Меню", "Menyu")}</a><a href="${href(l, "site")}#book">${t("Бронь", "Bron")}</a><a href="${href(l, "site")}#bot">${t("Бот", "Bot")}</a></div>
<div><h4>${t("Макет", "Maket")}</h4><a href="${href(l)}">${t("Первая страница", "Birinchi sahifa")}</a><a href="${href(l, "panel")}">${t("Админка", "Admin panel")}</a><a href="${href(l)}#offer">${t("Стоимость", "Narxi")}</a></div>
<div><h4>Agora</h4><a href="tel:${BRAND.tel}">${BRAND.phone}</a><a href="${IG}" target="_blank" rel="noopener">Instagram</a><a href="https://devuz.studio" target="_blank" rel="noopener">DevUz Studio</a></div>
</div><div class="sm"><span>© 2026 AGORA Lounge &amp; bar</span><span>${terms(l, t)}</span></div></div></footer>`;
}

/* Бот: готовые сценарии. u — гость, b — бот, kb — кнопки, dish — карточка
   блюда из меню, sys — служебная строка, act — запись в панель. */
function botScripts(l, t) {
  const id = (n) => byRu(n).id, B = BRAND[l], p = (n) => sum(byRu(n).price, l).replace(/\u00a0/g, " ");
  const lyulya = "Люля кебаб (200гр)", fri = "Картофель фри";
  return {
    menu: [
      ["u", t("Здравствуйте! Хочу заказать навынос", "Assalomu alaykum! Olib ketishga buyurtma bermoqchiman")],
      ["b", t("Здравствуйте! Что смотрим?", "Assalomu alaykum! Nimani ko‘ramiz?")],
      ["kb", [t("Салаты", "Salatlar"), t("Мангал", "Manqal"), t("Горячее", "Issiq taomlar"), t("Бар", "Bar")]],
      ["u", t("Мангал", "Manqal")],
      ["dish", id(lyulya)], ["dish", id("Корейка на мангале")],
      ["u", t("Люля 2 порции и картофель фри", "Lyulya 2 porsiya va kartoshka fri")],
      ["b", t(`Добавил:\nЛюля кебаб (200 г) × 2: ${fmt(byRu(lyulya).price * 2).replace(/\u00a0/g, " ")} сум\nКартофель фри: ${p(fri)}\nИтого ${fmt(byRu(lyulya).price * 2 + byRu(fri).price).replace(/\u00a0/g, " ")} сум. Когда заберёте?`, `Qo‘shdim:\nLyulya kabob (200 g) × 2: ${fmt(byRu(lyulya).price * 2).replace(/\u00a0/g, " ")} so‘m\nKartoshka fri: ${p(fri)}\nJami ${fmt(byRu(lyulya).price * 2 + byRu(fri).price).replace(/\u00a0/g, " ")} so‘m. Qachon olib ketasiz?`)],
      ["kb", [t("Через 30 минут", "30 daqiqadan keyin"), t("Через час", "Bir soatdan keyin")]],
      ["u", t("Через 30 минут", "30 daqiqadan keyin")],
      ["act", "ord", [[id(lyulya), 2], [id(fri), 1]], t("Гость из бота", "Botdan mehmon")],
      ["b", t("Заказ №{ord} принят и уже в панели. Когда будет готов, напишу здесь.", "№{ord} buyurtma qabul qilindi va panelda. Tayyor bo‘lganda shu yerda yozaman.")],
    ],
    book: [
      ["u", t("Хочу стол на субботу, нас 4", "Shanbaga stol kerak, 4 kishimiz")],
      ["b", t("Суббота, 4 гостя. Во сколько?", "Shanba, 4 mehmon. Soat nechada?")],
      ["kb", ["19:00", "20:00", "21:00", "22:00"]],
      ["u", "20:00"],
      ["b", t(`Работаем ${B.hours}, 20:00 подходит. На чьё имя записать?`, `${B.hours} ishlaymiz, 20:00 to‘g‘ri keladi. Kimning nomiga yozay?`)],
      ["u", t("Азиз", "Aziz")],
      ["act", "book", t("суббота", "shanba"), "20:00", 4, t("Азиз", "Aziz")],
      ["b", t("Готово: суббота, 20:00, 4 гостя, на имя Азиз. За 2 часа напомню и спрошу, всё ли в силе.", "Tayyor: shanba, 20:00, 4 mehmon, Aziz nomiga. 2 soat oldin eslataman va hammasi kuchdami deb so‘rayman.")],
    ],
    faq: [
      ["sys", t("Ответы из фактов, которые ресторан вписал в панель. В макете: пример.", "Restoran panelga yozgan faktlardan javoblar. Maketda: namuna.")],
      ["u", t("До скольки вы работаете?", "Soat nechagacha ishlaysiz?")],
      ["b", t(`${B.hours[0].toUpperCase() + B.hours.slice(1)}. Адрес: ${B.street}.`, `${B.hours[0].toUpperCase() + B.hours.slice(1)}. Manzil: ${B.street}.`)],
      ["u", t("Есть что-то без глютена?", "Glyutensiz narsa bormi?")],
      ["b", t("По составу в меню без муки: Капрезе, Буррата с розовыми помидорами, Овощная нарезка, блюда с мангала без лаваша, рис. Если нужна кухня совсем без следов глютена, уточню у шефа и отвечу здесь.", "Menyudagi tarkib bo‘yicha unsiz: Kapreze, Pushti pomidorli burrata, Sabzavot to‘plami, lavashsiz manqal taomlari, guruch. Agar glyuten izi umuman bo‘lmasligi kerak bo‘lsa, oshpazdan so‘rab, shu yerda javob beraman.")],
      ["u", t("А с детьми можно?", "Bolalar bilan kelsa bo‘ladimi?")],
      ["b", t("Да, приходите с детьми. Из меню детям обычно берут картофель фри, фреши и лимонады.", "Ha, bolalar bilan keling. Menyudan bolalarga odatda kartoshka fri, fresh va limonad olishadi.")],
    ],
    remind: [
      ["sys", t("Суббота, 18:00 · за 2 часа до брони", "Shanba, 18:00 · brondan 2 soat oldin")],
      ["b", t(`Напоминаем: сегодня в 20:00 ваш стол в Agora на 4 гостей. ${B.street}.`, `Eslatma: bugun soat 20:00 da Agora’da 4 mehmonga stolingiz. ${B.street}.`)],
      ["kb", [t("Придём", "Kelamiz"), t("Опоздаем на 15 минут", "15 daqiqa kechikamiz"), t("Отменить", "Bekor qilish")]],
      ["u", t("Опоздаем на 15 минут", "15 daqiqa kechikamiz")],
      ["b", t("Хорошо, передал администратору: стол на 4 гостя, придёте к 20:15.", "Yaxshi, administratorga yetkazdim: 4 mehmonga stol, 20:15 ga kelasiz.")],
      ["sys", t("В панели у брони пометка «опоздают на 15 минут»", "Paneldagi bronda «15 daqiqa kechikishadi» belgisi")],
    ],
    status: [
      ["u", t("Где мой заказ?", "Buyurtmam qayerda?")],
      ["b", t("Заказ №{ord}: «{st}». Статус ставит кухня в панели, и я сразу пишу его сюда.", "№{ord} buyurtma: «{st}». Holatni oshxona panelda qo‘yadi, men esa darhol shu yerga yozaman.")],
      ["sys", t("Кухня нажала «Готов» в панели", "Oshxona panelda «Tayyor»ni bosdi")],
      ["b", t("Заказ №{ord} готов, можно забирать. Ждём вас!", "№{ord} buyurtma tayyor, olib ketishingiz mumkin. Sizni kutamiz!")],
    ],
    human: [
      ["u", t("Позовите человека. Хотим банкет на 25 человек в пятницу", "Odam chaqiring. Jumaga 25 kishilik banket xohlaymiz")],
      ["b", t("Банкет на 25 гостей ведёт администратор: меню, зал и предоплату обсудит он. Передал ему ваш вопрос, ответ придёт сюда же.", "25 mehmonlik banketni administrator olib boradi: menyu, zal va oldindan to‘lovni u muhokama qiladi. Savolingizni unga yetkazdim, javob shu yerga keladi.")],
      ["act", "hand", t("Банкет «[[t:0]] Group»", "«[[t:0]] Group» banketi"), t("Банкет на 25 человек в пятницу", "Jumaga 25 kishilik banket")],
      ["sys", t("В панели: «Бот и зал» → «Ждут ответа»", "Panelda: «Bot va zal» → «Javob kutmoqda»")],
    ],
  };
}

/* Настройки сайта по умолчанию: панель их меняет (ag-set-1), сайт читает. */
const TIMES = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "23:00", "00:00", "01:00"];
function set0(l, t) {
  return {
    pause: false, bannerOn: true, banner: t("Бизнес-ланч по будням: 95 000 сум", "Ish kunlari biznes-lanch: 95 000 so‘m"), hours: BRAND[l].hours,
    dlv: { on: true, pick: true, min: 100000, free: 400000, zones: [{ n: t("До 3 км", "3 km gacha"), p: 15000, m: 40 }, { n: t("3-7 км", "3-7 km"), p: 25000, m: 60 }, { n: t("7-12 км", "7-12 km"), p: 35000, m: 80 }] },
    book: { from: "12:00", to: "01:00", max: 20, auto: false, pre: true },
  };
}

/* Данные для site.js: меню — массивами, чтобы страница была легче. */
function data(l, t) {
  const times = TIMES;
  return {
    l, img: IMG, tel: BRAND.tel, telHref: `tel:${BRAND.tel}`, panel: href(l, "panel"), times, set0: set0(l, t),
    cats: CATS.map((c) => ({ id: c.id, g: c.g, n: c[l] })),
    menu: MENU.map((m) => [m.id, m.cat, nm(m, l), l === "ru" ? m.dru : m.duz, m.price, m.w, m.ph, (m.alias ? 1 : 0) | (m.stock ? 2 : 0) | (m.alc ? 4 : 0) | (m.ex ? 8 : 0), m.g]),
    bot: botScripts(l, t),
    t: {
      sum: l === "ru" ? "сум" : "so‘m", g: t("г", "g"), stop: t("Сегодня нет", "Bugun yo‘q"), all: t("Показать все {n}", "Hammasini ko‘rsatish: {n}"), none: t("Ничего не нашлось. Попробуйте другое слово.", "Hech narsa topilmadi. Boshqa so‘zni sinab ko‘ring."),
      alias: t("Фото позиции большой порции", "Katta porsiya surati"), stock: t("Фото того же блюда: Unsplash, ваше встанет сюда", "Xuddi shu taom surati: Unsplash, sizniki shu yerga qo‘yiladi"), like: t("Похожее фото: Unsplash, ваше встанет сюда", "O‘xshash surat: Unsplash, sizniki shu yerga qo‘yiladi"),
      add: t("В заказ", "Buyurtmaga"), added: t("В заказе", "Buyurtmada"), call: t("Позвонить", "Qo‘ng‘iroq qilish"),
      toDlv: t("Доставка", "Yetkazib berish"), dishes: t("Блюда", "Taomlar"), paused: t("Сейчас заказы не принимаем: кухня на паузе. Бронь стола работает.", "Hozir buyurtma qabul qilmayapmiz: oshxona pauzada. Stol bron ishlaydi."),
      noModes: t("Заказ с сайта сейчас выключен. Позвоните нам.", "Saytdan buyurtma hozir o‘chirilgan. Bizga qo‘ng‘iroq qiling."), zone: t("Куда везти", "Qayerga olib boramiz"), addr: t("Адрес", "Manzil"), addrPh: t("Улица, дом, подъезд", "Ko‘cha, uy, kirish"),
      zonesDemo: t("Зоны и цены доставки ставит владелец в панели.", "Yetkazish hududlari va narxlarini egasi panelda belgilaydi."), dlvFee: t("Доставка", "Yetkazish"), freeFrom: t("бесплатно от", "bepul:"), free: t("бесплатно", "bepul"),
      min: t("мин", "daq"), minOrder: t("Доставка от {n}", "Yetkazish {n} dan"), needAddr: t("Напишите адрес", "Manzilni yozing"), tag_hit: t("Хит", "Xit"), tag_new: t("Новинка", "Yangi"),
      cart: t("Ваш заказ", "Buyurtmangiz"), total: t("Итого", "Jami"), how: t("Как", "Qanday"), toBook: t("К брони", "Bronga"), toGo: t("Навынос", "Olib ketish"),
      name: t("Имя", "Ism"), phone: t("Телефон", "Telefon"), order: t("Оформить заказ", "Buyurtma berish"), clear: t("Очистить", "Tozalash"),
      ordNote: t("Это макет: заказ ложится в панель в этом браузере, никуда не уходит.", "Bu maket: buyurtma shu brauzerdagi panelga tushadi, hech qayerga ketmaydi."),
      need: t("Напишите имя и телефон", "Ism va telefonni yozing"), pickTime: t("Выберите время", "Vaqtni tanlang"),
      today: t("Сегодня", "Bugun"), tomorrow: t("Завтра", "Ertaga"),
      wd: l === "ru" ? ["вс", "пн", "вт", "ср", "чт", "пт", "сб"] : ["yak", "dush", "sesh", "chor", "pay", "jum", "shan"],
      mon: l === "ru" ? ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"] : ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"],
      bigTable: t("От 10 гостей: администратор перезвонит, чтобы собрать стол", "10 mehmondan: stolni tayyorlash uchun administrator qo‘ng‘iroq qiladi"),
      mine: t("Моя бронь", "Mening bronim"), mineOrd: t("Мой заказ", "Mening buyurtmam"), bookNo: t("Бронь", "Bron"), ordNo: t("Заказ", "Buyurtma"), guests: t("гостей", "mehmon"),
      bst: [t("Новая: ждёт администратора", "Yangi: administratorni kutmoqda"), t("Подтверждена", "Tasdiqlandi"), t("Гости пришли", "Mehmonlar keldi"), t("Отменена", "Bekor qilindi")],
      ost: [t("Новый", "Yangi"), t("Принят", "Qabul qilindi"), t("Готовится", "Tayyorlanmoqda"), t("Готов", "Tayyor"), t("Выдан", "Berildi")],
      mineHint: t("Это макет: статус меняет администратор в панели, и вы видите его здесь.", "Bu maket: holatni administrator panelda o‘zgartiradi va siz uni shu yerda ko‘rasiz."),
      openPanel: t("Открыть панель", "Panelni ochish"), sms: t("Отправить SMS в Agora", "Agora’ga SMS yuborish"),
      smsText: t("Здравствуйте! Бронь стола: {d}, {t}, гостей {n}, на имя {name}.", "Assalomu alaykum! Stol bron: {d}, {t}, {n} mehmon, {name} nomiga."),
      table7: t("Стол 7, QR", "7-stol, QR"), callWaiter: t("Позвать официанта", "Ofitsiantni chaqirish"), callBill: t("Попросить счёт", "Hisobni so‘rash"), qrSent: t("Вызов уже в панели", "Chaqiruv allaqachon panelda"),
      rvGood: t("Спасибо! Следующий шаг: «Оставить отзыв на Яндекс Картах».", "Rahmat! Keyingi qadam: «Yandex Xaritalarda sharh qoldirish»."), rvBad: t("Спасибо. Такой ответ уходит администратору, а не на карты.", "Rahmat. Bunday javob xaritalarga emas, administratorga ketadi."),
    },
  };
}

function sitePage(l) {
  const t = T(l);
  const title = t("AGORA Lounge & bar · Ташкент, Амира Темура 15 · меню и бронь", "AGORA Lounge & bar · Toshkent, Amir Temur 15 · menyu va bron");
  const desc = t(`Европейская кухня, мангал и бар. ${COUNT.all} позиций меню с ценами, бронь стола онлайн, бот в Telegram.`, `Yevropa oshxonasi, manqal va bar. Narxlari bilan ${COUNT.all} ta menyu pozitsiyasi, onlayn stol bron, Telegram bot.`);
  return `${head(l, title, desc)}
<link rel="preload" as="image" href="${IMG}/h-6.webp" media="(min-width: 900px)">
<style>${CSS}</style>
</head>
<body>
${LOGO_G}
<a class="vh" href="#book">${t("К брони стола", "Stol broniga o‘tish")}</a>
${header(l, t)}
<main>
${hero(l, t)}
${velo(l)}
${evening(l, t)}
${menuSec(l, t)}
${book(l, t)}
${botSec(l, t)}
${hall(l, t)}
${more(l, t)}
${contact(l, t)}
</main>
${footer(l, t)}
<a class="cfgb glass" href="${href(l)}#offer">${t("Конструктор", "Konstruktor")}</a>
<button type="button" class="cart" id="cart" data-addon="order">${ICON.bag}<span id="cart-s"></span><b id="cart-n">0</b></button>
<div class="dock glass" id="dock"><a class="btn btn-a" href="#book" data-addon="booking">${ICON.cal}<span>${t("Бронь", "Bron")}</span></a><a class="btn btn-a" href="tel:${BRAND.tel}" data-off="booking">${ICON.phone}<span>${t("Позвонить", "Qo‘ng‘iroq")}</span></a><a class="btn btn-g" href="#menu">${ICON.menu}<span>${t("Меню", "Menyu")}</span></a></div>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="shh"><div class="sh" data-close></div><div class="box"><div class="bh"><b id="shh"></b><button type="button" class="x" data-close aria-label="${t("Закрыть", "Yopish")}">${ICON.close}</button></div><div class="bb" id="shb"></div></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="ag-data">${JSON.stringify(data(l, t)).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}

/* ── Первая страница: залёт в знак, выбор, конструктор DevUz ─────── */
function offer(l, t) {
  const it = SUPPORT.map((s) => `<label class="it-r"><input type="${s.id.startsWith("care") ? "radio" : "checkbox"}" name="${s.id.startsWith("care") ? "care" : s.id}" data-it="${s.id}"${s.id === "carebot" ? "" : " checked"}><span><b>${esc(s[l].t)}</b><p>${esc(s[l].e)}</p></span><span class="ap">${usd(s.price)}<small>${s.per === "year" ? t("в год", "yiliga") : t("в месяц", "oyiga")}</small></span></label>`).join("");
  return `<section class="sec" id="offer"><div class="wrap">
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
<div class="tot"><span>${t("Итого разово", "Bir martalik jami")}</span><b id="total">${usd(ALL)}</b></div>
<p style="margin:8px 0 0;color:var(--mu);font-size:14px">${t("Цена сайта держится:", "Sayt narxi amal qiladi:")}</p>
<div class="timer"><span><b id="th">48</b><small>${t("часов", "soat")}</small></span><span><b id="tm">00</b><small>${t("минут", "daqiqa")}</small></span><span><b id="ts">00</b><small>${t("секунд", "soniya")}</small></span></div>
<div class="ctrl"><button type="button" class="btn btn-g btn-s" id="allon">${t("Всё из макета", "Maketdagi hammasi")}</button><button type="button" class="btn btn-g btn-s" id="alloff">${t("Только сайт", "Faqat sayt")}</button></div>
<button type="button" class="btn btn-g" id="copy">${ICON.copy}<span>${t("Скопировать состав", "Tarkibni nusxalash")}</span></button>
<a class="btn btn-a" href="${DEVUZ}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
</aside></div>
<div class="it" id="it"><div>
<h3>${t("IT-поддержка, домен и сервер", "IT-qo‘llab-quvvatlash, domen va server")}</h3>
<span class="it-note">${t(`Ежемесячные и годовые платежи: в ${usd(ALL)} разовых работ не входят`, `Oylik va yillik to‘lovlar: ${usd(ALL)} bir martalik ishlarga kirmaydi`)}</span>
<p class="lead" style="font-size:16px;margin-bottom:16px">${t("Цены по середине рынка Узбекистана на 01.11.2026. Поддержка: одна из двух.", "01.11.2026 holatiga O‘zbekiston bozori o‘rtasi bo‘yicha narxlar. Qo‘llab-quvvatlash: ikkitadan biri.")}</p>
<div class="it-rows">${it}</div></div>
<aside class="it-sum glass" aria-live="polite">
<div class="row"><span>${t("В месяц", "Oyiga")}</span><b id="it-m">0 $</b></div>
<div class="row"><span>${t("В год", "Yiliga")}</span><b id="it-y">0 $</b></div>
<p class="it-ai" id="it-ai">${t(`Плюс работа ИИ в боте: по факту, примерно ${AI.from}-${AI.to} $ в месяц при ${fmt(AI.dialogs[0])}-${fmt(AI.dialogs[1])} диалогах. Платите столько, сколько гости написали.`, `Qo‘shimcha botdagi sun’iy intellekt ishi: amalda, ${fmt(AI.dialogs[0])}-${fmt(AI.dialogs[1])} dialogda oyiga taxminan ${AI.from}-${AI.to} $. Mehmonlar qancha yozgan bo‘lsa, shuncha to‘laysiz.`)}</p>
<p class="note">${t("«Поддержка сайта и бота» включается вместе с допом «Telegram-бот с ИИ».", "«Sayt va botni qo‘llab-quvvatlash» «Sun’iy intellektli Telegram-bot» qo‘shimchasi bilan birga yoqiladi.")}</p>
</aside></div>
</div></section>`;
}

function landPage(l) {
  const t = T(l);
  const site = [
    t("Залёт в ваш знак и первый экран с вашим залом", "Belgingizga uchib kirish va zalingiz bilan birinchi ekran"),
    t("«Вечер в Agora»: пять ваших позиций на столах зала", "«Agora’da kechqurun»: zal stollarida beshta pozitsiyangiz"),
    t(`Меню целиком: ${COUNT.all} позиций, фильтры, карточка блюда`, `To‘liq menyu: ${COUNT.all} ta pozitsiya, filtrlar, taom kartochkasi`),
    t("Бронь в два касания, статус у гостя", "Ikki bosishda bron, holat mehmonda"),
  ];
  const pan = [
    t("Вход кодом из Telegram, «стекло» поверх вашего зала", "Telegram kodi bilan kirish, zalingiz ustida «shisha»"),
    t("Бронь с сайта первой строкой, статус виден гостю", "Saytdan bron birinchi qatorda, holat mehmonga ko‘rinadi"),
    t("Стоп-лист: блюдо сразу пропадает с сайта", "Stop-list: taom saytdan darhol yo‘qoladi"),
    t("Роли и история действий, выгрузка CSV и счёта", "Rollar va harakatlar tarixi, CSV va hisobni yuklab olish"),
  ];
  const bot = [
    t("Меню и заказ, бронь, ответы на вопросы", "Menyu va buyurtma, bron, savollarga javob"),
    t("Напоминание о брони и статус заказа", "Bron eslatmasi va buyurtma holati"),
    t("Сложное передаёт администратору в панель", "Murakkabini panelda administratorga uzatadi"),
    t(`ИИ по факту: примерно ${AI.from}-${AI.to} $ в месяц`, `Sun’iy intellekt amalda: oyiga taxminan ${AI.from}-${AI.to} $`),
  ];
  const li = (a) => `<ul class="feat">${a.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>`;
  const steps = [
    t("Откройте сайт, в «Бронь» выберите завтра, 20:00, 4 гостя и нажмите «Забронировать».", "Saytni oching, «Bron»da ertangi kun, 20:00, 4 mehmonni tanlang va «Bron qilish»ni bosing."),
    t("Откройте админку, войдите кодом 1234: ваша бронь первой строкой. Нажмите «Подтвердить».", "Admin panelni oching, 1234 kodi bilan kiring: broningiz birinchi qatorda. «Tasdiqlash»ni bosing."),
    t("Вернитесь на сайт: в «Моя бронь» уже «Подтверждена». В «Меню и стоп-лист» снимите блюдо, и оно пропадёт с сайта.", "Saytga qayting: «Mening bronim»da allaqachon «Tasdiqlandi». «Menyu va stop-list»da taomni o‘chiring, u saytdan yo‘qoladi."),
  ];
  const ld = { base: BASE.promo, hours: OFFER_HOURS, logo: LOGO_VB, aim: [568, 192], add: ADDONS.map((a) => ({ id: a.id, p: a.price, t: a[l].t })), it: SUPPORT.map((s) => ({ id: s.id, p: s.price, per: s.per })), t: { copied: t("Состав скопирован", "Tarkib nusxalandi"), tot: t("Итого разово", "Bir martalik jami"), month: t("В месяц", "Oyiga"), year: t("В год", "Yiliga") } };
  return `${head(l, t("AGORA · макет сайта, панели и бота · DevUz Studio", "AGORA · sayt, panel va bot maketi · DevUz Studio"), t("Макет для Agora Lounge & bar: сайт с меню и бронью, панель ресторана и Telegram-бот. Конструктор цены и ежемесячные платежи.", "Agora Lounge & bar uchun maket: menyu va bronli sayt, restoran paneli va Telegram-bot. Narx konstruktori va oylik to‘lovlar."))}
<link rel="preload" as="image" href="${IMG}/h-6.webp">
<style>${CSS}</style>
</head>
<body>
${dzIntroSolo(l)}
${LOGO_G}
<header class="top"><div class="top-in glass">
${LOGO(l, "")}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}"><a href="#choose">${t("Что посмотреть", "Nimani ko‘rish")}</a><a href="#try">${t("Как проверить", "Qanday tekshirish")}</a><a href="#offer">${t("Стоимость", "Narxi")}</a><a href="#it">${t("Поддержка", "Qo‘llab-quvvatlash")}</a></nav>
${langs(l, "")}
<a class="btn btn-g btn-s" href="${href(l, "site")}">${t("Сайт", "Sayt")}</a>
<a class="btn btn-a btn-s" aria-label="${t("Админка", "Admin panel")}" href="${href(l, "panel")}">${ICON.panel}</a>
</div></header>
<main>
<section class="hs" id="fly" aria-label="${t("Залёт в знак Agora", "Agora belgisiga uchib kirish")}"><div class="hs-st">
<div class="fl-mark"><svg viewBox="0 0 ${LOGO_VB[0]} ${LOGO_VB[1]}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="AGORA Lounge &amp; bar"><use href="#ag-g"/></svg></div>
<div class="fl-top"><p class="kick"><i></i>${t("Макет DevUz Studio для Agora", "Agora uchun DevUz Studio maketi")}<i></i></p><p>${t("Листайте: камера войдёт в красную чашу вашего знака.", "Aylantiring: kamera belgingizdagi qizil kosaga kiradi.")}</p></div>
<div class="fl-iris" aria-hidden="true"><img src="${IMG}/h-6.webp" width="1680" height="958" alt=""></div>
<div class="fl-shade" aria-hidden="true"></div>
<div class="wrap fl-tx"><p class="kick"><i></i>Lounge &amp; bar · ${esc(BRAND[l].street)}</p>
<h1>${t("Вечер в <em>AGORA</em> начинается с сайта", "<em>AGORA</em>’dagi kech saytdan boshlanadi")}</h1>
<p class="lead">${t("Меню с ценами, бронь в два касания, бот, который отвечает ночью, и панель, где всё это видно.", "Narxli menyu, ikki bosishda bron, kechasi javob beradigan bot va bularning hammasi ko‘rinadigan panel.")}</p>
<a class="btn btn-a" href="#choose">${t("Смотреть макет", "Maketni ko‘rish")}${ICON.arrow}</a></div>
<div class="hs-hint" aria-hidden="true"><span>${t("Листайте", "Aylantiring")}</span><i></i></div>
</div></section>
<section class="sec" id="choose"><div class="wrap">
<p class="kick rise"><i></i>${t("Сайт, панель и бот на ваших данных", "Ma’lumotlaringizdagi sayt, panel va bot")}</p>
<h2 class="h2 rise">${t("Что посмотреть <b>первым</b>", "Avval <b>nimani ko‘rish</b>")}</h2>
<p class="lead rise">${t("Это работающий макет на вашем меню из rezvo, ваших ценах и фото зала. Три части связаны: бронь с сайта и из бота приходит в панель, статус из панели видит гость.", "Bu rezvo’dagi menyuingiz, narxlaringiz va zal suratlaringizdagi ishlaydigan maket. Uch qism bog‘langan: sayt va botdan bron panelga keladi, paneldagi holatni mehmon ko‘radi.")}</p>
<div class="choices">
<a class="choice rise" href="${href(l, "site")}"><span class="ch-k">${t("Для гостей", "Mehmonlar uchun")}</span><b>${t("Сайт", "Sayt")}</b>
<span class="ch-pic"><img src="${IMG}/h-2-s.webp" width="960" height="547" alt="${t("Веранда Agora вечером, гирлянды над столами", "Kechqurun Agora ayvoni, stollar ustida chiroqlar")}" loading="lazy"></span>
${li(site)}<span class="btn btn-a">${t("Открыть сайт", "Saytni ochish")}${ICON.arrow}</span></a>
<a class="choice rise" href="${href(l, "panel")}"><span class="ch-k">${t("Для вас и смены", "Siz va smena uchun")}</span><b>${t("Панель ресторана", "Restoran paneli")}</b>
<span class="ch-pic"><img src="${IMG}/h-5-s.webp" width="960" height="547" alt="${t("Бар Agora", "Agora bari")}" loading="lazy"></span>
${li(pan)}<span class="btn btn-g">${t("Открыть панель", "Panelni ochish")}${ICON.arrow}</span></a>
<a class="choice rise" href="${href(l, "site")}#bot"><span class="ch-k">${t("Доп: Telegram-бот с ИИ", "Qo‘shimcha: sun’iy intellektli Telegram-bot")}</span><b>${t("Бот", "Bot")}</b>
<span class="ch-pic"><img src="${IMG}/h-9-s.webp" width="960" height="547" alt="${t("Большой стол гостей в зале Agora", "Agora zalida mehmonlarning katta stoli")}" loading="lazy"></span>
${li(bot)}<span class="btn btn-g">${t("Смотреть переписку", "Yozishmani ko‘rish")}${ICON.arrow}</span></a>
</div>
</div></section>
<section class="sec alt" id="try"><div class="wrap">
<p class="kick rise"><i></i>${t("Как проверить за минуту", "Bir daqiqada qanday tekshirish")}</p>
<h2 class="h2 rise">${t("Сайт и панель <b>связаны</b>", "Sayt va panel <b>bog‘langan</b>")}</h2>
<ol class="ol">${steps.map((s) => `<li class="rise">${s}</li>`).join("")}</ol>
<div class="hero-act rise"><a class="btn btn-a" href="${href(l, "site")}#book">${t("Начать с брони", "Brondan boshlash")}${ICON.arrow}</a></div>
</div></section>
${offer(l, t)}
</main>
${footer(l, t, "")}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="ag-land">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<script>
${LAND_JS}</script>
</body>
</html>`;
}

/* ── Панель: вход, «стекло» V7 + CRM ──────────────────────────── */
(function checkDict() {
  const keys = new Set([...PANEL_JS.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  for (const k of ["tab_", "src_", "tag_", "dlv_"]) keys.delete(k);
  for (const k of ["tab_sum", "tab_book", "tab_ord", "tab_bot", "tab_menu", "tab_log", "tab_dlv", "tab_set", "tag_hit", "tag_new", "dlv_min", "dlv_free", "src_site", "src_bot", "src_call", "src_ig", "o_acc_do", "o_cook_do", "o_ready_do", "o_done_do"]) keys.add(k);
  for (const k of keys) {
    const v = PANEL_UI[k];
    if (!v || v.length !== 2 || v.some((x) => !x)) throw new Error(`panel: нет подписи «${k}» на двух языках`);
    if (/[А-Яа-яЁё]/.test(v[1])) throw new Error(`panel: кириллица в узбекской подписи «${k}»`);
  }
  if (/[А-Яа-яЁё]/.test(PANEL_JS + PANEL_CSS)) throw new Error("panel: кириллица в коде панели");
})();

function panelPage(l) {
  const t = T(l);
  const ui = Object.fromEntries(Object.entries(PANEL_UI).map(([k, v]) => [k, v[l === "ru" ? 0 : 1]]));
  const pd = {
    l, sum: l === "ru" ? "сум" : "so‘m", site: href(l, "site"), home: href(l), img: IMG, ui,
    menu: MENU.map((m) => [m.id, m.cat, nm(m, l), m.price, m.ph]),
    cats: CATS.map((c) => [c.id, c[l], c.g]),
    street: BRAND[l].street, set0: set0(l, t), times: TIMES,
    /* Демо-гости и адреса доставки: часть имён — ловушки, при показе свои у клиента. */
    names: l === "ru" ? ["Азиз", "Мадина", "Тимур", "Камола", "Сардор", "Нигора", "Рустам", "Дилноза", "Бобур", "Лола", "Жасур", "Севара"] : ["Aziz", "Madina", "Timur", "Kamola", "Sardor", "Nigora", "Rustam", "Dilnoza", "Bobur", "Lola", "Jasur", "Sevara"],
    corp: l === "ru" ? "Банкет «[[t:0]] Group»" : "«[[t:0]] Group» banketi",
    addr: l === "ru" ? "ул. [[t:1]], 14" : "[[t:1]] ko‘chasi, 14",
  };
  return `${head(l, t("Панель Agora · демо", "Agora paneli · demo"), t("Панель Agora: брони и заказы с сайта и из бота, стоп-лист, роли, история, выгрузки. Демо-данные.", "Agora paneli: sayt va botdan bronlar va buyurtmalar, stop-list, rollar, tarix, yuklab olish. Demo ma’lumotlar."))}
<style>${CSS}${PANEL_CSS}</style>
</head>
<body class="pn">
${LOGO_G}
<div class="pn-bg" aria-hidden="true"><img src="${IMG}/h-8-b.webp" alt="" width="640" height="365"></div>
<div id="app"></div>
<footer class="pn-foot">${t("Макет DevUz Studio, демо-данные. Пользуясь макетом, вы принимаете", "DevUz Studio maketi, demo ma’lumotlar. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
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
  const lang = k.startsWith("uz") ? "uz" : "ru";
  if (lang === "uz") {
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

/* Сборка для сервера (lib/proto/bundles): стили, скрипты и знак один раз. */
const parts = { J: `<script>\n${JS}</script>`, C: `<style>${CSS}</style>`, PJ: `<script>\n${PANEL_JS}</script>`, LJ: `<script>\n${LAND_JS}</script>`, G: LOGO_G };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const [name, part] of Object.entries(parts)) p = p.split(part).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "agora.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(10), v.length);
