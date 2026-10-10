import { NextResponse, type NextRequest } from "next/server";

import { canUseAccount } from "@/lib/ads/access";
import { tokenKey } from "@/lib/ads/crypto";
import { exchangeCode, verifyState } from "@/lib/ads/oauth";
import { siteBase } from "@/lib/ads/session";
import { saveCredentials, updateAccount } from "@/lib/ads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Возврат от Яндекса или Google с кодом. Код принимается, только если state
 * подписан нами для этого кабинета полчаса назад или позже, и человек в
 * браузере по-прежнему вправе менять кабинет. Токен — сразу зашифрованным в
 * базу, в адресе и журнале его нет.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const url = new URL(request.url);
  const key = await tokenKey();
  const accountId = key ? verifyState(url.searchParams.get("state") ?? "", key) : null;
  const access = accountId ? await canUseAccount(accountId) : null;
  if (!access || (platform !== "yandex" && platform !== "google") || access.account.platform !== platform) {
    return new Response("forbidden", { status: 403 });
  }
  const back = (result: string) =>
    NextResponse.redirect(
      new URL(`${siteBase()}${access.actor.kind === "staff" ? "/admin/ads" : "/ads"}/${accountId}?r=${result}`),
      303,
    );
  const code = url.searchParams.get("code");
  if (!code) return back("oauth_denied");
  try {
    const tokens = await exchangeCode(platform, code);
    const saved = await saveCredentials(
      access.account.id,
      platform === "yandex"
        ? { token: tokens.access_token, refresh_token: tokens.refresh_token }
        : { refresh_token: tokens.refresh_token, access_token: tokens.access_token, expires_at: Date.now() + (tokens.expires_in ?? 3600) * 1000 },
    );
    if (!saved) return back("oauth_failed");
    if (platform === "google" && !tokens.refresh_token) {
      await updateAccount(access.account.id, { last_error: "Google не выдал долгий ключ — отзовите доступ DevUz в аккаунте Google и подключите снова." });
    }
    return back("oauth_ok");
  } catch (error) {
    console.error("ads oauth:", error instanceof Error ? error.message : error);
    return back("oauth_failed");
  }
}
