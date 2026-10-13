import { record } from "@/lib/admin/audit";
import {
  GIVE_UP_H,
  broadcastKey,
  broadcastMessage,
  recipientsOf,
  reachable,
  sendableNow,
  sendsBroadcasts,
  textProblem,
  type Audience,
  type BroadcastPerson,
  type BroadcastRow,
  type TextProblem,
} from "@/lib/admin/broadcast";
import type { Role } from "@/lib/admin/roles";
import type { Staff } from "@/lib/admin/session";
import { sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Рассылка в бот всей команде — база и Telegram. Правила — в
 * lib/admin/broadcast.ts.
 *
 * Доставка как у объявлений (lib/admin/team-news.ts): отметка
 * «broadcast:<id>» в team_news_sent ставится до сообщения и условно
 * (первичный ключ) — два прохода свипа не пришлют одно и то же дважды; не
 * дошло — отметка снимается, и следующий проход попробует снова.
 */

const COLUMNS = "id, created_at, author_id, text, audience, roles, recipients, send_at, night_ok, cancelled_at, done_at";

/** Кому можно разослать: все активные, с отметкой, есть ли у человека Telegram. */
export async function broadcastPeople(): Promise<BroadcastPerson[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("staff")
    .select("id, display_name, role, telegram_user_id")
    .eq("is_active", true)
    .order("display_name", { ascending: true })
    .limit(200);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    display_name: String(r.display_name ?? "—"),
    role: r.role as Role,
    telegram: Boolean(Number(r.telegram_user_id)),
  }));
}

export type CreateBroadcast =
  | { ok: true; id: string; recipients: number; sendAt: string }
  | { ok: false; reason: "forbidden" | "offline" | "nobody" | "changed" | "failed" | TextProblem };

/**
 * Записать рассылку. `expected` — сколько получателей человек видел в
 * предпросмотре: состав поменялся, пока он читал, — не отправляем молча
 * другому числу людей, а просим посмотреть ещё раз.
 */
export async function createBroadcast(
  input: { text: string; audience: Audience; sendAt: Date; nightOk: boolean; expected: number },
  actor: Staff,
  ip: string,
): Promise<CreateBroadcast> {
  if (!sendsBroadcasts(actor.role)) return { ok: false, reason: "forbidden" };
  const problem = textProblem(input.text);
  if (problem) return { ok: false, reason: problem };
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const people = recipientsOf(input.audience, await broadcastPeople(), actor.id);
  const reach = reachable(people);
  if (!reach.length) return { ok: false, reason: "nobody" };
  if (reach.length !== input.expected) return { ok: false, reason: "changed" };

  const { data, error } = await db
    .from("staff_broadcasts")
    .insert({
      author_id: actor.id,
      text: input.text.trim(),
      audience: input.audience.kind,
      roles: input.audience.kind === "roles" ? [...input.audience.roles] : [],
      recipients: reach.map((p) => p.id),
      send_at: input.sendAt.toISOString(),
      night_ok: input.nightOk,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("рассылка: не записалась", error?.message);
    return { ok: false, reason: "failed" };
  }
  const id = String(data.id);
  await record("broadcast.created", {
    actorStaffId: actor.id,
    targetType: "broadcast",
    targetId: id,
    ip,
    meta: {
      audience: input.audience.kind,
      roles: input.audience.kind === "roles" ? input.audience.roles : undefined,
      recipients: reach.length,
      send_at: input.sendAt.toISOString(),
      night_ok: input.nightOk,
      text: input.text.trim().slice(0, 200),
    },
  });
  return { ok: true, id, recipients: reach.length, sendAt: input.sendAt.toISOString() };
}

/** Отменить, пока никому не ушло: автор или владелец (canCancel проверяет вызывающий). */
export async function cancelBroadcast(id: string, actor: Staff, ip: string, now: Date = new Date()): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db
    .from("staff_broadcasts")
    .update({ cancelled_at: now.toISOString(), cancelled_by: actor.id })
    .eq("id", id)
    .is("cancelled_at", null)
    .is("done_at", null)
    .select("id");
  if (!data?.length) return false;
  await record("broadcast.cancelled", { actorStaffId: actor.id, targetType: "broadcast", targetId: id, ip });
  return true;
}

export async function broadcastById(id: string): Promise<BroadcastRow | null> {
  const db = serviceClient();
  if (!db || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await db.from("staff_broadcasts").select(COLUMNS).eq("id", id).maybeSingle();
  return (data as BroadcastRow | null) ?? null;
}

/** Сколько уже дошло — по отметкам. */
export async function deliveredCounts(ids: readonly string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const db = serviceClient();
  if (!db || !ids.length) return out;
  const { data } = await db
    .from("team_news_sent")
    .select("news_id")
    .in(
      "news_id",
      ids.map((id) => broadcastKey(id)),
    )
    .limit(5000);
  for (const row of data ?? []) {
    const id = String(row.news_id).slice("broadcast:".length);
    out.set(id, (out.get(id) ?? 0) + 1);
  }
  return out;
}

export type HistoryItem = BroadcastRow & { authorName: string; delivered: number };

/** Последние рассылки: когда, кто, кому, сколько дошло. */
export async function broadcastHistory(limit = 10): Promise<HistoryItem[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("staff_broadcasts").select(COLUMNS).order("created_at", { ascending: false }).limit(limit);
  const rows = (data ?? []) as BroadcastRow[];
  if (!rows.length) return [];
  const authors = [...new Set(rows.map((r) => r.author_id).filter((x): x is string => Boolean(x)))];
  const [delivered, { data: names }] = await Promise.all([
    deliveredCounts(rows.map((r) => r.id)),
    authors.length ? db.from("staff").select("id, display_name").in("id", authors) : Promise.resolve({ data: [] }),
  ]);
  const nameOf = new Map(((names ?? []) as { id: string; display_name: string }[]).map((n) => [n.id, n.display_name]));
  return rows.map((r) => ({
    ...r,
    authorName: (r.author_id && nameOf.get(r.author_id)) || "—",
    delivered: delivered.get(r.id) ?? 0,
  }));
}

/**
 * Разослать то, чему пришло время. Каждому получателю — один раз; ночью —
 * только с галочкой «отправить и ночью»; не дошло за сутки — сдаёмся.
 * `onlyId` — сразу после отправки из панели: только эту рассылку.
 */
export async function sendBroadcasts(now: Date = new Date(), onlyId?: string): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  let query = db
    .from("staff_broadcasts")
    .select(COLUMNS)
    .is("cancelled_at", null)
    .is("done_at", null)
    .lte("send_at", now.toISOString())
    .order("send_at", { ascending: true })
    .limit(20);
  if (onlyId) query = query.eq("id", onlyId);
  const { data } = await query;
  const due = (data ?? []) as BroadcastRow[];
  if (!due.length) return 0;

  const ids = [...new Set(due.flatMap((b) => b.recipients))];
  const authorIds = [...new Set(due.map((b) => b.author_id).filter((x): x is string => Boolean(x)))];
  const { data: staff } = await db
    .from("staff")
    .select("id, display_name, telegram_user_id, is_active")
    .in("id", [...new Set([...ids, ...authorIds])]);
  const byId = new Map(((staff ?? []) as Record<string, unknown>[]).map((s) => [String(s.id), s]));

  let sent = 0;
  for (const b of due) {
    if (Date.parse(b.send_at) < now.getTime() - GIVE_UP_H * 3600_000) {
      await db.from("staff_broadcasts").update({ done_at: now.toISOString() }).eq("id", b.id).is("done_at", null);
      continue;
    }
    if (!sendableNow(now, b.night_ok)) continue;

    const key = broadcastKey(b.id);
    const { data: done } = await db.from("team_news_sent").select("staff_id").eq("news_id", key);
    const already = new Set((done ?? []).map((r) => String(r.staff_id)));
    const author = b.author_id ? String(byId.get(b.author_id)?.display_name ?? "DevUz") : "DevUz";
    const text = broadcastMessage(author, b.text);

    let failed = 0;
    for (const id of b.recipients) {
      if (already.has(id)) continue;
      const person = byId.get(id);
      const chat = Number(person?.telegram_user_id);
      // Отключили или Telegram пропал — писать некому, и ждать его незачем.
      if (!person?.is_active || !chat) continue;
      const { data: claimed } = await db
        .from("team_news_sent")
        .upsert({ news_id: key, staff_id: id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
        .select("staff_id");
      if (!claimed?.length) continue;
      if (await sendMessage(chat, text)) sent += 1;
      else {
        failed += 1;
        await db.from("team_news_sent").delete().eq("news_id", key).eq("staff_id", id);
      }
    }
    if (!failed) await db.from("staff_broadcasts").update({ done_at: now.toISOString() }).eq("id", b.id).is("done_at", null);
  }
  return sent;
}
