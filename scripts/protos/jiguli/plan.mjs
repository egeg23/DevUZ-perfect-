// Конструктор цены «Жигули Рестобар»: сайт по акции 48 часов и допы тумблерами.
//
// Задание владельца DevUz, 20.10.2026: «Стоимость с допами и отсчётом 48
// часов (plan.mjs, как karomat и tovar)». Основа — корпоративный сайт из PROMO
// (lib/admin/mockup-offer): 1 000 $ вместо 2 500 $. Допы — те, что владелец
// назвал: онлайн-бронь, меню по QR, доставка, программа гостя, бот брони,
// афиша событий и матчей, английская версия, разметка для карт; плюс кино
// первого экрана и панель бара. Цены — середина рынка студий Ташкента и СНГ,
// на уровне karomat/plan.mjs (там владелец уже сократил их вдвое); в отчёте:
// «цены — по образцу, подтвердите».
//
// Все цены макета живут здесь, и только здесь. Держит tests/proto-bundles.test.ts.

/** Сайт бара: 1 000 $ по акции вместо 2 500 $. */
export const BASE = {
  price: 2500,
  promo: 1000,
  weeks: [3, 5],
  ru: {
    t: "Сайт «Жигули Рестобар»",
    d: "Кино на первом экране: бармен, кран и струя пива по прокрутке; напитки и блюда «замороженным мгновением»; всё меню с ценами, акции, бронь столика в два нажатия, звонок, карта и часы, Instagram, русский и узбекский, под телефон и компьютер",
  },
  uz: {
    t: "«Jiguli Restobar» sayti",
    d: "Birinchi ekranda kino: barmen, kran va aylantirganda pivo oqimi; ichimliklar va taomlar «muzlagan lahza» bo‘lib; narxlari bilan butun menyu, aksiyalar, ikki bosishda stol bron qilish, qo‘ng‘iroq, xarita va ish vaqti, Instagram, rus va o‘zbek tillari, telefon va kompyuter uchun",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* Допы: star — бары берут первым; new — механики, которых нет у баров Ташкента. */
export const ADDONS = [
  { id: "booking", price: 225, star: true,
    ru: { t: "Онлайн-бронь столов на схеме зала", e: "Дата, время, гости, стол на схеме вашего зала; занятые не выбрать, бронь сразу администратору и SMS гостю" },
    uz: { t: "Zal sxemasida onlayn stol bron qilish", e: "Sana, vaqt, mehmonlar, zalingiz sxemasida stol; band stolni tanlab bo‘lmaydi, bron darhol administratorga va mehmonga SMS" } },
  { id: "qr", price: 225, star: true,
    ru: { t: "Меню по QR на столах", e: "Гость сканирует код на столе: меню с фото и ценами, «позвать официанта», «счёт»; стоп-лист прячет то, что кончилось" },
    uz: { t: "Stollarda QR orqali menyu", e: "Mehmon stoldagi kodni skanerlaydi: rasm va narxli menyu, «ofitsiantni chaqirish», «hisob»; tugagan taomlar stop-listda yashirinadi" } },
  { id: "tgbot", price: 225, star: true,
    ru: { t: "Telegram-бот для брони", e: "Бронь, меню и акции в Telegram; гостю напоминание о брони за 2 часа, администратору бронь за секунду" },
    uz: { t: "Bron uchun Telegram-bot", e: "Bron, menyu va aksiyalar Telegramda; mehmonga brondan 2 soat oldin eslatma, administratorga bron bir soniyada" } },
  { id: "kino", price: 300, star: true, new: true,
    ru: { t: "Кино первого экрана и сцены меню", e: "Бармен открывает кран, камера идёт по струе, напитки и блюда «замороженным мгновением»; по вашим фото, отдельно под телефон и компьютер" },
    uz: { t: "Birinchi ekran kinosi va menyu sahnalari", e: "Barmen kranni ochadi, kamera oqim bo‘ylab yuradi, ichimlik va taomlar «muzlagan lahza» bo‘lib; rasmlaringiz bo‘yicha, telefon va kompyuter uchun alohida" } },
  { id: "delivery", price: 300,
    ru: { t: "Доставка и самовывоз", e: "Корзина, адрес и время, оплата Click или Payme, статус заказа у гостя: принят, готовится, в пути" },
    uz: { t: "Yetkazib berish va olib ketish", e: "Savat, manzil va vaqt, Click yoki Payme orqali to‘lov, mehmonda buyurtma holati: qabul qilindi, tayyorlanmoqda, yo‘lda" } },
  { id: "loyalty", price: 175, new: true,
    ru: { t: "Программа гостя: «Похмельные рубли» и «копейки» онлайн", e: "Ваши печати и рубли в телефоне гостя вместо бумажной карточки: сколько собрано, когда можно обменять" },
    uz: { t: "Mehmon dasturi: «Pohmelnye rubli» va «kopeyki» onlayn", e: "Muhr va rubllaringiz qog‘oz karta o‘rniga mehmon telefonida: qancha yig‘ilgan, qachon almashtirish mumkin" } },
  { id: "afisha", price: 150,
    ru: { t: "Афиша событий и матчей", e: "Трансляции, вечера и праздники на неделю вперёд, бронь стола на матч в одно нажатие" },
    uz: { t: "Tadbirlar va o‘yinlar afishasi", e: "Bir hafta oldinga translyatsiyalar, kechalar va bayramlar, o‘yinga stolni bir bosishda bron qilish" } },
  { id: "panel", price: 250,
    ru: { t: "Панель бара", e: "Брони по столам, меню и цены, стоп-лист, акции; кто что поменял и когда, менеджер не видит выручку" },
    uz: { t: "Bar paneli", e: "Stollar bo‘yicha bronlar, menyu va narxlar, stop-list, aksiyalar; kim nimani qachon o‘zgartirgani, menejer tushumni ko‘rmaydi" } },
  { id: "en", price: 125,
    ru: { t: "Английская версия", e: "Третий язык для гостей города и туристов" },
    uz: { t: "Ingliz tilidagi versiya", e: "Shahar mehmonlari va sayyohlar uchun uchinchi til" } },
  { id: "maps", price: 100,
    ru: { t: "Разметка для Яндекс и Google Карт", e: "Бар, часы, меню и цены в разметке, которую читают Яндекс и Google: адрес, часы и рейтинг прямо в поиске" },
    uz: { t: "Yandex va Google Xaritalar uchun belgilash", e: "Bar, ish vaqti, menyu va narxlar Yandex va Google o‘qiydigan belgilashda: manzil, vaqt va reyting to‘g‘ridan-to‘g‘ri qidiruvda" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
