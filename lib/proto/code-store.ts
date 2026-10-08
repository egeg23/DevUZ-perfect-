/**
 * Пароли на время в базе: выдать, найти живой, проверить куку доступа.
 *
 * Устройство пароля и куки — lib/proto/codes.ts, таблицы — миграция 0094
 * (proto_codes) и 0091 (showcase_codes, витрина globalex).
 */
import { CODE_TTL_MS, TEAM_TTL_MS, codeCookieMatches, isCode, newCode, protoCodeHash, showcaseCodeHash, type CodeKind } from "@/lib/proto/codes";
import { serviceClient } from "@/lib/supabase";

export type IssuedCode = { id: string; code: string; codeHash: string; expiresAt: string };

/**
 * Новый пароль к прототипу. Пароль клиента закрывает открытый макет:
 * с этой минуты по ссылке без пароля его не открыть.
 */
export async function issueProtoCode(protoId: string, kind: CodeKind, staffId: string | null, now = Date.now()): Promise<IssuedCode | null> {
  const db = serviceClient();
  if (!db) return null;
  const code = newCode();
  const codeHash = protoCodeHash(protoId, code);
  const expiresAt = new Date(now + (kind === "team" ? TEAM_TTL_MS : CODE_TTL_MS)).toISOString();
  const { data, error } = await db
    .from("proto_codes")
    .insert({ proto_id: protoId, code_hash: codeHash, kind, expires_at: expiresAt, created_by: staffId })
    .select("id")
    .single();
  if (error || !data) {
    console.error("пароль макета: не записался", error?.message);
    return null;
  }
  if (kind === "client") {
    await db.from("protos").update({ closed_at: new Date(now).toISOString() }).eq("id", protoId).is("closed_at", null);
  }
  return { id: String(data.id), code, codeHash, expiresAt };
}

/**
 * Доступ команды: «Открыть» в панели. Живой доступ этого сотрудника к этому
 * макету берётся повторно, пока до его конца больше часа, — чтобы каждый
 * клик не плодил строку.
 */
export async function teamAccess(protoId: string, staffId: string, now = Date.now()): Promise<Omit<IssuedCode, "code"> | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("proto_codes")
    .select("id, code_hash, expires_at")
    .eq("proto_id", protoId)
    .eq("kind", "team")
    .eq("created_by", staffId)
    .gt("expires_at", new Date(now + 60 * 60_000).toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) return { id: String(data.id), codeHash: String(data.code_hash), expiresAt: String(data.expires_at) };
  const issued = await issueProtoCode(protoId, "team", staffId, now);
  return issued ? { id: issued.id, codeHash: issued.codeHash, expiresAt: issued.expiresAt } : null;
}

/** Живой пароль клиента с таким значением — строка для куки, или null. */
export async function liveProtoCode(protoId: string, code: string): Promise<{ id: string; codeHash: string; expiresAt: string } | null> {
  const value = code.trim();
  if (!isCode(value)) return null;
  const db = serviceClient();
  if (!db) return null;
  const codeHash = protoCodeHash(protoId, value);
  const { data } = await db
    .from("proto_codes")
    .select("id, expires_at")
    .eq("proto_id", protoId)
    .eq("kind", "client")
    .eq("code_hash", codeHash)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? { id: String(data.id), codeHash, expiresAt: String(data.expires_at) } : null;
}

/** Кука доступа ещё действует: строка жива, принадлежит этому макету, подпись сходится. */
export async function codeAccess(protoId: string, cookie: { id: string; sig: string }): Promise<{ kind: CodeKind } | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("proto_codes")
    .select("proto_id, code_hash, kind, expires_at")
    .eq("id", cookie.id)
    .maybeSingle();
  if (!data || String(data.proto_id) !== protoId) return null;
  if (Date.parse(String(data.expires_at)) <= Date.now()) return null;
  if (!codeCookieMatches(cookie.sig, String(data.code_hash))) return null;
  return { kind: data.kind === "team" ? "team" : "client" };
}

/** Новый пароль к витрине globalex — та же таблица, которую читает сама витрина. */
export async function issueShowcaseCode(showcase: string, staffId: string | null, note: string, now = Date.now()): Promise<Omit<IssuedCode, "id" | "codeHash"> | null> {
  const db = serviceClient();
  if (!db) return null;
  const code = newCode();
  const expiresAt = new Date(now + CODE_TTL_MS).toISOString();
  const { error } = await db.from("showcase_codes").insert({
    showcase,
    code_hash: showcaseCodeHash(showcase, code),
    expires_at: expiresAt,
    created_by: staffId,
    note,
  });
  if (error) {
    console.error("пароль витрины: не записался", error.message);
    return null;
  }
  return { code, expiresAt };
}

/** До какой минуты живёт последний пароль клиента — по каждому макету, где он есть. */
export async function liveCodesUntil(): Promise<{ protos: Map<string, string>; showcases: Map<string, string> }> {
  const protos = new Map<string, string>();
  const showcases = new Map<string, string>();
  const db = serviceClient();
  if (!db) return { protos, showcases };
  const now = new Date().toISOString();
  // Только пароли на сутки: у Engelberg есть постоянный пароль владельца до
  // 2030 года, и «живой пароль до 2030» в списке сбивал бы с толку.
  const horizon = new Date(Date.now() + CODE_TTL_MS + 60 * 60_000).toISOString();
  const [p, s] = await Promise.all([
    db.from("proto_codes").select("proto_id, expires_at").eq("kind", "client").gt("expires_at", now).limit(2000),
    db.from("showcase_codes").select("showcase, expires_at").gt("expires_at", now).lte("expires_at", horizon).limit(2000),
  ]);
  const later = (map: Map<string, string>, key: string, at: string) => {
    const was = map.get(key);
    if (!was || was < at) map.set(key, at);
  };
  for (const row of p.data ?? []) later(protos, String(row.proto_id), String(row.expires_at));
  for (const row of s.data ?? []) later(showcases, String(row.showcase), String(row.expires_at));
  return { protos, showcases };
}
