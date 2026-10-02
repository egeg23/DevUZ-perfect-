import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import {
  FLOOD_PAUSE_MS,
  LOGIN_STEPS,
  NEW_ACCOUNT_CAP,
  accountOf,
  loginSecret,
  passwordSecret,
  sessionSecret,
  type AccountStatus,
  type LoginError,
  type WorkAccount,
} from "@/lib/admin/work-accounts";
import { appSecret, forgetSecrets, saveAppSecret } from "@/lib/secrets";
import { serviceClient } from "@/lib/supabase";

/**
 * Рабочие аккаунты — база. Два читателя: панель (подключить, остановить,
 * предел в час) и скаут (вход в Telegram, отправка, отметка «на связи»).
 *
 * Вход разнесён по ним намеренно. Telegram говорит только со скаутом — у
 * него библиотека и выход к дата-центру, — а человек сидит в панели. Поэтому
 * панель кладёт в строку то, что ввёл человек (номер, код, пароль), а скаут
 * раз в несколько секунд забирает шаг и пишет итог: «ждём код», «ждём
 * пароль», «подключён» или ошибку.
 *
 * Сессия — ключ от аккаунта: с ней можно читать и писать всё, что может
 * человек. В таблицу она не попадает — только в хранилище Supabase (Vault),
 * которое читает один сервер. Пароль двухфакторной защиты лежит там же и
 * ровно столько, сколько нужно скауту, чтобы его проверить.
 */

const COLUMNS =
  "id, created_at, label, phone, status, login_error, tg_username, tg_name, hourly_cap, flood_until, flood_note, activated_at, seen_at";

function shape(row: Record<string, unknown>): WorkAccount {
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    label: String(row.label ?? ""),
    phone: String(row.phone ?? ""),
    status: (row.status as AccountStatus) ?? "failed",
    login_error: (row.login_error as string | null) ?? null,
    tg_username: (row.tg_username as string | null) ?? null,
    tg_name: (row.tg_name as string | null) ?? null,
    hourly_cap: Number(row.hourly_cap ?? NEW_ACCOUNT_CAP),
    flood_until: (row.flood_until as string | null) ?? null,
    flood_note: (row.flood_note as string | null) ?? null,
    activated_at: (row.activated_at as string | null) ?? null,
    seen_at: (row.seen_at as string | null) ?? null,
  };
}

/* ── Панель ────────────────────────────────────────────────────────────── */

export async function listAccounts(): Promise<WorkAccount[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("tg_accounts")
    .select(COLUMNS)
    .neq("status", "removed")
    .order("created_at", { ascending: true });
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

export async function addAccount(input: { label: string; phone: string; by: Staff }): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  // Тот же номер второй раз — не второй аккаунт, а повторный вход: старую
  // строку снимаем, иначе скаут держал бы две сессии одного человека.
  await db.from("tg_accounts").update({ status: "removed" }).eq("phone", input.phone).neq("status", "removed");
  const { data, error } = await db
    .from("tg_accounts")
    .insert({ label: input.label, phone: input.phone, status: "code_requested", created_by: input.by.id })
    .select("id")
    .single();
  if (error || !data) {
    console.error("аккаунты: не завёл", error?.message);
    return null;
  }
  await record("work_account.add", { actorStaffId: input.by.id, targetType: "tg_account", targetId: String(data.id), meta: { label: input.label } });
  return String(data.id);
}

/** Код из Telegram — скауту. Только пока его и ждём. */
export async function submitCode(id: string, code: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db
    .from("tg_accounts")
    .update({ login_code: code, status: "code_submitted", login_error: null })
    .eq("id", id)
    .eq("status", "awaiting_code")
    .select("id");
  return Boolean(data?.length);
}

/**
 * Пароль двухфакторной защиты — в хранилище, не в таблицу. Скаут стирает его,
 * как только попробовал, — подошёл он или нет.
 */
export async function submitPassword(id: string, password: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  if (!(await saveAppSecret(passwordSecret(id), password))) return false;
  const { data } = await db
    .from("tg_accounts")
    .update({ status: "password_submitted", login_error: null })
    .eq("id", id)
    .eq("status", "awaiting_password")
    .select("id");
  if (!data?.length) await saveAppSecret(passwordSecret(id), null);
  return Boolean(data?.length);
}

export async function setAccountCap(id: string, cap: number): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("tg_accounts").update({ hourly_cap: Math.min(2, Math.max(1, Math.round(cap))) }).eq("id", id);
}

/** Пауза и возврат: аккаунт остаётся подключённым, но первых писем не шлёт. */
export async function setAccountPaused(id: string, paused: boolean, by: Staff): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("tg_accounts")
    .update({ status: paused ? "paused" : "active" })
    .eq("id", id)
    .eq("status", paused ? "active" : "paused");
  await record(paused ? "work_account.pause" : "work_account.resume", { actorStaffId: by.id, targetType: "tg_account", targetId: id });
}

/**
 * Отключить совсем. Скаут закрывает сессию в Telegram (она пропадает из
 * «Активных сеансов» на телефоне) и стирает её из хранилища. Переписки,
 * начатые с этого аккаунта, остаются в «Касаниях»: дальше по ним пишет
 * человек сам.
 */
export async function removeAccount(id: string, by: Staff): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("tg_accounts").update({ status: "removed", login_code: null }).eq("id", id);
  await saveAppSecret(loginSecret(id), null);
  await saveAppSecret(passwordSecret(id), null);
  await record("work_account.remove", { actorStaffId: by.id, targetType: "tg_account", targetId: id });
}

/* ── Скаут ─────────────────────────────────────────────────────────────── */

export type LoginJob = { id: string; phone: string; status: AccountStatus; phoneCodeHash: string | null; code: string | null };

/** Шаги входа, которые ждут скаута. */
export async function loginJobs(): Promise<LoginJob[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("tg_accounts")
    .select("id, phone, status, phone_code_hash, login_code")
    .in("status", [...LOGIN_STEPS])
    .order("created_at", { ascending: true })
    .limit(5);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    phone: String(row.phone),
    status: row.status as AccountStatus,
    phoneCodeHash: (row.phone_code_hash as string | null) ?? null,
    code: (row.login_code as string | null) ?? null,
  }));
}

/** Сессия на время входа: код запрошен этим ключом, и проверять его надо им же. */
export async function loginSession(id: string): Promise<string | null> {
  forgetSecrets();
  return appSecret(loginSecret(id));
}

export async function loginPassword(id: string): Promise<string | null> {
  forgetSecrets();
  return appSecret(passwordSecret(id));
}

export async function codeSent(id: string, phoneCodeHash: string, session: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await saveAppSecret(loginSecret(id), session);
  await db
    .from("tg_accounts")
    .update({ status: "awaiting_code", phone_code_hash: phoneCodeHash, login_code: null, login_error: null })
    .eq("id", id);
}

/** Шаг не прошёл. `back` — куда вернуть: снова ждать код или пароль, или конец. */
export async function loginFailed(id: string, error: LoginError, detail: string, back: AccountStatus): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("tg_accounts")
    .update({ status: back, login_code: null, login_error: `${error}: ${detail}`.slice(0, 300) })
    .eq("id", id);
  if (back === "failed") await saveAppSecret(loginSecret(id), null);
  await saveAppSecret(passwordSecret(id), null);
}

export async function needPassword(id: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("tg_accounts").update({ status: "awaiting_password", login_code: null, login_error: null }).eq("id", id);
}

/** Вошли: сессия — в хранилище, временное — стереть. */
export async function loggedIn(
  id: string,
  session: string,
  me: { userId: string | null; username: string | null; name: string | null },
): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  if (!(await saveAppSecret(sessionSecret(id), session))) return false;
  await saveAppSecret(loginSecret(id), null);
  await saveAppSecret(passwordSecret(id), null);
  await db
    .from("tg_accounts")
    .update({
      status: "active",
      login_code: null,
      phone_code_hash: null,
      login_error: null,
      tg_user_id: me.userId,
      tg_username: me.username,
      tg_name: me.name,
      activated_at: new Date().toISOString(),
    })
    .eq("id", id);
  return true;
}

export type LiveAccount = { id: string; label: string; status: AccountStatus; hourlyCap: number; floodUntil: string | null };

/** Аккаунты, которые скаут должен держать на связи: подключённые и на паузе. */
export async function liveAccounts(): Promise<LiveAccount[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("tg_accounts")
    .select("id, label, status, hourly_cap, flood_until")
    .in("status", ["active", "paused"]);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    label: String(row.label),
    status: row.status as AccountStatus,
    hourlyCap: Number(row.hourly_cap ?? NEW_ACCOUNT_CAP),
    floodUntil: (row.flood_until as string | null) ?? null,
  }));
}

/**
 * Отключённые из панели, чью сессию скаут ещё не закрыл. Отметка «закрыто» —
 * пустой activated_at: так аккаунт, снятый, пока скаут перезапускался, не
 * останется висеть в «Активных сеансах» у владельца на телефоне.
 */
export async function removedPending(): Promise<string[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("tg_accounts").select("id").eq("status", "removed").not("activated_at", "is", null).limit(10);
  return (data ?? []).map((row) => String(row.id));
}

export async function logoutDone(id: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await saveAppSecret(sessionSecret(id), null);
  await db.from("tg_accounts").update({ activated_at: null, seen_at: null }).eq("id", id);
}

export async function accountSession(id: string): Promise<string | null> {
  return appSecret(sessionSecret(id));
}

export async function markSeen(ids: readonly string[]): Promise<void> {
  const db = serviceClient();
  if (!db || !ids.length) return;
  await db.from("tg_accounts").update({ seen_at: new Date().toISOString() }).in("id", [...ids]);
}

/** Telegram ограничил аккаунт — сутки без первых писем, переписка идёт. */
export async function markFlood(id: string, why: string, now = Date.now()): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("tg_accounts")
    .update({ flood_until: new Date(now + FLOOD_PAUSE_MS).toISOString(), flood_note: why.slice(0, 300) })
    .eq("id", id);
}

/** Сессию отозвали (вышли со всех устройств, номер заблокирован) — аккаунт больше не наш. */
export async function markSessionDead(id: string, why: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("tg_accounts").update({ status: "failed", login_error: `other: ${why}`.slice(0, 300) }).eq("id", id);
}

/**
 * Сколько первых писем ушло с каждого аккаунта: за час и с полуночи по
 * Ташкенту. Считаются только ушедшие с аккаунта — ручной маршрут писал
 * человек со своего телефона.
 */
export async function accountsActivity(now = Date.now()): Promise<Map<string, { hour: number; today: number }>> {
  const out = new Map<string, { hour: number; today: number }>();
  const db = serviceClient();
  if (!db) return out;
  const shifted = new Date(now + 5 * 3600_000);
  const midnight = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - 5 * 3600_000;
  const { data } = await db
    .from("prospects")
    .select("sent_at, sent_via")
    .eq("status", "sent")
    .or("target_kind.is.null,target_kind.neq.manual")
    .gte("sent_at", new Date(Math.min(midnight, now - 3600_000)).toISOString())
    .limit(500);
  for (const row of data ?? []) {
    const at = Date.parse(String(row.sent_at));
    const key = accountOf(row.sent_via as string | null);
    const had = out.get(key) ?? { hour: 0, today: 0 };
    if (at >= now - 3600_000) had.hour += 1;
    if (at >= midnight) had.today += 1;
    out.set(key, had);
  }
  return out;
}
