// Конструктор цены макета Oson Apteka: сайт и допы тумблерами.
//
// Задание владельца DevUz, 30.10.2026: «Стоимость для клиента без допников
// 1000$, с допами не более 3000$. Поставь в допы то, что клиенту реально
// нужно будет». Образец — neoline/plan.mjs: тумблер включает и выключает
// настоящий блок на сайте (data-addon="<id>"), итог считается сразу.
//
// Обычная цена — 4 900 $, как у магазинов Greenwell и Neoline: справочник с
// поиском по названию и веществу, страницей лекарства, аптеками на карте и
// бронью у студий Ташкента — 40-60 млн сум (docs/research/osonapteka.md,
// «Цены»). Допы — от ставок нашего калькулятора (content/calculator.ts),
// сдвинутых к середине рыночной вилки. Владелец, 30.10.2026, после сдачи:
// «Давай допы не на 2000, а на 3000$» — все допы вместе 3 000 $ (прежние
// цены × 1,5), сайт с допами — 4 000 $ (держит tests/proto-bundles.test.ts).

export const BASE = {
  price: 4900,
  promo: 1000,
  ru: {
    t: "Сайт-справочник Oson Apteka",
    d: "Новый облик на русском и узбекском, сначала под телефон: залёт в бренд, поиск по названию и действующему веществу с подсказками, список из нескольких лекарств, страница лекарства с инструкцией и аналогами, аптеки рядом на карте с маршрутом, регионы, приложение и бот, раздел для аптек.",
  },
  uz: {
    t: "Oson Apteka ma’lumotnoma sayti",
    d: "Rus va o‘zbek tilida yangi ko‘rinish, avvalo telefon uchun: brendga uchib kirish, nom va ta’sir qiluvchi modda bo‘yicha maslahatli qidiruv, bir nechta dori ro‘yxati, yo‘riqnoma va analoglar bilan dori sahifasi, xaritada yaqin dorixonalar va yo‘nalish, hududlar, ilova va bot, dorixonalar bo‘limi.",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* who — у кого на рынке это уже есть (docs/research/osonapteka.md). */
export const ADDONS = [
  { id: "bron", price: 375, star: true,
    ru: { t: "Бронь в аптеке и самовывоз", e: "Кнопка «Забронировать» у каждой аптеки: аптека подтверждает, покупатель видит статус «Собрана» и приходит за готовым", who: "есть у ArzonApteka и tabletki.ua" },
    uz: { t: "Dorixonada bron va olib ketish", e: "Har bir dorixonada «Bron qilish» tugmasi: dorixona tasdiqlaydi, xaridor «Yig‘ildi» holatini ko‘radi va tayyorini olib ketadi", who: "ArzonApteka va tabletki.ua’da bor" } },
  { id: "admin", price: 525, star: true,
    ru: { t: "Панель броней и аптек", e: "Брони с сайта первой строкой, статус виден покупателю, аптеки и их тарифы, свежесть остатков, история действий, роли: менеджер не видит выручку", who: "как в эталоне Greenwell" },
    uz: { t: "Bronlar va dorixonalar paneli", e: "Saytdan bronlar birinchi qatorda, holati xaridorga ko‘rinadi, dorixonalar va tariflari, qoldiqlar yangiligi, harakatlar tarixi, rollar: menejer tushumni ko‘rmaydi", who: "Greenwell namunasidagidek" } },
  { id: "erp", price: 450, star: true,
    ru: { t: "Остатки онлайн из FOM, ABU и 1С", e: "Ваша программа для аптек уже шлёт остатки: новый сайт показывает их сразу, со временем обновления у каждой аптеки", who: "у tabletki.ua «обновлено N минут назад»" },
    uz: { t: "FOM, ABU va 1C’dan onlayn qoldiqlar", e: "Dorixonalar uchun dasturingiz qoldiqlarni allaqachon yuboradi: yangi sayt ularni darhol, har bir dorixonada yangilangan vaqti bilan ko‘rsatadi", who: "tabletki.ua’da «N daqiqa oldin yangilandi»" } },
  { id: "deliv", price: 375,
    ru: { t: "Доставка из аптеки", e: "Три зоны и срочная за час, цена доставки считается до оформления, курьер аптеки или такси", who: "у PharmaClick от 8 000 сум за 55 минут" },
    uz: { t: "Dorixonadan yetkazib berish", e: "Uchta zona va bir soatda tezkor, yetkazish narxi rasmiylashtirishdan oldin hisoblanadi, dorixona kuryeri yoki taksi", who: "PharmaClick’da 8 000 so‘mdan, 55 daqiqada" } },
  { id: "pay", price: 300,
    ru: { t: "Оплата Payme, Click, Uzum", e: "Оплатить бронь или доставку сразу, без наличных в аптеке", who: "Payme и Click у PharmaClick" },
    uz: { t: "Payme, Click, Uzum orqali to‘lov", e: "Bron yoki yetkazishni darhol, dorixonada naqd pulsiz to‘lash", who: "PharmaClick’da Payme va Click" } },
  { id: "bot", price: 300,
    ru: { t: "Бот @osonaptekabot: бронь и статус", e: "Тот же поиск в Telegram, бронь в один шаг и сообщение «бронь собрана, ждём до 20:00»", who: "@ArzonAptekaBot у ArzonApteka" },
    uz: { t: "@osonaptekabot boti: bron va holat", e: "Telegramda xuddi shu qidiruv, bir qadamda bron va «bron yig‘ildi, 20:00 gacha kutamiz» xabari", who: "ArzonApteka’da @ArzonAptekaBot" } },
  { id: "remind", price: 225,
    ru: { t: "Напоминания о приёме и запасе", e: "Покупатель сам ставит время приёма по назначению врача, сайт напомнит купить заранее, пока упаковка не кончилась", who: "в справочниках Узбекистана не нашли" },
    uz: { t: "Qabul va zaxira eslatmalari", e: "Xaridor shifokor tayinlovi bo‘yicha qabul vaqtini o‘zi qo‘yadi, sayt qadoq tugamasidan oldin sotib olishni eslatadi", who: "O‘zbekiston ma’lumotnomalarida topilmadi" } },
  { id: "cab", price: 225,
    ru: { t: "Кабинет: кэшбэк, брони, аптечка семьи", e: "Кэшбэк за чек и перевод на карту, как в приложении, история броней, свои списки «Мама», «Ребёнок»", who: "кэшбэк есть только в вашем приложении" },
    uz: { t: "Kabinet: keshbek, bronlar, oila dorixonasi", e: "Chek uchun keshbek va kartaga o‘tkazish, ilovadagidek, bronlar tarixi, «Onam», «Bola» kabi ro‘yxatlar", who: "keshbek faqat ilovangizda bor" } },
  { id: "seo", price: 225,
    ru: { t: "Страницы «аптеки рядом» и 10 статей", e: "Страницы по 14 регионам и районам Ташкента под запросы «аптека рядом», «где купить», на двух языках", who: "у tabletki.ua страницы по городам" },
    uz: { t: "«Yaqin dorixonalar» sahifalari va 10 ta maqola", e: "14 hudud va Toshkent tumanlari bo‘yicha «yaqin dorixona», «qayerdan sotib olish» so‘rovlari uchun sahifalar, ikki tilda", who: "tabletki.ua’da shaharlar bo‘yicha sahifalar" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
