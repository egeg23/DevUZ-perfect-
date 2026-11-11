/**
 * Шаблон «Учебный центр» — главная нашего макета Aipply Academy
 * (scripts/protos/aipply/gen.mjs), переодетая под клиента.
 *
 * Владелец, 11.11.2026: «Остальные категории тоже делаем по принципу как
 * сделали со стоматологией». Отсюда устройство: стили и скрипт Aipply — те
 * же файлы (content/proto-instant/aipply-assets.json, пишет
 * scripts/protos/instant/aipply-assets.mjs), разметка — те же блоки и
 * классы: первый экран с сеткой, полосами в цвет бренда и «жидким стеклом»
 * (параллакс по глубине), слова по одному и перебор направлений, бегущая
 * строка, «Чему научитесь» с орбитами, бенто преимуществ, запись на курс
 * со стеклянной карточкой, «Как добраться» со схемой, подвал и док.
 *
 * Что от Aipply не берётся, потому что это про них, а не дизайн: их знак и
 * влёт в него, фото преподавателя, ноутбук «Kompyuter noldan», тест
 * уровня, их цифры (выпускники, скидка 20%, коворкинг), метро, конструктор
 * цены. Нет данных клиента — блока нет; нет фото — нейтральные фото ниши
 * (public/protos/_niche/uchebnyy-centr). Числа — только клиента.
 */
import assets from "@/content/proto-instant/aipply-assets.json" with { type: "json" };
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
  lead: P("Курсы и занятия:", "Kurslar va darslar:"),
  leadPlain: P("Курсы в группах и индивидуально. Оставьте заявку: подберём группу и время.", "Guruhda va yakka tartibda kurslar. Ariza qoldiring: guruh va vaqtni tanlaymiz."),
  sign: P("Записаться на курс", "Kursga yozilish"),
  courses: P("Курсы и цены", "Kurslar va narxlar"),
  call: P("Позвонить", "Qo‘ng‘iroq qilish"),
  learnKick: P("Направления", "Yo‘nalishlar"),
  learnH: P("Чему научитесь", "Nimani o‘rganasiz"),
  learnLead: P("Направления с вашего сайта, в том же порядке.", "Saytingizdagi yo‘nalishlar, o‘sha tartibda."),
  plusKick: P("Преимущества", "Afzalliklar"),
  plusH: P("Почему выбирают нас", "Nega bizni tanlashadi"),
  plusLead: P("Вашими словами, как на сайте.", "Saytdagidek, o‘z so‘zlaringiz bilan."),
  odKick: P("Первый шаг", "Birinchi qadam"),
  odH: P("Запишитесь на курс", "Kursga yoziling"),
  odLead: P("Напишите, какое направление интересно. Администратор подберёт группу и время и ответит в Telegram.", "Qaysi yo‘nalish qiziqligini yozing. Administrator guruh va vaqtni tanlab, Telegramda javob beradi."),
  priceAsk: P("Цену уточняйте", "Narxini aniqlang"),
  whereKick: P("Как добраться", "Joylashuv"),
  whereH: P("Ждём на занятиях", "Darslarda kutamiz"),
  whereLead: P("Это схема, а не карта: точный путь откройте на карте.", "Bu sxema, xarita emas: aniq yo‘lni xaritada oching."),
  scheme: P("Схема", "Sxema"),
  addr: P("Адрес", "Manzil"),
  hours: P("Часы", "Ish vaqti"),
  phone: P("Телефон", "Telefon"),
  openMap: P("Открыть на карте", "Xaritada ochish"),
  flowKick: P("Предложение DevUz Studio", "DevUz Studio taklifi"),
  flowH: P("Так заявка придёт вам в Telegram", "Ariza sizga Telegramda shunday keladi"),
  demo: P("пример", "namuna"),
  demoTitle: P("Заявка на курс с сайта", "Saytdan kursga ariza"),
  demoCourse: P("Курс: вечерняя группа", "Kurs: kechki guruh"),
  demoName: P("Имя", "Ism"),
  demoNote: P("Вопрос: можно ли заниматься рядом с «[[t:1]]»?", "Savol: «[[t:1]]» yonida o‘qisa bo‘ladimi?"),
  sections: P("Разделы", "Bo‘limlar"),
  contacts: P("На связи", "Aloqa"),
  rights: P("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz qabul qilasiz:"),
  terms: P("условия макета", "maket shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  stock: P("Фото для примера: учебный центр поставит свои.", "Rasmlar namuna uchun: o‘quv markazi o‘zinikini qo‘yadi."),
  skip: P("К содержанию", "Mazmunga o‘tish"),
  desc: P("Курсы, цены и запись на занятия.", "Kurslar, narxlar va darslarga yozilish."),
  hello: P("Здравствуйте! Хочу записаться на курс.", "Assalomu alaykum! Kursga yozilmoqchiman."),
  sent: P("Текст скопирован. Открываем чат: вставьте его и отправьте.", "Matn nusxalandi. Chat ochilmoqda: uni qo‘yib yuboring."),
} as const;

const I = (dd: string, w = 1.8) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${dd}</svg>`;
/** Значки — те же, что у Aipply. */
const ICON = {
  tg: I('<path d="M21 4 3 11l6 2.5M21 4l-3.5 16-8.5-6.5M21 4 9 13.5V19l3-3.5"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>', 2),
  check: I('<path d="m5 12 5 5 9-10"/>', 2),
  map: I('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  doc: I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
  ai: I('<path d="M12 3c.5 3.8 2.2 5.5 6 6-3.8.5-5.5 2.2-6 6-.5-3.8-2.2-5.5-6-6 3.8-.5 5.5-2.2 6-6z"/>'),
  globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  users: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5.5 5.5 0 0 1 3.5 6"/>'),
  cert: I('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 8h10M7 11h6"/><circle cx="16.5" cy="17" r="2.5"/><path d="m15 19-1 3 2.5-1.2L19 22l-1-3"/>'),
  translate: I('<path d="M4 5h9M8.5 3v2c0 4-2 7-5 8.5M6 9c1 2.5 3 4.2 6 5"/><path d="m13 21 4-9 4 9M14.5 18h5"/>'),
  chart: I('<path d="M3 20h18"/><path d="M6 16v-4M11 16V8M16 16v-6M21 16V5"/>'),
  star: I('<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>'),
  pc: I('<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2 19h20l-1.5-4h-17z"/>'),
  ig: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>'),
};
const ORBIT = ["doc", "ai", "globe", "cert", "translate", "chart", "pc", "star"] as const;

/** Синие Aipply — в цвет бренда клиента: три тона одного оттенка. Солнечный жёлтый кнопок остаётся. */
function palette(color: string | null): string {
  const hex = brandColor(color);
  const [h, s0] = hex ? hexToHsl(hex) : [230, 100];
  const s = Math.min(Math.max(s0, 55), 100);
  return [`--royal:hsl(${h} ${s}% 34%)`, `--royal2:hsl(${h} ${s}% 46%)`, `--azure:hsl(${(h + 12) % 360} ${s}% 41%)`, `--sky:hsl(${(h + 22) % 360} ${s}% 47%)`].join(";");
}

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/build, normalizeSite). */
export function eduHtml(site: InstantSite): string {
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
  const pic = (k: number) => (own.length ? own[k % own.length] : EDU_PHOTOS[k % EDU_PHOTOS.length]);
  const hello = t(C.hello);

  /** Кнопка записи: Aipply копирует текст и открывает чат (client.js, data-tg). Чата нет — звонок. */
  const signBtn = (cls: string, label: string, text = hello) =>
    chat ? `<a class="btn ${cls}" href="${esc(chat)}" data-tg="${esc(text)}">${ICON.tg}${label}</a>` : tel ? `<a class="btn ${cls}" href="${esc(tel)}">${ICON.phone}${label}</a>` : "";
  const head = (kicker: string, h: string, lead: string, anim = "rise") =>
    `<div class="sec-head rv a-${anim}"><div><span class="kicker"><i></i>${kicker}</span><h2 style="margin-top:12px">${h}</h2>${lead ? `<p class="sub">${lead}</p>` : ""}</div></div>`;

  const nav: [string, Pair][] = [
    ...(services.length ? [["#dastur", C.learnKick] as [string, Pair]] : []),
    ["#ochiq", C.odKick],
    ["#joy", C.whereKick],
  ];
  const mark = logo ? `<img src="${esc(logo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()" class="im-mark">` : "";

  const header = `<header class="top"><div class="wrap">
<a class="logo im-logo" href="#hero" aria-label="${name}">${mark}<span>${name}</span></a>
<nav class="nav" aria-label="${t(C.sections)}">${nav.map(([u, n]) => `<a href="${u}">${t(n)}</a>`).join("")}</nav>
<div class="top-r">${tel ? `<a class="top-tel" href="${esc(tel)}">${esc(site.phone ?? "")}</a>` : ""}<a class="btn btn-sun btn-sm top-cta" href="#ochiq">${t(C.sign)}</a></div>
</div></header>`;

  // Первый экран: сетка с загорающимися клетками, полосы, слова по одному.
  const CELLS = [[3, 2, 0], [7, 1, 1.4], [10, 4, 2.6], [5, 6, 3.8], [12, 2, 4.4], [14, 6, 0.8], [9, 8, 2], [16, 3, 3.2], [2, 9, 5], [18, 7, 1.1], [11, 10, 4], [20, 2, 2.4]];
  const grid = `<div class="grid-bg" aria-hidden="true"><svg><defs><pattern id="gp" width="56" height="56" patternUnits="userSpaceOnUse"><path class="gl" d="M56 0H0V56"/></pattern></defs><rect width="100%" height="100%" fill="url(#gp)" style="animation:none;opacity:1"/>${CELLS.map(([x, y, dl]) => `<rect x="${x * 56 + 1}" y="${y * 56 + 1}" width="55" height="55" style="--dl:${dl}s"/>`).join("")}</svg></div>`;
  const STR: [string, string, string, string, string, number, number][] = [
    ["62%", "8%", "46vw", "56px", "var(--royal)", 0.55, 1.6],
    ["70%", "22%", "40vw", "56px", "var(--azure)", 0.5, 1.1],
    ["66%", "36%", "44vw", "56px", "var(--sky)", 0.45, 0.6],
    ["-12%", "70%", "30vw", "28px", "var(--azure)", 0.25, 2.2],
    ["-8%", "80%", "26vw", "28px", "var(--sky)", 0.2, 1.4],
  ];
  const h1 = site.tagline ?? t(C.h1);
  const words = h1.split(/\s+/).filter(Boolean);
  const rot = services.slice(0, 5).map((s) => s.name);
  const fl = (cls: string, ic: keyof typeof ICON, b: string, dep: number) =>
    `<div class="fl glass lq ${cls}" data-depth="${dep}"><span class="ic">${ICON[ic]}</span><div><b>${esc(b)}</b></div></div>`;
  const hero = `<section class="hero" id="hero" aria-label="${name}">
${grid}
<div class="stripes" aria-hidden="true">${STR.map(([x, y, w, h, c, o, dep]) => `<i data-depth="${dep}" data-base="skewX(-34deg) rotate(9deg)" style="--x:${x};--y:${y};--w:${w};--h:${h};--c:${c};--o:${o}"></i>`).join("")}</div>
<div class="hero-in"><div class="wrap"><div class="hero-grid">
<div>
<span class="kicker hi" style="color:var(--on2)"><i></i>${name}${site.city ? ` · ${esc(site.city)}` : ""}</span>
<h1 style="margin-top:16px">${words.map((w, i) => `<span class="tw${i === 0 ? " em" : ""}" style="--i:${i}">${esc(w)}</span>`).join(" ")}</h1>
<p class="lead hi" style="--d:200ms">${
    rot.length >= 2
      ? `${t(C.lead)} <span class="rot" aria-hidden="true">${rot.map((w, k) => `<span${k === 0 ? ' class="on"' : ""}>${esc(w)}</span>`).join("")}</span><span class="vh">${esc(rot.join(", "))}</span>`
      : site.about
        ? esc(site.about)
        : t(C.leadPlain)
  }</p>
<div class="cta hero-go hi" style="--d:280ms">${signBtn("btn-sun shim", t(C.sign))}${services.length ? `<a class="btn btn-ghost" href="#dastur">${t(C.courses)}${ICON.arrow}</a>` : ""}</div>
${perks.length ? `<div class="trust hi" style="--d:360ms">${perks.slice(0, 3).map((p) => `<span class="glass">${ICON.check}${esc(p)}</span>`).join("")}</div>` : ""}
</div>
<div class="hero-art hi" style="--d:160ms">
<div class="hero-ring" aria-hidden="true"></div>
<div class="hero-ph" data-depth="0.5" data-base="translateX(-50%)"><img src="${esc(pic(0))}" alt="" width="896" height="1120" fetchpriority="high" referrerpolicy="no-referrer"></div>
${perks[3] ? fl("a", "users", perks[3], 2.2) : ""}${perks[4] ? fl("b", "star", perks[4], 1.6) : ""}${perks[5] ? fl("c", "cert", perks[5], 2.8) : ""}
</div>
</div></div></div>
</section>
${services.length >= 3 ? `<div class="mq" aria-hidden="true"><div class="mq-row">${[0, 1].map(() => services.map((s, i) => `<span>${ICON[ORBIT[i % ORBIT.length]]}${esc(s.name)}</span>`).join("")).join("")}</div></div>` : ""}`;

  // Чему научитесь: орбиты значков и список направлений клиента.
  const ring = (k: number) => services.filter((_, i) => i % 2 === k);
  const orb = (items: typeof services, rad: number, tm: number, rev: boolean, off: number) =>
    items.map((x, i) => `<span class="orb-i${rev ? " rev" : ""}" style="--rad:${rad}px;--t:${tm}s;--dl:${((-tm * i) / items.length).toFixed(2)}s"><span title="${esc(x.name)}">${ICON[ORBIT[(i * 2 + off) % ORBIT.length]]}</span></span>`).join("");
  const learn = services.length
    ? `<section id="dastur"><div class="wrap">
${head(t(C.learnKick), t(C.learnH), t(C.learnLead))}
<div class="learn">
<div class="orb rv a-pop" aria-hidden="true"><span class="orb-r" style="--in:22%"></span><span class="orb-r" style="--in:4%"></span><span class="orb-c im-orb">${mark || `<b>${esc(site.name.slice(0, 1))}</b>`}</span>${orb(ring(0), 128, 26, false, 0)}${orb(ring(1), 206, 40, true, 1)}</div>
<ol class="learn-list">${services.map((s, k) => `<li class="rv a-type" style="--d:${k * 60}ms">${esc(s.name)}${s.price ? ` <span class="im-pr">${esc(s.price)}</span>` : ""}</li>`).join("")}</ol>
</div>
</div></section>`
    : "";

  // Преимущества бенто: только слова клиента.
  const size = ["w2", "", "", "h2", "", ""];
  const tone = ["blue", "", "", "sun", "", ""];
  const motion = ["win", "key", "slide", "pop", "rise", "key"];
  const plus = perks.length >= 2
    ? `<section class="dark"><div class="wrap">
${head(t(C.plusKick), t(C.plusH), t(C.plusLead))}
<div class="bento">${perks.map((p, k) => `<div class="bn ${size[k]} ${tone[k]} rv a-${motion[k]}" style="--d:${(k % 4) * 70}ms"><span class="spot" aria-hidden="true"></span><span class="ic">${ICON[ORBIT[k % ORBIT.length]]}</span><h3>${esc(p)}</h3></div>`).join("")}</div>
</div></section>`
    : "";

  // Запись: стеклянная карточка с курсами и ценами клиента.
  const bars: [string, string, string, number, number][] = [["-6%", "12%", "50%", 0.1, 1.4], ["40%", "30%", "64%", 0.14, 0.8], ["-10%", "62%", "44%", 0.08, 1.8], ["52%", "78%", "56%", 0.12, 1.1]];
  const od = `<section class="od" id="ochiq"><div class="od-bg" aria-hidden="true">${bars.map(([x, y, w, o, k]) => `<i data-k="${k}" style="--x:${x};--y:${y};--w:${w};--o:${o}"></i>`).join("")}</div>
<div class="wrap"><div class="od-in">
<div class="rv a-left"><span class="kicker"><i></i>${t(C.odKick)}</span><h2 style="margin-top:12px">${t(C.odH)}</h2><p class="lead" style="color:hsl(200 100% 92%)">${t(C.odLead)}</p>
<div class="im-tg"><div class="im-tg-h">${ICON.tg}<b>${t(C.demoTitle)}</b><small>${t(C.demo)}</small></div><p>${t(C.demoCourse)}<br>${t(C.demoName)}: [[t:0]]<br>${t(C.demoNote)}</p></div></div>
<div class="od-card glass lq rv a-win"><span class="beam" aria-hidden="true"></span><h3>${t(services.length ? C.courses : C.odH)}</h3>${services.length ? `<ul class="od-gain">${services.slice(0, 6).map((s) => `<li><b class="num im-pp">${s.price ? esc(s.price) : "·"}</b><span>${esc(s.name)}</span></li>`).join("")}</ul>` : ""}${signBtn("btn-sun shim", t(C.sign))}</div>
</div></div></section>`;

  // Как добраться: схема и карточка с контактами.
  const map = site.address ? `https://yandex.uz/maps/?text=${encodeURIComponent(site.address)}` : null;
  const where =
    site.address || tel || chat
      ? `<section id="joy"><div class="wrap">
${head(t(C.whereKick), t(C.whereH), site.address ? t(C.whereLead) : "")}
<div class="where">
<div class="map rv a-pop" aria-hidden="true"><span class="road" style="left:-5%;top:60%;width:110%;transform:rotate(-4deg)"></span><span class="road" style="left:52%;top:-5%;width:14px;height:110%"></span><span class="here"><span class="pin"><i></i><i></i></span><span>${name}</span></span><em>${t(C.scheme)}</em></div>
<div class="panel rv a-slide"><h3>${name}</h3><dl>${site.address ? `<dt>${t(C.addr)}</dt><dd>${esc(site.address)}</dd>` : ""}${site.hours ? `<dt>${t(C.hours)}</dt><dd>${esc(site.hours)}</dd>` : ""}${tel ? `<dt>${t(C.phone)}</dt><dd><a href="${esc(tel)}">${esc(site.phone ?? "")}</a></dd>` : ""}${tg ? `<dt>Telegram</dt><dd><a href="https://t.me/${esc(tg)}">@${esc(tg)}</a></dd>` : wa ? `<dt>WhatsApp</dt><dd><a href="${esc(wa)}">WhatsApp</a></dd>` : ""}${ig ? `<dt>Instagram</dt><dd><a href="https://instagram.com/${esc(ig)}">@${esc(ig)}</a></dd>` : ""}</dl>
<div class="cta">${map ? `<a class="btn btn-main" href="${esc(map)}" target="_blank" rel="noopener">${ICON.map}${t(C.openMap)}</a>` : ""}${tel ? `<a class="btn btn-ghost" href="${esc(tel)}">${ICON.phone}${t(C.call)}</a>` : ""}</div></div>
</div>
${own.length ? "" : `<p class="im-stock">${t(C.stock)}</p>`}
</div></section>`
      : "";

  const footer = `<footer><div class="wrap">
<div class="cols">
<div><b>${name}</b><ul>${site.about ? `<li>${esc(site.about)}</li>` : ""}${site.address ? `<li>${esc(site.address)}</li>` : ""}</ul></div>
<div><b>${t(C.contacts)}</b><ul>${tel ? `<li><a href="${esc(tel)}">${esc(site.phone ?? "")}</a></li>` : ""}${chat ? `<li><a href="${esc(chat)}">${tg ? "Telegram" : "WhatsApp"}</a></li>` : ""}${ig ? `<li><a href="https://instagram.com/${esc(ig)}">Instagram</a></li>` : ""}</ul></div>
<div><b>${t(C.sections)}</b><ul>${nav.map(([u, n]) => `<li><a href="${u}">${t(n)}</a></li>`).join("")}</ul></div>
</div>
<div class="rights"><span>${t(C.rights)} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${t(C.terms)}</a>. ${t(C.source)} ${esc(site.source)}</span></div>
</div></footer>`;

  const dock = signBtn("btn-sun shim", t(C.sign)) ? `<div class="dock" id="dock">${signBtn("btn-sun shim", t(C.sign))}</div>` : "";
  const L = { tg: chat ?? tel ?? "", sent: t(C.sent), copied: "", kitBase: 0, kitN: "", empty: "" };
  const LQ = `<svg class="lq-defs" aria-hidden="true" focusable="false"><filter id="lq" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.019" numOctaves="2" result="n"/><feGaussianBlur in="n" stdDeviation="2.5" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="22" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.kind).toLowerCase()}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#060a2e">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700&family=Onest:wght@400;700&display=swap">
<script>(function(){var r=document.documentElement;r.classList.add('js');r.classList.add('intro-off')})()</script>
<style>${assets.css}
:root{${palette(site.color)}}
.im-logo{display:flex;align-items:center;gap:10px;min-width:0}
.im-logo span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:46vw}
.im-mark{height:32px;width:auto;max-width:96px;object-fit:contain}
.hero h1{overflow-wrap:anywhere}
.im-orb b{font:700 40px/1 var(--head);color:#fff}
.im-orb img{max-width:70%;max-height:70%;object-fit:contain}
.learn-list li{flex-wrap:wrap;min-width:0}
.im-pr{color:var(--mut);font-size:14px}
.od-gain li{min-width:0}
.od-gain span{min-width:0;overflow-wrap:anywhere}
.map .here span{max-width:40vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.od-gain b.im-pp{font-size:18px;line-height:1.25;min-width:0;max-width:52%;overflow-wrap:anywhere}
.hero-ph img{border-radius:28px;object-fit:cover;aspect-ratio:4/5}
.im-stock{margin:24px 0 0;color:var(--mut);font-size:14px}
.im-tg{margin-top:24px;max-width:420px;padding:16px;border-radius:16px;background:hsl(0 0% 100% / .1);border:1px solid hsl(0 0% 100% / .2);color:hsl(200 100% 94%)}
.im-tg-h{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.im-tg-h svg{width:20px;height:20px}
.im-tg-h small{margin-left:auto;opacity:.7;font-size:12px}
.im-tg p{margin:0;line-height:1.7}</style>
</head>
<body class="home" data-page="">
${LQ}
${dzIntroSolo(l)}
<a class="skip" href="#main">${t(C.skip)}</a>
${header}
<main id="main">
${hero}
${learn}
${plus}
${od}
${where}
</main>
${footer}
${dock}
<script type="application/json" id="i18n">${JSON.stringify(L).replace(/</g, "\\u003c")}</script>
<script>
${assets.js}</script>
</body>
</html>`;
}
