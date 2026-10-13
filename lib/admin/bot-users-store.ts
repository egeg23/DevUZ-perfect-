import { record } from "@/lib/admin/audit";
import { GIVE_UP_H, sendableNow, sendsBroadcasts, textProblem, type TextProblem } from "@/lib/admin/broadcast";
import {
  GAP_MS,
  MAX_ATTEMPTS,
  PASS_CAP,
  audienceOf,
  tallyOf,
  userMessage,
  type BotUser,
  type Marks,
  type Segment,
  type UserOutcome,
  type UserTally,
} from "@/lib/admin/bot-users";
import type { Staff } from "@/lib/admin/session";
import { sendBroadcastMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Пользователи бота и рассылка им — база и Telegram (правила —
 * lib/admin/bot-users.ts). Без модели: свой текст напрямую в Bot API.
 */

type From = { id?: number; is_bot?: boolean; username?: string; first_name?: string; last_name?: string; language_code?: string };

/**
 * Человек сам написал боту в личку или нажал кнопку — запомнить его. Снова
 * написал после блокировки — значит, разблокировал: отметку снимаем.
 */
export async function noteBotUser(from: From | undefined, chatType: string | undefined, now: Date = new Date()): Promise<void> {
  if (!from?.id || from.is_bot || chatType !== "private") return;
  const db = serviceClient();
  if (!db) return;
  await db.from("bot_users").upsert(
    {
      chat_id: from.id,
      username: from.username ?? null,
      first_name: from.first_name?.slice(0, 120) ?? null,
      last_name: from.last_name?.slice(0, 120) ?? null,
      language_code: from.language_code?.slice(0, 10) ?? null,
      last_at: now.toISOString(),
      blocked_at: null,
    },
    { onConflict: "chat_id" },
  );
}

const nums = (rows: unknown, key: string) =>
  new Set(((rows as Record<string, unknown>[] | null) ?? []).map((r) => Number(r[key])).filter((n) => Number.isFinite(n) && n !== 0));

/** Все пользователи бота и отметки: кто сотрудник, партнёр, покупатель. */
export async function loadBotAudience(): Promise<{ users: BotUser[]; marks: Marks }> {
  const db = serviceClient();
  const empty = { users: [], marks: { staff: new Set<number>(), partners: new Set<number>(), buyers: new Set<number>() } };
  if (!db) return empty;
  const [{ data: users }, { data: staff }, { data: partners }, { data: buyers }] = await Promise.all([
    db.from("bot_users").select("chat_id, username, first_name, blocked_at").limit(20000),
    // Сотрудники — все, и бывшие тоже: рассылка клиентам не должна приходить своим.
    db.from("staff").select("telegram_user_id").limit(1000),
    db.from("partners").select("telegram_user_id").eq("status", "active").not("telegram_user_id", "is", null).limit(5000),
    db.from("orders").select("buyer_chat_id").not("buyer_chat_id", "is", null).limit(10000),
  ]);
  return {
    users: ((users ?? []) as BotUser[]).map((u) => ({ ...u, chat_id: Number(u.chat_id) })),
    marks: { staff: nums(staff, "telegram_user_id"), partners: nums(partners, "telegram_user_id"), buyers: nums(buyers, "buyer_chat_id") },
  };
}

export type CreateUserBroadcast =
  | { ok: true; id: string; recipients: number }
  | { ok: false; reason: "forbidden" | "offline" | "nobody" | "changed" | "failed" | TextProblem };

export async function createUserBroadcast(
  input: { text: string; segment: Segment; sendAt: Date; nightOk: boolean; expected: number },
  actor: Staff,
  ip: string,
): Promise<CreateUserBroadcast> {
  if (!sendsBroadcasts(actor.role)) return { ok: false, reason: "forbidden" };
  const problem = textProblem(input.text);
  if (problem) return { ok: false, reason: problem };
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  const { users, marks } = await loadBotAudience();
  const chats = audienceOf(users, marks, input.segment).map((u) => u.chat_id);
  if (!chats.length) return { ok: false, reason: "nobody" };
  if (chats.length !== input.expected) return { ok: false, reason: "changed" };

  const { data, error } = await db
    .from("staff_broadcasts")
    .insert({
      kind: "users",
      author_id: actor.id,
      text: input.text.trim(),
      audience: "users",
      segment: input.segment,
      chats,
      send_at: input.sendAt.toISOString(),
      night_ok: input.nightOk,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("рассылка пользователям: не записалась", error?.message);
    return { ok: false, reason: "failed" };
  }
  const id = String(data.id);
  await record("broadcast.created", {
    actorStaffId: actor.id,
    targetType: "broadcast",
    targetId: id,
    ip,
    meta: { kind: "users", segment: input.segment, recipients: chats.length, send_at: input.sendAt.toISOString(), text: input.text.trim().slice(0, 200) },
  });
  return { ok: true, id, recipients: chats.length };
}

type Row = { id: string; text: string; chats: (number | string)[]; send_at: string; night_ok: boolean };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Разослать пользователям то, чему пришло время: порциями, не быстрее
 * PER_SECOND в секунду и не больше PASS_CAP за проход. 403 — человек
 * заблокировал бота: отмечаем и больше ему не пишем. Сбой — повтор
 * следующим проходом, до MAX_ATTEMPTS раз.
 */
export async function sendUserBroadcasts(now: Date = new Date(), onlyId?: string): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  let query = db
    .from("staff_broadcasts")
    .select("id, text, chats, send_at, night_ok")
    .eq("kind", "users")
    .is("cancelled_at", null)
    .is("done_at", null)
    .lte("send_at", now.toISOString())
    .order("send_at", { ascending: true })
    .limit(5);
  if (onlyId) query = query.eq("id", onlyId);
  const { data } = await query;
  let budget = PASS_CAP;
  let sent = 0;

  for (const b of (data ?? []) as Row[]) {
    if (Date.parse(b.send_at) < now.getTime() - GIVE_UP_H * 3600_000) {
      await db.from("staff_broadcasts").update({ done_at: now.toISOString() }).eq("id", b.id).is("done_at", null);
      continue;
    }
    if (!sendableNow(now, b.night_ok)) continue;

    const { data: rows } = await db.from("bot_broadcast_sent").select("chat_id, status, attempts").eq("broadcast_id", b.id).limit(20000);
    const seen = new Map(((rows ?? []) as { chat_id: number; status: UserOutcome; attempts: number }[]).map((r) => [Number(r.chat_id), r]));
    const todo = b.chats
      .map(Number)
      .filter((chat) => {
        const row = seen.get(chat);
        return !row || (row.status === "failed" && row.attempts < MAX_ATTEMPTS);
      });
    const text = userMessage(b.text);

    for (const chat of todo) {
      if (budget <= 0) break;
      const row = seen.get(chat);
      // Отметка — до сообщения: два прохода не напишут одному дважды.
      const claim = row
        ? await db
            .from("bot_broadcast_sent")
            .update({ status: "sending", attempts: row.attempts + 1, at: now.toISOString() })
            .eq("broadcast_id", b.id)
            .eq("chat_id", chat)
            .eq("status", "failed")
            .eq("attempts", row.attempts)
            .select("chat_id")
        : await db
            .from("bot_broadcast_sent")
            .upsert({ broadcast_id: b.id, chat_id: chat }, { onConflict: "broadcast_id,chat_id", ignoreDuplicates: true })
            .select("chat_id");
      if (!claim.data?.length) continue;
      budget -= 1;
      const outcome = await sendBroadcastMessage(chat, text);
      await db.from("bot_broadcast_sent").update({ status: outcome, at: new Date().toISOString() }).eq("broadcast_id", b.id).eq("chat_id", chat);
      if (outcome === "sent") sent += 1;
      if (outcome === "blocked") await db.from("bot_users").update({ blocked_at: new Date().toISOString() }).eq("chat_id", chat);
      await sleep(GAP_MS);
    }
    if (budget > 0) {
      // Каждому — исход: дошло, заблокировал или попытки кончились. Тогда закрываем.
      const { data: after } = await db.from("bot_broadcast_sent").select("status, attempts").eq("broadcast_id", b.id).limit(20000);
      const tally = tallyOf(b.chats.length, (after ?? []) as { status: UserOutcome; attempts: number }[]);
      if (tally.pending === 0) await db.from("staff_broadcasts").update({ done_at: now.toISOString() }).eq("id", b.id).is("done_at", null);
    }
    if (budget <= 0) break;
  }
  return sent;
}

/** Итоги рассылок пользователям: дошло, не дошло, заблокировал бота. */
export async function userTallies(items: readonly { id: string; total: number }[]): Promise<Map<string, UserTally>> {
  const out = new Map<string, UserTally>();
  const db = serviceClient();
  if (!db || !items.length) return out;
  const { data } = await db
    .from("bot_broadcast_sent")
    .select("broadcast_id, status, attempts")
    .in(
      "broadcast_id",
      items.map((i) => i.id),
    )
    .limit(50000);
  const rows = (data ?? []) as { broadcast_id: string; status: UserOutcome; attempts: number }[];
  for (const item of items) out.set(item.id, tallyOf(item.total, rows.filter((r) => r.broadcast_id === item.id)));
  return out;
}
