/**
 * Наш ли это макет — по стилям чужого сайта.
 *
 * Отпечаток (lib/proto/stamp) — набор чисел оформления с незаметными
 * сдвигами. Здесь из стилей чужой страницы вынимаются все такие числа в
 * общем виде, и набор каждого нашего макета сверяется с ними.
 *
 * Сравнение — по смыслу, а не по записи. Скопировавший через F12 получает
 * цвета в rgb, нейросеть переписывает их в hex, а мы ставили hsl: поэтому
 * цвет приводится к целым rgb, длины — к числу с единицей. Одна совпавшая
 * величина ничего не значит (14.5px бывает у кого угодно), десяток — это уже
 * не совпадение: точный оттенок, сдвинутый на две единицы rgb, случайно не
 * повторяют.
 */
import { colorSignal, hslToRgb, type Stamp } from "@/lib/proto/stamp";

const num = (value: number) => String(Number(value.toFixed(4)));

function hexToRgb(hex: string): number[] | null {
  const h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) return [0, 1, 2].map((i) => parseInt(h[i] + h[i], 16));
  if (h.length === 6 || h.length === 8) return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return null;
}

/** Все признаки из текста стилей: цвета в rgb, длины, межбуквенные, высота строк. */
export function signalsOf(css: string): Set<string> {
  const out = new Set<string>();

  for (const m of css.matchAll(/#([0-9a-f]{3,8})\b/gi)) {
    const rgb = hexToRgb(m[0]);
    if (rgb) out.add(colorSignal(rgb));
  }
  for (const m of css.matchAll(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/gi)) {
    out.add(colorSignal([m[1], m[2], m[3]].map((v) => Math.round(Number(v)))));
  }
  for (const m of css.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/gi)) {
    out.add(colorSignal(hslToRgb(Number(m[1]), Number(m[2]), Number(m[3]))));
  }
  for (const m of css.matchAll(/(-?\d*\.\d+)px/g)) out.add(`px:${num(Number(m[1]))}`);
  for (const m of css.matchAll(/(-?\d*\.\d+)em\b/g)) out.add(`em:${num(Number(m[1]))}`);
  for (const m of css.matchAll(/line-height\s*:\s*(\d+(?:\.\d+)?)(?=[;}\s!])/g)) out.add(`lh:${num(Number(m[1]))}`);
  return out;
}

/** Числа скриптов с тремя-четырьмя знаками после точки — так их сдвигает отпечаток. */
export function scriptSignalsOf(js: string): Set<string> {
  const out = new Set<string>();
  for (const m of js.matchAll(/(?<![\w.])(\d*\.\d{3,4})(?![\d])/g)) out.add(`js:${num(Number(m[1]))}`);
  return out;
}

export type Match = {
  matched: number;
  total: number;
  hits: string[];
  /** Слова-ловушки из демо-данных, найденные в тексте сайта. */
  traps: string[];
  level: "strong" | "likely" | "none";
};

/**
 * Сколько признаков макета нашлось.
 *
 * Числа (стили и скрипты): «точно наш» — от шести совпадений и не меньше
 * половины набора: так случайное совпадение исключено, а частичная переделка
 * (сменили пару цветов) всё равно ловится. «Похоже» — от трёх, если среди них
 * есть цвет или число скрипта: длины вроде 14.5px сами по себе не говорят
 * ничего.
 *
 * Ловушки (`text:`) — выдуманные слова из демо-данных: два разных слова в
 * тексте сайта — «точно наш», одно — «похоже». Русское и узбекское написание
 * одного слова считаются одним.
 */
export function matchStamp(stamp: Pick<Stamp, "signals">, found: ReadonlySet<string>, text = ""): Match {
  const numbers = stamp.signals.filter((signal) => !signal.startsWith("text:"));
  const hits = numbers.filter((signal) => found.has(signal));
  const total = numbers.length;
  const strongish = hits.filter((hit) => hit.startsWith("color:") || hit.startsWith("js:")).length;
  const traps = text
    ? stamp.signals.filter((signal) => signal.startsWith("text:") && text.includes(signal.slice(5))).map((s) => s.slice(5))
    : [];
  const trapWords = new Set(traps.map(trapKey)).size;
  const byNumbers =
    total && hits.length >= 6 && hits.length * 2 >= total ? "strong" : hits.length >= 3 && strongish >= 1 ? "likely" : "none";
  const level = trapWords >= 2 ? "strong" : trapWords === 1 && byNumbers === "none" ? "likely" : byNumbers;
  return { matched: hits.length, total, hits, traps, level };
}

/** «Ойдинсой» и «Oydinsoy» — одно слово: сравниваем по латинице. */
function trapKey(word: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l",
    м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
    ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return [...word.toLowerCase()].map((c) => map[c] ?? c).join("").replace(/x/g, "h");
}
