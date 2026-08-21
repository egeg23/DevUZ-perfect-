import { isLocale, type Locale } from "@/lib/i18n";
import {
  MAX_MESSAGE_CHARS,
  MAX_TURNS,
  runQualifyTurn,
  type TurnEvent,
} from "@/lib/qualify/engine";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";
import { shouldMissPromise } from "@/lib/qualify/promise";
import type { ChatMessage } from "@/lib/qualify/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sse(event: unknown): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function badRequest(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Ключа нет — фронт покажет обычную форму. Это штатный режим, а не сбой.
    return Response.json({ error: "chat_disabled" }, { status: 503 });
  }

  const limit = rateLimit(`chat:${clientIp(request)}`, {
    limit: 30,
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
    discount?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid_json");
  }

  const locale: Locale = isLocale(body.locale as string) ? (body.locale as Locale) : "ru";

  // Клиент помечает диалог, по которому бриф уже ушёл. Подделать флаг можно,
  // но выигрыша это не даёт: единственное последствие — собственная заявка
  // не дойдёт до менеджера.
  const alreadyQualified = body.qualified === true;
  const discount = body.discount === true;

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return badRequest("messages_required");
  }
  if (body.messages.length > MAX_TURNS) {
    return badRequest("conversation_too_long", 413);
  }

  const history: ChatMessage[] = [];
  for (const raw of body.messages) {
    const item = raw as Partial<ChatMessage>;
    if (item?.role !== "user" && item?.role !== "assistant") {
      return badRequest("invalid_message_role");
    }
    if (typeof item.content !== "string" || !item.content.trim()) {
      return badRequest("invalid_message_content");
    }
    history.push({ role: item.role, content: item.content.slice(0, MAX_MESSAGE_CHARS) });
  }

  // Задержка назначается только на первой реплике разговора: обещание
  // касается скорости ответа, а не каждого сообщения подряд.
  const hold = history.length === 1 && !discount ? shouldMissPromise() : 0;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (event: unknown) => controller.enqueue(encoder.encode(sse(event)));

      try {
        if (hold > 0) {
          // Поток открыт, но пуст: клиент в это время ведёт свой отсчёт от
          // момента отправки и сам покажет, что гарантия не сработала.
          // Держать таймер на клиенте, а не ждать сигнала отсюда, — значит
          // честно мерить то, что видит человек: его двадцать секунд идут
          // и при медленной сети, и при медленной модели.
          await new Promise((resolve) => setTimeout(resolve, hold));
        }

        const result = await runQualifyTurn({
          history,
          locale,
          source: "chat",
          alreadyQualified,
          discount,
          onText: (value) => push({ type: "text", value }),
          onEvent: (event: TurnEvent) => {
            if (event.type === "qualified") {
              push({
                type: "qualified",
                grade: event.lead.grade,
                priority: event.lead.priority,
                requestNo: event.requestNo,
                delivered: event.delivered,
              });
            } else {
              push({ type: event.type });
            }
          },
        });

        push({ type: "done", qualified: result.qualified });
        controller.close();
      } catch (error) {
        console.error("chat", error);
        push({ type: "error" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
