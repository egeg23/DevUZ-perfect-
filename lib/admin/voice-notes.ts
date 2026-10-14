import type { Staff } from "@/lib/admin/session";

/**
 * Голосовое → текст в боте студии.
 *
 * Владелец, 14.10.2026: клиент прислал ТЗ голосовым на четыре минуты.
 * «Я не могу скачать его. Только переслать. Давай я боту перешлю, а ты сам
 * закинешь и через гит расшифруем».
 *
 * Путь такой. Владелец или руководитель пересылает голосовое боту в личку —
 * бот ставит его в очередь (`voice_notes`) и отвечает, что расшифровывает.
 * Задача GitHub Actions «Голосовые — расшифровка» раз в 10 минут спрашивает
 * очередь, забирает звук через наш сервер, расшифровывает открытой моделью
 * Whisper и возвращает текст — бот присылает его в тот же чат.
 *
 * Сервер голос не слушает: модель расшифровки тяжёлая, а на нём живут ещё
 * полтора десятка сайтов (CLAUDE.md, «Сервер не собирает сайт»). Платной
 * модели здесь тоже нет: Whisper работает в Actions бесплатно.
 *
 * Здесь — правила без базы: что считается голосовым, кому можно, что
 * ответить. Очередь и отправка — в voice-notes-store.ts.
 */

/** Кто может прислать голосовое на расшифровку: владелец и руководитель. */
export const VOICE_ROLES = ["admin", "head"] as const;

export function transcribesVoice(staff: Pick<Staff, "role">): boolean {
  return (VOICE_ROLES as readonly string[]).includes(staff.role);
}

/** Больше часа не берём: расшифровка не уложится в задачу Actions. */
export const VOICE_MAX_SECONDS = 60 * 60;

/** Bot API отдаёт файлы до 20 МБ (getFile) — больше бот не скачает. */
export const VOICE_MAX_BYTES = 20 * 1024 * 1024;

/** Сколько раз задача берёт голос, прежде чем сдаться и сказать об этом. */
export const VOICE_MAX_TRIES = 3;

/** «В работе» дольше — задача упала на середине: голос снова в очереди. */
export const VOICE_STALE_MS = 45 * 60_000;

/** Текст длиннее — обрезаем: в Telegram это два десятка сообщений подряд. */
export const VOICE_MAX_TEXT = 60_000;

type TgVoice = { file_id: string; duration?: number; mime_type?: string; file_size?: number };
type TgAudio = TgVoice & { title?: string; file_name?: string };
type TgDocument = { file_id: string; mime_type?: string; file_size?: number; file_name?: string };

export type VoiceMessage = { voice?: TgVoice; audio?: TgAudio; document?: TgDocument };

export type Voice = { fileId: string; mime: string; duration: number | null; bytes: number | null };

const AUDIO_FILE = /\.(ogg|oga|opus|mp3|m4a|aac|wav|flac|amr|wma|webm)$/i;

/**
 * Голос в сообщении: голосовое, аудиофайл или документ со звуком (так
 * приходит пересланная запись диктофона). Кружок и видео сюда не идут —
 * это кружок для касаний (circle-bot.ts).
 */
export function voiceFromMessage(message: VoiceMessage | undefined): Voice | null {
  const voice = message?.voice ?? message?.audio;
  if (voice?.file_id) {
    return {
      fileId: voice.file_id,
      mime: voice.mime_type || "audio/ogg",
      duration: typeof voice.duration === "number" ? voice.duration : null,
      bytes: typeof voice.file_size === "number" ? voice.file_size : null,
    };
  }
  const doc = message?.document;
  if (doc?.file_id && (doc.mime_type?.startsWith("audio/") || AUDIO_FILE.test(doc.file_name ?? ""))) {
    return {
      fileId: doc.file_id,
      mime: doc.mime_type || "audio/ogg",
      duration: null,
      bytes: typeof doc.file_size === "number" ? doc.file_size : null,
    };
  }
  return null;
}

export type VoiceProblem = "too_big" | "too_long";

export function voiceProblem(voice: Voice): VoiceProblem | null {
  if ((voice.bytes ?? 0) > VOICE_MAX_BYTES) return "too_big";
  if ((voice.duration ?? 0) > VOICE_MAX_SECONDS) return "too_long";
  return null;
}

/** 252 → «4:12», 3725 → «1:02:05». */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

function lengthNote(seconds: number | null): string {
  const length = formatDuration(seconds);
  return length ? ` (${length})` : "";
}

/** Ответ сразу после пересылки. Бот пишет по-русски (CLAUDE.md, «Инструкции к панели»). */
export function receivedText(voice: Voice): string {
  return `🎙 Получил голосовое${lengthNote(voice.duration)} — расшифровываю. Текст пришлю сюда, обычно через 10–20 минут.`;
}

export function problemText(problem: VoiceProblem | "save"): string {
  if (problem === "too_big") return "🎙 Файл больше 20 МБ — Telegram не отдаёт боту такие файлы. Пришлите запись короче или частями.";
  if (problem === "too_long") return "🎙 Запись длиннее часа — пришлите её частями, до часа каждая.";
  return "🎙 Не получилось поставить голосовое в очередь. Перешлите его ещё раз через минуту.";
}

/** Готовый текст: заголовок и расшифровка. Длинный бот режет на сообщения сам (sendPlain). */
export function doneText(duration: number | null, text: string): string {
  const body = text.trim();
  if (!body) return `🎙 В голосовом${lengthNote(duration)} не расслышал слов — возможно, там тишина или музыка.`;
  const clipped = body.length > VOICE_MAX_TEXT ? `${body.slice(0, VOICE_MAX_TEXT)}…\n\n(текст обрезан — запись очень длинная)` : body;
  return `📝 Расшифровка голосового${lengthNote(duration)}:\n\n${clipped}`;
}

export function failedText(duration: number | null): string {
  return `⚠️ Голосовое${lengthNote(duration)} расшифровать не получилось за ${VOICE_MAX_TRIES} попытки. Перешлите его ещё раз — или напишите разработчику.`;
}

/**
 * Текст, присланный задачей Actions: строка, без управляющих символов, с
 * разумной длиной. Пустая строка — «слов не расслышал», а не ошибка.
 */
export function cleanTranscript(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value
    .replace(/\r\n?/g, "\n")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, VOICE_MAX_TEXT + 1);
}

/** Голос из очереди, который пора отдать задаче: новый или зависший «в работе». */
export function isTakeable(
  row: { status: string; tries: number; taken_at: string | null },
  now: Date,
): boolean {
  if (row.tries >= VOICE_MAX_TRIES) return false;
  if (row.status === "queued") return true;
  if (row.status !== "working") return false;
  const taken = row.taken_at ? Date.parse(row.taken_at) : NaN;
  return !Number.isFinite(taken) || now.getTime() - taken > VOICE_STALE_MS;
}

/** Зависший «в работе», у которого попыток больше не осталось: пора сказать, что не вышло. */
export function isGivenUp(row: { status: string; tries: number; taken_at: string | null }, now: Date): boolean {
  if (row.status !== "working" || row.tries < VOICE_MAX_TRIES) return false;
  const taken = row.taken_at ? Date.parse(row.taken_at) : NaN;
  return !Number.isFinite(taken) || now.getTime() - taken > VOICE_STALE_MS;
}

/**
 * Вход задачи расшифровки в app/api/voice/*: общий секрет смен
 * (SHIFT_REPORT_SECRET) в заголовке x-devuz-shift, как у отчёта смены.
 * Секрета нет в окружении — не пускаем никого: звук голосового — это ТЗ
 * клиента, и отдавать его наружу по пустому секрету нельзя.
 */
export const VOICE_SECRET_HEADER = "x-devuz-shift";

export function voiceSecretOk(provided: string | null, expected: string | undefined): boolean {
  return Boolean(expected) && provided === expected;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isVoiceId(value: string): boolean {
  return UUID.test(value);
}
