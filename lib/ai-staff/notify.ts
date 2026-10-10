import { esc, sendHtml, type InlineButton } from "@/lib/ai-staff/telegram";
import type { Conversation, Lead, Member, Tenant } from "@/lib/ai-staff/store";
import { siteUrl } from "@/lib/seo";

/**
 * Заявка людям клиента в Telegram — через наш бот сервиса.
 *
 * Карточка — как у нейросотрудников amoCRM и у Jivo: кто, контакт, что
 * нужно, бюджет, срочность, резюме разговора и кнопка «Беру». Нажал один —
 * у остальных под карточкой видно, кто взял (lib/ai-staff/bot.ts).
 *
 * Пишет бот только тем, кто сам нажал у него /start: Telegram не даёт боту
 * писать первым. Владелец клиента нажимает его при регистрации, менеджер —
 * по ссылке-приглашению из кабинета.
 */

export const TAKE_PREFIX = "ail:take:";

const CHANNEL_TITLE: Record<string, string> = {
  tg_business: "Telegram (ваш аккаунт)",
  tg_bot: "Telegram-бот",
  widget: "чат на сайте",
  test: "проверка в кабинете",
};

export function leadCard(lead: Lead, conv: Pick<Conversation, "kind" | "customer_name" | "customer_handle" | "off_hours">): string {
  const lines = [
    `${lead.test ? "🧪 <b>Проверка</b> · " : ""}<b>Новая заявка ${esc(lead.request_no)}</b>`,
    `Откуда: ${esc(CHANNEL_TITLE[conv.kind] ?? conv.kind)}${conv.off_hours ? " · в нерабочее время" : ""}`,
  ];
  const name = lead.name || conv.customer_name;
  if (name) lines.push(`Имя: ${esc(name)}`);
  const contact = lead.contact || conv.customer_handle || "";
  if (contact) lines.push(`Контакт: ${esc(contact)}`);
  if (lead.need) lines.push(`Нужно: ${esc(lead.need)}`);
  if (lead.budget) lines.push(`Бюджет: ${esc(lead.budget)}`);
  if (lead.urgency) lines.push(`Когда: ${esc(lead.urgency)}`);
  if (lead.summary) lines.push("", esc(lead.summary));
  if (conv.kind === "tg_business") lines.push("", "Разговор у вас в Telegram: ответьте покупателю сами, ИИ в этом чате замолчит на 12 часов.");
  return lines.join("\n");
}

export function leadButtons(lead: Lead): InlineButton[][] {
  return [
    [{ text: "✋ Беру", callback_data: `${TAKE_PREFIX}${lead.id}` }],
    [{ text: "Открыть в кабинете", url: `${siteUrl}/cabinet/leads` }],
  ];
}

/** Кому слать: люди клиента с галочкой «получать заявки». */
export function recipients(list: readonly Member[]): Member[] {
  return list.filter((m) => m.notify);
}

export async function sendLeadCard(
  token: string,
  list: readonly Member[],
  lead: Lead,
  conv: Pick<Conversation, "kind" | "customer_name" | "customer_handle" | "off_hours">,
): Promise<boolean> {
  let delivered = false;
  for (const member of recipients(list)) {
    delivered = (await sendHtml(token, member.telegram_user_id, leadCard(lead, conv), leadButtons(lead))) || delivered;
  }
  return delivered;
}

/** Людям клиента: ИИ замолчал (лимит, срок, пауза) — раз в месяц, не на каждое сообщение. */
export function stopNotice(tenant: Pick<Tenant, "name">, why: string): string {
  const text: Record<string, string> = {
    limit: "закончились диалоги по тарифу на этот месяц",
    trial_over: "закончился пробный период",
    unpaid: "закончился оплаченный срок",
    paused: "работа ИИ поставлена на паузу",
    blocked: "кабинет заблокирован",
  };
  return (
    `<b>ИИ-сотрудник «${esc(tenant.name)}» сейчас не отвечает покупателям:</b> ${esc(text[why] ?? why)}.\n` +
    "Покупатели получают короткое «менеджер ответит». Продлить или сменить тариф — в кабинете, раздел «Тариф»."
  );
}
