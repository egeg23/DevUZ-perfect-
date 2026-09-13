import { NextResponse } from "next/server";

import { codeFromQuery } from "@/lib/partners/rules";
import { countClick } from "@/lib/partners/store";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Переход по партнёрской ссылке.
 *
 * Счётчик — статистика для партнёра («откуда приходят люди»), не деньги:
 * деньги считаются по оплаченным проектам. Поэтому защита здесь простая —
 * лимит на адрес, чтобы скрипт не накрутил тысячи за минуту, — а не
 * доказательство уникальности посетителя.
 */
export async function POST(request: Request) {
  const gate = rateLimit(`partner-click:${clientIp(request)}`, { limit: 20, windowMs: 60_000 });
  if (!gate.ok) return NextResponse.json({ ok: false }, { status: 429 });

  let code: string | null = null;
  try {
    code = codeFromQuery((await request.json())?.code);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!code) return NextResponse.json({ ok: false }, { status: 400 });

  return NextResponse.json({ ok: await countClick(code) });
}
