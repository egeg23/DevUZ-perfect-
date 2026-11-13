/**
 * Шаблон «Услуги для бизнеса» — главная нашего макета FinTax Consulting
 * (scripts/protos/fintax/gen.mjs), переодетая под клиента.
 *
 * Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают
 * "другая ниша", а мы им предлагаем написать нам. Может выведем больше ниш
 * которые у нас есть, также переодевать просто?» Это и универсальный макет:
 * на него падает «Другое», когда сферу словами клиента не узнали
 * (FALLBACK_NICHE в lib/proto/instant/bot.ts). Поэтому шаблон сам не говорит
 * ни «бухгалтерия», ни «налоги»: о деле клиента — только его слова (услуги,
 * «о компании», «почему мы»), подписи блоков нейтральные.
 *
 * Отсюда устройство: стили и скрипт FinTax — те же файлы
 * (content/proto-instant/fintax-assets.json, пишет
 * scripts/protos/instant/fintax-assets.mjs), разметка — те же блоки и классы:
 * синий стол с маркером под словом, «хаос → порядок» (карточки по прокрутке
 * ложатся в три стопки), схема услуг вокруг задачи клиента с бегущим
 * импульсом, полоса с фото, команда карточками, контакты с «Моими заявками»
 * и заявка с проверкой полей. Заявка ложится в память браузера с тем же
 * ключом, что читает панель FinTax в админке, и приходит туда первой строкой.
 *
 * Что от FinTax не берётся, потому что это про них, а не дизайн: их имя и
 * знак, тарифы и подбор тарифа по их пределам, «штатный бухгалтер или мы»,
 * видеоотзывы, команда, адрес, цифры («больше 100 компаний», «до 30%») и
 * фото. Нет данных клиента — блока нет; нет фото — нейтральные фото
 * (public/protos/_niche/uslugi). Каждое число на странице — из данных клиента
 * (lib/proto/instant/check).
 */
import assets from "@/content/proto-instant/fintax-assets.json" with { type: "json" };
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { PROTO_BASE } from "@/lib/proto/pages";
import { LIMITS, type InstantLocale, type InstantSite, type BaseSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";

const IMG = "/protos/_niche/uslugi";
/** Нейтральные фото: рабочий стол вечером (компьютер и телефон), переговорная. */
export const USLUGI_PHOTOS = [`${IMG}/hero-1600.webp`, `${IMG}/band-2000.webp`];

type Pair = { ru: string; uz: string };
const P = (ru: string, uz: string): Pair => ({ ru, uz });

const C = {
  kind: P("Наши услуги", "Xizmatlarimiz"),
  sections: P("Разделы", "Bo‘limlar"),
  menu: P("Меню", "Menyu"),
  close: P("Закрыть", "Yopish"),
  nav: { uslugi: P("Услуги", "Xizmatlar"), order: P("Как мы работаем", "Qanday ishlaymiz"), team: P("Команда", "Jamoa"), contacts: P("Контакты", "Aloqa") },
  cta: P("Оставить заявку", "Ariza qoldirish"),
  write: P("Написать нам", "Bizga yozing"),
  callUs: P("Позвонить", "Qo‘ng‘iroq qilish"),
  h1b: P("Сделаем под вашу задачу", "Vazifangizga moslab qilamiz"),
  heroAlt: P("Рабочий стол вечером: бумаги, ноутбук и маркер", "Kechki ish stoli: qog‘ozlar, noutbuk va marker"),
  stock: P("Фото для примера: компания поставит свои.", "Rasmlar namuna uchun: kompaniya o‘zinikini qo‘yadi."),
  ordKick: P("Как мы работаем", "Qanday ishlaymiz"),
  ordA: P("Так задачи лежат у многих", "Ko‘pchilikda vazifalar shunday yotadi"),
  ordB: { ru: "А так они лежат <mark class=\"hl on\">у нас</mark>", uz: "Bizda esa <mark class=\"hl on\">shunday</mark>" },
  piles: [P("Заявка", "Ariza"), P("В работе", "Ishda"), P("Готово", "Tayyor")],
  ordNote: P("Листайте: задачи сами разложатся по этапам", "Pastga suring: vazifalar o‘zi bosqichlarga taxlanadi"),
  ordSr: P("Каждая задача проходит три этапа: заявка, работа, готово.", "Har bir vazifa uch bosqichdan o‘tadi: ariza, ish, tayyor."),
  schKick: P("Услуги", "Xizmatlar"),
  schH: { ru: "Что мы <mark class=\"hl\">берём на себя</mark>", uz: "Nimani <mark class=\"hl\">o‘z zimmamizga olamiz</mark>" },
  hub: [P("Ваша", "Sizning"), P("задача", "vazifangiz")],
  schAria: P("Услуги вокруг вашей задачи", "Vazifangiz atrofidagi xizmatlar"),
  ask: P("Узнать стоимость", "Narxini bilish"),
  priceAsk: P("Цену назовём по заявке", "Narxni ariza bo‘yicha aytamiz"),
  group: P("Услуга", "Xizmat"),
  why: P("Почему мы", "Nega biz"),
  teamKick: P("Команда", "Jamoa"),
  teamH: { ru: "Кто будет <mark class=\"hl\">работать с вами</mark>", uz: "Siz bilan <mark class=\"hl\">kim ishlaydi</mark>" },
  teamNote: P("Имена с сайта компании. На место инициалов встанут фотографии команды.", "Ismlar kompaniya saytidan. Bosh harflar o‘rniga jamoa suratlari qo‘yiladi."),
  ctKick: P("Контакты", "Aloqa"),
  ctH: { ru: "Свяжитесь с нами <mark class=\"hl on\">удобным способом</mark>", uz: "Biz bilan <mark class=\"hl on\">qulay usulda</mark> bog‘laning" },
  callHint: P("Звоните", "Qo‘ng‘iroq qiling"),
  tgHint: P("Напишите нам в Telegram", "Telegramda yozing"),
  waHint: P("Напишите нам в WhatsApp", "WhatsAppda yozing"),
  igHint: P("Наши работы и новости", "Ishlarimiz va yangiliklar"),
  mapHint: P("Показать на карте", "Xaritada ko‘rsatish"),
  flowKick: P("Заявка с сайта", "Saytdan ariza"),
  flowH: P("Так заявка придёт менеджеру в Telegram", "Ariza menejerga Telegramda shunday keladi"),
  demo: P("демо-данные", "demo-ma’lumot"),
  demoTitle: P("Новая заявка с сайта", "Saytdan yangi ariza"),
  demoWho: P("Клиент", "Mijoz"),
  demoArea: P("Район", "Mahalla"),
  demoNear: P("Ориентир", "Mo‘ljal"),
  demoShop: P("магазин «[[t:1]]»", "«[[t:1]]» do‘koni"),
  myReq: P("Мои заявки", "Mening arizalarim"),
  myReqNote: P("Статус ставит менеджер в панели.", "Holatni menejer panelda belgilaydi."),
  formH: P("Заказать обратный звонок", "Qayta qo‘ng‘iroq buyurtma qilish"),
  formNote: P("Укажите телефон, и менеджер свяжется с вами.", "Telefon raqamingizni qoldiring, menejer siz bilan bog‘lanadi."),
  name: P("Имя", "Ism"),
  phone: P("Телефон", "Telefon"),
  svc: P("Что нужно", "Nima kerak"),
  choose: P("Выберите", "Tanlang"),
  other: P("Другое", "Boshqa"),
  msg: P("Вопрос", "Savol"),
  msgPh: P("Опишите задачу в двух словах", "Vazifani ikki so‘zda yozing"),
  agree: P("Согласен, чтобы со мной связались по этой заявке.", "Shu ariza bo‘yicha men bilan bog‘lanishlariga roziman."),
  send: P("Свяжитесь со мной", "Men bilan bog‘laning"),
  got: P("Заявка принята", "Ariza qabul qilindi"),
  req: P("Заявка", "Ariza"),
  sentP: P("Менеджер свяжется с вами. Чтобы не ждать, отправьте заявку в мессенджер компании: текст уже готов.", "Menejer siz bilan bog‘lanadi. Kutmaslik uchun arizani kompaniya messenjeriga yuboring: matn tayyor."),
  demoNote: P("Это макет: заявка пришла в демо-панель, она открыта в этом же браузере.", "Bu maket: ariza demo-panelga tushdi, u shu brauzerda ochiladi."),
  openPanel: P("Открыть панель", "Panelni ochish"),
  again: P("Новая заявка", "Yangi ariza"),
  toMain: P("К содержанию", "Asosiy qismga"),
  contacts: P("Связь", "Aloqa"),
  rights: P("Это макет DevUz Studio: так может выглядеть сайт компании. Название, услуги и контакты взяты из данных компании, фото для примера. Заявки с этого макета приходят только в демо-панель в этом браузере.", "Bu DevUz Studio maketi: kompaniya sayti shunday ko‘rinishi mumkin. Nomi, xizmatlar va kontaktlar kompaniya ma’lumotlaridan olingan, rasmlar namuna uchun. Bu maketdagi arizalar faqat shu brauzerdagi demo-panelga tushadi."),
  mockup: P("Макет принадлежит DevUz Studio и используется только по договору.", "Maket DevUz Studio’ga tegishli va faqat shartnoma asosida ishlatiladi."),
  terms: P("Условия использования макета", "Maketdan foydalanish shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  desc: P("Услуги, как мы работаем, контакты и заявка онлайн.", "Xizmatlar, qanday ishlaymiz, kontaktlar va onlayn ariza."),
  js: {
    ru: {
      hello: "Здравствуйте! Хочу узнать подробнее о ваших услугах.",
      ask: "Здравствуйте! Интересует: ",
      leadMsg: "Здравствуйте! Заявка {id} с сайта. Имя: {name}, телефон: {phone}.{rest}",
      st: { new: "Новая", call: "Созвонились", offer: "Отправили предложение", client: "Вы наш клиент" },
      status: "Статус",
      err: { need: "Заполните это поле", phone: "В номере мало цифр", form: "Проверьте отмеченные поля" },
      sending: "Отправляем",
      sentToast: "Заявка ушла в демо-панель.",
      toPanel: "Открыть в панели",
    },
    uz: {
      hello: "Assalomu alaykum! Xizmatlaringiz haqida batafsil bilmoqchiman.",
      ask: "Assalomu alaykum! Qiziqtiradi: ",
      leadMsg: "Assalomu alaykum! Saytdan {id} ariza. Ism: {name}, telefon: {phone}.{rest}",
      st: { new: "Yangi", call: "Qo‘ng‘iroq qilindi", offer: "Taklif yuborildi", client: "Siz mijozimizsiz" },
      status: "Holat",
      err: { need: "Bu maydonni to‘ldiring", phone: "Raqamda raqamlar kam", form: "Belgilangan maydonlarni tekshiring" },
      sending: "Yuborilmoqda",
      sentToast: "Ariza demo-panelga ketdi.",
      toPanel: "Panelda ochish",
    },
  },
} as const;

/* Иконки — те же, что у FinTax. */
const I = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  menu: I('<path d="M4 8h16M4 16h16"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12.5 4.5 4.5L19 7"/>'),
  tg: I('<path d="M21 4 3 11l6 2.2L18 7l-7 7.2.3 5.8 3.3-4 4.4 3.2Z"/>'),
  wa: I('<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7Z"/><path d="M9 9.5c.5 2.3 2.2 4 4.5 4.5l1.2-1.2 2 1-.5 1.7c-3.6.2-7.4-3.6-7.2-7.2L10.7 7.8l1 2Z"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  send: I('<path d="M21 3 3 10l7 3 3 7Z"/><path d="m10 13 4-4"/>'),
  chat: I('<path d="M4 5h16v11H9l-5 4Z"/><path d="M8 9h8M8 12h5"/>'),
  doc: I('<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5"/>'),
  scroll: I('<rect x="7" y="3" width="10" height="16" rx="5"/><path d="M12 7v3"/>'),
  insta: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>'),
};

/**
 * Маркер FinTax — в цвет бренда клиента, светлым тоном: он лежит и на синем
 * столе, и на бумаге. Переменные — в hsl: так их сдвигает отпечаток
 * (lib/proto/stamp). Нет цвета — жёлтый маркер FinTax.
 */
function palette(color: string | null): string {
  const hex = brandColor(color);
  if (!hex) return "";
  const [h, s0] = hexToHsl(hex);
  const s = Math.min(Math.max(s0, 55), 90);
  return `--im-hl:hsl(${h} ${s}% 62%);--im-hl2:hsl(${h} ${s}% 78%)`;
}

const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
const two = (n: number) => String(n).padStart(2, "0");
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/build, normalizeSite). */
export function uslugiHtml(site: BaseSite): string {
  const l: InstantLocale = site.locale;
  const t = (p: Pair) => p[l];
  const name = esc(site.name);
  const tel = telHref(site.phone);
  const tg = handleOf(site.telegram);
  const wa = waHref(site.whatsapp);
  const ig = handleOf(site.instagram);
  const logo = imageUrl(site.logo);
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u)).slice(0, LIMITS.photos);
  const services = site.services.slice(0, 10);
  const perks = site.perks.slice(0, LIMITS.perks);
  const team = site.doctors.slice(0, LIMITS.doctors);
  const js = C.js[l];
  const hello = js.hello;

  /** Чат компании: Telegram → WhatsApp; текст уже в ссылке. Нет — звонок или заявка. */
  const chatWith = (text: string) =>
    tg ? `https://t.me/${tg}?text=${encodeURIComponent(text)}` : wa ? `${wa}?text=${encodeURIComponent(text)}` : (tel ?? "#zayavka");
  const chatIcon = tg ? ICON.tg : wa ? ICON.wa : ICON.phone;
  const ext = tg || wa ? ' target="_blank" rel="noopener"' : "";
  const waNum = (site.whatsapp ?? "").replace(/\D/g, "");

  const nav: [string, Pair][] = [
    ...(services.length ? [["uslugi", C.nav.uslugi] as [string, Pair]] : []),
    ["order", C.nav.order],
    ...(team.length ? [["team", C.nav.team] as [string, Pair]] : []),
    ["zayavka", C.nav.contacts],
  ];
  const mark = logo
    ? `<img src="${esc(logo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"><span class="im-lt">${name}</span>`
    : `<span class="im-lt">${name}</span>`;
  const logoA = `<a class="logo im-logo" href="#hero" aria-label="${name}">${mark}</a>`;

  const header = `<header class="top" id="top"><div class="top-in">
${logoA}
<nav class="nav" aria-label="${t(C.sections)}">${nav.map(([id, n]) => `<a href="#${id}">${t(n)}</a>`).join("")}</nav>
<div class="top-r"><a class="btn btn-pri top-cta" href="#zayavka">${t(C.cta)}</a>
<button type="button" class="ic-btn" id="menu-btn" aria-expanded="false" aria-controls="menu" aria-label="${t(C.menu)}">${ICON.menu}</button></div>
</div></header>
<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="${t(C.menu)}" hidden>
<button type="button" class="ic-btn" data-close aria-label="${t(C.close)}">${ICON.close}</button>
<nav class="mn-list" aria-label="${t(C.sections)}">${nav.map(([id, n], i) => `<a href="#${id}"><small class="im-n" data-n="${two(i + 1)}"></small>${t(n)}</a>`).join("")}</nav>
${tg || wa ? `<a class="btn btn-pri" href="${esc(chatWith(hello))}"${ext}>${chatIcon}<span>${t(C.write)}</span></a>` : ""}
${tel ? `<a class="btn btn-line" href="${esc(tel)}">${ICON.phone}<span>${esc(site.phone ?? "")}</span></a>` : ""}
</div>`;

  // 1. Первый экран: синий стол, название и маркер под словом.
  const heroSrc = own[0] ?? null;
  const heroPic = heroSrc
    ? `<picture class="hero-ph"><img src="${esc(heroSrc)}" alt="${name}" fetchpriority="high" referrerpolicy="no-referrer"></picture>`
    : `<picture class="hero-ph"><source media="(max-width: 899px) and (orientation: portrait)" srcset="${IMG}/hero-m-1080.webp"><img src="${IMG}/hero-1600.webp" srcset="${IMG}/hero-960.webp 960w, ${IMG}/hero-1600.webp 1600w, ${IMG}/hero-2560.webp 2560w" sizes="100vw" alt="${t(C.heroAlt)}" fetchpriority="high"></picture>`;
  const points = (perks.length ? perks : services.map((s) => s.name)).slice(0, 4);
  const served = [
    site.hours ? `<span>${ICON.clock}${esc(site.hours)}</span>` : "",
    site.address ? `<span>${ICON.pin}${esc(site.address)}</span>` : site.city ? `<span>${ICON.pin}${esc(site.city)}</span>` : "",
    tel ? `<span>${ICON.phone}<a href="${esc(tel)}">${esc(site.phone ?? "")}</a></span>` : "",
  ].join("");
  const hero = `<section class="hero" id="hero">
${heroPic}
<div class="wrap hero-in">
<p class="kicker">${esc(site.city ? `${site.city} · ${t(C.kind).toLowerCase()}` : t(C.kind))}</p>
<h1 class="h1"><span>${name}.</span> <span><mark class="hl on">${esc(site.tagline ?? t(C.h1b))}</mark></span></h1>
${site.about ? `<p class="lead im-about">${esc(site.about)}</p>` : ""}
${points.length ? `<ul class="hero-pts">${points.map((x) => `<li>${ICON.check}<span>${esc(x)}</span></li>`).join("")}</ul>` : ""}
<div class="hero-cta"><a class="btn btn-pri" href="${esc(chatWith(hello))}"${ext}>${chatIcon}<span>${t(tg || wa ? C.write : C.callUs)}</span></a><a class="btn btn-line" href="#zayavka">${t(C.cta)}</a></div>
${served ? `<p class="served">${served}</p>` : ""}
${own.length ? "" : `<p class="im-stock">${t(C.stock)}</p>`}
</div></section>`;

  // 2. Хаос → порядок: карточки задач по прокрутке ложатся в три стопки.
  const labels = services.length ? services.map((s) => s.name) : [site.name];
  const docs = [...Array(12).keys()].map((i) => ({ g: i % 3, n: labels[i % labels.length] }));
  const order = `<section class="order" id="order" aria-labelledby="ord-h"><div class="ord-stick">
<div class="wrap ord-head"><p class="kicker">${t(C.ordKick)}</p>
<h2 class="h2" id="ord-h"><span class="o-a">${t(C.ordA)}</span><span class="o-b">${C.ordB[l]}</span></h2></div>
<div class="ord-board" aria-hidden="true">
${C.piles.map((n, i) => `<div class="pile" data-p="${i}" style="left:${i * 34.5}%"><span class="pl-tray"></span><b>${t(n)}</b></div>`).join("")}
${docs.map((d, i) => `<div class="doc" data-g="${d.g}" data-i="${i}"><b>${esc(d.n)}</b><i></i><i></i><i></i><i></i><span class="tag"></span></div>`).join("")}
</div>
<p class="ord-note">${ICON.scroll}<span>${t(C.ordNote)}</span><span class="ord-bar"><i></i></span></p>
<p class="sr-only" style="position:absolute;left:-9999px">${t(C.ordSr)}</p>
</div></section>`;

  // 3. Схема: услуги клиента вокруг его задачи, импульс бежит от центра.
  const N = services.length, R = 230, CC = 300;
  const pos = services.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(N, 1);
    return [+(CC + R * Math.cos(a)).toFixed(1), +(CC + R * Math.sin(a)).toFixed(1)];
  });
  const svg = `<svg class="sch-svg" viewBox="0 0 600 600" role="group" aria-label="${t(C.schAria)}">
<g class="orb" aria-hidden="true"><circle cx="300" cy="300" r="${R}" fill="none" stroke="rgba(238,240,245,.14)" stroke-dasharray="2 10"/></g>
${pos.map(([x, y], i) => `<line class="sp" x1="300" y1="300" x2="${x}" y2="${y}"/><line class="sp-on" data-sp="${i}" x1="300" y1="300" x2="${x}" y2="${y}"/>`).join("")}
<g class="hub" aria-hidden="true"><circle cx="300" cy="300" r="74"/><text x="300" y="294">${t(C.hub[0])}</text><text x="300" y="316">${t(C.hub[1])}</text></g>
${pos.map(([x, y], i) => `<g class="nd" data-n="${i}" tabindex="0" role="button" aria-label="${esc(services[i].name)}"><circle cx="${x}" cy="${y}" r="30"/><circle class="ring" cx="${x}" cy="${y}" r="30"/><text x="${x}" y="${y}">${two(i + 1)}</text></g>`).join("")}
<circle class="pulse" r="6" cx="300" cy="300" aria-hidden="true"/>
</svg>`;
  const scheme = N
    ? `<section class="sec dark" id="uslugi"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker">${t(C.schKick)}</p><h2 class="h2">${C.schH[l]}</h2></div>
<div class="sch" data-scheme>
<div class="mv mv-scale">${svg}</div>
<div class="sch-side"><div class="card sch-card" aria-live="polite"><span class="chip" data-g></span><h3></h3><p></p><a class="btn btn-pri" data-ask href="${esc(chatWith(hello))}"${ext} style="justify-self:start">${chatIcon}<span>${t(C.ask)}</span></a></div>
<div class="sch-list" role="group" aria-label="${t(C.schKick)}" style="margin-top:16px">${services.map((s, i) => `<button type="button" data-n="${i}" aria-pressed="false"><span class="im-n" data-n="${two(i + 1)} "></span>${esc(s.name)}</button>`).join("")}</div></div>
</div>
${perks.length ? `<p class="kicker" style="margin-top:48px">${t(C.why)}</p><div class="adv mv-st mv" style="margin-top:16px">${perks.map((p, i) => `<div style="--i:${i}"><b>${esc(p)}</b></div>`).join("")}</div>` : ""}
</div></section>`
    : "";

  // 4. Полоса с фото: их слова о себе.
  const bandSrc = own[1] ?? null;
  const bandImg = bandSrc
    ? `<img src="${esc(bandSrc)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
    : `<img src="${IMG}/band-1100.webp" srcset="${IMG}/band-1100.webp 1100w, ${IMG}/band-2000.webp 2000w" sizes="100vw" alt="" loading="lazy">`;
  const quote = site.about && site.about.length <= 160 ? site.about : (perks[0] ?? site.tagline ?? null);
  const band = quote ? `<section class="band" data-band><picture>${bandImg}</picture><div class="wrap"><blockquote class="mv mv-up">${esc(quote)}</blockquote></div></section>` : "";

  // 5. Команда — только если люди названы у компании.
  const teamSec = team.length
    ? `<section class="sec" id="team"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker">${t(C.teamKick)}</p><h2 class="h2">${C.teamH[l]}</h2><p class="lead">${t(C.teamNote)}</p></div>
<div class="team mv-st mv">${team.map((p, i) => `<div class="pp" style="--i:${i}"><span class="av" aria-hidden="true">${esc(initials(p.name))}</span><span><b>${esc(p.name)}</b>${p.role ? `<span>${esc(p.role)}</span>` : ""}</span></div>`).join("")}</div>
</div></section>`
    : "";

  // 6. Контакты и заявка: «Мои заявки» со статусом из панели.
  const map = site.address ? `https://yandex.uz/maps/?text=${encodeURIComponent(site.address)}` : null;
  const ci = [
    tel ? `<a class="ci" href="${esc(tel)}"><span class="ic">${ICON.phone}</span><span><b>${esc(site.phone ?? "")}</b><span>${t(C.callHint)}${site.hours ? `: ${esc(site.hours)}` : ""}</span></span></a>` : "",
    tg ? `<a class="ci" href="${esc(chatWith(hello))}" target="_blank" rel="noopener"><span class="ic">${ICON.tg}</span><span><b>Telegram @${esc(tg)}</b><span>${t(C.tgHint)}</span></span></a>` : "",
    wa ? `<a class="ci" href="${esc(`${wa}?text=${encodeURIComponent(hello)}`)}" target="_blank" rel="noopener"><span class="ic">${ICON.wa}</span><span><b>WhatsApp</b><span>${t(C.waHint)}</span></span></a>` : "",
    ig ? `<a class="ci" href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener"><span class="ic">${ICON.insta}</span><span><b>Instagram @${esc(ig)}</b><span>${t(C.igHint)}</span></span></a>` : "",
    site.address && map ? `<a class="ci" href="${esc(map)}" target="_blank" rel="noopener"><span class="ic">${ICON.pin}</span><span><b>${esc(site.address)}</b><span>${t(C.mapHint)}</span></span></a>` : "",
  ].filter(Boolean);
  const demoRows: [Pair, string][] = [
    [C.demoWho, l === "uz" ? "Jasur" : "Жасур"],
    [C.svc, services[0]?.name ?? t(C.other)],
    [C.demoArea, "[[t:0]]"],
    [C.demoNear, t(C.demoShop)],
  ];
  const kinds: [string, string][] = [...services.map((s, i): [string, string] => [`s${i}`, s.name]), ["other", t(C.other)]];
  const fl = (nm: string, label: string, field: string, req = false) =>
    `<label class="fl"><span>${label}${req ? " *" : ""}</span>${field}<span class="err" aria-live="polite"></span></label>`;
  const form = `<div class="card form-wrap" id="form"><form class="form" data-lead novalidate><h3>${t(C.formH)}</h3>
<p class="note">${t(C.formNote)}</p>
<div class="row2">${fl("name", t(C.name), `<input name="name" type="text" autocomplete="name" required placeholder="">`, true)}${fl("phone", t(C.phone), `<input name="phone" type="tel" autocomplete="tel" inputmode="tel" required placeholder="+">`, true)}</div>
${fl("kind", t(C.svc), `<select name="kind"><option value="">${t(C.choose)}</option>${kinds.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join("")}</select>`)}
<p class="pick-in" data-pick-in hidden>${ICON.check}<span></span></p>
${fl("msg", t(C.msg), `<textarea name="msg" rows="4" placeholder="${esc(t(C.msgPh))}"></textarea>`)}
<label class="agree"><input type="checkbox" name="agree" required><span>${t(C.agree)}</span></label>
<button type="submit" class="btn btn-pri">${ICON.send}<span>${t(C.send)}</span></button></form>
<div class="sent" hidden tabindex="-1"><span class="chip">${ICON.check}${t(C.got)}</span><h3>${t(C.req)} <span data-no></span></h3>
<p>${t(C.sentP)}</p>
<div class="sent-act">${
    // Скрипт FinTax ставит текст заявки в обе кнопки: обе в разметке, лишняя скрыта.
    // Нет Telegram — первая кнопка ведёт туда, куда tg() (WhatsApp или звонок).
    tg
      ? `<a class="btn btn-pri" data-send="tg" href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">${ICON.tg}<span>Telegram</span></a>`
      : `<a class="btn btn-pri" data-send="tg" href="${esc(tel ?? "#zayavka")}"${waNum ? " hidden" : ""}>${ICON.phone}<span>${t(C.callUs)}</span></a>`
  }<a class="btn btn-line" data-send="wa" href="${waNum ? `https://wa.me/${esc(waNum)}` : "#zayavka"}" target="_blank" rel="noopener"${waNum ? "" : " hidden"}>${ICON.wa}<span>WhatsApp</span></a></div>
<p class="note">${t(C.demoNote)} <a href="${PROTO_BASE}/admin#leads">${t(C.openPanel)}</a></p>
<button type="button" class="btn btn-line" data-again>${t(C.again)}</button></div></div>`;
  const contacts = `<section class="ph" id="zayavka"><div class="wrap"><p class="kicker">${t(C.ctKick)}</p><h2 class="h1">${C.ctH[l]}</h2>${site.address ? `<p class="lead">${esc(site.address)}</p>` : ""}</div></section>
<section class="sec"><div class="wrap ct">
<div class="ct-l mv-st mv">
${ci.map((x, i) => x.replace('<a class="ci"', `<a class="ci" style="--i:${i}"`)).join("\n")}
<div class="card im-tgc" style="--i:${ci.length}"><p class="kicker">${t(C.flowKick)}</p><h3 class="h3">${t(C.flowH)}</h3><div class="im-tgc-h">${ICON.tg}<b>${t(C.demoTitle)}</b><small>${t(C.demo)}</small></div><dl>${demoRows.map(([k, v]) => `<dt>${t(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>
<div class="card track" id="track" style="--i:${ci.length}" hidden><h3 class="h3">${t(C.myReq)}</h3><p class="note">${t(C.myReqNote)}</p><div class="track-l"></div></div>
</div>
<div class="mv mv-right">${form}</div>
</div></section>`;

  const links = [
    tel ? `<li><a href="${esc(tel)}">${esc(site.phone ?? "")}</a></li>` : "",
    tg ? `<li><a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">Telegram @${esc(tg)}</a></li>` : "",
    wa ? `<li><a href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a></li>` : "",
    ig ? `<li><a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">Instagram @${esc(ig)}</a></li>` : "",
    site.address ? `<li>${esc(site.address)}</li>` : "",
    site.hours ? `<li>${esc(site.hours)}</li>` : "",
  ].join("");
  const footer = `<footer class="foot"><div class="wrap">
<div class="ft">
<div>${logoA}${services.length ? `<p style="margin-top:16px">${esc(services.slice(0, 5).map((s) => s.name).join(", "))}</p>` : ""}</div>
<div><b>${t(C.sections)}</b><ul>${nav.map(([id, n]) => `<li><a href="#${id}">${t(n)}</a></li>`).join("")}</ul></div>
${links ? `<div><b>${t(C.contacts)}</b><ul>${links}</ul></div>` : ""}
</div>
<div class="rights"><p>${t(C.rights)}</p>
<p>${t(C.mockup)} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${t(C.terms)}</a></p><p>${t(C.source)} ${esc(site.source)}</p></div>
</div></footer>`;

  const dock = `<div class="dock" id="dock"><a class="btn btn-pri" href="#zayavka">${ICON.send}<span>${t(C.cta)}</span></a>${tg || wa ? `<a class="ic-btn" href="${esc(chatWith(hello))}"${ext} aria-label="${t(C.write)}">${chatIcon}</a>` : tel ? `<a class="ic-btn" href="${esc(tel)}" aria-label="${t(C.callUs)}">${ICON.phone}</a>` : ""}</div>`;

  // Данные для скрипта FinTax: те же поля, что у их K(), без тарифов и подбора.
  const K = {
    lang: l,
    page: "home",
    panel: `${PROTO_BASE}/admin`,
    tg: tg ?? "",
    wa: waNum,
    tel: tel ?? "",
    services: services.map((s, i) => ({ id: `s${i}`, n: s.name, d: s.price ?? t(C.priceAsk), g: t(C.group), ic: ICON.doc, ask: js.ask + s.name })),
    tariffs: [],
    turn: [],
    kinds: Object.fromEntries(kinds),
    why: [],
    icCheck: ICON.check,
    r: {},
    pickMsg: "",
    taxN: {},
    vedN: "",
    pickIn: "",
    leadMsg: js.leadMsg,
    st: js.st,
    status: js.status,
    err: js.err,
    sending: js.sending,
    sentToast: js.sentToast,
    toPanel: js.toPanel,
    nWorry: "",
    noWorry: "",
    emptyAns: "",
  };

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.kind).toLowerCase()}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#161a28">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;700&family=Playfair+Display:wght@400;700&display=swap">
<script>(function(){var r=document.documentElement;r.classList.add('js');try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)r.classList.add('rm')}catch(e){}})()</script>
<style>${assets.css}
:root{${palette(site.color)}}
.im-logo{display:inline-flex;align-items:center;gap:10px;max-width:60vw;min-width:0}
.im-logo img{height:32px;width:auto;max-width:120px;object-fit:contain}
.im-lt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;position:relative;z-index:0}
.im-lt::before{content:"";position:absolute;z-index:-1;left:-1px;right:-1px;bottom:-5px;height:4px;background:var(--hl);border-radius:3px}
.h1 span{overflow-wrap:anywhere}
.im-about{max-width:58ch;margin:0 0 20px;color:var(--dmu)}
.im-stock{margin:16px 0 0;font-size:var(--t14);color:var(--dmu)}
.im-n::before{content:attr(data-n)}
.served a{color:inherit;text-decoration:none}
.im-tgc{display:grid;gap:10px}
.im-tgc-h{display:flex;align-items:center;gap:10px}
.im-tgc-h svg{width:24px;height:24px;flex:none}
.im-tgc-h small{margin-left:auto;font-size:12px;padding:3px 10px;border-radius:999px;background:var(--paper2);color:var(--mu)}
.im-tgc dl{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:0}
.im-tgc dt{color:var(--mu)}
.im-tgc dd{margin:0;font-weight:700;overflow-wrap:anywhere}
.doc b{overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}</style>
</head>
<body data-lang="${l}" data-page="home">
${dzIntroSolo(l)}
<a class="skip" href="#main">${t(C.toMain)}</a>
${header}
<main id="main">
${hero}
${order}
${scheme}
${band}
${teamSec}
${contacts}
</main>
${footer}
${dock}
<p class="toast" id="toast" role="status" hidden></p>
<script type="application/json" id="ft-data">${json(K)}</script>
<script>
${assets.js}</script>
</body>
</html>`;
}
