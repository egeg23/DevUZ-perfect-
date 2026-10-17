"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import {
  ABSOLUTE_DAYS,
  SESSION_COOKIE,
  consumeLoginToken,
  createSession,
  staffById,
  type Staff,
} from "@/lib/admin/session";
import {
  APP_CODE_TRIES,
  APP_LOGIN_COOKIE,
  APP_REQUEST_TTL_MS,
  appStartPayload,
  normalizeCode,
} from "@/lib/admin/app-login";
import { startAppRequest, tryAppCode } from "@/lib/admin/app-login-store";
import { company } from "@/content/company";
import { ipFromHeaders, rateLimit } from "@/lib/qualify/limiter";
import { NEXT_COOKIE, returnTo } from "@/lib/admin/return-to";
import { homeOf } from "@/lib/admin/roles";
import { PANEL_LANG_COOKIE } from "@/lib/admin/i18n";

/**
 * Обмен одноразовой ссылки на сессию.
 *
 * Почему это POST, а не просто переход по ссылке. Ссылку присылает бот в
 * Telegram, а Telegram сам открывает каждую ссылку, чтобы построить
 * превью, — и одноразовый токен сгорал бы ещё до того, как человек до него
 * дотронется. То же делают антивирусы в корпоративной почте и любой
 * префетчер. Превью в сообщении бота мы выключаем, но это защита от одного
 * известного клиента, а не от всех; POST же не делает ни один из них.
 */
export async function signIn(formData: FormData) {
  const token = String(formData.get("t") ?? "");
  const ip = ipFromHeaders(await headers());

  // Ограничение частоты стоит здесь не против подбора токена: подобрать
  // 256 бит нельзя, и это не та угроза. Оно против журнала.
  //
  // Каждая неудачная попытка пишет строку в audit_events, а эта таблица
  // append-only по замыслу — удалить из неё не может даже наш сервер. То
  // есть любой, кто умеет слать POST, наращивал бы её без предела и без
  // возможности прибрать. Единственное место, где неаутентифицированный
  // запрос пишет в неудаляемую таблицу, обязано быть ограничено.
  const limit = rateLimit(`admin-login:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) redirect("/admin/login?e=3");

  if (!token) redirect("/admin/login?e=1");

  const staff = await consumeLoginToken(token);
  if (!staff) {
    // Что именно не так — просрочено, уже использовано или выдумано — не
    // сообщаем: разные ответы превращают форму входа в способ проверять
    // токены на существование.
    await record("login.failed", { ip });
    redirect("/admin/login?e=1");
  }

  await openSession(staff, ip, { via: "link" });
}

/**
 * Сессия вошедшему: кука сессии, зеркало языка, журнал и дорога туда, куда
 * он шёл. Общая у входа по ссылке и входа кодом в приложении.
 */
async function openSession(staff: Staff, ip: string, how: { via: "link" | "app_code" }): Promise<never> {
  const session = await createSession(
    staff.id,
    ip,
    (await headers()).get("user-agent"),
  );
  if (!session) redirect("/admin/login?e=2");

  const jar = await cookies();
  jar.set(SESSION_COOKIE, session, {
    httpOnly: true,
    // Кука не должна читаться скриптом и не должна уходить по http.
    // secure выключается только там, где https нет физически, — на
    // локальной машине разработчика.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: ABSOLUTE_DAYS * 24 * 3600,
  });
  // Зеркало языка панели для <html lang> — см. lib/admin/i18n.ts.
  jar.set(PANEL_LANG_COOKIE, staff.panel_locale, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 365 * 24 * 3600,
  });

  // Куда он шёл до того, как его развернуло сюда.
  //
  // Без этого вход всегда заканчивался на главной панели, и человека,
  // пришедшего по ссылке на конкретный лид, ждал ещё один поиск — уже
  // руками, по списку. Ссылку он к этому моменту закрыл.
  const wanted = jar.get(NEXT_COOKIE)?.value ?? null;
  jar.delete({ name: NEXT_COOKIE, path: "/admin" });

  await record("login.succeeded", {
    actorStaffId: staff.id,
    ip,
    meta: how.via === "link" ? { role: staff.role, to: wanted ?? "/admin" } : { role: staff.role, via: how.via, to: wanted ?? "/admin" },
  });

  // Шёл никуда — домой: владельцу и руководителю «Главная» (homeOf).
  const to = returnTo(wanted);
  redirect(to === "/admin" ? homeOf(staff) : to);
}

// ───────────────────────────────────────────────────────────────────────────
// Вход кодом в установленном приложении (lib/admin/app-login.ts)
// ───────────────────────────────────────────────────────────────────────────

export type AppLoginState = { error: string | null; tries?: number };

/**
 * «Получить код в боте»: заводит попытку входа, кладёт её ключ в куку
 * приложения и отдаёт ссылку в бота с тем же ключом.
 */
export async function startAppLogin(): Promise<{ link: string } | { error: "offline" | "too_many" }> {
  const ip = ipFromHeaders(await headers());
  if (!rateLimit(`admin-app-start:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 }).ok) return { error: "too_many" };
  const id = await startAppRequest();
  if (!id) return { error: "offline" };
  (await cookies()).set(APP_LOGIN_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: APP_REQUEST_TTL_MS / 1000,
  });
  return { link: `https://t.me/${company.telegram}?start=${appStartPayload(id)}` };
}

/**
 * Ввод кода. Каждая неудача — в журнал (как и у входа по ссылке), пятая
 * неверная гасит код: дальше только новый из бота.
 */
export async function signInWithCode(_prev: AppLoginState, formData: FormData): Promise<AppLoginState> {
  const ip = ipFromHeaders(await headers());
  if (!rateLimit(`admin-app-code:${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 }).ok) return { error: "too_many" };

  const code = normalizeCode(String(formData.get("code") ?? ""));
  if (!code) return { error: "format" };
  const jar = await cookies();
  const requestId = jar.get(APP_LOGIN_COOKIE)?.value;
  if (!requestId) return { error: "no_request" };

  const result = await tryAppCode(requestId, code);
  if (result.check === "offline") return { error: "offline" };
  if (result.check !== "ok" || !result.staffId) {
    await record("login.failed", {
      actorStaffId: result.staffId ?? undefined,
      ip,
      meta: { via: "app_code", why: result.check, attempts: result.attempts },
    });
    if (result.check === "wrong") {
      const left = APP_CODE_TRIES - result.attempts;
      return left > 0 ? { error: "wrong", tries: left } : { error: "spent" };
    }
    return { error: result.check };
  }

  const staff = await staffById(result.staffId);
  if (!staff) return { error: "none" };
  jar.delete({ name: APP_LOGIN_COOKIE, path: "/admin" });
  return openSession(staff, ip, { via: "app_code" });
}
