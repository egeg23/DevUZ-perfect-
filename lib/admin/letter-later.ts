import { writeLetterLater } from "@/lib/admin/outreach-store";
import { queueLaterLetter } from "@/lib/admin/outreach-talk-store";
import type { HelloLang } from "@/lib/admin/hello-first";
import { serviceClient } from "@/lib/supabase";

/**
 * Письмо автопрогона — после ответа на «Здравствуйте» (LETTER_AFTER_REPLY).
 *
 * Разведка «ИИ → код», 10.10.2026: автопрогон писал письмо о сайте на каждое
 * касание, а уходило оно единицам — по-русски ответившим уходит кружок, не
 * ответившим ничего. Теперь при подготовке — только проверка сайта по факту;
 * клиент ответил не по-русски или кружок не ушёл — скаут ставит отметку
 * `letter_wanted` (язык ответа), а здесь свип пишет письмо по той же
 * проверке и ставит в ту же очередь, что и раньше (перевод, прототип,
 * пауза перед отправкой).
 *
 * Модель недоступна — следующим проходом, но не дольше LATER_GIVE_UP_MS после
 * ответа: дальше клиент ждёт слишком долго, и разговор уходит человеку.
 */

/** Сколько писем за проход свипа: модель пишет каждое секунд по десять. */
export const LATER_PER_PASS = 3;

/** Модель недоступна — пробуем снова через столько. */
export const LATER_RETRY_MS = 10 * 60_000;

/** Дольше ответ клиенту не откладываем: отдаём разговор человеку. */
export const LATER_GIVE_UP_MS = 2 * 60 * 60_000;

export type LaterRun = { written: number; handedOver: number; postponed: number };

export async function writeWantedLetters(now: Date = new Date()): Promise<LaterRun> {
  const run: LaterRun = { written: 0, handedOver: 0, postponed: 0 };
  const db = serviceClient();
  if (!db) return run;

  const { data: rows } = await db
    .from("prospects")
    .select("id, letter_wanted, letter_wanted_at, pitch_at")
    .not("letter_wanted", "is", null)
    .lte("letter_wanted_at", now.toISOString())
    .order("letter_wanted_at", { ascending: true })
    .limit(LATER_PER_PASS);

  for (const row of rows ?? []) {
    const id = String(row.id);
    const lang = String(row.letter_wanted) as HelloLang;
    // Взять условно: соседний проход свипа то же письмо писать не станет.
    const { data: claimed } = await db
      .from("prospects")
      .update({ letter_wanted_at: new Date(now.getTime() + LATER_RETRY_MS).toISOString() })
      .eq("id", id)
      .eq("letter_wanted_at", String(row.letter_wanted_at))
      .select("id");
    if (!claimed?.length) continue;

    const written = await writeLetterLater(id).catch(() => ({ ok: false as const, retry: true }));
    const waited = now.getTime() - Date.parse(String(row.pitch_at ?? row.letter_wanted_at));
    if (!written.ok && written.retry && waited < LATER_GIVE_UP_MS) {
      run.postponed += 1;
      continue;
    }

    // Отметку снимаем до очереди: queueLaterLetter второй раз не отложит, а
    // письма нет — передаст разговор человеку.
    await db.from("prospects").update({ letter_wanted: null, letter_wanted_at: null }).eq("id", id);
    const queued = await queueLaterLetter(id, lang);
    if (written.ok && queued) run.written += 1;
    else run.handedOver += 1;
  }
  return run;
}
