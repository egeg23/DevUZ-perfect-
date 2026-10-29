/**
 * «Вставить реквизиты»: текст, как его прислал клиент, → поля договора.
 *
 * Владелец, 29.10.2026: «очень много всего заполнять надо. Давай проще…
 * сделай это скриптом, а не нейронкой». Руководитель перебивал реквизиты
 * CZECHFARM из заметки по полям руками.
 *
 * Только регулярные выражения, без модели. Чего не нашлось — пусто, и это
 * видно человеку: угаданный счёт хуже пустого поля, он уходит в платёжку.
 * Число берётся, только если у него правильная длина: ИНН — 9 цифр, ПИНФЛ —
 * 14, расчётный счёт — 20 (пробелы между группами убираются), МФО — 5.
 */

export type Requisites = {
  name: string;
  address: string;
  taxId: string;
  account: string;
  mfo: string;
  bank: string;
  vat: string;
  oked: string;
  director: string;
};

/** Поле договора ← ключ разбора: форма раскладывает по этим именам. */
export const FIELD_OF = {
  name: "client_name",
  taxId: "client_tax_id",
  bank: "client_bank_name",
  account: "client_account",
  mfo: "client_mfo",
} as const;

/** Что не нашлось среди того, без чего договор не отправить. */
export type Missing = "name" | "address" | "taxId" | "account" | "mfo" | "bank";
const REQUIRED: Missing[] = ["name", "address", "taxId", "account", "mfo", "bank"];

const ORG = "(?:ООО|ОАО|АО|ЗАО|ЧП|СП|ИП|ЧУП|ГУП|МЧЖ|МЧЖ|XK|QK|YaTT|OOO|LLC)";

/** «1. ООО …» → «ООО …»: номер пункта, который клиент поставил в письме. */
const unnumber = (s: string) => s.replace(/^\s*\d+\s*[.)]\s*/, "").trim();

/** Хвостовые знаки, которые остаются от письма: «;», «,». Точку у «ф.» не трогаем. */
const tidy = (s: string) => s.replace(/[\s;,]+$/, "").replace(/\s+/g, " ").trim();

function after(lines: string[], re: RegExp): string {
  for (const line of lines) {
    const m = line.match(re);
    if (m?.[1]) return tidy(m[1]);
  }
  return "";
}

function digitsAfter(text: string, label: RegExp, size: number): string {
  const re = new RegExp(`${label.source}\\s*[:№#-]?\\s*([\\d][\\d \\u00a0]*)`, "giu");
  for (const m of text.matchAll(re)) {
    const digits = m[1].replace(/[\s ]/g, "");
    // Цифры подряд до следующей буквы: «МФО 00450 ОКЭД 62010» → 00450.
    const head = m[1].trim().split(/[\s ]+/);
    if (digits.length === size) return digits;
    if (head[0]?.length === size) return head[0];
  }
  return "";
}

export function parseRequisites(raw: string): Requisites {
  const text = raw.replace(/\r/g, "").slice(0, 5000);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Название: строка с организационной формой — «ООО «…»», «ИП Иванов».
  const nameLine = lines.find((l) => new RegExp(`(^|[\\s«"])${ORG}(?=[\\s«"“])`, "u").test(unnumber(l)));
  const name = nameLine ? tidy(unnumber(nameLine)) : "";

  const address = after(lines, /(?:юр(?:идический)?\.?\s*|почтовый\s+)?адрес\s*[:-]?\s*(.+)$/iu);

  // ИНН — 9 цифр; ПИНФЛ — 14 у физлица и ИП. ИНН главнее: он у юрлица.
  const taxId = digitsAfter(text, /(?:ИНН|STIR|СТИР)/u, 9) || digitsAfter(text, /(?:ПИНФЛ|JShShIR|ЖШШИР)/u, 14);

  // Счёт — 20 цифр: «р\с 2020 8000 …», «р/с», «расчётный счёт», «х/р».
  const account = digitsAfter(text, /(?:р\s*[\\/]\s*сч?|р\.\s*с\.?|расч[её]тный\s+сч[её]т|х\s*[\\/]\s*р|h\s*[\\/]\s*r)/iu, 20);

  const mfo = digitsAfter(text, /(?:МФО|MFO)/u, 5);
  const oked = digitsAfter(text, /(?:ОКЭД|OKED|IFUT)/u, 5);
  const vat =
    digitsAfter(text, /(?:код\s+плательщика\s+НДС|рег(?:истрационный|\.)?\s*код\s+НДС|QQS)/iu, 12) ||
    digitsAfter(text, /(?:код\s+плательщика\s+НДС|рег(?:истрационный|\.)?\s*код\s+НДС|QQS)/iu, 9);

  // Банк: «в «…банк» … ф.», «Банк: …». Строка счёта тоже бывает «в банке», поэтому
  // берём часть после «в» и только если в ней есть слово «банк».
  const bank =
    after(lines, /^банк\s*[:-]\s*(.+)$/iu) ||
    after(lines, /(?:^|\s)в\s+((?:[«"“]|АКБ|АО|ЧАКБ|ОАО).*(?:банк|bank).*)$/iu) ||
    after(lines, /(?:^|\s)в\s+(.*(?:банк|bank).*)$/iu);

  const director = after(lines, /директор\s*[:-]?\s*(.+)$/iu);

  return { name, address, taxId, account, mfo, bank, vat, oked, director };
}

/**
 * «Адрес, идентификатор, контакт» договора — одной строкой из того, у
 * чего нет своего поля: адрес, код НДС, ОКЭД, директор.
 */
export function detailsOf(r: Requisites): string {
  return [
    r.address && `Адрес: ${r.address}`,
    r.vat && `Код плательщика НДС: ${r.vat}`,
    r.oked && `ОКЭД: ${r.oked}`,
    r.director && `Директор: ${r.director}`,
  ]
    .filter(Boolean)
    .join("; ");
}

export function missingOf(r: Requisites): Missing[] {
  return REQUIRED.filter((k) => !r[k]);
}
