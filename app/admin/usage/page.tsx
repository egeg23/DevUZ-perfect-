import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { requireAdmin } from "@/lib/admin/guard";
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

function Tag({ verdict }: { verdict: Verdict }) {
  return (
    <span className={`whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] ${TONE[verdict]}`}>
      {VERDICT_TITLE[verdict]}
    </span>
  );
}

/** «3 из 7» и полоска: доля видна глазом раньше, чем прочитана цифра. */
function Share({ people, eligible }: { people: number; eligible: number }) {
  const pct = eligible > 0 ? Math.round((people / eligible) * 100) : 0;
  return (
    <span className="flex items-center gap-2">
      <span className="font-mono">
        {people}
        <span className="text-faint"> из {eligible}</span>
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

  const unusedSections = report.sections.filter((s) => s.verdict === "unused");
  const unusedFeatures = report.features.filter((f) => f.verdict === "unused");

  return (
    <AdminShell staff={staff}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-lg font-semibold">Чем пользуется команда</h1>
        <nav className="flex gap-3 text-sm">
          {USAGE_PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin/usage?d=${p}`}
              className={p === days ? "text-green" : "text-faint hover:text-text"}
            >
              {p} дней
            </Link>
          ))}
        </nav>
      </div>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        Менеджеры и руководители, без вас. Команда этот отчёт не видит. Стрелки — против
        предыдущих {days} дней.
      </p>

      {report.offline ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          База ответила не полностью — цифры ниже могут быть неполными.
        </p>
      ) : null}

      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-faint">
        {report.since
          ? `Просмотры разделов считаются с ${report.since.split("-").reverse().join(".")}; до этого — «не знаем», а не «ноль».`
          : "Просмотры разделов начнут считаться с первого захода кого-то из команды после выкатки."}{" "}
        Действия — из журнала, он ведётся с первого дня. «Никто — шум?» — это вопрос, а не
        приговор: функцией могут не пользоваться, потому что она не нужна, а могут — потому что
        о ней не знают.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile value={`${report.active} из ${report.team}`} label="заходили или что-то делали" />
        <Tile value={String(report.views)} label="просмотров разделов" />
        <Tile value={String(report.actions)} label="действий в работе" />
        <Tile
          value={String(unusedSections.length + unusedFeatures.length)}
          label="разделов и функций, которыми никто не пользовался"
          tone={unusedSections.length + unusedFeatures.length ? "gold" : "plain"}
        />
      </div>

      {/* ── Разделы ─────────────────────────────────────────────────────── */}
      <section className={`mt-6 ${CARD}`}>
        <p className={H2}>Разделы — что открывают</p>
        <div className="mt-3 overflow-x-auto">
          <table className="cards-on-phone w-full min-w-0 text-left text-sm sm:min-w-[640px]">
            <thead className="text-xs text-faint">
              <tr>
                <th className={TH}>Раздел</th>
                <th className={TH}>Людей</th>
                <th className={TH}>Просмотров</th>
                <th className={TH}>Дней</th>
                <th className={TH}>Динамика</th>
                <th className={TH} />
              </tr>
            </thead>
            <tbody>
              {report.sections.map((s) => (
                <tr key={s.href} className="border-t border-line-soft">
                  <td data-label="Раздел" className={TD}>{s.label}</td>
                  <td data-label="Людей" className={TD}>
                    <Share people={s.people} eligible={s.eligible} />
                  </td>
                  <td data-label="Просмотров" className={`${TD} font-mono`}>{s.views}</td>
                  <td data-label="Дней" className={`${TD} font-mono`}>{s.days}</td>
                  <td data-label="Динамика" className={`${TD} font-mono text-xs`}>
                    <Trend now={s.views} before={s.prevViews} />
                  </td>
                  <td data-label="" className={TD}>
                    <Tag verdict={s.verdict} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Функции ─────────────────────────────────────────────────────── */}
      <section className={`mt-4 ${CARD}`}>
        <p className={H2}>Функции — что нажимают</p>
        <p className="mt-1 text-xs text-muted">
          «Через бота» — сколько раз из этого сделано кнопкой в Telegram, а не в панели.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="cards-on-phone w-full min-w-0 text-left text-sm sm:min-w-[720px]">
            <thead className="text-xs text-faint">
              <tr>
                <th className={TH}>Функция</th>
                <th className={TH}>Людей</th>
                <th className={TH}>Раз</th>
                <th className={TH}>Через бота</th>
                <th className={TH}>Динамика</th>
                <th className={TH}>Последний раз</th>
                <th className={TH} />
              </tr>
            </thead>
            <tbody>
              {report.features.map((f) => (
                <tr key={f.key} className="border-t border-line-soft">
                  <td data-label="Функция" className={TD}>{f.label}</td>
                  <td data-label="Людей" className={TD}>
                    <Share people={f.people} eligible={f.eligible} />
                  </td>
                  <td data-label="Раз" className={`${TD} font-mono`}>{f.count}</td>
                  <td data-label="Через бота" className={`${TD} font-mono text-muted`}>{f.viaBot || "—"}</td>
                  <td data-label="Динамика" className={`${TD} font-mono text-xs`}>
                    <Trend now={f.count} before={f.prevCount} />
                  </td>
                  <td data-label="Последний раз" className={`${TD} text-xs text-faint`}>{f.last ? when(f.last) : "—"}</td>
                  <td data-label="" className={TD}>
                    <Tag verdict={f.verdict} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Люди ────────────────────────────────────────────────────────── */}
      <section className={`mt-4 ${CARD}`}>
        <p className={H2}>Люди — кто чем живёт</p>
        <div className="mt-3 overflow-x-auto">
          <table className="cards-on-phone w-full min-w-0 text-left text-sm sm:min-w-[760px]">
            <thead className="text-xs text-faint">
              <tr>
                <th className={TH}>Кто</th>
                <th className={TH}>Входов</th>
                <th className={TH}>Просмотров</th>
                <th className={TH}>Действий</th>
                <th className={TH}>Активных дней</th>
                <th className={TH}>Чаще всего открывает</th>
                <th className={TH}>Последний раз</th>
              </tr>
            </thead>
            <tbody>
              {report.persons.map((p) => (
                <tr key={p.id} className="border-t border-line-soft">
                  <td data-label="Кто" className={TD}>
                    {p.name}
                    <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint">
                      {ROLE_BADGE[p.role]}
                    </span>
                  </td>
                  <td data-label="Входов" className={`${TD} font-mono`}>{p.logins}</td>
                  <td data-label="Просмотров" className={`${TD} font-mono`}>{p.views}</td>
                  <td data-label="Действий" className={`${TD} font-mono`}>{p.actions}</td>
                  <td data-label="Активных дней" className={`${TD} font-mono`}>
                    {p.activeDays}
                    <span className="text-faint"> из {days}</span>
                  </td>
                  <td data-label="Чаще всего открывает" className={`${TD} text-xs text-muted`}>{p.top.length ? p.top.join(", ") : "—"}</td>
                  <td data-label="Последний раз" className={`${TD} text-xs text-faint`}>{p.lastSeen ? when(p.lastSeen) : "не заходил"}</td>
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
