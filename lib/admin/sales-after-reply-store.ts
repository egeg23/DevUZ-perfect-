import { queueReply } from "@/lib/admin/outreach-talk-store";
import { bossAskDue, bossAskText, type ArmCounts, type SalesArm } from "@/lib/admin/sales-after-reply";
import { serviceClient } from "@/lib/supabase";
import { detectLang } from "@/lib/talk/language";

/**
 * Продажа после ответа — то, что ходит в базу: вопрос через два дня после
 * «передам руководству» и счёт A/B по половинам. Правила —
 * lib/admin/sales-after-reply.ts.
 */

/**
 * «Руководитель успел посмотреть?» — ровно один раз, через два дня после
 * «передам руководству», в рабочее время, только если после обещания
 * клиент молчит и человек ему не писал. Исключение из «Не ответил — ничего»:
 * ответ человек обещал сам. Свип зовёт раз в пять минут.
 */
export async function runBossAsks(now = Date.now()): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { data, error } = await db
    .from("prospects")
    .select("id, lead_id, status, closed_reason, boss_promised_at, boss_asked_at")
    .not("boss_promised_at", "is", null)
    .is("boss_asked_at", null)
    .eq("status", "sent")
    .is("closed_reason", null)
    .lte("boss_promised_at", new Date(now - 2 * 24 * 3600_000).toISOString())
    .limit(30);
  // Миграция 0168 не применена — колонок нет: спрашивать некого.
  if (error || !data?.length) return 0;

  let asked = 0;
  for (const p of data) {
    const since = String(p.boss_promised_at);
    const { data: after } = await db
      .from("outreach_messages")
      .select("direction, author, kind, created_at")
      .eq("prospect_id", p.id)
      .gt("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20);
    const rows = after ?? [];
    const lastIn = rows.find((r) => r.direction === "in" && r.kind !== "auto");
    // Человек уже писал после обещания — разговор у него, вопрос не нужен.
    const staffWrote = rows.some((r) => r.direction === "out" && r.author === "staff");
    const due = bossAskDue(
      { boss_promised_at: since, boss_asked_at: null, closed_reason: (p.closed_reason as string | null) ?? null },
      lastIn ? String(lastIn.created_at) : null,
      now,
    );
    if (staffWrote || (!due && lastIn)) {
      // Ответ пришёл или человек ведёт сам — вопрос уже не нужен никогда.
      await db.from("prospects").update({ boss_asked_at: new Date(now).toISOString() }).eq("id", p.id).is("boss_asked_at", null);
      continue;
    }
    if (!due) continue;

    // Отметка — до очереди и условно: два свипа подряд не спросят дважды.
    const { data: claimed } = await db
      .from("prospects")
      .update({ boss_asked_at: new Date(now).toISOString() })
      .eq("id", p.id)
      .is("boss_asked_at", null)
      .select("id");
    if (!claimed?.length) continue;

    const { data: promise } = await db
      .from("outreach_messages")
      .select("body")
      .eq("prospect_id", p.id)
      .eq("direction", "in")
      .lte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lang = detectLang(String(promise?.body ?? "")) === "uz" ? "uz" : "ru";
    await queueReply({ prospectId: String(p.id), leadId: (p.lead_id as string | null) ?? null, body: bossAskText(lang) });
    asked += 1;
  }
  return asked;
}

/**
 * Счёт половин A/B «Новый заход после ответа» за всё время с 17.10.2026:
 * «Здравствуйте», ответили живые (без автоответчиков), ответили после
 * кружка, «+», макет ушёл, оплата. Лимиты — чтобы страница не висела.
 */
export async function abCounts(): Promise<ArmCounts[] | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data: prospects, error } = await db
    .from("prospects")
    .select("id, sales_arm, lead_id, proto_requested_at")
    .not("sales_arm", "is", null)
    .not("hello_at", "is", null)
    .limit(5000);
  if (error) return null;
  const list = prospects ?? [];
  const ids = list.map((p) => String(p.id));
  const leads = list.map((p) => p.lead_id).filter(Boolean) as string[];

  const [messages, offers, paidLeads] = await Promise.all([
    chunked(ids, (part) =>
      db
        .from("outreach_messages")
        .select("prospect_id, direction, kind, status, created_at")
        .in("prospect_id", part)
        .limit(20000),
    ),
    chunked(ids, (part) => db.from("mockup_offers").select("prospect_id").in("prospect_id", part).limit(5000)),
    chunked(leads, (part) => db.from("leads").select("id, status").in("id", part).eq("status", "won").limit(5000)),
  ]);

  const won = new Set(paidLeads.map((l) => String(l.id)));
  const mocked = new Set(offers.map((o) => String(o.prospect_id)));
  const byProspect = new Map<string, { direction: string; kind: string | null; status: string; created_at: string }[]>();
  for (const m of messages) {
    const key = String(m.prospect_id);
    if (!byProspect.has(key)) byProspect.set(key, []);
    byProspect.get(key)!.push(m as { direction: string; kind: string | null; status: string; created_at: string });
  }

  const empty = (arm: SalesArm): ArmCounts => ({ arm, hello: 0, live: 0, afterCircle: 0, plus: 0, mockup: 0, paid: 0 });
  const counts: Record<SalesArm, ArmCounts> = { old: empty("old"), new: empty("new") };
  for (const p of list) {
    const arm = p.sales_arm === "new" ? "new" : "old";
    const c = counts[arm];
    const rows = (byProspect.get(String(p.id)) ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));
    c.hello += 1;
    if (rows.some((r) => r.direction === "in" && r.kind !== "auto")) c.live += 1;
    const circle = rows.find((r) => r.direction === "out" && r.kind === "circle" && r.status === "sent");
    if (circle && rows.some((r) => r.direction === "in" && r.kind !== "auto" && r.created_at > circle.created_at)) c.afterCircle += 1;
    if (p.proto_requested_at) c.plus += 1;
    if (mocked.has(String(p.id))) c.mockup += 1;
    if (p.lead_id && won.has(String(p.lead_id))) c.paid += 1;
  }
  return [counts.old, counts.new];
}

async function chunked<T>(
  ids: readonly string[],
  query: (part: string[]) => PromiseLike<{ data: T[] | null }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await query(ids.slice(i, i + 200));
    out.push(...(data ?? []));
  }
  return out;
}
