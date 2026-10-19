// Стоимость интернет-магазина Baldinini Tashkent по этому макету.
//
// Владелец DevUz, 19.10.2026: «Допов добавь на 4-6 тысяч $, база 1000$ без
// админки, админка +300$, расширенная админка 500$»; в тот же день: «Цены на допы
// порежь на 40%». Конструктор — как в
// greenwell/plan.mjs и karomat/plan.mjs: база по акции, админка одним
// выбором из двух, допы тумблерами, отсчёт 48 часов с первого открытия.
//
// Обычная цена базы — 4 200 $: магазин на трёх экранах (телефон, планшет,
// компьютер) с каталогом по размерам, бронью примерки, подарочной упаковкой,
// оформлением в один экран, статусом заказа и кабинетом, но без админки. У
// greenwell магазин вместе с панелью — 4 900 $; без панели и с бронью
// примерки вместо рассрочки до графика — 4 200 $.
//
// Цены допов — середина рынка студий Ташкента и СНГ, по образцу greenwell;
// владелец их не назвал, поэтому в отчёте: «цены допов — по образцу,
// подтвердите». Все цены макета живут здесь, и только здесь.

/** Магазин без админки: 1 000 $ по акции вместо 4 200 $. */
export const BASE = {
  price: 4200,
  promo: 1000,
  weeks: [5, 7],
  ru: {
    t: "Интернет-магазин Baldinini Tashkent",
    d: "Магазин на русском и узбекском, сначала под телефон: главная с сезоном и бутиком, каталог с фильтрами по размеру, цвету, материалу, каблуку и цене, карточка с галереей и приближением, размеры EU и RU с подсказкой, наличие размера в бутике, бронь примерки в Tashkent City, «сообщить о размере», «соберите образ», корзина с подарочной упаковкой и открыткой, оформление в один экран с курьером, примеркой у двери и самовывозом, оплата Click, Payme, Uzum Bank, Uzcard и Humo, Visa и Mastercard, наличными, статус заказа по шагам, кабинет с заказами, размерами и бронями.",
  },
  uz: {
    t: "Baldinini Tashkent internet-do‘koni",
    d: "Rus va o‘zbek tilidagi, avvalo telefon uchun do‘kon: mavsum va butikli bosh sahifa, o‘lcham, rang, material, poshna va narx bo‘yicha filtrli katalog, kattalashtiriladigan galereyali kartochka, EU va RU o‘lchamlar maslahat bilan, butikda o‘lcham borligi, Tashkent Cityda kiyib ko‘rishga bron, «o‘lcham kelsa xabar bering», «obrazni yig‘ing», sovg‘a qadoqlash va otkritkali savat, kuryer, eshik oldida kiyib ko‘rish va olib ketish bilan bir ekranda rasmiylashtirish, Click, Payme, Uzum Bank, Uzcard va Humo, Visa va Mastercard, naqd to‘lov, bosqichma-bosqich buyurtma holati, buyurtmalar, o‘lchamlar va bronlar bilan kabinet.",
  },
  en: {
    t: "Baldinini Tashkent online store",
    d: "A phone-first store in Russian and Uzbek: home page with the season and the boutique, catalogue filtered by size, colour, material, heel and price, product page with a zoomable gallery, EU and RU sizes with a size guide, size availability in the boutique, try-on booking at Tashkent City, “notify me about my size”, “complete the look”, bag with gift wrapping and a card, one-screen checkout with courier, try-on at the door and pickup, payment by Click, Payme, Uzum Bank, Uzcard and Humo, Visa and Mastercard or cash, step-by-step order status, account with orders, sizes and bookings.",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/**
 * Админка — один выбор из двух (владелец: «админка +300$, расширенная
 * админка 500$»). Расширенная — вместо базовой, а не вместе с ней. Разделы
 * — те же ключи, что в panel.js: у каждого раздела панели пометка уровня.
 */
export const PANELS = {
  std: {
    price: 300,
    sections: ["orders", "tryon", "goods", "clients", "gifts", "returns", "team"],
    ru: { t: "Панель магазина", e: "Заказы с сайта первой строкой, брони примерки с календарём бутика, товары и остатки по размерам, клиенты, подарочные заказы, возвраты и обмен размера, роли и история действий" },
    uz: { t: "Do‘kon paneli", e: "Saytdan buyurtmalar birinchi qatorda, butik taqvimi bilan kiyib ko‘rish bronlari, o‘lchamlar bo‘yicha mahsulot va qoldiqlar, mijozlar, sovg‘a buyurtmalari, qaytarish va o‘lcham almashtirish, rollar va harakatlar tarixi" },
    en: { t: "Store panel", e: "Website orders on top, try-on bookings with the boutique calendar, products and stock by size, clients, gift orders, returns and size exchanges, roles and action history" },
  },
  pro: {
    price: 500,
    sections: ["dash", "traffic", "vip", "private", "restock", "sellers"],
    ru: { t: "Расширенная панель", e: "Всё из «Панели магазина» и ещё: выручка, себестоимость, прибыль и маржа по моделям и коллекциям, посещаемость и воронка с Instagram отдельно, VIP-клиенты с размерами и напоминаниями продавцу, закрытые распродажи, что заканчивается по размерам и заказ на новый сезон, продажи по продавцам бутика" },
    uz: { t: "Kengaytirilgan panel", e: "«Do‘kon paneli»dagi hammasi va yana: modellar va kolleksiyalar bo‘yicha tushum, tannarx, foyda va marja, Instagram alohida ko‘rsatilgan tashriflar va voronka, o‘lchamlari va sotuvchiga eslatmalari bilan VIP-mijozlar, yopiq chegirmalar, o‘lchamlar bo‘yicha nima tugayapti va yangi mavsumga buyurtma, butik sotuvchilari bo‘yicha savdo" },
    en: { t: "Extended panel", e: "Everything in the Store panel, plus revenue, cost, profit and margin by model and collection, traffic and funnel with Instagram on its own line, VIP clients with sizes and reminders for sellers, private sales, what is running out by size and the new season order, sales by boutique seller" },
  },
};

/* Допы: full — середина рынка студий Ташкента и СНГ; star — бутику первым делом. */
const LIST = [
  { id: "tgbot", full: 500, star: true,
    ru: { t: "Telegram-бот бутика с консультантом", e: "Покупатель пишет в Telegram, продавец отвечает из панели: фото пары, размер в бутике, бронь примерки. Так в Ташкенте и привыкли покупать" },
    uz: { t: "Konsultantli butik Telegram-boti", e: "Xaridor Telegramda yozadi, sotuvchi paneldan javob beradi: juftlik surati, butikdagi o‘lcham, kiyib ko‘rishga bron. Toshkentda shunday xarid qilishga o‘rganishgan" },
    en: { t: "Boutique Telegram bot with a consultant", e: "Clients write in Telegram and sellers answer from the panel: photos, size in the boutique, try-on booking. This is how Tashkent likes to shop" } },
  { id: "miniapp", full: 700,
    ru: { t: "Мини-приложение в Telegram", e: "Весь магазин внутри Telegram: каталог, размер, корзина и оплата без перехода на сайт" },
    uz: { t: "Telegramdagi mini-ilova", e: "Butun do‘kon Telegram ichida: katalog, o‘lcham, savat va saytga o‘tmasdan to‘lov" },
    en: { t: "Telegram mini app", e: "The whole store inside Telegram: catalogue, size, bag and payment without leaving the chat" } },
  { id: "erp", full: 600, star: true,
    ru: { t: "Каталог и остатки из 1С или МойСклад", e: "Модели, размеры и остатки бутика приходят сами: продали пару в бутике, на сайте размер погас" },
    uz: { t: "1C yoki MoySkladdan katalog va qoldiqlar", e: "Modellar, o‘lchamlar va butik qoldiqlari o‘zi keladi: butikda juftlik sotildi, saytda o‘lcham o‘chdi" },
    en: { t: "Catalogue and stock from 1C or MoySklad", e: "Models, sizes and boutique stock sync on their own: a pair sold in the boutique disappears from the site" } },
  { id: "tryon", full: 350, star: true,
    ru: { t: "Примерка с напоминаниями", e: "Бронь примерки с сайта, напоминание клиенту в Telegram или SMS за день и за два часа, пара отложена к приходу" },
    uz: { t: "Eslatmali kiyib ko‘rish", e: "Saytdan kiyib ko‘rishga bron, mijozga bir kun va ikki soat oldin Telegram yoki SMS eslatma, juftlik kelishiga ajratib qo‘yiladi" },
    en: { t: "Try-on with reminders", e: "Try-on booked on the site, a Telegram or SMS reminder a day and two hours before, the pair set aside for the visit" } },
  { id: "loyalty", full: 450,
    ru: { t: "Клубная программа с уровнями", e: "Клиент бутика, близкий круг: ранний доступ к сезону, подарок ко дню рождения, личный продавец" },
    uz: { t: "Darajali klub dasturi", e: "Butik mijozi, yaqin davra: mavsumga erta kirish, tug‘ilgan kunga sovg‘a, shaxsiy sotuvchi" },
    en: { t: "Membership tiers", e: "Boutique client, inner circle: early access to the season, a birthday gift, a personal seller" } },
  { id: "private", full: 350, star: true,
    ru: { t: "Закрытые распродажи", e: "Цены прошлого сезона видят только приглашённые: витрина остаётся спокойной, остатки уходят своим" },
    uz: { t: "Yopiq chegirmalar", e: "O‘tgan mavsum narxlarini faqat taklif qilinganlar ko‘radi: vitrina sokin qoladi, qoldiqlar o‘zimiznikilarga ketadi" },
    en: { t: "Private sales", e: "Last season prices are seen by invited clients only: the shop window stays calm, the remaining stock goes to your own people" } },
  { id: "gift", full: 300,
    ru: { t: "Подарочные сертификаты", e: "Электронный и в конверте, на любую сумму, проверка и списание в бутике и на сайте" },
    uz: { t: "Sovg‘a sertifikatlari", e: "Elektron va konvertda, istalgan summaga, butikda va saytda tekshirish va yechish" },
    en: { t: "Gift cards", e: "Digital or in an envelope, any amount, checked and redeemed in the boutique and online" } },
  { id: "courier", full: 400,
    ru: { t: "Курьерская служба с примеркой", e: "Связка с курьерской службой: цена и время доставки считаются сами, курьер ждёт примерку и забирает то, что не подошло" },
    uz: { t: "Kiyib ko‘rishli kuryerlik xizmati", e: "Kuryerlik xizmati bilan bog‘lash: yetkazish narxi va vaqti o‘zi hisoblanadi, kuryer kiyib ko‘rishni kutadi va mos kelmaganini olib ketadi" },
    en: { t: "Courier service with try-on", e: "Linked to a courier service: price and time are calculated automatically, the courier waits while the client tries on and takes back what did not fit" } },
  { id: "nasiya", full: 400,
    ru: { t: "Рассрочка Uzum Nasiya и Alif", e: "Решение онлайн за пару минут, на дорогую пару в Ташкенте её ждут. На витрине без крика: одна строка в карточке" },
    uz: { t: "Uzum Nasiya va Alif muddatli to‘lovi", e: "Bir necha daqiqada onlayn qaror, Toshkentda qimmat juftlikka uni kutishadi. Vitrinada baqiriqsiz: kartochkada bitta qator" },
    en: { t: "Uzum Nasiya and Alif instalments", e: "An online decision in minutes; Tashkent expects it on an expensive pair. Quiet on the page: one line on the product card" } },
  { id: "photo", full: 500,
    ru: { t: "Съёмка коллекции", e: "Фото на светлом фоне с пяти сторон и короткое видео на ноге для 40 моделей сезона: в люксе покупают глазами" },
    uz: { t: "Kolleksiyani suratga olish", e: "Mavsumning 40 ta modeli uchun yorug‘ fonda besh tomondan surat va oyoqda qisqa video: lyuksda ko‘z bilan xarid qilishadi" },
    en: { t: "Collection shoot", e: "Five-angle photos on a light background and a short on-foot video for 40 models of the season: luxury is bought with the eyes" } },
  { id: "alerts", full: 250,
    ru: { t: "«Мой размер появился» и брошенная корзина", e: "Размер вернулся в бутик, и клиент узнаёт первым; положил пару и ушёл, через час вежливое напоминание" },
    uz: { t: "«O‘lchamim keldi» va tashlab ketilgan savat", e: "O‘lcham butikka qaytdi va mijoz birinchi bo‘lib biladi; juftlikni solib ketdimi, bir soatdan keyin xushmuomala eslatma" },
    en: { t: "“My size is back” and abandoned bag", e: "A size comes back to the boutique and the client hears first; a pair left in the bag gets a polite reminder an hour later" } },
  { id: "instagram", full: 300,
    ru: { t: "Товары в Instagram", e: "Метки товаров в постах и сторис @baldininitashkent ведут прямо в карточку на сайте с размером" },
    uz: { t: "Instagramdagi mahsulotlar", e: "@baldininitashkent post va storislaridagi mahsulot belgilari to‘g‘ridan-to‘g‘ri saytdagi o‘lchamli kartochkaga olib boradi" },
    en: { t: "Products on Instagram", e: "Product tags in @baldininitashkent posts and stories lead straight to the product page with sizes" } },
  { id: "seo", full: 400,
    ru: { t: "Статьи под поиск", e: "10 статей под запросы Ташкента, на русском и узбекском: как подобрать размер, уход за кожей и замшей, что носить с лоферами" },
    uz: { t: "Qidiruv uchun maqolalar", e: "Toshkent so‘rovlari bo‘yicha 10 ta maqola, rus va o‘zbek tilida: o‘lchamni qanday tanlash, teri va zamsh parvarishi, loferlar bilan nima kiyish" },
    en: { t: "Search articles", e: "10 articles for Tashkent searches in Russian and Uzbek: choosing a size, leather and suede care, what to wear with loafers" } },
  { id: "en", full: 250,
    ru: { t: "Английская версия", e: "Магазин и письма покупателю на английском: для гостей Tashkent City и иностранцев, которые живут в городе" },
    uz: { t: "Inglizcha versiya", e: "Do‘kon va xaridorga xatlar ingliz tilida: Tashkent City mehmonlari va shaharda yashovchi chet elliklar uchun" },
    en: { t: "English version", e: "Store and client messages in English: for Tashkent City visitors and foreigners living in the city" } },
];

/**
 * Владелец DevUz, 19.10.2026: «Цены на допы порежь на 40%». Цена допа —
 * 60% от full, до десятков долларов. Было 5 750 $ за все допы, стало 3 450 $.
 */
export const ADDON_CUT = 0.4;
export const ADDONS = LIST.map((a) => ({ ...a, price: Math.round((a.full * (1 - ADDON_CUT)) / 10) * 10 }));

/** Сумма всех допов без админки (после скидки 40%). */
export const ADDONS_SUM = ADDONS.reduce((s, a) => s + a.price, 0);
export const ALL = BASE.promo + PANELS.pro.price + ADDONS_SUM;
