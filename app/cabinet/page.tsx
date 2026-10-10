import Link from "next/link";

import { CabinetShell, Card, Notice } from "@/components/cabinet/shell";
import { cabinetPage } from "@/lib/ai-staff/page";
import { PLANS, monthKey, monthStart, stopReason } from "@/lib/ai-staff/plans";
import { overview } from "@/lib/ai-staff/stats";
import * as store from "@/lib/ai-staff/store";

export const dynamic = "force-dynamic";

const day = (iso: string | null, locale: string) =>
  iso ? new Date(iso).toLocaleDateString(locale === "uz" ? "uz-Latn-UZ" : "ru-RU", { timeZone: "Asia/Tashkent" }) : "";

export default async function CabinetHome() {
  const cab = await cabinetPage();
  const { tenant, t, locale } = cab;
  const now = new Date();
  const month = monthKey(now);
  const since = monthStart(now);
  const [convs, leads, knowledge, channels, members, testConv] = await Promise.all([
    store.conversationsSince(tenant.id, since),
    store.leadsSince(tenant.id, since),
    store.knowledge(tenant.id),
    store.channels(tenant.id),
    store.members(tenant.id),
    store.leads(tenant.id, 20),
  ]);
  const stats = overview(convs, leads, month);
  const stop = stopReason(tenant, stats.dialogs, now);
  const plan = PLANS[tenant.plan];
  const steps = [
    { ok: true, key: "stepCompany" as const, href: "/cabinet/settings" },
    { ok: knowledge.length >= 2, key: "stepKnowledge" as const, href: "/cabinet/knowledge" },
    { ok: channels.some((c) => c.status === "active"), key: "stepChannel" as const, href: "/cabinet/channels" },
    { ok: testConv.some((l) => l.test) || convs.length > 0, key: "stepTest" as const, href: "/cabinet/test" },
    { ok: members.some((m) => m.notify), key: "stepTeam" as const, href: "/cabinet/team" },
  ];
  const paid = tenant.paid_until && Date.parse(tenant.paid_until) > now.getTime();

  return (
    <CabinetShell t={t} locale={locale} company={tenant.name} current="/cabinet" configure={cab.configure} support={cab.role === "support"}>
      {stop ? <Notice tone="warn" text={`${t("statusStopped")}: ${t(`stop_${stop}`)}.`} /> : null}
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span>
            {t("planCurrent")}: <b>{t(`plan_${tenant.plan}`)}</b>
          </span>
          <span className="text-muted">
            {paid ? `${t("statusPaid")} ${day(tenant.paid_until, locale)}` : tenant.plan === "trial" ? `${t("statusTrial")} ${day(tenant.trial_until, locale)}` : ""}
          </span>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("dialogs")} value={`${stats.dialogs} / ${plan.dialogs}`} />
        <Stat label={t("leadsMonth")} value={String(stats.leads)} />
        <Stat label={t("firstReply")} value={stats.firstReplySec === null ? "—" : `${stats.firstReplySec} ${t("sec")}`} />
        <Stat label={t("offHours")} value={String(stats.offHoursLeads)} />
      </div>
      {stats.unanswered > 0 ? (
        <Card title={`${t("unanswered")}: ${stats.unanswered}`} hint={t("unansweredHint")}>
          <Link href="/cabinet/talks" className="text-sm text-green">
            {t("navTalks")} →
          </Link>
        </Card>
      ) : null}
      <Card title={t("steps")}>
        <ol className="space-y-2 text-sm">
          {steps.map((s) => (
            <li key={s.key} className="flex items-center justify-between gap-3">
              <span className={s.ok ? "text-muted line-through" : ""}>{t(s.key)}</span>
              {s.ok ? <span className="text-green">{t("done")}</span> : cab.configure || s.key === "stepTest" ? <Link className="text-green" href={s.href}>{t("go")} →</Link> : null}
            </li>
          ))}
        </ol>
      </Card>
    </CabinetShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
