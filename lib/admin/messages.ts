import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";
import { siteUrl } from "@/lib/seo";

export const MAX_BODY = 4000;

export type LeadMessage = {
  id: string;
  created_at: string;
  body: string;
  edited_at: string | null;
  author_staff_id: string;
  author_name: string;
  author_role: string;
};

/**
 * Обсуждение лида.
 *
 * Читают все сотрудники, а не только владелец, и это не недосмотр. Ветка,
 * закрытая от остальных, ничем не отличается от личной переписки — а
 * отличаться она должна именно этим. Заодно это и есть защита от увода
 * клиента: договорённость, видимая всей команде, перестаёт быть тихой.
 */
export async function messagesFor(leadId: string): Promise<LeadMessage[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("lead_messages")
    .select("id, created_at, body, edited_at, author_staff_id, staff(display_name, role)")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("admin: не прочитал обсуждение", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    // PostgREST отдаёт связанную запись объектом или массивом в зависимости
    // от того, как он вывел кардинальность связи. Разбираем оба вида, иначе
    // имя автора молча превращается в «—» при первом же изменении схемы.
    const joined = row.staff as unknown;
    const author = (Array.isArray(joined) ? joined[0] : joined) as
      | { display_name?: string; role?: string }
      | null
      | undefined;

    return {
      id: row.id as string,
      created_at: row.created_at as string,
      body: row.body as string,
      edited_at: (row.edited_at as string | null) ?? null,
      author_staff_id: row.author_staff_id as string,
      author_name: author?.display_name ?? "бывший сотрудник",
      author_role: author?.role ?? "manager",
    };
  });
}

export async function postMessage(
  leadId: string,
  staff: Staff,
  body: string,
  ip: string,
): Promise<boolean> {
  const text = body.trim().slice(0, MAX_BODY);
  if (!text) return false;

  const db = serviceClient();
  if (!db) return false;

  const { error } = await db.from("lead_messages").insert({
    lead_id: leadId,
    author_staff_id: staff.id,
    body: text,
  });

  if (error) {
    console.error("admin: не записал сообщение", error.message);
    return false;
  }

  await record("message.posted", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: leadId,
    ip,
  });

  await notifyOwner(leadId, staff, text);
  return true;
}

/**
 * Владелец лида узнаёт о сообщении в личке.
 *
 * Без этого чат мёртв: писать туда, где не отвечают, никто не станет, и все
 * вернутся в личные телеграмы — то есть ровно к тому, от чего уходили.
 * Автору себя не уведомляем.
 */
async function notifyOwner(leadId: string, author: Staff, text: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  const { data: lead } = await db
    .from("leads")
    .select("assigned_staff_id, request_no, company, contact_name")
    .eq("id", leadId)
    .maybeSingle();

  const ownerId = lead?.assigned_staff_id as string | null | undefined;
  if (!ownerId || ownerId === author.id) return;

  const { data: owner } = await db
    .from("staff")
    .select("telegram_user_id, is_active")
    .eq("id", ownerId)
    .maybeSingle();

  if (!owner?.is_active) return;

  const number =
    (lead?.request_no as string | null) ??
    (lead?.company as string | null) ??
    (lead?.contact_name as string | null) ??
    leadId.slice(0, 8);

  await sendMessage(
    owner.telegram_user_id as number,
    [
      `<b>${esc(author.display_name)}</b> пишет по лиду <b>${esc(String(number))}</b>`,
      "",
      esc(text.slice(0, 500)),
      "",
      `${siteUrl}/admin/leads/${leadId}`,
    ].join("\n"),
  );
}
