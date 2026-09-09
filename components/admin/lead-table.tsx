import Link from "next/link";

import type { LeadRow } from "@/lib/admin/leads";

const GRADE_TONE: Record<string, string> = {
  A: "bg-green/15 text-green",
  B: "bg-blue/15 text-blue-soft",
  C: "bg-gold/15 text-gold",
  D: "bg-line text-faint",
};

const PRIORITY_LABEL: Record<string, string> = {
  hot: "горячий",
  warm: "тёплый",
  nurture: "дозреет",
  archive: "архив",
};

const STATUS_LABEL: Record<string, string> = {
  new: "новый",
  taken: "в работе",
  dropped: "отложен",
  won: "выиграли",
  lost: "проиграли",
};

const BUDGET_LABEL: Record<string, string> = {
  B1: "до 3 тыс.",
  B2: "3–15 тыс.",
  B3: "от 15 тыс.",
};

/**
 * Дата в часовом поясе Ташкента и на сервере, и в браузере.
 *
 * Без явной зоны сервер отрендерил бы UTC, браузер — местное время, и React
 * при гидратации нашёл бы расхождение. Но настоящая причина проще: панелью
 * пользуются из Ташкента, и «поступил в 03:40» вместо «в 08:40» — это не
 * косметика, а неверное представление о том, когда человек написал.
 */
function when(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(new Date(iso));
}

export function LeadTable({ rows }: { rows: LeadRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
        Под фильтр ничего не попало.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[880px] border-collapse text-sm">
        <thead>
          <tr className="bg-surface text-left text-xs uppercase tracking-wider text-faint">
            <th className="px-4 py-3 font-medium">Когда</th>
            <th className="px-4 py-3 font-medium">Заявка</th>
            <th className="px-4 py-3 font-medium">Кто</th>
            <th className="px-4 py-3 font-medium">Ниша</th>
            <th className="px-4 py-3 font-medium">Бюджет</th>
            <th className="px-4 py-3 font-medium">Балл</th>
            <th className="px-4 py-3 font-medium">Приоритет</th>
            <th className="px-4 py-3 font-medium">Статус</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((lead) => (
            <tr
              key={lead.id}
              className="border-t border-line-soft bg-surface/40 transition hover:bg-surface"
            >
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {when(lead.created_at)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="font-mono text-xs text-blue-soft hover:underline"
                >
                  {lead.request_no ?? lead.id.slice(0, 8)}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="block">{lead.contact_name || "—"}</span>
                {lead.company ? (
                  <span className="block text-xs text-faint">{lead.company}</span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-muted">{lead.niche || "—"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {lead.budget ? BUDGET_LABEL[lead.budget] ?? lead.budget : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                    GRADE_TONE[lead.grade] ?? GRADE_TONE.D
                  }`}
                >
                  {lead.grade} · {lead.score}
                </span>
              </td>
              <td className="px-4 py-3 text-muted">
                {PRIORITY_LABEL[lead.priority] ?? lead.priority}
              </td>
              <td className="px-4 py-3 text-muted">
                {STATUS_LABEL[lead.status] ?? lead.status}
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
