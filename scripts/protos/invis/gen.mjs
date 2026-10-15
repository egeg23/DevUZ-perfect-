import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as D from "./data.mjs";
import { BASE as SITE, ADDONS, ALL, MAX } from "./plan.mjs";
import { MARK_PATHS } from "./mark.mjs";

/*
 * Макет сайта компьютерного клуба Invis (Ташкент, Фидокор 32/1), ru и uz:
 *  - страница (`""`, `uz`): промо DevUz и влёт камеры в знак Invis, первый
 *    экран с живым залом на стекле, сцена «Сетап» (железо собирается по
 *    прокрутке), зоны и цены, бронь места на карте зала с синхронизацией,
 *    колесо бонусов раз в день, кабинеты игрока и администратора в рамках,
 *    предложение DevUz с конструктором;
 *  - кабинет игрока (`kabinet`, `uz/kabinet`) и администратора (`admin`,
 *    `uz/admin`); на странице они же в рамках (?embed=1).
 * Цены зон — середина рынка Ташкента (docs/research/invis.md), места и
 * брони — демо, так и подписано. Фото — SOURCES.md.
 *
 * Стили и скрипты общие, в странице вместо них @@S@@, @@C@@, @@J@@, @@K@@,
 * @@Q@@, @@I@@. Ссылки — через __PROTO_BASE__, отпечаток ставится при показе
 * зерном из protos.stamp (lib/proto/bundles). Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const min = (s) => strip(s).replace(/\n\s*/g, "");
const IMG = "/protos/invis";
const BASE = "__PROTO_BASE__";
const B = D.BRAND.name;
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Unbounded:wght@400;700&display=swap";
const read = (f) => readFileSync(DIR + f, "utf8");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => grp(n) + " $";
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const L2 = (p, l) => (l === "ru" ? p[0] : p[1]);
const href = (l, path = "") => BASE + (l === "uz" ? "/uz" : "") + (path ? "/" + path : "");
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");


const MARK = `<path d="${MARK_PATHS.body}" fill="#ff064d"/><path d="${MARK_PATHS.ticks}" stroke="#090616" stroke-width="2.2" stroke-linecap="round" fill="none"/><circle cx="48" cy="28" r="17" fill="#090616"/><path d="${MARK_PATHS.ring}" fill="#ff064d" fill-rule="evenodd"/><path d="${MARK_PATHS.gaps}" stroke="#090616" stroke-width="3.2" stroke-linecap="round"/><path d="${MARK_PATHS.dot}" fill="#ff064d"/>`;

/* ── Иконки: контуры 24×24, штрих цветом текста ───────────────────────── */
const S = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  arrow: `<path d="M5 12h14M13 6l6 6-6 6" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${S}/><circle cx="12" cy="10" r="2.3" ${S}/>`,
  clock: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 7.5V12l3 2" ${S}/>`,
  tg: `<path d="M21 4 3 11l6 2 2 6 3-4 5 4z" ${S}/><path d="m9 13 9-7" ${S}/>`,
  ig: `<rect x="4" y="4" width="16" height="16" rx="5" ${S}/><circle cx="12" cy="12" r="3.6" ${S}/><path d="M16.8 7.2v.01" ${S}/>`,
  phone: `<path d="M5 4.5h3.5l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" ${S}/>`,
  pc: `<rect x="3" y="4" width="18" height="12" rx="2" ${S}/><path d="M8.5 20h7M12 16v4" ${S}/>`,
  crown: `<path d="m3.5 8 4.5 4 4-7 4 7 4.5-4-2 11h-13z" ${S}/>`,
  target: `<circle cx="12" cy="12" r="8.5" ${S}/><circle cx="12" cy="12" r="4.5" ${S}/><circle cx="12" cy="12" r=".9" fill="currentColor"/>`,
  pad: `<path d="M7.5 7.5h9a4.5 4.5 0 0 1 4.4 5.4l-.9 4.4a2.2 2.2 0 0 1-3.9 1L14.5 16h-5l-1.6 2.3a2.2 2.2 0 0 1-3.9-1l-.9-4.4a4.5 4.5 0 0 1 4.4-5.4z" ${S}/><path d="M8 10.5v3M6.5 12h3M15.5 11.5v.01M17.5 13v.01" ${S}/>`,
  moon: `<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" ${S}/>`,
  sun: `<circle cx="12" cy="12" r="4" ${S}/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" ${S}/>`,
  gift: `<rect x="3.5" y="9" width="17" height="11.5" rx="2" ${S}/><path d="M3.5 13h17M12 9v11.5M12 9c-1.6-3.5-5.5-4-5.5-1.5S9.5 9 12 9zm0 0c1.6-3.5 5.5-4 5.5-1.5S14.5 9 12 9z" ${S}/>`,
  users: `<circle cx="9" cy="8.5" r="3.3" ${S}/><path d="M3 19.5c1.1-3.2 3.3-4.8 6-4.8s4.9 1.6 6 4.8M15.5 5.6a3.2 3.2 0 0 1 0 6M17.5 14.9c1.6.6 2.8 2.1 3.5 4.6" ${S}/>`,
  card: `<rect x="3" y="5.5" width="18" height="13" rx="2.5" ${S}/><path d="M3 10h18M7 15h4" ${S}/>`,
  sync: `<path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1M17.5 3.5v3.6h-3.6M6.5 20.5v-3.6h3.6" ${S}/>`,
  cup: `<path d="M7.5 4h9v4.5a4.5 4.5 0 0 1-9 0zM7.5 6H4.5a3 3 0 0 0 3 3.5M16.5 6h3a3 3 0 0 1-3 3.5M12 13v3.5M8.5 20h7M9.5 20l.5-3.5h4l.5 3.5" ${S}/>`,
  chart: `<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" ${S}/>`,
  full: `<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" ${S}/>`,
  shrink: `<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" ${S}/>`,
  shield: `<path d="M12 3 19 6v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" ${S}/><path d="m9 12 2 2 4-4" ${S}/>`,
  bolt: `<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" ${S}/>`,
  head: `<path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3" ${S}/><rect x="3.5" y="13.5" width="4" height="6.5" rx="1.6" ${S}/><rect x="16.5" y="13.5" width="4" height="6.5" rx="1.6" ${S}/>`,
};
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><symbol id="iv-mark" viewBox="0 0 96 56">${MARK}</symbol>${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`)
  .join("")}</defs></svg>`;
const ic = (k, c = "") => `<svg class="ic${c ? " " + c : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;
const logo = (cls = "") => `<span class="logo-w ${cls}"><svg aria-hidden="true"><use href="#iv-mark"/></svg><b>INVIS</b></span>`;

/* Промо DevUz Studio: тот же знак, что на devuz.studio. */
const STAR = "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";
const DZSIGN = `<svg class="dz-sign" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false"><defs><linearGradient id="dzg" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset=".55" stop-color="#3B82F6"/><stop offset="1" stop-color="#22F0A0"/></linearGradient><mask id="dzc"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="${STAR}" fill="url(#dzg)" mask="url(#dzc)" style="opacity:var(--dz-fill,0)"/><path class="dz-stroke" d="${STAR}" pathLength="1000" fill="none" stroke="url(#dzg)" stroke-width="4" stroke-linejoin="round" mask="url(#dzc)"/><rect class="dz-caret" x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;

const LQ = `<svg class="lq-defs" aria-hidden="true" focusable="false"><filter id="lq" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.014" numOctaves="2" result="n"/><feGaussianBlur in="n" stdDeviation="2" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="22" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;

/* ── Данные для общих скриптов (core.js): зал, пакеты, колесо, подписи ── */
function coreData(l) {
  const t = T(l);
  return {
    lang: l,
    tg: D.BRAND.tg || "",
    systems: D.SYSTEMS.map((s) => s.name),
    zones: D.ZONES.map((z) => ({ id: z.id, n: L2(z.n, l), c: z.c, hour: z.hour, pack: z.pack, seats: z.seats })),
    packs: D.PACKS.map((p) => ({ id: p.id, n: L2(p.n, l), dur: p.dur, at: p.at ?? null, note: p.note ? L2(p.note, l) : "" })),
    wheel: { odds: D.WHEEL.map((o) => ({ id: o.id, p: o.p, hours: o.hours, c: o.c, tc: o.tc, short: L2(o.short, l), win: L2(o.win, l) })), sectors: D.SECTORS.map((s) => ({ ...s })) },
    me: D.ME,
    ui: {
      sum: t("сум", "so‘m"), synced: t("Синхронизировано с", "Sinxronlangan:"), system: t("Система клуба", "Klub tizimi"),
      day: t("День", "Kun"), today: t("Сегодня", "Bugun"), tomorrow: t("Завтра", "Ertaga"), duration: t("Пакет", "Paket"), start: t("Начало", "Boshlanishi"),
      map: t("Карта зала", "Zal xaritasi"), free: t("свободно", "bo‘sh"), busy: t("занято", "band"), yours: t("ваша бронь", "sizning broningiz"), freeNow: t("Свободно", "Bo‘sh"),
      pickSeat: t("Выберите свободное место на карте: время и пакет можно поменять, цена пересчитается.", "Xaritada bo‘sh joyni tanlang: vaqt va paketni o‘zgartirish mumkin, narx qayta hisoblanadi."),
      place: t("Место", "Joy"), when: t("Когда", "Qachon"), price: t("К оплате", "To‘lov"), book: t("Забронировать", "Bron qilish"),
      booked: t("Место ваше", "Joy sizniki"), bookedSync: t("Бронь записана в {sys}: администратор видит её в зале, место за вами. Это демо, настоящая бронь пойдёт после подключения.", "Bron {sys} tizimiga yozildi: administrator uni zalda ko‘radi, joy sizniki. Bu demo, haqiqiy bron ulangandan keyin ishlaydi."),
      tgText: t("Здравствуйте! Хочу забронировать {zone}, место {seat}, {when}", "Assalomu alaykum! {zone}, {seat}-joyni bron qilmoqchiman, {when}"), tgSend: t("Написать клубу в Telegram", "Klubga Telegramda yozish"),
      toCab: t("Открыть кабинет", "Kabinetni ochish"), justNow: t("только что", "hozirgina"), ago: t("{s} с назад", "{s} soniya oldin"),
      spin: t("Крутить", "Aylantirish"), spunToday: t("Сегодня уже крутили", "Bugun aylantirildi"), nextSpin: t("Следующая попытка завтра.", "Keyingi urinish ertaga."),
      odds: t("Шансы: ничего 65%, 1 час 25%, 2 часа 10%. Одна попытка в сутки на игрока, по времени Ташкента. Выигрыш сразу на бонусный счёт.", "Imkoniyatlar: hech narsa 65%, 1 soat 25%, 2 soat 10%. Har bir o‘yinchiga sutkada bir urinish, Toshkent vaqti bilan. Yutuq darhol bonus hisobiga tushadi."),
      resetSpin: t("Сбросить попытку (только для показа)", "Urinishni tiklash (faqat ko‘rsatish uchun)"),
    },
  };
}

/* ── Страница ─────────────────────────────────────────────────────────── */
const head = (kicker, h, lead, anim = "up") => `<div class="sec-head rv a-${anim}"><span class="kicker"><i></i>${kicker}</span><h2>${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>`;

function introHtml(l) {
  const t = T(l);
  const word = [["D", 0], ["e", 0], ["v", 0], ["U", 1], ["z", 1]];
  return `<div class="intro" id="intro" role="presentation">
<div class="dz-void"></div><div class="dz-grid"></div><div class="dz-glow"></div><div class="dz-ring"></div><div class="dz-flash"></div>
<div class="dz-stage">${DZSIGN}<div class="dz-name"><p class="dz-word" aria-hidden="true">${word.map(([c, a], i) => `<span${a ? ' class="a"' : ""} style="--i:${i}">${c}</span>`).join("")}</p><p class="dz-domain" aria-hidden="true">devuz.studio</p></div><div class="dz-bar" aria-hidden="true"></div><p class="dz-for">${t(`макет сайта для ${B}`, `${B} uchun sayt maketi`)}</p></div>
<canvas class="dz-code" aria-hidden="true"></canvas>
<canvas class="iv-cv" aria-hidden="true" data-logo="${esc(JSON.stringify(MARK_PATHS))}" data-name="${esc(t("компьютерный клуб · Фидокор 32/1", "kompyuter klubi · Fidokor 32/1"))}"></canvas>
<button type="button" class="in-skip" id="in-skip">${t("Пропустить", "O‘tkazib yuborish")}</button>
</div>`;
}

function heroBlock(l) {
  const t = T(l);
  const zones = D.ZONES.map((z) => `<li style="--zc:${z.c}"><span>${L2(z.n, l)}</span><b class="num" data-hz="${z.id}">${z.seats.length}</b></li>`).join("");
  return `<section class="hero" id="hero">
<div class="hero-bg" aria-hidden="true"><div class="hb-img" data-par="0.32"><img src="${IMG}/hero.webp" srcset="${IMG}/hero-s.webp 860w, ${IMG}/hero.webp 1600w" sizes="100vw" alt="" fetchpriority="high"></div><div class="hb-shade"></div><div class="hb-floor"><i></i></div></div>
<div class="hero-gpu" aria-hidden="true" data-par="-0.22">${gpuSvg("hg")}</div>
<div class="wrap hero-in">
<div class="hero-txt">
<p class="kicker light"><i></i>${t("Компьютерный клуб · Фидокор 32/1 · круглосуточно", "Kompyuter klubi · Fidokor 32/1 · kecha-kunduz")}</p>
<h1><span class="h1-brand">INVIS</span><span class="h1-l">${t("Твоё место в клубе. Бронь с телефона", "Klubdagi joying. Telefondan bron")}</span></h1>
<p class="lead">${t(`${L2(D.BRAND.slogan, "ru")}. Видно, какие ПК свободны прямо сейчас. Выбрал зону, время и пакет: место твоё и другому его не отдадут. Раз в день колесо бонусов дарит часы игры.`, `${L2(D.BRAND.slogan, "uz")}. Hozir qaysi kompyuterlar bo‘shligi ko‘rinib turadi. Zona, vaqt va paketni tanladingmi: joy seniki va boshqaga berilmaydi. Kuniga bir marta bonus g‘ildiragi o‘yin soatlarini sovg‘a qiladi.`)}</p>
<div class="hero-cta"><a class="btn btn-pri shim" href="#bron">${ic("pc")}<span>${t("Забронировать место", "Joy bron qilish")}</span></a><a class="btn btn-glass" href="#koleso">${ic("gift")}<span>${t("Колесо бонусов", "Bonus g‘ildiragi")}</span></a></div>
</div>
<div class="hero-card glass lq rv a-pop">
<p class="hc-k"><span class="dot" aria-hidden="true"></span>${t("Зал сейчас", "Zal hozir")}</p>
<p class="hc-n"><b class="num" id="hc-free">0</b><span>/ <span class="num" id="hc-all">${D.ZONES.reduce((s, z) => s + z.seats.length, 0)}</span> ${t("ПК и приставок свободно", "kompyuter va pristavka bo‘sh")}</span></p>
<ul class="hc-z">${zones}</ul>
<p class="hc-s">${ic("sync")}<span>${t(`Зал синхронизирован с системой клуба: ${D.SYSTEMS.slice(0, 3).map((s) => s.name).join(", ")} и другими`, `Zal klub tizimi bilan sinxronlangan: ${D.SYSTEMS.slice(0, 3).map((s) => s.name).join(", ")} va boshqalar`)}</span></p>
</div>
</div>
<div class="mq" aria-label="${t("Что есть в клубе и на сайте", "Klubda va saytda nima bor")}"><div class="mq-row">${[0, 1].map((k) => `<div class="mq-set"${k ? ' aria-hidden="true"' : ""}>${D.HOOKS.map((h) => `<span>${ic(h.i)}${L2(h.t, l)}</span>`).join("")}</div>`).join("")}</div></div>
</section>`;
}

/* ── Железо, нарисованное кодом: видеокарта, монитор, клавиатура, мышь, наушники ── */
function gpuSvg(id) {
  const fan = (x) => `<g transform="translate(${x} 70)"><circle r="44" fill="#0b0918" stroke="#2b2452" stroke-width="3"/><g class="fan">${Array.from({ length: 9 }, (_, i) => `<path d="M0 -6C12 -14 30 -20 38 -12C26 -12 14 -6 6 2Z" fill="url(#${id}b)" transform="rotate(${i * 40})"/>`).join("")}</g><circle r="11" fill="#14102e" stroke="url(#${id}r)" stroke-width="2.5"/></g>`;
  return `<svg viewBox="0 0 420 160" class="gpu" role="presentation"><defs><linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c8ff2e"/><stop offset=".5" stop-color="#2ee6ff"/><stop offset="1" stop-color="#ff064d"/></linearGradient><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2350"/><stop offset="1" stop-color="#120e28"/></linearGradient><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3270"/><stop offset="1" stop-color="#1b1640"/></linearGradient></defs>
<rect x="6" y="14" width="408" height="118" rx="16" fill="url(#${id}s)" stroke="#3a3270" stroke-width="2"/><g class="pins"><rect x="14" y="132" width="200" height="16" rx="3" fill="#c9a43a"/><path d="M14 136h200" stroke="#8a6e1f" stroke-width="2" stroke-dasharray="4 3"/></g>
<rect x="6" y="8" width="408" height="7" rx="3.5" fill="url(#${id}r)" class="rgb"/>${fan(84)}${fan(210)}${fan(336)}
<text x="398" y="124" text-anchor="end" font-size="10" fill="#7d76a8" font-family="Unbounded, sans-serif" letter-spacing="2">INVIS</text></svg>`;
}
function monitorSvg() {
  return `<svg viewBox="0 0 480 330" class="mon" role="presentation"><defs><linearGradient id="msk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0f5c"/><stop offset=".55" stop-color="#7a1f7a"/><stop offset=".56" stop-color="#090616"/><stop offset="1" stop-color="#14102e"/></linearGradient><linearGradient id="msun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe14a"/><stop offset="1" stop-color="#ff064d"/></linearGradient><clipPath id="mclip"><rect x="16" y="14" width="448" height="252" rx="6"/></clipPath></defs>
<rect x="4" y="2" width="472" height="276" rx="14" fill="#0b0918" stroke="#2b2452" stroke-width="3"/>
<g clip-path="url(#mclip)"><rect x="16" y="14" width="448" height="252" fill="url(#msk)"/><circle cx="240" cy="150" r="58" fill="url(#msun)"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="160" y="${118 + i * 11}" width="160" height="${3 + i}" fill="#2a0f5c"/>`).join("")}
<rect x="16" y="152" width="448" height="114" fill="#090616"/>
<g class="mgrid" stroke="#2ee6ff" stroke-opacity=".7" stroke-width="1.5">${Array.from({ length: 13 }, (_, i) => `<path d="M240 152L${-120 + i * 60} 266"/>`).join("")}${[158, 166, 178, 196, 222, 258].map((y) => `<path d="M16 ${y}H464"/>`).join("")}</g>
<g class="mhud" font-family="Unbounded, sans-serif" font-size="11" fill="#c8ff2e"><text x="30" y="36">HP 100</text><text x="450" y="36" text-anchor="end">00:42</text></g></g>
<path d="M204 278h72l14 34h-100z" fill="#1b1640"/><rect x="150" y="310" width="180" height="10" rx="5" fill="#2b2452"/></svg>`;
}
function kbSvg() {
  const keys = [];
  const rows = [[15, 0], [14, 9], [13, 14], [12, 22]];
  rows.forEach(([n, off], r) => { for (let i = 0; i < n; i++) keys.push(`<rect x="${14 + off + i * 26}" y="${14 + r * 26}" width="22" height="22" rx="4"/>`); });
  keys.push(`<rect x="100" y="118" width="180" height="22" rx="4"/>`);
  return `<svg viewBox="0 0 420 156" class="kb" role="presentation"><defs><linearGradient id="kbr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c8ff2e"/><stop offset=".33" stop-color="#2ee6ff"/><stop offset=".66" stop-color="#8a5cff"/><stop offset="1" stop-color="#ff064d"/></linearGradient></defs><rect x="2" y="2" width="416" height="150" rx="14" fill="#0b0918" stroke="url(#kbr)" stroke-width="3" class="rgb"/><g fill="#1d1645" stroke="#3a3270" stroke-width="1.2">${keys.join("")}</g><g fill="url(#kbr)" opacity=".85"><rect x="14" y="40" width="22" height="22" rx="4"/><rect x="40" y="40" width="22" height="22" rx="4"/><rect x="31" y="14" width="22" height="22" rx="4" transform="translate(-4 0)"/></g></svg>`;
}
function mouseSvg() {
  return `<svg viewBox="0 0 120 190" class="mouse" role="presentation"><defs><linearGradient id="msr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2ee6ff"/><stop offset="1" stop-color="#ff064d"/></linearGradient></defs><path d="M60 4C24 4 8 34 8 78v38c0 42 22 70 52 70s52-28 52-70V78C112 34 96 4 60 4z" fill="#14102e" stroke="#3a3270" stroke-width="3"/><path d="M60 6v64" stroke="#3a3270" stroke-width="3"/><rect x="54" y="26" width="12" height="26" rx="6" fill="url(#msr)" class="rgb"/><path d="M28 150c10 18 54 18 64 0" stroke="url(#msr)" stroke-width="4" fill="none" stroke-linecap="round" class="rgb"/></svg>`;
}
function headSvg() {
  return `<svg viewBox="0 0 220 210" class="hs" role="presentation"><defs><linearGradient id="hsr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8ff2e"/><stop offset="1" stop-color="#2ee6ff"/></linearGradient></defs><path d="M30 120V96a80 80 0 0 1 160 0v24" fill="none" stroke="#2b2452" stroke-width="16" stroke-linecap="round"/><path d="M30 104V96a80 80 0 0 1 160 0v8" fill="none" stroke="url(#hsr)" stroke-width="3" class="rgb"/><rect x="10" y="108" width="54" height="92" rx="24" fill="#14102e" stroke="#3a3270" stroke-width="3"/><rect x="156" y="108" width="54" height="92" rx="24" fill="#14102e" stroke="#3a3270" stroke-width="3"/><circle cx="37" cy="154" r="14" fill="none" stroke="url(#hsr)" stroke-width="3" class="rgb"/><circle cx="183" cy="154" r="14" fill="none" stroke="url(#hsr)" stroke-width="3" class="rgb"/><path d="M40 196c10 10 30 12 46 6" stroke="#3a3270" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
}

function setupBlock(l) {
  const t = T(l);
  const parts = D.GEAR.map((g, i) => `<li class="su-li" data-k="${i}"><b>${ic(g.i)}${L2(g.t, l)}</b><span>${L2(g.e, l)}</span></li>`).join("");
  return `<section id="setup" class="setup" data-tone="ink"><div class="su-sticky"><div class="wrap su-grid">
<div class="su-txt">
${head(t("Сетап", "Setap"), t("Железо, за которым не стыдно катать", "Uyalmasdan o‘ynasa bo‘ladigan temir"), t("Листайте: сетап собирается деталь за деталью. Здесь будут ваши видеокарты, мониторы и периферия с настоящими характеристиками: пришлёте список, впишем.", "Varaqlang: setap detalma-detal yig‘iladi. Bu yerda sizning videokartalaringiz, monitorlaringiz va periferiyangiz haqiqiy xususiyatlari bilan bo‘ladi: ro‘yxatni yuborsangiz, yozib qo‘yamiz."))}
<ol class="su-list">${parts}</ol>
</div>
<div class="su-stage" aria-hidden="true">
<div class="su-desk"></div>
<div class="su-p su-mon" data-from="0,-60,-14,.6">${monitorSvg()}</div>
<div class="su-p su-gpu" data-from="120,40,24,.5">${gpuSvg("sg")}</div>
<div class="su-p su-kb" data-from="-80,70,-18,.6">${kbSvg()}</div>
<div class="su-p su-mouse" data-from="90,60,30,.4">${mouseSvg()}</div>
<div class="su-p su-hs" data-from="-90,-40,22,.5">${headSvg()}</div>
<div class="su-glow"></div>
</div>
</div></div></section>`;
}

function zonesBlock(l) {
  const t = T(l);
  const card = (z, i) => `<article class="zc spot tilt rv a-${["rise", "tiltl", "tiltr", "pop"][i % 4]}" style="--zc:${z.c};--d:${i * 90}ms"${z.id === "vip" ? ' data-beam="1"' : ""}>
<div class="zc-ph"><div class="zc-img" data-par="0.12"><img src="${IMG}/${z.photo}-s.webp" srcset="${IMG}/${z.photo}-s.webp 640w, ${IMG}/${z.photo}.webp 1080w" sizes="(max-width: 760px) 92vw, 300px" alt="${esc(L2(z.alt, l))}" loading="lazy"></div><span class="zc-tag">${ic(z.i)}${z.seats.length} ${L2(z.unit, l)}</span></div>
<div class="zc-b"><h3>${L2(z.n, l)}</h3><p>${L2(z.e, l)}</p><p class="zc-p"><small>${t("от", "")}</small><b class="num">${grp(z.hour)}</b><small>${t("сум / час", "so‘m / soat")}</small></p></div></article>`;
  const rows = D.PACKS.map((p) => `<tr><th scope="row">${L2(p.n, l)}${p.note ? `<small>${L2(p.note, l)}</small>` : ""}</th>${D.ZONES.map((z) => `<td class="num">${grp(z.pack?.[p.id] ?? z.hour * p.dur)}</td>`).join("")}</tr>`).join("");
  return `<section id="zony" class="zones" data-tone="night"><div class="wrap">
${head(t("Зоны и цены", "Zonalar va narxlar"), t("Четыре зоны: от общего зала до буткемпа на пятерых", "To‘rt zona: umumiy zaldan beshtalik butkempgacha"), t("Цены в макете: середина рынка Ташкента по открытым прайсам клубов. Ваши цены подставим из системы клуба, они будут меняться в одном месте.", "Maketdagi narxlar: Toshkent klublarining ochiq narxlari bo‘yicha bozor o‘rtachasi. Narxlaringizni klub tizimidan qo‘yamiz, ular bitta joyda o‘zgaradi."))}
<div class="zc-grid">${D.ZONES.map(card).join("")}</div>
<div class="price glass rv a-up"><table><caption>${t("Прайс по пакетам, сум", "Paketlar bo‘yicha narxlar, so‘m")}</caption><thead><tr><th scope="col">${t("Пакет", "Paket")}</th>${D.ZONES.map((z) => `<th scope="col" style="--zc:${z.c}">${L2(z.n, l)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
<p class="src">${t("Абонемент (у клубов Ташкента не нашли, наше предложение):", "Abonement (Toshkent klublarida topilmadi, bizning taklif):")} ${D.ABON.map((a) => `${L2(a.n, l)} · <b class="num">${grp(a.price)}</b> ${t("сум", "so‘m")}`).join("; ")}. ${t("Час, ночь и пакеты: медиана 17 клубов Ташкента по их карточкам в Яндекс Картах, собраны 15.10.2026; утро и пакеты VIP, буткемпа и PS5 посчитаны в той же пропорции.", "Soat, tun va paketlar: Yandex Kartalardagi 17 ta Toshkent klubining medianasi, 15.10.2026 da yig‘ilgan; VIP, butkemp va PS5 ertalabki va paket narxlari shu nisbatda hisoblangan.")}</p></div>
</div></section>`;
}

function bookBlock(l) {
  const t = T(l);
  return `<section id="bron" class="book" data-tone="night"><div class="wrap">
${head(t("Бронь места", "Joy bron qilish"), t("Выбери ПК на карте зала", "Zal xaritasida kompyuter tanla"), t("Зелёные места свободны на выбранное время, серые заняты. Зал обновляется сам: данные идут из системы управления клубом, поэтому место не продадут дважды. В макете места и занятость демо.", "Yashil joylar tanlangan vaqtga bo‘sh, kulranglari band. Zal o‘zi yangilanadi: ma’lumot klubni boshqarish tizimidan keladi, shuning uchun joy ikki marta sotilmaydi. Maketda joylar va bandlik demo."))}
<div class="hall glass rv a-rise" id="hall"></div>
</div></section>`;
}

function wheelBlock(l) {
  const t = T(l);
  return `<section id="koleso" class="whs" data-tone="night"><div class="wrap wh-grid">
<div class="wh-box rv a-spin" id="wheel"></div>
<div class="wh-txt">
${head(t("Колесо бонусов", "Bonus g‘ildiragi"), t("Раз в день крути колесо: час или два игры в подарок", "Kuniga bir marta g‘ildirakni aylantir: bir yoki ikki soat o‘yin sovg‘a"), t("Исход решается до того, как колесо поедет, и оно останавливается ровно на нём. Сектора по размеру равны шансам. Выигрыш падает на бонусный счёт в кабинете, админ видит, сколько часов роздано и сколько из них уже отыграли.", "Natija g‘ildirak aylanishidan oldin hal bo‘ladi va u aynan shunda to‘xtaydi. Sektorlar hajmi imkoniyatlarga teng. Yutuq kabinetdagi bonus hisobiga tushadi, admin qancha soat berilgani va qanchasi o‘ynalganini ko‘radi."), "left")}
<ul class="wh-odds-l">${D.WHEEL.slice().reverse().map((o) => `<li style="--oc:${o.c}"><b class="num">${o.p}%</b><span>${L2(o.win, l)}</span></li>`).join("")}</ul>
</div>
</div></section>`;
}

function cabBlock(l) {
  const t = T(l);
  const feats = [
    ["card", t("Баланс и пополнение", "Balans va to‘ldirish"), t("Click, Payme, Uzum: деньги на счёте до прихода в клуб", "Click, Payme, Uzum: pul klubga kelishdan oldin hisobda")],
    ["pc", t("Мои брони", "Bronlarim"), t("перенос и отмена в два касания", "ikki bosishda ko‘chirish va bekor qilish")],
    ["clock", t("История посещений", "Tashriflar tarixi"), t("сколько играл и где", "qancha va qayerda o‘ynagan")],
    ["gift", t("Бонусы и колесо", "Bonuslar va g‘ildirak"), t("часы в подарок и уровни", "sovg‘a soatlar va darajalar")],
    ["users", t("Друзья", "Do‘stlar"), t("пригласи друга: по часу обоим", "do‘stingni taklif qil: ikkalangizga bir soatdan")],
  ];
  const adm = [
    ["pc", t("Зал в реальном времени", "Real vaqtdagi zal")], ["clock", t("Брони", "Bronlar")], ["users", t("Клиенты", "Mijozlar")], ["card", t("Тарифы и цены", "Tariflar va narxlar")], ["chart", t("Колесо: роздано и отыграно", "G‘ildirak: berilgan va o‘ynalgan")], ["shield", t("Смены и касса", "Smenalar va kassa")],
  ];
  return `<section id="kabinety" class="cabs" data-tone="night"><div class="wrap">
${head(t("Кабинеты", "Kabinetlar"), t("Кабинет игрока и пульт администратора", "O‘yinchi kabineti va administrator pulti"), t("Это работающие макеты: в телефоне кабинет игрока, справа пульт админа. Бронь, сделанная выше, уже появилась в обоих.", "Bular ishlaydigan maketlar: telefonda o‘yinchi kabineti, o‘ngda admin pulti. Yuqorida qilingan bron ikkalasida ham paydo bo‘ldi."))}
<div class="cab-grid">
<div class="cab-ph rv a-rise">
<div class="iph"><div class="iph-in"><div class="ibz"><div class="iscr"><iframe class="cab-frame" title="${t("Кабинет игрока", "O‘yinchi kabineti")}" data-src="${href(l, "kabinet")}?embed=1" loading="lazy"></iframe><span class="iisl" aria-hidden="true"></span></div></div></div></div>
<ul class="cab-f">${feats.map(([i, a, b]) => `<li>${ic(i)}<span><b>${a}</b><small>${b}</small></span></li>`).join("")}</ul>
<a class="btn btn-pri shim" href="${href(l, "kabinet")}">${ic("full")}<span>${t("Кабинет игрока во весь экран", "O‘yinchi kabineti to‘liq ekranda")}</span></a>
</div>
<div class="cab-ad rv a-tiltr">
<div class="brw"><div class="brw-bar" aria-hidden="true"><i></i><i></i><i></i><span>${B} · admin</span></div><iframe class="cab-frame" title="${t("Пульт администратора", "Administrator pulti")}" data-src="${href(l, "admin")}?embed=1" loading="lazy"></iframe></div>
<ul class="cab-a">${adm.map(([i, a]) => `<li>${ic(i)}<span>${a}</span></li>`).join("")}</ul>
<a class="btn btn-glass" href="${href(l, "admin")}">${ic("full")}<span>${t("Пульт администратора во весь экран", "Administrator pulti to‘liq ekranda")}</span></a>
</div>
</div>
</div></section>`;
}

function offerBlock(l) {
  const t = T(l);
  const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}"><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}${a.star ? `<em class="star">${t("клубы берут первым", "klublar birinchi oladi")}</em>` : ""}</b><small>${a[l].e}</small></span><span class="kit-p num">+${usd(a.price)}</span></label>`;
  return `<section id="predlozhenie" class="offer" data-tone="paper"><div class="wrap">
${head(`<span class="ours">${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</span>`, t("Сколько стоит такой сайт", "Bunday sayt qancha turadi"), t("Сайт без допов: страница клуба, зоны, цены, контакты, два языка. Допы включаются тумблерами, итог считается сразу и не выходит за 3 000 $.", "Qo‘shimchasiz sayt: klub sahifasi, zonalar, narxlar, kontaktlar, ikki til. Qo‘shimchalar tugmalar bilan yoqiladi, jami darhol hisoblanadi va 3 000 $ dan oshmaydi."))}
<div class="kit" id="konstruktor">
<div class="kit-list">
<div class="kit-base"><div><b>${SITE[l].t}</b><small>${SITE[l].e}</small></div><span class="num">${usd(SITE.price)}</span></div>
<h3 class="kit-g">${t("Допы: включайте, что нужно клубу", "Qo‘shimchalar: klubga keraklisini yoqing")}</h3>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side">
<div class="kit-total beam" id="kit-total">
<p class="kt-k">${t("Ваш расчёт", "Sizning hisobingiz")}</p>
<div class="kt-line"><span>${t("Сайт", "Sayt")}</span><span class="num">${usd(SITE.price)}</span></div>
<div class="kt-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kit-n">0</span></span><span class="num" id="kit-add">0 $</span></div>
<div class="kt-sum"><small>${t("Итого", "Jami")}</small><b class="num" id="kit-sum">${usd(SITE.price)}</b><small>${t(`со всеми допами ${usd(ALL)}`, `barcha qo‘shimchalar bilan ${usd(ALL)}`)}</small></div>
<button type="button" class="btn btn-white" id="kit-all">${t("Включить всё", "Hammasini yoqish")}</button>
<a class="btn btn-pri" id="kit-go" href="https://t.me/Devuz_studio_bot?start=invis">${ic("tg")}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
<button type="button" class="copy" id="kit-copy">${t("Скопировать состав", "Tarkibni nusxalash")}</button>
</div>
<p class="src">${t(`Сайт ${usd(SITE.price)}, со всеми допами ${usd(ALL)}, не больше ${usd(MAX)}. Цены допов: середина рынка веб-студий Ташкента и СНГ, источники в исследовании. Подписка на систему клуба, эквайринг Click и Payme, хостинг клуб оплачивает сам, в цену они не входят.`, `Sayt ${usd(SITE.price)}, barcha qo‘shimchalar bilan ${usd(ALL)}, ${usd(MAX)} dan oshmaydi. Qo‘shimchalar narxi: Toshkent va MDH veb-studiyalari bozor o‘rtachasi, manbalar tadqiqotda. Klub tizimiga obuna, Click va Payme ekvayringi, xostingni klub o‘zi to‘laydi, ular narxga kirmaydi.`)}</p>
</div>
</div>
</div></section>`;
}

function shell(l, body) {
  const t = T(l);
  const other = l === "ru" ? "uz" : "ru";
  const nav = [["#setup", t("Сетап", "Setap")], ["#zony", t("Зоны и цены", "Zonalar va narxlar")], ["#bron", t("Бронь", "Bron")], ["#koleso", t("Колесо", "G‘ildirak")], ["#kabinety", t("Кабинеты", "Kabinetlar")], ["#predlozhenie", t("Цена сайта", "Sayt narxi")]];
  const kit = { items: ADDONS.map((a) => ({ id: a.id, t: a[l].t, p: a.price })), base: SITE.price, baseName: SITE[l].t, copied: t("Скопировано", "Nusxalandi"), head: t(`Сайт компьютерного клуба ${B}, состав из конструктора:`, `${B} kompyuter klubi sayti, konstruktordan tarkib:`), total: t("Итого", "Jami") };
  const contacts = [
    [ic("pin"), L2(D.BRAND.addr, l)],
    D.BRAND.hours ? [ic("clock"), L2(D.BRAND.hours, l)] : null,
    D.BRAND.phone ? [ic("phone"), `<a href="tel:${D.BRAND.phone.replace(/\s/g, "")}">${D.BRAND.phone}</a>`] : null,
    D.BRAND.tg ? [ic("tg"), `<a href="https://t.me/${D.BRAND.tg}">@${D.BRAND.tg}</a>`] : null,
    D.BRAND.ig ? [ic("ig"), `<a href="https://instagram.com/${D.BRAND.ig}">@${D.BRAND.ig}</a>`] : null,
  ].filter(Boolean);
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t(`${B} · компьютерный клуб в Ташкенте · макет DevUz Studio`, `${B} · Toshkentdagi kompyuter klubi · DevUz Studio maketi`)}</title>
<meta name="description" content="${t("Макет сайта компьютерного клуба Invis: бронь ПК на карте зала с синхронизацией, зоны и цены, колесо бонусов, кабинеты игрока и администратора.", "Invis kompyuter klubi sayti maketi: zal xaritasida sinxron bron, zonalar va narxlar, bonus g‘ildiragi, o‘yinchi va administrator kabinetlari.")}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#090616">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="alternate" hreflang="${other}" href="${href(other)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="preload" as="image" href="${IMG}/hero-s.webp" media="(max-width: 860px)">
<script>(function(){var r=document.documentElement;r.classList.add('js');var off=false;try{if(sessionStorage.getItem('iv-intro'))off=true}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)off=true}catch(e){}if(off)r.classList.add('intro-off');else r.style.overflow='hidden'})()</script>
@@S@@
</head>
<body data-lang="${l}">
${LQ}
${SPRITE}
${introHtml(l)}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
<header class="top glass lq" id="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="${B}">${logo("lg")}</a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([u, n]) => `<a href="${u}">${n}</a>`).join("")}</nav>
<div class="top-r"><div class="lang"><a href="${href("ru")}" hreflang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz")}" hreflang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></div>
<a class="btn btn-ghost btn-sm" href="${href(l, "kabinet")}">${t("Кабинет", "Kabinet")}</a></div>
</div></header>
<main id="main">
${body}
</main>
<footer class="foot" data-tone="ink"><div class="wrap">
<div class="cols">
<div>${logo("f-logo")}<ul class="f-c">${contacts.map(([i, v]) => `<li>${i}<span>${v}</span></li>`).join("")}</ul></div>
<div><b>DevUz Studio</b><ul><li><a href="https://devuz.studio">devuz.studio</a></li><li><a href="https://t.me/Devuz_studio_bot?start=invis">Telegram</a></li></ul></div>
<div><b>${t("Данные макета", "Maket ma’lumotlari")}</b><ul><li>${t("Места, брони, клиенты и смены: демо", "Joylar, bronlar, mijozlar va smenalar: demo")}</li><li>${t("Цены: середина рынка Ташкента", "Narxlar: Toshkent bozori o‘rtachasi")}</li><li>${t(`Фото: ${D.PHOTO_CREDIT[0]}`, `Suratlar: ${D.PHOTO_CREDIT[1]}`)}</li><li>${t("Железо нарисовано кодом", "Temir kod bilan chizilgan")}</li></ul></div>
</div>
<div class="rights"><span>${t(`Это макет: так может выглядеть сайт клуба ${B}. Знак временный: пришлёте логотип, и он встанет везде. Места, брони, клиенты, смены и характеристики железа придуманы для показа, в работе их отдаёт система управления клубом.`, `Bu maket: ${B} klubi sayti shunday ko‘rinishi mumkin. Belgi vaqtincha: logotipni yuborsangiz, hamma joyga qo‘yiladi. Joylar, bronlar, mijozlar, smenalar va temir xususiyatlari ko‘rsatish uchun o‘ylab topilgan, ishda ularni klubni boshqarish tizimi beradi.`)}</span><span>${t("Макет принадлежит DevUz Studio. Использовать его можно только по договору:", "Maket DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:")} <a href="${TERMS(l)}">${t("условия использования", "foydalanish shartlari")}</a></span></div>
</div></footer>
<div class="dock glass lq" id="dock"><a class="btn btn-pri shim" href="#bron">${ic("pc")}<span>${t("Забронировать место", "Joy bron qilish")}</span></a></div>
<script type="application/json" id="iv-data">${json(coreData(l))}</script>
<script type="application/json" id="kit-data">${json(kit)}</script>
<script>
${strip(read("intro.js"))}</script>
@@Q@@
@@J@@
</body>
</html>`;
}

function site(l) {
  return shell(l, [heroBlock(l), setupBlock(l), zonesBlock(l), bookBlock(l), wheelBlock(l), cabBlock(l), offerBlock(l)].join("\n"));
}

/* ── Кабинеты: игрока и администратора ─────────────────────────────────── */
function cabPage(l, kind) {
  const t = T(l);
  const data = { ...cabData(l, kind) };
  const title = kind === "player" ? t(`Кабинет игрока ${B}`, `${B} o‘yinchi kabineti`) : t(`Пульт администратора ${B}`, `${B} administrator pulti`);
  return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="theme-color" content="#090616"><title>${title} · ${t("макет DevUz Studio", "DevUz Studio maketi")}</title><meta name="description" content="${kind === "player" ? t("Кабинет игрока: баланс и пополнение, брони, история, бонусы, колесо, друзья.", "O‘yinchi kabineti: balans va to‘ldirish, bronlar, tarix, bonuslar, g‘ildirak, do‘stlar.") : t("Пульт администратора: зал в реальном времени, брони, клиенты, тарифы, колесо, смены.", "Administrator pulti: real vaqtdagi zal, bronlar, mijozlar, tariflar, g‘ildirak, smenalar.")}"><link rel="icon" type="image/png" href="${IMG}/icon-192.png"><link rel="apple-touch-icon" href="${IMG}/apple-180.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${FONTS}">@@C@@</head><body class="cab cab-${kind}" data-lang="${l}">
${SPRITE}
<div class="cb" id="cb"></div>
<p class="cb-legal">${t("Макет DevUz Studio: данные демо.", "DevUz Studio maketi: ma’lumotlar demo.")} <a href="${TERMS(l)}">${t("Условия использования", "Foydalanish shartlari")}</a></p>
<script type="application/json" id="iv-data">${json(coreData(l))}</script>
<script type="application/json" id="cab-data">${json(data)}</script>
@@Q@@
@@K@@
</body></html>`;
}

function cabData(l, kind) {
  const t = T(l);
  const L = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) && v.length === 2 && typeof v[0] === "string" ? L2(v, l) : v]));
  return {
    kind, brand: B, site: href(l), other: href(l === "ru" ? "uz" : "ru", kind === "player" ? "kabinet" : "admin"), lang: l,
    playerUrl: href(l, "kabinet"), adminUrl: href(l, "admin"),
    pay: D.PAYS, tops: D.TOPUPS, topBonus: D.TOP_BONUS,
    history: D.HISTORY.map(L), friends: D.FRIENDS.map(L), levels: D.LEVELS.map(L), invite: D.INVITE,
    nicks: D.NICKS, clients: D.CLIENTS.map(L), shifts: D.SHIFTS.map(L), stats: D.STATS, admins: D.ADMINS,
    tr: Object.fromEntries(Object.entries(D.CAB_UI).map(([k, v]) => [k, L2(v, l)])),
  };
}

const out = {
  "": site("ru"), uz: site("uz"),
  kabinet: cabPage("ru", "player"), "uz/kabinet": cabPage("uz", "player"),
  admin: cabPage("ru", "admin"), "uz/admin": cabPage("uz", "admin"),
};
const parts = {
  S: `<style>${min(read("site.css") + read("core.css")).replace(/__IMG__/g, IMG)}</style>`,
  C: `<style>${min(read("cab.css") + read("core.css"))}</style>`,
  Q: `<script>\n${strip(read("core.js"))}</script>`,
  J: `<script>\n${strip(read("site.js"))}</script>`,
  K: `<script>\n${strip(read("cab.js"))}</script>`,
};
const fill = (page) => Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), page);

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, fill(v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "invis.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(12), fill(v).length);
