import { partnerCopy } from "@/content/partner-bot";
import type { Staff } from "@/lib/admin/session";
import {
  AGENCY_PERCENT,
  DEFAULT_MODEL,
  LIFETIME_BONUS,
  PERK_TITLE,
  agencyUntilDay,
  clientUntilDay,
  isPayoutModel,
  lifetimeOf,
  partnerPercent,
} from "@/lib/partners/rules";
import {
  attributeAgencyLead,
  attributeAgencyPartnerLead,
  attributeClientLead,
  attributeLead,
  notifyPartner,
  partnerById,
  assignLeadPartner,
  partnerHistory,
  promoFromText,
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
  lead: {
    contact_handle?: string | null;
    company?: string | null;
    /** Что клиент написал сам: «промокод AZIZ» в тексте засчитывается, если ссылки не было. */
    said?: string | null;
  },
): Promise<Attribution | null> {
  // Первым — само агентство-партнёр студии (15% с суммы проекта): оно пишет
  // нам напрямую, его контакт или название сошлись.
  const ownAgency = await attributeAgencyPartnerLead(leadId, {
    contactHandle: lead.contact_handle ?? null,
    company: lead.company ?? null,
  });
  if (ownAgency) {
    // С 50 000 $ заказов — 20% навсегда (rules.ts, lifetimeOf): новый проект уже после порога.
    const lifetime = lifetimeOf(ownAgency.id, await partnerHistory([ownAgency.id]));
    const percent = AGENCY_PERCENT + (lifetime.reached ? LIFETIME_BONUS : 0);
    await notifyPartner(
      ownAgency,
      `🏢 Заказ записан на ваше агентство. ${percent}% с суммы проекта — ваши, когда клиент оплатит проект целиком.`,
    );
    return { partner: ownAgency, link: null, reason: null };
  }

  // Потом — агентство партнёра на субподряде. Его заказы — партнёра
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

  // Ссылки не было — может, клиент назвал промокод словами («промокод
  // AZIZ»). Только если лид ещё ничей: клиент того, кто записан первым.
  let code = attribution.code;
  let spoken = false;
  if (!code && lead.said) {
    const word = await promoFromText(lead.said);
    if (word && !(await leadHasPartner(leadId))) {
      code = word;
      spoken = true;
    }
  }

  const result = code
    ? await attributeLead(leadId, code, {
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
      spoken
        ? `🤝 Клиент назвал ваш промокод ${esc(code ?? "")}: пришёл ${who}.${perk}\nКогда проект будет оплачен целиком, начисление появится в /ref.`
        : `🤝 По вашей ссылке пришёл ${who}.${perk}\nКогда проект будет оплачен целиком, начисление появится в /ref.`,
    );
    return result;
  }

  // Последним — клиент, которого партнёр закрепил вручную по ИНН. Ссылка и
  // агентство, если сработали, важнее; не засчитанная ссылка — нет.
  const fromClient = await attributeClientAndNotify(leadId);
  return fromClient ?? result;
}

async function leadHasPartner(leadId: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return true;
  const { data } = await db.from("leads").select("partner_id").eq("id", leadId).maybeSingle();
  return Boolean(data?.partner_id);
}

/**
 * «Промокод или кто привёл» — менеджер вписал в карточку лида или при
 * «Добавить лид вручную». Засчитано — партнёру строка в бот, как по ссылке.
 */
export async function assignAndNotify(
  leadId: string,
  raw: string,
  staff: Staff,
  ip: string,
): ReturnType<typeof assignLeadPartner> {
  const result = await assignLeadPartner(leadId, raw, staff, ip);
  if (result.ok && !result.attribution.reason) {
    const db = serviceClient();
    const { data } = db ? await db.from("leads").select("company").eq("id", leadId).maybeSingle() : { data: null };
    const company = String(data?.company ?? "").trim();
    const who = company ? `«${esc(company)}»` : "новый клиент";
    const link = result.attribution.link;
    const perk = link && link.perk !== "none" ? `\nОбещанный бонус: ${PERK_TITLE[link.perk]}.` : "";
    await notifyPartner(
      result.attribution.partner,
      `🤝 Ваш клиент записан на вас: ${who} назвал менеджеру ваш промокод.${perk}\nКогда проект будет оплачен целиком, начисление появится в /ref.`,
    );
  }
  return result;
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
  const agency = partner.kind === "agency";
  const model = agency ? "turnover" : isPayoutModel(project.partner_model) ? project.partner_model : DEFAULT_MODEL;
  const percent =
    accrual?.percent ??
    partnerPercent({ projectPercent: null, partnerOverride: partner.percent_override, amountUsd, model, agency });
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
