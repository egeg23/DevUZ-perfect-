// Конструктор цены хаба Instagram → Telegram: основа по акции 48 часов и допы
// тумблерами, как в karomat и tovar.
//
// Задание владельца DevUz, 20.10.2026: «Стоимость с допами и отсчётом 48 часов…
// Основа и допы — середина рынка Ташкента и СНГ». Готовые сервисы СНГ
// (Wazzup, Umnico, i2crm) берут подписку каждый месяц, у нас разовая сборка
// под клиента и сервер за его счёт: сравнение в docs/research/ig-tg-hub.md.
//
// Владелец, 20.10.2026: «Цена 500$ и допы со скидкой 50%» — хаб 500 $ по
// акции, все допы вдвое дешевле.
//
// Все цены макета живут здесь, и только здесь. Держит tests/proto-bundles.test.ts.

/** Хаб: Instagram Direct → Telegram, «Взять», темы менеджеров, ответы обратно. */
export const BASE = {
  price: 1800,
  promo: 500,
  weeks: [2, 3],
  ru: {
    t: "Хаб Instagram → Telegram",
    d: "Сообщения из Direct и ответы на рекламу сразу в Telegram: карточка заявки с превью объявления, «Взять», тема клиента у менеджера, ответ из Telegram уходит в Instagram от имени компании, фото, видео и голос в обе стороны, готовые ответы на русском и узбекском, таймер окна 24 часа, напоминание, если клиент ждёт",
  },
  uz: {
    t: "Instagram → Telegram xabmarkazi",
    d: "Direct xabarlari va reklamaga javoblar darhol Telegramda: e’lon ko‘rinishi bilan ariza kartochkasi, «Olish», menejerda mijoz mavzusi, Telegramdagi javob Instagramga kompaniya nomidan ketadi, rasm, video va ovoz ikki tomonga, rus va o‘zbek tilida tayyor javoblar, 24 soatlik oyna taymeri, mijoz kutib qolsa eslatma",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* Допы: star — берут первым. */
export const ADDONS = [
  { id: "crm", price: 150, star: true,
    ru: { t: "Лид в CRM одной кнопкой", e: "amoCRM, Bitrix24 или Odoo: имя, Instagram, объявление и переписка уходят в сделку, статус сделки виден в теме" },
    uz: { t: "Bitta tugma bilan CRMga lid", e: "amoCRM, Bitrix24 yoki Odoo: ism, Instagram, e’lon va yozishma bitimga tushadi, bitim holati mavzuda ko‘rinadi" } },
  { id: "head", price: 100, star: true,
    ru: { t: "Вид руководителя", e: "Все заявки в одной группе по темам, кто сколько взял, время первого ответа, кто ждёт прямо сейчас" },
    uz: { t: "Rahbar ko‘rinishi", e: "Barcha arizalar bitta guruhda mavzular bo‘yicha, kim qancha oldi, birinchi javob vaqti, hozir kim kutyapti" } },
  { id: "ads", price: 100, star: true,
    ru: { t: "Отчёт по рекламе", e: "Сколько заявок пришло с каждого объявления и сколько из них дошли до сделки; каждый вечер в 18:00 в Telegram" },
    uz: { t: "Reklama hisoboti", e: "Har bir e’londan nechta ariza keldi va ulardan nechtasi bitimgacha yetdi; har kuni kechqurun 18:00 da Telegramda" } },
  { id: "multi", price: 125,
    ru: { t: "Несколько Instagram-аккаунтов", e: "Два и больше аккаунтов или филиалов в одном хабе, у каждой заявки видно, в какой аккаунт написали" },
    uz: { t: "Bir nechta Instagram akkaunt", e: "Bitta xabmarkazda ikki va undan ortiq akkaunt yoki filial, har bir arizada qaysi akkauntga yozilgani ko‘rinadi" } },
  { id: "comments", price: 100,
    ru: { t: "Комментарии под рекламой", e: "Вопрос в комментарии под постом или рекламой тоже приходит заявкой, ответ в личку клиенту" },
    uz: { t: "Reklama ostidagi izohlar", e: "Post yoki reklama ostidagi izohdagi savol ham ariza bo‘lib keladi, javob mijozga shaxsiy xabarda" } },
  { id: "night", price: 50,
    ru: { t: "Автоответ ночью и в выходные", e: "Клиенту сразу: «Ответим утром в 9:00», заявка ждёт первого менеджера" },
    uz: { t: "Kechasi va dam olish kunlari avtojavob", e: "Mijozga darhol: «Ertalab 9:00 da javob beramiz», ariza birinchi menejerni kutadi" } },
  { id: "web", price: 200,
    ru: { t: "Веб-панель с историей", e: "Вся переписка с поиском по имени, телефону и тексту, выгрузка в Excel, доступ по ролям" },
    uz: { t: "Tarixli veb-panel", e: "Ism, telefon va matn bo‘yicha qidiruvli barcha yozishma, Excelga yuklash, rollar bo‘yicha kirish" } },
  { id: "wa", price: 200,
    ru: { t: "WhatsApp Business в тот же хаб", e: "Сообщения из WhatsApp приходят такими же заявками, ответ из Telegram уходит в WhatsApp" },
    uz: { t: "WhatsApp Business o‘sha xabmarkazga", e: "WhatsApp xabarlari xuddi shunday ariza bo‘lib keladi, Telegramdagi javob WhatsAppga ketadi" } },
  { id: "fb", price: 100,
    ru: { t: "Facebook Messenger", e: "Сообщения со страницы Facebook и с рекламы в Messenger" },
    uz: { t: "Facebook Messenger", e: "Facebook sahifasi va Messengerdagi reklamadan xabarlar" } },
  { id: "review", price: 75,
    ru: { t: "Проверка приложения Meta под ключ", e: "Готовим видео и описание для проверки Meta, отвечаем на вопросы, пока не одобрят" },
    uz: { t: "Meta ilova tekshiruvi kalit topshirish", e: "Meta tekshiruvi uchun video va tavsif tayyorlaymiz, tasdiqlanguncha savollarga javob beramiz" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
