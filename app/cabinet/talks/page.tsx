import Link from "next/link";

import { CabinetShell, Card } from "@/components/cabinet/shell";
import { cabinetPage } from "@/lib/ai-staff/page";
import * as store from "@/lib/ai-staff/store";

export const dynamic = "force-dynamic";

const KIND: Record<string, string> = { tg_business: "Telegram", tg_bot: "Bot", widget: "Web" };

export default async function CabinetTalks() {
  const cab = await cabinetPage();
  const { tenant, t, locale } = cab;
  const list = await store.conversations(tenant.id, 200);
  const time = (iso: string) =>
    new Date(iso).toLocaleString(locale === "uz" ? "uz-Latn-UZ" : "ru-RU", { timeZone: "Asia/Tashkent", dateStyle: "short", timeStyle: "short" });
  return (
    <CabinetShell t={t} locale={locale} company={tenant.name} current="/cabinet/talks" configure={cab.configure} support={cab.role === "support"}>
      {list.length === 0 ? <p className="text-sm text-muted">{t("talksEmpty")}</p> : null}
      <Card>
        <ul className="divide-y divide-line-soft">
          {list.map((c) => {
            const last = c.messages.at(-1);
            return (
              <li key={c.id}>
                <Link href={`/cabinet/talks/${c.id}`} className="flex flex-col gap-1 py-3 hover:text-green sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm">
                    <span className="mr-2 rounded bg-surface-2 px-1.5 py-0.5 text-xs text-muted">{KIND[c.kind] ?? c.kind}</span>
                    {c.customer_name || c.customer_handle || t("customer")}
                    <span className="ml-2 text-muted">{last ? last.text.slice(0, 80) : ""}</span>
                  </span>
                  <span className="flex gap-2 text-xs text-muted">
                    {c.unanswered > 0 ? <span className="text-gold">{t("needsKb")}</span> : null}
                    {c.lead_id ? <span className="text-green">{t("navLeads")}</span> : null}
                    <span>{c.mode === "human" ? t("modeHuman") : t("modeAi")}</span>
                    <span>{time(c.last_at)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </CabinetShell>
  );
}
