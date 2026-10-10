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

type L = "ru" | "uz";

const CHANNEL_TITLE: Record<L, Record<string, string>> = {
  ru: { tg_business: "Telegram (ваш аккаунт)", tg_bot: "Telegram-бот", widget: "чат на сайте", test: "проверка в кабинете" },
  uz: { tg_business: "Telegram (sizning akkauntingiz)", tg_bot: "Telegram-bot", widget: "saytdagi chat", test: "kabinetdagi sinov" },
};

const CARD: Record<L, Record<string, string>> = {
  ru: {
    test: "Проверка",
    head: "Новая заявка",
    from: "Откуда",
    off: "в нерабочее время",
    name: "Имя",
    contact: "Контакт",
    need: "Нужно",
    budget: "Бюджет",
    when: "Когда",
    business: "Разговор у вас в Telegram: ответьте покупателю сами, ИИ в этом чате замолчит на 12 часов.",
    take: "✋ Беру",
    open: "Открыть в кабинете",
  },
  uz: {
    test: "Sinov",
    head: "Yangi ariza",
    from: "Qayerdan",
    off: "ish vaqtidan tashqari",
    name: "Ism",
    contact: "Kontakt",
    need: "Kerak",
    budget: "Byudjet",
    when: "Qachon",
    business: "Suhbat sizning Telegramingizda: xaridorga o'zingiz javob bering, sun'iy intellekt bu chatda 12 soat jim turadi.",
    take: "✋ Olaman",
    open: "Kabinetda ochish",
  },
};

export function leadCard(
  lead: Lead,
  conv: Pick<Conversation, "kind" | "customer_name" | "customer_handle" | "off_hours">,
  lang: L = "ru",
): string {
  const c = CARD[lang];
  const lines = [
    `${lead.test ? `🧪 <b>${c.test}</b> · ` : ""}<b>${c.head} ${esc(lead.request_no)}</b>`,
    `${c.from}: ${esc(CHANNEL_TITLE[lang][conv.kind] ?? conv.kind)}${conv.off_hours ? ` · ${c.off}` : ""}`,
  ];
  const name = lead.name || conv.customer_name;
  if (name) lines.push(`${c.name}: ${esc(name)}`);
  const contact = lead.contact || conv.customer_handle || "";
  if (contact) lines.push(`${c.contact}: ${esc(contact)}`);
  if (lead.need) lines.push(`${c.need}: ${esc(lead.need)}`);
  if (lead.budget) lines.push(`${c.budget}: ${esc(lead.budget)}`);
  if (lead.urgency) lines.push(`${c.when}: ${esc(lead.urgency)}`);
  if (lead.summary) lines.push("", esc(lead.summary));
  if (conv.kind === "tg_business") lines.push("", c.business);
  return lines.join("\n");
}

export function leadButtons(lead: Lead, lang: L = "ru"): InlineButton[][] {
  return [
    [{ text: CARD[lang].take, callback_data: `${TAKE_PREFIX}${lead.id}` }],
    [{ text: CARD[lang].open, url: `${siteUrl}/cabinet/leads` }],
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
  lang: L = "ru",
): Promise<boolean> {
  let delivered = false;
  for (const member of recipients(list)) {
    delivered = (await sendHtml(token, member.telegram_user_id, leadCard(lead, conv, lang), leadButtons(lead, lang))) || delivered;
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
