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

/**
 * То же правило, но для выборки из базы.
 *
 * Досылка неотправленного берёт из базы «то, что дошло бы до оператора» —
 * и обязана понимать «дошло бы» так же, как shouldNotify. Иначе субподряд с
 * баллом 25, не доставленный с первого раза, никогда не будет дослан: он
 * проходит мимо порога при живой отправке, а из базы выбирается по порогу.
 * Два определения одного правила разъезжаются при первой же правке —
 * поэтому оба собираются из одного списка категорий.
 */
export function notifiableFilter(): string {
  const categories = [...ALWAYS_NOTIFY].map((category) => `category.eq.${category}`);
  return [`score.gte.${minScore()}`, ...categories].join(",");
}

/**
 * Ниже этой оценки сигнал — шум: сохраняется сразу разобранным.
 *
 * Раньше в базу «новыми» ложилось всё, что модель разобрала, и порог стоял
 * только на уведомлении. Лента в панели при этом копила мусор: 159 из 197
 * сигналов — нули из одного чата про релокацию. Сохраняем их по-прежнему
 * (по ним видно, какой чат шумит), но не «новыми».
 */
export const NOISE_FLOOR = 20;

/**
 * С этой оценки сигнал — сильный: свип сам делает из него лид и пускает по
 * очереди (lib/scout/promote.ts). Здесь, а не там: уведомление оператору
 * должно говорить о том же пороге, а скаут не должен тянуть за собой
 * очередь лидов ради одной константы.
 */
export const STRONG_SCORE = 70;

export function isNoise(score: number, category: string): boolean {
  return score < NOISE_FLOOR && !ALWAYS_NOTIFY.has(category);
}

/**
 * Шумный чат: за две недели много разобранных сообщений, и ни одного
 * хоть сколько-то похожего на запрос.
 *
 * Такой чат не просто засоряет ленту — каждое его сообщение, пережившее
 * дешёвый отсев, оплачивается вызовом модели. Скаут его глушит сам: без
 * правки SCOUT_CHATS на сервере и без выкатки. Окно скользящее, так что
 * через две недели тишины чат снова получает шанс.
 */
export const MUTE_WINDOW_DAYS = 14;
export const MUTE_MIN_SIGNALS = 25;
export const MUTE_MAX_SCORE = 30;

export function noisyChats(rows: readonly { chat_id: number; score: number; status: string }[]): Set<number> {
  const byChat = new Map<number, { count: number; max: number; useful: boolean }>();
  for (const row of rows) {
    const chat = byChat.get(row.chat_id) ?? { count: 0, max: 0, useful: false };
    chat.count += 1;
    chat.max = Math.max(chat.max, row.score);
    // Хоть один ответ или лид из чата — чат полезный, даже если шумный.
    if (row.status === "answered" || row.status === "converted") chat.useful = true;
    byChat.set(row.chat_id, chat);
  }
  const out = new Set<number>();
  for (const [id, chat] of byChat) {
    if (chat.count >= MUTE_MIN_SIGNALS && chat.max < MUTE_MAX_SCORE && !chat.useful) out.add(id);
  }
  return out;
}

let mutedCache: { at: number; chats: Set<number> } | null = null;

/** Заглушённые чаты — с кэшем на полчаса: скаут живёт долго, а запрос не бесплатный. */
export async function loadMutedChats(now: Date = new Date()): Promise<Set<number>> {
  if (mutedCache && now.getTime() - mutedCache.at < 30 * 60_000) return mutedCache.chats;
  const db = serviceClient();
  if (!db) return new Set();
  const since = new Date(now.getTime() - MUTE_WINDOW_DAYS * 24 * 3600_000).toISOString();
  const { data, error } = await db
    .from("scout_signals")
    .select("chat_id, score, status")
    .gte("created_at", since)
    .limit(10000);
  if (error) {
    console.error("scout: не прочитал шумные чаты", error.message);
    return mutedCache?.chats ?? new Set();
  }
  const chats = noisyChats(
    (data ?? []).map((r) => ({ chat_id: Number(r.chat_id), score: Number(r.score), status: String(r.status) })),
  );
  mutedCache = { at: now.getTime(), chats };
  return chats;
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

/**
 * Три исхода, а не «да/нет».
 *
 * Раньше проигнорированный дубль возвращал true — и уведомление уходило
 * второй раз: тот же сигнал, та же ссылка, тот же канал. Дубли приходят
 * реже, чем кажется, но приходят: два процесса на одной сессии, повтор
 * обновления при переподключении. «Уже было» — отдельный ответ, и на него
 * уведомление не шлётся.
 */
export type SaveOutcome =
  | { outcome: "inserted"; id: string }
  | { outcome: "duplicate" }
  | { outcome: "failed" };

export async function saveSignal(input: SignalInput): Promise<SaveOutcome> {
  const db = serviceClient();
  if (!db) return { outcome: "failed" };

  const { data, error } = await db
    .from("scout_signals")
    .upsert(
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
        status: input.rehearsal || isNoise(input.score, input.category) ? "ignored" : "new",
      },
      // Перезапуск скаута не должен задваивать ленту оператора: пара
      // «чат + сообщение» уникальна, повтор молча игнорируется.
      { onConflict: "chat_id,message_id", ignoreDuplicates: true },
    )
    // При ignoreDuplicates база возвращает только вставленные строки:
    // пустой ответ и есть «уже было».
    .select("id");

  if (error) {
    console.error("scout: не сохранил сигнал", error.message);
    return { outcome: "failed" };
  }

  const row = (data ?? [])[0] as { id: string } | undefined;
  return row ? { outcome: "inserted", id: row.id } : { outcome: "duplicate" };
}

/** Отметка доставки. Ставится только после успеха — см. resendUnnotifiedSignals. */
async function markNotified(id: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { error } = await db
    .from("scout_signals")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("scout: не отметил доставку", error.message);
}

async function markNotifyFailed(id: string, attempts: number): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { error } = await db.from("scout_signals").update({ notify_attempts: attempts }).eq("id", id);
  if (error) console.error("scout: не записал неудачу доставки", error.message);
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
/**
 * То, из чего собирается сообщение оператору.
 *
 * Отдельная форма, а не SignalInput: живой путь собирает её из только что
 * разобранного сообщения, досылка — из строки в базе, где полного текста и
 * адреса чата уже нет, зато есть готовая ссылка и выдержка.
 */
export type SignalNotice = {
  chatTitle: string | null;
  link: string | null;
  authorUsername: string | null;
  excerpt: string;
  score: number;
  category: string;
  rationale: string;
  /**
   * Сигнал из холостого прогона: уведомление должно это показать.
   *
   * Необязательное: свип досылки поднимает сигналы из базы, где признака
   * прогона нет — да и не нужен, свип берёт только `status = 'new'`, а
   * прогон кладёт сразу `'ignored'`.
   */
  rehearsal?: boolean;
};

export function noticeFrom(input: SignalInput): SignalNotice {
  return {
    chatTitle: input.chatTitle,
    link: messageLink(input.chatId, input.messageId, input.chatUsername),
    authorUsername: input.authorUsername,
    excerpt: input.text,
    score: input.score,
    category: input.category,
    rationale: input.rationale,
    rehearsal: input.rehearsal ?? false,
  };
}

/**
 * «Пропущено» — не то же, что «не смог».
 *
 * Не смог — Telegram не принял, и это надо пробовать снова. Пропущено —
 * слать было некуда (канал не задан) или незачем (ниже порога), и снова
 * пробовать не надо. Смешай их — и счётчик неудач начнёт расти на сигналах,
 * по которым отправки не было вовсе, а свип сдастся раньше, чем канал
 * появится.
 */
export type NotifyOutcome = "sent" | "failed" | "skipped";

export async function notifyOperator(notice: SignalNotice): Promise<NotifyOutcome> {
  const channel = process.env.TELEGRAM_SCOUT_CHANNEL_ID;
  if (!channel) return "skipped";
  if (!shouldNotify(notice.score, notice.category)) return "skipped";

  /**
   * Автор — и чем именно до него дотягиваться.
   *
   * Различие не косметическое, оно решает, успеет оператор или нет. С
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
  const author = notice.authorUsername
    ? `Автор: @${esc(notice.authorUsername)} — https://t.me/${esc(notice.authorUsername)}`
    : "Автор: без username — дотянуться можно только через сообщение, пока его не удалили.";

  const delivered = await sendMessage(
    channel,
    [
      // Пометка первой строкой, а не в конце: оператор решает, читать ли
      // дальше, по первой строке уведомления.
      notice.rehearsal ? "🧪 <b>ХОЛОСТОЙ ПРОГОН</b> — это не лид" : "",
      `🔎 <b>${esc(notice.category)}</b> · ${notice.score}/100`,
      notice.chatTitle ? `<i>${esc(notice.chatTitle)}</i>` : "",
      "",
      esc(notice.rationale),
      "",
      `<blockquote>${esc(excerpt(notice.excerpt, 400))}</blockquote>`,
      "",
      author,
      notice.link
        ? `Сообщение: ${notice.link}`
        : "Сообщение: ссылка недоступна (закрытый чат без адреса)",
      "",
      // Срочность в самом уведомлении, а не в инструкции, которую прочтут
      // один раз и забудут. Первый же настоящий сигнал скаута прожил меньше
      // двух часов: модератор снёс пост как оформленный не по правилам, и
      // отвечать стало некому и некуда. Такой сигнал не ждёт до вечера.
      notice.score >= STRONG_SCORE && !notice.rehearsal
        ? "Сильный сигнал: через пару минут он уйдёт менеджерам очередью лидов с готовым ответом — сами не пишите, чтобы не написать человеку дважды."
        : "Отвечать — руками, в том же чате и сейчас: такие посты живут часы.",
    ]
      .filter((line) => line !== "")
      .join("\n"),
  );

  return delivered ? "sent" : "failed";
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

/**
 * Ввод-вывод прохода — подменяемый.
 *
 * Не ради абстракции: решение «уведомлять только вставленное, отмечать
 * только доставленное» иначе не проверить без живой базы и живого
 * Telegram, а именно это решение и ломалось.
 */
export type ScoutIo = {
  save: (input: SignalInput) => Promise<SaveOutcome>;
  notify: (notice: SignalNotice) => Promise<NotifyOutcome>;
  markSent: (id: string) => Promise<void>;
  markFailed: (id: string, attempts: number) => Promise<void>;
  /** Заглушённые чаты — их сообщения до модели не доходят. */
  muted?: () => Promise<Set<number>>;
};

const liveIo: ScoutIo = {
  save: saveSignal,
  notify: notifyOperator,
  markSent: markNotified,
  markFailed: markNotifyFailed,
  muted: () => loadMutedChats(),
};

export async function processBatch(
  messages: ScoutMessage[],
  classify: (
    batch: { key: string; text: string; chatTitle?: string | null }[],
  ) => Promise<{ key: string; score: number; category: string; rationale: string }[]>,
  // Оба необязательных параметра одним объектом: io — шов для тестов,
  // rehearsal — признак холостого прогона. Позиционно они бы начали
  // путаться местами у вызывающих.
  {
    io = liveIo,
    rehearsal = false,
  }: { io?: ScoutIo; rehearsal?: boolean } = {},
): Promise<ScoutRun> {
  const run: ScoutRun = {
    seen: messages.length,
    passedPrefilter: 0,
    classified: 0,
    saved: 0,
    notified: 0,
    dropped: {},
  };

  // Шумные чаты — раньше отсева и тем более модели: платить за разбор
  // сообщений, из которых две недели не вышло ни одного запроса, незачем.
  const muted = (await io.muted?.().catch(() => new Set<number>())) ?? new Set<number>();
  const judged = messages.map((message) => ({
    message,
    verdict: muted.has(message.chatId)
      ? { pass: false, reason: "noisy_chat" as const, topics: [] as string[] }
      : prefilter(message.text),
  }));

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

    const saved = await io.save(signal);
    // Дубль — не повод писать оператору ещё раз. Его уведомление уже было,
    // а если не было — досылка (resendUnnotifiedSignals) найдёт его по
    // пустой отметке доставки.
    if (saved.outcome !== "inserted") continue;
    run.saved += 1;

    // Считаем отправленное, а не перешагнувшее порог: иначе числа прохода
    // бодро показывают рассылку там, где канал оператора не настроен, — и
    // единственная диагностика скаута начинает врать.
    const outcome = await io.notify(noticeFrom(signal));
    if (outcome === "sent") {
      run.notified += 1;
      await io.markSent(saved.id);
    } else if (outcome === "failed") {
      await io.markFailed(saved.id, 1);
    }
  }

  return run;
}

/** За один проход — не больше пачки: лента, в которую разом падает сотня, закрывается навсегда. */
export const RESEND_BATCH = 10;
/** Попыток на сигнал; при свипе раз в пять минут — около получаса. */
export const RESEND_GIVE_UP = 5;
/** Старше — не досылаем: сигнал суточной давности в холодном чате уже остыл. */
export const RESEND_WINDOW_HOURS = 24;

type StoredSignal = {
  id: string;
  chat_title: string | null;
  message_link: string | null;
  author_username: string | null;
  excerpt: string;
  score: number | null;
  category: string | null;
  rationale: string | null;
  notify_attempts: number | null;
};

export type ResendIo = {
  load: () => Promise<StoredSignal[]>;
  notify: ScoutIo["notify"];
  markSent: ScoutIo["markSent"];
  markFailed: ScoutIo["markFailed"];
};

async function loadUnnotified(): Promise<StoredSignal[]> {
  const db = serviceClient();
  if (!db) return [];

  const since = new Date(Date.now() - RESEND_WINDOW_HOURS * 3_600_000).toISOString();
  const { data, error } = await db
    .from("scout_signals")
    .select(
      "id, chat_title, message_link, author_username, excerpt, score, category, rationale, notify_attempts",
    )
    .is("notified_at", null)
    .eq("status", "new")
    // Порог — текущий, а не тот, что был при сохранении: сигнал ниже порога
    // не «недоставленный», ему просто не место в канале. Категории мимо
    // порога — те же, что у живой отправки (см. notifiableFilter).
    .or(notifiableFilter())
    .gte("created_at", since)
    .lt("notify_attempts", RESEND_GIVE_UP)
    .order("created_at", { ascending: true })
    .limit(RESEND_BATCH);

  if (error) {
    console.error("scout: не прочитал неотправленные сигналы", error.message);
    return [];
  }
  return (data ?? []) as StoredSignal[];
}

const liveResendIo: ResendIo = {
  load: loadUnnotified,
  notify: notifyOperator,
  markSent: markNotified,
  markFailed: markNotifyFailed,
};

/**
 * Досылка того, что не дошло.
 *
 * Едет в свипе напоминаний, раз в пять минут. Сигнал, который Telegram не
 * принял при первой отправке — 429 при всплеске, обрыв прокси, — раньше
 * оставался в базе навсегда и в канал не попадал: об отправке не было
 * следа. Теперь след есть, и свип добирает по нему.
 *
 * Канал не задан — не делаем ничего и не считаем это неудачей: слать
 * некуда, и когда канал появится, сутки сигналов дойдут сами.
 */
export async function resendUnnotifiedSignals(
  io: ResendIo = liveResendIo,
): Promise<{ sent: number; failed: number }> {
  if (!process.env.TELEGRAM_SCOUT_CHANNEL_ID) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const row of await io.load()) {
    const outcome = await io.notify({
      chatTitle: row.chat_title,
      link: row.message_link,
      authorUsername: row.author_username,
      excerpt: row.excerpt,
      score: row.score ?? 0,
      category: row.category ?? "другое",
      rationale: row.rationale ?? "",
    });

    if (outcome === "sent") {
      sent += 1;
      await io.markSent(row.id);
    } else if (outcome === "failed") {
      failed += 1;
      await io.markFailed(row.id, (row.notify_attempts ?? 0) + 1);
    }
  }

  return { sent, failed };
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
