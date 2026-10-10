import { payByCard } from "@/app/cabinet/actions";
import { CabinetShell, Card, Notice, button, input } from "@/components/cabinet/shell";
import { company } from "@/content/company";
import { cabinetPage } from "@/lib/ai-staff/page";
import { payConfig } from "@/lib/ai-staff/pay";
import { PLANS, PLAN_IDS, formatUzs } from "@/lib/ai-staff/plans";
import * as store from "@/lib/ai-staff/store";

export const dynamic = "force-dynamic";

export default async function CabinetPlan({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const cab = await cabinetPage({ owner: true });
  const { tenant, t, locale } = cab;
  const { n } = await searchParams;
  const [history, cfg] = await Promise.all([store.payments(tenant.id), payConfig()]);
  const providers = [cfg.payme ? "payme" : null, cfg.click ? "click" : null].filter(Boolean) as string[];
  return (
    <CabinetShell t={t} locale={locale} company={tenant.name} current="/cabinet/plan" configure={cab.configure} support={cab.role === "support"}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_IDS.map((id) => {
          const plan = PLANS[id];
          return (
            <div key={id} className={`rounded-xl border p-4 ${tenant.plan === id ? "border-green-dim" : "border-line"} bg-surface`}>
              <div className="font-semibold">{t(`plan_${id}`)}</div>
              <div className="mt-1 text-xl">{plan.priceUzs ? `${formatUzs(plan.priceUzs)}` : t("free14")}</div>
              {plan.priceUzs ? <div className="text-xs text-muted">{t("perMonth")}</div> : null}
              <ul className="mt-3 space-y-1 text-sm text-muted">
                <li>
                  {formatUzs(plan.dialogs)} {t("dialogsPerMonth")}
                </li>
                <li>
                  {plan.channels} {t("channelsN")}
                </li>
                {plan.tier === "premium" ? <li>{t("premiumModel")}</li> : null}
              </ul>
            </div>
          );
        })}
      </div>
      {n === "paid" ? <Notice text={t("paidThanks")} /> : null}
      {n === "payfail" ? <Notice tone="warn" text={t("payFail")} /> : null}
      <p className="text-sm text-muted">{t("dialogWhat")}</p>
      {providers.length ? (
        <Card title={t("payCard")} hint={t("payCardHint")}>
          <form action={payByCard} className="flex flex-wrap items-center gap-2">
            <select name="plan" defaultValue={tenant.plan === "trial" ? "start" : tenant.plan} className={`${input} w-auto`}>
              {PLAN_IDS.filter((p) => p !== "trial").map((p) => (
                <option key={p} value={p}>
                  {t(`plan_${p}`)} · {formatUzs(PLANS[p].priceUzs)}
                </option>
              ))}
            </select>
            <select name="months" defaultValue="1" className={`${input} w-auto`}>
              {[1, 3, 6, 12].map((m) => (
                <option key={m} value={m}>
                  {m} {t("months")}
                </option>
              ))}
            </select>
            {providers.map((p) => (
              <button key={p} name="provider" value={p} className={button}>
                {t("payWith")} {p === "payme" ? "Payme" : "Click"}
              </button>
            ))}
          </form>
        </Card>
      ) : null}
      <Card title={t("howPay")} hint={t("howPayBody")}>
        <a className={button} href={company.telegramUrl}>
          {t("writeUs")}
        </a>
      </Card>
      {history.length ? (
        <Card title={t("history")}>
          <ul className="space-y-1 text-sm">
            {history.map((p) => (
              <li key={p.id}>
                {new Date(p.created_at).toLocaleDateString(locale === "uz" ? "uz-Latn-UZ" : "ru-RU")} · {t(`plan_${p.plan as (typeof PLAN_IDS)[number]}`)} · {p.months} {t("months")} ·{" "}
                {formatUzs(p.amount_uzs)}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </CabinetShell>
  );
}
