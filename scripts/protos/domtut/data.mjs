/*
 * Данные макета DomTut — только с domtut.uz (снято 14.10.2026).
 * Тексты парами [ru, uz]; gen.mjs кладёт в страницу только её язык.
 *
 * ЖК: класс, срок, застройщик, адрес, цены «от» по комнатам — блок
 * «Популярно у застройщиков» и «Самые популярные новостройки» на главной.
 * Цены — в миллионах сум, как у них. Район — только там, где он назван у
 * них или на странице ЖК. Точки на карте — по адресу, примерно.
 * Статистика по районам — их блок «Статистика по квартирам в Ташкенте»,
 * от 30 сентября 2026. Курс 12 200 сум за доллар — из их же фильтра цен
 * (до 30 000 $ = 366 000 000 сум).
 */

export const RATE = 12200;
export const STATS_DATE = ["30.09.2026", "30.09.2026"];

/* rooms: [комнат, площадь от, цена от (млн сум)] */
export const ZK = [
  {
    id: "mavera", photo: "mavera-squere", shots: 4, name: "Mavera Squere", dev: "Sohil qasri", cls: "comfort",
    due: ["Сдача IV кв. 2026", "Topshirish 2026, IV chorak"], dueY: 2026, done: false,
    district: "almazar", addr: ["Алмазарский район, ТКАД, махалля Жийдали", "Olmazor tumani, TAKY, Jiydali mahallasi"],
    rooms: [[1, 22.9, 173], [2, 68.4, 518]], tags: [], x: 23, y: 30,
  },
  {
    id: "mezon", photo: "mezon-residence", shots: 4, name: "Mezon Residence", dev: "LUMEN", cls: "comfort",
    due: ["Сдача IV кв. 2027", "Topshirish 2027, IV chorak"], dueY: 2027, done: false,
    district: "yashnabad", addr: ["Яшнабадский район, 2-я улица Карасу", "Yashnobod tumani, Qorasuv 2-ko‘chasi"],
    rooms: [[1, 35, 499], [2, 55, 785]], tags: [], x: 72, y: 52,
  },
  {
    id: "mirabad", photo: "mirabad-riverside", shots: 1, name: "Mirabad Riverside", dev: "Mirabad Riverside", cls: "comfort",
    due: ["Сдача I кв. 2027", "Topshirish 2027, I chorak"], dueY: 2027, done: false,
    district: "mirabad", addr: ["Мирабадский район, улица Мингурик, 68", "Mirobod tumani, Mingo‘rik ko‘chasi, 68"],
    rooms: [[1, 46, 702], [2, 52, 793]], tags: ["plan"], x: 55, y: 58,
  },
  {
    id: "mirador", photo: "mirador", shots: 4, name: "Mirador", dev: "Kayan Development", cls: "business",
    due: ["Сдача II кв. 2029", "Topshirish 2029, II chorak"], dueY: 2029, done: false,
    district: "mirabad", addr: ["Мирабадский район, Фаргона йули, 52", "Mirobod tumani, Farg‘ona yo‘li, 52"],
    rooms: [[1, 27, 511], [2, 62.1, 985], [3, 62, 983], [4, 92.1, 1400]], m2: 16.5, tags: ["plan"], x: 61, y: 66,
  },
  {
    id: "center", photo: "center-one", shots: 4, name: "Center One", dev: "Murad Buildings", cls: "premium",
    due: ["Сдача II кв. 2027", "Topshirish 2027, II chorak"], dueY: 2027, done: false,
    district: "yashnabad", addr: ["Яшнабадский район, улица Махтумкули", "Yashnobod tumani, Maxtumquli ko‘chasi"],
    rooms: [[1, 30.6, 1600], [2, 48.2, 2500], [3, 67.9, 3600], [4, 86.9, 4600]], m2: 52.5, tags: ["plan", "mortgage"], x: 66, y: 46,
  },
  {
    id: "ibnsino", photo: "ibn-sino", shots: 4, name: "Ibn Sino", dev: "Ibn Sino", cls: "comfort",
    due: ["Сдача IV кв. 2026", "Topshirish 2026, IV chorak"], dueY: 2026, done: false,
    district: "shayhantahur", addr: ["Шайхонтохурский район, Абу Али ибн Сина-2", "Shayxontohur tumani, Abu Ali ibn Sino-2"],
    rooms: [[1, 30, 341], [2, 42, 478], [3, 73, 831], [4, 84, 956]], tags: [], x: 38, y: 38,
  },
  {
    id: "afsona", photo: "afsona-residense", shots: 4, name: "Afsona Residense", dev: "General Construction", cls: "comfort",
    due: ["Сдача I кв. 2027", "Topshirish 2027, I chorak"], dueY: 2027, done: false,
    district: "yunusabad", addr: ["Юнусабадский район, улица Ахмада Дониша, Юнусабад-4", "Yunusobod tumani, Ahmad Donish ko‘chasi, Yunusobod-4"],
    rooms: [[1, 33.4, 574], [2, 53.5, 920], [3, 76.8, 1300]], tags: [], x: 52, y: 18,
  },
  {
    id: "choshtepa", photo: "choshtepa-garden", shots: 4, name: "Choshtepa Garden", dev: "ADM invest", cls: "comfort",
    due: ["Сдан в 2026", "2026 yilda topshirilgan"], dueY: 2026, done: true,
    district: "yangihayot", addr: ["Янгихаётский район, махалля Чаштепа", "Yangihayot tumani, Choshtepa mahallasi"],
    rooms: [[2, 49.2, 512], [3, 69.6, 724]], tags: ["plan"], x: 30, y: 78,
  },
  {
    id: "sky", photo: "sky-avenue", shots: 4, name: "Sky Avenue", dev: "Sky Avenue", cls: "comfort",
    due: ["Сдан в 2025", "2025 yilda topshirilgan"], dueY: 2025, done: true,
    district: "sergeli", addr: ["Сергелийский район, улица Жахонаро, Сергели-7", "Sergeli tumani, Jahonaro ko‘chasi, Sergeli-7"],
    rooms: [[1, 57.7, 692], [2, 74.4, 893]], tags: [], x: 46, y: 86,
  },
  {
    id: "dcasa", photo: "d-casa", shots: 4, name: "D Casa", dev: "DreamLevel", cls: "business",
    due: ["Сдача II кв. 2027", "Topshirish 2027, II chorak"], dueY: 2027, done: false,
    district: "mirzo", addr: ["Мирзо-Улугбекский район, улица Янги Ташкент", "Mirzo Ulug‘bek tumani, Yangi Toshkent ko‘chasi"],
    rooms: [[1, 29.7, 469], [2, 43.9, 694]], tags: ["plan", "promo"], x: 74, y: 30,
  },
  {
    id: "venetsiya", photo: "venetsiya", shots: 4, name: "Venetsiya", dev: "Venetsiya", cls: "premium",
    due: ["Сдача IV кв. 2027", "Topshirish 2027, IV chorak"], dueY: 2027, done: false,
    district: "yunusabad", addr: ["Юнусабадский район, Минор, 1-й тупик", "Yunusobod tumani, Minor, 1-berk ko‘cha"],
    rooms: [], m2: 16.5, tags: [], x: 58, y: 32,
  },
  {
    id: "tashwell", photo: "tashwelll", shots: 4, name: "Tashwell", dev: "Koc Construction", cls: "premium",
    due: ["Сдача I кв. 2027", "Topshirish 2027, I chorak"], dueY: 2027, done: false,
    district: "yakkasaray", addr: ["Яккасарайский район, улица Шота Руставели, 100", "Yakkasaroy tumani, Shota Rustaveli ko‘chasi, 100"],
    rooms: [], tags: [], x: 47, y: 62,
  },
];

export const CLS = {
  comfort: ["Комфорт", "Komfort"],
  business: ["Бизнес", "Biznes"],
  premium: ["Премиум", "Premium"],
};

export const DISTRICTS = {
  almazar: ["Алмазарский", "Olmazor"],
  yashnabad: ["Яшнабадский", "Yashnobod"],
  mirabad: ["Мирабадский", "Mirobod"],
  shayhantahur: ["Шайхонтохурский", "Shayxontohur"],
  yunusabad: ["Юнусабадский", "Yunusobod"],
  yangihayot: ["Янгихаётский", "Yangihayot"],
  sergeli: ["Сергелийский", "Sergeli"],
  mirzo: ["Мирзо-Улугбекский", "Mirzo Ulug‘bek"],
  chilanzar: ["Чиланзарский", "Chilonzor"],
  yakkasaray: ["Яккасарайский", "Yakkasaroy"],
};

/* Статистика: средняя цена квартиры (1, 2, 3 комнаты, $) и $ за м² по классам. */
export const STATS = [
  { d: "chilanzar", rooms: [51000, 70000, 92000], m2: { comfort: 1180, business: 903, premium: 1485, resale: 1594 } },
  { d: "mirabad", rooms: [59000, 110000, 154000], m2: { comfort: 1517, business: 2164, premium: 3073, resale: 1940 } },
  { d: "mirzo", rooms: [55000, 85000, 122000], m2: { comfort: 1859, business: 1707, premium: 1858, resale: 1633 } },
  { d: "sergeli", rooms: [41000, 60000, 75000], m2: { comfort: 926, business: 1037, premium: 819, resale: 1442 } },
  { d: "shayhantahur", rooms: [84000, 140000, 147000], m2: { comfort: 2615, business: 2825, premium: 3342, resale: 1886 } },
  { d: "yakkasaray", rooms: [62000, 104000, 148000], m2: { comfort: 1857, business: 1654, premium: 2857, resale: 1759 } },
  { d: "yashnabad", rooms: [46000, 69000, 93000], m2: { comfort: 1434, business: 1411, premium: 3127, resale: 1252 } },
  { d: "yunusabad", rooms: [59000, 81000, 120000], m2: { comfort: 1878, business: 1877, premium: 1602, resale: 1654 } },
];

/* «Проверенные застройщики» на главной: число предложений. */
export const DEVS = [
  ["Golden House", 287],
  ["Murad Buildings", 40],
  ["NRG BI", 37],
  ["Bazis-T", 10],
];

export const CONTACT = {
  phones: [["+998781132086", "+998 78 113 20 86"], ["+998933903010", "+998 93 390 30 10"]],
  hours: ["Пн-Пт, 9:30-18:00", "Du-Ju, 9:30-18:00"],
  addr: ["Ташкент, Яшнабадский район, улица Истикбол, 47", "Toshkent, Yashnobod tumani, Istiqbol ko‘chasi, 47"],
  /* Менеджер DomTut в Telegram — со страницы «Контакты». */
  tg: "https://t.me/domtut_admin",
  ig: "https://www.instagram.com/domtut_uz/",
  yt: "https://www.youtube.com/@domtut_uz",
  site: "https://domtut.uz",
  play: "https://play.google.com/store/apps/details?id=uz.domtut.app",
};

/* Счётчики на главной domtut.uz, 14.10.2026 («Что будем искать?»), и год запуска (/o-nas). */
export const COUNTS = { novo: 494, sale: 29927, rent: 2678, since: 2019 };
