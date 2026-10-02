import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Личный дашборд на главной панели (components/admin/dashboard.tsx и
 * dashboard-home.tsx): плитки, «Срочно связаться», «План и факт», команда,
 * касса, договоры, налоги, рекомендации.
 *
 * Сами рекомендации пишет модель по-русски — это данные, их не переводим.
 * Термины — по content/admin-panel/GLOSSARY.md.
 */

const ruDays = (n: number) => `${n} ${plural("ru", n, "день", "дня", "дней")}`;
const plDays = (n: number) => `${n} ${plural("pl", n, "dzień", "dni", "dni")}`;

export const dashboardDict = defineDict({
  // Плитки.
  tileDue: { ru: "к выплате", uz: "to‘lanadi", pl: "do wypłaty" },
  tileFrozen: {
    ru: (sum: string) => `ещё ${sum} ждут оплаты клиентом`,
    uz: (sum: string) => `yana ${sum} mijoz to‘lovini kutmoqda`,
    pl: (sum: string) => `jeszcze ${sum} czeka na płatność klienta`,
  },
  tileInWork: { ru: "лидов в работе", uz: "ishdagi lidlar", pl: "leady w toku" },
  tileUrgent: { ru: "срочно связаться", uz: "zudlik bilan bog‘lanish", pl: "pilny kontakt" },
  tileRevenueMonthMine: { ru: "поступлений за месяц", uz: "oylik tushumlar", pl: "wpływy w miesiącu" },
  tileTeamInWork: { ru: "лидов в работе у команды", uz: "jamoadagi ishdagi lidlar", pl: "leady zespołu w toku" },
  tileRevenueWeek: { ru: "поступлений за неделю", uz: "haftalik tushumlar", pl: "wpływy w tygodniu" },
  tileRevenueMonth: { ru: "поступления за месяц", uz: "shu oydagi tushumlar", pl: "wpływy w tym miesiącu" },
  tileExpensesMonth: { ru: "расходы за месяц", uz: "shu oydagi xarajatlar", pl: "wydatki w tym miesiącu" },
  tileExpected: { ru: "ожидаем от клиентов", uz: "mijozlardan kutilmoqda", pl: "oczekiwane od klientów" },
  tileDueTeam: { ru: "к выплате команде", uz: "jamoaga to‘lanadi", pl: "do wypłaty dla zespołu" },

  // Заголовки рекомендаций.
  reviewWeekly: { ru: "Рекомендации на неделю", uz: "Haftalik tavsiyalar", pl: "Rekomendacje na tydzień" },
  reviewDaily: { ru: "На сегодня", uz: "Bugun uchun", pl: "Na dziś" },

  // «Срочно связаться».
  stuckTitle: { ru: "Срочно связаться", uz: "Zudlik bilan bog‘lanish", pl: "Pilny kontakt" },
  stuckHint: {
    ru: "Когда лид считается срочным",
    uz: "Lid qachon shoshilinch hisoblanadi",
    pl: "Kiedy lead jest pilny",
  },
  stuckIdle: {
    ru: (n: number) => `без движения ${ruDays(n)}`,
    uz: (n: number) => `${n} kundan beri harakatsiz`,
    pl: (n: number) => `bez ruchu od ${plDays(n)}`,
  },
  andMore: {
    ru: (n: number) => `и ещё ${n}`,
    uz: (n: number) => `yana ${n} ta`,
    pl: (n: number) => `i jeszcze ${n}`,
  },
  stuckEmpty: {
    ru: "Все лиды в работе двигались недавно.",
    uz: "Ishdagi barcha lidlarda yaqinda harakat bo‘lgan.",
    pl: "Wszystkie leady w toku miały niedawno ruch.",
  },

  // «План и факт».
  planFact: { ru: "План и факт", uz: "Reja va fakt", pl: "Plan i wykonanie" },
  planFactHint: {
    ru: "Кто ставит план и что считается",
    uz: "Rejani kim qo‘yadi va nima hisoblanadi",
    pl: "Kto ustala plan i co się liczy",
  },
  periodWeek: { ru: "неделя", uz: "hafta", pl: "tydzień" },
  periodMonth: { ru: "месяц", uz: "oy", pl: "miesiąc" },
  planChange: { ru: "изменить", uz: "o‘zgartirish", pl: "zmień" },
  planRemove: { ru: "снять", uz: "olib tashlash", pl: "usuń" },
  noPlanCanAdd: {
    ru: "Плана на этот период нет — поставьте ниже.",
    uz: "Bu davr uchun reja yo‘q — pastda qo‘ying.",
    pl: "Brak planu na ten okres — ustaw go poniżej.",
  },
  noPlan: {
    ru: "Плана на этот период нет. Его ставит руководитель или владелец.",
    uz: "Bu davr uchun reja yo‘q. Uni rahbar yoki egasi qo‘yadi.",
    pl: "Brak planu na ten okres. Ustala go kierownik lub właściciel.",
  },
  planWhom: { ru: "Кому", uz: "Kimga", pl: "Dla kogo" },
  planPeriod: { ru: "Период", uz: "Davr", pl: "Okres" },
  planThisWeek: { ru: "эта неделя", uz: "shu hafta", pl: "ten tydzień" },
  planThisMonth: { ru: "этот месяц", uz: "shu oy", pl: "ten miesiąc" },
  planMetric: { ru: "Показатель", uz: "Ko‘rsatkich", pl: "Wskaźnik" },
  planTarget: { ru: "Цель", uz: "Maqsad", pl: "Cel" },
  planSet: { ru: "Поставить план", uz: "Reja qo‘yish", pl: "Ustaw plan" },

  // Команда за неделю.
  teamTitle: { ru: "Команда за эту неделю", uz: "Jamoa: shu hafta", pl: "Zespół w tym tygodniu" },
  teamHint: { ru: "Что значат столбцы", uz: "Ustunlar nimani bildiradi", pl: "Co oznaczają kolumny" },
  teamArrow: {
    ru: "Стрелка — против прошлой недели.",
    uz: "Strelka — o‘tgan haftaga nisbatan.",
    pl: "Strzałka — w porównaniu z poprzednim tygodniem.",
  },
  colStaff: { ru: "Сотрудник", uz: "Xodim", pl: "Pracownik" },
  colInWork: { ru: "В работе", uz: "Ishda", pl: "W toku" },
  colUrgent: { ru: "Срочно", uz: "Shoshilinch", pl: "Pilne" },
  colTouches: { ru: "Касаний", uz: "Aloqalar", pl: "Kontakty" },
  colContacts: { ru: "Контактов", uz: "Bog‘lanishlar", pl: "Pierwsze kontakty" },
  colWon: { ru: "Выиграно", uz: "Yutilgan", pl: "Wygrane" },
  colRevenue: { ru: "Поступления", uz: "Tushumlar", pl: "Wpływy" },
  colTouchPlan: { ru: "План касаний", uz: "Aloqalar rejasi", pl: "Plan kontaktów" },
  colDue: { ru: "К выплате", uz: "To‘lanadi", pl: "Do wypłaty" },
  touchLeft: {
    ru: (n: number) => `осталось ${n}`,
    uz: (n: number) => `${n} ta qoldi`,
    pl: (n: number) => `zostało ${n}`,
  },

  // Лучшие за неделю.
  bestTitle: { ru: "Лучшие за неделю", uz: "Hafta yetakchilari", pl: "Najlepsi w tygodniu" },
  bestNobody: { ru: "пока никто", uz: "hozircha hech kim", pl: "na razie nikt" },
  bestRevenue: { ru: "по поступлениям:", uz: "tushumlar bo‘yicha:", pl: "wpływy:" },
  bestWon: { ru: "по выигранным:", uz: "yutilgan lidlar bo‘yicha:", pl: "wygrane:" },
  bestTouches: { ru: "по касаниям:", uz: "aloqalar bo‘yicha:", pl: "kontakty:" },

  // Касса по месяцам.
  cashTitle: { ru: "Касса по месяцам", uz: "Oylar bo‘yicha kassa", pl: "Kasa w podziale na miesiące" },
  cashRevenue: { ru: "поступления", uz: "tushumlar", pl: "wpływy" },
  cashExpenses: { ru: "расходы", uz: "xarajatlar", pl: "wydatki" },
  cashAria: {
    ru: "Поступления и расходы по месяцам",
    uz: "Oylar bo‘yicha tushumlar va xarajatlar",
    pl: "Wpływy i wydatki w poszczególnych miesiącach",
  },
  cashNote: {
    ru: "Под месяцем — разница: поступления минус расходы. По кассе, а не по договорам.",
    uz: "Oy ostida — farq: tushumlar minus xarajatlar. Kassa bo‘yicha, shartnomalar bo‘yicha emas.",
    pl: "Pod miesiącem — różnica: wpływy minus wydatki. Według kasy, nie według umów.",
  },

  // Очереди владельца.
  contractsTitle: {
    ru: (n: number) => `Договоры на подпись: ${n}`,
    uz: (n: number) => `Imzolanadigan shartnomalar: ${n}`,
    pl: (n: number) => `Umowy do podpisu: ${n}`,
  },
  contractNo: { ru: "№", uz: "№", pl: "nr" },
  contractsEmpty: { ru: "Ничего не ждёт подписи.", uz: "Imzo kutayotgan hech narsa yo‘q.", pl: "Nic nie czeka na podpis." },
  expectedTitle: {
    ru: (sum: string) => `Ожидаем оплат: ${sum}`,
    uz: (sum: string) => `Kutilayotgan to‘lovlar: ${sum}`,
    pl: (sum: string) => `Oczekiwane płatności: ${sum}`,
  },
  expectedPaid: {
    ru: (paid: string, total: string) => `оплачено ${paid} из ${total}`,
    uz: (paid: string, total: string) => `${total} dan ${paid} to‘langan`,
    pl: (paid: string, total: string) => `zapłacono ${paid} z ${total}`,
  },
  expectedEmpty: {
    ru: "По живым проектам всё оплачено.",
    uz: "Faol loyihalar bo‘yicha hammasi to‘langan.",
    pl: "Aktywne projekty są w pełni opłacone.",
  },

  // Налоги.
  taxTitle: {
    ru: "Налоги и отчётность в ближайшие две недели",
    uz: "Yaqin ikki haftadagi soliqlar va hisobotlar",
    pl: "Podatki i sprawozdania w ciągu najbliższych dwóch tygodni",
  },
  taxToday: { ru: "сегодня", uz: "bugun", pl: "dziś" },
  taxIn: {
    ru: (n: number) => `через ${ruDays(n)}`,
    uz: (n: number) => `${n} kundan keyin`,
    pl: (n: number) => `za ${plDays(n)}`,
  },
  taxUnverified: {
    ru: "дата не подтверждена бухгалтером",
    uz: "sana buxgalter tomonidan tasdiqlanmagan",
    pl: "data niepotwierdzona przez księgowego",
  },
  taxCalendar: { ru: "Полный календарь →", uz: "To‘liq kalendar →", pl: "Pełny kalendarz →" },

  // Рекомендации.
  reviewFrom: {
    ru: (date: string) => `от ${date}`,
    uz: (date: string) => `${date} holatiga`,
    pl: (date: string) => `z ${date}`,
  },
  reviewHint: { ru: "Откуда рекомендации", uz: "Tavsiyalar qayerdan olinadi", pl: "Skąd są rekomendacje" },
  reviewRefresh: { ru: "собрать заново", uz: "qayta tayyorlash", pl: "wygeneruj ponownie" },
  reviewLastPeriod: { ru: "Прошлый период: ", uz: "O‘tgan davr: ", pl: "Poprzedni okres: " },
  reviewAttention: { ru: "На что смотреть", uz: "Nimaga e’tibor berish kerak", pl: "Na co zwrócić uwagę" },
  reviewActions: { ru: "Что делать", uz: "Nima qilish kerak", pl: "Co robić" },
  reviewLearn: { ru: "Чему научиться", uz: "Nimani o‘rganish kerak", pl: "Czego się nauczyć" },
  reviewWins: { ru: "Что хорошо: ", uz: "Nima yaxshi: ", pl: "Co idzie dobrze: " },
  reviewDailyEmpty: {
    ru: "Собирается каждое утро с семи по Ташкенту.",
    uz: "Har kuni ertalab soat yettidan (Toshkent vaqti) tayyorlanadi.",
    pl: "Generowane codziennie rano od 7:00 czasu Taszkentu.",
  },
  reviewWeeklyEmpty: {
    ru: "Собирается по понедельникам с шести утра по Ташкенту. Через неделю — замер и новый план.",
    uz: "Har dushanba ertalab soat oltidan (Toshkent vaqti) tayyorlanadi. Bir haftadan keyin — natija o‘lchanadi va yangi reja tuziladi.",
    pl: "Generowane w poniedziałki od 6:00 czasu Taszkentu. Po tygodniu — pomiar i nowy plan.",
  },
  teamReviewsTitle: {
    ru: "Рекомендации команде на неделю",
    uz: "Jamoaga haftalik tavsiyalar",
    pl: "Rekomendacje dla zespołu na tydzień",
  },
  teamReviewsNone: { ru: "рекомендации ещё нет", uz: "tavsiya hali yo‘q", pl: "brak jeszcze rekomendacji" },
});

/** Ответ после сохранения плана или сборки рекомендаций (`?p=` в адресе). */
export const planNoticeDict = defineDict({
  ok: { ru: "План сохранён.", uz: "Reja saqlandi.", pl: "Plan zapisany." },
  forbidden: {
    ru: "Менять и снимать план может только владелец; руководитель ставит новый своему сотруднику.",
    uz: "Rejani faqat egasi o‘zgartira yoki olib tashlay oladi; rahbar esa o‘z xodimiga yangi reja qo‘yadi.",
    pl: "Zmieniać i usuwać plan może tylko właściciel; kierownik ustala nowy plan swojemu pracownikowi.",
  },
  invalid: {
    ru: "Цель не разобралась: целое число, без знаков.",
    uz: "Maqsad tushunilmadi: butun son kiriting, belgilarsiz.",
    pl: "Nie rozpoznano celu: wpisz liczbę całkowitą, bez znaków.",
  },
  offline: { ru: "База недоступна.", uz: "Baza ishlamayapti.", pl: "Baza jest niedostępna." },
  failed: { ru: "Не получилось.", uz: "Bo‘lmadi.", pl: "Nie udało się." },
  coach_ok: { ru: "Рекомендации собраны.", uz: "Tavsiyalar tayyor.", pl: "Rekomendacje gotowe." },
  coach_failed: {
    ru: "Рекомендации не собрались: модель не ответила или ответила числами, которых нет в данных. Подробности в логе сервера.",
    uz: "Tavsiyalar tayyorlanmadi: model javob bermadi yoki ma’lumotlarda yo‘q raqamlarni yozdi. Batafsil — server logida.",
    pl: "Nie udało się przygotować rekomendacji: model nie odpowiedział albo podał liczby, których nie ma w danych. Szczegóły w logu serwera.",
  },
});

/**
 * Показатели плана. Русские подписи те же, что METRIC_TITLE в
 * lib/admin/pulse.ts — тот берёт их отсюда и отдаёт модели рекомендаций.
 */
export const metricDict = defineDict({
  revenue_usd: { ru: "поступления, $", uz: "tushumlar, $", pl: "wpływy, $" },
  won: { ru: "выигранных лидов", uz: "yutilgan lidlar", pl: "wygrane leady" },
  contacts: { ru: "первых контактов", uz: "birinchi bog‘lanishlar", pl: "pierwsze kontakty" },
});

/** Налоговые сроки по умолчанию (lib/admin/tax-calendar.ts), по `id`. */
export const taxTitleDict = defineDict({
  turnover: { ru: "Налог с оборота", uz: "Aylanmadan olinadigan soliq", pl: "Podatek od obrotu" },
  social: { ru: "Социальный налог", uz: "Ijtimoiy soliq", pl: "Podatek socjalny" },
  annual: { ru: "Годовая отчётность", uz: "Yillik hisobot", pl: "Sprawozdanie roczne" },
});

/** Короткие месяцы под столбиками кассы. */
export const monthDict = defineDict({
  m1: { ru: "янв", uz: "yan", pl: "sty" },
  m2: { ru: "фев", uz: "fev", pl: "lut" },
  m3: { ru: "мар", uz: "mar", pl: "mar" },
  m4: { ru: "апр", uz: "apr", pl: "kwi" },
  m5: { ru: "май", uz: "may", pl: "maj" },
  m6: { ru: "июн", uz: "iyn", pl: "cze" },
  m7: { ru: "июл", uz: "iyl", pl: "lip" },
  m8: { ru: "авг", uz: "avg", pl: "sie" },
  m9: { ru: "сен", uz: "sen", pl: "wrz" },
  m10: { ru: "окт", uz: "okt", pl: "paź" },
  m11: { ru: "ноя", uz: "noy", pl: "lis" },
  m12: { ru: "дек", uz: "dek", pl: "gru" },
});
