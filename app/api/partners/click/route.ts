import { NextResponse } from "next/server";

import { codeFromQuery, isBotAgent, visitorSeed } from "@/lib/partners/rules";
import { countClick } from "@/lib/partners/store";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Переход по партнёрской ссылке.
 *
 * Счётчик — статистика для партнёра («откуда приходят люди»), не деньги:
 * деньги считаются по оплаченным проектам. Защита простая: лимит на адрес,
 * роботы не считаются, один посетитель в день — один переход (хеш адреса,
 * браузера и дня; сам адрес не хранится).
 */
export async function POST(request: Request) {
  const gate = rateLimit(`partner-click:${clientIp(request)}`, { limit: 20, windowMs: 60_000 });
  if (!gate.ok) return NextResponse.json({ ok: false }, { status: 429 });

  let code: string | null = null;
  let from: unknown = null;
  try {
    const body = await request.json();
    code = codeFromQuery(body?.code);
    from = body?.from;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!code) return NextResponse.json({ ok: false }, { status: 400 });

  const ua = request.headers.get("user-agent") ?? "";
  if (isBotAgent(ua)) return NextResponse.json({ ok: false });
  const day = new Date().toISOString().slice(0, 10);
  // Откуда пришёл — со страницы-источника (document.referrer), а не из
  // заголовка: заголовок здесь всегда наш же сайт.
  let referer: string | null = null;
  try {
    referer = typeof from === "string" && from ? new URL(from).host || null : null;
  } catch {
    referer = null;
  }
  return NextResponse.json({ ok: await countClick(code, "site", visitorSeed(clientIp(request), ua, day), referer) });
}
