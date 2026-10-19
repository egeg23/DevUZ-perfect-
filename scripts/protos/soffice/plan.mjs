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
  /* Пакет «Панель управляющей компании» (grp: "panel"): то, что работает в
     панели макета. Цена — по часам, середина рынка Ташкента и СНГ для
     CRM аренды с ролями, как у greenwell; в отчёте «цены — по образцу,
     подтвердите». Брать можно всё или по частям, основа — «panel». */
  { id: "panel", h: 60, star: true, grp: "panel",
    ru: { t: "Панель: объекты, сделки, просмотры", e: "18 БЦ, этажи и блоки: статус и ставка сразу на сайте. Заявки с сайта первой строкой, доска сделок, предложение одной ссылкой, календарь просмотров, роли и история" },
    uz: { t: "Panel: obyektlar, bitimlar, ko‘rishlar", e: "18 BM, qavatlar va bloklar: holat va stavka darhol saytda. Saytdan arizalar birinchi qatorda, bitimlar doskasi, bitta havolada taklif, ko‘rishlar taqvimi, rollar va tarix" },
    en: { t: "Panel: buildings, deals, viewings", e: "18 buildings, floors and units: status and rate live on the site. Website requests on top, deal board, one-link proposals, viewing calendar, roles and history" } },
  { id: "leases", h: 30, grp: "panel",
    ru: { t: "Договоры и документы из шаблона", e: "Срок, ставка, индексация, депозит, продление; договор, допсоглашение и акт в один клик; напоминание за 90 дней до конца" },
    uz: { t: "Shartnomalar va shablondan hujjatlar", e: "Muddat, stavka, indeksatsiya, depozit, uzaytirish; shartnoma, qo‘shimcha kelishuv va dalolatnoma bir bosishda; tugashidan 90 kun oldin eslatma" },
    en: { t: "Leases and template documents", e: "Term, rate, indexation, deposit, renewal; lease, addendum and handover certificate in one click; reminder 90 days before the end" } },
  { id: "billing", h: 36, grp: "panel",
    ru: { t: "Счета, оплаты и долги", e: "Ежемесячные счета: аренда, коммунальные, парковка; оплата Click, Payme, переводом; возраст долга и напоминание арендатору" },
    uz: { t: "Hisoblar, to‘lovlar va qarzlar", e: "Oylik hisoblar: ijara, kommunal, avtoturargoh; Click, Payme, o‘tkazma orqali to‘lov; qarz muddati va ijarachiga eslatma" },
    en: { t: "Invoices, payments and arrears", e: "Monthly invoices for rent, utilities and parking; Click, Payme or transfer; arrears by age and tenant reminders" } },
  { id: "service", h: 20, grp: "panel",
    ru: { t: "Заявки арендаторов", e: "Ремонт, уборка, пропуск гостя, парковка: исполнитель, срок, закрытие с фото" },
    uz: { t: "Ijarachilar arizalari", e: "Ta’mir, tozalash, mehmon ruxsatnomasi, avtoturargoh: ijrochi, muddat, surat bilan yopish" },
    en: { t: "Tenant requests", e: "Repairs, cleaning, guest passes, parking: assignee, deadline, closed with a photo" } },
  { id: "owners", h: 24, grp: "panel",
    ru: { t: "Отчёт и кабинет собственника", e: "Заполняемость, доход, расходы и вознаграждение по его зданиям, PDF за месяц, вход только для чтения" },
    uz: { t: "Ega hisoboti va kabineti", e: "Uning binolari bo‘yicha bandlik, daromad, xarajat va mukofot, oylik PDF, faqat ko‘rish uchun kirish" },
    en: { t: "Owner report and account", e: "Occupancy, income, expenses and fee for their buildings, monthly PDF, read-only access" } },
  { id: "demand", h: 10, grp: "panel",
    ru: { t: "Спрос с сайта", e: "Что ищут на подборе: площадь, бюджет, район, формат, какие БЦ смотрят; спрос к свободным блокам" },
    uz: { t: "Saytdagi talab", e: "Tanlashda nima qidirishadi: maydon, byudjet, tuman, format, qaysi BM ko‘riladi; talabning bo‘sh bloklarga nisbati" },
    en: { t: "Website demand", e: "What the finder is used for: size, budget, district, format, most viewed buildings; demand against vacant units" } },
  { id: "en", h: 8,
    ru: { t: "Английская версия", e: "Для представительств иностранных компаний: весь сайт на английском" },
    uz: { t: "Inglizcha versiya", e: "Xorijiy kompaniyalar vakolatxonalari uchun: butun sayt inglizcha" },
    en: { t: "English version", e: "For foreign companies’ offices: the whole site in English" } },
  { id: "maps", h: 8,
    ru: { t: "Данные для Google и Яндекс Карт", e: "Soffice и каждый БЦ в поиске с адресом, телефоном и часами, подписи у всех фото" },
    uz: { t: "Google va Yandex Xaritalar uchun ma’lumotlar", e: "Soffice va har bir BM qidiruvda manzil, telefon va ish vaqti bilan, barcha suratlarda izoh" },
    en: { t: "Data for Google and Yandex Maps", e: "Soffice and every building in search with address, phone and hours; all photos captioned" } },
].map((a) => ({ ...a, price: a.h * RATE }));

/* Группы допов: заголовок над ними в «Стоимости». */
export const GROUPS = {
  panel: {
    ru: { t: "Панель управляющей компании", e: "Работает в макете: откройте «Панель» и пройдите сделку от заявки до оплаты" },
    uz: { t: "Boshqaruv kompaniyasi paneli", e: "Maketda ishlaydi: «Panel»ni oching va bitimni arizadan to‘lovgacha o‘tkazing" },
    en: { t: "Management panel", e: "Works in the mockup: open the panel and take a deal from request to payment" },
  },
};

/** Пакет панели целиком, $. */
export const PANEL_ALL = ADDONS.filter((a) => a.grp === "panel").reduce((s, a) => s + a.price, 0);

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
