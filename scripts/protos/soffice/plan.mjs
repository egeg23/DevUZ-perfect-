// Стоимость сайта Soffice по этому макету: акция 48 часов и допы тумблерами,
// как в tovar/plan.mjs и karomat/plan.mjs.
//
// Основа — корпоративный сайт из PROMO (lib/admin/mockup-offer): 1 000 $
// вместо 2 500 $, если начинаем в течение 48 часов. Это то, что у soffice.uz
// уже есть, в новом виде: главная, страницы 18 бизнес-центров, о компании,
// статьи, контакты, на русском и узбекском. Всё, что в макете работает сверх
// этого, — допы. Цены допов — часы × 20 $ (ставка веб-студий Ташкента, как в
// tovar); владелец цену не назвал, поэтому в отчёте: «цены — по образцу,
// подтвердите».
//
// Все цены макета живут здесь, и только здесь.

export const BASE = {
  price: 2500,
  promo: 1000,
  weeks: [3, 5],
  ru: {
    t: "Корпоративный сайт Soffice",
    d: "Главная из этого макета, страница каждого из 18 бизнес-центров с фото и подписями, о компании, статьи, контакты, русский и узбекский, под телефон и компьютер",
  },
  uz: {
    t: "Soffice korporativ sayti",
    d: "Shu maketdagi bosh sahifa, 18 ta biznes-markazning har biri uchun suratli va izohli sahifa, kompaniya haqida, maqolalar, kontaktlar, rus va o‘zbek tillari, telefon va kompyuter uchun",
  },
  en: {
    t: "Soffice corporate website",
    d: "The home page from this mockup, a page for each of the 18 buildings with captioned photos, about, articles, contacts, Russian and Uzbek, for phone and desktop",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/** Ставка за час работы, $: как в tovar/plan.mjs. */
export const RATE = 20;

/* star — Soffice нужно первым; new — механики, которых нет у ташкентских конкурентов. */
export const ADDONS = [
  { id: "catalog", h: 30, star: true, new: true,
    ru: { t: "Каталог бизнес-центров с фильтрами и картой", e: "Подбор по площади, району, бюджету и формату, карта всех БЦ с ценой в месяц" },
    uz: { t: "Filtrli va xaritali biznes-markazlar katalogi", e: "Maydon, tuman, byudjet va format bo‘yicha tanlash, barcha BM oylik narx bilan xaritada" },
    en: { t: "Building catalogue with filters and map", e: "Search by size, district, budget and format; every building on the map with a monthly price" } },
  { id: "calc", h: 6, star: true, new: true,
    ru: { t: "Калькулятор «Сколько это в месяц»", e: "Площадь × ставка: в месяц и в год, с НДС и без, по каждому бизнес-центру" },
    uz: { t: "«Bu oyiga qancha» kalkulyatori", e: "Maydon × stavka: oyiga va yiliga, QQS bilan va QQSsiz, har bir biznes-markaz bo‘yicha" },
    en: { t: "“What is that per month” calculator", e: "Size × rate: monthly and yearly, with and without VAT, for each building" } },
  { id: "floors", h: 24, new: true,
    ru: { t: "Схемы этажей со свободными блоками", e: "Рисуем по вашим поэтажным планам, свободные блоки отмечает менеджер в панели" },
    uz: { t: "Bo‘sh bloklar bilan qavat sxemalari", e: "Qavat rejalaringiz bo‘yicha chizamiz, bo‘sh bloklarni menejer panelda belgilaydi" },
    en: { t: "Floor plans with free units", e: "Drawn from your floor plans; managers mark free units in the panel" } },
  { id: "booking", h: 10, star: true, new: true,
    ru: { t: "Запись на просмотр в два нажатия", e: "День и время, и заявка с бизнес-центром и площадью сразу у менеджера" },
    uz: { t: "Ikki bosishda ko‘rishga yozilish", e: "Kun va vaqt, biznes-markaz va maydon bilan ariza darhol menejerda" },
    en: { t: "Two-tap viewing booking", e: "Day and time; the request with building and size goes straight to a manager" } },
  { id: "compare", h: 8, new: true,
    ru: { t: "Сравнение бизнес-центров", e: "До трёх центров рядом: класс, ставка, сумма в месяц, метро, парковка" },
    uz: { t: "Biznes-markazlarni solishtirish", e: "Uchtagacha markaz yonma-yon: sinf, stavka, oylik summa, metro, avtoturargoh" },
    en: { t: "Compare buildings", e: "Up to three side by side: class, rate, monthly cost, metro, parking" } },
  { id: "crm", h: 16, star: true,
    ru: { t: "Связь с amoCRM или Bitrix24", e: "Каждая заявка с сайта сделкой в CRM: откуда пришла, какой БЦ и площадь" },
    uz: { t: "amoCRM yoki Bitrix24 bilan bog‘lanish", e: "Saytdagi har bir ariza CRMda bitim: qayerdan kelgan, qaysi BM va maydon" },
    en: { t: "amoCRM or Bitrix24 link", e: "Every website request becomes a CRM deal: source, building and size" } },
  { id: "tgbot", h: 16,
    ru: { t: "Telegram-бот для заявок", e: "Заявки и записи на просмотр приходят менеджерам в Telegram, с кнопкой «Взял»" },
    uz: { t: "Arizalar uchun Telegram-bot", e: "Arizalar va ko‘rishga yozilishlar menejerlarga Telegramda «Oldim» tugmasi bilan keladi" },
    en: { t: "Telegram bot for requests", e: "Requests and viewings reach managers on Telegram with a “Mine” button" } },
  { id: "tours", h: 20,
    ru: { t: "3D-туры по офисам", e: "Встраиваем ваши туры в страницы БЦ и блоков; съёмку туров считаем отдельно" },
    uz: { t: "Ofislar bo‘ylab 3D-turlar", e: "Turlaringizni BM va blok sahifalariga joylaymiz; turlarni suratga olish alohida" },
    en: { t: "3D office tours", e: "Your tours embedded in building and unit pages; filming is priced separately" } },
  { id: "panel", h: 40, star: true,
    ru: { t: "Панель для менеджеров", e: "Свободные блоки, ставки, фото и заявки меняются без программиста, сразу на сайте" },
    uz: { t: "Menejerlar uchun panel", e: "Bo‘sh bloklar, stavkalar, suratlar va arizalar dasturchisiz o‘zgaradi, darhol saytda" },
    en: { t: "Manager panel", e: "Free units, rates, photos and requests updated without a developer, live on the site" } },
  { id: "en", h: 8,
    ru: { t: "Английская версия", e: "Для представительств иностранных компаний: весь сайт на английском" },
    uz: { t: "Inglizcha versiya", e: "Xorijiy kompaniyalar vakolatxonalari uchun: butun sayt inglizcha" },
    en: { t: "English version", e: "For foreign companies’ offices: the whole site in English" } },
  { id: "maps", h: 8,
    ru: { t: "Данные для Google и Яндекс Карт", e: "Soffice и каждый БЦ в поиске с адресом, телефоном и часами, подписи у всех фото" },
    uz: { t: "Google va Yandex Xaritalar uchun ma’lumotlar", e: "Soffice va har bir BM qidiruvda manzil, telefon va ish vaqti bilan, barcha suratlarda izoh" },
    en: { t: "Data for Google and Yandex Maps", e: "Soffice and every building in search with address, phone and hours; all photos captioned" } },
].map((a) => ({ ...a, price: a.h * RATE }));

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
