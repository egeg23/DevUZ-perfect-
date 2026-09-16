/**
 * Налоговый календарь: что и когда сдавать, чтобы не попасть на штраф.
 *
 * Владелец: «Налоги не забудь, и к налогам еще пусть будет уведомление о
 * сроках подачи деклараций и тд в узбекистане, чтобы мы не попали на
 * штраф».
 *
 * ── Почему сроки помечены непроверенными ────────────────────────────────
 *
 * Выдуманная дата сдачи декларации — это ровно тот штраф, от которого
 * календарь должен защищать. Налоговый режим ИП зависит от оборота, вида
 * деятельности и того, что выбрано при регистрации; правила меняются, и
 * знать их наверняка может только бухгалтер, который ведёт конкретное ИП.
 *
 * Поэтому здесь механизм, а не справочник. Записи приходят с флагом
 * `verified: false` и показываются с явной оговоркой, пока владелец не
 * подтвердит их у бухгалтера. Календарь, которому доверяют по ошибке,
 * опаснее отсутствующего: на отсутствующий смотрят с опаской, а на этот —
 * нет.
 */

export type Recurrence =
  /** Каждый месяц, `day` числа следующего месяца за отчётным. */
  | { kind: "monthly"; day: number }
  /** Каждый квартал, `day` числа `monthAfter`-го месяца после конца квартала. */
  | { kind: "quarterly"; day: number; monthOffset: number }
  /** Раз в год, `day` числа месяца `month` (1–12). */
  | { kind: "yearly"; month: number; day: number };

export type TaxDeadline = {
  id: string;
  title: string;
  /** Что именно сдаётся или платится — словами владельца, не налоговыми. */
  what: string;
  recurrence: Recurrence;
  /**
   * Подтверждена ли дата бухгалтером.
   *
   * Пока false — интерфейс обязан говорить об этом рядом с датой. Не
   * сноской внизу страницы: сноску не читают, а штраф приходит один.
   */
  verified: boolean;
};

/**
 * Что студия сдаёт по умолчанию.
 *
 * Список — заготовка под разговор с бухгалтером, а не готовая инструкция.
 * Оттого у каждой записи verified: false. Подтверждённые даты владелец
 * проставляет сам на странице расходов.
 */
export const DEFAULT_DEADLINES: readonly TaxDeadline[] = [
  {
    id: "turnover",
    title: "Налог с оборота",
    what: "Декларация и уплата за прошлый период",
    recurrence: { kind: "monthly", day: 15 },
    verified: false,
  },
  {
    id: "social",
    title: "Социальный налог",
    what: "Отчисления за себя как за ИП",
    recurrence: { kind: "monthly", day: 15 },
    verified: false,
  },
  {
    id: "annual",
    title: "Годовая отчётность",
    what: "Итоговая декларация за год",
    recurrence: { kind: "yearly", month: 4, day: 1 },
    verified: false,
  },
];

/* ── Когда следующий срок ───────────────────────────────────────────────── */

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/**
 * Ближайшая дата срока, начиная с `from` включительно.
 *
 * `from` передаётся аргументом, а не берётся из `new Date()`: функция должна
 * быть проверяемой, а «сегодня» внутри чистой функции делает тест зависимым
 * от дня запуска — такой тест однажды падает в полночь первого января.
 */
export function nextDue(deadline: TaxDeadline, from: string): string {
  const [y, m, d] = from.split("-").map(Number);
  const r = deadline.recurrence;

  if (r.kind === "monthly") {
    if (d <= r.day) return iso(y, m, r.day);
    return m === 12 ? iso(y + 1, 1, r.day) : iso(y, m + 1, r.day);
  }

  if (r.kind === "yearly") {
    const thisYear = iso(y, r.month, r.day);
    return thisYear >= from ? thisYear : iso(y + 1, r.month, r.day);
  }

  // Квартальные: конец квартала плюс смещение в месяцах.
  for (let step = 0; step < 8; step++) {
    const quarter = Math.floor((m - 1) / 3) + step;
    const year = y + Math.floor(quarter / 4);
    const endMonth = ((quarter % 4) + 1) * 3;
    const dueMonth = endMonth + r.monthOffset;
    const due = iso(year + Math.floor((dueMonth - 1) / 12), ((dueMonth - 1) % 12) + 1, r.day);
    if (due >= from) return due;
  }
  return from;
}

export type Upcoming = TaxDeadline & { due: string; daysLeft: number };

/** На сколько дней вперёд смотрим по умолчанию. */
export const HORIZON_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Что подходит в ближайшие дни.
 *
 * Сортировка по дате, а не по важности: важность решает владелец, а
 * календарь отвечает на вопрос «что горит раньше».
 */
export function upcoming(
  deadlines: readonly TaxDeadline[],
  today: string,
  horizonDays = HORIZON_DAYS,
): Upcoming[] {
  const now = Date.parse(`${today}T00:00:00Z`);
  return deadlines
    .map((deadline) => {
      const due = nextDue(deadline, today);
      return {
        ...deadline,
        due,
        daysLeft: Math.round((Date.parse(`${due}T00:00:00Z`) - now) / DAY_MS),
      };
    })
    .filter((item) => item.daysLeft <= horizonDays)
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
}
