import { BAN_NOTIFIED_KEY, banNotices, type Ban } from "@/lib/admin/account-ban";
import { MAIN_LABEL, mainLimitUntil } from "@/lib/admin/account-ban-store";
import { assignments } from "@/lib/admin/outreach-queue";
import { messageWindow } from "@/lib/admin/tasks";
import { MAIN_ACCOUNT } from "@/lib/admin/work-accounts";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Оповещение команды об ограничениях рабочих аккаунтов (lib/admin/account-ban.ts).
 * Проверку делает скаут раз в час, это — то, что свип говорит людям.
 */

type Db = NonNullable<ReturnType<typeof serviceClient>>;

/**
 * Какие аккаунты сейчас ограничены — с тем, чьи письма ждут именно их.
 *
 * «Касается» — тот, у кого все отмеченные аккаунты ограничены или
 * выключены: ему писать с рабочего не с чего. Неотмеченный пишет с любого
 * и, пока свободен хоть один аккаунт, не застрял.
 */
async function loadBans(db: Db, now: number): Promise<{ bans: Ban[]; labels: Record<string, string> }> {
  const [{ data: accounts }, mainUntil, assigned, { data: staff }, { data: queue }] = await Promise.all([
    db.from("tg_accounts").select("id, label, status, flood_until"),
    mainLimitUntil(now),
    assignments(db),
    db.from("staff").select("id, display_name").eq("is_active", true),
    db.from("prospects").select("claimed_by").eq("status", "sending").limit(1000),
  ]);

  const labels: Record<string, string> = { [MAIN_ACCOUNT]: MAIN_LABEL };
  for (const a of accounts ?? []) labels[String(a.id)] = String(a.label ?? "");

  const limited = new Map<string, number>();
  if (mainUntil) limited.set(MAIN_ACCOUNT, mainUntil);
  for (const a of accounts ?? []) {
    const until = a.flood_until ? Date.parse(String(a.flood_until)) : 0;
    if (a.status === "active" && until > now) limited.set(String(a.id), until);
  }
  const working = new Set([MAIN_ACCOUNT, ...(accounts ?? []).filter((a) => a.status === "active").map((a) => String(a.id))]);
  const canWrite = (key: string) => working.has(key) && !limited.has(key);

  const names = new Map((staff ?? []).map((s) => [String(s.id), String(s.display_name ?? "")]));
  const bans: Ban[] = [...limited.entries()].map(([key, until]) => {
    const stuckPeople = [...assigned.entries()]
      .filter(([, keys]) => keys.has(key) && ![...keys].some(canWrite))
      .map(([id]) => id)
      .filter((id) => names.has(id));
    const ids = new Set(stuckPeople);
    return {
      key,
      label: labels[key] ?? key,
      until,
      stuck: (queue ?? []).filter((row) => row.claimed_by && ids.has(String(row.claimed_by))).length,
      people: stuckPeople.map((id) => names.get(id) as string).filter(Boolean),
    };
  });
  return { bans, labels };
}

/**
 * Свип: сказать всей команде, что аккаунт ограничен, ограничение продлено
 * или снято.
 *
 * Всем активным сотрудникам с Telegram, без галочек рассылок: это не
 * уведомление о лиде, а «с этого номера сейчас писать нельзя» — касается
 * работы каждого. С 07:00 до 23:00 по Ташкенту, как задачи: ночью первые
 * письма и так не уходят, а будить незачем — случилось ночью, придёт утром.
 */
export async function banSweep(now = Date.now()): Promise<number> {
  if (!messageWindow(new Date(now))) return 0;
  const db = serviceClient();
  if (!db) return 0;

  const [{ bans, labels }, { data: toldRow }] = await Promise.all([
    loadBans(db, now),
    db.from("stats_snapshots").select("payload").eq("key", BAN_NOTIFIED_KEY).maybeSingle(),
  ]);
  const told = ((toldRow?.payload as { told?: Record<string, number> } | null)?.told ?? {}) as Record<string, number>;
  const { notices, told: next } = banNotices({ bans, told, labels, now, esc });
  if (!notices.length) return 0;

  // Сначала запоминаем, потом шлём: свип раз в пять минут, и упавшая на
  // середине рассылка не должна повторяться каждые пять минут всем подряд.
  await db
    .from("stats_snapshots")
    .upsert({ key: BAN_NOTIFIED_KEY, payload: { told: next }, computed_at: new Date(now).toISOString() }, { onConflict: "key" });

  const { data: staff } = await db.from("staff").select("telegram_user_id").eq("is_active", true).limit(200);
  const chats = (staff ?? []).map((s) => Number(s.telegram_user_id)).filter((id) => Number.isFinite(id) && id !== 0);
  let sent = 0;
  for (const notice of notices) {
    for (const chat of chats) if (await sendMessage(chat, notice.text)) sent += 1;
  }
  return sent;
}
