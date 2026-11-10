/**
 * Шаблон «Стоматология» — страница сайта нашего макета Nek Dental Studio
 * (scripts/protos/nek/gen.mjs, sitePage), переодетая под клиента.
 *
 * Владелец, 10.11.2026: «Просто бери наши макеты и лепи логотипы, цены и
 * контактные данные клиента». Отсюда устройство: стили и скрипт сайта Nek
 * — те же файлы (content/proto-instant/nek-assets.json, пишет
 * scripts/protos/instant/nek-assets.mjs), разметка — те же блоки и классы:
 * стеклянная шапка, первый экран с фото и карточкой, бегущая строка услуг,
 * услуги с кнопкой записи, слои реставрации, «почему мы», фото клиники,
 * врачи, вопросы, контакты тёмным блоком, подвал, чат, кнопки внизу экрана
 * и шторка записи.
 *
 * Что от Nek не берётся, потому что это про их клинику, а не дизайн: их
 * фото и пролёт по прокрутке из них, знак-цветок, отзывы их пациентов,
 * их врачи, Тбилиси и языки клиники. На этих местах — данные клиента, его
 * фото или нейтральные фото ниши; нет данных — блока нет.
 *
 * Шаблонные слова без цифр: каждое число на странице — из данных клиента
 * (lib/proto/instant/check).
 */
import assets from "@/content/proto-instant/nek-assets.json" with { type: "json" };
import media from "@/content/proto-instant/stomatologiya-media.json" with { type: "json" };
import { PROTO_BASE } from "@/lib/proto/pages";
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { LIMITS, type InstantLocale, type InstantSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";

/** Нейтральные фото ниши: без людей и чужих брендов, сделаны один раз. */
export const DENTAL_PHOTOS = [
  "/protos/_niche/stomatologiya/n1.webp",
  "/protos/_niche/stomatologiya/n2.webp",
  "/protos/_niche/stomatologiya/n3.webp",
  "/protos/_niche/stomatologiya/n4.webp",
] as const;

type Pair = { ru: string; uz: string };
const P = (ru: string, uz: string): Pair => ({ ru, uz });

/** Пролёт ниши: кадры и ключевые кадры (scripts/protos/instant/scene.py). */
const IMG = "/protos/_niche/stomatologiya";

const C = {
  fly: P("Пролёт по клинике", "Klinika bo‘ylab parvoz"),
  flyKick: P("Макет DevUz Studio", "DevUz Studio maketi"),
  flySee: P("Смотреть сайт", "Saytni ko‘rish"),
  flyNote: P("Кадры для примера: клиника поставит свои фото.", "Kadrlar namuna uchun: klinika o‘z rasmlarini qo‘yadi."),
  scroll: P("Листайте", "Aylantiring"),
  ch2: [P("Спокойный визит", "Xotirjam tashrif"), P("начинается с порога", "ostonadan boshlanadi")],
  ch4: [P("Чистый кабинет", "Toza kabinet"), P("и внимание к деталям", "va mayda narsalarga e’tibor")],
  ch5: [P("Запись", "Yozilish"), P("в два нажатия", "ikki bosishda")],
  nav: [P("Услуги", "Xizmatlar"), P("Реставрация", "Restavratsiya"), P("Врачи", "Shifokorlar"), P("Вопросы", "Savollar"), P("Контакты", "Kontaktlar")],
  sections: P("Разделы", "Bo‘limlar"),
  book: P("Записаться", "Yozilish"),
  bookVisit: P("Записаться на приём", "Qabulga yozilish"),
  call: P("Позвонить", "Qo‘ng‘iroq"),
  callShort: P("Звонок", "Qo‘ng‘iroq"),
  kick: P("Стоматология", "Stomatologiya"),
  h1: P("Здоровые зубы <em>без лишнего стресса</em>", "Sog‘lom tishlar <em>ortiqcha xavotirsiz</em>"),
  calm: P("Спокойный визит", "Xotirjam tashrif"),
  calmSub: P("запись в два нажатия", "ikki bosishda yozilish"),
  svcKick: P("Услуги", "Xizmatlar"),
  svcH: P("Что мы <b>лечим</b>", "Nimani <b>davolaymiz</b>"),
  bookThis: P("Записаться", "Yozilish"),
  ask: P("Стоимость врач назовёт после осмотра.", "Narxini shifokor ko‘rikdan keyin aytadi."),
  restoKick: P("Реставрация", "Restavratsiya"),
  restoH: P("Форма, цвет и <b>естественный вид</b>", "Shakl, rang va <b>tabiiy ko‘rinish</b>"),
  restoLead: P("Подвиньте ползунок: так слой за слоем собирается восстановленный зуб.", "Slayderni suring: tiklangan tish qatlam-qatlam shunday yig‘iladi."),
  restoNote: P("Иллюстрация метода, не фото работы клиники.", "Usul tasviri, klinika ishining surati emas."),
  layer: P("Слой", "Qatlam"),
  layers: [
    [P("Форма", "Shakl"), P("Врач восстанавливает анатомию зуба: контур и края.", "Shifokor tish anatomiyasini tiklaydi: shakli va qirralari.")],
    [P("Дентин", "Dentin"), P("Внутренний слой даёт зубу тёплую глубину цвета.", "Ichki qatlam tishga rangning iliq chuqurligini beradi.")],
    [P("Эмаль", "Emal"), P("Внешний слой подбирается под ваши зубы, чтобы зуб выглядел естественно.", "Tashqi qatlam tishlaringizga moslanadi, tish tabiiy ko‘rinadi.")],
    [P("Режущий край", "Kesuvchi qirra"), P("Прозрачный край, как у живого зуба: улыбка без резкой границы.", "Tirik tishdagidek shaffof qirra: tabassum keskin chegarasiz.")],
  ],
  perksKick: P("О клинике", "Klinika haqida"),
  perksH: P("Почему выбирают <b>нас</b>", "Nega <b>bizni</b> tanlashadi"),
  spaceKick: P("Клиника", "Klinika"),
  spaceH: P("Как у нас <b>внутри</b>", "Klinika <b>ichida</b>"),
  ownPhotos: P("Фото с сайта клиники.", "Rasmlar klinika saytidan."),
  stockPhotos: P("Фото для примера: клиника добавит свои.", "Rasmlar namuna uchun: klinika o‘zinikini qo‘yadi."),
  teamKick: P("Команда", "Jamoa"),
  teamH: P("Наши <b>врачи</b>", "Bizning <b>shifokorlar</b>"),
  flowKick: P("Запись с сайта", "Saytdan yozilish"),
  flowH: P("Так запись придёт <b>вам в Telegram</b>", "Yozuv sizga <b>Telegramda</b> shunday keladi"),
  flowLead: P("Пациент нажимает «Записаться», выбирает услугу и время. Клинике приходит сообщение, отвечаете в один клик.", "Bemor «Yozilish»ni bosadi, xizmat va vaqtni tanlaydi. Klinikaga xabar keladi, bir bosishda javob berasiz."),
  demo: P("демо-данные", "demo-ma’lumot"),
  demoTitle: P("Новая запись с сайта", "Saytdan yangi yozuv"),
  demoPatient: P("Пациент", "Bemor"),
  demoService: P("Услуга", "Xizmat"),
  demoArea: P("Район", "Mahalla"),
  demoNear: P("Ориентир", "Mo‘ljal"),
  demoShop: P("магазин «[[t:1]]»", "«[[t:1]]» do‘koni"),
  faqKick: P("Вопросы", "Savollar"),
  faqH: P("Перед <b>первым визитом</b>", "<b>Birinchi tashrifdan</b> oldin"),
  faq: [
    [P("Сколько длится лечение?", "Davolash qancha davom etadi?"), P("Зависит от зуба и от того, что нужно сделать. Врач скажет после осмотра, до начала работы.", "Tish va nima qilish kerakligiga bog‘liq. Shifokor ko‘rikdan keyin, ish boshlanishidan oldin aytadi.")],
    [P("Будет ли пломба отличаться по цвету?", "Plomba rangi farq qiladimi?"), P("Цвет подбирают под ваши зубы, слой за слоем, чтобы рядом с ними пломба выглядела естественно.", "Rang tishlaringizga qatlam-qatlam moslanadi, plomba ular yonida tabiiy ko‘rinadi.")],
    [P("Подходят ли брекеты взрослым?", "Breketlar kattalarga to‘g‘ri keladimi?"), P("Да, врач планирует каждый этап под ваш прикус. Спросите на консультации.", "Ha, shifokor har bir bosqichni tishlashingizga qarab rejalashtiradi. Konsultatsiyada so‘rang.")],
  ],
  whereQ: P("Где вы и когда работаете?", "Qayerdasiz va qachon ishlaysiz?"),
  findKick: P("Как нас найти", "Bizni qanday topish mumkin"),
  findH: P("Ждём вас на <b>приём</b>", "Sizni <b>qabulda</b> kutamiz"),
  route: P("Маршрут на карте", "Xaritada yo‘nalish"),
  foot: { svc: P("Услуги", "Xizmatlar"), clinic: P("Клиника", "Klinika"), follow: P("Мы в сетях", "Ijtimoiy tarmoqlar") },
  mockup: P("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz qabul qilasiz:"),
  terms: P("условия макета", "maket shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  chatTitle: P("Чат с клиникой", "Klinika bilan chat"),
  chatSub: P("Ответы из вопросов клиники · демо", "Klinika savollaridan javoblar · demo"),
  chatHi: P("Здравствуйте! Спросите об услугах, адресе или часах работы. Чтобы записаться, нажмите «Записаться».", "Assalomu alaykum! Xizmatlar, manzil yoki ish vaqti haqida so‘rang. Yozilish uchun «Yozilish»ni bosing."),
  chatMiss: P("Передам вопрос администратору: он ответит в рабочее время.", "Savolni administratorga topshiraman: u ish vaqtida javob beradi."),
  chatPh: P("Ваш вопрос", "Savolingiz"),
  send: P("Отправить", "Yuborish"),
  chat: P("Чат", "Chat"),
  close: P("Закрыть", "Yopish"),
  toServices: P("К услугам", "Xizmatlarga o‘tish"),
  sheet: {
    book: P("Запись на приём", "Qabulga yozilish"),
    svc: P("Услуга", "Xizmat"),
    day: P("День", "Kun"),
    time: P("Время", "Vaqt"),
    name: P("Ваше имя", "Ismingiz"),
    phone: P("Телефон", "Telefon"),
    send: P("Отправить заявку", "Arizani yuborish"),
    need: P("Выберите день и время, напишите имя и телефон", "Kun va vaqtni tanlang, ism va telefonni yozing"),
    sent: P("Заявка у клиники. Открываем чат с клиникой", "Ariza klinikada. Klinika bilan chatni ochamiz"),
    hello: P("Здравствуйте! Хочу записаться", "Assalomu alaykum! Yozilmoqchiman"),
    at: P("на", ""),
  },
  wd: { ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"], uz: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"] },
  title: P("стоматология", "stomatologiya"),
  desc: P("Услуги, врачи и запись на приём в два нажатия.", "Xizmatlar, shifokorlar va ikki bosishda qabulga yozilish."),
} as const;

const I = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  wa: I('<path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z"/><path d="M9.2 8.6c.3 2.9 2.4 5.2 5.4 5.9l1.2-1.3-1.8-1-1 .8c-1-.4-1.9-1.3-2.4-2.4l.8-1-1-1.8z"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  chat: I('<path d="M4 5.5h16v11H9l-5 3.5z"/><path d="M8 10h8M8 13h5"/>'),
  cal: I('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  tooth: I('<path d="M7.5 4c-2.2 0-3.5 1.8-3.5 4.3 0 3 1.4 4.5 2 7.2.5 2.5 1 4.5 2.3 4.5 1.5 0 1.3-4.5 3.7-4.5s2.2 4.5 3.7 4.5c1.3 0 1.8-2 2.3-4.5.6-2.7 2-4.2 2-7.2C20 5.8 18.7 4 16.5 4c-1.8 0-2.6 1-4.5 1S9.3 4 7.5 4z"/>'),
  insta: I('<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".6" fill="currentColor"/>'),
};
/** Знак клиники, если логотипа нет: зуб линией, в цвете бренда. Не цветок Nek. */
const MARK = ICON.tooth.replace("<svg ", '<svg class="mk" ');
const MOTION = ["rise", "tilt", "pop", "slide"];

/** Две буквы имени врача — на месте фото. */
function initials(name: string): string {
  const words = name.replace(/["«»'`]/g, " ").split(/\s+/).filter((w) => /\p{L}/u.test(w));
  return words.slice(0, 2).map((w) => [...w][0]?.toUpperCase() ?? "").join("");
}

/**
 * Акцент Nek (орхидея) — в цвет бренда клиента. Переменные — в hsl: так их
 * сдвигает отпечаток (lib/proto/stamp). Нет цвета — акцент шаблона.
 */
/** hsl → «r g b» для rgb(var(--x)/a): блики и тени из стилей Nek. */
function rgbOf(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round((l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return `${f(0)} ${f(8)} ${f(4)}`;
}

function palette(color: string | null): string {
  const hex = brandColor(color);
  const [h, s0, l0] = hex ? hexToHsl(hex) : [298, 31, 42];
  const s = Math.min(Math.max(s0, 24), 78);
  const l = Math.min(Math.max(l0, 26), 46);
  return [
    `--orchid-rgb:${rgbOf(h, s, l)}`,
    `--ink-rgb:${rgbOf(h, 28, 15)}`,
    `--peach:hsl(${h} ${Math.min(s + 10, 70)}% 76%)`,
    `--orchid:hsl(${h} ${s}% ${l}%)`,
    `--orchid-d:hsl(${h} ${s}% ${Math.max(l - 12, 14)}%)`,
    `--orchid-l:hsl(${h} ${Math.min(s, 55)}% 91%)`,
    `--ink:hsl(${h} 28% 15%)`,
    `--ink2:hsl(${h} 16% 27%)`,
    `--paper:hsl(${h} 25% 97%)`,
    `--s2:hsl(${h} 18% 91%)`,
  ].join(";");
}

/** Часы для шторки записи: из «9:00-20:00» на сайте клиники, иначе дневные. */
export function slotsOf(hours: string | null): string[] {
  const m = hours ? /(\d{1,2})[:.](\d{2})\s*(?:-|–|—|до)\s*(\d{1,2})[:.](\d{2})/.exec(hours) : null;
  const from = m ? Number(m[1]) : 0;
  const to = m ? Number(m[3]) : 0;
  if (!(from >= 6 && to <= 23 && to - from >= 3)) return ["10:00", "11:30", "13:00", "14:30", "16:00", "17:00"];
  const step = Math.max(60, Math.floor(((to - 1 - from) * 60) / 5 / 30) * 30);
  const out: string[] = [];
  for (let m2 = from * 60; m2 <= (to - 1) * 60 && out.length < 6; m2 += step) {
    out.push(`${String(Math.floor(m2 / 60)).padStart(2, "0")}:${String(m2 % 60).padStart(2, "0")}`);
  }
  return out;
}

/** Выходные: «Пн-Сб» — воскресенье, «Пн-Пт» — суббота и воскресенье. Не ясно — все дни. */
export function offDaysOf(hours: string | null): number[] {
  const h = (hours ?? "").toLowerCase();
  if (/пн\s*[-–—]\s*пт|du\s*[-–—]\s*ju/.test(h)) return [0, 6];
  if (/пн\s*[-–—]\s*сб|du\s*[-–—]\s*sh/.test(h)) return [0];
  return [];
}

/** Куда ведёт запись: Telegram → WhatsApp. Префикс, к нему скрипт добавит текст. Нет — звонок. */
function goPrefix(site: InstantSite): string | null {
  const tg = handleOf(site.telegram);
  if (tg) return `https://t.me/${tg}?text=`;
  const wa = waHref(site.whatsapp);
  return wa ? `${wa}?text=` : null;
}

const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/build, normalizeSite). */
export function dentalHtml(site: InstantSite): string {
  const l: InstantLocale = site.locale;
  const t = (p: Pair) => p[l];
  const name = esc(site.name);
  const tel = telHref(site.phone);
  const telDigits = tel ? tel.slice(4) : "";
  const tg = handleOf(site.telegram);
  const wa = waHref(site.whatsapp);
  const ig = handleOf(site.instagram);
  const logo = imageUrl(site.logo);
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u)).slice(0, LIMITS.photos);
  const photos = own.length ? own : [...DENTAL_PHOTOS];
  const photo = (i: number) => esc(photos[i % photos.length]);
  const services = site.services.slice(0, LIMITS.services);
  const doctors = site.doctors.slice(0, LIMITS.doctors);
  const perks = site.perks.slice(0, LIMITS.perks);
  const mark = logo ? `<img class="lg" src="${esc(logo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : MARK;
  const LOGO = `<a class="logo" href="#top" aria-label="${name}">${mark}<span><b>${name}</b></span></a>`;
  const where = [site.address, site.hours].filter(Boolean).join(", ");

  const nav = [
    services.length ? `<a href="#services">${t(C.nav[0])}</a>` : "",
    `<a href="#resto">${t(C.nav[1])}</a>`,
    doctors.length ? `<a href="#team">${t(C.nav[2])}</a>` : "",
    `<a href="#faq">${t(C.nav[3])}</a>`,
    `<a href="#visit">${t(C.nav[4])}</a>`,
  ].join("");

  const header = `<header class="top"><div class="top-in glass">
${LOGO}
<nav class="nav" aria-label="${t(C.sections)}">${nav}</nav>
${tel ? `<a class="btn btn-l btn-s tel" href="${esc(tel)}">${ICON.phone}<span>${esc(site.phone ?? "")}</span></a>` : ""}
<button type="button" class="btn btn-a btn-s" data-book>${t(C.book)}</button>
</div></header>`;

  const hfacts = [
    site.address ? `<li>${ICON.pin}<span>${esc(site.address)}</span></li>` : "",
    site.hours ? `<li>${ICON.clock}<span>${esc(site.hours)}</span></li>` : "",
  ].join("");
  const kick = site.tagline ?? (site.city ? `${t(C.kick)} · ${site.city}` : t(C.kick));
  const hero = `<section class="hero" id="top" aria-label="${name}">
<div class="wrap hero-in">
<div class="hero-tx">
<p class="kick rise"><i></i>${esc(kick)}</p>
<h1>${name}<br>${t(C.h1)}</h1>
${site.about ? `<p class="hsub rise">${esc(site.about)}</p>` : ""}
<div class="hero-act rise"><button type="button" class="btn btn-a" data-book>${ICON.cal}<span>${t(C.bookVisit)}</span></button>${tel ? `<a class="btn btn-l" href="${esc(tel)}">${ICON.phone}<span>${t(C.call)}</span></a>` : ""}</div>
${hfacts ? `<ul class="hfacts rise">${hfacts}</ul>` : ""}
</div>
<div class="hero-ph"><div class="ph" data-par="0.12"><img src="${photo(0)}" width="1200" height="1500" alt="${name}" fetchpriority="high" referrerpolicy="no-referrer"></div>
<div class="hcard glass" data-par="-0.06">${MARK}<b>${t(C.calm)}</b><span>${t(C.calmSub)}</span></div></div>
</div></section>`;

  const velo =
    services.length >= 3
      ? `<div class="velo"><div class="row" aria-hidden="true">${[0, 1].map(() => services.map((s) => `<span>${MARK}${esc(s.name)}</span>`).join("")).join("")}</div></div>`
      : "";

  const svcSec = services.length
    ? `<section class="sec" id="services"><div class="wrap">
<p class="kick rise"><i></i>${t(C.svcKick)}</p>
<h2 class="h2 rise">${t(C.svcH)}</h2>
<div class="svc">${services
        .map(
          (s, i) =>
            `<article class="sv ${MOTION[i % 4]}" style="transition-delay:${(i % 4) * 70}ms"><span class="sv-i">${ICON.tooth}</span><h3>${esc(s.name)}</h3>${
              s.price ? `<p class="sv-p">${esc(s.price)}</p>` : ""
            }<button type="button" class="sv-b" data-book="s${i}">${t(C.bookThis)}${ICON.arrow}</button></article>`,
        )
        .join("")}</div>
${services.some((s) => !s.price) ? `<p class="note rise">${t(C.ask)}</p>` : ""}
</div></section>`
    : "";

  const resto = `<section class="sec dark" id="resto"><div class="wrap two">
<div><p class="kick rise"><i></i>${t(C.restoKick)}</p>
<h2 class="h2 rise">${t(C.restoH)}</h2>
<p class="lead rise">${t(C.restoLead)}</p>
<ol class="layers" id="layers">${C.layers.map(([h, p], i) => `<li data-ly="${i}"${i === 0 ? ' class="on"' : ""}><b>${t(h)}</b><span>${t(p)}</span></li>`).join("")}</ol>
<label class="rng"><span class="vh">${t(C.layer)}</span><input type="range" id="lyr" min="0" max="3" step="1" value="0"></label>
<p class="mu small">${t(C.restoNote)}</p></div>
<div class="tooth tilt" aria-hidden="true"><svg viewBox="0 0 200 260" id="tsvg">
<defs><linearGradient id="g-de" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d9b8"/><stop offset="1" stop-color="#d9a877"/></linearGradient><linearGradient id="g-en" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9eef2"/></linearGradient><linearGradient id="g-ed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfeaf2" stop-opacity=".2"/><stop offset="1" stop-color="#bcd4e6" stop-opacity=".85"/></linearGradient></defs>
<path class="l0" d="M72 26C90 18 110 18 128 26C140 60 152 130 156 200C157 222 146 236 128 238C110 240 90 240 72 238C54 236 43 222 44 200C48 130 60 60 72 26z" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6 6"/>
<path class="l1" d="M82 46C94 40 106 40 118 46C127 74 135 130 137 180C138 196 130 204 118 205C106 206 94 206 82 205C70 204 62 196 63 180C65 130 73 74 82 46z" fill="url(#g-de)"/>
<path class="l2" d="M72 26C90 18 110 18 128 26C140 60 152 130 156 200C157 222 146 236 128 238C110 240 90 240 72 238C54 236 43 222 44 200C48 130 60 60 72 26z" fill="url(#g-en)" opacity=".88"/>
<path class="l3" d="M48 196C70 206 130 206 152 196C155 204 156 210 155 214C152 228 142 236 128 238C110 240 90 240 72 238C58 236 48 228 45 214C44 210 45 204 48 196z" fill="url(#g-ed)"/>
</svg></div>
</div></section>`;

  const care = perks.length
    ? `<section class="sec" id="care"><div class="wrap two">
<div class="ph-tall slide"><img src="${photo(1)}" width="1200" height="1600" alt="${name}" loading="lazy" referrerpolicy="no-referrer"></div>
<div><p class="kick rise"><i></i>${t(C.perksKick)}</p>
<h2 class="h2 rise">${t(C.perksH)}</h2>
<div class="care">${perks.map((p, i) => `<div class="cr ${MOTION[(i + 1) % 4]}" style="transition-delay:${i * 90}ms"><i>${ICON.check}</i><b>${esc(p)}</b></div>`).join("")}</div></div>
</div></section>`
    : "";

  // Фото, которое уже стоит в «Почему мы», в галерее не повторяется.
  const gallery = photos.slice(perks.length ? 2 : 1, 6);
  const space = gallery.length
    ? `<section class="sec soft" id="space"><div class="wrap">
<p class="kick rise"><i></i>${t(C.spaceKick)}</p>
<h2 class="h2 rise">${t(C.spaceH)}</h2>
<div class="gal">${gallery.map((src, i) => `<figure class="${MOTION[(i + 2) % 4]}" style="transition-delay:${i * 80}ms"><img src="${esc(src)}" width="1200" height="1500" alt="${name}" loading="lazy" referrerpolicy="no-referrer"></figure>`).join("")}</div>
<p class="mu small rise">${t(own.length ? C.ownPhotos : C.stockPhotos)}</p>
</div></section>`
    : "";

  const team = doctors.length
    ? `<section class="sec" id="team"><div class="wrap">
<p class="kick rise"><i></i>${t(C.teamKick)}</p>
<h2 class="h2 rise">${t(C.teamH)}</h2>
<div class="team">${doctors.map((d, i) => `<div class="tm pop" style="transition-delay:${(i % 5) * 60}ms"><span class="av" aria-hidden="true">${esc(initials(d.name))}</span><b>${esc(d.name)}</b>${d.role ? `<span>${esc(d.role)}</span>` : ""}</div>`).join("")}</div>
</div></section>`
    : "";

  const demoRows: [Pair, string][] = [
    [C.demoPatient, l === "uz" ? "Madina" : "Мадина"],
    [C.demoService, services[0]?.name ?? t(C.kick)],
    [C.demoArea, "[[t:0]]"],
    [C.demoNear, t(C.demoShop)],
  ];
  const flow = `<section class="sec soft" id="flow"><div class="wrap two">
<div><p class="kick rise"><i></i>${t(C.flowKick)}</p>
<h2 class="h2 rise">${t(C.flowH)}</h2>
<p class="lead rise">${t(C.flowLead)}</p></div>
<div class="tgc glass pop"><div class="tgc-h">${ICON.tg}<b>${t(C.demoTitle)}</b><small>${t(C.demo)}</small></div>
<dl>${demoRows.map(([k, v]) => `<dt>${t(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>
</div></section>`;

  const faqs: [string, string][] = C.faq.map(([q, a]) => [t(q), t(a)]);
  if (where) faqs.push([t(C.whereQ), where]);
  const faq = `<section class="sec" id="faq"><div class="wrap narrow">
<p class="kick rise"><i></i>${t(C.faqKick)}</p>
<h2 class="h2 rise">${t(C.faqH)}</h2>
<div class="faq">${faqs.map(([q, a], i) => `<div class="qa"><button type="button" aria-expanded="false" aria-controls="qa-${i}" id="qb-${i}"><span>${esc(q)}</span><i aria-hidden="true"></i></button><div class="qa-a" id="qa-${i}" role="region" aria-labelledby="qb-${i}"><div><p>${esc(a)}</p></div></div></div>`).join("")}</div>
</div></section>`;

  const map = site.address ? `https://yandex.uz/maps/?text=${encodeURIComponent(site.address)}` : null;
  const visit = `<section class="sec dark" id="visit"><div class="wrap two">
<div><p class="kick rise"><i></i>${t(C.findKick)}</p>
<h2 class="h2 rise">${t(C.findH)}</h2>
<div class="cinfo rise">
${tel ? `<a href="${esc(tel)}">${ICON.phone}<span>${esc(site.phone ?? "")}</span></a>` : ""}
${tg ? `<a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">${ICON.tg}<span>Telegram</span></a>` : ""}
${wa ? `<a href="${esc(wa)}" target="_blank" rel="noopener">${ICON.wa}<span>WhatsApp</span></a>` : ""}
${ig ? `<a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">${ICON.insta}<span>Instagram</span></a>` : ""}
${site.address || site.hours ? `<p>${ICON.pin}<span>${esc(site.address ?? "")}${site.hours ? `<small>${esc(site.hours)}</small>` : ""}</span></p>` : ""}
</div>
<div class="hero-act rise">${map ? `<a class="btn btn-a" href="${esc(map)}" target="_blank" rel="noopener">${ICON.pin}<span>${t(C.route)}</span></a>` : ""}<button type="button" class="btn btn-l" data-book>${t(C.book)}</button></div></div>
<div class="mapcard slide"><img src="${photo(photos.length - 1)}" width="1200" height="1600" alt="${name}" loading="lazy" referrerpolicy="no-referrer"><span class="glass">${MARK}<b>${name}</b>${site.address ? `<small>${esc(site.address)}</small>` : ""}</span></div>
</div></section>`;

  const follow = [
    tg ? `<a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">Telegram</a>` : "",
    ig ? `<a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">Instagram</a>` : "",
    wa ? `<a href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : "",
  ].join("");
  const footer = `<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO}${site.tagline ? `<p>${esc(site.tagline)}</p>` : ""}${tel ? `<a class="ftel" href="${esc(tel)}">${esc(site.phone ?? "")}</a>` : ""}</div>
${services.length ? `<div><h4>${t(C.foot.svc)}</h4>${services.slice(0, 5).map((s) => `<a href="#services">${esc(s.name)}</a>`).join("")}</div>` : ""}
<div><h4>${t(C.foot.clinic)}</h4>${doctors.length ? `<a href="#team">${t(C.nav[2])}</a>` : ""}<a href="#faq">${t(C.nav[3])}</a><a href="#visit">${t(C.nav[4])}</a></div>
${follow ? `<div><h4>${t(C.foot.follow)}</h4>${follow}</div>` : ""}
</div>
<div class="sm"><span>${name}</span><span>${t(C.mockup)} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${t(C.terms)}</a></span><span>${t(C.source)} ${esc(site.source)}</span></div>
</div></footer>`;

  const data = {
    l,
    tel: telDigits,
    go: goPrefix(site),
    ph: l === "uz" || /^998/.test(telDigits) ? "+998" : "+",
    slots: slotsOf(site.hours),
    off: offDaysOf(site.hours),
    panel: "#",
    svc: services.length ? services.map((s, i) => ({ id: `s${i}`, n: s.name })) : [{ id: "s0", n: t(C.bookVisit) }],
    wd: C.wd[l],
    faq: faqs,
    t: {
      book: t(C.sheet.book),
      svc: t(C.sheet.svc),
      day: t(C.sheet.day),
      time: t(C.sheet.time),
      name: t(C.sheet.name),
      phone: t(C.sheet.phone),
      send: t(C.sheet.send),
      need: t(C.sheet.need),
      sent: t(C.sheet.sent),
      hello: t(C.sheet.hello),
      at: t(C.sheet.at),
      chat: { title: site.name, sub: t(C.chatSub), hi: t(C.chatHi), miss: t(C.chatMiss), ph: t(C.chatPh), send: t(C.send), open: t(C.chat) },
    },
  };

  // Пролёт по прокрутке — сцена первой страницы Nek на нейтральных кадрах ниши.
  // Главы — слова клиента: имя, город, его услуги. Кадров ещё нет — пролёта нет.
  const fly = media.n > 1;
  const top3 = services.slice(0, 2).map((x) => x.name).join(", ");
  const chapters: { at: number; a: string; b: string }[] = [
    { at: 0.06, a: site.name, b: site.city ?? t(C.kick) },
    { at: 0.3, a: t(C.ch2[0]), b: t(C.ch2[1]) },
    { at: 0.52, a: top3 || t(C.kick), b: site.tagline ?? t(C.calmSub) },
    { at: 0.74, a: t(C.ch4[0]), b: t(C.ch4[1]) },
    { at: 0.94, a: t(C.ch5[0]), b: t(C.ch5[1]) },
  ];
  const pic = (k: number, lazy: boolean) =>
    `<picture><source media="(max-width: 899px)" srcset="${IMG}/k${k}-9.webp"><img src="${IMG}/k${k}-16.webp" width="1600" height="893" alt=""${lazy ? ' loading="lazy"' : ""}></picture>`;
  const flySec = fly
    ? `<section class="hs" id="fly" aria-label="${t(C.fly)}"><div class="hs-st">
<picture><source media="(max-width: 899px)" srcset="${IMG}/poster-9.webp"><img class="hs-a" src="${IMG}/poster-16.webp" width="1920" height="1080" alt="" fetchpriority="high"></picture>
<canvas aria-hidden="true"></canvas>
<video muted playsinline preload="none" disablepictureinpicture aria-hidden="true"></video>
<div class="hs-shade" aria-hidden="true"></div>
<div class="hs-sign" aria-hidden="true">${logo ? `<img src="${esc(logo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}<b>${name}</b></div>
<div class="hs-ch">${chapters
        .map((c, i) =>
          i === 0
            ? `<div class="cp first" data-cp="0"><span class="kick"><i></i>${t(C.flyKick)}</span><h1>${esc(c.a)} <em>${esc(c.b)}</em></h1></div>`
            : `<div class="cp" data-cp="${i}"><span class="kick"><i></i><span class="n">0${i + 1}</span></span><p class="cp-h">${esc(c.a)} <em>${esc(c.b)}</em></p></div>`,
        )
        .join("")}</div>
<div class="hs-end"><a class="btn btn-a" href="#top">${t(C.flySee)}${ICON.arrow}</a><small>${t(C.flyNote)}</small></div>
<div class="hs-load" id="hs-load" aria-hidden="true"><span id="hs-n">0</span>%<i id="hs-b"></i></div>
<div class="hs-hint" aria-hidden="true"><span>${t(C.scroll)}</span><i></i></div>
</div></section>
<section class="calm" aria-label="${t(C.fly)}"><div class="wrap">${chapters.map((c, i) => `<figure>${pic(i + 1, i > 0)}<figcaption>${esc(c.a)} ${esc(c.b)}</figcaption></figure>`).join("")}</div></section>`
    : "";
  const land = { root: PROTO_BASE, img: IMG, n: media.n, vn: media.vn, fps: media.fps, ch: chapters.map((c) => ({ at: c.at })) };

  const close = t(C.close);
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.title)}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant:wght@400;700&family=Manrope:wght@400;700&display=swap">
<style>${assets.css}
:root{${palette(site.color)}}
.logo .lg{height:32px;width:auto;max-width:120px;object-fit:contain}
.cr i svg{width:20px;height:20px}
.tgc{border-radius:var(--r);padding:20px;max-width:420px;width:100%;justify-self:center}
.tgc-h{display:flex;align-items:center;gap:10px}
.tgc-h svg{width:26px;height:26px;color:var(--orchid)}
.tgc-h small{margin-left:auto;font-size:12px;color:var(--mu);padding:4px 10px;border-radius:999px;background:var(--s2)}
.tgc dl{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin:16px 0 0}
.tgc dt{color:var(--mu)}
.tgc dd{margin:0;font-weight:700;overflow-wrap:anywhere}
.hero h1{overflow-wrap:anywhere}
@media(max-width:560px){.logo span{display:inline;max-width:50vw;overflow:hidden;text-overflow:ellipsis}}
.hs-sign{position:absolute;left:50%;top:13%;transform:translateX(-50%);display:flex;align-items:center;gap:14px;color:var(--ink);font:700 clamp(18px,2.4vw,34px)/1 var(--hd);letter-spacing:.06em;white-space:nowrap;transition:opacity .5s,transform .8s;pointer-events:none}
.hs-sign img{height:clamp(28px,3.4vw,52px);width:auto}
.hs.moved .hs-sign{opacity:0;transform:translateX(-50%) scale(1.15)}
@media(max-width:899px){.hs-sign{top:24%;font-size:20px}}</style>
</head>
<body>
${dzIntroSolo(l)}
<a class="vh" href="#services">${t(C.toServices)}</a>
${header}
<main>
${flySec}
${hero}
${velo}
${svcSec}
${resto}
${care}
${space}
${team}
${flow}
${faq}
${visit}
</main>
${footer}
<button type="button" class="chatb" id="chatb" aria-controls="chat" aria-expanded="false">${ICON.chat}<span>${t(C.chat)}</span></button>
<div class="chat glass" id="chat" role="dialog" aria-label="${t(C.chatTitle)}" hidden><div class="ch-h">${MARK}<div><b>${name}</b><small id="ch-sub"></small></div><button type="button" class="x" id="chx" aria-label="${close}">${ICON.close}</button></div><div class="ch-b" id="chb" aria-live="polite"></div><form class="ch-f" id="chf"><label class="vh" for="chi">${t(C.chatPh)}</label><input id="chi" placeholder="${t(C.chatPh)}" autocomplete="off"><button type="submit" class="btn btn-a btn-s">${t(C.send)}</button></form></div>
<div class="dock glass" id="dock"><button type="button" class="btn btn-a" data-book>${ICON.cal}<span>${t(C.book)}</span></button>${tel ? `<a class="btn btn-l" href="${esc(tel)}">${ICON.phone}<span>${t(C.callShort)}</span></a>` : ""}</div>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="shh"><div class="sh-bg" data-close></div><div class="box"><div class="bh"><b id="shh"></b><button type="button" class="x" data-close aria-label="${close}">${ICON.close}</button></div><div class="bb" id="shb"></div></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="im-data">${json(data)}</script>
${fly ? `<script type="application/json" id="im-land">${json(land)}</script>\n<script>\n${assets.scene}</script>` : ""}
<script>
${assets.js}</script>
</body>
</html>`;
}
