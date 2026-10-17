import Link from "next/link";
import type { ReactNode } from "react";

import { myStatusAction } from "@/app/admin/hq/actions";
// «Взять» — тем же действием, что в карточке лида: очередь проверяет takeLead.
import { take as takeAction } from "@/app/admin/leads/[id]/actions";
import { HelpHint } from "@/components/admin/help-link";
import { ContactButton, Countdown, MockupPassword } from "@/components/admin/hq-my-client";
import { LinkPending } from "@/components/admin/link-pending";
import { MyStagesCard, ShownButton, markResultText } from "@/components/admin/sales-stages";
import { SubmitButton } from "@/components/admin/submit-button";
import { hqDict } from "@/content/admin-panel/hq";
import { hqMyDict } from "@/content/admin-panel/hq-my";
import { salesStagesDict } from "@/content/admin-panel/sales-stages";
import { helpAnchor } from "@/lib/admin/help";
import { clockOf, deltaOf, type Trend } from "@/lib/admin/hq";
import { MY_LIST_MAX, sinceOf, untilOf, type ContactRow, type Hot, type MockupLine, type Overdue, type StatusTarget } from "@/lib/admin/hq-my";
import type { MyHq } from "@/lib/admin/hq-my-store";
import { PANEL_INTL, pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";

/**
 * «Главная» менеджера — вёрстка. Только отрисовка готового (lib/admin/hq-my-store):
 * её же рисуют тест и скриншоты.
 *
 * Телефон одной рукой: «Горит сейчас» и «Просрочено» — наверху, кнопки не
 * ниже 44 px, строка — карточка во всю ширину. На большом экране слева —
 * что делать (горит, просрочено, с кем связаться), справа — моя работа и
 * мои макеты.
 *
 * Горящее «дышит» золотым свечением (.hq-hot), просроченное — красная
 * полоса слева и подталкивающий значок (.hq-late); при «уменьшить
 * движение» остаются цвет и значок (app/globals.css).
 */

type T = Picked<typeof hqMyDict>;
type H = Picked<typeof hqDict>;

const CARD = "rounded-3xl border border-line/70 bg-surface shadow-[0_10px_24px_rgba(0,0,0,0.28)]";
const BTN = "min-h-11 min-w-11 justify-center rounded-xl px-3.5 text-sm font-medium";

/** «14:05» сегодня, «15.10 14:05» — другой день. По Ташкенту. */
function whenOf(iso: string, now: Date): string {
  const day = (ms: number) => new Date(ms + 5 * 3600_000).toISOString().slice(0, 10);
  const d = new Date(Date.parse(iso) + 5 * 3600_000);
  const dm = `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return day(Date.parse(iso)) === day(now.getTime()) ? clockOf(iso) : `${dm} ${clockOf(iso)}`;
}

function Delta({ trend, h, goodUp = true }: { trend: Trend; h: H; goodUp?: boolean }) {
  const d = deltaOf(trend);
  if (d === 0) return <span className="text-[11px] text-faint">{h.same}</span>;
  const good = d > 0 === goodUp;
  return <span className={`text-[11px] font-medium ${good ? "text-green" : "text-gold"}`}>{h.vsPrev(`${d > 0 ? "▲ +" : "▼ −"}${Math.abs(d)}`)}</span>;
}

function SectionHead({ id, title, hint, count, tone }: { id: string; title: string; hint: ReactNode; count?: number; tone: "gold" | "red" | "green" | "blue" | "violet" }) {
  const chip = {
    gold: "bg-gold/15 text-gold",
    red: "bg-red-500/15 text-red-300",
    green: "bg-green/10 text-green",
    blue: "bg-blue/15 text-blue-soft",
    violet: "bg-violet/15 text-violet",
  }[tone];
  return (
    <div className="flex items-center gap-3">
      <h2 id={id} className="flex items-center gap-2 text-base font-semibold text-text">
        {title}
        {hint}
      </h2>
      {count ? <span className={`ml-auto rounded-full px-2.5 py-0.5 font-mono text-xs ${chip}`}>{count}</span> : null}
    </div>
  );
}

/* ── Быстрая смена статуса — как у бота ──────────────────────────────── */

function StatusButtons({ s, t }: { s: StatusTarget; t: T }) {
  const hidden = (answer: string) => (
    <>
      <input type="hidden" name="lead" value={s.leadId} />
      <input type="hidden" name="answer" value={answer} />
    </>
  );
  return (
    <div className="mt-2.5 flex flex-wrap items-start gap-2" data-status-buttons>
      <form action={myStatusAction}>
        {hidden("won")}
        <SubmitButton base={BTN} pendingLabel={t.saving}>
          {t.won}
        </SubmitButton>
      </form>
      <form action={myStatusAction}>
        {hidden("lost")}
        <SubmitButton base={BTN} tone="quiet" pendingLabel={t.saving}>
          {t.lost}
        </SubmitButton>
      </form>
      {s.canWait ? (
        // «⏳» — сначала «когда следующий шаг?», как у бота; без скрипта.
        <details className="group/wait basis-full sm:basis-auto">
          <summary className={`${BTN} inline-flex cursor-pointer list-none items-center border border-gold/40 text-gold transition hover:bg-gold/10 [&::-webkit-details-marker]:hidden`}>
            {t.wait}
          </summary>
          <div className="mt-2 rounded-2xl bg-surface-2/70 p-3">
            <p className="text-xs text-muted">{t.whenNext}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["w1", "w3", "w7"] as const).map((term) => (
                <form key={term} action={myStatusAction}>
                  {hidden(term)}
                  <SubmitButton base={`${BTN} w-full px-2`} tone="quiet" pendingLabel={t.saving}>
                    {t[term]}
                  </SubmitButton>
                </form>
              ))}
            </div>
          </div>
        </details>
      ) : (
        <span className="flex min-h-11 items-center text-xs text-faint">{t.noMoreWait}</span>
      )}
    </div>
  );
}

/* ── Строка «горит» и «просрочено» ───────────────────────────────────── */

function Item({
  href,
  title,
  meta,
  late,
  red,
  icon,
  children,
}: {
  href: string;
  title: string;
  meta: ReactNode;
  late?: boolean;
  red?: boolean;
  icon: string;
  children?: ReactNode;
}) {
  return (
    <li
      className={`${late ? "hq-late border-red-400/30 bg-red-500/[0.06] pl-4" : "hq-hot border-gold/30 bg-gold/[0.05]"} rounded-2xl border p-3`}
      data-red={red ? "" : undefined}
    >
      <Link href={href} className="flex min-h-11 items-start gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40">
        <span className={`${late ? "hq-late-icon" : ""} mt-0.5 text-lg leading-none`} aria-hidden="true">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block break-words text-sm font-medium leading-snug text-text">
            {title}
            <LinkPending />
          </span>
          <span className={`mt-0.5 block text-xs ${red || late ? "text-red-300" : "text-gold"}`}>{meta}</span>
        </span>
      </Link>
      {children}
    </li>
  );
}

function hotIcon(h: Hot): string {
  return { offer: "🔥", reply: "💬", opened: "👀", promo: "⏰", taskToday: "📌" }[h.kind];
}

function span(v: { h: number; m: number }, h: H): string {
  return h.left(v.h, v.m);
}

function HotItem({ x, t, h, now }: { x: Hot; t: T; h: H; now: Date }) {
  switch (x.kind) {
    case "offer":
      return (
        <Item href={x.href} title={t.hotOffer(x.label)} icon={hotIcon(x)} red={x.red} meta={<>{t.burnsIn} <Countdown until={x.until} now={now.toISOString()} /></>}>
          <form action={takeAction} className="mt-2.5">
            <input type="hidden" name="lead" value={x.leadId} />
            <SubmitButton base={`${BTN} w-full sm:w-auto`} pendingLabel={t.taking}>
              {t.take}
            </SubmitButton>
          </form>
        </Item>
      );
    case "reply":
      return (
        <Item href={x.href} title={t.hotReply(x.label)} icon={hotIcon(x)} red={x.red} meta={t.waiting(span(sinceOf(x.since, now), h))}>
          {x.status ? <StatusButtons s={x.status} t={t} /> : null}
        </Item>
      );
    case "opened":
      return (
        <Item href={x.href} title={t.hotOpened(x.label)} icon={hotIcon(x)} red meta={t.ago(span(sinceOf(x.at, now), h))}>
          {x.status ? <StatusButtons s={x.status} t={t} /> : null}
        </Item>
      );
    case "promo":
      return (
        <Item href={x.href} title={t.hotPromo(x.label)} icon={hotIcon(x)} red={x.red} meta={t.leftShort(span(untilOf(x.endsAt, now), h))}>
          {x.status ? <StatusButtons s={x.status} t={t} /> : null}
        </Item>
      );
    case "taskToday":
      return (
        <Item href={x.href} title={t.hotTask(x.label)} icon={hotIcon(x)} red={x.red} meta={t.dueAt(clockOf(x.due))}>
          {x.status ? <StatusButtons s={x.status} t={t} /> : null}
        </Item>
      );
  }
}

function LateItem({ x, t, now }: { x: Overdue; t: T; now: Date }) {
  switch (x.kind) {
    case "task":
      return (
        <Item late href={x.href} title={t.lateTask(x.label)} icon="⏰" meta={t.dueAt(whenOf(x.due, now))}>
          {x.status ? <StatusButtons s={x.status} t={t} /> : null}
        </Item>
      );
    case "nextStep":
      return (
        <Item late href={x.href} title={t.lateStep(x.label)} icon="⏳" meta={t.since(whenOf(x.since, now))}>
          {x.status ? <StatusButtons s={x.status} t={t} /> : null}
        </Item>
      );
    case "stale":
      return (
        <Item late href={x.href} title={t.lateStale(x.label, x.days)} icon="🗂" meta="">
          {x.status ? <StatusButtons s={x.status} t={t} /> : null}
        </Item>
      );
  }
}

function More({ n, href, t }: { n: number; href: string; t: T }) {
  if (n <= 0) return null;
  return (
    <Link href={href} className="mt-2 flex min-h-11 items-center justify-center rounded-2xl bg-surface-2 text-sm text-muted transition hover:text-text">
      {t.more(n)}
      <LinkPending />
    </Link>
  );
}

/* ── С кем связаться ─────────────────────────────────────────────────── */

function ContactItem({ c, t, now }: { c: ContactRow; t: T; now: Date }) {
  const why = c.why === "task" ? t.whyTask : c.why === "nextStep" ? t.whyStep : t.whyReply;
  return (
    <li className="rounded-2xl border border-line/70 bg-surface-2/40 p-3">
      <div className="flex items-start gap-3">
        <span className="min-w-0 flex-1">
          <Link href={c.href} className="block break-words text-sm font-medium text-text hover:text-green">
            {c.label}
            <LinkPending />
          </Link>
          <span className="block text-xs text-faint">
            {why} · {whenOf(c.at, now)}
          </span>
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {c.leadId ? (
          <ContactButton leadId={c.leadId} channel={c.channel} />
        ) : c.directUrl ? (
          <a
            href={c.directUrl}
            {...(c.directUrl.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-green/90 px-3.5 text-sm font-medium text-ink transition hover:bg-green"
          >
            <span aria-hidden="true">{c.directUrl.startsWith("tel:") ? "📞" : "💬"}</span>
            {c.directUrl.startsWith("tel:") ? t.call : t.write}
          </a>
        ) : null}
        <Link href={c.href} className="inline-flex min-h-11 items-center rounded-xl border border-line px-3.5 text-sm text-muted transition hover:text-text">
          {t.card}
          <LinkPending />
        </Link>
      </div>
      {c.status ? <StatusButtons s={c.status} t={t} /> : null}
    </li>
  );
}

/* ── Мои макеты ──────────────────────────────────────────────────────── */

function MockupItem({ m, t, h, s, now }: { m: MockupLine; t: T; h: H; s: Picked<typeof salesStagesDict>; now: Date }) {
  const openH = m.openUntil ? Math.max(1, Math.ceil((Date.parse(m.openUntil) - now.getTime()) / 3600_000)) : null;
  const access = m.ref.startsWith("s:") ? t.mockPublic : m.closedAt ? t.mockClosed(whenOf(m.closedAt, now)) : openH ? t.mockOpenFor(openH) : null;
  const promo = m.status === "approved" ? t.mockApproved : m.promoLive ? t.mockPromo(span(untilOf(m.expiresAt, now), h)) : t.mockPromoOver;
  return (
    <li className={`rounded-2xl border p-3 ${m.openedNow ? "hq-hot border-gold/30 bg-gold/[0.05]" : "border-line/70 bg-surface-2/40"}`}>
      <Link href={m.href} className="block break-words text-sm font-medium text-text hover:text-green">
        {m.client || m.name}
        <LinkPending />
      </Link>
      {m.client && m.name ? <p className="truncate text-xs text-faint">{m.name}</p> : null}
      <ul className="mt-2 flex flex-col gap-1 text-xs">
        <li className="text-muted">📤 {t.mockSent(whenOf(m.sentAt, now))}</li>
        <li className={m.openedNow ? "text-gold" : m.lastOpenedAt ? "text-green" : "text-faint"}>
          👀 {m.openedNow ? `${t.mockOpenedNow} · ` : ""}
          {m.lastOpenedAt ? t.mockOpened(whenOf(m.lastOpenedAt, now), m.opens) : t.mockNotOpened}
        </li>
        <li className={m.promoLive ? "text-gold" : "text-faint"}>⏳ {promo}</li>
        {access ? <li className={m.closedAt ? "text-green" : "text-gold"}>🔒 {access}</li> : null}
      </ul>
      {/* Показ макета — ступень продажи, которую база сама не узнает. */}
      <div className="mt-2.5" data-shown={m.shownAt ? "yes" : "no"}>
        {m.shownAt ? (
          <p className="text-xs text-green">🎬 {s.shownOn(whenOf(m.shownAt, now))}</p>
        ) : m.leadId || m.prospectId ? (
          <ShownButton leadId={m.leadId} prospectId={m.leadId ? null : m.prospectId} back="/admin/hq" s={s} />
        ) : null}
      </div>
      <div className="mt-2.5">
        <MockupPassword mockupRef={m.ref} name={m.client || m.name} open={!m.closedAt && !m.ref.startsWith("s:")} />
      </div>
      {m.status_ ? <StatusButtons s={m.status_} t={t} /> : null}
    </li>
  );
}

/* ── Моя работа ──────────────────────────────────────────────────────── */

function Tile({ href, label, value, sub }: { href: string; label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <Link href={href} className="flex min-h-11 flex-col rounded-2xl bg-surface-2/70 px-3 py-2.5 transition hover:bg-line">
      <span className="font-mono text-2xl leading-none tabular-nums text-text">{value}</span>
      <span className="mt-1 text-xs text-muted">
        {label}
        <LinkPending />
      </span>
      {sub ? <span className="mt-0.5">{sub}</span> : null}
    </Link>
  );
}

const RESULT_TONE: Record<string, string> = {
  lost: "border-line bg-surface-2 text-muted",
  term: "border-gold/30 bg-gold/10 text-gold",
};

/* ── Страница ───────────────────────────────────────────────────────── */

export function MyHqView({
  my,
  locale,
  name,
  now,
  result,
  mark,
}: {
  my: MyHq;
  locale: PanelLocale;
  name: string;
  now: Date;
  /** Чем кончилось нажатие статуса: из адреса после действия (?st=…&due=…). */
  result?: { st: string; due?: string | null } | null;
  /** Чем кончилась отметка ступени продажи (?mk=…). */
  mark?: string;
}) {
  const t = pick(hqMyDict, locale);
  const s = pick(salesStagesDict, locale);
  const marked = markResultText(mark, s);
  const h = pick(hqDict, locale);
  const w = my.work;
  // Кнопки статуса у лида — один раз на странице, у первого упоминания
  // (горит → просрочено → с кем связаться → макеты): иначе один клиент
  // повторял бы «🏆 / ❌ / ⏳» в трёх блоках.
  const seen = new Set<string>();
  const once = <X,>(x: X, key: (x: X) => StatusTarget | null, set: (x: X, s: StatusTarget | null) => X): X => {
    const s = key(x);
    if (!s) return x;
    if (seen.has(s.leadId)) return set(x, null);
    seen.add(s.leadId);
    return x;
  };
  const hot = my.hot
    .slice(0, MY_LIST_MAX)
    .map((x): Hot => (x.kind === "offer" ? x : once(x, (y) => y.status, (y, st) => ({ ...y, status: st }))));
  const overdue = my.overdue.slice(0, MY_LIST_MAX).map((x) => once(x, (y) => y.status, (y, st) => ({ ...y, status: st }) as Overdue));
  const contacts = my.contacts.slice(0, MY_LIST_MAX).map((x) => once(x, (y) => y.status, (y, st) => ({ ...y, status: st })));
  const mockups = my.mockups.slice(0, MY_LIST_MAX).map((x) => once(x, (y) => y.status_, (y, st) => ({ ...y, status_: st })));
  const date = new Intl.DateTimeFormat(PANEL_INTL[locale], { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Tashkent" }).format(now);
  const resultText = result
    ? result.st === "lost"
      ? t.rLost
      : result.st === "term" && result.due
        ? t.rTerm(whenOf(result.due, now).replace(/ \d\d:\d\d$/, ""))
        : result.st === "forbidden"
          ? t.rForbidden
          : result.st === "gone"
            ? t.rGone
            : result.st === "nowait"
              ? t.rNowait
              : result.st === "failed"
                ? t.rFailed
                : null
    : null;

  return (
    <div className="flex flex-col gap-5 sm:gap-6" data-hq-my>
      <header className="flex flex-col gap-1">
        <p className="text-xs text-faint first-letter:uppercase">{date}</p>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-text">
          {h.hello(name)}
          <HelpHint topic={helpAnchor("/admin/hq", "my-day")} />
        </h1>
        <p className="max-w-xl text-sm text-muted">{t.lead}</p>
        <p className="mt-1 flex items-center gap-2 text-xs text-faint">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green/60 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
          </span>
          {h.updated(clockOf(now.toISOString()))}
        </p>
      </header>

      {my.offline ? <p className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{h.offline}</p> : null}
      {resultText ? (
        <p role="status" className={`rounded-2xl border px-4 py-3 text-sm ${RESULT_TONE[result?.st ?? ""] ?? "border-red-400/30 bg-red-500/10 text-red-200"}`}>
          {resultText}
        </p>
      ) : null}

      {marked ? (
        <p role="status" className={`rounded-2xl border px-4 py-3 text-sm ${marked.ok ? "border-green/30 bg-green/10 text-green" : "border-red-400/30 bg-red-500/10 text-red-200"}`}>
          {marked.text}
        </p>
      ) : null}

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-3 lg:items-start">
        <div className="flex flex-col gap-5 sm:gap-6 lg:col-span-2">
          <section className={`${CARD} p-4 sm:p-5`} aria-labelledby="my-hot" data-block="hot">
            <SectionHead id="my-hot" title={t.hotTitle} hint={<HelpHint topic={helpAnchor("/admin/hq", "my-hot")} />} count={my.hot.length} tone="gold" />
            {my.hot.length ? (
              <ul className="mt-3 flex flex-col gap-2.5">
                {hot.map((x) => (
                  <HotItem key={x.key} x={x} t={t} h={h} now={now} />
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-2xl bg-green/5 px-3 py-3 text-sm text-green">✓ {t.hotCalm}</p>
            )}
            <More n={my.hot.length - MY_LIST_MAX} href="/admin?status=taken" t={t} />
          </section>

          <section className={`${CARD} p-4 sm:p-5`} aria-labelledby="my-late" data-block="late">
            <SectionHead id="my-late" title={t.lateTitle} hint={<HelpHint topic={helpAnchor("/admin/hq", "my-overdue")} />} count={my.overdue.length} tone="red" />
            {my.overdue.length ? (
              <ul className="mt-3 flex flex-col gap-2.5">
                {overdue.map((x) => (
                  <LateItem key={x.key} x={x} t={t} now={now} />
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-2xl bg-green/5 px-3 py-3 text-sm text-green">✓ {t.lateCalm}</p>
            )}
            <More n={my.overdue.length - MY_LIST_MAX} href="/admin?status=taken" t={t} />
          </section>

          <section className={`${CARD} p-4 sm:p-5`} aria-labelledby="my-contacts" data-block="contacts">
            <SectionHead id="my-contacts" title={t.contactTitle} hint={<HelpHint topic={helpAnchor("/admin/hq", "my-contacts")} />} count={my.contacts.length} tone="green" />
            {my.contacts.length ? (
              <ul className="mt-3 grid gap-2.5 xl:grid-cols-2">
                {contacts.map((c) => (
                  <ContactItem key={c.key} c={c} t={t} now={now} />
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-faint">{t.contactNone}</p>
            )}
            <More n={my.contacts.length - MY_LIST_MAX} href="/admin/tasks" t={t} />
          </section>
        </div>

        <div className="flex flex-col gap-5 sm:gap-6">
          {my.stages ? <MyStagesCard stages={my.stages} locale={locale} /> : null}
          <section className={`${CARD} p-4 sm:p-5`} aria-labelledby="my-work" data-block="work">
            <SectionHead id="my-work" title={t.workTitle} hint={<HelpHint topic={helpAnchor("/admin/hq", "my-work")} />} tone="blue" />
            <Link href="/admin/prospect" className="mt-3 block rounded-2xl bg-surface-2/70 px-3 py-2.5 transition hover:bg-line">
              <span className="text-sm text-text">{w.portionTarget ? t.workPortion(w.portionDone, w.portionTarget) : t.workNoPortion}</span>
              {w.portionTarget ? (
                <span className="mt-2 block h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuemin={0} aria-valuemax={w.portionTarget} aria-valuenow={w.portionDone}>
                  <span className={`block h-full rounded-full ${w.portionDone >= w.portionTarget ? "bg-green" : "bg-green-dim"}`} style={{ width: `${Math.min(100, Math.round((w.portionDone / w.portionTarget) * 100))}%` }} />
                </span>
              ) : null}
            </Link>
            <p className="mt-3 text-[11px] uppercase tracking-wider text-faint">{t.todayCol}</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              <Tile href="/admin/prospect" label={t.workTouches} value={w.touchesToday} />
              <Tile href="/admin/talks" label={t.workReplies} value={w.repliesToday} />
              <Tile href="/admin?status=taken" label={t.workInWork} value={w.inWork} />
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-wider text-faint">{t.weekCol}</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <Tile href="/admin/prospect" label={t.workTouches} value={w.touches7.now} sub={<Delta trend={w.touches7} h={h} />} />
              <Tile href="/admin/talks" label={t.workReplies} value={w.replies7.now} sub={<Delta trend={w.replies7} h={h} />} />
              <Tile href="/admin?status=taken" label={t.workWarmTaken} value={w.warmTaken7.now} sub={<Delta trend={w.warmTaken7} h={h} />} />
              <Tile href="/admin?status=new" label={t.workWarmBurned} value={w.warmBurned7.now} sub={<Delta trend={w.warmBurned7} h={h} goodUp={false} />} />
              <Tile href="/admin/mockups" label={t.workMockups} value={w.mockups7.now} sub={<Delta trend={w.mockups7} h={h} />} />
              <Tile href="/admin?status=won" label={t.workWon} value={w.won7.now} sub={<Delta trend={w.won7} h={h} />} />
            </div>
          </section>

          <section className={`${CARD} p-4 sm:p-5`} aria-labelledby="my-mockups" data-block="mockups">
            <SectionHead id="my-mockups" title={t.mockTitle} hint={<HelpHint topic={helpAnchor("/admin/hq", "my-mockups")} />} count={my.mockups.length} tone="violet" />
            {my.mockups.length ? (
              <ul className="mt-3 flex flex-col gap-2.5">
                {mockups.map((m) => (
                  <MockupItem key={m.id} m={m} t={t} h={h} s={s} now={now} />
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-faint">{t.mockNone}</p>
            )}
            <Link href="/admin/mockups" className="mt-2 flex min-h-11 items-center justify-center rounded-2xl bg-surface-2 text-sm text-muted transition hover:text-text">
              {t.allMockups}
              <LinkPending />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
