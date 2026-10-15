/*
 * Конструктор предложения DevUz для Invis. Владелец, 15.10.2026: «сайт без
 * допов 1 700 $; с допами не больше 3 000 $ в сумме за всё». Допы — то, что
 * клубу нужно по исследованию (docs/research/invis.md, раздел 6), цены —
 * середина рынка. Акции 48 часов нет: её цену решает владелец.
 */
export const MAX = 3000;
export const BASE = {
  price: 1700,
  ru: { t: "Сайт клуба", e: "Первый экран со знаком, сетап, зоны и цены, бронь через Telegram клуба, контакты и карта, русский и узбекский" },
  uz: { t: "Klub sayti", e: "Belgili birinchi ekran, setap, zonalar va narxlar, klub Telegrami orqali bron, kontaktlar va xarita, rus va o‘zbek tillari" },
};
export const ADDONS = [
  { id: "booking", price: 330, star: true,
    ru: { t: "Бронь на карте зала с синхронизацией", e: "Свободные места вживую из системы клуба: SmartShell и iCafeCloud по их открытому API, Langame и SENET по запросу у разработчика; бронь сразу в системе, место не отдадут другому" },
    uz: { t: "Sinxronlangan zal xaritasida bron", e: "Klub tizimidan jonli bo‘sh joylar: SmartShell va iCafeCloud ochiq API orqali, Langame va SENET ishlab chiquvchidan so‘rov bilan; bron darhol tizimda, joy boshqaga berilmaydi" } },
  { id: "cabinet", price: 180,
    ru: { t: "Кабинет игрока", e: "Баланс и пополнение, брони, история посещений, бонусы, друзья и приглашения" },
    uz: { t: "O‘yinchi kabineti", e: "Balans va to‘ldirish, bronlar, tashriflar tarixi, bonuslar, do‘stlar va takliflar" } },
  { id: "bot", price: 160,
    ru: { t: "Telegram-бот клуба", e: "Бронь, напоминание за 30 минут, баланс и колесо прямо в Telegram" },
    uz: { t: "Klubning Telegram boti", e: "Bron, 30 daqiqa oldin eslatma, balans va g‘ildirak to‘g‘ridan-to‘g‘ri Telegramda" } },
  { id: "pay", price: 140,
    ru: { t: "Оплата Click и Payme", e: "Пополнение баланса с сайта, деньги сразу на счёте игрока в системе клуба" },
    uz: { t: "Click va Payme to‘lovi", e: "Saytdan balansni to‘ldirish, pul darhol klub tizimidagi o‘yinchi hisobida" } },
  { id: "tour", price: 130,
    ru: { t: "Турниры", e: "Страница турнира по CS2 и другим играм, запись команд, сетка и результаты" },
    uz: { t: "Turnirlar", e: "CS2 va boshqa o‘yinlar turniri sahifasi, jamoalarni ro‘yxatga olish, setka va natijalar" } },
  { id: "admin", price: 120,
    ru: { t: "Пульт администратора", e: "Зал вживую, брони, клиенты, тарифы в одном месте, смены и касса" },
    uz: { t: "Administrator pulti", e: "Jonli zal, bronlar, mijozlar, tariflar bitta joyda, smenalar va kassa" } },
  { id: "loyal", price: 110,
    ru: { t: "Уровни и бонусы", e: "Очки за часы игры, уровни с подарками, бонус к пополнению по будням, подарок за друга" },
    uz: { t: "Darajalar va bonuslar", e: "O‘yin soatlari uchun ochkolar, sovg‘ali darajalar, ish kunlari to‘ldirishga bonus, do‘st uchun sovg‘a" } },
  { id: "wheel", price: 70,
    ru: { t: "Колесо бонусов", e: "Раз в день, шансы 65/25/10 зашиты в коде, подаренные часы на бонусный счёт, отчёт для админа" },
    uz: { t: "Bonus g‘ildiragi", e: "Kuniga bir marta, 65/25/10 imkoniyatlar kodda, sovg‘a soatlar bonus hisobiga, admin uchun hisobot" } },
  { id: "en", price: 60,
    ru: { t: "Английская версия", e: "Третий язык для гостей города и иностранных студентов" },
    uz: { t: "Inglizcha versiya", e: "Shahar mehmonlari va xorijlik talabalar uchun uchinchi til" } },
];
export const ALL = BASE.price + ADDONS.reduce((s, a) => s + a.price, 0);
if (ALL > MAX) throw new Error(`со всеми допами ${ALL} $ больше ${MAX} $`);
