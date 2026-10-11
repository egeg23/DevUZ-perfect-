import type Anthropic from "@anthropic-ai/sdk";

import { anthropic } from "@/lib/model-road";
import { effortFor } from "@/lib/model-limits";

/**
 * Что за блог: темы, язык, город и подходит ли аудитория партнёрке студии.
 *
 * Недорогая модель (Haiku, BLOGGER_MODEL): работа — прочитать шапку и
 * подписи к постам и разложить по полям, а не писать текст. Владелец,
 * 04.10.2026: «Не используй сильно дорогую модель». Цифры оценки считает
 * код (lib/bloggers/rules.ts → scoreBlogger), модель их не трогает.
 */

export const BLOGGER_MODEL = process.env.BLOGGER_MODEL || "claude-haiku-4-5";
/** Метка расхода в model_usage: агент блогеров виден отдельной строкой. */
export const BLOGGER_SITE = "bloggers";

export type Judgement = {
  topics: string[];
  lang: "ru" | "uz" | "en" | "other";
  city: string;
  uzbekistan: boolean | null;
  fit: number;
  why: string;
};

const TOOL = {
  name: "judge_blogger",
  description: "Записать, о чём блог и подходит ли его аудитория.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["topics", "lang", "city", "uzbekistan", "fit", "why"],
    properties: {
      topics: { type: "array", maxItems: 4, items: { type: "string" }, description: "Темы блога, 1-3 слова каждая, по-русски." },
      lang: { type: "string", enum: ["ru", "uz", "en", "other"], description: "На каком языке ведёт блог." },
      city: { type: "string", description: "Город, если назван в шапке или постах. Нет — пустая строка." },
      uzbekistan: { type: "string", enum: ["yes", "no", "unknown"], description: "Живёт и пишет для Узбекистана." },
      fit: { type: "integer", minimum: 0, maximum: 10, description: "Насколько аудитория может заказать сайт или бота для бизнеса." },
      why: { type: "string", description: "Одна фраза по-русски: почему такая оценка." },
    },
  },
} as const;

const SYSTEM = `Ты помогаешь студии DevUz (сайты, интернет-магазины и Telegram-боты для бизнеса в Узбекистане) выбирать блогеров для партнёрской программы: блогер рекомендует студию и получает процент с проектов.
Прочитай шапку профиля и подписи к постам и оцени:
- темы блога;
- язык и город;
- живёт ли блогер в Узбекистане и пишет ли для местной аудитории;
- fit от 0 до 10: насколько среди его аудитории владельцы бизнеса, предприниматели, эксперты и те, кому нужен сайт или бот. Бизнес, маркетинг, SMM, IT, предпринимательство, эксперты с клиентами — высоко; развлечения, юмор, игры, школьники — низко.
Оценивай только по тексту. Не выдумывай того, чего в тексте нет. Вызови judge_blogger один раз.`;

export type JudgeInput = { handle: string; name: string; bio: string; captions: readonly string[] };

export function judgePrompt(b: JudgeInput): string {
  const captions = b.captions.slice(0, 8).map((c, i) => `${i + 1}. ${c.replace(/\s+/g, " ").slice(0, 300)}`);
  return [`Ник: @${b.handle}`, `Имя: ${b.name || "нет"}`, `Шапка: ${b.bio || "нет"}`, captions.length ? `Подписи к постам:\n${captions.join("\n")}` : "Подписей к постам нет."].join("\n");
}

export function judgementFrom(input: Record<string, unknown>): Judgement {
  const lang = input.lang === "ru" || input.lang === "uz" || input.lang === "en" ? input.lang : "other";
  const fit = Math.max(0, Math.min(10, Math.round(Number(input.fit) || 0)));
  return {
    topics: Array.isArray(input.topics) ? input.topics.map((t) => String(t).trim().slice(0, 40)).filter(Boolean).slice(0, 4) : [],
    lang,
    city: typeof input.city === "string" ? input.city.trim().slice(0, 60) : "",
    uzbekistan: input.uzbekistan === "yes" ? true : input.uzbekistan === "no" ? false : null,
    fit,
    why: typeof input.why === "string" ? input.why.trim().slice(0, 240) : "",
  };
}

export async function judgeBlogger(
  b: JudgeInput,
  call: (p: Anthropic.Beta.MessageCreateParamsNonStreaming) => Promise<Anthropic.Beta.BetaMessage> = (p) =>
    anthropic(BLOGGER_SITE).beta.messages.create(p),
): Promise<Judgement> {
  const response = await call({
    model: BLOGGER_MODEL,
    max_tokens: 600,
    system: SYSTEM,
    tools: [TOOL as unknown as Anthropic.Beta.BetaToolUnion],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: judgePrompt(b) }],
    ...effortFor(BLOGGER_MODEL, "low"),
  });
  const block = response.content.find((x) => x.type === "tool_use");
  return judgementFrom((block && block.type === "tool_use" ? block.input : {}) as Record<string, unknown>);
}
