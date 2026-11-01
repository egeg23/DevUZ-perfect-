// Конструктор цены Agora: сайт по акции 48 часов, допы тумблерами и отдельно
// ежемесячные платежи (IT-поддержка, домен, сервер, работа ИИ).
//
// Задача владельца DevUz, 01.11.2026: «Допники тут стоят 2000, чтобы итого всё
// вместе с сайтом стоило не больше 3000». Основа — сайт кафе по акции
// 1 000 $ вместо 2 500 $ (PROMO в lib/admin/mockup-offer.ts, по образцу
// karomat/plan.mjs). Допы вместе — ровно 2 000 $, бот с ИИ входит сюда.
//
// Все цены макета живут здесь, и только здесь. После правки —
// node scripts/mockup-plans.mjs. Держит tests/proto-bundles.test.ts.

/** Сайт кафе: 1 000 $ по акции вместо 2 500 $. */
export const BASE = {
  price: 2500,
  promo: 1000,
  weeks: [3, 4],
  ru: {
    t: "Сайт Agora Lounge & bar",
    d: "Залёт в ваш знак, первый экран с вашим залом, «Вечер в Agora» из ваших блюд, меню целиком с фото и ценами, разделы, поиск, фильтры и карточка блюда, зал фотографиями, адрес и маршрут, звонок в одно касание, русский и узбекский, под телефон и компьютер",
  },
  uz: {
    t: "Agora Lounge & bar sayti",
    d: "Belgingizga uchib kirish, zalingiz bilan birinchi ekran, taomlaringizdan «Agora’da kechqurun», rasm va narxli to‘liq menyu, bo‘limlar, qidiruv, filtrlar va taom kartochkasi, zal suratlari, manzil va yo‘nalish, bir bosishda qo‘ng‘iroq, rus va o‘zbek tillari, telefon va kompyuter uchun",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* Допы: star — кафе берут первым; sect — блок на сайте, который тумблер прячет. */
export const ADDONS = [
  { id: "booking", price: 250, star: true,
    ru: { t: "Бронь стола онлайн", e: "Дата, время и гости в два касания; бронь первой строкой в панели, гостю статус «Моя бронь» на сайте", who: "есть у Tarnov, у лаунжей Ташкента почти нет" },
    uz: { t: "Onlayn stol bron qilish", e: "Sana, vaqt va mehmonlar ikki bosishda; bron panelda birinchi qatorda, mehmonga saytda «Mening bronim» holati", who: "Tarnov’da bor, Toshkent launjlarida deyarli yo‘q" } },
  { id: "order", price: 250, star: true,
    ru: { t: "Предзаказ, навынос и доставка", e: "Корзина из вашего меню: блюда к приходу гостя, навынос или доставка по зонам с ценой; заказ в панели, статус у гостя", who: "гость приходит, а стол уже накрыт" },
    uz: { t: "Oldindan buyurtma, olib ketish va yetkazish", e: "Menyuingizdan savat: mehmon kelishiga, olib ketishga yoki hududlar bo‘yicha narxli yetkazishga; buyurtma panelda, holat mehmonda", who: "mehmon keladi, stol allaqachon tayyor" } },
  { id: "tgbot", price: 550, star: true,
    ru: { t: "Telegram-бот с ИИ", e: "Меню и заказ, бронь стола, ответы на вопросы гостей, напоминание о брони, статус заказа и передача администратору", who: "отвечает ночью и в час пик, когда телефон занят" },
    uz: { t: "Sun’iy intellektli Telegram-bot", e: "Menyu va buyurtma, stol bron qilish, mehmonlar savollariga javob, bron eslatmasi, buyurtma holati va administratorga uzatish", who: "kechasi va gavjum soatda, telefon band bo‘lganda javob beradi" } },
  { id: "panel", price: 400, star: true,
    ru: { t: "Панель ресторана", e: "Брони, заказы, кому из бота нужен человек, меню и цены своими руками, доставка и пауза кухни, акция и часы на сайте, стоп-лист, роли владельца и администратора, история действий, выгрузка CSV и счёта", who: "всё, что пришло с сайта и из бота, в одном окне" },
    uz: { t: "Restoran paneli", e: "Bronlar, buyurtmalar, botdan kimga odam kerak, menyu va narxlarni o‘zingiz o‘zgartirasiz, yetkazish va oshxona pauzasi, saytdagi aksiya va soatlar, stop-list, ega va administrator rollari, harakatlar tarixi, CSV va hisobni yuklab olish", who: "sayt va botdan kelgan hamma narsa bitta oynada" } },
  { id: "iiko", price: 250,
    ru: { t: "Связь с iiko", e: "Ваше меню уже в iiko: цены, фото и стоп-лист приходят на сайт и в бота сами, заказ уходит на кухню без ручного ввода", who: "не нужно править меню в трёх местах" },
    uz: { t: "iiko bilan bog‘lash", e: "Menyuingiz allaqachon iiko’da: narxlar, rasmlar va stop-list sayt va botga o‘zi keladi, buyurtma oshxonaga qo‘lda kiritmasdan ketadi", who: "menyuni uch joyda tahrirlash shart emas" } },
  { id: "qr", price: 150,
    ru: { t: "QR-меню на столе", e: "Гость сканирует код на столе: меню с фото, «Позвать официанта» и «Счёт» сразу в панели", who: "меню на столе вместо бумажного" },
    uz: { t: "Stoldagi QR-menyu", e: "Mehmon stoldagi kodni skanerlaydi: rasmli menyu, «Ofitsiantni chaqirish» va «Hisob» darhol panelda", who: "qog‘oz o‘rniga stoldagi menyu" } },
  { id: "reviews", price: 50,
    ru: { t: "Отзывы после визита", e: "На следующий день гостю приходит просьба оценить вечер; хорошая оценка ведёт на Яндекс Карты и Google", who: "больше свежих отзывов на картах" },
    uz: { t: "Tashrifdan keyin sharhlar", e: "Ertasi kuni mehmonga kechani baholash iltimosi keladi; yaxshi baho Yandex Xaritalar va Google’ga olib boradi", who: "xaritalarda ko‘proq yangi sharhlar" } },
  { id: "en", price: 100,
    ru: { t: "Английская версия", e: "Третий язык сайта и бота для гостей города", who: "для гостей из-за рубежа" },
    uz: { t: "Ingliz tilidagi versiya", e: "Shahar mehmonlari uchun sayt va botning uchinchi tili", who: "chet ellik mehmonlar uchun" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);

/*
 * IT-поддержка, домен и сервер — ежемесячные и годовые платежи. В лимит
 * 3 000 $ разовых работ не входят. Середина рынка Узбекистана, 01.11.2026:
 *   - домен .uz — от 34 000 сум в год, виртуальный хостинг от 19 900 сум,
 *     VPS от 119 900 сум в месяц: hostmaster.uz (регистратор UZINFOCOM);
 *     зарубежные регистраторы .uz — 28-105 $ в год (domainoffer.net);
 *   - поддержка: агентства на workspace.ru/tashkent — от 15 000 российских рублей в месяц,
 *     пакетами по часам (qna.habr.com/q/13102); для кафе в Ташкенте берём
 *     середину ниже московских ставок;
 *   - ИИ бота: Sonnet, 2 $ за миллион входных и 10 $ за миллион выходных
 *     токенов; ответ ≈ 2 000 + 150 токенов ≈ 0,0055 $; 1 000-1 500 диалогов
 *     по 6 ответов в месяц ≈ 35-50 $. Цифра «по факту, примерно».
 */
export const SUPPORT = [
  { id: "domain", price: 4, per: "year",
    ru: { t: "Домен agora.uz или похожий", e: "Регистрация и продление у местного регистратора (около 50 000 сум в год), сертификат https бесплатный" },
    uz: { t: "agora.uz yoki o‘xshash domen", e: "Mahalliy registratorda ro‘yxatdan o‘tkazish va uzaytirish (yiliga taxminan 50 000 so‘m), https sertifikati bepul" } },
  { id: "server", price: 16, per: "month",
    ru: { t: "Сервер для сайта, бота и панели", e: "VPS в Ташкенте: 2 ядра, 4 ГБ памяти (около 200 000 сум в месяц); сайт, бот и панель на одном сервере" },
    uz: { t: "Sayt, bot va panel uchun server", e: "Toshkentda VPS: 2 yadro, 4 GB xotira (oyiga taxminan 200 000 so‘m); sayt, bot va panel bitta serverda" } },
  { id: "care", price: 80, per: "month",
    ru: { t: "Поддержка сайта", e: "Обновления и защита, резервная копия каждый день, до 3 часов правок в месяц (цены, фото, акции), ответ в течение рабочего дня" },
    uz: { t: "Saytni qo‘llab-quvvatlash", e: "Yangilanishlar va himoya, har kuni zaxira nusxa, oyiga 3 soatgacha tahrir (narxlar, rasmlar, aksiyalar), ish kuni davomida javob" } },
  { id: "carebot", price: 150, per: "month",
    ru: { t: "Поддержка сайта и бота", e: "Всё из «Поддержки сайта», плюс бот: следим за ответами, дописываем сценарии, до 6 часов правок, ответ за 2 часа с 10:00 до 22:00" },
    uz: { t: "Sayt va botni qo‘llab-quvvatlash", e: "«Saytni qo‘llab-quvvatlash»dagi hammasi, qo‘shimcha bot: javoblarni kuzatamiz, ssenariylarni to‘ldiramiz, 6 soatgacha tahrir, 10:00-22:00 da 2 soat ichida javob" } },
];

/** Работа ИИ в боте — по факту, примерно столько. */
export const AI = { from: 20, to: 60, dialogs: [1000, 1500] };

/** Что бот делает сам и что передаёт администратору — на сайте и в конструкторе. */
export const BOT = {
  self: {
    ru: ["показывает меню с ценами и фото, ищет по словам «без мяса», «острое»", "собирает заказ навынос или к брони", "бронирует стол: дата, время, гости; проверяет, что время в часах работы", "отвечает на вопросы из ваших фактов: часы, адрес, дети, состав блюд", "напоминает о брони за 2 часа и спрашивает «вы придёте?»", "сообщает статус заказа, который поставили в панели"],
    uz: ["narxlar va rasmlar bilan menyuni ko‘rsatadi, «go‘shtsiz», «achchiq» so‘zlari bo‘yicha qidiradi", "olib ketishga yoki bronga buyurtma yig‘adi", "stol bron qiladi: sana, vaqt, mehmonlar; vaqt ish soatlariga to‘g‘ri kelishini tekshiradi", "faktlaringiz bo‘yicha savollarga javob beradi: soatlar, manzil, bolalar, taom tarkibi", "brondan 2 soat oldin eslatadi va «kelasizmi?» deb so‘raydi", "panelda qo‘yilgan buyurtma holatini aytadi"],
  },
  human: {
    ru: ["банкет и большой стол от 10 гостей", "жалоба или недовольный гость", "вопрос, ответа на который нет в ваших фактах (аллергия, особое меню)", "гость сам просит «позовите человека»", "оплата и возврат денег"],
    uz: ["banket va 10 mehmondan katta stol", "shikoyat yoki norozi mehmon", "faktlaringizda javobi yo‘q savol (allergiya, maxsus menyu)", "mehmonning o‘zi «odam chaqiring» deb so‘raydi", "to‘lov va pulni qaytarish"],
  },
};

/*
 * Синхронизация с системами ресторана — доп по запросу (руководитель,
 * 01.11.2026: «синхронизация с вашей системой бронирования, управления
 * рестораном. По запросу цена»). В ADDONS не входит: цена зависит от того,
 * какие системы у ресторана и открыт ли у них доступ (API), поэтому в
 * 3 000 $ и в договор из макета она не считается. Цену и срок называем
 * письменно после разговора и списка систем.
 */
export const SYNC = {
  id: "sync",
  ru: { t: "Синхронизация с вашими системами", e: "Касса, бронирование, доставка, оплата и CRM работают с сайтом, ботом и панелью как одно целое: меню, цены, стоп-лист, брони и заказы в одном месте, без ручного переноса", who: "цена по запросу: зависит от ваших систем" },
  uz: { t: "Tizimlaringiz bilan sinxronlash", e: "Kassa, bron, yetkazish, to‘lov va CRM sayt, bot va panel bilan bir butun bo‘lib ishlaydi: menyu, narxlar, stop-list, bronlar va buyurtmalar bir joyda, qo‘lda ko‘chirmasdan", who: "narx so‘rov bo‘yicha: tizimlaringizga bog‘liq" },
  /* К чему подключаемся: по открытому доступу (API) системы. */
  groups: [
    { ru: "Касса и учёт ресторана", uz: "Kassa va restoran hisobi", list: "iiko, r_keeper, Poster, Jowi, Quick Resto",
      give: { ru: "меню, цены и стоп-лист приходят на сайт и в бота сами; заказ с сайта уходит в кассу и на кухню", uz: "menyu, narxlar va stop-list sayt va botga o‘zi keladi; saytdagi buyurtma kassa va oshxonaga ketadi" } },
    { ru: "Бронирование", uz: "Bron tizimlari", list: "Rezvo, Restoplace, своя таблица броней", listUz: "Rezvo, Restoplace, o‘z bron jadvalingiz",
      give: { ru: "брони с сайта, из бота и по телефону в одном плане зала, один стол дважды не продаётся", uz: "sayt, bot va telefondan bronlar bitta zal rejasida, bitta stol ikki marta sotilmaydi" } },
    { ru: "Доставка", uz: "Yetkazib berish", list: "Яндекс Еда, Uzum Tezkor, Wolt", listUz: "Yandex Eda, Uzum Tezkor, Wolt",
      give: { ru: "стоп-лист и цены одни на сайте и в приложениях доставки, заказы оттуда видно в панели рядом с залом", uz: "stop-list va narxlar sayt va yetkazish ilovalarida bir xil, u yerdagi buyurtmalar panelda zal yonida ko‘rinadi" } },
    { ru: "Оплата", uz: "To‘lov", list: "Payme, Click, Uzum Bank",
      give: { ru: "предоплата брони и оплата заказа на сайте и в боте, деньги сходятся с кассой", uz: "bron oldindan to‘lovi va saytda hamda botda buyurtma to‘lovi, pul kassa bilan mos tushadi" } },
    { ru: "CRM и бонусы гостей", uz: "CRM va mehmon bonuslari", list: "amoCRM, Bitrix24, программа лояльности кассы", listUz: "amoCRM, Bitrix24, kassaning sodiqlik dasturi",
      give: { ru: "гость с историей визитов и заказов, бонусы считаются и в зале, и на сайте", uz: "tashriflar va buyurtmalar tarixi bilan mehmon, bonuslar zalda ham, saytda ham hisoblanadi" } },
    { ru: "Отчёты", uz: "Hisobotlar", list: "Google Таблицы, выгрузка для бухгалтера", listUz: "Google Sheets, buxgalter uchun yuklab olish",
      give: { ru: "продажи по всем каналам в одной таблице каждое утро", uz: "har tongda barcha kanallar bo‘yicha savdo bitta jadvalda" } },
  ],
  /* Что это даёт каждому в ресторане. */
  roles: [
    { ru: "Владельцу", uz: "Egasiga",
      a: { ru: ["одна выручка по залу, сайту, боту и доставке, без сведения руками", "видно, откуда приходят гости и какой канал приносит деньги", "меню и цены правятся в одном месте, ошибок в ценах нет"], uz: ["zal, sayt, bot va yetkazish bo‘yicha bitta tushum, qo‘lda jamlamasdan", "mehmonlar qayerdan kelayotgani va qaysi kanal pul keltirayotgani ko‘rinadi", "menyu va narxlar bir joyda tahrirlanadi, narxlarda xato bo‘lmaydi"] } },
    { ru: "Управляющему", uz: "Boshqaruvchiga",
      a: { ru: ["один стоп-лист на всё: закончилось блюдо, его нет и на сайте, и в доставке", "все брони и заказы смены на одном экране", "нет двойных броней и забытых заказов"], uz: ["hammasi uchun bitta stop-list: taom tugadi, u saytda ham, yetkazishda ham yo‘q", "smenaning barcha bron va buyurtmalari bitta ekranda", "ikki marta bron va unutilgan buyurtmalar yo‘q"] } },
    { ru: "Администратору и хостес", uz: "Administrator va xostesga",
      a: { ru: ["брони с телефона, сайта, бота и Rezvo в одной ленте", "при звонке видно гостя: сколько раз был, что заказывал", "подтверждение брони уходит гостю само"], uz: ["telefon, sayt, bot va Rezvo bronlari bitta lentada", "qo‘ng‘iroqda mehmon ko‘rinadi: necha marta kelgan, nima buyurtma qilgan", "bron tasdig‘i mehmonga o‘zi ketadi"] } },
    { ru: "Кухне и бару", uz: "Oshxona va barga",
      a: { ru: ["заказ с сайта, бота и доставки сразу на кухонный принтер или экран", "никто не перебивает заказ в кассу вручную"], uz: ["sayt, bot va yetkazishdan buyurtma darhol oshxona printeri yoki ekraniga", "hech kim buyurtmani kassaga qo‘lda qayta kiritmaydi"] } },
    { ru: "Бухгалтеру", uz: "Buxgalterga",
      a: { ru: ["оплаты Payme и Click сходятся с кассой", "продажи по дням и каналам одной выгрузкой"], uz: ["Payme va Click to‘lovlari kassa bilan mos tushadi", "kunlar va kanallar bo‘yicha savdo bitta yuklab olishda"] } },
    { ru: "Гостю", uz: "Mehmonga",
      a: { ru: ["на сайте всегда настоящие цены и то, что есть сегодня", "бронь и заказ подтверждаются сразу, бонусы считаются везде"], uz: ["saytda doim haqiqiy narxlar va bugun bor narsa", "bron va buyurtma darhol tasdiqlanadi, bonuslar hamma joyda hisoblanadi"] } },
  ],
  /* Как считаем цену. */
  steps: {
    ru: ["созвон на 30 минут: какие системы у вас стоят", "проверяем, открыт ли у них доступ (API) и что он стоит у поставщика", "письменно: что подключаем, цена и срок, до начала работ"],
    uz: ["30 daqiqalik qo‘ng‘iroq: sizda qaysi tizimlar bor", "ularda kirish (API) ochiqmi va yetkazib beruvchida qancha turishini tekshiramiz", "yozma: nimani ulaymiz, narx va muddat, ishdan oldin"],
  },
};
