import { HOUR_MS } from "@/lib/admin/outreach";
import { serviceClient } from "@/lib/supabase";

/**
 * Что рабочий аккаунт уже отправил блогерам (lib/bloggers/tg-queue.ts).
 * Отдельным модулем: это читает и очередь касаний компаний
 * (lib/admin/outreach-queue.ts → nextQueued), потому что предел в час и
 * пауза между сообщениями — общие для аккаунта, кому бы он ни писал.
 */

/** Блогерам за час с этого аккаунта: сколько и когда последнее. */
export async function bloggerSendsLastHour(now = Date.now(), account?: string): Promise<{ count: number; lastAt: number | null }> {
  const db = serviceClient();
  if (!db) return { count: 0, lastAt: null };
  let query = db
    .from("bloggers")
    .select("contacted_at")
    .eq("channel", "telegram")
    .not("tg_account", "is", null)
    .gte("contacted_at", new Date(now - HOUR_MS).toISOString())
    .order("contacted_at", { ascending: false });
  if (account) query = query.eq("tg_account", account);
  const { data } = await query;
  const rows = data ?? [];
  return { count: rows.length, lastAt: rows[0]?.contacted_at ? Date.parse(String(rows[0].contacted_at)) : null };
}

/** Последняя отправка блогеру с этого аккаунта — для паузы между сообщениями. */
export async function lastBloggerSendAt(account: string): Promise<number | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("bloggers")
    .select("contacted_at")
    .eq("tg_account", account)
    .not("contacted_at", "is", null)
    .order("contacted_at", { ascending: false })
    .limit(1);
  return data?.[0]?.contacted_at ? Date.parse(String(data[0].contacted_at)) : null;
}
