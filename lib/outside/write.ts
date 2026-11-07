import type Anthropic from "@anthropic-ai/sdk";

import type { OutsideTopic } from "@/content/outside-topics";
import { anthropic } from "@/lib/model-road";
import {
  PLATFORM,
  allowedLinks,
  caseFacts,
  outsideProblems,
  topicCases,
  type OutsideText,
  type Platform,
} from "@/lib/outside/posts";

/**
 * Черновик статьи на площадку — модель пишет, код проверяет.
 *
 * Модель — недорогая, как у статей сайта (правило владельца, 04.10.2026:
 * «Не используй сильно дорогую модель»): по готовой теме, готовым фактам и
 * готовому списку ссылок. Своя переменная OUTSIDE_MODEL, иначе та же, что
 * у статей о маркетинге. До трёх попыток: провал проверки возвращается
 * модели её же словами.
 */

export const OUTSIDE_MODEL = process.env.OUTSIDE_MODEL || process.env.ARTICLE_MODEL || "claude-haiku-4-5";

const TOOL = {
  name: "draft",
  description: "Черновик статьи для площадки.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Заголовок с поисковым запросом." },
      body: {
        type: "string",
        description: "Текст: абзацы через пустую строку, подзаголовки «## », пункты «• », ссылки «[текст](адрес)», жирный «**…**».",
      },
    },
    required: ["title", "body"],
  },
} as const;

const SYSTEM = `Ты пишешь статьи от лица DevUz Studio — веб-студии: сайты, интернет-магазины, приложения, ИИ-менеджеры в чате. В штате разработчики, у студии работы для клиентов из разных стран.

Статья выходит на чужой площадке (vc.ru, Дзен или Tenchat), и её читает владелец бизнеса. Цель — полезный текст, после которого человеку захочется посмотреть наши работы. Это не реклама: пользу видно, продажу нет.

Что нельзя ни при каких условиях:
- Придумывать факты, числа, сроки, цены, проценты, отзывы, имена, клиентов и результаты. О наших работах — только то, что сказано в фактах задания, своими словами. Если в фактах «макет» или «прототип» — так и пиши: «собрали макет», а не «запустили сайт» и не «клиент получил заявки».
- Суммы денег и проценты — нигде.
- Обещать результат: «гарантируем», «в N раз больше».
- Упоминать другие студии и агентства, ставить ссылки на чужие сайты.
- Длинное тире (—, –) и тире дефисом с пробелами. Вместо них — двоеточие, запятая, точка или другая фраза.
- Штампы нейросетей: «не просто …, а …», «погрузитесь в мир», «уникальный», «инновационный», «индивидуальный подход», «на новый уровень», «идеальное решение», «в самом сердце», «ключ к успеху», значки ✨🚀.

Как сдавать — инструментом draft:
- title — заголовок с поисковым запросом из задания, лучше ближе к началу, по-человечески, без кликбейта.
- body — текст. Абзацы через пустую строку. Подзаголовок — строка, которая начинается с «## ». Пункт списка — строка, которая начинается с «• » (не с дефиса). Ссылка — «[текст](адрес)», только на адреса из задания; текст ссылки — «DevUz Studio» или название проекта, не поисковая фраза. Жирный — «**…**», редко.
- Поисковый запрос стоит в заголовке и в первом абзаце, дальше 1–2 раза, без повторов ради повторов.

Тон: спокойный, конкретный, от первого лица студии («мы»), без восклицательных знаков и канцелярита.`;

export function draftPrompt(
  topic: OutsideTopic,
  platform: Platform,
  { related = [], notes = [] }: { related?: readonly string[]; notes?: readonly string[] } = {},
): string {
  const spec = PLATFORM[platform];
  const lines = [
    `Площадка: ${spec.name}.`,
    spec.style,
    `Длина текста: от ${spec.min} до ${spec.max} знаков. Заголовок: до ${spec.titleMax} знаков.${
      spec.headings[1] ? ` Подзаголовков «## »: от ${spec.headings[0]} до ${spec.headings[1]}.` : " Подзаголовков нет."
    }`,
    "",
    `Тема: ${topic.brief}`,
    `Поисковый запрос: «${topic.query}».`,
  ];
  if (related.length) {
    lines.push(
      "",
      `С этим запросом в России ищут ещё (Вордстат и Google Trends): ${related.map((r) => `«${r}»`).join(", ")}. Возьми 2–3 подходящих по смыслу и вставь естественно. Чужие по теме пропусти.`,
    );
  }
  const cases = topicCases(topic);
  if (cases.length) {
    lines.push("", "Факты о наших работах — единственное, что ты о них знаешь:");
    for (const c of cases) lines.push(...caseFacts(c).map((f) => `- ${f}`));
  } else {
    lines.push("", "Своих работ в этой статье не называй: фактов о них в задании нет. Пиши из опыта и здравого смысла, без статистики.");
  }
  lines.push(
    "",
    `Ссылки — от 1 до ${spec.links}, только эти адреса:`,
    ...allowedLinks(topic).map((l) => `- ${l.url} (${l.about})`),
  );
  if (notes.length) {
    lines.push("", "Прошлая попытка не прошла проверку:", ...notes.map((n) => `- ${n}`), "Напиши заново, исправив это.");
  }
  return lines.join("\n");
}

function parseDraft(input: unknown): OutsideText | null {
  const d = (input ?? {}) as { title?: unknown; body?: unknown };
  if (typeof d.title !== "string" || typeof d.body !== "string") return null;
  const title = d.title.replace(/\s+/g, " ").trim();
  const body = d.body.replace(/\r/g, "").trim();
  return title && body ? { title, body } : null;
}

/** Одна попытка: черновик или претензии к нему. */
async function attempt(
  topic: OutsideTopic,
  platform: Platform,
  related: readonly string[],
  notes: readonly string[],
): Promise<OutsideText | { problems: string[] }> {
  const message = await anthropic("outside-post").messages.create({
    model: OUTSIDE_MODEL,
    max_tokens: 6000,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [TOOL as unknown as Anthropic.Tool],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: draftPrompt(topic, platform, { related, notes }) }],
  });
  if (message.stop_reason === "max_tokens") return { problems: ["Текст обрезан по лимиту длины: пиши короче."] };
  const use = message.content.find((block) => block.type === "tool_use");
  if (!use || use.type !== "tool_use") return { problems: [`Модель не сдала черновик (stop_reason: ${message.stop_reason}).`] };
  const text = parseDraft(use.input);
  if (!text) return { problems: ["Нет заголовка или текста."] };
  const problems = outsideProblems(topic, platform, text);
  return problems.length ? { problems } : text;
}

/** До трёх попыток. Строка — почему черновика нет. */
export async function writeDraft(topic: OutsideTopic, platform: Platform, related: readonly string[]): Promise<OutsideText | string> {
  let notes: string[] = [];
  for (let i = 0; i < 3; i += 1) {
    const result = await attempt(topic, platform, related, notes);
    if (!("problems" in result)) return result;
    notes = result.problems;
  }
  return notes.join(" ");
}
