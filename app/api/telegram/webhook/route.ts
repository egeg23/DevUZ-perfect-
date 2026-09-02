import { botCopy } from "@/content/bot";
import { matchLocale, type Locale } from "@/lib/i18n";
import { runQualifyTurn } from "@/lib/qualify/engine";
import {
  claimHandoff,
  forgetSession,
  localeFromToken,
  saveSession,
  sessionFor,
  startSession,
  type BotSession,
} from "@/lib/qualify/handoff";
import { shouldMissPromise } from "@/lib/qualify/promise";
import {
  answerCallback,
  esc,
  markBriefHandled,
  sendMessage,
  sendPlain,
  typingIndicator,
} from "@/lib/qualify/telegram";
import { updateLeadStatus } from "@/lib/qualify/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramUser = { first_name?: string; username?: string; language_code?: string };
type TelegramChat = { id: number; type: string; title?: string; username?: string };

type Update = {
  message?: {
    text?: string;
    chat: TelegramChat;
    from?: TelegramUser;
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: { message_id: number; chat: { id: number }; text?: string };
    from?: TelegramUser;
  };
};

function managerName(from?: TelegramUser): string {
  if (from?.username) return `@${from.username}`;
  return from?.first_name || "менеджер";
}

/** Чат отдела продаж — единственное место, где бот показывает служебное. */
function isSalesChat(chatId: number): boolean {
  const configured = process.env.TELEGRAM_SALES_CHAT_ID;
  return Boolean(configured) && String(chatId) === String(configured);
}

/**
 * Вебхук бота.
 *
 * Подлинность запроса проверяется секретом, который Telegram присылает в
 * заголовке. Тот же секрет передаётся при вызове setWebhook — без этой
 * проверки любой, кто узнает адрес вебхука, смог бы менять статусы лидов.
 *
 * Дальше всё разведено по типу чата, и это главное правило файла: клиент
 * никогда не должен увидеть ничего служебного. Раньше `/start` в личке
 * рассказывал случайному человеку, что сюда приходят брифы по лидам, и
 * показывал ID чата — то есть первое, что видел потенциальный клиент, была
 * наша внутренняя кухня.
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

  try {
    if (update.message) {
      const chat = update.message.chat;

      if (isSalesChat(chat.id)) {
        await handleSales(update.message);
      } else if (chat.type !== "private") {
        // Группа, которая не настроена как отдел продаж. Единственное, что
        // здесь уместно, — отдать ID для настройки: бота в группу добавляют
        // руками, случайно туда не попадают. Разговор с клиентом в группе
        // не ведём никогда.
        await handleGroup(update.message);
      } else {
        await handleClient(update.message);
      }
      return new Response("ok");
    }

    if (update.callback_query) {
      await handleButton(update.callback_query);
    }
  } catch (error) {
    // Telegram повторяет доставку, пока не получит 200. Ошибка в обработке
    // одного сообщения не должна превращаться в бесконечный цикл ретраев.
    console.error("telegram webhook", error);
  }

  return new Response("ok");
}

/** Язык клиента: из настроек его Telegram, дальше — по умолчанию русский. */
function localeOf(from?: TelegramUser): Locale {
  return matchLocale(from?.language_code ?? null);
}

/** Контакт, по которому менеджер напишет в ответ. */
function handleOf(from: TelegramUser | undefined, chatId: number): string {
  if (from?.username) return `@${from.username}`;
  // Без username написать первым нельзя — Telegram это запрещает. Менеджер
  // должен знать об этом до того, как попробует.
  return `id ${chatId} (username не задан — ответить можно только в этом чате)`;
}

// ───────────────────────────────────────────────────────────────────────────
// Клиент
// ───────────────────────────────────────────────────────────────────────────

async function handleClient(message: NonNullable<Update["message"]>) {
  const chat = message.chat;
  const text = (message.text ?? "").trim();

  // Язык уже начатого разговора сильнее языка интерфейса Telegram. Человек
  // мог прийти с английской версии сайта, имея русский Telegram: отвечать
  // ему по-русски только потому, что так подписаны кнопки в его мессенджере,
  // — значит посреди разговора сменить язык без спроса.
  const existing = sessionFor(chat.id);
  const locale = existing?.locale ?? localeOf(message.from);
  const copy = botCopy(locale);

  if (text.startsWith("/start")) {
    const payload = text.slice("/start".length).trim();
    if (payload) {
      await resumeFromSite(chat.id, payload, message.from, locale);
      return;
    }
    console.log("handoff: /start без токена — холодный старт", { chatId: chat.id });
    if (!existing) startSession(chat.id, locale);
    await sendMessage(chat.id, copy.welcome);
    return;
  }

  if (text.startsWith("/help")) {
    await sendMessage(chat.id, copy.help);
    return;
  }

  // Режим первичной настройки. Пока чат отдела продаж не назначен, ID нужно
  // откуда-то взять: после установки вебхука getUpdates перестаёт отдавать
  // обновления, и другого способа не остаётся. Как только переменная задана,
  // команда снова становится обычной неизвестной — случайный посетитель ID
  // уже не увидит.
  if (text.startsWith("/id") && !process.env.TELEGRAM_SALES_CHAT_ID) {
    await sendMessage(
      chat.id,
      [
        "<b>DevUz Studio</b>",
        "",
        `<b>ID этого чата:</b> <code>${chat.id}</code>`,
        "",
        "Впишите его в <code>TELEGRAM_SALES_CHAT_ID</code> и перезапустите сайт — сюда начнут приходить брифы.",
      ].join("\n"),
    );
    return;
  }

  if (text.startsWith("/reset")) {
    // Сбрасывается переписка, а не язык: «начать заново» — про содержание
    // разговора, а не про то, на каком языке его вести.
    forgetSession(chat.id);
    startSession(chat.id, locale);
    await sendMessage(chat.id, copy.reset);
    return;
  }

  if (text.startsWith("/")) {
    await sendMessage(chat.id, copy.unknown);
    return;
  }

  if (!text) return;

  const session = sessionFor(chat.id) ?? startSession(chat.id, locale);
  await respond(chat.id, session, message.from, text);
}

/**
 * Продолжение разговора, начатого на сайте.
 *
 * Токен приходит первым же нажатием «Старт», поэтому человеку не нужно
 * ничего печатать: он видит продолжение той же беседы, а не новое знакомство.
 */
async function resumeFromSite(
  chatId: number,
  token: string,
  from: TelegramUser | undefined,
  fallbackLocale: Locale,
) {
  const session = claimHandoff(token, chatId);
  // По этой строке в логах видно, чем кончилась передача: заявленный токен
  // подхватился или протух. Без неё «почему-то не продолжается» превращается
  // в гадание.
  console.log("handoff:", session ? "подхвачен" : "не найден", { token, chatId });

  if (!session) {
    // Токен одноразовый и живёт час: протух — начинаем как с новым человеком,
    // но без «здравствуйте, чем помочь», а с признанием, что контекст потерян.
    // Язык при этом берём из самого токена: переписку восстановить нельзя, а
    // язык, на котором человек с нами говорил, известен и без неё.
    const locale = localeFromToken(token) ?? fallbackLocale;
    startSession(chatId, locale);
    await sendMessage(chatId, botCopy(locale).resumeLost);
    return;
  }

  const copy = botCopy(session.locale);

  if (session.qualified && session.requestNo) {
    // Разговор на сайте дошёл до конца: бриф уже у менеджера. Второй раз его
    // отправлять нельзя, а человеку нужен номер, за который можно держаться.
    session.resumed = true;
    saveSession(chatId, session);
    await sendMessage(chatId, copy.alreadySent(session.requestNo));
    return;
  }

  if (!session.transcript.length) {
    await sendMessage(chatId, copy.welcome);
    return;
  }

  // Реплика, описывающая то, что человек сделал: он не писал текст, он нажал
  // кнопку. В расшифровке для менеджера это читается ровно так же.
  const marker = copy.resumeMarker;

  // Если разговор оборвался на реплике клиента, дописываем пометку к ней, а
  // не отдельным ходом: две подряд реплики от user модель принимает, но в
  // расшифровке для менеджера это выглядит так, будто человек написал дважды.
  const last = session.transcript[session.transcript.length - 1];
  if (last?.role === "user") {
    session.transcript = [
      ...session.transcript.slice(0, -1),
      { role: "user", content: `${last.content}\n\n${marker}` },
    ];
    await respondToLast(chatId, session, from);
    return;
  }

  await respond(chatId, session, from, marker, { resuming: true });
}

/**
 * Ответ на реплику, которая уже лежит в истории.
 *
 * Нужен, когда добавлять новый ход нельзя: последним в переписке и так стоит
 * сообщение клиента, к которому мы только дописали пометку о переходе.
 */
async function respondToLast(
  chatId: number,
  session: BotSession,
  from: TelegramUser | undefined,
) {
  const tail = session.transcript[session.transcript.length - 1];
  const trimmed: BotSession = { ...session, transcript: session.transcript.slice(0, -1) };
  await respond(chatId, trimmed, from, tail.content, { resuming: true });
}

/** Одна реплика ассистента в личке клиента. */
async function respond(
  chatId: number,
  session: BotSession,
  from: TelegramUser | undefined,
  text: string,
  options: { resuming?: boolean } = {},
) {
  const copy = botCopy(session.locale);
  const history = [...session.transcript, { role: "user" as const, content: text }];

  // Гарантия двадцати секунд действует и здесь, но только на первой реплике
  // холодного разговора: продолжение с сайта уже получило свой отсчёт там.
  const hold =
    !session.discount && !session.fromSite && session.transcript.length === 0
      ? shouldMissPromise()
      : 0;

  const stopTyping = typingIndicator(chatId);
  let reply = "";

  try {
    if (hold > 0) {
      await new Promise((resolve) => setTimeout(resolve, hold));
      session.discount = true;
      await sendMessage(chatId, copy.discount);
    }

    const result = await runQualifyTurn({
      history,
      locale: session.locale,
      source: "telegram",
      alreadyQualified: session.qualified,
      discount: session.discount,
      channelNote: channelNote(from, chatId, options.resuming === true),
      // Поток здесь не нужен: Telegram показывает сообщение целиком, а
      // редактировать его на каждом токене — это гонка правок и мигающий
      // текст у клиента. Собираем ответ и отправляем один раз.
      onText: (chunk) => {
        reply += chunk;
      },
    });

    if (result.qualified) {
      session.qualified = true;
      session.requestNo = result.requestNo ?? session.requestNo;
    }
  } catch (error) {
    console.error("bot turn", error);
    stopTyping();
    await sendMessage(chatId, copy.error);
    return;
  }

  stopTyping();

  if (reply.trim()) {
    await sendPlain(chatId, reply);
    history.push({ role: "assistant", content: reply.trim() });
  } else {
    await sendMessage(chatId, copy.error);
  }

  session.transcript = history;
  session.resumed = true;
  saveSession(chatId, session);
}

function channelNote(from: TelegramUser | undefined, chatId: number, resuming: boolean): string {
  const contact = handleOf(from, chatId);
  const name = from?.first_name?.trim();

  const lines = [
    "## Канал: Telegram",
    "",
    "Ты отвечаешь в Telegram, а не в чате на сайте. Что меняется:",
    "",
    `- Контакт клиента уже известен: ${contact}. Не спрашивай его и подставь в contact_handle ровно это значение. В avoid_asking добавь «контакт — есть, пишет из Telegram».`,
    name ? `- Его зовут ${name} (так подписан профиль). Обращайся по имени, но если он представится иначе — верь ему, а не профилю.` : null,
    "- Пиши обычным текстом. Никакой разметки: звёздочки, решётки и подчёркивания здесь показываются как есть и выглядят как мусор.",
    "- Одно сообщение — одна мысль, три-четыре предложения. Длинную простыню в мессенджере не читают.",
  ];

  if (resuming) {
    lines.push(
      "",
      "Клиент только что перешёл сюда из чата на сайте — разговор выше вёл ты. Это не новое знакомство: не здоровайся как с незнакомцем и не начинай сначала.",
      "Последняя строка в переписке, взятая в квадратные скобки, — служебная пометка о нажатии кнопки, а не слова клиента. Не отвечай на неё и не делай выводов о языке по ней: язык разговора задан выше.",
      "Одной фразой покажи, что помнишь, о чём речь, и сразу задай следующий вопрос — тот, ответа на который ещё нет. Если для передачи менеджеру не хватает одной-двух деталей, спроси именно их и не растягивай.",
    );
  }

  return lines.filter(Boolean).join("\n");
}

// ───────────────────────────────────────────────────────────────────────────
// Служебное: только в чате отдела продаж и в группах
// ───────────────────────────────────────────────────────────────────────────

async function handleSales(message: NonNullable<Update["message"]>) {
  const text = (message.text ?? "").trim().toLowerCase();
  const chat = message.chat;

  // Переход с сайта в чат отдела продаж. Так бывает ровно в одном случае:
  // владелец проверяет переезд разговора со своего же аккаунта, а его личный
  // чат и назначен чатом отдела продаж. Клиентский диалог здесь не ведётся
  // намеренно — иначе брифы и переписка с клиентами смешались бы в одном
  // окне. Молча показывать служебное сообщение нельзя: выглядит как поломка.
  if (text.startsWith("/start") && text.slice("/start".length).trim()) {
    await sendMessage(
      chat.id,
      [
        "<b>Это чат отдела продаж</b>, а не клиентский диалог.",
        "",
        "Переход с сайта сюда не подхватывается специально: в этом чате живут брифы, и мешать их с перепиской клиентов нельзя.",
        "",
        "Чтобы проверить переезд разговора — откройте ссылку с другого аккаунта Telegram.",
        "",
        `Если хотите вести клиентов из личного чата, перенесите брифы в группу: создайте её, добавьте бота, отправьте там <code>/id</code> и впишите новый ID в <code>TELEGRAM_SALES_CHAT_ID</code>.`,
      ].join("\n"),
    );
    return;
  }

  if (text.startsWith("/start") || text.startsWith("/id")) {
    await sendMessage(
      chat.id,
      [
        "<b>DevUz Studio · бот отдела продаж</b>",
        "",
        "Сюда приходят брифы по лидам: кто написал, что хочет, куда писать в ответ и с какой фразы начать.",
        "",
        `<b>ID этого чата:</b> <code>${chat.id}</code>`,
        "✅ Брифы настроены именно на этот чат — всё готово.",
      ].join("\n"),
    );
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
        "",
        "Разговоры с клиентами идут в личках бота и сюда не попадают.",
      ].join("\n"),
    );
  }
}

/**
 * Группа, не настроенная как отдел продаж.
 *
 * Отдаём только ID и только на явную команду: без него настроить новый чат
 * нельзя — после установки вебхука getUpdates перестаёт отдавать обновления,
 * и узнать ID неоткуда.
 */
async function handleGroup(message: NonNullable<Update["message"]>) {
  const text = (message.text ?? "").trim().toLowerCase();
  if (!text.startsWith("/id") && !text.startsWith("/start")) return;

  // Если отдел продаж уже настроен, подсказка по настройке никому здесь не
  // нужна: чат отдела продаж один, а эта группа — чужая. Молчим.
  if (process.env.TELEGRAM_SALES_CHAT_ID) return;

  const chat = message.chat;
  await sendMessage(
    chat.id,
    [
      "<b>DevUz Studio</b>",
      "",
      `<b>ID этой группы:</b> <code>${chat.id}</code>`,
      // Название группы задают её участники, а сообщение уходит с parse_mode
      // HTML. Группа с именем «DevUz <Sales>» без экранирования означала бы,
      // что бот молча не отвечает именно на ту команду, которой его настраивают.
      `Группа «${esc(chat.title ?? "без названия")}».`,
      "",
      "Чтобы брифы приходили сюда, впишите этот ID в переменную окружения <code>TELEGRAM_SALES_CHAT_ID</code> и перезапустите сайт.",
    ].join("\n"),
  );
}

/** Кнопки под брифом: закрепить лида за собой или отклонить. */
async function handleButton(query: NonNullable<Update["callback_query"]>) {
  if (!query.data) return;

  // Кнопки живут только под брифом, то есть в чате отдела продаж. Нажатие
  // из любого другого места — либо ошибка, либо чужая попытка.
  const chatId = query.message?.chat.id;
  if (chatId !== undefined && !isSalesChat(chatId)) {
    await answerCallback(query.id, "Недоступно");
    return;
  }

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
