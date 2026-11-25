import { recheckSttKey, saveSttKey } from "@/app/admin/callhelper/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { callhelperDict } from "@/content/admin-panel/callhelper";
import { pick, type PanelLocale } from "@/lib/admin/i18n";

const FIELD = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-text focus:border-green/60 focus:outline-none";

/**
 * «Ключ распознавания речи» в разделе DevUz CallHelper — только владельцу.
 * Значения ключа на страницу не попадают: только «задано / пусто» и итог
 * последней проверки из адреса (?k=…).
 */
export function CallHelperKeys({
  locale,
  state,
  result,
}: {
  locale: PanelLocale;
  state: { key: boolean; folder: boolean };
  result: string | null;
}) {
  const t = pick(callhelperDict, locale);
  const message = result ? t.sttResult(result) : "";
  return (
    <section id="stt" className="mt-6 rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold">{t.sttTitle}</h2>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted">{t.sttLead}</p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-muted">
        <li>{t.sttStep1}</li>
        <li>{t.sttStep2}</li>
        <li>{t.sttStep3}</li>
        <li>{t.sttStep4}</li>
      </ol>
      {message ? (
        <p data-result={result === "ok" ? "ok" : "warn"} className={`mt-3 text-sm ${result === "ok" ? "text-green" : "text-gold"}`}>
          {message}
        </p>
      ) : null}
      <form action={saveSttKey} className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-text">
          {t.sttKey} · <span className={state.key ? "text-green" : "text-muted"}>{state.key ? t.sttSet : t.sttEmpty}</span>
          <input name="key" type="password" autoComplete="off" spellCheck={false} maxLength={300} className={`${FIELD} mt-1`} />
        </label>
        <label className="text-xs font-medium text-text">
          {t.sttFolder} · <span className={state.folder ? "text-green" : "text-muted"}>{state.folder ? t.sttSet : t.sttEmpty}</span>
          <input name="folder" autoComplete="off" spellCheck={false} maxLength={60} className={`${FIELD} mt-1`} />
        </label>
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <SubmitButton base="rounded-lg px-3 py-1.5 text-sm font-medium" pendingLabel={t.sttWait}>
            {t.sttSave}
          </SubmitButton>
          {state.key && state.folder ? (
            <SubmitButton base="rounded-lg px-3 py-1.5 text-sm" tone="quiet" formAction={recheckSttKey} pendingLabel={t.sttWait}>
              {t.sttRecheck}
            </SubmitButton>
          ) : null}
        </div>
      </form>
    </section>
  );
}
