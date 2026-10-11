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
//     модели в Telegram, админка «модели, цены, ткани», русский язык,
//     телефон и компьютер.
//   uz      150 $  второй язык целиком: тексты, карточки, переключатель.
//                  Половина покупателей ищет «kreslo meshok», а не
//                  «кресло мешок».
//   cart     90 $  корзина на несколько моделей и заказ одним сообщением
//                  в Telegram-группу менеджеров.
//   pay     120 $  Payme и Click: договор с платёжкой, проверка оплаты,
//                  статус заказа. Дороже корзины: две интеграции.
//   nasiya  100 $  рассрочка Uzum Nasiya и Alif: кнопка партнёра на
//                  карточке и в корзине, без своей кредитной логики.
//   fabric  110 $  выбор ткани и цвета: все 242 образца с их карт расцветок,
//                  крупное фото, номер цвета в заказе.
//   size     50 $  подбор размера груши по росту: одна формула.
//   b2b      80 $  корпоративный заказ: офисы, кафе, мероприятия.
//   seo     100 $  SEO-старт: страница на каждую модель и запрос,
//                  карточка компании в Google и Яндекс.
//   Итого допы: 150 + 90 + 120 + 100 + 110 + 50 + 80 + 100 = 800 $.

/** Сайт: главная, каталог, карточки моделей, гарантия, доставка, шоурум. */
export const BASE = {
  price: 1700,
  ru: {
    t: "Сайт: главная-история, каталог 15 моделей, гарантия, шоурум",
    d: "Заставка и история кресла при прокрутке, каталог с ценами и фильтром по форме, заказ модели в Telegram, доставка и гарантия, админка «модели, цены, ткани». Сначала под телефон.",
  },
  uz: {
    t: "Sayt: bosh sahifa-hikoya, 15 model katalogi, kafolat, shourum",
    d: "Zastavka va aylantirishda kreslo hikoyasi, narxlar va shakl bo‘yicha filtrli katalog, modelni Telegram orqali buyurtma qilish, yetkazib berish va kafolat, «modellar, narxlar, matolar» admin paneli. Avvalo telefon uchun.",
  },
};

/**
 * Блоки, которые видно на макете. `where` — ключ страницы ("" — главная) или
 * "all". На странице блок помечен data-addon="<id>"; выключили — его нет.
 */
export const ADDONS = [
  { id: "cart", where: "", price: 90, star: true, ru: { t: "Корзина и заказ в Telegram", e: "Несколько моделей в одном заказе, состав, ткань и телефон приходят менеджерам одним сообщением" }, uz: { t: "Savat va Telegram orqali buyurtma", e: "Bitta buyurtmada bir nechta model, tarkib, mato va telefon menejerlarga bitta xabar bilan keladi" } },
  { id: "pay", where: "", price: 120, needs: ["cart"], ru: { t: "Оплата Payme и Click", e: "Покупатель платит с телефона прямо из корзины, вы видите, что заказ оплачен" }, uz: { t: "Payme va Click orqali to‘lov", e: "Xaridor savatdan telefon orqali to‘laydi, siz buyurtma to‘langanini ko‘rasiz" } },
  { id: "nasiya", where: "", price: 100, ru: { t: "Рассрочка Uzum Nasiya и Alif", e: "Кнопка рассрочки на карточке модели и в корзине: дорогое кресло проще купить частями" }, uz: { t: "Uzum Nasiya va Alif muddatli to‘lovi", e: "Model kartochkasida va savatda muddatli to‘lov tugmasi: qimmat kreslo bo‘lib to‘lashda osonroq" } },
  { id: "fabric", where: "", price: 110, ru: { t: "Выбор ткани и цвета", e: "Все 242 образца с ваших карт расцветок: открыть крупно, номер цвета уходит в заказ" }, uz: { t: "Mato va rangni tanlash", e: "Ranglar kartalaringizdagi barcha 242 namuna: katta ochiladi, rang raqami buyurtmaga ketadi" } },
  { id: "size", where: "", price: 50, ru: { t: "Подбор размера по росту", e: "Двигаете рост, и сайт показывает, какая груша подойдёт" }, uz: { t: "Bo‘y bo‘yicha o‘lcham tanlash", e: "Bo‘yni surasiz, sayt qaysi nok mos kelishini ko‘rsatadi" } },
  { id: "b2b", where: "", price: 80, ru: { t: "Корпоративный заказ", e: "Офисам, кафе и мероприятиям: количество, дата и адрес одной заявкой" }, uz: { t: "Korporativ buyurtma", e: "Ofislar, kafelar va tadbirlar uchun: soni, sana va manzil bitta arizada" } },
  { id: "uz", where: "all", price: 150, ru: { t: "Узбекская версия", e: "Переключатель RU / UZ, все страницы на двух языках" }, uz: { t: "O‘zbekcha versiya", e: "RU / UZ almashtirgich, barcha sahifalar ikki tilda" } },
];

export const GROUPS = {
  clients: { ru: "Покупателям из поиска", uz: "Qidiruvdan kelgan xaridorlarga" },
};

/** Сверх сайта: блока на макете нет, на странице «Что дальше» — превью. */
export const BLOCKS = [
  {
    id: "seo", group: "clients", price: 100, pv: "seo", needs: [],
    ru: { t: "SEO-старт: страница на каждую модель", why: "Человек ищет «кресло мешок Ташкент» или «bin beg» и попадает на вашу страницу с ценой и кнопкой заказа, а не к продавцу на маркетплейсе.", li: ["Страница на модель и форму", "Заголовки под живые запросы", "Карточка в Google и Яндекс"] },
    uz: { t: "SEO-start: har bir modelga sahifa", why: "Odam «kreslo meshok Toshkent» yoki «bin beg» deb qidiradi va marketpleysdagi sotuvchiga emas, narx va buyurtma tugmasi bor sizning sahifangizga tushadi.", li: ["Model va shaklga sahifa", "Jonli so‘rovlarga sarlavhalar", "Google va Yandex’da kartochka"] },
  },
];
