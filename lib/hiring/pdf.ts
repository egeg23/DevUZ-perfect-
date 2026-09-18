/**
 * Текст из PDF резюме.
 *
 * Отдельным модулем, потому что это единственное место, где приложение
 * разбирает чужой файл. Там же и все ограничения: чужой PDF — не данные, а
 * программа, и относиться к нему надо соответственно.
 *
 * Библиотека берётся в legacy-сборке: обычная рассчитана на браузер и тянет
 * `DOMMatrix`, которого в Node нет. Шрифты и картинки не загружаются вовсе —
 * нам нужен текст, а не вид страницы.
 */

/** Больше — это уже не резюме, а чей-то диплом со сканами. */
export const MAX_PDF_BYTES = 8 * 1024 * 1024;

/** Столько страниц читаем; дальше в резюме идут копии сертификатов. */
const MAX_PAGES = 12;

export type PdfText = { text: string; pages: number };

export async function pdfText(bytes: ArrayBuffer): Promise<PdfText> {
  if (bytes.byteLength > MAX_PDF_BYTES) {
    throw new Error(`Файл больше ${Math.round(MAX_PDF_BYTES / 1024 / 1024)} МБ — это не резюме.`);
  }

  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await getDocument({
    data: new Uint8Array(bytes),
    // Ничего внешнего не грузим: у резюме бывает разметка со ссылками на
    // чужие ресурсы, и ходить по ним с сервера студии незачем.
    useSystemFonts: false,
    disableFontFace: true,
  }).promise;

  const out: string[] = [];
  const pages = Math.min(doc.numPages, MAX_PAGES);
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // Строки собираются по вертикальной координате: без этого весь текст
    // слипается в одну ленту, и «Опыт работы 19 лет» становится неотличимо
    // от соседней колонки.
    let line = "";
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        out.push(line.trim());
        line = "";
      }
      line += item.str;
      lastY = y;
    }
    if (line.trim()) out.push(line.trim());
  }

  return { text: out.filter(Boolean).join("\n"), pages: doc.numPages };
}

/**
 * Похоже ли это на резюме, которое вообще можно читать.
 *
 * Скан без текстового слоя отдаёт пустоту: страницы есть, слов нет. Сказать
 * об этом надо прямо, иначе модель получит пустой текст и напишет разбор
 * «кандидат не указал опыт» — то есть соврёт с уверенным лицом.
 */
export function tooThin(text: string): boolean {
  return text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length < 40;
}
