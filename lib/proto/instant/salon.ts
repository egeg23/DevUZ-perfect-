/**
 * Шаблон «Салон красоты» для «Макета в боте».
 *
 * Владелец, 11.11.2026: «влетаем в дверь (над дверью вывеска с красивым
 * шрифтом компании)… мимо ресепшен с администратором… к женщине на стрижке
 * (тут указывается стоимость услуг)… за волосом к девушке, которая делает
 * ногти… на покраску волос… и потом крутой переход к сайту… Можно за основу
 * взять каплю лака, которая падает через всю страницу, потом падает на
 * ноготь, где мы можем выбрать цвет покрытия… Удиви меня».
 *
 * Своего макета салона у нас нет, поэтому сайт собран здесь, а не взят из
 * сборки: пролёт ниши (`fly.ts`, шесть глав, цены клиента у стрижки, ногтей и
 * окрашивания), в конце кадр закрывает капля цвета клиента, и ею же
 * начинается сайт. Дальше капля падает через страницу (прилипает к экрану,
 * пока листают) и приземляется на ноготь в «Подборе цвета».
 *
 * Данные — только клиента: услуги, цены, мастера, адрес. Оттенки лака и виды
 * покрытия — наш набор для примерки, марок не называем: какие у салона, мы
 * не знаем.
 */
import media from "@/content/proto-instant/salon-krasoty-media.json" with { type: "json" };
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { rgbOf } from "@/lib/proto/instant/dental";
import { flyParts, flyReady } from "@/lib/proto/instant/fly";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";
import { LIMITS, type InstantLocale, type InstantService, type InstantSite, type BaseSite } from "@/lib/proto/instant/types";

const IMG = "/protos/_niche/salon-krasoty";
/** Нейтральные фото ниши — ключевые кадры пролёта: зал, стрижка, маникюр, окрашивание. */
export const SALON_PHOTOS = [2, 3, 4, 5].map((k) => `${IMG}/k${k}-16.webp`);

type Pair = { ru: string; uz: string };
const P = (ru: string, uz: string): Pair => ({ ru, uz });

const C = {
  kind: P("Салон красоты", "Go‘zallik saloni"),
  fly: P("Прогулка по салону", "Salon bo‘ylab sayr"),
  welcome: P("Добро пожаловать", "Xush kelibsiz"),
  meet: [P("Вас встретят", "Sizni kutib olishadi"), P("и проводят к мастеру", "va ustaga kuzatib qo‘yishadi")],
  cut: P("Стрижка", "Soch turmagi"),
  nails: P("Маникюр и покрытие", "Manikyur va qoplama"),
  color: P("Окрашивание", "Soch bo‘yash"),
  ask: P("цену подскажем при записи", "narxini yozilishda aytamiz"),
  nav: { services: P("Услуги", "Xizmatlar"), lab: P("Цвет", "Rang"), book: P("Запись", "Yozilish"), contact: P("Контакты", "Aloqa") },
  sections: P("Разделы", "Bo‘limlar"),
  book: P("Записаться", "Yozilish"),
  call: P("Позвонить", "Qo‘ng‘iroq"),
  lead: P("Стрижки, окрашивание и маникюр в одном месте. Выберите услугу и удобное время.", "Soch turmagi, bo‘yash va manikyur bir joyda. Xizmat va qulay vaqtni tanlang."),
  servicesH: P("Услуги и цены", "Xizmatlar va narxlar"),
  servicesSub: P("Цены салона. Точную сумму мастер назовёт до начала работы.", "Salon narxlari. Aniq summani usta ish boshlashdan oldin aytadi."),
  noPrice: P("цена при записи", "narxi yozilishda"),
  pick: P("Выбрать", "Tanlash"),
  roomH: P("Как у нас", "Bizda qanday"),
  roomSub: P("Кадры для примера: на сайте будут фото вашего салона.", "Kadrlar namuna uchun: saytda saloningiz rasmlari bo‘ladi."),
  worksH: P("Наши работы", "Ishlarimiz"),
  worksSub: P("Кадры для примера: на сайте будут фото ваших работ.", "Kadrlar namuna uchun: saytda sizning ishlaringiz bo‘ladi."),
  baH: P("До и после", "Oldin va keyin"),
  baSub: P("Потяните ползунок: так гость видит результат окрашивания.", "Slayderni suring: mehmon bo‘yash natijasini shunday ko‘radi."),
  before: P("До", "Oldin"),
  after: P("После", "Keyin"),
  revH: P("Отзывы гостей", "Mehmonlar fikri"),
  revSub: P("Примеры для макета. На сайте будут настоящие отзывы ваших гостей с карт и из Instagram.", "Maket uchun namunalar. Saytda mehmonlaringizning xaritalar va Instagramdagi haqiqiy fikrlari bo‘ladi."),
  revTag: P("Пример отзыва", "Fikr namunasi"),
  mastersH: P("Мастера", "Ustalar"),
  perksH: P("Почему к нам возвращаются", "Nega bizga qaytishadi"),
  labKick: P("Примерка", "Sinab ko‘rish"),
  labH: P("Подберите цвет до визита", "Tashrifdan oldin rang tanlang"),
  labSub: P("Капля упала на ноготь. Выберите оттенок и покрытие, мастер подготовит их к вашему приходу.", "Tomchi tirnoqqa tushdi. Rang va qoplamani tanlang, usta ularni kelishingizga tayyorlab qo‘yadi."),
  shade: P("Оттенок", "Rang"),
  finish: P("Покрытие", "Qoplama"),
  base: P("Основа", "Asos"),
  labNote: P("Оттенки для примерки. Палитру и марки вашего салона поставим на рабочем сайте.", "Ranglar sinab ko‘rish uchun. Saloningiz palitrasi va markalarini ishchi saytga qo‘yamiz."),
  labGo: P("Записаться с этим цветом", "Shu rang bilan yozilish"),
  bookH: P("Запись за минуту", "Bir daqiqada yozilish"),
  bookSub: P("Выберите услугу, день и время. Заявка откроется в чате салона.", "Xizmat, kun va vaqtni tanlang. Ariza salon chatida ochiladi."),
  service: P("Услуга", "Xizmat"),
  any: P("Подскажите, что выбрать", "Nima tanlashni ayting"),
  day: P("День", "Kun"),
  time: P("Время", "Vaqt"),
  yourName: P("Ваше имя", "Ismingiz"),
  yourPhone: P("Телефон", "Telefon"),
  send: P("Отправить заявку", "Ariza yuborish"),
  need: P("Напишите имя и телефон", "Ism va telefonni yozing"),
  sent: P("Текст заявки скопирован. На рабочем сайте запись сама попадёт администратору, а вам придёт напоминание.", "Ariza matni nusxalandi. Ishchi saytda yozuv o‘zi administratorga tushadi, sizga esa eslatma keladi."),
  demoH: P("Так запись придёт вам в Telegram", "Yozuv sizga Telegramda shunday keladi"),
  demoNew: P("Новая запись", "Yangi yozuv"),
  demoWho: P("Клиент", "Mijoz"),
  demoWish: P("Пожелание", "Istak"),
  demoOk: P("Подтвердить", "Tasdiqlash"),
  demoMove: P("Перенести", "Ko‘chirish"),
  contactH: P("Где мы", "Biz qayerdamiz"),
  hours: P("Часы работы", "Ish vaqti"),
  write: P("Написать", "Yozish"),
  mockup: P("Это макет DevUz Studio.", "Bu DevUz Studio maketi."),
  terms: P("Условия использования", "Foydalanish shartlari"),
  source: P("Данные:", "Ma’lumot:"),
  toMain: P("К услугам", "Xizmatlarga"),
  hello: P("Здравствуйте! Хочу записаться.", "Assalomu alaykum! Yozilmoqchiman."),
  today: P("Сегодня", "Bugun"),
  tomorrow: P("Завтра", "Ertaga"),
};

/** Оттенки для примерки: названия наши, чисел и марок нет. */
const SHADES: { c: string; n: Pair }[] = [
  { c: "#e9c4b8", n: P("Нюд", "Nyud") },
  { c: "#f2d6d3", n: P("Пудра", "Pudra") },
  { c: "#d98a8f", n: P("Пыльная роза", "Changli atirgul") },
  { c: "#b23a48", n: P("Вишня", "Olcha") },
  { c: "#7a1f2b", n: P("Бордо", "Bordo") },
  { c: "#c96f4a", n: P("Терракота", "Terrakota") },
  { c: "#8a9a7b", n: P("Шалфей", "Marmarak") },
  { c: "#5b6c8f", n: P("Джинс", "Jins") },
  { c: "#3a2a2e", n: P("Шоколад", "Shokolad") },
  { c: "#f6f1ea", n: P("Молоко", "Sut") },
];
const FINISH: { id: string; n: Pair }[] = [
  { id: "gloss", n: P("Глянец", "Yaltiroq") },
  { id: "matte", n: P("Матовый", "Xira") },
  { id: "cat", n: P("Кошачий глаз", "Mushuk ko‘zi") },
  { id: "french", n: P("Френч", "French") },
];
const BASE: Pair[] = [P("Гель-лак", "Gel-lak"), P("Укрепление базой", "Baza bilan mustahkamlash"), P("Наращивание", "Uzaytirish")];

/** Цвет клиента — цвет капли. Нет цвета — глубокая роза. Переменные в hsl: их сдвигает отпечаток. */
function palette(color: string | null): string {
  const hex = brandColor(color);
  const [h, s0, l0] = hex ? hexToHsl(hex) : [345, 42, 44];
  const s = Math.min(Math.max(s0, 28), 62);
  const l = Math.min(Math.max(l0, 34), 48);
  return [`--ac:hsl(${h} ${s}% ${l}%)`, `--ac2:hsl(${h} ${Math.min(s + 8, 70)}% ${Math.min(l + 26, 80)}%)`, `--ac-rgb:${rgbOf(h, s, l)}`, `--wash:hsl(${h} 38% 95%)`].join(";");
}

const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
const I = (d: string) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  cal: I('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  pin: I('<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.800 7 11 7 11z"/><circle cx="12" cy="10" r="2.500"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  chat: I('<path d="M21 12a8 8 0 0 1-11.800 7L4 20l1.200-4.400A8 8 0 1 1 21 12z"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
};
const WORKS = [1, 2, 3, 4, 5, 6].map((k) => `${IMG}/w${k}.webp`);
/** Куда падает капля на фото руки: ноготь среднего пальца, доли кадра (пишет hand.py). */
const HAND = { x: 64.04, y: 15.63 };
const REVIEWS: { who: Pair; text: Pair }[] = [
  { who: P("Мадина", "Madina"), text: P("Записалась на сайте вечером, утром уже была у мастера. Цвет получился ровно такой, как на примерке.", "Kechqurun saytda yozildim, ertalab ustada edim. Rang primerkadagi kabi chiqdi.") },
  { who: P("Камола", "Kamola"), text: P("Удобно, что цену видно до визита, а напоминание пришло в Telegram. Маникюр держится отлично.", "Narx tashrifdan oldin ko‘rinishi qulay, eslatma Telegramga keldi. Manikyur juda yaxshi turibdi.") },
  { who: P("Нигора", "Nigora"), text: P("Выбрала оттенок прямо на сайте, мастер подготовил его к моему приходу. Вернусь ещё.", "Rangni saytning o‘zida tanladim, usta kelishimga tayyorlab qo‘ydi. Yana kelaman.") },
];
const DROP = `<svg viewBox="0 0 40 58" aria-hidden="true"><defs><radialGradient id="dg" cx="36%" cy="64%" r="72%"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient></defs><path class="dp" d="M20 2C20 2 5 24 5 38a15 15 0 0 0 30 0C35 24 20 2 20 2z"/><path fill="url(#dg)" d="M20 2C20 2 5 24 5 38a15 15 0 0 0 30 0C35 24 20 2 20 2z"/><ellipse cx="13.4" cy="35" rx="3" ry="7.4" fill="#fff" opacity=".82" transform="rotate(17 13.4 35)"/><circle cx="15.4" cy="46.6" r="1.5" fill="#fff" opacity=".6"/><path d="M28.4 45.5a9.5 9.5 0 0 1-8 6.6" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="1.5" stroke-linecap="round"/></svg>`;

/** Услуга клиента по слову: глава пролёта называет её и её цену, своих цен не пишем. */
const pickService = (list: InstantService[], re: RegExp) => list.find((s) => re.test(s.name)) ?? null;

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/build, normalizeSite). */
export function salonHtml(site: BaseSite): string {
  const l: InstantLocale = site.locale;
  const t = (p: Pair) => p[l];
  const name = esc(site.name);
  const tel = telHref(site.phone);
  const tg = handleOf(site.telegram);
  const wa = waHref(site.whatsapp);
  const ig = handleOf(site.instagram);
  const logo = imageUrl(site.logo);
  const chat = tg ? `https://t.me/${tg}` : wa;
  const services = site.services.slice(0, LIMITS.services);
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u)).slice(0, 4);
  const photos = own.length >= 2 ? own : flyReady(media) ? SALON_PHOTOS : [];
  const mark = logo ? `<img src="${esc(logo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"><b>${name}</b>` : `<b>${name}</b>`;

  const cut = pickService(services, /стриж|укладк|soch|turmak|haircut/i);
  const nails = pickService(services, /маник|ногт|покрыт|гель|tirnoq|manik|педик/i);
  const dye = pickService(services, /окраш|покрас|колор|тонир|мелир|bo‘ya|bo'ya|color/i);
  const chapter = (at: number, s: InstantService | null, fallback: Pair) => ({ at, a: s?.name ?? t(fallback), b: s?.price ?? t(C.ask) });
  const fly = flyParts({
    locale: l, img: IMG, media, label: t(C.fly), fin: "center", drop: true,
    sign: `${logo ? `<img src="${esc(logo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}<b>${name}</b>`,
    btn: "btn btn-w", accent: "var(--ac)", hd: "'Cormorant Garamond',Georgia,serif", tx: "'Onest',sans-serif", to: "top",
    chapters: [
      { at: 0.05, a: site.name, b: site.city ?? t(C.welcome) },
      { at: 0.2, a: t(C.meet[0]), b: t(C.meet[1]) },
      chapter(0.38, cut, C.cut),
      chapter(0.55, nails, C.nails),
      chapter(0.73, dye, C.color),
      { at: 0.92, a: site.name, b: site.tagline ?? site.city ?? "" },
    ],
  });

  const nav: [string, Pair][] = [...(services.length ? [["services", C.nav.services] as [string, Pair]] : []), ["lab", C.nav.lab], ["book", C.nav.book], ["contact", C.nav.contact]];
  const header = `<header class="top" id="hdr"><div class="top-in">
<a class="logo" href="#top" aria-label="${name}">${mark}</a>
<nav aria-label="${t(C.sections)}">${nav.map(([id, n]) => `<a href="#${id}">${t(n)}</a>`).join("")}</nav>
<a class="btn btn-a btn-s" href="#book">${ICON.cal}<span>${t(C.book)}</span></a>
</div></header>`;

  const hero = `<section class="hero" id="top" aria-label="${name}">
<div class="wrap hero-in">
<p class="kick">${esc(site.city ? `${t(C.kind)} · ${site.city}` : t(C.kind))}</p>
<h1>${name}</h1>
<p class="hsub">${esc(site.tagline ?? site.about ?? t(C.lead))}</p>
<div class="acts"><a class="btn btn-w" href="#book">${ICON.cal}<span>${t(C.book)}</span></a>${tel ? `<a class="btn btn-o" href="${esc(tel)}">${ICON.phone}<span>${esc(site.phone ?? t(C.call))}</span></a>` : ""}</div>
</div>
<svg class="drips" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0h1440v40c-40 0-50 60-90 60s-40-70-90-70-50 100-100 100-50-110-100-110-40 50-80 50-50-40-90-40-40 90-90 90-50-80-100-80-40 40-80 40-50-60-100-60-40 100-90 100-50-90-100-90-40 60-80 60-50-50-90-50-40 30-60 30z"/></svg>
<div class="drs" aria-hidden="true">${[[6, 22, 1.0, 190], [17, 14, 0.55, 150], [29, 26, 1.25, 205], [44, 16, 0.7, 165], [58, 24, 1.1, 200], [71, 12, 0.5, 148], [83, 22, 0.95, 192], [93, 14, 0.65, 158]].map(([x, w, k, h], i) => `<i style="left:${x}%;width:${w}px;height:${h}px" data-k="${k}" data-i="${i}"></i>`).join("")}</div>
</section>`;

  const servicesSec = services.length
    ? `<section class="sec" id="services"><div class="wrap">
<header class="sh rv"><h2>${t(C.servicesH)}</h2><p>${t(C.servicesSub)}</p></header>
<ul class="list">${services
        .map((s, i) => `<li class="rv" style="--d:${i % 6}"><span class="ln">${esc(s.name)}</span><i></i><span class="lp">${s.price ? esc(s.price) : t(C.noPrice)}</span><button type="button" class="chip" data-pick="${esc(s.name)}">${t(C.pick)}</button></li>`)
        .join("")}</ul>
</div></section>`
    : "";

  const room = photos.length
    ? `<section class="sec room" aria-label="${t(C.roomH)}"><div class="wrap">
<header class="sh rv"><h2>${t(C.roomH)}</h2>${own.length >= 2 ? "" : `<p>${t(C.roomSub)}</p>`}</header>
<div class="shots">${photos.map((src, i) => `<figure class="rv" style="--d:${i}"><img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-par></figure>`).join("")}</div>
</div></section>`
    : "";

  const works = flyReady(media)
    ? `<section class="sec" id="works"><div class="wrap">
<header class="sh rv"><h2>${t(C.worksH)}</h2><p>${t(C.worksSub)}</p></header>
<div class="works">${WORKS.map((src, i) => `<figure class="rv" style="--d:${i % 3}"><img src="${src}" alt="" loading="lazy" width="900" height="1117"></figure>`).join("")}</div>
<div class="ba-w rv"><div class="ba-t"><h3>${t(C.baH)}</h3><p>${t(C.baSub)}</p></div>
<div class="ba" id="ba" style="--p:50%"><img src="${IMG}/ba-after.webp" alt="" loading="lazy" width="1000" height="1241"><div class="ba-b"><img src="${IMG}/ba-before.webp" alt="" loading="lazy" width="1000" height="1241"></div><span class="ba-l ba-l1">${t(C.before)}</span><span class="ba-l ba-l2">${t(C.after)}</span><i class="ba-h"></i><input type="range" min="0" max="100" value="50" aria-label="${t(C.baH)}"></div></div>
</div></section>`
    : "";

  const reviews = `<section class="sec" aria-label="${t(C.revH)}"><div class="wrap">
<header class="sh rv"><h2>${t(C.revH)}</h2><p>${t(C.revSub)}</p></header>
<div class="revs">${REVIEWS.map((r, i) => `<figure class="rv" style="--d:${i}"><span class="rtag">${t(C.revTag)}</span><blockquote>${t(r.text)}</blockquote><figcaption><span class="av" aria-hidden="true">${t(r.who).slice(0, 1)}</span>${t(r.who)}</figcaption></figure>`).join("")}</div>
</div></section>`;

  const masters = site.doctors.length
    ? `<section class="sec" aria-label="${t(C.mastersH)}"><div class="wrap">
<header class="sh rv"><h2>${t(C.mastersH)}</h2></header>
<div class="people">${site.doctors.slice(0, LIMITS.doctors).map((d, i) => `<article class="rv" style="--d:${i % 4}"><span class="av" aria-hidden="true">${esc(d.name.slice(0, 1))}</span><b>${esc(d.name)}</b>${d.role ? `<span>${esc(d.role)}</span>` : ""}</article>`).join("")}</div>
</div></section>`
    : "";

  const perks = site.perks.length
    ? `<section class="sec" aria-label="${t(C.perksH)}"><div class="wrap">
<header class="sh rv"><h2>${t(C.perksH)}</h2></header>
<ul class="perks">${site.perks.slice(0, LIMITS.perks).map((p, i) => `<li class="rv" style="--d:${i % 4}">${esc(p)}</li>`).join("")}</ul>
</div></section>`
    : "";

  const lab = `<section class="lab" id="lab"><div class="wrap lab-in">
<div class="lab-t">
<p class="kick rv">${t(C.labKick)}</p>
<h2 class="rv">${t(C.labH)}</h2>
<p class="rv">${t(C.labSub)}</p>
<div class="row rv"><span class="lbl">${t(C.shade)}: <b id="sh-n">${t(SHADES[0].n)}</b></span><div class="sws" role="radiogroup" aria-label="${t(C.shade)}">${SHADES.map((s, i) => `<button type="button" role="radio" aria-checked="${i === 0}" class="sw${i === 0 ? " on" : ""}" style="--c:${s.c}" data-c="${s.c}" data-n="${esc(t(s.n))}" aria-label="${esc(t(s.n))}"></button>`).join("")}</div></div>
<div class="row rv"><span class="lbl">${t(C.finish)}</span><div class="chips" role="radiogroup" aria-label="${t(C.finish)}">${FINISH.map((f, i) => `<button type="button" role="radio" aria-checked="${i === 0}" class="chip${i === 0 ? " on" : ""}" data-f="${f.id}">${t(f.n)}</button>`).join("")}</div></div>
<div class="row rv"><span class="lbl">${t(C.base)}</span><div class="chips" role="radiogroup" aria-label="${t(C.base)}">${BASE.map((b, i) => `<button type="button" role="radio" aria-checked="${i === 0}" class="chip${i === 0 ? " on" : ""}" data-b="${esc(t(b))}">${t(b)}</button>`).join("")}</div></div>
<p class="note rv">${t(C.labNote)}</p>
<a class="btn btn-w rv" href="#book" id="lab-go">${t(C.labGo)}${ICON.arrow}</a>
</div>
<div class="lab-v" aria-hidden="true">
<div class="hand" id="nail" data-f="gloss" style="--tx:${HAND.x}%;--ty:${HAND.y}%"><img src="${IMG}/hand.webp" alt="" loading="lazy" width="900" height="1205"><span class="hn"></span><span class="ht"></span><span class="hg"></span><span class="splash"></span></div>
</div>
</div></section>`;

  const book = `<section class="sec" id="book"><div class="wrap book">
<div>
<header class="sh rv"><h2>${t(C.bookH)}</h2><p>${t(C.bookSub)}</p></header>
<form class="form rv" id="form" novalidate>
<label><span>${t(C.service)}</span><select id="f-s"><option value="">${t(C.any)}</option>${services.map((s) => `<option>${esc(s.name)}</option>`).join("")}</select></label>
<div class="fl"><span>${t(C.day)}</span><div class="chips" id="f-d"></div></div>
<div class="fl"><span>${t(C.time)}</span><div class="chips" id="f-t"></div></div>
<div class="two"><label><span>${t(C.yourName)}</span><input id="f-n" autocomplete="name"></label><label><span>${t(C.yourPhone)}</span><input id="f-p" type="tel" inputmode="tel" autocomplete="tel"></label></div>
<p class="pickd" id="f-c" hidden></p>
<button type="submit" class="btn btn-a">${ICON.chat}<span>${t(C.send)}</span></button>
<p class="msg" id="f-m" role="status" aria-live="polite"></p>
</form>
</div>
<aside class="demo rv" aria-label="${t(C.demoH)}"><p class="dt">${t(C.demoH)}</p>
<div class="tg"><b>${t(C.demoNew)}</b>
<span>${t(C.demoWho)}: [[t:0]]</span>
<span>${t(C.service)}: ${esc(services[0]?.name ?? t(C.nails))}</span>
<span>${t(C.demoWish)}: «[[t:1]]»</span>
<div class="kb"><i>${t(C.demoOk)}</i><i>${t(C.demoMove)}</i></div></div>
</aside>
</div></section>`;

  const links = [
    tel ? `<a href="${esc(tel)}">${ICON.phone}<span>${esc(site.phone ?? "")}</span></a>` : "",
    tg ? `<a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">${ICON.chat}<span>Telegram</span></a>` : "",
    wa ? `<a href="${esc(wa)}" target="_blank" rel="noopener">${ICON.chat}<span>WhatsApp</span></a>` : "",
    ig ? `<a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">${ICON.arrow}<span>Instagram</span></a>` : "",
  ].join("");
  const contact = `<section class="sec" id="contact"><div class="wrap">
<header class="sh rv"><h2>${t(C.contactH)}</h2></header>
<div class="cards">
${site.address ? `<div class="card rv">${ICON.pin}<b>${esc(site.address)}</b></div>` : ""}
${site.hours ? `<div class="card rv" style="--d:1">${ICON.clock}<b>${esc(site.hours)}</b><span>${t(C.hours)}</span></div>` : ""}
${links ? `<div class="card rv links" style="--d:2">${links}</div>` : ""}
</div></div></section>`;

  const footer = `<footer class="foot"><div class="wrap"><span>© ${name}</span><span>${t(C.mockup)} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${t(C.terms)}</a></span><span>${t(C.source)} ${esc(site.source)}</span></div></footer>`;
  const dock = `<div class="dock" id="dock"><a class="btn btn-a" href="#book">${ICON.cal}<span>${t(C.book)}</span></a>${tel ? `<a class="btn btn-o" href="${esc(tel)}" aria-label="${t(C.call)}">${ICON.phone}</a>` : ""}</div>`;

  const data = {
    l,
    chat: chat ?? "",
    tel: tel ?? "",
    hello: t(C.hello),
    need: t(C.need),
    sent: t(C.sent),
    today: t(C.today),
    tomorrow: t(C.tomorrow),
    wd: l === "ru" ? ["вс", "пн", "вт", "ср", "чт", "пт", "сб"] : ["yak", "dush", "sesh", "chor", "pay", "jum", "shan"],
    times: ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00"],
    lbl: { service: t(C.service), day: t(C.day), time: t(C.time), shade: t(C.shade), name: t(C.yourName), phone: t(C.yourPhone) },
  };

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.kind)}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.lead)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#fbf6f1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Onest:wght@400;600&display=swap">
<script>document.documentElement.classList.add('js')</script>
<style>${CSS}
:root{${palette(site.color)}}</style>
${fly.css}
<style>.fz-sign{color:#3a2a2e;text-shadow:none;top:15%;font:italic 500 clamp(20px,2.8vw,44px)/1 'Cormorant Garamond',Georgia,serif;letter-spacing:.02em}
.fz-sign img{height:clamp(22px,2.6vw,40px)}
.fz .fzc-h em{font-style:italic}
@media(max-width:899px){.fz-sign{top:29%;font-size:22px}.fz-drop{top:38%}}</style>
</head>
<body>
${dzIntroSolo(l)}
<a class="skip" href="#${services.length ? "services" : "book"}">${t(C.toMain)}</a>
${header}
<main>
${fly.section}
${hero}
<div class="fall" id="fall">
<div class="rail" id="rail" aria-hidden="true"><div class="drop" id="drop">${DROP}</div></div>
${servicesSec}
${works}
${room}
${masters}
${perks}
${lab}
</div>
${reviews}
${book}
${contact}
</main>
${footer}
${dock}
<script type="application/json" id="sl-data">${json(data)}</script>
<script>
${JS}</script>
${fly.script}
</body>
</html>`;
}

const CSS = `*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:#fbf6f1;color:#2e2226;font:400 17px/1.6 'Onest',system-ui,sans-serif;overflow-x:clip;-webkit-font-smoothing:antialiased}
img,svg{display:block;max-width:100%}
a{color:inherit}
h1,h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;line-height:1.02;margin:0;letter-spacing:-.01em}
h2{font-size:clamp(36px,5.4vw,64px)}
p{margin:0}
.wrap{width:min(1120px,100% - 32px);margin-inline:auto}
.skip{position:absolute;left:-999px}.skip:focus{left:16px;top:16px;z-index:99;background:#fff;padding:12px 16px;border-radius:12px}
.kick{font:600 13px/1 'Onest',sans-serif;letter-spacing:.18em;text-transform:uppercase}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 26px;border-radius:999px;border:1px solid transparent;font:600 16px/1 'Onest',sans-serif;text-decoration:none;cursor:pointer;transition:transform .25s cubic-bezier(.2,.7,.2,1),background-color .25s,color .25s}
.btn:active{transform:scale(.97)}
.btn-a{background:var(--ac);color:#fff}.btn-a:hover{background:#2e2226}
.btn-w{background:#fff;color:#2e2226}.btn-w:hover{background:#2e2226;color:#fff}
.btn-o{border-color:currentColor;background:transparent;color:inherit}
.btn-s{min-height:44px;padding:0 18px;font-size:15px}
:focus-visible{outline:2px solid var(--ac);outline-offset:3px}
.top{position:fixed;left:0;right:0;top:0;z-index:50;padding:12px 0;transition:transform .45s cubic-bezier(.2,.7,.2,1),opacity .45s}
.top.away{transform:translateY(-110%);opacity:0;pointer-events:none}
.top-in{width:min(1120px,100% - 24px);margin-inline:auto;display:flex;align-items:center;gap:20px;padding:8px 8px 8px 20px;border-radius:999px;background:rgb(251 246 241/.82);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 8px 30px rgb(46 34 38/.08)}
.logo{display:flex;align-items:center;gap:10px;min-width:0;text-decoration:none;margin-right:auto}
.logo img{height:30px;width:auto;max-width:96px;object-fit:contain}
.logo b{font:italic 500 24px/1 'Cormorant Garamond',Georgia,serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.top nav{display:flex;gap:22px}.top nav a{font-size:15px;text-decoration:none;opacity:.8}.top nav a:hover{opacity:1}
.hero{position:relative;background:var(--ac);color:#fff;padding:clamp(120px,18vh,190px) 0 clamp(150px,22vh,220px)}
.hero h1{font-size:clamp(52px,10vw,132px);font-style:italic;overflow-wrap:anywhere}
.hero .kick{margin-bottom:22px;opacity:.85}
.hsub{max-width:560px;margin-top:22px;font-size:19px;opacity:.92}
.acts{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}
.drips{position:absolute;left:0;right:0;bottom:-138px;width:100%;height:140px;fill:var(--ac);pointer-events:none}
.fall{position:relative}
.fall{--lane:clamp(34px,6vw,92px)}
.fall>.sec>.wrap,.fall>.lab>.wrap{padding-right:var(--lane)}
.rail{position:absolute;top:0;right:max(6px,calc((100vw - 1120px)/2 - 6px));width:var(--lane);height:100%;pointer-events:none;z-index:3;display:flex;justify-content:center}
.drop{position:sticky;top:40vh;width:34px;height:max-content;transition:opacity .3s;will-change:transform}
.drop::before{content:"";position:absolute;left:50%;bottom:calc(100% - 6px);width:2px;height:70px;margin-left:-1px;border-radius:2px;background:linear-gradient(180deg,rgb(var(--ac-rgb)/0),var(--nc,var(--ac)));opacity:calc((var(--st,1) - 1) * 2.4)}
.drop svg{display:block;width:100%;filter:drop-shadow(0 12px 12px rgb(46 34 38/.28));transform:scaleY(var(--st,1));transform-origin:50% 0}
.drop .dp{fill:var(--nc,var(--ac))}
.drop.down{opacity:0}
.drs{position:absolute;left:0;right:0;top:100%;height:0;pointer-events:none;z-index:1}
.drs i{position:absolute;top:-80px;border-radius:0 0 999px 999px;background:var(--ac);will-change:transform}
.drs i::after{content:"";position:absolute;left:24%;bottom:9px;width:16%;height:18px;border-radius:99px;background:rgb(255 255 255/.22)}
.works{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.works figure{margin:0;border-radius:28px;overflow:hidden;aspect-ratio:4/5}
.works img{width:100%;height:100%;object-fit:cover;transition:transform .9s cubic-bezier(.2,.7,.2,1)}
.works figure:hover img{transform:scale(1.06)}
.ba-w{display:grid;grid-template-columns:.8fr 1.2fr;gap:40px;align-items:center;margin-top:72px}
.ba-t h3{margin:0;font:italic 500 clamp(34px,4.4vw,56px)/1.05 'Cormorant Garamond',Georgia,serif}.ba-t p{margin-top:14px;color:#6b5a5f}
.ba{position:relative;border-radius:32px;overflow:hidden;aspect-ratio:5/4;touch-action:pan-y;user-select:none}
.ba img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 30%;pointer-events:none}
.ba-b{position:absolute;inset:0;clip-path:inset(0 calc(100% - var(--p)) 0 0)}
.ba-h{position:absolute;top:0;bottom:0;left:var(--p);width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 0 1px rgb(46 34 38/.12)}
.ba-h::after{content:"";position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px;border-radius:50%;background:#fff;box-shadow:0 8px 24px rgb(46 34 38/.28)}
.ba-l{position:absolute;top:16px;padding:6px 12px;border-radius:999px;background:rgb(46 34 38/.62);color:#fff;font-size:13px;font-weight:600}.ba-l1{left:16px}.ba-l2{right:16px}
.ba input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:ew-resize}
.revs{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.revs figure{margin:0;background:#fff;border-radius:28px;padding:26px;display:grid;gap:16px;align-content:start}
.revs blockquote{margin:0;font:italic 500 22px/1.3 'Cormorant Garamond',Georgia,serif}
.revs figcaption{display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px}
.revs .av{width:36px;height:36px;border-radius:50%;background:var(--wash);color:var(--ac);display:grid;place-items:center;font:italic 500 20px/1 'Cormorant Garamond',serif}
.rtag{justify-self:start;padding:4px 10px;border-radius:999px;background:var(--wash);color:#6b5a5f;font-size:12px;font-weight:600}
.sec{position:relative;padding:clamp(88px,13vh,150px) 0}
.rail+.sec{padding-top:clamp(225px,28vh,260px)}
.sec>.wrap,.lab>.wrap{position:relative;z-index:2}
.sh{max-width:640px;margin-bottom:44px}.sh p{margin-top:14px;color:#6b5a5f}
.list{list-style:none;margin:0;padding:0;display:grid;gap:4px 56px}
.list li{display:flex;align-items:baseline;gap:12px;padding:18px 0;border-bottom:1px solid rgb(46 34 38/.1)}
.list .ln{font:500 clamp(22px,2.4vw,28px)/1.15 'Cormorant Garamond',Georgia,serif}
.list i{flex:1;min-width:16px}
.list .lp{white-space:nowrap;color:var(--ac);font-weight:600}
.chip{min-height:44px;padding:0 16px;border-radius:999px;border:1px solid rgb(46 34 38/.18);background:transparent;color:inherit;font:400 15px/1 'Onest',sans-serif;cursor:pointer;transition:background-color .2s,color .2s,border-color .2s}
.chip:hover{border-color:var(--ac)}.chip.on{background:#2e2226;border-color:#2e2226;color:#fff}
.room{background:var(--wash);border-radius:48px}
.shots{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.shots figure{margin:0;border-radius:28px;overflow:hidden;aspect-ratio:3/4}
.shots figure:nth-child(even){margin-top:48px}
.shots img{width:100%;height:118%;object-fit:cover;transform:translateY(var(--py,0px));will-change:transform}
.people{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
.people article{background:#fff;border-radius:28px;padding:24px;display:grid;gap:6px}
.people .av{width:52px;height:52px;border-radius:50%;background:var(--wash);color:var(--ac);display:grid;place-items:center;font:italic 500 26px/1 'Cormorant Garamond',serif;margin-bottom:10px}
.people span:last-child{color:#6b5a5f;font-size:15px}
.perks{list-style:none;margin:0;padding:0;display:grid;gap:0}
.perks li{font:italic 500 clamp(26px,3.6vw,44px)/1.15 'Cormorant Garamond',Georgia,serif;padding:22px 0;border-bottom:1px solid rgb(46 34 38/.1)}
.lab{position:relative;background:#2a1d22;color:#fbf6f1;border-radius:48px;padding:clamp(88px,13vh,150px) 0;--nc:#e9c4b8}
.lab-in{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center}
.lab .kick{color:var(--ac2);margin-bottom:18px}
.lab h2+p{margin-top:16px;max-width:480px;opacity:.82}
.row{margin-top:28px;display:grid;gap:12px}
.lbl{font-size:14px;letter-spacing:.08em;text-transform:uppercase;opacity:.7}.lbl b{text-transform:none;letter-spacing:0;font-weight:600;opacity:1}
.sws{display:flex;flex-wrap:wrap;gap:10px}
.sw{width:44px;height:44px;border-radius:50%;border:2px solid transparent;background:var(--c);cursor:pointer;box-shadow:inset 0 0 0 3px #2a1d22;transition:transform .2s,border-color .2s}
.sw:hover{transform:scale(1.08)}.sw.on{border-color:#fbf6f1}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.lab .chip{border-color:rgb(251 246 241/.28)}.lab .chip.on{background:#fbf6f1;border-color:#fbf6f1;color:#2a1d22}
.note{margin-top:22px;font-size:14px;opacity:.6;max-width:460px}
.lab .btn{margin-top:26px}
.lab-v{position:relative;display:grid;justify-items:center}
.hand{position:relative;z-index:2;width:min(100%,420px);aspect-ratio:900/1205;border-radius:36px;overflow:hidden;-webkit-mask-image:radial-gradient(120% 100% at 50% 45%,#000 62%,transparent 100%);mask-image:radial-gradient(120% 100% at 50% 45%,#000 62%,transparent 100%)}
.hand img{display:block;width:100%;height:100%;object-fit:cover}
.hn,.ht,.hg{position:absolute;inset:0;-webkit-mask-size:100% 100%;mask-size:100% 100%;transition:opacity .7s,background-color .45s}
.hn{background:var(--nc);mix-blend-mode:multiply;-webkit-mask-image:url(${IMG}/hand-nails.webp);mask-image:url(${IMG}/hand-nails.webp);opacity:0}
.hand.wet .hn{opacity:1}
.ht{background:#fff;-webkit-mask-image:url(${IMG}/hand-tips.webp);mask-image:url(${IMG}/hand-tips.webp);opacity:0}
.hand.wet[data-f=french] .ht{opacity:.94}
.hg{background:#fff;-webkit-mask-image:url(${IMG}/hand-gloss.webp);mask-image:url(${IMG}/hand-gloss.webp);opacity:.8}
.hand[data-f=matte] .hg{opacity:.1}
.hand[data-f=cat] .hg{background:linear-gradient(118deg,rgb(255 255 255/0) 38%,#fff 50%,rgb(255 255 255/0) 62%);-webkit-mask-image:url(${IMG}/hand-nails.webp);mask-image:url(${IMG}/hand-nails.webp);opacity:.75}
.splash{position:absolute;left:var(--tx);top:var(--ty);width:20px;height:20px;margin:-10px;border-radius:50%;border:2px solid var(--nc);opacity:0;z-index:3}
.hand.wet .splash{animation:splash .8s ease-out}
@keyframes splash{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(7)}}
.book{display:grid;grid-template-columns:1.2fr .8fr;gap:48px;align-items:start}
.form{display:grid;gap:18px;background:#fff;border-radius:32px;padding:28px}
.form label,.fl{display:grid;gap:8px}
.form label>span,.fl>span{font-size:14px;color:#6b5a5f}
.form input,.form select{min-height:52px;border-radius:16px;border:1px solid rgb(46 34 38/.16);padding:0 16px;font:400 17px 'Onest',sans-serif;background:#fbf6f1;color:inherit;width:100%}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pickd{font-size:15px;color:var(--ac)}
.msg{font-size:15px;color:#6b5a5f;min-height:24px}
.demo{background:var(--wash);border-radius:32px;padding:28px;position:sticky;top:96px}
.dt{font:italic 500 26px/1.1 'Cormorant Garamond',serif;margin-bottom:16px}
.tg{background:#fff;border-radius:20px;padding:18px;display:grid;gap:6px;font-size:15px}
.kb{display:flex;gap:8px;margin-top:10px}.kb i{flex:1;font-style:normal;text-align:center;padding:10px;border-radius:12px;background:var(--wash);color:var(--ac);font-weight:600}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.card{background:#fff;border-radius:28px;padding:26px;display:grid;gap:10px;align-content:start}
.card svg{color:var(--ac)}.card span{color:#6b5a5f;font-size:15px}
.links a{display:flex;align-items:center;gap:10px;min-height:44px;text-decoration:none}
.foot{padding:40px 0 120px;font-size:14px;color:#6b5a5f}.foot .wrap{display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between}
.dock{display:none}
.js .rv{opacity:0;transform:translateY(26px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1);transition-delay:calc(var(--d,0) * 70ms)}
.js .rv.in{opacity:1;transform:none}
@media(min-width:900px){.list{grid-template-columns:1fr 1fr}}
@media(max-width:899px){.top nav{display:none}.lab-in,.book{grid-template-columns:1fr}.hand{width:min(100%,320px)}.works{grid-template-columns:1fr 1fr}.ba-w{grid-template-columns:1fr;gap:20px;margin-top:48px}.ba{aspect-ratio:4/5}.revs{grid-template-columns:1fr}.shots{grid-template-columns:1fr 1fr}.demo{position:static}.two{grid-template-columns:1fr}.room,.lab{border-radius:32px}.list li{flex-wrap:wrap}.list .chip{margin-left:auto}.drop{width:22px}
.dock{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:40;display:flex;gap:8px;padding:8px;border-radius:999px;background:rgb(251 246 241/.9);box-shadow:0 10px 30px rgb(46 34 38/.16);transition:transform .4s,opacity .4s}
.dock .btn{flex:1;min-height:48px}.dock .btn-o{flex:0 0 48px;padding:0}
.dock.away{transform:translateY(140%);opacity:0}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.js .rv{opacity:1;transform:none;transition:none}.rail{display:none}.fall{--lane:0px}.hn{opacity:1;transition:none}.shots img{transform:none}.top,.dock{transition:none}}`;

const JS = `(function(){'use strict';
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#sl-data').textContent),RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Шапка: при любой прокрутке прячется, возвращается через 3 секунды после последней. */
var hdr=$('#hdr'),dock=$('#dock'),fz=$('.fz'),idle=0;
function chrome(){var inFly=fz&&fz.getBoundingClientRect().bottom>innerHeight*.5;if(dock)dock.classList.toggle('away',!!inFly);
  if(hdr.contains(d.activeElement))return;hdr.classList.add('away');clearTimeout(idle);idle=setTimeout(function(){hdr.classList.remove('away')},3000)}
addEventListener('scroll',chrome,{passive:true});if(dock&&fz)dock.classList.add('away');
/* Блоки появляются мягко, по одному. */
if('IntersectionObserver'in w&&!RM){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});$$('.rv').forEach(function(e){io.observe(e)})}
else $$('.rv').forEach(function(e){e.classList.add('in')});
/* Капля: рельс кончается у ногтя, капля прилипает к экрану и «падает» через страницу. */
var fall=$('#fall'),rail=$('#rail'),drop=$('#drop'),nail=$('#nail'),lab=$('#lab'),lastY=scrollY,st=1,raf=0,STRETCH=/*~*/0.012;
var dx=0,drs=$$('.drs i'),hero=$('.hero');
function target(){var n=nail.getBoundingClientRect(),cs=getComputedStyle(nail);return{x:n.left+n.width*parseFloat(cs.getPropertyValue('--tx'))/100,y:n.top+n.height*parseFloat(cs.getPropertyValue('--ty'))/100}}
function place(){if(!rail||!nail)return;var f=fall.getBoundingClientRect(),r=rail.getBoundingClientRect(),g=target();
  rail.style.height=Math.max(0,Math.round(g.y-f.top+2))+'px';dx=g.x-(r.left+r.width/2)}
function tick(){raf=0;var y=scrollY,v=Math.abs(y-lastY);lastY=y;st+=((1+Math.min(v*STRETCH,.55))-st)*.25;
  if(drop&&rail){var r=rail.getBoundingClientRect(),stop=innerHeight*.4+drop.offsetHeight,left=r.bottom-stop,landed=left<2;
    /* Последние две трети экрана капля уходит из своей полосы к ногтю. */
    var q=1-Math.min(Math.max(left/(innerHeight*.66),0),1);q=q*q*(3-2*q);
    drop.style.setProperty('--st',st.toFixed(3));drop.style.transform='translateX('+(dx*q).toFixed(1)+'px)';
    drop.classList.toggle('down',landed);nail.classList.toggle('wet',landed||RM)}
  if(hero&&drs.length){var hb=hero.getBoundingClientRect(),h=Math.min(Math.max(-hb.top/Math.max(hb.height,1),0),1.2);
    drs.forEach(function(d){var k=+d.getAttribute('data-k'),i=+d.getAttribute('data-i');d.style.transform='translateY('+(h*52*k+Math.sin(h*7+i*1.7)*6*k).toFixed(1)+'px)'})}
  $$('[data-par]').forEach(function(im){var b=im.parentNode.getBoundingClientRect();if(b.bottom<0||b.top>innerHeight)return;im.style.setProperty('--py',(-(b.top+b.height/2-innerHeight/2)*.08).toFixed(1)+'px')});
  if(Math.abs(st-1)>.004)raf=requestAnimationFrame(tick)}
var ba=$('#ba');if(ba){var br=$('input',ba);br.addEventListener('input',function(){ba.style.setProperty('--p',br.value+'%')})}
function poke(){if(!raf)raf=requestAnimationFrame(tick)}
if(RM){if(nail)nail.classList.add('wet')}else{addEventListener('scroll',poke,{passive:true});addEventListener('resize',function(){place();poke()});addEventListener('load',function(){place();poke()});place();setTimeout(place,1200);poke()}
/* Подбор цвета. */
var pick={shade:$('.sw.on')?$('.sw.on').getAttribute('data-n'):'',finish:$('.chip[data-f].on')?$('.chip[data-f].on').textContent:'',base:$('.chip[data-b].on')?$('.chip[data-b].on').textContent:'',touched:false};
function one(list,el){list.forEach(function(x){x.classList.toggle('on',x===el);x.setAttribute('aria-checked',x===el?'true':'false')})}
function note(){var c=$('#f-c');if(!c||!pick.touched)return;c.hidden=false;c.textContent=D.lbl.shade+': '+pick.shade+', '+pick.finish+', '+pick.base}
$$('.sw').forEach(function(b){b.addEventListener('click',function(){one($$('.sw'),b);lab.style.setProperty('--nc',b.getAttribute('data-c'));$('#sh-n').textContent=b.getAttribute('data-n');pick.shade=b.getAttribute('data-n');pick.touched=true;nail.classList.add('wet');note()})});
$$('.chip[data-f]').forEach(function(b){b.addEventListener('click',function(){one($$('.chip[data-f]'),b);nail.setAttribute('data-f',b.getAttribute('data-f'));pick.finish=b.textContent;pick.touched=true;note()})});
$$('.chip[data-b]').forEach(function(b){b.addEventListener('click',function(){one($$('.chip[data-b]'),b);pick.base=b.textContent;pick.touched=true;note()})});
var go=$('#lab-go');if(go)go.addEventListener('click',function(){pick.touched=true;note()});
/* Запись: день и время кнопками, заявка текстом в чат салона. */
var fd=$('#f-d'),ft=$('#f-t'),day='',time='';
function chips(box,items,set){items.forEach(function(x,i){var b=d.createElement('button');b.type='button';b.className='chip'+(i===0?' on':'');b.textContent=x;b.addEventListener('click',function(){one($$('.chip',box),b);set(x)});box.appendChild(b)});set(items[0])}
if(fd){var days=[],now=new Date();for(var i=0;i<6;i++){var x=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i);days.push(i===0?D.today:i===1?D.tomorrow:D.wd[x.getDay()]+' '+x.getDate())}
  chips(fd,days,function(x){day=x});chips(ft,D.times,function(x){time=x})}
$$('[data-pick]').forEach(function(b){b.addEventListener('click',function(){var s=$('#f-s');if(s)s.value=b.getAttribute('data-pick');var f=$('#book');if(f)f.scrollIntoView({behavior:RM?'auto':'smooth'})})});
var form=$('#form');if(form)form.addEventListener('submit',function(e){e.preventDefault();var n=$('#f-n').value.trim(),p=$('#f-p').value.trim(),m=$('#f-m');
  if(!n||!p){m.textContent=D.need;return}
  var s=$('#f-s').value,lines=[D.hello,s?D.lbl.service+': '+s:'',D.lbl.day+': '+day+', '+time,pick.touched?D.lbl.shade+': '+pick.shade+', '+pick.finish+', '+pick.base:'',D.lbl.name+': '+n,D.lbl.phone+': '+p].filter(Boolean).join('\\n');
  try{navigator.clipboard&&navigator.clipboard.writeText(lines)}catch(_){}
  /* Та же запись приходит в админку макета первой строкой. */
  try{localStorage.setItem('is-salon-book',JSON.stringify({n:n,p:p,s:s,w:day+', '+time,at:Date.now()}))}catch(_){}
  m.textContent=D.sent;var to=D.chat?(D.chat.indexOf('wa.me')>=0?D.chat+(D.chat.indexOf('?')<0?'?text=':'&text=')+encodeURIComponent(lines):D.chat):D.tel;if(to)setTimeout(function(){w.open(to,'_blank','noopener')},600)});
})();`;
