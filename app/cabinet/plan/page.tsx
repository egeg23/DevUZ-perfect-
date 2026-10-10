import { CabinetShell, Card, button } from "@/components/cabinet/shell";
import { company } from "@/content/company";
import { cabinetPage } from "@/lib/ai-staff/page";
import { PLANS, PLAN_IDS, formatUzs } from "@/lib/ai-staff/plans";
import * as store from "@/lib/ai-staff/store";

export const dynamic = "force-dynamic";

export default async function CabinetPlan() {
  const cab = await cabinetPage({ owner: true });
  const { tenant, t, locale } = cab;
  const history = await store.payments(tenant.id);
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
      <p className="text-sm text-muted">{t("dialogWhat")}</p>
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
