import { bearerOf, verifyGithubOidc } from "@/lib/admin/github-oidc";
import { CF_OIDC } from "@/lib/czechfarm/translate";
import { readAppSecret } from "@/lib/secrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Вид отпечатка пароля панели CZECHFARM (scrypt, `hashPass` в их crypt.mjs). */
const CF_SUPPORT_HASH = /^s1:[A-Za-z0-9+/=]{8,}:[A-Za-z0-9+/=]{8,}$/;

/**
 * Вход техподдержки DevUz в панель CZECHFARM (владелец, 23.11.2026: «логин
 * пароль для технической поддержки нашей… Доступы как у главного админа»).
 * Отдаёт только отпечаток пароля из хранилища (app.CZECHFARM_SUPPORT_HASH) и
 * только задаче «Сайт CZECHFARM: сервер компании» с main — по пропуску GitHub.
 * Сам пароль лежит в хранилище рядом (app.CZECHFARM_SUPPORT_PASS) и сюда не идёт.
 */
export async function POST(request: Request) {
  const oidc = bearerOf(request.headers.get("authorization"));
  if (!oidc) return Response.json({ ok: false, why: "forbidden" }, { status: 403 });
  const check = await verifyGithubOidc(oidc, CF_OIDC);
  if (!check.ok) {
    console.error("czechfarm-support: пропуск GitHub не принят", check.why);
    return Response.json({ ok: false, why: "forbidden" }, { status: 403 });
  }
  const { value } = await readAppSecret("CZECHFARM_SUPPORT_HASH");
  if (!value || !CF_SUPPORT_HASH.test(value)) return Response.json({ ok: false, why: "no_hash" }, { status: 503 });
  return Response.json({ ok: true, hash: value });
}
