/**
 * Смета: файл от менеджера → строки в договоре.
 *
 * Владелец: «по загруженной смете которую мы согласовали — сотрудник на этом
 * этапе загружает ее и данные по смете вытягиваются в договор».
 *
 * Разбираются CSV, TSV, Excel (xlsx) и PDF с текстовым слоем: xlsx и PDF
 * сначала превращаются в те же строки с табуляцией (lib/admin/estimate-file.ts),
 * а дальше путь общий. Что не разобралось — например, скан, — менеджер
 * вставляет строками руками, файл всё равно прикладывается к договору.
 * Молча вернуть пустой список нельзя: менеджер решит, что смета пустая, и
 * отправит договор без неё.
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

/** Текст, который разбирается напрямую. */
export const PARSABLE = [".csv", ".tsv", ".txt"] as const;

/** Файлы, которые сначала превращаются в строки (lib/admin/estimate-file.ts). */
export const CONVERTIBLE = [".xlsx", ".pdf"] as const;

/** Что можно загрузить сметой и получить строки. */
export function isReadable(filename: string): boolean {
  const lower = filename.toLowerCase();
  return [...PARSABLE, ...CONVERTIBLE].some((ext) => lower.endsWith(ext));
}

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
      hint: "Разбираем Excel (xlsx), CSV, TSV и PDF с текстом. Сохраните смету в одном из них — или вставьте строки руками ниже, файл всё равно приложится к договору.",
    };
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { ok: false, why: "empty", hint: "Файл пустой." };

  // Разделитель — по каждой строке: точка с запятой у русского Excel,
  // запятая у Google Sheets, табуляция у копипаста из таблицы. По строке, а
  // не по первой на весь файл: вставленные руками строки бывают вперемешку —
  // пара скопирована из Excel, остальные дописаны через «;».
  const sepOf = (line: string) =>
    line.includes("\t") ? "\t" : line.split(";").length > line.split(",").length ? ";" : ",";
  const rows = lines.map((line) => cells(line, sepOf(line)));
  const header = headerOf(rows);
  if (header) {
    const items = byHeader(rows.slice(header.row + 1), header);
    if (items.length) return { ok: true, items };
  }

  const items: EstimateItem[] = [];
  for (const row of rows) {
    // Заголовок таблицы отдельной проверки не требует: у него в последней
    // колонке слово («Цена», «Сумма»), а не число, поэтому он отсеивается
    // там же, где строки без цены. Отдельная проверка здесь стояла и была
    // мёртвой — это тоже показала мутация.
    if (row.length < 2) continue;

    // Первая колонка — «№»: название тогда первая колонка с буквами.
    const title = /^\d+[.)]?$/.test(row[0]) ? (row.find((cell) => /\p{L}/u.test(cell)) ?? "") : row[0];
    if (!title || TOTAL_ROW.test(title)) continue;

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

/** «Итого», «Всего», «Total» — строка суммы, а не позиция. */
// \b в JS знает только латиницу: после «Итого» он границы не видит.
const TOTAL_ROW = /^(итого|всего|total|jami)(?!\p{L})/iu;

type Header = { row: number; title: number; unit: number; qty: number; price: number; total: number };

const find = (row: string[], pattern: RegExp, skip: number[] = []) =>
  row.findIndex((cell, i) => !skip.includes(i) && pattern.test(cell));

/**
 * Шапка таблицы, если она есть.
 *
 * С шапкой колонки берутся по названиям, а не по месту. Иначе смета с
 * колонкой «Сумма» в конце — а так выглядит почти любая смета из Excel —
 * читалась бы как «количество = цена, цена = сумма», и итог договора
 * вырастал бы в разы.
 */
function headerOf(rows: string[][]): Header | null {
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    let price = find(row, /цена|price|narx/i);
    const total = find(row, /сумма|итого|всего|total|amount|jami|стоимость/i, price >= 0 ? [price] : []);
    if (price < 0) price = find(row, /стоимость|тариф|rate/i, total >= 0 ? [total] : []);
    if (price < 0 && total < 0) continue;
    const used = [price, total].filter((i) => i >= 0);
    const qty = find(row, /кол|qty|quant|miqdor|soni|часы|часов|hours/i, used);
    const unit = find(row, /^ед|единиц|unit|o‘lchov/i, [...used, qty]);
    let title = find(row, /наимен|назван|работ|услуг|позици|описан|title|name|item|nomi|xizmat/i, [...used, qty, unit]);
    if (title < 0) title = row.findIndex((cell, i) => ![...used, qty, unit].includes(i) && !/^№|^#|^n$/i.test(cell) && cell !== "");
    if (title < 0) continue;
    return { row: r, title, unit, qty, price, total };
  }
  return null;
}

function byHeader(rows: string[][], h: Header): EstimateItem[] {
  const items: EstimateItem[] = [];
  for (const row of rows) {
    const title = (row[h.title] ?? "").trim();
    if (!title || TOTAL_ROW.test(title)) continue;
    const qtyRaw = h.qty >= 0 ? num(row[h.qty] ?? "") : 0;
    const qty = qtyRaw > 0 ? qtyRaw : 1;
    let price = h.price >= 0 ? num(row[h.price] ?? "") : 0;
    // Цены нет, а сумма есть — цена за единицу выводится из неё.
    if (price <= 0 && h.total >= 0) price = num(row[h.total] ?? "") / qty;
    if (!(price > 0)) continue;
    price = Math.round(price * 100) / 100;
    items.push({
      title,
      unit: h.unit >= 0 ? (row[h.unit] ?? "").trim() : "",
      qty,
      price,
      total: Math.round(qty * price * 100) / 100,
    });
  }
  return items;
}

/** Сумма сметы — она же сумма договора. */
export function estimateTotal(items: readonly EstimateItem[]): number {
  return Math.round(items.reduce((sum, i) => sum + i.total, 0) * 100) / 100;
}
