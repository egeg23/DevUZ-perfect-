/**
 * Адрес кнопки «Подключить» у рекламного кабинета. Команда студии — через
 * `/admin/…`: кука панели живёт только там (middleware.ts), и под `/api/…`
 * сервер сотрудника не узнаёт (18.11.2026: «forbidden»). Участник кабинета
 * агентства — через `/api/…`. Обработчики — lib/ads/oauth-routes.ts.
 */
export const ADMIN_OAUTH_BASE = "/admin/ads/oauth";

export function connectHref(platform: string, accountId: string, staff: boolean): string {
  return `${staff ? ADMIN_OAUTH_BASE : "/api/ads/oauth"}/${platform}/start?account=${encodeURIComponent(accountId)}`;
}
