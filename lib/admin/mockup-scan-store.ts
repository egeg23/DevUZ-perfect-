import { mockupLinks } from "@/lib/admin/mockup-offer";
import { offerReaders } from "@/lib/admin/mockup-offer-bot";
import { claimMockupScan, finishMockupScan, recordMockupSent } from "@/lib/admin/mockup-offer-store";
import { SCAN_MS, SCAN_SETTLE_MS, inScan, scanSlot, scanSummary } from "@/lib/admin/mockup-scan";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Скан макетов в базе (lib/admin/mockup-scan.ts) — из свипа, в 09:00 и 15:00
 * по Ташкенту, один раз на слот: исходящие касаний и переписка лидов за 14
 * дней, всё, где есть наша ссылка на макет. Рабочие аккаунты Telegram
 * сканирует скаут (scout/runner.mjs) — тем же recordMockupOut.
 *
 * Итог — строкой владельцу и руководителю, только если что-то нашлось.
 */

/** «Наша ссылка» в запросе — до разбора mockupLinks; разбор решает, макет ли это. */
const LIKE = "%devuz.studio/%";

/** Аккаунт «база» в mockup_scans. */
export const DB_SCAN = "db";

export type DbScan = { slot: string | null; seen: number; found: number };

export async function scanDatabase(now: Date = new Date()): Promise<DbScan> {
  const slot = scanSlot(now);
  const run: DbScan = { slot, seen: 0, found: 0 };
  if (!slot) return run;
  const db = serviceClient();
  if (!db) return run;
  if (!(await claimMockupScan(DB_SCAN, slot))) return { ...run, slot: null };

  const since = new Date(now.getTime() - SCAN_MS).toISOString();
  const scan = { now };
  let error: string | null = null;
  try {
    // Исходящие касаний: ушедшие, с датой отправки. Старые сначала —
    // строка одна на клиента и макет, и срок считается от первой отправки.
    const { data: out } = await db
      .from("outreach_messages")
      .select("prospect_id, lead_id, body, sent_at, created_at")
      .eq("direction", "out")
      .not("sent_at", "is", null)
      .gte("sent_at", since)
      .ilike("body", LIKE)
      .order("sent_at", { ascending: true })
      .limit(500);
    for (const m of out ?? []) {
      const body = String(m.body ?? "");
      const at = new Date(String(m.sent_at));
      if (!mockupLinks(body).length || !inScan(at, now)) continue;
      run.seen += 1;
      run.found += await recordMockupSent({
        prospectId: (m.prospect_id as string | null) ?? null,
        leadId: (m.lead_id as string | null) ?? null,
        body,
        at,
        scan,
        // Без касания строку держит уникальный индекс по peer: лид — свой peer.
        peer: m.prospect_id ? null : m.lead_id ? `lead:${m.lead_id}` : null,
      });
    }

    // Переписка лидов в панели: менеджер вставил ссылку в разговор с лидом.
    const { data: notes } = await db
      .from("lead_messages")
      .select("lead_id, body, created_at")
      .gte("created_at", since)
      .ilike("body", LIKE)
      .order("created_at", { ascending: true })
      .limit(500);
    for (const m of notes ?? []) {
      const body = String(m.body ?? "");
      const at = new Date(String(m.created_at));
      if (!m.lead_id || !mockupLinks(body).length || !inScan(at, now)) continue;
      run.seen += 1;
      const leadId = String(m.lead_id);
      const [{ data: p }, { data: lead }] = await Promise.all([
        db.from("prospects").select("id").eq("lead_id", leadId).limit(1).maybeSingle(),
        db.from("leads").select("company, contact_name, contact_handle").eq("id", leadId).maybeSingle(),
      ]);
      run.found += await recordMockupSent({
        prospectId: (p?.id as string | undefined) ?? null,
        leadId,
        body,
        at,
        scan,
        peer: p?.id ? null : `lead:${leadId}`,
        client: String(lead?.company || lead?.contact_name || lead?.contact_handle || ""),
      });
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error("скан макетов, база:", error);
  }
  await finishMockupScan(DB_SCAN, slot, { seen: run.seen, found: run.found, error });
  return run;
}

/**
 * Итог скана владельцу и руководителю: найденное сканом, о чём ещё не
 * говорили, — когда новое не прибавлялось 15 минут (скаут ходит по аккаунтам
 * с паузами). Каждая строка — в итоге один раз (scan_noted_at).
 */
export async function noteScanFinds(now: Date = new Date()): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { data } = await db
    .from("mockup_offers")
    .select("id, client, mockup_name, status, quiet, created_at")
    .eq("source", "scan")
    .is("scan_noted_at", null)
    .order("sent_at", { ascending: false })
    .limit(100);
  const rows = data ?? [];
  if (!rows.length) return 0;
  const newest = Math.max(...rows.map((r) => Date.parse(String(r.created_at))));
  if (now.getTime() - newest < SCAN_SETTLE_MS) return 0;

  const { data: claimed } = await db
    .from("mockup_offers")
    .update({ scan_noted_at: now.toISOString() })
    .in(
      "id",
      rows.map((r) => String(r.id)),
    )
    .is("scan_noted_at", null)
    .select("id, client, mockup_name, status, quiet");
  const text = scanSummary(
    (claimed ?? []).map((r) => ({
      client: esc(String(r.client ?? "")),
      mockup_name: esc(String(r.mockup_name ?? "")),
      status: String(r.status),
      quiet: r.quiet === true,
    })),
  );
  if (!text) return 0;
  for (const reader of await offerReaders()) await sendMessage(reader.chat, `${text}\n\nСписок — «Макеты клиентов» в боте.`);
  return claimed?.length ?? 0;
}
