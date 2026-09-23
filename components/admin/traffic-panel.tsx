import Link from "next/link";

import { HelpHint } from "@/components/admin/help-link";
import { helpAnchor } from "@/lib/admin/help";
import { loadGa, loadMetrika, type TrafficReport, type TrafficResult, type TrafficTotals } from "@/lib/analytics/traffic";

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";
const H2 = "text-xs uppercase tracking-wider text-faint";

export const TRAFFIC_PERIODS = [7, 30, 90] as const;
export type TrafficPeriod = (typeof TRAFFIC_PERIODS)[number];

export function trafficPeriodOf(raw: string | undefined): TrafficPeriod {
  const n = Number(raw);
  return (TRAFFIC_PERIODS as readonly number[]).includes(n) ? (n as TrafficPeriod) : 30;
}

const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");

function duration(seconds: number): string {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Рост против прошлого периода — процентом; «новое», если раньше было ноль. */
function Delta({ now, before, invert = false }: { now: number; before: number; invert?: boolean }) {
  if (before === 0) return now > 0 ? <span className="text-xs text-muted">новое</span> : null;
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

function Totals({ t, prev }: { t: TrafficTotals; prev: TrafficTotals }) {
  const items = [
    { label: "визитов", value: fmt(t.visits), delta: <Delta now={t.visits} before={prev.visits} /> },
    { label: "посетителей", value: fmt(t.users), delta: <Delta now={t.users} before={prev.users} /> },
    { label: "просмотров", value: fmt(t.pageviews), delta: <Delta now={t.pageviews} before={prev.pageviews} /> },
    { label: "отказов", value: `${Math.round(t.bounce)}%`, delta: <Delta now={t.bounce} before={prev.bounce} invert /> },
    { label: "ср. визит", value: duration(t.duration), delta: <Delta now={t.duration} before={prev.duration} /> },
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
function Daily({ days }: { days: TrafficReport["days"] }) {
  if (!days.length) return null;
  const max = Math.max(1, ...days.map((d) => d.visits));
  return (
    <div className="mt-4">
      <div className="flex h-24 items-end gap-px" role="img" aria-label="Визиты по дням">
        {days.map((d) => (
          <div
            key={d.date}
            title={`${d.date.split("-").reverse().join(".")}: ${d.visits} визитов, ${d.users} посетителей`}
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
function Ranked({ title, rows }: { title: string; rows: { name: string; visits: number }[] }) {
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
            <span className="font-mono text-xs text-muted">{fmt(r.visits)}</span>
            <span className="col-span-2 h-1 overflow-hidden rounded bg-surface-2">
              <span className="block h-full bg-green/50" style={{ width: `${(r.visits / max) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Setup({ steps }: { steps: React.ReactNode[] }) {
  return (
    <div className="mt-3 text-sm text-muted">
      <p>Не подключено. Что нужно сделать один раз:</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11px] text-text">{children}</code>
);

const METRIKA_SETUP = [
  <>
    На <Code>oauth.yandex.ru</Code> — «Создать приложение», платформа «Веб-сервисы», Redirect URI{" "}
    <Code>https://oauth.yandex.ru/verification_code</Code>, доступ «Яндекс.Метрика: получение статистики».
  </>,
  <>
    Под аккаунтом, у которого есть доступ к счётчику 112925960, откройте{" "}
    <Code>{"https://oauth.yandex.ru/authorize?response_type=token&client_id=<ClientID приложения>"}</Code> и
    скопируйте токен.
  </>,
  <>
    На сервере в <Code>/opt/devuz/.env</Code> добавьте строку <Code>YANDEX_METRIKA_TOKEN=токен</Code> и
    выполните там же <Code>docker compose up -d</Code> — или просто дождитесь следующей выкатки.
  </>,
];

const GA_SETUP = [
  <>
    В <Code>console.cloud.google.com</Code> выберите или создайте проект и включите «Google Analytics Data
    API».
  </>,
  <>IAM → «Сервисные аккаунты» → создать → «Ключи» → «Добавить ключ» → JSON. Скачается файл.</>,
  <>
    В Google Analytics: «Администратор» → «Управление доступом к ресурсу» → добавьте почту сервисного
    аккаунта с ролью «Читатель». Там же в «Сведениях о ресурсе» — числовой идентификатор ресурса.
  </>,
  <>
    На сервере в <Code>/opt/devuz/.env</Code>: <Code>GA4_PROPERTY_ID=число</Code> и{" "}
    <Code>GA_SERVICE_ACCOUNT=</Code> — содержимое JSON-файла в base64 (<Code>base64 -w0 ключ.json</Code>).
    Затем <Code>docker compose up -d</Code> или следующая выкатка.
  </>,
];

function Source({ title, result, setup }: { title: string; result: TrafficResult; setup: React.ReactNode[] }) {
  return (
    <section className={CARD}>
      <p className={H2}>{title}</p>
      {result.ok ? (
        <>
          <div className="mt-3">
            <Totals t={result.report.totals} prev={result.report.prev} />
          </div>
          <Daily days={result.report.days} />
          <div className="grid gap-x-6 sm:grid-cols-2">
            <Ranked title="Откуда приходят" rows={result.report.sources} />
            <Ranked title="Страницы входа" rows={result.report.pages} />
          </div>
        </>
      ) : result.reason === "not_configured" ? (
        <Setup steps={setup} />
      ) : (
        <p className="mt-3 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">
          Не ответил: {result.detail ?? "без описания"}. Попробуйте обновить страницу через минуту; если
          повторяется — проверьте ключ в .env.
        </p>
      )}
    </section>
  );
}

/**
 * Трафик сайта на дашборде владельца: Метрика и Google Analytics рядом.
 *
 * Два источника не сводятся в одно число намеренно: они по-разному считают
 * визит и по-разному отсекают роботов, и «сумма» не значила бы ничего.
 * Рядом они видны как есть — и расхождение между ними тоже сведения.
 */
export async function TrafficPanel({ days }: { days: TrafficPeriod }) {
  const [ym, ga] = await Promise.all([loadMetrika(days), loadGa(days)]);
  return <TrafficView days={days} ym={ym} ga={ga} />;
}

/** Разметка отдельно от загрузки — чтобы её можно было проверить без API. */
export function TrafficView({ days, ym, ga }: { days: TrafficPeriod; ym: TrafficResult; ga: TrafficResult }) {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-muted">
          Последние {days} дней, стрелки — против {days} дней до них. Обновляется раз в 10 минут.{" "}
          <HelpHint topic={helpAnchor("/admin", "traffic")} label="Откуда цифры и как подключить" />
        </p>
        <nav className="flex gap-3 text-sm">
          {TRAFFIC_PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin?tab=traffic&d=${p}`}
              className={p === days ? "text-green" : "text-faint hover:text-text"}
            >
              {p} дней
            </Link>
          ))}
        </nav>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Source title="Яндекс Метрика" result={ym} setup={METRIKA_SETUP} />
        <Source title="Google Analytics" result={ga} setup={GA_SETUP} />
      </div>
    </div>
  );
}
