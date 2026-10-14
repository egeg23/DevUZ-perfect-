import { VOICE_SECRET_HEADER, cleanTranscript, isVoiceId, voiceSecretOk } from "@/lib/admin/voice-notes";
import { saveVoiceResult } from "@/lib/admin/voice-notes-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Итог расшифровки: `{"text": "…", "language": "ru"}` — бот присылает текст
 * в тот чат, откуда пришло голосовое; `{"error": "…"}` — голос снова в
 * очереди, а после третьей неудачи человеку строка, что не вышло.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!voiceSecretOk(request.headers.get(VOICE_SECRET_HEADER), process.env.SHIFT_REPORT_SECRET)) {
    return new Response("forbidden", { status: 403 });
  }
  const { id } = await params;
  if (!isVoiceId(id)) return new Response("not found", { status: 404 });

  let payload: { text?: unknown; language?: unknown; error?: unknown };
  try {
    payload = ((await request.json()) ?? {}) as typeof payload;
  } catch {
    return Response.json({ ok: false, why: "тело не разобралось как JSON" }, { status: 400 });
  }

  const text = cleanTranscript(payload.text);
  const language = typeof payload.language === "string" ? payload.language.slice(0, 8) : null;
  const result =
    text !== null
      ? await saveVoiceResult(id, { text, language })
      : await saveVoiceResult(id, { error: String(payload.error ?? "no text").slice(0, 300) });
  if (result === "missing") return new Response("not found", { status: 404 });
  if (result === "not_working") return Response.json({ ok: false, why: "голос не в работе" }, { status: 409 });
  return Response.json({ ok: true });
}
