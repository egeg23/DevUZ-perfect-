/**
 * Как выглядят ключи OAuth-клиента Google — проверка до записи в хранилище
 * («Ключи приложения Google» в «Рекламе», app/admin/ads/google-actions.ts).
 * Неверное поле не пишется: иначе кнопка «Подключить» вела бы на ошибку Google.
 */
export const CLIENT_ID = /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/;
export const CLIENT_SECRET = /^[A-Za-z0-9_-]{20,80}$/;

/** Что из двух полей записать. null — есть неверное поле или оба пусты: не пишем ничего. */
export function googleKeysToSave(id: string, secret: string): { GOOGLE_ADS_CLIENT_ID?: string; GOOGLE_ADS_CLIENT_SECRET?: string } | null {
  const cleanId = id.trim();
  const cleanSecret = secret.trim();
  if (!cleanId && !cleanSecret) return null;
  if (cleanId && !CLIENT_ID.test(cleanId)) return null;
  if (cleanSecret && !CLIENT_SECRET.test(cleanSecret)) return null;
  return {
    ...(cleanId ? { GOOGLE_ADS_CLIENT_ID: cleanId } : {}),
    ...(cleanSecret ? { GOOGLE_ADS_CLIENT_SECRET: cleanSecret } : {}),
  };
}
