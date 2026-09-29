import Link from "next/link";

import { deleteExpense, deletePayout, saveExpense, savePayout } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { HelpHint } from "@/components/admin/help-link";
import { helpAnchor } from "@/lib/admin/help";
import { financeDict } from "@/content/admin-panel/finance";
import { stageDict } from "@/content/admin-panel/projects";
import {
  ACCRUAL_TR,
  EXPENSE_CATEGORIES,
  EXPENSE_TR,
  GRADE_TR,
  KIND_TR,
  accrualState,
  accrualsOf,
  balanceOf,
  earnersOf,
  founderShares,
  foundersPool,
  isFounder,
  money as moneyIn,
  ownerShare,
  paidOf,
  profitOf,
  visibleStaff,
  type Accrual,
} from "@/lib/admin/finance";
import { requireStaff } from "@/lib/admin/guard";
import { pick, type Picked } from "@/lib/admin/i18n";
import { seesOwnerMoney } from "@/lib/admin/roles";
import { loadExpenses, loadLedger, sharesOf } from "@/lib/admin/ledger";
import { partnerAccrualOf, type PartnerAccrual } from "@/lib/partners/rules";
import { teamOf } from "@/lib/admin/team";

export const dynamic = "force-dynamic";

/**
 * Финансы: у кого что заработано, заморожено и выплачено, и откуда это
 * взялось — по проектам.
 *
 * Границу держит страница, а не меню: менеджер видит свои проекты и свой
 * баланс, руководитель — свою команду, владелец — всё. Начисления не
 * хранятся: они считаются из суммы, налога, себестоимости и платежей при
 * каждом открытии, поэтому правка себестоимости в проекте меняет их сразу.
 */

type T = Picked<typeof financeDict>;

/** Ответ действия (`?r=`) — код из ./actions, текст — на языке панели. */
function resultOf(code: string, t: T): { text: string; tone: "ok" | "warn" } | null {
  const texts: Record<string, string> = {
    ok: t.r_ok,
    forbidden: t.r_forbidden,
    invalid: t.r_invalid,
    gone: t.r_gone,
    failed: t.r_failed,
    offline: t.r_offline,
  };
  if (!Object.hasOwn(texts, code)) return null;
  return { text: texts[code], tone: code === "ok" ? "ok" : "warn" };
}

const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";
const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";
const TH = "px-4 py-3 font-normal";
const TD = "px-4 py-3";

/** «13.09.26» из даты платежа — она хранится днём, без часов и пояса. */
function day(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y.slice(2)}`;
}

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const staff = await requireStaff();
  const { r } = await searchParams;
  const locale = staff.panel_locale;
  const t = pick(financeDict, locale);
  const notice = r ? resultOf(r, t) : null;
  // Суммы — с разрядами по языку панели.
  const money = (usd: number | null) => moneyIn(usd, locale);
  const stageOf = (stage: string) =>
    Object.hasOwn(stageDict, stage) ? stageDict[stage as keyof typeof stageDict][locale] : stage;

  const team = staff.role === "head" ? await teamOf(staff.id) : [];
  const scope = visibleStaff(staff, team);
  const ledger = await loadLedger(scope);
  const isAdmin = staff.role === "admin";
  // Доля студии — отдельное право, не «он же админ». Руководитель проектов
  // видит свои начисления и начисления команды, но не то, что остаётся
  // владельцу: эта цифра ему в работе не нужна.
  const ownerMoney = seesOwnerMoney(staff.role);

  const earners = earnersOf(ledger.people);
  const accruals = ledger.projects.flatMap((p) =>
    accrualsOf(p, ledger.payments, earners, sharesOf(p.id, ledger.shares)),
  );
  const byProject = new Map<string, Accrual[]>();
  for (const a of accruals) byProject.set(a.project_id, [...(byProject.get(a.project_id) ?? []), a]);

  // Партнёрская строка: кто привёл клиента, тому — процент от той же прибыли.
  const partnerLines = new Map<string, PartnerAccrual>();
  for (const p of ledger.projects) {
    const partner = p.partner_id ? ledger.partners.get(p.partner_id) : undefined;
    if (!partner) continue;
    const line = partnerAccrualOf(p, ledger.payments, partner);
    if (line) partnerLines.set(p.id, line);
  }
  const partnerTotal = sum([...partnerLines.values()].map((l) => l.amount_usd));

  // Расходы и котёл соучредителей — только владельцу. Доля соучредителя это
  // тот же котёл в другой пропорции, поэтому показать её здесь значило бы
  // показать и доход владельца. Кто сколько получил — владелец говорит сам.
  const expenses = ownerMoney ? await loadExpenses() : [];
  const founders = ownerMoney
    ? ledger.people.filter((p) => p.is_active && isFounder(p))
    : [];
  const pool = ownerMoney
    ? foundersPool(ledger.projects, ledger.payments, accruals, expenses)
    : null;
  const shares = pool ? founderShares(pool.pool, founders) : [];

  const nameOf = (id: string | null) =>
    ledger.people.find((p) => p.id === id)?.display_name ?? "—";

  // Люди в круге. Владельца в списке нет: ему остаётся остаток, а не
  // начисление. Отключённые остаются, пока за ними числятся деньги.
  const people = ledger.people.filter((p) => {
    if (p.role === "admin") return false;
    if (scope !== "all") return scope.includes(p.id);
    return (
      p.is_active ||
      accruals.some((a) => a.staff_id === p.id && a.amount_usd > 0) ||
      ledger.payouts.some((po) => po.staff_id === p.id)
    );
  });
  const rows = people.map((person) => ({
    person,
    balance: balanceOf(person.id, accruals, ledger.payouts),
    projects: new Set(accruals.filter((a) => a.staff_id === person.id).map((a) => a.project_id)).size,
  }));

  const live = ledger.projects.filter((p) => p.stage !== "cancelled");
  const totals = {
    contracted: sum(live.map((p) => p.amount_usd ?? 0)),
    paid: sum(ledger.payments.map((p) => p.amount_usd)),
    profit: sum(live.map((p) => profitOf(p) ?? 0)),
    accrued: sum(accruals.map((a) => a.amount_usd)) + partnerTotal,
    frozen: sum(accruals.filter((a) => a.state === "frozen").map((a) => a.amount_usd)),
    paidOut: sum(ledger.payouts.map((p) => p.amount_usd)),
  };
  const mine = balanceOf(staff.id, accruals, ledger.payouts);
  const withoutCost = live.filter((p) => p.amount_usd !== null && p.dev_cost_usd === null).length;

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-1 text-sm text-muted">
        {isAdmin ? t.introAdmin : staff.role === "head" ? t.introHead : t.introManager}{" "}
        <HelpHint topic={helpAnchor("/admin/finance", "how")} label={t.helpHow} />{" "}
        <HelpHint topic={helpAnchor("/admin/finance", "freeze")} label={t.helpFreeze} />
      </p>

      {notice ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            notice.tone === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      {ledger.offline ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm text-gold">
          {t.offline}
        </p>
      ) : null}

      {/* ── Итоги ─────────────────────────────────────────────────────── */}
      {isAdmin ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card label={t.cardContracted} value={money(totals.contracted)} note={t.cardContractedNote(live.length)} />
          <Card label={t.cardPaid} value={money(totals.paid)} />
          <Card
            label={t.cardProfit}
            value={money(totals.profit)}
            note={withoutCost ? t.cardProfitNoCost(withoutCost) : t.cardProfitFormula}
            warn={withoutCost > 0}
          />
          <Card label={t.cardAccrued} value={money(totals.accrued)} note={t.cardAccruedNote(money(partnerTotal), money(totals.frozen))} />
          <Card label={t.cardOwner} value={money(totals.profit - totals.accrued)} note={t.cardOwnerNote(money(totals.paidOut))} />
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card label={t.cardEarned} value={money(mine.earned)} note={t.cardEarnedNote} />
          <Card label={t.cardFrozen} value={money(mine.frozen)} note={t.cardFrozenNote} />
          <Card label={t.cardPaidOut} value={money(mine.paid_out)} />
          <Card label={t.cardDue} value={money(mine.due)} warn={mine.due < 0} note={mine.due < 0 ? t.cardDueAhead : undefined} />
        </div>
      )}

      {/* ── По людям ──────────────────────────────────────────────────── */}
      {staff.role !== "manager" ? (
        <section className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[820px]">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
              <tr>
                <th className={TH}>{t.colWho}</th>
                <th className={TH}>{t.colGrade}</th>
                <th className={TH}>{t.colProjects}</th>
                <th className={TH}>{t.colFrozen}</th>
                <th className={TH}>{t.colEarned}</th>
                <th className={TH}>{t.colPaidOut}</th>
                <th className={TH}>{t.colDue}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ person, balance, projects }) => (
                <tr key={person.id} className="border-b border-line-soft last:border-0">
                  <td data-label={t.colWho} className={TD}>
                    {person.display_name}
                    {person.is_active ? null : <span className="ml-2 text-xs text-faint">{t.disabled}</span>}
                  </td>
                  <td data-label={t.colGrade} className={`${TD} text-xs text-muted`}>
                    {GRADE_TR[person.grade][locale]}
                    {person.rate_percent !== null ? ` · ${person.rate_percent} %` : ""}
                  </td>
                  <td data-label={t.colProjects} className={`${TD} font-mono text-xs`}>{projects}</td>
                  <td data-label={t.colFrozen} className={`${TD} font-mono text-xs text-muted`}>{money(balance.frozen)}</td>
                  <td data-label={t.colEarned} className={`${TD} font-mono text-xs`}>{money(balance.earned)}</td>
                  <td data-label={t.colPaidOut} className={`${TD} font-mono text-xs text-muted`}>{money(balance.paid_out)}</td>
                  <td data-label={t.colDue} className={`${TD} font-mono text-xs ${balance.due > 0 ? "text-green" : balance.due < 0 ? "text-gold" : ""}`}>
                    {money(balance.due)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-sm text-muted">
                    {t.peopleEmpty}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      ) : null}

      {/* ── Проекты ───────────────────────────────────────────────────── */}
      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">{t.byProjects}</h2>
      <section className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className={`cards-on-phone w-full min-w-0 text-sm ${isAdmin ? "sm:min-w-[1240px]" : "sm:min-w-[880px]"}`}>
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className={TH}>{t.colProject}</th>
              <th className={TH}>{t.colOwner}</th>
              <th className={TH}>{t.colKind}</th>
              <th className={TH}>{t.colAmount}</th>
              <th className={TH}>{t.colPaid}</th>
              {/* Налог, себестоимость и прибыль — только владельцу: по ним считается его
                  доля, а это его информация, не команды. */}
              {isAdmin ? (
                <>
                  <th className={TH}>{t.colTax}</th>
                  <th className={TH}>{t.colCost}</th>
                  <th className={TH}>{t.colProfit}</th>
                </>
              ) : null}
              <th className={TH}>{t.colAccruals}</th>
              {ownerMoney ? <th className={TH}>{t.colToOwner}</th> : null}
            </tr>
          </thead>
          <tbody>
            {ledger.projects.map((project) => {
              // Не владелец видит только строки людей из своего круга: менеджер —
              // свою, руководитель — свои и команды. Партнёрская строка — владельцу.
              const lines = (byProject.get(project.id) ?? []).filter(
                (a) => isAdmin || (scope !== "all" && scope.includes(a.staff_id)),
              );
              const partnerLine = isAdmin ? (partnerLines.get(project.id) ?? null) : null;
              const paid = paidOf(project.id, ledger.payments);
              const state = accrualState(project, paid);
              const profit = profitOf(project);
              return (
                <tr key={project.id} className="border-b border-line-soft last:border-0 align-top">
                  <td data-label={t.colProject} className={TD}>
                    <Link href={`/admin/projects/${project.id}`} className="hover:text-green">
                      {project.title}
                    </Link>
                    <span className="block text-xs text-faint">
                      {project.client || t.noClient} · {stageOf(project.stage)}
                    </span>
                  </td>
                  <td data-label={t.colOwner} className={`${TD} text-xs text-muted`}>{nameOf(project.owner_staff_id)}</td>
                  <td data-label={t.colKind} className={`${TD} text-xs text-muted`}>{KIND_TR[project.kind][locale]}</td>
                  <td data-label={t.colAmount} className={`${TD} font-mono text-xs`}>{money(project.amount_usd)}</td>
                  <td data-label={t.colPaid} className={`${TD} font-mono text-xs`}>
                    {money(paid)}
                    <span className={`block font-sans ${state === "earned" ? "text-green" : state === "void" ? "text-faint" : "text-gold"}`}>
                      {project.stage === "cancelled" ? t.cancelled : state === "earned" ? t.paidFull : t.paidPart}
                    </span>
                  </td>
                  {isAdmin ? (
                    <>
                      <td data-label={t.colTax} className={`${TD} font-mono text-xs text-muted`}>{project.tax_percent} %</td>
                      <td data-label={t.colCost} className={`${TD} font-mono text-xs ${project.dev_cost_usd === null && project.amount_usd !== null ? "text-gold" : "text-muted"}`}>
                        {project.dev_cost_usd === null ? t.costMissing : money(project.dev_cost_usd)}
                      </td>
                      <td data-label={t.colProfit} className={`${TD} font-mono text-xs ${profit !== null && profit < 0 ? "text-gold" : ""}`}>{money(profit)}</td>
                    </>
                  ) : null}
                  <td data-label={t.colAccruals} className={`${TD} text-xs`}>
                    {lines.length === 0 && !partnerLine ? (
                      <span className="text-faint">—</span>
                    ) : (
                      lines.map((a) => (
                        <span key={`${a.staff_id}-${a.share}`} className="block">
                          {nameOf(a.staff_id)} {a.percent} %{a.manual ? t.manual : ""} — <span className="font-mono">{money(a.amount_usd)}</span>
                          <span className={`ml-1 ${a.state === "earned" ? "text-green" : a.state === "void" ? "text-faint" : "text-gold"}`}>
                            {ACCRUAL_TR[a.state][locale]}
                          </span>
                        </span>
                      ))
                    )}
                    {partnerLine ? (
                      <span className="block">
                        {t.partner} {ledger.partners.get(partnerLine.partner_id)?.name ?? "—"} {partnerLine.percent} %{partnerLine.manual ? t.manual : ""} —{" "}
                        <span className="font-mono">{money(partnerLine.amount_usd)}</span>
                        <span className={`ml-1 ${partnerLine.state === "earned" ? "text-green" : partnerLine.state === "void" ? "text-faint" : "text-gold"}`}>
                          {partnerLine.void_reason ? t.notCounted : ACCRUAL_TR[partnerLine.state][locale]}
                        </span>
                      </span>
                    ) : null}
                  </td>
                  {ownerMoney ? (
                    <td data-label={t.colToOwner} className={`${TD} font-mono text-xs`}>
                      {(() => {
                        const own = ownerShare(project, lines);
                        return money(own === null ? null : own - (partnerLine?.amount_usd ?? 0));
                      })()}
                    </td>
                  ) : null}
                </tr>
              );
            })}
            {ledger.projects.length === 0 ? (
              <tr>
                <td colSpan={ownerMoney ? 10 : 6} className="px-4 py-6 text-sm text-muted">
                  {t.projectsEmpty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* ── Выплаты ───────────────────────────────────────────────────── */}
      <h2 className="mt-8 flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
        {t.payouts}
        <HelpHint topic={helpAnchor("/admin/finance", "payouts")} label={t.helpPayouts} />
      </h2>
      {isAdmin ? (
        <form action={savePayout} className="mt-2 grid gap-3 rounded-xl border border-line bg-surface px-5 py-4 sm:grid-cols-5">
          <label className="block text-xs text-faint">
            {t.fieldTo}
            <select name="staff" required defaultValue="" className={`mt-1 ${INPUT}`}>
              <option value="" disabled>
                {t.choose}
              </option>
              {ledger.people
                .filter((p) => p.is_active && p.role !== "admin")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-xs text-faint">
            {t.fieldAmount}
            <input name="amount" required inputMode="numeric" placeholder="1 200" className={`mt-1 ${INPUT}`} />
          </label>
          <label className="block text-xs text-faint">
            {t.fieldDate}
            <input name="paid_on" type="date" className={`mt-1 ${INPUT}`} />
          </label>
          <label className="block text-xs text-faint">
            {t.fieldNote}
            <input name="note" maxLength={500} placeholder={t.notePlaceholder} className={`mt-1 ${INPUT}`} />
          </label>
          <div className="flex items-end">
            <button type="submit" className={BUTTON}>
              {t.savePayout}
            </button>
          </div>
        </form>
      ) : null}

      <section className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[640px]">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className={TH}>{t.colWhen}</th>
              <th className={TH}>{t.colTo}</th>
              <th className={TH}>{t.colAmount}</th>
              <th className={TH}>{t.colNote}</th>
              {isAdmin ? <th className={TH} /> : null}
            </tr>
          </thead>
          <tbody>
            {ledger.payouts.map((payout) => (
              <tr key={payout.id} className="border-b border-line-soft last:border-0">
                <td data-label={t.colWhen} className={`${TD} text-xs text-muted`}>{day(payout.paid_on)}</td>
                <td data-label={t.colTo} className={TD}>{payout.staff_name ?? nameOf(payout.staff_id)}</td>
                <td data-label={t.colAmount} className={`${TD} font-mono text-xs`}>{money(payout.amount_usd)}</td>
                <td data-label={t.colNote} className={`${TD} text-xs text-muted`}>{payout.note ?? ""}</td>
                {isAdmin ? (
                  <td data-label="" className={TD}>
                    <form action={deletePayout}>
                      <input type="hidden" name="payout" value={payout.id} />
                      <button type="submit" className="text-xs text-faint hover:text-gold">
                        {t.remove}
                      </button>
                    </form>
                  </td>
                ) : null}
              </tr>
            ))}
            {ledger.payouts.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-6 text-sm text-muted">
                  {t.payoutsEmpty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* ── Котёл соучредителей ─────────────────────────────────────────── */}
      {pool && shares.length ? (
        <section className="mt-8">
          <h2 className="text-sm uppercase tracking-wider text-faint">{t.founders}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted">{t.foundersNote}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card label={t.poolEarned} value={money(pool.earned)} note={t.poolEarnedNote} />
            <Card
              label={t.poolFrozen}
              value={money(pool.frozen)}
              note={t.poolFrozenNote}
              warn={pool.frozen > 0}
            />
            <Card label={t.poolExpenses} value={money(pool.expenses)} note={t.poolExpensesNote} />
            <Card
              label={t.poolShare}
              value={money(pool.pool)}
              note={t.poolShareNote}
              warn={pool.pool < 0}
            />
          </div>

          <ul className="mt-4 flex flex-col gap-2 rounded-xl border border-line bg-surface px-5 py-4 text-sm">
            {shares.map((share) => (
              <li key={share.staff_id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span>{nameOf(share.staff_id)}</span>
                <span className="text-xs text-faint">{share.percent} %</span>
                <span className={`font-mono ${share.amount_usd < 0 ? "text-gold" : ""}`}>
                  {money(share.amount_usd)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── Расходы студии ──────────────────────────────────────────────── */}
      {ownerMoney ? (
        <section className="mt-8">
          <h2 className="text-sm uppercase tracking-wider text-faint">{t.expenses}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted">{t.expensesNote}</p>

          <form
            action={saveExpense}
            className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface px-5 py-4"
          >
            <label className="text-xs text-faint">
              {t.fieldAmount}
              <input
                name="amount"
                inputMode="numeric"
                required
                placeholder="250"
                className={`mt-1 block w-28 ${INPUT}`}
              />
            </label>
            <label className="text-xs text-faint">
              {t.fieldDate}
              <input name="spent_on" type="date" className={`mt-1 block w-40 ${INPUT}`} />
            </label>
            <label className="text-xs text-faint">
              {t.fieldWhat}
              <select name="category" defaultValue="ads" className={`mt-1 block w-48 ${INPUT}`}>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {EXPENSE_TR[category][locale]}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[12rem] flex-1 text-xs text-faint">
              {t.fieldComment}
              <input
                name="note"
                placeholder={t.commentPlaceholder}
                className={`mt-1 block w-full ${INPUT}`}
              />
            </label>
            <button type="submit" className={BUTTON}>
              {t.saveExpense}
            </button>
          </form>

          <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[720px]">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
                <tr>
                  <th className={TH}>{t.colWhen}</th>
                  <th className={TH}>{t.colWhat}</th>
                  <th className={TH}>{t.colHowMuch}</th>
                  <th className={TH}>{t.colComment}</th>
                  <th className={TH} />
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-line-soft last:border-0">
                    <td data-label={t.colWhen} className={`${TD} text-xs text-faint`}>{day(expense.spent_on)}</td>
                    <td data-label={t.colWhat} className={TD}>{EXPENSE_TR[expense.category][locale]}</td>
                    <td data-label={t.colHowMuch} className={`${TD} font-mono`}>{money(expense.amount_usd)}</td>
                    <td data-label={t.colComment} className={`${TD} text-xs text-muted`}>
                      {expense.note ?? "—"}
                    </td>
                    <td data-label="" className={TD}>
                      <form action={deleteExpense}>
                        <input type="hidden" name="expense" value={expense.id} />
                        <button type="submit" className="text-xs text-faint hover:text-gold">
                          {t.remove}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-sm text-muted">
                      {t.expensesEmpty}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="mt-8 max-w-2xl space-y-3 text-xs leading-relaxed text-faint">
        <p>
          <span className="text-muted">{t.ratesTitle}</span> {t.rates}
        </p>
        <p>
          <span className="text-muted">{t.freezeTitle}</span> {t.freeze}
        </p>
      </div>
    </AdminShell>
  );
}

function Card({
  label,
  value,
  note,
  warn = false,
}: {
  label: string;
  value: string;
  note?: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-1 font-mono text-2xl ${warn ? "text-gold" : ""}`}>{value}</p>
      {note ? <p className={`mt-1 text-xs ${warn ? "text-gold" : "text-faint"}`}>{note}</p> : null}
    </div>
  );
}
