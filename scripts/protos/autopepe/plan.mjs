// Конструктор цены AutoPepe: сайт и допы тумблерами.
//
// Владелец DevUz, 29.10.2026: «Стоимость для клиента без допников 1000$, с
// допами не более 3000$. Поставь в допы то, что клиенту реально нужно
// будет». Образец — neoline/plan.mjs: тумблер включает и выключает настоящий
// блок на сайте (data-addon="<id>"), итог считается сразу.
//
// Обычная цена — 2 500 $: сайт услуг с калькулятором и записью у варшавских
// студий стоит 8-15 тыс. zł (SOURCES.md, «Цены студий»). Допы — то, чем
// сильные кузовные в Варшаве берут клиента: ремонт по фото, статус ремонта,
// запись онлайн, ущерб по OC шаг за шагом, SMS, второй язык для украинских и
// англоязычных водителей, местный поиск, флот. Все вместе — ровно 2 000 $.

export const BASE = {
  price: 2500,
  promo: 1000,
  t: "Strona AutoPepe",
  d: "Nowa strona pod telefon: wjazd kamery w znak, lakier, który reaguje na ruch, scena „Od wgniecenia do lustra”, sześć usług, przed i po z Waszych zdjęć, kalkulator ze schematem auta, szkoda z OC, dojazd i kontakt.",
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

export const ADDONS = [
  { id: "foto", price: 300, star: true,
    t: "Wycena ze zdjęć", e: "Klient zaznacza uszkodzenie na schemacie, dodaje zdjęcia z telefonu i numer. Zgłoszenie ląduje w panelu, Wy oddzwaniacie z ceną.",
    who: "główny haczyk warszawskich blacharni" },
  { id: "status", price: 250, star: true,
    t: "Status naprawy online", e: "Klient wpisuje numer zlecenia i widzi etap: przyjęte, blacharka, lakiernia, polerowanie, do odbioru. Zmieniacie go jednym kliknięciem w panelu.",
    who: "mniej telefonów „czy już gotowe?”" },
  { id: "termin", price: 200, star: true,
    t: "Rezerwacja terminu", e: "Wolne godziny pn-pt 8-16 w kalendarzu, klient wybiera dzień i godzinę oględzin. Zajęte znikają same.",
    who: "terminy bez dzwonienia" },
  { id: "oc", price: 200,
    t: "Szkoda z OC krok po kroku", e: "Co zabrać, jak zgłosić szkodę, kto płaci. Formularz z numerem szkody i polisy, który trafia do panelu.",
    who: "klient z kolizji szuka tego najpierw" },
  { id: "admin", price: 400, star: true,
    t: "Panel warsztatu", e: "Zgłoszenia ze strony na górze listy, statusy napraw widoczne dla klienta, kalendarz, materiały, historia działań. Recepcja nie widzi marży.",
    who: "jak we wzorcowym panelu Greenwell" },
  { id: "sms", price: 150,
    t: "SMS do klienta", e: "„Auto gotowe do odbioru”, przypomnienie dzień przed terminem i prośba o opinię w Google po odbiorze.",
    who: "opinie Google ciągną ruch z map" },
  { id: "lang", price: 200,
    t: "Wersja ukraińska i angielska", e: "Cała strona i kalkulator po ukraińsku i angielsku. W Warszawie jeździ wielu kierowców, którzy szukają warsztatu w swoim języku.",
    who: "rzadkość wśród blacharni na Wawrze" },
  { id: "seo", price: 200,
    t: "Lokalne wyszukiwanie", e: "Strony pod „blacharz Wawer”, „usuwanie wgnieceń Warszawa”, „renowacja felg Warszawa” i uporządkowany profil w Mapach Google.",
    who: "frazy sprawdzimy w Google Trends przed pisaniem" },
  { id: "flota", price: 100,
    t: "Strona dla firm i flot", e: "Rabaty, odprowadzenie auta po naprawie, szybkie terminy i jedno zgłoszenie na kilka aut naraz.",
    who: "macie to w ofercie, warto pokazać" },
];

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
