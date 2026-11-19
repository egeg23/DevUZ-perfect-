import { bearerOf } from "@/lib/admin/github-oidc";
import { CF_DAILY, CF_TRANSLATE_UNTIL, cfRequestOf, cfToken, cfTranslateOpen } from "@/lib/czechfarm/translate";
import { cfDayCount, cfNoteUse, cfTranslate } from "@/lib/czechfarm/translate-run";
import { secretOk } from "@/lib/secret-ok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Перевод текстов панели сайта CZECHFARM (lib/czechfarm/translate.ts):
 * только с пропуском их сервера и только до CF_TRANSLATE_UNTIL.
 */
export async function POST(request: Request) {
  if (!secretOk(bearerOf(request.headers.get("authorization")), cfToken())) {
    return Response.json({ ok: false, why: "forbidden" }, { status: 403 });
  }
  if (!cfTranslateOpen()) return Response.json({ ok: false, why: "expired", until: CF_TRANSLATE_UNTIL }, { status: 410 });
  const { day, n } = cfDayCount();
  if (n >= CF_DAILY) return Response.json({ ok: false, why: "daily" }, { status: 429 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, why: "json" }, { status: 400 });
  }
  const req = cfRequestOf(body);
  if (typeof req === "string") return Response.json({ ok: false, why: req }, { status: 400 });
  cfNoteUse(day);
  const result = await cfTranslate(req);
  if ("error" in result) return Response.json({ ok: false, why: result.error }, { status: 503 });
  return Response.json({ ok: true, until: CF_TRANSLATE_UNTIL, ...result });
}
