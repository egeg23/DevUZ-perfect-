import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/clients/maximova/session";
import { setBookingStatus, viewerBySession } from "@/lib/clients/maximova/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Дарья отмечает заявку: «связалась» или обратно «новая». */
export async function POST(request: NextRequest) {
  const viewer = viewerBySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (viewer?.role !== "admin") return new NextResponse(null, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { id?: unknown; status?: unknown };
  const id = Number(body.id);
  if (!Number.isSafeInteger(id) || (body.status !== "new" && body.status !== "contacted")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  setBookingStatus(id, body.status);
  return NextResponse.json({ ok: true });
}
