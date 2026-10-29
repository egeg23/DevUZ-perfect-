// Конструктор цены AutoPepe: сайт и допы тумблерами, цены в злотых.
//
// Владелец DevUz, 29.10.2026: «Стоимость для клиента без допников 1000$, с
// допами не более 3000$. Поставь в допы то, что клиенту реально нужно
// будет»; в тот же день: «Польский язык на сайте только, цены в злотых, допы
// со скидкой 60% от рынка Польши». Образец — neoline/plan.mjs: тумблер
// включает и выключает настоящий блок на сайте (data-addon="<id>").
//
// Курс — NBP, октябрь 2026: 3,88-3,92 zł за доллар (SOURCES.md). Сайт —
// 3 900 zł (1 000 $), обычная цена 9 900 zł (2 500 $): сайт фирмы с
// калькулятором и формами в Польше — от 6 000 zł в среднем и больше 12 000 zł
// с интеграциями (cenauslug.pl, Orange). Допы: market — цена польских студий
// за такую работу, наша — 40% от неё (−60%). Всё вместе 11 500 zł, около
// 2 950 $: в слово владельца «не больше 3 000 $» укладывается. Договор
// считается в долларах, поэтому scripts/mockup-plans.mjs этот план
// пропускает («цены не в долларах»), как Medikor и Сияние.

/** Валюта плана: не доллары. */
export const CUR = "zł";
/** Скидка на допы от польского рынка. */
export const OFF = 0.6;

export const BASE = {
  price: 9900,
  promo: 3900,
  t: "Strona AutoPepe",
  d: "Nowa strona pod telefon: wjazd kamery w znak, lakier, który reaguje na ruch, scena „Od wgniecenia do lustra”, sześć usług, przed i po z Waszych zdjęć, kalkulator ze schematem auta, szkoda z OC, dojazd i kontakt.",
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;

const off = (a) => ({ ...a, price: Math.round((a.market * (1 - OFF)) / 10) * 10 });
export const ADDONS = [
  { id: "foto", market: 2500, star: true,
    t: "Wycena ze zdjęć", e: "Klient zaznacza uszkodzenie na schemacie, dodaje zdjęcia z telefonu i numer. Zgłoszenie ląduje w panelu, Wy oddzwaniacie z ceną.",
    who: "główny haczyk warszawskich blacharni" },
  { id: "status", market: 2000, star: true,
    t: "Status naprawy online", e: "Klient wpisuje numer zlecenia i widzi etap: przyjęte, blacharka, lakiernia, polerowanie, do odbioru. Zmieniacie go jednym kliknięciem w panelu.",
    who: "mniej telefonów „czy już gotowe?”" },
  { id: "termin", market: 2500, star: true,
    t: "Rezerwacja terminu", e: "Wolne godziny pn-pt 8-16 w kalendarzu, klient wybiera dzień i godzinę oględzin. Zajęte znikają same.",
    who: "terminy bez dzwonienia" },
  { id: "oc", market: 1500,
    t: "Szkoda z OC krok po kroku", e: "Co zabrać, jak zgłosić szkodę, kto płaci. Formularz z numerem szkody i polisy, który trafia do panelu.",
    who: "klient z kolizji szuka tego najpierw" },
  { id: "admin", market: 5000, star: true,
    t: "Panel warsztatu", e: "Zgłoszenia ze strony na górze listy, statusy napraw widoczne dla klienta, kalendarz, materiały, historia działań. Recepcja nie widzi marży.",
    who: "jak we wzorcowym panelu Greenwell" },
  { id: "sms", market: 1500,
    t: "SMS do klienta", e: "„Auto gotowe do odbioru”, przypomnienie dzień przed terminem i prośba o opinię w Google po odbiorze.",
    who: "opinie Google ciągną ruch z map" },
  { id: "seo", market: 3000,
    t: "Lokalne wyszukiwanie", e: "Strony pod „blacharz Wawer”, „usuwanie wgnieceń Warszawa”, „renowacja felg Warszawa” i uporządkowany profil w Mapach Google.",
    who: "frazy sprawdzimy w Google Trends przed pisaniem" },
  { id: "flota", market: 1000,
    t: "Strona dla firm i flot", e: "Rabaty, odprowadzenie auta po naprawie, szybkie terminy i jedno zgłoszenie na kilka aut naraz.",
    who: "macie to w ofercie, warto pokazać" },
].map(off);

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
