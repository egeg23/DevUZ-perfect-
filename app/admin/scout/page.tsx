import Link from "next/link";

import { changeSignalStatus } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { requireStaff } from "@/lib/admin/guard";
import { SIGNAL_STATUSES, listSignals, scoutCounts } from "@/lib/admin/scout";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  new: "новые",
  answered: "ответили",
  ignored: "мимо",
  converted: "пришёл сам",
};

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

  const [counts, signals] = await Promise.all([scoutCounts(), listSignals(status)]);
  const back = status ? `/admin/scout?status=${status}` : "/admin/scout";

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">Холодный поиск</h1>

      {r ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            r === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {r === "ok" ? "Готово." : "Не получилось."}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile value={counts.total} label="сигналов" />
        <Tile value={counts.fresh} label="не открывали" />
        <Tile value={counts.converted} label="пришли сами" />
        <Tile
          value={counts.conversion === null ? "—" : `${counts.conversion}%`}
          label="доходят до нас"
          hint="Считается от отработанных. Сигнал, который никто не открывал, говорит о нехватке рук, а не о качестве отбора."
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
          все
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
            {STATUS_LABEL[value]}
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
                <span className="text-sm">{signal.category ?? "без категории"}</span>
                {signal.chat_title ? (
                  <span className="text-sm text-muted">{signal.chat_title}</span>
                ) : null}
                <span className="text-xs text-faint">{when(signal.created_at)}</span>
                <span className="ml-auto text-xs text-faint">
                  {signal.lead_id ? "хранится как часть лида" : `сотрётся через ${daysLeft(signal.expires_at)} дн.`}
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
                  {signal.author_username ? `@${signal.author_username}` : "без username"}
                </span>
                {signal.message_link ? (
                  <a
                    href={signal.message_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-soft hover:underline"
                  >
                    открыть сообщение →
                  </a>
                ) : (
                  <span className="text-faint">ссылки нет — закрытый чат без адреса</span>
                )}
                {signal.lead_id ? (
                  <Link
                    href={`/admin/leads/${signal.lead_id}`}
                    className="text-green hover:underline"
                  >
                    стал лидом →
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
                      {STATUS_LABEL[value]}
                    </button>
                  </form>
                ))}
                {signal.status === "converted" ? (
                  <span className="rounded-lg border border-green/40 bg-green/10 px-3 py-1.5 text-xs text-green">
                    пришёл сам
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
          Сигналов нет.
        </p>
      )}

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">
        Отвечать нужно руками и в том же публичном чате — сервис в чаты не
        пишет ни строкой. «Пришёл сам» проставляется автоматически, когда
        человек напишет нашему боту: только тогда сигнал перестаёт стираться по
        сроку и становится частью истории сделки.
      </p>
    </AdminShell>
  );
}
