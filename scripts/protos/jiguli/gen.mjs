import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import * as D from "./data.mjs";
import { BASE, ADDONS, ALL, OFFER_HOURS } from "./plan.mjs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";

/*
 * Макет сайта «Жигули Рестобар» (Ташкент, ул. Султанали Машхади, 74), русский
 * (главная, "") и узбекский ("uz"):
 *  - видео DevUz (dzIntroSolo), за ним их кино по прокрутке на canvas, как на
 *    страницах Apple: нарисованная заставка в духе советского мультфильма 80-х
 *    по их залу (шахматная стойка, витраж, «копейка» на антресоли), их буквы
 *    «Жигули» сверху; бармен открывает кран, камера подходит к струе, экран
 *    темнеет, и прокрутка идёт вниз по струе до бокала с пеной (кадры s/*.webp);
 *  - две позиции бара и два блюда «замороженным мгновением»: кадр 4K, слои с
 *    параллаксом, капли, лёд и пар кодом; прокрутка — это время: листаете,
 *    капли и пар движутся, остановились — мгновение замерло. Блик идёт за
 *    пальцем или курсором. «Всё меню» — списком, поесть и попить, с ценами;
 *  - акции, бронь в два нажатия (SMS бару с готовым текстом), звонок, адрес и
 *    часы, Instagram, «Сейчас и станет», стоимость с отсчётом 48 часов.
 * Факты — data.mjs и menu-src.json (их меню); кадры сняты нейросетью по их
 * фото (README, SOURCES.md). Название «Жигули» — вектор по их логотипу
 * (logo-word.svg, logo-sub.svg). Ссылки — через __PROTO_BASE__, отпечаток
 * ставится при показе зерном из protos.stamp (lib/proto/bundles). Модель
 * макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/jiguli";
const PUB = new URL("../../../public", import.meta.url).pathname;
const BASEP = "__PROTO_BASE__";
const B = D.BRAND;
const FONTS = "https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&display=swap";
const read = (f) => readFileSync(DIR + f, "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => grp(n) + " $";
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const MEDIA = JSON.parse(read("media.json"));
const MENU = JSON.parse(read("menu-src.json"));
const nm = (l) => (l === "uz" ? B.nameUz : B.name);
const href = (l, path = "") => BASEP + (l === "uz" ? "/uz" : "") + (path ? "/" + path : "");

/* Их буквы: контуры, обведённые с логотипа на их сайте (static/images/Jiguli.png). */
const svgOf = (f) => { const s = read(f); return { vb: /viewBox="([^"]+)"/.exec(s)[1], d: /\sd="([^"]+)"/.exec(s)[1] }; };
const WORD = svgOf("logo-word.svg"), SUB = svgOf("logo-sub.svg");
const word = (cls = "", label = "") => `<svg class="jw ${cls}" viewBox="${WORD.vb}"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}><use href="#jg-word"/></svg>`;
const sub = (cls = "") => `<svg class="js ${cls}" viewBox="${SUB.vb}" aria-hidden="true"><use href="#jg-sub"/></svg>`;

/* ── Тексты: ru и uz ─────────────────────────────────────────────────── */
const T = {
  ru: {
    title: "Жигули Рестобар, Ташкент: разливное пиво, раки и бронь столика · макет DevUz Studio",
    desc: "Жигули Рестобар в Ташкенте, ул. Султанали Машхади, 74: разливное пиво, коктейли, раки к пиву и мангал. Меню с ценами, акции, бронь столика, каждый день 12:00-02:00.",
    skip: "К содержанию", nav: [["#menu", "Меню"], ["#akcii", "Акции"], ["#bron", "Бронь"], ["#kontakty", "Как найти"]],
    lang: "UZ", langName: "O‘zbekcha", home: "на главную",
    sum: "сум", book: "Забронировать стол", call: "Позвонить", callBar: "Позвонить в бар",
    heroKick: "Ташкент · Султанали Машхади, 74",
    heroLead: "Пивной ресторан с советской душой. Листайте: бармен уже у крана.",
    heroCue: "Листайте",
    ch: [
      { a: .14, b: .34, k: "Шахматная стойка, витраж, «копейка» на антресоли", t: "Узнаёте? Это наш зал." },
      { a: .44, b: .6, k: "Дальше только пиво", t: "Листайте медленно. Пиво не любит спешки." },
      { a: .86, b: 1.4, k: "Жатецкое живое · 0,5 л", t: "Налито. Теперь к столу." },
    ],
    film: "Кадры нарисованы и сняты нейросетью по фото вашего зала",
    menuKick: "Меню", menuH: "Пара напитков и пара блюд. Остальное в списке.",
    menuP: "Мгновение, пойманное на 1/8000 секунды. Листайте: время идёт. Остановились: замерло. Ведите пальцем, и по стеклу пойдёт блик.",
    full: "Всё меню", fullP: "поесть и попить, с ценами", eat: "Поесть", drink: "Попить", close: "Закрыть",
    fullNote: `Цены в сумах, с их меню на сайте. Обслуживание ${B.service}%, со своим алкоголем ${B.corkage}%.`,
    akKick: "Акции", akH: "Поводы зайти ещё раз", akP: "С их страницы акций. Акции между собой не складываются.",
    bronKick: "Бронь", bronH: "Стол на вечер в два нажатия", bronP: "Выберите день и сколько вас. Сообщение с готовым текстом откроется у вас, отправляете вы, администратор подтвердит.",
    day: ["Сегодня", "Завтра", "Пятница", "Суббота"], guests: ["2", "4", "6", "8+"], guestsW: "гостей",
    when: "Когда", who: "Сколько вас", send: "Забронировать", sms: (d, g) => `Здравствуйте! Хочу забронировать стол в Жигули: ${d}, гостей: ${g}.`,
    bkGo: (d, g) => `Бронь: ${d}, ${g}`,
    bkNote: `Или позвоните: ${B.phone}. Доставка: ${B.delivery}.`,
    ctKick: "Как найти", ctH: "Султанали Машхади, 74", route: "Маршрут в Яндекс Картах", ig: "Instagram", tg: "Telegram-канал",
    rating: `${B.rating} на Яндекс Картах · ${B.votes} оценок`,
    nowKick: "Разбор DevUz Studio", nowH: "Сейчас и станет", nowA: "Сейчас на jigulibar.uz", nowB: "Станет",
    age: "Вам уже есть 18?", ageP: "На сайте бара есть пиво и коктейли. Покажем их только взрослым.", ageYes: "Да, мне 18+", ageNo: "Мне нет 18",
    ageBye: "Тогда приходите с родителями: морсы и лимонады у нас тоже вкусные.",
    warn: "Чрезмерное употребление алкоголя вредит вашему здоровью. 18+",
    offKick: "Предложение DevUz Studio", offH: "Стоимость",
    offP: `Сайт без допов: ${usd(BASE.promo)} вместо ${usd(BASE.price)}, если начинаем в течение 48 часов. Остальное включайте тумблерами, итог пересчитается. Всё вместе: ${usd(ALL)}.`,
    always: "Входит всегда", term: (a, b) => `Срок: ${a}-${b} недель`, addG: "Допы: включайте то, что нужно бару",
    star: "берут первым", nw: "нет у баров Ташкента", act: (h) => `Цена ${usd(BASE.promo)} действует`, actS: "48 часов с первого открытия макета",
    site: "Сайт", adds: "Допы", total: "Итого", withAll: `со всеми допами ${usd(ALL)}`, allOn: "Включить всё", talk: "Обсудить с DevUz Studio", copy: "Скопировать состав",
    src: "Тарифы SMS, оплаты и хостинга бар оплачивает сам. Цены допов по образцу, подтвердите.",
    head: "Сайт «Жигули Рестобар», состав:", copied: "Скопировано", ended: "Акция закончилась, цена обычная",
    footD: "Данные макета", footL: ["Меню, цены, акции, телефон: jigulibar.uz", "Адрес, часы, Instagram, оценка: Яндекс Карты", "Заставка нарисована, кадры меню сняты нейросетью по их фото"],
    mock: "Это макет: так может выглядеть сайт «Жигули Рестобар». Сайт носит информационный характер и не является публичной офертой.",
    terms: "Условия использования макета",
  },
  uz: {
    title: "Jiguli Restobar, Toshkent: quyma pivo, qisqichbaqa va stol bron qilish · DevUz Studio maketi",
    desc: "Toshkentdagi Jiguli Restobar, Sultonali Mashhadiy ko‘chasi, 74: quyma pivo, kokteyllar, pivoga qisqichbaqa va mangal. Narxli menyu, aksiyalar, stol bron qilish, har kuni 12:00-02:00.",
    skip: "Mazmunga o‘tish", nav: [["#menu", "Menyu"], ["#akcii", "Aksiyalar"], ["#bron", "Bron"], ["#kontakty", "Qanday topish"]],
    lang: "RU", langName: "Ruscha", home: "bosh sahifaga",
    sum: "so‘m", book: "Stol bron qilish", call: "Qo‘ng‘iroq", callBar: "Barga qo‘ng‘iroq",
    heroKick: "Toshkent · Sultonali Mashhadiy, 74",
    heroLead: "Sovet ruhidagi pivo restorani. Aylantiring: barmen allaqachon kran yonida.",
    heroCue: "Aylantiring",
    ch: [
      { a: .14, b: .34, k: "Shaxmat peshtaxta, vitraj, antresoldagi «kopeyka»", t: "Tanidingizmi? Bu bizning zal." },
      { a: .44, b: .6, k: "Endi faqat pivo", t: "Sekin aylantiring. Pivo shoshilishni yoqtirmaydi." },
      { a: .86, b: 1.4, k: "Jatetskoe jivoe · 0,5 l", t: "Quyildi. Endi stolga." },
    ],
    film: "Kadrlar zalingiz rasmlari bo‘yicha chizilgan va neyrotarmoqda olingan",
    menuKick: "Menyu", menuH: "Ikki ichimlik va ikki taom. Qolgani ro‘yxatda.",
    menuP: "Soniyaning 1/8000 ulushida tutilgan lahza. Aylantiring: vaqt yuradi. To‘xtadingiz: qotib qoldi. Barmog‘ingizni yurgizing, shisha bo‘ylab yaltiroq yuradi.",
    full: "Butun menyu", fullP: "taomlar va ichimliklar, narxlari bilan", eat: "Taomlar", drink: "Ichimliklar", close: "Yopish",
    fullNote: `Narxlar so‘mda, saytidagi menyudan. Xizmat ${B.service}%, o‘z spirtli ichimligingiz bilan ${B.corkage}%.`,
    akKick: "Aksiyalar", akH: "Yana kelish uchun sabablar", akP: "Aksiyalar sahifasidan. Aksiyalar o‘zaro qo‘shilmaydi.",
    bronKick: "Bron", bronH: "Kechqurunga stol ikki bosishda", bronP: "Kunni va necha kishi ekaningizni tanlang. Tayyor matnli xabar sizda ochiladi, siz yuborasiz, administrator tasdiqlaydi.",
    day: ["Bugun", "Ertaga", "Juma", "Shanba"], guests: ["2", "4", "6", "8+"], guestsW: "mehmon",
    when: "Qachon", who: "Necha kishi", send: "Bron qilish", sms: (d, g) => `Assalomu alaykum! Jiguli’da stol bron qilmoqchiman: ${d}, mehmonlar: ${g}.`,
    bkGo: (d, g) => `Bron: ${d}, ${g}`,
    bkNote: `Yoki qo‘ng‘iroq qiling: ${B.phone}. Yetkazib berish: ${B.delivery}.`,
    ctKick: "Qanday topish", ctH: "Sultonali Mashhadiy, 74", route: "Yandex Xaritalarda yo‘nalish", ig: "Instagram", tg: "Telegram-kanal",
    rating: `Yandex Xaritalarda ${B.rating} · ${B.votes} baho`,
    nowKick: "DevUz Studio tahlili", nowH: "Hozir va bo‘ladi", nowA: "Hozir jigulibar.uz’da", nowB: "Bo‘ladi",
    age: "Sizga 18 yosh to‘lganmi?", ageP: "Bar saytida pivo va kokteyllar bor. Ularni faqat kattalarga ko‘rsatamiz.", ageYes: "Ha, 18+", ageNo: "18 yoshga to‘lmaganman",
    ageBye: "Unda ota-onangiz bilan keling: bizning mors va limonadlar ham mazali.",
    warn: "Spirtli ichimliklarni haddan tashqari iste’mol qilish sog‘lig‘ingizga zarar. 18+",
    offKick: "DevUz Studio taklifi", offH: "Narxi",
    offP: `Qo‘shimchalarsiz sayt: 48 soat ichida boshlasak, ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}. Qolganini tugmalar bilan yoqing, jami qayta hisoblanadi. Hammasi birga: ${usd(ALL)}.`,
    always: "Doim kiradi", term: (a, b) => `Muddat: ${a}-${b} hafta`, addG: "Qo‘shimchalar: barga keraklisini yoqing",
    star: "birinchi olinadi", nw: "Toshkent barlarida yo‘q", act: () => `${usd(BASE.promo)} narx amal qiladi`, actS: "maket birinchi ochilgandan 48 soat",
    site: "Sayt", adds: "Qo‘shimchalar", total: "Jami", withAll: `barcha qo‘shimchalar bilan ${usd(ALL)}`, allOn: "Hammasini yoqish", talk: "DevUz Studio bilan muhokama", copy: "Tarkibni nusxalash",
    src: "SMS, to‘lov va xosting tariflarini bar o‘zi to‘laydi. Qo‘shimchalar narxi namuna bo‘yicha, tasdiqlang.",
    head: "«Jiguli Restobar» sayti, tarkibi:", copied: "Nusxalandi", ended: "Aksiya tugadi, narx odatiy",
    footD: "Maket ma’lumotlari", footL: ["Menyu, narxlar, aksiyalar, telefon: jigulibar.uz", "Manzil, ish vaqti, Instagram, baho: Yandex Xaritalar", "Muqova chizilgan, menyu kadrlari ularning rasmlari bo‘yicha neyrotarmoqda olingan"],
    mock: "Bu maket: «Jiguli Restobar» sayti shunday ko‘rinishi mumkin. Sayt ma’lumot uchun va ommaviy oferta emas.",
    terms: "Maketdan foydalanish shartlari",
  },
};

/* ── Иконки: контуры 24×24 ───────────────────────────────────────────── */
const S = 'fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  arrow: `<path d="M5 12h14M13 6l6 6-6 6" ${S}/>`,
  down: `<path d="M12 5v14M6 13l6 6 6-6" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  phone: `<path d="M5 4.5h3.5l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" ${S}/>`,
  msg: `<path d="M4 5.5h16v11H9l-5 3.5z" ${S}/><path d="M8 10h8M8 13h5" ${S}/>`,
  pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${S}/><circle cx="12" cy="10" r="2.4" ${S}/>`,
  clock: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 7.5V12l3 2" ${S}/>`,
  star: `<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" ${S}/>`,
  ig: `<rect x="4" y="4" width="16" height="16" rx="4.5" ${S}/><circle cx="12" cy="12" r="3.6" ${S}/><circle cx="16.8" cy="7.2" r=".6" ${S}/>`,
  tg: `<path d="M21 4 3 11l6 2 2 6 3-4 5 4z" ${S}/><path d="m9 13 9-7" ${S}/>`,
  list: `<path d="M8 6.5h12M8 12h12M8 17.5h12" ${S}/><circle cx="4.5" cy="6.5" r=".8" ${S}/><circle cx="4.5" cy="12" r=".8" ${S}/><circle cx="4.5" cy="17.5" r=".8" ${S}/>`,
  mug: `<path d="M5 7h10v11.5A1.5 1.5 0 0 1 13.5 20h-7A1.5 1.5 0 0 1 5 18.5z" ${S}/><path d="M15 9.5h2a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2h-2M5 7c0-2 1.5-3 3-3 1 0 1.5.5 2 .5s1.2-.8 2.5-.8C14 3.7 15 5 15 7" ${S}/>`,
  copy: `<rect x="8" y="8" width="12" height="12" rx="2" ${S}/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" ${S}/>`,
};
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
  .join("")}<symbol id="jg-word" viewBox="${WORD.vb}"><path fill="currentColor" fill-rule="evenodd" d="${WORD.d}"/></symbol><symbol id="jg-sub" viewBox="${SUB.vb}"><path fill="currentColor" fill-rule="evenodd" d="${SUB.d}"/></symbol></defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;
const tel = `tel:${B.phoneRaw}`;
const sms = (body) => `sms:${B.phoneRaw}?&body=${encodeURIComponent(body)}`;

function headTags(l) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${T[l].title}</title>
<meta name="description" content="${esc(T[l].desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#120c08">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="preload" as="image" href="${IMG}/s/000.webp">`;
}

const head = (kick, h, p = "", cls = "") => `<div class="sh ${cls}"><span class="kick">${kick}</span><h2>${h}</h2>${p ? `<p>${p}</p>` : ""}</div>`;

/* ── Кино по прокрутке ─────────────────────────────────────────────── */
function storyBlock(l) {
  const t = T[l];
  return `<section class="story" id="story" aria-label="${nm(l)}">
<div class="stage" id="stage">
<div class="st-bg" aria-hidden="true"><img src="${IMG}/poster-16.webp" alt="" width="1280" height="720"></div>
<div class="st-fr" id="fr"><canvas id="cv" aria-hidden="true"></canvas><img class="st-calm" src="${IMG}/poster-9.webp" alt="${l === "uz" ? "Barmen shaxmat peshtaxta ortida, sovet multfilmi uslubida chizilgan" : "Бармен за шахматной стойкой, нарисовано в духе советского мультфильма"}" width="1080" height="1935"><canvas id="bub" aria-hidden="true"></canvas><div class="grain" aria-hidden="true"></div><div class="st-mark" aria-hidden="true">${word()}${sub()}</div></div>
<div class="hero" id="hero">
<h1 class="hero-w">${word("", nm(l))}<span class="visually">${nm(l)}</span>${sub()}</h1>
<div class="hero-b"><span class="kick">${t.heroKick}</span><p class="lead">${t.heroLead}</p></div>
</div>
<span class="cue" aria-hidden="true">${ic("down")}<span>${t.heroCue}</span></span>
${t.ch.map((c, i) => `<div class="ch ch-${i}" id="ch${i}" data-a="${c.a}" data-b="${c.b}"><span class="kick">${c.k}</span><p class="ch-t">${c.t}</p></div>`).join("")}
<p class="st-note">${t.film}</p>
<div class="bar" aria-hidden="true"><i id="bar"></i></div>
</div>
</section>`;
}

/* ── Меню: замороженные мгновения ──────────────────────────────────── */
function heroesBlock(l) {
  const t = T[l];
  const one = (h, i) => `<article class="fz fz-${h.id}" id="fz-${h.id}" data-fx="${h.fx}">
<div class="fz-in">
<div class="fz-bg" aria-hidden="true"><img src="${IMG}/${h.img}-16.webp" alt="" width="960" height="540" loading="lazy" decoding="async"></div>
<div class="fz-fr"><div class="fz-img"><img src="${IMG}/${h.img}-9.webp" alt="${esc(h.alt[l])}" width="1080" height="1935" loading="${i ? "lazy" : "eager"}" decoding="async"></div><canvas class="fz-fx" aria-hidden="true"></canvas><div class="fz-glare" aria-hidden="true"></div></div>
<div class="fz-t">
<span class="kick">${String(i + 1).padStart(2, "0")} · ${h[l].kick}</span>
<h3>${h[l].t}</h3>
<p>${h[l].d}</p>
<p class="fz-p"><b>${h.price}</b><span>${t.sum} · ${h.unit[l]}</span>${h.more ? `<small>${h.more[l]}</small>` : ""}</p>
</div>
</div>
</article>`;
  return `<section class="menu" id="menu" aria-labelledby="menu-h">
<div class="wrap">${head(t.menuKick, `<span id="menu-h">${t.menuH}</span>`, t.menuP)}</div>
${D.HEROES.map(one).join("\n")}
<div class="wrap full-cta"><button type="button" class="btn btn-amber" id="full-open" aria-haspopup="dialog" aria-controls="full">${ic("list")}<span>${t.full}</span></button><span class="full-sub">${t.fullP}</span></div>
</section>`;
}

/* ── Всё меню: простым списком ─────────────────────────────────────── */
const price = (p) => p.map(grp).join(" / ");
/* Узбекская страница — без кириллицы: разделы по-узбекски, блюда — их же
   английским названием из меню, где его нет — латиницей. */
const CAT_UZ = {
  "Сезонные предложения": "Mavsumiy takliflar", "Новинки": "Yangiliklar", "Закуски к пиву": "Pivoga gazaklar", "Рыбный ларёк": "Baliq do‘koni",
  "Салаты": "Salatlar", "Холодные закуски": "Sovuq gazaklar", "Горячие закуски": "Issiq gazaklar", "Супы": "Sho‘rvalar", "Блюда для друзей": "Do‘stlar uchun taomlar",
  "Горячие блюда": "Issiq taomlar", "Стейки": "Steyklar", "Блюда WOK": "WOK taomlari", "Рыба": "Baliq", "Блюда по предзаказу": "Oldindan buyurtma taomlari",
  "Махаллинские шашлыки": "Mahalla shashliklari", "Мангал: сеты и шашлыки": "Mangal: setlar va shashliklar", "Гарниры": "Garnirlar", "Соусы": "Souslar", "Хлеб": "Non",
  "Десерты": "Desertlar", "Похмельные наборы": "«Pohmel» to‘plamlari", "Пиво разливное": "Quyma pivo", "Пиво бутылочное и баночное": "Shisha va bankadagi pivo",
  "Пивные коктейли": "Pivo kokteyllari", "Авторские коктейли": "Muallif kokteyllari", "Алкогольные коктейли": "Alkogolli kokteyllar", "Безалкогольные коктейли": "Alkogolsiz kokteyllar",
  "Сезонные предложения (напитки)": "Mavsumiy ichimliklar", "Лимонады домашние (графин)": "Uy limonadlari (grafin)", "Морсы и компоты": "Mors va kompotlar", "Свежевыжатые соки": "Yangi siqilgan sharbatlar",
  "Лимонады / напитки": "Limonadlar va ichimliklar", "Вода": "Suv", "Чай / кофе": "Choy va qahva", "Игристые и тихие вина": "Vinolar", "Настойки": "Nastoykalar", "Ликёры": "Likyorlar",
  "Биттер / вермут": "Bitter va vermut", "Теннесси виски": "Tennessi viski", "Бурбон": "Burbon", "Бренди": "Brendi", "Водка местная": "Mahalliy aroq", "Водка импортная": "Import aroq",
  "Коньяк": "Konyak", "Джин": "Jin", "Ром": "Rom", "Текила": "Tekila", "Виски шотландский купажированный": "Shotland viskisi", "Виски односолодовый": "Bir solodli viski",
  "Ирландский виски": "Irlandiya viskisi", "Закуски к пиву (бар)": "Pivoga gazaklar (bar)",
};
const TR = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya" };
const lat = (s) => s.replace(/[а-яё]/gi, (c) => { const r = TR[c.toLowerCase()] ?? ""; return c === c.toLowerCase() ? r : r.charAt(0).toUpperCase() + r.slice(1); });
const UNIT_UZ = [[/гр\.?/g, "g"], [/мл/g, "ml"], [/шт\.?/g, "dona"], [/на выходе/g, "tayyor holda"], [/порци[яи]/g, "porsiya"], [/шарик/g, "shar"], [/хлеб/g, "non"], [/(\d) ?л\b/g, "$1 l"], [/кг/g, "kg"]];
const unit = (s, l) => l === "uz" ? lat(UNIT_UZ.reduce((x, [a, b]) => x.replace(a, b), s)) : s.replace(/гр\.?/g, "г");
function fullSheet(l) {
  const t = T[l];
  const name = (it, c) => (l === "uz" ? (it.en && c.cat !== "Похмельные наборы" ? it.en : lat(it.ru)) : it.ru);
  const list = (cats) => cats.map((c) => `<h4>${l === "uz" ? CAT_UZ[c.cat] ?? lat(c.cat) : c.cat}</h4><ul>${c.items.map((it) => `<li><span>${esc(name(it, c))}${it.w || it.v ? ` <small>${esc(unit(it.w || it.v, l))}</small>` : ""}</span><b>${price(it.p)}</b></li>`).join("")}</ul>`).join("");
  return `<div class="sheet full" id="full" role="dialog" aria-modal="true" aria-labelledby="full-h" hidden>
<div class="sh-in">
<button type="button" class="sh-x" data-close aria-label="${t.close}">${ic("x")}</button>
<p class="sh-h" id="full-h">${t.full}</p>
<div class="tabs" role="tablist"><button type="button" role="tab" id="tb-eat" aria-selected="true" aria-controls="pn-eat">${t.eat}</button><button type="button" role="tab" id="tb-drink" aria-selected="false" aria-controls="pn-drink">${t.drink}</button></div>
<div class="pn" id="pn-eat" role="tabpanel" aria-labelledby="tb-eat">${list(MENU.food)}</div>
<div class="pn" id="pn-drink" role="tabpanel" aria-labelledby="tb-drink" hidden>${list(MENU.drinks)}</div>
<p class="sh-note">${t.fullNote}</p>
</div></div>`;
}

/* ── Акции ─────────────────────────────────────────────────────────── */
function promoBlock(l) {
  const t = T[l];
  return `<section class="ak" id="akcii"><div class="wrap">
${head(t.akKick, t.akH, t.akP)}
<div class="ak-g">${D.PROMOS.map((p, i) => `<article class="cp rv cp-${p.id}" style="--d:${i * 90}ms"><b class="cp-big">${p.big}</b><div><h3>${p[l].t}</h3><p>${p[l].d}</p></div></article>`).join("")}</div>
</div></section>`;
}

/* ── Бронь ─────────────────────────────────────────────────────────── */
function bronBlock(l) {
  const t = T[l];
  return `<section class="bron" id="bron"><div class="wrap bron-g">
${head(t.bronKick, t.bronH, t.bronP)}
<div class="bk rv" data-bk>${bookForm(l, "s")}</div>
</div></section>`;
}
function bookForm(l, id) {
  const t = T[l];
  return `<div class="bk-row"><span class="bk-l">${t.when}</span><div class="bk-g" role="group" aria-label="${t.when}">${t.day.map((d, i) => `<button type="button" class="chip" data-day="${d}" aria-pressed="${i === 0}">${d}</button>`).join("")}</div></div>
<div class="bk-row"><span class="bk-l">${t.who}</span><div class="bk-g" role="group" aria-label="${t.who}">${t.guests.map((g, i) => `<button type="button" class="chip" data-g="${g}" aria-pressed="${i === 1}">${g}</button>`).join("")}</div></div>
<a class="btn btn-amber bk-go" id="bk-go-${id}" href="${sms(t.sms(t.day[0], t.guests[1]))}">${ic("msg")}<span>${t.bkGo(t.day[0].toLowerCase(), t.guests[1] + " " + t.guestsW)}</span></a>
<a class="btn btn-line" href="${tel}">${ic("phone")}<span>${t.callBar}: ${B.phone}</span></a>
<p class="bk-note">${t.bkNote}</p>`;
}
function bookSheet(l) {
  const t = T[l];
  return `<div class="sheet" id="zapis" role="dialog" aria-modal="true" aria-labelledby="bk-h" hidden>
<div class="sh-in">
<button type="button" class="sh-x" data-close aria-label="${t.close}">${ic("x")}</button>
<p class="sh-h" id="bk-h">${t.bronH}</p>
<div data-bk>${bookForm(l, "m")}</div>
</div></div>`;
}

/* ── Как найти ─────────────────────────────────────────────────────── */
function contactsBlock(l) {
  const t = T[l], b = B[l];
  return `<section class="ct" id="kontakty"><div class="wrap ct-g">
<div class="ct-t rv">
<span class="kick">${t.ctKick}</span><h2>${t.ctH}</h2>
<ul>
<li>${ic("pin")}<span><b>${b.street}</b>${b.district}. ${b.near}.</span></li>
<li>${ic("clock")}<span><b>${b.hours}</b></span></li>
<li>${ic("phone")}<span><b><a href="${tel}">${B.phone}</a></b>${l === "uz" ? "yetkazib berish" : "доставка"}: <a href="tel:${B.deliveryRaw}">${B.delivery}</a></span></li>
<li>${ic("star")}<span><b>${t.rating}</b></span></li>
</ul>
<div class="ct-b"><a class="btn btn-amber" href="${B.route}">${ic("pin")}<span>${t.route}</span></a><a class="btn btn-line" href="${B.ig}">${ic("ig")}<span>${B.igName}</span></a><a class="btn btn-line" href="${B.tg}">${ic("tg")}<span>${t.tg}</span></a></div>
</div>
<a class="ct-map rv" href="${B.map}" aria-label="${t.route}">${mapArt()}<span class="ct-pin">${ic("pin")}</span></a>
</div></section>`;
}
/* Карта рисуется кодом: кварталы, улица и точка, без чужих тайлов. */
function mapArt() {
  return `<svg viewBox="0 0 400 300" aria-hidden="true"><rect width="400" height="300" class="m-bg"/><g class="m-bl">${[[20, 20, 110, 70], [150, 20, 90, 70], [270, 20, 110, 70], [20, 120, 80, 60], [130, 120, 120, 60], [280, 120, 100, 60], [20, 210, 150, 70], [200, 210, 70, 70], [300, 210, 80, 70]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`).join("")}</g><path class="m-rd" d="M0 104h400M0 196h400M120 0v300M262 0v300"/><path class="m-main" d="M-10 104C120 98 260 108 410 104"/></svg>`;
}

/* ── Сейчас и станет ───────────────────────────────────────────────── */
function nowBlock(l) {
  const t = T[l];
  return `<section class="now" id="seychas"><div class="wrap">
${head(`<span class="ours">${t.nowKick}</span>`, t.nowH)}
<div class="now-g"><div class="now-h"><span>${t.nowA}</span><span>${t.nowB}</span></div>${D.NOW.map((r, i) => `<div class="now-r rv" style="--d:${i * 70}ms"><p class="now-a">${r[l][0]}</p>${ic("arrow", "now-ar")}<p class="now-b">${r[l][1]}</p></div>`).join("")}</div>
</div></section>`;
}

/* ── Стоимость (предложение DevUz) ───────────────────────────────── */
function offerBlock(l) {
  const t = T[l];
  const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}"><span class="sw" aria-hidden="true"></span><span class="kit-t2"><b>${a[l].t}${a.star ? `<em class="star">${t.star}</em>` : ""}${a.new ? `<em class="nw-t">${t.nw}</em>` : ""}</b><small>${a[l].e}</small></span><span class="kit-pr">+${usd(a.price)}</span></label>`;
  return `<section class="offer" id="stoimost"><div class="wrap">
${head(`<span class="ours">${t.offKick}</span>`, t.offH, t.offP)}
<div class="kit" id="konstruktor">
<div class="kit-l">
<div class="kit-base"><div><span class="kb-tag">${t.always}</span><b>${BASE[l].t}</b><p>${BASE[l].d}</p><p class="kb-w">${t.term(...BASE.weeks)}</p></div><div class="kb-p"><s>${usd(BASE.price)}</s><b>${usd(BASE.promo)}</b><small>48 ${l === "uz" ? "soat" : "часов"}</small></div></div>
<h3 class="kit-g">${t.addG}</h3>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side">
<div class="kit-total" id="kit-total">
<div class="timer" id="timer"><span>${t.act()}<small>${t.actS}</small></span><b id="tm">48:00:00</b></div>
<div class="kt-line"><span>${t.site}</span><span><s>${usd(BASE.price)}</s> ${usd(BASE.promo)}</span></div>
<div class="kt-line"><span>${t.adds} · <span id="kit-cnt">0</span></span><span id="kit-add">0 $</span></div>
<div class="kt-sum"><small>${t.total}</small><b id="kit-sum">${usd(BASE.promo)}</b><small>${t.withAll}</small></div>
<button type="button" class="btn btn-line" id="kit-all">${t.allOn}</button>
<a class="btn btn-amber" href="https://t.me/Devuz_studio_bot?start=jiguli">${ic("tg")}<span>${t.talk}</span></a>
<button type="button" class="copy" id="kit-copy">${ic("copy")}<span>${t.copy}</span></button>
</div>
<p class="src">${t.src}</p>
</div>
</div>
</div></section>`;
}

/* ── 18+: подставка под кружку ─────────────────────────────────────── */
function ageGate(l) {
  const t = T[l];
  return `<div class="age" id="age" role="dialog" aria-modal="true" aria-labelledby="age-h" hidden>
<div class="age-c">
${word("age-w")}
<p class="age-h" id="age-h">${t.age}</p>
<p class="age-p" id="age-p">${t.ageP}</p>
<div class="age-b"><button type="button" class="btn btn-amber" id="age-yes">${t.ageYes}</button><button type="button" class="btn btn-line" id="age-no">${t.ageNo}</button></div>
</div></div>`;
}

function ld(l) {
  return {
    "@context": "https://schema.org", "@type": ["BarOrPub", "Restaurant"], name: l === "uz" ? B.nameUz : B.name, url: B.site, telephone: B.phoneRaw,
    address: { "@type": "PostalAddress", streetAddress: B[l].street, addressLocality: l === "uz" ? "Toshkent" : "Ташкент", postalCode: "100007", addressCountry: "UZ" },
    geo: { "@type": "GeoCoordinates", latitude: B.geo[0], longitude: B.geo[1] },
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "12:00", closes: "02:00" }],
    servesCuisine: l === "uz" ? ["Rus", "Pivo restorani"] : ["Русская", "Пивной ресторан"], acceptsReservations: true, sameAs: [B.ig, B.tg],
    hasMenu: { "@type": "Menu", hasMenuSection: D.HEROES.map((h) => ({ "@type": "MenuItem", name: h[l].t, offers: { "@type": "Offer", price: h.price.replace(/\s/g, ""), priceCurrency: "UZS" } })) },
  };
}

function siteData(l) {
  const t = T[l];
  return {
    l, img: IMG, frames: MEDIA, chapters: t.ch.map((c, i) => ({ id: "ch" + i, a: c.a, b: c.b })), phone: B.phoneRaw,
    bk: { sms: t.sms("@D", "@G"), go: t.bkGo("@D", "@G"), w: t.guestsW }, bye: t.ageBye,
    offer: { items: ADDONS.map((a) => ({ id: a.id, t: a[l].t, p: a.price })), base: BASE.promo, baseName: BASE[l].t, hours: OFFER_HOURS, head: t.head, totalW: t.total, copied: t.copied, ended: t.ended },
  };
}

function page(l) {
  const t = T[l], other = l === "uz" ? "ru" : "uz";
  return `<!doctype html>
<html lang="${l}">
<head>
${headTags(l)}
<script>(function(){var r=document.documentElement;r.classList.add('js');var calm=false;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)calm=true}catch(e){}try{var c=navigator.connection;if(c&&c.saveData)calm=true}catch(e){}if(calm)r.classList.add('calm');try{if(localStorage.getItem('jg-18')!=='1')r.classList.add('ask18')}catch(e){r.classList.add('ask18')}})()</script>
<script type="application/ld+json">${json(ld(l))}</script>
@@S@@
</head>
<body class="site">
${dzIntroSolo(l)}
${sprite()}
<a class="skip" href="#main">${t.skip}</a>
<header class="top" id="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="${nm(l)}, ${t.home}">${word()}${sub()}</a>
<nav class="nav" aria-label="${l === "uz" ? "Bo‘limlar" : "Разделы"}">${t.nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
<div class="top-r"><a class="lang" href="${href(other)}" hreflang="${other}" aria-label="${t.langName}">${t.lang}</a><a class="top-ph" href="${tel}" aria-label="${t.callBar}">${ic("phone")}<span>${B.phone}</span></a><a class="btn btn-sm btn-amber" href="#bron" data-book>${t.book}</a></div>
</div></header>
<main id="main">
${[storyBlock(l), heroesBlock(l), promoBlock(l), bronBlock(l), contactsBlock(l), nowBlock(l), offerBlock(l)].join("\n")}
</main>
<footer class="foot"><div class="wrap">
<div class="cols">
<div>${word("f-w")}${sub("f-s")}<p class="f-d">${B[l].street}, ${l === "uz" ? "Toshkent" : "Ташкент"}. ${B[l].hours}.</p><ul class="f-c"><li>${ic("phone")}<a href="${tel}">${B.phone}</a></li><li>${ic("ig")}<a href="${B.ig}">${B.igName}</a></li><li>${ic("tg")}<a href="${B.tg}">t.me/jiguli_bar</a></li></ul></div>
<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=jiguli">Telegram</a></li></ul></div>
<div><b>${t.footD}</b><ul>${t.footL.map((x) => `<li>${x}</li>`).join("")}</ul></div>
</div>
<p class="warn">${t.warn}</p>
<div class="rights"><span>${t.mock}</span><a href="https://devuz.studio/${l}/mockup-terms">${t.terms}</a></div>
</div></footer>
<div class="dock" id="dock"><a class="btn btn-amber" href="#bron" data-book>${ic("mug")}<span>${t.book}</span></a><a class="btn btn-call" href="${tel}" aria-label="${t.callBar}">${ic("phone")}</a></div>
${bookSheet(l)}
${fullSheet(l)}
${ageGate(l)}
<script type="application/json" id="jg-site">${json(siteData(l))}</script>
<script src="${IMG}/gsap.min.js"></script>
<script src="${IMG}/ScrollTrigger.min.js"></script>
@@J@@
</body>
</html>`;
}

const out = { "": page("ru"), uz: page("uz") };
const parts = {
  S: `<style>${min(read("site.css"))}</style>`,
  J: `<script>\n${strip(read("site.js"))}</script>`,
};
const fill = (p) => Object.entries(parts).reduce((s, [n, part]) => s.split(`@@${n}@@`).join(part), p);

for (const v of Object.values(out)) for (const m of fill(v).matchAll(/\/protos\/jiguli\/[\w./-]+\.(?:webp|png|js|mp4)/g)) if (!existsSync(PUB + m[0])) console.warn("нет файла", m[0]);
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "jiguli.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(8), fill(v).length);
