// Конструктор цены Greenwell: магазин и допы тумблерами.
//
// Владелец DevUz, 15.10.2026: «Цена такого счастья без допов по акции -
// 1000$. Допы считаются отдельно, придумай 10-20 допов, которые им нужны
// будут как магазину». Обычная цена магазина — 4 900 $: интернет-магазин с
// кабинетом покупателя, рассрочкой и панелью владельца у студий Ташкента —
// это уровень «платформы с ролями» (от 40-60 млн сум, docs/research/greenwell.md,
// раздел «Цены»). Акция — 48 часов с первого открытия макета; допы по
// обычной цене, без скидки.
//
// Все цены макета живут здесь, и только здесь. Держит tests/proto-bundles.test.ts.

/** Магазин без допов: 1 000 $ по акции вместо 4 900 $. */
export const BASE = {
  price: 4900,
  promo: 1000,
  weeks: [5, 7],
  ru: {
    t: "Интернет-магазин Greenwell",
    d: "Магазин под телефон на русском и узбекском, каталог с поиском и фильтрами, карточка с отзывами, корзина с промокодом и баллами, оформление в один экран с адресом на карте и временем доставки, оплата Click, Payme, Uzum Bank, рассрочка, статус заказа, отзывы за баллы, кабинет покупателя. Панель магазина: заказы, отзывы, история менеджеров, прибыль по себестоимости, скорость доставки, остатки, посещаемость и воронка.",
  },
  uz: {
    t: "Greenwell internet-do‘koni",
    d: "Telefon uchun rus va o‘zbek tilidagi do‘kon, qidiruv va filtrli katalog, sharhli kartochka, promokod va ballar bilan savat, xaritadagi manzil va yetkazish vaqti bilan bir ekranda rasmiylashtirish, Click, Payme, Uzum Bank orqali to‘lov, muddatli to‘lov, buyurtma holati, ball uchun sharhlar, xaridor kabineti. Do‘kon paneli: buyurtmalar, sharhlar, menejerlar tarixi, tannarx bo‘yicha foyda, yetkazish tezligi, qoldiqlar, tashriflar va voronka.",
  },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

/* Допы: цена — середина рынка студий Ташкента и СНГ; star — магазины БАДов берут первым. */
export const ADDONS = [
  { id: "subscribe", price: 450, star: true,
    ru: { t: "Подписка на курс", e: "Банка рассчитана на месяц: покупатель подписывается, и следующая приходит сама, с оплатой с карты. Повторные покупки без напоминаний" },
    uz: { t: "Kursga obuna", e: "Banka bir oyga mo‘ljallangan: xaridor obuna bo‘ladi va keyingisi o‘zi keladi, kartadan to‘lov bilan. Eslatmasiz takroriy xaridlar" } },
  { id: "abandoned", price: 250, star: true,
    ru: { t: "Брошенная корзина", e: "Положил в корзину и ушёл: через час напоминание в Telegram или SMS со ссылкой на ту же корзину" },
    uz: { t: "Tashlab ketilgan savat", e: "Savatga solib ketdimi: bir soatdan keyin o‘sha savatga havola bilan Telegram yoki SMS eslatma" } },
  { id: "tgbot", price: 450, star: true,
    ru: { t: "Telegram-бот магазина", e: "Каталог, заказ и статус доставки прямо в Telegram, куда уже пишут ваши покупатели" },
    uz: { t: "Do‘kon Telegram-boti", e: "Katalog, buyurtma va yetkazish holati to‘g‘ridan-to‘g‘ri Telegramda, xaridorlaringiz allaqachon yozadigan joyda" } },
  { id: "erp", price: 600, star: true,
    ru: { t: "Связка с 1С или МойСклад", e: "Остатки, цены и себестоимость приходят сами, заказы уходят на склад без ручного ввода" },
    uz: { t: "1C yoki MoySklad bilan bog‘lash", e: "Qoldiqlar, narxlar va tannarx o‘zi keladi, buyurtmalar omborga qo‘lda kiritmasdan ketadi" } },
  { id: "fiscal", price: 350, star: true,
    ru: { t: "Фискальные чеки", e: "Чек по каждой оплате на сайте через оператора фискальных данных, покупателю в SMS и в кабинет" },
    uz: { t: "Fiskal cheklar", e: "Saytdagi har bir to‘lov uchun fiskal ma’lumotlar operatori orqali chek, xaridorga SMS va kabinetga" } },
  { id: "uzum", price: 400,
    ru: { t: "Выгрузка на Uzum Market", e: "Товары, цены и остатки из панели сами обновляются в вашем магазине на Uzum: одна база на два канала" },
    uz: { t: "Uzum Market’ga yuklash", e: "Paneldagi mahsulotlar, narxlar va qoldiqlar Uzumdagi do‘koningizda o‘zi yangilanadi: ikki kanal uchun bitta baza" } },
  { id: "loyalty", price: 350,
    ru: { t: "Лояльность с уровнями", e: "Green, Silver, Gold: чем больше покупок, тем больше баллов; подарок в день рождения" },
    uz: { t: "Darajali sodiqlik", e: "Green, Silver, Gold: xarid qancha ko‘p bo‘lsa, ball shuncha ko‘p; tug‘ilgan kunga sovg‘a" } },
  { id: "promo", price: 300,
    ru: { t: "Промокоды и акции из панели", e: "Скидка на категорию, «два по цене одного», наборы на курс: запускает менеджер, без программиста" },
    uz: { t: "Paneldan promokodlar va aksiyalar", e: "Toifaga chegirma, «ikkitasi bitta narxida», kurs uchun to‘plamlar: dasturchisiz menejer ishga tushiradi" } },
  { id: "delivery", price: 500,
    ru: { t: "Курьерские службы", e: "Yandex Delivery, BTS, Fargo: цена доставки считается сама, трек-номер у покупателя в заказе" },
    uz: { t: "Kuryerlik xizmatlari", e: "Yandex Delivery, BTS, Fargo: yetkazish narxi o‘zi hisoblanadi, trek-raqam xaridorning buyurtmasida" } },
  { id: "sms", price: 150,
    ru: { t: "SMS-шлюз Eskiz или Playmobile", e: "Коды входа и статусы заказа в SMS тем, у кого нет Telegram" },
    uz: { t: "Eskiz yoki Playmobile SMS-shlyuzi", e: "Kirish kodlari va buyurtma holatlari Telegrami yo‘qlarga SMS orqali" } },
  { id: "crm", price: 400,
    ru: { t: "Заказы в amoCRM или Bitrix24", e: "Если менеджеры уже работают в CRM: заказ, звонок и переписка в одной карточке клиента" },
    uz: { t: "Buyurtmalar amoCRM yoki Bitrix24’ga", e: "Menejerlar allaqachon CRMda ishlasa: buyurtma, qo‘ng‘iroq va yozishma bitta mijoz kartochkasida" } },
  { id: "video", price: 200,
    ru: { t: "Отзывы с видео", e: "Покупатель снимает короткое видео с банкой: такие отзывы смотрят дольше, чем читают текст" },
    uz: { t: "Video sharhlar", e: "Xaridor banka bilan qisqa video oladi: bunday sharhlarni matndan ko‘ra uzoqroq tomosha qilishadi" } },
  { id: "compare", price: 150,
    ru: { t: "Сравнение товаров", e: "Два магния рядом: форма, сколько капсул, на сколько дней, цена за день" },
    uz: { t: "Mahsulotlarni solishtirish", e: "Ikki magniy yonma-yon: shakli, necha kapsula, necha kunga, bir kunlik narx" } },
  { id: "pickup", price: 450,
    ru: { t: "Самовывоз из аптек и мультисклад", e: "Аптеки-партнёры на карте с остатками: забрать сегодня рядом с домом" },
    uz: { t: "Dorixonalardan olib ketish va ko‘p ombor", e: "Hamkor dorixonalar qoldiqlari bilan xaritada: bugun uy yonidan olib ketish" } },
  { id: "ai", price: 500,
    ru: { t: "Подбор по цели", e: "Пять вопросов: сон, энергия, суставы, кожа. В ответ набор из ваших товаров и ссылка на консультацию специалиста" },
    uz: { t: "Maqsad bo‘yicha tanlov", e: "Beshta savol: uyqu, energiya, bo‘g‘imlar, teri. Javobda mahsulotlaringizdan to‘plam va mutaxassis maslahatiga havola" } },
  { id: "seo", price: 400,
    ru: { t: "Статьи под поиск", e: "10 статей о витаминах под запросы из Узбекистана, на русском и узбекском, с вашими товарами внутри" },
    uz: { t: "Qidiruv uchun maqolalar", e: "O‘zbekistondagi so‘rovlar bo‘yicha vitaminlar haqida 10 ta maqola, rus va o‘zbek tilida, ichida mahsulotlaringiz bilan" } },
  { id: "b2b", price: 900,
    ru: { t: "Оптовый кабинет для аптек", e: "Аптека заказывает по своей цене, видит долг и отгрузки, скачивает счёт: без звонков торговому" },
    uz: { t: "Dorixonalar uchun ulgurji kabinet", e: "Dorixona o‘z narxida buyurtma beradi, qarz va jo‘natmalarni ko‘radi, hisobni yuklab oladi: savdo vakiliga qo‘ng‘iroqsiz" } },
  { id: "app", price: 2900,
    ru: { t: "Приложение для iPhone и Android", e: "Тот же магазин в App Store и Google Play: пуши о скидках и о том, что курс заканчивается" },
    uz: { t: "iPhone va Android uchun ilova", e: "O‘sha do‘kon App Store va Google Play’da: chegirmalar va kurs tugayotgani haqida push-xabarlar" } },
];

/**
 * AI Seller: агенты нашего Seller AI ведут магазины на маркетплейсах.
 * Владелец DevUz, 16.10.2026: «2 формата: автоматизация одного маркетплейса
 * через их дашборд - 5000$ и код на их стороне, либо подписка 500$ в месяц».
 * В «Всё вместе» (ALL) не входит: это отдельный выбор, а не доп-тумблер.
 */
export const SELLER = {
  code: { price: 5000,
    ru: { t: "Seller AI: один маркетплейс, код у вас", e: "Агенты ведут цены, отзывы, поставки, карточки и рекламу одной площадки из раздела «AI Seller» вашей панели. Код ставим на вашей стороне, оплата разовая; каждая следующая площадка считается отдельно" },
    uz: { t: "Seller AI: bitta marketpleys, kod sizda", e: "Agentlar panelingizdagi «AI Seller» bo‘limidan bitta maydonchaning narxlari, sharhlari, ta’minoti, kartochkalari va reklamasini boshqaradi. Kod sizning tomoningizga o‘rnatiladi, to‘lov bir martalik; har bir keyingi maydoncha alohida hisoblanadi" } },
  sub: { month: 500,
    ru: { t: "Seller AI: подписка", e: "Агенты работают на нашей стороне, вы видите и решаете всё в разделе «AI Seller» своей панели. Без разовой оплаты за код" },
    uz: { t: "Seller AI: obuna", e: "Agentlar bizning tomonda ishlaydi, siz hammasini panelingizdagi «AI Seller» bo‘limida ko‘rasiz va hal qilasiz. Kod uchun bir martalik to‘lovsiz" } },
};

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
