import { sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Сообщение о блогерах тем, кто видит вкладку «Блогеры»: владельцу и
 * руководителю (активным, с Telegram), ботом студии. Менеджерам — нет:
 * раздела у них нет, и переписка с блогерами не их работа.
 */
export async function notifyDesk(html: string): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { data } = await db.from("staff").select("telegram_user_id").in("role", ["admin", "head"]).eq("is_active", true);
  let sent = 0;
  for (const row of data ?? []) {
    const chat = Number(row.telegram_user_id);
    if (Number.isFinite(chat) && chat > 0 && (await sendMessage(chat, html))) sent++;
  }
  return sent;
}
