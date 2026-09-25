import {
  HOURLY_CAP,
  HOUR_MS,
  MAX_GAP_MS,
  MIN_GAP_MS,
  handTargetFrom,
  isMobile,
  isStopError,
  type RouteKind,
} from "@/lib/admin/outreach";
import { serviceClient } from "@/lib/supabase";

/**
 * Очередь касаний — то, что читает процесс скаута.
 *
 * Отдельным модулем от хранилища намеренно: у скаута своё окружение и свой
 * набор зависимостей, и тянуть туда весь аудитор с моделью ради трёх
 * запросов к базе незачем. Здесь только база и пределы.
 */

/**
 * Ушло с рабочего аккаунта — а не руками. «Связался сам» и ручной маршрут
 * тоже ставят «отправлено», но пишет там человек со своего телефона, и
 * рабочий аккаунт этих сообщений не видел: считать их в его «два в час» —
 * значит держать очередь бота из-за чужих звонков. Пустой маршрут — старые
 * строки, заведённые до маршрутов: они уходили ботом.
 */
const SENT_BY_ACCOUNT = "target_kind.is.null,target_kind.neq.manual";

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
    .or(SENT_BY_ACCOUNT)
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
 * Касания владельца уходят вне очереди.
 *
 * Владелец, 24 сентября: «Мои сообщения и контакты уходят вне очереди!» Его
 * письмо не ждёт ни чужих заданий, ни часового предела «два в час», ни
 * паузы 8–20 минут. Остаётся одна минута после любой предыдущей отправки:
 * два письма с одного аккаунта в одну секунду — подпись рассылки, и за неё
 * ограничивают аккаунт, которым скаут ещё и читает чаты.
 *
 * В «два в час» письмо владельца при этом считается: предел про аккаунт, а
 * не про очередь, и остальным после него придётся подождать.
 */
export const OWNER_FLOOR_MS = 60_000;

const QUEUED_COLUMNS = "id, target, target_kind, message, host";

function toQueued(data: Record<string, unknown> | null): Queued | null {
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

/** Кто владелец: вне очереди уходит то, что отправил он. */
async function ownerIds(db: NonNullable<ReturnType<typeof serviceClient>>): Promise<string[]> {
  const { data } = await db.from("staff").select("id").eq("role", "admin").eq("is_active", true);
  return (data ?? []).map((row) => String(row.id));
}

/** То же для панели: карточке владельца очередь показывается как «вне очереди». */
export async function queueOwners(): Promise<string[]> {
  const db = serviceClient();
  return db ? ownerIds(db) : [];
}

/**
 * Следующее задание — одно за раз и не раньше паузы после предыдущего.
 *
 * Пауза здесь, а не в отправителе: предел общий для аккаунта, а
 * отправителей теоретически может стать больше одного.
 */
export async function nextQueued(now = Date.now()): Promise<Queued | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data: last } = await db
    .from("prospects")
    .select("sent_at")
    .eq("status", "sent")
    .or(SENT_BY_ACCOUNT)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastAt = last?.sent_at ? Date.parse(String(last.sent_at)) : 0;

  // Сначала — владелец, мимо предела и паузы (см. OWNER_FLOOR_MS).
  const owners = await ownerIds(db);
  if (owners.length && (!lastAt || now - lastAt >= OWNER_FLOOR_MS)) {
    const { data: mine } = await db
      .from("prospects")
      .select(QUEUED_COLUMNS)
      .eq("status", "sending")
      .in("claimed_by", owners)
      .order("claimed_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const job = toQueued(mine);
    if (job) return job;
  }

  if ((await sentLastHour(now)).count >= HOURLY_CAP) return null;

  const gap = MIN_GAP_MS + Math.floor((MAX_GAP_MS - MIN_GAP_MS) * pseudoRandom(lastAt));
  if (lastAt && now - lastAt < gap) return null;

  const { data } = await db
    .from("prospects")
    .select(QUEUED_COLUMNS)
    .eq("status", "sending")
    .order("claimed_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return toQueued(data);
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
export async function markUnreachable(
  id: string,
  note: string,
  kind: RouteKind = "handle",
  /** Кому пробовали сейчас: по номеру — чтобы взять следующий, а не тот же. */
  tried: string | null = null,
): Promise<"phone" | "manual" | null> {
  const db = serviceClient();
  if (!db) return null;

  /**
   * Вместе с маршрутом меняется и адресат.
   *
   * Первая версия правила этого не делала — и карточка с пометкой «дальше
   * руками» оставалась с @адресом в поле цели. А карточка ручного маршрута
   * строит из этого поля ссылку «позвонить» и ссылку в WhatsApp: выходило
   * `tel:@muradbuildings` и адрес WhatsApp, собранный из букв. Менеджер
   * нажимал и попадал в никуда.
   *
   * Номера нет вовсе — стираем цель совсем: пустая карточка с объяснением
   * честнее, чем две кнопки, которые никуда не ведут.
   */
  const { data } = await db.from("prospects").select("contacts").eq("id", id).maybeSingle();
  const contacts = (data?.contacts ?? {}) as { whatsapp?: string[]; phones?: string[] };
  const hand = handTargetFrom({ whatsapp: contacts.whatsapp ?? [], phones: contacts.phones ?? [] });

  /**
   * Адрес не подошёл — пробуем номер, а не сдаёмся.
   *
   * 24 сентября касание владельца svoydom.kz ушло «руками», так и не
   * попробовав телеграм: ссылка на сайте вела в канал компании, а мобильный
   * номер с того же сайта рабочий аккаунт даже не проверил — хотя по номеру
   * телеграм находит людей чаще, чем по адресу. Карточка остаётся в очереди
   * тем же местом, меняется только маршрут; до отправки дело не дошло, и
   * место в часовом пределе цело.
   */
  // Мобильных на сайте бывает несколько — у svoydom.kz на первом телеграма
  // не оказалось, а второй никто не попробовал. Идём по списку дальше того,
  // что пробовали сейчас; по адресу — с первого.
  const mobiles = [...new Set([...(contacts.whatsapp ?? []), ...(contacts.phones ?? [])].filter(isMobile))];
  const next = kind === "phone" ? mobiles[mobiles.indexOf(tried ?? "") + 1] : mobiles[0];
  if (next && (kind !== "phone" || mobiles.includes(tried ?? ""))) {
    await db
      .from("prospects")
      .update({
        target_kind: "phone",
        target: next,
        failure: `${note} Пробуем найти в Telegram по номеру ${next}.`.slice(0, 500),
      })
      .eq("id", id)
      .eq("status", "sending");
    return "phone";
  }

  await db
    .from("prospects")
    .update({ status: "manual", target_kind: "manual", target: hand, failure: note.slice(0, 500) })
    .eq("id", id);
  return "manual";
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
