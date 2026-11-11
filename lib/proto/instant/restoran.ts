/**
 * Шаблон «Ресторан» — страница сайта нашего макета Agora Lounge & bar
 * (scripts/protos/agora/gen.mjs, sitePage), переодетая под клиента.
 *
 * Владелец, 11.11.2026: «Остальные категории тоже делаем по принципу как
 * сделали со стоматологией». Отсюда устройство: стили и скрипт Agora — те же
 * файлы (content/proto-instant/agora-assets.json, пишет
 * scripts/protos/instant/agora-assets.mjs), разметка — те же блоки и классы:
 * шапка-стекло, первый экран с залом и карточкой адреса, бегущие строки
 * блюд, меню с поиском и карточкой блюда, предзаказ, бронь стола в два
 * касания с «Моя бронь», зал лентой, «Как найти» со схемой, подвал и док.
 *
 * Что от Agora не берётся, потому что это про них, а не дизайн: их знак и
 * залёт в него, их фото блюд и зала, «Вечер в Agora», меню rezvo, iiko,
 * демо-бот на их блюдах, панель и конструктор цены (цену бот присылает
 * сообщением и КП). Нет данных клиента — блока нет; нет фото — нейтральные
 * фото ниши (public/protos/_niche/restoran).
 *
 * Шаблонные слова без цифр: каждое число на странице — из данных клиента
 * (lib/proto/instant/check).
 */
import assets from "@/content/proto-instant/agora-assets.json" with { type: "json" };
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { LIMITS, type InstantLocale, type InstantService, type InstantSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";
import { rgbOf } from "@/lib/proto/instant/dental";

const IMG = "/protos/_niche/restoran";
/** Нейтральные фото ниши: зал вечером, сервированный стол, блюда на столе, мангал. */
export const RESTORAN_PHOTOS = [1, 2, 3, 4].map((n) => `${IMG}/n${n}-1200.webp`);
const STOCK_CAP = [
  { ru: "Зал вечером", uz: "Kechki zal" },
  { ru: "Стол к ужину", uz: "Kechki ovqatga stol" },
  { ru: "Блюда на столе", uz: "Stoldagi taomlar" },
  { ru: "Мангал", uz: "Manqal" },
];

type Pair = { ru: string; uz: string };
const P = (ru: string, uz: string): Pair => ({ ru, uz });

const C = {
  kind: P("Ресторан", "Restoran"),
  sections: P("Разделы", "Bo‘limlar"),
  nav: { menu: P("Меню", "Menyu"), book: P("Бронь", "Bron"), hall: P("Зал", "Zal"), contact: P("Контакты", "Aloqa") },
  bookBtn: P("Забронировать стол", "Stol bron qilish"),
  bookShort: P("Забронировать", "Bron qilish"),
  call: P("Позвонить", "Qo‘ng‘iroq qilish"),
  lead: P("Бронь стола в два касания, меню с ценами и предзаказ к вашему приходу.", "Ikki bosishda stol bron, narxlari bilan menyu va kelishingizga oldindan buyurtma."),
  menuKick: P("Меню", "Menyu"),
  menuH: P("Меню <b>с ценами</b>", "Narxlari bilan <b>menyu</b>"),
  menuLead: P("Нажмите на блюдо: описание, цена и «В заказ».", "Taomni bosing: tavsif, narx va «Buyurtmaga»."),
  search: P("Поиск по меню", "Menyu bo‘yicha qidiruv"),
  searchPh: P("Найти блюдо", "Taomni topish"),
  all: P("Всё меню", "Butun menyu"),
  alc: P("Алкоголь продаём гостям старше совершеннолетия.", "Alkogol voyaga yetgan mehmonlarga sotiladi."),
  bookKick: P("Бронь стола", "Stol bron qilish"),
  bookH: P("Стол на вечер <b>в два касания</b>", "Kechga stol <b>ikki bosishda</b>"),
  bookLead: P("День, время, гости. Бронь сразу у администратора, а статус гость видит здесь, в «Моя бронь».", "Kun, vaqt, mehmonlar. Bron darhol administratorda, holatini esa mehmon shu yerda, «Mening bronim»da ko‘radi."),
  when: P("Когда", "Qachon"),
  time: P("Во сколько", "Soat nechada"),
  ppl: P("Сколько гостей", "Necha mehmon"),
  less: P("Меньше гостей", "Kamroq mehmon"),
  more: P("Больше гостей", "Ko‘proq mehmon"),
  name: P("Имя", "Ism"),
  phone: P("Телефон", "Telefon"),
  wish: P("Пожелание", "Istak"),
  wishPh: P("у окна, день рождения…", "deraza yonida, tug‘ilgan kun…"),
  voice: P("Удобнее голосом: звонок в одно касание.", "Ovozda qulayroq: bir bosishda qo‘ng‘iroq."),
  flowKick: P("Предложение DevUz Studio", "DevUz Studio taklifi"),
  flowH: P("Так бронь придёт вам в Telegram", "Bron sizga Telegramda shunday keladi"),
  flowLead: P("Гость нажал «Забронировать», а администратор сразу видит заявку и подтверждает её одной кнопкой.", "Mehmon «Bron qilish»ni bosdi, administrator esa arizani darhol ko‘radi va bitta tugma bilan tasdiqlaydi."),
  demoTitle: P("Новая бронь с сайта", "Saytdan yangi bron"),
  demo: P("пример", "namuna"),
  demoWhen: P("Когда: в субботу вечером", "Qachon: shanba kuni kechqurun"),
  demoPpl: P("Гостей: компания друзей", "Mehmonlar: do‘stlar davrasi"),
  demoWho: P("Имя", "Ism"),
  demoWish: P("Пожелание: стол у окна, день рождения у", "Istak: deraza yonida stol,"),
  demoWishTail: P("", "ning tug‘ilgan kuni"),
  confirm: P("Подтвердить", "Tasdiqlash"),
  hallKick: P("Зал", "Zal"),
  hallH: P("Так выглядит <b>вечер у вас</b>", "Sizda kech <b>shunday o‘tadi</b>"),
  stock: P("Фото для примера: ресторан поставит свои.", "Rasmlar namuna uchun: restoran o‘zinikini qo‘yadi."),
  findKick: P("Как найти", "Qanday topish"),
  onMap: P("на карте и в навигаторе", "xaritada va navigatorda"),
  hoursCap: P("часы работы", "ish vaqti"),
  phoneCap: P("звонок и бронь", "qo‘ng‘iroq va bron"),
  route: P("Маршрут", "Yo‘nalish"),
  scheme: P("Схема проезда", "Yo‘l sxemasi"),
  contacts: P("Контакты", "Aloqa"),
  footText: P("Меню, цены и контакты взяты с вашего сайта или из ответов в боте. Брони и заказы в макете никуда не уходят.", "Menyu, narxlar va aloqa saytingizdan yoki botdagi javoblardan olingan. Maketda bron va buyurtmalar hech qayerga ketmaydi."),
  mockup: P("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz qabul qilasiz:"),
  terms: P("условия макета", "maket shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  toBook: P("К брони стола", "Stol broniga o‘tish"),
  close: P("Закрыть", "Yopish"),
  mine: P("Моя бронь", "Mening bronim"),
  desc: P("Меню с ценами, бронь стола и предзаказ.", "Narxlari bilan menyu, stol bron va oldindan buyurtma."),
} as const;

const I = (dd: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  cal: I('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  menu: I('<path d="M4 6h16M4 12h16M4 18h10"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  ig: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4 2-15Z"/><path d="m9 13 9-6"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  bag: I('<path d="M5 8h14l-1 12H6Z"/><path d="M9 8a3 3 0 0 1 6 0"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
};

/** Красный Agora — в цвет бренда клиента. Тёмный тёплый зал остаётся: на нём любая кухня смотрится. */
function palette(color: string | null): string {
  const hex = brandColor(color);
  const [h, s0, l0] = hex ? hexToHsl(hex) : [2, 69, 53];
  const s = Math.min(Math.max(s0, 40), 85);
  const l = Math.min(Math.max(l0, 42), 58);
  return [`--a:hsl(${h} ${s}% ${l}%)`, `--a2:hsl(${h} ${s}% ${Math.min(l + 12, 70)}%)`, `--ah:hsl(${h} ${s}% ${l - 8}%)`, `--a-rgb:${rgbOf(h, s, l)}`].join(";");
}

/**
 * Цена в корзину — только целым числом в сумах: «45 000 сум», «45000».
 * «от 30 тыс», «$12», «30-40 000» — словами на карточке, в заказ не идут.
 */
export function priceNumber(price: string | null): number {
  if (!price) return 0;
  const groups = price.match(/\d[\d\s ]*\d|\d/g) ?? [];
  if (groups.length !== 1) return 0;
  if (/тыс|ming|k\b|\$|usd|₽|руб|€|-|–/i.test(price)) return 0;
  const rest = price.replace(groups[0], "").replace(/[\s.,:]/g, "");
  if (rest && !/^(сум|сўм|so.?m|sum|uzs)$/i.test(rest)) return 0;
  const n = Number(groups[0].replace(/\D/g, ""));
  return n >= 1000 && n < 100_000_000 ? n : 0;
}

const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
const words = (txt: string) =>
  txt
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `<span class="w"><span>${esc(w)}</span></span>`)
    .join(" ");
const TIMES = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];

/** Тексты для site.js Agora: те же ключи, слова про панель и Agora переписаны под клиента. */
function texts(l: InstantLocale, name: string) {
  const t = (ru: string, uz: string) => (l === "ru" ? ru : uz);
  return {
    sum: t("сум", "so‘m"), g: t("г", "g"), stop: t("Сегодня нет", "Bugun yo‘q"), all: t("Показать все {n}", "Hammasini ko‘rsatish: {n}"), none: t("Ничего не нашлось. Попробуйте другое слово.", "Hech narsa topilmadi. Boshqa so‘zni sinab ko‘ring."),
    alias: "", stock: "", like: "", ask: t("Цену уточняйте", "Narxini aniqlang"),
    add: t("В заказ", "Buyurtmaga"), added: t("В заказе", "Buyurtmada"), call: t("Позвонить", "Qo‘ng‘iroq qilish"),
    toDlv: t("Доставка", "Yetkazib berish"), dishes: t("Блюда", "Taomlar"), paused: t("Сейчас заказы не принимаем. Бронь стола работает.", "Hozir buyurtma qabul qilmayapmiz. Stol bron ishlaydi."),
    noModes: t("Заказ с сайта сейчас выключен. Позвоните нам.", "Saytdan buyurtma hozir o‘chirilgan. Bizga qo‘ng‘iroq qiling."), zone: t("Куда везти", "Qayerga olib boramiz"), addr: t("Адрес", "Manzil"), addrPh: t("Улица, дом, подъезд", "Ko‘cha, uy, kirish"),
    zonesDemo: "", dlvFee: t("Доставка", "Yetkazish"), freeFrom: t("бесплатно от", "bepul:"), free: t("бесплатно", "bepul"),
    min: t("мин", "daq"), minOrder: t("Доставка от {n}", "Yetkazish {n} dan"), needAddr: t("Напишите адрес", "Manzilni yozing"), tag_hit: t("Хит", "Xit"), tag_new: t("Новинка", "Yangi"),
    cart: t("Ваш заказ", "Buyurtmangiz"), total: t("Итого", "Jami"), how: t("Как", "Qanday"), toBook: t("К брони", "Bronga"), toGo: t("Навынос", "Olib ketish"),
    name: t("Имя", "Ism"), phone: t("Телефон", "Telefon"), order: t("Оформить заказ", "Buyurtma berish"), clear: t("Очистить", "Tozalash"),
    ordNote: t(`Это макет: заказ никуда не уходит. На рабочем сайте он сразу придёт администратору ${name} в Telegram.`, `Bu maket: buyurtma hech qayerga ketmaydi. Ishchi saytda u darhol ${name} administratoriga Telegramda keladi.`),
    need: t("Напишите имя и телефон", "Ism va telefonni yozing"), pickTime: t("Выберите время", "Vaqtni tanlang"),
    today: t("Сегодня", "Bugun"), tomorrow: t("Завтра", "Ertaga"),
    wd: l === "ru" ? ["вс", "пн", "вт", "ср", "чт", "пт", "сб"] : ["yak", "dush", "sesh", "chor", "pay", "jum", "shan"],
    mon: l === "ru" ? ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"] : ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"],
    bigTable: t("Для большой компании администратор перезвонит, чтобы собрать стол", "Katta davra uchun stolni tayyorlash maqsadida administrator qo‘ng‘iroq qiladi"),
    mine: t("Моя бронь", "Mening bronim"), mineOrd: t("Мой заказ", "Mening buyurtmam"), bookNo: t("Бронь", "Bron"), ordNo: t("Заказ", "Buyurtma"), guests: t("гостей", "mehmon"),
    bst: [t("Новая: ждёт администратора", "Yangi: administratorni kutmoqda"), t("Подтверждена", "Tasdiqlandi"), t("Гости пришли", "Mehmonlar keldi"), t("Отменена", "Bekor qilindi")],
    ost: [t("Новый", "Yangi"), t("Принят", "Qabul qilindi"), t("Готовится", "Tayyorlanmoqda"), t("Готов", "Tayyor"), t("Выдан", "Berildi")],
    mineHint: t(`Это макет: бронь никуда не уходит. На рабочем сайте её подтверждает администратор ${name}, и гость видит статус здесь.`, `Bu maket: bron hech qayerga ketmaydi. Ishchi saytda uni ${name} administratori tasdiqlaydi, mehmon esa holatini shu yerda ko‘radi.`),
    openPanel: t(`Написать в ${name}`, `${name}ga yozish`), sms: t(`Отправить SMS в ${name}`, `${name}ga SMS yuborish`),
    smsText: t("Здравствуйте! Бронь стола: {d}, {t}, гостей {n}, на имя {name}.", "Assalomu alaykum! Stol bron: {d}, {t}, {n} mehmon, {name} nomiga."),
    table7: "", callWaiter: "", callBill: "", qrSent: "", rvGood: "", rvBad: "",
  };
}

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/build, normalizeSite). */
export function restoranHtml(site: InstantSite): string {
  const l: InstantLocale = site.locale;
  const t = (p: Pair) => p[l];
  const name = esc(site.name);
  const tel = telHref(site.phone);
  const tg = handleOf(site.telegram);
  const wa = waHref(site.whatsapp);
  const ig = handleOf(site.instagram);
  const logo = imageUrl(site.logo);
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u)).slice(0, LIMITS.photos);
  const services: InstantService[] = site.services.slice(0, LIMITS.services);
  const chat = tg ? `https://t.me/${tg}` : wa;
  const pic = (k: number) => (own.length ? own[k % own.length] : RESTORAN_PHOTOS[k % RESTORAN_PHOTOS.length]);
  const srcset = (src: string) => (own.length ? "" : ` srcset="${src.replace("-1200", "-900")} 900w, ${src} 1200w"`);
  const mark = logo
    ? `<img src="${esc(logo)}" alt="${name}" referrerpolicy="no-referrer" onerror="this.remove()"><b class="lt">${name}</b>`
    : `<b class="lt">${name}</b>`;
  const logoA = `<a class="logo im-logo" href="#top" aria-label="${name}">${mark}</a>`;
  const callBtn = (cls: string, label: string) => (tel ? `<a class="btn ${cls}" href="${esc(tel)}">${ICON.phone}<span>${label}</span></a>` : "");

  const nav: [string, Pair][] = [
    ...(services.length ? [["menu", C.nav.menu] as [string, Pair]] : []),
    ["book", C.nav.book],
    ["hall", C.nav.hall],
    ["contact", C.nav.contact],
  ];
  const header = `<header class="top"><div class="top-in glass">
${logoA}
<nav class="nav" aria-label="${t(C.sections)}">${nav.map(([id, n]) => `<a href="#${id}">${t(n)}</a>`).join("")}</nav>
<button type="button" class="mine" id="mine" hidden><i class="dot"></i>${ICON.cal}<span>${t(C.mine)}</span></button>
<a class="btn btn-a btn-s tel" href="#book">${ICON.cal}<span>${t(C.bookShort)}</span></a>
</div></header>`;

  const hero = `<section class="hero" id="top" aria-label="${name}">
<div class="hero-bg"><img src="${esc(pic(0))}"${srcset(pic(0))} sizes="100vw" width="1200" height="806" alt="" fetchpriority="high" referrerpolicy="no-referrer"></div>
<div class="wrap hero-in">
<div><p class="kick">${esc(site.tagline ?? (site.city ? `${t(C.kind)} · ${site.city}` : t(C.kind)))}</p>
<h1>${words(site.name)}</h1>
<p class="promo glass" id="promo" hidden></p>
<p class="hsub">${site.about ? esc(site.about) : t(C.lead)}</p>
<div class="hero-act"><a class="btn btn-a" href="#book">${ICON.cal}<span>${t(C.bookBtn)}</span></a>${callBtn("btn-g", t(C.call))}${services.length ? `<a class="btn btn-g" href="#menu">${ICON.menu}<span>${t(C.nav.menu)}</span></a>` : ""}</div></div>
${site.address || site.hours || tel ? `<div class="hcard glass">${site.address ? `<b>${esc(site.address)}</b>` : `<b>${name}</b>`}
${site.hours ? `<span class="row">${ICON.clock}<span data-hours>${esc(site.hours)}</span></span>` : ""}
${tel ? `<span class="row">${ICON.phone}<a href="${esc(tel)}">${esc(site.phone ?? "")}</a></span>` : ""}</div>` : ""}
</div></section>`;

  const half = Math.ceil(services.length / 2);
  const rowOf = (x: string[], c: string) => `<div class="row${c}" aria-hidden="true">${[0, 1, 2].map(() => x.map((s) => `<span>${esc(s)}</span>`).join("")).join("")}</div>`;
  const velo = services.length >= 4 ? `<div class="velo">${rowOf(services.slice(0, half).map((s) => s.name), "")}${rowOf(services.slice(half).map((s) => s.name), " rev")}</div>` : "";

  const menu = services.length
    ? `<section class="sec" id="menu"><div class="wrap">
<p class="kick rise"><i></i>${t(C.menuKick)}</p>
<h2 class="h2 rise">${t(C.menuH)}</h2>
<p class="lead rise">${t(C.menuLead)}</p>
<div class="mn-top"><div class="tabs" id="mn-tabs" role="tablist" style="display:none"><i aria-hidden="true"></i><button type="button" role="tab" data-g="k" aria-selected="true">${t(C.all)}</button></div>
<label class="srch">${ICON.search}<span class="vh">${t(C.search)}</span><input id="mn-q" type="search" placeholder="${t(C.searchPh)}" autocomplete="off"></label></div>
<div class="chips" id="mn-chips" style="display:none"><button type="button" class="chip" data-cat="all" aria-pressed="true">${t(C.all)}</button></div>
<p class="mn-note" id="mn-alc" hidden>${t(C.alc)}</p>
<div id="mn-grid"></div>
</div></section>`
    : "";

  const book = `<section class="sec alt" id="book"><div class="wrap">
<p class="kick rise"><i></i>${t(C.bookKick)}</p>
<h2 class="h2 rise">${t(C.bookH)}</h2>
<p class="lead rise">${t(C.bookLead)}</p>
<div class="bk"><form class="bk-f glass rise" id="bk-form" novalidate>
<h3>${t(C.when)}</h3><div class="days" id="bk-days"></div>
<h3>${t(C.time)}</h3><div class="times" id="bk-times"></div>
<h3>${t(C.ppl)}</h3><div class="ppl"><button type="button" id="bk-m" aria-label="${t(C.less)}">−</button><b id="bk-n" aria-live="polite"></b><button type="button" id="bk-p" aria-label="${t(C.more)}">+</button></div>
<p class="bq" id="bk-q" aria-live="polite"></p>
<label class="fld"><span>${t(C.name)}</span><input id="bk-name" autocomplete="name"></label>
<label class="fld"><span>${t(C.phone)}</span><input id="bk-ph" type="tel" inputmode="tel" autocomplete="tel" value="+"></label>
<label class="fld"><span>${t(C.wish)}</span><input id="bk-note" placeholder="${t(C.wishPh)}"></label>
<button type="submit" class="btn btn-a" style="width:100%">${ICON.cal}<span>${t(C.bookShort)}</span></button>
</form>
<div class="bk-side"><figure class="bk-ph rise"><img src="${esc(pic(1))}"${srcset(pic(1))} sizes="(min-width: 900px) 46vw, 100vw" width="1200" height="806" alt="" loading="lazy" referrerpolicy="no-referrer">${own.length ? "" : `<figcaption class="glass">${t(STOCK_CAP[1])}</figcaption>`}</figure>
${tel || ig || chat ? `<div class="bk-c rise">${tel ? `<a href="${esc(tel)}">${ICON.phone}${esc(site.phone ?? "")}</a><span>${t(C.voice)}</span>` : ""}${chat ? `<a href="${esc(chat)}" target="_blank" rel="noopener">${ICON.tg}${tg ? `@${esc(tg)}` : "WhatsApp"}</a>` : ""}${ig ? `<a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">${ICON.ig}@${esc(ig)}</a>` : ""}</div>` : ""}
<div class="tgw im-tgw rise" aria-label="${t(C.flowH)}"><div class="tg-h"><span class="tg-av">${ICON.tg}</span><span><b>${t(C.flowH)}</b><small>${t(C.flowKick)} · ${t(C.demo)}</small></span></div>
<div class="tg-b"><div class="mg sys">${t(C.flowLead)}</div><div class="mg b"><b>${t(C.demoTitle)}</b>
${t(C.demoWhen)}
${t(C.demoPpl)}
${t(C.demoWho)}: [[t:0]]
${t(C.demoWish)} «[[t:1]]»${t(C.demoWishTail)}</div><div class="kb"><span>${t(C.confirm)}</span></div></div></div>
</div></div></div></section>`;

  const fig = (k: number) => `<figure><img src="${esc(pic(k))}"${srcset(pic(k))} sizes="(min-width: 900px) 34vw, 70vw" width="1200" height="806" alt="" loading="lazy" referrerpolicy="no-referrer">${own.length ? "" : `<figcaption class="glass">${t(STOCK_CAP[k % STOCK_CAP.length])}</figcaption>`}</figure>`;
  const n = own.length || RESTORAN_PHOTOS.length;
  const hallRow = (from: number) => [...Array(Math.max(n, 4)).keys()].map((i) => fig(from + i)).join("");
  const hall = `<section class="sec" id="hall"><div class="wrap">
<p class="kick rise"><i></i>${t(C.hallKick)}</p>
<h2 class="h2 rise">${t(C.hallH)}</h2>
${own.length ? "" : `<p class="lead rise">${t(C.stock)}</p>`}</div>
<div class="hl"><div class="hl-row">${hallRow(0)}</div><div class="hl-row">${hallRow(2)}</div></div>
</section>`;

  const map = site.address ? `https://yandex.uz/maps/?text=${encodeURIComponent(site.address)}` : null;
  const contact =
    site.address || site.hours || tel || ig
      ? `<section class="sec alt" id="contact"><div class="wrap">
<p class="kick rise"><i></i>${t(C.findKick)}</p>
<h2 class="h2 rise">${site.address ? esc(site.address) : name}</h2>
<div class="ct"><div class="ct-c glass rise">
${site.address ? `<div class="r">${ICON.pin}<div><b>${esc(site.address)}</b><span>${t(C.onMap)}</span></div></div>` : ""}
${site.hours ? `<div class="r">${ICON.clock}<div><b data-hours>${esc(site.hours)}</b><span>${t(C.hoursCap)}</span></div></div>` : ""}
${tel ? `<div class="r">${ICON.phone}<div><b><a href="${esc(tel)}">${esc(site.phone ?? "")}</a></b><span>${t(C.phoneCap)}</span></div></div>` : ""}
${ig ? `<div class="r">${ICON.ig}<div><b><a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">@${esc(ig)}</a></b><span>Instagram</span></div></div>` : ""}
<div class="hero-act">${map ? `<a class="btn btn-a" href="${esc(map)}" target="_blank" rel="noopener">${ICON.pin}<span>${t(C.route)}</span></a>` : ""}${callBtn("btn-g", t(C.call))}</div></div>
<div class="ct-map rise" aria-label="${t(C.scheme)}">
<svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="600" height="400" fill="#16110f"/><g stroke="#2a201b" stroke-width="2" fill="none"><path d="M0 80h600M0 170h600M0 300h600M90 0v400M230 0v400M420 0v400M520 0v400M0 360 600 20"/></g><path d="M300 0v400" stroke="#4a3426" stroke-width="16"/><path d="M300 0v400" stroke="#6b4a33" stroke-width="2" stroke-dasharray="10 12"/></svg>
<div class="pin"><i></i><span class="glass">${name}</span></div></div>
</div></div></section>`
      : "";

  const links = [
    tel ? `<a href="${esc(tel)}">${esc(site.phone ?? "")}</a>` : "",
    tg ? `<a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">Telegram</a>` : "",
    wa ? `<a href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : "",
    ig ? `<a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">Instagram</a>` : "",
  ].join("");
  const footer = `<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${logoA}<p style="margin-top:16px">${t(C.footText)}</p></div>
<div><h4>${t(C.sections)}</h4>${nav.map(([id, x]) => `<a href="#${id}">${t(x)}</a>`).join("")}</div>
${links ? `<div><h4>${t(C.contacts)}</h4>${links}</div>` : ""}
</div><div class="sm"><span>© ${name}</span><span>${t(C.mockup)} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${t(C.terms)}</a></span><span>${t(C.source)} ${esc(site.source)}</span></div></div></footer>`;

  const data = {
    l,
    img: IMG,
    tel: site.phone ? site.phone.replace(/[^\d+]/g, "") : "",
    telHref: tel ?? chat ?? "#book",
    chat: chat ?? "",
    panel: "",
    times: TIMES,
    set0: { pause: false, bannerOn: false, banner: "", hours: site.hours ?? "", dlv: { on: false, pick: true, min: 0, free: 0, zones: [] }, book: { from: TIMES[0], to: TIMES[TIMES.length - 1], max: 30, auto: false, pre: true } },
    cats: [{ id: "m", g: "k", n: t(C.nav.menu) }],
    menu: services.map((s, i) => [`d${i}`, "m", s.name, "", priceNumber(s.price), null, null, 0, "k", s.price ?? ""]),
    bot: {},
    t: texts(l, site.name),
  };

  const dock = `<div class="dock glass" id="dock"><a class="btn btn-a" href="#book">${ICON.cal}<span>${t(C.nav.book)}</span></a>${callBtn("btn-a", t(C.call))}${services.length ? `<a class="btn btn-g" href="#menu">${ICON.menu}<span>${t(C.nav.menu)}</span></a>` : ""}</div>`;

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.kind).toLowerCase()}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0c0908">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Forum&family=Manrope:wght@400;700&display=swap">
<style>${assets.css}
:root{${palette(site.color)}}
.im-logo{display:flex;align-items:center;gap:10px;max-width:46vw;min-width:0}
.im-logo img{height:34px;width:auto;max-width:110px;object-fit:contain}
.im-logo .lt{font:400 24px/1.1 var(--hd);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hero h1{overflow-wrap:anywhere}
.hero h1 .w{max-width:100%}
.im-tgw{height:auto;max-height:none}
.im-tgw .tg-av{background:var(--a);color:#fff}
.im-tgw .tg-av svg{width:22px}
.im-tgw .mg{white-space:pre-line}
.im-tgw .kb{display:flex;gap:6px}
.im-tgw .kb span{flex:1;text-align:center}</style>
</head>
<body>
${dzIntroSolo(l)}
<a class="vh" href="#book">${t(C.toBook)}</a>
${header}
<main>
${hero}
${velo}
${menu}
${book}
${hall}
${contact}
</main>
${footer}
<button type="button" class="cart" id="cart" data-addon="order">${ICON.bag}<span id="cart-s"></span><b id="cart-n"></b></button>
${dock}
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="shh"><div class="sh" data-close></div><div class="box"><div class="bh"><b id="shh"></b><button type="button" class="x" data-close aria-label="${t(C.close)}">${ICON.close}</button></div><div class="bb" id="shb"></div></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="ir-data">${json(data)}</script>
<script>
${assets.js}</script>
</body>
</html>`;
}

/** Цвет клиента и часы брони — для админки на стилях Agora. */
export const restoranPalette = palette;
export const RESTORAN_TIMES = TIMES;
