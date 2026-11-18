// Конструктор цены макета агрегатора микрозаймов Qiyos: сайт и допы тумблерами.
//
// Навык mockup: сайт 1 000 $, с допами не больше 3 000 $. Тумблер включает и
// выключает настоящий блок на сайте (data-addon="<id>"), итог считается сразу.
// Обычная цена 3 900 $: страница-сравнение с калькулятором аннуитета,
// фильтрами, карточками банков и учётом переходов у студий Ташкента —
// 35-55 млн сум (docs/research/qiyos.md, «Цены»). Допы — от ставок нашего
// калькулятора (content/calculator.ts), к середине рыночной вилки.

export const BASE = {
  price: 3900,
  promo: 1000,
  ru: {
    t: "Сайт-сравнение микрозаймов",
    d: "Одна страница на русском и узбекском, сначала под телефон: сумма и срок ползунками, предложения банков-партнёров с платежом в месяц, переплатой и итогом для этой суммы, сортировка и фильтры, лицензия ЦБ на каждой карточке, предупреждение о рисках по закону, партнёрская ссылка на «Получить».",
  },
  uz: {
    t: "Mikroqarzlarni solishtirish sayti",
    d: "Rus va o‘zbek tilida bitta sahifa, avvalo telefon uchun: summa va muddat slayderlarda, hamkor banklar takliflari oylik to‘lov, ortiqcha to‘lov va shu summa bo‘yicha jami bilan, saralash va filtrlar, har bir kartochkada MB litsenziyasi, qonun bo‘yicha xatar ogohlantirishi, «Olish»da hamkorlik havolasi.",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

export const ADDONS = [
  { id: "admin", price: 450, star: true,
    ru: { t: "Админка партнёров и переходов", e: "Партнёры, ставки, суммы и ссылки без программиста, порядок и «рекомендуем», переходы с суммой и сроком, вознаграждение по банкам, роли и история", who: "у bank.uz и vbr.uz выдача управляется вручную" },
    uz: { t: "Hamkorlar va o‘tishlar admin paneli", e: "Hamkorlar, stavkalar, summalar va havolalar dasturchisiz, tartib va «tavsiya qilamiz», summa va muddat bilan o‘tishlar, banklar bo‘yicha mukofot, rollar va tarix", who: "bank.uz va vbr.uz’da natijalar qo‘lda boshqariladi" } },
  { id: "postback", price: 300, star: true,
    ru: { t: "Учёт выдач от партнёров", e: "Банк или партнёрская сеть присылает «заявка, одобрено, выдано» по метке перехода, вознаграждение считается само", who: "так работают Банки.ру и Сравни в России" },
    uz: { t: "Hamkorlardan berilgan qarzlar hisobi", e: "Bank yoki hamkorlik tarmog‘i o‘tish belgisi bo‘yicha «ariza, ma’qullandi, berildi» yuboradi, mukofot o‘zi hisoblanadi", who: "Rossiyada Banki.ru va Sravni shunday ishlaydi" } },
  { id: "plan", price: 150,
    ru: { t: "График платежей по займу", e: "У каждого предложения: сколько из платежа уходит в проценты, сколько в долг, по месяцам", who: "есть в калькуляторах самих банков" },
    uz: { t: "Qarz bo‘yicha to‘lovlar jadvali", e: "Har bir taklifda: to‘lovning qancha qismi foizga, qanchasi qarzga ketadi, oylar bo‘yicha", who: "banklarning o‘z kalkulyatorlarida bor" } },
  { id: "compare", price: 150,
    ru: { t: "Сравнить два-три займа рядом", e: "Отметить предложения и увидеть платёж, переплату, срок и требования в одной таблице", who: "у bank.uz сравнения нет" },
    uz: { t: "Ikki-uch qarzni yonma-yon solishtirish", e: "Takliflarni belgilab, to‘lov, ortiqcha to‘lov, muddat va talablarni bitta jadvalda ko‘rish", who: "bank.uz’da solishtirish yo‘q" } },
  { id: "dti", price: 150,
    ru: { t: "Проверка долговой нагрузки", e: "Доход и текущие платежи: сколько ещё можно платить в месяц, чтобы банк не отказал", who: "в агрегаторах Узбекистана не нашли" },
    uz: { t: "Qarz yukini tekshirish", e: "Daromad va joriy to‘lovlar: bank rad etmasligi uchun oyiga yana qancha to‘lash mumkin", who: "O‘zbekiston agregatorlarida topilmadi" } },
  { id: "bot", price: 250,
    ru: { t: "Telegram-бот подбора", e: "Сумма и срок в боте, три лучших предложения с платежом и кнопкой, напоминание о платеже", who: "у агрегаторов Узбекистана бота нет" },
    uz: { t: "Tanlash Telegram-boti", e: "Botda summa va muddat, to‘lov va tugma bilan uchta eng yaxshi taklif, to‘lov haqida eslatma", who: "O‘zbekiston agregatorlarida bot yo‘q" } },
  { id: "notify", price: 150,
    ru: { t: "«Сообщить, когда ставка ниже»", e: "Человек оставляет Telegram, сервис пишет, когда у партнёра появится ставка ниже нужной", who: "у vbr.uz подписки нет" },
    uz: { t: "«Stavka pasayganda xabar berish»", e: "Odam Telegramini qoldiradi, hamkorda kerakli stavkadan past stavka paydo bo‘lganda servis yozadi", who: "vbr.uz’da obuna yo‘q" } },
  { id: "seo", price: 250,
    ru: { t: "Страницы под запросы и 10 статей", e: "«Микрозайм 10 млн», «займ без справок», «онлайн займ на карту» и страница каждого банка, на двух языках", who: "у bank.uz страницы по запросам есть" },
    uz: { t: "So‘rovlar uchun sahifalar va 10 ta maqola", e: "«10 mln mikroqarz», «ma’lumotnomasiz qarz», «kartaga onlayn qarz» va har bir bank sahifasi, ikki tilda", who: "bank.uz’da so‘rovlar bo‘yicha sahifalar bor" } },
  { id: "pwa", price: 100,
    ru: { t: "Сайт как приложение", e: "Значок на экране телефона без App Store, расчёт открывается и без сети", who: "у агрегаторов Узбекистана только сайт" },
    uz: { t: "Ilova kabi sayt", e: "App Store’siz telefon ekranida belgi, hisob internetsiz ham ochiladi", who: "O‘zbekiston agregatorlarida faqat sayt" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
