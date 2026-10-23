import { wants } from "@/lib/admin/notify-prefs";
import { messageWindow } from "@/lib/admin/tasks";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import type { ChatMessage } from "@/lib/qualify/types";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Клиент бота дописал после того, как лид взяли, — слова клиента тому, за кем лид.
 *
 * Владелец, 23.10.2026, про лид FloraEdu Global (DZ-1022-DJ79): «запиши его на
 * меня… Уведомления по этому клиенту приходят мне, проверь». До этого после
 * брифа клиенту в боте отвечала только модель, а хозяин лида о новых
 * сообщениях не узнавал: переписка жила в памяти процесса. Теперь каждое
 * сообщение клиента уходит хозяину строкой со ссылкой на карточку, а
 * переписка дописывается в лид — её видно в карточке.
 *
 * Лид ищется по нику Telegram, а не по сессии: сессия живёт в памяти и
 * теряется при перезапуске, а ник — в лиде. Ночью (21:00–08:00) строки нет —
 * правило «Ночью бот молчит»; переписка в карточке всё равно дописывается.
 * Галочка «Ответы клиентов на касания» снята — строки нет.
 */

/** Сколько дней лид считается тем же разговором. */
export const OWNER_LEAD_DAYS = 30;

export function ownerNotice(input: { label: string; requestNo: string | null; leadId: string; text: string }): string {
  const no = input.requestNo ? ` · ${esc(input.requestNo)}` : "";
  return [
    `💬 <b>Клиент написал в бот</b> · ${esc(input.label)}${no}`,
    `«${esc(input.text.replace(/\s+/g, " ").trim().slice(0, 700))}»`,
    "",
    `Карточка и переписка: ${siteUrl}/admin/leads/${input.leadId}`,
  ].join("\n");
}

export async function tellLeadOwner(
  input: {
    username: string | null | undefined;
    text: string;
    history: readonly ChatMessage[];
    /** Кому слова клиента уже ушли «📩 Обращением в бота» — второй строки нет. */
    skipChats?: ReadonlySet<number>;
  },
  now: Date = new Date(),
): Promise<boolean> {
  const username = (input.username ?? "").replace(/^@/, "").trim();
  if (!username || !input.text.trim()) return false;
  const db = serviceClient();
  if (!db) return false;

  const since = new Date(now.getTime() - OWNER_LEAD_DAYS * 24 * 3600_000).toISOString();
  const { data: lead } = await db
    .from("leads")
    .select("id, request_no, company, contact_name, assigned_staff_id, status")
    .ilike("tg_username", username)
    .not("assigned_staff_id", "is", null)
    .in("status", ["taken", "new"])
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lead?.assigned_staff_id) return false;

  // Переписка — в карточку: хозяин лида читает её в панели.
  await db.from("leads").update({ transcript: input.history }).eq("id", lead.id);

  if (!messageWindow(now)) return false;
  const { data: staff } = await db
    .from("staff")
    .select("telegram_user_id, notify_off")
    .eq("id", lead.assigned_staff_id)
    .eq("is_active", true)
    .maybeSingle();
  const chat = Number(staff?.telegram_user_id);
  if (!Number.isFinite(chat) || chat === 0) return false;
  if (input.skipChats?.has(chat)) return false;
  if (!wants((staff?.notify_off as string[] | null) ?? [], "talks")) return false;

  return sendMessage(
    chat,
    ownerNotice({
      label: String(lead.company || lead.contact_name || lead.request_no || "клиент"),
      requestNo: (lead.request_no as string | null) ?? null,
      leadId: String(lead.id),
      text: input.text,
    }),
  );
}
