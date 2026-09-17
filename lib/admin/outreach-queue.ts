import { DAILY_CAP, MAX_GAP_MS, MIN_GAP_MS, isStopError } from "@/lib/admin/outreach";
import { serviceClient } from "@/lib/supabase";

/**
 * Очередь касаний — то, что читает процесс скаута.
 *
 * Отдельным модулем от хранилища намеренно: у скаута своё окружение и свой
 * набор зависимостей, и тянуть туда весь аудитор с моделью ради трёх
 * запросов к базе незачем. Здесь только база и пределы.
 */

/** Сколько ушло за сутки — предел считается по факту отправки, не по очереди. */
export async function sentToday(): Promise<number> {
  const db = serviceClient();
  if (!db) return DAILY_CAP;
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await db
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", since);
  return count ?? 0;
}

export type Queued = { id: string; target: string; message: string; host: string };

/**
 * Следующее задание — одно за раз и не раньше паузы после предыдущего.
 *
 * Пауза здесь, а не в отправителе: предел общий для аккаунта, а
 * отправителей теоретически может стать больше одного.
 */
export async function nextQueued(now = Date.now()): Promise<Queued | null> {
  const db = serviceClient();
  if (!db) return null;

  if ((await sentToday()) >= DAILY_CAP) return null;

  const { data: last } = await db
    .from("prospects")
    .select("sent_at")
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastAt = last?.sent_at ? Date.parse(String(last.sent_at)) : 0;
  const gap = MIN_GAP_MS + Math.floor((MAX_GAP_MS - MIN_GAP_MS) * pseudoRandom(lastAt));
  if (lastAt && now - lastAt < gap) return null;

  const { data } = await db
    .from("prospects")
    .select("id, target, message, host")
    .eq("status", "sending")
    .order("claimed_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data?.target || !data?.message) return null;
  return { id: String(data.id), target: String(data.target), message: String(data.message), host: String(data.host) };
}

/**
 * Разброс паузы без Math.random: одинаковый интервал между отправками —
 * это подпись рассылки, а случайность в коде, зависящем от времени,
 * мешает проверять его тестом.
 */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed || 1) * 10_000;
  return x - Math.floor(x);
}

export async function markSent(id: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("prospects").update({ status: "sent", sent_at: new Date().toISOString(), failure: null }).eq("id", id);
}

/**
 * Отказ Telegram. Если он про аккаунт, а не про адресата, останавливаем всю
 * очередь: продолжать после PEER_FLOOD — верный способ потерять аккаунт.
 */
export async function markFailed(id: string, why: string): Promise<{ stopped: boolean }> {
  const db = serviceClient();
  if (!db) return { stopped: false };

  await db.from("prospects").update({ status: "failed", failure: why.slice(0, 500) }).eq("id", id);

  if (!isStopError(why)) return { stopped: false };

  const { data } = await db
    .from("prospects")
    .update({ status: "new", failure: `очередь остановлена: ${why.slice(0, 200)}` })
    .eq("status", "sending")
    .select("id");
  console.error(`касания: ${why} — очередь остановлена, снято заданий: ${(data ?? []).length}`);
  return { stopped: true };
}
