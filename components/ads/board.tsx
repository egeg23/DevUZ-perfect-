import Link from "next/link";

import {
  acceptAction,
  disconnectAction,
  rejectAction,
  rollbackAction,
  saveSettingsAction,
  sendReportAction,
  simulateAction,
  syncNowAction,
  toggleStopAction,
} from "@/app/ads/actions";
import { adsDict } from "@/content/admin-panel/ads";
import { pick, PANEL_INTL, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import { alertText } from "@/lib/ads/alerts";
import { explain } from "@/lib/ads/explain";
import { money } from "@/lib/ads/negatives";
import { actionsOf, openAlerts, proposalsOf, testsOf, thresholdsOf, type Account, type Action, type Proposal } from "@/lib/ads/store";

/**
 * Кабинет одного рекламного аккаунта — одинаковый у агентства (/ads/…) и в
 * панели студии (/admin/ads/…): режим и лимиты, стоп-кран, предложения с
 * «Принять» и «Отклонить», идущие тесты, журнал с «Откатить», неделя.
 */

export const CARD = "rounded-xl border border-line bg-surface px-5 py-4";
export const H2 = "text-xs uppercase tracking-wider text-faint";
export const BTN = "rounded-lg px-3 py-1.5 text-sm";
export const INPUT = "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm";

type T = Picked<typeof adsDict>;

export function platformLabel(t: T, platform: Account["platform"]): string {
  return platform === "yandex" ? t.platformYandex : platform === "google" ? t.platformGoogle : t.platformStub;
}

export function statusLabel(t: T, status: Account["status"]): string {
  return { new: t.statusNew, ok: t.statusOk, error: t.statusError, disconnected: t.statusDisconnected }[status];
}

function kindLabel(t: T, kind: string): string {
  return kind === "negatives" ? t.kindNegatives : kind === "cross_negatives" ? t.kindCross : kind === "budget" ? t.kindBudget : kind === "ad_test" ? t.kindTest : kind === "ad_winner" ? t.kindWinner : kind;
}

export function resultLine(t: T, r: string | undefined, d: string | undefined): { text: string; tone: "ok" | "bad" } | null {
  if (!r) return null;
  const map: Record<string, string> = {
    saved: t.r_saved,
    applied: t.r_applied,
    rejected: t.r_rejected,
    rolled: t.r_rolled,
    sync: t.r_sync,
    report: t.r_report,
    oauth_ok: t.r_oauth_ok,
    oauth_off: t.r_oauth_off,
    oauth_denied: t.r_oauth_denied,
    oauth_failed: t.r_oauth_failed,
  };
  if (r === "refused") return { text: `${t.r_refused} ${d ?? ""}`, tone: "bad" };
  if (map[r]) return { text: map[r], tone: r.startsWith("oauth_") && r !== "oauth_ok" ? "bad" : "ok" };
  return { text: t.r_error, tone: "bad" };
}

export function whenText(iso: string, locale: PanelLocale): string {
  return new Date(iso).toLocaleString(PANEL_INTL[locale], { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Неделя из журнала — без запросов к площадке: страница не ждёт API. */
export function weekStats(actions: Action[], applied: Proposal[], waiting: number, now = Date.now()) {
  const since = now - 7 * 24 * 3600_000;
  const real = actions.filter((a) => a.kind !== "settings" && a.rollback_of === null && !a.rolled_back_at && Date.parse(a.at) >= since);
  const monthly = new Map(applied.map((p) => [p.id, Number(p.numbers.monthly ?? 0)]));
  const saved = real.filter((a) => a.kind === "negatives" && a.proposal_id).reduce((s, a) => s + (monthly.get(a.proposal_id!) ?? 0), 0);
  return { applied: real.length, saved, waiting };
}

export async function AdsBoard({
  account,
  locale,
  staff,
  r,
  d,
  backHref,
  flagOn,
}: {
  account: Account;
  locale: PanelLocale;
  staff: boolean;
  r?: string;
  d?: string;
  backHref: string;
  flagOn: boolean;
}) {
  const t = pick(adsDict, locale);
  const [open, failed, applied, tests, actions, alerts] = await Promise.all([
    proposalsOf(account.id, ["new"]),
    proposalsOf(account.id, ["failed"], 5),
    proposalsOf(account.id, ["applied"], 200),
    testsOf(account.id),
    actionsOf(account.id, 60),
    openAlerts(account.id),
  ]);
  const th = thresholdsOf(account);
  const week = weekStats(actions, applied, open.length);
  const result = resultLine(t, r, d);
  const hidden = <input type="hidden" name="account" value={account.id} />;
  const real = account.platform !== "stub";
  const loc = locale === "uz" ? "uz" : "ru";

  return (
    <div className="space-y-4">
      <div>
        <Link href={backHref} className="text-sm text-faint hover:text-text">
          {t.back}
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-lg font-semibold">{account.name || account.external_id}</h1>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint">
            {platformLabel(t, account.platform)}
            {account.sandbox ? " · sandbox" : ""}
          </span>
          <span className={`text-xs ${account.status === "error" ? "text-gold" : "text-muted"}`}>{statusLabel(t, account.status)}</span>
          {account.last_sync_at ? <span className="text-xs text-faint">{t.lastSync(whenText(account.last_sync_at, locale))}</span> : null}
        </div>
        {account.last_error ? <p className="mt-2 text-sm text-gold">{account.last_error}</p> : null}
        {!flagOn ? <p className="mt-2 text-xs text-faint">{t.flagOff}</p> : null}
      </div>

      {result ? (
        <p className={`rounded-xl border px-4 py-3 text-sm ${result.tone === "ok" ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"}`}>{result.text}</p>
      ) : null}

      {account.stopped ? <p className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{t.stopped}</p> : null}

      {/* ── Тревоги ──────────────────────────────────────────────────── */}
      {alerts.length ? (
        <section className="rounded-xl border border-gold/30 bg-gold/10 px-5 py-4">
          <p className="text-xs uppercase tracking-wider text-gold">{t.alertsTitle}</p>
          <ul className="mt-2 space-y-1 text-sm text-gold">
            {alerts.map((a) => (
              <li key={a.id}>
                <span className="text-xs opacity-70">{whenText(a.created_at, locale)}</span> {alertText(a, locale, account.currency)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gold/80">{t.alertsNote}</p>
        </section>
      ) : null}

      {/* ── Подключение и обновление ─────────────────────────────────── */}
      <section className={CARD}>
        <p className={H2}>{t.connectTitle}</p>
        <p className="mt-2 text-sm text-muted">{real ? (account.has_credentials ? t.connected : t.notConnected) : t.stubNote}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {real ? (
            <a href={`/api/ads/oauth/${account.platform}/start?account=${account.id}`} className={`${BTN} bg-green/90 text-ink hover:bg-green`}>
              {account.has_credentials ? t.reconnect : t.connect}
            </a>
          ) : null}
          {real && account.has_credentials ? (
            <form action={disconnectAction}>
              {hidden}
              <button className={`${BTN} border border-line text-muted hover:text-text`}>{t.disconnect}</button>
            </form>
          ) : null}
          {!real || account.has_credentials ? (
            <form action={syncNowAction}>
              {hidden}
              <button className={`${BTN} border border-blue-soft/40 text-blue-soft hover:bg-blue-soft/10`}>{t.syncNow}</button>
            </form>
          ) : null}
          {staff && !real ? (
            <form action={simulateAction}>
              {hidden}
              <button className={`${BTN} border border-line text-muted hover:text-text`}>{t.simulate}</button>
            </form>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-faint">{t.syncNote}</p>
      </section>

      {/* ── Предложения ──────────────────────────────────────────────── */}
      <section className={CARD}>
        <p className={H2}>{t.proposalsTitle}</p>
        {open.length === 0 ? <p className="mt-2 text-sm text-muted">{t.proposalsEmpty}</p> : null}
        <ul className="mt-3 space-y-3">
          {open.map((p) => {
            const text = explain(p, locale, account.currency);
            return (
              <li key={p.id} className="rounded-lg border border-line-soft px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-faint">{kindLabel(t, p.kind)}</span>
                  <p className="font-medium">{text.title}</p>
                </div>
                <p className="mt-1 text-sm text-muted">{text.why}</p>
                {p.payload.kind === "negatives" ? (
                  <p className="mt-2 font-mono text-xs text-faint">{p.payload.phrases.join(", ")}</p>
                ) : null}
                {p.payload.kind === "cross_negatives" ? (
                  <p className="mt-2 font-mono text-xs text-faint">
                    {p.payload.groups.map((g) => `${g.adGroupId}: ${g.phrases.join(", ")}`).join(" · ")}
                  </p>
                ) : null}
                {p.payload.kind === "budget" ? (
                  <p className="mt-2 font-mono text-xs text-faint">
                    {p.payload.moves.map((m) => `${m.campaignName}: ${money(m.from, account.currency, loc)} → ${money(m.to, account.currency, loc)}`).join(" · ")}
                  </p>
                ) : null}
                {p.payload.kind === "ad_test" ? (
                  <p className="mt-2 text-xs text-faint">
                    {p.payload.copy.headlines.join(" | ")} · {p.payload.copy.descriptions.join(" | ")}
                  </p>
                ) : null}
                {p.error ? <p className="mt-2 text-xs text-gold">{t.lastRefusal(p.error)}</p> : null}
                <div className="mt-3 flex gap-2">
                  <form action={acceptAction}>
                    {hidden}
                    <input type="hidden" name="proposal" value={p.id} />
                    <button className={`${BTN} bg-green/90 text-ink hover:bg-green`}>{t.accept}</button>
                  </form>
                  <form action={rejectAction}>
                    {hidden}
                    <input type="hidden" name="proposal" value={p.id} />
                    <button className={`${BTN} border border-line text-muted hover:text-text`}>{t.reject}</button>
                  </form>
                </div>
              </li>
            );
          })}
          {failed.map((p) => (
            <li key={p.id} className="rounded-lg border border-gold/30 px-4 py-3 text-sm text-gold">
              {explain(p, locale, account.currency).title}: {p.error}
            </li>
          ))}
        </ul>
        {tests.length ? (
          <div className="mt-4">
            <p className={H2}>{t.testsTitle}</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {tests.map((x) => (
                <li key={x.id}>
                  #{x.id} · {t.testLine(Math.floor((Date.now() - Date.parse(x.started_at)) / 86_400_000))}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* ── Неделя ───────────────────────────────────────────────────── */}
      <section className={CARD}>
        <p className={H2}>{t.weekTitle}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Tile value={String(week.applied)} label={t.weekApplied} />
          <Tile value={money(week.saved, account.currency, loc)} label={t.weekSaved} />
          <Tile value={String(week.waiting)} label={t.weekWaiting} />
        </div>
        <form action={sendReportAction} className="mt-3">
          {hidden}
          <button className={`${BTN} border border-blue-soft/40 text-blue-soft hover:bg-blue-soft/10`}>{t.sendReport}</button>
        </form>
      </section>

      {/* ── Режим и лимиты ───────────────────────────────────────────── */}
      <section className={CARD}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={H2}>{t.settingsTitle}</p>
          <form action={toggleStopAction}>
            {hidden}
            <button className={`${BTN} ${account.stopped ? "border border-line text-muted" : "bg-gold/90 text-ink hover:bg-gold"}`}>
              {account.stopped ? t.stopOff : t.stopOn}
            </button>
          </form>
        </div>
        <p className="mt-2 text-xs text-faint">{t.guards}</p>
        <form action={saveSettingsAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          {hidden}
          <label className="text-sm sm:col-span-2">
            <span className="text-muted">{t.mode}</span>
            <select name="mode" defaultValue={account.mode} className={`mt-1 ${INPUT}`}>
              <option value="suggest">{t.modeSuggest}</option>
              <option value="auto">{t.modeAuto}</option>
            </select>
          </label>
          <Field name="maxShift" label={t.maxShift} value={account.max_shift_pct} />
          <Field name="maxActions" label={t.maxActions} value={account.max_actions_day} />
          <Field name="wasteCost" label={t.wasteCost} value={th.wasteCost} />
          <Field name="wasteClicks" label={t.wasteClicks} value={th.wasteClicks} />
          <Field name="targetCpa" label={t.targetCpa} value={th.targetCpa ?? ""} />
          <Field name="protectedWords" label={t.protectedWords} value={th.protectedWords.join(", ")} />
          <label className="text-sm sm:col-span-2">
            <span className="text-muted">{t.business}</span>
            <textarea name="business" defaultValue={th.business} rows={2} className={`mt-1 ${INPUT}`} />
          </label>
          <div className="sm:col-span-2">
            <button className={`${BTN} bg-green/90 text-ink hover:bg-green`}>{t.save}</button>
          </div>
        </form>
      </section>

      {/* ── Журнал ───────────────────────────────────────────────────── */}
      <section className={CARD}>
        <p className={H2}>{t.journalTitle}</p>
        {actions.length === 0 ? <p className="mt-2 text-sm text-muted">{t.journalEmpty}</p> : null}
        <ul className="mt-3 space-y-2">
          {actions.map((a) => (
            <li key={a.id} className="border-t border-line-soft pt-2 text-sm">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs text-faint">{whenText(a.at, locale)}</span>
                <span className="text-xs text-muted">{a.actor}</span>
                {a.auto ? <span className="rounded bg-blue-soft/10 px-1.5 text-[11px] text-blue-soft">{t.autoBadge}</span> : null}
                {a.rollback_of ? <span className="rounded bg-surface-2 px-1.5 text-[11px] text-faint">{t.rollbackBadge}</span> : null}
                {a.rolled_back_at ? <span className="rounded bg-surface-2 px-1.5 text-[11px] text-faint">{t.rolledBack}</span> : null}
              </div>
              <p className="mt-1 text-muted">{a.why}</p>
              {a.kind !== "settings" && !a.rollback_of && !a.rolled_back_at ? (
                <form action={rollbackAction} className="mt-1">
                  {hidden}
                  <input type="hidden" name="action" value={a.id} />
                  <button className="text-xs text-blue-soft hover:underline">{t.rollback}</button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Field({ name, label, value }: { name: string; label: string; value: string | number }) {
  return (
    <label className="text-sm">
      <span className="text-muted">{label}</span>
      <input name={name} defaultValue={String(value)} className={`mt-1 ${INPUT}`} />
    </label>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-line-soft px-4 py-3">
      <p className="font-mono text-xl">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
