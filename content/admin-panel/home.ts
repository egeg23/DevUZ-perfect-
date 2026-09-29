import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Главная панели (раздел «Лиды», /admin): вкладки владельца, счётчики,
 * фильтры, список лидов, плашка о напоминаниях, строка плана касаний.
 *
 * Дашборд роли (плитки, «Срочно связаться», «План и факт», команда,
 * касса, рекомендации) — в content/admin-panel/dashboard.ts.
 *
 * Термины — по content/admin-panel/GLOSSARY.md. Узбекский — латиницей,
 * польский — как в польских CRM.
 */
export const homeDict = defineDict({
  // Вкладки владельца.
  tabToday: { ru: "Сегодня", uz: "Bugun", pl: "Dziś" },
  tabLeads: { ru: "Лиды", uz: "Lidlar", pl: "Leady" },
  tabMoney: { ru: "Деньги", uz: "Pul", pl: "Finanse" },
  tabTeam: { ru: "Команда", uz: "Jamoa", pl: "Zespół" },

  // Просьбы передать лида.
  pendingTitle: {
    ru: (n: number) => `Ждут вашего решения: ${n}`,
    uz: (n: number) => `Qaroringizni kutmoqda: ${n}`,
    pl: (n: number) => `Czeka na Twoją decyzję: ${n}`,
  },

  // Счётчики над списком.
  statTotal: { ru: "всего", uz: "jami", pl: "łącznie" },
  statFree: { ru: "свободных", uz: "bo‘sh", pl: "wolne" },
  statMine: { ru: "на мне", uz: "menda", pl: "moje" },

  // Фильтры.
  allLeads: { ru: "все лиды", uz: "barcha lidlar", pl: "wszystkie leady" },
  freeLeads: { ru: "свободные", uz: "bo‘sh lidlar", pl: "wolne" },
  myLeads: { ru: "мои", uz: "meniki", pl: "moje leady" },
  allPriorities: { ru: "все приоритеты", uz: "barcha ustuvorliklar", pl: "wszystkie priorytety" },
  allStatuses: { ru: "все статусы", uz: "barcha holatlar", pl: "wszystkie statusy" },

  // Листание.
  pagePrev: { ru: "← назад", uz: "← orqaga", pl: "← wstecz" },
  pageNext: { ru: "вперёд →", uz: "oldinga →", pl: "dalej →" },

  listNote: {
    ru:
      "Контактов и переписки в списке нет: контакт открывается в карточке и " +
      "только тому, за кем лид закреплён. Каждое открытие — строка в журнале " +
      "с именем и временем. Свободного лида сначала нужно взять.",
    uz:
      "Ro‘yxatda mijoz kontaktlari va yozishma yo‘q: kontakt lid kartochkasida " +
      "ochiladi va faqat lid biriktirilgan xodimga ko‘rinadi. Har bir ochilish " +
      "jurnalga ism va vaqt bilan yoziladi. Bo‘sh lidni avval o‘zingizga oling.",
    pl:
      "Na liście nie ma danych kontaktowych ani korespondencji: dane kontaktowe " +
      "otwierają się w karcie leada i tylko osobie, do której lead jest przypisany. " +
      "Każde otwarcie to wpis w dzienniku z imieniem i godziną. Wolnego leada trzeba " +
      "najpierw przejąć.",
  },

  offline: {
    ru:
      "База недоступна. Это не «лидов нет» — это значит, что панель сейчас " +
      "ничего не видит; проверьте переменные Supabase на сервере.",
    uz:
      "Baza ishlamayapti. Bu «lid yo‘q» degani emas — panel hozir hech narsani " +
      "ko‘rmayapti; serverdagi Supabase o‘zgaruvchilarini tekshiring.",
    pl:
      "Baza jest niedostępna. To nie znaczy „brak leadów” — panel po prostu nic " +
      "teraz nie widzi; sprawdź zmienne Supabase na serwerze.",
  },

  // Список лидов.
  tableEmpty: {
    ru: "Под фильтр ничего не попало.",
    uz: "Filtr bo‘yicha hech narsa topilmadi.",
    pl: "Brak leadów dla tego filtra.",
  },
  colWhen: { ru: "Когда", uz: "Qachon", pl: "Kiedy" },
  colRequest: { ru: "Заявка", uz: "Ariza", pl: "Zgłoszenie" },
  colWho: { ru: "Кто", uz: "Kim", pl: "Kto" },
  colNiche: { ru: "Ниша", uz: "Soha", pl: "Branża" },
  colBudget: { ru: "Бюджет", uz: "Byudjet", pl: "Budżet" },
  colScore: { ru: "Балл", uz: "Ball", pl: "Ocena" },
  colPriority: { ru: "Приоритет", uz: "Ustuvorlik", pl: "Priorytet" },
  colStatus: { ru: "Статус", uz: "Holat", pl: "Status" },

  // Плашка «напоминания не доставляются».
  sweepTitle: {
    ru: "Напоминания не доставляются.",
    uz: "Eslatmalar yetib bormayapti.",
    pl: "Przypomnienia nie są dostarczane.",
  },
  sweepNever: {
    ru: "Свип ни разу не отработал успешно.",
    uz: "Sweep hali bir marta ham muvaffaqiyatli ishlamagan.",
    pl: "Sweep ani razu nie zakończył się powodzeniem.",
  },
  sweepAgo: {
    ru: (n: number) => `Последний удачный проход был ${n} мин назад — ходить он должен раз в пять.`,
    uz: (n: number) => `Oxirgi muvaffaqiyatli o‘tish ${n} daqiqa oldin bo‘lgan — u har besh daqiqada ishlashi kerak.`,
    pl: (n: number) => `Ostatni udany przebieg był ${n} min temu — powinien uruchamiać się co pięć minut.`,
  },
  sweepLastError: { ru: "Последняя ошибка:", uz: "Oxirgi xato:", pl: "Ostatni błąd:" },
  sweepCheck: {
    ru: "Проверьте на сервере: systemctl status devuz-reminders.timer и переменную REMINDER_SWEEP_SECRET.",
    uz: "Serverda tekshiring: systemctl status devuz-reminders.timer va REMINDER_SWEEP_SECRET o‘zgaruvchisi.",
    pl: "Sprawdź na serwerze: systemctl status devuz-reminders.timer i zmienną REMINDER_SWEEP_SECRET.",
  },
  sweepHint: { ru: "Что это значит", uz: "Bu nimani anglatadi", pl: "Co to oznacza" },

  // Строка плана касаний (слова строки — в touchPlanDict ниже).
  touchPlanHint: {
    ru: "Что считается касанием",
    uz: "Aloqa deb nima hisoblanadi",
    pl: "Co liczy się jako kontakt",
  },

  // Столбики (components/admin/bars.tsx).
  barsEmpty: { ru: "нет данных", uz: "ma’lumot yo‘q", pl: "brak danych" },
  weeklyEmpty: {
    ru: "Пока не по чему считать.",
    uz: "Hozircha hisoblash uchun ma’lumot yo‘q.",
    pl: "Na razie nie ma czego liczyć.",
  },
  weekOf: {
    ru: (week: string, n: number) => `неделя с ${week}: ${n}`,
    uz: (week: string, n: number) => `${week} dan boshlangan hafta: ${n}`,
    pl: (week: string, n: number) => `tydzień od ${week}: ${n}`,
  },
});

/**
 * Недельный план касаний строкой — на главной и в «Касаниях».
 * Собирает её `planLine` (lib/admin/touch-plan.ts).
 */
export const touchPlanDict = defineDict({
  none: {
    ru: "Плана на эту неделю нет.",
    uz: "Bu haftaga reja yo‘q.",
    pl: "Brak planu na ten tydzień.",
  },
  closedOver: {
    ru: (done: number, plan: number) => `План на неделю закрыт: ${done} касаний из ${plan}.`,
    uz: (done: number, plan: number) => `Haftalik reja bajarildi: ${done} ta aloqa, reja — ${plan} ta.`,
    pl: (done: number, plan: number) =>
      `Plan na tydzień wykonany: ${done} ${plural("pl", done, "kontakt", "kontakty", "kontaktów")} z ${plan}.`,
  },
  closed: {
    ru: (done: number, plan: number) => `План на неделю закрыт: ${done} из ${plan}.`,
    uz: (done: number, plan: number) => `Haftalik reja bajarildi: ${done} / ${plan}.`,
    pl: (done: number, plan: number) => `Plan na tydzień wykonany: ${done} z ${plan}.`,
  },
  left: {
    ru: (left: number, done: number, plan: number) =>
      `До плана осталось ${left} — сделано ${done} из ${plan} за эту неделю.`,
    uz: (left: number, done: number, plan: number) =>
      `Rejagacha ${left} ta qoldi — bu hafta ${plan} tadan ${done} tasi bajarildi.`,
    pl: (left: number, done: number, plan: number) =>
      `Do planu zostało ${left} — w tym tygodniu ${done} z ${plan}.`,
  },
});

/** Приоритет лида — фильтр над списком (во множественном числе). */
export const priorityFilterDict = defineDict({
  hot: { ru: "горячие", uz: "issiq", pl: "gorące" },
  warm: { ru: "тёплые", uz: "iliq", pl: "ciepłe" },
  nurture: { ru: "дозреют", uz: "pishib yetiladi", pl: "do dojrzenia" },
  archive: { ru: "архив", uz: "arxiv", pl: "archiwum" },
});

/** Статус лида — фильтр над списком (во множественном числе). */
export const statusFilterDict = defineDict({
  new: { ru: "новые", uz: "yangi", pl: "nowe" },
  taken: { ru: "в работе", uz: "ishda", pl: "w toku" },
  dropped: { ru: "отложены", uz: "qoldirilgan", pl: "odłożone" },
  won: { ru: "выиграны", uz: "yutilgan", pl: "wygrane" },
  lost: { ru: "проиграны", uz: "yutqazilgan", pl: "przegrane" },
});

/** Приоритет одного лида — в строке списка, в «Срочно связаться», в карточке. */
export const priorityDict = defineDict({
  hot: { ru: "горячий", uz: "issiq", pl: "gorący" },
  warm: { ru: "тёплый", uz: "iliq", pl: "ciepły" },
  nurture: { ru: "дозреет", uz: "pishib yetiladi", pl: "do dojrzenia" },
  archive: { ru: "архив", uz: "arxiv", pl: "archiwum" },
});

/** Статус одного лида — в строке списка и в карточке. */
export const statusDict = defineDict({
  new: { ru: "новый", uz: "yangi", pl: "nowy" },
  taken: { ru: "в работе", uz: "ishda", pl: "w toku" },
  dropped: { ru: "отложен", uz: "qoldirilgan", pl: "odłożony" },
  won: { ru: "выиграли", uz: "yutilgan", pl: "wygrany" },
  lost: { ru: "проиграли", uz: "yutqazilgan", pl: "przegrany" },
});

/**
 * Бюджет — не сумма, а то, как клиент говорит о деньгах.
 *
 * Раньше здесь стояли суммы («до 3 тыс.», «от 15 тыс.»), а модель ставит
 * B1–B3 по другому признаку (lib/qualify/prompt.ts): B1 — сумма названа и
 * утверждена, B3 — уходит от разговора о деньгах. Форма и касания получают
 * B3 по умолчанию, и в списке у них стояло «от 15 тыс.» — самый крупный
 * бюджет у лидов, о деньгах которых не знает никто.
 */
export const budgetDict = defineDict({
  B1: { ru: "назван и утверждён", uz: "aytilgan va tasdiqlangan", pl: "podany i zatwierdzony" },
  B2: { ru: "есть, сравнивает", uz: "bor, solishtirmoqda", pl: "jest, porównuje oferty" },
  B3: { ru: "не назван", uz: "aytilmagan", pl: "nie podany" },
});
