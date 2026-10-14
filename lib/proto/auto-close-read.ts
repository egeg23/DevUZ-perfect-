import { type AutoCloseInput } from "@/lib/proto/auto-close";
import { serviceClient } from "@/lib/supabase";

/**
 * Чтение для правила «24 часа, потом по паролю» (lib/proto/auto-close.ts):
 * первая отправка макета клиенту и вход правила из строки прототипа. Общее
 * у свипа (auto-close-store) и раздела «Макеты» (mockups-store).
 */

export type ProtoRow = {
  id: string;
  name: string;
  prospect_id: string | null;
  auto: boolean | null;
  closed_at: string | null;
  opened_at: string | null;
  created_at: string;
  lock: string | null;
  lockAt: string | null;
};

export type FirstSend = { sent_at: string; lead_id: string | null; prospect_id: string | null };

/** Первая отправка каждого макета клиенту: ref → строка. */
export async function firstSends(refs: readonly string[]): Promise<Map<string, FirstSend>> {
  const out = new Map<string, FirstSend>();
  const db = serviceClient();
  if (!db || !refs.length) return out;
  const { data } = await db
    .from("mockup_offers")
    .select("mockup_ref, sent_at, lead_id, prospect_id")
    .in("mockup_ref", [...refs])
    .order("sent_at", { ascending: true })
    .limit(2000);
  for (const row of data ?? []) {
    const ref = String(row.mockup_ref);
    if (!out.has(ref)) {
      out.set(ref, {
        sent_at: String(row.sent_at),
        lead_id: (row.lead_id as string | null) ?? null,
        prospect_id: (row.prospect_id as string | null) ?? null,
      });
    }
  }
  return out;
}

export function inputOf(p: ProtoRow, sent: FirstSend | undefined): AutoCloseInput {
  return {
    auto: p.auto,
    closedAt: p.closed_at,
    lock: p.lock,
    lockAt: p.lockAt,
    sentAt: sent?.sent_at ?? null,
    openedAt: p.opened_at,
    createdAt: p.created_at,
  };
}

