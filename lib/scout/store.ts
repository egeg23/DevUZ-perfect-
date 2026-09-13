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

/**
 * Порог, который можно поднять, не трогая код.
 *
 * Настраивается не из любви к настройкам. Чаты бывают разной чистоты:
 * в клубе предпринимателей 60 — разумная граница, а на доске объявлений
 * на двадцать пять тысяч человек той же шестидесяткой в ленту попадает
 * шум, и через неделю её перестают открывать. Единственный способ узнать
 * свою границу — посмотреть на живую ленту, а для этого правка должна
 * стоить строчку в .env и перезапуск, а не выкатку.
 *
 * Читается при каждом вызове, а не при загрузке модуля: так значение
 * можно подменить в тесте, не пересобирая импорты.
 */
/**
 * Категории, которые доходят до оператора независимо от балла.
 *
 * Порог в 60 защищает ленту от шума и в этом прав. Но он предполагает, что
 * балл отражает ценность лида, а для субподряда это не так: рубрика
 * оценивает уверенность в том, что перед нами запрос с описанной задачей, а
 * у субподряда задачи в сообщении нет — есть только готовность платить.
 * Первый же такой сигнал получил 25 из 100, не прошёл порог, не попал в
 * уведомление и был потерян, когда через два часа пост удалили.
 *
 * Рубрику я поправил, но проверить её живым вызовом модели не смог, а
 * «модель теперь поставит больше» — это надежда, а не механизм. Исключение
 * по категории работает независимо от того, насколько хорошо получилась
 * формулировка.
 *
 * Цена ошибки несимметрична: лишняя строка в ленте стоит секунды внимания,
 * пропущенный субподряд — целой сделки, потому что у такого заказчика
 * работа и деньги уже есть.
 */
const ALWAYS_NOTIFY = new Set(["субподряд"]);

/**
 * Дошло ли до оператора.
 *
 * Отдельной функцией, потому что это единственное место во всей цепочке
 * уведомления, которое можно проверить тестом: дальше начинаются сеть и
 * переменные окружения.
 */
export function shouldNotify(score: number, category: string): boolean {
  if (ALWAYS_NOTIFY.has(category)) return true;
  return score >= minScore();
}

export function minScore(): number {
  const raw = Number(process.env.SCOUT_MIN_SCORE);
  // Чужое значение принимается только осмысленное. Пустая строка даёт 0,
  // а 0 означал бы «слать всё подряд» — худшее, что может случиться с
  // лентой из-за опечатки в .env.
  if (!Number.isFinite(raw) || raw < 1 || raw > 100) return SCORE_THRESHOLD;
  return raw;
}

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
  /**
   * Сигнал пришёл из холостого прогона, а не из живого чата.
   *
   * Прогон намеренно гоняет всю цепочку «отсев → модель → база → канал
   * оператора»: проверять её по частям бессмысленно. Но заготовленные
   * сообщения после этого лежат в ленте неотличимо от настоящих лидов, и
   * кто-нибудь идёт отвечать выдуманному человеку — это уже случилось
   * 13.09.2026, шесть фикстур пришлось разбирать руками по базе.
   *
   * Поэтому цепочка проверяется целиком, а результат сразу помечен.
   */
  rehearsal?: boolean;
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
      // Фикстура попадает в базу уже разобранной: цепочка проверена, а
      // очередь оператора не засорена.
      status: input.rehearsal ? "ignored" : "new",
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
  if (!shouldNotify(input.score, input.category)) return false;

  const link = messageLink(input.chatId, input.messageId, input.chatUsername);

  /**
   * Автор — и чем именно до него дотягиваться.
   *
   * Различие не косметическое, а решает, успеет оператор или нет. С
   * username личка открывается в одно касание и переживает удаление поста.
   * Без username единственная дорога — через само сообщение: числового id
   * мало, для личного чата Telegram нужен ещё access_hash, а он есть только
   * у сессии, которая сообщение видела. Скаут читает и не пишет намеренно,
   * так что дороги от него нет.
   *
   * Поэтому во втором случае в уведомлении стоит предупреждение: пост
   * удалят — и человек станет недостижим совсем. Так и вышло с первым же
   * настоящим сигналом.
   */
  const author = input.authorUsername
    ? `Автор: @${esc(input.authorUsername)} — https://t.me/${esc(input.authorUsername)}`
    : "Автор: без username — дотянуться можно только через сообщение, пока его не удалили.";

  return sendMessage(
    channel,
    [
      // Пометка первой строкой, а не в конце: оператор решает, читать ли
      // дальше, по первой строке уведомления.
      input.rehearsal ? "🧪 <b>ХОЛОСТОЙ ПРОГОН</b> — это не лид" : "",
      `🔎 <b>${esc(input.category)}</b> · ${input.score}/100`,
      input.chatTitle ? `<i>${esc(input.chatTitle)}</i>` : "",
      "",
      esc(input.rationale),
      "",
      `<blockquote>${esc(excerpt(input.text, 400))}</blockquote>`,
      "",
      author,
      link ? `Сообщение: ${link}` : "Сообщение: ссылка недоступна (закрытый чат без адреса)",
      "",
      // Срочность в самом уведомлении, а не в инструкции, которую прочтут
      // один раз и забудут. Первый же настоящий сигнал скаута прожил меньше
      // двух часов: модератор снёс пост как оформленный не по правилам, и
      // отвечать стало некому и некуда. Такой сигнал не ждёт до вечера.
      "Отвечать — руками, в том же чате и сейчас: такие посты живут часы.",
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
  /**
   * Чем именно отсев отбросил остальное.
   *
   * Без этой разбивки «увидел 340, до модели дошло 4» не говорит ничего:
   * непонятно, чат тихий, темы не те или отсев режет живое. А с ней видно
   * сразу — триста «не по теме» это здоровая доска объявлений, а триста
   * «предложение» это чат исполнителей, где нам делать нечего.
   */
  dropped: Record<string, number>;
};

export async function processBatch(
  messages: ScoutMessage[],
  classify: (
    batch: { key: string; text: string; chatTitle?: string | null }[],
  ) => Promise<{ key: string; score: number; category: string; rationale: string }[]>,
  { rehearsal = false }: { rehearsal?: boolean } = {},
): Promise<ScoutRun> {
  const run: ScoutRun = {
    seen: messages.length,
    passedPrefilter: 0,
    classified: 0,
    saved: 0,
    notified: 0,
    dropped: {},
  };

  const judged = messages.map((message) => ({ message, verdict: prefilter(message.text) }));

  for (const item of judged) {
    if (item.verdict.pass) continue;
    run.dropped[item.verdict.reason] = (run.dropped[item.verdict.reason] ?? 0) + 1;
  }

  const candidates = judged.filter((item) => item.verdict.pass);

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
      rehearsal,
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
