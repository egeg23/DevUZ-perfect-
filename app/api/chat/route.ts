import Anthropic from "@anthropic-ai/sdk";

import { isLocale, type Locale } from "@/lib/i18n";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";
import { buildSystemPrompt } from "@/lib/qualify/prompt";
import { scoreLead } from "@/lib/qualify/scoring";
import { saveLead } from "@/lib/qualify/store";
import { sendLead } from "@/lib/qualify/telegram";
import { qualifyLeadTool } from "@/lib/qualify/tool";
import type { ChatMessage, QualifyToolInput } from "@/lib/qualify/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

/**
 * Потолок на реплику.
 *
 * Тысяча токенов — это осознанно мало. Ассистент первой линии должен писать
 * две-четыре фразы; всё, что длиннее, читается как отписка бота и роняет
 * конверсию сильнее, чем любая недосказанность.
 */
const MAX_TOKENS = 1024;

/** Диалог, который не сошёлся за столько реплик, не сойдётся и дальше. */
const MAX_TURNS = 22;
const MAX_MESSAGE_CHARS = 2000;

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

  let body: { messages?: unknown; locale?: unknown };
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid_json");
  }

  const locale: Locale = isLocale(body.locale as string) ? (body.locale as Locale) : "ru";

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

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (event: unknown) => controller.enqueue(encoder.encode(sse(event)));

      try {
        const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const shared = {
          model: MODEL,
          max_tokens: MAX_TOKENS,
          // Системный промпт неизменен между репликами, поэтому кэшируется:
          // это самая тяжёлая часть запроса, и платить за неё на каждой
          // реплике диалога незачем.
          system: [
            {
              type: "text" as const,
              text: buildSystemPrompt(locale),
              cache_control: { type: "ephemeral" as const },
            },
          ],
          tools: [qualifyLeadTool as unknown as Anthropic.Beta.BetaToolUnion],
          // Разговор с посетителем не требует глубоких размышлений, а вот
          // задержка в нём видна сразу — отсюда пониженный уровень усилий.
          output_config: { effort: "low" as const },
          // Если запрос упрётся в отказ классификатора, ответ доиграет
          // резервная модель, а не оборвётся посреди диалога с клиентом.
          betas: ["server-side-fallback-2026-07-01" as const],
          fallbacks: "default" as const,
        };

        const first = client.beta.messages.stream({ ...shared, messages });
        first.on("text", (delta) => push({ type: "text", value: delta }));
        const firstMessage = await first.finalMessage();

        if (firstMessage.stop_reason === "refusal") {
          push({ type: "refusal" });
          push({ type: "done", qualified: false });
          controller.close();
          return;
        }

        const toolUse = firstMessage.content.find(
          (block): block is Anthropic.Beta.BetaToolUseBlock =>
            block.type === "tool_use" && block.name === qualifyLeadTool.name,
        );

        if (!toolUse) {
          push({ type: "done", qualified: false });
          controller.close();
          return;
        }

        // ── Лид собран: считаем, сохраняем, отправляем ──────────────────────
        const lead = scoreLead(toolUse.input as QualifyToolInput, locale);

        // Сохранение и отправка не должны ронять диалог: если Supabase или
        // Telegram недоступны, посетитель всё равно получит внятный ответ,
        // а ошибка уйдёт в логи.
        let leadId: string | null = null;
        try {
          leadId = await saveLead(lead, history, "chat");
        } catch (error) {
          console.error("saveLead", error);
        }
        try {
          await sendLead(lead, history, leadId ?? "unsaved");
        } catch (error) {
          console.error("sendLead", error);
        }

        push({ type: "qualified", grade: lead.grade, priority: lead.priority });

        // Второй проход: отдаём модели результат инструмента, чтобы она
        // закрыла разговор человеческой фразой, а не оборвала его на вызове.
        const closing = client.beta.messages.stream({
          ...shared,
          messages: [
            ...messages,
            { role: "assistant", content: firstMessage.content },
            {
              role: "user",
              content: [
                {
                  type: "tool_result" as const,
                  tool_use_id: toolUse.id,
                  content: "Лид сохранён и передан менеджеру отдела продаж.",
                },
              ],
            },
          ],
        });

        closing.on("text", (delta) => push({ type: "text", value: delta }));
        await closing.finalMessage();

        push({ type: "done", qualified: true });
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
