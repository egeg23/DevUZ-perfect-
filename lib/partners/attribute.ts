import { partnerCopy } from "@/content/partner-bot";
import { PERK_TITLE, partnerPercent } from "@/lib/partners/rules";
import { attributeLead, notifyPartner, partnerById, summarize, type Attribution } from "@/lib/partners/store";
import { esc } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Привязать сохранённый лид к партнёру и сказать партнёру об этом.
 *
 * Общая точка для трёх каналов — чат на сайте, форма, бот: у всех после
 * `saveLead` есть id лида и код, и все три не должны ронять заявку, если
 * что-то здесь не вышло. Партнёру уходит короткое сообщение без контактов
 * клиента: чей это клиент, партнёр и так знает, а лишнего знать не должен.
 */
export async function attributeAndNotify(
  leadId: string,
  attribution: { code: string | null; at?: number | null; telegramId?: number | null; chatId?: number | null },
  lead: { contact_handle?: string | null; company?: string | null },
): Promise<Attribution | null> {
  if (!attribution.code) return null;

  const result = await attributeLead(leadId, attribution.code, {
    refAt: attribution.at ? new Date(attribution.at * 1000) : null,
    telegramId: attribution.telegramId ?? null,
    chatId: attribution.chatId ?? null,
    contactHandle: lead.contact_handle ?? null,
    company: lead.company ?? null,
  });
  if (!result) return null;

  if (!result.reason) {
    const who = lead.company?.trim() ? `«${lead.company.trim()}»` : "новый клиент";
    const perk = result.link && result.link.perk !== "none" ? `\nОбещанный бонус: ${PERK_TITLE[result.link.perk]}.` : "";
    await notifyPartner(
      result.partner,
      `🤝 По вашей ссылке пришёл ${who}.${perk}\nКогда проект будет оплачен целиком, начисление появится в /ref.`,
    );
  }
  return result;
}

/**
 * Договор с приведённым клиентом подписан — сказать партнёру.
 *
 * Владелец: «обязательно трекинг реферальных ссылок, чтобы в случае
 * подписания договора он учитывался в расчётах и телеграм-бот ему тоже мог
 * эту инфу выдать». До этого партнёр узнавал о клиенте дважды: «пришла
 * заявка» и через месяцы «оплачено» — а между ними была тишина, и самый
 * понятный момент, подпись, проходил мимо.
 *
 * Доля — по той же формуле, что и начисление: сумма проекта × ставка его
 * ступени. Суммы по проекту ещё нет — берём сумму договора.
 */
export async function tellPartnerContractSigned(projectId: string, amountUsd: number | null): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { data: project } = await db
    .from("projects")
    .select("partner_id, partner_void_reason, client, title")
    .eq("id", projectId)
    .maybeSingle();
  if (!project?.partner_id || project.partner_void_reason) return;

  const partner = await partnerById(String(project.partner_id));
  if (!partner || partner.status !== "active" || !partner.telegram_user_id) return;

  const [summary] = await summarize([partner]);
  const accrual = summary?.accruals.find((a) => a.project_id === projectId) ?? null;
  const percent =
    accrual?.percent ??
    partnerPercent({ projectPercent: null, partnerOverride: partner.percent_override, amountUsd: amountUsd });
  const name = String(project.client ?? "").trim() || String(project.title ?? "").trim();

  await notifyPartner(
    partner,
    partnerCopy("ru").contractSigned(
      name ? `«${esc(name)}»` : "по вашей ссылке",
      amountUsd,
      accrual && accrual.amount_usd > 0
        ? accrual.amount_usd
        : amountUsd
          ? Math.round((amountUsd * percent) / 100)
          : null,
      percent,
    ),
  );
}
