// Конструктор цены Neoline: магазин и допы тумблерами.
//
// Владелец DevUz, 28-29.10.2026: «Конструктор тарифов, цены по середине
// рынка. Сайт без допов — 1 000 $, с допами — не больше 3 000 $ в сумме. В
// допы — только то, что клиенту реально нужно». Образцы — domtut/plan.mjs и
// bloger-agency/plan.mjs: плашка «Конструктор», тумблер включает и выключает
// настоящий блок на странице (data-addon="<id>"), итог считается сразу.
// Владелец, 29.10.2026: «совокупная стоимость не дороже 3000 это вместе с
// сайтом уже, то есть допы 2000 максимум».
//
// Обычная цена магазина — 4 900 $, как у Greenwell: интернет-магазин с
// каталогом, карточкой, корзиной, оформлением и статусом заказа у студий
// Ташкента — от 40-60 млн сум (docs/research/neoline.md, «Цены»). Допы — от
// ставок нашего калькулятора (content/calculator.ts: онлайн-оплата 7 млн сум,
// интеграция 7,5 млн, расширенная админка 13 млн, уведомления и SEO по
// 4,5 млн) по 12 650 сум за доллар, сдвинутых к середине рыночной вилки и
// округлённых до 50 $, и ужатых под слово владельца: все допы вместе — ровно
// 2 000 $, сайт с допами — 3 000 $ (держит tests/proto-bundles.test.ts).

export const BASE = {
  price: 4900,
  promo: 1000,
  ru: {
    t: "Интернет-магазин Neoline",
    d: "Новый облик на узбекском и русском, сначала под телефон: залёт в бренд, «Радар в деле», каталог с поиском и фильтрами, карточка с ракурсами и платежом в месяц, подарок к X-COP, корзина и оформление, статус заказа, сервис и поддержка.",
  },
  uz: {
    t: "Neoline internet-do‘koni",
    d: "O‘zbek va rus tilida yangi ko‘rinish, avvalo telefon uchun: brendga uchib kirish, «Radar ishda», qidiruv va filtrli katalog, burchaklar va oylik to‘lov bilan kartochka, X-COP’ga sovg‘a, savat va rasmiylashtirish, buyurtma holati, servis va yordam.",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* who — у кого на рынке это уже есть (docs/research/neoline.md). */
export const ADDONS = [
  { id: "pay", price: 250, star: true,
    ru: { t: "Оплата Click, Payme, Uzum и рассрочка Nasiya", e: "Сейчас у вас Payme и карты. Click и Uzum Bank в один экран, Uzum Nasiya с платежом в месяц прямо в карточке, как у Texnomart", who: "у Texnomart рассрочка до 24 месяцев" },
    uz: { t: "Click, Payme, Uzum orqali to‘lov va Nasiya", e: "Hozir sizda Payme va kartalar. Click va Uzum Bank bitta ekranda, Uzum Nasiya oylik to‘lovi bilan kartochkada, Texnomart’dagidek", who: "Texnomart’da 24 oygacha muddatli to‘lov" } },
  { id: "erp", price: 300, star: true,
    ru: { t: "Связь с 1С или МойСклад", e: "Остатки и цены приходят сами: «Ожидается поступление» и «Есть на складе» без ручной правки, заказы уходят на склад", who: "у сетей техники остатки по магазинам" },
    uz: { t: "1C yoki MoySklad bilan bog‘lash", e: "Qoldiq va narxlar o‘zi keladi: «Kelishi kutilmoqda» va «Omborda bor» qo‘lda tahrirsiz, buyurtmalar omborga ketadi", who: "texnika tarmoqlarida do‘konlar bo‘yicha qoldiq" } },
  { id: "uzum", price: 200,
    ru: { t: "Выгрузка на Uzum Market", e: "Товары, цены и остатки из панели сами обновляются в вашем магазине на Uzum: одна база на два канала", who: "крупнейший маркетплейс страны" },
    uz: { t: "Uzum Market’ga yuklash", e: "Paneldagi mahsulot, narx va qoldiqlar Uzumdagi do‘koningizda o‘zi yangilanadi: ikki kanalga bitta baza", who: "mamlakatning eng yirik marketpleysi" } },
  { id: "bot", price: 250, star: true,
    ru: { t: "Telegram-бот магазина", e: "Каталог, заказ и статус доставки в Telegram, а владельцам X-COP сообщение, что вышла новая база камер для их модели", who: "у вас уже есть @neolinesupport" },
    uz: { t: "Do‘kon Telegram-boti", e: "Katalog, buyurtma va yetkazish holati Telegramda, X-COP egalariga esa ularning modeli uchun yangi kameralar bazasi chiqqani haqida xabar", who: "sizda allaqachon @neolinesupport bor" } },
  { id: "compare", price: 100,
    ru: { t: "Сравнение моделей", e: "До трёх приборов рядом: платформа, экран, обновление, цена. Чем 8900 лучше 7900, видно за секунду", who: "есть у Texnomart и neoline.ru" },
    uz: { t: "Modellarni solishtirish", e: "Uchtagacha qurilma yonma-yon: platforma, ekran, yangilash, narx. 8900 7900’dan nimasi bilan yaxshi, bir soniyada ko‘rinadi", who: "Texnomart va neoline.ru’da bor" } },
  { id: "pick", price: 150,
    ru: { t: "Подбор по авто и задачам", e: "Четыре вопроса: машина, что важнее, как ставить, бюджет. В ответ две-три модели из вашего каталога", who: "у магазинов в разведке не нашли" },
    uz: { t: "Avto va vazifa bo‘yicha tanlov", e: "To‘rtta savol: mashina, nima muhimroq, qanday o‘rnatish, byudjet. Javobda katalogingizdan ikki-uchta model", who: "tahlilda do‘konlarda topilmadi" } },
  { id: "upd", price: 200, star: true,
    ru: { t: "Обновления баз и прошивок по модели", e: "Поиск по модели, способ обновления, версия базы камер и дата, файлы без входа в кабинет. Версию меняют в панели", who: "раздел «Обновления» есть у neoline.ru" },
    uz: { t: "Model bo‘yicha baza va proshivka yangilanishlari", e: "Model bo‘yicha qidiruv, yangilash usuli, kameralar bazasi versiyasi va sanasi, kabinetga kirmasdan fayllar. Versiya paneldan o‘zgaradi", who: "neoline.ru’da «Yangilanishlar» bo‘limi bor" } },
  { id: "seo", price: 200,
    ru: { t: "10 статей под поиск", e: "«какой радар-детектор лучше», «Lochin радар», «видеорегистратор с двумя камерами»: на узбекском и русском, с вашими моделями внутри", who: "у Texnomart и prom.uz статей нет" },
    uz: { t: "Qidiruv uchun 10 ta maqola", e: "«qaysi radar detektor yaxshi», «Lochin radar», «ikki kamerali videoregistrator»: o‘zbek va rus tilida, ichida modellaringiz bilan", who: "Texnomart va prom.uz’da maqolalar yo‘q" } },
  { id: "admin", price: 350, star: true,
    ru: { t: "Панель магазина", e: "Заказы с сайта первой строкой, статус виден покупателю, остатки, версии баз камер, история действий, роли: менеджер не видит закупку", who: "как в эталоне Greenwell" },
    uz: { t: "Do‘kon paneli", e: "Saytdan buyurtmalar birinchi qatorda, holati xaridorga ko‘rinadi, qoldiqlar, kameralar bazasi versiyalari, harakatlar tarixi, rollar: menejer xarid narxini ko‘rmaydi", who: "Greenwell namunasidagidek" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
