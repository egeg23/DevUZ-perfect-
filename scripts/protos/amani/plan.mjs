// Конструктор цены Amani: магазин и допы тумблерами.
//
// Владелец DevUz, 16.10.2026: цену не назвал — «Цена: конструктор, как в
// greenwell — магазин по акции плюс допы тумблерами. Цены возьми по образцу
// greenwell и поправь под объём». Объём тот же, что у Greenwell (магазин с
// кабинетом, рассрочкой, панелью владельца), плюс наборы для умры, подбор
// платка и таблица длины; без Seller AI. Поэтому магазин — те же 1 000 $ по
// акции вместо 4 900 $, допы — под магазин одежды из Telegram-канала. Акция
// — 48 часов с первого открытия макета; допы по обычной цене, без скидки.
// В отчёте владельцу: «цены — по образцу Greenwell, подтвердите».
//
// Все цены макета живут здесь, и только здесь. Держит tests/proto-bundles.test.ts.

/** Магазин без допов: 1 000 $ по акции вместо 4 900 $. */
export const BASE = {
  price: 4900,
  promo: 1000,
  weeks: [5, 7],
  ru: {
    t: "Сайт и интернет-магазин Amani",
    d: "Главная с раскрытием шёлка и лентой коллекции, магазин под телефон на узбекском и русском: каталог по типам, карточка с галереей и видео, наборы для умры, подбор платка по лицу, таблица длины по росту, корзина с промокодом и баллами, оформление в один экран, Click, Payme, Uzum Bank, рассрочка, статус заказа, отзывы за баллы, кабинет и панель владельца с прибылью",
  },
  uz: {
    t: "Amani sayti va internet-do‘koni",
    d: "Ipak ochiladigan bosh sahifa va kolleksiya lentasi, telefon uchun o‘zbek va rus tilidagi do‘kon: turlari bo‘yicha katalog, galereya va videoli kartochka, umra to‘plamlari, yuzga qarab ro‘mol tanlash, bo‘y bo‘yicha uzunlik jadvali, promokod va ballar bilan savat, bir ekranda rasmiylashtirish, Click, Payme, Uzum Bank, muddatli to‘lov, buyurtma holati, ball uchun sharhlar, kabinet va foydali ega paneli",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* Допы: цена — середина рынка студий Ташкента и СНГ, как у Greenwell; star — магазины одежды берут первым. */
export const ADDONS = [
  { id: "tgsync", price: 400, star: true,
    ru: { t: "Пост в канале становится товаром", e: "Выложили в @amani_uz фото с «Narxi» и «Razmer»: товар сам появляется в магазине, менеджер только проверяет" },
    uz: { t: "Kanaldagi post mahsulotga aylanadi", e: "@amani_uz’ga «Narxi» va «Razmer» bilan surat qo‘ydingiz: mahsulot do‘konda o‘zi paydo bo‘ladi, menejer faqat tekshiradi" } },
  { id: "tgbot", price: 450, star: true,
    ru: { t: "Telegram-бот магазина", e: "Каталог, заказ и статус доставки в Telegram, где ваши покупательницы уже пишут @Amani_uzadmin" },
    uz: { t: "Do‘kon Telegram-boti", e: "Katalog, buyurtma va yetkazish holati Telegramda, xaridorlaringiz allaqachon @Amani_uzadmin’ga yozadigan joyda" } },
  { id: "tryon", price: 350, star: true,
    ru: { t: "Доставка с примеркой", e: "Галочка «С примеркой» в заказе: курьер ждёт 15 минут, не подошло, возврат на месте, в панели отдельной строкой" },
    uz: { t: "Kiyib ko‘rib yetkazish", e: "Buyurtmada «Kiyib ko‘rib» belgisi: kuryer 15 daqiqa kutadi, to‘g‘ri kelmasa joyida qaytarish, panelda alohida qator" } },
  { id: "abandoned", price: 250, star: true,
    ru: { t: "Брошенная корзина", e: "Положила платье в корзину и ушла: через час напоминание в Telegram или SMS со ссылкой на ту же корзину" },
    uz: { t: "Tashlab ketilgan savat", e: "Ko‘ylakni savatga solib ketdimi: bir soatdan keyin o‘sha savatga havola bilan Telegram yoki SMS eslatma" } },
  { id: "warda", price: 600, star: true,
    ru: { t: "Второй бренд: Warda", e: "Warda рядом с Amani в одной панели: свои витрины и цены, общие склад, заказы и покупательницы" },
    uz: { t: "Ikkinchi brend: Warda", e: "Warda Amani bilan bitta panelda: alohida vitrina va narxlar, umumiy ombor, buyurtmalar va xaridorlar" } },
  { id: "fiscal", price: 350,
    ru: { t: "Фискальные чеки", e: "Чек по каждой оплате на сайте через оператора фискальных данных, покупательнице в SMS и в кабинет" },
    uz: { t: "Fiskal cheklar", e: "Saytdagi har bir to‘lov uchun fiskal ma’lumotlar operatori orqali chek, xaridorga SMS va kabinetga" } },
  { id: "drop", price: 300,
    ru: { t: "Новинки по расписанию и «Сообщить о поступлении»", e: "«Pavtor keldi» по кнопке: покупательница подписалась на модель, при повторе ей приходит сообщение" },
    uz: { t: "Jadval bo‘yicha yangiliklar va «Kelganda xabar berish»", e: "«Pavtor keldi» tugma orqali: xaridor modelga obuna bo‘ladi, takror kelganda xabar oladi" } },
  { id: "promo", price: 300,
    ru: { t: "Акции из панели: 2+1, наборы, «Maxsus narx»", e: "Третий платок в подарок, скидка на коллекцию, цена набора: запускает менеджер, без программиста" },
    uz: { t: "Paneldan aksiyalar: 2+1, to‘plamlar, «Maxsus narx»", e: "Uchinchi ro‘mol sovg‘a, kolleksiyaga chegirma, to‘plam narxi: dasturchisiz menejer ishga tushiradi" } },
  { id: "loyalty", price: 350,
    ru: { t: "Лояльность с уровнями и «Приведи подругу»", e: "Silk, Pearl, Gold: больше покупок, больше баллов; подруге скидка на первый заказ, вам баллы" },
    uz: { t: "Darajali sodiqlik va «Dugonangizni olib keling»", e: "Silk, Pearl, Gold: xarid ko‘p, ball ko‘p; dugonaga birinchi buyurtmaga chegirma, sizga ball" } },
  { id: "delivery", price: 500,
    ru: { t: "Курьерские службы", e: "Yandex Delivery, BTS, Fargo: цена доставки в регион считается сама, трек-номер у покупательницы в заказе" },
    uz: { t: "Kuryerlik xizmatlari", e: "Yandex Delivery, BTS, Fargo: viloyatga yetkazish narxi o‘zi hisoblanadi, trek-raqam buyurtmada" } },
  { id: "video", price: 250,
    ru: { t: "Видео-обзоры в карточке", e: "Ваши ежедневные видео из канала встают в карточку товара: как сидит, как двигается ткань" },
    uz: { t: "Kartochkada video-obzorlar", e: "Kanaldagi kundalik videolaringiz mahsulot kartochkasiga qo‘yiladi: qanday turadi, mato qanday harakatlanadi" } },
  { id: "sms", price: 150,
    ru: { t: "SMS-шлюз Eskiz или Playmobile", e: "Коды входа и статусы заказа в SMS тем, у кого нет Telegram" },
    uz: { t: "Eskiz yoki Playmobile SMS-shlyuzi", e: "Kirish kodlari va buyurtma holatlari Telegrami yo‘qlarga SMS orqali" } },
  { id: "erp", price: 600,
    ru: { t: "Связка с 1С или МойСклад", e: "Остатки по моделям и размерам приходят сами, заказы уходят на склад без ручного ввода" },
    uz: { t: "1C yoki MoySklad bilan bog‘lash", e: "Model va o‘lcham bo‘yicha qoldiqlar o‘zi keladi, buyurtmalar omborga qo‘lda kiritmasdan ketadi" } },
  { id: "uzum", price: 400,
    ru: { t: "Выгрузка на Uzum Market", e: "Товары, цены и остатки из панели сами обновляются в магазине на Uzum: одна база на два канала" },
    uz: { t: "Uzum Market’ga yuklash", e: "Paneldagi mahsulotlar, narxlar va qoldiqlar Uzumdagi do‘konda o‘zi yangilanadi: ikki kanal uchun bitta baza" } },
  { id: "men", price: 450,
    ru: { t: "Раздел для мужчин: ихрам и умра", e: "Каталог для него и готовый набор с ценой, когда добавите мужское в ассортимент" },
    uz: { t: "Erkaklar bo‘limi: ehrom va umra", e: "U uchun katalog va narxli tayyor to‘plam, assortimentga erkaklar kiyimini qo‘shganingizda" } },
  { id: "seo", price: 400,
    ru: { t: "Статьи под поиск", e: "10 статей на узбекском и русском: что взять в умру, как выбрать химар, длина платья по росту, с вашими товарами внутри" },
    uz: { t: "Qidiruv uchun maqolalar", e: "O‘zbek va rus tilida 10 ta maqola: umraga nima olish, himorni qanday tanlash, bo‘yga qarab ko‘ylak uzunligi, ichida mahsulotlaringiz bilan" } },
  { id: "app", price: 2900,
    ru: { t: "Приложение для iPhone и Android", e: "Тот же магазин в App Store и Google Play: пуши о новой коллекции и «Pavtor keldi»" },
    uz: { t: "iPhone va Android uchun ilova", e: "O‘sha do‘kon App Store va Google Play’da: yangi kolleksiya va «Pavtor keldi» haqida push-xabarlar" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
