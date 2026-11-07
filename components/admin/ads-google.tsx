import { plannerAccountAction, plannerCheckAction, saveGoogleKeysAction } from "@/app/admin/ads/google-actions";
import { BTN, CARD, H2, INPUT } from "@/components/ads/board";
import { CopyRich } from "@/components/admin/copy-rich";
import { HelpHint } from "@/components/admin/help-link";
import { SubmitButton } from "@/components/admin/submit-button";
import { adsGoogleDict } from "@/content/admin-panel/ads-google";
import { helpAnchor } from "@/lib/admin/help";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { callbackUrl } from "@/lib/ads/oauth";
import { lastPlannerCheck, mayChoosePlanner, plannerAccount } from "@/lib/seo/keyword-planner-store";
import { appSecret } from "@/lib/secrets";

const RESULTS = ["keys_saved", "keys_bad", "forbidden", "planner_set", "planner_bad", "failed", "checked"] as const;
type Result = (typeof RESULTS)[number];
const OK: readonly Result[] = ["keys_saved", "planner_set", "checked"];

function when(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

/**
 * «Реклама»: ключи приложения Google (только владелец) и планировщик
 * ключевых слов (владелец и руководитель) — lib/seo/keyword-planner.ts.
 * Владелец, 07.11.2026: «Подключаем, аккаунт гугл адс у меня есть».
 */
export async function AdsGoogle({ staff, locale, result }: { staff: { role: string }; locale: PanelLocale; result: string | undefined }) {
  const t = pick(adsGoogleDict, locale);
  const owner = staff.role === "admin";
  const chooses = mayChoosePlanner(staff as { role: "admin" | "head" | "manager" });
  const [id, secret, planner, check] = await Promise.all([
    owner ? appSecret("GOOGLE_ADS_CLIENT_ID") : Promise.resolve(null),
    owner ? appSecret("GOOGLE_ADS_CLIENT_SECRET") : Promise.resolve(null),
    plannerAccount(),
    lastPlannerCheck(),
  ]);
  const shown = RESULTS.includes(result as Result) ? (result as Result) : null;
  const chip = (set: boolean) => (
    <span className={`rounded-md border px-1.5 py-0.5 text-[11px] ${set ? "border-green/40 text-green" : "border-line text-faint"}`}>{set ? t.isSet : t.isEmpty}</span>
  );

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {shown ? (
        <p
          data-result={OK.includes(shown) ? "ok" : "warn"}
          className={`text-sm lg:col-span-2 ${OK.includes(shown) ? "text-green" : "text-gold"}`}
        >
          {t[`r_${shown}`]}
        </p>
      ) : null}

      {owner ? (
        <section className={CARD}>
          <div className="flex items-baseline justify-between gap-2">
            <p className={H2}>{t.keysTitle}</p>
            <HelpHint topic={helpAnchor("/admin/ads", "google")} />
          </div>
          <p className="mt-1 text-xs text-muted">{t.keysHint}</p>
          <form action={saveGoogleKeysAction} className="mt-3 space-y-2">
            <label className="block text-xs text-muted">
              <span className="flex items-center gap-2">
                {t.clientId} {chip(Boolean(id))}
              </span>
              <input name="clientId" autoComplete="off" spellCheck={false} className={`${INPUT} mt-1 font-mono`} />
            </label>
            <label className="block text-xs text-muted">
              <span className="flex items-center gap-2">
                {t.clientSecret} {chip(Boolean(secret))}
              </span>
              <input name="clientSecret" type="password" autoComplete="off" className={`${INPUT} mt-1 font-mono`} />
            </label>
            <SubmitButton base={`${BTN} font-semibold`}>{t.save}</SubmitButton>
          </form>
          <div className="mt-3 border-t border-line-soft pt-3 text-xs text-muted">
            <p>{t.redirect}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="break-all rounded bg-ink px-2 py-1 text-[11px] text-text">{callbackUrl("google")}</code>
              <CopyRich text={callbackUrl("google")} label={t.copy} done={t.copied} />
            </div>
          </div>
        </section>
      ) : null}

      <section className={CARD}>
        <div className="flex items-baseline justify-between gap-2">
          <p className={H2}>{t.plannerTitle}</p>
          <HelpHint topic={helpAnchor("/admin/ads", "google")} />
        </div>
        <p className="mt-1 text-xs text-muted">{t.plannerHint}</p>
        {planner.accounts.length === 0 ? <p className="mt-3 text-sm text-gold">{t.noAccounts}</p> : null}
        {chooses && planner.accounts.length > 0 ? (
          <form action={plannerAccountAction} className="mt-3 flex flex-wrap items-center gap-2">
            <select name="account" defaultValue={planner.chosen ?? ""} aria-label={t.account} className={`${INPUT} sm:w-auto`}>
              <option value="">{t.accountAuto}</option>
              {planner.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name || a.external_id} · {a.external_id}
                </option>
              ))}
            </select>
            <SubmitButton base={BTN} tone="quiet">
              {t.save}
            </SubmitButton>
          </form>
        ) : null}
        {chooses ? (
          <form action={plannerCheckAction} className="mt-3">
            <SubmitButton base={`${BTN} font-semibold`}>{t.check}</SubmitButton>
          </form>
        ) : null}
        {check ? (
          <div className="mt-3 text-xs">
            <p className={check.ok ? "text-green" : "text-gold"}>
              {t.lastCheck(when(check.at))} {check.text}
            </p>
            {check.top.length ? (
              <p className="mt-1 text-muted">
                {t.top} {check.top.map((p) => `${p.phrase} (${p.value})`).join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
