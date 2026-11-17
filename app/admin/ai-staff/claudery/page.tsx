import { saveClauderyKeysAction, saveClauderyScenarioAction } from "@/app/admin/ai-staff/claudery/actions";
import { AiStaffTabs } from "@/app/admin/ai-staff/tabs";
import { HelpHint } from "@/components/admin/help-link";
import { AdminShell } from "@/components/admin/shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { aiStaffDict } from "@/content/admin-panel/ai-staff";
import { clauderyDict } from "@/content/admin-panel/ai-staff-claudery";
import { requireSection } from "@/lib/admin/guard";
import { helpAnchor } from "@/lib/admin/help";
import { pick } from "@/lib/admin/i18n";
import { KINDS, LIMITS, type Step } from "@/lib/claudery/scenario";
import { OFFER_PATH, botState, clauderyWeek, loadScenario } from "@/lib/claudery/store";

export const dynamic = "force-dynamic";

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";
const H2 = "text-xs uppercase tracking-wider text-faint";
const BTN = "rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:text-text";
const INPUT = "mt-1 w-full rounded-md border border-line bg-ink px-2 py-1 text-sm text-text";
const KEY_RESULTS = ["ok", "bad_token", "no_token", "failed"] as const;

/**
 * «Claudery» в «ИИ-сотрудниках»: ключи бота и Platega, конструктор сценария.
 * Владелец, 17.11.2026: «Сделай в ИИ сотрудниках, чтобы я мог собирать бота
 * там как конструктор, ну типа сценарии прописывать ответов, кнопки делать».
 */
export default async function AiStaffClauderyPage({ searchParams }: { searchParams: Promise<{ k?: string; bad?: string; done?: string }> }) {
  const staff = await requireSection("/admin/ai-staff");
  const locale = staff.panel_locale;
  const t = pick(clauderyDict, locale);
  const q = await searchParams;
  const tune = staff.role === "admin" || staff.role === "head";
  const [state, scenario, week] = await Promise.all([botState(), loadScenario(), clauderyWeek().catch(() => null)]);
  const keyResult = KEY_RESULTS.find((r) => r === q.k);
  const ids = scenario.steps.map((s) => s.id);
  const blank: Step = { id: "", kind: "message", text: { ru: "", uz: "" }, buttons: [] };
  const cards = [...scenario.steps, blank].slice(0, LIMITS.steps + 1);

  return (
    <AdminShell staff={staff}>
      <div className="space-y-5">
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">{pick(aiStaffDict, locale).title}</h1>
          <AiStaffTabs role={staff.role} locale={locale} current="claudery" />
          <p className="text-sm text-muted">{t.intro}</p>
        </div>

        {keyResult ? (
          <p data-result={keyResult === "ok" ? "ok" : "warn"} className={`text-sm ${keyResult === "ok" ? "text-green" : "text-gold"}`}>
            {t[`r_${keyResult}`]}
          </p>
        ) : null}
        {q.done === "saved" ? <p data-result="ok" className="text-sm text-green">{t.r_saved}</p> : null}
        {q.bad ? (
          <p data-result="warn" className="whitespace-pre-line text-sm text-gold">
            {t.r_bad}
            {"\n"}
            {q.bad.slice(0, 1500)}
          </p>
        ) : null}

        <section className={CARD}>
          <div className="flex items-baseline justify-between gap-2">
            <p className={H2}>{t.status}</p>
            <HelpHint topic={helpAnchor("/admin/ai-staff", "claudery")} />
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <span className="text-muted">{t.bot}:</span> {state.username ? `@${state.username}` : t.notConnected}
            </li>
            <li>
              <span className="text-muted">{t.platega}:</span> {state.platega ? t.set : t.empty}
            </li>
            {week ? <li className="text-muted">{t.week(week.leads, week.paid)}</li> : null}
          </ul>
          <a href={OFFER_PATH} target="_blank" rel="noreferrer" className={`${BTN} mt-3 inline-block`}>
            {t.offer}
          </a>
        </section>

        {tune ? (
          <section className={CARD}>
            <p className={H2}>{t.keysTitle}</p>
            <p className="mt-1 text-xs text-muted">{t.keysHint}</p>
            <form action={saveClauderyKeysAction} className="mt-3 grid gap-2 sm:grid-cols-3" autoComplete="off">
              <label className="text-xs text-muted">
                {t.token}
                <input name="token" type="password" className={INPUT} />
              </label>
              <label className="text-xs text-muted">
                {t.merchant}
                <input name="merchant" type="password" className={INPUT} />
              </label>
              <label className="text-xs text-muted">
                {t.apiKey}
                <input name="apiKey" type="password" className={INPUT} />
              </label>
              <div className="sm:col-span-3">
                <SubmitButton base={`${BTN} font-semibold`}>{t.check}</SubmitButton>
              </div>
            </form>
          </section>
        ) : null}

        <section className={CARD}>
          <p className={H2}>{t.builder}</p>
          <p className="mt-1 text-xs text-muted">{t.builderHint}</p>
          <form action={saveClauderyScenarioAction} className="mt-3 space-y-4">
            <fieldset disabled={!tune} className="space-y-4">
              <label className="block text-xs text-muted">
                {t.start}
                <select name="start" defaultValue={scenario.start} className={INPUT}>
                  {ids.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </label>
              {cards.map((step, i) => (
                <div key={`${step.id}-${i}`} className="space-y-2 rounded-lg border border-line p-3">
                  {step.id ? null : <p className="text-xs text-faint">{t.newStep}</p>}
                  <div className="grid gap-2 sm:grid-cols-4">
                    <label className="text-xs text-muted">
                      {t.stepId}
                      <input name={`n.${i}.id`} defaultValue={step.id} maxLength={LIMITS.id} className={INPUT} />
                    </label>
                    <label className="text-xs text-muted">
                      {t.kind}
                      <select name={`n.${i}.kind`} defaultValue={step.kind} className={INPUT}>
                        {KINDS.map((k) => (
                          <option key={k} value={k}>
                            {t[`k_${k}`]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-muted">
                      {t.next}
                      <select name={`n.${i}.next`} defaultValue={step.next ?? ""} className={INPUT}>
                        <option value="">{t.none}</option>
                        {ids.map((id) => (
                          <option key={id} value={id}>
                            {id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-muted">
                      {t.amount}
                      <input name={`n.${i}.amount`} inputMode="numeric" defaultValue={step.amount ?? ""} className={INPUT} />
                    </label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-muted">
                      {t.textRu}
                      <textarea name={`n.${i}.ru`} rows={3} defaultValue={step.text.ru} maxLength={LIMITS.text} className={INPUT} />
                    </label>
                    <label className="text-xs text-muted">
                      {t.textUz}
                      <textarea name={`n.${i}.uz`} rows={3} defaultValue={step.text.uz} maxLength={LIMITS.text} className={INPUT} />
                    </label>
                  </div>
                  <p className="text-xs text-faint">{t.buttons}</p>
                  {Array.from({ length: Math.min(LIMITS.buttons, step.buttons.length + 1) }, (_, j) => {
                    const b = step.buttons[j];
                    return (
                      <div key={j} className="grid gap-2 sm:grid-cols-4">
                        <input name={`n.${i}.b.${j}.ru`} placeholder={t.btnRu} defaultValue={b?.label.ru ?? ""} maxLength={LIMITS.label} className={INPUT} />
                        <input name={`n.${i}.b.${j}.uz`} placeholder={t.btnUz} defaultValue={b?.label.uz ?? ""} maxLength={LIMITS.label} className={INPUT} />
                        <select name={`n.${i}.b.${j}.to`} defaultValue={b?.to ?? ""} aria-label={t.btnTo} className={INPUT}>
                          <option value="">{t.btnTo}</option>
                          {ids.map((id) => (
                            <option key={id} value={id}>
                              {id}
                            </option>
                          ))}
                        </select>
                        <input name={`n.${i}.b.${j}.url`} placeholder={t.btnUrl} defaultValue={b?.url ?? ""} className={INPUT} />
                      </div>
                    );
                  })}
                  {step.id ? (
                    <label className="flex items-center gap-2 text-xs text-muted">
                      <input type="checkbox" name={`n.${i}.del`} value="1" /> {t.del}
                    </label>
                  ) : null}
                </div>
              ))}
              <label className="block text-xs text-muted">
                {t.terms}
                <textarea name="terms" rows={5} defaultValue={scenario.terms} maxLength={LIMITS.terms} className={INPUT} />
              </label>
            </fieldset>
            {tune ? <SubmitButton base={`${BTN} font-semibold`}>{t.save}</SubmitButton> : <p className="text-xs text-muted">{t.onlyHeads}</p>}
          </form>
        </section>
      </div>
    </AdminShell>
  );
}
