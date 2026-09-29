import {
  BestOfWeek,
  CashChart,
  ContractsToSign,
  ExpectedPayments,
  PlanFactBlock,
  ReviewCard,
  StuckLeads,
  TeamReviews,
  TaxesSoon,
  TeamTable,
  Tiles,
  money,
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
  stuckLeads,
  todayInTashkent,
  windowOf,
  type PlanFact,
  type StaffPulse,
} from "@/lib/admin/pulse";
import { latestReviews } from "@/lib/admin/coach-store";
import { loadPlans, loadPulseRows, pendingContracts } from "@/lib/admin/pulse-store";
import type { Staff } from "@/lib/admin/session";
import { DEFAULT_DEADLINES, upcoming } from "@/lib/admin/tax-calendar";
import { teamOf } from "@/lib/admin/team";
import { touchProgressFor } from "@/lib/admin/touch-store";

/**
 * Личный дашборд на главной панели — у каждой роли свой.
 *
 * Менеджер видит своё: деньги к выплате, лиды в работе, кого срочно
 * дёрнуть, план и факт. Руководитель — то же о себе плюс команду.
 * Владелец — договоры на подпись первыми, потом деньги компании, потом
 * команду. Один компонент, три ветки: цифры считаются один раз и одинаково
 * для всех, различается только то, кому что показано.
 */

// Ответы после сохранения плана и сборки рекомендаций — planNoticeDict
// (content/admin-panel/dashboard.ts), по коду из `?p=` в адресе.

/**
 * Вкладки дашборда владельца.
 *
 * Владелец: «бесконечный скролл вниз — можно уютно скомпоновать или
 * разделить по логическим блокам». Тринадцать блоков одной лентой читались
 * как отчёт, который пролистывают, а не как экран, с которого начинают день.
 * Поэтому у владельца главная — вкладки: что сделать сегодня, деньги,
 * команда. У менеджера и руководителя экран короче, и там всё по-прежнему.
 */
export type OwnerSection = "today" | "money" | "team";

export async function DashboardHome({
  staff,
  planNotice,
  section = "today",
}: {
  staff: Staff;
  planNotice?: string;
  section?: OwnerSection;
}) {
  const locale = staff.panel_locale;
  const t = pick(dashboardDict, locale);
  const now = new Date();
  const today = todayInTashkent(now);
  const weekStart = periodStart("week", now);
  const monthStart = periodStart("month", now);
  const week = windowOf("week", weekStart);
  const prevWeek = windowOf("week", previousPeriodStart("week", weekStart));
  const month = windowOf("month", monthStart);

  const team = staff.role === "head" ? await teamOf(staff.id) : [];
  const scope = visibleStaff(staff, team);

  const [rows, ledger, contracts] = await Promise.all([
    loadPulseRows(now),
    loadLedger(scope),
    staff.role === "admin" ? pendingContracts() : Promise.resolve([]),
  ]);

  const names = new Map(ledger.people.map((p) => [p.id, p.display_name]));
  const earners = earnersOf(ledger.people);
  const accruals = ledger.projects.flatMap((p) => accrualsOf(p, ledger.payments, earners, sharesOf(p.id, ledger.shares)));
  const balance = (id: string) => balanceOf(id, accruals, ledger.payouts);

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

  /* ── Менеджер ─────────────────────────────────────────────────────── */
  if (staff.role === "manager") {
    const mine = pulse(staff.id, week);
    const mineMonth = pulse(staff.id, month);
    const b = balance(staff.id);
    return (
      <div className="mb-8 space-y-4">
        {notice ? <p className="rounded-xl border border-line bg-surface px-4 py-2 text-sm text-muted">{notice}</p> : null}
        <Tiles
          items={[
            { value: money(b.due), label: t.tileDue, tone: "green", hint: b.frozen ? t.tileFrozen(money(b.frozen)) : undefined },
            { value: String(mine.inWork), label: t.tileInWork },
            { value: String(mine.stuck.length), label: t.tileUrgent, tone: mine.stuck.length ? "gold" : "plain" },
            { value: money(mineMonth.revenue), label: t.tileRevenueMonthMine },
          ]}
        />
        <StuckLeads rows={mine.stuck} locale={locale} />
        <ReviewCard review={weekly.get(staff.id) ?? null} title={t.reviewWeekly} locale={locale} />
        <PlanFactBlock plans={planRows} canAdd={false} canEdit={false} staffOptions={[]} locale={locale} />
      </div>
    );
  }

  /* ── Руководитель ─────────────────────────────────────────────────── */
  if (staff.role === "head") {
    const mine = pulse(staff.id, week);
    const b = balance(staff.id);
    const teamStuck = stuckLeads(
      rows.leads.filter((l) => l.assigned_staff_id && team.includes(l.assigned_staff_id)),
      rows.events,
      rows.messages,
      now,
    );
    const options = teamRows.map((r) => ({ id: r.id, name: r.name }));
    return (
      <div className="mb-8 space-y-4">
        {notice ? <p className="rounded-xl border border-line bg-surface px-4 py-2 text-sm text-muted">{notice}</p> : null}
        <Tiles
          items={[
            { value: money(b.due), label: t.tileDue, tone: "green" },
            { value: String(teamRows.reduce((s, r) => s + r.week.inWork, 0) + mine.inWork), label: t.tileTeamInWork },
            { value: String(teamStuck.length + mine.stuck.length), label: t.tileUrgent, tone: teamStuck.length + mine.stuck.length ? "gold" : "plain" },
            { value: money(teamRows.reduce((s, r) => s + r.week.revenue, 0) + mine.revenue), label: t.tileRevenueWeek },
          ]}
        />
        <ReviewCard review={daily.get(staff.id) ?? null} title={t.reviewDaily} daily locale={locale} />
        <StuckLeads rows={[...mine.stuck, ...teamStuck]} names={names} locale={locale} />
        <TeamTable rows={teamRows} showMoney={false} locale={locale} />
        <TeamReviews rows={teamReviews} locale={locale} />
        <ReviewCard review={weekly.get(staff.id) ?? null} title={t.reviewWeekly} locale={locale} />
        <BestOfWeek rows={teamRows} locale={locale} />
        <PlanFactBlock plans={planRows} canAdd={options.length > 0} canEdit={false} staffOptions={options} locale={locale} />
      </div>
    );
  }

  /* ── Владелец ─────────────────────────────────────────────────────── */
  const allStuck = stuckLeads(rows.leads, rows.events, rows.messages, now);
  const cash = monthlyCash(rows.payments, rows.expenses, lastMonths(now, 6));
  const expected = expectedPayments(rows.projects, rows.payments);
  const taxes = upcoming(DEFAULT_DEADLINES, today);
  const thisMonth = cash[cash.length - 1];
  const dueAll = teamRows.reduce((s, r) => s + r.due, 0);
  const options = teamRows.map((r) => ({ id: r.id, name: r.name }));

  const moneyTiles = (
    <Tiles
      items={[
        { value: money(thisMonth?.revenue ?? 0), label: t.tileRevenueMonth, tone: "green" },
        { value: money(thisMonth?.expenses ?? 0), label: t.tileExpensesMonth },
        { value: money(expected.reduce((s, r) => s + r.remaining, 0)), label: t.tileExpected },
        { value: money(dueAll), label: t.tileDueTeam, tone: dueAll > 0 ? "gold" : "plain" },
      ]}
    />
  );
  const planNote = notice ? (
    <p className="rounded-xl border border-line bg-surface px-4 py-2 text-sm text-muted">{notice}</p>
  ) : null;

  // Сегодня — то, что требует действия: подписать, позвонить, заплатить.
  // Две колонки на широком экране: блоки короткие, и в ленту по одному они
  // растягивали экран вдвое.
  if (section === "today") {
    return (
      <div className="mb-8 space-y-4">
        {planNote}
        <ContractsToSign rows={contracts} locale={locale} />
        {moneyTiles}
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <ReviewCard review={daily.get(staff.id) ?? null} title={t.reviewDaily} daily canRefresh locale={locale} />
          <div className="space-y-4">
            <StuckLeads rows={allStuck} names={names} locale={locale} />
            <TaxesSoon rows={taxes} locale={locale} />
          </div>
        </div>
      </div>
    );
  }

  if (section === "money") {
    return (
      <div className="mb-8 space-y-4">
        {moneyTiles}
        <CashChart rows={cash} locale={locale} />
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <ExpectedPayments rows={expected} names={names} locale={locale} />
          <TaxesSoon rows={taxes} locale={locale} />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-4">
      {planNote}
      <TeamTable rows={teamRows} showMoney locale={locale} />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <BestOfWeek rows={teamRows} locale={locale} />
        <TeamReviews rows={teamReviews} locale={locale} />
      </div>
      <PlanFactBlock plans={planRows} canAdd={options.length > 0} canEdit staffOptions={options} locale={locale} />
    </div>
  );
}
