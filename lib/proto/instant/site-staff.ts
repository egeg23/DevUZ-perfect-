import { SITE_STAFF_COOKIE } from "@/lib/admin/return-to";
import { staffForSession } from "@/lib/admin/session";

/** Копия сессии панели из куки окна «Собрать макет» (middleware кладёт её на /api/instant). */
export function siteStaffToken(cookie: string | null): string | null {
  const m = new RegExp(`(?:^|;\\s*)${SITE_STAFF_COOKIE}=([^;]+)`).exec(cookie ?? "");
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

/**
 * Сотрудник в окне на сайте — только по живой сессии панели в базе: без
 * лимита, с «Собрать заново», сборка помечена «собрал сотрудник», лида нет
 * (как сборка сотрудника в боте). Метка «устройство команды» для этого не годится: секрета
 * в ней нет.
 */
export async function siteStaff(request: Request): Promise<{ id: string } | null> {
  const token = siteStaffToken(request.headers.get("cookie"));
  if (!token) return null;
  const staff = await staffForSession(token).catch(() => null);
  return staff ? { id: staff.id } : null;
}
