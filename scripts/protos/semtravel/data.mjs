// Факты макета SEM Travel: только то, что агентство говорит о себе на
// semtravel.uz (снято 21.10.2026), и оценка на Яндекс Картах. Цены туров
// «от $» — их блок «Куда сейчас дешевле?» на 21.10.2026: минимальная цена в
// базе туроператоров за одного, без выбора отеля. Всё остальное (отели,
// календарь цен по дням, итог на всех) — демо и подписано так на странице.

export const BRAND = {
  name: "SEM Travel",
  site: "https://semtravel.uz",
  since: 2011,
  clients: "30 000+",
  countries: "50+",
  phone: "+998 71 275-55-55", phoneRaw: "+998712755555",
  phone2: "+998 94 664-22-22", phone2Raw: "+998946642222",
  /* @semtravel — их канал; туры, по описанию канала, — в боте @prosem_bot. */
  tg: "https://t.me/prosem_bot", tgName: "@prosem_bot",
  channel: "https://t.me/semtravel", channelName: "@semtravel",
  ig: "https://www.instagram.com/semtravel_official/", igName: "semtravel_official",
  mail: "semtraveluz@mail.ru",
  rating: "4.7", votes: 47, reviews: 11,
  yandex: "https://yandex.uz/maps/?text=SEM%20Travel%20Toshkent",
  /* Два офиса (их «О нас» и разметка сайта), часы одни. */
  offices: [
    { id: "uchtepa", geo: [41.288557, 69.172061],
      ru: { t: "Учтепа", a: "Учтепинский район, Катта Хирмонтепа, 12А" },
      uz: { t: "Uchtepa", a: "Uchtepa tumani, Katta Xirmontepa ko‘chasi, 12A" } },
    { id: "olmazor", geo: [41.348022, 69.253153],
      ru: { t: "Алмазар", a: "Алмазарский район, Park City Olmazor" },
      uz: { t: "Olmazor", a: "Olmazor tumani, Park City Olmazor" } },
  ],
  hours: { ru: "Пн-Сб 9:00-19:00", uz: "Du-Sha 9:00-19:00" },
  pay: ["Payme", "Click", "Uzcard", "Humo", "Visa", "Mastercard"],
  /* FAQ: «для первичного бронирования достаточно аванса 30%». */
  advance: 30,
};

/* Ташкент — центр карты перелётов. */
export const TAS = [41.31, 69.24];

/* Направления из блока «Куда сейчас дешевле?» (21.10.2026), по их порядку.
   price — от $ за одного, nights и date — ближайший вылет с этой ценой.
   season, hours, visa — со страницы «Туры» и FAQ; где у них пусто — пусто.
   geo — город, куда обычно летят (для карты из Ташкента). */
export const DEST = [
  { id: "dubai", code: "DXB", price: 461, nights: 6, date: "2026-10-27", geo: [25.2, 55.27], img: "d-dubai",
    ru: { t: "Дубай", g: "в Дубай", season: "октябрь-апрель", hours: "около 3 ч" }, uz: { t: "Dubai", g: "Dubaiga", season: "oktyabr-aprel", hours: "taxminan 3 soat" },
    m: [10, 11, 12, 1, 2, 3, 4], beach: true },
  { id: "azer", code: "GYD", price: 467, nights: 6, date: "2026-11-06", geo: [40.41, 49.87], img: "d-azer",
    ru: { t: "Азербайджан", g: "в Азербайджан" }, uz: { t: "Ozarbayjon", g: "Ozarbayjonga" }, m: [] },
  { id: "georgia", code: "TBS", price: 576, nights: 7, date: "2026-11-16", geo: [41.72, 44.79], img: "d-georgia",
    ru: { t: "Грузия", g: "в Грузию", season: "апрель-октябрь", hours: "около 2,5 ч", visa: "без визы" }, uz: { t: "Gruziya", g: "Gruziyaga", season: "aprel-oktyabr", hours: "taxminan 2,5 soat", visa: "vizasiz" },
    m: [4, 5, 6, 7, 8, 9, 10] },
  { id: "china", code: "PVG", price: 608, nights: 8, date: "2026-10-22", geo: [31.23, 121.47], img: "d-china",
    ru: { t: "Китай", g: "в Китай", season: "март-май, сентябрь-ноябрь", hours: "5-6 ч", visa: "нужна виза" }, uz: { t: "Xitoy", g: "Xitoyga", season: "mart-may, sentyabr-noyabr", hours: "5-6 soat", visa: "viza kerak" },
    m: [3, 4, 5, 9, 10, 11] },
  { id: "lanka", code: "CMB", price: 617, nights: 7, date: "2026-10-31", geo: [6.93, 79.85], img: "d-lanka",
    ru: { t: "Шри-Ланка", g: "на Шри-Ланку" }, uz: { t: "Shri-Lanka", g: "Shri-Lankaga" }, m: [], beach: true },
  { id: "egypt", code: "HRG", price: 618, nights: 7, date: "2026-11-12", geo: [27.26, 33.81], img: "d-egypt",
    ru: { t: "Египет", g: "в Египет", season: "октябрь-апрель", hours: "около 5 ч", visa: "виза по прилёту" }, uz: { t: "Misr", g: "Misrga", season: "oktyabr-aprel", hours: "taxminan 5 soat", visa: "viza aeroportda" },
    m: [10, 11, 12, 1, 2, 3, 4], beach: true },
  { id: "vietnam", code: "PQC", price: 626, nights: 8, date: "2026-10-27", geo: [10.23, 103.96], img: "d-vietnam",
    ru: { t: "Вьетнам", g: "во Вьетнам", season: "ноябрь-апрель", hours: "возможна пересадка", visa: "нужна виза" }, uz: { t: "Vyetnam", g: "Vyetnamga", season: "noyabr-aprel", hours: "peresadka bo‘lishi mumkin", visa: "viza kerak" },
    m: [11, 12, 1, 2, 3, 4], beach: true },
  { id: "turkey", code: "AYT", price: 658, nights: 6, date: "2026-10-24", geo: [36.9, 30.7], img: "d-turkey",
    ru: { t: "Турция", g: "в Турцию", season: "апрель-октябрь", hours: "около 4 ч", visa: "без визы до 30 дней" }, uz: { t: "Turkiya", g: "Turkiyaga", season: "aprel-oktyabr", hours: "taxminan 4 soat", visa: "30 kungacha vizasiz" },
    m: [4, 5, 6, 7, 8, 9, 10], beach: true },
  { id: "qatar", code: "DOH", price: 689, nights: 7, date: "2026-11-16", geo: [25.29, 51.53], img: "d-qatar",
    ru: { t: "Катар", g: "в Катар" }, uz: { t: "Qatar", g: "Qatarga" }, m: [] },
  { id: "thai", code: "HKT", price: 730, nights: 7, date: "2026-11-15", geo: [7.88, 98.39], img: "d-thai",
    ru: { t: "Таиланд", g: "в Таиланд", season: "ноябрь-апрель", hours: "8-9 ч", visa: "e-visa заранее" }, uz: { t: "Tailand", g: "Tailandga", season: "noyabr-aprel", hours: "8-9 soat", visa: "e-visa oldindan" },
    m: [11, 12, 1, 2, 3, 4], beach: true },
];

/* Спецпредложение с их главной: «Турция · Анталья · 7 ночей · All Inclusive». */
export const SPECIAL = { old: 1240, now: 890, nights: 7 };

/* Услуги с их главной («Выберите нужную услугу») и страницы «Виза». */
export const SERVICES = [
  { id: "air", from: { ru: "из 10 городов Узбекистана", uz: "O‘zbekistonning 10 shahridan" },
    ru: { t: "Авиабилеты", d: "Ташкент-Москва от 558 009 сум, Pobeda, прямой рейс. Прямые и с пересадкой подписаны отдельно." },
    uz: { t: "Aviachiptalar", d: "Toshkent-Moskva 558 009 so‘mdan, Pobeda, to‘g‘ri reys. To‘g‘ri va peresadkali reyslar alohida yozilgan." } },
  { id: "hotel", from: { ru: "5★ от $38 за ночь", uz: "5★ kechasi $38 dan" },
    ru: { t: "Отели", d: "Отель без перелёта: когда билеты уже есть или едете на машине." },
    uz: { t: "Mehmonxonalar", d: "Parvozsiz mehmonxona: chiptalar bor bo‘lsa yoki mashinada borsangiz." } },
  { id: "transfer", from: { ru: "от $15", uz: "$15 dan" },
    ru: { t: "Трансфер", d: "Аэропорт и отель: встретят с табличкой и довезут." },
    uz: { t: "Transfer", d: "Aeroport va mehmonxona: lavha bilan kutib olib, yetkazib qo‘yishadi." } },
  { id: "visa", from: { ru: "от $49", uz: "$49 dan" },
    ru: { t: "Визы", d: "Шенген, Дубай, Таиланд и ещё 40+ стран. Шенген: 15-20 рабочих дней, документы проверим до подачи." },
    uz: { t: "Vizalar", d: "Shengen, Dubai, Tailand va yana 40+ davlat. Shengen: 15-20 ish kuni, hujjatlarni topshirishdan oldin tekshiramiz." } },
];

/* Отзывы — с их главной, Яндекс Карты, филиал Учтепа; текст их же,
   узбекский — их перевод на узбекской странице. */
export const REVIEWS = [
  { who: "Maftuna Islomova", date: { ru: "18 июня 2025", uz: "18-iyun 2025" },
    ru: "Купили тур, спасибо, всё шикарно! Особенно тур-оператору Фатиме 🌹", uz: "Tur sotib oldik, rahmat, hammasi zo‘r! Ayniqsa turoperator Fotimaga 🌹" },
  { who: "Jahongir Sobirjonov", date: { ru: "24 февраля 2025", uz: "24-fevral 2025" },
    ru: "Спасибо большое SEM TRAVEL 👍❤️ Быстрый и надёжный тур, такого я ещё не видел. Удачи компании!", uz: "Katta rahmat SEM TRAVEL 👍❤️ Tez va ishonchli tur, bunaqasini ko‘rmagandim. Kompaniyaga omad!" },
  { who: "Jalilov", date: { ru: "3 сентября 2025", uz: "3-sentabr 2025" },
    ru: "Фатима предложила экскурсию по выгодной цене. Спасибо!", uz: "Fotima foydali narxda ekskursiya taklif qildi. Rahmat!" },
  { who: "Murodjon Sobirov", date: { ru: "23 февраля 2024", uz: "23-fevral 2024" },
    ru: "Качественный сервис, доступные цены.", uz: "Sifatli xizmat, hamyonbop narxlar." },
  { who: "Noiba Pulatova", date: { ru: "13 августа 2025", uz: "13-avgust 2025" },
    ru: "Спасибо, сестра Фатима!", uz: "Rahmat, Fotima opa!" },
];

/* SEM Club — их страница клуба: кэшбэк по статусу, сертификат после
   первого тура, 1% за друга, потолок 3% от стоимости тура. */
export const CLUB = [
  { id: "classic", cb: 0.5, ru: { t: "Classic", f: "с первого тура" }, uz: { t: "Classic", f: "birinchi turdan" } },
  { id: "gold", cb: 1, ru: { t: "Gold", f: "от $20 000 в турах" }, uz: { t: "Gold", f: "turlarda $20 000 dan" } },
  { id: "platinum", cb: 1.5, ru: { t: "Platinum", f: "от $40 000 в турах" }, uz: { t: "Platinum", f: "turlarda $40 000 dan" } },
];
export const CLUB_GIFT = 30;

/* «Сейчас и станет»: что видно на semtravel.uz с телефона 21.10.2026,
   словами путешественника. */
export const NOW = [
  { ru: ["Цена «от $461» за одного и без отеля. Сколько заплатит семья из четырёх, надо спрашивать.", "Итог сразу на всех: взрослые, дети, перелёт, отель, трансфер. Одна сумма до звонка."],
    uz: ["«$461 dan» narx bir kishiga va mehmonxonasiz. To‘rt kishilik oila qancha to‘lashini so‘rash kerak.", "Hamma uchun jami darhol: kattalar, bolalar, parvoz, mehmonxona, transfer. Qo‘ng‘iroqdan oldin bitta summa."] },
  { ru: ["«Не знаете, куда поехать?» ведёт в чат и ждёт менеджера.", "Бюджет, месяц и сколько вас: три страны на экране сразу, менеджер подключается уже к выбору."],
    uz: ["«Qayerga borishni bilmaysizmi?» chatga olib boradi va menejerni kutadi.", "Byudjet, oy va necha kishi: uchta davlat ekranda darhol, menejer tanlovga qo‘shiladi."] },
  { ru: ["На первом экране телефона нет номера: позвонить можно только из самого низа страницы.", "Позвонить и Telegram в одно нажатие на первом экране и внизу экрана всегда."],
    uz: ["Telefonda birinchi ekranda raqam yo‘q: qo‘ng‘iroqni faqat sahifaning eng pastidan qilish mumkin.", "Qo‘ng‘iroq va Telegram birinchi ekranda bir bosishda va doim ekran pastida."] },
  { ru: ["На русской странице попадаются узбекские слова: «~4 soat», «Yas Island yoki shahar markazi».", "Каждый язык целиком на своём языке, проверено кодом при каждой сборке."],
    uz: ["Rus sahifasida o‘zbekcha so‘zlar uchraydi: «~4 soat», «Yas Island yoki shahar markazi».", "Har bir til to‘liq o‘z tilida, har yig‘ishda kod bilan tekshiriladi."] },
  { ru: ["Гарантии (ваучер, разница в цене, отмена за 21 день) стоят на шестом экране телефона, текстом.", "Гарантии рядом с ценой и в карточке тура: образец ваучера и шкала отмены, которую можно подвигать."],
    uz: ["Kafolatlar (voucher, narx farqi, 21 kun oldin bekor qilish) telefonda oltinchi ekranda, matn bilan.", "Kafolatlar narx yonida va tur kartasida: voucher namunasi va surib ko‘rsa bo‘ladigan bekor qilish shkalasi."] },
  { ru: ["В SEM Club счётчики показывают «0 участников, 0 туров, 0 призов».", "Клуб считает выгоду: введите сумму тура, увидите кэшбэк и сертификат $30."],
    uz: ["SEM Club’da hisoblagichlar «0 ishtirokchi, 0 tur, 0 sovg‘a» deb ko‘rsatadi.", "Klub foydani hisoblaydi: tur summasini kiriting, keshbek va $30 sertifikatni ko‘rasiz."] },
  { ru: ["Одна и та же Турция стоит $658, $620 и «$1 240 → $890» в разных блоках одной страницы.", "Одна цена у направления везде: карта, календарь и карточка берут её из одного места."],
    uz: ["Bitta Turkiya bitta sahifaning turli bloklarida $658, $620 va «$1 240 → $890» turadi.", "Yo‘nalishning narxi hamma joyda bitta: xarita, kalendar va karta uni bir joydan oladi."] },
];
