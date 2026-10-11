import type Anthropic from "@anthropic-ai/sdk";

import { replyProblems, tidyReply } from "@/lib/ai-staff/checks";
import { BLOGGER_MODEL, BLOGGER_SITE } from "@/lib/bloggers/judge";
import { programTerms, type PitchLang } from "@/lib/bloggers/rules";
import { anthropic } from "@/lib/model-road";
import { effortFor } from "@/lib/model-limits";
import { MODEL_SWITCH_DAYS, PARTNER_TIERS, REF_TTL_DAYS } from "@/lib/partners/rules";

/**
 * Один ход переписки агента с блогером — в Direct студии или в Telegram.
 *
 * Модель недорогая (BLOGGER_MODEL, Haiku): переписка с блогером — не живой
 * разговор с клиентом студии, для которого CLAUDE.md оставляет Opus.
 * Ответ проверяется теми же правилами, что ответы ИИ-продавца клиентам
 * сервиса (lib/ai-staff/checks.ts): чисел, которых нет в условиях программы
 * и в словах блогера, в ответе нет; промах — повтор с замечанием, второй
 * промах — безопасная фраза и разговор человеку.
 *
 * ИИ говорит, что он ИИ (docs/ai-staff/legal.md): первое сообщение агента в
 * разговоре называет его ИИ-помощником студии; на «ты бот?» — да.
 */

export const INTENTS = ["question", "interested", "agree", "decline", "stats_sent", "human", "other"] as const;
export type Intent = (typeof INTENTS)[number];

export type Line = { role: "blogger" | "agent" | "staff"; text: string };

export type AgentInput = {
  lang: PitchLang;
  name: string;
  history: readonly Line[];
  /** Агент уже назвал себя ИИ в этом разговоре. */
  disclosed: boolean;
  /** Что видно по скриншотам статистики, если их прислали. */
  audience: string | null;
  siteUrl: string;
};

export type AgentReply = { text: string; intent: Intent; checked: boolean };

/** Условия программы — единственные числа, которые агент может назвать. Из lib/partners/rules.ts. */
export function programFacts(lang: PitchLang, siteUrl: string): string {
  const t = programTerms();
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const tiers = PARTNER_TIERS.map((tier, i) => {
    const from = i === 0 ? "" : `от ${PARTNER_TIERS[i - 1].upTo} $ `;
    const to = tier.upTo === null ? "и дороже" : `до ${tier.upTo} $`;
    return `- проект ${from}${to}: ${tier.profit}% от прибыли или ${tier.turnover}% от суммы`;
  });
  return [
    `Студия DevUz (${host}): сайты, интернет-магазины и Telegram-боты для бизнеса в Узбекистане.`,
    "Партнёрская программа: блогер получает личную ссылку и рекомендует студию. Клиент пришёл по ссылке и оплатил проект — блогер получает процент с каждой оплаты.",
    `Две модели на выбор: от прибыли проекта (от ${t.profitFrom} до ${t.profitTo}%) или от суммы проекта (от ${t.turnoverFrom} до ${t.turnoverTo}%). Процент зависит от суммы проекта:`,
    ...tiers,
    `Модель можно менять не чаще раза в ${MODEL_SWITCH_DAYS} дней; она действует на новых клиентов.`,
    `Клиент закрепляется за блогером на ${REF_TTL_DAYS} дней после перехода по ссылке.`,
    `Выплата от ${t.minPayout} $.`,
    `Условия целиком: ${host}/${lang}/partners`,
  ].join("\n");
}

const TOOL = {
  name: "answer",
  description: "Ответ блогеру и что он хочет.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["text", "intent"],
    properties: {
      text: { type: "string", description: "Сообщение блогеру." },
      intent: {
        type: "string",
        enum: INTENTS,
        description:
          "question — спрашивает об условиях; interested — интересно, но не решил; agree — согласен участвовать; decline — отказ или просит не писать; stats_sent — прислал статистику; human — просит человека, звонок, договор или особые условия; other — другое.",
      },
    },
  },
} as const;

export function systemPrompt(input: AgentInput): string {
  const lang = input.lang === "uz" ? "по-узбекски, латиницей" : "по-русски";
  return `Ты ИИ-помощник студии DevUz. Переписываешься с блогером${input.name ? ` ${input.name}` : ""} о партнёрской программе студии.

Факты — единственное, что ты знаешь о студии и программе:
${programFacts(input.lang, input.siteUrl)}

Как писать:
- ${lang}, если блогер не перешёл на другой язык; коротко, 1-4 предложения, как живой человек в мессенджере. Без длинных тире, без списков и разметки.
- ${input.disclosed ? "Ты уже сказал, что ты ИИ-помощник. На вопрос «ты бот?» — честно да." : "Это твоё первое сообщение в разговоре: начни с того, что отвечает ИИ-помощник студии DevUz."}
- Числа и условия — только из фактов. Чего нет в фактах (особые условия, договор, сроки выплат, реклама за деньги), не обещай: скажи, что передашь команде, intent human.
- ${input.audience ? `Статистику блогер уже прислал: ${input.audience}. Второй раз не проси.` : "Если блогеру интересно, попроси скриншоты статистики Instagram: аудитория (города, возраст) и охват за 30 дней. Объясни просто: так мы поймём, подойдёт ли программа его аудитории."}
- Согласен участвовать — intent agree. Ссылку не придумывай: её пришлёт система следующим сообщением.
- Отказ или «не пишите» — вежливо попрощайся, intent decline.
Вызови answer один раз.`;
}

function transcript(history: readonly Line[]): Anthropic.Beta.BetaMessageParam[] {
  const out: Anthropic.Beta.BetaMessageParam[] = [];
  for (const line of history.slice(-12)) {
    const role = line.role === "blogger" ? "user" : "assistant";
    const text = line.text.trim() || "…";
    const last = out.at(-1);
    if (last && last.role === role && typeof last.content === "string") last.content = `${last.content}\n${text}`;
    else out.push({ role, content: text });
  }
  if (out[0]?.role === "assistant") out.unshift({ role: "user", content: "(начало переписки)" });
  if (out.at(-1)?.role === "assistant") out.push({ role: "user", content: "(блогер пока ничего не добавил)" });
  return out;
}

export const SAFE_REPLY: Record<PitchLang, string> = {
  ru: "Уточню у команды и вернусь с ответом.",
  uz: "Jamoadan aniqlab, javob bilan qaytaman.",
};

export type Call = (p: Anthropic.Beta.MessageCreateParamsNonStreaming) => Promise<Anthropic.Beta.BetaMessage>;

export async function agentTurn(input: AgentInput, call: Call = (p) => anthropic(BLOGGER_SITE).beta.messages.create(p)): Promise<AgentReply> {
  const facts = [programFacts(input.lang, input.siteUrl), ...input.history.filter((l) => l.role === "blogger").map((l) => l.text), input.audience ?? ""].join("\n");
  const messages = transcript(input.history);
  let remark: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await call({
      model: BLOGGER_MODEL,
      max_tokens: 700,
      system: systemPrompt(input),
      tools: [TOOL as unknown as Anthropic.Beta.BetaToolUnion],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: remark ? [...messages, { role: "user", content: `(проверка: ${remark}. Перепиши ответ без этого.)` }] : messages,
      ...effortFor(BLOGGER_MODEL, "low"),
    });
    const block = response.content.find((b) => b.type === "tool_use");
    const raw = (block && block.type === "tool_use" ? block.input : {}) as { text?: unknown; intent?: unknown };
    const text = tidyReply(typeof raw.text === "string" ? raw.text : "");
    const intent = (INTENTS as readonly string[]).includes(String(raw.intent)) ? (raw.intent as Intent) : "other";
    const problems = replyProblems(text, facts);
    if (!problems.length) return { text, intent, checked: true };
    remark = problems.map((p) => p.text).join("; ");
  }
  return { text: SAFE_REPLY[input.lang], intent: "human", checked: false };
}
