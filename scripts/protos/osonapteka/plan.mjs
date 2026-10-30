// Конструктор цены макета Oson Apteka: сайт и допы тумблерами.
//
// Задание владельца DevUz, 30.10.2026: «Стоимость для клиента без допников
// 1000$, с допами не более 3000$. Поставь в допы то, что клиенту реально
// нужно будет». Образец — neoline/plan.mjs: тумблер включает и выключает
// настоящий блок на сайте (data-addon="<id>"), итог считается сразу.
//
// Обычная цена — 4 900 $, как у магазинов Greenwell и Neoline: справочник с
// поиском по названию и веществу, страницей лекарства, аптеками на карте и
// бронью у студий Ташкента — 40-60 млн сум (docs/research/osonapteka.md,
// «Цены»). Допы — от ставок нашего калькулятора (content/calculator.ts),
// сдвинутых к середине рыночной вилки. Владелец, 30.10.2026, после сдачи:
// «Давай допы не на 2000, а на 3000$» — все допы вместе 3 000 $ (прежние
// цены × 1,5), сайт с допами — 4 000 $. Затем: «добавь еще допы… еще на 2-3
// тысячи $» — ещё девять на 2 500 $: допы 5 500 $, всё вместе 6 500 $
// (держит tests/proto-bundles.test.ts).

export const BASE = {
  price: 4900,
  promo: 1000,
  ru: {
    t: "Сайт-справочник Oson Apteka",
    d: "Новый облик на русском и узбекском, сначала под телефон: залёт в бренд, поиск по названию и действующему веществу с подсказками, список из нескольких лекарств, страница лекарства с инструкцией и аналогами, аптеки рядом на карте с маршрутом, регионы, приложение и бот, раздел для аптек.",
  },
  uz: {
    t: "Oson Apteka ma’lumotnoma sayti",
    d: "Rus va o‘zbek tilida yangi ko‘rinish, avvalo telefon uchun: brendga uchib kirish, nom va ta’sir qiluvchi modda bo‘yicha maslahatli qidiruv, bir nechta dori ro‘yxati, yo‘riqnoma va analoglar bilan dori sahifasi, xaritada yaqin dorixonalar va yo‘nalish, hududlar, ilova va bot, dorixonalar bo‘limi.",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* who — у кого на рынке это уже есть (docs/research/osonapteka.md). */
export const ADDONS = [
  { id: "bron", price: 375, star: true,
    ru: { t: "Бронь в аптеке и самовывоз", e: "Кнопка «Забронировать» у каждой аптеки: аптека подтверждает, покупатель видит статус «Собрана» и приходит за готовым", who: "есть у ArzonApteka и tabletki.ua" },
    uz: { t: "Dorixonada bron va olib ketish", e: "Har bir dorixonada «Bron qilish» tugmasi: dorixona tasdiqlaydi, xaridor «Yig‘ildi» holatini ko‘radi va tayyorini olib ketadi", who: "ArzonApteka va tabletki.ua’da bor" } },
  { id: "admin", price: 525, star: true,
    ru: { t: "Панель броней и аптек", e: "Брони с сайта первой строкой, статус виден покупателю, аптеки и их тарифы, свежесть остатков, история действий, роли: менеджер не видит выручку", who: "как в эталоне Greenwell" },
    uz: { t: "Bronlar va dorixonalar paneli", e: "Saytdan bronlar birinchi qatorda, holati xaridorga ko‘rinadi, dorixonalar va tariflari, qoldiqlar yangiligi, harakatlar tarixi, rollar: menejer tushumni ko‘rmaydi", who: "Greenwell namunasidagidek" } },
  { id: "erp", price: 450, star: true,
    ru: { t: "Остатки онлайн из FOM, ABU и 1С", e: "Ваша программа для аптек уже шлёт остатки: новый сайт показывает их сразу, со временем обновления у каждой аптеки", who: "у tabletki.ua «обновлено N минут назад»" },
    uz: { t: "FOM, ABU va 1C’dan onlayn qoldiqlar", e: "Dorixonalar uchun dasturingiz qoldiqlarni allaqachon yuboradi: yangi sayt ularni darhol, har bir dorixonada yangilangan vaqti bilan ko‘rsatadi", who: "tabletki.ua’da «N daqiqa oldin yangilandi»" } },
  { id: "deliv", price: 375,
    ru: { t: "Доставка из аптеки", e: "Три зоны и срочная за час, цена доставки считается до оформления, курьер аптеки или такси", who: "у PharmaClick от 8 000 сум за 55 минут" },
    uz: { t: "Dorixonadan yetkazib berish", e: "Uchta zona va bir soatda tezkor, yetkazish narxi rasmiylashtirishdan oldin hisoblanadi, dorixona kuryeri yoki taksi", who: "PharmaClick’da 8 000 so‘mdan, 55 daqiqada" } },
  { id: "pay", price: 300,
    ru: { t: "Оплата Payme, Click, Uzum", e: "Оплатить бронь или доставку сразу, без наличных в аптеке", who: "Payme и Click у PharmaClick" },
    uz: { t: "Payme, Click, Uzum orqali to‘lov", e: "Bron yoki yetkazishni darhol, dorixonada naqd pulsiz to‘lash", who: "PharmaClick’da Payme va Click" } },
  { id: "bot", price: 300,
    ru: { t: "Бот @osonaptekabot: бронь и статус", e: "Тот же поиск в Telegram, бронь в один шаг и сообщение «бронь собрана, ждём до 20:00»", who: "@ArzonAptekaBot у ArzonApteka" },
    uz: { t: "@osonaptekabot boti: bron va holat", e: "Telegramda xuddi shu qidiruv, bir qadamda bron va «bron yig‘ildi, 20:00 gacha kutamiz» xabari", who: "ArzonApteka’da @ArzonAptekaBot" } },
  { id: "remind", price: 225,
    ru: { t: "Напоминания о приёме и запасе", e: "Покупатель сам ставит время приёма по назначению врача, сайт напомнит купить заранее, пока упаковка не кончилась", who: "в справочниках Узбекистана не нашли" },
    uz: { t: "Qabul va zaxira eslatmalari", e: "Xaridor shifokor tayinlovi bo‘yicha qabul vaqtini o‘zi qo‘yadi, sayt qadoq tugamasidan oldin sotib olishni eslatadi", who: "O‘zbekiston ma’lumotnomalarida topilmadi" } },
  { id: "cab", price: 225,
    ru: { t: "Кабинет: кэшбэк, брони, аптечка семьи", e: "Кэшбэк за чек и перевод на карту, как в приложении, история броней, свои списки «Мама», «Ребёнок»", who: "кэшбэк есть только в вашем приложении" },
    uz: { t: "Kabinet: keshbek, bronlar, oila dorixonasi", e: "Chek uchun keshbek va kartaga o‘tkazish, ilovadagidek, bronlar tarixi, «Onam», «Bola» kabi ro‘yxatlar", who: "keshbek faqat ilovangizda bor" } },
  { id: "seo", price: 225,
    ru: { t: "Страницы «аптеки рядом» и 10 статей", e: "Страницы по 14 регионам и районам Ташкента под запросы «аптека рядом», «где купить», на двух языках", who: "у tabletki.ua страницы по городам" },
    uz: { t: "«Yaqin dorixonalar» sahifalari va 10 ta maqola", e: "14 hudud va Toshkent tumanlari bo‘yicha «yaqin dorixona», «qayerdan sotib olish» so‘rovlari uchun sahifalar, ikki tilda", who: "tabletki.ua’da shaharlar bo‘yicha sahifalar" } },
  /* Второй заход, владелец, 30.10.2026: «добавь еще допы, блоки и тд, что было
     еще на 2-3 тысячи $». Девять допов на 2 500 $, у каждого свой блок. */
  { id: "rxphoto", price: 300,
    ru: { t: "Рецепт фото: аптека соберёт по нему", e: "Покупатель фотографирует рецепт врача, выбирает аптеку, фармацевт проверяет и собирает заказ. Рецепт видит только эта аптека", who: "у справочников Узбекистана не нашли" },
    uz: { t: "Retsept surati: dorixona shu bo‘yicha yig‘adi", e: "Xaridor shifokor retseptini suratga oladi, dorixonani tanlaydi, farmatsevt tekshiradi va buyurtmani yig‘adi. Retseptni faqat shu dorixona ko‘radi", who: "O‘zbekiston ma’lumotnomalarida topilmadi" } },
  { id: "pharmacist", price: 350,
    ru: { t: "Вопрос фармацевту аптеки", e: "Чат с аптекой из карточки: есть ли сегодня, как хранить, когда привезут. Про лечение и замену: только врач, это сказано в чате", who: "у OXYmed «связь с фармацевтом»" },
    uz: { t: "Dorixona farmatsevtiga savol", e: "Kartochkadan dorixona bilan chat: bugun bormi, qanday saqlash, qachon keltiriladi. Davolash va almashtirish haqida: faqat shifokor, bu chatda aytilgan", who: "OXYmed’da «farmatsevt bilan aloqa»" } },
  { id: "notify", price: 200,
    ru: { t: "«Сообщить, когда появится»", e: "Нет в аптеках района: покупатель жмёт кнопку, и Telegram пишет ему, как только аптека выгрузит остаток", who: "у ArzonApteka «Нет нужного лекарства» без уведомления" },
    uz: { t: "«Paydo bo‘lganda xabar berish»", e: "Tuman dorixonalarida yo‘q: xaridor tugmani bosadi, dorixona qoldiqni yuklashi bilan Telegram unga yozadi", who: "ArzonApteka’da xabarnomasiz «Kerakli dori yo‘q»" } },
  { id: "watch", price: 250,
    ru: { t: "Следить за ценой", e: "Покупатель задаёт цену, за которую готов купить. Когда «от» по базе опустится ниже, придёт сообщение со ссылкой на аптеку", who: "у tabletki.ua нет, у маркетплейсов есть" },
    uz: { t: "Narxni kuzatish", e: "Xaridor qaysi narxda olishga tayyorligini belgilaydi. Bazadagi «dan» narxi pastga tushsa, dorixona havolasi bilan xabar keladi", who: "tabletki.ua’da yo‘q, marketpleyslarda bor" } },
  { id: "unit", price: 150,
    ru: { t: "Цена за таблетку", e: "У упаковок с разным числом таблеток видно, что выгоднее: цена за 1 штуку по их же цене «от» и числу в упаковке", who: "в аптеках Узбекистана не считают" },
    uz: { t: "Bitta tabletka narxi", e: "Turli sondagi qadoqlarda nima foydaliroq ko‘rinadi: «dan» narxi va qadoqdagi son bo‘yicha 1 dona narxi", who: "O‘zbekiston dorixonalarida hisoblanmaydi" } },
  { id: "cabph", price: 450, star: true,
    ru: { t: "Кабинет аптеки на сайте", e: "Аптека сама видит свои брони, просмотры карточки, место в выдаче района, тариф и счёт. Меньше звонков в вашу поддержку", who: "есть у tabletki.ua для партнёров" },
    uz: { t: "Saytda dorixona kabineti", e: "Dorixona o‘z bronlari, kartochka ko‘rishlari, tumandagi o‘rni, tarifi va hisobini o‘zi ko‘radi. Yordam xizmatingizga qo‘ng‘iroqlar kamayadi", who: "tabletki.ua’da hamkorlar uchun bor" } },
  { id: "ads", price: 350,
    ru: { t: "Рекламный кабинет: топ района и баннер", e: "Аптека или бренд выбирает район, срок и формат, видит цену и оплачивает сам, без менеджера. Баннер проходит модерацию в панели", who: "у ArzonApteka баннер по звонку" },
    uz: { t: "Reklama kabineti: tuman topi va banner", e: "Dorixona yoki brend tuman, muddat va formatni tanlaydi, narxni ko‘radi va o‘zi to‘laydi, menejersiz. Banner paneldan moderatsiyadan o‘tadi", who: "ArzonApteka’da banner qo‘ng‘iroq orqali" } },
  { id: "pwa", price: 250,
    ru: { t: "Сайт как приложение", e: "Иконка на экране телефона без App Store, список и брони открываются и без сети, пуш о готовой брони", who: "у PharmaClick и OXYmed только магазины приложений" },
    uz: { t: "Ilova kabi sayt", e: "App Store’siz telefon ekranida belgi, ro‘yxat va bronlar internetsiz ham ochiladi, tayyor bron haqida push", who: "PharmaClick va OXYmed’da faqat ilovalar do‘koni" } },
  { id: "reports", price: 200,
    ru: { t: "Отчёт владельцу в Telegram", e: "Каждое утро: поиски, брони, выкуп, что ищут и чего нет в наличии, какие аптеки не обновили остатки", who: "вы шлёте отчёты партнёрам, себе: нет" },
    uz: { t: "Egasiga Telegramda hisobot", e: "Har tong: qidiruvlar, bronlar, olib ketish, nima qidiriladi va nima yo‘q, qaysi dorixonalar qoldiqni yangilamadi", who: "hamkorlarga hisobot yuborasiz, o‘zingizga: yo‘q" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
