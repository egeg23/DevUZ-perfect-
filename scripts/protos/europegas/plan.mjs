// Конструктор нашей цены, как у Asmo Clinic: плашка «Конструктор» на каждой
// странице, тумблер включает и выключает настоящий блок, итог «сайт + допы»
// считается сразу. Чего на макете нет (бот записи и напоминаний, продвижение,
// карты и отзывы, аналитика звонков) — группа «Сверх сайта» на «Что дальше».
//
// Владелец, 13.10.2026: «Конструктор тарифов, цены по середине рынка
// Узбекистана: без допов 1 700 $, с допами не больше 3 000 $. В допы — то,
// что клиенту реально нужно». Раскладка: сайт 1 700 $, допы на макете 790 $,
// сверх сайта 510 $, со всеми тумблерами ровно 3 000 $. Допы выбраны по
// конкурентам (docs/research/europegas.md): калькулятор экономии есть у STAG
// и RariTEK, напоминания об испытании баллона нет ни у кого, сайтов фургонов
// на Labo и Changan нет вовсе. Держит tests/proto-bundles.test.ts.

/** Сайт: главная, услуги, оборудование, работы, документы, контакты, ru и uz, управление. */
export const BASE = {
  price: 1700,
  ru: {
    t: "Сайт: главная, услуги, оборудование, наши работы, документы, контакты и управление",
    d: "Все услуги с вашего сайта: метан и пропан, программирование, испытание баллонов, ремонт, фургоны и рефрижераторы. Оборудование EuropeGAS и E-XON, фото работ, сертификаты, все телефоны отделов и связь в Telegram с готовым текстом. Русский и узбекский. Тексты, фото и цены меняете сами в панели. Делаем в первую очередь под телефон.",
  },
  uz: {
    t: "Sayt: bosh sahifa, xizmatlar, uskunalar, ishlarimiz, hujjatlar, kontaktlar va boshqaruv",
    d: "Saytingizdagi barcha xizmatlar: metan va propan, dasturlash, ballon sinovi, ta’mirlash, furgon va refrijeratorlar. EuropeGAS va E-XON uskunalari, ishlar fotosi, sertifikatlar, barcha bo‘lim telefonlari va tayyor matnli Telegram. Rus va o‘zbek tillari. Matn, foto va narxlarni paneldan o‘zingiz o‘zgartirasiz. Avvalo telefon uchun qilamiz.",
  },
};

/** Блоки, которые видно на макете. where: "" — главная, "all" — все страницы. */
export const ADDONS = [
  {
    id: "intro", where: "", price: 90,
    ru: { t: "Влёт в пламя логотипа", e: "Ромб GAZMETPROD собирается на экране, загорается пламя, камера влетает в него и открывает сайт" },
    uz: { t: "Logotip alangasiga uchib kirish", e: "GAZMETPROD rombi ekranda yig‘iladi, alanga yonadi, kamera uning ichiga uchib kirib saytni ochadi" },
  },
  {
    id: "story", where: "", price: 190, star: true,
    ru: { t: "Сцена при прокрутке: машина в разрезе, баллон, фургон", e: "Листаете вниз: камера идёт по газовой системе от баллона до форсунок, баллон проходит испытание, фургон собирается из слоёв сэндвич-панели" },
    uz: { t: "Aylantirishda sahna: kesimdagi mashina, ballon, furgon", e: "Pastga aylantirasiz: kamera gaz tizimi bo‘ylab ballondan forsunkalargacha yuradi, ballon sinovdan o‘tadi, furgon sendvich panel qatlamlaridan yig‘iladi" },
  },
  {
    id: "booking", where: "", price: 140, star: true,
    ru: { t: "Запись на установку: машина, услуга, день", e: "Человек выбирает марку, услугу и день, заявка уходит мастеру в Telegram с готовым текстом" },
    uz: { t: "O‘rnatishga yozilish: mashina, xizmat, kun", e: "Odam rusum, xizmat va kunni tanlaydi, ariza tayyor matn bilan ustaga Telegramga boradi" },
  },
  {
    id: "calc", where: "", price: 120, star: true,
    ru: { t: "Калькулятор экономии на метане", e: "Пробег, расход и цены топлива: сайт показывает, сколько остаётся в кармане за месяц и за год" },
    uz: { t: "Metanda tejash kalkulyatori", e: "Yurish, sarf va yoqilg‘i narxi: sayt oyiga va yiliga qancha tejalishini ko‘rsatadi" },
  },
  {
    id: "test", where: "", price: 80,
    ru: { t: "Срок испытания баллона и напоминание", e: "Дата прошлой проверки, тип газа, и сайт считает следующую, кладёт напоминание в календарь телефона и записывает на испытание" },
    uz: { t: "Ballon sinovi muddati va eslatma", e: "Oxirgi tekshiruv sanasi, gaz turi, sayt keyingisini hisoblaydi, telefon kalendariga eslatma qo‘yadi va sinovga yozadi" },
  },
  {
    id: "van", where: "", price: 120,
    ru: { t: "Конструктор фургона и рефрижератора", e: "Машина, что везёте, объём и тип холодильной установки: рисунок фургона меняется сразу, заявка уходит в Telegram" },
    uz: { t: "Furgon va refrijerator konstruktori", e: "Mashina, nima tashiysiz, hajm va sovutgich turi: furgon rasmi darhol o‘zgaradi, ariza Telegramga boradi" },
  },
  {
    id: "motion", where: "all", price: 50,
    ru: { t: "Своё движение у блоков и смена цвета между блоками", e: "Карточки встают, как детали на место, цвет страницы плавно меняется от блока к блоку" },
    uz: { t: "Bloklarda o‘z harakati va bloklar orasida rang almashishi", e: "Kartochkalar detal kabi joyiga tushadi, sahifa rangi blokdan blokka ravon o‘zgaradi" },
  },
];

/** Сверх сайта: на «Что дальше» — описание. needs — без чего не работает. */
export const BLOCKS = [
  {
    id: "bot", price: 220, needs: ["booking"], star: true,
    ru: { t: "Telegram-бот записи и напоминаний об испытании", why: "Водитель записывается в боте за минуту, а за месяц до срока испытания баллона бот сам напоминает и предлагает время. Клиенты возвращаются к вам, а не к соседу по улице.", li: ["Запись в боте", "Напоминание о сроке испытания", "Перенос в одно касание"] },
    uz: { t: "Yozilish va sinov eslatmasi Telegram-boti", why: "Haydovchi botda bir daqiqada yoziladi, ballon sinovi muddatidan bir oy oldin bot o‘zi eslatadi va vaqt taklif qiladi. Mijozlar qo‘shniga emas, sizga qaytadi.", li: ["Botda yozilish", "Sinov muddati eslatmasi", "Bir bosishda ko‘chirish"] },
  },
  {
    id: "seo", price: 130, needs: [],
    ru: { t: "Продвижение в Google и Яндексе", why: "Страницы под запросы «установка метана Ташкент», «испытание газового баллона», «изотермический фургон Labo»: по фургонам у конкурентов сайтов нет совсем. Русский и узбекский.", li: ["Страницы под запросы", "Разметка для поиска", "Узбекская версия"] },
    uz: { t: "Google va Yandexda ilgari surish", why: "«Toshkentda metan o‘rnatish», «gaz ballon sinovi», «Labo izotermik furgon» so‘rovlari uchun sahifalar: furgonlar bo‘yicha raqobatchilarda sayt umuman yo‘q. Rus va o‘zbek tillari.", li: ["So‘rovlar uchun sahifalar", "Qidiruv uchun belgilash", "O‘zbekcha versiya"] },
  },
  {
    id: "maps", price: 80, needs: [],
    ru: { t: "Карточки на картах и отзывы на сайте", why: "Карточка в Яндекс и Google Картах с фото, телефонами и маршрутом, отзывы клиентов оттуда на сайте. Сейчас на сайте нет ни одного отзыва.", li: ["Яндекс и Google Карты", "Отзывы на сайте", "Маршрут до Каракамыша"] },
    uz: { t: "Xaritalardagi kartochkalar va saytdagi sharhlar", why: "Yandex va Google Xaritalarda foto, telefonlar va yo‘nalishli kartochka, u yerdagi mijoz sharhlari saytda. Hozir saytda bironta sharh yo‘q.", li: ["Yandex va Google Xaritalar", "Saytda sharhlar", "Qoraqamishgacha yo‘nalish"] },
  },
  {
    id: "stats", price: 80, needs: [],
    ru: { t: "Аналитика: откуда звонки и заявки", why: "Яндекс Метрика и цели: сколько людей нажали «позвонить», написали в Telegram, посчитали экономию. Видно, какая услуга приводит клиентов.", li: ["Метрика и цели", "Звонки и Telegram", "Отчёт раз в месяц"] },
    uz: { t: "Analitika: qo‘ng‘iroq va arizalar qayerdan", why: "Yandex Metrika va maqsadlar: nechta odam «qo‘ng‘iroq» bosdi, Telegramga yozdi, tejashni hisobladi. Qaysi xizmat mijoz olib kelishi ko‘rinadi.", li: ["Metrika va maqsadlar", "Qo‘ng‘iroq va Telegram", "Oylik hisobot"] },
  },
];
