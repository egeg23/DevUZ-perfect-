import { PANEL_INTL, defineDict, type PanelLocale, type Tr } from "@/lib/admin/i18n";
import type { MissingPart, WheelIssue } from "@/lib/proto/facts";

/**
 * Раздел «Прототипы» (/admin/proto).
 *
 * Здесь только интерфейс панели. Сам прототип — страница для клиента на его
 * языке (ru или uz, выбирается в форме), и его тексты живут в lib/proto.
 * Замечания машинной проверки (`proto.problems`) пишутся в базу вместе с
 * прототипом и показываются как есть — это отчёт проверки, а не подпись
 * панели. Название компании, адрес сайта, источник — данные.
 */

/** «13.09.26, 18:04» по Ташкенту — в базе время в UTC. */
export function protoWhen(iso: string, locale: PanelLocale): string {
  return new Date(iso).toLocaleString(PANEL_INTL[locale], {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Претензия к снимку для трюка — кодом в адресе: `square:1600x900`, `small:600`, `format`. */
export function wheelToken(issue: WheelIssue): string {
  return issue.code === "square"
    ? `square:${issue.width}x${issue.height}`
    : issue.code === "small"
      ? `small:${issue.width}`
      : "format";
}

const wheelDict = defineDict({
  square: {
    ru: (size: string) => `снимок не квадратный (${size}) — будет крутиться эллипсом`,
    uz: (size: string) => `rasm kvadrat emas (${size}) — ellips bo‘lib aylanadi`,
    pl: (size: string) => `zdjęcie nie jest kwadratowe (${size}) — będzie się obracać jak elipsa`,
  },
  small: {
    ru: (width: string) => `снимок мельче 1200 px (${width}) — на телефоне будет мылом`,
    uz: (width: string) => `rasm 1200 px dan kichik (${width}) — telefonda xira chiqadi`,
    pl: (width: string) => `zdjęcie jest mniejsze niż 1200 px (${width}) — na telefonie będzie rozmyte`,
  },
  format: {
    ru: () => "нужен PNG или WebP с прозрачным фоном: у JPEG вокруг колеса поедет квадрат",
    uz: () => "shaffof fonli PNG yoki WebP kerak: JPEG’da g‘ildirak atrofida kvadrat aylanadi",
    pl: () => "potrzebny PNG lub WebP z przezroczystym tłem: przy JPEG wokół koła obróci się kwadrat",
  },
});

const missingDict: Record<MissingPart, Tr<string>> = {
  name: { ru: "название компании", uz: "kompaniya nomi", pl: "nazwa firmy" },
  services: { ru: "хотя бы три услуги", uz: "kamida uchta xizmat", pl: "co najmniej trzy usługi" },
  action: {
    ru: "телеграм, ватсап или телефон для кнопки",
    uz: "tugma uchun Telegram, WhatsApp yoki telefon",
    pl: "Telegram, WhatsApp lub telefon do przycisku",
  },
};

function wheelText(detail: string, locale: PanelLocale): string {
  return detail
    .split(",")
    .filter(Boolean)
    .map((token) => {
      const [code, value = ""] = token.split(":");
      const size = value.replace("x", "×");
      return code === "square" || code === "small" || code === "format" ? wheelDict[code][locale](size) : token;
    })
    .join("; ");
}

function missingText(detail: string, locale: PanelLocale): string {
  return detail
    .split(",")
    .filter(Boolean)
    .map((part) => (part in missingDict ? missingDict[part as MissingPart][locale] : part))
    .join(", ");
}

/**
 * Ответ действия: `?r=код&d=данные`. Коды — свои и SaveFailure из
 * lib/proto/store.ts. В `d` — адрес ответа сайта, ключ ниши, коды
 * недостающего или претензий к снимку; последние переводятся здесь.
 */
export const protoResultDict = defineDict({
  ok: { ru: () => "Готово.", uz: () => "Tayyor.", pl: () => "Gotowe." },
  no_url: {
    ru: () => "Не указан сайт клиента.",
    uz: () => "Mijoz sayti ko‘rsatilmagan.",
    pl: () => "Nie podano strony klienta.",
  },
  no_niche: { ru: () => "Не выбрана ниша.", uz: () => "Nisha tanlanmagan.", pl: () => "Nie wybrano branży." },
  few_services: {
    ru: () => "Нужно хотя бы три услуги — по одной в строке.",
    uz: () => "Kamida uchta xizmat kerak — har biri alohida qatorda.",
    pl: () => "Potrzebne są co najmniej trzy usługi — każda w osobnej linii.",
  },
  collect: {
    ru: (error: string) => `Сайт не разобрался: ${error}`,
    uz: (error: string) => `Saytni tahlil qilib bo‘lmadi: ${error}`,
    pl: (error: string) => `Nie udało się przeanalizować strony: ${error}`,
  },
  wheel_open: {
    ru: () => "Снимок для трюка не открылся или это не картинка.",
    uz: () => "Tryuk uchun rasm ochilmadi yoki bu rasm emas.",
    pl: () => "Zdjęcie do triku się nie otworzyło albo to nie jest grafika.",
  },
  wheel: {
    ru: (issues: string) => `Снимок для трюка: ${wheelText(issues, "ru")}.`,
    uz: (issues: string) => `Tryuk uchun rasm: ${wheelText(issues, "uz")}.`,
    pl: (issues: string) => `Zdjęcie do triku: ${wheelText(issues, "pl")}.`,
  },
  niche: {
    ru: (key: string) => `Ниша «${key}» не заведена.`,
    uz: (key: string) => `«${key}» nishasi kiritilmagan.`,
    pl: (key: string) => `Branża „${key}” nie jest dodana.`,
  },
  missing: {
    ru: (parts: string) => `Не хватает: ${missingText(parts, "ru")}.`,
    uz: (parts: string) => `Yetishmaydi: ${missingText(parts, "uz")}.`,
    pl: (parts: string) => `Brakuje: ${missingText(parts, "pl")}.`,
  },
  offline: {
    ru: () => "База недоступна.",
    uz: () => "Bazaga ulanib bo‘lmadi.",
    pl: () => "Baza danych jest niedostępna.",
  },
  failed: {
    ru: (error: string) => (error ? `Не записалось: ${error}` : "Не записалось."),
    uz: (error: string) => (error ? `Saqlab bo‘lmadi: ${error}` : "Saqlab bo‘lmadi."),
    pl: (error: string) => (error ? `Nie zapisano: ${error}` : "Nie zapisano."),
  },
  draft: {
    ru: () => "Собрано, но отправлять нельзя — что не так, написано у прототипа в списке ниже.",
    uz: () => "Yig‘ildi, lekin yuborib bo‘lmaydi — nima noto‘g‘riligi quyidagi ro‘yxatda prototip ostida yozilgan.",
    pl: () => "Zbudowano, ale nie można wysłać — co jest nie tak, opisano przy prototypie na liście poniżej.",
  },
  not_ready: {
    ru: () => "Отправить можно только готовый прототип.",
    uz: () => "Faqat tayyor prototipni yuborish mumkin.",
    pl: () => "Wysłać można tylko gotowy prototyp.",
  },
});

/** Ниши на польском: в каталоге ниш названия только на языках прототипа. */
export const protoNichePl: Record<string, string> = {
  shinomontazh: "Wulkanizacja",
  avtoservis: "Serwis samochodowy",
  avtomoyka: "Myjnia samochodowa",
  barbershop: "Barbershop",
  "salon-krasoty": "Salon kosmetyczny",
  "nogtevaya-studiya": "Studio paznokci",
  detailing: "Detailing",
  stomatologiya: "Stomatologia",
  "uchebnyy-centr": "Centrum szkoleniowe",
  medcentr: "Centrum medyczne",
};

export const protoDict = defineDict({
  title: { ru: "Прототипы", uz: "Prototiplar", pl: "Prototypy" },
  intro1: {
    ru: "Страница, которую видно вместо разговора «а как это будет выглядеть». Собирается за минуту после первички: адрес его сайта, ниша и услуги, которые он сам назвал. Название, описание, телефон, мессенджеры и логотип снимаются с его сайта — поля ниже нужны, только если там этого нет.",
    uz: "«Bu qanday ko‘rinadi» degan suhbat o‘rniga ko‘rsatiladigan sahifa. Birinchi suhbatdan keyin bir daqiqada yig‘iladi: uning sayti manzili, nishasi va o‘zi aytgan xizmatlar. Nom, tavsif, telefon, messenjerlar va logotip uning saytidan olinadi — quyidagi maydonlar faqat u yerda bular bo‘lmasa kerak.",
    pl: "Strona, którą pokazuje się zamiast rozmowy „a jak to będzie wyglądać”. Buduje się w minutę po pierwszej rozmowie: adres jego strony, branża i usługi, które sam wymienił. Nazwa, opis, telefon, komunikatory i logo są pobierane z jego strony — pola poniżej są potrzebne tylko wtedy, gdy tam tego nie ma.",
  },
  intro2: {
    ru: "Ничего, кроме сказанного им, на странице не появится: ни цифр, ни сроков, ни цен. Кнопка «Записаться» открывает его же телеграм или ватсап с готовым текстом — обращение падает ему, а не нам. Нет мессенджера — кнопка набирает номер, и текст страницы меняется под это сам.",
    uz: "Sahifada u aytganidan boshqa hech narsa chiqmaydi: na raqamlar, na muddatlar, na narxlar. «Yozilish» tugmasi tayyor matn bilan uning o‘z Telegram yoki WhatsAppini ochadi — murojaat bizga emas, unga tushadi. Messenjer bo‘lmasa — tugma raqamni teradi va sahifa matni o‘zi shunga moslashadi.",
    pl: "Na stronie nie pojawi się nic poza tym, co sam powiedział: ani liczby, ani terminy, ani ceny. Przycisk zapisu otwiera jego własny Telegram lub WhatsApp z gotowym tekstem — zapytanie trafia do niego, a nie do nas. Nie ma komunikatora — przycisk wybiera numer, a tekst strony sam się do tego dopasowuje.",
  },
  site: { ru: "Сайт клиента", uz: "Mijoz sayti", pl: "Strona klienta" },
  niche: { ru: "Ниша", uz: "Nisha", pl: "Branża" },
  pageLang: { ru: "Язык страницы", uz: "Sahifa tili", pl: "Język strony" },
  langRu: { ru: "Русский", uz: "Ruscha", pl: "Rosyjski" },
  langUz: { ru: "Узбекский", uz: "O‘zbekcha", pl: "Uzbecki" },
  services: {
    ru: "Услуги — по одной в строке, цена после тире. Пишите так, как он сам их называет.",
    uz: "Xizmatlar — har biri alohida qatorda, narxi tiredan keyin. U o‘zi qanday atasa, shunday yozing.",
    pl: "Usługi — każda w osobnej linii, cena po myślniku. Pisz tak, jak on sam je nazywa.",
  },
  servicesPh: {
    ru: "Замена шин — от 40 000 сум\nБалансировка колеса\nРемонт прокола",
    uz: "Shina almashtirish — 40 000 so‘mdan\nG‘ildirakni balansirovka qilish\nTeshikni ta’mirlash",
    pl: "Wymiana opon — od 40 000 sum\nWyważanie koła\nNaprawa przebicia",
  },
  overrides: {
    ru: "Перебить то, что нашлось на сайте",
    uz: "Saytda topilganini almashtirish",
    pl: "Nadpisz to, co znaleziono na stronie",
  },
  fName: { ru: "Название компании", uz: "Kompaniya nomi", pl: "Nazwa firmy" },
  fCity: { ru: "Город — именительный: Ташкент", uz: "Shahar — masalan: Toshkent", pl: "Miasto — w mianowniku: Taszkent" },
  fHours: { ru: "Часы работы — как у него на сайте", uz: "Ish vaqti — saytidagidek", pl: "Godziny pracy — jak na jego stronie" },
  fAddress: { ru: "Адрес", uz: "Manzil", pl: "Adres" },
  fPhone: { ru: "Телефон", uz: "Telefon", pl: "Telefon" },
  fTelegram: { ru: "Телеграм — без собаки", uz: "Telegram — @ belgisisiz", pl: "Telegram — bez @" },
  fWhatsapp: { ru: "Ватсап — номер", uz: "WhatsApp — raqam", pl: "WhatsApp — numer" },
  fWheel: {
    ru: "Снимок для трюка — ссылка на квадратный PNG от 1200 px",
    uz: "Tryuk uchun rasm — 1200 px dan katta kvadrat PNG havolasi",
    pl: "Zdjęcie do triku — link do kwadratowego PNG od 1200 px",
  },
  fProspect: {
    ru: "ID касания, если прототип по лиду",
    uz: "Agar prototip lid bo‘yicha bo‘lsa, aloqa ID si",
    pl: "ID kontaktu, jeśli prototyp jest dla leada",
  },
  fAbout: {
    ru: "Строка о себе — его словами, не нашими",
    uz: "O‘zi haqida bir qator — bizning emas, uning so‘zlari bilan",
    pl: "Linijka o sobie — jego słowami, nie naszymi",
  },
  build: { ru: "Собрать прототип", uz: "Prototipni yig‘ish", pl: "Zbuduj prototyp" },
  draft: { ru: "черновик", uz: "qoralama", pl: "szkic" },
  ready: { ru: "готов", uz: "tayyor", pl: "gotowy" },
  sent: { ru: "отправлен", uz: "yuborilgan", pl: "wysłany" },
  auto: {
    ru: "собран сам, для касания",
    uz: "o‘zi yig‘ildi, aloqa uchun",
    pl: "zbudowany automatycznie, do kontaktu",
  },
  draftNote: {
    ru: "Черновик наружу не уходит: по ссылке будет 404, пока проверка не пройдена.",
    uz: "Qoralama tashqariga chiqmaydi: tekshiruvdan o‘tmaguncha havola 404 beradi.",
    pl: "Szkic nie wychodzi na zewnątrz: link zwraca 404, dopóki kontrola nie przejdzie.",
  },
  copyLink: { ru: "Скопировать ссылку", uz: "Havolani nusxalash", pl: "Kopiuj link" },
  markSent: { ru: "Отправил клиенту", uz: "Mijozga yubordim", pl: "Wysłałem klientowi" },
  opened: {
    ru: (date: string, opens: number) => `открыл ${date}${opens > 1 ? `, заходов: ${opens}` : ""}`,
    uz: (date: string, opens: number) => `${date} da ochgan${opens > 1 ? `, kirishlar: ${opens}` : ""}`,
    pl: (date: string, opens: number) => `otworzył ${date}${opens > 1 ? `, wejść: ${opens}` : ""}`,
  },
  notOpened: { ru: "ещё не открывал", uz: "hali ochmagan", pl: "jeszcze nie otworzył" },
  empty: { ru: "Прототипов пока нет.", uz: "Hozircha prototiplar yo‘q.", pl: "Na razie brak prototypów." },
});
