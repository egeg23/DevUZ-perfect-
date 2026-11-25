import { currentStaff } from "@/lib/admin/guard";
import { opens } from "@/lib/admin/roles";
import { cleanScript, scriptProblems } from "@/lib/callhelper/script";
import { cleanLines, suggest } from "@/lib/callhelper/suggest";
import { rateLimit } from "@/lib/qualify/limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DevUz CallHelper: следующая фраза оператору (components/admin/callhelper-desk.tsx).
 *
 * Под /admin, а не /api: кука сессии живёт только на /admin. Кто спрашивает —
 * из куки, раздел должен быть ему открыт (роль и галочки владельца). Лимит —
 * на человека: живой звонок даёт подсказку на каждую реплику клиента, это
 * несколько в минуту, а не сотни.
 */
export async function POST(request: Request) {
  const staff = await currentStaff();
  if (!staff || !opens(staff, "/admin/callhelper")) return Response.json({ error: "forbidden" }, { status: 403 });

  const limit = rateLimit(`callhelper:${staff.id}`, { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return Response.json({ error: "rate" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  const text = await request.text();
  if (text.length > 60_000) return Response.json({ error: "too_big" }, { status: 413 });
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "bad" }, { status: 400 });
  }

  const script = cleanScript(body.script);
  if (scriptProblems(script).length) return Response.json({ error: "script" }, { status: 400 });
  const result = await suggest(script, cleanLines(body.lines));
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
