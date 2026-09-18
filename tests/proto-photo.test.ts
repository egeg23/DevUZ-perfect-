import assert from "node:assert/strict";
import { test } from "node:test";

import { imageSize } from "@/lib/proto/photo";
import { PHOTO_MIN_WIDTH } from "@/lib/proto/facts";

/**
 * Размер читается из файла, а не из атрибута `width` в вёрстке: атрибут
 * говорит, как картинку показали, а не какая она, и у половины сайтов его нет
 * вовсе.
 */

const bytes = (...values: number[]) => new Uint8Array(values);
const be16 = (value: number) => [value >> 8, value & 0xff];
const be32 = (value: number) => [value >>> 24, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];

test("png читается из IHDR", () => {
  const png = bytes(
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ...be32(13), 0x49, 0x48, 0x44, 0x52,
    ...be32(1600), ...be32(900),
  );
  assert.deepEqual(imageSize(png), { width: 1600, height: 900 });
});

test("jpeg читается через таблицы до кадрового маркера", () => {
  // Перед SOF0 лежит таблица квантования: её длину надо прочесть и
  // перешагнуть, иначе размер возьмётся из случайного места.
  const jpeg = bytes(
    0xff, 0xd8,
    0xff, 0xdb, ...be16(6), 1, 2, 3, 4,
    0xff, 0xc0, ...be16(17), 8, ...be16(452), ...be16(700),
    0xff, 0xd9,
  );
  assert.deepEqual(imageSize(jpeg), { width: 700, height: 452 });
  // Ровно тот случай, ради которого правило и написано.
  assert.ok(imageSize(jpeg)!.width < PHOTO_MIN_WIDTH);
});

test("webp во всех трёх видах", () => {
  const riff = (fourcc: number[], tail: number[]) =>
    bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, ...fourcc, ...tail);

  // VP8X: размеры минус единица, по три байта, младшим вперёд.
  const vp8x = riff(
    [0x56, 0x50, 0x38, 0x58],
    [...be32(10), 0, 0, 0, 0, 0x7f, 0x05, 0, 0x1f, 0x03, 0],
  );
  assert.deepEqual(imageSize(vp8x), { width: 1408, height: 800 });

  const vp8 = riff([0x56, 0x50, 0x38, 0x20], new Array(18).fill(0));
  const filled = new Uint8Array(vp8);
  filled[26] = 0x00;
  filled[27] = 0x05; // 1280
  filled[28] = 0xd0;
  filled[29] = 0x02; // 720
  assert.deepEqual(imageSize(filled), { width: 1280, height: 720 });
});

test("мусор и обрезанный заголовок не выдают размер", () => {
  assert.equal(imageSize(bytes(0, 1, 2, 3)), null);
  assert.equal(imageSize(bytes(0x89, 0x50, 0x4e, 0x47)), null);
  assert.equal(imageSize(new Uint8Array(0)), null);
  // JPEG без кадрового маркера — файл битый, а не картинка неизвестного размера.
  assert.equal(imageSize(bytes(0xff, 0xd8, 0xff, 0xdb, ...be16(4), 1, 2, 0xff, 0xd9)), null);
});
