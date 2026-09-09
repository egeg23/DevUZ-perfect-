import Anthropic from "@anthropic-ai/sdk";

/**
 * Разбор сообщений, переживших дешёвый отсев.
 *
 * Модель здесь решает единственный вопрос, который регулярным выражением
 * не решается: человек просит работу или разговаривает о ней. «Кто-нибудь
 * пробовал Flutter для маркетплейса?» и «нужен маркетплейс на Flutter»
 * состоят почти из одних и тех же слов.
 *
 * Разбирается пачка сообщений за один запрос, а не по одному. Чат отдаёт
 * их порциями, и десять отдельных запросов вместо одного — это десятикратная
 * задержка и десятикратная плата за один и тот же системный промпт.
 */

const MODEL = process.env.SCOUT_MODEL || process.env.ANTHROPIC_MODEL || "claude-opus-5";

/** Больше двадцати в пачке — и ответ начинает упираться в предел длины. */
export const BATCH_SIZE = 20;

export type ScoutCandidate = {
  /** Ключ, по которому ответ модели сопоставляется с исходным сообщением. */
  key: string;
  text: string;
  chatTitle?: string | null;
};

export type ScoutVerdict = {
  key: string;
  /** Насколько это похоже на настоящий запрос на разработку, 0–100. */
  score: number;
  /** Что именно человеку нужно: сайт, магазин, приложение, автоматизация. */
  category: string;
  /** Одна фраза для оператора — почему это стоит его времени. */
  rationale: string;
};

const SYSTEM = `Ты отбираешь из сообщений публичных чатов те, где человек ищет
исполнителя на разработку: сайт, интернет-магазин, мобильное приложение,
автоматизацию, интеграции, бота.

Что считать запросом:
— человек описывает свою задачу и ищет, кто её сделает;
— спрашивает цену или сроки на такую работу;
— просит порекомендовать исполнителя.

Что запросом не считать, даже если тема совпала:
— человек сам предлагает услуги, ищет заказы или работу;
— обсуждение технологий, инструментов и чужих проектов без своей задачи;
— вакансия в штат: это наём, а не заказ студии;
— пересказ новости, реклама курсов, поиск сотрудника.

Оценка 0–100 — насколько уверенно это запрос. Ставь высокую оценку только
там, где видна своя задача и намерение её отдать. Сомневаешься — ставь
низкую: оператор смотрит ленту руками, и лишний шум в ней стоит дороже,
чем пропущенный слабый сигнал.

rationale — одна короткая фраза по-русски о том, что человеку нужно.
Не пересказывай сообщение целиком.`;

const TOOL = {
  name: "scout_verdicts",
  description: "Вердикты по каждому сообщению пачки.",
  input_schema: {
    type: "object" as const,
    properties: {
      verdicts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            key: { type: "string" },
            score: { type: "integer", minimum: 0, maximum: 100 },
            category: {
              type: "string",
              enum: ["сайт", "магазин", "приложение", "автоматизация", "другое"],
            },
            rationale: { type: "string", maxLength: 200 },
          },
          required: ["key", "score", "category", "rationale"],
        },
      },
    },
    required: ["verdicts"],
  },
};

/**
 * Разбирает пачку. Возвращает пустой массив при любой беде: скаут не
 * должен падать из-за недоступной модели — сообщения никуда не денутся,
 * следующий проход разберёт их снова.
 */
export async function classify(batch: ScoutCandidate[]): Promise<ScoutVerdict[]> {
  if (!batch.length) return [];
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("scout: нет ключа модели — разбор пропущен");
    return [];
  }

  const client = new Anthropic();

  const payload = batch
    .slice(0, BATCH_SIZE)
    .map((item) =>
      [
        `[${item.key}]`,
        item.chatTitle ? `чат: ${item.chatTitle}` : "",
        item.text.replace(/\s+/g, " ").slice(0, 1200),
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n---\n\n");

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2048,
      // Системный промпт неизменен от пачки к пачке — самая тяжёлая часть
      // запроса, и платить за неё каждый раз незачем.
      system: [
        {
          type: "text" as const,
          text: SYSTEM,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [{ role: "user" as const, content: payload }],
      tools: [TOOL as unknown as Anthropic.Beta.BetaToolUnion],
      tool_choice: { type: "tool", name: TOOL.name },
      // Отбор — не рассуждение: решение принимается по самому тексту, а
      // задержка здесь копится на каждой пачке.
      output_config: { effort: "low" as const },
    });

    const call = response.content.find((block) => block.type === "tool_use");
    if (!call || call.type !== "tool_use") return [];

    const raw = (call.input as { verdicts?: unknown }).verdicts;
    if (!Array.isArray(raw)) return [];

    // Ответ модели проверяется, а не принимается на веру: ключ, которого
    // не было в пачке, означал бы сигнал, привязанный к чужому сообщению.
    const known = new Set(batch.map((item) => item.key));

    return raw
      .filter((item): item is ScoutVerdict => {
        if (!item || typeof item !== "object") return false;
        const v = item as Record<string, unknown>;
        return (
          typeof v.key === "string" &&
          known.has(v.key) &&
          typeof v.score === "number" &&
          v.score >= 0 &&
          v.score <= 100 &&
          typeof v.category === "string" &&
          typeof v.rationale === "string"
        );
      })
      .map((item) => ({
        key: item.key,
        score: Math.round(item.score),
        category: item.category.slice(0, 40),
        rationale: item.rationale.slice(0, 200),
      }));
  } catch (error) {
    console.error("scout: разбор не удался", error);
    return [];
  }
}
