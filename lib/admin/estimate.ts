/**
 * Смета: файл от менеджера → строки в договоре.
 *
 * Владелец: «по загруженной смете которую мы согласовали — сотрудник на этом
 * этапе загружает ее и данные по смете вытягиваются в договор».
 *
 * Разбираются CSV и TSV — то, во что Excel и Google Sheets сохраняют в один
 * клик. XLSX это zip с XML, и без внешней библиотеки читается ненадёжно;
 * такой файл прикрепляется к договору как есть, а строки менеджер вносит
 * руками. Молча вернуть пустой список для xlsx нельзя: менеджер решит, что
 * смета пустая, и отправит договор без неё.
 */

export type EstimateItem = {
  /** Что делаем: «Дизайн главной и внутренних», «Интеграция оплаты». */
  title: string;
  /** Штуки, часы, страницы — как в смете. Пусто, когда единица не указана. */
  unit: string;
  qty: number;
  /** Цена за единицу. */
  price: number;
  /** qty × price, пересчитывается нами, а не берётся из файла. */
  total: number;
};

export type ParseResult =
  | { ok: true; items: EstimateItem[] }
  | { ok: false; why: "unsupported" | "empty" | "shape"; hint: string };

/** Расширения, которые мы умеем разбирать. */
export const PARSABLE = [".csv", ".tsv", ".txt"] as const;

export function isParsable(filename: string): boolean {
  const lower = filename.toLowerCase();
  return PARSABLE.some((ext) => lower.endsWith(ext));
}

/**
 * Число из ячейки.
 *
 * Пробелы-разделители тысяч, неразрывные пробелы и запятая вместо точки —
 * то, как числа выглядят в реальной смете, выгруженной из Excel с русской
 * локалью. `Number("1 200,50")` даёт NaN, и сумма договора молча уехала бы
 * в ноль.
 */
export function num(raw: string): number {
  const cleaned = raw
    .replace(/[\s  ]/g, "")
    .replace(/[^\d.,-]/g, "")
    .replace(/,/g, ".");
  // Две точки после замены запятых означают «1.200.50» — разделители тысяч.
  const parts = cleaned.split(".");
  const normalized = parts.length > 2 ? parts.slice(0, -1).join("") + "." + parts.at(-1) : cleaned;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

/** Разбивает строку на ячейки по разделителю, уважая кавычки. */
function cells(line: string, sep: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // Две кавычки подряд внутри поля — это экранированная кавычка.
      if (quoted && line[i + 1] === '"') { current += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === sep && !quoted) {
      out.push(current);
      current = "";
    } else current += ch;
  }
  out.push(current);
  return out.map((c) => c.trim());
}

/**
 * Разбирает текст сметы.
 *
 * Ожидаемая форма: название, [единица], количество, цена. Колонок может быть
 * больше — берём первую как название и две последние числовые как количество
 * и цену. Это переживает лишние колонки вроде «№» и «примечание», которых в
 * реальных сметах всегда хватает.
 */
export function parseEstimate(text: string, filename: string): ParseResult {
  if (!isParsable(filename)) {
    return {
      ok: false,
      why: "unsupported",
      hint: "Разбираем CSV и TSV. Сохраните смету как CSV — или внесите строки руками, файл всё равно приложится к договору.",
    };
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { ok: false, why: "empty", hint: "Файл пустой." };

  // Разделитель определяем по первой строке: точка с запятой у русского
  // Excel, запятая у Google Sheets, табуляция у копипаста из таблицы.
  const first = lines[0];
  const sep = first.includes("\t") ? "\t" : (first.split(";").length > first.split(",").length ? ";" : ",");

  const items: EstimateItem[] = [];
  for (const line of lines) {
    const row = cells(line, sep);
    // Заголовок таблицы отдельной проверки не требует: у него в последней
    // колонке слово («Цена», «Сумма»), а не число, поэтому он отсеивается
    // там же, где строки без цены. Отдельная проверка здесь стояла и была
    // мёртвой — это тоже показала мутация.
    if (row.length < 2) continue;

    const title = row[0];
    if (!title) continue;

    // Числовые ячейки с конца: цена последняя, количество перед ней.
    const numeric = row.slice(1).map(num);
    const price = numeric.at(-1) ?? 0;
    const qty = numeric.length >= 2 ? (numeric.at(-2) ?? 1) : 1;
    if (price <= 0) continue;

    const unitCell = row.length >= 4 ? row[1] : "";
    items.push({
      title,
      unit: /^\d/.test(unitCell) ? "" : unitCell,
      qty: qty > 0 ? qty : 1,
      price,
      total: Math.round((qty > 0 ? qty : 1) * price * 100) / 100,
    });
  }

  if (items.length === 0) {
    return {
      ok: false,
      why: "shape",
      hint: "Ни одной строки с ценой. Ожидаем колонки: название, [единица], количество, цена.",
    };
  }
  return { ok: true, items };
}

/** Сумма сметы — она же сумма договора. */
export function estimateTotal(items: readonly EstimateItem[]): number {
  return Math.round(items.reduce((sum, i) => sum + i.total, 0) * 100) / 100;
}
