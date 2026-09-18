import { serviceClient } from "@/lib/supabase";
import type { Review, TalkOutcome } from "@/lib/talk/review";

/**
 * Копилка разборов: запросы к базе.
 *
 * Отдельно от чистой части и от вызова модели по той же причине, по которой
 * так устроена вся переписка: половину этих функций зовёт свип, и тащить туда
 * SDK модели ради двух запросов незачем.
 */

/**
 * Сколько ждать, прежде чем разбирать.
 *
 * Разговор не заканчивается объявлением: человек просто перестаёт отвечать.
 * Час тишины — компромисс: разобрать сразу значит поймать переписку на
 * середине и записать в копилку вывод, который следующая же реплика
 * опровергнет; ждать сутки значит узнавать о провале на сутки позже, чем
 * можно.
 */
const QUIET_MS = 60 * 60 * 1000;

export type ToReview = {
  prospectId: string;
  leadId: string | null;
  host: string;
  niche: string | null;
  aiHandling: boolean;
  handoverReason: string | null;
  thread: { direction: "in" | "out"; body: string }[];
};

/**
 * Переписки, которые пора разобрать.
 *
 * Условий три, и каждое отсекает свой мусор. Есть хотя бы одно входящее —
 * иначе разбирать нечего, письмо просто не прочитали. Последнее сообщение
 * старше часа — разговор успокоился. И разбора либо нет вовсе, либо он
 * старше последнего сообщения — то есть с тех пор что-то произошло.
 */
export async function toReview(limit = 5, now = Date.now()): Promise<ToReview[]> {
  const db = serviceClient();
  if (!db) return [];

  const quietBefore = new Date(now - QUIET_MS).toISOString();

  /**
   * Кандидаты — те, кому отвечали. Прочих в копилке быть не должно.
   *
   * Ошибка запроса поднимается наружу, а не глотается. Первая версия просила
   * у таблицы колонку `facts`, которой там нет; PostgREST отвечал отказом,
   * `data` приходил пустым — и надзиратель молча не видел ни одной переписки.
   * Снаружи это выглядело как «разбирать нечего», и отличить одно от другого
   * было нельзя. Молчаливый отказ хуже громкого: он не чинится, потому что
   * его не видно.
   */
  const { data: answered, error } = await db
    .from("prospects")
    .select("id, host, lead_id, ai_handling, handover_reason, replied_at")
    .not("replied_at", "is", null)
    .lt("replied_at", quietBefore)
    .order("replied_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`переписки не прочитались: ${error.message}`);
  if (!answered?.length) return [];

  const ids = answered.map((row) => String(row.id));
  const { data: reviews, error: seenError } = await db
    .from("talk_reviews")
    .select("prospect_id, created_at")
    .in("prospect_id", ids);
  if (seenError) throw new Error(`копилка не прочиталась: ${seenError.message}`);
  const reviewed = new Map((reviews ?? []).map((r) => [String(r.prospect_id), String(r.created_at)]));

  const out: ToReview[] = [];
  for (const row of answered) {
    const id = String(row.id);
    const seen = reviewed.get(id);
    // Разбор новее последней реплики — значит с тех пор ничего не менялось.
    if (seen && Date.parse(seen) >= Date.parse(String(row.replied_at))) continue;

    const { data: messages } = await db
      .from("outreach_messages")
      .select("direction, body")
      .eq("prospect_id", id)
      .order("created_at", { ascending: true })
      .limit(60);
    const thread = (messages ?? []).map((m) => ({
      direction: m.direction as "in" | "out",
      body: String(m.body ?? ""),
    }));
    if (!thread.some((m) => m.direction === "in")) continue;

    out.push({
      prospectId: id,
      leadId: (row.lead_id as string | null) ?? null,
      host: String(row.host),
      niche: null,
      aiHandling: Boolean(row.ai_handling),
      handoverReason: (row.handover_reason as string | null) ?? null,
      thread,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** Положить разбор в копилку. Повторный разбор переписывает прежний. */
export async function saveReview(input: {
  prospectId: string;
  leadId: string | null;
  lang: string;
  turns: number;
  outcome: TalkOutcome;
  review: Review;
}): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  const { error } = await db.from("talk_reviews").upsert(
    {
      prospect_id: input.prospectId,
      lead_id: input.leadId,
      created_at: new Date().toISOString(),
      lang: input.lang,
      turns: input.turns,
      outcome: input.outcome,
      hook: input.review.hook || null,
      objection: input.review.objection || null,
      failed: input.review.failed || null,
      lesson: input.review.lesson || null,
      confidence: input.review.confidence,
      raw: input.review,
    },
    { onConflict: "prospect_id" },
  );
  // Разбор, который не сохранился, — это потраченный вызов модели и пустая
  // страница у владельца. Пусть падает громко.
  if (error) throw new Error(`разбор не сохранился: ${error.message}`);
}

export type ReviewRow = {
  id: string;
  createdAt: string;
  host: string;
  leadId: string | null;
  lang: string;
  turns: number;
  outcome: TalkOutcome;
  hook: string | null;
  objection: string | null;
  failed: string | null;
  lesson: string | null;
  confidence: "high" | "low";
};

/** Что показать в панели. */
export async function listReviews(limit = 100): Promise<ReviewRow[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data } = await db
    .from("talk_reviews")
    .select("id, created_at, prospect_id, lead_id, lang, turns, outcome, hook, objection, failed, lesson, confidence, prospects:prospect_id (host)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const joined = row.prospects as unknown;
    const site = (Array.isArray(joined) ? joined[0] : joined) as { host?: string } | null;
    return {
      id: String(row.id),
      createdAt: String(row.created_at),
      host: String(site?.host ?? "—"),
      leadId: (row.lead_id as string | null) ?? null,
      lang: String(row.lang ?? "ru"),
      turns: Number(row.turns ?? 0),
      outcome: row.outcome as TalkOutcome,
      hook: (row.hook as string | null) ?? null,
      objection: (row.objection as string | null) ?? null,
      failed: (row.failed as string | null) ?? null,
      lesson: (row.lesson as string | null) ?? null,
      confidence: row.confidence === "high" ? "high" : "low",
    };
  });
}
