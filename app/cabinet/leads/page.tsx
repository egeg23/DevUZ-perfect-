import Link from "next/link";

import { removeLead, setLead } from "@/app/cabinet/actions";
import { CabinetShell, Card } from "@/components/cabinet/shell";
import { cabinetPage } from "@/lib/ai-staff/page";
import * as store from "@/lib/ai-staff/store";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "taken", "won", "lost"] as const;

export default async function CabinetLeads() {
  const cab = await cabinetPage();
  const { tenant, t, locale } = cab;
  const list = await store.leads(tenant.id);
  const time = (iso: string) =>
    new Date(iso).toLocaleString(locale === "uz" ? "uz-Latn-UZ" : "ru-RU", { timeZone: "Asia/Tashkent", dateStyle: "short", timeStyle: "short" });
  return (
    <CabinetShell t={t} locale={locale} company={tenant.name} current="/cabinet/leads" configure={cab.configure} support={cab.role === "support"}>
      {list.length === 0 ? <p className="text-sm text-muted">{t("leadsEmpty")}</p> : null}
      {list.map((lead) => (
        <Card key={lead.id}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="font-semibold">
              {lead.request_no} · {lead.name || t("customer")}
              {lead.test ? <span className="ml-2 text-xs text-gold">{t("test")}</span> : null}
            </div>
            <div className="text-xs text-muted">{time(lead.created_at)}</div>
          </div>
          <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {lead.contact ? <Row k={t("contact")} v={lead.contact} /> : null}
            {lead.need ? <Row k={t("need")} v={lead.need} /> : null}
            {lead.budget ? <Row k={t("budget")} v={lead.budget} /> : null}
            {lead.urgency ? <Row k={t("when")} v={lead.urgency} /> : null}
            {lead.taken_by ? <Row k={t("took")} v={lead.taken_by} /> : null}
          </dl>
          {lead.summary ? <p className="mt-2 text-sm text-muted">{lead.summary}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {STATUSES.map((s) => (
              <form key={s} action={setLead}>
                <input type="hidden" name="id" value={lead.id} />
                <input type="hidden" name="status" value={s} />
                <button className={`rounded-md border px-2.5 py-1 text-xs ${lead.status === s ? "border-green-dim text-green" : "border-line text-muted"}`}>
                  {t(`status_${s}`)}
                </button>
              </form>
            ))}
            {lead.conversation_id ? (
              <Link href={`/cabinet/talks/${lead.conversation_id}`} className="text-xs text-muted hover:text-text">
                {t("openTalk")} →
              </Link>
            ) : null}
            {cab.configure ? (
              <form action={removeLead}>
                <input type="hidden" name="id" value={lead.id} />
                <button className="text-xs text-faint hover:text-gold">{t("remove")}</button>
              </form>
            ) : null}
          </div>
        </Card>
      ))}
    </CabinetShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="inline text-muted">{k}: </dt>
      <dd className="inline">{v}</dd>
    </div>
  );
}
