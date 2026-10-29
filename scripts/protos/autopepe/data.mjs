// Факты AutoPepe — только с autopepe.pl (снято 29.10.2026, SOURCES.md).
// Тексты услуг — их слова, сокращённые; цифры — их: 1990, 1997, часы 8-16,
// цены «od» из cennik.htm. Цены конструктора для их клиентов — середина
// варшавского рынка (SOURCES.md, «Цены рынка»), как велел владелец DevUz.

export const COMPANY = {
  name: "AutoPepe",
  owner: "Paweł Palanowski",
  street: "ul. Lebiodowa 19",
  city: "04-674 Warszawa",
  district: "Wawer",
  phone: "501 729 924",
  tel: "+48501729924",
  mail: "biuro@autopepe.pl",
  hours: "pn-pt 8:00-16:00",
  since: 1990,
  pdr: 1997,
  site: "https://www.autopepe.pl",
  maps: "https://www.google.com/maps/search/?api=1&query=Lebiodowa+19,+04-674+Warszawa",
  /* dojazd.htm, их словами. */
  route: "Od ul. Kadetów / Lucerny skręć w ul. Węglarską, przejedź przez mały mostek i jesteś na miejscu.",
};

/* Шесть услуг с uslugi.htm. motion — своё движение у каждой карточки. */
export const SERVICES = [
  {
    id: "blach", motion: "panel", url: "blacharstwo-lakiernictwo.htm",
    t: "Blacharstwo i lakiernictwo",
    s: "Wypadek, kolizja, wandal, korozja. Wyciągamy blachę, wymieniamy elementy, pasujemy, zabezpieczamy i lakierujemy.",
    more: "Naprawiamy osobówki i dostawczaki wszystkich marek. Mamy maszyny do kształtowania blachy i własną mieszalnię lakierów, więc kolor dobieramy na miejscu.",
  },
  {
    id: "pdr", motion: "press", url: "usuwanie-wgniecen.htm",
    t: "Usuwanie wgnieceń bez lakierowania",
    s: "Grad, szkoda parkingowa, wgniecenie w transporcie. Wypychamy blachę od środka, lakier zostaje fabryczny.",
    more: "Bez wymiany i bez lakierowania całego elementu, więc auto nie traci na wartości. Robimy to specjalistycznymi narzędziami, od 1997 roku.",
  },
  {
    id: "rys", motion: "wipe", url: "usuwanie-rys.htm",
    t: "Kasowanie rys",
    s: "Rysy od parkowania, piasku, złej myjni albo wandala. Usuwamy je bez lakierowania elementu.",
    more: "Badanie grubości lakieru nie pokaże różnicy względem stanu fabrycznego. Krótko, trwale i dokładnie.",
  },
  {
    id: "lak", motion: "gloss", url: "renowacja-lakieru.htm",
    t: "Renowacja lakieru",
    s: "Polerowanie, które wydobywa głębię koloru i zabezpiecza lakier. Najczęściej przed sprzedażą auta.",
    more: "Bez kółek polerskich, hologramów i smug. Lakier odbija światło jak lustro i wygląda na mokry.",
  },
  {
    id: "felg", motion: "spin", url: "renowacja-felg-aluminiowych.htm",
    t: "Renowacja felg",
    s: "Zdejmujemy stary lakier, uzupełniamy ubytki, wygładzamy i lakierujemy w kolorze, który wybierzesz.",
    more: "Robimy wszystko u siebie, bez firm zewnętrznych. Naprawimy każdą felgę, która nadaje się do renowacji.",
  },
  {
    id: "oc", motion: "lift", url: "naprawy-blacharskie.htm",
    t: "Naprawy powypadkowe",
    s: "Naprawa po wypadku na podstawie wyceny zatwierdzonej przez ubezpieczyciela. Z OC sprawcy rozliczenie może być bezgotówkowe.",
    more: "Blacharka i mechanika w jednym miejscu. Każda naprawa powypadkowa kończy się diagnostycznym badaniem technicznym.",
  },
];

/* cennik.htm, дословно цифрами. */
export const PRICES = [
  ["Usunięcie wgniecenia", 50],
  ["Usuwanie rys", 50],
  ["Zaprawka lakiernicza", 200],
  ["Przygotowanie auta do sprzedaży", 200],
  ["Renowacja felg (4 szt.)", 400],
  ["Polerowanie karoserii", 500],
  ["Lakierowanie elementu", 500],
];

/* Бегущая строка: их же слова. */
export const HOOKS = [
  "Od 1990 roku", "Wgniecenia bez lakierowania od 1997", "Własna mieszalnia lakierów", "Bezgotówkowo z OC sprawcy",
  "Badanie techniczne po każdej naprawie powypadkowej", "Odprowadzimy auto po naprawie", "Rabaty na usługi", "Szybkie terminy",
];

/* Kalkulator: середина Варшавы, «od-do» за элемент (SOURCES.md). Klasa — множитель лака и пакетов. */
export const CAR = [
  { id: "m", t: "Miejskie", k: 1 },
  { id: "c", t: "Kompakt / sedan", k: 1.1 },
  { id: "s", t: "SUV / kombi", k: 1.25 },
  { id: "v", t: "Dostawcze", k: 1.35 },
];
export const DAMAGE = [
  { id: "pdr", t: "Wgniecenie", lo: 250, hi: 450, k: false },
  { id: "rys", t: "Rysa", lo: 150, hi: 300, k: false },
  { id: "lak", t: "Lakierowanie", lo: 700, hi: 1000, k: true },
];
export const PACKS = [
  { id: "none", t: "Bez pakietu", d: "Tylko zaznaczone uszkodzenia", lo: 0, hi: 0 },
  { id: "fresh", t: "Odświeżenie", d: "Polerowanie jednoetapowe i wosk", lo: 600, hi: 900 },
  { id: "sale", t: "Przed sprzedażą", d: "Mycie, polerowanie, do 3 zaprawek, czyste felgi", lo: 900, hi: 1400 },
  { id: "salon", t: "Jak z salonu", d: "Korekta dwuetapowa i zabezpieczenie lakieru", lo: 1400, hi: 2200 },
];
export const EXTRAS = [
  { id: "felg", t: "Renowacja felg, 4 szt.", lo: 800, hi: 1300, k: false },
  { id: "zap", t: "Zaprawka lakiernicza", lo: 200, hi: 300, k: false, n: true },
];
/* Схема машины сверху: элементы с подписями. */
export const PARTS = [
  ["zp", "Zderzak przedni"], ["mk", "Maska"], ["blp", "Błotnik lewy przedni"], ["bpp", "Błotnik prawy przedni"],
  ["dlp", "Drzwi lewe przednie"], ["dpp", "Drzwi prawe przednie"], ["dlt", "Drzwi lewe tylne"], ["dpt", "Drzwi prawe tylne"],
  ["dc", "Dach"], ["blt", "Błotnik lewy tylny"], ["bpt", "Błotnik prawy tylny"], ["kl", "Klapa bagażnika"], ["zt", "Zderzak tylny"],
];
