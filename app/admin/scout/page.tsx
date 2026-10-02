import Link from "next/link";

import { changeSignalStatus } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { HelpHint } from "@/components/admin/help-link";
import { helpAnchor } from "@/lib/admin/help";
import { when } from "@/components/admin/lead-table";
import { scoutDict, signalStatusDict } from "@/content/admin-panel/scout";
import { requireStaff } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { SIGNAL_STATUSES, listSignals, scoutCounts } from "@/lib/admin/scout";
import { diagnose, readPulse, unreadChats } from "@/lib/scout/health";

export const dynamic = "force-dynamic";

function Tile({ value, label, hint }: { value: string | number; label: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="font-mono text-2xl">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-faint">{label}</p>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-faint">{hint}</p> : null}
    </div>
  );
}

/** Сколько дней сигналу осталось до уборки. */
function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

export default async function ScoutPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; r?: string }>;
}) {
  const staff = await requireStaff();
  const { status, r } = await searchParams;
  const locale = staff.panel_locale;
  const t = pick(scoutDict, locale);
  const statusLabel = pick(signalStatusDict, locale);

  const [counts, signals, pulse] = await Promise.all([
    scoutCounts(),
    listSignals(status),
    readPulse(),
  ]);

  // Пустая лента одинаково выглядит при мёртвом скауте и при тишине в чатах.
  // Пока это не написано на странице, разбираться идут в systemd — и чаще
  // всего зря.
  const health = diagnose(pulse, Date.now(), locale);
  const unread = unreadChats(pulse);
  const back = status ? `/admin/scout?status=${status}` : "/admin/scout";

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>

      {r ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            r === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {r === "ok" ? t.done : t.failed}
        </p>
      ) : null}

      <p
        className={`mt-4 rounded-xl border px-4 py-2.5 text-sm leading-relaxed ${
          health.state === "ok" || health.state === "quiet"
            ? "border-line bg-surface text-muted"
            : "border-gold/30 bg-gold/10 text-gold"
        }`}
      >
        {health.says}{" "}
        <HelpHint topic={helpAnchor("/admin/scout", "health")} label={t.healthHelp} />
      </p>

      {/*
        Недочитанные чаты — отдельной строкой и всегда, даже когда остальное
        в порядке. Скаут, читающий половину списка, отчитывается бодро: он и
        правда работает — просто в половине мест его нет, и узнать об этом
        можно было только сверив два числа в пульсе руками.
      */}
      {unread > 0 && pulse ? (
        <p className="mt-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm leading-relaxed text-gold">
          {t.unread(pulse.chatsReading, pulse.chatsWatched, unread)}
          {pulse.unread?.length ? (
            <span className="mt-1 block font-mono text-xs">{t.unreadList} {pulse.unread.join(", ")}</span>
          ) : null}
        </p>
      ) : null}

      <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-faint">
        <span className="inline-flex items-center gap-1.5">
          {t.howItWorks} <HelpHint topic={helpAnchor("/admin/scout", "how")} label={t.howItWorks} />
        </span>
        <span className="inline-flex items-center gap-1.5">
          {t.whatToDo} <HelpHint topic={helpAnchor("/admin/scout", "signals")} label={t.whatToDo} />
        </span>
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile value={counts.total} label={t.tileSignals} />
        <Tile value={counts.fresh} label={t.tileFresh} />
        <Tile value={counts.converted} label={t.tileConverted} />
        <Tile
          value={counts.conversion === null ? "—" : `${counts.conversion}%`}
          label={t.tileConversion}
          hint={t.tileConversionHint}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/scout"
          className={`rounded-full border px-3 py-1 text-xs transition ${
            !status
              ? "border-green/40 bg-green/10 text-green"
              : "border-line bg-surface text-muted hover:text-text"
          }`}
        >
          {t.all}
        </Link>
        {SIGNAL_STATUSES.map((value) => (
          <Link
            key={value}
            href={`/admin/scout?status=${value}`}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              status === value
                ? "border-green/40 bg-green/10 text-green"
                : "border-line bg-surface text-muted hover:text-text"
            }`}
          >
            {statusLabel[value]}
          </Link>
        ))}
      </div>

      {signals.length ? (
        <ul className="mt-6 space-y-3">
          {signals.map((signal) => (
            <li key={signal.id} className="rounded-xl border border-line bg-surface px-5 py-4">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs">
                  {signal.score ?? "—"}/100
                </span>
                <span className="text-sm">{signal.category ?? t.noCategory}</span>
                {signal.chat_title ? (
                  <span className="text-sm text-muted">{signal.chat_title}</span>
                ) : null}
                <span className="text-xs text-faint">{when(signal.created_at, locale)}</span>
                <span className="ml-auto text-xs text-faint">
                  {signal.lead_id ? t.keptWithLead : t.erasedIn(daysLeft(signal.expires_at))}
                </span>
              </div>

              {signal.rationale ? (
                <p className="mt-2 text-sm text-green">{signal.rationale}</p>
              ) : null}

              <p className="mt-2 whitespace-pre-line rounded-lg border border-line-soft bg-surface-2 px-4 py-3 text-sm leading-relaxed">
                {signal.excerpt}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                <span className="text-faint">
                  {signal.author_username ? `@${signal.author_username}` : t.noUsername}
                </span>
                {signal.message_link ? (
                  <a
                    href={signal.message_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-soft hover:underline"
                  >
                    {t.openMessage}
                  </a>
                ) : (
                  <span className="text-faint">{t.noLink}</span>
                )}
                {signal.lead_id ? (
                  <Link
                    href={`/admin/leads/${signal.lead_id}`}
                    className="text-green hover:underline"
                  >
                    {t.becameLead}
                  </Link>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line-soft pt-4">
                {SIGNAL_STATUSES.filter((value) => value !== "converted").map((value) => (
                  <form key={value} action={changeSignalStatus}>
                    <input type="hidden" name="signal" value={signal.id} />
                    <input type="hidden" name="status" value={value} />
                    <input type="hidden" name="back" value={back} />
                    <button
                      type="submit"
                      disabled={signal.status === value}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                        signal.status === value
                          ? "border-green/40 bg-green/10 text-green"
                          : "border-line bg-surface-2 text-muted hover:text-text"
                      }`}
                    >
                      {statusLabel[value]}
                    </button>
                  </form>
                ))}
                {signal.status === "converted" ? (
                  <span className="rounded-lg border border-green/40 bg-green/10 px-3 py-1.5 text-xs text-green">
                    {t.convertedChip}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
          {t.empty}
        </p>
      )}

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">
        {t.foot}
      </p>
    </AdminShell>
  );
}
