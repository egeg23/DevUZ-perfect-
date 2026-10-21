// Конструктор цены SEM Travel: сайт по акции 48 часов и допы тумблерами.
//
// Задание владельца DevUz, 21.10.2026: «Стоимость с допами и отсчётом 48
// часов (plan.mjs, как karomat и tovar). Основа — из PROMO». Основа —
// корпоративный сайт из PROMO (lib/admin/mockup-offer): 1 000 $ вместо
// 2 500 $. Допы — те, что владелец назвал: поиск через Турвизор с календарём
// цен, подбор «не знаю куда», кабинет туриста, amoCRM или Bitrix24,
// Telegram-бот заявок, оплата Click / Payme / Uzum, приложение (как inapp),
// английская версия, разметка для карт; плюс «следить за ценой». Цены —
// середина рынка студий Ташкента и СНГ, на уровне karomat и jiguli;
// приложение — как «app» у других макетов. В отчёте: «цены — по образцу,
// подтвердите».
//
// Все цены макета живут здесь, и только здесь. Держит tests/proto-bundles.test.ts.

/** Сайт агентства: 1 000 $ по акции вместо 2 500 $. */
export const BASE = {
  price: 2500,
  promo: 1000,
  weeks: [3, 5],
  ru: {
    t: "Сайт SEM Travel",
    d: "Первый экран с поиском «куда, когда, сколько нас, бюджет» и подбором «не знаю куда»; карта перелётов из Ташкента с ценами; карточка тура с образцом ваучера, итогом на всех и шкалой отмены; бронь с ответом менеджера; гарантии, отзывы с Яндекс Карт, SEM Club, визы, авиабилеты, трансфер; русский и узбекский, под телефон и компьютер",
  },
  uz: {
    t: "SEM Travel sayti",
    d: "«Qayerga, qachon, necha kishi, byudjet» qidiruvi va «qayerga bilmayman» tanlovi bilan birinchi ekran; Toshkentdan narxli parvozlar xaritasi; voucher namunasi, hamma uchun jami va bekor qilish shkalasi bilan tur kartasi; menejer javobi bilan bron; kafolatlar, Yandex Xaritalardagi sharhlar, SEM Club, vizalar, aviachiptalar, transfer; rus va o‘zbek tillari, telefon va kompyuter uchun",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* Допы: star — агентства берут первым; new — механики, которых нет у
   турагентств Ташкента (docs/research/semtravel.md, «Итог»). */
export const ADDONS = [
  { id: "tourvisor", price: 400, star: true,
    ru: { t: "Поиск туров через Турвизор с календарём цен", e: "Живые цены всех туроператоров, календарь по дням и итог на всех: взрослые, дети, перелёт, отель, трансфер" },
    uz: { t: "Turvizor orqali tur qidirish va narxlar kalendari", e: "Barcha turoperatorlarning jonli narxlari, kunlar bo‘yicha kalendar va hamma uchun jami: kattalar, bolalar, parvoz, mehmonxona, transfer" } },
  { id: "pick", price: 250, star: true, new: true,
    ru: { t: "Подбор «не знаю куда»", e: "Бюджет, месяц и сколько вас: три страны с ценой на экране сразу, заявка менеджеру уже с выбором" },
    uz: { t: "«Qayerga bilmayman» tanlovi", e: "Byudjet, oy va necha kishi: narxi bilan uchta davlat darhol ekranda, menejerga ariza tanlov bilan birga" } },
  { id: "crm", price: 300, star: true,
    ru: { t: "Связь с amoCRM или Bitrix24", e: "Каждая заявка с сайта сразу сделкой: направление, даты, сколько человек, бюджет; статус из CRM виден туристу" },
    uz: { t: "amoCRM yoki Bitrix24 bilan bog‘lash", e: "Saytdagi har bir ariza darhol bitim: yo‘nalish, sanalar, necha kishi, byudjet; CRM’dagi holatni turist ko‘radi" } },
  { id: "cabinet", price: 350, new: true,
    ru: { t: "Кабинет туриста с документами", e: "Статус брони, ваучер, билеты, страховка и памятка в телефоне, открываются без интернета в аэропорту" },
    uz: { t: "Hujjatlar bilan turist kabineti", e: "Bron holati, voucher, chiptalar, sug‘urta va eslatma telefonda, aeroportda internetsiz ochiladi" } },
  { id: "tgbot", price: 225,
    ru: { t: "Telegram-бот для заявок", e: "Заявка с сайта менеджеру в Telegram за секунду, туристу напоминание о вылете и документах" },
    uz: { t: "Arizalar uchun Telegram-bot", e: "Saytdagi ariza menejerga Telegramda bir soniyada, turistga parvoz va hujjatlar haqida eslatma" } },
  { id: "pay", price: 250,
    ru: { t: "Онлайн-оплата Click, Payme, Uzum", e: "Аванс 30% или вся сумма с карты Uzcard, Humo, Visa; чек на почту и в кабинет" },
    uz: { t: "Click, Payme, Uzum orqali onlayn to‘lov", e: "30% avans yoki butun summa Uzcard, Humo, Visa kartasidan; chek pochtaga va kabinetga" } },
  { id: "watch", price: 200, new: true,
    ru: { t: "Следить за ценой", e: "«Напишите, когда Дубай на двоих станет дешевле $900»: сообщение в Telegram, когда цена упала" },
    uz: { t: "Narxni kuzatish", e: "«Dubai ikki kishiga $900 dan arzon bo‘lsa yozing»: narx tushganda Telegramga xabar" } },
  { id: "app", price: 2900,
    ru: { t: "Приложение для iPhone и Android", e: "Поиск, бронь, оплата и документы поездки в приложении агентства, как в нашем макете inapp" },
    uz: { t: "iPhone va Android uchun ilova", e: "Qidiruv, bron, to‘lov va sayohat hujjatlari agentlik ilovasida, bizning inapp maketimizdagidek" } },
  { id: "en", price: 125,
    ru: { t: "Английская версия", e: "Третий язык для иностранцев в Ташкенте и туристов" },
    uz: { t: "Ingliz tilidagi versiya", e: "Toshkentdagi chet elliklar va sayyohlar uchun uchinchi til" } },
  { id: "maps", price: 100,
    ru: { t: "Разметка для Яндекс и Google Карт", e: "Оба офиса, часы, телефоны и рейтинг в разметке, которую читают Яндекс и Google: адрес прямо в поиске" },
    uz: { t: "Yandex va Google Xaritalar uchun belgilash", e: "Ikkala ofis, ish vaqti, telefonlar va reyting Yandex va Google o‘qiydigan belgilashda: manzil to‘g‘ridan-to‘g‘ri qidiruvda" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
