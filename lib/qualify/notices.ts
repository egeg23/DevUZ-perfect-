import { serviceClient } from "@/lib/supabase";

/**
 * Где лежат копии карточки лида: чат и номер сообщения.
 *
 * Карточка уходит всей команде, каждому в личку, и кнопка «Взять в работу»
 * меняла надпись только там, где её нажали. Остальные видели живые кнопки у
 * уже занятого лида — и узнавали об этом, только нажав, а иногда уже начав
 * писать клиенту. Переписать все копии можно, только зная, где они: Telegram
 * правит сообщение по чату и номеру, а номер есть лишь в ответе на отправку.
 */
export type Notice = { chatId: string; messageId: number };

/**
 * Запомнить, куда ушли копии.
 *
 * Не бросает: карточка уже доставлена, и сбой записи не должен превращать
 * доставленный лид в ошибку. Худшее, что случится, — у этих копий кнопки
 * не погаснут сами, как было до этой таблицы.
 */
export async function rememberNotices(leadId: string, sent: readonly Notice[]): Promise<void> {
  if (!sent.length) return;
  const db = serviceClient();
  if (!db) return;

  const { error } = await db.from("lead_notices").upsert(
    sent.map((n) => ({ lead_id: leadId, chat_id: n.chatId, message_id: n.messageId })),
    { onConflict: "lead_id,chat_id,message_id", ignoreDuplicates: true },
  );
  if (error) console.error("notices: не запомнил копии карточки", error.message);
}

export async function noticesOf(leadId: string): Promise<Notice[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("lead_notices")
    .select("chat_id, message_id")
    .eq("lead_id", leadId)
    .limit(200);
  if (error) {
    console.error("notices: не прочитал копии карточки", error.message);
    return [];
  }
  return ((data as { chat_id: string; message_id: number }[] | null) ?? []).map((row) => ({
    chatId: String(row.chat_id),
    messageId: Number(row.message_id),
  }));
}
