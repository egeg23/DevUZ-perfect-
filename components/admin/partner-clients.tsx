import { HelpHint } from "@/components/admin/help-link";
import { when } from "@/components/admin/lead-table";
import { partnerClientsDict } from "@/content/admin-panel/partner-clients";
import { helpAnchor } from "@/lib/admin/help";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { clientCounts, clientUntilDay } from "@/lib/partners/rules";
import type { PartnerClient } from "@/lib/partners/store";

const SMALL =
  "rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50";
const TH = "px-4 py-3 font-normal";
const TD = "px-4 py-3";

/**
 * «Клиенты, закреплённые партнёрами» в разделе «Партнёры».
 *
 * Партнёр закрепляет компанию в кабинете по ИНН; владелец здесь видит, кто,
 * кого и в каком она сроке, и может отменить с причиной. Как это работает —
 * lib/partners/rules.ts, раздел «Клиенты партнёра».
 */
export function PartnerClientsBlock({
  clients,
  partnerName,
  locale,
  cancel,
  now = new Date(),
}: {
  clients: PartnerClient[];
  partnerName: Map<string, string>;
  locale: PanelLocale;
  cancel: (formData: FormData) => Promise<void>;
  now?: Date;
}) {
  const t = pick(partnerClientsDict, locale);
  return (
    <>
      <h2 id="claims" className="mt-8 flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
        {t.title}
        <HelpHint topic={helpAnchor("/admin/partners", "claims")} />
      </h2>
      <p className="mt-1 max-w-2xl text-xs text-faint">{t.lead}</p>
      <section className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[900px]">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className={TH}>{t.colClient}</th>
              <th className={TH}>{t.colContact}</th>
              <th className={TH}>{t.colPartner}</th>
              <th className={TH}>{t.colStatus}</th>
              <th className={TH}>{t.colAction}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const live = clientCounts(c, now);
              return (
                <tr key={c.id} className="border-b border-line-soft last:border-0 align-top">
                  <td data-label={t.colClient} className={TD}>
                    {c.name}
                    <span className="block font-mono text-xs text-faint">
                      {t.inn} {c.inn ?? "—"}
                    </span>
                    {c.website ? <span className="block text-xs text-faint">{c.website}</span> : null}
                    {c.note ? <span className="block text-xs text-muted">{c.note}</span> : null}
                  </td>
                  <td data-label={t.colContact} className={`${TD} text-xs`}>
                    {[c.contact_name, c.phone, c.telegram].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td data-label={t.colPartner} className={TD}>
                    {partnerName.get(c.partner_id) ?? "—"}
                    <span className="block text-xs text-faint">{t.since(when(c.created_at))}</span>
                  </td>
                  <td data-label={t.colStatus} className={`${TD} text-xs`}>
                    {c.status === "cancelled" ? (
                      <span className="text-faint">{t.cancelled(c.cancel_note ?? "—")}</span>
                    ) : !live ? (
                      <span className="text-faint">{t.expired}</span>
                    ) : c.first_lead_at ? (
                      <span className="text-green">{t.active(clientUntilDay(c))}</span>
                    ) : (
                      <span className="text-gold">{t.waiting(clientUntilDay(c))}</span>
                    )}
                  </td>
                  <td data-label={t.colAction} className={TD}>
                    {c.status !== "cancelled" ? (
                      <form action={cancel} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="client" value={c.id} />
                        <input name="note" required maxLength={300} placeholder={t.cancelNote} className={`${SMALL} w-44`} />
                        <button type="submit" className="text-xs text-faint hover:text-gold">
                          {t.cancel}
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-muted">
                  {t.empty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}
