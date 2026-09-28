import { serviceClient } from "@/lib/supabase";

/**
 * Переписка по касанию идёт за лидом.
 *
 * Лид из касания и разговор с клиентом — одно дело, но живут в двух местах:
 * лид — в leads, разговор — в prospects (claimed_by). Пока их ведёт один
 * человек, это незаметно. 28 сентября уволилась Мадина: её лиды ушли в
 * очередь и достались Владиславу и другим, а переписки по ним — её
 * руководителю, как положено при отключении. Лид у одного, ответы клиента,
 * дожим и подпись модели — у другого. Так же было и при обычной передаче лида.
 *
 * Правило одно: у кого лид, у того и разговор. Зовётся после того, как лид
 * взяли из очереди или передали.
 */

/** Разговоры, которые ещё идут: в них модель подписывается именем того, за кем касание. */
export const LIVE_TALK = ["sending", "sent", "manual"] as const;

/**
 * Перевести идущий разговор по лиду на нового хозяина лида. Возвращает сайт
 * разговора, если он переехал, — для журнала.
 *
 * «Отвечать самому» (handled_by) сбрасывается: его нажимал прежний хозяин,
 * и без сброса сообщения клиента уходили бы ему, а не тому, у кого теперь лид.
 */
export async function talkFollowsLead(leadId: string, staffId: string): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("prospects")
    .update({ claimed_by: staffId, handled_by: null })
    .eq("lead_id", leadId)
    .in("status", [...LIVE_TALK])
    .or(`claimed_by.is.null,claimed_by.neq.${staffId}`)
    .select("host");
  if (error) {
    console.error("касания: переписка не пошла за лидом", error.message);
    return null;
  }
  return data?.length ? String(data[0].host) : null;
}
