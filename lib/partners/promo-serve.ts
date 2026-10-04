import { NextResponse, type NextRequest } from "next/server";

import type { PromoMaterial } from "@/lib/partners/promo";
import { fileSize, fileStream, parseRange, promoFilePath } from "@/lib/partners/promo-files";
import { promoFileName } from "@/lib/partners/promo-rules";

/**
 * Отдать файл промо-материала с диска — целиком или диапазоном.
 *
 * Общее для трёх адресов: партнёрского (/media/promo/…), владельца
 * (/admin/partners/promo/file/…) и видео инструкций (/admin/help/video/…) —
 * они лежат в той же папке. Два адреса, а не один, потому что кука
 * сессии панели живёт только на /admin: на /media/ браузер владельца её не
 * пошлёт, и превью в панели было бы пустым.
 *
 * `onFirstByte` зовётся, когда файл запрошен с начала: так скачивание
 * засчитывается один раз, а не на каждом куске, которым браузер докачивает.
 */
export async function servePromo(
  request: NextRequest,
  material: Pick<PromoMaterial, "id" | "title" | "storage_path" | "mime">,
  options: { download: boolean; onFirstByte?: () => Promise<void> },
): Promise<NextResponse> {
  const file = promoFilePath(material.storage_path);
  const size = file ? await fileSize(file) : null;
  if (!file || size === null) return new NextResponse(null, { status: 404 });

  const headers = new Headers({
    "Content-Type": material.mime,
    "Accept-Ranges": "bytes",
    // Файл по id не меняется: новая загрузка — новый id. Но только в
    // браузере того, кто вошёл: общим кэшам чужой кабинет не нужен.
    "Cache-Control": "private, max-age=86400",
  });
  if (options.download) {
    headers.set("Content-Disposition", `attachment; filename="${promoFileName(material.title, material.id, material.mime)}"`);
  }

  const range = parseRange(request.headers.get("range"), size);
  if (range === "bad") {
    headers.set("Content-Range", `bytes */${size}`);
    return new NextResponse(null, { status: 416, headers });
  }
  if (!range || range.start === 0) await options.onFirstByte?.();

  const start = range?.start ?? 0;
  const end = range?.end ?? size - 1;
  headers.set("Content-Length", String(end - start + 1));
  if (range) headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  return new NextResponse(fileStream(file, start, end), { status: range ? 206 : 200, headers });
}
