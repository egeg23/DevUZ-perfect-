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

/* Допы: star — площадке нужно первым; new — механики, которых нет у узбекских площадок. */
export const ADDONS = [
  { id: "rfq", price: 400, star: true, new: true,
    ru: { t: "Запрос цены у нескольких продавцов", e: "Покупатель пишет, что нужно и сколько, продавцы раздела присылают цену и срок, ответы в одном списке" },
    uz: { t: "Bir nechta sotuvchidan narx so‘rash", e: "Xaridor nima va qancha kerakligini yozadi, bo‘lim sotuvchilari narx va muddat yuboradi, javoblar bitta ro‘yxatda" } },
  { id: "offers", price: 350, star: true, new: true,
    ru: { t: "Одна карточка, цены разных продавцов", e: "Один товар сверху, ниже продавцы: цена, наличие, свежесть цены, доставка, время ответа; дешевле отмечен" },
    uz: { t: "Bitta kartochka, turli sotuvchilar narxi", e: "Tepada bitta tovar, pastda sotuvchilar: narx, mavjudlik, narx yangiligi, yetkazish, javob vaqti; arzoni belgilanadi" } },
  { id: "fresh", price: 150, star: true, new: true,
    ru: { t: "«Цена свежая»", e: "Когда продавец подтвердил цену: сегодня, неделю, год назад; старые ниже в выдаче, продавцу напоминание одной кнопкой" },
    uz: { t: "«Narx yangi»", e: "Sotuvchi narxni qachon tasdiqlagan: bugun, bir hafta, bir yil oldin; eskilari pastda, sotuvchiga bitta tugmali eslatma" } },
  { id: "bargain", price: 250, new: true,
    ru: { t: "«Предложить свою цену»", e: "Покупатель пишет сумму и количество, продавец за сутки отвечает «да», «нет» или своей цифрой" },
    uz: { t: "«O‘z narxingizni taklif qiling»", e: "Xaridor summa va sonini yozadi, sotuvchi bir kun ichida «ha», «yo‘q» yoki o‘z raqami bilan javob beradi" } },
  { id: "ladder", price: 200, new: true,
    ru: { t: "Опт лесенкой в корзине", e: "Ваши четыре оптовые цены ступеньками: «ещё 3 штуки, и цена за штуку ниже», сумма пересчитывается сама" },
    uz: { t: "Savatda zinapoya ulgurji", e: "To‘rtta ulgurji narxingiz zinapoya bo‘lib: «yana 3 dona, va dona narxi pastroq», summa o‘zi qayta hisoblanadi" } },
  { id: "chat", price: 300, star: true, new: true,
    ru: { t: "Живой чат и «отвечает за N минут»", e: "Переписка без обновления страницы, время ответа продавца считает площадка по настоящим ответам" },
    uz: { t: "Jonli chat va «N daqiqada javob beradi»", e: "Sahifani yangilamasdan yozishma, sotuvchi javob vaqtini sayt haqiqiy javoblar bo‘yicha hisoblaydi" } },
  { id: "otp", price: 150, star: true,
    ru: { t: "Заказ по номеру телефона", e: "Код из SMS вместо почты, пароля и письма; кабинет покупателя заводится сам" },
    uz: { t: "Telefon raqami bilan buyurtma", e: "Pochta, parol va xat o‘rniga SMS kod; xaridor kabineti o‘zi ochiladi" } },
  { id: "pay", price: 300, star: true,
    ru: { t: "Оплата Click, Payme, Uzum", e: "Оплата заказа на площадке, деньги продавцу; наличные и перечисление остаются" },
    uz: { t: "Click, Payme, Uzum orqali to‘lov", e: "Saytda buyurtma to‘lovi, pul sotuvchiga; naqd va o‘tkazma qoladi" } },
  { id: "inn", price: 250,
    ru: { t: "Счёт на компанию по ИНН", e: "Покупатель вводит ИНН, реквизиты из справочника Golden Pages, продавцу заказ уже со счётом" },
    uz: { t: "STIR bo‘yicha kompaniyaga hisob", e: "Xaridor STIR kiritadi, rekvizitlar Golden Pages’dan, sotuvchiga buyurtma hisob bilan keladi" } },
  { id: "cabinet", price: 600, star: true,
    ru: { t: "Новый кабинет продавца", e: "Сводка, товары, заказы со статусами, вопросы и торг, запросы цены, где теряются покупатели" },
    uz: { t: "Sotuvchining yangi kabineti", e: "Umumiy, tovarlar, holatli buyurtmalar, savollar va savdolashish, narx so‘rovlari, xaridor qayerda yo‘qoladi" } },
  { id: "start", price: 250,
    ru: { t: "Компания за минуту", e: "ИНН, и название, адрес и телефоны подтягиваются из Golden Pages; модерация после, а не до" },
    uz: { t: "Bir daqiqada kompaniya", e: "STIR, va nom, manzil va telefonlar Golden Pages’dan keladi; moderatsiya oldin emas, keyin" } },
  { id: "excel", price: 200,
    ru: { t: "Товары из Excel", e: "Сотня позиций одним файлом: цены, наличие, оптовые ступени; повторная загрузка обновляет цены" },
    uz: { t: "Excel’dan tovarlar", e: "Yuzlab pozitsiya bitta fayl bilan: narx, mavjudlik, ulgurji bosqichlar; qayta yuklash narxlarni yangilaydi" } },
  { id: "promo", price: 300,
    ru: { t: "Поднятие в выдаче вместо чужой рекламы", e: "Продавец платит вам за место выше, блоки Яндекса и Google уходят со страниц" },
    uz: { t: "Begona reklama o‘rniga qidiruvda ko‘tarish", e: "Sotuvchi yuqoriroq joy uchun sizga to‘laydi, Yandex va Google bloklari sahifalardan ketadi" } },
  { id: "search", price: 150,
    ru: { t: "Поиск на двух языках", e: "«muzlatgich» и «холодильник» ведут в один раздел, подсказки на языке покупателя, опечатки прощаются" },
    uz: { t: "Ikki tilda qidiruv", e: "«muzlatgich» va «холодильник» bitta bo‘limga olib boradi, maslahatlar xaridor tilida, xatolar kechiriladi" } },
  { id: "tgbot", price: 250,
    ru: { t: "Telegram-бот площадки", e: "Статус заказа, ответ продавца и встречная цена приходят покупателю в Telegram, продавцу новые заказы" },
    uz: { t: "Sayt Telegram-boti", e: "Buyurtma holati, sotuvchi javobi va qarshi narx xaridorga Telegramda, sotuvchiga yangi buyurtmalar" } },
  { id: "app", price: 2500,
    ru: { t: "Приложение для iPhone и Android", e: "Поиск, карточки, корзина, заказы и чат в App Store и Google Play, пуши о встречной цене" },
    uz: { t: "iPhone va Android uchun ilova", e: "Qidiruv, kartochkalar, savat, buyurtmalar va chat App Store va Google Play’da, qarshi narx haqida push" } },
];


export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);

/* Маркетплейс под ключ. Владелец DevUz, 18.10.2026: «выведи туда прям
   полноценный маркетплейс на покупку, у нас же есть код… Стоимость: 30000 со
   всеми микросервисами, логикой, юридической документацией под Узбекистан и
   т. д., в общем под ключ». Цена владельца, не акция 48 часов. */
export const TURNKEY = {
  price: 30000,
  ru: {
    t: "Маркетплейс под ключ",
    d: "Не новый облик, а площадка, на которой покупают: деньги, склад, доставка, продавцы, споры и документы. На нашем готовом ядре маркетплейса, под tovar.uz и ваших продавцов.",
    groups: [
      ["Площадка", ["Сайт и приложение покупателя для iPhone и Android", "Кабинет продавца и кабинет оператора площадки", "Модерация товаров, жалобы и споры", "Перенос ваших компаний и товаров с tovar.uz"]],
      ["Микросервисы и логика", ["Каталог и поиск на русском и узбекском", "Корзина и заказы у нескольких продавцов сразу", "Запрос цены, торг, опт лесенкой, «цена свежая»", "Чат, отзывы, рейтинг и время ответа продавца", "Уведомления: SMS, Telegram, пуши", "Аналитика для площадки и продавцов"]],
      ["Деньги", ["Оплата Click, Payme, Uzum, Uzcard и Humo", "Деньги держит площадка и отдаёт продавцу, когда покупатель получил заказ", "Комиссия площадки, счета и выплаты продавцам", "Фискальные чеки через ОФД и чек покупателю в PDF", "Отмены и возврат денег"]],
      ["Склад и доставка", ["Склад: приёмка, хранение, сборка заказов, инвентаризация", "Отдельное приложение для склада", "Курьеры и самовывоз, маршруты и статус заказа у покупателя", "Бот продавца и бот доставки в Telegram"]],
      ["Маркетинг", ["Бонусы и кешбэк покупателям", "Баннеры, подборки и страницы акций без программиста", "Группы покупателей и рассылки по ним", "Платное поднятие товаров в выдаче для продавцов"]],
      ["Закон Узбекистана", ["Публичная оферта для покупателей", "Договор с продавцами и правила площадки", "Политика персональных данных по закону «О персональных данных», базы на серверах в Узбекистане", "Правила возврата по закону «О защите прав потребителей»"]],
    ],
  },
  uz: {
    t: "Kalit topshiriladigan marketpleys",
    d: "Yangi ko‘rinish emas, balki xarid qilinadigan maydoncha: pul, ombor, yetkazish, sotuvchilar, nizolar va hujjatlar. Tayyor marketpleys yadromiz asosida, tovar.uz va sotuvchilaringiz uchun.",
    groups: [
      ["Maydoncha", ["iPhone va Android uchun xaridor sayti va ilovasi", "Sotuvchi kabineti va maydoncha operatori kabineti", "Tovarlar moderatsiyasi, shikoyatlar va nizolar", "Kompaniya va tovarlaringizni tovar.uz’dan ko‘chirish"]],
      ["Mikroservislar va mantiq", ["Rus va o‘zbek tilida katalog va qidiruv", "Bir nechta sotuvchidan bir vaqtda savat va buyurtma", "Narx so‘rovi, savdolashish, zinapoya ulgurji, «narx yangi»", "Chat, sharhlar, reyting va sotuvchi javob vaqti", "Xabarnomalar: SMS, Telegram, push", "Maydoncha va sotuvchilar uchun tahlil"]],
      ["Pul", ["Click, Payme, Uzum, Uzcard va Humo orqali to‘lov", "Pulni maydoncha ushlab turadi va xaridor buyurtmani olgach sotuvchiga beradi", "Maydoncha komissiyasi, hisoblar va sotuvchilarga to‘lovlar", "OFD orqali fiskal cheklar va xaridorga PDF chek", "Bekor qilish va pulni qaytarish"]],
      ["Ombor va yetkazish", ["Ombor: qabul, saqlash, buyurtmalarni yig‘ish, inventarizatsiya", "Ombor uchun alohida ilova", "Kuryerlar va olib ketish, marshrutlar va xaridorda buyurtma holati", "Telegramda sotuvchi boti va yetkazish boti"]],
      ["Marketing", ["Xaridorlarga bonus va keshbek", "Dasturchisiz bannerlar, to‘plamlar va aksiya sahifalari", "Xaridor guruhlari va ularga xabarlar", "Sotuvchilar uchun qidiruvda pullik ko‘tarish"]],
      ["O‘zbekiston qonuni", ["Xaridorlar uchun ommaviy oferta", "Sotuvchilar bilan shartnoma va maydoncha qoidalari", "«Shaxsga doir ma’lumotlar to‘g‘risida»gi qonun bo‘yicha shaxsiy ma’lumotlar siyosati, bazalar O‘zbekistondagi serverlarda", "«Iste’molchilarning huquqlarini himoya qilish to‘g‘risida»gi qonun bo‘yicha qaytarish qoidalari"]],
    ],
  },
};
