import { voiceAuthorized } from "@/lib/admin/voice-auth";
import { isVoiceId } from "@/lib/admin/voice-notes";
import { takeVoiceAudio } from "@/lib/admin/voice-notes-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Звук голосового — задаче расшифровки. Запрос забирает голос в работу:
 * второй одновременный получает 409, и один голос не расшифровывается дважды.
 * Файл до 20 МБ (предел Bot API), обычное голосовое — сотни килобайт.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await voiceAuthorized(request))) {
    return new Response("forbidden", { status: 403 });
  }
  const { id } = await params;
  if (!isVoiceId(id)) return new Response("not found", { status: 404 });
  const audio = await takeVoiceAudio(id);
  if (audio === "missing") return new Response("not found", { status: 404 });
  if (audio === "busy") return new Response("busy", { status: 409 });
  if (audio === "download") return new Response("telegram did not give the file", { status: 502 });
  return new Response(Buffer.from(audio.data), {
    headers: { "content-type": audio.mime, "cache-control": "no-store" },
  });
}
