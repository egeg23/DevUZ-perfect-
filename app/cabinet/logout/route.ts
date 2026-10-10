import { NextResponse, type NextRequest } from "next/server";

import { CABINET_COOKIE } from "@/lib/ai-staff/auth";
import { sha256 } from "@/lib/ai-staff/crypto";
import { dropSession } from "@/lib/ai-staff/store";
import { absoluteUrl } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const raw = request.cookies.get(CABINET_COOKIE)?.value;
  if (raw) await dropSession(sha256(raw)).catch(() => undefined);
  const response = NextResponse.redirect(absoluteUrl("cabinet/login"));
  response.cookies.delete({ name: CABINET_COOKIE, path: "/cabinet" });
  return response;
}
