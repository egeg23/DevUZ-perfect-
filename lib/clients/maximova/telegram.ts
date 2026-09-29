import { roadFetch } from "@/lib/egress.mjs";

/**
 * Бот Дарьи — отдельный от бота студии.
 *
 * Свой токен, свой секрет, свой список администраторов. Родители видят
 * школу Дарьи, а не DevUz; и когда сайт переедет на её сервер, бот уедет
 * вместе с ним сменой пары переменных.
 *
 * Исходящие запросы — через roadFetch: сервер в России, и до Telegram отсюда
 * то есть прямая дорога, то только через прокси (см. lib/egress.mjs). При
 * переезде на сервер Дарьи этот модуль копируется вместе с сайтом.
 */

export type BotConfig = {
  token: string;
  username: string;
  secret: string;
  admins: number[];
};

/** Настроен ли бот. Нет — сайт честно говорит, что вход и уведомления ещё не подключены. */
export function botConfig(env: Record<string, string | undefined> = process.env): BotConfig | null {
  const token = env.MAXIMOVA_BOT_TOKEN || "";
  const username = (env.MAXIMOVA_BOT_USERNAME || "").replace(/^@/, "");
  const secret = env.MAXIMOVA_BOT_SECRET || "";
  if (!token || !username || !secret) return null;
  const admins = (env.MAXIMOVA_ADMIN_TG_IDS || "")
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => Number.isSafeInteger(n) && n > 0);
  return { token, username, secret, admins };
}

/** Ссылка, по которой родитель подтверждает вход: бот получит /start login_<токен>. */
export function loginLink(username: string, loginToken: string): string {
  return `https://t.me/${username}?start=login_${loginToken}`;
}

/** Экранирование под parse_mode HTML. */
export function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// `||`, а не `??`: docker-compose передаёт незаданную переменную пустой строкой.
const apiBase = () => process.env.TELEGRAM_API_BASE || "https://api.telegram.org";

export async function sendMessage(
  config: BotConfig,
  chatId: number,
  text: string,
  extra: Record<string, unknown> = {},
): Promise<boolean> {
  try {
    const response = await roadFetch(`${apiBase()}/bot${config.token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...extra,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
