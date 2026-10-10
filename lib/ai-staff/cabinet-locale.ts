import { cookies } from "next/headers";

import { CAB_LANG_COOKIE, isCabLocale, tr, type CabLocale } from "@/content/ai-staff/cabinet";

/** Язык кабинета: выбор человека (кука), иначе язык клиента, иначе русский. */
export async function cabinetLocale(fallback?: CabLocale): Promise<CabLocale> {
  const raw = (await cookies()).get(CAB_LANG_COOKIE)?.value;
  if (isCabLocale(raw)) return raw;
  return fallback ?? "ru";
}

export async function cabinetT(fallback?: CabLocale) {
  const locale = await cabinetLocale(fallback);
  return { locale, t: tr(locale) };
}
