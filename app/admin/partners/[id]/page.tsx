import Link from "next/link";

import { cancelClientAction } from "../actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { PartnerClientsBlock } from "@/components/admin/partner-clients";
import { partnerCardDict } from "@/content/admin-panel/partner-card";
import { partnersDict, usd } from "@/content/admin-panel/partners";
import { requireSection } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { activeStaff } from "@/lib/admin/team";
import { stageCounts } from "@/lib/partners/card";
import { loadPartnerCard } from "@/lib/partners/card-store";
import { agencyCounts, agencyUntilDay, linkUrl, shortUrl } from "@/lib/partners/rules";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const TH = "px-4 py-3 font-normal";
const TD = "px-4 py-3";

/**
 * Карточка партнёра — каких клиентов он привёл и где каждый сейчас
 * (lib/partners/card.ts). Владелец и руководитель, как весь раздел.
 * Владелец, 25.10.2026: «Сделай так, чтобы я и руководители могли нажать на
 * партнёра и посмотреть, каких клиентов он завёл».
 */
export default async function PartnerCardPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireSection("/admin/partners");
  const locale = staff.panel_locale;
  const t = pick(partnerCardDict, locale);
  const tp = pick(partnersDict, locale);
  const { id } = await params;
  const [card, people] = await Promise.all([
    /^[0-9a-f-]{36}$/i.test(id) ? loadPartnerCard(id) : Promise.resolve(null),
    activeStaff().catch(() => []),
  ]);
  const money = (value: number | null) => usd(value, locale);

  if (!card) {
    return (
      <AdminShell staff={staff}>
        <Link href="/admin/partners" className="text-sm text-muted hover:text-text">
          {t.back}
        </Link>
        <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-muted">{t.gone}</p>
      </AdminShell>
    );
  }

  const { summary, rows, extraProjects, clients, agencies } = card;
  const { partner, links, balance, paidProjects, projects, accruals } = summary;
  const name = (staffId: string | null) => (staffId ? (people.find((p) => p.id === staffId)?.display_name ?? "—") : t.nobody);
  const counts = stageCounts(rows);
  const accrualOf = new Map(accruals.map((a) => [a.project_id, a]));

  return (
    <AdminShell staff={staff}>
      <Link href="/admin/partners" className="text-sm text-muted hover:text-text">
        {t.back}
      </Link>
      <h1 className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-lg font-semibold">
        {partner.name}
        {partner.status === "blocked" ? <span className="text-xs font-normal text-gold">{tp.blocked}</span> : null}
      </h1>
      <p className="mt-1 text-xs text-faint">
        {partner.username ? `@${partner.username}` : partner.telegram_user_id ? `id ${partner.telegram_user_id}` : tp.noTelegram}
        {" · "}
        {tp.since(when(partner.created_at, locale))}
      </p>
      {partner.note ? <p className="mt-1 max-w-2xl text-sm text-muted">{partner.note}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label={t.clicks} value={String(links.reduce((sum, l) => sum + l.clicks, 0))} />
        <Card label={t.clients} value={String(rows.length)} note={t.clientsNote(paidProjects, projects.length)} />
        <Card label={tp.earned} value={money(balance.earned)} note={tp.paidNote(money(balance.paid))} />
        <Card label={tp.colAvailable} value={money(balance.available)} note={tp.frozen + ": " + money(balance.frozen)} />
      </div>

      {/* ── Ссылки ─────────────────────────────────────────────────────── */}
      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">{t.linksTitle}</h2>
      <ul className="mt-2 flex flex-col gap-1 text-sm">
        {links.map((l) => (
          <li key={l.id}>
            <a
              href={l.slug ? shortUrl(siteUrl, l.slug) : linkUrl(siteUrl, l.code)}
              className="font-mono hover:text-green"
              target="_blank"
              rel="noreferrer noopener"
            >
              {l.code}
            </a>
            <span className="text-faint"> · {l.is_default ? t.mainLink : l.label || "—"} · {t.linkStats(l.clicks, l.leads)}</span>
          </li>
        ))}
      </ul>

      {/* ── Клиенты ────────────────────────────────────────────────────── */}
      <h2 id="clients" className="mt-8 text-xs uppercase tracking-wider text-faint">
        {t.clientsTitle} · {rows.length}
      </h2>
      <p className="mt-1 max-w-2xl text-xs text-faint">{t.clientsLead}</p>
      {rows.length ? (
        <p className="mt-2 text-xs text-muted">
          {t.stagesLine(counts.lead, counts.work, counts.contract + counts.signed, counts.paid, counts.lost)}
        </p>
      ) : null}
      <section className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[960px]">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className={TH}>{t.colWhen}</th>
              <th className={TH}>{t.colClient}</th>
              <th className={TH}>{t.colVia}</th>
              <th className={TH}>{t.colStage}</th>
              <th className={TH}>{t.colOwner}</th>
              <th className={TH}>{t.colProject}</th>
              <th className={TH}>{t.colAccrual}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.leadId} className="border-b border-line-soft last:border-0 align-top">
                <td data-label={t.colWhen} className={`${TD} text-xs text-muted`}>{when(row.createdAt, locale)}</td>
                <td data-label={t.colClient} className={TD}>
                  <Link href={`/admin/leads/${row.leadId}`} className="text-text hover:text-green">
                    {row.who}
                  </Link>
                  {row.requestNo ? <span className="block font-mono text-xs text-faint">{row.requestNo}</span> : null}
                </td>
                <td data-label={t.colVia} className={`${TD} text-xs text-muted`}>{row.via ?? t.viaMain}</td>
                <td data-label={t.colStage} className={`${TD} text-xs`}>
                  <span className={row.stage === "paid" ? "text-green" : row.stage === "lost" ? "text-faint" : "text-text"}>
                    {t[`stage_${row.stage}`]}
                  </span>
                  {row.voidReason ? <span className="block text-gold">{t.voided(row.voidReason)}</span> : null}
                </td>
                <td data-label={t.colOwner} className={`${TD} text-xs text-muted`}>{name(row.ownerId)}</td>
                <td data-label={t.colProject} className={`${TD} text-xs`}>
                  {row.projectId ? (
                    <Link href={`/admin/projects/${row.projectId}`} className="hover:text-green">
                      {row.projectTitle || "—"}
                    </Link>
                  ) : (
                    <span className="text-faint">{t.noProject}</span>
                  )}
                </td>
                <td data-label={t.colAccrual} className={`${TD} font-mono text-xs`}>
                  {row.accrual ? (
                    <>
                      {money(row.accrual.amount_usd)}
                      <span className="block font-sans text-faint">
                        {t[`acc_${row.accrual.state}`]} · {row.accrual.percent} %
                      </span>
                    </>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-sm text-muted">
                  {t.noClients}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* ── Проекты без заявки партнёра ───────────────────────────────── */}
      {extraProjects.length ? (
        <>
          <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">{t.extraTitle}</h2>
          <p className="mt-1 max-w-2xl text-xs text-faint">{t.extraLead}</p>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {extraProjects.map((p) => {
              const accrual = accrualOf.get(p.id) ?? null;
              return (
                <li key={p.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                  <Link href={`/admin/projects/${p.id}`} className="hover:text-green">
                    {p.client?.trim() || p.title}
                  </Link>
                  {accrual ? (
                    <span className="ml-3 font-mono text-xs text-muted">
                      {money(accrual.amount_usd)} · {t[`acc_${accrual.state}`]}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {/* ── Закреплённые клиенты ───────────────────────────────────────── */}
      {clients.length ? (
        <PartnerClientsBlock
          clients={clients}
          partnerName={new Map([[partner.id, partner.name]])}
          locale={locale}
          cancel={cancelClientAction}
        />
      ) : null}

      {/* ── Агентства ─────────────────────────────────────────────────── */}
      {agencies.length ? (
        <>
          <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">{t.agenciesTitle}</h2>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {agencies.map((a) => (
              <li key={a.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                {a.name}
                {a.website ? <span className="ml-2 text-xs text-faint">{a.website}</span> : null}
                <span className="block text-xs">
                  {a.status === "active" && agencyCounts(a) ? (
                    <span className="text-green">
                      {tp.agencyActive(a.decided_at ? when(a.decided_at, locale) : "", agencyUntilDay(a.decided_at))}
                    </span>
                  ) : a.status === "active" ? (
                    <span className="text-gold">{tp.agencyExpired(agencyUntilDay(a.decided_at))}</span>
                  ) : a.status === "rejected" ? (
                    <span className="text-faint">{tp.agencyRejected(a.decision_note ?? "")}</span>
                  ) : (
                    <span className="text-gold">{tp.agencyPending(when(a.created_at, locale))}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </AdminShell>
  );
}

function Card({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-faint">{label}</p>
      <p className="mt-1 font-mono text-2xl">{value}</p>
      {note ? <p className="mt-1 text-xs text-faint">{note}</p> : null}
    </div>
  );
}
