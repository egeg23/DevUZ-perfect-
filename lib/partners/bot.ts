import { company } from "@/content/company";
import { partnerCopy, type PartnerStats } from "@/content/partner-bot";
import type { Locale } from "@/lib/i18n";
import { botLink, linkUrl, partnerPercent, withdrawOpens } from "@/lib/partners/rules";
import {
  createLink,
  ensurePartner,
  partnerByTelegram,
  requestPayout,
  summarize,
  type Partner,
  type PartnerSummary,
  type TelegramIdentity,
} from "@/lib/partners/store";
import { sendMessage } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Партнёрская программа в боте: /ref и /payout.
 *
 * Открыта всем, кто пишет боту в личку: регистрация — это и есть первая
 * команда /ref. Сотрудник, клиент, блогер — здесь без разницы: у каждого
 * своя ссылка и свой баланс.
 */

export type PartnerCommand = "ref" | "payout";

export function partnerCommand(text: string | undefined | null): PartnerCommand | null {
  const first = (text ?? "").trim().toLowerCase().split(/\s+/)[0]?.split("@")[0] ?? "";
  if (first === "/ref" || first === "/partner" || first === "/partners") return "ref";
  if (first === "/payout") return "payout";
  return null;
}

function statsOf(summary: PartnerSummary): PartnerStats {
  const { partner, balance, links } = summary;
  return {
    earned: balance.earned,
    frozen: balance.frozen,
    paid: balance.paid,
    available: balance.available,
    leads: summary.leads,
    paidProjects: summary.paidProjects,
    proven: summary.proven,
    percent: partnerPercent({
      projectPercent: null,
      partnerOverride: partner.percent_override,
      proven: summary.proven,
    }),
    links: links.map((l) => ({
      code: l.code,
      label: l.is_default ? null : l.label,
      clicks: l.clicks,
      leads: l.leads,
      url: linkUrl(siteUrl, l.code),
    })),
  };
}

/** Владельцы в Telegram — кому сказать о заявке на выплату. */
async function adminChatIds(): Promise<number[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("staff")
    .select("telegram_user_id")
    .eq("role", "admin")
    .eq("is_active", true);
  return (data ?? []).map((row) => Number(row.telegram_user_id)).filter((id) => Number.isFinite(id));
}

export async function handlePartnerCommand(
  chatId: number,
  from: TelegramIdentity,
  text: string,
  locale: Locale,
): Promise<void> {
  const copy = partnerCopy(locale);
  const command = partnerCommand(text);
  if (!command) return;

  const existed = await partnerByTelegram(from.id);
  const partner = await ensurePartner(from);
  if (!partner) {
    await sendMessage(chatId, copy.unavailable);
    return;
  }

  if (command === "ref") {
    await handleRef(chatId, partner, existed !== null, text, copy);
    return;
  }
  await handlePayout(chatId, partner, text, copy);
}

async function handleRef(
  chatId: number,
  partner: Partner,
  existed: boolean,
  text: string,
  copy: ReturnType<typeof partnerCopy>,
): Promise<void> {
  const args = text.trim().split(/\s+/).slice(1);

  if (args.length) {
    const result = await createLink(partner, args[0], args.slice(1).join(" ") || null, "none");
    await sendMessage(
      chatId,
      result.ok ? copy.linkCreated(result.link.code, linkUrl(siteUrl, result.link.code)) : copy.linkFailed(result.reason),
    );
    return;
  }

  if (!existed) {
    await sendMessage(chatId, copy.intro(linkUrl(siteUrl, partner.code), botLink(company.telegram, partner.code)));
  }
  const [summary] = await summarize([partner]);
  await sendMessage(chatId, copy.stats(statsOf(summary)));
}

async function handlePayout(
  chatId: number,
  partner: Partner,
  text: string,
  copy: ReturnType<typeof partnerCopy>,
): Promise<void> {
  const requisites = text.trim().split(/\s+/).slice(1).join(" ") || null;
  const result = await requestPayout(partner, requisites);

  if (!result.ok) {
    await sendMessage(
      chatId,
      copy.payoutFailed(result.reason, { available: result.balance?.available ?? 0, opens: withdrawOpens() }),
    );
    return;
  }

  await sendMessage(chatId, copy.payoutRequested(result.payout.amount_usd));

  const alert = [
    "💸 <b>Заявка на выплату партнёру</b>",
    `Партнёр: ${partner.name}${partner.username ? ` (@${partner.username})` : ""}`,
    `Сумма: ${result.payout.amount_usd.toLocaleString("ru-RU")} $`,
    `Куда: ${result.payout.requisites}`,
    "",
    `Решить: ${siteUrl}/admin/partners`,
  ].join("\n");
  for (const id of await adminChatIds()) {
    await sendMessage(id, alert);
  }
}
