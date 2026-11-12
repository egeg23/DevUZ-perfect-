/**
 * Шаблон «Недвижимость» — наш макет MAVERA, вариант «Премиум» (светлый зал),
 * переодетый под агентство или застройщика клиента.
 *
 * Владелец, 12.11.2026: «у нас осталось 2 макета: учебный центр и недвижка.
 * Можно взять MAVERA целиком, просто заменим логотип компании». Макет живёт
 * на витрине и написан на React, поэтому стили — снимок его страницы
 * (content/proto-instant/mavera-assets.json, пишет
 * scripts/protos/instant/mavera-assets.mjs), а разметка здесь — те же блоки
 * и те же классы: стеклянная шапка, кадр первого экрана с параллаксом и
 * заголовком по словам, лента условий под кадром, кинолента карточек,
 * генплан с нажимаемыми корпусами, шахматка квартир, шаги сделки, итоговый
 * экран на фото.
 *
 * Что от MAVERA не берётся, потому что это про них, а не дизайн: названия
 * ЖК, цены за метр, этажность и число квартир, сроки сдачи, ставки ипотеки и
 * рассрочки, цифры компании, прогноз цены, коммерческие площади, фотоотчёт
 * стройки, их фото. Генплан и шахматка остаются как пример работы сайта:
 * корпуса буквами, квартиры без этажей, площадей и цен, и это подписано.
 * Кинолента показывает услуги клиента, лента под кадром — его «почему мы».
 * Числа на странице — только клиента. Фото — свои или нейтральные фото ниши
 * (public/protos/_niche/nedvizhimost).
 */
import assets from "@/content/proto-instant/mavera-assets.json" with { type: "json" };
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { LIMITS, type InstantLocale, type InstantSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";

const IMG = "/protos/_niche/nedvizhimost";
/** Нейтральные фото ниши: гостиная, кухня, частный дом. */
export const NEDV_PHOTOS = [`${IMG}/n1-900.webp`, `${IMG}/n2-900.webp`, `${IMG}/n3-900.webp`];
/** Кадр первого экрана (и версия для телефона) и фото итогового экрана. */
export const NEDV_BACKS = [`${IMG}/hero.webp`, `${IMG}/hero-m.webp`, `${IMG}/city.webp`];

type Pair = { ru: string; uz: string };
const P = (ru: string, uz: string): Pair => ({ ru, uz });

const C = {
  kind: P("Недвижимость", "Ko‘chmas mulk"),
  h1a: P("От заявки", "Arizadan"),
  h1b: P("до ключей", "kalitgacha"),
  lead: P("Расскажите, что ищете: подберём варианты, покажем объекты и проведём сделку.", "Nima qidirayotganingizni ayting: variantlarni tanlaymiz, obyektlarni ko‘rsatamiz va bitimni o‘tkazamiz."),
  pick: P("Оставить заявку", "Ariza qoldirish"),
  pickShort: P("Заявка", "Ariza"),
  seePlan: P("Смотреть генплан", "Bosh rejani ko‘rish"),
  navSvc: P("Услуги", "Xizmatlar"),
  navPlan: P("Генплан", "Bosh reja"),
  navPick: P("Подбор", "Tanlov"),
  navDeal: P("Сделка", "Bitim"),
  navContacts: P("Контакты", "Aloqa"),
  svcH: P("Чем поможем", "Nimada yordam beramiz"),
  svcNote: P("Наведите на карточку: она выйдет из тени. Листайте вбок.", "Kartaga kursorni olib boring: u soyadan chiqadi. Yonga suring."),
  svcTag: P("Услуга", "Xizmat"),
  ask: P("Цену уточняйте", "Narxini aniqlang"),
  toForm: P("Оставить заявку →", "Ariza qoldirish →"),
  step1: P("Шаг первый · пример", "Birinchi qadam · namuna"),
  planH: P("Выберите корпус", "Korpusni tanlang"),
  planLead: P("Так на вашем сайте будет работать генплан: корпуса нажимаются, справа меняются статус и срок. Корпуса здесь для примера, на рабочем сайте будут ваши.", "Saytingizda bosh reja shunday ishlaydi: korpuslar bosiladi, o‘ngda holat va muddat o‘zgaradi. Bu yerdagi korpuslar namuna uchun, ish saytida siznikilar bo‘ladi."),
  house: P("Корпус", "Korpus"),
  stDone: P("Сдан", "Topshirilgan"),
  stBuild: P("Строится", "Qurilmoqda"),
  stSale: P("Продаётся", "Sotuvda"),
  noteDone: P("Ключи в день сделки", "Kalitlar bitim kuni"),
  noteBuild: P("Срок сдачи появится из вашей базы", "Topshirish muddati bazangizdan chiqadi"),
  noteSale: P("Квартиры открыты к выбору", "Kvartiralar tanlash uchun ochiq"),
  toFlats: P("Выбрать квартиру", "Kvartira tanlash"),
  step2: P("Шаг второй · пример", "Ikkinchi qadam · namuna"),
  boardH: P("Выберите квартиру", "Kvartirani tanlang"),
  boardLead: P("Шахматка этажей со статусами: свободна, бронь, продана. Нажатие на клетку открывает планировку. Цены и площади придут из вашей базы.", "Qavatlar shaxmatkasi holatlar bilan: bo‘sh, bron, sotilgan. Katakni bosish rejani ochadi. Narx va maydonlar bazangizdan keladi."),
  rooms: [P("Студия", "Studiya"), P("Одна комната", "Bir xona"), P("Две комнаты", "Ikki xona"), P("Три комнаты", "Uch xona")],
  cellFree: P("свободна", "bo‘sh"),
  cellBook: P("бронь", "bron"),
  cellSold: P("продана", "sotilgan"),
  flat: P("Квартира", "Kvartira"),
  planNote: P("Цену и планировку пришлём по заявке", "Narx va rejani ariza bo‘yicha yuboramiz"),
  askPlan: P("Запросить планировку", "Rejani so‘rash"),
  fromPick: P("Из шахматки", "Shaxmatkadan"),
  dealKick: P("Сделка", "Bitim"),
  dealH: P("Как проходит сделка", "Bitim qanday o‘tadi"),
  dealLead: P("Четыре шага, первый занимает минуту.", "To‘rt qadam, birinchisi bir daqiqa oladi."),
  deal: [
    [P("Заявка", "Ariza"), P("Рассказываете, что ищете: район, бюджет, сколько комнат.", "Nima qidirayotganingizni aytasiz: tuman, byudjet, nechta xona.")],
    [P("Подбор", "Tanlov"), P("Присылаем варианты, которые подходят под запрос, с планировками.", "So‘rovga mos variantlarni rejalari bilan yuboramiz.")],
    [P("Показ", "Ko‘rsatish"), P("Договариваемся о времени и показываем объекты вживую.", "Vaqtni kelishamiz va obyektlarni jonli ko‘rsatamiz.")],
    [P("Ключи", "Kalitlar"), P("Проверяем документы и ведём сделку до передачи ключей.", "Hujjatlarni tekshiramiz va bitimni kalit topshirilguncha olib boramiz.")],
  ],
  roman: ["I", "II", "III", "IV"],
  demo: P("пример", "namuna"),
  demoTitle: P("Так заявка придёт вам в Telegram", "Ariza sizga Telegramda shunday keladi"),
  demoDeal: P("Нужно: купить квартиру", "Kerak: kvartira sotib olish"),
  demoName: P("Имя", "Ism"),
  demoNote: P("Пожелание: рядом с «[[t:1]]»", "Istak: «[[t:1]]» yonida"),
  bookKick: P("Без регистрации", "Ro‘yxatdan o‘tmasdan"),
  bookH: P("Подберём объект под ваш запрос", "So‘rovingizga mos obyekt tanlab beramiz"),
  bookLead: P("Заполните заявку: она уйдёт нам в Telegram, и агент пришлёт подборку.", "Arizani to‘ldiring: u bizga Telegramga boradi va agent tanlovni yuboradi."),
  fDeal: P("Что нужно", "Nima kerak"),
  buy: P("Купить", "Sotib olish"),
  rent: P("Снять", "Ijaraga olish"),
  sell: P("Продать или сдать", "Sotish yoki ijaraga berish"),
  fSvc: P("Услуга", "Xizmat"),
  anySvc: P("Подскажите, что выбрать", "Nimani tanlashni ayting"),
  wish: P("Пожелания", "Istaklar"),
  wishPh: P("Своими словами: район, бюджет, этаж, ремонт", "O‘z so‘zlaringiz bilan: tuman, byudjet, qavat, ta’mir"),
  nm: P("Как к вам обращаться", "Sizga qanday murojaat qilaylik"),
  ph: P("Телефон", "Telefon"),
  yours: P("Ваша заявка", "Arizangiz"),
  send: P("Отправить в Telegram", "Telegramga yuborish"),
  copy: P("Скопировать заявку", "Arizani nusxalash"),
  msgHead: P("Заявка с сайта", "Saytdan ariza"),
  need: P("Оставьте телефон: без него агенту некуда прислать подборку.", "Telefon qoldiring: usiz agent tanlovni yubora olmaydi."),
  sent: P("Текст заявки скопирован. Открываем наш Telegram, вставьте текст в чат.", "Ariza matni nusxalandi. Telegramimiz ochilmoqda, matnni chatga qo‘ying."),
  sentNoChat: P("Текст заявки скопирован. Позвоните нам и прочитайте его агенту.", "Ariza matni nusxalandi. Bizga qo‘ng‘iroq qiling va uni agentga o‘qing."),
  empty: P("не указано", "ko‘rsatilmagan"),
  finalH: P("Найдём ваш адрес", "Manzilingizni topamiz"),
  finalP: P("Оставьте заявку или напишите нам: ответим и предложим варианты.", "Ariza qoldiring yoki bizga yozing: javob beramiz va variantlar taklif qilamiz."),
  call: P("Позвонить", "Qo‘ng‘iroq qilish"),
  hours: P("Часы", "Ish vaqti"),
  rights: P("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz qabul qilasiz:"),
  terms: P("условия макета", "maket shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  stock: P("Фото для примера: на рабочем сайте будут ваши объекты.", "Rasmlar namuna uchun: ish saytida sizning obyektlaringiz bo‘ladi."),
  skip: P("К содержанию", "Asosiy qismga"),
  sections: P("Разделы", "Bo‘limlar"),
  desc: P("Подбор, покупка, продажа и аренда недвижимости.", "Ko‘chmas mulkni tanlash, sotib olish, sotish va ijara."),
} as const;

/** Генплан макета: те же семь корпусов и те же статусы, вместо номеров — буквы. */
const PLAN: [string, "done" | "build" | "sale", string, number, number][] = [
  ["40,150 150,150 150,215 40,215", "done", "А", 95, 187],
  ["40,230 150,230 150,300 40,300", "done", "Б", 95, 269],
  ["175,120 270,120 270,215 175,215", "sale", "В", 222, 171],
  ["295,120 390,120 390,215 295,215", "sale", "Г", 342, 171],
  ["175,240 390,240 390,300 175,300", "build", "Д", 282, 274],
  ["415,120 520,120 520,200 415,200", "build", "Е", 467, 163],
  ["415,225 520,225 520,300 415,300", "build", "Ж", 467, 266],
];
const PLAN_UZ = ["A", "B", "D", "E", "F", "G", "H"];
const PLAN_OPACITY = { done: 0.32, build: 0.58, sale: 0.9 };
/** Шахматка макета: f — свободна, b — бронь, s — продана. Этажей, площадей и цен нет. */
const BOARD = ["ffffbfbffbff", "fffsffffffff", "fffsfbffsfbf", "ffsssfffsfff", "sffffffsffff", "ffffffffbbff", "fsfbfffsffff", "fffsffffsbsf", "bfffsfffffff", "sffsffssffff", "ffffffbffbff", "ffffbssfsfbf", "fbffssffssbf", "ffbfsfsfbfff", "sffbfssfsffs"];

const WRAP = "mx-auto w-full max-w-[1500px] px-5 sm:px-8";
const SLAB = "w-slab isolate -mt-6 border-t border-[var(--w-line)] sm:-mt-10";
const KICK = "text-[0.7rem] uppercase tracking-[0.3em] text-[var(--w-accent)]";
const H2 = "mt-5 text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.05]";
const LEAD = "mt-5 text-lg leading-relaxed text-[var(--w-muted)]";
const FIELD = "mt-1 w-full border border-[var(--w-line)] bg-[var(--w-bg)] px-3.5 py-2.5 text-sm text-[var(--w-ink)] outline-none placeholder:text-[var(--w-muted)] focus:border-[var(--w-accent)] rounded-[var(--w-radius)]";
const LEGEND = "flex items-center gap-[0.35em] text-[0.52em] text-[var(--mv-muted)]";
const FILL = "position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent";

/** Акцент макета — в цвет клиента: тот же оттенок, светлота как у золота MAVERA, чтобы белый текст читался. */
function palette(color: string | null): string {
  const hex = brandColor(color);
  if (!hex) return "";
  const [h, s0] = hexToHsl(hex);
  const s = Math.min(Math.max(s0, 22), 58);
  const acc = `hsl(${h} ${s}% 38%)`;
  const soft = `hsl(${h} ${s}% 38% / .16)`;
  return `--w-accent:${acc};--w-accent-soft:${soft};--w-accent-ink:#fff;--mv-accent:${acc};--mv-accent-soft:${soft};--mv-accent-ink:#fff`;
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
  const letters = l === "uz" ? PLAN_UZ : PLAN.map((b) => b[2]);
  const head = (kick: string, h: string, lead: string) =>
    `<div class="w-rise max-w-2xl"><p class="${KICK}">${kick}</p><h2 class="${H2}">${h}</h2>${lead ? `<p class="${LEAD}">${lead}</p>` : ""}</div>`;

  // Шапка макета: стекло поверх кадра, вместо знака MAVERA — имя или логотип клиента.
  const nav: [string, Pair][] = [...(services.length ? [["#projects", C.navSvc] as [string, Pair]] : []), ["#genplan", C.navPlan], ["#picker", C.navPick], ["#deal", C.navDeal], ["#contacts", C.navContacts]];
  const mark = logo
    ? `<img src="${esc(logo)}" alt="${name}" referrerpolicy="no-referrer" onerror="this.replaceWith(document.createTextNode(this.alt))" class="mvx-mark">`
    : name;
  const header = `<header id="top" class="mvx-top sticky top-0 z-40 border-b border-[var(--w-line)] bg-[var(--w-bg)]/70 backdrop-blur-xl">
<div class="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-6 px-5 py-4 sm:px-8">
<a href="#hero" class="mvx-logo text-lg font-semibold tracking-[0.3em]" aria-label="${name}">${mark}</a>
<nav class="hidden gap-8 text-sm text-[var(--w-muted)] md:flex" aria-label="${t(C.sections)}">${nav.map(([u, n]) => `<a href="${u}" class="transition-colors hover:text-[var(--w-ink)]">${t(n)}</a>`).join("")}</nav>
<div class="flex items-center gap-3">
${tel ? `<a href="${esc(tel)}" class="hidden rounded-full border border-[var(--w-line)] px-3 py-1.5 text-[0.7rem] tracking-[0.12em] text-[var(--w-muted)] sm:inline-block">${esc(site.phone ?? "")}</a>` : ""}
<a href="#book" class="w-glow rounded-full bg-[var(--w-accent)] px-5 py-2.5 text-sm font-medium text-[var(--w-accent-ink)]"><span class="hidden sm:inline-block">${t(C.pick)}</span><span class="mvx-short">${t(C.pickShort)}</span></a>
</div>
</div>
</header>`;

  // Первый экран: кадр отстаёт от прокрутки, заголовок появляется по словам.
  const words = (text: string, from: number) =>
    text.split(/\s+/).filter(Boolean).map((w, k) => `<span>${k ? " " : ""}<span class="w-word" style="--w-delay:${from + k * 90}ms">${esc(w)}</span></span>`).join("");
  const title = site.tagline ? words(site.tagline, 0) : `${words(t(C.h1a), 0)}<br>${words(t(C.h1b), 300)}`;
  const hero = `<section id="hero" class="w-slab isolate w-slab-flat bg-[var(--w-bg)] pb-16">
<section id="hero-scene" class="relative isolate flex min-h-[100svh] items-end overflow-hidden" aria-label="${name}">
<div class="w-parallax absolute inset-0 -z-30 scale-110" style="transform:translate3d(0, var(--shift, 0px), 0) scale(1.1)">
<picture><source media="(max-width: 767px)" srcset="${IMG}/hero-m.webp"><img alt="" decoding="async" class="object-cover w-kenburns" style="${FILL}" src="${IMG}/hero.webp"></picture>
</div>
<div aria-hidden="true" class="absolute inset-0 -z-20 bg-gradient-to-t from-[var(--w-bg)] via-[var(--w-bg)]/72 to-[var(--w-bg)]/28"></div>
<div aria-hidden="true" class="w-blob absolute -left-32 top-1/4 -z-10 h-[32rem] w-[32rem] rounded-full blur-[120px]" style="background:radial-gradient(circle, var(--w-accent-soft), transparent 70%)"></div>
<div aria-hidden="true" class="w-blob absolute -right-40 bottom-0 -z-10 h-[26rem] w-[26rem] rounded-full blur-[110px]" style="background:radial-gradient(circle, var(--w-accent-soft), transparent 70%);animation-delay:-8s"></div>
<div class="mx-auto w-full max-w-[1500px] px-5 pb-20 sm:px-8 lg:pb-28">
<div class="w-parallax" style="transform:translate3d(0, calc(var(--p, 0) * -90px), 0);opacity:calc(1 - var(--p, 0) * 1.1)">
<div class="relative scroll-mt-[16vh] block">
<p class="${KICK}">${esc(site.city ? `${t(C.kind)} · ${site.city}` : t(C.kind))}</p>
<h1 class="mvx-h1 mt-7 max-w-4xl text-[clamp(2.6rem,7vw,6rem)] leading-[0.98]">${title}</h1>
<p class="mt-8 max-w-xl text-lg leading-relaxed text-[var(--w-muted)]">${esc(site.about ?? t(C.lead))}</p>
</div>
<div class="relative scroll-mt-[16vh] block mt-10">
<div class="flex flex-wrap items-center gap-4">
<span class="inline-block transition-transform duration-300 ease-out w-magnet"><a href="#book" class="w-glow inline-block rounded-full bg-[var(--w-accent)] px-8 py-4 text-sm font-medium text-[var(--w-accent-ink)]">${t(C.pick)}</a></span>
<span class="inline-block transition-transform duration-300 ease-out w-magnet"><a href="#genplan" class="inline-block rounded-full border border-[var(--w-line)] px-8 py-4 text-sm text-[var(--w-ink)] backdrop-blur-sm">${t(C.seePlan)}</a></span>
</div>
</div>
</div>
</div>
<span aria-hidden="true" class="absolute bottom-6 left-1/2 h-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--w-muted)] to-transparent"></span>
</section>
${
  perks.length
    ? `<div class="relative scroll-mt-[16vh] block mx-auto w-full max-w-[1500px] px-5 sm:px-8">
<div class="w-rise relative z-10 -mt-10 grid gap-px overflow-hidden rounded-[var(--w-radius-lg)] border border-[var(--w-line)] bg-[var(--w-line)] shadow-[var(--w-shadow)] sm:grid-cols-3">
${perks.slice(0, 3).map((p) => `<div class="bg-[var(--w-surface)]/90 p-6 backdrop-blur-xl"><p class="mvx-perk font-semibold text-[var(--w-accent)]">${esc(p)}</p></div>`).join("")}
</div>
</div>`
    : ""
}
</section>`;

  // Кинолента макета: вместо их ЖК — услуги клиента с его ценами.
  const rail = services.length
    ? `<section id="projects" class="${SLAB} scroll-mt-24 bg-[var(--w-bg)]">
<div class="${WRAP} pt-24">
<div class="w-rise flex flex-wrap items-end justify-between gap-6"><h2 class="text-[clamp(1.9rem,3.6vw,3rem)]">${t(C.svcH)}</h2><p class="max-w-xs text-sm text-[var(--w-muted)]">${t(C.svcNote)}</p></div>
</div>
<div class="w-rise mx-auto mb-24 mt-10 w-full max-w-[1500px] px-5 sm:px-8" style="--w-delay:80ms">
<div>
<div class="w-rail flex gap-5 overflow-x-auto pb-6" id="rail">
${services
  .map(
    (s, k) => `<a class="group relative w-[min(84vw,30rem)] shrink-0 overflow-hidden rounded-[var(--w-radius-lg)] border border-[var(--w-line)] bg-[var(--w-surface)] transition-all duration-500 ease-[var(--w-ease)] ${k === 0 ? "w-glow" : "opacity-70"}" href="#book" data-card data-svc="${esc(s.name)}">
<div class="relative aspect-[16/10] overflow-hidden">
<img alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" class="object-cover transition-transform duration-[900ms] ease-[var(--w-ease)] group-hover:scale-105 motion-reduce:transform-none" style="${FILL}" src="${esc(pic(k))}">
<div class="absolute inset-0 bg-gradient-to-t from-[var(--w-surface)] via-transparent to-transparent"></div>
<span class="absolute left-5 top-5 rounded-full border border-[var(--w-line)] bg-[var(--w-surface)]/75 px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em] backdrop-blur-sm">${t(C.svcTag)}</span>
</div>
<div class="p-6">
<div class="flex items-baseline justify-between gap-4"><h3 class="mvx-wrap text-2xl">${esc(s.name)}</h3>${site.city ? `<span class="text-sm text-[var(--w-muted)]">${esc(site.city)}</span>` : ""}</div>
<div class="mt-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-t border-[var(--w-line)] pt-4">
<span class="mvx-wrap text-lg font-medium tabular-nums">${esc(s.price ?? t(C.ask))}</span>
<span class="whitespace-nowrap text-sm text-[var(--w-accent)]">${t(C.toForm)}</span>
</div>
</div>
</a>`,
  )
  .join("\n")}
</div>
<div class="mt-2 flex gap-1.5" id="rail-bars" aria-hidden="true">${services.map((_, k) => `<span class="h-0.5 flex-1 rounded-full transition-colors duration-500 ${k === 0 ? "bg-[var(--w-accent)]" : "bg-[var(--w-line)]"}"></span>`).join("")}</div>
</div>
</div>
</section>`
    : "";

  // Генплан макета: те же корпуса и статусы, без номеров, этажности и цен.
  const stName = { done: t(C.stDone), build: t(C.stBuild), sale: t(C.stSale) };
  const legend = (label: string, style: string, cls = "bg-[var(--mv-accent)]") => `<span class="${LEGEND}"><span class="h-[0.5em] w-[0.5em] rounded-[0.1em] ${cls}"${style ? ` style="${style}"` : ""}></span>${label}</span>`;
  const genplan = `<section id="genplan" class="${SLAB} scroll-mt-24 bg-[var(--w-paper)]">
<div class="${WRAP} py-24">
${head(t(C.step1), t(C.planH), t(C.planLead))}
<div class="w-rise mt-12 text-[1.05rem]" style="--w-delay:120ms">
<div class="mvx-two gap-[1.2em] grid grid-cols-[1.9fr_1fr]">
<div class="overflow-hidden rounded-[0.7em] border border-[var(--mv-line)] bg-[var(--mv-raised)] transition-colors duration-500">
<svg viewBox="0 95 560 245" class="h-full w-full" role="group" aria-label="${t(C.navPlan)}" id="gp">
<rect width="560" height="340" fill="var(--mv-raised)"></rect>
<g stroke="var(--mv-line)" stroke-width="1.5" fill="none"><path d="M0 110 H560"></path><path d="M162 110 V330"></path><path d="M402 110 V330"></path><path d="M0 315 H560"></path></g>
<g fill="var(--mv-accent)" opacity="0.08"><circle cx="282" cy="225" r="26"></circle><circle cx="120" cy="330" r="34"></circle><circle cx="470" cy="330" r="30"></circle></g>
${PLAN.map(([pts, st, , x, y], k) => `<g role="button" tabindex="0" aria-label="${t(C.house)} ${letters[k]}, ${stName[st]}" aria-pressed="false" class="cursor-pointer"><polygon points="${pts}" fill="var(--mv-accent)" fill-opacity="${PLAN_OPACITY[st]}" stroke="var(--mv-text)" stroke-opacity="0" stroke-width="2" class="transition-all duration-300 hover:[fill-opacity:0.95]"></polygon><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="20" font-weight="600" fill="var(--mv-accent-ink)" opacity="0.75" pointer-events="none">${letters[k]}</text></g>`).join("\n")}
</svg>
</div>
<aside class="flex flex-col rounded-[0.7em] border border-[var(--mv-line)] bg-[var(--mv-surface)] p-[1.1em] transition-colors duration-500" aria-live="polite">
<span class="text-[0.55em] uppercase tracking-[0.18em] text-[var(--mv-muted)]" id="gp-name">${t(C.house)} ${letters[2]}</span>
<p class="mt-[0.5em] text-[1.3em] font-semibold leading-none text-[var(--mv-text)]" id="gp-st">${t(C.stSale)}</p>
<p class="mt-[0.4em] text-[0.6em] text-[var(--mv-muted)]" id="gp-note">${t(C.noteSale)}</p>
<button type="button" id="gp-go" class="mt-[1em] flex items-center justify-center rounded-full bg-[var(--mv-accent)] py-[0.7em] text-[0.62em] font-medium text-[var(--mv-accent-ink)]">${t(C.toFlats)}</button>
<div class="mt-[1em] flex flex-wrap gap-x-[0.9em] gap-y-[0.4em] border-t border-[var(--mv-line)] pt-[0.8em]">${legend(t(C.stDone), "opacity:0.32")}${legend(t(C.stBuild), "opacity:0.58")}${legend(t(C.stSale), "opacity:0.9")}</div>
</aside>
</div>
</div>
</div>
</section>`;

  // Шахматка макета: те же клетки и статусы, без этажей, площадей и цен.
  const cellName = { f: t(C.cellFree), b: t(C.cellBook), s: t(C.cellSold) };
  const cellCls = { f: "bg-[var(--mv-accent)]", b: "bg-[var(--mv-accent)] opacity-40", s: "bg-[var(--mv-faint)]" };
  const chip = (label: string, k: number) =>
    `<button type="button" data-room="${k}" aria-pressed="${k === 1}" class="rounded-full px-[0.9em] py-[0.35em] text-[0.6em] font-medium transition-colors duration-500 ${k === 1 ? "bg-[var(--mv-accent)] text-[var(--mv-accent-ink)]" : "border border-[var(--mv-line)] text-[var(--mv-muted)]"}">${label}</button>`;
  const picker = `<section id="picker" class="${SLAB} scroll-mt-24 bg-[var(--w-bg)]">
<div class="${WRAP} py-24">
${head(t(C.step2), t(C.boardH), t(C.boardLead))}
<div class="w-rise mt-12 text-[1.05rem]" style="--w-delay:120ms">
<div class="flex flex-col gap-[1em]">
<div class="flex flex-wrap items-center gap-[0.5em]">${C.rooms.map((r, k) => chip(t(r), k)).join("")}<span class="ml-auto text-[0.58em] text-[var(--mv-muted)]" id="pk-house">${t(C.house)} ${letters[2]}</span></div>
<div class="mvx-two gap-[1.2em] grid grid-cols-[1.6fr_1fr]">
<div class="rounded-[0.7em] border border-[var(--mv-line)] bg-[var(--mv-surface)] p-[0.9em] transition-colors duration-500">
<div class="flex flex-col gap-[0.3em]" id="pk">
${BOARD.map((row) => `<div class="flex items-center gap-[0.4em]"><div class="flex flex-1 gap-[0.3em]">${row.split("").map((c) => `<button type="button" data-s="${c}" aria-label="${t(C.flat)}, ${cellName[c as "f"]}" aria-pressed="false" class="block h-[1.05em] flex-1 rounded-[0.15em] transition-all duration-200 ${cellCls[c as "f"]}"></button>`).join("")}</div></div>`).join("\n")}
</div>
<div class="mt-[0.8em] flex flex-wrap gap-x-[0.9em] gap-y-[0.3em] border-t border-[var(--mv-line)] pt-[0.7em]">${legend(cap(t(C.cellFree)), "")}${legend(cap(t(C.cellBook)), "", "bg-[var(--mv-accent)] opacity-40")}${legend(cap(t(C.cellSold)), "", "bg-[var(--mv-faint)]")}</div>
</div>
<aside class="rounded-[0.7em] border border-[var(--mv-line)] bg-[var(--mv-surface)] p-[1.1em] transition-colors duration-500" aria-live="polite">
<p class="text-[0.85em] font-medium text-[var(--mv-text)]" id="pk-title">${t(C.rooms[1])}</p>
<p class="mt-[0.3em] text-[0.58em] text-[var(--mv-muted)]" id="pk-line">${t(C.house)} ${letters[2]} · ${t(C.cellFree)}</p>
<div class="mt-[0.9em] rounded-[0.5em] border border-[var(--mv-line)] p-[0.6em]">
<svg viewBox="0 0 200 150" class="h-full w-full" role="presentation">
<g stroke="var(--mv-text)" stroke-opacity="0.55" stroke-width="3" fill="var(--mv-text)" fill-opacity="0.09"><rect x="10" y="10" width="110" height="80"></rect><rect x="120" y="10" width="70" height="45"></rect><rect x="120" y="55" width="70" height="35"></rect><rect x="10" y="90" width="70" height="50"></rect><rect x="80" y="90" width="110" height="50"></rect></g>
<g stroke="var(--mv-accent)" stroke-width="3" fill="none"><path d="M10 40 V70"></path><path d="M190 100 V130"></path></g>
</svg>
</div>
<p class="mt-[0.9em] text-[0.7em] font-semibold leading-snug text-[var(--mv-text)]">${t(C.planNote)}</p>
<button type="button" id="pk-go" class="mvx-full mt-[0.9em] flex items-center justify-center rounded-full bg-[var(--mv-accent)] py-[0.7em] text-[0.62em] font-medium text-[var(--mv-accent-ink)]">${t(C.askPlan)}</button>
</aside>
</div>
</div>
</div>
</div>
</section>`;

  // Шаги сделки и остальные «почему мы» карточками макета; рядом пример заявки в Telegram.
  const rest = perks.slice(3);
  const deal = `<section id="deal" class="${SLAB} scroll-mt-24 bg-[var(--w-paper)]">
<div class="${WRAP} py-24">
${head(t(C.dealKick), t(C.dealH), t(C.dealLead))}
<ol class="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
${C.deal.map(([h, p], k) => `<li class="w-rise rounded-[var(--w-radius-lg)] border border-[var(--w-line)] bg-[var(--w-surface)] p-6"${k ? ` style="--w-delay:${k * 80}ms"` : ""}><span class="text-sm tabular-nums text-[var(--w-accent)]">${C.roman[k]}</span><h3 class="mt-4 text-xl">${t(h)}</h3><p class="mt-3 text-sm leading-relaxed text-[var(--w-muted)]">${t(p)}</p></li>`).join("\n")}
</ol>
<div class="mt-14 grid gap-4 lg:grid-cols-2">
${rest.map((p, k) => `<div class="w-rise rounded-[var(--w-radius-lg)] border border-[var(--w-line)] p-6"${k ? ` style="--w-delay:${k * 70}ms"` : ""}><h3 class="mvx-wrap text-lg">${esc(p)}</h3></div>`).join("\n")}
<div class="w-rise rounded-[var(--w-radius-lg)] border border-[var(--w-line)] bg-[var(--w-surface)] p-6">
<div class="flex items-baseline justify-between gap-4"><h3 class="text-lg">${t(C.demoTitle)}</h3><span class="text-sm text-[var(--w-muted)]">${t(C.demo)}</span></div>
<p class="mt-3 text-sm leading-relaxed text-[var(--w-muted)]">${t(C.demoDeal)}<br>${t(C.demoName)}: [[t:0]]<br>${t(C.demoNote)}</p>
</div>
</div>
</div>
</section>`;

  // Заявка: карточка макета с полями и живым текстом сообщения.
  const opt = (v: string, on: boolean) => `<label class="mvx-opt"><input type="radio" name="deal" value="${esc(v)}"${on ? " checked" : ""}><span class="rounded-full border border-[var(--w-line)] px-3.5 py-1.5 text-xs text-[var(--w-muted)] transition-colors duration-200">${esc(v)}</span></label>`;
  const book = `<section class="${SLAB} bg-[var(--w-bg)]">
<div class="${WRAP} py-24">
${head(t(C.bookKick), t(C.bookH), t(C.bookLead))}
<form id="book" novalidate class="w-rise mvx-book mt-12 scroll-mt-24 border border-[var(--w-line)] bg-[var(--w-surface)] p-6 sm:p-8 rounded-[var(--w-radius-lg)]">
<div>
<p class="text-xs text-[var(--w-muted)]">${t(C.fDeal)}</p>
<div class="mt-2 flex flex-wrap gap-2">${[C.buy, C.rent, C.sell].map((v, k) => opt(t(v), k === 0)).join("")}</div>
${services.length ? `<label class="mt-6 block text-xs text-[var(--w-muted)]">${t(C.fSvc)}<select name="svc" class="${FIELD}"><option value="">${t(C.anySvc)}</option>${services.map((s) => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join("")}</select></label>` : ""}
<label class="mt-3 block text-xs text-[var(--w-muted)]">${t(C.wish)}<textarea name="wish" rows="3" maxlength="400" placeholder="${t(C.wishPh)}" class="${FIELD}"></textarea></label>
<label class="mt-3 block text-xs text-[var(--w-muted)]">${t(C.nm)}<input type="text" name="nm" autocomplete="name" maxlength="60" class="${FIELD}"></label>
<label class="mt-3 block text-xs text-[var(--w-muted)]">${t(C.ph)}<input type="tel" name="ph" inputmode="tel" autocomplete="tel" placeholder="+998" maxlength="20" class="${FIELD}"></label>
</div>
<div>
<p class="text-[0.7rem] uppercase tracking-[0.24em] text-[var(--w-accent)]">${t(C.yours)}</p>
<div class="mvx-msg mt-3 border border-[var(--w-line)] bg-[var(--w-bg)] px-3.5 py-2.5 text-sm text-[var(--w-ink)] rounded-[var(--w-radius)]" id="msg" aria-live="polite"></div>
<button type="submit" class="mt-5 w-full bg-[var(--w-accent)] px-5 py-3.5 text-sm font-medium text-[var(--w-accent-ink)] transition-opacity hover:opacity-90 w-glow rounded-full">${t(chat ? C.send : C.copy)}</button>
<p class="mt-3 text-sm text-[var(--w-accent)]" id="err" role="alert" hidden></p>
<p class="mt-3 text-sm text-[var(--w-muted)]" id="done" role="status" hidden></p>
</div>
</form>
${own.length ? "" : `<p class="mt-6 text-sm text-[var(--w-muted)]">${t(C.stock)}</p>`}
</div>
</section>`;

  // Итоговый экран макета: фото под бумагой, заголовок по центру.
  const final = `<section id="contacts" class="${SLAB} scroll-mt-24 bg-[var(--w-paper)] overflow-hidden">
<img alt="" loading="lazy" decoding="async" class="-z-20 object-cover opacity-25" style="${FILL}" src="${IMG}/city.webp">
<div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--w-paper)] via-[var(--w-paper)]/85 to-[var(--w-paper)]/65"></div>
<div class="mx-auto w-full max-w-[1500px] px-5 py-28 text-center sm:px-8">
<div class="w-rise">
<h2 class="mx-auto max-w-3xl text-[clamp(2rem,4.4vw,3.6rem)] leading-[1.05]">${t(C.finalH)}</h2>
<p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--w-muted)]">${t(C.finalP)}</p>
<div class="mt-10 flex flex-wrap items-center justify-center gap-4">
<a href="#book" class="w-glow rounded-full bg-[var(--w-accent)] px-9 py-4 text-sm font-medium text-[var(--w-accent-ink)]">${t(C.pick)}</a>
${chat ? `<a href="${esc(chat)}" target="_blank" rel="noopener" class="rounded-full border border-[var(--w-line)] px-9 py-4 text-sm">${tg ? `Telegram @${esc(tg)}` : "WhatsApp"}</a>` : tel ? `<a href="${esc(tel)}" class="rounded-full border border-[var(--w-line)] px-9 py-4 text-sm">${t(C.call)}</a>` : ""}
</div>
</div>
</div>
</section>`;

  const where = [site.address, site.phone, site.hours ? `${t(C.hours)}: ${site.hours}` : null].filter(Boolean).map((x) => esc(x as string)).join(" · ");
  const footer = `<footer class="border-t border-[var(--w-line)] bg-[var(--w-bg)]">
<div class="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-6 px-5 py-10 text-sm text-[var(--w-muted)] sm:px-8">
<span class="mvx-logo text-base tracking-[0.3em] text-[var(--w-ink)]">${name}</span>
${where ? `<span>${where}</span>` : ""}
<span class="flex gap-5">${ig ? `<a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">Instagram</a>` : ""}${tg ? `<a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">Telegram</a>` : ""}${wa ? `<a href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}</span>
</div>
<div class="mx-auto w-full max-w-[1500px] px-5 pb-10 text-sm text-[var(--w-muted)] sm:px-8">${t(C.rights)} <a class="mvx-u" href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${t(C.terms)}</a>. ${t(C.source)} ${esc(site.source)}</div>
</footer>`;

  const L = {
    msgHead: `${t(C.msgHead)} ${site.name}`,
    fDeal: t(C.fDeal),
    fSvc: t(C.fSvc),
    fWish: t(C.wish),
    fName: t(C.demoName),
    fPhone: t(C.ph),
    empty: t(C.empty),
    need: t(C.need),
    sent: t(chat ? C.sent : C.sentNoChat),
    chat: chat ?? "",
    house: t(C.house),
    st: stName,
    note: { done: t(C.noteDone), build: t(C.noteBuild), sale: t(C.noteSale) },
    gp: PLAN.map((b, k) => ({ n: letters[k], s: b[1] })),
    gpStart: 2,
    rooms: C.rooms.map(t),
    cell: cellName,
    fromPick: t(C.fromPick),
  };
  const pal = palette(site.color);

  return `<!doctype html>
<html lang="${l}" class="scroll-smooth">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.kind).toLowerCase()}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#faf8f4">
<link rel="preload" as="image" href="${IMG}/hero-m.webp" media="(max-width: 767px)"><link rel="preload" as="image" href="${IMG}/hero.webp" media="(min-width: 768px)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Spectral:wght@500;600&display=swap">
<style>${assets.css}
:root{--font-inter:"Inter";--font-spectral:"Spectral"}
body{margin:0;background:#faf8f4;overflow-x:hidden}
.mvx-top{transition:transform .45s cubic-bezier(.16,1,.3,1),opacity .45s}
.mvx-top.mvx-away{transform:translateY(-110%);opacity:0;pointer-events:none}
.mvx-logo{display:inline-flex;align-items:center;min-width:0;max-width:52vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-transform:uppercase}
.mvx-mark{height:32px;width:auto;max-width:132px;object-fit:contain}
.mvx-short{display:none}
.mvx-skip{position:absolute;left:8px;top:-60px;z-index:90;background:var(--w-ink,#1c1a16);color:#fff;padding:10px 14px;border-radius:10px}
.mvx-skip:focus{top:8px}
.mvx-h1,.mvx-wrap{overflow-wrap:anywhere}
.mvx-perk{font-size:1.125rem;line-height:1.35;overflow-wrap:anywhere}
.mvx-u{text-decoration:underline;text-underline-offset:3px}
.mvx-opt{cursor:pointer}
.mvx-opt input{position:absolute;opacity:0;pointer-events:none}
.mvx-opt span{display:inline-block}
.mvx-opt input:checked+span{background:var(--w-accent);border-color:var(--w-accent);color:var(--w-accent-ink)}
.mvx-opt input:focus-visible+span,#gp g:focus-visible polygon{outline:2px solid var(--w-ink);outline-offset:2px}
#gp g{outline:none}
.mvx-book{display:grid;gap:2rem;grid-template-columns:1.2fr 1fr}
.mvx-msg{white-space:pre-wrap;min-height:9.5em;line-height:1.7;overflow-wrap:anywhere}
.mvx-full{width:100%}
select,textarea,input,button{font:inherit}
textarea{resize:vertical}
#pk button{min-width:0;padding:0;border:0;cursor:pointer}
#pk button[data-s="s"]{cursor:default}
@media (max-width:767px){.mvx-two{grid-template-columns:1fr}.mvx-book{grid-template-columns:1fr}#pk button{height:1.3em}}
@media (max-width:639px){.mvx-short{display:inline}.mvx-logo{letter-spacing:.1em;font-size:.95rem;max-width:56vw}}
@media (prefers-reduced-motion:reduce){.mvx-top{transition:none}.w-rise{opacity:1;transform:none}.w-word{opacity:1;animation:none}.w-kenburns,.w-blob{animation:none}html{scroll-behavior:auto}}</style>
<noscript><style>.w-rise{opacity:1!important;transform:none!important}</style></noscript>
</head>
<body class="min-h-screen antialiased">
${dzIntroSolo(l)}
<a class="mvx-skip" href="#main">${t(C.skip)}</a>
<div data-world="premium" data-motion="on">
<div data-palette="ivory" class="w-slab w-slab-flat bg-[var(--w-bg)] text-[var(--w-ink)]"${pal ? ` style="${pal}"` : ""}>
${header}
<main id="main">
${hero}
${rail}
${genplan}
${picker}
${deal}
${book}
${final}
</main>
${footer}
</div>
</div>
<script type="application/json" id="i18n">${JSON.stringify(L).replace(/</g, "\\u003c")}</script>
<script>
${assets.js}</script>
</body>
</html>`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
