import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChatMessage, ScoredLead } from "@/lib/qualify/types";
import { isSupabaseConfigured, serviceClient } from "@/lib/supabase";

/**
 * Клиент Supabase на сервисном ключе — общий для всего сервера, см.
 * lib/supabase.ts. Здесь остаётся только локальное имя: слишком много мест
 * ниже читают `client()`, и переименовывать их ради одного импорта незачем.
 */
function client(): SupabaseClient | null {
  return serviceClient();
}

export function isStoreConfigured(): boolean {
  return isSupabaseConfigured();
}

export async function saveLead(
  lead: ScoredLead,
  transcript: ChatMessage[],
  source: string,
  /**
   * То, что относится к заявке, а не к самому лиду.
   *
   * Номер клиент слышит в чате и называет его, когда пишет снова, — по нему
   * менеджер и ищет разговор. Скидка здесь же, потому что это факт про
   * деньги: по ней считается, во сколько обходится гарантия двадцати секунд.
   */
  meta: { requestNo?: string; discount?: boolean } = {},
): Promise<string | null> {
  const db = client();
  if (!db) return null;

  const { data, error } = await db
    .from("leads")
    .insert({
      source,
      request_no: meta.requestNo ?? null,
      discount_granted: meta.discount ?? false,
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

