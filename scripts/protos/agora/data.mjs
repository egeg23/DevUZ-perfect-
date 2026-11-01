// Факты Agora Lounge & bar — только из их меню rezvo (menu-src.json) и Golden
// Pages (часы). Источники — SOURCES.md. Цены в сумах — как в их меню.
import { readFileSync } from "node:fs";

const DIR = new URL(".", import.meta.url).pathname;
const SRC = JSON.parse(readFileSync(DIR + "menu-src.json", "utf8"));
const UZ = JSON.parse(readFileSync(DIR + "names-uz.json", "utf8"));
export const PHOTOS = JSON.parse(readFileSync(DIR + "photos.json", "utf8"));

export const LANGS = ["ru", "uz"];

export const BRAND = {
  name: "AGORA",
  sub: "Lounge & bar",
  color: "#d93a33",
  phone: "+998 97 422 88 88",
  tel: "+998974228888",
  ig: "agora.lounge",
  lat: SRC.venue.lat,
  lng: SRC.venue.lng,
  iiko: SRC.categories.every((c) => c.items.every((d) => d.src === "iiko")),
  ru: {
    street: "ул. Амира Темура, 15",
    city: "Ташкент",
    hours: "ежедневно 10:00-03:00",
    about: SRC.venue.description,
    kitchen: "Европейская кухня, мангал и бар",
  },
  uz: {
    street: "Amir Temur ko‘chasi, 15",
    city: "Toshkent",
    hours: "har kuni 10:00-03:00",
    about: "AGORA jonli muloqot va dam olish uchun yaratilgan atmosferali makon. Biz odamlarga baxt ulashishga harakat qilamiz va buni o‘z vazifamiz deb bilamiz.",
    kitchen: "Yevropa oshxonasi, manqal va bar",
  },
};

/* Разделы меню: порядок, группа (кухня / бар), узбекское имя. Кальянные
   разделы («Дымный коктейль») на сайт не выносим: реклама табака. */
export const CATS = [
  ["ХОЛОДНЫЕ ЗАКУСКИ", "k", "Холодные закуски", "Sovuq gazaklar"],
  ["САЛАТЫ", "k", "Салаты", "Salatlar"],
  ["ГОРЯЧИЕ ЗАКУСКИ", "k", "Горячие закуски", "Issiq gazaklar"],
  ["СУПЫ", "k", "Супы и бизнес-ланч", "Sho‘rvalar va biznes-lanch"],
  ["ГОРЯЧИЕ БЛЮДА", "k", "Горячие блюда", "Issiq taomlar"],
  ["МАНГАЛ", "k", "Мангал", "Manqal"],
  ["ПАСТА", "k", "Паста", "Pasta"],
  ["ГАРНИРЫ", "k", "Гарниры", "Garnirlar"],
  ["ХЛЕБ", "k", "Хлеб", "Non"],
  ["СОУСЫ", "k", "Соусы", "Souslar"],
  ["СНЕКИ", "k", "Снеки", "Sneklar"],
  ["ДЕСЕРТЫ", "k", "Десерты и фрукты", "Desertlar va mevalar"],
  ["ЛИМОНАДЫ", "b", "Лимонады", "Limonadlar"],
  ["СВЕЖЕВЫЖАТЫЕ СОКИ (ФРЕШ)", "b", "Фреши", "Freshlar"],
  ["КОФЕ", "b", "Кофе", "Qahva"],
  ["ЧАЙ", "b", "Чай", "Choy"],
  ["Напитки", "b", "Вода и напитки", "Suv va ichimliklar"],
  ["Пиво", "b", "Пиво", "Pivo", true],
  ["Алкогольные коктейли", "b", "Коктейли", "Kokteyllar", true],
  ["Алкоголь крепкий", "b", "Крепкое и вино", "Spirtli ichimliklar va vino", true],
].map(([src, g, ru, uz, alc]) => ({ src, g, ru, uz, alc: !!alc, id: "c" + SRC.categories.findIndex((c) => c.name === src) }));

export const HOOKAH = SRC.categories.filter((c) => c.cuisine.startsWith("ac47")).reduce((s, c) => s + c.items.length, 0);

/* Маленькая порция показывает фото той же позиции большой порции — с подписью. */
const SAME = {
  "Люля кебаб маленький (120гр)": "Люля кебаб (200гр)",
  "Крылышки маленькие (150гр)": "Сочные крыля на мангале (300гр)",
  "Говядина кусковая маленькая (125гр)": "Говядина кусковая (200гр)",
  "Лимонад Манго-Маракуя (450мл)": "Лимонад Манго-Маракуя",
  "Лимонад Ягодный 450 мл": "Лимонад Ягодный",
  "Лимонад классический (450мл)": "Лимонад классический",
  "Айс ти 0.45л": "Айс ти 1л",
  "Стакан Мохито классик": "Мохито",
  "Чай Черный": "Чай (чёрный, зелёный)",
};

/* Описания на узбекском — только у тех блюд, где они есть в их меню. */
const DESC_UZ = {
  "Мясное ассорти": "Qazi, til, basturma, go‘shtli rulet, kurka, qanotchalar, tovuq qazisi, fransuzcha kornishon.",
  "Овощная нарезка": "Yangi pomidor, bodring, bolgar qalampiri, sarimsoq, achchiq qalampir, shivit, ko‘k piyoz.",
  "Маринованное ассорти": "Fransuzcha kornishon, opyata, marinadlangan makkajo‘xori, shampinon, armancha karam.",
  "Вителло тоннато": "Mol go‘shti filesi, kapers, cherri pomidor, rukkola.",
  "Тёплый салат с куриной печенью": "Tovuq jigari, bedana tuxumi, salat aralashmasi, pushti va qora qalampir.",
  "Острый тёплый салат с баклажанами": "Qaynatilgan buzoq go‘shti, baqlajon, yangi pomidor, kashnich, shalot piyozi, adjika bilan.",
  "Буррата с розовыми помидорами": "Burrata pishlog‘i, pushti pomidor, rukkola, rayhon, balzamik kremi, pesto sousi.",
  "Капрезе": "Motsarella, yangi pomidor, rukkola, pesto sousi, zaytun moyi va balzamik kremi.",
  "Четыре сезона": "Qaynatilgan buzoq go‘shti, yangi va tuzlangan bodring, opyata, marinadlangan shampinon.",
  "Хрустящие креветки темпура": "Xamirdagi yo‘lbars krevetkalari, sarimsoqli sous bilan.",
  "Патыр": "Oltin rang qarsildoq qobiqli, ichi yumshoq an’anaviy patir non.",
  "Булка с семенами": "Kunjut, zig‘ir va kungaboqar urug‘i sepilgan qarsildoq bulochka.",
  "Булка плетёнка": "Chiroyli o‘rama naqshli, yumshoq va xushbo‘y bulochka.",
  "Дыня": "Shirin, xushbo‘y qovun.",
  "Арбуз": "Shirin va tetiklashtiruvchi tarvuz.",
};

const lat = (s) => {
  const T = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya" };
  return s.replace(/[а-яё]/gi, (c) => { const r = T[c.toLowerCase()] ?? ""; return c === c.toLowerCase() ? r : r.charAt(0).toUpperCase() + r.slice(1); });
};
/* Тире в их словах чиним по смыслу: «Патыр — лепёшка» → «Патыр: лепёшка», «Арбуз - Дыня» → «Арбуз, дыня». */
const plain = (x, sep) => x.replace(/\s+[\u2014\u2013-]\s+/g, sep).replace(/[\u2014\u2013]/g, "-");
const uzName = (ru) => UZ[ru] ?? (/[А-Яа-яЁё]/.test(ru) ? lat(ru) : ru);
const NO_ALC = /безалкоголь|0%/i;
const firstId = new Map();
for (const c of SRC.categories) for (const d of c.items) if (!firstId.has(d.name)) firstId.set(d.name, d.id.slice(0, 8));

/* Меню сайта: всё, кроме кальяна. id — первые 8 знаков их id. */
export const MENU = CATS.flatMap((cat) => {
  const src = SRC.categories.find((c) => c.name === cat.src);
  return src.items.map((d) => {
    const id = d.id.slice(0, 8);
    const same = SAME[d.name] ? firstId.get(SAME[d.name]) : null;
    const ph = PHOTOS[id] ? id : same && PHOTOS[same] ? same : null;
    const wine = /Вино|Asti|Brut/i.test(d.name) && cat.alc;
    return {
      id, cat: cat.id, g: cat.g,
      ru: plain(d.name, ", ").replace(/^([а-яё])/, (m) => m.toUpperCase()).replace(/, ([А-Я])/, (m, c) => ", " + c.toLowerCase()),
      uz: uzName(d.name),
      dru: cat.alc ? "" : plain(d.desc.trim(), ": "),
      duz: cat.alc ? "" : DESC_UZ[d.name] ?? "",
      price: d.price,
      w: d.g && d.g >= 10 && !cat.alc && cat.g === "k" ? Math.round(d.g) : null,
      ph, alias: ph && ph !== id,
      stock: ph ? PHOTOS[ph].src !== "rezvo" : false,
      alc: cat.alc && !NO_ALC.test(d.name),
      wine,
      stop: d.stop,
    };
  });
});

/* Витрина «Вечер в Agora»: три блюда и два напитка на столах их зала. */
export const SHOW = [
  { id: "2a99f514", hall: 8, mood: "steam0", ru: ["Буррата с розовыми помидорами", "Начать вечер"], uz: ["Pushti pomidorli burrata", "Kechni boshlash"] },
  { id: "521e342a", hall: 9, mood: "steam0", ru: ["Вителло тоннато", "На компанию"], uz: ["Vitello tonnato", "Davra uchun"] },
  { id: "c64f9fe5", hall: 2, mood: "steam1", ru: ["Корейка на мангале", "С мангала"], uz: ["Manqalda koreyka", "Manqaldan"] },
  { id: "775c0b5e", hall: 5, mood: "ice", ru: ["Лимонад Манго-Маракуя", "Из бара"], uz: ["Mango-marakuya limonadi", "Bardan"], pair: "Лимонад Манго-Маракуя (450мл)" },
  { id: "5b241d36", hall: 1, mood: "ice", ru: ["Мохито", "Без алкоголя"], uz: ["Moxito", "Alkogolsiz"], pair: "Стакан Мохито классик" },
].map((s) => ({ ...s, item: MENU.find((m) => m.id === s.id), pairItem: s.pair ? MENU.find((m) => m.ru === s.pair) : null }));

/* Зал: 12 фото галереи rezvo. Подписи — что на снимке видно, без обещаний. */
export const HALL = [
  [6, "Зал", "Zal"], [2, "Веранда вечером", "Kechki ayvon"], [5, "Бар", "Bar"], [8, "Зал под звёздами", "Yulduzlar ostidagi zal"],
  [4, "Второй ярус", "Ikkinchi qavat"], [1, "Веранда", "Ayvon"], [9, "Большой стол", "Katta stol"], [3, "Зал", "Zal"],
  [7, "Вечер с друзьями", "Do‘stlar bilan kech"], [10, "Песни за столом", "Stolda qo‘shiqlar"], [11, "Подача", "Xizmat"], [0, "У окна", "Deraza yonida"],
];

export const COUNT = { all: MENU.length, photo: MENU.filter((m) => m.ph).length, kitchen: MENU.filter((m) => m.g === "k").length, bar: MENU.filter((m) => m.g === "b").length };
