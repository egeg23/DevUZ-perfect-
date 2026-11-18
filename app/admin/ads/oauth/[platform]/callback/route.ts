import type { NextRequest } from "next/server";

import { finishOAuth } from "@/lib/ads/oauth-routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Возврат сотрудника студии: сюда переводит `/api/ads/oauth/…/callback`, когда не узнал человека без куки панели. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  return finishOAuth(request, (await params).platform, true);
}
