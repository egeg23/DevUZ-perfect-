import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

/*
 * Макет главной vTashkente (vtashkente.uz): авторские кухни на заказ в
 * Ташкенте. Одна страница для презентации, на двух языках (ru, uz), из
 * полноэкранных секций, у каждой свой приём:
 *
 *   0. заставка: промо DevUz Studio, затем их знак: круг, галочка V,
 *      и камера влетает в круг на первый экран;
 *   1. первый экран: их кухни сменяют друг друга во весь экран, слово в
 *      плашке перебирает их же «Проектируем, Рисуем, Производим…»;
 *   2. кухня собирается по прокрутке: корпуса, фасады, столешница, техника,
 *      свет (canvas, как сборка здания у pkvesta);
 *   3. примерка: цвет фасадов и столешницы на их снимке Сантьяго VIP,
 *      тени и блики остаются с фото;
 *   4. работы: восемь их кухонь большими кадрами едут вбок от прокрутки;
 *   5. как заказать: их пять шагов до чаепития и расчёт метров кухни;
 *   6. производство и шоу-рум: их фото, их цифры, видеообзоры;
 *   7. стоимость сайта: предложение 48 часов (PROMO, lib/admin/mockup-offer);
 *   8. заявка на замер: форма справа, в макете никуда не уходит.
 *
 * Всё о компании — только с vtashkente.uz (снято 16.10.2026): названия
 * кухонь и их фото, шаги, шесть бонусов, «до 45%», «3 года», замерщики «с
 * опытом более 10 лет», адреса, часы, телефон, Telegram, YouTube. Цен на
 * их сайте нет («Почему нет цен на сайте?»), сроков тоже, поэтому их нет и
 * здесь: расчёт считает метры и отправляет размеры в их Telegram.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/vtashkente";
const CSS = readFileSync(DIR + "style.css", "utf8").replace(/\n\s*/g, "").replace(/__IMG__/g, IMG);
const INTRO = readFileSync(DIR + "intro.js", "utf8");
const ASM = readFileSync(DIR + "assembly.js", "utf8");
const JS = readFileSync(DIR + "site.js", "utf8");
const BASE = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Onest:wght@400;700&family=Unbounded:wght@400;700&display=swap";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l) => BASE + (l === "uz" ? "/uz" : "") + "/";
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);

/* ── Факты с vtashkente.uz ─────────────────────────────────────────────── */
const F = {
  name: "vTashkente",
  site: "https://vtashkente.uz",
  phone: "+998909729989",
  phoneT: "+998 90 972-99-89",
  tg: "https://t.me/vTashkenteuz_IrinaTsoy",
  yt: "https://www.youtube.com/@vtashkente.uz./videos",
  hours: { ru: "ежедневно 10:00-19:00", uz: "har kuni 10:00-19:00" },
  show: { ru: "Ташкент, ул. Шота Руставели, 55Б", uz: "Toshkent, Shota Rustaveli ko‘chasi, 55B" },
  showMap: "https://yandex.uz/maps/?rtext=~41.283218%2C69.251641&rtt=auto",
  prod: { ru: "Ташкентская обл., Ташкентский р-н, Кизгалдок, ул. Бобура, 34", uz: "Toshkent viloyati, Toshkent tumani, Qizg‘aldoq, Bobur ko‘chasi, 34" },
  prodMap: "https://yandex.uz/maps/?rtext=~41.380170%2C69.179797&rtt=auto",
};

/* Их кухни: название с сайта, кадр, видеообзор, если он есть у кухни. */
const WORKS = [
  { id: "amsterdam", n: ["Амстердам VIP", "Amsterdam VIP"], v: "https://www.youtube.com/watch?v=V3i-Ve8NSDg", w: 1600, h: 1200 },
  { id: "nitstsa", n: ["Ницца VIP", "Nitstsa VIP"], v: "https://www.youtube.com/watch?v=4-SJmEmkiMo", w: 900, h: 1200 },
  { id: "london", n: ["Лондон VIP", "London VIP"], v: "https://www.youtube.com/watch?v=qMJN22GMpAM", w: 1280, h: 960 },
  { id: "nyu", n: ["Нью-Йорк VIP", "Nyu-York VIP"], v: "https://www.youtube.com/watch?v=6HHZBbR8DXg", w: 1280, h: 960 },
  { id: "melburn", n: ["Мельбурн VIP", "Melburn VIP"], v: "https://www.youtube.com/watch?v=PNLfKBoxmcU", w: 1280, h: 960 },
  { id: "la", n: ["Лос-Анджелес VIP", "Los-Anjeles VIP"], v: "https://www.youtube.com/watch?v=vIpj2petkGQ", w: 1280, h: 960 },
  { id: "chikago", n: ["Чикаго VIP", "Chikago VIP"], v: "", w: 900, h: 1200 },
  { id: "santyago", n: ["Сантьяго VIP", "Santyago VIP"], v: "", w: 1280, h: 960 },
];
const HERO = [
  { id: "melburn", n: ["Мельбурн VIP", "Melburn VIP"] },
  { id: "amsterdam", n: ["Амстердам VIP", "Amsterdam VIP"] },
  { id: "santyago", n: ["Сантьяго VIP", "Santyago VIP"] },
  { id: "nyu", n: ["Нью-Йорк VIP", "Nyu-York VIP"] },
];
/* Их видеообзоры: обложка и подпись с обложки. */
const VIDEOS = [
  { id: "shpon", v: "8hN9q2_-yrk", n: ["Дом в шпоне: отзыв клиента", "Shpondagi uy: mijoz fikri"] },
  { id: "darhan", v: "isKixLJDu3w", n: ["Квартира в ЖК Дархан", "Darxon TJMdagi kvartira"] },
  { id: "minimalizm", v: "n8LX5d2gL9g", n: ["Дом 250 м² в стиле минимализм", "Minimalizm uslubidagi 250 m² uy"] },
  { id: "oybek", v: "kyBgeLCmlUY", n: ["Квартира в NRG Oybek", "NRG Oybek’dagi kvartira"] },
  { id: "mirabad", v: "1PyfWiS-NUE", n: ["Квартира в Mirabad Avenue", "Mirabad Avenue’dagi kvartira"] },
  { id: "kuhnya", v: "MBR0vUh2I4Y", n: ["Современная кухня", "Zamonaviy oshxona"] },
  { id: "karandaeva", v: "CONgPqpRSlw", n: ["Дом в шпоне по дизайну Ольги Карандаевой", "Olga Karandaeva dizaynidagi shpon uy"] },
  { id: "neoklassika", v: "wjuTyqefh3s", n: ["Дом в неоклассике", "Neoklassika uslubidagi uy"] },
];

/* Примерка: цвета с их же кухонь. Белый и белый камень — как на снимке. */
const FACADES = [
  { id: "white", c: "", n: ["Белый", "Oq"], p: ["как на фото", "suratdagidek"] },
  { id: "cream", c: "#efe1c8", n: ["Кашемир", "Kashemir"], p: ["Лондон VIP", "London VIP"] },
  { id: "olive", c: "#9fae8c", n: ["Олива", "Zaytun"], p: ["Ницца VIP", "Nitstsa VIP"] },
  { id: "graphite", c: "#6b6e73", n: ["Графит", "Grafit"], p: ["Нью-Йорк VIP", "Nyu-York VIP"] },
  { id: "oak", c: "wood", n: ["Дуб", "Eman"], p: ["Амстердам VIP", "Amsterdam VIP"] },
  { id: "black", c: "#3a3a3d", n: ["Чёрный", "Qora"], p: ["Мельбурн VIP", "Melburn VIP"] },
];
const TOPS = [
  { id: "white", c: "", n: ["Белый камень", "Oq tosh"], p: ["как на фото", "suratdagidek"] },
  { id: "beige", c: "#d9c3a2", n: ["Беж", "Bej"], p: ["Амстердам VIP", "Amsterdam VIP"] },
  { id: "black", c: "#3b3b3e", n: ["Чёрный камень", "Qora tosh"], p: ["Мельбурн VIP", "Melburn VIP"] },
  { id: "oak", c: "wood", n: ["Дуб", "Eman"], p: ["под фасад", "fasadga mos"] },
];
/* Контуры на снимке Сантьяго VIP (1280×960, try-1280.webp): фасады
   верха и колонны, фасады низа за островом, столешница у стены и остров
   с торцом. Светильник над кухней вырезан, чтобы не перекрашивался. */
const ZONES = {
  facade: [
    "M345 182L740 117L1047 55L1000 374L470 361L470 424L345 426Z",
    "M590 453L968 497L962 612L947 623L760 586L763 507L592 470Z",
  ],
  top: [
    "M470 424L966 468L975 482L968 497L590 453L470 438Z",
    "M0 440L455 428L765 505L760 514L592 640L585 642L165 512L100 492L0 470Z",
    "M592 640L765 505L762 640L742 705L615 960L588 960Z",
  ],
  lamp: "M296 206L752 110L754 132L300 222Z",
};

/* ── Иконки: линейные, одна толщина ─────────────────────────────────────── */
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4 2-15Z"/><path d="m9 13 9-6"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  ruler: I('<path d="m3 17 14-14 4 4L7 21Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>'),
  play: I('<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5 3.5-5 3.5Z"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  menu: I('<path d="M4 8h16M4 16h16"/>'),
  check: I('<path d="m5 12.5 4.5 4.5L19 7"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  draw: I('<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13 7 4 4"/>'),
  saw: I('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'),
  truck: I('<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
  cup: I('<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3"/>'),
  chat: I('<path d="M4 5h16v11H9l-5 4Z"/><path d="M8 10h8M8 13h5"/>'),
};

/* Знак DevUz для промо (как на devuz.studio) и их знак: круг с галочкой. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZSIGN = `<svg class="dz-sign" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;
/* Галочка их логотипа: широкий штрих слева и тонкий длинный справа. */
const VSIGN = `<svg class="vt-sign" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><circle class="vt-disc" cx="100" cy="100" r="96"/><path class="vt-v" pathLength="1" d="M52 98C64 104 76 120 88 146C108 104 132 72 166 44"/></svg>`;

/* ── Заставка ─────────────────────────────────────────────────────────── */
function introHtml(l) {
  const t = T(l);
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  return `<div class="intro" id="intro" role="presentation">
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t("макет главной для vTashkente", "vTashkente uchun bosh sahifa maketi")}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<div class="vt-stage" aria-hidden="true">${VSIGN}<img class="vt-word" src="${IMG}/logo-500.webp" alt="" width="500" height="112"></div>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish")}</button>
</div>`;
}

/* ── Шапка, меню, заявка, подвал ─────────────────────────────────────── */
const NAV = [
  ["sborka", ["Сборка", "Yig‘ish"], "h-melburn"],
  ["primerka", ["Примерка", "Sinab ko‘rish"], "h-santyago"],
  ["raboty", ["Работы", "Ishlar"], "h-amsterdam"],
  ["zakaz", ["Как заказать", "Buyurtma"], "h-nyu"],
  ["doverie", ["Шоу-рум", "Shourum"], "t-shourum"],
  ["zamer", ["Замер", "O‘lchov"], "t-obrazcy"],
];
const zamerBtn = (l, cls, label) => `<button type="button" class="btn ${cls}" data-zamer>${ICON.ruler}<span>${label}</span></button>`;
const tgBtn = (cls, label, text) => `<a class="btn ${cls}" href="${F.tg}" data-tg="${esc(text)}" target="_blank" rel="noopener">${ICON.tg}<span>${label}</span></a>`;
const helloText = (l) => T(l)("Здравствуйте! Хочу кухню на заказ. Подскажите, сколько будет стоить и когда может приехать замерщик?", "Assalomu alaykum! Buyurtma asosida oshxona istayman. Narxi qancha bo‘ladi va o‘lchovchi qachon kela oladi?");

function headerHtml(l) {
  const t = T(l);
  return `<header class="top" id="top"><div class="top-in">
<a class="logo" href="${href(l)}" aria-label="vTashkente"><img src="${IMG}/logo-500.webp" alt="vTashkente.uz" width="500" height="112"></a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${NAV.map(([id, n]) => `<a href="#${id}">${n[l === "ru" ? 0 : 1]}</a>`).join("")}</nav>
<div class="top-r"><div class="lang"><a href="${href("ru")}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz")}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>
<a class="top-ph" href="tel:${F.phone}">${F.phoneT}</a>
${zamerBtn(l, "btn-or btn-sm top-cta", t("Вызвать замерщика", "O‘lchovchini chaqirish"))}
<button type="button" class="ic-btn" id="menu-btn" aria-expanded="false" aria-controls="menu" aria-label="${t("Меню", "Menyu")}">${ICON.menu}</button></div>
</div></header>`;
}

function menuHtml(l) {
  const t = T(l);
  return `<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="${t("Меню", "Menyu")}" hidden>
<div class="mn-bgs" aria-hidden="true">${NAV.map(([, , bg], i) => `<img class="mn-bg${i === 0 ? " on" : ""}" src="${IMG}/${bg}-${bg.startsWith("h-") ? 900 : 700}.webp" alt="" loading="lazy" decoding="async">`).join("")}<div class="mn-shade"></div></div>
<button type="button" class="ic-btn mn-x" data-close aria-label="${t("Закрыть", "Yopish")}">${ICON.close}</button>
<nav class="mn-list" aria-label="${t("Разделы", "Bo‘limlar")}">${NAV.map(([id, n], i) => `<a class="mn-i" href="#${id}" data-i="${i}"><span class="mn-n">0${i + 1}</span><span class="mn-t">${n[l === "ru" ? 0 : 1]}</span></a>`).join("")}</nav>
<div class="mn-side"><p class="cap">${t("Шоу-рум", "Shourum")}</p><p>${F.show[l]}<br>${F.hours[l]}</p><p><a href="tel:${F.phone}">${F.phoneT}</a></p>${tgBtn("btn-line", "Telegram", helloText(l))}</div>
</div>`;
}

/* Заявка на замер: та же форма в секции и в панели справа. */
function formHtml(l, p) {
  const t = T(l);
  const chip = (name, v, label, on) => `<label class="chip"><input type="radio" name="${p}-${name}" value="${esc(label)}"${on ? " checked" : ""}><span>${label}</span></label>`;
  return `<form class="zf" data-form novalidate>
<label class="fld"><span>${t("Как к вам обращаться", "Ismingiz")}</span><input name="name" autocomplete="name" placeholder="${t("Имя", "Ism")}"></label>
<label class="fld"><span>${t("Телефон", "Telefon")}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998" required></label>
<fieldset class="chips"><legend>${t("Что нужно", "Nima kerak")}</legend>${chip("what", 1, t("Кухня", "Oshxona"), true)}${chip("what", 2, t("Гардеробная", "Garderob"))}${chip("what", 3, t("Шкаф", "Shkaf"))}${chip("what", 4, t("Другое", "Boshqa"))}</fieldset>
<fieldset class="chips"><legend>${t("Когда удобно", "Qachon qulay")}</legend>${chip("when", 1, t("В будни", "Ish kunlari"), true)}${chip("when", 2, t("В выходные", "Dam olish kunlari"))}</fieldset>
<p class="zf-size" data-size hidden></p>
<p class="zf-err" data-err role="alert" hidden>${t("Оставьте телефон: без него менеджеру некуда перезвонить.", "Telefon qoldiring: usiz menejer qo‘ng‘iroq qila olmaydi.")}</p>
<button class="btn btn-or zf-go" type="submit">${ICON.ruler}<span>${t("Вызвать замерщика", "O‘lchovchini chaqirish")}</span></button>
<p class="zf-note">${t("Это макет: заявка никуда не уходит. На рабочем сайте она сразу придёт менеджеру vTashkente в Telegram.", "Bu maket: ariza hech qayerga ketmaydi. Ishchi saytda u darhol vTashkente menejeriga Telegramda keladi.")}</p>
<div class="zf-ok" data-ok hidden><p class="zf-ok-h">${ICON.check}<span>${t("Заявка собрана", "Ariza tayyor")}</span></p><p>${t("В макете она здесь и останется. Чтобы проверить, как она выглядит у менеджера, отправьте её в Telegram vTashkente: текст уже скопирован.", "Maketda u shu yerda qoladi. Menejerda qanday ko‘rinishini tekshirish uchun uni vTashkente Telegramiga yuboring: matn allaqachon nusxalangan.")}</p><pre class="zf-sum" data-sum></pre><a class="btn btn-line" href="${F.tg}" data-tg-form target="_blank" rel="noopener">${ICON.tg}<span>${t("Открыть Telegram vTashkente", "vTashkente Telegramini ochish")}</span></a></div>
</form>`;
}

function panelHtml(l) {
  const t = T(l);
  return `<div class="pn-back" id="pn-back" hidden></div>
<aside class="panel" id="panel" role="dialog" aria-modal="true" aria-labelledby="panel-h" hidden>
<div class="pn-top"><h2 id="panel-h">${t("Пригласите замерщика", "O‘lchovchini taklif qiling")}</h2><button type="button" class="ic-btn" data-close aria-label="${t("Закрыть", "Yopish")}">${ICON.close}</button></div>
<p class="pn-lead">${t("Оставьте телефон: перезвоним и согласуем дату и время визита замерщика.", "Telefon qoldiring: qo‘ng‘iroq qilib, o‘lchovchi kelish sanasi va vaqtini kelishamiz.")}</p>
${formHtml(l, "p")}
</aside>`;
}

/* ── 1. Первый экран ─────────────────────────────────────────────────── */
function heroBlock(l) {
  const t = T(l);
  const words = l === "ru" ? ["Проектируем", "Рисуем", "Производим", "Доставляем", "Устанавливаем"] : ["Loyihalaymiz", "Chizamiz", "Ishlab chiqaramiz", "Yetkazamiz", "O‘rnatamiz"];
  const facts = [
    [t("6 бонусов", "6 ta bonus"), t("к кухне: замер, 3D-проект, доставка, подъём, сборка, уборка", "oshxonaga: o‘lchov, 3D loyiha, yetkazish, ko‘tarish, yig‘ish, tozalash")],
    [t("до 45%", "45% gacha"), t("экономии: заказ напрямую у производителя", "tejash: to‘g‘ridan to‘g‘ri ishlab chiqaruvchidan")],
    [t("1 минута", "1 daqiqa"), t("среднее время ответа в Telegram", "Telegramda o‘rtacha javob vaqti")],
  ];
  return `<section class="hs hero" id="hero" aria-label="${t("Первый экран", "Birinchi ekran")}">
<div class="hr-media" aria-hidden="true">${HERO.map((h, i) => `<img class="hr-img${i === 0 ? " on" : ""}" src="${IMG}/h-${h.id}-1600.webp" srcset="${IMG}/h-${h.id}-900.webp 900w, ${IMG}/h-${h.id}-1600.webp 1600w" sizes="100vw" alt="" width="1600" height="1200"${i ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async">`).join("")}<div class="hr-shade"></div></div>
<div class="hr-in">
<p class="kicker rise" style="--d:0ms">${t("Производитель авторской мебели в Узбекистане", "O‘zbekistonda mualliflik mebeli ishlab chiqaruvchi")}</p>
<p class="hr-chip rise" style="--d:80ms" aria-hidden="true"><span class="hr-roll">${words.map((w, i) => `<b${i === 0 ? ' class="on"' : ""}>${w}</b>`).join("")}</span></p>
<h1 class="hr-h">${t('<span class="ln"><span>Авторские кухни</span></span><span class="ln"><span>на заказ</span></span><span class="ln"><span>в Ташкенте</span></span>', '<span class="ln"><span>Toshkentda</span></span><span class="ln"><span>mualliflik</span></span><span class="ln"><span>oshxonalari</span></span>')}</h1>
<p class="hr-lead rise" style="--d:360ms">${t("Любой сложности, с шагом в миллиметр. Проект рисует опытный дизайнер, а не менеджер по продажам.", "Har qanday murakkablikda, millimetr aniqligida. Loyihani savdo menejeri emas, tajribali dizayner chizadi.")}</p>
<div class="hr-cta rise" style="--d:440ms">${zamerBtn(l, "btn-or btn-lg", t("Вызвать замерщика", "O‘lchovchini chaqirish"))}${tgBtn("btn-glass btn-lg", t("Узнать цену в Telegram", "Narxni Telegramda bilish"), helloText(l))}</div>
</div>
<ul class="hr-facts rise" style="--d:560ms">${facts.map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join("")}</ul>
<div class="hr-now" aria-live="polite"><span class="hr-num"><b id="hr-i">01</b> / 0${HERO.length}</span><span class="hr-name" id="hr-name">${t("Кухня", "Oshxona")} ${HERO[0].n[l === "ru" ? 0 : 1]}</span><span class="hr-bars">${HERO.map((_, i) => `<i${i === 0 ? ' class="on"' : ""}></i>`).join("")}</span></div>
<a class="hr-down" href="#sborka"><span>${t("Листайте: кухня соберётся", "Varaqlang: oshxona yig‘iladi")}</span><i aria-hidden="true"></i></a>
</section>`;
}

/* ── 2. Сборка ───────────────────────────────────────────────────────── */
function assemblyBlock(l) {
  const t = T(l);
  const steps = [
    [t("Корпуса", "Korpuslar"), t("Режем на своём производстве под ваши стены. Любой нестандарт, с шагом в миллиметр.", "O‘z ishlab chiqarishimizda devorlaringizga moslab kesamiz. Har qanday nostandart, millimetr qadami bilan.")],
    [t("Фасады", "Fasadlar"), t("Любой стиль и цвет, любой материал. Образцы можно потрогать в шоу-руме.", "Har qanday uslub va rang, har qanday material. Namunalarni shourumda ushlab ko‘rish mumkin.")],
    [t("Столешница", "Stoleshnitsa"), t("Любые размеры. Перед доставкой изделия проверяет свой отдел контроля качества.", "Har qanday o‘lcham. Yetkazishdan oldin buyumlarni o‘z sifat nazorati bo‘limimiz tekshiradi.")],
    [t("Техника", "Texnika"), t("Сборка бесплатно, а если нужно, подключим бытовую технику и сантехнику.", "Yig‘ish bepul, kerak bo‘lsa maishiy texnika va santexnikani ulaymiz.")],
    [t("Свет", "Yorug‘lik"), t("Готово. Наводим чистоту, потом чаепитие: обсуждаем гарантийные условия.", "Tayyor. Tozalab ketamiz, keyin choy ustida kafolat shartlarini gaplashamiz.")],
  ];
  return `<section class="hs asm" id="sborka" aria-label="${t("Кухня собирается по прокрутке", "Oshxona varaqlaganda yig‘iladi")}">
<div class="asm-pin">
<canvas class="asm-cv" aria-hidden="true" data-mm="${t("мм", "mm")}"></canvas>
<div class="asm-txt">
<p class="kicker">${t("Как устроена кухня", "Oshxona qanday tuzilgan")}</p>
<h2 class="asm-h">${t("Кухня собирается, пока вы листаете", "Siz varaqlaganingizda oshxona yig‘iladi")}</h2>
<ol class="asm-steps">${steps.map(([h, p], i) => `<li${i === 0 ? ' class="on"' : ""}><span class="asm-n">0${i + 1}</span><div><b>${h}</b><p>${p}</p></div></li>`).join("")}</ol>
</div>
<div class="asm-bar" aria-hidden="true"><i></i></div>
<p class="asm-note">${t("Сцена нарисована кодом: так устроена кухня, это не конкретный проект vTashkente.", "Sahna kod bilan chizilgan: oshxona shunday tuzilgan, bu vTashkente’ning aniq loyihasi emas.")}</p>
</div>
</section>`;
}

/* ── 3. Примерка фасадов ─────────────────────────────────────────────── */
function tryBlock(l) {
  const t = T(l);
  const k = l === "ru" ? 0 : 1;
  const sw = (group, list) => list.map((s, i) => `<button type="button" class="sw${i === 0 ? " on" : ""}" data-g="${group}" data-c="${s.c}" data-n="${esc(s.n[k])}" aria-pressed="${i === 0}"><i style="${s.c === "wood" ? `background-image:url(${IMG}/wood.webp)` : s.c ? `background:${s.c}` : "background:#f1efea"}"></i><b>${s.n[k]}</b><small>${s.p[k]}</small></button>`).join("");
  const paths = (list) => list.map((d) => `<path d="${d}"/>`).join("");
  return `<section class="hs try" id="primerka" aria-label="${t("Примерка фасадов", "Fasadlarni sinab ko‘rish")}">
<div class="try-stage">
<div class="try-pic" id="try-pic">
<img src="${IMG}/try-1280.webp" srcset="${IMG}/try-700.webp 700w, ${IMG}/try-1280.webp 1280w" sizes="(min-width: 1100px) 62vw, 100vw" alt="${t("Кухня Сантьяго VIP: белые фасады, белая столешница, остров в орехе", "Santyago VIP oshxonasi: oq fasadlar, oq stoleshnitsa, yong‘oq rangli orol")}" width="1280" height="960" loading="lazy" decoding="async">
<svg class="try-ov" viewBox="0 0 1280 960" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
<defs><pattern id="wood" patternUnits="userSpaceOnUse" width="200" height="164"><image href="${IMG}/wood.webp" width="200" height="164"/></pattern>
<mask id="nolamp" maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="960"><rect width="1280" height="960" fill="#fff"/><path d="${ZONES.lamp}" fill="#000"/></mask></defs>
<g class="try-z" data-z="facade" mask="url(#nolamp)">${paths(ZONES.facade)}</g>
<g class="try-z" data-z="top">${paths(ZONES.top)}</g>
</svg>
<span class="try-sweep" aria-hidden="true"></span>
<p class="try-tag" id="try-tag">${t("Фасады", "Fasadlar")}: <b data-tag="facade">${FACADES[0].n[k]}</b> · ${t("столешница", "stoleshnitsa")}: <b data-tag="top">${TOPS[0].n[k]}</b></p>
</div>
<div class="try-side">
<p class="kicker">${t("Примерка", "Sinab ko‘rish")} <span class="ours">${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</span></p>
<h2>${t("Поменяйте фасады на настоящей кухне", "Haqiqiy oshxonada fasadlarni almashtiring")}</h2>
<p class="sub">${t("Это наша кухня Сантьяго VIP. Цвет ложится на фасады и столешницу, а тени и блики остаются как на фото. Каждый цвет уже стоит в одной из наших кухонь: её название под образцом.", "Bu bizning Santyago VIP oshxonamiz. Rang fasad va stoleshnitsaga tushadi, soya va yaltirash esa suratdagidek qoladi. Har bir rang oshxonalarimizdan birida bor: uning nomi namuna ostida.")}</p>
<p class="try-g">${t("Фасады", "Fasadlar")}</p><div class="sws" role="group" aria-label="${t("Цвет фасадов", "Fasad rangi")}">${sw("facade", FACADES)}</div>
<p class="try-g">${t("Столешница", "Stoleshnitsa")}</p><div class="sws sws-4" role="group" aria-label="${t("Столешница", "Stoleshnitsa")}">${sw("top", TOPS)}</div>
${tgBtn("btn-or try-go", t("Хочу такую: обсудить в Telegram", "Shunday istayman: Telegramda gaplashish"), t("Здравствуйте! Хочу кухню как Сантьяго VIP: фасады белые, столешница белый камень.", "Assalomu alaykum! Santyago VIP kabi oshxona istayman: fasadlar oq, stoleshnitsa oq tosh."))}
</div>
</div>
</section>`;
}

/* ── 4. Работы ───────────────────────────────────────────────────────── */
function worksBlock(l) {
  const t = T(l);
  const k = l === "ru" ? 0 : 1;
  const card = (w, i) => `<figure class="wk${w.h > w.w ? " wk-tall" : ""}"><div class="wk-pic"><img src="${IMG}/w-${w.id}-1280.webp" srcset="${IMG}/w-${w.id}-700.webp 700w, ${IMG}/w-${w.id}-1280.webp 1280w" sizes="(min-width: 900px) 46vw, 84vw" alt="${t("Кухня", "Oshxona")} ${esc(w.n[k])}" width="${w.w}" height="${w.h}" loading="lazy" decoding="async"></div><figcaption><span class="wk-n">${String(i + 1).padStart(2, "0")}</span><b>${w.n[k]}</b>${w.v ? `<a href="${w.v}" target="_blank" rel="noopener">${ICON.play}${t("Видеообзор", "Video sharh")}</a>` : ""}</figcaption></figure>`;
  return `<section class="hs works" id="raboty" aria-label="${t("Работы", "Ishlar")}">
<div class="wk-pin">
<div class="wk-head"><p class="kicker">${t("Работы", "Ishlar")}</p><h2>${t("Кухни, которые мы сделали", "Biz yasagan oshxonalar")}</h2><p class="wk-count"><b id="wk-i">01</b> / 0${WORKS.length}</p></div>
<div class="wk-track" id="wk-track">${WORKS.map(card).join("")}
<div class="wk wk-end"><p>${t("Это не всё портфолио. Пришлём каталог проектов: кухни, гардеробные, спальни, детские, офис.", "Bu barcha portfolio emas. Loyihalar katalogini yuboramiz: oshxonalar, garderoblar, yotoqxonalar, bolalar xonalari, ofis.")}</p>${tgBtn("btn-or", t("Получить каталог в Telegram", "Katalogni Telegramda olish"), t("Здравствуйте! Пришлите, пожалуйста, каталог ваших проектов.", "Assalomu alaykum! Loyihalaringiz katalogini yuboring, iltimos."))}<a class="lnk" href="${F.yt}" target="_blank" rel="noopener">${ICON.play}YouTube vTashkente</a></div>
</div>
<div class="wk-bar" aria-hidden="true"><i></i></div>
</div>
</section>`;
}

/* ── 5. Как заказать ─────────────────────────────────────────────────── */
function orderBlock(l) {
  const t = T(l);
  const steps = [
    [ICON.chat, t("Заявка", "Ariza"), t("Звонок, Telegram или форма. В Telegram отвечаем в среднем за минуту.", "Qo‘ng‘iroq, Telegram yoki forma. Telegramda o‘rtacha bir daqiqada javob beramiz.")],
    [ICON.draw, t("Замер и проект", "O‘lchov va loyiha"), t("Приезжает один из трёх замерщиков с образцами материалов, у каждого больше 10 лет опыта. Дизайнер рисует 3D-проект у вас дома или в шоу-руме.", "Material namunalari bilan uchta o‘lchovchidan biri keladi, har birining tajribasi 10 yildan ortiq. Dizayner 3D loyihani uyingizda yoki shourumda chizadi.")],
    [ICON.saw, t("Производство", "Ishlab chiqarish"), t("Своё производство и свой персонал, без подрядчиков. Перед доставкой проверяем каждое изделие.", "O‘z ishlab chiqarishimiz va o‘z xodimlarimiz, pudratchilarsiz. Yetkazishdan oldin har bir buyumni tekshiramiz.")],
    [ICON.truck, t("Доставка и монтаж", "Yetkazish va o‘rnatish"), t("Собираем кухню на производстве, упаковываем, везём своим транспортом, поднимаем на этаж и монтируем.", "Oshxonani ishlab chiqarishda yig‘amiz, qadoqlaymiz, o‘z transportimizda olib boramiz, qavatga ko‘taramiz va o‘rnatamiz.")],
    [ICON.cup, t("Чаепитие", "Choy"), t("Наводим чистоту, устраиваем чаепитие и обсуждаем гарантийные условия.", "Tozalab ketamiz, choy ustida kafolat shartlarini gaplashamiz.")],
  ];
  const lay = [
    ["line", t("Прямая", "To‘g‘ri"), "M8 10h48v8H8z"],
    ["corner", t("Угловая", "Burchakli"), "M8 10h48v8H16v34H8z"],
    ["u", t("П-образная", "P shaklida"), "M8 10h48v42h-8V18H16v34H8z"],
    ["island", t("С островом", "Orolli"), "M8 10h48v8H8zM18 34h28v10H18z"],
  ];
  const range = (id, label, min, max, val) => `<label class="rg" data-wall="${id}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="10" value="${val}" data-r="${id}"><output class="num" data-o="${id}">${val}</output><small>${t("см", "sm")}</small></label>`;
  return `<section class="hs order" id="zakaz" aria-label="${t("Как заказать", "Qanday buyurtma qilish")}">
<div class="mq" aria-hidden="true"><div class="mq-in">${Array(2).fill((l === "ru" ? ["Проектируем", "Рисуем", "Производим", "Доставляем", "Устанавливаем", "Чаепитие"] : ["Loyihalaymiz", "Chizamiz", "Ishlab chiqaramiz", "Yetkazamiz", "O‘rnatamiz", "Choy"]).map((w) => `<span>${w}</span><i></i>`).join("")).join("")}</div></div>
<div class="wrap">
<div class="od-head"><p class="kicker">${t("Как заказать", "Qanday buyurtma qilish")}</p><h2>${t("Пять шагов от заявки до чаепития", "Arizadan choygacha besh qadam")}</h2></div>
<ol class="od-steps" id="od-steps">${steps.map(([ic, h, p], i) => `<li style="--i:${i}"><span class="od-ic">${ic}</span><span class="od-n">0${i + 1}</span><b>${h}</b><p>${p}</p></li>`).join("")}</ol>
<div class="calc" id="calc">
<div class="calc-l">
<p class="kicker">${t("Расчёт кухни", "Oshxona hisobi")} <span class="ours">${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</span></p>
<h3>${t("Сколько метров будет ваша кухня", "Oshxonangiz necha metr bo‘ladi")}</h3>
<div class="lay" role="radiogroup" aria-label="${t("Планировка", "Rejalashtirish")}">${lay.map(([id, n, d], i) => `<label class="lay-i"><input type="radio" name="lay" value="${id}"${i === 1 ? " checked" : ""}><svg viewBox="0 0 64 60" aria-hidden="true"><path d="${d}"/></svg><span>${n}</span></label>`).join("")}</div>
${range("a", t("Основная стена", "Asosiy devor"), 150, 600, 320)}${range("b", t("Боковая стена", "Yon devor"), 100, 400, 210)}${range("c", t("Вторая боковая", "Ikkinchi yon devor"), 100, 400, 210)}${range("i", t("Остров", "Orol"), 100, 300, 180)}
</div>
<div class="calc-r">
<svg class="plan" id="plan" viewBox="0 0 320 240" aria-hidden="true"><g class="plan-grid"></g><g class="plan-k"></g></svg>
<p class="calc-m"><b class="num" id="calc-m">5,3</b><span>${t("погонных метра", "pogon metr")}</span></p>
<p class="calc-p">${t("Цена метра зависит от материала, фурнитуры, размера и столешницы, поэтому считаем её под вас. Отправьте метры в Telegram: менеджер назовёт стоимость и пришлёт проект.", "Metr narxi material, furnitura, o‘lcham va stoleshnitsaga bog‘liq, shuning uchun uni sizga moslab hisoblaymiz. Metrlarni Telegramga yuboring: menejer narxini aytadi va loyihani yuboradi.")}</p><p class="calc-p calc-own">${t("Для vTashkente: назовёте цену «от … сум за метр», и расчёт сразу покажет сумму.", "vTashkente uchun: «metri … so‘mdan» narxini aytsangiz, hisob darhol summani ko‘rsatadi.")}</p>
<div class="calc-btns"><a class="btn btn-or" href="${F.tg}" id="calc-tg" data-tg="" target="_blank" rel="noopener">${ICON.tg}<span>${t("Отправить размеры в Telegram", "O‘lchamlarni Telegramga yuborish")}</span></a><button type="button" class="btn btn-line" id="calc-z">${ICON.ruler}<span>${t("В заявку на замер", "O‘lchov arizasiga")}</span></button></div>
</div>
</div>
</div>
</section>`;
}

/* ── 6. Производство и шоу-рум ───────────────────────────────────────── */
function trustBlock(l) {
  const t = T(l);
  const k = l === "ru" ? 0 : 1;
  const nums = [
    ["3", t("года", "yil"), t("после монтажа помогаем с любым вопросом по проекту", "o‘rnatishdan keyin loyiha bo‘yicha har qanday savolda yordam beramiz")],
    ["45", "%", t("до стольких экономии на посредниках: заказ напрямую у производителя", "vositachilarda shuncha gacha tejaysiz: to‘g‘ridan to‘g‘ri ishlab chiqaruvchidan")],
    ["10", t("+ лет", "+ yil"), t("опыт каждого из трёх замерщиков", "uchta o‘lchovchining har birining tajribasi")],
    ["6", t("бонусов", "bonus"), t("к кухне: замер, 3D-проект, доставка, подъём на этаж, сборка и уборка", "oshxonaga: o‘lchov, 3D loyiha, yetkazish, qavatga ko‘tarish, yig‘ish va tozalash")],
  ];
  return `<section class="hs trust" id="doverie" aria-label="${t("Производство и шоу-рум", "Ishlab chiqarish va shourum")}">
<div class="tr-duo">
<figure class="tr-p" data-par-box><img data-par=".08" src="${IMG}/t-ceh-1280.webp" srcset="${IMG}/t-ceh-700.webp 700w, ${IMG}/t-ceh-1280.webp 1280w" sizes="(min-width: 900px) 50vw, 100vw" alt="${t("Цех vTashkente: мастер собирает фасад", "vTashkente sexi: usta fasadni yig‘moqda")}" width="1280" height="960" loading="lazy" decoding="async"><figcaption><p class="kicker">${t("Производство", "Ishlab chiqarish")}</p><h2>${t("Делаем сами, без подрядчиков", "O‘zimiz yasaymiz, pudratchilarsiz")}</h2><p>${F.prod[l]}</p><a class="lnk" href="${F.prodMap}" target="_blank" rel="noopener">${ICON.pin}${t("Проложить маршрут", "Yo‘nalish olish")}</a></figcaption></figure>
<figure class="tr-p" data-par-box><img data-par=".08" src="${IMG}/t-shourum-1280.webp" srcset="${IMG}/t-shourum-700.webp 700w, ${IMG}/t-shourum-1280.webp 1280w" sizes="(min-width: 900px) 50vw, 100vw" alt="${t("Шоу-рум vTashkente: кухни, образцы фасадов и столешниц", "vTashkente shourumi: oshxonalar, fasad va stoleshnitsa namunalari")}" width="1280" height="960" loading="lazy" decoding="async"><figcaption><p class="kicker">${t("Шоу-рум", "Shourum")}</p><h2>${t("Материалы можно потрогать", "Materiallarni ushlab ko‘rish mumkin")}</h2><p>${F.show[l]}, ${F.hours[l]}</p><a class="lnk" href="${F.showMap}" target="_blank" rel="noopener">${ICON.pin}${t("Проложить маршрут", "Yo‘nalish olish")}</a></figcaption></figure>
</div>
<div class="wrap">
<ul class="tr-nums">${nums.map(([n, u, p]) => `<li><b class="num" data-to="${n}">${n}</b><span class="u">${u}</span><p>${p}</p></li>`).join("")}</ul>
<div class="tr-v"><div class="tr-vh"><p class="kicker">${t("Видеообзоры и отзывы", "Video sharhlar va fikrlar")}</p><a class="lnk" href="${F.yt}" target="_blank" rel="noopener">${ICON.play}${t("Все видео на YouTube", "Barcha videolar YouTube’da")}</a></div>
<div class="tr-vs">${VIDEOS.map((v) => `<a class="vd" href="https://www.youtube.com/watch?v=${v.v}" target="_blank" rel="noopener"><img src="${IMG}/v-${v.id}-640.webp" alt="" width="640" height="360" loading="lazy" decoding="async"><span>${ICON.play}${v.n[k]}</span></a>`).join("")}</div></div>
</div>
</section>`;
}

/* ── 7. Стоимость сайта: предложение 48 часов ─────────────────────────── */
function priceBlock(l) {
  const t = T(l);
  return `<section class="hs price" id="cena" aria-label="${t("Стоимость сайта", "Sayt narxi")}">
<div class="wrap">
<div class="pr-head"><p class="kicker">${t("Предложение DevUz Studio для vTashkente", "DevUz Studio’ning vTashkente uchun taklifi")}</p><h2>${t("Сайт по этому макету", "Shu maket bo‘yicha sayt")}</h2><p class="sub">${t("48 часов с момента, как макет пришёл вам, действуют спецусловия. Если подпишем договор в этот срок, цена останется такой. Потом обычные цены.", "Maket sizga kelgan paytdan 48 soat davomida maxsus shartlar amal qiladi. Shu muddatda shartnoma imzolasak, narx shunday qoladi. Keyin odatiy narxlar.")}</p></div>
<div class="pr-cards">
<article class="pr-c pr-main"><p class="pr-k">${t("Лендинг", "Lending")}</p><h3>${t("Эта страница со всем, что на ней работает, и 3 допа на выбор", "Shu sahifa, undagi barcha funksiyalar va tanlovingizga 3 ta qo‘shimcha")}</h3><p class="pr-p"><b class="num">500 $</b><s class="num">1 700 $</s></p><ul><li>${t("заявки на замер сразу менеджеру в Telegram", "o‘lchov arizalari darhol menejerga Telegramda")}</li><li>${t("расчёт кухни с вашей ценой за метр", "metr narxingiz bilan oshxona hisobi")}</li><li>${t("примерка фасадов на всех ваших кухнях", "barcha oshxonalaringizda fasadlarni sinab ko‘rish")}</li><li>${t("каталог проектов и видеообзоры с YouTube", "loyihalar katalogi va YouTube’dan video sharhlar")}</li></ul></article>
<article class="pr-c"><p class="pr-k">${t("Корпоративный сайт", "Korporativ sayt")}</p><h3>${t("Полноразмерный сайт: кухни, гардеробные, спальни, детские, офис и шкафы", "To‘liq sayt: oshxonalar, garderoblar, yotoqxonalar, bolalar xonalari, ofis va shkaflar")}</h3><p class="pr-p"><b class="num">1 000 $</b><s class="num">2 500 $</s></p><ul><li>${t("страница на каждый проект с фото и видео", "har bir loyiha uchun foto va videoli sahifa")}</li><li>${t("русский и узбекский", "rus va o‘zbek tillari")}</li><li>${t("заявки, расчёт и примерка из этого макета", "shu maketdagi arizalar, hisob va sinab ko‘rish")}</li></ul></article>
</div>
<a class="btn btn-or btn-lg pr-go" href="https://t.me/Devuz_studio_bot?start=vtashkente" target="_blank" rel="noopener">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
</div>
</section>`;
}

/* ── 8. Заявка на замер ──────────────────────────────────────────────── */
function zamerBlock(l) {
  const t = T(l);
  return `<section class="hs zamer" id="zamer" aria-label="${t("Заявка на замер", "O‘lchov uchun ariza")}">
<div class="zm-bg" aria-hidden="true"><img src="${IMG}/t-obrazcy-1280.webp" srcset="${IMG}/t-obrazcy-700.webp 700w, ${IMG}/t-obrazcy-1280.webp 1280w" sizes="100vw" alt="" width="1280" height="960" loading="lazy" decoding="async"></div>
<div class="zm-in">
<div class="zm-l"><p class="kicker">${t("Замер", "O‘lchov")}</p><h2>${t("Пригласите замерщика", "O‘lchovchini taklif qiling")}</h2><p class="sub">${t("Приедет с образцами материалов, сделает замер и подскажет, как расставить технику. Нужен только телефон: перезвоним и согласуем дату и время.", "Material namunalari bilan keladi, o‘lchaydi va texnikani qanday joylashtirishni maslahat beradi. Faqat telefon kerak: qo‘ng‘iroq qilib, sana va vaqtni kelishamiz.")}</p><p class="zm-ph">${t("Не хотите ждать? Звоните:", "Kutishni istamaysizmi? Qo‘ng‘iroq qiling:")} <a href="tel:${F.phone}">${F.phoneT}</a><br><span>${F.hours[l]}</span></p></div>
<div class="zm-card">${formHtml(l, "s")}</div>
</div>
</section>`;
}

/* ── Каркас ──────────────────────────────────────────────────────────── */
function Ls(l) {
  const ru = l === "ru";
  return {
    lang: l,
    tg: F.tg,
    hero: HERO.map((h) => (ru ? "Кухня " : "Oshxona ") + h.n[ru ? 0 : 1]),
    tryTg: ru ? "Здравствуйте! Хочу кухню как Сантьяго VIP: фасады {f}, столешница {t}." : "Assalomu alaykum! Santyago VIP kabi oshxona istayman: fasadlar {f}, stoleshnitsa {t}.",
    calcTg: ru ? "Здравствуйте! Хочу кухню: {lay}, {sizes}, всего {m} погонных метра. Сколько это будет стоить?" : "Assalomu alaykum! Oshxona istayman: {lay}, {sizes}, jami {m} pogon metr. Narxi qancha bo‘ladi?",
    calcSize: ru ? "Размеры из расчёта: {lay}, {sizes}, {m} п. м." : "Hisobdagi o‘lchamlar: {lay}, {sizes}, {m} p. m.",
    lay: ru ? { line: "прямая", corner: "угловая", u: "П-образная", island: "с островом" } : { line: "to‘g‘ri", corner: "burchakli", u: "P shaklida", island: "orolli" },
    cm: ru ? "см" : "sm",
    island: ru ? "остров" : "orol",
    formHead: ru ? "Заявка на замер с сайта vTashkente" : "vTashkente saytidan o‘lchov uchun ariza",
    fName: ru ? "Имя" : "Ism",
    fPhone: ru ? "Телефон" : "Telefon",
    fWhat: ru ? "Что нужно" : "Nima kerak",
    fWhen: ru ? "Когда удобно" : "Qachon qulay",
    none: ru ? "не указано" : "ko‘rsatilmagan",
  };
}

function page(l) {
  const t = T(l);
  const other = l === "ru" ? "uz" : "ru";
  const body = [heroBlock, assemblyBlock, tryBlock, worksBlock, orderBlock, trustBlock, priceBlock, zamerBlock].map((f) => f(l)).join("\n");
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t("vTashkente: авторские кухни на заказ в Ташкенте", "vTashkente: Toshkentda buyurtma asosida mualliflik oshxonalari")}</title>
<meta name="description" content="${t("Кухни на заказ любой сложности: замер, 3D-проект, своё производство, доставка, сборка и чаепитие. Шоу-рум на Шота Руставели, 55Б.", "Har qanday murakkablikdagi buyurtma oshxonalar: o‘lchov, 3D loyiha, o‘z ishlab chiqarishimiz, yetkazish, yig‘ish va choy. Shourum Shota Rustaveli, 55B da.")}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#121110">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preload" as="image" href="${IMG}/h-melburn-1600.webp" imagesrcset="${IMG}/h-melburn-900.webp 900w, ${IMG}/h-melburn-1600.webp 1600w" imagesizes="100vw">
<link rel="alternate" hreflang="${other}" href="${href(other)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=false;try{if(sessionStorage.getItem('vt-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches){off=true;r.classList.add('rm')}}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "FurnitureStore", name: F.name, url: F.site, telephone: F.phone, openingHours: "Mo-Su 10:00-19:00", address: { "@type": "PostalAddress", streetAddress: F.show.ru, addressLocality: "Ташкент", addressCountry: "UZ" }, sameAs: [F.tg, F.yt] })}</script>
</head>
<body data-lang="${l}">
${introHtml(l)}
<a class="skip" href="#sborka">${t("К содержанию", "Asosiy qismga")}</a>
${headerHtml(l)}
<main id="main">
${body}
</main>
<footer class="foot"><div class="wrap">
<div class="ft-cols">
<div><img class="ft-logo" src="${IMG}/logo-500.webp" alt="vTashkente.uz" width="500" height="112" loading="lazy"><p>${t("Кухни, гардеробные, спальни, детские, офисная мебель и шкафы на заказ.", "Buyurtma asosida oshxonalar, garderoblar, yotoqxonalar, bolalar xonalari, ofis mebeli va shkaflar.")}</p></div>
<div><b>${t("На связи", "Aloqada")}</b><ul><li><a href="tel:${F.phone}">${F.phoneT}</a></li><li><a href="${F.tg}" target="_blank" rel="noopener">Telegram</a> · <a href="${F.yt}" target="_blank" rel="noopener">YouTube</a></li><li>${F.hours[l]}</li></ul></div>
<div><b>${t("Шоу-рум", "Shourum")}</b><ul><li>${F.show[l]}</li><li><a href="${F.showMap}" target="_blank" rel="noopener">${t("Проложить маршрут", "Yo‘nalish olish")}</a></li></ul></div>
</div>
<div class="rights"><p>${t("Это макет: так может выглядеть главная страница vTashkente. Названия кухонь, фото, шаги, бонусы, цифры, адреса, часы и контакты взяты с vtashkente.uz (16.10.2026). Блоки с пометкой «Предложение DevUz Studio» придумали мы, на сайте их пока нет. Кухня в сцене сборки нарисована кодом.", "Bu maket: vTashkente bosh sahifasi shunday ko‘rinishi mumkin. Oshxona nomlari, suratlar, qadamlar, bonuslar, raqamlar, manzillar, ish vaqti va kontaktlar vtashkente.uz’dan olingan (16.10.2026). «DevUz Studio taklifi» belgisi bor bloklarni biz o‘ylab topdik, ular hozircha saytda yo‘q. Yig‘ish sahnasidagi oshxona kod bilan chizilgan.")}</p><p>${t("Макет принадлежит DevUz Studio. Использовать его можно только по договору:", "Maket DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari")}</a></p></div>
</div></footer>
<div class="dock" id="dock">${zamerBtn(l, "btn-or", t("Вызвать замерщика", "O‘lchovchini chaqirish"))}${tgBtn("btn-glass dock-tg", "", helloText(l)).replace("<span></span>", `<span class="vh">Telegram</span>`)}</div>
${menuHtml(l)}
${panelHtml(l)}
<p class="toast" id="toast" role="status" hidden>${t("Текст скопирован: вставьте его в чат vTashkente", "Matn nusxalandi: uni vTashkente chatiga qo‘ying")}</p>
<script type="application/json" id="i18n">${JSON.stringify(Ls(l)).replace(/</g, "\\u003c")}</script>
<script>
${INTRO}</script>
<script>
${ASM}</script>
<script>
${JS}</script>
</body>
</html>`;
}

const out = { "": page("ru"), uz: page("uz") };
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/* Сборка для сервера (lib/proto/bundles): стили и скрипты один раз, в
   страницах вместо них метка @@имя@@. */
const first = out[""];
const grab = (html, re) => html.match(re)[0];
const parts = {
  S: grab(first, /<style>[\s\S]*?<\/style>/),
  A: grab(first, /<script>\n\(function\(\)\{\n'use strict';\n\/\* assembly[\s\S]*?<\/script>/),
  J: grab(first, /<script>\n\(function\(\)\{\n'use strict';\n\/\* site[\s\S]*?<\/script>/),
};
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const [name, part] of Object.entries(parts)) p = p.split(part).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "vtashkente.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(6), v.length);
