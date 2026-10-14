// Конструктор цены DomTut: сайт, приложение для iOS и допы тумблерами.
//
// Владелец, 14.10.2026: «Сделай конструктор тарифов, цены по середине рынка.
// Стоимость для клиента без допов — 1 000 $ вместо 4 800 $, предложение на 48
// часов. Поставь в допы то, что клиенту реально будет нужно». И в тот же
// день: «Цена за сайт 1000$, оставляем. Цена за приложение под iOS со скидкой
// 60% - 3500$ будет стоить. А если оплата наличными - скидка 10%».
//
// Сайт — 1 000 $ вместо 4 800 $, приложение для iPhone — 3 500 $ вместо
// 8 750 $ (скидка 60%), обе цены по предложению на 48 часов. Оплата
// наличными — минус 10% от итога. Допы — по обычной цене, без скидки 48
// часов. Рынок — docs/research/domtut.md, раздел «Цены»: приложение у
// Innobek от 45 млн сум, с оплатой и интеграциями от 90 млн.
//
// Допы — то, чего у DomTut нет, а у конкурентов уже есть (Urbo, Uysot, Joymee,
// Krisha): сохранённый поиск и пуши, вход по SMS, запись на показ с
// календарём, CRM, оплата размещения, Telegram-бот, кабинет застройщика,
// оценка квартиры, поддержка. Держит tests/proto-bundles.test.ts.

/** Сайт: цена оставлена владельцем. */
export const BASE = {
  price: 4800,
  promo: 1000,
  ru: {
    t: "Сайт",
    d: "Главная, каталог ЖК с фильтрами, страница ЖК, карта, ипотека, статистика цен по районам, бесплатный подбор. Русский и узбекский, управление в панели, сначала под телефон.",
  },
  uz: {
    t: "Sayt",
    d: "Bosh sahifa, filtrli TJM katalogi, TJM sahifasi, xarita, ipoteka, tumanlar bo‘yicha narx statistikasi, bepul tanlov. Rus va o‘zbek tillari, paneldan boshqaruv, avvalo telefon uchun.",
  },
};

/** Приложение для iPhone: скидка 60% по предложению на 48 часов. */
export const APP = {
  price: 8750,
  promo: 3500,
  off: 60,
  ru: {
    t: "Приложение для iPhone (iOS)",
    d: "Новостройки и фильтры, карточка ЖК, схема планировки, запись на показ, бесплатный подбор, ипотека, карта, избранное и сравнение, уведомления, профиль. На вашей базе DomTut, публикация в App Store.",
  },
  uz: {
    t: "iPhone (iOS) uchun ilova",
    d: "Yangi binolar va filtrlar, TJM kartochkasi, reja sxemasi, ko‘rishga yozilish, bepul tanlov, ipoteka, xarita, sevimlilar va solishtirish, bildirishnomalar, profil. DomTut bazangizda, App Store’ga joylash.",
  },
};

/** Оплата наличными — минус 10% от итога. */
export const CASH_OFF = 10;

/* why — чем доп полезен DomTut; who — у кого из конкурентов это уже есть. */
export const ADDONS = [
  {
    id: "push", price: 420, star: true,
    ru: { t: "Сохранённый поиск и пуши", e: "Новый ЖК по фильтру, снижение цены и старт продаж в избранном: человек сам возвращается в приложение", who: "есть у Urbo и Krisha" },
    uz: { t: "Saqlangan qidiruv va push-xabarlar", e: "Filtr bo‘yicha yangi TJM, sevimlilarda narx tushishi va savdo boshlanishi: odam ilovaga o‘zi qaytadi", who: "Urbo va Krisha’da bor" },
  },
  {
    id: "sms", price: 180,
    ru: { t: "Вход по SMS-коду", e: "Без пароля и бесконечной регистрации: на это жалуются в отзывах о нынешнем приложении", who: "есть у Urbo" },
    uz: { t: "SMS-kod orqali kirish", e: "Parolsiz va cheksiz ro‘yxatdan o‘tishsiz: hozirgi ilova haqidagi sharhlarda shundan shikoyat qilishadi", who: "Urbo’da bor" },
  },
  {
    id: "booking", price: 350, star: true,
    ru: { t: "Запись на показ с календарём менеджера", e: "Свободные окна менеджера и застройщика, напоминание клиенту за день и за час", who: "есть у Uysot" },
    uz: { t: "Menejer kalendari bilan ko‘rishga yozilish", e: "Menejer va quruvchining bo‘sh vaqtlari, mijozga bir kun va bir soat oldin eslatma", who: "Uysot’da bor" },
  },
  {
    id: "crm", price: 290,
    ru: { t: "Заявки в CRM", e: "Подбор, показы и ипотека падают в amoCRM или Bitrix24 с источником: видно, что продаёт", who: "Uysot продаёт CRM застройщикам" },
    uz: { t: "Arizalar CRM’ga", e: "Tanlov, ko‘rish va ipoteka arizalari manbasi bilan amoCRM yoki Bitrix24’ga tushadi: nima sotayotgani ko‘rinadi", who: "Uysot quruvchilarga CRM sotadi" },
  },
  {
    id: "pay", price: 420,
    ru: { t: "Оплата размещения через Click и Payme", e: "Риелтор поднимает объявление и платит за тариф прямо в приложении, без звонка менеджеру", who: "есть у Joymee" },
    uz: { t: "Click va Payme orqali joylash to‘lovi", e: "Rieltor e’lonni ko‘taradi va tarifni to‘g‘ridan-to‘g‘ri ilovada to‘laydi, menejerga qo‘ng‘iroqsiz", who: "Joymee’da bor" },
  },
  {
    id: "bot", price: 300,
    ru: { t: "Telegram-бот подборок", e: "Подписчики канала получают ЖК по своему бюджету и району прямо в Telegram", who: "Golden House ведёт новости через бота" },
    uz: { t: "Tanlovlar Telegram-boti", e: "Kanal obunachilari o‘z byudjeti va tumani bo‘yicha TJMlarni to‘g‘ridan-to‘g‘ri Telegramda oladi", who: "Golden House yangiliklarni bot orqali beradi" },
  },
  {
    id: "dev", price: 650, star: true,
    ru: { t: "Кабинет застройщика", e: "Просмотры, избранное и заявки по каждому ЖК: застройщику есть за что платить за рекламу", who: "Urbo даёт застройщикам дашборд спроса" },
    uz: { t: "Quruvchi kabineti", e: "Har bir TJM bo‘yicha ko‘rishlar, sevimlilar va arizalar: quruvchiga reklama uchun to‘lashga sabab bor", who: "Urbo quruvchilarga talab dashbordini beradi" },
  },
  {
    id: "estimate", price: 260,
    ru: { t: "Оценка квартиры по статистике района", e: "Ваша статистика цен за м² превращается в «сколько стоит моя квартира» и заявку на продажу", who: "есть у Krisha и Urbo" },
    uz: { t: "Tuman statistikasi bo‘yicha kvartirani baholash", e: "m² narxlari statistikangiz «kvartiram qancha turadi» va sotish arizasiga aylanadi", who: "Krisha va Urbo’da bor" },
  },
  {
    id: "care", price: 400,
    ru: { t: "Поддержка год", e: "Обновления под новые версии iOS и Android, правки, отчёт по сбоям каждый месяц", who: "у студий от 4,8 млн сум в год" },
    uz: { t: "Bir yillik qo‘llab-quvvatlash", e: "iOS va Android’ning yangi versiyalariga yangilash, tuzatishlar, har oy nosozliklar hisoboti", who: "studiyalarda yiliga 4,8 mln so‘mdan" },
  },
];

export const ALL = BASE.price + APP.price + ADDONS.reduce((s, a) => s + a.price, 0);
