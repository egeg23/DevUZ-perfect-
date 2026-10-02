import { partnerCopy } from "@/content/partner-bot";
import { DEFAULT_MODEL, PERK_TITLE, agencyUntilDay, clientUntilDay, isPayoutModel, partnerPercent } from "@/lib/partners/rules";
import {
  attributeAgencyLead,
  attributeClientLead,
  attributeLead,
  notifyPartner,
  partnerById,
  summarize,
  type Attribution,
} from "@/lib/partners/store";
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
  // Сначала — агентство партнёра на субподряде. Его заказы — партнёра
  // 12 месяцев с подтверждения, без окна в 30 дней и без ссылки: агентство
  // пишет нам напрямую.
  // Оно важнее куки: заказ пришёл от агентства, кто бы ни дал ссылку.
  const fromAgency = await attributeAgencyLead(leadId, {
    contactHandle: lead.contact_handle ?? null,
    company: lead.company ?? null,
  });
  if (fromAgency) {
    await notifyPartner(
      fromAgency.partner,
      `🏢 Новый заказ от агентства «${esc(fromAgency.agency.name)}». Он ваш — как и все заказы этого агентства до ${agencyUntilDay(fromAgency.agency.decided_at)}. Этапы — в кабинете: /cabinet.`,
    );
    return { partner: fromAgency.partner, link: null, reason: null };
  }

  const result = attribution.code
    ? await attributeLead(leadId, attribution.code, {
        refAt: attribution.at ? new Date(attribution.at * 1000) : null,
        telegramId: attribution.telegramId ?? null,
        chatId: attribution.chatId ?? null,
        contactHandle: lead.contact_handle ?? null,
        company: lead.company ?? null,
      })
    : null;

  if (result && !result.reason) {
    const who = lead.company?.trim() ? `«${lead.company.trim()}»` : "новый клиент";
    const perk = result.link && result.link.perk !== "none" ? `\nОбещанный бонус: ${PERK_TITLE[result.link.perk]}.` : "";
    await notifyPartner(
      result.partner,
      `🤝 По вашей ссылке пришёл ${who}.${perk}\nКогда проект будет оплачен целиком, начисление появится в /ref.`,
    );
    return result;
  }

  // Последним — клиент, которого партнёр закрепил вручную по ИНН. Ссылка и
  // агентство, если сработали, важнее; не засчитанная ссылка — нет.
  const fromClient = await attributeClientAndNotify(leadId);
  return fromClient ?? result;
}

/**
 * Лид — от клиента, закреплённого партнёром вручную? Привязать и сказать
 * партнёру — без контактов клиента, как и про остальные каналы.
 *
 * Отдельно от `attributeAndNotify`, потому что срабатывает и позже заявки:
 * менеджер вписал ИНН в карточку лида — и лид узнан.
 */
export async function attributeClientAndNotify(leadId: string): Promise<Attribution | null> {
  const hit = await attributeClientLead(leadId);
  if (!hit) return null;
  const term = hit.first
    ? `Это первая заявка от него — его заказы засчитываются вам 12 месяцев, до ${clientUntilDay(hit.client)}.`
    : `Его заказы засчитываются вам до ${clientUntilDay(hit.client)}.`;
  await notifyPartner(
    hit.partner,
    `🧾 Пришла заявка от закреплённого вами клиента «${esc(hit.client.name)}». ${term} Этапы — в кабинете: /cabinet.`,
  );
  return { partner: hit.partner, link: null, reason: null };
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
 * Доля — по той же формуле, что и начисление. С оборота она известна сразу:
 * сумма × ставка. От прибыли — только когда студия внесла себестоимость;
 * до этого называем процент, а не число: число без себестоимости было бы
 * обещанием, которое потом уменьшится.
 */
export async function tellPartnerContractSigned(projectId: string, amountUsd: number | null): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { data: project } = await db
    .from("projects")
    .select("partner_id, partner_void_reason, partner_model, dev_cost_usd, client, title")
    .eq("id", projectId)
    .maybeSingle();
  if (!project?.partner_id || project.partner_void_reason) return;

  const partner = await partnerById(String(project.partner_id));
  if (!partner || partner.status !== "active" || !partner.telegram_user_id) return;

  const [summary] = await summarize([partner]);
  const accrual = summary?.accruals.find((a) => a.project_id === projectId) ?? null;
  const model = isPayoutModel(project.partner_model) ? project.partner_model : DEFAULT_MODEL;
  const percent =
    accrual?.percent ??
    partnerPercent({ projectPercent: null, partnerOverride: partner.percent_override, amountUsd, model });
  const name = String(project.client ?? "").trim() || String(project.title ?? "").trim();
  const costsKnown = project.dev_cost_usd !== null && project.dev_cost_usd !== undefined;

  let share: number | null = null;
  if (model === "turnover") {
    share = accrual && accrual.amount_usd > 0 ? accrual.amount_usd : amountUsd ? Math.round((amountUsd * percent) / 100) : null;
  } else if (costsKnown && accrual && accrual.amount_usd > 0) {
    share = accrual.amount_usd;
  }

  await notifyPartner(
    partner,
    partnerCopy("ru").contractSigned(name ? `«${esc(name)}»` : "по вашей ссылке", amountUsd, share, percent, model),
  );
}
