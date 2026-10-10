import { NextResponse, type NextRequest } from "next/server";

import { CAB_LANG_COOKIE, isCabLocale } from "@/content/ai-staff/cabinet";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Переключатель RU / UZ: кука на год и обратно на ту же страницу кабинета. */
export function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to");
  const back = request.nextUrl.searchParams.get("back") ?? "/cabinet";
  const path = /^\/cabinet(\/[\w/-]*)?$/.test(back) ? back : "/cabinet";
  const response = NextResponse.redirect(absoluteUrl(path.slice(1)));
  if (isCabLocale(to)) {
    response.cookies.set(CAB_LANG_COOKIE, to, { path: "/cabinet", maxAge: 365 * 86_400, sameSite: "lax" });
  }
  return response;
}
