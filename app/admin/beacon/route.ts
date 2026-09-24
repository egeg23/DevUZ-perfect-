import { currentStaff } from "@/lib/admin/guard";
import { sectionOf } from "@/lib/admin/usage";
import { bumpUsage } from "@/lib/admin/usage-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Приём просмотров раздела от маячка в панели.
 *
 * Адрес — под /admin, а не /api: кука сессии панели живёт только на /admin
 * (path в app/admin/login/actions.ts). До 24.09 маячок стучался в
 * /api/usage, кука туда не приходила, сервер не узнавал сотрудника и молча
 * выбрасывал просмотр — отчёт «Чем пользуется команда» стоял пустым.
 *
 * Кто смотрит — из куки сессии, а не из тела запроса: иначе любой мог бы
 * накрутить «Статистике» просмотров от имени коллеги. Владелец не пишется —
 * отчёт про команду. Ответ всегда пустой: маячку нечего с ним делать, а
 * посторонний не должен узнать по ответу, есть ли у него сессия.
 */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });

  // Только со своей страницы: чужой сайт, открытый в той же вкладке, не
  // должен уметь дёргать счётчик за сотрудника.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return done;

  const staff = await currentStaff();
  if (!staff || staff.role === "admin") return done;

  let path = "";
  try {
    const body = (await request.json()) as { path?: unknown };
    path = typeof body.path === "string" ? body.path.slice(0, 200) : "";
  } catch {
    return done;
  }

  const section = sectionOf(path);
  if (section) await bumpUsage(staff.id, section);
  return done;
}
