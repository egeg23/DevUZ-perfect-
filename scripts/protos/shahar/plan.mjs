// Конструктор цены — как у AUTOMECHANIC и bloger.agency: плашка
// «Конструктор» на каждой странице прототипа, тумблер включает и выключает
// настоящий блок на странице, итог «портал + допы» считается сразу. То, чего
// на макете нет (админка, кабинеты, оплата, перенос базы), — группа «Сверх
// сайта» на странице «Что дальше».
//
// Цены — решение владельца, 07.10.2026: «базовая цена 2 300 $, допники должны
// добить цену до 3 900 $». База — 2 300 $, все допы вместе (на страницах и
// «Сверх сайта») — ровно 1 600 $: с каждым включённым тумблером итог 3 900 $,
// это держит tests/proto-bundles.test.ts. Между допами 1 600 $ разложены в
// тех же долях, что прежние ставки (калькулятор студии content/calculator.ts,
// сдвинутый к нижней границе Ташкента), поэтому дороже остаётся то, где
// больше работы: админка, кабинет риэлтора, оплата VIP, перенос базы
// (объявлений с фото сотни тысяч, переносить скриптом), страницы под поиск,
// узбекский язык. Прежняя раскладка (база 1 900 $ по ставке калькулятора за
// каталог, допы по ставкам AUTOMECHANIC, Shox Hospital и bloger.agency) и
// её обоснование — docs/research/shahar.md, раздел 6.

/** Портал: главная, каталог, объект, новостройки, услуги, подбор, русский. */
export const BASE = {
  price: 2300,
  ru: {
    t: "Портал: главная, каталог, объект, новостройки, услуги, подбор",
    d: "Поиск с вкладками и фильтрами, карточки объявлений, страница объекта с инфраструктурой рядом, база новостроек, заявка «Подберём бесплатно». Делаем в первую очередь под телефон.",
  },
  uz: {
    t: "Portal: bosh sahifa, katalog, obyekt, yangi binolar, xizmatlar, tanlash",
    d: "Tablar va filtrlar bilan qidiruv, e’lon kartochkalari, atrofdagi infratuzilmasi bilan obyekt sahifasi, yangi binolar bazasi, «Bepul tanlab beramiz» arizasi. Avvalo telefon uchun qilinadi.",
  },
};

/**
 * Блоки, которые видно на макете. `where` — ключ страницы (как в адресе:
 * "" — главная) или "all". На странице блок помечен data-addon="<id>";
 * выключили — его нет.
 */
export const ADDONS = [
  { id: "pwa", where: "all", price: 85, star: true, ru: { t: "Сайт как приложение", e: "Иконка на экране телефона без App Store, нижнее меню, избранное, адреса и контакты без интернета" }, uz: { t: "Sayt ilova kabi", e: "App Store’siz telefon ekranida belgi, pastki menyu, sevimlilar, internetsiz manzil va kontaktlar" } },
  { id: "tg", where: "podbor", price: 65, star: true, ru: { t: "Заявки в Telegram", e: "Заявка «Подберём бесплатно» сразу приходит администратору в Telegram, без почты и капчи" }, uz: { t: "Arizalar Telegramga", e: "«Bepul tanlab beramiz» arizasi darhol administratorga Telegramda keladi, pochta va kapchasiz" } },
  { id: "portal", where: "", price: 110, ru: { t: "Влёт в букву SHAHAR", e: "Название крупно, камера влетает в букву, и из неё открывается город" }, uz: { t: "SHAHAR harfiga kirish", e: "Nom katta, kamera harf ichiga kiradi va undan shahar ochiladi" } },
  { id: "fav", where: "katalog", price: 55, ru: { t: "Избранное и подборка в Telegram", e: "Сердечко на карточке сохраняет объект в телефоне, а подборку можно одним сообщением отправить жене или риэлтору" }, uz: { t: "Sevimlilar va Telegramga tanlov", e: "Kartochkadagi yurakcha obyektni telefonda saqlaydi, tanlovni esa turmush o‘rtog‘ingiz yoki rieltorga bitta xabar bilan yuborasiz" } },
  { id: "view", where: "obekt", price: 40, ru: { t: "Запись на просмотр", e: "День и время выбираются прямо на странице объекта, заявка с ID уходит администратору в Telegram" }, uz: { t: "Ko‘rishga yozilish", e: "Kun va vaqt obyekt sahifasida tanlanadi, ID bilan ariza administratorga Telegramda ketadi" } },
  { id: "cur", where: "all", price: 25, ru: { t: "Цена в $, сумах и евро", e: "Один переключатель меняет валюту на всех карточках сразу" }, uz: { t: "Narx $, so‘m va yevroda", e: "Bitta almashtirgich barcha kartochkalarda valyutani birdan o‘zgartiradi" } },
  { id: "mort", where: "obekt", price: 50, ru: { t: "Калькулятор ипотеки на объекте", e: "Выбрали взнос и срок, сразу видно платёж в месяц и кнопку «Оформить ипотеку»" }, uz: { t: "Obyektda ipoteka kalkulyatori", e: "Badal va muddatni tanlaysiz, darhol oylik to‘lov va «Ipoteka rasmiylashtirish» tugmasi chiqadi" } },
  { id: "motion", where: "all", price: 40, ru: { t: "Своё движение у каждого блока", e: "Карточки встают ключом, новостройки растут этажами, цифры катятся" }, uz: { t: "Har bir blokning o‘z harakati", e: "Kartochkalar kalit kabi joylashadi, yangi binolar qavatma-qavat o‘sadi, raqamlar aylanadi" } },
  { id: "uz", where: "all", price: 130, ru: { t: "Узбекская версия", e: "Переключатель RU / UZ, все страницы на двух языках" }, uz: { t: "O‘zbekcha versiya", e: "RU / UZ almashtirgich, barcha sahifalar ikki tilda" } },
];

export const GROUPS = {
  clients: { ru: "Покупателям и продавцам", uz: "Xaridor va sotuvchilarga" },
  team: { ru: "Вам", uz: "Sizga" },
};

/**
 * Сверх сайта: блока на макете нет, на странице «Что дальше» — превью.
 * `needs` — без чего не работает: включается вместе с ним.
 */
export const BLOCKS = [
  {
    id: "admin", group: "team", price: 195, pv: "admin", needs: [], star: true,
    ru: { t: "Админ-панель: объявления, модерация, риэлторы", why: "Объявление проверяет модератор до публикации, жалобы приходят в одно место, рейтинг риэлторов считается сам. Новостройки и цены меняете с телефона сами, без программиста.", li: ["Очередь модерации и жалобы", "Риэлторы и их рейтинг", "Новостройки и цены по комнатам"] },
    uz: { t: "Admin panel: e’lonlar, moderatsiya, rieltorlar", why: "E’lonni nashrdan oldin moderator tekshiradi, shikoyatlar bir joyga keladi, rieltorlar reytingi o‘zi hisoblanadi. Yangi binolar va narxlarni telefondan o‘zingiz o‘zgartirasiz, dasturchisiz.", li: ["Moderatsiya navbati va shikoyatlar", "Rieltorlar va ularning reytingi", "Yangi binolar va xonalar bo‘yicha narxlar"] },
  },
  {
    id: "import", group: "team", price: 165, pv: "import", needs: [],
    ru: { t: "Перенос базы объявлений со старого сайта", why: "Объявления, фото, риэлторы и их рейтинг переезжают на новый портал скриптом. Старые адреса объявлений ведут на новые, так что из поиска ничего не теряется.", li: ["Объявления с фото и ID", "Риэлторы и рейтинг", "Старые ссылки ведут на новые"] },
    uz: { t: "E’lonlar bazasini eski saytdan ko‘chirish", why: "E’lonlar, fotolar, rieltorlar va ularning reytingi yangi portalga skript bilan ko‘chadi. Eski e’lon manzillari yangilariga olib boradi, qidiruvdan hech narsa yo‘qolmaydi.", li: ["Foto va ID bilan e’lonlar", "Rieltorlar va reyting", "Eski havolalar yangilariga olib boradi"] },
  },
  {
    id: "agent", group: "team", price: 195, pv: "agent", needs: [],
    ru: { t: "Кабинет риэлтора", why: "Риэлтор входит через Telegram, добавляет объект за пару минут с телефона, видит просмотры и звонки по своим ID. Чем удобнее кабинет, тем больше объявлений у вас, а не на OLX.", li: ["Вход через Telegram", "Объект с телефона за 2 минуты", "Просмотры и звонки по ID"] },
    uz: { t: "Rieltor kabineti", why: "Rieltor Telegram orqali kiradi, obyektni telefondan bir-ikki daqiqada qo‘shadi, o‘z ID’lari bo‘yicha ko‘rishlar va qo‘ng‘iroqlarni ko‘radi. Kabinet qanchalik qulay bo‘lsa, e’lonlar OLX’da emas, sizda shunchalik ko‘p bo‘ladi.", li: ["Telegram orqali kirish", "Telefondan 2 daqiqada obyekt", "ID bo‘yicha ko‘rishlar va qo‘ng‘iroqlar"] },
  },
  {
    id: "vip", group: "team", price: 195, pv: "vip", needs: ["agent"],
    ru: { t: "VIP и поднятие объявлений с оплатой Click и Payme", why: "Размещение у вас бесплатное. Платное поднятие наверх и отметка VIP дают порталу доход. Продавец платит с телефона в два касания.", li: ["Поднять наверх · VIP · в подборку", "Оплата Click и Payme", "Отчёт о доходе в админке"] },
    uz: { t: "VIP va e’lonni ko‘tarish, Click va Payme orqali to‘lov", why: "Sizda joylashtirish bepul. Pullik yuqoriga ko‘tarish va VIP belgisi portalga daromad beradi. Sotuvchi telefondan ikki bosishda to‘laydi.", li: ["Yuqoriga ko‘tarish · VIP · tanlovga", "Click va Payme orqali to‘lov", "Admin panelda daromad hisoboti"] },
  },
  {
    id: "alerts", group: "clients", price: 110, pv: "alerts", needs: ["tg"],
    ru: { t: "Новые объекты по подписке в Telegram", why: "Сейчас поиск сохраняется на почту. Покупатель жмёт «Сообщать о новых», и бот присылает подходящие объекты в тот же час, как их разместили.", li: ["Район, комнаты, бюджет", "Бот @Shaharuz_bot присылает сам", "Отписка одной кнопкой"] },
    uz: { t: "Obuna bo‘yicha yangi obyektlar Telegramda", why: "Hozir qidiruv pochtaga saqlanadi. Xaridor «Yangilaridan xabar bering»ni bosadi, bot esa mos obyektlarni joylashtirilgan soatning o‘zidayoq yuboradi.", li: ["Tuman, xonalar, byudjet", "@Shaharuz_bot o‘zi yuboradi", "Bitta tugma bilan obunani bekor qilish"] },
  },
  {
    id: "seo", group: "clients", price: 140, pv: "seo", needs: [],
    ru: { t: "Страницы под поиск: район × тип", why: "Человек ищет «2-комнатная квартира Юнусабад» и попадает на вашу страницу с этими объектами, а не на OLX. Без ошибок «в Ташкентская» в заголовках.", li: ["Районы Ташкента × типы объектов", "Заголовки под живые запросы", "Карточка компании в поиске"] },
    uz: { t: "Qidiruv uchun sahifalar: tuman × tur", why: "Odam «Yunusobod 2 xonali kvartira» deb qidiradi va OLX’ga emas, shu obyektlar bilan sizning sahifangizga tushadi. Sarlavhalarda xatolarsiz.", li: ["Toshkent tumanlari × obyekt turlari", "Jonli so‘rovlarga mos sarlavhalar", "Qidiruvdagi kompaniya kartochkasi"] },
  },
];
