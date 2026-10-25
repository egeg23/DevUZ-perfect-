import {
  APP_CODE_TTL_MS,
  APP_REQUEST_TTL_MS,
  checkCode,
  codeHash,
  mintCode,
  requestHash,
  type CodeCheck,
  type CodeRow,
} from "@/lib/admin/app-login";
import { mintToken } from "@/lib/admin/session";
import { serviceClient } from "@/lib/supabase";

/**
 * Вход в приложение кодом — база (app_login_codes, 0168). Правила —
 * lib/admin/app-login.ts.
 *
 * Счёт неверных вводов и гашение кода — сравнением со старым значением в
 * условии обновления: две одновременные попытки не превращаются в лишний
 * ввод, а один верный код не даёт двух сессий.
 */

/** Новая попытка входа приложения. Возвращает ключ — он уходит в куку и ссылку. */
export async function startAppRequest(now = Date.now()): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const id = mintToken();
  const { error } = await db.from("app_login_codes").insert({ request_hash: requestHash(id) });
  if (error) {
    console.error("вход в приложение: попытка не записалась —", error.message);
    return null;
  }
  // Прибираем старое: строка нужна минуты, держать её сутками незачем.
  await db
    .from("app_login_codes")
    .delete()
    .lt("created_at", new Date(now - 24 * 3600_000).toISOString());
  return id;
}

/**
 * Бот выдаёт код сотруднику, нажавшему ссылку из приложения. Повторное
 * нажатие — новый код, старый перестаёт подходить, счёт вводов с нуля.
 * null — попытки нет или она старше 15 минут.
 */
export async function issueAppCode(requestId: string, staffId: string, now = Date.now()): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const reqHash = requestHash(requestId);
  const code = mintCode();
  const { data, error } = await db
    .from("app_login_codes")
    .update({
      staff_id: staffId,
      code_hash: codeHash(reqHash, code),
      attempts: 0,
      issued_at: new Date(now).toISOString(),
      expires_at: new Date(now + APP_CODE_TTL_MS).toISOString(),
      used_at: null,
    })
    .eq("request_hash", reqHash)
    .is("used_at", null)
    .gt("created_at", new Date(now - APP_REQUEST_TTL_MS).toISOString())
    .select("id")
    .maybeSingle();
  if (error || !data) return null;
  return code;
}

/**
 * Код по кнопке «🔑 Код для приложения» и /code в боте — к последнему входу,
 * начатому в приложении за 15 минут: ещё ничьему или уже этого сотрудника.
 * null — такого входа нет.
 */
export async function issueLatestAppCode(staffId: string, now = Date.now()): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const since = new Date(now - APP_REQUEST_TTL_MS).toISOString();
  const open = `staff_id.is.null,staff_id.eq.${staffId}`;
  const { data: row } = await db
    .from("app_login_codes")
    .select("id, request_hash")
    .is("used_at", null)
    .gt("created_at", since)
    .or(open)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) return null;
  const code = mintCode();
  const { data, error } = await db
    .from("app_login_codes")
    .update({
      staff_id: staffId,
      code_hash: codeHash(String(row.request_hash), code),
      attempts: 0,
      issued_at: new Date(now).toISOString(),
      expires_at: new Date(now + APP_CODE_TTL_MS).toISOString(),
      used_at: null,
    })
    .eq("id", row.id)
    .is("used_at", null)
    .or(open)
    .select("id")
    .maybeSingle();
  if (error || !data) return null;
  return code;
}

export type AppCodeResult = { check: CodeCheck | "offline"; staffId: string | null; attempts: number };

/**
 * Ввод кода в приложении.
 *
 * Попытка засчитывается в базе ДО того, как человек узнает ответ: сначала
 * attempts + 1 (условно, по прежнему значению), и только если запись легла —
 * «верно» или «неверно». Иначе параллельные запросы проверяли бы код каждый,
 * а засчитывался бы только один, и пять попыток превращались бы в сотни.
 * Не удалось записать попытку за три круга — ответ «неверно», код не сверяли.
 */
export async function tryAppCode(requestId: string, code: string, now = Date.now()): Promise<AppCodeResult> {
  const db = serviceClient();
  if (!db) return { check: "offline", staffId: null, attempts: 0 };
  const reqHash = requestHash(requestId);
  for (let round = 0; round < 3; round++) {
    const { data, error } = await db
      .from("app_login_codes")
      .select("staff_id, code_hash, attempts, expires_at, used_at")
      .eq("request_hash", reqHash)
      .maybeSingle();
    if (error) return { check: "offline", staffId: null, attempts: 0 };
    const row = (data ?? null) as CodeRow | null;
    const check = checkCode(row, reqHash, code, now);
    if (!row || (check !== "ok" && check !== "wrong")) return { check, staffId: row?.staff_id ?? null, attempts: row?.attempts ?? 0 };

    const { data: counted } = await db
      .from("app_login_codes")
      .update({ attempts: row.attempts + 1 })
      .eq("request_hash", reqHash)
      .eq("attempts", row.attempts)
      .is("used_at", null)
      .select("id")
      .maybeSingle();
    // Параллельный ввод успел раньше — перечитываем и пробуем записать снова.
    if (!counted) continue;
    const attempts = row.attempts + 1;
    if (check === "wrong") return { check, staffId: row.staff_id, attempts };

    const { data: used } = await db
      .from("app_login_codes")
      .update({ used_at: new Date(now).toISOString() })
      .eq("request_hash", reqHash)
      .is("used_at", null)
      .select("id")
      .maybeSingle();
    return { check: used ? "ok" : "used", staffId: row.staff_id, attempts };
  }
  return { check: "wrong", staffId: null, attempts: 0 };
}
