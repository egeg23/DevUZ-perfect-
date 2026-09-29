import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_COOKIE, SESSION_COOKIE, cookieBase } from "@/lib/clients/maximova/session";
import { SESSION_TTL_MS, pollLogin } from "@/lib/clients/maximova/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Браузер ждёт, пока человек нажмёт «Старт» в боте. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const nonce = request.cookies.get(LOGIN_COOKIE)?.value || "";
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(token) || !nonce) return NextResponse.json({ status: "expired" });

  const result = pollLogin(token, nonce);
  if (result.status !== "ok") return NextResponse.json({ status: result.status });

  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(SESSION_COOKIE, result.session, { ...cookieBase, maxAge: SESSION_TTL_MS / 1000 });
  response.cookies.delete(LOGIN_COOKIE);
  return response;
}
