import { randomKey, sealToken } from "@/lib/ai-staff/crypto";
import { PLANS } from "@/lib/ai-staff/plans";
import * as store from "@/lib/ai-staff/store";
import { tg } from "@/lib/ai-staff/telegram";
import { appSecret } from "@/lib/secrets";
import { siteUrl } from "@/lib/seo";

/**
 * Подключение каналов: бот клиента по токену и наш бот сервиса.
 *
 * Бот клиента: токен проверяется у Telegram (getMe), вебхук ставится на
 * адрес с id канала и своим секретом, токен хранится зашифрованным.
 * Отключение снимает вебхук — бот клиента остаётся его ботом.
 */

export const TOKEN_SHAPE = /^\d{5,15}:[\w-]{30,60}$/;

export type ConnectError = "bad_token" | "no_key" | "limit" | "taken" | "webhook";

/** Сколько каналов уже работает: тариф «Старт» — один. */
export function channelsLeft(plan: keyof typeof PLANS, list: readonly store.Channel[], kind: store.ChannelKind): number {
  const active = list.filter((c) => c.status === "active" && c.kind !== kind).length;
  return PLANS[plan].channels - active - 1;
}

export async function connectBot(tenant: store.Tenant, token: string): Promise<{ ok: true; username: string } | { ok: false; why: ConnectError }> {
  const clean = token.trim();
  if (!TOKEN_SHAPE.test(clean)) return { ok: false, why: "bad_token" };
  const key = await appSecret("AI_STAFF_KEY");
  if (!key) return { ok: false, why: "no_key" };
  if (channelsLeft(tenant.plan, await store.channels(tenant.id), "tg_bot") < 0) return { ok: false, why: "limit" };

  const me = await tg<{ id: number; username: string; is_bot: boolean }>(clean, "getMe", {});
  if (!me.ok || !me.result.is_bot) return { ok: false, why: "bad_token" };

  const hookSecret = randomKey(24);
  let channel: store.Channel;
  try {
    channel = await store.addBotChannel(tenant.id, {
      botId: String(me.result.id),
      username: me.result.username,
      tokenEnc: sealToken(clean, key),
      hookSecret,
    });
  } catch (error) {
    return { ok: false, why: (error as Error).message === "bot_taken" ? "taken" : "webhook" };
  }
  const hook = await tg(clean, "setWebhook", {
    url: `${siteUrl}/api/ai-staff/bot/${channel.id}/${hookSecret}`,
    secret_token: hookSecret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
  if (!hook.ok) {
    await store.setChannelStatus(tenant.id, channel.id, "error", hook.description.slice(0, 200));
    return { ok: false, why: "webhook" };
  }
  return { ok: true, username: me.result.username };
}

export async function disconnectBot(tenant: store.Tenant, channel: store.Channel, token: string | null): Promise<void> {
  if (token) await tg(token, "deleteWebhook", {});
  await store.setChannelStatus(tenant.id, channel.id, "off");
}

/**
 * Наш бот сервиса: вебхук с business-обновлениями и команды. Нажимает
 * владелец студии в панели, когда положил токен в хранилище.
 */
export async function setupServiceBot(): Promise<{ ok: boolean; detail: string; username?: string; business?: boolean }> {
  const token = await appSecret("AI_STAFF_BOT_TOKEN");
  const secret = await appSecret("AI_STAFF_WEBHOOK_SECRET");
  if (!token) return { ok: false, detail: "нет AI_STAFF_BOT_TOKEN" };
  if (!secret || secret.length < 16) return { ok: false, detail: "нет AI_STAFF_WEBHOOK_SECRET (от 16 знаков)" };
  const me = await tg<{ username: string; can_connect_to_business?: boolean }>(token, "getMe", {});
  if (!me.ok) return { ok: false, detail: `getMe: ${me.description}` };
  const hook = await tg(token, "setWebhook", {
    url: `${siteUrl}/api/ai-staff/tg/${secret}`,
    secret_token: secret,
    allowed_updates: ["message", "callback_query", "business_connection", "business_message"],
  });
  if (!hook.ok) return { ok: false, detail: `setWebhook: ${hook.description}`, username: me.result.username };
  await tg(token, "setMyCommands", { commands: [{ command: "start", description: "Открыть кабинет" }] });
  return { ok: true, detail: "ok", username: me.result.username, business: me.result.can_connect_to_business === true };
}

/** Имя бота сервиса для ссылок в кабинете: из .env или спросить у Telegram. */
let botName: { value: string | null; at: number } | null = null;
export async function serviceBotUsername(): Promise<string | null> {
  const fromEnv = (await appSecret("AI_STAFF_BOT_USERNAME"))?.replace(/^@/, "");
  if (fromEnv) return fromEnv;
  if (botName && Date.now() - botName.at < 3_600_000) return botName.value;
  const token = await appSecret("AI_STAFF_BOT_TOKEN");
  const me = token ? await tg<{ username: string }>(token, "getMe", {}) : null;
  botName = { value: me?.ok ? me.result.username : null, at: Date.now() };
  return botName.value;
}
