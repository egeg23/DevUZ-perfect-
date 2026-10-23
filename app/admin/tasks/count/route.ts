import { currentStaff } from "@/lib/admin/guard";
import { myTaskCounts } from "@/lib/admin/task-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Число на кнопке «Задачи» в меню (components/admin/task-count.tsx): сколько
 * открытых задач на мне и сколько просрочено. Кто спрашивает — из куки, как
 * у /admin/tasks/feed: чужое число так не узнать.
 */
export async function GET() {
  const staff = await currentStaff();
  if (!staff) return Response.json({ open: 0, overdue: 0 }, { status: 401 });
  const counts = await myTaskCounts(staff.id);
  return Response.json(counts ?? { open: 0, overdue: 0 }, { headers: { "Cache-Control": "no-store" } });
}
