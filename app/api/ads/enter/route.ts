import { NextResponse, type NextRequest } from "next/server";

import { ADS_COOKIE, consumeAdsToken, openAdsSession, siteBase } from "@/lib/ads/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Вход в кабинет автопилота по одноразовой ссылке из бота. Ссылка сгорела —
 * человек попадает на страницу входа и получает новую одним нажатием.
 * Адрес — от адреса сайта, а не от request.url (за nginx это 0.0.0.0:3000).
 */
export async function GET(request: NextRequest) {
  const cabinet = new URL(`${siteBase()}/ads`);
  const memberId = await consumeAdsToken(new URL(request.url).searchParams.get("t") ?? "");
  if (!memberId) {
    cabinet.searchParams.set("e", "expired");
    return NextResponse.redirect(cabinet, 303);
  }
  const session = await openAdsSession(memberId);
  if (!session) {
    cabinet.searchParams.set("e", "offline");
    return NextResponse.redirect(cabinet, 303);
  }
  const response = NextResponse.redirect(cabinet, 303);
  response.cookies.set(ADS_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
