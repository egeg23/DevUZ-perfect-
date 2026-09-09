import { prefilter } from "@/lib/scout/prefilter";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";
import { siteUrl } from "@/lib/seo";

/**
 * Порог, ниже которого сигнал оператору не показывается.
 *
 * Лента, в которой половина строк — мимо, перестаёт открываться через
 * неделю. Пропущенный слабый сигнал дешевле, чем брошенная лента.
 */
export const SCORE_THRESHOLD = 60;

export type SignalInput = {
  chatId: number;
  chatTitle: string | null;
  messageId: number;
  chatUsername: string | null;
  authorTelegramId: number | null;
  authorUsername: string | null;
  text: string;
  topics: string[];
  score: number;
  category: string;
  rationale: string;
};

/**
 * Ссылка на сообщение.
 *
 * У публичного чата с адресом — обычная t.me-ссылка. У приватного адреса
 * нет, и Telegram собирает ссылку из внутреннего номера: -1001234567890
 * превращается в 1234567890. Без этого преобразования ссылка ведёт в
 * никуда, и оператор не находит сообщение, ради которого всё затевалось.
 */
export function messageLink(
  chatId: number,
  messageId: number,
  chatUsername: string | null,
): string | null {
  if (chatUsername) return `https://t.me/${chatUsername}/${messageId}`;

  const text = String(chatId);
  if (!text.startsWith("-100")) return null;
  return `https://t.me/c/${text.slice(4)}/${messageId}`;
}

/** Выдержка: столько, чтобы понять суть, и не больше. */
export function excerpt(text: string, limit = 600): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit - 1)}…`;
}

export async function saveSignal(input: SignalInput): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;

  const { error } = await db.from("scout_signals").upsert(
    {
      chat_id: input.chatId,
      chat_title: input.chatTitle,
      message_id: input.messageId,
      message_link: messageLink(input.chatId, input.messageId, input.chatUsername),
      author_telegram_id: input.authorTelegramId,
      author_username: input.authorUsername,
      excerpt: excerpt(input.text),
      topics: input.topics,
      score: input.score,
      category: input.category,
      rationale: input.rationale,
    },
    // Перезапуск скаута не должен задваивать ленту оператора: пара
    // «чат + сообщение» уникальна, повтор молча игнорируется.
    { onConflict: "chat_id,message_id", ignoreDuplicates: true },
  );

  if (error) {
    console.error("scout: не сохранил сигнал", error.message);
    return false;
  }
  return true;
}

/**
 * Сообщение оператору.
 *
 * Уходит в отдельный канал, а не в чат отдела продаж: там лежат брифы
 * настоящих лидов, и смешивать их с холодной лентой значит утопить
 * первые во вторых.
 *
 * Отвечает оператор сам и в том же публичном чате. Сервис в чаты не
 * пишет — ни одной строкой.
 */
export async function notifyOperator(input: SignalInput): Promise<boolean> {
  const channel = process.env.TELEGRAM_SCOUT_CHANNEL_ID;
  if (!channel) return false;
  if (input.score < SCORE_THRESHOLD) return false;

  const link = messageLink(input.chatId, input.messageId, input.chatUsername);
  const author = input.authorUsername ? `@${input.authorUsername}` : "без username";

  return sendMessage(
    channel,
    [
      `🔎 <b>${esc(input.category)}</b> · ${input.score}/100`,
      input.chatTitle ? `<i>${esc(input.chatTitle)}</i>` : "",
      "",
      esc(input.rationale),
      "",
      `<blockquote>${esc(excerpt(input.text, 400))}</blockquote>`,
      "",
      `Автор: ${esc(author)}`,
      link ? `Сообщение: ${link}` : "Сообщение: ссылка недоступна (закрытый чат без адреса)",
      "",
      "Отвечать — руками и в том же чате.",
    ]
      .filter((line) => line !== "")
      .join("\n"),
  );
}

/**
 * Полный проход по пачке сообщений: отсев, разбор, сохранение, уведомление.
 *
 * Возвращает, сколько прошло каждую ступень — эти числа и есть ответ на
 * вопрос «работает ли скаут»: если отсев пропускает половину чата,
 * правила стоит ужесточить, а если ноль — они не срабатывают вовсе.
 */
export type ScoutMessage = {
  chatId: number;
  chatTitle: string | null;
  chatUsername: string | null;
  messageId: number;
  authorTelegramId: number | null;
  authorUsername: string | null;
  text: string;
};

export type ScoutRun = {
  seen: number;
  passedPrefilter: number;
  classified: number;
  saved: number;
  notified: number;
};

export async function processBatch(
  messages: ScoutMessage[],
  classify: (
    batch: { key: string; text: string; chatTitle?: string | null }[],
  ) => Promise<{ key: string; score: number; category: string; rationale: string }[]>,
): Promise<ScoutRun> {
  const run: ScoutRun = {
    seen: messages.length,
    passedPrefilter: 0,
    classified: 0,
    saved: 0,
    notified: 0,
  };

  const candidates = messages
    .map((message) => ({ message, verdict: prefilter(message.text) }))
    .filter((item) => item.verdict.pass);

  run.passedPrefilter = candidates.length;
  if (!candidates.length) return run;

  const keyed = new Map(
    candidates.map((item) => [`${item.message.chatId}:${item.message.messageId}`, item]),
  );

  const verdicts = await classify(
    [...keyed.entries()].map(([key, item]) => ({
      key,
      text: item.message.text,
      chatTitle: item.message.chatTitle,
    })),
  );

  run.classified = verdicts.length;

  for (const verdict of verdicts) {
    const item = keyed.get(verdict.key);
    if (!item) continue;

    const signal: SignalInput = {
      chatId: item.message.chatId,
      chatTitle: item.message.chatTitle,
      messageId: item.message.messageId,
      chatUsername: item.message.chatUsername,
      authorTelegramId: item.message.authorTelegramId,
      authorUsername: item.message.authorUsername,
      text: item.message.text,
      topics: item.verdict.topics,
      score: verdict.score,
      category: verdict.category,
      rationale: verdict.rationale,
    };

    if (await saveSignal(signal)) run.saved += 1;

    // Считаем отправленное, а не перешагнувшее порог: иначе числа прохода
    // бодро показывают рассылку там, где канал оператора не настроен, — и
    // единственная диагностика скаута начинает врать.
    if (await notifyOperator(signal)) run.notified += 1;
  }

  return run;
}

/**
 * Уборка просроченного.
 *
 * Срок лежит в самой строке, а не в голове у того, кто писал уборку.
 * Сигналы, ставшие лидами, не трогаются: у лида свой срок, и удалять
 * запись о том, откуда он пришёл, значит терять историю сделки.
 */
export async function purgeExpiredSignals(): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;

  const { data, error } = await db
    .from("scout_signals")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .is("lead_id", null)
    .select("id");

  if (error) {
    console.error("scout: уборка не удалась", error.message);
    return 0;
  }
  return (data ?? []).length;
}

/** Перелив: писал ли этот человек в чатах, за которыми мы следим. */
export async function signalsByAuthor(telegramId: number): Promise<
  { excerpt: string; category: string | null; chat_title: string | null; created_at: string }[]
> {
  const db = serviceClient();
  if (!db) return [];

  const { data } = await db
    .from("scout_signals")
    .select("excerpt, category, chat_title, created_at")
    .eq("author_telegram_id", telegramId)
    .order("created_at", { ascending: false })
    .limit(3);

  return (data ?? []) as {
    excerpt: string;
    category: string | null;
    chat_title: string | null;
    created_at: string;
  }[];
}

/**
 * Перелив состоялся: человек из публичного чата пришёл к нам сам.
 *
 * Без этой отметки скаут неизмерим. Сигналы копятся, лиды приходят, а
 * связи между ними нет — и на вопрос «сколько сделок принёс холодный
 * поиск» ответить нечем, то есть непонятно, стоит ли он вообще того.
 *
 * Здесь же снимается срок хранения: сигнал, ставший лидом, уборка больше
 * не трогает — у лида свой срок, и запись о том, откуда он пришёл, часть
 * истории сделки.
 *
 * Связываем по номеру заявки, а не по id лида: engine отдаёт наружу
 * именно номер, и тянуть id через весь путь только ради этой отметки
 * значило бы менять сигнатуры на всём протяжении.
 */
export async function linkSignalsToLead(
  telegramId: number | undefined,
  requestNo: string | undefined,
): Promise<number> {
  if (!telegramId || !requestNo) return 0;

  const db = serviceClient();
  if (!db) return 0;

  const { data: lead } = await db
    .from("leads")
    .select("id")
    .eq("request_no", requestNo)
    .maybeSingle();

  if (!lead) return 0;

  const { data, error } = await db
    .from("scout_signals")
    .update({ lead_id: lead.id as string, status: "converted" })
    .eq("author_telegram_id", telegramId)
    .is("lead_id", null)
    .select("id");

  if (error) {
    console.error("scout: не связал сигнал с лидом", error.message);
    return 0;
  }
  return (data ?? []).length;
}
