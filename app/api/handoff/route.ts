import { company } from "@/content/company";
import { isLocale, type Locale } from "@/lib/i18n";
import { MAX_MESSAGE_CHARS, MAX_TURNS } from "@/lib/qualify/engine";
import { createHandoff } from "@/lib/qualify/handoff";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";
import type { ChatMessage } from "@/lib/qualify/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Переезд разговора с сайта в Telegram.
 *
 * Возвращает ссылку вида t.me/бот?start=токен. По ней Telegram показывает
 * кнопку «Старт», и уже первое нажатие приносит боту токен — то есть человек
 * ничего не печатает, а разговор продолжается с той же реплики, на которой
 * прервался.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`handoff:${clientIp(request)}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: {
    messages?: unknown;
    locale?: unknown;
    qualified?: unknown;
    requestNo?: unknown;
    discount?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const locale: Locale = isLocale(body.locale as string) ? (body.locale as Locale) : "ru";

  const transcript: ChatMessage[] = [];
  if (Array.isArray(body.messages)) {
    for (const raw of body.messages.slice(-MAX_TURNS)) {
      const item = raw as Partial<ChatMessage>;
      if (item?.role !== "user" && item?.role !== "assistant") continue;
      if (typeof item.content !== "string" || !item.content.trim()) continue;
      transcript.push({ role: item.role, content: item.content.slice(0, MAX_MESSAGE_CHARS) });
    }
  }

  const requestNo =
    typeof body.requestNo === "string" && /^DZ-\d{4}-[A-Z0-9]{4}$/.test(body.requestNo)
      ? body.requestNo
      : undefined;

  const token = createHandoff({
    locale,
    transcript,
    qualified: body.qualified === true,
    requestNo,
    discount: body.discount === true,
  });

  return Response.json({ url: `https://t.me/${company.telegram}?start=${token}` });
}
