import { after } from "next/server";

import { firstTime, handleClientBotUpdate, type BotUpdate } from "@/lib/ai-staff/bot";
import { openToken, safeEqual } from "@/lib/ai-staff/crypto";
import { channelForHook, serviceEnabled } from "@/lib/ai-staff/store";
import { appSecret } from "@/lib/secrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Вебхук бота клиента: клиент дал токен своего бота, и покупатели пишут
 * туда. Адрес — id канала и его собственный секрет; Telegram дублирует
 * секрет заголовком. Токен бота лежит зашифрованным и открывается здесь,
 * только чтобы ответить.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string; secret: string }> }) {
  const { id, secret } = await context.params;
  if (!(await serviceEnabled())) return new Response("not found", { status: 404 });
  const channel = await channelForHook(id);
  const header = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!channel?.hook_secret || !safeEqual(secret, channel.hook_secret) || !safeEqual(header, channel.hook_secret)) {
    return new Response("not found", { status: 404 });
  }
  if (channel.status !== "active" || !channel.token_enc) return Response.json({ ok: true });
  const key = await appSecret("AI_STAFF_KEY");
  const token = key ? openToken(channel.token_enc, key) : null;
  if (!token) return Response.json({ ok: true });

  const update = (await request.json().catch(() => null)) as BotUpdate | null;
  if (!update || !firstTime(channel.id, update.update_id)) return Response.json({ ok: true });

  after(async () => {
    try {
      await handleClientBotUpdate(token, channel, update);
    } catch (error) {
      console.error("ai-staff: бот клиента", channel.id, error);
    }
  });
  return Response.json({ ok: true });
}
