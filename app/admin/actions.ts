"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import { currentStaff, requestIp } from "@/lib/admin/guard";
import { SESSION_COOKIE, destroySession } from "@/lib/admin/session";

/**
 * Выход. Сессия удаляется из базы, а не только кука из браузера: иначе
 * значение, снятое с чужого ноутбука до нажатия «выйти», продолжало бы
 * работать все семь суток абсолютного срока.
 */
export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const staff = await currentStaff();

  if (token) await destroySession(token);
  jar.delete({ name: SESSION_COOKIE, path: "/admin" });

  await record("logout", { actorStaffId: staff?.id ?? null, ip: await requestIp() });
  redirect("/admin/login");
}
