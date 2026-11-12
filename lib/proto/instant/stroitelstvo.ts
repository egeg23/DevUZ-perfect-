/**
 * Шаблон «Стройка и ремонт» — главная нашего макета LIDER PROF PROEKT
 * (scripts/protos/lider-prof/gen.mjs), переодетая под клиента.
 *
 * Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают
 * "другая ниша"… выведем больше ниш которые у нас есть, также переодевать
 * просто». Отсюда устройство: стили и скрипт Lider Prof — те же файлы
 * (content/proto-instant/liderprof-assets.json, пишет
 * scripts/protos/instant/liderprof-assets.mjs), разметка — те же блоки и
 * классы: стеклянная шапка-капсула, первый экран во весь экран с параллаксом
 * (их «первый экран без истории»), услуги путём по этапам, работы карточками
 * с наклоном за курсором, расчёт с брифом в чат, просмотр с поворотом (их 360°), финальный
 * блок, тёмный подвал и кнопки внизу на телефоне.
 *
 * Что от Lider Prof не берётся, потому что это про них, а не дизайн: их имя
 * и буквы-здания в заставке, история при прокрутке из их проектов, 61 проект
 * и их API, фото, цифры студии, заказчики, отзыв, карта их объектов,
 * примеры площадей их школ и садов, адрес и телефоны. Нет данных клиента —
 * блока нет; нет фото — нейтральные фото ниши (public/protos/_niche/stroitelstvo).
 *
 * Шаблонные слова без цифр: каждое число на странице — из данных клиента
 * (lib/proto/instant/check). Номера этапов рисует CSS из data-n.
 */
import assets from "@/content/proto-instant/liderprof-assets.json" with { type: "json" };
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { LIMITS, type InstantLocale, type InstantSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";
import { rgbOf } from "@/lib/proto/instant/dental";

const IMG = "/protos/_niche/stroitelstvo";
/** Нейтральные фото ниши: кухня, ванная, черновой этап, частный дом, спальня, образцы. */
export const STROI_PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `${IMG}/n${n}-1200.webp`);
export const STROI_HERO = `${IMG}/hero.webp`;
export const STROI_PANO = `${IMG}/pano.webp`;
const STOCK = [
  { ru: "Кухня с островом", uz: "Orolli oshxona" },
  { ru: "Ванная комната", uz: "Hammom" },
  { ru: "Черновой этап", uz: "Qora ish bosqichi" },
  { ru: "Частный дом", uz: "Xususiy uy" },
  { ru: "Спальня", uz: "Yotoqxona" },
  { ru: "Материалы и проект", uz: "Materiallar va loyiha" },
];

type Pair = { ru: string; uz: string };
const P = (ru: string, uz: string): Pair => ({ ru, uz });

const C = {
  kind: P("Ремонт и строительство", "Ta’mir va qurilish"),
  sections: P("Разделы", "Bo‘limlar"),
  toMain: P("К содержанию", "Asosiy qismga"),
  nav: { uslugi: P("Услуги", "Xizmatlar"), raboty: P("Работы", "Ishlar"), raschet: P("Расчёт", "Hisob"), kontakty: P("Контакты", "Kontaktlar") },
  cta: P("Обсудить объект", "Obyektni muhokama qilish"),
  call: P("Позвонить", "Qo‘ng‘iroq qilish"),
  h1: P("Ремонт квартир, домов и офисов", "Kvartira, uy va ofislar ta’miri"),
  lead: P("Замер, смета, черновые и чистовые работы, сдача объекта. Опишите объект: посчитаем и ответим.", "O‘lchov, smeta, qora va oq ishlar, obyektni topshirish. Obyektni tasvirlang: hisoblab, javob beramiz."),
  toCalc: P("Рассчитать ремонт", "Ta’mirni hisoblash"),
  svcKick: P("Наши услуги", "Xizmatlarimiz"),
  svcH: P("От замера до сдачи объекта", "O‘lchovdan obyektni topshirishgacha"),
  svcLead: P("Работаем с квартирами, частными домами и коммерческими помещениями. Учитываем пожелания, сроки и бюджет.", "Kvartiralar, xususiy uylar va tijorat binolari bilan ishlaymiz. Istaklar, muddat va byudjetni hisobga olamiz."),
  priceAsk: P("Цену назовём после замера", "Narxini o‘lchovdan keyin aytamiz"),
  workKick: P("Работы", "Ishlar"),
  workH: P("Так может выглядеть ваш объект", "Obyektingiz shunday ko‘rinishi mumkin"),
  workLead: P("Нажмите на карточку, чтобы обсудить похожий ремонт.", "O‘xshash ta’mirni muhokama qilish uchun kartochkani bosing."),
  stock: P("Фото для примера: компания поставит свои работы.", "Rasmlar namuna uchun: kompaniya o‘z ishlarini qo‘yadi."),
  like: P("Хочу так же", "Shunday istayman"),
  calcKick: P("Расчёт ремонта", "Ta’mir hisobi"),
  calcH: P("Опишите объект за минуту", "Obyektni bir daqiqada tasvirlang"),
  calcLead: P("Тип, площадь и что нужно сделать. Справа сразу видно, что войдёт в работу. Заявка уходит в чат компании, стоимость посчитают под ваш объект.", "Turi, maydoni va nima qilish kerakligi. O‘ngda ishga nima kirishi darhol ko‘rinadi. Ariza kompaniya chatiga boradi, narx obyektingizga moslab hisoblanadi."),
  ours: P("Предложение DevUz Studio", "DevUz Studio taklifi"),
  object: P("Объект", "Obyekt"),
  types: [P("Квартира", "Kvartira"), P("Новостройка", "Yangi bino"), P("Частный дом", "Xususiy uy"), P("Офис", "Ofis"), P("Магазин или кафе", "Do‘kon yoki kafe")],
  area: P("Площадь", "Maydon"),
  m2: P("м²", "m²"),
  need: P("Что нужно", "Nima kerak"),
  stages: [
    ["design", P("Дизайн-проект", "Dizayn loyiha"), [P("Планировка и расстановка мебели", "Rejalashtirish va mebel joylashuvi"), P("3D-изображение комнат", "Xonalarning 3D tasviri")]],
    ["demont", P("Демонтаж", "Demontaj"), [P("Снос перегородок и старой отделки", "Devorlar va eski pardozni buzish"), P("Вывоз мусора", "Chiqindini olib chiqish")]],
    ["rough", P("Черновые работы", "Qora ishlar"), [P("Стяжка пола и штукатурка стен", "Pol styajkasi va devor suvoqi"), P("Перегородки по проекту", "Loyiha bo‘yicha devorlar")]],
    ["engin", P("Электрика и сантехника", "Elektr va santexnika"), [P("Новая проводка и щиток", "Yangi simlar va shchit"), P("Трубы, разводка воды и канализации", "Quvurlar, suv va kanalizatsiya")]],
    ["finish", P("Чистовая отделка", "Oq pardoz"), [P("Плитка, покраска, обои, полы", "Kafel, bo‘yoq, gulqog‘oz, pol"), P("Двери, свет, сантехника на месте", "Eshiklar, chiroqlar, santexnika joyida")]],
    ["turnkey", P("Под ключ", "Kalit topshirish"), [P("Смета и закупка материалов", "Smeta va materiallar xaridi"), P("Сдача объекта и уборка", "Obyektni topshirish va tozalash")]],
  ] as [string, Pair, Pair[]][],
  city: P("Район или город", "Tuman yoki shahar"),
  phone: P("Телефон", "Telefon"),
  file: P("Прикрепить план или фото", "Reja yoki rasm biriktirish"),
  willDo: P("Что войдёт в работу", "Ishga nima kiradi"),
  send: P("Отправить на расчёт", "Hisobga yuborish"),
  sendNote: P("Заявка копируется текстом и открывается чат компании: остаётся вставить и отправить. Файл приложите следом в тот же чат.", "Ariza matn bilan nusxalanadi va kompaniya chati ochiladi: qo‘yib yuborish qoladi. Faylni ortidan shu chatga biriktiring."),
  copyNote: P("Заявка копируется текстом: позвоните или отправьте её компании.", "Ariza matn bilan nusxalanadi: qo‘ng‘iroq qiling yoki uni kompaniyaga yuboring."),
  flowKick: P("Заявка с сайта", "Saytdan ariza"),
  flowH: P("Так заявка придёт вам в Telegram", "Ariza sizga Telegramda shunday keladi"),
  flowLead: P("Заказчик описывает объект на сайте, менеджеру сразу приходит сообщение.", "Buyurtmachi saytda obyektni tasvirlaydi, menejerga darhol xabar keladi."),
  demo: P("демо-данные", "demo-ma’lumot"),
  demoTitle: P("Новая заявка на расчёт", "Hisob uchun yangi ariza"),
  demoWho: P("Заказчик", "Buyurtmachi"),
  demoWhat: P("Объект", "Obyekt"),
  demoArea: P("Район", "Mahalla"),
  demoNear: P("Ориентир", "Mo‘ljal"),
  demoShop: P("рядом с «[[t:1]]»", "«[[t:1]]» yonida"),
  panoKick: P("Просмотр с поворотом", "Burib ko‘rish"),
  panoH: P("Загляните в будущий интерьер", "Kelajakdagi interyerga qarang"),
  panoLead: P("Тяните кадр пальцем или мышкой, на телефоне можно просто наклонить его. На рабочем сайте встанут панорамы ваших объектов.", "Kadrni barmoq yoki sichqoncha bilan torting, telefonda shunchaki qiyshaytirish mumkin. Ishchi saytda obyektlaringiz panoramalari turadi."),
  panoLabel: P("Интерьер для примера, просмотр с поворотом", "Namuna interyer, burib ko‘rish"),
  pull: P("тяните", "torting"),
  whyKick: P("Почему мы", "Nega biz"),
  finKick: P("Есть вопросы?", "Savollar bormi?"),
  finH: P("Посчитаем ваш объект и ответим на вопросы", "Obyektingizni hisoblab, savollarga javob beramiz"),
  write: P("Написать", "Yozish"),
  contacts: P("На связи", "Aloqada"),
  office: P("Офис", "Ofis"),
  route: P("Открыть на карте", "Xaritada ochish"),
  rights: P("Это макет: так может выглядеть сайт компании. Название, услуги и контакты взяты из данных компании, расчёт ремонта, просмотр с поворотом и блоки с пометкой «Предложение DevUz Studio» предлагаем мы. Фото для примера.", "Bu maket: kompaniya sayti shunday ko‘rinishi mumkin. Nomi, xizmatlar va kontaktlar kompaniya ma’lumotlaridan olingan, ta’mir hisobi, burib ko‘rish va «DevUz Studio taklifi» belgisi bor bloklarni biz taklif qilyapmiz. Rasmlar namuna uchun."),
  mockup: P("Макет принадлежит DevUz Studio. Использовать его можно только по договору:", "Maket DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:"),
  terms: P("условия использования", "foydalanish shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  desc: P("Ремонт квартир, домов и коммерческих помещений: замер, смета, черновые и чистовые работы. Расчёт ремонта онлайн.", "Kvartira, uy va tijorat binolari ta’miri: o‘lchov, smeta, qora va oq ishlar. Ta’mirni onlayn hisoblash."),
  hello: P("Здравствуйте! Хочу обсудить ремонт. Подскажите, сколько будет стоить и когда можно сделать замер?", "Assalomu alaykum! Ta’mirni muhokama qilmoqchiman. Narxi qancha bo‘ladi va qachon o‘lchash mumkin?"),
  likeText: P("Здравствуйте! Хочу похожий ремонт: ", "Assalomu alaykum! O‘xshash ta’mir istayman: "),
};

/* Иконки — те же, что у Lider Prof. */
const I = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/><path d="m9 13 9-7"/>'),
  wa: I('<path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z"/><path d="M9.2 8.6c.3 2.9 2.4 5.2 5.4 5.9l1.2-1.3-1.8-1-1 .8c-1-.4-1.9-1.3-2.4-2.4l.8-1-1-1.8z"/>'),
  phone: I('<path d="M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2z"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  pencil: I('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>'),
  doc: I('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
  sofa: I('<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M3 11h18v6H3zM5 17v2M19 17v2"/>'),
  helmet: I('<path d="M4 16a8 8 0 0 1 16 0"/><path d="M3 16h18v3H3zM12 8V5M9 9V6M15 9V6"/>'),
  scan: I('<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/><path d="M8 12h8"/>'),
  ruler: I('<path d="m3 17 14-14 4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>'),
  upload: I('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>'),
  rotate: I('<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>'),
  check: I('<path d="m5 12.5 4.5 4.5L19 7"/>'),
};
const SVC_ICONS = [ICON.pencil, ICON.helmet, ICON.ruler, ICON.doc, ICON.sofa, ICON.scan];
const ANIMS = ["draw", "rise", "slab", "floor", "rise", "draw", "slab"];

/**
 * Красный Lider Prof — в цвет бренда клиента. Переменные — в hsl: так их
 * сдвигает отпечаток (lib/proto/stamp). Нет цвета — их же красный тон.
 */
function palette(color: string | null): string {
  const hex = brandColor(color);
  const [h, s0, l0] = hex ? hexToHsl(hex) : [358, 70, 50];
  const s = Math.min(Math.max(s0, 40), 85);
  const l = Math.min(Math.max(l0, 38), 54);
  return [`--red-rgb:${rgbOf(h, s, l)}`, `--red:hsl(${h} ${s}% ${l}%)`, `--red2:hsl(${h} ${s}% ${l - 8}%)`, `--blue:hsl(${h} ${s}% ${l}%)`, `--gold:hsl(${h} ${s}% ${l}%)`].join(";");
}

const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
const two = (n: number) => String(n).padStart(2, "0");

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/build, normalizeSite). */
export function stroitelstvoHtml(site: InstantSite): string {
  const l: InstantLocale = site.locale;
  const t = (p: Pair) => p[l];
  const name = esc(site.name);
  const tel = telHref(site.phone);
  const tg = handleOf(site.telegram);
  const wa = waHref(site.whatsapp);
  const ig = handleOf(site.instagram);
  const logo = imageUrl(site.logo);
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u)).slice(0, LIMITS.photos);
  const services = site.services.slice(0, 8);
  const perks = site.perks.slice(0, LIMITS.perks);
  const hello = t(C.hello);

  /** Чат компании: Telegram → WhatsApp; текст копируется скриптом макета. Нет — звонок. */
  const chat = tg ? `https://t.me/${tg}` : wa;
  const chatIcon = tg ? ICON.tg : wa ? ICON.wa : ICON.phone;
  const chatBtn = (cls: string, label: string, text: string) =>
    chat
      ? `<a class="btn ${cls}" href="${esc(chat)}" data-tg="${esc(text)}" target="_blank" rel="noopener">${chatIcon}<span>${label}</span></a>`
      : tel
        ? `<a class="btn ${cls}" href="${esc(tel)}">${ICON.phone}<span>${t(C.call)}</span></a>`
        : `<a class="btn ${cls}" href="#raschet">${ICON.ruler}<span>${t(C.toCalc)}</span></a>`;

  const pic = (k: number) => (own.length ? own[k % own.length] : STROI_PHOTOS[k % STROI_PHOTOS.length]);
  const small = (src: string) => (own.length ? src : src.replace("-1200", "-640"));
  const hero = own[0] ?? STROI_HERO;

  const nav: [string, Pair][] = [
    ...(services.length ? [["uslugi", C.nav.uslugi] as [string, Pair]] : []),
    ["raboty", C.nav.raboty],
    ["raschet", C.nav.raschet],
    ["kontakty", C.nav.kontakty],
  ];
  const mark = logo
    ? `<img src="${esc(logo)}" alt="${name}" referrerpolicy="no-referrer" onerror="this.remove()"><b class="lt">${name}</b>`
    : `<b class="lt">${name}</b>`;

  const header = `<header class="top" id="head"><div class="wrap">
<a class="logo im-logo" href="#main" aria-label="${name}">${mark}</a>
<nav class="nav" aria-label="${t(C.sections)}">${nav.map(([id, n]) => `<a href="#${id}">${t(n)}</a>`).join("")}</nav>
<div class="top-r">${chatBtn("btn-red btn-sm top-cta", t(C.cta), hello)}</div>
</div></header>`;

  // 1. Первый экран: их «первый экран без истории» — кадр во весь экран с параллаксом.
  const heroSec = `<section class="hero2 dark" id="hero"><img data-depth src="${esc(hero)}"${own.length ? "" : ` srcset="${IMG}/hero-900.webp 900w, ${IMG}/hero.webp 1344w"`} sizes="100vw" alt="" width="1344" height="768" fetchpriority="high" referrerpolicy="no-referrer"><div class="st-shade"></div><div class="wrap">
<span class="kicker"><i></i>${esc(site.tagline ?? (site.city ? `${t(C.kind)} · ${site.city}` : t(C.kind)))}</span>
<h1 class="h1">${name}</h1>
<p class="im-lead">${site.about ? esc(site.about) : t(C.lead)}</p>
<div class="cta">${chatBtn("btn-red", t(C.cta), hello)}<a class="btn btn-ghost" href="#raschet">${ICON.ruler}<span>${t(C.toCalc)}</span></a></div>
</div></section>`;

  // 2. Услуги путём по этапам: услуги клиента, цена — его или «после замера».
  const svc = services.length
    ? `<section id="uslugi"><div class="wrap">
<div class="sec-head rv a-rise"><div><span class="kicker"><i></i>${t(C.svcKick)}</span><h2>${t(C.svcH)}</h2><p class="sub">${t(C.svcLead)}</p></div></div>
<ol class="path">${services.map((s, k) => `<li class="sv rv a-${ANIMS[k % ANIMS.length]}" style="--d:${(k % 2) * 80}ms"><span class="sv-n num im-n" data-n="${two(k + 1)}"></span><span class="sv-ic">${SVC_ICONS[k % SVC_ICONS.length]}</span><div><h3>${esc(s.name)}</h3><p>${s.price ? esc(s.price) : t(C.priceAsk)}</p></div></li>`).join("")}</ol>
</div></section>`
    : "";

  // 3. Работы карточками: наклон за курсором, превью очередью, как у Lider Prof.
  const cards = (own.length ? own : STROI_PHOTOS).slice(0, 6).map((src, k) => {
    const title = own.length ? site.name : STOCK[k % STOCK.length][l];
    const cat = services[k % Math.max(services.length, 1)]?.name ?? t(C.kind);
    return `<a class="pc rv a-${["floor", "rise", "slab"][k % 3]}" style="--d:${(k % 3) * 70}ms" href="${esc(chat ?? "#raschet")}"${chat ? ` data-tg="${esc(t(C.likeText) + title)}" target="_blank" rel="noopener"` : ""}>
<span class="pc-ph tilt"><span class="spot" aria-hidden="true"></span><img data-src="${esc(small(src))}" alt="${esc(title)}" width="640" height="467" decoding="async" referrerpolicy="no-referrer"></span>
<span class="pc-bd"><span class="pc-c">${esc(cat)}</span><b>${esc(title)}</b><span class="pc-m">${t(C.like)}</span></span></a>`;
  });
  const works = `<section id="raboty" class="dark"><div class="wrap">
<div class="sec-head rv a-rise"><div><span class="kicker"><i></i>${t(C.workKick)}</span><h2>${t(C.workH)}</h2><p class="sub">${t(C.workLead)}</p></div></div>
<div class="pgrid">${cards.join("")}</div>
${own.length ? "" : `<p class="im-stock">${t(C.stock)}</p>`}
</div></section>`;

  // 4. Расчёт ремонта: бриф по площади, итог — состав работы и заявка в чат.
  const items = Object.fromEntries(C.stages.map(([id, , list]) => [id, list.map((x) => x[l])]));
  const calc = `<section id="raschet"><div class="wrap">
<div class="sec-head rv a-rise"><div><span class="kicker"><i></i>${t(C.calcKick)}</span><h2>${t(C.calcH)}</h2><p class="sub">${t(C.calcLead)}</p></div><span class="ours">${t(C.ours)}</span></div>
<form class="calc rv a-rise" id="calc" novalidate>
<div class="calc-f">
<fieldset><legend>${t(C.object)}</legend><div class="opts">${C.types.map((x, k) => `<label class="opt"><input type="radio" name="type" value="${esc(x[l])}"${k === 0 ? " checked" : ""}><span>${x[l]}</span></label>`).join("")}</div></fieldset>
<label class="field area"><span>${t(C.area)} <output class="num" id="area-v"></output> ${t(C.m2)}</span><input type="range" id="area" name="area" min="10" max="1000" step="5" value="60" aria-label="${t(C.area)}, ${t(C.m2)}"><span class="area-ex" id="area-ex"></span></label>
<fieldset><legend>${t(C.need)}</legend><div class="opts">${C.stages.map(([id, n], k) => `<label class="opt"><input type="checkbox" name="st" value="${id}" data-n="${esc(n[l])}"${k === 2 || k === 4 ? " checked" : ""}><span>${n[l]}</span></label>`).join("")}</div></fieldset>
<div class="row2"><label class="field"><span>${t(C.city)}</span><input name="city" autocomplete="address-level2" placeholder="${esc(site.city ?? "")}"></label><label class="field"><span>${t(C.phone)}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+"></label></div>
<label class="file"><input type="file" id="plan-f" accept=".pdf,.jpg,.jpeg,.png"><span class="file-b">${ICON.upload}<b id="plan-n">${t(C.file)}</b><small>PDF, JPG</small></span></label>
</div>
<aside class="calc-r glass-l">
<p class="calc-k">${t(C.willDo)}</p>
<ul class="calc-l" id="calc-l"></ul>
<p class="calc-n" id="calc-n"></p>
<button class="btn btn-red" type="submit">${chatIcon}<span>${t(C.send)}</span></button>
<p class="note-ok" id="calc-done" role="status" hidden></p>
<p class="calc-s">${chat ? t(C.sendNote) : t(C.copyNote)}</p>
</aside>
</form>
<script type="application/json" id="calc-data">${json({ ...items, ex: [] })}</script>
<div class="im-flow"><div><p class="kicker"><i></i>${t(C.flowKick)} <span class="ours">${t(C.ours)}</span></p><h2>${t(C.flowH)}</h2><p class="sub">${t(C.flowLead)}</p></div>
<div class="tgc"><div class="tgc-h">${ICON.tg}<b>${t(C.demoTitle)}</b><small>${t(C.demo)}</small></div><dl>${(
    [
      [C.demoWho, l === "uz" ? "Jasur" : "Жасур"],
      [C.demoWhat, `${C.types[0][l]}, ${C.stages[5][1][l].toLowerCase()}`],
      [C.demoArea, "[[t:0]]"],
      [C.demoNear, t(C.demoShop)],
    ] as [Pair, string][]
  )
    .map(([k, v]) => `<dt>${t(k)}</dt><dd>${esc(v)}</dd>`)
    .join("")}</dl></div></div>
</div></section>`;

  // 5. Просмотр 360°: кадр шире экрана, тянем пальцем, мышкой или наклоном.
  const pano = `<section id="pano" class="dark"><div class="wrap">
<div class="sec-head rv a-rise"><div><span class="kicker"><i></i>${t(C.panoKick)}</span><h2>${t(C.panoH)}</h2><p class="sub">${t(C.panoLead)}</p></div><span class="ours">${t(C.ours)}</span></div>
<div class="pano rv a-rise" id="pano-v" tabindex="0" role="img" aria-label="${t(C.panoLabel)}"><div class="pano-in" id="pano-in"><img data-src="${STROI_PANO}" alt="" width="1536" height="672" decoding="async"></div><span class="pano-h">${ICON.rotate}${t(C.pull)}</span><span class="pano-c" aria-hidden="true"><i id="pano-dot"></i></span></div>
</div></section>`;

  // 6. «Почему мы» — словами компании.
  const why = perks.length
    ? `<section id="pochemu"><div class="wrap"><div class="sec-head rv a-rise"><div><span class="kicker"><i></i>${t(C.whyKick)}</span><h2>${name}</h2></div></div><ul class="im-why">${perks.map((x, k) => `<li class="rv a-rise" style="--d:${(k % 2) * 80}ms">${ICON.check}<span>${esc(x)}</span></li>`).join("")}</ul></div></section>`
    : "";

  // 7. Финал: вопросы, чат и телефон.
  const map = site.address ? `https://yandex.uz/maps/?text=${encodeURIComponent(site.address)}` : null;
  const fin = `<section class="final dark"><div class="wrap">
<div class="fin rv a-rise"><span class="kicker"><i></i>${t(C.finKick)}</span><h2>${t(C.finH)}</h2><div class="cta">${chatBtn("btn-red shim", t(C.write), hello)}${tel && chat ? `<a class="btn btn-ghost" href="${esc(tel)}">${ICON.phone}<span>${esc(site.phone ?? "")}</span></a>` : ""}</div>
${site.address || site.hours ? `<ul class="fin-l"><li>${ICON.pin}<span>${[site.address, site.hours].filter(Boolean).map((x) => esc(x ?? "")).join(" · ")}</span></li></ul>` : ""}</div>
</div></section>`;

  const links = [
    tel ? `<li><a href="${esc(tel)}">${esc(site.phone ?? "")}</a></li>` : "",
    tg ? `<li><a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">Telegram · @${esc(tg)}</a></li>` : "",
    wa ? `<li><a href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a></li>` : "",
    ig ? `<li><a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">Instagram · @${esc(ig)}</a></li>` : "",
  ].join("");
  const footer = `<footer class="foot dark" id="kontakty"><div class="wrap">
<div class="cols">
<div><p class="f-name">${name}</p><p>${services.length ? esc(services.slice(0, 5).map((s) => s.name).join(", ")) : t(C.kind)}</p></div>
${links ? `<div><b>${t(C.contacts)}</b><ul>${links}</ul></div>` : ""}
${site.address || site.hours ? `<div><b>${t(C.office)}</b><ul>${site.address ? `<li>${esc(site.address)}</li>` : ""}${site.hours ? `<li>${esc(site.hours)}</li>` : ""}${map ? `<li><a href="${esc(map)}" target="_blank" rel="noopener">${t(C.route)}</a></li>` : ""}</ul></div>` : ""}
</div>
<div class="rights"><span>${t(C.rights)}</span><span>${t(C.mockup)} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${t(C.terms)}</a></span><span>${t(C.source)} ${esc(site.source)}</span></div>
</div></footer>`;

  const dock = `<div class="dock" id="dock">${chatBtn("btn-red", t(C.cta), hello)}${tel && chat ? `<a class="btn btn-ghost dock-call" href="${esc(tel)}" aria-label="${t(C.call)}">${ICON.phone}</a>` : ""}</div>`;

  const ru = l === "ru";
  const i18n = {
    lang: l,
    tg: chat ?? "",
    copied: ru ? "Скопировано" : "Nusxalandi",
    sent: chat ? (ru ? "Текст скопирован. Открываем чат компании, вставьте его и отправьте." : "Matn nusxalandi. Kompaniya chati ochilmoqda, uni qo‘yib yuboring.") : ru ? "Текст скопирован: отправьте его компании." : "Matn nusxalandi: uni kompaniyaga yuboring.",
    found: ru ? "Работ: {n}" : "Ishlar: {n}",
    m2: t(C.m2),
    briefHead: ru ? `Заявка на расчёт ремонта с сайта ${site.name}` : `${site.name} saytidan ta’mir hisobi uchun ariza`,
    bType: ru ? "Объект" : "Obyekt",
    bArea: ru ? "Площадь" : "Maydon",
    bStages: ru ? "Что нужно" : "Nima kerak",
    bCity: ru ? "Район" : "Tuman",
    bName: ru ? "Имя" : "Ism",
    bPhone: ru ? "Телефон" : "Telefon",
    bFile: ru ? "План или фото отправлю следующим сообщением: {f}" : "Reja yoki rasmni keyingi xabarda yuboraman: {f}",
    bNeed: ru ? "Оставьте телефон: без него компании некуда перезвонить." : "Telefon qoldiring: usiz kompaniya qo‘ng‘iroq qila olmaydi.",
    bNone: ru ? "Отметьте хотя бы одну работу." : "Kamida bitta ishni belgilang.",
    empty: ru ? "не указано" : "ko‘rsatilmagan",
    img: IMG,
  };

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.kind).toLowerCase()}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#111215">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Golos+Text:wght@400;700&display=swap">
<script>(function(){var r=document.documentElement;r.classList.add('js');r.classList.add('intro-off');r.classList.add('k-no-story')})()</script>
<style>${assets.css}
:root{${palette(site.color)}}
.im-logo{display:flex;align-items:center;gap:10px;max-width:56vw;text-decoration:none;color:inherit}
.im-logo img{height:30px;width:auto;max-width:120px;object-fit:contain}
.im-logo .lt{font:700 16px/1.1 var(--head);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hero2 .h1{overflow-wrap:anywhere}
.hero2 .st-shade{background:linear-gradient(180deg,rgb(17 18 21 / .35) 0%,rgb(17 18 21 / .12) 30%,rgb(17 18 21 / .88) 100%),linear-gradient(90deg,rgb(17 18 21 / .55) 0%,rgb(17 18 21 / 0) 62%)}
.im-lead{margin-top:16px;max-width:36em;color:var(--on2);font-size:18px}
.im-n::before{content:attr(data-n)}
.im-stock{margin:24px 0 0;color:var(--on2);font-size:14px}
.im-why{list-style:none;display:grid;gap:12px}
@media(min-width:900px){.im-why{grid-template-columns:1fr 1fr}}
.im-why li{display:flex;gap:12px;align-items:flex-start;padding:20px 24px;border-radius:var(--r);background:var(--s1);box-shadow:var(--sh1)}
.im-why svg{width:22px;height:22px;flex:none;color:var(--red)}
.im-flow{display:grid;gap:32px;align-items:center;margin:72px 0 0}
@media(min-width:900px){.im-flow{grid-template-columns:1fr 1fr}}
.im-flow h2{margin:12px 0}
.tgc{border-radius:var(--r);padding:20px;max-width:420px;width:100%;justify-self:center;background:var(--s1);box-shadow:var(--sh2)}
.tgc-h{display:flex;align-items:center;gap:10px}
.tgc-h svg{width:26px;height:26px;color:var(--red)}
.tgc-h small{margin-left:auto;font-size:12px;color:var(--mut);padding:4px 10px;border-radius:999px;background:var(--s2)}
.tgc dl{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin:16px 0 0}
.tgc dt{color:var(--mut)}
.tgc dd{margin:0;font-weight:700;overflow-wrap:anywhere}
.f-name{font:700 20px/1.2 var(--head);color:var(--on);margin-bottom:12px}
.foot .rights{display:grid;gap:8px}
.top{transition:transform 360ms var(--ease),opacity 360ms var(--ease)}
.top.is-away{transform:translate3d(0,-130%,0);opacity:0;pointer-events:none}
.top.is-away .wrap{pointer-events:none}
@media (prefers-reduced-motion:reduce){.top{transition:none}}</style>
</head>
<body class="home" data-page="" data-lang="${l}">
${dzIntroSolo(l)}
<a class="skip" href="#main">${t(C.toMain)}</a>
${header}
<main id="main">
${heroSec}
${svc}
${works}
${calc}
${pano}
${why}
${fin}
</main>
${footer}
${dock}
<script type="application/json" id="im-i18n">${json(i18n)}</script>
<script>
${assets.js}</script>
<script>(function(){var d=document,head=d.getElementById('head'),idle=0,IDLE = 3000;
function show(){head.classList.remove('is-away')}
function hide(){if(head.contains(d.activeElement))return;head.classList.add('is-away');clearTimeout(idle);idle=setTimeout(show,IDLE)}
if(head){addEventListener('scroll',hide,{passive:true});head.addEventListener('focusin',function(){clearTimeout(idle);show()})}
var f=d.getElementById('calc');if(f)f.addEventListener('submit',function(){var v=function(n){var x=f.querySelector('[name="'+n+'"]');return x?(x.value||'').trim():''},on=[].slice.call(f.querySelectorAll('input[name="st"]:checked'));if(!v('phone')||!on.length)return;
var tr=f.querySelector('[name="type"]:checked'),ty=(tr||{}).value||'',ki=['ip','opt','retail','serv','prod'][[].indexOf.call(f.querySelectorAll('[name="type"]'),tr)]||'ip',a=(d.getElementById('area')||{}).value||'',w=on.map(function(x){return x.dataset.n}).join(', ');
try{var k='fe-leads-1',all=JSON.parse(localStorage.getItem(k)||'[]');if(!Array.isArray(all))all=[];all.unshift({id:'s'+Date.now(),ts:Date.now(),name:v('phone'),phone:v('phone'),kind:ki,msg:ty+', '+a+' ${t(C.m2)}: '+w+(v('city')?' · '+v('city'):''),pick:{type:ty,area:a,works:w},tariff:'',page:'home'});localStorage.setItem(k,JSON.stringify(all.slice(0,30)))}catch(e){}},true)})()</script>
</body>
</html>`;
}
