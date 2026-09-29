import { NextResponse, type NextRequest } from "next/server";

import { bindInvite } from "@/lib/clients/maximova/school";
import { SESSION_COOKIE } from "@/lib/clients/maximova/session";
import { viewerBySession } from "@/lib/clients/maximova/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Родитель уже в кабинете и открыл приглашение Дарьи — привязать ребёнка. */
export async function POST(request: NextRequest) {
  const viewer = viewerBySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!viewer) return new NextResponse(null, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { code?: unknown };
  const result = bindInvite(typeof body.code === "string" ? body.code : "", viewer.telegramId);
  if (result === "ok") return NextResponse.json({ ok: true });
  return NextResponse.json(
    { ok: false, error: result === "taken" ? "Этот ребёнок уже привязан к другому родителю." : "Приглашение не найдено." },
    { status: 422 },
  );
}
