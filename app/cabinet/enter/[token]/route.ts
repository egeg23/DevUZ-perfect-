import { NextResponse, type NextRequest } from "next/server";

import { CABINET_COOKIE, enterWithToken } from "@/lib/ai-staff/auth";
import { serviceEnabled } from "@/lib/ai-staff/store";
import { ipFromHeaders, rateLimit } from "@/lib/qualify/limiter";
import { absoluteUrl } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ссылка из бота → сессия кабинета. Ссылка одноразовая и живёт 15 минут. */
export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  if (!(await serviceEnabled())) return new Response("not found", { status: 404 });
  const ip = ipFromHeaders(request.headers);
  const { token } = await context.params;
  if (!rateLimit(`ai-cab-enter:${ip}`, { limit: 10, windowMs: 10 * 60_000 }).ok) {
    return NextResponse.redirect(absoluteUrl("cabinet/login?e=1"));
  }
  const entered = await enterWithToken(token);
  if (!entered) return NextResponse.redirect(absoluteUrl("cabinet/login?e=1"));
  const response = NextResponse.redirect(absoluteUrl("cabinet"));
  response.cookies.set(CABINET_COOKIE, entered.cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/cabinet",
    expires: entered.expires,
  });
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}
