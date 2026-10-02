import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Раздел «Использование» (/admin/usage) — только владельцу: чем команда
 * пользуется в панели.
 *
 * Подписи разделов и функций, вердикты «ядро» / «у единиц» / «никто —
 * шум?» — Tr-таблицы в lib/admin/usage.ts (TRACKED, FEATURES, VERDICT_TITLE).
 */
export const usageDict = defineDict({
  title: { ru: "Чем пользуется команда", uz: "Jamoa nimadan foydalanadi", pl: "Z czego korzysta zespół" },
  days: {
    ru: (n: number) => `${n} ${plural("ru", n, "день", "дня", "дней")}`,
    uz: (n: number) => `${n} kun`,
    pl: (n: number) => `${n} ${plural("pl", n, "dzień", "dni", "dni")}`,
  },
  intro: {
    ru: (n: number) =>
      `Менеджеры и руководители, без вас. Команда этот отчёт не видит. Стрелки — против предыдущих ${n} ${plural("ru", n, "дня", "дней", "дней")}.`,
    uz: (n: number) =>
      `Menejerlar va rahbarlar, sizsiz. Jamoa bu hisobotni ko‘rmaydi. Strelkalar — oldingi ${n} kunga nisbatan.`,
    pl: (n: number) =>
      `Menedżerowie i kierownicy, bez Ciebie. Zespół nie widzi tego raportu. Strzałki — w porównaniu z poprzednimi ${n} ${plural("pl", n, "dniem", "dniami", "dniami")}.`,
  },
  offline: {
    ru: "База ответила не полностью — цифры ниже могут быть неполными.",
    uz: "Baza to‘liq javob bermadi — quyidagi raqamlar to‘liq bo‘lmasligi mumkin.",
    pl: "Baza nie odpowiedziała w pełni — liczby poniżej mogą być niekompletne.",
  },
  since: {
    ru: (date: string) => `Просмотры разделов считаются с ${date}; до этого — «не знаем», а не «ноль».`,
    uz: (date: string) => `Bo‘limlarni ko‘rishlar ${date} dan hisoblanadi; undan oldingisi — «nol» emas, «bilmaymiz».`,
    pl: (date: string) => `Wyświetlenia sekcji liczą się od ${date}; wcześniej — «nie wiemy», a nie «zero».`,
  },
  sinceNone: {
    ru: "Просмотры разделов начнут считаться с первого захода кого-то из команды после выкатки.",
    uz: "Bo‘limlarni ko‘rishlar yangilanishdan keyin jamoadan kimdir birinchi marta kirganda hisoblana boshlaydi.",
    pl: "Wyświetlenia sekcji zaczną się liczyć od pierwszego wejścia kogoś z zespołu po wdrożeniu.",
  },
  /** `unused` — вердикт «никто — шум?», как он написан в таблице. */
  legend: {
    ru: (unused: string) =>
      `Действия — из журнала, он ведётся с первого дня. «${unused}» — это вопрос, а не приговор: функцией могут не пользоваться, потому что она не нужна, а могут — потому что о ней не знают.`,
    uz: (unused: string) =>
      `Amallar — jurnaldan, u birinchi kundan yuritiladi. «${unused}» — bu hukm emas, savol: funksiyadan u kerak bo‘lmagani uchun foydalanmasliklari mumkin, yoki u haqda bilmaganlari uchun.`,
    pl: (unused: string) =>
      `Działania — z dziennika, prowadzonego od pierwszego dnia. «${unused}» to pytanie, a nie wyrok: z funkcji można nie korzystać, bo jest niepotrzebna, albo dlatego, że nikt o niej nie wie.`,
  },
  of: {
    ru: (n: number, of: number) => `${n} из ${of}`,
    uz: (n: number, of: number) => `${of} tadan ${n}`,
    pl: (n: number, of: number) => `${n} z ${of}`,
  },
  ofTail: {
    ru: (of: number) => ` из ${of}`,
    uz: (of: number) => ` / ${of}`,
    pl: (of: number) => ` z ${of}`,
  },
  tileActive: { ru: "заходили или что-то делали", uz: "kirgan yoki biror narsa qilgan", pl: "weszli lub coś zrobili" },
  tileViews: { ru: "просмотров разделов", uz: "bo‘limlarni ko‘rishlar", pl: "wyświetleń sekcji" },
  tileActions: { ru: "действий в работе", uz: "ishdagi amallar", pl: "działań w pracy" },
  tileUnused: {
    ru: "разделов и функций, которыми никто не пользовался",
    uz: "hech kim foydalanmagan bo‘lim va funksiyalar",
    pl: "sekcji i funkcji, z których nikt nie korzystał",
  },

  sectionsTitle: { ru: "Разделы — что открывают", uz: "Bo‘limlar — nimani ochishadi", pl: "Sekcje — co otwierają" },
  colSection: { ru: "Раздел", uz: "Bo‘lim", pl: "Sekcja" },
  colPeople: { ru: "Людей", uz: "Odamlar", pl: "Osób" },
  colViews: { ru: "Просмотров", uz: "Ko‘rishlar", pl: "Wyświetleń" },
  colDays: { ru: "Дней", uz: "Kunlar", pl: "Dni" },
  colTrend: { ru: "Динамика", uz: "Dinamika", pl: "Trend" },

  featuresTitle: { ru: "Функции — что нажимают", uz: "Funksiyalar — nimani bosishadi", pl: "Funkcje — co klikają" },
  featuresNote: {
    ru: "«Через бота» — сколько раз из этого сделано кнопкой в Telegram, а не в панели.",
    uz: "«Bot orqali» — bundan necha marta panelda emas, Telegram’dagi tugma bilan qilingan.",
    pl: "«Przez bota» — ile razy zrobiono to przyciskiem w Telegramie, a nie w panelu.",
  },
  colFeature: { ru: "Функция", uz: "Funksiya", pl: "Funkcja" },
  colCount: { ru: "Раз", uz: "Marta", pl: "Razy" },
  colViaBot: { ru: "Через бота", uz: "Bot orqali", pl: "Przez bota" },
  colLast: { ru: "Последний раз", uz: "Oxirgi marta", pl: "Ostatnio" },

  peopleTitle: { ru: "Люди — кто чем живёт", uz: "Odamlar — kim nima bilan band", pl: "Ludzie — kto czym żyje" },
  colWho: { ru: "Кто", uz: "Kim", pl: "Kto" },
  colLogins: { ru: "Входов", uz: "Kirishlar", pl: "Logowań" },
  colActions: { ru: "Действий", uz: "Amallar", pl: "Działań" },
  colActiveDays: { ru: "Активных дней", uz: "Faol kunlar", pl: "Aktywnych dni" },
  colTop: { ru: "Чаще всего открывает", uz: "Eng ko‘p ochadi", pl: "Najczęściej otwiera" },
  neverSeen: { ru: "не заходил", uz: "kirmagan", pl: "nie logował się" },
});
