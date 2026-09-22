import { diagnose, readPulse, type ScoutPulse } from "@/lib/scout/health";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Утренняя сводка скаута.
 *
 * Скаут, у которого за сутки не нашлось ни одного запроса, снаружи
 * неотличим от сломанного. Пульс в панели это различает — но панель надо
 * открыть. Сводка приходит сама, в тот же канал, куда падают сигналы, и
 * отвечает на единственный вопрос владельца: «он работает или нет».
 *
 * Отдельного таймера нет. Свип напоминаний ходит каждые пять минут и уже
 * делает уборку сигналов и досылку; сводка едет там же — если по Ташкенту
 * утро и за сегодня ещё не отправляли. Одна точка отказа, та же, что у
 * всего остального.
 */

/** Час отправки по местному времени. */
export const DIGEST_HOUR = 9;
export const DIGEST_TZ = "Asia/Tashkent";

/** Сколько назад считать «за сутки». */
const DAY_MS = 24 * 3_600_000;

const KEY = "scout_digest";

/** Календарная дата и час в поясе сводки. */
export function localParts(now: Date, timeZone = DIGEST_TZ): { date: string; hour: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  // Полночь в некоторых сборках ICU приходит как «24», а не «00».
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) % 24 };
}

/**
 * Пора ли: по местному времени уже утро, а за сегодня ещё не слали.
 *
 * «Уже утро», а не «ровно 09:00»: свип ходит раз в пять минут, и ровно в
 * назначенную минуту он не придёт никогда. Если сервер лежал всё утро,
 * сводка уйдёт вечером — опоздавшая честнее пропущенной, а на следующий
 * день счёт начинается заново.
 */
export function isDue(now: Date, sentOn: string | null): boolean {
  const { date, hour } = localParts(now);
  return hour >= DIGEST_HOUR && sentOn !== date;
}

export type DailyStats = {
  saved: number;
  notified: number;
  byCategory: Record<string, number>;
};

/** Причины отсева по-русски — те же слова, что в журнале скаута. */
export const DROP_LABEL: Record<string, string> = {
  noisy_chat: "шумный чат",
  too_short: "коротко",
  too_long: "длинно",
  no_topic: "не по теме",
  no_demand: "без спроса",
  supply: "предложение",
  spam: "спам",
};

function startedAt(pulse: ScoutPulse): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: DIGEST_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(pulse.startedAt));
}

/**
 * Текст сводки. Чистая функция: её и проверяем.
 *
 * Пять-семь строк. Первой — вердикт пульса: он и есть ответ на вопрос
 * «сломался или тихо», остальное — цифры для тех, кому интересно, почему.
 */
export function renderDigest(pulse: ScoutPulse | null, daily: DailyStats, now: Date): string {
  const verdict = diagnose(pulse, now.getTime());

  const lines: string[] = ["☀️ <b>Скаут за сутки</b>", esc(verdict.says), ""];

  if (pulse) {
    lines.push(`Читаю <b>${pulse.chatsReading}</b> из ${pulse.chatsWatched} чатов.`);

    const dropped = Object.entries(pulse.dropped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => `${DROP_LABEL[reason] ?? reason} ${count}`)
      .join(", ");

    lines.push(
      `С последнего старта (${startedAt(pulse)}): увидел ${pulse.seen}, ` +
        `до модели дошло ${pulse.passedPrefilter}, разобрано ${pulse.classified}` +
        (dropped ? ` · отсев: ${dropped}` : "") +
        ".",
    );
  }

  const categories = Object.entries(daily.byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `${esc(category)} ${count}`)
    .join(", ");

  lines.push(
    daily.saved
      ? `За сутки в базу: <b>${daily.saved}</b>, в канал: <b>${daily.notified}</b>` +
          (categories ? ` (${categories})` : "") +
          "."
      : "За сутки запросов на разработку не было.",
  );

  lines.push("", `${siteUrl}/admin/scout`);
  return lines.join("\n");
}

async function loadDaily(now: Date): Promise<DailyStats> {
  const db = serviceClient();
  const stats: DailyStats = { saved: 0, notified: 0, byCategory: {} };
  if (!db) return stats;

  const since = new Date(now.getTime() - DAY_MS).toISOString();
  const { data, error } = await db
    .from("scout_signals")
    .select("category, notified_at")
    .gte("created_at", since)
    // Холостой прогон кладёт сигналы сразу «ignored»; в сутки они не
    // считаются — это проверка механизма, а не находки.
    .neq("status", "ignored");

  if (error) {
    console.error("scout: сводка не прочитала сигналы за сутки", error.message);
    return stats;
  }

  for (const row of (data ?? []) as { category: string | null; notified_at: string | null }[]) {
    stats.saved += 1;
    if (row.notified_at) stats.notified += 1;
    const category = row.category ?? "другое";
    stats.byCategory[category] = (stats.byCategory[category] ?? 0) + 1;
  }
  return stats;
}

async function readSentOn(): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", KEY).maybeSingle();
  return ((data?.payload as { sent_on?: string } | null)?.sent_on ?? null) || null;
}

async function markSent(date: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { error } = await db
    .from("stats_snapshots")
    .upsert({ key: KEY, payload: { sent_on: date }, computed_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) console.error("scout: сводка не отметила отправку", error.message);
}

export type DigestOutcome = "sent" | "not_due" | "skipped" | "failed";

/**
 * Отправить, если пора.
 *
 * Отметка о дате ставится только после успеха: иначе первый же сбой
 * Telegram съедал бы сводку на день. Обратная сторона — при постоянном
 * сбое свип будет пробовать каждые пять минут до полуночи; это дёшево и
 * видно в журнале.
 */
export async function sendScoutDigest(now = new Date()): Promise<DigestOutcome> {
  const channel = process.env.TELEGRAM_SCOUT_CHANNEL_ID;
  if (!channel) return "skipped";

  const sentOn = await readSentOn();
  if (!isDue(now, sentOn)) return "not_due";

  const [pulse, daily] = await Promise.all([readPulse(), loadDaily(now)]);
  const delivered = await sendMessage(channel, renderDigest(pulse, daily, now));
  if (!delivered) return "failed";

  await markSent(localParts(now).date);
  return "sent";
}
