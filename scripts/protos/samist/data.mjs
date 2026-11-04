// Данные макета SAMIST AUTO — только с их сайта samist.autoline.uz (снято
// 04.11.2026, BEFORE.md и SOURCES.md). Каталог — catalog.json (его пишет
// catalog.py из страниц объявлений): цены в сумах и «≈ $» — как у них на
// странице, характеристики — их поля. Здесь — подписи на двух языках и то,
// какие поля показывать. Ничего не придумываем: нет поля — нет строки.
import { readFileSync } from "node:fs";

const DIR = new URL(".", import.meta.url).pathname;
const RAW = JSON.parse(readFileSync(DIR + "catalog.json", "utf8"));

export const LANGS = ["ru", "uz"];

export const BRAND = {
  name: "SAMIST AUTO",
  legal: "СП ООО «SAMIST AUTO»",
  phone: "+998 95 705 80 10",
  tel: "+998957058010",
  /* Ещё номера автосалона Isuzu из их описаний объявлений. */
  more: [["71 209 60 62", "+998712096062"], ["93 008 98 98", "+998930089898"], ["97 428 27 07", "+998974282707"]],
  ru: { addr: "Ташкент, Ташкентская кольцевая автомобильная дорога, 120А", zip: "110920", area: "Янгихаётский район" },
  uz: { addr: "Toshkent, Toshkent aylanma avtomobil yo‘li, 120A", zip: "110920", area: "Yangihayot tumani" },
  site: "https://samist.autoline.uz/",
};
export const ROUTE = "https://yandex.uz/maps/?text=" + encodeURIComponent("Ташкент, Ташкентская кольцевая автомобильная дорога 120А");

/* Их слова о себе (главная samist.autoline.uz), узбекский — наш перевод. */
export const ABOUT = {
  ru: [
    "Компания действует на автомобильном рынке Узбекистана на протяжении 5 лет: легковые Chevrolet, специализированная техника, грузовые автомобили и автобусы ISUZU, MAN, KAMAZ, HOWO, FAW TRUCKS.",
    "Полуприцепы UzAuto TRAILER грузоподъёмностью от 4 до 17 тонн.",
    "Оригинальные запасные части на ISUZU и квалифицированное сервисное обслуживание.",
    "Технику можно приобрести в кредит или лизинг: на некоторые модели грузовых автомобилей и специализированной техники.",
  ],
  uz: [
    "Kompaniya O‘zbekiston avtomobil bozorida 5 yildan beri ishlaydi: Chevrolet yengil avtomobillari, maxsus texnika, ISUZU, MAN, KAMAZ, HOWO, FAW TRUCKS yuk avtomobillari va avtobuslari.",
    "Yuk ko‘tarishi 4 dan 17 tonnagacha bo‘lgan UzAuto TRAILER yarim tirkamalari.",
    "ISUZU uchun original ehtiyot qismlar va malakali servis xizmati.",
    "Texnikani kredit yoki lizingga olish mumkin: yuk avtomobillari va maxsus texnikaning ayrim modellariga.",
  ],
  motto: {
    ru: "Для каждого нашего клиента мы стараемся подобрать наиболее оптимальное решение.",
    uz: "Har bir mijozimiz uchun eng maqbul yechimni tanlashga harakat qilamiz.",
  },
};
export const BRANDS = ["ISUZU", "FAW TRUCKS", "MAN", "KAMAZ", "HOWO", "Chevrolet", "UzAuto TRAILER"];

/* Разделы — как в меню их сайта. */
export const CATS = [
  { id: "truck", ru: "Грузовики", uz: "Yuk avtomobillari" },
  { id: "comm", ru: "Коммерческие автомобили", uz: "Tijorat avtomobillari" },
  { id: "car", ru: "Автомобили", uz: "Avtomobillar" },
  { id: "bus", ru: "Автобусы", uz: "Avtobuslar" },
  { id: "build", ru: "Строительная техника", uz: "Qurilish texnikasi" },
  { id: "city", ru: "Коммунальная техника", uz: "Kommunal texnika" },
  { id: "tract", ru: "Тягачи", uz: "Shatakchilar" },
];
const CAT_OF = { "Грузовики": "truck", "Коммерческие автомобили": "comm", "Автомобили": "car", "Автобусы": "bus", "Строительная техника": "build", "Коммунальная техника": "city", "Тягачи": "tract" };

/* Подписи моделей: название — как у них в заголовке, тип — их «Тип». */
const NAMES = {
  "faw-actis-t80": ["FAW ACTIS T80", "бортовой грузовик до 3,5 т", "3,5 t gacha bortli yuk mashinasi"],
  "faw-j6l": ["FAW J6L", "автофургон", "avtofurgon"],
  "isuzu-isuzu-d-max-irbis": ["Isuzu D-MAX IRBIS", "пикап", "pikap"],
  "isuzu-nmr-77h": ["Isuzu NMR 77H", "автофургон", "avtofurgon"],
  "isuzu-nqr-90l-l": ["Isuzu NQR 90L-L", "грузовик шасси", "shassi yuk mashinasi"],
  "isuzu-npr-75k": ["Isuzu NPR 75K", "автофургон", "avtofurgon"],
  "isuzu-nqr-90l": ["Isuzu NQR 90L", "автофургон", "avtofurgon"],
  "isuzu-npr-82l": ["Isuzu NPR 82L", "изотермический фургон", "izotermik furgon"],
  "faw-j6p": ["FAW J6P", "автобетоносмеситель", "avtobetonaralashtirgich"],
  "faw-jh6-cng": ["FAW JH6 CNG", "тягач на метане", "metandagi shatakchi"],
  "isuzu-nqr-71-pl": ["Isuzu NQR 71 PL", "мусоровоз", "chiqindi tashuvchi"],
  "isuzu-saz-hd-50": ["Isuzu SAZ HD 50", "междугородний-пригородный автобус", "shaharlararo-shahar atrofi avtobusi"],
  "isuzu-fvr-34q": ["Isuzu FVR 34Q", "автофургон", "avtofurgon"],
  "isuzu-cyz": ["Isuzu CYZ", "самосвал", "samosval"],
};

/* Для подбора под задачу: что этой машиной возят — по её типу у них. */
const USE = {
  "faw-actis-t80": ["small", "goods"], "faw-j6l": ["goods", "long"], "isuzu-isuzu-d-max-irbis": ["small"], "isuzu-nmr-77h": ["goods"],
  "isuzu-nqr-90l-l": ["goods", "build"], "isuzu-npr-75k": ["goods"], "isuzu-nqr-90l": ["goods"], "isuzu-npr-82l": ["cold"], "faw-j6p": ["build"],
  "faw-jh6-cng": ["long"], "isuzu-nqr-71-pl": ["city"], "isuzu-saz-hd-50": ["people"], "isuzu-fvr-34q": ["goods", "long"], "isuzu-cyz": ["build"],
};

/* Поля, которые показываем, и их подписи. Значения — их, перевод — словарём. */
const FIELDS = [
  ["Мощность", "Мощность", "Quvvat"],
  ["Грузоподъемность", "Грузоподъёмность", "Yuk ko‘tarish"],
  ["Объем", "Объём кузова", "Kuzov hajmi"],
  ["Полная масса", "Полная масса", "To‘liq massa"],
  ["Собственный вес", "Собственный вес", "O‘z og‘irligi"],
  ["Количество мест", "Мест", "O‘rinlar"],
  ["Габаритные размеры", "Габариты", "Gabaritlar"],
  ["Размеры кузова", "Размеры кузова", "Kuzov o‘lchamlari"],
  ["Топливный бак", "Топливный бак", "Yoqilg‘i baki"],
  ["Двигатель", "Двигатель", "Dvigatel"],
  ["Объём двигателя", "Объём двигателя", "Dvigatel hajmi"],
  ["Топливо", "Топливо", "Yoqilg‘i"],
  ["Евро", "Экокласс", "Ekoklass"],
  ["Колесная формула", "Колёсная формула", "G‘ildirak formulasi"],
  ["Количество осей", "Осей", "O‘qlar"],
  ["Количество передач", "Передач", "Uzatmalar"],
  ["Коробка", "Коробка", "Uzatmalar qutisi"],
  ["Пробег", "Пробег", "Yurgan masofasi"],
  ["Год выпуска", "Год", "Yil"],
  ["Гарантия", "Гарантия", "Kafolat"],
  ["Кондиционер", "Кондиционер", "Konditsioner"],
  ["Опции сделки", "Покупка", "Xarid"],
  ["Состояние", "Состояние", "Holati"],
  ["Цвет", "Цвет", "Rangi"],
];
const VAL_UZ = [
  [/л\.с\./g, "o.k."], [/кВт/g, "kVt"], [/кг/g, "kg"], [/см³/g, "sm³"], [/м³/g, "m³"], [/(?<![А-Яа-яё])м(?![А-Яа-яё])/g, "m"], [/(?<![А-Яа-яё])л(?![А-Яа-яё])/g, "l"], [/км/g, "km"],
  [/дизель/g, "dizel"], [/газ/g, "gaz"], [/новый/g, "yangi"], [/б\/у/g, "ishlatilgan"], [/белый/g, "oq"], [/серебристый, металлик/g, "kumushrang, metallik"],
  [/климат-контроль/g, "iqlim nazorati"], [/лизинг/g, "lizing"], [/кредит/g, "kredit"], [/автомат/g, "avtomat"], [/года?(?![А-Яа-яё])/g, "yil"], [/месяцев/g, "oy"],
];
const uzVal = (v) => VAL_UZ.reduce((s, [a, b]) => s.replace(a, b), v);
/* Цифры для полосок: число из их поля. */
const num = (v) => (v ? Number(String(v).replace(/\s/g, "").replace(",", ".").match(/[\d.]+/)?.[0]) : null);

/* Их же опечатки в полях, поправленные по их описанию: у D-MAX в «Объём»
   стоит «3 см³» (в описании — 2 999 см³), а «Тип» двигателя («рядный») лёг в
   коробку; коробка у них — «автомат AISIN TB-50LS». */
const FIX = { "isuzu-isuzu-d-max-irbis": { "Объем": null, "Объём двигателя": "2 999 см³", "Коробка": "автомат" } };

export const MODELS = RAW.map((r) => {
  const sp = Object.fromEntries(r.spec);
  for (const [k, v] of Object.entries(FIX[r.id] || {})) if (v === null) delete sp[k]; else sp[k] = v;
  const [name, kru, kuz] = NAMES[r.id];
  const spec = FIELDS.filter(([k]) => sp[k]).map(([k, ru, uz]) => ({ k, ru, uz, v: sp[k], vu: uzVal(sp[k]) }));
  const hp = num((sp["Мощность"] || "").match(/(\d+)\s*л\.с\./)?.[1]);
  return {
    id: r.id.replace("isuzu-isuzu-", "isuzu-"),
    src: r.id,
    name,
    cat: CAT_OF[r.cat],
    kind: { ru: kru, uz: kuz },
    isNew: sp["Состояние"] === "новый",
    year: sp["Год выпуска"] ? sp["Год выпуска"].slice(0, 4) : "",
    uzs: r.uzs,
    usd: r.usd,
    hp,
    kg: num(sp["Грузоподъемность"]),
    m3: num(sp["Объем"]),
    seats: num(sp["Количество мест"]),
    tank: num(sp["Топливный бак"]),
    fuel: sp["Топливо"] || "",
    use: USE[r.id],
    credit: /кредит|лизинг/.test(sp["Опции сделки"] || "") || /кредит|лизинг|kredit|lizing/i.test(r.note),
    spec,
    img: r.img,
    url: r.url,
  };
});

/* Сцена по прокрутке на сайте — пять кадров их фото, от лёгкого к тяжёлому. */
export const SCENE = ["faw-actis-t80", "isuzu-npr-75k", "isuzu-fvr-34q", "isuzu-saz-hd-50", "isuzu-cyz"];

export const PRICE_SPAN = { min: Math.min(...MODELS.map((m) => m.uzs)), max: Math.max(...MODELS.map((m) => m.uzs)) };
