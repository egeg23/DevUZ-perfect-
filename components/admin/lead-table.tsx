import Link from "next/link";

import { budgetDict, homeDict, priorityDict, statusDict } from "@/content/admin-panel/home";
import { partnerClientsDict } from "@/content/admin-panel/partner-clients";
import { PANEL_INTL, pick, type PanelLocale, type Tr } from "@/lib/admin/i18n";
import type { LeadRow } from "@/lib/admin/leads";

const GRADE_TONE: Record<string, string> = {
  A: "bg-green/15 text-green",
  B: "bg-blue/15 text-blue-soft",
  C: "bg-gold/15 text-gold",
  D: "bg-line text-faint",
};

/**
 * Подписи по-русски — для страниц, которые ещё не переведены на язык
 * панели. Слова — в словаре (content/admin-panel/home.ts): приоритет,
 * статус и бюджет — `priorityDict`, `statusDict`, `budgetDict`.
 *
 * Бюджет — не сумма, а то, как клиент говорит о деньгах: почему — у
 * `budgetDict`.
 */
const ruLabels = (dict: Record<string, Tr<string>>): Record<string, string> =>
  Object.fromEntries(Object.entries(dict).map(([key, value]) => [key, value.ru]));

const PRIORITY_LABEL: Record<string, string> = ruLabels(priorityDict);
const STATUS_LABEL: Record<string, string> = ruLabels(statusDict);
const BUDGET_LABEL: Record<string, string> = ruLabels(budgetDict);

/** Подпись из словаря по ключу из базы; незнакомый ключ — как есть. */
function label(dict: Record<string, Tr<string>>, key: string, locale: PanelLocale): string {
  return dict[key]?.[locale] ?? key;
}

/**
 * Дата в часовом поясе Ташкента и на сервере, и в браузере.
 *
 * Без явной зоны сервер отрендерил бы UTC, браузер — местное время, и React
 * при гидратации нашёл бы расхождение. Но настоящая причина проще: панелью
 * пользуются из Ташкента, и «поступил в 03:40» вместо «в 08:40» — это не
 * косметика, а неверное представление о том, когда человек написал.
 */
function when(iso: string, locale: PanelLocale = "ru"): string {
  return new Intl.DateTimeFormat(PANEL_INTL[locale], {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(new Date(iso));
}

export function LeadTable({ rows, locale }: { rows: LeadRow[]; locale: PanelLocale }) {
  const t = pick(homeDict, locale);
  const tp = pick(partnerClientsDict, locale);
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
        {t.tableEmpty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="cards-on-phone w-full min-w-0 border-collapse text-sm sm:min-w-[880px]">
        <thead>
          <tr className="bg-surface text-left text-xs uppercase tracking-wider text-faint">
            <th className="px-4 py-3 font-medium">{t.colWhen}</th>
            <th className="px-4 py-3 font-medium">{t.colRequest}</th>
            <th className="px-4 py-3 font-medium">{t.colWho}</th>
            <th className="px-4 py-3 font-medium">{t.colNiche}</th>
            <th className="px-4 py-3 font-medium">{t.colBudget}</th>
            <th className="px-4 py-3 font-medium">{t.colScore}</th>
            <th className="px-4 py-3 font-medium">{t.colPriority}</th>
            <th className="px-4 py-3 font-medium">{t.colStatus}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((lead) => (
            <tr
              key={lead.id}
              // Лид от партнёра — приоритет: выделен цветом, а ничей ещё и
              // стоит первым (сортировка — lib/admin/leads.ts, partner_pin).
              className={`border-t border-line-soft transition ${
                lead.source === "partner"
                  ? lead.partner_pin
                    ? "border-l-4 border-l-gold bg-gold/[0.10] hover:bg-gold/[0.16]"
                    : "border-l-4 border-l-gold/40 bg-gold/[0.04] hover:bg-surface"
                  : "bg-surface/40 hover:bg-surface"
              }`}
            >
              <td data-label={t.colWhen} className="whitespace-nowrap px-4 py-3 text-muted">
                {when(lead.created_at, locale)}
              </td>
              <td data-label={t.colRequest} className="px-4 py-3">
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="font-mono text-xs text-blue-soft hover:underline"
                >
                  {lead.request_no ?? lead.id.slice(0, 8)}
                </Link>
              </td>
              <td data-label={t.colWho} className="px-4 py-3">
                <span className="block">{lead.contact_name || "—"}</span>
                {lead.company ? (
                  <span className="block text-xs text-faint">{lead.company}</span>
                ) : null}
                {lead.source === "partner" ? (
                  <span className="mt-1 inline-block rounded bg-gold/15 px-1.5 py-0.5 text-xs text-gold">
                    {lead.partner_pin ? `${tp.leadChip} · ${tp.leadChipFree}` : tp.leadChip}
                  </span>
                ) : null}
              </td>
              <td data-label={t.colNiche} className="px-4 py-3 text-muted">{lead.niche || "—"}</td>
              <td data-label={t.colBudget} className="whitespace-nowrap px-4 py-3 text-muted">
                {lead.budget ? label(budgetDict, lead.budget, locale) : "—"}
              </td>
              <td data-label={t.colScore} className="whitespace-nowrap px-4 py-3">
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                    GRADE_TONE[lead.grade] ?? GRADE_TONE.D
                  }`}
                >
                  {lead.grade} · {lead.score}
                </span>
              </td>
              <td data-label={t.colPriority} className="px-4 py-3 text-muted">
                {label(priorityDict, lead.priority, locale)}
              </td>
              <td data-label={t.colStatus} className="px-4 py-3 text-muted">
                {label(statusDict, lead.status, locale)}
                {lead.assigned_to ? (
                  <span className="block text-xs text-faint">{lead.assigned_to}</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { PRIORITY_LABEL, STATUS_LABEL, BUDGET_LABEL, when };
