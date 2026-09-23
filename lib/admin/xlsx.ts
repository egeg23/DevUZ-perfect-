import { inflateRawSync } from "node:zlib";

/**
 * Строки первого листа Excel (xlsx) — для сметы.
 *
 * Без библиотеки: xlsx — это zip, внутри XML, и для сметы из него нужно
 * немного — значения ячеек первого листа. Тянуть ради этого зависимость на
 * мегабайт, которая к тому же исполняет формулы и читает макросы, незачем.
 *
 * Чужой файл — не данные, а программа, поэтому всё с потолками: размер
 * архива, размер распакованной части, число строк. Формулы не считаются:
 * берётся значение, которое Excel сохранил при последнем пересчёте.
 */

const MAX_UNPACKED = 20 * 1024 * 1024;
const MAX_ROWS = 2000;

type Entry = { name: string; method: number; offset: number; size: number };

function entries(buf: Buffer): Entry[] {
  // Конец центрального каталога ищем с хвоста: за ним может идти комментарий.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("не zip");

  const count = buf.readUInt16LE(eocd + 10);
  let at = buf.readUInt32LE(eocd + 16);
  const out: Entry[] = [];
  for (let n = 0; n < count && at + 46 <= buf.length; n++) {
    if (buf.readUInt32LE(at) !== 0x02014b50) throw new Error("битый каталог");
    const method = buf.readUInt16LE(at + 10);
    const size = buf.readUInt32LE(at + 20);
    const nameLen = buf.readUInt16LE(at + 28);
    const extraLen = buf.readUInt16LE(at + 30);
    const commentLen = buf.readUInt16LE(at + 32);
    const offset = buf.readUInt32LE(at + 42);
    const name = buf.toString("utf8", at + 46, at + 46 + nameLen);
    out.push({ name, method, offset, size });
    at += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

function unpack(buf: Buffer, entry: Entry): string {
  const at = entry.offset;
  if (buf.readUInt32LE(at) !== 0x04034b50) throw new Error("битая запись");
  const start = at + 30 + buf.readUInt16LE(at + 26) + buf.readUInt16LE(at + 28);
  const packed = buf.subarray(start, start + entry.size);
  if (entry.method === 0) return packed.toString("utf8");
  if (entry.method === 8) return inflateRawSync(packed, { maxOutputLength: MAX_UNPACKED }).toString("utf8");
  throw new Error(`сжатие ${entry.method} не поддерживается`);
}

const ENTITY: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? Number.parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) ? String.fromCodePoint(n) : whole;
    }
    return ENTITY[code.toLowerCase()] ?? whole;
  });
}

/** Текст из всех <t> внутри куска: у форматированной строки их несколько. */
function texts(xml: string): string {
  let out = "";
  for (const m of xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) out += decode(m[1]);
  return out;
}

/** «C12» → 2: номер колонки с нуля. */
function column(ref: string): number {
  const letters = /^[A-Z]+/i.exec(ref)?.[0].toUpperCase() ?? "A";
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function xlsxRows(bytes: ArrayBuffer | Uint8Array): string[][] {
  const buf = Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
  const list = entries(buf);
  const byName = new Map(list.map((e) => [e.name, e]));

  const shared: string[] = [];
  const sst = byName.get("xl/sharedStrings.xml");
  if (sst) for (const m of unpack(buf, sst).matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(texts(m[1]));

  // Первый лист: sheet1, а если его нет — первый по порядку имени.
  const sheet =
    byName.get("xl/worksheets/sheet1.xml") ??
    list.filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name)).sort((a, b) => a.name.localeCompare(b.name))[0];
  if (!sheet) throw new Error("в книге нет листов");

  const rows: string[][] = [];
  for (const rowMatch of unpack(buf, sheet).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    if (rows.length >= MAX_ROWS) break;
    const row: string[] = [];
    for (const cell of rowMatch[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cell[1];
      const inner = cell[2] ?? "";
      const ref = /\br="([A-Z]+\d+)"/i.exec(attrs)?.[1];
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1] ?? "n";
      const raw = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      let value = "";
      if (type === "s") value = shared[Number(raw)] ?? "";
      else if (type === "inlineStr") value = texts(inner);
      else if (raw !== undefined) value = decode(raw);
      const index = ref ? column(ref) : row.length;
      while (row.length < index) row.push("");
      // Табуляция и перевод строки внутри ячейки разорвали бы строку сметы.
      row[index] = value.replace(/[\t\r\n]+/g, " ").trim();
    }
    if (row.some((cell) => cell !== "")) rows.push(row);
  }
  return rows;
}
