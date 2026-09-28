import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/lib/i18n";
import { PARTNER_COOKIE, consumeLoginToken, openSession } from "@/lib/partners/session";
import { absoluteUrl } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Вход в кабинет по ссылке из бота.
 *
 * Ссылка одноразовая и живёт 15 минут. Сгорела или уже использована —
 * человек попадает в кабинет без входа и видит кнопку «Войти через
 * Telegram»: получить новую — одно нажатие.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("l") ?? "";
  const locale = isLocale(raw) ? raw : defaultLocale;
  // Адрес — от адреса сайта, а не от `request.url`: за nginx это
  // http://0.0.0.0:3000/…, и 28.09 ссылка из бота увела Александра туда —
  // Safari: «использование запрещённого сетевого порта». Так же сделан вход
  // в панель (app/admin/enter).
  const cabinet = new URL(absoluteUrl(`${locale}/partners/cabinet`));

  const partnerId = await consumeLoginToken(url.searchParams.get("t") ?? "");
  if (!partnerId) {
    cabinet.searchParams.set("e", "expired");
    return NextResponse.redirect(cabinet, 303);
  }

  const session = await openSession(partnerId);
  if (!session) {
    cabinet.searchParams.set("e", "offline");
    return NextResponse.redirect(cabinet, 303);
  }

  const response = NextResponse.redirect(cabinet, 303);
  response.cookies.set(PARTNER_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
