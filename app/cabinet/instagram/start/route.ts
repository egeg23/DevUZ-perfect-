import { NextResponse } from "next/server";

import { canConfigure, currentCabinet } from "@/lib/ai-staff/auth";
import { channelsLeft } from "@/lib/ai-staff/channels";
import { authorizeUrl, igConfig, signState } from "@/lib/ai-staff/instagram";
import { channels, serviceEnabled } from "@/lib/ai-staff/store";
import { appSecret } from "@/lib/secrets";
import { absoluteUrl } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** «Подключить Instagram»: только владельцу кабинета, state подписан и привязан к клиенту. */
export async function GET() {
  if (!(await serviceEnabled())) return new Response("not found", { status: 404 });
  const cabinet = await currentCabinet();
  if (!cabinet?.tenant || !canConfigure(cabinet.role)) return NextResponse.redirect(absoluteUrl("cabinet/login"));
  const [cfg, key] = await Promise.all([igConfig(), appSecret("AI_STAFF_KEY")]);
  if (!cfg || !key) return NextResponse.redirect(absoluteUrl("cabinet/channels?n=ig_off"));
  if (channelsLeft(cabinet.tenant.plan, await channels(cabinet.tenant.id), "instagram") < 0) {
    return NextResponse.redirect(absoluteUrl("cabinet/channels?n=limit"));
  }
  return NextResponse.redirect(authorizeUrl(cfg.appId, signState(cabinet.tenant.id, key)));
}
