import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { randomKey, sha256 } from "@/lib/ai-staff/crypto";
import * as store from "@/lib/ai-staff/store";

/**
 * Вход в кабинет клиента — через Telegram, как в панель студии, но своими
 * таблицами и своей кукой: кабинет клиента и панель сотрудников не должны
 * знать друг о друге ничего, кроме входа поддержки из панели.
 *
 * Как: в боте сервиса /start → ссылка на 15 минут → переход гасит ссылку и
 * ставит куку сессии на 7 дней. Пароля нет; доказательство личности —
 * то, что ссылку прислал бот в личный чат этого человека.
 *
 * В базе только хеши: дамп не даёт войти ни под кем.
 */

export const CABINET_COOKIE = "ai_cab";
export const LOGIN_MINUTES = 15;
export const SESSION_DAYS = 7;

export async function issueLogin(person: store.TgPerson, now = new Date()): Promise<string> {
  const token = randomKey(32);
  await store.saveLoginToken(sha256(token), person, new Date(now.getTime() + LOGIN_MINUTES * 60_000));
  return token;
}

/** Ссылка → сессия. Кабинет — первый из тех, где человек владелец или менеджер. */
export async function enterWithToken(token: string, now = new Date()): Promise<{ cookie: string; expires: Date } | null> {
  if (!/^[\w-]{20,80}$/.test(token)) return null;
  const person = await store.useLoginToken(sha256(token), now);
  if (!person) return null;
  const memberships = await store.membershipsOf(person.id);
  const owned = memberships.find((m) => m.role === "owner") ?? memberships[0];
  const cookie = randomKey(32);
  const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  await store.saveSession(sha256(cookie), {
    telegramUserId: person.id,
    tenantId: owned?.tenant_id ?? null,
    staffId: null,
    expiresAt: expires,
  });
  return { cookie, expires };
}

/** Вход поддержки студии в кабинет клиента — из панели, на 2 часа. */
export async function enterAsStaff(staff: { id: string; telegram_user_id: number }, tenantId: string, now = new Date()) {
  const cookie = randomKey(32);
  const expires = new Date(now.getTime() + 2 * 3_600_000);
  await store.saveSession(sha256(cookie), { telegramUserId: staff.telegram_user_id, tenantId, staffId: staff.id, expiresAt: expires });
  return { cookie, expires };
}

export type Cabinet = {
  session: store.CabinetSession;
  tokenHash: string;
  /** Открытый кабинет и роль в нём; null — человек ещё не завёл кабинет. */
  tenant: store.Tenant | null;
  role: "owner" | "manager" | "support" | null;
  memberships: Array<store.Member & { tenant: store.Tenant }>;
};

/**
 * Кто открыл кабинет. Клиент сессии каждый раз сверяется с членством: убрали
 * менеджера из команды — его сессия больше ничего не открывает.
 */
export async function currentCabinet(): Promise<Cabinet | null> {
  const jar = await cookies();
  const raw = jar.get(CABINET_COOKIE)?.value;
  if (!raw || !/^[\w-]{20,80}$/.test(raw)) return null;
  const tokenHash = sha256(raw);
  const session = await store.sessionByHash(tokenHash, new Date());
  if (!session) return null;

  if (session.staffId) {
    const tenant = session.tenantId ? await store.tenantById(session.tenantId) : null;
    return { session, tokenHash, tenant, role: tenant ? "support" : null, memberships: [] };
  }
  const memberships = await store.membershipsOf(session.telegramUserId);
  const current = memberships.find((m) => m.tenant_id === session.tenantId) ?? null;
  return { session, tokenHash, tenant: current?.tenant ?? null, role: current?.role ?? null, memberships };
}

export async function requireCabinet(): Promise<Cabinet> {
  const cabinet = await currentCabinet();
  if (!cabinet) redirect("/cabinet/login");
  return cabinet;
}

/** Кабинет с открытым клиентом; без клиента — в мастер создания. */
export async function requireTenant(): Promise<Cabinet & { tenant: store.Tenant; role: "owner" | "manager" | "support" }> {
  const cabinet = await requireCabinet();
  if (!cabinet.tenant || !cabinet.role) redirect("/cabinet/start");
  return cabinet as Cabinet & { tenant: store.Tenant; role: "owner" | "manager" | "support" };
}

/** Настройки, база знаний, каналы, команда — владельцу и поддержке, не менеджеру. */
export function canConfigure(role: Cabinet["role"]): boolean {
  return role === "owner" || role === "support";
}
