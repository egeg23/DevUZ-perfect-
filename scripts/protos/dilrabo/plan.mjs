// Конструктор цены Dilrabo Travel: сайт, «Приложение: минимум» или
// «Приложение: максимум» и допы тумблерами.
//
// Владелец, 16.10.2026: «все механики и допы возьми с реализованных макетов».
// Цены, сроки, допы приложения и «наличными −10%» — как у inapp (владелец,
// 14.10.2026): 5 900 $, 8-10 недель; 7 900 $, 11-13 недель. Вместо Турвизора —
// каталог их собственных туров в Битрикс24. Тот же день: «убери упоминания в
// ценах за 5900, что они это просили. Просто назови: приложение минимум и
// распили подробно» — названия и состав ниже.
// Все цены макета живут здесь, и только здесь. Держит tests/proto-bundles.test.ts.

export const TIERS = [
  {
    id: "min", price: 5900, weeks: [8, 10],
    ru: {
      t: "Приложение: минимум",
      d: "Гость сам находит тур, проверяет места, бронирует и платит.",
      items: [
        "Одно приложение для iPhone и Android, публикуем в App Store и Google Play на аккаунты агентства",
        "Каталог туров из Битрикс24: туры, даты групп, цены и места ведёт менеджер, приложение берёт их оттуда",
        "Поиск: город, даты, сколько дней, взрослые и дети с возрастом, питание, класс отелей",
        "Выдача: дешёвые сверху, сортировка по цене и длительности, ближайшие выезды отдельным списком",
        "Страница тура: фото, программа по дням, проживание, питание, переезды поездом и машиной",
        "Как поехать: цена за всех в группе и на своей машине, Gentra, H1 или Staria",
        "Проверка мест и цены перед бронью: отели, билеты на поезд, гид и машина",
        "Бронь: гости латиницей как в паспорте, проверка полей, контакты, согласие с договором",
        "Сделка сама встаёт в нужную колонку Битрикс24: контакт, гости, тур, формат, сумма",
        "Оплата на счёт агентства: Visa и Mastercard любой страны, Click, Payme, Uzum Bank",
        "Полностью или предоплатой, чек об оплате, сделка сама переходит в «Оплачено»",
        "Избранное: гость сохраняет туры и возвращается к ним",
        "Русский и узбекский",
      ],
    },
    uz: {
      t: "Ilova: minimum",
      d: "Mehmon turni o‘zi topadi, joylarni tekshiradi, bron qiladi va to‘laydi.",
      items: [
        "iPhone va Android uchun bitta ilova, agentlik akkauntlariga App Store va Google Play’ga joylaymiz",
        "Bitrix24’dan turlar katalogi: turlar, guruh sanalari, narxlar va joylarni menejer yuritadi, ilova ularni o‘sha yerdan oladi",
        "Qidiruv: shahar, sanalar, necha kun, kattalar va yoshi bilan bolalar, ovqat, mehmonxona darajasi",
        "Natijalar: arzonlari tepada, narx va davomiylik bo‘yicha saralash, yaqin jo‘nashlar alohida ro‘yxatda",
        "Tur sahifasi: suratlar, kunlar bo‘yicha dastur, turar joy, ovqat, poyezd va mashinada ko‘chishlar",
        "Qanday borish: guruhda va o‘z mashinasida hamma uchun narx, Gentra, H1 yoki Staria",
        "Bron oldidan joy va narxni tekshirish: mehmonxonalar, poyezd chiptalari, gid va mashina",
        "Bron: mehmonlar lotincha pasportdagidek, maydonlarni tekshirish, kontaktlar, shartnomaga rozilik",
        "Bitim o‘zi Bitrix24’ning kerakli ustuniga tushadi: kontakt, mehmonlar, tur, format, summa",
        "Agentlik hisobiga to‘lov: istalgan davlatning Visa va Mastercard kartalari, Click, Payme, Uzum Bank",
        "To‘liq yoki oldindan to‘lov, to‘lov cheki, bitim o‘zi «To‘landi»ga o‘tadi",
        "Sevimlilar: mehmon turlarni saqlaydi va ularga qaytadi",
        "Rus va o‘zbek tillari",
      ],
    },
  },
  {
    id: "max", price: 7900, weeks: [11, 13], star: true,
    ru: {
      t: "Приложение: максимум",
      d: "Всё из минимума, и от брони до документов гостю не нужно ни писать, ни звонить.",
      items: [
        "Всё из «Приложение: минимум»",
        "Статус брони в приложении: колонка сделки в Битрикс24 и есть шаг у гостя",
        "Лента статусов: заявка принята, бронируем отели и билеты, подтверждено, оплачено, документы готовы, в поездке",
        "Уведомления на каждом шаге и напоминание перед выездом",
        "Документы из сделки: ваучер, билеты, страховка, программа по дням; открываются без интернета",
        "Вход по номеру телефона с кодом из SMS, «Мои поездки»",
        "Сохранённые туристы: паспорта семьи вносятся один раз, бронь заполняется в одно касание",
        "Предоплата и доплата остатка прямо в приложении",
        "Если мест нет: понятный статус и возврат на ту же карту, похожие туры рядом",
      ],
    },
    uz: {
      t: "Ilova: maksimum",
      d: "Minimumdagi hammasi va brondan hujjatlargacha mehmon yozishi ham, qo‘ng‘iroq qilishi ham shart emas.",
      items: [
        "«Ilova: minimum»dagi hammasi",
        "Ilovada bron holati: Bitrix24’dagi bitim ustuni mehmondagi qadamning o‘zi",
        "Holatlar lentasi: ariza qabul qilindi, mehmonxona va chiptalarni bron qilyapmiz, tasdiqlandi, to‘landi, hujjatlar tayyor, sayohatda",
        "Har bir qadamda bildirishnoma va jo‘nashdan oldin eslatma",
        "Bitimdan hujjatlar: vaucher, chiptalar, sug‘urta, kunlar bo‘yicha dastur; internetsiz ochiladi",
        "Telefon raqami va SMS kod bilan kirish, «Sayohatlarim»",
        "Saqlangan turistlar: oila pasportlari bir marta kiritiladi, bron bir bosishda to‘ldiriladi",
        "Oldindan to‘lov va qolganini to‘lash ilovaning o‘zida",
        "Joy bo‘lmasa: tushunarli holat va o‘sha kartaga qaytarish, yonida o‘xshash turlar",
      ],
    },
  },
];

/*
 * Сайт (владелец, 16.10.2026: «Сделай ещё сайт за 1000$ и допы на 2000$
 * раскидай на 10-15 позиций, а то только приложение сейчас за 5900
 * минимум»). Отдельный вариант рядом с приложением, со своими допами:
 * со всеми допами сайт стоит 3 000 $. Тот же день: «цена имеет 48 часов на
 * принятие оффера в 1000$… Поставь таймер 48 часов». Обычная цена — 2 500 $,
 * как у корпоративного сайта в общей акции (PROMO.corporate в
 * lib/admin/mockup-offer.ts); боту те же цифры дают protos.facts.promo.
 * Отсчёт — с первого открытия макета на этом устройстве, как у greenwell;
 * вышел срок — сайт по обычной цене. Допы к сайту — без скидки.
 */
export const OFFER_HOURS = 48;
export const SITE = {
  id: "site", price: 1000, regular: 2500, weeks: [3, 4], g: "site",
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
