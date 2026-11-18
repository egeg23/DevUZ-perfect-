import { after, NextResponse, type NextRequest } from "next/server";

import { canUseAccount } from "@/lib/ads/access";
import { ADMIN_OAUTH_BASE } from "@/lib/ads/connect-href";
import { tokenKey } from "@/lib/ads/crypto";
import { authorizeUrl, exchangeCode, signState, verifyState } from "@/lib/ads/oauth";
import { syncAccount } from "@/lib/ads/run";
import { siteBase } from "@/lib/ads/session";
import { accountById, saveCredentials, updateAccount } from "@/lib/ads/store";

/**
 * Вход в Яндекс и Google для рекламного кабинета — одни и те же обработчики
 * под двумя адресами.
 *
 * Кука панели живёт только на `/admin` (middleware.ts), поэтому сотрудник
 * студии под `/api/...` для сервера никто: 18.11.2026 «Подключить» у
 * владельца отвечало «forbidden». Команда входит через
 * `/admin/ads/oauth/<площадка>/start`, участник кабинета агентства — через
 * `/api/...` (его кука — на весь сайт). Адрес возврата у Яндекса и Google
 * зарегистрирован один, `/api/ads/oauth/<площадка>/callback`: если там
 * кабинет не узнал человека, а state наш и свежий, возврат переводится на
 * `/admin/...` — туда браузер принесёт куку панели, и проверка прав
 * повторяется уже с ней. На `/admin` второй раз не переводим.
 */

function supported(platform: string): platform is "yandex" | "google" {
  return platform === "yandex" || platform === "google";
}

export async function startOAuth(request: NextRequest, platform: string): Promise<Response> {
  const accountId = new URL(request.url).searchParams.get("account") ?? "";
  const access = await canUseAccount(accountId);
  if (!access || !supported(platform) || access.account.platform !== platform) {
    return new Response("forbidden", { status: 403 });
  }
  const back = access.actor.kind === "staff" ? `/admin/ads/${accountId}` : `/ads/${accountId}`;
  const key = await tokenKey();
  const url = key ? await authorizeUrl(platform, signState(accountId, Date.now(), key)) : null;
  if (!url) return NextResponse.redirect(new URL(`${siteBase()}${back}?r=oauth_off`), 303);
  return NextResponse.redirect(url, 303);
}

export async function finishOAuth(request: NextRequest, platform: string, viaAdmin: boolean): Promise<Response> {
  const url = new URL(request.url);
  const key = await tokenKey();
  const accountId = key ? verifyState(url.searchParams.get("state") ?? "", key) : null;
  const access = accountId ? await canUseAccount(accountId) : null;
  if (!access || !supported(platform) || access.account.platform !== platform) {
    if (accountId && !viaAdmin && supported(platform)) {
      return NextResponse.redirect(new URL(`${siteBase()}${ADMIN_OAUTH_BASE}/${platform}/callback${url.search}`), 303);
    }
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
    // Первое обновление — сразу, а не через сутки: человек подключил кабинет
    // и ждёт увидеть предложения. После ответа: забор отчётов не держит редирект.
    after(async () => {
      const fresh = await accountById(access.account.id);
      if (fresh) await syncAccount(fresh).catch((error) => console.error("ads first sync:", error));
    });
    return back("oauth_ok");
  } catch (error) {
    console.error("ads oauth:", error instanceof Error ? error.message : error);
    return back("oauth_failed");
  }
}
