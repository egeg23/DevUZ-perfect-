import Anthropic from "@anthropic-ai/sdk";

import { company } from "@/content/company";
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

/** Запасной канал, который ассистент называет, если доставка не удалась. */
const SUPPORT_TELEGRAM = company.telegram;

/**
 * Потолок на ответ.
 *
 * Короткие реплики обеспечивает промпт, а не этот лимит: платим мы за
 * сгенерированное, а не за потолок, поэтому занижать его нечем оправдать.
 * Раньше здесь стояла тысяча — и это ломало продукт. Реплика в неё влезала,
 * а вызов инструмента квалификации — нет: пятнадцать полей, резюме из
 * восьми пунктов, заготовка первой фразы и два списка. Кириллица к тому же
 * стоит втрое дороже латиницы в токенах. Вызов обрывался на середине, в
 * поля попадали куски служебной разметки, и менеджер получал бриф с мусором
 * вместо имени.
 */
const MAX_TOKENS = 8192;

/** Диалог, который не сошёлся за столько реплик, не сойдётся и дальше. */
const MAX_TURNS = 22;
const MAX_MESSAGE_CHARS = 2000;

/**
 * Вычищает то, что модель дописать не успела.
 *
 * При обрыве генерации в строковые поля попадают обрывки служебной разметки
 * вызова инструмента. Отправлять их менеджеру нельзя: он увидит вместо имени
 * клиента фрагмент внутреннего формата и решит, что сломан весь бриф.
 * Подозрительное поле лучше очистить — пустое место читается как «не
 * выяснено», а это правда.
 */
function sanitizeToolInput(input: QualifyToolInput, truncated: boolean): QualifyToolInput {
  const broken = (value: unknown): boolean =>
    typeof value === "string" && /<\/?(antml|parameter)|<parameter\s/i.test(value);

  const clean = (value: string | undefined): string =>
    !value || broken(value) ? "" : value;

  const cleanList = (list: string[] | undefined): string[] =>
    (list ?? []).filter((item) => typeof item === "string" && item.trim() && !broken(item));

  const summary = { ...input.summary };
  for (const key of Object.keys(summary) as Array<keyof typeof summary>) {
    summary[key] = clean(summary[key]);
  }

  const notes = [clean(input.notes)];
  if (truncated) {
    // Менеджер должен знать, что картина может быть неполной, — иначе он
    // поедет к клиенту с ложной уверенностью.
    notes.push(
      "⚠️ Квалификация оборвалась на середине: часть полей может быть пустой. Уточните недостающее в первом же сообщении.",
    );
  }

  return {
    ...input,
    contact_name: clean(input.contact_name),
    company: clean(input.company),
    contact_handle: clean(input.contact_handle),
    niche: clean(input.niche),
    summary,
    notes: notes.filter(Boolean).join(" "),
    opening_line: clean(input.opening_line),
    already_told: cleanList(input.already_told),
    avoid_asking: cleanList(input.avoid_asking),
  };
}

/**
 * Недавно отправленные лиды — защита от повторной отправки.
 *
 * Флаг от клиента ловит обычный случай, но не переживает перезагрузку
 * страницы: человек обновит вкладку, продолжит разговор, и менеджер получит
 * второй бриф. Ключ — контакт, потому что именно по нему менеджер и пишет:
 * два брифа с одним контактом означают, что клиенту напишут дважды.
 *
 * Память процесса, как и у лимитера частоты: на нескольких инстансах защита
 * получается мягкой, но дублей от одного посетителя это не пропускает.
 */
const recentLeads = new Map<string, number>();
const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

function isDuplicate(input: QualifyToolInput): boolean {
  const handle = (input.contact_handle || "").trim().toLowerCase();
  if (!handle) return false;

  const now = Date.now();
  const seen = recentLeads.get(handle);
  if (seen && now - seen < DEDUPE_WINDOW_MS) return true;

  recentLeads.set(handle, now);
  if (recentLeads.size > 2000) {
    for (const [key, at] of recentLeads) {
      if (now - at >= DEDUPE_WINDOW_MS) recentLeads.delete(key);
    }
  }
  return false;
}

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

  let body: { messages?: unknown; locale?: unknown; qualified?: unknown };
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

      // Ответ модели может складываться из двух запросов подряд. Между ними
      // нужен разрыв абзаца, иначе фразы склеиваются без пробела и выглядят
      // как сбой вёрстки: «…под вашу ситуацию.Ваш запрос уже у менеджера».
      let emittedText = false;
      const pushText = (value: string) => {
        push({ type: "text", value });
        if (value.trim()) emittedText = true;
      };

      // Разрыв вставляется один раз на продолжение, а не на каждую порцию
      // текста: поток приходит десятками мелких кусков, и общий флаг здесь
      // не годится — он поднимается обратно первым же куском.
      const continuation = () => {
        let inserted = false;
        return (value: string) => {
          if (!inserted) {
            inserted = true;
            if (emittedText && value.trim()) push({ type: "text", value: "\n\n" });
          }
          pushText(value);
        };
      };

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
        first.on("text", pushText);
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

        // Модель иногда вызывает инструмент повторно — например, когда
        // следующая реплика клиента почти дублирует предыдущую. Отправить
        // второй бриф по тому же человеку хуже, чем не отправить ничего:
        // двое менеджеров возьмут одного клиента и напишут ему оба.
        if (alreadyQualified || isDuplicate(toolUse.input as QualifyToolInput)) {
          const repeat = client.beta.messages.stream({
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
                    content:
                      "Этот лид уже передан менеджеру ранее в этом же разговоре. Повторно ничего не отправляй. Просто подтверди коротко, что запрос у менеджера, и при необходимости ответь на вопрос клиента.",
                  },
                ],
              },
            ],
          });
          repeat.on("text", continuation());
          try {
            await repeat.finalMessage();
          } catch (error) {
            console.error("repeat message", error);
          }
          push({ type: "done", qualified: true });
          controller.close();
          return;
        }

        // Обрыв по лимиту токенов означает, что аргументы инструмента
        // дописаны не полностью. Строгая схема тут не спасает: она следит за
        // формой, а не за тем, что генерация доехала до конца.
        const truncated = firstMessage.stop_reason === "max_tokens";
        if (truncated) {
          console.error("qualify_lead обрезан по max_tokens", { locale });
        }

        // ── Лид собран: считаем, сохраняем, отправляем ──────────────────────
        const lead = scoreLead(
          sanitizeToolInput(toolUse.input as QualifyToolInput, truncated),
          locale,
        );

        // Сохранение и отправка не должны ронять диалог: если Supabase или
        // Telegram недоступны, посетитель всё равно получит внятный ответ,
        // а ошибка уйдёт в логи.
        let leadId: string | null = null;
        try {
          leadId = await saveLead(lead, history, "chat");
        } catch (error) {
          console.error("saveLead", error);
        }

        let delivered = false;
        try {
          delivered = await sendLead(lead, history, leadId ?? "unsaved");
        } catch (error) {
          console.error("sendLead", error);
        }

        // Лид потерян, только если не сработало ни одно из двух: в базе его
        // найдут даже без уведомления, а уведомление дойдёт даже без базы.
        const lost = !delivered && !leadId;
        if (lost) {
          console.error("lead lost: neither stored nor delivered", {
            grade: lead.grade,
            contact: lead.contact_handle,
          });
        }

        push({
          type: "qualified",
          grade: lead.grade,
          priority: lead.priority,
          delivered: !lost,
        });

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
                  // Модели сообщается фактический исход, а не желаемый.
                  // Сказать «передал менеджеру», когда доставка не удалась,
                  // значит отпустить клиента в уверенности, что им займутся,
                  // — и потерять его молча.
                  content: lost
                    ? `Заявку не удалось ни сохранить, ни доставить менеджеру. Не утверждай, что она передана. Коротко извинись и попроси написать напрямую в Telegram @${SUPPORT_TELEGRAM} — так запрос точно не потеряется.`
                    : delivered
                      ? "Лид сохранён и передан менеджеру отдела продаж."
                      : `Лид сохранён, но уведомление менеджеру сейчас не ушло. Скажи, что заявку принял, и на всякий случай дай наш Telegram @${SUPPORT_TELEGRAM} для прямой связи.`,
                },
              ],
            },
          ],
        });

        closing.on("text", continuation());

        try {
          await closing.finalMessage();
        } catch (error) {
          // Заявка на этот момент уже у менеджера. Показывать посетителю
          // ошибку значит сообщить, что всё сломалось, когда сломалась лишь
          // прощальная фраза — человек уйдёт и напишет второй раз или не
          // напишет вовсе. Отдаём подтверждение и закрываем разговор.
          console.error("closing message", error);
          push({ type: "closing_failed" });
        }

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
