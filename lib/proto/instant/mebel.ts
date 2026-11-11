/**
 * Шаблон «Мебель» — главная нашего макета vTashkente
 * (scripts/protos/vtashkente/gen.mjs), переодетая под клиента.
 *
 * Владелец, 11.11.2026: «Так ты и бери макеты, которые мы уже делали, просто
 * вешай их логотип пока и другую инфу». Отсюда устройство: стили, сцена
 * сборки и скрипт vTashkente — те же файлы (content/proto-instant/
 * vtashkente-assets.json, пишет scripts/protos/instant/vtashkente-assets.mjs),
 * разметка — те же блоки и классы: шапка и меню во весь экран, первый экран
 * со сменой фото и перебором слов, кухня собирается по прокрутке (рисунок
 * кодом), лента работ вбок, пять шагов и расчёт метров кухни, производство
 * и шоу-рум, заявка на замер с панелью справа, подвал и кнопки внизу.
 *
 * Что от vTashkente не берётся, потому что это про них, а не дизайн: их фото
 * и знак-галочка в заставке, примерка фасадов (контуры нарисованы по их
 * снимку), названия их кухонь и видеообзоры, их цифры, бонусы и адреса,
 * блок цены сайта (цену бот присылает сообщением). Нет данных клиента —
 * блока нет; нет фото — нейтральные фото ниши (public/protos/_niche/mebel).
 * Пролёта по прокрутке у ниши пока нет (владелец: «Продеты сделаем для
 * всех, но чуть позже»).
 *
 * Шаблонные слова без цифр: каждое число на странице — из данных клиента
 * (lib/proto/instant/check).
 */
import assets from "@/content/proto-instant/vtashkente-assets.json" with { type: "json" };
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { LIMITS, type InstantLocale, type InstantSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";
import { rgbOf } from "@/lib/proto/instant/dental";

const IMG = "/protos/_niche/mebel";
/** Нейтральные фото ниши: светлая кухня, гардеробная, тёмная кухня, цех, образцы. */
export const MEBEL_PHOTOS = [1, 2, 3, 4, 5].map((n) => `${IMG}/n${n}-1200.webp`);
/** Что на нейтральных фото первого экрана — подпись под сменой кадров. */
const STOCK_HERO = [
  { ru: "Светлая кухня с островом", uz: "Orolli yorug‘ oshxona" },
  { ru: "Гардеробная", uz: "Garderob" },
  { ru: "Тёмная кухня с подсветкой", uz: "Yoritilgan to‘q oshxona" },
];

type Pair = { ru: string; uz: string };
const P = (ru: string, uz: string): Pair => ({ ru, uz });

const C = {
  kind: P("Мебель на заказ", "Buyurtma asosida mebel"),
  sections: P("Разделы", "Bo‘limlar"),
  menu: P("Меню", "Menyu"),
  close: P("Закрыть", "Yopish"),
  nav: { sborka: P("Сборка", "Yig‘ish"), raboty: P("Что делаем", "Nima qilamiz"), zakaz: P("Как заказать", "Buyurtma"), doverie: P("О компании", "Kompaniya haqida"), zamer: P("Замер", "O‘lchov") },
  zamer: P("Вызвать замерщика", "O‘lchovchini chaqirish"),
  firstScreen: P("Первый экран", "Birinchi ekran"),
  words: { ru: ["Проектируем", "Рисуем", "Производим", "Доставляем", "Устанавливаем"], uz: ["Loyihalaymiz", "Chizamiz", "Ishlab chiqaramiz", "Yetkazamiz", "O‘rnatamiz"] },
  h1: { ru: ["мебель", "на заказ"], uz: ["buyurtma", "asosida mebel"] },
  lead: P("Замер, проект, производство и установка. Оставьте телефон: перезвоним и договоримся о замере.", "O‘lchov, loyiha, ishlab chiqarish va o‘rnatish. Telefon qoldiring: qo‘ng‘iroq qilib, o‘lchovni kelishamiz."),
  askTg: P("Узнать цену в Telegram", "Narxni Telegramda bilish"),
  askWa: P("Узнать цену в WhatsApp", "Narxni WhatsAppda bilish"),
  callUs: P("Позвонить", "Qo‘ng‘iroq qilish"),
  down: P("Листайте: кухня соберётся", "Varaqlang: oshxona yig‘iladi"),
  stock: P("Фото для примера: компания поставит свои.", "Rasmlar namuna uchun: kompaniya o‘zinikini qo‘yadi."),
  asmLabel: P("Кухня собирается по прокрутке", "Oshxona varaqlaganda yig‘iladi"),
  asmKick: P("Как устроена кухня", "Oshxona qanday tuzilgan"),
  asmH: P("Кухня собирается, пока вы листаете", "Siz varaqlaganingizda oshxona yig‘iladi"),
  asm: [
    [P("Корпуса", "Korpuslar"), P("Режем под ваши стены, в том числе нестандартные размеры.", "Devorlaringizga moslab kesamiz, nostandart o‘lchamlarni ham.")],
    [P("Фасады", "Fasadlar"), P("Стиль, цвет и материал выбираете вы. Образцы привезёт замерщик.", "Uslub, rang va materialni o‘zingiz tanlaysiz. Namunalarni o‘lchovchi olib keladi.")],
    [P("Столешница", "Stoleshnitsa"), P("Под размер кухни и под технику, которую вы поставите.", "Oshxona o‘lchamiga va qo‘yadigan texnikangizga moslab.")],
    [P("Техника", "Texnika"), P("Оставляем места под духовку, мойку, вытяжку и холодильник.", "Duxovka, rakovina, so‘rg‘ich va muzlatgich uchun joy qoldiramiz.")],
    [P("Свет", "Yorug‘lik"), P("Готово: подсветка под шкафами, всё открывается и закрывается мягко.", "Tayyor: shkaflar ostida yoritish, hammasi yumshoq ochilib-yopiladi.")],
  ],
  asmNote: P("Сцена нарисована кодом: так устроена кухня, это не конкретный проект компании.", "Sahna kod bilan chizilgan: oshxona shunday tuzilgan, bu kompaniyaning aniq loyihasi emas."),
  worksKick: P("Что делаем", "Nima qilamiz"),
  worksH: P("Мебель, которую мы делаем", "Biz yasaydigan mebel"),
  discuss: P("Обсудить", "Muhokama qilish"),
  priceAsk: P("Цену назовём после замера", "Narxini o‘lchovdan keyin aytamiz"),
  worksEnd: P("Пришлём фото готовых работ и примерную цену под ваши размеры.", "Tayyor ishlar suratlarini va o‘lchamlaringizga taxminiy narxni yuboramiz."),
  getCatalog: P("Получить фото работ", "Ishlar suratlarini olish"),
  orderKick: P("Как заказать", "Qanday buyurtma qilish"),
  orderH: P("От заявки до готовой мебели", "Arizadan tayyor mebelgacha"),
  marquee: { ru: ["Проектируем", "Рисуем", "Производим", "Доставляем", "Устанавливаем"], uz: ["Loyihalaymiz", "Chizamiz", "Ishlab chiqaramiz", "Yetkazamiz", "O‘rnatamiz"] },
  steps: [
    [P("Заявка", "Ariza"), P("Звонок, сообщение или форма на сайте. Перезвоним и договоримся о замере.", "Qo‘ng‘iroq, xabar yoki saytdagi forma. Qo‘ng‘iroq qilib, o‘lchovni kelishamiz.")],
    [P("Замер и проект", "O‘lchov va loyiha"), P("Замерщик приезжает с образцами, дизайнер рисует проект под ваши стены.", "O‘lchovchi namunalar bilan keladi, dizayner devorlaringizga moslab loyiha chizadi.")],
    [P("Производство", "Ishlab chiqarish"), P("Делаем по проекту и всё проверяем перед отправкой.", "Loyiha bo‘yicha yasaymiz va jo‘natishdan oldin hammasini tekshiramiz.")],
    [P("Доставка и монтаж", "Yetkazish va o‘rnatish"), P("Привозим, поднимаем на этаж и собираем на месте.", "Olib kelamiz, qavatga ko‘taramiz va joyida yig‘amiz.")],
    [P("Готово", "Tayyor"), P("Проверяем вместе с вами, как всё работает, и убираем за собой.", "Hammasi qanday ishlashini siz bilan tekshiramiz va ortimizdan tozalaymiz.")],
  ],
  ours: P("Предложение DevUz Studio", "DevUz Studio taklifi"),
  calcKick: P("Расчёт кухни", "Oshxona hisobi"),
  calcH: P("Сколько метров будет ваша кухня", "Oshxonangiz necha metr bo‘ladi"),
  plan: P("Планировка", "Rejalashtirish"),
  lay: { line: P("Прямая", "To‘g‘ri"), corner: P("Угловая", "Burchakli"), u: P("П-образная", "P shaklida"), island: P("С островом", "Orolli") },
  walls: { a: P("Основная стена", "Asosiy devor"), b: P("Боковая стена", "Yon devor"), c: P("Вторая боковая", "Ikkinchi yon devor"), i: P("Остров", "Orol") },
  cm: P("см", "sm"),
  meters: P("погонных метра", "pogon metr"),
  calcP: P("Цена метра зависит от материала, фурнитуры и столешницы, поэтому её считаем под вас. Отправьте размеры: менеджер назовёт стоимость.", "Metr narxi material, furnitura va stoleshnitsaga bog‘liq, shuning uchun uni sizga moslab hisoblaymiz. O‘lchamlarni yuboring: menejer narxini aytadi."),
  calcOwn: P("Назовёте цену за метр, и расчёт сразу покажет сумму.", "Metr narxini aytsangiz, hisob darhol summani ko‘rsatadi."),
  sendSizes: P("Отправить размеры", "O‘lchamlarni yuborish"),
  toForm: P("В заявку на замер", "O‘lchov arizasiga"),
  aboutKick: P("О компании", "Kompaniya haqida"),
  aboutH: P("Делаем мебель под ваши размеры", "Mebelni o‘lchamlaringizga moslab yasaymiz"),
  showKick: P("Где нас найти", "Bizni qayerdan topasiz"),
  showH: P("Приезжайте посмотреть образцы", "Namunalarni ko‘rgani keling"),
  samplesH: P("Образцы привезём на замер", "Namunalarni o‘lchovga olib kelamiz"),
  route: P("Проложить маршрут", "Yo‘nalish olish"),
  whyKick: P("Почему мы", "Nega biz"),
  flowKick: P("Заявка с сайта", "Saytdan ariza"),
  flowH: P("Так заявка придёт вам в Telegram", "Ariza sizga Telegramda shunday keladi"),
  flowLead: P("Покупатель оставляет телефон и размеры, менеджеру сразу приходит сообщение.", "Xaridor telefon va o‘lchamlarni qoldiradi, menejerga darhol xabar keladi."),
  demo: P("демо-данные", "demo-ma’lumot"),
  demoTitle: P("Новая заявка на замер", "O‘lchov uchun yangi ariza"),
  demoWho: P("Покупатель", "Xaridor"),
  demoWhat: P("Что нужно", "Nima kerak"),
  demoArea: P("Район", "Mahalla"),
  demoNear: P("Ориентир", "Mo‘ljal"),
  demoShop: P("магазин «[[t:1]]»", "«[[t:1]]» do‘koni"),
  zamerLabel: P("Заявка на замер", "O‘lchov uchun ariza"),
  zamerKick: P("Замер", "O‘lchov"),
  zamerH: P("Пригласите замерщика", "O‘lchovchini taklif qiling"),
  zamerSub: P("Приедет с образцами материалов и сделает замер. Нужен только телефон: перезвоним и согласуем дату и время.", "Material namunalari bilan kelib o‘lchaydi. Faqat telefon kerak: qo‘ng‘iroq qilib, sana va vaqtni kelishamiz."),
  noWait: P("Не хотите ждать? Звоните:", "Kutishni istamaysizmi? Qo‘ng‘iroq qiling:"),
  panelLead: P("Оставьте телефон: перезвоним и согласуем дату и время визита замерщика.", "Telefon qoldiring: qo‘ng‘iroq qilib, o‘lchovchi kelish sanasi va vaqtini kelishamiz."),
  fName: P("Как к вам обращаться", "Ismingiz"),
  name: P("Имя", "Ism"),
  phone: P("Телефон", "Telefon"),
  what: P("Что нужно", "Nima kerak"),
  when: P("Когда удобно", "Qachon qulay"),
  weekdays: P("В будни", "Ish kunlari"),
  weekend: P("В выходные", "Dam olish kunlari"),
  other: P("Другое", "Boshqa"),
  defaults: [P("Кухня", "Oshxona"), P("Шкаф", "Shkaf"), P("Гардеробная", "Garderob")],
  needPhone: P("Оставьте телефон: без него менеджеру некуда перезвонить.", "Telefon qoldiring: usiz menejer qo‘ng‘iroq qila olmaydi."),
  okH: P("Заявка собрана", "Ariza tayyor"),
  open: P("Открыть чат", "Chatni ochish"),
  toastFor: P("Текст скопирован: вставьте его в чат", "Matn nusxalandi: uni chatga qo‘ying"),
  contacts: P("На связи", "Aloqada"),
  rights: P("Это макет: так может выглядеть главная страница компании. Название, услуги и контакты взяты из данных компании, расчёт кухни и блоки с пометкой «Предложение DevUz Studio» предлагаем мы. Кухня в сцене сборки нарисована кодом.", "Bu maket: kompaniyaning bosh sahifasi shunday ko‘rinishi mumkin. Nomi, xizmatlar va kontaktlar kompaniya ma’lumotlaridan olingan, oshxona hisobi va «DevUz Studio taklifi» belgisi bor bloklarni biz taklif qilyapmiz. Yig‘ish sahnasidagi oshxona kod bilan chizilgan."),
  mockup: P("Макет принадлежит DevUz Studio. Использовать его можно только по договору:", "Maket DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:"),
  terms: P("условия использования", "foydalanish shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  toMain: P("К содержанию", "Asosiy qismga"),
  desc: P("Мебель на заказ: замер, проект, производство, доставка и сборка. Расчёт кухни и заявка на замер онлайн.", "Buyurtma asosida mebel: o‘lchov, loyiha, ishlab chiqarish, yetkazish va yig‘ish. Oshxona hisobi va onlayn o‘lchov arizasi."),
  js: {
    ru: { hello: "Здравствуйте! Хочу мебель на заказ. Подскажите, сколько будет стоить и когда может приехать замерщик?", calcTg: "Здравствуйте! Хочу кухню: {lay}, {sizes}, всего {m} погонных метра. Сколько это будет стоить?", calcSize: "Размеры из расчёта: {lay}, {sizes}, {m} п. м.", lay: { line: "прямая", corner: "угловая", u: "П-образная", island: "с островом" }, cm: "см", island: "остров", formHead: "Заявка на замер с сайта", fName: "Имя", fPhone: "Телефон", fWhat: "Что нужно", fWhen: "Когда удобно", none: "не указано", ask: "Здравствуйте! Интересует: " },
    uz: { hello: "Assalomu alaykum! Buyurtma asosida mebel istayman. Narxi qancha bo‘ladi va o‘lchovchi qachon kela oladi?", calcTg: "Assalomu alaykum! Oshxona istayman: {lay}, {sizes}, jami {m} pogon metr. Narxi qancha bo‘ladi?", calcSize: "Hisobdagi o‘lchamlar: {lay}, {sizes}, {m} p. m.", lay: { line: "to‘g‘ri", corner: "burchakli", u: "P shaklida", island: "orolli" }, cm: "sm", island: "orol", formHead: "Saytdan o‘lchov uchun ariza", fName: "Ism", fPhone: "Telefon", fWhat: "Nima kerak", fWhen: "Qachon qulay", none: "ko‘rsatilmagan", ask: "Assalomu alaykum! Qiziqtiradi: " },
  },
} as const;

/* Иконки — те же, что у vTashkente. */
const I = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4 2-15Z"/><path d="m9 13 9-6"/>'),
  wa: I('<path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z"/><path d="M9.2 8.6c.3 2.9 2.4 5.2 5.4 5.9l1.2-1.3-1.8-1-1 .8c-1-.4-1.9-1.3-2.4-2.4l.8-1-1-1.8z"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  ruler: I('<path d="m3 17 14-14 4 4L7 21Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  menu: I('<path d="M4 8h16M4 16h16"/>'),
  check: I('<path d="m5 12.5 4.5 4.5L19 7"/>'),
  draw: I('<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13 7 4 4"/>'),
  saw: I('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'),
  truck: I('<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
  chat: I('<path d="M4 5h16v11H9l-5 4Z"/><path d="M8 10h8M8 13h5"/>'),
  insta: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>'),
};
const STEP_ICONS = [ICON.chat, ICON.draw, ICON.saw, ICON.truck, ICON.check];

/**
 * Оранжевый vTashkente — в цвет бренда клиента. Переменные — в hsl: так их
 * сдвигает отпечаток (lib/proto/stamp). Тёмный тёплый фон макета остаётся:
 * на нём любая мебель смотрится. Нет цвета — их же оранжевый тон.
 */
function palette(color: string | null): string {
  const hex = brandColor(color);
  const [h, s0, l0] = hex ? hexToHsl(hex) : [11, 77, 51];
  const s = Math.min(Math.max(s0, 40), 85);
  const l = Math.min(Math.max(l0, 42), 58);
  return [
    `--or-rgb:${rgbOf(h, s, l)}`,
    `--or:hsl(${h} ${s}% ${l}%)`,
    `--orb:hsl(${h} ${s}% ${l - 4}%)`,
    `--orh:hsl(${h} ${s}% ${l - 9}%)`,
  ].join(";");
}

const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
const two = (n: number) => String(n).padStart(2, "0");

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/build, normalizeSite). */
export function mebelHtml(site: InstantSite): string {
  const l: InstantLocale = site.locale;
  const t = (p: Pair) => p[l];
  const name = esc(site.name);
  const tel = telHref(site.phone);
  const tg = handleOf(site.telegram);
  const wa = waHref(site.whatsapp);
  const ig = handleOf(site.instagram);
  const logo = imageUrl(site.logo);
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u)).slice(0, LIMITS.photos);
  const services = site.services.slice(0, 9);
  const perks = site.perks.slice(0, LIMITS.perks);
  const hello = C.js[l].hello;

  /** Чат компании: Telegram → WhatsApp; текст уже в ссылке. Нет — звонок. */
  const chat = tg ? `https://t.me/${tg}` : wa;
  const chatWith = (text: string) => (tg ? `https://t.me/${tg}?text=${encodeURIComponent(text)}` : wa ? `${wa}?text=${encodeURIComponent(text)}` : tel ?? "#zamer");
  const chatIcon = tg ? ICON.tg : wa ? ICON.wa : ICON.phone;
  const chatBtn = (cls: string, label: string, text: string) =>
    `<a class="btn ${cls}" href="${esc(chatWith(text))}"${chat ? ` data-tg="${esc(text)}" target="_blank" rel="noopener"` : ""}>${chatIcon}<span>${label}</span></a>`;
  const zamerBtn = (cls: string, label: string) => `<button type="button" class="btn ${cls}" data-zamer>${ICON.ruler}<span>${label}</span></button>`;

  // Фото: свои — везде; нет — нейтральные фото ниши, у каждого места своё.
  const pic = (k: number) => (own.length ? own[k % own.length] : MEBEL_PHOTOS[k % MEBEL_PHOTOS.length]);
  const srcset = (src: string) => (own.length ? "" : ` srcset="${src.replace("-1200", "-900")} 900w, ${src} 1200w"`);
  const heroPics = own.length ? own.slice(0, 4) : MEBEL_PHOTOS.slice(0, 3);
  const heroNames = own.length ? heroPics.map(() => site.name) : STOCK_HERO.map((x) => x[l]);

  const nav: [string, Pair, number][] = [
    ["sborka", C.nav.sborka, 0],
    ...(services.length ? [["raboty", C.nav.raboty, 1] as [string, Pair, number]] : []),
    ["zakaz", C.nav.zakaz, 2],
    ["doverie", C.nav.doverie, 3],
    ["zamer", C.nav.zamer, 4],
  ];
  const mark = logo
    ? `<img src="${esc(logo)}" alt="${name}" referrerpolicy="no-referrer" onerror="this.remove()"><b class="lt">${name}</b>`
    : `<b class="lt">${name}</b>`;

  const header = `<header class="top" id="top"><div class="top-in">
<a class="logo im-logo" href="#hero" aria-label="${name}">${mark}</a>
<nav class="nav" aria-label="${t(C.sections)}">${nav.map(([id, n]) => `<a href="#${id}">${t(n)}</a>`).join("")}</nav>
<div class="top-r">${tel ? `<a class="top-ph" href="${esc(tel)}">${esc(site.phone ?? "")}</a>` : ""}
${zamerBtn("btn-or btn-sm top-cta", t(C.zamer))}
<button type="button" class="ic-btn" id="menu-btn" aria-expanded="false" aria-controls="menu" aria-label="${t(C.menu)}">${ICON.menu}</button></div>
</div></header>`;

  const menu = `<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="${t(C.menu)}" hidden>
<div class="mn-bgs" aria-hidden="true">${nav.map(([, , k], i) => `<img class="mn-bg${i === 0 ? " on" : ""}" src="${esc(pic(k))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`).join("")}<div class="mn-shade"></div></div>
<button type="button" class="ic-btn mn-x" data-close aria-label="${t(C.close)}">${ICON.close}</button>
<nav class="mn-list" aria-label="${t(C.sections)}">${nav.map(([id, n], i) => `<a class="mn-i" href="#${id}" data-i="${i}"><span class="mn-n im-n" data-n="${two(i + 1)}"></span><span class="mn-t">${t(n)}</span></a>`).join("")}</nav>
<div class="mn-side"><p class="cap">${name}</p><p>${[site.address, site.hours].filter(Boolean).map((x) => esc(x ?? "")).join("<br>")}</p>${tel ? `<p><a href="${esc(tel)}">${esc(site.phone ?? "")}</a></p>` : ""}${chat ? chatBtn("btn-line", tg ? "Telegram" : "WhatsApp", hello) : ""}</div>
</div>`;

  const chips = (services.length ? services.slice(0, 3).map((s) => s.name) : C.defaults.map(t)).concat(t(C.other));
  const form = (p: string) => {
    const chip = (group: string, label: string, on: boolean) =>
      `<label class="chip"><input type="radio" name="${p}-${group}" value="${esc(label)}"${on ? " checked" : ""}><span>${esc(label)}</span></label>`;
    return `<form class="zf" data-form novalidate>
<label class="fld"><span>${t(C.fName)}</span><input name="name" autocomplete="name" placeholder="${t(C.name)}"></label>
<label class="fld"><span>${t(C.phone)}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+" required></label>
<fieldset class="chips"><legend>${t(C.what)}</legend>${chips.map((c, i) => chip("what", c, i === 0)).join("")}</fieldset>
<fieldset class="chips"><legend>${t(C.when)}</legend>${chip("when", t(C.weekdays), true)}${chip("when", t(C.weekend), false)}</fieldset>
<p class="zf-size" data-size hidden></p>
<p class="zf-err" data-err role="alert" hidden>${t(C.needPhone)}</p>
<button class="btn btn-or zf-go" type="submit">${ICON.ruler}<span>${t(C.zamer)}</span></button>
<p class="zf-note">${l === "uz" ? `Bu maket: ariza hech qayerga ketmaydi. Ishchi saytda u darhol ${name} menejeriga Telegramda keladi.` : `Это макет: заявка никуда не уходит. На рабочем сайте она сразу придёт менеджеру ${name} в Telegram.`}</p>
<div class="zf-ok" data-ok hidden><p class="zf-ok-h">${ICON.check}<span>${t(C.okH)}</span></p><p>${l === "uz" ? `Maketda u shu yerda qoladi. Menejerda qanday ko‘rinishini tekshirish uchun uni ${name} chatiga yuboring: matn allaqachon nusxalangan.` : `В макете она здесь и останется. Чтобы проверить, как она выглядит у менеджера, отправьте её в чат ${name}: текст уже скопирован.`}</p><pre class="zf-sum" data-sum></pre>${chat ? `<a class="btn btn-line" href="${esc(chat)}" data-tg-form target="_blank" rel="noopener">${chatIcon}<span>${t(C.open)}</span></a>` : tel ? `<a class="btn btn-line" href="${esc(tel)}">${ICON.phone}<span>${t(C.callUs)}</span></a>` : ""}</div>
</form>`;
  };

  const panel = `<div class="pn-back" id="pn-back" hidden></div>
<aside class="panel" id="panel" role="dialog" aria-modal="true" aria-labelledby="panel-h" hidden>
<div class="pn-top"><h2 id="panel-h">${t(C.zamerH)}</h2><button type="button" class="ic-btn" data-close aria-label="${t(C.close)}">${ICON.close}</button></div>
<p class="pn-lead">${t(C.panelLead)}</p>
${form("p")}
</aside>`;

  // 1. Первый экран: фото сменяют друг друга, слово в плашке перебирается.
  const words = C.words[l];
  const h1 = [site.name, ...C.h1[l]];
  const facts = perks.slice(0, 3);
  const askLabel = tg ? C.askTg : wa ? C.askWa : C.callUs;
  const hero = `<section class="hs hero" id="hero" aria-label="${t(C.firstScreen)}">
<div class="hr-media" aria-hidden="true">${heroPics.map((src, i) => `<img class="hr-img${i === 0 ? " on" : ""}" src="${esc(src)}"${srcset(src)} sizes="100vw" alt="" width="1200" height="900"${i ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async" referrerpolicy="no-referrer">`).join("")}<div class="hr-shade"></div></div>
<div class="hr-in">
<p class="kicker rise" style="--d:0ms">${esc(site.tagline ?? (site.city ? `${t(C.kind)} · ${site.city}` : t(C.kind)))}</p>
<p class="hr-chip rise" style="--d:80ms" aria-hidden="true"><span class="hr-roll">${words.map((w, i) => `<b${i === 0 ? ' class="on"' : ""}>${w}</b>`).join("")}</span></p>
<h1 class="hr-h">${h1.map((x) => `<span class="ln"><span>${esc(x)}</span></span>`).join("")}</h1>
<p class="hr-lead rise" style="--d:360ms">${site.about ? esc(site.about) : t(C.lead)}</p>
<div class="hr-cta rise" style="--d:440ms">${zamerBtn("btn-or btn-lg", t(C.zamer))}${chat ? chatBtn("btn-glass btn-lg", t(askLabel), hello) : tel ? `<a class="btn btn-glass btn-lg" href="${esc(tel)}">${ICON.phone}<span>${esc(site.phone ?? "")}</span></a>` : ""}</div>
</div>
${facts.length ? `<ul class="hr-facts im-facts rise" style="--d:560ms">${facts.map((f) => `<li><span>${esc(f)}</span></li>`).join("")}</ul>` : ""}
<div class="hr-now" aria-live="polite"><span class="hr-num"><b id="hr-i"></b><span class="im-n" data-n=" / ${two(heroPics.length)}"></span></span><span class="hr-name" id="hr-name">${esc(heroNames[0])}</span><span class="hr-bars">${heroPics.map((_, i) => `<i${i === 0 ? ' class="on"' : ""}></i>`).join("")}</span></div>
<a class="hr-down" href="#sborka"><span>${t(C.down)}</span><i aria-hidden="true"></i></a>
</section>`;

  // 2. Сборка кухни по прокрутке — рисунок кодом (assembly.js vTashkente).
  const assembly = `<section class="hs asm" id="sborka" aria-label="${t(C.asmLabel)}">
<div class="asm-pin">
<canvas class="asm-cv" aria-hidden="true" data-mm="${l === "uz" ? "mm" : "мм"}"></canvas>
<div class="asm-txt">
<p class="kicker">${t(C.asmKick)}</p>
<h2 class="asm-h">${t(C.asmH)}</h2>
<ol class="asm-steps">${C.asm.map(([h, p], i) => `<li${i === 0 ? ' class="on"' : ""}><span class="asm-n im-n" data-n="${two(i + 1)}"></span><div><b>${t(h)}</b><p>${t(p)}</p></div></li>`).join("")}</ol>
</div>
<div class="asm-bar" aria-hidden="true"><i></i></div>
<p class="asm-note">${t(C.asmNote)}</p>
</div>
</section>`;

  // 3. Лента вбок: услуги компании большими кадрами.
  const works = services.length
    ? `<section class="hs works" id="raboty" aria-label="${t(C.worksKick)}">
<div class="wk-pin">
<div class="wk-head"><p class="kicker">${t(C.worksKick)}</p><h2>${t(C.worksH)}</h2><p class="wk-count"><b id="wk-i"></b><span class="im-n" data-n=" / ${two(services.length)}"></span></p></div>
<div class="wk-track" id="wk-track">${services
        .map((s, i) => {
          const src = pic(i);
          return `<figure class="wk"><div class="wk-pic"><img src="${esc(src)}"${srcset(src)} sizes="(min-width: 900px) 46vw, 84vw" alt="${esc(s.name)}" width="1200" height="900" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div><figcaption><span class="wk-n im-n" data-n="${two(i + 1)}"></span><b>${esc(s.name)}</b><span class="im-pr">${s.price ? esc(s.price) : t(C.priceAsk)}</span>${chat ? `<a href="${esc(chatWith(C.js[l].ask + s.name))}" target="_blank" rel="noopener">${chatIcon}${t(C.discuss)}</a>` : ""}</figcaption></figure>`;
        })
        .join("")}
<div class="wk wk-end"><p>${t(C.worksEnd)}</p>${chat ? chatBtn("btn-or", t(C.getCatalog), hello) : zamerBtn("btn-or", t(C.zamer))}${own.length ? "" : `<p class="im-stock">${t(C.stock)}</p>`}</div>
</div>
<div class="wk-bar" aria-hidden="true"><i></i></div>
</div>
</section>`
    : "";

  // 4. Как заказать: шаги, бегущая строка и расчёт метров кухни.
  const range = (id: "a" | "b" | "c" | "i", min: number, max: number, val: number) =>
    `<label class="rg" data-wall="${id}"><span>${t(C.walls[id])}</span><input type="range" min="${min}" max="${max}" step="10" value="${val}" data-r="${id}"><output class="num" data-o="${id}"></output><small>${t(C.cm)}</small></label>`;
  const lays: ["line" | "corner" | "u" | "island", string][] = [
    ["line", "M8 10h48v8H8z"],
    ["corner", "M8 10h48v8H16v34H8z"],
    ["u", "M8 10h48v42h-8V18H16v34H8z"],
    ["island", "M8 10h48v8H8zM18 34h28v10H18z"],
  ];
  const order = `<section class="hs order" id="zakaz" aria-label="${t(C.orderKick)}">
<div class="mq" aria-hidden="true"><div class="mq-in">${Array(2).fill(C.marquee[l].map((w) => `<span>${w}</span><i></i>`).join("")).join("")}</div></div>
<div class="wrap">
<div class="od-head"><p class="kicker">${t(C.orderKick)}</p><h2>${t(C.orderH)}</h2></div>
<ol class="od-steps" id="od-steps">${C.steps.map(([h, p], i) => `<li style="--i:${i}"><span class="od-ic">${STEP_ICONS[i]}</span><span class="od-n im-n" data-n="${two(i + 1)}"></span><b>${t(h)}</b><p>${t(p)}</p></li>`).join("")}</ol>
<div class="calc" id="calc">
<div class="calc-l">
<p class="kicker">${t(C.calcKick)} <span class="ours">${t(C.ours)}</span></p>
<h3>${t(C.calcH)}</h3>
<div class="lay" role="radiogroup" aria-label="${t(C.plan)}">${lays.map(([id, d], i) => `<label class="lay-i"><input type="radio" name="lay" value="${id}"${i === 1 ? " checked" : ""}><svg viewBox="0 0 64 60" aria-hidden="true"><path d="${d}"/></svg><span>${t(C.lay[id])}</span></label>`).join("")}</div>
${range("a", 150, 600, 320)}${range("b", 100, 400, 210)}${range("c", 100, 400, 210)}${range("i", 100, 300, 180)}
</div>
<div class="calc-r">
<svg class="plan" id="plan" viewBox="0 0 320 240" aria-hidden="true"><g class="plan-grid"></g><g class="plan-k"></g></svg>
<p class="calc-m"><b class="num" id="calc-m"></b><span>${t(C.meters)}</span></p>
<p class="calc-p">${t(C.calcP)}</p><p class="calc-p calc-own">${t(C.calcOwn)}</p>
<div class="calc-btns"><a class="btn btn-or" href="${esc(chat ?? tel ?? "#zamer")}" id="calc-tg" data-tg=""${chat ? ' target="_blank" rel="noopener"' : ""}>${chatIcon}<span>${t(C.sendSizes)}</span></a><button type="button" class="btn btn-line" id="calc-z">${ICON.ruler}<span>${t(C.toForm)}</span></button></div>
</div>
</div>
</div>
</section>`;

  // 5. О компании и шоу-рум: два кадра с параллаксом, «почему мы» и пример заявки.
  const map = site.address ? `https://yandex.uz/maps/?text=${encodeURIComponent(site.address)}` : null;
  const fig = (k: number, body: string) => {
    const src = pic(k);
    return `<figure class="tr-p" data-par-box><img data-par=".08" src="${esc(src)}"${srcset(src)} sizes="(min-width: 900px) 50vw, 100vw" alt="" width="1200" height="900" loading="lazy" decoding="async" referrerpolicy="no-referrer"><figcaption>${body}</figcaption></figure>`;
  };
  const demoRows: [Pair, string][] = [
    [C.demoWho, l === "uz" ? "Jasur" : "Жасур"],
    [C.demoWhat, chips[0]],
    [C.demoArea, "[[t:0]]"],
    [C.demoNear, t(C.demoShop)],
  ];
  const trust = `<section class="hs trust" id="doverie" aria-label="${t(C.aboutKick)}">
<div class="tr-duo">
${fig(3, `<p class="kicker">${t(C.aboutKick)}</p><h2>${t(C.aboutH)}</h2>${site.about ? `<p>${esc(site.about)}</p>` : `<p>${name}</p>`}`)}
${fig(4, site.address ? `<p class="kicker">${t(C.showKick)}</p><h2>${t(C.showH)}</h2><p>${esc(site.address)}${site.hours ? `, ${esc(site.hours)}` : ""}</p>${map ? `<a class="lnk" href="${esc(map)}" target="_blank" rel="noopener">${ICON.pin}${t(C.route)}</a>` : ""}` : `<p class="kicker">${t(C.showKick)}</p><h2>${t(C.samplesH)}</h2>${site.hours ? `<p>${esc(site.hours)}</p>` : ""}`)}
</div>
<div class="wrap">
${own.length ? "" : `<p class="im-stock">${t(C.stock)}</p>`}
${perks.length ? `<div class="im-why"><p class="kicker">${t(C.whyKick)}</p><ul>${perks.map((x) => `<li>${ICON.check}<span>${esc(x)}</span></li>`).join("")}</ul></div>` : ""}
<div class="im-flow"><div><p class="kicker">${t(C.flowKick)} <span class="ours">${t(C.ours)}</span></p><h2>${t(C.flowH)}</h2><p class="sub">${t(C.flowLead)}</p></div>
<div class="tgc"><div class="tgc-h">${ICON.tg}<b>${t(C.demoTitle)}</b><small>${t(C.demo)}</small></div><dl>${demoRows.map(([k, v]) => `<dt>${t(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div></div>
</div>
</section>`;

  // 6. Заявка на замер.
  const zamer = `<section class="hs zamer" id="zamer" aria-label="${t(C.zamerLabel)}">
<div class="zm-bg" aria-hidden="true"><img src="${esc(pic(4))}"${srcset(pic(4))} sizes="100vw" alt="" width="1200" height="900" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div>
<div class="zm-in">
<div class="zm-l"><p class="kicker">${t(C.zamerKick)}</p><h2>${t(C.zamerH)}</h2><p class="sub">${t(C.zamerSub)}</p>${tel ? `<p class="zm-ph">${t(C.noWait)} <a href="${esc(tel)}">${esc(site.phone ?? "")}</a>${site.hours ? `<br><span>${esc(site.hours)}</span>` : ""}</p>` : ""}</div>
<div class="zm-card">${form("s")}</div>
</div>
</section>`;

  const links = [
    tel ? `<li><a href="${esc(tel)}">${esc(site.phone ?? "")}</a></li>` : "",
    tg ? `<li><a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">Telegram · @${esc(tg)}</a></li>` : "",
    wa ? `<li><a href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a></li>` : "",
    ig ? `<li><a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">Instagram · @${esc(ig)}</a></li>` : "",
    site.hours ? `<li>${esc(site.hours)}</li>` : "",
  ].join("");
  const footer = `<footer class="foot"><div class="wrap">
<div class="ft-cols">
<div><p class="ft-name">${name}</p><p>${services.length ? esc(services.slice(0, 5).map((s) => s.name).join(", ")) : t(C.kind)}</p></div>
${links ? `<div><b>${t(C.contacts)}</b><ul>${links}</ul></div>` : ""}
${site.address ? `<div><b>${t(C.showKick)}</b><ul><li>${esc(site.address)}</li>${map ? `<li><a href="${esc(map)}" target="_blank" rel="noopener">${t(C.route)}</a></li>` : ""}</ul></div>` : ""}
</div>
<div class="rights"><p>${t(C.rights)}</p><p>${t(C.mockup)} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${t(C.terms)}</a></p><p>${t(C.source)} ${esc(site.source)}</p></div>
</div></footer>`;

  const dock = `<div class="dock" id="dock">${zamerBtn("btn-or", t(C.zamer))}${chat ? `<a class="btn btn-glass dock-tg" href="${esc(chatWith(hello))}" data-tg="${esc(hello)}" target="_blank" rel="noopener">${chatIcon}<span class="vh">${tg ? "Telegram" : "WhatsApp"}</span></a>` : tel ? `<a class="btn btn-glass dock-tg" href="${esc(tel)}">${ICON.phone}<span class="vh">${t(C.callUs)}</span></a>` : ""}</div>`;

  const js = C.js[l];
  const i18n = { ...js, lang: l, hero: heroNames, formHead: `${js.formHead} ${site.name}` };

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.kind).toLowerCase()}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#121110">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;700&family=Unbounded:wght@400;700&display=swap">
<script>(function(){var r=document.documentElement;r.classList.add('js');r.classList.add('intro-off');try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)r.classList.add('rm')}catch(e){}})()</script>
<style>${assets.css}
:root{${palette(site.color)}}
.im-logo{display:flex;align-items:center;gap:10px;max-width:56vw;text-decoration:none}
.im-logo img{height:32px;width:auto;max-width:120px;object-fit:contain}
.im-logo .lt{font:700 18px/1.1 var(--disp);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hr-h .ln>span{overflow-wrap:anywhere}
.im-facts li{max-width:32ch}
.im-n::before{content:attr(data-n)}
.wk figcaption{flex-wrap:wrap;row-gap:4px}
.im-pr{order:9;flex-basis:100%;color:var(--ink2);font-size:14px}
.im-stock{margin:24px 0 0;color:var(--mut);font-size:14px}
.ft-name{font:700 20px/1.2 var(--disp);margin-bottom:12px}
.im-why{margin:48px 0 0}
.im-why ul{display:grid;gap:12px;margin:16px 0 0}
@media(min-width:900px){.im-why ul{grid-template-columns:1fr 1fr}}
.im-why li{display:flex;gap:12px;align-items:flex-start}
.im-why svg{width:22px;height:22px;flex:none;color:var(--or)}
.im-flow{display:grid;gap:32px;align-items:center;margin:64px 0 0}
@media(min-width:900px){.im-flow{grid-template-columns:1fr 1fr}}
.im-flow h2{margin:12px 0}
.tgc{border-radius:var(--r);padding:20px;max-width:420px;width:100%;justify-self:center;background:var(--bg3);border:1px solid var(--line);box-shadow:var(--sh2)}
.tgc-h{display:flex;align-items:center;gap:10px}
.tgc-h svg{width:26px;height:26px;color:var(--or)}
.tgc-h small{margin-left:auto;font-size:12px;color:var(--mut);padding:4px 10px;border-radius:999px;background:var(--bg2)}
.tgc dl{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin:16px 0 0}
.tgc dt{color:var(--mut)}
.tgc dd{margin:0;font-weight:700;overflow-wrap:anywhere}</style>
</head>
<body data-lang="${l}">
${dzIntroSolo(l)}
<a class="skip" href="#sborka">${t(C.toMain)}</a>
${header}
<main id="main">
${hero}
${assembly}
${works}
${order}
${trust}
${zamer}
</main>
${footer}
${dock}
${menu}
${panel}
<p class="toast" id="toast" role="status" hidden>${t(C.toastFor)} ${name}</p>
<script type="application/json" id="im-i18n">${json(i18n)}</script>
<script>(function(){['hr-i','wk-i'].forEach(function(id){var e=document.getElementById(id);if(e&&!e.textContent)e.textContent='0'+1});var b=document.getElementById('dzi'),n=0;function on(){document.body.classList.add('hero-on');document.dispatchEvent(new Event('vt:hero'))}
if(!b||!b.isConnected){on();return}var k=setInterval(function(){n++;if(!b.isConnected||b.classList.contains('done')||n>60){clearInterval(k);on()}},200)})()</script>
<script>
${assets.asm}</script>
<script>
${assets.js}</script>
</body>
</html>`;
}
