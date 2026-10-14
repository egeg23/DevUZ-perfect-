import type { Staff } from "@/lib/admin/session";
import {
  VOICE_MAX_BYTES,
  VOICE_MAX_TRIES,
  doneText,
  failedText,
  isGivenUp,
  isTakeable,
  type Voice,
} from "@/lib/admin/voice-notes";
import { serviceClient } from "@/lib/supabase";
import { downloadBotFile, sendPlain } from "@/lib/qualify/telegram";

/**
 * Очередь голосовых на расшифровку (таблица voice_notes). Правила — в
 * voice-notes.ts, расшифровка — задача GitHub Actions
 * (.github/workflows/voice-transcribe.yml), которая ходит сюда через
 * app/api/voice/*.
 */

type Row = {
  id: string;
  chat_id: number;
  duration: number | null;
  mime: string | null;
  file_id: string;
  status: string;
  tries: number;
  taken_at: string | null;
};

const COLUMNS = "id, chat_id, duration, mime, file_id, status, tries, taken_at";

/** Поставить голосовое в очередь. Повтор того же сообщения — не второй голос. */
export async function queueVoice(staff: Staff, chatId: number, messageId: number, voice: Voice): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("voice_notes").upsert(
    {
      staff_id: staff.id,
      chat_id: chatId,
      message_id: messageId,
      file_id: voice.fileId,
      mime: voice.mime,
      duration: voice.duration,
      bytes: voice.bytes,
    },
    { onConflict: "chat_id,message_id", ignoreDuplicates: true },
  );
  if (error) console.error("голосовые: очередь", error.message);
  return !error;
}

export type QueueItem = { id: string; duration: number | null; mime: string };

/**
 * Что расшифровать: новые и зависшие «в работе». Зависшие без попыток —
 * failed, и человеку строка, что не вышло: иначе он ждал бы текста вечно.
 */
export async function voiceQueue(now = new Date()): Promise<QueueItem[] | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("voice_notes")
    .select(COLUMNS)
    .in("status", ["queued", "working"])
    .order("created_at", { ascending: true })
    .limit(20);
  if (error) {
    console.error("голосовые: очередь", error.message);
    return null;
  }
  const rows = (data ?? []) as Row[];
  for (const row of rows.filter((r) => isGivenUp(r, now))) {
    await finish(row, { status: "failed", error: "stale" }, now);
  }
  return rows
    .filter((r) => isTakeable(r, now))
    .map((r) => ({ id: r.id, duration: r.duration, mime: r.mime || "audio/ogg" }));
}

/**
 * Забрать голос в работу и отдать звук. Забирает тот, кто успел: второй
 * одновременный запрос получает null — один голос не расшифровывается дважды.
 */
export async function takeVoiceAudio(
  id: string,
  now = new Date(),
): Promise<{ data: Uint8Array; mime: string } | "busy" | "missing" | "download"> {
  const db = serviceClient();
  if (!db) return "missing";
  const { data } = await db.from("voice_notes").select(COLUMNS).eq("id", id).maybeSingle();
  const row = data as Row | null;
  if (!row) return "missing";
  if (!isTakeable(row, now)) return "busy";

  let claim = db
    .from("voice_notes")
    .update({ status: "working", tries: row.tries + 1, taken_at: now.toISOString() })
    .eq("id", id)
    .eq("tries", row.tries)
    .eq("status", row.status);
  if (row.taken_at) claim = claim.eq("taken_at", row.taken_at);
  const { data: claimed } = await claim.select("id");
  if (!claimed?.length) return "busy";

  const audio = await downloadBotFile(row.file_id, VOICE_MAX_BYTES);
  if (!audio) {
    await giveBack(row.id, row.tries + 1, now);
    return "download";
  }
  return { data: audio, mime: row.mime || "audio/ogg" };
}

/** Не скачалось или не расшифровалось: попытки остались — назад в очередь, нет — сказать человеку. */
async function giveBack(id: string, tries: number, now: Date): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  if (tries < VOICE_MAX_TRIES) {
    await db.from("voice_notes").update({ status: "queued" }).eq("id", id).eq("status", "working");
    return;
  }
  const { data } = await db.from("voice_notes").select(COLUMNS).eq("id", id).maybeSingle();
  if (data) await finish(data as Row, { status: "failed", error: "download" }, now);
}

export type VoiceResult = { text: string; language?: string | null } | { error: string };

/** Ответ задачи расшифровки: текст — в чат, ошибка — в очередь или человеку. */
export async function saveVoiceResult(id: string, result: VoiceResult, now = new Date()): Promise<"ok" | "missing" | "not_working"> {
  const db = serviceClient();
  if (!db) return "missing";
  const { data } = await db.from("voice_notes").select(COLUMNS).eq("id", id).maybeSingle();
  const row = data as Row | null;
  if (!row) return "missing";
  if (row.status !== "working") return "not_working";
  if ("error" in result) {
    await db.from("voice_notes").update({ error: result.error.slice(0, 300) }).eq("id", id);
    await giveBack(id, row.tries, now);
    return "ok";
  }
  await finish(row, { status: "done", text: result.text, language: result.language ?? null }, now);
  return "ok";
}

/**
 * Закрыть голос и написать в чат. Закрывает тот, кто успел (условие на
 * статус), — текст не приходит дважды, даже если задача прислала его снова.
 */
async function finish(
  row: Row,
  outcome: { status: "done"; text: string; language: string | null } | { status: "failed"; error: string },
  now: Date,
): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const patch =
    outcome.status === "done"
      ? { status: "done", text: outcome.text, language: outcome.language, error: null, done_at: now.toISOString() }
      : { status: "failed", error: outcome.error, done_at: now.toISOString() };
  const { data } = await db.from("voice_notes").update(patch).eq("id", row.id).eq("status", row.status).select("id");
  if (!data?.length) return;
  const message = outcome.status === "done" ? doneText(row.duration, outcome.text) : failedText(row.duration);
  const sent = await sendPlain(row.chat_id, message);
  if (!sent) console.error("голосовые: текст не ушёл в чат", row.id);
}
