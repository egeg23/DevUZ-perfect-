import type { NextRequest } from "next/server";

import { finishOAuth } from "@/lib/ads/oauth-routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Возврат от Яндекса или Google — адрес, зарегистрированный у площадок.
 * Сотрудника студии здесь не видно (кука панели — на `/admin`), поэтому его
 * возврат уходит на `/admin/ads/oauth/…/callback` (lib/ads/oauth-routes.ts).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  return finishOAuth(request, (await params).platform, false);
}
