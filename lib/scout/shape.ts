/**
 * Сообщение Telegram → то, что понимает наш разбор.
 *
 * Вынесено из раннера ради одного случая, который в раннере не проверить:
 * сообщение без чата.
 */

export type RawMessage = {
  id: number | bigint | { toString(): string };
  message?: string | null;
  out?: boolean;
  chat?: { id?: { toString(): string } | null; title?: string | null; username?: string | null } | null;
  sender?: { id?: { toString(): string } | null; username?: string | null } | null;
};

export type ShapedMessage = {
  chatId: number;
  chatTitle: string | null;
  chatUsername: string | null;
  messageId: number;
  authorTelegramId: number | null;
  authorUsername: string | null;
  text: string;
};

/**
 * Возвращает null, если у сообщения нет чата.
 *
 * Раньше чат подменялся пустым объектом, и дальше происходило вот что:
 * `""` → Number("") → 0. Сообщение ложилось в базу под chat_id = 0, а
 * уникальность у сигналов — по паре «чат + сообщение». Второе сообщение
 * из другого чата с тем же номером молча пропадало как дубль, ссылка была
 * null, заголовок null, и оператор получал сигнал из ниоткуда. Вероятность
 * невелика — в обновлениях Telegram сущность чата обычно есть, — но исход
 * это порча данных, а она необратима. Сообщение без чата лучше не читать
 * вовсе, чем записать неизвестно куда.
 */
export function shape(message: RawMessage): ShapedMessage | null {
  const chat = message.chat;
  if (!chat || chat.id === undefined || chat.id === null) return null;

  // У чата id хранится без префикса -100, а ссылки и наши ключи строятся
  // с ним. Приводим к тому виду, в котором его показывает сам Telegram.
  const rawId = chat.id.toString();
  const chatId = rawId.startsWith("-") ? Number(rawId) : Number(`-100${rawId}`);
  if (!Number.isFinite(chatId) || chatId === 0) return null;

  const sender = message.sender ?? {};

  return {
    chatId,
    chatTitle: chat.title ?? null,
    chatUsername: chat.username ?? null,
    messageId: Number(message.id.toString()),
    authorTelegramId: sender.id ? Number(sender.id.toString()) : null,
    authorUsername: sender.username ?? null,
    text: message.message ?? "",
  };
}
