"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import { currentStaff, requestIp } from "@/lib/admin/guard";
import { PANEL_LANG_COOKIE, isPanelLocale } from "@/lib/admin/i18n";
import { SESSION_COOKIE, destroySession, setStaffLocale } from "@/lib/admin/session";

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

/**
 * Язык панели — себе и только себе.
 *
 * Сотрудник берётся из сессии, а не из формы: поменять язык коллеге нельзя
 * ни кнопкой, ни подделанным запросом. Кука — лишь зеркало для `<html
 * lang>` и страницы входа; решает колонка staff.panel_locale.
 */
export async function setPanelLocale(formData: FormData) {
  const staff = await currentStaff();
  if (!staff) redirect("/admin/login");
  const locale = formData.get("locale");
  if (!isPanelLocale(locale)) return;

  if (locale !== staff.panel_locale && !(await setStaffLocale(staff.id, locale))) return;
  (await cookies()).set(PANEL_LANG_COOKIE, locale, {
    path: "/admin",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 365 * 24 * 3600,
  });
  // Весь каркас: язык меняет и шапку, и страницу, которая сейчас открыта.
  revalidatePath("/admin", "layout");
}
