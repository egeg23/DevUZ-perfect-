/**
 * Шаблон «Автосервис» — главная нашего макета AUTOMECHANIC
 * (scripts/protos/automechanic/gen.mjs), переодетая под клиента.
 *
 * Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают
 * „другая ниша“… выведем больше ниш которые у нас есть, также переодевать
 * просто?». Отсюда устройство: стили и скрипт AUTOMECHANIC — те же файлы
 * (content/proto-instant/automechanic-assets.json, пишет
 * scripts/protos/instant/automechanic-assets.mjs), разметка — те же блоки и
 * классы: шапка, сцена по прокрутке «машина съезжает с подъёмника», плитки
 * фактов, услуги карточками, «как записаться», прайс, запись в три шага с
 * заявкой в Telegram, контакты с маршрутом, итоговый блок и кнопка внизу.
 *
 * Что от AUTOMECHANIC не берётся, потому что это про них, а не дизайн: их
 * имя, фото цеха и BMW (снимки Wikimedia с подписью авторов), «с 1991 года»,
 * масла партнёров и сцена с маслом, «было / стало» их сайта, конструктор
 * цены, установка приложения. Слои сцены — нейтральные кадры ниши
 * (public/protos/_niche/avtoservis: пустой цех, машина без марки и номеров,
 * её диски), стойки подъёмника нарисованы стилями. Нет данных клиента —
 * блока нет; своих чисел шаблон не пишет (lib/proto/instant/check).
 */
import assets from "@/content/proto-instant/automechanic-assets.json" with { type: "json" };
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { slotsOf } from "@/lib/proto/instant/dental";
import { LIMITS, type InstantLocale, type InstantService, type InstantSite, type BaseSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";

const IMG = "/protos/_niche/avtoservis";
/** Нейтральные фото ниши: двигатель, ходовая на подъёмнике, верстак с инструментом, шиномонтаж. */
export const AVTOSERVIS_PHOTOS = [1, 2, 3, 4].map((n) => `${IMG}/n${n}-1200.webp`);
/** Слои сцены: пустой цех, машина без марки, её диски. */
export const AVTOSERVIS_LAYERS = ["far-2000", "far-1100", "car", "rim-f", "rim-r"].map((n) => `${IMG}/${n}.webp`);

type Pair = { ru: string; uz: string };
const P = (ru: string, uz: string): Pair => ({ ru, uz });

const C = {
  kind: P("Автосервис", "Avtoservis"),
  sections: P("Разделы", "Bo‘limlar"),
  nav: { svc: P("Услуги", "Xizmatlar"), book: P("Запись", "Yozilish"), contact: P("Контакты", "Kontaktlar") },
  book: P("Записаться", "Yozilish"),
  call: P("Позвонить", "Qo‘ng‘iroq"),
  callM: P("Позвонить мастеру-приёмщику", "Usta-qabulchiga qo‘ng‘iroq qilish"),
  h1: P("Ремонт и обслуживание <b>автомобилей</b>", "Avtomobillar <b>ta’miri</b> va xizmati"),
  lead: P("Запишитесь с телефона за минуту: выберите работу, день и время, и мастер-приёмщик перезвонит.", "Telefondan bir daqiqada yoziling: ishni, kun va vaqtni tanlang, usta-qabulchi qo‘ng‘iroq qiladi."),
  hint: P("Листайте, и машина съедет с подъёмника", "Pastga suring, mashina ko‘targichdan tushadi"),
  end: P("Следующей заедет ваша", "Endi navbat sizniki"),
  say: [P("Заезжаем в цех", "Sexga kiramiz"), P("Ремонт окончен, опускаем", "Ta’mir tugadi, tushiramiz"), P("Машина готова, можно ехать", "Mashina tayyor, yo‘lga chiqish mumkin")],
  hours: P("Часы работы", "Ish vaqti"),
  addr: P("Адрес", "Manzil"),
  phone: P("Телефон", "Telefon"),
  svcKick: P("Услуги", "Xizmatlar"),
  svcH: P("Работы, которые делаем в цехе", "Sexda qiladigan ishlarimiz"),
  svcLead: P("Выберите работу, и запись откроется уже с ней.", "Ishni tanlang, yozilish shu ish bilan ochiladi."),
  more: P("Записаться", "Yozilish"),
  ask: P("Цену назовёт мастер-приёмщик", "Narxni usta-qabulchi aytadi"),
  whyKick: P("Почему к нам", "Nega bizga"),
  howKick: P("Запись", "Yozilish"),
  howH: P("Записаться с телефона за минуту", "Telefondan bir daqiqada yozilish"),
  how: [
    [P("Выберите услугу", "Xizmatni tanlang"), P("Работу из списка или «не знаю, нужна диагностика».", "Ro‘yxatdagi ishni yoki «bilmayman, diagnostika kerak»ni.")],
    [P("Опишите машину", "Mashinani tasvirlang"), P("Марка, модель и что беспокоит. Пишите своими словами.", "Marka, model va nima bezovta qilyapti. O‘z so‘zlaringiz bilan yozing.")],
    [P("Выберите день и время", "Kun va vaqtni tanlang"), P("Заявка уходит мастеру-приёмщику, он перезвонит и подтвердит.", "Ariza usta-qabulchiga ketadi, u qo‘ng‘iroq qilib tasdiqlaydi.")],
    [P("Приезжайте", "Keling"), P("Адрес и маршрут ниже, в «Контактах».", "Manzil va yo‘nalish pastda, «Kontaktlar»da.")],
  ],
  priceKick: P("Цены", "Narxlar"),
  priceH: P("Сколько стоят работы", "Ishlar qancha turadi"),
  priceLead: P("Цены с вашего сайта. Точную сумму мастер-приёмщик скажет после осмотра.", "Narxlar saytingizdan. Aniq summani usta-qabulchi ko‘rikdan keyin aytadi."),
  bookH: P("Запись в цех", "Sexga yozilish"),
  bookLead: P("Три шага, и заявка у мастера-приёмщика. Он перезвонит и подтвердит время.", "Uch qadamda ariza usta-qabulchiga yetadi. U qo‘ng‘iroq qilib vaqtni tasdiqlaydi."),
  s1: P("Что нужно сделать", "Nima qilish kerak"),
  s2: P("Машина", "Mashina"),
  s3: P("Когда удобно", "Qachon qulay"),
  diag: P("Не знаю, нужна диагностика", "Bilmayman, diagnostika kerak"),
  car: P("Марка и модель", "Marka va model"),
  carPh: P("Например, ваша марка и модель", "Masalan, markangiz va modelingiz"),
  trouble: P("Что беспокоит", "Nima bezovta qilyapti"),
  troublePh: P("Своими словами: стучит спереди на кочках, горит лампа…", "O‘z so‘zlaringiz bilan: chuqurlarda old tomondan taqillaydi, chiroq yonadi…"),
  nm: P("Как к вам обращаться", "Sizga qanday murojaat qilaylik"),
  your: P("Ваша заявка", "Arizangiz"),
  apps: P("заявки", "arizalar"),
  viaTg: P("Так заявка придёт мастеру-приёмщику в Telegram: сразу, без почты и CRM.", "Ariza usta-qabulchiga Telegramda shunday keladi: darhol, pochta va CRMsiz."),
  demo: P("Пример заявки", "Ariza namunasi"),
  demoWho: P("Клиент", "Mijoz"),
  demoCar: P("Машина", "Mashina"),
  send: P("Отправить мастеру-приёмщику", "Usta-qabulchiga yuborish"),
  orCall: P("Или позвонить", "Yoki qo‘ng‘iroq qilish"),
  ctKick: P("Контакты", "Kontaktlar"),
  ctH: P("Как нас найти", "Bizni qanday topish mumkin"),
  finalH: P("Запишитесь, мастер-приёмщик перезвонит", "Yoziling, usta-qabulchi qo‘ng‘iroq qiladi"),
  pages: P("Разделы", "Bo‘limlar"),
  rights: P("Это макет DevUz Studio: так может выглядеть новый сайт. Услуги, цены и контакты взяты с вашего сайта или из ответов в боте, фото для примера. Заявки в макете никуда не уходят. Пользуясь макетом, вы принимаете", "Bu DevUz Studio maketi: yangi sayt shunday ko‘rinishi mumkin. Xizmatlar, narxlar va kontaktlar saytingizdan yoki botdagi javoblardan olingan, rasmlar namuna uchun. Maketda arizalar hech qayerga ketmaydi. Maketdan foydalanib, siz qabul qilasiz:"),
  terms: P("условия макета", "maket shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  skip: P("К содержанию", "Asosiy qismga"),
  desc: P("Ремонт и обслуживание автомобилей, запись онлайн.", "Avtomobillar ta’miri va xizmati, onlayn yozilish."),
} as const;

const I = (dd: string, w = 1.8) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${dd}</svg>`;
const ICON = {
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  tg: I('<path d="M21 4 3 11l6 2.5M21 4l-3.5 16-8.5-6.5M21 4 9 13.5V19l3-3.5"/>'),
  cal: I('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>', 2),
  down: I('<path d="m6 9 6 6 6-6"/>'),
  ig: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>'),
};
/** Своё движение у карточки — по кругу, как у восьми услуг AUTOMECHANIC. */
const MOTIONS = ["engine", "wheel", "scan", "press", "flash", "seat", "blink", "hitch"];

/** Красный AUTOMECHANIC — в цвет бренда клиента. Тёмный цех остаётся: на нём любой цвет смотрится. */
function palette(color: string | null): string {
  const hex = brandColor(color);
  const [h, s0, l0] = hex ? hexToHsl(hex) : [357, 76, 48];
  const s = Math.min(Math.max(s0, 45), 85);
  const l = Math.min(Math.max(l0, 42), 56);
  return [`--red:hsl(${h} ${s}% ${l}%)`, `--red2:hsl(${h} ${Math.min(s + 6, 90)}% ${Math.min(l + 14, 68)}%)`, `--hue:${h}`].join(";");
}

const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

/** Куда уходит заявка: Telegram → WhatsApp → звонок. */
function goUrl(site: BaseSite): string {
  const tg = handleOf(site.telegram);
  if (tg) return `https://t.me/${tg}`;
  return waHref(site.whatsapp) ?? telHref(site.phone) ?? "#zapis";
}

/** Строки для client.js AUTOMECHANIC: те же ключи, слова про их сервис — под клиента. */
function texts(site: BaseSite) {
  const ru = site.locale === "ru";
  const tg = handleOf(site.telegram);
  const via = tg ? "Telegram" : waHref(site.whatsapp) ? "WhatsApp" : "";
  const phone = site.phone ?? "";
  return {
    base: "",
    lang: site.locale,
    say: C.say.map((p) => p[site.locale]),
    days: ru ? ["вс", "пн", "вт", "ср", "чт", "пт", "сб"] : ["yak", "dush", "sesh", "chor", "pay", "jum", "shan"],
    months: ru ? ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"] : ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"],
    today: ru ? "сегодня" : "bugun",
    tomorrow: ru ? "завтра" : "ertaga",
    times: slotsOf(site.hours),
    msgHead: ru ? `Заявка с сайта ${site.name}` : `${site.name} saytidan ariza`,
    fService: ru ? "Услуга" : "Xizmat",
    fCar: ru ? "Машина" : "Mashina",
    fTrouble: ru ? "Что беспокоит" : "Nima bezovta qilyapti",
    fWhen: ru ? "Когда" : "Qachon",
    fName: ru ? "Имя" : "Ism",
    fPhone: ru ? "Телефон" : "Telefon",
    empty: ru ? "не указано" : "ko‘rsatilmagan",
    need: ru ? "Выберите услугу, день и время и оставьте телефон: без него мастеру-приёмщику некуда перезвонить." : "Xizmat, kun va vaqtni tanlang va telefon qoldiring: usiz usta-qabulchi qo‘ng‘iroq qila olmaydi.",
    sent: via
      ? ru
        ? `Текст заявки скопирован. Открываем ${via}, вставьте текст в чат.${phone ? " Если не открылся, позвоните: " : ""}`
        : `Ariza matni nusxalandi. ${via} ochilmoqda, matnni chatga qo‘ying.${phone ? " Ochilmasa, qo‘ng‘iroq qiling: " : ""}`
      : ru
        ? `Текст заявки скопирован.${phone ? " Позвоните, и мастер-приёмщик запишет: " : ""}`
        : `Ariza matni nusxalandi.${phone ? " Qo‘ng‘iroq qiling, usta-qabulchi yozib qo‘yadi: " : ""}`,
    phoneM: phone,
    tgUrl: goUrl(site),
  };
}

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/build, normalizeSite). */
export function avtoservisHtml(site: BaseSite): string {
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
  const pic = (k: number) => (own.length ? own[k % own.length] : AVTOSERVIS_PHOTOS[k % AVTOSERVIS_PHOTOS.length]);
  const mark = logo ? `<img src="${esc(logo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : "";
  const logoA = `<a class="logo im-logo" href="#top" aria-label="${name}">${mark}<span>${name}</span></a>`;
  const callBtn = (label: string, cls = "btn btn-ghost") => (tel ? `<a class="${cls}" href="${esc(tel)}">${ICON.phone}${label}</a>` : "");
  const head = (kicker: string, h: string, lead = "") =>
    `<div class="sec-head rv a-rise"><span class="kicker"><i></i>${kicker}</span><h2 style="margin-top:12px">${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div>`;

  const nav: [string, Pair][] = [...(services.length ? [["uslugi", C.nav.svc] as [string, Pair]] : []), ["zapis", C.nav.book], ["kontakty", C.nav.contact]];
  const header = `<header class="top"><div class="wrap">
${logoA}
<nav class="nav" aria-label="${t(C.sections)}">${nav.map(([id, n]) => `<a href="#${id}">${t(n)}</a>`).join("")}</nav>
${tel ? `<a class="top-call" href="${esc(tel)}" aria-label="${t(C.callM)}">${ICON.phone}</a>` : ""}
<a class="btn btn-main btn-sm top-cta" href="#zapis">${ICON.cal}${t(C.book)}</a>
</div></header>`;

  const kicker = [site.city, site.tagline].filter(Boolean).map((x) => esc(x as string)).join(" · ") || t(C.kind);
  const post = '<div class="par post l im-post"></div><div class="par post r im-post"></div>';
  const hero = `<section class="scene" id="top" data-scene="hero" aria-label="${name}">
<div class="stage">
<div class="par far im-far" data-l="far" aria-hidden="true"></div>
<div class="par rig" data-l="rig" aria-hidden="true">
${post}
<div class="par shadow" data-l="shadow"></div>
<div class="par lift" data-l="lift">
<div class="par deck im-deck"></div>
<div class="par car" data-l="car"><img src="${IMG}/car.webp" alt="" width="1800" height="568" fetchpriority="high"><i class="rim f" data-l="rimf" style="background-image:url(${IMG}/rim-f.webp)"></i><i class="rim r" data-l="rimr" style="background-image:url(${IMG}/rim-r.webp)"></i></div>
</div>
</div>
<div class="par floor" aria-hidden="true"></div>
<div class="par fg l im-post" data-l="fgl" aria-hidden="true"></div>
<div class="par fg r im-post" data-l="fgr" aria-hidden="true"></div>
<div class="hero-txt" data-l="txt"><div class="wrap">
<span class="kicker"><i></i>${kicker}</span>
<h1 style="margin-top:16px">${name}</h1>
<p class="lead">${site.about ? esc(site.about) : t(C.h1).replace(/<\/?b>/g, "") + ". " + t(C.lead)}</p>
<div class="cta"><a class="btn btn-main" href="#zapis">${ICON.cal}${t(C.book)}</a>${tel ? `<a class="btn btn-ghost" href="${esc(tel)}">${ICON.phone}${esc(site.phone ?? "")}</a>` : ""}</div>
<p class="scroll-hint">${ICON.down}${t(C.hint)}</p>
</div></div>
<div class="say" aria-hidden="true"><p data-say="0"></p></div>
<div class="end" data-l="end"><div class="wrap"><h2>${t(C.end)}</h2><div class="cta"><a class="btn btn-main" href="#zapis">${ICON.cal}${t(C.book)}</a>${callBtn(t(C.call))}</div></div></div>
</div>
</section>`;

  const facts = [
    site.hours ? `<div><b>${t(C.hours)}</b><span>${esc(site.hours)}</span></div>` : "",
    site.address ? `<div><b>${site.city ? esc(site.city) : t(C.addr)}</b><span>${esc(site.address)}</span></div>` : "",
    site.phone && tel ? `<div><b>${t(C.phone)}</b><span><a href="${esc(tel)}">${esc(site.phone)}</a></span></div>` : "",
  ].filter(Boolean);
  const factsBlock = facts.length ? `<section style="padding-top:32px"><div class="wrap"><div class="facts rv a-rise">${facts.join("")}</div></div></section>` : "";

  const svcBlock = services.length
    ? `<section id="uslugi"><div class="wrap">
${head(t(C.svcKick), t(C.svcH), t(C.svcLead))}
<div class="svc">${services.map((s, k) => `<a class="card rv a-${MOTIONS[k % MOTIONS.length]}" style="--d:${(k % 4) * 80}ms" href="#zapis" data-pick="s${k}"><span class="ph" style="background-image:url(${esc(pic(k))})" role="img" aria-label="${esc(s.name)}"></span><span class="bd"><h3>${esc(s.name)}</h3><p>${s.price ? esc(s.price) : t(C.ask)}</p><span class="more">${t(C.more)} →</span></span></a>`).join("")}</div>
</div></section>`
    : "";

  const whyBlock = site.perks.length
    ? `<section><div class="wrap">${head(t(C.whyKick), name)}<div class="price">${site.perks.map((p, k) => `<div class="price-row rv a-rise im-perk" style="--d:${k * 60}ms">${ICON.check}<span>${esc(p)}</span></div>`).join("")}</div></div></section>`
    : "";

  const howBlock = `<section><div class="wrap">
${head(t(C.howKick), t(C.howH))}
<ol class="steps">${C.how.map(([h, p], k) => `<li class="rv a-rise" style="--d:${k * 90}ms"><h3>${t(h)}</h3><p>${t(p)}</p></li>`).join("")}</ol>
<div class="cta"><a class="btn btn-main" href="#zapis">${ICON.cal}${t(C.book)}</a></div>
</div></section>`;

  const priced = services.filter((s) => s.price);
  const priceBlock = priced.length
    ? `<section><div class="wrap">
${head(t(C.priceKick), t(C.priceH), t(C.priceLead))}
<div class="price">${priced.map((s, k) => `<div class="price-row rv a-rise" style="--d:${k * 60}ms"><span>${esc(s.name)}</span><em>${esc(s.price ?? "")}</em></div>`).join("")}</div>
</div></section>`
    : "";

  const opt = (nm: string, value: string, label: string, extra = "") => `<label class="opt"><input type="radio" name="${nm}" value="${esc(value)}"${extra}><span>${esc(label)}</span></label>`;
  const svcOpts = [...services.map((s, k) => opt("s", s.name, s.name, ` data-id="s${k}"`)), opt("s", t(C.diag), t(C.diag), ' data-id="x"')].join("");
  const bookBlock = `<section id="zapis"><div class="wrap">
${head(t(C.nav.book), t(C.bookH), t(C.bookLead))}
<form class="book" id="book" novalidate>
<div>
<fieldset class="step"><h3><i data-n="1"></i>${t(C.s1)}</h3><div class="opts">${svcOpts}</div></fieldset>
<fieldset class="step"><h3><i data-n="2"></i>${t(C.s2)}</h3>
<div class="field"><label for="car">${t(C.car)}</label><input id="car" name="car" autocomplete="off" placeholder="${t(C.carPh)}" maxlength="80"></div>
<div class="field"><label for="trouble">${t(C.trouble)}</label><textarea id="trouble" name="trouble" maxlength="400" placeholder="${t(C.troublePh)}"></textarea></div></fieldset>
<fieldset class="step"><h3><i data-n="3"></i>${t(C.s3)}</h3>
<div class="opts" id="days"></div>
<div class="opts" id="times"></div>
<div class="two"><div class="field"><label for="nm">${t(C.nm)}</label><input id="nm" name="nm" autocomplete="name" maxlength="60"></div>
<div class="field"><label for="ph">${t(C.phone)}</label><input id="ph" name="ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998" maxlength="20"></div></div></fieldset>
</div>
<aside class="sum">
<div class="step">
<h3>${t(C.your)}</h3>
<div><div class="msg" aria-live="polite"><div class="msg-h">${ICON.tg}<span>${name} · ${t(C.apps)}</span></div><span id="msg"></span><time id="msg-t"></time></div>
<p class="src">${t(C.viaTg)}</p>
<p class="src im-demo">${t(C.demo)}: ${t(C.demoWho)} [[t:0]], ${t(C.demoCar).toLowerCase()} [[t:1]]</p></div>
<div class="cta"><button class="btn btn-main" type="submit" style="width:100%">${ICON.tg}${t(C.send)}</button>${tel ? `<a class="btn btn-ghost" style="width:100%" href="${esc(tel)}">${ICON.phone}${t(C.orCall)} ${esc(site.phone ?? "")}</a>` : ""}</div>
<p class="err" id="err" role="alert" hidden></p>
<p class="done" id="done" role="status" hidden></p>
</div>
</aside>
</form></div></section>`;

  const q = site.address ? encodeURIComponent(site.address) : null;
  const rows = [
    site.address ? `<div><dt>${t(C.addr)}</dt><dd>${esc(site.address)}</dd></div>` : "",
    tel ? `<div><dt>${t(C.phone)}</dt><dd><a href="${esc(tel)}">${esc(site.phone ?? "")}</a></dd></div>` : "",
    tg ? `<div><dt>Telegram</dt><dd><a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">@${esc(tg)}</a></dd></div>` : "",
    wa ? `<div><dt>WhatsApp</dt><dd><a href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a></dd></div>` : "",
    ig ? `<div><dt>Instagram</dt><dd><a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">@${esc(ig)}</a></dd></div>` : "",
    site.hours ? `<div><dt>${t(C.hours)}</dt><dd>${esc(site.hours)}</dd></div>` : "",
  ].filter(Boolean);
  const contactBlock = rows.length
    ? `<section id="kontakty"><div class="wrap">
${head(t(C.ctKick), t(C.ctH))}
<div class="contact"><div class="box rv a-rise"><dl>${rows.join("")}</dl>
${q ? `<div class="route"><a class="btn btn-main btn-sm" href="https://yandex.uz/maps/?text=${q}" target="_blank" rel="noopener">${ICON.pin}${l === "ru" ? "Яндекс Карты" : "Yandex Xaritalar"}</a><a class="btn btn-ghost btn-sm" href="https://www.google.com/maps/search/?api=1&amp;query=${q}" target="_blank" rel="noopener">${ICON.pin}Google Maps</a></div>` : ""}
</div>
<div class="ph im-ctph rv a-rise" style="background-image:url(${esc(pic(2))})" role="img" aria-label="${name}"></div></div>
</div></section>`
    : "";

  const finalBlock = `<section class="final"><div class="wrap"><div class="box rv a-rise">
<h2>${t(C.finalH)}</h2>
${site.address ? `<p class="sub" style="margin:12px auto 0">${esc(site.address)}</p>` : ""}
<div class="cta"><a class="btn btn-main" href="#zapis">${ICON.cal}${t(C.book)}</a>${tel ? `<a class="btn btn-ghost" href="${esc(tel)}">${ICON.phone}${esc(site.phone ?? "")}</a>` : ""}</div>
</div></div></section>`;

  const footer = `<footer><div class="wrap">
<div class="cols">
<div><b>${name}</b><ul>${site.address ? `<li>${esc(site.address)}</li>` : ""}${site.hours ? `<li>${esc(site.hours)}</li>` : ""}</ul></div>
<div><b>${t(C.ctKick)}</b><ul>${tel ? `<li><a href="${esc(tel)}">${esc(site.phone ?? "")}</a></li>` : ""}${tg ? `<li><a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">Telegram</a></li>` : ""}${wa ? `<li><a href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a></li>` : ""}${ig ? `<li><a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">Instagram</a></li>` : ""}</ul></div>
<div><b>${t(C.pages)}</b><ul>${nav.map(([id, n]) => `<li><a href="#${id}">${t(n)}</a></li>`).join("")}</ul></div>
</div>
<div class="rights"><span>${t(C.rights)} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${t(C.terms)}</a>.</span><span>${t(C.source)} ${esc(site.source)}</span></div>
</div></footer>`;

  return `<!doctype html>
<html lang="${l}" class="k-no-pwa">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.kind).toLowerCase()}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#101217">
<link rel="preload" as="image" href="${IMG}/car.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Oswald:wght@700&display=swap">
<script>document.documentElement.classList.add('js','dz-off')</script>
<style>${assets.css}
:root{${palette(site.color)}}
.im-far{background:center/cover no-repeat url(${IMG}/far-2000.webp)}
@media (max-width:767px){.im-far{background-image:url(${IMG}/far-1100.webp)}}
.im-post{background:linear-gradient(90deg,hsl(222 8% 10%),hsl(222 6% 26%) 45%,hsl(222 8% 14%))}
.post.im-post{width:auto;aspect-ratio:203/1600;border-radius:4px 4px 0 0}
.fg.im-post{background:linear-gradient(90deg,hsl(222 12% 4% / .92),hsl(222 8% 12% / .9) 50%,hsl(222 12% 4% / .92));filter:blur(6px)}
@media (max-width:767px){.fg.im-post{width:12vw;min-width:44px}.post.im-post{display:none}}
.im-deck{background:linear-gradient(180deg,hsl(222 6% 30%),hsl(222 8% 13%) 22%,hsl(222 10% 8% / 0) 70%)}
.rim.f{left:13.71%;top:55.71%;width:11.28%}
.rim.r{left:72.46%;top:56.19%;width:11.28%}
.top{transition:transform .35s ease,opacity .35s ease}
.top.hide{transform:translateY(-100%);opacity:0;pointer-events:none}
.im-logo{gap:10px;align-items:center;max-width:58vw;min-width:0}
.im-logo img{height:32px;width:auto;max-width:96px;object-fit:contain}
.im-logo span{overflow:hidden;text-overflow:ellipsis}
.im-perk{justify-content:flex-start;align-items:center}
.im-perk svg{width:22px;height:22px;flex:none;color:var(--red2)}
.im-demo{color:var(--fg2)}
.step h3 i[data-n]::before{content:attr(data-n)}
@media (min-width:768px){.facts{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}}
.im-ctph{min-height:260px;border-radius:var(--r);background:var(--s2) center/cover no-repeat}
</style>
</head>
<body>
${dzIntroSolo(l)}
<a class="skip" href="#main">${t(C.skip)}</a>
${header}
<main id="main">
${hero}
${factsBlock}
${svcBlock}
${whyBlock}
${howBlock}
${priceBlock}
${bookBlock}
${contactBlock}
${finalBlock}
</main>
${footer}
<div class="dock" id="dock"><a class="btn btn-main" href="#zapis">${ICON.cal}${t(C.book)}</a></div>
<script type="application/json" id="as-i18n">${json(texts(site))}</script>
<script>
${assets.js}
(function(){var d=document,top=d.querySelector('.top'),IDLE=/*~*/3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);if(!top.contains(d.activeElement))top.classList.add('hide');idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
addEventListener('scroll',headIdle,{passive:true});
d.querySelectorAll('[data-pick]').forEach(function(a){a.addEventListener('click',function(){var x=d.querySelector('#book input[data-id="'+a.getAttribute('data-pick')+'"]');if(x){x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}))}})});
})();</script>
</body>
</html>`;
}

/** Цвет клиента — для админки на стилях шаблона. */
export const avtoservisPalette = palette;
