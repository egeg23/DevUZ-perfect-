import { saveSettings } from "@/app/cabinet/actions";
import { CabinetShell, Card, Notice, button, input } from "@/components/cabinet/shell";
import { cabinetPage } from "@/lib/ai-staff/page";
import * as store from "@/lib/ai-staff/store";

export const dynamic = "force-dynamic";

export default async function CabinetSettings({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const cab = await cabinetPage({ owner: true });
  const { tenant, t, locale } = cab;
  const { n } = await searchParams;
  const employee = await store.salesEmployee(tenant.id);
  const dayNames = t("dayNames").split(",");
  return (
    <CabinetShell t={t} locale={locale} company={tenant.name} current="/cabinet/settings" configure={cab.configure} support={cab.role === "support"}>
      {n === "saved" ? <Notice text={t("saved")} /> : null}
      <form action={saveSettings} className="space-y-6">
        <Card title={t("setCompany")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              {t("company")}
              <input name="name" defaultValue={tenant.name} maxLength={120} className={`${input} mt-1`} />
            </label>
            <label className="block text-sm">
              {t("niche")}
              <input name="niche" defaultValue={tenant.niche} maxLength={120} className={`${input} mt-1`} />
            </label>
            <label className="block text-sm">
              {t("language")}
              <select name="locale" defaultValue={tenant.locale} className={`${input} mt-1`}>
                <option value="ru">Русский</option>
                <option value="uz">O&apos;zbekcha</option>
              </select>
            </label>
          </div>
        </Card>
        <Card title={t("setAssistant")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              {t("assistantName")}
              <input name="assistant" defaultValue={employee?.name ?? ""} maxLength={60} className={`${input} mt-1`} />
            </label>
            <label className="block text-sm">
              {t("tone")}
              <select name="tone" defaultValue={employee?.tone ?? "friendly"} className={`${input} mt-1`}>
                <option value="friendly">{t("toneFriendly")}</option>
                <option value="formal">{t("toneFormal")}</option>
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              {t("greeting")}
              <input name="greeting" defaultValue={employee?.greeting ?? ""} maxLength={300} className={`${input} mt-1`} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="enabled" defaultChecked={employee?.enabled ?? true} />
              {t("enabled")}
            </label>
          </div>
        </Card>
        <Card title={t("mode")} hint={t("modeHint")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <select name="answer_mode" defaultValue={tenant.answer_mode} className={input}>
              <option value="always">{t("modeAlways")}</option>
              <option value="off_hours">{t("modeOffHours")}</option>
            </select>
            <label className="block text-sm">
              {t("hours")}
              <span className="mt-1 flex gap-2">
                <input name="from" type="time" defaultValue={tenant.work_hours.from} className={input} />
                <input name="to" type="time" defaultValue={tenant.work_hours.to} className={input} />
              </span>
            </label>
            <fieldset className="text-sm">
              <legend>{t("days")}</legend>
              <div className="mt-1 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <label key={d} className="flex items-center gap-1">
                    <input type="checkbox" name="days" value={d} defaultChecked={tenant.work_hours.days.includes(d)} />
                    {dayNames[d]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </Card>
        <button className={button}>{t("save")}</button>
      </form>
    </CabinetShell>
  );
}
