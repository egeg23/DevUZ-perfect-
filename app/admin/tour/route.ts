import { currentStaff } from "@/lib/admin/guard";
import { TOUR_VERSION, tourOf } from "@/lib/admin/panel-tour";
import { markTourSeen, toursSeen } from "@/lib/admin/panel-tour-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Обучение по панели (lib/admin/panel-tour.ts): GET — какие обучения видел
 * (`seen` — знакомство с панелью, `tours` — все), POST — «видел» одно
 * (`tour` из известных, иначе знакомство). Кто — из куки, чужой id не принимается.
 */
export async function GET() {
  const staff = await currentStaff();
  if (!staff) return Response.json({ seen: true, tours: {} }, { status: 401 });
  const tours = await toursSeen(staff.id);
  return Response.json({ seen: tours[TOUR_VERSION], tours }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const staff = await currentStaff();
  if (!staff) return Response.json({ ok: false }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { step?: unknown; skipped?: unknown; tour?: unknown };
  const step = Math.max(0, Math.min(20, Number(body.step) || 0));
  await markTourSeen(staff.id, step, body.skipped === true, new Date(), tourOf(body.tour));
  return Response.json({ ok: true });
}
