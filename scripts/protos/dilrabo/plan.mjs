// Конструктор цены Dilrabo Travel: «Минимум» или «Максимум» и допы тумблерами.
//
// Владелец, 16.10.2026: «все механики и допы возьми с реализованных макетов».
// Цены, сроки, допы и «наличными −10%» — как у inapp (владелец, 14.10.2026):
// «Минимум» 5 900 $, 8-10 недель; «Максимум» 7 900 $, 11-13 недель. Вместо
// Турвизора — каталог их собственных туров в Битрикс24: они продают свои
// программы по Узбекистану, а не туры чужих операторов. Акции 48 часов нет,
// как у inapp: её цену решает владелец.
// Все цены макета живут здесь, и только здесь. Держит tests/proto-bundles.test.ts.

export const TIERS = [
  {
    id: "min", price: 5900, weeks: [8, 10],
    ru: {
      t: "Минимум",
      d: "Приложение с вашими турами: поиск, бронь и оплата.",
      items: [
        "Приложение для iPhone и Android, публикация в App Store и Google Play",
        "Ваши туры из каталога в Битрикс24: поиск по городу, датам, дням и гостям, дешёвые сверху, ближайшие выезды",
        "Тур: фото, программа по дням, проживание, переезды, цена в группе и своей машиной",
        "Проверка мест и цены перед бронью: отели, поезд, гид и машина",
        "Бронь: гости латиницей, контакты, согласие; сделка в нужной колонке Битрикс24",
        "Оплата картами Visa и Mastercard любой страны, Click, Payme, Uzum Bank на счёт агентства",
        "Русский и узбекский",
      ],
    },
    uz: {
      t: "Minimum",
      d: "Turlaringiz bilan ilova: qidiruv, bron va to‘lov.",
      items: [
        "iPhone va Android uchun ilova, App Store va Google Play’ga joylash",
        "Bitrix24’dagi katalogdan turlaringiz: shahar, sana, kun va mehmonlar bo‘yicha qidiruv, arzonlari tepada, yaqin jo‘nashlar",
        "Tur: suratlar, kunlar bo‘yicha dastur, turar joy, ko‘chishlar, guruhda va o‘z mashinangizda narx",
        "Bron oldidan joy va narxni tekshirish: mehmonxona, poyezd, gid va mashina",
        "Bron: lotincha mehmonlar, kontaktlar, rozilik; Bitrix24’ning kerakli ustunida bitim",
        "Istalgan davlatning Visa va Mastercard kartalari, Click, Payme, Uzum Bank orqali agentlik hisobiga to‘lov",
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
        "Документы из сделки в приложении: ваучер, билеты, страховка, программа по дням; открываются без интернета",
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
        "Bitimdan hujjatlar ilovada: vaucher, chiptalar, sug‘urta, kunlar bo‘yicha dastur; internetsiz ochiladi",
        "Bronning har bir qadamida bildirishnoma",
        "Telefon raqami va SMS kod bilan kirish, sayohatlarim, saqlangan turistlar",
        "Ilovada oldindan to‘lov va qolganini to‘lash, tushunarli holat bilan rad etish va qaytarish",
      ],
    },
  },
];

/*
 * Сайт (владелец, 16.10.2026: «Сделай ещё сайт за 1000$ и допы на 2000$
 * раскидай на 10-15 позиций, а то только приложение сейчас за 5900
 * минимум»). Отдельный вариант рядом с приложением, со своими допами:
 * со всеми допами сайт стоит 3 000 $.
 */
export const SITE = {
  id: "site", price: 1000, weeks: [3, 4], g: "site",
  ru: {
    t: "Сайт",
    d: "Новый dilrabotravel.com: ваши туры, цена видна сразу, заявка в один шаг.",
    items: [
      "Дизайн в вашем стиле: знак, цвета, шрифт Tilda Sans",
      "Каталог туров: фильтр по городу и числу дней, фото",
      "Страница тура: программа по дням, что входит, переезды, форматы",
      "Заявка на тур в один шаг и кнопки WhatsApp и Telegram",
      "Сначала для телефона, быстрая загрузка",
      "Панель, где менеджер сам правит туры, фото и цены",
      "Русский и узбекский",
    ],
  },
  uz: {
    t: "Sayt",
    d: "Yangi dilrabotravel.com: turlaringiz, narx darhol ko‘rinadi, ariza bir qadamda.",
    items: [
      "Uslubingizdagi dizayn: belgi, ranglar, Tilda Sans shrifti",
      "Turlar katalogi: shahar va kunlar soni bo‘yicha filtr, suratlar",
      "Tur sahifasi: kunlar bo‘yicha dastur, nima kiradi, ko‘chishlar, formatlar",
      "Bir qadamda turga ariza va WhatsApp hamda Telegram tugmalari",
      "Avval telefon uchun, tez yuklanish",
      "Menejer turlar, suratlar va narxlarni o‘zi o‘zgartiradigan panel",
      "Rus va o‘zbek tillari",
    ],
  },
};

/* Допы к сайту: 13 позиций, вместе ровно 2 000 $. Недели — сколько добавляют к сроку. */
export const SITE_ADDONS = [
  { id: "s-book", price: 300, weeks: 1, star: true,
    ru: { t: "Онлайн-бронь с проверкой мест", e: "Гость выбирает даты и формат, сайт сверяет места и цену, бронь сразу. Вместо «подтвердим в течение 24 часов»" },
    uz: { t: "Joylarni tekshirib onlayn bron", e: "Mehmon sana va formatni tanlaydi, sayt joy va narxni tekshiradi, bron darhol. «24 soat ichida tasdiqlaymiz» o‘rniga" } },
  { id: "s-pay", price: 250, weeks: 1, star: true,
    ru: { t: "Оплата на сайте", e: "Visa и Mastercard любой страны, Click, Payme. Полностью или предоплатой, процент задаёте вы" },
    uz: { t: "Saytda to‘lov", e: "Istalgan davlatning Visa va Mastercard kartalari, Click, Payme. To‘liq yoki oldindan, foizni siz belgilaysiz" } },
  { id: "s-crm", price: 150, weeks: 0,
    ru: { t: "Заявки и брони в Битрикс24", e: "Каждая заявка с сайта сразу сделкой в нужной колонке: контакт, тур, даты, сумма" },
    uz: { t: "Ariza va bronlar Bitrix24’ga", e: "Saytdagi har bir ariza darhol kerakli ustunda bitim: kontakt, tur, sanalar, summa" } },
  { id: "s-calc", price: 150, weeks: 0,
    ru: { t: "Калькулятор: в группе или своей машиной", e: "Гость видит цену за всех на свои даты: группа, Gentra, H1 или Staria" },
    uz: { t: "Kalkulyator: guruhda yoki o‘z mashinasida", e: "Mehmon o‘z sanalariga hamma uchun narxni ko‘radi: guruh, Gentra, H1 yoki Staria" } },
  { id: "s-cal", price: 150, weeks: 1,
    ru: { t: "Календарь групповых выездов", e: "Ближайшие даты групп и сколько мест осталось. Менеджер ведёт его в панели" },
    uz: { t: "Guruh jo‘nashlari taqvimi", e: "Guruhlarning yaqin sanalari va qancha joy qolgani. Menejer uni panelda yuritadi" } },
  { id: "s-cabinet", price: 250, weeks: 1,
    ru: { t: "Кабинет гостя", e: "Статус брони, ваучер, билеты и программа по дням в одном месте, без писем" },
    uz: { t: "Mehmon kabineti", e: "Bron holati, vaucher, chiptalar va kunlar bo‘yicha dastur bir joyda, xatlarsiz" } },
  { id: "s-en", price: 120, weeks: 0,
    ru: { t: "Английская версия", e: "Для гостей из-за рубежа: все туры, страницы и заявка на английском" },
    uz: { t: "Inglizcha versiya", e: "Chet ellik mehmonlar uchun: barcha turlar, sahifalar va ariza ingliz tilida" } },
  { id: "s-lang", price: 100, weeks: 0,
    ru: { t: "Ещё один язык", e: "Например, малайский или индонезийский для гостей туров Ziarah" },
    uz: { t: "Yana bir til", e: "Masalan, Ziarah turlari mehmonlari uchun malay yoki indonez tili" } },
  { id: "s-seo", price: 150, weeks: 1,
    ru: { t: "Страницы под поисковые запросы", e: "«Туры в Самарканд», «тур в Бухару», «экскурсии в Фергане»: отдельные страницы, чтобы находили в Google и Яндексе" },
    uz: { t: "Qidiruv so‘rovlari uchun sahifalar", e: "«Samarqandga turlar», «Buxoroga tur», «Farg‘onada ekskursiyalar»: Google va Yandexda topishlari uchun alohida sahifalar" } },
  { id: "s-reviews", price: 60, weeks: 0,
    ru: { t: "Отзывы с Яндекс Карт и Google", e: "Ваши настоящие отзывы на сайте, подтягиваются сами" },
    uz: { t: "Yandex Xaritalar va Google sharhlari", e: "Haqiqiy sharhlaringiz saytda, o‘zi yangilanadi" } },
  { id: "s-move", price: 100, weeks: 0,
    ru: { t: "Перенос со старого сайта", e: "Туры, программы, фото и тексты переносим сами, старые адреса ведут на новые страницы" },
    uz: { t: "Eski saytdan ko‘chirish", e: "Turlar, dasturlar, suratlar va matnlarni o‘zimiz ko‘chiramiz, eski manzillar yangi sahifalarga olib boradi" } },
  { id: "s-stats", price: 70, weeks: 0,
    ru: { t: "Аналитика", e: "Яндекс Метрика и Google Analytics: сколько смотрели, оставили заявку и оплатили" },
    uz: { t: "Analitika", e: "Yandex Metrika va Google Analytics: qancha ko‘rildi, ariza qoldirildi va to‘landi" } },
  { id: "s-care", price: 150, weeks: 0,
    ru: { t: "Поддержка 3 месяца после запуска", e: "Правки, новые туры и сезонные цены, помощь менеджерам с панелью" },
    uz: { t: "Ishga tushirilgandan keyin 3 oy qo‘llab-quvvatlash", e: "Tuzatishlar, yangi turlar va mavsumiy narxlar, menejerlarga panel bo‘yicha yordam" } },
];

/* Допы: цена по середине рынка Ташкента, недели — сколько добавляют к сроку. */
export const ADDONS = [
  { id: "watch", price: 450, weeks: 1, star: true,
    ru: { t: "Следить за ценой и местами", e: "Гость подписывается на тур, приложение шлёт уведомление, когда дешевле или в группе освободилось место. Возвращает тех, кто ушёл думать" },
    uz: { t: "Narx va joylarni kuzatish", e: "Mehmon turga obuna bo‘ladi, ilova arzonlashganda yoki guruhda joy bo‘shaganda xabar yuboradi. O‘ylab ketganlarni qaytaradi" } },
  { id: "nasiya", price: 600, weeks: 1, star: true,
    ru: { t: "Рассрочка: Uzum Nasiya или Alif Nasiya", e: "Для гостей из Узбекистана: поездка по долине или в Самарканд в рассрочку прямо в оплате" },
    uz: { t: "Muddatli to‘lov: Uzum Nasiya yoki Alif Nasiya", e: "O‘zbekistonlik mehmonlar uchun: vodiy yoki Samarqandga sayohatni to‘lovning o‘zida muddatli to‘lovga olish" } },
  { id: "chat", price: 550, weeks: 1,
    ru: { t: "Чат с менеджером в приложении", e: "Через открытые линии Битрикс24: переписка лежит в той же сделке, менеджер отвечает из CRM" },
    uz: { t: "Ilovada menejer bilan chat", e: "Bitrix24 ochiq liniyalari orqali: yozishma o‘sha bitimda turadi, menejer CRM’dan javob beradi" } },
  { id: "extras", price: 400, weeks: 0,
    ru: { t: "Допы к брони", e: "Гид на своём языке, встреча в аэропорту на своей машине, помощь с визой, лишний день в Самарканде: деньги сверх тура и строка в сделке" },
    uz: { t: "Bronga qo‘shimchalar", e: "O‘z tilida gid, aeroportda o‘z mashinasida kutib olish, viza yordami, Samarqandda qo‘shimcha kun: turdan tashqari pul va bitimda qator" } },
  { id: "bonus", price: 650, weeks: 1,
    ru: { t: "Бонусы и промокоды", e: "Скидка на вторую поездку и «приведи друга»: повторная продажа без рекламы" },
    uz: { t: "Bonuslar va promokodlar", e: "Ikkinchi sayohatga chegirma va «do‘stingni olib kel»: reklamasiz takroriy sotuv" } },
  { id: "web", price: 1500, weeks: 2,
    ru: { t: "Сайт с тем же поиском и бронью", e: "Те же туры, проверка мест, бронь и оплата на dilrabotravel.com, для гостей, которые не ставят приложение" },
    uz: { t: "Xuddi shu qidiruv va bronli sayt", e: "O‘sha turlar, joylarni tekshirish, bron va to‘lov dilrabotravel.com’da, ilova o‘rnatmaydigan mehmonlar uchun" } },
  { id: "bot", price: 900, weeks: 1,
    ru: { t: "Telegram-бот с турами", e: "Поиск и ближайшие выезды в Telegram, заявка в ту же колонку Битрикс24" },
    uz: { t: "Turlar bilan Telegram-bot", e: "Telegramda qidiruv va yaqin jo‘nashlar, ariza Bitrix24’ning o‘sha ustuniga" } },
  { id: "stats", price: 350, weeks: 0,
    ru: { t: "Отчёт по продажам", e: "Сколько искали, сколько забронировали и оплатили, какие туры и города продаются" },
    uz: { t: "Sotuv hisoboti", e: "Qancha qidirildi, qancha bron qilindi va to‘landi, qaysi turlar va shaharlar sotilmoqda" } },
  { id: "care", price: 750, weeks: 0,
    ru: { t: "Поддержка 3 месяца после запуска", e: "Правки, обновления под новые версии iOS и Android, помощь при проверке в магазинах" },
    uz: { t: "Ishga tushirilgandan keyin 3 oy qo‘llab-quvvatlash", e: "Tuzatishlar, iOS va Android yangi versiyalariga yangilash, do‘konlar tekshiruvida yordam" } },
];

/*
 * Расходы агентства мимо нас. Турвизора здесь нет: туры свои, каталог — в
 * их Битрикс24.
 */
export const COSTS = [
  { ru: ["Домен и хостинг сайта", "по тарифу хостинга"], uz: ["Sayt domeni va xostingi", "xosting tarifi bo‘yicha"] },
  { ru: ["Битрикс24", "ваш тариф, отдельно не нужен"], uz: ["Bitrix24", "tarifingiz, alohida kerak emas"] },
  { ru: ["Приём карт Visa и Mastercard", "комиссия банка по договору"], uz: ["Visa va Mastercard kartalarini qabul qilish", "shartnoma bo‘yicha bank komissiyasi"] },
  { ru: ["Apple Developer", "99 $ в год"], uz: ["Apple Developer", "yiliga 99 $"] },
  { ru: ["Google Play", "25 $ один раз"], uz: ["Google Play", "bir marta 25 $"] },
  { ru: ["Click, Payme, Uzum", "комиссия по договору"], uz: ["Click, Payme, Uzum", "shartnoma bo‘yicha komissiya"] },
  { ru: ["SMS для входа", "по тарифу сервиса рассылки"], uz: ["Kirish uchun SMS", "xabar xizmati tarifi bo‘yicha"] },
];

/* Владелец, 14.10.2026: при оплате наличными минус 10% от цены, от итога вместе с допами. */
export const CASH_OFF = 10;

export const SITE_ALL = SITE.price + SITE_ADDONS.reduce((s, a) => s + a.price, 0);
export const ALL = TIERS[1].price + ADDONS.reduce((s, a) => s + a.price, 0);
