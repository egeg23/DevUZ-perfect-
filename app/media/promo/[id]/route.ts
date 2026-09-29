import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/lib/i18n";
import { logPromoDownload, promoById } from "@/lib/partners/promo";
import { servePromo } from "@/lib/partners/promo-serve";
import { currentPartner } from "@/lib/partners/session";
import { absoluteUrl } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Файл промо-материала для партнёра: превью в кабинете, а с `?dl=1` —
 * скачивание, которое попадает в журнал.
 *
 * Только тому, кто вошёл в кабинет, и только открытые материалы: скрытый
 * перестаёт отдаваться сразу. Адрес вне /api/ намеренно: у /api/ в nginx
 * лимит в один запрос в секунду, а плеер Safari просит видео несколькими
 * запросами-диапазонами подряд — и получил бы 429 на середине ролика.
 * Владелец смотрит файлы по своему адресу: app/admin/partners/promo/file.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const download = request.nextUrl.searchParams.get("dl") === "1";
  const raw = request.nextUrl.searchParams.get("l") ?? "";
  const locale = isLocale(raw) ? raw : defaultLocale;
  // От адреса сайта, не от `request.url` — см. app/api/partners/enter.
  const toCabinet = (query = "") => NextResponse.redirect(absoluteUrl(`${locale}/partners/cabinet${query}`), 303);

  const partner = await currentPartner();
  if (!partner) return download ? toCabinet() : new NextResponse(null, { status: 404 });

  const material = await promoById(id);
  if (!material || material.hidden) return download ? toCabinet("?r=media_gone#media") : new NextResponse(null, { status: 404 });

  return servePromo(request, material, {
    download,
    onFirstByte: download ? () => logPromoDownload(material.id, partner) : undefined,
  });
}
