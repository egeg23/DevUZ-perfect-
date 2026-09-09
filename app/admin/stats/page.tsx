import { AdminShell } from "@/components/admin/shell";
import { Bars, WeeklyBars } from "@/components/admin/bars";
import { requireStaff } from "@/lib/admin/guard";
import { STATS_LIMIT, loadStaffStats, loadStats } from "@/lib/admin/stats";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  new: "новые",
  taken: "в работе",
  dropped: "отложены",
  won: "выиграны",
  lost: "проиграны",
};

const SOURCE_LABEL: Record<string, string> = {
  chat: "чат на сайте",
  form: "форма",
  audit: "проверка сайта",
};

const LOCALE_LABEL: Record<string, string> = {
  ru: "русский",
  en: "английский",
  uz: "узбекский",
  zh: "китайский",
};

/** Цвет закреплён за грейдом, а не за его местом в списке. */
const GRADE_COLOR: Record<string, string> = {
  A: "var(--color-chart-1)",
  B: "var(--color-chart-2)",
  C: "var(--color-chart-3)",
  D: "var(--color-chart-4)",
};

/** Минуты в человеческое: «14 мин», «3 ч 20 мин», «2 дн». */
function humanMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${Math.round(minutes)} мин`;
  if (minutes < 60 * 24) {
    const hours = Math.floor(minutes / 60);
    const rest = Math.round(minutes % 60);
    return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
  }
  return `${Math.round(minutes / (60 * 24))} дн`;
}

/**
 * Крупное число без графика.
 *
 * Одно значение — это не диаграмма: столбик из одного столбика показывает
 * ровно столько же, сколько само число, но занимает вчетверо больше места.
 */
function Tile({
  value,
  label,
  hint,
}: {
  value: string | number;
  label: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="font-mono text-2xl">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-faint">{label}</p>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-faint">{hint}</p> : null}
    </div>
  );
}

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface px-5 py-4">
      <h2 className="text-xs uppercase tracking-wider text-faint">{title}</h2>
      {children}
      {note ? <p className="mt-3 text-xs leading-relaxed text-faint">{note}</p> : null}
    </section>
  );
}

export default async function StatsPage() {
  const staff = await requireStaff();
  const stats = await loadStats();
  const perStaff = staff.role === "admin" ? await loadStaffStats() : [];

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">Статистика</h1>

      {stats.offline ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          База недоступна — это не «лидов нет», а «панель сейчас ничего не видит».
        </p>
      ) : null}

      {stats.truncated ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          В расчёт вошли последние {STATS_LIMIT} лидов — это предел выборки, и
          числа ниже неполные.
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile value={stats.total} label="всего лидов" />
        <Tile value={stats.taken} label="взято в работу" />
        <Tile
          value={stats.winRate === null ? "—" : `${stats.winRate}%`}
          label="доля выигранных"
          hint="Считается от закрытых сделок, а не от всех лидов: то, что ещё в работе, не проиграно."
        />
        <Tile
          value={humanMinutes(stats.medianMinutesToTake)}
          label="медиана до взятия"
          hint={
            stats.slowTakes
              ? `Дольше часа разобрали ${stats.slowTakes} — за это время лид успевает написать в другое место.`
              : "Медиана, а не среднее: один забытый лид сдвинул бы среднее так, что оно перестало бы описывать обычный день."
          }
        />
      </div>

      <div className="mt-4">
        <Panel
          title="Приходит по неделям"
          note="Неделя считается от понедельника."
        >
          <WeeklyBars rows={stats.weekly} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Качество лидов"
          note={`Средний балл — ${stats.averageScore} из 100. Цвет закреплён за грейдом, но читать его необязательно: рядом стоит буква.`}
        >
          <Bars rows={stats.byGrade} colors={GRADE_COLOR} total={stats.total} />
        </Panel>

        <Panel title="Статусы">
          <Bars rows={stats.byStatus} labels={STATUS_LABEL} total={stats.total} />
        </Panel>

        <Panel title="Откуда приходят">
          <Bars rows={stats.bySource} labels={SOURCE_LABEL} total={stats.total} />
        </Panel>

        <Panel title="Язык обращения">
          <Bars rows={stats.byLocale} labels={LOCALE_LABEL} total={stats.total} />
        </Panel>

        <Panel
          title="Что спрашивают"
          note="Один лид может попасть сразу в несколько строк, поэтому сумма больше числа лидов."
        >
          <Bars rows={stats.topServices} empty="Услуги пока не проставлялись." />
        </Panel>

        <Panel
          title="Скидка за несработавшую гарантию"
          note="Каждая такая скидка — тридцать процентов от чека. Это про маржу, а не про статистику."
        >
          <p className="mt-3 font-mono text-2xl">{stats.discounts}</p>
          <p className="mt-1 text-xs text-faint">
            {stats.total
              ? `${Math.round((stats.discounts / stats.total) * 100)}% от всех обращений`
              : "пока не с чем сравнивать"}
          </p>
        </Panel>
      </div>

      {staff.role === "admin" ? (
        <div className="mt-4">
          <Panel
            title="По менеджерам"
            note="Виден только админу. Публичный рейтинг рядом с именем коллеги меняет поведение раньше, чем результат: лиды начинают брать по лёгкости, а не по важности."
          >
            {perStaff.length ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-faint">
                      <th className="py-2 font-medium">Кто</th>
                      <th className="py-2 font-medium">В работе</th>
                      <th className="py-2 font-medium">Выиграл</th>
                      <th className="py-2 font-medium">Проиграл</th>
                      <th className="py-2 font-medium">Всего</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perStaff.map((person) => (
                      <tr key={person.staffId} className="border-t border-line-soft">
                        <td className="py-2">{person.name}</td>
                        <td className="py-2 font-mono text-xs text-muted">{person.active}</td>
                        <td className="py-2 font-mono text-xs text-muted">{person.won}</td>
                        <td className="py-2 font-mono text-xs text-muted">{person.lost}</td>
                        <td className="py-2 font-mono text-xs">{person.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Пока никто ничего не брал.</p>
            )}
          </Panel>
        </div>
      ) : null}
    </AdminShell>
  );
}
