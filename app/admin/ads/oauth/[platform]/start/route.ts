import type { NextRequest } from "next/server";

import { startOAuth } from "@/lib/ads/oauth-routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** «Подключить» у рекламного кабинета для команды студии: под `/admin` браузер несёт куку панели. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  return startOAuth(request, (await params).platform);
}
