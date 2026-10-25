import { botWaits, inboxFor, seesBotInbox, touchWaits, type InboxItem } from "@/lib/admin/inbox";
import type { Role } from "@/lib/admin/roles";
import { HUMAN_HOLD_DAYS } from "@/lib/qualify/bot-inbox-store";
import { serviceClient } from "@/lib/supabase";

/** Неотвеченные входящие касаний — за две недели, как «Горит сейчас» на «Главной». */
const DAYS = 14;
const LIMIT = 1000;

export type Inbox = { items: InboxItem[]; freeLeads: number; offline: boolean };

/**
 * «Входящие» человека (lib/admin/inbox.ts): касания, где клиент ждёт ответа
 * человека, обращения в бота, где разговор ведёт человек, и сколько новых
 * заявок ещё никто не взял. Несколько запросов с лимитами, без модели.
 */
export async function loadInbox(viewer: { id: string; role: Role }, now: Date = new Date()): Promise<Inbox> {
  const db = serviceClient();
  if (!db) return { items: [], freeLeads: 0, offline: true };
  const from = new Date(now.getTime() - DAYS * 86_400_000).toISOString();
  const botFrom = new Date(now.getTime() - HUMAN_HOLD_DAYS * 86_400_000).toISOString();

  const [msgsRes, botRes, freeRes] = await Promise.all([
    db
      .from("outreach_messages")
      .select("prospect_id, lead_id, created_at, body, kind")
      .eq("direction", "in")
      .is("answered_at", null)
      .gte("created_at", from)
      .order("created_at", { ascending: true })
      .limit(LIMIT),
    seesBotInbox(viewer.role)
      ? db
          .from("bot_users")
          .select("chat_id, username, first_name, last_name, human_at, human_by, last_text, last_text_at, blocked_at")
          .gte("human_at", botFrom)
          .not("last_text_at", "is", null)
          .is("blocked_at", null)
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    db.from("leads").select("id", { count: "exact", head: true }).eq("status", "new").is("assigned_staff_id", null),
  ]);
  if (msgsRes.error) {
    console.error("входящие: не прочитал входящие касаний", msgsRes.error.message);
    return { items: [], freeLeads: 0, offline: true };
  }

  const msgs = msgsRes.data ?? [];
  const prospectIds = [...new Set(msgs.map((m) => String(m.prospect_id)))];
  const prospects = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < prospectIds.length; i += 200) {
    const { data } = await db
      .from("prospects")
      .select("id, label, host, ai_handling, closed_at, handled_by, claimed_by, touched_by, lead_id")
      .in("id", prospectIds.slice(i, i + 200));
    for (const p of data ?? []) prospects.set(String(p.id), p);
  }
  const leadIds = [...new Set([...prospects.values()].map((p) => p.lead_id).filter((v): v is string => typeof v === "string"))];
  const owners = new Map<string, string | null>();
  for (let i = 0; i < leadIds.length; i += 200) {
    const { data } = await db.from("leads").select("id, assigned_staff_id").in("id", leadIds.slice(i, i + 200));
    for (const l of data ?? []) owners.set(String(l.id), (l.assigned_staff_id as string | null) ?? null);
  }

  // Касание — одной строкой: с самого раннего неотвеченного, слова — последние.
  const touches = new Map<string, Parameters<typeof inboxFor>[0][number]>();
  for (const m of msgs) {
    const p = prospects.get(String(m.prospect_id));
    if (!p || !touchWaits({ ai_handling: p.ai_handling as boolean | null, closed_at: (p.closed_at as string | null) ?? null }, { kind: (m.kind as string | null) ?? null })) continue;
    const leadId = (m.lead_id as string | null) ?? (p.lead_id as string | null) ?? null;
    const was = touches.get(String(p.id));
    if (was) {
      was.text = String(m.body ?? "");
      continue;
    }
    const leadOwner = leadId ? (owners.get(leadId) ?? null) : null;
    const handled = (p.handled_by as string | null) ?? null;
    const claimed = (p.claimed_by as string | null) ?? null;
    const touched = (p.touched_by as string | null) ?? null;
    touches.set(String(p.id), {
      kind: "touch",
      prospectId: String(p.id),
      leadId,
      label: String(p.label || p.host || "—"),
      since: String(m.created_at),
      text: String(m.body ?? ""),
      ownerId: leadId ? leadOwner : (handled ?? claimed ?? touched),
      mine: { hasLead: Boolean(leadId), leadOwner, handled_by: handled, claimed_by: claimed, touched_by: touched },
    });
  }

  const bots = (botRes.data ?? [])
    .filter((u) =>
      botWaits(
        { human_at: (u.human_at as string | null) ?? null, last_text_at: (u.last_text_at as string | null) ?? null, blocked_at: (u.blocked_at as string | null) ?? null },
        now.getTime(),
        HUMAN_HOLD_DAYS,
      ),
    )
    .map((u) => ({
      kind: "bot" as const,
      chatId: Number(u.chat_id),
      label: [u.first_name, u.last_name].filter(Boolean).join(" ") || (u.username ? `@${u.username}` : String(u.chat_id)),
      since: String(u.last_text_at),
      text: String(u.last_text ?? ""),
      ownerId: (u.human_by as string | null) ?? null,
    }));

  return { items: inboxFor([...touches.values(), ...bots], viewer), freeLeads: freeRes.count ?? 0, offline: false };
}
