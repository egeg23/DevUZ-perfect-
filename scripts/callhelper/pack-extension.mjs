// Собирает расширение DevUz CallHelper (extension/callhelper) в архив
// public/callhelper-ext/devuz-callhelper.zip: его скачивают со страницы
// /ru/callhelper/extension. Архив без сжатия и с одной датой у файлов, чтобы
// сборка на любой машине давала те же байты: тест сверяет его с исходниками.
//
//   node scripts/callhelper/pack-extension.mjs
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32 } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const EXT_DIR = join(ROOT, "extension", "callhelper");
export const ZIP_PATH = join(ROOT, "public", "callhelper-ext", "devuz-callhelper.zip");

function files(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...files(full));
    else out.push(full);
  }
  return out;
}

export function packExtension() {
  const DOS_TIME = 0;
  const DOS_DATE = ((2026 - 1980) << 9) | (12 << 5) | 14;
  const locals = [];
  const central = [];
  let offset = 0;
  for (const full of files(EXT_DIR)) {
    const name = Buffer.from(relative(EXT_DIR, full).split("\\").join("/"), "utf8");
    const data = readFileSync(full);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, data);

    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0x0800, 8);
    dir.writeUInt16LE(0, 10);
    dir.writeUInt16LE(DOS_TIME, 12);
    dir.writeUInt16LE(DOS_DATE, 14);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(data.length, 20);
    dir.writeUInt32LE(data.length, 24);
    dir.writeUInt16LE(name.length, 28);
    dir.writeUInt32LE(offset, 42);
    central.push(dir, name);
    offset += local.length + name.length + data.length;
  }
  const dirSize = central.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(central.length / 2, 8);
  end.writeUInt16LE(central.length / 2, 10);
  end.writeUInt32LE(dirSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...central, end]);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const zip = packExtension();
  writeFileSync(ZIP_PATH, zip);
  console.log(`${relative(ROOT, ZIP_PATH)}: ${zip.length} байт`);
}
