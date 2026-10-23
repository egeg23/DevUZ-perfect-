import { statusFilterDict } from "@/content/admin-panel/home";
import type { PanelLocale } from "@/lib/admin/i18n";

/** Вторая строка лида в поиске: статус · номер заявки · чей — на языке панели. */
export function leadScopeLabel(locale: PanelLocale, status: string, requestNo: string | null, owner: string | null): string {
  const dict = statusFilterDict as Record<string, Record<PanelLocale, string> | undefined>;
  return [dict[status]?.[locale] ?? null, requestNo, owner].filter(Boolean).join(" · ");
}
