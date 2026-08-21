import { priorityBadge } from "@/lib/qualify/scoring";
import type { ChatMessage, ScoredLead } from "@/lib/qualify/types";

const API = "https://api.telegram.org/bot";

/** Экранирование под parse_mode: HTML — иначе имя с «<» ломает всё сообщение. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function line(label: string, value: string): string {
  const clean = value?.trim();
  return `<b>${label}:</b> ${esc(clean || "не выяснено")}`;
}

/**
 * Карточка лида для отдела продаж.
 *
 * Формат подчинён одному сценарию: менеджер видит уведомление на телефоне и
 * должен за пять секунд решить, брать ли в работу прямо сейчас. Поэтому
 * приоритет и балл идут первой строкой, а резюме по восьми пунктам — сразу
 * следом, без разворачивания.
 */
export function formatLeadCard(lead: ScoredLead): string {
  const s = lead.summary;
  const bant = `${lead.budget} · ${lead.authority} · ${lead.need} · ${lead.timing}`;

  return [
    `${priorityBadge(lead)} · <b>${lead.grade}</b> · ${lead.score}/100`,
    "",
    line("Клиент", s.client),
    line("Запрос", s.request),
    line("Ниша", s.niche),
    line("Экспертность", s.expertise),
    line("Бюджет", s.budget),
    line("ЛПР", s.authority),
    line("Потребность", s.need),
    line("Срочность", s.timing),
    "",
    `<b>Связь:</b> ${esc(lead.contact_handle || "не оставил")}`,
    `<b>ICP:</b> Tier ${lead.niche_tier} · экспертность ${lead.expertise} · BANT ${bant}`,
    lead.notes?.trim() ? `\n<b>Заметки:</b> ${esc(lead.notes)}` : "",
    `\n<i>Язык диалога: ${lead.locale.toUpperCase()}</i>`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Расшифровка диалога отдельным сообщением — менеджеру нужен контекст. */
export function formatTranscript(messages: ChatMessage[]): string {
  const body = messages
    .map((m) => `${m.role === "user" ? "👤" : "🤖"} ${esc(m.content)}`)
    .join("\n\n");
  return `<b>Диалог с AI-менеджером</b>\n\n${body}`;
}

async function call(method: string, payload: unknown): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_SALES_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const response = await fetch(`${API}${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error("telegram", method, response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("telegram", method, error);
    return false;
  }
}

/**
 * Отправляет лида в чат отдела продаж.
 *
 * Возвращает false, а не бросает: если Telegram недоступен, посетитель не
 * должен увидеть ошибку — лид уже сохранён в базе, и менеджер его не потеряет.
 */
export async function sendLead(
  lead: ScoredLead,
  transcript: ChatMessage[],
  leadId: string,
): Promise<boolean> {
  const chatId = process.env.TELEGRAM_SALES_CHAT_ID;
  if (!chatId) return false;

  // Архивным лидам уведомление не шлём: горячие теряются в потоке отказов.
  const silent = lead.priority === "nurture" || lead.priority === "archive";

  const sent = await call("sendMessage", {
    chat_id: chatId,
    text: formatLeadCard(lead),
    parse_mode: "HTML",
    disable_notification: silent,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Взять в работу", callback_data: `take:${leadId}` },
          { text: "💬 Диалог", callback_data: `chat:${leadId}` },
        ],
        [{ text: "🗄 Отклонить", callback_data: `drop:${leadId}` }],
      ],
    },
  });

  if (sent && transcript.length) {
    await call("sendMessage", {
      chat_id: chatId,
      text: formatTranscript(transcript).slice(0, 4000),
      parse_mode: "HTML",
      disable_notification: true,
    });
  }

  return sent;
}

export async function answerCallback(id: string, text: string): Promise<void> {
  await call("answerCallbackQuery", { callback_query_id: id, text });
}

export async function editCardFooter(
  chatId: number | string,
  messageId: number,
  original: string,
  footer: string,
): Promise<void> {
  await call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: `${original}\n\n${footer}`,
    parse_mode: "HTML",
  });
}
