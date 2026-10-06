import { AUTOPILOT_SENDER, nicheLabel, replyHeading } from "@/lib/admin/autopilot";
import { leadCard, routeNewLead } from "@/lib/admin/lead-queue-store";
import { salesRecipients } from "@/lib/qualify/brief";
import { esc } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Ответ на касание автопрогона — команде, сразу.
 *
 * Владелец, 05.10.2026: «Лидов, которые ответят на сообщения от тебя на
 * наших аккаунтах, — закидывай сразу через тг бота к менеджерам, чтобы
 * взяли в работу».
 *
 * Касание автопрогона ничьё: писал не человек. Лид поэтому заводится не при
 * отправке, как у менеджера, а на первом ответе клиента, — и сразу идёт в
 * очередь на тёплые лиды, как заявка с сайта: днём одному на полчаса, по
 * очереди, ночью всем с равной долей (lib/admin/lead-queue-store). Через
 * очередь, а не «всем, кто первый нажал», — правило владельца о тёплых
 * лидах: иначе их снова забирал бы один, самый быстрый.
 *
 * Модуль лёгкий намеренно: его зовёт скаут, принимая входящее
 * (outreach-talk-store → saveInbound), и тянуть туда аудитор с моделью
 * незачем.
 */

export type AutopilotReply =
  /** Лид заведён и отдан в очередь. */
  | { kind: "routed"; leadId: string }
  /**
   * Лид заведён, но в очередь не отдан: клиент просит прототип, и лид
   * раздаст рассылка «🔥 Нужен прототип» — кто первый взял, того и лид
   * (prototype-claim-store). Не ушла рассылка — отдать в очередь самим.
   */
  | { kind: "held"; leadId: string }
  /** Попросил не писать: лида нет, и звать никого не надо. */
  | { kind: "refused" };

const FIELDS = "id, host, label, target, target_kind, message, findings, request_no, lead_id";

/**
 * Первый ответ на касание автопрогона. null — касание не автопрогона, уже
 * ушло команде или его уже кто-то взял: тогда ответ идёт обычным путём, тому,
 * у кого лид.
 */
export async function routeAutopilotReply(
  prospectId: string,
  body: string,
  verdict: string,
): Promise<AutopilotReply | null> {
  const db = serviceClient();
  if (!db) return null;

  // Отметка — до лида и условно: два входящих подряд (клиент пишет
  // несколькими сообщениями) не заведут два лида.
  const { data: p } = await db
    .from("prospects")
    .update({ autopilot_replied_at: new Date().toISOString() })
    .eq("id", prospectId)
    .not("autopilot_at", "is", null)
    .is("autopilot_replied_at", null)
    .is("claimed_by", null)
    .select(FIELDS)
    .maybeSingle();
  if (!p) return null;

  // «Не пишите больше» — не лид. Модель уже отпущена (saveInbound), а
  // следующее сообщение после такой просьбы — ровно то, за что блокируют
  // аккаунт.
  if (verdict === "stop") return { kind: "refused" };

  const leadId = (p.lead_id as string | null) ?? (await createLead(p, body));
  if (!leadId) return null;

  if (verdict === "proto") return { kind: "held", leadId };
  await offerLead(prospectId, leadId, body);
  return { kind: "routed", leadId };
}

/** Отдать лид автопрогона в очередь на тёплые лиды. */
export async function offerLead(prospectId: string, leadId: string, body: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const card = await leadCard(leadId);
  if (!card) return false;

  const { data: p } = await db.from("prospects").select("host, label, niche").eq("id", prospectId).maybeSingle();
  const heading = replyHeading(
    {
      host: (p?.host as string | null) ?? null,
      label: (p?.label as string | null) ?? null,
      words: body,
      niche: nicheLabel(p?.niche as string | null),
    },
    esc,
  );
  return routeNewLead({ ...card, heading, fallback: await salesRecipients() });
}

async function createLead(p: Record<string, unknown>, body: string): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;

  const host = (p.host as string | null) ?? null;
  const label = (p.label as string | null) ?? null;
  const message = String(p.message ?? "");
  const kind = String(p.target_kind ?? "handle");
  const findings = Array.isArray(p.findings) ? (p.findings as { title?: string }[]) : [];
  const titles = findings.map((f) => String(f.title ?? "")).filter(Boolean);
  const what = host ? `Холодное касание автопрогона по сайту ${host}.${titles.length ? ` Нашли: ${titles.slice(0, 4).join("; ")}.` : ""}` : "Холодное касание автопрогона: компания без сайта.";
  const unknown = "не выяснено — клиент только ответил на первое письмо";

  const { data, error } = await db
    .from("leads")
    .insert({
      source: "outreach",
      request_no: (p.request_no as string | null) ?? null,
      locale: "ru",
      contact_name: label ?? host ?? "без имени",
      company: label,
      contact_handle: p.target ?? null,
      contact_kind: kind === "handle" ? "telegram" : "phone",
      niche: label ?? host ?? "",
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
      priority: "warm",
      breakdown: {},
      summary: {
        client: label ?? host ?? "без имени",
        request: `${what} Клиент ответил: «${body.replace(/\s+/g, " ").trim().slice(0, 300)}».`,
        niche: label ?? host ?? "",
        expertise: unknown,
        budget: unknown,
        authority: unknown,
        need: unknown,
        timing: unknown,
      },
      notes: `Первое письмо отправил автопрогон с рабочего аккаунта студии (подпись «${AUTOPILOT_SENDER}»):\n\n${message}\n\nОтвет клиента:\n\n${body.slice(0, 2000)}`,
      opening_line: message,
      already_told: [host ? `Разобрали сайт ${host}` : "Написали первыми", ...titles.slice(0, 3)],
      avoid_asking: [],
      transcript: [
        { role: "assistant", content: message },
        { role: "user", content: body.slice(0, 4000) },
      ],
      status: "new",
    })
    .select("id")
    .maybeSingle();
  if (error || !data) {
    console.error("автопрогон: не завёл лид", error?.message);
    return null;
  }

  const leadId = String(data.id);
  // Лид — к касанию и к ленте переписки: по нему карточка лида показывает
  // разговор, а взятие лида переносит разговор на взявшего
  // (talk-follows-lead).
  await db.from("prospects").update({ lead_id: leadId }).eq("id", p.id as string);
  await db.from("outreach_messages").update({ lead_id: leadId }).eq("prospect_id", p.id as string).is("lead_id", null);
  return leadId;
}
