/**
 * Пульс: что происходит с лидами, деньгами и людьми — числами, за период.
 *
 * Чистая математика над строками из базы. «Сегодня» передаётся аргументом:
 * иначе тест зависел бы от дня запуска, а понедельник наступал бы по часам
 * машины, а не по Ташкенту.
 *
 * Время студии — Ташкент, UTC+5, без перевода часов. Неделя начинается в
 * понедельник в полночь по Ташкенту, месяц — первого числа. Рекомендации
 * «по понедельникам» и план «на неделю» считают именно эти границы.
 */

export const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Календарная дата в Ташкенте для момента времени. */
export function tashkentDate(now: Date): { year: number; month: number; day: number; weekday: number } {
  const shifted = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    // 1 — понедельник … 7 — воскресенье.
    weekday: shifted.getUTCDay() === 0 ? 7 : shifted.getUTCDay(),
  };
}

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Полночь названной даты по Ташкенту — как момент времени. */
export function tashkentMidnight(date: string): Date {
  return new Date(Date.parse(`${date}T00:00:00Z`) - TASHKENT_OFFSET_MS);
}

export function todayInTashkent(now: Date): string {
  const t = tashkentDate(now);
  return iso(t.year, t.month, t.day);
}

export type Period = "week" | "month";

/** Начало текущей недели (понедельник) или месяца по Ташкенту. */
export function periodStart(period: Period, now: Date): string {
  const t = tashkentDate(now);
  if (period === "month") return iso(t.year, t.month, 1);
  const monday = new Date(Date.UTC(t.year, t.month - 1, t.day - (t.weekday - 1)));
  return iso(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate());
}

export function periodEnd(period: Period, start: string): string {
  const d = new Date(Date.parse(`${start}T00:00:00Z`));
  if (period === "week") d.setUTCDate(d.getUTCDate() + 7);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function previousPeriodStart(period: Period, start: string): string {
  const d = new Date(Date.parse(`${start}T00:00:00Z`));
  if (period === "week") d.setUTCDate(d.getUTCDate() - 7);
  else d.setUTCMonth(d.getUTCMonth() - 1);
  return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export type Window = { from: Date; to: Date };

export function windowOf(period: Period, start: string): Window {
  return { from: tashkentMidnight(start), to: tashkentMidnight(periodEnd(period, start)) };
}

const within = (at: string, w: Window) => {
  const t = Date.parse(at);
  return t >= w.from.getTime() && t < w.to.getTime();
};

/* ── Входные строки ────────────────────────────────────────────────────── */

export type LeadLite = {
  id: string;
  assigned_staff_id: string | null;
  status: string;
  priority: string;
  created_at: string;
  assigned_at: string | null;
  request_no: string | null;
  company: string | null;
  contact_name: string | null;
};

export type EventLite = {
  actor_staff_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
  meta: Record<string, unknown> | null;
};

export type MessageLite = { lead_id: string; author_staff_id: string | null; created_at: string };

export type PaymentLite = { project_id: string; amount_usd: number; paid_on: string };

export type ProjectLite = {
  id: string;
  title: string;
  client: string | null;
  owner_staff_id: string | null;
  amount_usd: number | null;
  stage: string;
};

export type ExpenseLite = { amount_usd: number; spent_on: string };

/* ── Движение по лиду ──────────────────────────────────────────────────── */

/**
 * Сколько дней лид ждёт, чтобы им занялись. Считается от последнего
 * движения — взятия, записи в переписке, любого действия в журнале.
 * Горячему лиду двух дней тишины уже много; остальным — чуть больше.
 */
export const STALE_DAYS: Record<string, number> = { hot: 2, warm: 3, nurture: 5, archive: 14 };

export function lastActivity(lead: LeadLite, events: readonly EventLite[], messages: readonly MessageLite[]): number {
  let last = Math.max(Date.parse(lead.created_at), lead.assigned_at ? Date.parse(lead.assigned_at) : 0);
  for (const e of events) {
    if (e.target_type === "lead" && e.target_id === lead.id) last = Math.max(last, Date.parse(e.created_at));
  }
  for (const m of messages) {
    if (m.lead_id === lead.id) last = Math.max(last, Date.parse(m.created_at));
  }
  return last;
}

export type StuckLead = { id: string; label: string; priority: string; days: number; staffId: string | null };

export function leadLabel(lead: LeadLite): string {
  return lead.request_no ?? lead.company ?? lead.contact_name ?? lead.id.slice(0, 8);
}

export function stuckLeads(
  leads: readonly LeadLite[],
  events: readonly EventLite[],
  messages: readonly MessageLite[],
  now: Date,
): StuckLead[] {
  const out: StuckLead[] = [];
  for (const lead of leads) {
    if (lead.status !== "taken") continue;
    const days = Math.floor((now.getTime() - lastActivity(lead, events, messages)) / 86_400_000);
    const limit = STALE_DAYS[lead.priority] ?? STALE_DAYS.nurture;
    if (days >= limit) {
      out.push({ id: lead.id, label: leadLabel(lead), priority: lead.priority, days, staffId: lead.assigned_staff_id });
    }
  }
  // Самые давние первыми: с них и начинать.
  return out.sort((a, b) => b.days - a.days);
}

/* ── Пульс сотрудника ──────────────────────────────────────────────────── */

export type StaffPulse = {
  staffId: string;
  inWork: number;
  taken: number;
  won: number;
  lost: number;
  contacts: number;
  /** Касания: действия по лидам в журнале плюс записи в переписке. */
  touches: number;
  revenue: number;
  stuck: StuckLead[];
};

export type PulseInput = {
  leads: readonly LeadLite[];
  events: readonly EventLite[];
  messages: readonly MessageLite[];
  projects: readonly ProjectLite[];
  payments: readonly PaymentLite[];
};

export function pulseOf(staffId: string, input: PulseInput, window: Window, now: Date): StaffPulse {
  const mine = input.leads.filter((l) => l.assigned_staff_id === staffId);
  const myEvents = input.events.filter((e) => e.actor_staff_id === staffId && within(e.created_at, window));
  const myMessages = input.messages.filter((m) => m.author_staff_id === staffId && within(m.created_at, window));
  const myProjects = new Set(input.projects.filter((p) => p.owner_staff_id === staffId).map((p) => p.id));

  const statusTo = (to: string) =>
    myEvents.filter((e) => e.action === "lead.status_changed" && e.meta?.to === to).length;

  return {
    staffId,
    inWork: mine.filter((l) => l.status === "taken").length,
    taken: myEvents.filter((e) => e.action === "lead.taken").length,
    won: statusTo("won"),
    lost: statusTo("lost"),
    contacts: myEvents.filter((e) => e.action === "lead.contact_revealed").length,
    touches: myEvents.filter((e) => e.target_type === "lead").length + myMessages.length,
    revenue: input.payments
      .filter((p) => myProjects.has(p.project_id) && within(`${p.paid_on}T00:00:00Z`, shiftedForDate(window)))
      .reduce((s, p) => s + p.amount_usd, 0),
    stuck: stuckLeads(mine, input.events, input.messages, now),
  };
}

/**
 * Даты платежей — календарные, без времени. Окно для них — те же
 * календарные дни, но сравнивать «дата в полночь UTC» с границами по
 * Ташкенту нельзя: платёж первого числа оказался бы в прошлом месяце.
 */
function shiftedForDate(window: Window): Window {
  return {
    from: new Date(window.from.getTime() + TASHKENT_OFFSET_MS),
    to: new Date(window.to.getTime() + TASHKENT_OFFSET_MS),
  };
}

/* ── План и факт ───────────────────────────────────────────────────────── */

export const METRICS = ["revenue_usd", "won", "contacts"] as const;
export type Metric = (typeof METRICS)[number];

export function isMetric(value: string): value is Metric {
  return (METRICS as readonly string[]).includes(value);
}

export const METRIC_TITLE: Record<Metric, string> = {
  revenue_usd: "поступления, $",
  won: "выигранных лидов",
  contacts: "первых контактов",
};

export function factOf(metric: Metric, pulse: StaffPulse): number {
  if (metric === "revenue_usd") return pulse.revenue;
  if (metric === "won") return pulse.won;
  return pulse.contacts;
}

export type Plan = {
  id: string;
  staff_id: string;
  period: Period;
  period_start: string;
  metric: Metric;
  target: number;
};

export type PlanFact = Plan & { fact: number; percent: number };

export function planFact(plan: Plan, pulse: StaffPulse): PlanFact {
  const fact = factOf(plan.metric, pulse);
  const percent = plan.target > 0 ? Math.min(999, Math.round((fact / plan.target) * 100)) : fact > 0 ? 100 : 0;
  return { ...plan, fact, percent };
}

/**
 * Кто ставит план. Владелец: «план/факт могу менять и редактировать
 * только я, добавлять план/факт может руководитель». Значит,
 * руководитель заводит план своему человеку, если плана ещё нет; менять
 * или удалять существующий — только владелец. Себе руководитель план не
 * ставит: свою планку человек не назначает сам.
 */
export function canSetPlan(
  viewer: { id: string; role: string },
  targetStaffId: string,
  team: readonly string[],
  exists: boolean,
): boolean {
  if (viewer.role === "admin") return true;
  if (viewer.role !== "head") return false;
  if (exists) return false;
  return targetStaffId !== viewer.id && team.includes(targetStaffId);
}

/* ── Касса по месяцам ──────────────────────────────────────────────────── */

export type MonthCash = { month: string; revenue: number; expenses: number; profit: number };

/** Последние N месяцев, включая текущий, старые слева. */
export function lastMonths(now: Date, count: number): string[] {
  const t = tashkentDate(now);
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(t.year, t.month - 1 - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export function monthlyCash(payments: readonly PaymentLite[], expenses: readonly ExpenseLite[], months: readonly string[]): MonthCash[] {
  const rows = months.map((month) => ({ month, revenue: 0, expenses: 0, profit: 0 }));
  const byMonth = new Map(rows.map((r) => [r.month, r]));
  for (const p of payments) {
    const row = byMonth.get(p.paid_on.slice(0, 7));
    if (row) row.revenue += p.amount_usd;
  }
  for (const e of expenses) {
    const row = byMonth.get(e.spent_on.slice(0, 7));
    if (row) row.expenses += e.amount_usd;
  }
  for (const row of rows) row.profit = row.revenue - row.expenses;
  return rows;
}

/* ── Ожидаем оплат ─────────────────────────────────────────────────────── */

export type Expected = { project: ProjectLite; paid: number; remaining: number };

const CLOSED = new Set(["done", "cancelled", "paused"]);

export function expectedPayments(projects: readonly ProjectLite[], payments: readonly PaymentLite[]): Expected[] {
  const out: Expected[] = [];
  for (const project of projects) {
    if (CLOSED.has(project.stage) || project.amount_usd === null || project.amount_usd <= 0) continue;
    const paid = payments.filter((p) => p.project_id === project.id).reduce((s, p) => s + p.amount_usd, 0);
    const remaining = project.amount_usd - paid;
    if (remaining > 0) out.push({ project, paid, remaining });
  }
  return out.sort((a, b) => b.remaining - a.remaining);
}

export const MONTH_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${MONTH_SHORT[Number(m) - 1]} ${y.slice(2)}`;
}
