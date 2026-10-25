import { currentStaff } from "@/lib/admin/guard";
import { bellCount, bellList } from "@/lib/admin/bell-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Колокольчик в шапке (components/admin/bell.tsx): сколько не отмечено
 * «сделано», а с `?list=1` — и сами строки. Кто спрашивает — из куки, как у
 * /admin/tasks/count: чужое так не прочитать.
 */
export async function GET(request: Request) {
  const staff = await currentStaff();
  if (!staff) return Response.json({ count: 0 }, { status: 401 });
  const list = new URL(request.url).searchParams.get("list") === "1";
  const [count, items] = await Promise.all([bellCount(staff.id), list ? bellList(staff.id) : Promise.resolve(undefined)]);
  return Response.json(items ? { count, items } : { count }, { headers: { "Cache-Control": "no-store" } });
}
