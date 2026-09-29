import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_COOKIE, cookieBase } from "@/lib/clients/maximova/session";
import { LOGIN_TTL_MS, startLogin } from "@/lib/clients/maximova/store";
import { botConfig, loginLink } from "@/lib/clients/maximova/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Начать вход: выдать ссылку на бота и запомнить браузер. */
export async function POST(request: NextRequest) {
  const config = botConfig();
  if (!config) return NextResponse.json({ ok: false, error: "Вход через Telegram ещё не подключён." }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { consent?: unknown };
  if (body.consent !== true) {
    return NextResponse.json({ ok: false, error: "Отметьте согласие на обработку персональных данных." }, { status: 422 });
  }

  const { loginToken, nonce } = startLogin(true);
  const response = NextResponse.json({ ok: true, token: loginToken, link: loginLink(config.username, loginToken) });
  response.cookies.set(LOGIN_COOKIE, nonce, { ...cookieBase, maxAge: LOGIN_TTL_MS / 1000 });
  return response;
}
