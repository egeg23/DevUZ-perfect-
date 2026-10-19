// Конструктор цены tovar.uz: новый облик площадки по акции 48 часов и допы
// тумблерами, как в karomat/plan.mjs.
//
// Основа — корпоративный сайт из PROMO (lib/admin/mockup-offer): 1 000 $
// вместо 2 500 $, если начинаем в течение 48 часов. Это новый облик того, что
// у tovar.uz уже работает: главная, каталог, поиск, карточка, корзина,
// страница продавца. Всё, чего у них нет и что в макете работает сверх этого
// (запрос цены, цены разных продавцов, торг, опт лесенкой, чат, кабинет
// продавца, приложение), — допы. Цены допов — середина рынка студий Ташкента
// и СНГ, вдвое ниже, как у karomat; владелец цену не назвал, поэтому в отчёте:
// «цены — по образцу, подтвердите».
//
// Все цены макета живут здесь, и только здесь. Держит tests/proto-bundles.test.ts.

/** Новый облик площадки: 1 000 $ по акции вместо 2 500 $. */
export const BASE = {
  price: 2500,
  promo: 1000,
  weeks: [4, 6],
  ru: {
    t: "Новый облик tovar.uz",
    d: "Главная со стеклом и вашими товарами, поиск по-русски и по-узбекски, каталог трёх веток с фильтрами, карточка товара, сравнение, корзина, страница продавца, под телефон и компьютер, без чужой рекламы",
  },
  uz: {
    t: "tovar.uz’ning yangi ko‘rinishi",
    d: "Shisha va tovarlaringiz bilan bosh sahifa, ruscha va o‘zbekcha qidiruv, filtrli uch tarmoqli katalog, tovar kartochkasi, solishtirish, savat, sotuvchi sahifasi, telefon va kompyuter uchun, begona reklamasiz",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* Владелец, 19.10.2026: «спец условия по стоимости до 29 октября до 20:00
   по Ташкенту (таймер)». Отсчёт — до этой минуты, один для всех. */
export const OFFER_UNTIL = "2026-10-29T20:00:00+05:00";

/* Цены допов — по часам работы. Владелец, 18.10.2026: «Из раздела „сейчас и
   станет“ вынеси эти доработки платно. Но цены поставь адекватные для
   Ташкента». Ставка — 20 $ за час, как у веб-студий Ташкента; h — наша оценка
   часов на доп. Меняя ставку или часы, меняете цену везде: в конструкторе и в
   «Сейчас и станет». */
export const RATE = 20;

/* Допы: star — площадке нужно первым; new — механики, которых нет у узбекских площадок. */
export const ADDONS = [
  { id: "rfq", h: 30, price: 30 * RATE, star: true, new: true,
    ru: { t: "Запрос цены у нескольких продавцов", e: "Покупатель пишет, что нужно и сколько, продавцы раздела присылают цену и срок, ответы в одном списке" },
    uz: { t: "Bir nechta sotuvchidan narx so‘rash", e: "Xaridor nima va qancha kerakligini yozadi, bo‘lim sotuvchilari narx va muddat yuboradi, javoblar bitta ro‘yxatda" } },
  { id: "offers", h: 24, price: 24 * RATE, star: true, new: true,
    ru: { t: "Одна карточка, цены разных продавцов", e: "Один товар сверху, ниже продавцы: цена, наличие, свежесть цены, доставка, время ответа; дешевле отмечен" },
    uz: { t: "Bitta kartochka, turli sotuvchilar narxi", e: "Tepada bitta tovar, pastda sotuvchilar: narx, mavjudlik, narx yangiligi, yetkazish, javob vaqti; arzoni belgilanadi" } },
  { id: "fresh", h: 12, price: 12 * RATE, star: true, new: true,
    ru: { t: "«Цена свежая»", e: "Когда продавец подтвердил цену: сегодня, неделю, год назад; старые ниже в выдаче, продавцу напоминание одной кнопкой" },
    uz: { t: "«Narx yangi»", e: "Sotuvchi narxni qachon tasdiqlagan: bugun, bir hafta, bir yil oldin; eskilari pastda, sotuvchiga bitta tugmali eslatma" } },
  { id: "bargain", h: 16, price: 16 * RATE, new: true,
    ru: { t: "«Предложить свою цену»", e: "Покупатель пишет сумму и количество, продавец за сутки отвечает «да», «нет» или своей цифрой" },
    uz: { t: "«O‘z narxingizni taklif qiling»", e: "Xaridor summa va sonini yozadi, sotuvchi bir kun ichida «ha», «yo‘q» yoki o‘z raqami bilan javob beradi" } },
  { id: "ladder", h: 12, price: 12 * RATE, new: true,
    ru: { t: "Опт лесенкой в корзине", e: "Ваши четыре оптовые цены ступеньками: «ещё 3 штуки, и цена за штуку ниже», сумма пересчитывается сама" },
    uz: { t: "Savatda zinapoya ulgurji", e: "To‘rtta ulgurji narxingiz zinapoya bo‘lib: «yana 3 dona, va dona narxi pastroq», summa o‘zi qayta hisoblanadi" } },
  { id: "chat", h: 30, price: 30 * RATE, star: true, new: true,
    ru: { t: "Живой чат и «отвечает за N минут»", e: "Переписка без обновления страницы, время ответа продавца считает площадка по настоящим ответам" },
    uz: { t: "Jonli chat va «N daqiqada javob beradi»", e: "Sahifani yangilamasdan yozishma, sotuvchi javob vaqtini sayt haqiqiy javoblar bo‘yicha hisoblaydi" } },
  { id: "otp", h: 10, price: 10 * RATE, star: true,
    ru: { t: "Заказ по номеру телефона", e: "Код из SMS вместо почты, пароля и письма; кабинет покупателя заводится сам" },
    uz: { t: "Telefon raqami bilan buyurtma", e: "Pochta, parol va xat o‘rniga SMS kod; xaridor kabineti o‘zi ochiladi" } },
  { id: "pay", h: 20, price: 20 * RATE, star: true,
    ru: { t: "Оплата Click, Payme, Uzum", e: "Оплата заказа на площадке, деньги продавцу; наличные и перечисление остаются" },
    uz: { t: "Click, Payme, Uzum orqali to‘lov", e: "Saytda buyurtma to‘lovi, pul sotuvchiga; naqd va o‘tkazma qoladi" } },
  { id: "inn", h: 12, price: 12 * RATE,
    ru: { t: "Счёт на компанию по ИНН", e: "Покупатель вводит ИНН, реквизиты из справочника Golden Pages, продавцу заказ уже со счётом" },
    uz: { t: "STIR bo‘yicha kompaniyaga hisob", e: "Xaridor STIR kiritadi, rekvizitlar Golden Pages’dan, sotuvchiga buyurtma hisob bilan keladi" } },
  { id: "cabinet", h: 50, price: 50 * RATE, star: true,
    ru: { t: "Новый кабинет продавца", e: "Сводка, товары, заказы со статусами, вопросы и торг, запросы цены, где теряются покупатели" },
    uz: { t: "Sotuvchining yangi kabineti", e: "Umumiy, tovarlar, holatli buyurtmalar, savollar va savdolashish, narx so‘rovlari, xaridor qayerda yo‘qoladi" } },
  { id: "start", h: 14, price: 14 * RATE,
    ru: { t: "Компания за минуту", e: "ИНН, и название, адрес и телефоны подтягиваются из Golden Pages; модерация после, а не до" },
    uz: { t: "Bir daqiqada kompaniya", e: "STIR, va nom, manzil va telefonlar Golden Pages’dan keladi; moderatsiya oldin emas, keyin" } },
  { id: "excel", h: 12, price: 12 * RATE,
    ru: { t: "Товары из Excel", e: "Сотня позиций одним файлом: цены, наличие, оптовые ступени; повторная загрузка обновляет цены" },
    uz: { t: "Excel’dan tovarlar", e: "Yuzlab pozitsiya bitta fayl bilan: narx, mavjudlik, ulgurji bosqichlar; qayta yuklash narxlarni yangilaydi" } },
  { id: "promo", h: 28, price: 28 * RATE,
    ru: { t: "Поднятие в выдаче вместо чужой рекламы", e: "Продавец платит вам за место выше, блоки Яндекса и Google уходят со страниц" },
    uz: { t: "Begona reklama o‘rniga qidiruvda ko‘tarish", e: "Sotuvchi yuqoriroq joy uchun sizga to‘laydi, Yandex va Google bloklari sahifalardan ketadi" } },
  { id: "search", h: 16, price: 16 * RATE,
    ru: { t: "Поиск на двух языках", e: "«muzlatgich» и «холодильник» ведут в один раздел, подсказки на языке покупателя, опечатки прощаются" },
    uz: { t: "Ikki tilda qidiruv", e: "«muzlatgich» va «холодильник» bitta bo‘limga olib boradi, maslahatlar xaridor tilida, xatolar kechiriladi" } },
  { id: "tgbot", h: 20, price: 20 * RATE,
    ru: { t: "Telegram-бот площадки", e: "Статус заказа, ответ продавца и встречная цена приходят покупателю в Telegram, продавцу новые заказы" },
    uz: { t: "Sayt Telegram-boti", e: "Buyurtma holati, sotuvchi javobi va qarshi narx xaridorga Telegramda, sotuvchiga yangi buyurtmalar" } },
  { id: "app", h: 150, price: 150 * RATE,
    ru: { t: "Приложение для iPhone и Android", e: "Поиск, карточки, корзина, заказы и чат в App Store и Google Play, пуши о встречной цене" },
    uz: { t: "iPhone va Android uchun ilova", e: "Qidiruv, kartochkalar, savat, buyurtmalar va chat App Store va Google Play’da, qarshi narx haqida push" } },
];


export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);

/* Маркетплейс под ключ. Владелец DevUz, 18.10.2026: «выведи туда прям
   полноценный маркетплейс на покупку, у нас же есть код… Стоимость: 30000 со
   всеми микросервисами, логикой, юридической документацией под Узбекистан и
   т. д., в общем под ключ». Цена владельца, не акция 48 часов.
   Состав — по коду ядра (egeg23/FlyMart, бренд lbmgo): что в нём есть, то и
   написано как есть; приложение для iPhone и Android, Payme, удержание денег
   до получения заказа и кешбэк в коде ядра не готовы, их делаем в рамках
   цены. */
export const TURNKEY = {
  price: 30000,
  ru: {
    t: "Маркетплейс под ключ",
    d: "Не новый облик, а площадка, на которой покупают: деньги, налоговая, склад, доставка, продавцы, споры и документы. На нашем готовом ядре маркетплейса: 18 сервисов, уже связанных с платёжными системами, налоговой и службами доставки Узбекистана. Переносим под tovar.uz и ваших продавцов и доводим до запуска.",
    groups: [
      ["Площадка", ["Сайт покупателя и приложение для iPhone и Android", "Кабинет продавца: товары, склад, продажи, финансы, отзывы", "Панель оператора: модерация товаров, жалобы и споры", "Telegram-бот продавца: вход и новые заказы", "Перенос ваших компаний и товаров с tovar.uz"]],
      ["18 сервисов и логика", ["Каталог и поиск на русском и узбекском, фильтры и подсказки", "Корзина и заказы у нескольких продавцов сразу, промокоды", "Отзывы, избранное, адреса покупателя", "Уведомления: SMS, почта, пуши, Telegram", "Связь с Billz, WooCommerce и API для продавцов", "Сверху механики макета: запрос цены, торг, опт лесенкой, «цена свежая»"]],
      ["Деньги", ["Оплата Click, Uzum Bank и Via, наличные и терминал, Payme подключаем", "Рассрочка Uzum Nasiya и Intend", "Деньги продавцу после того, как покупатель получил заказ", "Комиссия площадки, счета и выплаты продавцам на банковский счёт", "Фискальные чеки через ОФД налоговой с кодами ИКПУ, чек в PDF, счета-фактуры через Didox", "Отмены и возврат денег"]],
      ["Склад и доставка", ["Склад: остатки, ячейки, сборка, упаковка, возвраты", "Панель склада и печать этикеток", "Доставка Yandex Cargo, BTS и Fargo", "Пункты выдачи и постаматы, статус заказа у покупателя"]],
      ["Маркетинг", ["Бонусы и кешбэк покупателям", "Баннеры, подборки и страницы акций без программиста", "Группы покупателей и рассылки: брошенная корзина, просьба об отзыве", "Рекомендации товаров и поднятие в выдаче"]],
      ["Закон и запуск", ["Оферта для продавцов, договор с покупателем, пользовательское соглашение: готовые тексты, переписываем под tovar.uz", "Политика персональных данных по закону «О персональных данных», базы на серверах в Узбекистане", "Правила возврата по закону «О защите прав потребителей», правила отзывов и общения", "Проверка безопасности и нагрузки перед запуском"]],
    ],
  },
  uz: {
    t: "Kalit topshiriladigan marketpleys",
    d: "Yangi ko‘rinish emas, balki xarid qilinadigan maydoncha: pul, soliq, ombor, yetkazish, sotuvchilar, nizolar va hujjatlar. Tayyor marketpleys yadromiz asosida: O‘zbekiston to‘lov tizimlari, soliq va yetkazib berish xizmatlari bilan allaqachon bog‘langan 18 ta servis. tovar.uz va sotuvchilaringiz uchun ko‘chiramiz va ishga tushiramiz.",
    groups: [
      ["Maydoncha", ["Xaridor sayti va iPhone hamda Android uchun ilova", "Sotuvchi kabineti: tovarlar, ombor, sotuvlar, moliya, sharhlar", "Operator paneli: tovarlar moderatsiyasi, shikoyatlar va nizolar", "Sotuvchi uchun Telegram-bot: kirish va yangi buyurtmalar", "Kompaniya va tovarlaringizni tovar.uz’dan ko‘chirish"]],
      ["18 ta servis va mantiq", ["Rus va o‘zbek tilida katalog va qidiruv, filtrlar va maslahatlar", "Bir nechta sotuvchidan bir vaqtda savat va buyurtmalar, promokodlar", "Sharhlar, sevimlilar, xaridor manzillari", "Xabarnomalar: SMS, pochta, push, Telegram", "Billz, WooCommerce bilan bog‘lanish va sotuvchilar uchun API", "Ustiga maket mexanikalari: narx so‘rovi, savdolashish, zinapoya ulgurji, «narx yangi»"]],
      ["Pul", ["Click, Uzum Bank va Via orqali to‘lov, naqd va terminal, Payme’ni ulaymiz", "Uzum Nasiya va Intend orqali muddatli to‘lov", "Xaridor buyurtmani olgandan keyin pul sotuvchiga", "Maydoncha komissiyasi, hisoblar va sotuvchilarga bank hisobiga to‘lovlar", "Soliq OFD orqali IKPU kodli fiskal cheklar, PDF chek, Didox orqali hisob-fakturalar", "Bekor qilish va pulni qaytarish"]],
      ["Ombor va yetkazish", ["Ombor: qoldiqlar, yacheykalar, yig‘ish, qadoqlash, qaytarishlar", "Ombor paneli va yorliqlarni chop etish", "Yandex Cargo, BTS va Fargo orqali yetkazish", "Topshirish punktlari va postamatlar, xaridorda buyurtma holati"]],
      ["Marketing", ["Xaridorlarga bonus va keshbek", "Dasturchisiz bannerlar, to‘plamlar va aksiya sahifalari", "Xaridor guruhlari va xabarlar: tashlab ketilgan savat, sharh so‘rovi", "Tovar tavsiyalari va qidiruvda ko‘tarish"]],
      ["Qonun va ishga tushirish", ["Sotuvchilar uchun oferta, xaridor bilan shartnoma, foydalanuvchi kelishuvi: tayyor matnlar, tovar.uz uchun qayta yozamiz", "«Shaxsga doir ma’lumotlar to‘g‘risida»gi qonun bo‘yicha shaxsiy ma’lumotlar siyosati, bazalar O‘zbekistondagi serverlarda", "«Iste’molchilarning huquqlarini himoya qilish to‘g‘risida»gi qonun bo‘yicha qaytarish qoidalari, sharhlar va muloqot qoidalari", "Ishga tushirishdan oldin xavfsizlik va yuklama tekshiruvi"]],
    ],
  },
};
