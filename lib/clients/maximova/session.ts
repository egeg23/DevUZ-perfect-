import { cookies } from "next/headers";

import { viewerBySession, type Viewer } from "@/lib/clients/maximova/store";

/** Кука сессии кабинета. Своя, не пересекается с панелью студии. */
export const SESSION_COOKIE = "mx_session";
/** Кука начатого входа: только этот браузер заберёт сессию. */
export const LOGIN_COOKIE = "mx_login";

export const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** Кто смотрит страницу: родитель, Дарья или никто. */
export async function currentViewer(): Promise<Viewer | null> {
  const store = await cookies();
  try {
    return viewerBySession(store.get(SESSION_COOKIE)?.value);
  } catch {
    // База недоступна — показываем вход, а не падаем всей страницей.
    return null;
  }
}
