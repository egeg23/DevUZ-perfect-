import Anthropic from "@anthropic-ai/sdk";

import { talkLang } from "@/lib/talk/language";
import {
  REVIEW_SYSTEM,
  REVIEW_TOOL,
  cleanReview,
  outcomeOf,
  reviewPrompt,
  type Review,
} from "@/lib/talk/review";
import { saveReview, toReview } from "@/lib/talk/review-store";

/**
 * Надзиратель: проход по успокоившимся перепискам.
 *
 * Зовётся из того же свипа, что и ответы модели, — раз в пять минут. Разбор
 * дешевле разговора: он идёт после того, как всё кончилось, и торопиться
 * некуда.
 *
 * Модель здесь не та, что вела разговор. Не по соображениям качества — по
 * соображениям цены: разбор не пишут клиенту, ему не нужен ни тон, ни
 * осторожность, ему нужно вычитать факты из ленты. За это переплачивать
 * незачем.
 */
const MODEL = process.env.ANTHROPIC_REVIEW_MODEL || "claude-haiku-4-5-20251001";

export type ReviewRun = { looked: number; saved: number; errors: string[] };

export async function runReviews(limit = 5): Promise<ReviewRun> {
  const run: ReviewRun = { looked: 0, saved: 0, errors: [] };
  if (!process.env.ANTHROPIC_API_KEY) return run;

  let pending: Awaited<ReturnType<typeof toReview>>;
  try {
    pending = await toReview(limit);
  } catch (error) {
    run.errors.push(`очередь разборов: ${message(error)}`);
    return run;
  }

  for (const item of pending) {
    run.looked += 1;
    try {
      const turns = item.thread.filter((m) => m.direction === "in").length;
      const lang = talkLang(item.thread);
      const outcome = outcomeOf({
        aiHandling: item.aiHandling,
        handoverReason: item.handoverReason,
        turns,
      });

      const raw = await ask({
        host: item.host,
        niche: item.niche,
        lang,
        outcome,
        thread: item.thread,
      });

      await saveReview({
        prospectId: item.prospectId,
        leadId: item.leadId,
        lang,
        turns,
        outcome,
        // Уверенность и урок проверяются по длине разговора, а не по слову
        // модели: из одной реплики вывод сделать нельзя, а модель, которую
        // попросили, сделает.
        review: cleanReview(raw, turns, item.host),
      });
      run.saved += 1;
    } catch (error) {
      run.errors.push(`${item.host}: ${message(error)}`);
    }
  }
  return run;
}

async function ask(input: Parameters<typeof reviewPrompt>[0]): Promise<Partial<Review> | null> {
  const response = await new Anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 700,
    system: [{ type: "text" as const, text: REVIEW_SYSTEM, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user" as const, content: reviewPrompt(input) }],
    tools: [REVIEW_TOOL as unknown as Anthropic.Beta.BetaToolUnion],
    tool_choice: { type: "tool", name: REVIEW_TOOL.name },
  });

  const block = response.content.find((b) => b.type === "tool_use");
  return block && block.type === "tool_use" ? (block.input as Partial<Review>) : null;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
