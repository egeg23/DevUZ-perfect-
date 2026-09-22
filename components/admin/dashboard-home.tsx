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

const PLAN_NOTICE: Record<string, string> = {
  ok: "План сохранён.",
  forbidden: "Менять и снимать план может только владелец; руководитель ставит новый своему сотруднику.",
  invalid: "Цель не разобралась: целое число, без знаков.",
  offline: "База недоступна.",
  failed: "Не получилось.",
  coach_ok: "Рекомендации собраны.",
  coach_failed: "Рекомендации не собрались: модель не ответила или ответила числами, которых нет в данных. Подробности в логе сервера.",
};

export async function DashboardHome({ staff, planNotice }: { staff: Staff; planNotice?: string }) {
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

  const notice = planNotice ? PLAN_NOTICE[planNotice] : null;

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
            { value: money(b.due), label: "к выплате", tone: "green", hint: b.frozen ? `ещё ${money(b.frozen)} ждут оплаты клиентом` : undefined },
            { value: String(mine.inWork), label: "лидов в работе" },
            { value: String(mine.stuck.length), label: "срочно связаться", tone: mine.stuck.length ? "gold" : "plain" },
            { value: money(mineMonth.revenue), label: "поступлений за месяц" },
          ]}
        />
        <StuckLeads rows={mine.stuck} />
        <ReviewCard review={weekly.get(staff.id) ?? null} title="Рекомендации на неделю" />
        <PlanFactBlock plans={planRows} canAdd={false} canEdit={false} staffOptions={[]} />
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
            { value: money(b.due), label: "к выплате", tone: "green" },
            { value: String(teamRows.reduce((s, r) => s + r.week.inWork, 0) + mine.inWork), label: "лидов в работе у команды" },
            { value: String(teamStuck.length + mine.stuck.length), label: "срочно связаться", tone: teamStuck.length + mine.stuck.length ? "gold" : "plain" },
            { value: money(teamRows.reduce((s, r) => s + r.week.revenue, 0) + mine.revenue), label: "поступлений за неделю" },
          ]}
        />
        <ReviewCard review={daily.get(staff.id) ?? null} title="На сегодня" />
        <StuckLeads rows={[...mine.stuck, ...teamStuck]} names={names} />
        <TeamTable rows={teamRows} showMoney={false} />
        <TeamReviews rows={teamReviews} />
        <ReviewCard review={weekly.get(staff.id) ?? null} title="Рекомендации на неделю" />
        <BestOfWeek rows={teamRows} />
        <PlanFactBlock plans={planRows} canAdd={options.length > 0} canEdit={false} staffOptions={options} />
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

  return (
    <div className="mb-8 space-y-4">
      {notice ? <p className="rounded-xl border border-line bg-surface px-4 py-2 text-sm text-muted">{notice}</p> : null}
      <ContractsToSign rows={contracts} />
      <Tiles
        items={[
          { value: money(thisMonth?.revenue ?? 0), label: "поступления за месяц", tone: "green" },
          { value: money(thisMonth?.expenses ?? 0), label: "расходы за месяц" },
          { value: money(expected.reduce((s, r) => s + r.remaining, 0)), label: "ожидаем от клиентов" },
          { value: money(dueAll), label: "к выплате команде", tone: dueAll > 0 ? "gold" : "plain" },
        ]}
      />
      <ReviewCard review={daily.get(staff.id) ?? null} title="На сегодня" canRefresh />
      <TaxesSoon rows={taxes} />
      <StuckLeads rows={allStuck} names={names} />
      <CashChart rows={cash} />
      <ExpectedPayments rows={expected} names={names} />
      <TeamTable rows={teamRows} showMoney />
      <BestOfWeek rows={teamRows} />
      <TeamReviews rows={teamReviews} />
      <PlanFactBlock plans={planRows} canAdd={options.length > 0} canEdit staffOptions={options} />
    </div>
  );
}
