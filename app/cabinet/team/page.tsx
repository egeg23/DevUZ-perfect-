import { removeMemberAction, toggleNotify } from "@/app/cabinet/actions";
import { CopyBox } from "@/components/cabinet/copy-box";
import { CabinetShell, Card } from "@/components/cabinet/shell";
import { serviceBotUsername } from "@/lib/ai-staff/channels";
import { cabinetPage } from "@/lib/ai-staff/page";
import * as store from "@/lib/ai-staff/store";

export const dynamic = "force-dynamic";

export default async function CabinetTeam() {
  const cab = await cabinetPage({ owner: true });
  const { tenant, t, locale } = cab;
  const [list, bot] = await Promise.all([store.members(tenant.id), serviceBotUsername()]);
  return (
    <CabinetShell t={t} locale={locale} company={tenant.name} current="/cabinet/team" configure={cab.configure} support={cab.role === "support"}>
      <Card title={t("invite")} hint={t("teamIntro")}>
        {bot ? <CopyBox value={`https://t.me/${bot}?start=join_${tenant.invite_code}`} label={t("copy")} /> : <p className="text-sm text-muted">{t("loginNoBot")}</p>}
      </Card>
      <Card>
        <ul className="divide-y divide-line-soft">
          {list.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span>
                {m.name}
                {m.username ? <span className="text-muted"> @{m.username}</span> : null}
                <span className="ml-2 text-xs text-muted">{m.role === "owner" ? t("owner") : t("manager")}</span>
              </span>
              <span className="flex items-center gap-3">
                <form action={toggleNotify}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="notify" value={m.notify ? "off" : "on"} />
                  <button className={`rounded-md border px-2.5 py-1 text-xs ${m.notify ? "border-green-dim text-green" : "border-line text-muted"}`}>
                    {m.notify ? "✓ " : ""}
                    {t("getsLeads")}
                  </button>
                </form>
                {m.role !== "owner" ? (
                  <form action={removeMemberAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="text-xs text-faint hover:text-gold">{t("remove")}</button>
                  </form>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </CabinetShell>
  );
}
