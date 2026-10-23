import { currentStaff } from "@/lib/admin/guard";
import { cleanQuery } from "@/lib/admin/find";
import { findAll } from "@/lib/admin/find-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Компании и лиды для «Найти раздел» (Ctrl+K, components/admin/nav-menu.tsx).
 * Под /admin, а не /api: кука сессии живёт только на /admin. Кто ищет — из
 * куки; что ему видно — по его роли и галочкам (lib/admin/find-store.ts).
 */
export async function GET(request: Request) {
  const staff = await currentStaff();
  if (!staff) return Response.json({ hits: [] }, { status: 401 });
  const q = cleanQuery(new URL(request.url).searchParams.get("q"));
  const hits = q ? await findAll(staff, q) : [];
  return Response.json({ hits }, { headers: { "Cache-Control": "no-store" } });
}
