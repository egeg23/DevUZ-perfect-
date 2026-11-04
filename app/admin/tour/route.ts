import { currentStaff } from "@/lib/admin/guard";
import { markTourSeen, tourSeen } from "@/lib/admin/panel-tour-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Обучение по новому виду панели (lib/admin/panel-tour.ts, components/admin/panel-tour.tsx):
 * GET — видел ли, POST — «видел». Кто — из куки, чужой id не принимается.
 */
export async function GET() {
  const staff = await currentStaff();
  if (!staff) return Response.json({ seen: true }, { status: 401 });
  return Response.json({ seen: await tourSeen(staff.id) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const staff = await currentStaff();
  if (!staff) return Response.json({ ok: false }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { step?: unknown; skipped?: unknown };
  const step = Math.max(0, Math.min(20, Number(body.step) || 0));
  await markTourSeen(staff.id, step, body.skipped === true);
  return Response.json({ ok: true });
}
