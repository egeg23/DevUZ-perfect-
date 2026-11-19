import { bearerOf, verifyGithubOidc } from "@/lib/admin/github-oidc";
import { CF_OIDC, CF_TRANSLATE_UNTIL, cfToken, cfTranslateOpen } from "@/lib/czechfarm/translate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Пропуск к переводу для сервера CZECHFARM. Выдаётся только задаче
 * «Сайт CZECHFARM: сервер компании» с main (пропуск GitHub, OIDC): она
 * кладёт его в .env их сервера. Срок вышел — пропуска нет.
 */
export async function POST(request: Request) {
  const oidc = bearerOf(request.headers.get("authorization"));
  if (!oidc) return Response.json({ ok: false, why: "forbidden" }, { status: 403 });
  const check = await verifyGithubOidc(oidc, CF_OIDC);
  if (!check.ok) {
    console.error("czechfarm-translate: пропуск GitHub не принят", check.why);
    return Response.json({ ok: false, why: "forbidden" }, { status: 403 });
  }
  if (!cfTranslateOpen()) return Response.json({ ok: false, why: "expired", until: CF_TRANSLATE_UNTIL }, { status: 410 });
  const token = cfToken();
  if (!token) return Response.json({ ok: false, why: "no_base" }, { status: 503 });
  return Response.json({ ok: true, token, until: CF_TRANSLATE_UNTIL });
}
