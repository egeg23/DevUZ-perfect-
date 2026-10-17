import { NextResponse, type NextRequest } from "next/server";

import { circleFile, isCircleLang } from "@/lib/admin/circle-store";
import { currentStaff } from "@/lib/admin/guard";
import { isCircleNiche } from "@/lib/admin/sales-after-reply";
import { servePromo } from "@/lib/partners/promo-serve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Загруженный кружок для касаний — посмотреть в «Аккаунтах», что именно
 * уходит клиентам. Видят владелец и руководитель, остальным — 404, без
 * подсказки, что файл есть. С поддержкой Range: без неё Safari не покажет.
 * `?lang=uz` — узбекский кружок, без него — русский; `&niche=mebel` — кружок ниши.
 */
export async function GET(request: NextRequest) {
  const staff = await currentStaff();
  if (!staff || (staff.role !== "admin" && staff.role !== "head")) return new NextResponse(null, { status: 404 });
  const lang = request.nextUrl.searchParams.get("lang");
  const niche = request.nextUrl.searchParams.get("niche");
  const file = await circleFile(isCircleLang(lang) ? lang : "ru", isCircleNiche(niche) ? niche : "general");
  if (!file) return new NextResponse(null, { status: 404 });
  return servePromo(request, { id: "circle", title: "circle", storage_path: file.path, mime: "video/mp4" }, { download: false });
}
