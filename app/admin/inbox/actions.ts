"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/admin/guard";
import { seesBotInbox } from "@/lib/admin/inbox";
import { writeToBotChat } from "@/lib/qualify/bot-inbox-store";

/**
 * Ответ клиенту бота из «Входящих» (lib/admin/inbox.ts): только владельцу
 * и руководителю — им же приходит «📩 Обращение в бота». Уходит от бота
 * студии теми же проверками, что «Клиенту от бота студии» в карточке.
 * Ответ на касание отсюда — sendFromCardAction карточки лида.
 */
export async function replyBotAction(chatId: number, body: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const staff = await requireStaff();
  if (!seesBotInbox(staff.role)) return { ok: false, reason: "forbidden" };
  const result = await writeToBotChat({ chat: Number(chatId), staff, text: String(body ?? "") });
  revalidatePath("/admin/inbox");
  return result === "bot_sent" ? { ok: true } : { ok: false, reason: result };
}
