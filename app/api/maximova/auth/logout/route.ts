import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/clients/maximova/session";
import { endSession } from "@/lib/clients/maximova/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  endSession(request.cookies.get(SESSION_COOKIE)?.value);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
