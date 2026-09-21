/**
 * Спросить у модели, чем занимается компания, и какими словами это назвать.
 *
 * Отдельным файлом от правил: правила читают и публичные страницы разборов,
 * а тащить в их сборку SDK ради того, что случается раз в сутки, незачем.
 *
 * Зовётся только когда каталог и прежние разборы не помогли. То есть на
 * сайт, который до этого молча выбрасывался.
 */
import Anthropic from "@anthropic-ai/sdk";

import type { Niche } from "@/content/razbor/catalog";
import { effortFor } from "@/lib/model-limits";
import { parseNiche } from "@/lib/razbor/niche-words";

/**
 * Определить род занятий по заголовкам — не та работа, за которую стоит
 * платить как за статью. Отдельный ключ, и по умолчанию Sonnet: разбор
 * пишется дорогой моделью, а это один короткий ответ на сайт.
 */
const MODEL = process.env.RAZBOR_NICHE_MODEL || "claude-sonnet-5";

const TOOL = {
  name: "nisha",
  description: "Род занятий бизнеса и формы слов для заголовка страницы.",
  input_schema: {
    type: "object",
    properties: {
      key: { type: "string", description: "Короткое латинское имя ниши: logistika, avtoshkola, tipografiya." },
      ruGen: { type: "string", description: "Родительный падеж для «сайт для …»: «автошколы», «типографии»." },
      ruLabel: { type: "string", description: "Как называем сам бизнес: «автошкола», «типография»." },
      uz: { type: "string", description: "Узбекский корень запроса, латиницей: «avtomaktab»." },
      uzLabel: { type: "string", description: "Узбекское название бизнеса, латиницей." },
      ruMock: { type: "string", description: "Нейтральное имя для макета: «Автошкола». Без названия компании." },
      uzMock: { type: "string", description: "То же по-узбекски, латиницей." },
      ruServices: { type: "array", items: { type: "string" }, description: "Три-четыре услуги, которые есть у любого такого бизнеса." },
      uzServices: { type: "array", items: { type: "string" }, description: "Те же услуги по-узбекски, латиницей." },
    },
    required: ["key", "ruGen", "ruLabel", "uz", "uzLabel", "ruMock", "uzMock", "ruServices", "uzServices"],
  },
} as const;

const SYSTEM = `Ты определяешь род занятий компании по заголовкам страниц её сайта и даёшь формы слов для заголовка статьи.

Правила:

- Род занятий — категория, а не компания. «Автошкола», а не «Автошкола Лидер». Имени компании в ответе быть не должно нигде.
- Категория обычная и узнаваемая: так, как человек искал бы такой бизнес в поиске. Не «комплексные решения в области логистики», а «логистическая компания».
- ruGen — родительный падеж, чтобы подставить в «сайт для …»: автошколы, типографии, ветеринарной клиники.
- Узбекские поля — латиницей. Это отдельный язык поиска, а не транслит русского слова.
- Услуги — то, что есть у любого такого бизнеса. Без цифр, без обещаний, без превосходных степеней.

Если по заголовкам род занятий не понятен, не угадывай: верни key «neponyatno» и пустые поля.`;

/**
 * Спросить у модели нишу по заголовкам страниц сайта.
 *
 * Заголовки, а не разметка целиком: их уже собрал обход касания, они
 * короткие, и род занятий в них виден лучше, чем в килобайтах вёрстки.
 * Возвращает null молча — сайт просто пойдёт мимо, как и раньше.
 */
export async function inventNiche(input: {
  url: string;
  title: string | null;
  hints: readonly string[];
}): Promise<Niche | null> {
  const hints = input.hints.map((hint) => hint.trim()).filter(Boolean).slice(0, 24);
  if (!hints.length && !input.title) return null;

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      ...effortFor(MODEL, "low"),
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: [TOOL as unknown as Anthropic.ToolUnion],
      tool_choice: { type: "tool", name: "nisha" },
      messages: [
        {
          role: "user",
          content: [
            `Заголовок главной: ${input.title ?? "нет"}`,
            "Заголовки страниц сайта:",
            ...hints.map((hint) => `- ${hint}`),
          ].join("\n"),
        },
      ],
    });

    const use = message.content.find((block) => block.type === "tool_use");
    return use && use.type === "tool_use" ? parseNiche(use.input) : null;
  } catch {
    // Модель недоступна или без денег — это не авария смены: сайт уйдёт в
    // «ниша не определилась», ровно как до появления этой ветки.
    return null;
  }
}
