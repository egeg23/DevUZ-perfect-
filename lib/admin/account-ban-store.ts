import { BAN_DEFAULT_MS, banKey, type BanVerdict } from "@/lib/admin/account-ban";
import { MAIN_ACCOUNT } from "@/lib/admin/work-accounts";
import { serviceClient } from "@/lib/supabase";

/**
 * Ограничения рабочих аккаунтов — база (lib/admin/account-ban.ts).
 *
 * У дополнительного аккаунта ограничение — `tg_accounts.flood_until`: его
 * читает скаут, панель и расчёт очереди. У главного строки в tg_accounts
 * нет, поэтому его ограничение — строка `tg-ban:main` в stats_snapshots.
 * Раньше главный после PEER_FLOOD просто стоял до перезапуска скаута — а
 * перезапускает его каждая выкатка, то есть несколько раз в день, и каждый
 * раз он снова пробовал писать с ограниченного номера.
 *
 * Этот модуль читает скаут, поэтому здесь только база: оповещение команды —
 * в account-ban-sweep.
 */

/** Главный аккаунт в оповещениях — как в панели, «Аккаунты». */
export const MAIN_LABEL = "Главный аккаунт";

type Db = NonNullable<ReturnType<typeof serviceClient>>;

type BanRow = { limited: boolean; until: number | null; source: "spambot" | "send"; text: string; checkedAt: string };

export async function readRow(db: Db, account: string): Promise<BanRow | null> {
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", banKey(account)).maybeSingle();
  return (data?.payload as BanRow | undefined) ?? null;
}

async function writeRow(db: Db, account: string, row: BanRow): Promise<void> {
  await db
    .from("stats_snapshots")
    .upsert({ key: banKey(account), payload: row, computed_at: new Date().toISOString() }, { onConflict: "key" });
}

/**
 * Ответ @SpamBot — в базу.
 *
 * Ограничен — срок из ответа, а без срока сутки (и каждый час заново, пока
 * ограничен). Свободен — снимаем только то ограничение, которое поставила
 * сама проверка: сутки после PEER_FLOOD — правило скаута, и @SpamBot может
 * говорить «свободен», когда Telegram всё ещё не пускает к незнакомым.
 * Ответ не разобран (`verdict === null`) — не трогаем ничего.
 */
export async function recordBanCheck(account: string, verdict: BanVerdict | null, text: string, now = Date.now()): Promise<void> {
  const db = serviceClient();
  if (!db || !verdict) return;
  const checkedAt = new Date(now).toISOString();
  const note = `SpamBot: ${text.replace(/\s+/g, " ").trim()}`.slice(0, 300);

  if (account === MAIN_ACCOUNT) {
    const row = await readRow(db, account);
    if (verdict.limited) {
      const until = Math.max(verdict.until ?? now + BAN_DEFAULT_MS, row?.limited && row.until ? row.until : 0);
      await writeRow(db, account, { limited: true, until, source: "spambot", text: note, checkedAt });
    } else if (!row?.limited || row.source === "spambot" || (row.until !== null && row.until <= now)) {
      await writeRow(db, account, { limited: false, until: null, source: "spambot", text: note, checkedAt });
    } else {
      await writeRow(db, account, { ...row, checkedAt });
    }
    return;
  }

  const { data } = await db.from("tg_accounts").select("flood_until, flood_note").eq("id", account).maybeSingle();
  const current = data?.flood_until ? Date.parse(String(data.flood_until)) : 0;
  if (verdict.limited) {
    const until = Math.max(verdict.until ?? now + BAN_DEFAULT_MS, current);
    await db.from("tg_accounts").update({ flood_until: new Date(until).toISOString(), flood_note: note }).eq("id", account);
  } else if (current > now && String(data?.flood_note ?? "").startsWith("SpamBot:")) {
    await db.from("tg_accounts").update({ flood_until: null, flood_note: note }).eq("id", account);
  }
  await writeRow(db, account, { limited: verdict.limited, until: verdict.until, source: "spambot", text: note, checkedAt });
}

/** PEER_FLOOD / FLOOD_WAIT на отправке с главного — сутки без первых писем, как у остальных. */
export async function markMainFlood(why: string, now = Date.now()): Promise<number> {
  const db = serviceClient();
  const until = now + BAN_DEFAULT_MS;
  if (!db) return until;
  const row = await readRow(db, MAIN_ACCOUNT);
  const keep = row?.limited && row.until && row.until > until ? row.until : until;
  await writeRow(db, MAIN_ACCOUNT, {
    limited: true,
    until: keep,
    source: "send",
    text: why.slice(0, 300),
    checkedAt: new Date(now).toISOString(),
  });
  return keep;
}

/** Когда этот аккаунт последний раз спрашивал @SpamBot (мс); null — не спрашивал. */
export async function lastBanCheck(account: string): Promise<number | null> {
  const db = serviceClient();
  if (!db) return null;
  const row = await readRow(db, account);
  return row?.checkedAt ? Date.parse(row.checkedAt) : null;
}

/** До какого времени ограничен главный аккаунт; null — не ограничен. */
export async function mainLimitUntil(now = Date.now()): Promise<number | null> {
  const db = serviceClient();
  if (!db) return null;
  const row = await readRow(db, MAIN_ACCOUNT);
  return row?.limited && row.until && row.until > now ? row.until : null;
}

