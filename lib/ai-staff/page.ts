import { notFound } from "next/navigation";

import { canConfigure, requireTenant } from "@/lib/ai-staff/auth";
import { cabinetT } from "@/lib/ai-staff/cabinet-locale";
import { serviceEnabled } from "@/lib/ai-staff/store";

/**
 * Начало каждой страницы кабинета: сервис включён, человек вошёл, кабинет
 * открыт, язык выбран. Проверка — на странице, а не в layout: layout
 * кэшируется отдельно и при переходах может не выполниться.
 */
export async function cabinetPage(opts: { owner?: boolean } = {}) {
  if (!(await serviceEnabled())) notFound();
  const cabinet = await requireTenant();
  if (opts.owner && !canConfigure(cabinet.role)) notFound();
  const { locale, t } = await cabinetT(cabinet.tenant.locale);
  return { ...cabinet, locale, t, configure: canConfigure(cabinet.role) };
}
