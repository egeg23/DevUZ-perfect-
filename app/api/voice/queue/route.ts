import { voiceAuthorized } from "@/lib/admin/voice-auth";
import { voiceQueue } from "@/lib/admin/voice-notes-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Очередь голосовых для задачи «Голосовые — расшифровка» (GitHub Actions):
 * какие расшифровать. Только номера и длина — ни звука, ни текста: журнал
 * задачи в открытом репозитории виден всем.
 */
export async function GET(request: Request) {
  if (!(await voiceAuthorized(request))) {
    return new Response("forbidden", { status: 403 });
  }
  const items = await voiceQueue();
  if (!items) return Response.json({ ok: false, why: "база недоступна" }, { status: 503 });
  return Response.json({ ok: true, items });
}
