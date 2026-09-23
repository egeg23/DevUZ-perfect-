import Link from "next/link";

import { saveGaProperty, startGoogleSignIn } from "@/app/admin/google/actions";
import { HelpHint } from "@/components/admin/help-link";
import { SubmitButton } from "@/components/admin/submit-button";
import { helpAnchor } from "@/lib/admin/help";
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

function Report({ report }: { report: TrafficReport }) {
  return (
    <>
      <div className="mt-3">
        <Totals t={report.totals} prev={report.prev} />
      </div>
      <Daily days={report.days} />
      <div className="grid gap-x-6 sm:grid-cols-2">
        <Ranked title="Откуда приходят" rows={report.sources} />
        <Ranked title="Страницы входа" rows={report.pages} />
      </div>
    </>
  );
}

// Ответы Google бывают с длинными ссылками без пробелов: без переноса где
// угодно такая строка раздвигает карточку за край экрана.
const WARN = "mt-3 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold [overflow-wrap:anywhere]";
const OK = "mt-3 rounded-lg border border-green/30 bg-green/10 px-3 py-2 text-sm text-green [overflow-wrap:anywhere]";

function Source({ title, result, setup }: { title: string; result: TrafficResult; setup: React.ReactNode[] }) {
  return (
    <section className={CARD}>
      <p className={H2}>{title}</p>
      {result.ok ? (
        <Report report={result.report} />
      ) : result.reason === "not_configured" ? (
        <Setup steps={setup} />
      ) : (
        <p className={WARN}>
          Не ответил: {result.detail ?? "без описания"}. Попробуйте обновить страницу через минуту; если
          повторяется — проверьте ключ в .env.
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
function SignInButton({ label = "Войти через Google", tone = "primary" }: { label?: string; tone?: "primary" | "quiet" }) {
  return (
    <form action={startGoogleSignIn} className="mt-3">
      <SubmitButton pendingLabel="Открываем Google…" base="rounded-lg px-4 py-2 text-sm font-semibold" tone={tone}>
        {label}
      </SubmitButton>
    </form>
  );
}

/** Client ID и секрет из Google Cloud — сохраняются и сразу ведут на вход. */
function ClientForm() {
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
        <SubmitButton pendingLabel="Сохраняем…" base="rounded-lg px-4 py-2 text-sm font-semibold">
          Сохранить и войти через Google
        </SubmitButton>
      </div>
    </form>
  );
}

/** Номер ресурса руками — если найти его сам вход не смог. */
function PropertyForm() {
  return (
    <form action={saveGaProperty} className="mt-3 flex flex-wrap items-center gap-2">
      <input
        name="property"
        required
        inputMode="numeric"
        placeholder="Номер ресурса: 512345678"
        aria-label="Номер ресурса Google Analytics"
        className={`${INPUT} max-w-[16rem]`}
      />
      <SubmitButton pendingLabel="Сохраняем…" base="rounded-lg px-3 py-2 text-xs" tone="quiet">
        Сохранить номер
      </SubmitButton>
    </form>
  );
}

function gaSetupSteps(redirect: string): React.ReactNode[] {
  return [
    <>
      Откройте <ExtLink href="https://console.cloud.google.com/apis/library">console.cloud.google.com</ExtLink>,
      вверху выберите тот же проект, что у ключа карт. В «APIs &amp; Services» → «Library» найдите и
      включите кнопкой «Enable» два API: <b>Google Analytics Data API</b> (по нему идут цифры) и{" "}
      <b>Google Analytics Admin API</b> (по нему панель сама найдёт ресурс сайта).
    </>,
    <>
      «Google Auth Platform» (в старом меню — «APIs &amp; Services» → «OAuth consent screen») → «Get
      started»: имя приложения — например «DevUz панель», почта — ваша, Audience — <b>External</b> →
      «Create».
    </>,
    <>
      Там же «Audience» → <b>«Publish app»</b> → «Confirm». Без этого приложение остаётся в режиме
      «Testing», и Google выключает вход через 7 дней. Проверка Google не нужна: при входе он предупредит
      «Google hasn&rsquo;t verified this app» — нажмите «Advanced» → «Go to … (unsafe)». Это ваше
      приложение, и просит оно только чтение статистики.
    </>,
    <>
      «Clients» → «Create client» → тип <b>Web application</b>. В «Authorized redirect URIs» → «Add URI»
      вставьте ровно <Code>{redirect}</Code> → «Create».
    </>,
    <>
      Google покажет Client ID и Client secret. Скопируйте оба сразу — секрет он потом не показывает, —
      вставьте ниже и нажмите «Сохранить и войти через Google». Входите аккаунтом, у которого есть доступ к
      Google Analytics сайта, и не снимайте галочку «See and download your Google Analytics data».
    </>,
  ];
}

export type GaNotice = { code?: string; detail?: string; property?: string };

/** Что вернул вход через Google — одной строкой над карточкой. */
function Notice({ notice, redirect }: { notice: GaNotice; redirect: string }) {
  const detail = notice.detail?.trim();
  const link = enableApiLink(detail);
  const text: Record<string, { ok?: boolean; body: React.ReactNode }> = {
    connected: {
      ok: true,
      body: <>Google подключён, статистика берётся из ресурса {notice.property ?? "сайта"}.</>,
    },
    property_saved: { ok: true, body: <>Номер ресурса сохранён.</> },
    denied: { body: <>Вход отменён на экране Google — ничего не сохранено.</> },
    state: {
      body: (
        <>
          Вход не прошёл проверку: он был начат слишком давно, в другом окне или на другом адресе панели.
          Нажмите «Войти через Google» ещё раз.
        </>
      ),
    },
    client: { body: <>Нет Client ID и секрета — вставьте их ниже.</> },
    client_bad: {
      body: (
        <>
          Client ID выглядит как <Code>1234567890-abc….apps.googleusercontent.com</Code>, а секрет обычно
          начинается с <Code>GOCSPX-</Code>. Проверьте, что скопировали обе строки целиком, без пробелов.
        </>
      ),
    },
    save_failed: { body: <>Не удалось сохранить в хранилище секретов. Попробуйте ещё раз через минуту.</> },
    exchange: {
      body: (
        <>
          Google не выдал доступ{detail ? <>: {detail}</> : null}. Частые причины: адрес возврата в клиенте не
          совпадает до символа с <Code>{redirect}</Code>, или секрет скопирован не полностью.
        </>
      ),
    },
    scope: {
      body: (
        <>
          Вход прошёл, но без права читать статистику: на экране Google была снята галочка «See and download
          your Google Analytics data». Войдите ещё раз и оставьте её.
        </>
      ),
    },
    no_refresh: {
      body: (
        <>
          Google не выдал постоянный доступ. Откройте{" "}
          <ExtLink href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</ExtLink>,
          удалите там это приложение и войдите ещё раз.
        </>
      ),
    },
    no_property: {
      body: (
        <>
          Вход сохранён, но у этого аккаунта Google нет ресурса Analytics со счётчиком сайта{" "}
          <Code>{measurementId()}</Code>
          {detail ? <> (проверено ресурсов: {detail})</> : null}. Войдите аккаунтом, у которого есть доступ к
          статистике сайта, или впишите номер ресурса ниже.
        </>
      ),
    },
    admin_api: {
      body: link ? (
        <>
          Вход сохранён, но найти ресурс сам не получилось: в проекте Google Cloud не включён «Google Analytics
          Admin API». <ExtLink href={link}>Включите его</ExtLink> (кнопка «Enable»), подождите минуту и нажмите
          «Войти заново» — или впишите номер ресурса ниже.
        </>
      ) : (
        <>
          Вход сохранён, но найти ресурс сам не получилось{detail ? <>: {detail}</> : null}. Впишите номер ресурса
          ниже или нажмите «Войти заново».
        </>
      ),
    },
    property_bad: {
      body: (
        <>
          Номер ресурса — только цифры, например <Code>512345678</Code>. Это не <Code>G-…</Code>: он в Google
          Analytics → «Администратор» → «Сведения о ресурсе».
        </>
      ),
    },
  };
  const entry = notice.code ? text[notice.code] : undefined;
  if (!entry) return null;
  return <p className={entry.ok ? OK : WARN}>{entry.body}</p>;
}

/** Откуда сейчас идёт статистика GA — строкой под цифрами. */
function ConnectedVia({ link }: { link: GaConnection }) {
  if (link.via === "service") {
    return <p className="mt-4 text-xs text-faint">Через ключ сервисного аккаунта · ресурс {link.property}</p>;
  }
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-faint">
      <span>
        Через вход Google{link.email ? <> · {link.email}</> : null} · ресурс {link.property}
      </span>
      <form action={startGoogleSignIn}>
        <button type="submit" className="text-faint hover:text-green">
          войти заново
        </button>
      </form>
    </div>
  );
}

function GaSource({ result, link, notice }: { result: TrafficResult; link: GaConnection; notice: GaNotice }) {
  const redirect = googleRedirectUri();
  let body: React.ReactNode;

  if (result.ok) {
    body = (
      <>
        <Report report={result.report} />
        <ConnectedVia link={link} />
      </>
    );
  } else if (result.reason === "reauth") {
    body = (
      <>
        <p className={WARN}>
          Google больше не пускает по сохранённому входу: доступ отозван, сменён пароль, или приложение в
          Google Cloud не опубликовано (в режиме «Testing» вход живёт 7 дней — нажмите там «Publish app»).
          Войдите ещё раз — это минута.
        </p>
        <SignInButton />
      </>
    );
  } else if (result.reason === "failed") {
    const enable = enableApiLink(result.detail);
    body = (
      <>
        <p className={WARN}>
          {enable ? (
            <>
              Google не отдаёт цифры: в проекте Google Cloud не включён нужный API (обычно «Google Analytics Data
              API»). <ExtLink href={enable}>Включите его</ExtLink> (кнопка «Enable»), подождите пару минут и
              обновите страницу.
            </>
          ) : (
            <>
              Не ответил: {result.detail ?? "без описания"}. Попробуйте обновить страницу через минуту. Если Google
              пишет про права (permission) — войдите аккаунтом, у которого есть доступ к ресурсу {link.property}.
            </>
          )}
        </p>
        {link.via === "google" ? <SignInButton label="Войти заново" tone="quiet" /> : null}
      </>
    );
  } else if (link.via && !link.property) {
    body = (
      <>
        <p className="mt-3 text-sm text-muted">
          Вход есть, не хватает номера ресурса Google Analytics. Его можно найти в Google Analytics →
          «Администратор» → «Сведения о ресурсе» (только цифры, не <Code>G-…</Code>) и вписать сюда:
        </p>
        <PropertyForm />
        {link.via === "google" ? (
          <p className="mt-3 text-xs text-faint">
            Или включите в Google Cloud «Google Analytics Admin API» и войдите заново — панель найдёт номер
            сама.
          </p>
        ) : null}
        {link.via === "google" ? <SignInButton label="Войти заново" tone="quiet" /> : null}
      </>
    );
  } else if (link.client) {
    body = (
      <>
        <p className="mt-3 text-sm text-muted">
          Client ID сохранён. Осталось войти: нажмите кнопку и войдите аккаунтом Google, у которого есть доступ к
          Google Analytics сайта. Номер ресурса панель найдёт сама.
        </p>
        <SignInButton />
        <details className="mt-3 text-xs text-faint">
          <summary className="cursor-pointer hover:text-text">Заменить Client ID и секрет</summary>
          <ClientForm />
        </details>
      </>
    );
  } else {
    body = (
      <>
        <Setup steps={gaSetupSteps(redirect)} />
        <ClientForm />
      </>
    );
  }

  return (
    <section className={CARD}>
      <p className={H2}>Google Analytics</p>
      <Notice notice={notice} redirect={redirect} />
      {body}
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
export async function TrafficPanel({ days, notice = {} }: { days: TrafficPeriod; notice?: GaNotice }) {
  const [ym, ga, link] = await Promise.all([loadMetrika(days), loadGa(days), gaConnection()]);
  return <TrafficView days={days} ym={ym} ga={ga} link={link} notice={notice} />;
}

/** Разметка отдельно от загрузки — чтобы её можно было проверить без API. */
export function TrafficView({
  days,
  ym,
  ga,
  link,
  notice,
}: {
  days: TrafficPeriod;
  ym: TrafficResult;
  ga: TrafficResult;
  link: GaConnection;
  notice: GaNotice;
}) {
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
        <GaSource result={ga} link={link} notice={notice} />
      </div>
    </div>
  );
}
