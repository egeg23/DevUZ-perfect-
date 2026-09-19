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
