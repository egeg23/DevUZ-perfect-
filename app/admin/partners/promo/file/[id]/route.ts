import { NextResponse, type NextRequest } from "next/server";

import { currentStaff } from "@/lib/admin/guard";
import { promoById } from "@/lib/partners/promo";
import { servePromo } from "@/lib/partners/promo-serve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Файл промо-материала для владельца: превью в панели, в том числе скрытых.
 * Под /admin, потому что кука сессии панели живёт только там. Скачивания
 * владельца в журнал не идут: журнал — про то, что берут партнёры.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await currentStaff();
  if (staff?.role !== "admin") return new NextResponse(null, { status: 404 });
  const { id } = await params;
  const material = await promoById(id);
  if (!material) return new NextResponse(null, { status: 404 });
  return servePromo(request, material, { download: request.nextUrl.searchParams.get("dl") === "1" });
}
