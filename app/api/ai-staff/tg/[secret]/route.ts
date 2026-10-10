import { after } from "next/server";

import { firstTime, handleServiceUpdate, type BotUpdate } from "@/lib/ai-staff/bot";
import { safeEqual } from "@/lib/ai-staff/crypto";
import { serviceEnabled } from "@/lib/ai-staff/store";
import { appSecret } from "@/lib/secrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Ход модели идёт до полуминуты — уже после ответа Telegram. */
export const maxDuration = 60;

/**
 * Вебхук бота сервиса ИИ-сотрудников (lib/ai-staff/bot.ts).
 *
 * Чужой запрос отсекают два секрета: в адресе и в заголовке, который
 * Telegram ставит сам (secret_token в setWebhook). Ответ Telegram — сразу,
 * работа — после: иначе медленная модель заставит его повторять обновление.
 */
export async function POST(request: Request, context: { params: Promise<{ secret: string }> }) {
  const { secret } = await context.params;
  const expected = await appSecret("AI_STAFF_WEBHOOK_SECRET");
  const header = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!expected || !safeEqual(secret, expected) || !safeEqual(header, expected)) {
    return new Response("not found", { status: 404 });
  }
  if (!(await serviceEnabled())) return Response.json({ ok: true });
  const token = await appSecret("AI_STAFF_BOT_TOKEN");
  if (!token) return Response.json({ ok: true });

  const update = (await request.json().catch(() => null)) as BotUpdate | null;
  if (!update || !firstTime("service", update.update_id)) return Response.json({ ok: true });

  after(async () => {
    try {
      await handleServiceUpdate(token, update);
    } catch (error) {
      console.error("ai-staff: бот сервиса", error);
    }
  });
  return Response.json({ ok: true });
}
