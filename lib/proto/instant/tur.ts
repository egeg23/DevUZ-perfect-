/**
 * Шаблон «Турагентство» — страница нашего макета SEM Travel
 * (scripts/protos/semtravel/gen.mjs), переодетая под клиента.
 *
 * Владелец, 11.11.2026: «Остальные категории тоже делаем по принципу как
 * сделали со стоматологией». Отсюда устройство: стили, скрипт и значки SEM
 * Travel — те же файлы (content/proto-instant/semtravel-assets.json, пишет
 * scripts/protos/instant/semtravel-assets.mjs), разметка — те же блоки и
 * классы: первый экран с морем и маршрутом из Ташкента (самолёт по дуге,
 * цена «от» катится), поиск тура (куда, когда, кто), карта перелётов из
 * Ташкента с карточкой страны и рейтингом цен, услуги, контакты, заявка в
 * Telegram со статусом, «Моя заявка», шапка по правилу трёх секунд и док.
 *
 * Что от SEM Travel не берётся, потому что это про них, а не дизайн: их
 * знак, цены и даты вылетов, наценки «примера расчёта», календарь цен по
 * дням, гарантии и шкала отмены, аванс, SEM Club, отзывы, офисы,
 * спецпредложение, блок цены сайта. Направление на карте — только то, что
 * клиент назвал у себя с ценой в долларах; страна узнаётся по словам из
 * DESTS, расстояние от Ташкента — география. Нет данных — блока нет.
 *
 * Фото направлений — свободные снимки Unsplash из макета SEM Travel (их
 * собственных там нет, см. scripts/protos/semtravel/SOURCES.md), лежат как
 * фото ниши в public/protos/_niche/turagentstvo.
 */
import assets from "@/content/proto-instant/semtravel-assets.json" with { type: "json" };
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { LIMITS, type InstantLocale, type InstantService, type InstantSite, type BaseSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";
import { rgbOf } from "@/lib/proto/instant/dental";
import turagentstvoMedia from "@/content/proto-instant/turagentstvo-media.json" with { type: "json" };
import { flyParts } from "@/lib/proto/instant/fly";

import { tourCard, turSearch } from "@/lib/proto/instant/tur-search";
const IMG = "/protos/_niche/turagentstvo";
export const TUR_PHOTOS = ["hero.webp", "hero-s.webp", "hero-9.webp"].map((f) => `${IMG}/${f}`);

type Pair = { ru: string; uz: string };
const P = (ru: string, uz: string): Pair => ({ ru, uz });

/** Страна, куда летят из Ташкента: слова, по которым её узнаём, код аэропорта, точка на карте. */
type Dest = { id: string; code: string; geo: [number, number]; img: string; ru: string; uz: string; words: RegExp };
export const DESTS: Dest[] = [
  { id: "dubai", code: "DXB", geo: [25.2, 55.27], img: "d-dubai", ru: "Дубай", uz: "Dubai", words: /дуба|dubai|dubay|оаэ|эмират|amirlik/i },
  { id: "turkey", code: "AYT", geo: [36.9, 30.7], img: "d-turkey", ru: "Турция", uz: "Turkiya", words: /турц|turk|анталь|antal|стамбул|istanbul/i },
  { id: "egypt", code: "HRG", geo: [27.26, 33.81], img: "d-egypt", ru: "Египет", uz: "Misr", words: /египет|егип|misr|egypt|шарм|хургад/i },
  { id: "georgia", code: "TBS", geo: [41.72, 44.79], img: "d-georgia", ru: "Грузия", uz: "Gruziya", words: /грузи|gruziya|georgia|тбилис|tbilis|батуми|batumi/i },
  { id: "azer", code: "GYD", geo: [40.41, 49.87], img: "d-azer", ru: "Азербайджан", uz: "Ozarbayjon", words: /азербайдж|ozarbayjon|azerbaij|баку|baku|boku/i },
  { id: "qatar", code: "DOH", geo: [25.29, 51.53], img: "d-qatar", ru: "Катар", uz: "Qatar", words: /катар|qatar|доха|doha/i },
  { id: "thai", code: "HKT", geo: [7.88, 98.39], img: "d-thai", ru: "Таиланд", uz: "Tailand", words: /таил|tailand|thai|пхукет|phuket/i },
  { id: "vietnam", code: "PQC", geo: [10.23, 103.96], img: "d-vietnam", ru: "Вьетнам", uz: "Vyetnam", words: /вьетнам|vyetnam|vietnam|фукуок|нячанг/i },
  { id: "china", code: "PVG", geo: [31.23, 121.47], img: "d-china", ru: "Китай", uz: "Xitoy", words: /кита[йя]|xitoy|china|шанха|пекин/i },
  { id: "lanka", code: "CMB", geo: [6.93, 79.85], img: "d-lanka", ru: "Шри-Ланка", uz: "Shri-Lanka", words: /шри.?ланк|shri.?lank|sri.?lank/i },
  { id: "maldives", code: "MLE", geo: [4.18, 73.51], img: "hero", ru: "Мальдивы", uz: "Maldiv", words: /мальдив|maldiv/i },
  { id: "malaysia", code: "KUL", geo: [3.14, 101.69], img: "hero", ru: "Малайзия", uz: "Malayziya", words: /малайз|malayz|malays/i },
  { id: "saudi", code: "JED", geo: [21.49, 39.19], img: "hero", ru: "Саудовская Аравия", uz: "Saudiya Arabistoni", words: /умр|umra|хадж|haj|сауд|saud|мекк|makka|медин|madina/i },
];

/** Цена в долларах словами клиента: «от $500», «500 $», «от 500 USD». Иначе на карту не идёт. */
export function usdPrice(price: string | null): number {
  if (!price) return 0;
  const m = /\$\s?(\d[\d\s ]*\d|\d)|(\d[\d\s ]*\d|\d)\s?(?:\$|usd|у\.?\s?е)/i.exec(price);
  const n = m ? Number((m[1] ?? m[2]).replace(/\D/g, "")) : 0;
  return n >= 50 && n < 100_000 ? n : 0;
}

const rad = (x: number) => (x * Math.PI) / 180;
const TAS: [number, number] = [41.31, 69.24];
/** Азимутальная проекция с центром в Ташкенте, как у SEM Travel: угол — направление, радиус — корень расстояния. */
function polar([la, lo]: [number, number]) {
  const [a, b] = [rad(TAS[0]), rad(TAS[1])];
  const [c, e] = [rad(la), rad(lo)];
  const dist = 6371 * Math.acos(Math.sin(a) * Math.sin(c) + Math.cos(a) * Math.cos(c) * Math.cos(e - b));
  const brg = Math.atan2(Math.sin(e - b) * Math.cos(c), Math.cos(a) * Math.sin(c) - Math.sin(a) * Math.cos(c) * Math.cos(e - b));
  return { dist, brg };
}
/** Куда подписать точку на карте — разложено руками, как у SEM Travel: соседи не слипаются. */
const LAB: Record<string, keyof typeof LABEL> = { georgia: "t", azer: "bl", turkey: "l", egypt: "l", qatar: "l", dubai: "b", thai: "r", vietnam: "t", china: "t", lanka: "b", maldives: "b", malaysia: "r", saudi: "l" };
const LABEL = { t: [0, -16, "middle"], b: [0, 28, "middle"], bl: [10, 28, "end"], l: [-14, 6, "end"], r: [14, 6, "start"] } as const;
const MAXKM = 6000;
const R = 230;
const rOf = (km: number) => R * Math.sqrt(Math.min(km, 7000) / MAXKM);

/** Направления клиента: страна узнана и у неё есть цена в долларах. По одной на страну, дешёвая первой. */
export function destsOf(services: InstantService[]) {
  const out: (Dest & { price: number; km: number; x: number; y: number; title: string })[] = [];
  for (const s of services) {
    const price = usdPrice(s.price);
    const d = DESTS.find((x) => x.words.test(s.name));
    if (!d || !price || out.some((o) => o.id === d.id)) continue;
    const p = polar(d.geo);
    const r = rOf(p.dist);
    out.push({ ...d, price, km: Math.round(p.dist / 10) * 10, x: Math.round(Math.sin(p.brg) * r), y: Math.round(-Math.cos(p.brg) * r), title: s.name });
  }
  return out.sort((a, b) => a.price - b.price).slice(0, 10);
}

const C = {
  kind: P("Турагентство", "Turagentlik"),
  h1em: P("туры и путешествия", "turlar va sayohatlar"),
  lead: P("Подберём тур под ваш бюджет и даты: перелёт, отель, трансфер. Напишите, куда хотите, остальное возьмём на себя.", "Byudjetingiz va sanalaringizga mos tur tanlaymiz: parvoz, mehmonxona, transfer. Qayerga borishni yozing, qolganini o‘zimiz hal qilamiz."),
  route: P("Ташкент", "Toshkent"),
  from: P("от", "dan"),
  perOne: P("на одного", "bir kishiga"),
  forTwo: P("на двоих", "ikki kishiga"),
  where: P("Куда", "Qayerga"),
  when: P("Когда", "Qachon"),
  who: P("Кто едет", "Kim boradi"),
  adults: P("Взрослые", "Kattalar"),
  kids: P("Дети", "Bolalar"),
  less: P("меньше", "kamroq"),
  more: P("больше", "ko‘proq"),
  flex: P("Даты плюс-минус несколько дней", "Sanalar bir necha kun oldin yoki keyin"),
  tabKnow: P("Подобрать тур", "Tur tanlash"),
  find: P("Подобрать тур", "Tur tanlash"),
  call: P("Позвонить", "Qo‘ng‘iroq qilish"),
  write: P("Написать", "Yozish"),
  kartaKick: P("Куда летим", "Qayerga uchamiz"),
  kartaH: P("Направления из Ташкента", "Toshkentdan yo‘nalishlar"),
  kartaP: P("Нажмите на страну: цена «от» и расстояние от Ташкента. Цены с вашего сайта.", "Davlatni bosing: «dan» narxi va Toshkentdan masofa. Narxlar saytingizdan."),
  seeTours: P("Подобрать тур сюда", "Shu yerga tur tanlash"),
  rank: P("Где сейчас дешевле", "Hozir qayerda arzonroq"),
  uslKick: P("Что делаем", "Nima qilamiz"),
  uslH: P("Туры и услуги", "Turlar va xizmatlar"),
  priceAsk: P("Цену назовём под ваши даты", "Narxini sanalaringizga qarab aytamiz"),
  ask: P("Узнать цену", "Narxni bilish"),
  ctKick: P("Контакты", "Aloqa"),
  ctH: P("Приходите или напишите", "Keling yoki yozing"),
  flowKick: P("Предложение DevUz Studio", "DevUz Studio taklifi"),
  flowH: P("Так заявка придёт вам в Telegram", "Ariza sizga Telegramda shunday keladi"),
  demo: P("пример", "namuna"),
  demoTitle: P("Заявка на тур с сайта", "Saytdan tur arizasi"),
  demoWhere: P("Куда: на море, тёплая страна", "Qayerga: dengizga, issiq davlatga"),
  demoWho: P("Кто: двое взрослых и ребёнок", "Kim: ikki katta va bola"),
  demoName: P("Имя", "Ism"),
  demoNote: P("Пожелание: отель рядом с пляжем «[[t:1]]»", "Istak: «[[t:1]]» plyaji yonida mehmonxona"),
  bronH: P("Заявка на тур", "Tur arizasi"),
  name: P("Имя", "Ism"),
  phone: P("Телефон", "Telefon"),
  note: P("Пожелание", "Istak"),
  needName: P("Напишите имя и телефон", "Ism va telefonni yozing"),
  send: P("Отправить заявку", "Arizani yuborish"),
  sms: P("SMS", "SMS"),
  close: P("Закрыть", "Yopish"),
  stH: P("Заявка у менеджера", "Ariza menejerda"),
  st: [P("Заявка отправлена", "Ariza yuborildi"), P("Менеджер подбирает варианты", "Menejer variantlarni tanlayapti"), P("Пришлём туры с ценами", "Narxlari bilan turlarni yuboramiz")],
  mine: P("Моя заявка", "Mening arizam"),
  skip: P("К содержанию", "Mazmunga o‘tish"),
  navL: P("Разделы", "Bo‘limlar"),
  rights: P("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz qabul qilasiz:"),
  terms: P("условия макета", "maket shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  photos: P("Фото направлений: Unsplash, для примера.", "Yo‘nalishlar suratlari: Unsplash, namuna uchun."),
  desc: P("Туры из Ташкента: подбор, перелёт, отель, заявка в Telegram.", "Toshkentdan turlar: tanlash, parvoz, mehmonxona, Telegramda ariza."),
  sendNote: P("Это макет: заявка никуда не уходит. На рабочем сайте она сразу придёт менеджеру в Telegram.", "Bu maket: ariza hech qayerga ketmaydi. Ishchi saytda u darhol menejerga Telegramda keladi."),
  km: P("км", "km"),
  flight: P("От Ташкента", "Toshkentdan"),
} as const;

const MONTHS = {
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  uz: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"],
};
const MON = {
  ru: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  uz: ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"],
};

const icons = assets.icons as Record<string, string>;
const sprite = () =>
  `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(icons)
    .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
    .join("")}</defs></svg>`;
const ic = (k: string, c = "") => `<svg class="ic${c ? ` ${c}` : ""}" aria-hidden="true"><use href="#i-${k}"/></svg>`;
const head = (kick: string, h: string, p = "") => `<div class="sh"><span class="kick">${kick}</span><h2>${h}</h2>${p ? `<p>${p}</p>` : ""}</div>`;
const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
const usd = (n: number) => `$${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;

/** Оранжевый SEM Travel — в цвет бренда клиента. Море и песок остаются: это ниша, а не бренд. */
function palette(color: string | null): string {
  const hex = brandColor(color);
  const [h, s0, l0] = hex ? hexToHsl(hex) : [28, 87, 56];
  const s = Math.min(Math.max(s0, 45), 90);
  const l = Math.min(Math.max(l0, 45), 60);
  return [`--sun:hsl(${h} ${s}% ${l}%)`, `--sun2:hsl(${h} ${s}% ${Math.min(l + 10, 72)}%)`, `--sun-rgb:${rgbOf(h, s, l)}`].join(";");
}

function serviceIcon(name: string): string {
  if (/виз|viza|visa|паспорт/i.test(name)) return "passport";
  if (/отел|mehmonxona|hotel|гостиниц/i.test(name)) return "hotel";
  if (/трансфер|transfer|авто|машин/i.test(name)) return "car";
  return "plane";
}

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/build, normalizeSite). */
export function turHtml(site: BaseSite, now = new Date()): string {
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
  const dests = destsOf(services);
  const d0 = dests[0];
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u));
  const perks = site.perks.slice(0, 3);
  const m0 = now.getMonth();
  const months = [0, 1, 2, 3, 4, 5].map((i) => [((m0 + i) % 12) + 1, MONTHS[l][(m0 + i) % 12]] as [number, string]);

  const mark = logo ? `<img src="${esc(logo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : "";
  const logoA = `<a class="logo" href="#hero" aria-label="${name}"><span class="logo-m im-logo">${mark}<span class="logo-w"><b>${name}</b></span></span></a>`;
  const nav: [string, Pair][] = [
    ...(d0 ? [["#karta", C.kartaKick] as [string, Pair]] : []),
    ...(services.length ? [["#uslugi", C.uslKick] as [string, Pair]] : []),
    ["#kontakty", C.ctKick],
  ];

  const step = (id: string, label: string, minV: number, maxV: number) =>
    `<div class="stp" data-step="${id}" data-min="${minV}" data-max="${maxV}"><span>${label}</span><div class="stp-c"><button type="button" data-d="-1" aria-label="${label}: ${t(C.less)}">${ic("minus")}</button><output aria-live="polite"></output><button type="button" data-d="1" aria-label="${label}: ${t(C.more)}">${ic("plus")}</button></div></div>`;
  const heroBg = own.length
    ? `<img src="${esc(own[0])}" alt="" width="1200" height="800" fetchpriority="high" referrerpolicy="no-referrer">`
    : `<picture><source media="(min-width: 800px)" srcset="${IMG}/hero.webp"><img src="${IMG}/hero-9.webp" alt="" width="748" height="1330" fetchpriority="high"></picture>`;
  const route = d0
    ? `<div class="route" id="route" aria-live="polite">
<svg class="route-svg" viewBox="0 0 320 120" aria-hidden="true"><path id="route-p" class="route-p" d="M14 104 C 90 6, 230 6, 306 70"/><circle cx="14" cy="104" r="4" class="route-a"/><circle cx="306" cy="70" r="4" class="route-b"/><g id="route-pl" class="route-pl"><svg x="-11" y="-11" width="22" height="22" viewBox="0 0 24 24"><use href="#i-plane"/></svg></g></svg>
<div class="route-l"><b>TAS</b><span>${t(C.route)}</span></div>
<div class="route-r"><b id="route-code">${d0.code}</b><span id="route-name">${esc(d0[l])}</span></div>
<p class="route-pr"><span>${t(C.from)}</span> <b id="route-price">${usd(d0.price)}</b> <small>${t(C.perOne)}</small></p>
</div>`
    : "";
  const chips = dests.map((d, i) => `<button type="button" class="chip" data-dest="${d.id}" aria-pressed="${i === 0}">${esc(d[l])}<small>${usd(d.price)}</small></button>`).join("");
  const monthChips = months.map(([m, n], i) => `<button type="button" class="chip" data-m="${m}" data-g="mk" aria-pressed="${i === 0}">${n}</button>`).join("");
  const xs = turSearch({ l, img: IMG, services, dests, all: DESTS, city: site.city });
  const search = `<div class="srch" id="poisk">
${xs.tabs}
<div class="tabs" role="tablist" aria-label="${t(C.where)}" style="display:none"><button type="button" role="tab" id="tb-know" aria-selected="true" aria-controls="pn-know">${ic("search")}<span>${t(C.tabKnow)}</span></button></div>
<div class="pn" id="pn-know" role="tabpanel" aria-labelledby="tb-know">
${dests.length ? `<div class="fld"><span class="fl">${t(C.where)}</span><div class="chips scroll-x" role="group" aria-label="${t(C.where)}" data-g="dest">${chips}</div></div>` : ""}
<div class="fld"><span class="fl">${t(C.when)}</span><div class="chips" role="group" aria-label="${t(C.when)}" data-g="mk">${monthChips}</div><label class="flex"><input type="checkbox" id="flex" checked><span class="sw sm" aria-hidden="true"></span><span>${t(C.flex)}</span></label></div>
<div class="fld"><span class="fl">${t(C.who)}</span><div class="stps">${step("ad", t(C.adults), 1, 6)}${step("ch", t(C.kids), 0, 4)}</div></div>
<button type="button" class="btn btn-sun btn-go" id="go-know">${ic("search")}<span>${t(C.find)}</span></button>
</div>
<div hidden><button type="button" id="go-pick"></button></div>
<div class="quick">${tel ? `<a class="btn btn-line" href="${esc(tel)}">${ic("phone")}<span>${t(C.call)}</span></a>` : ""}${chat ? `<a class="btn btn-line" href="${esc(chat)}" target="_blank" rel="noopener">${ic("tg")}<span>${tg ? "Telegram" : "WhatsApp"}</span></a>` : ""}</div>
${perks.length ? `<ul class="trust">${perks.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
</div>`;

  // Пролёт ниши (владелец, 11.11.2026): от первого лица — лента в телефоне, пост
  // с островом, нажатие, влёт в экран, лежак с коктейлем у океана и закат.
  const top2 = services.slice(0, 2).map((x) => x.name).join(", ");
  const fly = flyParts({
    locale: l, img: IMG, media: turagentstvoMedia, label: l === "ru" ? "Из ленты на море" : "Lentadan dengizga", fin: "center",
    btn: "btn btn-sun", accent: "var(--sun)", hd: "'Playfair Display',serif", tx: "'Onest',sans-serif", to: "hero",
    chapters: [
      { at: 0.06, a: site.name, b: site.city ?? (l === "ru" ? "Туры и отдых" : "Turlar va dam olish") },
      { at: 0.24, a: l === "ru" ? "За окном дождь" : "Derazada yomg‘ir", b: l === "ru" ? "а в ленте море" : "lentada esa dengiz" },
      { at: 0.48, a: l === "ru" ? "Одно касание" : "Bir bosish", b: l === "ru" ? "и вы уже там" : "va siz o‘sha yerdasiz" },
      { at: 0.72, a: l === "ru" ? "Коктейль, лежак, океан" : "Kokteyl, shezlong, okean", b: top2 || (l === "ru" ? "остальное берём на себя" : "qolganini biz hal qilamiz") },
      { at: 0.93, a: site.name, b: site.tagline ?? site.city ?? "" },
    ],
  });

  const hero = `<section class="hero" id="hero" aria-labelledby="hero-h">
<div class="hero-bg" aria-hidden="true">${heroBg}</div>
<div class="hero-shade" aria-hidden="true"></div>
<div class="wrap hero-g">
<div class="hero-t">
<span class="kick">${esc(site.tagline ?? (site.city ? `${t(C.kind)} · ${site.city}` : t(C.kind)))}</span>
<h1 id="hero-h"><span>${name}</span> <em>${t(C.h1em)}</em></h1>
<p class="lead">${site.about ? esc(site.about) : t(C.lead)}</p>
${route}
</div>
${search}
</div>
</section>`;

  const rez = `<section class="rez" id="rez" hidden><div class="wrap"><div class="rez-g" id="rez-g"></div></div></section>`;

  let karta = "";
  if (d0) {
    const rings = [1000, 3000, 6000].map((k) => `<circle r="${rOf(k).toFixed(1)}"/>`).join("");
    const arcs = dests.map((p) => `<path class="arc" data-dest="${p.id}" d="M0 0 Q ${Math.round(p.x / 2 - p.y * 0.18)} ${Math.round(p.y / 2 + p.x * 0.18)} ${p.x} ${p.y}"/>`).join("");
    const dots = dests
      .map((p) => {
        const [x, y, a] = LABEL[LAB[p.id] ?? (p.x >= 0 ? "r" : "l")];
        return `<g class="dot" data-dest="${p.id}" transform="translate(${p.x} ${p.y})"><circle r="14" class="dot-h"/><circle r="6"/><text x="${x}" y="${y}" text-anchor="${a}"><tspan class="dn">${esc(p[l])}</tspan><tspan class="dp" data-p="${p.price}" dx="6">${usd(p.price)}</tspan></text></g>`;
      })
      .join("");
    const lo = dests[0].price;
    const hi = dests[dests.length - 1].price;
    karta = `<section class="karta" id="karta" aria-labelledby="karta-h"><div class="wrap">
${head(t(C.kartaKick), `<span id="karta-h">${t(C.kartaH)}</span>`, t(C.kartaP))}
<div class="seg" role="group" aria-label="${t(C.who)}"><button type="button" data-n="1" aria-pressed="true">${t(C.perOne)}</button><button type="button" data-n="2" aria-pressed="false">${t(C.forTwo)}</button></div>
<div class="karta-g">
<div class="chart"><svg viewBox="-320 -250 640 460" role="img" aria-label="${t(C.kartaH)}"><g class="rings">${rings}</g><g class="arcs">${arcs}</g><g class="tas"><circle r="7"/><text y="24" text-anchor="middle">TAS</text></g><g class="dots">${dots}</g><g id="map-pl" class="map-pl"><svg x="-11" y="-11" width="22" height="22" viewBox="0 0 24 24"><use href="#i-plane"/></svg></g></svg></div>
<div class="dside"><div class="dcard" id="dcard">
<div class="dc-img"><img id="dc-img" src="${IMG}/${d0.img}-s.webp" alt="${esc(d0[l])}" width="640" height="427" loading="lazy" decoding="async"></div>
<div class="dc-b"><h3 id="dc-t">${esc(d0[l])}</h3><p class="dc-p"><span>${t(C.from)}</span> <b id="dc-pr">${usd(d0.price)}</b> <small id="dc-for">${t(C.perOne)}</small></p><p class="dc-n" id="dc-n"></p><dl class="dc-f" id="dc-f"></dl>
<button type="button" class="btn btn-sun" id="dc-go">${ic("search")}<span>${t(C.seeTours)}</span></button></div>
</div></div>
</div>
<h3 class="rank-h">${t(C.rank)}</h3>
<ol class="rank" id="rank">${dests.map((d) => `<li><button type="button" data-dest="${d.id}"><span class="rk-n">${esc(d[l])}</span><span class="rk-b" style="--w:${hi > lo ? Math.round(((d.price - lo) / (hi - lo)) * 100) : 50}%"><i></i></span><b class="rk-p" data-p="${d.price}">${usd(d.price)}</b></button></li>`).join("")}</ol>
</div></section>`;
  }

  const ask = (s: string) => (chat ? `${chat}?text=${encodeURIComponent(`${l === "uz" ? "Assalomu alaykum! Qiziqtiradi:" : "Здравствуйте! Интересует:"} ${s}`)}` : tel);
  const usl = services.length
    ? `<section class="usl" id="uslugi"><div class="wrap">
${head(t(C.uslKick), t(C.uslH))}
<div class="tks">${services
        .map((s, i) => {
          const d = DESTS.find((x) => x.words.test(s.name));
          return tourCard({ name: s.name, price: s.price, img: `${IMG}/${d ? d.img : "hero"}-s.webp`, alt: d ? d[l] : "", ask: t(C.priceAsk), cta: t(C.find), delay: i * 80 });
        })
        .join("")}</div>
</div></section>`
    : "";

  const map = site.address ? `https://yandex.uz/maps/?text=${encodeURIComponent(site.address)}` : null;
  const ct = `<section class="ct" id="kontakty"><div class="wrap ct-g">
<div class="ct-t">${head(t(C.ctKick), t(C.ctH))}
<ul class="ct-l">
${site.address ? `<li>${ic("pin")}<span><b>${esc(site.address)}</b>${map ? `<a href="${esc(map)}" target="_blank" rel="noopener">${l === "uz" ? "Xaritada" : "На карте"}</a>` : ""}</span></li>` : ""}
${site.hours ? `<li>${ic("clock")}<span><b>${esc(site.hours)}</b></span></li>` : ""}
${tel ? `<li>${ic("phone")}<span><b><a href="${esc(tel)}">${esc(site.phone ?? "")}</a></b></span></li>` : ""}
</ul>
<div class="ct-b">${chat ? `<a class="btn btn-sun" href="${esc(chat)}" target="_blank" rel="noopener">${ic("tg")}<span>${tg ? `@${esc(tg)}` : "WhatsApp"}</span></a>` : ""}${ig ? `<a class="btn btn-line" href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">${ic("ig")}<span>@${esc(ig)}</span></a>` : ""}</div>
</div>
<div class="im-flow rv"><p class="kick">${t(C.flowKick)}</p><h3>${t(C.flowH)}</h3><div class="im-tg"><div class="im-tg-h">${ic("tg")}<b>${t(C.demoTitle)}</b><small>${t(C.demo)}</small></div><p>${t(C.demoWhere)}<br>${t(C.demoWho)}<br>${t(C.demoName)}: [[t:0]]<br>${t(C.demoNote)}</p></div></div>
</div></section>`;

  const bron = `<div class="sheet" id="bron" role="dialog" aria-modal="true" aria-labelledby="br-h" hidden>
<div class="sh-in">
<button type="button" class="sh-x" data-close aria-label="${t(C.close)}">${ic("x")}</button>
<p class="sh-h" id="br-h">${t(C.bronH)}</p>
<p class="br-sum" id="br-sum"></p>
<form class="bf" id="bf" novalidate>
<label><span>${t(C.name)}</span><input id="bf-n" name="n" autocomplete="name" required></label>
<label><span>${t(C.phone)}</span><input id="bf-p" name="p" type="tel" autocomplete="tel" inputmode="tel" value="+" required></label>
<label><span>${t(C.note)}</span><input id="bf-c" name="c"></label>
<p class="bf-e" id="bf-e" hidden>${t(C.needName)}</p>
<button type="submit" class="btn btn-sun">${ic("tg")}<span>${t(C.send)}</span></button>
${site.phone ? `<a class="btn btn-line" id="bf-sms" href="sms:${esc(site.phone.replace(/[^\d+]/g, ""))}">${ic("phone")}<span>${t(C.sms)}</span></a>` : ""}
${tel ? `<a class="btn btn-line" href="${esc(tel)}">${ic("phone")}<span>${t(C.call)}</span></a>` : ""}
<p class="note">${t(C.sendNote)}</p>
</form>
<div class="stat" id="stat" hidden><p class="stat-h">${t(C.stH)}</p><ol>${C.st.map((s, i) => `<li data-i="${i}"><i>${ic("check")}</i><span>${t(s)}</span></li>`).join("")}</ol></div>
</div></div>`;

  const links = [
    tel ? `<li>${ic("phone")}<a href="${esc(tel)}">${esc(site.phone ?? "")}</a></li>` : "",
    chat ? `<li>${ic("tg")}<a href="${esc(chat)}" target="_blank" rel="noopener">${tg ? `@${esc(tg)}` : "WhatsApp"}</a></li>` : "",
    ig ? `<li>${ic("ig")}<a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">@${esc(ig)}</a></li>` : "",
  ].join("");
  const footer = `<footer class="foot"><div class="wrap">
<div class="cols"><div>${logoA}${site.address || site.hours ? `<p class="f-d">${[site.address, site.hours].filter(Boolean).map((x) => esc(x ?? "")).join(". ")}</p>` : ""}${links ? `<ul class="f-c">${links}</ul>` : ""}</div></div>
<div class="rights"><span>${t(C.rights)} <a href="${esc(mockupTermsUrl(l))}">${t(C.terms)}</a></span><span>${t(C.source)} ${esc(site.source)}. ${own.length ? "" : t(C.photos)}</span></div>
</div></footer>`;

  const dock = `<div class="dock" id="dock"><a class="btn btn-sun" href="#poisk" data-to-search>${ic("search")}<span>${t(C.find)}</span></a>${tel ? `<a class="btn btn-call" href="${esc(tel)}" aria-label="${t(C.call)}">${ic("phone")}</a>` : ""}${chat ? `<a class="btn btn-call" href="${esc(chat)}" target="_blank" rel="noopener" aria-label="${t(C.write)}">${ic("tg")}</a>` : ""}</div>`;

  const msg =
    l === "uz"
      ? "Assalomu alaykum! Tur arizasi: @D, @W, @P. Ism: @NM, telefon: @PH. @NT"
      : "Здравствуйте! Заявка на тур: @D, @W, @P. Имя: @NM, телефон: @PH. @NT";
  const data = {
    l,
    img: IMG,
    tg: chat ?? "",
    sms: site.phone ? site.phone.replace(/[^\d+]/g, "") : "",
    phone: site.phone ?? "",
    adv: 0,
    dest: dests.map((d) => ({ id: d.id, code: d.code, price: d.price, nights: 0, date: "", img: d.img, km: d.km, t: d[l], g: d[l], season: "", hours: "", visa: "", m: [], beach: false, near: "" })),
    months,
    mon: MON[l],
    t: {
      from: t(C.from), perOne: t(C.perOne), forOne: t(C.perOne), forTwo: t(C.forTwo), forFam: t(C.forTwo), km: t(C.km), flight: t(C.flight), season: "", visa: "", cheapest: "",
      who2: l === "uz" ? "@A katta" : "взрослых: @A", who2k: l === "uz" ? "@A katta, @K bola" : "взрослых: @A, детей: @K", msg, mine: t(C.mine), day: l === "uz" ? "@D-@M" : "@D @M",
      wait: "", waitDone: "", rezKick: "", pickKick: "", pickT: "", left: "", over: "", hotel: "", meal: [], days: [], vouF: [], cancelD: "", cancelOk: "", cancelNo: "", nightsW: "", perP: "", total: "", see: "", seeTours: t(C.seeTours), spec: "", stNow: "",
    },
    spec: {},
    offer: { items: [], base: 0, baseName: "", hours: 0, head: "", totalW: "", copied: "", ended: "" },
  };

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.kind).toLowerCase()}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0c2236">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Onest:wght@400;700&display=swap">
<script>(function(){var r=document.documentElement;r.classList.add('js');var calm=false;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)calm=true}catch(e){}try{var c=navigator.connection;if(c&&c.saveData)calm=true}catch(e){}if(calm)r.classList.add('calm')})()</script>
<style>${assets.css}
:root{${palette(site.color)}}
.im-logo img{width:36px;height:36px;object-fit:contain}
.im-logo .logo-w b{color:var(--paper);max-width:52vw;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom}
.hero h1 span{overflow-wrap:anywhere}
.uc a{color:var(--sea2);font-weight:700}
.im-flow{align-self:center;padding:24px;border-radius:var(--r2);background:var(--sand)}
.im-flow h3{font:700 24px/1.2 var(--f-d);margin:8px 0 16px}
.im-tg{background:var(--paper);border-radius:var(--r);padding:16px;box-shadow:var(--sh1)}
.im-tg-h{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.im-tg-h .ic{color:var(--sea2)}
.im-tg-h small{margin-left:auto;color:var(--mute);font-size:12px}
.im-tg p{margin:0;line-height:1.7}</style>
${fly.css}
${xs.css}
</head>
<body class="site">
${dzIntroSolo(l)}
${sprite()}
<a class="skip" href="#main">${t(C.skip)}</a>
<header class="top" id="top"><div class="wrap">
${logoA}
<nav class="nav" aria-label="${t(C.navL)}">${nav.map(([u, n]) => `<a href="${u}">${t(n)}</a>`).join("")}</nav>
<div class="top-r">${tel ? `<a class="top-ph" href="${esc(tel)}" aria-label="${t(C.call)}">${ic("phone")}<span>${esc(site.phone ?? "")}</span></a>` : ""}${chat ? `<a class="top-tg" href="${esc(chat)}" target="_blank" rel="noopener" aria-label="${t(C.write)}">${ic("tg")}</a>` : ""}<button type="button" class="mine" id="mine" hidden>${t(C.mine)}</button></div>
</div></header>
<main id="main">
${fly.section}
${hero}
${rez}
${karta}
${usl}
${ct}
</main>
${footer}
${dock}
${bron}
${xs.overlay}
<script type="application/json" id="tr-data">${json(data)}</script>
<script>
${assets.js}</script>
${fly.script}
${xs.js}
</body>
</html>`;
}
