// Конструктор цены: «Минимум» или «Максимум» и допы тумблерами.
//
// Владелец, 14.10.2026: «Минимум» (приложение iOS и Android, туры из
// Турвизора, бронь в Битрикс24, оплата) 5 900 $, 8-10 недель; «Максимум»
// (+ статусы из Битрикс24, документы в приложении, уведомления, вход по SMS)
// 7 900 $, 11-13 недель; допы по рыночным ставкам. Цены предварительные, из
// разговора с владельцем. Акции 48 часов нет: её цену решает владелец.
// Все цены макета живут здесь, и только здесь. Держит tests/proto-bundles.test.ts.

export const TIERS = [
  {
    id: "min", price: 5900, weeks: [8, 10],
    ru: {
      t: "Минимум",
      d: "То, что вы просили в первую очередь.",
      items: [
        "Приложение для iPhone и Android, публикация в App Store и Google Play",
        "Туры всех туроператоров из Турвизора: поиск, фильтры, дешёвые сверху, горящие",
        "Отель: фото, номер, питание, перелёт, сравнение цены у разных операторов",
        "Проверка цены у туроператора перед бронью",
        "Бронь: туристы латиницей, контакты, согласие; сделка в нужной колонке Битрикс24",
        "Оплата Click, Payme, Uzum Bank и картами на счёт агентства",
        "Русский и узбекский",
      ],
    },
    uz: {
      t: "Minimum",
      d: "Birinchi navbatda so‘raganingiz.",
      items: [
        "iPhone va Android uchun ilova, App Store va Google Play’ga joylash",
        "Turvizordan barcha turoperatorlarning turlari: qidiruv, filtrlar, arzonlari tepada, qaynoq turlar",
        "Mehmonxona: surat, xona, ovqat, parvoz, turli operatorlarda narxni solishtirish",
        "Bron oldidan turoperatorda narxni tekshirish",
        "Bron: lotincha turistlar, kontaktlar, rozilik; Bitrix24’ning kerakli ustunida bitim",
        "Click, Payme, Uzum Bank va kartalar orqali agentlik hisobiga to‘lov",
        "Rus va o‘zbek tillari",
      ],
    },
  },
  {
    id: "max", price: 7900, weeks: [11, 13], star: true,
    ru: {
      t: "Максимум",
      d: "Всё из «Минимума» и путь без звонков до документов.",
      items: [
        "Всё из «Минимума»",
        "Статус брони в приложении: колонка сделки в Битрикс24 = шаг у клиента",
        "Документы из сделки в приложении: ваучер, билеты, страховка; открываются без интернета",
        "Уведомления на каждом шаге брони",
        "Вход по номеру телефона с кодом по SMS, мои поездки, сохранённые туристы",
        "Предоплата и доплата остатка в приложении, отказ и возврат с понятным статусом",
      ],
    },
    uz: {
      t: "Maksimum",
      d: "«Minimum»dagi hammasi va hujjatlargacha qo‘ng‘iroqsiz yo‘l.",
      items: [
        "«Minimum»dagi hammasi",
        "Ilovada bron holati: Bitrix24’dagi bitim ustuni = mijozdagi qadam",
        "Bitimdan hujjatlar ilovada: vaucher, chiptalar, sug‘urta; internetsiz ochiladi",
        "Bronning har bir qadamida bildirishnoma",
        "Telefon raqami va SMS kod bilan kirish, sayohatlarim, saqlangan turistlar",
        "Ilovada oldindan to‘lov va qolganini to‘lash, tushunarli holat bilan rad etish va qaytarish",
      ],
    },
  },
];

/* Допы: цена по середине рынка Ташкента, недели — сколько добавляют к сроку. */
export const ADDONS = [
  { id: "watch", price: 450, weeks: 1, star: true,
    ru: { t: "Следить за ценой", e: "Клиент подписывается на отель или направление, приложение повторяет поиск и шлёт уведомление, когда дешевле. Возвращает тех, кто ушёл думать" },
    uz: { t: "Narxni kuzatish", e: "Mijoz mehmonxona yoki yo‘nalishga obuna bo‘ladi, ilova qidiruvni takrorlaydi va arzonlashganda xabar yuboradi. O‘ylab ketganlarni qaytaradi" } },
  { id: "nasiya", price: 600, weeks: 1, star: true,
    ru: { t: "Рассрочка: Uzum Nasiya или Alif Nasiya", e: "Тур в рассрочку прямо в оплате. В Узбекистане туры в рассрочку уже продают Mobtrip и FUN&SUN" },
    uz: { t: "Muddatli to‘lov: Uzum Nasiya yoki Alif Nasiya", e: "To‘lovning o‘zida turni muddatli to‘lovga olish. O‘zbekistonda turlarni muddatli to‘lovga Mobtrip va FUN&SUN allaqachon sotadi" } },
  { id: "chat", price: 550, weeks: 1,
    ru: { t: "Чат с менеджером в приложении", e: "Через открытые линии Битрикс24: переписка лежит в той же сделке, менеджер отвечает из CRM" },
    uz: { t: "Ilovada menejer bilan chat", e: "Bitrix24 ochiq liniyalari orqali: yozishma o‘sha bitimda turadi, menejer CRM’dan javob beradi" } },
  { id: "extras", price: 400, weeks: 0,
    ru: { t: "Допы к брони", e: "Страховка от невыезда, индивидуальный трансфер, помощь с визой, места рядом: деньги сверх тура и строка в сделке" },
    uz: { t: "Bronga qo‘shimchalar", e: "Chiqa olmaslikdan sug‘urta, shaxsiy transfer, viza yordami, yonma-yon joylar: turdan tashqari pul va bitimda qator" } },
  { id: "bonus", price: 650, weeks: 1,
    ru: { t: "Бонусы и промокоды", e: "Скидка на вторую поездку и «приведи друга»: повторная продажа без рекламы" },
    uz: { t: "Bonuslar va promokodlar", e: "Ikkinchi sayohatga chegirma va «do‘stingni olib kel»: reklamasiz takroriy sotuv" } },
  { id: "web", price: 1500, weeks: 2,
    ru: { t: "Сайт с тем же поиском и бронью", e: "Те же туры, проверка цены, бронь и оплата на сайте агентства, для тех, кто не ставит приложение" },
    uz: { t: "Xuddi shu qidiruv va bronli sayt", e: "O‘sha turlar, narxni tekshirish, bron va to‘lov agentlik saytida, ilova o‘rnatmaydiganlar uchun" } },
  { id: "bot", price: 900, weeks: 1,
    ru: { t: "Telegram-бот с турами", e: "Поиск и горящие туры в Telegram, заявка в ту же колонку Битрикс24" },
    uz: { t: "Turlar bilan Telegram-bot", e: "Telegramda qidiruv va qaynoq turlar, ariza Bitrix24’ning o‘sha ustuniga" } },
  { id: "stats", price: 350, weeks: 0,
    ru: { t: "Отчёт по продажам", e: "Сколько искали, сколько забронировали и оплатили, какие направления продаются" },
    uz: { t: "Sotuv hisoboti", e: "Qancha qidirildi, qancha bron qilindi va to‘landi, qaysi yo‘nalishlar sotilmoqda" } },
  { id: "care", price: 750, weeks: 0,
    ru: { t: "Поддержка 3 месяца после запуска", e: "Правки, обновления под новые версии iOS и Android, помощь при проверке в магазинах" },
    uz: { t: "Ishga tushirilgandan keyin 3 oy qo‘llab-quvvatlash", e: "Tuzatishlar, iOS va Android yangi versiyalariga yangilash, do‘konlar tekshiruvida yordam" } },
];

/*
 * Расходы агентства мимо нас: из исследования docs/research/tourvisor-app.md.
 * Цены Турвизора — с его сайта, в рублях: тарифа в сумах у него нет.
 */
export const COSTS = [
  { ru: ["Турвизор, API «Поиск туров»", "от 5 000 ₽ в месяц"], uz: ["Turvizor, «Turlarni qidirish» API", "oyiga 5 000 ₽ dan"] },
  { ru: ["Турвизор, «Описание отелей»", "от 3 000 ₽ в месяц"], uz: ["Turvizor, «Mehmonxonalar tavsifi»", "oyiga 3 000 ₽ dan"] },
  { ru: ["Apple Developer", "99 $ в год"], uz: ["Apple Developer", "yiliga 99 $"] },
  { ru: ["Google Play", "25 $ один раз"], uz: ["Google Play", "bir marta 25 $"] },
  { ru: ["Click, Payme, Uzum", "комиссия по договору"], uz: ["Click, Payme, Uzum", "shartnoma bo‘yicha komissiya"] },
  { ru: ["SMS для входа", "по тарифу сервиса рассылки"], uz: ["Kirish uchun SMS", "xabar xizmati tarifi bo‘yicha"] },
];

/* Владелец, 14.10.2026: при оплате наличными минус 10% от цены, от итога вместе с допами. */
export const CASH_OFF = 10;

export const ALL = TIERS[1].price + ADDONS.reduce((s, a) => s + a.price, 0);
