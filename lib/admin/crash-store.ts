import { serviceClient } from "@/lib/supabase";

/**
 * Сбои страниц панели — последние CRASH_KEEP в stats_snapshots
 * (`admin-crashes`): чтобы найти и убрать причину, а не держать таблицу ради
 * журнала, который нужен разработчику. Пишется и в лог контейнера.
 */
export const CRASH_KEY = "admin-crashes";
export const CRASH_KEEP = 200;

export type Crash = {
  at: string;
  staff: string;
  path: string;
  message: string;
  digest: string;
  stack: string;
  agent: string;
  /** Повтор после тихой перезагрузки страницы — значит, сама она не поднялась. */
  retried: boolean;
};

export async function recordCrash(crash: Omit<Crash, "at">): Promise<void> {
  const entry: Crash = { at: new Date().toISOString(), ...crash };
  console.error("панель: сбой страницы", entry.path, entry.message, entry.digest);
  const db = serviceClient();
  if (!db) return;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", CRASH_KEY).maybeSingle();
  const list = Array.isArray((data?.payload as { list?: unknown } | null)?.list)
    ? ((data!.payload as { list: Crash[] }).list)
    : [];
  const next = [entry, ...list].slice(0, CRASH_KEEP);
  await db
    .from("stats_snapshots")
    .upsert({ key: CRASH_KEY, payload: { list: next }, computed_at: entry.at }, { onConflict: "key" });
}
