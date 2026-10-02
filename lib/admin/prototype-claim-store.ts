import { record } from "@/lib/admin/audit";
import { PROTOTYPE_HOURS } from "@/lib/admin/outreach";
import { wants } from "@/lib/admin/notify-prefs";
import { createReminder, handleOf } from "@/lib/admin/ownership";
import {
  PROTO_BUTTON,
  PROTO_FIRST_MINUTES,
  protoAnnounceText,
  protoBroadcastDue,
  protoCallback,
  protoDeadline,
  protoFirstText,
} from "@/lib/admin/prototype-claim";
import type { Staff } from "@/lib/admin/session";
import { messageWindow } from "@/lib/admin/tasks";
import { talkFollowsLead } from "@/lib/admin/talk-follows-lead";
import { esc, sendRowsForId } from "@/lib/qualify/telegram";
import type { Notice } from "@/lib/qualify/notices";
import { serviceClient } from "@/lib/supabase";

/**
 * «Хотят прототип» — рассылка всей команде и взятие первым. База и Telegram;
 * тексты — в prototype-claim.
 */

/**
 * Клиент попросил прототип — первый шаг: автору касания.
 *
 * Один раз на касание: условие `proto_requested_at is null` стоит в update,
 * и второе «да, соберите» того же клиента вторую рассылку не запускает.
 * Возвращает null, если просьба уже была, — тогда звать надо того, у кого
 * лид сейчас, как с любым ответом.
 *
 * Первые PROTO_FIRST_MINUTES прототип только у автора касания: клиент
 * отвечает на его письмо. Не взял — свип отдаёт всем (broadcastDuePrototypes).
 * Автору не дозвониться (нет Telegram, сообщение не ушло) — ждать нечего,
 * и прототип сразу уходит всем.
 */
export async function announcePrototype(prospectId: string, words: string): Promise<{ sent: number } | null> {
  const db = serviceClient();
  if (!db) return null;

  const requestedAt = new Date();
  const { data: prospect } = await db
    .from("prospects")
    .update({ proto_requested_at: requestedAt.toISOString(), proto_words: words.slice(0, 2000) })
    .eq("id", prospectId)
    .is("proto_requested_at", null)
    .select("id, host, claimed_by")
    .maybeSingle();
  if (!prospect) return null;

  const { data: author } = prospect.claimed_by
    ? await db
        .from("staff")
        .select("telegram_user_id")
        .eq("id", prospect.claimed_by)
        .eq("is_active", true)
        .maybeSingle()
    : { data: null };

  const chat = Number(author?.telegram_user_id);
  const id =
    Number.isFinite(chat) && chat !== 0
      ? await sendRowsForId(chat, protoFirstText({ host: String(prospect.host), words, requestedAt }, esc), button(prospectId))
      : null;

  if (!id) {
    // Автору не дошло — полчаса ждать некого.
    return { sent: await broadcastPrototype(prospectId) };
  }
  await saveNotices(prospectId, [{ chatId: String(chat), messageId: id }]);
  return { sent: 1 };
}

const button = (prospectId: string) => [[{ text: PROTO_BUTTON, callback_data: protoCallback(prospectId) }]];

async function saveNotices(prospectId: string, add: readonly Notice[]): Promise<void> {
  const db = serviceClient();
  if (!db || !add.length) return;
  const { data } = await db.from("prospects").select("proto_notices").eq("id", prospectId).maybeSingle();
  const had = Array.isArray(data?.proto_notices) ? (data.proto_notices as Notice[]) : [];
  const { error } = await db.from("prospects").update({ proto_notices: [...had, ...add] }).eq("id", prospectId);
  if (error) console.error("прототип: не запомнил копии рассылки", error.message);
}

/**
 * Второй шаг — «🔥 Нужен прототип — бери срочно» всей команде.
 *
 * Один раз: `proto_broadcast_at is null` — в update, и только пока никто не
 * взял. Кому: всем активным с галочкой «Заявки для всех», кроме автора
 * касания — у него кнопка уже есть и по-прежнему работает.
 */
export async function broadcastPrototype(prospectId: string): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;

  const { data: prospect } = await db
    .from("prospects")
    .update({ proto_broadcast_at: new Date().toISOString() })
    .eq("id", prospectId)
    .is("proto_broadcast_at", null)
    .is("proto_taken_by", null)
    .select("id, host, claimed_by, proto_words")
    .maybeSingle();
  if (!prospect) return 0;

  const { data: staff } = await db
    .from("staff")
    .select("id, telegram_user_id, notify_off")
    .eq("is_active", true)
    .limit(200);

  const text = protoAnnounceText({ host: String(prospect.host), words: String(prospect.proto_words ?? "") }, esc);
  const readers = (staff ?? []).filter(
    (s) => s.id !== prospect.claimed_by && wants(s.notify_off as string[] | null, "open"),
  );

  const notices: Notice[] = [];
  await Promise.all(
    readers.map(async (s) => {
      const chat = Number(s.telegram_user_id);
      if (!Number.isFinite(chat) || chat === 0) return;
      const id = await sendRowsForId(chat, text, button(prospectId));
      if (id) notices.push({ chatId: String(chat), messageId: id });
    }),
  );
  await saveNotices(prospectId, notices);
  return notices.length;
}

/**
 * Свип: прототипы, которые автор касания не взял за полчаса, — всем.
 *
 * Только с 07:00 до 23:00 по Ташкенту, как задачи команды: «бери срочно» в
 * три часа ночи будит, а не помогает. Попросил ночью — уйдёт в 07:00.
 */
export async function broadcastDuePrototypes(now: Date = new Date()): Promise<number> {
  if (!messageWindow(now)) return 0;
  const db = serviceClient();
  if (!db) return 0;

  const { data } = await db
    .from("prospects")
    .select("id, proto_requested_at")
    .not("proto_requested_at", "is", null)
    .is("proto_broadcast_at", null)
    .is("proto_taken_by", null)
    .lte("proto_requested_at", new Date(now.getTime() - PROTO_FIRST_MINUTES * 60_000).toISOString())
    .limit(20);

  let sent = 0;
  for (const row of data ?? []) {
    if (!protoBroadcastDue(new Date(String(row.proto_requested_at)), now)) continue;
    sent += await broadcastPrototype(String(row.id));
  }
  return sent;
}

export type ProtoTake =
  | {
      ok: true;
      host: string;
      leadId: string | null;
      deadline: Date;
      notices: Notice[];
      /** Кто вёл касание до этого — ему сказать, что лид ушёл. null — он же и взял. */
      previous: string | null;
    }
  | { ok: false; reason: "taken"; by: string | null }
  | { ok: false; reason: "early" | "gone" | "failed" };

/**
 * Взять прототип: первый нажавший получает лид и переписку.
 *
 * Условие `proto_taken_by is null` — в самом update, как у «Взять в работу»:
 * двое, нажавшие одновременно, — обычное дело в первую минуту, и «прочитать,
 * потом записать» отдало бы лида обоим. Лид переходит к нажавшему, даже если
 * касание писал другой: владелец так и сказал — «кто успеет взять, того и
 * лид». Касание автору при этом остаётся засчитанным: оно считается по
 * `touched_by`, а он не меняется.
 */
export async function takePrototype(prospectId: string, staff: Staff): Promise<ProtoTake> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "failed" };

  const now = new Date();
  const claim = db
    .from("prospects")
    .update({ proto_taken_by: staff.id, proto_taken_at: now.toISOString() })
    .eq("id", prospectId)
    .is("proto_taken_by", null)
    .not("proto_requested_at", "is", null);
  // Первые полчаса — только автор касания (и владелец: он вне очереди, как
  // и с обычными лидами). После рассылки — любой.
  const { data: won, error } = await (staff.role === "admin"
    ? claim
    : claim.or(`proto_broadcast_at.not.is.null,claimed_by.eq.${staff.id}`)
  )
    .select("host, lead_id, claimed_by, proto_notices")
    .maybeSingle();
  if (error) {
    console.error("прототип: не взял", error.message);
    return { ok: false, reason: "failed" };
  }

  if (!won) {
    const { data: row } = await db
      .from("prospects")
      .select("proto_taken_by, proto_requested_at")
      .eq("id", prospectId)
      .maybeSingle();
    if (!row || !row.proto_requested_at) return { ok: false, reason: "gone" };
    if (!row.proto_taken_by) return { ok: false, reason: "early" };
    const { data: who } = row.proto_taken_by
      ? await db.from("staff").select("username, display_name").eq("id", row.proto_taken_by).maybeSingle()
      : { data: null };
    return {
      ok: false,
      reason: "taken",
      by: who ? (who.username ? `@${who.username}` : String(who.display_name)) : null,
    };
  }

  const leadId = (won.lead_id as string | null) ?? null;
  if (leadId) {
    const { error: leadError } = await db
      .from("leads")
      .update({ assigned_staff_id: staff.id, assigned_to: handleOf(staff), assigned_at: now.toISOString(), status: "taken" })
      .eq("id", leadId);
    if (leadError) console.error("прототип: лид не перешёл", leadError.message);
    // Переписка идёт за лидом: ответы клиента и дожим — тому, кто собирает.
    await talkFollowsLead(leadId, staff.id);
  } else {
    await db.from("prospects").update({ claimed_by: staff.id, handled_by: null }).eq("id", prospectId);
  }

  const deadline = protoDeadline(now);
  await record("lead.prototype_taken", {
    actorStaffId: staff.id,
    targetType: leadId ? "lead" : "prospect",
    targetId: leadId ?? prospectId,
    ip: null,
    meta: { via: "telegram", host: won.host, from: won.claimed_by, deadline: deadline.toISOString() },
  });

  // Напоминание за два часа до срока: успеть, а не узнать о сроке, когда он
  // прошёл.
  if (leadId) {
    await createReminder(leadId, staff, {
      dueAt: new Date(deadline.getTime() - 2 * 3600_000).toISOString(),
      kind: "auto",
      note: `Прототип для ${won.host} — обещали за ${PROTOTYPE_HOURS} часов, срок через 2 часа`,
    });
  }

  const notices = Array.isArray(won.proto_notices) ? (won.proto_notices as Notice[]) : [];
  return {
    ok: true,
    host: String(won.host),
    leadId,
    deadline,
    notices,
    previous: won.claimed_by && won.claimed_by !== staff.id ? String(won.claimed_by) : null,
  };
}
