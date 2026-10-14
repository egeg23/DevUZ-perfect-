import Link from "next/link";
import type { ReactNode } from "react";

import { HelpHint } from "@/components/admin/help-link";
import { SubmitButton } from "@/components/admin/submit-button";
import { MAIN_LABEL } from "@/lib/admin/account-ban-store";
import { hqDict } from "@/content/admin-panel/hq";
import { helpAnchor } from "@/lib/admin/help";
import {
  BOT_SILENT_ALERT,
  attentionHref,
  clockOf,
  deltaOf,
  leftOf,
  type Attention,
  type FeedItem,
  type HqPerson,
  type Trend,
} from "@/lib/admin/hq";
import type { Hq } from "@/lib/admin/hq-store";
import { PANEL_INTL, pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import { ROLE_BADGE } from "@/lib/admin/roles";

/**
 * «Главная» — вёрстка. Только отрисовка готовых чисел (lib/admin/hq-store):
 * её же рисуют тест и скриншоты с тестовыми данными.
 *
 * Как дашборд приложения на телефоне: крупные числа с короткой подписью,
 * мягкие карточки, строки во весь палец (не ниже 44 px). Сначала телефон —
 * одна колонка; с планшета — две; на большом экране пульс слева, «Требует
 * внимания» справа, люди — сеткой под ними.
 */

type T = Picked<typeof hqDict>;

const CARD = "rounded-3xl border border-line/70 bg-surface shadow-[0_10px_24px_rgba(0,0,0,0.28)]";

/* ── Значки — штрихом, в цветном круге ───────────────────────────────── */

const ICONS: Record<string, string> = {
  leads: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm13 9v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  touches: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z",
  mockups: "M3 5h18v12H3zM8 21h8M12 17v4",
  tasks: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  money: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  people: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  check: "M20 6 9 17l-5-5",
  chevron: "m9 18 6-6-6-6",
};

function Icon({ name, className = "h-5 w-5" }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

const TONE = {
  green: "bg-green/10 text-green",
  blue: "bg-blue/15 text-blue-soft",
  gold: "bg-gold/15 text-gold",
  violet: "bg-violet/15 text-violet",
  red: "bg-red-500/15 text-red-300",
} as const;
type Tone = keyof typeof TONE;

function IconChip({ name, tone }: { name: keyof typeof ICONS; tone: Tone }) {
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${TONE[tone]}`}>
      <Icon name={name} />
    </span>
  );
}

/* ── Числа ───────────────────────────────────────────────────────────── */

/**
 * Разница с прошлыми 7 днями: стрелка и число, а не только цвет. Для
 * «проиграли» рост — плохо: `goodUp={false}`.
 */
function Delta({ trend, t, goodUp = true }: { trend: Trend; t: T; goodUp?: boolean }) {
  const d = deltaOf(trend);
  if (d === 0) return <span className="text-xs text-faint">{t.same}</span>;
  const good = d > 0 === goodUp;
  const text = `${d > 0 ? "▲ +" : "▼ −"}${Math.abs(d)}`;
  return <span className={`text-xs font-medium ${good ? "text-green" : "text-gold"}`}>{t.vsPrev(text)}</span>;
}

function Row({ href, label, value, sub, warn }: { href: string; label: string; value: ReactNode; sub?: ReactNode; warn?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className="-mx-2 flex min-h-11 items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-muted">{label}</span>
          {sub ? <span className="block">{sub}</span> : null}
        </span>
        <span className={`font-mono text-base tabular-nums ${warn ? "text-gold" : "text-text"}`}>{value}</span>
        <Icon name="chevron" className="h-4 w-4 shrink-0 text-faint" />
      </Link>
    </li>
  );
}

function PulseCard({
  icon,
  tone,
  title,
  href,
  big,
  caption,
  extra,
  wide,
  children,
}: {
  /** На всю ширину сетки — у пятой карточки, чтобы справа не было дыры. */
  wide?: boolean;
  icon: keyof typeof ICONS;
  tone: Tone;
  title: string;
  href: string;
  big: ReactNode;
  caption: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`${CARD} flex flex-col p-4 sm:p-5 ${wide ? "sm:col-span-2" : ""}`}>
      <div className="flex items-center gap-3">
        <IconChip name={icon} tone={tone} />
        <h2 className="text-sm font-semibold text-text">{title}</h2>
      </div>
      <Link href={href} className="mt-4 block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40">
        <span className="block font-mono text-4xl font-semibold leading-none tracking-tight tabular-nums text-text">{big}</span>
        <span className="mt-1.5 block text-sm text-muted">{caption}</span>
      </Link>
      {extra}
      <ul className="mt-3 flex flex-col">{children}</ul>
    </section>
  );
}

function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className={`h-full rounded-full ${pct >= 100 ? "bg-green" : "bg-green-dim"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const usd = (n: number, locale: PanelLocale) =>
  `$${new Intl.NumberFormat(PANEL_INTL[locale], { maximumFractionDigits: 0 }).format(n)}`;

/* ── «Требует внимания» ──────────────────────────────────────────────── */

/** Главный аккаунт хранится русской подписью (MAIN_LABEL) — на экране он на языке панели. */
const accountName = (name: string, t: T) => (name === MAIN_LABEL ? t.mainAccount : name);

function attentionText(a: Attention, t: T, now: Date): string {
  switch (a.kind) {
    case "sweep":
      return t.attSweep(a.minutes);
    case "autopilot":
      return t.attAutopilot(a.error);
    case "model":
      return t.attModel(a.error);
    case "ban": {
      const day = dayMonth(a.until) === dayMonth(now.toISOString()) ? "" : `${dayMonth(a.until)} `;
      return t.attBan(accountName(a.account, t), `${day}${clockOf(a.until)}`);
    }
    case "circle":
      return t.attCircle(a.lang, a.accounts.map((x) => accountName(x, t)).join(", "));
    case "circleFallback":
      return t.attCircleFallback(a.n);
    case "unowned":
      return t.attUnowned(a.n, a.first);
    case "burned":
      return t.attBurned(a.n);
    case "overdue":
      return t.attOverdue(a.n);
    case "stale":
      return t.attStale(a.n);
    case "botSilent":
      return t.attBotSilent(a.name, a.n);
    case "transfers":
      return t.attTransfers(a.n);
    case "contracts":
      return t.attContracts(a.n);
    case "ending":
      return t.attEnding(a.n);
    case "firecrawl":
      return t.attFirecrawl(a.remaining);
  }
}

/** «14.10» по Ташкенту. */
function dayMonth(iso: string): string {
  const d = new Date(Date.parse(iso) + 5 * 3600_000);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** «Отдать» тёплого лида без хозяина: лиды, люди и действие формы (передаёт страница). */
export type GiveBox = {
  leads: readonly { id: string; label: string }[];
  people: readonly { id: string; name: string; online: boolean }[];
  action: (formData: FormData) => Promise<void>;
};

export function AttentionList({ items, t, now, give }: { items: readonly Attention[]; t: T; now: Date; give?: GiveBox | null }) {
  return (
    <section className={`${CARD} p-4 sm:p-5`} aria-labelledby="hq-attention">
      <div className="flex items-center gap-3">
        <IconChip name="bell" tone={items.some((a) => a.level === "red") ? "red" : items.length ? "gold" : "green"} />
        <h2 id="hq-attention" className="flex items-center gap-2 text-sm font-semibold">
          {t.attentionTitle}
          <HelpHint topic={helpAnchor("/admin/hq", "attention")} />
        </h2>
        {items.length ? (
          <span className="ml-auto rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-xs text-muted">{items.length}</span>
        ) : null}
      </div>
      {items.length ? (
        <ul className="mt-3 flex flex-col gap-1">
          {items.map((a, i) => {
            const href = attentionHref(a);
            const dot = (
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${a.level === "red" ? "bg-red-400" : "bg-gold"}`}
                aria-hidden="true"
              />
            );
            const text = (
              <span className={`min-w-0 flex-1 text-sm leading-snug ${a.level === "red" ? "text-text" : "text-muted"}`}>
                {attentionText(a, t, now)}
              </span>
            );
            const row = "-mx-2 flex min-h-11 items-start gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-surface-2 active:bg-surface-2";
            return (
              <li key={`${a.kind}-${i}`}>
                {href ? (
                  <Link href={href} className={row}>
                    {dot}
                    {text}
                    <Icon name="chevron" className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
                  </Link>
                ) : (
                  // Несколько штук — раскрывается списком, каждая ведёт в свою карточку.
                  <details className="group/att">
                    <summary className={`${row} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                      {dot}
                      {text}
                      <Icon name="chevron" className="mt-0.5 h-4 w-4 shrink-0 text-faint transition group-open/att:rotate-90" />
                    </summary>
                    <ul className="mb-1 ml-5 border-l border-line/70 pl-3">
                      {a.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-muted transition hover:bg-surface-2 hover:text-text active:bg-surface-2"
                          >
                            <span className="min-w-0 flex-1 truncate">{link.label}</span>
                            <Icon name="chevron" className="h-4 w-4 shrink-0 text-faint" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 flex items-start gap-3 rounded-2xl bg-green/5 px-3 py-3 text-sm leading-snug text-green">
          <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />
          {t.attentionCalm}
        </p>
      )}
      {/* Отдать тёплого лида без хозяина — тут же, не уходя в «Лиды». Без
          скрипта: обычная форма, работает и на телефоне без загрузки. */}
      {give && give.leads.length && give.people.length ? (
        <div className="mt-3 rounded-2xl bg-surface-2/60 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-faint">{t.giveTitle}</p>
          {give.leads.slice(0, 3).map((lead) => (
            <form key={lead.id} action={give.action} className="mt-2 flex flex-wrap items-center gap-2">
              <input type="hidden" name="lead" value={lead.id} />
              <Link href={`/admin/leads/${lead.id}`} className="min-w-0 flex-1 basis-full truncate text-sm text-text hover:text-green sm:basis-auto">
                {lead.label}
              </Link>
              <select
                name="to"
                required
                aria-label={t.giveTo}
                defaultValue=""
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-text"
              >
                <option value="" disabled>
                  {t.giveTo}
                </option>
                {give.people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {t.givePerson(p.name, p.online ? "1" : "")}
                  </option>
                ))}
              </select>
              <SubmitButton base="min-h-11 rounded-xl px-4 text-sm font-semibold" pendingLabel={t.giving}>
                {t.giveButton}
              </SubmitButton>
            </form>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/* ── Лента за сутки ──────────────────────────────────────────────────── */

const FEED_DOT: Record<FeedItem["kind"], string> = {
  lead: "bg-blue-soft",
  won: "bg-green",
  lost: "bg-faint",
  mockupSent: "bg-violet",
  mockupFound: "bg-violet",
  mockupApproved: "bg-green",
  taskDone: "bg-gold",
};

function feedText(f: FeedItem, t: T): string {
  switch (f.kind) {
    case "lead":
      return t.feedLead(f.label);
    case "won":
      return t.feedWon(f.label, f.who ?? "");
    case "lost":
      return t.feedLost(f.label, f.who ?? "");
    case "mockupSent":
      return t.feedMockupSent(f.label);
    case "mockupApproved":
      return t.feedMockupApproved(f.label);
    case "mockupFound":
      return t.feedMockupFound(f.label);
    case "taskDone":
      return t.feedTaskDone(f.label, f.who ?? "");
  }
}

export function FeedList({ items, t }: { items: readonly FeedItem[]; t: T }) {
  return (
    <section className={`${CARD} p-4 sm:p-5`} aria-labelledby="hq-feed">
      <h2 id="hq-feed" className="flex items-center gap-2 text-sm font-semibold">
        {t.feedTitle}
        <HelpHint topic={helpAnchor("/admin/hq", "feed")} />
      </h2>
      {items.length ? (
        <ol className="mt-3 flex flex-col">
          {items.map((f, i) => (
            <li key={`${f.kind}-${f.at}-${i}`}>
              <Link href={f.href} className="-mx-2 flex min-h-11 items-start gap-3 rounded-2xl px-2 py-2 transition hover:bg-surface-2">
                <span className="mt-0.5 w-10 shrink-0 font-mono text-xs tabular-nums text-faint">{clockOf(f.at)}</span>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${FEED_DOT[f.kind]}`} aria-hidden="true" />
                <span className="min-w-0 flex-1 break-words text-sm leading-snug text-muted">{feedText(f, t)}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-faint">{t.feedNone}</p>
      )}
    </section>
  );
}

/* ── Люди ────────────────────────────────────────────────────────────── */

const MOOD_RING: Record<HqPerson["mood"], string> = {
  alert: "ring-gold/60",
  done: "ring-green/60",
  work: "ring-line",
  idle: "ring-line",
};

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-surface-2/70 px-2.5 py-2 text-center">
      <p className="font-mono text-lg leading-none tabular-nums text-text">{value}</p>
      <p className="mt-1 truncate text-[11px] text-faint">{label}</p>
    </div>
  );
}

/**
 * Касания по дням за неделю — тонкие столбики одного цвета от общей
 * линии, сегодня — ярче. Подпись дней и чисел — во всплывающей подсказке
 * и для чтения с экрана: цвет здесь ничего не кодирует, кроме «сегодня».
 */
function Spark({ days, t, locale, now }: { days: readonly number[]; t: T; locale: PanelLocale; now: Date }) {
  const max = Math.max(1, ...days);
  const fmt = new Intl.DateTimeFormat(PANEL_INTL[locale], { weekday: "short", timeZone: "Asia/Tashkent" });
  const names = days.map((_, i) => fmt.format(new Date(now.getTime() - (days.length - 1 - i) * 86_400_000)));
  const label = t.sparkTitle(days.map((n, i) => t.sparkDay(names[i], n)).join(", "));
  const W = 10;
  const GAP = 4;
  const H = 28;
  return (
    <svg
      viewBox={`0 0 ${days.length * (W + GAP) - GAP} ${H}`}
      className="h-7 w-[94px] shrink-0"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      {days.map((n, i) => {
        const h = n ? Math.max(3, Math.round((n / max) * H)) : 2;
        const today = i === days.length - 1;
        return (
          <rect
            key={i}
            x={i * (W + GAP)}
            y={H - h}
            width={W}
            height={h}
            rx={2}
            className={n ? (today ? "fill-green" : "fill-green-dim/70") : "fill-line"}
          >
            <title>{t.sparkDay(names[i], n)}</title>
          </rect>
        );
      })}
    </svg>
  );
}

export function PersonCard({
  p,
  t,
  locale,
  now,
  taskHref,
}: {
  p: HqPerson;
  t: T;
  locale: PanelLocale;
  now: Date;
  /** Куда ведёт «Поставить задачу»: форма быстрой задачи с этим человеком. */
  taskHref?: string;
}) {
  const seen = p.online ? t.online : p.activeAt && Date.parse(p.activeAt) >= now.getTime() - 24 * 3600_000 ? t.seenAt(clockOf(p.activeAt)) : t.notToday;
  const flags = [
    p.overdue ? { text: t.flagOverdue(p.overdue), warn: true } : null,
    p.burnedToday ? { text: t.flagBurned(p.burnedToday), warn: true } : null,
    p.stale ? { text: t.flagStale(p.stale), warn: false } : null,
    p.botSilent ? { text: t.flagBotSilent(p.botSilent), warn: p.botSilent > BOT_SILENT_ALERT } : null,
    p.mood === "done" ? { text: t.moodDone, warn: false, good: true } : null,
    p.mood === "idle" ? { text: t.moodIdle, warn: false } : null,
  ].filter((f): f is { text: string; warn: boolean; good?: boolean } => Boolean(f));
  return (
    <li className={`${CARD} overflow-hidden`}>
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-3">
            <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 font-semibold text-text ring-2 ${MOOD_RING[p.mood]}`}>
              {p.initials}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface ${p.online ? "bg-green" : "bg-faint"}`}
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-text">{p.name}</span>
              <span className={`block truncate text-xs ${p.online ? "text-green" : "text-faint"}`}>
                {seen} · {ROLE_BADGE[p.role][locale]}
              </span>
            </span>
            <Icon name="chevron" className="h-4 w-4 shrink-0 text-faint transition group-open:rotate-90" />
          </div>
          <div className="flex items-end justify-between gap-3 px-1">
            <span className="text-[11px] text-faint">{t.week}</span>
            <Spark days={p.touchDays} t={t} locale={locale} now={now} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat value={p.touches} label={p.portionTarget ? t.statPortion(p.portionDone, p.portionTarget) : t.statNoPortion} />
            <Stat value={p.inWork} label={t.statInWork} />
            <Stat value={p.openTasks} label={t.statTasks} />
          </div>
          {flags.length ? (
            <div className="flex flex-wrap gap-1.5">
              {flags.map((f) => (
                <span
                  key={f.text}
                  className={`rounded-full px-2.5 py-1 text-[11px] ${f.warn ? "bg-gold/15 text-gold" : f.good ? "bg-green/10 text-green" : "bg-surface-2 text-muted"}`}
                >
                  {f.text}
                </span>
              ))}
            </div>
          ) : null}
        </summary>
        <div className="border-t border-line/70 px-4 pb-4 pt-3 text-sm text-muted">
          <ul className="flex flex-col gap-1.5">
            <li>{p.firstAt ? t.firstAt(clockOf(p.firstAt), t.minutes(p.minutes)) : t.notToday}</li>
            <li>{t.detailTouches(p.touches)}</li>
            <li>{t.detailOpenTasks(p.openTasks, p.overdue)}</li>
            <li>{t.detailBurned(p.burnedToday)}</li>
            <li>{t.detailStale(p.stale)}</li>
            <li>{t.detailBotSilent(p.botSilent)}</li>
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {taskHref ? (
              <Link href={taskHref} className="flex min-h-11 items-center justify-center rounded-2xl bg-green/10 px-3 text-center text-sm font-medium text-green transition hover:bg-green/15">
                {t.giveTask}
              </Link>
            ) : null}
            <Link
              href={`/admin?owner=${p.id}&status=taken`}
              className={`flex min-h-11 items-center justify-center rounded-2xl bg-surface-2 px-3 text-center text-sm text-text transition hover:bg-line ${taskHref ? "" : "col-span-2"}`}
            >
              {t.openLeads}
            </Link>
          </div>
        </div>
      </details>
    </li>
  );
}

/* ── Страница целиком ───────────────────────────────────────────────── */

export function HqView({
  hq,
  locale,
  name,
  now,
  side,
  personTaskHref,
  giveAction,
}: {
  hq: Hq;
  locale: PanelLocale;
  /** Как обратиться к тому, кто смотрит. */
  name: string;
  now: Date;
  /** Строкой под пульсом: быстрая задача, рассылка (если есть). */
  side?: ReactNode;
  personTaskHref?: (id: string) => string;
  /** Действие «Отдать» для тёплых без хозяина; нет — блока нет. */
  giveAction?: GiveBox["action"];
}) {
  const t = pick(hqDict, locale);
  const { leads, touches, mockups, tasks, money } = hq;
  const left = mockups.soonest ? leftOf(mockups.soonest.endsAt, now) : null;
  const date = new Intl.DateTimeFormat(PANEL_INTL[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Tashkent",
  }).format(now);

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs text-faint first-letter:uppercase">{date}</p>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-text">
          {t.hello(name)}
          <HelpHint topic={helpAnchor("/admin/hq")} />
        </h1>
        <p className="max-w-xl text-sm text-muted">{t.lead}</p>
        <p className="mt-1 flex items-center gap-2 text-xs text-faint">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green/60 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
          </span>
          {t.updated(clockOf(now.toISOString()))}
        </p>
      </header>

      {hq.offline ? (
        <p className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{t.offline}</p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3 lg:items-start sm:gap-6">
        {/* На телефоне «Требует внимания» — первым: то, что горит, важнее
            чисел за неделю. На большом экране — справа, рядом с пульсом. */}
        <div className="flex flex-col gap-5 sm:gap-6 lg:order-2">
          <AttentionList
            items={hq.attention}
            t={t}
            now={now}
            give={
              giveAction
                ? {
                    leads: hq.leads.unowned,
                    people: [...hq.people].sort((a, b) => Number(b.online) - Number(a.online)),
                    action: giveAction,
                  }
                : null
            }
          />
          <FeedList items={hq.feed} t={t} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:order-1 lg:col-span-2">
          <PulseCard icon="leads" tone="green" title={t.leadsTitle} href="/admin?status=taken" big={leads.inWork} caption={t.leadsInWork}>
            <Row href="/admin?status=new" label={t.leadsNewToday} value={leads.newToday} />
            <Row href="/admin" label={t.leadsNew7} value={leads.new7.now} sub={<Delta trend={leads.new7} t={t} />} />
            <Row href="/admin?status=new" label={t.leadsOffered} value={leads.offered} />
            <Row href="/admin?owner=free" label={t.leadsUnowned} value={leads.unowned.length} warn={leads.unowned.length > 0} />
            <Row href="/admin?status=won" label={t.leadsWon} value={leads.won7.now} sub={<Delta trend={leads.won7} t={t} />} />
            <Row href="/admin?status=lost" label={t.leadsLost} value={leads.lost7.now} sub={<Delta trend={leads.lost7} t={t} goodUp={false} />} />
          </PulseCard>

          <PulseCard
            icon="touches"
            tone="blue"
            title={t.touchesTitle}
            href="/admin/prospect"
            big={
              <>
                {touches.today}
                {touches.norm ? <span className="text-xl text-faint"> / {touches.norm}</span> : null}
              </>
            }
            caption={touches.norm ? t.touchesOf(touches.norm) : t.touchesNoNorm}
            extra={touches.norm ? <Progress value={touches.today} max={touches.norm} /> : null}
          >
            <Row
              href="/admin/prospect"
              label={t.touchesPortion(touches.portionDone, touches.portionTarget)}
              value={`${touches.portionDone}/${touches.portionTarget}`}
            />
            <Row
              href="/admin/prospect"
              label={touches.autopilotTarget === null ? t.touchesAutopilotOff : t.touchesAutopilot(touches.autopilotSent, touches.autopilotTarget)}
              value={touches.autopilotTarget === null ? "—" : `${touches.autopilotSent}/${touches.autopilotTarget}`}
            />
            <Row href="/admin/talks" label={t.touchesReplies} value={touches.repliesToday} />
            <Row href="/admin/stats" label={t.touches7} value={touches.sent7.now} sub={<Delta trend={touches.sent7} t={t} />} />
            <Row href="/admin/talks" label={t.replies7} value={touches.replies7.now} sub={<Delta trend={touches.replies7} t={t} />} />
          </PulseCard>

          <PulseCard
            icon="mockups"
            tone="violet"
            title={t.mockupsTitle}
            href="/admin/mockups"
            big={mockups.waiting}
            caption={t.mockupsWaiting}
            extra={
              <p className="mt-2 text-xs text-faint">
                {mockups.soonest && left ? t.mockupsSoonest(mockups.soonest.client, t.left(left.h, left.m)) : t.mockupsNone}
              </p>
            }
          >
            <Row href="/admin/mockups" label={t.mockupsSent7} value={mockups.sent7.now} sub={<Delta trend={mockups.sent7} t={t} />} />
            <Row href="/admin/mockups" label={t.mockupsApproved7} value={mockups.approved7.now} sub={<Delta trend={mockups.approved7} t={t} />} />
            {mockups.scanned7 ? <Row href="/admin/mockups" label={t.mockupsScanned7} value={mockups.scanned7} /> : null}
          </PulseCard>

          <PulseCard icon="tasks" tone="gold" title={t.tasksTitle} href="/admin/tasks" big={tasks.open} caption={t.tasksOpen}>
            <Row href="/admin/tasks" label={t.tasksOverdue} value={tasks.overdue.length} warn={tasks.overdue.length > 0} />
            <Row href="/admin/tasks" label={t.tasksDone7} value={tasks.done7.now} sub={<Delta trend={tasks.done7} t={t} />} />
          </PulseCard>

          {money ? (
            <PulseCard wide icon="money" tone="green" title={t.moneyTitle} href="/admin/finance" big={usd(money.received7.now, locale)} caption={t.moneyWeek}>
              <li className="-mt-1 pb-1">
                <Delta trend={money.received7} t={t} />
              </li>
              <Row href="/admin/finance" label={t.moneyMonth} value={usd(money.month, locale)} />
              <Row href="/admin/contracts" label={t.moneyContracts} value={money.contracts} warn={money.contracts > 0} />
            </PulseCard>
          ) : null}
        </div>
      </div>

      {/* Быстрая задача и рассылка — своей строкой: в колонке справа они
          вытягивали её вниз, и под пульсом оставалась пустота. */}
      {side ? <div className="grid gap-5 sm:gap-6 lg:grid-cols-2 lg:items-start">{side}</div> : null}

      <section id="people" aria-labelledby="hq-people" className="scroll-mt-24">
        <div className="mb-3 flex items-center gap-3">
          <IconChip name="people" tone="blue" />
          <h2 id="hq-people" className="flex items-center gap-2 text-sm font-semibold">
            {t.peopleTitle}
            <HelpHint topic={helpAnchor("/admin/hq", "people")} />
          </h2>
        </div>
        {hq.people.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {hq.people.map((p) => (
              <PersonCard key={p.id} p={p} t={t} locale={locale} now={now} taskHref={personTaskHref?.(p.id)} />
            ))}
          </ul>
        ) : (
          <p className={`${CARD} p-4 text-sm text-muted`}>{t.peopleNone}</p>
        )}
      </section>
    </div>
  );
}
