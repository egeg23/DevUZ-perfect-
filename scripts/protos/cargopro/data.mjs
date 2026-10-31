// Факты CARGO PRO GROUP — только с их сайта cargoprogroup.uz (снято
// 31.10.2026, главная одной страницей: услуги, о нас, преимущества, партнёры,
// контакты). Чего у них на сайте нет, здесь нет: цен, сроков, числа клиентов,
// лет на рынке. Ставки калькулятора — tariffs.mjs, это ориентир рынка и
// предложение DevUz, не их прайс. Источники — SOURCES.md.

export const LANGS = ["ru", "uz"];

export const COMPANY = {
  name: "CARGO PRO GROUP",
  legal: "OOO «CARGO PRO GROUP»",
  slogan: "Bringing the world closer", // их логотип
  phones: [
    ["+998 78 148 0888", "+998781480888"],
    ["+998 95 710 0888", "+998957100888"],
    ["+998 55 515 88 08", "+998555158808"],
  ],
  tel: "+998781480888",
  phone: "+998 78 148 0888",
  email: "info@cargoprogroup.com",
  site: "https://cargoprogroup.uz",
  address: {
    ru: "100025, Ташкент, Яккасарайский район, улица Абдуллы Каххара, 56А",
    uz: "100025, Toshkent, Yakkasaroy tumani, Abdulla Qahhor ko‘chasi, 56A",
  },
  map: "https://yandex.uz/maps/?text=" + encodeURIComponent("Ташкент, улица Абдуллы Каххара, 56А"),
};

/* Их услуги — названия с их сайта («Наши услуги» и слайдер первого экрана). */
export const SERVICES = [
  { id: "air", ru: { t: "Авиаперевозки", d: "Авиа перевозки грузов по всему миру. Мы официальный грузовой агент восьми авиакомпаний." }, uz: { t: "Avia tashish", d: "Butun dunyo bo‘ylab yuklarni avia tashish. Biz sakkiz aviakompaniyaning rasmiy yuk agentimiz." } },
  { id: "auto", ru: { t: "Автоперевозки", d: "Автомобильные перевозки по всему миру, импорт и экспорт." }, uz: { t: "Avto tashish", d: "Butun dunyo bo‘ylab avtomobil tashish, import va eksport." } },
  { id: "rail", ru: { t: "Ж/д контейнерные", d: "Железнодорожные контейнерные перевозки, импорт и экспорт." }, uz: { t: "Temir yo‘l konteyner", d: "Temir yo‘l konteyner tashish, import va eksport." } },
  { id: "sea", ru: { t: "Морские перевозки", d: "Морские перевозки по всему миру, импорт и экспорт." }, uz: { t: "Dengiz tashish", d: "Butun dunyo bo‘ylab dengiz tashish, import va eksport." } },
  { id: "multi", ru: { t: "Мультимодальные", d: "Несколько видов транспорта в одной перевозке: авиа, море, ж/д и авто." }, uz: { t: "Multimodal", d: "Bitta tashishda bir nechta transport turi: avia, dengiz, temir yo‘l va avto." } },
  { id: "customs", ru: { t: "Таможенный брокер", d: "Таможенный брокер и декларант на всей территории Узбекистана." }, uz: { t: "Bojxona brokeri", d: "O‘zbekistonning butun hududida bojxona brokeri va deklarant." } },
];

/* «Таможенный брокер / декларант» — их список, слово в слово по смыслу. */
export const CUSTOMS = {
  ru: [
    "Подготовка документов для экспортных, импортных и транзитных процедур, представление клиента на таможне при декларировании",
    "Предоставление груза и сопроводительных документов для таможенного оформления",
    "Оформление таможенных разрешений, справок и сертификатов",
    "Оплата таможенных платежей: сборов, акцизов, пошлин",
    "Участие в консолидации и досмотре грузов",
    "Отслеживание правил пересечения государственной границы",
  ],
  uz: [
    "Eksport, import va tranzit tartiblari uchun hujjatlar tayyorlash, deklaratsiyada mijozni bojxonada taqdim etish",
    "Bojxona rasmiylashtiruvi uchun yuk va kuzatuv hujjatlarini taqdim etish",
    "Bojxona ruxsatnomalari, ma’lumotnomalar va sertifikatlarni rasmiylashtirish",
    "Bojxona to‘lovlarini to‘lash: yig‘imlar, aksizlar, bojlar",
    "Yuklarni konsolidatsiya qilish va ko‘rikdan o‘tkazishda ishtirok etish",
    "Davlat chegarasini kesib o‘tish qoidalarini kuzatib borish",
  ],
};

/* «Наши преимущества» и «О нас» — их формулировки. */
export const FACTS = {
  ru: {
    lead: "Перевозки всех видов грузов, включая опасные, негабаритные и с температурным режимом, импорт и экспорт.",
    pros: ["Один из лидеров по авиа грузоперевозкам", "Быстрая обработка грузов", "Расчёты в UZS, USD, EUR, AED"],
    agent: "Квалифицированный экспедитор и официальный грузовой агент",
    hubs: "Складирование и консолидация груза в ОАЭ, Узбекистане и Индии",
    kinds: ["Генеральные грузы", "Опасные грузы", "Негабаритные грузы", "Промышленное оборудование", "Государственные проекты", "Температурный режим"],
  },
  uz: {
    lead: "Barcha turdagi yuklarni, jumladan xavfli, gabaritdan tashqari va harorat rejimidagi yuklarni tashish, import va eksport.",
    pros: ["Avia yuk tashish bo‘yicha yetakchilardan biri", "Yuklarni tez qayta ishlash", "UZS, USD, EUR, AED’da hisob-kitob"],
    agent: "Malakali ekspeditor va rasmiy yuk agenti",
    hubs: "BAA, O‘zbekiston va Hindistonda yuklarni saqlash va konsolidatsiya qilish",
    kinds: ["Bosh yuklar", "Xavfli yuklar", "Gabaritdan tashqari yuklar", "Sanoat uskunalari", "Davlat loyihalari", "Harorat rejimi"],
  },
};

/* Партнёры — авиакомпании из их раздела «Наши партнёры». Пишем названием, без их логотипов. */
export const PARTNERS = ["Uzbekistan Airways", "Silk Way West", "My Freighter", "Turkish Airlines", "Utair", "Korean Air", "Air Arabia", "flydubai"];

/* Склады: где у них складирование и консолидация (их слова). Точки — для схемы. */
export const HUBS = [
  { id: "uae", x: 300, y: 300, ru: { t: "ОАЭ", c: "Дубай" }, uz: { t: "BAA", c: "Dubay" } },
  { id: "uz", x: 520, y: 150, ru: { t: "Узбекистан", c: "Ташкент" }, uz: { t: "O‘zbekiston", c: "Toshkent" } },
  { id: "in", x: 640, y: 330, ru: { t: "Индия", c: "Дели" }, uz: { t: "Hindiston", c: "Dehli" } },
];

/* Ролики-крючки бегущей строки: их услуги и их преимущества. */
export const VELO = {
  ru: ["Авиа", "Авто", "Ж/д контейнеры", "Море", "Мультимодальные", "Таможенный брокер", "Склады в ОАЭ, Узбекистане, Индии", "UZS · USD · EUR · AED"],
  uz: ["Avia", "Avto", "Temir yo‘l konteynerlari", "Dengiz", "Multimodal", "Bojxona brokeri", "BAA, O‘zbekiston, Hindistonda omborlar", "UZS · USD · EUR · AED"],
};
