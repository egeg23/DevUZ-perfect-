import { after } from "next/server";

import { botCopy } from "@/content/bot";
import { buyerBot } from "@/content/buyer-bot";
import { matchLocale, t, type Locale } from "@/lib/i18n";
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
import { loginCommand } from "@/lib/qualify/commands";
import { BIND_PREFIX, bindBuyer, buyerMessage } from "@/lib/store/buyer";
import { alreadyHandled } from "@/lib/qualify/seen-updates";
import { shouldMissPromise } from "@/lib/qualify/promise";
import {
  answerCallback,
  esc,
  markBriefHandled,
  sendMessage,
  sendPlain,
  typingIndicator,
} from "@/lib/qualify/telegram";
import { record } from "@/lib/admin/audit";
import {
  completeReminder,
  setStatus,
  snoozeReminder,
  takeLead,
} from "@/lib/admin/ownership";
import { issueLoginToken, staffByTelegramId } from "@/lib/admin/session";
import { siteUrl } from "@/lib/seo";
import { linkSignalsToLead, signalsByAuthor } from "@/lib/scout/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Разговор с моделью идёт до полуминуты, и всё это время работа живёт уже
 * после отданного ответа. Значение ограничивает именно её, а не время
 * ответа Telegram: ответ уходит сразу.
 */
export const maxDuration = 60;

type TelegramUser = {
  // Числовой id — единственное, что у человека в Telegram не меняется:
  // username он может освободить и занять заново, имя переписать. Вход в
  // панель опознаётся по нему.
  id?: number;
  first_name?: string;
  username?: string;
  language_code?: string;
};
type TelegramChat = { id: number; type: string; title?: string; username?: string };

type Update = {
  /** Номер обновления. У повтора он тот же — по нему повтор и опознаётся. */
  update_id?: number;
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
 * Ответ уходит сразу, а работа выполняется после него, и это не
 * оптимизация, а условие работоспособности. Telegram ждёт от вебхука
 * ответа считаные секунды; не дождавшись, он считает доставку неудачной,
 * присылает то же обновление снова, а после нескольких таких промахов
 * перестаёт слать обновления вовсе — на часы. Именно это и случилось:
 * getWebhookInfo показал «Connection timed out», и команды переставали
 * доходить.
 *
 * А ждать здесь есть чего: сообщение клиента поднимает разговор с моделью,
 * то есть десятки секунд. Разбирать его до ответа означало гарантированный
 * таймаут на каждом живом клиенте — и тишину вместо диалога.
 *
 * Цена размена названа честно: об ошибке, случившейся после ответа,
 * Telegram не узнает и повторять доставку не станет. Поэтому всё, что
 * внутри, обязано само дотягивать до конца или внятно падать в логи;
 * потерянное сообщение здесь дешевле, чем замолчавший на час бот.
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

  // Повтор того же обновления — не работа, а подтверждение. Telegram
  // присылает его, не дождавшись 200 вовремя, и без этой проверки каждая
  // такая пересылка выписывала ещё одну одноразовую ссылку входа.
  if (alreadyHandled(update.update_id)) {
    return new Response("ok");
  }

  after(() => route(update));

  return new Response("ok");
}

/**
 * Разбор обновления. Выполняется уже после того, как Telegram получил 200.
 *
 * Всё разведено по типу чата, и это главное правило файла: клиент никогда
 * не должен увидеть ничего служебного. Раньше `/start` в личке рассказывал
 * случайному человеку, что сюда приходят брифы по лидам, и показывал ID
 * чата — то есть первое, что видел потенциальный клиент, была наша
 * внутренняя кухня.
 */
async function route(update: Update): Promise<void> {
  try {
    if (update.message) {
      const chat = update.message.chat;

      // Вход в панель проверяется раньше всего остального: команду шлёт
      // сотрудник из своей лички, а личка сотрудника для остального кода —
      // либо чат отдела продаж, либо обычный клиент. И в том и в другом
      // случае /login разобрали бы неправильно.
      //
      // Приведение регистра обязательно, и это не придирка к стилю:
      // клавиатура телефона сама делает первую букву заглавной, человек
      // отправляет «/Login», и без него команда не совпадает ни с чем —
      // бот молчит, а сотрудник видит, что вход сломался.
      if (chat.type === "private" && loginCommand(update.message.text)) {
        await handleStaffLogin(update.message);
        return;
      }

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
      return;
    }

    if (update.callback_query) {
      await handleButton(update.callback_query);
    }
  } catch (error) {
    // Ответ Telegram уже отдан, повтора не будет — значит эта строка и есть
    // единственный след случившегося.
    console.error("telegram webhook", error);
  }
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
// Вход в панель
// ───────────────────────────────────────────────────────────────────────────

/**
 * Команда /login: бот выдаёт одноразовую ссылку в панель.
 *
 * Пароля нет и не будет. У команды из нескольких человек пароль
 * заканчивается одинаково — общим паролем в закреплённом сообщении, который
 * уходит вместе с первым уволившимся. Telegram уже знает, кто пишет, и
 * знает это надёжнее любого пароля: чтобы притвориться менеджером, нужен
 * его аккаунт, а не подсмотренная строка.
 *
 * Незнакомцу отвечаем тем же текстом, что и клиенту на неизвестную команду.
 * Ответ «вас нет в списке сотрудников» превратил бы бота в способ проверять
 * гипотезы о том, кто в студии работает.
 */
async function handleStaffLogin(message: NonNullable<Update["message"]>) {
  const chat = message.chat;
  const telegramId = message.from?.id ?? chat.id;
  const locale = localeOf(message.from);

  const staff = await staffByTelegramId(telegramId);
  if (!staff) {
    await sendMessage(chat.id, botCopy(locale).unknown);
    return;
  }

  const token = await issueLoginToken(staff.id);
  if (!token) {
    await sendMessage(
      chat.id,
      "Не смог выдать ссылку — база сейчас недоступна. Попробуйте через минуту.",
    );
    return;
  }

  await record("login.requested", {
    actorStaffId: staff.id,
    meta: { via: "telegram" },
  });

  // Ссылка уходит без превью (sendMessage выключает его для всех сообщений):
  // строя превью, Telegram сам открыл бы адрес и сжёг одноразовый токен
  // раньше человека. Второй рубеж — сама страница: обмен токена на сессию
  // происходит только по нажатию кнопки, то есть POST-ом.
  await sendMessage(
    chat.id,
    [
      "<b>Вход в панель</b>",
      "",
      `${siteUrl}/admin/login?t=${token}`,
      "",
      "Ссылка одноразовая и живёт 15 минут.",
    ].join("\n"),
  );
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

    // Привязка заказа проверяется раньше передачи диалога с сайта: у
    // payload теперь два вида, и различает их префикс. Без этой развилки
    // код привязки ушёл бы в resumeFromSite как токен разговора и там
    // молча не нашёлся бы — покупатель нажал бы кнопку и не получил ничего.
    if (payload.startsWith(BIND_PREFIX)) {
      const order = await bindBuyer(payload.slice(BIND_PREFIX.length), chat.id);
      await sendMessage(
        chat.id,
        order
          ? buyerMessage("bound", order.locale, {
              requestNo: order.requestNo,
              productSlug: order.productSlug,
            })
          : t(buyerBot.unknownCode, locale),
      );
      return;
    }

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

  // Перелив. Человек мог задать свой вопрос в публичном чате раньше, чем
  // написал нам, — и тогда первая линия уже знает, о чём речь, и не
  // начинает с нуля. Ищем только на холодном старте: в продолжающемся
  // разговоре контекст и так есть, а лишний запрос в базу на каждой
  // реплике оплачивается задержкой ответа.
  const scoutNote =
    session.transcript.length === 0 ? await scoutContext(message.from?.id) : null;

  await respond(chat.id, session, message.from, text, { scoutNote });
}

/**
 * Что мы знаем о человеке из публичных чатов.
 *
 * Возвращает пометку для системного промпта или null. Формулировка
 * важнее содержания: модели прямо запрещено показывать, откуда взялось
 * знание. «Я видел ваше сообщение в чате» — это то, после чего разговор
 * заканчивается, каким бы точным ни было попадание.
 */
async function scoutContext(telegramId: number | undefined): Promise<string | null> {
  if (!telegramId) return null;

  const signals = await signalsByAuthor(telegramId);
  if (!signals.length) return null;

  return [
    "## Что уже известно",
    "",
    "Этот человек раньше публично описывал свою задачу. Коротко, его словами:",
    "",
    ...signals.map((signal) => `- ${signal.excerpt}`),
    "",
    "Как этим пользоваться:",
    "",
    "- Не спрашивай то, что здесь уже сказано. Уточняй следующее по списку.",
    "- Никогда не говори, где ты это узнал, и не намекай на это. Ни «я видел ваше сообщение», ни «вы писали в чате», ни «мне известно, что». Человек не давал нам этих слов и не ждёт, что мы их храним; показать это — значит закончить разговор.",
    "- Если сказанное здесь расходится с тем, что он пишет сейчас, верь тому, что он пишет сейчас: задача могла измениться, а могла быть и не его.",
  ].join("\n");
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
  options: { resuming?: boolean; scoutNote?: string | null } = {},
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
      channelNote: [channelNote(from, chatId, options.resuming === true), options.scoutNote]
        .filter(Boolean)
        .join("\n\n"),
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

      // Перелив закрывается здесь. Без этой отметки скаут неизмерим:
      // сигналы копятся, лиды приходят, а связи между ними нет — и на
      // вопрос «сколько сделок принёс холодный поиск» ответить нечем.
      await linkSignalsToLead(from?.id, result.requestNo);
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

  // Вход из общего чата не выдаём никогда: ссылка одноразовая, но она
  // появилась бы на экране у всех, кто в чате. Зато и молчать нельзя —
  // молчание в ответ на команду читается как «бот сломался», и человек
  // идёт не в личку, а к владельцу. Отвечаем только своим: для
  // постороннего команда остаётся без ответа, как и была.
  if (loginCommand(message.text)) {
    const staff = message.from?.id ? await staffByTelegramId(message.from.id) : null;
    if (staff) {
      await sendMessage(
        chat.id,
        "Вход выдаётся только в личке — ссылка одноразовая, и здесь её увидели бы все. Напишите мне <code>/login</code> личным сообщением.",
      );
    }
    return;
  }

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

  // Та же подсказка, что и в чате продаж, и по той же причине: сотрудник
  // мог перепутать окно. Постороннему — тишина.
  if (loginCommand(message.text)) {
    const staff = message.from?.id ? await staffByTelegramId(message.from.id) : null;
    if (staff) {
      await sendMessage(
        message.chat.id,
        "Вход выдаётся только в личке. Напишите мне <code>/login</code> личным сообщением.",
      );
    }
    return;
  }

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
/**
 * Нажатие кнопки под брифом.
 *
 * Нажавший опознаётся по его числовому id в Telegram и превращается в
 * сотрудника из базы — то же самое, что делает вход в панель. Раньше здесь
 * записывалось имя из профиля: строка, которую человек меняет в настройках
 * за секунду, и по которой нельзя ни спросить с конкретного менеджера, ни
 * связать лида с его карточкой. Хуже того, нажать могли и посторонние: в
 * чат отдела продаж людей добавляют, а вот из брифов их потом не выгоняют.
 *
 * Владение считается тем же кодом, что и в панели (takeLead/setStatus), а
 * не отдельным запросом. Две реализации одного правила разойдутся: гонку
 * за горячим лидом надёжно решает только условие внутри самого update, и
 * дублировать его во втором месте — значит однажды отдать лида двоим.
 *
 * Проверка места нажатия — по действию, а не одна на все кнопки. Раньше
 * здесь стояло общее «только из чата отдела продаж», и это было верно,
 * пока кнопки были одни: они висели под брифом. Кнопки напоминаний живут
 * в личке сотрудника — под общее правило они не попадают ни при каких
 * условиях, и с ним напоминание отвечало бы «Недоступно» своему же
 * адресату.
 */
async function handleButton(query: NonNullable<Update["callback_query"]>) {
  if (!query.data) return;

  const chatId = query.message?.chat.id;
  const parts = query.data.split(":");

  // Напоминания: личка сотрудника, и только своя.
  if (parts[0] === "rem") {
    if (chatId !== undefined && isSalesChat(chatId)) {
      // Напоминание в общем чате означало бы, что личное дело менеджера
      // читают все, — такого сообщения мы не отправляем, значит и нажатие
      // оттуда пришло не от нас.
      await answerCallback(query.id, "Недоступно");
      return;
    }
    await handleReminderButton(query, parts[1] ?? "", parts[2] ?? "");
    return;
  }

  // Кнопки под брифом живут только в чате отдела продаж. Нажатие из
  // любого другого места — либо ошибка, либо чужая попытка.
  if (chatId !== undefined && !isSalesChat(chatId)) {
    await answerCallback(query.id, "Недоступно");
    return;
  }

  const [action, leadId] = parts;

  if (action === "noop") {
    // Кнопка-статус под разобранным брифом: нажатие ничего не меняет, но
    // Telegram ждёт ответа, иначе у нажавшего висит «часики».
    await answerCallback(query.id, "Этот лид уже разобран");
    return;
  }

  if (action !== "take" && action !== "drop") {
    await answerCallback(query.id, "Неизвестная команда");
    return;
  }

  const staff = query.from?.id ? await staffByTelegramId(query.from.id) : null;
  if (!staff) {
    // Формулировка нарочно не говорит «вас нет в списке сотрудников»: тем же
    // текстом бот отвечает и на неизвестную команду, поэтому кнопка не
    // превращается в способ проверять, кто в студии работает.
    await answerCallback(query.id, "Недоступно");
    return;
  }

  // Адрес нажавшего нам неизвестен: запрос приходит с серверов Telegram, и
  // записать их адрес значило бы соврать в журнале. Пустая строка станет
  // в базе NULL, а откуда пришло действие, скажет meta.via.
  const ip = "";

  try {
    const taken = await takeLead(leadId, staff, ip, "telegram");

    if (!taken.ok && taken.reason === "taken") {
      await answerCallback(query.id, "Лида уже взял кто-то другой");
      return;
    }
    if (!taken.ok) {
      await answerCallback(query.id, "Не удалось — откройте карточку в панели");
      return;
    }

    // «Отклонить» — это тоже решение по лиду, и у него должен быть автор.
    // Поэтому отклонение идёт через взятие: сперва лид закрепляется за
    // нажавшим, потом закрывается. В журнале остаются обе строки, и на
    // разборе видно, кто именно решил, что этот клиент нам не нужен.
    if (action === "drop") {
      const dropped = await setStatus(leadId, "dropped", staff, ip, "telegram");
      if (!dropped.ok) {
        await answerCallback(query.id, "Взял, но не смог отклонить — откройте карточку");
        return;
      }
    }

    await answerCallback(
      query.id,
      action === "take" ? "Лид закреплён за вами" : "Лид отклонён",
    );

    if (query.message) {
      const who = staff.username ? `@${staff.username}` : staff.display_name;
      await markBriefHandled(
        query.message.chat.id,
        query.message.message_id,
        action === "take" ? `✅ В работе у ${who}` : `🗄 Отклонён — ${who}`,
      );
    }
  } catch (error) {
    console.error("telegram webhook", error);
    await answerCallback(query.id, "Не удалось обновить статус");
  }
}

/** На сколько откладывает кнопка «+2 часа». */
const SNOOZE_HOURS = 2;

/**
 * Кнопки под напоминанием: отложить и закрыть.
 *
 * Право проверяется не тем, что сообщение пришло в личку этого человека, —
 * колбэк можно прислать и с чужой полезной нагрузкой. Оно проверяется в
 * самом update: completeReminder и snoozeReminder дописывают условие по
 * staff_id, и чужое напоминание просто не находится.
 */
async function handleReminderButton(
  query: NonNullable<Update["callback_query"]>,
  action: string,
  reminderId: string,
) {
  const staff = query.from?.id ? await staffByTelegramId(query.from.id) : null;
  if (!staff || !reminderId) {
    await answerCallback(query.id, "Недоступно");
    return;
  }

  // Адрес нажавшего неизвестен: запрос приходит с серверов Telegram.
  const ip = "";

  try {
    if (action === "done") {
      const ok = await completeReminder(reminderId, staff, ip);
      await answerCallback(query.id, ok ? "Закрыто" : "Уже закрыто или не ваше");
      if (ok && query.message) {
        await markBriefHandled(query.message.chat.id, query.message.message_id, "✅ Закрыто");
      }
      return;
    }

    if (action === "snooze") {
      const ok = await snoozeReminder(reminderId, staff, SNOOZE_HOURS, ip);
      await answerCallback(
        query.id,
        ok ? `Напомню через ${SNOOZE_HOURS} часа` : "Уже закрыто или не ваше",
      );
      if (ok && query.message) {
        await markBriefHandled(
          query.message.chat.id,
          query.message.message_id,
          `🕑 Отложено на ${SNOOZE_HOURS} часа`,
        );
      }
      return;
    }

    await answerCallback(query.id, "Неизвестная команда");
  } catch (error) {
    console.error("telegram webhook", error);
    await answerCallback(query.id, "Не получилось");
  }
}
