import { addLead } from "@/app/admin/actions";
import { HelpHint } from "@/components/admin/help-link";
import { SubmitButton } from "@/components/admin/submit-button";
import { leadAddDict } from "@/content/admin-panel/lead-add";
import { helpAnchor } from "@/lib/admin/help";
import { pick, type PanelLocale } from "@/lib/admin/i18n";

/**
 * «Добавить лид вручную» над списком лидов (lib/admin/lead-add.ts).
 *
 * Свёрнуто: список — главное на странице, форма нужна раз-два в день.
 * Открыта сама, если добавить не вышло, — с причиной над кнопкой. Кому
 * отдать лид, выбирают руководитель и владелец; менеджер добавляет себе.
 */

const INPUT =
  "mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";

const ERROR_KEYS = {
  no_name: "e_no_name",
  no_contact: "e_no_contact",
  assignee: "e_assignee",
  offline: "e_offline",
  failed: "e_failed",
} as const;

export function LeadAdd({
  locale,
  selfId,
  assignees,
  notice,
}: {
  locale: PanelLocale;
  selfId: string;
  /** Кому можно отдать лид. Пусто — менеджер: лид только себе. */
  assignees: readonly { id: string; display_name: string }[];
  /** Код причины из адреса (`?add=`), если добавить не вышло. */
  notice?: string;
}) {
  const t = pick(leadAddDict, locale);
  const error = notice && Object.hasOwn(ERROR_KEYS, notice) ? t[ERROR_KEYS[notice as keyof typeof ERROR_KEYS]] : null;
  const others = assignees.filter((a) => a.id !== selfId);

  return (
    <details id="add-lead" open={Boolean(error)} className="mb-6 max-w-3xl rounded-xl border border-line bg-surface px-4 py-3" data-lead-add>
      <summary className="cursor-pointer text-sm font-medium text-green">{t.open}</summary>
      <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-muted">
        <span>{others.length ? t.leadAssign : t.leadSelf}</span>
        <HelpHint topic={helpAnchor("/admin", "add")} label={t.help} />
      </p>
      <form action={addLead} className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-faint">
          {t.name}
          <input name="name" required maxLength={120} placeholder={t.namePlaceholder} className={INPUT} />
        </label>
        <label className="block text-xs text-faint">
          {t.company} <span className="text-faint/70">· {t.optional}</span>
          <input name="company" maxLength={120} className={INPUT} />
        </label>
        <label className="block text-xs text-faint">
          {t.contact}
          <input name="contact" required maxLength={120} placeholder={t.contactPlaceholder} className={INPUT} />
        </label>
        <label className="block text-xs text-faint">
          {t.from} <span className="text-faint/70">· {t.optional}</span>
          <input name="from" maxLength={200} placeholder={t.fromPlaceholder} className={INPUT} />
        </label>
        <label className="block text-xs text-faint sm:col-span-2">
          {t.need} <span className="text-faint/70">· {t.optional}</span>
          <textarea name="need" rows={3} maxLength={2000} placeholder={t.needPlaceholder} className={INPUT} />
        </label>
        {others.length ? (
          <label className="block text-xs text-faint">
            {t.assignee}
            <select name="assignee" defaultValue={selfId} className={INPUT}>
              <option value={selfId}>{t.assigneeSelf}</option>
              {others.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.display_name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <SubmitButton pendingLabel={t.adding} base="rounded-lg px-4 py-2 text-sm">
            {t.submit}
          </SubmitButton>
          {error ? <span className="text-xs text-gold">{error}</span> : null}
        </div>
      </form>
    </details>
  );
}
