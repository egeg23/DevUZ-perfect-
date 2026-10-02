import Link from "next/link";

import { addPartner, cancelClientAction, decide, decideAgencyAction, editPartner } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { partnersDict, partnersResultDict, perkDict, usd } from "@/content/admin-panel/partners";
import { requireAdmin } from "@/lib/admin/guard";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { partnerClientsDict } from "@/content/admin-panel/partner-clients";
import { PartnerClientsBlock } from "@/components/admin/partner-clients";
import {
  MIN_PAYOUT_USD,
  PARTNER_TIERS,
  poolAmount,
  poolProjects,
  tierPercent,
  agencyCounts,
  agencyUntilDay,
  linkUrl,
  shortUrl,
} from "@/lib/partners/rules";
import { listPromo } from "@/lib/partners/promo";
import { agenciesOf, clientsOf, listPartners, summarize } from "@/lib/partners/store";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Партнёры: кто привёл клиентов, что им начислено, кто просит выплату.
 *
 * Только владелец: это деньги посторонним людям. Начисления считаются на
 * лету из проектов и платежей, как у сотрудников; здесь — сводка по
 * каждому и заявки на выплату, которые нужно решить.
 */

/** Тон ответа: зелёный — сделано, жёлтый — не вышло. Текст — из словаря по коду. */
const OK_CODES = new Set(["ok", "created", "paid", "rejected", "agency_active", "agency_rejected"]);

const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";
const SMALL =
  "rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50";
const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";
const TH = "px-4 py-3 font-normal";
const TD = "px-4 py-3";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const admin = await requireAdmin();
  const { r } = await searchParams;
  const locale = admin.panel_locale;
  const t = pick(partnersDict, locale);
  const results = pick(partnersResultDict, locale);
  const tc = pick(partnerClientsDict, locale);
  // Ответы по закреплённым клиентам — из их словаря, остальные — из словаря раздела.
  const CLIENT_RESULT: Record<string, { text: string; tone: "ok" | "warn" }> = {
    client_cancelled: { text: tc.resultCancelled, tone: "ok" },
    client_invalid: { text: tc.resultNeedNote, tone: "warn" },
  };
  const notice = r
    ? (CLIENT_RESULT[r] ??
      (Object.hasOwn(results, r)
        ? { text: results[r as keyof typeof results], tone: OK_CODES.has(r) ? "ok" : "warn" }
        : null))
    : null;
  const money = (value: number | null) => usd(value, locale);

  const summaries = await summarize(await listPartners());
  const [agencies, clients, promo] = await Promise.all([
    agenciesOf("all"),
    clientsOf("all"),
    listPromo({ withHidden: false }),
  ]);
  const pendingAgencies = agencies.filter((a) => a.status === "pending");
  const partnerName = new Map(summaries.map((s) => [s.partner.id, s.partner.name]));
  const projectName = new Map(
    summaries.flatMap((s) => s.projects.map((p) => [p.id, p.client?.trim() || p.title] as const)),
  );
  const requests = summaries
    .flatMap((s) => s.payouts.filter((p) => p.status === "requested").map((p) => ({ ...p, partner: s.partner })))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const totals = {
    frozen: summaries.reduce((sum, s) => sum + s.balance.frozen, 0),
    earned: summaries.reduce((sum, s) => sum + s.balance.earned, 0),
    paid: summaries.reduce((sum, s) => sum + s.balance.paid, 0),
    due: summaries.reduce((sum, s) => sum + s.balance.available + s.balance.requested, 0),
  };

  return (
    <AdminShell staff={admin}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">{t.intro(tiersLine(locale))}</p>

      {notice ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            notice.tone === "ok" ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          label={t.cardPartners}
          value={String(summaries.length)}
          note={t.withPaid(summaries.filter((s) => s.paidProjects > 0).length)}
        />
        <Card label={t.frozen} value={money(totals.frozen)} note={t.frozenNote} />
        <Card label={t.earned} value={money(totals.earned)} note={t.paidNote(money(totals.paid))} />
        <Card label={t.due} value={money(totals.due)} note={t.inRequests(money(requests.reduce((s, p) => s + p.amount_usd, 0)))} warn={requests.length > 0} />
      </div>

      {/* ── Промо-материалы ───────────────────────────────────────────── */}
      <Link
        href="/admin/partners/promo"
        className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm transition hover:border-green/40"
      >
        <span>
          <span className="font-semibold">{t.promoTitle}</span>
          <span className="ml-2 text-muted">{promo.length ? t.promoCount(promo.length) : t.promoEmpty}</span>
        </span>
        <span className="text-green">{t.open}</span>
      </Link>

      {/* ── Заявки на выплату ─────────────────────────────────────────── */}
      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">{t.payoutsTitle}</h2>
      <section className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[820px]">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className={TH}>{t.colWhen}</th>
              <th className={TH}>{t.colWho}</th>
              <th className={TH}>{t.colAmount}</th>
              <th className={TH}>{t.colWhere}</th>
              <th className={TH}>{t.colDecision}</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((p) => (
              <tr key={p.id} className="border-b border-line-soft last:border-0 align-top">
                <td data-label={t.colWhen} className={`${TD} text-xs text-muted`}>{when(p.created_at, locale)}</td>
                <td data-label={t.colWho} className={TD}>
                  {p.partner.name}
                  {p.partner.username ? <span className="ml-2 text-xs text-faint">@{p.partner.username}</span> : null}
                </td>
                <td data-label={t.colAmount} className={`${TD} font-mono`}>
                  {money(p.amount_usd)}
                  {p.project_id ? (
                    <span className="block font-sans text-xs text-faint">
                      {tc.autoPayout(projectName.get(p.project_id) ?? "—")}
                    </span>
                  ) : null}
                </td>
                <td data-label={t.colWhere} className={`${TD} break-all font-mono text-xs text-muted`}>
                  {p.requisites || <span className="font-sans text-gold">{tc.noRequisites}</span>}
                </td>
                <td data-label={t.colDecision} className={TD}>
                  {/* Деньги уходят руками — кошелёк или карта, — и только потом
                      «Выплачено». Отклонение возвращает сумму в доступное. */}
                  <form action={decide} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="payout" value={p.id} />
                    <input name="note" maxLength={300} placeholder={t.notePartnerPh} className={`${SMALL} w-44`} />
                    <button type="submit" name="status" value="paid" className={BUTTON}>
                      {t.markPaid}
                    </button>
                    <button type="submit" name="status" value="rejected" className="text-xs text-faint hover:text-gold">
                      {t.reject}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-muted">
                  {t.noRequests(money(MIN_PAYOUT_USD))}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* ── Агентства ─────────────────────────────────────────────────── */}
      <h2 className="mt-8 flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
        {t.agenciesTitle}
        {pendingAgencies.length ? <span className="text-gold">{t.agenciesWaiting(pendingAgencies.length)}</span> : null}
      </h2>
      <p className="mt-1 max-w-2xl text-xs text-faint">{t.agenciesAbout}</p>
      <section className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[900px]">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className={TH}>{t.colAgency}</th>
              <th className={TH}>{t.colContact}</th>
              <th className={TH}>{t.colPartner}</th>
              <th className={TH}>{t.colStatus}</th>
              <th className={TH}>{t.colDecision}</th>
            </tr>
          </thead>
          <tbody>
            {agencies.map((a) => (
              <tr key={a.id} className="border-b border-line-soft last:border-0 align-top">
                <td data-label={t.colAgency} className={TD}>
                  {a.name}
                  {a.website ? <span className="block text-xs text-faint">{a.website}</span> : null}
                  {a.note ? <span className="block text-xs text-muted">{a.note}</span> : null}
                </td>
                <td data-label={t.colContact} className={`${TD} font-mono text-xs`}>{a.contact ?? "—"}</td>
                <td data-label={t.colPartner} className={TD}>{partnerName.get(a.partner_id) ?? "—"}</td>
                <td data-label={t.colStatus} className={`${TD} text-xs`}>
                  {a.status === "active" && agencyCounts(a) ? (
                    <span className="text-green">
                      {t.agencyActive(a.decided_at ? when(a.decided_at, locale) : "", agencyUntilDay(a.decided_at))}
                    </span>
                  ) : a.status === "active" ? (
                    <span className="text-gold">{t.agencyExpired(agencyUntilDay(a.decided_at))}</span>
                  ) : a.status === "rejected" ? (
                    <span className="text-faint">{t.agencyRejected(a.decision_note ?? "")}</span>
                  ) : (
                    <span className="text-gold">{t.agencyPending(when(a.created_at, locale))}</span>
                  )}
                </td>
                <td data-label={t.colDecision} className={TD}>
                  <form action={decideAgencyAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="agency" value={a.id} />
                    {a.status !== "active" ? (
                      <button type="submit" name="decision" value="active" className={BUTTON}>
                        {t.confirm}
                      </button>
                    ) : !agencyCounts(a) ? (
                      <button type="submit" name="decision" value="active" className={BUTTON}>
                        {t.extend}
                      </button>
                    ) : null}
                    {a.status !== "rejected" ? (
                      <>
                        <input name="note" maxLength={300} placeholder={t.reasonPh} className={`${SMALL} w-44`} />
                        <button type="submit" name="decision" value="rejected" className="text-xs text-faint hover:text-gold">
                          {a.status === "active" ? t.disconnect : t.reject}
                        </button>
                      </>
                    ) : null}
                  </form>
                </td>
              </tr>
            ))}
            {agencies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-muted">
                  {t.noAgencies}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* ── Клиенты, закреплённые вручную ─────────────────────────────── */}
      <PartnerClientsBlock clients={clients} partnerName={partnerName} locale={admin.panel_locale} cancel={cancelClientAction} />

      {/* ── Партнёры ──────────────────────────────────────────────────── */}
      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">{t.allTitle}</h2>
      <section className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[1280px]">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className={TH}>{t.colWho}</th>
              <th className={TH}>{t.colLinks}</th>
              <th className={TH}>{t.colRate}</th>
              <th className={TH}>{t.colClients}</th>
              <th className={TH}>{t.colProjects}</th>
              <th className={TH}>{t.frozen}</th>
              <th className={TH}>{t.earned}</th>
              <th className={TH}>{t.colPaid}</th>
              <th className={TH}>{t.colAvailable}</th>
              <th className={TH}>{t.colEdit}</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map(({ partner, links, balance, leads, projects, paidProjects, accruals }) => (
              <tr key={partner.id} className="border-b border-line-soft last:border-0 align-top">
                <td data-label={t.colWho} className={TD}>
                  {partner.name}
                  {partner.status === "blocked" ? <span className="ml-2 text-xs text-gold">{t.blocked}</span> : null}
                  <span className="block text-xs text-faint">
                    {partner.username ? `@${partner.username}` : partner.telegram_user_id ? `id ${partner.telegram_user_id}` : t.noTelegram}
                    {" · "}
                    {t.since(when(partner.created_at, locale))}
                  </span>
                  {partner.note ? <span className="block text-xs text-muted">{partner.note}</span> : null}
                </td>
                <td data-label={t.colLinks} className={`${TD} text-xs`}>
                  {links.map((l) => (
                    <span key={l.id} className="block">
                      <a
                        href={l.slug ? shortUrl(siteUrl, l.slug) : linkUrl(siteUrl, l.code)}
                        className="font-mono hover:text-green"
                        target="_blank"
                        rel="noreferrer noopener"
                        title={l.slug ? `devuz.studio/r/${l.slug}` : undefined}
                      >
                        {l.code}
                      </a>
                      {l.label && !l.is_default ? <span className="text-faint"> — {l.label}</span> : null}
                      <span className="text-faint"> · {l.clicks} / {l.leads}</span>
                      {l.perk !== "none" ? <span className="text-faint"> · {perkDict[l.perk][locale]}</span> : null}
                    </span>
                  ))}
                </td>
                <td data-label={t.colRate} className={`${TD} text-xs text-muted`}>
                  {partner.percent_override !== null
                    ? `${partner.percent_override} %`
                    : partner.payout_model === "turnover"
                      ? t.turnover
                      : t.profit}
                  <span className="block text-faint">
                    {partner.percent_override !== null
                      ? t.personal
                      : partner.payout_model === "turnover"
                        ? `${PARTNER_TIERS[0].turnover}–${PARTNER_TIERS[PARTNER_TIERS.length - 1].turnover} %`
                        : `${PARTNER_TIERS[0].profit}–${PARTNER_TIERS[PARTNER_TIERS.length - 1].profit} %`}
                    {partner.model_changed_at ? t.modelChanged(when(partner.model_changed_at, locale)) : ""}
                  </span>
                  {partner.accumulate ? (
                    <span className="block text-green">
                      {(() => {
                        const pool = poolAmount(poolProjects(projects, accruals, partner));
                        return tc.accumulating(money(pool), tierPercent(pool, partner.payout_model));
                      })()}
                    </span>
                  ) : null}
                </td>
                <td data-label={t.colClients} className={`${TD} font-mono text-xs`}>{leads}</td>
                <td data-label={t.colProjects} className={`${TD} font-mono text-xs`}>
                  {paidProjects} / {projects.length}
                  <span className="block font-sans text-faint">{t.paidOfAll}</span>
                </td>
                <td data-label={t.frozen} className={`${TD} font-mono text-xs text-muted`}>{money(balance.frozen)}</td>
                <td data-label={t.earned} className={`${TD} font-mono text-xs`}>{money(balance.earned)}</td>
                <td data-label={t.colPaid} className={`${TD} font-mono text-xs text-muted`}>{money(balance.paid)}</td>
                <td data-label={t.colAvailable} className={`${TD} font-mono text-xs ${balance.available > 0 ? "text-green" : ""}`}>
                  {money(balance.available)}
                  {balance.requested ? <span className="block font-sans text-faint">{t.inRequest(money(balance.requested))}</span> : null}
                </td>
                <td data-label={t.colEdit} className={TD}>
                  <form action={editPartner} className="flex flex-col gap-2">
                    <input type="hidden" name="partner" value={partner.id} />
                    <div className="flex items-center gap-2">
                      <input
                        name="percent"
                        inputMode="numeric"
                        placeholder={t.byTierPh}
                        defaultValue={partner.percent_override ?? ""}
                        aria-label={t.personalRate}
                        className={`${SMALL} w-24`}
                      />
                      <span className="text-xs text-faint">%</span>
                      <select name="status" defaultValue={partner.status} className={SMALL}>
                        <option value="active">{t.active}</option>
                        <option value="blocked">{t.blocked}</option>
                      </select>
                    </div>
                    <input name="requisites" maxLength={200} placeholder={t.requisitesPh} defaultValue={partner.requisites ?? ""} className={`${SMALL} w-full`} />
                    <input name="note" maxLength={1000} placeholder={t.noteTermsPh} defaultValue={partner.note ?? ""} className={`${SMALL} w-full`} />
                    <button type="submit" className="self-start text-xs text-faint hover:text-green">
                      {t.save}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {summaries.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-sm text-muted">
                  {t.noPartners}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* ── Завести руками ───────────────────────────────────────────── */}
      <section className="mt-6 max-w-2xl rounded-xl border border-line bg-surface px-5 py-4">
        <p className="text-xs uppercase tracking-wider text-faint">{t.addTitle}</p>
        <p className="mt-1 text-xs text-faint">{t.addAbout}</p>
        <form action={addPartner} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-faint">
            {t.name}
            <input name="name" required maxLength={120} className={`mt-1 ${INPUT}`} />
          </label>
          <label className="block text-xs text-faint">
            {t.code}
            <input name="code" maxLength={24} placeholder="BLOG-IVAN" className={`mt-1 ${INPUT}`} />
          </label>
          <label className="block text-xs text-faint">
            Telegram id
            <input name="telegram_id" inputMode="numeric" placeholder={t.optional} className={`mt-1 ${INPUT}`} />
          </label>
          <label className="block text-xs text-faint">
            {t.note}
            <input name="note" maxLength={1000} placeholder={t.termsPh} className={`mt-1 ${INPUT}`} />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={BUTTON}>
              {t.add}
            </button>
          </div>
        </form>
      </section>

      <div className="mt-8 max-w-2xl space-y-3 text-xs leading-relaxed text-faint">
        <p>
          <span className="text-muted">{t.howTitle}</span> {t.howBody}
        </p>
        <p>
          <span className="text-muted">{t.payoutsHowTitle}</span> {t.payoutsHow(money(MIN_PAYOUT_USD))}{" "}
          <Link href={`/${locale}/partners`} className="text-blue-soft hover:underline">
            /partners
          </Link>
          .
        </p>
      </div>
    </AdminShell>
  );
}

function Card({ label, value, note, warn = false }: { label: string; value: string; note?: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-1 font-mono text-2xl ${warn ? "text-gold" : ""}`}>{value}</p>
      {note ? <p className={`mt-1 text-xs ${warn ? "text-gold" : "text-faint"}`}>{note}</p> : null}
    </div>
  );
}

/** «до 2 500 $ — 10 / 6 %, … дороже 30 000 $ — 30 / 20 %» — из той же таблицы, что считает. */
function tiersLine(locale: PanelLocale): string {
  const t = pick(partnersDict, locale);
  return PARTNER_TIERS.map((tier, i) =>
    tier.upTo === null
      ? t.tierAbove(usd(PARTNER_TIERS[i - 1]?.upTo ?? 0, locale), tier.profit, tier.turnover)
      : t.tierUpTo(usd(tier.upTo, locale), tier.profit, tier.turnover),
  ).join(", ");
}
