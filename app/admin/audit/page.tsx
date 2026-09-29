import Link from "next/link";

import { auditDict } from "@/content/admin-panel/audit";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { AUDIT_ACTIONS } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import { ACTION_LABEL, SENSITIVE, readJournal, type JournalEntry } from "@/lib/admin/journal";
import { listTeam } from "@/lib/admin/team";

export const dynamic = "force-dynamic";

const PAGE = 100;

const CHIP = "rounded-full border px-3 py-1 text-xs transition";
const CHIP_ON = "border-green/40 bg-green/10 text-green";
const CHIP_OFF = "border-line bg-surface text-muted hover:text-text";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string; action?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  const { actor, action, page: rawPage } = await searchParams;
  const locale = admin.panel_locale;
  const t = pick(auditDict, locale);

  const page = Math.max(Number.parseInt(rawPage ?? "1", 10) || 1, 1);
  const [journal, team] = await Promise.all([
    readJournal({ actor, action, limit: PAGE, offset: (page - 1) * PAGE }),
    listTeam(),
  ]);

  const pages = Math.max(Math.ceil(journal.total / PAGE), 1);
  const href = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = { actor, action, page: String(page), ...patch };
    for (const [key, value] of Object.entries(next)) {
      if (value && !(key === "page" && value === "1")) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/admin/audit?${qs}` : "/admin/audit";
  };

  return (
    <AdminShell staff={admin}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.intro}</p>

      {journal.offline ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm text-gold">
          {t.offline}
        </p>
      ) : null}

      {/* ── Кто ─────────────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-wider text-faint">{t.who}</span>
        <Link href={href({ actor: undefined, page: "1" })} className={`${CHIP} ${!actor ? CHIP_ON : CHIP_OFF}`}>
          {t.everyone}
        </Link>
        {team.map((member) => (
          <Link
            key={member.id}
            href={href({ actor: member.id, page: "1" })}
            className={`${CHIP} ${actor === member.id ? CHIP_ON : CHIP_OFF}`}
          >
            {member.display_name}
            {member.is_active ? "" : " ·"}
          </Link>
        ))}
        {/* Свип напоминаний — тоже актор, только не человек. Без этой кнопки
            его записи неотличимы от «сделал кто-то, и мы не знаем кто». */}
        <Link
          href={href({ actor: "system", page: "1" })}
          className={`${CHIP} ${actor === "system" ? CHIP_ON : CHIP_OFF}`}
        >
          {t.system}
        </Link>
      </div>

      {/* ── Что ─────────────────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-wider text-faint">{t.what}</span>
        <Link href={href({ action: undefined, page: "1" })} className={`${CHIP} ${!action ? CHIP_ON : CHIP_OFF}`}>
          {t.everything}
        </Link>
        {AUDIT_ACTIONS.map((item) => (
          <Link
            key={item}
            href={href({ action: item, page: "1" })}
            className={`${CHIP} ${action === item ? CHIP_ON : CHIP_OFF} ${
              SENSITIVE.has(item) && action !== item ? "border-gold/25 text-gold/80" : ""
            }`}
          >
            {ACTION_LABEL[item][locale]}
          </Link>
        ))}
      </div>

      <p className="mt-4 text-xs text-faint">
        {t.total(journal.total)}
        {pages > 1 ? t.page(page, pages) : ""}
      </p>

      {/* ── Лента ───────────────────────────────────────────────────────── */}
      <section className="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
        {journal.rows.length ? (
          <ul>
            {journal.rows.map((entry) => (
              <Row key={entry.id} entry={entry} t={t} locale={locale} />
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-sm text-muted">
            {journal.offline ? t.emptyOffline : t.emptyFilter}
          </p>
        )}
      </section>

      {pages > 1 ? (
        <div className="mt-4 flex items-center gap-3 text-xs">
          {page > 1 ? (
            <Link href={href({ page: String(page - 1) })} className="text-muted hover:text-green">
              {t.newer}
            </Link>
          ) : null}
          {page < pages ? (
            <Link href={href({ page: String(page + 1) })} className="text-muted hover:text-green">
              {t.older}
            </Link>
          ) : null}
        </div>
      ) : null}
    </AdminShell>
  );
}

function Row({ entry, t, locale }: { entry: JournalEntry; t: Picked<typeof auditDict>; locale: PanelLocale }) {
  const label = Object.hasOwn(ACTION_LABEL, entry.action)
    ? ACTION_LABEL[entry.action as keyof typeof ACTION_LABEL][locale]
    : entry.action;
  const sensitive = SENSITIVE.has(entry.action);
  const details = describe(entry.meta, t);

  return (
    <li
      className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line-soft px-4 py-2.5 last:border-0 ${
        sensitive ? "bg-gold/5" : ""
      }`}
    >
      <span className="w-36 shrink-0 font-mono text-[11px] text-faint">{when(entry.created_at, locale)}</span>
      <span className="text-sm text-text">{entry.actor ?? t.system}</span>
      <span className={`text-sm ${sensitive ? "text-gold" : "text-muted"}`}>{label}</span>

      {entry.target_type === "lead" && entry.target_id ? (
        <Link
          href={`/admin/leads/${entry.target_id}`}
          className="font-mono text-[11px] text-faint underline underline-offset-2 hover:text-green"
        >
          {t.lead(entry.target_id.slice(0, 8))}
        </Link>
      ) : entry.target_id ? (
        <span className="font-mono text-[11px] text-faint">
          {entry.target_type} {entry.target_id.slice(0, 8)}
        </span>
      ) : null}

      {details ? <span className="font-mono text-[11px] text-faint">{details}</span> : null}
      {entry.ip ? <span className="ml-auto font-mono text-[11px] text-faint">{entry.ip}</span> : null}
    </li>
  );
}

/**
 * Короткая расшифровка meta.
 *
 * Показывать сырой JSON в ленте нельзя: он длиннее самой записи и её же
 * заслоняет. Здесь только то, ради чего в meta вообще заглядывают.
 */
function describe(meta: Record<string, unknown>, t: Picked<typeof auditDict>): string {
  const bits: string[] = [];
  if (typeof meta.from === "string" && typeof meta.to === "string") {
    bits.push(`${meta.from} → ${meta.to}`);
  }
  if (meta.via === "telegram") bits.push(t.viaChat);
  if (meta.reactivated === true) bits.push(t.reactivated);
  if (typeof meta.role === "string") bits.push(String(meta.role));
  return bits.join(" · ");
}
