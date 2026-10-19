// Факты для макета Baldinini Tashkent. Всё о бренде и товарах — с официального
// магазина бренда baldinini-shop.com (на него ведёт baldinini.it), сезон
// FW26/27, проверено 19.10.2026; бутик — со страницы Tashkent City Mall
// (tcmall.uz/ru/shops/baldinini). Исследование — docs/research/baldinini.md.
//
// Цены в Ташкенте нигде не опубликованы, поэтому цены макета — демо: цена в
// евро на официальном сайте × 14 500 сум, округлено до 10 000 (у двух сумок
// евро нет: рубли RU-витрины ÷ 108). Остатки по размерам — тоже демо.

export const BRAND = {
  name: "Baldinini",
  ig: "baldininitashkent",
  site: "baldinini-shop.com",
};

/** Бутик: tcmall.uz, страница бутика и её CMS (этаж 1, категория «Обувь»). */
export const BOUTIQUE = {
  hours: ["10:00-23:00", "10:00-00:00"],
  name: ["Baldinini, Tashkent City Mall", "Baldinini, Tashkent City Mall", "Baldinini, Tashkent City Mall"],
  short: ["Tashkent City Mall, 1 этаж", "Tashkent City Mall, 1-qavat", "Tashkent City Mall, floor 1"],
  addr: ["Tashkent City Mall, 1 этаж, ул. Ботира Закирова", "Tashkent City Mall, 1-qavat, Botir Zokirov ko‘chasi", "Tashkent City Mall, floor 1, Botir Zokirov street"],
};

/** Знак: их вектор из шапки baldinini-shop.com, viewBox 0 0 153 30. */
export const LOGO = [
  ["m50.9 7v12.9h15.6v2.1h-16.5v-15z"],
  ["m22.6 14.2c2 0.6 3.3 2 3.3 3.8 0 2.3-2 4-4.6 4h-14.4v-7.3h-6.9v-0.8h6.9v-6.9h13.8c2.6 0 4.6 1.6 4.6 3.8 0 1.5-1 2.7-2.7 3.4m-14.8-0.3h12c2 0 3.2-1.1 3.2-3 0-1.9-1.1-3.1-2.9-3.1h-12.3zm13 7.3c1.7 0 2.9-1.3 2.9-3.2 0-2.5-1.7-3.4-3.2-3.4h-12.7v6.6h13z", 1],
  ["m93 7h0.8v15h-0.8z"],
  ["m122.6 7h0.8v15h-0.8z"],
  ["m152.2 7h0.8v15h-0.8z"],
  ["m89.1 14.5c0 4.3-3.5 7.5-8 7.5h-11.1v-15h11.1c4.5 0 8 3.2 8 7.5zm-2.3 0c0-2-0.6-3.7-1.6-4.9-1.1-1.2-2.6-1.8-4.4-1.8h-9.9v13.4h9.9c1.8 0 3.3-0.6 4.4-1.8 1-1.2 1.6-2.9 1.6-4.9z", 1],
  ["m46.9 22h-2.3l-2.5-4.3h-10.6l-2.8 4.3h-0.8l9.5-15h0.8zm-9.8-13.4l-5.1 8.3h9.7z", 1],
  ["m117.7 22h-1.4l-16.8-12.3v12.3h-0.8v-15h1.4l16.8 12.3v-12.3h0.8z"],
  ["m147.3 22h-1.4l-16.8-12.3v12.3h-0.8v-15h1.4l16.8 12.3v-12.3h0.8z"],
];

/** Цвета бренда — из CSS baldinini-shop.com (docs/research/baldinini.md, «Цвета»). */
export const COLORS = {
  ink: "#000000", // логотип, кнопки
  paper: "#ffffff", // фон страницы
  text: "#212121", // rgba(0,0,0,.87), основной текст
  mute: "#858585", // подписи, ссылки футера
  mist: "#f8f8f8", // светлый блок
  sand: "#d8aa8a", // подчёркивание ссылок на баннерах кампании
};

export const CATS = [
  { id: "new", n: ["Новый сезон", "Yangi mavsum", "New season"] },
  { id: "w", n: ["Женское", "Ayollar", "Women"], tile: "p-d7b220-bene-0-600.webp" },
  { id: "m", n: ["Мужское", "Erkaklar", "Men"], tile: "p-u6b010-0000-0-600.webp" },
  { id: "bag", n: ["Сумки", "Sumkalar", "Bags"], tile: "p-b6e905-4060-0-600.webp" },
  { id: "acc", n: ["Аксессуары", "Aksessuarlar", "Accessories"] },
  { id: "all", n: ["Все модели", "Barcha modellar", "All models"] },
];

export const COLOR_F = [
  { id: "black", hex: "#000000", n: ["Чёрный", "Qora", "Black"] },
  { id: "brown", hex: "#6b4330", n: ["Коричневый", "Jigarrang", "Brown"] },
  { id: "beige", hex: "#e6d8c3", n: ["Бежевый и молочный", "Bej va sutrang", "Beige and milk"] },
  { id: "burgundy", hex: "#6e1f2f", n: ["Бордо", "Bordo", "Burgundy"] },
  { id: "blue", hex: "#1f3350", n: ["Синий", "Ko‘k", "Blue"] },
  { id: "print", hex: "linear-gradient(90deg,#1b1b1b 0 25%,#c9a06a 25% 50%,#1b1b1b 50% 75%,#c9a06a 75%)", n: ["Принт", "Naqsh", "Print"] },
  { id: "metal", hex: "linear-gradient(135deg,#d8c08a,#f2f0ea)", n: ["Золото и серебро", "Oltin va kumush", "Gold and silver"] },
];

export const MATS = [
  { id: "leather", n: ["Гладкая кожа", "Silliq teri", "Smooth leather"] },
  { id: "suede", n: ["Замша", "Zamsh", "Suede"] },
  { id: "tumbled", n: ["Зернистая кожа", "Donador teri", "Tumbled leather"] },
  { id: "calfhair", n: ["Ворсовая кожа", "Tukli teri", "Calf hair"] },
  { id: "lizard", n: ["Тиснение под ящерицу", "Kaltakesak bo‘rtmasi", "Lizard print"] },
];

/* Подкладка, подошва, носок — как в карточках бренда. */
const LINING = {
  leather: ["кожа", "teri", "leather"],
  sheep: ["овчина", "qo‘y terisi", "shearling"],
  faux: ["искусственная кожа", "sun’iy teri", "faux leather"],
  textile: ["фирменный текстиль", "brend matosi", "branded textile"],
  mixed: ["кожа и ткань", "teri va mato", "leather and fabric"],
};
const SOLE = { rl: ["резина и кожа", "rezina va teri", "rubber and leather"], r: ["резина", "rezina", "rubber"] };
const TOE = { point: ["острый", "uchli", "pointed"], round: ["круглый", "dumaloq", "round"] };
const LINES = {
  fw: ["Осень-зима 2026/27", "Kuz-qish 2026/27", "Fall-winter 2026/27"],
  ss27: ["Весна-лето 2027", "Bahor-yoz 2027", "Spring-summer 2027"],
  ss26: ["Весна-лето 2026", "Bahor-yoz 2026", "Spring-summer 2026"],
};

/*
 * Товары: артикул, названия, цвет и материал — из карточек бренда. eur —
 * цена на итальянской витрине, rub — на российской (для двух сумок без
 * евро). heel — высота каблука в см (1 у бренда значит «без каблука»).
 * look — «соберите образ»: вещи того же цвета из этого же каталога.
 */
export const PRODUCTS = [
  { id: "d7b704-0000", art: "D7B704P6VITE0000", cat: "w", col: "black", mat: "leather", heel: 6, lin: "leather", sole: "rl", toe: "point", eur: 495, line: "fw", look: ["b6e905-0000", "h5bf02-0000"], pop: 9,
    n: ["Казаки из чёрной кожи", "Qora teridan kazaki", "Leather cowboy boot, black"], c: ["Чёрный", "Qora", "Black"] },
  { id: "d7b703-0000", art: "D7B703A5CAMO0000", cat: "w", col: "black", mat: "suede", heel: 5, lin: "sheep", sole: "rl", toe: "round", eur: 525, line: "fw", look: ["b7b805-0000", "q3b001-0000"], pop: 6,
    n: ["Ботильоны из чёрной замши", "Qora zamshdan botilonlar", "Black suede ankle boot"], c: ["Чёрный", "Qora", "Black"] },
  { id: "d7b719-0000", art: "D7B719P7VITE0000", cat: "w", col: "black", mat: "leather", heel: 7, lin: "leather", sole: "rl", toe: "point", eur: 595, line: "fw", look: ["b6e600-0000", "h5bf02-0000"], pop: 8,
    n: ["Ботильоны из чёрной кожи", "Qora teridan botilonlar", "Black leather ankle boot"], c: ["Чёрный", "Qora", "Black"] },
  { id: "d7b708-3080", art: "D7B708P1CROS3080", cat: "w", col: "brown", mat: "suede", heel: 1, lin: "leather", sole: "r", toe: "round", eur: 495, line: "fw", look: ["b7b800-3080"], pop: 5,
    n: ["Берцы из тёмно-коричневой замши", "To‘q jigarrang zamshdan botinkalar", "Dark brown suede combat boot"], c: ["Тёмно-коричневый", "To‘q jigarrang", "Dark brown"] },
  { id: "d7b120-0000", art: "D7B120P7CAMO0000", cat: "w", col: "black", mat: "suede", heel: 7, lin: "leather", sole: "rl", toe: "point", eur: 795, line: "fw", look: ["b7b805-0000"], pop: 5,
    n: ["Сапоги из чёрной замши", "Qora zamshdan etiklar", "Black suede boot"], c: ["Чёрный", "Qora", "Black"] },
  { id: "d7b122-0000", art: "D7B122P5VITE0000", cat: "w", col: "black", mat: "leather", heel: 5, lin: "leather", sole: "rl", toe: "round", eur: 695, line: "fw", look: ["b6e905-0000"], pop: 6,
    n: ["Сапоги из чёрной кожи", "Qora teridan etiklar", "Black leather boot"], c: ["Чёрный", "Qora", "Black"] },
  { id: "d7b200-0000", art: "D7B200P5VITE0000", cat: "w", col: "black", mat: "leather", heel: 5, lin: "leather", sole: "rl", toe: "point", eur: 345, line: "ss27", look: ["b6e600-0000", "q3b001-0000"], pop: 10,
    n: ["Лодочки из чёрной кожи", "Qora teridan tuflilar", "Pump in black leather"], c: ["Чёрный", "Qora", "Black"] },
  { id: "d7b203-7009", art: "D7B203P3CAMO7009", cat: "w", col: "burgundy", mat: "suede", heel: 3, lin: "leather", sole: "rl", toe: "round", eur: 345, line: "fw", look: ["b7b602-9022"], pop: 7,
    n: ["Лодочки из замши цвета бордо", "Bordo zamshdan tuflilar", "Burgundy suede pump"], c: ["Бордо", "Bordo", "Burgundy"] },
  { id: "d7b220-bene", art: "D7B220P9CVZBBENE", cat: "w", col: "print", mat: "calfhair", heel: 9, lin: "leather", sole: "rl", toe: "point", eur: 395, line: "fw", look: ["b6e600-0000", "i5e010-orag"], pop: 6,
    n: ["Лодочки с принтом зебра", "Zebra naqshli tuflilar", "Zebra-print calf hair pump"], c: ["Принт зебра", "Zebra naqshi", "Zebra print"] },
  { id: "d7b002-0000", art: "D7B002P1VITE0000", cat: "w", col: "black", mat: "leather", heel: 1, lin: "leather", sole: "rl", toe: "round", eur: 425, line: "fw", look: ["b6e905-0000", "q3b001-0000"], pop: 8,
    n: ["Лоферы из чёрной кожи", "Qora teridan loferlar", "Loafer in black leather"], c: ["Чёрный", "Qora", "Black"] },
  { id: "d7b516-bene", art: "D7B516P1CVZBBENE", cat: "w", col: "print", mat: "calfhair", heel: 1, lin: "leather", sole: "rl", toe: "point", eur: 475, line: "fw", look: ["b6e905-4060", "i5e010-orag"], pop: 5,
    n: ["Балетки с принтом зебра", "Zebra naqshli baletkalar", "Zebra-print calf hair ballet flat"], c: ["Принт зебра", "Zebra naqshi", "Zebra print"] },
  { id: "d7b802-nolp", art: "D7B802P1VCVLNOLP", cat: "w", col: "print", mat: "calfhair", heel: 1, lin: "faux", sole: "r", toe: "round", eur: 295, line: "fw", look: ["b7b803-3042"], pop: 7,
    n: ["Кроссовки с леопардовым принтом", "Leopard naqshli krossovkalar", "Leopard-print calf hair sneaker"], c: ["Леопардовый принт", "Leopard naqshi", "Leopard print"] },
  { id: "d7b007-4006", art: "D7B007P6CROS4006", cat: "w", col: "brown", mat: "suede", heel: 6, lin: "leather", sole: "r", toe: "round", eur: 475, line: "fw", look: ["b7b803-3042", "b6e905-4060"], pop: 6,
    n: ["Лоферы на каблуке из коричневой замши", "Jigarrang zamshdan poshnali loferlar", "Brown suede heeled loafer"], c: ["Коричневый", "Jigarrang", "Brown"] },
  { id: "u7b708-3000", art: "U7B708P1CRUS3000", cat: "m", col: "brown", mat: "leather", heel: 1, lin: "leather", sole: "r", toe: "round", eur: 475, line: "fw", look: ["u7b401-3170"], pop: 7,
    n: ["Ботинки из тёмно-коричневой кожи", "To‘q jigarrang teridan botinkalar", "Dark brown leather ankle boot"], c: ["Тёмно-коричневый", "To‘q jigarrang", "Dark brown"] },
  { id: "u7b717-2014", art: "U7B717A1CROS2014", cat: "m", col: "beige", mat: "suede", heel: 1, lin: "sheep", sole: "r", toe: "round", eur: 445, line: "fw", look: ["u7b401-3170"], pop: 5,
    n: ["Ботинки из бежевой замши", "Bej zamshdan botinkalar", "Beige suede ankle boot"], c: ["Бежевый", "Bej", "Beige"] },
  { id: "u6b020-0000", art: "U6B020A1BOTT0000", cat: "m", col: "black", mat: "tumbled", heel: 1, lin: "sheep", sole: "r", toe: "round", eur: 445, line: "fw", look: ["h5bf02-0000", "q3a005-1526"], pop: 8,
    n: ["Ботинки из чёрной зернистой кожи", "Qora donador teridan botinkalar", "Black tumbled leather ankle boot"], c: ["Чёрный", "Qora", "Black"] },
  { id: "u7b102-0000", art: "U7B102P1BTVI0000", cat: "m", col: "black", mat: "tumbled", heel: 1, lin: "leather", sole: "r", toe: "round", eur: 395, line: "fw", look: ["h5bf02-0000", "q3b001-0000"], pop: 7,
    n: ["Туфли на шнуровке из чёрной кожи", "Qora teridan bog‘ichli tuflilar", "Black leather lace-up shoe"], c: ["Чёрный", "Qora", "Black"] },
  { id: "u6b010-0000", art: "U6B010P1ABRA0000", cat: "m", col: "black", mat: "leather", heel: 1, lin: "leather", sole: "rl", toe: "round", eur: 445, line: "fw", look: ["h5bf02-0000", "q3a005-1526"], pop: 9,
    n: ["Лоферы из чёрной шлифованной кожи", "Qora sayqallangan teridan loferlar", "Black brushed leather loafer"], c: ["Чёрный", "Qora", "Black"] },
  { id: "u7b008-0000", art: "U7B008P1BOTT0000", cat: "m", col: "black", mat: "tumbled", heel: 1, lin: "leather", sole: "r", toe: "round", eur: 375, line: "fw", look: ["h5bf02-0000", "q3b001-0000"], pop: 8,
    n: ["Лоферы из чёрной зернистой кожи", "Qora donador teridan loferlar", "Black tumbled leather loafer"], c: ["Чёрный", "Qora", "Black"] },
  { id: "u7b404-1500", art: "U7B404A1BOTT1500", cat: "m", col: "blue", mat: "tumbled", heel: 1, lin: "sheep", sole: "r", toe: "round", eur: 295, line: "fw", look: ["q3a005-1526"], pop: 7,
    n: ["Кроссовки из синей зернистой кожи", "Ko‘k donador teridan krossovkalar", "Blue tumbled leather sneaker"], c: ["Синий", "Ko‘k", "Blue"] },
  { id: "u7b401-3170", art: "U7B401P1CROS3170", cat: "m", col: "brown", mat: "suede", heel: 1, lin: "leather", sole: "r", toe: "round", eur: 395, line: "fw", look: ["u7b708-3000"], pop: 6,
    n: ["Кроссовки из тёмно-коричневой замши", "To‘q jigarrang zamshdan krossovkalar", "Dark brown suede sneaker"], c: ["Тёмно-коричневый", "To‘q jigarrang", "Dark brown"] },
  { id: "b6e905-0000", art: "B6E905XXVITE0000", cat: "bag", col: "black", mat: "leather", lin: "leather", eur: 475, line: "fw", size: "28 × 32 × 13", look: ["d7b704-0000", "d7b002-0000"], pop: 7,
    n: ["Сумка на плечо из чёрной кожи", "Qora teridan yelka sumkasi", "Black leather shoulder bag"], c: ["Чёрный", "Qora", "Black"] },
  { id: "b6e905-4060", art: "B6E905XXVITE4060", cat: "bag", col: "brown", mat: "leather", lin: "leather", eur: 475, line: "fw", size: "28 × 32 × 13", look: ["d7b007-4006", "d7b516-bene"], pop: 7,
    n: ["Сумка на плечо из кожи коньячного цвета", "Konyak rang teridan yelka sumkasi", "Tan leather shoulder bag"], c: ["Коньячный", "Konyak rang", "Tan"] },
  { id: "b7b805-0000", art: "B7B805XXVITE0000", cat: "bag", col: "black", mat: "leather", lin: "textile", eur: 475, line: "fw", size: "28,5 × 21 × 12", look: ["d7b703-0000", "d7b120-0000"], pop: 5,
    n: ["Стёганая сумка из чёрной кожи", "Qora teridan tikma sumka", "Black quilted leather handbag"], c: ["Чёрный", "Qora", "Black"] },
  { id: "b7b800-3080", art: "B7B800XXVITE3080", cat: "bag", col: "brown", mat: "leather", lin: "leather", eur: 445, line: "fw", size: "35 × 23 × 14", look: ["d7b708-3080"], pop: 4,
    n: ["Сумка из тёмно-коричневой кожи", "To‘q jigarrang teridan sumka", "Dark brown leather handbag"], c: ["Тёмно-коричневый", "To‘q jigarrang", "Dark brown"] },
  { id: "b7b803-3042", art: "B7B803XXCAMO3042", cat: "bag", col: "beige", mat: "suede", lin: "leather", eur: 345, line: "fw", size: "22 × 18 × 12", look: ["d7b007-4006", "d7b802-nolp"], pop: 4,
    n: ["Сумка из замши цвета тауп", "Taup rang zamshdan sumka", "Taupe suede handbag"], c: ["Тауп", "Taup", "Taupe"] },
  { id: "b6e600-0000", art: "B6E600XXVITE0000", cat: "bag", col: "black", mat: "leather", lin: "mixed", rub: 42500, line: "fw", size: "24 × 18 × 8", look: ["d7b200-0000", "d7b719-0000"], pop: 6,
    n: ["Сумка через плечо из чёрной кожи", "Qora teridan yelkadan osma sumka", "Black leather crossbody bag"], c: ["Чёрный", "Qora", "Black"] },
  { id: "b7b602-9022", art: "B7B602XXVITE9022", cat: "bag", col: "beige", mat: "leather", lin: "textile", rub: 48000, line: "fw", size: "24 × 18 × 7", look: ["d7b203-7009"], pop: 5,
    n: ["Сумка через плечо из молочной стёганой кожи", "Sutrang tikma teridan yelkadan osma sumka", "Off-white quilted leather crossbody bag"], c: ["Молочный", "Sutrang", "Off-white"] },
  { id: "h5bf02-0000", art: "H5BF02XXVIBT0000", cat: "acc", col: "black", mat: "leather", eur: 175, line: "ss26", look: ["u6b010-0000", "u7b102-0000"], pop: 5,
    n: ["Двусторонний ремень из чёрной кожи", "Qora teridan ikki tomonlama kamar", "Reversible belt in black leather"], c: ["Чёрный", "Qora", "Black"] },
  { id: "q3b001-0000", art: "Q3B001XXLIZA0000", cat: "acc", col: "black", mat: "lizard", lin: "textile", eur: 145, line: "fw", size: "11 × 9,5 × 2", look: ["u7b008-0000"], pop: 4,
    n: ["Кошелёк с тиснением под ящерицу", "Kaltakesak bo‘rtmali hamyon", "Black lizard print wallet"], c: ["Чёрный", "Qora", "Black"] },
  { id: "q3a005-1526", art: "Q3A005XXLIZA1526", cat: "acc", col: "blue", mat: "lizard", lin: "textile", eur: 95, line: "fw", size: "10 × 8 × 0,5", look: ["u7b404-1500"], pop: 4,
    n: ["Кардхолдер с тиснением под ящерицу", "Kaltakesak bo‘rtmali kartochka g‘ilofi", "Blue lizard print cardholder"], c: ["Синий", "Ko‘k", "Blue"] },
  { id: "i5e010-orag", art: "I5E010XXVITLORAG", im: 2, cat: "acc", col: "metal", mat: "leather", eur: 145, line: "ss26", look: ["d7b220-bene"], pop: 3,
    n: ["Двусторонний ремень, золото и серебро", "Ikki tomonlama kamar, oltin va kumush", "Reversible belt, gold and silver"], c: ["Золото и серебро", "Oltin va kumush", "Gold and silver"] },
];

/** Демо-цена в сумах: евро сайта × 14 500, округление до 10 000. */
export const UZS_PER_EUR = 14500;
export const priceOf = (p) => Math.round(((p.eur ?? p.rub / 108) * UZS_PER_EUR) / 10000) * 10000;

/** Размеры: женские EU 35-41, мужские EU 39-45, с половинками (у бренда шире). */
const half = (a, b) => { const o = []; for (let x = a; x <= b; x += 0.5) o.push(String(x)); return o; };
export const SIZES = { w: half(35, 41), m: half(39, 45) };

/* Таблица бренда (baldinini-shop.com, «Таблица размеров»): IT/EU → US, UK. */
export const US = (cat, eu) => (cat === "m" ? +eu - 33.5 : +eu - 30);
export const UK = (cat, eu) => (cat === "m" ? +eu - 34 : +eu - 33);

/** Остатки бутика — демо, из одного зерна: середина сетки чаще, края реже. */
export function stockOf(p, i) {
  const sizes = p.cat === "w" ? SIZES.w : p.cat === "m" ? SIZES.m : null;
  let z = 97 + i * 7919;
  const rnd = () => ((z = (z * 1103515245 + 12345) >>> 0) / 4294967296);
  if (!sizes) return { one: 1 + Math.floor(rnd() * 3) };
  const mid = (sizes.length - 1) / 2;
  return Object.fromEntries(sizes.map((s, k) => {
    const near = 1 - Math.abs(k - mid) / (mid + 1);
    const n = rnd() < 0.12 ? 0 : Math.max(near > 0.25 ? 1 : 0, Math.round(near * 4 * (0.35 + rnd())));
    return [s, n];
  }));
}

export { LINING, SOLE, TOE, LINES };
