import { AdminShell } from "@/components/admin/shell";
import { Bars, WeeklyBars } from "@/components/admin/bars";
import { statusFilterDict } from "@/content/admin-panel/home";
import { leadChannelDict } from "@/content/admin-panel/lead-origin";
import { leadLocaleDict, statsDict, statsSourceDict } from "@/content/admin-panel/stats";
import { requireStaff } from "@/lib/admin/guard";
import { pick, type Picked } from "@/lib/admin/i18n";
import { seesEveryone } from "@/lib/admin/roles";
import { teamOf } from "@/lib/admin/team";
import { STATS_LIMIT, loadStaffStats, loadStats } from "@/lib/admin/stats";

export const dynamic = "force-dynamic";

/** Цвет закреплён за грейдом, а не за его местом в списке. */
const GRADE_COLOR: Record<string, string> = {
  A: "var(--color-chart-1)",
  B: "var(--color-chart-2)",
  C: "var(--color-chart-3)",
  D: "var(--color-chart-4)",
};

/** Минуты в человеческое: «14 мин», «3 ч 20 мин», «2 дн». */
function humanMinutes(minutes: number | null, t: Picked<typeof statsDict>): string {
  if (minutes === null) return "—";
  if (minutes < 60) return t.minutes(Math.round(minutes));
  if (minutes < 60 * 24) {
    const hours = Math.floor(minutes / 60);
    const rest = Math.round(minutes % 60);
    return rest ? t.hoursMinutes(hours, rest) : t.hours(hours);
  }
  return t.days(Math.round(minutes / (60 * 24)));
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
  // Админ — всех, руководитель — себя и своих, менеджер — никого: публичный
  // рейтинг рядом с именем коллеги меняет поведение раньше, чем результат.
  const perStaff =
    staff.role === "admin"
      ? await loadStaffStats()
      : staff.role === "head"
        ? await loadStaffStats([staff.id, ...(await teamOf(staff.id))])
        : [];
  const locale = staff.panel_locale;
  const t = pick(statsDict, locale);
  const statusLabels: Record<string, string> = pick(statusFilterDict, locale);
  const sourceLabels: Record<string, string> = { ...pick(leadChannelDict, locale), ...pick(statsSourceDict, locale) };
  const localeLabels: Record<string, string> = pick(leadLocaleDict, locale);

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>

      {stats.offline ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          {t.offline}
        </p>
      ) : null}

      {stats.truncated ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          {t.truncated(STATS_LIMIT)}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile value={stats.total} label={t.tileTotal} />
        <Tile value={stats.taken} label={t.tileTaken} />
        <Tile
          value={stats.winRate === null ? "—" : `${stats.winRate}%`}
          label={t.tileWinRate}
          hint={t.tileWinRateHint}
        />
        <Tile
          value={humanMinutes(stats.medianMinutesToTake, t)}
          label={t.tileMedian}
          hint={
            stats.slowTakes
              ? t.tileMedianSlow(stats.slowTakes)
              : t.tileMedianHint
          }
        />
      </div>

      <div className="mt-4">
        <Panel
          title={t.weekly}
          note={t.weeklyNote}
        >
          <WeeklyBars rows={stats.weekly} locale={locale} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title={t.grade}
          note={t.gradeNote(stats.averageScore)}
        >
          <Bars rows={stats.byGrade} colors={GRADE_COLOR} total={stats.total} locale={locale} />
        </Panel>

        <Panel title={t.statuses}>
          <Bars rows={stats.byStatus} labels={statusLabels} total={stats.total} locale={locale} />
        </Panel>

        <Panel title={t.sources}>
          <Bars rows={stats.bySource} labels={sourceLabels} total={stats.total} locale={locale} />
        </Panel>

        <Panel title={t.locales}>
          <Bars rows={stats.byLocale} labels={localeLabels} total={stats.total} locale={locale} />
        </Panel>

        <Panel
          title={t.services}
          note={t.servicesNote}
        >
          <Bars rows={stats.topServices} empty={t.servicesEmpty} locale={locale} />
        </Panel>

        <Panel
          title={t.discount}
          note={t.discountNote}
        >
          <p className="mt-3 font-mono text-2xl">{stats.discounts}</p>
          <p className="mt-1 text-xs text-faint">
            {stats.total
              ? t.discountShare(Math.round((stats.discounts / stats.total) * 100))
              : t.discountNothing}
          </p>
          {stats.discounts ? (
            <p className="mt-2 text-xs text-muted">
              {t.discountSplit(stats.discountsMinute, stats.discounts - stats.discountsMinute)}
            </p>
          ) : null}
        </Panel>
      </div>

      {seesEveryone(staff.role) ? (
        <div className="mt-4">
          <Panel
            title={staff.role === "head" ? t.byTeam : t.byManagers}
            note={t.perStaffNote}
          >
            {perStaff.length ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-0 border-collapse text-sm sm:min-w-[420px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-faint">
                      <th className="py-2 font-medium">{t.colWho}</th>
                      <th className="py-2 font-medium">{t.colActive}</th>
                      <th className="py-2 font-medium">{t.colWon}</th>
                      <th className="py-2 font-medium">{t.colLost}</th>
                      <th className="py-2 font-medium">{t.colTotal}</th>
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
              <p className="mt-3 text-sm text-muted">{t.nobody}</p>
            )}
          </Panel>
        </div>
      ) : null}
    </AdminShell>
  );
}
