import { bonusesOf, gradeBook } from "@/lib/admin/grade-month";
import {
  BestOfWeek,
  CashChart,
  ExpectedPayments,
  PlanFactBlock,
  ReviewCard,
  TeamReviews,
  TaxesSoon,
  TeamTable,
  type TeamRow,
} from "@/components/admin/dashboard";
import { dashboardDict, planNoticeDict } from "@/content/admin-panel/dashboard";
import { pick } from "@/lib/admin/i18n";
import { accrualsOf, balanceOf, earnersOf, visibleStaff } from "@/lib/admin/finance";
import { loadLedger, sharesOf } from "@/lib/admin/ledger";
import {
  expectedPayments,
  lastMonths,
  monthlyCash,
  periodStart,
  planFact,
  previousPeriodStart,
  pulseOf,
  todayInTashkent,
  windowOf,
  type PlanFact,
  type StaffPulse,
} from "@/lib/admin/pulse";
import { latestReviews } from "@/lib/admin/coach-store";
import { loadPlans, loadPulseRows } from "@/lib/admin/pulse-store";
import type { Staff } from "@/lib/admin/session";
import { DEFAULT_DEADLINES, upcoming } from "@/lib/admin/tax-calendar";
import { teamOf } from "@/lib/admin/team";
import { touchProgressFor } from "@/lib/admin/touch-store";

/**
 * Недельные блоки и касса — то, что раньше жило на «Лидах».
 *
 * Владелец, 23.10.2026, на разбор удобства панели: «Делаем все сразу». На
 * «Лидах» перед самим списком стояло до шестнадцати блоков, а у владельца
 * ещё и вкладки «Сегодня / Деньги / Команда» — вторая «Главная» с теми же
 * числами. Теперь «Лиды» — только список, а отсюда:
 *
 * - `where="hq"` — внизу «Главной»: рекомендации, команда за неделю, лучшие,
 *   «План и факт». Плиток «к выплате», «в работе», «срочно» здесь нет: деньги —
 *   в «Финансах», «в работе» и «без движения» — в пульсе «Главной».
 * - `where="finance"` — владельцу в «Финансах»: касса по месяцам, ожидаем
 *   оплат, налоговые сроки.
 */

// Ответы после сохранения плана и сборки рекомендаций — planNoticeDict
// (content/admin-panel/dashboard.ts), по коду из `?p=` в адресе.

export type DashboardWhere = "hq" | "finance";

export async function DashboardHome({
  staff,
  planNotice,
  where,
}: {
  staff: Staff;
  planNotice?: string;
  where: DashboardWhere;
}) {
  const locale = staff.panel_locale;
  const t = pick(dashboardDict, locale);
  const now = new Date();
  const today = todayInTashkent(now);

  if (where === "finance") {
    if (staff.role !== "admin") return null;
    const rows = await loadPulseRows(now);
    const ledger = await loadLedger(visibleStaff(staff, []));
    const names = new Map(ledger.people.map((p) => [p.id, p.display_name]));
    const cash = monthlyCash(rows.payments, rows.expenses, lastMonths(now, 6));
    const expected = expectedPayments(rows.projects, rows.payments);
    const taxes = upcoming(DEFAULT_DEADLINES, today);
    return (
      <div className="mt-10 space-y-4">
        <CashChart rows={cash} locale={locale} />
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <ExpectedPayments rows={expected} names={names} locale={locale} />
          <TaxesSoon rows={taxes} locale={locale} />
        </div>
      </div>
    );
  }

  const weekStart = periodStart("week", now);
  const monthStart = periodStart("month", now);
  const week = windowOf("week", weekStart);
  const prevWeek = windowOf("week", previousPeriodStart("week", weekStart));
  const month = windowOf("month", monthStart);

  const team = staff.role === "head" ? await teamOf(staff.id) : [];
  const scope = visibleStaff(staff, team);
  const [rows, ledger] = await Promise.all([loadPulseRows(now), loadLedger(scope)]);

  const names = new Map(ledger.people.map((p) => [p.id, p.display_name]));
  const earners = earnersOf(ledger.people);
  const book = gradeBook(ledger.projects, ledger.payments, now);
  const bonuses = bonusesOf(book);
  const accruals = ledger.projects.flatMap((p) => accrualsOf(p, ledger.payments, earners, sharesOf(p.id, ledger.shares), book));
  const balance = (id: string) => balanceOf(id, accruals, ledger.payouts, bonuses);

  // Чьи цифры показываем рядами: команда руководителя или все живые люди.
  const peopleIds =
    staff.role === "admin"
      ? ledger.people.filter((p) => p.is_active && p.role !== "admin").map((p) => p.id)
      : staff.role === "head"
        ? team
        : [];

  const pulse = (id: string, w: typeof week): StaffPulse => pulseOf(id, rows, w, now);
  // План/факт холодных касаний — за него руководитель отвечает по своим.
  const touches = await touchProgressFor(peopleIds, now);
  const teamRows: TeamRow[] = peopleIds.map((id) => ({
    id,
    name: names.get(id) ?? "—",
    week: pulse(id, week),
    prev: pulse(id, prevWeek),
    due: balance(id).due,
    touch: touches.get(id),
  }));

  const planStaffIds = staff.role === "manager" ? [staff.id] : [...peopleIds, staff.id];
  const plans = rows.offline
    ? []
    : await loadPlans(
        [
          { period: "week", period_start: weekStart },
          { period: "month", period_start: monthStart },
        ],
        planStaffIds,
      );
  const planRows: (PlanFact & { staffName?: string })[] = plans.map((p) => ({
    ...planFact(p, pulse(p.staff_id, p.period === "week" ? week : month)),
    staffName: p.staff_id === staff.id ? undefined : names.get(p.staff_id),
  }));

  const notice = planNotice ? (planNoticeDict[planNotice as keyof typeof planNoticeDict]?.[locale] ?? null) : null;

  // Рекомендации: недельные — всем, кроме владельца; дневные — владельцу и
  // руководителям. Читаются одним запросом на вид.
  const [weekly, daily] = await Promise.all([
    latestReviews([...peopleIds, staff.id], "weekly"),
    staff.role === "manager" ? Promise.resolve(new Map()) : latestReviews([staff.id], "daily"),
  ]);
  const teamReviews = teamRows.map((r) => ({ name: r.name, review: weekly.get(r.id) ?? null }));
  const options = teamRows.map((r) => ({ id: r.id, name: r.name }));

  const frame = (children: React.ReactNode) => (
    <section id="week" className="mt-10 scroll-mt-28 space-y-4">
      <h2 className="text-sm uppercase tracking-wider text-faint">{t.weekTitle}</h2>
      {notice ? <p className="rounded-xl border border-line bg-surface px-4 py-2 text-sm text-muted">{notice}</p> : null}
      {children}
    </section>
  );

  /* ── Менеджер ─────────────────────────────────────────────────────── */
  if (staff.role === "manager") {
    return frame(
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ReviewCard review={weekly.get(staff.id) ?? null} title={t.reviewWeekly} locale={locale} />
        <PlanFactBlock plans={planRows} canAdd={false} canEdit={false} staffOptions={[]} locale={locale} />
      </div>,
    );
  }

  /* ── Руководитель ─────────────────────────────────────────────────── */
  if (staff.role === "head") {
    return frame(
      <>
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <ReviewCard review={daily.get(staff.id) ?? null} title={t.reviewDaily} daily locale={locale} />
          <ReviewCard review={weekly.get(staff.id) ?? null} title={t.reviewWeekly} locale={locale} />
        </div>
        <TeamTable rows={teamRows} showMoney={false} locale={locale} />
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <BestOfWeek rows={teamRows} locale={locale} />
          <TeamReviews rows={teamReviews} locale={locale} />
        </div>
        <PlanFactBlock plans={planRows} canAdd={options.length > 0} canEdit={false} staffOptions={options} locale={locale} />
      </>,
    );
  }

  /* ── Владелец ─────────────────────────────────────────────────────── */
  return frame(
    <>
      <ReviewCard review={daily.get(staff.id) ?? null} title={t.reviewDaily} daily canRefresh locale={locale} />
      <TeamTable rows={teamRows} showMoney locale={locale} />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <BestOfWeek rows={teamRows} locale={locale} />
        <TeamReviews rows={teamReviews} locale={locale} />
      </div>
      <PlanFactBlock plans={planRows} canAdd={options.length > 0} canEdit staffOptions={options} locale={locale} />
    </>,
  );
}
