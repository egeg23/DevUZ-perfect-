import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { accountById, googleAccounts, googleCredsFor, type Account } from "@/lib/ads/store";
import { GEO, keywordIdeas } from "@/lib/seo/keyword-planner";
import type { SourceResult } from "@/lib/seo/keywords";
import { serviceClient } from "@/lib/supabase";

/**
 * Планировщик ключевых слов — какой кабинет Google Ads, проверка и запрос
 * для статей (lib/seo/keyword-planner.ts — сам запрос).
 *
 * Кабинет выбирают в «Рекламе» среди подключённых кабинетов Google
 * (`PLANNER_ACCOUNT_KEY` в stats_snapshots). Не выбран, а подключён ровно
 * один — берётся он. Ни одного — планировщика нет, статьи идут с Trends и
 * Вордстатом, как раньше.
 */

export const PLANNER_ACCOUNT_KEY = "keyword-planner-account";
export const PLANNER_CHECK_KEY = "keyword-planner-check";
/** Фраза для «Проверить»: частая, по Узбекистану у неё точно есть поиски. */
export const CHECK_SEED = "создание сайтов";

/** Выбирают руководитель и владелец. */
export function mayChoosePlanner(staff: Pick<Staff, "role">): boolean {
  return staff.role === "admin" || staff.role === "head";
}

async function chosenId(): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", PLANNER_ACCOUNT_KEY).maybeSingle();
  const id = (data?.payload as { account?: unknown } | null)?.account;
  return typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

/** Кабинет планировщика: выбранный, иначе единственный подключённый. */
export async function plannerAccount(): Promise<{ account: Account | null; chosen: string | null; accounts: Account[] }> {
  const [chosen, accounts] = await Promise.all([chosenId(), googleAccounts()]);
  const account = (chosen ? accounts.find((a) => a.id === chosen) : null) ?? (accounts.length === 1 ? accounts[0] : null);
  return { account, chosen, accounts };
}

/** Идеи по фразе для статьи. Не подключён — так и пишет, статья идёт дальше без него. */
export async function plannerIdeas(seed: string, geo: number): Promise<SourceResult> {
  try {
    const { account } = await plannerAccount();
    if (!account) return { ok: false, reason: "планировщик Google Ads не подключён" };
    const creds = await googleCredsFor(account);
    if (!creds) return { ok: false, reason: "кабинет Google Ads не подключён: нажмите «Подключить» в «Рекламе»" };
    return await keywordIdeas(creds, seed, geo);
  } catch (error) {
    return { ok: false, reason: `планировщик недоступен: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function setPlannerAccount(staff: Staff, accountId: string | null, ip: string): Promise<"ok" | "forbidden" | "bad" | "failed"> {
  if (!mayChoosePlanner(staff)) return "forbidden";
  if (accountId) {
    const account = await accountById(accountId);
    if (!account || account.platform !== "google") return "bad";
  }
  const db = serviceClient();
  if (!db) return "failed";
  const at = new Date().toISOString();
  const { error } = await db
    .from("stats_snapshots")
    .upsert({ key: PLANNER_ACCOUNT_KEY, payload: { account: accountId, by: staff.id, at }, computed_at: at }, { onConflict: "key" });
  if (error) return "failed";
  await record("ads.planner_set", { actorStaffId: staff.id, targetType: "ads_account", targetId: accountId, ip });
  return "ok";
}

export type PlannerCheck = { at: string; ok: boolean; text: string; top: { phrase: string; value: number }[] };

/** «Проверить»: одна фраза по Узбекистану, итог — словами и в базу, чтобы видеть его потом. */
export async function checkPlanner(staff: Staff): Promise<PlannerCheck | "forbidden"> {
  if (!mayChoosePlanner(staff)) return "forbidden";
  const result = await plannerIdeas(CHECK_SEED, GEO.UZ);
  const check: PlannerCheck = result.ok
    ? { at: new Date().toISOString(), ok: true, text: `работает: «${CHECK_SEED}» по Узбекистану`, top: result.phrases.slice(0, 5) }
    : { at: new Date().toISOString(), ok: false, text: result.reason, top: [] };
  const db = serviceClient();
  if (db) await db.from("stats_snapshots").upsert({ key: PLANNER_CHECK_KEY, payload: check, computed_at: check.at }, { onConflict: "key" });
  return check;
}

export async function lastPlannerCheck(): Promise<PlannerCheck | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", PLANNER_CHECK_KEY).maybeSingle();
  const p = data?.payload as PlannerCheck | null;
  return p && typeof p.text === "string" ? p : null;
}
