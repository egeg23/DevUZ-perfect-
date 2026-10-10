import { NextResponse, type NextRequest } from "next/server";

import { canUseAccount } from "@/lib/ads/access";
import { tokenKey } from "@/lib/ads/crypto";
import { authorizeUrl, signState } from "@/lib/ads/oauth";
import { siteBase } from "@/lib/ads/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * «Подключить» у рекламного кабинета: уводит на страницу доступа Яндекса
 * или Google. Пускает только того, кто вправе менять этот кабинет.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const accountId = new URL(request.url).searchParams.get("account") ?? "";
  const access = await canUseAccount(accountId);
  if (!access || (platform !== "yandex" && platform !== "google") || access.account.platform !== platform) {
    return new Response("forbidden", { status: 403 });
  }
  const back = access.actor.kind === "staff" ? `/admin/ads/${accountId}` : `/ads/${accountId}`;
  const key = await tokenKey();
  const url = key ? await authorizeUrl(platform, signState(accountId, Date.now(), key)) : null;
  if (!url) return NextResponse.redirect(new URL(`${siteBase()}${back}?r=oauth_off`), 303);
  return NextResponse.redirect(url, 303);
}
