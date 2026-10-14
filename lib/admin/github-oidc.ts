import { createPublicKey, verify, type JsonWebKey } from "node:crypto";

/**
 * Пропуск задачи GitHub Actions без общего секрета — OIDC.
 *
 * Задача «Голосовые — расшифровка» ходит к нам за звуком голосового и
 * отдаёт текст. Общий секрет смен (SHIFT_REPORT_SECRET) в секретах
 * репозитория пуст — первый прогон получил «HTTP 403, секрет пуст», — а
 * переносить секрет с боевого сервера в открытый репозиторий нельзя.
 *
 * Поэтому пропуск выдаёт сам GitHub: задача с `id-token: write` получает
 * подписанный GitHub токен, где написано, какой репозиторий, какая задача и
 * с какой ветки его попросили. Мы проверяем подпись по открытым ключам
 * GitHub и эти поля. Подделать такой токен без ключа GitHub нельзя, а
 * копия репозитория или чужая ветка получит токен с другими полями.
 */

export const GITHUB_ISSUER = "https://token.actions.githubusercontent.com";
const JWKS_URL = `${GITHUB_ISSUER}/.well-known/jwks`;

/** Ключи GitHub меняются редко: держим час, неизвестный kid — перечитываем. */
const JWKS_TTL_MS = 60 * 60_000;

/** Часы сервера и GitHub могут разойтись — минута запаса. */
const LEEWAY_S = 60;

export type OidcExpect = {
  /** Кому выписан токен: задача просит его с этим audience. */
  audience: string;
  /** Номер репозитория, а не имя: имя можно занять после переименования. */
  repositoryId: string;
  /** Задача и ветка: «владелец/репо/.github/workflows/файл.yml@refs/heads/main». */
  workflowRef: string;
};

export type OidcClaims = {
  iss?: unknown;
  aud?: unknown;
  exp?: unknown;
  nbf?: unknown;
  repository_id?: unknown;
  workflow_ref?: unknown;
};

type Jwt = { header: { alg?: string; kid?: string }; claims: OidcClaims; signed: string; signature: Buffer };

function b64json(part: string): unknown {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

/** Разобрать токен на части. Не токен — null. Подпись здесь не проверяется. */
export function parseJwt(token: string): Jwt | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((p) => !p)) return null;
  try {
    const header = b64json(parts[0]) as Jwt["header"];
    const claims = b64json(parts[1]) as OidcClaims;
    if (!header || typeof header !== "object" || !claims || typeof claims !== "object") return null;
    return { header, claims, signed: `${parts[0]}.${parts[1]}`, signature: Buffer.from(parts[2], "base64url") };
  } catch {
    return null;
  }
}

/** Что не так с полями токена. null — всё сходится. */
export function claimsProblem(claims: OidcClaims, expect: OidcExpect, nowS: number): string | null {
  if (claims.iss !== GITHUB_ISSUER) return "issuer";
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(expect.audience)) return "audience";
  if (typeof claims.exp !== "number" || claims.exp + LEEWAY_S < nowS) return "expired";
  if (typeof claims.nbf === "number" && claims.nbf - LEEWAY_S > nowS) return "not_yet";
  if (String(claims.repository_id ?? "") !== expect.repositoryId) return "repository";
  if (claims.workflow_ref !== expect.workflowRef) return "workflow";
  return null;
}

let cache: { keys: (JsonWebKey & { kid?: string })[]; at: number } | null = null;

async function githubKeys(force: boolean, now: number): Promise<(JsonWebKey & { kid?: string })[]> {
  if (!force && cache && now - cache.at < JWKS_TTL_MS) return cache.keys;
  try {
    const response = await fetch(JWKS_URL, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return cache?.keys ?? [];
    const body = (await response.json()) as { keys?: (JsonWebKey & { kid?: string })[] };
    cache = { keys: Array.isArray(body.keys) ? body.keys : [], at: now };
    return cache.keys;
  } catch (error) {
    console.error("github oidc: ключи", error);
    return cache?.keys ?? [];
  }
}

/** Подпись RS256 по ключу из JWKS. */
export function signatureOk(jwt: Jwt, key: JsonWebKey): boolean {
  if (jwt.header.alg !== "RS256") return false;
  try {
    return verify("RSA-SHA256", Buffer.from(jwt.signed), createPublicKey({ key, format: "jwk" }), jwt.signature);
  } catch {
    return false;
  }
}

/** Проверить токен из заголовка `Authorization: Bearer …`. */
export async function verifyGithubOidc(
  token: string,
  expect: OidcExpect,
  now = Date.now(),
): Promise<{ ok: true } | { ok: false; why: string }> {
  const jwt = parseJwt(token);
  if (!jwt) return { ok: false, why: "malformed" };
  const problem = claimsProblem(jwt.claims, expect, Math.floor(now / 1000));
  if (problem) return { ok: false, why: problem };
  let keys = await githubKeys(false, now);
  let key = keys.find((k) => k.kid === jwt.header.kid);
  if (!key) {
    keys = await githubKeys(true, now);
    key = keys.find((k) => k.kid === jwt.header.kid);
  }
  if (!key) return { ok: false, why: "unknown_key" };
  return signatureOk(jwt, key) ? { ok: true } : { ok: false, why: "signature" };
}

export function bearerOf(header: string | null): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(header?.trim() ?? "");
  return match ? match[1] : null;
}
