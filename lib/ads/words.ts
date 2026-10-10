/**
 * Слова запросов: нормализация, основа слова, проверка «минус-слово режет ключ».
 *
 * Директ и Google сравнивают минус-слова с запросом с учётом словоформ:
 * минус «бесплатно» отсекает и «бесплатный», и «бесплатные». Настоящая
 * морфология нам не нужна — нужна осторожная основа: отрезать окончание и
 * сравнивать то, что осталось. Ошибка в сторону «совпало» здесь безопаснее:
 * лишний раз решить, что минус задевает ключ, значит не предложить минус, а
 * не отрезать рабочий запрос.
 */

/** Служебные слова: площадки их не учитывают, и минусом они не бывают. */
export const STOP_WORDS = new Set([
  "в", "во", "на", "с", "со", "и", "для", "по", "от", "до", "из", "как", "что", "у", "к", "ко", "о", "об",
  "за", "не", "а", "или", "без", "при", "под", "над", "же", "ли", "то", "это", "the", "a", "of", "for", "in",
  "va", "uchun", "bilan", "ham",
]);

const ENDINGS = [
  // русские — длинные первыми
  "иями", "ями", "ами", "ого", "его", "ому", "ему", "ыми", "ими", "ов", "ев", "ей", "ой", "ий", "ый", "ая", "яя",
  "ое", "ее", "ые", "ие", "ую", "юю", "ом", "ем", "ах", "ях", "ам", "ям", "а", "я", "ы", "и", "у", "ю", "е", "о",
  "ь", "й",
  // узбекские (латиница)
  "larning", "lardan", "larga", "larda", "lari", "lar", "ning", "dagi", "dan", "ga", "da", "ni",
];

/** Строчные, ё → е, без пунктуации и операторов площадок. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[‘’ʻʼ`]/g, "'")
    .replace(/[!+"\[\]\-–—.,;:?()«»/\\|*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(text: string): string[] {
  return normalize(text).split(" ").filter((word) => word && !STOP_WORDS.has(word));
}

/** Основа слова: без окончания, не короче трёх букв. */
export function stem(word: string): string {
  if (word.length <= 4 || /\d/.test(word)) return word;
  for (const ending of ENDINGS) {
    if (word.endsWith(ending) && word.length - ending.length >= 3) return word.slice(0, -ending.length);
  }
  return word;
}

export function stems(text: string): string[] {
  return tokens(text).map(stem);
}

/**
 * Режет ли минус-фраза ключевую фразу: все слова минуса есть в ключе.
 * Именно так площадки и отсекают: запрос по ключу «ремонт айфона» со
 * словом «бесплатно» не покажется, а минус «ремонт» убьёт ключ целиком.
 */
export function blocks(negative: string, keyword: string): boolean {
  const neg = stems(negative);
  if (!neg.length) return false;
  const kw = new Set(stems(keyword));
  return neg.every((s) => kw.has(s));
}

/** Режет ли минус запрос (для подсчёта, сколько денег он отсёк бы). */
export const matchesQuery = blocks;

/** Какие ключи режет минус-фраза. */
export function blockedKeywords(negative: string, keywords: readonly string[]): string[] {
  return keywords.filter((keyword) => blocks(negative, keyword));
}

/**
 * Конфликты, которые уже есть в кабинете: минус-фраза, из-за которой ключ
 * не показывается. Adalysis и Optmyzr считают это отдельной проверкой —
 * ошибка частая (минус добавили на кампанию, ключ потом дописали в группу), и
 * деньги она не тратит, а теряет показы молча.
 */
export function existingConflicts(
  negatives: readonly string[],
  keywords: readonly string[],
): { negative: string; keyword: string }[] {
  const out: { negative: string; keyword: string }[] = [];
  for (const negative of negatives) {
    for (const keyword of keywords) if (blocks(negative, keyword)) out.push({ negative, keyword });
  }
  return out;
}
