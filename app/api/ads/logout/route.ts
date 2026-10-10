import { NextResponse, type NextRequest } from "next/server";

import { ADS_COOKIE, closeAdsSession, siteBase } from "@/lib/ads/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Выход: сессия гаснет в базе, а не только кука в браузере. */
export async function POST(request: NextRequest) {
  await closeAdsSession(request.cookies.get(ADS_COOKIE)?.value);
  const response = NextResponse.redirect(new URL(`${siteBase()}/ads`), 303);
  response.cookies.delete(ADS_COOKIE);
  return response;
}
