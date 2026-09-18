/**
 * Размер картинки по первым байтам файла.
 *
 * Нужен ровно для одного правила: фотография с сайта клиента идёт в прототип,
 * только если она не мельче 1200 px по ширине. Старый снимок 700×452,
 * растянутый на первый экран, портит впечатление сильнее, чем его отсутствие.
 *
 * Атрибуту `width` в вёрстке верить нельзя: у половины сайтов его нет вовсе, а
 * там, где есть, он говорит, как картинку показали, а не какая она. Поэтому
 * читаем заголовок самого файла — первых двух-трёх килобайт хватает, качать
 * файл целиком не нужно.
 */

export type ImageSize = { width: number; height: number };

function png(bytes: Uint8Array): ImageSize | null {
  if (bytes.length < 24) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // Сигнатура, затем длина и тип первого куска: он обязан быть IHDR.
  if (view.getUint32(0) !== 0x89504e47 || view.getUint32(12) !== 0x49484452) return null;
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/** Кадровые маркеры JPEG. Всё остальное — таблицы и комментарии, их пропускаем. */
const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

function jpeg(bytes: Uint8Array): ImageSize | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let at = 2;
  while (at + 9 < bytes.length) {
    if (bytes[at] !== 0xff) {
      at += 1;
      continue;
    }
    const marker = bytes[at + 1];
    // Заполнитель и маркеры без длины — сдвигаемся на два байта.
    if (marker === 0xff || marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      at += 2;
      continue;
    }
    if (SOF.has(marker)) return { height: view.getUint16(at + 5), width: view.getUint16(at + 7) };
    at += 2 + view.getUint16(at + 2);
  }
  return null;
}

function webp(bytes: Uint8Array): ImageSize | null {
  if (bytes.length < 30) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0) !== 0x52494646 || view.getUint32(8) !== 0x57454250) return null;
  const kind = view.getUint32(12);
  if (kind === 0x56503858) {
    // VP8X: ширина и высота минус единица, по три байта, младшим вперёд.
    const width = bytes[24] | (bytes[25] << 8) | (bytes[26] << 16);
    const height = bytes[27] | (bytes[28] << 8) | (bytes[29] << 16);
    return { width: width + 1, height: height + 1 };
  }
  if (kind === 0x5650384c) {
    const packed = view.getUint32(21, true);
    return { width: (packed & 0x3fff) + 1, height: ((packed >> 14) & 0x3fff) + 1 };
  }
  if (kind === 0x56503820) {
    return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
  }
  return null;
}

/** Размер картинки или null, если формат незнаком или заголовок обрезан. */
export function imageSize(bytes: Uint8Array): ImageSize | null {
  return png(bytes) ?? jpeg(bytes) ?? webp(bytes) ?? null;
}
