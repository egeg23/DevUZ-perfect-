import { saveClauderyKeysAction, saveClauderySetupAction } from "@/app/admin/ai-staff/claudery/actions";
import { AiStaffTabs } from "@/app/admin/ai-staff/tabs";
import { HelpHint } from "@/components/admin/help-link";
import { AdminShell } from "@/components/admin/shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { aiStaffDict } from "@/content/admin-panel/ai-staff";
import { clauderyDict } from "@/content/admin-panel/ai-staff-claudery";
import { requireSection } from "@/lib/admin/guard";
import { helpAnchor } from "@/lib/admin/help";
import { pick } from "@/lib/admin/i18n";
import { LIMITS } from "@/lib/claudery/scenario";
import { OFFER_PATH, botState, clauderyWeek, loadSetup } from "@/lib/claudery/store";

export const dynamic = "force-dynamic";

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";
const H2 = "text-xs uppercase tracking-wider text-faint";
const BTN = "rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:text-text";
const INPUT = "mt-1 w-full rounded-md border border-line bg-ink px-2 py-1 text-sm text-text";
const STEP = "space-y-2 rounded-lg border border-line p-3";
const STEP_TITLE = "text-sm font-medium";
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
  const [state, setup, week] = await Promise.all([botState(), loadSetup(), clauderyWeek().catch(() => null)]);
  const keyResult = KEY_RESULTS.find((r) => r === q.k);

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
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/claudery" target="_blank" rel="noreferrer" className={BTN}>
              {t.shop}
            </a>
            <a href={OFFER_PATH} target="_blank" rel="noreferrer" className={BTN}>
              {t.offer}
            </a>
            <a href="/claudery/terms" target="_blank" rel="noreferrer" className={BTN}>
              {t.terms}
            </a>
            <a href="/claudery/privacy" target="_blank" rel="noreferrer" className={BTN}>
              {t.privacy}
            </a>
          </div>
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
          <form action={saveClauderySetupAction} className="mt-4 space-y-5">
            <fieldset disabled={!tune} className="space-y-5">
              <div className={STEP}>
                <p className={STEP_TITLE}>{t.s1}</p>
                <label className="block text-xs text-muted">
                  {t.greet}
                  <textarea name="greet" rows={3} defaultValue={setup.greet} maxLength={LIMITS.text} className={INPUT} />
                </label>
                <label className="block text-xs text-muted">
                  {t.helpLabel}
                  <input name="helpLabel" defaultValue={setup.helpLabel} maxLength={LIMITS.label} className={INPUT} />
                </label>
                <p className="pt-1 text-xs text-faint">{t.extras}</p>
                <p className="text-xs text-muted">{t.extrasHint}</p>
                {Array.from({ length: LIMITS.extras }, (_, i) => {
                  const e = setup.extras[i];
                  return (
                    <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_1fr]">
                      <input name={`x${i}.label`} placeholder={t.xLabel} defaultValue={e?.label ?? ""} maxLength={LIMITS.label} className={INPUT} />
                      <input name={`x${i}.answer`} placeholder={t.xAnswer} defaultValue={e?.answer ?? ""} maxLength={LIMITS.text} className={INPUT} />
                      <input name={`x${i}.url`} placeholder={t.xUrl} defaultValue={e?.url ?? ""} className={INPUT} />
                    </div>
                  );
                })}
              </div>
              <div className={STEP}>
                <p className={STEP_TITLE}>{t.s2}</p>
                <p className="text-xs text-muted">{t.s2Hint}</p>
                <label className="block text-xs text-muted">
                  {t.text}
                  <textarea name="ask" rows={2} defaultValue={setup.ask} maxLength={LIMITS.text} className={INPUT} />
                </label>
              </div>
              <div className={STEP}>
                <p className={STEP_TITLE}>{t.s3}</p>
                <p className="text-xs text-muted">{t.s3Hint}</p>
                <label className="block text-xs text-muted">
                  {t.text}
                  <textarea name="pay" rows={3} defaultValue={setup.pay} maxLength={LIMITS.text} className={INPUT} />
                </label>
                <p className="pt-1 text-xs text-faint">{t.products}</p>
                <p className="text-xs text-muted">{t.productsHint}</p>
                {Array.from({ length: LIMITS.products }, (_, i) => {
                  const p = setup.products[i];
                  return (
                    <div key={i} className="grid gap-2 sm:grid-cols-[2fr_3fr_1fr]">
                      <input name={`p${i}.title`} placeholder={t.pTitle} defaultValue={p?.title ?? ""} maxLength={LIMITS.productTitle} className={INPUT} />
                      <input name={`p${i}.note`} placeholder={t.pNote} defaultValue={p?.note ?? ""} maxLength={LIMITS.productNote} className={INPUT} />
                      <input name={`p${i}.price`} placeholder={t.pPrice} inputMode="numeric" defaultValue={p?.price ?? ""} className={INPUT} />
                    </div>
                  );
                })}
                <label className="block max-w-[16rem] text-xs text-muted">
                  {t.repeatDiscount}
                  <input name="repeatDiscount" inputMode="numeric" defaultValue={setup.repeatDiscount} className={INPUT} />
                </label>
              </div>
              <div className={STEP}>
                <p className={STEP_TITLE}>{t.s4}</p>
                <label className="block text-xs text-muted">
                  {t.text}
                  <textarea name="paid" rows={2} defaultValue={setup.paid} maxLength={LIMITS.text} className={INPUT} />
                </label>
              </div>
              <div className={STEP}>
                <p className={STEP_TITLE}>{t.s5}</p>
                <label className="block text-xs text-muted">
                  {t.text}
                  <textarea name="terms" rows={4} defaultValue={setup.terms} maxLength={LIMITS.terms} className={INPUT} />
                </label>
              </div>
              <div className={STEP}>
                <p className={STEP_TITLE}>{t.s6}</p>
                <p className="mb-2 text-xs text-muted">{t.supportHint}</p>
                <label className="block text-xs text-muted">
                  {t.support}
                  <input name="support" defaultValue={setup.support} maxLength={LIMITS.support} placeholder="support@… / @username" className={INPUT} />
                </label>
              </div>
            </fieldset>
            {tune ? <SubmitButton base={`${BTN} font-semibold`}>{t.save}</SubmitButton> : <p className="text-xs text-muted">{t.onlyHeads}</p>}
          </form>
        </section>
      </div>
    </AdminShell>
  );
}
