import { HOURLY_CAP, HOUR_MS, MAX_GAP_MS, MIN_GAP_MS, isStopError, type RouteKind } from "@/lib/admin/outreach";
import { serviceClient } from "@/lib/supabase";

/**
 * Очередь касаний — то, что читает процесс скаута.
 *
 * Отдельным модулем от хранилища намеренно: у скаута своё окружение и свой
 * набор зависимостей, и тянуть туда весь аудитор с моделью ради трёх
 * запросов к базе незачем. Здесь только база и пределы.
 */

/**
 * Что ушло за последний час: сколько и когда самое старое.
 *
 * Предел считается по факту отправки, а не по очереди: задание, стоящее в
 * очереди, ещё никого не побеспокоило. Отметка самого старого нужна, чтобы
 * сказать менеджеру, когда освободится место, — а не просто «занято».
 */
export async function sentLastHour(now = Date.now()): Promise<{ count: number; oldestAgoMs: number | null }> {
  const db = serviceClient();
  // База недоступна — считаем час занятым: лучше задержать, чем отправить
  // мимо предела.
  if (!db) return { count: HOURLY_CAP, oldestAgoMs: null };

  const { data } = await db
    .from("prospects")
    .select("sent_at")
    .eq("status", "sent")
    .gte("sent_at", new Date(now - HOUR_MS).toISOString())
    .order("sent_at", { ascending: true });

  const rows = data ?? [];
  const oldest = rows[0]?.sent_at ? Date.parse(String(rows[0].sent_at)) : null;
  return { count: rows.length, oldestAgoMs: oldest === null ? null : now - oldest };
}

/** Сколько заданий стоит в очереди перед этим. */
export async function aheadInQueue(claimedAt: string | null): Promise<number> {
  const db = serviceClient();
  if (!db || !claimedAt) return 0;
  const { count } = await db
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .eq("status", "sending")
    .lt("claimed_at", claimedAt);
  return count ?? 0;
}

export type Queued = { id: string; target: string; kind: RouteKind; message: string; host: string };

/**
 * Следующее задание — одно за раз и не раньше паузы после предыдущего.
 *
 * Пауза здесь, а не в отправителе: предел общий для аккаунта, а
 * отправителей теоретически может стать больше одного.
 */
export async function nextQueued(now = Date.now()): Promise<Queued | null> {
  const db = serviceClient();
  if (!db) return null;

  if ((await sentLastHour(now)).count >= HOURLY_CAP) return null;

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
    .select("id, target, target_kind, message, host")
    .eq("status", "sending")
    .order("claimed_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data?.target || !data?.message) return null;
  return {
    id: String(data.id),
    target: String(data.target),
    // Маршрут решает, о чём спрашивать телеграм: @адрес резолвится, номер
    // импортируется в контакты. Старые строки заведены до маршрутов, и у
    // них он один возможный.
    kind: (data.target_kind as RouteKind | null) ?? "handle",
    message: String(data.message),
    host: String(data.host),
  };
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

/**
 * Ушло.
 *
 * `userId` — кого телеграм нам в итоге вернул. Записывается сюда, а не
 * забывается: ответ приходит от человека, у которого @адреса может не быть
 * вовсе (по номеру такие и находятся), и связать его с проспектом больше
 * нечем.
 */
export async function markSent(
  id: string,
  userId?: string | null,
  messageId?: string | number | null,
): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  const { data } = await db
    .from("prospects")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      failure: null,
      ...(userId ? { target_user_id: userId } : {}),
      // Номер сообщения — то, по чему потом ищем его в переписке. Без него
      // проверка свелась бы к «там что-то есть», а нужна «там есть именно
      // это».
      ...(messageId ? { sent_message_id: String(messageId), delivered_at: null, delivery_note: null } : {}),
    })
    .eq("id", id)
    .select("message, lead_id")
    .maybeSingle();

  // Лента переписки начинается здесь, в момент доставки, а не в момент
  // постановки в очередь. Записать письмо заранее значило бы показать
  // менеджеру отправленным то, что отдать не удалось, — а модель, читая
  // такую ленту, стала бы ссылаться на несказанное.
  if (data?.message) {
    await db.from("outreach_messages").insert({
      prospect_id: id,
      lead_id: data.lead_id ?? null,
      direction: "out",
      author: "staff",
      body: String(data.message).slice(0, 4000),
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  }
}

/**
 * Перечитали переписку и нашли своё сообщение.
 *
 * Владелец: «после того как отправилось — делай проверку, что с нашего
 * аккаунта реально ушло сообщение».
 *
 * Ответ Telegram на отправку означает только, что сервер запрос принял. Это
 * не то же самое, что «письмо лежит у адресата»: антиспам снимает сообщение
 * уже после приёма, а у того, кто нас заблокировал, оно исчезает молча — и
 * в обоих случаях ошибки нам никто не покажет. Разница видна одним
 * способом: перечитать переписку и найти в ней своё сообщение по номеру.
 *
 * Не подтвердилось — статус не трогаем. Отправка была, и делать вид, что её
 * не было, значило бы разрешить второе касание тому же человеку; а это
 * ровно то, за что аккаунты и блокируют. Менеджер видит в карточке, что
 * подтверждения нет, и решает сам.
 */
export async function markDelivered(id: string, ok: boolean, note?: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("prospects")
    .update(
      ok
        ? { delivered_at: new Date().toISOString(), delivery_note: null }
        : { delivered_at: null, delivery_note: (note ?? "подтвердить не удалось").slice(0, 300) },
    )
    .eq("id", id);
}

/**
 * Автономно не дотянулись: адресат оказался каналом, ботом или его нет вовсе.
 *
 * Не `failed`: ничего не сломалось. Задание снимается с очереди и уходит
 * человеку — в WhatsApp или звонком, — и место в часовом пределе при этом не
 * тратится: до телеграма дело так и не дошло.
 */
export async function markUnreachable(id: string, note: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("prospects")
    .update({ status: "manual", target_kind: "manual", failure: note.slice(0, 500) })
    .eq("id", id);
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
