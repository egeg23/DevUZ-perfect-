import { PERK_TITLE } from "@/lib/partners/rules";
import { attributeLead, notifyPartner, type Attribution } from "@/lib/partners/store";

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
  attribution: { code: string | null; telegramId?: number | null; chatId?: number | null },
  lead: { contact_handle?: string | null; company?: string | null },
): Promise<Attribution | null> {
  if (!attribution.code) return null;

  const result = await attributeLead(leadId, attribution.code, {
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
