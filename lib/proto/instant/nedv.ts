/**
 * Шаблон «Недвижимость» — главная нашего макета ShahaR.Uz
 * (scripts/protos/shahar/gen.mjs), переодетая под агентство клиента.
 *
 * Владелец, 11.11.2026: «Остальные категории тоже делаем по принципу как
 * сделали со стоматологией». Отсюда устройство: стили и скрипт ShahaR — те
 * же файлы (content/proto-instant/shahar-assets.json, пишет
 * scripts/protos/instant/shahar-assets.mjs), разметка — те же блоки и
 * классы: первый экран с фото, параллаксом и плавающими карточками, поиск
 * «Купить / Снять / Продать», смена слова в заголовке, бегущая строка,
 * карточки объектов, бенто, полоса города с параллаксом, три шага, подбор
 * с живым текстом заявки и итоговый блок с кольцами.
 *
 * Что от ShahaR не берётся, потому что это про них, а не дизайн: их
 * объявления, новостройки и фото, районы Ташкента, лицензия и полис, 13
 * регионов, цифры, рейтинг риэлторов, каталог, валюта по их курсу,
 * ипотека по цене их объекта, конструктор, заставка «SHAHAR». Поиск
 * первого экрана заполняет заявку на подбор (каталога у клиента нет). Нет
 * данных клиента — блока нет; нет фото — нейтральные фото ниши
 * (public/protos/_niche/nedvizhimost). Числа — только клиента.
 */
import assets from "@/content/proto-instant/shahar-assets.json" with { type: "json" };
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { LIMITS, type InstantLocale, type InstantSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";

const IMG = "/protos/_niche/nedvizhimost";
/** Нейтральные фото ниши: гостиная, кухня, частный дом. Фон первого экрана и полосы города — в стилях. */
export const NEDV_PHOTOS = [`${IMG}/n1-900.webp`, `${IMG}/n2-900.webp`, `${IMG}/n3-900.webp`];
export const NEDV_BACKS = [`${IMG}/hero.webp`, `${IMG}/hero-m.webp`, `${IMG}/city.webp`];

type Pair = { ru: string; uz: string };
const P = (ru: string, uz: string): Pair => ({ ru, uz });

const C = {
  kind: P("Агентство недвижимости", "Ko‘chmas mulk agentligi"),
  h1: P("Поможем купить, продать или снять", "Sotib olish, sotish yoki ijaraga olishda yordam beramiz"),
  lead: P("Расскажите, что ищете: подберём варианты и покажем объекты.", "Nima qidirayotganingizni ayting: variantlarni tanlab, obyektlarni ko‘rsatamiz."),
  pick: P("Подберём бесплатно", "Bepul tanlab beramiz"),
  buy: P("Купить", "Sotib olish"),
  rent: P("Снять", "Ijaraga olish"),
  sell: P("Продать или сдать", "Sotish yoki ijaraga berish"),
  obj: P("Объект", "Obyekt"),
  any: P("Любой", "Istalgan"),
  go: P("Подобрать", "Tanlash"),
  types: [P("Квартира", "Kvartira"), P("Дом", "Uy"), P("Новостройка", "Yangi bino"), P("Участок", "Yer uchastkasi"), P("Коммерческая", "Tijorat")],
  rooms: [P("Студия", "Studiya"), P("Однокомнатная", "Bir xonali"), P("Двухкомнатная", "Ikki xonali"), P("Трёхкомнатная и больше", "Uch xonali va undan ko‘p")],
  inCity: P("В городе", "Shaharda"),
  outCity: P("За городом", "Shahar tashqarisida"),
  other: P("Другой город", "Boshqa shahar"),
  svcKick: P("Услуги", "Xizmatlar"),
  svcH: P("Чем поможем", "Nimada yordam beramiz"),
  svcLead: P("Услуги и цены с вашего сайта, в том же порядке.", "Saytingizdagi xizmatlar va narxlar, o‘sha tartibda."),
  ask: P("Цену уточняйте", "Narxini aniqlang"),
  plusKick: P("Почему мы", "Nega biz"),
  plusH: P("Не только объявления", "Faqat e’lonlar emas"),
  plusLead: P("Вашими словами, как на сайте.", "Saytdagidek, o‘z so‘zlaringiz bilan."),
  more: P("Оставить заявку", "Ariza qoldirish"),
  bandKick: P("Где работаем", "Qayerda ishlaymiz"),
  bandH: P("Знаем город и его районы", "Shaharni va tumanlarini bilamiz"),
  howKick: P("Как это работает", "Qanday ishlaydi"),
  howH: P("От заявки до показа", "Arizadan ko‘rsatishgacha"),
  how: [
    [P("Расскажите, что ищете", "Nima qidirayotganingizni ayting"), P("Купить или снять, какой объект, где и на какой бюджет: без регистрации.", "Sotib olish yoki ijara, qanday obyekt, qayerda va qancha byudjet: ro‘yxatdan o‘tmasdan.")],
    [P("Подберём варианты", "Variantlarni tanlaymiz"), P("Заявка приходит нам в Telegram, агент собирает подходящие объекты.", "Ariza bizga Telegramda keladi, agent mos obyektlarni yig‘adi.")],
    [P("Покажем и проведём сделку", "Ko‘rsatamiz va bitimni o‘tkazamiz"), P("Договоримся о просмотре в удобное время и поможем с документами.", "Qulay vaqtda ko‘rishni kelishamiz va hujjatlarda yordam beramiz.")],
  ],
  demo: P("пример", "namuna"),
  demoTitle: P("Заявка на подбор с сайта", "Saytdan tanlash uchun ariza"),
  demoDeal: P("Нужно: купить квартиру", "Kerak: kvartira sotib olish"),
  demoName: P("Имя", "Ism"),
  demoNote: P("Пожелание: рядом с «[[t:1]]»", "Istak: «[[t:1]]» yonida"),
  pickKick: P("Бесплатно · без регистрации", "Bepul · ro‘yxatdan o‘tmasdan"),
  pickH: P("Подберём объект под ваш запрос", "So‘rovingizga mos obyekt tanlab beramiz"),
  pickLead: P("Заполните заявку, и она уйдёт нам в Telegram. Агент пришлёт подборку.", "Arizani to‘ldiring, u bizga Telegramda keladi. Agent tanlovni yuboradi."),
  stepNeed: P("Что нужно", "Nima kerak"),
  stepWhere: P("Где и какая", "Qayerda va qanday"),
  stepTo: P("Куда прислать подборку", "Tanlovni qayerga yuborish"),
  budget: P("Бюджет", "Byudjet"),
  budgetPh: P("Сумма и валюта", "Summa va valyuta"),
  wish: P("Пожелания", "Istaklar"),
  wishPh: P("Своими словами: рядом со школой, не первый этаж, с ремонтом…", "O‘z so‘zlaringiz bilan: maktab yaqinida, birinchi qavat emas, ta’mirli…"),
  nm: P("Как к вам обращаться", "Sizga qanday murojaat qilaylik"),
  ph: P("Телефон", "Telefon"),
  yours: P("Ваша заявка", "Arizangiz"),
  orders: P("заявки", "arizalar"),
  how2: P("Так заявка придёт нам в Telegram: сразу, без почты и капчи.", "Ariza bizga Telegramda shunday keladi: darhol, pochta va kapchasiz."),
  send: P("Отправить в Telegram", "Telegramga yuborish"),
  copy: P("Скопировать заявку", "Arizani nusxalash"),
  finalH: P("Не нашли подходящее? Подберём бесплатно", "Mosini topmadingizmi? Bepul tanlab beramiz"),
  finalP: P("Агент соберёт актуальные объекты под ваши требования.", "Agent talablaringizga mos dolzarb obyektlarni yig‘adi."),
  call: P("Позвонить", "Qo‘ng‘iroq qilish"),
  addr: P("Адрес", "Manzil"),
  hours: P("Часы", "Ish vaqti"),
  sections: P("Разделы", "Bo‘limlar"),
  contacts: P("На связи", "Aloqada"),
  rights: P("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz qabul qilasiz:"),
  terms: P("условия макета", "maket shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  stock: P("Фото для примера: агентство поставит свои объекты.", "Rasmlar namuna uchun: agentlik o‘z obyektlarini qo‘yadi."),
  skip: P("К содержанию", "Asosiy qismga"),
  desc: P("Подбор, покупка, продажа и аренда недвижимости.", "Ko‘chmas mulkni tanlash, sotib olish, sotish va ijara."),
  // Строки для скрипта ShahaR (client.js, #i18n).
  msgHead: P("Заявка «Подберём бесплатно» с сайта", "Saytdan «Bepul tanlab beramiz» arizasi"),
  fDeal: P("Что нужно", "Nima kerak"),
  fType: P("Объект", "Obyekt"),
  fWhere: P("Где", "Qayerda"),
  fRooms: P("Комнат", "Xonalar"),
  need: P("Выберите, что нужно, объект и где, и оставьте телефон: без него агенту некуда отправить подборку.", "Nima kerakligi, obyekt va joyni tanlang hamda telefon qoldiring: usiz agent tanlovni yubora olmaydi."),
  sent: P("Текст заявки скопирован. Открываем наш Telegram, вставьте текст в чат.", "Ariza matni nusxalandi. Telegramimiz ochilmoqda, matnni chatga qo‘ying."),
  sentNoChat: P("Текст заявки скопирован. Позвоните нам и прочитайте его агенту.", "Ariza matni nusxalandi. Bizga qo‘ng‘iroq qiling va uni agentga o‘qing."),
  empty: P("не указано", "ko‘rsatilmagan"),
} as const;

const I = (dd: string, w = 1.8) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${dd}</svg>`;
/** Значки — те же, что у ShahaR. */
const ICON = {
  tg: I('<path d="M21 4 3 11l6 2.5M21 4l-3.5 16-8.5-6.5M21 4 9 13.5V19l3-3.5"/>'),
  home: I('<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  spark: I('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>'),
  bld: I('<path d="M4 21V5l7-2v18M11 21V8l9 3v10M2 21h20M7 8h1M7 12h1M7 16h1M14 13h2M14 17h2"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  pct: I('<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>'),
  users: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5.5 5.5 0 0 1 3.5 6"/>'),
  chart: I('<path d="M3 20h18"/><path d="M6 16v-4M11 16V8M16 16v-6M21 16V5"/>'),
  biz: I('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'),
  shield: I('<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
  doc: I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>', 2),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>', 2),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
};
const BENTO = ["spark", "shield", "doc", "pct", "users", "chart"] as const;

/** Зелёный ShahaR — в оттенок бренда клиента. Золото кнопок остаётся. */
function palette(color: string | null): string {
  const hex = brandColor(color);
  const [h, s0] = hex ? hexToHsl(hex) : [86, 38];
  const s = Math.min(Math.max(s0, 30), 70);
  return [`--bh:${h}`, `--br:hsl(${h} ${s}% 29%)`, `--br2:hsl(${h} ${s}% 40%)`, `--brs:hsl(${h} ${Math.round(s * 0.8)}% 92%)`].join(";");
}

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/build, normalizeSite). */
export function nedvHtml(site: InstantSite): string {
  const l: InstantLocale = site.locale;
  const t = (p: Pair) => p[l];
  const name = esc(site.name);
  const tel = telHref(site.phone);
  const tg = handleOf(site.telegram);
  const wa = waHref(site.whatsapp);
  const ig = handleOf(site.instagram);
  const logo = imageUrl(site.logo);
  const chat = tg ? `https://t.me/${tg}` : wa;
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u));
  const services = site.services.slice(0, LIMITS.services);
  const perks = site.perks.slice(0, LIMITS.perks);
  const pic = (k: number) => (own.length ? own[k % own.length] : NEDV_PHOTOS[k % NEDV_PHOTOS.length]);
  const head = (kicker: string, h: string, lead: string, side = "", anim = "rise") =>
    `<div class="sec-head rv a-${anim}"><div><span class="kicker"><i></i>${kicker}</span><h2 style="margin-top:12px">${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>${side}</div>`;
  const pickBtn = (cls: string) => `<a class="btn ${cls}" href="#podbor">${ICON.spark}${t(C.pick)}</a>`;

  const nav: [string, Pair][] = [
    ...(services.length ? [["#uslugi", C.svcKick] as [string, Pair]] : []),
    ["#kak", C.howKick],
    ["#podbor", C.pick],
  ];
  const mark = logo ? `<img src="${esc(logo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()" class="im-mark">` : `<i aria-hidden="true">${esc(site.name.slice(0, 1).toUpperCase())}</i>`;
  const header = `<header class="top"><div class="wrap">
<a class="logo im-logo" href="#hero" aria-label="${name}">${mark}<span>${name}</span></a>
<nav class="nav" aria-label="${t(C.sections)}">${nav.map(([u, n]) => `<a href="${u}">${t(n)}</a>`).join("")}</nav>
<div class="top-r">${tel ? `<a class="top-tel" href="${esc(tel)}">${esc(site.phone ?? "")}</a>` : ""}${pickBtn("btn-gold btn-sm top-cta")}</div>
</div></header>`;

  // Первый экран: фото с параллаксом, заголовок со сменой слова, поиск и карточки услуг.
  const typeOpts = C.types.map((x) => t(x));
  const rot = services.slice(0, 5).map((s) => s.name);
  const h1 = site.tagline ?? t(C.h1);
  const fc = (k: number, cls: string, depth: number) => {
    const s = services[k];
    return s
      ? `<a class="fc ${cls}" href="#podbor" data-depth="${depth}" aria-label="${esc(s.name)}"><img src="${esc(pic(k))}" alt="" width="720" height="960" loading="eager" referrerpolicy="no-referrer"><div><b class="num">${esc(s.price ?? t(C.ask))}</b><small>${esc(s.name)}</small></div></a>`
      : "";
  };
  const hero = `<section class="hero" id="hero" aria-label="${name}">
<div class="hero-ph" data-l="ph" aria-hidden="true"></div><div class="hero-sh" aria-hidden="true"></div>
<div class="hero-in"><div class="wrap"><div class="hero-grid">
<div>
<span class="kicker hi" style="color:var(--on2)"><i></i>${name}${site.city ? ` · ${esc(site.city)}` : ""}</span>
<h1 class="hi" style="margin-top:16px;--d:80ms">${esc(h1)}${rot.length >= 2 ? `<br><span class="rot" aria-hidden="true">${rot.map((w, k) => `<span${k === 0 ? ' class="on"' : ""}>${esc(w)}</span>`).join("")}</span><span class="vh">${esc(rot.join(", "))}</span>` : ""}</h1>
<p class="lead hi" style="--d:160ms">${esc(site.about ?? t(C.lead))}</p>
<form class="search hi" id="search" style="--d:240ms" action="#podbor" role="search">
<div class="s-tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-deal="buy">${t(C.buy)}</button><button type="button" role="tab" aria-selected="false" data-deal="rent">${t(C.rent)}</button><button type="button" role="tab" aria-selected="false" data-deal="sell">${t(C.sell)}</button><i aria-hidden="true"></i></div>
<input type="hidden" name="deal" value="buy">
<div class="s-row">
<label class="s-f" style="grid-column:1/-1" data-wide><span>${t(C.obj)}</span><select name="type"><option value="">${t(C.any)}</option>${typeOpts.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("")}</select></label>
</div>
<button class="btn btn-main s-go" type="submit">${ICON.search}<span data-go>${t(C.go)}</span></button>
</form>
${perks.length ? `<div class="trust hi" style="--d:320ms">${perks.slice(0, 3).map((p, k) => `<span>${[ICON.shield, ICON.doc, ICON.pin][k]}${esc(p)}</span>`).join("")}</div>` : ""}
</div>
<div class="float" aria-hidden="false">${fc(0, "a", 0.6)}${fc(1, "b", 1)}${fc(2, "c", 1.5)}</div>
</div></div></div>
</section>`;

  // Бегущая строка: услуги навстречу преимуществам.
  const row = (items: string[], rev: boolean) => {
    const s = items.map((x) => `<a href="#podbor"><i></i>${esc(x)}</a>`).join("");
    return `<div class="mq${rev ? " rev" : ""}"><div class="mq-t">${s}</div><div class="mq-t" aria-hidden="true">${s}</div></div>`;
  };
  const marquee = services.length >= 3 ? `<div class="mq-wrap" aria-label="${t(C.svcKick)}">${row(services.map((s) => s.name), false)}${perks.length >= 3 ? row(perks, true) : ""}</div>` : "";

  // Услуги карточками объектов ShahaR.
  const cards = services.length
    ? `<section id="uslugi" style="padding-top:32px"><div class="wrap">
${head(t(C.svcKick), t(C.svcH), t(C.svcLead), `<a class="btn btn-ghost btn-sm" href="#podbor">${t(C.pick)} ${ICON.arrow}</a>`)}
<div class="grid g4">${services.map((s, k) => `<div class="lcw" style="position:relative"><a class="lc rv a-${["key", "tilt", "pop", "rise"][k % 4]}" style="--d:${(k % 4) * 90}ms" href="#podbor">
<div class="ph"><img src="${esc(pic(k))}" alt="${esc(s.name)}" loading="lazy" width="720" height="960" referrerpolicy="no-referrer"><div class="tag"><span>${esc(s.name)}</span></div></div>
<div class="bd"><div class="price"><b class="num">${esc(s.price ?? t(C.ask))}</b></div><p class="pr">${esc(s.name)}</p>${site.city ? `<p class="ad">${ICON.pin}<span>${esc(site.city)}</span></p>` : ""}</div>
</a></div>`).join("")}</div>
</div></section>`
    : "";

  // Бенто: преимущества клиента, первое — крупно на фото.
  const go = `<span class="go">${t(C.more)} ${ICON.arrow}</span>`;
  const bento =
    perks.length >= 2
      ? `<section><div class="wrap">
${head(t(C.plusKick), t(C.plusH), t(C.plusLead))}
<div class="bento">${perks
          .map((p, k) =>
            k === 0
              ? `<a class="bc photo w2 h2 rv a-tilt" href="#podbor"><div class="bg" style="background-image:url(${esc(pic(2))})"></div><span class="beam" aria-hidden="true"></span><span class="ic">${ICON.spark}</span><h3 style="font-size:24px">${esc(p)}</h3>${go}</a>`
              : `<a class="bc${k === 2 ? " dk" : ""} rv a-pop" style="--d:${(k % 3) * 90}ms" href="#podbor"><span class="ic">${ICON[BENTO[k % BENTO.length]]}</span><h3>${esc(p)}</h3>${go}</a>`,
          )
          .join("")}</div>
</div></section>`
      : "";

  // Полоса города с параллаксом.
  const band = `<section class="band" data-scene="band"><div class="band-ph" data-l="band" aria-hidden="true"></div><div class="wrap">
${head(t(C.bandKick), site.city ? esc(site.city) : t(C.bandH), site.city ? t(C.bandH) : "", pickBtn("btn-gold btn-sm"))}
</div></section>`;

  // Три шага и пример заявки в Telegram.
  const how = `<section id="kak"><div class="wrap">
${head(t(C.howKick), t(C.howH), "", pickBtn("btn-main btn-sm"))}
<ol class="how">${C.how.map(([h, p], k) => `<li class="shift rv a-${["left", "rise", "slide"][k]}" data-shift="${[0.06, -0.04, 0.08][k]}" style="--d:${k * 100}ms"><h3>${t(h)}</h3><p>${t(p)}</p></li>`).join("")}</ol>
<div class="im-tg rv a-rise"><div class="im-tg-h">${ICON.tg}<b>${t(C.demoTitle)}</b><small>${t(C.demo)}</small></div><p>${t(C.demoDeal)}<br>${t(C.demoName)}: [[t:0]]<br>${t(C.demoNote)}</p></div>
</div></section>`;

  // Подбор: та же форма ShahaR, заявка — в Telegram агентства.
  const opt = (nm: string, v: string, extra = "") => `<label class="opt"><input type="radio" name="${nm}" value="${esc(v)}"${extra}><span>${esc(v)}</span></label>`;
  const where = site.city ? [site.city, t(C.outCity), t(C.other)] : [t(C.inCity), t(C.outCity), t(C.other)];
  const podbor = `<section id="podbor" style="padding-top:32px"><div class="wrap">
${head(t(C.pickKick), t(C.pickH), t(C.pickLead))}
<form class="book" id="book" novalidate>
<div>
<fieldset class="step rv a-rise"><h3><i>${ICON.home}</i>${t(C.stepNeed)}</h3>
<div class="opts">${[C.buy, C.rent, C.sell].map((v, k) => opt("deal", t(v), k === 0 ? " checked" : "")).join("")}</div>
<div class="opts">${typeOpts.map((v) => opt("type", v)).join("")}</div></fieldset>
<fieldset class="step rv a-rise" style="--d:90ms"><h3><i>${ICON.pin}</i>${t(C.stepWhere)}</h3>
<div class="opts">${where.map((v) => opt("where", v)).join("")}</div>
<div class="opts">${C.rooms.map((v) => opt("rooms", t(v))).join("")}</div>
<div class="field"><label for="budget">${t(C.budget)}</label><input id="budget" name="budget" placeholder="${t(C.budgetPh)}" maxlength="40"></div>
<div class="field"><label for="wish">${t(C.wish)}</label><textarea id="wish" name="wish" maxlength="400" placeholder="${t(C.wishPh)}"></textarea></div></fieldset>
<fieldset class="step rv a-rise" style="--d:180ms"><h3><i>${ICON.tg}</i>${t(C.stepTo)}</h3>
<div class="two"><div class="field"><label for="nm">${t(C.nm)}</label><input id="nm" name="nm" autocomplete="name" maxlength="60"></div>
<div class="field"><label for="ph">${t(C.ph)}</label><input id="ph" name="ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998" maxlength="20"></div></div></fieldset>
</div>
<aside class="sum">
<div class="step rv a-slide">
<h3>${t(C.yours)}</h3>
<div class="msg" aria-live="polite"><div class="msg-h">${ICON.tg}<span>${name} · ${t(C.orders)}</span></div><span id="msg"></span><time id="msg-t"></time></div>
<p class="src">${t(C.how2)}</p>
<div class="cta"><button class="btn btn-main" type="submit" style="width:100%">${ICON.tg}${t(chat ? C.send : C.copy)}</button></div>
<p class="err" id="err" role="alert" hidden></p>
<p class="done" id="done" role="status" hidden></p>
</div>
</aside>
</form>
${own.length ? "" : `<p class="im-stock">${t(C.stock)}</p>`}
</div></section>`;

  const final = `<section class="final"><div class="wrap"><div class="box rv a-pop"><div class="rings" aria-hidden="true"><i></i><i></i><i></i></div>
<h2>${t(C.finalH)}</h2>
<p class="sub" style="margin-top:12px">${t(C.finalP)}</p>
<div class="cta">${pickBtn("btn-gold")}${chat ? `<a class="btn btn-ghost" href="${esc(chat)}">${ICON.tg}${tg ? `@${esc(tg)}` : "WhatsApp"}</a>` : tel ? `<a class="btn btn-ghost" href="${esc(tel)}">${ICON.phone}${t(C.call)}</a>` : ""}</div>
</div></div></section>`;

  const footer = `<footer><div class="wrap">
<div class="cols">
<div><b>${name}</b><ul>${site.address ? `<li>${t(C.addr)}: ${esc(site.address)}</li>` : ""}${site.hours ? `<li>${t(C.hours)}: ${esc(site.hours)}</li>` : ""}</ul></div>
<div><b>${t(C.contacts)}</b><ul>${tel ? `<li><a href="${esc(tel)}">${esc(site.phone ?? "")}</a></li>` : ""}${tg ? `<li><a href="https://t.me/${esc(tg)}">Telegram @${esc(tg)}</a></li>` : wa ? `<li><a href="${esc(wa)}">WhatsApp</a></li>` : ""}${ig ? `<li><a href="https://instagram.com/${esc(ig)}">Instagram</a></li>` : ""}</ul></div>
<div><b>${t(C.sections)}</b><ul>${nav.map(([u, n]) => `<li><a href="${u}">${t(n)}</a></li>`).join("")}</ul></div>
</div>
<div class="rights"><span>${t(C.rights)} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${t(C.terms)}</a>. ${t(C.source)} ${esc(site.source)}</span></div>
</div></footer>`;

  const L = {
    base: "",
    lang: l,
    rate: { sum: 1, eur: 1 },
    msgHead: `${t(C.msgHead)} ${site.name}`,
    fDeal: t(C.fDeal),
    fType: t(C.fType),
    fWhere: t(C.fWhere),
    fRooms: t(C.fRooms),
    fBudget: t(C.budget),
    fWish: t(C.wish),
    fName: t(C.demoName),
    fPhone: t(C.ph),
    need: t(C.need),
    sent: t(chat ? C.sent : C.sentNoChat),
    adminUrl: chat ?? "",
    empty: t(C.empty),
  };

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.kind).toLowerCase()}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0f1a16">
<link rel="preload" as="image" href="${IMG}/hero-m.webp" media="(max-width: 767px)"><link rel="preload" as="image" href="${IMG}/hero.webp" media="(min-width: 768px)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;700&family=Unbounded:wght@700&display=swap">
<script>(function(){var r=document.documentElement;r.classList.add('js');r.classList.add('intro-off')})()</script>
<style>${assets.css}
:root{${palette(site.color)}}
.im-logo{display:flex;align-items:center;gap:10px;min-width:0}
.im-logo span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:46vw}
.im-mark{height:32px;width:auto;max-width:96px;object-fit:contain}
.hero h1{overflow-wrap:anywhere}
.hero h1 .rot{font-size:.6em;height:2.5em;align-content:start;margin-top:.15em}
.hero h1 .rot span{white-space:normal;line-height:1.2}
.bc.photo h3{text-shadow:0 2px 14px hsl(152 30% 6% / .7)}
.band .sub{color:var(--on2)}
@media (max-width:767px){.top-tel{display:none}}
.step h3 i svg{width:16px;height:16px}
.lc .tag span,.lc .pr{overflow:hidden;text-overflow:ellipsis}
.lc .price b{overflow-wrap:anywhere}
.fc small{overflow-wrap:anywhere}
.im-stock{margin:24px 0 0;color:var(--mut);font-size:14px}
.im-tg{margin-top:28px;max-width:440px;padding:16px;border-radius:16px;background:var(--s1);border:1px solid var(--line);box-shadow:var(--sh1)}
.im-tg-h{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.im-tg-h svg{width:20px;height:20px;color:var(--br)}
.im-tg-h small{margin-left:auto;color:var(--mut);font-size:12px}
.im-tg p{margin:0;line-height:1.7;color:var(--fg2)}</style>
</head>
<body class="home" data-page="" data-lang="${l}">
${dzIntroSolo(l)}
<a class="skip" href="#main">${t(C.skip)}</a>
${header}
<main id="main">
${hero}
${marquee}
${cards}
${bento}
${band}
${how}
${podbor}
${final}
</main>
${footer}
<div class="dock" id="dock">${pickBtn("btn-main")}</div>
<script type="application/json" id="i18n">${JSON.stringify(L).replace(/</g, "\\u003c")}</script>
<script>
${assets.js}</script>
</body>
</html>`;
}
