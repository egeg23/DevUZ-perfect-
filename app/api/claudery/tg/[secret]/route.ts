import { after } from "next/server";

import { handleClauderyUpdate, SECRET_KEY, type ClauderyUpdate } from "@/lib/claudery/store";
import { secretOk } from "@/lib/secret-ok";
import { appSecret } from "@/lib/secrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Повторы того же обновления (поллер не дождался 200) — не работа. */
const seen = new Set<number>();

/**
 * Вход бота Claudery (lib/claudery/store.ts). Обновления забирает поллер
 * (deploy/devuz-claudery-bot.service, bot/poller.mjs): Telegram до сервера
 * не дозванивается. Секрет — в адресе и в заголовке, оба сверяются
 * secretOk; секрета в хранилище нет — не пускаем никого.
 */
export async function POST(request: Request, context: { params: Promise<{ secret: string }> }) {
  const { secret } = await context.params;
  const expected = await appSecret(SECRET_KEY);
  const header = request.headers.get("x-telegram-bot-api-secret-token");
  if (!secretOk(secret, expected) || !secretOk(header, expected)) return new Response("not found", { status: 404 });

  const update = (await request.json().catch(() => null)) as ClauderyUpdate | null;
  if (!update || typeof update.update_id !== "number" || seen.has(update.update_id)) return Response.json({ ok: true });
  seen.add(update.update_id);
  if (seen.size > 2000) seen.delete(seen.values().next().value as number);

  after(() => handleClauderyUpdate(update).catch((error) => console.error("claudery: обновление", error)));
  return Response.json({ ok: true });
}
