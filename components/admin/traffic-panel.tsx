import Link from "next/link";

import { saveGaProperty, startGoogleSignIn } from "@/app/admin/google/actions";
import { HelpHint } from "@/components/admin/help-link";
import { SubmitButton } from "@/components/admin/submit-button";
import { trafficDict } from "@/content/admin-panel/traffic";
import { helpAnchor } from "@/lib/admin/help";
import { PANEL_INTL, pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import { enableApiLink, googleRedirectUri, measurementId } from "@/lib/analytics/google-oauth";
import {
  gaConnection,
  loadGa,
  loadMetrika,
  type GaConnection,
  type TrafficReport,
  type TrafficResult,
  type TrafficTotals,
} from "@/lib/analytics/traffic";

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";
const H2 = "text-xs uppercase tracking-wider text-faint";

export const TRAFFIC_PERIODS = [7, 30, 90] as const;
export type TrafficPeriod = (typeof TRAFFIC_PERIODS)[number];

export function trafficPeriodOf(raw: string | undefined): TrafficPeriod {
  const n = Number(raw);
  return (TRAFFIC_PERIODS as readonly number[]).includes(n) ? (n as TrafficPeriod) : 30;
}

type T = Picked<typeof trafficDict>;

const fmt = (n: number, locale: PanelLocale) => Math.round(n).toLocaleString(PANEL_INTL[locale]);

function duration(seconds: number): string {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Рост против прошлого периода — процентом; «новое», если раньше было ноль. */
function Delta({ now, before, invert = false, t }: { now: number; before: number; invert?: boolean; t: T }) {
  if (before === 0) return now > 0 ? <span className="text-xs text-muted">{t.deltaNew}</span> : null;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <span className="text-xs text-faint">=</span>;
  // Для отказов рост — плохо: тон переворачивается.
  const good = invert ? pct < 0 : pct > 0;
  return (
    <span className={`text-xs ${good ? "text-green" : "text-gold"}`}>
      {pct > 0 ? "↑" : "↓"}
      {Math.abs(pct)}%
    </span>
  );
}

function Totals({ now, prev, t, locale }: { now: TrafficTotals; prev: TrafficTotals; t: T; locale: PanelLocale }) {
  const items = [
    { label: t.visits, value: fmt(now.visits, locale), delta: <Delta now={now.visits} before={prev.visits} t={t} /> },
    { label: t.users, value: fmt(now.users, locale), delta: <Delta now={now.users} before={prev.users} t={t} /> },
    { label: t.pageviews, value: fmt(now.pageviews, locale), delta: <Delta now={now.pageviews} before={prev.pageviews} t={t} /> },
    { label: t.bounce, value: `${Math.round(now.bounce)}%`, delta: <Delta now={now.bounce} before={prev.bounce} invert t={t} /> },
    { label: t.avgVisit, value: duration(now.duration), delta: <Delta now={now.duration} before={prev.duration} t={t} /> },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {items.map((i) => (
        <div key={i.label} className="min-w-0 rounded-lg border border-line-soft px-3 py-2">
          <p className="flex flex-wrap items-baseline justify-between gap-x-2">
            <span className="font-mono text-lg">{i.value}</span>
            {i.delta}
          </p>
          <p className="truncate text-[11px] text-faint">{i.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Визиты по дням — столбиками. Подпись — во всплывающей подсказке. */
function Daily({ days, t }: { days: TrafficReport["days"]; t: T }) {
  if (!days.length) return null;
  const max = Math.max(1, ...days.map((d) => d.visits));
  return (
    <div className="mt-4">
      <div className="flex h-24 items-end gap-px" role="img" aria-label={t.dailyLabel}>
        {days.map((d) => (
          <div
            key={d.date}
            title={t.dailyTip(d.date.split("-").reverse().join("."), d.visits, d.users)}
            className="min-w-0 flex-1 rounded-t-sm bg-green/60"
            style={{ height: `${Math.max(2, (d.visits / max) * 100)}%` }}
          />
        ))}
      </div>
      <p className="mt-1 flex justify-between font-mono text-[10px] text-faint">
        <span>{days[0].date.split("-").reverse().join(".")}</span>
        <span>{days[days.length - 1].date.split("-").reverse().join(".")}</span>
      </p>
    </div>
  );
}

/** Список с полосками: доля видна раньше, чем прочитана цифра. */
function Ranked({ title, rows, locale }: { title: string; rows: { name: string; visits: number }[]; locale: PanelLocale }) {
  if (!rows.length) return null;
  const max = Math.max(1, ...rows.map((r) => r.visits));
  return (
    <div className="mt-4">
      <p className="text-[11px] uppercase tracking-wider text-faint">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm">
        {rows.map((r) => (
          <li key={r.name} className="grid grid-cols-[1fr_auto] items-center gap-x-3">
            <span className="min-w-0 truncate" title={r.name}>
              {r.name}
            </span>
            <span className="font-mono text-xs text-muted">{fmt(r.visits, locale)}</span>
            <span className="col-span-2 h-1 overflow-hidden rounded bg-surface-2">
              <span className="block h-full bg-green/50" style={{ width: `${(r.visits / max) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Что видит руководитель вместо шагов подключения.
 *
 * Шаги — это вход в аккаунт Google владельца и ключ на сервере: ни то ни
 * другое руководитель сделать не может, и инструкция ему была бы шумом.
 */
function OwnerConnects({ t }: { t: T }) {
  return <p className="mt-3 text-sm text-muted">{t.ownerConnects}</p>;
}

function Setup({ steps, t }: { steps: string[]; t: T }) {
  return (
    <div className="mt-3 text-sm text-muted">
      <p>{t.setupTitle}</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed">
        {steps.map((step, i) => (
          <li key={i}>
            <Rich text={step} />
          </li>
        ))}
      </ol>
    </div>
  );
}

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11px] text-text">{children}</code>
);

/**
 * Строка словаря с простой разметкой: `код`, **жирный**, [текст](адрес).
 *
 * Шаги подключения и ответы Google — это абзац с адресами и названиями
 * кнопок внутри. Резать его на куски ради каждого `<Code>` значило бы
 * разнести одну фразу по пяти ключам, и на другом языке порядок кусков уже
 * не совпал бы.
 */
function Rich({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(/`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = m.index;
    if (m[1] !== undefined) out.push(<Code key={key}>{m[1]}</Code>);
    else if (m[2] !== undefined) out.push(<b key={key}>{m[2]}</b>);
    else out.push(<ExtLink key={key} href={m[4]}>{m[3]}</ExtLink>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/** Ответ стороннего сервиса — в строку с разметкой, не ломая её. */
const plain = (text: string) => text.replace(/[`*[\]]/g, "");

const metrikaSetup = (t: T) => [t.ymStep1, t.ymStep2, t.ymStep3];

function Report({ report, t, locale }: { report: TrafficReport; t: T; locale: PanelLocale }) {
  return (
    <>
      <div className="mt-3">
        <Totals now={report.totals} prev={report.prev} t={t} locale={locale} />
      </div>
      <Daily days={report.days} t={t} />
      <div className="grid gap-x-6 sm:grid-cols-2">
        <Ranked title={t.sources} rows={report.sources} locale={locale} />
        <Ranked title={t.pages} rows={report.pages} locale={locale} />
      </div>
    </>
  );
}

// Ответы Google бывают с длинными ссылками без пробелов: без переноса где
// угодно такая строка раздвигает карточку за край экрана.
const WARN = "mt-3 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold [overflow-wrap:anywhere]";
const OK = "mt-3 rounded-lg border border-green/30 bg-green/10 px-3 py-2 text-sm text-green [overflow-wrap:anywhere]";

function Source({
  title,
  result,
  setup,
  canConnect,
  t,
  locale,
}: {
  title: string;
  result: TrafficResult;
  setup: string[];
  canConnect: boolean;
  t: T;
  locale: PanelLocale;
}) {
  return (
    <section className={CARD}>
      <p className={H2}>{title}</p>
      {result.ok ? (
        <Report report={result.report} t={t} locale={locale} />
      ) : result.reason === "not_configured" ? (
        canConnect ? (
          <Setup steps={setup} t={t} />
        ) : (
          <OwnerConnects t={t} />
        )
      ) : (
        <p className={WARN}>
          {(canConnect ? t.failedOwner : t.failedHead)(result.detail ?? t.noDetail)}
        </p>
      )}
    </section>
  );
}

/* ── Google Analytics: вход через Google ─────────────────────────────── */

const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-xs text-text outline-none focus:border-green/50";

const ExtLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-green underline-offset-2 hover:underline">
    {children}
  </a>
);

/** Кнопка «Войти через Google» — без полей: клиент уже сохранён. */
function SignInButton({ t, label = t.signIn, tone = "primary" }: { t: T; label?: string; tone?: "primary" | "quiet" }) {
  return (
    <form action={startGoogleSignIn} className="mt-3">
      <SubmitButton pendingLabel={t.openingGoogle} base="rounded-lg px-4 py-2 text-sm font-semibold" tone={tone}>
        {label}
      </SubmitButton>
    </form>
  );
}

/** Client ID и секрет из Google Cloud — сохраняются и сразу ведут на вход. */
function ClientForm({ t }: { t: T }) {
  return (
    <form action={startGoogleSignIn} className="mt-3 grid gap-2">
      <input
        name="client_id"
        required
        autoComplete="off"
        spellCheck={false}
        placeholder="Client ID: 1234567890-abc….apps.googleusercontent.com"
        aria-label="Client ID"
        className={INPUT}
      />
      <input
        name="client_secret"
        required
        type="password"
        autoComplete="off"
        spellCheck={false}
        placeholder="Client secret: GOCSPX-…"
        aria-label="Client secret"
        className={INPUT}
      />
      <div>
        <SubmitButton pendingLabel={t.saving} base="rounded-lg px-4 py-2 text-sm font-semibold">
          {t.saveAndSignIn}
        </SubmitButton>
      </div>
    </form>
  );
}

/** Номер ресурса руками — если найти его сам вход не смог. */
function PropertyForm({ t }: { t: T }) {
  return (
    <form action={saveGaProperty} className="mt-3 flex flex-wrap items-center gap-2">
      <input
        name="property"
        required
        inputMode="numeric"
        placeholder={t.propertyPlaceholder}
        aria-label={t.propertyAria}
        className={`${INPUT} max-w-[16rem]`}
      />
      <SubmitButton pendingLabel={t.saving} base="rounded-lg px-3 py-2 text-xs" tone="quiet">
        {t.saveProperty}
      </SubmitButton>
    </form>
  );
}

function gaSetupSteps(redirect: string, t: T): string[] {
  return [t.gaStep1, t.gaStep2, t.gaStep3, t.gaStep4(redirect), t.gaStep5];
}

export type GaNotice = { code?: string; detail?: string; property?: string };

/** Что вернул вход через Google — одной строкой над карточкой. */
function Notice({ notice, redirect, t }: { notice: GaNotice; redirect: string; t: T }) {
  const detail = plain(notice.detail?.trim() ?? "");
  const link = enableApiLink(notice.detail?.trim());
  const text: Record<string, { ok?: boolean; body: string }> = {
    connected: { ok: true, body: t.connected(plain(notice.property ?? "") || t.site) },
    property_saved: { ok: true, body: t.propertySaved },
    denied: { body: t.denied },
    state: { body: t.state },
    client: { body: t.client },
    client_bad: { body: t.clientBad },
    save_failed: { body: t.saveFailed },
    exchange: { body: t.exchange(detail, redirect) },
    scope: { body: t.scope },
    no_refresh: { body: t.noRefresh },
    no_property: { body: t.noProperty(measurementId(), detail) },
    admin_api: { body: link ? t.adminApi(link) : t.adminApiOther(detail) },
    property_bad: { body: t.propertyBad },
  };
  const entry = notice.code ? text[notice.code] : undefined;
  if (!entry) return null;
  return (
    <p className={entry.ok ? OK : WARN}>
      <Rich text={entry.body} />
    </p>
  );
}

/**
 * Откуда сейчас идёт статистика GA — строкой под цифрами.
 *
 * Руководителю — без почты и без «войти заново»: почта — аккаунт владельца,
 * а сменить вход может только он.
 */
function ConnectedVia({ link, canConnect, t }: { link: GaConnection; canConnect: boolean; t: T }) {
  if (!canConnect) return <p className="mt-4 text-xs text-faint">{t.gaProperty(link.property ?? "")}</p>;
  if (link.via === "service") {
    return <p className="mt-4 text-xs text-faint">{t.viaService(link.property ?? "")}</p>;
  }
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-faint">
      <span>
        {t.viaGoogle}
        {link.email ? <> · {link.email}</> : null} · {t.resource(link.property ?? "")}
      </span>
      <form action={startGoogleSignIn}>
        <button type="submit" className="text-faint hover:text-green">
          {t.signInAgainLink}
        </button>
      </form>
    </div>
  );
}

function GaSource({
  result,
  link,
  notice,
  canConnect,
  t,
  locale,
}: {
  result: TrafficResult;
  link: GaConnection;
  notice: GaNotice;
  canConnect: boolean;
  t: T;
  locale: PanelLocale;
}) {
  const redirect = googleRedirectUri();
  let body: React.ReactNode;

  if (result.ok) {
    body = (
      <>
        <Report report={result.report} t={t} locale={locale} />
        <ConnectedVia link={link} canConnect={canConnect} t={t} />
      </>
    );
  } else if (!canConnect) {
    // Руководителю — что случилось и к кому идти, без кнопок: все они про
    // аккаунт Google владельца.
    body =
      result.reason === "reauth" ? (
        <p className={WARN}>{t.reauthHead}</p>
      ) : result.reason === "failed" ? (
        <p className={WARN}>{t.failedHead(result.detail ?? t.noDetail)}</p>
      ) : (
        <OwnerConnects t={t} />
      );
  } else if (result.reason === "reauth") {
    body = (
      <>
        <p className={WARN}>{t.reauthOwner}</p>
        <SignInButton t={t} />
      </>
    );
  } else if (result.reason === "failed") {
    const enable = enableApiLink(result.detail);
    body = (
      <>
        <p className={WARN}>
          {enable ? (
            <Rich text={t.enableApi(enable)} />
          ) : (
            t.gaFailed(result.detail ?? t.noDetail, link.property ?? "")
          )}
        </p>
        {link.via === "google" ? <SignInButton t={t} label={t.signInAgain} tone="quiet" /> : null}
      </>
    );
  } else if (link.via && !link.property) {
    body = (
      <>
        <p className="mt-3 text-sm text-muted">
          <Rich text={t.needProperty} />
        </p>
        <PropertyForm t={t} />
        {link.via === "google" ? <p className="mt-3 text-xs text-faint">{t.orEnableAdmin}</p> : null}
        {link.via === "google" ? <SignInButton t={t} label={t.signInAgain} tone="quiet" /> : null}
      </>
    );
  } else if (link.client) {
    body = (
      <>
        <p className="mt-3 text-sm text-muted">{t.clientSaved}</p>
        <SignInButton t={t} />
        <details className="mt-3 text-xs text-faint">
          <summary className="cursor-pointer hover:text-text">{t.replaceClient}</summary>
          <ClientForm t={t} />
        </details>
      </>
    );
  } else {
    body = (
      <>
        <Setup steps={gaSetupSteps(redirect, t)} t={t} />
        <ClientForm t={t} />
      </>
    );
  }

  return (
    <section className={CARD}>
      <p className={H2}>Google Analytics</p>
      {canConnect ? <Notice notice={notice} redirect={redirect} t={t} /> : null}
      {body}
    </section>
  );
}

/**
 * Трафик сайта: Метрика и Google Analytics рядом.
 *
 * Два источника не сводятся в одно число намеренно: они по-разному считают
 * визит и по-разному отсекают роботов, и «сумма» не значила бы ничего.
 * Рядом они видны как есть — и расхождение между ними тоже сведения.
 *
 * `canConnect` — владелец: у него шаги подключения и кнопки входа в Google.
 * Руководитель видит те же цифры, а вместо кнопок — «подключает владелец».
 */
export async function TrafficPanel({
  days,
  canConnect,
  notice = {},
  locale,
}: {
  days: TrafficPeriod;
  canConnect: boolean;
  notice?: GaNotice;
  locale: PanelLocale;
}) {
  const [ym, ga, link] = await Promise.all([loadMetrika(days), loadGa(days), gaConnection()]);
  return <TrafficView days={days} ym={ym} ga={ga} link={link} notice={notice} canConnect={canConnect} locale={locale} />;
}

/** Разметка отдельно от загрузки — чтобы её можно было проверить без API. */
export function TrafficView({
  days,
  ym,
  ga,
  link,
  notice,
  canConnect,
  locale,
}: {
  days: TrafficPeriod;
  ym: TrafficResult;
  ga: TrafficResult;
  link: GaConnection;
  notice: GaNotice;
  canConnect: boolean;
  locale: PanelLocale;
}) {
  const t = pick(trafficDict, locale);
  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-muted">
          {t.intro(days)}{" "}
          <HelpHint
            topic={helpAnchor("/admin/traffic", "numbers")}
            label={canConnect ? t.helpOwner : t.helpHead}
          />
        </p>
        <nav className="flex gap-3 text-sm">
          {TRAFFIC_PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin/traffic?d=${p}`}
              className={p === days ? "text-green" : "text-faint hover:text-text"}
            >
              {t.period(p)}
            </Link>
          ))}
        </nav>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Source title={t.metrika} result={ym} setup={metrikaSetup(t)} canConnect={canConnect} t={t} locale={locale} />
        <GaSource result={ga} link={link} notice={notice} canConnect={canConnect} t={t} locale={locale} />
      </div>
    </div>
  );
}
