import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { ipFromHeaders } from "@/lib/qualify/limiter";
import { SESSION_COOKIE, staffForSession, type Staff } from "@/lib/admin/session";

/**
 * Кто сейчас в панели, или null.
 *
 * Никаких «сотрудник по умолчанию» и никакого режима разработки, в котором
 * проверка отключается: такой режим однажды уезжает на боевой сервер, и
 * узнают об этом не по логам.
 */
export async function currentStaff(): Promise<Staff | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return staffForSession(token);
}

/**
 * То же, но без сессии уводит на вход. Каждая страница панели начинается с
 * этого вызова — проверка в layout не годится: layout в Next кэшируется
 * отдельно от страницы и при переходах между разделами может не
 * выполниться повторно, то есть защита оказалась бы там, где её иногда нет.
 */
export async function requireStaff(): Promise<Staff> {
  const staff = await currentStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

/** Только для админа: раздел сотрудников, настройки, журнал. */
export async function requireAdmin(): Promise<Staff> {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin");
  return staff;
}

/** IP текущего запроса — для журнала. */
export async function requestIp(): Promise<string> {
  return ipFromHeaders(await headers());
}
