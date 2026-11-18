import type { NextRequest } from "next/server";

import { startOAuth } from "@/lib/ads/oauth-routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** «Подключить» участника кабинета агентства. Команда студии — `/admin/ads/oauth/…` (lib/ads/oauth-routes.ts). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  return startOAuth(request, (await params).platform);
}
