// Конструктор цены макета Sunday Event Agency: сайт и девять допов тумблерами.
//
// Задание владельца DevUz, 09.11.2026: «Делаем макет для Sunday.uz», и в тот
// же день: «Цена 500$ за сайт + сделай что бы все допы стоили еще 500$ вместо
// 3000. То есть количество оставляем, а стоимость до 500$ за все допы
// снижаем». Сайт 500 $, девять допов вместе 500 $, всё 1 000 $. Тумблер включает и выключает настоящий блок на
// сайте (data-addon="<id>"), итог считается сразу.
//
// Обычная цена — 3 900 $: сайт студии услуг на двух языках со сценой по
// прокрутке, разделами, портфолио и формами у студий Ташкента (как у Optimal
// Prime и SAMIST, docs/research/sunday.md, «Цены»). Допы — что есть у
// конкурентов (смета у GRAND EVENT, кейсы у Infinity и Unique Present) и чего
// нет ни у кого в Узбекистане (кабинет пары, приглашение с ответами гостей,
// свободные даты, подбор концепции): так делают в России и США.

export const BASE = {
  price: 3900,
  promo: 500,
  weeks: [3, 4],
  ru: {
    t: "Сайт Sunday Event Agency",
    d: "Новый сайт на русском и узбекском вместо неработающего sunday.uz, сначала под телефон: залёт в вашу розетку, четыре направления, поводы, как работаете, о студии, контакты, заявка в ваш Telegram с готовым текстом.",
  },
  uz: {
    t: "Sunday Event Agency sayti",
    d: "Ishlamayotgan sunday.uz o‘rniga rus va o‘zbek tillarida yangi sayt, avvalo telefon uchun: rozetkangizga uchib kirish, to‘rt yo‘nalish, sabablar, ish tartibi, studiya haqida, aloqa, tayyor matn bilan Telegramingizga ariza.",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* who — у кого на рынке это уже есть или чего нет (docs/research/sunday.md). */
export const ADDONS = [
  { id: "admin", price: 100, star: true,
    ru: { t: "Панель заявок и календаря дат", e: "Заявки и сметы с сайта первой строкой, статус видит клиент, занятые даты ставятся в панели и сразу видны на сайте, роли: менеджер не видит бюджеты, история, выгрузки", who: "как в эталонах Greenwell и Cargo Pro" },
    uz: { t: "Arizalar va sanalar kalendari paneli", e: "Saytdan arizalar va smetalar birinchi qatorda, holatni mijoz ko‘radi, band sanalar panelda belgilanadi va saytda darhol ko‘rinadi, rollar: menejer byudjetni ko‘rmaydi, tarix, yuklab olish", who: "Greenwell va Cargo Pro namunalaridagidek" } },
  { id: "calc", price: 50, star: true,
    ru: { t: "Конструктор сметы праздника", e: "Повод, гости, кейтеринг, оформление, шоу и техника: гость видит вилку бюджета по строкам и отправляет её вам заявкой", who: "у GRAND EVENT есть «Рассчитать стоимость», но это форма звонка без суммы" },
    uz: { t: "Bayram smetasi konstruktori", e: "Sabab, mehmonlar, keytering, bezatish, shou va texnika: mehmon byudjet oralig‘ini qatorma-qator ko‘radi va uni sizga ariza qilib yuboradi", who: "GRAND EVENT’da «Narxni hisoblash» bor, lekin u summasiz qo‘ng‘iroq formasi" } },
  { id: "cab", price: 75, star: true,
    ru: { t: "Кабинет клиента: подготовка по дням", e: "Пара или компания видит план до дня события, что готово, смету и оплаты, файлы концепции. Вопрос «а что с залом?» больше не нужен", who: "в Узбекистане не нашли ни у кого; в России и США так работают свадебные агентства" },
    uz: { t: "Mijoz kabineti: kunma-kun tayyorgarlik", e: "Juftlik yoki kompaniya tadbir kunigacha rejani, nima tayyorligini, smeta va to‘lovlarni, konsepsiya fayllarini ko‘radi. «Zal nima bo‘ldi?» degan savol endi kerak emas", who: "O‘zbekistonda hech kimda topilmadi; Rossiya va AQShda to‘y agentliklari shunday ishlaydi" } },
  { id: "rsvp", price: 60,
    ru: { t: "Приглашение для гостей с ответами", e: "Страница события по ссылке: программа, место на карте, «приду / не приду», сколько человек, что не ест. Ответы падают в кабинет и панель", who: "так делают Zola и The Knot в США; у ивент-агентств Ташкента нет" },
    uz: { t: "Mehmonlar uchun javobli taklifnoma", e: "Havola orqali tadbir sahifasi: dastur, xaritadagi joy, «kelaman / kelmayman», necha kishi, nimani yemaydi. Javoblar kabinet va panelga tushadi", who: "AQShda Zola va The Knot shunday qiladi; Toshkent ivent-agentliklarida yo‘q" } },
  { id: "dates", price: 40,
    ru: { t: "Свободные даты на сайте", e: "Календарь сезона: занятые дни видно сразу, на свободный можно оставить бронь. Даты ставит менеджер в панели", who: "у агентств Ташкента дату уточняют только звонком" },
    uz: { t: "Saytda bo‘sh sanalar", e: "Mavsum kalendari: band kunlar darhol ko‘rinadi, bo‘sh kunga bron qoldirish mumkin. Sanalarni menejer panelda qo‘yadi", who: "Toshkent agentliklarida sana faqat qo‘ng‘iroq bilan aniqlanadi" } },
  { id: "quiz", price: 40,
    ru: { t: "Подбор концепции за минуту", e: "Четыре вопроса: повод, настроение, палитра, где празднуем. В ответ концепция с подборкой и цветами, заявка уходит вам с ответами", who: "квизы такого вида у агентств России; в Узбекистане не нашли" },
    uz: { t: "Bir daqiqada konsepsiya tanlash", e: "To‘rt savol: sabab, kayfiyat, ranglar, qayerda nishonlaymiz. Javobda tanlov va ranglar bilan konsepsiya, ariza javoblar bilan sizga ketadi", who: "bunday kvizlar Rossiya agentliklarida bor; O‘zbekistonda topilmadi" } },
  { id: "works", price: 45,
    ru: { t: "Портфолио с фильтром по поводу", e: "Ваши проекты из Instagram карточками: свадьбы, торжества, праздники, деловые; нажатие открывает фото во весь экран и ролик", who: "кейсы есть у Infinity Events и Unique Present" },
    uz: { t: "Sabab bo‘yicha filtrli portfolio", e: "Instagram’dagi loyihalaringiz kartochka bo‘lib: to‘ylar, tantanalar, bayramlar, ishbilarmonlik; bosish suratni to‘liq ekranda va rolikni ochadi", who: "keyslar Infinity Events va Unique Present’da bor" } },
  { id: "tgbot", price: 50,
    ru: { t: "Telegram-бот: дата, смета, заявка", e: "Гость пишет «свадьба на 120 человек в июне», бот спрашивает дату, показывает вилку сметы и свободна ли дата и передаёт заявку менеджеру в панель", who: "у ивент-агентств Ташкента бота с расчётом не нашли" },
    uz: { t: "Telegram-bot: sana, smeta, ariza", e: "Mehmon «iyunda 120 kishilik to‘y» deb yozadi, bot sanani so‘raydi, smeta oralig‘ini va sana bo‘shligini ko‘rsatadi va arizani paneldagi menejerga uzatadi", who: "Toshkent ivent-agentliklarida hisobli bot topilmadi" } },
  { id: "seo", price: 40,
    ru: { t: "Страницы под поиск", e: "Свои страницы на двух языках: «организация свадьбы Ташкент», «кейтеринг на юбилей», «оформление зала». Сейчас по названию вас находят только в Instagram", who: "у GRAND EVENT и Master Event страницы услуг и блог уже есть" },
    uz: { t: "Qidiruv uchun sahifalar", e: "Ikki tilda o‘z sahifalari: «Toshkentda to‘y tashkil qilish», «yubileyga keytering», «zalni bezatish». Hozir sizni nomingiz bo‘yicha faqat Instagram’da topishadi", who: "GRAND EVENT va Master Event’da xizmat sahifalari va blog allaqachon bor" } },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
