import { NextResponse, type NextRequest } from "next/server";

import { canConfigure, currentCabinet } from "@/lib/ai-staff/auth";
import { sealToken } from "@/lib/ai-staff/crypto";
import { exchangeCode, igConfig, readState } from "@/lib/ai-staff/instagram";
import { saveInstagramChannel, serviceEnabled } from "@/lib/ai-staff/store";
import { appSecret } from "@/lib/secrets";
import { absoluteUrl } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Возврат из Instagram после «Разрешить». Клиент — из подписанного state и
 * он же должен быть открыт в кабинете у того, кто вернулся: ссылку с чужим
 * state в свой кабинет не подсунуть.
 */
export async function GET(request: NextRequest) {
  if (!(await serviceEnabled())) return new Response("not found", { status: 404 });
  const back = (n: string) => NextResponse.redirect(absoluteUrl(`cabinet/channels?n=${n}`));
  const q = request.nextUrl.searchParams;
  const cabinet = await currentCabinet();
  const [cfg, key] = await Promise.all([igConfig(), appSecret("AI_STAFF_KEY")]);
  if (!cabinet?.tenant || !canConfigure(cabinet.role)) return NextResponse.redirect(absoluteUrl("cabinet/login"));
  if (!cfg || !key) return back("ig_off");
  const tenantId = readState(q.get("state") ?? "", key);
  const code = q.get("code");
  if (!code || tenantId !== cabinet.tenant.id) return back("ig_fail");
  const account = await exchangeCode(cfg, code);
  if (!account) return back("ig_fail");
  try {
    await saveInstagramChannel(cabinet.tenant.id, {
      igId: account.igId,
      username: account.username,
      tokenEnc: sealToken(account.token, key),
      expiresAt: account.expiresAt,
    });
  } catch (error) {
    return back((error as Error).message === "instagram_taken" ? "taken" : "ig_fail");
  }
  return back("ig_ok");
}
