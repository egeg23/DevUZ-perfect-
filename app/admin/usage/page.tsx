import Link from "next/link";

import { usageDict } from "@/content/admin-panel/usage";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { requireAdmin } from "@/lib/admin/guard";
import { pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import { ROLE_BADGE } from "@/lib/admin/roles";
import { USAGE_PERIODS, VERDICT_TITLE, periodOf, type Verdict } from "@/lib/admin/usage";
import { loadUsage } from "@/lib/admin/usage-store";

export const dynamic = "force-dynamic";

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";
const H2 = "text-xs uppercase tracking-wider text-faint";
const TH = "py-2 pr-4 font-normal";
const TD = "py-2 pr-4";

const TONE: Record<Verdict, string> = {
  core: "border-green/30 bg-green/10 text-green",
  some: "border-line bg-surface-2 text-muted",
  unused: "border-gold/30 bg-gold/10 text-gold",
};

type T = Picked<typeof usageDict>;

function Tag({ verdict, locale }: { verdict: Verdict; locale: PanelLocale }) {
  return (
    <span className={`whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] ${TONE[verdict]}`}>
      {VERDICT_TITLE[verdict][locale]}
    </span>
  );
}

/** «3 из 7» и полоска: доля видна глазом раньше, чем прочитана цифра. */
function Share({ people, eligible, t }: { people: number; eligible: number; t: T }) {
  const pct = eligible > 0 ? Math.round((people / eligible) * 100) : 0;
  return (
    <span className="flex items-center gap-2">
      <span className="font-mono">
        {people}
        <span className="text-faint">{t.ofTail(eligible)}</span>
      </span>
      <span className="hidden h-1.5 w-16 overflow-hidden rounded bg-surface-2 sm:block">
        <span className="block h-full bg-green/60" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

function Trend({ now, before }: { now: number; before: number }) {
  if (now === before) return <span className="text-faint">=</span>;
  return now > before ? (
    <span className="text-green">↑{now - before}</span>
  ) : (
    <span className="text-gold">↓{before - now}</span>
  );
}

/**
 * Использование панели — только владельцу.
 *
 * Тихий кастдев: команда об этом отчёте не знает и вести себя «для
 * отчёта» не может. Отсюда и правило в меню — ADMIN_ONLY, — и проверка здесь:
 * меню закрывает пункт, страница закрывает саму себя.
 */
export default async function UsagePage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const staff = await requireAdmin();
  const { d } = await searchParams;
  const days = periodOf(d);
  const report = await loadUsage(days);
  const locale = staff.panel_locale;
  const t = pick(usageDict, locale);

  const unusedSections = report.sections.filter((s) => s.verdict === "unused");
  const unusedFeatures = report.features.filter((f) => f.verdict === "unused");

  return (
    <AdminShell staff={staff}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-lg font-semibold">{t.title}</h1>
        <nav className="flex gap-3 text-sm">
          {USAGE_PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin/usage?d=${p}`}
              className={p === days ? "text-green" : "text-faint hover:text-text"}
            >
              {t.days(p)}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mt-1 max-w-3xl text-sm text-muted">{t.intro(days)}</p>

      {report.offline ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          {t.offline}
        </p>
      ) : null}

      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-faint">
        {report.since ? t.since(report.since.split("-").reverse().join(".")) : t.sinceNone}{" "}
        {t.legend(VERDICT_TITLE.unused[locale])}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile value={t.of(report.active, report.team)} label={t.tileActive} />
        <Tile value={String(report.views)} label={t.tileViews} />
        <Tile value={String(report.actions)} label={t.tileActions} />
        <Tile
          value={String(unusedSections.length + unusedFeatures.length)}
          label={t.tileUnused}
          tone={unusedSections.length + unusedFeatures.length ? "gold" : "plain"}
        />
      </div>

      {/* ── Разделы ─────────────────────────────────────────────────────── */}
      <section className={`mt-6 ${CARD}`}>
        <p className={H2}>{t.sectionsTitle}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="cards-on-phone w-full min-w-0 text-left text-sm sm:min-w-[640px]">
            <thead className="text-xs text-faint">
              <tr>
                <th className={TH}>{t.colSection}</th>
                <th className={TH}>{t.colPeople}</th>
                <th className={TH}>{t.colViews}</th>
                <th className={TH}>{t.colDays}</th>
                <th className={TH}>{t.colTrend}</th>
                <th className={TH} />
              </tr>
            </thead>
            <tbody>
              {report.sections.map((s) => (
                <tr key={s.href} className="border-t border-line-soft">
                  <td data-label={t.colSection} className={TD}>{s.label[locale]}</td>
                  <td data-label={t.colPeople} className={TD}>
                    <Share people={s.people} eligible={s.eligible} t={t} />
                  </td>
                  <td data-label={t.colViews} className={`${TD} font-mono`}>{s.views}</td>
                  <td data-label={t.colDays} className={`${TD} font-mono`}>{s.days}</td>
                  <td data-label={t.colTrend} className={`${TD} font-mono text-xs`}>
                    <Trend now={s.views} before={s.prevViews} />
                  </td>
                  <td data-label="" className={TD}>
                    <Tag verdict={s.verdict} locale={locale} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Функции ─────────────────────────────────────────────────────── */}
      <section className={`mt-4 ${CARD}`}>
        <p className={H2}>{t.featuresTitle}</p>
        <p className="mt-1 text-xs text-muted">{t.featuresNote}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="cards-on-phone w-full min-w-0 text-left text-sm sm:min-w-[720px]">
            <thead className="text-xs text-faint">
              <tr>
                <th className={TH}>{t.colFeature}</th>
                <th className={TH}>{t.colPeople}</th>
                <th className={TH}>{t.colCount}</th>
                <th className={TH}>{t.colViaBot}</th>
                <th className={TH}>{t.colTrend}</th>
                <th className={TH}>{t.colLast}</th>
                <th className={TH} />
              </tr>
            </thead>
            <tbody>
              {report.features.map((f) => (
                <tr key={f.key} className="border-t border-line-soft">
                  <td data-label={t.colFeature} className={TD}>{f.label[locale]}</td>
                  <td data-label={t.colPeople} className={TD}>
                    <Share people={f.people} eligible={f.eligible} t={t} />
                  </td>
                  <td data-label={t.colCount} className={`${TD} font-mono`}>{f.count}</td>
                  <td data-label={t.colViaBot} className={`${TD} font-mono text-muted`}>{f.viaBot || "—"}</td>
                  <td data-label={t.colTrend} className={`${TD} font-mono text-xs`}>
                    <Trend now={f.count} before={f.prevCount} />
                  </td>
                  <td data-label={t.colLast} className={`${TD} text-xs text-faint`}>{f.last ? when(f.last, locale) : "—"}</td>
                  <td data-label="" className={TD}>
                    <Tag verdict={f.verdict} locale={locale} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Люди ────────────────────────────────────────────────────────── */}
      <section className={`mt-4 ${CARD}`}>
        <p className={H2}>{t.peopleTitle}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="cards-on-phone w-full min-w-0 text-left text-sm sm:min-w-[760px]">
            <thead className="text-xs text-faint">
              <tr>
                <th className={TH}>{t.colWho}</th>
                <th className={TH}>{t.colLogins}</th>
                <th className={TH}>{t.colViews}</th>
                <th className={TH}>{t.colActions}</th>
                <th className={TH}>{t.colActiveDays}</th>
                <th className={TH}>{t.colTop}</th>
                <th className={TH}>{t.colLast}</th>
              </tr>
            </thead>
            <tbody>
              {report.persons.map((p) => (
                <tr key={p.id} className="border-t border-line-soft">
                  <td data-label={t.colWho} className={TD}>
                    {p.name}
                    <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint">
                      {ROLE_BADGE[p.role][staff.panel_locale]}
                    </span>
                  </td>
                  <td data-label={t.colLogins} className={`${TD} font-mono`}>{p.logins}</td>
                  <td data-label={t.colViews} className={`${TD} font-mono`}>{p.views}</td>
                  <td data-label={t.colActions} className={`${TD} font-mono`}>{p.actions}</td>
                  <td data-label={t.colActiveDays} className={`${TD} font-mono`}>
                    {p.activeDays}
                    <span className="text-faint">{t.ofTail(days)}</span>
                  </td>
                  <td data-label={t.colTop} className={`${TD} text-xs text-muted`}>{p.top.length ? p.top.map((l) => l[locale]).join(", ") : "—"}</td>
                  <td data-label={t.colLast} className={`${TD} text-xs text-faint`}>{p.lastSeen ? when(p.lastSeen, locale) : t.neverSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}

function Tile({ value, label, tone = "plain" }: { value: string; label: string; tone?: "plain" | "gold" }) {
  return (
    <div className={CARD}>
      <p className={`font-mono text-2xl ${tone === "gold" ? "text-gold" : ""}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
