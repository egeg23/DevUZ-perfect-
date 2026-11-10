import Link from "next/link";

import { tenderStatusAction } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { HelpHint } from "@/components/admin/help-link";
import { tenderStatusDict, tendersDict } from "@/content/admin-panel/tenders";
import { requireSection } from "@/lib/admin/guard";
import { helpAnchor } from "@/lib/admin/help";
import { pick } from "@/lib/admin/i18n";
import { staffNames } from "@/lib/scout/extra-chats-store";
import { SOURCE_LABEL } from "@/lib/scout/tender-sources";
import { TENDER_STATUSES, isTenderStatus, listTenders, loadScan, priceText, tashkentShort, tenderCounts } from "@/lib/scout/tender-store";

export const dynamic = "force-dynamic";

/** Сколько дней до конца приёма заявок (по Ташкенту, целыми днями). */
function daysLeft(deadline: string, now: number): number {
  return Math.floor((new Date(deadline).getTime() - now) / 86_400_000);
}

export default async function TendersPage({ searchParams }: { searchParams: Promise<{ status?: string; r?: string }> }) {
  const staff = await requireSection("/admin/tenders");
  const { status: raw, r } = await searchParams;
  const status = raw === "all" ? "all" : raw && isTenderStatus(raw) ? raw : "new";
  const locale = staff.panel_locale;
  const t = pick(tendersDict, locale);
  const label = pick(tenderStatusDict, locale);

  const [rows, counts, scan] = await Promise.all([listTenders(status), tenderCounts(), loadScan()]);
  const names = await staffNames((rows ?? []).map((row) => row.taken_by).filter((id): id is string => Boolean(id))).catch(() => new Map<string, string>());
  const now = Date.now();
  const back = `/admin/tenders?status=${status}`;

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        {t.lead} <HelpHint topic={helpAnchor("/admin/tenders", "how")} label={t.howItWorks} />
      </p>

      <p className="mt-3 max-w-3xl rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm font-medium text-gold">⚠️ {t.priceRule}</p>

      {r ? (
        <p data-result={r === "ok" ? "ok" : "warn"} className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${r === "ok" ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"}`}>
          {r === "ok" ? t.done : t.failed}
        </p>
      ) : null}

      {rows === null ? (
        <p className="mt-6 rounded-xl border border-gold/30 bg-gold/10 px-5 py-4 text-sm text-gold">{t.notReady}</p>
      ) : (
        <>
          <div className="mt-4 rounded-xl border border-line bg-surface px-5 py-3 text-sm text-muted">
            <span className="text-faint">{t.lastScan}: </span>
            {scan ? tashkentShort(scan.at) : t.never}
            {scan?.sources.length ? (
              <span className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                {scan.sources.map((item) => (
                  <span key={item.source} className={item.error ? "text-gold" : ""}>
                    {SOURCE_LABEL[item.source]}: {item.error ? t.sourceError : `${item.seen} ${t.seen}, ${item.ours} ${t.ours}`}
                  </span>
                ))}
              </span>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {TENDER_STATUSES.map((value) => (
              <Link key={value} href={`/admin/tenders?status=${value}`} className={`rounded-full border px-3 py-1 text-xs transition ${status === value ? "border-green/40 bg-green/10 text-green" : "border-line bg-surface text-muted hover:text-text"}`}>
                {label[value]} · {counts?.[value] ?? 0}
              </Link>
            ))}
            <Link href="/admin/tenders?status=all" className={`rounded-full border px-3 py-1 text-xs transition ${status === "all" ? "border-green/40 bg-green/10 text-green" : "border-line bg-surface text-muted hover:text-text"}`}>
              {t.all}
            </Link>
          </div>

          {rows.length ? (
            <ul className="mt-5 space-y-3">
              {rows.map((row) => {
                const left = row.deadline ? daysLeft(row.deadline, now) : null;
                return (
                  <li key={row.id} className="rounded-xl border border-line bg-surface px-5 py-4">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
                      <span className="rounded bg-surface-2 px-2 py-0.5 font-mono">{SOURCE_LABEL[row.source]}</span>
                      {row.kind ? <span className="text-muted">{row.kind}</span> : null}
                      {row.topics.map((topic) => (
                        <span key={topic} className="rounded-full border border-green/30 px-2 py-0.5 text-green">{topic}</span>
                      ))}
                      {row.deadline ? (
                        <span className={`ml-auto font-medium ${left !== null && left < 0 ? "text-faint" : left !== null && left <= 2 ? "text-gold" : "text-muted"}`}>
                          {t.deadline}: {tashkentShort(row.deadline)} · {left !== null && left < 0 ? t.closed : t.daysLeft(left ?? 0)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-medium leading-relaxed">{row.title}</p>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                      {row.customer ? <span><span className="text-faint">{t.customer}: </span>{row.customer}{row.region ? ` · ${row.region}` : ""}</span> : null}
                      {row.price ? <span><span className="text-faint">{t.price}: </span>{priceText(row.price, row.currency)}</span> : null}
                      {row.taken_by ? <span><span className="text-faint">{t.takenBy}: </span>{names.get(row.taken_by) ?? "—"}</span> : null}
                    </div>
                    {row.phone || row.email || row.contact_person || row.customer_inn ? (
                      <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                        <span className="text-faint">{t.contact}:</span>
                        {row.contact_person ? <span>{row.contact_person}</span> : null}
                        {row.phone ? <a href={`tel:${row.phone}`} className="text-blue-soft hover:underline">{row.phone}</a> : null}
                        {row.email ? <a href={`mailto:${row.email}`} className="text-blue-soft hover:underline">{row.email}</a> : null}
                        {row.customer_inn ? <span>{t.inn} {row.customer_inn}</span> : null}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-soft pt-3">
                      <a href={row.url} target="_blank" rel="noreferrer" className="mr-2 text-xs text-blue-soft hover:underline">{t.open} ↗</a>
                      {row.lead_id ? <Link href={`/admin/leads/${row.lead_id}`} className="mr-2 text-xs text-blue-soft hover:underline">{t.leadCard}</Link> : null}
                      {TENDER_STATUSES.map((value) => (
                        <form key={value} action={tenderStatusAction}>
                          <input type="hidden" name="tender" value={row.id} />
                          <input type="hidden" name="status" value={value} />
                          <input type="hidden" name="back" value={back} />
                          <button type="submit" disabled={row.status === value} className={`rounded-lg border px-3 py-1.5 text-xs transition ${row.status === value ? "border-green/40 bg-green/10 text-green" : "border-line bg-surface-2 text-muted hover:text-text"}`}>
                            {label[value]}
                          </button>
                        </form>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-muted">{t.empty}</p>
          )}
        </>
      )}

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">{t.foot}</p>
    </AdminShell>
  );
}
