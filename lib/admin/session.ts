import { createHash, randomBytes } from "node:crypto";

import { serviceClient } from "@/lib/supabase";

/**
 * Имя куки. Путь у неё — /admin, а не корень: на публичных страницах она
 * не нужна ни разу, а всё, что не отправляется, невозможно и перехватить.
 * Отсюда же требование к самой панели: любой её endpoint живёт под /admin,
 * включая server actions (они постятся на адрес текущей страницы).
 */
export const SESSION_COOKIE = "devuz_admin";

/**
 * Скользящий срок: продлевается при каждом запросе, чтобы человека,
 * работающего весь день, не выбрасывало посреди разговора с клиентом.
 */
export const SLIDING_HOURS = 12;

/**
 * Абсолютный срок. Не продлевается никогда — иначе одна украденная кука
 * живёт вечно, и отобрать её можно только сменой ключа базы.
 */
export const ABSOLUTE_DAYS = 7;

/** Ссылка входа живёт минутами: её пересылают, теряют и забывают в чатах. */
export const LOGIN_TOKEN_MINUTES = 15;

export type Staff = {
  id: string;
  telegram_user_id: number;
  username: string | null;
  display_name: string;
  role: "admin" | "manager";
};

/**
 * Секрет для куки или ссылки входа.
 *
 * 32 байта из системного генератора. Не Math.random(): его выход
 * предсказуем по нескольким предыдущим значениям, и токен сессии,
 * выданный им, подбирается, а не угадывается.
 */
export function mintToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * В базе лежит только хеш. Дамп базы — а это самое вероятное, что из неё
 * утечёт, — не даёт войти ни под кем: восстановить токен из sha256 нельзя.
 * Соль не нужна: токен и так 256 бит случайности, словарём его не берут.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Здесь было сравнение хешей за постоянное время. Его убрали, и это
// сознательное решение, а не упрощение.
//
// Функцию не вызывал никто: сессия ищется в базе равенством по
// проиндексированному хешу, то есть сравнение делает Postgres, а
// сравнивается хеш, а не секрет. Подобрать по времени ответа нечего.
//
// Проверенная тестом функция, которую никто не вызывает, — худший вид
// защитного кода: модуль выглядит осторожнее, чем он есть, тест зелёный, и
// заметить подмену некому. Отсутствующая защита честнее мнимой.

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

// ───────────────────────────────────────────────────────────────────────────
// Одноразовые ссылки входа
// ───────────────────────────────────────────────────────────────────────────

/**
 * Выдать ссылку входа сотруднику. Возвращает сам токен — он существует
 * ровно в этом ответе и в письме бота, в базу уходит только хеш.
 */
export async function issueLoginToken(staffId: string): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;

  const token = mintToken();
  const { error } = await db.from("login_tokens").insert({
    staff_id: staffId,
    token_hash: hashToken(token),
    expires_at: hoursFromNow(LOGIN_TOKEN_MINUTES / 60),
  });

  if (error) {
    console.error("admin: не выдал ссылку входа", error);
    return null;
  }
  return token;
}

/**
 * Обменять ссылку на сессию.
 *
 * Токен гасится тем же запросом, которым читается: `used_at is null` в
 * условии обновления — это проверка и запись одной операцией, поэтому две
 * одновременные попытки открыть одну ссылку дают сессию ровно одной.
 * Разделённые «прочитать, потом пометить» дали бы обеим.
 */
export async function consumeLoginToken(token: string): Promise<Staff | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data, error } = await db
    .from("login_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", hashToken(token))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("staff_id")
    .maybeSingle();

  if (error || !data) return null;
  return staffById(data.staff_id as string);
}

// ───────────────────────────────────────────────────────────────────────────
// Сессии
// ───────────────────────────────────────────────────────────────────────────

export async function createSession(
  staffId: string,
  ip: string | null,
  userAgent: string | null,
): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;

  const token = mintToken();
  const { error } = await db.from("staff_sessions").insert({
    staff_id: staffId,
    token_hash: hashToken(token),
    expires_at: hoursFromNow(SLIDING_HOURS),
    absolute_expires_at: hoursFromNow(ABSOLUTE_DAYS * 24),
    ip,
    // Сам User-Agent не храним: это отпечаток браузера, а он ничего не
    // решает — нужен только факт «зашли из другого места».
    ua_hash: userAgent ? hashToken(userAgent).slice(0, 16) : null,
  });

  if (error) {
    console.error("admin: не создал сессию", error);
    return null;
  }
  return token;
}

/**
 * Кто пришёл с этой кукой. Заодно продлевает скользящий срок — но никогда
 * не трогает абсолютный.
 *
 * Проверка `is_active` делается здесь, а не только при входе: уволенный
 * сотрудник теряет доступ в тот же запрос, а не через двенадцать часов.
 */
export async function staffForSession(token: string): Promise<Staff | null> {
  const db = serviceClient();
  if (!db) return null;

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("staff_sessions")
    .select("id, staff_id, expires_at, absolute_expires_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error || !data) return null;
  if ((data.expires_at as string) <= now) return null;
  if ((data.absolute_expires_at as string) <= now) return null;

  const staff = await staffById(data.staff_id as string);
  if (!staff) return null;

  await db
    .from("staff_sessions")
    .update({ expires_at: hoursFromNow(SLIDING_HOURS), last_seen_at: now })
    .eq("id", data.id as string);

  return staff;
}

export async function destroySession(token: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("staff_sessions").delete().eq("token_hash", hashToken(token));
}

// ───────────────────────────────────────────────────────────────────────────
// Сотрудники
// ───────────────────────────────────────────────────────────────────────────

/**
 * Колонки перечислены поимённо во всех запросах файла. select("*") здесь
 * запрещён осознанно: добавленная завтра колонка поедет в панель сама, без
 * решения о том, можно ли её там показывать.
 */
const STAFF_COLUMNS = "id, telegram_user_id, username, display_name, role";

export async function staffById(id: string): Promise<Staff | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data } = await db
    .from("staff")
    .select(STAFF_COLUMNS)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  return (data as Staff | null) ?? null;
}

export async function staffByTelegramId(telegramId: number): Promise<Staff | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data } = await db
    .from("staff")
    .select(STAFF_COLUMNS)
    .eq("telegram_user_id", telegramId)
    .eq("is_active", true)
    .maybeSingle();

  return (data as Staff | null) ?? null;
}
