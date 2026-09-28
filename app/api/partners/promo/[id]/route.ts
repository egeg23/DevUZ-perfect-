import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/lib/i18n";
import { promoDownload } from "@/lib/partners/promo";
import { currentPartner } from "@/lib/partners/session";
import { absoluteUrl } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Скачать промо-материал из кабинета партнёра.
 *
 * Через сервер, а не прямой ссылкой из кабинета: так скачивание попадает в
 * журнал (владелец видит, что партнёрам нужно), скрытый материал перестаёт
 * отдаваться сразу, а ссылка на файл живёт две минуты, а не до конца дня.
 * Файл при этом идёт из хранилища напрямую — через nginx и Node проходит
 * только переадресация.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = request.nextUrl.searchParams.get("l") ?? "";
  const locale = isLocale(raw) ? raw : defaultLocale;

  // От адреса сайта, не от `request.url` — см. app/api/partners/enter.
  const partner = await currentPartner();
  if (!partner) return NextResponse.redirect(absoluteUrl(`${locale}/partners/cabinet`), 303);

  const url = await promoDownload(id, partner);
  if (!url) return NextResponse.redirect(absoluteUrl(`${locale}/partners/cabinet?r=media_gone#media`), 303);
  return NextResponse.redirect(url, 303);
}
