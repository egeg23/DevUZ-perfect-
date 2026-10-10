import { connectServiceBot, extendTrial, makeShowcase, markPaid, openCabinet, setStatus, toggleService } from "@/app/admin/ai-staff/actions";
import { AdminShell } from "@/components/admin/shell";
import { aiStaffDict } from "@/content/admin-panel/ai-staff";
import { requireAdmin } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { PLANS, PLAN_IDS, PLAN_TITLE, formatUzs, monthKey, monthStart, usageCostUsd, uzsPerUsd } from "@/lib/ai-staff/plans";
import { overview } from "@/lib/ai-staff/stats";
import * as store from "@/lib/ai-staff/store";

export const dynamic = "force-dynamic";

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";
const H2 = "text-xs uppercase tracking-wider text-faint";
const INPUT = "rounded-md border border-line bg-ink px-2 py-1 text-sm";
const BTN = "rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:text-text";

/**
 * Клиенты ИИ-сотрудников для владельца студии: работает ли сервис, кто на
 * каком тарифе, сколько стоит каждый по расходу модели (метка
 * `saas-<id>` в model_usage) и сколько приносит. Здесь же — отметка оплаты
 * (Click и Payme появятся позже, docs/ai-staff/pilot.md).
 */
export default async function AiStaffPage({ searchParams }: { searchParams: Promise<{ n?: string; d?: string }> }) {
  const staff = await requireAdmin();
  const t = pick(aiStaffDict, staff.panel_locale);
  const q = await searchParams;
  const now = new Date();
  const month = monthKey(now);
  const since = monthStart(now);
  const [enabled, tenants, showcase] = await Promise.all([
    store.serviceEnabled(0),
    store.allTenants(),
    store.setting<string>("demo_widget_key"),
  ]);
  const rate = uzsPerUsd();
  const rows = await Promise.all(
    tenants.map(async (tenant) => {
      const [convs, leads, usage, channels] = await Promise.all([
        store.conversationsSince(tenant.id, since),
        store.leadsSince(tenant.id, since),
        store.usageSince(tenant.id, since),
        store.channels(tenant.id),
      ]);
      return {
        tenant,
        stats: overview(convs, leads, month),
        costUsd: usageCostUsd(usage),
        channels: channels.filter((c) => c.status === "active").map((c) => c.kind),
        demo: channels.some((c) => c.widget_key && c.widget_key === showcase),
      };
    }),
  );
  const totalCost = rows.reduce((s, r) => s + r.costUsd, 0);
  const revenue = rows
    .filter((r) => r.tenant.paid_until && Date.parse(r.tenant.paid_until) > now.getTime())
    .reduce((s, r) => s + PLANS[r.tenant.plan].priceUzs, 0);
  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent" }) : "");

  return (
    <AdminShell staff={staff}>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.intro}</p>
        </div>
        {q.n === "bot_ok" ? <p className="text-sm text-green">{t.botOk}</p> : null}
        {q.n === "bot_nobiz" ? <p className="text-sm text-gold">{t.botNoBusiness}</p> : null}
        {q.n === "bot_fail" ? <p className="text-sm text-gold">{t.botFail}: {q.d}</p> : null}

        <section className={`${CARD} flex flex-wrap items-center gap-4`}>
          <span className={H2}>{t.service}</span>
          <span className={enabled ? "text-green" : "text-gold"}>{enabled ? t.on : t.off}</span>
          <form action={toggleService}>
            <input type="hidden" name="on" value={enabled ? "off" : "on"} />
            <button className={BTN}>{enabled ? t.turnOff : t.turnOn}</button>
          </form>
          <span className={H2}>{t.bot}</span>
          <form action={connectServiceBot}>
            <button className={BTN}>{t.setupBot}</button>
          </form>
          <span className="ml-auto text-sm text-muted">
            {t.month}: {t.totalCost} ${totalCost.toFixed(2)} (≈{formatUzs(totalCost * rate)}) · {t.revenue} {formatUzs(revenue)}
          </span>
        </section>

        <section className={CARD}>
          <h2 className={`${H2} mb-3`}>{t.clients}</h2>
          {rows.length === 0 ? <p className="text-sm text-muted">{t.none}</p> : null}
          <div className="space-y-4">
            {rows.map(({ tenant, stats, costUsd, channels, demo }) => {
              const plan = PLANS[tenant.plan];
              const perDialog = stats.dialogs ? costUsd / stats.dialogs : 0;
              const margin = plan.priceUzs ? plan.priceUzs - costUsd * rate : null;
              return (
                <div key={tenant.id} className="rounded-lg border border-line-soft p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="font-medium">
                      {tenant.name || "—"} <span className="text-sm text-muted">{tenant.niche}</span>
                      {demo ? <span className="ml-2 text-xs text-green">{t.isShowcase}</span> : null}
                    </div>
                    <div className="text-xs text-muted">
                      {PLAN_TITLE[tenant.plan][staff.panel_locale]} · {t[tenant.status]} · {t.until}{" "}
                      {date(tenant.paid_until && Date.parse(tenant.paid_until) > now.getTime() ? tenant.paid_until : tenant.trial_until)}
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 text-sm sm:grid-cols-4">
                    <span>
                      {t.dialogs}: {stats.dialogs} / {plan.dialogs}
                    </span>
                    <span>
                      {t.leads}: {stats.leads}
                    </span>
                    <span>
                      {t.cost}: ${costUsd.toFixed(2)} · ${perDialog.toFixed(3)} {t.perDialog}
                    </span>
                    <span>
                      {margin === null ? `${t.channels}: ${channels.join(", ") || "—"}` : `${t.margin}: ${formatUzs(margin)}`}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <form action={markPaid} className="flex flex-wrap items-center gap-1">
                      <input type="hidden" name="tenant" value={tenant.id} />
                      <select name="plan" defaultValue={tenant.plan === "trial" ? "start" : tenant.plan} className={INPUT}>
                        {PLAN_IDS.filter((p) => p !== "trial").map((p) => (
                          <option key={p} value={p}>
                            {PLAN_TITLE[p][staff.panel_locale]} · {formatUzs(PLANS[p].priceUzs)}
                          </option>
                        ))}
                      </select>
                      <input name="months" type="number" min={1} max={24} defaultValue={1} aria-label={t.months} className={`${INPUT} w-16`} />
                      <input name="amount" placeholder={t.amount} className={`${INPUT} w-28`} />
                      <select name="method" className={INPUT} aria-label={t.method}>
                        <option value="invoice">{t.invoice}</option>
                        <option value="cash">{t.cash}</option>
                        <option value="card">{t.card}</option>
                      </select>
                      <button className={BTN}>{t.markPaid}</button>
                    </form>
                    <form action={setStatus} className="flex items-center gap-1">
                      <input type="hidden" name="tenant" value={tenant.id} />
                      <select name="status" defaultValue={tenant.status} className={INPUT} aria-label={t.status}>
                        <option value="active">{t.active}</option>
                        <option value="paused">{t.paused}</option>
                        <option value="blocked">{t.blocked}</option>
                      </select>
                      <button className={BTN}>{t.setStatus}</button>
                    </form>
                    {tenant.plan === "trial" ? (
                      <form action={extendTrial}>
                        <input type="hidden" name="tenant" value={tenant.id} />
                        <button className={BTN}>{t.extendTrial}</button>
                      </form>
                    ) : null}
                    <form action={makeShowcase}>
                      <input type="hidden" name="tenant" value={tenant.id} />
                      <button className={BTN}>{t.makeShowcase}</button>
                    </form>
                    <form action={openCabinet}>
                      <input type="hidden" name="tenant" value={tenant.id} />
                      <button className={BTN}>{t.openCabinet}</button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
