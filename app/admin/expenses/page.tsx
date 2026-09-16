import { AdminShell } from "@/components/admin/shell";
import { EXPENSE_TITLE, isExpenseCategory, type Expense } from "@/lib/admin/finance";
import { byCategory, splitExpense, splitTotals, type Founder } from "@/lib/admin/expense-split";
import { requireRole } from "@/lib/admin/guard";
import { loadExpenses, loadPeople } from "@/lib/admin/ledger";
import { DEFAULT_DEADLINES, upcoming } from "@/lib/admin/tax-calendar";
import { addStudioExpense, dropStudioExpense } from "@/app/admin/expenses/actions";

export const dynamic = "force-dynamic";

const money = (n: number) => `$${n.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}`;
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
      <h1 className="text-2xl font-semibold">Расходы студии</h1>
      <p className="max-w-2xl text-sm text-muted">
        Общие траты студии: реклама, сервисы, подрядчики. Делятся между
        соучредителями в той же пропорции, что и прибыль. Себестоимость
        конкретного проекта сюда не идёт — она уже вычтена в самом проекте.
      </p>

      {/* Налоги — первым блоком, а не внизу.
          Штраф за просроченную декларацию приходит один раз и целиком, а
          список расходов можно посмотреть и завтра. */}
      <section className="mt-6 rounded-2xl border border-line bg-surface px-6 py-5">
        <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
          Налоги: что подходит
        </h2>

        {soon.length === 0 ? (
          <p className="mt-3 text-sm text-muted">В ближайшие две недели сроков нет.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {soon.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold">{item.title}</span>
                <span className="text-muted">{item.what}</span>
                <span className={item.daysLeft <= 3 ? "text-amber-500" : "text-faint"}>
                  {day(item.due)} · через {item.daysLeft} дн.
                </span>
                {/* Оговорка стоит рядом с датой, а не сноской внизу: сноску
                    не читают, а штраф приходит один. */}
                {!item.verified ? (
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-500">
                    дата не подтверждена бухгалтером
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs leading-relaxed text-faint">
          Сроки выше — заготовка под разговор с бухгалтером, а не инструкция.
          Режим ИП зависит от оборота и вида деятельности, правила меняются, и
          знать их наверняка может только тот, кто ведёт конкретное ИП.
          Календарь, которому доверяют по ошибке, опаснее отсутствующего.
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-xs text-faint">Всего расходов</p>
          <p className="mt-1 text-2xl font-semibold">{money(total)}</p>
        </div>
        {totals.map((share) => (
          <div key={share.founderId} className="rounded-2xl border border-line bg-surface px-5 py-4">
            <p className="text-xs text-faint">
              {share.name} · {share.percent}%
            </p>
            <p className="mt-1 text-2xl font-semibold">{money(share.amount)}</p>
          </div>
        ))}
      </section>

      {categories.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-line bg-surface px-6 py-5">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
            Куда уходит
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            {categories.map((row) => (
              <li key={row.category} className="flex justify-between">
                <span className="text-muted">
                  {isExpenseCategory(row.category) ? EXPENSE_TITLE[row.category] : row.category}
                </span>
                <span className="tabular-nums">{money(row.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-line bg-surface px-6 py-5">
        <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
          Добавить расход
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
            {Object.entries(EXPENSE_TITLE).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
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
            placeholder="на что"
            className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
          />
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
            >
              Записать
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
          Все траты
        </h2>
        {expenses.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Пока ничего не записано.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-xs text-faint">
              <tr className="border-b border-line">
                <th className="py-2 text-left font-normal">Когда</th>
                <th className="py-2 text-left font-normal">Статья</th>
                <th className="py-2 text-left font-normal">На что</th>
                <th className="py-2 text-right font-normal">Сумма</th>
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
                    <td className="py-2">{EXPENSE_TITLE[expense.category]}</td>
                    <td className="py-2 text-muted">{expense.note ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums">{money(expense.amount_usd)}</td>
                    {shares.map((share) => (
                      <td key={share.founderId} className="py-2 text-right tabular-nums text-muted">
                        {money(share.amount)}
                      </td>
                    ))}
                    {staff.role === "admin" ? (
                      <td className="py-2 text-right">
                        <form action={dropStudioExpense}>
                          <input type="hidden" name="id" value={expense.id} />
                          <button type="submit" className="text-xs text-faint hover:text-red-400">
                            убрать
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
