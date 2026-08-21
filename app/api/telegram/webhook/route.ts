import { answerCallback, markBriefHandled, sendMessage } from "@/lib/qualify/telegram";
import { updateLeadStatus } from "@/lib/qualify/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramChat = { id: number; type: string; title?: string; username?: string };

type Update = {
  message?: {
    text?: string;
    chat: TelegramChat;
    from?: { first_name?: string; username?: string };
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: { message_id: number; chat: { id: number }; text?: string };
    from?: { first_name?: string; username?: string };
  };
};

function managerName(from?: { first_name?: string; username?: string }): string {
  if (from?.username) return `@${from.username}`;
  return from?.first_name || "менеджер";
}

/**
 * Вебхук бота: команды и кнопки под брифом.
 *
 * Подлинность запроса проверяется секретом, который Telegram присылает в
 * заголовке. Тот же секрет передаётся при вызове setWebhook — без этой
 * проверки любой, кто узнает адрес вебхука, смог бы менять статусы лидов.
 */
export async function POST(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const provided = request.headers.get("x-telegram-bot-api-secret-token");

  if (!expected || provided !== expected) {
    return new Response("forbidden", { status: 403 });
  }

  let update: Update;
  try {
    update = await request.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  if (update.message) {
    await handleCommand(update.message);
    return new Response("ok");
  }

  if (update.callback_query) {
    await handleButton(update.callback_query);
  }

  return new Response("ok");
}

/**
 * Команды бота.
 *
 * Главная здесь — выдача chat_id. Пока вебхук не установлен, его можно
 * подсмотреть через getUpdates, но после установки этот метод перестаёт
 * отдавать обновления, и узнать id нового чата становится неоткуда. Поэтому
 * бот сообщает его сам — и в личке, и в группе, куда его добавили.
 */
async function handleCommand(message: NonNullable<Update["message"]>) {
  const text = (message.text ?? "").trim().toLowerCase();
  const chat = message.chat;
  const configured = process.env.TELEGRAM_SALES_CHAT_ID;
  const isTarget = configured && String(chat.id) === String(configured);

  if (text.startsWith("/start") || text.startsWith("/id")) {
    const where =
      chat.type === "private"
        ? "этот личный чат"
        : `группа «${chat.title ?? "без названия"}»`;

    const lines = [
      "<b>DevUz Studio · бот отдела продаж</b>",
      "",
      `Сюда приходят брифы по лидам с сайта: кто написал, что хочет, куда писать в ответ и с какой фразы начать.`,
      "",
      `<b>ID этого чата:</b> <code>${chat.id}</code>`,
      `Это ${where}.`,
      "",
      isTarget
        ? "✅ Брифы настроены именно на этот чат — всё готово."
        : "Чтобы брифы приходили сюда, впишите этот ID в переменную окружения <code>TELEGRAM_SALES_CHAT_ID</code> и перезапустите сайт.",
    ];

    await sendMessage(chat.id, lines.join("\n"));
    return;
  }

  if (text.startsWith("/help")) {
    await sendMessage(
      chat.id,
      [
        "<b>Команды</b>",
        "",
        "/id — показать ID этого чата",
        "/help — эта справка",
        "",
        "Брифы приходят сюда сами. Под каждым — кнопки «Взять в работу» и «Отклонить»: они помечают лида в базе и показывают остальным, что он уже занят.",
      ].join("\n"),
    );
  }
}

/** Кнопки под брифом: закрепить лида за собой или отклонить. */
async function handleButton(query: NonNullable<Update["callback_query"]>) {
  if (!query.data) return;

  const [action, leadId] = query.data.split(":");
  const manager = managerName(query.from);

  try {
    if (action === "take" || action === "drop") {
      const status = action === "take" ? "taken" : "dropped";
      await updateLeadStatus(leadId, status, manager);
      await answerCallback(
        query.id,
        action === "take" ? "Лид закреплён за вами" : "Лид отклонён",
      );

      if (query.message) {
        await markBriefHandled(
          query.message.chat.id,
          query.message.message_id,
          action === "take" ? `✅ В работе у ${manager}` : `🗄 Отклонён — ${manager}`,
        );
      }
      return;
    }

    if (action === "noop") {
      // Кнопка-статус под разобранным брифом: нажатие ничего не меняет, но
      // Telegram ждёт ответа, иначе у нажавшего висит «часики».
      await answerCallback(query.id, "Этот лид уже разобран");
      return;
    }

    await answerCallback(query.id, "Неизвестная команда");
  } catch (error) {
    console.error("telegram webhook", error);
    await answerCallback(query.id, "Не удалось обновить статус");
  }
}
