/**
 * Шаблон «Медцентр» — главная нашего макета Shox International Hospital
 * (scripts/protos/shox-hospital/gen.mjs, home), переодетая под клиента.
 *
 * Владелец, 10.11.2026: «Просто бери наши макеты и лепи логотипы, цены и
 * контактные данные клиента». Отсюда устройство: стили и скрипт Shox — те
 * же файлы (content/proto-instant/shox-assets.json, пишет
 * scripts/protos/instant/shox-assets.mjs), разметка — те же блоки и
 * классы: шапка, направления бенто-сеткой с записью по нажатию, тёмный
 * блок о клинике, врачи с фильтром и поиском, запись в три шага,
 * прейскурант с поиском, чек-ап, связь, финальный призыв, подвал и кнопка
 * записи под пальцем.
 *
 * Что от Shox не берётся, потому что это про их клинику, а не дизайн:
 * 3D-пролёт по фото их врачей (вместо него — пролёт ниши на сцене Nek, как
 * у стоматологии), их цифры, роботохирургия, филиалы, отзывы и страница для
 * иностранцев, скидка за 5 секунд и конструктор цены DevUz. Нет данных
 * клиента — блока нет.
 *
 * Шаблонные слова без цифр: каждое число на странице — из данных клиента
 * (lib/proto/instant/check).
 */
import assets from "@/content/proto-instant/shox-assets.json" with { type: "json" };
import nek from "@/content/proto-instant/nek-assets.json" with { type: "json" };
import media from "@/content/proto-instant/medcentr-media.json" with { type: "json" };
import { PROTO_BASE } from "@/lib/proto/pages";
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { LIMITS, siteLocaleOf, type InstantLocale, type InstantSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";
import { offDaysOf, rgbOf, slotsOf } from "@/lib/proto/instant/dental";

/** Пролёт ниши и нейтральные фото: без людей и чужих брендов (scripts/protos/instant/scene.py). */
const IMG = "/protos/_niche/medcentr";
export const MEDCENTR_PHOTOS = [`${IMG}/n1.webp`, `${IMG}/n2.webp`, `${IMG}/n3.webp`, `${IMG}/n4.webp`] as const;

import { P, htmlLang, rtlHead, sayIn, type Pair } from "@/lib/proto/instant/tr";
import { MEDCENTR_JS, MEDCENTR_TR } from "@/lib/proto/instant/tr/medcentr";

const C = {
  fly: P("Пролёт по клинике", "Klinika bo‘ylab parvoz"),
  flyKick: P("Макет DevUz Studio", "DevUz Studio maketi"),
  flySee: P("Смотреть сайт", "Saytni ko‘rish"),
  flyNote: P("Кадры для примера: клиника поставит свои фото.", "Kadrlar namuna uchun: klinika o‘z rasmlarini qo‘yadi."),
  scroll: P("Листайте", "Aylantiring"),
  ch2: [P("Светлый холл", "Yorug‘ zal"), P("и запись без очереди", "va navbatsiz yozilish")],
  ch4: [P("Диагностика", "Diagnostika"), P("в одном здании", "bitta binoda")],
  ch5: [P("Запись к врачу", "Shifokorga yozilish"), P("в три шага", "uch qadamda")],
  kind: P("Медицинский центр", "Tibbiyot markazi"),
  nav: [P("Направления", "Yo‘nalishlar"), P("Врачи", "Shifokorlar"), P("Цены", "Narxlar"), P("Контакты", "Kontaktlar")],
  sections: P("Разделы", "Bo‘limlar"),
  book: P("Записаться", "Yozilish"),
  bookDoc: P("Записаться к врачу", "Shifokorga yozilish"),
  h1: P("Запись к врачу <em>онлайн</em>", "Shifokorga <em>onlayn</em> yozilish"),
  h1Lead: P("Выберите направление, врача и время, а администратор подтвердит запись.", "Yo‘nalish, shifokor va vaqtni tanlang, administrator yozilishni tasdiqlaydi."),
  dirsKick: P("Направления", "Yo‘nalishlar"),
  dirsH: P("Что мы <em>лечим</em>", "Nimani <em>davolaymiz</em>"),
  dirsLead: P("Нажмите на направление, и откроется запись к его врачам.", "Yo‘nalishni bosing, uning shifokorlariga yozilish ochiladi."),
  interested: P("Интересует: ", "Qiziqtiradi: "),
  aboutKick: P("О клинике", "Klinika haqida"),
  aboutH: P("Почему выбирают <em>нас</em>", "Nega <em>bizni</em> tanlashadi"),
  ownPhotos: P("Фото с сайта клиники.", "Rasmlar klinika saytidan."),
  stockPhotos: P("Фото для примера: клиника поставит свои.", "Rasmlar namuna uchun: klinika o‘zinikini qo‘yadi."),
  docsKick: P("Врачи", "Shifokorlar"),
  docsH: P("Выберите <em>своего</em> врача", "<em>O‘z</em> shifokoringizni tanlang"),
  docsLead: P("Имена и специальности взяты с сайта клиники. Фото врачей клиника добавит в админке.", "Ism va mutaxassislik klinika saytidan olingan. Shifokorlar suratini klinika admin panelda qo‘shadi."),
  docSearch: P("Фамилия или специальность", "Familiya yoki mutaxassislik"),
  docFind: P("Поиск врача", "Shifokorni qidirish"),
  all: P("Все", "Barchasi"),
  dir: P("Направление", "Yo‘nalish"),
  noDoc: P("Такого врача не нашли. Позвоните нам, подскажем.", "Bunday shifokor topilmadi. Bizga qo‘ng‘iroq qiling, yordam beramiz."),
  bookKick: P("Онлайн-запись", "Onlayn yozilish"),
  bookH: P("Запись к врачу <em>в три шага</em>", "Shifokorga <em>uch qadamda</em> yozilish"),
  steps: [P("Направление", "Yo‘nalish"), P("Врач", "Shifokor"), P("День и время", "Kun va vaqt"), P("Контакты", "Kontaktlar")],
  slotsNote: P("Расписание в макете показано для примера. В рабочей версии свободные окна берутся из админки клиники.", "Maketdagi jadval namuna uchun. Ishchi versiyada bo‘sh vaqtlar klinika admin panelidan olinadi."),
  which: P("К какому специалисту?", "Qaysi mutaxassisga?"),
  pickDoc: P("Выберите врача", "Shifokorni tanlang"),
  when: P("Когда удобно?", "Qachon qulay?"),
  where: P("Куда подтвердить запись?", "Yozilishni qayerga tasdiqlaymiz?"),
  back: P("Назад", "Orqaga"),
  notSure: P("Не знаю, к кому", "Kimga borishni bilmayman"),
  name: P("Имя", "Ism"),
  phone: P("Телефон", "Telefon"),
  note: P("Комментарий (по желанию)", "Izoh (ixtiyoriy)"),
  needContact: P("Укажите имя и телефон, чтобы администратор подтвердил время.", "Ism va telefonni kiriting, administrator vaqtni shu raqam orqali tasdiqlaydi."),
  sendTg: P("Отправить в Telegram клиники", "Klinika Telegramiga yuborish"),
  sendWa: P("Отправить в WhatsApp клиники", "Klinika WhatsAppiga yuborish"),
  sendCall: P("Позвонить в клинику", "Klinikaga qo‘ng‘iroq"),
  sent: P("Текст заявки скопирован и открыт в чате клиники. В рабочей версии заявка сама попадает в журнал админки, а пациенту приходит подтверждение.", "Ariza matni nusxalandi va klinika chatida ochildi. Ishchi versiyada ariza o‘zi admin panel jurnaliga tushadi, bemorga esa tasdiq keladi."),
  flowKick: P("Запись с сайта", "Saytdan yozilish"),
  flowH: P("Так запись придёт <em>вам в Telegram</em>", "Yozuv sizga <em>Telegramda</em> shunday keladi"),
  flowLead: P("Пациент выбирает направление, врача и время. Клинике приходит сообщение, отвечаете в один клик.", "Bemor yo‘nalish, shifokor va vaqtni tanlaydi. Klinikaga xabar keladi, bir bosishda javob berasiz."),
  demo: P("демо-данные", "demo-ma’lumot"),
  demoTitle: P("Новая запись с сайта", "Saytdan yangi yozuv"),
  demoPatient: P("Пациент", "Bemor"),
  demoArea: P("Район", "Mahalla"),
  demoNear: P("Ориентир", "Mo‘ljal"),
  demoShop: P("магазин «[[t:1]]»", "«[[t:1]]» do‘koni"),
  priceKick: P("Прейскурант", "Narxlar ro‘yxati"),
  priceH: P("Найдите услугу и <em>узнайте цену</em>", "Xizmatni toping va <em>narxini bilib oling</em>"),
  priceLead: P("Цены клиника впишет в админке, а пока у услуги без цены кнопка задаёт вопрос администратору.", "Narxlarni klinika admin panelda kiritadi, hozircha narxi yo‘q xizmatda tugma administratorga savol beradi."),
  priceSearch: P("Поиск услуги", "Xizmatni qidirish"),
  pricePh: P("Например: УЗИ, кардиолог", "Masalan: UTT, kardiolog"),
  services: P("Услуги", "Xizmatlar"),
  priceAsk: P("цену назовёт администратор", "narxini administrator aytadi"),
  askPrice: P("Узнать цену", "Narxini bilish"),
  howMuch: P("Сколько стоит: ", "Narxi qancha: "),
  showAll: P("Показать все услуги", "Barcha xizmatlarni ko‘rsatish"),
  cuKick: P("Чек-ап", "Chek-ap"),
  cuH: P("Чек-ап <em>за один визит</em>", "<em>Bir tashrifda</em> chek-ap"),
  cuLead: P("Несколько врачей и обследования за один приход, в конце заключение и план.", "Bir kelishda bir nechta shifokor va tekshiruvlar, oxirida xulosa va reja."),
  ours: P("Наше предложение: состав программ определит клиника", "Bizning taklif: dasturlar tarkibini klinika belgilaydi"),
  cu: [
    { h: P("Базовый", "Bazaviy"), li: [P("Приём терапевта", "Terapevt qabuli"), P("Анализы крови", "Qon tahlillari"), P("УЗИ", "UTT"), P("Заключение и план", "Xulosa va reja")] },
    { h: P("Сердце и сосуды", "Yurak va qon tomirlar"), hot: true, li: [P("Приём кардиолога", "Kardiolog qabuli"), P("ЭКГ", "EKG"), P("УЗИ сердца", "Yurak UTT"), P("Заключение и план", "Xulosa va reja")] },
    { h: P("Женское здоровье", "Ayollar salomatligi"), li: [P("Приём гинеколога", "Ginekolog qabuli"), P("УЗИ", "UTT"), P("Анализы", "Tahlillar"), P("Заключение и план", "Xulosa va reja")] },
  ],
  cuPrice: P("Цену впишет клиника", "Narxni klinika kiritadi"),
  cuBook: P("Записаться на чек-ап", "Chek-apga yozilish"),
  cuAsk: P("Чек-ап «", "Chek-ap «"),
  msgH: P("Связаться <em>как удобно</em>", "<em>Qulay usulda</em> bog‘laning"),
  callUs: P("Позвонить", "Qo‘ng‘iroq qilish"),
  write: P("Написать", "Yozish"),
  route: P("Маршрут на карте", "Xaritada yo‘nalish"),
  findH: P("Ждём вас <em>на приём</em>", "Sizni <em>qabulda</em> kutamiz"),
  finalH: P("Запишитесь сейчас, <em>мы подтвердим время</em>", "Hozir yoziling, <em>vaqtni tasdiqlaymiz</em>"),
  footFollow: P("Мы в сети", "Biz ijtimoiy tarmoqlarda"),
  footDirs: P("Направления", "Yo‘nalishlar"),
  rights: P("Это макет: так может выглядеть новый сайт клиники. Название, услуги, врачи и контакты взяты из данных клиники, запись и чек-ап предлагаем мы.", "Bu maket: klinikaning yangi sayti shunday ko‘rinishi mumkin. Nomi, xizmatlar, shifokorlar va kontaktlar klinika ma’lumotlaridan olingan, yozilish va chek-apni biz taklif qilyapmiz."),
  mockup: P("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz qabul qilasiz:"),
  terms: P("условия макета", "maket shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  toMain: P("К содержанию", "Asosiy qismga"),
  title: P("медицинский центр", "tibbiyot markazi"),
  desc: P("Направления, врачи, цены и запись к врачу онлайн в три шага.", "Yo‘nalishlar, shifokorlar, narxlar va uch qadamda shifokorga onlayn yozilish."),
  js: {
    ru: { anyDoc: "Любой свободный врач", anyDocSub: "Подберёт администратор", anyDir: "Подскажите, к кому записаться", sumDir: "Направление", sumDoc: "Врач", sumTime: "Время", sumName: "Имя", sumTel: "Телефон", sumNote: "Комментарий", hello: "Здравствуйте! Хочу записаться на приём.", found: "Найдено: {n}", wd: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"], mo: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"] },
    uz: { anyDoc: "Istalgan bo‘sh shifokor", anyDocSub: "Administrator tanlaydi", anyDir: "Kimga yozilishni maslahat bering", sumDir: "Yo‘nalish", sumDoc: "Shifokor", sumTime: "Vaqt", sumName: "Ism", sumTel: "Telefon", sumNote: "Izoh", hello: "Assalomu alaykum! Qabulga yozilmoqchiman.", found: "Topildi: {n}", wd: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"], mo: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"] },
  },
} as const;

const I = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
/** Значки направлений — те же, что у Shox. */
const ICON = {
  brain: I('<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>'),
  bone: I('<path d="M8 16 16 8M6.5 18.5a2 2 0 1 1-2.8-2.8 2 2 0 1 1 2.8-2.8l1.5 1.5M17.5 5.5a2 2 0 1 1 2.8 2.8 2 2 0 1 1-2.8 2.8L16 9.6"/>'),
  clip: I('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 11h6M9 15h4"/>'),
  heart: I('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 11h2l1-2 2 4 1-2h2"/>'),
  scalpel: I('<path d="M4 20 15 9l3 3-6 6H4zM15 9l4-4 1 1-2 6"/>'),
  venus: I('<circle cx="12" cy="9" r="5"/><path d="M12 14v7M9 18h6"/>'),
  wave: I('<path d="M3 12h3l2-5 3 10 3-8 2 3h5"/>'),
  scan: I('<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="4"/>'),
  kidney: I('<path d="M15 4c3 0 5 3 5 7s-2 9-6 9c-3 0-3-3-3-5s2-2 2-4-3-2-3-4 2-3 5-3zM9 7c-3 0-5 2-5 5 0 2 1 4 3 4"/>'),
  lungs: I('<path d="M12 4v8M12 12l-2 2M12 12l2 2M9 7c-3 1-5 5-5 10 0 2 2 3 4 2l2-1V9M15 7c3 1 5 5 5 10 0 2-2 3-4 2l-2-1V9"/>'),
  drop: I('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
  child: I('<circle cx="12" cy="6" r="3"/><path d="M8 21v-6l-2-3M16 21v-6l2-3M8 12h8"/>'),
  ear: I('<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/><path d="M10 9a2 2 0 0 1 4 0c0 1-1 2-2 2"/>'),
  eye: I('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  shield: I('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="M9 12h6M12 9v6"/>'),
  tg: I('<path d="M21 4 3 11l6 2.5M21 4l-3.5 16-8.5-6.5M21 4 9 13.5V19l3-3.5"/>'),
  wa: I('<path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z"/><path d="M9.2 8.6c.3 2.9 2.4 5.2 5.4 5.9l1.2-1.3-1.8-1-1 .8c-1-.4-1.9-1.3-2.4-2.4l.8-1-1-1.8z"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  insta: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
};
type Icon = keyof typeof ICON;

/** Значок по словам направления: кардио — сердце, УЗИ — скан и так далее. */
const ICON_WORDS: [RegExp, Icon][] = [
  [/кардио|сердц|kardio|yurak/i, "heart"],
  [/невро|невр|мозг|nevro|asab/i, "brain"],
  [/узи|мрт|мскт|кт\b|рентген|диагност|utt|mrt|diagnos|rentgen/i, "scan"],
  [/хирур|операц|jarroh|operats/i, "scalpel"],
  [/гинек|женск|акушер|ginek|ayol/i, "venus"],
  [/педиатр|детск|ребён|pediatr|bola/i, "child"],
  [/лор|отоларинг|ухо|горл|lor\b|quloq/i, "ear"],
  [/офтальм|глаз|окулист|oftalm|ko‘z|ko'z/i, "eye"],
  [/ортопед|травм|сустав|позвон|ortoped|travm/i, "bone"],
  [/анализ|лаборатор|кров|tahlil|laborator|qon/i, "drop"],
  [/урол|нефро|почк|urolog|nefro|buyrak/i, "kidney"],
  [/пульмон|лёгк|легк|pulmon|o‘pka/i, "lungs"],
  [/экг|ээг|функциональ|ekg|eeg/i, "wave"],
  [/терапевт|приём|прием|консульт|terapevt|konsult/i, "clip"],
];
const iconOf = (name: string): Icon => ICON_WORDS.find(([re]) => re.test(name))?.[1] ?? "shield";

/** Первые пять букв слов: «Кардиолог» и «Кардиология» — одно направление. */
const stems = (s: string) => new Set((s.toLowerCase().match(/[\p{L}]{4,}/gu) ?? []).map((w) => w.slice(0, 5)));

/** Направление врача — услуга, с которой у его специальности общее слово. */
function dirOf(role: string | null, dirs: { id: string; name: string }[]): string {
  if (!role) return "any";
  const r = stems(role);
  return dirs.find((d) => [...stems(d.name)].some((w) => r.has(w)))?.id ?? "any";
}

function initials(name: string): string {
  const words = name.replace(/["«»'`]/g, " ").split(/\s+/).filter((w) => /\p{L}/u.test(w));
  return words.slice(0, 2).map((w) => [...w][0]?.toUpperCase() ?? "").join("");
}

/**
 * Фирменные цвета Shox (тёмно-фиолетовый и красный) — в цвет бренда клиента.
 * Переменные — в hsl: так их сдвигает отпечаток (lib/proto/stamp). Нет цвета
 * — синий медицинский тон.
 */
function palette(color: string | null): string {
  const hex = brandColor(color);
  const [h, s0, l0] = hex ? hexToHsl(hex) : [212, 62, 38];
  const s = Math.min(Math.max(s0, 30), 80);
  const l = Math.min(Math.max(l0, 26), 44);
  return [
    `--brand-rgb:${rgbOf(h, s, l)}`,
    `--brand2-rgb:${rgbOf(h, s, l + 10)}`,
    `--red-rgb:${rgbOf(h, Math.min(s + 8, 85), Math.min(l + 4, 48))}`,
    `--night-rgb:${rgbOf(h, 45, 12)}`,
    `--ink-rgb:${rgbOf(h, 45, 12)}`,
    `--brand:hsl(${h} ${s}% ${l}%)`,
    `--brand2:hsl(${h} ${s}% ${l + 10}%)`,
    `--red:hsl(${h} ${Math.min(s + 8, 85)}% ${Math.min(l + 4, 48)}%)`,
    `--red2:hsl(${h} ${Math.min(s + 8, 85)}% ${Math.max(l - 6, 20)}%)`,
    `--lav:hsl(${h} 45% 94%)`,
    `--lav2:hsl(${h} 70% 86%)`,
    `--night:hsl(${h} 45% 12%)`,
    `--night2:hsl(${h} 40% 18%)`,
    `--ink:hsl(${h} 45% 15%)`,
    `--ink2:hsl(${h} 18% 34%)`,
    `--bg:hsl(${h} 30% 97%)`,
    `--sf2:hsl(${h} 30% 95%)`,
    `--peach:hsl(${h} 70% 84%)`,
  ].join(";");
}

/** Куда уходит заявка: Telegram → WhatsApp. Нет — звонок. */
function goPrefix(site: InstantSite): string | null {
  const tg = handleOf(site.telegram);
  if (tg) return `https://t.me/${tg}?text=`;
  const wa = waHref(site.whatsapp);
  return wa ? `${wa}?text=` : null;
}

const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/build, normalizeSite). */
export function medcentrHtml(site: InstantSite): string {
  const l: InstantLocale = site.locale;
  const t = sayIn(MEDCENTR_TR, l);
  const js = l === "ru" || l === "uz" ? C.js[l] : MEDCENTR_JS[l];
  const name = esc(site.name);
  const tel = telHref(site.phone);
  const telDigits = tel ? tel.slice(4) : "";
  const tg = handleOf(site.telegram);
  const wa = waHref(site.whatsapp);
  const ig = handleOf(site.instagram);
  const go = goPrefix(site);
  const logo = imageUrl(site.logo);
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u)).slice(0, LIMITS.photos);
  const photos = own.length ? own : [...MEDCENTR_PHOTOS];
  const services = site.services.slice(0, LIMITS.services);
  const perks = site.perks.slice(0, LIMITS.perks);
  const dirs = services.map((s, i) => ({ id: `s${i}`, name: s.name }));
  const doctors = site.doctors.slice(0, LIMITS.doctors).map((d, i) => ({ ...d, s: `d${i}`, dir: dirOf(d.role, dirs), i: initials(d.name) }));
  const dirsWithDocs = dirs.filter((d) => doctors.some((x) => x.dir === d.id));
  const mark = logo ? `<img class="lg" src="${esc(logo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : `<span class="mk" aria-hidden="true">${ICON.shield}</span>`;
  const sendLabel = tg ? C.sendTg : wa ? C.sendWa : C.sendCall;
  const sendHref = go ? `${go}${encodeURIComponent(js.hello)}` : tel ?? "#zapis";

  const nav = [
    dirs.length ? `<a href="#napravleniya">${t(C.nav[0])}</a>` : "",
    doctors.length ? `<a href="#vrachi">${t(C.nav[1])}</a>` : "",
    services.length ? `<a href="#ceny">${t(C.nav[2])}</a>` : "",
    `<a href="#svyaz">${t(C.nav[3])}</a>`,
  ].join("");

  const header = `<header class="top"><div class="wrap">
<a class="logo" href="#top" aria-label="${name}">${mark}<b class="lt">${name}</b></a>
<nav class="nav" aria-label="${t(C.sections)}">${nav}</nav>
${tel ? `<a class="top-tel" href="${esc(tel)}">${esc(site.phone ?? "")}</a>` : ""}
<a class="btn btn-red btn-sm top-cta" href="#zapis">${ICON.cal}${t(C.book)}</a>
</div></header>`;

  // Пролёт по прокрутке — сцена первой страницы Nek на нейтральных кадрах медцентра.
  const fly = media.n > 1;
  const top2 = services.slice(0, 2).map((x) => x.name).join(", ");
  const chapters = [
    { at: 0.06, a: site.name, b: site.city ?? t(C.kind) },
    { at: 0.3, a: t(C.ch2[0]), b: t(C.ch2[1]) },
    { at: 0.52, a: top2 || t(C.kind), b: site.tagline ?? t(C.h1Lead).split(",")[0] },
    { at: 0.74, a: t(C.ch4[0]), b: t(C.ch4[1]) },
    { at: 0.94, a: t(C.ch5[0]), b: t(C.ch5[1]) },
  ];
  const pic = (k: number, lazy: boolean) =>
    `<picture><source media="(max-width: 899px)" srcset="${IMG}/k${k}-9.webp"><img src="${IMG}/k${k}-16.webp" width="1600" height="893" alt=""${lazy ? ' loading="lazy"' : ""}></picture>`;
  const flySec = fly
    ? `<section class="hs" id="flight" aria-label="${t(C.fly)}" data-dock-after><div class="hs-st">
<picture><source media="(max-width: 899px)" srcset="${IMG}/poster-9.webp"><img class="hs-a" src="${IMG}/poster-16.webp" width="1920" height="1080" alt="" fetchpriority="high"></picture>
<canvas aria-hidden="true"></canvas>
<video muted playsinline preload="none" disablepictureinpicture aria-hidden="true"></video>
<div class="hs-shade" aria-hidden="true"></div>
<div class="hs-sign" aria-hidden="true">${logo ? `<img src="${esc(logo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}<b>${name}</b></div>
<div class="hs-ch">${chapters
        .map((c, i) =>
          i === 0
            ? `<div class="cp first" data-cp="0"><span class="kick"><i></i>${t(C.flyKick)}</span><h1>${esc(c.a)} <em>${esc(c.b)}</em></h1></div>`
            : `<div class="cp" data-cp="${i}"><span class="kick"><i></i><span class="n">0${i + 1}</span></span><p class="cp-h">${esc(c.a)} <em>${esc(c.b)}</em></p></div>`,
        )
        .join("")}</div>
<div class="hs-end"><a class="btn btn-red" href="#top">${t(C.flySee)}${ICON.arrow}</a><small>${t(C.flyNote)}</small></div>
<div class="hs-load" id="hs-load" aria-hidden="true"><span id="hs-n">0</span>%<i id="hs-b"></i></div>
<div class="hs-hint" aria-hidden="true"><span>${t(C.scroll)}</span><i></i></div>
</div></section>
<section class="calm" aria-label="${t(C.fly)}"><div class="wrap">${chapters.map((c, i) => `<figure>${pic(i + 1, i > 0)}<figcaption>${esc(c.a)} ${esc(c.b)}</figcaption></figure>`).join("")}</div></section>`
    : "";
  const land = { root: PROTO_BASE, img: IMG, n: media.n, vn: media.vn, fps: media.fps, ch: chapters.map((c) => ({ at: c.at })) };

  const facts = [
    site.address ? `<li>${ICON.pin}<span>${esc(site.address)}</span></li>` : "",
    site.hours ? `<li>${ICON.cal}<span>${esc(site.hours)}</span></li>` : "",
  ].join("");
  const kick = site.tagline ?? (site.city ? `${t(C.kind)} · ${site.city}` : t(C.kind));
  const hero = `<section class="final hero-im" id="top"${fly ? "" : " data-dock-after"}><div class="wrap rv-in a-rise">
<span class="kicker" style="color:var(--lav2)"><i></i>${esc(kick)}</span>
<h1>${name}<br>${t(C.h1)}</h1>
<p>${site.about ? esc(site.about) : t(C.h1Lead)}</p>
<div class="fly-cta"><a class="btn btn-red" href="#zapis">${ICON.cal}${t(C.bookDoc)}</a>${tel ? `<a class="btn btn-ghost" href="${esc(tel)}">${ICON.phone}${esc(site.phone ?? "")}</a>` : ""}</div>
${facts ? `<ul class="hf">${facts}</ul>` : ""}
</div></section>`;

  const motions = ["a-rise", "a-pop", "a-tilt", "a-left", "a-right", "a-pulse", "a-scan"];
  const dirSec = dirs.length
    ? `<section id="napravleniya" class="rel"><div class="wrap">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${t(C.dirsKick)}</span><h2>${t(C.dirsH)}</h2><p>${t(C.dirsLead)}</p></div>
<div class="bento">
${dirs
  .map((x, i) => {
    const n = doctors.filter((d) => d.dir === x.id).length;
    const price = services[i].price;
    const big = i === 0 && dirs.length >= 5;
    return `<a class="tile${big ? " big" : ""} rv-in ${motions[i % motions.length]}" style="--d:${(i % 4) * 60}ms" href="#zapis" data-book-dir="${n ? x.id : "any"}" data-ask="${esc(t(C.interested) + x.name)}"><span class="ico">${ICON[iconOf(x.name)]}</span><span><h3>${esc(x.name)}</h3>${price ? `<small>${esc(price)}</small>` : ""}</span><span class="go" aria-hidden="true">${t(C.book)} →</span></a>`;
  })
  .join("\n")}
</div>
</div></section>`
    : "";

  const about = perks.length || site.about
    ? `<section class="robot" id="about"><div class="wrap">
<div class="robot-pic im-pic rv-in a-pop"><img class="shift" data-shift=".08" src="${esc(photos[0])}" alt="${name}" width="1200" height="1500" loading="lazy" referrerpolicy="no-referrer"><div class="robot-badge">${t(own.length ? C.ownPhotos : C.stockPhotos)}</div></div>
<div>
<span class="kicker" style="color:var(--lav2)"><i></i>${t(C.aboutKick)}</span>
<h2 class="rv-in a-left" style="margin-top:12px">${t(C.aboutH)}</h2>
${site.about ? `<p class="lead" style="margin-top:16px">${esc(site.about)}</p>` : ""}
${perks.length ? `<ul class="plus">${perks.map((x, i) => `<li class="rv-in a-right" style="--d:${i * 70}ms">${ICON.check}<span>${esc(x)}</span></li>`).join("")}</ul>` : ""}
<p style="margin-top:24px"><a class="btn btn-red" href="#zapis">${t(C.bookDoc)}</a></p>
</div>
</div></section>`
    : "";

  const docSec = doctors.length
    ? `<section id="vrachi"><div class="wrap">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${t(C.docsKick)}</span><h2>${t(C.docsH)}</h2><p>${t(C.docsLead)}</p></div>
<div class="docs-tools">
<label class="search"><span class="skip">${t(C.docFind)}</span>${ICON.search}<input id="docs-q" type="search" placeholder="${t(C.docSearch)}" autocomplete="off"></label>
<div class="chips" id="docs-chips" role="group" aria-label="${t(C.dir)}"><button type="button" class="chip" data-f="all" aria-pressed="true">${t(C.all)}</button>${dirsWithDocs.map((d) => `<button type="button" class="chip" data-f="${d.id}" aria-pressed="false">${esc(d.name)}</button>`).join("")}</div>
</div>
<div class="docs" id="docs-grid">
${doctors.map((x, i) => `<article class="doc rv-in ${["a-rise", "a-pop", "a-tilt"][i % 3]}" style="--d:${(i % 4) * 60}ms" data-dir="${x.dir}" data-q="${esc(`${x.name} ${x.role ?? ""}`.toLowerCase())}"><div class="doc-ph"><span class="av" aria-hidden="true">${esc(x.i)}</span><div class="doc-over"><a class="btn btn-red btn-sm" href="#zapis" data-book-doc="${x.s}">${t(C.book)}</a></div></div><div class="doc-tx"><b>${esc(x.name)}</b>${x.role ? `<span>${esc(x.role)}</span>` : ""}<a class="btn btn-brand btn-sm" href="#zapis" data-book-doc="${x.s}">${t(C.book)}</a></div></article>`).join("\n")}
</div>
<p class="empty" id="docs-empty" hidden>${t(C.noDoc)}</p>
</div></section>`
    : "";

  const chips: [string, string][] = [...dirsWithDocs.map((d): [string, string] => [d.id, d.name]), ["any", t(C.notSure)]];
  const bookSec = `<section class="book" id="zapis"><div class="wrap">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${t(C.bookKick)}</span><h2>${t(C.bookH)}</h2></div>
<div class="book-box rv-in a-tilt">
<div class="book-side">
<ol class="steps">${C.steps.map((s, i) => `<li${i ? "" : ' class="on"'}><span>${t(s)}</span></li>`).join("")}</ol>
<p class="src">${t(C.slotsNote)}</p>
</div>
<div>
<div class="pane on" data-p="1"><h3>${t(C.which)}</h3><div class="opts" id="bk-dirs">${chips.map(([id, n]) => `<button type="button" class="chip" data-dir="${id}" aria-pressed="false">${esc(n)}</button>`).join("")}</div></div>
<div class="pane" data-p="2"><h3>${t(C.pickDoc)}</h3><div class="mini-docs" id="bk-docs"></div><div class="pane-nav"><button type="button" class="back" data-back="1">← ${t(C.back)}</button></div></div>
<div class="pane" data-p="3"><h3>${t(C.when)}</h3><div class="days" id="bk-days"></div><div class="slots" id="bk-slots"></div><div class="pane-nav"><button type="button" class="back" data-back="2">← ${t(C.back)}</button></div></div>
<div class="pane" data-p="4"><h3>${t(C.where)}</h3>
<div class="sum" id="bk-sum"></div>
<div class="field"><label for="bk-name">${t(C.name)}</label><input id="bk-name" autocomplete="name"></div>
<div class="field"><label for="bk-tel">${t(C.phone)}</label><input id="bk-tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="${l === "uz" || /^998/.test(telDigits) ? "+998" : "+"}"></div>
<div class="field"><label for="bk-note">${t(C.note)}</label><textarea id="bk-note"></textarea></div>
<p class="src" id="bk-err" hidden style="color:var(--red2)">${t(C.needContact)}</p>
<div class="pane-nav"><a class="btn btn-red" id="bk-send" href="${esc(sendHref)}" target="_blank" rel="noopener">${tg ? ICON.tg : wa ? ICON.wa : ICON.phone}${t(sendLabel)}</a>${tel ? `<a class="btn btn-ghost" href="${esc(tel)}">${ICON.phone}${esc(site.phone ?? "")}</a>` : ""}<button type="button" class="back" data-back="3">← ${t(C.back)}</button></div>
<p class="sent" id="bk-sent">${t(C.sent)}</p>
</div>
</div>
</div>
</div></section>`;

  const demoRows: [Pair, string][] = [
    [C.demoPatient, l === "ru" ? "Дилноза" : l === "ar" ? "دلنوزا" : "Dilnoza"],
    [C.dir, services[0]?.name ?? t(C.kind)],
    [C.demoArea, "[[t:0]]"],
    [C.demoNear, t(C.demoShop)],
  ];
  const flow = `<section id="flow"><div class="wrap im-two">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${t(C.flowKick)}</span><h2>${t(C.flowH)}</h2><p>${t(C.flowLead)}</p></div>
<div class="tgc rv-in a-pop"><div class="tgc-h">${ICON.tg}<b>${t(C.demoTitle)}</b><small>${t(C.demo)}</small></div>
<dl>${demoRows.map(([k, v]) => `<dt>${t(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>
</div></section>`;

  const prices = services.length
    ? `<section id="ceny"><div class="wrap">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${t(C.priceKick)}</span><h2>${t(C.priceH)}</h2>${services.some((s) => !s.price) ? `<p>${t(C.priceLead)}</p>` : ""}</div>
<div class="prices-box rv-in a-scan">
<label class="search"><span class="skip">${t(C.priceSearch)}</span>${ICON.search}<input id="pq" type="search" placeholder="${t(C.pricePh)}" autocomplete="off"></label>
<div class="chips" id="pchips" role="group"><button type="button" class="chip" data-f="all" aria-pressed="true">${t(C.all)}</button></div>
<p class="pcount" id="pcount" aria-live="polite"></p>
<ul class="plist" id="plist">${services
        .map((s, i) => {
          const n = doctors.filter((d) => d.dir === `s${i}`).length;
          return `<li data-c="c" data-q="${esc(s.name.toLowerCase())}"><b>${esc(s.name)}</b><small>${t(C.services)} · ${s.price ? esc(s.price) : t(C.priceAsk)}</small><a class="ask" href="#zapis" data-book-dir="${n ? `s${i}` : "any"}" data-ask="${esc((s.price ? t(C.interested) : t(C.howMuch)) + s.name)}">${s.price ? t(C.book) : t(C.askPrice)} →</a></li>`;
        })
        .join("")}</ul>
${services.length > 8 ? `<button type="button" class="btn btn-ghost btn-sm pmore" id="pmore">${t(C.showAll)}</button>` : ""}
</div>
</div></section>`
    : "";

  const checkup = `<section id="checkup"><div class="wrap">
<div class="sec-head rv-in a-rise"><span class="kicker"><i></i>${t(C.cuKick)}</span><h2>${t(C.cuH)}</h2><p>${t(C.cuLead)}</p><p><span class="ours">${t(C.ours)}</span></p></div>
<div class="cu">${C.cu
    .map(
      (c, i) =>
        `<div class="cu-card${"hot" in c && c.hot ? " hot" : ""} rv-in ${["a-left", "a-pop", "a-right"][i]}" style="--d:${i * 90}ms"><h3>${t(c.h)}</h3><ul>${c.li.map((x) => `<li>${t(x)}</li>`).join("")}</ul><p class="pr">${t(C.cuPrice)}</p><a class="btn ${"hot" in c && c.hot ? "btn-red" : "btn-brand"} btn-sm" href="#zapis" data-book-dir="any" data-ask="${esc(t(C.cuAsk) + t(c.h) + "»")}">${t(C.cuBook)}</a></div>`,
    )
    .join("")}</div>
</div></section>`;

  const map = site.address ? `https://yandex.uz/maps/?text=${encodeURIComponent(site.address)}` : null;
  const msgItems = [
    tel ? `<a class="call rv-in a-pop" href="${esc(tel)}">${ICON.phone}<span><b>${esc(site.phone ?? "")}</b><span>${t(C.callUs)}</span></span></a>` : "",
    tg ? `<a class="rv-in a-pop" href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">${ICON.tg}<span><b>Telegram</b><span>@${esc(tg)}</span></span></a>` : "",
    wa ? `<a class="rv-in a-pop" href="${esc(wa)}" target="_blank" rel="noopener">${ICON.wa}<span><b>WhatsApp</b><span>${t(C.write)}</span></span></a>` : "",
    ig ? `<a class="rv-in a-pop" href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">${ICON.insta}<span><b>Instagram</b><span>@${esc(ig)}</span></span></a>` : "",
    map ? `<a class="rv-in a-pop" href="${esc(map)}" target="_blank" rel="noopener">${ICON.pin}<span><b>${t(C.route)}</b><span>${esc(site.address ?? "")}${site.hours ? ` · ${esc(site.hours)}` : ""}</span></span></a>` : "",
  ].join("\n");
  const msg = `<section id="svyaz"><div class="wrap">
<div class="sec-head rv-in a-rise"><h2>${t(C.msgH)}</h2></div>
<div class="msg">${msgItems}</div>
</div></section>`;

  const final = `<section class="final"><div class="wrap rv-in a-pulse">
<h2>${t(C.finalH)}</h2>
${site.hours ? `<p>${esc(site.hours)}</p>` : ""}
<div class="fly-cta"><a class="btn btn-red" href="#zapis">${ICON.cal}${t(C.bookDoc)}</a>${tel ? `<a class="btn btn-ghost" href="${esc(tel)}">${ICON.phone}${esc(site.phone ?? "")}</a>` : ""}</div>
</div></section>`;

  const follow = [
    tg ? `<li><a href="https://t.me/${esc(tg)}">Telegram · @${esc(tg)}</a></li>` : "",
    ig ? `<li><a href="https://instagram.com/${esc(ig)}">Instagram · @${esc(ig)}</a></li>` : "",
    wa ? `<li><a href="${esc(wa)}">WhatsApp</a></li>` : "",
  ].join("");
  const footer = `<footer><div class="wrap">
<div class="cols">
<div><b>${name}</b><ul>${tel ? `<li><a href="${esc(tel)}">${esc(site.phone ?? "")}</a></li>` : ""}${site.address ? `<li>${esc(site.address)}</li>` : ""}${site.hours ? `<li>${esc(site.hours)}</li>` : ""}</ul></div>
${dirs.length ? `<div><b>${t(C.footDirs)}</b><ul>${dirs.slice(0, 5).map((d) => `<li><a href="#napravleniya">${esc(d.name)}</a></li>`).join("")}</ul></div>` : ""}
${follow ? `<div><b>${t(C.footFollow)}</b><ul>${follow}</ul></div>` : ""}
</div>
<div class="rights"><span>${t(C.rights)}</span><span>${t(C.mockup)} <a href="${esc(mockupTermsUrl(siteLocaleOf(l)))}" target="_blank" rel="noopener">${t(C.terms)}</a></span><span>${t(C.source)} ${esc(site.source)}</span></div>
</div></footer>`;

  const i18n = {
    ...js,
    dec: ",",
    go,
    tel: telDigits,
    msgHead: js.hello,
    dirs: Object.fromEntries(dirs.map((d) => [d.id, d.name])),
  };
  const docsJson = doctors.map((x) => ({ s: x.s, n: x.name, sp: x.role ?? "", dir: x.dir, img: "", i: x.i }));

  return `<!doctype html>
<html ${htmlLang(l)}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.title)}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap&subset=cyrillic,latin-ext">
${rtlHead(l)}
<script>document.documentElement.classList.add('js');document.documentElement.classList.add('dz-off')</script>
<style>${assets.css}
${assets.fly}
:root{${palette(site.color)};--hd:var(--disp);--tx:var(--text)}
.logo{gap:10px;max-width:60vw}
.logo .lg{height:32px;width:auto;max-width:120px;object-fit:contain}
.logo .mk svg{width:28px;height:28px;color:var(--brand)}
.logo .lt{font-family:var(--disp);font-size:20px;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hero-im{text-align:left}
.hero-im h1{font-size:clamp(40px,6vw,76px);margin:16px 0;overflow-wrap:anywhere}
.hero-im p{max-width:56ch}
.hf{list-style:none;margin:24px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:12px 24px}
.hf li{display:flex;gap:8px;align-items:center}
.hf svg{width:20px;height:20px;flex:none}
.im-pic{background:var(--night2)}
.im-pic img{object-fit:cover;padding:0;inset:-8% 0}
.doc-ph .av,.mini .av{display:grid;place-items:center;font-family:var(--disp);color:var(--brand);background:var(--lav)}
.doc-ph .av{width:100%;aspect-ratio:16/9;font-size:44px}
.mini .av{width:48px;height:60px;border-radius:8px;flex:none;font-size:18px}
.im-two{display:grid;gap:32px;align-items:center}
@media(min-width:900px){.im-two{grid-template-columns:1fr 1fr}}
.tgc{border-radius:var(--r);padding:20px;max-width:420px;width:100%;justify-self:center;background:var(--sf);box-shadow:var(--sh3)}
.tgc-h{display:flex;align-items:center;gap:10px}
.tgc-h svg{width:26px;height:26px;color:var(--brand)}
.tgc-h small{margin-left:auto;font-size:12px;color:var(--mute);padding:4px 10px;border-radius:999px;background:var(--sf2)}
.tgc dl{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin:16px 0 0}
.tgc dt{color:var(--mute)}
.tgc dd{margin:0;font-weight:700;overflow-wrap:anywhere}
.hs{padding:0}
.calm{padding:96px 0 48px}
.hs .kick{display:inline-flex;align-items:center;gap:12px;margin:0 0 16px;font-size:14px;letter-spacing:.14em;text-transform:uppercase}
.hs .kick i{width:28px;height:1px;background:currentColor}
.hs-sign{position:absolute;left:50%;top:17%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;color:var(--ink);font:700 clamp(16px,1.9vw,30px)/1 var(--hd);letter-spacing:.04em;white-space:nowrap;transition:opacity .5s,transform .8s;pointer-events:none}
.hs-sign img{height:clamp(24px,3vw,44px);width:auto}
.hs.moved .hs-sign{opacity:0;transform:translateX(-50%) scale(1.15)}
@media(max-width:899px){.hs-sign{top:26%;font-size:18px}}
@media(prefers-reduced-motion:reduce){.hs{display:none}.calm{display:block}}</style>
</head>
<body data-page="" data-base="0">
${dzIntroSolo(l)}
<a class="skip" href="#main">${t(C.toMain)}</a>
${header}
<main id="main">
${flySec}
${hero}
${dirSec}
${about}
${docSec}
${bookSec}
${flow}
${prices}
${checkup}
${msg}
${final}
</main>
${footer}
<div class="dock" id="dock"><a class="btn btn-red" href="#zapis">${ICON.cal}${t(C.bookDoc)}</a>${tel ? `<a class="btn btn-tel" href="${esc(tel)}" aria-label="${t(C.callUs)}">${ICON.phone}</a>` : ""}</div>
<script type="application/json" id="im-i18n">${json(i18n)}</script>
<script type="application/json" id="im-docs">${json(docsJson)}</script>
${fly ? `<script type="application/json" id="im-land">${json(land)}</script>\n<script>\n${nek.scene}</script>` : ""}
<script>
${assets.js}</script>
</body>
</html>`;
}
