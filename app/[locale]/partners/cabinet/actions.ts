"use server";

import { redirect } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { alertOwners, alertPayoutRequest } from "@/lib/partners/bot";
import { isPerk, isTarget } from "@/lib/partners/rules";
import { currentPartner } from "@/lib/partners/session";
import { createLink, requestAgency, requestPayout, saveRequisites, setPayoutModel } from "@/lib/partners/store";
import { esc } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";

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

export async function switchModelAction(formData: FormData) {
  const locale = localeOf(formData);
  const partner = await currentPartner();
  if (!partner) redirect(`/${locale}/partners/cabinet`);

  const result = await setPayoutModel(partner, String(formData.get("model") ?? ""));
  back(locale, result.ok ? "model_ok" : `model_${result.reason}`, "model");
}

export async function requestAgencyAction(formData: FormData) {
  const locale = localeOf(formData);
  const partner = await currentPartner();
  if (!partner) redirect(`/${locale}/partners/cabinet`);

  const result = await requestAgency(partner, {
    name: String(formData.get("name") ?? ""),
    contact: String(formData.get("contact") ?? ""),
    website: String(formData.get("website") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (result.ok) {
    // Решение за владельцем: без подтверждения заказы агентства партнёру не идут.
    await alertOwners(
      [
        "🏢 <b>Партнёр подключает агентство</b>",
        `Партнёр: ${esc(partner.name)}${partner.username ? ` (@${esc(partner.username)})` : ""}`,
        `Агентство: ${esc(result.agency.name)} · ${esc(result.agency.contact ?? "—")}`,
        result.agency.website ? `Сайт: ${esc(result.agency.website)}` : "",
        "",
        "Подтвердите, если агентство с нами ещё не работало:",
        `${siteUrl}/admin/partners`,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  back(locale, result.ok ? "agency_ok" : `agency_${result.reason}`, "agencies");
}
