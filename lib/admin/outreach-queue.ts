import {
  HOURLY_CAP,
  HOUR_MS,
  MAX_GAP_MS,
  MIN_GAP_MS,
  sendWindowOpen,
  handTargetFrom,
  isMobile,
  isStopError,
  type RouteKind,
} from "@/lib/admin/outreach";
import { DISPATCH_STALE_MS, MAIN_ACCOUNT, accountOf, mayTake } from "@/lib/admin/work-accounts";
import { queueEtas, type Eta, type EtaAccount } from "@/lib/admin/queue-eta";
import { mainLimitUntil } from "@/lib/admin/account-ban-store";
import { helloFor } from "@/lib/admin/hello-first";
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
export async function sentLastHour(
  now = Date.now(),
  /** Чей час: один аккаунт. Не передан — все вместе, для панели. */
  account?: string,
): Promise<{ count: number; oldestAgoMs: number | null }> {
  const db = serviceClient();
  // База недоступна — считаем час занятым: лучше задержать, чем отправить
  // мимо предела.
  if (!db) return { count: HOURLY_CAP, oldestAgoMs: null };

  const { data } = await db
    .from("prospects")
    .select("sent_at, sent_via")
    .eq("status", "sent")
    .or(SENT_BY_ACCOUNT)
    .gte("sent_at", new Date(now - HOUR_MS).toISOString())
    .order("sent_at", { ascending: true });

  // Аккаунт — фильтром здесь, а не вторым `or` в запросе: строк за час
  // единицы, а два логических условия в одном запросе PostgREST читает
  // не так, как они написаны.
  const rows = (data ?? []).filter((row) => !account || accountOf(row.sent_via as string | null) === account);
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

/**
 * Письмо из очереди. Отправляется не `message`, а `hello` — «Здравствуйте»
 * на языке письма; кружок или письмо уйдёт, когда клиент ответит
 * (lib/admin/hello-first.ts).
 */
export type Queued = { id: string; target: string; kind: RouteKind; message: string; hello: string; host: string };

/**
 * Взять письмо из очереди — этим аккаунтом и только им.
 *
 * Аккаунтов несколько, и все смотрят в одну очередь. «Прочитать верхнее и
 * отправить» отдало бы одно письмо двоим — и человек получил бы два
 * одинаковых сообщения с двух номеров, ровно то, за что ограничивают оба.
 * Поэтому отметка ставится условно, в самом update: свободное или брошенное
 * больше DISPATCH_STALE_MS назад (скаут упал посередине).
 */
async function take(
  db: NonNullable<ReturnType<typeof serviceClient>>,
  id: string,
  account: string,
  now: number,
): Promise<boolean> {
  const stale = new Date(now - DISPATCH_STALE_MS).toISOString();
  const { data } = await db
    .from("prospects")
    .update({ dispatch_by: account, dispatch_at: new Date(now).toISOString() })
    .eq("id", id)
    .eq("status", "sending")
    .or(`dispatch_by.is.null,dispatch_at.lt."${stale}"`)
    .select("id");
  return Boolean(data?.length);
}

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

const QUEUED_COLUMNS = "id, target, target_kind, message, host, claimed_by, walked, autopilot_at";

/**
 * Кто на каких аккаунтах работает: сотрудник → ключи аккаунтов.
 *
 * Только живые аккаунты: привязка к отключённому не держит письма — у
 * сотрудника, привязанного лишь к нему, письма снова берёт любой аккаунт.
 */
export async function assignments(db: NonNullable<ReturnType<typeof serviceClient>>): Promise<Map<string, Set<string>>> {
  const [{ data: rows }, { data: live }] = await Promise.all([
    db.from("tg_account_staff").select("account_key, staff_id"),
    db.from("tg_accounts").select("id").neq("status", "removed"),
  ]);
  const alive = new Set([MAIN_ACCOUNT, ...(live ?? []).map((row) => String(row.id))]);
  const out = new Map<string, Set<string>>();
  for (const row of rows ?? []) {
    const key = String(row.account_key);
    if (!alive.has(key)) continue;
    const staff = String(row.staff_id);
    out.set(staff, (out.get(staff) ?? new Set()).add(key));
  }
  return out;
}

function toQueued(data: Record<string, unknown> | null): Queued | null {
  // Без письма в очередь встаёт только автопрогон: его письмо пишется после
  // ответа (LETTER_AFTER_REPLY), а «Здравствуйте» — на языке сайта.
  if (!data?.target || (!data?.message && !data?.autopilot_at)) return null;
  return {
    id: String(data.id),
    target: String(data.target),
    // Маршрут решает, о чём спрашивать телеграм: @адрес резолвится, номер
    // импортируется в контакты. Старые строки заведены до маршрутов, и у
    // них он один возможный.
    kind: (data.target_kind as RouteKind | null) ?? "handle",
    message: String(data.message ?? ""),
    hello: helloFor(String(data.message ?? ""), (data.walked as { lang?: string } | null)?.lang),
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
 * Следующее задание для этого аккаунта — одно за раз и не раньше паузы
 * после его предыдущего письма.
 *
 * Предел и пауза — у каждого аккаунта свои: Telegram ограничивает номер, а
 * не студию. Очередь общая, и письмо берёт тот аккаунт, у которого раньше
 * освободилось место (см. take).
 */
export async function nextQueued(
  now = Date.now(),
  account: string = MAIN_ACCOUNT,
  cap: number = HOURLY_CAP,
): Promise<Queued | null> {
  const db = serviceClient();
  if (!db) return null;

  // Первые письма — только с 07:30 до 20:30 по Ташкенту, и владельца тоже:
  // ночью незнакомым пишут только рассылки. Очередь утром двинется сама.
  if (!sendWindowOpen(now)) return null;

  // Последнее письмо этого аккаунта — среди последних отправок всех: три
  // аккаунта по два в час проходят полсотни писем за восемь часов, а пауза
  // между письмами — минуты.
  const { data: recent } = await db
    .from("prospects")
    .select("sent_at, sent_via")
    .eq("status", "sent")
    .or(SENT_BY_ACCOUNT)
    .order("sent_at", { ascending: false })
    .limit(50);
  const last = (recent ?? []).find((row) => accountOf(row.sent_via as string | null) === account);
  const lastAt = last?.sent_at ? Date.parse(String(last.sent_at)) : 0;
  const stale = new Date(now - DISPATCH_STALE_MS).toISOString();

  // Письмо менеджера уходит с аккаунта, на котором он работает (см. mayTake).
  const assigned = await assignments(db);

  /** Верхние свободные задания — по одному, пока одно не возьмётся этим аккаунтом. */
  const takeFirst = async (owners: string[] | null): Promise<Queued | null> => {
    let query = db
      .from("prospects")
      .select(QUEUED_COLUMNS)
      .eq("status", "sending")
      .or(`dispatch_by.is.null,dispatch_at.lt."${stale}"`);
    if (owners) query = query.in("claimed_by", owners);
    // С запасом: верхние письма могут принадлежать менеджерам других аккаунтов.
    const { data } = await query.order("claimed_at", { ascending: true }).limit(25);
    for (const row of data ?? []) {
      const by = (row as { claimed_by?: string | null }).claimed_by ?? null;
      if (by && !mayTake(account, assigned.get(by))) continue;
      const job = toQueued(row as Record<string, unknown>);
      if (job && (await take(db, job.id, account, now))) return job;
    }
    return null;
  };

  // Сначала — владелец, мимо предела и паузы (см. OWNER_FLOOR_MS).
  const owners = await ownerIds(db);
  if (owners.length && (!lastAt || now - lastAt >= OWNER_FLOOR_MS)) {
    const job = await takeFirst(owners);
    if (job) return job;
  }

  if ((await sentLastHour(now, account)).count >= cap) return null;

  const gap = MIN_GAP_MS + Math.floor((MAX_GAP_MS - MIN_GAP_MS) * pseudoRandom(lastAt));
  if (lastAt && now - lastAt < gap) return null;

  return takeFirst(null);
}

/**
 * Когда примерно уйдёт каждое письмо очереди (lib/admin/queue-eta.ts).
 *
 * Те же данные, что читает nextQueued: очередь по claimed_at, владельцы,
 * привязка менеджеров к аккаунтам, пределы и ограничения аккаунтов и то,
 * что каждый из них уже отправил за час. Главный пишет по HOURLY_CAP, а его
 * ограничение — строка tg-ban:main (lib/admin/account-ban-store.ts).
 */
export async function loadQueueEtas(now = Date.now()): Promise<Map<string, Eta>> {
  const db = serviceClient();
  if (!db) return new Map();

  const [{ data: jobs }, owners, assigned, { data: live }, { data: recent }, mainUntil] = await Promise.all([
    db.from("prospects").select("id, claimed_by").eq("status", "sending").order("claimed_at", { ascending: true }).limit(500),
    ownerIds(db),
    assignments(db),
    // Выключенный или ещё не вошедший аккаунт письма не возьмёт: его нет в
    // расчёте, и письмо, привязанное только к нему, честно «не уйдёт».
    db.from("tg_accounts").select("id, hourly_cap, flood_until").eq("status", "active"),
    db
      .from("prospects")
      .select("sent_at, sent_via")
      .eq("status", "sent")
      .or(SENT_BY_ACCOUNT)
      .order("sent_at", { ascending: false })
      .limit(50),
    // Ограничение главного — в stats_snapshots (account-ban-store).
    mainLimitUntil(now),
  ]);

  const sends = (recent ?? []).map((row) => ({
    account: accountOf(row.sent_via as string | null),
    at: Date.parse(String(row.sent_at)),
  }));
  const accountState = (key: string, cap: number, floodUntil: string | null): EtaAccount => {
    const mine = sends.filter((s) => s.account === key).map((s) => s.at);
    const until = floodUntil ? Date.parse(floodUntil) : null;
    return {
      key,
      cap,
      until: until !== null && until > now ? until : null,
      sent: mine.filter((at) => at > now - HOUR_MS),
      lastAt: mine.length ? Math.max(...mine) : null,
    };
  };
  const accounts = [
    accountState(MAIN_ACCOUNT, HOURLY_CAP, mainUntil ? new Date(mainUntil).toISOString() : null),
    ...(live ?? []).map((row) =>
      accountState(String(row.id), Number(row.hourly_cap ?? HOURLY_CAP), (row.flood_until as string | null) ?? null),
    ),
  ];

  const ownerSet = new Set(owners);
  return queueEtas({
    jobs: (jobs ?? []).map((row) => {
      const by = (row.claimed_by as string | null) ?? null;
      return { id: String(row.id), owner: Boolean(by && ownerSet.has(by)), accounts: by ? assigned.get(by) : undefined };
    }),
    accounts,
    now,
    ownerFloorMs: OWNER_FLOOR_MS,
  });
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
  /** С какого аккаунта: ответы и правки потом пойдут с него же. */
  account: string = MAIN_ACCOUNT,
): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  const { data } = await db
    .from("prospects")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      // Ушло «Здравствуйте», а не письмо: письмо ждёт ответа клиента.
      hello_at: new Date().toISOString(),
      failure: null,
      sent_via: account,
      dispatch_by: null,
      dispatch_at: null,
      ...(userId ? { target_user_id: userId } : {}),
      // Номер сообщения — то, по чему потом ищем его в переписке. Без него
      // проверка свелась бы к «там что-то есть», а нужна «там есть именно
      // это».
      ...(messageId ? { sent_message_id: String(messageId), delivered_at: null, delivery_note: null } : {}),
    })
    .eq("id", id)
    .select("message, lead_id, walked, autopilot_at")
    .maybeSingle();

  // Прототип, собранный заранее, ушёл вместе с письмом (lib/proto/auto).
  // Запрос прямой, а не через lib/proto/store: тот тянет за собой сборку
  // страниц, а этот модуль читает скаут — см. комментарий в начале файла.
  await db
    .from("protos")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("prospect_id", id)
    .eq("auto", true)
    .eq("status", "ready");

  // Лента переписки начинается здесь, в момент доставки, а не в момент
  // постановки в очередь. Записать письмо заранее значило бы показать
  // менеджеру отправленным то, что отдать не удалось, — а модель, читая
  // такую ленту, стала бы ссылаться на несказанное. Ушло «Здравствуйте» —
  // его и пишем; письмо ляжет в ленту, когда уйдёт после ответа клиента.
  if (data?.message || data?.autopilot_at) {
    await db.from("outreach_messages").insert({
      prospect_id: id,
      lead_id: data.lead_id ?? null,
      direction: "out",
      author: "staff",
      body: helloFor(String(data.message ?? ""), (data.walked as { lang?: string } | null)?.lang),
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
        // Следующим тиком письмо может взять любой аккаунт.
        dispatch_by: null,
        dispatch_at: null,
      })
      .eq("id", id)
      .eq("status", "sending");
    return "phone";
  }

  await db
    .from("prospects")
    .update({ status: "manual", target_kind: "manual", target: hand, failure: note.slice(0, 500), dispatch_by: null, dispatch_at: null })
    .eq("id", id);
  return "manual";
}

/**
 * Отказ Telegram. Если он про аккаунт, а не про адресата, этот аккаунт
 * останавливается: продолжать после PEER_FLOOD — верный способ его потерять.
 *
 * Аккаунтов несколько — и отказ про наш номер не повод ставить крест на
 * письме: адресат тут ни при чём. Письмо возвращается в очередь, его возьмёт
 * другой аккаунт. Других нет (или они тоже остановлены) — очередь снимается
 * целиком, как и раньше: ждать некому.
 */
export async function markFailed(
  id: string,
  why: string,
  options: { othersAlive?: boolean } = {},
): Promise<{ stopped: boolean }> {
  const db = serviceClient();
  if (!db) return { stopped: false };

  if (isStopError(why) && options.othersAlive) {
    await db
      .from("prospects")
      .update({ dispatch_by: null, dispatch_at: null, failure: `аккаунт остановлен Telegram: ${why.slice(0, 200)} — уйдёт с другого` })
      .eq("id", id);
    console.error(`касания: ${why} — аккаунт остановлен, письмо вернулось в очередь`);
    return { stopped: true };
  }

  await db
    .from("prospects")
    .update({ status: "failed", failure: why.slice(0, 500), dispatch_by: null, dispatch_at: null })
    .eq("id", id);

  if (!isStopError(why)) return { stopped: false };

  const { data } = await db
    .from("prospects")
    .update({ status: "new", failure: `очередь остановлена: ${why.slice(0, 200)}`, dispatch_by: null, dispatch_at: null })
    .eq("status", "sending")
    .select("id");
  console.error(`касания: ${why} — очередь остановлена, снято заданий: ${(data ?? []).length}`);
  return { stopped: true };
}
