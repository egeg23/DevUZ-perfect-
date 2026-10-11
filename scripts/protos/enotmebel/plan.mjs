// Конструктор цены Enotmebel: плашка «Конструктор» на каждой странице
// прототипа, тумблер включает и выключает настоящий блок на странице, итог
// «сайт + допы» считается сразу. То, чего на макете не видно (SEO), — группа
// «Сверх сайта» на странице «Что дальше».
//
// Цены — задача владельца, 11.10.2026: «Стоимость для клиента без допников
// 1700$, с допами не более 2500$. Поставь в допы то, что клиенту реально
// нужно будет… цены по середине рынка». База 1 700 $, все допы вместе —
// ровно 800 $, со всеми тумблерами итог 2 500 $ (держит
// tests/proto-bundles.test.ts).
//
// Раскладка — по середине рынка Ташкента (docs/research/enotmebel.md, раздел
// «Цены на сайты»): интернет-магазин на 15 моделей у студий Ташкента стоит
// примерно от 1 000 до 3 500 $, отдельные доработки — от 50 до 400 $.
//
//   База 1 700 $: главная-история с заставкой и влётом в букву, каталог
//     15 моделей с карточками и ценами, гарантия, доставка, шоурум, заказ
//     модели в Telegram, русский язык, телефон и компьютер.
//   admin   150 $  админ-панель: модели, цены, ткани, заказы и заявки с
//                  телефона, без программиста. Самый крупный доп: свой
//                  вход, права, история изменений.
//   uz      100 $  второй язык целиком: тексты, карточки, переключатель.
//                  Половина покупателей ищет «kreslo meshok», а не
//                  «кресло мешок».
//   pay     100 $  Payme и Click: договор с платёжкой, проверка оплаты,
//                  статус заказа. Две интеграции.
//   fabric   90 $  выбор ткани и цвета: все 242 образца с их карт расцветок,
//                  крупное фото, номер цвета в заказе.
//   nasiya   80 $  рассрочка Uzum Nasiya и Alif: кнопка партнёра на
//                  карточке и в корзине, без своей кредитной логики.
//   cart     70 $  корзина на несколько моделей и заказ одним сообщением
//                  в Telegram-группу менеджеров.
//   seo      60 $  SEO-старт: страница на каждую модель и запрос,
//                  карточка компании в Google и Яндекс.
//   b2b      60 $  корпоративный заказ: офисы, кафе, мероприятия.
//   size     40 $  подбор размера груши по росту: одна формула.
//   stats    30 $  аналитика: Яндекс Метрика и Google Analytics с целями
//                  «заказ в Telegram» и «звонок», отчёт раз в неделю.
//   pwa      20 $  сайт как приложение: иконка на экране телефона,
//                  открывается без строки браузера.
//   Итого допы: 150 + 100 + 100 + 90 + 80 + 70 + 60 + 60 + 40 + 30 + 20 = 800 $.
//   Админку владелец просил вынести в конструктор (11.10.2026), поэтому
//   цены прочих допов сдвинуты вниз, итог прежний: 2 500 $.

/** Сайт: главная, каталог, карточки моделей, гарантия, доставка, шоурум. */
export const BASE = {
  price: 1700,
  ru: {
    t: "Сайт: главная-история, каталог 15 моделей, гарантия, шоурум",
    d: "Заставка и история кресла при прокрутке, каталог с ценами и фильтром по форме, заказ модели в Telegram, доставка и гарантия. Сначала под телефон.",
  },
  uz: {
    t: "Sayt: bosh sahifa-hikoya, 15 model katalogi, kafolat, shourum",
    d: "Zastavka va aylantirishda kreslo hikoyasi, narxlar va shakl bo‘yicha filtrli katalog, modelni Telegram orqali buyurtma qilish, yetkazib berish va kafolat. Avvalo telefon uchun.",
  },
};

/**
 * Блоки, которые видно на макете. `where` — ключ страницы ("" — главная) или
 * "all". На странице блок помечен data-addon="<id>"; выключили — его нет.
 */
export const ADDONS = [
  { id: "cart", where: "", price: 70, star: true, ru: { t: "Корзина и заказ в Telegram", e: "Несколько моделей в одном заказе, состав, ткань и телефон приходят менеджерам одним сообщением" }, uz: { t: "Savat va Telegram orqali buyurtma", e: "Bitta buyurtmada bir nechta model, tarkib, mato va telefon menejerlarga bitta xabar bilan keladi" } },
  { id: "pay", where: "", price: 100, needs: ["cart"], ru: { t: "Оплата Payme и Click", e: "Покупатель платит с телефона прямо из корзины, вы видите, что заказ оплачен" }, uz: { t: "Payme va Click orqali to‘lov", e: "Xaridor savatdan telefon orqali to‘laydi, siz buyurtma to‘langanini ko‘rasiz" } },
  { id: "nasiya", where: "", price: 80, ru: { t: "Рассрочка Uzum Nasiya и Alif", e: "Кнопка рассрочки на карточке модели и в корзине: дорогое кресло проще купить частями" }, uz: { t: "Uzum Nasiya va Alif muddatli to‘lovi", e: "Model kartochkasida va savatda muddatli to‘lov tugmasi: qimmat kreslo bo‘lib to‘lashda osonroq" } },
  { id: "fabric", where: "", price: 90, ru: { t: "Выбор ткани и цвета", e: "Все 242 образца с ваших карт расцветок: открыть крупно, номер цвета уходит в заказ" }, uz: { t: "Mato va rangni tanlash", e: "Ranglar kartalaringizdagi barcha 242 namuna: katta ochiladi, rang raqami buyurtmaga ketadi" } },
  { id: "size", where: "", price: 40, ru: { t: "Подбор размера по росту", e: "Двигаете рост, и сайт показывает, какая груша подойдёт" }, uz: { t: "Bo‘y bo‘yicha o‘lcham tanlash", e: "Bo‘yni surasiz, sayt qaysi nok mos kelishini ko‘rsatadi" } },
  { id: "b2b", where: "", price: 60, ru: { t: "Корпоративный заказ", e: "Офисам, кафе и мероприятиям: количество, дата и адрес одной заявкой" }, uz: { t: "Korporativ buyurtma", e: "Ofislar, kafelar va tadbirlar uchun: soni, sana va manzil bitta arizada" } },
  { id: "uz", where: "all", price: 100, ru: { t: "Узбекская версия", e: "Переключатель RU / UZ, все страницы на двух языках" }, uz: { t: "O‘zbekcha versiya", e: "RU / UZ almashtirgich, barcha sahifalar ikki tilda" } },
];

export const GROUPS = {
  team: { ru: "Вам", uz: "Sizga" },
  clients: { ru: "Покупателям", uz: "Xaridorlarga" },
};

/** Сверх сайта: блока на макете нет, на странице «Что дальше» — превью. */
export const BLOCKS = [
  {
    id: "admin", group: "team", price: 150, pv: "admin", needs: [],
    ru: { t: "Админ-панель: модели, цены, ткани, заказы", why: "Новая модель, другая цена или ткань закончилась: меняете с телефона сами, без программиста. Заказы и заявки из Telegram лежат в одном списке со статусами.", li: ["Модели, цены и фото", "Ткани и цвета в наличии", "Заказы и заявки со статусами"] },
    uz: { t: "Admin panel: modellar, narxlar, matolar, buyurtmalar", why: "Yangi model, boshqa narx yoki mato tugadi: telefondan o‘zingiz, dasturchisiz o‘zgartirasiz. Telegramdan kelgan buyurtma va arizalar holatlari bilan bitta ro‘yxatda.", li: ["Modellar, narxlar va fotolar", "Mavjud matolar va ranglar", "Holatli buyurtma va arizalar"] },
  },
  {
    id: "stats", group: "team", price: 30, pv: "stats", needs: [],
    ru: { t: "Аналитика: Метрика и Google Analytics", why: "Видно, сколько людей открыло сайт, откуда пришли и сколько нажали «Заказать» или позвонили. Раз в неделю короткий отчёт в Telegram.", li: ["Цели «заказ» и «звонок»", "Откуда приходят покупатели", "Отчёт раз в неделю"] },
    uz: { t: "Analitika: Metrika va Google Analytics", why: "Saytni nechta odam ochgani, qayerdan kelgani va nechtasi «Buyurtma» bosgani yoki qo‘ng‘iroq qilgani ko‘rinadi. Haftada bir marta Telegramga qisqa hisobot.", li: ["«Buyurtma» va «qo‘ng‘iroq» maqsadlari", "Xaridorlar qayerdan keladi", "Haftalik hisobot"] },
  },
  {
    id: "pwa", group: "clients", price: 20, pv: "pwa", needs: [],
    ru: { t: "Сайт как приложение", why: "Покупатель добавляет сайт на экран телефона: иконка Enotmebel рядом с банком и такси, открывается без строки браузера. Без App Store.", li: ["Иконка на экране телефона", "Открывается как приложение", "Без App Store"] },
    uz: { t: "Sayt ilova kabi", why: "Xaridor saytni telefon ekraniga qo‘shadi: Enotmebel belgisi bank va taksi yonida, brauzer satrisiz ochiladi. App Store’siz.", li: ["Telefon ekranida belgi", "Ilova kabi ochiladi", "App Store’siz"] },
  },
  {
    id: "seo", group: "clients", price: 60, pv: "seo", needs: [],
    ru: { t: "SEO-старт: страница на каждую модель", why: "Человек ищет «кресло мешок Ташкент» или «bin beg» и попадает на вашу страницу с ценой и кнопкой заказа, а не к продавцу на маркетплейсе.", li: ["Страница на модель и форму", "Заголовки под живые запросы", "Карточка в Google и Яндекс"] },
    uz: { t: "SEO-start: har bir modelga sahifa", why: "Odam «kreslo meshok Toshkent» yoki «bin beg» deb qidiradi va marketpleysdagi sotuvchiga emas, narx va buyurtma tugmasi bor sizning sahifangizga tushadi.", li: ["Model va shaklga sahifa", "Jonli so‘rovlarga sarlavhalar", "Google va Yandex’da kartochka"] },
  },
];
