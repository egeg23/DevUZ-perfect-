import { NextResponse, type NextRequest } from "next/server";

import { circleFile } from "@/lib/admin/circle-store";
import { currentStaff } from "@/lib/admin/guard";
import { servePromo } from "@/lib/partners/promo-serve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Загруженный кружок для касаний — посмотреть в «Аккаунтах», что именно
 * уходит клиентам. Видят владелец и руководитель, остальным — 404, без
 * подсказки, что файл есть. С поддержкой Range: без неё Safari не покажет.
 */
export async function GET(request: NextRequest) {
  const staff = await currentStaff();
  if (!staff || (staff.role !== "admin" && staff.role !== "head")) return new NextResponse(null, { status: 404 });
  const file = await circleFile();
  if (!file) return new NextResponse(null, { status: 404 });
  return servePromo(request, { id: "circle", title: "circle", storage_path: file.path, mime: "video/mp4" }, { download: false });
}
