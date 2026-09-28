import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/lib/i18n";
import { PARTNER_COOKIE, closeSession } from "@/lib/partners/session";
import { absoluteUrl } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Выйти из кабинета партнёра. POST — чтобы выход не срабатывал от превью ссылки. */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const raw = String(form?.get("l") ?? "");
  const locale = isLocale(raw) ? raw : defaultLocale;

  await closeSession(request.cookies.get(PARTNER_COOKIE)?.value);
  // От адреса сайта, не от `request.url` — см. app/api/partners/enter.
  const response = NextResponse.redirect(absoluteUrl(`${locale}/partners`), 303);
  response.cookies.delete(PARTNER_COOKIE);
  return response;
}
