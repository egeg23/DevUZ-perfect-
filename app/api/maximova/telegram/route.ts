import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { handleUpdate } from "@/lib/clients/maximova/bot";
import { botConfig, sendMessage } from "@/lib/clients/maximova/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Обновления бота Дарьи. Приносит их поллер с этого же сервера
 * (bot/poller.mjs, юнит devuz-maximova-bot.service) с секретом в заголовке —
 * тем же, что прислал бы Telegram вебхуком.
 */
export async function POST(request: NextRequest) {
  const config = botConfig();
  if (!config) return new NextResponse(null, { status: 503 });

  const given = Buffer.from(request.headers.get("x-telegram-bot-api-secret-token") || "");
  const expected = Buffer.from(config.secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return new NextResponse(null, { status: 403 });
  }

  const update = await request.json().catch(() => null);
  if (!update) return NextResponse.json({ ok: true });

  // Ответ Telegram не должен задерживать обработку следующего обновления
  // дольше, чем нужно: отправляем и не ждём повторов.
  for (const out of handleUpdate(update, config)) await sendMessage(config, out.chatId, out.text);
  return NextResponse.json({ ok: true });
}
