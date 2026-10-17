import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";
import { touchesOf, touchesText, type PersonReport } from "@/lib/admin/portion";
import { SHOW_NORM, type PersonSales } from "@/lib/admin/sales-stages";

/**
 * Вечерний отчёт по сотрудникам — владельцу и руководителям, в 18:00 по
 * Ташкенту, по рабочим дням.
 *
 * Владелец, 13.10.2026: «В 18:00 по Ташкенту отчёт руководителю и мне по
 * сотрудникам: кто заходил в панель и сколько времени провёл; сколько
 * касаний и порций дня сделано. Ну и всё из текущего вечернего отчёта по
 * сотрудникам. Сам тоже дополни, что нужно видеть нам и на что обратить
 * внимание, коротко, тезисно, + рекомендации к сотрудникам. Не забудь
 * эмодзи. Отчёт уходит только нам с руководителями».
 *
 * Выводы и советы — правилами в коде, без модели: одни и те же цифры дают
 * одни и те же слова, и отчёт не стоит денег. Здесь чистая арифметика и
 * текст; данные собирает lib/admin/staff-report-store.ts.
 */

/**
 * С какого дня панель считает минуты (panel_presence). Раньше было известно
 * только, какие разделы открывали, — «0 минут» за такой день значило бы «не
 * знаем», а не «не работал».
 */
export const PRESENCE_FROM = "2026-10-14";

/** Позже — уже не вечерний отчёт, а ночное сообщение. */
export const STAFF_REPORT_LATEST_HOUR = 23;

/** День начат поздно, если первый заход в панель — с этого часа по Ташкенту. */
export const LATE_START_HOUR = 11;

export type PanelDay = {
  /** Просмотров разделов за день. */
  views: number;
  /** Разделы, которые открывали чаще всего, — уже подписями. */
  top: string[];
  /** Активные минуты; null — день до PRESENCE_FROM, минуты не считались. */
  minutes: number | null;
  /** Первый и последний заход (ISO); null — неизвестно. */
  firstAt: string | null;
  lastAt: string | null;
};

export type StaffDay = {
  name: string;
  role: string;
  report: PersonReport;
  panel: PanelDay;
  /** Действия за день в панели и боте (журнал), кроме входов. */
  actions: number;
  /** Сколько тёплых лидов взял за день. */
  leadsTaken: number;
  /** Сколько предложений тёплых лидов у него сгорело за день (30 минут вышли). */
  offersBurned?: number;
  /** Сколько его лидов «в работе» без движения 7+ дней (lib/admin/lead-tidy.ts). */
  staleLeads?: number;
  /**
   * Ступени продажи, которые человек сделал сам (lib/admin/sales-stages.ts):
   * показы макета, названные цены, оплаты — за день и с понедельника.
   */
  sales?: { day: PersonSales; week: PersonSales };
};

/** «09:05» по Ташкенту. */
export function hhmm(iso: string): string {
  const t = new Date(Date.parse(iso) + TASHKENT_OFFSET_MS);
  return `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
}

/** «2 ч 10 мин», «45 мин», «0 мин». */
export function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} мин`;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

function startHour(iso: string): number {
  return new Date(Date.parse(iso) + TASHKENT_OFFSET_MS).getUTCHours();
}

/** Был ли человек в панели за день. */
export function wasInPanel(p: StaffDay): boolean {
  return p.panel.views > 0 || (p.panel.minutes ?? 0) > 0;
}

/** Ничего за день: ни панели, ни действий, ни касаний. */
export function idle(p: StaffDay): boolean {
  return !wasInPanel(p) && p.actions === 0 && touchesOf(p.report) === 0;
}

/** Порция не сделана хотя бы наполовину. */
function behind(p: StaffDay): boolean {
  return p.report.target > 0 && p.report.done * 2 < p.report.target;
}

/** Порция сделана и ещё сверху: поток или касания из панели. */
function star(p: StaffDay): boolean {
  return p.report.target > 0 && p.report.done >= p.report.target && touchesOf(p.report) > p.report.target;
}

/** Значок человека: ✅ порция сделана, ⚠️ меньше половины, 💤 ничего за день. */
export function mark(p: StaffDay): string {
  if (idle(p)) return "💤";
  if (p.report.target > 0 && p.report.done >= p.report.target) return star(p) ? "🌟" : "✅";
  if (behind(p)) return "⚠️";
  return "🟡";
}

/** Строка про панель. */
export function panelLine(p: StaffDay): string {
  const { panel } = p;
  if (!wasInPanel(p)) return p.actions ? "🖥 в панель не заходил, работал из бота" : "🖥 в панель не заходил";
  const parts: string[] = [];
  if (panel.minutes !== null) parts.push(`⏱ ${duration(panel.minutes)}`);
  if (panel.firstAt && panel.lastAt) parts.push(`${hhmm(panel.firstAt)}–${hhmm(panel.lastAt)}`);
  else if (panel.lastAt) parts.push(`последний раз в ${hhmm(panel.lastAt)}`);
  parts.push(`${panel.views} ${plural(panel.views, "просмотр", "просмотра", "просмотров")}`);
  const top = panel.top.length ? ` · чаще: ${panel.top.join(", ")}` : "";
  return `🖥 ${parts.join(", ")}${top}`;
}

/** Строка про касания — то же, что в прежнем отчёте «Касания за день». */
export function touchLine(p: StaffDay): string {
  const r = p.report;
  const stream = r.stream ? ` (поток ${r.stream})` : "";
  const head = `✉️ ${touchesText(touchesOf(r))}${stream}`;
  if (r.target === 0) return `${head} · порции не было`;
  const tail = [r.skipped ? `не подошло ${r.skipped}` : "", r.short ? `без замены ${r.short}` : ""]
    .filter(Boolean)
    .join(", ");
  return `${head} · порция ${r.done} из ${r.target}${tail ? `, ${tail}` : ""}`;
}

/** Строка про лиды и действия; пусто — нечего сказать. */
export function workLine(p: StaffDay): string {
  const parts: string[] = [];
  if (p.leadsTaken) parts.push(`🔥 взял ${p.leadsTaken} ${plural(p.leadsTaken, "лид", "лида", "лидов")}`);
  if (p.actions) parts.push(`🖱 ${p.actions} ${plural(p.actions, "действие", "действия", "действий")} в панели и боте`);
  if (p.offersBurned) parts.push(`⌛ сгорело ${p.offersBurned} ${plural(p.offersBurned, "предложение", "предложения", "предложений")} лидов`);
  if (p.staleLeads) parts.push(`🗂 ${p.staleLeads} ${plural(p.staleLeads, "лид", "лида", "лидов")} без движения 7+ дней`);
  return parts.join(" · ");
}

/**
 * Строка про ступени продажи: показы, названные цены, оплаты за день и
 * за неделю (с понедельника). Касания — это попытки, а эти три — то, что
 * ведёт к деньгам.
 */
export function salesLine(p: StaffDay): string {
  const s = p.sales ?? { day: { shown: 0, priced: 0, paid: 0 }, week: { shown: 0, priced: 0, paid: 0 } };
  const { day, week } = s;
  return `🎯 показы ${day.shown} · цены ${day.priced} · оплаты ${day.paid} — за неделю ${week.shown} из ${SHOW_NORM} показов, цен ${week.priced}, оплат ${week.paid}`;
}

/** Совет человеку — одной строкой, или null, если всё в порядке. */
export function adviceFor(p: StaffDay): string | null {
  const r = p.report;
  if (idle(p)) return `${p.name}: за день ни панели, ни касаний — узнать сегодня, что случилось.`;
  if (r.target > 0 && r.done === 0)
    return `${p.name}: порция не начата (${r.target} компаний вернулись в пул) — завтра начать с неё до 10:00.`;
  if (behind(p))
    return `${p.name}: порция ${r.done} из ${r.target} — разобрать, что мешает: тексты, время или сами компании.`;
  if (r.target > 0 && r.skipped >= 2 && r.skipped * 2 >= r.target)
    return `${p.name}: «Не подходит» ${r.skipped} раз из ${r.target} — проверить, не пропускает ли годных.`;
  const minutes = p.panel.minutes ?? 0;
  if (minutes >= 240 && r.target > 0 && touchesOf(r) < r.target)
    return `${p.name}: ${duration(minutes)} в панели, а касаний меньше нормы — посмотреть, на что уходит время.`;
  if (p.panel.firstAt && startHour(p.panel.firstAt) >= LATE_START_HOUR)
    return `${p.name}: день начат в ${hhmm(p.panel.firstAt)} — порцию лучше начинать с утра.`;
  if ((p.offersBurned ?? 0) >= 2)
    return `${p.name}: сгорело ${p.offersBurned} предложения лидов — держать панель открытой или включить уведомления в Telegram.`;
  if ((p.staleLeads ?? 0) >= 10)
    return `${p.name}: ${p.staleLeads} лидов без движения 7+ дней — разобрать: выиграли, проиграли или ещё в работе.`;
  if (star(p)) return `${p.name}: порция сделана и сверху ${touchesOf(r) - r.target} — отметить при команде.`;
  return null;
}

/** «На что смотреть» — тезисы по команде. */
export function watchPoints(people: readonly StaffDay[]): string[] {
  const points: string[] = [];
  const target = people.reduce((s, p) => s + p.report.target, 0);
  const done = people.reduce((s, p) => s + p.report.done, 0);
  if (target) {
    const pct = Math.round((done / target) * 100);
    const icon = pct >= 90 ? "🟢" : pct >= 60 ? "🟡" : "🔴";
    points.push(`${icon} Порция по команде: ${done} из ${target} (${pct}%).`);
  }
  const idleNames = people.filter(idle).map((p) => p.name);
  if (idleNames.length) points.push(`💤 Ничего за день: ${idleNames.join(", ")}.`);
  const noPanel = people.filter((p) => !idle(p) && !wasInPanel(p)).map((p) => p.name);
  if (noPanel.length) points.push(`📱 Работали только из бота: ${noPanel.join(", ")}.`);
  const behindNames = people.filter((p) => !idle(p) && behind(p)).map((p) => p.name);
  if (behindNames.length) points.push(`⚠️ Порция меньше половины: ${behindNames.join(", ")}.`);
  const skippedMany = people.filter((p) => p.report.skipped >= 2 && p.report.skipped * 2 >= p.report.target && p.report.target > 0);
  if (skippedMany.length) points.push(`🙅 Много «Не подходит»: ${skippedMany.map((p) => `${p.name} (${p.report.skipped})`).join(", ")}.`);
  const short = people.reduce((s, p) => s + p.report.short, 0);
  if (short) points.push(`🕳 Без замены осталось ${short} — в пуле мало годных компаний.`);
  const burned = people.filter((p) => (p.offersBurned ?? 0) > 0);
  if (burned.length)
    points.push(`⌛ Сгорели предложения тёплых лидов: ${burned.map((p) => `${p.name} (${p.offersBurned})`).join(", ")}.`);
  const staleTotal = people.reduce((s, p) => s + (p.staleLeads ?? 0), 0);
  if (staleTotal) points.push(`🗂 Лидов «в работе» без движения 7+ дней: ${staleTotal} — бот спрашивает о них по утрам.`);
  const leads = people.reduce((s, p) => s + p.leadsTaken, 0);
  if (leads) points.push(`🔥 Тёплых лидов взято: ${leads}.`);
  const shown = people.reduce((s, p) => s + (p.sales?.day.shown ?? 0), 0);
  const priced = people.reduce((s, p) => s + (p.sales?.day.priced ?? 0), 0);
  const paid = people.reduce((s, p) => s + (p.sales?.day.paid ?? 0), 0);
  if (people.some((p) => p.sales)) points.push(`🎯 За день по команде: показов макета ${shown}, названо цен ${priced}, оплат ${paid}.`);
  return points;
}

/** Лучший день по касаниям — если было хоть одно. */
export function leader(people: readonly StaffDay[]): StaffDay | null {
  const best = [...people].sort((a, b) => touchesOf(b.report) - touchesOf(a.report))[0];
  return best && touchesOf(best.report) > 0 ? best : null;
}

/** Порядок: больше касаний — выше; поровну — по имени. */
export function byWork(a: StaffDay, b: StaffDay): number {
  return touchesOf(b.report) - touchesOf(a.report) || a.name.localeCompare(b.name, "ru");
}

/** Весь отчёт — один текст для всех читателей (HTML Telegram, имена уже экранированы). */
export function staffReportText(day: string, people: readonly StaffDay[]): string {
  const sorted = [...people].sort(byWork);
  const touches = sorted.reduce((s, p) => s + touchesOf(p.report), 0);
  const inPanel = sorted.filter(wasInPanel).length;
  const best = leader(sorted);
  const lines = [
    `📋 <b>Сотрудники за день · ${day.split("-").reverse().join(".")}</b>`,
    "",
    `✉️ Всего: ${touchesText(touches)} · 🖥 в панели были ${inPanel} из ${sorted.length}`,
    ...(best ? [`🏆 Лучший день: ${best.name} — ${touchesText(touchesOf(best.report))}`] : []),
    "",
  ];
  for (const p of sorted) {
    lines.push(`${mark(p)} <b>${p.name}</b>`);
    lines.push(`  ${touchLine(p)}`);
    lines.push(`  ${panelLine(p)}`);
    lines.push(`  ${salesLine(p)}`);
    const work = workLine(p);
    if (work) lines.push(`  ${work}`);
  }
  const watch = watchPoints(sorted);
  if (watch.length) lines.push("", "👀 <b>На что смотреть</b>", ...watch.map((w) => `• ${w}`));
  const advice = sorted.map(adviceFor).filter((a): a is string => Boolean(a));
  if (advice.length) lines.push("", "💡 <b>Рекомендации</b>", ...advice.map((a) => `• ${a}`));
  const minutesKnown = day >= PRESENCE_FROM;
  lines.push(
    "",
    [
      "Касания — все, кому человек написал за день: порция, поток «Получать лиды» и панель. Порция — сколько из утренней раздачи сделано; несделанное вернулось в пул.",
      `🎯 — ступени продажи: показ макета (отметка «Показал макет»), названная цена (строка цены после «+» или «Назвал цену») и оплата; норма — ${SHOW_NORM} показа в неделю.`,
      minutesKnown
        ? "Время в панели — минуты, когда вкладка открыта и человек в ней что-то делает."
        : `Время в панели считаем с ${PRESENCE_FROM.split("-").reverse().join(".")}; сегодня — только просмотры разделов.`,
    ].join(" "),
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
