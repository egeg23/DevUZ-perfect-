import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * «Рынки» (/admin/markets) — где искать клиентов по странам. Данные о
 * площадках — content/markets.ts, названия площадок не переводятся.
 */
export const marketsDict = defineDict({
  title: { ru: "Рынки", uz: "Bozorlar", pl: "Rynki" },
  lead: {
    ru: "Где искать клиентов за пределами Узбекистана. Выберите страну: там биржи, каталоги студий, доски объявлений, тендеры и Telegram-чаты — со ссылками и тем, как на каждой площадке работать.",
    uz: "O‘zbekistondan tashqarida mijozlarni qayerdan qidirish kerak. Mamlakatni tanlang: u yerda frilans birjalari, studiyalar katalogi, e’lonlar taxtasi, tenderlar va Telegram chatlari — havolalar bilan va har bir maydonda qanday ishlash kerakligi bilan.",
    pl: "Gdzie szukać klientów poza Uzbekistanem. Wybierz kraj: są tam giełdy, katalogi agencji, tablice ogłoszeń, przetargi i czaty w Telegramie — z linkami i tym, jak pracować na każdej platformie.",
  },
  priority_high: { ru: "главный рынок", uz: "asosiy bozor", pl: "rynek główny" },
  priority_mid: { ru: "пробуем", uz: "sinab ko‘ramiz", pl: "próbujemy" },
  priority_low: { ru: "по случаю", uz: "imkon bo‘lganda", pl: "przy okazji" },
  places: {
    ru: (n: number) => `${n} ${plural("ru", n, "площадка", "площадки", "площадок")}`,
    uz: (n: number) => `${n} ta maydon`,
    pl: (n: number) => `${n} ${plural("pl", n, "platforma", "platformy", "platform")}`,
  },
  open: { ru: "Открыть →", uz: "Ochish →", pl: "Otwórz →" },
  back: { ru: "← Все рынки", uz: "← Barcha bozorlar", pl: "← Wszystkie rynki" },
  start: { ru: "С чего начать", uz: "Nimadan boshlash kerak", pl: "Od czego zacząć" },
  how: { ru: "Как работать:", uz: "Qanday ishlash kerak:", pl: "Jak pracować:" },
  kind_freelance: { ru: "Биржи фриланса", uz: "Frilans birjalari", pl: "Giełdy freelance" },
  kind_catalog: { ru: "Каталоги и рейтинги студий", uz: "Studiyalar kataloglari va reytinglari", pl: "Katalogi i rankingi agencji" },
  kind_classifieds: { ru: "Доски объявлений", uz: "E’lonlar taxtalari", pl: "Tablice ogłoszeń" },
  kind_tender: { ru: "Тендеры и закупки", uz: "Tenderlar va xaridlar", pl: "Przetargi i zamówienia" },
  kind_telegram: { ru: "Telegram-чаты и каналы", uz: "Telegram chatlari va kanallari", pl: "Czaty i kanały w Telegramie" },
  kind_maps: { ru: "Карты и справочники компаний", uz: "Xaritalar va kompaniyalar ma’lumotnomalari", pl: "Mapy i katalogi firm" },
  kind_community: { ru: "Сообщества", uz: "Hamjamiyatlar", pl: "Społeczności" },
  cost_free: { ru: "бесплатно", uz: "bepul", pl: "bezpłatnie" },
  cost_freemium: { ru: "частично платно", uz: "qisman pullik", pl: "częściowo płatne" },
  cost_paid: { ru: "платно", uz: "pullik", pl: "płatne" },
  toScout: { ru: "Скауту", uz: "Skautga", pl: "Do skauta" },
  toScoutHint: {
    ru: "Добавить в «Группы для скаута»: он вступит сам и будет приносить сигналы",
    uz: "«Skaut uchun guruhlar»ga qo‘shish: u o‘zi qo‘shiladi va signallar olib keladi",
    pl: "Dodać do «Grupy dla skauta»: sam dołączy i będzie przynosić sygnały",
  },
  scoutAdded: {
    ru: "Добавлено в «Группы для скаута» — скаут вступит в свою очередь.",
    uz: "«Skaut uchun guruhlar»ga qo‘shildi — skaut navbati kelganda qo‘shiladi.",
    pl: "Dodano do «Grupy dla skauta» — skaut dołączy, gdy przyjdzie kolej.",
  },
  scoutExists: { ru: "Эта группа уже у скаута.", uz: "Bu guruh skautda allaqachon bor.", pl: "Ta grupa jest już u skauta." },
  scoutFailed: {
    ru: "Скауту добавить не получилось — попробуйте ещё раз.",
    uz: "Skautga qo‘shib bo‘lmadi — yana urinib ko‘ring.",
    pl: "Nie udało się dodać do skauta — spróbuj jeszcze raz.",
  },
  checked: {
    ru: "Ссылки проверены 06.11.2026. Сайт не открылся или площадка закрылась — скажите руководителю, список поправим.",
    uz: "Havolalar 06.11.2026 da tekshirilgan. Sayt ochilmasa yoki maydon yopilgan bo‘lsa — rahbarga ayting, ro‘yxatni tuzatamiz.",
    pl: "Linki sprawdzone 06.11.2026. Strona się nie otwiera albo platforma się zamknęła — powiedz kierownikowi, poprawimy listę.",
  },
});
