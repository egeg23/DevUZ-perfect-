// Конструктор цены Karomat: сайт по акции 48 часов и допы тумблерами.
//
// Владелец DevUz, 16.10.2026: «используй наш стандартный промпт… Цена:
// конструктор, как в greenwell — основа по акции 48 часов плюс допы
// тумблерами». Основа — корпоративный сайт из PROMO (lib/admin/mockup-offer):
// 1 000 $ вместо 2 500 $. Всё, что в макете работает сверх сайта (заказ,
// бронь, банкеты, QR-меню, бот, панель), — допы. Цены допов — середина рынка
// студий Ташкента и СНГ, по образцу greenwell/plan.mjs; владелец цену не
// назвал, поэтому в отчёте: «цены — по образцу, подтвердите».
//
// Все цены макета живут здесь, и только здесь. Держит tests/proto-bundles.test.ts.

/** Корпоративный сайт ресторана: 1 000 $ по акции вместо 2 500 $. */
export const BASE = {
  price: 2500,
  promo: 1000,
  weeks: [3, 5],
  ru: {
    t: "Сайт ресторана Karomat",
    d: "Первый экран с дастарханом из ваших блюд, меню целиком с фото и ценами, фильтры и карточка блюда, видео с вашего YouTube, отзывы, адрес и карта, кнопка звонка, узбекский и русский, под телефон и компьютер",
  },
  uz: {
    t: "Karomat restorani sayti",
    d: "Taomlaringizdan dasturxon bilan birinchi ekran, rasm va narxli to‘liq menyu, filtrlar va taom kartochkasi, YouTube’dagi videolaringiz, sharhlar, manzil va xarita, qo‘ng‘iroq tugmasi, o‘zbek va rus tillari, telefon va kompyuter uchun",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* Допы: star — рестораны берут первым. */
export const ADDONS = [
  { id: "order", price: 600, star: true,
    ru: { t: "Онлайн-заказ: доставка и самовывоз", e: "Корзина, оформление в один экран, вход по коду из SMS, адрес и время, статус заказа у гостя: принят, готовится, в пути" },
    uz: { t: "Onlayn buyurtma: yetkazish va olib ketish", e: "Savat, bir ekranda rasmiylashtirish, SMS kod bilan kirish, manzil va vaqt, mehmonda buyurtma holati: qabul qilindi, tayyorlanmoqda, yo‘lda" } },
  { id: "pay", price: 300, star: true,
    ru: { t: "Оплата Click, Payme, Uzum", e: "Оплата заказа и предоплата брони или банкета на сайте, деньги на счёте ресторана" },
    uz: { t: "Click, Payme, Uzum orqali to‘lov", e: "Buyurtma to‘lovi, bron yoki banket oldindan to‘lovi saytda, pul restoran hisobida" } },
  { id: "booking", price: 450, star: true,
    ru: { t: "Бронь столика на схеме зала", e: "Дата, время, гости, стол на схеме вашего зала; занятые столы не выбрать, бронь сразу в панели и SMS гостю" },
    uz: { t: "Zal sxemasida stol bron qilish", e: "Sana, vaqt, mehmonlar, zalingiz sxemasida stol; band stolni tanlab bo‘lmaydi, bron darhol panelda va mehmonga SMS" } },
  { id: "banket", price: 400, star: true,
    ru: { t: "Банкеты и той: калькулятор и заявки", e: "Гости, повод, состав стола из вашего меню, сумма на гостя и итог; заявка менеджеру с этим расчётом" },
    uz: { t: "Banket va to‘y: kalkulyator va so‘rovlar", e: "Mehmonlar, sabab, menyuingizdan stol tarkibi, bir mehmonga va jami summa; shu hisob bilan menejerga so‘rov" } },
  { id: "qr", price: 450, star: true,
    ru: { t: "QR-меню на столе", e: "Гость сканирует код на столе: меню, заказ прямо на стол, «позвать официанта», «счёт» с обслуживанием 15%" },
    uz: { t: "Stoldagi QR-menyu", e: "Mehmon stoldagi kodni skanerlaydi: menyu, to‘g‘ridan-to‘g‘ri stolga buyurtma, «ofitsiantni chaqirish», 15% xizmat bilan «hisob»" } },
  { id: "panel", price: 500,
    ru: { t: "Панель владельца", e: "Заказы, брони по столам, банкеты, популярные блюда, стоп-лист и цены; менеджер не видит выручку" },
    uz: { t: "Ega paneli", e: "Buyurtmalar, stollar bo‘yicha bronlar, banketlar, mashhur taomlar, stop-list va narxlar; menejer tushumni ko‘rmaydi" } },
  { id: "tgbot", price: 450,
    ru: { t: "Telegram-бот ресторана", e: "Меню, заказ, бронь и статус в Telegram; гостю напоминание о брони за 2 часа" },
    uz: { t: "Restoran Telegram-boti", e: "Menyu, buyurtma, bron va holat Telegramda; mehmonga brondan 2 soat oldin eslatma" } },
  { id: "pos", price: 800,
    ru: { t: "Связь с кассой iiko или R-Keeper", e: "Меню, цены и стоп-лист приходят из кассы сами, заказ с сайта и QR уходит на кухню без ручного ввода" },
    uz: { t: "iiko yoki R-Keeper kassasi bilan bog‘lash", e: "Menyu, narxlar va stop-list kassadan o‘zi keladi, sayt va QR buyurtmasi qo‘lda kiritmasdan oshxonaga ketadi" } },
  { id: "aggr", price: 400,
    ru: { t: "Одно меню для Яндекс Еды, Wolt, Uzum Tezkor", e: "Ваше меню уже есть в Яндекс Еде: цены и стоп-лист из панели уходят туда, в Wolt и Uzum Tezkor, заказы оттуда в той же ленте" },
    uz: { t: "Yandex Eda, Wolt, Uzum Tezkor uchun bitta menyu", e: "Menyuingiz Yandex Eda’da allaqachon bor: paneldagi narxlar va stop-list u yerga, Wolt va Uzum Tezkor’ga ketadi, ulardan buyurtmalar o‘sha lentada" } },
  { id: "loyalty", price: 350,
    ru: { t: "Кешбэк и уровни гостя", e: "5% баллами с каждого заказа и брони, уровни, подарок в день рождения" },
    uz: { t: "Keshbek va mehmon darajalari", e: "Har buyurtma va brondan 5% ball, darajalar, tug‘ilgan kunga sovg‘a" } },
  { id: "gift", price: 250,
    ru: { t: "Подарочные сертификаты", e: "Сертификат на сумму или на ужин: оплата на сайте, красивая открытка в Telegram, погашение в панели" },
    uz: { t: "Sovg‘a sertifikatlari", e: "Summa yoki kechki ovqatga sertifikat: saytda to‘lov, Telegramda chiroyli otkritka, panelda yopish" } },
  { id: "reviews", price: 150,
    ru: { t: "Отзывы с Яндекс Карт и Google", e: "Оценка и свежие отзывы на сайте, просьба оставить отзыв после визита" },
    uz: { t: "Yandex Xaritalar va Google sharhlari", e: "Saytda baho va yangi sharhlar, tashrifdan keyin sharh qoldirish iltimosi" } },
  { id: "sms", price: 150,
    ru: { t: "SMS-шлюз Eskiz или Playmobile", e: "Коды входа, подтверждение брони и статусы заказа по SMS" },
    uz: { t: "Eskiz yoki Playmobile SMS-shlyuzi", e: "Kirish kodlari, bron tasdig‘i va buyurtma holatlari SMS orqali" } },
  { id: "en", price: 250,
    ru: { t: "Английская версия", e: "Третий язык для гостей города и деловых ужинов" },
    uz: { t: "Ingliz tilidagi versiya", e: "Shahar mehmonlari va ishbilarmonlik kechki ovqatlari uchun uchinchi til" } },
  { id: "seo", price: 400,
    ru: { t: "Страницы под поиск", e: "Банкетный зал, той, шашлык, доставка на Фозилтепа: 10 страниц на узбекском и русском с вашим меню" },
    uz: { t: "Qidiruv uchun sahifalar", e: "Banket zali, to‘y, shashlik, Foziltepada yetkazish: menyuingiz bilan o‘zbek va rus tilida 10 sahifa" } },
  { id: "app", price: 2900,
    ru: { t: "Приложение для iPhone и Android", e: "Меню, заказ, бронь и баллы в App Store и Google Play, пуши об акциях" },
    uz: { t: "iPhone va Android uchun ilova", e: "Menyu, buyurtma, bron va ballar App Store va Google Play’da, aksiyalar haqida push-xabarlar" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
