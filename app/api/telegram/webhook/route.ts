import { answerCallback, editCardFooter } from "@/lib/qualify/telegram";
import { updateLeadStatus } from "@/lib/qualify/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Кнопки под карточкой лида: «Взять в работу», «Диалог», «Отклонить».
 *
 * Подлинность запроса проверяется секретом, который Telegram присылает в
 * заголовке. Тот же секрет передаётся при вызове setWebhook — без этой
 * проверки любой, кто узнал адрес вебхука, смог бы менять статусы лидов.
 */
export async function POST(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const provided = request.headers.get("x-telegram-bot-api-secret-token");

  if (!expected || provided !== expected) {
    return new Response("forbidden", { status: 403 });
  }

  let update: {
    callback_query?: {
      id: string;
      data?: string;
      message?: { message_id: number; chat: { id: number }; text?: string };
      from?: { first_name?: string; username?: string };
    };
  };

  try {
    update = await request.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const query = update.callback_query;
  if (!query?.data) return new Response("ok");

  const [action, leadId] = query.data.split(":");
  const manager = query.from?.username
    ? `@${query.from.username}`
    : query.from?.first_name || "менеджер";

  try {
    if (action === "take") {
      await updateLeadStatus(leadId, "taken", manager);
      await answerCallback(query.id, "Лид закреплён за вами");
      if (query.message?.text) {
        await editCardFooter(
          query.message.chat.id,
          query.message.message_id,
          query.message.text,
          `✅ <b>В работе у ${manager}</b>`,
        );
      }
    } else if (action === "drop") {
      await updateLeadStatus(leadId, "dropped", manager);
      await answerCallback(query.id, "Лид отклонён");
      if (query.message?.text) {
        await editCardFooter(
          query.message.chat.id,
          query.message.message_id,
          query.message.text,
          `🗄 <b>Отклонён — ${manager}</b>`,
        );
      }
    } else {
      // «Диалог» — расшифровка уже приходит следующим сообщением сразу за
      // карточкой, поэтому кнопка просто подсказывает, где смотреть.
      await answerCallback(query.id, "Расшифровка диалога — сообщением ниже");
    }
  } catch (error) {
    console.error("telegram webhook", error);
    await answerCallback(query.id, "Не удалось обновить статус");
  }

  return new Response("ok");
}
