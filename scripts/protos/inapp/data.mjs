// Данные макета приложения турагентства. Все туры, отели, туроператоры,
// рейсы и цены ДЕМО: придуманы для показа механики, а не взяты у реальных
// компаний. На каждом экране это сказано. Подписи парами [ru, uz].

/*
 * Агентство — inapp.uz (владелец, 14.10.2026). Сайт inapp.uz отдаёт
 * самоподписанный сертификат и не открылся; логотипа файлом нет. Цвет —
 * голубой с аватара их Telegram «InApp Travel» (@inapptravel), знак —
 * текстом. Название, подпись и цвет меняются здесь и в MARK (gen.mjs).
 */
export const BRAND = {
  name: "inapp.uz",
  tag: ["туры из Ташкента", "Toshkentdan turlar"],
  domain: "inapp.uz",
};

/* Направления: фото, перелёт из Ташкента (демо), курорты. */
export const DEST = [
  { id: "turkey", name: ["Турция", "Turkiya"], photo: "d-turkey", fly: ["около 5 ч", "taxminan 5 soat"], resorts: [["Анталья", "Antaliya"], ["Кемер", "Kemer"], ["Аланья", "Alanya"]] },
  { id: "egypt", name: ["Египет", "Misr"], photo: "d-egypt", fly: ["около 5,5 ч", "taxminan 5,5 soat"], resorts: [["Шарм-эль-Шейх", "Sharm ash-Shayx"], ["Хургада", "Xurgada"]] },
  { id: "uae", name: ["ОАЭ", "BAA"], photo: "d-uae", fly: ["около 3,5 ч", "taxminan 3,5 soat"], resorts: [["Дубай", "Dubay"], ["Шарджа", "Shorja"]] },
  { id: "thai", name: ["Таиланд", "Tailand"], photo: "d-thai", fly: ["около 7 ч", "taxminan 7 soat"], resorts: [["Пхукет", "Puket"], ["Паттайя", "Pattayya"]] },
  { id: "vietnam", name: ["Вьетнам", "Vyetnam"], photo: "d-vietnam", fly: ["около 6,5 ч", "taxminan 6,5 soat"], resorts: [["Нячанг", "Nyachang"], ["Фукуок", "Fukuok"]] },
  { id: "bali", name: ["Индонезия, Бали", "Indoneziya, Bali"], photo: "d-bali", fly: ["около 11 ч с пересадкой", "taxminan 11 soat, transfer bilan"], resorts: [["Убуд", "Ubud"], ["Нуса-Дуа", "Nusa-Dua"]] },
  { id: "greece", name: ["Греция", "Gretsiya"], photo: "d-greece", fly: ["около 6 ч с пересадкой", "taxminan 6 soat, transfer bilan"], resorts: [["Санторини", "Santorini"], ["Крит", "Krit"]] },
  { id: "maldives", name: ["Мальдивы", "Maldiv orollari"], photo: "d-maldives", fly: ["около 5 ч", "taxminan 5 soat"], resorts: [["Северный Мале", "Shimoliy Male"]] },
];

/* Питание: коды, как их пишут туроператоры. */
export const MEAL = {
  RO: ["Без питания", "Ovqatsiz"],
  BB: ["Завтраки", "Nonushta"],
  HB: ["Завтрак и ужин", "Nonushta va kechki ovqat"],
  AI: ["Всё включено", "Hammasi kiritilgan"],
  UAI: ["Ультра всё включено", "Ultra hammasi kiritilgan"],
};

/*
 * Демо-туроператоры. Названия придуманы: настоящие операторы и их цены
 * приходят из Турвизора, когда агентство даст доступ.
 */
export const OPS = [
  { id: "alfa", name: "Alfa Tour", air: "Air Alfa" },
  { id: "bravo", name: "Bravo Travel", air: "Bravo Air" },
  { id: "charlie", name: "Charlie Holidays", air: "CH Charter" },
  { id: "delta", name: "Delta Tours", air: "Delta Sky" },
  { id: "echo", name: "Echo Travel", air: "Echo Wings" },
];

/*
 * Демо-отели. base — цена за одного взрослого за ночь с перелётом, $;
 * ops — у каких операторов есть и с какой поправкой к цене, %.
 * Названия придуманы, фото — Unsplash (SOURCES.md).
 */
export const HOTELS = [
  {
    id: "lara", dest: "turkey", resort: 0, name: "Lara Sun Garden", stars: 5, rating: 4.7, reviews: 1284, meal: "UAI", base: 96, hot: false,
    photos: ["h-lara-0", "h-lara-1", "h-lara-2"], beach: ["1-я линия, песок", "1-qator, qum"], room: ["Standard, вид на сад", "Standard, bog‘ manzarasi"],
    feats: [["Аквапарк", "Akvapark"], ["Детский клуб", "Bolalar klubi"], ["Wi-Fi", "Wi-Fi"], ["Подогреваемый бассейн", "Isitiladigan hovuz"]],
    ops: { alfa: 3, bravo: 0, charlie: 6, delta: -2, echo: 4 },
  },
  {
    id: "kemer", dest: "turkey", resort: 1, name: "Kemer Pine Hill", stars: 4, rating: 4.4, reviews: 642, meal: "AI", base: 61, hot: true,
    photos: ["h-kemer-0", "h-kemer-1", "h-kemer-2"], beach: ["2-я линия, галька", "2-qator, mayda tosh"], room: ["Standard", "Standard"],
    feats: [["Горы рядом", "Tog‘lar yaqin"], ["Бассейн", "Hovuz"], ["Wi-Fi", "Wi-Fi"]],
    ops: { alfa: 0, charlie: -4, delta: 5 },
  },
  {
    id: "sharm", dest: "egypt", resort: 0, name: "Red Sea Palm Bay", stars: 5, rating: 4.6, reviews: 935, meal: "AI", base: 78, hot: true,
    photos: ["h-sharm-0", "h-sharm-1", "h-sharm-2"], beach: ["1-я линия, коралловый риф", "1-qator, marjon rif"], room: ["Superior, вид на бассейн", "Superior, hovuz manzarasi"],
    feats: [["Риф для снорклинга", "Snorkling uchun rif"], ["Дайвинг-центр", "Dayving markazi"], ["Детский клуб", "Bolalar klubi"]],
    ops: { alfa: 2, bravo: -3, echo: 0, delta: 7 },
  },
  {
    id: "dubai", dest: "uae", resort: 0, name: "Marina Night Hotel", stars: 4, rating: 4.5, reviews: 2103, meal: "BB", base: 74, hot: false,
    photos: ["h-dubai-0", "h-dubai-1", "d-uae"], beach: ["пляж 600 м, бесплатный трансфер", "plyaj 600 m, bepul transfer"], room: ["Deluxe, вид на город", "Deluxe, shahar manzarasi"],
    feats: [["Бассейн на крыше", "Tomdagi hovuz"], ["Метро рядом", "Metro yaqin"], ["Wi-Fi", "Wi-Fi"]],
    ops: { bravo: 0, charlie: 3, echo: -2 },
  },
  {
    id: "phuket", dest: "thai", resort: 0, name: "Andaman Green Resort", stars: 4, rating: 4.5, reviews: 517, meal: "BB", base: 82, hot: false,
    photos: ["h-phuket-0", "h-phuket-1", "d-thai"], beach: ["1-я линия, песок", "1-qator, qum"], room: ["Deluxe, вид на бассейн", "Deluxe, hovuz manzarasi"],
    feats: [["Бассейн в саду", "Bog‘dagi hovuz"], ["Спа", "Spa"], ["Wi-Fi", "Wi-Fi"]],
    ops: { alfa: 0, delta: -3, echo: 2 },
  },
  {
    id: "nha", dest: "vietnam", resort: 0, name: "Nha Trang Bay Tower", stars: 4, rating: 4.3, reviews: 388, meal: "BB", base: 64, hot: true,
    photos: ["h-nha-0", "h-nha-1", "d-vietnam"], beach: ["через дорогу, песок", "yo‘l narigi tomonida, qum"], room: ["Superior, вид на море", "Superior, dengiz manzarasi"],
    feats: [["Бассейн на крыше", "Tomdagi hovuz"], ["Набережная", "Sohil bo‘yi"], ["Wi-Fi", "Wi-Fi"]],
    ops: { bravo: 0, charlie: -2, delta: 4 },
  },
  {
    id: "ubud", dest: "bali", resort: 0, name: "Ubud Rice Terrace Villas", stars: 4, rating: 4.6, reviews: 702, meal: "BB", base: 92, hot: false,
    photos: ["h-ubud-0", "h-ubud-1", "d-bali"], beach: ["у рисовых террас, пляж 40 мин", "sholi terrasalari yonida, plyaj 40 daqiqa"], room: ["Вилла с бассейном", "Hovuzli villa"],
    feats: [["Свой бассейн", "Shaxsiy hovuz"], ["Йога", "Yoga"], ["Wi-Fi", "Wi-Fi"]],
    ops: { alfa: 0, charlie: -3, echo: 2 },
  },
  {
    id: "santo", dest: "greece", resort: 0, name: "Caldera White Suites", stars: 4, rating: 4.8, reviews: 455, meal: "BB", base: 104, hot: false,
    photos: ["d-greece", "h-kemer-1", "h-lara-2"], beach: ["вид на кальдеру, пляж 15 мин", "kaldera manzarasi, plyaj 15 daqiqa"], room: ["Сьют с видом на море", "Dengiz manzarali syuit"],
    feats: [["Вид на закат", "Quyosh botishi manzarasi"], ["Бассейн", "Hovuz"], ["Wi-Fi", "Wi-Fi"]],
    ops: { bravo: 0, delta: 3 },
  },
  {
    id: "male", dest: "maldives", resort: 0, name: "Lagoon Water Villas", stars: 5, rating: 4.9, reviews: 211, meal: "HB", base: 248, hot: false,
    photos: ["h-male-0", "h-male-1", "d-maldives"], beach: ["своя лагуна, песок", "o‘z laguna, qum"], room: ["Вилла над водой", "Suv ustidagi villa"],
    feats: [["Вилла над водой", "Suv ustidagi villa"], ["Трансфер гидросамолётом", "Gidrosamolyot transferi"], ["Снорклинг", "Snorkling"]],
    ops: { alfa: 0, echo: -2 },
  },
];

/* Демо-даты вылета: ноябрь 2026, из Ташкента. Время рейсов придумано. */
export const DATES = { year: 2026, month: 10, from: 3, to: 12, nightsFrom: 7, nightsTo: 9 };
export const FLY = {
  turkey: { code: "AYT", out: ["06:40", "10:05"], back: ["11:20", "18:10"] },
  egypt: { code: "SSH", out: ["05:30", "09:15"], back: ["10:40", "18:30"] },
  uae: { code: "DXB", out: ["08:10", "10:40"], back: ["12:30", "17:05"] },
  thai: { code: "HKT", out: ["22:30", "08:20"], back: ["10:15", "15:40"] },
  vietnam: { code: "CXR", out: ["23:10", "07:50"], back: ["09:30", "14:20"] },
  bali: { code: "DPS", out: ["21:40", "16:55"], back: ["18:20", "06:10"] },
  greece: { code: "JTR", out: ["07:15", "13:40"], back: ["14:30", "23:55"] },
  maldives: { code: "MLE", out: ["07:00", "10:30"], back: ["12:10", "17:40"] },
};

/*
 * Готовая бронь в «Моих поездках»: на ней видно ленту статусов и документы
 * сразу, без прохода всей брони. Номер сделки, имена и паспорта придуманы.
 */
export const DEMO_TRIP = { hotel: "sharm", op: "bravo", date: 9, nights: 7, adults: 2, kids: [], step: 4, deal: "D-20418", names: ["ALIYEV AZIZ", "ALIYEVA MADINA"] };
