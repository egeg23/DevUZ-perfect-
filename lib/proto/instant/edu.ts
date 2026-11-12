/**
 * Шаблон «Учебный центр»: наш макет MedAcademy, вариант B «Лаборатория»
 * (витрина cases.devuz.studio/medacademy/b), переодетый под клиента.
 *
 * Владелец, 12.11.2026: «Для обучающего центра мы делали для медиков 2
 * варианта, вот там был фиолетовый с зеленым, круто выглядели - Прицепить
 * туда их логотип и погнали». Отсюда устройство: стили — собранные стили
 * того макета (scripts/protos/instant/medacademy/style.css → content/
 * proto-instant/medacademy-assets.json, пишет medacademy-assets.mjs),
 * разметка — те же блоки и классы: шапка-капсула, первый экран с
 * молекулами на холсте, формулой в заголовке, плитками-«элементами» и
 * наклонной карточкой с фото, лаймовая бегущая строка, светлый раздел
 * курсов с вкладками и цветными карточками, преподаватели карточками с
 * оборотом, лаймовый блок контактов. Скрипт написан заново без библиотек
 * (scripts/protos/instant/medacademy/client.js): там был React.
 *
 * Что от MedAcademy не берётся, потому что это про них, а не дизайн: их
 * знак и название, фото преподавателей и учебника, баллы DTM и калькулятор
 * балла, экспресс-тест по биологии, цены, часы и число лекций, отзывы,
 * адрес и контакты, заглушки допов («Кабинет», «Сертификат», «Блог»).
 * Нет данных клиента: блока нет; нет фото: нейтральные фото ниши
 * (public/protos/_niche/uchebnyy-centr). Числа только клиента.
 */
import assets from "@/content/proto-instant/medacademy-assets.json" with { type: "json" };
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { LIMITS, type InstantLocale, type InstantSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";

const IMG = "/protos/_niche/uchebnyy-centr";
/** Нейтральные фото ниши: светлый класс с ноутбуками, стол ученика. */
export const EDU_PHOTOS = [`${IMG}/n1-1200.webp`, `${IMG}/n2-1200.webp`];

type Pair = { ru: string; uz: string };
const P = (ru: string, uz: string): Pair => ({ ru, uz });

const C = {
  kind: P("Учебный центр", "O‘quv markazi"),
  h1: P("Учитесь у тех, кто объясняет понятно", "Tushunarli tushuntiradiganlardan o‘rganing"),
  result: P("результат", "natija"),
  lead: P("Курсы в группах и индивидуально. Напишите нам: подберём группу и время.", "Guruhda va yakka tartibda kurslar. Bizga yozing: guruh va vaqtni tanlaymiz."),
  sign: P("Записаться", "Yozilish"),
  courses: P("Курсы и цены", "Kurslar va narxlar"),
  course: P("Курс", "Kurs"),
  coursesKick: P("Курсы", "Kurslar"),
  coursesH: P("Выберите курс", "Kursni tanlang"),
  price: P("Стоимость", "Narxi"),
  priceAsk: P("Цену уточняйте при записи", "Narxini yozilishda aniqlang"),
  hoursShort: P("Часы", "Ish vaqti"),
  where: P("Где", "Qayerda"),
  teachersKick: P("Преподаватели", "O‘qituvchilar"),
  teachersH: P("Знают предмет. Объяснят и вам.", "Fanni biladi. Sizga ham tushuntiradi."),
  teachersLead: P("Нажмите на карточку: на обороте, как записаться к преподавателю.", "Kartochkani bosing: orqa tomonida o‘qituvchiga qanday yozilish yozilgan."),
  teacher: P("Преподаватель", "O‘qituvchi"),
  flip: P("показать оборот", "orqa tomonini ko‘rsatish"),
  toTeacher: P("Напишите нам и назовите преподавателя: подберём группу и время.", "Bizga yozing va o‘qituvchini ayting: guruh va vaqtni tanlaymiz."),
  flowKick: P("Предложение DevUz Studio", "DevUz Studio taklifi"),
  flowH: P("Так заявка придёт вам в Telegram", "Ariza sizga Telegramda shunday keladi"),
  flowLead: P("Ученик нажимает «Записаться», пишет в чат центра, а администратор видит курс и вопрос сразу.", "O‘quvchi «Yozilish»ni bosadi, markaz chatiga yozadi, administrator esa kurs va savolni darhol ko‘radi."),
  demo: P("пример", "namuna"),
  demoTitle: P("Заявка на курс с сайта", "Saytdan kursga ariza"),
  demoCourse: P("Курс: вечерняя группа", "Kurs: kechki guruh"),
  demoName: P("Имя", "Ism"),
  demoNote: P("Вопрос: можно ли заниматься рядом с «[[t:1]]»?", "Savol: «[[t:1]]» yonida o‘qisa bo‘ladimi?"),
  contactsKick: P("Контакты", "Aloqa"),
  contactsH: P("Напишите. Ответим и подберём курс.", "Yozing. Javob beramiz va kurs tanlaymiz."),
  addr: P("Адрес", "Manzil"),
  hours: P("Часы работы", "Ish vaqti"),
  phone: P("Телефон", "Telefon"),
  call: P("Позвонить", "Qo‘ng‘iroq qilish"),
  sections: P("Разделы", "Bo‘limlar"),
  top: P("наверх", "yuqoriga"),
  about: P("Коротко о центре", "Markaz haqida qisqacha"),
  rights: P("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz qabul qilasiz:"),
  terms: P("условия макета", "maket shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  stock: P("Фото для примера: учебный центр поставит свои.", "Rasmlar namuna uchun: o‘quv markazi o‘zinikini qo‘yadi."),
  skip: P("К содержанию", "Mazmunga o‘tish"),
  desc: P("Курсы, цены и запись на занятия.", "Kurslar, narxlar va darslarga yozilish."),
  hello: P("Здравствуйте! Хочу записаться на курс.", "Assalomu alaykum! Kursga yozilmoqchiman."),
  helloCourse: P("Здравствуйте! Хочу записаться на курс «{c}».", "Assalomu alaykum! «{c}» kursiga yozilmoqchiman."),
} as const;

const ICONS = assets.icons as Record<string, string>;
const icon = (k: string, cls: string) => `<svg viewBox="0 0 24 24" fill="none" class="${cls}" aria-hidden="true">${ICONS[k]}</svg>`;

/** Цвета плиток и карточек макета: фиолетовый, розовый, лайм, голубой, белый. */
const TILE = ["bg-[#8d66ff] text-white", "bg-[#e995be] text-[#191337]", "bg-[#cff846] text-[#191337]"];
const CARD = ["bg-[#8d66ff] text-white", "bg-[#e995be] text-[#191337]", "bg-[#7dc2e3] text-[#191337]", "bg-white text-[#191337]"];
const BACK = ["bg-[#8d66ff] text-white", "bg-[#e995be] text-[#191337]", "bg-[#7dc2e3] text-[#191337]", "bg-[#8d66ff] text-white"];

/**
 * Фиолетовый и лайм макета стоят переменными. Своего цвета у клиента нет:
 * остаётся фиолетовый с лаймом. Есть: фон уходит в его оттенок (такой же
 * тёмный), фиолетовые плитки красятся в его цвет, лайм остаётся: на тёмном
 * фоне он и есть акцент макета.
 */
/**
 * Макет всегда фиолетовый с лаймом (владелец, 12.11.2026: «фиолетовый с
 * зеленым, круто выглядели»): цвет клиента его не перекрашивает.
 */
function palette(_color: string | null): string {
  return "";
}

/** Знак плитки-«элемента»: две буквы названия курса, как Ch и Bi у макета. */
function symbol(name: string): string {
  const letters = name.replace(/[^\p{L}]+/gu, "");
  const a = letters.slice(0, 1).toUpperCase();
  const b = letters.slice(1, 2).toLowerCase();
  return a + b;
}

/** Собрать страницу. Данные уже очищенные (lib/proto/instant/build, normalizeSite). */
export function eduHtml(site: InstantSite): string {
  const l: InstantLocale = site.locale;
  const t = (p: Pair) => p[l];
  const name = esc(site.name);
  const tel = telHref(site.phone);
  const tg = handleOf(site.telegram);
  const wa = waHref(site.whatsapp);
  const ig = handleOf(site.instagram);
  const logo = imageUrl(site.logo);
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u));
  const services = site.services.slice(0, LIMITS.services);
  const doctors = site.doctors.slice(0, LIMITS.doctors);
  const perks = site.perks.slice(0, LIMITS.perks);
  const photo = own[0] ?? EDU_PHOTOS[0];

  /** Запись: чат центра с готовым текстом, как у макета. Чата нет: звонок. */
  const chatHref = (text: string) =>
    tg ? `https://t.me/${tg}?text=${encodeURIComponent(text)}` : wa ? `${wa}${wa.includes("?") ? "&" : "?"}text=${encodeURIComponent(text)}` : null;
  const signHref = (text = t(C.hello)) => chatHref(text) ?? tel;
  const sign = (cls: string, text?: string, withIcon = false) => {
    const href = signHref(text);
    if (!href) return "";
    const ext = href.startsWith("tel:") ? "" : ' target="_blank" rel="noopener noreferrer"';
    return `<a href="${esc(href)}"${ext} class="${cls}">${withIcon ? icon(href.startsWith("tel:") ? "phone" : "tg", "h-6 w-6") : ""}${t(C.sign)}</a>`;
  };

  const nav: [string, Pair][] = [
    ...(services.length ? [["#courses", C.coursesKick] as [string, Pair]] : []),
    ...(doctors.length ? [["#teachers", C.teachersKick] as [string, Pair]] : []),
    ["#contacts", C.contactsKick],
  ];
  const mark = (cls: string) =>
    logo
      ? `<img alt="${name}" src="${esc(logo)}" referrerpolicy="no-referrer" onerror="this.replaceWith(document.createTextNode(this.alt))" class="${cls} w-auto im-mark">`
      : `<span class="ma-display text-base im-name">${name}</span>`;

  const header = `<header class="sticky top-0 z-50 px-3 pt-3 sm:px-5 im-head" id="head">
<div class="mx-auto flex min-h-16 max-w-7xl items-center gap-3 rounded-[2rem] py-2 bg-ma-surface-2/95 pl-5 pr-2 shadow-[0_15px_35px_-18px_rgb(0_0_0/0.7)] ring-1 ring-white/10">
<a href="#top" class="shrink-0 im-brand" aria-label="${name}: ${t(C.top)}">${mark("h-9")}</a>
<nav aria-label="${t(C.sections)}" class="ml-4 hidden items-center gap-5 text-sm lg:flex">${nav.map(([u, n]) => `<a href="${u}" class="text-ma-ink-2 transition-colors hover:text-ma-accent">${t(n)}</a>`).join("")}</nav>
<span class="ml-auto"></span>
${sign("ma-btn min-h-12 px-5 text-sm")}
</div>
</header>`;

  // Заголовок-формула макета («Химия + биология = медвуз»): два коротких курса клиента. Длинные названия: слоган.
  const [s1, s2] = services;
  const short = (s?: { name: string }) => Boolean(s && s.name.length <= 10 && !/\d/.test(s.name));
  const h1 = site.tagline
    ? esc(site.tagline)
    : short(s1) && short(s2)
      ? `${esc(s1.name)} <span class="text-[#e995be]">+</span> ${esc(s2.name)} <span class="text-ma-accent">=</span> <span class="text-ma-accent">${t(C.result)}</span>`
      : esc(t(C.h1));
  const stick = perks.filter((p) => p.length <= 24).slice(0, 2);

  const hero = `<section id="top" class="relative isolate -mt-[4.75rem] overflow-hidden pt-[4.75rem]">
<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10"><canvas class="h-full w-full opacity-70" id="mol"></canvas><div class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ma-bg to-transparent"></div></div>
<div class="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-12 lg:pb-24 lg:pt-20">
<div class="lg:col-span-7">
<p class="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-ma-ink-2 ring-1 ring-white/10">${icon("pin", "h-4 w-4 text-ma-accent")}${esc(site.city ? `${t(C.kind)} · ${site.city}` : t(C.kind))}</p>
<h1 class="ma-display mt-6 text-5xl sm:text-6xl lg:text-7xl im-h1">${h1}</h1>
<p class="mt-6 max-w-xl text-lg text-ma-ink-2">${esc(site.about ?? t(C.lead))}</p>
<div class="mt-8 flex flex-col gap-3 sm:flex-row">${sign("ma-btn min-h-14 px-7 text-lg", undefined, true)}${services.length ? `<a href="#courses" class="ma-btn ma-btn-ghost min-h-14 px-7 text-lg">${t(C.courses)}</a>` : ""}</div>
${
  services.length >= 3
    ? `<ul class="mt-12 grid grid-cols-3 gap-3 sm:max-w-lg">${services
        .slice(0, 3)
        .map(
          (s, i) => `<li data-in="drop" style="--i:${i}" class="ma-in"><div class="flex aspect-square flex-col justify-between rounded-2xl p-3 sm:p-4 ${TILE[i]} im-tile">
<span class="text-xs font-bold opacity-80">${t(C.course)}</span>
<span class="ma-display text-4xl normal-case sm:text-5xl">${esc(symbol(s.name))}</span>
<span class="text-xs font-bold leading-tight im-clip">${esc(s.name)}</span>
</div></li>`,
        )
        .join("")}</ul>`
    : ""
}
</div>
<div class="relative mx-auto w-full max-w-md lg:col-span-5">
<div class="ma-float relative rotate-[-3deg]" style="--r:-3deg">
<div class="relative aspect-[3/4] overflow-hidden rounded-[2rem] ring-8 ring-white"><img alt="" src="${esc(photo)}" referrerpolicy="no-referrer" fetchpriority="high" class="object-cover im-fill"></div>
${stick[0] ? `<span class="absolute -left-3 top-8 z-10 rotate-[-8deg] rounded-full bg-ma-accent px-4 py-2 text-sm font-bold text-ma-accent-ink shadow-lg">${esc(stick[0])}</span>` : ""}
${stick[1] ? `<span class="absolute -right-2 bottom-10 z-10 rotate-[6deg] rounded-full bg-[#e995be] px-4 py-2 text-sm font-bold text-[#191337] shadow-lg">${esc(stick[1])}</span>` : ""}
</div>
${own.length ? "" : `<p class="ma-muted mt-6 text-xs">${t(C.stock)}</p>`}
</div>
</div>
</section>`;

  const run = [...perks, ...services.map((s) => s.name)].slice(0, 10);
  const marquee =
    run.length >= 3
      ? `<div class="overflow-hidden bg-ma-accent py-4 text-ma-accent-ink motion-reduce:overflow-x-auto" aria-label="${t(C.about)}">
<ul class="ma-marquee flex w-max gap-8 whitespace-nowrap">${[false, true].map((hid) => run.map((x) => `<li aria-hidden="${hid}" class="ma-display flex items-center gap-8 text-xl">${esc(x)}${icon("mol", "h-6 w-6")}</li>`).join("")).join("")}</ul>
</div>`
      : "";

  // Курсы: вкладки и панель, как «Выбери формулу». Цифры макета (часы, лекции, файлы) не берём: карточки из контактов клиента.
  const tabs = services.slice(0, 6);
  const facts: [Pair | string, string][] = [
    ...(site.hours ? [[C.hoursShort, site.hours] as [Pair, string]] : []),
    ...(site.city ? [[C.where, site.city] as [Pair, string]] : []),
    ...(site.phone ? [[C.phone, site.phone] as [Pair, string]] : []),
    ...(tg ? [["Telegram", `@${tg}`] as [string, string]] : []),
  ].slice(0, 4);
  const panel = (s: (typeof tabs)[number], k: number) => `<div role="tabpanel" id="cp-${k}" aria-labelledby="ct-${k}" class="ma-pop mt-8 grid gap-4 lg:grid-cols-12"${k ? " hidden" : ""}>
<div class="rounded-[1.5rem] bg-[#191337] p-6 text-[#e5e4ee] sm:p-10 lg:col-span-7">
${icon("mol", "h-12 w-12 text-ma-accent")}
<h3 class="ma-display mt-6 text-4xl sm:text-5xl">${esc(s.name)}</h3>
${site.about ? `<p class="mt-4 max-w-xl text-[#cfcde0]">${esc(site.about)}</p>` : ""}
${perks.length ? `<ul class="mt-6 flex flex-wrap gap-2">${perks.map((p) => `<li class="rounded-full bg-white/10 px-3 py-1.5 text-sm">${esc(p)}</li>`).join("")}</ul>` : ""}
</div>
<div class="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-2">
${facts.map(([label, value], i) => `<div class="rounded-[1.5rem] p-5 ${CARD[i]}"><p class="text-sm font-bold opacity-80">${typeof label === "string" ? label : t(label)}</p><p class="ma-display mt-2 text-xl normal-case im-fact">${esc(value)}</p></div>`).join("")}
<div class="flex flex-col justify-between rounded-[1.5rem] bg-ma-accent p-5 text-ma-accent-ink sm:col-span-2">
<p class="text-sm font-bold">${t(C.price)}</p>
<p class="ma-display mt-2 ${s.price ? "text-4xl" : "text-2xl"} im-price">${esc(s.price ?? t(C.priceAsk))}</p>
${sign("mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#191337] px-6 font-bold text-white", t(C.helloCourse).replace("{c}", s.name))}
</div>
</div>
</div>`;
  const courses = tabs.length
    ? `<section id="courses" class="scroll-mt-24 bg-ma-deep text-ma-on-deep">
<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
<p class="ma-eyebrow text-[#5d2fcc]">${t(C.coursesKick)}</p>
<h2 class="ma-display mt-4 text-4xl sm:text-5xl">${t(C.coursesH)}</h2>
${
  tabs.length > 1
    ? `<div role="tablist" aria-label="${t(C.coursesKick)}" class="mt-8 inline-flex flex-wrap gap-1 rounded-[2rem] bg-[#191337] p-1" id="tabs">${tabs
        .map((s, k) => `<button type="button" role="tab" id="ct-${k}" aria-controls="cp-${k}" aria-selected="${k === 0}" class="min-h-12 rounded-full px-5 text-sm font-bold transition-colors ${k === 0 ? "bg-ma-accent text-ma-accent-ink" : "text-[#e5e4ee] hover:text-white"}">${esc(s.name)}</button>`)
        .join("")}</div>`
    : ""
}
${tabs.map(panel).join("\n")}
${
  services.length > tabs.length
    ? `<p class="mt-6 flex flex-wrap gap-2 text-sm">${services
        .slice(tabs.length)
        .map((s) => `<span class="inline-flex items-center gap-1.5 rounded-full bg-[#191337]/10 px-3 py-1.5">${icon("check", "h-4 w-4")}${esc(s.name)}${s.price ? `: ${esc(s.price)}` : ""}</span>`)
        .join("")}</p>`
    : ""
}
</div>
</section>`
    : "";

  // Преподаватели: карточка с оборотом. Фото и баллов у клиента нет: буква имени и его должность.
  const teachers = doctors.length
    ? `<section id="teachers" class="scroll-mt-24">
<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
<div data-in="slide" style="--i:0" class="ma-in"><p class="ma-eyebrow text-ma-accent">${t(C.teachersKick)}</p><h2 class="ma-display mt-4 max-w-4xl text-4xl sm:text-5xl">${t(C.teachersH)}</h2><p class="ma-muted mt-4">${t(C.teachersLead)}</p></div>
<ul class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 im-team">${doctors
        .map(
          (d, i) => `<li data-in="tilt" style="--i:${i % 4}" class="ma-in [perspective:1200px]">
<button type="button" aria-pressed="false" aria-label="${esc(d.name)}: ${t(C.flip)}" class="ma-flip relative block aspect-[3/4] w-full text-left" data-flipped="false">
<span class="absolute inset-0 overflow-hidden rounded-[1.5rem] bg-ma-surface-2">
<span class="ma-display absolute inset-0 flex items-center justify-center text-7xl text-ma-accent im-ava" aria-hidden="true">${esc(symbol(d.name))}</span>
<span class="absolute inset-x-3 bottom-3 rounded-2xl bg-[#191337]/90 p-4"><span class="block text-xs font-bold uppercase tracking-wider text-ma-accent">${esc(d.role ?? t(C.teacher))}</span><span class="mt-1 block text-lg font-bold text-white">${esc(d.name)}</span></span>
</span>
<span class="ma-back absolute inset-0 flex flex-col rounded-[1.5rem] ${BACK[i % 4]} p-6">
<span class="text-xs font-bold uppercase tracking-wider">${esc(d.role ?? t(C.teacher))}</span>
<span class="ma-display mt-2 text-2xl">${esc(d.name)}</span>
<span class="mt-auto space-y-1 text-sm"><span class="flex gap-2">${icon("check", "h-4 w-4 shrink-0")}${t(C.toTeacher)}</span></span>
</span>
</button></li>`,
        )
        .join("")}</ul>
</div>
</section>`
    : "";

  // Ловушки и то, что мы предлагаем: заявка в Telegram. Карточка макета (ma-card).
  const flow = `<section id="flow" class="scroll-mt-24">
<div class="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
<div data-in="slide" style="--i:0" class="ma-in"><p class="ma-eyebrow text-ma-accent">${t(C.flowKick)}</p><h2 class="ma-display mt-4 text-4xl sm:text-5xl">${t(C.flowH)}</h2><p class="ma-muted mt-4 max-w-xl">${t(C.flowLead)}</p></div>
<div data-in="rise" style="--i:1" class="ma-in ma-card p-6 sm:p-8">
<p class="flex items-center gap-2 text-sm font-bold">${icon("tg", "h-6 w-6 text-ma-accent")}${t(C.demoTitle)}<span class="ml-auto rounded-full bg-white/10 px-3 py-1.5 text-xs">${t(C.demo)}</span></p>
<p class="mt-4 text-lg text-ma-ink-2 im-demo">${t(C.demoCourse)}<br>${t(C.demoName)}: [[t:0]]<br>${t(C.demoNote)}</p>
</div>
</div>
</section>`;

  const map = site.address ? `https://yandex.uz/maps/?text=${encodeURIComponent(site.address)}` : null;
  const cell = (ic: string, label: string, body: string) =>
    `<div class="rounded-[1.5rem] bg-[#191337]/10 p-5">${icon(ic, "h-6 w-6")}<p class="mt-3 text-sm font-bold opacity-80">${label}</p><p class="mt-1 break-words font-bold">${body}</p></div>`;
  const link = (href: string, text: string, ext = true) => `<a href="${esc(href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""} class="underline-offset-4 hover:underline">${esc(text)}</a>`;
  const chat = signHref();
  const contacts = `<section id="contacts" class="scroll-mt-24 px-3 pb-3 sm:px-5 sm:pb-5">
<div class="mx-auto grid max-w-7xl gap-10 overflow-hidden rounded-[2rem] bg-ma-accent p-6 text-ma-accent-ink sm:p-10 lg:grid-cols-2 lg:p-14">
<div>
<p class="ma-eyebrow">${t(C.contactsKick)}</p>
<h2 class="ma-display mt-4 text-5xl sm:text-6xl">${t(C.contactsH)}</h2>
${chat ? `<a href="${esc(chat)}"${chat.startsWith("tel:") ? "" : ' target="_blank" rel="noopener noreferrer"'} class="mt-8 inline-flex min-h-14 items-center gap-2 rounded-full bg-[#191337] px-7 text-lg font-bold text-white transition-transform hover:-translate-y-0.5 motion-reduce:transform-none">${icon(chat.startsWith("tel:") ? "phone" : "tg", "h-6 w-6")}${tg ? `@${esc(tg)}` : wa ? "WhatsApp" : esc(site.phone ?? t(C.call))}</a>` : ""}
</div>
<div class="grid gap-3 sm:grid-cols-2">
${site.address && map ? cell("pin", t(C.addr), link(map, site.address)) : ""}
${tel ? cell("phone", t(C.phone), link(tel, site.phone ?? "", false)) : ""}
${site.hours ? cell("clock", t(C.hours), esc(site.hours)) : ""}
${ig ? cell("ig", "Instagram", link(`https://instagram.com/${ig}`, `@${ig}`)) : ""}
</div>
</div>
</section>`;

  const round = "flex h-11 w-11 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10";
  const footer = `<footer class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
${mark("h-11")}
<p class="ma-muted text-xs sm:mx-auto">${t(C.rights)} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener" class="underline underline-offset-4">${t(C.terms)}</a>. ${t(C.source)} ${esc(site.source)}</p>
<div class="flex gap-2">${tg ? `<a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener noreferrer" aria-label="Telegram" class="${round}">${icon("tg", "h-5 w-5")}</a>` : ""}${ig ? `<a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="${round}">${icon("ig", "h-5 w-5")}</a>` : ""}${tel ? `<a href="${esc(tel)}" aria-label="${t(C.call)}" class="${round}">${icon("phone", "h-5 w-5")}</a>` : ""}</div>
</footer>`;

  const tint = palette(site.color);
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.kind).toLowerCase()}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#191337">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Commissioner:wght@400;700&display=swap">
<style>${assets.css}
html{scroll-behavior:smooth;background:var(--ma-bg,#191337)}
body{margin:0;overflow-x:clip}
[data-ma="b"]{--font-ma-dela:"Dela Gothic One";--ma-body-font:"Commissioner",ui-sans-serif,system-ui,sans-serif;--ma-night:#191337;--ma-pop-deep:#5d2fcc${tint ? `;${tint}` : ""}}
.im-head{transition:transform .45s cubic-bezier(.22,1,.36,1),opacity .3s}
.im-head.is-away{transform:translate3d(0,-130%,0);opacity:0;pointer-events:none}
.im-brand{min-width:0;display:flex;align-items:center}
.im-name{display:block;max-width:46vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.im-mark{max-width:9rem;object-fit:contain}
.im-h1{overflow-wrap:anywhere}
.im-fill{position:absolute;inset:0;height:100%;width:100%}
.im-tile{min-width:0;overflow:hidden}
.im-clip{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.im-fact,.im-price{overflow-wrap:anywhere;text-transform:none}
.im-ava{opacity:.9}
@media (max-width:639px){.im-team{grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}.im-team .im-ava{font-size:3rem;padding-bottom:3rem}.im-team .text-lg{font-size:.9rem;line-height:1.25}.im-team .ma-back{padding:1rem}.im-team .ma-back .text-2xl{font-size:1.05rem}.im-team .p-4{padding:.6rem .7rem}.im-team .tracking-wider{letter-spacing:0;overflow-wrap:anywhere;font-size:.65rem}}
.im-demo{line-height:1.7}
.im-skip{position:absolute;left:-999px;top:0}
.im-skip:focus{left:12px;top:12px;z-index:90;background:var(--ma-accent);color:var(--ma-accent-ink);padding:10px 14px;border-radius:999px}
[hidden]{display:none!important}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.im-head{transition:none}}</style>
</head>
<body>
${dzIntroSolo(l)}
<a class="im-skip" href="#main">${t(C.skip)}</a>
<div data-ma="b" class="min-h-dvh">
${header}
<main id="main">
${hero}
${marquee}
${courses}
${teachers}
${flow}
${contacts}
</main>
${footer}
</div>
<script>
${assets.js}</script>
</body>
</html>`;
}
