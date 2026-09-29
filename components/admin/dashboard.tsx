import Link from "next/link";

import { deletePlan, savePlan } from "@/app/admin/plans/actions";
import { HelpHint } from "@/components/admin/help-link";
import { helpAnchor } from "@/lib/admin/help";
import { dashboardDict, metricDict, taxTitleDict } from "@/content/admin-panel/dashboard";
import { priorityDict } from "@/content/admin-panel/home";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { METRICS, monthLabel, type Expected, type MonthCash, type PlanFact, type StaffPulse, type StuckLead } from "@/lib/admin/pulse";
import type { PendingContract } from "@/lib/admin/pulse-store";
import type { Upcoming } from "@/lib/admin/tax-calendar";
import type { TouchProgress } from "@/lib/admin/touch-plan";

/**
 * Куски личного дашборда. Серверные, без скриптов: цифры считаются на
 * сервере, страница отдаётся готовой.
 *
 * Правило одно на все блоки: сначала то, что требует действия сегодня
 * (договор на подпись, лид без движения), потом деньги, потом всё
 * остальное. Порядок — это и есть приоритет, а не оформление.
 */

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";
const H2 = "text-xs uppercase tracking-wider text-faint";
const FIELD = "rounded-lg border border-line bg-surface-2 px-2 py-1 text-sm";
const BUTTON = "rounded-lg border border-line bg-surface-2 px-3 py-1 text-xs transition hover:border-green/40 hover:text-green";

export const money = (usd: number) => `$${Math.round(usd).toLocaleString("en-US")}`;

/** Слова дашборда на языке панели — у каждого блока свой `locale` от родителя. */
const words = (locale: PanelLocale) => pick(dashboardDict, locale);

/* ── Плитки ────────────────────────────────────────────────────────────── */

export type Tile = { value: string; label: string; tone?: "green" | "gold" | "plain"; hint?: string };

export function Tiles({ items }: { items: Tile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((t) => (
        <div
          key={t.label}
          className={`rounded-xl border px-5 py-4 ${
            t.tone === "green" ? "border-green/30 bg-green/5" : t.tone === "gold" ? "border-gold/40 bg-gold/5" : "border-line bg-surface"
          }`}
        >
          <p className={`font-mono text-2xl ${t.tone === "green" ? "text-green" : t.tone === "gold" ? "text-gold" : ""}`}>{t.value}</p>
          <p className={`mt-1 ${H2}`}>{t.label}</p>
          {t.hint ? <p className="mt-1 text-xs text-muted">{t.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

/* ── Срочно связаться ──────────────────────────────────────────────────── */

export function StuckLeads({
  rows,
  names,
  title,
  locale,
}: {
  rows: StuckLead[];
  names?: Map<string, string>;
  title?: string;
  locale: PanelLocale;
}) {
  const t = words(locale);
  return (
    <section className={`${CARD} ${rows.length ? "border-gold/40" : ""}`}>
      <p className={`${H2} ${rows.length ? "text-gold" : ""} flex items-center gap-2`}>
        {title ?? t.stuckTitle}: {rows.length}
        <HelpHint topic={helpAnchor("/admin", "urgent")} label={t.stuckHint} />
      </p>
      {rows.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {rows.slice(0, 12).map((r) => (
            <li key={r.id} className="flex flex-wrap items-baseline gap-x-3">
              <Link href={`/admin/leads/${r.id}`} className="font-mono hover:text-green">
                {r.label}
              </Link>
              <span className="text-muted">{priorityDict[r.priority as keyof typeof priorityDict]?.[locale] ?? r.priority}</span>
              <span className="text-gold">{t.stuckIdle(r.days)}</span>
              {names && r.staffId ? <span className="text-xs text-faint">{names.get(r.staffId) ?? "—"}</span> : null}
            </li>
          ))}
          {rows.length > 12 ? <li className="text-xs text-faint">{t.andMore(rows.length - 12)}</li> : null}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">{t.stuckEmpty}</p>
      )}
    </section>
  );
}

/* ── План и факт ───────────────────────────────────────────────────────── */

export function PlanFactBlock({
  plans,
  canAdd,
  canEdit,
  staffOptions,
  fixedStaffId,
  locale,
}: {
  plans: (PlanFact & { staffName?: string })[];
  /** Руководитель — заводит новый; владелец — и меняет, и снимает. */
  canAdd: boolean;
  canEdit: boolean;
  staffOptions: { id: string; name: string }[];
  fixedStaffId?: string;
  locale: PanelLocale;
}) {
  const t = words(locale);
  return (
    <section className={CARD}>
      <p className={`${H2} flex items-center gap-2`}>
        {t.planFact}
        <HelpHint topic={helpAnchor("/admin", "plan-fact")} label={t.planFactHint} />
      </p>
      {plans.length ? (
        <ul className="mt-3 space-y-3">
          {plans.map((p) => (
            <li key={p.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span>
                  {p.staffName ? <span className="text-muted">{p.staffName} · </span> : null}
                  {p.period === "week" ? t.periodWeek : t.periodMonth} · {metricDict[p.metric][locale]}
                </span>
                <span className="font-mono">
                  {p.metric === "revenue_usd" ? `${money(p.fact)} / ${money(p.target)}` : `${p.fact} / ${p.target}`}
                  <span className={`ml-2 ${p.percent >= 100 ? "text-green" : p.percent >= 50 ? "" : "text-gold"}`}>{p.percent}%</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-surface-2">
                <div
                  className={`h-1.5 rounded-full ${p.percent >= 100 ? "bg-green" : "bg-gold"}`}
                  style={{ width: `${Math.min(100, p.percent)}%` }}
                />
              </div>
              {canEdit ? (
                <div className="mt-1 flex items-center gap-2">
                  <form action={savePlan} className="flex items-center gap-2">
                    <input type="hidden" name="staff" value={p.staff_id} />
                    <input type="hidden" name="period" value={p.period} />
                    <input type="hidden" name="metric" value={p.metric} />
                    <input name="target" inputMode="numeric" defaultValue={p.target} className={`${FIELD} w-24`} />
                    <button type="submit" className={BUTTON}>{t.planChange}</button>
                  </form>
                  <form action={deletePlan}>
                    <input type="hidden" name="plan" value={p.id} />
                    <button type="submit" className="text-xs text-faint hover:text-gold">{t.planRemove}</button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">
          {canAdd ? t.noPlanCanAdd : t.noPlan}
        </p>
      )}

      {canAdd ? (
        <form action={savePlan} className="mt-4 flex flex-wrap items-end gap-2">
          {fixedStaffId ? (
            <input type="hidden" name="staff" value={fixedStaffId} />
          ) : (
            <label className="text-xs text-faint">
              {t.planWhom}
              <select name="staff" className={`${FIELD} mt-1 block`}>
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-xs text-faint">
            {t.planPeriod}
            <select name="period" className={`${FIELD} mt-1 block`}>
              <option value="week">{t.planThisWeek}</option>
              <option value="month">{t.planThisMonth}</option>
            </select>
          </label>
          <label className="text-xs text-faint">
            {t.planMetric}
            <select name="metric" className={`${FIELD} mt-1 block`}>
              {METRICS.map((m) => (
                <option key={m} value={m}>
                  {metricDict[m][locale]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-faint">
            {t.planTarget}
            <input name="target" inputMode="numeric" required className={`${FIELD} mt-1 block w-24`} />
          </label>
          <button type="submit" className={BUTTON}>
            {t.planSet}
          </button>
        </form>
      ) : null}
    </section>
  );
}

/* ── Команда ───────────────────────────────────────────────────────────── */

export type TeamRow = {
  id: string;
  name: string;
  week: StaffPulse;
  prev: StaffPulse;
  due: number;
  /** Холодные касания с понедельника против недельного плана. */
  touch?: TouchProgress;
};

const delta = (now: number, before: number) =>
  now === before ? "" : now > before ? ` ↑${now - before}` : ` ↓${before - now}`;

export function TeamTable({ rows, showMoney, locale }: { rows: TeamRow[]; showMoney: boolean; locale: PanelLocale }) {
  if (!rows.length) return null;
  const t = words(locale);
  return (
    <section className={CARD}>
      <p className={`${H2} flex items-center gap-2`}>
        {t.teamTitle}
        <HelpHint topic={helpAnchor("/admin", "team-week")} label={t.teamHint} />
      </p>
      <p className="mt-1 text-xs text-muted">{t.teamArrow}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-faint">
            <tr>
              <th className="py-2 pr-4 font-normal">{t.colStaff}</th>
              <th className="py-2 pr-4 font-normal">{t.colInWork}</th>
              <th className="py-2 pr-4 font-normal">{t.colUrgent}</th>
              <th className="py-2 pr-4 font-normal">{t.colTouches}</th>
              <th className="py-2 pr-4 font-normal">{t.colContacts}</th>
              <th className="py-2 pr-4 font-normal">{t.colWon}</th>
              <th className="py-2 pr-4 font-normal">{t.colRevenue}</th>
              <th className="py-2 pr-4 font-normal">{t.colTouchPlan}</th>
              {showMoney ? <th className="py-2 pr-4 font-normal">{t.colDue}</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line-soft">
                <td className="py-2 pr-4">{r.name}</td>
                <td className="py-2 pr-4 font-mono">{r.week.inWork}</td>
                <td className={`py-2 pr-4 font-mono ${r.week.stuck.length ? "text-gold" : ""}`}>{r.week.stuck.length}</td>
                <td className="py-2 pr-4 font-mono">
                  {r.week.touches}
                  <span className="text-xs text-muted">{delta(r.week.touches, r.prev.touches)}</span>
                </td>
                <td className="py-2 pr-4 font-mono">
                  {r.week.contacts}
                  <span className="text-xs text-muted">{delta(r.week.contacts, r.prev.contacts)}</span>
                </td>
                <td className="py-2 pr-4 font-mono">
                  {r.week.won}
                  <span className="text-xs text-muted">{delta(r.week.won, r.prev.won)}</span>
                </td>
                <td className="py-2 pr-4 font-mono">{money(r.week.revenue)}</td>
                <td className="py-2 pr-4 font-mono">
                  <TouchCell touch={r.touch} left={t.touchLeft} />
                </td>
                {showMoney ? <td className="py-2 pr-4 font-mono">{money(r.due)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * План/факт холодных касаний в строке команды.
 *
 * Это не столбец «Касаний» левее: там работа по лидам, здесь — холодные
 * касания из раздела «Касания», по которым руководитель ставит недельный
 * план. Без плана — прочерк, а не «0 из 0».
 */
function TouchCell({ touch, left }: { touch?: TouchProgress; left: (n: number) => string }) {
  if (!touch || touch.plan === null) return <span className="text-faint">—</span>;
  const closed = touch.left === 0;
  return (
    <span className={closed ? "text-green" : ""}>
      {touch.done} / {touch.plan}
      {closed ? null : <span className="block text-xs text-muted">{left(touch.left ?? 0)}</span>}
    </span>
  );
}

/** Лучшие за неделю — по трём разным вещам, чтобы «лучший» не значило «один». */
export function BestOfWeek({ rows, locale }: { rows: TeamRow[]; locale: PanelLocale }) {
  if (rows.length < 2) return null;
  const t = words(locale);
  const top = (pick: (r: TeamRow) => number, fmt: (n: number) => string) => {
    const best = [...rows].sort((a, b) => pick(b) - pick(a))[0];
    return pick(best) > 0 ? `${best.name} — ${fmt(pick(best))}` : t.bestNobody;
  };
  return (
    <section className={CARD}>
      <p className={H2}>{t.bestTitle}</p>
      <ul className="mt-2 space-y-1 text-sm">
        <li>
          <span className="text-muted">{t.bestRevenue}</span> {top((r) => r.week.revenue, money)}
        </li>
        <li>
          <span className="text-muted">{t.bestWon}</span> {top((r) => r.week.won, (n) => `${n}`)}
        </li>
        <li>
          <span className="text-muted">{t.bestTouches}</span> {top((r) => r.week.touches, (n) => `${n}`)}
        </li>
      </ul>
    </section>
  );
}

/* ── Касса по месяцам ──────────────────────────────────────────────────── */

const REVENUE = "#0e9f70";
const EXPENSES = "#c2851a";

/** Столбик со скруглением только сверху — у основания он упирается в ось. */
function bar(x: number, y: number, w: number, h: number): string {
  if (h <= 0) return "";
  const r = Math.min(4, h, w / 2);
  const base = y + h;
  return `M${x},${base} V${y + r} a${r},${r} 0 0 1 ${r},-${r} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} V${base} Z`;
}

const compact = (n: number) => (n >= 10_000 ? `${Math.round(n / 1000)}k` : Math.round(n).toLocaleString("en-US"));

export function CashChart({ rows, locale }: { rows: MonthCash[]; locale: PanelLocale }) {
  const t = words(locale);
  const width = 640;
  const height = 220;
  const left = 8;
  const top = 28;
  const baseline = 180;
  const band = (width - left * 2) / Math.max(rows.length, 1);
  const max = Math.max(1, ...rows.flatMap((r) => [r.revenue, r.expenses]));
  const scale = (v: number) => ((baseline - top) * v) / max;
  const barW = Math.min(24, band / 2 - 6);

  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={H2}>{t.cashTitle}</p>
        <p className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: REVENUE }} /> {t.cashRevenue}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: EXPENSES }} /> {t.cashExpenses}
          </span>
        </p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full text-muted" role="img" aria-label={t.cashAria}>
        <line x1={left} x2={width - left} y1={baseline} y2={baseline} stroke="currentColor" strokeOpacity={0.35} />
        {rows.map((r, i) => {
          const cx = left + band * i + band / 2;
          const rx = cx - barW - 1;
          const ex = cx + 1;
          const rh = scale(r.revenue);
          const eh = scale(r.expenses);
          return (
            <g key={r.month}>
              <path d={bar(rx, baseline - rh, barW, rh)} fill={REVENUE}>
                <title>{`${monthLabel(r.month, locale)}: ${t.cashRevenue} ${money(r.revenue)}`}</title>
              </path>
              <path d={bar(ex, baseline - eh, barW, eh)} fill={EXPENSES}>
                <title>{`${monthLabel(r.month, locale)}: ${t.cashExpenses} ${money(r.expenses)}`}</title>
              </path>
              {r.revenue > 0 ? (
                <text x={rx + barW / 2} y={baseline - rh - 5} textAnchor="middle" fontSize={10} fill="currentColor">
                  {compact(r.revenue)}
                </text>
              ) : null}
              {r.expenses > 0 ? (
                <text x={ex + barW / 2} y={baseline - eh - 5} textAnchor="middle" fontSize={10} fill="currentColor">
                  {compact(r.expenses)}
                </text>
              ) : null}
              <text x={cx} y={baseline + 16} textAnchor="middle" fontSize={11} fill="currentColor">
                {monthLabel(r.month, locale)}
              </text>
              <text
                x={cx}
                y={baseline + 32}
                textAnchor="middle"
                fontSize={10}
                fill="currentColor"
                fillOpacity={r.profit < 0 ? 1 : 0.7}
              >
                {r.profit >= 0 ? `+${compact(r.profit)}` : `−${compact(-r.profit)}`}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-xs text-faint">{t.cashNote}</p>
    </section>
  );
}

/* ── Очереди владельца ─────────────────────────────────────────────────── */

export function ContractsToSign({ rows, locale }: { rows: PendingContract[]; locale: PanelLocale }) {
  const t = words(locale);
  return (
    <section className={`${CARD} ${rows.length ? "border-green/40 bg-green/5" : ""}`}>
      <p className={`${H2} ${rows.length ? "text-green" : ""}`}>{t.contractsTitle(rows.length)}</p>
      {rows.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-wrap items-baseline gap-x-3">
              <Link href={`/admin/contracts/${c.id}`} className="font-mono hover:text-green">
                {t.contractNo} {c.number}
              </Link>
              <span>{c.client_name}</span>
              <span className="font-mono text-muted">{money(c.amount_usd)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">{t.contractsEmpty}</p>
      )}
    </section>
  );
}

export function ExpectedPayments({
  rows,
  names,
  locale,
}: {
  rows: Expected[];
  names: Map<string, string>;
  locale: PanelLocale;
}) {
  const t = words(locale);
  const total = rows.reduce((s, r) => s + r.remaining, 0);
  return (
    <section className={CARD}>
      <p className={H2}>{t.expectedTitle(money(total))}</p>
      {rows.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {rows.slice(0, 10).map((r) => (
            <li key={r.project.id} className="flex flex-wrap items-baseline gap-x-3">
              <Link href={`/admin/projects/${r.project.id}`} className="hover:text-green">
                {r.project.title}
              </Link>
              {r.project.client ? <span className="text-muted">{r.project.client}</span> : null}
              <span className="font-mono">{money(r.remaining)}</span>
              <span className="text-xs text-faint">
                {t.expectedPaid(money(r.paid), money(r.project.amount_usd ?? 0))}
                {r.project.owner_staff_id ? ` · ${names.get(r.project.owner_staff_id) ?? "—"}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">{t.expectedEmpty}</p>
      )}
    </section>
  );
}

export function TaxesSoon({ rows, locale }: { rows: Upcoming[]; locale: PanelLocale }) {
  if (!rows.length) return null;
  const t = words(locale);
  return (
    <section className={`${CARD} border-gold/40`}>
      <p className={`${H2} text-gold`}>{t.taxTitle}</p>
      <ul className="mt-3 space-y-1 text-sm">
        {rows.map((r) => (
          <li key={`${r.title}-${r.due}`} className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-mono text-gold">{r.daysLeft <= 0 ? t.taxToday : t.taxIn(r.daysLeft)}</span>
            {/* Сроки по умолчанию переведены по id; чужой срок — своим названием. */}
            <span>{taxTitleDict[r.id as keyof typeof taxTitleDict]?.[locale] ?? r.title}</span>
            {!r.verified ? <span className="text-xs text-faint">{t.taxUnverified}</span> : null}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-faint">
        <Link href="/admin/expenses" className="hover:text-green">
          {t.taxCalendar}
        </Link>
      </p>
    </section>
  );
}

/* ── Рекомендации ──────────────────────────────────────────────────────── */

import { refreshReviews } from "@/app/admin/plans/actions";
import type { Review } from "@/lib/admin/coach-store";

function dayLabel(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y.slice(2)}`;
}

export function ReviewCard({
  review,
  title,
  daily,
  canRefresh,
  locale,
}: {
  review: Review | null;
  title: string;
  /** Дневные рекомендации («На сегодня»): пустое состояние говорит про утро, а не про понедельник. */
  daily?: boolean;
  canRefresh?: boolean;
  locale: PanelLocale;
}) {
  const t = words(locale);
  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={`${H2} flex flex-wrap items-center gap-2`}>
          {title}
          {review ? <span className="normal-case tracking-normal text-faint">{t.reviewFrom(dayLabel(review.period_start))}</span> : null}
          <HelpHint topic={helpAnchor("/admin", "coach")} label={t.reviewHint} />
        </p>
        {canRefresh ? (
          <form action={refreshReviews}>
            <button type="submit" className="text-xs text-faint hover:text-green">
              {t.reviewRefresh}
            </button>
          </form>
        ) : null}
      </div>
      {review ? (
        <div className="mt-2 space-y-3 text-sm leading-relaxed">
          <p className="font-medium">{review.body.headline}</p>
          {review.body.last_period ? (
            <p className="text-muted">
              <span className="text-faint">{t.reviewLastPeriod}</span>
              {review.body.last_period}
            </p>
          ) : null}
          {review.body.attention.length ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-gold">{t.reviewAttention}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {review.body.attention.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {review.body.actions.length ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-green">{t.reviewActions}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {review.body.actions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {review.body.learn.length ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-faint">{t.reviewLearn}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {review.body.learn.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {review.body.wins.length ? (
            <p className="text-muted">
              <span className="text-faint">{t.reviewWins}</span>
              {review.body.wins.join(" · ")}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">
          {daily ? t.reviewDailyEmpty : t.reviewWeeklyEmpty}
        </p>
      )}
    </section>
  );
}

/** Недельные рекомендации команды — заголовок и действия, без развёртки. */
export function TeamReviews({
  rows,
  locale,
}: {
  rows: { name: string; review: Review | null }[];
  locale: PanelLocale;
}) {
  if (!rows.length) return null;
  const t = words(locale);
  return (
    <section className={CARD}>
      <p className={H2}>{t.teamReviewsTitle}</p>
      <ul className="mt-3 space-y-3 text-sm">
        {rows.map((r) => (
          <li key={r.name}>
            <p>
              <span className="font-medium">{r.name}</span>
              {r.review ? (
                <span className="text-muted"> — {r.review.body.headline}</span>
              ) : (
                <span className="text-faint"> — {t.teamReviewsNone}</span>
              )}
            </p>
            {r.review?.body.actions.length ? (
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
                {r.review.body.actions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
