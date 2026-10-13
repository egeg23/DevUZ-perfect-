import { currentStaff } from "@/lib/admin/guard";
import { recordCrash } from "@/lib/admin/crash-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Приём сбоев страниц панели от app/admin/error.tsx.
 *
 * Менеджер, 13.10.2026: «Периодически выходит „This page couldn't load“ в
 * панели… Reload — и всё нормально, 3 раза за час». Это ошибка в браузере,
 * а в логах сервера её не видно — поэтому браузер сам присылает сюда, что
 * упало и на какой странице. Под /admin, как маячок: кука сессии живёт там.
 * Только со своей страницы и только от сотрудника; ответ всегда пустой.
 */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return done;

  const staff = await currentStaff();
  if (!staff) return done;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const text = (key: string, max: number) => (typeof body[key] === "string" ? (body[key] as string).slice(0, max) : "");
    await recordCrash({
      staff: staff.display_name || staff.username || staff.id,
      path: text("path", 200),
      message: text("message", 500),
      digest: text("digest", 100),
      stack: text("stack", 2000),
      agent: (request.headers.get("user-agent") ?? "").slice(0, 300),
      retried: body.retried === true,
    });
  } catch {
    // Битое тело — молча: отчёт о сбое не должен сам падать.
  }
  return done;
}
