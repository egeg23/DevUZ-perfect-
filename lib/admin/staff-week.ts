import { TASHKENT_OFFSET_MS, tashkentDate, todayInTashkent } from "@/lib/admin/pulse";
import { SHOW_NORM, weekStartOf } from "@/lib/admin/sales-stages";
import { duration } from "@/lib/admin/staff-report";

/**
 * Недельный отчёт по сотрудникам и рекомендации — владельцу и руководителю
 * в Telegram, по понедельникам.
 *
 * Владелец, 23.10.2026: «Не забудь что недельный отчет по сотрудникам и
 * рекомендации — направляем через тг бот мне и руководителю». До этого
 * рекомендации на неделю приходили каждому сотруднику лично (coach-store),
 * а владелец и руководитель видели неделю только на «Главной».
 *
 * Числа и выводы — правилами в коде, без модели: одни и те же цифры дают
 * одни и те же слова, и отчёт не стоит денег. Заголовки недельных
 * рекомендаций модели (coach-store) сюда не идут: 23.10.2026 они писали
 * «полный ноль активности» людям со 150 касаниями — модель видит только
 * действия по лидам, а касания компаниям — нет. Данные собирает
 * lib/admin/staff-week-store.ts.
 */

const DAY_MS = 24 * 3600_000;

/** С какого часа понедельника слать: недельные рекомендации к этому времени уже собраны. */
export const WEEK_REPORT_HOUR = 10;
/** Позже — уже не утро понедельника: отчёт ждёт следующей недели. */
export const WEEK_REPORT_LATEST_HOUR = 19;

/** Пора ли: понедельник, с 10:00 до 19:00 по Ташкенту. */
export function weekReportDue(now: Date): boolean {
  const hour = new Date(now.getTime() + TASHKENT_OFFSET_MS).getUTCHours();
  return tashkentDate(now).weekday === 1 && hour >= WEEK_REPORT_HOUR && hour < WEEK_REPORT_LATEST_HOUR;
}

/**
 * Разовые отчёты сверх понедельника, по слову владельца, «ГГГГ-ММ-ДД ЧЧ:ММ»
 * по Ташкенту: неделя с понедельника до этого часа, сравнение — с теми же
 * днями и часами неделей раньше.
 *
 * Владелец, 30.10.2026: «Недельный отчет по сотрудникам сегодня отправляем
 * в 15:00 по ташкенту мне и Александру».
 */
export const EXTRA_WEEK_REPORTS: readonly string[] = ["2026-10-30 15:00"];

/** Сколько ждать разовый отчёт, если свип или сервер в его час молчали. */
export const EXTRA_REPORT_WINDOW_MS = 4 * 3600_000;

/** Час разового отчёта, который настал и ещё не прошёл (мс); null — нет такого. */
export function extraReportAt(now: Date, slots: readonly string[] = EXTRA_WEEK_REPORTS): number | null {
  for (const slot of slots) {
    const m = slot.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
    if (!m) continue;
    const at = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - TASHKENT_OFFSET_MS;
    if (now.getTime() >= at && now.getTime() < at + EXTRA_REPORT_WINDOW_MS) return at;
  }
  return null;
}

export type WeekRange = {
  /** Прошлая неделя, понедельник 00:00 — следующий понедельник 00:00 по Ташкенту. */
  from: number;
  to: number;
  /** Неделя до неё — для сравнения: тот же отрезок, на семь дней раньше. */
  prevFrom: number;
  prevTo: number;
  /** Понедельник и последний день отчёта, «ГГГГ-ММ-ДД». */
  firstDay: string;
  lastDay: string;
  /** Разовый отчёт посреди недели — до какого часа, «ЧЧ:ММ»; у понедельничного null. */
  until: string | null;
};

export function weekRange(now: Date): WeekRange {
  const to = weekStartOf(now);
  const from = to - 7 * DAY_MS;
  return {
    from,
    to,
    prevFrom: from - 7 * DAY_MS,
    prevTo: from,
    firstDay: todayInTashkent(new Date(from)),
    lastDay: todayInTashkent(new Date(to - DAY_MS)),
    until: null,
  };
}

/** Эта неделя с понедельника до часа разового отчёта. */
export function weekRangeUntil(at: number): WeekRange {
  const from = weekStartOf(new Date(at));
  const clock = new Date(at + TASHKENT_OFFSET_MS);
  const hm = (n: number) => String(n).padStart(2, "0");
  return {
    from,
    to: at,
    prevFrom: from - 7 * DAY_MS,
    prevTo: at - 7 * DAY_MS,
    firstDay: todayInTashkent(new Date(from)),
    lastDay: todayInTashkent(new Date(at)),
    until: `${hm(clock.getUTCHours())}:${hm(clock.getUTCMinutes())}`,
  };
}

/** Ключ отметки в team_news_sent — один на неделю, у разового — свой. */
export function weekReportKey(range: WeekRange): string {
  return range.until ? `staff-week:${range.firstDay}:${range.lastDay}-${range.until}` : `staff-week:${range.firstDay}`;
}

export type StaffWeek = {
  id: string;
  /** Имя — уже экранировано для HTML Telegram. */
  name: string;
  touches: number;
  touchesPrev: number;
  /** Ответили на его касания за неделю. */
  replied: number;
  /** Макеты его клиентам, показы, названные цены и оплаты за неделю. */
  mockups: number;
  shown: number;
  priced: number;
  paid: number;
  /** Дней, когда был в панели, и минут в ней за неделю. */
  panelDays: number;
  panelMinutes: number;
  leadsTaken: number;
  offersBurned: number;
  /** Лидов «в работе» без движения 7+ дней — на утро понедельника. */
  stale: number;
};

/** Ничего за неделю: ни касаний, ни панели, ни взятых лидов. */
export function idleWeek(p: StaffWeek): boolean {
  return p.touches === 0 && p.panelDays === 0 && p.leadsTaken === 0;
}

/** Насколько касаний меньше, чем неделей раньше, в процентах; null — сравнивать не с чем. */
export function touchDrop(p: StaffWeek): number | null {
  if (p.touchesPrev < 20) return null;
  return Math.round(((p.touchesPrev - p.touches) / p.touchesPrev) * 100);
}

/** Значок: 🌟 норма показов, ✅ работал, ⚠️ касаний заметно меньше, 💤 ничего. */
export function weekMark(p: StaffWeek): string {
  if (idleWeek(p)) return "💤";
  if (p.shown >= SHOW_NORM) return "🌟";
  const drop = touchDrop(p);
  if (drop !== null && drop >= 40) return "⚠️";
  return "✅";
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/** «✉️ 340 касаний (неделей раньше 300, +13%)». */
export function weekTouchLine(p: StaffWeek): string {
  const drop = touchDrop(p);
  const change = drop === null ? "" : `, ${signed(-drop)}%`;
  return `✉️ ${p.touches} ${plural(p.touches, "касание", "касания", "касаний")} (неделей раньше ${p.touchesPrev}${change}) · 💬 ответили ${p.replied}`;
}

export function weekSalesLine(p: StaffWeek): string {
  return `🎯 макетов ${p.mockups} · показов ${p.shown} из ${SHOW_NORM} · цен ${p.priced} · оплат ${p.paid}`;
}

export function weekWorkLine(p: StaffWeek): string {
  const parts = [
    p.panelDays ? `🖥 в панели ${p.panelDays} ${plural(p.panelDays, "день", "дня", "дней")}, ${duration(p.panelMinutes)}` : "🖥 в панель не заходил",
  ];
  if (p.leadsTaken) parts.push(`🔥 взял ${p.leadsTaken} ${plural(p.leadsTaken, "лид", "лида", "лидов")}`);
  if (p.offersBurned) parts.push(`⌛ сгорело ${p.offersBurned}`);
  if (p.stale) parts.push(`🗂 без движения ${p.stale}`);
  return parts.join(" · ");
}

/** Совет по человеку — одной строкой, самое важное; null — всё в порядке. */
export function weekAdvice(p: StaffWeek): string | null {
  if (idleWeek(p)) return `${p.name}: за неделю ни касаний, ни панели — поговорить сегодня, что случилось.`;
  const drop = touchDrop(p);
  if (drop !== null && drop >= 40)
    return `${p.name}: касаний на ${drop}% меньше, чем неделей раньше, — разобрать, что мешает: время, тексты или компании.`;
  if (p.mockups > 0 && p.shown === 0)
    return `${p.name}: ${p.mockups} ${plural(p.mockups, "макет", "макета", "макетов")} и ни одного показа — на этой неделе назначить показ по видео каждому.`;
  if (p.replied >= 10 && p.mockups === 0)
    return `${p.name}: ответили ${p.replied}, а макетов 0 — послушать, как ведёт разговор после ответа.`;
  if (p.offersBurned >= 3)
    return `${p.name}: сгорело ${p.offersBurned} предложений тёплых лидов — держать панель открытой или включить пуш в приложении.`;
  if (p.stale >= 10) return `${p.name}: ${p.stale} лидов без движения 7+ дней — разобрать вместе: выиграли, проиграли или следующий шаг.`;
  if (p.panelDays > 0 && p.panelDays < 3) return `${p.name}: в панели ${p.panelDays} ${plural(p.panelDays, "день", "дня", "дней")} из пяти — узнать, где работает остальное время.`;
  if (p.shown >= SHOW_NORM) return `${p.name}: норма показов сделана (${p.shown}) — отметить при команде.`;
  return null;
}

/** «На что смотреть» — по команде. */
export function weekWatch(people: readonly StaffWeek[]): string[] {
  const sum = (f: (p: StaffWeek) => number) => people.reduce((s, p) => s + f(p), 0);
  const points: string[] = [];
  const touches = sum((p) => p.touches);
  const prev = sum((p) => p.touchesPrev);
  if (prev >= 20) {
    const change = Math.round(((touches - prev) / prev) * 100);
    points.push(`${change >= 0 ? "📈" : "📉"} Касаний по команде ${touches}, неделей раньше ${prev} (${signed(change)}%).`);
  }
  const working = people.filter((p) => !idleWeek(p));
  const norm = working.length * SHOW_NORM;
  const shown = sum((p) => p.shown);
  if (working.length) points.push(`🎬 Показов макета ${shown} при норме ${norm} (${SHOW_NORM} на человека).`);
  const noShow = people.filter((p) => p.mockups > 0 && p.shown === 0).map((p) => p.name);
  if (noShow.length) points.push(`🙈 Макеты без показа: ${noShow.join(", ")}.`);
  const idleNames = people.filter(idleWeek).map((p) => p.name);
  if (idleNames.length) points.push(`💤 Ничего за неделю: ${idleNames.join(", ")}.`);
  const dropped = people.filter((p) => (touchDrop(p) ?? 0) >= 40).map((p) => `${p.name} (−${touchDrop(p)}%)`);
  if (dropped.length) points.push(`⚠️ Касаний заметно меньше: ${dropped.join(", ")}.`);
  const burned = sum((p) => p.offersBurned);
  if (burned) points.push(`⌛ Сгорело предложений тёплых лидов: ${burned}.`);
  const stale = sum((p) => p.stale);
  if (stale) points.push(`🗂 Лидов «в работе» без движения 7+ дней: ${stale}.`);
  const paid = sum((p) => p.paid);
  const priced = sum((p) => p.priced);
  points.push(`💵 Названо цен ${priced}, оплат ${paid}.`);
  return points;
}

function day(d: string): string {
  return d.split("-").reverse().slice(0, 2).join(".");
}

/** Весь отчёт — один текст для владельца и руководителя (HTML Telegram, имена уже экранированы). */
export function staffWeekText(range: WeekRange, people: readonly StaffWeek[]): string {
  const sorted = [...people].sort((a, b) => b.touches - a.touches || a.name.localeCompare(b.name, "ru"));
  const sum = (f: (p: StaffWeek) => number) => sorted.reduce((s, p) => s + f(p), 0);
  const best = sorted.find((p) => p.touches > 0);
  const lines = [
    `📅 <b>Сотрудники за неделю · ${day(range.firstDay)}–${day(range.lastDay)}${range.until ? `, до ${range.until}` : ""}</b>`,
    "",
    `✉️ ${sum((p) => p.touches)} касаний · 💬 ответили ${sum((p) => p.replied)} · 🎨 макетов ${sum((p) => p.mockups)} · 🎬 показов ${sum((p) => p.shown)} · ✅ оплат ${sum((p) => p.paid)}`,
    ...(best ? [`🏆 Больше всех касаний: ${best.name} — ${best.touches}`] : []),
    "",
  ];
  for (const p of sorted) {
    lines.push(`${weekMark(p)} <b>${p.name}</b>`);
    lines.push(`  ${weekTouchLine(p)}`);
    lines.push(`  ${weekSalesLine(p)}`);
    lines.push(`  ${weekWorkLine(p)}`);
  }
  lines.push("", "👀 <b>На что смотреть</b>", ...weekWatch(sorted).map((w) => `• ${w}`));
  const advice = sorted.map(weekAdvice).filter((a): a is string => Boolean(a));
  if (advice.length) lines.push("", "💡 <b>Рекомендации</b>", ...advice.map((a) => `• ${a}`));
  lines.push(
    "",
    `${range.until ? `Неделя — с понедельника до ${range.until} ${day(range.lastDay)}; «неделей раньше» — те же дни и часы прошлой недели.` : "Неделя — с понедельника по воскресенье."} Касания — все, кому человек написал; «ответили» — ответы на его касания. Показ — отметка «Показал макет», норма — ${SHOW_NORM} в неделю. Выводы — правилами по цифрам, без нейросети.`,
  );
  return lines.join("\n");
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
