"use server";

import { redirect } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { alertPayoutRequest } from "@/lib/partners/bot";
import { isPerk, isTarget } from "@/lib/partners/rules";
import { currentPartner } from "@/lib/partners/session";
import { createLink, requestPayout, saveRequisites } from "@/lib/partners/store";

/**
 * Действия кабинета партнёра.
 *
 * Каждое само проверяет, кто вошёл: server action — обычный POST, и
 * отправить его можно мимо страницы. Итог — кодом в адресе: страница
 * серверная и показывает строку результата по нему.
 */

function localeOf(formData: FormData): Locale {
  const raw = String(formData.get("l") ?? "");
  return isLocale(raw) ? raw : defaultLocale;
}

function back(locale: Locale, result: string, anchor: string): never {
  redirect(`/${locale}/partners/cabinet?r=${result}#${anchor}`);
}

export async function createLinkAction(formData: FormData) {
  const locale = localeOf(formData);
  const partner = await currentPartner();
  if (!partner) redirect(`/${locale}/partners/cabinet`);

  const target = String(formData.get("target") ?? "/");
  const perk = String(formData.get("perk") ?? "none");
  const result = await createLink(
    partner,
    String(formData.get("code") ?? ""),
    String(formData.get("label") ?? "").trim() || null,
    isPerk(perk) ? perk : "none",
    isTarget(target) ? target : "/",
  );
  back(locale, result.ok ? "link_ok" : `link_${result.reason}`, "links");
}

export async function saveRequisitesAction(formData: FormData) {
  const locale = localeOf(formData);
  const partner = await currentPartner();
  if (!partner) redirect(`/${locale}/partners/cabinet`);

  const ok = await saveRequisites(partner, String(formData.get("requisites") ?? ""));
  back(locale, ok ? "pay_saved" : "pay_bad_requisites", "payout");
}

export async function requestPayoutAction(formData: FormData) {
  const locale = localeOf(formData);
  const partner = await currentPartner();
  if (!partner) redirect(`/${locale}/partners/cabinet`);

  const result = await requestPayout(partner, null);
  if (result.ok) await alertPayoutRequest(partner, result.payout);
  back(locale, result.ok ? "pay_ok" : `pay_${result.reason}`, "payout");
}
