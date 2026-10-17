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

export type AppCodeResult = { check: CodeCheck | "offline"; staffId: string | null; attempts: number };

/** Ввод кода в приложении. */
export async function tryAppCode(requestId: string, code: string, now = Date.now()): Promise<AppCodeResult> {
  const db = serviceClient();
  if (!db) return { check: "offline", staffId: null, attempts: 0 };
  const reqHash = requestHash(requestId);
  const { data, error } = await db
    .from("app_login_codes")
    .select("staff_id, code_hash, attempts, expires_at, used_at")
    .eq("request_hash", reqHash)
    .maybeSingle();
  if (error) return { check: "offline", staffId: null, attempts: 0 };
  const row = (data ?? null) as CodeRow | null;
  const check = checkCode(row, reqHash, code, now);
  if (!row || (check !== "ok" && check !== "wrong")) return { check, staffId: row?.staff_id ?? null, attempts: row?.attempts ?? 0 };

  const patch = check === "ok" ? { used_at: new Date(now).toISOString() } : { attempts: row.attempts + 1 };
  const { data: changed } = await db
    .from("app_login_codes")
    .update(patch)
    .eq("request_hash", reqHash)
    .eq("attempts", row.attempts)
    .is("used_at", null)
    .select("id")
    .maybeSingle();
  // Обновление не легло — параллельный ввод успел раньше: этот не в счёт.
  if (!changed) return { check: check === "ok" ? "used" : "wrong", staffId: row.staff_id, attempts: row.attempts };
  return { check, staffId: row.staff_id, attempts: check === "wrong" ? row.attempts + 1 : row.attempts };
}
