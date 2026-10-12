// Конструктор цены, как у Enotmebel: плашка «Конструктор» на каждой странице,
// тумблер включает и выключает настоящий блок на странице, итог «сайт + допы»
// считается сразу. То, чего на макете нет (админка, английский, страницы под
// поиск), — группа «Сверх сайта» на странице «Что дальше».
//
// Владелец, 12.10.2026: «стоимость для клиента без допов 1 700 $, с допами не
// больше 3 000 $, в допы ставь то, что клиенту реально нужно». Раскладка:
// сайт 1 700 $, допы на макете 870 $, сверх сайта 430 $, со всеми тумблерами
// ровно 3 000 $. Середина рынка Ташкента: корпоративный сайт на двух языках с
// управлением примерно 800-2 000 $, с расчётом, 3D и админкой от 2 000 $
// (docs/research/lider-prof.md). Держит tests/proto-bundles.test.ts.

/** Сайт: главная, услуги, 61 проект, страница проекта, контакты, ru и uz. */
export const BASE = {
  price: 1700,
  ru: {
    t: "Сайт студии: главная, услуги, все проекты, страница проекта, контакты",
    d: "61 проект с фото и описанием на русском и узбекском, семь услуг по этапам, заказчики, контакты и заявка в Telegram с готовым текстом. Делаем в первую очередь под телефон.",
  },
  uz: {
    t: "Studiya sayti: bosh sahifa, xizmatlar, barcha loyihalar, loyiha sahifasi, kontaktlar",
    d: "Rus va o‘zbek tillarida foto va tavsifli 61 loyiha, bosqichma-bosqich yettita xizmat, buyurtmachilar, kontaktlar va tayyor matnli Telegram ariza. Avvalo telefon uchun qilamiz.",
  },
};

/**
 * Блоки, которые видно на макете. `where` — ключ страницы ("" — главная,
 * "proekty", "proekt") или "all". На странице блок помечен
 * data-addon="<id>"; выключили — его нет.
 */
export const ADDONS = [
  {
    id: "intro", where: "", price: 100,
    ru: { t: "Влёт в логотип", e: "Буквы LIDER PROF PROEKT вырастают, как здания, внутри видна ваша визуализация, камера влетает в «O» и открывает сайт" },
    uz: { t: "Logotipga uchib kirish", e: "LIDER PROF PROEKT harflari binolar kabi o‘sib chiqadi, ichida vizualizatsiyangiz ko‘rinadi, kamera «O» ichiga uchib kirib saytni ochadi" },
  },
  {
    id: "story", where: "", price: 220, star: true,
    ru: { t: "Сцена при прокрутке: генплан, чертёж, интерьер, ландшафт", e: "Листаете вниз, а камера спускается к Олимпийскому центру, чертёж фасада становится зданием, вы заходите внутрь и смотрите на махаллю сверху" },
    uz: { t: "Aylantirishda sahna: bosh reja, chizma, interyer, landshaft", e: "Pastga aylantirasiz, kamera Olimpiya markaziga tushadi, fasad chizmasi binoga aylanadi, ichkariga kirasiz va mahallaga yuqoridan qaraysiz" },
  },
  {
    id: "filters", where: "proekty", price: 90,
    ru: { t: "Фильтр проектов по шести направлениям", e: "Общественные, жилые, производственные, генпланы, ландшафт и интерьер: нажали, и остались только нужные" },
    uz: { t: "Loyihalarni oltita yo‘nalish bo‘yicha saralash", e: "Jamoat, turar joy, ishlab chiqarish, bosh rejalar, landshaft va interyer: bosdingiz, faqat keraklisi qoldi" },
  },
  {
    id: "stats", where: "proekt", price: 70,
    ru: { t: "Цифры проекта на виду", e: "Гектары, квадратные метры, квартиры, места и этажность из вашего описания стоят крупно над текстом" },
    uz: { t: "Loyiha raqamlari ko‘zga tashlanadi", e: "Tavsifingizdagi gektarlar, kvadrat metrlar, xonadonlar, o‘rinlar va qavatlar matn ustida yirik turadi" },
  },
  {
    id: "calc", where: "", price: 160, star: true,
    ru: { t: "Расчёт проекта по площади, с брифом и планом", e: "Тип объекта, площадь, стадии и город: человек видит, что войдёт в работу, и отправляет бриф в Telegram, план прикладывает следом" },
    uz: { t: "Maydon bo‘yicha loyiha hisobi, brif va reja bilan", e: "Obyekt turi, maydon, bosqichlar va shahar: odam ishga nima kirishini ko‘radi va brifni Telegramga yuboradi, rejani ortidan biriktiradi" },
  },
  {
    id: "pano", where: "", price: 130,
    ru: { t: "Просмотр 360° интерьеров", e: "Кадр поворачивается пальцем или мышкой, на телефоне ещё и наклоном. В работе ставим ваши панорамы из программы визуализации" },
    uz: { t: "Interyerlarni 360° ko‘rish", e: "Kadr barmoq yoki sichqoncha bilan buriladi, telefonda qiyshaytirish bilan ham. Ishda vizualizatsiya dasturingizdagi panoramalarni qo‘yamiz" },
  },
  {
    id: "trust", where: "", price: 60,
    ru: { t: "Заказчики, отзыв и карта объектов", e: "Логотипы DreamLand, NBU, SQB, Минстроя и других лентой, отзыв клиента и города, где стоят ваши проекты" },
    uz: { t: "Buyurtmachilar, sharh va obyektlar xaritasi", e: "DreamLand, NBU, SQB, Qurilish vazirligi va boshqalar logotiplari lentada, mijoz sharhi va loyihalaringiz turgan shaharlar" },
  },
  {
    id: "motion", where: "all", price: 40,
    ru: { t: "Своё движение у каждого блока", e: "Карточки проектов встают, как этажи, этапы прочерчиваются линией, числа набегают" },
    uz: { t: "Har bir blokda o‘z harakati", e: "Loyiha kartochkalari qavatlar kabi joyiga tushadi, bosqichlar chiziq bilan chiziladi, raqamlar o‘sib boradi" },
  },
];

/**
 * Сверх сайта: блока на макете нет, на странице «Что дальше» — описание.
 * `needs` — без чего не работает: включается вместе с ним.
 */
export const BLOCKS = [
  {
    id: "admin", price: 180, needs: [], star: true,
    ru: { t: "Админ-панель: проекты, фото, заявки", why: "Новый проект с фото, цифрами и описанием на двух языках добавляете с телефона за пару минут, без программиста. Заявки из Telegram и формы видно одним списком.", li: ["Проекты: фото, цифры, направления", "Тексты на ru и uz", "Заявки и кто ответил"] },
    uz: { t: "Admin panel: loyihalar, fotolar, arizalar", why: "Foto, raqamlar va ikki tildagi tavsifli yangi loyihani dasturchisiz, telefondan bir necha daqiqada qo‘shasiz. Telegram va formadan arizalar bitta ro‘yxatda ko‘rinadi.", li: ["Loyihalar: foto, raqamlar, yo‘nalishlar", "ru va uz matnlar", "Arizalar va kim javob berdi"] },
  },
  {
    id: "en", price: 120, needs: [],
    ru: { t: "Английская версия", why: "Для международных заказчиков и инвесторов: проекты, услуги и заявка на английском. Переключатель RU / UZ / EN в шапке.", li: ["Проекты и услуги на английском", "Заявка на языке посетителя", "Переключатель в шапке"] },
    uz: { t: "Ingliz tilidagi versiya", why: "Xalqaro buyurtmachilar va investorlar uchun: loyihalar, xizmatlar va ariza ingliz tilida. Sarlavhada RU / UZ / EN almashtirgich.", li: ["Loyihalar va xizmatlar inglizcha", "Ariza tashrif buyuruvchi tilida", "Sarlavhada almashtirgich"] },
  },
  {
    id: "seo", price: 130, needs: [],
    ru: { t: "Страницы под поиск: услуга × город", why: "Человек ищет «проектирование школ Ташкент» или «дизайн интерьера Самарканд» и попадает на вашу страницу с похожими проектами, а не к соседу по выдаче. Сейчас проекты сайт подгружает скриптом, и поисковик их почти не видит.", li: ["Семь услуг × города", "Проекты в коде страницы", "Карточка компании в поиске"] },
    uz: { t: "Qidiruv uchun sahifalar: xizmat × shahar", why: "Odam «Toshkentda maktab loyihalash» yoki «Samarqandda interyer dizayni» deb qidiradi va qo‘shni saytga emas, o‘xshash loyihalar bilan sizning sahifangizga tushadi. Hozir sayt loyihalarni skript bilan yuklaydi va qidiruv tizimi ularni deyarli ko‘rmaydi.", li: ["Yettita xizmat × shaharlar", "Loyihalar sahifa kodida", "Qidiruvda kompaniya kartochkasi"] },
  },
];
