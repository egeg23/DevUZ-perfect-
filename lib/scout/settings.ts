/**
 * Как скаут отбирает сообщения — вкладка «Скаут» в «ИИ-сотрудниках».
 *
 * Владелец, 08.11.2026: «Выведи настройки скаута в ИИ сотрудника. Чтобы
 * можно было добавлять, убирать прям там. Поставь отслеживание в
 * автоматическом режиме или по заданным словам».
 *
 * «Автоматически» — прежний дешёвый отсев (`prefilter`: тема + спрос, без
 * рекламы исполнителей) и модель. «По словам» — до модели доходит только
 * сообщение, где есть хотя бы одно из заданных слов или фраз; модель
 * по-прежнему отличает заказ от рекламы, поэтому лента не забивается
 * чужими объявлениями. Слово ловится с начала слова: «сайт» найдёт и
 * «сайта», и «сайтом».
 */

export type ScoutMode = "auto" | "words";
export const SCOUT_MODES: readonly ScoutMode[] = ["auto", "words"];
export type ScoutSettings = { mode: ScoutMode; words: string[] };

/** Строка `stats_snapshots` с настройками. */
export const SCOUT_SETTINGS_KEY = "scout-settings";
export const DEFAULT_SETTINGS: ScoutSettings = { mode: "auto", words: [] };

export const WORD_MIN = 2;
export const WORD_MAX = 60;
export const WORDS_MAX = 100;

const fold = (text: string) => text.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();

/** Поле «по строке или через запятую» → чистый список без повторов. */
export function parseWords(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[\n,;]+/)) {
    const word = fold(raw);
    if (word.length < WORD_MIN || word.length > WORD_MAX || out.includes(word)) continue;
    out.push(word);
    if (out.length >= WORDS_MAX) break;
  }
  return out;
}

/** Что лежит в базе → настройки; мусор и пустой список слов — «автоматически». */
export function settingsOf(payload: unknown): ScoutSettings {
  const p = (payload ?? {}) as { mode?: unknown; words?: unknown };
  const words = Array.isArray(p.words) ? parseWords(p.words.map(String).join("\n")) : [];
  const mode: ScoutMode = p.mode === "words" && words.length ? "words" : "auto";
  return { mode, words };
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Первое найденное слово или null. Граница слова — по буквам Юникода, а не \b. */
export function matchedWord(text: string, words: readonly string[]): string | null {
  const clean = fold(text);
  for (const word of words) {
    const body = escape(word).replace(/ /g, "\\s+");
    if (new RegExp(`(?<![\\p{L}\\p{N}])${body}`, "iu").test(clean)) return word;
  }
  return null;
}
