import { CopyButton } from "@/components/partners/copy-button";
import { Container } from "@/components/ui/container";
import { company } from "@/content/company";
import type { CabinetCopy } from "@/content/partner-cabinet";
import type { Locale } from "@/lib/i18n";
import {
  MIN_PAYOUT_USD,
  PERKS,
  PARTNER_TIERS,
  PAYOUT_MODELS,
  agencyCounts,
  agencyUntilDay,
  canSwitchModel,
  nextModelSwitch,
  TARGETS,
  botLink,
  canWithdrawNow,
  shortUrl,
  withdrawOpens,
} from "@/lib/partners/rules";
import type { Partner, PartnerAgency, PartnerSummary, Referral } from "@/lib/partners/store";
import { siteUrl } from "@/lib/seo";

/**
 * Кабинет партнёра — разметка без чтения базы.
 *
 * Данные собирает страница (app/[locale]/partners/cabinet), здесь только
 * показ: так кабинет можно проверить глазами и тестом на готовых данных,
 * не заводя партнёра в базе. Действия форм приходят снаружи — сам компонент
 * серверный и ни с чем не связан.
 */

export type CabinetActions = {
  createLink: (formData: FormData) => Promise<void>;
  saveRequisites: (formData: FormData) => Promise<void>;
  requestPayout: (formData: FormData) => Promise<void>;
  switchModel: (formData: FormData) => Promise<void>;
  requestAgency: (formData: FormData) => Promise<void>;
};

const CARD = "rounded-xl border border-white/12 bg-white/[0.03] px-5 py-5";
const INPUT =
  "w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm text-text outline-none transition-colors focus:border-green/60";
const BUTTON =
  "rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50";

/** «1 250 $» по-русски и по-узбекски, «$1,250» — по-английски и по-китайски. Как в боте. */
function money(locale: Locale, usd: number): string {
  const n = Math.round(usd);
  return locale === "en" || locale === "zh" ? `$${n.toLocaleString("en-US")}` : `${n.toLocaleString("ru-RU")} $`;
}

function day(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}`;
}


export function CabinetView({
  locale,
  t,
  partner,
  summary,
  referrals,
  agencies,
  activity,
  result,
  now,
  actions,
}: {
  locale: Locale;
  t: CabinetCopy;
  partner: Partner;
  summary: PartnerSummary;
  referrals: Referral[];
  agencies: PartnerAgency[];
  activity: { day: string; clicks: number; leads: number }[];
  result: { ok: boolean; text: string } | null;
  now: Date;
  actions: CabinetActions;
}) {
  const clicks30 = activity.reduce((s, d) => s + d.clicks, 0);
  const signed = referrals.filter((x) => x.stage === "signed" || x.stage === "paid").length;
  const links = [...summary.links].sort((a, b) => Number(b.is_default) - Number(a.is_default));
  const main = links.find((l) => l.is_default) ?? links[0] ?? null;
  const mainUrl = main ? shortUrl(siteUrl, main.slug) : `${siteUrl}/?ref=${partner.code}`;
  const pending = summary.payouts.some((p) => p.status === "requested");
  const open = canWithdrawNow(now);
  const canRequest = open && !pending && summary.balance.available >= MIN_PAYOUT_USD && Boolean(partner.requisites);
  const switchable = canSwitchModel(partner.model_changed_at, now);
  const nextSwitch = nextModelSwitch(partner.model_changed_at, now);


  return (
    <Container className="pb-14 pt-24 sm:pb-20 sm:pt-28">
      <div className="mx-auto max-w-5xl">
        {/* ── Шапка ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-green">{t.title}</p>
            <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{t.hello(partner.name)}</h1>
            <p className="mt-3 text-sm text-muted">
              {partner.percent_override !== null
                ? t.personalRate(partner.percent_override)
                : t.rate(
                    partner.payout_model,
                    PARTNER_TIERS[0][partner.payout_model],
                    PARTNER_TIERS[PARTNER_TIERS.length - 1][partner.payout_model],
                  )}
            </p>
          </div>
          <form action="/api/partners/logout" method="post">
            <input type="hidden" name="l" value={locale} />
            <button type="submit" className="text-sm text-muted transition-colors hover:text-text">
              {t.logout}
            </button>
          </form>
        </div>

        {result ? (
          <p
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              result.ok ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"
            }`}
          >
            {result.text}
          </p>
        ) : null}

        {/* ── Цифры ──────────────────────────────────────────────── */}
        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t.statAvailable} value={money(locale, summary.balance.available)} accent />
          <Stat label={t.statFrozen} value={money(locale, summary.balance.frozen)} />
          <Stat label={t.statEarned} value={money(locale, summary.balance.earned)} />
          <Stat label={t.statPaidOut} value={money(locale, summary.balance.paid)} />
          <Stat label={t.statClicks} value={String(clicks30)} />
          <Stat label={t.statLeads} value={String(summary.leads)} />
          <Stat label={t.statSigned} value={String(signed)} />
          <Stat label={t.statPaid} value={String(summary.paidProjects)} />
        </section>

        {/* ── Модель дохода ──────────────────────────────────────── */}
        {partner.percent_override === null ? (
          <section id="model" className={`mt-6 scroll-mt-28 ${CARD}`}>
            <h2 className="font-display text-lg font-semibold">{t.tiersTitle}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {PAYOUT_MODELS.map((model) => {
                const current = partner.payout_model === model;
                return (
                  <div
                    key={model}
                    className={`rounded-xl border px-4 py-4 ${current ? "border-green/50 bg-green/[0.06]" : "border-white/12"}`}
                  >
                    <p className="flex items-center justify-between gap-3">
                      <span className="font-display text-base font-semibold">{t.modelNames[model]}</span>
                      {current ? (
                        <span className="rounded-full bg-green/15 px-2.5 py-0.5 text-xs text-green">{t.modelCurrent}</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{t.modelHints[model]}</p>
                    <table className="mt-3 w-full text-sm">
                      <thead className="sr-only">
                        <tr>
                          <th>{t.colRange}</th>
                          <th>{t.modelNames[model]}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {PARTNER_TIERS.map((tier, i) => (
                          <tr key={tier.profit}>
                            <td className="py-1.5 text-muted">
                              {tier.upTo === null
                                ? t.tierOver(money(locale, PARTNER_TIERS[i - 1]?.upTo ?? 0))
                                : t.tierUpTo(money(locale, tier.upTo))}
                            </td>
                            <td className={`py-1.5 text-right font-display font-semibold ${current ? "text-green" : "text-text"}`}>
                              {tier[model]} %
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!current && switchable ? (
                      <form action={actions.switchModel} className="mt-3">
                        <input type="hidden" name="l" value={locale} />
                        <input type="hidden" name="model" value={model} />
                        <button type="submit" className="text-sm text-green hover:underline">
                          {t.modelChoose(t.modelNames[model])}
                        </button>
                      </form>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-faint">
              {t.modelFixed} {nextSwitch ? t.modelNext(day(nextSwitch.toISOString())) : null} {t.tiersNote}
            </p>
          </section>
        ) : null}

        {/* ── График ─────────────────────────────────────────────── */}
        <section className={`mt-6 ${CARD}`}>
          <h2 className="font-display text-lg font-semibold">{t.chartTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.chartLead}</p>
          <ActivityChart activity={activity} t={t} />
        </section>

        {/* ── Ссылки ─────────────────────────────────────────────── */}
        <section id="links" className="mt-10 scroll-mt-28">
          <h2 className="font-display text-2xl font-semibold">{t.linksTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.linksLead}</p>

          <div className="mt-5 overflow-x-auto rounded-xl border border-white/12">
            <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[720px]">
              <thead className="border-b border-white/12 text-left text-xs uppercase tracking-wider text-faint">
                <tr>
                  <th className="px-4 py-3 font-normal">{t.colChannel}</th>
                  <th className="px-4 py-3 font-normal">{t.colLink}</th>
                  <th className="px-4 py-3 font-normal">{t.colTarget}</th>
                  <th className="px-4 py-3 text-right font-normal">{t.colClicks}</th>
                  <th className="px-4 py-3 text-right font-normal">{t.colLeads}</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => {
                  const url = shortUrl(siteUrl, link.slug);
                  return (
                    <tr key={link.id} className="border-b border-white/[0.06] last:border-0">
                      <td data-label={t.colChannel} className="px-4 py-3">
                        {link.is_default ? t.mainLink : (link.label ?? link.code)}
                        {link.perk !== "none" ? (
                          <span className="mt-0.5 block text-xs text-green">{t.perks[link.perk]}</span>
                        ) : null}
                      </td>
                      <td data-label={t.colLink} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <code id={`l-${link.id}`} className="font-mono text-xs text-text">
                            {url.replace(/^https?:\/\//, "")}
                          </code>
                          <CopyButton text={url} label={t.copy} done={t.copied} targetId={`l-${link.id}`} />
                        </div>
                      </td>
                      <td data-label={t.colTarget} className="px-4 py-3 text-muted">
                        {t.targets[link.target] ?? link.target}
                      </td>
                      <td data-label={t.colClicks} className="px-4 py-3 tabular-nums sm:text-right">
                        {link.clicks}
                      </td>
                      <td data-label={t.colLeads} className="px-4 py-3 tabular-nums sm:text-right">
                        {link.leads}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{t.botLinkTitle}:</span>
            <code id="bot-link" className="font-mono text-xs text-text">
              {botLink(company.telegram, partner.code).replace(/^https?:\/\//, "")}
            </code>
            <CopyButton text={botLink(company.telegram, partner.code)} label={t.copy} done={t.copied} targetId="bot-link" />
          </div>

          <form action={actions.createLink} className={`mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${CARD}`}>
            <input type="hidden" name="l" value={locale} />
            <p className="font-display text-lg font-semibold sm:col-span-2 lg:col-span-4">{t.newLink}</p>
            <label className="flex flex-col gap-1.5 text-sm">
              {t.fieldLabel}
              <input name="label" maxLength={80} required placeholder={t.fieldLabelHint} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              {t.fieldTarget}
              <select name="target" defaultValue="/" className={INPUT}>
                {TARGETS.map((target) => (
                  <option key={target} value={target}>
                    {t.targets[target]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              {t.fieldPerk}
              <select name="perk" defaultValue="none" className={INPUT}>
                {PERKS.map((perk) => (
                  <option key={perk} value={perk}>
                    {t.perks[perk]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              {t.fieldCode}
              <input name="code" maxLength={24} placeholder={t.fieldCodeHint} className={INPUT} />
            </label>
            <div className="sm:col-span-2 lg:col-span-4">
              <button type="submit" className={BUTTON}>
                {t.createLink}
              </button>
            </div>
          </form>
        </section>

        {/* ── Клиенты ────────────────────────────────────────────── */}
        <section id="clients" className="mt-12 scroll-mt-28">
          <h2 className="font-display text-2xl font-semibold">{t.clientsTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.clientsLead}</p>
          {referrals.length ? (
            <div className="mt-5 overflow-x-auto rounded-xl border border-white/12">
              <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[720px]">
                <thead className="border-b border-white/12 text-left text-xs uppercase tracking-wider text-faint">
                  <tr>
                    <th className="px-4 py-3 font-normal">{t.colDate}</th>
                    <th className="px-4 py-3 font-normal">{t.colClient}</th>
                    <th className="px-4 py-3 font-normal">{t.colFrom}</th>
                    <th className="px-4 py-3 font-normal">{t.colStage}</th>
                    <th className="px-4 py-3 text-right font-normal">{t.colShare}</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((x) => (
                    <ReferralRow key={x.leadId} x={x} t={t} locale={locale} mainLabel={t.mainLink} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={`mt-5 text-sm text-muted ${CARD}`}>{t.clientsEmpty}</p>
          )}
        </section>

        {/* ── Выплата ────────────────────────────────────────────── */}
        <section id="payout" className="mt-12 grid scroll-mt-28 gap-4 lg:grid-cols-2">
          <div className={CARD}>
            <h2 className="font-display text-2xl font-semibold">{t.payoutTitle}</h2>
            <p className="mt-3 font-display text-3xl font-semibold text-green">
              {money(locale, summary.balance.available)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.payoutRules(money(locale, MIN_PAYOUT_USD))}</p>
            {!open ? <p className="mt-2 text-sm text-gold">{t.payoutOpens(withdrawOpens(now))}</p> : null}

            <form action={actions.saveRequisites} className="mt-5 flex flex-col gap-2">
              <input type="hidden" name="l" value={locale} />
              <label className="flex flex-col gap-1.5 text-sm">
                {t.requisites}
                <input
                  name="requisites"
                  defaultValue={partner.requisites ?? ""}
                  maxLength={200}
                  required
                  placeholder={t.requisitesHint}
                  className={INPUT}
                />
              </label>
              <button type="submit" className="self-start text-sm text-green hover:underline">
                {t.saveRequisites}
              </button>
            </form>

            <form action={actions.requestPayout} className="mt-5">
              <input type="hidden" name="l" value={locale} />
              <button type="submit" disabled={!canRequest} className={BUTTON}>
                {t.requestPayout(money(locale, summary.balance.available))}
              </button>
            </form>
          </div>

          <div className={CARD}>
            <h3 className="font-display text-lg font-semibold">{t.historyTitle}</h3>
            {summary.payouts.length ? (
              <ul className="mt-3 flex flex-col divide-y divide-white/[0.06] text-sm">
                {summary.payouts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-muted">{day(p.created_at)}</span>
                    <span className="tabular-nums">{money(locale, p.amount_usd)}</span>
                    <span className={p.status === "paid" ? "text-green" : p.status === "rejected" ? "text-gold" : "text-muted"}>
                      {t.payoutStatus[p.status]}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">—</p>
            )}
          </div>
        </section>

        {/* ── Агентства ──────────────────────────────────────────── */}
        <section id="agencies" className="mt-12 scroll-mt-28">
          <h2 className="font-display text-2xl font-semibold">{t.agenciesTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.agenciesLead}</p>
          {agencies.length ? (
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {agencies.map((a) => (
                <li key={a.id} className={`${CARD} py-4`}>
                  <p className="font-medium">{a.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">{a.contact}</p>
                  {a.status === "active" && !agencyCounts(a, now) ? (
                    <p className="mt-2 text-xs text-faint">{t.agencyExpired(agencyUntilDay(a.decided_at))}</p>
                  ) : (
                    <p
                      className={`mt-2 text-xs ${
                        a.status === "active" ? "text-green" : a.status === "rejected" ? "text-faint" : "text-gold"
                      }`}
                    >
                      {t.agencyStatus[a.status]}
                      {a.status === "active" ? ` · ${t.agencyUntil(agencyUntilDay(a.decided_at))}` : ""}
                      {a.status === "rejected" && a.decision_note ? ` · ${a.decision_note}` : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-faint">{t.agenciesEmpty}</p>
          )}
          <form action={actions.requestAgency} className={`mt-4 grid gap-4 sm:grid-cols-2 ${CARD}`}>
            <input type="hidden" name="l" value={locale} />
            <label className="flex flex-col gap-1.5 text-sm">
              {t.agencyName}
              <input name="name" required maxLength={120} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              {t.agencyContact}
              <input name="contact" required maxLength={120} placeholder={t.agencyContactHint} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              {t.agencyWebsite}
              <input name="website" maxLength={200} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              {t.agencyNote}
              <input name="note" maxLength={500} className={INPUT} />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className={BUTTON}>
                {t.agencyAdd}
              </button>
            </div>
          </form>
        </section>

        {/* ── Презентации ────────────────────────────────────────── */}
        <section id="decks" className="mt-12 scroll-mt-28">
          <h2 className="font-display text-2xl font-semibold">{t.decksTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.decksLead}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(["studio", "program"] as const).map((deck) => {
              const url = `${siteUrl}/${locale}/partners/deck/${deck}?ref=${partner.code}`;
              return (
                <div key={deck} className={`flex flex-col ${CARD}`}>
                  <p className="font-display text-lg font-semibold">{t.decks[deck].title}</p>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{t.decks[deck].text}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <a href={`/${locale}/partners/deck/${deck}?ref=${partner.code}`} className={BUTTON}>
                      {t.deckOpen}
                    </a>
                    <span id={`deck-${deck}`} className="sr-only">
                      {url}
                    </span>
                    <CopyButton text={url} label={t.deckCopy} done={t.copied} targetId={`deck-${deck}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Готовые тексты ─────────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">{t.promoTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.promoLead}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {t.promo.map((item, index) => {
              const text = item.text(mainUrl);
              return (
                <div key={item.title} className={`flex flex-col ${CARD}`}>
                  <p className="text-xs uppercase tracking-wider text-faint">{item.title}</p>
                  <p id={`promo-${index}`} className="mt-2 flex-1 text-sm leading-relaxed">
                    {text}
                  </p>
                  <div className="mt-4">
                    <CopyButton text={text} label={t.copy} done={t.copied} targetId={`promo-${index}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Как это работает ───────────────────────────────────── */}
        <section className={`mt-12 ${CARD}`}>
          <h2 className="font-display text-lg font-semibold">{t.howTitle}</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {t.how.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm leading-relaxed text-muted">
                <span className="font-mono text-green">0{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm text-muted">
            {t.botNote(company.telegram)}{" "}
            <a href={company.telegramUrl} className="text-green hover:underline">
              {company.telegramUrl.replace("https://", "")}
            </a>
          </p>
        </section>
      </div>
    </Container>
  );
}

export function resultText(t: CabinetCopy, code: string): { ok: boolean; text: string } | null {
  if (code.startsWith("link_")) {
    const key = code.slice(5) as keyof CabinetCopy["linkResult"];
    return t.linkResult[key] ? { ok: key === "ok", text: t.linkResult[key] } : null;
  }
  if (code.startsWith("pay_")) {
    const key = code.slice(4) as keyof CabinetCopy["payoutResult"];
    return t.payoutResult[key] ? { ok: key === "ok" || key === "saved", text: t.payoutResult[key] } : null;
  }
  if (code.startsWith("model_")) {
    const key = code.slice(6) as keyof CabinetCopy["modelResult"];
    return t.modelResult[key] ? { ok: key === "ok", text: t.modelResult[key] } : null;
  }
  if (code.startsWith("agency_")) {
    const key = code.slice(7) as keyof CabinetCopy["agencyResult"];
    return t.agencyResult[key] ? { ok: key === "ok", text: t.agencyResult[key] } : null;
  }
  return null;
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-4 ${accent ? "border-green/40 bg-green/[0.06]" : "border-white/12 bg-white/[0.03]"}`}>
      <p className="text-xs leading-snug text-muted">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold tabular-nums ${accent ? "text-green" : "text-text"}`}>{value}</p>
    </div>
  );
}

function ReferralRow({ x, t, locale, mainLabel }: { x: Referral; t: CabinetCopy; locale: Locale; mainLabel: string }) {
  const reason = x.voidReason as keyof CabinetCopy["voidReasons"] | null;
  let share = "—";
  if (reason) share = t.notCounted(t.voidReasons[reason] ?? reason);
  else if (x.accrual && x.accrual.amount_usd > 0) {
    const amount = money(locale, x.accrual.amount_usd);
    share = x.accrual.state === "earned" ? t.shareEarned(amount) : x.accrual.state === "frozen" ? t.shareFrozen(amount) : "—";
  }
  const stageTone =
    x.stage === "paid" ? "text-green" : x.stage === "signed" ? "text-text" : x.stage === "lost" ? "text-faint" : "text-muted";
  return (
    <tr className="border-b border-white/[0.06] last:border-0">
      <td data-label={t.colDate} className="px-4 py-3 text-muted tabular-nums">
        {day(x.createdAt)}
      </td>
      <td data-label={t.colClient} className="px-4 py-3">
        {x.who ?? t.unnamed}
      </td>
      <td data-label={t.colFrom} className="px-4 py-3 text-muted">
        {x.agencyName ? t.viaAgency(x.agencyName) : (x.linkLabel ?? mainLabel)}
      </td>
      <td data-label={t.colStage} className={`px-4 py-3 ${stageTone}`}>
        {t.stages[x.stage]}
      </td>
      <td data-label={t.colShare} className={`px-4 py-3 sm:text-right ${reason ? "text-faint" : ""}`}>
        {share}
      </td>
    </tr>
  );
}

/**
 * Переходы по дням — столбики, заявки — точка под днём.
 *
 * Один ряд данных, одна ось: переходы и заявки различаются в десятки раз, и
 * на общей шкале заявки легли бы в ноль. Поэтому заявка — отметка, а не
 * второй столбик. Подсказка при наведении — `<title>` у каждого дня, с
 * числами; таблица чисел — в подписи для экранного диктора.
 */
function ActivityChart({ activity, t }: { activity: { day: string; clicks: number; leads: number }[]; t: CabinetCopy }) {
  const max = Math.max(1, ...activity.map((d) => d.clicks));
  const total = activity.reduce((s, d) => s + d.clicks, 0);
  const spoken = activity.filter((d) => d.clicks || d.leads).map((d) => t.chartTip(day(d.day), d.clicks, d.leads));

  // Колонки — обычная разметка, а не SVG: ширина экрана меняется от
  // телефона до монитора, и растянутый SVG превращал бы точки в овалы.
  return (
    <figure className="mt-5" role="img" aria-label={`${t.chartTitle}: ${total}. ${spoken.join("; ")}`}>
      <div className="flex h-40 items-end gap-[2px] border-b border-white/15" aria-hidden>
        {activity.map((d) => (
          <div
            key={d.day}
            title={t.chartTip(day(d.day), d.clicks, d.leads)}
            className="group flex h-full flex-1 items-end"
          >
            <div
              className="w-full rounded-t-[4px] bg-green/80 transition-colors group-hover:bg-green"
              style={{ height: d.clicks ? `${Math.max(3, (d.clicks / max) * 100)}%` : "0" }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex h-2 gap-[2px]" aria-hidden>
        {activity.map((d) => (
          <div key={d.day} className="flex flex-1 justify-center">
            {d.leads ? <span className="size-2 rounded-full bg-gold" title={t.chartTip(day(d.day), d.clicks, d.leads)} /> : null}
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex items-center justify-between gap-3 text-xs text-faint">
        <span>{day(activity[0]?.day ?? "")}</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-gold" aria-hidden /> {t.chartLeadMark} · max {max}
        </span>
        <span>{day(activity[activity.length - 1]?.day ?? "")}</span>
      </figcaption>
    </figure>
  );
}
