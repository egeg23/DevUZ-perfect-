/**
 * Чтение резюме из PDF.
 *
 * Живой прогон владельца закончился так:
 *
 *   Файл не прочитался: Setting up fake worker failed: "Cannot find module
 *   /app/.next/server/chunks/ssr/pdf.worker.mjs"
 *
 * Причина не в файле кандидата. pdf.js разбирает страницы в отдельном
 * «воркере» и в Node ищет его по относительному пути `./pdf.worker.mjs` —
 * от папки собранного куска, где его нет. В `next dev` модуль грузится из
 * node_modules, путь совпадает с настоящим, и ошибки не видно вовсе: она
 * живёт только в собранном приложении.
 *
 * Отсюда две проверки: что текст из PDF вообще достаётся и что воркер
 * отдан библиотеке руками, а не оставлен ей на поиски.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { pdfText, tooThin } from "@/lib/hiring/pdf";

/**
 * Самый маленький PDF, из которого копируется текст.
 *
 * Собирается здесь, а не лежит файлом: чужое резюме в репозиторий класть
 * нельзя, а выдуманное всё равно пришлось бы чем-то рисовать.
 */
function pdfWith(lines: string[]): ArrayBuffer {
  const text = lines
    .map((line, i) => `BT /F1 12 Tf 40 ${760 - i * 18} Td (${line}) Tj ET`)
    .join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });

  const startxref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  const bytes = Buffer.from(body, "latin1");
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

test("текст из PDF достаётся — по строкам, а не одной лентой", async () => {
  const read = await pdfText(
    pdfWith(["Kabirova Gulmira", "Sales manager, 14 years", "Tashkent, Uzbekistan"]),
  );

  assert.equal(read.pages, 1);
  // Именно по строкам: без разбивки «14 years» слипается с соседней
  // колонкой, и модель читает чужую строку как продолжение этой.
  assert.deepEqual(read.text.split("\n").slice(0, 3), [
    "Kabirova Gulmira",
    "Sales manager, 14 years",
    "Tashkent, Uzbekistan",
  ]);
});

test("воркер отдан библиотеке, а не оставлен ей на поиски", async () => {
  await pdfText(pdfWith(["hello"]));
  // Та самая подстановка, из-за отсутствия которой pdf.js шёл искать файл
  // по пути, которого в собранном приложении нет.
  const globals = globalThis as { pdfjsWorker?: { WorkerMessageHandler?: unknown } };
  assert.ok(globals.pdfjsWorker?.WorkerMessageHandler, "воркер не подставлен");
});

test("импорт воркера стоит в коде постоянной строкой", async () => {
  // Сборщик кладёт в сборку только те модули, чей путь он видит буквально.
  // Вычисленный путь — это снова «Cannot find module», но уже молча и
  // только на боевом. Поэтому строка сторожится проверкой.
  const source = await readFile(new URL("../lib/hiring/pdf.ts", import.meta.url), "utf8");
  assert.match(source, /import\("pdfjs-dist\/legacy\/build\/pdf\.worker\.mjs"\)/);
  assert.match(source, /globalThis as \{ pdfjsWorker\?: unknown \}/);
});

test("скан без текстового слоя видно сразу", () => {
  assert.equal(tooThin("   "), true);
  assert.equal(tooThin(Array.from({ length: 39 }, (_, i) => `слово${i}`).join(" ")), true);
  assert.equal(tooThin(Array.from({ length: 40 }, (_, i) => `слово${i}`).join(" ")), false);
});
