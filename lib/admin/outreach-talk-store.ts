import { HANDOVER_TEXT, normalizeHandle, readInbound, type TalkRow } from "@/lib/admin/outreach-talk";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Переписка по касанию — то, что ходит в базу.
 *
 * Отдельно от чистой части и от модели по той же причине, по которой
 * отдельно живёт очередь касаний: половину этих функций вызывает процесс
 * скаута, а тянуть к нему SDK модели ради записи входящего незачем.
 *
 * Разделение обязанностей здесь такое. Скаут принимает входящее и
 * отправляет исходящее — он единственный, у кого есть сессия рабочего
 * аккаунта. Свип на сайте думает: читает неотвеченное, зовёт модель и
 * кладёт ответ в очередь. Ни один из них не ждёт другого.
 */

/**
 * Сколько очередных ответов просматривать за раз.
 *
 * Ровно столько, чтобы ручные сообщения не запирали очередь. Больше не
 * нужно: отдаём всё равно по одному, а каждая строка — отдельный запрос за
 * проспектом.
 */
const REPLY_SCAN = 20;

export type Inbound = {
  messageId: string;
  prospectId: string;
  leadId: string | null;
  host: string;
  label: string | null;
  target: string;
  body: string;
  findings: { title: string; impact: string }[];
  firstMessage: string;
  requestNo: string | null;
  managerName: string;
  managerChatId: number | null;
  repliesSoFar: number;
};

/**
 * Входящее от проспекта.
 *
 * Ищем по адресу среди тех, кому уже написали. Не нашли — значит написал
 * кто-то посторонний, и это не наше дело: скаут читает личку рабочего
 * аккаунта, туда пишут и по другим поводам.
 */
export async function recordInbound(input: {
  handle: string;
  /** Кого вернул телеграм при отправке. Главный ключ: он есть всегда. */
  userId?: string;
  body: string;
}): Promise<{ matched: boolean; host?: string; verdict?: string }> {
  const db = serviceClient();
  if (!db) return { matched: false };

  const handle = normalizeHandle(input.handle);
  const userId = (input.userId ?? "").trim();
  if (!handle && !userId) return { matched: false };

  // Сравниваем в общем виде: в проспекте адрес мог остаться ссылкой.
  const { data: rows } = await db
    .from("prospects")
    .select("id, host, target, target_user_id, lead_id, ai_handling")
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(500);

  /**
   * Сначала по id, и только потом по адресу.
   *
   * У человека, найденного по номеру, @адреса может не быть вовсе — а
   * именно так мы и находим тех, у кого на сайте нет телеграма. Пока
   * сверялись только по адресу, их ответы не находили своего разговора и
   * уходили в никуда: снаружи это выглядело как «клиент не отвечает».
   *
   * Обратный порядок был бы хуже и по другой причине: адрес человек меняет,
   * id — нет.
   */
  const prospect =
    (userId ? (rows ?? []).find((row) => String(row.target_user_id ?? "") === userId) : undefined) ??
    (handle ? (rows ?? []).find((row) => normalizeHandle(row.target as string | null) === handle) : undefined);
  if (!prospect) return { matched: false };

  return saveInbound(prospect, input.body);
}

/**
 * Ответ клиента, принесённый руками.
 *
 * По ручному маршруту переписка идёт в WhatsApp или голосом: клиент отвечает
 * менеджеру на телефон, и к нам это не приходит ничем. Владелец: «и тут же
 * подхватывает ИИ после написанного сообщения пользователю до выяснения
 * BANT» — подхватить модель может только то, что ей показали, поэтому ответ
 * переносит человек.
 *
 * Дальше всё то же самое, что и с телеграмом: свип видит неотвеченное
 * входящее, модель пишет ответ, ответ ложится в очередь. Отправит его снова
 * человек — скауту по этому маршруту отправлять некуда.
 */
export async function recordManualInbound(
  prospectId: string,
  body: string,
): Promise<{ matched: boolean; host?: string; verdict?: string }> {
  const db = serviceClient();
  if (!db) return { matched: false };

  const { data: prospect } = await db
    .from("prospects")
    .select("id, host, target, target_user_id, lead_id, ai_handling")
    .eq("id", prospectId)
    .maybeSingle();
  if (!prospect) return { matched: false };

  return saveInbound(prospect, body);
}

/** Общий хвост обоих путей: записать, оценить, при нужде отпустить модель. */
async function saveInbound(
  prospect: { id: unknown; host: unknown; lead_id: unknown; ai_handling: unknown },
  raw: string,
): Promise<{ matched: boolean; host?: string; verdict?: string }> {
  const db = serviceClient();
  if (!db) return { matched: false };

  const body = raw.trim().slice(0, 4000);
  if (!body) return { matched: false };

  await db.from("outreach_messages").insert({
    prospect_id: prospect.id,
    lead_id: prospect.lead_id,
    direction: "in",
    author: "staff",
    body,
    status: "done",
  });

  const patch: Record<string, unknown> = { replied_at: new Date().toISOString() };
  const verdict = readInbound(body);

  // Просьбу не писать и просьбу позвать человека модель не обсуждает.
  // Первая — потому что следующее сообщение после неё и есть то, за что
  // аккаунты блокируют. Вторая — потому что «сейчас позову менеджера» с
  // продолжением расспросов читается как обман.
  if (verdict !== "talk" && prospect.ai_handling) {
    patch.ai_handling = false;
    patch.handover_reason = HANDOVER_TEXT[verdict] ?? verdict;
  }
  await db.from("prospects").update(patch).eq("id", prospect.id);

  if (verdict !== "talk") {
    await tellManager(String(prospect.id), `Ответ по ${prospect.host}: ${HANDOVER_TEXT[verdict] ?? verdict}.\n\n${body.slice(0, 500)}`);
  }

  return { matched: true, host: String(prospect.host), verdict };
}

/** Входящие, на которые ещё не отвечали и по которым модель ещё ведёт. */
export async function pendingTalks(limit = 5): Promise<Inbound[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data } = await db
    .from("outreach_messages")
    .select("id, prospect_id, lead_id, body")
    .eq("direction", "in")
    .is("answered_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  const out: Inbound[] = [];
  for (const row of data ?? []) {
    const { data: p } = await db
      .from("prospects")
      .select("id, host, label, target, message, findings, lead_id, ai_handling, request_no, claimed_by")
      .eq("id", row.prospect_id)
      .maybeSingle();
    if (!p) continue;

    // Модель отпустили — входящее остаётся неотвеченным намеренно: на него
    // отвечает человек, и пометить его «обработанным» значило бы потерять
    // его из виду в панели.
    if (!p.ai_handling) continue;

    const { data: staff } = p.claimed_by
      ? // Только работающий: отключённому не пишем о клиенте и его именем
        // не подписываемся.
        await db
          .from("staff")
          .select("display_name, telegram_user_id")
          .eq("id", p.claimed_by)
          .eq("is_active", true)
          .maybeSingle()
      : { data: null };

    const { count } = await db
      .from("outreach_messages")
      .select("id", { count: "exact", head: true })
      .eq("prospect_id", p.id)
      .eq("direction", "out")
      .eq("author", "ai");

    out.push({
      messageId: String(row.id),
      prospectId: String(p.id),
      leadId: (row.lead_id as string | null) ?? (p.lead_id as string | null) ?? null,
      host: String(p.host),
      label: (p.label as string | null) ?? null,
      target: String(p.target ?? ""),
      body: String(row.body),
      findings: Array.isArray(p.findings)
        ? (p.findings as { title?: string; impact?: string }[])
            .map((f) => ({ title: String(f.title ?? ""), impact: String(f.impact ?? "") }))
            .filter((f) => f.title)
        : [],
      firstMessage: String(p.message ?? ""),
      requestNo: (p.request_no as string | null) ?? null,
      managerName: String(staff?.display_name ?? "менеджер студии"),
      managerChatId: Number(staff?.telegram_user_id) || null,
      repliesSoFar: count ?? 0,
    });
  }
  return out;
}

/** Лента разговора целиком — её читает и модель, и менеджер в карточке. */
export async function threadFor(prospectId: string): Promise<TalkRow[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("outreach_messages")
    .select("direction, body")
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: true })
    .limit(100);
  return (data ?? []).map((row) => ({ direction: row.direction as "in" | "out", body: String(row.body) }));
}

export async function queueReply(input: {
  prospectId: string;
  leadId: string | null;
  body: string;
}): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("outreach_messages").insert({
    prospect_id: input.prospectId,
    lead_id: input.leadId,
    direction: "out",
    author: "ai",
    body: input.body.slice(0, 4000),
    status: "queued",
  });
}

export async function markAnswered(messageId: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("outreach_messages").update({ answered_at: new Date().toISOString() }).eq("id", messageId);
}

/**
 * Модель отпускает разговор.
 *
 * Всегда с причиной и всегда с уведомлением: разговор, тихо оставленный без
 * ответа, для клиента выглядит так же, как если бы им перестали
 * заниматься, — а он, в отличие от нас, об этом не узнает.
 */
export async function handOver(prospectId: string, reason: string, note: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("prospects")
    .update({ ai_handling: false, handover_reason: HANDOVER_TEXT[reason] ?? reason })
    .eq("id", prospectId);
  await tellManager(prospectId, note);
}

/**
 * Строка тому, за кем закреплён лид, — и только ему.
 *
 * Не в общий чат: лид касания уже принадлежит человеку, и объявлять о нём
 * всей команде значит звать остальных на чужой разговор.
 */
export async function tellManager(prospectId: string, text: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;

  const { data: p } = await db
    .from("prospects")
    .select("claimed_by, lead_id, host")
    .eq("id", prospectId)
    .maybeSingle();
  if (!p?.claimed_by) return false;

  const { data: staff } = await db
    .from("staff")
    .select("telegram_user_id")
    .eq("id", p.claimed_by)
    .eq("is_active", true)
    .maybeSingle();
  const chat = Number(staff?.telegram_user_id);
  if (!Number.isFinite(chat) || chat === 0) return false;

  const link = p.lead_id ? `\n\n${siteUrl}/admin/leads/${p.lead_id}` : "";
  return sendMessage(chat, `<b>Касание · ${esc(String(p.host))}</b>\n${esc(text)}${link}`);
}

/** Следующий ответ на отправку — для скаута. */
export async function nextReply(): Promise<{ id: string; target: string; body: string; host: string } | null> {
  const db = serviceClient();
  if (!db) return null;

  /**
   * Берём пачку, а не одно.
   *
   * Ручной маршрут скауту не отдаётся — по нему переписка идёт в WhatsApp
   * или голосом, и отправить в телеграм нечего. Но взять одно верхнее и
   * вернуть null, увидев ручное, значило бы намертво запереть очередь: одно
   * такое сообщение не даёт уйти всем, кто стоит за ним, а ждут там живые
   * люди, которые сами нам написали. Поэтому ручное пропускается, а не
   * останавливает.
   */
  const { data: queued } = await db
    .from("outreach_messages")
    .select("id, body, prospect_id")
    .eq("direction", "out")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(REPLY_SCAN);
  if (!queued?.length) return null;

  for (const row of queued) {
    const { data: p } = await db
      .from("prospects")
      .select("target, host, target_kind, target_user_id")
      .eq("id", row.prospect_id)
      .maybeSingle();
    if (!p?.target) continue;

    // Ответ модели по ручному маршруту никуда не девается: он остаётся в
    // очереди и показывается менеджеру в карточке, чтобы тот отправил его
    // своей рукой. Скаут же, попытавшись, получил бы отказ и передал бы
    // разговор человеку с пометкой «не удалось» — то есть испортил бы ровно
    // то, что здесь работает.
    if (p.target_kind === "manual") continue;

    // Пишем тому, кого телеграм вернул при отправке: у найденного по номеру
    // @адреса может не быть.
    const to = String(p.target_user_id ?? "") || String(p.target);
    return { id: String(row.id), target: to, body: String(row.body), host: String(p.host) };
  }
  return null;
}

export async function markReplySent(id: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("outreach_messages")
    .update({ status: "sent", sent_at: new Date().toISOString(), failure: null })
    .eq("id", id);
}

/**
 * Ответ не ушёл.
 *
 * В отличие от первого касания, очередь здесь не снимается целиком: это
 * ответ человеку, который сам нам написал, и ограничение за рассылку так
 * не зарабатывают. Но разговор передаётся человеку — молчание после его
 * вопроса хуже, чем чужая рука в переписке.
 */
export async function markReplyFailed(id: string, why: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  const { data } = await db
    .from("outreach_messages")
    .update({ status: "failed", failure: why.slice(0, 500) })
    .eq("id", id)
    .select("prospect_id")
    .maybeSingle();

  if (data?.prospect_id) {
    await handOver(String(data.prospect_id), "failed", `Ответ не удалось отправить: ${why.slice(0, 200)}. Напишите сами.`);
  }
}

export type TalkView = {
  prospectId: string;
  host: string;
  aiHandling: boolean;
  handoverReason: string | null;
  target: string | null;
  lines: { direction: "in" | "out"; author: "staff" | "ai"; body: string; created_at: string }[];
};

/**
 * Разговор для карточки лида.
 *
 * Показывается тому, за кем лид закреплён, без отдельного раскрытия. Гейт
 * на переписке из чата стоит потому, что там клиент рассказывал о себе
 * незнакомому ассистенту и не ждал, что это прочтёт вся студия. Здесь всё
 * наоборот: это наша собственная переписка с сайта, который мы сами
 * выбрали, и менеджеру она нужна ровно для того, чтобы её продолжить.
 */
export async function talkForLead(leadId: string): Promise<TalkView | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data: p } = await db
    .from("prospects")
    .select("id, host, target, ai_handling, handover_reason")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (!p) return null;

  const { data } = await db
    .from("outreach_messages")
    .select("direction, author, body, created_at")
    .eq("prospect_id", p.id)
    .order("created_at", { ascending: true })
    .limit(100);

  return {
    prospectId: String(p.id),
    host: String(p.host),
    aiHandling: Boolean(p.ai_handling),
    handoverReason: (p.handover_reason as string | null) ?? null,
    target: (p.target as string | null) ?? null,
    lines: (data ?? []).map((row) => ({
      direction: row.direction as "in" | "out",
      author: (row.author as "staff" | "ai") ?? "ai",
      body: String(row.body),
      created_at: String(row.created_at),
    })),
  };
}

/**
 * Менеджер забирает разговор себе.
 *
 * Без уведомления и без причины из словаря: это не передача от модели по
 * нужде, а решение человека, и объяснять его некому — он же его и принял.
 */
export async function takeOverTalk(prospectId: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("prospects")
    .update({ ai_handling: false, handover_reason: "менеджер отвечает сам" })
    .eq("id", prospectId);
}
