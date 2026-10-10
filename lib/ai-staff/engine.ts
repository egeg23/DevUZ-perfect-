import type Anthropic from "@anthropic-ai/sdk";

import { replyProblems, tidyReply } from "@/lib/ai-staff/checks";
import { ASK_MANAGER } from "@/lib/ai-staff/copy";
import type { Lang } from "@/lib/ai-staff/lang";
import { buildSystemPrompt, knowledgeText, type PromptInput } from "@/lib/ai-staff/prompt";
import { contactIn } from "@/lib/qualify/contact";
import { anthropic } from "@/lib/model-road";
import { effortFor } from "@/lib/model-limits";

/**
 * Один ход ИИ-менеджера продаж: история разговора → ответ покупателю и,
 * если пора, заявка для человека.
 *
 * Отдельный слой от движка первички студии (lib/qualify/engine.ts): у того
 * свой промпт о студии, свой бриф и своя очередь менеджеров, и чат сайта
 * DevUz должен работать ровно как работал. Общие проверенные части взяты
 * оттуда же: контакт из переписки — кодом (contactIn), имя поставщика
 * модели — фильтром (findSelfTalk, через checks.ts), прощание с номером
 * заявки — шаблоном (copy.ts), а не вторым запросом к модели.
 *
 * Здесь нет ни базы, ни Telegram: вызов модели передаётся снаружи, поэтому
 * ход целиком проверяется тестом без сети.
 */

/** Кто говорит в разговоре. «human» — человек клиента, написавший сам. */
export type Turn = {
  role: "customer" | "ai" | "human";
  text: string;
  at?: string;
  /** Ответ ИИ не прошёл проверку, ушла безопасная фраза: в базе знаний не хватает ответа. */
  fallback?: boolean;
};

export type HandOff = {
  name: string;
  contact: string;
  need: string;
  budget: string;
  urgency: string;
  summary: string;
  reason: "contact" | "asked_human" | "order" | "complaint" | "unknown_answer";
};

const REASONS: HandOff["reason"][] = ["contact", "asked_human", "order", "complaint", "unknown_answer"];

export const HAND_OFF_TOOL = {
  name: "hand_off",
  description:
    "Передать заявку менеджеру компании. Вызывай, когда покупатель оставил контакт и понятно, что ему нужно; когда просит человека или звонок; хочет оформить заказ, запись или доставку; жалуется; или ждёт ответа, которого нет в базе знаний.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["name", "contact", "need", "budget", "urgency", "summary", "reason"],
    properties: {
      name: { type: "string", description: "Как зовут покупателя. Пусто, если не назвался." },
      contact: { type: "string", description: "Телефон или @ник, который покупатель оставил для связи. Пусто, если не оставил." },
      need: { type: "string", description: "Что нужно покупателю, одной фразой, с подробностями из разговора." },
      budget: { type: "string", description: "Бюджет словами покупателя. Пусто, если не говорил." },
      urgency: { type: "string", description: "Когда нужно: сегодня, на этой неделе, не срочно. Пусто, если неизвестно." },
      summary: { type: "string", description: "Резюме для менеджера в 2-4 предложения: что спрашивал, что ответил ИИ, что осталось решить." },
      reason: { type: "string", enum: REASONS, description: "Почему передаёшь." },
    },
  },
} as const;

export type ModelCall = (params: Anthropic.Beta.MessageCreateParamsNonStreaming) => Promise<Anthropic.Beta.BetaMessage>;

export type TurnInput = {
  prompt: PromptInput;
  history: readonly Turn[];
  lang: Lang;
  model: string;
  /** Метка расхода в model_usage: `saas-<id клиента>`. */
  site: string;
  /** Подмена вызова модели — для тестов. */
  call?: ModelCall;
};

export type TurnOutput = {
  /** Что уходит покупателю. Пусто — только если ИИ передал разговор без слов. */
  text: string;
  handoff: HandOff | null;
  /** Ответ модели не прошёл проверку дважды, и ушла безопасная фраза. */
  fallback: boolean;
  problems: string[];
};

const clip = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export function parseHandOff(input: unknown, history: readonly Turn[]): HandOff {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const reason = REASONS.includes(raw.reason as HandOff["reason"]) ? (raw.reason as HandOff["reason"]) : "contact";
  let contact = clip(raw.contact, 120);
  if (!contact) {
    // Контакт клиент пишет сам — найти его в репликах работа для кода.
    for (const turn of [...history].reverse()) {
      if (turn.role !== "customer") continue;
      const found = contactIn(turn.text);
      if (found) {
        contact = found.handle;
        break;
      }
    }
  }
  return {
    name: clip(raw.name, 120),
    contact,
    need: clip(raw.need, 600),
    budget: clip(raw.budget, 200),
    urgency: clip(raw.urgency, 200),
    summary: clip(raw.summary, 1500),
    reason,
  };
}

/** История для модели: покупатель — user, ИИ и человек клиента — assistant. */
export function toMessages(history: readonly Turn[]): Anthropic.Beta.BetaMessageParam[] {
  const out: Anthropic.Beta.BetaMessageParam[] = [];
  for (const turn of history) {
    const role = turn.role === "customer" ? "user" : "assistant";
    const text = turn.role === "human" ? `(ответил менеджер компании) ${turn.text}` : turn.text;
    const last = out[out.length - 1];
    if (last && last.role === role && typeof last.content === "string") {
      last.content = `${last.content}\n\n${text}`;
    } else {
      out.push({ role, content: text });
    }
  }
  // Первое сообщение должно быть от покупателя: приветствие ИИ, если оно
  // оказалось первым, модели не нужно — она знает его из промпта.
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

function defaultCall(site: string): ModelCall {
  const client = anthropic(site);
  return (params) => client.beta.messages.create(params);
}

/** Факты, против которых проверяются числа: база знаний и слова покупателя. */
export function factsFor(prompt: PromptInput, history: readonly Turn[]): string {
  return [
    prompt.company,
    knowledgeText(prompt.knowledge),
    ...history.filter((t) => t.role !== "ai").map((t) => t.text),
  ].join("\n");
}

/**
 * Покупатель пишет по-узбекски латиницей, а в ответ попали русские слова
 * кириллицей — из русского прайса («погон метр»). Живой прогон 10.10.2026
 * поймал ровно это. Имя компании и помощника из базы — их слова, их можно.
 */
export function cyrillicInLatin(reply: string, input: Pick<TurnInput, "lang" | "history" | "prompt">): string[] {
  if (input.lang !== "uz") return [];
  const lastCustomer = [...input.history].reverse().find((t) => t.role === "customer")?.text ?? "";
  if (/\p{Script=Cyrillic}/u.test(lastCustomer)) return [];
  const own = new Set(
    `${input.prompt.company} ${input.prompt.assistantName}`.toLowerCase().match(/\p{Script=Cyrillic}+/gu) ?? [],
  );
  return [...new Set((reply.toLowerCase().match(/\p{Script=Cyrillic}{3,}/gu) ?? []).filter((w) => !own.has(w)))];
}

export async function runSalesTurn(input: TurnInput): Promise<TurnOutput> {
  const call = input.call ?? defaultCall(input.site);
  const system = buildSystemPrompt(input.prompt);
  const facts = factsFor(input.prompt, input.history);
  const check = (reply: string) => {
    const found = replyProblems(reply, facts).map((p) => p.text);
    const cyr = cyrillicInLatin(reply, input);
    if (cyr.length) found.push(`ответ латиницей, а в нём русские слова кириллицей: ${cyr.join(", ")}; переведи их на узбекский латиницей`);
    return found;
  };
  const messages = toMessages(input.history);
  if (!messages.length) return { text: "", handoff: null, fallback: false, problems: ["нет сообщения покупателя"] };

  const ask = (extra: Anthropic.Beta.BetaMessageParam[]) =>
    call({
      model: input.model,
      max_tokens: 2048,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      tools: [HAND_OFF_TOOL as unknown as Anthropic.Beta.BetaToolUnion],
      messages: [...messages, ...extra],
      ...effortFor(input.model, "low"),
    });

  const read = (message: Anthropic.Beta.BetaMessage) => {
    const text = tidyReply(
      message.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n\n"),
    );
    const tool = message.content.find(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === HAND_OFF_TOOL.name,
    );
    return { text, handoff: tool ? parseHandOff(tool.input, input.history) : null };
  };

  const first = await ask([]);
  if (first.stop_reason === "refusal") {
    return { text: ASK_MANAGER[input.lang], handoff: null, fallback: true, problems: ["модель отказалась отвечать"] };
  }
  let { text, handoff } = read(first);
  let problems = text ? check(text) : [];

  if (problems.length) {
    // Второй заход с замечанием. Ответ модели в историю не кладём как
    // сказанный: покупатель его не видел.
    const retry = await ask([
      { role: "assistant", content: text },
      {
        role: "user",
        content: `Служебная проверка, не от покупателя: этот ответ не отправлен — ${problems.join("; ")}. Напиши ответ покупателю заново: только факты из базы знаний, без этих чисел. Если ответа в базе нет, скажи, что уточнишь у менеджера, и предложи оставить контакт.`,
      },
    ]);
    if (retry.stop_reason !== "refusal") {
      const again = read(retry);
      const againProblems = again.text ? check(again.text) : ["пустой ответ"];
      if (!againProblems.length) {
        return { text: again.text, handoff: handoff ?? again.handoff, fallback: false, problems };
      }
      problems = [...problems, ...againProblems];
      handoff = handoff ?? again.handoff;
    }
    return { text: ASK_MANAGER[input.lang], handoff, fallback: true, problems };
  }

  if (!text && !handoff) {
    return { text: ASK_MANAGER[input.lang], handoff: null, fallback: true, problems: ["модель не ответила"] };
  }
  return { text, handoff, fallback: false, problems };
}
