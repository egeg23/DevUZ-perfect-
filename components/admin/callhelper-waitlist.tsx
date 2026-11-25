import { callhelperDict } from "@/content/admin-panel/callhelper";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import type { WaitRow } from "@/lib/callhelper/waitlist";

const WHEN = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Asia/Tashkent",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const when = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : WHEN.format(d);
};

/**
 * «Лист ожидания» DevUz CallHelper — только владельцу (страница рисует блок
 * при `staff.role === "admin"`). Заявки — lib/callhelper/waitlist.ts.
 */
export function CallHelperWaitlist({ locale, rows }: { locale: PanelLocale; rows: WaitRow[] }) {
  const t = pick(callhelperDict, locale);
  return (
    <section id="wait" className="mt-6 rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{t.waitTitle}</h2>
        <span className="text-xs text-muted">{t.waitCount(rows.length)}</span>
      </div>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted">{t.waitLead}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t.waitEmpty}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="cards-on-phone w-full min-w-0 text-left text-sm sm:min-w-[640px]">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 pr-3 font-medium">{t.waitWhen}</th>
                <th className="py-1 pr-3 font-medium">{t.waitWho}</th>
                <th className="py-1 pr-3 font-medium">{t.waitContact}</th>
                <th className="py-1 pr-3 font-medium">{t.waitOps}</th>
                <th className="py-1 font-medium">{t.waitNote}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.contact + r.first_at} className="border-t border-line align-top">
                  <td data-label={t.waitWhen} className="whitespace-nowrap py-2 pr-3 text-xs text-muted">
                    {when(r.at)}
                    {r.times > 1 ? <span className="block text-gold">{t.waitTimes(r.times)}</span> : null}
                  </td>
                  <td data-label={t.waitWho} className="py-2 pr-3">{[r.name, r.company].filter(Boolean).join(" · ") || "—"}</td>
                  <td data-label={t.waitContact} className="py-2 pr-3 font-mono text-xs">{r.contact}</td>
                  <td data-label={t.waitOps} className="py-2 pr-3">{r.operators || "—"}</td>
                  <td data-label={t.waitNote} className="py-2 text-xs text-muted">{r.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
