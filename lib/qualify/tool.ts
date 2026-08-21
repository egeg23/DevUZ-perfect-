/**
 * Схема инструмента квалификации.
 *
 * `strict: true` вместе с `additionalProperties: false` и полным `required`
 * гарантирует, что аргументы придут ровно в этой форме. Без строгого режима
 * пришлось бы валидировать руками и решать, что делать с наполовину
 * заполненным лидом уже после того, как он ушёл в Telegram.
 */
export const qualifyLeadTool = {
  name: "qualify_lead",
  description:
    "Зафиксировать итог разговора: контакты, ICP-грейд ниши, экспертность студии, BANT и резюме по восьми пунктам. Вызывается один раз за диалог, когда картина сложилась или разговор завершается.",
  strict: true,
  input_schema: {
    type: "object" as const,
    properties: {
      contact_name: {
        type: "string",
        description: "Имя собеседника. Если не назвал — пустая строка.",
      },
      company: {
        type: "string",
        description: "Название компании. Если не назвал — пустая строка.",
      },
      contact_handle: {
        type: "string",
        description:
          "Телефон, Telegram или почта — то, что человек оставил для связи. Если контакта нет — пустая строка.",
      },
      niche: {
        type: "string",
        description: "Ниша и масштаб компании своими словами, одной фразой.",
      },
      niche_tier: {
        type: "integer",
        enum: [1, 2, 3],
        description: "Грейд ниши по ICP: 1 — высший приоритет, 3 — низший.",
      },
      expertise: {
        type: "string",
        enum: ["high", "medium", "low"],
        description: "Экспертность студии в нише клиента по библиотеке проектов.",
      },
      services: {
        type: "array",
        items: { type: "string" },
        description:
          "Слаги интересующих услуг: web-development, mobile-apps, ai-llm-rag, marketplace-delivery, integrations-automation.",
      },
      budget: { type: "string", enum: ["B1", "B2", "B3"] },
      authority: { type: "string", enum: ["A1", "A2", "A3"] },
      need: { type: "string", enum: ["N1", "N2", "N3"] },
      timing: { type: "string", enum: ["T1", "T2", "T3"] },
      intent: {
        type: "string",
        enum: [
          "interested",
          "exploring",
          "wants_discount",
          "needs_human",
          "not_interested",
        ],
        description:
          "Намерение поверх формальной квалификации. needs_human — прямая просьба поговорить с человеком, wants_discount — просит скидку.",
      },
      summary: {
        type: "object",
        description:
          "Резюме по восьми пунктам. Каждое поле — развёрнутая фраза, а не одно слово: менеджер читает только это.",
        properties: {
          client: { type: "string", description: "Имя лида и название компании." },
          request: {
            type: "string",
            description:
              "Какие услуги интересуют: что озвучил сам и что обсуждали дополнительно.",
          },
          niche: {
            type: "string",
            description:
              "Ниша, масштаб, платёжеспособность, потенциал долгосрочного сотрудничества.",
          },
          expertise: {
            type: "string",
            description: "Есть ли у студии схожие или смежные проекты, какие именно.",
          },
          budget: {
            type: "string",
            description: "Утверждён ли бюджет и какой. Если не выяснено — так и написать.",
          },
          authority: {
            type: "string",
            description: "С кем разговариваем и насколько он влияет на решение.",
          },
          need: {
            type: "string",
            description: "Насколько клиент понимает свои задачи, есть ли опыт.",
          },
          timing: {
            type: "string",
            description: "Когда нужен запуск и сколько времени на выбор подрядчика.",
          },
        },
        required: [
          "client",
          "request",
          "niche",
          "expertise",
          "budget",
          "authority",
          "need",
          "timing",
        ],
        additionalProperties: false,
      },
      notes: {
        type: "string",
        description:
          "Что важно знать менеджеру перед звонком: возражения, оговорки, настроение разговора.",
      },
    },
    required: [
      "contact_name",
      "company",
      "contact_handle",
      "niche",
      "niche_tier",
      "expertise",
      "services",
      "budget",
      "authority",
      "need",
      "timing",
      "intent",
      "summary",
      "notes",
    ],
    additionalProperties: false,
  },
};
