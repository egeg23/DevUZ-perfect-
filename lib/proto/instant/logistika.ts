/**
 * Шаблон «Логистика» — сайт нашего макета CARGO PRO GROUP
 * (scripts/protos/cargopro/gen.mjs, страница `site`), переодетый под клиента.
 *
 * Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают
 * "другая ниша"… выведем больше ниш которые у нас есть, также переодевать
 * просто». Отсюда устройство: стили Cargo Pro — тот же site.css
 * (content/proto-instant/cargopro-assets.json, пишет
 * scripts/protos/instant/cargopro-assets.mjs), разметка — те же блоки и
 * классы: стеклянная шапка-капсула, ночной первый экран с дугами маршрутов
 * и быстрым расчётом в стекле, бегущие строки, карточки услуг с рисунками
 * кодом, заявка на расчёт с итогом справа, «Где мой груз» по номеру,
 * таможенный брокер, Telegram-бот, вопросы, контакты, кнопки внизу на
 * телефоне. Скрипт Cargo Pro (site.js) весь про их направления и ставки,
 * поэтому поведение (шапка, появление, стекло, бегущие строки, окно
 * заявки, «Мои заявки») написано здесь теми же приёмами.
 *
 * Что от Cargo Pro не берётся, потому что это про них: имя, знак, телефоны,
 * адрес, авиакомпании-партнёры, склады в ОАЭ и Индии, сцена залёта из их
 * кадров, схема их пяти направлений, конструктор тарифов с их ставками.
 * Цены у логиста почти всегда «по запросу», поэтому вместо конструктора —
 * заявка на расчёт: что везут, откуда и куда, вес и объём; итог называет
 * менеджер. Цены клиента, если они есть на его сайте, стоят в карточках
 * услуг и в итоге заявки словами клиента.
 *
 * Шаблонные слова без цифр: каждое число на странице — из данных клиента
 * (lib/proto/instant/check).
 */
import assets from "@/content/proto-instant/cargopro-assets.json" with { type: "json" };
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { LIMITS, type InstantLocale, type InstantSite, type BaseSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";

const IMG = "/protos/_niche/logistika";
/** Нейтральные фото ниши: ночной грузовой узел, склад, порт, фура на трассе. */
export const LOGISTIKA_PHOTOS = [1, 2, 3, 4].map((n) => `${IMG}/n${n}-1200.webp`);

type Pair = { ru: string; uz: string };
const P = (ru: string, uz: string): Pair => ({ ru, uz });

/** Вид транспорта услуги — по словам клиента; от него рисунок карточки. */
type Mode = "air" | "auto" | "rail" | "sea" | "customs" | "multi";
const MODE_WORDS: [Mode, RegExp][] = [
  ["customs", /тамож|декларант|брокер|bojxona|deklarant|customs/iu],
  ["air", /авиа|самол|avia|air|havo/iu],
  ["rail", /ж\/д|жд\b|желез|вагон|rail|temir\s*yo/iu],
  ["sea", /мор|контейнер|sea|dengiz|konteyner|ocean/iu],
  ["auto", /авто|фур|грузовик|машин|truck|avto|yuk\s*mashin|tent|рефриж|переезд|доставк|курьер|kuryer|yetkaz/iu],
];
export function modeOf(text: string): Mode {
  return MODE_WORDS.find(([, re]) => re.test(text))?.[0] ?? "multi";
}

const C = {
  kind: P("Грузоперевозки", "Yuk tashish"),
  sections: P("Разделы", "Bo‘limlar"),
  nav: { services: P("Услуги", "Xizmatlar"), calc: P("Расчёт", "Hisob"), track: P("Где груз", "Yuk qayerda"), faq: P("Вопросы", "Savollar"), contact: P("Контакты", "Kontaktlar") },
  call: P("Позвонить", "Qo‘ng‘iroq"),
  mine: P("Мои заявки", "Arizalarim"),
  h1em: P("грузы под ключ: от склада до двери", "yuklar kalit topshirish: ombordan eshikkacha"),
  lead: P("Перевозка грузов, документы и доставка до двери. Расскажите, что везёте, и менеджер посчитает стоимость и срок.", "Yuk tashish, hujjatlar va eshikkacha yetkazish. Nima olib kelishingizni ayting, menejer narx va muddatni hisoblaydi."),
  quickMode: P("Вид транспорта", "Transport turi"),
  from: P("Откуда", "Qayerdan"),
  to: P("Куда", "Qayerga"),
  kgL: P("Вес, кг", "Og‘irlik, kg"),
  calcBtn: P("Рассчитать", "Hisoblash"),
  stock: P("Фото для примера: компания поставит свои.", "Rasmlar namuna uchun: kompaniya o‘zinikini qo‘yadi."),
  svcKick: P("Услуги", "Xizmatlar"),
  svcH: { ru: "Возим грузы <b>любым удобным способом</b>", uz: "Yuklarni <b>qulay usulda</b> tashiymiz" },
  svcLead: P("Перевозка, документы и доставка до двери. Цену и срок называем под ваш груз.", "Tashish, hujjatlar va eshikkacha yetkazish. Narx va muddatni yukingizga qarab aytamiz."),
  priceAsk: P("Цена по запросу", "Narxi so‘rov bo‘yicha"),
  needDecl: P("Нужен декларант", "Deklarant kerak"),
  calcKick: P("Заявка на расчёт", "Hisobga ariza"),
  calcH: { ru: "Сколько стоит доставка: <b>посчитаем под ваш груз</b>", uz: "Yetkazish qancha turadi: <b>yukingizga qarab hisoblaymiz</b>" },
  calcLead: P("Выберите транспорт, напишите маршрут, подвиньте вес и объём, отметьте нужное. Менеджер ответит со стоимостью и сроком.", "Transportni tanlang, yo‘nalishni yozing, og‘irlik va hajmni suring, keraklisini belgilang. Menejer narx va muddat bilan javob beradi."),
  transport: P("Транспорт", "Transport"),
  route: P("Маршрут", "Yo‘nalish"),
  fromPh: P("город или страна", "shahar yoki davlat"),
  weight: P("Вес", "Og‘irlik"),
  volume: P("Объём", "Hajm"),
  extra: P("Дополнительно", "Qo‘shimcha"),
  oIns: P("Страхование груза", "Yukni sug‘urtalash"),
  oInsS: P("от объявленной стоимости груза", "yukning e’lon qilingan qiymatidan"),
  oCus: P("Таможенное оформление", "Bojxona rasmiylashtiruvi"),
  oCusS: P("декларант и документы; пошлины и НДС по закону, отдельно", "deklarant va hujjatlar; bojlar va QQS qonun bo‘yicha, alohida"),
  oDoor: P("До двери", "Eshikkacha"),
  oDoorS: P("со склада до вашего адреса", "ombordan manzilingizgacha"),
  oCons: P("Сборный груз", "Yig‘ma yuk"),
  oConsS: P("товар от нескольких поставщиков одной отправкой", "bir nechta yetkazib beruvchining tovari bitta jo‘natmada"),
  what: P("Что везёте", "Nima olib kelasiz"),
  whatPh: P("например, оборудование на паллетах", "masalan, palletdagi uskunalar"),
  sumH: P("Ваша заявка", "Arizangiz"),
  sumTot: P("Стоимость", "Narxi"),
  sumAsk: P("посчитает менеджер", "menejer hisoblaydi"),
  ownPrices: P("Цены компании", "Kompaniya narxlari"),
  send: P("Отправить заявку", "Ariza yuborish"),
  sumNote: P("Это заявка на расчёт: точную стоимость и срок менеджер назовёт по вашему грузу.", "Bu hisobga ariza: aniq narx va muddatni menejer yukingizga qarab aytadi."),
  ours: P("Предложение DevUz Studio", "DevUz Studio taklifi"),
  trackTag: P("Предложение DevUz Studio · отслеживание", "DevUz Studio taklifi · kuzatish"),
  trackH: { ru: "Где мой груз? <b>По номеру, без звонка</b>", uz: "Yukim qayerda? <b>Raqam bo‘yicha, qo‘ng‘iroqsiz</b>" },
  trackLead: P("Номер заявки, и видно каждый шаг: склад, отправка, в пути, таможня, выдача. Статус ставит менеджер в панели.", "Ariza raqami, va har bir qadam ko‘rinadi: ombor, jo‘natish, yo‘lda, bojxona, topshirish. Holatni menejer panelda qo‘yadi."),
  trackNo: P("Номер груза или заявки", "Yuk yoki ariza raqami"),
  find: P("Найти", "Topish"),
  tryDemo: P("Попробуйте демо-номера:", "Demo raqamlarni sinab ko‘ring:"),
  trackEmpty: P("Введите номер", "Raqamni kiriting"),
  trackEmptyS: P("Здесь появится путь груза.", "Bu yerda yuk yo‘li paydo bo‘ladi."),
  cusKick: P("Таможенное оформление", "Bojxona rasmiylashtiruvi"),
  cusH: { ru: "Таможня <b>без очередей и лишних звонков</b>", uz: "Bojxona <b>navbat va ortiqcha qo‘ng‘iroqlarsiz</b>" },
  cus: [
    P("Подготовка документов для импорта, экспорта и транзита", "Import, eksport va tranzit uchun hujjatlar tayyorlash"),
    P("Представление клиента на таможне при декларировании", "Deklaratsiyada mijozni bojxonada taqdim etish"),
    P("Оформление разрешений, справок и сертификатов", "Ruxsatnomalar, ma’lumotnomalar va sertifikatlarni rasmiylashtirish"),
    P("Оплата таможенных платежей: сборов, пошлин, акцизов", "Bojxona to‘lovlarini to‘lash: yig‘imlar, bojlar, aksizlar"),
  ],
  docsTag: P("Предложение DevUz Studio · документы", "DevUz Studio taklifi · hujjatlar"),
  docsH: P("Какие документы нужны", "Qanday hujjatlar kerak"),
  docsNote: P("Список для подготовки, окончательный даёт декларант по коду товара.", "Tayyorlanish uchun ro‘yxat, yakuniysini deklarant tovar kodi bo‘yicha beradi."),
  docKinds: [P("Обычный товар", "Oddiy tovar"), P("Продукты питания", "Oziq-ovqat"), P("Электроника", "Elektronika"), P("Оборудование", "Uskunalar"), P("Опасный груз", "Xavfli yuk")],
  aboutKick: P("О компании", "Kompaniya haqida"),
  aboutH: { ru: "Довезём <b>аккуратно и в срок</b>", uz: "<b>Ehtiyotkorlik bilan va o‘z vaqtida</b> yetkazamiz" },
  whyKick: P("Почему мы", "Nega biz"),
  steps: [P("Заявка и расчёт", "Ariza va hisob"), P("Забираем груз со склада или от поставщика", "Yukni ombordan yoki yetkazib beruvchidan olamiz"), P("Документы и отправка", "Hujjatlar va jo‘natish"), P("Выдача или доставка до двери", "Topshirish yoki eshikkacha yetkazish")],
  botTag: P("Предложение DevUz Studio · Telegram-бот", "DevUz Studio taklifi · Telegram-bot"),
  botH: { ru: "Расчёт и статус <b>в&nbsp;Telegram</b>", uz: "Hisob va holat <b>Telegramda</b>" },
  botLead: P("Заявка в два касания прямо в Telegram, а когда груз проходит таможню, бот пишет сам.", "Telegramning o‘zida ikki bosishda ariza, yuk bojxonadan o‘tganda bot o‘zi yozadi."),
  bot: [
    ["me", P("Нужно привезти оборудование, сколько будет стоить?", "Uskunani olib kelish kerak, qancha turadi?")],
    ["", P("Пришлите вес, объём и откуда везём: посчитаю и оформлю заявку.", "Og‘irlik, hajm va qayerdan olib kelishimizni yuboring: hisoblab, ariza rasmiylashtiraman.")],
    ["me", P("Отправил", "Yubordim")],
    ["", P("Заявка принята, менеджер напишет в течение рабочего дня.", "Ariza qabul qilindi, menejer ish kuni davomida yozadi.")],
    ["", P("Ваш груз прошёл таможню, можно забирать.", "Yukingiz bojxonadan o‘tdi, olib ketish mumkin.")],
  ] as [string, Pair][],
  flowKick: P("Заявка с сайта", "Saytdan ariza"),
  flowH: { ru: "Так заявка придёт <b>вам в Telegram</b>", uz: "Ariza sizga <b>Telegramda shunday keladi</b>" },
  flowLead: P("Клиент оставляет маршрут, вес и телефон, менеджеру сразу приходит сообщение.", "Mijoz yo‘nalish, og‘irlik va telefonni qoldiradi, menejerga darhol xabar keladi."),
  demo: P("демо-данные", "demo-ma’lumot"),
  demoTitle: P("Новая заявка на расчёт", "Hisobga yangi ariza"),
  demoWho: P("Клиент", "Mijoz"),
  demoRoute: P("Маршрут", "Yo‘nalish"),
  demoWhat: P("Груз", "Yuk"),
  demoShop: P("ООО «[[t:1]]»", "«[[t:1]]» MChJ"),
  faqKick: P("Вопросы", "Savollar"),
  faqH: { ru: "Коротко <b>о главном</b>", uz: "Asosiysi <b>qisqacha</b>" },
  faq: [
    [P("Как считается стоимость?", "Narx qanday hisoblanadi?"), P("По весу или объёму груза, что больше, маршруту и виду транспорта. Лёгкий, но объёмный груз платит за объём.", "Yukning og‘irligi yoki hajmi bo‘yicha, qaysi biri katta bo‘lsa, yo‘nalish va transport turiga qarab. Yengil, lekin katta yuk hajm uchun to‘laydi.")],
    [P("Сколько груз будет в пути?", "Yuk yo‘lda qancha bo‘ladi?"), P("Зависит от маршрута и транспорта: срок менеджер назовёт вместе со стоимостью.", "Yo‘nalish va transportga bog‘liq: muddatni menejer narx bilan birga aytadi.")],
    [P("Помогаете с документами?", "Hujjatlar bilan yordam berasizmi?"), P("Да: подскажем, какие документы нужны под ваш товар, и оформим их.", "Ha: tovaringiz uchun qanday hujjatlar kerakligini aytamiz va rasmiylashtiramiz.")],
    [P("Можно застраховать груз?", "Yukni sug‘urtalash mumkinmi?"), P("Да, от объявленной стоимости груза: отметьте это в заявке на расчёт.", "Ha, yukning e’lon qilingan qiymatidan: buni hisobga arizada belgilang.")],
  ] as [Pair, Pair][],
  contactKick: P("Контакты", "Kontaktlar"),
  contactH: { ru: "Свяжитесь <b>удобным способом</b>", uz: "<b>Qulay usulda</b> bog‘laning" },
  map: P("Открыть на карте", "Xaritada ochish"),
  toCalc: P("Рассчитать доставку", "Yetkazishni hisoblash"),
  footClients: P("Клиентам", "Mijozlarga"),
  footLink: P("Связь", "Aloqa"),
  rights: P("Это макет: так может выглядеть сайт компании. Название, услуги и контакты взяты из данных компании, блоки с пометкой «Предложение DevUz Studio» предлагаем мы. Номера грузов, клиенты и статусы: демо.", "Bu maket: kompaniya sayti shunday ko‘rinishi mumkin. Nomi, xizmatlar va kontaktlar kompaniya ma’lumotlaridan olingan, «DevUz Studio taklifi» belgisi bor bloklarni biz taklif qilyapmiz. Yuk raqamlari, mijozlar va holatlar: demo."),
  mockup: P("Макет принадлежит DevUz Studio. Использовать его можно только по договору:", "Maket DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin:"),
  terms: P("условия использования", "foydalanish shartlari"),
  source: P("Данные:", "Ma’lumotlar:"),
  toMain: P("К расчёту", "Hisobga o‘tish"),
  close: P("Закрыть", "Yopish"),
  desc: P("Грузоперевозки, таможенное оформление и доставка до двери. Заявка на расчёт онлайн.", "Yuk tashish, bojxona rasmiylashtiruvi va eshikkacha yetkazish. Onlayn hisobga ariza."),
  modes: { air: P("Авиа", "Avia"), auto: P("Авто", "Avto"), rail: P("Ж/д", "Temir yo‘l"), sea: P("Море", "Dengiz") },
} as const;

/** Подписи скрипта страницы: в JSON, не в разметке. */
const JS = {
  ru: {
    kg: "кг", m3: "м³", wv: "Вес и объём", tr: "Транспорт", name: "Имя", co: "Компания", phone: "Телефон", need: "Напишите имя и телефон", req: "Заявка на расчёт", send: "Отправить заявку", ok: "Заявка принята",
    okp: "Это макет: заявка легла в панель, там менеджер ставит статус груза. Он появится здесь, в «Мои заявки».", chat: "Отправить в чат", call: "Позвонить", mine: "Мои заявки", none: "Заявок пока нет.",
    st: ["Заявка принята", "Расчёт отправлен", "Груз на складе", "В пути", "Таможня", "Выдан"], notFound: "Такого номера нет. Попробуйте демо-номер ниже.", demo: "демо",
    mode: { air: "авиа", auto: "авто", rail: "ж/д", sea: "море" }, from: "Откуда", to: "Куда", what: "Груз", ins: "страховка", cus: "таможня", door: "до двери", cons: "сборный груз", extra: "Дополнительно", tot: "Стоимость: посчитает менеджер", wh: "Склад", co2: "ООО",
    docs: [["Инвойс", "Упаковочный лист", "Договор с поставщиком", "Сертификат происхождения"], ["Инвойс и упаковочный лист", "Ветеринарный или фитосанитарный сертификат", "Сертификат соответствия", "Сертификат происхождения"], ["Инвойс и упаковочный лист", "Сертификат соответствия", "Разрешение на радиочастоты, если есть передатчик", "Сертификат происхождения"], ["Инвойс и упаковочный лист", "Техпаспорт или спецификация", "Сертификат соответствия", "Регистрация контракта"], ["Инвойс и упаковочный лист", "Паспорт безопасности MSDS", "Декларация опасного груза", "Разрешение на ввоз, если требуется"]],
    toast: "Текст скопирован: вставьте его в чат",
  },
  uz: {
    kg: "kg", m3: "m³", wv: "Og‘irlik va hajm", tr: "Transport", name: "Ism", co: "Kompaniya", phone: "Telefon", need: "Ism va telefonni yozing", req: "Hisobga ariza", send: "Ariza yuborish", ok: "Ariza qabul qilindi",
    okp: "Bu maket: ariza panelga tushdi, u yerda menejer yuk holatini qo‘yadi. U shu yerda, «Arizalarim»da paydo bo‘ladi.", chat: "Chatga yuborish", call: "Qo‘ng‘iroq", mine: "Arizalarim", none: "Hozircha arizalar yo‘q.",
    st: ["Ariza qabul qilindi", "Hisob yuborildi", "Yuk omborda", "Yo‘lda", "Bojxona", "Topshirildi"], notFound: "Bunday raqam yo‘q. Quyidagi demo raqamni sinab ko‘ring.", demo: "demo",
    mode: { air: "avia", auto: "avto", rail: "temir yo‘l", sea: "dengiz" }, from: "Qayerdan", to: "Qayerga", what: "Yuk", ins: "sug‘urta", cus: "bojxona", door: "eshikkacha", cons: "yig‘ma yuk", extra: "Qo‘shimcha", tot: "Narxi: menejer hisoblaydi", wh: "Ombor", co2: "MChJ",
    docs: [["Invoys", "Qadoqlash varaqasi", "Yetkazib beruvchi bilan shartnoma", "Kelib chiqish sertifikati"], ["Invoys va qadoqlash varaqasi", "Veterinariya yoki fitosanitariya sertifikati", "Muvofiqlik sertifikati", "Kelib chiqish sertifikati"], ["Invoys va qadoqlash varaqasi", "Muvofiqlik sertifikati", "Uzatgich bo‘lsa, radiochastota ruxsatnomasi", "Kelib chiqish sertifikati"], ["Invoys va qadoqlash varaqasi", "Texpasport yoki spetsifikatsiya", "Muvofiqlik sertifikati", "Shartnomani ro‘yxatdan o‘tkazish"], ["Invoys va qadoqlash varaqasi", "MSDS xavfsizlik pasporti", "Xavfli yuk deklaratsiyasi", "Kerak bo‘lsa, olib kirish ruxsatnomasi"]],
    toast: "Matn nusxalandi: uni chatga qo‘ying",
  },
} as const;

/* Иконки — те же, что у Cargo Pro. */
const I = (dd: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  wa: I('<path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z"/><path d="M9.2 8.6c.3 2.9 2.4 5.2 5.4 5.9l1.2-1.3-1.8-1-1 .8c-1-.4-1.9-1.3-2.4-2.4l.8-1-1-1.8z"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  doc: I('<path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
  box: I('<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>'),
  calc: I('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'),
  search: I('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  air: I('<path d="M10.5 21 12 17l-1-5-7 3-1-2 7-5V4a2 2 0 0 1 4 0v4l7 5-1 2-7-3-1 5 1.5 4Z"/>'),
  auto: I('<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17.5" cy="17.5" r="1.6"/>'),
  rail: I('<rect x="6" y="3" width="12" height="13" rx="3"/><path d="M6 10h12M9 20l-2 2M15 20l2 2M9 13h.01M15 13h.01"/>'),
  sea: I('<path d="M3 17c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0M5 14l-1-4h16l-1 4M8 10V6h8v4M12 3v3"/>'),
  insta: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>'),
};

/* Рисунки услуг — те же, что у Cargo Pro: линиями в цветах знака. */
const ILL: Record<Mode, string> = {
  air: `<svg viewBox="0 0 240 120" aria-hidden="true"><path d="M10 96 C 80 90, 150 60, 230 14" fill="none" stroke="url(#gArc)" stroke-width="2" stroke-dasharray="5 7"/><g transform="translate(150 40) rotate(-22)"><path d="M-40 0h70c8 0 14 3 14 6s-6 6-14 6h-70l-8-6z" fill="#e8ecf8"/><path d="M-6 0l-20-26h10l26 26zM-6 12l-20 22h10l26-22zM-40 0l-10-14h8l12 14z" fill="#c9d1ea"/><circle cx="22" cy="5" r="1.6" fill="#0c1329"/><circle cx="14" cy="5" r="1.6" fill="#0c1329"/></g></svg>`,
  auto: `<svg viewBox="0 0 240 120" aria-hidden="true"><path d="M0 104h240" stroke="#2b3666" stroke-width="2"/><path d="M0 104h240" stroke="url(#gArc)" stroke-width="2" stroke-dasharray="14 18" class="road"/><rect x="40" y="38" width="120" height="56" rx="4" style="fill:var(--ac2)"/><rect x="48" y="46" width="104" height="40" rx="2" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/><path d="M160 56h34l20 20v18h-54z" fill="#e8ecf8"/><path d="M170 62h20l12 14h-32z" fill="#0c1329"/><circle cx="72" cy="98" r="9" fill="#0c1329" stroke="#c9d1ea" stroke-width="3"/><circle cx="186" cy="98" r="9" fill="#0c1329" stroke="#c9d1ea" stroke-width="3"/></svg>`,
  rail: `<svg viewBox="0 0 240 120" aria-hidden="true"><path d="M0 106h240M0 112h240" stroke="#2b3666" stroke-width="2"/>${[0, 1, 2].map((i) => `<rect x="${12 + i * 74}" y="52" width="68" height="44" rx="3" style="fill:${["var(--ac)", "#222d4b", "var(--y)"][i]}" stroke="#0c1329" stroke-width="2"/><circle cx="${26 + i * 74}" cy="100" r="5" fill="#c9d1ea"/><circle cx="${66 + i * 74}" cy="100" r="5" fill="#c9d1ea"/>`).join("")}</svg>`,
  sea: `<svg viewBox="0 0 240 120" aria-hidden="true"><path d="M30 76h180l-22 28H52z" fill="#e8ecf8"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${52 + i * 28}" y="${52 - (i % 2) * 14}" width="26" height="${24 + (i % 2) * 14}" style="fill:${["var(--ac)", "var(--ac2)", "var(--y)", "#3a4a8a", "var(--ac)"][i]}"/>`).join("")}<path d="M0 110c20 6 40 6 60 0s40-6 60 0 40 6 60 0 40-6 60 0" fill="none" stroke="url(#gArc)" stroke-width="2"/></svg>`,
  multi: `<svg viewBox="0 0 240 120" aria-hidden="true"><path d="M20 90 C 70 90, 70 30, 120 30 S 170 90, 220 90" fill="none" stroke="url(#gArc)" stroke-width="3" stroke-dasharray="6 8"/><circle cx="20" cy="90" r="12" fill="#222d4b" style="stroke:var(--y)" stroke-width="2"/><circle cx="120" cy="30" r="12" fill="#222d4b" style="stroke:var(--ac)" stroke-width="2"/><circle cx="220" cy="90" r="12" fill="#222d4b" style="stroke:var(--ac2)" stroke-width="2"/></svg>`,
  customs: `<svg viewBox="0 0 240 120" aria-hidden="true"><rect x="60" y="14" width="96" height="96" rx="6" fill="#e8ecf8"/><path d="M76 38h64M76 54h64M76 70h40" stroke="#8e98ba" stroke-width="4" stroke-linecap="round"/><circle cx="160" cy="84" r="26" fill="none" style="stroke:var(--ac2)" stroke-width="4"/><path d="m148 84 9 9 16-18" fill="none" style="stroke:var(--ac2)" stroke-width="4" stroke-linecap="round"/></svg>`,
};
const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="gArc" x1="0" x2="1"><stop offset="0" style="stop-color:var(--y)"/><stop offset=".5" style="stop-color:var(--ac)"/><stop offset="1" style="stop-color:var(--ac2)"/></linearGradient></defs></svg>`;

/* Дуги первого экрана — как у Cargo Pro, без подписей городов: куда возит клиент, мы не знаем. */
const HUB = [560, 250];
const ENDS = [[880, 320], [170, 230], [360, 450], [640, 500], [90, 110]];
const arcPath = ([x, y]: number[]) => {
  const [tx, ty] = HUB;
  const mx = (x + tx) / 2;
  const my = Math.min(y, ty) - 90 - Math.abs(x - tx) * 0.12;
  return `M${x} ${y} Q ${mx} ${my} ${tx} ${ty}`;
};
function dots(w: number, h: number, step = 30): string {
  const out: string[] = [];
  for (let x = 20; x < w; x += step) {
    for (let y = 20; y < h; y += step) {
      const v = Math.sin(x * 0.011) * Math.cos(y * 0.017) + Math.sin((x + y) * 0.006);
      if (v > 0.2) out.push(`<circle cx="${x}" cy="${y}" r="2.2"/>`);
    }
  }
  return `<g class="land">${out.join("")}</g>`;
}
const heroArcs = () =>
  `<svg viewBox="0 0 1000 700" aria-hidden="true" focusable="false">${dots(1000, 700)}${ENDS.map((p) => `<path class="arc" d="${arcPath(p)}"/>`).join("")}${ENDS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff"/>`).join("")}<circle class="hubdot" cx="${HUB[0]}" cy="${HUB[1]}" r="14" fill="none" style="stroke:var(--y)" stroke-width="2"/><circle cx="${HUB[0]}" cy="${HUB[1]}" r="8" style="fill:var(--y)"/></svg>`;

/** Заголовок по словам — так он выезжает у Cargo Pro. */
function words(plain: string, em: string): string {
  const w = (x: string, isEm: boolean) => `<span class="w"><span>${isEm ? `<em>${esc(x)}</em>` : esc(x)}</span></span>`;
  return [...plain.split(/\s+/).filter(Boolean).map((x) => w(x, false)), ...em.split(/\s+/).filter(Boolean).map((x) => w(x, true))].join(" ");
}

/**
 * Жёлтый → оранжевый → красный знака Cargo Pro — в цвет бренда клиента:
 * основной тон — его цвет, соседние — на шаг по кругу. Тёмно-синий фон
 * ночного узла остаётся. Нет цвета — их же тона.
 */
export function logistikaPalette(color: string | null): string {
  const hex = brandColor(color);
  if (!hex) return "";
  const [h, s0, l0] = hexToHsl(hex);
  const s = Math.min(Math.max(s0, 55), 90);
  const l = Math.min(Math.max(l0, 50), 60);
  const y = `hsl(${(h + 28) % 360} ${s}% ${Math.min(l + 10, 68)}%)`;
  const a = `hsl(${h} ${s}% ${l}%)`;
  const a2 = `hsl(${(h + 342) % 360} ${s}% ${Math.max(l - 6, 44)}%)`;
  return [`--y:${y}`, `--warn:${y}`, `--ac:${a}`, `--ac2:${a2}`, `--ac3:hsl(${h} ${s}% ${l}% / .14)`, `--gr:linear-gradient(100deg,${y},${a} 45%,${a2})`].join(";");
}

const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/build, normalizeSite). */
export function logistikaHtml(site: BaseSite): string {
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
  const pic = (k: number) => (own.length ? own[k % own.length] : LOGISTIKA_PHOTOS[k % LOGISTIKA_PHOTOS.length]);
  const srcset = (src: string) => (own.length ? "" : ` srcset="${src.replace("-1200", "-900")} 900w, ${src} 1200w"`);

  // Какие виды транспорта у компании — по её услугам; не узнали — без выбора транспорта.
  const all = [site.about ?? "", ...services.map((s) => s.name)].join(" ");
  const modes = (["air", "auto", "rail", "sea"] as const).filter((m) => MODE_WORDS.find(([k]) => k === m)![1].test(all));
  const customs = /тамож|декларант|брокер|bojxona|deklarant|customs/iu.test(all);
  const priced = services.filter((s) => s.price);

  const chat = tg ? `https://t.me/${tg}` : wa;
  const chatIcon = tg ? ICON.tg : ICON.wa;
  const mark = logo ? `<img src="${esc(logo)}" alt="${name}" referrerpolicy="no-referrer" onerror="this.remove()" style="height:36px;width:auto;max-width:140px;object-fit:contain">` : "";
  const logoHtml = `<a class="logo lg-logo" href="#top" aria-label="${name}">${mark}<b>${name}</b></a>`;

  const nav: [string, Pair][] = [
    ...(services.length ? [["services", C.nav.services] as [string, Pair]] : []),
    ["calc", C.nav.calc],
    ["track", C.nav.track],
    ["faq", C.nav.faq],
    ["contact", C.nav.contact],
  ];
  const header = `<header class="top"><div class="top-in glass">
${logoHtml}
<nav class="nav" aria-label="${t(C.sections)}">${nav.map(([id, n]) => `<a href="#${id}">${t(n)}</a>`).join("")}</nav>
<button type="button" class="mine" id="mine">${ICON.box}<span>${t(C.mine)}</span></button>
${tel ? `<a class="btn btn-a btn-s lg-call" href="${esc(tel)}">${ICON.phone}<span>${t(C.call)}</span></a>` : chat ? `<a class="btn btn-a btn-s lg-call" href="${esc(chat)}" target="_blank" rel="noopener">${chatIcon}<span>${tg ? "Telegram" : "WhatsApp"}</span></a>` : ""}
</div></header>`;

  const modeChips = (attr: string, id: string) =>
    modes.length ? `<div class="mchips"${id ? ` id="${id}"` : ""} role="group" aria-label="${t(C.quickMode)}">${modes.map((m, i) => `<button type="button" ${attr}="${m}" aria-pressed="${i === 0}">${ICON[m]}<span>${t(C.modes[m])}</span></button>`).join("")}</div>` : "";

  // 1. Первый экран: фото узла, дуги маршрутов, заголовок по словам, быстрый расчёт в стекле.
  const hero = `<section class="hero" id="top" aria-label="${name}">
<div class="hero-bg" aria-hidden="true"><div class="ph" data-par="0.18"><img class="on" src="${esc(pic(0))}"${srcset(pic(0))} sizes="100vw" alt="" width="1200" height="670" fetchpriority="high" decoding="async" referrerpolicy="no-referrer"></div><div class="arcs" data-par="0.08">${heroArcs()}</div></div>
<div class="wrap"><div class="hero-in">
<p class="kick rise"><i></i>${esc(site.tagline ?? (site.city ? `${t(C.kind)} · ${site.city}` : t(C.kind)))}</p>
<h1>${words(site.name, t(C.h1em))}</h1>
<p class="hsub rise">${site.about ? esc(site.about) : t(C.lead)}</p>
<form class="qc glass rise" id="qc" action="#calc">${modeChips("data-qm", "")}
<div class="qc-r"><label class="fld"><span>${t(C.from)}</span><input id="qfrom" autocomplete="off" placeholder="${t(C.fromPh)}"></label><label class="fld"><span>${t(C.kgL)}</span><input id="qkg" type="number" inputmode="numeric" min="1"></label><label class="fld"><span>${t(C.to)}</span><input id="qto" autocomplete="off" placeholder="${esc(site.city ?? t(C.fromPh))}"></label><button class="btn btn-a" type="submit">${ICON.calc}<span>${t(C.calcBtn)}</span></button></div></form>
${perks.length ? `<ul class="hstats">${perks.slice(0, 4).map((p) => `<li class="glass rise"><span>${esc(p)}</span></li>`).join("")}</ul>` : ""}
${own.length ? "" : `<p class="mnote rise lg-stock">${t(C.stock)}</p>`}
</div></div></section>`;

  // 2. Бегущие строки: услуги и «почему мы».
  const rowA = services.length ? services.map((s) => s.name) : [t(C.kind), t(C.oCus), t(C.oDoor), t(C.oCons)];
  const rowB = perks.length ? perks : [name];
  const row = (arr: string[], cls: string) => `<div class="row${cls}">${[0, 1, 2].map(() => arr.map((x) => `<span>${esc(x)}</span>`).join("")).join("")}</div>`;
  const velo = `<div class="velo" aria-hidden="true">${row(rowA, "")}${row(rowB, " rev")}</div>`;

  // 3. Услуги клиента: рисунок по виду транспорта, цена его словами.
  const mv = ["rise", "tilt", "pop", "slide", "lift", "flip"];
  const svc = services.length
    ? `<section class="sec" id="services"><div class="wrap">
<p class="kick rise"><i></i>${t(C.svcKick)}</p>
<h2 class="h2 rise">${C.svcH[l]}</h2>
<p class="lead rise">${t(C.svcLead)}</p>
<div class="svc">${services
        .map((s, i) => {
          const m = modeOf(s.name);
          return `<article class="sv ${mv[i % mv.length]}"><div class="ill">${ILL[m]}</div><h3>${esc(s.name)}</h3><p class="lg-pr">${s.price ? esc(s.price) : t(C.priceAsk)}</p><a class="btn btn-g btn-s" href="#calc" data-what="${esc(s.name)}"${m !== "customs" && m !== "multi" ? ` data-mode="${m}"` : ""}>${m === "customs" ? t(C.needDecl) : t(C.calcBtn)}${ICON.arrow}</a></article>`;
        })
        .join("")}</div>
</div></section>`
    : "";

  // 4. Заявка на расчёт: что везут, маршрут, вес и объём, дополнительно; итог справа.
  const opt = (id: string, b: Pair, s: Pair, on: boolean) =>
    `<label class="opt"><input type="checkbox" id="${id}"${on ? " checked" : ""}><span class="sw"></span><span class="ot"><b>${t(b)}</b><small>${t(s)}</small></span></label>`;
  const calc = `<section class="sec" id="calc" style="background:var(--bg2)"><div class="wrap">
<p class="kick rise"><i></i>${t(C.calcKick)}</p>
<h2 class="h2 rise">${C.calcH[l]}</h2>
<p class="lead rise">${t(C.calcLead)}</p>
<div class="tf"><div class="tfb">
${modes.length ? `<div><h3>${t(C.transport)}</h3>${modeChips("data-m", "modes")}</div>` : ""}
<div><h3>${t(C.route)}</h3><div class="qc-r lg-route"><label class="fld"><span>${t(C.from)}</span><input id="cfrom" autocomplete="off" placeholder="${t(C.fromPh)}"></label><label class="fld"><span>${t(C.to)}</span><input id="cto" autocomplete="off" placeholder="${esc(site.city ?? t(C.fromPh))}"></label></div></div>
<label class="fld"><span>${t(C.what)}</span><input id="cwhat" autocomplete="off" placeholder="${t(C.whatPh)}"></label>
<div class="rng"><label for="kg"><span>${t(C.weight)}</span><b id="kgv"></b></label><input type="range" id="kg" min="10" max="20000" step="10" value="250"><label for="m3"><span>${t(C.volume)}</span><b id="m3v"></b></label><input type="range" id="m3" min="0.1" max="80" step="0.1" value="1.2"></div>
<div><h3>${t(C.extra)}</h3><div style="display:grid;gap:8px">${opt("oins", C.oIns, C.oInsS, true)}${opt("ocus", C.oCus, C.oCusS, customs)}${opt("odoor", C.oDoor, C.oDoorS, false)}${opt("ocons", C.oCons, C.oConsS, false)}</div></div>
</div>
<aside class="tsum glass" aria-live="polite"><b style="font:700 20px/1.3 var(--hd)">${t(C.sumH)}</b>
<div id="tsum"></div>
${priced.length ? `<div class="lg-own"><p class="mnote">${t(C.ownPrices)}</p>${priced.map((s) => `<div class="li"><span>${esc(s.name)}</span><b>${esc(s.price ?? "")}</b></div>`).join("")}</div>` : ""}
<div class="big"><span>${t(C.sumTot)}</span><b class="lg-ask">${t(C.sumAsk)}</b></div>
<button type="button" class="btn btn-a" id="send">${ICON.doc}<span>${t(C.send)}</span></button>
${tel ? `<a class="btn btn-g" href="${esc(tel)}">${ICON.phone}<span>${esc(site.phone ?? "")}</span></a>` : ""}
<p class="mnote">${t(C.sumNote)}</p>
</aside></div>
</div></section>`;

  // 5. Отслеживание — доп из плана Cargo Pro, подписан предложением.
  const track = `<section class="sec" id="track"><div class="wrap">
<span class="ad-tag">${t(C.trackTag)}</span>
<h2 class="h2 rise">${C.trackH[l]}</h2>
<p class="lead rise">${t(C.trackLead)}</p>
<div class="trk"><form class="trk-f glass slide" id="trkf"><label class="fld" for="trkn"><span>${t(C.trackNo)}</span></label><div class="row"><input id="trkn" autocomplete="off" aria-label="${t(C.trackNo)}"><button class="btn btn-a" type="submit">${ICON.search}<span class="vh">${t(C.find)}</span></button></div>
<p class="mnote">${t(C.tryDemo)}</p><div class="trk-ex" id="trkex"></div></form>
<div class="tl slider" id="tl"><h3>${t(C.trackEmpty)}</h3><p class="mu">${t(C.trackEmptyS)}</p></div></div>
</div></section>`;

  // 6. Таможня — только если у компании есть такая услуга; подсказка по документам — доп.
  const cus = customs
    ? `<section class="sec" id="customs" style="background:var(--bg2)"><div class="wrap">
<p class="kick rise"><i></i>${t(C.cusKick)}</p>
<h2 class="h2 rise">${C.cusH[l]}</h2>
<div class="two"><ul class="chk">${C.cus.map((x, i) => `<li class="${i % 2 ? "slider" : "slide"}">${ICON.check}<span>${t(x)}</span></li>`).join("")}</ul>
<div class="docs glass pop"><span class="ad-tag">${t(C.docsTag)}</span><b style="font:700 20px/1.3 var(--hd)">${t(C.docsH)}</b>
<label class="fld"><span>${t(C.what)}</span><select id="dkind">${C.docKinds.map((k, i) => `<option value="${i}">${t(k)}</option>`).join("")}</select></label>
<ul id="dlist"></ul><p class="mnote">${t(C.docsNote)}</p></div></div>
</div></section>`
    : "";

  // 7. О компании: фото склада, «почему мы», шаги работы.
  const about = `<section class="sec" id="about"><div class="wrap">
<p class="kick rise"><i></i>${t(C.aboutKick)}</p>
<h2 class="h2 rise">${C.aboutH[l]}</h2>
<div class="two"><figure class="lg-pic lift"><img src="${esc(pic(1))}"${srcset(pic(1))} sizes="(min-width: 1000px) 50vw, 100vw" alt="" width="1200" height="670" loading="lazy" decoding="async" referrerpolicy="no-referrer"></figure>
<div>${site.about ? `<p class="lead" style="margin-top:0">${esc(site.about)}</p>` : `<p class="lead" style="margin-top:0">${name}</p>`}
${perks.length ? `<p class="kick" style="margin-top:24px"><i></i>${t(C.whyKick)}</p><ul class="chk">${perks.map((x, i) => `<li class="${i % 2 ? "slider" : "slide"}">${ICON.check}<span>${esc(x)}</span></li>`).join("")}</ul>` : ""}</div></div>
<ol class="csteps">${C.steps.map((s) => `<li class="drop">${t(s)}</li>`).join("")}</ol>
${own.length ? "" : `<p class="mnote">${t(C.stock)}</p>`}
</div></section>`;

  // 8. Telegram-бот — доп из плана Cargo Pro.
  const bot = `<section class="sec" id="bot" style="background:var(--bg2)"><div class="wrap"><div class="botw">
<div><span class="ad-tag">${t(C.botTag)}</span>
<h2 class="h2 rise">${C.botH[l]}</h2>
<p class="lead rise">${t(C.botLead)}</p></div>
<div class="phone pop" aria-hidden="true"><div class="scr"><div class="tgh"><i></i><b>${name}</b></div><div class="chat" id="chat">${C.bot.map(([w, m]) => `<div class="bt ${w}">${t(m)}</div>`).join("")}</div></div></div>
</div></div></section>`;

  // 9. Пример заявки, как она придёт менеджеру.
  const demoRows: [Pair, string][] = [
    [C.demoWho, t(C.demoShop)],
    [C.demoRoute, `[[t:0]] → ${site.city ?? (l === "uz" ? "ombor" : "склад")}`],
    [C.demoWhat, services[0]?.name ?? t(C.kind)],
  ];
  const flow = `<section class="sec" id="flow"><div class="wrap"><div class="two" style="align-items:center">
<div><p class="kick rise"><i></i>${t(C.flowKick)} · ${t(C.ours)}</p><h2 class="h2 rise">${C.flowH[l]}</h2><p class="lead rise">${t(C.flowLead)}</p></div>
<div class="tgc glass pop"><div class="tgc-h">${ICON.tg}<b>${t(C.demoTitle)}</b><small>${t(C.demo)}</small></div><dl>${demoRows.map(([k, v]) => `<dt>${t(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>
</div></div></section>`;

  const faq = `<section class="sec" id="faq" style="background:var(--bg2)"><div class="wrap">
<p class="kick rise"><i></i>${t(C.faqKick)}</p>
<h2 class="h2 rise">${C.faqH[l]}</h2>
<div class="faq">${C.faq.map(([a, b], i) => `<details class="rise"${i === 0 ? " open" : ""}><summary>${t(a)}</summary><p>${t(b)}</p></details>`).join("")}</div>
</div></section>`;

  const map = site.address ? `https://yandex.uz/maps/?text=${encodeURIComponent(site.address)}` : null;
  const links = [
    tel ? `<a class="ph" href="${esc(tel)}">${esc(site.phone ?? "")}</a>` : "",
    tg ? `<a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">Telegram · @${esc(tg)}</a>` : "",
    wa ? `<a href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : "",
    ig ? `<a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">Instagram · @${esc(ig)}</a>` : "",
  ].join("");
  const contact = `<section class="sec" id="contact"><div class="wrap">
<p class="kick rise"><i></i>${t(C.contactKick)}</p>
<h2 class="h2 rise">${C.contactH[l]}</h2>
<div class="cnt"><div class="glass slide">${links}${site.hours ? `<p class="mu" style="margin:0">${ICON.clock.replace("<svg", '<svg style="width:18px;height:18px;vertical-align:-3px"')} ${esc(site.hours)}</p>` : ""}</div>
<div class="glass slider">${site.address ? `<p style="margin:0">${ICON.pin.replace("<svg", '<svg style="width:20px;height:20px;vertical-align:-4px;color:var(--ac)"')} ${esc(site.address)}</p>${map ? `<a class="btn btn-g" href="${esc(map)}" target="_blank" rel="noopener">${t(C.map)}${ICON.arrow}</a>` : ""}` : ""}<a class="btn btn-a" href="#calc">${ICON.calc}<span>${t(C.toCalc)}</span></a></div></div>
</div></section>`;

  const footer = `<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${logoHtml}${site.tagline ? `<p style="margin-top:16px;font-size:14px">${esc(site.tagline)}</p>` : ""}</div>
${services.length ? `<div><h4>${t(C.svcKick)}</h4>${services.slice(0, 6).map((s) => `<a href="#services">${esc(s.name)}</a>`).join("")}</div>` : ""}
<div><h4>${t(C.footClients)}</h4><a href="#calc">${t(C.toCalc)}</a><a href="#track">${t(C.nav.track)}</a><a href="#faq">${t(C.nav.faq)}</a></div>
<div><h4>${t(C.footLink)}</h4>${tel ? `<a href="${esc(tel)}">${esc(site.phone ?? "")}</a>` : ""}${tg ? `<a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">Telegram</a>` : ""}${wa ? `<a href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}</div>
</div>
<p class="warn-l">${t(C.rights)}</p>
<div class="sm"><span>${t(C.mockup)} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${t(C.terms)}</a></span><span>${t(C.source)} ${esc(site.source)}</span></div>
</div></footer>`;

  const dock = `<div class="dock glass" id="dock"><a class="btn btn-a" href="#calc">${ICON.calc}<span>${t(C.calcBtn)}</span></a>${tel ? `<a class="btn btn-g" href="${esc(tel)}">${ICON.phone}<span>${t(C.call)}</span></a>` : chat ? `<a class="btn btn-g" href="${esc(chat)}" target="_blank" rel="noopener">${chatIcon}<span>${tg ? "Telegram" : "WhatsApp"}</span></a>` : ""}</div>`;
  const sheet = `<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="shh"><div class="sh" data-close></div><div class="box"><div class="bh"><b id="shh"></b><button type="button" class="x" data-close aria-label="${t(C.close)}">${ICON.close}</button></div><div class="bb" id="shb"></div><div class="bf" id="shf"></div></div></div>`;

  const data = {
    l,
    name: site.name,
    tg,
    wa: wa ? wa.replace("https://wa.me/", "") : null,
    tel,
    // Префикс демо-номеров — первые буквы клиента латиницей, без чужих букв.
    pre: (site.name.normalize("NFKD").replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "GR"),
    t: JS[l],
  };

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(C.kind).toLowerCase()}</title>
<meta name="description" content="${esc(`${site.name}. ${t(C.desc)}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0c1329">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Onest:wght@400;700&display=swap">
<style>${assets.css}
:root{${logistikaPalette(site.color)}}
.lg-logo{gap:10px;max-width:58vw;color:#fff}
.lg-logo b{font:700 16px/1.1 var(--hd);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lg-logo img+b{display:none}
@media (min-width:600px){.lg-logo img+b{display:inline}}
.lg-call{margin-left:auto}
@media (min-width:1100px){.lg-call{margin-left:8px}}
.hero h1 .w>span{overflow-wrap:anywhere}
.hero h1 em{font-style:normal;background:var(--gr);-webkit-background-clip:text;background-clip:text;color:transparent}
.hsub{margin:20px 0 0;color:var(--tx2);font-size:18px;max-width:620px}
.lg-stock{margin-top:16px}
.lg-pr{color:var(--y);font-weight:700}
.lg-route{grid-template-columns:1fr 1fr!important}
.lg-own{display:grid;gap:8px;padding-top:12px;border-top:1px solid var(--ln2)}
.lg-ask{font:700 20px/1.2 var(--hd)!important}
.lg-pic{margin:0;border-radius:28px;overflow:hidden;border:1px solid var(--ln)}
.lg-pic img{width:100%;height:100%;object-fit:cover;aspect-ratio:16/10}
.tgc{border-radius:24px;padding:20px;max-width:440px;width:100%;justify-self:center}
.tgc-h{display:flex;align-items:center;gap:10px}
.tgc-h svg{width:26px;height:26px;color:var(--y)}
.tgc-h small{margin-left:auto;font-size:12px;color:var(--mu);padding:4px 10px;border-radius:999px;background:rgb(255 255 255 / .06)}
.tgc dl{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin:16px 0 0}
.tgc dt{color:var(--mu)}
.tgc dd{margin:0;font-weight:700;overflow-wrap:anywhere}
.mnote{margin:0;font-size:12px;color:var(--mu)}</style>
</head>
<body>
${dzIntroSolo(l)}
${DEFS}
<a class="vh" href="#calc">${t(C.toMain)}</a>
${header}
<main>
${hero}
${velo}
${svc}
${calc}
${track}
${cus}
${about}
${bot}
${flow}
${faq}
${contact}
</main>
${footer}
${dock}
${sheet}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="lg-data">${json(data)}</script>
<script>
${PAGE_JS}</script>
</body>
</html>`;
}

/**
 * Поведение страницы — приёмами site.js Cargo Pro: шапка прячется при любой
 * прокрутке и возвращается через 3 секунды, блоки появляются каждый своим
 * движением, стекло подсвечивается за курсором, бегущие строки ускоряются
 * от прокрутки. Заявка ложится в память браузера (lg-req-1) — её видит
 * админка; статус груза ставит админка (lg-panel-1), и его видно здесь в
 * «Мои заявки» и в отслеживании. Демо-номера и компании — в скрипте:
 * компании — словами-ловушками, номера — с буквами клиента.
 */
const PAGE_JS = `(function(){
var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};
var D=JSON.parse($('#lg-data').textContent),T=D.t;
var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function get(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,' ')}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var toastT=0;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},/*~*/2400)}
var top=$('.top'),dock=$('#dock'),IDLE=3000,idleT=0;
function headIdle(){if(!top)return;clearTimeout(idleT);if(!top.contains(d.activeElement))top.classList.add('hide');idleT=setTimeout(function(){top.classList.remove('hide')},IDLE)}
$$('.hero h1 .w>span').forEach(function(s,i){s.style.transitionDelay=(120+i*70)+'ms'});
requestAnimationFrame(function(){var h1=$('.hero h1');if(h1)h1.classList.add('on');$$('.hero .rise').forEach(function(e){e.classList.add('on')})});
var io='IntersectionObserver'in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
$$('.rise,.tilt,.pop,.slide,.slider,.lift,.drop,.flip,.chat').forEach(function(e){if(e.closest('.hero'))return;if(io&&!RM)io.observe(e);else e.classList.add('on')});
d.addEventListener('pointermove',function(e){var g=e.target.closest&&e.target.closest('.glass');if(g){var r=g.getBoundingClientRect();g.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');g.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%')}
  var c=e.target.closest&&e.target.closest('.sv');if(c){var q=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-q.left)+'px');c.style.setProperty('--my',(e.clientY-q.top)+'px')}},{passive:true});
var velo=$$('.velo .row'),vx=[0,0],lastY=scrollY,speed=0,ticking=false,par=$$('[data-par]');
function frame(){if(ticking)return;ticking=true;requestAnimationFrame(tick)}
function tick(){ticking=false;var y=scrollY,vh=innerHeight;speed=speed*0.86+(y-lastY)*.14;lastY=y;
  if(y<vh*1.5&&!RM)par.forEach(function(e){var k=+e.getAttribute('data-par');e.style.transform='translate3d(0,'+(y*k).toFixed(1)+'px,0)'});
  if(dock)dock.classList.toggle('hide',y<vh*.6||!!$('.sheet.on'))}
function veloLoop(){if(!RM&&!d.hidden){var v=1+Math.min(6,Math.abs(speed)*.25);velo.forEach(function(r,i){var wd=r.scrollWidth/3;vx[i]=(vx[i]+(i?-1:1)*v*.6)%wd;r.style.transform='translate3d('+(i?vx[i]-wd:-vx[i]).toFixed(1)+'px,0,0)'})}requestAnimationFrame(veloLoop)}
addEventListener('scroll',function(){headIdle();frame()},{passive:true});addEventListener('resize',frame);frame();
if(velo.length)veloLoop();
/* Заявка на расчёт. */
var st={m:null,kg:250,m3:1.2},kgI=$('#kg'),m3I=$('#m3');
var mb=$$('#modes [data-m]');if(mb.length)st.m=mb[0].getAttribute('data-m');
function setMode(m){st.m=m;$$('[data-m],[data-qm]').forEach(function(b){b.setAttribute('aria-pressed',(b.getAttribute('data-m')||b.getAttribute('data-qm'))===m)});calc()}
function opts(){return[['oins',T.ins],['ocus',T.cus],['odoor',T.door],['ocons',T.cons]].filter(function(o){var e=$('#'+o[0]);return e&&e.checked}).map(function(o){return o[1]})}
function val(id){var e=$('#'+id);return e?e.value.trim():''}
function lines(){var out=[];var r=[val('cfrom'),val('cto')].filter(Boolean).join(' → ');if(r)out.push([T.from+' → '+T.to,r]);
  if(st.m)out.push([T.tr,T.mode[st.m]]);var wh=val('cwhat');if(wh)out.push([T.what,wh]);
  out.push([T.wv,fmt(st.kg)+' '+T.kg+' · '+String(st.m3).replace('.',D.l==='ru'?',':'.')+' '+T.m3]);var o=opts();if(o.length)out.push([T.extra,o.join(', ')]);return out}
function calc(){st.kg=+kgI.value;st.m3=+m3I.value;$('#kgv').textContent=fmt(st.kg)+' '+T.kg;$('#m3v').textContent=String(st.m3).replace('.',D.l==='ru'?',':'.')+' '+T.m3;
  $('#tsum').innerHTML=lines().map(function(l){return'<div class="li"><span>'+esc(l[0])+'</span><b>'+esc(l[1])+'</b></div>'}).join('')}
$$('#modes [data-m]').forEach(function(b){b.addEventListener('click',function(){setMode(b.getAttribute('data-m'))})});
$$('[data-qm]').forEach(function(b){b.addEventListener('click',function(){setMode(b.getAttribute('data-qm'))})});
['#kg','#m3','#oins','#ocus','#odoor','#ocons','#cfrom','#cto','#cwhat'].forEach(function(s){var e=$(s);if(e){e.addEventListener('input',calc);e.addEventListener('change',calc)}});
calc();
$('#qc').addEventListener('submit',function(e){e.preventDefault();var f=$('#qfrom').value.trim(),to=$('#qto').value.trim(),k=+$('#qkg').value;if(f)$('#cfrom').value=f;if(to)$('#cto').value=to;if(k>0){kgI.value=Math.max(10,Math.min(20000,Math.round(k/10)*10))}calc();$('#calc').scrollIntoView()});
$$('[data-what]').forEach(function(a){a.addEventListener('click',function(){$('#cwhat').value=a.getAttribute('data-what');var m=a.getAttribute('data-mode');if(m&&$('#modes [data-m="'+m+'"]'))setMode(m);else calc()})});
/* Окно. */
var sheet=$('#sheet');
function open(title,body,foot){$('#shh').textContent=title;$('#shb').innerHTML=body;$('#shf').innerHTML=foot||'';sheet.classList.add('on');d.body.style.overflow='hidden';frame();var f=$('input,button',$('#shb'))||$('.x',sheet);f.focus()}
function close(){sheet.classList.remove('on');d.body.style.overflow='';frame()}
sheet.addEventListener('click',function(e){if(e.target.closest('[data-close]'))close()});
addEventListener('keydown',function(e){if(e.key==='Escape'&&sheet.classList.contains('on'))close()});
function reqs(){return get('lg-req-1',[])}
function stOf(id,def){var P=get('lg-panel-1',{});return P.st&&P.st[id]!==undefined?P.st[id]:def}
function summary(){return lines().map(function(l){return(l[0]?l[0]+': ':'')+l[1]}).join('\\n')+'\\n'+T.tot}
function chatHref(text){return D.tg?'https://t.me/'+D.tg:D.wa?'https://wa.me/'+D.wa+'?text='+encodeURIComponent(text):D.tel}
$('#send').addEventListener('click',function(){
  open(T.req,'<pre class="calc-l" style="white-space:pre-wrap;margin:0 0 12px">'+esc(summary())+'</pre><label class="fld"><span>'+T.name+'</span><input id="rn" autocomplete="name"></label><label class="fld"><span>'+T.co+'</span><input id="rc" autocomplete="organization"></label><label class="fld"><span>'+T.phone+'</span><input id="rp" type="tel" autocomplete="tel" placeholder="+998"></label>','<button type="button" class="btn btn-a" id="rgo">'+T.send+'</button>');
  $('#rgo').addEventListener('click',function(){var n=$('#rn').value.trim(),p=$('#rp').value.trim();if(!n||p.replace(/\\D/g,'').length<7){toast(T.need);return}
    var all=reqs(),id=D.pre+'-'+(24200+all.length+1),route=[val('cfrom'),val('cto')].filter(Boolean).join(' → ');
    var o={id:id,at:Date.now(),n:n,co:$('#rc').value.trim(),ph:p,from:route,m:st.m,cw:st.kg,ct:'',txt:summary()};
    all.unshift(o);put('lg-req-1',all);mineBtn();
    var body=T.req+' '+id+'\\n'+summary()+'\\n'+T.name+': '+n+(o.co?' · '+o.co:'')+'\\n'+T.phone+': '+p;
    try{navigator.clipboard&&navigator.clipboard.writeText(body).catch(function(){})}catch(e){}
    var href=chatHref(body);
    $('#shb').innerHTML='<div class="okk">'+T.ok+': '+id+'</div><p class="mu">'+T.okp+'</p>';
    $('#shf').innerHTML=(href?'<a class="btn btn-a" href="'+esc(href)+'" target="_blank" rel="noopener">'+(D.tg||D.wa?T.chat:T.call)+'</a>':'')+'<button type="button" class="btn btn-g" data-close>OK</button>';
    if(D.tg)toast(T.toast)})});
/* «Мои заявки» и отслеживание: статус ставит админка. */
var TN=['[[t:0]]','[[t:2]]','[[t:3]]'];
var DEMO={};DEMO[D.pre+'-24117']={m:'air',s:4,co:T.co2+' «'+TN[0]+'»',wh:T.wh+' '+TN[1]};DEMO[D.pre+'-24109']={m:'auto',s:3,co:T.co2+' «'+TN[2]+'»',wh:T.wh+' '+TN[0]};DEMO[D.pre+'-24095']={m:'sea',s:5,co:T.co2+' «'+TN[1]+'»',wh:T.wh+' '+TN[2]};
function mineBtn(){var b=$('#mine');if(b)b.classList.toggle('on',reqs().length>0)}
mineBtn();
function find(no){no=no.trim().toUpperCase();var r=reqs().filter(function(x){return x.id===no})[0];if(r)return{id:r.id,m:r.m,s:stOf(r.id,0),co:r.co||r.n,wh:'',route:r.from};var x=DEMO[no];return x?{id:no,m:x.m,s:stOf(no,x.s),co:x.co,wh:x.wh,demo:1}:null}
function timeline(o){return'<h3>'+esc(o.id)+(o.route?' · '+esc(o.route):'')+'</h3><p class="mu">'+(o.m?T.mode[o.m]+' · ':'')+esc(o.co)+(o.demo?' · '+T.demo:'')+'</p><ol>'+T.st.map(function(s,i){return'<li class="'+(i<o.s?'d':i===o.s?'c':'')+'"><i aria-hidden="true"></i><span><b>'+s+'</b>'+(i===2&&o.wh?'<small>'+esc(o.wh)+'</small>':'')+'</span></li>'}).join('')+'</ol>'}
var tl=$('#tl');
function showTrack(no){var o=find(no);tl.innerHTML=o?timeline(o):'<h3>'+esc(no)+'</h3><p class="mu">'+T.notFound+'</p>'}
$('#trkex').innerHTML=Object.keys(DEMO).concat(reqs().slice(0,2).map(function(r){return r.id})).map(function(n){return'<button type="button" data-tn="'+esc(n)+'">'+esc(n)+'</button>'}).join('');
$('#trkn').placeholder=Object.keys(DEMO)[0];
$('#trkf').addEventListener('submit',function(e){e.preventDefault();showTrack($('#trkn').value)});
$('#trkex').addEventListener('click',function(e){var b=e.target.closest('[data-tn]');if(!b)return;$('#trkn').value=b.getAttribute('data-tn');showTrack(b.getAttribute('data-tn'))});
$('#mine').addEventListener('click',function(){var all=reqs();open(T.mine,all.length?all.map(function(r){var o=find(r.id);return'<div class="tl" style="min-height:0">'+timeline(o)+'<pre class="calc-l" style="white-space:pre-wrap">'+esc(r.txt)+'</pre></div>'}).join(''):'<p class="mu">'+T.none+'</p>')});
addEventListener('storage',function(e){if(e.key==='lg-panel-1'||e.key==='lg-req-1'){mineBtn();var v=$('#trkn');if(v&&v.value)showTrack(v.value)}});
var dk=$('#dkind');function docs(){$('#dlist').innerHTML=T.docs[+dk.value].map(function(x){return'<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>'+esc(x)+'</li>'}).join('')}
if(dk){dk.addEventListener('change',docs);docs()}
})();`;
