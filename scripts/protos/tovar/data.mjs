// Факты tovar.uz для макета. Всё здесь снято с их сайта 18.10.2026: разделы
// и подписи (ru и uz), товары с ценой, наличием, продавцом, способом оплаты и
// датой «Цена обновлена», реквизиты продавцов, условия доставки SHOP-IT,
// устройство кабинета продавца из их справки (help?p=200, 203, 204).
// Чего на сайте нет (ответы продавцов, оптовые ступени конкретного товара,
// заказы, отзывы), в макете демо и так подписано. Подписи [ru, uz].

export const BRAND = {
  name: "tovar.uz",
  full: "Торговая платформа tovar.uz",
  owner: "Golden Pages",
  site: "https://tovar.uz",
  tg: "https://t.me/tovaruz_official",
  ig: "https://www.instagram.com/tovar.uz_official/",
  yt: "https://youtu.be/UIlBWzaTKOk",
  fb: "https://www.facebook.com/tovar.uz",
  since: 2020,
  red: "#c40001",
  tag: "#00b1ea",
};

/* Три ветки их каталога и пятнадцать разделов товаров — с их главной. */
export const PILLARS = [
  { id: "goods", n: ["Товары", "Tovarlar"] },
  { id: "biz", n: ["Товары для бизнеса", "Biznes uchun mahsulotlar"] },
  { id: "serv", n: ["Услуги", "Xizmatlar"] },
];
export const CATS = [
  { id: "auto", ic: "car", n: ["Авто, мото", "Avtomobillar, mototsikllar"] },
  { id: "pets", ic: "paw", n: ["Домашние животные и зоотовары", "Uy hayvonlari"] },
  { id: "home", ic: "home", n: ["Дом и сад", "Uy va bog‘"] },
  { id: "tool", ic: "tool", n: ["Инструмент", "Asboblar"] },
  { id: "office", ic: "pen", n: ["Канцтовары", "Kantselyariya mollari"] },
  { id: "beauty", ic: "drop", n: ["Красота и здоровье", "Go‘zallik va salomatlik"] },
  { id: "wear", ic: "shirt", n: ["Одежда, обувь, аксессуары", "Kiyim-kechak, poyafzal"] },
  { id: "gift", ic: "gift", n: ["Подарки, хобби, книги", "Sovg‘alar, qiziqishlar, kitoblar"] },
  { id: "art", ic: "gem", n: ["Предметы искусства и роскоши", "San’at va hashamat buyumlari"] },
  { id: "food", ic: "cup", n: ["Продукты питания, напитки", "Oziq-ovqat, ichimliklar"] },
  { id: "wed", ic: "ring", n: ["Свадебные товары", "To‘y uchun mahsulotlar"] },
  { id: "sport", ic: "ball", n: ["Спорт и отдых", "Sport va dam olish"] },
  { id: "build", ic: "brick", n: ["Строительство", "Qurilish"] },
  { id: "tech", ic: "chip", n: ["Техника и электроника", "Texnika va elektronika"] },
  { id: "kids", ic: "child", n: ["Товары для детей", "Bolalar uchun buyumlar"] },
];

/* «Популярные категории» с их главной, по веткам. */
export const POPULAR = {
  goods: [["Смартфоны", "Smartfonlar"], ["Ноутбуки", "Noutbuklar"], ["Телевизоры", "Televizorlar"], ["Наушники и гарнитуры", "Quloqchinlar"], ["Климатическая техника", "Iqlim uskunalari"], ["Стиральные машины", "Kir yuvish mashinalari"], ["Офисная мебель", "Ofis mebellari"], ["Книги", "Kitoblar"]],
  biz: [["Маршрутизаторы", "Marshrutizatorlar"], ["Водонагреватели, бойлеры, колонки", "Suv isitgichlari, qozonlar"], ["Электроинструмент", "Elektr asboblar"], ["Моторные масла", "Motor moylari"], ["Отопительное оборудование", "Isitish uskunalari"], ["Грузовики, автобусы, спецтехника", "Yuk mashinalari, maxsus texnika"], ["Гидроизоляционные материалы", "Suv o‘tkazmaydigan materiallar"], ["Отделочные материалы", "Pardoz materiallari"]],
  serv: [["Транспортная логистика", "Transport logistikasi"], ["Ремонт бытовой техники", "Maishiy texnikani ta’mirlash"], ["SMM-маркетинг", "SMM-marketing"], ["Юридические услуги", "Yuridik xizmatlar"], ["Услуги хостинга", "Xosting xizmatlari"], ["Компьютерные курсы", "Kompyuter kurslari"], ["Ведение бухгалтерского учета", "Buxgalteriya hisobi"], ["Перевод документации и текстов", "Hujjatlar tarjimasi"]],
};

export const REGIONS = [["Ташкент", "Toshkent"], ["Ташкентская область", "Toshkent viloyati"], ["Самаркандская область", "Samarqand viloyati"], ["Бухарская область", "Buxoro viloyati"], ["Ферганская область", "Farg‘ona viloyati"], ["Андижанская область", "Andijon viloyati"], ["Наманганская область", "Namangan viloyati"]];

/* Продавцы с их карточек: название, юрлицо, способ оплаты, адрес (если есть). */
export const SELLERS = {
  elso: { n: "ELSO.UZ", legal: "ООО «ELSO UNI TECHNO»", pay: ["uzcard", "click"] },
  shopit: { n: "SHOP-IT", legal: "ООО «SHOP-IT»", pay: ["cash"], addr: ["Ташкент, Яккасарайский район, ул. Ш. Руставели, 65", "Toshkent, Yakkasaroy tumani, Sh. Rustaveli ko‘chasi, 65"], hours: ["Пн-Сб 09:00-18:00, перерыв 13:00-14:00", "Du-Sh 09:00-18:00, tanaffus 13:00-14:00"],
    deliv: ["Бесплатная доставка по Ташкенту без выходных с 12:00 до 18:00. Заказ до 15:00 привезут в тот же день.", "Toshkent bo‘ylab bepul yetkazish, dam olishsiz 12:00 dan 18:00 gacha. 15:00 gacha buyurtma shu kuni keladi."] },
  macbro: { n: "MacBro", legal: "ООО «Mobiseller»", pay: ["cash"] },
  sandal: { n: "SANDAL", legal: "ООО «SANDAL»", pay: ["uzcard", "click"] },
  laptop: { n: "Lap Top Uz", legal: "ООО «Sensor Texnika»", pay: ["bank"] },
  sayina: { n: "Sayina Stroy", legal: "ООО «Sayina Stroy»", pay: ["click"] },
};

/* Товары: id и цены — их; upd — «Цена обновлена» с карточки; mem — память
   из названия (для подбора «та же память у других продавцов»). */
export const GOODS = [
  { id: 113945, cat: "phone", s: "elso", p: 11350000, st: 1, upd: "2023-09-18", n: ["Смартфон Samsung Galaxy S23 Ultra 12/256GB Черный фантом", "Smartfon Samsung Galaxy S23 Ultra 12/256GB qora"], mem: "12/256", cut: 1 },
  { id: 113947, cat: "phone", s: "elso", p: 11350000, st: 1, upd: "2023-09-18", n: ["Смартфон Samsung Galaxy S23 Ultra 12/256GB Лаванда", "Smartfon Samsung Galaxy S23 Ultra 12/256GB lavanda"], mem: "12/256", cut: 1 },
  { id: 113844, cat: "phone", s: "elso", p: 3970000, st: 1, upd: "2023-09-16", n: ["Смартфон Xiaomi Poco X5 Pro 5G 8/256GB Черный", "Smartfon Xiaomi Poco X5 Pro 5G 8/256GB qora"], mem: "8/256", cut: 1 },
  { id: 127572, cat: "phone", s: "shopit", p: 2737900, st: 0, upd: "2025-09-17", n: ["Смартфон Tecno Camon 30 8/256 Basaltic Dark", "Smartfon Tecno Camon 30 8/256 Basaltic Dark"], mem: "8/256", cut: 1,
    spec: [["Производитель", "Ishlab chiqaruvchi", "Tecno"], ["Дисплей", "Displey", "6,78″ AMOLED, 120 Гц"], ["Память", "Xotira", "8 ГБ / 256 ГБ"], ["Камера", "Kamera", "50 Мп + 50 Мп"], ["Аккумулятор", "Batareya", "5000 мА·ч"], ["ОС", "OT", "Android 14"]] },
  { id: 113918, cat: "phone", s: "elso", p: 2450000, st: 1, upd: "2023-09-18", n: ["Смартфон Samsung Galaxy A13 4/128GB Черный", "Smartfon Samsung Galaxy A13 4/128GB qora"], mem: "4/128", cut: 1 },
  { id: 113916, cat: "phone", s: "elso", p: 1850000, st: 1, upd: "2023-09-18", n: ["Смартфон Samsung Galaxy A14 4/64GB Зеленый", "Smartfon Samsung Galaxy A14 4/64GB yashil"], mem: "4/64" },
  { id: 127578, cat: "phone", s: "shopit", p: 1606550, st: 0, upd: "2025-09-17", n: ["Смартфон realme C33 4/128GB Night Sea", "Smartfon realme C33 4/128GB Night Sea"], mem: "4/128" },
  { id: 127558, cat: "phone", s: "shopit", p: 1282490, st: 0, upd: "2025-09-16", n: ["Смартфон Tecno Spark Go 1 4/128 Glittery White", "Smartfon Tecno Spark Go 1 4/128 Glittery White"], mem: "4/128" },
  { id: 130426, cat: "laptop", s: "shopit", p: 36410000, st: 0, upd: "2026-06-08", n: ["Ноутбук Lenovo ThinkPad X1 Carbon G13 Aura Edition", "Noutbuk Lenovo ThinkPad X1 Carbon G13 Aura Edition"], cut: 1 },
  { id: 129337, cat: "laptop", s: "shopit", p: 11760000, st: 0, upd: "2025-12-23", n: ["Ноутбук ASUS Zenbook 14 UX3405CA", "Noutbuk ASUS Zenbook 14 UX3405CA"], cut: 1 },
  { id: 118414, cat: "laptop", s: "laptop", p: 10910778, st: 1, upd: "2023-12-23", n: ["Ноутбук Lenovo IdeaPad 3 Gaming", "Noutbuk Lenovo IdeaPad 3 Gaming"], cut: 1 },
  { id: 130703, cat: "laptop", s: "shopit", p: 12650000, st: 0, upd: "2026-07-22", n: ["Ноутбук ASUS TUF Gaming FX607VJB", "Noutbuk ASUS TUF Gaming FX607VJB"] },
  { id: 113755, cat: "tv", s: "elso", p: 13910000, st: 1, upd: "2023-09-16", n: ["Телевизор LG 55″ OLED 55A2RLA 4K Smart TV", "Televizor LG 55″ OLED 55A2RLA 4K Smart TV"], cut: 1 },
  { id: 113670, cat: "tv", s: "elso", p: 5370000, st: 1, upd: "2023-09-16", n: ["Телевизор Artel 55″ A55LU8500 Ultra HD 4K Android TV", "Televizor Artel 55″ A55LU8500 Ultra HD 4K Android TV"], cut: 1 },
  { id: 130576, cat: "audio", s: "shopit", p: 1274000, st: 1, upd: "2026-07-22", n: ["Наушники HyperX Cloud III Black-Red", "Quloqchin HyperX Cloud III Black-Red"], cut: 1 },
  { id: 79478, cat: "audio", s: "macbro", p: 2310000, st: 1, upd: "2022-01-08", n: ["Наушники Apple AirPods Pro", "Quloqchin Apple AirPods Pro"] },
  { id: 79476, cat: "audio", s: "macbro", p: 1485000, st: 1, upd: "2022-01-08", n: ["Наушники Apple AirPods 2", "Quloqchin Apple AirPods 2"] },
  { id: 79479, cat: "audio", s: "macbro", p: 5500000, st: 1, upd: "2022-01-08", n: ["Наушники Apple AirPods Max", "Quloqchin Apple AirPods Max"] },
  { id: 119467, cat: "audio", s: "sandal", p: 846000, st: 1, upd: "2024-02-10", n: ["Беспроводные наушники Sony WF-C500", "Simsiz quloqchin Sony WF-C500"] },
  { id: 130583, cat: "audio", s: "shopit", p: 527800, st: 1, upd: "2026-05-05", n: ["Наушники HyperX Cloud Earbuds II", "Quloqchin HyperX Cloud Earbuds II"] },
  { id: 53664, cat: "heat", s: "sayina", p: 1600000, st: 1, upd: "2023-05-12", n: ["Водонагреватель Ariston 10 L", "Suv isitgich Ariston 10 L"], biz: 1 },
];

export const SUB = {
  phone: ["Смартфоны", "Smartfonlar"], laptop: ["Ноутбуки", "Noutbuklar"], tv: ["Телевизоры", "Televizorlar"],
  audio: ["Наушники и гарнитуры", "Quloqchinlar"], heat: ["Водонагреватели", "Suv isitgichlari"],
};

/* Поиск понимает оба языка: слово покупателя → раздел. */
export const SYN = {
  phone: ["смартфон", "телефон", "smartfon", "telefon", "samsung", "tecno", "xiaomi", "poco", "realme", "galaxy"],
  laptop: ["ноутбук", "noutbuk", "laptop", "lenovo", "asus", "thinkpad", "zenbook"],
  tv: ["телевизор", "televizor", "tv", "lg", "artel", "oled"],
  audio: ["наушники", "quloqchin", "airpods", "hyperx", "sony", "гарнитура"],
  heat: ["водонагреватель", "бойлер", "suv isitgich", "qozon", "ariston"],
};

/* «Сейчас и станет»: что видно на tovar.uz сегодня. buy — допы из plan.mjs,
   которые это чинят: цена строки — их сумма, кнопка включает их в стоимость. */
export const NOW = [
  { buy: ["fresh"], now: ["У AirPods Pro написано «Цена обновлена 08.01.2022», у Ariston 30 L «03.12.2020». Покупатель не знает, правда ли столько стоит, и звонит.", "AirPods Pro’da «Narx yangilangan 08.01.2022», Ariston 30 L’da «03.12.2020». Xaridor shu narxmi bilmaydi va qo‘ng‘iroq qiladi."],
    next: ["«Цена свежая» на карточке: видно, когда продавец подтвердил цену. Старые цены уходят вниз выдачи, продавцу напоминание.", "Kartochkada «Narx yangi»: sotuvchi narxni qachon tasdiqlagani ko‘rinadi. Eski narxlar pastga tushadi, sotuvchiga eslatma."] },
  { buy: ["otp"], now: ["«Корзина доступна в режиме просмотра! Чтобы заказать товар или услугу, необходима авторизация». Регистрация: почта, пароль, письмо.", "«Savat ko‘rish rejimida! Buyurtma berish uchun avtorizatsiya kerak». Ro‘yxatdan o‘tish: pochta, parol, xat."],
    next: ["Заказ по номеру телефона и коду из SMS, без почты и пароля. Кабинет заводится сам после первого заказа.", "Telefon raqami va SMS kod bilan buyurtma, pochta va parolsiz. Kabinet birinchi buyurtmadan keyin o‘zi ochiladi."] },
  { buy: ["chat"], now: ["Телефон продавца спрятан за «Показать телефон». Переписка, как сказано в вашей справке, «не является полноценным чатом»: новое сообщение видно после обновления страницы.", "Sotuvchi telefoni «Telefonni ko‘rsatish» ortida. Yozishma, ma’lumotnomangizda aytilganidek, «to‘liq chat emas»: yangi xabar sahifa yangilangandan keyin ko‘rinadi."],
    next: ["Чат с продавцом прямо на карточке и отметка, за сколько он обычно отвечает: её считает площадка по настоящим ответам, а не продавец.", "Kartochkada sotuvchi bilan chat va u odatda qancha vaqtda javob berishi belgisi: uni sotuvchi emas, sayt haqiqiy javoblar bo‘yicha hisoblaydi."] },
  { buy: ["search"], now: ["В узбекской версии подсказки поиска по-русски: «Смартфон», «samsung», «холодильник».", "O‘zbekcha versiyada qidiruv maslahatlari ruscha: «Смартфон», «samsung», «холодильник»."],
    next: ["Поиск понимает оба языка: «muzlatgich» и «холодильник», «quloqchin» и «наушники» ведут в один раздел.", "Qidiruv ikki tilni tushunadi: «muzlatgich» va «холодильник», «quloqchin» va «наушники» bitta bo‘limga olib boradi."] },
  { buy: ["promo"], now: ["Между товарами чужая реклама: блоки Яндекса и Google. Покупатель уходит с площадки по чужому баннеру.", "Tovarlar orasida begona reklama: Yandex va Google bloklari. Xaridor begona banner orqali saytdan chiqib ketadi."],
    next: ["Место рекламы занимают ваши продавцы: поднятие товара в выдаче оплачивается вам, а покупатель остаётся на tovar.uz.", "Reklama o‘rnini sotuvchilaringiz egallaydi: tovarni ko‘tarish sizga to‘lanadi, xaridor tovar.uz’da qoladi."] },
  { buy: ["start", "excel", "ladder"], now: ["Продавец заводит компанию формой из десятка полей и ждёт модератора на каждый товар. Оптовых цен до четырёх, но покупатель их считает сам.", "Sotuvchi o‘nlab maydonli forma bilan kompaniya ochadi va har tovarga moderatorni kutadi. Ulgurji narx to‘rttagacha, lekin xaridor ularni o‘zi hisoblaydi."],
    next: ["Компания за минуту по ИНН, товары списком из Excel. В корзине опт лесенкой: взял больше, цена за штуку падает сама.", "STIR bo‘yicha bir daqiqada kompaniya, tovarlar Excel ro‘yxati bilan. Savatda zinapoya ulgurji: ko‘proq olsangiz, dona narxi o‘zi tushadi."] },
];
