/**
 * Текст из PDF: резюме кандидата и смета к договору.
 *
 * Отдельным модулем, потому что это единственное место, где приложение
 * разбирает чужой PDF. Там же и все ограничения: чужой PDF — не данные, а
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

async function openPdf(bytes: ArrayBuffer) {
  if (bytes.byteLength > MAX_PDF_BYTES) {
    throw new Error(`Файл больше ${Math.round(MAX_PDF_BYTES / 1024 / 1024)} МБ.`);
  }

  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");

  /**
   * Разбор страниц идёт в отдельном «воркере», и его надо отдать библиотеке
   * руками. Иначе она ищет его сама — и не находит.
   *
   * В Node pdf.js подставляет себе путь `./pdf.worker.mjs` и загружает его
   * динамическим импортом, помеченным `webpackIgnore`. Сборщик такой импорт
   * не трогает: он не кладёт файл в сборку и не переписывает путь. В итоге
   * на сервере относительный путь считается от папки собранного куска —
   * `.next/server/chunks/ssr/` — где никакого воркера нет и быть не может:
   *
   *   Setting up fake worker failed: "Cannot find module
   *   /app/.next/server/chunks/ssr/pdf.worker.mjs"
   *
   * Локально это не воспроизводится вовсе: в `next dev` модуль грузится из
   * node_modules, и относительный путь совпадает с настоящим. Ошибка живёт
   * только в собранном приложении — то есть ровно там, куда её и выкатили.
   *
   * Поэтому воркер импортируется обычным импортом с постоянным путём: такой
   * сборщик видит и кладёт в сборку. А pdf.js перед запуском заглядывает в
   * `globalThis.pdfjsWorker` и, найдя там готовый обработчик, ничего искать
   * не идёт (PDFWorker.#mainThreadWorkerMessageHandler в pdf.mjs).
   *
   * Присваивание обязано случиться до первого getDocument: результат поиска
   * воркера кэшируется на весь процесс, включая неудачу. Один упавший
   * разбор — и все следующие в этом контейнере падали бы так же.
   */
  const globals = globalThis as { pdfjsWorker?: unknown };
  globals.pdfjsWorker ??= await import("pdfjs-dist/legacy/build/pdf.worker.mjs");

  return getDocument({
    data: new Uint8Array(bytes),
    // Ничего внешнего не грузим: у резюме бывает разметка со ссылками на
    // чужие ресурсы, и ходить по ним с сервера студии незачем.
    useSystemFonts: false,
    disableFontFace: true,
  }).promise;
}

export async function pdfText(bytes: ArrayBuffer): Promise<PdfText> {
  const doc = await openPdf(bytes);

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

/** Промежуток по горизонтали, начиная с которого соседние куски текста — разные ячейки. */
const CELL_GAP = 8;

/**
 * Таблица из PDF — для сметы: строки по вертикали, ячейки по промежуткам.
 *
 * В PDF нет таблиц, есть куски текста с координатами. Строка — куски на
 * одной высоте; ячейка — куски, между которыми нет заметного просвета.
 * Скан без текстового слоя отдаёт пустоту, и это видно сразу: строк нет.
 */
export async function pdfRows(bytes: ArrayBuffer): Promise<string[][]> {
  const doc = await openPdf(bytes);
  const rows: string[][] = [];
  const pages = Math.min(doc.numPages, MAX_PAGES);
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pieces = content.items
      .filter((item) => "str" in item && item.str.trim() !== "")
      .map((item) => {
        const it = item as { str: string; transform: number[]; width: number };
        return { s: it.str, x: it.transform[4], y: Math.round(it.transform[5]), w: it.width };
      })
      .sort((a, b) => b.y - a.y || a.x - b.x);

    let line: typeof pieces = [];
    const flush = () => {
      if (!line.length) return;
      line.sort((a, b) => a.x - b.x);
      const cells: string[] = [];
      let cell = "";
      let end: number | null = null;
      for (const p of line) {
        if (end !== null && p.x - end > CELL_GAP) {
          cells.push(cell.trim());
          cell = p.s;
        } else {
          cell += end !== null && p.x - end > 1 && !cell.endsWith(" ") && !p.s.startsWith(" ") ? ` ${p.s}` : p.s;
        }
        end = p.x + p.w;
      }
      cells.push(cell.trim());
      rows.push(cells.filter((c) => c !== ""));
      line = [];
    };
    for (const p of pieces) {
      if (line.length && Math.abs(p.y - line[0].y) > 3) flush();
      line.push(p);
    }
    flush();
  }
  return rows;
}
