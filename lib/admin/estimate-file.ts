import { xlsxRows } from "@/lib/admin/xlsx";
import { pdfRows } from "@/lib/hiring/pdf";

/**
 * Файл сметы → строки текста, которые понимает parseEstimate.
 *
 * Excel и PDF превращаются в строки с табуляцией между ячейками, остальное
 * читается как текст. Дальше путь у всех один — lib/admin/estimate.ts.
 * Не прочитался файл — null: смета прикладывается как есть, а строки
 * менеджер вставляет руками.
 */
export type EstimateText = { text: string; name: string; scan?: boolean };

const asTsv = (rows: string[][]) => rows.map((row) => row.join("\t")).join("\n");

export async function estimateText(bytes: ArrayBuffer, filename: string): Promise<EstimateText | null> {
  const lower = filename.toLowerCase();
  try {
    if (lower.endsWith(".xlsx")) return { text: asTsv(xlsxRows(bytes)), name: "estimate.tsv" };
    if (lower.endsWith(".pdf")) {
      const text = asTsv(await pdfRows(bytes));
      // Скан без текстового слоя: страницы есть, слов нет.
      return { text, name: "estimate.tsv", scan: text.trim() === "" };
    }
  } catch (error) {
    console.error(`смета: не прочитал ${filename}`, error);
    return null;
  }
  return { text: new TextDecoder("utf-8").decode(bytes), name: filename };
}
