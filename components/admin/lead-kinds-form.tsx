import { leadKindsDict } from "@/content/admin-panel/lead-kinds";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { LEAD_KINDS, LEAD_KIND_TITLE, leadOffCount, wantsLead } from "@/lib/admin/lead-kinds";

const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";

/**
 * Галочки «Какие лиды присылать» (lib/admin/lead-kinds.ts). Одна форма на
 * «Настройки» (себе) и «Команду» (за человека): действие — своё у страницы.
 */
export function LeadKindsForm({
  staffId,
  off,
  locale,
  action,
}: {
  staffId: string;
  off: readonly string[] | null;
  locale: PanelLocale;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="mt-2">
      <input type="hidden" name="staff" value={staffId} />
      <ul className="flex flex-col gap-2">
        {LEAD_KINDS.map((kind) => (
          <li key={kind}>
            <label className="flex cursor-pointer items-start gap-2 text-xs">
              <input
                type="checkbox"
                name="on"
                value={kind}
                defaultChecked={wantsLead(off, kind)}
                className="mt-0.5 accent-green"
              />
              <span>
                <span className="text-text">{LEAD_KIND_TITLE[kind].title[locale]}</span>
                <span className="block leading-snug text-faint">{LEAD_KIND_TITLE[kind].note[locale]}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <button type="submit" className={`${BUTTON} mt-3`}>
        {pick(leadKindsDict, locale).save}
      </button>
    </form>
  );
}

/** «Лиды · все виды» / «Лиды · 4 из 6 видов» — строкой у человека. */
export function leadKindsSummary(off: readonly string[] | null | undefined, locale: PanelLocale): string {
  const t = pick(leadKindsDict, locale);
  const muted = leadOffCount(off);
  return muted ? t.summarySome(LEAD_KINDS.length - muted, LEAD_KINDS.length) : t.summaryAll;
}
