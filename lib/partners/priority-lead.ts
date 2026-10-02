import { record } from "@/lib/admin/audit";
import { isWorkingHours } from "@/lib/admin/lead-queue";
import { leadCard } from "@/lib/admin/lead-queue-store";
import { contactKey } from "@/lib/partners/rules";
import type { Partner, PartnerClient } from "@/lib/partners/store";
import { newRequestNo } from "@/lib/qualify/engine";
import { esc, sendLead } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Клиент, закреплённый партнёром, — сразу лидом, и приоритетным.
 *
 * Владелец, 02.10: «Сразу лидом, причём он идёт с уведомлением всем
 * менеджерам. Эти лиды идут всегда вверху списка лидов и выделены цветом +
 * в тг идёт постоянное уведомление, пока его кто-то не возьмёт, они
 * приоритет».
 *
 * Поэтому такой лид:
 * - мимо очереди — открыт всем сразу, берёт первый, кто нажмёт;
 * - карточка уходит всем менеджерам и руководителям, копия — владельцу;
 * - пока ничей — наверху списка лидов (leads.partner_pin, миграция 0077) и
 *   выделен цветом;
 * - пока ничей — свип в рабочее время напоминает команде каждые
 *   PRIORITY_PING_MINUTES минут той же карточкой с кнопкой «Взять».
 *
 * В карточке — всё, что дал партнёр: название, ИНН, контактное лицо,
 * телефон или Telegram, сайт и что нужно клиенту. Проект менеджер
 * заводит из лида, как обычно, — партнёр и закрепление переходят в него сами.
 */

export const PRIORITY_SOURCE = "partner";
export const PRIORITY_PING_MINUTES = 15;
/** Дольше недели ничей — напоминать бессмысленно: это уже вопрос к владельцу, а не к звонку. */
export const PRIORITY_PING_DAYS = 7;

export const PRIORITY_HEADING = `🤝 <b>Приоритет: клиента привёл партнёр.</b> Лид открыт всем — берёт первый, кто нажмёт. Свяжитесь сегодня. Пока его никто не взял, бот напоминает каждые ${PRIORITY_PING_MINUTES} минут.`;

export function reminderHeading(minutes: number): string {
  const ago = minutes >= 120 ? `${Math.floor(minutes / 60)} ч` : `${minutes} мин`;
  return `⏰ <b>Клиент от партнёра всё ещё ничей — ${ago}.</b> Он приоритетный: возьмите кнопкой ниже.`;
}

/** Пора ли напомнить: рабочее время, лиду не больше недели, с прошлого раза прошло 15 минут. */
export function pingDue(lead: { created_at: string; partner_ping_at: string | null }, now: Date): boolean {
  if (!isWorkingHours(now)) return false;
  if (now.getTime() - Date.parse(lead.created_at) > PRIORITY_PING_DAYS * 86_400_000) return false;
  const last = Date.parse(lead.partner_ping_at ?? lead.created_at);
  return now.getTime() - last >= PRIORITY_PING_MINUTES * 60_000;
}

/** Кому идёт приоритетный лид: менеджеры и руководители с Telegram; владельцу — `withOwner`. */
async function teamChats(withOwner: boolean): Promise<string[]> {
  const db = serviceClient();
  if (!db) return [];
  const roles = withOwner ? ["manager", "head", "admin"] : ["manager", "head"];
  const { data } = await db.from("staff").select("telegram_user_id").eq("is_active", true).in("role", roles);
  return [...new Set((data ?? []).map((r) => r.telegram_user_id).filter((id): id is number => typeof id === "number").map(String))];
}

/**
 * Завести лид из закрепления партнёра и разослать команде. Возвращает id
 * лида или `null`, если база не записала, — закрепление при этом остаётся.
 */
export async function createPartnerLead(partner: Partner, client: PartnerClient, now: Date = new Date()): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;

  const phone = client.phone?.trim() || null;
  const telegram = client.telegram?.trim() || null;
  const handle = phone ?? (telegram ? `@${contactKey(telegram)}` : null);
  const need = client.note?.trim() || null;
  const requestNo = newRequestNo(now);
  const unknown = "не выяснено — разговора ещё не было";

  const { data, error } = await db
    .from("leads")
    .insert({
      source: PRIORITY_SOURCE,
      request_no: requestNo,
      locale: "ru",
      contact_name: client.contact_name?.trim() || client.name,
      company: client.name,
      contact_handle: handle,
      contact_kind: phone ? "phone" : telegram ? "telegram" : null,
      tg_username: telegram ? contactKey(telegram) : null,
      client_inn: client.inn,
      niche: need ? need.slice(0, 120) : client.name,
      niche_tier: 3,
      expertise: "medium",
      services: ["web-development"],
      budget: "B3",
      authority: "A3",
      need: "N3",
      timing: "T3",
      intent: "exploring",
      score: 0,
      grade: "D",
      // Оценки ещё нет — разговора не было, — но клиент тёплый: его привёл
      // партнёр, который за него поручился. Поэтому «горячий».
      priority: "hot",
      breakdown: {},
      summary: {
        client: client.name,
        request: need ?? "партнёр не написал, что нужно клиенту — спросите при первом разговоре",
        niche: unknown,
        expertise: unknown,
        budget: unknown,
        authority: unknown,
        need: need ?? unknown,
        timing: unknown,
      },
      notes: [
        "Клиента закрепил партнёр в своём кабинете — пишем ему первыми.",
        need ? `Что нужно: ${need}` : null,
        client.inn ? `ИНН: ${client.inn}` : null,
        client.contact_name ? `Контактное лицо: ${client.contact_name}` : null,
        phone ? `Телефон: ${phone}` : null,
        telegram ? `Telegram: ${telegram}` : null,
        client.website ? `Сайт: ${client.website}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      opening_line: null,
      already_told: [],
      avoid_asking: [],
      transcript: [],
      status: "new",
      // Мимо очереди: открыт всем сразу.
      queue_opened_at: now.toISOString(),
      partner_ping_at: now.toISOString(),
      partner_id: partner.id,
      partner_code: partner.code,
      partner_model: partner.payout_model,
      partner_client_id: client.id,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("partners: не завёл лид из закрепления", error?.message);
    return null;
  }
  const leadId = String(data.id);

  // Лид есть — срок закрепления (12 месяцев) идёт с него.
  await db.from("partner_clients").update({ first_lead_at: now.toISOString() }).eq("id", client.id).is("first_lead_at", null);

  await record("partner.client_lead", {
    targetType: "lead",
    targetId: leadId,
    meta: { client_id: client.id, partner_id: partner.id },
  });

  const card = await leadCard(leadId);
  if (card) {
    await sendLead(card.lead, leadId, card.requestNo, {
      to: await teamChats(true),
      heading: PRIORITY_HEADING,
      origin: card.origin,
    });
  }
  return leadId;
}

/**
 * Свип: напомнить о ничьих лидах от партнёра. Сначала условная отметка
 * времени — два прохода разом не напомнят дважды, — потом карточка.
 */
export async function pingPriorityLeads(now: Date = new Date()): Promise<number> {
  const db = serviceClient();
  if (!db || !isWorkingHours(now)) return 0;
  const { data } = await db
    .from("leads")
    .select("id, created_at, partner_ping_at")
    .eq("partner_pin", true)
    .gte("created_at", new Date(now.getTime() - PRIORITY_PING_DAYS * 86_400_000).toISOString())
    .limit(50);
  let sent = 0;
  for (const lead of (data ?? []) as { id: string; created_at: string; partner_ping_at: string | null }[]) {
    if (!pingDue(lead, now)) continue;
    const before = new Date(now.getTime() - PRIORITY_PING_MINUTES * 60_000).toISOString();
    const { data: marked } = await db
      .from("leads")
      .update({ partner_ping_at: now.toISOString() })
      .eq("id", lead.id)
      .eq("partner_pin", true)
      .or(`partner_ping_at.is.null,partner_ping_at.lte.${before}`)
      .select("id")
      .maybeSingle();
    if (!marked) continue;
    const card = await leadCard(lead.id);
    if (!card || !card.free) continue;
    const minutes = Math.round((now.getTime() - Date.parse(lead.created_at)) / 60_000);
    await sendLead(card.lead, lead.id, card.requestNo, {
      to: await teamChats(false),
      heading: reminderHeading(minutes),
      origin: card.origin,
    });
    sent += 1;
  }
  return sent;
}

/** Партнёру — что клиент уже у менеджеров. Без контактов: они его. */
export function partnerLeadNotice(client: Pick<PartnerClient, "name">, until: string): string {
  return `🧾 Клиент «${esc(client.name)}» закреплён за вами и передан менеджерам — с ним свяжутся в рабочее время. Его заказы засчитываются вам 12 месяцев, до ${until}. Этапы — в кабинете: /cabinet.`;
}
