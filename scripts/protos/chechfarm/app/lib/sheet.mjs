/* Таблица из файла: Excel (.xlsx) или CSV → строки ячеек, без пакетов.
   xlsx — это ZIP: читаем оглавление архива, распаковываем общие строки и
   первый лист (zlib), из XML берём значения ячеек. Старый .xls (двоичный) не
   читается: человеку — «сохраните как .xlsx или CSV». */
import { inflateRawSync } from "node:zlib";

const MAX_ROWS = 5000, MAX_COLS = 40, MAX_UNZIP = 60 * 1048576;

function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("Файл не похож на Excel (.xlsx)");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map();
  for (let n = 0; n < count && p + 46 <= buf.length; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), real = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28), extra = buf.readUInt16LE(p + 30), comm = buf.readUInt16LE(p + 32), at = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString("utf8");
    files.set(name, () => {
      if (real > MAX_UNZIP) throw new Error("Таблица слишком большая");
      const start = at + 30 + buf.readUInt16LE(at + 26) + buf.readUInt16LE(at + 28), data = buf.subarray(start, start + size);
      if (method === 0) return data.toString("utf8");
      if (method === 8) return inflateRawSync(data, { maxOutputLength: MAX_UNZIP }).toString("utf8");
      throw new Error("Excel сжат незнакомым способом: сохраните как CSV");
    });
    p += 46 + nameLen + extra + comm;
  }
  return files;
}

const xmlText = (s) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, "&");
const colOf = (ref) => { let n = 0; for (const ch of /^[A-Z]+/.exec(ref)?.[0] || "A") n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };

function readXlsx(buf) {
  const files = unzip(buf), get = (n) => files.get(n)?.() || "";
  const shared = [...get("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => xmlText([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")));
  /* Первый лист по книге: xl/workbook.xml → rels; не нашли — sheet1. */
  let sheet = "xl/worksheets/sheet1.xml";
  const first = /<sheet\b[^>]*r:id="([^"]+)"/.exec(get("xl/workbook.xml"));
  if (first) { const t = new RegExp(`<Relationship\\b[^>]*Id="${first[1]}"[^>]*Target="([^"]+)"`).exec(get("xl/_rels/workbook.xml.rels")) || new RegExp(`<Relationship\\b[^>]*Target="([^"]+)"[^>]*Id="${first[1]}"`).exec(get("xl/_rels/workbook.xml.rels")); if (t) sheet = t[1].startsWith("/") ? t[1].slice(1) : "xl/" + t[1].replace(/^\.\//, ""); }
  if (!files.has(sheet)) throw new Error("В файле нет листа с таблицей");
  const rows = [];
  for (const r of get(sheet).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    if (rows.length >= MAX_ROWS) break;
    const row = [];
    for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1], body = c[2] || "", i = colOf((/\br="([A-Z]+)\d+"/.exec(attrs) || [])[1] || "");
      if (i >= MAX_COLS) continue;
      const type = (/\bt="(\w+)"/.exec(attrs) || [])[1], v = (/<v>([\s\S]*?)<\/v>/.exec(body) || [])[1];
      let val = "";
      if (type === "s") val = shared[+v] || "";
      else if (type === "inlineStr") val = xmlText((/<is>([\s\S]*?)<\/is>/.exec(body) || [])[1] || "");
      else if (v != null) val = xmlText(v);
      row[i < 0 ? row.length : i] = val.trim();
    }
    rows.push(Array.from(row, (x) => x || ""));
  }
  return rows;
}

function readCsv(text) {
  text = text.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0];
  const sep = [";", "\t", ","].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length && rows.length < MAX_ROWS; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (ch === '"') q = false; else f += ch; continue; }
    if (ch === '"') q = true;
    else if (ch === sep) { row.push(f.trim()); f = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(f.trim()); rows.push(row.slice(0, MAX_COLS)); row = []; f = ""; }
    else f += ch;
  }
  if (f || row.length) { row.push(f.trim()); rows.push(row.slice(0, MAX_COLS)); }
  return rows;
}

/* buf, имя файла → { headers, rows } без пустых строк; первая непустая строка — заголовки. */
export function readSheet(buf, name = "") {
  const hex = buf.subarray(0, 4).toString("hex");
  let rows;
  if (hex === "504b0304") rows = readXlsx(buf);
  else if (hex === "d0cf11e0") throw new Error("Старый формат Excel (.xls): сохраните файл как .xlsx или CSV и загрузите снова");
  else if (/\.(csv|txt)$/i.test(name) || !buf.includes(0)) rows = readCsv(buf.toString("utf8"));
  else throw new Error("Нужна таблица Excel (.xlsx) или CSV");
  rows = rows.filter((r) => r.some((c) => c));
  if (rows.length < 2) throw new Error("В таблице нет строк с партнёрами");
  const width = Math.min(MAX_COLS, Math.max(...rows.map((r) => r.length)));
  const pad = (r) => Array.from({ length: width }, (_, i) => String(r[i] ?? ""));
  return { headers: pad(rows[0]), rows: rows.slice(1).map(pad) };
}
