import { CALLHELPER_CABINET_PATH } from "@/content/callhelper-page";
import { CALLHELPER_EXT_PATH } from "@/content/callhelper-extension";
import { messageWindow } from "@/lib/admin/tasks";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { absoluteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

import { createOrg } from "./orgs-admin";
import { SIGNUP_BOT, pendingAlive, readPending, type Pending, type SignupForm, newSignupToken } from "./signup";
import { TRIAL, TRIAL_REPEAT_DAYS, ipPrint, normPhone, trialVerdict, type TrialSeen, type TrialVerdict } from "./trial";

/**
 * База регистрации CallHelper (lib/callhelper/signup.ts): выключатель
 * владельца, незаконченные регистрации (`stats_snapshots`) и выданные
 * пробные (`callhelper_trials`, миграция 0196).
 */

const OPEN_KEY = "callhelper-signup-open";
const PENDING = "callhelper-signup:";
const BY_CHAT = "callhelper-signup-chat:";

/** Открыта ли регистрация. По умолчанию закрыта: открывает владелец в разделе CallHelper. */
export async function signupOpen(): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", OPEN_KEY).maybeSingle();
  return (data?.payload as { open?: unknown } | null)?.open === true;
}

export async function setSignupOpen(open: boolean, now: Date = new Date()): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("stats_snapshots").upsert({ key: OPEN_KEY, payload: { open }, computed_at: now.toISOString() }, { onConflict: "key" });
  return !error;
}

/** Адрес хранится отпечатком; соль — секрет сервера, которого нет в репозитории. */
export function signupIpHash(ip: string): string {
  return ipPrint(ip, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "callhelper");
}

export async function savePending(form: SignupForm, ipHash: string, device: string, now: Date = new Date()): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const token = newSignupToken();
  const payload: Pending = { ...form, token, ipHash, device, at: now.getTime() };
  const { error } = await db.from("stats_snapshots").insert({ key: `${PENDING}${token}`, payload, computed_at: now.toISOString() });
  if (error) {
    console.error("callhelper: регистрация не записана", error.message);
    return null;
  }
  return token;
}

async function pendingByToken(token: string): Promise<Pending | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", `${PENDING}${token}`).maybeSingle();
  return readPending(data?.payload);
}

/** `/start ch<токен>`: чат запомнен за регистрацией. Возвращает её или причину. */
export async function bindSignupChat(token: string, chat: number, now: Date = new Date()): Promise<Pending | "stale" | "closed"> {
  if (!(await signupOpen())) return "closed";
  const db = serviceClient();
  const pending = await pendingByToken(token);
  if (!db || !pending || !pendingAlive(pending, now.getTime())) return "stale";
  const { error } = await db.from("stats_snapshots").upsert({ key: `${BY_CHAT}${chat}`, payload: { token }, computed_at: now.toISOString() }, { onConflict: "key" });
  return error ? "stale" : pending;
}

/** Ждёт ли этот чат подтверждения номера. Дешёвая проверка перед разбором контакта. */
export async function signupWaits(chat: number): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db.from("stats_snapshots").select("key").eq("key", `${BY_CHAT}${chat}`).maybeSingle();
  return !!data;
}

async function seenTrials(inn: string, phone: string, tg: number, now: number): Promise<TrialSeen[] | null> {
  const db = serviceClient();
  if (!db) return null;
  const cols = "inn, phone, tg_id, ip_hash, device, created_at";
  // Значения — только цифры: ИНН и телефон прошли проверку, Telegram — число.
  const same = await db.from("callhelper_trials").select(cols).or(`inn.eq.${inn},phone.eq.${phone},tg_id.eq.${tg}`).limit(50);
  const recent = await db
    .from("callhelper_trials")
    .select(cols)
    .gte("created_at", new Date(now - TRIAL_REPEAT_DAYS * 86_400_000).toISOString())
    .order("created_at", { ascending: false })
    .limit(2000);
  if (same.error || recent.error) return null;
  return [...(same.data ?? []), ...(recent.data ?? [])].map((r) => ({
    inn: String(r.inn ?? ""),
    phone: String(r.phone ?? ""),
    tg: r.tg_id ? String(r.tg_id) : null,
    ipHash: String(r.ip_hash ?? ""),
    device: String(r.device ?? ""),
    at: Date.parse(String(r.created_at)),
  }));
}

export type SignupDone =
  | { ok: true; key: string; company: string }
  | { ok: false; reason: Exclude<TrialVerdict, { ok: true }>["reason"] | "stale" | "closed" | "failed" };

/**
 * Человек поделился своим номером. Регистрация забирается удалением строки
 * чата: второе нажатие кнопки второго колл-центра не заведёт.
 */
export async function finishSignup(chat: number, tgId: number, phoneRaw: string, now: Date = new Date()): Promise<SignupDone> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "failed" };
  if (!(await signupOpen())) return { ok: false, reason: "closed" };
  const phone = normPhone(phoneRaw);
  if (!phone) return { ok: false, reason: "phone" };
  const claimed = await db.from("stats_snapshots").delete().eq("key", `${BY_CHAT}${chat}`).select("payload");
  const token = String((claimed.data?.[0]?.payload as { token?: unknown } | undefined)?.token ?? "");
  const pending = token ? await pendingByToken(token) : null;
  if (!pending || !pendingAlive(pending, now.getTime())) return { ok: false, reason: "stale" };

  const seen = await seenTrials(pending.inn, phone, tgId, now.getTime());
  if (!seen) return { ok: false, reason: "failed" };
  const verdict = trialVerdict({ inn: pending.inn, phone, tg: String(tgId), ipHash: pending.ipHash, device: pending.device }, seen, now.getTime());
  if (!verdict.ok) {
    await db.from("stats_snapshots").delete().eq("key", `${PENDING}${token}`);
    return { ok: false, reason: verdict.reason };
  }

  // Строка пробного пишется раньше ключа: ключ без неё дал бы компании второй пробный.
  const trial = await db
    .from("callhelper_trials")
    .insert({ company: pending.company, inn: pending.inn, phone, tg_id: tgId, ip_hash: pending.ipHash, device: pending.device })
    .select("id")
    .maybeSingle();
  if (trial.error || !trial.data) return { ok: false, reason: "failed" };
  const made = await createOrg({
    name: pending.company,
    contact: [pending.name, `+${phone}`, `ИНН ${pending.inn}`].filter(Boolean).join(" · ").slice(0, 200),
    plan: "trial",
    operators: 1,
    staffId: null,
  });
  if (!made) {
    await db.from("callhelper_trials").delete().eq("id", trial.data.id);
    return { ok: false, reason: "failed" };
  }
  await db.from("callhelper_trials").update({ org_id: made.id }).eq("id", trial.data.id);
  await db.from("stats_snapshots").delete().eq("key", `${PENDING}${token}`);
  return { ok: true, key: made.key, company: pending.company };
}

export function doneText(key: string): string {
  return SIGNUP_BOT.done(key, TRIAL.days, TRIAL.minutes, absoluteUrl(`ru/${CALLHELPER_EXT_PATH}`), absoluteUrl(`ru/${CALLHELPER_CABINET_PATH}`));
}

/** Строка владельцу (только роль admin), 08:00–21:00 по Ташкенту. Ключа в ней нет. */
export async function tellOwnerSignup(company: string, now: Date = new Date()): Promise<void> {
  if (!messageWindow(now)) return;
  const db = serviceClient();
  if (!db) return;
  const { data } = await db.from("staff").select("telegram_user_id").eq("is_active", true).eq("role", "admin");
  const text = `📞 CallHelper: новый колл-центр на пробном\n${esc(company)}\nСписок: ${absoluteUrl("admin/callhelper")}#orgs`;
  for (const s of data ?? []) {
    const chat = Number(s.telegram_user_id);
    if (chat) await sendMessage(chat, text);
  }
}
