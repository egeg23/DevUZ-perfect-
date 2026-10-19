// Демо-данные панели Soffice: общие для сайта и панели, из одного зерна.
//
// Факты о компании (18 БЦ, классы, ставки, 220 000 м², 1000+ арендаторов) —
// из data.mjs, с soffice.uz. Всё остальное здесь придумано для показа и так
// и подписано в панели: этажи и блоки, собственники зданий, команда,
// арендаторы (нейтральные латинские названия, не их клиенты из логотипов),
// рыночные ставки по классу. Ничего из этого не приписывается реальным
// компаниям.
//
// Инвентарь одинаков на сайте и в панели: сайт берёт статусы блоков отсюда
// и поверх них правки панели (so-panel-1), поэтому блок, отмеченный в
// панели «сдан», на сайте перестаёт быть свободным.

import { BC } from "./data.mjs";

/* Планировка этажа: та же, что на схеме этажа сайта (сетка 100×60). f — свободен ли блок на 3 и 4 этаже Platform. */
export const UNITS = [
  { n: "01", r: [2, 2, 18, 22], a: 64, w: "n", f: [1, 0] }, { n: "02", r: [20, 2, 14, 22], a: 42, w: "n", f: [0, 1] }, { n: "03", r: [34, 2, 22, 22], a: 96, w: "n", f: [1, 1] },
  { n: "04", r: [56, 2, 14, 22], a: 35, w: "n", f: [1, 0] }, { n: "05", r: [70, 2, 28, 22], a: 150, w: "ne", f: [0, 1] },
  { n: "06", r: [2, 36, 26, 22], a: 120, w: "s", f: [0, 1] }, { n: "07", r: [28, 36, 16, 22], a: 56, w: "s", f: [1, 0] },
  { n: "08", r: [58, 36, 40, 22], a: 210, w: "se", f: [1, 1] },
];
const FLOOR_M2 = UNITS.reduce((s, u) => s + u.a, 0);

/* Этажность там, где она названа на их страницах; у остальных — из зерна. */
const FLOORS = { orient: 11, kayan: 17, solidpremium: 6, ventumplaza: 8, novaminor: 5, platform: 9 };
/* Площадь, названная у них: Infinity «20 000 м² всего». */
const FIXED_M2 = { infinity: 20000 };
const TOTAL_M2 = 220000;

function rng(seed) {
  let z = seed >>> 0;
  return () => ((z = (z * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/**
 * Инвентарь: у каждого БЦ этажи (со 2-го, на 1-м вход и ресепшен), на каждом
 * восемь блоков по планировке UNITS с площадью × k. Статус блока — буква:
 * f свободен, h бронь, l сдан, r ремонт. Platform: k = 1, 3 и 4 этаж — как
 * на схеме этажа сайта.
 */
export function inventory() {
  const r = rng(20261019);
  const raw = BC.map((b) => {
    const fl = FLOORS[b.id] ?? 7 + Math.floor(r() * 7);
    const want = FIXED_M2[b.id] ?? (b.cls === "A+" ? 14000 : b.cls === "A" ? 11000 : 8000) * (0.8 + r() * 0.5);
    return { id: b.id, fl, want };
  });
  const fixed = raw.filter((x) => FIXED_M2[x.id] || x.id === "platform");
  const fixedM2 = fixed.reduce((s, x) => s + (x.id === "platform" ? x.fl * FLOOR_M2 : x.want), 0);
  const restWant = raw.filter((x) => !fixed.includes(x)).reduce((s, x) => s + x.want, 0);
  const scale = (TOTAL_M2 - fixedM2) / restWant;
  const out = {};
  for (const x of raw) {
    const k = x.id === "platform" ? 1 : Math.round(((FIXED_M2[x.id] ?? x.want * scale) / (x.fl * FLOOR_M2)) * 100) / 100;
    const occ = 0.8 + r() * 0.15;
    let s = "";
    for (let f = 0; f < x.fl; f++) {
      const no = f + 2;
      for (let u = 0; u < UNITS.length; u++) {
        if (x.id === "platform" && (no === 3 || no === 4)) { s += UNITS[u].f[no - 3] ? "f" : "l"; continue; }
        const v = r();
        s += v < occ ? "l" : v < occ + 0.03 ? "h" : v < occ + 0.05 ? "r" : "f";
      }
    }
    out[x.id] = { fl: x.fl, k, s };
  }
  return out;
}

/* Собственники зданий — демо: у Soffice несколько собственников, отчёт каждому о его зданиях. */
export const OWNERS = [
  { id: "arka", n: "Arka Development", bcs: ["grossplaza", "sapphire", "platform", "panoramic"] },
  { id: "navo", n: "Navo Estate", bcs: ["forum", "trilliant", "nestone"] },
  { id: "orda", n: "Orda Capital", bcs: ["modera", "dream", "solidpremium", "newera", "ventumplaza"] },
  { id: "bosta", n: "Bosta Invest", bcs: ["infinity", "kayan", "businesspark"] },
  { id: "zamin", n: "Zamin Property", bcs: ["orient", "novaplaza", "novaminor"] },
];

/* Команда — демо. Имена на языке страницы. */
export const TEAM = [
  { id: "aziz", role: "broker", n: { ru: "Азиз Каримов", uz: "Aziz Karimov", en: "Aziz Karimov" } },
  { id: "dilnoza", role: "broker", n: { ru: "Дилноза Юсупова", uz: "Dilnoza Yusupova", en: "Dilnoza Yusupova" } },
  { id: "timur", role: "broker", n: { ru: "Тимур Ахмедов", uz: "Temur Ahmedov", en: "Timur Akhmedov" } },
  { id: "madina", role: "broker", n: { ru: "Мадина Рашидова", uz: "Madina Rashidova", en: "Madina Rashidova" } },
  { id: "nodira", role: "head", n: { ru: "Нодира Ибрагимова", uz: "Nodira Ibragimova", en: "Nodira Ibragimova" } },
  { id: "gulnora", role: "acc", n: { ru: "Гульнора Саидова", uz: "Gulnora Saidova", en: "Gulnora Saidova" } },
  { id: "bahtiyor", role: "ops", n: { ru: "Бахтиёр Турсунов", uz: "Baxtiyor Tursunov", en: "Bakhtiyor Tursunov" } },
  { id: "jasur", role: "ops", n: { ru: "Жасур Комилов", uz: "Jasur Komilov", en: "Jasur Komilov" } },
];

/* Названия арендаторов — нейтральные, латиницей: корень × направление. Явно демо. */
export const TENANT_ROOTS = ["Vektor", "Orion", "Lumen", "Navoiy", "Pamir", "Atlas", "Ferro", "Granit", "Koinot", "Lazurit", "Marvarid", "Optima", "Polyus", "Safar", "Sirius", "Tayanch", "Ufq", "Yulduz", "Zamin", "Aral", "Baraka", "Chinor", "Duru", "Elara", "Fazo", "Iqlim", "Kamalak", "Lochin", "Mezon", "Nurli", "Oqim", "Qanot", "Rivoj", "Sarbon", "Tonggi", "Vodiy", "Xazina", "Yangi Yol", "Bodom", "Kumush"];
export const TENANT_KINDS = ["Trade", "Consult", "Logistics", "Soft", "Group", "Finance", "Media", "Engineering", "Agro", "Tech", "Pharma", "Build", "Systems", "Partners", "Textile", "Food", "Energy", "Audit", "Design", "Travel", "Education", "Medical", "Service", "Labs", "Law"];

/* Рыночная ставка по классу, сум за м² в месяц — демо для сравнения; в работе — из вашего исследования. */
export const MARKET = { "A+": 470000, A: 360000, "B+": 300000, B: 260000 };

/* Коммунальные и парковка в счёте — демо. Вознаграждение управляющего — доля собранной аренды, демо. */
export const TARIFF = { util: 18000, park: 600000, fee: 0.07, expense: 0.21 };
