/**
 * Telegram Bot API для ИИ-сотрудников — с токеном аргументом.
 *
 * У бота студии свой модуль (lib/qualify/telegram.ts) с токеном из .env.
 * Здесь ботов много: наш бот сервиса и боты клиентов, поэтому токен
 * передаётся в каждый вызов и нигде не запоминается.
 *
 * Ошибка Telegram не бросается: вызывающий получает null и решает сам —
 * ответ покупателю не должен ронять запись разговора.
 */

export type TgResult<T> = { ok: true; result: T } | { ok: false; status: number; description: string };

export async function tg<T = unknown>(
  token: string,
  method: string,
  body: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<TgResult<T>> {
  try {
    const response = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
    if (data?.ok) return { ok: true, result: data.result as T };
    return { ok: false, status: response.status, description: data?.description ?? `HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, status: 0, description: (error as Error).message };
  }
}

export function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export type InlineButton = { text: string; callback_data?: string; url?: string };

/** Сообщение покупателю: обычным текстом, без разметки — модель может написать «<». */
export async function sendText(
  token: string,
  chatId: number | string,
  text: string,
  options: { businessConnectionId?: string; fetchImpl?: typeof fetch } = {},
): Promise<boolean> {
  const result = await tg(
    token,
    "sendMessage",
    {
      chat_id: chatId,
      text: text.slice(0, 4000),
      ...(options.businessConnectionId ? { business_connection_id: options.businessConnectionId } : {}),
    },
    options.fetchImpl,
  );
  if (!result.ok) console.error("ai-staff: sendMessage", result.status, result.description);
  return result.ok;
}

/** Служебное сообщение людям клиента или владельцу: HTML и кнопки. */
export async function sendHtml(
  token: string,
  chatId: number | string,
  html: string,
  rows: InlineButton[][] = [],
  fetchImpl?: typeof fetch,
): Promise<boolean> {
  const result = await tg(
    token,
    "sendMessage",
    {
      chat_id: chatId,
      text: html.slice(0, 4000),
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      ...(rows.length ? { reply_markup: { inline_keyboard: rows } } : {}),
    },
    fetchImpl,
  );
  if (!result.ok) console.error("ai-staff: sendMessage(html)", result.status, result.description);
  return result.ok;
}

export async function typing(token: string, chatId: number | string, businessConnectionId?: string): Promise<void> {
  await tg(token, "sendChatAction", {
    chat_id: chatId,
    action: "typing",
    ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
  });
}
