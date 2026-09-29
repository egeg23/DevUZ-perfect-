import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Раздел «Расходы студии» (/admin/expenses): налоговые сроки, доли
 * соучредителей и список трат.
 *
 * Статья расхода — из lib/admin/finance.ts (EXPENSE_TR), название налога —
 * taxTitleDict из dashboard.ts: те же подписи, что на главной владельца.
 * Имена соучредителей и заметка «на что» — данные, не переводятся.
 */

/**
 * Что сдаётся по налоговому сроку (lib/admin/tax-calendar.ts, `what`), по
 * `id`. Русский текст в lib остаётся для бота и модели-наставника.
 */
export const taxWhatDict = defineDict({
  turnover: {
    ru: "Декларация и уплата за прошлый период",
    uz: "O‘tgan davr uchun deklaratsiya va to‘lov",
    pl: "Deklaracja i zapłata za poprzedni okres",
  },
  social: {
    ru: "Отчисления за себя как за ИП",
    uz: "YaTT sifatida o‘zingiz uchun ajratmalar",
    pl: "Składki za siebie jako przedsiębiorcę",
  },
  annual: {
    ru: "Итоговая декларация за год",
    uz: "Yil uchun yakuniy deklaratsiya",
    pl: "Roczna deklaracja końcowa",
  },
});

export const expensesDict = defineDict({
  title: { ru: "Расходы студии", uz: "Studiya xarajatlari", pl: "Wydatki studia" },
  intro: {
    ru: "Общие траты студии: реклама, сервисы, подрядчики. Делятся между соучредителями в той же пропорции, что и прибыль. Себестоимость конкретного проекта сюда не идёт — она уже вычтена в самом проекте.",
    uz: "Studiyaning umumiy xarajatlari: reklama, servislar, pudratchilar. Hammuassislar o‘rtasida foyda bilan bir xil nisbatda bo‘linadi. Aniq loyihaning tannarxi bu yerga kirmaydi — u loyihaning o‘zida ayirib bo‘lingan.",
    pl: "Wspólne wydatki studia: reklama, usługi, podwykonawcy. Dzielą się między współzałożycieli w tej samej proporcji co zysk. Koszt wytworzenia konkretnego projektu tu nie trafia — jest już odjęty w samym projekcie.",
  },
  taxesSoon: { ru: "Налоги: что подходит", uz: "Soliqlar: muddati yaqinlashayotganlar", pl: "Podatki: co się zbliża" },
  noTaxes: {
    ru: "В ближайшие две недели сроков нет.",
    uz: "Yaqin ikki haftada muddatlar yo‘q.",
    pl: "W najbliższych dwóch tygodniach nie ma terminów.",
  },
  inDays: {
    ru: (n: number) => `через ${n} дн.`,
    uz: (n: number) => `${n} kundan keyin`,
    pl: (n: number) => `za ${n} ${plural("pl", n, "dzień", "dni", "dni")}`,
  },
  unverified: {
    ru: "дата не подтверждена бухгалтером",
    uz: "sana buxgalter tomonidan tasdiqlanmagan",
    pl: "data niepotwierdzona przez księgowego",
  },
  taxNote: {
    ru: "Сроки выше — заготовка под разговор с бухгалтером, а не инструкция. Режим ИП зависит от оборота и вида деятельности, правила меняются, и знать их наверняка может только тот, кто ведёт конкретное ИП. Календарь, которому доверяют по ошибке, опаснее отсутствующего.",
    uz: "Yuqoridagi muddatlar — buxgalter bilan suhbat uchun qoralama, ko‘rsatma emas. YaTT rejimi aylanma va faoliyat turiga bog‘liq, qoidalar o‘zgaradi va ularni aniq faqat shu YaTTni yuritayotgan odam biladi. Xato bilan ishoniladigan kalendar umuman yo‘q kalendardan xavfliroq.",
    pl: "Terminy powyżej to punkt wyjścia do rozmowy z księgowym, a nie instrukcja. Forma opodatkowania zależy od obrotu i rodzaju działalności, przepisy się zmieniają i na pewno zna je tylko osoba, która prowadzi daną działalność. Kalendarz, któremu ufa się przez pomyłkę, jest groźniejszy niż jego brak.",
  },
  total: { ru: "Всего расходов", uz: "Jami xarajatlar", pl: "Wydatki łącznie" },
  where: { ru: "Куда уходит", uz: "Qayerga ketadi", pl: "Na co idzie" },
  add: { ru: "Добавить расход", uz: "Xarajat qo‘shish", pl: "Dodaj wydatek" },
  notePh: { ru: "на что", uz: "nimaga", pl: "na co" },
  record: { ru: "Записать", uz: "Yozish", pl: "Zapisz" },
  all: { ru: "Все траты", uz: "Barcha xarajatlar", pl: "Wszystkie wydatki" },
  empty: { ru: "Пока ничего не записано.", uz: "Hozircha hech narsa yozilmagan.", pl: "Nic jeszcze nie zapisano." },
  colWhen: { ru: "Когда", uz: "Qachon", pl: "Kiedy" },
  colCategory: { ru: "Статья", uz: "Modda", pl: "Kategoria" },
  colWhat: { ru: "На что", uz: "Nimaga", pl: "Na co" },
  colAmount: { ru: "Сумма", uz: "Summa", pl: "Kwota" },
  remove: { ru: "убрать", uz: "olib tashlash", pl: "usuń" },
});
