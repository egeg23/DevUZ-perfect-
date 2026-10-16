// Данные макета приложения Dilrabo Travel. Названия туров, маршруты, что
// входит, города и машины взяты с их сайта dilrabotravel.com (16.10.2026).
// Цены туров, даты выездов и время поездов, кроме указанных на их сайте, —
// ДЕМО: на сайте цен на туры нет, только рамка «от 200 $ до 800 $». На каждом
// экране это сказано. Подписи парами [ru, uz].

/*
 * Агентство — Dilrabo Travel, Фергана (СП «Дилрабо Травел»). Логотип — их
 * восьмиконечная звезда из favicon.svg их сайта (вектор, logo.inc), цвета —
 * из него же: тёмно-синий #131643, коралловый #d66f5b, мятный #c3e3d4,
 * сиреневый #a690b6. Шрифт их сайта — Tilda Sans (лицензия OFL), файлы лежат
 * в public/protos/dilrabo.
 */
export const BRAND = {
  name: "Dilrabo Travel",
  tag: ["туры по Узбекистану", "O‘zbekiston bo‘ylab turlar"],
  domain: "dilrabotravel.com",
  phone: "+998 55 807 00 87",
  phoneHref: "+998558070087",
  wa: "https://wa.me/998992330087",
  tg: "https://t.me/+998558070087",
  mail: "info@dilrabotravel.uz",
  addr: ["Фергана, ул. Фаробий, 23V", "Farg‘ona, Forobiy ko‘chasi, 23V"],
  hours: ["ежедневно с 08:00 до 23:00", "har kuni 08:00 dan 23:00 gacha"],
};

/* Направления — их раздел «Направления». how: как туда попадают в их программах. */
export const DEST = [
  { id: "samarkand", name: ["Самарканд", "Samarqand"], photo: "d-samarkand", fly: ["из Ташкента 2 ч 10 мин на «Афросиабе»", "Toshkentdan «Afrosiyob»da 2 soat 10 daqiqa"], resorts: [["Регистан", "Registon"], ["Шахи-Зинда", "Shohi Zinda"], ["Гур-Эмир", "Go‘ri Amir"]] },
  { id: "bukhara", name: ["Бухара", "Buxoro"], photo: "d-bukhara", fly: ["из Самарканда 1,5 ч поездом", "Samarqanddan poyezdda 1,5 soat"], resorts: [["Ляби-Хауз", "Labi Hovuz"], ["Арк", "Ark"], ["Пои-Калян", "Poyi Kalon"]] },
  { id: "khiva", name: ["Хива", "Xiva"], photo: "d-khiva", fly: ["перелёт Ташкент → Ургенч", "Toshkent → Urganch parvozi"], resorts: [["Ичан-Кала", "Ichan Qal’a"]] },
  { id: "tashkent", name: ["Ташкент", "Toshkent"], photo: "d-tashkent", fly: ["встреча в аэропорту", "aeroportda kutib olish"], resorts: [["Хаст-Имам", "Hazrati Imom"], ["Чорсу", "Chorsu"], ["Амирсай", "Amirsoy"]] },
  { id: "fergana", name: ["Фергана", "Farg‘ona"], photo: "d-fergana", fly: ["наш офис в Фергане", "ofisimiz Farg‘onada"], resorts: [["Маргилан", "Marg‘ilon"], ["Риштан", "Rishton"], ["Коканд", "Qo‘qon"]] },
  { id: "asia", name: ["Центральная Азия", "Markaziy Osiyo"], photo: "d-asia", fly: ["Узбекистан, Таджикистан, Кыргызстан", "O‘zbekiston, Tojikiston, Qirg‘iziston"], resorts: [["три страны", "uch davlat"]] },
];

/* Питание — как написано в их программах. */
export const MEAL = {
  BB: ["Завтраки", "Nonushta"],
  HB: ["Завтраки и ужины", "Nonushta va kechki ovqat"],
  FB: ["Питание по программе", "Dastur bo‘yicha ovqat"],
};

/*
 * Как поехать: в группе или своей машиной с гидом. Машины и цены за день —
 * из их раздела «Сервисы», «Наш автопарк». add — $ в день за машину.
 */
export const OPS = [
  { id: "grp", name: ["В группе", "Guruhda"], add: 0, car: ["автобус группы", "guruh avtobusi"] },
  { id: "gentra", name: ["Своя машина: Chevrolet Gentra, до 4", "O‘z mashinangiz: Chevrolet Gentra, 4 kishigacha"], add: 50, car: ["Chevrolet Gentra", "Chevrolet Gentra"] },
  { id: "h1", name: ["Своя машина: Hyundai H1, до 7", "O‘z mashinangiz: Hyundai H1, 7 kishigacha"], add: 100, car: ["Hyundai H1", "Hyundai H1"] },
  { id: "staria", name: ["Своя машина: Hyundai Staria, до 7", "O‘z mashinangiz: Hyundai Staria, 7 kishigacha"], add: 120, car: ["Hyundai Staria", "Hyundai Staria"] },
];

/*
 * Их туры. nights — сколько ночей в программе (дни = ночи + 1); dur — если
 * экскурсия на часы. base — ДЕМО-цена за взрослого в день, $; ops — поправка
 * к цене за формат, % (в группе дешевле). Рейтинг 4,9 — их средняя оценка из
 * раздела «О компании», одна на все туры. route, room, feats — с их страниц.
 * legs — переезды: туда и обратно (время «Афросиаба» — из их программ, где
 * оно названо; остальное демо).
 */
export const HOTELS = [
  {
    id: "charm", dest: "khiva", name: ["Очарование Узбекистана", "O‘zbekiston jozibasi"], nights: 7, stars: 4, rating: 4.9, meal: "FB", base: 98, hot: true,
    photos: ["t-charm-0", "t-charm-1", "t-charm-2"],
    route: ["Ташкент · Хива · Бухара · Самарканд", "Toshkent · Xiva · Buxoro · Samarqand"],
    room: ["Отели, 7 ночей", "Mehmonxonalar, 7 kecha"],
    feats: [["Ичан-Кала", "Ichan Qal’a"], ["Пустыня Кызылкум", "Qizilqum cho‘li"], ["Регистан", "Registon"], ["Страховка", "Sug‘urta"]],
    legs: { out: ["plane", ["Ташкент", "Toshkent"], ["Ургенч", "Urganch"], ["07:10", "08:50"]], back: ["train", ["Самарканд", "Samarqand"], ["Ташкент", "Toshkent"], ["17:00", "19:10"]] },
    ops: { grp: -18, gentra: 0, h1: 0, staria: 0 },
    prog: [["Прибытие в Ташкент, встреча в аэропорту", "Toshkentga kelish, aeroportda kutib olish"], ["Ташкент, перелёт в Ургенч, Хива", "Toshkent, Urganchga parvoz, Xiva"], ["Хива: Ичан-Кала целый день", "Xiva: kun bo‘yi Ichan Qal’a"], ["Через пустыню Кызылкум в Бухару", "Qizilqum cho‘li orqali Buxoroga"], ["Бухара: Самани, Мири-Араб, Ляби-Хауз", "Buxoro: Somoniylar, Mir Arab, Labi Hovuz"], ["Бухара → Самарканд, Регистан, Гур-Эмир", "Buxoro → Samarqand, Registon, Go‘ri Amir"], ["Самарканд, вечером поезд в Ташкент", "Samarqand, kechqurun Toshkentga poyezd"], ["Трансфер в аэропорт", "Aeroportga transfer"]],
  },
  {
    id: "train", dest: "bukhara", name: ["Поездное путешествие по Узбекистану", "O‘zbekiston bo‘ylab poyezd sayohati"], nights: 8, stars: 3, rating: 4.9, meal: "HB", base: 84, hot: false,
    photos: ["t-train-0", "t-train-1", "t-train-2"],
    route: ["Ташкент · Коканд · Маргилан · Самарканд · Бухара", "Toshkent · Qo‘qon · Marg‘ilon · Samarqand · Buxoro"],
    room: ["Отели и гестхаусы, 8 ночей", "Mehmonxona va mehmon uylari, 8 kecha"],
    feats: [["Шёлк «Ёдгорлик»", "«Yodgorlik» ipagi"], ["Риштанская керамика", "Rishton kulolchiligi"], ["Регистан", "Registon"], ["Пои-Калян", "Poyi Kalon"]],
    legs: { out: ["train", ["Ташкент", "Toshkent"], ["Самарканд", "Samarqand"], ["08:30", "10:49"]], back: ["train", ["Бухара", "Buxoro"], ["Ташкент", "Toshkent"], ["15:30", "19:20"]] },
    ops: { grp: -18, gentra: 0, h1: 0, staria: 0 },
    prog: [["Прибытие в Ташкент, обзорная экскурсия", "Toshkentga kelish, sayohat ekskursiyasi"], ["Коканд и Маргилан", "Qo‘qon va Marg‘ilon"], ["Маргилан, Риштан, возвращение в Ташкент", "Marg‘ilon, Rishton, Toshkentga qaytish"], ["Поездом в Самарканд", "Poyezdda Samarqandga"], ["Самарканд: день экскурсий", "Samarqand: ekskursiyalar kuni"], ["Поездом в Бухару", "Poyezdda Buxoroga"], ["Бухара: Пои-Калян, Арк, Ляби-Хауз", "Buxoro: Poyi Kalon, Ark, Labi Hovuz"], ["Поездом в Ташкент", "Poyezdda Toshkentga"], ["Трансфер в аэропорт", "Aeroportga transfer"]],
  },
  {
    id: "express", dest: "samarkand", name: ["Интенсив: Самарканд и Бухара", "Intensiv: Samarqand va Buxoro"], nights: 1, stars: 3, rating: 4.9, meal: "HB", base: 120, hot: true,
    photos: ["t-express-0", "t-express-1", "t-express-2"],
    route: ["Ташкент · Самарканд · Бухара", "Toshkent · Samarqand · Buxoro"],
    room: ["Отель в Бухаре, 1 ночь", "Buxorodagi mehmonxona, 1 kecha"],
    feats: [["«Афросиаб»", "«Afrosiyob»"], ["Регистан", "Registon"], ["Шахи-Зинда", "Shohi Zinda"], ["Ляби-Хауз", "Labi Hovuz"]],
    legs: { out: ["train", ["Ташкент", "Toshkent"], ["Самарканд", "Samarqand"], ["07:30", "09:43"]], back: ["plane", ["Бухара", "Buxoro"], ["Ташкент", "Toshkent"], ["20:10", "21:20"]] },
    ops: { grp: -15, gentra: 0, h1: 0, staria: 0 },
    prog: [["Ташкент → Самарканд на «Афросиабе», вечером поезд в Бухару", "Toshkent → Samarqand «Afrosiyob»da, kechqurun Buxoroga poyezd"], ["Бухара: старый город, вечером перелёт в Ташкент", "Buxoro: eski shahar, kechqurun Toshkentga parvoz"]],
  },
  {
    id: "ziarah", dest: "samarkand", name: ["Uzbekistan Ziarah", "Uzbekistan Ziarah"], nights: 7, stars: 4, rating: 4.9, meal: "FB", base: 92, hot: false,
    photos: ["t-ziarah-0", "t-ziarah-1", "t-ziarah-2"],
    route: ["Ташкент · Самарканд · Бухара · Амирсай", "Toshkent · Samarqand · Buxoro · Amirsoy"],
    room: ["Отели, 7 ночей", "Mehmonxonalar, 7 kecha"],
    feats: [["Комплекс Имама аль-Бухари", "Imom al-Buxoriy majmuasi"], ["Халяль-рестораны", "Halol restoranlar"], ["Время для намаза", "Namoz uchun vaqt"], ["Амирсай", "Amirsoy"]],
    legs: { out: ["train", ["Ташкент", "Toshkent"], ["Самарканд", "Samarqand"], ["08:30", "10:49"]], back: ["train", ["Бухара", "Buxoro"], ["Ташкент", "Toshkent"], ["15:30", "19:20"]] },
    ops: { grp: -15, gentra: 0, h1: 0, staria: 0 },
    prog: [["Прибытие в Ташкент, ужин в халяль-ресторане", "Toshkentga kelish, halol restoranda kechki ovqat"], ["Поездом в Самарканд, комплекс Имама аль-Бухари", "Poyezdda Samarqandga, Imom al-Buxoriy majmuasi"], ["Самарканд: Регистан, Шахи-Зинда", "Samarqand: Registon, Shohi Zinda"], ["Бухара", "Buxoro"], ["Бухара: зияраты", "Buxoro: ziyoratlar"], ["Возвращение в Ташкент", "Toshkentga qaytish"], ["Амирсай: канатная дорога", "Amirsoy: osma yo‘l"], ["Ташкент: комплекс Хаст-Имам, вылет", "Toshkent: Hazrati Imom majmuasi, uchish"]],
  },
  {
    id: "ziarahf", dest: "fergana", name: ["Uzbekistan Ziarah + Фергана", "Uzbekistan Ziarah + Farg‘ona"], nights: 9, stars: 4, rating: 4.9, meal: "FB", base: 90, hot: false,
    photos: ["t-ziarahf-0", "t-ziarahf-1", "t-ziarahf-2"],
    route: ["Ташкент · Самарканд · Бухара · Амирсай · Фергана", "Toshkent · Samarqand · Buxoro · Amirsoy · Farg‘ona"],
    room: ["Отели, 9 ночей", "Mehmonxonalar, 9 kecha"],
    feats: [["Комплекс Имама аль-Бухари", "Imom al-Buxoriy majmuasi"], ["Ферганская долина", "Farg‘ona vodiysi"], ["Халяль-рестораны", "Halol restoranlar"], ["Амирсай", "Amirsoy"]],
    legs: { out: ["train", ["Ташкент", "Toshkent"], ["Самарканд", "Samarqand"], ["08:30", "10:49"]], back: ["car", ["Наманган", "Namangan"], ["Ташкент", "Toshkent"], ["15:00", "20:00"]] },
    ops: { grp: -15, gentra: 0, h1: 0, staria: 0 },
    prog: [["Прибытие в Ташкент", "Toshkentga kelish"], ["Самарканд: Имам аль-Бухари", "Samarqand: Imom al-Buxoriy"], ["Самарканд: Регистан", "Samarqand: Registon"], ["Бухара", "Buxoro"], ["Бухара: зияраты", "Buxoro: ziyoratlar"], ["Ташкент", "Toshkent"], ["Амирсай", "Amirsoy"], ["Ташкент → Ферганская долина", "Toshkent → Farg‘ona vodiysi"], ["Фергана → Наманган → Ташкент", "Farg‘ona → Namangan → Toshkent"], ["Ташкент, вылет", "Toshkent, uchish"]],
  },
  {
    id: "umra", dest: "tashkent", name: ["Умра Плюс Узбекистан", "Umra Plyus O‘zbekiston"], nights: 3, stars: 4, rating: 4.9, meal: "FB", base: 110, hot: true,
    photos: ["t-umra-0", "t-umra-1", "t-umra-2"],
    route: ["Ташкент · Самарканд · Амирсай", "Toshkent · Samarqand · Amirsoy"],
    room: ["Отель в Ташкенте, 3 ночи", "Toshkentdagi mehmonxona, 3 kecha"],
    feats: [["Джума-намаз у Имама аль-Бухари", "Imom al-Buxoriyda juma namozi"], ["«Афросиаб»", "«Afrosiyob»"], ["Амирсай", "Amirsoy"], ["Халяль-рестораны", "Halol restoranlar"]],
    legs: { out: ["train", ["Ташкент", "Toshkent"], ["Самарканд", "Samarqand"], ["07:30", "09:43"]], back: ["train", ["Самарканд", "Samarqand"], ["Ташкент", "Toshkent"], ["20:01", "22:16"]] },
    ops: { grp: -15, gentra: 0, h1: 0, staria: 0 },
    prog: [["Прибытие, ужин в халяль-ресторане, Tashkent City", "Kelish, halol restoranda kechki ovqat, Tashkent City"], ["Самарканд: джума-намаз у Имама аль-Бухари, Регистан", "Samarqand: Imom al-Buxoriyda juma namozi, Registon"], ["Амирсай: канатная дорога и оленья ферма", "Amirsoy: osma yo‘l va bug‘u fermasi"], ["Завтрак, трансфер в аэропорт", "Nonushta, aeroportga transfer"]],
  },
  {
    id: "gold", dest: "asia", name: ["Золотой треугольник: Узбекистан, Таджикистан, Кыргызстан", "Oltin uchburchak: O‘zbekiston, Tojikiston, Qirg‘iziston"], nights: 7, stars: 3, rating: 4.9, meal: "HB", base: 95, hot: false,
    photos: ["t-gold-0", "t-gold-1", "t-gold-2"],
    route: ["Коканд · Худжанд · Фергана · Ош", "Qo‘qon · Xo‘jand · Farg‘ona · O‘sh"],
    room: ["Отели и гостевые дома", "Mehmonxona va mehmon uylari"],
    feats: [["Три страны", "Uch davlat"], ["Риштанская керамика", "Rishton kulolchiligi"], ["Гостевые дома", "Mehmon uylari"], ["Горы у Оша", "O‘sh yonidagi tog‘lar"]],
    legs: { out: ["car", ["Аэропорт Ферганы", "Farg‘ona aeroporti"], ["Коканд", "Qo‘qon"], ["10:00", "11:30"]], back: ["car", ["Ош", "O‘sh"], ["Аэропорт Оша", "O‘sh aeroporti"], ["12:00", "12:30"]] },
    ops: { grp: -18, gentra: 0, h1: 0, staria: 0 },
    prog: [["Прибытие в Фергану, трансфер в Коканд", "Farg‘onaga kelish, Qo‘qonga transfer"], ["Коканд и керамика Риштана", "Qo‘qon va Rishton kulolchiligi"], ["Коканд → Худжанд (Таджикистан)", "Qo‘qon → Xo‘jand (Tojikiston)"], ["Худжанд: обзорная экскурсия", "Xo‘jand: sayohat ekskursiyasi"], ["Худжанд → Маргилан → Фергана", "Xo‘jand → Marg‘ilon → Farg‘ona"], ["Фергана → Ош (Кыргызстан)", "Farg‘ona → O‘sh (Qirg‘iziston)"], ["Ош: горная экскурсия", "O‘sh: tog‘ ekskursiyasi"], ["Ош: отъезд", "O‘sh: jo‘nab ketish"]],
  },
  {
    id: "fergana", dest: "fergana", name: ["Сокровища Ферганы: Маргилан, Риштан, Коканд", "Farg‘ona xazinalari: Marg‘ilon, Rishton, Qo‘qon"], nights: 0, stars: 0, rating: 4.9, meal: "FB", base: 85, hot: true,
    photos: ["t-fergana-0", "t-fergana-1", "t-fergana-2"],
    route: ["Маргилан · Риштан · Коканд", "Marg‘ilon · Rishton · Qo‘qon"],
    room: ["Без ночёвки", "Tunab qolishsiz"],
    feats: [["Шёлковая фабрика", "Ipak fabrikasi"], ["Керамика своими руками", "O‘z qo‘lingiz bilan kulolchilik"], ["Дворец Худоярхана", "Xudoyorxon saroyi"]],
    legs: { out: ["car", ["Фергана", "Farg‘ona"], ["Маргилан", "Marg‘ilon"], ["09:00", "09:30"]], back: ["car", ["Коканд", "Qo‘qon"], ["Фергана", "Farg‘ona"], ["17:30", "19:00"]] },
    ops: { grp: -15, gentra: 0, h1: 0, staria: 0 },
    prog: [["Маргилан: шёлк, Риштан: керамика, Коканд: дворец Худоярхана", "Marg‘ilon: ipak, Rishton: kulolchilik, Qo‘qon: Xudoyorxon saroyi"]],
  },
  {
    id: "horses", dest: "fergana", name: ["Фергана: Valley Horses и прогулка на лошадях", "Farg‘ona: Valley Horses va otda sayr"], nights: 0, dur: ["2 часа", "2 soat"], stars: 0, rating: 4.9, meal: "BB", base: 40, hot: false,
    photos: ["t-horses-0", "t-horses-1", "t-horses-2"],
    route: ["Конный комплекс Valley Horses", "Valley Horses ot majmuasi"],
    room: ["Без ночёвки", "Tunab qolishsiz"],
    feats: [["«Небесные кони»", "«Samoviy otlar»"], ["Прогулка верхом", "Otda sayr"], ["Входные билеты", "Kirish chiptalari"]],
    legs: { out: ["car", ["Фергана", "Farg‘ona"], ["Valley Horses", "Valley Horses"], ["10:00", "10:30"]], back: ["car", ["Valley Horses", "Valley Horses"], ["Фергана", "Farg‘ona"], ["12:30", "13:00"]] },
    ops: { grp: -10, gentra: 0, h1: 0, staria: 0 },
    prog: [["Экскурсия по комплексу, история ферганских лошадей, прогулка верхом", "Majmua bo‘ylab ekskursiya, Farg‘ona otlari tarixi, otda sayr"]],
  },
];

/* Демо-даты выездов: ноябрь 2026. */
export const DATES = { year: 2026, month: 10, from: 3, to: 12, nightsFrom: 1, nightsTo: 10 };
/* Коды на «посадочных талонах» горящих выездов: аэропорт города. */
export const FLY = { samarkand: { code: "SKD" }, bukhara: { code: "BHK" }, khiva: { code: "UGC" }, tashkent: { code: "TAS" }, fergana: { code: "FEG" }, asia: { code: "OSS" } };

/*
 * Готовая бронь в «Моих поездках»: на ней видно ленту статусов и документы
 * сразу. Номер сделки, имена и паспорта придуманы.
 */
export const DEMO_TRIP = { hotel: "charm", op: "grp", date: 9, nights: 7, adults: 2, kids: [], step: 4, deal: "D-20418", names: ["IVANOV SERGEY", "IVANOVA ANNA"] };
