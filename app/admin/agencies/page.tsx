import { HelpHint } from "@/components/admin/help-link";
import { AdminShell } from "@/components/admin/shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { agenciesDict } from "@/content/admin-panel/agencies";
import { AGENCY_FINDER_MONTHS, AGENCY_FINDER_PERCENT, money as usd } from "@/lib/admin/finance";
import { requireSection } from "@/lib/admin/guard";
import { helpAnchor } from "@/lib/admin/help";
import { pick } from "@/lib/admin/i18n";
import { loadPeople } from "@/lib/admin/ledger";
import { agencyMoney, type Split } from "@/lib/partners/agency";
import { AGENCY_PERCENT, finderUntil, finderUntilDay, shortUrl } from "@/lib/partners/rules";
import { agencyPartners, agencyProjects, defaultSlugs, PARTNER_DESK } from "@/lib/partners/store";
import { siteUrl } from "@/lib/seo";
import { addAgency, setFinder } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Агентства — партнёры студии (вкладка «Партнёров», всем ролям).
 *
 * Владелец, 05.11.2026: «Надо зафиксировать условия для агентств: 15% с
 * оборота проекта фиксировано. Для наших менеджеров: те кто привел
 * агентство и завел его у нас — они на 12 месяцев получают 5% с оборота
 * этого агентства». До этого агентство могли подключить только партнёры, а
 * менеджеру завести его было негде.
 *
 * Менеджер видит агентства, которые привёл сам, и свои 5%. Владелец и
 * руководитель — все агентства и 15% агентству. Кто привёл, поправляет
 * владелец.
 */

const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";
const SMALL =
  "rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50";
const TH = "px-4 py-3 font-normal";
const TD = "px-4 py-3 align-top";

const RESULTS = {
  created: "resultCreated",
  ok: "resultOk",
  invalid: "resultInvalid",
  duplicate: "resultDuplicate",
  staff: "resultStaff",
  forbidden: "resultForbidden",
  gone: "resultGone",
  offline: "resultOffline",
  failed: "resultFailed",
} as const;

const day = (iso: string) => iso.slice(0, 10).split("-").reverse().join(".");

export default async function AgenciesPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const staff = await requireSection("/admin/agencies");
  const locale = staff.panel_locale;
  const t = pick(agenciesDict, locale);
  const desk = PARTNER_DESK.includes(staff.role);
  const owner = staff.role === "admin";
  const { r } = await searchParams;
  const resultKey = r && Object.hasOwn(RESULTS, r) ? RESULTS[r as keyof typeof RESULTS] : null;
  const good = r === "created" || r === "ok";

  const [agencies, people] = await Promise.all([agencyPartners(desk ? "all" : staff.id), loadPeople()]);
  const ids = agencies.map((a) => a.id);
  const [{ projects, payments }, slugs] = await Promise.all([agencyProjects(ids), defaultSlugs(ids)]);
  const nameOf = (id: string | null) => (id ? (people.find((p) => p.id === id)?.display_name ?? "—") : t.nobody);
  const active = people.filter((p) => p.is_active).sort((a, b) => a.display_name.localeCompare(b.display_name));
  const money = (n: number) => usd(n, locale);
  const split = (s: Split) =>
    s.earned || s.frozen ? (
      <>
        {s.earned ? <span className="block text-green">{t.earned(money(s.earned))}</span> : null}
        {s.frozen ? <span className="block text-gold">{t.frozen(money(s.frozen))}</span> : null}
      </>
    ) : (
      <span className="text-faint">—</span>
    );
  const now = Date.now();

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        {t.intro(AGENCY_PERCENT, AGENCY_FINDER_PERCENT, AGENCY_FINDER_MONTHS)}{" "}
        <HelpHint topic={helpAnchor("/admin/agencies", "terms")} label={t.helpTerms} />
      </p>

      {resultKey ? (
        <p
          data-result={good ? "ok" : "warn"}
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            good ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {t[resultKey]}
        </p>
      ) : null}

      {/* ── Завести агентство ─────────────────────────────────────────── */}
      <section className="mt-6 max-w-2xl rounded-xl border border-line bg-surface px-5 py-4">
        <p className="text-xs uppercase tracking-wider text-faint">{t.addTitle}</p>
        <p className="mt-1 text-xs text-faint">{desk ? t.addAboutDesk : t.addAboutManager}</p>
        <form action={addAgency} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-faint">
            {t.name}
            <input name="name" required minLength={2} maxLength={120} className={`mt-1 ${INPUT}`} />
          </label>
          <label className="block text-xs text-faint">
            {t.contact}
            <input name="contact" required maxLength={120} placeholder="@agency" className={`mt-1 ${INPUT}`} />
          </label>
          <label className="block text-xs text-faint">
            {t.website}
            <input name="website" maxLength={200} placeholder={t.optional} className={`mt-1 ${INPUT}`} />
          </label>
          <label className="block text-xs text-faint">
            {t.note}
            <input name="note" maxLength={1000} placeholder={t.optional} className={`mt-1 ${INPUT}`} />
          </label>
          {desk ? (
            <label className="block text-xs text-faint">
              {t.broughtBy}
              <select name="brought_by" defaultValue={staff.id} className={`mt-1 ${INPUT}`}>
                {active.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name}
                  </option>
                ))}
                <option value="none">{t.nobody}</option>
              </select>
            </label>
          ) : null}
          <div className="sm:col-span-2">
            <SubmitButton base="rounded-lg px-4 py-2 text-sm" pendingLabel={t.adding}>
              {t.add}
            </SubmitButton>
          </div>
        </form>
      </section>

      {/* ── Список ────────────────────────────────────────────────────── */}
      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">{desk ? t.listAll : t.listMine}</h2>
      <section className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs text-faint">
            <tr>
              <th className={TH}>{t.colAgency}</th>
              <th className={TH}>{t.colBrought}</th>
              <th className={TH}>{t.colUntil}</th>
              <th className={TH}>{t.colProjects}</th>
              <th className={TH}>{t.colTurnover}</th>
              <th className={TH}>{t.colFinder}</th>
              {desk ? <th className={TH}>{t.colAgencyShare}</th> : null}
            </tr>
          </thead>
          <tbody>
            {agencies.map((a) => {
              const m = agencyMoney(a, projects, payments);
              const until = finderUntil(a.brought_at);
              const slug = slugs.get(a.id);
              return (
                <tr key={a.id} className="border-b border-line-soft last:border-0">
                  <td data-label={t.colAgency} className={TD}>
                    <span className="font-medium">{a.name}</span>
                    {a.status === "blocked" ? <span className="ml-2 text-xs text-gold">{t.blocked}</span> : null}
                    <span className="block text-xs text-muted">{a.contact ?? "—"}</span>
                    {a.brought_at ? <span className="block text-xs text-faint">{t.since(day(a.brought_at))}</span> : null}
                    {slug ? (
                      <a
                        href={shortUrl(siteUrl, slug)}
                        className="block text-xs text-blue-soft hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.link}: devuz.studio/r/{slug}
                      </a>
                    ) : null}
                  </td>
                  <td data-label={t.colBrought} className={`${TD} text-xs`}>
                    {owner ? (
                      <form action={setFinder} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="agency" value={a.id} />
                        <select name="brought_by" defaultValue={a.brought_by ?? "none"} className={SMALL}>
                          {people
                            .filter((p) => p.is_active || p.id === a.brought_by)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.display_name}
                              </option>
                            ))}
                          <option value="none">{t.nobody}</option>
                        </select>
                        <button type="submit" className="text-xs text-faint hover:text-green">
                          {t.save}
                        </button>
                      </form>
                    ) : (
                      nameOf(a.brought_by)
                    )}
                  </td>
                  <td data-label={t.colUntil} className={`${TD} text-xs`}>
                    {!a.brought_by || !until ? (
                      <span className="text-faint">—</span>
                    ) : until.getTime() > now ? (
                      t.until(finderUntilDay(a.brought_at))
                    ) : (
                      <span className="text-faint">{t.expired(finderUntilDay(a.brought_at))}</span>
                    )}
                  </td>
                  <td data-label={t.colProjects} className={`${TD} text-xs`}>
                    {m.projects}
                    {m.finderProjects && m.finderProjects !== m.projects ? (
                      <span className="block text-faint">{t.inTerm(m.finderProjects)}</span>
                    ) : null}
                  </td>
                  <td data-label={t.colTurnover} className={`${TD} font-mono text-xs`}>{money(m.turnover)}</td>
                  <td data-label={t.colFinder} className={`${TD} font-mono text-xs`}>{split(m.finder)}</td>
                  {desk ? (
                    <td data-label={t.colAgencyShare} className={`${TD} font-mono text-xs`}>{split(m.agency)}</td>
                  ) : null}
                </tr>
              );
            })}
            {agencies.length === 0 ? (
              <tr>
                <td colSpan={desk ? 7 : 6} className="px-4 py-6 text-sm text-muted">
                  {desk ? t.emptyAll : t.emptyMine}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
