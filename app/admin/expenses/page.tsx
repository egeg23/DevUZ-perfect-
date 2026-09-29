import { AdminShell } from "@/components/admin/shell";
import { taxTitleDict } from "@/content/admin-panel/dashboard";
import { expensesDict, taxWhatDict } from "@/content/admin-panel/expenses";
import { EXPENSE_TR, isExpenseCategory, type Expense } from "@/lib/admin/finance";
import { byCategory, splitExpense, splitTotals, type Founder } from "@/lib/admin/expense-split";
import { requireRole } from "@/lib/admin/guard";
import { PANEL_INTL, pick, tr, type PanelLocale, type Tr } from "@/lib/admin/i18n";
import { loadExpenses, loadPeople } from "@/lib/admin/ledger";
import { DEFAULT_DEADLINES, upcoming } from "@/lib/admin/tax-calendar";
import { addStudioExpense, dropStudioExpense } from "@/app/admin/expenses/actions";

export const dynamic = "force-dynamic";

const money = (n: number, locale: PanelLocale) =>
  `$${n.toLocaleString(PANEL_INTL[locale], { maximumFractionDigits: 2 })}`;

/** Подпись по `id` налогового срока; свой срок без перевода — русский текст как есть. */
function taxText(table: Record<string, Tr | undefined>, id: string, fallback: string, locale: PanelLocale): string {
  const entry = table[id];
  return entry ? tr(entry, locale) : fallback;
}
const day = (iso: string) => iso.slice(0, 10).split("-").reverse().join(".");

/**
 * Расходы студии.
 *
 * Раздел для двоих: владельца и второго соучредителя. Здесь видно, на что
 * уходят деньги и сколько из каждой траты пришлось на каждого.
 *
 * Чего здесь нет намеренно — прибыли и долей от неё. Они остались в
 * «Финансах», у владельца: показать руководителю его 30% от прибыли значит
 * показать и остальные 70%, потому что одно делится из другого в уме.
 * Доля от РАСХОДА такой задачи не решает — она и показана.
 */
export default async function ExpensesPage() {
  const staff = await requireRole("admin", "head");
  const locale = staff.panel_locale;
  const t = pick(expensesDict, locale);
  const usd = (n: number) => money(n, locale);
  const [expenses, team] = await Promise.all([loadExpenses(), loadPeople()]);

  const founders: Founder[] = team
    .filter((person) => (person.founder_percent ?? 0) > 0)
    .map((person) => ({
      id: person.id,
      display_name: person.display_name,
      founder_percent: person.founder_percent ?? 0,
    }));

  const total = expenses.reduce((sum: number, e: Expense) => sum + e.amount_usd, 0);
  const totals = splitTotals(expenses, founders);
  const categories = byCategory(expenses);
  const soon = upcoming(DEFAULT_DEADLINES, new Date().toISOString().slice(0, 10));

  return (
    <AdminShell staff={staff}>
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <p className="max-w-2xl text-sm text-muted">
        {t.intro}
      </p>

      {/* Налоги — первым блоком, а не внизу.
          Штраф за просроченную декларацию приходит один раз и целиком, а
          список расходов можно посмотреть и завтра. */}
      <section className="mt-6 rounded-2xl border border-line bg-surface px-6 py-5">
        <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
          {t.taxesSoon}
        </h2>

        {soon.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t.noTaxes}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {soon.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold">{taxText(taxTitleDict, item.id, item.title, locale)}</span>
                <span className="text-muted">{taxText(taxWhatDict, item.id, item.what, locale)}</span>
                <span className={item.daysLeft <= 3 ? "text-amber-500" : "text-faint"}>
                  {day(item.due)} · {t.inDays(item.daysLeft)}
                </span>
                {/* Оговорка стоит рядом с датой, а не сноской внизу: сноску
                    не читают, а штраф приходит один. */}
                {!item.verified ? (
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-500">
                    {t.unverified}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs leading-relaxed text-faint">
          {t.taxNote}
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-xs text-faint">{t.total}</p>
          <p className="mt-1 text-2xl font-semibold">{usd(total)}</p>
        </div>
        {totals.map((share) => (
          <div key={share.founderId} className="rounded-2xl border border-line bg-surface px-5 py-4">
            <p className="text-xs text-faint">
              {share.name} · {share.percent}%
            </p>
            <p className="mt-1 text-2xl font-semibold">{usd(share.amount)}</p>
          </div>
        ))}
      </section>

      {categories.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-line bg-surface px-6 py-5">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
            {t.where}
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            {categories.map((row) => (
              <li key={row.category} className="flex justify-between">
                <span className="text-muted">
                  {isExpenseCategory(row.category) ? tr(EXPENSE_TR[row.category], locale) : row.category}
                </span>
                <span className="tabular-nums">{usd(row.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-line bg-surface px-6 py-5">
        <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
          {t.add}
        </h2>
        <form action={addStudioExpense} className="mt-4 grid gap-3 sm:grid-cols-4">
          <input
            type="date"
            name="spent_on"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
          />
          <select
            name="category"
            className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
          >
            {Object.entries(EXPENSE_TR).map(([key, label]) => (
              <option key={key} value={key}>{tr(label, locale)}</option>
            ))}
          </select>
          <input
            type="number"
            name="amount"
            min={1}
            required
            placeholder="$"
            className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
          />
          <input
            type="text"
            name="note"
            placeholder={t.notePh}
            className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
          />
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
            >
              {t.record}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
          {t.all}
        </h2>
        {expenses.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t.empty}</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-xs text-faint">
              <tr className="border-b border-line">
                <th className="py-2 text-left font-normal">{t.colWhen}</th>
                <th className="py-2 text-left font-normal">{t.colCategory}</th>
                <th className="py-2 text-left font-normal">{t.colWhat}</th>
                <th className="py-2 text-right font-normal">{t.colAmount}</th>
                {founders.map((f) => (
                  <th key={f.id} className="py-2 text-right font-normal">
                    {f.display_name}
                  </th>
                ))}
                {staff.role === "admin" ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense: Expense) => {
                const shares = splitExpense(expense.amount_usd, founders);
                return (
                  <tr key={expense.id} className="border-b border-line-soft last:border-0">
                    <td className="py-2 text-xs text-faint">{day(expense.spent_on)}</td>
                    <td className="py-2">{tr(EXPENSE_TR[expense.category], locale)}</td>
                    <td className="py-2 text-muted">{expense.note ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums">{usd(expense.amount_usd)}</td>
                    {shares.map((share) => (
                      <td key={share.founderId} className="py-2 text-right tabular-nums text-muted">
                        {usd(share.amount)}
                      </td>
                    ))}
                    {staff.role === "admin" ? (
                      <td className="py-2 text-right">
                        <form action={dropStudioExpense}>
                          <input type="hidden" name="id" value={expense.id} />
                          <button type="submit" className="text-xs text-faint hover:text-red-400">
                            {t.remove}
                          </button>
                        </form>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </AdminShell>
  );
}
