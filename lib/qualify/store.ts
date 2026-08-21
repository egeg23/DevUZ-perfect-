import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { ChatMessage, ScoredLead } from "@/lib/qualify/types";

let cached: SupabaseClient | null = null;

/**
 * Клиент Supabase на сервисном ключе.
 *
 * Ключ сервисной роли обходит RLS, поэтому он не имеет права оказаться в
 * браузере ни при каких условиях — отсюда и имя без префикса NEXT_PUBLIC_,
 * и обращение к нему только из серверных модулей.
 *
 * Если переменные не заданы, возвращается null и сайт продолжает работать:
 * лид всё равно уйдёт в Telegram, просто без истории в базе. Это осознанный
 * компромисс — потерять лид хуже, чем потерять аналитику.
 */
function client(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function isStoreConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function saveLead(
  lead: ScoredLead,
  transcript: ChatMessage[],
  source: string,
): Promise<string | null> {
  const db = client();
  if (!db) return null;

  const { data, error } = await db
    .from("leads")
    .insert({
      source,
      locale: lead.locale,
      contact_name: lead.contact_name || null,
      company: lead.company || null,
      contact_handle: lead.contact_handle || null,
      contact_kind: lead.contact_kind ?? null,
      niche: lead.niche,
      niche_tier: lead.niche_tier,
      expertise: lead.expertise,
      services: lead.services,
      budget: lead.budget,
      authority: lead.authority,
      need: lead.need,
      timing: lead.timing,
      intent: lead.intent,
      score: lead.score,
      grade: lead.grade,
      priority: lead.priority,
      breakdown: lead.breakdown,
      summary: lead.summary,
      notes: lead.notes || null,
      opening_line: lead.opening_line || null,
      already_told: lead.already_told ?? [],
      avoid_asking: lead.avoid_asking ?? [],
      transcript,
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    console.error("supabase insert lead", error.message);
    return null;
  }

  return data?.id ?? null;
}

/** Отмечает, кто из менеджеров забрал лида — вызывается из вебхука Telegram. */
export async function updateLeadStatus(
  leadId: string,
  status: "taken" | "dropped",
  manager: string,
): Promise<void> {
  const db = client();
  if (!db) return;

  const { error } = await db
    .from("leads")
    .update({ status, assigned_to: manager, assigned_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) console.error("supabase update lead", error.message);
}
