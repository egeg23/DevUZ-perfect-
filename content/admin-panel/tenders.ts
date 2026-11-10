import { defineDict } from "@/lib/admin/i18n";

/**
 * Раздел «Тендеры» (/admin/tenders): лоты с площадок закупок, которые скаут
 * отобрал как наши. Название лота, заказчик и регион — данные площадки и не
 * переводятся.
 */
export const tendersDict = defineDict({
  title: { ru: "Тендеры", uz: "Tenderlar", pl: "Przetargi" },
  lead: {
    ru: "Скаут раз в 30 минут читает площадки закупок и оставляет только то, что делает студия: сайт, приложение, бот, ИИ, CRM, платформа, информационная система. Каждый новый лот приходит в бот лидом — его берут, как обычный лид.",
    uz: "Skaut har 30 daqiqada xarid maydonchalarini o‘qiydi va faqat studiya qiladigan ishlarni qoldiradi: sayt, ilova, bot, sun’iy intellekt, CRM, platforma, axborot tizimi. Har bir yangi lot botga lid bo‘lib keladi — uni oddiy lid kabi olishadi.",
    pl: "Skaut co 30 minut czyta platformy zamówień i zostawia tylko to, co robi studio: strona, aplikacja, bot, AI, CRM, platforma, system informacyjny. Każdy nowy lot trafia do bota jako lead — bierze się go jak zwykły lead.",
  },
  priceRule: {
    ru: "Перед подачей заявки — связаться с Егором или Александром и запросить цену. Без согласованной цены не подаём.",
    uz: "Ariza topshirishdan oldin — Yegor yoki Aleksandr bilan bog‘lanib, narxni so‘rang. Kelishilgan narxsiz topshirmaymiz.",
    pl: "Przed złożeniem oferty — skontaktuj się z Jegorem lub Aleksandrem i zapytaj o cenę. Bez uzgodnionej ceny nie składamy.",
  },
  contact: { ru: "Контакт", uz: "Aloqa", pl: "Kontakt" },
  inn: { ru: "ИНН", uz: "STIR", pl: "NIP" },
  leadCard: { ru: "Карточка лида", uz: "Lid kartasi", pl: "Karta leada" },
  done: { ru: "Готово.", uz: "Tayyor.", pl: "Gotowe." },
  failed: { ru: "Не получилось.", uz: "Bo‘lmadi.", pl: "Nie udało się." },
  notReady: {
    ru: "Раздел ещё не включён: таблица тендеров не создана. Как только её создадут, скаут начнёт складывать лоты сюда.",
    uz: "Bo‘lim hali yoqilmagan: tenderlar jadvali yaratilmagan. U yaratilishi bilan skaut lotlarni shu yerga yig‘a boshlaydi.",
    pl: "Sekcja nie jest jeszcze włączona: tabela przetargów nie istnieje. Gdy tylko powstanie, skaut zacznie zbierać tu loty.",
  },
  lastScan: { ru: "Последний проход", uz: "Oxirgi o‘tish", pl: "Ostatnie przejście" },
  never: { ru: "ещё не было", uz: "hali bo‘lmagan", pl: "jeszcze nie było" },
  seen: { ru: "лотов на площадке", uz: "maydonchadagi lotlar", pl: "lotów na platformie" },
  ours: { ru: "наших", uz: "bizniki", pl: "naszych" },
  sourceError: { ru: "не прочиталась", uz: "o‘qilmadi", pl: "nie wczytała się" },
  all: { ru: "Все", uz: "Hammasi", pl: "Wszystkie" },
  empty: {
    ru: "Здесь пока пусто. Новые наши лоты появятся после следующего прохода скаута.",
    uz: "Hozircha bo‘sh. Yangi lotlar skautning keyingi o‘tishidan keyin paydo bo‘ladi.",
    pl: "Na razie pusto. Nowe loty pojawią się po następnym przejściu skauta.",
  },
  customer: { ru: "Заказчик", uz: "Buyurtmachi", pl: "Zamawiający" },
  price: { ru: "Стартовая цена", uz: "Boshlang‘ich narx", pl: "Cena wywoławcza" },
  deadline: { ru: "Приём заявок до", uz: "Arizalar qabuli", pl: "Przyjmowanie ofert do" },
  daysLeft: {
    ru: (d: number) => (d <= 0 ? "сегодня последний день" : `осталось ${d} дн.`),
    uz: (d: number) => (d <= 0 ? "bugun oxirgi kun" : `${d} kun qoldi`),
    pl: (d: number) => (d <= 0 ? "dziś ostatni dzień" : `zostało ${d} dn.`),
  },
  closed: { ru: "приём закончен", uz: "qabul tugagan", pl: "przyjmowanie zakończone" },
  open: { ru: "Открыть лот", uz: "Lotni ochish", pl: "Otwórz lot" },
  takenBy: { ru: "Взял", uz: "Oldi", pl: "Wziął" },
  howItWorks: { ru: "Как скаут ищет тендеры", uz: "Skaut tenderlarni qanday qidiradi", pl: "Jak skaut szuka przetargów" },
  foot: {
    ru: "Скаут читает только открытые списки лотов — то, что площадка показывает любому посетителю без входа. Подать заявку — на самой площадке, с ЭЦП компании.",
    uz: "Skaut faqat ochiq lotlar ro‘yxatini o‘qiydi — maydoncha har qanday tashrif buyuruvchiga kirishsiz ko‘rsatadigan narsani. Ariza — maydonchaning o‘zida, kompaniya ERI bilan.",
    pl: "Skaut czyta tylko otwarte listy lotów — to, co platforma pokazuje każdemu bez logowania. Ofertę składa się na samej platformie, podpisem elektronicznym firmy.",
  },
});

/** Статусы лота — кнопки и чипы. */
export const tenderStatusDict = defineDict({
  new: { ru: "Новые", uz: "Yangi", pl: "Nowe" },
  taken: { ru: "Беру", uz: "Olaman", pl: "Biorę" },
  applied: { ru: "Подали", uz: "Topshirildi", pl: "Złożone" },
  skipped: { ru: "Не наше", uz: "Bizniki emas", pl: "Nie nasze" },
});
