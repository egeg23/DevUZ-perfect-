/**
 * Шаблон «Автосалон» — страница сайта нашего макета SAMIST AUTO
 * (scripts/protos/samist/gen.mjs, sitePage), переодетая под клиента.
 *
 * Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают
 * "другая ниша"… выведем больше ниш которые у нас есть, также переодевать».
 * Отсюда устройство: стили и скрипт SAMIST — те же файлы
 * (content/proto-instant/samist-assets.json, пишет
 * scripts/protos/instant/samist-assets.mjs), разметка — те же блоки и классы:
 * шапка-стекло, первый экран, бегущая строка, сцена по прокрутке через фото,
 * вся техника с карточками и «нырком» в окно машины, кредит с расчётом
 * платежа (ставку вписывает покупатель), трейд-ин, тест-драйв, пример
 * переписки бота, о компании, контакты с формой, «Моя заявка» со статусом из
 * админки, подвал и док.
 *
 * Что от SAMIST не берётся, потому что это про них, а не дизайн: сцена D-MAX
 * из кадров SamAuto, залёт в их знак, их марки, модели, фото, цены, цифры и
 * адрес, площадка по их разделам, подбор и сравнение по их характеристикам,
 * сервис и запчасти, КП автопаркам, страницы под поиск, конструктор цены
 * (цену бот присылает сообщением и КП). Машины на странице — строки услуг
 * клиента; цена — его словами, числом в сумах — только если он так написал.
 * Нет данных — блока нет; нет фото — нейтральные фото ниши
 * (public/protos/_niche/avtosalon).
 *
 * Шаблонные слова без цифр: каждое число на странице — из данных клиента
 * (lib/proto/instant/check).
 */
import assets from "@/content/proto-instant/samist-assets.json" with { type: "json" };
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { LIMITS, type InstantLocale, type InstantService, type InstantSite, type BaseSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";
import { rgbOf } from "@/lib/proto/instant/dental";

const IMG = "/protos/_niche/avtosalon";
/** Нейтральные фото ниши: шоурум вечером, площадка, фара, салон, ключи на столе. */
export const AVTOSALON_PHOTOS = [1, 2, 3, 4, 5].map((n) => `${IMG}/n${n}-1200.webp`);
const STOCK_CAP = [
  { ru: "Шоурум вечером", uz: "Kechki shourum" },
  { ru: "Площадка", uz: "Maydon" },
  { ru: "Фара", uz: "Fara" },
  { ru: "Салон", uz: "Salon" },
  { ru: "Ключи покупателю", uz: "Xaridorga kalitlar" },
];

type Pair = { ru: string; uz: string };
const P = (ru: string, uz: string): Pair => ({ ru, uz });

const C = {
  kind: P("Автосалон", "Avtosalon"),
  car: P("Автомобиль", "Avtomobil"),
  sections: P("Разделы", "Bo‘limlar"),
  nav: { lineup: P("Машины", "Mashinalar"), credit: P("Кредит", "Kredit"), trade: P("Трейд-ин", "Treyd-in"), drive: P("Тест-драйв", "Test-drayv"), about: P("О компании", "Kompaniya"), contact: P("Контакты", "Aloqa") },
  mine: P("Моя заявка", "Mening arizam"),
  call: P("Позвонить", "Qo‘ng‘iroq"),
  toCars: P("Смотреть машины", "Mashinalarni ko‘rish"),
  toDrive: P("Записаться на тест-драйв", "Test-drayvga yozilish"),
  lead: P("Машины в наличии с ценами, расчёт кредита, трейд-ин и тест-драйв. Заявка сразу у менеджера, статус покупатель видит здесь.", "Narxlari bilan mavjud mashinalar, kredit hisobi, treyd-in va test-drayv. Ariza darhol menejerda, holatini xaridor shu yerda ko‘radi."),
  hAddr: P("Адрес", "Manzil"),
  hHours: P("Часы работы", "Ish vaqti"),
  hPhone: P("Телефон", "Telefon"),
  scnKick: P("В наличии, по прокрутке", "Mavjud, aylantirib ko‘ring"),
  scnLabel: P("Машины по прокрутке", "Aylantirishdagi mashinalar"),
  more: P("Подробнее", "Batafsil"),
  lineKick: P("Машины в наличии", "Mavjud mashinalar"),
  lineH: P("Выберите <b>свою машину</b>", "<b>O‘z mashinangizni</b> tanlang"),
  lineLead: P("Нажмите на машину: фото, цена и что дальше. Цены с вашего сайта или из ответов в боте.", "Mashinani bosing: suratlar, narx va keyingi qadam. Narxlar saytingizdan yoki botdagi javoblardan."),
  all: P("Все", "Hammasi"),
  sort: P("Сортировка", "Saralash"),
  sOwn: P("Как на сайте", "Saytdagidek"),
  sCheap: P("Сначала доступные", "Avval arzonlari"),
  sRich: P("Сначала дорогие", "Avval qimmatlari"),
  crKick: P("Кредит и лизинг", "Kredit va lizing"),
  crH: P("Платёж <b>в месяц</b> до звонка", "Qo‘ng‘iroqdan oldin <b>oylik to‘lov</b>"),
  crLead: P("Ставку называет банк, поэтому её вписывает сам покупатель: сайт посчитает взнос, платёж и переплату, а расчёт придёт вам заявкой.", "Stavkani bank aytadi, shuning uchun uni xaridorning o‘zi yozadi: sayt boshlang‘ich to‘lov, oylik to‘lov va ortiqcha to‘lovni hisoblaydi, hisob sizga ariza bo‘lib keladi."),
  model: P("Модель", "Model"),
  down: P("Первый взнос", "Boshlang‘ich to‘lov"),
  term: P("Срок", "Muddat"),
  rate: P("Ставка банка, % годовых", "Bank stavkasi, yillik %"),
  ratePh: P("например, как назвал ваш банк", "masalan, bankingiz aytganidek"),
  price: P("Цена", "Narx"),
  body: P("Сумма кредита", "Kredit summasi"),
  month: P("В месяц", "Oyiga"),
  over: P("Переплата", "Ortiqcha to‘lov"),
  crGo: P("Отправить расчёт менеджеру", "Hisobni menejerga yuborish"),
  crNote: P("Расчёт для ориентира. Окончательные условия называет банк или лизинговая компания.", "Hisob mo‘ljal uchun. Yakuniy shartlarni bank yoki lizing kompaniyasi aytadi."),
  crOnly: P("В расчёте машины, у которых цена указана в сумах.", "Hisobda narxi so‘mda ko‘rsatilgan mashinalar."),
  trKick: P("Трейд-ин", "Treyd-in"),
  trH: P("Старую машину <b>в зачёт</b>", "Eski mashinani <b>hisobga</b>"),
  trLead: P("Марка, год, пробег и пара фото. Менеджер оценит и назовёт доплату за новую. Фото остаются у покупателя в телефоне до разговора.", "Marka, yil, yurgani va bir-ikki surat. Menejer baholaydi va yangisi uchun qo‘shimcha to‘lovni aytadi. Suratlar suhbatgacha xaridorning telefonida qoladi."),
  oldCar: P("Ваша машина", "Mashinangiz"),
  oldPh: P("марка и модель", "marka va model"),
  year: P("Год", "Yil"),
  km: P("Пробег, км", "Yurgani, km"),
  want: P("Хочу взамен", "Evaziga xohlayman"),
  wantAny: P("Подберём вместе", "Birga tanlaymiz"),
  name: P("Имя", "Ism"),
  phone: P("Телефон", "Telefon"),
  photo: P("Фото старой машины", "Eski mashina surati"),
  trGo: P("Отправить на оценку", "Baholashga yuborish"),
  drKick: P("Тест-драйв и показ", "Test-drayv va ko‘rish"),
  drH: P("Приезжайте <b>посмотреть вживую</b>", "<b>Jonli ko‘rgani</b> keling"),
  drLead: P("Выберите машину и день, менеджер подтвердит время, а статус будет виден в «Моя заявка».", "Mashina va kunni tanlang, menejer vaqtni tasdiqlaydi, holat esa «Mening arizam»da ko‘rinadi."),
  carSel: P("Машина", "Mashina"),
  day: P("День", "Kun"),
  part: P("Когда удобно", "Qachon qulay"),
  parts: [P("утром", "ertalab"), P("днём", "kunduzi"), P("после обеда", "tushlikdan keyin")],
  drGo: P("Записаться", "Yozilish"),
  botKick: P("Предложение DevUz Studio", "DevUz Studio taklifi"),
  botH: P("Так заявка придёт вам <b>в Telegram</b>", "Ariza sizga <b>Telegramda</b> shunday keladi"),
  botLead: P("Покупатель пишет своими словами, бот отвечает машинами из наличия с ценой и передаёт заявку менеджеру. Это пример переписки.", "Xaridor o‘z so‘zlari bilan yozadi, bot mavjud mashinalar bilan narxi bilan javob beradi va arizani menejerga uzatadi. Bu yozishma namunasi."),
  bot: P("бот", "bot"),
  demo: P("пример", "namuna"),
  bU1: P("Здравствуйте, что есть в наличии?", "Assalomu alaykum, nima mavjud?"),
  bB1: P("Сейчас в наличии:", "Hozir mavjud:"),
  bU2: P("Можно приехать посмотреть после обеда? Я рядом с магазином «[[t:1]]».", "Tushlikdan keyin ko‘rgani kelsam bo‘ladimi? Men «[[t:1]]» do‘koni yonidaman."),
  bB2: P("Да, менеджер перезвонит и подтвердит время.", "Ha, menejer qo‘ng‘iroq qilib vaqtni tasdiqlaydi."),
  bSys: P("Заявка от [[t:0]] передана менеджеру", "[[t:0]]dan ariza menejerga uzatildi"),
  btn: { more: P("Подробнее", "Batafsil"), credit: P("В кредит", "Kreditga"), mgr: P("Менеджер", "Menejer") },
  abKick: P("О компании", "Kompaniya haqida"),
  ctKick: P("Контакты", "Aloqa"),
  ctH: P("Приезжайте <b>в салон</b>", "<b>Salonga</b> keling"),
  route: P("маршрут", "yo‘nalish"),
  callBack: P("Перезвоним", "Qo‘ng‘iroq qilamiz"),
  q: P("Вопрос", "Savol"),
  qPh: P("Какая машина нужна и для чего", "Qanday mashina va nima uchun kerak"),
  send: P("Отправить", "Yuborish"),
  ctNote: P("На телефоне откроется SMS на ваш номер с готовым текстом, на компьютере текст скопируется.", "Telefonda tayyor matn bilan raqamingizga SMS ochiladi, kompyuterda matn nusxalanadi."),
  stock: P("Фото для примера: салон поставит свои.", "Rasmlar namuna uchun: salon o‘zinikini qo‘yadi."),
  footText: P("Машины, цены и контакты взяты с вашего сайта или из ответов в боте. Заявки в макете никуда не уходят.", "Mashinalar, narxlar va aloqa saytingizdan yoki botdagi javoblardan olingan. Maketda arizalar hech qayerga ketmaydi."),
  mockup: P("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz qabul qilasiz:"),
  terms: P("условия макета", "maket shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  contacts: P("Контакты", "Aloqa"),
  close: P("Закрыть", "Yopish"),
  toLineup: P("К машинам", "Mashinalarga o‘tish"),
  desc: P("Машины в наличии с ценами, кредит, трейд-ин и тест-драйв.", "Narxlari bilan mavjud mashinalar, kredit, treyd-in va test-drayv."),
} as const;

const I = (dd: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  ig: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  car: I('<path d="M3 16v-4l2-5h14l2 5v4"/><path d="M3 12h18"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/>'),
  sms: I('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>'),
  cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  coin: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>'),
  shield: I('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>'),
};

/** Красный SAMIST — в цвет бренда клиента. Графит ночной площадки остаётся. */
function palette(color: string | null): string {
  const hex = brandColor(color);
  const [h, s0, l0] = hex ? hexToHsl(hex) : [358, 83, 56];
  const s = Math.min(Math.max(s0, 40), 88);
  const l = Math.min(Math.max(l0, 42), 60);
  return [`--a:hsl(${h} ${s}% ${l}%)`, `--a2:hsl(${h} ${s}% ${Math.min(l + 10, 70)}%)`, `--ah:hsl(${h} ${s}% ${l - 8}%)`, `--a-rgb:${rgbOf(h, s, l)}`].join(";");
}

/**
 * Цена машины числом в сумах — только как её написал клиент: «450 000 000
 * сум», «315000000». «от …», «$», «млн», диапазон — его словами на карточке,
 * в кредит такая машина не идёт.
 */
export function carPrice(price: string | null): number {
  if (!price) return 0;
  const groups = price.match(/\d[\d\s ]*\d|\d/g) ?? [];
  if (groups.length !== 1) return 0;
  if (/от|dan\b|тыс|ming|млн|mln|млрд|k\b|\$|usd|у\.?\s?е|₽|руб|€|-|–/i.test(price)) return 0;
  const rest = price.replace(groups[0], "").replace(/[\s.,:]/g, "");
  if (rest && !/^(сум|сўм|so.?m|sum|uzs)$/i.test(rest)) return 0;
  const n = Number(groups[0].replace(/\D/g, ""));
  return n >= 1_000_000 && n < 100_000_000_000 ? n : 0;
}

const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
const words = (txt: string) =>
  txt
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `<span class="w"><span>${esc(w)}</span></span>`)
    .join(" ");

/** Тексты для site.js SAMIST: те же ключи, слова про их площадку и объявления — про клиента. */
function texts(l: InstantLocale, site: InstantSite) {
  const t = (ru: string, uz: string) => (l === "ru" ? ru : uz);
  const ph = site.phone ?? "";
  return {
    sum: t("сум", "so‘m"), mln: t("млн", "mln"), rz_range: "", hello: t("Здравствуйте!", "Assalomu alaykum!"),
    sent_pc: ph ? t(`Заявка сохранена, текст скопирован. Отправьте его на ${ph}`, `Ariza saqlandi, matn nusxalandi. Uni ${ph} raqamiga yuboring`) : t("Заявка сохранена, текст скопирован.", "Ariza saqlandi, matn nusxalandi."),
    ask: t("Цену уточняйте", "Narxini aniqlang"),
    mine: t("Моя заявка", "Mening arizam"), mine_note: t("Статус ставит менеджер в панели. Откройте админку макета, смените статус, и он появится здесь.", "Holatni menejer panelda qo‘yadi. Maket admin panelini oching, holatni o‘zgartiring, u shu yerda paydo bo‘ladi."),
    st0: t("Новая", "Yangi"), st1: t("В работе", "Ishda"), st2: t("Ждём вас", "Sizni kutamiz"), st3: t("Сделка", "Bitim"), st4: t("Отказ", "Rad etildi"),
    k_buy: t("Покупка", "Xarid"), k_credit: t("Кредит, лизинг", "Kredit, lizing"), k_drive: t("Тест-драйв", "Test-drayv"), k_trade: t("Трейд-ин", "Treyd-in"), k_service: t("Сервис", "Servis"), k_part: t("Запчасть", "Ehtiyot qism"), k_fleet: t("КП", "Taklif"), k_call: t("Звонок", "Qo‘ng‘iroq"),
    upd: t("Наличие обновилось из панели", "Mavjudlik paneldan yangilandi"), sold: t("Продано", "Sotildi"), res: t("В резерве", "Rezervda"), new: t("Новый", "Yangi"), used: t("С пробегом", "Ishlatilgan"), credit_tag: t("кредит", "kredit"),
    n_hp: t("л.с.", "o.k."), n_kg: t("кг груза", "kg yuk"), n_m3: t("м³ кузов", "m³ kuzov"), n_seats: t("мест", "o‘rin"), n_tank: t("л бак", "l bak"),
    none: t("Сейчас пусто", "Hozircha bo‘sh"), found: t("Найдено", "Topildi"), photo: t("фото", "surat"),
    want: t("Хочу эту машину", "Shu mashinani xohlayman"), to_credit: t("В кредит", "Kreditga"), to_drive: t("Тест-драйв", "Test-drayv"), to_cmp: "", in_cmp: "", to_fleet: "",
    src: t("Цена с вашего сайта или из ответов в боте. Фото для примера.", "Narx saytingizdan yoki botdagi javoblardan. Suratlar namuna uchun."),
    t_buy: t("Интересует {m}, цена {p}. Подскажите по наличию и оформлению.", "{m} qiziqtiradi, narxi {p}. Mavjudligi va rasmiylashtirish bo‘yicha aytib bering."),
    t_credit: t("Хочу {m} в кредит или лизинг: цена {p}, взнос {dp}, срок {n} мес.", "{m} ni kredit yoki lizingga xohlayman: narx {p}, boshlang‘ich {dp}, muddat {n} oy."), t_credit_pay: t("По ставке {r}% выходит {pay} в месяц.", "{r}% stavkada oyiga {pay} chiqadi."),
    t_trade: t("Трейд-ин: моя {o}, {y} год, пробег {km} км. Хочу взамен {m}.", "Treyd-in: mening {o}, {y} yil, yurgani {km} km. Evaziga {m} xohlayman."),
    t_drive: t("Хочу посмотреть и проехать на {m}: {d}, {p}.", "{m} ni ko‘rib, haydab ko‘rmoqchiman: {d}, {p}."),
    t_service: "", t_part: "", t_fleet: "",
    t_call: t("{n} просит перезвонить. {q}", "{n} qo‘ng‘iroq qilishni so‘raydi. {q}"), q_default: t("Нужна консультация по машине.", "Mashina bo‘yicha maslahat kerak."),
    why_use: "", why_near: "", cmp_n: "", cmp_hint: "", r_price: t("Цена", "Narx"), r_kind: t("Тип", "Turi"), r_fuel: "", r_state: "",
    mon: t("мес.", "oy"), rate_need: t("впишите ставку", "stavkani yozing"), pick_day: t("Выберите день и время", "Kun va vaqtni tanlang"),
    less: t("Меньше", "Kamroq"), more: t("Больше", "Ko‘proq"), open: t("Открыть", "Ochish"),
    kp: "", kp_co: "", kp_m: "", kp_q: "", kp_p: "", kp_s: "", kp_tot: "", kp_note: "",
  };
}

/** Машины для site.js и панели: строка услуги клиента — машина, фото — его или нейтральные. */
export function avtosalonModels(site: BaseSite) {
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u)).slice(0, LIMITS.photos);
  const pics = own.length ? own : AVTOSALON_PHOTOS.map((p) => p.replace("-1200", "-900"));
  const services: InstantService[] = site.services.slice(0, LIMITS.services);
  return services.map((s, k) => ({ id: `c${k}`, name: s.name, uzs: carPrice(s.price), pt: s.price ?? "", img: [0, 1, 2].map((j) => pics[(k + j) % pics.length]) }));
}

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/build, normalizeSite). */
export function avtosalonHtml(site: BaseSite): string {
  const l: InstantLocale = site.locale;
  const t = (p: Pair) => p[l];
  const name = esc(site.name);
  const tel = telHref(site.phone);
  const tg = handleOf(site.telegram);
  const wa = waHref(site.whatsapp);
  const ig = handleOf(site.instagram);
  const logo = imageUrl(site.logo);
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u)).slice(0, LIMITS.photos);
  const cars = avtosalonModels(site);
  const priced = cars.filter((c) => c.uzs > 0);
  const pic = (k: number) => (own.length ? own[k % own.length] : AVTOSALON_PHOTOS[k % AVTOSALON_PHOTOS.length]);
  const srcset = (src: string) => (own.length ? "" : ` srcset="${src.replace("-1200", "-900")} 900w, ${src} 1200w"`);
  const cap = (k: number) => (own.length ? "" : t(STOCK_CAP[k % STOCK_CAP.length]));
  const kind = t(C.car);

  const mark = logo
    ? `<img src="${esc(logo)}" alt="${name}" referrerpolicy="no-referrer" onerror="this.remove()"><b class="lt">${name}</b>`
    : `<b class="lt">${name}</b>`;
  const logoA = `<a class="logo im-logo" href="#top" aria-label="${name}">${mark}</a>`;

  const nav: [string, Pair][] = [
    ...(cars.length ? [["lineup", C.nav.lineup] as [string, Pair]] : []),
    ...(priced.length ? [["credit", C.nav.credit] as [string, Pair]] : []),
    ["trade", C.nav.trade],
    ...(cars.length ? [["drive", C.nav.drive] as [string, Pair]] : []),
    ...(site.about || site.perks.length ? [["about", C.nav.about] as [string, Pair]] : []),
    ["contact", C.nav.contact],
  ];
  const header = `<header class="top"><div class="top-in glass">
${logoA}
<nav class="nav" aria-label="${t(C.sections)}">${nav.map(([id, n]) => `<a href="#${id}">${t(n)}</a>`).join("")}</nav>
<button type="button" class="mine" id="mine" hidden><i class="dot"></i>${ICON.car}<span>${t(C.mine)}</span></button>
${tel ? `<a class="btn btn-a btn-s tel" href="${esc(tel)}">${ICON.phone}<span>${esc(site.phone ?? "")}</span></a>` : `<a class="btn btn-a btn-s tel" href="#contact">${ICON.sms}<span>${t(C.nav.contact)}</span></a>`}
</div></header>`;

  const facts = [
    site.address ? [t(C.hAddr), esc(site.address)] : null,
    site.hours ? [t(C.hHours), esc(site.hours)] : null,
    tel ? [t(C.hPhone), `<a href="${esc(tel)}">${esc(site.phone ?? "")}</a>`] : null,
  ].filter((x): x is string[] => Boolean(x));
  const hero = `<section class="hero" id="top" aria-label="${name}">
<div class="hero-bg"><img src="${esc(pic(0))}"${srcset(pic(0))} sizes="100vw" width="1200" height="800" alt="" fetchpriority="high" referrerpolicy="no-referrer"></div>
<div class="wrap hero-in">
<div><p class="kick"><i></i>${esc(site.tagline ?? (site.city ? `${t(C.kind)} · ${site.city}` : t(C.kind)))}</p>
<h1>${words(site.name)}</h1>
<p class="lead">${site.about ? esc(site.about) : t(C.lead)}</p>
<div class="hero-act">${cars.length ? `<a class="btn btn-a" href="#lineup">${ICON.car}<span>${t(C.toCars)}</span></a>` : ""}${cars.length ? `<a class="btn btn-g" href="#drive">${ICON.cal}<span>${t(C.toDrive)}</span></a>` : tel ? `<a class="btn btn-g" href="${esc(tel)}">${ICON.phone}<span>${t(C.call)}</span></a>` : ""}</div></div>
${facts.length ? `<div class="stats glass">${facts.map(([k, v]) => `<div><span>${k}</span><b class="im-f">${v}</b></div>`).join("")}</div>` : ""}
</div></section>`;

  const veloRow = cars.map((c) => `<span>${esc(c.name)}<i></i></span>`).join("");
  const velo = cars.length >= 3 ? `<div class="velo" aria-hidden="true"><div class="velo-t">${veloRow}${veloRow}${veloRow}${veloRow}</div></div>` : "";

  // Сцена по прокрутке SAMIST: кадры растворяются, камера подъезжает. Кадры — фото, подписи — машины клиента.
  const scnCars = cars.slice(0, 5);
  const scene =
    scnCars.length >= 2
      ? `<section class="scn" id="scn" aria-label="${t(C.scnLabel)}"><div class="scn-st">${scnCars
          .map((c, k) => `<div class="scn-f"><img src="${esc(pic(k))}"${srcset(pic(k))} sizes="100vw" width="1200" height="800" alt="${esc(cap(k) || c.name)}"${k ? ' loading="lazy"' : ""} referrerpolicy="no-referrer"></div>`)
          .join("")}
<div class="scn-top"><div class="wrap"><p class="kick"><i></i>${t(C.scnKick)}</p></div></div>
<div class="scn-rail" aria-hidden="true">${scnCars.map(() => "<i><b></b></i>").join("")}</div>
<div class="scn-tx"><div class="wrap"><p class="kick"><i></i><span class="scn-i"></span></p><p class="scn-n">${esc(scnCars[0].name)}</p><p class="scn-k">${kind}</p><div class="scn-nums"></div>
<p class="scn-price glass"><b>${esc(scnCars[0].uzs ? scnCars[0].pt : scnCars[0].pt || texts(l, site).ask)}</b><small></small></p> <button type="button" class="btn btn-a scn-open" data-open="${scnCars[0].id}" style="pointer-events:auto;margin-top:20px">${t(C.more)}${ICON.arrow}</button></div></div>
</div></section>`
      : "";

  const lineup = cars.length
    ? `<section class="sec" id="lineup"><div class="wrap">
<p class="kick rise"><i></i>${t(C.lineKick)}</p>
<h2 class="h2 rise">${t(C.lineH)}</h2>
<p class="lead rise">${t(C.lineLead)}</p>
<div class="rl rise" style="margin-bottom:24px"></div>
${priced.length >= 2 ? `<div class="ltools"><span id="found" aria-live="polite"></span><label><span class="vh">${t(C.sort)}</span><select id="sort"><option value="own">${t(C.sOwn)}</option><option value="cheap">${t(C.sCheap)}</option><option value="rich">${t(C.sRich)}</option></select></label></div>` : `<div class="ltools"><span id="found" aria-live="polite"></span></div>`}
<div class="grid" id="grid"></div>
</div></section>`
    : "";

  const credit = priced.length
    ? `<section class="sec alt" id="credit"><div class="wrap two">
<div><p class="kick rise"><i></i>${t(C.crKick)}</p>
<h2 class="h2 rise">${t(C.crH)}</h2>
<p class="lead rise">${t(C.crLead)}</p>
${priced.length < cars.length ? `<ul class="alist rise"><li>${ICON.shield}<span>${t(C.crOnly)}</span></li></ul>` : ""}</div>
<div class="card rise">
<label class="fld"><span>${t(C.model)}</span><select id="cr-m">${priced.map((c) => `<option value="${c.id}">${esc(c.name)} · ${esc(c.pt)}</option>`).join("")}</select></label>
<div class="rng"><div><span>${t(C.down)}</span><b id="cr-dpv"></b></div><input type="range" id="cr-dp" min="10" max="70" step="5" value="30" aria-label="${t(C.down)}"></div>
<div class="rng"><div><span>${t(C.term)}</span><b id="cr-nv"></b></div><input type="range" id="cr-n" min="12" max="60" step="6" value="36" aria-label="${t(C.term)}"></div>
<label class="fld"><span>${t(C.rate)}</span><input id="cr-r" inputmode="decimal" placeholder="${t(C.ratePh)}"></label>
<div class="calc-out"><div><span>${t(C.price)}</span><b id="cr-p"></b></div><div><span>${t(C.down)}</span><b id="cr-down"></b></div><div><span>${t(C.body)}</span><b id="cr-body"></b></div><div class="big"><span>${t(C.month)}</span><b id="cr-pay"></b></div><div><span>${t(C.over)}</span><b id="cr-over"></b></div></div>
<button type="button" class="btn btn-a" id="cr-go" style="margin-top:16px;width:100%">${ICON.sms}<span>${t(C.crGo)}</span></button>
<p class="note" style="margin-top:10px">${t(C.crNote)}</p></div>
</div></section>`
    : "";

  const opts = cars.length ? cars.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("") : `<option value="">${t(C.wantAny)}</option>`;
  const trade = `<section class="sec" id="trade"><div class="wrap two">
<div><p class="kick rise"><i></i>${t(C.trKick)}</p>
<h2 class="h2 rise">${t(C.trH)}</h2>
<p class="lead rise">${t(C.trLead)}</p></div>
<form class="card rise" id="tr-f"><div class="fx">
<label class="fld"><span>${t(C.oldCar)}</span><input name="old" required placeholder="${t(C.oldPh)}"></label>
<label class="fld"><span>${t(C.year)}</span><input name="year" inputmode="numeric" required></label>
<label class="fld"><span>${t(C.km)}</span><input name="km" inputmode="numeric"></label>
<label class="fld"><span>${t(C.want)}</span><select name="want">${opts}</select></label>
<label class="fld"><span>${t(C.name)}</span><input name="name" autocomplete="name"></label>
<label class="fld"><span>${t(C.phone)}</span><input name="ph" type="tel" autocomplete="tel" inputmode="tel" placeholder="+998"></label></div>
<label class="fld"><span>${t(C.photo)}</span><input id="tr-ph" type="file" accept="image/*" multiple></label><div class="ph-in" id="tr-pv"></div>
<button type="submit" class="btn btn-a" style="width:100%">${ICON.sms}<span>${t(C.trGo)}</span></button></form>
</div></section>`;

  const drive = cars.length
    ? `<section class="sec alt" id="drive"><div class="wrap two">
<div><p class="kick rise"><i></i>${t(C.drKick)}</p>
<h2 class="h2 rise">${t(C.drH)}</h2>
<p class="lead rise">${site.address ? `${esc(site.address)}. ` : ""}${t(C.drLead)}</p></div>
<form class="card rise" id="dr-f">
<label class="fld"><span>${t(C.carSel)}</span><select id="dr-m">${opts}</select></label>
<div class="q"><span>${t(C.day)}</span><div class="seg" id="dr-days"></div></div>
<div class="q"><span>${t(C.part)}</span><div class="seg">${C.parts.map((p) => `<button type="button" data-part aria-pressed="false">${t(p)}</button>`).join("")}</div></div>
<div class="fx"><label class="fld"><span>${t(C.name)}</span><input name="name" autocomplete="name"></label><label class="fld"><span>${t(C.phone)}</span><input name="ph" type="tel" autocomplete="tel" inputmode="tel" placeholder="+998"></label></div>
<button type="submit" class="btn btn-a" style="width:100%">${ICON.cal}<span>${t(C.drGo)}</span></button></form>
</div></section>`
    : "";

  // Пример переписки бота SAMIST: машины — клиента, две ловушки — в словах покупателя и строке менеджеру.
  const mc = (c: (typeof cars)[number]) => `<span class="mc"><img src="${esc(c.img[0])}" alt="" loading="lazy" referrerpolicy="no-referrer"><span><b>${esc(c.name)}</b><br>${esc(c.pt || texts(l, site).ask)}</span></span>`;
  const bot = `<section class="sec" id="tgbot"><div class="wrap two">
<div><p class="kick rise"><i></i>${t(C.botKick)}</p>
<h2 class="h2 rise">${t(C.botH)}</h2>
<p class="lead rise">${t(C.botLead)}</p></div>
<div class="tgw rise"><div class="tgw-h"><i>${esc(site.name.slice(0, 2).toUpperCase())}</i><span><b>${name}</b><small>${t(C.bot)} · ${t(C.demo)}</small></span></div><div class="tgw-b" id="tg-b">
<div class="msg u">${t(C.bU1)}</div>
<div class="msg b">${cars.length ? `${t(C.bB1)}${cars.slice(0, 3).map(mc).join("")}` : t(C.bB2)}<span class="kb"><span>${t(C.btn.more)}</span>${priced.length ? `<span>${t(C.btn.credit)}</span>` : ""}<span>${t(C.btn.mgr)}</span></span></div>
<div class="msg u">${t(C.bU2)}</div>
<div class="msg b">${t(C.bB2)}</div>
<div class="msg sys">${t(C.bSys)}</div>
</div></div>
</div></section>`;

  const about =
    site.about || site.perks.length
      ? `<section class="sec alt" id="about"><div class="wrap">
<div class="about"><div><p class="kick rise"><i></i>${t(C.abKick)}</p>
<h2 class="h2 rise">${name}</h2>
${site.about ? `<p class="lead rise">${esc(site.about)}</p>` : ""}
${site.perks.length ? `<ul class="alist">${site.perks.map((x) => `<li class="rise">${ICON.check}<span>${esc(x)}</span></li>`).join("")}</ul>` : ""}
${site.tagline ? `<p class="motto rise">${esc(site.tagline)}</p>` : ""}</div>
<div class="about-ph rise"><img src="${esc(pic(1))}"${srcset(pic(1))} sizes="(min-width: 900px) 50vw, 100vw" width="1200" height="800" alt="${esc(cap(1))}" loading="lazy" referrerpolicy="no-referrer"></div></div>
${own.length ? "" : `<p class="note rise" style="margin-top:16px">${t(C.stock)}</p>`}
</div></section>`
      : "";

  const map = site.address ? `https://yandex.uz/maps/?text=${encodeURIComponent(site.address)}` : null;
  const chat = tg ? `https://t.me/${tg}` : wa;
  const contact = `<section class="sec" id="contact"><div class="wrap">
<p class="kick rise"><i></i>${t(C.ctKick)}</p>
<h2 class="h2 rise">${t(C.ctH)}</h2>
<div class="cnt"><div class="cnt-l">
${tel ? `<a class="rise" href="${esc(tel)}">${ICON.phone}<span><b>${esc(site.phone ?? "")}</b><small>${name}</small></span></a>` : ""}
${site.address ? `<a class="rise" href="${esc(map ?? "#contact")}" target="_blank" rel="noopener">${ICON.pin}<span><b>${esc(site.address)}</b><small>${site.city ? `${esc(site.city)} · ` : ""}${t(C.route)}</small></span></a>` : ""}
${site.hours ? `<div class="rise">${ICON.clock}<span><b>${esc(site.hours)}</b><small>${t(C.hHours)}</small></span></div>` : ""}
${chat ? `<a class="rise" href="${esc(chat)}" target="_blank" rel="noopener">${ICON.tg}<span><b>${tg ? `@${esc(tg)}` : "WhatsApp"}</b><small>${tg ? "Telegram" : "WhatsApp"}</small></span></a>` : ""}
${ig ? `<a class="rise" href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">${ICON.ig}<span><b>@${esc(ig)}</b><small>Instagram</small></span></a>` : ""}
</div>
<form class="card rise" id="ct-f"><h3>${t(C.callBack)}</h3>
<div class="fx"><label class="fld"><span>${t(C.name)}</span><input name="name" autocomplete="name" required></label><label class="fld"><span>${t(C.phone)}</span><input name="ph" type="tel" autocomplete="tel" inputmode="tel" placeholder="+998" required></label></div>
<label class="fld"><span>${t(C.q)}</span><textarea name="q" placeholder="${t(C.qPh)}"></textarea></label>
<button type="submit" class="btn btn-a" style="width:100%">${ICON.sms}<span>${t(C.send)}</span></button>
${tel ? `<p class="note" style="margin-top:10px">${t(C.ctNote)}</p>` : ""}</form></div>
</div></section>`;

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
    tel: site.phone ? site.phone.replace(/[^\d+]/g, "") : "",
    phone: site.phone ?? "",
    legal: site.name,
    addr: site.address ?? "",
    img: "",
    logo: [0, 0],
    scene: scnCars.map((c) => c.id),
    cats: [["all", t(C.all)]],
    models: cars.map((c) => ({ id: c.id, name: c.name, cat: "all", kind, isNew: false, year: null, uzs: c.uzs, pt: c.pt, usd: 0, hp: 0, kg: 0, m3: 0, seats: 0, tank: 0, fuel: "", credit: c.uzs > 0, use: [], spec: [], img: c.img, url: "" })),
    t: texts(l, site),
  };

  const dock = `<div class="dock glass" id="dock">${tel ? `<a class="btn btn-a" href="${esc(tel)}">${ICON.phone}<span>${t(C.call)}</span></a>` : `<a class="btn btn-a" href="#contact">${ICON.sms}<span>${t(C.nav.contact)}</span></a>`}${cars.length ? `<a class="btn btn-g" href="#lineup">${ICON.car}<span>${t(C.nav.lineup)}</span></a>` : ""}</div>`;

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.kind).toLowerCase()}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0b0c0e">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Manrope:wght@400;700&display=swap">
<script>(function(){var r=document.documentElement,calm=false;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)calm=true}catch(e){}try{var c=navigator.connection;if(c&&c.saveData)calm=true}catch(e){}if(navigator.deviceMemory&&navigator.deviceMemory<2)calm=true;if(calm)r.classList.add('calm')})()</script>
<style>${assets.css}
:root{${palette(site.color)}}
.im-logo{display:flex;align-items:center;gap:10px;max-width:46vw;min-width:0}
.im-logo img{height:34px;width:auto;max-width:110px;object-fit:contain}
.im-logo .lt{font:700 18px/1.1 var(--hd);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hero h1{overflow-wrap:anywhere}
.hero h1 .w{max-width:100%}
.hero .stats{grid-template-columns:1fr}
.im-f{font-size:18px!important;overflow-wrap:anywhere}
.im-f a{color:inherit}
.tgw-b{height:auto;min-height:420px}
.ltools{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.ltools select{min-height:40px;padding:0 12px;border-radius:12px;border:1px solid var(--ln);background:var(--s2)}</style>
</head>
<body>
${dzIntroSolo(l)}
<a class="vh" href="#lineup">${t(C.toLineup)}</a>
${header}
<main>
${hero}
${velo}
${scene}
${lineup}
${credit}
${trade}
${drive}
${bot}
${about}
${contact}
</main>
${footer}
${dock}
<div class="mdl" id="mdl" role="dialog" aria-modal="true" aria-labelledby="mdl-h"><div class="mdl-sh" data-mclose></div><div class="mdl-box"><button type="button" class="mdl-x" data-mclose aria-label="${t(C.close)}">${ICON.close}</button><div id="mdl-in"></div></div></div>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="shh"><div class="sh" data-close></div><div class="box"><div class="bh"><b id="shh"></b><button type="button" class="x" data-close aria-label="${t(C.close)}">${ICON.close}</button></div><div class="bb" id="shb"></div></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="as-data">${json(data)}</script>
<script>
${assets.js}</script>
</body>
</html>`;
}

/** Цвет клиента — для админки на стилях SAMIST. */
export const avtosalonPalette = palette;
