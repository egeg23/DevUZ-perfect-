import {
  NIGHT_HEADING,
  OFFER_MINUTES,
  OPEN_HEADING,
  QUEUE_ROLES,
  LOST_WINDOW_HOURS,
  isLostCard,
  isWorkingHours,
  lostHeading,
  missedNotice,
  monthStartOf,
  offerHeading,
  pickNext,
  watchHeading,
  type Candidate,
  type Offer,
  type Share,
} from "@/lib/admin/lead-queue";
import { salesRecipients } from "@/lib/qualify/brief";
import { noticesOf } from "@/lib/qualify/notices";
import type { LeadOrigin } from "@/lib/qualify/origin";
import { editLeadCards, sendLead, sendMessage, telegramReachable } from "@/lib/qualify/telegram";
import type { ScoredLead } from "@/lib/qualify/types";
import { serviceClient } from "@/lib/supabase";

/**
 * Очередь на тёплые лиды — то, что ходит в базу и в Telegram.
 *
 * Правила живут в `lib/admin/lead-queue.ts`, здесь — только их исполнение:
 * кому предложить, кому что написать, что закрыть.
 */

type Person = { id: string; name: string; chat: string | null; role: string };

/** Кто стоит в очереди — с тем, сколько у кого за месяц. */
async function queueCandidates(now: Date): Promise<{ people: Person[]; candidates: Candidate[] }> {
  const db = serviceClient();
  if (!db) return { people: [], candidates: [] };

  const { data: staff } = await db
    .from("staff")
    .select("id, display_name, username, telegram_user_id, role")
    .eq("is_active", true)
    .in("role", [...QUEUE_ROLES]);

  const people: Person[] = ((staff as Record<string, unknown>[] | null) ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.username ? `@${row.username}` : row.display_name ?? "—"),
    chat: typeof row.telegram_user_id === "number" ? String(row.telegram_user_id) : null,
    role: String(row.role),
  }));
  if (!people.length) return { people, candidates: [] };

  const ids = people.map((p) => p.id);
  const since = monthStartOf(now).toISOString();

  const [{ data: taken }, { data: missed }, { data: recent }] = await Promise.all([
    // Взятые — из журнала, а не по полю лида: поле переписывается при
    // передаче, а журнал помнит, кто нажал «Взять».
    db
      .from("audit_events")
      .select("actor_staff_id")
      .eq("action", "lead.taken")
      .in("actor_staff_id", ids)
      .gte("created_at", since)
      .limit(5000),
    db
      .from("lead_offers")
      .select("staff_id")
      .eq("outcome", "expired")
      .in("staff_id", ids)
      .gte("closed_at", since)
      .limit(5000),
    db
      .from("lead_offers")
      .select("staff_id, offered_at")
      .in("staff_id", ids)
      .order("offered_at", { ascending: false })
      .limit(500),
  ]);

  const count = (rows: unknown, key: string) => {
    const out = new Map<string, number>();
    for (const row of (rows as Record<string, unknown>[] | null) ?? []) {
      const id = String(row[key]);
      out.set(id, (out.get(id) ?? 0) + 1);
    }
    return out;
  };
  const takenBy = count(taken, "actor_staff_id");
  const missedBy = count(missed, "staff_id");
  const lastBy = new Map<string, string>();
  for (const row of (recent as { staff_id: string; offered_at: string }[] | null) ?? []) {
    if (!lastBy.has(row.staff_id)) lastBy.set(row.staff_id, row.offered_at);
  }

  return {
    people,
    candidates: people
      // Без Telegram человеку не сообщить, что лид его, — и полчаса лид
      // простоял бы у того, кто о нём не знает.
      .filter((p) => p.chat)
      .map((p) => ({
        id: p.id,
        taken: takenBy.get(p.id) ?? 0,
        missed: missedBy.get(p.id) ?? 0,
        lastOfferAt: lastBy.get(p.id) ?? null,
      })),
  };
}

type OfferRow = Offer & { id: string };

export async function offersOf(leadId: string): Promise<OfferRow[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("lead_offers")
    .select("id, staff_id, expires_at, outcome")
    .eq("lead_id", leadId)
    .order("offered_at", { ascending: true });
  return ((data as Record<string, unknown>[] | null) ?? []).map((row) => ({
    id: String(row.id),
    staffId: String(row.staff_id),
    expiresAt: String(row.expires_at),
    outcome: (row.outcome as string | null) ?? null,
  }));
}

/** Состояние очереди по лиду — то, по чему решается, можно ли его взять. */
export async function queueState(
  leadId: string,
): Promise<{ offers: OfferRow[]; openedAt: string | null; fairShare: boolean }> {
  const db = serviceClient();
  if (!db) return { offers: [], openedAt: null, fairShare: false };
  const [offers, { data: lead }] = await Promise.all([
    offersOf(leadId),
    db.from("leads").select("queue_opened_at, fair_share").eq("id", leadId).maybeSingle(),
  ]);
  return {
    offers,
    openedAt: (lead?.queue_opened_at as string | null) ?? null,
    fairShare: lead?.fair_share === true,
  };
}

/**
 * Сколько взято за месяц — для потолка равной доли у ночного лида.
 *
 * Считают те же люди, что стоят в очереди: делить поровну между теми, кому
 * лид вообще может достаться, а не между всеми, кто есть в «Сотрудниках».
 */
export async function shareOf(staffId: string, now: Date = new Date()): Promise<Share> {
  const { candidates } = await queueCandidates(now);
  return {
    mine: candidates.find((c) => c.id === staffId)?.taken ?? 0,
    total: candidates.reduce((sum, c) => sum + c.taken, 0),
    people: candidates.length,
  };
}

/**
 * Открыть лид по равной доле: он пришёл или его полчаса вышли в нерабочее
 * время.
 *
 * Карточка уходит сразу всем в очереди. Флаг остаётся у лида и утром: лид,
 * пришедший в 23:00 и не взятый до девяти, очередь не проходил, и начинать её
 * задним числом значило бы снова держать его полчаса у каждого.
 */
async function openNight(card: Card, now: Date): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("leads")
    .update({ fair_share: true, queue_opened_at: now.toISOString() })
    .eq("id", card.leadId);
  await sendLead(card.lead, card.leadId, card.requestNo, {
    to: await salesRecipients(),
    heading: withExtra(NIGHT_HEADING, card.heading),
    origin: card.origin,
  });
}

/** Смотрящие со стороны: чат продаж и владелец. Им карточка идёт всегда. */
async function watchers(): Promise<string[]> {
  const db = serviceClient();
  const out = new Set<string>();
  const sales = (process.env.TELEGRAM_SALES_CHAT_ID ?? "").trim();
  if (sales) out.add(sales);
  if (!db) return [...out];
  const { data } = await db.from("staff").select("telegram_user_id").eq("is_active", true).eq("role", "admin");
  for (const row of (data as { telegram_user_id: number | null }[] | null) ?? []) {
    if (typeof row.telegram_user_id === "number") out.add(String(row.telegram_user_id));
  }
  return [...out];
}

/**
 * Предложить лид одному человеку.
 *
 * Карточка уходит ему — со сроком — и смотрящим со стороны, с пометкой, у
 * кого лид. Остальным в очереди не уходит ничего: показывать лид, который
 * взять нельзя, значит звать к спору, а не к работе.
 */
async function offerTo(
  person: Person,
  card: Card,
  now: Date,
  alsoWatchers: boolean,
): Promise<boolean> {
  const db = serviceClient();
  if (!db || !person.chat) return false;

  const until = new Date(now.getTime() + OFFER_MINUTES * 60_000).toISOString();
  const { error } = await db
    .from("lead_offers")
    .insert({ lead_id: card.leadId, staff_id: person.id, offered_at: now.toISOString(), expires_at: until });
  // Отказ уникального индекса — это второй проход свипа, успевший раньше:
  // лид уже предложен, и дублировать его некому.
  if (error) {
    console.error("очередь: не выдал предложение", error.message);
    return false;
  }

  // Доставка вторична: предложение уже есть, и если карточка не дошла —
  // заблокировал бота, сеть, — через полчаса лид сам уйдёт следующему.
  await sendLead(card.lead, card.leadId, card.requestNo, {
    to: [person.chat],
    heading: withExtra(offerHeading(until), card.heading),
    origin: card.origin,
  });

  if (alsoWatchers) {
    const others = (await watchers()).filter((chat) => chat !== person.chat);
    if (others.length) {
      await sendLead(card.lead, card.leadId, card.requestNo, {
        to: others,
        heading: withExtra(watchHeading(person.name, until), card.heading),
        origin: card.origin,
      });
    }
  }
  return true;
}

/** Шапка очереди поверх своей шапки лида — например, суммы заказа с витрины. */
function withExtra(queue: string, extra: string | undefined): string {
  return extra ? `${queue}\n\n${extra}` : queue;
}

type Card = {
  leadId: string;
  lead: ScoredLead;
  requestNo: string | undefined;
  origin: LeadOrigin & { at?: string | number | Date };
  /** Своя шапка лида, если есть: сумма заказа с витрины и кому он адресован. */
  heading?: string;
};

/**
 * Запустить очередь по новому лиду.
 *
 * Возвращает `true`, если очередь взяла лид на себя: предложение выдано, и
 * дальше лид поведёт свип. `false` — очередь вести некому (в команде никого,
 * у кого есть Telegram) или негде (лид не записался в базу), и тогда
 * вызывающий рассылает карточку всем, как раньше. Лид без очереди лучше
 * лида, который никто не увидел.
 */
export async function startQueue(card: Card, now: Date = new Date()): Promise<boolean> {
  if (!card.leadId || card.leadId === "unsaved") return false;

  // Ночью — сразу всем, с потолком равной доли. Предлагать по очереди
  // некому: полчаса у каждого спящего — это часы, за которые клиент уйдёт.
  if (!isWorkingHours(now)) {
    await openNight(card, now);
    return true;
  }

  const { people, candidates } = await queueCandidates(now);
  const first = pickNext(candidates, new Set());
  const person = first ? people.find((p) => p.id === first.id) : null;
  if (!person) return false;

  return offerTo(person, card, now, true);
}

/**
 * Пустить лид по очереди заново — у него пропал ведущий.
 *
 * Для лидов отключённого сотрудника и для карточек, которые не дошли ни до
 * кого (redeliverLostCards). По тем же правилам, что новый лид:
 * днём — тому, у кого меньше, на полчаса; ночью — всем с потолком равной
 * доли. Иначе «лиды уволенного» стали бы тем самым входом, через который
 * ушлый менеджер забирает себе всё, — их разбирали бы, кто первый нажал.
 *
 * Прежние предложения закрываются, отметка «открыт всем» снимается: без
 * этого проверка взятия видела бы старое «открыт» и пускала бы любого.
 */
export async function requeueLead(leadId: string, heading: string, now: Date = new Date()): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;

  await db
    .from("lead_offers")
    .update({ outcome: "cancelled", closed_at: now.toISOString() })
    .eq("lead_id", leadId)
    .is("outcome", null);
  await db.from("leads").update({ queue_opened_at: null, fair_share: false }).eq("id", leadId);

  const card = await cardOf(leadId);
  if (!card) return false;
  if (await startQueue({ ...card, heading }, now)) return true;

  // Очередь вести некому — всем, как лид без очереди.
  await db.from("leads").update({ queue_opened_at: now.toISOString() }).eq("id", leadId);
  return sendLead(card.lead, card.leadId, card.requestNo, {
    to: await salesRecipients(),
    heading,
    origin: card.origin,
  });
}

/**
 * Дослать карточки, которые не дошли ни до кого (см. isLostCard).
 *
 * Лид пускается по очереди заново — по правилам текущего часа: днём тому,
 * у кого меньше, ночью всем с равной долей. Шапка говорит, что это досылка
 * и когда лид пришёл.
 *
 * Только когда Telegram отвечает: пока его нет, досылка не дойдёт так же,
 * как не дошла карточка, а днём каждая попытка выдавала бы новое
 * предложение в очереди.
 */
export async function redeliverLostCards(
  now: Date = new Date(),
): Promise<{ resent: string[]; errors: string[] }> {
  const report = { resent: [] as string[], errors: [] as string[] };
  const db = serviceClient();
  if (!db) return report;

  const since = new Date(now.getTime() - LOST_WINDOW_HOURS * 3_600_000).toISOString();
  const { data: leads, error } = await db
    .from("leads")
    .select("id, request_no, status, assigned_staff_id, queue_opened_at, created_at")
    .eq("status", "new")
    .is("assigned_staff_id", null)
    .not("queue_opened_at", "is", null)
    .gte("created_at", since);
  if (error) {
    report.errors.push(`не прочитал лиды: ${error.message}`);
    return report;
  }
  if (!leads?.length) return report;

  const { data: notices } = await db
    .from("lead_notices")
    .select("lead_id")
    .in(
      "lead_id",
      leads.map((lead) => lead.id as string),
    );
  const delivered = new Set(((notices as { lead_id: string }[] | null) ?? []).map((row) => row.lead_id));

  const lost = leads.filter((lead) =>
    isLostCard(
      {
        status: lead.status as string | null,
        assignedStaffId: lead.assigned_staff_id as string | null,
        queueOpenedAt: lead.queue_opened_at as string | null,
        createdAt: lead.created_at as string,
        notices: delivered.has(lead.id as string) ? 1 : 0,
      },
      now,
    ),
  );
  if (!lost.length || !(await telegramReachable())) return report;

  for (const lead of lost) {
    try {
      if (await requeueLead(lead.id as string, lostHeading(lead.created_at as string), now)) {
        report.resent.push((lead.request_no as string | null) ?? (lead.id as string));
        console.log(`очередь: дослал карточку ${lead.request_no ?? lead.id} — она не дошла ни до кого`);
      }
    } catch (err) {
      report.errors.push(`${lead.request_no ?? lead.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return report;
}

/** Карточка лида, собранная из базы — для того, кому очередь дошла позже. */
async function cardOf(leadId: string): Promise<(Card & { label: string; free: boolean }) | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("leads").select("*").eq("id", leadId).maybeSingle();
  if (!data) return null;
  const row = data as Record<string, unknown>;

  const lead = {
    contact_name: String(row.contact_name ?? ""),
    company: String(row.company ?? ""),
    contact_handle: String(row.contact_handle ?? ""),
    contact_kind: row.contact_kind,
    niche: String(row.niche ?? ""),
    niche_tier: row.niche_tier,
    expertise: row.expertise,
    services: (row.services as string[] | null) ?? [],
    budget: row.budget,
    authority: row.authority,
    need: row.need,
    timing: row.timing,
    intent: row.intent,
    summary: row.summary ?? {},
    notes: String(row.notes ?? ""),
    opening_line: String(row.opening_line ?? ""),
    already_told: (row.already_told as string[] | null) ?? [],
    avoid_asking: (row.avoid_asking as string[] | null) ?? [],
    score: Number(row.score ?? 0),
    grade: row.grade,
    breakdown: (row.breakdown as Record<string, number> | null) ?? {},
    priority: row.priority,
    locale: row.locale,
  } as ScoredLead;

  return {
    leadId,
    lead,
    requestNo: (row.request_no as string | null) ?? undefined,
    origin: {
      source: (row.source as string | null) ?? null,
      tgUsername: (row.tg_username as string | null) ?? null,
      entryPath: (row.entry_path as string | null) ?? null,
      entryRef: (row.entry_ref as string | null) ?? null,
      at: (row.created_at as string | null) ?? undefined,
    },
    label: String(row.company || row.contact_name || row.request_no || "без имени"),
    free: !row.assigned_staff_id && row.status === "new",
  };
}

export type AdvanceReport = { expired: number; offered: number; opened: number; errors: string[] };

/**
 * Передать дальше лиды, чьи полчаса вышли. Зовётся свипом каждые пять минут.
 *
 * Порядок внутри — не случайный. Сначала предложение закрывается условным
 * обновлением: два одновременных прохода свипа не передадут один лид дважды,
 * второй просто не найдёт, что закрывать. Потом тот, у кого вышло время,
 * узнаёт об этом — и кнопки под его карточкой гаснут, чтобы нажатие не
 * кончалось отказом. И только потом лид уходит следующему.
 */
export async function advanceQueues(now: Date = new Date()): Promise<AdvanceReport> {
  const report: AdvanceReport = { expired: 0, offered: 0, opened: 0, errors: [] };
  const db = serviceClient();
  if (!db) return report;

  const { data: due } = await db
    .from("lead_offers")
    .select("id, lead_id, staff_id")
    .is("outcome", null)
    .lte("expires_at", now.toISOString())
    .limit(50);

  for (const offer of (due as { id: string; lead_id: string; staff_id: string }[] | null) ?? []) {
    try {
      const { data: closed } = await db
        .from("lead_offers")
        .update({ outcome: "expired", closed_at: now.toISOString() })
        .eq("id", offer.id)
        .is("outcome", null)
        .select("id")
        .maybeSingle();
      if (!closed) continue;
      report.expired += 1;

      const card = await cardOf(offer.lead_id);
      if (!card) continue;

      const { people, candidates } = await queueCandidates(now);
      const missedBy = people.find((p) => p.id === offer.staff_id);

      // Лид успели взять иначе — владелец вне очереди, передача: дальше
      // вести нечего, а сообщать о «вышедшем времени» некому.
      if (!card.free) continue;

      if (missedBy?.chat) {
        await sendMessage(missedBy.chat, missedNotice(card.label));
        const mine = (await noticesOf(offer.lead_id)).filter((n) => n.chatId === missedBy.chat);
        await editLeadCards(mine, offer.lead_id, "⌛ Время вышло — лид у следующего");
      }

      // Полчаса вышли уже вечером — следующему не передаём: он, скорее всего,
      // тоже не у телефона. Лид открывается всем по равной доле.
      if (!isWorkingHours(now)) {
        await openNight(card, now);
        report.opened += 1;
        continue;
      }

      const tried = new Set((await offersOf(offer.lead_id)).map((o) => o.staffId));
      const next = pickNext(candidates, tried);
      const person = next ? people.find((p) => p.id === next.id) : null;

      if (person && (await offerTo(person, card, now, false))) {
        report.offered += 1;
        continue;
      }

      // Круг пройден — или следующему выдать не вышло: база отказала на
      // записи предложения. Во втором случае лид остался бы в очереди без
      // действующего предложения, то есть его не смог бы взять никто, кроме
      // владельца. Открытый лид лучше запертого.
      //
      // Круг пройден: лид открыт всем. Карточка уходит каждому заново — старые
      // копии у тех, кто пропустил, уже с погашенными кнопками.
      await db.from("leads").update({ queue_opened_at: now.toISOString() }).eq("id", offer.lead_id);
      await sendLead(card.lead, card.leadId, card.requestNo, {
        to: await salesRecipients(),
        heading: OPEN_HEADING,
        origin: card.origin,
      });
      report.opened += 1;
    } catch (error) {
      report.errors.push(`${offer.lead_id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return report;
}

/**
 * Закрыть предложение после взятия.
 *
 * Взял тот, кому предложено, — taken. Взял владелец вне очереди — cancelled:
 * у того, кому лид был предложен, шанс не пропущен, а отнят, и в счёт
 * пропущенных ему это не пойдёт.
 */
export async function closeOfferAfterTake(leadId: string, staffId: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { data: open } = await db
    .from("lead_offers")
    .select("id, staff_id")
    .eq("lead_id", leadId)
    .is("outcome", null)
    .maybeSingle();
  if (!open) return;
  await db
    .from("lead_offers")
    .update({ outcome: open.staff_id === staffId ? "taken" : "cancelled", closed_at: new Date().toISOString() })
    .eq("id", open.id)
    .is("outcome", null);
}

/**
 * Снять очередь с лида: его отпустили или вернули в новые.
 *
 * Такой лид открыт всем. Пускать его по кругу заново — значит снова полчаса
 * ждать каждого, кто его уже видел, ради лида, который однажды уже был в
 * работе.
 */
export async function openQueue(leadId: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const now = new Date().toISOString();
  await db
    .from("lead_offers")
    .update({ outcome: "cancelled", closed_at: now })
    .eq("lead_id", leadId)
    .is("outcome", null);
  await db.from("leads").update({ queue_opened_at: now }).eq("id", leadId);
}

/**
 * Разослать новый лид: через очередь, если её есть кому вести, иначе всем.
 *
 * Одна функция на все входы — разговор с ботом, форму на сайте, заказ с
 * витрины. Разные пути доставки для одного и того же лида — это ровно то,
 * через что «ушлый» менеджер и получал лиды раньше других: через вход, где
 * очереди почему-то не оказалось.
 */
export async function routeNewLead(
  card: Card & { fallback: readonly (string | number)[] },
): Promise<boolean> {
  if (await startQueue(card)) return true;
  return sendLead(card.lead, card.leadId, card.requestNo, {
    to: [...card.fallback],
    heading: card.heading,
    origin: card.origin,
  });
}
