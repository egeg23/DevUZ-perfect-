"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import {
  ABSOLUTE_DAYS,
  SESSION_COOKIE,
  consumeLoginToken,
  createSession,
} from "@/lib/admin/session";
import { ipFromHeaders } from "@/lib/qualify/limiter";

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

  if (!token) redirect("/admin/login?e=1");

  const staff = await consumeLoginToken(token);
  if (!staff) {
    // Что именно не так — просрочено, уже использовано или выдумано — не
    // сообщаем: разные ответы превращают форму входа в способ проверять
    // токены на существование.
    await record("login.failed", { ip });
    redirect("/admin/login?e=1");
  }

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

  await record("login.succeeded", {
    actorStaffId: staff.id,
    ip,
    meta: { role: staff.role },
  });

  redirect("/admin");
}
