import { notFound, redirect } from "next/navigation";

import { createCabinet, switchTenant } from "@/app/cabinet/actions";
import { Card, button, input } from "@/components/cabinet/shell";
import { requireCabinet } from "@/lib/ai-staff/auth";
import { cabinetT } from "@/lib/ai-staff/cabinet-locale";
import { serviceEnabled } from "@/lib/ai-staff/store";

export const dynamic = "force-dynamic";

/** Шаг 1 мастера: компания. Кабинет у человека может быть не один — тогда выбор. */
export default async function CabinetStart() {
  if (!(await serviceEnabled())) notFound();
  const cabinet = await requireCabinet();
  if (cabinet.session.staffId) redirect("/cabinet");
  const { t } = await cabinetT();
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-12">
      {cabinet.memberships.length ? (
        <Card title={t("switchTenant")}>
          <div className="flex flex-wrap gap-2">
            {cabinet.memberships.map((m) => (
              <form key={m.tenant_id} action={switchTenant}>
                <input type="hidden" name="tenant" value={m.tenant_id} />
                <button className="rounded-md border border-line px-3 py-2 text-sm hover:border-green-dim">{m.tenant.name}</button>
              </form>
            ))}
          </div>
        </Card>
      ) : null}
      <Card title={t("startTitle")} hint={t("startBody")}>
        <form action={createCabinet} className="space-y-4">
          <label className="block text-sm">
            {t("company")}
            <input name="name" required maxLength={120} className={`${input} mt-1`} />
          </label>
          <label className="block text-sm">
            {t("niche")}
            <input name="niche" maxLength={120} placeholder={t("nichePh")} className={`${input} mt-1`} />
          </label>
          <label className="block text-sm">
            {t("site")}
            <input name="site" type="url" placeholder="https://" className={`${input} mt-1`} />
          </label>
          <label className="block text-sm">
            {t("language")}
            <select name="locale" className={`${input} mt-1`}>
              <option value="ru">Русский</option>
              <option value="uz">O&apos;zbekcha</option>
            </select>
          </label>
          <button className={button}>{t("create")}</button>
        </form>
      </Card>
    </div>
  );
}
