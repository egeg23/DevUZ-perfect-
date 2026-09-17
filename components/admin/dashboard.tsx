import Link from "next/link";

import { deletePlan, savePlan } from "@/app/admin/plans/actions";
import { METRICS, METRIC_TITLE, monthLabel, type Expected, type MonthCash, type PlanFact, type StaffPulse, type StuckLead } from "@/lib/admin/pulse";
import type { PendingContract } from "@/lib/admin/pulse-store";
import type { Upcoming } from "@/lib/admin/tax-calendar";

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

const PRIORITY_LABEL: Record<string, string> = { hot: "горячий", warm: "тёплый", nurture: "дозреет", archive: "архив" };

function days(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "день" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "дня" : "дней";
  return `${n} ${word}`;
}

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

export function StuckLeads({ rows, names, title = "Срочно связаться" }: { rows: StuckLead[]; names?: Map<string, string>; title?: string }) {
  return (
    <section className={`${CARD} ${rows.length ? "border-gold/40" : ""}`}>
      <p className={`${H2} ${rows.length ? "text-gold" : ""}`}>
        {title}: {rows.length}
      </p>
      {rows.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {rows.slice(0, 12).map((r) => (
            <li key={r.id} className="flex flex-wrap items-baseline gap-x-3">
              <Link href={`/admin/leads/${r.id}`} className="font-mono hover:text-green">
                {r.label}
              </Link>
              <span className="text-muted">{PRIORITY_LABEL[r.priority] ?? r.priority}</span>
              <span className="text-gold">без движения {days(r.days)}</span>
              {names && r.staffId ? <span className="text-xs text-faint">{names.get(r.staffId) ?? "—"}</span> : null}
            </li>
          ))}
          {rows.length > 12 ? <li className="text-xs text-faint">и ещё {rows.length - 12}</li> : null}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">Все лиды в работе двигались недавно.</p>
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
}: {
  plans: (PlanFact & { staffName?: string })[];
  /** Руководитель — заводит новый; владелец — и меняет, и снимает. */
  canAdd: boolean;
  canEdit: boolean;
  staffOptions: { id: string; name: string }[];
  fixedStaffId?: string;
}) {
  return (
    <section className={CARD}>
      <p className={H2}>План и факт</p>
      {plans.length ? (
        <ul className="mt-3 space-y-3">
          {plans.map((p) => (
            <li key={p.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span>
                  {p.staffName ? <span className="text-muted">{p.staffName} · </span> : null}
                  {p.period === "week" ? "неделя" : "месяц"} · {METRIC_TITLE[p.metric]}
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
                    <button type="submit" className={BUTTON}>изменить</button>
                  </form>
                  <form action={deletePlan}>
                    <input type="hidden" name="plan" value={p.id} />
                    <button type="submit" className="text-xs text-faint hover:text-gold">снять</button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">
          {canAdd ? "Плана на этот период нет — поставьте ниже." : "Плана на этот период нет. Его ставит руководитель или владелец."}
        </p>
      )}

      {canAdd ? (
        <form action={savePlan} className="mt-4 flex flex-wrap items-end gap-2">
          {fixedStaffId ? (
            <input type="hidden" name="staff" value={fixedStaffId} />
          ) : (
            <label className="text-xs text-faint">
              Кому
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
            Период
            <select name="period" className={`${FIELD} mt-1 block`}>
              <option value="week">эта неделя</option>
              <option value="month">этот месяц</option>
            </select>
          </label>
          <label className="text-xs text-faint">
            Показатель
            <select name="metric" className={`${FIELD} mt-1 block`}>
              {METRICS.map((m) => (
                <option key={m} value={m}>
                  {METRIC_TITLE[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-faint">
            Цель
            <input name="target" inputMode="numeric" required className={`${FIELD} mt-1 block w-24`} />
          </label>
          <button type="submit" className={BUTTON}>
            Поставить план
          </button>
        </form>
      ) : null}
    </section>
  );
}

/* ── Команда ───────────────────────────────────────────────────────────── */

export type TeamRow = { id: string; name: string; week: StaffPulse; prev: StaffPulse; due: number };

const delta = (now: number, before: number) =>
  now === before ? "" : now > before ? ` ↑${now - before}` : ` ↓${before - now}`;

export function TeamTable({ rows, showMoney }: { rows: TeamRow[]; showMoney: boolean }) {
  if (!rows.length) return null;
  return (
    <section className={CARD}>
      <p className={H2}>Команда за эту неделю</p>
      <p className="mt-1 text-xs text-muted">Стрелка — против прошлой недели.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-faint">
            <tr>
              <th className="py-2 pr-4 font-normal">Сотрудник</th>
              <th className="py-2 pr-4 font-normal">В работе</th>
              <th className="py-2 pr-4 font-normal">Срочно</th>
              <th className="py-2 pr-4 font-normal">Касаний</th>
              <th className="py-2 pr-4 font-normal">Контактов</th>
              <th className="py-2 pr-4 font-normal">Выиграно</th>
              <th className="py-2 pr-4 font-normal">Поступления</th>
              {showMoney ? <th className="py-2 pr-4 font-normal">К выплате</th> : null}
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
                {showMoney ? <td className="py-2 pr-4 font-mono">{money(r.due)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Лучшие за неделю — по трём разным вещам, чтобы «лучший» не значило «один». */
export function BestOfWeek({ rows }: { rows: TeamRow[] }) {
  if (rows.length < 2) return null;
  const top = (pick: (r: TeamRow) => number, fmt: (n: number) => string) => {
    const best = [...rows].sort((a, b) => pick(b) - pick(a))[0];
    return pick(best) > 0 ? `${best.name} — ${fmt(pick(best))}` : "пока никто";
  };
  return (
    <section className={CARD}>
      <p className={H2}>Лучшие за неделю</p>
      <ul className="mt-2 space-y-1 text-sm">
        <li>
          <span className="text-muted">по поступлениям:</span> {top((r) => r.week.revenue, money)}
        </li>
        <li>
          <span className="text-muted">по выигранным:</span> {top((r) => r.week.won, (n) => `${n}`)}
        </li>
        <li>
          <span className="text-muted">по касаниям:</span> {top((r) => r.week.touches, (n) => `${n}`)}
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

export function CashChart({ rows }: { rows: MonthCash[] }) {
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
        <p className={H2}>Касса по месяцам</p>
        <p className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: REVENUE }} /> поступления
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: EXPENSES }} /> расходы
          </span>
        </p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full text-muted" role="img" aria-label="Поступления и расходы по месяцам">
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
                <title>{`${monthLabel(r.month)}: поступления ${money(r.revenue)}`}</title>
              </path>
              <path d={bar(ex, baseline - eh, barW, eh)} fill={EXPENSES}>
                <title>{`${monthLabel(r.month)}: расходы ${money(r.expenses)}`}</title>
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
                {monthLabel(r.month)}
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
      <p className="mt-1 text-xs text-faint">Под месяцем — разница: поступления минус расходы. По кассе, а не по договорам.</p>
    </section>
  );
}

/* ── Очереди владельца ─────────────────────────────────────────────────── */

export function ContractsToSign({ rows }: { rows: PendingContract[] }) {
  return (
    <section className={`${CARD} ${rows.length ? "border-green/40 bg-green/5" : ""}`}>
      <p className={`${H2} ${rows.length ? "text-green" : ""}`}>Договоры на подпись: {rows.length}</p>
      {rows.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-wrap items-baseline gap-x-3">
              <Link href={`/admin/contracts/${c.id}`} className="font-mono hover:text-green">
                № {c.number}
              </Link>
              <span>{c.client_name}</span>
              <span className="font-mono text-muted">{money(c.amount_usd)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">Ничего не ждёт подписи.</p>
      )}
    </section>
  );
}

export function ExpectedPayments({ rows, names }: { rows: Expected[]; names: Map<string, string> }) {
  const total = rows.reduce((s, r) => s + r.remaining, 0);
  return (
    <section className={CARD}>
      <p className={H2}>Ожидаем оплат: {money(total)}</p>
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
                оплачено {money(r.paid)} из {money(r.project.amount_usd ?? 0)}
                {r.project.owner_staff_id ? ` · ${names.get(r.project.owner_staff_id) ?? "—"}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">По живым проектам всё оплачено.</p>
      )}
    </section>
  );
}

export function TaxesSoon({ rows }: { rows: Upcoming[] }) {
  if (!rows.length) return null;
  return (
    <section className={`${CARD} border-gold/40`}>
      <p className={`${H2} text-gold`}>Налоги и отчётность в ближайшие две недели</p>
      <ul className="mt-3 space-y-1 text-sm">
        {rows.map((r) => (
          <li key={`${r.title}-${r.due}`} className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-mono text-gold">{r.daysLeft <= 0 ? "сегодня" : `через ${days(r.daysLeft)}`}</span>
            <span>{r.title}</span>
            {!r.verified ? <span className="text-xs text-faint">дата не подтверждена бухгалтером</span> : null}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-faint">
        <Link href="/admin/expenses" className="hover:text-green">
          Полный календарь →
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

export function ReviewCard({ review, title, canRefresh }: { review: Review | null; title: string; canRefresh?: boolean }) {
  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={H2}>
          {title}
          {review ? <span className="ml-2 normal-case tracking-normal text-faint">от {dayLabel(review.period_start)}</span> : null}
        </p>
        {canRefresh ? (
          <form action={refreshReviews}>
            <button type="submit" className="text-xs text-faint hover:text-green">
              собрать заново
            </button>
          </form>
        ) : null}
      </div>
      {review ? (
        <div className="mt-2 space-y-3 text-sm leading-relaxed">
          <p className="font-medium">{review.body.headline}</p>
          {review.body.last_period ? (
            <p className="text-muted">
              <span className="text-faint">Прошлый период: </span>
              {review.body.last_period}
            </p>
          ) : null}
          {review.body.attention.length ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-gold">На что смотреть</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {review.body.attention.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {review.body.actions.length ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-green">Что делать</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {review.body.actions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {review.body.learn.length ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-faint">Чему научиться</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {review.body.learn.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {review.body.wins.length ? (
            <p className="text-muted">
              <span className="text-faint">Что хорошо: </span>
              {review.body.wins.join(" · ")}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">
          {title.startsWith("На сегодня")
            ? "Собирается каждое утро с семи по Ташкенту."
            : "Собирается по понедельникам с шести утра по Ташкенту. Через неделю — замер и новый план."}
        </p>
      )}
    </section>
  );
}

/** Недельные рекомендации команды — заголовок и действия, без развёртки. */
export function TeamReviews({ rows }: { rows: { name: string; review: Review | null }[] }) {
  if (!rows.length) return null;
  return (
    <section className={CARD}>
      <p className={H2}>Рекомендации команде на неделю</p>
      <ul className="mt-3 space-y-3 text-sm">
        {rows.map((r) => (
          <li key={r.name}>
            <p>
              <span className="font-medium">{r.name}</span>
              {r.review ? (
                <span className="text-muted"> — {r.review.body.headline}</span>
              ) : (
                <span className="text-faint"> — рекомендации ещё нет</span>
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
